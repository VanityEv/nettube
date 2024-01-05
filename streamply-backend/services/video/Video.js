import query from '../db.js';
import { toKebabCase } from '../../helpers/toKebabCase.js';

const getOneVideo = async (title, requestCallback) => {
  const dbQuery = `SELECT * from videos where title = "${title}"`;
  await query(dbQuery, requestCallback);
};

const getVideosByGenre = async genre => {
  const dbQuery = `SELECT * from videos where genre = ${genre}`;
  await query(dbQuery);
};

const getAllVideos = async requestCallback => {
  const dbQuery = `SELECT * from videos`;
  await query(dbQuery, requestCallback);
};

const deleteVideo = async (title, requestCallback) => {
  const dbQuery = `DELETE FROM videos WHERE title = '${title}'`;
  await query(dbQuery, requestCallback);
};

const addVideo = async (video, resultCallback) => {
  const dbQuery = `INSERT INTO videos(title, type, genre, production_year, production_country, director, tags, descr, thumbnail, alt, grade, reviews_count,link) VALUES("${
    video.title
  }",'${video.type}',"${video.genre}",${video.productionYear},"${video.productionCountry}","${video.director}",'${
    video.tags
  }',"${video.description}",'${toKebabCase(video.title)}','${video.alternativeTitle}',0,0,'${toKebabCase(
    video.title
  )}/${toKebabCase(video.title)}.m3u8')`;
  await query(dbQuery, resultCallback);
};

const addEpisode = async (episode, resultCallback) => {
  const dbQuery = `INSERT INTO series_episodes(show_id, season, episode, episode_name, description) VALUES(${episode.show}, ${episode.season}, ${episode.episode}, "${episode.title}", "${episode.description}")`;
  await query(dbQuery, resultCallback);
};

const getEpisodes = async (id, resultCallback) => {
  const dbQuery = `SELECT season, title as show_name, episode, episode_name, description FROM series_episodes join videos on series_episodes.show_id = videos.id WHERE series_episodes.show_id = ${id} ORDER BY season,episode;`;
  await query(dbQuery, resultCallback);
};

const getRecommendations = async (username, genres, resultCallback) => {
  try {
    // Generate placeholders for genres in the IN clause
    const genresToFilter = "'" + genres.join("', '") + "'";
    const recordsPerGenre = 5;

    const dbQuery = `
      WITH RankedVideos AS (
        SELECT
          v.*,
          ROW_NUMBER() OVER (PARTITION BY v.genre ORDER BY v.views DESC, v.grade DESC) AS rn
        FROM
          videos v
        WHERE
          v.genre IN (${genresToFilter})
          AND v.id NOT IN (
            SELECT ul.video_id
            FROM user_likes ul
            JOIN users u ON ul.user_id = u.id
            WHERE u.username = '${username}'
          )
      )
      SELECT *
      FROM RankedVideos
      WHERE
        (${genres.map(genre => `genre = '${genre}' AND rn <= ${recordsPerGenre}`).join(' OR ')})
      ORDER BY genre, rn;
    `;

    await query(dbQuery, resultCallback);
  } catch (error) {
    console.error(error);
    // Handle the error as needed
  }
};

const changeVideoURL = async (title, newURL, requestCallback) => {
  const dbQuery = `UPDATE videos SET link="${newURL}" WHERE title="${title}"`;
  await query(dbQuery, requestCallback);
};

const getPopularMovies = async requestCallback => {
  const dbQuery = `SELECT * FROM videos WHERE views > 10000 AND type = 'film' ORDER BY production_year DESC, views DESC LIMIT 15`;
  await query(dbQuery, requestCallback);
};

const getPopularSeries = async requestCallback => {
  const dbQuery = `SELECT * FROM videos WHERE views > 10000 AND type = 'series' ORDER BY production_year DESC, views DESC LIMIT 15`;
  await query(dbQuery, requestCallback);
};

export {
  getOneVideo,
  getVideosByGenre,
  getAllVideos,
  deleteVideo,
  addVideo,
  addEpisode,
  getEpisodes,
  getRecommendations,
  changeVideoURL,
  getPopularMovies,
  getPopularSeries,
};
