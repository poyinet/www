/* ============================================================
   SW 预缓存核对（C3）：sw.js CORE_ASSETS 与磁盘真实文件逐一比对
   用法：node tools/check-sw-assets.js
   - 每条预缓存路径必须真实存在（精确大小写）
   - 汇总数量；根目录新增 HTML 未入预缓存时给出提示（导航为
     network-first，不缓存不影响在线，但离线首跳会兜底到首页）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const sw = fs.readFileSync('sw.js', 'utf8');
const m = /var\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/.exec(sw);
if (!m) { console.log('✗ sw.js 中未找到 CORE_ASSETS'); process.exit(1); }
const entries = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
let fail = 0;
const missing = [];
for (const e of entries) {
  const rel = e.replace(/^\//, '');
  if (!rel) continue; /* '/' 根路径由 index.html 代表 */
  if (!fs.existsSync(path.join('.', rel))) { missing.push(e); }
}
missing.forEach(x => { console.log('✗ 预缓存目标不存在: ' + x); fail++; });
if (!missing.length) console.log('✓ CORE_ASSETS ' + entries.length + ' 条全部存在于磁盘（精确大小写）');

/* 信息性：根目录 HTML 未入预缓存的清单 */
const rootHtml = fs.readdirSync('.').filter(f => /\.html$/i.test(f)).map(f => '/' + f);
const notPre = rootHtml.filter(h => entries.indexOf(h) < 0 && h !== '/404.html');
if (notPre.length) console.log('ℹ 未预缓存的根页面（离线首跳走首页兜底）: ' + notPre.join(', '));

/* CACHE 版本号提醒：资源清单变化时应 bump */
const ver = /var\s+CACHE\s*=\s*'([^']+)'/.exec(sw);
if (ver) console.log('ℹ 当前缓存版本: ' + ver[1] + '（改动 CORE_ASSETS 后记得 bump）');

console.log('---');
console.log(fail ? '有 ' + fail + ' 个问题' : '🎉 SW 预缓存核对通过');
process.exit(fail ? 1 : 0);
