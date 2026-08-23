/* 提取全站源文件中所有 >0x7F 的字符（含中文标点/全角符号），供字体子集化 */
const fs = require('fs');
const path = require('path');

const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) { if (f.name !== '.git' && f.name !== 'node_modules') walk(path.join(dir, f.name)); continue; }
    if (/\.(html|js|css|txt|md|xml|xsl|json)$/.test(f.name)) files.push(path.join(dir, f.name));
  }
}
walk('.');

const chars = new Set();
for (const f of files) {
  let s;
  try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp > 0x7F) chars.add(ch); // 所有非 ASCII（含中文标点）
  }
}
const list = [...chars].sort();
console.log('非 ASCII 唯一字符数:', list.length);
fs.writeFileSync('tools/report/site-chars.txt', list.join(''));
console.log('已保存 tools/report/site-chars.txt');
