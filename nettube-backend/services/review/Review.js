import query from "../db.js";

const getReviewByShow = async (show_id) => {
	const dbQuery = `SELECT * from reviews where show_id = ${show_id}`;
	const result = await query(dbQuery);
	return result;
};

const getAllReviews = async (resultCallback) => {
	const dbQuery = `SELECT * from reviews`;
	await query(dbQuery, resultCallback);
};

export { getAllReviews, getReviewByShow};
