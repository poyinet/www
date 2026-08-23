/* ============================================================
   innerHTML 变量插值审计（A1 配套 · 人工复核辅助）
   用法：node tools/scan-innerhtml.js
   扫描范围：根目录 HTML 内联脚本、assets/js、games 各目录的 .js
   规则：找出 innerHTML 赋值/拼接行中的变量插值点，标记其中
         「未经 T()/escapeHtml 包裹的裸标识符」供人工复核。
   说明：静态启发式，存在误报（如注册表常量字段）；定位为
         复核清单而非硬门禁，恒以 exit 0 结束。
   ============================================================ */
const fs = require('fs');
const path = require('path');

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/^(\.|node_modules|oneoff)$/.test(e.name)) continue;
      walk(abs);
    } else if (/\.js$/.test(e.name)) files.push(abs);
    else if (/\.html$/.test(e.name)) files.push(abs);
  }
})('.');

/* 安全包裹模式：i18n 取词 / 转义函数 / 数字化 */
const SAFE = /(?:^|[^.\w])(?:T|Arcade\.i18n\.t|esc|escapeHtml|Arcade\.escapeHtml|parseInt|parseFloat|Number|String|encodeURIComponent)\s*\(/;

let totalSites = 0, totalUnsafe = 0;
const byFile = [];
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const isHtml = /\.html$/.test(f);
  if (isHtml) {
    /* 只审内联脚本 */
    const scripts = [...src.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m => m[0]);
    src = scripts.join('\n');
    if (!src.trim()) continue;
  }
  const rel = path.relative('.', f).split(path.sep).join('/');
  const lines = src.split('\n');
  let fileSites = 0, fileUnsafe = 0;
  const samples = [];
  lines.forEach((line, i) => {
    if (!/\.innerHTML\s*(\+?=|\+=)/.test(line) && !/innerHTML\s*\+=/.test(line)) return;
    if (!/\+\s*[A-Za-z_$]/.test(line)) return;
    fileSites++;
    /* 抽取拼接中的标识符插值（粗粒度：非引号内片段的首个标识符） */
    const frags = line.split(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/);
    const unsafeVars = [];
    for (const frag of frags) {
      const ids = frag.match(/[A-Za-z_$][\w$.]*/g) || [];
      for (const id of ids) {
        if (/^(if|for|while|return|var|function|new|typeof)$/.test(id)) continue;
        /* 该片段若整体被安全函数包裹则跳过：检查片段前后文 */
        const idx = frag.indexOf(id);
        const before = frag.slice(Math.max(0, idx - 40), idx);
        if (SAFE.test(before)) continue;
        unsafeVars.push(id);
      }
    }
    if (unsafeVars.length) {
      fileUnsafe++;
      if (samples.length < 3) samples.push('    L' + (i + 1) + ': ' + unsafeVars.slice(0, 4).join(',') + ' ← ' + line.trim().slice(0, 90));
    }
  });
  if (fileSites) {
    totalSites += fileSites; totalUnsafe += fileUnsafe;
    byFile.push({ rel, fileSites, fileUnsafe, samples });
  }
}

byFile.sort((a, b) => b.fileUnsafe - a.fileUnsafe);
console.log('=== innerHTML 插值点审计 ===');
console.log('含插值的文件: ' + byFile.length + ' | 插值行合计: ' + totalSites + ' | 其中含未包裹变量: ' + totalUnsafe);
if (totalUnsafe) {
  console.log('\nTop 文件（未包裹变量行数降序）:');
  for (const f of byFile.slice(0, 15)) {
    console.log('  ' + f.rel + '  插值 ' + f.fileSites + ' 行 / 未包裹 ' + f.fileUnsafe + ' 行');
    f.samples.forEach(s => console.log(s));
  }
  console.log('\n提示：注册表驱动的固定字段（game.path/icon 等）与 i18n 键值属已知安全源；');
  console.log('重点复核来源为 URL 参数 / localStorage / 用户输入的变量是否经过 escapeHtml。');
}
console.log('---\n审计完成（信息性报告，不影响退出码）');
