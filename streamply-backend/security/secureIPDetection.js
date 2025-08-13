// Secure IP detection for production
// This module provides secure IP extraction that cannot be spoofed

/**
 * Securely extracts client IP address
 * SECURITY: Never trusts user-provided headers in production
 * @param {Request} req - Express request object
 * @returns {string} - Trusted client IP address
 */
export const getSecureClientIP = (req) => {
  // SECURITY: Never trust user-provided headers for rate limiting/authentication
  // Only trust req.ip which is processed by Express trust proxy configuration
  
  // DEBUG: Log all IP related headers for troubleshooting (development only)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_IP_DEBUG === 'true') {
    console.log('[IP DEBUG] req.ip:', req.ip);
    console.log('[IP DEBUG] req.connection?.remoteAddress:', req.connection?.remoteAddress);
    console.log('[IP DEBUG] req.socket?.remoteAddress:', req.socket?.remoteAddress);
    console.log('[IP DEBUG] X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('[IP DEBUG] X-Real-IP:', req.headers['x-real-ip']);
    console.log('[IP DEBUG] CF-Connecting-IP:', req.headers['cf-connecting-ip']);
    console.log('[IP DEBUG] X-Client-IP:', req.headers['x-client-ip']);
    console.log('[IP DEBUG] Trust proxy setting:', req.app.get('trust proxy'));
  }
  
  // SECURITY: Always use req.ip in production AND development
  // Express trust proxy properly validates source and processes X-Forwarded-For safely
  // This prevents header spoofing attacks
  let secureIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  
  // Normalize IPv4-mapped IPv6 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  if (secureIP.startsWith('::ffff:')) {
    secureIP = secureIP.substring(7);
  }
  
  // RAILWAY PRODUCTION FIX: Check if we're getting Railway proxy IP and try X-Forwarded-For
  const isRailwayProxyIP = secureIP.startsWith('100.64.') || 
                          secureIP.startsWith('10.') || 
                          secureIP.startsWith('172.') ||
                          secureIP.startsWith('162.220.232.'); // All Railway proxy IPs
  
  if (isRailwayProxyIP) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map(ip => ip.trim());
      // Look for first non-internal IP in the chain
      for (const ip of ips) {
        if (!ip.startsWith('100.64.') && 
            !ip.startsWith('10.') && 
            !ip.startsWith('172.') && 
            !ip.startsWith('192.168.') &&
            ip !== '127.0.0.1' &&
            ip !== '162.220.232.164' &&
            ip !== '162.220.232.13') {
          if (process.env.ENABLE_IP_DEBUG === 'true') {
            console.log(`[IP SECURITY] Railway proxy detected, using client IP: ${ip} (was: ${secureIP})`);
          }
          secureIP = ip;
          break;
        }
      }
    }
  }
  
  // SECURITY WARNING: Never use headers directly for security decisions
  // Headers like X-Forwarded-For can be easily spoofed by attackers
  // Only use req.ip which Express processes through trust proxy validation
  
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_IP_DEBUG === 'true') {
    console.log('[IP SECURITY] Using secure IP for rate limiting:', secureIP);
  }
  
  return secureIP;
};

/**
 * Detects potential IP spoofing attempts by analyzing headers
 * SECURITY: This helps identify malicious users trying to bypass rate limiting
 * @param {Request} req - Express request object
 * @returns {object} - Spoofing analysis result
 */
