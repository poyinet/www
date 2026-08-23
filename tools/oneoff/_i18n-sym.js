/* i18n 键对称性检查：真实加载字典，对比 zh/en 键集 */
global.window = {};
global.Arcade = { i18n: {} };
require('../assets/js/core/i18n-dict.js');
const dicts = global.Arcade.i18n.dicts;
const zh = Object.keys(dicts.zh);
const en = Object.keys(dicts.en);
const zhSet = new Set(zh), enSet = new Set(en);
const onlyZh = zh.filter(k => !enSet.has(k));
const onlyEn = en.filter(k => !zhSet.has(k));
console.log('zh keys:', zh.length, 'en keys:', en.length);
console.log('only in zh (' + onlyZh.length + '):', onlyZh.slice(0, 80));
console.log('only in en (' + onlyEn.length + '):', onlyEn.slice(0, 80));
