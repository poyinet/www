/* protocols.html meta 九→十一（带验证）+ i18n-ui pl.sub */
const fs = require('fs');
let fail = 0;
function rep(f, from, to, tag) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) { console.error('✗ 未命中: ' + tag + ' @ ' + f); fail++; return; }
  t = t.split(from).join(to);
  fs.writeFileSync(f, t);
  console.log('✓ ' + tag);
}
const H = 'protocols.html';
rep(H, '九大交互演示', '十一大交互演示', 'meta 九大→十一大');
rep(H, '九堂交互课', '十一堂交互课', 'meta 九堂→十一堂');
rep(H, '零知识证明、ChaCha20、ECC 点加法、A5/1、RC4 警示录、口令破解成本——十一大交互演示。',
    '零知识证明、ChaCha20、ECC 点加法、A5/1、RC4 警示录、数字签名、随机数、口令破解成本——十一大交互演示。', 'ld+json 列表');
rep(H, 'ECC 几何 / A5/1 / RC4 / 口令成本——十一大交互演示。',
    'ECC 几何 / A5/1 / RC4 / 数字签名 / 随机数 / 口令成本——十一大交互演示。', 'og 列表');
rep(H, 'ECC 几何 / 口令成本——十一大交互演示。',
    'ECC 几何 / 数字签名 / 随机数 / 口令成本——十一大交互演示。', 'twitter 列表');
rep('assets/js/core/i18n-ui.js', '现代密码学的九堂交互课', '现代密码学的十一堂交互课', 'ui pl.sub zh');
rep('assets/js/core/i18n-ui.js', 'nine interactive lessons in modern crypto', 'eleven interactive lessons in modern crypto', 'ui pl.sub en');
rep('assets/js/core/i18n-ui.js', "d.zh['pl.rc4H'] = 'RC4 警示录：密钥流绝不能用两次';\n  d.en['pl.rc4H'] = 'RC4 Cautionary Tale: never reuse a keystream';",
    "d.zh['pl.rc4H'] = 'RC4 警示录：密钥流绝不能用两次';\n  d.en['pl.rc4H'] = 'RC4 Cautionary Tale: never reuse a keystream';\n  d.zh['pl.signH'] = '数字签名：把 RSA 倒过来用';\n  d.en['pl.signH'] = 'Digital Signatures: RSA used in reverse';\n  d.zh['pl.rngH'] = '随机数：密码学的地基';\n  d.en['pl.rngH'] = 'Randomness: the foundation of cryptography';", 'ui 新卡标题键');
process.exit(fail ? 1 : 0);
