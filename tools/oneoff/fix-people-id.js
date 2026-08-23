/* 修复：people-8.json 中人物 id 'zimmermann' → 'pzimmermann'（避免与密件 id zimmermann 混淆） */
const fs = require('fs');
const p = 'tools/report/people-8.json';
let data = JSON.parse(fs.readFileSync(p, 'utf8'));
let changed = 0;
data.forEach(pp => {
  if (pp.id === 'zimmermann') { pp.id = 'pzimmermann'; changed++; }
});
fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
console.log('改名 ' + changed + ' 条 (zimmermann → pzimmermann)');
console.log('人物 id 列表: ' + data.map(d => d.id).join(', '));
