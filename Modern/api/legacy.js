const express = require("express");
const competitionService = require("../services/competition.service");

const router = express.Router();

// 获取当前赛事的所有数据（赛程 + 排名）
// 036.2.6: 委托至 Service Layer，统一读取路径
router.get('/schedule', async (req, res) => {
    try {
        const result = await competitionService.getSchedule(1);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '数据库错误' });
    }
});

// 生成赛程（接收前端提交的球员列表和配置）
// 036.2: 委托至 Service Layer，获得事务保护
router.post('/generate', async (req, res) => {
    try {
        const result = await competitionService.generateCompetition(req.body);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '生成失败' });
    }
});

// 保存赛程（接收前端提交的完整赛程数据）
// 036.2.3: 委托至 Service Layer，获得事务保护与完整清理
router.post('/save', async (req, res) => {
    try {
        const result = await competitionService.saveSchedule(req.body);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '保存失败' });
    }
});

// 更新比赛（比分、状态）
// 036.2.5: 委托至 Service Layer，获得事务保护
router.put('/match/:id', async (req, res) => {
    try {
        const result = await competitionService.updateMatch(
            1,
            req.params.id,
            req.body.score1,
            req.body.score2,
            req.body.status
        );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '更新失败' });
    }
});

// 重置所有数据
// 036.2.4: 委托至 Service Layer，获得事务保护
router.delete('/reset', async (req, res) => {
    try {
        const result = await competitionService.resetCompetition();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '重置失败' });
    }
});

module.exports = router;