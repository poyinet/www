/* E1：给 glossary.html 术语加 chapters 反链（术语 → 相关章节） */
const fs = require('fs');
const F = 'glossary.html';
let s = fs.readFileSync(F, 'utf8');

/* term → 相关章节 id 列表 */
const MAP = {
  'Caesar Cipher': ['caesar'], 'Substitution': ['caesar', 'arab'], 'Affine Cipher': ['caesar'],
  'Rail Fence': ['ww1'], 'Vigenère': ['bacon', 'bletchley'], 'Playfair': ['ww1', 'midway'],
  'ADFGVX': ['ww1'], 'Enigma': ['bletchley'], 'Bombe': ['bletchley'], 'Purple': ['purple'],
  'JN-25': ['midway'], 'Frequency Analysis': ['dawn', 'arab', 'venona'], 'Crib': ['bletchley'],
  'Known-Plaintext Attack': ['bletchley', 'lorenz'], 'Depth': ['midway'], 'Kasiski Test': ['bacon'],
  'Brute Force': ['caesar', 'modern'], 'One-Time Pad (OTP)': ['venona'], 'XOR': ['lorenz', 'modern'],
  'Base64': ['modern'], 'Bacon\'s Biliteral': ['bacon'], 'Morse Code': ['bacon', 'ww1', 'midway', 'purple'],
  'Baudot Code': ['lorenz'], 'Polybius Square': ['ww1'], 'Hill Cipher': ['modern'],
  'Block Cipher': ['modern'], 'Steganography': ['bacon'], 'Plaintext': ['caesar'],
  'Ciphertext': ['caesar'], 'Key': ['caesar'], 'Cryptanalysis': ['arab'],
  'Cryptography': ['dawn'], 'Bletchley Park': ['bletchley'], 'Room 40': ['ww1'],
  'Colossus': ['lorenz'], 'SIS': ['purple'], 'Perfect Secrecy': ['modern'], 'Entropy': ['modern'],
  'Public-Key Crypto': ['modern'], 'HTTPS': ['modern'], 'Morse': ['ww1']
};

let n = 0;
for (const [term, chs] of Object.entries(MAP)) {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\'");
  const re = new RegExp("(\\{ cat: '[^']+', term: '" + esc + "'[\\s\\S]{0,500}?)(\\})");
  s = s.replace(re, function (m, head, tail) {
    if (/chapters: \[/.test(head)) return m;
    n++;
    return head + ", chapters: ['" + chs.join("','") + "']" + tail;
  });
}
fs.writeFileSync(F, s);
console.log('✓ 注入 ' + n + ' 个术语章节反链');
