/* 事故恢复：扫描全站 i18n 键引用，对比 story/archive/game-i18n 现存键，输出 dict 缺失清单 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } };

/* 1) 收集「现存键」：i18n-story + i18n-archive + 各游戏 *-i18n.js */
const have = new Set();
const collectFrom = (txt) => {
  for (const m of txt.matchAll(/d\.(zh|en)\['([^']+)'\]\s*=/g)) have.add(m[2]);
};
collectFrom(read('assets/js/core/i18n-story.js'));
collectFrom(read('assets/js/core/i18n-archive.js'));
for (const dir of fs.readdirSync(path.join(ROOT, 'games'))) {
  const p = path.join(ROOT, 'games', dir, dir + '-i18n.js');
  if (fs.existsSync(p)) collectFrom(fs.readFileSync(p, 'utf8'));
}

/* 2) 收集「被引用键」 */
const used = new Map(); /* key -> [来源] */
function use(k, src) { if (!used.has(k)) used.set(k, []); used.get(k).push(src); }
function scan(txt, src) {
  for (const m of txt.matchAll(/T\('([a-z0-9_.]+)'\)/gi)) use(m[1], src);
  for (const m of txt.matchAll(/data-i18n="([^"]+)"/g)) use(m[1], src);
  for (const m of txt.matchAll(/data-i18n-attr="([^|"]+)\|/g)) use(m[1], src);
  for (const m of txt.matchAll(/t\('([a-z0-9_.]+)'\)/g)) use(m[1], src); /* Arcade.i18n.t(...) */
}
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) scan(read(f), f);
scan(read('assets/js/home.js'), 'home.js');
scan(read('assets/js/lobby.js'), 'lobby.js');
scan(read('assets/js/shell.js'), 'shell.js');
scan(read('assets/js/stats.js'), 'stats.js');
scan(read('assets/js/nav.js'), 'nav.js');
scan(read('assets/js/workshop.js'), 'workshop.js');
scan(read('assets/js/stories.js'), 'stories.js');
scan(read('assets/js/timeline.js'), 'timeline.js');
scan(read('assets/js/map.js'), 'map.js');
scan(read('assets/js/quiz.js'), 'quiz.js');
scan(read('assets/js/chapter-quiz.js'), 'chapter-quiz.js');
scan(read('assets/js/machine.js'), 'machine.js');
scan(read('assets/js/quotes.js'), 'quotes.js');
scan(read('assets/js/daily-fact.js'), 'daily-fact.js');
scan(read('assets/js/save-manager.js'), 'save-manager.js');
scan(read('sw.js'), 'sw.js');

/* 3) 动态键模式展开（结构性推导） */
const dyn = [];
const storiesJs = read('assets/js/stories.js');
/* stp.<id>.* for PEOPLE ids; sta.<id>.* for ARTIFACTS */
for (const m of storiesJs.matchAll(/'( [a-z-]+)'?,/g)) {}
const peopleIds = [...storiesJs.matchAll(/^'?\s*'([a-z-]+)',?$/gm)].map(m => m[1]);
/* PEOPLE 数组提取 */
const peopleArrM = storiesJs.match(/window\.PEOPLE = \[([\s\S]*?)\];/);
const pids = peopleArrM ? [...peopleArrM[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]) : [];
for (const pid of pids) for (const f of ['name', 'icon', 'role', 'era', 'fact', 'bio', 'quote']) dyn.push('stp.' + pid + '.' + f);
/* ARTIFACTS ids */
const artM = storiesJs.match(/window\.ARTIFACTS = \[([\s\S]*?)\];/);
const aids = artM ? [...artM[1].matchAll(/id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]) : [];
for (const aid of aids) for (const f of ['name', 'icon', 'era', 'desc', 'text']) dyn.push('sta.' + aid + '.' + f);
/* era 键 */
for (let i = 0; i <= 11; i++) dyn.push('era' + i);
/* g.*.t/.d per game */
const gamesJs = read('assets/js/games.js');
const gids = [...gamesJs.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]);
for (const gid of gids) { dyn.push('g.' + gid + '.t'); dyn.push('g.' + gid + '.d'); }

for (const k of dyn) if (!used.has(k)) use(k, '(dynamic)');

/* 4) 缺失 = 引用 - 现存 */
const missing = [...used.keys()].filter(k => !have.has(k)).sort();
const byPrefix = {};
for (const k of missing) {
  const p = k.split('.').slice(0, 2).join('.');
  byPrefix[p] = (byPrefix[p] || 0) + 1;
}
console.log('现存键:', have.size, ' 引用键:', used.size, ' 缺失:', missing.length);
console.log('\n按前缀分布:');
Object.entries(byPrefix).sort((a, b) => b[1] - a[1]).forEach(([p, n]) => console.log(' ', p.padEnd(20), n));
fs.writeFileSync(path.join(process.env.TEMP || '.', 'opencode', 'missing-keys.json'), JSON.stringify(missing, null, 1));
console.log('\n清单已写入 %TEMP%\\opencode\\missing-keys.json');
