#!/usr/bin/env node
/**
 * build-rehearsal-xlsx.js — 生成预演日程文件 rehearsal-schedule.xlsx
 *
 * 日程单元格格式完全依据 Legacy/master.html parseMatchCell 的实际解析逻辑：
 *   - L2445: 单元格文本含 'VS'（大小写不敏感）
 *   - L2467: 按换行拆分为多行
 *   - L2468: 必须存在独立一行 'VS'（toUpperCase() === 'VS'）
 *   - L2465: 单元格不得含 半决赛|决赛|胜方|负方|名|交叉（否则被过滤不建房）
 *   - L2471: 组别提取正则 /(公开|常青|青年|中年|U\d+)[A-Za-z0-9_]*组?/
 *   - L2479: '公开组' 行与 groupName 相等会被跳过，队伍名取其余行
 *   - L2500-2506: 队伍名与组别必须与大名单球员匹配（组别精确相等 + 队名互含）
 *
 * 因此单元格采用四行结构：
 *   第 1 行: 组别名（公开组）
 *   第 2 行: 队伍 A 名称（须与排练名单队名列一致）
 *   第 3 行: VS
 *   第 4 行: 队伍 B 名称（须与排练名单队名列一致）
 *
 * 用法：node build-rehearsal-xlsx.js [输出路径]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { xlsxWrite } = require('./lib-xlsx');

// 与 rehearsal-roster.csv 严格一致的队名与组别
const GROUP = '公开组';
const TEAM_A = '先锋预备队';
const TEAM_B = '铁壁预备队';

const vsCell = [GROUP, TEAM_A, 'VS', TEAM_B].join('\n');

// 第一个工作表、第一个单元格（master.html L2439 只读第一个 sheet）
const rows = [[vsCell]];

const outPath = process.argv[2]
  || path.join(__dirname, 'rehearsal-schedule.xlsx');

fs.writeFileSync(outPath, xlsxWrite(rows));
console.log(`✅ 已生成日程文件: ${outPath}`);
console.log(`   VS 单元格内容（4 行）:`);
vsCell.split('\n').forEach(l => console.log(`     | ${l}`));
