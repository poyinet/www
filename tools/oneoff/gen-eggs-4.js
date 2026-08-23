/* 生成 C2 新彩蛋（e13-e16）密文：用 workshop 真实加密并验证可解 */
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

/* 新彩蛋：答案 + 算法 + 密钥 */
const NEW = [
  { id: 'e13', answer: 'LEARN', algo: 'vigenere', key: 'QUIZ', loc: 'quiz.html 页脚' },
  { id: 'e14', answer: 'WINNER', algo: 'playfair', key: 'DUEL', loc: 'duel.html 页脚' },
  { id: 'e15', answer: 'LISTEN', algo: 'morse', key: '', loc: 'morse-listen.html 页脚' },
  { id: 'e16', answer: 'JOURNEY', algo: 'rail', key: '4', loc: 'path.html 页脚' }
];

for (const n of NEW) {
  const enc = W.enc(n.algo, n.answer, n.key);
  /* 用 dec 验证往返 */
  let dec = '';
  try {
    dec = W.dec(n.algo, enc, n.key) || '';
  } catch (e) { dec = '(dec err: ' + e.message + ')'; }
  const back = dec.toUpperCase().replace(/[^A-Z]/g, '');
  const ok = back === n.answer;
  console.log((ok ? '✓' : '✗') + ' ' + n.id + ' ' + n.algo + ' key=' + (n.key || '-') + ' answer=' + n.answer);
  console.log('   密文: ' + enc);
  console.log('   dec: ' + (dec || '(空)') + (ok ? '' : '  ← 无法解回!'));
}
