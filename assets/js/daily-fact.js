/* ============================================================
   今日密码 Daily Cipher Fact —— H3 全网独有
   日期种子轮换：每天一条密码学冷知识/谜题（全球同日同条），
   首页卡片展示。可点击展开谜底；每日 0 点自动换新。
   依赖：core/i18n.js + core/i18n-dict.js（文案键 dcf.*）
   ============================================================ */
window.DAILY_FACT = (function () {
  /* 按日期种子取条目（年份×10000+月×100+日） */
  function daySeed(d) {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function pick(arr, seed) {
    var s = Math.abs(Math.floor(seed));
    return arr[s % arr.length];
  }

  /* 每日一谜：谜面 + 谜底 + 提示（D3 扩容：31 条按「日 of 月」种子轮换，月内不重复） */
  var PUZZLES = [
    { q: { zh: '破解：WKH TXLFN EURZQ IRA（凯撒）', en: 'Crack: WKH TXLFN EURZQ IRA (Caesar)' }, a: { zh: 'THE QUICK BROWN FOX', en: 'THE QUICK BROWN FOX' }, hint: { zh: '偏移 3', en: 'shift 3' } },
    { q: { zh: '破解：.--. .-.. .- -.-- 是什么单词？', en: 'Crack: .--. .-.. .- -.-- — what word?' }, a: { zh: 'PLAY', en: 'PLAY' }, hint: { zh: '摩斯电码', en: 'Morse code' } },
    { q: { zh: '破解：01101000 01100001 01100011 01101011', en: 'Crack: 01101000 01100001 01100011 01101011' }, a: { zh: 'HACK', en: 'HACK' }, hint: { zh: '每 8 位一字符', en: '8 bits per char' } },
    { q: { zh: '破解：WVXLWV（Atbash：A↔Z）', en: 'Crack: WVXLWV (Atbash: A↔Z)' }, a: { zh: 'DECODE', en: 'DECODE' }, hint: { zh: '字母表镜像', en: 'mirrored alphabet' } },
    { q: { zh: '破解：U0VDUkVUIE1FU1NBR0U=', en: 'Crack: U0VDUkVUIE1FU1NBR0U=' }, a: { zh: 'SECRET MESSAGE', en: 'SECRET MESSAGE' }, hint: { zh: 'Base64', en: 'Base64' } },
    { q: { zh: '破解：JYOEUNR（栅栏 4 轨）', en: 'Crack: JYOEUNR (rail 4)' }, a: { zh: 'JOURNEY', en: 'JOURNEY' }, hint: { zh: '锯齿形重排', en: 'zigzag rearrange' } },
    { q: { zh: '破解：PHHW PH DW WKH JDWH（凯撒）', en: 'Crack: PHHW PH DW WKH JDWH (Caesar)' }, a: { zh: 'MEET ME AT THE GATE', en: 'MEET ME AT THE GATE' }, hint: { zh: '后移 3 位', en: 'shift back 3' } },
    { q: { zh: '破解：XJHWJY（凯撒）', en: 'Crack: XJHWJY (Caesar)' }, a: { zh: 'SECRET', en: 'SECRET' }, hint: { zh: '偏移 5', en: 'shift 5' } },
    { q: { zh: '破解：OPZAVYF（凯撒）', en: 'Crack: OPZAVYF (Caesar)' }, a: { zh: 'HISTORY', en: 'HISTORY' }, hint: { zh: '偏移 7', en: 'shift 7' } },
    { q: { zh: '破解：XRKSVI（Atbash：A↔Z）', en: 'Crack: XRKSVI (Atbash: A↔Z)' }, a: { zh: 'CIPHER', en: 'CIPHER' }, hint: { zh: '字母表镜像', en: 'mirrored alphabet' } },
    { q: { zh: '破解：KFAAOV（Atbash：A↔Z）', en: 'Crack: KFAAOV (Atbash: A↔Z)' }, a: { zh: 'PUZZLE', en: 'PUZZLE' }, hint: { zh: '字母表镜像', en: 'mirrored alphabet' } },
    { q: { zh: '破解：.... . .-.. .-.. --- 是什么单词？', en: 'Crack: .... . .-.. .-.. --- — what word?' }, a: { zh: 'HELLO', en: 'HELLO' }, hint: { zh: '摩斯电码', en: 'Morse code' } },
    { q: { zh: '破解：-.-. .-. -.-- .--. - ---', en: 'Crack: -.-. .-. -.-- .--. - ---' }, a: { zh: 'CRYPTO', en: 'CRYPTO' }, hint: { zh: '摩斯电码', en: 'Morse code' } },
    { q: { zh: '破解：01000100 01000001 01010100 01000001', en: 'Crack: 01000100 01000001 01010100 01000001' }, a: { zh: 'DATA', en: 'DATA' }, hint: { zh: '每 8 位一字符', en: '8 bits per char' } },
    { q: { zh: '破解：01001011 01000101 01011001', en: 'Crack: 01001011 01000101 01011001' }, a: { zh: 'KEY', en: 'KEY' }, hint: { zh: 'ASCII 二进制', en: 'ASCII binary' } },
    { q: { zh: '破解：RU5JR01B', en: 'Crack: RU5JR01B' }, a: { zh: 'ENIGMA', en: 'ENIGMA' }, hint: { zh: 'Base64', en: 'Base64' } },
    { q: { zh: '破解：VklHRU5FUkU=', en: 'Crack: VklHRU5FUkU=' }, a: { zh: 'VIGENERE', en: 'VIGENERE' }, hint: { zh: 'Base64', en: 'Base64' } },
    { q: { zh: '破解：VOITRCY（栅栏 3 轨）', en: 'Crack: VOITRCY (rail 3)' }, a: { zh: 'VICTORY', en: 'VICTORY' }, hint: { zh: '锯齿形重排', en: 'zigzag rearrange' } },
    { q: { zh: '破解：PSWRASOD（栅栏 2 轨）', en: 'Crack: PSWRASOD (rail 2)' }, a: { zh: 'PASSWORD', en: 'PASSWORD' }, hint: { zh: '两行交替', en: 'two alternating rows' } },
    { q: { zh: '破解：AAAAA AABBA AABAA ABBAA BAABA（培根）', en: 'Crack: AAAAA AABBA AABAA ABBAA BAABA (Bacon)' }, a: { zh: 'AGENT', en: 'AGENT' }, hint: { zh: '5 位 A/B 码', en: '5-bit A/B code' } },
    { q: { zh: '破解：BAAAB ABBBA BABBA（培根）', en: 'Crack: BAAAB ABBBA BABBA (Bacon)' }, a: { zh: 'SPY', en: 'SPY' }, hint: { zh: '5 位 A/B 码', en: '5-bit A/B code' } },
    { q: { zh: '破解：EDOC（反转）', en: 'Crack: EDOC (reversed)' }, a: { zh: 'CODE', en: 'CODE' }, hint: { zh: '倒着读', en: 'read backwards' } },
    { q: { zh: '破解：8 9 14 20（字母序号）', en: 'Crack: 8 9 14 20 (letter numbers)' }, a: { zh: 'HINT', en: 'HINT' }, hint: { zh: 'A=1', en: 'A=1' } },
    { q: { zh: '破解：1 12 16 8 1（字母序号）', en: 'Crack: 1 12 16 8 1 (letter numbers)' }, a: { zh: 'ALPHA', en: 'ALPHA' }, hint: { zh: 'A=1, B=2, …', en: 'A=1, B=2, …' } },
    { q: { zh: '破解：KXRKGI（维吉尼亚，密钥 KEY）', en: 'Crack: KXRKGI (Vigenère, key KEY)' }, a: { zh: 'ATTACK', en: 'ATTACK' }, hint: { zh: '字母相加，密钥 KEY', en: 'add letters, key KEY' } },
    { q: { zh: '破解：DGNVQ（维吉尼亚，密钥 RSA）', en: 'Crack: DGNVQ (Vigenère, key RSA)' }, a: { zh: 'MONEY', en: 'MONEY' }, hint: { zh: '字母相加，密钥 RSA', en: 'add letters, key RSA' } },
    { q: { zh: '850 年前后，哪位阿拉伯学者在《解译密文手稿》中首创了频率分析？', en: 'Around 850, which Arab scholar first described frequency analysis in his "Manuscript on Deciphering Cryptographic Messages"?' }, a: { zh: '阿尔·金迪（Al-Kindi）', en: 'Al-Kindi' }, hint: { zh: '被誉为「频率分析之父」', en: 'the father of frequency analysis' } },
    { q: { zh: '二战中，英国对恩尼格玛破译情报的统一最高机密代号是什么？', en: 'What top-secret codename covered all British intelligence derived from breaking Enigma in WWII?' }, a: { zh: 'Ultra', en: 'Ultra' }, hint: { zh: '意为「超越」', en: 'means "beyond"' } },
    { q: { zh: '香农 1949 年那篇奠定现代密码学的论文标题是什么？', en: 'What is the title of Shannon\'s 1949 paper that founded modern cryptography?' }, a: { zh: '《保密系统的通信理论》（Communication Theory of Secrecy Systems）', en: 'Communication Theory of Secrecy Systems' }, hint: { zh: '发表于贝尔实验室', en: 'published at Bell Labs' } },
    { q: { zh: '1976 年迪菲与赫尔曼开创公钥密码学的论文标题是什么？', en: 'What is the title of Diffie and Hellman\'s 1976 paper that launched public-key cryptography?' }, a: { zh: '《密码学的新方向》（New Directions in Cryptography）', en: 'New Directions in Cryptography' }, hint: { zh: '关键词「新方向」', en: 'key phrase "New Directions"' } },
    { q: { zh: 'RSA 算法以哪三位发明者的姓氏首字母命名？', en: 'Whose surnames form the acronym RSA?' }, a: { zh: 'Rivest、Shamir、Adleman', en: 'Rivest, Shamir, Adleman' }, hint: { zh: '1977 年 MIT 三人组', en: 'the MIT trio of 1977' } }
  ];

  /* 每日一知：冷知识（中英） */
  var FACTS = [
    { zh: '凯撒密码其实没有固定偏移——奥古斯都用偏移 1，凯撒用 3。', en: 'Caesar\'s cipher had no fixed shift — Augustus used 1, Caesar used 3.' },
    { zh: '「Cipher（密文）」一词源自阿拉伯语 sifr（零），经意大利语 cifra 传入欧洲。', en: 'The word "cipher" traces back to Arabic sifr (zero), via Italian cifra.' },
    { zh: '1943 年建成的 Colossus 每秒处理 5,000 字符，处理速度较机电设备高两个数量级，专为 Lorenz 破译而生。', en: 'Colossus (1943) processed 5,000 chars per second — two orders of magnitude faster than electromechanical gear, built specifically to break Lorenz.' },
    { zh: '最长的已知未解密码是 CIA 广场 Kryptos 的第四段（K4），已悬而未决 30+ 年。', en: 'The longest unsolved cipher is K4 of the CIA\'s Kryptos sculpture — open for 30+ years.' },
    { zh: '比尔密码寻宝至今无人找到价值 6,000 万美元的宝藏（若传说为真）。', en: 'The Beale treasure, if real, is worth ~$60M — and still lost.' },
    { zh: 'Voynich 手稿约 240 页，用了 17 万字符的单一未知文字（可能出自多位抄写员之手），500 年来无人读懂。', en: 'The Voynich Manuscript: ~240 pages, 170k glyphs in a single unknown script (possibly written by multiple scribes), unread for 500 years.' },
    { zh: '一次性密码本（OTP）是唯一被数学证明绝对不可破的密码——但密钥必须等长且只用一次。', en: 'The one-time pad is the only provably unbreakable cipher — but the key must match the message and never repeat.' },
    { zh: '二战中纳瓦霍语密码员让日军始终无法破译美军通信，因为纳瓦霍语没有文字、语法极难。', en: 'Navajo code talkers kept US comms unbreakable — the language has no script and brutal grammar.' },
    { zh: 'RSA 发明者 1977 年刊登的「破译悬赏」100 美元谜题，直到 1994 年才被互联网志愿团队解出。', en: 'RSA\'s $100 challenge ciphertext stood unbroken from 1977 until an internet volunteer team solved it in 1994.' },
    { zh: 'SHA-1 碰撞实验（SHAttered）投入了大规模分布式算力，印证 SHA-1 已不再安全，加速了整个互联网向 SHA-2/3 的迁移。', en: 'The SHAttered SHA-1 collision ran on large-scale distributed compute, confirming SHA-1 was no longer safe and accelerating the internet-wide move to SHA-2/3.' },
    /* ---- D3 扩充：+40 条（2026-08） ---- */
    { zh: '斯巴达人用「木杖密码」（scytale）：把皮带按螺旋缠在特定粗细的木棍上写字，解开后成一串乱码，收信人须用同粗木棍才能还原。', en: 'Spartans used the scytale: a strip wrapped around a rod of a set diameter turns a written message into gibberish until rewrapped on the same rod.' },
    { zh: '苏格兰的玛丽女王用一套带同音字与诱饵符号的替换密码与外界密谋，1586 年信件被破译，成为判处她死刑的关键证据。', en: 'Mary, Queen of Scots used a substitution cipher with homophones and nulls; its decryption in 1586 became key evidence that led to her execution.' },
    { zh: '1917 年的齐默尔曼电报里，德国怂恿墨西哥对美开战并许诺归还德克萨斯等地；英国 40 号房破译后，直接推动美国加入一战。', en: 'In the 1917 Zimmermann Telegram, Germany urged Mexico to attack the US and offered back Texas; Britain\'s Room 40 decrypted it, helping push America into WWI.' },
    { zh: '罗斯尼奥尔父子的「大密码」加密了路易十四的机密档案，整整两个世纪无人能解，直到 1890 年才被巴泽里破解。', en: 'The Rossignols\' "Great Cipher" sealed Louis XIV\'s secrets and resisted all attacks for two centuries until Bazeries broke it in 1890.' },
    { zh: '爱伦·坡 1843 年的小说《金甲虫》围绕一套替换密码展开藏宝故事，让「破译密码」第一次成为大众娱乐。', en: 'Poe\'s 1843 story "The Gold-Bug" built a treasure hunt around a substitution cipher, turning codebreaking into popular entertainment.' },
    { zh: '恩尼格玛的转子与插线板组合约有 1.59×10²⁰ 种设置，即便每秒尝试一百万种也要约 500 万年才能穷举；但机电式的 Bombes（炸弹机）用启发式大幅缩短了实战时间。', en: 'The Enigma had roughly 1.59×10²⁰ possible settings — even at a million trials per second, brute force would take millions of years. But the electromechanical Bombes used heuristics to slash real-world breaking time.' },
    { zh: '波兰数学家雷耶夫斯基 1932 年就用纯数学方法重建了恩尼格玛的内部接线，1939 年 7 月把全部成果转交英法。', en: 'Polish mathematician Marian Rejewski mathematically reconstructed Enigma\'s wiring in 1932; in July 1939 Poland handed the results to Britain and France.' },
    { zh: '布莱切利园高峰期约有一万人工作，其中约四分之三是女性——她们操作炸弹机、抄写并索引海量截获电文。', en: 'At its peak Bletchley Park employed about 10,000 people, roughly three-quarters of them women, running Bombes and indexing intercepted traffic.' },
    { zh: '图灵 1950 年在论文《计算机器与智能》中提出「模仿游戏」，也就是后来著名的图灵测试。', en: 'Turing\'s 1950 paper "Computing Machinery and Intelligence" proposed the "imitation game" — the famous Turing Test.' },
    { zh: '「密码学」一词源自希腊语 kryptós（隐藏）与 gráphein（书写）。', en: '"Cryptography" comes from the Greek kryptós ("hidden") and gráphein ("to write").' },
    { zh: '弗里德曼团队破解日本「紫密」后，由此获得的情报代号「魔术」（Magic），让美国能提前读到日本外交密电。', en: 'After Friedman\'s team broke Japan\'s "Purple" machine, the resulting intelligence — codenamed "Magic" — let the US read Japanese diplomatic traffic in advance.' },
    { zh: '中途岛海战前，美军故意明码发送「中途岛淡水设备故障」的假消息，日军密电中随即引用此事，从而锁定 AF 即中途岛。', en: 'Before Midway, the US sent a fake message about a broken water distiller on Midway; when Japanese traffic echoed it, codebreakers confirmed AF meant Midway.' },
    { zh: '破译恩尼格玛时常靠「crib」（已知明文）——德军电文每天常以天气词 WETTER 开头，成了撬开当日密钥的钩子。', en: 'Enigma codebreakers exploited cribs — the day\'s traffic often began with the weather word WETTER, a perfect hook into the day\'s settings.' },
    { zh: '世界第一台可编程电子计算机 Colossus 在二战后被拆毁、图纸销毁，其存在本身保密到 1970 年代才公开。', en: 'The world\'s first programmable electronic computer, Colossus, was dismantled after the war with its blueprints burned; its very existence stayed secret into the 1970s.' },
    { zh: 'Diffie–Hellman 密钥交换让两个素未谋面的人能在公开信道上共同生成一把密钥，1976 年一举解决了流传数千年的密钥分发难题。', en: 'Diffie–Hellman key exchange (1976) lets two strangers agree on a secret key over a public channel, solving the age-old key-distribution problem.' },
    { zh: '1977 年的 RSA 论文提出了公钥加密与数字签名的构想，三位作者因此在 2002 年共同获得图灵奖。', en: 'The 1977 RSA paper introduced public-key encryption and digital signatures; its three authors shared the 2002 Turing Award.' },
    { zh: '菲尔·齐默尔曼 1991 年把 PGP 免费发布到 Usenet，随后被美国政府以「出口军火」为由调查了约三年，成为「密码战争」的标志性事件。', en: 'Phil Zimmermann posted PGP to Usenet in 1991 and was investigated for about three years under US arms-export law — an emblem of the "Crypto Wars."' },
    { zh: '1998 年，电子前哨基金会花约 25 万美元造出「Deep Crack」机器，用约 56 小时暴力破解了 56 位 DES 密钥，宣告 DES 时代终结。', en: 'In 1998 the EFF\'s $250,000 "Deep Crack" machine brute-forced a 56-bit DES key in about 56 hours, effectively ending DES.' },
    { zh: '2000 年 NIST 选定比利时人设计的 Rijndael 作为 AES，取代 DES；如今它加密着全球绝大部分网络流量。', en: 'In 2000 NIST chose the Belgian Rijndael design as AES to replace DES; today it secures most of the world\'s network traffic.' },
    { zh: '香农 1948 年的论文《通信的数学理论》首次把「信息」量化，并推广了约翰·图基提出的「比特」概念，成为现代密码与通信的基石。', en: 'Shannon\'s 1948 "A Mathematical Theory of Communication" quantified "information" and popularized the term "bit" (coined by John Tukey), the bedrock of modern crypto and communications.' },
    { zh: '肖尔算法（1994）证明量子计算机能在多项式时间内分解大整数，一旦实用化将直接威胁 RSA 与椭圆曲线密码。', en: 'Shor\'s algorithm (1994) showed a quantum computer could factor large numbers efficiently, directly threatening RSA and elliptic-curve crypto.' },
    { zh: '2024 年 NIST 发布首批后量子密码标准（ML-KEM、ML-DSA、SLH-DSA），为抵御未来的量子计算机做准备。', en: 'In 2024 NIST issued its first post-quantum standards (ML-KEM, ML-DSA, SLH-DSA) to prepare for future quantum computers.' },
    { zh: '黄道十二宫杀手的 Z340 密文于 2020 年被一支三人破译团队解开，距其 1969 年见报已过去 51 年。', en: 'The Zodiac Killer\'s Z340 cipher was finally solved in 2020 by a three-person team, 51 years after it appeared in 1969.' },
    { zh: '「多拉贝拉密码」是作曲家埃尔加 1897 年写给友人的一封加密短笺，至今仍无人能读懂。', en: 'The "Dorabella Cipher" is an encrypted note Elgar sent to a friend in 1897; it remains unsolved to this day.' },
    { zh: '1908 年出土于克里特的斐斯托斯圆盘刻有螺旋排列的未知符号，一个多世纪过去仍无人能破译。', en: 'The Phaistos Disc, unearthed in Crete in 1908, bears a spiral of unknown symbols that no one has deciphered in over a century.' },
    { zh: '1799 年发现的罗塞塔石碑用三种文字刻写同一段话，商博良据此在 1822 年破译了古埃及象形文字。', en: 'The Rosetta Stone (1799) carries the same text in three scripts; with it Champollion deciphered Egyptian hieroglyphs in 1822.' },
    { zh: '线性 B 是希腊青铜时代的音节文字，1952 年被建筑师出身的文特里斯破译，证实它记录的是早期希腊语。', en: 'Linear B, a Bronze Age Greek syllabic script, was deciphered in 1952 by architect-turned-scholar Michael Ventris.' },
    { zh: '「猪圈密码」把字母放进井字形的格子里、用格形与点表示字母，是共济会最著名的图形密码，至今仍见于童军手册。', en: 'The Pigpen cipher maps letters to segments of a tic-tac-toe grid — the Freemasons\' famous symbol cipher, still seen in scout manuals.' },
    { zh: '1963 年设立的美苏「热线」并非红色电话机，而是一条电传线路，其通信用一次性密码本加密，理论上绝对安全。', en: 'The 1963 US–Soviet "hotline" was a teletype link, not a red phone, and its traffic was encrypted with one-time pads.' },
    { zh: 'Playfair 密码其实由查尔斯·惠斯通爵士 1854 年发明，却因热心推广它的朋友普莱费尔勋爵而得名。', en: 'The Playfair cipher was actually invented by Sir Charles Wheatstone in 1854 but named after his friend Lord Playfair, who promoted it.' },
    { zh: '一战末期德军启用 ADFGVX 密码加密攻势电文，法国破译者乔治·潘文在总攻前夜破译，扭转了战局。', en: 'Germany\'s ADFGVX cipher (1918) was broken by French cryptanalyst Georges Painvin on the eve of a massive offensive, altering the war\'s course.' },
    { zh: '维吉尼亚密码在 16 世纪问世后长期号称「不可破」，直到 19 世纪巴贝奇与卡西斯基各自独立找到破解法。', en: 'The Vigenère cipher was long called "le chiffre indéchiffrable" until Babbage and Kasiski independently broke it in the 19th century.' },
    { zh: '第一次世界大战把密码学从「手艺」变成「工业」：英法德纷纷建立专门的情报部门与截获站，海量电文被记录、归档、分析。', en: 'In WWI codebreaking went industrial: Britain, France and Germany built dedicated signals-intelligence bureaus and interception stations.' },
    { zh: '美国开国元勋杰斐逊 1790 年代发明了「杰斐逊盘」——26 个刻有乱序字母的转轮，美国陆军直到 20 世纪仍在使用类似装置。', en: 'Jefferson\'s "wheel cipher" (c. 1795) of 26 lettered disks was reinvented and used by the US Army well into the 20th century.' },
    { zh: '摩斯电码里最著名的求救信号 SOS（··· ––– ···）并不是任何词的缩写，选它只因节奏简单、极易识别。', en: 'SOS (··· ––– ···) was never an abbreviation; it was chosen purely for its simple, unmistakable rhythm.' },
    { zh: '隐写术的经典案例：古希腊人把奴隶剃头、在头皮上刺字，等头发长出来再派他去送信，收信人剃头即可读取。', en: 'A classic steganography case: ancient Greeks tattooed a message on a slave\'s shaved scalp, waited for the hair to regrow, then sent him off.' },
    { zh: '现代 HTTPS 握手先用非对称密码交换一把临时密钥，再用对称密码加密后续数据——兼具 RSA 的安全与 AES 的速度。', en: 'In HTTPS, asymmetric crypto first exchanges a key, then symmetric crypto encrypts the data — combining RSA\'s security with AES\'s speed.' },
    { zh: '「生日攻击」源于一个反直觉的事实：只要 23 个人，就有超过一半的概率两人同一天生日；哈希碰撞远比想象中容易。', en: 'The birthday attack rests on a counterintuitive fact: with just 23 people, two sharing a birthday is more likely than not.' },
    { zh: '诺曼底登陆前，盟军「坚毅行动」用假无线电网与假军团让德军误判登陆点为加莱，堪称史上最大规模的密码与欺骗战。', en: 'Operation Fortitude fed Germany a phantom army and fake radio traffic to disguise Normandy\'s real landing site — history\'s grandest deception.' },
    { zh: '「Cicada 3301」是 2012 年起反复出现的连环密码招募谜题，层层嵌套密码与隐写术，至今无人确知幕后是谁。', en: 'Cicada 3301, a series of cryptic online recruitment puzzles since 2012, remains an unsolved mystery of who runs it.' }
  ];

  /* 今天：谜题与冷知识都按日期种子轮换（D3：31 谜题月内不重复 / 50 知识按日翻新） */
  function today() {
    var now = new Date();
    var p = pick(PUZZLES, daySeed(now));
    var f = pick(FACTS, daySeed(now));
    return { puzzle: p, fact: f, date: now.toDateString() };
  }

  return { PUZZLES: PUZZLES, FACTS: FACTS, today: today };
})();
