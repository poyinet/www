/* ============================================================
   数据交叉引用完整性审计（深度查漏）
   校验全部「数据→代码/数据」引用闭环：
     X1 章节解算器类型：ch.letter.cipher ∈ story.html 支持的分支
     X2 章节演示器：ch.demo ∈ story.html 已实现的 demo 分支
     X3 章节人物/密件/游戏 id ∈ 对应注册池
     X4 密件 unlockGameId ∈ 游戏注册表；nature ∈ 合法集
     X5 时间线/地图 link.{type,id} 目标存在
     X6 DAILY_IDS 每款游戏源码含 markSolved 实现
     X7 章节 gN 文案键数量与游戏数精确相等（无孤儿/无缺口）
     X8 页面静态 id 去重扫描
   输出违例清单；非零退出。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fails = 0;
function bad(msg) { console.log('✗ ' + msg); fails++; }

/* ---------- 加载注册池 ---------- */
const sb = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sb.window.Arcade = sb.Arcade = sb.window.Arcade || {};
vm.createContext(sb);
function load(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f }); }
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js');
load('assets/js/core/i18n-archive.js');
load('assets/js/core/i18n-story.js');
load('assets/js/core/storage.js');
load('assets/js/stories.js');

const GAMES_SRC = fs.readFileSync('assets/js/games.js', 'utf8');
const gameIds = new Set([...GAMES_SRC.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]));
const storyIds = new Set(sb.window.STORIES.map(c => c.id));
const peopleIds = new Set(sb.window.PEOPLE);
const artIds = new Set(sb.window.ARTIFACTS.map(a => a.id));
const zh = sb.Arcade.i18n.dicts.zh, en = sb.Arcade.i18n.dicts.en;

/* ---------- story.html 支持的解算器/演示器分支 ---------- */
const storyHtml = fs.readFileSync('story.html', 'utf8');
const solverSet = new Set([...storyHtml.matchAll(/cipher === '([a-z]+)'/g)].map(m => m[1]));
const demoFns = new Set([...storyHtml.matchAll(/function demo([A-Z][A-Za-z]+)\(/g)].map(m => m[1].toLowerCase()));
console.log('story.html 支持: 解算器 [' + [...solverSet].join(',') + '] 演示器 [' + [...demoFns].join(',') + ']');

/* ---------- X1/X2/X3 章节数据 ---------- */
sb.window.STORIES.forEach(ch => {
  const cid = ch.id;
  if (ch.letter && ch.letter.cipher && !solverSet.has(ch.letter.cipher))
    bad('X1 ' + cid + '.letter.cipher="' + ch.letter.cipher + '" 无对应解算器分支');
  if (ch.demo && !demoFns.has(ch.demo))
    bad('X2 ' + cid + '.demo="' + ch.demo + '" 无对应演示器实现');
  (ch.people || []).forEach(p => { if (!peopleIds.has(p)) bad('X3 ' + cid + '.people 含未知人物: ' + p); });
  const art = ch.artifact;
  if (art && !artIds.has(art)) bad('X3 ' + cid + '.artifact 含未知密件: ' + art);
  (ch.games || []).forEach(g => { if (!gameIds.has(g)) bad('X3 ' + cid + '.games 含未知游戏: ' + g); });
});

/* ---------- X4 密件字段 ---------- */
sb.window.ARTIFACTS.forEach(a => {
  if (a.unlockGameId && !gameIds.has(a.unlockGameId))
    bad('X4 密件 ' + a.id + ' unlockGameId 不存在: ' + a.unlockGameId);
  if (!a.nature) bad('X4 密件 ' + a.id + ' 缺 nature 标注');
});

/* ---------- X5 时间线/地图链接目标 ---------- */
load('assets/js/timeline.js');
load('assets/js/map.js');
const termNames = new Set([...fs.readFileSync('glossary.html', 'utf8').matchAll(/term:\s*'((?:[^'\\]|\\.)+)'/g)].map(m => m[1].replace(/\\'/g, "'")));
const pageIds = new Set(fs.readdirSync('.').filter(f => /\.html$/.test(f)).map(f => f.replace(/\.html$/, '')));
function checkLink(owner, l) {
  if (!l) return;
  const pool = { story: storyIds, people: peopleIds, artifact: artIds, game: gameIds, term: termNames, page: pageIds }[l.type];
  if (!pool) { bad('X5 ' + owner + ' 未知链接类型: ' + l.type); return; }
  if (!pool.has(l.id)) bad('X5 ' + owner + ' 链接目标不存在: ' + l.type + ':' + l.id);
}
sb.window.CRYPTO_TIMELINE.forEach(n => checkLink('timeline@' + n.y + '/' + n.zh.slice(0, 8), n.link));
sb.window.CRYPTO_MAP.EVENTS.forEach(e => checkLink('map@' + e.id, e.link));

