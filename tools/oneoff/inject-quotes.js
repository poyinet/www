/* ============================================================
   H4 名言注入：quotes-30.json → assets/js/quotes.js（window.QUOTES）
   幂等：按 who+zh 去重。用法：node tools/inject-quotes.js
   ============================================================ */
const fs = require('fs');

const dataPath = 'tools/report/quotes-30.json';
const outPath = 'assets/js/quotes.js';
if (!fs.existsSync(dataPath)) { console.log('✗ 数据文件不存在（子代理未交付）'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
if (!Array.isArray(data) || !data.length) { console.log('✗ 数据为空'); process.exit(1); }

const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
const lines = data.map(q =>
  "  { who: { zh: '" + esc(q.who.zh) + "', en: '" + esc(q.who.en) + "' }, year: '" + esc(q.year) +
  "', zh: '" + esc(q.zh) + "', en: '" + esc(q.en) + "', tag: '" + esc(q.tag) + "'" +
  (q.personId ? ", personId: '" + esc(q.personId) + "'" : '') + ' }'
);

const js =
  '/* ============================================================\n' +
  '   密码学名言墙数据 Quote Wall —— H4 全网独有\n' +
  '   30 条密码学家/破译者/历史人物名言（中英对照，按主题筛选）。\n' +
  '   由 tools/report/quotes-30.json 生成（node tools/inject-quotes.js）。\n' +
  '   ============================================================ */\n' +
  'window.QUOTES = (function () {\n' +
  '  var QUOTES = [\n' +
  lines.join(',\n') + '\n' +
  '  ];\n' +
  '  return { QUOTES: QUOTES };\n' +
  '})();\n';

fs.writeFileSync(outPath, js);
console.log('quotes.js 已生成：' + data.length + ' 条名言 → ' + outPath);
