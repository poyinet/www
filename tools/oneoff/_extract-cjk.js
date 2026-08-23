/* 提取全站源文件中实际出现的 CJK 字符集（html/js/css/txt/md） */
const fs = require('fs');
const path = require('path');

const roots = ['.'];
const skipDirs = new Set(['node_modules', '.git', 'tools', 'docs']);
const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) { if (!skipDirs.has(f.name)) walk(path.join(dir, f.name)); continue; }
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
    // CJK 统一表意文字 + 扩展A + 兼容表意文字
    if ((cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) || (cp >= 0xF900 && cp <= 0xFAFF)) chars.add(ch);
  }
}
console.log('源文件数:', files.length);
console.log('唯一 CJK 字符数:', chars.size);
const list = [...chars].sort();
fs.writeFileSync('tools/report/site-cjk-chars.txt', list.join(''));
console.log('已保存 tools/report/site-cjk-chars.txt（供字体子集化）');
