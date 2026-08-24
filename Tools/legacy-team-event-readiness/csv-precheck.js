#!/usr/bin/env node
/**
 * Legacy 团体赛 CSV 离线预检工具 v2
 *
 * 功能：
 *   - 检查 CSV 列头是否匹配 Legacy NAME_REGEX
 *   - 检查空姓名、重复人员（同 canonical team 下同名）
 *   - 检查队名变体（NFKC + 去空白 + 大小写统一）
 *   - 识别中文逗号误用
 *   - 可选：交叉比对排阵名单，检查出场运动员是否在名单库中
 *   - 只报告错误，不写数据库
 *
 * 用法：
 *   node csv-precheck.js <csv文件路径>
 *   node csv-precheck.js <csv文件路径> --roster <players.json>
 *   node csv-precheck.js <csv文件路径> --lineups <lineups.json>
 */

const fs = require('fs');
const path = require('path');

// ======================== 与 Legacy 一致的常量 ========================
const NAME_REGEX = /姓名|名单|参赛搭档|选手|运动员/i;
const TEAM_REGEX = /队名|单位|学校|队伍/;
const GROUP_REGEX = /项目名称|组别|所在小组|项目/i;
const SPLIT_REGEX = /[\+＋\/／、＆&\|]/;
const FULLWIDTH_COMMA = '，';

// ======================== 工具函数 ========================

/** 去除 UTF-8 BOM */
function stripBOM(text) {
  return text.replace(/^\uFEFF/, '');
}

/**
 * 队名 canonical key：用于发现变体
 * - Unicode NFKC 规范化
 * - 去除所有 Unicode 空白字符
 * - 英文字母统一小写
 */
function canonicalTeam(name) {
  return name
    .normalize('NFKC')
    .replace(/\s+/gu, '')
    .toLowerCase();
}

/** 读取 JSON 文件，支持 UTF-8 BOM */
function readJSON(filePath) {
  const raw = stripBOM(fs.readFileSync(filePath, 'utf-8'));
  return JSON.parse(raw);
}

// ======================== CSV 解析 ========================

/**
 * 检测整行是否使用全角逗号作为分隔符。
 * 如果一行中没有 ASCII 逗号但有全角逗号，则判定为中文逗号分隔。
 */
function detectChineseCommaDelimiter(rawContent) {
  const firstDataLine = rawContent.split(/\r?\n/).find(l => l.trim() !== '');
  if (!firstDataLine) return false;
  const hasAsciiComma = firstDataLine.includes(',');
  const hasFullwidthComma = firstDataLine.includes(FULLWIDTH_COMMA);
  return !hasAsciiComma && hasFullwidthComma;
}

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const content = stripBOM(raw);

  // 检测中文逗号分隔
  const chineseDelimiter = detectChineseCommaDelimiter(content);
  if (chineseDelimiter) {
    return {
      headers: [], rows: [],
      error: null,
      chineseCommaDelimiter: true,
      rawContent: content
    };
  }

  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');

  if (lines.length < 2) {
    return { headers: [], rows: [], error: '文件为空或只有表头' };
  }

  // 简单 CSV 解析（支持引号包裹的字段）
  function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i]);
    rows.push({ lineNum: i + 1, fields, raw: lines[i] });
  }

  return { headers, rows, chineseCommaDelimiter: false };
}

// ======================== 检查器 ========================

