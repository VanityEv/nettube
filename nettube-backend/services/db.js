import mysql from "mysql";
/**
 * TODO: config in separate file
 */
import config from "../config/config.js";

async function query(sql, params) {
	const connection = await mysql.createConnection(config.db);
	const [results] = await connection.execute(sql, params);
	connection.end();
	return results;
}

export default query;
export { mysql };
