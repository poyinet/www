/* ============================================================
   一次性迁移工具：i18n-story.js 摘要键 → i18n-dict.js（S3 摘要字典下沉）
   迁移对象（全站页面都要用的「摘要」键）：
   - era0-10（时代名）
   - st.cN.t / st.cN.t.one（章节标题 / 一句话）
   - stp.*（人物 name/icon/role/era/bio/quote 全字段——extras.js 搜索与档案弹窗在
     首页/游戏厅/游戏页都会用）
   - sta.*（密件 name/era/desc/text 全字段——同上）
   保留在 i18n-story.js（仅内容页用）：
   - st.* 页面 UI 键
   - st.cN.b/.gN/.lc/.lh/.facts/.ch（章节正文/游戏提示/密信/冷知识/挑战）
   用法：node tools/migrate-summary.js  （幂等：检测到目标块已存在则跳过）
   产出：
   - assets/js/core/i18n-dict.js  末尾追加摘要字典 IIFE
   - assets/js/core/i18n-story.js 移除摘要键（只留正文）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DICT = path.join(ROOT, 'assets', 'js', 'core', 'i18n-dict.js');
const STORY = path.join(ROOT, 'assets', 'js', 'core', 'i18n-story.js');

/* ---------- 1. 读入并分块 ---------- */
const story = fs.readFileSync(STORY, 'utf8');
const lines = story.split('\n');

if (story.includes('/* ===== 摘要字典（全站共享，S3 下沉） ===== */')) {
  console.log('已迁移过，跳过（幂等）。');
  process.exit(0);
}

/* 段 A：era（行号 129-139，1-based）→ 索引 128-138 */
/* 段 B：章节元数据（141-151）→ 索引 140-150 */
/* 段 C：人物占位（153-169）→ 索引 152-168 */
/* 段 D：密件占位（171-187）→ 索引 170-186 */
const RANGES = [
  [128, 138], // era0-10
  [140, 150], // 章节元数据（zhTitles/enTitles/zhOne/enOne + for）
  [152, 168], // 人物占位（zhP/enP + for）
  [170, 186]  // 密件占位（zhA/enA/zhAE/enAE + for）
];
const inRange = new Set();
RANGES.forEach(([a, b]) => { for (let i = a; i <= b; i++) inRange.add(i); });

/* 逐行判断：stp.* / sta.* 真实内容赋值行 */
function isSummaryAssign(line) {
  const m = line.match(/d\.(zh|en)\[([^\]]+)\]/);
  if (!m) return false;
  const keyExpr = m[2].trim();
  if (/^'[^']*'$/.test(keyExpr)) {
    const k = keyExpr.slice(1, -1);
    return /^(stp\.|sta\.)/.test(k);
  }
  // 动态 key：'stp.'+ / 'sta.'+
  return /^'stp\.'/.test(keyExpr) || /^'sta\.'/.test(keyExpr);
}

const summaryLines = [];
const keepLines = [];
lines.forEach((line, i) => {
  if (inRange.has(i) || isSummaryAssign(line)) {
    summaryLines.push(line);
  } else {
    keepLines.push(line);
  }
});

/* ---------- 2. 拼装 dict 追加块 ---------- */
const summaryBody = summaryLines.map((l) => l.replace(/^ {2}/, '    ')).join('\n');
const block =
  '\n/* ============================================================\n' +
  '   摘要字典（全站共享，S3 下沉自 i18n-story.js）\n' +
  '   时代 / 章节标题与一句话 / 人物全字段 / 密件全字段\n' +
  '   首页、游戏厅、游戏页均加载本文件；正文（章节/传记长文）仍在 i18n-story.js\n' +
  '   ============================================================ */\n' +
  '(function () {\n' +
  '  var d = Arcade.i18n.dicts;\n' +
  summaryBody.replace(/^/gm, '  ') + '\n' +
  '})();\n';

/* ---------- 3. 写回 ---------- */
const dict = fs.readFileSync(DICT, 'utf8');
const dictOut = dict.replace(/\n*$/, '\n') + block;
fs.writeFileSync(DICT, dictOut);

/* 清理 story：压缩连续空行，修正文件头注释 */
let storyOut = keepLines.join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/^(\s*\n)+/, '');
storyOut = storyOut.replace(
  /\/\* ============================================================\n   编年史内容字典（i18n-story\.js）—— 从 i18n-dict\.js 拆分\n   仅 stories\.html \/ story\.html \/ people\.html \/ artifacts\.html 需要\n   依赖：core\/i18n\.js \+ core\/i18n-dict\.js（先加载）\n   ============================================================ \*\//,
  '/* ============================================================\n   编年史正文字典（i18n-story.js）—— S3 后仅含章节正文\n   仅 stories.html / story.html / people.html / artifacts.html 需要\n   依赖：core/i18n.js + core/i18n-dict.js（先加载；摘要键已下沉至 dict）\n   ============================================================ */'
);
fs.writeFileSync(STORY, storyOut.replace(/\n+$/, '\n'));

console.log('--- 摘要键迁移完成 ---');
console.log('dict 追加块行数：' + summaryLines.length);
console.log('story 剩余行数：' + storyOut.split('\n').length);
