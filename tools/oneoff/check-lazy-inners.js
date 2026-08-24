/* 终检：LAZY 区段内仅允许 DH populate 一处合法立即调用；其余 inner IIFE 调用齐全 */
const fs = require('fs');
const t = fs.readFileSync('assets/js/protocols.js', 'utf8');
const s = t.indexOf("LAZY('pl-tls'");
const e = t.indexOf("el('pl-ready').textContent = '16'");
const seg = t.slice(s, e);
const invocations = (seg.match(/\}\)\(\);/g) || []).length;
console.log('LAZY 区段内立即调用数:', invocations, '(应为 3：DH populate + merkle build + pwd build)');
process.exit(invocations === 1 ? 0 : 1);
