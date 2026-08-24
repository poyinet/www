/* i18n 孤儿键扫描：dict/ui 中定义、全仓零引用、且不属于动态前缀家族 */
const fs = require('fs');
const path = require('path');

const sb = { window: {}, Arcade: { i18n: { dicts: { zh: {}, en: {} } } }, localStorage: { getItem: () => null, setItem: () => {} } };
sb.window = sb; sb.Arcade = sb.Arcade; sb.Arcade.i18n.dicts = sb.Arcade.i18n.dicts;
const vm = require('vm');
vm.createContext(sb);
['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-ui.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f });
});
const zh = sb.Arcade.i18n.dicts.zh, en = sb.Arcade.i18n.dicts.en;

let HAY = '';
function walk(d) {
  fs.readdirSync(d).forEach(f => {
    if (f === 'node_modules' || f === 'test-results' || f === '.git' || f === 'tools') return;
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(html|js)$/.test(f)) {
      if (p.indexOf('i18n-dict.js') >= 0 || p.indexOf('i18n-ui.js') >= 0 || p.indexOf('i18n.js') >= 0) return;
      HAY += fs.readFileSync(p, 'utf8');
    }
  });
}
walk('.');

/* 动态前缀家族：代码里存在 '前缀'+xxx 拼接，静态查不到属正常 */
const DYN = ['theme.', 'nav.', 'lobby.unit', 'quiz.lvl', 'g.', 'gs.', 'st.', 'stp.', 'achv.', 'era.', 'settings.', 'app.'];

const orphans = [];
Object.keys(zh).forEach(k => {
  if (!Object.prototype.hasOwnProperty.call(en, k)) return; /* 不对称另有门禁 */
  if (DYN.some(p => k.indexOf(p) === 0)) return;
  if (HAY.indexOf(k) < 0) orphans.push(k);
});

console.log('dict/ui 总键(zh):', Object.keys(zh).length, ' 孤儿候选:', orphans.length);
orphans.forEach(k => console.log('  ' + k + ' = ' + String(zh[k]).slice(0, 50)));
