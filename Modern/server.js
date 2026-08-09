require("dotenv").config();
const express = require('express');
const db = require("./database/db");
const cors = require('cors');
const bodyParser = require('body-parser');

const competitionRoutes = require("./api/competition");
const legacyRoutes = require("./api/legacy");
const matchOperationsRoutes = require("./api/match-operations");
const masterOperationalVisibilityRoutes = require("./api/master-operational-visibility");

const competitionEngine = require('./engine/competition');
const operationsEngine = require('./engine/operations');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/competition", competitionRoutes);
app.use("/api", legacyRoutes);
app.use("/api/match-operations", matchOperationsRoutes);
app.use("/api/master-operations", masterOperationalVisibilityRoutes);

// ---------- API 路由 ----------


// 启动服务
const PORT = 3000;
db.initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
}).catch(err => {
    console.error('数据库初始化失败:', err);
});
