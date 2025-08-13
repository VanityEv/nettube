/**
 * DoS/DDoS Protection Middleware
 * Protects against various DoS attack vectors including Slowloris, memory exhaustion, etc.
 */

import { getSecureClientIP, detectIPSpoofing } from '../security/secureIPDetection.js';

// Connection tracking for DoS protection
const connectionTracker = new Map();
const requestTracker = new Map();

// Configuration
const DOS_PROTECTION_CONFIG = {
  // Maximum concurrent connections per IP
  maxConnectionsPerIP: 50,
  
  // Maximum request duration (Slowloris protection)
  maxRequestDuration: 30000, // 30 seconds
  
  // Maximum requests per IP per second (burst protection)
  maxRequestsPerSecond: 10,
  
  // Memory usage limits
  maxMemoryUsage: 500 * 1024 * 1024, // 500MB
  
  // Cleanup intervals
  cleanupInterval: 60000, // 1 minute
};

/**
 * Memory usage monitor
 */
export function memoryProtection(req, res, next) {
  const memUsage = process.memoryUsage();
  
  if (memUsage.heapUsed > DOS_PROTECTION_CONFIG.maxMemoryUsage) {
    console.error(`[MEMORY PROTECTION] High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    
    // Only block new non-essential requests when memory is high
    if (req.method !== 'GET' && !req.url.includes('/health')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Server is under high load. Please try again later.'
      });
    }
  }
  
  next();
}

/**
 * Combined DoS protection middleware
 */
export function dosProtection(req, res, next) {
  // Skip protection for health checks
  if (req.url.includes('/health') || req.url.includes('/status')) {
    return next();
  }
  
  // Cache IP and spoofing analysis for this request to avoid multiple calls
  if (!req._secureClientIP) {
    const spoofingAnalysis = detectIPSpoofing(req);
    req._secureClientIP = spoofingAnalysis.secureIP;
    
    // Cache penalty points for rate limiting
    let pointsToConsume = 1;
    if (spoofingAnalysis.isSuspicious) {
      pointsToConsume = 3;
    } else if (spoofingAnalysis.warnings.length > 0) {
      pointsToConsume = 2;
    }
    req._rateLimitPointsToConsume = pointsToConsume;
    
    console.log('[DoS] IP cached:', req._secureClientIP, 'penalty points:', pointsToConsume);
  }
  
  // Apply all protections in sequence using cached IP
  connectionLimiterWithIP(req, res, req._secureClientIP, (err) => {
    if (err) return next(err);
    
    slowlorisProtectionWithIP(req, res, req._secureClientIP, (err) => {
      if (err) return next(err);
      
      burstProtectionWithIP(req, res, req._secureClientIP, (err) => {
        if (err) return next(err);
        
        memoryProtection(req, res, next);
      });
    });
  });
}

/**
 * Connection limiter with cached IP
 */
function connectionLimiterWithIP(req, res, clientIP, next) {
  // Get current connection count for this IP
  const currentConnections = connectionTracker.get(clientIP) || 0;
  
  if (currentConnections >= DOS_PROTECTION_CONFIG.maxConnectionsPerIP) {
    console.warn(`[DoS PROTECTION] Too many connections from ${clientIP}: ${currentConnections}`);
    return res.status(429).json({
      error: 'Too many concurrent connections',
      message: 'Connection limit exceeded. Please reduce concurrent requests.',
      limit: DOS_PROTECTION_CONFIG.maxConnectionsPerIP
    });
  }
  
  // Increment connection count
  connectionTracker.set(clientIP, currentConnections + 1);
  
  // Cleanup on response finish
  res.on('finish', () => {
    const count = connectionTracker.get(clientIP) || 0;
    if (count <= 1) {
      connectionTracker.delete(clientIP);
    } else {
      connectionTracker.set(clientIP, count - 1);
    }
  });
  
  next();
}

/**
 * Slowloris protection with cached IP
 */
function slowlorisProtectionWithIP(req, res, clientIP, next) {
  // Set request timeout
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.warn(`[SLOWLORIS PROTECTION] Request timeout from ${clientIP}: ${req.url}`);
      res.status(408).json({
        error: 'Request Timeout',
        message: 'Request took too long to complete'
      });
    }
  }, DOS_PROTECTION_CONFIG.maxRequestDuration);
  
  // Clear timeout when request completes
  res.on('finish', () => {
    clearTimeout(timeout);
  });
  
  next();
}

/**
 * Burst protection with cached IP
 */
function burstProtectionWithIP(req, res, clientIP, next) {
  const now = Date.now();
  const secondWindow = Math.floor(now / 1000);
  
  const key = `${clientIP}:${secondWindow}`;
  const currentRequests = requestTracker.get(key) || 0;
  
  if (currentRequests >= DOS_PROTECTION_CONFIG.maxRequestsPerSecond) {
    console.warn(`[BURST PROTECTION] Too many requests per second from ${clientIP}: ${currentRequests}`);
    return res.status(429).json({
      error: 'Request rate exceeded',
      message: 'Too many requests per second. Please slow down.',
      limit: DOS_PROTECTION_CONFIG.maxRequestsPerSecond
    });
  }
  
  requestTracker.set(key, currentRequests + 1);
  
  // Set cleanup for old entries (keep only current second)
  setTimeout(() => {
    requestTracker.delete(key);
  }, 2000);
  
  next();
}

/**
 * Cleanup function to prevent memory leaks
 */
function cleanupTrackers() {
  const now = Date.now();
  
  // Clean old request tracker entries (older than 2 seconds)
  for (const [key, value] of requestTracker.entries()) {
    const [ip, timestamp] = key.split(':');
    if (now - (parseInt(timestamp) * 1000) > 2000) {
      requestTracker.delete(key);
    }
  }
  
  // Log current stats for monitoring
  if (connectionTracker.size > 0 || requestTracker.size > 0) {
    console.log(`[DoS PROTECTION] Active connections: ${connectionTracker.size}, Request tracking: ${requestTracker.size}`);
  }
}

// Start cleanup interval
setInterval(cleanupTrackers, DOS_PROTECTION_CONFIG.cleanupInterval);

export { DOS_PROTECTION_CONFIG };
