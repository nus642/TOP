const express = require("express");
const pool = require("../database/db");
const competitionService = require("../services/competition.service");

const router = express.Router();

// 获取当前赛事的所有数据（赛程 + 排名）
router.get('/schedule', async (req, res) => {
    try {
        const tournamentId = 1; // 固定使用 tournament 1，可扩展
        // 获取所有球员
        const [players] = await pool.query('SELECT * FROM players WHERE tournament_id = ?', [tournamentId]);
        // 获取所有比赛
        const [matches] = await pool.query('SELECT * FROM matches WHERE tournament_id = ? ORDER BY round_num, id', [tournamentId]);
        // 获取固定组对（如果有）
        const [pairings] = await pool.query('SELECT * FROM pairings WHERE tournament_id = ?', [tournamentId]);
        // 获取赛事信息
        const [tournament] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);

        // 计算排名（在后端计算，或前端计算，这里简单返回原始数据，让前端计算，保持兼容）
        // 但为了观赛人直接使用，我们返回所有数据，前端用相同逻辑计算排名
        res.json({
            tournament: tournament[0],
            players,
            matches,
            pairings,
            mode: 'round-robin' // 可以从 tournament 中读取，但为简化，前端默认混搭，由前端设置
        });
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