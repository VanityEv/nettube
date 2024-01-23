import query from '../db.js';

const createUser = async (
  { username, fullname, password, birthdate, email, subscription, registerToken },
  requestCallback
) => {
  const dbQuery = `INSERT INTO users (username, fullname, password, birthdate, confirmed, email, register_token, account_type, register_date, last_login, reset_token)
                     VALUES ("${username}", "${fullname}", "${password}", "${birthdate}", 0, "${email}", "${registerToken}", 1, NOW(), NOW(), NULL);`;
  await query(dbQuery, requestCallback);
};
const getAllUsers = async requestCallback => {
  const dbQuery = `SELECT id, username, email, fullname, last_login, account_type from users ORDER BY last_login DESC`;
  await query(dbQuery, requestCallback);
};
const findOneUser = async (username, requestCallback) => {
  const dbQuery = `SELECT * from users WHERE username = "${username}"`;
  await query(dbQuery, requestCallback);
};

const findOneUserByEmail = async (email, requestCallback) => {
  const dbQuery = `SELECT * from users WHERE email = "${email}"`;
  await query(dbQuery, requestCallback);
};

const isUserInDB = async (username, email, requestCallback) => {
  const dbQuery = `SELECT COUNT(*) as count from users WHERE username = "${username}" OR email = "${email}"`;
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
  const dbQuery = `SELECT video_id FROM user_likes WHERE user_id=(SELECT id FROM users WHERE username = "${username}") `;
  await query(dbQuery, requestCallback);
};

const checkOccurency = async (param, value, requestCallback) => {
  const dbQuery = `SELECT COUNT(*) as 'exists' FROM users WHERE ${param} = "${value}"`;
  await query(dbQuery, requestCallback);
};

const deleteLike = async (username, show_id, requestCallback) => {
  const dbQuery = `DELETE FROM user_likes WHERE user_id = (SELECT id from users where username = "${username}") AND video_id = ${show_id}`;
  await query(dbQuery, requestCallback);
};

const addLike = async (username, show_id, requestCallback) => {
  const dbQuery = `INSERT INTO user_likes(video_id,user_id) VALUES(${show_id}, (SELECT id FROM users WHERE username="${username}"))`;
  await query(dbQuery, requestCallback);
};

const deleteUser = async (id, requestCallback) => {
  const dbQuery = `DELETE FROM users where id=${id}`;
  await query(dbQuery, requestCallback);
};

const changePassword = async (username, password, requestCallback) => {
  const dbQuery = `UPDATE users SET password = '${password}' WHERE username = '${username}'`;
  await query(dbQuery, requestCallback);
};

const updateUserLoginDate = async (username, requestCallback) => {
  const dbQuery = `UPDATE users SET last_login = NOW() WHERE username = '${username}'`;
  await query(dbQuery, requestCallback);
};

const addPasswordResetToken = async (email, token, requestCallback) => {
  const dbQuery = `UPDATE users SET reset_token = '${token}' WHERE email = '${email}'`;
  await query(dbQuery, requestCallback);
}

const updatePassword = async (id, password, requestCallback) => {
  const dbQuery = `UPDATE users set password = '${password}' WHERE id = ${id}`;
  await query(dbQuery,requestCallback)
}

const revokeToken = async (id, requestCallback) => {
  const dbQuery = `UPDATE users set reset_token = NULL WHERE id = ${id}`;
  await query(dbQuery,requestCallback)
}

const promoteUser = async (id, requestCallback) => {
  const dbQuery = `UPDATE users set account_type = 2 WHERE id = ${id}`;
  await query(dbQuery,requestCallback)
}

const demoteUser = async (id, requestCallback) => {
  const dbQuery = `UPDATE users set account_type = 1 WHERE id = ${id}`;
  await query(dbQuery,requestCallback)
}

export {
  createUser,
  getAllUsers,
  findOneUser,
  findOneUserByEmail,
  confirmUser,
  isUserInDB,
  updateUser,
  userLikes,
  checkOccurency,
  deleteLike,
  addLike,
  deleteUser,
  changePassword,
  updateUserLoginDate,
  addPasswordResetToken,
  updatePassword,
  revokeToken,
  promoteUser,
  demoteUser,
};
