/* 临时验证：games/rsa/rsa.js 的 makeRound 数学正确性（10000 局全检） */
/* 提取 IIFE 内、DOM 构建前的纯函数段（fmt/gcd/egcd/modinv/modPow/daySeed/mulberry/makeRound） */
const fs = require('fs');
let src = fs.readFileSync('games/rsa/rsa.js', 'utf8');
src = src.replace(/window\.GAME_TUTORIAL_STEPS[\s\S]*?\];/, '');
const start = src.indexOf('(function () {');
const end = src.indexOf('var wrap = document.createElement');
if (start < 0 || end < start) { console.error('✗ 未定位到函数段'); process.exit(1); }
global.document = { getElementById: function () { return null; } };
eval(src.slice(start + '(function () {'.length, end));

function check(rnd, label) {
  for (let i = 0; i < 10000; i++) {
    const r = makeRound(rnd);
    const { p, q, n, phi, e, d, mv, c, options } = r;
    if (n !== p * q) fail(label + ' n');
    if (phi !== (p - 1) * (q - 1)) fail(label + ' phi');
    if (gcd(e, phi) !== 1) fail(label + ' gcd(e,phi)!=1');
    if ((e * d) % phi !== 1) fail(label + ' ed%phi!=1  e=' + e + ' d=' + d + ' phi=' + phi);
    if (d <= 0 || d >= phi) fail(label + ' d range');
    if (modPow(mv, e, n) !== c) fail(label + ' c mismatch');
    if (modPow(c, d, n) !== mv % n) fail(label + ' roundtrip');
    const okOpts = options.filter(o => o.ok);
    if (okOpts.length !== 1 || okOpts[0].v !== e) fail(label + ' exactly-one-valid');
    options.filter(o => !o.ok).forEach(o => { if (gcd(o.v, phi) !== 1) {} else fail(label + ' distractor is coprime! v=' + o.v); });
    const vals = options.map(o => o.v);
    if (new Set(vals).size !== 3) fail(label + ' dup options ' + vals.join(','));
    /* e 必须出现在选项中且唯一合法 */
  }
  console.log('✓ ' + label + ' 10000 局全过');
}
function fail(msg) { console.error('✗ ' + msg); process.exit(1); }

check(Math.random, '随机模式');
check(mulberry(daySeed() * 31 + 7), '每日种子模式');
check(mulberry(20260824), '固定种子');
console.log('✓ RSA 数学验证全部通过');
