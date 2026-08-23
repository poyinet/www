/* 验证 workshop.js：15 种算法加密→解密往返 + autoCrack 关键路径 */
const fs = require('fs');
const vm = require('vm');
/* Node 无 btoa/atob，polyfill */
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
global.atob = (s) => Buffer.from(s, 'base64').toString('binary');
global.unescape = (s) => s;
global.encodeURIComponent = (s) => s;
global.decodeURIComponent = (s) => s;
global.escape = (s) => s;
const sb = { window: {}, btoa: global.btoa, atob: global.atob, unescape: global.unescape, encodeURIComponent: global.encodeURIComponent, decodeURIComponent: global.decodeURIComponent, escape: global.escape };
vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/js/workshop.js', 'utf8'), sb, { filename: 'workshop.js' });
const W = sb.window.Workshop;

let fail = 0;
const PLAIN = 'ATTACK AT DAWN';
console.log('=== 加密→解密往返 ===');
for (const id in W.ALGOS) {
  const a = W.ALGOS[id];
  const defKey = a.keyDefault || '';
  const enc = W.enc(id, PLAIN, defKey);
  const dec = W.dec(id, enc, defKey);
  // 大小写/空白归一后对比（部分算法只处理字母）
  const norm = (s) => s.toUpperCase().replace(/[^A-Z]/g, '');
  const ok = norm(dec) === norm(PLAIN);
  console.log((ok ? '✓' : '✗') + ' ' + id + ': enc=' + enc.slice(0, 40) + (ok ? '' : ' → dec=' + dec));
  if (!ok) fail++;
}
console.log('\n=== 自动破解 ===');
const cases = [
  ['Caesar shift 5', W.enc('caesar', 'MEET ME AT THE CODE ROOM', '5')],
  ['Morse', W.enc('morse', 'SECRET', '')],
  ['Bacon', W.enc('bacon', 'HELLO', '')],
  ['Binary', W.enc('binary', 'CODE', '')],
  ['XOR', W.enc('xor', 'ATTACK', 'KEY')],
  ['Base64', W.enc('base64', 'SECRET MESSAGE', '')]
];
for (const [label, ct] of cases) {
  const r = W.autoCrack(ct);
  const ok = r.method !== '无法识别该密文格式' && r.method !== '未自动识别';
  console.log((ok ? '✓' : '✗') + ' ' + label + ' → ' + r.method + ': ' + r.result.slice(0, 40));
  if (!ok) fail++;
}
console.log('\n' + (fail ? '✗ ' + fail + ' 项失败' : '✓ 全部通过'));
process.exit(fail ? 1 : 0);
