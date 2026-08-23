/* 内容完整性验证（用健壮解析替代正则） */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

console.log('=== 章节正文 en 完整性（找 .en 定义的实际长度）===');
const story = fs.readFileSync(path.join(ROOT, 'assets/js/core/i18n-story.js'), 'utf8');
// 简单策略：统计每章 .en 定义从 ' 到结尾引号（允许 \' 转义）——改为统计行长度
const lines = story.split('\n');
for (let i = 0; i < 12; i++) {
  const zhLine = lines.find((l) => l.includes("d.zh['st.c" + i + ".b']"));
  const enLine = lines.find((l) => l.includes("d.en['st.c" + i + ".b']"));
  console.log('c' + i + ': zh行=' + (zhLine ? zhLine.length : '缺失') + '  en行=' + (enLine ? enLine.length : '缺失') + (enLine && enLine.length < 300 ? '  ⚠️ 偏短' : ''));
}

console.log('\n=== 密件 16 件 desc/text（完整清单）===');
['rosetta','caesar-report','kindi','bacon-book','zimmermann','ultra','af','eastwind','colossus','venona','shannon','qmoney','bb84paper','pqc2024','ziyan','fanqie'].forEach((a) => {
  const hasDesc = dictHas("'sta." + a + ".desc'");
  const hasText = dictHas("'sta." + a + ".text'");
  console.log('  ' + a + ': desc=' + (hasDesc ? '✓' : '✗') + ' text=' + (hasText ? '✓' : '✗'));
});
function dictHas(k) {
  /* C2：sta.*.text 等长文在 archive 文件，两个文件都查 */
  const dict = fs.readFileSync(path.join(ROOT, 'assets/js/core/i18n-dict.js'), 'utf8') +
    (fs.existsSync(path.join(ROOT, 'assets/js/core/i18n-archive.js'))
      ? fs.readFileSync(path.join(ROOT, 'assets/js/core/i18n-archive.js'), 'utf8') : '');
  const m = dict.match(new RegExp("d\\.(zh|en)\\['" + k.replace(/\./g, '\\.') + "'\\] = '([\\s\\S]*?)';", 'm'));
  return !!(m && m[2] && m[2].length > 3);
}

console.log('\n=== 成就系统现状 ===');
const statsJs = fs.readFileSync(path.join(ROOT, 'assets/js/stats.js'), 'utf8');
console.log('stats.js 成就引用: ' + (statsJs.match(/achv|achievement|成就/g) || []).length + ' 处');
const rankJs = fs.readFileSync(path.join(ROOT, 'assets/js/rank.js'), 'utf8');
const ranks = rankJs.match(/id: '[^']+',/g) || [];
console.log('军衔等级: ' + ranks.length + ' 级');
ranks.slice(0, 8).forEach((r) => process.stdout.write(r.replace('id: ', '').replace(',', ' ')));

console.log('\n\n=== 参考文献/来源 ===');
const refs = [];
['stories.html', 'story.html', 'people.html', 'artifacts.html'].forEach((f) => {
  const c = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/参考|来源|参考文献|sources?|references?/i.test(c)) refs.push(f + ': 有');
});
console.log(refs.length ? refs.join('\n') : '无任何参考文献区块');

console.log('\n=== 术语表 ===');
const glossary = fs.readdirSync(ROOT).filter((f) => /gloss|term/i.test(f));
console.log(glossary.length ? glossary.join(', ') : '无术语表页面/文件');

console.log('\n=== 游戏注册项字段 ===');
const gamesJs = fs.readFileSync(path.join(ROOT, 'assets/js/games.js'), 'utf8');
console.log('含 path 字段: ' + (gamesJs.match(/path: /g) || []).length);
console.log('含 icon 字段: ' + (gamesJs.match(/icon: /g) || []).length);
console.log('含 bestMode 字段: ' + (gamesJs.match(/bestMode: /g) || []).length);
/* P1-A1：tag 字段已废弃（第二期改为 lvl/time 双标签），校验现行字段合法性 */
const lvlOk = (gamesJs.match(/lvl: '(?:easy|mid|hard)'/g) || []).length;
const timeOk = (gamesJs.match(/time: '(?:1min|5min|10min)'/g) || []).length;
const total = (gamesJs.match(/id: '/g) || []).length;
console.log('lvl 合法值: ' + lvlOk + '/' + total + (lvlOk === total ? ' ✓' : ' ✗ 有缺失/非法'));
console.log('time 合法值: ' + timeOk + '/' + total + (timeOk === total ? ' ✓' : ' ✗ 有缺失/非法'));
if (lvlOk !== total || timeOk !== total) process.exitCode = 1;
