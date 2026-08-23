/* ============================================================
   E1 术语注入：glossary-30.json → glossary.html 的 window.GLOSSARY 数组
   幂等：按 term 去重（已有则跳过）。用法：node tools/inject-glossary-30.js
   ============================================================ */
const fs = require('fs');

const htmlPath = 'glossary.html';
const dataPath = 'tools/report/glossary-30.json';
let html = fs.readFileSync(htmlPath, 'utf8');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
if (!Array.isArray(items) || !items.length) { console.log('✗ 数据为空'); process.exit(1); }

/* 现有 term 集合（去重） */
const existing = new Set();
const re = /term: '([^']+)'/g;
let m;
while ((m = re.exec(html)) !== null) existing.add(m[1]);

let added = 0, skipped = 0;
const lines = [];
items.forEach(it => {
  if (existing.has(it.term)) { skipped++; return; }
  existing.add(it.term);
  const game = it.game ? "game: '" + it.game + "'" : '';
  const ch = it.chapters && it.chapters.length ? "chapters: [" + it.chapters.map(c => "'" + c + "'").join(',') + "]" : '';
  const extra = [game, ch].filter(Boolean).join(', ');
  lines.push("      { cat: '" + it.cat + "', term: '" + it.term + "', zh: '" + it.zh +
    "', zhDef: '" + it.zhDef.replace(/'/g, "\\'") + "', enDef: '" + it.enDef.replace(/'/g, "\\'") +
    "'" + (extra ? ', ' + extra : '') + ' },');
  added++;
});

/* 在 GLOSSARY 数组闭合 ] 前插入 */
if (lines.length) {
  const anchor = '\n    ];\n\n    var CATS';
  if (!html.includes(anchor)) { console.log('✗ 未找到注入锚点'); process.exit(1); }
  html = html.replace(anchor, '\n' + lines.join('\n') + '\n    ];\n\n    var CATS');
  fs.writeFileSync(htmlPath, html);
}
console.log('术语注入: 新增 ' + added + '，跳过已有 ' + skipped);
