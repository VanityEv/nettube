import query from '../db.js';

const getReviewByShow = async (show_id, requestCallback) => {
  const dbQuery = `SELECT reviews.*, username from reviews INNER JOIN users on reviews.user_id=users.id where show_id = ${show_id}`;
  await query(dbQuery, requestCallback);
};

const getAllReviews = async requestCallback => {
  const dbQuery = `SELECT reviews.*, username from reviews inner join users on reviews.user_id=users.id`;
  await query(dbQuery, requestCallback);
};

const getReviewsByUser = async (username, requestCallback) => {
  const dbQuery = `SELECT reviews.comment,reviews.grade, videos.title, reviews.comment_date from reviews JOIN videos ON reviews.show_id = videos.id WHERE user_id = (SELECT id FROM users WHERE username = "${username}") ORDER BY reviews.id DESC`;
  await query(dbQuery, requestCallback);
};

const addComment = async (data, requestCallback) => {
  const dbQuery = `INSERT INTO reviews (comment, grade, show_id, user_id) values ("${data.comment}",null, ${data.show_id}, (select id from users where username = "${data.username}"))`;
  await query(dbQuery, requestCallback);
};

const addReview = async (data, requestCallback) => {
  const dbQuery = `INSERT INTO reviews (comment, grade, show_id, user_id) values ("${data.comment}",${data.grade}, ${data.show_id}, (select id from users where username = "${data.username}"))`;
  await query(dbQuery, requestCallback);
};

const removeReview = async (data, requestCallback) => {
  const dbQuery = `DELETE FROM reviews WHERE id = ${data.id}`;
  await query(dbQuery, requestCallback);
};

const getShowLikes = async (data, requestCallback) => {
  const dbQuery = `select user_id, username from user_likes inner join users on users.id=user_likes.user_id where video_id=${data.show_id}`;
  await query(dbQuery, requestCallback);
};

const setShowLike = async (data, requestCallback) => {
  let dbQuery = `select *, username from user_likes inner join users on user_likes.user_id=users.id where video_id=${data.video_id} AND username="${data.username}"`;
  await query(dbQuery, async rows => {
    if (rows.length === 0) {
      dbQuery = `insert into user_likes (video_id, user_id) values (${data.video_id}, (select id from users where username = "${data.username}"))`;
    } else {
      dbQuery = `DELETE FROM user_likes WHERE user_id = (select id from users where username = "${data.username}")`;
    }
    await query(dbQuery, requestCallback);
  });
};

const getIsBlocked = async (data, requestCallback) => {
  const dbQuery = `select blocked_reviews from videos where id=${data.id}`;
  await query(dbQuery, requestCallback);
};

const setIsBlocked = async (data, requestCallback) => {
  const dbQuery = `update videos set blocked_reviews=${data.targetStatus} where id=${data.id}`;
  await query(dbQuery, requestCallback);
};

export {
  getAllReviews,
  getReviewByShow,
  getReviewsByUser,
  addComment,
  getShowLikes,
  setShowLike,
  addReview,
  removeReview,
  getIsBlocked,
  setIsBlocked,
};
