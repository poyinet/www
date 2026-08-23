/* 验证 7 件新密件全链：ARTIFACTS 数组 + sta.* 键 */
const fs = require('fs');
const ids = ['culper-ring', 'bazeries-cylinder', 'commercial-enigma', 'navajo-code', 'monastic-cipher', 'civilwar-disk', 'adfgvx-break'];

/* 1. stories.js ARTIFACTS */
const s = fs.readFileSync('assets/js/stories.js', 'utf8');
const m = s.match(/window\.ARTIFACTS = \[([\s\S]*?)\n  \];/);
const artIds = (m[1].match(/id: '[a-z0-9-]+'/g) || []).map(x => x.replace(/id: '|'/g, ''));
console.log('ARTIFACTS 总数: ' + artIds.length);
ids.forEach(id => console.log((artIds.includes(id) ? '✓' : '✗') + ' ' + id + ' 在 ARTIFACTS'));

/* 2. i18n-dict.js + i18n-archive.js（C2 后 sta.*.text 在 archive）sta.* 键 */
const d = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8') +
  (fs.existsSync('assets/js/core/i18n-archive.js') ? fs.readFileSync('assets/js/core/i18n-archive.js', 'utf8') : '');
let bad = 0;
ids.forEach(id => {
  ['name', 'era', 'desc', 'text'].forEach(field => {
    const zh = d.includes("d.zh['sta." + id + "." + field + "']");
    const en = d.includes("d.en['sta." + id + "." + field + "']");
    if (!zh || !en) { console.log('✗ ' + id + '.' + field + ' 缺键 (zh=' + zh + ' en=' + en + ')'); bad++; }
  });
});
console.log(bad ? '✗ ' + bad + ' 处缺键' : '✓ 7 件 × 4 字段 × zh/en = 56 条 sta.* 键全部存在');
console.log('sta.*.name 键总数: ' + (d.match(/sta\.[a-z0-9-]+\.name/g) || []).length);
