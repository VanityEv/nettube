// SEGMENT 2: Device Fingerprinting & Security Validation
// Handles device fingerprinting, concurrent stream checking, and session tracking

import { generateEnhancedFingerprint, checkConcurrentStreams, trackStreamingSession } from '../antiPiracy.js';
import { logSecurityEvent } from '../../../utils/securityLogger.js';

export async function validateStreamingSecurity(req, videoId) {
  try {
    const clientFingerprint = req.headers['x-device-fingerprint'] || '';
    
    // 1. Generate enhanced device fingerprint
    const serverFingerprint = generateEnhancedFingerprint(clientFingerprint, req);
    req.deviceFingerprint = serverFingerprint;
    
    // Device fingerprint generated - no spam logging
    
    // 2. Check concurrent streaming limits
    const streamCheck = await checkConcurrentStreams(req.user.id, serverFingerprint, 2);
    if (!streamCheck.allowed) {
      await logSecurityEvent({
        type: 'streaming_violation',
        userId: req.user.id,
        violations: streamCheck.violations,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return {
        success: false,
        status: 403,
        error: 'Concurrent streaming limit exceeded',
        violations: streamCheck.violations
      };
    }
    
    // 3. Track streaming session
    const sessionId = await trackStreamingSession(req.user.id, serverFingerprint, videoId);
    
    // Security validation passed - no spam logging
    
    return {
      success: true,
      sessionId,
      serverFingerprint,
      activeSessions: streamCheck.activeSessions
    };
    
  } catch (error) {
    console.error('Security validation error:', error);
    return {
      success: false,
      status: 500,
      error: 'Security validation failed'
    };
  }
}
