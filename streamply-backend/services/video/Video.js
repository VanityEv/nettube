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

const addVideo = async (video, videoDuration, videoThumbnailExt, resultCallback) => {
  const dbQuery = `INSERT INTO videos(title, type, seasons, genre, production_year, production_country, director, tags, descr, thumbnail, alt, video_length, grade, reviews_count, views, link, blocked_reviews) VALUES("${
    video.title
  }",'${video.type}', 0, "${video.genre}",${video.productionYear},"${video.productionCountry}","${video.director}",'${
    video.tags
  }',"${video.description}",'/${toKebabCase(video.title)}/${toKebabCase(video.title)}.${videoThumbnailExt}','${
    video.alternativeTitle
  }',${videoDuration},0,0,0,'${toKebabCase(video.title)}/${toKebabCase(video.title)}.m3u8', 0)`;
  await query(dbQuery, resultCallback);
};

const addEpisode = async (episode, resultCallback) => {
  const dbQuery = `INSERT INTO series_episodes(show_id, season, episode, episode_name, description) VALUES(${episode.show}, ${episode.season}, ${episode.episode}, "${episode.title}", "${episode.description}")`;
  await query(dbQuery, resultCallback);
};

const getEpisodes = async (id, resultCallback) => {
  const dbQuery = `SELECT season, videos.id as show_id, title as show_name, episode, episode_name, description FROM series_episodes join videos on series_episodes.show_id = videos.id WHERE series_episodes.show_id = ${id} ORDER BY season,episode;`;
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

const getProgressedVideos = async (username, resultCallback) => {
  const dbQuery = `SELECT videos.id, videos.type, videos.title, videos.thumbnail, videos.video_length, user_watching.season, user_watching.episode, user_watching.time_watched FROM user_watching join videos on videos.id = user_watching.show_id join users on users.id = user_watching.user_id WHERE username = '${username}'`;
  await query(dbQuery, resultCallback);
};

const getPopularMovies = async resultCallback => {
  const dbQuery = `SELECT * FROM videos WHERE views > 10000 AND type = 'film' ORDER BY production_year DESC, views DESC LIMIT 15`;
  await query(dbQuery, resultCallback);
};

const getPopularSeries = async resultCallback => {
  const dbQuery = `SELECT * FROM videos WHERE views > 10000 AND type = 'series' ORDER BY production_year DESC, views DESC LIMIT 15`;
  await query(dbQuery, resultCallback);
};

const getProgress = async (showID, username, resultCallback) => {
  const dbQuery = `SELECT * FROM user_watching WHERE show_id = ${showID} AND user_id = (SELECT id FROM users where username = '${username}')`
  await query(dbQuery, resultCallback);
}

const setProgressMovie = async (username, title, timestamp, resultCallback) => {
  const dbQuery = `INSERT INTO user_watching(show_id, user_id, season, episode, time_watched) VALUES((SELECT id from videos where title = '${title}'),(SELECT id FROM users where username = '${username}'), 0, NULL, ${Math.round(timestamp)})`;
  await query(dbQuery, resultCallback);
};

const updateMovieProgress = async (username, showID, timestamp, resultCallback) => {
  const dbQuery = `UPDATE user_watching SET time_watched = ${Math.round(timestamp)} WHERE show_id = ${showID} AND user_id = (SELECT id FROM users where username = '${username}')`;
  await query(dbQuery, resultCallback);
};
const updateSeriesProgress = async (username, showID, timestamp, season, episode, resultCallback) => {
  const dbQuery = `UPDATE user_watching SET time_watched = ${Math.round(timestamp)}, season = ${season}, episode = ${episode} WHERE show_id = ${showID} AND user_id = (SELECT id FROM users where username = '${username}')`;
  await query(dbQuery, resultCallback);
};

const setProgressSeries = async (username, showID, season, episode, timestamp, resultCallback) => {
  const dbQuery = `INSERT INTO user_watching(show_id, user_id, season, episode, time_watched) VALUES(${showID},(SELECT id FROM users where username = '${username}'), ${season}, ${episode}, ${Math.round(timestamp)})`;
  await query(dbQuery, resultCallback);
};

const deleteProgressedVideo = async (showID, username, resultCallback) => {
  const dbQuery = `DELETE FROM user_watching WHERE show_id = ${showID} AND user_id = (SELECT id FROM users where username = '${username}')`;
  await query(dbQuery, resultCallback);
}

export {
  getOneVideo,
  getVideosByGenre,
  getAllVideos,
  deleteVideo,
  addVideo,
  addEpisode,
  getEpisodes,
  getRecommendations,
  getProgressedVideos,
  getPopularMovies,
  getPopularSeries,
  getProgress,
  setProgressMovie,
  setProgressSeries,
  updateMovieProgress,
  updateSeriesProgress,
  deleteProgressedVideo,
};
