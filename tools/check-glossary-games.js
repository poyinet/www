const fs = require('fs');
const s = fs.readFileSync('glossary.html', 'utf8');
const terms = ['Caesar Cipher','Substitution','Affine Cipher','Vigenère','Rail Fence','Playfair','ADFGVX','Enigma','Bombe','Purple','JN-25','Frequency Analysis','Crib','Known-Plaintext Attack','Depth','Kasiski Test','Brute Force','One-Time Pad (OTP)','XOR','Base64',"Bacon's Biliteral",'Morse Code','Baudot Code','Polybius Square','Hill Cipher','Block Cipher'];
let miss = [];
for (const t of terms) {
  // 正则特殊字符转义；撇号匹配「可选反斜杠 + 撇号」（源码里写作 \'）
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\\\?'");
  const re = new RegExp("term: '" + esc + "'[\\s\\S]{0,400}?game: '(\\w+)'");
  const m = s.match(re);
  if (m) console.log('✓ ' + t + ' → ' + m[1]);
  else { console.log('✗ ' + t); miss.push(t); }
}
console.log('\n缺失 ' + miss.length + ' 个: ' + (miss.join(', ') || '无'));
process.exit(miss.length ? 1 : 0);
