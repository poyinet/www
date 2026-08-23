/* 列出孤儿游戏完整信息 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const gamesJs = fs.readFileSync(path.join(ROOT, 'assets/js/games.js'), 'utf8');
const storyJs = fs.readFileSync(path.join(ROOT, 'assets/js/stories.js'), 'utf8');

// 章节已用游戏
const used = new Set();
const uRe = /games: \[([^\]]+)\]/g;
let m;
while ((m = uRe.exec(storyJs))) {
  m[1].split(',').forEach((x) => {
    const id = x.trim().replace(/['"]/g, '');
    if (id) used.add(id);
  });
}

// 解析游戏条目
const entries = [];
const blockRe = /\{\s*id: '([a-z0-9-]+)',\s*title: '([^']*)',\s*category: '([^']*)',\s*desc: '([^']*)',\s*icon: '([^']*)'/g;
while ((m = blockRe.exec(gamesJs))) {
  entries.push({ id: m[1], title: m[2], category: m[3], desc: m[4], icon: m[5] });
}

const orphans = entries.filter((e) => !used.has(e.id));
console.log('=== 孤儿游戏 ' + orphans.length + ' 款（按分类）===');
const byCat = {};
orphans.forEach((e) => {
  (byCat[e.category] = byCat[e.category] || []).push(e);
});
Object.keys(byCat).forEach((cat) => {
  console.log('\n【' + cat + '】');
  byCat[cat].forEach((e) => console.log('  ' + e.id + ' · ' + e.title + ' · ' + e.desc));
});
