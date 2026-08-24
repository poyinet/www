/* 定位 workshop.html 隐写段残留的裸 W/H */
const fs = require('fs');
const t = fs.readFileSync('workshop.html', 'utf8');
const start = t.indexOf('隐写工坊（第六期');
const seg = t.slice(start, start + 5200);
const lines = seg.split(/\r?\n/);
lines.forEach(function (L, i) {
  const m = L.match(/(^|[^.\w'"`-])(W|H)(?=[^.\w]|$)/g);
  if (m) console.log(i + ': ' + m.join(',') + ' :: ' + L.trim().slice(0, 110));
});
