import mysql from 'mysql';
import config from '../config/config.js';

const formatQuery = sql => {
  return sql.replaceAll('"', "'");
};

const query = async (sql, callback) => {
  const formattedQuery = formatQuery(sql);
  const connection = mysql.createConnection(config.db);
  connection.connect(conErr => {
    if (conErr) throw conErr;
    console.log(`MySQL connection state: ${connection.state}`);
    connection.query(formattedQuery, (queryErr, res) => {
      if (queryErr) throw queryErr;
      connection.end();
      callback(res);
    });
  });
};

export default query;
export { mysql };
