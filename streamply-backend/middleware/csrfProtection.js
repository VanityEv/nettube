import csrf from 'csurf';
import { logSecurityEvent } from '../services/security/mongoLogger.js';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 3600000,
    key: '_csrf'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req) => {
    return req.headers['x-csrf-token'] || 
           req.headers['x-xsrf-token'] || 
           req.body._csrf ||
           req.query._csrf;
  }
});

// CSRF Error Handler
const csrfErrorHandler = async (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Log CSRF attack attempt
    await logSecurityEvent({
      type: 'csrf_attack_attempt',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      method: req.method,
      path: req.path,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        'x-forwarded-for': req.headers['x-forwarded-for']
      },
      severity: 'high',
      timestamp: new Date(),
      details: {
        message: 'Invalid CSRF token',
        expectedToken: req.csrfToken ? req.csrfToken() : 'none',
        receivedToken: req.headers['x-csrf-token'] || req.body._csrf || 'none'
      }
    });

    // Minimal console log to prevent spam
    if (Math.random() < 0.2) { // 20% chance to log to console
      console.log(`🚨 CSRF Attack: ${req.ip} -> ${req.path}`);
    }

    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_MISMATCH',
      message: 'Request blocked for security reasons'
    });
  }
  next(err);
};

// CSRF Token Provider Endpoint - with minimal logging
const provideCsrfToken = (req, res) => {
  const token = req.csrfToken();
  
  // Only log occasionally for debugging, not every token generation
  if (Math.random() < 0.1) { // 10% chance to log
    console.log(`🔐 CSRF Token Generated: ${req.ip}`);
  }

  res.json({
    csrfToken: token,
    timestamp: new Date().toISOString(),
    expires: new Date(Date.now() + 3600000).toISOString() // 1 hour
  });
};

// Conditional CSRF Protection - Only for state-changing operations
const conditionalCsrfProtection = (req, res, next) => {
  // Skip CSRF for read-only operations
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for specific endpoints that handle their own validation
  const skipPaths = [
    '/user/stripe-webhook',
    '/user/clear-rate-limits', // Emergency endpoint
    '/user/redis-status', // Debug endpoint
    '/api/health',
    '/health',
    '/status'
  ];

  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // Apply CSRF protection for state-changing operations
  return csrfProtection(req, res, next);
};

export {
  csrfProtection,
  csrfErrorHandler,
  provideCsrfToken,
  conditionalCsrfProtection
};
