/* 验证彩蛋：每条密文是否由答案正确加密（用 workshop 13 算法） */const fs = require('fs');
const vm = require('vm');
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
global.atob = (s) => Buffer.from(s, 'base64').toString('binary');
global.unescape = (s) => s; global.escape = (s) => s;
global.encodeURIComponent = (s) => s; global.decodeURIComponent = (s) => s;
const sb = { window: {}, btoa: global.btoa, atob: global.atob, unescape: global.unescape, escape: global.escape, encodeURIComponent: global.encodeURIComponent, decodeURIComponent: global.decodeURIComponent };
vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/js/workshop.js', 'utf8'), sb);
vm.runInContext(fs.readFileSync('assets/js/easter-eggs.js', 'utf8'), sb);
const W = sb.window.Workshop;
const E = sb.window.EASTER_EGGS;

let fail = 0;
for (const e of E.EGGS) {
  /* 手动指定各条算法与密钥 */
  const spec = {
    e01: ['caesar', '3'], e02: ['morse', ''], e03: ['bacon', ''],
    e04: ['binary', ''], e05: ['base64', ''], e06: ['vigenere', 'CODE'],
    e07: ['rail', '3'], e08: ['xor', 'KEY'], e09: ['affine', '5,8'],
    e10: ['substitution', 'ZYXWVUTSRQPONMLKJIHGFEDCBA'], e11: ['playfair', 'ARCADE'],
    e12: ['hill', '3,2,2,3'],
    e13: ['vigenere', 'QUIZ'], e14: ['playfair', 'DUEL'],
    e15: ['morse', ''], e16: ['rail', '4'],
    e17: ['bifid', 'SPARTA'], e18: ['trifid', ''],
    e19: ['adfgvx', 'ZIMMER'], e20: ['affine', '7,11']
  };
  const [algo, key] = spec[e.id];
  const enc = W.enc(algo, e.answer, key);
  const ok = enc.replace(/\s+/g, '') === e.cipher.replace(/\s+/g, '');
  console.log((ok ? '✓' : '✗') + ' ' + e.id + ' ' + algo + ': 期望=' + e.cipher + ' 实际=' + enc + (ok ? '' : ' ← 答案=' + e.answer));
  if (!ok) fail++;
}
/* submit 校验 */
console.log('\nsubmit 测试:');
const r1 = E.submit('ARCADE');
console.log('e01 提交 ARCADE:', r1.ok ? '✓ found=' + r1.found + '/20' : '✗');
const r2 = E.submit('WRONG');
console.log('错误答案:', r2.ok ? '✗ 不应通过' : '✓ 正确拒绝');
process.exit(fail ? 1 : 0);
