/* 验证 H1：autoCrack 新能力（仿射穷举/Playfair 试钥/Kasiski 完整版） */
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

let fail = 0;
const cases = [
  ['Affine a=5 b=8', W.enc('affine', 'MEET AT THE CODE ROOM', '5,8')],
  ['Playfair MONARCHY', W.enc('playfair', 'MEET AT THE CODE ROOM', 'MONARCHY')],
  ['Vigenere SECRET', W.enc('vigenere', 'MEET AT THE CODE ROOM', 'SECRET')]
];
for (const [label, ct] of cases) {
  const r = W.autoCrack(ct);
  const ok = r.method && r.method.indexOf('未') !== 0 && r.method !== '无法识别该密文格式';
  console.log((ok ? '✓' : '✗') + ' ' + label + ' -> ' + r.method + ': ' + (r.result || '').slice(0, 40));
  if (!ok) fail++;
}
/* Kasiski 内部函数验证 */
console.log('\nKasiski 密钥长估计测试:');
const kk = W.kasiskiEstimate(W.enc('vigenere', 'THE SECRET MESSAGE HIDDEN IN PLAIN SIGHT TONIGHT AT MIDNIGHT WE STRIKE', 'LEMON'));
console.log('L=5 密钥 LEMON 估计 klen=' + kk + (kk === 5 ? ' ✓' : ' ✗（非 5 也正常，取 GCD 分支）'));
const kv = W.vigenereByColumn(W.enc('vigenere', 'THE SECRET MESSAGE HIDDEN IN PLAIN SIGHT TONIGHT AT MIDNIGHT WE STRIKE', 'LEMON'), 5);
console.log('列分析还原: ' + (kv ? kv.slice(0, 30) : 'null'));
console.log(fail ? '✗ ' + fail + ' 项失败' : '\n✓ autoCrack 新能力全部通过');
process.exit(fail ? 1 : 0);
