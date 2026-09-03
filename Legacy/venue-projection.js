(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.VenueProjection = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const RUNNING = '比赛中';
    const PENDING = '待开赛';
    const IDLE = '空闲';

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function compareCourts(a, b) {
        const an = Number(a.court);
        const bn = Number(b.court);
        if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
        return a.court.localeCompare(b.court, 'zh-CN', { numeric: true });
    }

    function splitMatchName(value) {
        const name = text(value);
        const parts = name.split(/\s+(?:vs\.?|v\.?|对|对阵)​?\s+/i);
        return parts.length === 2 ? parts.map(text) : [name, ''];
    }

    /**
     * The only adapter that knows the Legacy dashboard shape. The returned object
     * is deliberately small and presentation-oriented; it is not a new Canon contract.
     */
    function fromLegacyDashboard(dashboard, event) {
        const source = dashboard && typeof dashboard === 'object' ? dashboard : {};
        const tasks = source.tasks && typeof source.tasks === 'object' ? source.tasks : {};
        const taskById = new Map();
        Object.entries(tasks).forEach(([key, task]) => {
            if (!task || typeof task !== 'object') return;
            taskById.set(text(task.id || key).toLowerCase(), task);
        });

        const matches = Object.entries(source.courts || {}).map(([court, raw]) => {
            raw = raw && typeof raw === 'object' ? raw : {};
            const matchId = text(raw.match_id);
            const task = taskById.get(matchId.toLowerCase()) || {};
            const fallbackSides = splitMatchName(raw.match_name);
            const status = [RUNNING, PENDING].includes(raw.status) ? raw.status : IDLE;
            return {
                match_id: matchId,
                court: text(court),
                status,
                side_a: text(task.t1) || fallbackSides[0],
                side_b: text(task.t2) || fallbackSides[1],
                score: status === RUNNING ? text(raw.score || task.live_score) : '',
                referee: text(raw.referee),
                relevance: status === RUNNING ? 0 : status === PENDING ? 1 : 2
            };
        }).sort((a, b) => a.relevance - b.relevance || compareCourts(a, b));

        return {
            event: {
                code: text(event && event.code),
                name: text(event && event.name) || '赛事现场'
            },
            matches,
            updated_at: new Date().toISOString()
        };
    }

    function relevantMatches(projection, options) {
        const all = projection && Array.isArray(projection.matches) ? projection.matches : [];
        const showIdle = options && options.showIdle;
        const relevant = all.filter(match => showIdle || match.status !== IDLE);
        return options && options.limit !== undefined ? relevant.slice(0, options.limit) : relevant;
    }

    function layoutFor(count) {
        if (count <= 1) return { columns: 1, density: 'featured' };
        if (count === 2) return { columns: 2, density: 'featured' };
        if (count <= 4) return { columns: 2, density: 'roomy' };
        return { columns: 4, density: 'compact' };
    }

    return { fromLegacyDashboard, relevantMatches, layoutFor, statuses: { RUNNING, PENDING, IDLE } };
}));
