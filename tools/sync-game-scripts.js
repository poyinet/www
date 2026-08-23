/* ============================================================
   游戏页依赖链静态化（P3/E2E 修复）
   背景：shell.js 运行时 appendChild 注入的外链脚本默认 async，
   不阻塞解析器 —— 真实浏览器弱网/冷缓存下 snake.js 可能先于
   i18n 链执行，产生「T is not defined」随机崩溃。
   方案：把依赖链写成每个游戏页的静态 <script> 标签（解析器
   按序阻塞执行，时序绝对正确）；shell.js 检测到静态链后自动
   跳过运行时注入（保留兜底）。
   用法：node tools/sync-game-scripts.js   （幂等，可重复跑）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const CORE = [
  '../../assets/js/core/i18n.js',
  '../../assets/js/core/i18n-dict.js'
];

function chainTags(id) {
  const tags = [];
  CORE.forEach(function (src) { tags.push('  <script src="' + src + '"></script>'); });
  const gidI18n = path.join('games', id, id + '-i18n.js');
  if (fs.existsSync(gidI18n)) tags.push('  <script src="' + id + '-i18n.js"></script>');
  ['../../assets/js/core/extras.js', '../../assets/js/rank.js', '../../assets/js/plot.js', '../../assets/js/stories.js']
    .forEach(function (src) { tags.push('  <script src="' + src + '"></script>'); });
  return tags.join('\n');
}

let patched = 0, skipped = 0, missing = 0;
const dirs = fs.readdirSync(path.join(ROOT(), 'games')).filter(function (d) {
  return fs.statSync(path.join(ROOT(), 'games', d)).isDirectory();
});

dirs.forEach(function (id) {
  const f = path.join(ROOT(), 'games', id, 'index.html');
  if (!fs.existsSync(f)) { console.log('✗ 缺 index.html: ' + id); missing++; return; }
  let html = fs.readFileSync(f, 'utf8');
  /* 幂等：已含核心链则跳过 */
  if (html.indexOf('assets/js/core/i18n.js') >= 0 && html.indexOf('data-chain') >= 0) { skipped++; return; }
  const shellRe = /(<script src="\.\.\/\.\.\/assets\/js\/shell\.js"><\/script>)/;
  if (!shellRe.test(html)) { console.log('✗ 未找到 shell.js 标签: ' + id); missing++; return; }
  html = html.replace(shellRe, chainTags(id) + '\n$1');
  patched++;
  fs.writeFileSync(f, html);
});
console.log('✓ 静态化 ' + patched + ' 页 | 已处理跳过 ' + skipped + ' | 异常 ' + missing);

function ROOT() { return process.cwd(); }
