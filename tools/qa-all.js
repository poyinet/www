/* ============================================================
   一键全站质检（B1）：顺序跑全部门禁，汇总结果表
   用法：node tools/qa-all.js   （或 npm run qa）
   任一门禁失败 → 汇总后以非零退出
   ============================================================ */
const { spawnSync } = require('child_process');
const fs = require('fs');

/* 游戏数动态计数，杜绝「×105」类陈旧标签残留 */
const N_GAMES = (fs.readFileSync('assets/js/games.js', 'utf8').match(/\bid:\s*'/g) || []).length;

const GATES = [
  ['audit',     'node', ['audit.js'],                    `13 项硬标准 × ${N_GAMES} 款`],
  ['smoke',     'node', ['smoke.js'],                    '游戏冒烟（默认）'],
  ['smoke:zh',  'node', ['smoke.js', 'zh'],              '游戏冒烟（中文）'],
  ['smoke:en',  'node', ['smoke.js', 'en'],              '游戏冒烟（英文）'],
  ['smoke:page','node', ['smoke.js', 'page'],            '页面冒烟 ×18'],
  ['deep',      'node', ['tools/audit-deep.js'],         '静态深度扫描'],
  ['preflight', 'node', ['tools/preflight.js'],          '部署前资源完整性'],
  ['ghpages',   'node', ['tools/check-ghpages.js'],      'GitHub Pages 兼容'],
  ['swassets',  'node', ['tools/check-sw-assets.js'],    'SW 预缓存核对'],
  ['chapter',   'node', ['tools/check-chapter-copy.js'], '章节-游戏文案'],
  ['homekeys',  'node', ['tools/check-home-keys.js'],    '摘要键完整性'],
  ['gamekeys',  'node', ['tools/verify-game-keys.js'],   `g.* 入口键 ×${N_GAMES}`],
  ['gamei18n',  'node', ['tools/check-game-i18n.js'],    `gs.* 双语对称 ×${N_GAMES}`],
  ['i18nusage', 'node', ['tools/check-i18n-usage.js'],   'i18n 键引用审计'],
  ['dictdead',  'node', ['tools/check-dict-dead.js'],    '字典死键审计'],
  ['glossary',  'node', ['tools/check-glossary.js'],     '术语表渲染'],
  ['knowledge', 'node', ['tools/check-knowledge.js'],    '人物/密件/术语字段'],
  ['workshop',  'node', ['tools/verify-workshop.js'],    '工坊 16 算法往返'],
  ['eggs',      'node', ['tools/verify-eggs.js'],        '彩蛋 20 密文'],
  ['quiz',      'node', ['tools/verify-quiz.js'],        '测验题库结构'],
  ['linkdensity','node',['tools/check-link-density.js'], '互链密度与死链'],
  ['css',       'node', ['tools/check-css.js'],          'CSS 结构健康']
];

console.log('=== 破译 DECODE ARCADE · 全站质检 ===\n');
const results = [];
let failed = 0;
for (const [name, cmd, args, desc] of GATES) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  const ms = Date.now() - t0;
  const ok = r.status === 0;
  if (!ok) failed++;
  results.push({ name, desc, ok, ms });
  /* 实时输出：门禁名 + 结果 + 耗时；失败时打印尾部输出定位 */
  console.log((ok ? '✓' : '✗') + ' ' + name.padEnd(11) + ' ' + (ms + 'ms').padStart(7) + '  ' + desc);
  if (!ok) {
    const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n');
    out.slice(-8).forEach(l => console.log('    | ' + l));
  }
}

console.log('\n--- 汇总 ---');
for (const r of results) console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.name);
const totalS = (results.reduce((n, r) => n + r.ms, 0) / 1000).toFixed(1);
console.log(failed === 0
  ? '\n🎉 全部 ' + GATES.length + ' 项门禁通过（' + totalS + 's）'
  : '\n有 ' + failed + ' 项门禁未通过（' + totalS + 's）');
process.exit(failed ? 1 : 0);
