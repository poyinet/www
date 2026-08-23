/* 验证 machine.js：5 台机器数据完整 + 游戏链接真实存在 */
const fs = require('fs');
const vm = require('vm');
const sb = { window: {} };
vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/js/machine.js', 'utf8'), sb);
const M = sb.window.MACHINE_MUSEUM.MACHINES;
console.log('机器数: ' + M.length);
let fail = 0;
M.forEach(m => {
  const checks = {
    id: !!m.id, icon: !!m.icon, name: !!(m.name && m.name.zh && m.name.en),
    era: !!(m.era && m.era.zh && m.era.en),
    summary: !!(m.summary && m.summary.zh && m.summary.en),
    history: !!(m.history && m.history.zh && m.history.en),
    params: Array.isArray(m.params) && m.params.length >= 3,
    game: !!m.game
  };
  const bad = Object.keys(checks).filter(k => !checks[k]);
  if (bad.length) { fail++; console.log('✗ ' + m.id + ' 缺: ' + bad.join(',')); }
  /* 游戏目录存在 */
  if (m.game && !fs.existsSync('games/' + m.game + '/index.html')) {
    fail++; console.log('✗ ' + m.id + ' 游戏目录不存在: games/' + m.game);
  }
  console.log('✓ ' + m.id + ' (' + m.name.zh + ') -> ' + m.game);
});
/* 游戏 id 互不重复 */
const ids = M.map(m => m.id);
console.log(ids.length === new Set(ids).size ? '✓ id 无重复' : '✗ id 重复');
console.log(fail ? '✗ ' + fail + ' 项异常' : '✓ machine.js 数据完整');
process.exit(fail ? 1 : 0);
