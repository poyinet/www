/* E2 注入 concept v3：锚点 = 每章 challenge/demo 字段（章节级），在其后插 concept */
const fs = require('fs');
let s = fs.readFileSync('assets/js/stories.js', 'utf8');

const CONCEPTS = {
  dawn: { ic: '🗿', zh: '符号解码：同一内容用不同符号系统编码，找到对应规则即破译', en: 'Symbol decoding: one message in different scripts; find the mapping rules' },
  caesar: { ic: '🔤', zh: '移位替换：字母表整体平移固定位数', en: 'Shift substitution: the alphabet slides by a fixed number' },
  arab: { ic: '📊', zh: '频率分析：统计字母出现次数，对照语言自然规律', en: 'Frequency analysis: count letter occurrences, match language norms' },
  bacon: { ic: '🖋️', zh: '双字体隐写：两种字形编码 5 位 A/B 二进制', en: 'Biliteral steganography: two typefaces encode 5-bit A/B binary' },
  ww1: { ic: '📡', zh: '替换+换位：方阵替换叠密钥列换位（ADFGVX）', en: 'Substitution + transposition: Polybius plus keyed columnar' },
  bletchley: { ic: '⚙️', zh: '机器密码学：转子机 Enigma + 已知明文攻击（Bombe）', en: 'Machine ciphers: Enigma rotors + known-plaintext attack (Bombe)' },
  midway: { ic: '🌊', zh: '深度破译：同日电文共享加表，相减抵消密钥', en: 'Depth: same-day messages share the additive; subtract to cancel' },
  purple: { ic: '🇯🇵', zh: '步进开关机：无转子，开关矩阵做双路置换', en: 'Stepping-switch machine: no rotors, matrix twin-path permutation' },
  lorenz: { ic: '💾', zh: '异或密钥流：明文 ⊕ 密钥 = 密文，差分统计破译', en: 'XOR keystream: plaintext ⊕ key = ciphertext; delta statistics' },
  venona: { ic: '🕸️', zh: '密钥复用灾难：一次性密码本被重复使用即破', en: 'Key-reuse disaster: a one-time pad used twice is broken' },
  modern: { ic: '🔐', zh: '信息论与公钥：熵、完美保密、异或原子与 RSA', en: 'Information theory & public key: entropy, secrecy, XOR, RSA' }
};

let n = 0;
for (const [chId, c] of Object.entries(CONCEPTS)) {
  const startMark = "{ id: '" + chId + "',";
  const i = s.indexOf(startMark);
  if (i < 0) { console.log('✗ 未找到 ' + chId); continue; }
  /* 找该章节的 challenge: 'xxx' 字段位置（第一处） */
  const chMatch = s.slice(i, i + 1500).match(/challenge: '[a-z0-9-]+'/);
  if (!chMatch) { console.log('✗ ' + chId + ' 无 challenge'); continue; }
  const pos = i + chMatch.index + chMatch[0].length;
  if (s.slice(pos, pos + 12).includes('concept:')) { console.log('跳过 ' + chId); continue; }
  const insert = ", concept: { ic: '" + c.ic + "', zh: '" + c.zh.replace(/'/g, "\\'") + "', en: '" + c.en.replace(/'/g, "\\'") + "' }";
  s = s.slice(0, pos) + insert + s.slice(pos);
  n++;
}
fs.writeFileSync('assets/js/stories.js', s);
console.log('✓ 注入 ' + n + ' 章 concept');
