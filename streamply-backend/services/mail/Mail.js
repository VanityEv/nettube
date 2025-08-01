import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { MAIL_USERNAME, MAIL_PASSWORD } = process.env;

// Log mail configuration status (without exposing credentials)
console.log('Mail configuration status:', {
  MAIL_USERNAME: MAIL_USERNAME ? '✓ Configured' : '✗ Missing',
  MAIL_PASSWORD: MAIL_PASSWORD ? '✓ Configured' : '✗ Missing'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
  debug: true, // Enable debug output
  logger: true // Enable logger
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Mail transporter configuration error:', error);
  } else {
    console.log('Mail transporter configured successfully');
  }
});

// Test function to send a simple email
const sendTestEmail = async (to) => {
  try {
    const info = await transporter.sendMail({
      from: MAIL_USERNAME,
      to: to,
      subject: 'Streamply Mail Test',
      html: '<p>This is a test email from Streamply. If you receive this, email is working!</p>'
    });
    console.log('Test email sent:', info);
    return { success: true, info };
  } catch (error) {
    console.error('Test email failed:', error);
    return { success: false, error };
  }
};

const sendConfirmationEmail = async (email, registerToken) => {
  // Validate inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    console.error('sendConfirmationEmail: Invalid email address provided:', email);
    return { success: false, error: 'Invalid email address' };
  }
  
  if (!registerToken || typeof registerToken !== 'string') {
    console.error('sendConfirmationEmail: Invalid register token provided:', registerToken);
    return { success: false, error: 'Invalid register token' };
  }

  // Check if mail credentials are available
  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    console.error('sendConfirmationEmail: Mail credentials not configured in environment variables');
    return { success: false, error: 'Mail credentials not configured' };
  }

  const mailOptions = {
    from: MAIL_USERNAME,
    to: email.trim(),
    subject: '🎉 Welcome to Streamply - Confirm Your Account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #007bff; margin: 0;">🎉 Welcome to Streamply!</h2>
            <h3 style="color: #333; margin: 10px 0 0 0;">You're almost ready to start streaming</h3>
          </div>
         
          <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 5px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #1976d2; text-align: center;"><strong>🔐 Account Activation Required</strong></p>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              Thank you for joining Streamply! To complete your registration and start enjoying unlimited streaming, please confirm your email address.
            </p>
            
            <a href="${'http://localhost:3000'}/confirm-register?token=${registerToken}" 
               style="display: inline-block; background: linear-gradient(45deg, #007bff, #0056b3); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 3px 10px rgba(0,123,255,0.3); transition: all 0.3s ease;">
              ✅ Confirm My Account
            </a>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">🚀 What's Next?</h4>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Browse thousands of movies and TV shows</li>
              <li style="margin: 5px 0;">Create your personalized watchlist</li>
              <li style="margin: 5px 0;">Enjoy high-quality streaming on any device</li>
            </ul>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; text-align: center;"><strong>⏰ This link expires in 24 hours</strong></p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't create this account, please ignore this email.<br>
              Need help? Contact us at support@streamply.com
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              This is an automated message from Streamply. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>`,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to: ' + email);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error };
  }
};

const sendPasswordResetMail = async (email, resetToken) => {
  // Validate inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    console.error('sendPasswordResetMail: Invalid email address provided:', email);
    return { success: false, error: 'Invalid email address' };
  }
  
  if (!resetToken || typeof resetToken !== 'string') {
    console.error('sendPasswordResetMail: Invalid reset token provided:', resetToken);
    return { success: false, error: 'Invalid reset token' };
  }

  // Check if mail credentials are available
  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    console.error('sendPasswordResetMail: Mail credentials not configured in environment variables');
    return { success: false, error: 'Mail credentials not configured' };
  }

  const mailOptions = {
    from: MAIL_USERNAME,
    to: email.trim(),
    subject: '🔒 Reset Your Streamply Password',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ff6b6b; margin: 0;">🔒 Password Reset Request</h2>
            <h3 style="color: #007bff; margin: 10px 0;">Streamply</h3>
          </div>
         
          <div style="background: #ffebee; border: 1px solid #ffcdd2; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #c62828; text-align: center;"><strong>🚨 Password Reset Requested</strong></p>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              We received a request to reset your Streamply account password. If this was you, click the button below to set a new password.
            </p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}" 
               style="display: inline-block; background: linear-gradient(45deg, #ff6b6b, #d32f2f); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 3px 10px rgba(255,107,107,0.3); transition: all 0.3s ease;">
              🔑 Reset My Password
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; text-align: center;"><strong>⏰ This link expires in 30 minutes</strong></p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">🛡️ Security Tips:</h4>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Choose a strong, unique password</li>
              <li style="margin: 5px 0;">Use a combination of letters, numbers, and symbols</li>
              <li style="margin: 5px 0;">Never share your password with anyone</li>
            </ul>
          </div>

          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;"><strong>🛡️ Security Notice:</strong> If you didn't request this password reset, your account may be compromised. Please contact our support team immediately.</p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this password reset, please ignore this email.<br>
              Need help? Contact us at support@streamply.com
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              This is an automated security message from Streamply. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>`,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to: ' + email);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};

// New device login alert with location and 2FA code
const sendNewDeviceAlert = async (email, deviceInfo, locationInfo, verificationCode) => {
  // Validate inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    console.error('sendNewDeviceAlert: Invalid email address provided:', email);
    return { success: false, error: 'Invalid email address' };
  }
  
  if (!verificationCode || typeof verificationCode !== 'string') {
    console.error('sendNewDeviceAlert: Invalid verification code provided:', verificationCode);
    return { success: false, error: 'Invalid verification code' };
  }

  // Check if mail credentials are available
  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    console.error('sendNewDeviceAlert: Mail credentials not configured in environment variables');
    return { success: false, error: 'Mail credentials not configured' };
  }

  const locationDisplay = locationInfo ? 
    `${locationInfo.city || 'Unknown City'}, ${locationInfo.region || 'Unknown Region'}, ${locationInfo.country || 'Unknown Country'}` : 
    'Unknown Location';
  
  const deviceDisplay = deviceInfo?.type || 'Unknown Device';
  const browserDisplay = deviceInfo?.browser || 'Unknown Browser';
  const osDisplay = deviceInfo?.os || 'Unknown OS';
  
  // Google Maps link for location
  const mapsLink = locationInfo?.lat && locationInfo?.lon ? 
    `https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lon}` : null;

  const mailOptions = {
    from: MAIL_USERNAME,
    to: email.trim(),
    subject: '🔒 New Device Login Detected - Verification Required',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #d73027; margin: 0;">🔒 Security Alert</h2>
            <h3 style="color: #007bff; margin: 10px 0;">Streamply</h3>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ New device login detected</strong></p>
          </div>

          <h4 style="color: #333; margin-bottom: 15px;">📍 Login Details:</h4>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Location:</strong> ${locationDisplay}</p>
            <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceDisplay}</p>
            <p style="margin: 5px 0;"><strong>Browser:</strong> ${browserDisplay}</p>
            <p style="margin: 5px 0;"><strong>Operating System:</strong> ${osDisplay}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${mapsLink ? `<p style="margin: 5px 0;"><a href="${mapsLink}" target="_blank" style="color: #007bff; text-decoration: none;">📍 View on Map</a></p>` : ''}
          </div>

          <div style="text-align: center; background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">Verification Code</h3>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1976d2; background: white; padding: 15px; border-radius: 5px; display: inline-block; border: 2px solid #1976d2;">
              ${verificationCode}
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Enter this code to confirm your login</p>
            <p style="margin: 5px 0 0 0; color: #ff6b6b; font-size: 14px;"><strong>⏰ Code expires in 10 minutes</strong></p>
          </div>

          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;"><strong>🛡️ Security Notice:</strong> If this wasn't you, your account may be compromised. Please change your password immediately and contact support.</p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #666; font-size: 14px;">This is an automated security message from Streamply. Do not reply to this email.</p>
          </div>
        </div>
      </div>`,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('New device alert email sent to: ' + email);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending new device alert email:', error);
    return { success: false, error };
  }
};

// Suspicious location login alert
const sendSuspiciousLocationAlert = async (email, locationInfo, deviceInfo) => {
  // Validate inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    console.error('sendSuspiciousLocationAlert: Invalid email address provided:', email);
    return { success: false, error: 'Invalid email address' };
  }

  // Check if mail credentials are available
  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    console.error('sendSuspiciousLocationAlert: Mail credentials not configured in environment variables');
    return { success: false, error: 'Mail credentials not configured' };
  }

  const locationDisplay = locationInfo ? 
    `${locationInfo.city || 'Unknown City'}, ${locationInfo.region || 'Unknown Region'}, ${locationInfo.country || 'Unknown Country'}` : 
    'Unknown Location';
  
  const deviceDisplay = deviceInfo?.type || 'Unknown Device';
  
  // Google Maps link for location
  const mapsLink = locationInfo?.lat && locationInfo?.lon ? 
    `https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lon}` : null;

  const mailOptions = {
    from: MAIL_USERNAME,
    to: email.trim(),
    subject: '🚨 Suspicious Login Activity Detected',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #dc3545; margin: 0;">🚨 Security Alert</h2>
            <h3 style="color: #007bff; margin: 10px 0;">Streamply</h3>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #721c24;"><strong>⚠️ Unusual login location detected</strong></p>
          </div>

          <h4 style="color: #333; margin-bottom: 15px;">📍 Login Details:</h4>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Location:</strong> ${locationDisplay}</p>
            <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceDisplay}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${mapsLink ? `<p style="margin: 5px 0;"><a href="${mapsLink}" target="_blank" style="color: #007bff; text-decoration: none;">📍 View on Map</a></p>` : ''}
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/security" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">🔒 Secure My Account</a>
          </div>

          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>💡 What to do:</strong></p>
            <ul style="color: #0c5460; margin: 10px 0;">
              <li>Change your password immediately if this wasn't you</li>
              <li>Check your account for any unauthorized activity</li>
              <li>Contact support if you suspect unauthorized access</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #666; font-size: 14px;">This is an automated security message from Streamply. Do not reply to this email.</p>
          </div>
        </div>
      </div>`,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Suspicious location alert email sent to: ' + email);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending suspicious location alert email:', error);
    return { success: false, error };
  }
};

export { sendConfirmationEmail, sendPasswordResetMail, sendTestEmail, sendNewDeviceAlert, sendSuspiciousLocationAlert };
