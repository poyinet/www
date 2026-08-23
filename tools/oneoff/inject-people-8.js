/* ============================================================
   E2 人物注入：people-8.json → stories.js PEOPLE 数组 + i18n-dict.js stp.* 键
   幂等：按 id 去重。用法：node tools/inject-people-8.js
   ============================================================ */
const fs = require('fs');

const storiesPath = 'assets/js/stories.js';
const dictPath = 'assets/js/core/i18n-dict.js';
const data = JSON.parse(fs.readFileSync('tools/report/people-8.json', 'utf8'));

/* ---- 1. PEOPLE 数组追加 ---- */
let stories = fs.readFileSync(storiesPath, 'utf8');
const existing = new Set();
const re = /window\.PEOPLE = \[([\s\S]*?)\];/;
const m = re.exec(stories);
if (!m) { console.log('✗ PEOPLE 数组未找到'); process.exit(1); }
(m[1].match(/'([a-z0-9-]+)'/g) || []).forEach(id => existing.add(id.replace(/'/g, '')));

const newIds = data.filter(p => !existing.has(p.id)).map(p => p.id);
if (newIds.length) {
  const insert = '\n    ' + newIds.map(id => "'" + id + "'").join(', ') + '\n  ];';
  stories = stories.replace(re, (mm, body) => 'window.PEOPLE = [' + body + insert);
  fs.writeFileSync(storiesPath, stories);
}
console.log('PEOPLE 数组: 新增 ' + newIds.length + '（' + newIds.join(', ') + '）');

/* ---- 2. i18n-dict.js stp.* 键追加（在最后 })(); 前） ---- */
let dict = fs.readFileSync(dictPath, 'utf8');
let addedKeys = 0;
const lines = [];
data.forEach(p => {
  if (dict.includes("stp." + p.id + ".name")) return; // 已存在
  const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  lines.push("  d.zh['stp." + p.id + ".name'] = '" + esc(p.name.zh) + "';");
  lines.push("  d.en['stp." + p.id + ".name'] = '" + esc(p.name.en) + "';");
  lines.push("  d.zh['stp." + p.id + ".icon'] = '" + esc(p.icon) + "';");
  lines.push("  d.en['stp." + p.id + ".icon'] = '" + esc(p.icon) + "';");
  lines.push("  d.zh['stp." + p.id + ".role'] = '" + esc(p.role.zh) + "';");
  lines.push("  d.en['stp." + p.id + ".role'] = '" + esc(p.role.en) + "';");
  lines.push("  d.zh['stp." + p.id + ".era'] = '" + esc(p.era.zh) + "';");
  lines.push("  d.en['stp." + p.id + ".era'] = '" + esc(p.era.en) + "';");
  lines.push("  d.zh['stp." + p.id + ".bio'] = '" + esc(p.bio.zh) + "';");
  lines.push("  d.en['stp." + p.id + ".bio'] = '" + esc(p.bio.en) + "';");
  if (p.quote && p.quote.zh) {
    lines.push("  d.zh['stp." + p.id + ".quote'] = '" + esc(p.quote.zh) + "';");
    lines.push("  d.en['stp." + p.id + ".quote'] = '" + esc(p.quote.en) + "';");
  }
  lines.push("  d.zh['stp." + p.id + ".fact'] = '" + esc(p.fact.zh) + "';");
  lines.push("  d.en['stp." + p.id + ".fact'] = '" + esc(p.fact.en) + "';");
  addedKeys += 12;
});
if (lines.length) {
  dict = dict.replace(/\n\}\)\(\);\s*$/, '\n' + lines.join('\n') + '\n})();');
  fs.writeFileSync(dictPath, dict);
}
console.log('stp.* 键: 新增 ' + addedKeys + ' 条（' + data.length + ' 人 × zh/en）');

/* ---- 3. 章节 people 数组挂靠 ---- */
data.forEach(p => {
  if (!p.chapters || !p.chapters.length) return;
  p.chapters.forEach(chId => {
    const reCh = new RegExp("\\{ id: '" + chId + "'([^}]*?)people: \\[([^\\]]*)\\]");
    const mc = reCh.exec(stories);
    if (!mc) { console.log('⚠ 章节 ' + chId + ' 未找到 people 数组'); return; }
    const pid = p.id;
    const arr = mc[2];
    if (arr.indexOf(pid) >= 0) return;
    stories = stories.replace(reCh, (mm, rest, people) => {
      return "{ id: '" + chId + "'" + rest + "people: [" + people + (people.trim() ? ', ' : '') + "'" + pid + "']";
    });
    fs.writeFileSync(storiesPath, stories);
    console.log('章节 ' + chId + ' 挂靠 ' + pid);
  });
});
console.log('--- 人物注入完成 ---');
