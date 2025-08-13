// proxy-server.js - Express Proxy dla Windows (alternatywa dla Nginx)
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Fix for Railway proxy + express-rate-limit compatibility
// Railway is behind 1 proxy layer, so trust exactly 1 hop
app.set('trust proxy', 1);

// Prefer Railway's PORT, fallback to custom PROXY_PORT, then 8080
const PORT = process.env.PORT || process.env.PROXY_PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://streamply-frontend-production.up.railway.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://streamply-backend-production-4ce8.up.railway.app';

console.log('🚀 Starting Streamply Express Proxy Server...');
console.log('➡️  FRONTEND_URL =', FRONTEND_URL);
console.log('➡️  BACKEND_URL  =', BACKEND_URL);

// Central list of allowed / exposed headers (to avoid divergence)
const ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'X-Device-Fingerprint',
  'X-Requested-With',
  'X-CSRF-Token',
  'X-XSRF-Token',
  'Accept',
  'Origin',
  'User-Agent',
  'DNT',
  'Cache-Control',
  'Pragma',
  'X-Mx-ReqToken',
  'Keep-Alive',
  'If-Modified-Since',
  'Bypass-Tunnel-Reminder',
  'Ngrok-Skip-Browser-Warning',
  'Sec-CH-UA',
  'Sec-CH-UA-Mobile',
  'Sec-CH-UA-Platform',
  'Range',
  'skip-csrf-interceptor'
];

const EXPOSED_HEADERS = [
  'Content-Length',
  'Content-Range',
  'Accept-Ranges',
  'Content-Type',
  'Content-Disposition',
  'ETag',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Last-Modified',
  'Cache-Control',
  'Expires',
  'Set-Cookie'
];

// Enhanced rate limiting for OWASP ZAP compliance
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { 
    error: message,
    timestamp: new Date().toISOString(),
    retryAfter: Math.ceil(windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Remove keyGenerator to let express-rate-limit handle IP with trust proxy = 1
  // keyGenerator: (req) => req.ip,  // <-- commented out to avoid trust proxy validation error
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      timestamp: new Date().toISOString(),
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

// Rate limiting middleware - Higher limits for production scale
const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  1000, // 1000 requests per minute (was 100)
  'Too many API requests from this IP, please try again later.'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 auth attempts per 15 minutes (was 5)
  'Too many authentication attempts, please try again later.'
);

// More reasonable limit for user registration and signup
const registrationLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  100, // 100 registration attempts per 5 minutes (was 10)
  'Too many registration attempts, please try again in a few minutes.'
);

const streamingLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  500, // 500 streaming requests per minute (was 50)
  'Too many streaming requests, please wait before trying again.'
);

const uploadLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // 20 uploads per 5 minutes (was 5)
  'Too many upload requests, please wait before trying again.'
);

