/* ============================================================
   章节小测 Chapter Quiz —— F1 互动深化
   每章 3 题快测，答对 ≥2 点亮「本章精通」（localStorage arcade_chq_<id>='1'），
   档案页统计精通章数。中英双语，贴合各章正文知识点。
   依赖：core/i18n.js + core/i18n-dict.js（文案键 chq.*）
   ============================================================ */
window.CHAPTER_QUIZ = (function () {
  /* 12 章 × 3 题：{ q, opts[4], a(0-3), e(explain) } zh/en 对称（quantum 无密信但有题） */
  var QUIZ = {
    dawn: [
      { zh: { q: '罗塞塔石碑上有哪三种文字？', opts: ['象形文·世俗体·古希腊文', '拉丁文·希伯来文·希腊文', '楔形文·象形文·阿拉米文', '梵文·中文·希腊文'], a: 0, e: '同一敕令的三语对照是破译象形文字的钥匙。' }, en: { q: 'Which three scripts are on the Rosetta Stone?', opts: ['Hieroglyphs·Demotic·Greek', 'Latin·Hebrew·Greek', 'Cuneiform·Hieroglyphs·Aramaic', 'Sanskrit·Chinese·Greek'], a: 0, e: 'The same decree in three scripts unlocked hieroglyphs.' } },
      { zh: { q: '商博良靠什么突破口破译象形文字？', opts: ['国王名字「托勒密」的环形王名', '一段数学公式', '士兵名单', '贸易记录'], a: 0, e: '王名圈内的名字对应希腊文，成为对照锚点。' }, en: { q: 'What breakthrough did Champollion use?', opts: ['The royal cartouche "Ptolemy"', 'A math formula', 'A soldier roster', 'Trade records'], a: 0, e: 'The cartouche name matched Greek, anchoring the decipherment.' } },
      { zh: { q: '象形文字破译完成于哪一年？', opts: ['1822', '1789', '1854', '1900'], a: 0, e: '1822 年商博良宣读《致达西尔先生的信》。' }, en: { q: 'When were hieroglyphs deciphered?', opts: ['1822', '1789', '1854', '1900'], a: 0, e: 'Champollion\'s 1822 Lettre à M. Dacier.' } }
    ],
    caesar: [
      { zh: { q: '凯撒密码的标准偏移量是多少？', opts: ['3', '5', '7', '10'], a: 0, e: '凯撒本人用偏移 3，但史载并不固定。' }, en: { q: 'What shift did Caesar use?', opts: ['3', '5', '7', '10'], a: 0, e: 'Caesar used shift 3, though records show it varied.' } },
      { zh: { q: '凯撒密码属于哪一类？', opts: ['单表替换', '换位', '多表替换', '流密码'], a: 0, e: '每个字母按固定偏移换成另一字母。' }, en: { q: 'What kind of cipher is Caesar?', opts: ['Monoalphabetic substitution', 'Transposition', 'Polyalphabetic', 'Stream cipher'], a: 0, e: 'Each letter is replaced by a fixed shift.' } },
      { zh: { q: '破解凯撒密码最朴素的方法？', opts: ['穷举 25 个偏移', '频率分析', 'Kasiski 检验', '彩虹表'], a: 0, e: '最多试 25 次，通顺英文即命中。' }, en: { q: 'The simplest way to break Caesar?', opts: ['Try all 25 shifts', 'Frequency analysis', 'Kasiski test', 'Rainbow tables'], a: 0, e: 'At most 25 tries; readable English wins.' } }
    ],
    arab: [
      { zh: { q: '频率分析是谁发明的？', opts: ['肯迪（Al-Kindi）', '凯撒', '培根', '商博良'], a: 0, e: '约 850 年，阿拉伯学者肯迪。' }, en: { q: 'Who invented frequency analysis?', opts: ['Al-Kindi', 'Caesar', 'Bacon', 'Champollion'], a: 0, e: 'The Arab polymath Al-Kindi, c. 850.' } },
      { zh: { q: '频率分析主要对付哪类密码？', opts: ['单表替换', '换位密码', 'OTP', 'RSA'], a: 0, e: '字母频率分布会泄露替换关系。' }, en: { q: 'What does frequency analysis defeat?', opts: ['Monoalphabetic substitution', 'Transposition', 'OTP', 'RSA'], a: 0, e: 'Letter-frequency patterns leak the substitution.' } },
      { zh: { q: '英文中最常见的字母是？', opts: ['E', 'A', 'T', 'O'], a: 0, e: 'E 约占 12.7%，频率分析的第一参考。' }, en: { q: 'The most common English letter?', opts: ['E', 'A', 'T', 'O'], a: 0, e: 'E at ~12.7% — the first anchor of frequency analysis.' } }
    ],
    bacon: [
      { zh: { q: '培根双字体密码用几种字形编码？', opts: ['2 种', '5 种', '26 种', '8 种'], a: 0, e: '两种字形（如粗细），5 位一组表示一个字母。' }, en: { q: 'How many typefaces does Bacon\'s cipher use?', opts: ['2', '5', '26', '8'], a: 0, e: 'Two (e.g. bold/plain), five bits per letter.' } },
      { zh: { q: '培根密码的本质是？', opts: ['二进制编码', '换位', '多表替换', '公钥'], a: 0, e: 'A/B 两种字形 = 0/1，是二进制的先声。' }, en: { q: 'What is Bacon\'s cipher at heart?', opts: ['Binary encoding', 'Transposition', 'Polyalphabetic', 'Public key'], a: 0, e: 'Two typefaces = bits: an early binary.' } },
      { zh: { q: '培根密码属于哪一类技术？', opts: ['隐写术', '分组密码', '哈希', '数字签名'], a: 0, e: '秘密藏在普通文本的外观里，隐藏秘密的存在本身。' }, en: { q: 'Bacon\'s cipher is a form of?', opts: ['Steganography', 'Block cipher', 'Hash', 'Digital signature'], a: 0, e: 'It hides the secret in the look of text — steganography.' } }
    ],
    ww1: [
      { zh: { q: 'ADFGVX 密码由哪两部分组成？', opts: ['6×6 方阵替换 + 列换位', '转子 + 插线板', '摩斯 + 培根', '哈希 + 盐'], a: 0, e: '替换叠换位的双层加密，一战德军终极密码。' }, en: { q: 'ADFGVX combines what?', opts: ['6×6 substitution + columnar transposition', 'Rotors + plugboard', 'Morse + Bacon', 'Hash + salt'], a: 0, e: 'Substitution stacked on transposition — Germany\'s WWI ultimate.' } },
      { zh: { q: '齐默尔曼电报被哪个机构破译？', opts: ['英国 40 号房', '美国 SIS', '布莱切利园', '苏联 GRU'], a: 0, e: '一战英国海军部 40 号房破译，改变美国参战舆论。' }, en: { q: 'Who broke the Zimmermann Telegram?', opts: ['UK Room 40', 'US SIS', 'Bletchley Park', 'Soviet GRU'], a: 0, e: 'Room 40 broke it, shifting US opinion toward war.' } },
      { zh: { q: 'Playfair 密码的方阵是几乘几？', opts: ['5×5', '4×4', '6×6', '3×3'], a: 0, e: '5×5（I/J 合并），字母成对加密。' }, en: { q: 'Playfair\'s square size?', opts: ['5×5', '4×4', '6×6', '3×3'], a: 0, e: '5×5 (I/J combined), encrypting letter pairs.' } }
    ],
    bletchley: [
      { zh: { q: 'Bombe 是用来做什么的？', opts: ['筛出 Enigma 转子设置', '加密电报', '摩斯发报', '打印密文'], a: 0, e: '用已知明文（crib）快速排除不可能的转子设置。' }, en: { q: 'What was the Bombe for?', opts: ['Sifting Enigma rotor settings', 'Encrypting traffic', 'Morse transmission', 'Printing ciphertext'], a: 0, e: 'It used cribs to eliminate impossible rotor settings fast.' } },
      { zh: { q: '「Crib」指什么？', opts: ['已知明文片段', '密钥', '密码机', '摩斯码'], a: 0, e: '猜测必然存在的明文片段，如固定的天气词。' }, en: { q: 'What is a "crib"?', opts: ['A known plaintext fragment', 'A key', 'A machine', 'Morse code'], a: 0, e: 'A guessed fragment bound to appear, like a fixed weather word.' } },
      { zh: { q: 'Enigma 加密与解密的关系？', opts: ['同一设置下相同', '完全无关', '需要逆算法', '无法解密'], a: 0, e: '转子机的奇妙对称：加密=解密。' }, en: { q: 'How do Enigma encryption and decryption relate?', opts: ['Identical under the same settings', 'Unrelated', 'Needs an inverse', 'Cannot be decrypted'], a: 0, e: 'The rotor machine\'s eerie symmetry: encrypting equals decrypting.' } }
    ],
    midway: [
      { zh: { q: '「深度」（depth）破译靠什么？', opts: ['同密钥两电文相减', '穷举密钥', '暴力破解', '侧信道'], a: 0, e: '共享加表的电文相减，密钥抵消。' }, en: { q: 'What does "depth" rely on?', opts: ['Subtracting messages sharing a key', 'Key exhaustion', 'Brute force', 'Side channels'], a: 0, e: 'Messages sharing an additive cancel the key when subtracted.' } },
      { zh: { q: '中途岛前美军设下什么陷阱？', opts: ['假称淡水短缺（AF）', '发送假密文', '广播假坐标', '切断电源'], a: 0, e: '故意发报称中途岛淡水短缺，日军复述即证实 AF=中途岛。' }, en: { q: 'What trap did the US set before Midway?', opts: ['Faking a water shortage (AF)', 'Sending fake ciphertext', 'Broadcasting false coords', 'Cutting power'], a: 0, e: 'A planted message about fresh water; the Japanese echoed it, proving AF = Midway.' } },
      { zh: { q: 'JN-25 是什么？', opts: ['日本海军密码', '美军密码机', '英国破译机', '苏联密码本'], a: 0, e: '码本 + 每日加表的双重加密。' }, en: { q: 'What is JN-25?', opts: ['The Japanese Navy cipher', 'A US machine', 'A British bombe', 'A Soviet codebook'], a: 0, e: 'A codebook plus daily additive — double encryption.' } }
    ],
    purple: [
      { zh: { q: '紫密（Purple）没有用什么部件？', opts: ['转子', '插线板', '步进开关', '继电器'], a: 0, e: '与 Enigma 不同，紫密用步进开关而非转子。' }, en: { q: 'What does Purple lack?', opts: ['Rotors', 'A plugboard', 'Stepping switches', 'Relays'], a: 0, e: 'Unlike Enigma, Purple used stepping switches, not rotors.' } },
      { zh: { q: '紫密被谁主导破译？', opts: ['弗里德曼团队（SIS）', '图灵', '波兰小组', '苏联'], a: 0, e: '美国陆军信号情报处 SIS，弗里德曼领衔。' }, en: { q: 'Who led the Purple break?', opts: ['Friedman\'s SIS team', 'Turing', 'The Polish team', 'The Soviets'], a: 0, e: 'The US Army SIS under William Friedman.' } },
      { zh: { q: '紫密破译对二战的关键影响？', opts: ['截获日本外交情报', '破解陆军密码', '破译海军电报', '拦截潜艇通信'], a: 0, e: '日本最高外交密码被美方持续读取。' }, en: { q: 'Purple\'s key impact?', opts: ['Reading Japanese diplomacy', 'Breaking army codes', 'Naval traffic', 'Submarine comms'], a: 0, e: 'America kept reading Japan\'s top diplomatic traffic.' } }
    ],
    lorenz: [
      { zh: { q: 'Colossus 是什么？', opts: ['世界第一台可编程电子计算机', '第一台转子机', '第一台摩斯机', '第一台打印机'], a: 0, e: '弗劳尔斯 1943 年建造，用于破译 Tunny。' }, en: { q: 'What was Colossus?', opts: ['The first programmable electronic computer', 'The first rotor machine', 'The first Morse set', 'The first printer'], a: 0, e: 'Built by Flowers in 1943 to break Tunny.' } },
      { zh: { q: '洛伦兹（Tunny）密文基于什么编码？', opts: ['5 比特博多码', 'ASCII', '摩斯', 'BCD'], a: 0, e: '电传打字机的 5 比特博多码。' }, en: { q: 'What encoding underlies Tunny?', opts: ['5-bit Baudot', 'ASCII', 'Morse', 'BCD'], a: 0, e: 'The 5-bit teleprinter code, Baudot.' } },
      { zh: { q: '破解 Tunny 的核心数学工具？', opts: ['差分统计（Δ 运算）', '矩阵求逆', '傅里叶变换', '线性规划'], a: 0, e: '对比密钥流的差分，抵消规律性。' }, en: { q: 'The key tool for breaking Tunny?', opts: ['Differencing (Δ)', 'Matrix inversion', 'Fourier transforms', 'Linear programming'], a: 0, e: 'Differencing the keystream cancels its structure.' } }
    ],
    venona: [
      { zh: { q: 'VENONA 破译利用了哪个漏洞？', opts: ['一次性密码本被复用', '密码太弱', '密钥太短', '算法公开'], a: 0, e: '苏联违规复用密钥流，两密相减抵消密钥。' }, en: { q: 'What flaw did VENONA exploit?', opts: ['Reused one-time pads', 'A weak cipher', 'Short keys', 'Public algorithm'], a: 0, e: 'The Soviets reused key streams; subtracting cancels the key.' } },
      { zh: { q: 'VENONA 目标是哪国的通信？', opts: ['苏联', '德国', '日本', '英国'], a: 0, e: '美英联合拦截破译苏联间谍电报。' }, en: { q: 'Whose traffic did VENONA target?', opts: ['Soviet', 'German', 'Japanese', 'British'], a: 0, e: 'US-UK joint interception of Soviet spy traffic.' } },
      { zh: { q: '罗森伯格夫妇因何被捕？', opts: ['原子间谍网电报', '伪造货币', '叛国文书', '泄密文件'], a: 0, e: 'VENONA 电报暴露其间谍身份。' }, en: { q: 'Why were the Rosenbergs caught?', opts: ['Atomic espionage telegrams', 'Counterfeiting', 'Treason documents', 'Leaked files'], a: 0, e: 'VENONA telegrams exposed their spy ring.' } }
    ],
    modern: [
      { zh: { q: '香农 1949 年证明什么？', opts: ['OTP 具备完美保密', 'RSA 安全', 'AES 不可破', 'DES 太弱'], a: 0, e: '密钥等长随机且只用一次，密文与明文统计独立。' }, en: { q: 'What did Shannon prove in 1949?', opts: ['The OTP is perfectly secret', 'RSA is secure', 'AES is unbreakable', 'DES is weak'], a: 0, e: 'A random key as long as the message, used once, makes ciphertext statistically independent.' } },
      { zh: { q: 'Diffie-Hellman 解决什么问题？', opts: ['公开信道协商共享密钥', '数据压缩', '身份认证', '数字签名'], a: 0, e: '无需秘密通道即可协商密钥。' }, en: { q: 'What does Diffie-Hellman solve?', opts: ['Agreeing a key over a public channel', 'Compression', 'Authentication', 'Signatures'], a: 0, e: 'Two parties agree on a key with no secret channel.' } },
      { zh: { q: 'RSA 的安全性基于？', opts: ['大整数分解难', '椭圆曲线', '格基', '离散对数'], a: 0, e: '大数分解在计算上不可行。' }, en: { q: 'RSA security rests on?', opts: ['Factoring being hard', 'Elliptic curves', 'Lattices', 'Discrete logs'], a: 0, e: 'Factoring large integers is computationally infeasible.' } }
    ],
    quantum: [
      { zh: { q: 'BB84 中 Eve 随机选基窃听，会在筛选密钥里引入约多少误码率？', opts: ['25%', '5%', '50%', '0%'], a: 0, e: '选错基一半 × 测量翻转一半 ≈ 25%，窃听者自曝指纹。' }, en: { q: 'In BB84, what error rate does an eavesdropper inject into the sifted key?', opts: ['About 25%', 'About 5%', '50%', '0%'], a: 0, e: 'Wrong basis half the time × a flip half of those ≈ 25% — the eavesdropper\'s fingerprint.' } },
      { zh: { q: 'Shor 算法威胁的是哪一类密码？', opts: ['RSA / ECC 等公钥体系', 'AES 等对称密码', '摩斯电码', '培根密码'], a: 0, e: '大数分解与离散对数被多项式时间攻克；对称密码只需加倍密钥。' }, en: { q: 'What does Shor\'s algorithm threaten?', opts: ['Public-key schemes like RSA/ECC', 'Symmetric ciphers like AES', 'Morse code', 'Bacon\'s cipher'], a: 0, e: 'Factoring and discrete logs fall in polynomial time; symmetric ciphers just double their keys.' } },
      { zh: { q: '2024 年 NIST 发布的后量子标准 ML-KEM 基于什么难题？', opts: ['格上的带误差学习', '大整数分解', '离散对数', '椭圆曲线'], a: 0, e: 'FIPS 203（Kyber）基于模块格 MLWE 问题，Shor 算法无用武之地。' }, en: { q: 'Which hard problem underlies NIST\'s 2024 standard ML-KEM?', opts: ['Learning With Errors on lattices', 'Integer factoring', 'Discrete logarithms', 'Elliptic curves'], a: 0, e: 'FIPS 203 (Kyber) rests on Module-LWE — where Shor finds no purchase.' } }
    ]
  };

  /* 每章 3 题都答对 ≥2 记为「精通」 */
  function isMastered(chId) {
    try { return localStorage.getItem('arcade_chq_' + chId) === '1'; } catch (e) { return false; }
  }
  function markMastered(chId) {
    try { localStorage.setItem('arcade_chq_' + chId, '1'); } catch (e) {}
  }
  function masteredCount() {
    var n = 0;
    for (var id in QUIZ) if (isMastered(id)) n++;
    return n;
  }
  function totalChapters() {
    var n = 0; for (var id in QUIZ) n++;
    return n;
  }

  return { QUIZ: QUIZ, isMastered: isMastered, markMastered: markMastered, masteredCount: masteredCount, totalChapters: totalChapters };
})();
