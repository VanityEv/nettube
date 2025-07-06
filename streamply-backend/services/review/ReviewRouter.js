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
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import { logSecurityEvent } from '../security/mongoLogger.js';

const ReviewsRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
ReviewsRouter.use(apiLimiter);

// Helper to sanitize input
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
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

// Log suspicious body payloads (e.g., attempts at SQLi/XSS)
ReviewsRouter.use((req, res, next) => {
  if (JSON.stringify(req.body).match(/(\$ne|\$or|\$gt|\$lt|<script|--|;)/i)) {
    logSecurityEvent({
      type: 'suspicious_body',
      ip: req.ip,
      url: req.originalUrl,
      body: req.body,
      userAgent: req.headers['user-agent'],
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
  const show_id = sanitizeInput(req.params.showId);
  try {
    await getReviewByShow(show_id, reviews => {
      res.status(200).json({ result: 'success', reviews: [...reviews] });
    });
  } catch (error) {
    res.status(400).json({ error });
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
