/* D5 收尾：全部根 HTML 在 i18n-dict.js 引用后追加 i18n-ui.js（幂等） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
let tagged = 0;
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('core/i18n-dict.js')) continue;
  if (s.includes('core/i18n-ui.js')) continue;
  s = s.replace(/(<script src="[^"]*core\/i18n-dict\.js"><\/script>)/,
    '$1\n  <script src="assets/js/core/i18n-ui.js"></script>');
  fs.writeFileSync(p, s, 'utf8');
  tagged++;
}
console.log('ui.js tagged into', tagged, 'pages');
