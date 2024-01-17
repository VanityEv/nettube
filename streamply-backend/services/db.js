import mysql, { createPool } from 'mysql';
import config from '../config/config.js';

const formatQuery = sql => {
  return sql.replaceAll('"', "'");
};

const pool = createPool(config.db);

const query = async (sql, callback) => {
  pool.getConnection((connectionError, connection) => {
    if (connectionError) throw new Error(`DB Connection error: ${connectionError}`);
    const formattedQuery = formatQuery(sql);
    // console.log(`MySQL connection state: ${connection.state}`);
    connection.query(formattedQuery, (queryErr, res) => {
      if (queryErr) {
        connection.release();
        throw queryErr;
      }
      connection.release();
      callback(res);
    });
  })
};

export default query;
export { mysql };