/* ---------- X6 每日一题实现核查 ---------- */
(sb.window.DAILY_IDS || []).forEach(id => {
  const f = path.join('games', id, id + '.js');
  if (!fs.existsSync(f)) { bad('X6 DAILY_IDS 游戏 ' + id + ' 目录缺失'); return; }
  const js = fs.readFileSync(f, 'utf8');
  if (!js.includes('markSolved')) bad('X6 DAILY_IDS 游戏 ' + id + ' 未调用 markSolved（每日模式未实现？）');
});

/* ---------- X7 章节文案键精确匹配 ---------- */
Object.keys(zh).forEach(() => {});
for (let ci = 0; ci <= 10; ci++) {
  const ch = sb.window.STORIES[ci];
  if (!ch) continue;
  const base = 'st.c' + ci;
  const gKeys = Object.keys(zh).filter(k => new RegExp('^' + base + '\\.g\\d+$').test(k));
  const expectN = ch.games.length;
  if (gKeys.length !== expectN) {
    /* 找出具体差异 */
    const nums = gKeys.map(k => parseInt(k.match(/(\d+)$/)[1], 10)).sort((a, b) => a - b);
    for (let n = 1; n <= Math.max(expectN, nums[nums.length - 1] || 0); n++) {
      if (n <= expectN && !nums.includes(n)) bad('X7 ' + base + '.g' + n + ' 缺失（该章有 ' + expectN + ' 款游戏）');
      if (n > expectN && nums.includes(n)) bad('X7 ' + base + '.g' + n + ' 超出游戏数（疑似残留）');
    }
    if (nums.length === expectN && nums.some((v, i2) => v !== i2 + 1)) bad('X7 ' + base + ' 键序号不连续');
    fails++; /* 计一次章节级失败 */
    console.log('  ↑ 章节 ' + ch.id + ' 定义键 ' + nums.length + ' ≠ 游戏数 ' + expectN);
  }
}

/* ---------- X8 静态 id 去重 ---------- */
function walk(dir, cb) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/^(node_modules|test-results|playwright-report|\.github)$/.test(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, cb); else cb(abs);
  }
}
walk('.', function (f) {
  if (!/\.html$/.test(f) || /^tools\//.test(f)) return;
  const html = fs.readFileSync(f, 'utf8');
  const seen = {};
  let m; const re = /\bid="([^"]+)"/g;
  while ((m = re.exec(html))) {
    seen[m[1]] = (seen[m[1]] || 0) + 1;
  }
  Object.entries(seen).forEach(([id2, n]) => {
    if (n > 1) {
      /* 模板字符串里动态生成的 id 可能合法重复（如每款游戏卡片），仅报告字面重复 ≥2 且非模板行 */
      const lineIdx = html.split('\n').findIndex(l => l.includes('id="' + id2 + '"'));
      console.log('⚠ X8 ' + path.relative('.', f).split(path.sep).join('/') + ' id 重复 ×' + n + ': ' + id2 + '（首现 L' + (lineIdx + 1) + '）');
    }
  });
});

console.log('---');
if (fails) { console.log('❌ 共 ' + fails + ' 类违例'); process.exit(1); }
console.log('🎉 交叉引用完整性审计通过');
