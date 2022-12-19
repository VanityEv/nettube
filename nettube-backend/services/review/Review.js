import query from "../db.js";

const getReviewByShow = async (show_id) => {
  const dbQuery = `SELECT * from reviews where show_id = ${show_id}`;
  const result = await query(dbQuery);
  return result;
};

const getAllReviews = async (requestCallback) => {
  const dbQuery = `SELECT * from reviews`;
  await query(dbQuery, requestCallback);
};

const getReviewsByUser = async (username, requestCallback) => {
  const dbQuery = `SELECT reviews.*, videos.title from reviews JOIN videos ON reviews.show_id = videos.id WHERE user_id = (SELECT id FROM users WHERE username = "${username}")`;
  await query(dbQuery, requestCallback);
};

export { getAllReviews, getReviewByShow, getReviewsByUser };
