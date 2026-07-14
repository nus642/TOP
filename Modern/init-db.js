const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',          // 与 server.js 保持一致
    database: 'nhpa',
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