import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import UserRouter from './services/user/UserRouter.js';
import VideosRouter from './services/video/VideoRouter.js';
import ReviewRouter from './services/review/ReviewRouter.js';
import ThumbnailRouter from './services/thumbnail/ThumbnailRouter.js';
import SecurityRouter from './routes/securityRouter.js';
import bodyParser from 'body-parser';
import { detectAttacks, limitedCsrfErrorHandler } from './middleware/advancedAttackDetection.js';
import { dosProtection } from './middleware/dosProtection.js';
import { logSecurityEvent, getRecentSecurityEvents } from './services/security/mongoLogger.js';
import { verifyToken, verifyAdmin } from './helpers/verifyToken.js';
import { getLocationFromIP } from './services/security/locationSecurity.js';
import { 
  csrfProtection, 
  csrfErrorHandler, 
  provideCsrfToken, 
  conditionalCsrfProtection 
} from './middleware/csrfProtection.js';

const app = express();
const port = process.env.PORT || 3001; // Use Heroku's PORT or default to 3001

// Advanced trust proxy configuration for security
// SECURITY: Only trust specific proxy ranges, not all proxies
if (process.env.NODE_ENV === 'production') {
  // Production: Trust specific proxy IPs/ranges only
  const trustedProxies = [
    '127.0.0.1',           // localhost
    'loopback',            // IPv6 loopback
    '::1',                 // IPv6 localhost
    '10.0.0.0/8',         // Railway internal
    '172.16.0.0/12',      // Railway internal
    '192.168.0.0/16',     // Private networks
    '100.64.0.0/10',      // Railway Carrier-grade NAT (CGNAT)
    // Add your specific proxy IPs here based on deployment platform
  ];
  app.set('trust proxy', trustedProxies);
  console.log('✅ Production trust proxy configured with Railway CGNAT ranges');
} else {
  // Development: Trust more proxy hops for local testing with tunnels
  app.set('trust proxy', true); // Trust all proxies in development for tunneling
  console.log('✅ Development trust proxy configured for tunneling (ngrok, localtunnel)');
}

// Production CORS configuration
const allowedOrigins = [
  // Production domains (replace with your actual Vercel URLs)
  'https://your-streamply-app.vercel.app',
  'https://your-admin-panel.vercel.app',
  // Railway domains
  'https://streamply-frontend-production.up.railway.app',
  'https://streamply-proxy-production.up.railway.app',
  // Development domains
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost',
  // Common dev ports
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any localhost origin for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any *.vercel.app subdomain for preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow any *.up.railway.app subdomain for Railway deployments
    if (origin.endsWith('.up.railway.app')) {
      return callback(null, true);
    }
    
    // For development - temporarily allow all origins
    console.log('CORS allowing origin:', origin);
    return callback(null, true);
    
    // callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Device-Fingerprint',
    'Cache-Control',
    'Pragma'
  ],
}));

// Force HTTPS redirect in production
app.use((req, res, next) => {
  // Skip HTTPS redirect for health check endpoints and CSRF token
  if (req.path === '/health' || req.path === '/healthz' || req.path === '/csrf-token') {
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

// Exclude webhook route from JSON parsing to preserve raw body for signature verification
app.use('/user/stripe-webhook', express.raw({type: 'application/json'}));

// ✅ HELMET.JS - SECURITY HEADERS FOR DoS/DDoS PROTECTION
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for video streaming
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: ['no-referrer', 'strict-origin-when-cross-origin'] }
}));

// ✅ DoS PROTECTION - REQUEST SIZE AND TIMEOUT LIMITS
app.use(bodyParser.json({ 
  limit: '5mb', // Reduced from 10mb to prevent memory exhaustion
  parameterLimit: 20, // Max 20 parameters per request
}));
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '5mb',
  parameterLimit: 20,
}));
app.use(cookieParser()); // Add cookie parser middleware

// ✅ IP DEBUG MIDDLEWARE (temporary for troubleshooting)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_IP_DEBUG === 'true') {
    console.log('=== IP DEBUG INFO ===');
    console.log('req.ip:', req.ip);
    console.log('req.connection?.remoteAddress:', req.connection?.remoteAddress);
    console.log('req.socket?.remoteAddress:', req.socket?.remoteAddress);
    console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('X-Real-IP:', req.headers['x-real-ip']);
    console.log('CF-Connecting-IP:', req.headers['cf-connecting-ip']);
    console.log('Trust proxy:', req.app.get('trust proxy'));
    console.log('URL:', req.url);
    console.log('====================');
  }
  next();
});

