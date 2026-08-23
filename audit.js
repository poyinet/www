/* ============================================================
   破译 / DECODE ARCADE · 一键质量审计脚本
   用法：node audit.js [gameId]
   不带参数 = 审计全站；带 gameId = 只审计单款（新游戏提交前必跑）
   13 项硬标准：
     S1 页面模板：data-game-id / data-game-title / data-best-mode
     S2 教程：GAME_TUTORIAL_STEPS 已定义
     S3 记分：has-best=true 时含 submitScore
     S4 重开：window.GAME_RESTART 已注册
     S5 调味：Arcade.juice 调用
     S6 响应式：index.html 含 92vw / min( / 100% 等响应式处理
     S7 注册表：assets/js/games.js 中 id 与目录一致
     S8 语法：node --check 通过
     S9 无障碍：页面不得含 user-scalable=no（禁用缩放的 WCAG 违规）
     S10 SEO：页面必须含 <meta name="description">
     S11 移动端：页面必须含 <meta name="theme-color">
     S12 分类合法：games.js 中该游戏 category 属于 GAME_CATEGORIES
     S13 sitemap：sitemap.xml 与注册表同步（新增游戏后需重新生成）
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const NODE = process.execPath;
const ONLY = process.argv[2] || null;

function checkSyntax(file) {
  try { execSync(`"${NODE}" --check "${file}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
}

function auditGame(id) {
  const htmlPath = path.join('games', id, 'index.html');
  const jsPath = path.join('games', id, id + '.js');
  const issues = [];
  if (!fs.existsSync(htmlPath) || !fs.existsSync(jsPath)) return { id, issues: ['目录/文件缺失'] };

  const html = fs.readFileSync(htmlPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  if (!/data-game-id="[^"]+"/.test(html)) issues.push('S1 缺 data-game-id');
  if (!/data-game-title="[^"]+"/.test(html)) issues.push('S1 缺 data-game-title');
  if (!/data-best-mode="(max|min)"/.test(html)) issues.push('S1 缺/错 data-best-mode');
  if (!js.includes('GAME_TUTORIAL_STEPS')) issues.push('S2 缺教程步骤');
  const hasBest = !/data-has-best="false"/.test(html);
  if (hasBest && !js.includes('submitScore')) issues.push('S3 has-best=true 但缺记分');
  if (!js.includes('GAME_RESTART')) issues.push('S4 缺 GAME_RESTART');
  if (!js.includes('Arcade.juice')) issues.push('S5 缺调味');
  if (!/(92vw|width:\s*min\(|width:\s*100%|max-width:\s*100%|flex-wrap|@media)/.test(html)) issues.push('S6 缺响应式');
  if (/user-scalable=no/.test(html)) issues.push('S9 含 user-scalable=no（无障碍违规）');
  if (!/<meta name="description"/.test(html)) issues.push('S10 缺 meta description');
  if (!/<meta name="theme-color"/.test(html)) issues.push('S11 缺 theme-color');
  if (GAMES_SRC) {
    // S12: 该游戏 category 必须是 GAME_CATEGORIES 之一
    const catMatch = new RegExp("id:\\s*'" + id + "'[\\s\\S]*?category:\\s*'([^']+)'").exec(GAMES_SRC);
    const validCats = GAME_CATS;
    if (!catMatch) issues.push('S12 注册表缺 category');
    else if (validCats.indexOf(catMatch[1]) < 0) issues.push('S12 分类非法: ' + catMatch[1]);
  }
  if (!checkSyntax(jsPath)) issues.push('S8 语法错误');
  return { id, issues };}

const src = fs.readFileSync('assets/js/games.js', 'utf8');
const GAMES_SRC = src;
const GAME_CATS = ['经典街机', '动作反应', '逻辑谜题', '空间解谜', '球类竞技', '棋类对弈', '牌骰策略', '密码破译'];
const ids = [];
const re = /id:\s*'([^']+)'/g;
let m;
while ((m = re.exec(src))) ids.push(m[1]);
const dirs = fs.readdirSync('games').filter(d => fs.statSync(path.join('games', d)).isDirectory());

const targets = ONLY ? [ONLY] : ids;
const registryIssues = [];
if (!ONLY) {
  const missing = dirs.filter(d => !ids.includes(d));
  const extra = ids.filter(i => !dirs.includes(i));
  if (missing.length) registryIssues.push('S7 目录未注册: ' + missing.join(','));
  if (extra.length) registryIssues.push('S7 注册无目录: ' + extra.join(','));
}

let fail = 0;
if (registryIssues.length) { fail = registryIssues.length; console.log('⚠ ' + registryIssues.join('\n  ')); }
for (const id of targets) {
  const r = auditGame(id);
  if (r.issues.length) { fail += 1; console.log('✗ ' + id + ': ' + r.issues.join(' / ')); }
  else console.log('✓ ' + id + ' 全部通过');
}
// S13 站点级：sitemap.xml 与注册表同步（不随单款审计运行）
if (!ONLY) {
  try {
    const sm = fs.readFileSync('sitemap.xml', 'utf8');
    // sitemap 使用绝对 URL：https://poyi.net/games/<id>/（canonical 对齐）
    const missingLoc = ids.filter(i => !sm.includes('/games/' + i + '/'));
    if (missingLoc.length) {
      fail += 1;
      console.log('⚠ S13 sitemap 缺页面: ' + missingLoc.join(',') + '（重新生成 sitemap.xml）');
    }
  } catch (e) {
    fail += 1;
    console.log('⚠ S13 sitemap.xml 缺失');
  }
}
console.log('---');
console.log(fail === 0 ? '🎉 审计通过（' + targets.length + ' 款全绿）' : '有 ' + fail + ' 个问题待修');
process.exit(fail === 0 ? 0 : 1);
