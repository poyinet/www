#!/usr/bin/env node
/* ============================================================
   第四期 B4+B6 一次性注入（v2）：
   - c1/c2 章节正文尾部追加「同时期的东方」桥段（zh/en）
   - c0/c1 既有 facts2 文案尾部追加东方冷知识句
   幂等：正文含「同一时代的东方 / In those same centuries」即跳过。
   用法：node tools/oneoff/add-oriental-bridges.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'assets', 'js', 'core', 'i18n-story.js');
let s = fs.readFileSync(FILE, 'utf8');

if (s.includes('同一时代的东方')) { console.log('already injected, skip'); process.exit(0); }

/* 正文桥段 */
const BRIDGES = {
  'st.c1.b': {
    zh: '\\n\\n同一时代的东方，另一种答案已在成形：周人以「阴符」两半相合验证军情，《六韬》所记「阴书」更把一封密信拆作三份、分道而驰——单份被截，密不自泄。罗马在替换字母时，东方在分割与符验里，走向了保密的另一条岔路。',
    en: '\\n\\nIn those same centuries the East was shaping a different answer: Zhou commanders matched tally halves ("yinfu") to authenticate orders, and the Liu Tao records "yinshu" letters cut into three parts carried along separate routes — any single capture revealed nothing. While Rome substituted letters, China split and verified: another fork on the road of secrecy.'
  },
  'st.c2.b': {
    zh: '\\n\\n频率分析照亮巴格达的两百年后，东方的军中密语也在生长：北宋《武经总要》以四十首诗编成「字验」，钥字逐日更换即整套码本更换；明将戚继光后来更从本土音韵学中造出「反切码」。统计破译与换表加密的竞赛，从来不只发生在一种文字里。',
    en: '\\n\\nTwo centuries after frequency analysis lit up Baghdad, military secrecy was quietly maturing in the East as well: the Song-dynasty Wujing Zongyao wove forty tactical reports into "ziyan" poems whose key characters changed daily, and Ming general Qi Jiguang would later forge his fanqie code from native phonology. The contest of statistics and substitution has never belonged to one script alone.'
  }
};
let touched = 0;
for (const [base, pair] of Object.entries(BRIDGES)) {
  for (const lang of ['zh', 'en']) {
    const re = new RegExp("(d\\." + lang + "\\['" + base + "'\\] = '[\\s\\S]*?)';");
    if (!re.test(s)) { console.error('MISS bridge', base, lang); process.exit(1); }
    s = s.replace(re, "$1" + pair[lang] + "';");
    touched++;
  }
}

/* facts2 追加句 */
const FACT_APPEND = {
  "d.zh['st.c0.facts2'": '另据一则东方注脚：甲骨文单字约四千五百个，学界公认释读者至今仅三分之一上下——人类最古老的文字之一，仍是一桩进行中的解码公案。',
  "d.en['st.c0.facts2'": " An Eastern footnote: oracle-bone script offers about 4,500 distinct characters, yet only a third are securely read — one of humanity\\'s oldest scripts remains an open decoding case.",
  "d.zh['st.c1.facts2'": '同期东方的注脚更为彻底：《六韬》「阴符」不着一字，八种符节长短即八类军情——最稳的密码可以完全看不见字母。',
  "d.en['st.c1.facts2'": " The contemporary East went further still: the Liu Tao\\'s Yinfu tallies wrote no letters at all — eight lengths for eight reports. The surest cipher may show no alphabet."
};
for (const [anchor, add] of Object.entries(FACT_APPEND)) {
  const idx = s.indexOf(anchor);
  if (idx < 0) { console.error('MISS fact', anchor); process.exit(1); }
  /* 找该行结尾 '; 的位置 */
  const close = s.indexOf("';", idx);
  s = s.slice(0, close) + add + s.slice(close);
  touched++;
}

fs.writeFileSync(FILE, s, 'utf8');
console.log('done:', touched, 'insertions');
