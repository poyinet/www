/* P3-1：术语表 40→60 词（追加 20 个新术语，含部分 game 联动） */
const fs = require('fs');
const path = require('path');
const F = path.join(process.cwd(), 'glossary.html');
let s = fs.readFileSync(F, 'utf8');

const NEW = [
  /* 基础概念 */
  { cat: 'basic', term: 'Decryption', zh: '解密', zhDef: '用密钥把密文还原成明文的过程。', enDef: 'Restoring plaintext from ciphertext using the key.' },
  { cat: 'basic', term: 'Encryption', zh: '加密', zhDef: '用密钥把明文变成密文的过程。', enDef: 'Turning plaintext into ciphertext using the key.' },
  { cat: 'basic', term: 'Ciphertext-only Attack', zh: '唯密文攻击', zhDef: '只凭密文本身进行破解——最难的攻击模式。', enDef: 'Breaking a cipher from the ciphertext alone — the hardest attack mode.' },
  /* 古典密码 */
  { cat: 'classical', term: 'Bifid Cipher', zh: 'Bifid 密码', zhDef: '把字母换成 5×5 方格坐标再重组的分块密码。', enDef: 'Letters become grid coordinates, then get shuffled — a blocky substitution.', game: 'bifid' },
  { cat: 'classical', term: 'Trifid Cipher', zh: 'Trifid 密码', zhDef: '3×3×3 立体分块：替换与换位的三维合流。', enDef: 'A 3×3×3 cubic block cipher mixing substitution and transposition.', game: 'trifid' },
  { cat: 'classical', term: 'Hill Cipher', zh: '希尔密码', zhDef: '用密钥矩阵对字母向量做线性变换的分组密码。', enDef: 'A block cipher multiplying letter vectors by a key matrix.', game: 'hill' },
  { cat: 'classical', term: 'Nihilist Cipher', zh: '虚无主义者密码', zhDef: '波利比奥斯坐标 + 密钥数字逐位相加的俄罗斯古典密码。', enDef: 'A Russian classical cipher: Polybius coordinates plus key digits.' },
  { cat: 'classical', term: 'One-Time Pad History', zh: '一次性密码本（史）', zhDef: '1917 年 Vernam 发明，用穿孔纸带做密钥流。', enDef: 'Invented by Vernam in 1917 using punched tape key streams.', game: 'venona' },
  /* 破译方法 */
  { cat: 'methods', term: 'Chosen-Plaintext Attack', zh: '选择明文攻击', zhDef: '攻击者能挑选明文并拿到对应密文。', enDef: 'The attacker can choose plaintext and obtain its ciphertext.' },
  { cat: 'methods', term: 'Birthday Attack', zh: '生日攻击', zhDef: '利用生日悖论在哈希/碰撞中加速搜索。', enDef: 'Exploiting the birthday paradox to speed up collision search.' },
  { cat: 'methods', term: 'Man-in-the-Middle', zh: '中间人攻击', zhDef: '攻击者同时冒充通信双方，截听或篡改信息。', enDef: 'An attacker impersonates both parties to intercept or alter traffic.' },
  { cat: 'methods', term: 'Traffic Analysis', zh: '流量分析', zhDef: '不读内容，仅凭报文数量/方向/时机推断情报。', enDef: 'Inferring intelligence from message volume, direction and timing without reading them.' },
  /* 现代密码 */
  { cat: 'modern', term: 'Symmetric Key', zh: '对称密钥', zhDef: '加密与解密用同一把密钥（如 AES、凯撒）。', enDef: 'One key encrypts and decrypts (AES, Caesar).' },
  { cat: 'modern', term: 'Asymmetric Key', zh: '非对称密钥', zhDef: '加密与解密用不同密钥（公钥/私钥）。', enDef: 'Different keys to encrypt and decrypt (public/private).' },
  { cat: 'modern', term: 'Digital Signature', zh: '数字签名', zhDef: '用私钥签名的数据，公钥可验证来源与完整性。', enDef: 'Data signed with a private key, verifiable by anyone with the public key.' },
  { cat: 'modern', term: 'Hash Function', zh: '哈希函数', zhDef: '把任意数据映射成固定长度摘要，不可逆。', enDef: 'Maps any data to a fixed-length digest; one-way.' },
  { cat: 'modern', term: 'AES', zh: 'AES 加密', zhDef: '2001 年标准化的分组密码，现代加密的事实标准。', enDef: 'The 2001-standardized block cipher, the de facto standard of modern encryption.' },
  { cat: 'modern', term: 'RSA', zh: 'RSA 算法', zhDef: '1977 年公开密钥算法，靠大数分解难题保证安全。', enDef: 'The 1977 public-key algorithm secured by the factoring problem.' },
  /* 隐写与编码 */
  { cat: 'encoding', term: 'Steganographic Image', zh: '图像隐写', zhDef: '把信息藏在像素的最低有效位等隐蔽处。', enDef: 'Hiding data in the least significant bits of pixels.' },
  { cat: 'encoding', term: 'Caesar Box', zh: '凯撒方阵', zhDef: '把明文按行写入方阵再按列读出（换位）。', enDef: 'Writing plaintext into a grid by rows, reading out by columns.' }
];

let block = '';
for (const g of NEW) {
  let line = "      { cat: '" + g.cat + "', term: '" + g.term.replace(/'/g, "\\'") + "', zh: '" + g.zh + "', zhDef: '" + g.zhDef.replace(/'/g, "\\'") + "', enDef: '" + g.enDef.replace(/'/g, "\\'") + "'" +
    (g.game ? ", game: '" + g.game + "'" : '') + ' },';
  block += line + '\n';
}

const anchor = "      { cat: 'encoding', term: 'Polybius Square'";
const i = s.indexOf(anchor);
if (i < 0) { console.log('❌ 未找到插入锚点'); process.exit(1); }
// 找到该行结尾的 '},' 后插入
const lineEnd = s.indexOf('\n', i);
s = s.slice(0, lineEnd + 1) + block + s.slice(lineEnd + 1);
fs.writeFileSync(F, s);
console.log('✓ 已追加 ' + NEW.length + ' 个术语');
