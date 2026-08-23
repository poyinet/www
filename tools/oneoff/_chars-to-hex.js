/* 字面字符 → 十六进制码点文件（每行一个，供 pyftsubset --unicodes-file） */
const fs = require('fs');
const chars = fs.readFileSync('tools/report/site-chars.txt', 'utf8');
const hex = [];
for (const ch of chars) hex.push(ch.codePointAt(0).toString(16).toUpperCase());
fs.writeFileSync('tools/report/site-chars-hex.txt', hex.join('\n'));
console.log('码点数:', hex.length);
