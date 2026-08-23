/* 给 glossary.html 术语数据补 game 关联（term → 游戏 id），P2-1 术语表×游戏联动 */
const fs = require('fs');
const path = require('path');
const F = path.join(process.cwd(), 'glossary.html');
let s = fs.readFileSync(F, 'utf8');

/* term → gameId 映射（仅选有明确对应游戏的 22 个术语） */
const MAP = {
  'Caesar Cipher': 'caesar',
  'Substitution': 'substitution',
  'Affine Cipher': 'affine',
  'Vigenère': 'vigenere',
  'Rail Fence': 'railfence',
  'Playfair': 'playfair',
  'ADFGVX': 'adfgvx',
  'Enigma': 'enigma',
  'Bombe': 'bombe',
  'Purple': 'purple',
  'JN-25': 'jn25',
  'Frequency Analysis': 'freq',
  'Crib': 'enigma',
  'Known-Plaintext Attack': 'workshop',
  'Depth': 'jn25',
  'Kasiski Test': 'codebreak',
  'Brute Force': 'codebreak',
  'One-Time Pad (OTP)': 'venona',
  'XOR': 'xor',
  'Base64': 'base64',
  'Bacon\'s Biliteral': 'bacon',
  'Morse Code': 'morse',
  'Baudot Code': 'lorenz',
  'Polybius Square': 'adfgvx',
  'Hill Cipher': 'hill',
  'Block Cipher': 'maker'
};

/* 在 GLOSSARY 数组的每个对象里注入 game 字段：
   匹配 { cat: 'xx', term: 'yyy', zh: ..., zhDef: ..., enDef: ... } */
let injected = 0;
for (const [term, game] of Object.entries(MAP)) {
  // 匹配包含该 term 的条目，若尚无 game 字段则注入
  const re = new RegExp("(\\{ cat: '[^']+', term: '" + term.replace(/'/g, "\\'") + "'[^}]*?)(\\})", 'g');
  s = s.replace(re, function (m, head, tail) {
    if (/game: '/.test(head)) return m;
    injected++;
    // 在 enDef 结束后的 '}' 前插入 , game: 'xxx'
    return head + ", game: '" + game + "'" + tail;
  });
}

fs.writeFileSync(F, s);
console.log('✓ 已注入 ' + injected + ' 个 game 关联（期望 26）');
