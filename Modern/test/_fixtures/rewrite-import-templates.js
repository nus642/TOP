// Rewrite published CSV templates with a real UTF-8 BOM and CRLF endings.
// 32-draw doubles = 32 pairs = 64 players, round 1 = 16 matches.
const fs = require("node:fs");
const path = require("node:path");

const SURNAMES = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡", "郭"];
const GIVEN = ["伟", "强", "芳", "敏"];
const names = [];
for (let s = 0; s < 16; s++) for (let g = 0; g < 4; g++) names.push(SURNAMES[s] + GIVEN[g]);

const lines = ["round,court,time,p1,p2,p3,p4,team1,team2"];
for (let m = 0; m < 16; m++) {
  const pairA = m * 2;
  const pairB = m * 2 + 1;
  const a = pairA * 2;
  const b = pairB * 2;
  const slot = Math.floor(m / 6);
  const time = `2026-09-12 08:${String(slot * 30).padStart(2, "0")}`;
  lines.push([
    1, `${(m % 6) + 1}号场`, time,
    names[a], names[a + 1], names[b], names[b + 1],
    `${names[a]} & ${names[a + 1]}`, `${names[b]} & ${names[b + 1]}`
  ].join(","));
}

const templateDir = path.join(__dirname, "..", "..", "operator", "templates");
fs.writeFileSync(path.join(templateDir, "top-import-sample-32.csv"),
  "\uFEFF" + lines.join("\r\n") + "\r\n", "utf8");

const templatePath = path.join(templateDir, "top-import-template.csv");
const templateContent = fs.readFileSync(templatePath, "utf8")
  .replace(/^\uFEFF/, "")
  .replace(/^\\ufeff/, "") // repair literal escape written by earlier tooling
  .replace(/\r?\n/g, "\r\n");
fs.writeFileSync(templatePath, "\uFEFF" + templateContent, "utf8");

console.log("Templates rewritten with real BOM + CRLF");
