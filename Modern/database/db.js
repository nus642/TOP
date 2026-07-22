const mysql = require("mysql2/promise");


const dbConfig = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASS || "123456",
    database: process.env.MYSQL_DB || "nhpa"
};


const pool = mysql.createPool(dbConfig);

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

async function withTransaction(work) {

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const result = await work(connection);

            await connection.commit();

            return result;

        } catch (err) {
            await connection.rollback();

            if (err.errno === 1213 && attempt < maxAttempts) {
                console.warn(
                    `[DB] Deadlock detected, retry ${attempt}/${maxAttempts - 1}`
                );
                await new Promise(resolve =>
                    setTimeout(resolve, 50 * attempt)
                );
                continue;
            }

            throw err;

        } finally {
            connection.release();
        }
    }
}


module.exports = pool;

module.exports.initDB = initDB;

module.exports.withTransaction = withTransaction;