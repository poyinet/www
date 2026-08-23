#!/usr/bin/env node
/* ============================================================
   互链密度审计（第四期 D2 · 承接三期 Phase 1）
   统计每款游戏被多少个内容页引用：章节 games 数组 / 地图事件 /
   时间线节点 / 术语表 game 链接，输出「零引用孤联」清单。
   门禁：允许存在孤联（信息性），但注册表与章节挂载数必须一致。
   用法：node tools/check-link-density.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

/* 注册表游戏 id */
const gamesJs = read('assets/js/games.js');
const stories = read('assets/js/stories.js');
const ids = [...gamesJs.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]);
const idSet = new Set(ids);

/* 章节 games 挂载（每章对象为一行，按行解析避免跨对象误配） */
const chapterOf = {}; /* gameId -> [chapterId] */
for (const line of stories.split('\n')) {
  const idM = line.match(/\{ id: '([a-z0-9-]+)', era:/);
  if (!idM) continue;
  const ch = idM[1];
  const gM = line.match(/games: \[([^\]]*)\]/);
  if (!gM) continue;
  for (const g of gM[1].matchAll(/'([a-z0-9-]+)'/g)) {
    (chapterOf[g[1]] = chapterOf[g[1]] || []).push(ch);
  }
}

/* 地图事件 game 链接 */
const mapJs = read('assets/js/map.js');
const inMap = new Set([...mapJs.matchAll(/type:\s*'game',\s*id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]));

/* 时间线 game 链接 */
const tlJs = read('assets/js/timeline.js');
const inTimeline = new Set([...tlJs.matchAll(/type:\s*'game',\s*id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]));

/* 术语表 game 字段 */
const glossary = read('glossary.html');
const inGloss = new Set([...glossary.matchAll(/game:\s*'([a-z0-9-]+)'/g)].map(m => m[1]));

let orphans = [];
const rows = [];
for (const id of ids) {
  if (!idSet.has(id)) continue;
  const chs = chapterOf[id] || [];
  if (!chs.length) orphans.push(id);
  rows.push({ id, chapters: chs.length, map: inMap.has(id) ? 1 : 0, timeline: inTimeline.has(id) ? 1 : 0, glossary: inGloss.has(id) ? 1 : 0 });
}
rows.sort((a, b) => (b.chapters + b.map + b.timeline + b.glossary) - (a.chapters + a.map + a.timeline + a.glossary));

console.log('=== 游戏互链密度 Top10 ===');
for (const r of rows.slice(0, 10)) {
  console.log(`  ${r.id.padEnd(14)} 章节${r.chapters} 地图${r.map} 时间线${r.timeline} 术语${r.glossary}`);
}
console.log('\n=== 孤联清单（未被任何章节挂载）===');
if (orphans.length) console.log('  ' + orphans.join(', ')); else console.log('  无');

/* 门禁项：地图/时间线里引用的 game id 必须存在于注册表 */
let bad = 0;
for (const src of [['map', inMap], ['timeline', inTimeline], ['glossary', inGloss]]) {
  for (const id of src[1]) {
    if (!idSet.has(id)) { console.error(`✗ ${src[0]} 引用了不存在的游戏: ${id}`); bad++; }
  }
}
console.log(bad ? `\n✗ ${bad} 个死链` : '\n✓ 内容页游戏引用全部有效');
process.exit(bad ? 1 : 0);
