/* 修复 i18n-ui.js：把「'k1': 'v1', 'k2': 'v2';」式残留行展开为逐键 d.zh/d.en 赋值 */
'use strict';
const fs = require('fs');
const FILE = 'assets/js/core/i18n-ui.js';
let lines = fs.readFileSync(FILE, 'utf8').split('\n');
const CJK = /[\u4e00-\u9fff]/;
const out = [];
for (const line of lines) {
  if (!/'[a-z0-9_.]+':\s*'/.test(line) || !line.includes("'workshop.") && !line.includes("'")) { out.push(line); continue; }
  /* 已是 d.xx[...] 赋值的行直接保留 */
  if (/d\.(zh|en)\['[^']+'\]\s*=/.test(line) && !/,\s*'[a-z0-9_.]+':\s*'/.test(line)) { out.push(line); continue; }
  const lang = CJK.test(line) ? 'zh' : 'en';
  const indent = line.match(/^\s*/)[0];
  /* 提取所有 'key': 'value' 对 */
  const pairs = [...line.matchAll(/'([a-z0-9_.]+)':\s*'((?:[^'\\]|\\.)*)'/g)];
  if (!pairs.length) { out.push(line); continue; }
  for (const p of pairs) {
    out.push(indent + "d." + lang + "['" + p[1] + "'] = '" + p[2] + "';");
  }
}
fs.writeFileSync(FILE, out.join('\n'), 'utf8');
console.log('normalized');
