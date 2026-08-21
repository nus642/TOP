require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '123456',
    database: process.env.MYSQL_DB || 'nhpa',
    multipleStatements: true
};

(async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = fs.readFileSync(path.join(__dirname, 'db.sql'), 'utf8');
        await connection.query(sql);
        console.log('✅ 表创建成功！');
        await connection.end();
    } catch (err) {
        console.error('❌ 建表失败:', err.message);
    }
})();