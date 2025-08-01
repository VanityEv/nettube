// Location-Based Security Service
import geoip from 'geoip-lite';
import crypto from 'crypto';
import { sendNewDeviceAlert, sendSuspiciousLocationAlert } from '../mail/Mail.js';
import { logSecurityEvent } from './mongoLogger.js';
import { 
  isDeviceTrusted, 
  addTrustedDevice, 
  updateDeviceUsage,
  generateDeviceFingerprint 
} from './trustedDeviceService.js';

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
 * Store verification code with expiration
 */
export function storeVerificationCode(userId, code, expiresIn = 10 * 60 * 1000) { // 10 minutes
  const expiresAt = Date.now() + expiresIn;
  verificationCodes.set(userId, { code, expiresAt });
  
  // Clean up expired codes
  setTimeout(() => {
    verificationCodes.delete(userId);
  }, expiresIn);
  
  console.log(`Verification code stored for user ${userId}: ${code} (expires in ${expiresIn/1000/60} minutes)`);
}

/**
 * Verify a code for a user
 */
export function verifyCode(userId, inputCode) {
  const stored = verificationCodes.get(userId);
  if (!stored) {
    console.log(`No verification code found for user ${userId}`);
    return { valid: false, reason: 'No code found' };
  }
  
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(userId);
    console.log(`Verification code expired for user ${userId}`);
    return { valid: false, reason: 'Code expired' };
  }
  
  if (stored.code !== inputCode) {
    console.log(`Invalid verification code for user ${userId}. Expected: ${stored.code}, Got: ${inputCode}`);
    return { valid: false, reason: 'Invalid code' };
  }
  
  // Code is valid, remove it
  verificationCodes.delete(userId);
  console.log(`Verification code validated for user ${userId}`);
  return { valid: true };
}

/**
 * Main security check function for login attempts
 */
export async function performSecurityCheck(req, user) {
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
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
    storeVerificationCode(userId, verificationCode);
    
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
