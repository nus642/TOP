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

async function initDB() {
    const [rows] = await pool.query(
        "SELECT id FROM tournaments LIMIT 1"
    );

    if (rows.length === 0) {
        await pool.query(
            "INSERT INTO tournaments (name) VALUES (?)",
            ["赛事活动"]
        );
    }
}

module.exports.initDB = initDB;