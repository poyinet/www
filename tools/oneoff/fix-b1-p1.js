/* B1：P1 史实硬伤 ×12 */
const fs = require('fs');
let n = 0, fail = 0;
function rep(f, from, to, tag) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) { console.error('✗ 未命中: ' + tag + ' @ ' + f); fail++; return; }
  t = t.split(from).join(to);
  fs.writeFileSync(f, t);
  n++;
  console.log('✓ ' + tag);
}

const STORY = 'assets/js/core/i18n-story.js';

/* 1. c0 沉默时长（zh tldr / zh 正文 / en 正文） */
rep(STORY, '五千年的古埃及文明', '尘封千年的古埃及文明', 'P1-1a c0 tldr');
rep(STORY, '古埃及文明三千年的沉默，就此被彻底打破', '古埃及文字一千四百年的沉默，就此被彻底打破', 'P1-1b c0 正文 zh');
rep(STORY, 'Three thousand years of Egyptian silence had been broken', 'Fourteen centuries of Egyptian silence had been broken', 'P1-1c c0 正文 en');

/* 2. c1 西塞罗 → 普朗库斯密码信（正文 + facts） */
rep(STORY, '据说西塞罗曾在信中调侃过这套把戏，但调侃归调侃，它确确实实给军令上了一道保险。',
    '罗马史料里倒真有一封密码信：西塞罗曾给部将普朗库斯写过加了密的信件，普朗库斯按约定读了出来——加密确确实实给书信上了一道保险。', 'P1-2a c1 正文西塞罗');
rep(STORY, '西塞罗在《书信集》中更早地提及换位密码，与斯巴达「密码棒」同源——可见移位与换位之争，两千年前就开始了。',
    '西塞罗给普朗库斯的密码信见于书信集——可见保密通信在罗马军政界已是实务。', 'P1-2b c1 facts 西塞罗');

/* 3. c2 字验机制 */
rep(STORY, '四十首诗编成「字验」，钥字逐日更换即整套码本更换',
    '把四十条军情对应一首四十字、字不重复的诗，逐字定位即得密写，另备多首同类诗逐日换钥——这套「字验」', 'P1-3 c2 字验');

/* 4. c5 Bombe 32→36 */
rep(STORY, '同时模拟三十二组 Enigma 转子', '同时模拟三十六组三转子 Enigma 等效组合', 'P1-4a c5 Bombe zh');
rep(STORY, 'thirty-two Enigma rotor stacks at once', 'thirty-six three-rotor Enigma equivalents at once', 'P1-4b c5 Bombe en');

/* 5. c10 CWI */
rep(STORY, '阿姆斯特丹自由大学动用约六千五百个 CPU 年', '荷兰 CWI 研究中心动用约六千五百个 CPU 年', 'P1-5 c10 CWI');

/* 6. 图灵奖 2002（archive 两处） */
rep('assets/js/core/i18n-archive.js', '2017 年与两位合作者一起荣获图灵奖', '2002 年与两位合作者一起荣获图灵奖', 'P1-6 图灵奖 2002（全部出现）');

/* 7. 地图 m17 中途岛坐标 */
rep('assets/js/map.js', 'x: -179.5, y: 51.5, zh: \'中途岛 · AF 陷阱\'', 'x: -177.35, y: 28.2, zh: \'中途岛 · AF 陷阱\'', 'P1-7 m17 中途岛');

/* 8. 地图 m3 斯巴达坐标 */
rep('assets/js/map.js', 'x: 37.0, y: 37.0, zh: \'斯巴达密码棒\'', 'x: 22.43, y: 37.07, zh: \'斯巴达密码棒\'', 'P1-8 m3 斯巴达');

/* 9. 时间线罗塞塔 出土→刻立 */
rep('assets/js/timeline.js', "zh: '罗塞塔石碑出土'", "zh: '罗塞塔石碑刻立'", 'P1-9 罗塞塔刻立');

/* 10. 时间线 Cryptomenytices 1641→1624 */
rep('assets/js/timeline.js', '{ y: 1641, zh: \'Cryptomenytices Patefacta\'', '{ y: 1624, zh: \'Cryptomenytices Patefacta\'', 'P1-10 1624');

/* 11. Kryptos 1990（时间线 + 地图） */
rep('assets/js/timeline.js', "{ y: 1988, zh: 'Kryptos 雕塑揭幕'", "{ y: 1990, zh: 'Kryptos 雕塑揭幕'", 'P1-11a 时间线 Kryptos');
rep('assets/js/map.js', "year: 1988, link: { type: 'arti", "year: 1990, link: { type: 'arti", 'P1-11b 地图 Kryptos');

/* 12. 时间线 1404 条目 → 1379 Lavinde 手册 */
rep('assets/js/timeline.js', "{ y: 1404, zh: '《密码之书》', en: 'Gabrieli\\'s De Cifris', icon: '📕', link: { type: 'story', id: 'bacon' } },",
    "{ y: 1379, zh: '拉温德密码手册', en: 'Gabriele de Lavinde\\'s cipher manual', icon: '📕', link: { type: 'story', id: 'bacon' } },", 'P1-12 Lavinde 1379');

console.log('\ndone. replaced=' + n + ' failed=' + fail);
process.exit(fail ? 1 : 0);
