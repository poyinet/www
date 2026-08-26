/* ============================================================
   密码学测验场 Quiz —— A1 互动玩法
   120 题分 4 级（入门/进阶/专家/大师），每轮随机抽 10 题，
   实时计分，答完评「密码学段位」并写入 localStorage（档案页读取）。
   中英双语题库（zh/en 对称），依赖 i18n.js + i18n-dict.js。
   ============================================================ */
window.QUIZ = (function () {
  /* 题库：{ lvl:1-4, a:正确选项索引, zh:{q,opts[4],explain}, en:{q,opts[4],explain} } */
  var BANK = [
    /* ---------- 入门 L1 ---------- */
    { lvl: 1, a: 1,
      zh: { q: '凯撒密码的经典偏移量是多少？', opts: ['2', '3', '4', '5'], explain: '凯撒本人通常后移 3 位，但史载并不固定（奥古斯都用 1）。' },
      en: { q: 'What is the classic Caesar shift?', opts: ['2', '3', '4', '5'], explain: 'Caesar usually shifted by 3, though records show it varied (Augustus used 1).' } },
    { lvl: 1, a: 0,
      zh: { q: '「明文」指的是什么？', opts: ['加密前的原始文字', '加密后的密文', '密钥', '破译工具'], explain: '明文是加密的输入，密文是输出。' },
      en: { q: 'What is plaintext?', opts: ['The original text before encryption', 'The encrypted text', 'The key', 'A cracking tool'], explain: 'Plaintext is the input to encryption; ciphertext is the output.' } },
    { lvl: 1, a: 2,
      zh: { q: '频率分析主要破解哪类密码？', opts: ['换位密码', '哈希函数', '单表替换密码', '公钥密码'], explain: '统计字母频率可破单表替换，肯迪 850 年发明。' },
      en: { q: 'Frequency analysis mainly breaks which kind of cipher?', opts: ['Transposition ciphers', 'Hash functions', 'Monoalphabetic substitution', 'Public-key ciphers'], explain: 'Counting letter frequencies defeats simple substitution; invented by Al-Kindi c. 850.' } },
    { lvl: 1, a: 3,
      zh: { q: '摩斯电码用什么表示字母？', opts: ['数字', '图形', '颜色', '点与划'], explain: '点（.）与划（-）的组合。' },
      en: { q: 'What does Morse code use to represent letters?', opts: ['Numbers', 'Shapes', 'Colors', 'Dots and dashes'], explain: 'A combination of dots (.) and dashes (-).' } },
    { lvl: 1, a: 1,
      zh: { q: '栅栏密码属于哪一类？', opts: ['替换密码', '换位密码', '流密码', '分组密码'], explain: '字母不变、只重排顺序。' },
      en: { q: 'Which family does the rail fence cipher belong to?', opts: ['Substitution', 'Transposition', 'Stream cipher', 'Block cipher'], explain: 'The letters stay the same; only their order is rearranged.' } },
    { lvl: 1, a: 0,
      zh: { q: '维吉尼亚密码是……', opts: ['多表替换密码', '单表替换密码', '换位密码', '一次性密码本'], explain: '密钥逐字母选字母表，抹平频率。' },
      en: { q: 'The Vigenère cipher is a …', opts: ['polyalphabetic substitution cipher', 'monoalphabetic substitution cipher', 'transposition cipher', 'one-time pad'], explain: 'The key picks a fresh alphabet per letter, flattening frequencies.' } },
    { lvl: 1, a: 2,
      zh: { q: '培根双字体密码用几种字形编码？', opts: ['3 种', '4 种', '2 种', '26 种'], explain: 'A/B 两种字形，5 位一组 = 二进制先声。' },
      en: { q: 'How many typefaces does Bacon\'s biliteral cipher use?', opts: ['3', '4', '2', '26'], explain: 'Two typefaces (A/B), five bits per letter — an early glimpse of binary.' } },
    { lvl: 1, a: 1,
      zh: { q: '「密文」是……', opts: ['加密前的文字', '加密后的文本', '解密后的文本', '密钥'], explain: '加密输出，无密钥无法读懂。' },
      en: { q: 'Ciphertext is …', opts: ['the text before encryption', 'the text after encryption', 'the text after decryption', 'the key'], explain: 'The output of encryption; unreadable without the key.' } },
    { lvl: 1, a: 3,
      zh: { q: '一次性密码本（OTP）的密钥特点是？', opts: ['很短', '可复用', '固定不变', '与明文等长且只用一次'], explain: '随机、等长、一次性——理论上不可破。' },
      en: { q: 'What is the key property of a one-time pad?', opts: ['Very short', 'Reusable', 'Fixed forever', 'As long as the message, used once'], explain: 'Random, equal-length, single-use — theoretically unbreakable.' } },
    { lvl: 1, a: 2,
      zh: { q: 'BASE64 的作用是？', opts: ['加密', '压缩', '把二进制转成可打印文本', '哈希'], explain: '编码而非加密，现代协议日常用。' },
      en: { q: 'What does Base64 do?', opts: ['Encryption', 'Compression', 'Turns binary into printable text', 'Hashing'], explain: 'Encoding, not encryption — used everywhere in modern protocols.' } },
    { lvl: 1, a: 0,
      zh: { q: '二进制中字母 A 用几个比特表示？', opts: ['8 位', '4 位', '16 位', '2 位'], explain: 'ASCII 中 A=01000001（8 位）。' },
      en: { q: 'How many bits represent the letter A in binary?', opts: ['8', '4', '16', '2'], explain: 'In ASCII, A = 01000001 (8 bits).' } },
    { lvl: 1, a: 1,
      zh: { q: '异或运算的规则是？', opts: ['相同得 1', '相同得 0、不同得 1', '总是得 1', '总是得 0'], explain: '现代密码的原子：A⊕K⊕K=A。' },
      en: { q: 'What is the XOR rule?', opts: ['Equal bits give 1', 'Equal bits give 0, different bits give 1', 'Always 1', 'Always 0'], explain: 'The atom of modern crypto: A⊕K⊕K=A.' } },
    { lvl: 1, a: 2,
      zh: { q: '罗塞塔石碑上有几种文字？', opts: ['1 种', '2 种', '3 种', '4 种'], explain: '象形文、世俗体、古希腊文三语对照。' },
      en: { q: 'How many scripts are on the Rosetta Stone?', opts: ['1', '2', '3', '4'], explain: 'Hieroglyphs, Demotic, and Ancient Greek side by side.' } },
    { lvl: 1, a: 0,
      zh: { q: '「密钥」的作用是？', opts: ['控制加解密方式', '显示明文', '压缩数据', '美化界面'], explain: '密钥决定加密如何发生。' },
      en: { q: 'What does the key do?', opts: ['Controls how encryption/decryption works', 'Shows the plaintext', 'Compresses data', 'Beautifies the UI'], explain: 'The key decides how encryption happens.' } },
    { lvl: 1, a: 3,
      zh: { q: '「加密」的本质是什么？', opts: ['压缩数据', '删除数据', '转换数据', '用密钥把明文变成密文'], explain: '加密是受密钥控制的可逆变换。' },
      en: { q: 'What is encryption at its core?', opts: ['Compressing data', 'Deleting data', 'Transforming data', 'Turning plaintext into ciphertext under a key'], explain: 'Encryption is a reversible transformation controlled by a key.' } },

    /* ---------- 进阶 L2 ---------- */
    { lvl: 2, a: 2,
      zh: { q: 'Kasiski 检验法用来判断什么？', opts: ['密钥内容', '明文长度', '维吉尼亚密钥长度', '密文长度'], explain: '找重复片段间距的最大公约数。' },
      en: { q: 'What does the Kasiski test reveal?', opts: ['The key content', 'The plaintext length', 'The Vigenère key length', 'The ciphertext length'], explain: 'It finds repeated fragments and takes the GCD of their spacings.' } },
    { lvl: 2, a: 1,
      zh: { q: 'Playfair 密码用多大的方阵？', opts: ['4×4', '5×5', '6×6', '3×3'], explain: '5×5（I/J 合并），字母成对加密。' },
      en: { q: 'What grid size does Playfair use?', opts: ['4×4', '5×5', '6×6', '3×3'], explain: 'A 5×5 square (I/J combined), encrypting letter pairs.' } },
    { lvl: 2, a: 0,
      zh: { q: 'ADFGVX 密码由哪两部分组成？', opts: ['6×6 方阵替换 + 列换位', '转子 + 插线板', '凯撒 + 摩斯', '哈希 + 盐'], explain: '替换叠加换位的双层加密。' },
      en: { q: 'Which two parts make up the ADFGVX cipher?', opts: ['6×6 square substitution + columnar transposition', 'Rotors + plugboard', 'Caesar + Morse', 'Hash + salt'], explain: 'Substitution stacked on transposition — a double cipher.' } },
    { lvl: 2, a: 3,
      zh: { q: 'Enigma 加密和解密的关系是？', opts: ['完全不同', '需要逆算法', '无法解密', '相同操作'], explain: '同一设置下加密=解密，奇妙对称。' },
      en: { q: 'How are Enigma encryption and decryption related?', opts: ['Completely different', 'Needs an inverse algorithm', 'Cannot be decrypted', 'The same operation'], explain: 'With identical settings, encrypting equals decrypting — an eerie symmetry.' } },
    { lvl: 2, a: 1,
      zh: { q: 'Bombe 是做什么的？', opts: ['加密机', '破译 Enigma 的筛选机', '摩斯发报机', '哈希机'], explain: '图灵设计，用 crib 筛转子设置。' },
      en: { q: 'What was the Bombe for?', opts: ['Encryption', 'An Enigma-breaking sieve', 'A Morse transmitter', 'A hashing machine'], explain: 'Designed by Turing, it used cribs to sieve rotor settings.' } },
    { lvl: 2, a: 2,
      zh: { q: '「Crib」在破译中指？', opts: ['一种密码', '一种密钥', '已知明文片段', '密文碎片'], explain: '猜测的明文钩子，如固定的「WETTER」。' },
      en: { q: 'In codebreaking, a "crib" is …', opts: ['a type of cipher', 'a type of key', 'a known plaintext fragment', 'a piece of ciphertext'], explain: 'A guessed plaintext hook, like the fixed "WETTER".' } },
    { lvl: 2, a: 0,
      zh: { q: '仿射密码 E=ax+b mod 26 中，a 必须满足？', opts: ['与 26 互质', '等于 26', '小于 b', '任意值'], explain: '互质才有逆元，才能解密。' },
      en: { q: 'In the affine cipher E=ax+b mod 26, a must be …', opts: ['coprime with 26', 'equal to 26', 'less than b', 'anything'], explain: 'Only then does a have an inverse, so decryption works.' } },
    { lvl: 2, a: 3,
      zh: { q: '中途岛破译靠的「深度」指？', opts: ['深水炸弹', '密码强度', '电文长度', '同密钥两电文相减'], explain: '同一天共享加表，相减抵消密钥。' },
      en: { q: 'In Midway codebreaking, "depth" means …', opts: ['depth charges', 'cipher strength', 'message length', 'subtracting two messages sharing a key'], explain: 'Messages sharing the same daily additive; subtracting cancels the key.' } },
    { lvl: 2, a: 1,
      zh: { q: '紫密（Purple）的核心结构是？', opts: ['三个转子', '双路步进开关', '插线板', '磁鼓'], explain: '六元音路 + 二十辅音路，无转子。' },
      en: { q: 'What is the core structure of Purple?', opts: ['Three rotors', 'Two-bank stepping switches', 'A plugboard', 'A drum'], explain: 'Six vowel paths plus twenty consonant paths — no rotors at all.' } },
    { lvl: 2, a: 2,
      zh: { q: 'VENONA 破译利用了哪个漏洞？', opts: ['密码太弱', '密钥太短', '一次性密码本被复用', '算法公开'], explain: '复用密钥流 → 相减抵消 → 读出明文。' },
      en: { q: 'Which flaw did VENONA exploit?', opts: ['A weak cipher', 'Keys too short', 'One-time pads reused', 'A public algorithm'], explain: 'Reused key streams → subtract to cancel → read the plaintext.' } },
    { lvl: 2, a: 0,
      zh: { q: '哈希函数的特点是？', opts: ['单向不可逆', '可逆', '输出可还原', '需要密钥'], explain: '任意输入 → 固定输出，不可逆。' },
      en: { q: 'What is a property of hash functions?', opts: ['One-way and irreversible', 'Reversible', 'Output can be restored', 'Needs a key'], explain: 'Any input maps to a fixed-length output; you cannot go back.' } },
    { lvl: 2, a: 3,
      zh: { q: '「盐」（Salt）用来防什么？', opts: ['暴力破解密钥', '重放攻击', '中间人攻击', '彩虹表攻击'], explain: '口令哈希前加随机值，防预计算表。' },
      en: { q: 'What does a salt defend against?', opts: ['Brute-forcing keys', 'Replay attacks', 'Man-in-the-middle attacks', 'Rainbow-table attacks'], explain: 'Adding random data before hashing defeats precomputed tables.' } },
    { lvl: 2, a: 1,
      zh: { q: '博多码（Baudot）是几比特编码？', opts: ['3 比特', '5 比特', '7 比特', '8 比特'], explain: '5 比特电传码，洛伦兹密文的底层字母表。' },
      en: { q: 'How many bits does Baudot code use?', opts: ['3 bits', '5 bits', '7 bits', '8 bits'], explain: 'A 5-bit teleprinter code — the alphabet under Lorenz ciphertext.' } },
    { lvl: 2, a: 0,
      zh: { q: '维吉尼亚密码真正的发明者是？', opts: ['贝拉索（Bellaso）', '维吉尼亚', '培根', '凯撒'], explain: '贝拉索 1553 年发明，维吉尼亚 1586 年才描述并因此留名。' },
      en: { q: 'Who really invented the Vigenère cipher?', opts: ['Giovan Battista Bellaso', 'Vigenère', 'Bacon', 'Caesar'], explain: 'Bellaso invented it in 1553; Vigenère described it in 1586 and got the credit.' } },
    { lvl: 2, a: 0,
      zh: { q: '杰斐逊转轮（M-94）属于哪类？', opts: ['多字母替换圆盘', '换位密码', '公钥密码', '哈希'], explain: '多个圆盘转出不同替换表，每行一字母。' },
      en: { q: 'What kind of device is the Jefferson disk (M-94)?', opts: ['A polyalphabetic disk cipher', 'A transposition cipher', 'A public-key cipher', 'A hash'], explain: 'Stacked disks rotate to produce fresh alphabets, one letter per row.' } },

    /* ---------- 专家 L3 ---------- */
    { lvl: 3, a: 1,
      zh: { q: 'Diffie-Hellman 解决的核心问题是？', opts: ['数据压缩', '公开信道协商共享密钥', '身份认证', '数据加密'], explain: '无需秘密通道即可协商密钥，公钥密码开端。' },
      en: { q: 'What core problem does Diffie-Hellman solve?', opts: ['Data compression', 'Agreeing a shared key over a public channel', 'Identity authentication', 'Data encryption'], explain: 'Two parties can agree on a key with no secret channel — the dawn of public-key crypto.' } },
    { lvl: 3, a: 2,
      zh: { q: 'RSA 的安全性基于哪个数学难题？', opts: ['椭圆曲线离散对数', '背包问题', '大整数分解', '离散对数'], explain: '大数分解难以逆向，1977 年 RSA 三杰。' },
      en: { q: 'Which math problem underpins RSA security?', opts: ['Elliptic-curve discrete log', 'The knapsack problem', 'Integer factorization', 'Discrete logarithm'], explain: 'Factoring large numbers is hard — RSA, 1977.' } },
    { lvl: 3, a: 0,
      zh: { q: 'Feistel 网络的典型代表是？', opts: ['DES', 'AES', 'ChaCha20', 'RSA'], explain: 'DES 用 Feistel 结构；AES 是 SPN。' },
      en: { q: 'Which cipher is the classic Feistel network?', opts: ['DES', 'AES', 'ChaCha20', 'RSA'], explain: 'DES uses a Feistel structure; AES is an SPN.' } },
    { lvl: 3, a: 3,
      zh: { q: 'AES 的分组大小是？', opts: ['64 位', '32 位', '256 位', '128 位'], explain: '128 位分组，密钥 128/192/256。' },
      en: { q: 'What is the AES block size?', opts: ['64 bits', '32 bits', '256 bits', '128 bits'], explain: '128-bit blocks, with 128/192/256-bit keys.' } },
    { lvl: 3, a: 1,
      zh: { q: 'Kerckhoffs 原则主张什么？', opts: ['算法保密', '安全只依赖密钥保密', '密钥公开', '算法越复杂越好'], explain: '算法可公开，安全全在密钥。' },
      en: { q: 'What does Kerckhoffs\' principle argue?', opts: ['The algorithm must be secret', 'Security rests only on key secrecy', 'Keys must be public', 'Complexity equals safety'], explain: 'The algorithm can be public; security rests entirely on the key.' } },
    { lvl: 3, a: 2,
      zh: { q: '生日攻击针对的是？', opts: ['RSA', 'AES', '哈希碰撞', '凯撒'], explain: '约 2^(n/2) 次即可找到碰撞。' },
      en: { q: 'What does the birthday attack target?', opts: ['RSA', 'AES', 'Hash collisions', 'Caesar'], explain: 'A collision appears after about 2^(n/2) tries.' } },
    { lvl: 3, a: 0,
      zh: { q: '侧信道攻击利用的是？', opts: ['设备物理泄露', '算法数学弱点', '弱口令', '网络延迟'], explain: '功耗/电磁/时间/缓存等泄露。' },
      en: { q: 'What does a side-channel attack exploit?', opts: ['Physical leakage from the device', 'Mathematical weaknesses', 'Weak passwords', 'Network latency'], explain: 'Power, EM, timing, or cache leakage.' } },
    { lvl: 3, a: 3,
      zh: { q: '已知明文攻击（KPA）需要什么？', opts: ['只有密文', '选择密文', '解密预言机', '明文-密文对'], explain: '比对已知对推密钥或算法。' },
      en: { q: 'What does a known-plaintext attack need?', opts: ['Ciphertext only', 'Chosen ciphertexts', 'A decryption oracle', 'Plaintext-ciphertext pairs'], explain: 'Comparing known pairs to deduce the key or system.' } },
    { lvl: 3, a: 1,
      zh: { q: 'Colossus 的用途是？', opts: ['破译 Enigma', '破译洛伦兹（Tunny）', '加密电报', '解数独'], explain: '世界第一台可编程电子计算机，差分统计。' },
      en: { q: 'What was Colossus used for?', opts: ['Breaking Enigma', 'Breaking Lorenz (Tunny)', 'Encrypting telegrams', 'Solving Sudoku'], explain: 'The world\'s first programmable electronic computer, doing statistical differencing.' } },
    { lvl: 3, a: 2,
      zh: { q: '「完美保密」由谁严格证明？', opts: ['图灵', '维吉尼亚', '香农', '迪菲'], explain: '香农 1949 年证明 OTP 绝对安全。' },
      en: { q: 'Who rigorously proved "perfect secrecy"?', opts: ['Turing', 'Vigenère', 'Shannon', 'Diffie'], explain: 'Shannon proved in 1949 that the OTP is absolutely secure.' } },
    { lvl: 3, a: 0,
      zh: { q: '零知识证明的核心是？', opts: ['不泄露秘密证明断言', '泄露部分秘密', '需要可信第三方', '必须线下验证'], explain: '证明「我知道密码」却不透露密码。' },
      en: { q: 'What is the core of a zero-knowledge proof?', opts: ['Proving a claim without revealing the secret', 'Revealing part of the secret', 'Needing a trusted third party', 'Must verify offline'], explain: 'Prove "I know the password" without revealing the password.' } },
    { lvl: 3, a: 3,
      zh: { q: '中间人攻击（MITM）冒充的是？', opts: ['服务器', '客户端', '证书机构', '通信双方'], explain: '同时冒充两端，截听或篡改。' },
      en: { q: 'Who does a man-in-the-middle attack impersonate?', opts: ['The server', 'The client', 'The certificate authority', 'Both parties'], explain: 'It pretends to be both ends, intercepting or altering traffic.' } },
    { lvl: 3, a: 1,
      zh: { q: 'SSL/TLS 握手后，数据用什么加密传输？', opts: ['公钥加密整条消息', '对称加密', 'OTP', '摩斯'], explain: '握手协商对称密钥，之后用快速对称加密传数据。' },
      en: { q: 'After the SSL/TLS handshake, how is data encrypted?', opts: ['Public-key for the whole message', 'Symmetric encryption', 'OTP', 'Morse'], explain: 'The handshake agrees a symmetric key; bulk data then flows under fast symmetric encryption.' } },
    { lvl: 3, a: 0,
      zh: { q: '流密码（如 RC4）与分组密码的区别？', opts: ['逐比特/字节加密', '成块加密', '无需密钥', '不可逆'], explain: '流密码按比特流处理，分组密码按固定块处理。' },
      en: { q: 'How does a stream cipher (e.g. RC4) differ from a block cipher?', opts: ['Encrypts bit by bit', 'Encrypts in blocks', 'Needs no key', 'Is irreversible'], explain: 'Stream ciphers process a bitstream; block ciphers process fixed-size blocks.' } },
    { lvl: 3, a: 2,
      zh: { q: 'Diffie-Hellman 公开交换的是什么？', opts: ['私钥', '最终密钥', '中间数', '密文'], explain: '双方交换公开中间数，各自算出相同共享密钥。' },
      en: { q: 'What does Diffie-Hellman exchange publicly?', opts: ['Private keys', 'The final key', 'Intermediate numbers', 'Ciphertext'], explain: 'Parties exchange public intermediates and each derives the same shared secret.' } },

    /* ---------- 大师 L4 ---------- */
    { lvl: 4, a: 1,
      zh: { q: '选择密文攻击（CCA）中攻击者能？', opts: ['只拿密文', '选择密文并获取解密', '选择明文', '获取密钥'], explain: '现代公钥加密须 CCA 安全。' },
      en: { q: 'In a chosen-ciphertext attack (CCA), the attacker can …', opts: ['only get ciphertexts', 'choose ciphertexts and obtain decryptions', 'choose plaintexts', 'obtain the key'], explain: 'Modern public-key encryption must be CCA-secure.' } },
    { lvl: 4, a: 2,
      zh: { q: '同态加密允许……', opts: ['解密他人数据', '共享密钥', '直接对密文做运算', '绕过密钥'], explain: '密文运算结果=明文运算结果，隐私计算核心。' },
      en: { q: 'Homomorphic encryption allows …', opts: ['decrypting others\' data', 'sharing keys', 'computing directly on ciphertexts', 'bypassing keys'], explain: 'Computing on ciphertext equals computing on plaintext — the core of privacy computing.' } },
    { lvl: 4, a: 0,
      zh: { q: '后量子密码基于哪类难题？', opts: ['格、编码、多变量', '大数分解', '椭圆曲线', '离散对数'], explain: '抗量子算法；NIST 已标准化。' },
      en: { q: 'Which problems does post-quantum crypto rely on?', opts: ['Lattices, codes, multivariates', 'Factoring', 'Elliptic curves', 'Discrete log'], explain: 'Quantum-resistant algorithms; NIST has standardized several.' } },
    { lvl: 4, a: 3,
      zh: { q: 'GCHQ 的科克斯 1973 年发明了什么？', opts: ['DES', 'Enigma', '摩斯', '与 RSA 等价的算法'], explain: '秘密超前 RSA 4 年，1997 年才解密。' },
      en: { q: 'What did GCHQ\'s Clifford Cocks invent in 1973?', opts: ['DES', 'Enigma', 'Morse', 'An algorithm equivalent to RSA'], explain: 'Secretly four years ahead of RSA; declassified only in 1997.' } },
    { lvl: 4, a: 1,
      zh: { q: '中途相遇攻击破解什么最有效？', opts: ['单重加密', '双重加密', '哈希', '流密码'], explain: '两端匹配中间值，2DES 因此不安全。' },
      en: { q: 'What does a meet-in-the-middle attack break best?', opts: ['Single encryption', 'Double encryption', 'Hashes', 'Stream ciphers'], explain: 'Matching intermediate values from both ends is why 2DES is insecure.' } },
    { lvl: 4, a: 2,
      zh: { q: '彩虹表（Rainbow Table）是？', opts: ['一种密码', '一种密钥', '预计算哈希链表', '物理设备'], explain: '加速反查哈希，加盐可防。' },
      en: { q: 'A rainbow table is …', opts: ['a cipher', 'a key', 'a precomputed hash-chain table', 'a physical device'], explain: 'It speeds up reversing hashes; salting defeats it.' } },
    { lvl: 4, a: 0,
      zh: { q: '量子密码（QKD）的安全性基于？', opts: ['量子不可克隆定理', '大数分解', '椭圆曲线', '随机数'], explain: '窃听会扰动量子态被察觉。' },
      en: { q: 'What is QKD security based on?', opts: ['The quantum no-cloning theorem', 'Factoring', 'Elliptic curves', 'Random numbers'], explain: 'Eavesdropping disturbs quantum states and gets detected.' } },
    { lvl: 4, a: 3,
      zh: { q: 'Merkle 树主要用于？', opts: ['加密', '压缩', '传输', '区块链与分布式系统'], explain: '哈希树，高效验证数据完整。' },
      en: { q: 'What are Merkle trees mainly for?', opts: ['Encryption', 'Compression', 'Transmission', 'Blockchains and distributed systems'], explain: 'Hash trees that verify data integrity efficiently.' } },
    { lvl: 4, a: 1,
      zh: { q: '「非秘密加密」概念由谁提出？', opts: ['科克斯', '埃利斯', '迪菲', '香农'], explain: 'GCHQ 埃利斯 1969 年，公钥隐秘先驱。' },
      en: { q: 'Who conceived "non-secret encryption"?', opts: ['Cocks', 'Ellis', 'Diffie', 'Shannon'], explain: 'GCHQ\'s James Ellis in 1969 — the secret pioneer of public keys.' } },
    { lvl: 4, a: 2,
      zh: { q: 'DES 的 56 位密钥为何受质疑？', opts: ['太复杂', '无法实现', '过短易暴力破解，疑被 NSA 削弱', '无法加密中文'], explain: '原 Lucifer 128 位，标准仅 56 位。' },
      en: { q: 'Why was DES\'s 56-bit key questioned?', opts: ['Too complex', 'Impossible to build', 'Too short for brute force, allegedly weakened by the NSA', 'Cannot encrypt Chinese'], explain: 'The original Lucifer had 128 bits; the standard shipped with 56.' } },
    { lvl: 3, a: 0,
      zh: { q: '「自动密钥」（Autokey）密码是谁的发明？', opts: ['维吉尼亚', '培根', '贝拉索', '凯撒'], explain: '维吉尼亚 1586 年独创，明文延伸为密钥。' },
      en: { q: 'Who invented the autokey cipher?', opts: ['Vigenère', 'Bacon', 'Bellaso', 'Caesar'], explain: 'Vigenère in 1586 — plaintext extends the key.' } },
    { lvl: 4, a: 3,
      zh: { q: 'Bombe 的对角线板是谁加的？', opts: ['图灵', '诺克斯', '雷耶夫斯基', '韦尔奇曼'], explain: '提速约十倍，让破译走向日常。' },
      en: { q: 'Who added the diagonal board to the Bombe?', opts: ['Turing', 'Knox', 'Rejewski', 'Welchman'], explain: 'It sped the Bombe up about tenfold, making daily breaking practical.' } },
    { lvl: 4, a: 1,
      zh: { q: 'NIST 后量子标准化主打哪类方案？', opts: ['大数分解', '格基密码', '椭圆曲线', '凯撒'], explain: '如 Kyber（格）、Dilithium、SPHINCS+ 等。' },
      en: { q: 'Which family dominates NIST\'s post-quantum standard?', opts: ['Factoring', 'Lattice-based', 'Elliptic curves', 'Caesar'], explain: 'Kyber (lattice), Dilithium, SPHINCS+ and friends.' } },
    { lvl: 4, a: 0,
      zh: { q: '「IND-CCA2」安全指什么？', opts: ['自适应选择密文攻击下不可区分', '唯密文攻击下不可区分', '暴力破解不可行', '密钥可公开'], explain: '最严格的公钥加密安全模型。' },
      en: { q: 'What does "IND-CCA2" security mean?', opts: ['Indistinguishable under adaptive chosen-ciphertext attack', 'Indistinguishable under ciphertext-only attack', 'Brute force infeasible', 'Key may be public'], explain: 'The strictest security model for public-key encryption.' } },
    { lvl: 3, a: 2,
      zh: { q: 'Zimmermann 电报为什么能撼动一战？', opts: ['密码太强', '内容加密', '破译后暴露德国结盟墨西哥', '电报太长'], explain: '40 号房破译后公开，美国舆论转向参战。' },
      en: { q: 'Why did the Zimmermann Telegram shake WWI?', opts: ['The cipher was too strong', 'Its content was encrypted', 'Breaking it exposed Germany\'s Mexico alliance', 'It was too long'], explain: 'Room 40\'s break went public and swung US opinion toward war.' } },
    /* ---------- D2 扩充：+40 题（4 级 × 10） ---------- */
    { lvl: 1, a: 1,
      zh: { q: 'ROT13 的偏移量是多少？', opts: ['3', '13', '5', '26'], explain: '13 位对称，加密两次即还原。' },
      en: { q: 'What is the shift of ROT13?', opts: ['3', '13', '5', '26'], explain: 'A shift of 13 is its own inverse: encrypt twice and you are back.' } },
    { lvl: 1, a: 3,
      zh: { q: 'Atbash 密码的规则是什么？', opts: ['后移三位', '点划编码', '交换相邻字母', '字母表反序替换'], explain: 'A 对 Z、B 对 Y，希伯来古籍中已使用。' },
      en: { q: 'What is the rule of the Atbash cipher?', opts: ['Shift by three', 'Use dots and dashes', 'Swap adjacent letters', 'Reverse the alphabet'], explain: 'A maps to Z, B to Y — found in ancient Hebrew texts.' } },
    { lvl: 1, a: 2,
      zh: { q: '古希腊的斯巴达棒（Scytale）属于哪类密码？', opts: ['替换密码', '公钥密码', '换位密码', '哈希'], explain: '绕棒写字、解下重排，字母不变只换顺序。' },
      en: { q: 'What kind of cipher is the ancient Greek scytale?', opts: ['Substitution', 'Public-key', 'Transposition', 'Hash'], explain: 'Text wrapped around a rod and read off — letters keep, order changes.' } },
    { lvl: 1, a: 0,
      zh: { q: '隐写术（Steganography）与加密的区别是什么？', opts: ['隐写术隐藏信息的存在', '隐写术更安全', '隐写术需要密钥', '隐写术不可逆'], explain: '加密让内容读不懂，隐写让信息根本不被发现。' },
      en: { q: 'How does steganography differ from encryption?', opts: ['It hides that a message exists', 'It is stronger', 'It needs a key', 'It is irreversible'], explain: 'Encryption makes content unreadable; steganography hides its existence.' } },
    { lvl: 2, a: 1,
      zh: { q: '对称加密使用什么密钥？', opts: ['一对公钥私钥', '一把共享密钥', '两把不同密钥', '不需要密钥'], explain: '加解密用同一把密钥。' },
      en: { q: 'What key does symmetric encryption use?', opts: ['A public/private pair', 'One shared key', 'Two different keys', 'No key'], explain: 'The same key encrypts and decrypts.' } },
    { lvl: 2, a: 3,
      zh: { q: '「密码学」（Cryptography）一词源自希腊语的哪个含义？', opts: ['数字计算', '战争密码', '石头铭文', '隐藏书写'], explain: 'kryptós（隐藏）+ gráphein（书写）。' },
      en: { q: 'The word "cryptography" comes from Greek meaning …', opts: ['Number calculation', 'War code', 'Stone carving', 'Hidden writing'], explain: 'kryptós (hidden) + gráphein (to write).' } },
    { lvl: 2, a: 2,
      zh: { q: 'SHA-256 的输出长度是多少？', opts: ['128 位', '512 位', '256 位', '64 位'], explain: '任意输入都映射为固定的 256 位摘要。' },
      en: { q: 'How long is the SHA-256 output?', opts: ['128 bits', '512 bits', '256 bits', '64 bits'], explain: 'Any input maps to a fixed 256-bit digest.' } },
    { lvl: 2, a: 0,
      zh: { q: '「Nonce」（现时数）指什么？', opts: ['只用一次的数', '固定密码', '公钥', '哈希值'], explain: 'Number used ONCE，用来防重放攻击。' },
      en: { q: 'What is a "nonce"?', opts: ['A number used only once', 'A fixed password', 'A public key', 'A hash value'], explain: 'A number used ONCE, to prevent replay attacks.' } },
    { lvl: 1, a: 1,
      zh: { q: '猪圈密码（Pigpen）用什么表示字母？', opts: ['点与划', '方格与符号', '数字', '颜色'], explain: '把字母放进网格，用边框形状表示。' },
      en: { q: 'What does the pigpen cipher use to represent letters?', opts: ['Dots and dashes', 'Grid shapes and symbols', 'Numbers', 'Colors'], explain: 'Letters sit in grids and are shown by their border shapes.' } },
    { lvl: 2, a: 2,
      zh: { q: '公钥密码（非对称加密）使用几把密钥？', opts: ['一把', '三把', '两把（公钥 + 私钥）', '零把'], explain: '公钥加密，私钥解密。' },
      en: { q: 'How many keys does public-key (asymmetric) encryption use?', opts: ['One', 'Three', 'Two (public + private)', 'Zero'], explain: 'The public key encrypts; the private key decrypts.' } },
    { lvl: 2, a: 0,
      zh: { q: '波利比奥斯方阵（Polybius square）如何表示字母？', opts: ['行列坐标（如 23）', '点与划', '图形', '随机数'], explain: '5×5 方格中，字母用行号列号定位。' },
      en: { q: 'How does the Polybius square represent letters?', opts: ['Row-column coordinates (e.g. 23)', 'Dots and dashes', 'Pictures', 'Random numbers'], explain: 'In a 5×5 grid, each letter is a row-and-column coordinate.' } },
    { lvl: 2, a: 2,
      zh: { q: '希尔密码（Hill cipher）用什么数学工具加密？', opts: ['质因数分解', '椭圆曲线', '矩阵乘法', '斐波那契数列'], explain: '明文分组乘以密钥矩阵，Lester Hill 1929 年发表。' },
      en: { q: 'Which math tool does the Hill cipher use?', opts: ['Prime factorization', 'Elliptic curves', 'Matrix multiplication', 'Fibonacci numbers'], explain: 'Plaintext blocks are multiplied by a key matrix; published by Lester Hill in 1929.' } },
    { lvl: 2, a: 1,
      zh: { q: 'Bifid 密码的关键技巧是什么？', opts: ['矩阵求逆', '先把坐标拆分再重组（分馏）', '换位', '异或'], explain: '每个字母拆成行、列坐标，混合后再成对还原。' },
      en: { q: 'What is the key trick of the Bifid cipher?', opts: ['Matrix inversion', 'Fractionation — split then recombine coordinates', 'Transposition', 'XOR'], explain: 'Each letter splits into row and column, mixed and re-paired.' } },
    { lvl: 2, a: 3,
      zh: { q: '谁发明了阿尔伯蒂密码盘（Alberti disk）？', opts: ['凯撒', '维吉尼亚', '图灵', '阿尔伯蒂（Alberti）'], explain: '1466 年，第一个多表替换加密装置。' },
      en: { q: 'Who invented the Alberti cipher disk?', opts: ['Caesar', 'Vigenère', 'Turing', 'Leon Battista Alberti'], explain: 'In 1466 — the first polyalphabetic encryption device.' } },
    { lvl: 2, a: 0,
      zh: { q: '列换位密码（Columnar transposition）中密钥的作用是什么？', opts: ['决定列的读取顺序', '改变字母表', '生成随机数', '求逆矩阵'], explain: '按密钥排定的列顺序读写，字母不变只重排。' },
      en: { q: 'In a columnar transposition cipher, what does the key do?', opts: ['Sets the column reading order', 'Changes the alphabet', 'Generates randomness', 'Inverts the matrix'], explain: 'It orders the columns for reading; letters change only position.' } },
    { lvl: 2, a: 2,
      zh: { q: '卡尔达诺格栅（Cardan grille）是如何工作的？', opts: ['替换字母', '转动转子', '透过挖洞模板读字', '求模运算'], explain: '透过格栅孔读出字母，换一个方向再读。' },
      en: { q: 'How does a Cardan grille work?', opts: ['Substitutes letters', 'Rotates rotors', 'Reads letters through holes in a mask', 'Takes a modulus'], explain: 'Letters are read through holes in a mask, then the mask turns.' } },
    { lvl: 2, a: 1,
      zh: { q: '路易十四的「大密码」（Grand Chiffre）为何著名？', opts: ['第一个公钥密码', '两百多年无人能破', '只用一次', '从未被使用'], explain: '罗西尼奥父子设计，1890 年代才被巴泽里斯破译。' },
      en: { q: 'Why is Louis XIV\'s Great Cipher famous?', opts: ['It was the first public-key cipher', 'It stayed unbroken for over 200 years', 'It was used once', 'It was never used'], explain: 'Built by the Rossignols and unbroken until Étienne Bazeries in the 1890s.' } },
    { lvl: 2, a: 3,
      zh: { q: '书密码（Book cipher）的「密钥」是什么？', opts: ['一串数字', '一把锁', '一张地图', '一本约定的书'], explain: '用页码、行号、字序号定位明文，贝尔宝藏传说即此。' },
      en: { q: 'What is the "key" of a book cipher?', opts: ['A number string', 'A lock', 'A map', 'An agreed-upon book'], explain: 'Page, line and word positions point to plaintext — the Beale ciphers legend.' } },
    { lvl: 2, a: 0,
      zh: { q: '二战中纳瓦霍语密码通话员（Navajo code talkers）的作用是什么？', opts: ['用鲜为人知的语言传递军令', '操作 Enigma', '破译日本密码', '编写哈希算法'], explain: '纳瓦霍语外人几乎听不懂，实战中未被破译。' },
      en: { q: 'What did the Navajo code talkers do in WWII?', opts: ['Passed orders in a little-known language', 'Operated Enigma', 'Broke Japanese ciphers', 'Wrote hash algorithms'], explain: 'Navajo was nearly impossible for outsiders — and was never broken.' } },
    { lvl: 2, a: 1,
      zh: { q: 'Playfair 密码的真正发明者是谁？', opts: ['普莱费尔（Playfair）', '惠斯通（Wheatstone）', '凯撒', '培根'], explain: '惠斯通发明，因普莱费尔男爵推广而冠其名。' },
      en: { q: 'Who actually invented the Playfair cipher?', opts: ['Playfair', 'Charles Wheatstone', 'Caesar', 'Bacon'], explain: 'Wheatstone invented it; Lord Playfair popularized it and lent his name.' } },
    { lvl: 3, a: 1,
      zh: { q: 'ECB 模式的最大弱点是什么？', opts: ['太慢', '相同明文块产生相同密文块', '需要公钥', '无法解密'], explain: '密文重复泄露模式，著名的 ECB 企鹅图即此。' },
      en: { q: 'What is ECB mode\'s biggest weakness?', opts: ['It is too slow', 'Identical plaintext blocks yield identical ciphertext blocks', 'It needs a public key', 'It cannot decrypt'], explain: 'Repeated ciphertext leaks patterns — the famous ECB penguin.' } },
    { lvl: 3, a: 0,
      zh: { q: '初始化向量（IV）在分组密码模式中的作用是什么？', opts: ['使相同明文每次加密结果不同', '生成公钥', '压缩数据', '求哈希'], explain: '给第一个块一个随机起点，防止模式泄露。' },
      en: { q: 'What does an initialization vector (IV) do in block modes?', opts: ['Makes identical plaintext encrypt differently each time', 'Generates public keys', 'Compresses data', 'Computes hashes'], explain: 'It gives the first block a fresh starting point, hiding patterns.' } },
    { lvl: 3, a: 2,
      zh: { q: '填充预言攻击（Padding oracle）利用了哪一点？', opts: ['密钥泄露', '明文直接可见', '解密方对填充错误的不同反应', '哈希碰撞'], explain: '借「填充是否合法」的反馈逐字节解出明文（如 Bleichenbacher）。' },
      en: { q: 'What does a padding-oracle attack exploit?', opts: ['A leaked key', 'Directly visible plaintext', 'The decryptor\'s reaction to padding errors', 'Hash collisions'], explain: 'It uses valid-vs-invalid padding feedback to decrypt byte by byte (e.g. Bleichenbacher).' } },
    { lvl: 3, a: 3,
      zh: { q: '重合指数（Index of Coincidence）用于判断什么？', opts: ['哈希强度', '密钥内容', '公钥大小', '文本是否多表加密及密钥长度'], explain: '弗里德曼提出，测字母分布是否被多表抹平。' },
      en: { q: 'What does the Index of Coincidence measure?', opts: ['Hash strength', 'Key content', 'Public-key size', 'Whether text is polyalphabetic / its key length'], explain: 'Friedman\'s measure of whether a polyalphabetic cipher has flattened letter frequencies.' } },
    { lvl: 3, a: 0,
      zh: { q: '谁在 1932 年率先破译了 Enigma？', opts: ['马里安·雷耶夫斯基', '图灵', '香农', '凯撒'], explain: '波兰数学家雷耶夫斯基用数学与「特征法」先行破译。' },
      en: { q: 'Who first broke Enigma, in 1932?', opts: ['Marian Rejewski', 'Turing', 'Shannon', 'Caesar'], explain: 'Polish mathematician Rejewski broke it first with pure math and characteristics.' } },
    { lvl: 3, a: 1,
      zh: { q: 'AES 标准选用的算法原名是什么？', opts: ['Lucifer', 'Rijndael', 'Twofish', 'Serpent'], explain: '达门与莱门设计，2001 年胜出成为 AES。' },
      en: { q: 'What is the original name of the AES algorithm?', opts: ['Lucifer', 'Rijndael', 'Twofish', 'Serpent'], explain: 'Designed by Daemen and Rijmen; it won and became AES in 2001.' } },
    { lvl: 3, a: 2,
      zh: { q: '椭圆曲线密码（ECC）相比 RSA 的优势是什么？', opts: ['更快但更不安全', '无需密钥', '更短密钥达到同等强度', '输出更长'], explain: '短密钥即可抵抗离散对数，移动端更省资源。' },
      en: { q: 'What advantage does ECC have over RSA?', opts: ['Faster but weaker', 'No key needed', 'Shorter keys for equal strength', 'Longer outputs'], explain: 'Short keys withstand discrete-log attacks, saving resources on devices.' } },
    { lvl: 3, a: 3,
      zh: { q: '3DES 的加密顺序通常是什么？', opts: ['加密-加密-加密', '解密-解密-解密', '三个不同密钥', '加密-解密-加密'], explain: 'E-D-E 结构让 3DES 兼容单 DES。' },
      en: { q: 'What is the usual 3DES operation order?', opts: ['Encrypt-encrypt-encrypt', 'Decrypt-decrypt-decrypt', 'Three different keys', 'Encrypt-decrypt-encrypt'], explain: 'The E-D-E structure keeps 3DES compatible with single DES.' } },
    { lvl: 3, a: 0,
      zh: { q: 'HMAC 的主要用途是什么？', opts: ['验证消息完整性与真实性', '加密大文件', '生成公钥', '压缩'], explain: '带密钥的哈希，确认消息未被篡改且来自持钥方。' },
      en: { q: 'What is HMAC mainly used for?', opts: ['Verifying message integrity and authenticity', 'Encrypting large files', 'Generating public keys', 'Compression'], explain: 'A keyed hash that confirms a message was not altered and came from the key holder.' } },
    { lvl: 3, a: 1,
      zh: { q: '差分密码分析（Differential cryptanalysis）是由谁公开的？', opts: ['图灵', '比哈姆与沙米尔', '香农', '凯撒'], explain: '1990 年公开，DES 设计者其实早已考虑。' },
      en: { q: 'Who published differential cryptanalysis?', opts: ['Turing', 'Biham and Shamir', 'Shannon', 'Caesar'], explain: 'Published in 1990; the DES designers had actually known about it.' } },
    { lvl: 4, a: 0,
      zh: { q: '香农提出的「混淆与扩散」分别指什么？', opts: ['混淆=密钥与密文关系复杂化，扩散=明文影响散布到整个密文', '混淆=加密，扩散=解密', '混淆=换位，扩散=替换', '两者都指增加密钥长度'], explain: '1949 年提出，是现代分组密码设计的基石。' },
      en: { q: '"Confusion and diffusion" mean …', opts: ['Confusion obscures key–ciphertext links; diffusion spreads plaintext influence', 'Confusion encrypts; diffusion decrypts', 'Confusion transposes; diffusion substitutes', 'Both mean longer keys'], explain: 'Shannon\'s 1949 principles — the foundation of modern block-cipher design.' } },
    { lvl: 4, a: 1,
      zh: { q: '香农的「唯一解距离」（Unicity distance）指什么？', opts: ['密钥长度', '唯一确定密钥所需的最短密文长度', '破解时间', '密文冗余'], explain: '密文多到足以排除其他所有密钥为止。' },
      en: { q: 'What is Shannon\'s unicity distance?', opts: ['The key length', 'The minimum ciphertext length to uniquely determine the key', 'The break time', 'Ciphertext redundancy'], explain: 'The amount of ciphertext needed to rule out every other key.' } },
    { lvl: 4, a: 2,
      zh: { q: 'Shor 算法威胁哪类密码？', opts: ['对称密码', '哈希', '基于大数分解/离散对数的 RSA 与 ECC', '凯撒'], explain: '量子多项式时间分解大数，RSA/ECC 将失效。' },
      en: { q: 'Which ciphers does Shor\'s algorithm threaten?', opts: ['Symmetric ciphers', 'Hashes', 'RSA and ECC (factoring / discrete log)', 'Caesar'], explain: 'Quantum factoring breaks RSA and ECC in polynomial time.' } },
    { lvl: 4, a: 3,
      zh: { q: 'Grover 算法对 AES-256 的影响是什么？', opts: ['彻底破解', '无影响', '密钥减半为 64 位', '安全强度降到约 128 位'], explain: '二次加速穷举，256 位密钥只剩约 128 位安全性。' },
      en: { q: 'How does Grover\'s algorithm affect AES-256?', opts: ['Breaks it completely', 'No effect', 'Halves the key to 64 bits', 'Drops its security to ~128 bits'], explain: 'A quadratic speedup leaves a 256-bit key with only ~128 bits of security.' } },
    { lvl: 4, a: 0,
      zh: { q: '「雪崩效应」（Avalanche effect）描述的是什么？', opts: ['改一个输入位，约一半输出位翻转', '密钥越长越好', '密文越长越好', '速度越快越好'], explain: '理想密码要求微小改动引发半数比特变化。' },
      en: { q: 'What does the avalanche effect describe?', opts: ['Flipping one input bit changes about half the output bits', 'Longer keys are better', 'Longer ciphertext is better', 'Faster is better'], explain: 'A good cipher turns a one-bit change into roughly half the bits flipping.' } },
    { lvl: 4, a: 1,
      zh: { q: '前向保密（Forward secrecy）保证什么？', opts: ['密钥永不泄露', '长期密钥泄露也不危及过去会话', '算法永远保密', '密文不可重复'], explain: '每次会话用临时密钥，事后无法回溯解密。' },
      en: { q: 'What does forward secrecy guarantee?', opts: ['Keys never leak', 'Past sessions stay safe even if the long-term key leaks', 'Algorithms stay secret', 'Ciphertext never repeats'], explain: 'Ephemeral per-session keys mean old traffic cannot be decrypted later.' } },
    { lvl: 4, a: 2,
      zh: { q: 'IND-CPA 安全意味着什么？', opts: ['密钥不可破解', '密文长度隐藏', '选择明文攻击下密文不可区分', '算法保密'], explain: '攻击者无法区分两条加密消息，故需随机化加密。' },
      en: { q: 'What does IND-CPA security mean?', opts: ['The key is unbreakable', 'Ciphertext length is hidden', 'Ciphertexts are indistinguishable under chosen-plaintext attack', 'The algorithm is secret'], explain: 'An attacker cannot tell two encrypted messages apart — hence randomized encryption.' } },
    { lvl: 4, a: 3,
      zh: { q: '第一个量子密钥分发（QKD）协议是？', opts: ['RSA', 'AES', 'TLS', 'BB84'], explain: '贝内特与布拉萨尔 1984 年提出，用光子偏振分发密钥。' },
      en: { q: 'What was the first quantum key distribution protocol?', opts: ['RSA', 'AES', 'TLS', 'BB84'], explain: 'Bennett and Brassard, 1984 — key distribution via photon polarization.' } },
    { lvl: 4, a: 0,
      zh: { q: '「带误差学习」（LWE, Learning With Errors）是什么？', opts: ['后量子密码所依赖的格难题', '一种对称密码', '哈希函数', '换位密码'], explain: '解含噪声的线性方程组极难，是格密码的基础。' },
      en: { q: 'What is Learning With Errors (LWE)?', opts: ['A lattice problem underpinning post-quantum crypto', 'A symmetric cipher', 'A hash function', 'A transposition cipher'], explain: 'Solving noisy linear equations is hard — the basis of lattice cryptography.' } },
    { lvl: 4, a: 1,
      zh: { q: 'Argon2 是针对什么场景设计的算法？', opts: ['流加密', '抗 GPU 暴力的口令哈希', '公钥生成', '数据压缩'], explain: '内存困难设计，2015 年 PHC 竞赛冠军。' },
      en: { q: 'What is Argon2 designed for?', opts: ['Stream encryption', 'GPU-resistant password hashing', 'Public-key generation', 'Data compression'], explain: 'Memory-hard by design — winner of the 2015 PHC competition.' } },
    /* ---- 第四期 A7：量子时代专题 +10 题（lvl 3-4） ---- */
    { lvl: 3, a: 1,
      zh: { q: 'BB84 协议中，Alice 与 Bob 为什么要公开比对「基」？', opts: ['为了压缩数据', '只保留基一致的位作为共享密钥', '为了加速传输', '为了加密密钥'], explain: '基匹配的测量结果才可靠，构成筛选密钥；比对本身不泄露比特值。' },
      en: { q: 'In BB84, why do Alice and Bob publicly compare bases?', opts: ['To compress data', 'To keep only matching-basis bits as the shared key', 'To speed up transmission', 'To encrypt the key'], explain: 'Measurements with matching bases are reliable and form the sifted key; comparing bases reveals nothing about bit values.' } },
    { lvl: 3, a: 2,
      zh: { q: 'BB84 的安全性由什么保证？', opts: ['密钥足够长', '算法未公开', '量子力学的测不准与不可克隆', '超高速计算'], explain: '窃听必扰动量子态并留下误码指纹——安全基于物理定律而非算力。' },
      en: { q: 'What guarantees BB84\'s security?', opts: ['Long keys', 'A secret algorithm', 'Quantum uncertainty and no-cloning', 'Faster computers'], explain: 'Eavesdropping disturbs quantum states and leaves error fingerprints — security rests on physics, not computing power.' } },
    { lvl: 3, a: 0,
      zh: { q: '威斯纳约 1970 年写成的《共轭编码》最初遭遇了什么？', opts: ['被多家期刊拒稿、沉睡十余年', '立即获得专利', '登上《自然》封面', '被 NSA 立即采用'], explain: '思想过于超前屡遭拒稿，直到贝内特与布拉萨德重新发现才催生 BB84。' },
      en: { q: 'What first became of Wiesner\'s "Conjugate Coding" (c. 1970)?', opts: ['Rejected by journals, dormant for a decade', 'Instantly patented', 'On the cover of Nature', 'Adopted by the NSA at once'], explain: 'Too far ahead of its time; Bennett and Brassard rediscovered it and BB84 was born.' } },
    { lvl: 4, a: 3,
      zh: { q: 'Shor 算法把大数分解的计算复杂度降到哪一档？', opts: ['指数级', 'O(n²)', '对数级', '多项式级'], explain: '多项式时间分解意味着经典难解问题在量子机上可解。' },
      en: { q: 'To what complexity class does Shor\'s algorithm reduce factoring?', opts: ['Exponential', 'O(n²)', 'Logarithmic', 'Polynomial'], explain: 'Polynomial-time factoring means classically hard problems become solvable on a quantum machine.' } },
    { lvl: 4, a: 1,
      zh: { q: '「先截获、后解密」（Harvest now, decrypt later）威胁的是？', opts: ['今天的对称密码', '保密期跨越数十年的数据', '哈希函数', '所有摩斯通信'], explain: '对手囤积今日密文等量子机成熟回放解读——长寿命机密现在就要后量子保护。' },
      en: { q: 'Whom does "harvest now, decrypt later" threaten?', opts: ['Today\'s symmetric ciphers', 'Data whose secrecy must span decades', 'Hash functions', 'All Morse traffic'], explain: 'Adversaries warehouse today\'s ciphertext for tomorrow\'s quantum machines — long-lived secrets need post-quantum protection now.' } },
    { lvl: 4, a: 2,
      zh: { q: '2022 年 SIKE 在后量子竞选中被怎样的攻击击倒？', opts: ['超级计算机穷举', '量子计算机演示', '一台普通笔记本约一小时', '侧信道监听'], explain: 'Castryck-Decru 用经典数学攻击在笔记本上破译——公开评审的价值所在。' },
      en: { q: 'How was SIKE broken in the 2022 NIST tournament?', opts: ['Supercomputer brute force', 'A live quantum computer', 'An ordinary laptop in about an hour', 'Side-channel listening'], explain: 'The Castryck–Decru classical attack felled it on a laptop — proof open vetting works.' } },
    { lvl: 4, a: 0,
      zh: { q: 'NIST 后量子标准 ML-KEM（FIPS 203）源自哪个提交方案？', opts: ['CRYSTALS-Kyber', 'SIKE', 'Rainbow', 'SPHINCS+'], explain: 'Kyber 经标准化成为 ML-KEM；SPHINCS+ 则演化为 SLH-DSA（FIPS 205）。' },
      en: { q: 'Which submission became NIST\'s ML-KEM (FIPS 203)?', opts: ['CRYSTALS-Kyber', 'SIKE', 'Rainbow', 'SPHINCS+'], explain: 'Kyber was standardized as ML-KEM; SPHINCS+ became SLH-DSA (FIPS 205).' } },
    { lvl: 4, a: 1,
      zh: { q: '格密码为何被认为能抵抗量子攻击？', opts: ['密钥特别长', '其核心难题尚无高效量子解法（Shor 无用武之地）', '它运行更快', '它不使用数学'], explain: '最短向量等问题没有已知的量子多项式时间算法。' },
      en: { q: 'Why are lattice ciphers considered quantum-resistant?', opts: ['Their keys are longer', 'Their core problems lack known efficient quantum attacks — Shor has no purchase', 'They run faster', 'They use no math'], explain: 'Shortest-vector-type problems have no known polynomial-time quantum algorithms.' } },
    { lvl: 4, a: 3,
      zh: { q: '2017 年实现星地量子密钥分发、把 BB84 搬上太空的卫星是？', opts: ['旅行者一号', '哈勃', '北斗三号', '墨子号'], explain: '「墨子号」2016 年升空，次年完成星地 QKD 与洲际量子保密通话。' },
      en: { q: 'Which satellite achieved space-to-ground QKD in 2017, lifting BB84 into orbit?', opts: ['Voyager 1', 'Hubble', 'BeiDou-3', 'Micius'], explain: 'Launched in 2016, Micius completed space-to-ground QKD and intercontinental quantum-secured calls.' } },
    { lvl: 3, a: 2,
      zh: { q: '面对 Grover 算法，对称密码的标准对策是？', opts: ['换用公钥密码', '放弃加密', '将密钥长度加倍（如 AES-256）', '减少加密轮数'], explain: '√N 加速只需密钥加倍抵消——AES-256 因此依然安全。' },
      en: { q: 'Against Grover\'s algorithm, what is the standard countermeasure for symmetric ciphers?', opts: ['Switch to public-key crypto', 'Abandon encryption', 'Double the key length (e.g., AES-256)', 'Reduce cipher rounds'], explain: 'A √N speedup is neutralized by doubling the key — AES-256 stays secure.' } },
    /* ---------- 第八期扩充：国密 / 门限分享 / 协议与社会工程 ---------- */
    { lvl: 1, a: 0,
      zh: { q: '收到「中奖 80 万，先付 3000 手续费」的邮件，最该警觉的信号是？', opts: ['领奖先交钱', '邮件里有感叹号', '对方很热情', '金额太大'], explain: '「先付费后领奖」是经典骗局铁律——真奖品从不向赢家收费。' },
      en: { q: 'An email says you won $800,000 but must pay a $3000 fee first. The biggest red flag?', opts: ['Pay-first prize', 'Exclamation marks', 'Friendly tone', 'The large amount'], explain: 'Pay-to-claim is the classic scam rule — real prizes never charge the winner.' } },
    { lvl: 2, a: 2,
      zh: { q: '隐写术与加密的根本区别是？', opts: ['隐写更快', '加密用密钥而隐写不用', '隐写隐藏「存在秘密」这件事，加密只隐藏内容', '二者没有区别'], explain: '加密把信锁进保险箱，隐写把信画成墙纸——被看见的资格都没有。' },
      en: { q: 'The fundamental difference between steganography and encryption?', opts: ['Stego is faster', 'Encryption needs keys, stego doesn\'t', 'Stego hides that a secret EXISTS; encryption only hides content', 'No difference'], explain: 'Encryption locks the letter in a safe; steganography paints it into wallpaper.' } },
    { lvl: 2, a: 1,
      zh: { q: 'k=3 的门限秘密分享方案中，拿到几份份额才能还原秘密？', opts: ['任意 1 份', '至少 3 份', '全部 n 份', '2 份就够'], explain: '门限 k 的含义：少于 k 份在信息论上毫无线索，k 点唯一确定 k−1 次多项式。' },
      en: { q: 'In a k=3 threshold secret-sharing scheme, how many shares recover the secret?', opts: ['Any 1 share', 'At least 3', 'All n shares', 'Just 2'], explain: 'Threshold semantics: fewer than k gives zero information; k points fix a unique degree-(k−1) polynomial.' } },
    { lvl: 2, a: 0,
      zh: { q: '老板「紧急」要求你买礼品卡并拍照发卡号密码——这最可能是？', opts: ['冒充上司的诈骗', '新的报销流程', '公司福利活动', '合规的采购请求'], explain: '礼品卡不可追回+制造「不能电话核实」的情境=CEO 诈骗的标准剧本。' },
      en: { q: 'Your boss "urgently" asks you to buy gift cards and photograph the codes. Most likely?', opts: ['CEO-impersonation fraud', 'A new reimbursement flow', 'A company perk', 'Compliant procurement'], explain: 'Irreversible gift cards plus "can\'t verify by phone" pressure is the standard CEO-fraud script.' } },
    { lvl: 3, a: 3,
      zh: { q: '中国商用分组密码标准 SM4 的分组与密钥长度是？', opts: ['64 位 / 64 位', '128 位 / 256 位', '256 位 / 128 位', '128 位 / 128 位'], explain: 'SM4（GB/T 32907-2016，曾用名 SMS4）：128 位分组与密钥、32 轮非平衡 Feistel。' },
      en: { q: 'China\'s commercial block cipher SM4 uses which block/key sizes?', opts: ['64/64 bits', '128/256 bits', '256/128 bits', '128/128 bits'], explain: 'SM4 (GB/T 32907-2016, once SMS4): 128-bit blocks and keys, 32 unbalanced-Feistel rounds.' } },
    { lvl: 3, a: 1,
      zh: { q: 'SM4 解密时轮密钥的使用顺序是？', opts: ['与加密相同', '反序使用（rk31→rk0）', '只用偶数编号', '每轮重新扩展'], explain: 'Feistel 结构的美德：解密与加密同构，仅轮密钥反序。' },
      en: { q: 'In what order does SM4 decryption use round keys?', opts: ['Same as encryption', 'Reversed (rk31→rk0)', 'Even-numbered only', 'Re-expanded each round'], explain: 'Feistel elegance: decryption mirrors encryption with reversed round keys.' } },
    { lvl: 3, a: 2,
      zh: { q: 'Shamir 门限方案的数学根基是？', opts: ['大数分解', '离散对数', '拉格朗日插值：k 点唯一确定 k−1 次多项式', '格上最短向量'], explain: '任意 k 个点确定唯一 k−1 次曲线，常数项即秘密；少于 k 则一无所知。' },
      en: { q: 'The mathematical foundation of Shamir\'s threshold scheme is…', opts: ['Integer factoring', 'Discrete logarithm', 'Lagrange interpolation: k points fix a unique degree-(k−1) polynomial', 'Shortest lattice vectors'], explain: 'Any k points define the curve uniquely; its constant term is the secret.' } },
    { lvl: 3, a: 0,
      zh: { q: 'TLS 1.3 相对早期版本的重要改进是？', opts: ['ServerHello 之后几乎全加密，且强制（EC）DHE 前向安全', '改用纯对称加密', '取消了证书验证', '握手明文更多以便调试'], explain: 'TLS 1.3 让握手元数据也进密文，并废弃无前向安全的 RSA 密钥传输。' },
      en: { q: 'A key TLS 1.3 improvement over earlier versions?', opts: ['Nearly everything after ServerHello is encrypted, with mandatory (EC)DHE forward secrecy', 'Purely symmetric design', 'Certificate verification removed', 'More plaintext for debugging'], explain: 'TLS 1.3 encrypts handshake metadata and drops non-forward-secret RSA key transport.' } },
    { lvl: 3, a: 1,
      zh: { q: 'ChaCha20 的 quarter-round 由哪三类运算交替组成？', opts: ['乘法、除法、查表', '加法、异或、循环移位', '置换、代换、模幂', '减法、或、右移'], explain: '无查表设计带来常数时间执行——没有缓存时序侧信道可挖。' },
      en: { q: 'ChaCha20\'s quarter-round alternates which three operation types?', opts: ['Multiply, divide, table lookup', 'Addition, XOR, rotation', 'Permutation, substitution, modexp', 'Subtract, OR, right-shift'], explain: 'Table-free design gives constant-time execution — no cache-timing side channel to mine.' } },
    { lvl: 4, a: 2,
      zh: { q: 'GSM 的 A5/1 流密码于哪一年被彩虹表实测攻破？', opts: ['1999 年理论提出即告破', '2004 年', '2009 年 Karsten Nohl 团队实测', '至今未被破'], explain: '2009 年 Nohl 在 26C 大会展示用廉价 GPU 集群实时还原会话密钥——A5/1 从此只活在教科书里。' },
      en: { q: 'In which year was GSM\'s A5/1 stream cipher practically broken via rainbow tables?', opts: ['1999, broken as soon as theorized', '2004', '2009 by Karsten Nohl\'s team', 'Never broken'], explain: 'At 26C in 2009 Nohl demonstrated real-time session-key recovery with cheap GPUs — A5/1 now lives in textbooks only.' } },
    /* ---------- 第十期补题：薄弱章节 + 哈希攻破史 ---------- */
    { lvl: 1, a: 1,
      zh: { q: '罗塞塔石碑最重要的破译价值在于什么？', opts: ['同一内容用三种文字书写', '它是世界上最古老的文物', '上面有凯撒的签名', '它是一把真实的钥匙'], explain: '未知象形文 + 半懂世俗体 + 完全可读希腊文——同一内容的三个编码版本，破译者只需找对应关系。' },
      en: { q: 'What makes the Rosetta Stone so valuable for decipherment?', opts: ['Same text in three scripts', 'Oldest artifact ever found', 'Caesar\'s signature on it', 'It\'s a real key'], explain: 'Unknown hieroglyphs + semi-readable demotic + fully readable Greek — three encodings of one message.' } },
    { lvl: 2, a: 0,
      zh: { q: '中途岛战役前，美军让中途岛用低级密码发「淡水短缺」假电报，目的是？', opts: ['让日军用密码暴露 AF 就是中途岛', '测试中途岛的通信能力', '向美军部队运送淡水', '干扰日军的雷达'], explain: '日军截获后用密码报告「AF 淡水短缺」——AF 的身份就此锁定，这就是经典的「淡水陷阱」。' },
      en: { q: 'Before Midway, the US had Midway send a fake "water shortage" message in weak cipher. Why?', opts: ['Make Japan reveal AF = Midway in cipher', 'Test Midway\'s radio', 'Ship fresh water', 'Jam Japanese radar'], explain: 'Japan intercepted and reported "AF short of water" in cipher — AF\'s identity was confirmed. The classic "water trap".' } },
    { lvl: 2, a: 2,
      zh: { q: '钓鱼邮件中「领奖先交手续费」的套路为什么总能骗到人？', opts: ['手续费太便宜', '受害者太蠢', '沉没成本+侥幸心理让人越陷越深', '银行会退钱'], explain: '先交小额「手续费」后，受害者倾向于继续追加投入以「拿回」之前的钱——这是经典的沉没成本陷阱。' },
      en: { q: 'Why does the "pay a small fee to claim your prize" scam keep working?', opts: ['The fee is cheap', 'Victims are stupid', 'Sunk cost + wishful thinking deepen the trap', 'Banks refund it'], explain: 'After paying once, victims tend to pay more to "recover" the earlier amount — the classic sunk-cost trap.' } },
    { lvl: 3, a: 1,
      zh: { q: '2004 年王小云团队的 MD5 碰撞攻击为什么震撼密码学界？', opts: ['MD5 太老了没人用', '碰撞意味着数字签名可被伪造', '她破解了 RSA', 'MD5 密钥太短'], explain: '数字签名依赖「找不到两份不同文件有同一哈希」——碰撞攻击直接击穿这个前提，SSL 证书和代码签名全部受影响。' },
      en: { q: 'Why was Xiaoyun Wang\'s 2004 MD5 collision attack so devastating?', opts: ['MD5 was old and unused', 'Collisions break digital signatures', 'She cracked RSA', 'MD5 key too short'], explain: 'Signatures rely on "no two files share a hash" — collisions shatter that premise, affecting SSL certs and code signing.' } },
    { lvl: 3, a: 0,
      zh: { q: '2017 年 SHAttered 攻击对 SHA-1 做了什么？', opts: ['用约 6500 CPU 年造出两份内容不同但 SHA-1 相同的 PDF', '暴力穷举了全部 2^160 种输入', '找到了 SHA-1 的密钥', '把 SHA-1 改造成了加密算法'], explain: '这不是暴力穷举而是密码分析（继承王小云团队的思路）——两个内容不同的 PDF 拥有同一 SHA-1 指纹，签名体系的地基动摇。' },
      en: { q: 'What did the 2017 SHAttered attack do to SHA-1?', opts: ['Used ~6,500 CPU-years to craft two different PDFs with the same SHA-1', 'Brute-forced all 2^160 inputs', 'Found SHA-1\'s secret key', 'Turned SHA-1 into an encryption algorithm'], explain: 'Not brute force but cryptanalysis (building on Wang\'s team\'s work) — two different PDFs sharing one SHA-1 fingerprint shook the signature ecosystem.' } },
    { lvl: 3, a: 2,
      zh: { q: 'Merkle-Damgård 结构（SHA-1/MD5）的长度扩展攻击根源是？', opts: ['密钥太短', '输出可以逆推输入', 'H(secret‖msg) 的输出就是下一步压缩的完整内部状态', '填充不安全'], explain: '算法的最终输出 = 内部链式状态的「透传」——攻击者不需要密钥就能从 MAC 接力计算 H(secret‖msg‖glue‖evil) 的合法 MAC。' },
      en: { q: 'What makes Merkle-Damgård (SHA-1/MD5) vulnerable to length extension?', opts: ['Short keys', 'Output reversible to input', 'H(secret‖msg) output IS the full internal chaining state for the next block', 'Unsafe padding'], explain: 'The final output is a passthrough of the internal chaining state — an attacker chains from the MAC to forge H(secret‖msg‖glue‖evil) without the key.' } },
    { lvl: 3, a: 0,
      zh: { q: '中途岛战役中「JN-25 的深度」指的是什么？', opts: ['同一版加表期内的多封电报可相减消去加表', '电报的物理厚度', '密码本的页数', '潜艇下潜深度'], explain: '同版加表期内多封电报共享同一张表——两封相减加表抵消，只剩明文差值。破译员据此逐列反推。' },
      en: { q: 'In the Battle of Midway, what does "JN-25 depth" refer to?', opts: ['Multiple messages under the same additive cancel it out when subtracted', 'Physical thickness of telegrams', 'Codebook page count', 'Submarine dive depth'], explain: 'Messages within the same additive period share the table — subtracting two cancels the additive, leaving plaintext differences for column-by-column recovery.' } },
    { lvl: 3, a: 3,
      zh: { q: '紫密（Purple）的步进规律为什么让美军初期束手无策？', opts: ['它没有步进规律', '步进太快跟不上', '六个元音和二十个辅音走两条完全不同的路', '它用的是量子密钥'], explain: '六元音组走「六段路」、二十辅音走「二十段路」——两条路径的步进规律完全不同，按转子机器的思路去解永远撞墙。' },
      en: { q: 'Why did Purple\'s stepping pattern initially stump US cryptanalysts?', opts: ['It had no pattern', 'Too fast to track', 'Six vowels and twenty consonants follow completely different paths', 'It used quantum keys'], explain: 'The six-vowel group and twenty-consonant group step in entirely different rhythms — attacking it as a rotor machine hits a wall.' } },
    { lvl: 4, a: 1,
      zh: { q: '为什么 HMAC 结构能免疫长度扩展攻击？', opts: ['它用了更长的密钥', '两层嵌套使得中间状态不外泄', '它不用填充', '它每次换密钥'], explain: 'HMAC = H((k⊕opad) ‖ H((k⊕ipad) ‖ msg))——外层哈希从新的 IV 开始，内层输出被完全遮蔽，攻击者没有可接力的内部状态。' },
      en: { q: 'Why is HMAC immune to length extension?', opts: ['Longer key', 'Two-layer nesting hides the intermediate state', 'No padding used', 'Key changes each time'], explain: 'HMAC = H((k⊕opad) ‖ H((k⊕ipad) ‖ msg)) — the outer hash starts from a fresh IV and the inner output is fully absorbed; no state to chain from.' } },
    /* ---------- 第十二期补题：线性分析 / AEAD / CSPRNG / GCM / Poly1305 / SHA-3 / Miller-Rabin ---------- */
    { lvl: 3, a: 0,
      zh: { q: '线性分析攻击分组密码的核心思想是？', opts: ['寻找明文/密文/密钥比特间的高概率线性近似', '暴力穷举所有密钥', '利用时序差异提取密钥', '伪造证书链'], explain: 'Matsui 1993 年对 DES 首次公开线性分析——通过大量已知明密文对统计比特间的线性偏置。' },
      en: { q: 'What is the core idea of linear cryptanalysis against block ciphers?', opts: ['Find high-probability linear approximations among plaintext/ciphertext/key bits', 'Brute-force all keys', 'Exploit timing differences', 'Forge certificate chains'], explain: 'Mitsuru Matsui first applied linear analysis to DES in 1993 — statistically exploiting biased linear relations over many known pairs.' } },
    { lvl: 3, a: 2,
      zh: { q: '差分分析与线性分析的根本区别是？', opts: ['差分用选择明文，线性用已知明文', '差分只对 DES 有效', '线性分析更快', '没有区别'], explain: '差分分析（Biham-Shamir 1991）需要选择明文控制差分；线性分析（Matsui 1993）只用已知明文统计偏置。' },
      en: { q: 'The fundamental difference between differential and linear cryptanalysis?', opts: ['Differential uses chosen plaintext; linear uses known plaintext', 'Differential only works on DES', 'Linear is faster', 'No difference'], explain: 'Differential (Biham-Shamir 1991) needs chosen plaintexts to control differences; linear (Matsui 1993) statistically exploits bias from known pairs only.' } },
    { lvl: 3, a: 1,
      zh: { q: 'AEAD（认证加密）相比「加密+拼接 MAC」的核心优势是？', opts: ['密文更短', '加密与认证在单个原子操作中完成，不会因顺序不当而泄露', '不需要密钥', '可以解密两次'], explain: 'TLS 1.0 时代的 MAC-then-Encrypt 顺序曾导致 padding oracle 攻击——AEAD（如 GCM/ChaCha20-Poly1305）把两步合成一个不可拆分的原子操作。' },
      en: { q: 'AEAD\'s core advantage over "encrypt-then-append-MAC"?', opts: ['Shorter ciphertext', 'Encryption and authentication in one atomic operation, immune to ordering mistakes', 'No key needed', 'Can decrypt twice'], explain: 'TLS 1.0-era MAC-then-Encrypt ordering caused padding oracle attacks — AEAD (GCM/ChaCha20-Poly1305) fuses both into one indivisible operation.' } },
    { lvl: 3, a: 0,
      zh: { q: 'GCM 模式中 nonce 重用的后果是？', opts: ['认证密钥泄露，攻击者可伪造任意密文', '只是加密强度降低', '没有后果', '性能提升'], explain: 'GCM 的认证标签由密钥流与消息共同决定——nonce 重用使攻击者可以恢复认证子密钥并伪造任意标签。' },
      en: { q: 'What happens when a GCM nonce is reused?', opts: ['Authentication key leaks, allowing arbitrary tag forgery', 'Only encryption strength drops', 'No consequence', 'Performance improves'], explain: 'GCM\'s authentication tag depends on the keystream and message — nonce reuse lets an attacker recover the auth subkey and forge any tag.' } },
    { lvl: 3, a: 1,
      zh: { q: 'Poly1305 与 ChaCha20 的关系是？', opts: ['Poly1305 加密，ChaCha20 认证', 'ChaCha20 加密，Poly1305 认证——组合为 AEAD', '两者都是哈希函数', '两者都是流密码'], explain: 'ChaCha20 负责加密（流密码），Poly1305 负责认证（一次性 MAC）——组合即 RFC 8439 定义的 ChaCha20-Poly1305 AEAD。' },
      en: { q: 'What is the relationship between Poly1305 and ChaCha20?', opts: ['Poly1305 encrypts, ChaCha20 authenticates', 'ChaCha20 encrypts, Poly1305 authenticates — together they form an AEAD', 'Both are hash functions', 'Both are stream ciphers'], explain: 'ChaCha20 encrypts (stream cipher), Poly1305 authenticates (one-time MAC) — combined as the ChaCha20-Poly1305 AEAD defined in RFC 8439.' } },
    { lvl: 3, a: 2,
      zh: { q: 'SHA-3 与 SHA-2 的核心结构区别是？', opts: ['SHA-3 用 Merkle-Damgård，SHA-2 用海绵', 'SHA-3 用海绵结构（Keccak），天然免疫长度扩展', 'SHA-3 有密钥', '没有区别'], explain: 'SHA-3 的 Keccak 海绵结构吸收-挤压数据，不再使用 MD 结构的链式状态——长度扩展攻击对它无效。' },
      en: { q: 'The core structural difference between SHA-3 and SHA-2?', opts: ['SHA-3 uses Merkle-Damgård; SHA-2 uses sponge', 'SHA-3 uses the sponge construction (Keccak), naturally immune to length extension', 'SHA-3 has a key', 'No difference'], explain: 'SHA-3\'s Keccak sponge absorbs and squeezes data without the chained state of MD constructions — length extension doesn\'t apply.' } },
    { lvl: 3, a: 1,
      zh: { q: 'Miller-Rabin 素性测试为什么被广泛使用？', opts: ['它是确定性的', '误判率可控制在任意低（如 2⁻¹²⁸），速度远快于试除法', '不需要数学', '只能测试小数字'], explain: '每次测试误判率 ≤ 1/4，重复 k 次误判率 ≤ 4⁻ᵏ——RSA/SM4 密钥生成的标准步骤。' },
      en: { q: 'Why is the Miller-Rabin primality test so widely used?', opts: ['It\'s deterministic', 'Error rate controllable to any level (e.g. 2^-128), far faster than trial division', 'No math needed', 'Only works on small numbers'], explain: 'Each round has ≤1/4 error rate; repeating k times gives ≤4^-k — the standard step in RSA/SM4 key generation.' } },
    { lvl: 4, a: 0,
      zh: { q: 'Poly1305 为什么是「一次性」MAC？', opts: ['每个密钥只能安全认证一条消息', '它只能运行一次', '一次性密码本的缩写', '它自动销毁'], explain: 'Poly1305 的密钥是每次调用时生成的单次性 pad——同一密钥认证两条消息会泄露认证子密钥，因此必须每条消息换密钥。' },
      en: { q: 'Why is Poly1305 a "one-time" MAC?', opts: ['Each key safely authenticates only one message', 'It runs only once', 'It\'s an OTP abbreviation', 'It self-destructs'], explain: 'Poly1305\'s key is a per-call one-time pad — authenticating two messages with the same key leaks the authentication subkey, so each message needs a fresh key.' } },
    { lvl: 1, a: 0,
      zh: { q: '码（CODE）与密码（CIPHER）的本质区别是？', opts: ['码整词对照替换，密码逐字母变换', '码比密码古老，密码已淘汰', '两者完全等价', '码是数字、密码是字母'], explain: '码(code)是词→词的对照（如密码本），密码(cipher)是逐字母的变换——破译两者的手段完全不同。' },
      en: { q: 'What is the difference between a code and a cipher?', opts: ['Codes replace whole words; ciphers transform letters', 'Codes are older and ciphers are obsolete', 'They are exactly equivalent', 'Codes are numeric, ciphers alphabetic'], explain: 'A code maps words via a codebook; a cipher transforms letters one by one — breaking them requires different methods.' } },
    { lvl: 2, a: 3,
      zh: { q: '维吉尼亚密码的密钥周期常常用哪种方法检测？', opts: ['凯撒试错', '频率统计', '简森试验', '卡西斯基测试'], explain: '重复密钥段的间距是密钥周期的整数倍，卡西斯基从重复词块的距离反推周期，再分列做频率分析。' },
      en: { q: 'Which method is often used to detect the Vigenere key period?', opts: ['Caesar trial and error', 'Frequency counting', 'The Jensen test', 'The Kasiski examination'], explain: 'Repeated key strands make repeated blocks at multiples of the period — Kasiski found the period from repeated fragments, then attacked each column by frequency.' } },
    { lvl: 3, a: 1,
      zh: { q: 'Diffie-Hellman 类密钥交换的安全基础是什么？', opts: ['大整数因子分解难解', '有限域离散对数难解', '哈希碰撞难解', '格基归约难解'], explain: '双方只交换公开值 g^x、g^y，攻击者求 x 需解离散对数——与 RSA 的因子分解难题不同。' },
      en: { q: 'What is the security basis of Diffie-Hellman key exchange?', opts: ['Hard integer factorization', 'Hard discrete logarithms in finite fields', 'Hard hash collisions', 'Hard lattice reduction'], explain: 'Parties only exchange g^x and g^y; reversing the exponent requires solving discrete logarithms — distinct from RSA factorization.' } },
    { lvl: 3, a: 2,
      zh: { q: '模幂运算为什么要用「平方乘」（Square-and-multiply）算法？', opts: ['为了节省存储空间', '为了生成随机密钥', 'O(log n) 次乘法替代 O(n) 次', '为了抗侧信道攻击'], explain: '把指数按二进制位拆分：平方与选择性相乘，把 n 次连乘压到约 2×log₂n 次——RSA、DH 都靠它。' },
      en: { q: 'Why does modular exponentiation use the Square-and-multiply algorithm?', opts: ['To save memory', 'To generate random keys', 'O(log n) multiplications instead of O(n)', 'To resist side channels'], explain: 'Processing the exponent bitwise turns n repeated multiplications into ~2-log2-n multiplications — vital for RSA and DH.' } },
    { lvl: 4, a: 0,
      zh: { q: 'CTR 模式下，每个密文块是这样得到的：', opts: ['明文块 XOR 密钥加密的计数器', '明文块整体加密', '计数器按链式加密', '明文块与密钥异或'], explain: 'CTR 用 E(计数器值) 作为一次性 pad 与明文异或——可并行、无需填充，但计数器绝不能复用。' },
      en: { q: 'In CTR mode, each ciphertext block is obtained by:', opts: ['plaintext XOR E(counter)', 'encrypting the plaintext block as a whole', 'chaining the counters', 'XORing the plaintext with the key'], explain: 'CTR uses E(counter) as a one-time pad XORed with plaintext — parallelizable and padding-free, but counters must never repeat.' } },
    { lvl: 4, a: 1,
      zh: { q: 'GCM 认证加密组合了哪两种结构？', opts: ['CBC + HMAC', 'CTR + GHASH（伽罗瓦域哈希）', 'ECB + OTP', '瀑布 + 栅栏'], explain: 'GCM 用 CTR 保密、用 GHASH 认证——在伽罗瓦域 GF(2^128) 上做乘法构造认证标签，一次处理一块。' },
      en: { q: 'Which two structures does GCM authenticated encryption combine?', opts: ['CBC + HMAC', 'CTR + GHASH (Galois-field hashing)', 'ECB + OTP', 'Cascades + fences'], explain: 'GCM uses CTR for secrecy and GHASH in GF(2^128) for authentication — a multiplication-based tag, one block at a time.' } },
    { lvl: 2, a: 1,
      zh: { q: 'AES 每一轮的四步变换顺序是？', opts: ['SubBytes→ShiftRows→MixColumns→AddRoundKey', 'AddRoundKey→MixColumns→ShiftRows→SubBytes', '四步同时并行执行', '顺序随机，由密钥决定'], explain: '先字节替换提供混淆，行移位与列混淆扩散，最后异或轮密钥注入密钥——十轮重复后输出密文。' },
      en: { q: 'What is the order of the four AES round transformations?', opts: ['SubBytes, ShiftRows, MixColumns, AddRoundKey', 'AddRoundKey, MixColumns, ShiftRows, SubBytes', 'All four in parallel', 'Random, key-dependent order'], explain: 'S-box substitution confuses; row shifts and column mixing diffuse; the final XOR injects the key. Ten rounds produce the ciphertext.' } },
    { lvl: 3, a: 0,
      zh: { q: '如果 AES 去掉 SubBytes（只留移位和异或），会发生什么？', opts: ['整个 AES 变成一个大线性方程组，高斯消元即可破解', '安全性不变，只是变慢', '只影响最后一轮', '密钥长度需要加倍'], explain: '移位与 XOR 都是线性运算；没有 S 盒的非线性，加密就是矩阵乘法——解线性方程即可还原明文与密钥。' },
      en: { q: 'What if AES dropped SubBytes and kept only shifts and XOR?', opts: ['It becomes one big linear system solvable by Gaussian elimination', 'Security unchanged, just slower', 'Only the last round is affected', 'Key length must double'], explain: 'Shifts and XOR are linear; without the S-box\'s nonlinearity encryption is matrix arithmetic — solve the system to recover plaintext and key.' } },
    { lvl: 1, a: 2,
      zh: { q: '「correct-horse-battery-staple」这类四个随机单词的短语为什么强？', opts: ['包含特殊字符', '单词来自词典无法猜测', '熵随长度指数增长，28 位长短语超过多数乱串', '因为它出自漫画'], explain: '每个随机词贡献约 10-13 比特熵；长口令的记忆成本远低于同熵值的随机符号串。' },
      en: { q: 'Why is a four-random-word passphrase like correct-horse-battery-staple strong?', opts: ['It has special characters', 'Dictionary words are unguessable', 'Entropy grows exponentially with length — 28 characters beats most gibberish', 'It comes from a comic'], explain: 'Each random word contributes roughly 10-13 bits of entropy; long phrases cost far less memory than equal-entropy random symbols.' } },
    { lvl: 3, a: 1,
      zh: { q: '网站存储用户口令的正确姿势是？', opts: ['MD5 哈希后存库', '加盐的慢哈希（bcrypt/Argon2）', 'AES 加密存库，密钥放配置文件', 'Base64 编码混淆'], explain: 'MD5 太快可暴力；可解密的存储在密钥泄露时全灭；只有故意慢、内存困难的 KDF 能让离线穷举成本高到不可行。' },
      en: { q: 'What is the right way for a website to store user passwords?', opts: ['Store MD5 hashes', 'Salted slow hashes (bcrypt/Argon2)', 'AES-encrypt them, key in a config file', 'Base64 obfuscation'], explain: 'MD5 is brute-forceable fast; decryptable storage dies with its key; only deliberately slow memory-hard KDFs make offline cracking infeasible.' } },
    { lvl: 3, a: 0,
      zh: { q: 'PGP 加密一封大邮件时，RSA 公钥算法加密的是什么？', opts: ['只加密一把随机会话密钥', '整封邮件正文', '发送方的私钥', '收件人的公钥'], explain: '混合加密：正文交给快速的对称密码，昂贵的公钥运算只保护那把一次性会话密钥——HTTPS 握手同理。' },
      en: { q: 'When PGP encrypts a large email, what does the RSA public-key step encrypt?', opts: ['Only a random session key', 'The entire message body', "The sender's private key", "The recipient's public key"], explain: 'Hybrid design: fast symmetric ciphers carry the body; costly public-key math protects only the one-time session key — exactly how HTTPS handshakes work.' } },
    { lvl: 2, a: 1,
      zh: { q: 'PGP 用户互相签署对方公钥形成的「信任之网」，替代了什么？', opts: ['对称加密算法', '中心化证书机构（CA）层级', '邮件服务器', '哈希函数'], explain: 'Web of Trust 用人际签名网络背书公钥真实性——去中心化的信任模型，与 TLS 世界由 CA 签发证书形成鲜明对照。' },
      en: { q: 'The PGP Web of Trust, where users sign each other\'s keys, replaces what?', opts: ['Symmetric ciphers', 'Centralized certificate-authority hierarchies', 'Mail servers', 'Hash functions'], explain: 'Trust flows through personal signature networks endorsing key authenticity — decentralized trust versus the CA-signed certificates of the TLS world.' } },
    { lvl: 4, a: 2,
      zh: { q: '比特币挖矿难度上调一档（前导零多一个），全网期望尝试次数如何变化？', opts: ['翻倍', '不变，只是验证更慢', '乘以 16（十六进制每一位贡献 1/16）', '乘以 256'], explain: '十六进制每位有 16 种取值，多一个前导零即概率除以 16——难度是指数曲线，这正是 ASIC 专业化的根源。' },
      en: { q: 'Bitcoin difficulty rises by one leading hex zero. What happens to expected tries?', opts: ['They double', 'Unchanged, verification slows', 'Multiply by 16 (each hex digit contributes 1/16)', 'Multiply by 256'], explain: 'Each hex digit has 16 outcomes; one more leading zero divides hit probability by 16 — an exponential curve that explains ASIC specialization.' } },
    { lvl: 3, a: 1,
      zh: { q: '攻击者控制了比特币 51% 算力，以下哪件事他做不到？', opts: ['撤销自己刚花出去的交易（双花）', '阻止他人交易被打包确认', '伪造别人的私钥签名转走他人余额', '凭空铸造超出奖励的新币'], explain: '算力可以重组链、审查交易，但花钱必须有你私钥签的名——51% 攻击的破坏边界止步于双花与审查。' },
      en: { q: 'With 51% of Bitcoin hashpower, which feat remains impossible?', opts: ['Reversing your own recent spend (double-spend)', 'Censoring others\' transactions', 'Forging other people\'s signatures to steal their balances', 'Minting coins beyond the block reward from thin air'], explain: 'Hashpower reorganizes chains and censors transactions, but spending requires the owner\'s private-key signature — 51% attacks stop at double-spends and censorship.' } },
    { lvl: 3, a: 0,
      zh: { q: '零知识证明的三性质中，「可靠性」指的是？', opts: ['假的证明几乎不可能通过', '验证过程不泄露任何秘密', '证明生成速度要快', '任何人都能验证'], explain: '完备性=真则可信；可靠性=伪则难逃（每轮作弊率 50%，轮数增加指数衰减）；零知识=除命题为真外无信息泄露。' },
      en: { q: 'In zero-knowledge proofs, what does "soundness" mean?', opts: ['A false claim almost never passes', 'Verification leaks no secrets', 'Proofs generate quickly', 'Anyone can verify'], explain: 'Completeness: truth convinces. Soundness: lies fail (50% per cheating round, decaying exponentially). Zero-knowledge: nothing beyond the claim itself leaks.' } },
    { lvl: 2, a: 1,
      zh: { q: 'TOTP 验证码 30 秒轮换一次。它的安全收益主要是？', opts: ['节省手机电量', '把偷窥/钓鱼得到的验证码价值压缩到半分钟内', '让密码更长', '防止 SIM 卡老化'], explain: '时间片赋予验证码「新鲜度」：被偷窥的码半分钟后作废。服务器允许 ±1 片时钟容差以兼顾可用性。' },
      en: { q: 'TOTP codes rotate every 30 seconds. The main security benefit?', opts: ['Battery savings', 'Codes peeked or phished lose value within half a minute', 'Longer passwords', 'SIM card longevity'], explain: 'Time slices buy freshness: a stolen code is worthless in 30 seconds. Servers accept ±1 slice of clock drift for usability.' } },
    { lvl: 1, a: 1,
      zh: { q: '斯巴达密码棒（Scytale）属于哪类密码？', opts: ['替换密码', '换位密码', '流密码', '公钥密码'], explain: '羊皮纸条绕棒书写，解下即乱——字母不变、只变位置，是最早的军用换位密码实物。' },
      en: { q: 'The Spartan Scytale is what kind of cipher?', opts: ['Substitution', 'Transposition', 'Stream', 'Public-key'], explain: 'Letters unchanged, only rearranged — the earliest surviving military transposition cipher.' } },
    { lvl: 2, a: 2,
      zh: { q: '卡当格栅（Cardan Grille）的本质属于哪个范畴？', opts: ['多表替换', '数学加密', '隐写术——秘密藏于明文之中', '哈希函数'], explain: '挖孔卡片让密文藏在无害闲话的字缝里：不隐藏「内容」而隐藏「存在」，正是隐写术的定义。' },
      en: { q: 'The Cardan Grille fundamentally belongs to which category?', opts: ['Polyalphabetic substitution', 'Mathematical encryption', 'Steganography — hiding existence, not content', 'Hash functions'], explain: 'A holed card lets the secret hide between innocent words: steganography hides that a message exists at all.' } },
    { lvl: 2, a: 0,
      zh: { q: 'Passkey（FIDO2）相比 TOTP 验证码的核心安全优势是？', opts: ['签名绑定真实域名，钓鱼站拿不到可用凭据', '验证码更长', '不需要手机', '速度更快'], explain: 'TOTP 码可被 AiTM 钓鱼站实时转发；Passkey 的私钥签名与域名绑定，假站要不到有效响应。' },
      en: { q: 'What is Passkey\'s (FIDO2) core security advantage over TOTP codes?', opts: ['Signatures are origin-bound — phishing sites get nothing usable', 'Longer codes', 'No phone needed', 'Faster'], explain: 'AiTM phishing relays TOTP codes in real time; Passkey signatures are cryptographically bound to the true domain.' } },
    { lvl: 3, a: 1,
      zh: { q: '博福特密码与维吉尼亚的关键区别是？', opts: ['使用更大的字母表', '密文字母 = 密钥 − 明文（自倒置，加解密同一张表）', '只对元音加密', '每字换钥三次'], explain: 'c = k − p 的自倒置性质使加密表即解密表——这一对称性被早期机械密码设备广泛采用。' },
      en: { q: 'The key difference of the Beaufort cipher versus Vigenere?', opts: ['A larger alphabet', 'Ciphertext = key minus plaintext — self-reciprocal, one table for both directions', 'Vowels only', 'Triple key rotation'], explain: 'c = k − p is self-reciprocal: the same table encrypts and decrypts, a symmetry early cipher machines exploited.' } },
    { lvl: 3, a: 2,
      zh: { q: '阿尔贝蒂密码盘（1467）的历史地位是？', opts: ['第一种公钥算法', '第一台电子密码机', '首个多表替换的实物工具——西方密码学之父之作', '第一份频率分析论文'], explain: '两个同轴圆盘一转即可逐字更换字母表，单表频率分析从此失效——比维吉尼亚早百余年。' },
      en: { q: 'The historic status of Alberti\'s cipher disk (1467)?', opts: ['First public-key algorithm', 'First electronic cipher machine', 'First physical polyalphabetic tool — by a father of Western cryptography', 'First frequency-analysis paper'], explain: 'One twist of two coaxial disks gives each letter its own alphabet, defeating single-table frequency analysis — a century before Vigenere.' } },
    { lvl: 4, a: 0,
      zh: { q: 'PAKE（如 WPA3 所用的 SAE）解决的核心问题是？', opts: ['仅凭一个弱口令协商出强会话密钥，且窃听者无法离线验证猜测', '把强密钥压缩成弱口令', '加速 Wi-Fi 连接', '替代数字证书'], explain: '普通口令协议让攻击者抓包后离线穷举；PAKE 把验证做成交互式零知识过程，猜测只能在在线慢速进行。' },
      en: { q: 'What core problem does PAKE (e.g. SAE in WPA3) solve?', opts: ['Deriving a strong session key from a weak password, with no offline guessing for eavesdroppers', 'Compressing strong keys into passwords', 'Speeding up Wi-Fi', 'Replacing certificates'], explain: 'Plain password protocols allow offline brute force on captured handshakes; PAKE makes verification interactive so guesses can only be tried slowly, online.' } },
    { lvl: 4, a: 3,
      zh: { q: '盲签名（Blind Signature）的独特之处在于？', opts: ['签名后文件自动销毁', '只能签一次', '不需要私钥', '签署者看不到所签内容却能为其背书'], explain: '先盲化→签名→去盲：签署者不知内容。David Chaum 据此构造了最早的电子现金与匿名投票协议。' },
      en: { q: 'What makes Blind Signatures unique?', opts: ['The file self-destructs after signing', 'They work only once', 'No private key needed', 'The signer endorses content they cannot see'], explain: 'Blind, sign, unblind: the signer never learns the content. David Chaum built the first e-cash and anonymous voting on this.' } },


  ];

  /* 段位评级（8 级）：按得分率 */
  var RANKS = [
    { min: 0.95, name: 'legend', zh: '传说破译者', en: 'Legendary Codebreaker', icon: '👑' },
    { min: 0.85, name: 'master', zh: '密码大师', en: 'Cipher Master', icon: '💎' },
    { min: 0.75, name: 'expert', zh: '资深破译者', en: 'Expert Cryptanalyst', icon: '🛡️' },
    { min: 0.65, name: 'advanced', zh: '进阶破译者', en: 'Advanced Breaker', icon: '⚔️' },
    { min: 0.5, name: 'intermediate', zh: '中级破译者', en: 'Intermediate', icon: '🔎' },
    { min: 0.35, name: 'novice', zh: '入门破译者', en: 'Novice', icon: '📖' },
    { min: 0.15, name: 'rookie', zh: '新手学徒', en: 'Rookie', icon: '🌱' },
    { min: 0, name: 'initiate', zh: '初识者', en: 'Initiate', icon: '🕯️' }
  ];

  function rankFor(score, total) {
    var pct = total ? score / total : 0;
    for (var i = 0; i < RANKS.length; i++) {
      if (pct >= RANKS[i].min) return RANKS[i];
    }
    return RANKS[RANKS.length - 1];
  }

  /* 抽 10 题：按级别权重（L1×4 L2×3 L3×2 L4×1）+ 随机 */
  function draw10() {
    var picks = [];
    var lvlPool = { 1: [], 2: [], 3: [], 4: [] };
    BANK.forEach(function (q, i) { lvlPool[q.lvl].push(i); });
    var need = { 1: 4, 2: 3, 3: 2, 4: 1 };
    for (var lvl in need) {
      var pool = lvlPool[lvl];
      for (var k = 0; k < need[lvl]; k++) {
        if (!pool.length) break;
        var idx = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(idx, 1)[0]);
      }
    }
    for (var i = picks.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = picks[i]; picks[i] = picks[j]; picks[j] = t;
    }
    return picks.map(function (bi) { return BANK[bi]; });
  }

  /* 记录最近一次段位（档案页可读） */
  function recordResult(score, total) {
    var r = rankFor(score, total);
    try {
      localStorage.setItem('arcade_quiz_best_score', String(score));
      localStorage.setItem('arcade_quiz_best_total', String(total));
      localStorage.setItem('arcade_quiz_rank', r.name);
      localStorage.setItem('arcade_quiz_rank_zh', r.zh);
      localStorage.setItem('arcade_quiz_rank_en', r.en);
      localStorage.setItem('arcade_quiz_icon', r.icon);
      /* 历史最佳：只升不降 */
      var best = parseInt(localStorage.getItem('arcade_quiz_best_ever') || '0', 10);
      if (score > best) localStorage.setItem('arcade_quiz_best_ever', String(score));
    } catch (e) {}
    return r;
  }
  function lastResult() {
    try {
      var score = parseInt(localStorage.getItem('arcade_quiz_best_score') || '0', 10);
      var total = parseInt(localStorage.getItem('arcade_quiz_best_total') || '0', 10);
      var name = localStorage.getItem('arcade_quiz_rank') || '';
      var zh = localStorage.getItem('arcade_quiz_rank_zh') || '未测验';
      var en = localStorage.getItem('arcade_quiz_rank_en') || 'Not tested';
      var icon = localStorage.getItem('arcade_quiz_icon') || '🕯️';
      var ever = parseInt(localStorage.getItem('arcade_quiz_best_ever') || '0', 10);
      return { score: score, total: total, name: name, zh: zh, en: en, icon: icon, ever: ever };
    } catch (e) { return { score: 0, total: 0, name: '', zh: '未测验', en: 'Not tested', icon: '🕯️', ever: 0 }; }
  }

  /* ---------- D2 错题本 ----------
     key 用 zh 题干（跨会话稳定）；答错入本、连对 3 次自动移出 */
  var WRONG_KEY = 'arcade_quiz_wrong';
  function wrongMap() {
    try { return JSON.parse(localStorage.getItem(WRONG_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveWrong(m) {
    try { localStorage.setItem(WRONG_KEY, JSON.stringify(m)); } catch (e) {}
  }
  function markWrong(q) {
    if (!q || !q.zh || !q.zh.q) return;
    var m = wrongMap();
    m[q.zh.q] = { wrong: ((m[q.zh.q] && m[q.zh.q].wrong) || 0) + 1, streak: 0 };
    saveWrong(m);
  }
  function markRight(q) {
    if (!q || !q.zh || !q.zh.q) return;
    var m = wrongMap();
    var k = q.zh.q;
    if (!m[k]) return;
    m[k].streak = (m[k].streak || 0) + 1;
    if (m[k].streak >= 3) delete m[k];
    saveWrong(m);
  }
  /* 取错题（按错误次数降序）最多 n 道在题库中的对象 */
  function drawWrong(n) {
    var m = wrongMap();
    var keys = Object.keys(m);
    keys.sort(function (a, b) { return (m[b].wrong || 0) - (m[a].wrong || 0); });
    var out = [];
    for (var i = 0; i < keys.length && out.length < n; i++) {
      for (var j = 0; j < BANK.length; j++) {
        if (BANK[j].zh.q === keys[i]) { out.push(BANK[j]); break; }
      }
    }
    return out;
  }
  function wrongCount() { return Object.keys(wrongMap()).length; }

  return {
    BANK: BANK, RANKS: RANKS, draw10: draw10,
    rankFor: rankFor, recordResult: recordResult, lastResult: lastResult,
    markWrong: markWrong, markRight: markRight, drawWrong: drawWrong, wrongCount: wrongCount
  };
})();
