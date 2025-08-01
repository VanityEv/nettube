// Trusted Device Service - Database operations for device tracking
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate a unique device fingerprint based on device characteristics
 */
export function generateDeviceFingerprint(deviceInfo) {
  const fingerprintData = [
    deviceInfo.browser || 'unknown',
    deviceInfo.os || 'unknown', 
    deviceInfo.type || 'unknown',
    deviceInfo.userAgent || 'unknown'
  ].join('|');
  
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
}

/**
 * Create a user-friendly device name
 */
export function createDeviceName(deviceInfo) {
  return `${deviceInfo.browser || 'Unknown Browser'} on ${deviceInfo.os || 'Unknown OS'}`;
}

/**
 * Check if device is trusted for a user
 */
export async function isDeviceTrusted(userId, deviceInfo) {
  try {
    const fingerprint = deviceInfo.fingerprint || generateDeviceFingerprint(deviceInfo);
    
    const trustedDevice = await prisma.trustedDevice.findFirst({
      where: {
        user_id: userId,
        device_fingerprint: fingerprint,
        is_active: true
      }
    });
    
    return !!trustedDevice;
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return false;
  }
}

/**
 * Get all trusted devices for a user
 */
export async function getUserTrustedDevices(userId) {
  try {
    return await prisma.trustedDevice.findMany({
      where: {
        user_id: userId,
        is_active: true
      },
      orderBy: {
        last_used: 'desc'
      }
    });
  } catch (error) {
    console.error('Error getting user trusted devices:', error);
    return [];
  }
}

/**
 * Add a new trusted device for a user
 */
export async function addTrustedDevice(userId, deviceInfo, locationInfo, ipAddress) {
  try {
    const fingerprint = deviceInfo.fingerprint || generateDeviceFingerprint(deviceInfo);
    const deviceName = createDeviceName(deviceInfo);
    const locationString = locationInfo.isLocal ? 
      'Local Development' : 
      `${locationInfo.city}, ${locationInfo.country}`;
    
    // Check if device already exists and update it instead
    const existingDevice = await prisma.trustedDevice.findFirst({
      where: {
        user_id: userId,
        device_fingerprint: fingerprint
      }
    });
    
    if (existingDevice) {
      // Update existing device
      return await prisma.trustedDevice.update({
        where: {
          id: existingDevice.id
        },
        data: {
          last_used: new Date(),
          last_ip: ipAddress,
          last_location: locationString,
          is_active: true
        }
      });
    } else {
      // Create new trusted device
      return await prisma.trustedDevice.create({
        data: {
          user_id: userId,
          device_fingerprint: fingerprint,
          device_name: deviceName,
          device_type: deviceInfo.type || 'unknown',
          browser_name: deviceInfo.browser,
          os_name: deviceInfo.os,
          last_ip: ipAddress,
          last_location: locationString
        }
      });
    }
  } catch (error) {
    console.error('Error adding trusted device:', error);
    throw error;
  }
}

/**
 * Update device last used timestamp and location
 */
export async function updateDeviceUsage(userId, deviceInfo, locationInfo, ipAddress) {
  try {
    const fingerprint = deviceInfo.fingerprint || generateDeviceFingerprint(deviceInfo);
    const locationString = locationInfo.isLocal ? 
      'Local Development' : 
      `${locationInfo.city}, ${locationInfo.country}`;
    
    await prisma.trustedDevice.updateMany({
      where: {
        user_id: userId,
        device_fingerprint: fingerprint,
        is_active: true
      },
      data: {
        last_used: new Date(),
        last_ip: ipAddress,
        last_location: locationString
      }
    });
    
    console.log(`Updated device usage for user ${userId}, device ${fingerprint}`);
  } catch (error) {
    console.error('Error updating device usage:', error);
  }
}

/**
 * Remove a trusted device
 */
export async function removeTrustedDevice(userId, deviceId) {
  try {
    return await prisma.trustedDevice.update({
      where: {
        id: deviceId,
        user_id: userId
      },
      data: {
        is_active: false
      }
    });
  } catch (error) {
    console.error('Error removing trusted device:', error);
    throw error;
  }
}

/**
 * Clean up old inactive devices (older than 90 days)
 */
export async function cleanupOldDevices() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const result = await prisma.trustedDevice.updateMany({
      where: {
        last_used: {
          lt: ninetyDaysAgo
        },
        is_active: true
      },
      data: {
        is_active: false
      }
    });
    
    console.log(`Deactivated ${result.count} old trusted devices`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up old devices:', error);
    return 0;
  }
}

export default {
  generateDeviceFingerprint,
  createDeviceName,
  isDeviceTrusted,
  getUserTrustedDevices,
  addTrustedDevice,
  updateDeviceUsage,
  removeTrustedDevice,
  cleanupOldDevices
};