// ✅ DoS/DDoS PROTECTION - Must be before other middleware
app.use(dosProtection); // Connection limiting, Slowloris protection, burst protection

app.use(detectAttacks); // Advanced attack detection with rate limiting

// ✅ CSRF PROTECTION SETUP
// CSRF token endpoint (must be before protected routes)
app.get('/csrf-token', csrfProtection, provideCsrfToken);

// Apply CSRF protection to state-changing operations
app.use(conditionalCsrfProtection);

// Limited CSRF error handler (reduces log spam)
app.use(limitedCsrfErrorHandler);

// ✅ HEALTH CHECK ENDPOINTS
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'streamply-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: port,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ DEVELOPMENT RATE LIMIT CLEAR ENDPOINT
if (process.env.NODE_ENV === 'development') {
  app.post('/dev/clear-rate-limits/:ip?', async (req, res) => {
    try {
      const { rateLimiters } = await import('./middleware/rateLimit.js');
      const targetIP = req.params.ip || req.query.ip;
      
      if (targetIP) {
        // Clear specific IP
        for (const [name, limiter] of Object.entries(rateLimiters)) {
          await limiter.delete(targetIP);
        }
        res.json({ 
          success: true, 
          message: `Rate limits cleared for IP: ${targetIP}`,
          cleared: Object.keys(rateLimiters)
        });
      } else {
        // Clear all rate limits
        for (const [name, limiter] of Object.entries(rateLimiters)) {
          await limiter.delete();
        }
        res.json({ 
          success: true, 
          message: 'All rate limits cleared',
          cleared: Object.keys(rateLimiters)
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
}

// ✅ PRODUCTION RATE LIMIT CLEAR (own IP only)
app.get('/api/clear-my-rate-limits', async (req, res) => {
  try {
    const { getSecureClientIP } = await import('./security/secureIPDetection.js');
    const { rateLimiters } = await import('./middleware/rateLimit.js');
    const clientIP = getSecureClientIP(req);
    
    // Clear rate limits for requesting IP only
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      await limiter.delete(clientIP);
    }
    
    res.json({ 
      success: true, 
      message: `Rate limits cleared for your IP: ${clientIP}`,
      cleared: Object.keys(rateLimiters)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'streamply-backend-api',
    timestamp: new Date().toISOString(),
    routes: {
      users: '/user',
      videos: '/videos', 
      reviews: '/reviews',
      thumbnails: '/thumbnails',
      security: '/admin/security'
    }
  });
});

app.get('/status', (req, res) => {
  res.status(200).send('Streamply Backend - Running ✅');
});

// ✅ GEOLOCATION TEST ENDPOINT
import { getRealClientIP, getIPDebugInfo } from './helpers/ipDetection.js';

app.get('/test-geolocation', (req, res) => {
  const detectedIP = getRealClientIP(req); // Use proper IP detection
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  console.log('=== BACKEND GEOLOCATION TEST ===');
  console.log('req.ip:', req.ip);
  console.log('req.connection.remoteAddress:', req.connection.remoteAddress);
  console.log('X-Forwarded-For header:', forwardedFor);
  console.log('X-Real-IP header:', realIP);
  console.log('Detected IP:', detectedIP);
  
  // Test geolocation
  const location = getLocationFromIP(detectedIP);
  console.log('Geolocation result:', location);
  
  res.status(200).json({
    service: 'streamply-backend',
    geolocationTest: {
      detectedIP,
      headers: {
        'x-forwarded-for': forwardedFor,
        'x-real-ip': realIP,
        'user-agent': req.headers['user-agent'],
        'x-proxy-source': req.headers['x-proxy-source']
      },
      expressIP: req.ip,
      connectionIP: req.connection.remoteAddress,
      location,
      timestamp: new Date().toISOString(),
      proxyConfiguration: {
        trustProxy: req.app.get('trust proxy'),
        hasForwarded: !!forwardedFor,
        hasRealIP: !!realIP,
        hasProxySource: !!req.headers['x-proxy-source']
      }
    }
  });
});

// ✅ IP DETECTION DEBUG ENDPOINT
import testIPDetection from './test/testIPDetection.js';
app.get('/test-ip-detection', testIPDetection);

// ✅ OTP SYSTEM DEBUG ENDPOINT  
import debugOTPSystem from './test/debugOTPSystem.js';
app.get('/debug-otp-system', debugOTPSystem);

// ✅ ATTACK DETECTION TEST ENDPOINT
import testAttackDetection from './test/testAttackDetection.js';
app.get('/test-attack-detection', testAttackDetection);

app.use('/user', UserRouter);
app.use('/videos', VideosRouter);
app.use('/reviews', ReviewRouter);
app.use('/thumbnails', ThumbnailRouter);
app.use('/admin/security', SecurityRouter);
app.use('/movies', express.static('movies'));
app.use('/images', express.static('images'));

// Monitoring dashboard endpoint (admin only, properly secured)
app.get('/admin/security-dashboard', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const events = await getRecentSecurityEvents();
    res.status(200).json({ 
      result: 'SUCCESS',
      events,
      timestamp: new Date().toISOString(),
      admin: req.user.username
    });
  } catch (error) {
    console.warn('Failed to get security events:', error.message);
    res.status(500).json({ 
      result: 'ERROR',
      events: [], 
      error: 'Security logging unavailable',
      message: error.message
    });
  }
});

// TEMPORARY: Complete Redis flush (DANGER - clears everything)
app.post('/flush-redis-temp', async (req, res) => {
  try {
    const redisClient = await import('./services/cache/RedisClient.js');
    
    // Flush all Redis data
    await redisClient.default.flushall();
    
    res.json({
      success: true,
      message: 'Redis completely flushed - all rate limiting data cleared',
      warning: 'This cleared ALL Redis data',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to flush Redis:', error);
    res.status(500).json({
      error: 'Failed to flush Redis',
      message: error.message
    });
  }
});

// TEMPORARY: Simple Redis clearing endpoint (remove after use)
app.post('/clear-redis-temp', async (req, res) => {
  try {
    const { rateLimiters } = await import('./middleware/rateLimit.js');
    
    // Clear all rate limiters
    const results = {};
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      try {
        // Clear all keys for this rate limiter - use a wildcard approach
        // Since we can't easily iterate all keys, we'll reset the limiter
        const keys = ['162.220.232.63', '162.220.232.119', '162.220.232.49']; // Known blocked IPs
        for (const key of keys) {
          await limiter.delete(key);
          await limiter.delete(`login:${key}`);
        }
        results[name] = 'cleared known IPs';
      } catch (err) {
        results[name] = `error: ${err.message}`;
      }
    }
    
    res.json({
      success: true,
      message: 'Rate limits cleared for known blocked IPs',
      cleared: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to clear rate limits:', error);
    res.status(500).json({
      error: 'Failed to clear rate limits',
      message: error.message
    });
  }
});

// TEMPORARY: Redis status check endpoint
app.get('/redis-status-temp', async (req, res) => {
  try {
    const redisClient = await import('./services/cache/RedisClient.js');
    
    // Get Redis info
    const info = await redisClient.default.info();
    const keys = await redisClient.default.keys('*');
    
    // Get some key values for debugging
    const keyValues = {};
    for (const key of keys.slice(0, 10)) { // Limit to first 10 keys
      try {
        keyValues[key] = await redisClient.default.get(key);
      } catch (e) {
        keyValues[key] = `Error: ${e.message}`;
      }
    }
    
    res.json({
      success: true,
      status: 'Redis is connected',
      keysCount: keys.length,
      sampleKeys: keys.slice(0, 20),
      sampleValues: keyValues,
      info: info.split('\n').slice(0, 10).join('\n'), // First 10 lines of Redis info
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis status check failed:', error);
    res.status(500).json({
      error: 'Redis connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin endpoint to clear Redis rate limiting data
app.post('/admin/clear-rate-limits', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rateLimiters } = await import('./middleware/rateLimit.js');
    
    // Clear all rate limiters
    const results = {};
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      try {
        // Clear all keys for this rate limiter
        await limiter.delete(req.body.key || req.ip); // Clear specific key or admin's IP
        results[name] = 'cleared';
      } catch (err) {
        results[name] = `error: ${err.message}`;
      }
    }
    
    // Log the admin action
    await logSecurityEvent({
      type: 'admin_action',
      message: 'Rate limits cleared by admin',
      admin: req.user.username,
      ip: req.ip,
      timestamp: new Date(),
      details: { cleared: results }
    });
    
    res.json({
      success: true,
      message: 'Rate limits cleared',
      admin: req.user.username,
      cleared: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to clear rate limits:', error);
    res.status(500).json({
      error: 'Failed to clear rate limits',
      message: error.message
    });
  }
});

// Example: log server start event
async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      
      // Log server start event (async, don't block server startup)
      logSecurityEvent({ type: 'server_start', message: `Server started on port ${port}` })
        .catch(err => console.warn('Failed to log server start:', err.message));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
