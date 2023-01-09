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

const addVideo = async (video, resultCallback) => {
  const dbQuery = `INSERT INTO videos(title, type, genre, production_year, production_country, director, age_restriction, tags, descr, thumbnail, alt, grade, tier, reviews_count,link) VALUES("${video.title}",'${video.type}',"${video.genre}",${video.production_year},"${video.production_country}","${video.director}",${video.age_restriction},'${video.tags}',"${video.descr}",'${video.thumbnail}','${video.alt}',0,${video.tier},0,'${video.link}')`;
  await query(dbQuery, resultCallback);
};

const changeVideoURL = async (title, newURL, requestCallback) => {
  const dbQuery = `UPDATE videos SET link="${newURL}" WHERE title="${title}"`;
  await query(dbQuery, requestCallback);
};

export {
  getOneVideo,
  getVideosByGenre,
  getAllVideos,
  deleteVideo,
  addVideo,
  changeVideoURL,
};
