/* 检查 protocols.html pl-ready 位置与残留计数 */
const fs = require('fs');
const t = fs.readFileSync('protocols.html', 'utf8');
console.log('pl-ready exists:', t.includes('id="pl-ready"'));
console.log('九大 remains:', t.includes('九大'));
console.log('六大 remains:', t.includes('六大'));
console.log('九堂 remains:', t.includes('九堂'));
console.log('十一 present:', t.includes('十一大交互演示'));
/* pl-ready 是否在 footer 之前（原位置在 wrap 结束后） */
const iWrap = t.indexOf('</div>\n\n  <footer');
console.log('pl-ready before footer:', t.lastIndexOf('pl-ready') < iWrap && t.lastIndexOf('pl-ready') > 0);
