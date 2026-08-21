require("dotenv").config();
const express = require('express');
const db = require("./database/db");
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('node:path');

const competitionRoutes = require("./api/competition");
const scheduleImportRoutes = require("./api/schedule-import");
const legacyRoutes = require("./api/legacy");
const matchOperationsRoutes = require("./api/match-operations");
const masterOperationalVisibilityRoutes = require("./api/master-operational-visibility");
const masterWorkflowRoutes = require("./api/master-workflow");
const participantReadinessRoutes = require("./api/participant-readiness");
const refereeWorkflowRoutes = require("./api/referee-workflow");
const refereeCoordinationRoutes = require("./api/referee-coordination");
const publicMatchScoreboardRoutes = require("./api/public-match-scoreboard");
const publicRefereeRosterRoutes = require("./api/public-referee-roster");
const competitionArchiveRoutes = require("./api/competition-archive");
const { createActorSessionStore } = require("./session/actor-session");
const { createSessionRouter, requireActorSession } = require("./api/session");

const competitionEngine = require('./engine/competition');
const operationsEngine = require('./engine/operations');

function createApp({ actorSessions = createActorSessionStore() } = {}) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  // UI bundles change often during M2 iteration; force revalidation so
  // browsers never serve a stale cached app.js (heuristic caching broke
  // manual testing flows).
  const uiOptions = { etag: true, setHeaders: (res) => res.setHeader("Cache-Control", "no-cache") };
  app.use("/shell", express.static(path.join(__dirname, "shell"), uiOptions));
  app.use("/operator", express.static(path.join(__dirname, "operator"), uiOptions));
  app.use("/participant", express.static(path.join(__dirname, "participant"), uiOptions));
  app.use("/public", express.static(path.join(__dirname, "public"), uiOptions));
  app.use("/archive", express.static(path.join(__dirname, "archive"), uiOptions));
  app.use("/presentation", express.static(path.join(__dirname, "presentation"), uiOptions));
// Local development tools only (e.g. dev-login.html); kept outside production assets.
app.use("/dev", express.static(path.join(__dirname, "dev"), uiOptions));

  app.use("/api/competition", requireActorSession(actorSessions), scheduleImportRoutes);
  app.use("/api/competition", competitionRoutes);
  app.use("/api/session", createSessionRouter(actorSessions));
  app.use("/api", legacyRoutes);
  app.use("/api/match-operations", requireActorSession(actorSessions), matchOperationsRoutes);
  app.use("/api/master-operations", requireActorSession(actorSessions), masterOperationalVisibilityRoutes);
  app.use("/api/master-workflow", requireActorSession(actorSessions), masterWorkflowRoutes);
  app.use("/api/participant-readiness", requireActorSession(actorSessions), participantReadinessRoutes);
  app.use("/api/referee-workflow", requireActorSession(actorSessions), refereeWorkflowRoutes);
  app.use("/api/referee-coordination", requireActorSession(actorSessions), refereeCoordinationRoutes);
  app.use("/api/public/competitions", publicMatchScoreboardRoutes);
  app.use("/api/public/competitions", publicRefereeRosterRoutes);
  app.use("/api/public/competitions", competitionArchiveRoutes);

  return app;
}

// ---------- API 路由 ----------


// 启动服务
const PORT = 3000;
if (require.main === module) db.initDB().then(() => {
    const app = createApp();
    app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
}).catch(err => {
    console.error('数据库初始化失败:', err);
});

module.exports = { createApp };
