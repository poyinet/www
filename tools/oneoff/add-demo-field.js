/* 给 c1/c3/c5 注入 demo 字段（P3-3 原理演示） */
const fs = require('fs');
const F = 'assets/js/stories.js';
let s = fs.readFileSync(F, 'utf8');

const DEMOS = { caesar: 'caesar', bacon: 'vigenere', bletchley: 'enigma' };
let n = 0;
for (const [chId, demo] of Object.entries(DEMOS)) {
  const re = new RegExp("(\\{ id: '" + chId + "',[\\s\\S]*?challenge: '[a-z0-9-]+')(, demo: '[a-z]+')?([\\s\\S]*?\\},)");
  s = s.replace(re, function (m, head, existing, tail) {
    n++;
    return head + ", demo: '" + demo + "'" + tail;
  });
}
fs.writeFileSync(F, s);
console.log('✓ 注入 ' + n + ' 个 demo 字段');
