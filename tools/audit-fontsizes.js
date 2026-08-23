/* 字号一致性审计：提取各根页面 CSS 规则中「同级元素」的字号 */
const fs = require('fs');
const path = require('path');

const pages = ['index.html', 'games.html', 'stories.html', 'story.html', 'people.html', 'artifacts.html', 'stats.html', '404.html'];
const ROOT = process.cwd();

function extractFontSizes(css, fileLabel) {
  const out = [];
  // 匹配 { ... font-size: Xpx ... } 规则（选择器不含媒体查询内部，简化处理）
  const blockRe = /([^{}@]+)\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css))) {
    const sel = m[1].trim().split(/\n/).pop().trim();
    const body = m[2];
    const fsMatch = body.match(/font-size:\s*([0-9.]+)px/);
    if (fsMatch && !sel.startsWith('@')) {
      // 归类：标题/正文/描述/标签/其他
      const size = parseFloat(fsMatch[1]);
      const cls = sel.match(/\.([a-zA-Z][\w-]*)/);
      const id = sel.match(/#([a-zA-Z][\w-]*)/);
      out.push({ size, sel: sel.trim().slice(0, 60), cls: cls ? cls[1] : '', id: id ? id[1] : '' });
    }
  }
  return out;
}

/* 关注「内容语义」类选择器：标题/段落/描述/标签/子标题 */
const SEM = /(title|heading|hero|desc|sub|one|era|head|h1|h2|h3|section-title|text|para|note|tag|chip|label|lbl|idx|name|role|stat)/i;

const report = {};
for (const p of pages) {
  const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
  const styles = [];
  const re = /<style>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = re.exec(html))) styles.push(m[1]);
  // 也看公共 css（theme/shell）里与页面同级的组件
  const rules = [];
  styles.forEach((s) => rules.push(...extractFontSizes(s, p)));
  const sem = rules.filter((r) => SEM.test(r.sel));
  report[p] = sem;
}

// 输出：按字号聚类，显示每页哪些语义类用了该字号
const sizes = {};
for (const [page, rules] of Object.entries(report)) {
  for (const r of rules) {
    if (!sizes[r.size]) sizes[r.size] = {};
    if (!sizes[r.size][page]) sizes[r.size][page] = [];
    sizes[r.size][page].push(r.sel);
  }
}
console.log('=== 各字号被哪些页面的哪些语义类使用 ===');
Object.keys(sizes).sort((a, b) => a - b).forEach((sz) => {
  console.log('\n── ' + sz + 'px ──');
  for (const [page, sels] of Object.entries(sizes[sz])) {
    console.log('  ' + page + ': ' + sels.slice(0, 4).join(' | '));
  }
});
