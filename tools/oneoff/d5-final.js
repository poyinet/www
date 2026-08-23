/* D5 最终版：从备份 dict 一次性生成 ui.js + 精简 dict
   解析策略：逐行找 movable 键定义；一行多键则整行迁入 ui（保持原样，仅包裹进对应语言上下文）；
   语言判定：行含 CJK → zh 行；否则 en 行。zh/en 各自成块，杜绝混排。 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const BACKUP = path.join(process.env.TEMP || '.', 'opencode', 'i18n-dict.backup.js');
const movable = new Set(JSON.parse(fs.readFileSync(path.join(process.env.TEMP || '.', 'opencode', 'd5-movable.json'), 'utf8')).movable);
const CJK = /[\u4e00-\u9fff]/;

const lines = fs.readFileSync(BACKUP, 'utf8').split('\n');
const zhLines = [], enLines = [], keptDict = [];
let movedKeys = new Set();

for (const line of lines) {
  const ks = [...line.matchAll(/d\.(?:zh|en)\['([^']+)'\]|'([a-z0-9_.]+)':\s*'/g)]
    .map(m => m[1] || m[2]).filter(Boolean);
  if (!ks.length || !ks.every(k => movable.has(k))) { keptDict.push(line); continue; }
  ks.forEach(k => movedKeys.add(k));
  if (/d\.zh\[/.test(line)) { zhLines.push(line.trim().replace(/,$/, ';')); continue; }
  if (/d\.en\[/.test(line)) { enLines.push(line.trim().replace(/,$/, ';')); continue; }
  /* 对象字面量风格：转为 d.xx['k']=v 形式（逐键） */
  const lang = CJK.test(line) ? 'zh' : 'en';
  const target = lang === 'zh' ? zhLines : enLines;
  let rest = line.trim().replace(/;$/, '');
  for (const p of rest.matchAll(/'([a-z0-9_.]+)':\s*('(?:[^'\\]|\\.)*)'(,)?\s*$/g)) {
    target.push("d." + lang + "['" + p[1] + "'] = " + p[2] + ";");
  }
}

/* ui 文件：zh 块与 en 块分立 */
let ui = "/* ============================================================\n   第四期 D5 · 页面级 UI 字典（自 i18n-dict.js 下沉）\n   ============================================================ */\n(function () {\n  var d = Arcade.i18n.dicts;\n";
if (zhLines.length) { ui += "\n  /* zh */\n"; for (const l of zhLines) { const t = l.replace(/^d\.zh\[/, 'd.zh['); ui += '  ' + t + '\n'; } }
if (enLines.length) { ui += "\n  /* en */\n"; for (const l of enLines) { const t = l.replace(/^d\.en\[/, 'd.en['); ui += '  ' + t + '\n'; } }
ui += '})();\n';
fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'core', 'i18n-ui.js'), ui, 'utf8');

/* dict：keptDict 即精简版 */
fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'core', 'i18n-dict.js'), keptDict.join('\n'), 'utf8');

console.log('moved keys:', movedKeys.size, '| zh lines:', zhLines.length, '| en lines:', enLines.length);