function createChecker() {
  const errors = [];
  const warnings = [];

  function addError(msg) { errors.push(msg); }
  function addWarning(msg) { warnings.push(msg); }

  // ---------- 列头检查 ----------
  function checkHeaders(headers) {
    const nameIdx = headers.findIndex(h => NAME_REGEX.test(h));
    const teamIdx = headers.findIndex(h => TEAM_REGEX.test(h));
    const groupIdx = headers.findIndex(h => GROUP_REGEX.test(h));

    if (nameIdx === -1) {
      addError(`[P0] 未找到"姓名"列！列头必须包含以下关键词之一：姓名、名单、参赛搭档、选手、运动员`);
      addError(`     当前列头：${headers.join(', ')}`);
    }
    if (teamIdx === -1) {
      addWarning(`[P1] 未找到"队名"列。列头应包含：队名、单位、学校、队伍 之一`);
    }
    if (groupIdx === -1) {
      addWarning(`[P2] 未找到"组别"列。列头应包含：项目名称、组别、所在小组、项目 之一`);
    }

    return { nameIdx, teamIdx, groupIdx };
  }

  // ---------- 中文逗号检查（字段级） ----------
  function checkChineseCommaInFields(rows, nameIdx, teamIdx, groupIdx) {
    for (const row of rows) {
      // 姓名字段
      if (nameIdx >= 0 && nameIdx < row.fields.length) {
        const val = row.fields[nameIdx];
        if (val.includes(FULLWIDTH_COMMA)) {
          addError(`[P0] 第 ${row.lineNum} 行：姓名中包含中文逗号"，"；如需分隔多人，请使用 /、+、、 或 &`);
        }
      }
      // 队名字段
      if (teamIdx >= 0 && teamIdx < row.fields.length) {
        const val = row.fields[teamIdx];
        if (val.includes(FULLWIDTH_COMMA)) {
          addError(`[P0] 第 ${row.lineNum} 行：队名中包含中文逗号"，"，请人工检查并修正`);
        }
      }
      // 组别字段
      if (groupIdx >= 0 && groupIdx < row.fields.length) {
        const val = row.fields[groupIdx];
        if (val.includes(FULLWIDTH_COMMA)) {
          addError(`[P0] 第 ${row.lineNum} 行：组别中包含中文逗号"，"，请人工检查并修正`);
        }
      }
    }
  }

  // ---------- 姓名检查 ----------
  function checkNames(rows, nameIdx, teamIdx) {
    // 如果姓名列不存在，跳过所有姓名相关检查，避免次生误报
    if (nameIdx === -1) return { nameMap: new Map(), teamNames: new Set() };

    const nameMap = new Map();   // canonicalTeam(team)::name → [{lineNum, team}]
    const teamNames = new Set(); // 原始队名
    const teamCanonMap = new Map(); // canonicalTeam → 第一个出现的原始队名

    for (const row of rows) {
      const rawName = nameIdx < row.fields.length ? row.fields[nameIdx] : '';
      const team = (teamIdx >= 0 && teamIdx < row.fields.length) ? row.fields[teamIdx] : '';

      if (team) teamNames.add(team);

      if (!rawName || rawName.trim() === '') {
        addError(`[P0] 第 ${row.lineNum} 行：姓名为空`);
        continue;
      }

      // 模拟 Legacy 的 SPLIT_REGEX 拆分
      const names = rawName.split(SPLIT_REGEX).map(s => s.trim()).filter(s => s);

      for (const n of names) {
        if (!n) {
          addError(`[P0] 第 ${row.lineNum} 行：拆分后发现空名字（原始值："${rawName}"）`);
          continue;
        }

        if (/[\d]+/.test(n) && n.length <= 3) {
          addWarning(`[P2] 第 ${row.lineNum} 行：姓名"${n}"看起来像编号而非人名`);
        }

        const canonTeam = canonicalTeam(team);
        const key = `${canonTeam}::${n}`;
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key).push({ lineNum: row.lineNum, team });
      }
    }

    // 检查重复（同一 canonical team 下同名）
    for (const [key, entries] of nameMap) {
      if (entries.length > 1) {
        const [canonTeam, name] = key.split('::');
        const rawTeams = [...new Set(entries.map(e => e.team))];
        const teamPart = rawTeams.filter(t => t).length > 0
          ? rawTeams.join('/') + ' 的 '
          : '';
        const lines = entries.map(e => `第${e.lineNum}行`).join(', ');
        addError(`[P0] 重复人员：${teamPart}"${name}" 出现在 ${lines}`);
      }
    }

    return { nameMap, teamNames };
  }

  // ---------- 队名变体检查 ----------
  function checkTeamVariants(teamNames) {
    if (teamNames.size <= 1) return;

    const canonToRaw = new Map(); // canonicalTeam → [原始队名]
    for (const raw of teamNames) {
      const canon = canonicalTeam(raw);
      if (!canonToRaw.has(canon)) canonToRaw.set(canon, []);
      canonToRaw.get(canon).push(raw);
    }

    for (const [canon, raws] of canonToRaw) {
      const unique = [...new Set(raws)];
      if (unique.length > 1) {
        const display = unique.map(r => `"${r}"`).join(' / ');
        addError(`[P0] 队名疑似不一致：${display}（规范化后相同，请统一队名）`);
      }
    }
  }

  // ---------- 交叉比对 ----------
  function crossCheckRoster(rosterPath, nameMap) {
    if (!rosterPath) return;

    let roster;
    try {
      roster = readJSON(rosterPath);
    } catch (e) {
      if (e instanceof SyntaxError) {
        addError(`[P0] 名单库 JSON 格式无效：${rosterPath}（${e.message}）`);
      } else {
        addError(`[P0] 无法读取名单库文件：${rosterPath}（${e.message}）`);
      }
      return;
    }

    if (!Array.isArray(roster)) {
      addError(`[P0] 名单库格式错误：应为数组`);
      return;
    }

    const rosterIndex = new Map();
    for (const p of roster) {
      const key = `${p.team || ''}::${p.name}`;
      rosterIndex.set(key, p);
      if (!rosterIndex.has(p.name)) rosterIndex.set(p.name, p);
    }

    let missingCount = 0;
    for (const [key, entries] of nameMap) {
      const [canonTeam, name] = key.split('::');
      const found = rosterIndex.has(key) || rosterIndex.has(name);
      if (!found) {
        missingCount++;
        const rawTeam = entries[0].team;
        addError(`[P0] 选手不在名单库中：${rawTeam ? rawTeam + ' ' : ''}"${name}"（第 ${entries[0].lineNum} 行）`);
      }
    }

    if (missingCount === 0) {
      console.log(`  ✅ 交叉比对通过：所有选手均在名单库中`);
    } else {
      console.log(`  ❌ 交叉比对发现 ${missingCount} 名选手不在名单库中`);
    }
  }

  function crossCheckLineups(lineupsPath, nameMap) {
    if (!lineupsPath) return;

    let lineups;
    try {
      lineups = readJSON(lineupsPath);
    } catch (e) {
      if (e instanceof SyntaxError) {
        addError(`[P0] 排阵 JSON 格式无效：${lineupsPath}（${e.message}）`);
      } else {
        addError(`[P0] 无法读取排阵文件：${lineupsPath}（${e.message}）`);
      }
      return;
    }

    const allLineupNames = new Set();
    for (const [key, data] of Object.entries(lineups)) {
      if (data.matches) {
        for (const m of data.matches) {
          for (const p of (m.players || [])) {
            if (p && p !== '待定') allLineupNames.add(p);
          }
        }
      }
    }

    const csvNames = new Set();
    for (const [key] of nameMap) {
      const [, name] = key.split('::');
      csvNames.add(name);
    }

    let missingCount = 0;
    for (const name of allLineupNames) {
      if (!csvNames.has(name)) {
        missingCount++;
        addError(`[P0] 排阵选手不在 CSV 名单中："${name}"`);
      }
    }

    if (missingCount === 0) {
      console.log(`  ✅ 排阵交叉比对通过：所有出场选手均在 CSV 名单中`);
    } else {
      console.log(`  ❌ 排阵交叉比对发现 ${missingCount} 名出场选手不在 CSV 名单中`);
    }
  }

  // ---------- 返回公开接口 ----------
  return {
    errors, warnings, addError, addWarning,
    checkHeaders, checkChineseCommaInFields, checkNames,
    checkTeamVariants, crossCheckRoster, crossCheckLineups
  };
}

