/* 验证 glossary.html 内联脚本可执行（提取 GLOSSARY 定义到 <script> 标签模拟） */
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('glossary.html', 'utf8');
/* 提取内联脚本（不含 src= 的 script 块） */
const scripts = [];
const re = /<script>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(html)) !== null) scripts.push(m[1]);
console.log('内联脚本块: ' + scripts.length);

/* 模拟最小环境执行每个脚本块 */
const sb = { window: {}, document: {}, localStorage: { getItem: () => null, setItem: () => {} } };
sb.window = sb;
sb.document = {
  documentElement: { setAttribute: () => {} },
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
  head: { appendChild: () => {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};
sb.Arcade = { i18n: { t: k => k, applyStatic: () => {}, getLang: () => 'zh', dicts: { zh: {}, en: {} } } };
sb.window.Arcade = sb.Arcade;
sb.T = k => k;
vm.createContext(sb);
try {
  scripts.forEach((s, i) => {
    vm.runInContext(s, sb, { filename: 'glossary-inline-' + i + '.js' });
  });
  console.log('✓ glossary.html 全部内联脚本执行成功');
  console.log('GLOSSARY 词条数: ' + (sb.window.GLOSSARY ? sb.window.GLOSSARY.length : 'N/A'));
} catch (e) {
  console.log('✗ 执行失败: ' + e.message);
  process.exit(1);
}
