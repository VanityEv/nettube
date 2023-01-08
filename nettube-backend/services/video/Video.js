import query from "../db.js";

const getOneVideo = async (title, requestCallback) => {
	const dbQuery = `SELECT * from videos where title = "${title}"`;
	await query(dbQuery, requestCallback);
};

const getVideosByGenre = async (genre) => {
	const dbQuery = `SELECT * from videos where genre = ${genre}`;
	await query(dbQuery);
};

const getAllVideos = async (requestCallback) => {
	const dbQuery = `SELECT * from videos`;
	await query(dbQuery, requestCallback);
};

const deleteVideo = async (title, requestCallback) => {
	const dbQuery = `DELETE FROM videos WHERE title = '${title}'`;
	await query(dbQuery, requestCallback);
};

const addVideo = async (
	title,
	type,
	genre,
	production_year,
	production_country,
	director,
	age_restriction,
	tags,
	descr,
	thumbnail,
	alt,
	tier,
	link,
	resultCallback
) => {
	const dbQuery = `INSERT INTO videos(title, type, genre, production_year, production_country, director, age_restriction, tags, descr, thumbnail, alt, grade, tier, reviews_count,link) VALUES("${title}",'${type}',"${genre}",${production_year},"${production_country}","${director}",${age_restriction},'${tags}',"${descr}",'${thumbnail}','${alt}',0,${tier},0,'${link}')`;
	await query(dbQuery, resultCallback);
};

export { getOneVideo, getVideosByGenre, getAllVideos, deleteVideo, addVideo };
