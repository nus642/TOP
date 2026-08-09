require("dotenv").config();
const express = require('express');
const db = require("./database/db");
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('node:path');

const competitionRoutes = require("./api/competition");
const legacyRoutes = require("./api/legacy");
const matchOperationsRoutes = require("./api/match-operations");
const masterOperationalVisibilityRoutes = require("./api/master-operational-visibility");
const masterWorkflowRoutes = require("./api/master-workflow");
const participantReadinessRoutes = require("./api/participant-readiness");
const refereeWorkflowRoutes = require("./api/referee-workflow");
const publicMatchScoreboardRoutes = require("./api/public-match-scoreboard");
const competitionArchiveRoutes = require("./api/competition-archive");

const competitionEngine = require('./engine/competition');
const operationsEngine = require('./engine/operations');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/operator", express.static(path.join(__dirname, "operator")));
app.use("/participant", express.static(path.join(__dirname, "participant")));

app.use("/api/competition", competitionRoutes);
app.use("/api", legacyRoutes);
app.use("/api/match-operations", matchOperationsRoutes);
app.use("/api/master-operations", masterOperationalVisibilityRoutes);
app.use("/api/master-workflow", masterWorkflowRoutes);
app.use("/api/participant-readiness", participantReadinessRoutes);
app.use("/api/referee-workflow", refereeWorkflowRoutes);
app.use("/api/public/competitions", publicMatchScoreboardRoutes);
app.use("/api/public/competitions", competitionArchiveRoutes);

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
