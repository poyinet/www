/* 工坊 i18n 化：ALGOS 加 enName/keyEn + autoCrack 中文串双语化 */
const fs = require('fs');
const f = 'assets/js/workshop.js';
let s = fs.readFileSync(f, 'utf8');
let n = 0;

const MAP = [
  /* [zhName, enName, keyLabelZh, keyLabelEn]  keyLabel 为 null 表示该算法无密钥 */
  ["凯撒 Caesar", "Caesar Cipher", "偏移量", "Shift amount"],
  ["仿射 Affine", "Affine Cipher", "a, b（如 5,8）", "a, b (e.g. 5,8)"],
  ["单表替换 Substitution", "Monoalphabetic Substitution", "26 字母置换表", "26-letter permutation table"],
  ["维吉尼亚 Vigenère", "Vigenère Cipher", "密钥词", "Key word"],
  ["自动密钥 Autokey", "Autokey", "引子 Primer", "Primer"],
  ["栅栏 Rail Fence", "Rail Fence", "轨道数", "Number of rails"],
  ["Playfair", "Playfair", null, null],
  ["ADFGVX（替换层）", "ADFGVX (substitution layer)", "密钥词", "Key word"],
  ["培根 Bacon", "Bacon Cipher", "", ""],
  ["摩斯 Morse", "Morse Code", "", ""],
  ["异或 XOR", "XOR", "密钥词", "Key word"],
  ["Bifid", "Bifid", "密钥词", "Key word"],
  ["Trifid", "Trifid", "", ""],
  ["希尔 2×2 Hill", "Hill 2×2", "k11,k12,k21,k22", "k11,k12,k21,k22"],
  ["Base64", "Base64", "", ""],
  ["二进制 Binary", "Binary (8-bit)", "", ""]
];

for (const [zhName, enName, klz, kle] of MAP) {
  if (!s.includes("name: '" + zhName + "'")) { console.error('MISS:', zhName); continue; }
  s = s.replace("name: '" + zhName + "'", "name: '" + zhName + "', enName: '" + enName + "'");
  n++;
  if (klz !== null && klz !== '') {
    const lineRe = new RegExp("(enName: '" + enName + "'[\\s\\S]{0,160}?keyLabel: ')" + klz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(')");
    if (lineRe.test(s)) { s = s.replace(lineRe, "$1" + kle + "$2"); }
    else console.error('MISS keyLabel for', zhName);
  } else if (klz === '' && kle === '') {
    const re2 = new RegExp("(enName: '" + enName + "'[\\s\\S]{0,120}?keyLabel: )''");
    if (re2.test(s)) { s = s.replace(re2, "$1'', keyEn: ''"); n++; }
  }
}

/* autoCrack 双语 */
s = s.replace(
  "return { method: 'Hex 无匹配密钥（可尝试 XOR/Base64）', result: ct };",
  "return { method: L('Hex 无匹配密钥（可尝试 XOR/Base64）', 'Hex: no matching key found (try XOR/Base64)'), result: ct };"
);
s = s.replace(
  "note: bestShift === 0 ? '（偏移 0 = 已是明文？）' : ''",
  "note: bestShift === 0 ? L('（偏移 0 = 已是明文？）', '(shift 0 = already plaintext?)') : ''"
);
s = s.replace(
  "return { method: '未自动识别（展示凯撒最优猜测）', result: bestText, note: '可尝试上方加密模式手动试钥，或选择具体算法解密' };",
  "return { method: L('未自动识别（展示凯撒最优猜测）', 'Not recognized (showing best Caesar guess)'), result: bestText, note: L('可尝试上方加密模式手动试钥，或选择具体算法解密', 'Try manual encryption above, or pick a specific algorithm to decrypt') };"
);
s = s.replace(
  "return { method: '无法识别该密文格式', result: ct };",
  "return { method: L('无法识别该密文格式', 'Unrecognized ciphertext format'), result: ct };"
);

fs.writeFileSync(f, s, 'utf8');
console.log('done, entries touched:', n);
