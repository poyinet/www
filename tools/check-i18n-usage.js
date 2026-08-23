/* ============================================================
   i18n 键使用审计（查漏补缺）：静态扫描全部 T()/t() 字面量键与
   data-i18n 属性，比对三份字典（core/archive/story）+ 全部游戏
   gs.* 字典加载后的合并键集，报告「被引用但任何语言都未定义」的键。
   动态拼接键（含 + 或变量）自动跳过。信息性报告 + 缺键即非零退出。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- 1. 合并字典 ---------- */
const sb = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sb.window.Arcade = sb.Arcade = sb.window.Arcade || {};
vm.createContext(sb);
function load(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f }); }
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js');
load('assets/js/core/i18n-ui.js');
load('assets/js/core/i18n-archive.js');
load('assets/js/core/i18n-story.js');
const gameDir = 'games';
for (const d of fs.readdirSync(gameDir)) {
  const f = path.join(gameDir, d, d + '-i18n.js');
  if (fs.existsSync(f)) { try { load(f); } catch (e) {} }
}
const zh = sb.Arcade.i18n.dicts.zh, en = sb.Arcade.i18n.dicts.en;
const known = new Set([...Object.keys(zh), ...Object.keys(en)]);

/* ---------- 2. 收集引用 ---------- */
function* walk(dir, skipRe) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (skipRe && skipRe.test(e.name)) continue;
    if (e.isDirectory()) yield* walk(abs, skipRe);
    else yield abs;
  }
}
const usages = new Map(); // key -> [file:line]
function addUse(key, where) {
  if (!key || /[+$]/.test(key)) return; // 动态拼接
  if (!usages.has(key)) usages.set(key, []);
  usages.get(key).push(where);
}
const reT1 = /\bT\(\s*'([^'\n]+?)'\s*\)/g;
const reT2 = /\bt\(\s*'([^'\n]+?)'\s*\)/g;
const reI18nT = /Arcade\.i18n\.t\(\s*'([^'\n]+?)'\s*\)/g;
const reDataAttr = /data-i18n(?:-attr)?\s*=\s*"([^"\n]+?)"/g;

for (const f of walk('.', /^(\.|node_modules|oneoff|report|screenshots)$/)) {
  const rel = path.relative('.', f).split(path.sep).join('/');
  if (!/\.(js|html)$/.test(rel)) continue;
  if (/^assets\/js\/core\/i18n/.test(rel)) continue;          // 字典本体
  if (/^assets\/js\/[a-z0-9-]+-i18n\.js$/.test(rel)) continue; // 游戏词典本体（键定义处）
  if (/^-i18n\.js$/.test(path.basename(rel))) continue;
  if (/\/[a-z0-9-]+-i18n\.js$/.test(rel)) continue;
  if (/^tools\//.test(rel)) continue;                          // 工具脚本不产出用户可见文案
  if (/^smoke\.js$/.test(rel)) continue;                       // 冒烟夹含故意缺键的测试夹具
  let src = fs.readFileSync(f, 'utf8');
  const isHtml = /\.html$/i.test(rel);
  if (isHtml) src = src.replace(/<script\b[^>]*src=/gi, '<script data-src='); // 外链脚本标签的属性不算内联键
  const where = (i) => rel + ':' + (src.slice(0, i).split('\n').length);
  for (const re of [reT1, reT2, reI18nT]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) addUse(m[1], where(m.index));
  }
  reDataAttr.lastIndex = 0;
  let m3;
  while ((m3 = reDataAttr.exec(src))) {
    const k = m3[1].split('|')[0];
    addUse(k, where(m3.index));
  }
}

/* ---------- 3. 比对 ---------- */
const missing = [...usages.entries()].filter(([k]) => !known.has(k));
console.log('=== i18n 键使用审计 ===');
console.log('字典键总数(zh∪en): ' + known.size + ' | 静态引用键: ' + usages.size + ' | 未定义: ' + missing.length);
if (missing.length) {
  missing.sort();
  for (const [k, wh] of missing.slice(0, 60)) {
    console.log('✗ ' + k + '\n    ← ' + wh.slice(0, 2).join('\n    ← '));
  }
  if (missing.length > 60) console.log('… 其余 ' + (missing.length - 60) + ' 条略');
}
process.exit(missing.length ? 1 : 0);
