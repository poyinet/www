/* 全站内容覆盖缺口分析 */
const fs = require('fs');

/* ===== 1. 术语库覆盖面 ===== */
const g = fs.readFileSync('glossary.html', 'utf8');
const terms = [...g.matchAll(/term:\s*'([^']+)'/g)].map(m => m[1]);
console.log('=== 术语库 (' + terms.length + ' 条) ===');

/* 按关键词扫描缺失的重要概念 */
const importantConcepts = [
  /* 对称密码 */
  '3DES', 'Triple DES', 'Blowfish', 'Twofish', 'Camellia', 'ARIA', 'Serpent',
  'IDEA', 'CAST', 'GOST', 'SM4',
  /* 公钥 */
  'DSA', 'ECDSA', 'EdDSA', 'Schnorr', 'ElGamal', 'Rabin', 'McEliece', 'NTRU',
  'Kyber', 'Dilithium', 'Falcon', 'SPHINCS',
  /* 哈希 */
  'SHA-3', 'Keccak', 'BLAKE', 'Whirlpool', 'RIPEMD',
  /* MAC / AEAD */
  'Poly1305', 'GMAC', 'CMAC',
  /* 协议 */
  'Station-to-Station', 'MQV', 'KEA', 'TLS 1.3', 'Noise Protocol', 'Signal',
  'Otway-Rees', 'Needham-Schroeder', 'Kerberos',
  /* 密码分析 */
  'slide attack', 'bounce attack', 'meet-in-the-middle', 'impossible differential',
  'algebraic attack', 'cube attack', 'fault injection', 'power analysis', 'SPA', 'DPA',
  'cache timing', 'Spectre', 'Meltdown',
  /* 理论 */
  'one-way function', 'trapdoor', 'hardness assumption', 'discrete log',
  'bilinear pairing', 'decisional Diffie-Hellman', 'DDH', 'CDH',
  'random oracle', 'standard model', 'simulation', 'universal composability',
  /* 应用 */
  'certificate transparency', 'HSTS', 'OCSP', 'PFS', 'DNS-over-HTTPS',
  'Signal Protocol', 'Double Ratchet', 'X3DH',
  'MPC', 'secure multi-party', 'homomorphic', 'FHE', 'BGV', 'CKKS',
  'oblivious transfer', 'garbled circuit', 'Yao',
  'zero-knowledge SNARK', 'zk-SNARK', 'Bulletproof', 'Plonk',
  /* 区块链 */
  'proof of stake', 'smart contract', 'Byzantine fault tolerance',
  /* 隐写 */
  'audio steganography', 'network steganography', 'steganalysis',
];

const missing = importantConcepts.filter(c => !g.includes(c));
const found = importantConcepts.filter(c => g.includes(c));
console.log('重要概念已覆盖:', found.length, '/', importantConcepts.length);
console.log('缺失:', missing.length ? '\n  ' + missing.join('\n  ') : '(none)');

/* ===== 2. 游戏算法覆盖 ===== */
const gamesJs = fs.readFileSync('assets/js/games.js', 'utf8');
const gameIds = [...gamesJs.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
console.log('\n=== 游戏覆盖 (' + gameIds.length + ' 款) ===');
console.log('密码破译类:', (gamesJs.match(/category:\s*'密码破译'/g) || []).length);

/* ===== 3. 编年史人物覆盖 ===== */
const stories = fs.readFileSync('assets/js/stories.js', 'utf8');
const allPeople = [...stories.matchAll(/people:\s*\[([^\]]+)\]/g)]
  .flatMap(m => m[1].split(',').map(x => x.trim().replace(/'/g, '')))
  .filter(Boolean);
const uniquePeople = [...new Set(allPeople)];
console.log('\n=== 编年史人物 (' + uniquePeople.length + ' unique) ===');

/* ===== 4. 测验覆盖 ===== */
const quiz = fs.readFileSync('assets/js/quiz.js', 'utf8');
const quizTopics = ['凯撒', '频率分析', 'Enigma', 'RSA', 'DH', 'ECC', 'AES', 'DES',
  'SHA', 'MD5', 'HMAC', 'TLS', 'BB84', '量子', '后量子', 'SM4', '国密',
  '隐写', '签名', '随机数', 'Merkle', '区块链', '零知识', '侧信道',
  '差分', '线性分析', '长度扩展', 'AEAD', 'GCM', 'CSPRNG'];
console.log('\n=== 测验覆盖 ===');
quizTopics.forEach(t => {
  const count = (quiz.match(new RegExp(t, 'gi')) || []).length;
  if (count === 0) console.log('  测验缺失:', t);
});

/* ===== 5. 协议实验室演示覆盖 ===== */
const proto = fs.readFileSync('assets/js/protocols.js', 'utf8');
const protoMeta = [...proto.matchAll(/id:\s*'(\w+)',\s*icon/g)].map(m => m[1]);
console.log('\n=== 协议实验室 (' + protoMeta.length + ' 卡) ===');
console.log('已覆盖:', protoMeta.join(', '));

/* ===== 6. 密码机覆盖 ===== */
const machine = fs.readFileSync('assets/js/machine.js', 'utf8');
const machines = [...machine.matchAll(/id:\s*'(\w+)',\s*icon/g)].map(m => m[1]);
console.log('\n=== 密码机 (' + machines.length + ' 台) ===');
console.log('已覆盖:', machines.join(', '));

/* ===== 7. 编年史术语 hover 覆盖 ===== */
const storyHtml = fs.readFileSync('story.html', 'utf8');
const glossNotesMatch = storyHtml.match(/GLOSS_NOTES\s*=\s*\{([^}]+)\}/);
if (glossNotesMatch) {
  const hoverTerms = [...glossNotesMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  console.log('\n=== 正文术语 hover (' + hoverTerms.length + ' 条) ===');
  console.log('已覆盖:', hoverTerms.join(', '));
}

/* ===== 8. 编年史各章游戏数 ===== */
const chapterGames = [...stories.matchAll(/games:\s*\[([^\]]+)\]/g)]
  .map(m => m[1].split(',').filter(x => x.trim()).length);
console.log('\n=== 各章游戏数 ===');
chapterGames.forEach((c, i) => {
  const flag = c < 3 ? ' ⚠ 薄' : c > 15 ? ' ⚠ 厚' : '';
  console.log('  c' + i + ': ' + c + ' 款' + flag);
});
