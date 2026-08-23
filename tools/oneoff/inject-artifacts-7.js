/* ============================================================
   E3 密件文案注入：artifacts-7.json → i18n-dict.js sta.* 键
   幂等：按 id 去重。用法：node tools/inject-artifacts-7.js
   ============================================================ */
const fs = require('fs');

const dictPath = 'assets/js/core/i18n-dict.js';
const data = JSON.parse(fs.readFileSync('tools/report/artifacts-7.json', 'utf8'));

let dict = fs.readFileSync(dictPath, 'utf8');
const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const lines = [];
data.forEach(a => {
  if (dict.includes("sta." + a.id + ".name")) { console.log('跳过已有: ' + a.id); return; }
  lines.push("  d.zh['sta." + a.id + ".name'] = '" + esc(a.name.zh) + "';");
  lines.push("  d.en['sta." + a.id + ".name'] = '" + esc(a.name.en) + "';");
  lines.push("  d.zh['sta." + a.id + ".era'] = '" + esc(a.era.zh) + "';");
  lines.push("  d.en['sta." + a.id + ".era'] = '" + esc(a.era.en) + "';");
  lines.push("  d.zh['sta." + a.id + ".desc'] = '" + esc(a.desc.zh) + "';");
  lines.push("  d.en['sta." + a.id + ".desc'] = '" + esc(a.desc.en) + "';");
  lines.push("  d.zh['sta." + a.id + ".text'] = '" + esc(a.text.zh) + "';");
  lines.push("  d.en['sta." + a.id + ".text'] = '" + esc(a.text.en) + "';");
});

if (lines.length) {
  dict = dict.replace(/\n\}\)\(\);\s*$/, '\n' + lines.join('\n') + '\n})();');
  fs.writeFileSync(dictPath, dict);
}
console.log('sta.* 键: 新增 ' + lines.length + ' 条（' + data.length + ' 件 × zh/en × 4 字段）');
