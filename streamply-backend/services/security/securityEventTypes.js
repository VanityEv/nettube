// services/security/securityEventTypes.js
// Centralized security event type definitions and logging helpers

export const SECURITY_EVENT_TYPES = {
  // Authentication Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed', 
  USER_LOGOUT: 'user_logout',
  SESSION_EXPIRED: 'session_expired',
  
  // Access Control Events
  UNAUTHORIZED_CONTENT_ACCESS: 'unauthorized_content_access',
  SUBSCRIPTION_CHECK: 'subscription_check',
  SUBSCRIPTION_VERIFICATION_ERROR: 'subscription_verification_error',
  VIDEO_ACCESS_DENIED: 'video_access_denied',
  
  // Security Violations
  WATERMARK_VIOLATION: 'watermark_violation',
  STREAMING_VIOLATION: 'streaming_violation', 
  VIDEO_PIRACY_ATTEMPT: 'video_piracy_attempt',
  SCREEN_RECORDING_DETECTED: 'screen_recording_detected',
  UNUSUAL_STREAMING_PATTERN: 'unusual_streaming_pattern',
  CONCURRENT_LIMIT_EXCEEDED: 'concurrent_limit_exceeded',
  DEVICE_SHARING_DETECTED: 'device_sharing_detected',
  
  // System Security Events
  API_RATE_LIMIT_EXCEEDED: 'api_rate_limit_exceeded',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'unauthorized_access_attempt',
  AUTH_FAILURE: 'auth_failure',
  SUSPICIOUS_QUERY: 'suspicious_query',
  SUSPICIOUS_BODY: 'suspicious_body',
  
  // Content Management Events
  VIDEO_DELETED: 'video_deleted',
  EPISODE_DELETED: 'episode_deleted',
  VIDEO_DELETION_ERROR: 'video_deletion_error',
  EPISODE_DELETION_ERROR: 'episode_deletion_error',
  
  // Operations Events
  WATERMARK_GENERATED: 'watermark_generated',
  VIDEO_PROCESSING_SUCCESS: 'video_processing_success',
  VIDEO_PROCESSING_ERROR: 'video_processing_error',
  EPISODE_PROCESSING_SUCCESS: 'episode_processing_success',
  EPISODE_PROCESSING_ERROR: 'episode_processing_error',
  MOVIE_UPLOAD_ERROR: 'movie_upload_error',
  EPISODE_UPLOAD_ERROR: 'episode_upload_error',
  STREAMING_ERROR: 'streaming_error',
  AVATAR_UPLOAD_SUCCESS: 'avatar_upload_success',
  AVATAR_UPLOAD_ERROR: 'avatar_upload_error',
  AVATAR_FETCH_ERROR: 'avatar_fetch_error',
  SERVER_START: 'server_start'
};

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning', 
  INFO: 'info',
  DEBUG: 'debug'
};

// Helper functions for consistent logging
import { logSecurityEvent } from './mongoLogger.js';

export const logAuthEvent = async (type, user, request, success = true) => {
  const severity = success ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.WARNING;
  await logSecurityEvent({
    type,
    severity,
    message: `${success ? 'Successful' : 'Failed'} authentication: ${type}`,
    metadata: {
      username: user?.username || user?.email,
      userId: user?._id,
      ip: request?.ip || request?.connection?.remoteAddress,
      userAgent: request?.get('User-Agent'),
      timestamp: new Date()
    }
  });
};

export const logSecurityViolation = async (type, message, metadata = {}) => {
  await logSecurityEvent({
    type,
    severity: SEVERITY_LEVELS.CRITICAL,
    message,
    metadata: {
      ...metadata,
      timestamp: new Date(),
      alertRequired: true
    }
  });
};

export const logAccessControl = async (type, user, resource, allowed = false) => {
  const severity = allowed ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.WARNING;
  await logSecurityEvent({
    type,
    severity,
    message: `Access ${allowed ? 'granted' : 'denied'} to ${resource}`,
    metadata: {
      username: user?.username || user?.email,
      userId: user?._id,
      resource,
      allowed,
      timestamp: new Date()
    }
  });
};

export const logContentOperation = async (type, user, content, success = true) => {
  const severity = success ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.WARNING;
  await logSecurityEvent({
    type,
    severity,
    message: `Content operation: ${type}`,
    metadata: {
      username: user?.username || user?.email,
      userId: user?._id,
      contentType: content?.type,
      contentId: content?._id,
      contentTitle: content?.title,
      success,
      timestamp: new Date()
    }
  });
};

export const logSystemEvent = async (type, message, severity = SEVERITY_LEVELS.INFO, metadata = {}) => {
  await logSecurityEvent({
    type,
    severity,
    message,
    metadata: {
      ...metadata,
      timestamp: new Date()
    }
  });
};
