/* ============================================================
   死键审计（defined-but-unused）：字典里定义了、但全站任何地方
   都没有静态引用的条目。
   动态拼接白名单（这些键族由代码按规则拼出，静态扫描天然扫不到，
   一律视为在用）：
     gs.*            游戏词典（shell 按 'gs.'+id+'.' 拼）
     stp.* / sta.*   人物/密件字段（回退循环与 toast 按字段拼）
     g.<id>.*        注册表驱动的游戏名/描述（lobby/shell 拼）
     st.cN.gN        章节-游戏文案（story.html 按序号拼）
     st.cN.letter/.lc 等 challenge 资源同理按前缀豁免
     cat.*           大分类名（lobby 按 GAME_CATEGORIES 拼）
     achv.* / rank.* 成就/军衔（stats/rank 按成就 id 拼）
     lobby.unit*     最高分单位（formatBest 按 BEST_UNITS 值拼）
     morseL.speed*   速度档（页面按档位名拼）
     quiz.lvlN       难度名（'quiz.lvl'+lvl）
   其余零引用键 = 死键候选，输出清单供人工裁决。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- 1. 定义集（按来源文件） ---------- */
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

/* ---------- 2. 引用集（静态字面量，同 check-i18n-usage 口径） ---------- */
const used = new Set();
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/^(\.|node_modules|oneoff|report|screenshots)$/.test(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(abs);
    else yield abs;
  }
}
for (const f of walk('.')) {
  const rel = path.relative('.', f).split(path.sep).join('/');
  if (!/\.(js|html)$/.test(rel)) continue;
  if (/^assets\/js\/core\/i18n/.test(rel)) continue;
  if (/i18n$|-i18n\.js$/i.test(rel.replace(/\.js$/, '')) && /[a-z0-9]-i18n\.js$/.test(rel)) continue;
  if (/^tools\//.test(rel)) continue;
  if (/^smoke\.js$/.test(rel)) continue;
  let src = fs.readFileSync(f, 'utf8');
  if (/\.html$/i.test(rel)) src = src.replace(/<script\b[^>]*src=/gi, '<script data-src=');
  const res = [
    /\bT\(\s*'([^'\n]+?)'\s*\)/g,
    /\bt\(\s*'([^'\n]+?)'\s*\)/g,
    /Arcade\.i18n\.t\(\s*'([^'\n]+?)'\s*\)/g,
    /data-i18n(?:-attr)?\s*=\s*"([^"\n]+?)"/g
  ];
  for (const re of res) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const k = m[1].split('|')[0];
      if (!k || /[+$]/.test(k)) continue;
      used.add(k);
    }
  }
}

/* ---------- 3. 动态白名单 ---------- */
function isDynamic(k) {
  return (
    k.startsWith('gs.') ||
    k.startsWith('stp.') || k.startsWith('sta.') ||
    /^g\.[a-z0-9-]+\.(t|d)$/.test(k) ||
    k.startsWith('st.c') || /* 章节族全部数据驱动（titleKey/bodyKey/facts…存于 STORIES 数据） */
    /^st\.prog/.test(k) || /* stories.html 进度条：数组存键名后转 T() */
    k.startsWith('theme.') || /* extras.js 设置面板按主题 id 拼 */
    k.startsWith('nav.') || /* nav.js 按 ITEMS key 拼 */
    k.startsWith('artifacts.nature.') || /* artifacts.html 按 nature 值拼 */
    /^era\d+$/.test(k) || /* 时代名：STORIES 数据 era 字段 */
    k.startsWith('cat.') ||
    k.startsWith('achv.') || k.startsWith('rank.') || k.startsWith('xp.') ||
    /^lobby\.unit/.test(k) ||
    /^lobby\.time(Short|Mid|Long)$/.test(k) || /* lobby.js TIME_LABELS 按 id 拼（E2E 教训） */
    /^lobby\.diff(Easy|Mid|Hard)$/.test(k) ||
    /^morseL\.speed/.test(k) ||
    /^quiz\.lvl\d$/.test(k) ||
    k.startsWith('gt.')
  );
}

/* ---------- 4. 汇报 ---------- */
const all = new Set([...Object.keys(sb.Arcade.i18n.dicts.zh), ...Object.keys(sb.Arcade.i18n.dicts.en)]);
const dead = [...all].filter(k => !used.has(k) && !isDynamic(k));
console.log('=== 死键审计 ===');
console.log('定义总数(zh∪en): ' + all.size + ' | 静态引用: ' + used.size + ' | 白名单族豁免后死键候选: ' + dead.length);
if (dead.length) {
  /* 按前缀聚类 */
  const groups = {};
  dead.forEach(k => {
    const pre = k.split('.').slice(0, 2).join('.');
    (groups[pre] = groups[pre] || []).push(k);
  });
  Object.entries(groups).sort((a, b) => b[1].length - a[1].length).forEach(([pre, ks]) => {
    console.log('\n[' + pre + '] × ' + ks.length);
    ks.slice(0, 12).forEach(k => console.log('  ' + k));
    if (ks.length > 12) console.log('  … 其余 ' + (ks.length - 12) + ' 条');
  });
  console.log('\n完整清单见 tools/report/dead-keys.json');
  fs.writeFileSync('tools/report/dead-keys.json', JSON.stringify(dead, null, 2));
}
/* P1-A2：已从报告型转为门禁 —— 白名单外死键必须为 0；
   新增动态键族时请同步扩充 isDynamic 白名单 */
process.exit(dead.length ? 1 : 0);
