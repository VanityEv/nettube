import mysql from "mysql";
import config from "../config/config.js";

const query = async (sql, callback) => {
	const connection = mysql.createConnection(config.db);
	connection.connect((conErr) => {
		if (conErr) throw conErr;
		console.log(`Connection state: ${connection.state}`);
		connection.query(sql, (queryErr, res) => {
			if (queryErr) throw queryErr;
			connection.end();
			callback(res);
		});
	});
};

export default query;
export { mysql };
