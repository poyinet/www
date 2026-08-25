/* 成熟度 94→97：P3 残留全清 */
const fs = require('fs');
let n = 0, fail = 0;
function rep(f, from, to, tag) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) { console.error('MISS: ' + tag + ' @ ' + f); fail++; return; }
  t = t.split(from).join(to);
  fs.writeFileSync(f, t);
  n++;
  console.log('OK ' + tag);
}

const S = 'assets/js/core/i18n-story.js';

/* c1 en 年份统一 58-50 */
rep(S, 'Between 58 and 51 BC', 'Between 58 and 50 BC', 'c1 en 58-50');

/* c4 冲锋措辞软化 */
rep(S, '挡住了对巴黎的最后一次冲锋', '挡住了直扑巴黎方向的攻势', 'c4 冲锋软化');

/* c7 东风统一 */
rep(S, '东风，有雨', '东风，雨', 'c7 东风统一 zh');
rep(S, 'East wind, rain', 'East wind, rain', 'c7 en (noop)');

/* c9 时间框定 */
rep(S, '冷战初年，苏联情报机构把它当作不可战胜的保险柜', '二战后期至冷战之初，苏联情报机构把它当作不可战胜的保险柜', 'c9 时间框定');

/* c9 剑桥五杰因果 */
rep(S, '在同一张网里，潜伏二十年的剑桥五杰——伯吉斯、麦克莱恩、菲尔比、布伦特、凯恩克罗斯等人——在英国外交部与情报机构内部暴露',
    '同一张网牵出的线索，最终让潜伏二十年的剑桥五杰——伯吉斯、麦克莱恩、菲尔比、布伦特、凯恩克罗斯——先后因不同节点陆续暴露', 'c9 五杰因果');

/* c10 en 语法三处 */
rep(S, 'as long as the message, and used once', 'as long as the message and used exactly once', 'c10 en 语法1');
rep(S, 'struggle has never stopped Now the horn', 'struggle has never stopped. Now the horn', 'c10 en 缺句号');
rep(S, 'begun a quiet migration of changing the locks', 'begun the quiet work of changing the locks', 'c10 en 直译');

/* c11 毕业生→研究生 */
rep(S, '哥伦比亚大学的毕业生', '哥伦比亚大学的研究生', 'c11 毕业生→研究生');

/* c11 补年份 */
rep(S, '北京与维也纳曾借此完成跨洲量子加密视频通话', '2017 年北京与维也纳曾借此完成跨洲量子加密视频通话', 'c11 补 2017');

/* c0 en Je tiens 补注 */
rep(S, "Je tiens l'affaire!", "Je tiens l'affaire!" + ' ("I\'ve got it!")', 'c0 en 原话注');

/* 术语 PoW 措辞 */
rep('glossary.html', '中本聪 2008 年引入', '中本聪 2008 年将其应用于货币共识', 'PoW 措辞');

/* 术语 VENONA 措辞 */
rep('glossary.html', '美英联合实施', '美国实施、英国早期协作', 'VENONA 措辞');

/* 商用 Enigma 年代 */
rep('assets/js/core/i18n-archive.js', '1923', '1924', '商用 Enigma 1923→1924');

/* PLAN 诗库数字 */
rep('PLAN.md', '8 中文+5 英文', '中英双语诗库', 'PLAN 诗库数字');

/* i18n-story 注释更新 */
rep(S, "每章『下章预告』钩子（st.cN.next，c10 无下章不渲染）", "每章『下章预告』钩子（st.cN.next）", '注释更新');

console.log('\ndone. replaced=' + n + ' failed=' + fail);
process.exit(fail ? 1 : 0);
