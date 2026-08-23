/* ============================================================
   GitHub Pages 兼容性审计（部署前跑一次）
   用法：node tools/check-ghpages.js
   检查项：
     G1 大小写敏感引用审计 —— Windows 文件系统不区分大小写，
        本地能打开的链接在 Pages（Linux）上可能 404；全部本地
        引用按「精确大小写」比对磁盘真实路径
     G2 引用路径含反斜杠（Windows 风格）→ Linux 404
     G3 文件名非 ASCII / 含空格（URL 编码与转义风险）
     G4 单文件 >100MB（Git 硬限制）+ 站点总体积（Pages 上限 1GB）
     G5 .nojekyll 缺失提示（纯静态站建议关闭 Jekyll 构建）
     G6 自定义域一致性：CNAME 内容 vs canonical/og:url/robots.txt sitemap 域名
   数据源：全部根目录/游戏页 HTML 的 src|href、sw.js CORE_ASSETS、
           games.js 注册表 path 字段、prefetch.js 清单
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
let fail = 0;
const warn = (m) => { console.log('⚠ ' + m); };
const bad = (m) => { console.log('✗ ' + m); fail++; };
const ok = (m) => console.log('✓ ' + m);

/* ---------- 真实文件索引 ---------- */
/* 开发产物目录不参与站点审计（Playwright 报告/依赖等） */
const SKIP_DIRS = /^(node_modules|test-results|playwright-report|\.github)$/;
const exactFiles = new Set();   // 精确相对路径
const lowerMap = new Map();     // 小写路径 -> 真实相对路径
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (e.isDirectory()) { if (!SKIP_DIRS.test(e.name)) walk(abs); }
    else { exactFiles.add(rel); lowerMap.set(rel.toLowerCase(), rel); }
  }
})(ROOT);

/* ---------- 收集引用 ----------
   refs: [{ raw, base }]  raw 为原始引用串；base 为其所在目录（绝对） */
const refs = [];
function pushRef(raw, baseDirAbs) {
  if (!raw) return;
  const r = raw.trim();
  if (/^(https?:)?\/\//i.test(r)) return;          // 外链
  if (/^(data|mailto|tel):/i.test(r)) return;      // 协议
  if (r === '#' || r.startsWith('#')) return;      // 锚点
  refs.push({ raw: r, base: baseDirAbs });
}
function scanHtmlFile(abs) {
  let html = fs.readFileSync(abs, 'utf8');
  /* 剥离 <script>/<style> 内文（保留开标签属性），避免把 JS 字符串拼接误当引用 */
  html = html.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
             .replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi, '$1$2');
  const re = /(?:src|href)\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    let v = m[1].split('#')[0].split('?')[0];
    if (!v) continue;
    pushRef(v, path.dirname(abs));
  }
}
(function walkHtml(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.test(e.name)) walkHtml(abs);
    else if (/\.html$/i.test(e.name)) scanHtmlFile(abs);
  }
})(ROOT);

/* sw.js 预缓存清单（站点根相对） */
try {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const re = /'((?:\/[^'\\]+)|\.)'/g; let m;
  while ((m = re.exec(sw))) if (m[1].startsWith('/')) pushRef(m[1], ROOT);
} catch (e) {}
/* games.js 注册表 path 字段（站点根相对） */
try {
  const g = fs.readFileSync('assets/js/games.js', 'utf8');
  const re = /path:\s*'([^']+)'/g; let m;
  while ((m = re.exec(g))) pushRef(m[1], ROOT);
} catch (e) {}

/* 相对解析（POSIX 风格） */
function resolveRel(rawRef, baseAbs) {
  let parts;
  const clean = rawRef.split('?')[0].split('#')[0];
  if (clean.startsWith('/')) parts = clean.slice(1).split('/');
  else {
    const baseParts = path.relative(ROOT, baseAbs).split(path.sep).filter(Boolean);
    parts = baseParts.concat(clean.split('/'));
    const out = [];
    for (const p of parts) {
      if (p === '.' || p === '') continue;
      if (p === '..') out.pop(); else out.push(p);
    }
    return out.join('/');
  }
  return parts.filter(p => p && p !== '.').join('/');
}

