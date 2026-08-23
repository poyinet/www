/* D3 键盘无障碍：给根页面主容器加 id="content"（skip link 目标，幂等）
   注意：必须保留标签名（<div 或 <main），不可用 replace('<', ...) 破坏标签 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MAP = [
  ['index.html', '<div class="home-wrap">', 'div'],
  ['games.html', '<div class="lobby-wrap">', 'div'],
  ['stories.html', '<div class="st-wrap">', 'div'],
  ['people.html', '<div class="pp-wrap">', 'div'],
  ['artifacts.html', '<div class="ar-wrap">', 'div'],
  ['glossary.html', '<div class="gl-wrap">', 'div'],
  ['workshop.html', '<div class="ws-wrap">', 'div'],
  ['quiz.html', '<div class="qz-wrap">', 'div'],
  ['duel.html', '<div class="dz-wrap">', 'div'],
  ['morse-listen.html', '<div class="ml-wrap">', 'div'],
  ['path.html', '<div class="pt-wrap">', 'div'],
  ['stats.html', '<main class="st-main">', 'main'],
  ['story.html', '<div class="sy-wrap">', 'div']
];
let changed = 0;
for (const [f, anchor, tag] of MAP) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('id="content"')) continue;
  if (!html.includes(anchor)) { console.log('✗ ' + f + ': 未找到锚点'); continue; }
  /* 保留标签名：<div class="x"> → <div id="content" class="x"> */
  html = html.replace(anchor, '<' + tag + ' id="content" class="' + anchor.match(/class="([^"]+)"/)[1] + '">');
  fs.writeFileSync(p, html);
  changed++;
  console.log('✓ ' + f);
}
console.log('--- 更新 ' + changed + ' 个页面');
