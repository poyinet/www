/* 运行时键完整性验证：模拟浏览器加载顺序，检查摘要键/正文键各就各位 */
const fs = require('fs');
const vm = require('vm');

// 最小浏览器环境
const sandbox = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sandbox.window.Arcade = sandbox.window.Arcade || {};
sandbox.Arcade = sandbox.window.Arcade;
vm.createContext(sandbox);

function load(file) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js');
load('assets/js/core/i18n-archive.js'); /* C2：bio/quote/text 长文已拆出 */
load('assets/js/core/i18n-story.js');

const dicts = sandbox.Arcade.i18n.dicts;
const zh = dicts.zh, en = dicts.en;

let fail = 0;

// 1. 摘要键必须存在于 dict 加载后（zh 与 en 对称）
const summaries = [];
for (let i = 0; i < 11; i++) summaries.push('era' + i, 'st.c' + i + '.t', 'st.c' + i + '.t.one');
['champollion','caesar','kindi','bacon','vigenere','payne','turing','welchman','friedman','flowers','shannon','rosenberg','rochefort'].forEach(p => {
  ['name','icon','role','era','bio','quote'].forEach(f => summaries.push('stp.' + p + '.' + f));
});
['rosetta','caesar-report','kindi','bacon-book','zimmermann','ultra','af','eastwind','colossus','venona','shannon'].forEach(a => {
  ['name','era','desc','text'].forEach(f => summaries.push('sta.' + a + '.' + f));
});

const missingZh = summaries.filter(k => zh[k] === undefined);
const missingEn = summaries.filter(k => en[k] === undefined);
if (missingZh.length) { console.log('❌ 摘要键缺 zh:', missingZh); fail++; } else console.log('✓ 摘要键 zh 全部存在 (' + summaries.length + ')');
if (missingEn.length) { console.log('❌ 摘要键缺 en:', missingEn); fail++; } else console.log('✓ 摘要键 en 全部存在 (' + summaries.length + ')');

// 2. 正文键必须存在（story 加载后）
const bodies = [];
for (let i = 0; i < 11; i++) bodies.push('st.c' + i + '.b', 'st.c' + i + '.lc', 'st.c' + i + '.lh');
const missingBody = bodies.filter(k => zh[k] === undefined || en[k] === undefined);
if (missingBody.length) { console.log('❌ 正文键缺失:', missingBody); fail++; } else console.log('✓ 章节正文键 zh/en 全部存在 (' + bodies.length + ')');

// 3. t() 取摘要键无回退（zh 下直接命中；en 下英文命中）
const t = sandbox.Arcade.i18n.t;
// 强制 en
sandbox.Arcade.i18n.dicts = dicts;
try { sandbox.localStorage.getItem = () => 'en'; } catch (e) {}
// 直接检查 en 字典内容是否为英文而非中文
const enTitle = en['st.c0.t'];
if (/[\u4e00-\u9fff]/.test(enTitle)) { console.log('❌ en 摘要键含中文:', enTitle); fail++; }
else console.log('✓ en 摘要键为英文: "' + enTitle + '"');
const enBio = en['stp.champollion.bio'];
if (/[\u4e00-\u9fff]/.test(enBio)) { console.log('❌ en bio 含中文'); fail++; }
else console.log('✓ en bio 为英文 (' + enBio.length + ' chars)');

process.exit(fail ? 1 : 0);
