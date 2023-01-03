import query from "../db.js";

const createUser = async (
  {
    username,
    fullname,
    password,
    birthdate,
    email,
    subscription,
    registerToken,
  },
  requestCallback
) => {
  const dbQuery = `INSERT INTO users (username, fullname, password, birthdate, subscription, confirmed, email, register_token)
                     VALUES ("${username}", "${fullname}", "${password}", "${birthdate}", ${subscription}, 0, "${email}", "${registerToken}");`;
  await query(dbQuery, requestCallback);
};
const findOneUser = async (username, requestCallback) => {
  const dbQuery = `SELECT * from users WHERE username = "${username}"`;
  await query(dbQuery, requestCallback);
};
const isUserInDB = async (username, requestCallback) => {
  const dbQuery = `SELECT COUNT(*) as count from users WHERE username = "${username}"`;
  await query(dbQuery, requestCallback);
};
const confirmUser = async (token, requestCallback) => {
  const dbQuery = `UPDATE users SET confirmed=1 WHERE register_token = "${token}"`;
  await query(dbQuery, requestCallback);
};
const updateUser = async (param, value, username, requestCallback) => {
  const dbQuery = `UPDATE users SET ${param}="${value}" WHERE username = "${username}"`;
  await query(dbQuery, requestCallback);
};
const userLikes = async (username, requestCallback) => {
  const dbQuery = `SELECT videos.id, videos.title, videos.thumbnail, videos.alt FROM videos WHERE id IN(SELECT video_id FROM user_likes WHERE user_id=(SELECT id FROM users WHERE username = "${username}") )`;
  await query(dbQuery, requestCallback);
};

const checkOccurency = async (param, value, requestCallback) => {
  const dbQuery = `SELECT COUNT(*) as 'exists' FROM users WHERE ${param} = "${value}"`;
  await query(dbQuery, requestCallback);
};

const deleteLike = async (username, show_title, requestCallback) => {
  const dbQuery = `DELETE FROM user_likes WHERE user_id = (SELECT id from users where username = "${username}") AND video_id = (SELECT id from videos WHERE title = "${show_title}")`;
  await query(dbQuery, requestCallback);
};

const addLike = async (username, show_title, requestCallback) => {
  const dbQuery = `INSERT INTO user_likes(video_id,user_id) VALUES((SELECT id FROM videos WHERE title="${show_title}"), (SELECT id FROM users WHERE username="${username}"))`;
  await query(dbQuery, requestCallback);
};

export {
  createUser,
  findOneUser,
  confirmUser,
  isUserInDB,
  updateUser,
  userLikes,
  checkOccurency,
  deleteLike,
  addLike,
};
