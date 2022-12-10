import query from "../db.js";

const createUser = async (
	{ username, fullname, password, birthdate, email, subscription },
	requestCallback
) => {
	const dbQuery = `INSERT INTO users (username, fullname, password, birthdate, subscription, confirmed, email)
                     VALUES ("${username}", "${fullname}", "${password}", "${birthdate}", ${subscription}, 0, "${email}");`;
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
const confirmUser = async (username) => {
	const dbQuery = `UPDATE users SET confirmed=1 WHERE username = "${username}"`;
	const result = await query(dbQuery);
	return result;
};

export { createUser, findOneUser, confirmUser, isUserInDB };