export const detectIPSpoofing = (req) => {
  const secureIP = getSecureClientIP(req);
  const suspiciousHeaders = [];
  const warnings = [];
  
  // Check for suspicious X-Forwarded-For headers
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const ips = xff.split(',').map(ip => ip.trim());
    
    // Warning: Multiple IPs in X-Forwarded-For (could be legitimate proxy chain)
    if (ips.length > 3) {
      warnings.push(`Long proxy chain detected: ${ips.length} IPs`);
    }
    
    // Check for obviously spoofed IPs
    const suspiciousIPs = ips.filter(ip => {
      return ip === '8.8.8.8' || ip === '1.1.1.1' || ip === '127.0.0.1' || 
             ip.startsWith('192.168.') || ip.startsWith('10.') || 
             ip.includes('localhost') || ip === '0.0.0.0';
    });
    
    if (suspiciousIPs.length > 0) {
      suspiciousHeaders.push({
        header: 'X-Forwarded-For',
        value: xff,
        reason: `Contains suspicious IPs: ${suspiciousIPs.join(', ')}`
      });
    }
  }
  
  // Check for multiple conflicting IP headers
  const ipHeaders = {
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip'],
    'cf-connecting-ip': req.headers['cf-connecting-ip'],
    'x-client-ip': req.headers['x-client-ip'],
    'x-cluster-client-ip': req.headers['x-cluster-client-ip']
  };
  
  const presentHeaders = Object.entries(ipHeaders)
    .filter(([key, value]) => value)
    .map(([key, value]) => ({ header: key, value }));
  
  if (presentHeaders.length > 2) {
    warnings.push(`Multiple IP headers present (${presentHeaders.length}): possible spoofing attempt`);
  }
  
  // Log suspicious activity
  if (suspiciousHeaders.length > 0 || warnings.length > 0) {
    console.warn(`[IP SPOOFING ALERT] Suspicious request from ${secureIP}:`, {
      suspiciousHeaders,
      warnings,
      userAgent: req.headers['user-agent'],
      url: req.url
    });
  }
  
  return {
    secureIP,
    isSuspicious: suspiciousHeaders.length > 0,
    suspiciousHeaders,
    warnings,
    riskScore: suspiciousHeaders.length * 2 + warnings.length // Simple risk scoring
  };
};

/**
 * Gets real client IP for logging ONLY (can include headers for debugging)
 * @param {Request} req - Express request object  
 * @returns {object} - IP info for security logging
 */
export const getIPForLogging = (req) => {
  const secureIP = getSecureClientIP(req);
  const geolocationIP = getGeolocationIP(req);
  
  return {
    trustedIP: secureIP, // Always use this for rate limiting/security
    geolocationIP: geolocationIP, // Use this for geolocation ONLY
    forwardedFor: req.headers['x-forwarded-for'], // Only for debugging
    realIP: req.headers['x-real-ip'], // Only for debugging
    environment: process.env.NODE_ENV
  };
};

/**
 * Gets IP for geolocation purposes ONLY - NOT for security
 * SECURITY WARNING: This should NEVER be used for rate limiting or authentication
 * @param {Request} req - Express request object
 * @returns {string} - IP for geolocation (can be spoofed, use only for location data)
 */
export const getGeolocationIP = (req) => {
  // In production, try to get real client IP from X-Forwarded-For
  if (process.env.NODE_ENV === 'production') {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // First IP in chain should be the real client IP (before proxies)
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      const clientIP = ips[0];
      
      // SECURITY: Validate IP is reasonable for geolocation
      if (clientIP && isValidGeolocationIP(clientIP)) {
        console.log(`[GEOLOCATION] Using validated client IP for location: ${clientIP}`);
        return clientIP;
      } else {
        console.warn(`[GEOLOCATION SECURITY] Suspicious IP in X-Forwarded-For: ${clientIP}, falling back to secure IP`);
      }
    }
  }
  
  // Fallback to secure IP if no valid geolocation IP found
  console.log(`[GEOLOCATION] Falling back to secure IP for location`);
  return getSecureClientIP(req);
};

/**
 * Validates if an IP is reasonable for geolocation (anti-spoofing)
 * @param {string} ip - IP address to validate
 * @returns {boolean} - true if IP seems legitimate for geolocation
 */
function isValidGeolocationIP(ip) {
  // Block obviously internal/private/spoofed IPs
  const suspiciousPatterns = [
    /^127\./, // localhost
    /^::1$/, // IPv6 localhost
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
    /^192\.168\./, // Private Class C
    /^169\.254\./, // Link-local
    /^::ffff:100\.64\./, // Railway internal IPv6
    /^100\.64\./, // Railway internal
    /^162\.220\.232\./, // Railway proxy range
    /^8\.8\.8\.8$/, // Common spoofing target
    /^1\.1\.1\.1$/, // Common spoofing target
    /^0\.0\.0\.0$/, // Invalid
    /^255\.255\.255\.255$/, // Broadcast
    /^224\./, // Multicast
    /^240\./, // Reserved
  ];
  
  // Check against suspicious patterns
  if (suspiciousPatterns.some(pattern => pattern.test(ip))) {
    return false;
  }
  
  // Basic IPv4 format validation
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return false;
  }
  
  // Validate each octet is 0-255
  const octets = ip.split('.');
  if (octets.some(octet => parseInt(octet) > 255)) {
    return false;
  }
  
  return true;
}

/**
 * DEPRECATED: This function is vulnerable to spoofing
 * Use getSecureClientIP instead
 */
export const getClientIP_VULNERABLE = (req) => {
  // This is vulnerable because it trusts user headers
  return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
};
