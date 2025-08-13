/**
 * IP Detection Helper for Railway Proxy Chain
 * SECURITY FIXED: Uses secure IP detection that cannot be spoofed
 */

import { logger } from './logLevel.js';
import { getSecureClientIP, getIPForLogging } from '../security/secureIPDetection.js';

/**
 * Extract the real client IP from request headers
 * SECURITY: This function is now secure and cannot be spoofed
 * @param {Object} req - Express request object
 * @returns {string} - Trusted client IP address
 */
export function getRealClientIP(req) {
  // SECURITY: Use only secure IP detection in production
  return getSecureClientIP(req);
}

/**
 * DEPRECATED: This was the vulnerable version
 * Left here for debugging purposes only
 */
function getRealClientIP_VULNERABLE(req) {
  // Priority order for IP detection in Railway proxy environment:
  // 1. X-Forwarded-For (first IP in the chain is the real client)
  // 2. X-Real-IP (set by proxy)  
  // 3. req.ip (Express with trust proxy)
  // 4. connection.remoteAddress (direct connection)
  
  // X-Forwarded-For contains comma-separated IPs: client, proxy1, proxy2, ...
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // Get the first IP (the original client)
    const firstIP = xForwardedFor.split(',')[0].trim();
    if (isValidIP(firstIP)) {
      // SECURITY WARNING: This is vulnerable to spoofing!
      return firstIP;
    }
  }
  
  // X-Real-IP header (single IP set by proxy)
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP && isValidIP(xRealIP)) {
    return xRealIP;
  }
  
  // Express req.ip (should work with trust proxy, but might be proxy IP)
  if (req.ip && isValidIP(req.ip)) {
    return req.ip;
  }
  
  // Direct connection (fallback)
  const directIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (directIP && isValidIP(directIP)) {
    return directIP;
  }
  
  logger.warning('Could not detect valid client IP, using fallback');
  return '127.0.0.1'; // Fallback IP
}

/**
 * Validate if a string is a valid IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IP
 */
function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // Remove potential IPv6 brackets
  ip = ip.replace(/^\[|\]$/g, '');
  
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  // Check for local/private IPs that shouldn't be used as client IPs
  if (ipv4Regex.test(ip)) {
    // Skip local/private ranges when looking for real client IP
    if (ip.startsWith('127.') || 
        ip.startsWith('10.') || 
        ip.startsWith('192.168.') ||
        ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      console.log(`🚫 Skipping private/local IP: ${ip}`);
      return false;
    }
    return true;
  }
  
  if (ipv6Regex.test(ip)) {
    // Skip IPv6 localhost
    if (ip === '::1' || ip === '::') {
      console.log(`🚫 Skipping IPv6 localhost: ${ip}`);
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Get detailed IP information for debugging
 * @param {Object} req - Express request object
 * @returns {Object} - Detailed IP analysis
 */
export function getIPDebugInfo(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIP = req.headers['x-real-ip'];
  const expressIP = req.ip;
  const connectionIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  return {
    detectedClientIP: getRealClientIP(req),
    headers: {
      'x-forwarded-for': xForwardedFor,
      'x-real-ip': xRealIP,
      'x-proxy-source': req.headers['x-proxy-source']
    },
    expressValues: {
      'req.ip': expressIP,
      'connection.remoteAddress': connectionIP
    },
    analysis: {
      xForwardedForIPs: xForwardedFor ? xForwardedFor.split(',').map(ip => ip.trim()) : [],
      isProxied: !!(xForwardedFor || xRealIP),
      trustProxyConfig: req.app.get('trust proxy'),
      timestamp: new Date().toISOString()
    }
  };
}

export default { getRealClientIP, getIPDebugInfo, isValidIP };
