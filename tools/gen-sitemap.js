/* ============================================================
   破译 DECODE ARCADE · sitemap.xml 自动生成器
   用法：node tools/gen-sitemap.js
   从 assets/js/games.js 注册表（vm 沙箱执行，零依赖）读取全部游戏，
   按现有格式生成 sitemap.xml（首页 1.0 / 主页面 0.9 / 单章 0.6 / 游戏 0.8）。
   新增游戏后重跑本脚本即可同步（对应 audit S13）。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://poyi.net';
const OUT = path.join(ROOT, 'sitemap.xml');

/* 读取注册表 */
const src = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'games.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const GAMES = sandbox.window.GAMES;
if (!Array.isArray(GAMES) || !GAMES.length) {
  console.error('✗ 注册表解析失败：window.GAMES 为空');
  process.exit(1);
}

/* 日期：取今天（与站点 © 2026 语境一致） */
const today = new Date().toISOString().slice(0, 10);

function url(entry) {
  return '  <url>\n' +
    '    <loc>' + entry.loc + '</loc>\n' +
    '    <lastmod>' + today + '</lastmod>\n' +
    '    <changefreq>weekly</changefreq>\n' +
    '    <priority>' + entry.priority + '</priority>\n' +
    '  </url>';
}

const pages = [
  { loc: BASE + '/', priority: '1.0' },
  { loc: BASE + '/games.html', priority: '0.9' },
  { loc: BASE + '/stories.html', priority: '0.9' },
  { loc: BASE + '/people.html', priority: '0.9' },
  { loc: BASE + '/artifacts.html', priority: '0.9' },
  { loc: BASE + '/glossary.html', priority: '0.8' },
  { loc: BASE + '/workshop.html', priority: '0.8' },
  { loc: BASE + '/quiz.html', priority: '0.8' },
  { loc: BASE + '/duel.html', priority: '0.7' },
  { loc: BASE + '/morse-listen.html', priority: '0.7' },
  { loc: BASE + '/map.html', priority: '0.7' },
  { loc: BASE + '/machine.html', priority: '0.7' },
  { loc: BASE + '/protocols.html', priority: '0.7' },
  { loc: BASE + '/quotes.html', priority: '0.6' },
  { loc: BASE + '/path.html', priority: '0.8' },
  { loc: BASE + '/stats.html', priority: '0.9' },
  { loc: BASE + '/story.html', priority: '0.6' }
];
const games = GAMES.map(function (g) {
  return { loc: BASE + '/games/' + g.id + '/', priority: '0.8' };
});

const all = pages.concat(games);
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>\n' +
  '<!-- 由注册表自动生成，共 ' + all.length + ' 个页面（node tools/gen-sitemap.js） -->\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  all.map(url).join('\n') + '\n' +
  '</urlset>\n';

fs.writeFileSync(OUT, xml);
console.log('✓ sitemap.xml 已生成（' + all.length + ' 个 URL）');
