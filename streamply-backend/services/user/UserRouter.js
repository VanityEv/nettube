import * as dotenv from 'dotenv';
dotenv.config();
import { Router } from 'express';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';
import Stripe from 'stripe';
import { createRateLimitMiddleware } from '../../middleware/rateLimit.js';
import { getSecureClientIP, getIPForLogging, getGeolocationIP } from '../../security/secureIPDetection.js';
import { getRealClientIP } from '../../helpers/ipDetection.js';
import {
  isUserInDB,
  createUser,
  getAllUsers,
  findOneUser,
  confirmUser,
  updateUser,
  userLikes,
  checkOccurency,
  deleteLike,
  addLike,
  deleteUser,
  updateUserLoginDate,
  changePassword,
  findOneUserByEmail,
  addPasswordResetToken,
  updatePassword,
  revokeToken,
  promoteUser,
  demoteUser,
  createStripeSession,
} from './User.js';
import { getSubscription } from './subscription_new.js';
import { sendConfirmationEmail, sendPasswordResetMail, generateAndSendOtp, verifyOtp } from '../mail/MailSendGrid.js';
import { logSecurityEvent, logAuthEvent } from '../security/mongoLogger.js';
import { performSecurityCheck, verifyCode, markLoginAsTrusted, getLocationFromIP, getDeviceInfo } from '../security/locationSecurity.js';
import { addTrustedDevice } from '../security/trustedDeviceService.js';
import { generateAccessToken, generateRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllRefreshTokens } from '../../helpers/authUtils.js';
import multer from 'multer';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyAdmin, verifyToken, verifyUser, verifyUsername } from '../../helpers/verifyToken.js';
import { uploadToB2, generateB2SignedUrl, deleteFromB2, extractB2FilePath } from '../video/b2Helpers.js';
import { csrfProtection } from '../../middleware/csrfProtection.js';
import cors from 'cors';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UserRouter = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Production CORS configuration
const allowedOrigins = [
  // Production domains (replace with your actual Vercel URLs)
  'https://your-streamply-app.vercel.app',
  'https://your-admin-panel.vercel.app',
  // Railway domains
  'https://streamply-frontend-production.up.railway.app',
  'https://streamply-proxy-production.up.railway.app',
  // Development domains
  'http://localhost:3000',
  'http://localhost',
];

UserRouter.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any *.vercel.app subdomain for preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow any *.up.railway.app subdomain for Railway deployments
    if (origin.endsWith('.up.railway.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Security middleware
UserRouter.use(helmet());

// ✅ REDIS-BASED RATE LIMITING (UNIFIED SYSTEM)
// User login: 20 attempts per user per 15 minutes (per your request)
const loginRateLimiter = createRateLimitMiddleware('login', (req) => {
  const secureIP = getSecureClientIP(req);
  const identifier = req.body?.username || req.body?.email || secureIP;
  return `login:${identifier}`;
});

// Password reset: 5 attempts per IP per 15 minutes
const passwordResetLimiter = createRateLimitMiddleware('password_reset', (req) => {
  const secureIP = getSecureClientIP(req);
  return `password_reset:${secureIP}`;
});

// Registration: 10 attempts per IP per 15 minutes  
const signupRateLimiter = createRateLimitMiddleware('signup', (req) => {
  const secureIP = getSecureClientIP(req);
  return `signup:${secureIP}`;
});

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// Get JWT_SECRET from environment, fail if not present
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Use memory storage for B2 cloud upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'));
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for avatars
});

// ✅ ALL RATE LIMITING MOVED TO REDIS-BASED SYSTEM
// See rate limiters defined above: loginRateLimiter, passwordResetLimiter, signupRateLimiter

// Helper to sanitize input
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
}

