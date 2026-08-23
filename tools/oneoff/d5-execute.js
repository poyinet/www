/* D5 执行器：
   1) 把 movable 键的定义行从 i18n-dict.js 迁出到 core/i18n-ui.js
   2) 仅当「该行的全部键都可移动」时整行迁移（混合行保守保留）
   3) 给全部根 HTML 的 i18n-dict.js 之后插入 i18n-ui.js 引用
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const movable = new Set(JSON.parse(fs.readFileSync(path.join(process.env.TEMP || '.', 'opencode', 'd5-movable.json'), 'utf8')).movable);

const DICT = path.join(ROOT, 'assets', 'js', 'core', 'i18n-dict.js');
const UI = path.join(ROOT, 'assets', 'js', 'core', 'i18n-ui.js');

let lines = fs.readFileSync(DICT, 'utf8').split('\n');
const movedLines = [];
const kept = [];
for (const line of lines) {
  /* 提取本行定义的全部键 */
  const ks = [...line.matchAll(/d\.(?:zh|en)\['([^']+)'\]|'([a-z0-9_.]+)':\s*'/g)]
    .map(m => m[1] || m[2]).filter(Boolean);
  if (ks.length && ks.every(k => movable.has(k))) { movedLines.push(line); }
  else kept.push(line);
}
fs.writeFileSync(DICT, kept.join('\n'), 'utf8');

const header = `/* ============================================================
   第四期 D5 · 页面级 UI 字典（自 i18n-dict.js 下沉）
   仅被少数根页面消费的长文案键；由各根页面在 i18n-dict.js 后加载。
   109 个游戏页不再下载本文件 —— 首屏字典体积优化。
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
`;
let ui = header;
for (const l of movedLines) {
  const t = l.trim();
  if (/^d\.(zh|en)\[/.test(t)) ui += '  ' + t + '\n';
  else if (/^'/.test(t)) ui += '  d.' + (/* 区块语言判定占位 */ '') + t; /* 不应出现：movable 行均为 d.xx 风格 */
}
ui += '})();\n';
fs.writeFileSync(UI, ui, 'utf8');
console.log('moved lines:', movedLines.length, '| ui size:', ui.length);

/* 根 HTML 注入引用（幂等） */
let tagged = 0;
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('core/i18n-dict.js') || s.includes('core/i18n-ui.js')) continue;
  s = s.replace(/(<script src=")([^"]*assets\/js\/core\/i18n-dict\.js)("><\/script>)/,
    '$1$2$3\n  <script src="$2'.replace('$2', '$2') + 'i18n-ui.js"></script>');
  fs.writeFileSync(p, s, 'utf8');
  tagged++;
}
console.log('tagged pages:', tagged);
