/* 检查指定键是否在 zh/en 双份存在（按出现次数） */
const fs = require('fs');
const c = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8');
const keys = ['map.title', 'map.sub', 'cm.title', 'cm.sub', 'quotes.title', 'quotes.sub',
  'stats.viz', 'stats.vizChq', 'stats.vizGloss', 'stats.vizMap', 'stats.vizSub'];
let bad = 0;
keys.forEach(k => {
  const re = new RegExp("'" + k + "':", 'g');
  const n = (c.match(re) || []).length;
  console.log(n === 2 ? '✓' : '✗(' + n + ') ' + k);
  if (n !== 2) bad++;
});
console.log(bad ? '✗ ' + bad + ' 个键异常' : '✓ 全部 zh/en 双份');
