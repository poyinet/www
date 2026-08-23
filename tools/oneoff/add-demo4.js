/* D4：给 4 章注入新 demo 字段 */
const fs = require('fs');
const F = 'assets/js/stories.js';
let s = fs.readFileSync(F, 'utf8');
const DEMOS = { arab: 'affine', ww1: 'rail', midway: 'playfair', lorenz: 'xor' };
let n = 0;
for (const [chId, demo] of Object.entries(DEMOS)) {
  const re = new RegExp("(\\{ id: '" + chId + "',[\\s\\S]*?)(\\},)");
  s = s.replace(re, function (m, head, tail) {
    n++;
    /* 在 challenge 字段后插 demo */
    const chField = head.match(/challenge: '[a-z0-9-]+'/);
    if (chField) {
      return head.replace(chField[0], chField[0] + ", demo: '" + demo + "'") + tail;
    }
    return head + ", demo: '" + demo + "'" + tail;
  });
}
fs.writeFileSync(F, s);
console.log('✓ 注入 ' + n + ' 个 demo（arab/ww1/midway/lorenz）');
