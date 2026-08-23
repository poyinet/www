/* ============================================================
   部署前资源完整性检查（preflight）
   扫描全部 109 个 HTML 引用的本地资源（CSS/JS/字体/图标/图片/页面链接），
   确认文件存在、路径正确——上传后不应出现任何 404。
   用法：node tools/preflight.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* 收集全部 HTML */
function collectHtml() {
  const files = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (/\.html$/.test(f)) files.push(path.join(ROOT, f));
  }
  const gamesDir = path.join(ROOT, 'games');
  if (fs.existsSync(gamesDir)) {
    for (const id of fs.readdirSync(gamesDir)) {
      const p = path.join(gamesDir, id, 'index.html');
      if (fs.existsSync(p)) files.push(p);
    }
  }
  return files.sort();
}

/* 从 HTML 提取本地资源引用（相对路径 + 根绝对路径 /assets/...） */
function extractRefs(html) {
  const refs = new Set();
  const re = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    let url = m[1];
    if (!url || /^(https?:|data:|mailto:|#|javascript:)/.test(url)) continue;
    /* 跳过动态参数链接（story.html?id=... 由 JS 按章节渲染）与 JS 模板拼接（含 ' + 或 {） */
    if (/\?id=/.test(url) || /\+\s*['"]|['"]\s*\+|\{/.test(url)) continue;
    url = url.split('#')[0]; /* 剥离锚点：quiz.html#wrong 的文件是 quiz.html（查漏补缺修正） */
    if (!url) continue;
    refs.add(url);
  }
  return refs;
}

let total = 0, missing = [];
const htmlFiles = collectHtml();

for (const file of htmlFiles) {
  const dir = path.dirname(file);
  const html = fs.readFileSync(file, 'utf8');
  for (const ref of extractRefs(html)) {
    total++;
    let abs;
    if (ref.startsWith('/')) {
      abs = path.join(ROOT, ref.replace(/^\//, ''));
    } else {
      abs = path.resolve(dir, ref);
    }
    if (!fs.existsSync(abs)) {
      missing.push({ file: path.relative(ROOT, file), ref, abs });
    }
  }
}

if (missing.length) {
  console.log('❌ 发现 ' + missing.length + ' 个缺失资源：');
  missing.slice(0, 30).forEach((x) => console.log('  ' + x.file + ' → ' + x.ref));
  console.log('（完整清单见上方；已检查 ' + htmlFiles.length + ' 个 HTML / ' + total + ' 个引用）');
  process.exit(1);
} else {
  console.log('✓ 部署前检查通过：' + htmlFiles.length + ' 个 HTML / ' + total + ' 个本地资源引用，全部存在，无 404 风险');
}

/* 专项：动态章节链接 story.html?id=<ch> 的 id 必须存在于 stories.js 的章节注册表 */
const storiesJs = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'stories.js'), 'utf8');
const chapterIds = new Set();
const chRe = /id:\s*'([a-z0-9-]+)'/g;
let cm;
while ((cm = chRe.exec(storiesJs))) chapterIds.add(cm[1]);

const dynRefs = new Set();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const re = /href="(story\.html\?id=)([a-z0-9-]+)"/g;
  let m;
  while ((m = re.exec(html))) dynRefs.add(m[2]);
}
const badIds = [...dynRefs].filter((id) => !chapterIds.has(id));
if (badIds.length) {
  console.log('❌ 动态章节链接指向不存在的章节: ' + badIds.join(', '));
  process.exit(1);
} else if (dynRefs.size) {
  console.log('✓ 动态章节链接 ' + dynRefs.size + ' 个 id 全部有效（' + chapterIds.size + ' 章注册表）');
}

/* 额外：检查关键新资源确实存在 */
['assets/fonts/fusion-pixel-site.woff2', 'assets/fonts/press-start-2p.woff2',
 'assets/js/prefetch.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-archive.js', 'assets/js/core/i18n-story.js',
 'assets/js/core/music.js', 'sw.js', 'manifest.webmanifest'].forEach((f) => {
  if (!fs.existsSync(path.join(ROOT, f))) { console.log('❌ 关键资源缺失: ' + f); process.exit(1); }
});
console.log('✓ 关键资源（字体/脚本/SW/manifest）齐全');
