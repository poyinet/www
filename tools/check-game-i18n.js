/* 校验：全部游戏的 gs.* 文案 zh/en 对称（B4 扩展：4 款 → 105 款全覆盖）
   - 键集合对称：zh 与 en 的 gs.<id>.* 键一一对应
   - 占位符对称：每条文案的 {x} 占位符两侧一致
   - 无 <id>-i18n.js 的游戏（如 tank 早期版本）单独计数跳过 */
const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sandbox.window.Arcade = sandbox.Arcade = sandbox.window.Arcade || {};
vm.createContext(sandbox);
function load(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f }); }
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js'); /* 初始化 dicts（浏览器中由 shell 注入链保证先后） */

const src = fs.readFileSync('assets/js/games.js', 'utf8');
const ids = [];
let m; const re = /id:\s*'([^']+)'/g;
while ((m = re.exec(src))) ids.push(m[1]);

function placeholders(s) {
  const out = new Set();
  const r = /\{[a-zA-Z]+\}/g; let mm;
  while ((mm = r.exec(s))) out.add(mm[0]);
  return out;
}

let okCount = 0, skipCount = 0, fail = 0, loadErr = 0;
for (const id of ids) {
  const f = 'games/' + id + '/' + id + '-i18n.js';
  if (!fs.existsSync(f)) { console.log('· ' + id + ' 无 -i18n.js（跳过）'); skipCount++; continue; }
  try { load(f); } catch (e) {
    /* 某些游戏 i18n 文件依赖额外全局（如注册表），静态正则兜底校验键集合 */
    loadErr++;
    const c = fs.readFileSync(f, 'utf8');
    const zk2 = new Set(), ek2 = new Set(); let mm;
    const rz = new RegExp("d\\.zh\\['(gs\\." + id + "\\.[^']+)'\\]", 'g');
    const re2 = new RegExp("d\\.en\\['(gs\\." + id + "\\.[^']+)'\\]", 'g');
    while ((mm = rz.exec(c))) zk2.add(mm[1]);
    while ((mm = re2.exec(c))) ek2.add(mm[1]);
    const onlyZ = [...zk2].filter(k => !ek2.has(k)), onlyE = [...ek2].filter(k => !zk2.has(k));
    if (onlyZ.length || onlyE.length) {
      fail++;
      if (onlyZ.length) console.log('✗ ' + id + ' 缺 en: ' + onlyZ.join(','));
      if (onlyE.length) console.log('✗ ' + id + ' 缺 zh: ' + onlyE.join(','));
    } else { console.log('✓ ' + id + ' (' + zk2.size + ' 键 zh/en 对称·静态校验)'); okCount++; }
    continue;
  }
  const pre = 'gs.' + id + '.';
  const zh = sandbox.Arcade.i18n.dicts.zh, en = sandbox.Arcade.i18n.dicts.en;
  const zk = Object.keys(zh).filter(k => k.startsWith(pre));
  const ek = Object.keys(en).filter(k => k.startsWith(pre));
  const missEn = zk.filter(k => en[k] === undefined);
  const missZh = ek.filter(k => zh[k] === undefined);
  /* 占位符一致性 */
  let phBad = 0;
  for (const k of zk) {
    if (en[k] === undefined) continue;
    const pz = placeholders(zh[k]), pe = placeholders(en[k]);
    const diff = [...pz].filter(x => !pe.has(x)).concat([...pe].filter(x => !pz.has(x)));
    if (diff.length) { console.log('✗ ' + id + ' 占位符不一致 ' + k + ': ' + diff.join(',')); phBad++; }
  }
  if (missZh.length || missEn.length || phBad) {
    fail++;
    if (missEn.length) console.log('✗ ' + id + ' 缺 en: ' + missEn.join(','));
    if (missZh.length) console.log('✗ ' + id + ' 缺 zh: ' + missZh.join(','));
  } else {
    console.log('✓ ' + id + ' (' + zk.length + ' 键 zh/en 对称)');
    okCount++;
  }
}
console.log('---');
console.log('游戏总数 ' + ids.length + ' | 动态校验 ' + okCount + ' | 静态兜底见上 | 无字典跳过 ' + skipCount + ' | 加载异常 ' + loadErr + ' | 问题 ' + fail);
process.exit(fail ? 1 : 0);
