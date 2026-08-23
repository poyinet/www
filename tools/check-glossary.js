/* 术语表验证 v2：用真实页面脚本执行验证（与 run-glossary-page.js 同路径），
   并校验 game 链接指向的游戏存在 */
const fs = require('fs');
const vm = require('vm');

function makeEl(tag) {
  return {
    tagName: tag || 'div', className: '', id: '',
    textContent: '', innerHTML: '', style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: (k) => null,
    appendChild() {}, removeChild() {}, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
    children: [], firstChild: null, parentNode: null
  };
}

const docs = {};
const sb = {
  window: {}, document: {
    documentElement: makeEl('html'), body: makeEl('body'),
    head: { appendChild() {}, querySelector: () => null },
    getElementById: (id) => { if (!docs[id]) docs[id] = makeEl('div'); return docs[id]; },
    createElement: (t) => makeEl(t), querySelector: () => makeEl('div'), querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, title: ''
  },
  navigator: { language: 'zh-CN' },
  localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {}, search: '', pathname: '/glossary.html' },
  console, setTimeout, clearTimeout, requestIdleCallback: null
};
sb.window.Arcade = {}; sb.Arcade = sb.window.Arcade;
vm.createContext(sb);

['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js', 'assets/js/games.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f });
});

const html = fs.readFileSync('glossary.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
try {
  vm.runInContext(scripts[scripts.length - 1], sb, { filename: 'glossary-inline.js' });
} catch (e) {
  console.log('❌ 术语表脚本执行失败:', e.message);
  process.exit(1);
}
const rendered = docs['gl-root'] ? docs['gl-root'].innerHTML : '';
const items = (rendered.match(/gl-item/g) || []).length;
const plays = (rendered.match(/gl-play/g) || []).length;
const cats = (rendered.match(/gl-cat-title/g) || []).length;
console.log('✓ 渲染成功：' + items + ' 术语 / ' + plays + ' 游戏链接 / ' + cats + ' 组');

/* game 链接指向的游戏必须存在 */
const ids = new Set(sb.window.GAMES.map(g => g.id));
let bad = 0;
(rendered.match(/href="games\/([a-z0-9-]+)\/index.html"/g) || []).forEach(h => {
  const id = h.match(/games\/([a-z0-9-]+)\//)[1];
  if (!ids.has(id)) { console.log('❌ 无效游戏引用:', id); bad++; }
});
if (items < 95 || plays < 20 || cats < 5 || bad) { console.log('✗ 术语表异常'); process.exit(1); }
console.log('✓ 术语表 ' + items + ' 词 + ' + plays + ' 游戏联动 + ' + cats + ' 组，全部有效');
