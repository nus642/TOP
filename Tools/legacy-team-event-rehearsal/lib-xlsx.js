/**
 * lib-xlsx.js — 最小 XLSX 读写模块（零外部依赖）
 *
 * 目的：为团体赛预演包生成 / 解析真实可被 Legacy 导入器读取的 .xlsx 文件。
 * Legacy 的 master.html (handleImportTeamFile) 与 team_import.html 均使用
 * SheetJS 的 XLSX.read() 解析 Excel，因此预演日程必须是合法 OOXML xlsx。
 *
 * 代码证据（导入入口）：
 *   - Legacy/master.html  L2438: XLSX.read(new Uint8Array(...), { type: 'array' })
 *   - Legacy/team_import.html L88: XLSX.read(data, { type: 'array' })
 *   - 两者均 sheet_to_json(sheet, { header: 1, defval: '' }) 读取第一个工作表
 *
 * 本模块仅实现预演所需的极小子集：
 *   - 写：单工作表、inline string 单元格（保留换行，用于 VS 多行单元格）
 *   - 读：解析本地文件头/中央目录，解压，提取 inline string / shared string 单元格
 *
 * 仅用于离线预演包构建与校验，不触碰任何 Legacy 业务代码。
 */

'use strict';

const zlib = require('zlib');

// ======================== CRC-32 ========================
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ======================== ZIP 写 ========================
/**
 * 将 { 文件名: Buffer } 打包为 ZIP（deflate 压缩）。
 * @returns {Buffer}
 */
function zipCreate(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, data] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, 'utf-8');
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data, { level: 9 });

    // Local file header
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    lh.writeUInt16LE(8, 8); // method: deflate
    lh.writeUInt16LE(0, 10); // mod time
    lh.writeUInt16LE(0x21, 12); // mod date
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28); // extra len

    localParts.push(lh, nameBuf, compressed);

    // Central directory header
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); // version made by
    ch.writeUInt16LE(20, 6); // version needed
    ch.writeUInt16LE(0x0800, 8); // flags
    ch.writeUInt16LE(8, 10); // method
    ch.writeUInt16LE(0, 12); // time
    ch.writeUInt16LE(0x21, 14); // date
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(compressed.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30); // extra
    ch.writeUInt16LE(0, 32); // comment
    ch.writeUInt16LE(0, 34); // disk
    ch.writeUInt16LE(0, 36); // internal attrs
    ch.writeUInt32LE(0, 38); // external attrs
    ch.writeUInt32LE(offset, 42); // local header offset

    centralParts.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  const count = Object.keys(entries).length;
  eocd.writeUInt16LE(count, 8);
  eocd.writeUInt16LE(count, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

// ======================== ZIP 读 ========================
/**
 * 解析 ZIP，返回 { 文件名: Buffer }。仅支持 deflate 与 store。
 * @param {Buffer} buf
 */
function zipRead(buf) {
  const result = {};
  // 定位 EOCD（从尾部向前找签名 0x06054b50）
  let eocdOff = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocdOff = i; break; }
  }
  if (eocdOff === -1) throw new Error('无效 ZIP：未找到 EOCD');
  const cdOff = buf.readUInt32LE(eocdOff + 16);
  const cdCount = buf.readUInt16LE(eocdOff + 10);

  let p = cdOff;
  for (let i = 0; i < cdCount; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('无效中央目录');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf-8');

    // 读 local header 拿数据偏移
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const compData = buf.slice(dataStart, dataStart + compSize);

    result[name] = method === 8
      ? zlib.inflateRawSync(compData)
      : Buffer.from(compData);

    p += 46 + nameLen + extraLen + commentLen;
  }
  return result;
}

// ======================== XML 转义 ========================
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ======================== XLSX 写 ========================
/**
 * 创建单工作表 xlsx。
 * @param {Array<Array<string>>} rows 二维数组，每个非空单元格写为 inline string
 * @returns {Buffer} xlsx 字节
 */
