/* 验证首页时间线渲染：节点数、链接、双语言 */
const fs = require('fs');
const vm = require('vm');

function makeEl() {
  return {
    textContent: '', innerHTML: '', style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, getAttribute: () => null, appendChild() {}, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [], children: [], firstChild: null
  };
}
const docs = {};
const sb = {
  window: {}, document: {
    documentElement: makeEl(), body: makeEl(),
    head: { appendChild() {}, querySelector: () => null },
    getElementById: (id) => { if (!docs[id]) docs[id] = makeEl(); return docs[id]; },
    createElement: () => makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [],
    addEventListener() {}, title: ''
  },
  navigator: { language: 'zh' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {}, search: '', pathname: '/index.html' },
  console, setTimeout
};
sb.window.Arcade = {}; sb.Arcade = sb.window.Arcade;
vm.createContext(sb);
['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/timeline.js'].forEach(f => {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f }); } catch (e) { console.log('load warn', f, e.message); }
});

let fail = 0;
for (const lang of ['zh', 'en']) {
  /* 重新加载 i18n（en 需在加载前设置 localStorage） */
  sb.localStorage.getItem = () => (lang === 'en' ? 'en' : null);
  try { vm.runInContext(fs.readFileSync('assets/js/core/i18n.js', 'utf8'), sb, { filename: 'i18n-reload.js' }); } catch (e) {}
  try { sb.window.buildCryptoTimeline('crypto-timeline'); } catch (e) { console.log('❌', lang, '渲染错误:', e.message); fail++; continue; }
  const tl = docs['crypto-timeline'] ? docs['crypto-timeline'].innerHTML : '';
  const nodes = (tl.match(/ct-node/g) || []).length;
  const links = (tl.match(/a class="ct-node/g) || []).length;
  const total = sb.window.CRYPTO_TIMELINE.length;
  console.log(lang + ': 节点 ' + nodes + '/' + total + ' | 可点击 ' + links);
  if (nodes !== total || links < 10) { fail++; console.log('   ✗ 数量不符'); }
  if (lang === 'zh' && !tl.includes('密码史全景时间线')) { fail++; console.log('   ✗ 标题缺'); }
  if (lang === 'en' && !tl.includes('Timeline of Cryptography')) { fail++; console.log('   ✗ 英文标题缺'); }
}
process.exit(fail ? 1 : 0);
