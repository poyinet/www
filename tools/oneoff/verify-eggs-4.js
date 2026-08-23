/* 生成并验证 e17-e20 新彩蛋密文：加载 workshop.js，用 W.enc 生成、W.dec 验证往返 */
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

/* 新彩蛋：id / 答案 / 算法 / 密钥（affine 用 'a,b' 字符串） */
const NEW = [
  { id: 'e17', answer: 'SCYTALE', algo: 'bifid',    key: 'SPARTA' },
  { id: 'e18', answer: 'VOYNICH', algo: 'trifid',   key: '' },
  { id: 'e19', answer: 'POLYBIUS',algo: 'adfgvx',   key: 'ZIMMER' },
  { id: 'e20', answer: 'ORYCTO',  algo: 'affine',   key: '7,11' }
];

const out = [];
for (const n of NEW) {
  const enc = W.enc(n.algo, n.answer, n.key);
  let dec = '';
  try { dec = W.dec(n.algo, enc, n.key) || ''; } catch (e) { dec = '(dec err: ' + e.message + ')'; }
  const back = dec.toUpperCase().replace(/[^A-Z]/g, '');
  const ok = back === n.answer;
  console.log((ok ? '✓' : '✗') + ' ' + n.id + ' ' + n.algo + ' key=' + (n.key || '-') + ' answer=' + n.answer);
  console.log('   密文: ' + enc);
  console.log('   dec: ' + (dec || '(空)') + (ok ? '' : '  ← 无法解回!'));
  out.push({ id: n.id, answer: n.answer, algo: n.algo, key: n.key, cipher: enc, ok });
}
/* 便捷：直接输出可粘贴进 JSON 的片段 */
console.log('\n--- JSON cipher 片段 ---');
for (const o of out) console.log(o.id + ' => ' + o.cipher);
