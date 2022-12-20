import query from "../db.js";

const getReviewByShow = async (show_id, requestCallback) => {
  const dbQuery = `SELECT * from reviews where show_id = ${show_id}`;
  await query(dbQuery, requestCallback);
};

const getAllReviews = async (requestCallback) => {
  const dbQuery = `SELECT * from reviews`;
  await query(dbQuery, requestCallback);
};

const getReviewsByUser = async (username, requestCallback) => {
  const dbQuery = `SELECT reviews.comment,reviews.grade, videos.title from reviews JOIN videos ON reviews.show_id = videos.id WHERE user_id = (SELECT id FROM users WHERE username = "${username}")`;
  await query(dbQuery, requestCallback);
};

export { getAllReviews, getReviewByShow, getReviewsByUser };
