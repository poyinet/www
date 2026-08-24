/* 死 CSS 检测器：解析规则块，类名在全仓 html/js 中零引用 → 候选删除
   保守策略：逗号选择器组任一命中即保留整组；@keyframes 按使用名判断；@media 递归 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

function walk(dir, exts, out) {
  fs.readdirSync(dir).forEach(function (f) {
    if (f === 'node_modules' || f === 'test-results' || f === '.git' || f === 'tools') return;
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some(e => f.endsWith(e))) out.push(p);
  });
  return out;
}

/* ---------- 1. 收集全仓使用文本（html + js，含字符串里的动态类名） ---------- */
const useFiles = walk(ROOT, ['.html', '.js'], []);
let HAYSTACK = '';
useFiles.forEach(f => {
  if (f.replace(/\\/g, '/').endsWith('/theme.css')) return;
  HAYSTACK += '\n/*' + f + '*/\n' + fs.readFileSync(f, 'utf8');
});

/* ---------- 2. CSS 解析 ---------- */
function parseBlocks(css, ctx) {
  const rules = [];
  let i = 0, n = css.length;
  while (i < n) {
    const commentStart = css.indexOf('/*', i);
    const nextBrace = css.indexOf('{', i);
    if (nextBrace < 0) break;
    /* 跳过注释 */
    let j = nextBrace + 1, depth = 1;
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      else if (css.startsWith('/*', j)) j = css.indexOf('*/', j) + 2;
      j++;
    }
    const sel = css.slice(i, nextBrace).trim();
    const body = css.slice(nextBrace + 1, j - 1);
    rules.push({ sel, body, ctx });
    i = j;
  }
  return rules;
}
function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, ''); }
function classesOf(sel) {
  const m = stripComments(sel).match(/\.[-\w]+/g) || [];
  return m.map(x => x.slice(1));
}
function used(cls) {
  return HAYSTACK.includes('.' + cls) || HAYSTACK.includes("'" + cls + "'") ||
         HAYSTACK.includes('"' + cls + '"') || HAYSTACK.includes(' ' + cls) ;
}

const cssFiles = ['assets/css/theme.css', 'assets/css/shell.css'];
const report = [];
let deadRules = 0, totalRules = 0, deadBytes = 0;

cssFiles.forEach(function (f) {
  const css = fs.readFileSync(f, 'utf8');
  /* 顶层 + @media 内层，一并解析（@media 头当作上下文保留） */
  const chunks = [];
  let rest = css;
  /* 简化：把 @media 前缀与体合并成 "sel=媒体头 + 内规则" 处理 */
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const b = css.indexOf('{', i);
    if (b < 0) break;
    const head = css.slice(i, b).trim();
    if (head.startsWith('@media') || head.startsWith('@supports')) {
      /* 找配对闭括号 */
      let d = 1, j = b + 1;
      while (j < css.length && d > 0) {
        if (css[j] === '{') d++;
        else if (css[j] === '}') d--;
        j++;
      }
      parseBlocks(css.slice(b + 1, j - 1), head).forEach(r => rules.push(r));
      i = j;
    } else if (head.startsWith('@keyframes')) {
      let d = 1, j = b + 1;
      while (j < css.length && d > 0) {
        if (css[j] === '{') d++;
        else if (css[j] === '}') d--;
        j++;
      }
      const name = head.replace(/@keyframes\s+/, '').trim();
      rules.push({ sel: '@keyframes ' + name, body: css.slice(b + 1, j - 1), ctx: 'kf', name });
      i = j;
    } else {
      let d = 1, j = b + 1;
      while (j < css.length && d > 0) {
        if (css[j] === '{') d++;
        else if (css[j] === '}') d--;
        j++;
      }
      rules.push({ sel: head, body: css.slice(b + 1, j - 1), ctx: '' });
      i = j;
    }
  }
  rules.forEach(function (r) {
    totalRules++;
    if (r.ctx === 'kf') {
      if (!HAYSTACK.includes(r.name)) {
        report.push({ f, sel: r.sel, bytes: r.body.length + r.sel.length + 2 });
        deadRules++; deadBytes += r.body.length + r.sel.length + 2;
      }
      return;
    }
    const cls = classesOf(r.sel);
    if (!cls.length) return; /* 元素/变量规则不动 */
    if (r.sel.startsWith('@')) return;
    if (cls.every(c => !used(c))) {
      report.push({ f, sel: stripComments(r.sel).replace(/\s+/g, ' ').slice(0, 90), bytes: r.body.length + r.sel.length + 2, media: r.ctx });
      deadRules++; deadBytes += r.body.length + r.sel.length + 2;
    }
  });
});

console.log('rules total:', totalRules, ' dead candidates:', deadRules, ' ~' + (deadBytes / 1024).toFixed(1) + ' KB');
report.forEach(r => console.log((r.media ? '[media] ' : '') + r.f + ' :: ' + r.sel + '  (≈' + r.bytes + 'B)'));
