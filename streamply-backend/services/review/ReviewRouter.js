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

const ReviewsRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

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
  const show_id = req.params.showId;
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
    const username = req.params.username;
    await getReviewsByUser(username, userReviews => {
      res.status(200).json({ result: 'SUCCESS', reviews: userReviews });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ReviewsRouter.get('/showLikes/:showId', async (req, res) => {
  const show_id = req.params.showId;
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
    await setShowLike({ username, value, video_id }, () => {
      res.status(200).json({ result: 'SUCCESS' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ReviewsRouter.post('/userReviews/addReview', verifyToken, verifyUser, async (req, res) => {
  const data = {
    comment: req.body.comment,
    show_id: req.body.show_id,
    username: req.body.username,
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
    id: req.body.id,
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
