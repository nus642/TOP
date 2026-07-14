const mysql = require("mysql2/promise");


const dbConfig = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASS || "123456",
    database: process.env.MYSQL_DB || "nhpa"
};


const pool = mysql.createPool(dbConfig);


module.exports = pool;

console.log(
    `[DB] ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
);