function xlsxWrite(rows) {
  let sheetRows = '';
  rows.forEach((row, r) => {
    const cells = [];
    row.forEach((val, c) => {
      if (val === '' || val === null || val === undefined) return;
      const ref = colName(c) + (r + 1);
      cells.push(
        `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(val)}</t></is></c>`
      );
    });
    if (cells.length > 0) {
      sheetRows += `<row r="${r + 1}">${cells.join('')}</row>`;
    }
  });

  const sheetXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${sheetRows}</sheetData></worksheet>`;

  const workbookXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="预演日程" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `</Relationships>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `</Types>`;

  return zipCreate({
    '[Content_Types].xml': Buffer.from(contentTypes, 'utf-8'),
    '_rels/.rels': Buffer.from(rootRels, 'utf-8'),
    'xl/workbook.xml': Buffer.from(workbookXml, 'utf-8'),
    'xl/_rels/workbook.xml.rels': Buffer.from(workbookRels, 'utf-8'),
    'xl/worksheets/sheet1.xml': Buffer.from(sheetXml, 'utf-8'),
  });
}

/** 列号 0->A, 1->B ... */
function colName(n) {
  let s = '';
  n++;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ======================== XLSX 读 ========================
/**
 * 读取单工作表，返回二维数组（与 sheet_to_json header:1 语义近似）。
 * @param {Buffer} buf xlsx 字节
 * @returns {Array<Array<string>>}
 */
function xlsxRead(buf) {
  const files = zipRead(buf);
  const sheetKey = Object.keys(files).find(k => /^xl\/worksheets\/sheet1\.xml$/i.test(k))
    || Object.keys(files).find(k => /xl\/worksheets\//i.test(k));
  if (!sheetKey) throw new Error('xlsx 中未找到工作表');
  const xml = files[sheetKey].toString('utf-8');

  // 共享字符串（可选）
  let shared = [];
  const sstKey = Object.keys(files).find(k => /xl\/sharedStrings\.xml$/i.test(k));
  if (sstKey) {
    const sstXml = files[sstKey].toString('utf-8');
    shared = [...sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m =>
      [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => unescapeXml(t[1])).join('')
    );
  }

  const rows = [];
  const rowMatches = [...xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)];
  for (const rm of rowMatches) {
    const rowIdx = parseInt(rm[1], 10) - 1;
    rows[rowIdx] = rows[rowIdx] || [];
    const cellMatches = [...rm[2].matchAll(/<c\s+([^>]*?)>([\s\S]*?)<\/c>|<c\s+([^>]*?)\/>/g)];
    for (const cm of cellMatches) {
      const attrs = cm[1] || cm[3] || '';
      const body = cm[2] || '';
      const refM = attrs.match(/r="([A-Z]+)\d+"/);
      if (!refM) continue;
      const colIdx = refM[1].split('').reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
      const typeM = attrs.match(/t="([^"]+)"/);
      const type = typeM ? typeM[1] : 'n';
      let val = '';
      if (type === 'inlineStr') {
        val = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => unescapeXml(t[1])).join('');
      } else if (type === 's') {
        const idxM = body.match(/<v>(\d+)<\/v>/);
        val = idxM ? (shared[parseInt(idxM[1], 10)] || '') : '';
      } else {
        const vM = body.match(/<v>([\s\S]*?)<\/v>/);
        val = vM ? unescapeXml(vM[1]) : '';
      }
      rows[rowIdx][colIdx] = val;
    }
  }
  // 规整：补齐空洞为 ''
  return rows.map(r => {
    const arr = Array.isArray(r) ? r : [];
    const maxCol = arr.length;
    const out = [];
    for (let i = 0; i < maxCol; i++) out.push(arr[i] === undefined ? '' : arr[i]);
    return out;
  });
}

function unescapeXml(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

module.exports = { xlsxWrite, xlsxRead, zipCreate, zipRead, crc32, colName };
