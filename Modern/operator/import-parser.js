(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.ImportParser = api;
})(function createModule() {
  // 固定模板列（顺序不可变）
  const HEADER_COLUMNS = Object.freeze([
    "round", "court", "time", "p1", "p2", "p3", "p4", "team1", "team2"
  ]);
  const HEADER_ROW = HEADER_COLUMNS.join(",");
  // team 列可选：全部留空为轮转模式，填写则为固定搭档模式
  const REQUIRED_COLUMNS = Object.freeze(["round", "court", "time", "p1", "p2", "p3", "p4"]);
  const TEAM_SEPARATOR = " & ";

  /**
   * Minimal RFC-4180 CSV parser: supports quoted fields, embedded commas,
   * escaped quotes ("") and newlines inside quotes. Returns an array of
   * { line, cells } records where `line` is the 1-based physical line where
   * the record starts (used for row-numbered validation errors).
   */
  function parseCsvText(text) {
    const records = [];
    let cells = [];
    let field = "";
    let inQuotes = false;
    let recordStartLine = 1;
    let line = 1;
    let i = 0;

    function endField() {
      cells.push(field);
      field = "";
    }

    function endRecord() {
      endField();
      records.push({ line: recordStartLine, cells });
      cells = [];
    }

    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === "\"") {
          if (text[i + 1] === "\"") { field += "\""; i += 2; continue; }
          inQuotes = false; i += 1; continue;
        }
        if (ch === "\n") line += 1;
        field += ch; i += 1; continue;
      }
      if (ch === "\"") { inQuotes = true; i += 1; continue; }
      if (ch === ",") { endField(); i += 1; continue; }
      if (ch === "\r") { i += 1; continue; }
      if (ch === "\n") { endRecord(); line += 1; recordStartLine = line; i += 1; continue; }
      field += ch; i += 1;
    }
    // Final record (file without trailing newline)
    if (field !== "" || cells.length > 0) {
      endField();
      records.push({ line: recordStartLine, cells });
    }
    return records;
  }

  /**
   * Parse a local datetime string into a canonical ISO UTC string.
   * Accepted: "2026-09-12 08:00", "2026-09-12 08:00:30", "2026/09/12 08:00",
   * and full ISO values (used as-is). Naive datetimes are interpreted in the
   * browser's local timezone (the venue timezone at the operator's machine).
   * Returns null when the value cannot be parsed.
   */
  function parseLocalDateTime(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    const naive = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (naive) {
      const [, y, mo, d, h, mi, s] = naive;
      const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0));
      if (Number.isNaN(date.getTime())) return null;
      // Guard against impossible dates rolled over by Date (e.g. month 13)
      if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
      return date.toISOString().replace(/\.\d{3}Z$/, "Z");
    }
    const explicit = new Date(raw);
    if (Number.isNaN(explicit.getTime())) return null;
    return explicit.toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  function normalizeName(value) {
    return value == null ? "" : String(value).trim();
  }

  function normalizeCourtName(value) {
    return normalizeName(value).replace(/\s+/g, " ");
  }

  /**
   * Convert fixed-template CSV text into the normalized import JSON plus
   * row-numbered parse errors and warnings.
   *
   * Returns { data, errors, warnings } where data is the payload accepted by
   * POST /api/competition/:id/schedule/import (null when structural errors
   * prevent normalization). Errors carry the physical CSV line number.
   */
  function normalizeCsvToImport(text, { tournamentName = "" } = {}) {
    const errors = [];
    const warnings = [];
    // Strip UTF-8 BOM emitted by Excel "另存为 CSV" so the header matches.
    const cleanText = String(text ?? "").replace(/^\uFEFF/, "");
    const records = parseCsvText(cleanText);

    if (records.length === 0) {
      return { data: null, errors: [{ line: null, message: "文件为空：请先选择包含比赛安排的 CSV 文件" }], warnings };
    }

    // Locate header row (must be the first non-empty record)
    const headerRecord = records[0];
    const headerCells = headerRecord.cells.map(normalizeName).map((h) => h.toLowerCase());
    const columnIndexes = {};
    for (const column of HEADER_COLUMNS) {
      const index = headerCells.indexOf(column);
      if (index >= 0) columnIndexes[column] = index;
    }
    for (const column of REQUIRED_COLUMNS) {
      if (columnIndexes[column] === undefined) {
        errors.push({ line: headerRecord.line, message: `表头缺少必需列「${column}」，请下载最新模板` });
      }
    }
    if (errors.length > 0) {
      return { data: null, errors, warnings };
    }

    // Track the physical CSV line of every match so parse/validation errors
    // can be reported with row numbers. __line is stripped before the payload
    // is POSTed to the server (stripClientMeta).
    const matchLines = [];
    const skippedEmpty = [];
    for (let r = 1; r < records.length; r++) {
      const record = records[r];
      const allEmpty = record.cells.every((cell) => normalizeName(cell) === "");
      if (allEmpty) { skippedEmpty.push(record.line); continue; }
      matchLines.push(record);
    }
    if (skippedEmpty.length > 0) {
      warnings.push(`已跳过 ${skippedEmpty.length} 个空行`);
    }
    if (matchLines.length === 0) {
      return { data: null, errors: [{ line: null, message: "模板中没有任何比赛行，请在表头下方填写比赛安排" }], warnings };
    }

    function cellOf(record, column) {
      const index = columnIndexes[column];
      if (index === undefined) return "";
      return normalizeName(record.cells[index]);
    }

    const playerOrder = [];
    const playerSeen = new Set();
    const pairOrder = [];
    const pairSeen = new Set();
    const roundMap = new Map();
    const teamMemberChecks = [];
    let fixedPairRows = 0;
    let plainRows = 0;
    let mixedTeamRows = 0;

    for (const record of matchLines) {
      const rowErrorsBefore = errors.length;
      const roundRaw = cellOf(record, "round");
      const court = normalizeCourtName(cellOf(record, "court"));
      const timeRaw = cellOf(record, "time");
      const p1 = cellOf(record, "p1");
      const p2 = cellOf(record, "p2");
      const p3 = cellOf(record, "p3");
      const p4 = cellOf(record, "p4");
      const team1 = cellOf(record, "team1");
      const team2 = cellOf(record, "team2");

      if (!/^\d+$/.test(roundRaw)) {
        errors.push({ line: record.line, message: `round 必须是正整数轮次，当前为「${roundRaw || "空"}」` });
      }
      if (!court) errors.push({ line: record.line, message: "court 场地名称不能为空" });
      const scheduledAt = parseLocalDateTime(timeRaw);
      if (!scheduledAt) {
        errors.push({ line: record.line, message: `time 时间格式无法识别：「${timeRaw || "空"}」，请使用如 2026-09-12 08:00` });
      }
      const players = [p1, p2, p3, p4];
      players.forEach((name, side) => {
        if (!name) {
          errors.push({ line: record.line, message: `p${side + 1} 选手姓名不能为空` });
          return;
        }
        if (name.includes(TEAM_SEPARATOR.trim()) || name.includes("&")) {
          errors.push({ line: record.line, message: `p${side + 1}「${name}」应为单个选手姓名，搭档请填在 team1 / team2 列` });
        }
        if (!playerSeen.has(name)) { playerSeen.add(name); playerOrder.push(name); }
      });

      const hasTeam1 = team1 !== "";
      const hasTeam2 = team2 !== "";
      if (hasTeam1 !== hasTeam2) {
        mixedTeamRows += 1;
        errors.push({ line: record.line, message: "team1 与 team2 必须同时填写或同时留空" });
      } else if (hasTeam1 && hasTeam2) {
        fixedPairRows += 1;
        for (const [label, team] of [["team1", team1], ["team2", team2]]) {
          teamMemberChecks.push([record.line, team]);
          const members = team.split("&").map((s) => s.trim()).filter(Boolean);
          if (members.length !== 2) {
            errors.push({ line: record.line, message: `${label}「${team}」必须由两名选手用 & 连接，如 张三 & 李四` });
            continue;
          }
          const canonical = [...members].sort().join(TEAM_SEPARATOR);
          if (!pairSeen.has(canonical)) { pairSeen.add(canonical); pairOrder.push(canonical); }
        }
      } else {
        plainRows += 1;
      }

      if (errors.length === rowErrorsBefore) {
        const roundNumber = Number(roundRaw);
        if (!roundMap.has(roundNumber)) roundMap.set(roundNumber, []);
        roundMap.get(roundNumber).push({
          __line: record.line,
          court, scheduledAt, p1, p2, p3, p4,
          team1: hasTeam1 ? team1 : undefined,
          team2: hasTeam2 ? team2 : undefined
        });
      }
    }

    if (fixedPairRows > 0 && plainRows > 0) {
      errors.push({ line: null, message: `模式不一致：${fixedPairRows} 行填写了 team 列、${plainRows} 行未填写。同一文件要么全部填写（固定搭档），要么全部留空（轮转）` });
    }

    // Cross-check: every team member must be a declared player (from p1..p4).
    for (const [line, team] of teamMemberChecks) {
      const members = team.split("&").map((s) => s.trim()).filter(Boolean);
      for (const member of members) {
        if (!playerSeen.has(member)) {
          errors.push({ line, message: `搭档「${member}」没有出现在任何比赛行的 p1~p4 列中` });
        }
      }
    }
    if (errors.length > 0) return { data: null, errors, warnings };

    const mode = fixedPairRows > 0 ? "fixed-pair" : "rotate";
    const rounds = [...roundMap.keys()].sort((a, b) => a - b).map((roundNumber) => ({
      round: roundNumber,
      matches: roundMap.get(roundNumber).map((match) => ({ ...match }))
    }));

    const data = {
      mode,
      players: playerOrder.map((name) => ({ name, lv: 3, paired: true })),
      rounds
    };
    if (mode === "fixed-pair") {
      data.pairs = pairOrder.map((name) => ({ name }));
    }
    const trimmedName = normalizeName(tournamentName);
    if (trimmedName) data.tournamentName = trimmedName;

    const courtSet = new Set();
    let totalMatches = 0;
    for (const round of rounds) for (const match of round.matches) { courtSet.add(match.court); totalMatches += 1; }
    warnings.push(`共 ${data.players.length} 名选手、${mode === "fixed-pair" ? data.pairs.length : 0} 个固定搭档、${rounds.length} 轮、${totalMatches} 场比赛、${courtSet.size} 块场地`);

    return { data, errors, warnings };
  }

  /**
   * Map server-side validation errors (JSON-path rows like rounds[0].matches[2])
   * back to physical CSV line numbers using the normalized payload.
   */
  function mapServerErrorRows(data, serverErrors) {
    if (!data || !Array.isArray(serverErrors)) return serverErrors || [];
    const matchLines = [];
    (data.rounds || []).forEach((round) => {
      (round.matches || []).forEach((match) => matchLines.push(match));
    });
    return serverErrors.map((entry) => {
      const matchRef = typeof entry.row === "string"
        ? entry.row.match(/^rounds\[(\d+)\]\.matches\[(\d+)\]/)
        : null;
      if (matchRef) {
        const round = (data.rounds || [])[Number(matchRef[1])];
        const match = round && (round.matches || [])[Number(matchRef[2])];
        if (match && match.__line) return { ...entry, line: match.__line };
      }
      return entry;
    });
  }

  /**
   * Remove client-only metadata (__line) before POSTing the payload.
   */
  function stripClientMeta(data) {
    if (!data || typeof data !== "object") return data;
    return {
      ...data,
      rounds: (data.rounds || []).map((round) => ({
        round: round.round,
        matches: (round.matches || []).map(({ __line, ...match }) => match)
      }))
    };
  }

  return { HEADER_ROW, HEADER_COLUMNS, REQUIRED_COLUMNS, parseCsvText, parseLocalDateTime, normalizeCsvToImport, mapServerErrorRows, stripClientMeta };
});
