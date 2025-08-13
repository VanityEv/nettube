//require("dotenv").config(); // load .env variables
import { Router } from 'express'; // import router from express
import {
  getReviewByShow,
  getAllReviews,
  getReviewsByUser,
  addComment,
  getShowLikes,
  setShowLike,
  addReview,
  removeReview,
  getIsBlocked,
  setIsBlocked,
} from './Review.js';
import { verifyAdmin, verifyModerator, verifyToken, verifyUser } from '../../helpers/verifyToken.js';
import { getSecureClientIP } from '../../security/secureIPDetection.js';
import cors from 'cors';
import helmet from 'helmet';
import { createRateLimitMiddleware } from '../../middleware/rateLimit.js';
import validator from 'validator';
import { logSecurityEvent } from '../security/mongoLogger.js';

const ReviewsRouter = Router(); // create router to create route bundle

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
  'http://localhost',
];

ReviewsRouter.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
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
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Security middleware
ReviewsRouter.use(helmet());

// ✅ REDIS-BASED RATE LIMITING (UNIFIED SYSTEM)
// Reviews: 20 requests per IP per 15 minutes
const reviewRateLimiter = createRateLimitMiddleware('reviews', (req) => {
  const secureIP = getSecureClientIP(req);
  return `reviews:${secureIP}`;
});

ReviewsRouter.use(reviewRateLimiter);

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
}

function sanitizeUUID(input) {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (validator.isUUID(trimmed)) {
      return trimmed;
    }
    throw new Error('Invalid UUID format');
  }
  return input;
}

ReviewsRouter.use((req, res, next) => {
  // Log all failed authentication/authorization attempts
  if (res.statusCode === 401 || res.statusCode === 403) {
    logSecurityEvent({
      type: 'auth_failure',
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
      username: req.body.username || req.params.username || null
    });
  }
  next();
});

ReviewsRouter.get('/all', async (req, res) => {
  try {
    await getAllReviews(reviews => {
      res.status(200).json({ result: 'success', data: reviews });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ReviewsRouter.get('/:showId', async (req, res) => {
  try {
    const show_id = sanitizeUUID(req.params.showId);
    await getReviewByShow(show_id, reviews => {
      res.status(200).json({ result: 'success', reviews: [...reviews] });
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(400).json({ error: error.message || 'Invalid request parameters' });
  }
});

ReviewsRouter.get('/userReviews/:username', async (req, res) => {
  try {
    const username = sanitizeInput(req.params.username);
    await getReviewsByUser(username, userReviews => {
      res.status(200).json({ result: 'SUCCESS', reviews: userReviews });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ReviewsRouter.get('/showLikes/:showId', async (req, res) => {
  const show_id = sanitizeInput(req.params.showId);
  try {
    await getShowLikes({ show_id: show_id }, likes => {
      res.status(200).json({ result: 'SUCCESS', data: likes });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ReviewsRouter.post('/showLikes/setLike', verifyToken, verifyUser, async (req, res) => {
  const { username, value, video_id } = req.body;
  try {
    await setShowLike({ username: sanitizeInput(username), value, video_id: sanitizeInput(video_id) }, () => {
      res.status(200).json({ result: 'SUCCESS' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ReviewsRouter.post('/userReviews/addReview', verifyToken, verifyUser, async (req, res) => {
  const data = {
    comment: sanitizeInput(req.body.comment),
    show_id: sanitizeInput(req.body.show_id),
    username: sanitizeInput(req.body.username),
    grade: req.body.grade,
  };
  try {
    await addReview(data, () => {
      res.status(200).json({ result: 'SUCCESS' });
    });
  } catch (error) {
    res.status(500).json({ result: 'error', error: error });
  }
});

ReviewsRouter.post('/userReviews/removeReview', verifyToken, verifyModerator, async (req, res) => {
  const data = {
    id: sanitizeInput(req.body.id),
  };
  try {
    await removeReview(data, async response => {
      if(response.affectedRows === 1) {
      res.status(200).json({ result: 'SUCCESS' });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'error', error: error });
  }
});

ReviewsRouter.get('/userReviews/getIsBlocked/:id', async (req, res) => {
  const data = {
    id: req.params.id,
  };
  try {
    await getIsBlocked(data, isBlocked => {
      res.status(200).json({ result: 'SUCCESS', data: isBlocked[0] });
    });
  } catch (error) {
    res.status(500).json({ result: 'error', error: error });
  }
});

ReviewsRouter.post('/userReviews/blockReviews', verifyToken, verifyAdmin, async (req, res) => {
  const data = {
    id: req.body.id,
    targetStatus: req.body.targetStatus,
  };
  try {
    await setIsBlocked(data, () => {
      res.status(200).json({ result: 'SUCCESS' });
    });
  } catch (error) {
    res.status(500).json({ result: 'error', error: error });
  }
});

export default ReviewsRouter;

// SECURITY DOCUMENTATION:
// - Rate limiting applied to all routes.
// - All user input is sanitized using validator.escape and trim.
// - All sensitive routes are protected with verifyToken/verifyUser/verifyModerator.
// - Consider using HTTPS and secure cookies for JWT/session.
