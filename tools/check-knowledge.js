/* 知识库完整性验证：人物/密件/术语 全字段 + 章节关联 */
const fs = require('fs');
const vm = require('vm');
const sb = { window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null }, navigator: { language: 'zh' }, localStorage: { getItem: () => null, setItem() {} }, location: { reload() {} }, console };
sb.window.Arcade = {}; sb.Arcade = sb.window.Arcade;
vm.createContext(sb);
['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-archive.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js', 'assets/js/stories.js'].forEach(f => vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f }));
const zh = sb.Arcade.i18n.dicts.zh, en = sb.Arcade.i18n.dicts.en;
let fail = 0;

/* 人物 */
const people = sb.window.PEOPLE;
const pMissing = people.filter(p => !zh['stp.' + p + '.bio'] || !en['stp.' + p + '.bio'] || !zh['stp.' + p + '.fact']);
console.log('人物:', people.length, '| 缺字段:', pMissing.length ? pMissing.join(',') : '无 ✓');
if (pMissing.length) fail++;

/* 密件 */
const arts = sb.window.ARTIFACTS;
const aMissing = arts.filter(a => !zh['sta.' + a.id + '.text'] || !en['sta.' + a.id + '.text'] || !a.nature);
console.log('密件:', arts.length, '| 缺字段:', aMissing.length ? aMissing.map(m => m.id).join(',') : '无 ✓');
if (aMissing.length) fail++;

/* 术语 */
const gl = fs.readFileSync('glossary.html', 'utf8');
const terms = (gl.match(/\{ cat: '[^']+', term: '/g) || []).length;
console.log('术语:', terms);
if (terms < 95) { console.log('✗ 术语应 ≥95'); fail++; }

/* 章节关联检查：新人物是否进章节 */
const linked = sb.window.STORIES.reduce((n, c) => n + (c.people || []).length, 0);
console.log('章节-人物关联总数:', linked);
process.exit(fail ? 1 : 0);
