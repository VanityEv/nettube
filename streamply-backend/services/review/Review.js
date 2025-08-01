// SECURITY: Prisma-based Review service to replace vulnerable raw SQL queries
// This prevents SQL injection attacks through parameterized queries

import prisma from '../prisma.js';

const getReviewByShow = async (show_id, requestCallback) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { video_id: show_id }, // Use video_id (UUID string) instead of showId (integer)
      include: {
        user: {
          select: { username: true }
        }
      }
    });
    
    // Transform to match expected format
    const formattedReviews = reviews.map(review => ({
      ...review,
      username: review.user.username
    }));
    
    requestCallback(formattedReviews);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getAllReviews = async (requestCallback) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: { username: true }
        }
      }
    });
    
    const formattedReviews = reviews.map(review => ({
      ...review,
      username: review.user.username
    }));
    
    requestCallback(formattedReviews);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getReviewsByUser = async (username, requestCallback) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        user: { username: username }
      },
      include: {
        video: {
          select: { title: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    
    const formattedReviews = reviews.map(review => ({
      comment: review.comment,
      grade: review.grade,
      title: review.video.title,
      comment_date: review.commentDate
    }));
    
    requestCallback(formattedReviews);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const addComment = async (data, requestCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: data.username }
    });
    
    if (!user) {
      requestCallback({ error: 'User not found' });
      return;
    }
    
    const comment = await prisma.review.create({
      data: {
        comment: data.comment,
        video_id: data.show_id, // Use video_id (UUID string)
        user_id: user.id,       // Use user_id (UUID string)
        grade: null
      }
    });
    
    requestCallback(comment);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const addReview = async (data, requestCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: data.username }
    });
    
    if (!user) {
      requestCallback({ error: 'User not found' });
      return;
    }
    
    const review = await prisma.review.create({
      data: {
        comment: data.comment,
        grade: parseFloat(data.grade),
        video_id: data.show_id, // Use video_id (UUID string)
        user_id: user.id        // Use user_id (UUID string)
      }
    });
    
    requestCallback(review);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const removeReview = async (data, requestCallback) => {
  try {
    const result = await prisma.review.delete({
      where: { id: data.id } // Review ID is already a UUID string
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getShowLikes = async (data, requestCallback) => {
  try {
    const likes = await prisma.userLike.findMany({
      where: { video_id: data.show_id },
      include: {
        user: {
          select: { username: true }
        }
      }
    });
    
    const formattedLikes = likes.map(like => ({
      username: like.user.username
    }));
    
    requestCallback(formattedLikes);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getUserReviews = async (username, requestCallback) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        user: { username: username }
      },
      include: {
        video: {
          select: { title: true }
        }
      }
    });
    
    const formattedReviews = reviews.map(review => ({
      ...review,
      title: review.video.title
    }));
    
    requestCallback(formattedReviews);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getIsBlocked = async (data, requestCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: data.id }, // User ID is already a UUID string
      select: { isBlocked: true }
    });
    
    if (user) {
      requestCallback([{ isBlocked: user.isBlocked }]);
    } else {
      requestCallback([{ isBlocked: false }]);
    }
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const setIsBlocked = async (data, requestCallback) => {
  try {
    await prisma.user.update({
      where: { id: data.id }, // User ID is already a UUID string
      data: { isBlocked: data.targetStatus }
    });
    
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const setShowLike = async (data, requestCallback) => {
  try {
    // First get the user ID from username
    const user = await prisma.user.findUnique({
      where: { username: data.username },
      select: { id: true }
    });

    if (!user) {
      requestCallback({ error: 'User not found' });
      return;
    }

    const existingLike = await prisma.userLike.findFirst({
      where: {
        user_id: user.id,
        video_id: data.video_id
      }
    });

    if (existingLike) {
      // For likes, we just delete if it exists (toggle behavior)
      await prisma.userLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      await prisma.userLike.create({
        data: {
          user_id: user.id,
          video_id: data.video_id
        }
      });
    }
    
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

export {
  getReviewByShow,
  getAllReviews,
  getReviewsByUser,
  addComment,
  addReview,
  removeReview,
  getShowLikes,
  getUserReviews,
  getIsBlocked,
  setIsBlocked,
  setShowLike,
};
