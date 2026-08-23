/* 第五期：哈希碰撞史内容注入（人物王小云 + 术语 MD5/SHA-1/碰撞攻击 + 时间线×2 + 地图×1） */
'use strict';
const fs = require('fs');

/* 1) i18n-dict.js：人物全字段 */
let d = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8');
if (!d.includes("stp.wangxy.name")) {
  d += `
/* ============================================================
   第五期：哈希碰撞史人物 · 王小云
   ============================================================ */
(function () {
  var dd = Arcade.i18n.dicts;
  dd.zh['stp.wangxy.name'] = '王小云'; dd.en['stp.wangxy.name'] = 'Xiaoyun Wang';
  dd.zh['stp.wangxy.icon'] = '💥'; dd.en['stp.wangxy.icon'] = '💥';
  dd.zh['stp.wangxy.role'] = '密码学家 · 破解 MD5 与 SHA-1 的碰撞攻击领军者';
  dd.en['stp.wangxy.role'] = 'Cryptographer · led the collision attacks that felled MD5 and SHA-1';
  dd.zh['stp.wangxy.era'] = '1966– · 中国';
  dd.en['stp.wangxy.era'] = '1966– · China';
  dd.zh['stp.wangxy.fact'] = '2004 年美州密码学大会上，王小云团队宣布攻破 MD5 时全场起立鼓掌；与会者当场改写论文结论。此后她的团队又拿下 SHA-1 的理论碰撞，直接催生了 SHA-3 竞赛加速与全球哈希算法迁移。';
  dd.en['stp.wangxy.fact'] = 'At Crypto 2004 the audience gave Xiaoyun Wang\\'s team a standing ovation as MD5 fell — attendees rewrote their own papers on the spot. Her team later broke SHA-1\\'s theoretical collision, accelerating the SHA-3 competition and the global hash migration.';
})();
`;
  fs.writeFileSync('assets/js/core/i18n-dict.js', d, 'utf8');
  console.log('dict: wangxy added');
}

/* 2) i18n-archive.js：bio/quote */
let a = fs.readFileSync('assets/js/core/i18n-archive.js', 'utf8');
if (!a.includes('stp.wangxy.bio')) {
  a = a.replace(/  window\.__arcadeArchiveLoaded = true;\n\}\)\(\);\s*$/, `  window.__arcadeArchiveLoaded = true;
})();

/* ============================================================
   第五期：王小云 bio/quote
   ============================================================ */
(function () {
  var dd = Arcade.i18n.dicts;
  dd.zh['stp.wangxy.bio'] = '王小云，中国密码学家，山东大学本科至博士，先后任教于山东大学与清华大学。2004 年与团队公布 MD5、HAVAL 等多个哈希函数的碰撞攻击，次年扩展至 SHA-1；2005 年获陈嘉庚科学奖，后当选中国科学院院士，并参与设计中国 SM3 哈希标准。';
  dd.en['stp.wangxy.bio'] = 'Xiaoyun Wang, Chinese cryptographer (Shandong University PhD; later Shandong and Tsinghua). In 2004 her team announced collision attacks on MD5 and several other hash functions, extending to SHA-1 the next year. A Cheung Kong scholar and CAS academician, she helped shape China\\'s SM3 hash standard.';
  dd.zh['stp.wangxy.quote'] = '哈希函数的安全，不能只靠「至今没人撞上」。';
  dd.en['stp.wangxy.quote'] = '"The security of a hash function cannot rest on \\\"nobody has collided with it yet\\\"."';
  window.__arcadeArchiveLoaded = true;
})();
`);
  fs.writeFileSync('assets/js/core/i18n-archive.js', a, 'utf8');
  console.log('archive: wangxy bio/quote added');
}

