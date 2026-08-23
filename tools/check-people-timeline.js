/* 验证 people.html：时间轴为主体（无网格），13 人全在轴上，卡片含 role */
const fs = require('fs');
const vm = require('vm');

function makeEl() {
  return {
    textContent: '', innerHTML: '', style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, getAttribute: () => null, appendChild() {}, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
    children: [], firstChild: null
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
  location: { reload() {}, search: '', pathname: '/people.html' },
  console, setTimeout
};
sb.window.Arcade = {}; sb.Arcade = sb.window.Arcade;
vm.createContext(sb);

['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js', 'assets/js/games.js', 'assets/js/stories.js'].forEach(f => {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f }); } catch (e) { console.log('load warn', f, e.message); }
});

const html = fs.readFileSync('people.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
try {
  vm.runInContext(scripts[1], sb, { filename: 'people-inline.js' });
  const tl = docs['pp-timeline'] ? docs['pp-timeline'].innerHTML : '';
  const rows = (tl.match(/pp-tl-row/g) || []).length;
  const cards = (tl.match(/pp-tl-card/g) || []).length;
  const roles = (tl.match(/pp-tl-role/g) || []).length;
  const dots = (tl.match(/pp-tl-dot/g) || []).length;
  const names = [...tl.matchAll(/pp-tl-name">([^<]+)</g)].map(m => m[1]);
  console.log('时间轴行数:', rows, '| 卡片:', cards, '| role 行:', roles, '| 圆点:', dots);
  console.log('轴上人物:', names.join(' → '));
  // 网格应不存在
  const htmlHasGrid = /pp-grid|pp-card/.test(html);
  console.log('HTML 残留 pp-grid/pp-card:', htmlHasGrid);
  const tlHasGrid = /pp-card/.test(tl);
  console.log('时间轴含 pp-card:', tlHasGrid);
  if (rows >= 20 && cards === rows && roles === rows && dots === rows && !htmlHasGrid && !tlHasGrid) {
    console.log('✓ 人物志 = 纯纵向时间轴（' + rows + ' 人全在轴上、左右分列、含角色行、无网格）');
  } else { console.log('✗ 结构异常 (期望 ' + rows + ' 行)'); process.exit(1); }
} catch (e) {
  console.log('❌ people 脚本错误:', e.message);
  process.exit(1);
}
