/* B1b: 10 条中等价值术语 */
const fs = require('fs');
const H = 'glossary.html';
let t = fs.readFileSync(H, 'utf8');
const anchor = "chapters: ['quantum'] },\n    ];";
if (!t.includes(anchor)) { console.error('MISS'); process.exit(1); }
const NEW = `
      { cat: 'modern', term: 'Blowfish / Twofish', zh: 'Blowfish 与 Twofish', zhDef: 'Bruce Schneier 设计的两代分组密码：Blowfish（1993）快速免费，Twofish（1998）AES 决赛入围。均未被攻破但未成为标准。', enDef: 'Bruce Schneier\\'s two block ciphers: Blowfish (1993) fast and free, Twofish (1998) an AES finalist. Neither broken, neither standard.', chapters: ['modern'] },
      { cat: 'modern', term: 'Camellia', zh: 'Camellia', zhDef: '日本三菱与 NTT 联合设计的 128 位分组密码，2005 年入选 ISO/IEC 标准，安全性等同 AES。', enDef: 'A 128-bit block cipher by Mitsubishi and NTT, standardized as ISO/IEC 18033-3 in 2005. Security equivalent to AES.', chapters: ['modern'] },
      { cat: 'modern', term: 'ElGamal', zh: 'ElGamal 加密', zhDef: 'Taher ElGamal 1985 年提出的公钥加密：基于离散对数难题，是 DH 密钥交换的直接加密化延伸。', enDef: 'Taher ElGamal\\'s 1985 public-key encryption: based on discrete logarithms, a direct encryption extension of DH key exchange.', chapters: ['modern'] },
      { cat: 'modern', term: 'DSA', zh: '数字签名算法 (DSA)', zhDef: 'NIST 1994 年发布的美国联邦数字签名标准（FIPS 186），基于离散对数——签名比 RSA 快但验证慢。', enDef: 'NIST\\'s 1994 Federal Digital Signature Standard (FIPS 186), based on discrete logarithms — faster signing than RSA but slower verification.', chapters: ['modern'] },
      { cat: 'postquantum', term: 'McEliece', zh: 'McEliece 密码', zhDef: 'Robert McEliece 1978 年提出的基于纠错码的公钥密码——50 年未被攻破，但公钥巨大。NIST 后量子候选。', enDef: 'Robert McEliece\\'s 1978 code-based public-key crypto — unbroken for 50 years but with huge keys. A NIST post-quantum candidate.', chapters: ['modern'] },
      { cat: 'postquantum', term: 'Falcon', zh: 'Falcon 签名', zhDef: '基于格的紧凑后量子签名算法，NIST 后量子签名候选——签名比 Dilithium 小但实现更复杂（需浮点运算）。', enDef: 'A compact lattice-based post-quantum signature, a NIST candidate — smaller signatures than Dilithium but harder to implement (floating-point).', chapters: ['quantum'] },
      { cat: 'methods', term: 'Power Analysis', zh: '功耗分析', zhDef: '通过测量芯片加密时的功耗波动来推测密钥的侧信道攻击——简单功耗分析(SPA)直接读波形，差分功耗分析(DPA)用统计提取。', enDef: 'Side-channel attacks measuring chip power fluctuations during encryption to deduce keys — SPA reads waveforms directly, DPA uses statistics.', chapters: ['modern'] },
      { cat: 'protocol', term: 'Needham-Schroeder', zh: 'Needham-Schroeder 协议', zhDef: '1978 年提出的认证协议，是 Kerberos 的理论基础——但原始版本因缺少旧密钥标识而被攻破（Lowe 1995 修正）。', enDef: 'A 1978 authentication protocol, the theoretical basis for Kerberos — the original was broken (Lowe 1995) due to a missing key-identity field.', chapters: ['modern'] },
      { cat: 'theoretical', term: 'Bilinear Pairing', zh: '双线性配对', zhDef: '椭圆曲线上的特殊映射 e(P,Q)，满足 e(aP,bQ)=e(P,Q)^(ab)——基于配对的密码学（BLS 签名等）的数学基础。', enDef: 'A special elliptic-curve map e(P,Q) satisfying e(aP,bQ)=e(P,Q)^(ab) — the mathematical basis of pairing-based crypto (BLS signatures).', chapters: ['modern'] },
      { cat: 'theoretical', term: 'Oblivious Transfer', zh: '不经意传输', zhDef: '发送方发出多条消息，接收方只能读取其中一条且发送方不知其选了哪条——MPC 的基础原语（Rabin 1981）。', enDef: 'Sender offers multiple messages; receiver reads exactly one, sender never knows which. The foundational primitive of MPC (Rabin 1981).', chapters: ['modern'] },
    ];\n`;
t = t.replace(anchor, NEW.trimEnd().slice(0, -3) + '\n    ];');
fs.writeFileSync(H, t);
console.log('OK 10 more terms');