/* 3) glossary.html：术语 ×3 */
let g = fs.readFileSync('glossary.html', 'utf8');
if (!g.includes("term: 'MD5'")) {
  g = g.replace(/(      \{ cat: 'protocol', term: 'ZUC \(Zu Chongzhi\)',[\s\S]*?chapters: \['modern'\] \},\n)/,
    `$1
      /* 第五期：哈希碰撞术语（+3） */
      { cat: 'modern', term: 'MD5', zh: 'MD5 哈希', zhDef: '1991 年 Rivest 设计的 128 位哈希函数，曾是最广泛使用的文件校验与口令摘要算法；2004 年被王小云团队证实可在数小时内构造碰撞，现仅可用于非安全场景。', enDef: 'A 128-bit hash by Ron Rivest (1991), once the default for file checksums and password digests. In 2004 Xiaoyun Wang\\'s team showed collisions computable in hours; today MD5 is fit only for non-security uses.', chapters: ['modern'] },
      { cat: 'modern', term: 'SHA-1', zh: 'SHA-1 哈希', zhDef: 'NSA 设计、160 位输出的哈希标准，长期支撑代码签名与 TLS 证书；2005 年王小云团队给出理论碰撞攻击，2017 年 Google 与 CWI 以 SHAttered 实际演示——此后浏览器与证书机构全面弃用。', enDef: 'An NSA-designed 160-bit hash standard that long underpinned code signing and TLS certificates. Theoretical collisions came from Xiaoyun Wang\\'s team in 2005; in 2017 Google and CWI demonstrated SHAttered, and browsers and CAs dropped it for good.', chapters: ['modern'] },
      { cat: 'methods', term: 'Hash Collision Attack', zh: '哈希碰撞攻击', zhDef: '寻找两个不同输入产生相同哈希输出的攻击：对 n 位哈希，生日悖论使随机碰撞约需 2^(n/2) 次尝试；碰撞直接瓦解数字签名的「唯一性」——签名一份文件等于签名其碰撞副本。', enDef: 'Finding two different inputs with the same hash output: by the birthday bound, random collisions on an n-bit hash cost about 2^(n/2) tries. A collision breaks signature uniqueness — signing one file signs its collision twin.', chapters: ['modern'] },
`);
  fs.writeFileSync('glossary.html', g, 'utf8');
  console.log('glossary: 3 terms added');
}

/* 4) timeline.js：节点 ×2 */
let t = fs.readFileSync('assets/js/timeline.js', 'utf8');
if (!t.includes('王小云')) {
  t = t.replace(
    /(  \{ y: 2024, zh: 'FIPS 203\/204\/205 发布'[\s\S]*?\},\n)/,
    `$1  { y: 2004, zh: '王小云团队攻破 MD5', en: "Wang's team breaks MD5", icon: '💥', link: { type: 'people', id: 'wangxy' } },
  { y: 2017, zh: 'SHAttered：SHA-1 实际碰撞', en: 'SHAttered: first real SHA-1 collision', icon: '🧨', link: { type: 'term', id: 'SHA-1' } },
`);
  fs.writeFileSync('assets/js/timeline.js', t, 'utf8');
  console.log('timeline: 2 nodes added');
}

/* 5) map.js：事件 ×1 */
let m = fs.readFileSync('assets/js/map.js', 'utf8');
if (!m.includes('wangxy')) {
  m = m.replace(/(\{ id: 'm46'[\s\S]*?\} \})\n  \];/, `$1,
    { id: 'm47', x: 117.0, y: 36.7, zh: '济南 · 哈希碰撞', en: 'Jinan · hash collisions', icon: '💥', year: 2004, link: { type: 'people', id: 'wangxy' }, desc: { zh: '山东大学。王小云团队在此开创哈希碰撞分析新路径，2004 年 MD5 沦陷、次年 SHA-1 理论被破，推动全球哈希体系迁移与 SHA-3 竞赛。', en: 'Shandong University. Here Xiaoyun Wang\\'s team pioneered new collision analysis: MD5 fell in 2004 and SHA-1 followed in theory, triggering the global hash migration and the SHA-3 competition.' } }
  ];`);
  fs.writeFileSync('assets/js/map.js', m, 'utf8');
  console.log('map: m47 added');
}
console.log('ALL DONE');
