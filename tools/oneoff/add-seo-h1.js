/* ============================================================
   D1 游戏页 SEO：为所有游戏页注入隐藏 h1（语义标题，利于爬虫理解）
   幂等：已含 <h1 class="seo-h1"> 则跳过。
   用法：node tools/add-seo-h1.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SR_CLASS = 'seo-h1';
const CSS_SNIPPET =
  '<style>.seo-h1{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}</style>';

let changed = 0, ok = 0, skipped = 0;
const dirs = fs.readdirSync(path.join(ROOT, 'games'));
for (const id of dirs) {
  const p = path.join(ROOT, 'games', id, 'index.html');
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('class="seo-h1"')) { ok++; continue; }
  /* 取 data-game-title（中文标题） */
  const m = html.match(/data-game-title="([^"]*)"/);
  const title = m ? m[1] : id;
  /* 在 <main id="game-root"> 前插入隐藏 h1 */
  if (!/<main id="game-root"/.test(html)) { skipped++; continue; }
  html = html.replace(
    /(<main id="game-root">)/,
    '<h1 class="' + SR_CLASS + '">' + title + '</h1>\n  $1'
  );
  /* CSS 注入 theme.css link 之后 */
  if (!html.includes('.seo-h1{')) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*theme\.css">)/,
      '$1\n  ' + CSS_SNIPPET
    );
  }
  fs.writeFileSync(p, html);
  changed++;
  console.log('✓ ' + id);
}
console.log('---\n注入 h1：' + changed + '，已有：' + ok + '，跳过（无 game-root）：' + skipped);