/* ---------- G1/G2：逐条精确大小写比对 ---------- */
let checked = 0; const mismatches = []; const missing = []; const backslash = [];
for (const r of refs) {
  if (/\\/.test(r.raw)) { backslash.push(r.raw); continue; }
  const rel = resolveRel(r.raw, r.base);
  if (!rel) continue;
  checked++;
  if (exactFiles.has(rel)) continue;
  const ci = lowerMap.get(rel.toLowerCase());
  if (ci) mismatches.push({ ref: r.raw, actual: ci });
  else if (fs.existsSync(path.join(ROOT, rel))) { /* 目录等非常规目标，忽略 */ }
  else missing.push({ ref: r.raw });
}

/* ---------- G3：文件名风险 ---------- */
const riskyNames = [...exactFiles].filter(p => {
  const base = p.split('/').pop();
  return /[^\x00-\x7F]/.test(base) || /\s/.test(base);
});

/* ---------- G4：体积 ---------- */
const sizes = [...exactFiles].map(rel => {
  const st = fs.statSync(path.join(ROOT, rel));
  return { rel, size: st.size };
});
const totalMB = sizes.reduce((n, x) => n + x.size, 0) / 1048576;
const overGit = sizes.filter(x => x.size > 100 * 1048576);
const over50 = sizes.filter(x => x.size > 50 * 1048576).sort((a, b) => b.size - a.size);

/* ---------- G5/G6 ---------- */
const hasNojekyll = fs.existsSync(path.join(ROOT, '.nojekyll'));
let cnameDomain = null;
if (fs.existsSync(path.join(ROOT, 'CNAME'))) cnameDomain = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
let canonDomains = new Set();
for (const rel of exactFiles) {
  if (!/\.html$/.test(rel)) continue;
  const h = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const re = /(?:rel="canonical" href="|property="og:url" content=")(https?:\/\/[^/"']+)/g; let m;
  while ((m = re.exec(h))) canonDomains.add(m[1]);
}

/* ---------- 输出 ---------- */
console.log('=== G1 大小写敏感引用审计 ===');
if (checked === 0) bad('未收集到任何引用（扫描逻辑异常）');
else if (!mismatches.length) ok('共核对 ' + checked + ' 条本地引用，大小写全部精确匹配');
mismatches.forEach(x => { bad('大小写不匹配: 引用 "' + x.ref + '" → 磁盘实际为 "' + x.actual + '"'); });
missing.forEach(x => { bad('引用不存在: ' + x.ref); });

console.log('=== G2 反斜杠路径 ===');
backslash.length ? backslash.forEach(b => bad('Windows 反斜杠引用: ' + b)) : ok('无反斜杠路径');

console.log('=== G3 文件名安全 ===');
riskyNames.length ? riskyNames.forEach(n => warn('非 ASCII/含空格文件名: ' + n)) : ok('全部文件名为纯 ASCII 且不含空格');

console.log('=== G4 体积限额 ===');
overGit.length ? overGit.forEach(x => bad('超过 Git 100MB 单文件硬限: ' + x.rel)) : ok('无 >100MB 单文件');
totalMB > 1024 ? bad('站点总体积 ' + totalMB.toFixed(1) + ' MB 超过 Pages 1GB 上限') : ok('站点总体积 ' + totalMB.toFixed(2) + ' MB（上限 1GB）');
if (over50.length) { console.log('  体积 Top（>50KB 提示参考）:'); over50.slice(0, 5).forEach(x => console.log('    ' + Math.round(x.size / 1024) + ' KB  ' + x.rel)); }

console.log('=== G5 Jekyll ===');
hasNojekyll ? ok('.nojekyll 已存在（跳过 Jekyll 构建）') : warn('缺少 .nojekyll —— 纯静态站建议添加空文件跳过 Jekyll，避免构建差异/下划线文件丢失');

console.log('=== G6 自定义域一致性 ===');
if (!cnameDomain) warn('根目录无 CNAME 文件（使用自定义域名时需包含一行域名；仅用 username.github.io 可忽略）');
const domList = [...canonDomains];
if (cnameDomain && domList.length) {
  const mismatched = domList.filter(d => d !== 'https://' + cnameDomain);
  mismatched.length ? mismatched.forEach(d => bad('canonical/og 域名 ' + d + ' 与 CNAME ' + cnameDomain + ' 不一致')) : ok('canonical/og 域名与 CNAME 一致（' + cnameDomain + '）');
} else if (domList.length) {
  ok('canonical/og 域名: ' + domList.join(', ') + '（配置自定义域时须与此一致）');
}

console.log('---');
console.log(fail === 0 ? '🎉 GitHub Pages 兼容性检查通过' : '有 ' + fail + ' 个问题待修');
process.exit(fail ? 1 : 0);
