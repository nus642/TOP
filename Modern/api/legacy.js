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

router.post('/save', async (req, res) => {
    try {
        const {
    players,
    rounds,
    mode,
    target,
    courtNames,
    tournamentName
} = req.body;

const tournamentId = 1;

// 更新赛事名称（可选）
if (tournamentName) {
    await pool.query(
        'UPDATE tournaments SET name = ? WHERE id = ?',
        [tournamentName, tournamentId]
    );
}

// 删除旧球员
await pool.query(
    'DELETE FROM players WHERE tournament_id = ?',
    [tournamentId]
);

// 保存球员
if (players && players.length > 0) {
    for (const p of players) {
        await pool.query(
            `INSERT INTO players
            (tournament_id, name, level, paired)
            VALUES (?, ?, ?, ?)`,
            [
                tournamentId,
                p.name,
                p.lv || 3,
                p.paired ? 1 : 0
            ]
        );
    }
}

// 再删除旧比赛
await pool.query(
    'DELETE FROM matches WHERE tournament_id = ?',
    [tournamentId]
);

       
        // 插入比赛
        for (let r = 0; r < rounds.length; r++) {
            const roundMatches = rounds[r];
            for (let m of roundMatches) {
                // 根据模式，获取球员ID
                let p1_id = null, p2_id = null, p3_id = null, p4_id = null;
                let team1_name = null, team2_name = null;
                if (mode === 'fixed-pair') {
                    team1_name = m.team1;
                    team2_name = m.team2;
                    // 从名称查找球员id（简化：通过姓名查找，但可能存在同名，这里假设唯一）
                    const [p1] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p1]);
                    const [p2] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p2]);
                    const [p3] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p3]);
                    const [p4] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p4]);
                    p1_id = p1[0]?.id;
                    p2_id = p2[0]?.id;
                    p3_id = p3[0]?.id;
                    p4_id = p4[0]?.id;
                } else {
                    // 混搭
                    const [p1] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p1]);
                    const [p2] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p2]);
                    const [p3] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p3]);
                    const [p4] = await pool.query('SELECT id FROM players WHERE tournament_id = ? AND name = ?', [tournamentId, m.p4]);
                    p1_id = p1[0]?.id;
                    p2_id = p2[0]?.id;
                    p3_id = p3[0]?.id;
                    p4_id = p4[0]?.id;
                }
                await pool.query(
                    `INSERT INTO matches 
                    (tournament_id, round_num, court, player1_id, player2_id, player3_id, player4_id, team1_name, team2_name, score1, score2, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [tournamentId, r+1, m.court, p1_id, p2_id, p3_id, p4_id, team1_name, team2_name, m.s1, m.s2, m.status || 'idle']
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '保存失败' });
    }
});

// 更新比赛（比分、状态）
router.put('/match/:id', async (req, res) => {
    try {
        const matchId = req.params.id;
        const { score1, score2, status } = req.body;
        await pool.query(
            'UPDATE matches SET score1 = ?, score2 = ?, status = ? WHERE id = ?',
            [score1, score2, status, matchId]
        );
        // 更新球员统计数据（净胜、胜场等）这里为了保持数据一致性，我们每次更新比赛后重新计算所有球员的统计
        // 简单做法：删除原有球员统计，重新计算
        const tournamentId = 1;
        // 重置球员统计
        await pool.query('UPDATE players SET wins = 0, losses = 0, net = 0, curP = 0 WHERE tournament_id = ?', [tournamentId]);
        // 计算所有比赛（只计算已完成的）
        const [matches] = await pool.query('SELECT * FROM matches WHERE tournament_id = ? AND status = "finished"', [tournamentId]);
        for (let m of matches) {
            // 这里需要根据模式（固定组对或混搭）更新球员数据，但我们只简单更新净胜，不考虑胜负（可由前端计算）
            // 更完整的做法：后端维护完整统计，但为简化，我们让前端在加载时重新计算，后端只存储原始比分
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '更新失败' });
    }
});

// 重置所有数据
router.delete('/reset', async (req, res) => {
    try {
        const tournamentId = 1;
        await pool.query('DELETE FROM matches WHERE tournament_id = ?', [tournamentId]);
        await pool.query('DELETE FROM pairings WHERE tournament_id = ?', [tournamentId]);
        await pool.query('DELETE FROM players WHERE tournament_id = ?', [tournamentId]);
        await pool.query('DELETE FROM player_partners WHERE tournament_id = ?', [tournamentId]);
        await pool.query('DELETE FROM player_opponents WHERE tournament_id = ?', [tournamentId]);
        await pool.query('UPDATE tournaments SET name = ? WHERE id = ?', ['赛事活动', tournamentId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '重置失败' });
    }
});

module.exports = router;