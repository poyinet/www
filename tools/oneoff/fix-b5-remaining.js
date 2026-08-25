/* B5: timeline fixes + extras comments */
const fs = require('fs');
const TL = 'assets/js/timeline.js';
let t = fs.readFileSync(TL, 'utf8');
let n = 0;

/* Plutarch y:60 -> y:100 */
if (t.includes('y: 60,')) {
  t = t.split('y: 60,').join('y: 100,');
  n++;
  console.log('OK Plutarch 60->100');
}

/* Rejewski link fix */
const ri = t.indexOf('Rejewski');
if (ri >= 0) {
  const seg = t.slice(ri, ri + 300);
  if (seg.includes("'turing'")) {
    t = t.slice(0, ri) + seg.replace("'turing'", "'rejewski'") + t.slice(ri + 300);
    n++;
    console.log('OK Rejewski link turing->rejewski');
  }
}

/* 国密 SMS4 note */
if (t.includes('国密 SM 系列算法公布')) {
  t = t.replace('国密 SM 系列算法公布', 'SMS4 公开 \u00b7 国密系列起步');
  n++;
  console.log('OK 国密 SMS4');
}

fs.writeFileSync(TL, t);
console.log('timeline done: ' + n + ' fixes');

/* extras.js comments */
const E = 'assets/js/core/extras.js';
let e = fs.readFileSync(E, 'utf8');
let en = 0;
if (e.includes('11 章')) { e = e.split('11 章').join('12 章'); en++; }
if (e.includes('11 件')) { e = e.split('11 件').join('41 件'); en++; }
if (en) { fs.writeFileSync(E, e); console.log('OK extras comments ' + en); }
