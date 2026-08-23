/* 历史工具：重新生成彩蛋密文（当前全站 16 条 e01-e16；新彩蛋请用 tools/gen-eggs-4.js 的写法） */
const fs = require('fs');
const vm = require('vm');
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
global.atob = (s) => Buffer.from(s, 'base64').toString('binary');
global.unescape = (s) => s; global.escape = (s) => s;
global.encodeURIComponent = (s) => s; global.decodeURIComponent = (s) => s;
const sb = { window: {}, btoa: global.btoa, atob: global.atob, unescape: global.unescape, escape: global.escape, encodeURIComponent: global.encodeURIComponent, decodeURIComponent: global.decodeURIComponent };
vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/js/workshop.js', 'utf8'), sb);
const W = sb.window.Workshop;

/* 每条：答案 + 算法 + 密钥 */
const SPEC = {
  e01: ['ARCADE', 'caesar', '3'],
  e02: ['PLAY', 'morse', ''],
  e03: ['STORY', 'bacon', ''],
  e04: ['CODE', 'binary', ''],
  e05: ['SECRET', 'base64', ''],
  e06: ['CIPHER', 'vigenere', 'CODE'],
  e07: ['DECODE', 'rail', '3'],
  e08: ['BREAK', 'xor', 'KEY'],
  e09: ['HUNTER', 'affine', '5,8'],
  e10: ['MASTER', 'substitution', 'ZYXWVUTSRQPONMLKJIHGFEDCBA'],
  e11: ['ROSETTA', 'playfair', 'ARCADE'],
  e12: ['GENIUS', 'hill', '3,2,2,3']
};

for (const [id, [ans, algo, key]] of Object.entries(SPEC)) {
  const c = W.enc(algo, ans, key);
  console.log(id + ': cipher=\'' + c + '\'  // ' + algo + '(' + ans + ')');
}
