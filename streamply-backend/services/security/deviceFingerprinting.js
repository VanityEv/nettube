// services/security/deviceFingerprinting.js
// Advanced device fingerprinting for anti-piracy and concurrent stream limiting

import crypto from 'crypto';
import prisma from '../prisma.js';
import { logSecurityEvent } from './mongoLogger.js';

/**
 * Generate comprehensive device fingerprint
 */
export function generateDeviceFingerprint(req) {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    req.connection.remoteAddress || req.ip || '',
    req.headers['x-forwarded-for'] || '',
    req.headers['sec-ch-ua'] || '',
    req.headers['sec-ch-ua-platform'] || '',
    req.headers['sec-ch-ua-mobile'] || '',
  ];
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
    
  return fingerprint;
}

/**
 * Enhanced device fingerprint with browser-specific data
 */
export function generateEnhancedFingerprint(clientFingerprint, req) {
  const serverFingerprint = generateDeviceFingerprint(req);
  
  const combined = crypto
    .createHash('sha256')
    .update(`${serverFingerprint}|${clientFingerprint}`)
    .digest('hex');
    
  return combined;
}

/**
 * Track active streaming sessions per device
 */
export async function trackStreamingSession(userId, deviceFingerprint, videoId) {
  try {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
    
    await prisma.streamingSession.create({
      data: {
        sessionId,
        userId: parseInt(userId),
        deviceFingerprint,
        videoId: parseInt(videoId),
        startedAt: new Date(),
        expiresAt,
        isActive: true
      }
    });
    
    return sessionId;
  } catch (error) {
    console.error('Error tracking streaming session:', error);
    throw error;
  }
}

/**
 * Check for concurrent streaming violations
 */
export async function checkConcurrentStreams(userId, deviceFingerprint, maxConcurrent = 2) {
  try {
    // Clean up expired sessions first
    await prisma.streamingSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      }
    });
    
    // Count active sessions for this user
    const activeSessions = await prisma.streamingSession.count({
      where: {
        userId: parseInt(userId),
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });
    
    // Check for device sharing (same fingerprint, different users)
    const deviceUsers = await prisma.streamingSession.findMany({
      where: {
        deviceFingerprint,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      distinct: ['userId']
    });
    
    const violations = [];
    
    if (activeSessions >= maxConcurrent) {
      violations.push({
        type: 'concurrent_limit_exceeded',
        details: `User has ${activeSessions} active streams (limit: ${maxConcurrent})`
      });
    }
    
    if (deviceUsers.length > 1) {
      violations.push({
        type: 'device_sharing_detected',
        details: `Device used by ${deviceUsers.length} different users`
      });
    }
    
    if (violations.length > 0) {
      await logSecurityEvent({
        type: 'streaming_violation',
        userId,
        deviceFingerprint,
        violations,
        activeSessions,
        deviceUsers: deviceUsers.length
      });
    }
    
    return {
      allowed: violations.length === 0,
      violations,
      activeSessions,
      deviceUsers: deviceUsers.length
    };
  } catch (error) {
    console.error('Error checking concurrent streams:', error);
    return { allowed: true, violations: [], error: error.message };
  }
}

/**
 * End streaming session
 */
export async function endStreamingSession(sessionId) {
  try {
    await prisma.streamingSession.updateMany({
      where: { sessionId },
      data: { 
        isActive: false,
        endedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error ending streaming session:', error);
  }
}

/**
 * Get device statistics for admin dashboard
 */
export async function getDeviceStatistics() {
  try {
    const stats = await prisma.streamingSession.groupBy({
      by: ['deviceFingerprint'],
      _count: {
        userId: true
      },
      _max: {
        startedAt: true
      },
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    return stats.map(stat => ({
      deviceFingerprint: stat.deviceFingerprint,
      uniqueUsers: stat._count.userId,
      lastActivity: stat._max.startedAt
    }));
  } catch (error) {
    console.error('Error getting device statistics:', error);
    return [];
  }
}
