'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const projection = require('../../Legacy/venue-projection.js');

function dashboard(count, status = '比赛中') {
    const courts = {};
    const tasks = {};
    for (let i = 1; i <= count; i += 1) {
        courts[i] = { status, match_id: `M-${i}`, match_name: `很长的队伍 ${i} vs 对手 ${i}`, score: `G1 ${i}-${i + 1}`, referee: `裁判${i}` };
        tasks[`M-${i}`] = { id: `M-${i}`, t1: `红队${i}`, t2: `蓝队${i}`, live_score: `${i}-${i + 1}` };
    }
    return { status: 'success', courts, tasks };
}

test('normalizes Legacy internals into the minimal venue view model', () => {
    const view = projection.fromLegacyDashboard(dashboard(1), { code: 'EVT', name: '测试赛' });
    assert.deepEqual(view.event, { code: 'EVT', name: '测试赛' });
    assert.deepEqual(view.matches[0], {
        match_id: 'M-1', court: '1', status: '比赛中', side_a: '红队1', side_b: '蓝队1',
        score: 'G1 1-2', referee: '裁判1', relevance: 0
    });
});

test('running precedes pending and idle is hidden by default', () => {
    const raw = dashboard(3, '空闲');
    raw.courts[2] = { status: '待开赛', match_id: 'M-2', match_name: '红 vs 蓝' };
    raw.courts[3] = { status: '比赛中', match_id: 'M-3', match_name: '红 vs 蓝', score: '7-4' };
    const view = projection.fromLegacyDashboard(raw, {});
    assert.deepEqual(projection.relevantMatches(view).map(item => item.court), ['3', '2']);
    assert.equal(projection.relevantMatches(view, { showIdle: true }).length, 3);
});

test('keeps every relevant match in the reusable projection by default', () => {
    const view = projection.fromLegacyDashboard(dashboard(10), {});
    assert.equal(view.matches.length, 10);
    assert.equal(projection.relevantMatches(view).length, 10);
});

test('applies the Venue Board consumer limit when explicitly requested', () => {
    const view = projection.fromLegacyDashboard(dashboard(10), {});
    assert.equal(projection.relevantMatches(view, { limit: 8 }).length, 8);
});

test('chooses adaptive representative layouts', () => {
    assert.deepEqual([8, 4, 2, 1].map(n => projection.layoutFor(n).columns), [4, 2, 2, 1]);
    assert.deepEqual([8, 4, 2, 1].map(n => projection.layoutFor(n).density), ['compact', 'roomy', 'featured', 'featured']);
});

test('completion-style projection removal recomputes the layout', () => {
    const eight = projection.relevantMatches(projection.fromLegacyDashboard(dashboard(8), {}));
    const one = projection.relevantMatches(projection.fromLegacyDashboard(dashboard(1), {}));
    assert.equal(projection.layoutFor(eight.length).columns, 4);
    assert.equal(projection.layoutFor(one.length).columns, 1);
});
