/* ============================================================
   CSS 健康检查：花括号配平 + 孤立注释尾（断开的 /* 会静默吞掉后续规则）
   用法：node tools/check-css.js   （纳入 qa-all）
   ============================================================ */
const fs = require('fs');
const path = require('path');

function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (f) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (f !== 'node_modules' && f !== 'test-results') walk(p, out); }
    else if (f.endsWith('.css')) out.push(p);
  });
  return out;
}

const files = walk('.', []);
let bad = 0;
files.forEach(function (f) {
  const t = fs.readFileSync(f, 'utf8');
  /* 1) 花括号配平（粗粒度：忽略字符串内的极端情况，本项目 CSS 无此类内容） */
  const open = (t.match(/\{/g) || []).length;
  const close = (t.match(/\}/g) || []).length;
  if (open !== close) { console.error('✗ ' + f + ' 花括号不配平 {=' + open + ' }=' + close); bad++; }
  /* 2) 孤立注释尾：某行以注释结束符开头且前面没有同行的开启符 —— 断注释特征 */
  const lines = t.split(/\r?\n/);
  let inComment = false;
  lines.forEach(function (L, i) {
    let scan = L;
    while (scan.length) {
      if (!inComment) {
        const o = scan.indexOf('/*');
        const c = scan.indexOf('*/');
        if (c >= 0 && (o < 0 || c < o)) { console.error('✗ ' + f + ':' + (i + 1) + ' 孤立注释尾 */（注释开头缺失？）'); bad++; scan = ''; }
        else if (o >= 0) { inComment = true; scan = scan.slice(o + 2); }
        else scan = '';
      } else {
        const c = scan.indexOf('*/');
        if (c >= 0) { inComment = false; scan = scan.slice(c + 2); }
        else scan = '';
      }
    }
    /* 文件级：正常 CSS 顶层不应在规则中途进入下一行仍处于注释外残留 *\/ —— 上面已覆盖 */
  });
  if (inComment) { console.error('✗ ' + f + ' 注释未闭合'); bad++; }
});

if (bad) { console.error('\n✗ ' + bad + ' 处 CSS 结构问题'); process.exit(1); }
console.log('✓ CSS 结构健康：' + files.length + ' 个文件（花括号配平 · 无孤立注释尾）');
