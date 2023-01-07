import query from "../db.js";

const getReviewByShow = async (show_id, requestCallback) => {
	const dbQuery = `SELECT reviews.*, username from reviews INNER JOIN users on reviews.user_id=users.id where show_id = ${show_id}`;
	await query(dbQuery, requestCallback);
};

const getAllReviews = async (requestCallback) => {
	const dbQuery = `SELECT reviews.*, username from reviews inner join users on reviews.user_id=users.id`;
	await query(dbQuery, requestCallback);
};

const getReviewsByUser = async (username, requestCallback) => {
	const dbQuery = `SELECT reviews.comment,reviews.grade, videos.title from reviews JOIN videos ON reviews.show_id = videos.id WHERE user_id = (SELECT id FROM users WHERE username = "${username}") ORDER BY reviews.id DESC`;
	await query(dbQuery, requestCallback);
};

const addComment = async (data, requestCallback) => {
	console.log("a");
	const dbQuery = `INSERT INTO reviews (comment, grade, show_id, user_id) values ("${data.comment}",null, ${data.show_id}, (select id from users where username = "${data.username}"))`;
	await query(dbQuery, requestCallback);
};

export { getAllReviews, getReviewByShow, getReviewsByUser, addComment };
