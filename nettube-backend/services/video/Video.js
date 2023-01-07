import query from "../db.js";

const getOneVideo = async (title) => {
  const dbQuery = `SELECT * from videos where title = ${title}`;
  const result = await query(dbQuery);
  return result;
};

const getVideosByGenre = async (genre) => {
  const dbQuery = `SELECT * from videos where genre = ${genre}`;
  const result = await query(dbQuery);
  return result;
};

const getAllVideos = async (resultCallback) => {
  const dbQuery = `SELECT * from videos`;
  await query(dbQuery, resultCallback);
};

const deleteVideo = async (title, resultCallback) => {
  const dbQuery = `DELETE FROM videos WHERE title = '${title}'`;
  await query(dbQuery, resultCallback);
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