// CORS dla wszystkich requestów - OWASP ZAP compliant
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost',
      BACKEND_URL, // direct backend calls (optional)
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
      /^https:\/\/[a-zA-Z0-9-]+\.loca\.lt$/,
      /^https:\/\/[a-zA-Z0-9-]+\.cfargotunnel\.com$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.up\.railway\.app$/
    ];
    
    // Check string matches
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      return callback(null, true);
    }
    
    // Log suspicious origin attempts for security monitoring
    console.warn(`[SECURITY] Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: EXPOSED_HEADERS,
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 204,
  preflightContinue: false
}));

// Force HTTPS redirect in production
app.use((req, res, next) => {
  // Skip HTTPS redirect for health check endpoints
  if (req.path === '/health' || req.path === '/healthz' || req.path === '/proxy-status') {
    return next();
  }
  
  // In production, redirect HTTP to HTTPS
  if (process.env.NODE_ENV === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    console.log(`🔒 HTTPS redirect: ${req.headers.host}${req.url} → ${httpsUrl}`);
    return res.redirect(301, httpsUrl);
  }
  next();
});

// Fast explicit preflight handler (some browsers / proxies can be picky)
// Express 5 (path-to-regexp v6) no longer accepts bare '*' pattern -> handle manually
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH');
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }
  next();
});

// Security headers middleware for OWASP ZAP compliance
app.use((req, res, next) => {
  // Skip some security headers for video streaming to avoid CORS issues
  const isVideoStream = req.url.includes('/video/stream') || req.url.includes('/video/hls');
  
  // OWASP 2025 Required Headers
  if (!isVideoStream) {
    res.setHeader('X-Frame-Options', 'DENY');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Powered-By', 'Streamply-Proxy');
  
  // Strict Transport Security (HSTS) for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy (CSP) - ZAP compliance
  if (!isVideoStream) {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https: wss: ws:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '));
  }
  
  // Permissions Policy (Feature Policy replacement)
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '));
  
  // Prevent MIME type sniffing
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Help caches / proxies differentiate per-origin responses
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Streamply Proxy - Healthy\n');
});

app.get('/proxy-status', (req, res) => {
  res.status(200).json({
    status: 'running',
    service: 'streamply-express-proxy',
    timestamp: new Date().toISOString(),
    backend: BACKEND_URL,
    frontend: FRONTEND_URL
  });
});

// Authentication endpoints (stricter rate limiting)
// Note: /api/user/signin has per-user rate limiting in backend, so no proxy limiting needed
// app.use('/api/user/signin', authLimiter); // Removed - backend handles per-user limiting

// CSRF token endpoint - NO rate limiting (needed for all requests)
// Skip rate limiting for CSRF token endpoint to prevent chicken-and-egg problem
app.use('/api/csrf-token', (req, res, next) => {
  console.log(`🔐 CSRF token request: ${req.method} ${req.url}`);
  next();
});

// app.use('/api/user/signup', registrationLimiter); // DISABLED - No rate limiting for registration testing
app.use('/api/user/resetPassword', authLimiter);
app.use('/api/user/forgotPassword', authLimiter);

// Upload endpoints (strict rate limiting)
app.use('/api/videos/upload', uploadLimiter);
app.use('/api/videos/episodes', uploadLimiter);

// Streaming endpoints (moderate rate limiting)
app.use('/api/videos/video/hls', streamingLimiter);
app.use('/api/videos/video/stream', streamingLimiter);
app.use('/api/videos/watch', streamingLimiter);

// General API endpoints (standard rate limiting)
app.use('/api', apiLimiter);

// Proxy do backendu - wszystkie /api requesty
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] API: ${req.method} ${req.url} → ${BACKEND_URL}${proxyReq.path}`);
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Real-IP', req.ip);
    proxyReq.setHeader('X-Proxy-Source', 'streamply-express-proxy');
    
    // Forward cookies to backend
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Enhanced video streaming headers
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = ALLOWED_HEADERS.join(', ');
    proxyRes.headers['Access-Control-Expose-Headers'] = EXPOSED_HEADERS.join(', ');
    
    // Additional video streaming CORS headers
    if (req.url.includes('/video/stream')) {
      proxyRes.headers['Access-Control-Max-Age'] = '86400';
      proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
      proxyRes.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none';
    }
  },
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Proxy Error:`, err.message);
    res.status(500).json({
      error: 'Backend proxy error',
      message: 'The backend service is temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

// Proxy do frontendu (Railway) - wszystkie pozostałe requesty
app.use('/', createProxyMiddleware({
  target: FRONTEND_URL,
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    try {
      const host = new URL(FRONTEND_URL).host;
      proxyReq.setHeader('Host', host);
    } catch {}
    console.log(`[${new Date().toISOString()}] Frontend: ${req.method} ${req.url} → ${FRONTEND_URL}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = ALLOWED_HEADERS.join(', ');
    proxyRes.headers['Access-Control-Expose-Headers'] = EXPOSED_HEADERS.join(', ');
  },
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Frontend Proxy Error:`, err.message);
    res.status(502).json({
      error: 'Frontend proxy error',
      message: 'The frontend service is temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Server Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong with the proxy server',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} was not found`,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Streamply Express Proxy Server running on 0.0.0.0:${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`📋 Status check available at: http://localhost:${PORT}/proxy-status`);
  console.log(`🔄 Backend proxy: /api/* → ${BACKEND_URL}`);
  console.log(`🌐 Frontend proxy: /* → ${FRONTEND_URL}`);
  console.log(`🚫 Rate limiting enabled for API endpoints`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

export default app;