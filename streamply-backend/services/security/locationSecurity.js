// Location-Based Security Service
import geoip from 'geoip-lite';
import crypto from 'crypto';
import { sendNewDeviceAlert, sendSuspiciousLocationAlert } from '../mail/MailSendGrid.js';
import { logSecurityEvent } from './mongoLogger.js';
import redis from '../cache/RedisClient.js';
import { 
  isDeviceTrusted, 
  addTrustedDevice, 
  updateDeviceUsage,
  generateDeviceFingerprint 
} from './trustedDeviceService.js';
import { getRealClientIP } from '../../helpers/ipDetection.js';

// In-memory store for verification codes (in production, use Redis)
const verificationCodes = new Map();
const userLocations = new Map(); // Store known locations per user

/**
 * Get location information from IP address
 */
export function getLocationFromIP(ipAddress) {
  try {
    // Handle localhost and private IPs
    if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      return {
        country: 'Local',
        region: 'Development',
        city: 'Localhost',
        lat: null,
        lon: null,
        isLocal: true
      };
    }

    const geo = geoip.lookup(ipAddress);
    if (!geo) {
      console.warn('Could not determine location for IP:', ipAddress);
      return {
        country: 'Unknown',
        region: 'Unknown', 
        city: 'Unknown',
        lat: null,
        lon: null,
        isLocal: false
      };
    }

    return {
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown',
      lat: geo.ll ? geo.ll[0] : null,
      lon: geo.ll ? geo.ll[1] : null,
      timezone: geo.timezone || 'Unknown',
      isLocal: false
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown', 
      lat: null,
      lon: null,
      isLocal: false
    };
  }
}

/**
 * Extract device information from user agent and headers
 */
export function getDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || '';
  const deviceFingerprint = req.headers['x-device-fingerprint'] || '';
  
  // Simple device detection (can be enhanced with a proper library)
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);
  
  let deviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  
  // Extract browser info
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Extract OS info
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  const deviceInfo = {
    type: deviceType,
    browser: browser,
    os: os,
    userAgent: userAgent,
    fingerprint: deviceFingerprint || generateDeviceFingerprint({
      browser, os, type: deviceType, userAgent
    }),
    isNewDevice: false // Will be determined by database check
  };
  
  return deviceInfo;
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store verification code with Redis (fallback to memory)
 */
export async function storeVerificationCode(userId, code, expiresIn = 10 * 60 * 1000) { // 10 minutes
  const expiresInSeconds = Math.floor(expiresIn / 1000);
  let storedInRedis = false;
  
  // Always store in memory as primary fallback
  const expiresAt = Date.now() + expiresIn;
  verificationCodes.set(userId, { code, expiresAt });
  console.log(`📝 Verification code stored in memory for user ${userId}: ${code} (expires in ${expiresIn/1000/60} minutes)`);
  
  // Try Redis as additional backup (but memory is primary)
  try {
    await redis.setex(`verification:${userId}`, expiresInSeconds, code);
    console.log(`✅ Verification code also stored in Redis for user ${userId} (expires in ${expiresInSeconds/60} minutes)`);
    storedInRedis = true;
  } catch (error) {
    console.warn('⚠️  Redis failed for verification code storage (using memory only):', error.message);
  }
  
  // Clean up expired codes from memory
  setTimeout(() => {
    verificationCodes.delete(userId);
  }, expiresIn);
  
  return { storedInRedis, storedInMemory: true };
}

/**
 * Verify a code for a user with Redis (fallback to memory)
 */
export async function verifyCode(userId, inputCode) {
  let storedCode = null;
  
  // Check memory first (primary storage)
  const stored = verificationCodes.get(userId);
  if (stored && Date.now() <= stored.expiresAt) {
    storedCode = stored.code;
    console.log(`📝 Found verification code in memory for user ${userId}`);
  } else if (stored && Date.now() > stored.expiresAt) {
    verificationCodes.delete(userId);
    console.log(`⏰ Verification code expired in memory for user ${userId}`);
    return { valid: false, reason: 'Code expired' };
  }
  
  // Try Redis as backup if not found in memory
  if (!storedCode) {
    try {
      storedCode = await redis.get(`verification:${userId}`);
      if (storedCode) {
        console.log(`✅ Found verification code in Redis for user ${userId}`);
      }
    } catch (error) {
      console.warn('⚠️  Redis failed for verification, memory only:', error.message);
    }
  }
  
  // No code found anywhere
  if (!storedCode) {
    console.log(`❌ No verification code found for user ${userId}`);
    return { valid: false, reason: 'No code found' };
  }
  
  // Verify the code
  if (storedCode !== inputCode) {
    console.log(`❌ Invalid verification code for user ${userId}. Expected: ${storedCode}, Got: ${inputCode}`);
    return { valid: false, reason: 'Invalid code' };
  }
  
  // Code is valid, remove it from both stores
  verificationCodes.delete(userId);
  try {
    await redis.del(`verification:${userId}`);
    console.log(`🗑️  Verification code removed from Redis for user ${userId}`);
  } catch (error) {
    console.warn('⚠️  Could not remove code from Redis:', error.message);
  }
  
  console.log(`✅ Verification code validated and removed for user ${userId}`);
  return { valid: true };
}

