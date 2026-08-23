/* C2 拆分脚本：把 i18n-dict.js 中的人物长文（stp.*.bio/quote）与
   密件全文（sta.*.text）迁移到懒加载字典 i18n-archive.js。
   核心字典保留占位默认（for 循环生成的 '—'），archive 载入后覆盖。 */
const fs = require('fs');

const src = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8');
const lineRe = /^[^\S\n]*d\.(zh|en)\['(stp\.[^']+\.(?:bio|quote)|sta\.[^']+\.text)'\] = .*$/gm;

const moved = [];
const kept = [];
let m;
let lastIndex = 0;
// 逐行分类
const lines = src.split('\n');
const outLines = [];
for (const line of lines) {
  if (/^\s*d\.(zh|en)\['(stp\.[^']+\.(bio|quote)|sta\.[^']+\.text)'\] = /.test(line)) {
    moved.push(line);
  } else {
    outLines.push(line);
  }
}
console.log('迁出条目行数:', moved.length, '| 迁出字节:', moved.reduce((n, l) => n + Buffer.byteLength(l, 'utf8'), 0));

/* 生成 archive 文件 */
const header = `/* ============================================================
   归档长文词典（C2 拆分）：人物传记/引言（stp.*.bio/.quote）与
   密件全文（sta.*.text）。体积较大、仅在以下场景需要：
   - people.html / artifacts.html 内容页（同步加载）
   - 其他页面：extras.js 打开人物档案弹窗/搜索时按需注入
   加载后会覆盖核心字典中的占位默认（'—'）。
   由 tools/_split-dict.js 自动生成 —— 请勿手工编辑本文件，
   改动请编辑 i18n-dict.js 对应条目后重跑拆分脚本。
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
`;
fs.writeFileSync('assets/js/core/i18n-archive.js', header + moved.join('\n') + '\n})();\n');
fs.writeFileSync('assets/js/core/i18n-dict.js', outLines.join('\n'));
console.log('✓ 已写出 i18n-archive.js 并瘦身 i18n-dict.js');
