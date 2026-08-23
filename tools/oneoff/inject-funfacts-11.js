/* ============================================================
   G3 冷知识注入：funfacts-11.json → i18n-story.js 的 st.c<0-10>.facts2 键
   幂等：按 chapter 去重。用法：node tools/inject-funfacts-11.js
   ============================================================ */
const fs = require('fs');

const path = 'assets/js/core/i18n-story.js';
const data = JSON.parse(fs.readFileSync('tools/report/funfacts-11.json', 'utf8'));
const NUM = { dawn: 'c0', caesar: 'c1', arab: 'c2', bacon: 'c3', ww1: 'c4', bletchley: 'c5', midway: 'c6', purple: 'c7', lorenz: 'c8', venona: 'c9', modern: 'c10' };

let src = fs.readFileSync(path, 'utf8');
const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const lines = [];
data.forEach(f => {
  const key = 'st.' + NUM[f.chapter] + '.facts2';
  if (src.includes("'" + key + "'")) { console.log('跳过已有: ' + key); return; }
  lines.push("  d.zh['" + key + "'] = '" + esc(f.zh) + "';");
  lines.push("  d.en['" + key + "'] = '" + esc(f.en) + "';");
});
if (lines.length) {
  src = src.replace(/\n\}\)\(\);\s*$/, '\n' + lines.join('\n') + '\n})();');
  fs.writeFileSync(path, src);
}
console.log('冷知识注入: 新增 ' + lines.length + ' 条（' + (lines.length / 2) + ' 章 × zh/en）');
