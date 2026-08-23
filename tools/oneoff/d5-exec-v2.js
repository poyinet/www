/* D5 执行器 v2
   movable 键定义行迁出到 core/i18n-ui.js；语言判定：行含 CJK → zh 否则 en；
   根 HTML 于 i18n-dict.js 引用后追加 i18n-ui.js；幂等 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const movable = new Set(JSON.parse(fs.readFileSync(path.join(process.env.TEMP || '.', 'opencode', 'd5-movable.json'), 'utf8')).movable);

const DICT = path.join(ROOT, 'assets', 'js', 'core', 'i18n-dict.js');
const UI = path.join(ROOT, 'assets', 'js', 'core', 'i18n-ui.js');
const CJK = /[\u4e00-\u9fff]/;

let lines = fs.readFileSync(DICT, 'utf8').split('\n');
const movedZh = [], movedEn = [], kept = [];
for (const line of lines) {
  const ks = [...line.matchAll(/d\.(?:zh|en)\['([^']+)'\]|'([a-z0-9_.]+)':\s*'/g)]
    .map(m => m[1] || m[2]).filter(Boolean);
  if (!ks.length || !ks.every(k => movable.has(k))) { kept.push(line); continue; }
  /* 重写为 ui 文件的 d.xx 形式 */
  let out, lang;
  if (/d\.zh\[/.test(line)) lang = 'zh';
  else if (/d\.en\[/.test(line)) lang = 'en';
  else {
    lang = CJK.test(line) ? 'zh' : 'en';
    out = line.replace(/'([a-z0-9_.]+)':\s*/, "d." + lang + "['$1'] = ").replace(/,\s*$/, ';');
  }
  if (out) (lang === 'zh' ? movedZh : movedEn).push(out);
  else kept.push(line);
}

const head = "/* ============================================================\n   第四期 D5 · 页面级 UI 字典（自 i18n-dict.js 下沉）\n   仅根页面消费的长文案键；根页面在 i18n-dict.js 后加载本文件。\n   ============================================================ */\n(function () {\n  var d = Arcade.i18n.dicts;\n";
let body = '';
if (movedZh.length) { body += '\n  /* zh */\n'; body += movedZh.map(l => l.trim().replace(/,$/, ';')).map(l => '  ' + l).join('\n') + '\n'; }
if (movedEn.length) { body += '\n  /* en */\n'; body += movedEn.map(l => l.trim().replace(/,$/, ';')).map(l => '  ' + l).join('\n') + '\n'; }
fs.writeFileSync(UI, head + body + '})();\n', 'utf8');

/* 从 dict 移除已迁移行：kept 中剔除与 moved 行原文相同的行 */
const movedSet = new Set([...movedZh, ...movedEn].map(l => l.trim()));
const finalLines = [];
for (const line of lines) {
  const ks = [...line.matchAll(/d\.(?:zh|en)\['([^']+)'\]|'([a-z0-9_.]+)':\s*'/g)].map(m => m[1] || m[2]).filter(Boolean);
  if (ks.length && ks.every(k => movable.has(k)) && movedSet.has(line.trim())) continue;
  finalLines.push(line);
}
fs.writeFileSync(DICT, finalLines.join('\n'), 'utf8');

console.log('moved zh:', movedZh.length, '| en:', movedEn.length, '| dict lines now:', finalLines.length);
