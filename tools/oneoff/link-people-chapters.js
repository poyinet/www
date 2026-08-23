/* 把 8 位新人物关联进章节 people 数组（D2 完整化） */
const fs = require('fs');
const F = 'assets/js/stories.js';
let s = fs.readFileSync(F, 'utf8');

const MAP = [
  { ch: 'bacon', people: 'trithemius', anchor: 'people: [\'bacon\', \'vigenere\']' },
  { ch: 'bacon', people: 'kasiski', anchor: 'people: [\'bacon\', \'vigenere\']' },
  { ch: 'ww1', people: 'vernam', anchor: "people: ['payne']" },
  { ch: 'bletchley', people: 'rejewski', anchor: "people: ['turing', 'welchman']" },
  { ch: 'midway', people: 'driscoll', anchor: "people: ['rochefort']" },
  { ch: 'modern', people: 'diffie', anchor: "people: ['shannon']" },
  { ch: 'modern', people: 'shamir', anchor: "people: ['shannon']" },
  { ch: 'modern', people: 'adleman', anchor: "people: ['shannon']" }
];

let n = 0;
for (const m of MAP) {
  /* 找到该章的 people 数组（章节对象内），把新人名加进去（若已含则跳过） */
  const re = new RegExp("(\\{ id: '" + m.ch + "',[\\s\\S]*?people: \\[[^\\]]*\\])");
  s = s.replace(re, function (matched, peopleArr) {
    if (peopleArr.includes("'" + m.people + "'")) return matched; // 已含
    n++;
    /* 在 ] 前插入 */
    return matched.replace(/\]$/, ", '" + m.people + "']");
  });
}
fs.writeFileSync(F, s);
console.log('✓ 关联 ' + n + ' 位人物进章节');
