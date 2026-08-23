/* 临时验证：hashlab 截断指纹生日攻击逻辑（16/20 位）能否按预期找到碰撞 */
global.window = { GAME_TUTORIAL_STEPS: null };
global.T = function (k) { return k; };
global.document = {
  getElementById: function () { return null; },
  createElement: function () { return { style: {}, classList: {}, addEventListener: function () {} }; }
};
/* 提取 hashlab.js 的纯算法段（SHA256 IIFE）执行 */
const fs = require('fs');
const src = fs.readFileSync('games/hashlab/hashlab.js', 'utf8');
const m = src.match(/var SHA256 = \(function[\s\S]*?\n\}\)\(\);/);
if (!m) { console.error('✗ 未提取到 SHA256'); process.exit(1); }
eval(m[0]);

function birthday(bits) {
  const hexChars = bits / 4;
  const seen = new Map();
  let attempts = 0;
  for (;;) {
    const id = ++attempts;
    const fp = SHA256('BD#' + id).slice(0, hexChars);
    const prev = seen.get(fp);
    if (prev !== undefined) return { a: prev, b: id, fp, attempts };
    seen.set(fp, id);
  }
}
for (const w of [16, 20]) {
  const r = birthday(w);
  const expected = Math.round(Math.sqrt(Math.PI / 2) * Math.sqrt(Math.pow(2, w)));
  console.log(`bits=${w} → 首碰撞 #${r.a}↔#${r.b} fp=${r.fp.toUpperCase()} 尝试=${r.attempts}（预期≈${expected}）`);
  if (r.a === r.b || !r.fp || r.fp.length !== w / 4) { console.error('✗ 异常'); process.exit(1); }
}
console.log('✓ 生日攻击逻辑验证通过');
