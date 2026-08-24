/* LAZY 区段内 })(); → }); 全量修正 */
const fs = require('fs');
const f = 'assets/js/protocols.js';
let t = fs.readFileSync(f, 'utf8');
const s = t.indexOf("LAZY('pl-tls'");
const e = t.indexOf("el('pl-ready').textContent = '16'");
if (s < 0 || e < 0 || e < s) { console.error('✗ 区段定位失败', s, e); process.exit(1); }
let seg = t.slice(s, e);
const n = (seg.match(/\}\)\(\);/g) || []).length;
seg = seg.split('})();').join('});');
t = t.slice(0, s) + seg + t.slice(e);
fs.writeFileSync(f, t);
console.log('fixed ' + n + ' closers in LAZY region');
