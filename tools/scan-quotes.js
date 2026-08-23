/* 扫描 stp./sta. 键行与 glossary term 行：奇数个未转义引号即可疑 */
const fs = require('fs');
function scan(file, filter) {
  const c = fs.readFileSync(file, 'utf8');
  let bad = 0;
  c.split('\n').forEach((l, i) => {
    if (!filter(l)) return;
    let cnt = 0;
    for (let j = 0; j < l.length; j++) {
      if (l[j] === "'" && (j === 0 || l[j - 1] !== '\\')) cnt++;
    }
    if (cnt % 2 !== 0) { console.log('可疑 ' + file + ':' + (i + 1) + ': ' + l.substring(0, 90)); bad++; }
  });
  return bad;
}
let total = 0;
const stpStaFilter = l => l.includes("d.zh['stp.") || l.includes("d.en['stp.") || l.includes("d.zh['sta.") || l.includes("d.en['sta.");
total += scan('assets/js/core/i18n-dict.js', stpStaFilter);
/* C2：stp/sta 长文迁至 archive 文件，同样纳入引号安全扫描 */
if (fs.existsSync('assets/js/core/i18n-archive.js')) {
  total += scan('assets/js/core/i18n-archive.js', stpStaFilter);
}
total += scan('glossary.html', l => l.includes("term: '"));
console.log('可疑行总计: ' + total);
process.exit(total ? 1 : 0);
