/* 修复：add-content-anchor.js 的 replace('<', '< id="content" ') 把 <div 破坏成 < id="content" div
   → 统一修正为 <div id="content" class="xxx-wrap"> / <main id="content" class="st-main"> */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const pages = ['index.html', 'games.html', 'stories.html', 'people.html', 'artifacts.html',
  'glossary.html', 'workshop.html', 'quiz.html', 'duel.html', 'morse-listen.html',
  'path.html', 'stats.html', 'story.html'];

let fixed = 0;
for (const f of pages) {
  const p = path.join(ROOT, f);
  let html = fs.readFileSync(p, 'utf8');
  const orig = html;
  /* 损坏模式1：< id="content" div class="xxx">  →  <div id="content" class="xxx">
     损坏模式2：< id="content" main class="st-main"> → <main id="content" class="st-main"> */
  html = html.replace(/< id="content" div class="([^"]+)"/g, '<div id="content" class="$1"');
  html = html.replace(/< id="content" main class="([^"]+)"/g, '<main id="content" class="$1"');
  if (html !== orig) {
    fs.writeFileSync(p, html);
    fixed++;
    const m = html.match(/<(div|main) id="content" class="([^"]+)"/);
    console.log('✓ ' + f + ' -> <' + (m ? m[1] + ' id="content" class="' + m[2] + '">' : '?') + '');
  } else {
    console.log('· ' + f + ' 无需修复');
  }
}
console.log('--- 修复 ' + fixed + ' 个页面');
