/* 盲点检查：孤儿游戏、成就清单、章节覆盖 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const gamesJs = fs.readFileSync(path.join(ROOT, 'assets/js/games.js'), 'utf8');
const storyJs = fs.readFileSync(path.join(ROOT, 'assets/js/stories.js'), 'utf8');

// 全部游戏 id
const gameIds = [];
const gRe = /id: '([a-z0-9-]+)',\s*title:/g;
let m;
while ((m = gRe.exec(gamesJs))) gameIds.push(m[1]);

// 章节引用的游戏
const used = new Set();
const uRe = /games: \[([^\]]+)\]/g;
while ((m = uRe.exec(storyJs))) {
  m[1].split(',').forEach((x) => {
    const id = x.trim().replace(/['"]/g, '');
    if (id) used.add(id);
  });
}
const orphans = gameIds.filter((id) => !used.has(id));
console.log('游戏总数: ' + gameIds.length);
console.log('进章节的游戏: ' + used.size);
console.log('孤儿游戏（未进任何章节）: ' + orphans.length);
console.log(orphans.join(', '));

// 章节覆盖密度
const chapters = [];
const cRe = /games: \[([^\]]+)\]/g;
while ((m = cRe.exec(storyJs))) {
  const n = m[1].split(',').filter((x) => x.trim()).length;
  chapters.push(n);
}
console.log('\n每章游戏数: ' + chapters.join(' / '));

// 成就清单
const statsJs = fs.readFileSync(path.join(ROOT, 'assets/js/stats.js'), 'utf8');
const achRe = /id: '([a-z0-9-]+)',/g;
const ach = [];
while ((m = achRe.exec(statsJs))) ach.push(m[1]);
console.log('\nstats.js 成就/条目 id: ' + ach.join(', '));

// 军衔键
const rankJs = fs.readFileSync(path.join(ROOT, 'assets/js/rank.js'), 'utf8');
console.log('\n军衔等级数: ' + (rankJs.match(/id: '/g) || []).length);
