/* 对账：protocols.js 中 el('x').addEventListener 的 x 是否都存在于 protocols.html */
const fs = require('fs');
const js = fs.readFileSync('assets/js/protocols.js', 'utf8');
const html = fs.readFileSync('protocols.html', 'utf8');
const re = /el\('([a-z0-9-]+)'\)\.addEventListener/g;
let m, miss = 0;
while ((m = re.exec(js))) {
  const id = m[1];
  if (!html.includes('id="' + id + '"')) { console.log('✗ HTML 缺 id="' + id + '"'); miss++; }
}
/* 反向：html 中 pl- 前缀交互元素是否都有绑定（抽查 button） */
const hb = html.match(/id="((?!pl-)[a-z0-9-]+)"[^>]*>/g) || [];
console.log('js→html 缺失:', miss);
/* 另查 querySelector 目标 */
const re2 = /querySelector\('\#([a-z0-9-]+)/g;
while ((m = re2.exec(js))) {
  if (!html.includes('id="' + m[1] + '"')) { console.log('✗ querySelector 缺 #' + m[1]); miss++; }
}
console.log(miss ? 'FAIL' : 'ALL MATCH');