// ======================== 主流程 ========================
function run(argv) {
  const args = argv || process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
用法：node csv-precheck.js <CSV文件> [选项]

选项：
  --roster <file.json>   交叉比对名单库（players 导出 JSON）
  --lineups <file.json>  交叉比对排阵数据（lineups 导出 JSON）
  --help, -h             显示帮助
`);
    return { exitCode: 0 };
  }

  const csvPath = args[0];
  const rosterIdx = args.indexOf('--roster');
  const lineupsIdx = args.indexOf('--lineups');
  const rosterPath = rosterIdx >= 0 ? args[rosterIdx + 1] : null;
  const lineupsPath = lineupsIdx >= 0 ? args[lineupsIdx + 1] : null;

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ 文件不存在：${csvPath}`);
    return { exitCode: 1 };
  }

  const checker = createChecker();

  console.log(`\n🔍 Legacy 团体赛 CSV 预检工具 v2`);
  console.log(`========================================`);
  console.log(`文件：${csvPath}`);
  if (rosterPath) console.log(`名单库：${rosterPath}`);
  if (lineupsPath) console.log(`排阵数据：${lineupsPath}`);
  console.log('');

  // 解析
  const parsed = parseCSV(csvPath);

  // 中文逗号分隔符检测
  if (parsed.chineseCommaDelimiter) {
    checker.addError(`[P0] CSV 文件疑似使用全角中文逗号"，"作为列分隔符（未检测到 ASCII 逗号）`);
    checker.addError(`     Legacy 系统仅识别 ASCII 逗号","作为分隔符，请修正 CSV 文件`);
    // 不继续解析数据行
  } else if (parsed.error) {
    console.error(`❌ ${parsed.error}`);
    return { exitCode: 1 };
  } else {
    const { headers, rows } = parsed;

    console.log(`📋 列头：${headers.join(' | ')}`);
    console.log(`📊 数据行：${rows.length}`);
    console.log('');

    // 列头检查
    console.log(`── 列头检查 ──`);
    const { nameIdx, teamIdx, groupIdx } = checker.checkHeaders(headers);
    if (nameIdx >= 0) console.log(`  ✅ 姓名列：第 ${nameIdx + 1} 列（${headers[nameIdx]}）`);
    if (teamIdx >= 0) console.log(`  ✅ 队名列：第 ${teamIdx + 1} 列（${headers[teamIdx]}）`);
    if (groupIdx >= 0) console.log(`  ✅ 组别列：第 ${groupIdx + 1} 列（${headers[groupIdx]}）`);
    console.log('');

    // 中文逗号字段级检查
    checker.checkChineseCommaInFields(rows, nameIdx, teamIdx, groupIdx);

    // 姓名检查（nameIdx === -1 时自动跳过，不产生次生误报）
    console.log(`── 姓名检查 ──`);
    const { nameMap, teamNames } = checker.checkNames(rows, nameIdx, teamIdx);
    console.log(`  提取选手数：${nameMap.size}`);
    console.log(`  队伍数：${teamNames.size}`);
    if (teamNames.size > 0) {
      console.log(`  队伍列表：${Array.from(teamNames).join(', ')}`);
    }
    console.log('');

    // 队名变体检查
    console.log(`── 队名一致性检查 ──`);
    checker.checkTeamVariants(teamNames);
    if (checker.errors.filter(e => e.includes('队名疑似不一致')).length === 0) {
      console.log(`  ✅ 队名无变体冲突`);
    }
    console.log('');

    // 交叉比对
    if (rosterPath || lineupsPath) {
      console.log(`── 交叉比对 ──`);
      checker.crossCheckRoster(rosterPath, nameMap);
      checker.crossCheckLineups(lineupsPath, nameMap);
      console.log('');
    }
  }

  // 输出结果
  console.log(`========================================`);
  console.log(`📊 检查结果汇总`);
  console.log(`========================================`);

  const { errors, warnings } = checker;

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`\n✅ 全部通过！CSV 可以安全导入 Legacy 系统`);
    return { exitCode: 0 };
  }

  if (errors.length > 0) {
    console.log(`\n❌ 发现 ${errors.length} 个错误（必须修复才能导入）：`);
    errors.forEach(e => console.log(`   ${e}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  发现 ${warnings.length} 个警告（建议检查）：`);
    warnings.forEach(w => console.log(`   ${w}`));
  }

  console.log('');
  if (errors.length > 0) {
    console.log(`🚫 结论：存在 P0 错误，不可导入。请修复后重新检查。`);
    return { exitCode: 1 };
  } else {
    console.log(`✅ 结论：无阻塞性错误，可以导入（但建议先处理警告）。`);
    return { exitCode: 0 };
  }
}

// 当作为主脚本运行时
if (require.main === module) {
  const result = run();
  process.exit(result.exitCode);
}

module.exports = { run, createChecker, canonicalTeam, stripBOM, parseCSV };
