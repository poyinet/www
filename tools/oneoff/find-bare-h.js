/* 全文件搜裸 H 引用 */
const fs = require('fs');
const t = fs.readFileSync('workshop.html', 'utf8');
const L = t.split(/\r?\n/);
L.forEach(function (x, i) {
  const m = x.match(/(^|[^.\w'"`-])H(?=[^.\w]|$)/g);
  if (m) console.log((i + 1) + ': ' + m.join('') + ' :: ' + x.trim().slice(0, 110));
});
