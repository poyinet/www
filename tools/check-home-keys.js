/* ============================================================
   首页/游戏厅/游戏页摘要键校验（S3 安全网）
   首页（home.js / lobby.js / extras.js）与游戏页（shell.js）不再加载
   i18n-story.js，其使用的全部键必须已下沉到 i18n-dict.js。
   用法：node tools/check-home-keys.js
   ============================================================ */
const fs = require('fs');
const vm = require('vm');

// 最小浏览器环境（与 check-summary-runtime.js 相同）
const sandbox = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sandbox.window.Arcade = sandbox.window.Arcade || {};
sandbox.Arcade = sandbox.window.Arcade;
vm.createContext(sandbox);

function load(file) { vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); }
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js'); // 不加载 i18n-story.js —— 模拟首页/游戏页

const zh = sandbox.Arcade.i18n.dicts.zh;
const en = sandbox.Arcade.i18n.dicts.en;

/* 首页 home.js 与游戏厅 lobby.js / extras.js 引用的全部键（grep 盘点结果） */
const required = [];
for (let i = 0; i < 11; i++) {
  required.push('era' + i, 'st.c' + i + '.t', 'st.c' + i + '.t.one');
}
['champollion','caesar','kindi','bacon','vigenere','payne','turing','welchman','friedman','flowers','shannon','rosenberg','rochefort'].forEach(p => {
  /* C2 后 bio/quote 移入 i18n-archive.js（懒加载），首页/游戏页同步链不再要求 */
  required.push('stp.' + p + '.name', 'stp.' + p + '.icon', 'stp.' + p + '.role', 'stp.' + p + '.era');
});
['rosetta','caesar-report','kindi','bacon-book','zimmermann','ultra','af','eastwind','colossus','venona','shannon'].forEach(a => {
  required.push('sta.' + a + '.name', 'sta.' + a + '.desc');
});

let fail = 0;
const missingZh = required.filter(k => zh[k] === undefined);
const missingEn = required.filter(k => en[k] === undefined);
if (missingZh.length) { console.log('❌ 缺 zh 键:', missingZh); fail++; }
if (missingEn.length) { console.log('❌ 缺 en 键:', missingEn); fail++; }

// 游戏页史话 tooltip：shell.js 用 Arcade.i18n.t(c.titleKey)（st.cN.t）→ en 必须为英文
const enTitle0 = en['st.c0.t'];
if (!enTitle0 || /[\u4e00-\u9fff]/.test(enTitle0)) { console.log('❌ 史话 tooltip 标题仍为中文/缺失:', enTitle0); fail++; }

if (!fail) {
  console.log('✓ 首页/游戏厅/游戏页所需 ' + required.length + ' 个摘要键全部就绪（zh/en 对称）');
  console.log('✓ 游戏页史话 tooltip en 双语正常: "' + enTitle0 + '"');
}
process.exit(fail ? 1 : 0);