/**
 * Main security check function for login attempts
 */
export async function performSecurityCheck(req, user) {
  const ipAddress = getRealClientIP(req); // Use proper IP detection
  const userId = user.id;
  const userEmail = user.email;
  
  console.log(`Performing security check for user ${userId} from IP ${ipAddress}`);
  
  // Get location and device info
  const locationInfo = getLocationFromIP(ipAddress);
  const deviceInfo = getDeviceInfo(req);
  
  console.log('Location info:', locationInfo);
  console.log('Device info:', deviceInfo);
  
  // Check if device is trusted in database
  const deviceTrusted = await isDeviceTrusted(userId, deviceInfo);
  deviceInfo.isNewDevice = !deviceTrusted;
  
  console.log(`Device trusted: ${deviceTrusted}, Is new device: ${deviceInfo.isNewDevice}`);
  
  // Check for suspicious location (only if device is trusted)
  const suspiciousLocation = deviceTrusted ? isSuspiciousLocation(userId, locationInfo) : false;
  
  // Log security event
  await logSecurityEvent('login_security_check', {
    userId: userId,
    locationInfo: locationInfo,
    deviceInfo: deviceInfo,
    isNewDevice: deviceInfo.isNewDevice,
    isSuspiciousLocation: suspiciousLocation,
    ipAddress: ipAddress
  }, req);
  
  let requiresVerification = false;
  let alertType = null;
  
  if (deviceInfo.isNewDevice) {
    console.log(`New device detected for user ${userId}, requiring verification`);
    requiresVerification = true;
    alertType = 'new_device';
    
    // Generate and store verification code
    const verificationCode = generateVerificationCode();
    await storeVerificationCode(userId, verificationCode);
    
    // Send new device alert email
    try {
      await sendNewDeviceAlert(userEmail, deviceInfo, locationInfo, verificationCode);
      console.log('New device alert email sent successfully');
    } catch (error) {
      console.error('Failed to send new device alert email:', error);
    }
    
  } else {
    // Device is trusted, update usage
    try {
      await updateDeviceUsage(userId, deviceInfo, locationInfo, ipAddress);
    } catch (error) {
      console.error('Failed to update device usage:', error);
    }
    
    if (suspiciousLocation) {
      console.log(`Suspicious location detected for user ${userId}`);
      alertType = 'suspicious_location';
      
      // Send suspicious location alert email
      try {
        await sendSuspiciousLocationAlert(userEmail, locationInfo, deviceInfo);
        console.log('Suspicious location alert email sent successfully');
      } catch (error) {
        console.error('Failed to send suspicious location alert email:', error);
      }
    }
  }
  
  return {
    requiresVerification,
    alertType,
    locationInfo,
    deviceInfo,
    verificationCodeSent: requiresVerification
  };
}

/**
 * Check if location is suspicious (simplified version - can be enhanced)
 */
function isSuspiciousLocation(userId, currentLocation) {
  // For now, we'll be less strict on location checking since trusted devices are our main security layer
  // This can be enhanced later with database-stored location tracking
  return false;
}

/**
 * Mark login as verified and trusted
 */
export async function markLoginAsTrusted(userId, deviceInfo, locationInfo, ipAddress) {
  try {
    // Add device to trusted devices in database
    if (deviceInfo.isNewDevice) {
      await addTrustedDevice(userId, deviceInfo, locationInfo, ipAddress);
      console.log(`Added new trusted device for user ${userId}`);
    }
    
    console.log(`Login marked as trusted for user ${userId}`);
  } catch (error) {
    console.error('Error marking login as trusted:', error);
  }
}
