/* 写入 8 位新人物文案（D2）到 i18n-dict.js */
const fs = require('fs');
const path = require('path');
const F = path.join(process.cwd(), 'assets/js/core/i18n-dict.js');
let s = fs.readFileSync(F, 'utf8');

const P = [
  { id: 'vernam', nameZh: '吉尔伯特·弗纳姆', nameEn: 'Gilbert Vernam', icon: '🎞️', roleZh: '一次性密码本（OTP）的发明者', roleEn: 'Inventor of the one-time pad (OTP)', eraZh: '1890–1960 · 美国', eraEn: '1890–1960 · USA',
    bioZh: '吉尔伯特·弗纳姆是 AT&T 的通信工程师。1917 年，为解决电报加密问题，他发明了用穿孔纸带作为密钥流的一次性密码本体制：密钥与明文等长、随机且只用一次。这一体制至今仍是唯一被数学证明绝对不可破解的密码，香农在 1949 年用信息论给出了严格证明。弗纳姆的发明源于日常工程难题，却奠定了现代加密的理论基石。',
    bioEn: 'Gilbert Vernam was an engineer at AT&T. In 1917 he invented the one-time pad, a cipher in which a random key as long as the plaintext, punched on paper tape, is used exactly once. It gained its true stature in 1949, when Claude Shannon proved with information theory that it is absolutely unbreakable — the only cipher with a mathematical proof of perfect security.',
    quoteZh: '密码的安全不在于算法有多复杂，而在于密钥是否真正随机且永不复用。', quoteEn: 'A cipher\'s security lies not in its complexity, but in a key that is truly random and never reused.',
    factZh: '弗纳姆的专利 1919 年才获批，但真正让一次性密码本扬名的是冷战间谍案：苏联克格勃因重复复制密钥本，「维诺娜计划」得以破译部分密文——密钥只要复用一次，完美保密便不复存在。',
    factEn: 'Vernam\'s patent was granted in 1919, but the OTP became famous during the Cold War: Soviet spies reused duplicated key books, which is exactly what let the U.S. VENONA project crack part of their traffic.' },
  { id: 'kasiski', nameZh: '弗里德里希·卡西斯基', nameEn: 'Friedrich Kasiski', icon: '🔍', roleZh: '维吉尼亚密码的系统破译者', roleEn: 'Systematic breaker of the Vigenère cipher', eraZh: '1805–1881 · 普鲁士', eraEn: '1805–1881 · Prussia',
    bioZh: '弗里德里希·卡西斯基是普鲁士军队的一名步兵军官，密码学只是他的业余爱好。1863 年，他发表了《密文的破译》一书，提出「卡西斯基检验法」：在密文中寻找重复出现的片段，用其间隔的最大公约数推算维吉尼亚密码的密钥长度，从而系统性地破译了这部曾被称为「不可破译的密码」的体制。',
    bioEn: 'Friedrich Kasiski was an infantry officer in the Prussian army for whom cryptography was a hobby. In 1863 he published a book on cryptanalysis introducing the Kasiski examination: by locating repeated fragments and taking the GCD of their distances, an analyst can deduce the key length of a Vigenère cipher, after which the whole scheme falls apart.',
    quoteZh: '世间没有不可破译的密码，只有尚未被找到的规律。', quoteEn: 'No cipher is truly undecipherable — only a pattern not yet found.',
    factZh: '卡西斯基检验法背后藏着一桩著名「错案」：英国人查尔斯·巴贝奇早在 1854 年就破译了维吉尼亚密码，却因保密要求从未公开，功劳最终记在了晚九年发表的卡西斯基头上。',
    factEn: 'Behind the Kasiski examination lies one of cryptology\'s great ironies: Charles Babbage broke the Vigenère in 1854 but was sworn to secrecy, so the credit went to Kasiski, who published nine years later.' },
  { id: 'rejewski', nameZh: '马里安·雷耶夫斯基', nameEn: 'Marian Rejewski', icon: '🧮', roleZh: 'Enigma 的首位破译者', roleEn: 'First breaker of the Enigma machine', eraZh: '1905–1980 · 波兰', eraEn: '1905–1980 · Poland',
    bioZh: '马里安·雷耶夫斯基是波兰数学家，1932 年在华沙密码局开始了对德军 Enigma 密码机的数学研究。凭借从法国情报部门获得的密钥交换文档，他利用置换群理论重建了 Enigma 的内部接线，在计算机问世之前就用纯数学方法实现了首次破译，比英国的图灵早了整整七年。他的成果经波兰密码局转交盟军，成为布莱切利园破译 Enigma 的关键起点。',
    bioEn: 'Marian Rejewski was a Polish mathematician who in 1932 took on the German Enigma machine. Using key-setting documents obtained through French intelligence, he applied permutation group theory to reconstruct the machine\'s internal rotor wiring and, with pure mathematics and no computer, achieved the first genuine break of Enigma — seven years before Turing.',
    quoteZh: '破译机器密码，靠的不是更快的机器，而是更深的数学。', quoteEn: 'Breaking a machine cipher requires not a faster machine, but deeper mathematics.',
    factZh: '战后雷耶夫斯基在波兰从事会计工作，身份长期保密；直到 1970 年代军方史学家公布档案，世界才得知 Enigma 的首位破译者并非图灵，而是这位隐居多年的数学家。',
    factEn: 'After the war Rejewski worked as a bookkeeper, his role secret for decades; only in the 1970s did the archives reveal he, not Turing, first broke Enigma.' },
  { id: 'diffie', nameZh: '惠特菲尔德·迪菲', nameEn: 'Whitfield Diffie', icon: '🔑', roleZh: '公钥密码学之父', roleEn: 'Father of public-key cryptography', eraZh: '1944– · 美国', eraEn: '1944– · USA',
    bioZh: '惠特菲尔德·迪菲是美国密码学家。1976 年，他与斯坦福同事马丁·赫尔曼发表《密码学的新方向》，提出 Diffie-Hellman 密钥交换：双方在公开信道交换信息即可协商出共享密钥，无需事先秘密约定。这篇论文宣告公钥密码学的诞生，颠覆了「密钥必须秘密传递」的千年铁律，也启发了 RSA 等后续方案。2015 年他荣获图灵奖。',
    bioEn: 'Whitfield Diffie is an American cryptographer. In 1976, with Martin Hellman, he published "New Directions in Cryptography," introducing the Diffie-Hellman key exchange: two parties can agree on a shared secret over a public channel with no prior private arrangement. The paper gave birth to public-key cryptography. He received the 2015 Turing Award.',
    quoteZh: '密码学的目标，是让陌生人也能在公开的世界里安全地共享秘密。', quoteEn: 'The goal of cryptography is to let strangers share secrets securely in a public world.',
    factZh: 'Diffie-Hellman 的专利 1977 年获批、20 年后到期；专利到期后学界才发现，英国 GCHQ 的詹姆斯·埃利斯早在 1969 年就秘密发明了同样思想，却因保密从未发表。',
    factEn: 'Only after the Diffie-Hellman patent expired did the world learn that GCHQ\'s James Ellis had secretly invented the same idea in 1969 but never published it.' },
  { id: 'shamir', nameZh: '阿迪·萨莫尔', nameEn: 'Adi Shamir', icon: '🔏', roleZh: 'RSA 算法共同发明人', roleEn: 'Co-inventor of RSA', eraZh: '1952– · 以色列', eraEn: '1952– · Israel',
    bioZh: '阿迪·萨莫尔是以色列密码学家。1977 年，他在 MIT 与罗纳德·李维斯特、伦纳德·阿德曼合作，共同发明了 RSA 公钥加密算法——世界上第一个实用的公钥密码体制，至今仍是互联网加密传输的基石。萨莫尔还提出了「萨莫尔秘密共享方案」，2017 年与两位合作者一起荣获图灵奖。',
    bioEn: 'Adi Shamir is an Israeli cryptographer. In 1977, at MIT with Ronald Rivest and Leonard Adleman, he co-invented RSA, the world\'s first practical public-key cryptosystem. He also devised the celebrated secret-sharing scheme that bears his name. He shared the 2017 Turing Award with his RSA co-inventors.',
    quoteZh: 'RSA 的诞生说明，数学中「难解的问题」正是密码学最珍贵的原料。', quoteEn: 'RSA shows that mathematics\' hard problems are cryptography\'s most precious raw material.',
    factZh: 'RSA 三个字母并非算法含义，而是三位发明人姓氏首字母——Rivest、Shamir、Adleman，字母顺序恰好按姓氏排列，纯属巧合，却成了密码学史上最著名的命名轶事。',
    factEn: 'RSA is not an acronym for anything technical — the letters are simply the initials of Rivest, Shamir and Adleman, in order purely by alphabetical coincidence.' },
  { id: 'adleman', nameZh: '伦纳德·阿德曼', nameEn: 'Leonard Adleman', icon: '🧬', roleZh: 'RSA 三巨头之一 · DNA 计算之父', roleEn: 'One of the RSA trio · Father of DNA computing', eraZh: '1945– · 美国', eraEn: '1945– · USA',
    bioZh: '伦纳德·阿德曼是美国计算机科学家，RSA 三巨头之一。1977 年，他与李维斯特、萨莫尔在 MIT 共事时共同发明了 RSA 算法，算法名中的「A」正取自他的姓氏。有趣的是，他最初的角色是「验证者」——负责寻找方案漏洞，最终却成了共同发明人。1994 年他又开创了 DNA 计算这一全新领域。',
    bioEn: 'Leonard Adleman is an American computer scientist and one third of the RSA trio. In 1977, at MIT with Rivest and Shamir, he helped invent RSA — the "A" in its name is his surname. His original role was the skeptic: Rivest and Shamir produced ideas while Adleman tried to break them. In 1994 he founded the new field of DNA computing.',
    quoteZh: '我本来的工作是挑毛病，最后却成了发明人——科学总在意料之外。', quoteEn: 'My job was to poke holes in the scheme — instead I ended up an inventor. Science works in unexpected ways.',
    factZh: '阿德曼的 DNA 计算首个实验解决的是「哈密顿路径问题」：他用一试管 DNA 分子，通过生化反应「算」出了 7 个节点的小规模问题——计算不是在芯片上，而是在试管里完成的。',
    factEn: 'Adleman\'s first DNA-computing experiment solved a Hamiltonian path problem in a test tube of DNA — the computation happened in a test tube, not on a chip.' },
  { id: 'driscoll', nameZh: '艾格尼丝·德里斯科尔', nameEn: 'Agnes Driscoll', icon: '⚓', roleZh: '美国第一位海军密码学家', roleEn: 'America\'s first naval cryptologist', eraZh: '1889–1971 · 美国', eraEn: '1889–1971 · USA',
    bioZh: '艾格尼丝·德里斯科尔是美国海军首位女性密码破译员，被称为「美国第一位海军密码学家」。她 1918 年加入海军，在密码部门与 OP-20-G 工作三十余年，破译了日本多套密码系统，包括日本海军的「红色密码机」与部分「蓝色密码机」体制，为太平洋战争中的情报优势立下汗马功劳。她培养的破译团队后来成为二战美军密码破译的核心力量。',
    bioEn: 'Agnes Driscoll was the first woman cryptanalyst of the U.S. Navy and is often called the country\'s first naval cryptologist. Joining in 1918, she spent more than thirty years at the Navy\'s codebreaking offices, including OP-20-G, breaking several Japanese cipher systems including the "Red" machine cipher. The analysts she trained became the core of U.S. Navy cryptanalysis in WWII.',
    quoteZh: '破译密码是耐心与细节的艺术，胜利往往藏在最枯燥的纸面工作里。', quoteEn: 'Codebreaking is an art of patience and detail — victory hides in the most tedious paperwork.',
    factZh: '德里斯科尔 1949 年被调离核心岗位，功劳与档案长期被封存；直到近年历史学者整理解密档案，这位「海军密码学第一夫人」的贡献才逐渐被公众知晓。',
    factEn: 'Driscoll was pushed off the Navy\'s core codebreaking staff in 1949, and her achievements stayed buried in classified files for decades until historians restored her standing.' },
  { id: 'trithemius', nameZh: '约翰内斯·特里特米乌斯', nameEn: 'Johannes Trithemius', icon: '📖', roleZh: '西方密码学奠基人之一', roleEn: 'One of the founding fathers of Western cryptography', eraZh: '1462–1516 · 神圣罗马帝国', eraEn: '1462–1516 · Holy Roman Empire',
    bioZh: '约翰内斯·特里特米乌斯是德国本笃会修道院院长、人文主义学者。1518 年，他身后出版的《复写术》(Polygraphia) 收录了数百种密码表，其中第一卷首次公开描述了后来以维吉尼亚密码闻名的多表替换思想，并包含被称为「特里特米乌斯表」的字母方阵。这部著作是西方密码学史上第一部印刷出版的密码专著。',
    bioEn: 'Johannes Trithemius was a German Benedictine abbot and scholar. His Polygraphia, published posthumously in 1518, was the first printed book devoted entirely to cryptography and contained hundreds of cipher tables. Its first book publicly described polyalphabetic substitution — the technique later made famous as the Vigenère cipher — built around the Tabula recta, or Trithemius table.',
    quoteZh: '让文字成为只有知情者才能读懂的秘密，既是学问，也是艺术。', quoteEn: 'Making words a secret readable only by the initiated is both a science and an art.',
    factZh: '特里特米乌斯还写过一部更神秘的手稿《隐写术》(Steganographia)：表面讲「用天使传信」的魔法，实际暗藏真实的加密方法；因为太过离奇，这本书在他死后两百年里一直被当作巫术著作。',
    factEn: 'Trithemius also wrote the far stranger manuscript Steganographia, which masqueraded as angelic magic while secretly hiding real encryption methods — dismissed as sorcery for two centuries.' }
];

let block = '';
for (const p of P) {
  ['name', 'icon', 'role', 'era', 'bio', 'quote', 'fact'].forEach(f => {
    const zh = p[f + 'Zh'], en = p[f + 'En'];
    block += "  d.zh['stp." + p.id + "." + f + "'] = '" + String(zh).replace(/'/g, "\\'") + "';\n";
    block += "  d.en['stp." + p.id + "." + f + "'] = '" + String(en).replace(/'/g, "\\'") + "';\n";
  });
}

const append = '\n/* ============================================================\n   人物扩充（D2）：8 位密码史人物\n   ============================================================ */\n(function () {\n  var d = Arcade.i18n.dicts;\n' + block + '})();\n';
s = s.replace(/\n*$/, '\n') + append;
fs.writeFileSync(F, s);
console.log('✓ 已写入 8 位人物文案');
