/* 检测 glossary.html 注入词条中的未转义撇号（会破坏 JS 字符串） */
const fs = require('fs');
const c = fs.readFileSync('glossary.html', 'utf8');
const lines = c.split('\n');
let bad = 0;
lines.forEach((l, i) => {
  if (!l.includes("term: '")) return;
  /* 统计该行单引号数量（忽略 \' 转义） */
  let count = 0;
  for (let j = 0; j < l.length; j++) {
    if (l[j] === "'") {
      if (j > 0 && l[j - 1] === '\\') continue; // 已转义
      count++;
    }
  }
  if (count % 2 !== 0) {
    console.log('可疑行 ' + (i + 1) + '（奇数个引号）: ' + l.substring(0, 110));
    bad++;
  }
});
console.log('可疑行数: ' + bad);
