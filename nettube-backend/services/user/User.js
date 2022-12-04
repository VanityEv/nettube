import query from "../db.js";

const createUser = async (username, fullname, password, birthdate, email) => {
	const dbQuery = `INSERT INTO users (id, username, fullname, password, birthdate, subscription, confirmed, email)
                     VALUES (${username}, ${fullname}, ${password}, ${birthdate}, 0, 0, ${email});`;
	const result = await query(dbQuery);
	return result;
};
const findOneUser = async (username) => {
	const dbQuery = `SELECT * from users WHERE username = ${username}`;
	const result = await query(dbQuery);
	return result;
};
const isUserInDB = async (username) => {
	const dbQuery = `SELECT * from users WHERE username = ${username}`;
	const result = await query(dbQuery);
	return result.length > 0;
};
const confirmUser = async (username) => {
	const dbQuery = `UPDATE users SET confirmed=1 WHERE username = ${username}`;
	const result = await query(dbQuery);
	return result;
};

export { createUser, findOneUser, confirmUser, isUserInDB };
