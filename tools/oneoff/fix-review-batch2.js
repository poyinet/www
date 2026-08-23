/* 复查修复批次2：根页面 meta 数字同步（105款→108 / 29件→41 / 60题→110 / 40事件→44 / 21天→24天） */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const JOBS = {
  'games.html': [['105 款', '108 款'], ['105 mini-games', '108 mini-games']],
  'index.html': [['105 款', '108 款'], ['105 mini-games', '108 mini-games']],
  'artifacts.html': [['29 件历史密件', '41 件历史密件'], ['29 historical cipher artifacts', '41 historical cipher artifacts']],
  'quiz.html': [['60 道题', '110 道题'], ['60 questions', '110 questions']],
  'map.html': [['40 个密码史事件', '44 个密码史事件'], ['40 cipher-history events', '44 cipher-history events']],
  '404.html': [['105 款', '108 款']]
};
let total = 0;
for (const [f, pairs] of Object.entries(JOBS)) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [a, b] of pairs) { if (s.includes(a)) { const before = s.split(a).length - 1; s = s.split(a).join(b); n += before; } }
  if (n) { fs.writeFileSync(p, s, 'utf8'); console.log(f, '->', n, 'replacements'); total += n; }
}
console.log('total:', total);
/* 残留复查 */
for (const f of Object.keys(JOBS)) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const bad of ['105 款', '105 mini-games', '29 件历史密件', '60 道题', '60 questions', '40 个密码史事件']) {
    if (s.includes(bad)) console.error('RESIDUE:', f, bad);
  }
}
console.log('residue scan done');