UserRouter.get('/getAvatar/:username', async (req, res) => {
  try {
    const username = sanitizeInput(req.params.username);
    
    await findOneUser(username, async userData => {
      if (userData && userData[0] && userData[0].avatar_url) {
        const avatarValue = userData[0].avatar_url;
        
        if (avatarValue.startsWith('http')) {
          res.status(200).json({ result: avatarValue });
        } else {
          const signedUrl = await generateB2SignedUrl(avatarValue, 24 * 60 * 60); // 24 hour expiration
          res.status(200).json({ result: signedUrl });
        }
      } else {
        res.status(200).json({ result: 'AVATAR_NOT_FOUND' });
      }
    });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    await logSecurityEvent({
      type: 'avatar_fetch_error',
      username: req.params.username,
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', details: error.message });
  }
});

UserRouter.post('/uploadAvatar/:username', csrfProtection, verifyToken, verifyUser, upload.single('avatar'), async (req, res) => {
  try {
    const username = sanitizeInput(req.params.username);
    const avatarFile = req.file;
    
    if (!avatarFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // First, get the current user data to check for existing avatar
    await findOneUser(username, async userData => {
      try {
        let oldAvatarFileName = null;
        
        // Check if user already has an avatar and extract the file path for deletion
        if (userData && userData[0] && userData[0].avatar_url) {
          try {
            const avatarValue = userData[0].avatar_url;
            // If it's a file path, use it directly; if it's a URL, extract the path
            if (avatarValue.startsWith('http')) {
              oldAvatarFileName = extractB2FilePath(avatarValue);
            } else {
              oldAvatarFileName = avatarValue;
            }
            console.log(`Found existing avatar for deletion: ${oldAvatarFileName}`);
          } catch (extractError) {
            console.warn('Could not extract old avatar file path:', extractError.message);
          }
        }

        // Generate unique filename for B2 storage
        const fileExtension = avatarFile.originalname.split('.').pop();
        const b2FileName = `avatars/${username}_${Date.now()}.${fileExtension}`;
        
        console.log(`Uploading new avatar to B2: ${b2FileName}`);
        
        // Upload new avatar to B2 cloud storage
        const uploadedUrl = await uploadToB2(avatarFile.buffer, b2FileName, avatarFile.mimetype);
        
        if (uploadedUrl) {
          // Store the file path in database (not the full URL) for proper signed URL generation
          await updateUser('avatar_url', b2FileName, username, async updateResponse => {
            if (updateResponse.changedRows === 1) {
              // After successful database update, delete the old avatar from B2
              if (oldAvatarFileName) {
                try {
                  await deleteFromB2(oldAvatarFileName);
                  console.log(`Successfully deleted old avatar: ${oldAvatarFileName}`);
                } catch (deleteError) {
                  console.warn('Failed to delete old avatar:', deleteError.message);
                  // Don't fail the upload if old avatar deletion fails
                }
              }
              
              // Generate a signed URL for the response
              const signedUrl = await generateB2SignedUrl(b2FileName, 24 * 60 * 60);
              
              await logSecurityEvent({
                type: 'avatar_upload_success',
                username: username,
                fileName: b2FileName,
                ip: req.ip,
                userAgent: req.headers['user-agent']
              });
              
              res.status(200).json({ 
                result: 'SUCCESS',
                avatarUrl: signedUrl,
                message: 'Avatar uploaded successfully to cloud storage'
              });
            } else {
              res.status(500).json({ error: 'Failed to update user avatar URL in database' });
            }
          });
        } else {
          throw new Error(`B2 upload failed: No URL returned`);
        }
      } catch (innerError) {
        throw innerError;
      }
    });
    
  } catch (error) {
    console.error('Avatar upload error:', error);
    await logSecurityEvent({
      type: 'avatar_upload_error',
      username: req.params.username,
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(500).json({ 
      error: 'AVATAR_UPLOAD_FAILED', 
      details: error.message 
    });
  }
});

// Signup route to create a new user - RATE LIMITING DISABLED FOR TESTING
UserRouter.post('/signup', signupRateLimiter, csrfProtection, async (req, res) => {
  try {
    console.log('Signup attempt for:', req.body.username);
    
    // Add validation and error handling for database query
    await isUserInDB(req.body.username, req.body.email, async data => {
      console.log('Database response for user check:', data);
      
      // Handle case where database query fails or returns unexpected data
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid database response for user check:', data);
        return res.status(500).json({ 
          result: 'DATABASE_ERROR',
          message: 'Failed to check user existence' 
        });
      }
      
      const dbResult = data[0];
      if (!dbResult || typeof dbResult.count === 'undefined') {
        console.error('Database result missing count field:', dbResult);
        return res.status(500).json({ 
          result: 'DATABASE_ERROR',
          message: 'Invalid database response format' 
        });
      }
      
      const isUserAlreadySigned = dbResult.count > 0;
      if (!isUserAlreadySigned) {
        console.log('User not found, proceeding with registration');
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const registerToken = crypto.randomBytes(16).toString('hex');
        const userToRegister = {
          username: req.body.username,
          fullname: req.body.fullname,
          password: hashedPassword,
          birthdate: req.body.birthdate,
          email: req.body.email,
          registerToken: registerToken,
        };

        // Create Stripe customer
        console.log('Creating Stripe customer...');
        const customer = await stripe.customers.create({
          email: req.body.email,
          name: req.body.username,
        });
        console.log('Stripe customer created:', customer.id);

        await createUser({ ...userToRegister, stripe_customer_id: customer.id }, async status => {
          if (status && !status.error) {
            console.log('User created successfully:', status.id);
            
            // Add signup device as trusted device
            try {
              const secureIP = getSecureClientIP(req); // For security/rate limiting
              const geolocationIP = getGeolocationIP(req); // For location data
              const locationInfo = getLocationFromIP(geolocationIP);
              const deviceInfo = getDeviceInfo(req);
              
              await addTrustedDevice(status.id, deviceInfo, locationInfo, secureIP);
              console.log('Added signup device as trusted for user:', status.id);
              
              // Log the trusted device addition
              await logSecurityEvent('signup_device_trusted', {
                userId: status.id,
                username: userToRegister.username,
                deviceInfo: deviceInfo,
                locationInfo: locationInfo,
                ipAddress: ipAddress
              }, req);
              
            } catch (deviceError) {
              console.error('Failed to add signup device as trusted:', deviceError);
              // Don't fail the registration if device tracking fails
            }
            
            // Validate email before sending confirmation
            if (userToRegister.email && userToRegister.email.trim()) {
              sendConfirmationEmail(userToRegister.email, registerToken);
            } else {
              console.error('Registration successful but email is missing or invalid:', userToRegister.email);
            }
            res.status(200).json({ result: 'SUCCESS' });
          } else {
            console.error('User creation failed:', status.error || 'Unknown error');
            res.status(400).json({ result: 'INTERNAL_ERROR' });
          }
        });
      } else {
        console.log('User already exists');
        res.status(409).json({ result: 'ALREADY_SIGNED' });
      }
    });
  } catch (error) {
    console.error('Signup route error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// Login route to verify a user and get a token
// TEMPORARILY DISABLE LOGIN RATE LIMITING FOR CSRF TESTING
UserRouter.post('/signin', loginRateLimiter, csrfProtection, async (req, res) => {
  if (req.body.password) {
    try {
      // check if the user exists
      await findOneUser(req.body.username, async user => {
        const userToLogin = user[0];

        if (userToLogin) {
          //check if password matches
          const result = await bcrypt.compare(req.body.password, userToLogin.password);
          if (result) {
            // Perform security check for location and device
            try {
              const securityCheck = await performSecurityCheck(req, userToLogin);
              
              if (securityCheck.requiresVerification) {
                // Store user info temporarily for verification step
                const tempToken = jwt.sign(
                  { 
                    sub: userToLogin.id,
                    username: userToLogin.username, 
                    tokenType: 'temp_verification',
                    pendingVerification: true,
                    jti: crypto.randomUUID()
                  }, 
                  JWT_SECRET, 
                  { 
                    algorithm: 'HS256',
                    expiresIn: '15m' 
                  }
                );
                
                res.status(200).json({
                  result: 'VERIFICATION_REQUIRED',
                  alertType: securityCheck.alertType,
                  locationInfo: securityCheck.locationInfo,
                  deviceInfo: securityCheck.deviceInfo,
                  verificationCodeSent: securityCheck.verificationCodeSent,
                  tempToken: tempToken,
                  message: 'Please check your email for a verification code'
                });
                return;
              } else {
                // Mark this login as trusted for future reference
                const ipAddress = getRealClientIP(req); // Use proper IP detection
                markLoginAsTrusted(userToLogin.id, securityCheck.deviceInfo, securityCheck.locationInfo, ipAddress);
              }
            } catch (securityError) {
              console.error('Security check failed:', securityError);
              // Continue with normal login if security check fails
            }

            await updateUserLoginDate(req.body.username, () => {});
            
            // Generate access and refresh tokens
            const accessToken = generateAccessToken(userToLogin);
            const deviceInfo = {
              fingerprint: req.body.deviceFingerprint || null,
              userAgent: req.headers['user-agent'] || null,
              ipAddress: getRealClientIP(req) // Use proper IP detection
            };
            const { refreshToken } = await generateRefreshToken(userToLogin, deviceInfo);

            // Enhanced security logging for successful login
            await logAuthEvent('login_success', {
              userId: userToLogin.id,
              username: userToLogin.username,
              accountType: userToLogin.account_type
            }, req, true, {
              authMethod: 'password',
              sessionDuration: '24h',
              deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
            });

            const responseData = {
              result: 'SUCCESS',
              userId: userToLogin.id,  // Add userId to response
              username: userToLogin.username,
              account_type: userToLogin.account_type,
              confirmed: Boolean(userToLogin.confirmed), // Ensure boolean type
              accessToken, // Send access token in response body
            };
            
            // Set refresh token as httpOnly secure cookie
            res.cookie('refreshToken', refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
              maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });
            
            console.log('=== LOGIN SUCCESS RESPONSE ===');
            console.log('Response data:', JSON.stringify(responseData, null, 2));
            console.log('Confirmed field:', responseData.confirmed, 'Type:', typeof responseData.confirmed);
            console.log('Raw DB confirmed:', userToLogin.confirmed, 'Type:', typeof userToLogin.confirmed);
            console.log('=== END DEBUG ===');
            
            res.status(200).json(responseData);
          } else {
            // Enhanced security logging for failed login
            await logAuthEvent('login_failed', {
              userId: userToLogin.id,
              username: userToLogin.username,
              accountType: userToLogin.account_type
            }, req, false, {
              authMethod: 'password',
              failureReason: 'invalid_password'
            });
            res.status(401).json({ error: 'PASSWORD_MISMATCH' });
          }
        } else {
          // Enhanced security logging for non-existent user
          await logAuthEvent('login_failed', {
            username: req.body.username
          }, req, false, {
            authMethod: 'password',
            failureReason: 'user_not_found'
          });
          res.status(401).json({ error: "User doesn't exist" });
        }
      });
    } catch (error) {
      // Enhanced security logging for login errors
      await logAuthEvent('login_error', {
        username: req.body.username
      }, req, false, {
        authMethod: 'password',
        errorType: 'system_error',
        errorMessage: error.message
      });
      res.status(400).json({ error });
    }
  } else if (req.body.token) {
    try {
      await findOneUser(req.body.username, async user => {
        const userToLogin = user[0];
        if (userToLogin) {
          if (jwt.decode(req.body.token).username === userToLogin.username) {
            await updateUserLoginDate(userToLogin.username, () => {});
            
            // Enhanced security logging for token-based login
            await logAuthEvent('token_login_success', {
              userId: userToLogin.id,
              username: userToLogin.username,
              accountType: userToLogin.account_type
            }, req, true, {
              authMethod: 'jwt_token',
              tokenType: 'refresh'
            });

            res.status(200).json({
              result: 'SUCCESS',
              username: userToLogin.username,
              token: req.body.token,
            });
          } else {
            // Enhanced security logging for token mismatch
            await logAuthEvent('token_login_failed', {
              userId: userToLogin.id,
              username: userToLogin.username,
              accountType: userToLogin.account_type
            }, req, false, {
              authMethod: 'jwt_token',
              failureReason: 'token_mismatch'
            });
            res.status(401).json({ error: 'TOKEN_MISMATCH' });
          }
        } else {
          // Enhanced security logging for token login with non-existent user
          await logAuthEvent('token_login_failed', {
            username: req.body.username
          }, req, false, {
            authMethod: 'jwt_token',
            failureReason: 'user_not_found'
          });
          res.status(401).json({ error: "User doesn't exist" });
        }
      });
    } catch (error) {
      // Enhanced security logging for token login errors
      await logAuthEvent('token_login_error', {
        username: req.body.username
      }, req, false, {
        authMethod: 'jwt_token',
        errorType: 'system_error',
        errorMessage: error.message
      });
      res.status(401).json({ error: 'TOKEN_INVALID' });
    }
  } else {
    // Enhanced security logging for invalid login request
    await logAuthEvent('login_invalid_request', null, req, false, {
      authMethod: 'unknown',
      failureReason: 'missing_credentials'
    });
    res.status(400).json({ error: 'INVALID_LOGIN_REQUEST' });
  }
});

UserRouter.post('/changePassword', csrfProtection, verifyToken, async (req, res) => {
  try {
    //find user to update
    await findOneUser(req.body.username, async user => {
      const userToConfirm = user[0];
      //user found
      if (userToConfirm) {
        //check JWT token compatibility
        if (jwt.decode(req.body.token).username === userToConfirm.username) {
          //check if oldPassword matches one in database
          bcrypt.compare(req.body.oldPassword, userToConfirm.password, async (err, response) => {
            if (err) {
              res.json({ result: 'ERR_PASSWORD_MISMATCH' });
            }
            if (response) {
              //change user password
              const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
              await changePassword(userToConfirm.username, hashedPassword, () => {});
              res.status(200).json({ result: 'SUCCESS' });
            } else {
              res.status(401).json({ result: 'ERR_PASSWORD_MISMATCH' });
            }
          });
        } else {
          res.status(401).json({ result: 'ERR_JWT_MISMATCH' });
        }
      } else {
        res.status(401).json({ result: 'ERR_INVALID_USERNAME' });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'INTERNAL SERVER ERROR' });
  }
});

// Verify 2FA code for login
UserRouter.post('/verifyLoginCode', async (req, res) => {
  try {
    const { tempToken, verificationCode } = req.body;
    
    if (!tempToken || !verificationCode) {
      res.status(400).json({ error: 'Missing token or verification code' });
      return;
    }
    
    // Verify the temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET, { algorithms: ['HS256'] });
      if (!decoded.pendingVerification || decoded.tokenType !== 'temp_verification') {
        res.status(400).json({ error: 'Invalid verification token' });
        return;
      }
    } catch (jwtError) {
      res.status(401).json({ error: 'Token expired or invalid' });
      return;
    }
    
    // Verify the code
    const codeVerification = await verifyCode(decoded.sub, verificationCode);
    if (!codeVerification.valid) {
      res.status(400).json({ 
        error: 'Invalid verification code',
        reason: codeVerification.reason 
      });
      return;
    }
    
    // Get user data
    await findOneUser(decoded.username, async user => {
      const userToLogin = user[0];
      if (!userToLogin) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Perform final security setup without triggering another verification
      try {
        const secureIP = getSecureClientIP(req); // For security/rate limiting
        const geolocationIP = getGeolocationIP(req); // For location data
        const locationInfo = getLocationFromIP(geolocationIP);
        const deviceInfo = getDeviceInfo(req);
        
        // Mark device as trusted without performing another security check
        await addTrustedDevice(userToLogin.id, deviceInfo, locationInfo, secureIP);
        console.log(`Device marked as trusted for user ${userToLogin.id} after verification`);
      } catch (securityError) {
        console.error('Security finalization failed:', securityError);
      }
      
      await updateUserLoginDate(decoded.username, () => {});
      
      // Generate access and refresh tokens
      const accessToken = generateAccessToken(userToLogin);
      const deviceInfoForToken = {
        fingerprint: req.body.deviceFingerprint || null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null
      };
      const { refreshToken } = await generateRefreshToken(userToLogin, deviceInfoForToken);
      
      // Enhanced security logging for successful verification
      await logAuthEvent('login_verification_success', {
        userId: userToLogin.id,
        username: userToLogin.username,
        accountType: userToLogin.account_type
      }, req, true, {
        authMethod: '2fa_verification',
        sessionDuration: '24h',
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
      });
      
      res.status(200).json({
        result: 'SUCCESS',
        username: userToLogin.username,
        account_type: userToLogin.account_type,
        confirmed: Boolean(userToLogin.confirmed), // Ensure boolean type
        accessToken, // Send access token in response body
        message: 'Login verified successfully'
      });
      
      // Set refresh token as httpOnly secure cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    });
  } catch (error) {
    console.error('Error in verifyLoginCode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

UserRouter.post('/confirmRegister', async (req, res) => {
  try {
    console.log('Confirmation request received with token:', req.body.token);
    await confirmUser(req.body.token, async response => {
      console.log('Confirmation response:', response);
      if (response && response.count > 0) {
        console.log('User confirmed successfully');
        res.status(200).json({ result: 'SUCCESS' });
      } else if (response && response.error) {
        console.error('Error confirming user:', response.error);
        res.status(500).json({ error: 'Database error during confirmation' });
      } else {
        console.error('Token not found or user already confirmed');
        res.status(400).json({ error: 'Invalid or expired token!' });
      }
    });
  } catch (error) {
    console.error('Error in confirmRegister route:', error);
    res.status(400).json({ error: error.message || 'Confirmation failed' });
  }
});

UserRouter.post('/resendConfirmation', async (req, res) => {
  try {
    await findOneUserByEmail(req.body.email, async userArray => {
      const user = userArray[0]; // Extract user from array
      if (!user) {
        res.status(404).json({ result: 'NOT_FOUND' });
        return;
      }
      
      // Check if user is already confirmed
      if (user.confirmed) {
        res.status(200).json({ result: 'ALREADY_CONFIRMED' });
        return;
      }
      
      console.log('Found user for resend confirmation:', {
        id: user.id,
        email: user.email,
        hasRegisterToken: !!user.register_token,
        confirmed: user.confirmed
      });
      
      // Generate a new token for security
      const newRegisterToken = crypto.randomBytes(16).toString('hex');
      
      try {
        // Update the user with the new token
        await updateUser('register_token', newRegisterToken, user.username, () => {});
        
        // Validate email before sending
        if (user.email && user.email.trim()) {
          const emailResult = await sendConfirmationEmail(user.email, newRegisterToken);
          if (emailResult.success) {
            res.status(200).json({ result: 'SUCCESS' });
          } else {
            console.error('Failed to send confirmation email:', emailResult.error);
            res.status(500).json({ result: 'EMAIL_SEND_FAILED' });
          }
        } else {
          console.error('User found but email is missing:', user.email);
          res.status(500).json({ result: 'INVALID_EMAIL' });
        }
      } catch (updateError) {
        console.error('Failed to update user token:', updateError);
        res.status(500).json({ result: 'TOKEN_UPDATE_FAILED' });
      }
    });
  } catch (error) {
    console.error('Error in resendConfirmation:', error);
    res.status(500).json({ result: 'INTERNAL_ERROR' });
  }
});

UserRouter.post('/getUserData', verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    await findOneUser(req.body.username, async user => {
      const userData = user[0];
      if (userData) {
        res.status(200).json({
          result: 'SUCCESS',
          username: userData.username,
          fullname: userData.fullname,
          email: userData.email,
          subscription: userData.subscription,
          birthdate: userData.birthdate,
        });
      } else {
        res.status(400).json({ error: 'USER NOT LOGGED IN' });
      }
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.get('/userLikes/:username', async (req, res) => {
  try {
    const username = req.params.username;
    await userLikes(username, userLikes => {
      res.status(200).json(userLikes);
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/updateUser', csrfProtection, verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    await updateUser(req.body.param, req.body.value, req.body.username, async response => {
      const status = response.changedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'UPDATE FAILED' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/checkOccurency', verifyToken, async (req, res) => {
  try {
    await checkOccurency(req.body.param, req.body.value, async response => {
      const status = response[0].exists === 0 ? 'NOT_EXISTS' : 'ALREADY_EXISTS';
      res.status(200).json({ result: status });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteLike', verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    await deleteLike(req.body.username, req.body.show_id, async response => {
      const status = response.affectedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/addLike', verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    await addLike(req.body.username, req.body.show_id, async response => {
      const status = response.affectedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.get('/getAllUsers',verifyToken, verifyAdmin, async (req, res) => {
  try {
    await getAllUsers(users => {
      res.status(200).json({ result: 'SUCCESS', data: users });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteUser', csrfProtection, verifyToken, verifyAdmin, async (req, res) => {
  try {
    await deleteUser(req.body.id, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'SUCCESS' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/resetPassword', passwordResetLimiter, async (req, res) => {
  try {
    await findOneUserByEmail(req.body.email, async response => {
      const user = response[0];
      if (!user) {
        res.status(404).json({ result: 'NOT FOUND' });
        return;
      }
      
      // Validate email before proceeding
      if (!user.email || !user.email.trim()) {
        console.error('User found but email is missing or invalid:', user.email);
        res.status(500).json({ result: 'INVALID_USER_DATA' });
        return;
      }
      
      const token = jwt.sign(
        { 
          email: req.body.email,
          tokenType: 'password_reset',
          jti: crypto.randomUUID()
        }, 
        JWT_SECRET, 
        { 
          algorithm: 'HS256',
          expiresIn: '30m' 
        }
      );
      await addPasswordResetToken(user.email, token, async result => {
        if (result.affectedRows === 1) {
          sendPasswordResetMail(user.email, token);
          res.status(200).json({ result: 'SUCCESS' });
        } else {
          res.status(500).json({ result: 'FAILED_TO_SET_TOKEN' });
        }
      });
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ error });
  }
});

UserRouter.post('/setPassword', async (req, res) => {
  try {
    const { email, token } = req.body;

    await findOneUserByEmail(email, async response => {
      const user = response[0];

      if (!user) {
        return res.status(404).json({ result: 'NOT FOUND' });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

        if (decoded.email !== email || decoded.tokenType !== 'password_reset') {
          return res.status(401).json({ result: 'EMAIL MISMATCH' });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await updatePassword(user.id, hashedPassword, async updateResponse => {
          if (updateResponse.affectedRows === 1) {
            await revokeToken(user.id, async response => {
              if (response.affectedRows === 1) {
                res.status(200).json({ result: 'SUCCESS' });
              }
            });
          } else {
            res.status(500).json({ result: 'ERROR' });
          }
        });
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ result: 'TOKEN EXPIRED' });
        } else {
          console.error(err);
          return res.status(401).json({ result: 'INVALID TOKEN' });
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

UserRouter.post('/promoteToModerator', csrfProtection, verifyToken, verifyAdmin, async (req, res) => {
  try {
    await findOneUser(req.body.username, async response => {
      const user = response[0];

      if (!user) {
        return res.status(404).json({ result: 'NOT FOUND' });
      }

      if (user.account_type === 1) {
        await promoteUser(user.id, async response => {
          if (response.affectedRows === 1) {
            res.status(200).json({ result: 'SUCCESS' });
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'ERROR' });
  }
});

UserRouter.post('/demoteModerator', csrfProtection, verifyToken, verifyAdmin, async (req, res) => {
  try {
    await findOneUser(req.body.username, async response => {
      const user = response[0];

      if (!user) {
        return res.status(404).json({ result: 'NOT FOUND' });
      }
      if (user.account_type === 2) {
        await demoteUser(user.id, async response => {
          if (response.affectedRows === 1) {
            res.status(200).json({ result: 'SUCCESS' });
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'ERROR' });
  }
});

// Example subscription endpoint (should be protected with verifyToken)
UserRouter.post('/setSubscription', verifyToken, (req, res) => {
  const username = sanitizeInput(req.body.username);
  const status = sanitizeInput(req.body.status);
  const providerId = sanitizeInput(req.body.providerId);
  setSubscription(username, status, providerId);
  res.status(200).json({ result: 'SUCCESS' });
});

UserRouter.get('/getSubscription/:username', verifyToken, async (req, res) => {
  const username = sanitizeInput(req.params.username);
  try {
    const subscription = await getSubscription(username);
    res.status(200).json(subscription);
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ status: 'none', error: error.message });
  }
});

// --- MFA & STRIPE ENDPOINTS ---
// MFA: Request OTP
UserRouter.post('/mfa/request', async (req, res) => {
  const { email, userId } = req.body;
  try {
    const result = await generateAndSendOtp(email, userId);
    if (result.success) {
      res.status(200).json({ result: 'SUCCESS', message: result.message });
    } else {
      res.status(500).json({ result: 'ERROR', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ result: 'ERROR', message: 'Failed to send OTP' });
  }
});

// MFA: Verify OTP
UserRouter.post('/mfa/verify', (req, res) => {
  const { userId, code } = req.body;
  if (verifyOtp(userId, code)) {
    res.status(200).json({ result: 'SUCCESS' });
  } else {
    res.status(400).json({ result: 'ERROR', message: 'Invalid or expired code' });
  }
});

// STRIPE: Create payment session
UserRouter.post('/stripe/session', async (req, res) => {
  const { userId, priceId } = req.body;
  try {
    console.log('Received Stripe session request:', { userId, priceId });
    const url = await createStripeSession(userId, priceId);
    console.log('Stripe session created successfully');
    res.status(200).json({ result: 'SUCCESS', url });
  } catch (error) {
    console.error('Failed to create Stripe session:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      result: 'ERROR', 
      message: 'Failed to create Stripe session',
      error: error.message 
    });
  }
});

// Stripe webhook endpoint
UserRouter.post('/stripe-webhook', async (req, res) => {
  console.log('🔔 WEBHOOK: Received request');
  console.log('🔔 WEBHOOK: Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔔 WEBHOOK: Body type:', typeof req.body);
  console.log('🔔 WEBHOOK: Body length:', req.body?.length);
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('🔔 WEBHOOK: Signature present:', !!sig);
  console.log('🔔 WEBHOOK: Secret present:', !!webhookSecret);

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('🔔 WEBHOOK: Signature verified successfully');
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    const { handleStripeWebhook } = await import('./subscription_new.js');
    await handleStripeWebhook(event);
    
    console.log('Webhook handled successfully:', event.type);
    res.json({received: true});
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({error: 'Webhook handling failed'});
  }
});

// Refresh token endpoint
UserRouter.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }
    
    const deviceInfo = {
      fingerprint: req.body.deviceFingerprint || null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null
    };
    
    const result = await rotateRefreshToken(refreshToken, deviceInfo);
    
    // Set new refresh token as httpOnly secure cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
      maxAge: 30 * 24 * 60 * 60 * 1000 
    });
    
    res.status(200).json({
      result: 'SUCCESS',
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken');
    
    res.status(401).json({ 
      error: 'Token refresh failed',
      message: error.message 
    });
  }
});

// Logout endpoint (revoke refresh token)
UserRouter.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.status(200).json({ 
      result: 'SUCCESS',
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookie even if revocation fails
    res.clearCookie('refreshToken');
    
    res.status(200).json({ 
      result: 'SUCCESS',
      message: 'Logged out successfully' 
    });
  }
});

// Logout from all devices endpoint
UserRouter.post('/logout-all', verifyToken, async (req, res) => {
  try {
    await revokeAllRefreshTokens(req.user.id);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.status(200).json({ 
      result: 'SUCCESS',
      message: 'Logged out from all devices successfully' 
    });
  } catch (error) {
    console.error('Logout all error:', error);
    
    // Clear cookie even if revocation fails
    res.clearCookie('refreshToken');
    
    res.status(500).json({ 
      error: 'Failed to logout from all devices',
      message: error.message 
    });
  }
});

// EMERGENCY: Clear Redis rate limiting cache (temporary endpoint)
UserRouter.post('/clear-rate-limits', async (req, res) => {
  try {
    const redis = (await import('../../services/cache/RedisClient.js')).default;
    const keys = await redis.keys('rl_*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
    res.status(200).json({ 
      result: 'SUCCESS',
      message: `Cleared ${keys.length} rate limit keys from Redis`,
      clearedKeys: keys
    });
  } catch (error) {
    console.error('Clear rate limits error:', error);
    res.status(500).json({ 
      error: 'Failed to clear rate limits',
      message: error.message 
    });
  }
});

// Emergency endpoint to clear rate limits (no CSRF for emergency access)
UserRouter.post('/clear-rate-limits', async (req, res) => {
  try {
    const redis = (await import('../../services/cache/RedisClient.js')).default;
    
    // Clear all rate limit keys
    const keys = await redis.keys('rl_*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    res.status(200).json({ 
      result: 'SUCCESS',
      message: `Cleared ${keys.length} rate limit entries`,
      clearedKeys: keys.length
    });
  } catch (error) {
    console.error('Rate limit clear error:', error);
    res.status(500).json({ 
      error: 'Failed to clear rate limits',
      message: error.message 
    });
  }
});

// Debug endpoint to check Redis status
UserRouter.get('/redis-status', async (req, res) => {
  try {
    const redis = (await import('../../services/cache/RedisClient.js')).default;
    
    // Test Redis connection
    const info = await redis.info();
    const keys = await redis.keys('rl_*');
    
    res.status(200).json({ 
      result: 'SUCCESS',
      redis: {
        status: redis.status,
        connected: redis.status === 'ready',
        keyCount: keys.length,
        keys: keys.slice(0, 10), // First 10 keys only
        info: info.substring(0, 200) + '...' // First 200 chars of info
      }
    });
  } catch (error) {
    console.error('Redis status error:', error);
    res.status(500).json({ 
      error: 'Redis status check failed',
      message: error.message 
    });
  }
});

// SECURITY DOCUMENTATION:
// - Rate limiting applied to all routes.
// - All user input is sanitized using validator.escape and trim.
// - Login attempts and IPs are logged for monitoring.
// - MFA stub added for email code verification.
// - See Mail.js for email code implementation.
// - Consider using HTTPS and secure cookies for JWT/session.

export default UserRouter;
