/* D1 分层：为每章追加 core 数组（核心密码局；未列出的同章游戏=时代彩蛋） */
const fs = require('fs');
const f = 'assets/js/stories.js';
let s = fs.readFileSync(f, 'utf8');
const CORE = {
  dawn: "['freq']",
  caesar: "['caesar', 'substitution', 'affine', 'atbash']",
  arab: "['freq', 'substitution', 'codebreak']",
  bacon: "['bacon', 'vigenere', 'autokey', 'morse']",
  ww1: "['adfgvx', 'playfair', 'polybius', 'nihilist', 'railfence', 'typecode']",
  bletchley: "['enigma', 'bombe', 'plugboard', 'campaign']",
  midway: "['jn25', 'm209']",
  purple: "['purple', 'codebreak']",
  lorenz: "['lorenz', 'dungeon-cipher', 'binary']",
  venona: "['venona', 'detective']",
  modern: "['xor', 'hill', 'base64', 'maker', 'hashlab']",
  quantum: "['bb84']"
};
let n = 0;
for (const [id, arr] of Object.entries(CORE)) {
  const anchor = "{ id: '" + id + "', era:";
  const i = s.indexOf(anchor);
  if (i < 0) { console.error('MISS id', id); process.exit(1); }
  /* 在该章对象内的 games 数组之后插入 core 字段 */
  const gIdx = s.indexOf("games: [", i);
  if (gIdx < 0) { console.error('MISS games', id); process.exit(1); }
  const gEnd = s.indexOf(']', gIdx);
  if (gEnd < 0 || gEnd > i + 2000) { console.error('MISS bracket', id); process.exit(1); }
  if (s.slice(gEnd, gEnd + 8).includes('core:')) continue; /* 幂等 */
  s = s.slice(0, gEnd + 1) + ", core: " + arr + s.slice(gEnd + 1);
  n++;
}
fs.writeFileSync(f, s, 'utf8');
console.log('core added to', n, 'chapters');
