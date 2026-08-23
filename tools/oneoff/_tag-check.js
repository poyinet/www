/* 检查 lobby.js 的 TIME_LABELS/DIFF_LABELS 与 games.js 注册表 lvl/time 字段是否矛盾 */
const fs = require('fs');
const gamesSrc = fs.readFileSync('assets/js/games.js', 'utf8');
const lobbySrc = fs.readFileSync('assets/js/lobby.js', 'utf8');

// parse games registry
const reg = [];
const re = /\{\s*id:\s*'([^']+)'[\s\S]*?(?=\n  \},|\n  \];)/g;
let m;
while ((m = re.exec(gamesSrc)) !== null) {
  const block = m[0];
  const id = m[1];
  const lvl = (block.match(/lvl:\s*'([^']+)'/) || [])[1];
  const time = (block.match(/time:\s*'([^']+)'/) || [])[1];
  const bestMode = (block.match(/bestMode:\s*'([^']+)'/) || [])[1];
  reg.push({ id, lvl, time, bestMode });
}
console.log('parsed games:', reg.length);

// parse lobby TIME_LABELS
function parseMap(name) {
  const mm = lobbySrc.match(new RegExp('var ' + name + ' = \\{([\\s\\S]*?)\\n  \\};'));
  if (!mm) return {};
  const out = {};
  const re2 = /([A-Za-z0-9_'-]+):\s*"([^"]+)"/g;
  let m2;
  while ((m2 = re2.exec(mm[1])) !== null) out[m2[1].replace(/'/g, '')] = m2[2];
  return out;
}
const TL = parseMap('TIME_LABELS');
const DL = parseMap('DIFF_LABELS');
console.log('TIME_LABELS entries:', Object.keys(TL).length, 'DIFF_LABELS entries:', Object.keys(DL).length);

// time label mapping: '1min'->Short? Actually lobby TIME labels are Short/Mid/Long; registry time is 1min/5min/10min
const timeNorm = { Short: '1min', Mid: '5min', Long: '10min' };
const diffNorm = { Easy: 'easy', Mid: 'mid', Hard: 'hard' };

let issues = [];
for (const g of reg) {
  const tl = TL[g.id];
  const dl = DL[g.id];
  if (g.time && tl && timeNorm[tl] && timeNorm[tl] !== g.time) {
    issues.push(`${g.id}: TIME_LABELS=${tl}(${timeNorm[tl]}) vs registry time=${g.time}`);
  }
  if (g.lvl && dl && diffNorm[dl] && diffNorm[dl] !== g.lvl) {
    issues.push(`${g.id}: DIFF_LABELS=${dl}(${diffNorm[dl]}) vs registry lvl=${g.lvl}`);
  }
  // missing in maps
  if (g.time && !tl) issues.push(`${g.id}: 注册表有 time=${g.time} 但 TIME_LABELS 未收录（卡片无时长徽章）`);
  if (g.lvl && !dl) issues.push(`${g.id}: 注册表有 lvl=${g.lvl} 但 DIFF_LABELS 未收录（卡片无难度徽章）`);
}
console.log('issues:', issues.length);
issues.forEach(i => console.log(' -', i));
