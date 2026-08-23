/* 第六期批次一 #6：modern 章（c10）正文增补 MD5/SHA-1 碰撞史段落（王小云正文化）
 * 锚点插入，幂等保护；先备份再写入；完成后 node --check 验证。
 */
const fs = require('fs');
const path = 'assets/js/core/i18n-story.js';
const src = fs.readFileSync(path, 'utf8');

const ZH_ANCHOR = '属于每一个普通人。\\n\\n而今，天平的两端';
const EN_ANCHOR = 'strong encryption belongs to everyone.\\n\\nNow both sides of the scale';

const ZH_NEW = '保密之外，密码学还有另一半使命——「验明正身」。哈希函数把任意长度的输入压成一串定长「指纹」，改动一个比特，指纹就面目全非；文件校验、软件签名、数字证书，都靠它把关。MD5 与 SHA-1 曾是这条防线上的两根台柱。2004 年，山东大学的[[wangxy]]在国际密码学会议上投下一枚重磅炸弹：她的团队找到了 MD5 的「碰撞」——两个内容不同的文件，可以拥有同一枚指纹；次年，SHA-1 的攻击路径也被摆上台面。整个行业用了十几年才消化完这场地震：2017 年，谷歌与阿姆斯特丹自由大学动用约六千五百个 CPU 年的算力，当众演示了 SHA-1 的第一次真实碰撞（SHAttered），各大浏览器随即停用 SHA-1 证书，全球系统陆续迁移到 SHA-256。这一战给教科书添了一条铁律：「尚未被攻破」从来不是安全证明——一种哈希函数的寿命，从设计那天起就在倒数。';
const EN_NEW = 'Beyond secrecy, cryptography has a second job — proving authenticity. A hash function squeezes input of any length into a fixed-length fingerprint: flip one bit and the fingerprint turns unrecognizable. File checksums, software signatures and digital certificates all lean on it. MD5 and SHA-1 were the twin pillars of that line — until 2004, when [[wangxy]] of Shandong University dropped a bombshell at the International Cryptology Conference: her team had found collisions in MD5 — two different files sharing one identical fingerprint; within a year an attack path against SHA-1 was on the table too. The industry spent over a decade absorbing the earthquake: in 2017, Google and CWI Amsterdam burned roughly 6,500 CPU-years of computation to demonstrate the first real SHA-1 collision in public (SHAttered); browsers promptly retired SHA-1 certificates, and systems worldwide migrated to SHA-256. The campaign added an iron maxim to the textbooks: "not yet broken" has never been proof of security — the lifetime of a hash function counts down from the day it is designed.';

function count(hay, needle) { return hay.split(needle).length - 1; }

if (src.includes(ZH_NEW.slice(0, 40))) { console.log('已包含新段落，跳过（幂等）'); process.exit(0); }
if (count(src, ZH_ANCHOR) !== 1) { console.error('✗ zh 锚点非唯一或缺失:', count(src, ZH_ANCHOR)); process.exit(1); }
if (count(src, EN_ANCHOR) !== 1) { console.error('✗ en 锚点非唯一或缺失:', count(src, EN_ANCHOR)); process.exit(1); }

fs.writeFileSync(path + '.bak-r6', src);
let out = src;
out = out.replace(ZH_ANCHOR, '属于每一个普通人。\\n\\n' + ZH_NEW + '\\n\\n而今，天平的两端');
out = out.replace(EN_ANCHOR, 'strong encryption belongs to everyone.\\n\\n' + EN_NEW + '\\n\\nNow both sides of the scale');
fs.writeFileSync(path, out);

const chk = fs.readFileSync(path, 'utf8');
console.log('✓ zh 段落插入:', chk.includes('SHAttered') && chk.includes('[[wangxy]]'));
console.log('✓ 备份:', path + '.bak-r6');
