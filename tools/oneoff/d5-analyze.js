/* D5 dict 二期下沉 · 分析器：
   1) 收集 i18n-dict.js 全部键
   2) 扫描全站引用（HTML data-i18n/T()/JS 字符串）
   3) 游戏页依赖链白名单（shell/rank/extras/plot/stories/pwa）中出现字面量的键 → 强制保留核心
   4) 其余按「仅根页面消费」判定为可移动 → 输出移动清单 JSON */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* 键全集 */
const dictSrc = read('assets/js/core/i18n-dict.js');
const keys = [...dictSrc.matchAll(/'( [a-z0-9_.]+)'|'([a-z0-9_.]+)':/g)].map(m => (m[1] || m[2]));
const keySet = new Set();
for (const m of dictSrc.matchAll(/d\.(?:zh|en)\['([^']+)'\]/g)) keySet.add(m[1]);
for (const m of dictSrc.matchAll(/'([a-z0-9_.]+)':\s*'/g)) keySet.add(m[1]);

/* 引用扫描语料：文件名 -> 文本 */
const corpus = {};
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) corpus[f] = read(f);
const jsTop = fs.readdirSync(path.join(ROOT, 'assets', 'js')).filter(f => f.endsWith('.js'));
for (const f of jsTop) corpus['assets/js/' + f] = read('assets/js/' + f);

/* 游戏页加载链（这些文件里出现的键必须留在 core） */
const GAME_DEPS = ['shell.js', 'rank.js', 'extras.js', 'plot.js', 'stories.js', 'pwa.js'];
const depText = GAME_DEPS.map(f => corpus['assets/js/' + f] || '').join('\n');

/* 根页面集合（可挂 i18n-ui.js 的页面） */
const rootPages = new Set(Object.keys(corpus).filter(f => f.endsWith('.html')));

const movable = [], keep = [];
for (const k of [...keySet].sort()) {
  const consumers = [];
  for (const [f, txt] of Object.entries(corpus)) {
    if (!rootPages.has(f) && !f.startsWith('assets/js/')) continue;
    if (txt.includes(k)) consumers.push(f);
  }
  /* 游戏页依赖链强制保留 */
  if (depText.includes(k)) { keep.push({ k, why: 'game-dep' }); continue; }
  if (consumers.length === 0) { keep.push({ k, why: 'dynamic-or-dead' }); continue; }
  /* 全部消费者都是根页面 HTML 或其专属 JS → 可移动 */
  const allRootish = consumers.every(c => rootPages.has(c) ||
    ['home.js', 'lobby.js', 'stats.js', 'save-manager.js'].includes(c));
  if (allRootish) movable.push({ k, files: consumers });
  else keep.push({ k, why: 'mixed:' + consumers.filter(c => !rootPages.has(c)).join(',') });
}

console.log('总键:', keySet.size, '| 可移动:', movable.length, '| 保留:', keep.length);
fs.writeFileSync(path.join(process.env.TEMP || '.', 'opencode', 'd5-movable.json'),
  JSON.stringify({ movable: movable.map(m => m.k), keepWhy: keep.slice(0, 40) }, null, 1));
console.log('清单已写入 %TEMP%/opencode/d5-movable.json');
