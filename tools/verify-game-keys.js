/* 验证：games.js 105 个游戏 id 是否都有 g.<id>.t 与 g.<id>.d 键（zh/en） */
const fs = require('fs');
const vm = require('vm');
/* 加载 games.js */
const sb = { window: {} };
vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/js/games.js', 'utf8'), sb);
const GAMES = sb.window.GAMES;
/* 加载字典 */
const sb2 = { window: {}, Arcade: {} };
sb2.window = sb2;
sb2.Arcade.i18n = { dicts: { zh: {}, en: {} } };
vm.createContext(sb2);
vm.runInContext(fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8'), sb2);
const zh = sb2.Arcade.i18n.dicts.zh;
const en = sb2.Arcade.i18n.dicts.en;
let missing = [];
GAMES.forEach(g => {
  if (zh['g.' + g.id + '.t'] === undefined || en['g.' + g.id + '.t'] === undefined) missing.push(g.id + '.t');
  if (zh['g.' + g.id + '.d'] === undefined || en['g.' + g.id + '.d'] === undefined) missing.push(g.id + '.d');
});
console.log('游戏总数: ' + GAMES.length);
console.log(missing.length ? '✗ 缺 g.* 键: ' + missing.join(', ') : '✓ 105 款游戏 g.*.t/.d 键 zh/en 全部齐全');
process.exit(missing.length ? 1 : 0);
