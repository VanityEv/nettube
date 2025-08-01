// proxy-server.js - Express Proxy dla Windows (alternatywa dla Nginx)
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PROXY_PORT || 80;

console.log('🚀 Starting Streamply Express Proxy Server...');

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
  // Use X-Forwarded-For header for proxied requests
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.ip;
  },
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

// Rate limiting middleware - Different limits for different endpoints
const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests per minute
  'Too many API requests from this IP, please try again later.'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 auth attempts per 15 minutes
  'Too many authentication attempts, please try again later.'
);

const streamingLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  50, // 50 streaming requests per minute
  'Too many streaming requests, please wait before trying again.'
);

const uploadLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  5, // 5 uploads per 5 minutes
  'Too many upload requests, please wait before trying again.'
);

// CORS dla wszystkich requestów - OWASP ZAP compliant
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://your-streamply-app.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost',
      // Ngrok domains (for development)
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
      /^https:\/\/[a-zA-Z0-9-]+\.loca\.lt$/,
      /^https:\/\/[a-zA-Z0-9-]+\.cfargotunnel\.com$/,
      // Vercel preview deployments
      /^https:\/\/.*\.vercel\.app$/
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Authorization', 
    'Content-Type', 
    'X-Device-Fingerprint',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'If-Modified-Since'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'Content-Type',
    'X-Content-Type-Options',
    'X-Frame-Options'
  ],
  maxAge: 86400 // 24 hours preflight cache
}));

// Security headers middleware for OWASP ZAP compliance
app.use((req, res, next) => {
  // OWASP 2025 Required Headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Powered-By', 'Streamply-Proxy');
  
  // Strict Transport Security (HSTS) for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy (CSP) - ZAP compliance
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
    backend: 'http://localhost:3001',
    frontend: 'https://your-streamply-app.vercel.app'
  });
});

// Authentication endpoints (stricter rate limiting)
app.use('/api/signin', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/resetPassword', authLimiter);
app.use('/api/forgotPassword', authLimiter);

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
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/' // usuń /api prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log requests for debugging
    console.log(`[${new Date().toISOString()}] API: ${req.method} ${req.url} → http://localhost:3001${proxyReq.path}`);
    
    // Add security headers to backend requests
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Real-IP', req.ip);
    proxyReq.setHeader('X-Proxy-Source', 'streamply-express-proxy');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Ensure CORS headers on backend responses
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Device-Fingerprint';
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

// Proxy do frontendu (Vercel) - wszystkie pozostałe requesty
app.use('/', createProxyMiddleware({
  target: 'https://your-streamply-app.vercel.app',
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    // Set proper host header for Vercel
    proxyReq.setHeader('Host', 'your-streamply-app.vercel.app');
    console.log(`[${new Date().toISOString()}] Frontend: ${req.method} ${req.url} → Vercel`);
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
  console.log(`✅ Streamply Express Proxy Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`📋 Status check available at: http://localhost:${PORT}/proxy-status`);
  console.log(`🔄 Backend proxy: /api/* → http://localhost:3001`);
  console.log(`🌐 Frontend proxy: /* → https://your-streamply-app.vercel.app`);
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
