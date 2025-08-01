import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import UserRouter from './services/user/UserRouter.js';
import VideosRouter from './services/video/VideoRouter.js';
import ReviewRouter from './services/review/ReviewRouter.js';
import ThumbnailRouter from './services/thumbnail/ThumbnailRouter.js';
import SecurityRouter from './routes/securityRouter.js';
import bodyParser from 'body-parser';
import { logAttack } from './middleware/logAttack.js';
import { logSecurityEvent, getRecentSecurityEvents } from './services/security/mongoLogger.js';

const app = express();
const port = process.env.PORT || 3001; // Use Heroku's PORT or default to 3001

// Production CORS configuration
const allowedOrigins = [
  // Production domains (replace with your actual Vercel URLs)
  'https://your-streamply-app.vercel.app',
  'https://your-admin-panel.vercel.app',
  // Development domains
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost',
  // Common dev ports
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  // Ngrok tunnel
  'https://64a7a6d1a3bd.ngrok-free.app',
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
    
    // Allow ngrok domains
    if (origin.includes('.ngrok') || origin.includes('ngrok-free.app')) {
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
    'Pragma',
    'ngrok-skip-browser-warning'
  ],
}));

// Exclude webhook route from JSON parsing to preserve raw body for signature verification
app.use('/user/stripe-webhook', express.raw({type: 'application/json'}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(logAttack);

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

app.use('/user', UserRouter);
app.use('/videos', VideosRouter);
app.use('/reviews', ReviewRouter);
app.use('/thumbnails', ThumbnailRouter);
app.use('/admin/security', SecurityRouter);
app.use('/movies', express.static('movies'));
app.use('/images', express.static('images'));

// Monitoring dashboard endpoint (admin only, should be protected in production)
app.get('/admin/security-dashboard', async (req, res) => {
  try {
    // TODO: Add admin authentication/authorization
    const events = await getRecentSecurityEvents();
    res.status(200).json({ events });
  } catch (error) {
    console.warn('Failed to get security events:', error.message);
    res.status(200).json({ events: [], error: 'Security logging unavailable' });
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
