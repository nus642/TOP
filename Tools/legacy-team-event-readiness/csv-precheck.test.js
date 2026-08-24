/**
 * csv-precheck.js 自动化测试
 *
 * 运行：node --test Tools/legacy-team-event-readiness/csv-precheck.test.js
 *
 * 所有测试使用临时目录，不写入仓库，不包含真实人员信息。
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const TOOL = path.join(__dirname, 'csv-precheck.js');

// ======================== 临时目录管理 ========================
let tmpDir;

function writeTmp(name, content, encoding) {
  const fp = path.join(tmpDir, name);
  if (Buffer.isBuffer(content)) {
    fs.writeFileSync(fp, content);
  } else {
    fs.writeFileSync(fp, content, encoding || 'utf-8');
  }
  return fp;
}

function runTool(csvPath, extraArgs) {
  const args = [TOOL, csvPath, ...(extraArgs || [])];
  try {
    const stdout = execFileSync(process.execPath, args, {
      encoding: 'utf-8',
      timeout: 10000,
      env: { ...process.env }
    });
    return { exitCode: 0, stdout };
  } catch (e) {
    return { exitCode: e.status || 1, stdout: (e.stdout || '') + (e.stderr || '') };
  }
}

// ======================== 测试套件 ========================

describe('csv-precheck', () => {
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-precheck-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ---------- 1. 正确示例 → exit 0 ----------
  it('T01: 正确示例 CSV → exit 0', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,雄鹰队,公开组\n`;
    const fp = writeTmp('t01.csv', csv);
    const r = runTool(fp);
    assert.equal(r.exitCode, 0, `应通过，输出：${r.stdout}`);
  });

  // ---------- 2. UTF-8 BOM CSV → exit 0 ----------
  it('T02: UTF-8 BOM CSV → exit 0', () => {
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const csvBody = Buffer.from('姓名,队名,组别\n张三,猛虎队,公开组\n', 'utf-8');
    const fp = writeTmp('t02.csv', Buffer.concat([bom, csvBody]));
    const r = runTool(fp);
    assert.equal(r.exitCode, 0, `BOM CSV 应通过，输出：${r.stdout}`);
  });

  // ---------- 3. UTF-8 BOM roster JSON → 正常交叉检查 ----------
  it('T03: UTF-8 BOM roster JSON → 正常交叉检查', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n`;
    const csvFp = writeTmp('t03.csv', csv);

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const jsonBody = Buffer.from(JSON.stringify([{ name: '张三', team: '猛虎队' }]), 'utf-8');
    const rosterFp = writeTmp('t03-roster.json', Buffer.concat([bom, jsonBody]));

    const r = runTool(csvFp, ['--roster', rosterFp]);
    assert.equal(r.exitCode, 0, `BOM roster 应正常交叉检查，输出：${r.stdout}`);
    assert.match(r.stdout, /交叉比对通过/, '应显示交叉比对通过');
  });

  // ---------- 4. 猛虎队 / 猛 虎队 → P0 ----------
  it('T04: 队名空格变体（猛虎队 / 猛 虎队）→ P0, exit 非 0', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,猛 虎队,公开组\n`;
    const fp = writeTmp('t04.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /队名疑似不一致/, '应报告队名不一致');
    assert.match(r.stdout, /"猛虎队"/, '应包含原始队名');
    assert.match(r.stdout, /"猛 虎队"/, '应包含原始队名');
  });

  // ---------- 5. 队名内部多余空格差异 → P0 ----------
  it('T05: 队名内部多余空格差异 → P0, exit 非 0', () => {
    // 注意：CSV 解析器 trim 字段前后空格，但内部空格保留
    const csv = `姓名,队名,组别\n张三,猛 虎 队,公开组\n李四,猛虎队,公开组\n`;
    const fp = writeTmp('t05.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /队名疑似不一致/, '应报告队名不一致');
    assert.match(r.stdout, /"猛 虎 队"/, '应包含原始队名');
    assert.match(r.stdout, /"猛虎队"/, '应包含原始队名');
  });

  // ---------- 6. 全角字母 NFKC 规范化 → P0 ----------
  it('T06: 全角字母 NFKC 后形成队名变体 → P0', () => {
    // Ａ = U+FF21 (fullwidth A), NFKC → A
    const csv = `姓名,队名,组别\n张三,TeamA,公开组\n李四,Te\uFF41mA,公开组\n`;
    const fp = writeTmp('t06.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '全角字母应被检测');
    assert.match(r.stdout, /队名疑似不一致/, '应报告队名不一致');
  });

  // ---------- 7. 中文逗号作为 CSV 分隔符 → P0 ----------
  it('T07: 中文逗号作为 CSV 分隔符 → P0, exit 非 0', () => {
    const csv = `姓名，队名，组别\n张三，猛虎队，公开组\n`;
    const fp = writeTmp('t07.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /全角中文逗号.*列分隔符/, '应报告中文逗号分隔符问题');
  });

  // ---------- 8. 姓名含中文逗号 → P0 ----------
  it('T08: 姓名含中文逗号 → P0, exit 非 0', () => {
    const csv = `姓名,队名,组别\n张三，李四,猛虎队,公开组\n`;
    const fp = writeTmp('t08.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /姓名中包含中文逗号/, '应提示姓名含中文逗号');
    assert.match(r.stdout, /如需分隔多人/, '应给出替换指导');
  });

  // ---------- 9. 缺少姓名列 → 只报列头问题，不追加"姓名为空" ----------
  it('T09: 缺少姓名列 → 只报告列头问题，不追加次生错误', () => {
    const csv = `Name,队名,组别\n张三,猛虎队,公开组\n李四,雄鹰队,公开组\n`;
    const fp = writeTmp('t09.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /未找到"姓名"列/, '应报告列头问题');
    assert.doesNotMatch(r.stdout, /姓名为空/, '不应产生次生"姓名为空"错误');
  });

  // ---------- 10. 无效 roster JSON → 清晰错误, exit 非 0 ----------
  it('T10: 无效 roster JSON → 清晰错误, exit 非 0', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n`;
    const csvFp = writeTmp('t10.csv', csv);
    const rosterFp = writeTmp('t10-roster.json', '{invalid json!!!}');
    const r = runTool(csvFp, ['--roster', rosterFp]);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /JSON 格式无效/, '应报告 JSON 格式无效');
  });

  // ---------- 11. 重复人员 → P0 ----------
  it('T11: 同队重复人员 → P0, exit 非 0', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n张三,猛虎队,公开组\n`;
    const fp = writeTmp('t11.csv', csv);
    const r = runTool(fp);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /重复人员/, '应报告重复人员');
    assert.match(r.stdout, /"张三"/, '应包含重复姓名');
  });

  // ---------- 12. 名单库缺少人员 → P0 ----------
  it('T12: 名单库缺少人员 → P0, exit 非 0', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n孙八,猛虎队,公开组\n`;
    const csvFp = writeTmp('t12.csv', csv);
    const rosterFp = writeTmp('t12-roster.json', JSON.stringify([
      { name: '张三', team: '猛虎队' }
    ]));
    const r = runTool(csvFp, ['--roster', rosterFp]);
    assert.notEqual(r.exitCode, 0, '应报错');
    assert.match(r.stdout, /选手不在名单库中/, '应报告选手不在名单库');
    assert.match(r.stdout, /"孙八"/, '应包含缺失选手姓名');
  });

  // ---------- 额外：canonicalTeam 单元测试 ----------
  it('T13: canonicalTeam 函数正确规范化', () => {
    const { canonicalTeam } = require('./csv-precheck.js');
    // 空格去除
    assert.equal(canonicalTeam('猛 虎队'), canonicalTeam('猛虎队'));
    // 大小写统一
    assert.equal(canonicalTeam('TeamA'), canonicalTeam('teama'));
    // NFKC：全角 → 半角
    assert.equal(canonicalTeam('Te\uFF41mA'), canonicalTeam('TeamA'));
    // 前后空格
    assert.equal(canonicalTeam(' 猛虎队 '), canonicalTeam('猛虎队'));
    // 不同队名不应相等
    assert.notEqual(canonicalTeam('猛虎队'), canonicalTeam('雄鹰队'));
  });
});
