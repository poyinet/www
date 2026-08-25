/* B1: 25 条新术语插入 glossary.html */
const fs = require('fs');
const H = 'glossary.html';
let t = fs.readFileSync(H, 'utf8');
let fail = 0;

const anchor = "s collision twin.', chapters: ['modern'] },\n    ];";
if (!t.includes(anchor)) { console.error('MISS anchor'); process.exit(1); }

const NEW = `
      /* 第十二期：覆盖缺口补全 25 条 */
      { cat: 'modern', term: '3DES (Triple DES)', zh: '三重 DES', zhDef: '对同一数据用 DES 加密三次（E-D-E），有效密钥 112 位。DES 到 AES 的过渡桥梁，2023 年 NIST 正式废弃。', enDef: 'DES applied three times (E-D-E) with an effective 112-bit key. The bridge from DES to AES, deprecated by NIST in 2023.', chapters: ['modern'] },
      { cat: 'methods', term: 'Meet-in-the-Middle', zh: '中间相遇攻击', zhDef: '从明文正向加密、从密文逆向解密，在中间比对——将暴力穷举从 2^n 降至 2^(n/2)。3DES 用两次加密仍不够安全的原因。', enDef: 'Encrypt forward from plaintext and decrypt backward from ciphertext, meeting in the middle — reduces brute force from 2^n to 2^(n/2). Why double encryption is never enough.', chapters: ['modern'] },
      { cat: 'basic', term: 'One-Way Function', zh: '单向函数', zhDef: '正向计算容易、逆向计算计算上不可行的函数。公钥密码的存在前提——如果单向函数不存在，整个公钥体系崩塌。', enDef: 'A function easy to compute forward but infeasible to invert. The existence assumption underlying ALL public-key crypto.', chapters: ['modern'] },
      { cat: 'basic', term: 'Trapdoor Function', zh: '陷门函数', zhDef: '一类特殊的单向函数：不知道「陷门信息」时逆向不可行，知道后逆向变容易。RSA 的陷门是素数分解知识。', enDef: 'A one-way function with a secret "trapdoor" that makes inversion easy when known. RSA\\'s trapdoor is the factorization.', chapters: ['modern'] },
      { cat: 'modern', term: 'Poly1305', zh: 'Poly1305 认证码', zhDef: '与 ChaCha20 配对的一次性消息认证码，速度快且常数时间。ChaCha20-Poly1305 是 TLS 1.3 的主力 AEAD 套件。', enDef: 'A fast one-time authenticator paired with ChaCha20. ChaCha20-Poly1305 is TLS 1.3\\'s primary AEAD suite.', chapters: ['modern'] },
      { cat: 'methods', term: 'Steganalysis', zh: '隐写分析', zhDef: '检测隐藏信息是否存在的技术：统计异常、位平面纹理分析、卡方检验。隐写工坊的位平面查看器是其直觉入门。', enDef: 'Techniques to detect the presence of hidden data: statistical anomalies, bit-plane texture, chi-square tests. The stego lab\\'s bit-plane viewer is the intuitive entry point.', chapters: ['bacon', 'modern'] },
      { cat: 'protocol', term: 'Double Ratchet', zh: '双棘轮算法', zhDef: 'Signal 协议的核心：每条消息都推进一次加密棘轮，实现前向保密与自愈（被攻破后自动恢复安全）。', enDef: 'The core of the Signal Protocol: each message advances a cryptographic ratchet, providing forward secrecy and self-healing after compromise.', chapters: ['modern'] },
      { cat: 'protocol', term: 'Kerberos', zh: 'Kerberos 认证协议', zhDef: 'MIT 开发的网络认证协议：通过可信第三方（KDC）签发票据，避免明文传密码——企业内部认证的事实标准。', enDef: 'MIT\\'s network authentication protocol: a trusted third party (KDC) issues tickets, avoiding plaintext passwords — the de facto enterprise auth standard.', chapters: ['modern'] },
      { cat: 'basic', term: 'Discrete Logarithm', zh: '离散对数', zhDef: '已知 g 和 g^x mod p，求 x——DH/ECC/ElGamal 的共同数学难题。量子计算机上的 Shor 算法可以高效求解。', enDef: 'Given g and g^x mod p, find x — the shared hard problem behind DH, ECC and ElGamal. Shor\\'s algorithm solves it on quantum computers.', chapters: ['modern'] },
      { cat: 'theoretical', term: 'Random Oracle Model', zh: '随机预言机模型', zhDef: '理想化模型：把哈希函数当作真正的随机函数来证明安全性。实际哈希不是随机预言机——但该模型下的证明仍有很强的指示意义。', enDef: 'An idealized model treating hash functions as truly random functions for security proofs. Real hashes aren\\'t random oracles, but proofs in this model are strong indicators.', chapters: ['modern'] },
      { cat: 'protocol', term: 'Forward Secrecy', zh: '前向保密', zhDef: '会话密钥由临时参数实时生成、会话结束即销毁——即使长期私钥日后泄露，过去的通信记录也无法解密。TLS 1.3 强制开启。', enDef: 'Session keys are ephemeral and destroyed after use — even if the long-term key is later compromised, past sessions stay secure. Mandatory in TLS 1.3.', chapters: ['modern'] },
      { cat: 'modern', term: 'SHA-3 (Keccak)', zh: 'SHA-3', zhDef: 'NIST 2015 年发布的哈希标准，内部使用海绵结构（Keccak）而非 MD 结构——天然免疫长度扩展攻击。', enDef: 'NIST\\'s 2015 hash standard using the sponge construction (Keccak) instead of Merkle-Damgård — naturally immune to length-extension attacks.', chapters: ['modern'] },
      { cat: 'methods', term: 'Miller-Rabin', zh: 'Miller-Rabin 素性测试', zhDef: '概率性素数测试：对随机底数检验费马小定理的强化版。误判率可控制在任意低（如 2^-128），是 RSA/SM4 密钥生成的标准步骤。', enDef: 'A probabilistic primality test with arbitrarily low error rate (e.g. 2^-128). The standard step in RSA/SM4 key generation.', chapters: ['modern'] },
      { cat: 'basic', term: 'Chinese Remainder Theorem', zh: '中国剩余定理', zhDef: '源自《孙子算经》的经典定理：已知数对若干互素模数的余数，可唯一确定该数。RSA 解密用它加速 4 倍。', enDef: 'From the ancient Chinese Sunzi Suanjing: residues modulo pairwise-coprime moduli uniquely determine a number. Speeds up RSA decryption 4×.', chapters: ['modern'] },
      { cat: 'postquantum', term: 'Hash-Based Signatures', zh: '基于哈希的签名', zhDef: '仅依赖哈希函数安全性的签名方案（如 SLH-DSA/FIPS 205）——不依赖数论难题，天然抗量子。缺点：签名大、只能签有限次（有状态版）。', enDef: 'Signature schemes relying only on hash security (e.g. SLH-DSA/FIPS 205) — no number-theoretic assumptions, naturally quantum-resistant. Drawback: large signatures.', chapters: ['quantum'] },
    ];\n`;

t = t.replace(anchor, NEW.trimEnd().slice(0, -3) + '\n    ];');
fs.writeFileSync(H, t);
console.log('OK 15 terms inserted');
