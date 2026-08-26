/* ============================================================
   编年史正文字典（i18n-story.js）—— S3 后仅含章节正文
   仅 stories.html / story.html / people.html / artifacts.html 需要
   依赖：core/i18n.js + core/i18n-dict.js（先加载；摘要键已下沉至 dict）
   ============================================================ */

/* ===== 破译编年史 P5 框架键 ===== */
(function () {
  var d = Arcade.i18n.dicts;
  /* 页面 UI */
  d.zh['st.title'] = '破译编年史';
  d.en['st.title'] = 'The Decode Chronicle';
  d.zh['st.pageTitle'] = '破译编年史 · 密码博物馆';
  d.en['st.pageTitle'] = 'The Decode Chronicle · Museum of Ciphers';
  d.zh['people.pageDesc'] = '破译 DECODE ARCADE · 人物志：三千年密码史中的破译者们——凯撒、肯迪、培根、图灵、弗里德曼、香农……点击查看档案。';
  d.en['people.pageDesc'] = 'DECODE ARCADE · People: the codebreakers of 3,000 years of cryptography — Caesar, al-Kindi, Bacon, Turing, Friedman, Shannon… click to view their profiles.';
  d.zh['artifacts.pageDesc'] = '破译 DECODE ARCADE · 密件册：通关游戏解锁 41 件历史密件——罗塞塔碑、齐默尔曼电报、VENONA 片段、BB84 摘要……收藏密码学三千年的证据。';
  d.en['artifacts.pageDesc'] = 'DECODE ARCADE · Artifacts: unlock 41 historical documents by clearing games — Rosetta Stone, Zimmermann Telegram, VENONA excerpts, the BB84 abstract… collect the evidence of 3,000 years of cryptography.';
  d.zh['st.pageDesc'] = '破译 DECODE ARCADE · 破译编年史：从罗塞塔石碑到量子时代，密码学三千年的智识战争。12 章真实历史故事 + 人物志 + 密件收藏册。';
  d.en['st.pageDesc'] = 'DECODE ARCADE · The Decode Chronicle: from the Rosetta Stone to the quantum age — three thousand years of the war of wits. 12 true-history chapters + codebreakers + artifacts.';
  d.zh['st.heroSub'] = '密码学三千年的智识战争 · 读史 · 玩戏 · 破链';
  d.en['st.heroSub'] = 'Three thousand years of the war of wits — read, play, decrypt.';
  d.zh['st.progressF'] = '已读 {r} / {t} 章';
  d.en['st.progressF'] = 'Read {r} / {t} chapters';
  d.zh['st.progRead'] = '已读';
  d.en['st.progRead'] = 'read';
  d.zh['st.progLetters'] = '密钥字母';
  d.en['st.progLetters'] = 'key letters';
  d.zh['st.progArts'] = '密件';
  d.en['st.progArts'] = 'artifacts';
  d.zh['st.gamesCount'] = '🎮 {n} 款游戏';
  d.en['st.gamesCount'] = '🎮 {n} games';
  d.zh['st.read'] = '已读';
  d.en['st.read'] = 'read';
  d.zh['st.unread'] = '未读';
  d.en['st.unread'] = 'unread';
  d.zh['st.letterGot'] = '密钥字母已得';
  d.en['st.letterGot'] = 'key letter earned';
  d.zh['st.notFound'] = '未找到该章节。';
  d.en['st.notFound'] = 'Chapter not found.';
  d.zh['st.region'] = '地点';
  d.en['st.region'] = 'Location';
  d.zh['st.chapterF'] = '第 {n}/{t} 章';
  d.en['st.chapterF'] = 'Chapter {n}/{t}';
  d.zh['st.letter'] = '截获密信';
  d.en['st.letter'] = 'INTERCEPTED LETTER';
  d.zh['st.letterDone'] = '密信已破译';
  d.en['st.letterDone'] = 'Letter decrypted';
  d.zh['st.answerPh'] = '输入破译结果…';
  d.en['st.answerPh'] = 'Type the decoded text…';
  d.zh['st.submit'] = '✅ 提交';
  d.en['st.submit'] = '✅ Submit';
  d.zh['st.letterWin'] = '✓ 破译成功！获得密钥字母「{k}」';
  d.en['st.letterWin'] = '✓ Decrypted! Key letter "{k}" earned';
  d.zh['st.letterFail'] = '✗ 结果不对，再试试（可用下方解算器）';
  d.en['st.letterFail'] = '✗ Not right — try again (use the solver below)';
  d.zh['st.solver'] = '微型解算器';
  d.en['st.solver'] = 'mini solver';
  d.zh['st.preview'] = '试解';
  d.en['st.preview'] = 'solve';
  d.zh['st.decode'] = '解码';
  d.en['st.decode'] = 'decode';
  d.zh['st.offset'] = '偏移';
  d.en['st.offset'] = 'shift';
  d.zh['st.rails'] = '轨道数';
  d.en['st.rails'] = 'rails';
  d.zh['st.key'] = '密钥';
  d.en['st.key'] = 'key';
  d.zh['st.sCaesar'] = '凯撒';
  d.en['st.sCaesar'] = 'Caesar';
  d.zh['st.sAffine'] = '仿射';
  d.en['st.sAffine'] = 'Affine';
  d.zh['st.sRail'] = '栅栏';
  d.en['st.sRail'] = 'Rail fence';
  d.zh['st.sVigenere'] = '维吉尼亚';
  d.en['st.sVigenere'] = 'Vigenère';
  d.zh['st.sBacon'] = '培根双字体';
  d.en['st.sBacon'] = 'Bacon';
  d.zh['st.sXor'] = '异或';
  d.en['st.sXor'] = 'XOR';
  d.zh['st.sPlayfair'] = 'Playfair';
  d.en['st.sPlayfair'] = 'Playfair';
  d.zh['st.sHill'] = '希尔 2×2';
  d.en['st.sHill'] = 'Hill 2×2';
  d.zh['st.sSub'] = '单表替换对照';
  d.en['st.sSub'] = 'Substitution table';
  d.zh['st.sSubHint'] = '按下方 QWERTY 密文表逐字对照还原';
  d.en['st.sSubHint'] = 'map each cipher letter via the QWERTY table below';
  d.zh['st.sSubPlain'] = '明文 A–Z';
  d.en['st.sSubPlain'] = 'Plain A–Z';
  d.zh['st.chapterGames'] = '本章密码局 · 玩出历史';
  d.en['st.chapterGames'] = 'Code room — play the history';
  d.zh['st.done'] = '已通关';
  d.en['st.done'] = 'done';
  d.zh['st.play'] = '去破译';
  d.en['st.play'] = 'play';
  d.zh['st.prev'] = '上一章';
  d.en['st.prev'] = 'prev';
  d.zh['st.next'] = '下一章';
  d.en['st.next'] = 'next';
  /* 叙事评审 Top3：每章「下章预告」钩子（st.cN.next） */
  d.zh['st.c0.next'] = '下一站：古罗马军团的移位密信——破译的第一课，从凯撒开始';
  /* C6 入门友好度：每章 TL;DR 摘要与前置提示 */
  d.zh['st.tldrLabel'] = '⚡ 30 秒版';
  d.en['st.tldrLabel'] = '⚡ 30-second version';
  d.zh['st.prereqLabel'] = '📌 预备知识';
  d.en['st.prereqLabel'] = '📌 Prerequisites';
  d.zh['st.c0.tldr'] = '一块石碑三种文字，让人类第一次读懂了消失尘封千年的古埃及文明——这就是「破译」的力量。';
  d.en['st.c0.tldr'] = 'One stone, three scripts, and humanity reads a lost civilization for the first time — the power of deciphering.';
  d.zh['st.c0.prereq'] = '';
  d.en['st.c0.prereq'] = '';
  d.zh['st.c1.tldr'] = '凯撒用字母移位写军令——第一个留下名字的密码体系；破译只需试 25 次，但两千年无人质疑它的权威。';
  d.en['st.c1.tldr'] = 'Caesar shifted letters to write military orders — the first named cipher in history; breaking it takes at most 25 tries.';
  d.zh['st.c1.prereq'] = '';
  d.en['st.c1.prereq'] = '';
  d.zh['st.c2.tldr'] = '肯迪发明频率分析——用统计方法破解替换密码，密码分析学从此诞生。';
  d.en['st.c2.tldr'] = 'Al-Kindi invented frequency analysis — statistics breaks substitution, birthing cryptanalysis.';
  d.zh['st.c2.prereq'] = '了解第 1 章的替换密码概念';
  d.en['st.c2.prereq'] = 'Read Chapter 1 for the substitution cipher concept';
  d.zh['st.c3.tldr'] = '培根双字体隐写与维吉尼亚多表替换——16 世纪欧洲的两条密码路线。';
  d.en['st.c3.tldr'] = 'Bacon\'s biliteral steganography and Vigenère\'s polyalphabetic cipher — two routes in 16th-century Europe.';
  d.zh['st.c3.prereq'] = '第 2 章的频率分析方法';
  d.en['st.c3.prereq'] = 'Chapter 2 frequency analysis';
  d.zh['st.c4.tldr'] = '齐默尔曼电报改写美国立场、ADFGVX 在总攻前夜被破——一战把密码从手艺变成工业。';
  d.en['st.c4.tldr'] = 'The Zimmermann Telegram pulled America into WWI; ADFGVX was broken on the eve of an offensive — codebreaking went industrial.';
  d.zh['st.c4.prereq'] = '电报通信基本概念';
  d.en['st.c4.prereq'] = 'Basic telegraph concept';
  d.zh['st.c5.tldr'] = '图灵的 Bombe 击破 Enigma、Colossus 攻读 Lorenz——布莱切利园让「机器对机器」成为现实。';
  d.en['st.c5.tldr'] = 'Turing\'s Bombe broke Enigma; Colossus attacked Lorenz — Bletchley Park made machine-versus-machine real.';
  d.zh['st.c5.prereq'] = '了解 Enigma 的转子机制（第 4 章末尾有铺垫）';
  d.en['st.c5.prereq'] = 'Chapter 4 introduces the Enigma rotor mechanism';
  d.zh['st.c6.tldr'] = 'JN-25 密码 + AF 淡水陷阱 = 中途岛逆转——情报破译以少胜多的经典案例。';
  d.en['st.c6.tldr'] = 'JN-25 plus the AF water trap equals Midway — intelligence triumphing over overwhelming force.';
  d.zh['st.c6.prereq'] = '第 5 章的密码破译思维';
  d.en['st.c6.prereq'] = 'Chapter 5 codebreaking mindset';
  d.zh['st.c7.tldr'] = '紫密被破但情报没人信——珍珠港的教训：拥有情报不等于赢得战争。';
  d.en['st.c7.tldr'] = 'Purple was broken but the warnings went unheard — Pearl Harbor taught that having intelligence isn\'t the same as using it.';
  d.zh['st.c7.prereq'] = '第 6 章的太平洋战场背景';
  d.en['st.c7.prereq'] = 'Chapter 6 Pacific theater context';
  d.zh['st.c8.tldr'] = 'Colossus 攻读 Lorenz 电传流——世界第一台可编程计算机为破译而生。';
  d.en['st.c8.tldr'] = 'Colossus, the first programmable computer, was born to break Lorenz teleprinter ciphers.';
  d.zh['st.c8.prereq'] = '二进制基础概念';
  d.en['st.c8.prereq'] = 'Basic binary concepts';
  d.zh['st.c9.tldr'] = '苏联复用一次性密码本 → VENONA 项目曝光原子间谍网——完美体系的致命漏洞在于人。';
  d.en['st.c9.tldr'] = 'Soviet one-time pad reuse exposed atomic spies through VENONA — the fatal flaw in a perfect system was human.';
  d.zh['st.c9.prereq'] = '第 3 章 OTP 概念';
  d.en['st.c9.prereq'] = 'Chapter 3 OTP concept';
  d.zh['st.c10.tldr'] = '香农信息论→公钥革命→HTTPS——三千年密码史的终点是你口袋里的手机。';
  d.en['st.c10.tldr'] = 'From Shannon to public-key to HTTPS — three thousand years of cryptography ends in your pocket.';
  d.zh['st.c10.prereq'] = '前面全部章节（建议按顺序通读）';
  d.en['st.c10.prereq'] = 'All previous chapters (read in order)';
  d.en['st.c0.next'] = 'Next: a shifted field order in the Roman legions — decoding starts with Caesar';
  d.zh['st.c1.next'] = '单表替换终将被统计击穿——下一站，巴格达智慧宫的频率分析';
  d.en['st.c1.next'] = 'Substitution falls to statistics — next, frequency analysis in Baghdad';
  d.zh['st.c2.next'] = '频率分析横扫欧洲之前，先看隐写术如何把秘密藏进字里行间';
  d.en['st.c2.next'] = 'Before frequency analysis sweeps Europe — steganography hides secrets in plain sight';
  d.zh['st.c3.next'] = '电报让密码成为战争主角——下一站，第一次世界大战';
  d.en['st.c3.next'] = 'The telegraph makes ciphers a protagonist of war — next, World War I';
  d.zh['st.c4.next'] = '旧密码已破，新机器登场——下一站，布莱切利园与恩尼格玛';
  d.en['st.c4.next'] = 'Old ciphers broken, new machines rise — next, Bletchley Park and Enigma';
  d.zh['st.c5.next'] = '欧洲的 Enigma 破了，太平洋上还有另一场密码战——中途岛';
  d.en['st.c5.next'] = 'Enigma is broken in Europe — but another cipher war waits at Midway';
  d.zh['st.c6.next'] = '胜利之后是警钟——退回 1941 年冬，听珍珠港的教训';
  d.en['st.c6.next'] = 'After victory comes a warning — back to the winter of 1941 and Pearl Harbor';
  d.zh['st.c7.next'] = '从太平洋到欧洲最高统帅部——洛伦兹与第一台计算机';
  d.en['st.c7.next'] = 'From the Pacific to OKW headquarters — Lorenz and the first computer';
  d.zh['st.c8.next'] = '机器时代落幕，冷战登场——VENONA 与被窃听的帝国';
  d.en['st.c8.next'] = 'The machine age fades into the Cold War — VENONA and the bugged empire';
  d.zh['st.backList'] = '📜 编年史';
  d.en['st.backList'] = '📜 chronicle';
  d.zh['st.finalTitle'] = '最终密语';
  d.en['st.finalTitle'] = 'THE FINAL CIPHER';
  d.zh['st.finalEra'] = '终局';
  d.en['st.finalEra'] = 'ENDGAME';
  d.zh['st.finalLocked'] = '🔒 集齐全部 11 枚密钥字母后，这里将解锁最终密语。终章之前的每一章都藏着一封密信，去破译吧。';
  d.en['st.finalLocked'] = '🔒 Collect all 11 key letters to unlock the final cipher. Every chapter up to the finale hides a letter — go decode.';
  d.zh['st.finalHint'] = '把 11 枚密钥字母按章节顺序拼成一个 11 字母的单词。';
  d.en['st.finalHint'] = 'Arrange the 11 key letters in chapter order to form an 11-letter word.';
  d.zh['st.finalPh'] = '输入最终密语…';
  d.en['st.finalPh'] = 'Type the final phrase…';
  d.zh['st.finalWin'] = '🏆 最终破译者！你读完了密码学三千年的智识战争。';
  d.en['st.finalWin'] = '🏆 Final Decoder! You have read three thousand years of the war of wits.';
  d.zh['st.finalFail'] = '✗ 不是这个密语，再想想。';
  d.en['st.finalFail'] = '✗ Not that phrase — think again.';
  d.zh['st.challenge'] = '历史重现 · 挑战';
  d.en['st.challenge'] = 'History replay · challenge';
  d.zh['st.chqTitle'] = '章节小测';
  d.en['st.chqTitle'] = 'Chapter Quiz';
  d.zh['st.chqSub'] = '答对至少 2 题点亮「本章精通」——检验你读懂了这章多少';
  d.en['st.chqSub'] = 'Get at least 2 right to master this chapter — how much did you really learn?';
  d.zh['st.chPlain'] = '明文：';
  d.en['st.chPlain'] = 'Plaintext:';
  d.zh['st.chCheck'] = '✓ 判定';
  d.en['st.chCheck'] = '✓ Check';
  d.zh['st.chPick'] = '选电文编号：';
  d.en['st.chPick'] = 'Pick telegram:';
  d.zh['st.chBits'] = '相同段：';
  d.en['st.chBits'] = 'Common segment:';
  d.zh['st.chWin'] = '✓ 历史重现完成！';
  d.en['st.chWin'] = '✓ Replayed!';
  d.zh['st.chFail'] = '✗ 再想想——线索就在本章故事里。';
  d.en['st.chFail'] = '✗ Try again — the clue is in this chapter.';
  d.zh['st.finalAnswer'] = 'CODEBREAKER';
  d.en['st.finalAnswer'] = 'CODEBREAKER';

  /* 时代 */

})();

(function () {
  var d = Arcade.i18n.dicts;

  /* ==================== 第 0 章 · 破译的黎明 ==================== */

  d.zh['st.c0.b'] = '1799 年，拿破仑远征军的士兵在埃及罗塞塔镇附近挖出一块深色花岗闪长岩断碑。碑上刻着同一份诏令，却用了三种文字：最上方是古埃及象形文字，中间是世俗体，最下方是古希腊文。这便是后来大名鼎鼎的罗塞塔石碑。\n\n它像一把钥匙，却迟迟无人转动。此后二十多年，学者们盯着象形文字发愁：这些鸟、眼睛、绳结，究竟是不是「图画文字」？有人猜每个符号代表一个词，有人猜是寓言故事。直到一个法国少年登场——[[champollion]] 自幼痴迷埃及，11 岁那年便立下誓言：总有一天，我要读出没人能读的文字。他的突破口，是碑文中被椭圆圈框起来的一组符号——「王名圈」。商博良猜想：被圈起来的，会不会是国王的名字？希腊文段落中反复出现「托勒密」，他试着把希腊字母的音读进圈内符号——据说再借另一件双语文物方尖碑交叉验证……成功了。\n\n关键的洞察随之而来：象形文字并不纯粹表意，其中混着大量表音成分——一个符号可以既代表一个词，又代表一个音。1822 年 9 月，商博良向学界宣读破译成果，据说他冲进哥哥的书房，高喊「我成功了！」便晕倒在地。两年后，他据此出版《埃及文字体系纲要》，古埃及文字一千四百年的沉默，就此被彻底打破。\n\n为什么说这是「破译」的教科书案例？因为石碑提供了同一内容的三种编码：未知的象形文、半懂的世俗体、完全可读的希腊文。破译者无需看懂整篇，只需找到对应关系里的「锚点」——国王的名字——再像拼图一样，把整个体系一点点撬开。「破译」一词，字面正是「解开编码」：在商博良之前，没人相信读不懂的符号竟能被科学地解开。他不是翻译了古埃及，而是重建了它的规则。';
  d.en['st.c0.b'] = 'In 1799, soldiers of Napoleon\'s army, digging near the town of Rosetta in Egypt, unearthed a slab of dark granodiorite. It carried the same decree written three times: in hieroglyphs at the top, in demotic script in the middle, and in ancient Greek at the bottom. This was the Rosetta Stone.\n\nFor more than twenty years the stone sat like a key no one could turn. Scholars stared at the hieroglyphs — birds, eyes, knots — and asked: was this picture-writing? Did every sign stand for a word? Some thought it pure allegory. Then a French boy entered the story. [[champollion]] had been obsessed with Egypt since childhood; at eleven he vowed to read what no one could read. His breakthrough began with a detail on the stone: groups of signs enclosed in oval rings — the cartouche. If the Greek text mentioned Ptolemy again and again, he reasoned, perhaps the ringed signs spelled a king\'s name. He tried reading Greek sounds into the cartouche... and it worked.\n\nThe deeper insight followed: hieroglyphs are not purely ideographic. Mixed among the picture-signs are phonetic elements — a sign can stand for a word and for a sound at once. In September 1822 Champollion announced his findings to the Académie des Inscriptions; legend says he rushed into his brother\'s study shouting \'Je tiens l\'affaire!\' — "I\'ve got it!" — and fainted. Two years later his Précis du système hiéroglyphique laid out the whole system. Fourteen centuries of Egyptian silence had been broken.\n\nWhy is this the textbook case of decoding? Because the Rosetta Stone offers one message in three encodings: unknown hieroglyphs, half-understood demotic, and fully readable Greek. The decoder need not understand everything at once — only find the anchors in the correspondence, the royal names, then pry the whole system open piece by piece. That is what decoding means: not translation, but rebuilding the rules from the ciphertext itself.';

  /* 游戏关联：c0.g1=freq 词频分析 · c0.g2=guess 猜词破译 */
  d.zh['st.c0.g1'] = '词频分析：像商博良找「锚点」一样，先抓住一个频率突破口，再撬开全局。';
  d.en['st.c0.g1'] = 'Frequency Analysis: like Champollion finding his anchor, seize one frequency foothold and pry open the whole message.';
  d.zh['st.c0.g2'] = '猜词破译：像商博良猜「托勒密」的名字，用一次次反馈逼近真相。';
  d.en['st.c0.g2'] = 'Word Guess: guess the Ptolemy of the puzzle — every hint narrows the truth, letter by letter.';

  /* 密信：仿射 a=5,b=8，明文 CHAMPOLLION WINS（首字母 C） */
  d.zh['st.c0.lc'] = 'SRIQFALLWAV OWVU';
  d.en['st.c0.lc'] = 'SRIQFALLWAV OWVU';
  d.zh['st.c0.lh'] = '这是仿射密码：a=5、b=8（E=5x+8 mod 26），用下方解算器直接预览。';
  d.en['st.c0.lh'] = 'An affine cipher: a=5, b=8 (E = 5x + 8 mod 26). Preview it with the solver below.';

  /* 趣味条（funFacts，2 条） */
  d.zh['st.c0.facts'] = '罗塞塔石碑上的三语对照，本质是同一内容的三种编码，破译就是找回三套符号间的对应规则；「cartouche（王名圈）」一词源自法语「弹药筒」，因拿破仑士兵觉得圈形符号像火枪弹壳。';
  d.en['st.c0.facts'] = 'The Rosetta Stone is one message in three encodings — decoding means recovering the rules that connect them. And "cartouche" comes from the French for "cartridge": Napoleon\'s soldiers thought the oval rings looked like musket cartridges.';

  /* 支线挑战：词频侦探 */
  d.zh['st.c0.ch'] = '词频侦探：数一数下方密文里每个字母出现几次，回答：出现最多的密文字母，通常对应英文的哪个字母？';
  d.en['st.c0.ch'] = 'Frequency Detective: count the letters in the ciphertext below — which English letter does the most frequent cipher letter usually stand for?';

  /* ==================== 第 1 章 · 凯撒的密令 ==================== */

  d.zh['st.c1.b'] = '罗塞塔石碑让我们看清了「破译」的本质——现在，把时间倒回两千年前，从罗马军团的一纸军令说起。公元前 58 年，罗马总督[[caesar]]挥师北上，用八年时间征服高卢。前线与罗马城远隔千里，军情只能靠信使骑马传递——一旦信使被截，兵力部署便一览无余。于是凯撒想出一个简单的法子：写信时，把字母表里的每个字母都向后移三位——A 写成 D，B 写成 E，C 写成 F……收信人把字母移回三位，军令即复原。这便是史上最著名的密码：凯撒移位密码。\n\n以今天的字母表举例：明文 ATTACK AT DAWN，把每个字母后移 3 位，就变成 DWWDFN DW GDZQ——A 变 D，T 变 W，这便是加密；把每个字母前移 3 位，密文又变回明文，这便是解密。凯撒的部下人人都会，而敌方即便截获书信，看到的也只是一串字母迷宫。罗马史料里倒真有一封密码信：西塞罗曾给部将普朗库斯写过加了密的信件，普朗库斯按约定读了出来——加密确确实实给书信上了一道保险。\n\n这密码真的安全吗？并不。字母表只有 26 个字母，移位总共只有 25 种可能——从 1 试到 25，总有一个能让密文还原成通顺的拉丁文。所以凯撒密码不是「破不了」，而是「懒得破」：在高卢人眼中，罗马人的文字本身已是天书。这里还藏着一个重要区分：密码（cipher）改变的是字母，编码（code）替换的是单词。凯撒用的是密码——而今天所有的数字加密，其实都站在同一棵树下。\n\n两千年后回望，我们才看清：凯撒的移位密码，不过是「替换密码」家族里最简单的一个特例——每个字母都被同一个固定的字母替换。它挡得住信使被劫，却挡不住一个会数字母的人。破译的天平，从这一刻起悄悄倾斜。\n\n更早的东方，另一种答案早已成形：周人以「阴符」两半相合验证军情，《六韬》所记「阴书」更把一封密信拆作三份、分道而驰——单份被截，密不自泄。罗马在替换字母时，东方在分割与符验里，走向了保密的另一条岔路。';
  d.en['st.c1.b'] = 'The Rosetta Stone showed what deciphering means — now rewind two thousand years, to a field order of the Roman legions. Between 58 and 50 BC the Roman commander [[caesar]] marched his legions through Gaul. Orders had to travel hundreds of miles by mounted courier — and if a courier was caught, the whole plan lay open. So Caesar did something wonderfully simple: he wrote every letter three places further along the alphabet. A became D, B became E, C became F. The receiver simply shifted the letters back. Thus was born the most famous cipher in history: the Caesar shift.\n\nTry it with today\'s alphabet. Write ATTACK AT DAWN; move every letter forward by three — A to D, T to W — and you get DWWDFN DW GDZQ. That is encryption. Shift everything back three places and the message returns. Caesar\'s officers could do it in their heads; an enemy who intercepted the letter saw only a jumble of letters. Roman records preserve one real cipher letter: Cicero wrote to his general Plancus in code, and Plancus read it by the agreed convention — encryption truly put a lock on the post.\n\nWas it secure? Not really. An alphabet of twenty-six letters admits only twenty-five possible shifts; try each one, and one of them turns the ciphertext back into readable Latin. The Caesar cipher was less unbreakable than merely unbothered: to the Gauls, Latin itself was already a secret script. It also marks a distinction worth keeping: a cipher scrambles letters, while a code replaces whole words. Caesar used a cipher — and every modern encryption scheme, in a sense, stands under the same old tree.\n\nTwo thousand years later, we can see the Caesar shift for what it is: the simplest special case of the substitution family, in which every letter is replaced by one fixed letter. It could protect a letter from a courier who was caught — but not from a person who could count. From that moment, quietly, the balance of the decoding war began to tilt.\n\nIn those same centuries the East was shaping a different answer: Zhou commanders matched tally halves ("yinfu") to authenticate orders, and the Liu Tao records "yinshu" letters cut into three parts carried along separate routes — any single capture revealed nothing. While Rome substituted letters, China split and verified: another fork on the road of secrecy.';

  /* 游戏关联：c1.g1=caesar 凯撒解码 · c1.g2=substitution 替换密码 */
  d.zh['st.c1.g1'] = '凯撒解码：亲手拖动偏移量，还原两千年前罗马军令的本来面目。';
  d.en['st.c1.g1'] = 'Caesar Cipher: drag the shift and restore a two-thousand-year-old Roman order.';
  d.zh['st.c1.g2'] = '替换密码：凯撒密码只是它的一个特例——每个字母换成固定的另一个字母。';
  d.en['st.c1.g2'] = 'Substitution: Caesar\'s shift is only its special case — every letter swapped for one fixed other.';

  /* 密信：凯撒偏移 k=3，明文 ORDER THE LEGIONS（首字母 O） */
  d.zh['st.c1.lc'] = 'RUGHU WKH OHJLRQV';
  d.en['st.c1.lc'] = 'RUGHU WKH OHJLRQV';
  d.zh['st.c1.lh'] = '凯撒的惯例偏移是 3：把密文的每个字母前移 3 位即得明文。';
  d.en['st.c1.lh'] = 'Caesar\'s usual shift is 3: move every cipher letter back three places.';

  /* ==================== 第 2 章 · 阿拉伯的破译者 ==================== */

  d.zh['st.c2.b'] = '公元 9 世纪的巴格达，是当时世界的智识之都。阿拔斯王朝的哈里发在此营建「智慧宫」，把希腊、波斯、印度的典籍源源译成阿拉伯文——数学、天文、医学、哲学，尽数交汇。宫里住着一位百科全书式的学者：[[kindi]]。他一生写了两百多部著作，涵盖哲学、光学、音乐与数学；而其中一卷薄薄的手稿，后来被称作密码分析学的出生证明——《解译加密信息手稿》。\n\n在这部约写于 850 年的手稿中，肯迪给出了一个石破天惊的论断：破解单表替换密码，是有方法可循的。他的方法是频率分析——先数一数密文里每个字母各出现几次，再与这门语言的自然频率对照。他写道：如果我们知道一种语言里哪个字母出现得最多，那么把密文中出现最多的那个字母当成它，就能解开。阿拉伯语如此，任何语言皆然。\n\n用今天的英语打比方：E 出现得最多，约占 12.7%，其后是 T、A、O、I、N——老密码迷把这五个字母念成 ETAOIN。假如一封替换密文里，字母 X 出现频率最高，那么 X 十有八九就是 E。猜中一两个字母，单词的轮廓便开始浮现，整篇密文像多米诺骨牌一样倒下。\n\n这一招，让沿用上千年的单表替换密码「死」了——只要密文够长，频率分析几乎必破。它的意义远不止于密码本身：这是人类第一次证明，破译不是碰运气或靠直觉，而是一门可以用统计与推理攻克的科学。约十一个世纪后，布莱切利园里的人们所做的，本质上仍是肯迪做过的事——数字母、找规律、撬开规则。频率分析，是一切破译的起点。\n\n频率分析照亮巴格达的两百年后，东方的军中密语也在生长：北宋《武经总要》以把四十条军情对应一首四十字、字不重复的诗，逐字定位即得密写，另备多首同类诗逐日换钥——这套「字验」；明将戚继光后来更从本土音韵学中造出「反切码」。统计破译与换表加密的竞赛，从来不只发生在一种文字里。';
  d.en['st.c2.b'] = 'In the ninth century, Baghdad was the intellectual capital of the world. Under the Abbasid caliphs, the House of Wisdom gathered scholars who translated Greek, Persian and Indian learning into Arabic — mathematics, astronomy, medicine, philosophy, all meeting in one city. Among them lived [[kindi]], the Philosopher of the Arabs: a polymath who wrote hundreds of works on philosophy, optics, music and mathematics. And in one slim volume, written around 850, he produced what many call the birth certificate of cryptanalysis — A Manuscript on Deciphering Cryptographic Messages.\n\nIn that manuscript Al-Kindi made a stunning claim: breaking a monoalphabetic substitution is a method, not a miracle. His method was frequency analysis. Count how often each letter appears in the ciphertext, then compare those counts with the natural frequencies of the language. If we know which letters appear most often in a language, he wrote, then the most frequent letter in the cipher is very likely that letter. The argument works for Arabic — and for any language.\n\nIn modern English the same trick reads as ETAOIN: E appears about 12.7 percent of the time, then T, A, O, I, N. If X is the most frequent letter in a substitution ciphertext, X is almost certainly E. Guess one or two letters, and the shapes of words begin to emerge; the whole message topples like dominoes.\n\nWith that single idea, Al-Kindi killed the monoalphabetic substitution that had served for a thousand years — as long as the ciphertext is long enough, frequency analysis nearly always wins. Its importance reaches far beyond ciphers: for the first time, decoding was shown to be a science of statistics and inference, not luck. Nine centuries later, the people of Bletchley Park were still doing what Al-Kindi did: count letters, find patterns, pry open the rules. Frequency analysis is where all decoding begins.\n\nTwo centuries after frequency analysis lit up Baghdad, military secrecy was quietly maturing in the East as well: the Song-dynasty Wujing Zongyao wove forty tactical reports into "ziyan" poems whose key characters changed daily, and Ming general Qi Jiguang would later forge his fanqie code from native phonology. The contest of statistics and substitution has never belonged to one script alone.';

  /* 游戏关联：c2.g1=freq · c2.g2=guess · c2.g3=substitution */
  d.zh['st.c2.g1'] = '词频分析：你正在做肯迪做过的事——数字母、找规律、撬开替换密码。';
  d.en['st.c2.g1'] = 'Frequency Analysis: you are doing exactly what Al-Kindi did — count, match, break.';
  d.zh['st.c2.g2'] = '猜词破译：肯迪用频率锁定第一个字母，你用反馈锁定每一个字母。';
  d.en['st.c2.g2'] = 'Word Guess: Al-Kindi locked the first letter by frequency; you lock every letter by feedback.';
  d.zh['st.c2.g3'] = '替换密码：肯迪宣布了它的死刑——频率分析之下，单表替换无所遁形。';
  d.en['st.c2.g3'] = 'Substitution: Al-Kindi signed its death warrant — under frequency analysis it cannot hide.';

  /* 密信：单表替换（QWERTY 表），明文 DECODE THE ARAB MESSAGE（首字母 D） */
  d.zh['st.c2.lc'] = 'RTEGRT ZIT QKQW DTLLQUT';
  d.en['st.c2.lc'] = 'RTEGRT ZIT QKQW DTLLQUT';
  d.zh['st.c2.lh'] = '频率线索：密文中最多的 T 对应 E。解密片段：G→O、I→H、Q→A、R→D、T→E、Z→T。';
  d.en['st.c2.lh'] = 'Frequency clue: the most frequent cipher letter T maps to E. Decrypt fragments: G→O, I→H, Q→A, R→D, T→E, Z→T.';

  /* ==================== 人物志（role/era/bio/quote；name 与 icon 已存在） ==================== */

  /* ==================== 密件（desc/text；name 与 era 已存在） ==================== */

})();

(function () {
  var d = Arcade.i18n.dicts;

  /* ============ 第3章 培根的隐形墨水 ============ */
  d.zh['st.c3.b'] = '1623 年，伦敦的印刷机吐出一卷厚重的拉丁文著作《学术的进展》（De Augmentis Scientiarum）。作者[[bacon]]是英国最耀眼也最矛盾的大脑：女王面前的政治家、英格兰大法官，更是「科学方法之父」。别人在书里写哲学，他却在第 6 卷悄悄藏了一份给未来的礼物——一种把秘密缝进普通文字的方法：双字体密码。\n\n原理朴素得惊人：把 26 个字母编号 0 到 25，每个编号写成 5 位 A/B 串（A=0，B=1），再用两种字体代替 A 与 B——普通字体与加粗字体。于是「ENGLISH」变成三十五个 A/B 符号，伪装成一页散文里三十五个字形的细微差异。表面是书页，内里是密信。这就是隐写术（steganography）：加密是把信锁进保险箱，隐写是把信画成墙纸——它隐藏的不是内容，而是「内容存在」这件事本身。\n\n几乎同时，欧洲另一端锻造出另一面更硬的盾。法国外交官[[vigenere]]在 1586 年出版《密码论》——后世把这类多表替换冠以他的名字（真正的首发者是 1553 年的贝拉索，见本章冷知识）：密钥逐字母决定用 26 张字母表中的哪一张替换当前字母。凯撒只有一张字母表，词频分析一戳就破；维吉尼亚每个位置换一张表，「E」一会儿变 A、一会儿变 Q，频率被抹平。整整三百年，欧洲人叫它「不可破译的密码」。\n\n讽刺的是，培根的双字体在 17 世纪几乎没有实战价值；维吉尼亚却被当作铁壁用了三百年，直到 19 世纪才被 Kasiski 检验撬开裂缝。而培根那 5 位 A/B 的思路，两百年后启发了莫尔斯电码与二进制——原来「两种符号」就是一切计算的起点。';
  d.en['st.c3.b'] = 'In 1623, London\'s presses produced a weighty Latin volume, De Augmentis Scientiarum. Its author, [[bacon]], was one of England\'s brightest and most contradictory minds: a politician before the Queen, Lord Chancellor of the realm, and the father of the scientific method. Where others wrote philosophy, he hid a gift for the future in Book VI — a way to sew a secret into ordinary text: the biliteral, two-font cipher.\n\nThe principle is almost embarrassingly simple. Number the 26 letters 0 to 25; write each number as five symbols of A and B (A = 0, B = 1); let A stand for a normal letter and B for a bold one. "ENGLISH" becomes thirty-five A/B symbols, disguised as thirty-five tiny differences in typeface across a page of prose. On the surface a book; underneath, a letter. This is steganography: encryption locks a letter in a safe, steganography paints it into the wallpaper — hiding not the content, but the very fact that content exists.\n\nAt almost the same moment, the far side of Europe forged a harder shield. The French diplomat [[vigenere]] published his polyalphabetic cipher in 1586: a keyword decides, letter by letter, which of 26 alphabets replaces the current letter. Caesar had one alphabet, and frequency analysis punctured it; Vigenère switches alphabets every position, so "E" becomes A here and Q there, flattening the frequencies. For three hundred years, Europe called it "the indecipherable cipher."\n\nThe irony: Bacon\'s two fonts saw little real use in the 1600s, while Vigenère was trusted as an iron wall for three centuries — until the Kasiski test found its crack in the 19th century. And Bacon\'s five A/B symbols? Two centuries later they inspired Morse code, and binary itself. Two symbols, it turns out, are where all computing begins.';

  d.zh['st.c3.g1'] = '亲手做一次培根实验：把英文句子编码成 A/B 双字体，再还原成文字。5 位一组、A=0 B=1——二进制在 1623 年就诞生了。';
  d.en['st.c3.g1'] = 'Run Bacon\'s own experiment: encode a sentence into A/B two-font symbols, then read it back. Five symbols per letter, A=0, B=1 — binary, born in 1623.';
  d.zh['st.c3.g2'] = '领到一把维吉尼亚密钥：逐字母减去偏移，把「不可破译的密码」撬开一角。';
  d.en['st.c3.g2'] = 'Grab a Vigenère key, subtract the shift letter by letter, and prise open a corner of the "indecipherable cipher".';

  d.zh['st.c3.lc'] = 'AABAAABBABAABBAABABBABAAABAABAAABBBAABBBABAAAAAABBAABAABAABABAABAAABAAAAABABAAABAABAABAABBBAABA';
  d.en['st.c3.lc'] = 'AABAAABBABAABBAABABBABAAABAABAAABBBAABBBABAAAAAABBAABAABAABABAABAAABAAAAABABAAABAABAABAABBBAABA';
  d.zh['st.c3.lh'] = '这是一封培根双字体密信：一串 A/B 符号，每 5 位一组代表一个字母（A=0、B=1 的 5 位二进制，字母按 A-Z 编为 0-25）。可直接用上方「培根双字体」解算器解码，或对照 26 个字母的 5 位编码表手工还原。';
  d.en['st.c3.lh'] = 'This is a Bacon two-font letter: a string of A/B symbols, five per letter (5-bit binary with A=0, B=1; A–Z are numbered 0–25). Decode it with the Bacon solver above, or look each group up on the 5-bit table by hand.';

  /* ============ 第4章 一战的电波战 ============ */
  d.zh['st.c4.b'] = '1914 年 8 月，开战头一个月，英国电缆船悄悄剪断了德国横跨大西洋的海底电缆。德国从此只能借道中立国的线路，或者依靠无线电波与美洲对话。无线电报让指挥变得前所未有地快，也让秘密变得前所未有地危险：电波没有国界，谁都能截获，谁都能抄录。密码，第一次成了国家的生死线。\n\n1917 年 1 月 16 日，德国外交部长齐默尔曼（Arthur Zimmermann）拍出一封改写历史的密电：他命令驻墨西哥大使——一旦美国参战，就游说墨西哥进攻美国，并许诺帮它夺回得克萨斯、新墨西哥与亚利桑那。这封电报借道美国国务院的外交电缆转发——线路恰好经伦敦登陆，而这条线路，正是伦敦海军部 40 号房（Room 40）日夜监听的地方。破译员用缴获的德国外交部 13040 号码本逐组还原，读出的内容让他们几乎不敢相信：德国在怂恿墨西哥向美国宣战。3 月 1 日，电报全文见报；4 月 6 日，美国对德宣战。一封被破译的密电，把二十世纪最庞大的工业国拖进了战争。\n\n同一年，另一条战线上，法军上尉[[payne]]正在苦战。德军 1918 年 3 月启用 ADFGX（5×5 方阵），6 月 1 日换用加入数字的 ADFGVX（6×6 方阵）：把字母换成 A、D、F、G、V、X 六个符号，再按密钥做列换位——两层加密叠成一道墙。佩恩万每天面对上千条截获电文，在两条开头相同的电报里找到了裂缝：它们加密前必然相同，换位后的指纹也就必然相同。1918 年 6 月 3 日，他破开了德军新一轮攻势的密电，法军据此挡住了直扑巴黎方向的攻势。\n\n而在英军阵地上，一种更朴素的密码在默默工作：Playfair 用 5×5 方阵把字母成对加密，野战部队靠它在电台上快速通信；摩斯电码则叮叮当当地把命令送上每一部发报机。第一次世界大战，是电报的战争——也是破译者的战争。';
  d.en['st.c4.b'] = 'In August 1914, in the war\'s first month, a British cable ship quietly cut Germany\'s transatlantic cables. From then on Germany could reach the Americas only through neutral lines — or through the air itself. Radio made command faster than ever and secrets more dangerous than ever: the airwaves belong to no one, so anyone could intercept, anyone could copy. For the first time, the cipher became a nation\'s lifeline.\n\nOn 16 January 1917, German Foreign Secretary Arthur Zimmermann sent a telegram that rewrote history. His minister in Mexico was ordered — should the United States enter the war — to urge Mexico to attack America, promising the return of Texas, New Mexico and Arizona. The message travelled through the American State Department cable — routed through London — a route the Admiralty\'s Room 40 listened to day and night. Working from a captured German Foreign Office codebook (No. 13040), the codebreakers read it group by group and could scarcely believe their eyes: Germany was urging Mexico to declare war on America. On 1 March the text hit the front pages; on 6 April America declared war on Germany. One broken cipher dragged the mightiest industrial nation of the twentieth century into the war.\n\nThat same year, on another front, Captain [[payne]] was fighting his own war. In March 1918 the Germans fielded ADFGX, and on 1 June switched to the digit-adding ADFGVX: a 6×6 Polybius square turned letters into the six symbols A, D, F, G, V, X, then a keyword scrambled the columns — two layers of encryption stacked into a wall. Painvin faced a thousand intercepted messages a day; he found his crack in two telegrams with identical openings, which must have been identical before encryption, and therefore left identical transposed fingerprints. On 3 June 1918 he broke the messages behind a fresh German offensive — and the French line held Paris one last time.\n\nOn the British side, a plainer cipher did its quiet work: Playfair enciphered letters in pairs on a 5×5 square, fast enough for field units; Morse code rattled orders over every wireless set. The First World War was the telegraph war — and the codebreakers\' war.';

  d.zh['st.c4.g1'] = '德军一战的终极密码：6×6 方阵替换 + 密钥列换位。像佩恩万一样，用两条开头相同的电报撕开双层密墙。';
  d.en['st.c4.g1'] = 'Germany\'s ultimate WWI cipher: a 6×6 square substitution plus a keyed columnar transposition. Like Painvin, tear open the double wall with two telegrams that share an opening.';
  d.zh['st.c4.g2'] = '英军野战密码：5×5 方阵把字母成对加密。电台上快速可靠，却藏不住规律——规律由你来找。';
  d.en['st.c4.g2'] = 'The British field cipher: letters enciphered in pairs on a 5×5 square. Fast and dependable on the radio — but the pattern is there for you to find.';
  d.zh['st.c4.g3'] = '波利比奥斯方阵：5×5 坐标把字母变成数字对——ADFGVX 的地基，战前就已打好。';
  d.en['st.c4.g3'] = 'Polybius square: a 5×5 grid turns letters into coordinate pairs — the foundation ADFGVX stood on.';
  d.zh['st.c4.g4'] = '尼希尔斯特：坐标数字再叠一层密钥数字——俄国革命的老手艺，一战余烬里仍在使用。';
  d.en['st.c4.g4'] = 'Nihilist: coordinates with an extra keyed number layer — an old Russian trade still smoldering after WWI.';
  d.zh['st.c4.g5'] = '把明文写成一排锯齿再横着读：栅栏密码是列换位最朴素的祖先，一战中仍在服役。';
  d.en['st.c4.g5'] = 'Write the plaintext in a zigzag, read it off row by row: the rail fence is the plainest ancestor of transposition — still in service during the war.';
  d.zh['st.c4.g6'] = '电报是这一切的载体：摩斯电码把字母变成点划，把秘密送上电波。先学会听，再学会破。';
  d.en['st.c4.g6'] = 'The telegraph carried it all: Morse turns letters into dots and dashes and puts secrets on the air. Learn to listen first, then to break.';
  d.zh['st.c4.g7'] = '一段完整的长报文：把点划连成句子，像战地报务员一样处理整份电文。';
  d.en['st.c4.g7'] = 'A full long dispatch: join dots and dashes into sentences, and handle a whole message like a field signaller.';
  d.zh['st.c4.g8'] = '用耳朵破译：听音辨点划。一战监听站里，报务员就是这样一夜夜抄下敌人的电波。';
  d.en['st.c4.g8'] = 'Decode with your ears: pick out dots and dashes by sound. That is how the intercept stations spent their nights, copying the enemy off the air.';

  d.zh['st.c4.lc'] = 'BAEELRTIDCDSLINOA';
  d.en['st.c4.lc'] = 'BAEELRTIDCDSLINOA';
  d.zh['st.c4.lh'] = '这是栅栏密码（Rail Fence）密信，用 3 轨加密：明文按锯齿形写进三条轨道，再逐行读出。还原时先按锯齿路径数出每轨字母数，再把密文放回原位；解算器里把轨道数设为 3。';
  d.en['st.c4.lh'] = 'This is a Rail Fence letter, enciphered on 3 rails: the plaintext was written in a zigzag across three rails, then read off row by row. To recover it, count the letters per rail along the zigzag and place the ciphertext back; set the solver\'s rails to 3.';

  d.zh['st.c4.facts'] = '破译齐默尔曼电报靠的是德国外交部 13040 号外交码本——它是英军在中东缴获的战利品；而德军海军密码本 0075，则来自波罗的海沉没的巡洋舰「马格德堡」号。更妙的是，电报全文见报后，齐默尔曼本人竟亲口承认密电是真的——敌人的外长亲自验证了破译结果。';
  d.en['st.c4.facts'] = 'The Zimmermann Telegram was read with the German Foreign Office codebook No. 13040, captured in the Middle East; the naval codebook 0075 came from the sunken cruiser SMS Magdeburg in the Baltic. Best of all, after the text was published, Zimmermann himself admitted it was genuine — the enemy\'s own foreign minister confirmed the break.';

  /* ============ 第5章 布莱切利园的机器 ============ */
  d.zh['st.c5.b'] = '一战落幕，密码的军备竞赛却未停歇——战间期的欧洲，一台新机器正在重新武装德国；而最先看穿它的，是一群波兰数学家。1939 年，战争爆发前夜，一群数学家、棋手与语言学家被悄悄召集到伦敦以北五十英里的布莱切利园——一座维多利亚式庄园。他们的任务只有一个：读懂德国人用 Enigma 加密的每一份电报。德国人相信这台机器不可战胜，而英国人相信：只要是人造的锁，就有人能配出钥匙。\n\n这座庄园的内里，其实是一排排编号的木屋——破解 Enigma 的工程，正是按木屋切分的。Hut 6 负责陆军与空军的 Enigma：北非沙漠、东线战壕、西线天空发回的战术电文，在这里变成可读的军情；Hut 8 则专攻最难啃的硬骨头——海军 Enigma，它守着大西洋的潜艇战，钥匙每转一格，都关系着几十艘商船与海员的生死。两座木屋并不各自为战：Hut 6 破出的陆军电文里常藏着海军的蛛丝马迹，Hut 8 解出的潜艇航线又反哺空军的反潜搜索——图灵和他的同事们，就在这交错的分工里，把 Enigma 这张大网一格格撕开。\n\nEnigma 看起来像一台打字机。按下字母键，电流穿过三个转子、经过反射器再折返，点亮另一个字母。每按一键，转子就转一格；转子位置变了，同一个字母的加密结果就不同。机器前部还有插线板，可以把成对字母互换。三者相乘，密钥空间大到无法穷举——德军每天更换转子顺序、插线板设置与起始位置，即「每日密钥」。更狡猾的是，Enigma 加密即解密：收发双方用同一设置，密文在另一台机器上就是明文。\n\n破绽在于：机器不是随机的，而是「确定性的复杂」。[[turing]]发现，只要猜中一段「已知明文」（crib）——比如天气预报固定开头的「WETTER」——就能把转子设置从天文学数字中筛出来。他设计的 Bombe 是一台两人高的机电怪兽：同时模拟三十六组三转子 Enigma 等效组合，用电路在数小时内扫描上亿种可能。但真正的加速来自[[welchman]]的对角线板：他把 Enigma 的自反特性变成一张逻辑网，让 Bombe 在十几分钟内完成过去数小时的搜索。从此，Enigma 不再是墙，而是漏水的筛子。\n\n而在另一排机房里，Bombe 机昼夜轰鸣。操作这些两人高怪兽的，是约两千名操作员，绝大多数是年轻女性——来自皇家海军女子服务队（Wrens）。她们三班倒、24 小时不停机：按当天的候选设置装好转子与插线板、上电、记录每一次「停机」读数，再在刺耳的机械声与闷热的气流里等待下一轮。她们大多不知道自己在找什么，只知道这台机器每停一次，或许就有几条德国电文被撕开。正是这群不署名的操作员，撑起了 Ultra 得以运转的血肉。\n\n破译成果被命名为 Ultra，只许极少数人阅读。北非，蒙哥马利靠 Ultra 预知隆美尔补给船队的航线；大西洋，护航队靠它绕过狼群；诺曼底登陆前，盟军靠它确认加莱的装甲师不会增援诺曼底。每一次胜利都像巧合——因为保密本身就是武器。直到 1974 年《The Ultra Secret》出版，世界才知道这场「机器对机器」的战争：二战真正的隐形战场，在布莱切利园的木屋里。\n\n北非的故事，最能说明 Ultra 的分量。1942 年，隆美尔的非洲军团离埃及只剩一步之遥，可他缺的不是坦克，而是油。德军补给船队横渡地中海的每一次出发时间与航线，都先经 Enigma 电文发出、再被布莱切利园读个干净；盟军海空军据此把伏击线画到准确的海域，一艘接一艘击沉运油船；蒙哥马利则凭它握住了隆美尔的底牌。等到阿拉曼的炮声响起，隆美尔的装甲师已油尽弹绝——蒙哥马利赢下的不只是兵力，更是情报上的先手：敌人的每一次「秘密行动」，早在出发前就已泄露。\n\n胜利的代价里，还有一份迟到了几十年的沉默。战后，几乎所有接触过 Ultra 的人都签了保密令：不能对家人、朋友，甚至不能对彼此提起自己做过什么。有人回到家，几十年里被问起「战争中你做了什么」，只能含糊地答一句「文书工作」；有人直到 1974 年《The Ultra Secret》出版，才第一次对妻子讲出当年的真相。破译了敌人最深的秘密，却要半辈子守着自己的秘密——这种不能说出口的孤独，是布莱切利园留给他们最重的一枚勋章。';
  d.en['st.c5.b'] = 'The war ended, but the cipher arms race did not — and the first to see through Germany\'s new machine were Polish mathematicians. On the eve of war in 1939, a strange assortment of mathematicians, chess players and linguists was quietly gathered fifty miles north of London, at Bletchley Park — a Victorian mansion. Their one task: read every German message enciphered on the Enigma machine. The Germans believed the machine was unbeatable; the British believed that any lock made by a human can be opened by a human.\n\nThe mansion\'s interior was really a line of numbered wooden huts, and the work of breaking Enigma was divided among them. Hut 6 handled the Army and Air Force Enigma: the tactical traffic from the North African desert, the Eastern Front trenches and the skies over Western Europe passed through it and emerged as readable intelligence. Hut 8 took on the hardest nut of all — the Naval Enigma — which guarded the U-boat war in the Atlantic; every turn of its key decided the fate of dozens of merchant ships and the men aboard them. The two huts did not work in isolation: a fragment recovered in Hut 6 could betray a naval habit, and a U-boat route read in Hut 8 could sharpen the RAF\'s anti-submarine hunt. Turing and his colleagues pulled the Enigma net apart, one knot at a time, across those interlocking shifts.\n\nThe Enigma looked like a typewriter. Press a key and current flows through three rotors, bounces off a reflector, and lights up another letter. Each keystroke turns a rotor one step, so the same letter encrypts differently every time. A plugboard on the front swapped pairs of letters for good measure. Multiplied together, the keyspace was too vast to search — and the Germans changed the rotor order, plugboard and starting positions every day: the daily key. Wickedest of all, encryption and decryption were the same operation: two machines set identically, and the ciphertext on one is the plaintext on the other.\n\nThe flaw: the machine was not random, it was deterministically complicated. [[turing]] saw that if you could guess a crib — a known plaintext, like the weather report\'s fixed opening "WETTER" — you could winnow the rotor settings out of the astronomical search space. His Bombe was an electromechanical monster the size of a wardrobe: it simulated thirty-six three-rotor Enigma equivalents at once, scanning hundreds of millions of settings in hours. The real speed-up came from [[welchman]]\'s diagonal board: it turned the Enigma\'s self-reciprocal wiring into a logic net, letting the Bombe finish in minutes what took hours. From then on, the Enigma was not a wall — it was a leaking sieve.\n\nIn another block of rooms the Bombes thundered around the clock. The machines were tended by about two thousand operators, the great majority of them young women of the Women\'s Royal Naval Service — the Wrens. They worked three shifts, twenty-four hours a day: fitting rotors and plugboard settings to match each day\'s candidate keys, powering up, logging every "stop" the machine reported, then waiting through the mechanical roar and the hot, stuffy air for the next run. Most of them never knew exactly what they were hunting; they knew only that each stop of the machine might tear open another German message. These unnamed operators were the flesh and blood on which ULTRA ran.\n\nThe harvest was codenamed ULTRA, read by only a handful. In North Africa, Montgomery used it to know where Rommel\'s supply convoys would sail; in the Atlantic, convoys dodged the wolf packs; before D-Day, the Allies confirmed that the Panzers massed at Calais would not reinforce Normandy. Every victory looked like luck — because secrecy was itself a weapon. Not until 1974, with the publication of The Ultra Secret, did the world learn the truth: the war\'s true invisible battlefield had been fought in the wooden huts of Bletchley Park.\n\nNorth Africa shows best what ULTRA was worth. In 1942 Rommel\'s Afrika Korps stood a step from Egypt — but what he lacked was not tanks, it was fuel. Every sailing and every route of the German supply convoys crossing the Mediterranean went out first as an Enigma message, and Bletchley read them clean; armed with that, Montgomery sent submarines and bombers to the right stretch of sea, sinking the tankers one after another. By the time the guns opened at El Alamein, Rommel\'s armour was running dry. Montgomery\'s edge lay not only in men and machines but in foreknowledge: the enemy\'s every "secret movement" had already leaked before it ever sailed.\n\nPart of the price of victory was a silence that lasted decades. After the war nearly everyone who had touched ULTRA signed an order of secrecy: they could not tell their families, their friends, or even one another what they had done. Some went home and spent the rest of their lives answering "What did you do in the war?" with a vague "clerical work." Others first told their wives the truth only after The Ultra Secret appeared in 1974. They had read the enemy\'s deepest secrets and had to keep their own for half a lifetime — that unspoken solitude was the heaviest medal Bletchley ever pinned on them.';

  d.zh['st.c5.g1'] = '亲手转动转子、插好插线板，体验 Enigma 的加密回路——以及加密等于解密的奇妙对称。';
  d.en['st.c5.g1'] = 'Turn the rotors, patch the plugboard, and feel the Enigma\'s circuit — including its eerie symmetry: to encrypt is to decrypt.';
  d.zh['st.c5.g2'] = '像图灵的 Bombe 一样，用已知明文（crib）当钩子，从海量转子设置里把答案筛出来。';
  d.en['st.c5.g2'] = 'Like Turing\'s Bombe, use a crib — known plaintext — as the hook, and sift the answer out of millions of rotor settings.';
  d.zh['st.c5.g3'] = '缴获机器 + 已知明文 = 反推插线板：这是「已知明文攻击」走进战争的原型。';
  d.en['st.c5.g3'] = 'Captured machine + known plaintext = plugboard recovery: the prototype of the known-plaintext attack in wartime.';
  d.zh['st.c5.g4'] = '词频分析、Kasiski 检验、已知明文攻击：三件古典破译工具，装进你的军火库。';
  d.en['st.c5.g4'] = 'Frequency analysis, the Kasiski test, known-plaintext attacks: three classic tools for your codebreaking arsenal.';

  d.zh['st.c5.lc'] = 'SZXHTZPGPFEWYCSW';
  d.en['st.c5.lc'] = 'SZXHTZPGPFEWYCSW';
  d.zh['st.c5.lh'] = '维吉尼亚密码密信。密钥是一个 9 字母英文词——正是本章舞台「布莱切利园」的名字：Bletchley Park 中的 Bletchley。正文里反复出现的地名，就是钥匙。';
  d.en['st.c5.lh'] = 'A Vigenère letter. The key is a 9-letter English word — the name of this chapter\'s stage: Bletchley, of Bletchley Park. The place name you keep reading in the story is the key.';

  d.zh['st.c5.ch'] = '像图灵一样与时间赛跑：60 秒内破译 3 转子风格的密文，转子设置正随秒针流逝。';
  d.en['st.c5.ch'] = 'Race the clock like Turing: crack the 3-rotor-style ciphertext in 60 seconds, while the settings slip away.';

  /* ============ 人物志 ============ */

  /* ============ 密件 ============ */

})();

(function () {
  var d = Arcade.i18n.dicts;

  /* ================= 第 9 章 · VENONA 与冷战间谍 ================= */
  d.zh['st.c9.b'] = '一次性密码本（one-time pad），是密码史上唯一被数学证明「绝对安全」的加密法。收发双方各持一叠随机密钥页：密钥与明文等长、每一页只加密一封电报、用完即焚。于是密文里的每个字母都可能是任何字母，破译者没有任何立足点。二战后期至冷战之初，苏联情报机构把它当作不可战胜的保险柜：只要密钥页不泄露，再强的监听也只是一堆乱码。理论上，它无懈可击。\n\n1943 年，美国陆军信号情报机构开始截获苏联驻美机构发出的加密电报，代号 VENONA。起初这些电文只是一串串毫无规律的数码组，破译员苦熬数年，一无所获。直到有人撞见一个不该出现的现象：某些电报的密钥片段竟然完全相同。后来的解密史料显示：1942 年莫斯科的密钥车间生产吃紧，华盛顿办事处奉命补印密钥页，那里疲惫的印刷工为了「提高效率」偷偷多印了一本——一次性密码本，被复用了。\n\n复用就是灾难。把两封用了同一段密钥的电文相减，密钥被彻底消去，只剩下两段明文的差；再拿猜出的词语（crib）在差值上试位，密钥与明文便同时浮出水面。1946 年，与 FBI 合作的破译员梅瑞狄斯·加德纳第一次撬开密钥，此后每个代号都被记入档案，与真实身份逐一对应。线索从伦敦一路烧到纽约：克劳斯·富克斯、哈里·戈尔德、大卫·格林格拉斯，一环扣一环，最后指向[[rosenberg]]——朱利叶斯与埃塞尔·罗森伯格夫妇，被控把原子弹机密交给苏联，1953 年在电椅上双双赴死。同一张网牵出的线索，最终让潜伏二十年的剑桥五杰——伯吉斯、麦克莱恩、菲尔比、布伦特、凯恩克罗斯——先后因不同节点陆续暴露。VENONA 解密持续了整整四十年，直到 1980 年才落幕。\n\n最深的教训藏在结尾：绝对安全的密码，败给的不是敌方天才，而是己方一个疲惫的印刷工。再完美的数学，也敌不过人的疲劳、轻慢与侥幸——而破译者等的，就是那唯一一次失手。密码学的战争，从来不只发生在数学里。';
  d.en['st.c9.b'] = 'The one-time pad is the only cipher in history proven mathematically unbreakable. Both sides hold matching stacks of random key pages: the key is as long as the message, each page encrypts exactly one cable and is then burned. Every letter in the ciphertext could be any letter — a codebreaker has no foothold at all. In the early Cold War Soviet intelligence treated it as an invincible vault: as long as the key pages never leaked, even the most powerful eavesdropper saw only gibberish. In theory, it is flawless.\n\nIn 1943 the U.S. Army\'s Signal Intelligence Service began intercepting encrypted Soviet cables under the code name VENONA. At first the traffic was nothing but number groups without rhyme or reason, and the codebreakers laboured for years in the dark. Then someone met a pattern that should not exist: fragments of key shared between different messages. The declassified record shows why: in 1942 Moscow\'s key-printing shop fell behind, so the Washington station was ordered to print extra copies of the key pages — and a tired clerk quietly made a duplicate. The one-time pad had been used twice.\n\nReuse is ruin. Subtract two cables encrypted with the same key and the key vanishes completely — only the difference of the two plaintexts remains; slide guessed words (cribs) across that difference and both the key and the messages surface at once. In 1946 codebreaker Meredith Gardner, working with the FBI, pried the key open for the first time; after that every code name was filed away and matched against a real identity. The trail burned from London to New York: Klaus Fuchs, Harry Gold, David Greenglass, one link to the next, finally pointing at [[rosenberg]] — Julius and Ethel Rosenberg, convicted of handing atomic secrets to Moscow and sent to the electric chair together in 1953. In the same net, the Cambridge Five — Burgess, Maclean, Philby, Blunt, Cairncross and others — were exposed after twenty years inside British diplomacy and intelligence. VENONA decrypts ran for forty years, until 1980.\n\nThe deepest lesson is at the end: the unbreakable cipher fell not to an enemy genius but to a tired clerk on our own side. The most perfect mathematics cannot defeat human fatigue, carelessness and wishful thinking — and the codebreaker is only waiting for that one slip. The war of ciphers was never fought in mathematics alone.';
  d.zh['st.c9.g1'] = '亲手做一遍加德纳的工作：两封被复用的电文相减消去密钥，再用 crib 扫描，一段段撕开冷战间谍网。';
  d.en['st.c9.g1'] = 'Do Gardner\'s job: subtract the two reused-pad cables to cancel the key, then slide cribs to tear the Cold War spy network open.';
  d.zh['st.c9.g2'] = '冷战谍战叙事延伸：化装成密码侦探潜入六章悬案，把 VENONA 的悬念变成可玩的剧本。';
  d.en['st.c9.g2'] = 'The Cold War story continues: play the Cipher Detective through six chapters of spy cases — VENONA\'s suspense, made playable.';
  d.zh['st.c9.lc'] = 'QONGG ZDCHR WJSCF VVAQA HKFA';
  d.en['st.c9.lc'] = 'QONGG ZDCHR WJSCF VVAQA HKFA';
  d.zh['st.c9.lh'] = '已知明文攻击（KPA）：截获电报的固定开头是 crib「EAVESDROPPING」。把密文前 13 个字母与 crib 逐位相减（A=0，mod 26，密文−明文=密钥），你会得到一串每 6 位重复一次的密钥字母——那就是密钥词。把密钥词输入解算器，解出完整明文（答案即全部明文，首字母 E）。';
  d.en['st.c9.lh'] = 'Known-plaintext attack (KPA): intercepted cables always open with the crib "EAVESDROPPING". Subtract the crib from the first 13 ciphertext letters (A=0, mod 26; ciphertext − plaintext = key) and you get a sequence that repeats every 6 letters — that is the key word. Feed it into the solver to reveal the full plaintext (the answer is the whole plaintext, starting with E).';

  /* ================= 第 10 章 · 数学家的反击 ================= */
  d.zh['st.c10.b'] = '1929 年，美国数学教授莱斯特·希尔发表《代数字母表上的密码学》，提出一种全新密码：把明文两两分组当作列向量，用 2×2 矩阵乘上去——史上第一个矩阵分组密码就此诞生。它优雅、整齐，可惜每加密一对字母就要做四次乘法，手算太慢，很快被遗忘。但种子留了下来：把整段信息切成小块、逐块用同一把「钥匙」处理——今天所有分组密码，都是希尔密码的远亲。\n\n1948 年，革命到来。贝尔实验室的[[shannon]]——克劳德·香农——发表《通信的数学理论》，用熵给「信息」下了数学定义；次年他又在《保密系统的通信理论》中第一次严格回答「什么才算安全」：只要密钥真随机、与明文等长且只用一次，密文就与明文毫无关联，「完美保密」真实存在；反过来，一切依赖规律的旧密码，都逃不过频率分析。在香农之前，「密码好不好」靠的是破译员的直觉与实战检验；香农之后，它变成了一道可以证明的数学命题——密码学从此从一门手艺，变成一门数学。\n\n香农还指出了现代密码的原子：异或（XOR）。同一个密钥用两次，明文便原样归来：A⊕K⊕K=A。它对称、廉价、在电路里不过是一排晶体管，还同时兼任加密与解密——同一个闸门按两次就还原。于是它成为 DES、AES 等一切现代分组密码的砖石：替换与移位被拆碎、打乱、反复揉合，直到看不出任何规律。1970 年代，公开密钥密码学登场——加密与解密用不同的钥匙，把「数学难题」当作保险柜；DES（1977）与 AES（2001）让「替换+移位」在比特流里高速运转。今天你的 HTTPS 握手、Wi-Fi 加密、银行转账，内核仍是替换与移位，只是被代数与数论武装得面目全非。\n\n公开密钥的普及，还引燃了一场「密码战争」。1991 年，程序员菲尔·齐默尔曼把自制的加密软件 PGP 免费放上网，让普通人第一次拥有了军事级加密；美国政府却把强加密视作「军火」，以涉嫌非法出口武器为由对他展开调查，一查就是三年。1993 年，白宫又推出「Clipper 芯片」计划：给每个加密设备预埋一把政府可调阅的「后门钥匙」。此举遭到密码学家与民权组织的强烈抵制，反对者在技术层面证明了后门的致命漏洞，计划最终流产。这场拉锯战定下了一条今天仍在延续的规则：强加密，属于每一个普通人。\n\n保密之外，密码学还有另一半使命——「验明正身」。哈希函数把任意长度的输入压成一串定长「指纹」，改动一个比特，指纹就面目全非；文件校验、软件签名、数字证书，都靠它把关。MD5 与 SHA-1 曾是这条防线上的两根台柱。2004 年，山东大学的[[wangxy]]在国际密码学会议上投下一枚重磅炸弹：她的团队找到了 MD5 的「碰撞」——两个内容不同的文件，可以拥有同一枚指纹；次年，SHA-1 的攻击路径也被摆上台面。整个行业用了十几年才消化完这场地震：2017 年，谷歌与荷兰 CWI 研究中心动用约六千五百个 CPU 年的算力，当众演示了 SHA-1 的第一次真实碰撞（SHAttered），各大浏览器随即停用 SHA-1 证书，全球系统陆续迁移到 SHA-256。这一战给教科书添了一条铁律：「尚未被攻破」从来不是安全证明——一种哈希函数的寿命，从设计那天起就在倒数。\n\n而今，天平的两端同时换上了新砝码——人工智能。攻击一侧，AI 辅助的密码分析正在拉低破译的门槛：机器学习能从海量密文里嗅出人类难以察觉的统计偏差，自动化的差分与侧信道分析让过去需要专家苦战数月的攻击，变得可以批量尝试。防御一侧，同一套技术也在加速密钥管理的自动化——自动轮换密钥、检测异常、在攻击发生前收紧防线。AI 没有立场，它只是一把同时递给攻守双方的刀：密码学的下一场竞赛，比的已不只是谁的数学更硬，而是谁能更快地驾驭这台会思考的机器。\n\n最迫在眉睫的，是量子计算机的倒计时。今天的公钥体系建立在「大数分解」与「离散对数」这类难题之上，经典计算机几乎解不动；可一旦足够强的量子计算机问世，Shor 算法将在多项式时间里把这些难题碾碎，RSA 与 ECC 将一夜失效。为此，2024 年美国国家标准与技术研究院（NIST）发布了首批后量子密码标准——ML-KEM、ML-DSA、SLH-DSA 等基于格与哈希的新算法——全球的银行、政府与互联网系统，正开始一场静悄悄的「换锁」迁移。密码学的未来，正在从「量子威胁」的阴影里，抢出一条新的护城河。\n\n从凯撒的移位，到香农的比特流，再到你手中的屏幕，三千年密码史在此收束：每一次「绝对安全」的宣告，都紧跟着下一次破译的号角；每一次破译，又催生出更强的密码。密码学的历史，就是人类保守秘密的斗争史——而这场斗争，从未停止。如今号角再度吹响：量子计算机正逼近今天的公钥体系，新的攻防就藏在你口袋里的那部手机中。';
  d.en['st.c10.b'] = 'In 1929 the American mathematician Lester Hill published "Cryptography in an Algebraic Alphabet" and proposed a wholly new cipher: pair up the plaintext as column vectors and multiply them by a 2×2 matrix — the first matrix block cipher in history. It was elegant and tidy, but every letter pair cost four multiplications, far too slow by hand, so it was soon forgotten. The seed survived, though: cut the message into small blocks and process each with the same "key" — every block cipher today is a distant cousin of the Hill cipher.\n\nThe revolution came in 1948. [[shannon]] — Claude Shannon, of Bell Labs — published "A Mathematical Theory of Communication," giving "information" a mathematical definition through entropy; the next year "Communication Theory of Secrecy Systems" gave the first rigorous answer to what "secure" even means: if the key is truly random, as long as the message and used exactly once, the ciphertext is statistically independent of the plaintext — perfect secrecy is real. Conversely, every old cipher that leans on pattern must fall to frequency analysis. Before Shannon, a cipher\'s worth was judged by intuition and hard-won experience; after him, it became a provable statement of mathematics. Cryptography moved from craft to mathematics.\n\nShannon also named the atom of modern crypto: XOR. Apply the same key twice and the plaintext returns: A⊕K⊕K=A. It is symmetric, cheap, and in a circuit it is just a row of transistors — and it doubles as both encryption and decryption: the same gate pressed twice restores the message. So it became the brick of every modern block cipher, from DES to AES: substitution and transposition are shredded, shuffled and kneaded together until no pattern survives. In the 1970s public-key cryptography arrived — different keys to encrypt and to decrypt, a hard math problem as the vault; DES (1977) and AES (2001) made substitution-plus-transposition run at the speed of bits. The HTTPS handshake, the Wi-Fi encryption, the bank transfer you made today: at their core still substitution and transposition, disguised beyond recognition by algebra and number theory.\n\nThe spread of public-key crypto also lit a "crypto war." In 1991 the programmer Phil Zimmermann posted his homemade encryption software, PGP, onto the Internet for free, giving ordinary people military-grade encryption for the first time; the U.S. government, which treated strong encryption as a munition, opened a three-year investigation into him for exporting arms without a license. In 1993 the White House proposed the Clipper chip: a backdoor key, held by the government, preloaded into every encrypted device. Cryptographers and civil-liberties groups pushed back hard — and proved the backdoor\'s fatal flaws in public — until the plan collapsed. That tug-of-war set a rule that still holds today: strong encryption belongs to everyone.\n\nBeyond secrecy, cryptography has a second job — proving authenticity. A hash function squeezes input of any length into a fixed-length fingerprint: flip one bit and the fingerprint turns unrecognizable. File checksums, software signatures and digital certificates all lean on it. MD5 and SHA-1 were the twin pillars of that line — until 2004, when [[wangxy]] of Shandong University dropped a bombshell at the International Cryptology Conference: her team had found collisions in MD5 — two different files sharing one identical fingerprint; within a year an attack path against SHA-1 was on the table too. The industry spent over a decade absorbing the earthquake: in 2017, Google and CWI Amsterdam burned roughly 6,500 CPU-years of computation to demonstrate the first real SHA-1 collision in public (SHAttered); browsers promptly retired SHA-1 certificates, and systems worldwide migrated to SHA-256. The campaign added an iron maxim to the textbooks: "not yet broken" has never been proof of security — the lifetime of a hash function counts down from the day it is designed.\n\nNow both sides of the scale have been re-weighted by artificial intelligence. On the attack, AI-assisted cryptanalysis is lowering the bar: machine learning can sniff out statistical biases in mountains of ciphertext that a human would never see, and automated differential and side-channel analysis turns attacks that once took experts months into something that can be tried in batches. On the defense, the same machinery is accelerating key management — rotating keys automatically, spotting anomalies, tightening the line before an attack lands. AI has no allegiance; it is a blade handed to both sides at once. The next contest in cryptography is not only about whose math is harder, but about who can steer the thinking machine faster.\n\nClosest on the horizon is the countdown of the quantum computer. Today\'s public-key systems rest on problems like factoring and discrete logarithms, which classical computers can barely touch; but once a sufficiently powerful quantum computer exists, Shor\'s algorithm will grind those problems down in polynomial time, and RSA and ECC will fail overnight. In answer, in 2024 the U.S. National Institute of Standards and Technology (NIST) released its first post-quantum standards — lattice- and hash-based schemes such as ML-KEM, ML-DSA and SLH-DSA — and banks, governments and internet systems around the world have begun the quiet work of changing the locks. The future of cryptography is digging a new moat, out from under the shadow of the quantum threat.\n\nFrom Caesar\'s shift to Shannon\'s bit streams, and on to the screen in your hand, three thousand years of cryptography converge: every proclamation of "absolute security" is followed by the next trumpet call of a break, and every break gives birth to a stronger cipher. The history of ciphers is the history of humanity\'s struggle to keep secrets — and that struggle has never stopped. Now the horn sounds again: quantum computers are closing in on public-key crypto, and the next offensive already runs inside the phone in your pocket.';
  d.zh['st.c10.g1'] = '异或——现代密码的原子。用十六进制密文与密钥异或，再玩一次已知明文攻击，反推密钥。';
  d.en['st.c10.g1'] = 'XOR — the atom of modern crypto. XOR hex ciphertext with the key and run a known-plaintext attack to recover it.';
  d.zh['st.c10.g2'] = '亲手操作史上第一个矩阵分组密码：2×2 密钥矩阵加密解密，用已知明文反向推密钥。';
  d.en['st.c10.g2'] = 'Drive the first matrix block cipher: encrypt and decrypt with a 2×2 key matrix, then recover the key from known plaintext.';
  d.zh['st.c10.g3'] = '比特时代最基础的编码：Base64 把二进制变成可打印文本——现代协议的日常暗号。';
  d.en['st.c10.g3'] = 'The alphabet of the bit age: Base64 turns bytes into printable text — the everyday code of modern protocols.';
  d.zh['st.c10.g4'] = '每 8 位二进制就是一个字符：在 0 与 1 的海洋里，还原整段电文。';
  d.en['st.c10.g4'] = 'Every 8 bits is a character: rebuild a whole message from the sea of 0s and 1s.';
  d.zh['st.c10.g5'] = '现在换你当密码局设计师：研发密码体系、管理密钥节奏，对抗布莱切利园一百周的攻势。';
  d.en['st.c10.g5'] = 'Now YOU are the cipher designer: build systems, manage key rotation, and hold off Bletchley Park for 100 weeks.';
  d.zh['st.c10.lc'] = 'PGZST HOYVC EQXC';
  d.en['st.c10.lc'] = 'PGZST HOYVC EQXC';
  d.zh['st.c10.lh'] = '希尔 2×2 密码：密钥矩阵 K=[[3,2],[2,3]]（行列式 3×3−2×2=5，与 26 互质，故可逆）。把明文去掉空格、两两分组为列向量 (p1,p2)，逐组计算 C=K·P (mod 26)，字母按 A=0。解算器四个输入框请填：3、2、2、3。答案即全部明文，首字母 R。';
  d.en['st.c10.lh'] = 'Hill 2×2 cipher: key matrix K=[[3,2],[2,3]] (determinant 3×3−2×2=5, coprime with 26, hence invertible). Strip spaces, split the plaintext into letter pairs as column vectors (p1,p2), and compute C=K·P (mod 26) pair by pair, with A=0. Fill the four solver fields: 3, 2, 2, 3. The answer is the whole plaintext, starting with R.';
  d.zh['st.c10.facts'] = '你此刻打开的 HTTPS 网页，加密内核仍是「替换+移位」——只是被数学包装成极难逆转的形式。另一条：香农证明完美保密存在，但代价是密钥与明文等长，所以现实世界几乎没人用它——大家都在和「足够难」的数学难题打交道。';
  d.en['st.c10.facts'] = 'The HTTPS page you are reading right now is still built on substitution + transposition — just dressed in math that is brutally hard to reverse. And yes: Shannon proved perfect secrecy exists, but it costs a key as long as the message, which is why almost nobody uses it — everyone settles for math problems that are merely "hard enough".';
  d.zh['st.c10.ch'] = '矩阵一战：用 K=[[3,2],[2,3]] 手算 2×2 希尔密码的一列（一对字母），解出对应明文。';
  d.en['st.c10.ch'] = 'Matrix duel: with K=[[3,2],[2,3]], hand-compute one column (one letter pair) of the 2×2 Hill cipher to recover the plaintext.';

  /* ================= 人物 · 罗森伯格夫妇（第 9 章） ================= */

  /* ================= 人物 · 香农（第 10 章） ================= */

  /* ================= 密件 · VENONA 片段（第 9 章） ================= */

  /* ================= 密件 · 香农论文页（第 10 章） ================= */

  /* ============================================================
     密信数据备忘（供主代理注入 stories.js 的 STORIES 数据段，不入字典）
     c9 venona：letter = { cipher:'vigenere', kpa:true,
       ciphertext:'QONGG ZDCHR WJSCF VVAQA HKFA', key:'MOSCOW',
       answer:'EAVESDROPPING ON THE EMPIRE', keyLetter:'E' }
       —— 验证：密文 24 字母，以 MOSCOW 逐位解密得 EAVESDROPPINGONTHEEMPIRE；
       crib=EAVESDROPPING（开头 13 字母）做 KPA：密文−明文逐位得 MOSCOWMOSCOWM，密钥词 MOSCOW 每 6 位重复。答案首字母 E。
     c10 modern：letter = { cipher:'hill',
       ciphertext:'PGZST HOYVC EQXC', keyMatrix:[[3,2],[2,3]],
       answer:'RING THEORY WINS', keyLetter:'R' }
       —— 验证：det=3×3−2×2=5，gcd(5,26)=1 可逆；K⁻¹=[[11,10],[10,11]]；
       明文两两分组 (R,I)(N,G)(T,H)(E,O)(R,Y)(W,I)(N,S) 逐对 C=K·P(mod 26)
       得 PG ZS TH OY VC EQ XC，反解回 RINGTHEORYWINS。答案首字母 R。
     最终密语：11 章 keyLetter 按章节顺序拼成 CODEBREAKER（C-O-D-E-B-R-E-A-K-E-R），
     与本两章 keyLetter（第 9 章 E、第 10 章 R）逐位对应。
     ============================================================ */
})();

/* ============================================================
   密信答案（合并阶段需写入 STORIES 各章 letter.answer，供
   Arcade.stories.submitLetter 校验；密文与提示即 st.cX.lc / st.cX.lh）：
   - st.c6（midway · playfair · keyLetter=E）
       答案 ENEMY FLEET AT MIDWAY ｜ 密钥 MIDWAY ｜ 密文 FLYWBYRLYXMZIDWAMF
   - st.c7（purple · affine · keyLetter=A）
       答案 ATTACK COMING EASTWARD ｜ a=3, b=7 ｜ 密文 HMMHNLNXRFUZTHJMVHGQ
   - st.c8（lorenz · xor · keyLetter=K）
       答案 KNOWLEDGE FROM NOISE ｜ 密钥 TUNNY ｜ 密文 1F1B0119151111090B7912070103791A1A071D1C
   三封均已用与 stories.js solver 一致的算法双向验证（加密→解密一致、答案唯一）。
   注意：stp.turing.* 由子代理 B 产出，本章正文仅引用 [[turing]] 标记，不重复定义。
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;

  /* ================= 第 6 章 · 中途岛之雾（id: midway） ================= */
  d.zh['st.c6.b'] = '把目光从欧洲转向太平洋——这里的密码战，同样惊心动魄。1942 年春，太平洋上空的电波里飘着一层「雾」——那是日本海军的 JN-25 密码。日军发报员先把每一句话查密码本，换成五位数字的码组，再叠加上一张按日更换的「加表」双重加密，才送上无线电。美军 OP-20-G 的破译员手里只有部分密码本：加表像一层没有钥匙的锁，把整支舰队藏在雾里。\n\n这些破译员的工作场所，远没有名字听起来体面。珍珠港的 HYPO 站藏在一栋建筑的地下室里：闷热、无窗，冷气机早就形同虚设，破译员们穿着汗湿的衬衫，在日光灯的白光下一坐就是一整天。他们 24 小时轮班——JN-25 的加表定期换版、期内反复使用，电文不会等人，于是凌晨三点的截获也得立刻抄录、立刻试减。有人熬红了眼，有人趴在桌上睡十分钟再接着干。正是这群在密室与电波之间透支身体的人，一寸一寸把日本舰队的轮廓从雾里描了出来。\n\n但他们很快发现了一道裂缝：同一版加表期内的电报，共享同一张加表。两封同日的密电相减，加表恰好抵消——破译员们把这叫「深度」。他们用已知的码组一列一列反推加表，再拿加表去解别的电文；雾里渐渐浮出舰队的轮廓：一个代号「AF」的地点反复出现，日军正为进攻它调集兵力。可 AF 到底是哪里？中途岛？阿留申？还是夏威夷？\n\n但比破译更难的是「让别人相信」。罗奇福特坚持 AF 就是中途岛，可华盛顿的 OP-20-G 与海军上层却倾向另一套判断：他们认定日军下一步的主攻在南太平洋——珊瑚海、莫尔兹比港一带。两边各持己见，电文往来争得不可开交；罗奇福特没有实权，无法命令华盛顿，只能靠证据说话。于是他不再空口辩论，转而设计那个著名的「淡水陷阱」，用一封假电报让日本人自己开口。情报战打到这一步，比的已经不是谁截得多，而是谁的判断能压过对方的成见。\n\n[[rochefort]]——约瑟夫·罗奇福特，珍珠港 HYPO 站站长——想出一个近乎狡黠的主意。他让中途岛用低级密码发了一封假电报：岛上淡水蒸馏设备故障，急需淡水。两天后，截获的日军密电里赫然写着：「AF 淡水短缺。」陷阱合拢了——如果 AF 就是中途岛，日军自然会在意中途岛的淡水。AF 之谜就此锁定。\n\n锁定 AF 之后，最惊险的一步交给了尼米兹。他手里只有三艘航母，而日军集结的是一支四艘主力航母的庞大舰队——正面硬拼必败无疑。可尼米兹选择相信情报：他把有限的兵力全部押在中途岛东北的海面上设伏，赌日军会按破译出的时间表准时出现。这是一场在开战前就已定胜负的赌博——战斗还没打响，情报战已经赢了。尼米兹后来把功劳归于那些在地下室里熬红眼的破译员：真正决定海战胜负的，是他们在电波里抢出的那几天先机。\n\n1942 年 6 月 4 日，尼米兹把三艘航母埋伏在中途岛东北。日军四艘主力航母被击沉，美军只损失一艘——太平洋战争的转折点，赢的不是更多战舰，而是一封谎报淡水的电报。破译史上最锋利的刀，有时不是算法，而是一个问题：怎样让敌人亲口说出自己的秘密？';
  d.en['st.c6.b'] = 'Turn from Europe to the Pacific — another cipher war, just as fateful. In the spring of 1942, a "fog" hung over the radio waves of the Pacific — the Imperial Japanese Navy\'s JN-25 cipher. A Japanese operator looked up every phrase in a codebook, turned it into a five-digit code group, then added that day\'s "additive" — a super-encipherment — before putting it on the air. The US Navy cryptanalysts of OP-20-G held only part of the codebook: the additive was a lock without a key, hiding the whole fleet in fog.\n\nThe codebreakers\' workplace was far less grand than the job. Station HYPO at Pearl Harbor sat in a basement: hot, windowless, its air conditioning long since ornamental, with the men working in sweat-soaked shirts under the white glare of fluorescent light. They kept a twenty-four-hour watch — the JN-25 additive changed daily and the traffic would not wait, so a 3 a.m. intercept had to be copied and tested at once. Some worked until their eyes went red; some dozed at their desks for ten minutes and went back in. It was these men, burning themselves out between a sealed room and the radio waves, who slowly drew the Japanese fleet out of the fog, inch by inch.\n\nBut they soon found a crack: every message sent on the same day shared the same additive. Subtract two same-day telegrams and the additive cancels out — the cryptanalysts called this a "depth." Using known code groups they recovered the additive column by column, then used it to read other messages; slowly the fleet surfaced from the fog: a place codenamed "AF" appeared again and again, and the Japanese were massing forces to strike it. But where was AF? Midway? The Aleutians? Hawaii?\n\nBut breaking the cipher was easier than being believed. Rochefort insisted that AF was Midway, while Washington\'s OP-20-G and the Navy\'s high command leaned the other way: they were convinced the next blow would fall in the South Pacific — the Coral Sea, Port Moresby. Both sides argued over the cables; Rochefort held no command authority and could not order Washington to listen, so he had to win with evidence alone. He stopped debating and designed the famous fresh-water trap, making the Japanese speak for themselves. By then the intelligence war was no longer about who intercepted more — it was about whose judgment could outlast the other man\'s preconceptions.\n\n[[rochefort]] — Joseph Rochefort, chief of Station HYPO at Pearl Harbor — devised a sly trick. He had Midway send a fake telegram in a low-grade cipher: the island\'s fresh-water distillation plant had failed, fresh water urgently needed. Two days later an intercepted Japanese message read: "AF is short of fresh water." The trap snapped shut — had AF been Midway, the Japanese would naturally care about Midway\'s water. The riddle of AF was settled.\n\nWith AF pinned down, the most dangerous step fell to Nimitz. He had only three carriers in hand, while the Japanese were massing a far larger force built around four fleet carriers — a straight fight would be suicide. Nimitz chose to trust the intelligence: he committed everything to an ambush northeast of Midway, betting the Japanese would appear exactly on the schedule the decrypts predicted. It was a gamble already decided before the first shot: the battle had not begun, and the intelligence war was already won. Nimitz later gave the credit to the red-eyed codebreakers in the basement — the days of warning they had wrested from the radio waves, he said, were what truly decided the fight at sea.\n\nOn June 4, 1942, Nimitz ambushed the Japanese carriers northeast of Midway. Four of Japan\'s main carriers were sunk at the cost of one American — the turning point of the Pacific war won not by more battleships but by a telegram that lied about fresh water. In the history of codebreaking, the sharpest blade is sometimes not an algorithm but a question: how do you make the enemy confess his own secret?';

  d.zh['st.c6.g1'] = '亲手体验 OP-20-G 的日常：截获日军舰队电文，靠「深度」逐列回收每日加表，把中途岛的战局从雾里捞出来。';
  d.en['st.c6.g1'] = 'Live OP-20-G\'s daily grind: intercept Japanese fleet traffic, recover the daily additive column by column from the "depth", and pull the battle of Midway out of the fog.';
  d.zh['st.c6.g2'] = '再看美军自己的转轮机 M-209：同一时代的美国人也在用轮子守护电波——防守者的角度，和进攻者一样烧脑。';
  d.en['st.c6.g2'] = 'Meet the US Army\'s own cipher wheel, the M-209: Americans of the same era also guarded their airwaves with rotors — the defender\'s puzzle is every bit as fierce as the attacker\'s.';

  d.zh['st.c6.lc'] = 'FLYWBYRLYXMZIDWAMF';
  d.en['st.c6.lc'] = 'FLYWBYRLYXMZIDWAMF';
  d.zh['st.c6.lh'] = '🔑 密钥词＝中途岛的英文名（MIDWAY，6 个字母）。Playfair：把密钥填入 5×5 方格（I/J 合并），密文两两一组沿方格解密。明文以 E 开头。';
  d.en['st.c6.lh'] = '🔑 Key word = the English name of Midway (MIDWAY, 6 letters). Playfair: fill the 5×5 square with the key (I/J merged), then decrypt the digraphs. The plaintext begins with E.';

  d.zh['st.c6.ch'] = '两封截获电文摆在桌上：一封是中途岛发的「蒸馏水故障」假电报，一封是日军确认电。找出提到「AF 淡水短缺」的那封。';
  d.en['st.c6.ch'] = 'Two intercepted telegrams on the desk: one is Midway\'s fake "distilling failure" report, one is the Japanese confirmation. Pick the one that mentions "AF shortage of fresh water".';

  /* ================= 第 7 章 · 紫密与珍珠港（id: purple） ================= */
  d.zh['st.c7.b'] = '时间拨回 1941 年 12 月——先听珍珠港的惨痛教训，再看中途岛的惊天逆转。日本的最高外交密码是一台打字机模样的机器，美军叫它「紫密」（Purple）。它不用转子，而是装了六个 25 档步进开关，把 26 个字母拆成两条路：六个元音走「六段路」，二十个辅音走「二十段路」，各自置换后再合流。两条路径的步进规律完全不同——这是它最阴险的地方：按转子的思路去解，永远撞墙。\n\n可[[friedman]]的团队连机器的影子都没见过。陆军信号情报处 SIS 的破译员从成堆密电里做统计：元音组只有六个字母，出现的频率高得扎眼。他们顺着「六元音组」的踪迹反推出两条路径的长度，再一点一点拼出 25 档步进开关的轮换规律。1940 年秋，一台「假想机」——按推理结构用继电器搭成的仿制机——让紫密在纸上开了门。弗里德曼早年为陆军建立的密码学体系让这支队伍能打硬仗；他自己却因长期过劳病倒，在破译完成前后住进了医院。\n\n情报本可以改写历史。1941 年 12 月初，SIS 破译了日本外务省发往华盛顿使馆的「十四段电报」——开战信号已近在眼前。按预定计划，一旦日美开战，日本广播将播出暗号「东风，雨」（Higashi no kaze ame）；而那十四段电报宣告谈判破裂，「东风，雨」的开战暗号预案却始终未被完整截获。可惜破译的电报在官僚链条里走得太久：华盛顿坚持认为日军不敢先打珍珠港。12 月 7 日清晨炸弹落下时，破译室的桌上还堆着未及处理的电文。\n\n珍珠港的教训不是情报不够，而是情报没人信。破译密码只是第一步——把破译结果送进决策者的脑子，是另一场更难的战争。此后美军建立了统一的情报评估机构，同样的错误在太平洋再未重演；被误判的紫密电文，成了情报史上最昂贵的一课。';
  d.en['st.c7.b'] = 'Rewind to December 1941 — first the painful lesson of Pearl Harbor, then the stunning reversal at Midway. Japan\'s top diplomatic cipher was a machine that looked like a typewriter; the Americans called it "Purple." It used no rotors — instead six 25-position stepping switches split the alphabet into two paths: six vowels through a "six-level path," the other twenty consonants through a "twenty-level path," each permuted separately before recombining. The two paths stepped in completely different rhythms — that was its most treacherous feature: attack it as a rotor machine and you hit a wall forever.\n\nBut [[friedman]]\'s team never laid eyes on the machine. The cryptanalysts of the Army\'s Signal Intelligence Service (SIS) ran statistics over mountains of intercepts: a group of only six vowels, its frequencies screamed off the page. Following the trail of the "six-vowel group," they deduced the length of both paths, then pieced together the stepping rhythms of the 25-position switches. In the autumn of 1940 a "hypothetical machine" — an analog wired from relays according to the deduced structure — opened Purple\'s doors on paper. The cryptologic system Friedman had built for the Army years earlier let the team fight hard; Friedman himself, worn down by overwork, collapsed into hospital just as the break was completed.\n\nThe intelligence could have rewritten history. In early December 1941 the SIS solved the Foreign Ministry\'s "fourteen-part message" to its Washington embassy — the signal of war was already in sight. By pre-arrangement, if Japan went to war with the US its broadcasts would announce the code phrase "East wind, rain" (Higashi no kaze ame); the fourteen-part message declared the negotiations broken, but the "East wind, rain" signal itself was never fully intercepted. But the decrypted telegrams crawled through the chain of command: Washington insisted the Japanese would never dare strike Pearl Harbor first. On the morning of December 7, as bombs fell on Pearl Harbor, undigested messages still sat on the codebreakers\' desks.\n\nPearl Harbor\'s lesson was not that intelligence was lacking — it was that intelligence was not believed. Breaking a cipher is only the first step; carrying the answer into a decision-maker\'s mind is the harder war. Afterward the US built unified intelligence assessment bodies, and the Pacific never saw the same mistake again; the misjudged Purple messages became the most expensive lesson in the history of intelligence.';

  d.zh['st.c7.g1'] = '在假想机上转动 25 档步进开关：没有真机，只有统计与推理——像 1940 年的 SIS 一样，从结构反推紫密。';
  d.en['st.c7.g1'] = 'Turn the 25-position switches on a hypothetical machine: no real Purple, only statistics and deduction — reverse the machine from its structure, just as the SIS did in 1940.';

  d.zh['st.c7.lc'] = 'HMMHNLNXRFUZTHJMVHGQ';
  d.en['st.c7.lc'] = 'HMMHNLNXRFUZTHJMVHGQ';
  d.zh['st.c7.lh'] = '🔑 仿射：密文 = (a×明文 + b) mod 26。本信 a=3、b=7（a 与 26 互质，解密先求 a 的逆元）。明文以 A 开头。';
  d.en['st.c7.lh'] = '🔑 Affine: ciphertext = (a×plaintext + b) mod 26. Here a=3, b=7 (a is coprime with 26 — find its modular inverse to decrypt). The plaintext begins with A.';

  /* ================= 第 8 章 · 洛伦兹与第一台计算机（id: lorenz） ================= */
  d.zh['st.c8.b'] = '柏林与前线司令部之间的电传线路，藏着德军最高级的机密。电传机把每个字母编成五个比特的脉冲——五单位电传码——洛伦兹 SZ40 机再往这串脉冲上叠一层密钥：密文 = 明文 ⊕ 密钥，逐位异或。英军给它起了个鱼名：Tunny（金枪鱼）。机内十二个轮子昼夜旋转：五个 χ 轮、五个 ψ 轮，外加两个 μ 轮控制 ψ 轮的步进节奏，各轮针数互不相同，密钥流长得没有尽头。\n\n比尔·塔特（Bill Tutte）为 Tunny 确立的是统计学的一刀：与其硬解十二个轮子的初始位置，不如先把相邻比特相减——差分；[[turing]]则改进出 Turingery 求密钥法。这一刀把 ψ 轮的贡献「稀释」掉大半：ψ 轮多数时候原地踏步，差分之后几乎消失，剩下的是 χ 轮那串较短、可猜的循环。破译员不必知道全部真相，只需在噪声里找到那一丝偏斜——这正是后来一切密码统计分析的雏形。\n\n但差分计算快得惊人：一秒要处理五千个字符，继电器根本跟不上。工程师[[flowers]]——汤米·弗劳尔斯——坚持用电子管：他从电话交换机的经验里知道，电子管可以做得足够可靠。1943 年底他造出 Colossus：一千五百多只电子管、穿孔纸带输入、程序可改——世界第一台可编程电子计算机。图灵给出数学的刀，弗劳尔斯磨出电子的刃：Colossus 每秒处理五千字符，把差分统计从「理论上可行」变成「实战中用得上」。诺曼底登陆前，英军已经读到德军最高层的命令。\n\n战后，Colossus 被拆解，图纸被销毁，秘密守了三十年，直到 1970 年代才解密。它没机会像 ENIAC 那样登上教科书，但计算机的谱系从这里分岔：电子、可编程、每秒五千字符——这些词第一次同时出现在一台机器上。密码破译，就这样亲手生出了计算机。';
  d.en['st.c8.b'] = 'The teleprinter lines between Berlin and the field headquarters carried Germany\'s highest secrets. A teleprinter encodes every letter as five pulses — the five-bit Baudot code — and the Lorenz SZ40 then laid a key stream over those pulses: ciphertext = plaintext ⊕ key, bit by bit — what we now call XOR. The British gave it a fishy codename: Tunny. Inside, twelve wheels turned day and night: five χ wheels, five ψ wheels, plus two μ wheels governing the stepping rhythm of the ψ wheels; each wheel had a different number of pins, and the key stream stretched on without end.\n\nBill Tutte\'s stroke for Tunny was a cut from statistics: instead of solving the starting positions of all twelve wheels, first subtract adjacent bits — the delta; [[turing]] later refined the Turingery method for recovering the wheel settings. That cut "dilutes" the ψ contribution: most of the time the ψ wheels did not step, so after differencing they nearly vanished, leaving the shorter, guessable cycle of the χ wheels. The codebreakers did not need the whole truth — only a faint statistical bias in the noise. It was the seed of every statistical cryptanalysis to come.\n\nBut the delta computation was ferociously fast: five thousand characters a second, far beyond relays. The engineer [[flowers]] — Tommy Flowers — insisted on thermionic valves: he knew from telephone exchanges that valves could be made reliable enough. By the end of 1943 he had built Colossus: more than 1,500 valves, punched-tape input, reprogrammable — the world\'s first programmable electronic computer. Turing supplied the mathematical blade; Flowers honed the electronic edge. Colossus processed 5,000 characters per second and turned delta statistics from "theoretically possible" into "operationally real." Before the Normandy landings, the British were already reading the Wehrmacht\'s highest-level orders.\n\nAfter the war Colossus was dismantled, its drawings destroyed, the secret kept for thirty years — declassified only in the 1970s. It never made the textbooks the way ENIAC did, but the lineage of the computer forks here: electronic, programmable, five thousand characters a second — for the first time those words described one machine. Codebreaking had given birth to the computer.';

  d.zh['st.c8.g1'] = 'Tunny 的十二个轮子在你手里：从已知明文到纯统计，三关走完 Colossus 式破译的完整思路。';
  d.en['st.c8.g1'] = 'Twelve Tunny wheels in your hands: from known plaintext to pure statistics, three levels walk the entire Colossus-style break.';
  d.zh['st.c8.g2'] = '破译×冒险的现代演绎：每一层地牢的守卫都是一道密码题，破译即攻击——图灵们的战场，如今是像素与 Roguelike。';
  d.en['st.c8.g2'] = 'A modern remix of decoding × adventure: every dungeon guard is a cipher puzzle and decoding is your attack — Turing\'s battlefield, reborn in pixels and roguelike.';

  d.zh['st.c8.lc'] = '1F1B0119151111090B7912070103791A1A071D1C';
  d.en['st.c8.lc'] = '1F1B0119151111090B7912070103791A1A071D1C';
  d.zh['st.c8.lh'] = '🔑 异或：密文 = 明文 ⊕ 密钥，逐字节（ASCII）。密钥词＝德军 SZ40 的英国代号（TUNNY，5 个字母，正文提到它）。明文以 K 开头。';
  d.en['st.c8.lh'] = '🔑 XOR: ciphertext = plaintext ⊕ key, byte by byte (ASCII). Key word = the British codename for the SZ40 (TUNNY, 5 letters — mentioned in the chapter). The plaintext begins with K.';

  d.zh['st.c8.ch'] = '两段 5-bit 电传流，一段来自柏林，一段来自前线。找出两段流开头的相同 5-bit 段——差分统计找的就是「相同」。';
  d.en['st.c8.ch'] = 'Two 5-bit teleprinter streams — one from Berlin, one from the front. Find the identical 5-bit segment at the start of both: delta analysis hunts for sameness.';

  /* ================= 人物（rochefort 需含 name/icon；friedman/flowers 的 name/icon 已存在） ================= */

  /* ================= 密件（name/era 已存在，补 desc/text） ================= */

})();

/* ===== 编年史补全：新增游戏关联文案（35 款破译游戏全覆盖） ===== */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.c1.g3'] = '仿射密码：凯撒移位只是一半——乘一个数、再加一个数，双重变换让穷举翻倍。';
  d.en['st.c1.g3'] = 'Affine cipher: the Caesar shift is only half the story — multiply, then add; the search space doubles.';
  d.zh['st.c2.g4'] = '大师密码：每一次反馈都在缩小可能性——频率之外，试错也是科学。';
  d.en['st.c2.g4'] = 'Code Breaker: every reply narrows the space — beyond frequency, trial and error is a science too.';
  d.zh['st.c2.g5'] = 'Bifid：把字母换成 5×5 方格坐标再重组——肯迪时代之后的替换艺术。';
  d.en['st.c2.g5'] = 'Bifid: letters become 5×5 grid coordinates, then get shuffled — substitution art after Al-Kindi.';
  d.zh['st.c2.g6'] = 'Trifid：3×3×3 立体分块——替换与换位的三维合流。';
  d.en['st.c2.g6'] = 'Trifid: a 3×3×3 cubic block cipher — substitution and transposition in three dimensions.';
  d.zh['st.c4.g9'] = '找茬破译：电报被篡改——消息认证的演练，一战谍报的现代回响。';
  d.en['st.c4.g9'] = 'Spot the Tamper: a telegram altered in transit — message authentication, echoing WWI espionage.';
  d.zh['st.c4.g10'] = '打字破译：从电报纸带的节奏里读出信息——摩斯之外，打字也是密码。';
  d.en['st.c4.g10'] = 'Type Code: read meaning from typing rhythm — beyond Morse, typing is a cipher too.';
  d.zh['st.c5.g5'] = '破译战役：九关谍报闯关，把布莱切利园的故事亲历一遍。';
  d.en['st.c5.g5'] = 'Campaign: nine missions of spy traffic — relive the Bletchley Park story.';
  d.zh['st.c7.g2'] = '大师密码：破解步进开关的设定，和弗里德曼团队一样靠试错收敛。';
  d.en['st.c7.g2'] = 'Code Breaker: hunt the switch settings the way Friedman\'s team converged by trial.';
  d.zh['st.c7.g3'] = '摩斯破译：东风雨广播靠电波传令——莫尔斯是密码战的神经系统。';
  d.en['st.c7.g3'] = 'Morse: the East Wind broadcast rode the airwaves — Morse was the nervous system of the cipher war.';
  d.zh['st.c10.g6'] = '猜词破译：每一次猜测都带来信息增益——香农的信息论，玩着就懂了。';
  d.en['st.c10.g6'] = 'Code Guess: every guess gains information — Shannon\'s theory, learned by playing.';
  d.zh['st.c0.g3'] = '二进制破译：象形文字是符号系统，二进制也是——都是「把意义编码成记号」。';
  d.en['st.c0.g3'] = 'Binary: hieroglyphs are a symbol system, and so is binary — both encode meaning into marks.';
  d.zh['st.c3.g3'] = '摩斯破译：长短音是另一种「双字体」——两种符号承载整个字母表。';
  d.en['st.c3.g3'] = 'Morse: dots and dashes are another "two-font" — two symbols carrying the whole alphabet.';
  d.zh['st.c6.g3'] = '摩斯破译：中途岛的电文靠无线电传递——莫尔斯是太平洋战场的神经。';
  d.en['st.c6.g3'] = 'Morse: Midway\'s cables rode the airwaves — Morse was the Pacific war\'s nervous system.';
  d.zh['st.c8.g3'] = '二进制破译：5-bit 电传流就是二进制——洛伦兹的轮齿在 0 与 1 里翻滚。';
  d.en['st.c8.g3'] = 'Binary: the 5-bit teleprinter stream is binary — Lorenz\'s wheels tumble in 0s and 1s.';
  d.zh['st.c9.g3'] = '词频分析：VENONA 破译员也数字母——密码本代号在频率统计下露出马脚。';
  d.en['st.c9.g3'] = 'Frequency: VENONA codebreakers counted letters too — code-name patterns give themselves away.';
})();


/* ============================================================
   紫密挑战文案（P1.5 补全 c7）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.c7.ch'] = '认一认紫密的双路设计：六个元音走一条路、二十个辅音走另一条路。两条路加起来，共覆盖多少个字母？';
  d.en['st.c7.ch'] = 'Purple\'s twin paths: six vowels on one route, twenty consonants on another. How many letters do the two paths cover in total?';
})();

/* ============================================================
   新增原理演示文案（D4：affine/playfair/xor/rail）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.demoAffineNote'] = '仿射密码：先乘 a 再加 b（E=ax+b mod 26）——凯撒只是 a=1 的特例。拖动滑块看密文变化。';
  d.en['st.demoAffineNote'] = 'Affine: multiply by a then add b (E=ax+b mod 26) — Caesar is just the a=1 case. Drag to watch the ciphertext change.';
  d.zh['st.demoPlayfairNote'] = 'Playfair：5×5 方阵（I/J 合并），密钥填入开头，字母成对加密——英军一战的野战密码。';
  d.en['st.demoPlayfairNote'] = 'Playfair: a 5×5 square (I/J merged), key first, letters enciphered in pairs — the British field cipher of WWI.';
  d.zh['st.demoXorNote'] = '异或：逐字节按位运算，相同得 0、不同得 1。密钥 KEY 与明文逐字节异或得到十六进制密文。';
  d.en['st.demoXorNote'] = 'XOR: bitwise per byte — same gives 0, different gives 1. Plaintext XOR key gives the hex ciphertext.';
  d.zh['st.demoRailNote'] = '栅栏密码：明文按锯齿形写进多行，再逐行读出——最朴素的换位密码。拖动轨道数看排布。';
  d.en['st.demoRailNote'] = 'Rail Fence: write plaintext in a zigzag across rows, then read off row by row — the plainest transposition. Drag to change the rail count.';
})();

/* ============================================================
   原理演示文案（P3 教育深化）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.demoTitle'] = '原理演示'; d.en['st.demoTitle'] = 'How It Works';
  d.zh['st.demoVigNote'] = '维吉尼亚表：每一行是凯撒表的一个偏移——密钥逐字母选择用哪一行，频率被抹平。';
  d.en['st.demoVigNote'] = 'The Vigenère table: each row is a Caesar shift — the key picks a row per letter, flattening the frequencies.';
  d.zh['st.demoEnigmaNote'] = '三只转子逐键转动，最右每按必转、其余进位——同样的字母每次加密都不同。';
  d.en['st.demoEnigmaNote'] = 'Three rotors step per keystroke (right rotor always, others on carry) — the same letter encrypts differently every time.';
})();

/* ============================================================
   进阶书单文案（P3 教育深化）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.readsTitle'] = '进阶书单'; d.en['st.readsTitle'] = 'Further Reading';
})();

/* ============================================================
   史料来源文案（P1 内容深度）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  
  d.zh['st.extendTitle'] = '本章延伸'; d.en['st.extendTitle'] = 'Go deeper';
  d.zh['st.extendGlossary'] = '在词典中查看全部相关术语'; d.en['st.extendGlossary'] = 'View all related terms in the glossary';d.zh['st.sourcesTitle'] = '史料来源'; d.en['st.sourcesTitle'] = 'Sources & Further Reading';
  d.zh['st.sourcesNote'] = '本章叙述为史料化演绎：基于公开文献整理，人物言行与引语依史料转写或重构，仅供学习，不构成学术论断。';
  d.en['st.sourcesNote'] = 'This chapter is a dramatised retelling: compiled from public sources, with speeches and quotes transcribed or reconstructed. For study only; not an academic claim.';
})();

/* ============================================================
   历史重现挑战文案（P0-2 补全：c1/c2/c3/c4/c9）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.c1.ch'] = '手算凯撒：把密文 RUGHU WKH OHJLRQV 的每个字母前移 3 位还原军令——回答明文开头第一个词（5 个字母）。';
  d.en['st.c1.ch'] = 'Caesar by hand: shift RUGHU WKH OHJLRQV back three places to recover the order — answer the first word of the plaintext (5 letters).';
  d.zh['st.c2.ch'] = '频率侦探：密文 RTEGRT ZIT QKQW DTLLQUT 里哪个字母出现次数最多？它通常对应英文最高频的 E。';
  d.en['st.c2.ch'] = 'Frequency detective: which letter appears most often in RTEGRT ZIT QKQW DTLLQUT? It usually stands for the most common English letter, E.';
  d.zh['st.c3.ch'] = '培根解码：A=0、B=1，每 5 位一组对应一个字母（A-Z 编为 0-25）。解码 AABAA。';
  d.en['st.c3.ch'] = 'Bacon decode: A=0, B=1, five symbols per letter (A-Z are 0-25). Decode AABAA.';
  d.zh['st.c4.ch'] = '认一认德国佬一战末期的新家伙：用 6×6 波利比奥斯方阵替换、再按密钥做列换位的双重密码，名字只有六个字母。';
  d.en['st.c4.ch'] = 'Name Germany\'s late-WWI newcomer: a 6×6 Polybius substitution plus keyed columnar transposition — its name is just six letters.';
  d.zh['st.c9.ch'] = '认错题：VENONA 破译员之所以能读苏联密电，是因为密码本被重复使用——这个致命失误叫什么（英文，一个词）？';
  d.en['st.c9.ch'] = 'Name the flaw: VENONA was readable because the pads were reused — what is this fatal mistake called (one word)?';
})();

/* ============================================================
   新入章游戏关联文案（S3 内容扩充：65 款孤儿游戏进章节）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.c0.g4'] = '贪吃蛇：1976 年街机原型 Blockade，后随诺基亚手机风靡全球。';
  d.en['st.c0.g4'] = 'Snake: born as the 1976 arcade Blockade, later a Nokia phone legend.';
  d.zh['st.c0.g5'] = '记忆翻牌：19 世纪英国的配对纸牌游戏，考验短时记忆。';
  d.en['st.c0.g5'] = 'Memory: the 19th-century British card-matching game of recall.';
  d.zh['st.c0.g6'] = '连连看：1980 年代麻将接龙演化出的配对消除，风靡东亚。';
  d.en['st.c0.g6'] = 'Link Link: pair-matching descended from 1980s mahjong solitaire, an East Asian favorite.';
  d.zh['st.c0.g7'] = '数字填色：1950 年代美国兴起的填色风潮，人人可当画家。';
  d.en['st.c0.g7'] = 'Paint by Number: the 1950s American craze that let anyone paint.';
  d.zh['st.c0.g8'] = '迷宫吃豆：1980 年吃豆人登场，把迷宫变成街机符号。';
  d.en['st.c0.g8'] = 'Maze Pac: the 1980 arcade icon that made the maze itself famous.';
  d.zh['st.c0.g9'] = '消消乐：2001 年《宝石迷阵》开创的三消流派，休闲游戏之王。';
  d.en['st.c0.g9'] = 'Match-3: the genre Bejeweled launched in 2001 — king of casual play.';
  d.zh['st.c0.g10'] = '2048：2014 年一个周末写成的网页游戏，随即席卷全球。';
  d.en['st.c0.g10'] = '2048: a weekend web game of 2014 that took the world in days.';
  d.zh['st.c1.g4'] = '阿特巴什：字母表首尾对折、整体镜像——比凯撒更古老的替换密码，希伯来文早已在用。';
  d.en['st.c1.g4'] = 'Atbash: fold the alphabet end-to-end and mirror it — a substitution older than Caesar, already used in Hebrew.';
  d.zh['st.c1.g5'] = '弹射打靶：拖拽蓄力、计算弹道——凯撒的攻城器械同样靠精确计算破城。';
  d.en['st.c1.g5'] = 'Catapult: draw back, aim, release — Caesar\'s siege engines broke walls with the same precision.';
  d.zh['st.c1.g6'] = '攻城棋：围城是古代战争的终极形态，从特洛伊到中世纪皆然。';
  d.en['st.c1.g6'] = 'Siege: storming walls was ancient warfare\'s endgame, from Troy to the Middle Ages.';
  d.zh['st.c1.g7'] = '桥梁搭建：搭桥让小球滚到对岸——凯撒一夜架桥渡莱茵河，靠的就是工程与胆识。';
  d.en['st.c1.g7'] = 'Bridge Builder: span the gap and let the ball cross — Caesar bridged the Rhine in days, by engineering and nerve.';
  d.zh['st.c1.g8'] = '推箱子：1981 年日本程序员今林宏行设计，仓库里的经典谜题。';
  d.en['st.c1.g8'] = 'Sokoban: the 1981 Japanese warehouse puzzle by Hiroyuki Imabayashi.';
  d.zh['st.c1.g9'] = '汉诺塔：1883 年法国数学家卢卡斯提出，递归思维第一课。';
  d.en['st.c1.g9'] = 'Tower of Hanoi: posed in 1883 by Édouard Lucas — recursion\'s first lesson.';
  d.zh['st.c2.g7'] = '国际象棋：从波斯传入阿拉伯智慧宫，巴格达让它风靡世界。';
  d.en['st.c2.g7'] = 'Chess: the Persian game refined in Baghdad\'s House of Wisdom, then spread worldwide.';
  d.zh['st.c2.g8'] = '跳棋：从古棋戏 Alquerque 演化而来，中世纪流行欧洲。';
  d.en['st.c2.g8'] = 'Checkers: descended from the ancient Alquerque, spread across medieval Europe.';
  d.zh['st.c2.g9'] = '数独：1979 年美国人加恩斯发明，1980 年代在日本命名走红。';
  d.en['st.c2.g9'] = 'Sudoku: invented in 1979 by American Howard Garns, named and popularized in Japan.';
  d.zh['st.c2.g10'] = '数织：1987 年日本两位设计师首创，按行列线索复原图案。';
  d.en['st.c2.g10'] = 'Nonogram: created in Japan in 1987, rebuilding a picture from row and column clues.';
  d.zh['st.c2.g11'] = '24 点：加减乘除凑 24——阿拉伯算术的速算挑战，智慧宫里每天都上演。';
  d.en['st.c2.g11'] = '24 Game: reach 24 with four numbers — arithmetic games like this filled the House of Wisdom.';
  d.zh['st.c2.g12'] = '方形分割：按数字切成矩形——几何与数字的严谨结合，正是巴格达学者的日常。';
  d.en['st.c2.g12'] = 'Shikaku: cut the grid into numbered rectangles — geometry and numbers, the daily craft of Baghdad\'s scholars.';
  d.zh['st.c2.g13'] = '拼图填数：1990 年代日本的纯逻辑谜题，同数连通面积恰等。';
  d.en['st.c2.g13'] = 'Fillomino: a 1990s Japanese logic puzzle of equal-area connected regions.';
  d.zh['st.c2.g14'] = '数回：1989 年日本的环路逻辑谜题，一格一圈只此一解。';
  d.en['st.c2.g14'] = 'Slitherlink: a 1989 Japanese loop puzzle with a single solution.';
  d.zh['st.c3.g4'] = '星条旗密码：★ 与 ─ 两种符号、五位一组拼出字母——培根的 5 位二进制换上了星条外衣。';
  d.en['st.c3.g4'] = 'Star Cipher: two symbols, ★ and dash, five to a letter — Bacon\'s 5-bit binary dressed in stars and stripes.';
  d.zh['st.c3.g5'] = '单词搜索：1968 年美国报纸首刊的寻词游戏，风靡报章副刊。';
  d.en['st.c3.g5'] = 'Word Search: debuted in a 1968 American newspaper, a puzzle-page staple.';
  d.zh['st.c3.g6'] = '井字棋：最古老的纸上棋之一，古罗马人已在地面刻划圈叉。';
  d.en['st.c3.g6'] = 'Tic-tac-toe: among the oldest paper games — Romans scratched O and X on stone.';
  d.zh['st.c3.g7'] = '西瓜合成：2021 年日本网页小游戏带火的合成玩法，一夜爆红。';
  d.en['st.c3.g7'] = 'Watermelon Merge: the 2021 Japanese web game that sparked a merge craze.';
  /* 第四期 C3：autokey 挂靠文艺复兴章（末位追加） */
  d.zh['st.c3.g8'] = '自动密钥：维吉尼亚本人约 1586 年的进阶构想——让明文参与造钥，解开一段，钥匙自己生长。';
  d.en['st.c3.g8'] = 'Autokey: Vigenère\'s own upgrade from around 1586 — let the plaintext build the key, and the key grows as you solve.';
  d.zh['st.c4.g11'] = '铁壁防线：坦克 1916 年索姆河首度登场，改写堑壕战。';
  d.en['st.c4.g11'] = 'Tank Defense: armor first rumbled out at the Somme in 1916, remaking trench warfare.';
  d.zh['st.c4.g12'] = '扫雷：1990 年代随 Windows 装机，成为办公室摸鱼经典。';
  d.en['st.c4.g12'] = 'Minesweeper: bundled with Windows in the 1990s — the office procrastination classic.';
  d.zh['st.c4.g13'] = '弹幕射击：1990 年代街机弹幕游戏的华丽继承者。';
  d.en['st.c4.g13'] = 'Bullet Hell: the dazzling arcade shooter subgenre that bloomed in the 1990s.';
  d.zh['st.c4.g14'] = '轨道射击：1980 年代街机厅的体感射击，沿轨道自动前进。';
  d.en['st.c4.g14'] = 'Rail Shooter: the 1980s arcade shooter that moved you along a fixed track.';
  d.zh['st.c4.g15'] = '节奏游戏：1996 年《啪啦啪啦啪》开启的音乐按键流派。';
  d.en['st.c4.g15'] = 'Rhythm: Parappa the Rapper opened the music-timing genre in 1996.';
  d.zh['st.c4.g16'] = '反应测试：街机厅与实验室都爱的经典，测你的毫秒手速。';
  d.en['st.c4.g16'] = 'Reaction: a staple of both arcades and labs, timing your split-second reflexes.';
  d.zh['st.c4.g17'] = '太空射击：1978 年《太空侵略者》掀起的街机射击狂潮。';
  d.en['st.c4.g17'] = 'Space Shooter: the 1978 Space Invaders wave that conquered arcades.';
  d.zh['st.c5.g6'] = '卡牌构筑：2008 年《领土》开创的流派，边打牌边组牌库。';
  d.en['st.c5.g6'] = 'Deckbuilder: the genre Dominion launched in 2008 — build your deck as you play.';
  d.zh['st.c5.g7'] = '战棋：从桌面推演到电子棋盘的古老兵棋传统。';
  d.en['st.c5.g7'] = 'Tactics: from tabletop wargames to digital grids, a long wargaming line.';
  d.zh['st.c5.g8'] = '塔防：2000 年代从魔兽争霸地图里长出的热门玩法。';
  d.en['st.c5.g8'] = 'Tower Defense: born from Warcraft III custom maps in the 2000s.';
  d.zh['st.c5.g9'] = '扑克：19 世纪美国河船上定型的五张牌心理博弈。';
  d.en['st.c5.g9'] = 'Poker: five-card bluffing shaped on 19th-century American riverboats.';
  d.zh['st.c5.g10'] = '21 点：源自法国的 vingt-et-un，算牌高手的最爱。';
  d.en['st.c5.g10'] = 'Blackjack: descended from French vingt-et-un, beloved of card counters.';
  d.zh['st.c5.g11'] = '接龙：随 Windows 1990 年首发，教会一代人拖拽鼠标。';
  d.en['st.c5.g11'] = 'Klondike: shipped with Windows in 1990, teaching a generation to drag and drop.';
  d.zh['st.c6.g4'] = '拉线占领：拖线派兵、吞并中立——太平洋岛屿争夺战，就是一张会动的棋盘。';
  d.en['st.c6.g4'] = 'Sectorsiege: drag lines, seize territory — the island-hopping campaign was a living board game.';
  d.zh['st.c6.g5'] = '青蛙过河：穿越车流与河流——两栖登陆的缩影：时机、路线、一点点运气。';
  d.en['st.c6.g5'] = 'Frog Crossing: dodge the traffic, cross the river — amphibious landings in miniature: timing, route, and luck.';
  d.zh['st.c6.g6'] = '保龄球：十瓶制 19 世纪美国定型，最古老的室内运动之一。';
  d.en['st.c6.g6'] = 'Bowling: ten-pin form settled in 19th-century America — among the oldest indoor sports.';
  d.zh['st.c6.g7'] = '台球：16 世纪起欧洲宫廷就爱上的击球游戏。';
  d.en['st.c6.g7'] = 'Billiards: cue sports loved by European courts since the 1500s.';
  d.zh['st.c6.g8'] = '乒乓球：1972 年 Pong 把球拍对战搬进街机厅。';
  d.en['st.c6.g8'] = 'Pong: the 1972 arcade game that brought paddle duels to the screen.';
  d.zh['st.c6.g9'] = '双人弹球：街机 Pong 的同屏对决，派对游戏的鼻祖。';
  d.en['st.c6.g9'] = 'Paddle Pong: same-screen arcade duels, ancestor of party games.';
  d.zh['st.c6.g10'] = '冰壶：起源于 16 世纪苏格兰冰湖上的投石游戏。';
  d.en['st.c6.g10'] = 'Curling: stone-sliding born on frozen Scottish lochs in the 1500s.';
  d.zh['st.c7.g4'] = '五子棋：源自中国的连五棋，日本称「五目並べ」。';
  d.en['st.c7.g4'] = 'Gomoku: the five-in-a-row game from China, "gomoku narabe" in Japan.';
  d.zh['st.c7.g5'] = '黑白棋：1970 年代日本改良并商业化的翻转棋。';
  d.en['st.c7.g5'] = 'Reversi: the flip-capture game commercialized in Japan in the 1970s.';
  d.zh['st.c7.g6'] = '四子棋：1974 年发明的立式连四，重力落子经典。';
  d.en['st.c7.g6'] = 'Four in a Row: the 1974 gravity-drop connect-four classic.';
  d.zh['st.c7.g7'] = '情报评估：判断截获情报的可信度——哪些是真信号，哪些是烟雾弹。破译密码只是第一步。';
  d.en['st.c7.g7'] = 'Intelligence Assessment: judge the reliability of intercepted reports — real signal or smoke screen?';
  d.zh['st.c10.g20'] = 'AES 轮函数实验室：真实 S 盒与 GF(2^8) 列混淆——亲手驱动现代分组密码的心跳。';
  d.en['st.c10.g20'] = 'AES Round Lab: real S-box and GF(2^8) mixing — drive the heartbeat of modern block ciphers yourself.';
  d.zh['st.c10.g21'] = '口令保险库：熵、盐与慢哈希——把每天都在用的那套密码系统真正用对。';
  d.en['st.c10.g21'] = 'Password Vault: entropy, salt and slow hashing — finally get right the crypto you use every day.';
  d.zh['st.c10.g22'] = 'PGP 加密邮件：混合加密与信任之网——密码学第一次站到了枪炮的对立面。';
  d.en['st.c10.g22'] = 'PGP Mail: hybrid encryption and the Web of Trust — the first time cryptography stood up to guns.';
  d.zh['st.c10.g23'] = '区块链矿工：工作量证明用算力买信任——中本聪把密码学变成了经济学。';
  d.en['st.c10.g23'] = 'Blockchain Miner: proof of work buys trust with hashpower — Satoshi turned cryptography into economics.';
  d.zh['st.c10.g24'] = 'TOTP 双因素验证：时间片与共享密钥铸成的旋转锁——把每天在用的安全工具用明白。';
  d.en['st.c10.g24'] = 'TOTP Verify: a rotating lock forged from time slices and shared secrets — master the tool you use daily.';
  d.zh['st.c8.g4'] = '地牢探险：1980 年《Rogue》开创的随机地牢，Roguelike 之祖。';
  d.en['st.c8.g4'] = 'Dungeon: the 1980 game Rogue spawned random-floor roguelikes.';
  d.zh['st.c8.g5'] = '平台跳跃：1981 年《大金刚》起跳，像素时代的看家类型。';
  d.en['st.c8.g5'] = 'Platformer: from Donkey Kong in 1981, the genre of the pixel age.';
  d.zh['st.c8.g6'] = '恐龙快跑：Chrome 断网页里的小恐龙，跑酷小游戏代表。';
  d.en['st.c8.g6'] = 'Dino Run: the Chrome offline dinosaur, an endless-runner icon.';
  d.zh['st.c8.g7'] = '像素飞鸟：2013 年《像素鸟》一夜爆红又急流勇退。';
  d.en['st.c8.g7'] = 'Pixel Bird: the 2013 Flappy Bird that blew up overnight, then vanished.';
  d.zh['st.c8.g8'] = '小行星：击碎小行星群——1979 年的经典街机，是计算机从战时走向大众的见证。';
  d.en['st.c8.g8'] = 'Asteroids: shatter the rocks — the 1979 arcade classic, witness to computers leaving the war and reaching everyone.';
  d.zh['st.c8.g9'] = '俄罗斯方块：1984 年苏联程序员写出，冷战铁幕后的爆款。';
  d.en['st.c8.g9'] = 'Tetris: written by a Soviet programmer in 1984 — a Cold War blockbuster.';
  d.zh['st.c8.g10'] = '打砖块：1976 年雅达利《Breakout》开创的反弹消除游戏。';
  d.en['st.c8.g10'] = 'Breakout: the 1976 Atari classic that launched ball-and-brick games.';
  d.zh['st.c9.g4'] = '绵羊三消：多层叠牌的三消玩法，休闲手游的常青树。';
  d.en['st.c9.g4'] = 'Sheep Match: the layered-tile match game, a casual mainstay.';
  d.zh['st.c9.g5'] = '快艇骰子：1956 年加拿大发明的骰子计分游戏。';
  d.en['st.c9.g5'] = 'Yahtzee: the dice-score game invented in Canada in 1956.';
  d.zh['st.c9.g6'] = '接物游戏：考验手眼协调的街机经典，接得多得分高。';
  d.en['st.c9.g6'] = 'Catch: a hand-eye arcade classic — grab the goods, earn the score.';
  d.zh['st.c9.g7'] = '切绳：2010 年《割绳子》里的物理谜题，喂饱小怪兽。';
  d.en['st.c9.g7'] = 'Rope Rescue: the physics puzzle of 2010\'s Cut the Rope, feeding a little monster.';
  d.zh['st.c9.g8'] = '弹珠消消：祖玛式连锁消除，2000 年代网页游戏的记忆。';
  d.en['st.c9.g8'] = 'Ball Pop: Zuma-style chain-clearing, a memory of 2000s web games.';
  d.zh['st.c10.g7'] = '电路连接：旋转线路点亮灯泡——布尔电路就是信息论的物理化身：0 与 1 在导线里流淌。';
  d.en['st.c10.g7'] = 'Circuit: rotate the wires to light the bulb — Boolean circuits are information theory made physical: 0s and 1s flowing through wire.';
  d.zh['st.c10.g8'] = '点灯：点一格翻相邻——异或运算的游戏化：香农说，一切加密都建立在它之上。';
  d.en['st.c10.g8'] = 'Lights Out: flip the neighbours — XOR in game form: Shannon showed all modern crypto rests on it.';
  d.zh['st.c10.g9'] = '迷宫：随机迷宫寻路——图论与算法的最直观入口，计算机科学就从这里起步。';
  d.en['st.c10.g9'] = 'Maze: find the exit in a random maze — the most intuitive gateway to graph theory and algorithms.';
  d.zh['st.c10.g10'] = '管道连接：接通两端、步数最少——网络拓扑的游戏化：今天的信息高速公路，就是这样连起来的。';
  d.en['st.c10.g10'] = 'Pipe: connect the ends in fewest moves — networking in miniature: the information superhighway is just pipes joined well.';
  d.zh['st.c10.g11'] = '数字华容道：移动方块排成顺序——状态空间搜索，人工智能的看家本领。';
  d.en['st.c10.g11'] = '15-Puzzle: slide the tiles into order — state-space search, the bread and butter of AI.';
  d.zh['st.c10.g12'] = '岛屿连线：1990 年日本 Nikoli 出版的桥数谜题。';
  d.en['st.c10.g12'] = 'Hashi: the bridge-counting puzzle Nikoli published in Japan in 1990.';
  d.zh['st.c10.g13'] = '华容道：中国的滑块拼图，与 15 拼图同宗的经典谜题。';
  d.en['st.c10.g13'] = 'Klotski: the Chinese sliding puzzle, kin to the 15-puzzle.';
  /* 第四期 C3：hashlab 挂靠现代章（末位追加） */
  d.zh['st.c10.g14'] = '哈希雪崩实验室：翻转一个比特，看 SHA-256 的指纹天翻地覆——亲手测量香农之后密码学的「确定性混乱」。';
  d.en['st.c10.g14'] = 'Hash Avalanche Lab: flip one bit and watch a SHA-256 fingerprint turn upside down — measure post-Shannon deterministic chaos yourself.';
  d.zh['st.c10.g15'] = '纸牌密码：一副扑克就是一台加密机——Pontifex 四步规程产出密钥流，无电脑也能守住秘密。';
  d.en['st.c10.g15'] = 'Solitaire: a deck of cards IS the encryption machine — the Pontifex ritual turns cards into keystream, no computer needed.';
  /* 第六期 #4：rsa 挂靠现代章（末位追加） */
  d.zh['st.c10.g16'] = 'RSA 小素数保险柜：从两个小素数出发，亲手算出 n、φ、e、d，再加密一个字母——公钥密码的全部数学，一局手算走完。';
  d.en['st.c10.g16'] = 'RSA Small-Prime Vault: from two small primes, hand-compute n, φ, e and d, then encrypt a letter — the whole math of public-key crypto in one round.';
  /* 第六期 #1：shamir 挂靠现代章（末位追加） */
  d.zh['st.c10.g17'] = 'Shamir 分钥密约：把密信撕成五份分给五人——任何两份即可拼回原信，一份永远读不出半字，门限秘密分享手算实战。';
  d.en['st.c10.g17'] = 'Shamir Split-Key Pact: cut a letter into five shares for five allies — any two rebuild it, one reveals nothing; hands-on threshold secret sharing.';
  /* 第八期 #13：sm4 挂靠现代章（末位追加） */
  d.zh['st.c10.g18'] = 'SM4 国密试炼场：真实引擎与官方向量对拍——S 盒查表、轮迹追踪、国密史话，中国密码从跟随到输出的代表。';
  d.en['st.c10.g18'] = 'SM4 National-Cipher Trial: a real engine vector-checked against the official standard — S-box lookups, round traces, and the story of Chinese crypto going global.';
  /* 第八期 #17/#18：acrostic 挂文艺复兴章、phishhunt 挂现代章（末位追加） */
  d.zh['st.c3.g9'] = '藏头诗密信：每行首字连读成密信——与培根双字体同源的隐写雅趣，秘密藏在「看起来正常」里。';
  d.en['st.c3.g9'] = 'Acrostic Letters: read the line openings as one hidden word — steganography in the spirit of Bacon\'s two fonts, a secret hiding inside the ordinary.';
  /* 第十二期：stepping-switch 挂靠培根章（末位追加） */
  d.zh['st.c3.g10'] = '紫密步进开关：六元音/二十辅音双路步进可视化——输入字母看它走哪条路。';
  d.en['st.c3.g10'] = 'Stepping Switch: six-vowel/twenty-consonant dual-path stepping visualization — type a letter and watch which path it takes.';
  d.zh['st.c11.g4'] = '零知识洞穴：不泄露咒语证明你知道咒语——Goldwasser 与 Micali 的图灵奖思想。';
  d.en['st.c11.g4'] = 'ZKP Cave: prove you know the word without revealing it — the Turing-Award-winning idea.';
  d.zh['st.c10.g19'] = '钓鱼邮件狩猎：再强的加密也挡不住你亲手点开的链接——社会工程是密码链上最弱的一环，练出火眼金睛。';
  d.en['st.c10.g19'] = 'Phishing Hunt: the strongest crypto cannot stop your own click — social engineering is the weakest link; train the eye.';
})();

/* ============================================================
   新演示器文案（G2：dawn/purple/venona/modern）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.demoRosettaNote'] = '三栏按词组切分，点击后联动高亮——这正是商博良的破译路径：以已知的希腊文为锚点，逐词回推世俗体与象形文的读音，最终撬开失传千年的圣书体。';
  d.en['st.demoRosettaNote'] = 'Phrases align across the three scripts; clicking one highlights its matches — mirroring Champollion\'s method of anchoring on known Greek and working back to demotic and hieroglyphic readings.';
  d.zh['st.demoPurpleNote'] = '输入字母，动画演示它落入元音路或辅音路，再沿各自轨道换位输出——这正是紫密机「分组置换」的核心，也是弗里德曼团队从未见机、仅凭密文推演出的结构。';
  d.en['st.demoPurpleNote'] = 'Each typed letter animates into its vowel or consonant path and permutes before output — the "divided permutation" core of Purple, reconstructed purely from ciphertext by Friedman\'s team.';
  d.zh['st.demoVenonaNote'] = '上下两行密文逐位对齐，密钥列相互抵消后只剩明文差——密钥复用让「一次性密码本」名存实亡，这正是 VENONA 项目得以成立的历史教训。';
  d.en['st.demoVenonaNote'] = 'Aligned ciphertexts cancel the shared key column by column, leaving only the plaintext difference — key reuse defeats the one-time pad, the very lesson behind VENONA.';
  d.zh['st.demoEntropyNote'] = '滑块控制密钥位长与明文位长的比值：小于 1 时密文残留明文统计特征、可被频率分析；等于 1 时达到香农意义下的完美保密；大于 1 属冗余。前提是密钥真随机且仅用一次。';
  d.en['st.demoEntropyNote'] = 'The slider sets the key-to-plaintext length ratio: below 1, statistical residue invites frequency analysis; at 1, Shannon\'s perfect secrecy holds; above 1 is waste. The key must be truly random and used once.';
})();

/* ============================================================
   章节冷知识（G1）：8 章补充
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.c1.facts'] = '凯撒密码其实没有固定偏移。苏埃托尼乌斯记载，凯撒本人只把字母后移三位，但他的侄子奥古斯都用的却是「把 A 当 B」的移位。而西塞罗给普朗库斯的密码信见于书信集——可见保密通信在罗马军政界已是实务。';
  d.en['st.c1.facts'] = 'Caesar\'s cipher had no fixed shift. Suetonius says Caesar himself shifted letters by three, yet his nephew Augustus used "A becomes B" — a shift of one. Even earlier, Cicero described a transposition cipher in his letters, echoing the Spartan scytale. The shift-versus-transposition debate thus predates Caesar by centuries.';
  d.zh['st.c2.facts'] = '9 世纪，阿拉伯学者肯迪写下《解译加密信息手稿》，首次系统阐述频率分析：他统计阿拉伯语字母的出现频率，发现 alif 与 lam 最常见，由此破解单表替换密码。他还主张破解须结合原文语言、体裁与场合——这套思想领先欧洲约六百年，而「密码」一词本身也源自阿拉伯语 sifr。';
  d.en['st.c2.facts'] = 'In the 9th century, the Arab scholar al-Kindi wrote "A Manuscript on Deciphering Cryptographic Messages," the first systematic treatise on frequency analysis. Counting letter frequencies in Arabic, he found alif and lam most common, and used this to break monoalphabetic substitution ciphers. He also insisted cryptanalysis required knowing the plaintext\'s language, genre, and occasion — six centuries ahead of Europe. Even the word "cipher" derives from Arabic "sifr."';
  d.zh['st.c3.facts'] = '1623 年培根在《论学术的进展》中提出「双字体密码」：任意两种字形即可编码 5 位二进制（a=00000、b=00001…），被视为二进制编码的先声。而「维吉尼亚密码」实为误名——它由贝拉索于 1553 年发明，维吉尼亚 1586 年发表的只是「自动密钥」变体，却因误传冠上了他的名字。';
  d.en['st.c3.facts'] = 'In 1623, Francis Bacon\'s De Augmentis Scientiarum introduced his biliteral cipher: any two typefaces encode 5-bit binary (a=00000, b=00001...), widely regarded as the origin of binary encoding. Ironically, the "Vigenère cipher" is a misnomer — Giovan Battista Bellaso invented it in 1553, while Vigenère\'s 1586 publication was an autokey variant. History nonetheless credits Vigenère.';
  d.zh['st.c5.facts'] = '布莱切利园的成功不止图灵一人。戈登·韦尔奇曼的「对角线板」让 Bombe 提速约十倍，使破译 Enigma 从理论走向日常实战；图灵则完善了「crib」推断明文与 Banburismus 技巧。战后全部成果保密 30 年，图灵不能向任何人提及这段经历，直到 1974 年《超级机密》出版才公之于世。';
  d.en['st.c5.facts'] = 'Bletchley Park was more than Turing. Gordon Welchman\'s diagonal board made the Bombe some ten times faster, turning Enigma-breaking into daily practice, while Turing perfected crib-based attacks and Banburismus. The whole achievement stayed secret for 30 years — Turing could not mention it to anyone — until Winterbotham\'s The Ultra Secret revealed it in 1974.';
  d.zh['st.c6.facts'] = '中途岛海战前，罗奇福特设下著名的「AF 陷阱」：他让中途岛守军故意用明文发出「淡水蒸馏设备故障」的假电报，日方随后在密文中报告「AF 淡水不足」，一举证实 AF 就是中途岛。而 JN-25 被破译的关键，在于美方发现其乱数表被重复使用——破译靠的是细心统计，而非奇迹。';
  d.en['st.c6.facts'] = 'Before Midway, Joe Rochefort sprang the "AF trap": he had Midway broadcast a fake plaintext that its freshwater distiller had broken. The Japanese soon reported "AF is short of fresh water" in cipher, confirming AF meant Midway. Breaking JN-25 likewise hinged on noticing that its additive super-encryption tables were being reused — success came from painstaking statistics, not miracles.';
  d.zh['st.c7.facts'] = '破译紫密的关键是「假想机」：弗里德曼团队从未见过日本「九七式欧文印字机」，仅凭拦截电文推演出它由六元音路与二十辅音路构成、经两级继电器切换的完整逻辑，并用「循环分析」绕过电气细节、先重构算法再造真机。陆军与海军情报部门竞争激烈，弗里德曼甚至因此精神崩溃住院。';
  d.en['st.c7.facts'] = 'Purple was broken without ever seeing it. William Friedman\'s team deduced the machine\'s full logic — a six-vowel path and a twenty-consonant path switching relays in two stages — purely from intercepted traffic. Using cycle analysis, they reconstructed the algorithm first and built a working replica afterwards. Army–Navy rivalry ran so deep that Friedman suffered a breakdown and was hospitalized.';
  d.zh['st.c8.facts'] = '洛伦兹密码机的破解催生了世界上第一台电子计算机——Colossus。工程师汤米·弗劳尔斯不到一年造出十台，用真空管以每秒五千字符的速度处理「Tunny」密文，与图灵的统计方法配合无间。这一成就保密约三十年，直到 1970 年代才解密——与它相比，Enigma 反而是「简单」的那个。';
  d.en['st.c8.facts'] = 'Breaking the Lorenz cipher produced the world\'s first electronic computer: Colossus. Engineer Tommy Flowers built ten machines in under a year, processing Tunny traffic at 5,000 characters per second with vacuum tubes, working alongside Turing\'s statistical methods. The feat stayed secret for some thirty years, until the 1970s declassification. Beside it, Enigma was the "easy" problem.';
  d.zh['st.c9.facts'] = 'VENONA 破译源于一个致命失误：苏联外交机构的一次性密码本因印刷不足而被迫复用，美方把两份共享密钥的密文逐位相减、令密钥相互抵消，从而读出明文。1945 年叛逃的苏联译码员古曾科提供了关键线索；项目保密至 1995 年才解密。罗森伯格夫妇正是因 VENONA 情报（朱利叶斯代号「LIBERAL」）被定罪。';
  d.en['st.c9.facts'] = 'VENONA was born of a fatal error: Soviet one-time pads were printed in short supply and reused. Aligning two ciphertexts so the shared key cancelled out let American analysts read the plaintext. Defector Igor Gouzenko supplied crucial leads in 1945, yet the project stayed secret until declassified in 1995. The Rosenbergs were convicted largely on VENONA material, Julius bearing the codename LIBERAL.';
  d.zh['st.c0.facts2'] = '罗塞塔石碑是公元前 196 年孟菲斯祭司为托勒密五世颁布的诏书，1799 年 7 月由法军军官布沙尔挖出，1802 年起藏于大英博物馆。商博良破译的另一把钥匙，是他自幼精通的科普特语——古埃及语最后的活后裔。另据一则东方注脚：甲骨文单字约四千五百个，学界公认释读者至今仅三分之一上下——人类最古老的文字之一，仍是一桩进行中的解码公案。';
  d.en['st.c0.facts2'] = 'The Rosetta Stone is a decree issued in 196 BC by the priests of Memphis in honour of Ptolemy V. It was dug up in July 1799 by the French officer Pierre-François Bouchard, weighs about 760 kg (1,676 lb), and has been in the British Museum since 1802. Champollion\'s other key was Coptic, which he had mastered since boyhood — the last living descendant of ancient Egyptian. An Eastern footnote: oracle-bone script offers about 4,500 distinct characters, yet only a third are securely read — one of humanity\'s oldest scripts remains an open decoding case.';
  d.zh['st.c1.facts2'] = '互联网上仍活着凯撒密码的直系后裔——ROT13：偏移 13 位，因为 13 是 26 的一半，加密两次即还原。1990 年代 Usenet 论坛用它隐藏剧透，至今编程工具仍内置。它挡不住的频率分析，正是下一章肯迪的武器。同期东方的注脚更为彻底：《六韬》「阴符」不着一字，八种符节长短即八类军情——最稳的密码可以完全看不见字母。';
  d.en['st.c1.facts2'] = 'A direct descendant of Caesar\'s cipher still lives on the internet — ROT13: shift the alphabet by 13, and since 13 is half of 26, encrypting twice restores the text. In the 1990s Usenet forums used it to hide spoilers, and many programming tools still build it in. The frequency analysis it cannot stop is precisely the weapon of the next chapter\'s al-Kindi. Centuries earlier, the East had answered: the Liu Tao\'s Yinfu tallies wrote no letters at all — eight lengths for eight reports. The surest cipher may show no alphabet.';
  d.zh['st.c2.facts2'] = '肯迪《解译加密信息手稿》的孤本抄本藏在伊斯坦布尔的苏莱曼尼耶图书馆，九百年来少有人翻阅。这位「阿拉伯的哲学家」还撰写了《论印度数字的使用》，把十进制带入阿拉伯世界——破译之父，也是「0」的传播者。';
  d.en['st.c2.facts2'] = 'The only surviving copy of al-Kindi\'s A Manuscript on Deciphering Cryptographic Messages rests in the Süleymaniye Library in Istanbul, unread for nine centuries. The "Philosopher of the Arabs" also wrote On the Use of Indian Numerals, carrying the decimal system into the Arab world — the father of codebreaking was also an apostle of zero.';
  d.zh['st.c3.facts2'] = '「不可破译」的维吉尼亚密码，1854 年就被差分机之父巴贝奇破解——但他受军方嘱咐保密，成果从未发表；直到 1863 年普鲁士军官卡西斯基独立破解，巴贝奇的功绩被埋没了一百多年。维吉尼亚输给的，是「尚未公布的天才」。';
  d.en['st.c3.facts2'] = 'The "indecipherable" Vigenère cipher was actually broken in 1854 by Charles Babbage, father of the Difference Engine — but he kept it secret at military request and never published; only in 1863, when the Prussian officer Kasiski independently cracked it, did the world learn. The Vigenère lost not to a genius, but to a genius who stayed silent.';
  d.zh['st.c4.facts2'] = 'ADFGVX 的名字就是它全部的密文字母：A、D、F、G、V、X——选这六个字母，是因为它们的摩斯电码差异最大，炮火下的报务员不容易抄错。这个「防抄错」的贴心设计，恰好给了破译者最整齐的频率统计入口。';
  d.en['st.c4.facts2'] = 'ADFGVX\'s name is the entire alphabet of its ciphertext: A, D, F, G, V, X — chosen because their Morse codes differ the most, so signallers under shellfire could hardly mis-copy them. That considerate "anti-error" design handed the codebreakers their neatest frequency statistics.';
  d.zh['st.c5.facts2'] = 'Enigma 有个怪癖：字母加密后绝不变回自己——「不自映射」正是 Bombe 的立足点。而首位破译者不是图灵：雷耶夫斯基 1932 年用群论还原了转子，1939 年 7 月把全套成果交给英国。布莱切利园站在波兰人肩上。';
  d.en['st.c5.facts2'] = 'Enigma had a famous quirk: no letter ever enciphered to itself — this "no self-mapping" rule was the very foothold of the Bombe. And the first breaker was not Turing: the Polish mathematician Marian Rejewski reconstructed the rotors with group theory in 1932, handing the full package to Britain in July 1939. Bletchley Park stood on Polish shoulders.';
  d.zh['st.c6.facts2'] = '罗奇福特常穿着睡衣、趿着拖鞋，在珍珠港的地下室里指挥破译。这位中途岛功臣战后反被调离情报岗位，未获任何战时勋章；直到 1986 年（逝世十年后），海军才追授他杰出服役勋章——功劳簿上迟到四十年的名字。';
  d.en['st.c6.facts2'] = 'Joe Rochefort ran his codebreakers from a Pearl Harbor basement, often in a bathrobe and slippers. Yet the hero of Midway was reassigned away from intelligence after the battle and won no wartime medal; only in 1986, ten years after his death, did the Navy posthumously award him the Distinguished Service Medal — a name forty years late to the honours list.';
  d.zh['st.c7.facts2'] = '日本的「气象暗号」按风向区分开战对象：「东风，雨」指对美、「西风，晴」指对英、「北风，阴」指对苏。美军监听站日夜守听这套广播暗号，据战后调查，真实的「东风，雨」从未被完整截获——珍珠港之晨，暗号始终没有现身。';
  d.en['st.c7.facts2'] = 'Japan\'s "winds code" announced which enemy war was coming by wind direction: "East wind, rain" meant war with the US, "West wind, clear" with Britain, "North wind, cloudy" with the USSR. American listening posts stood watch around the clock, yet postwar investigation suggests a genuine full "East wind, rain" broadcast was never confirmed — on the morning of Pearl Harbor, the code never showed.';
  d.zh['st.c8.facts2'] = '洛伦兹机 12 轮共装 501 根针：χ 轮 41、31、29、26、23，ψ 轮 43、47、51、53、59，μ 轮 37、61——针数两两互质，周期长如天文数字。破译要猜每根针当天的「开」「关」位置。';
  d.en['st.c8.facts2'] = 'The Lorenz machine\'s twelve wheels carried 501 pins in all: the χ wheels 41, 31, 29, 26, 23; the ψ wheels 43, 47, 51, 53, 59; the μ wheels 37 and 61 — all pairwise coprime, so the keystream period grew astronomically long. The codebreaker\'s task was to guess, for that day, which of the 501 pins were "on" and which "off".';
  d.zh['st.c9.facts2'] = 'VENONA 电文中，苏联对美国原子弹计划的代号是「ENORMOZ」（巨大）——这个词反复出现，是锁定核间谍网的关键。而罗森伯格案审判时，破译内容因保密无法上庭，定罪主要靠格林格拉斯的证词；埃塞尔是否知情，至今仍是争议。';
  d.en['st.c9.facts2'] = 'In the VENONA traffic the Soviets codenamed the American atomic bomb project ENORMOZ — the word recurred again and again and became the key to tracing the nuclear spy ring. Ironically, at the Rosenbergs\' trial the decrypts were too secret to present in court; the conviction rested mainly on Greenglass\'s testimony, and whether Ethel knew remains a historical dispute.';
  d.zh['st.c10.facts2'] = '公钥密码险些不叫 RSA：英国 GCHQ 的埃利斯 1969 年就提出「非保密加密」构想，科克斯 1973 年写出了与 RSA 等价的算法——两者皆因机密被雪藏，直到 1997 年解密，世界才知公钥革命的第一棒在伦敦。';
  d.en['st.c10.facts2'] = 'Public-key cryptography almost wasn\'t called RSA: at Britain\'s GCHQ, James Ellis proposed "non-secret encryption" in 1969, and Clifford Cocks wrote down an algorithm equivalent to RSA in 1973 — both locked away as secrets until declassified in 1997. The world then learned that the first baton of the public-key revolution had been passed in London.';
})();

/* ============================================================
   第四期 A1：第 12 章 · 量子转折点（quantum / c11）
   正文 + TL;DR + 前置 + 游戏卡 + 冷知识×2 + 挑战 + 演示器说明
   （本章无密信：CODEBREAKER 属于前 11 章；c10 补下章预告钩子）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.c10.next'] = '公钥的城墙筑好了，新的攻城锤也已在路上——下一站，量子时代';
  d.en['st.c10.next'] = 'The public-key walls are built — and new rams are already rolling. Next: the quantum era';
  d.zh['st.c11.tldr'] = '一份被拒稿的手稿长出 BB84；Shor 算法动摇公钥根基；NIST 用格密码重铸标准——密码学驶入量子纪元。';
  d.en['st.c11.tldr'] = 'A rejected manuscript grows into BB84; Shor\'s algorithm shakes public key to its roots; NIST recasts standards on lattices — cryptography enters the quantum age.';
  d.zh['st.c11.prereq'] = '第 10 章的公钥概念（RSA 为什么依赖大数分解）';
  d.en['st.c11.prereq'] = 'Chapter 10 public-key concept (why RSA leans on factoring)';
  d.zh['st.c11.b'] = '1970 年前后，哥伦比亚大学的研究生斯蒂芬·威斯纳写下一份奇思妙想：《共轭编码》。他提议用量子态印制钞票——量子力学不允许「测了又不留痕」，伪币制造者一旦测量纸币上的量子态，就会不可逆地破坏它而暴露。这篇手稿被期刊接连拒稿，沉睡十余年，直到[[wiesner]]的老朋友、IBM 的[[bennett]]与蒙特利尔大学的[[brassard]]把它从故纸堆里翻了出来。1984 年，两人在印度班加罗尔的 IEEE 会议上发表一页摘要，提出量子密钥分发协议 BB84：发送方用两组基（直线＋与斜叉×）随机编码光子偏振，接收方也随机选基测量；事后双方公开比对基、留下匹配位作为共享密钥。妙处在于：窃听者若想偷看，就必须测量光子——而测量会以约四分之一的概率在筛选密钥中引入误码。密钥还没启用，窃听的指纹已经留在信道上。密码学第一次拥有了「窃听必留痕」的信道。\n\n真正的地震发生在十年后的贝尔实验室。1994 年，数学家[[shor]]公布了一种运行于量子计算机的算法：它能在多项式时间内完成大数分解与离散对数。消息几天内传遍各大实验室与安全机构——RSA 的地基、Diffie-Hellman 的地基、ECC 的地基，全部建立在「经典计算机算不动」之上，而 Shor 算法把这些难题连根拔起。两年后，[[grover]]给出另一半判决：他的搜索算法能把暴力破解从 N 步加速到约 √N 步——但仅此而已，对称密码只需把密钥加倍便可高枕无忧，AES-256 至今稳如泰山；真正被判死刑的，只有依赖数论结构的公钥家族。密码学界第一次集体意识到：量子力学既是密码的朋友（QKD），也可能是它的掘墓人。\n\n威胁并非科幻小说。情报机构今天就可以「先截获、后解密」：把当前无法破译的密文整仓库存，等量子计算机成熟之日回放解读。医疗档案、国家机密的保密期以数十年计，早已超过大规模量子计算机的预计抵达时间——换锁这件事，等不起。\n\n于是有了密码学史上罕见的公开选秀。2016 年起，美国国家标准与技术研究院（NIST）面向全球征集后量子算法，82 个初始提案历经七年公开评审与轮番攻击：曾一路领先的 SIKE 在 2022 年被研究者用一台普通笔记本电脑约一小时攻破，「看起来难」与「真的难」之间隔着一整个证明的距离。2024 年 8 月，首批标准终于落定：FIPS 203（ML-KEM）、204（ML-DSA）、205（SLH-DSA）。它们大多基于格上的难题——把数千维空间中的点阵搅进噪声，让最短向量无处可寻——至今没有给 Shor 算法留下可乘之隙。与此同时，BB84 走出实验室：光纤骨干网上的量子密钥、2016 年升空的「墨子号」卫星，正在为少数高价值链路提供物理级的保密通道。\n\n从罗塞塔石碑的多字谜题，到凯撒的移位、维吉尼亚的方表、Enigma 的转子、香农的熵——每一次「绝对安全」的宣告，都催生了下一次破译；每一次破译，又逼出更强的锁。如今轮到量子登场：它一手举起斧头，一手递上新锁。这场自巴格达智慧宫延续至今的攻防竞赛没有终局，只是又一次换了战场——而这一次，战场设在物理学的基础法则之上。';
  d.en['st.c11.b'] = 'Around 1970 a graduate student named Stephen Wiesner wrote down a strange idea he called "Conjugate Coding": print banknotes with quantum states. Quantum mechanics forbids measuring without disturbing, so any counterfeiter who tried to read such a note would irreversibly damage it and give himself away. Journals rejected the manuscript again and again, and it slept for over a decade — until Wiesner\'s old friend [[bennett]] at IBM and [[brassard]] at the Université de Montréal dug it out of obscurity. In 1984 they published a one-page abstract at an IEEE conference in Bangalore, India, proposing BB84, the first practical quantum key distribution protocol: the sender encodes each photon\'s polarization in one of two randomly chosen bases (+ and ×), the receiver measures in randomly chosen bases too; afterwards both publicly compare bases and keep the matching positions as a shared key. The beauty is this: an eavesdropper who wants to peek must measure the photons — and measurement injects errors into roughly one in four sifted bits. Before the key is even used, the wiretap has left fingerprints on the channel. Cryptography had gained something entirely new: a wire that cannot be tapped silently.\n\nThe real earthquake came a decade later at Bell Labs. In 1994 the mathematician [[shor]] unveiled an algorithm for a hypothetical quantum computer that factors integers and computes discrete logarithms in polynomial time. Word spread through labs and security agencies within days: RSA, Diffie-Hellman and ECC all rest on problems classical computers cannot crack — and Shor pulled those foundations out whole. Two years later [[grover]] delivered the other half of the verdict: his search algorithm speeds brute force from N steps down to about √N — but only that far. Symmetric ciphers simply double their keys; AES-256 still stands serene. What is truly condemned is the number-theoretic public-key family. Cryptographers collectively realized that quantum mechanics is both a friend (QKD) and a possible gravedigger.\n\nThe threat is not science fiction. An adversary can "harvest now, decrypt later": warehouse today\'s unbreakable ciphertexts and replay them once a quantum computer matures. Medical records and state secrets must stay secret for decades — longer than the expected arrival of large-scale quantum computers. The lock cannot wait.\n\nHence one of the rare open tournaments in cryptographic history. From 2016 NIST solicited post-quantum algorithms worldwide; 82 initial submissions endured seven years of public review and relentless attack — SIKE, once a frontrunner, was broken in about an hour on an ordinary laptop in 2022, proof that "looks hard" and "is hard" are separated by a whole theorem. In August 2024 the first standards landed: FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA). Most rest on lattice problems — thousands of dimensions of points buried in noise, shortest vectors nowhere to be found — where Shor\'s algorithm finds no purchase. Meanwhile BB84 left the lab: quantum keys run over fiber backbones, and the Micius satellite, launched in 2016, now offers physics-grade secrecy on select intercontinental links.\n\nFrom the Rosetta Stone\'s polyglot puzzle through Caesar\'s shifts, Vigenère\'s tableau, Enigma\'s rotors and Shannon\'s entropy — every declaration of "absolutely secure" has summoned the next break; every break has forged a stronger lock. Now quantum mechanics takes the stage, raising the axe with one hand and offering new locks with the other. The contest that began in the House of Wisdom has no final chapter; it has merely changed battlegrounds again — this time to the fundamental laws of physics itself.';
  d.zh['st.c11.g1'] = '化身 BB84 的接收方：选基测量光子、筛出共享密钥，再抓出那个留下指纹的窃听者。';
  d.en['st.c11.g1'] = 'Play the receiver in BB84: choose measurement bases, sift the shared key, and catch the eavesdropper whose fingerprints betray them.';
  /* 第十二期：qkd-sim 挂靠量子章（末位追加） */
  d.zh['st.c11.g2'] = 'QKD 密钥分发模拟：选基测量光子、筛选密钥、比对 QBER——亲手体验 BB84 量子密钥分发的完整流程。';
  d.en['st.c11.g2'] = 'QKD Simulator: choose bases, measure photons, sift keys and compare QBER — hands-on BB84 quantum key distribution.';
  /* 第十二期：pqc-match 挂靠量子章（末位追加） */
  d.zh['st.c11.g3'] = '后量子迁移配对：把经典密码算法与其后量子继任者配对——NIST 2024 标准速记。';
  d.en['st.c11.g3'] = 'Post-Quantum Matching: pair classical algorithms with their PQ successors — NIST 2024 standards quick reference.';
  d.zh['st.c11.facts'] = '「墨子号」2017 年实现星地量子密钥分发，把 BB84 从光纤搬上太空，2017 年北京与维也纳曾借此完成跨洲量子加密视频通话。另一条：谷歌已在 Chrome 中试水「混合密钥交换」，让传统椭圆曲线与后量子 Kyber 并肩护航——迁移不是换闸刀，而是先让两把锁同门站岗。';
  d.en['st.c11.facts'] = 'In 2017 China\'s Micius satellite achieved space-to-ground QKD, lifting BB84 off fiber and into orbit; Beijing and Vienna once held an intercontinental quantum-encrypted video call over it. And Google has been trialing hybrid key exchange in Chrome — classical elliptic curves standing guard alongside post-quantum Kyber, because migration means two locks at the door before one is swapped.';
  d.zh['st.c11.facts2'] = '后量子竞选中也有惨痛教训：曾一路领跑的 SIKE，2022 年被鲁汶大学研究者用一台普通笔记本在一小时内击倒；同年彩虹签名 Rainbow 也在一个周末内陷落。七年的公开评审因此显得必要而非多余——「还没人攻破」从来不等于「安全」。';
  d.en['st.c11.facts2'] = 'The tournament had painful lessons too: SIKE, long a frontrunner, fell in about an hour to researchers on an ordinary laptop in 2022, and the Rainbow signature scheme collapsed over a single weekend the same year. Seven years of public vetting proved necessary, not excessive — "nobody has broken it yet" has never meant "secure".';
  d.zh['st.c11.ch'] = '窃听检测题：BB84 中窃听者 Eve 对每个光子随机选基测量。双方比对基后留下的「筛选密钥」里，Eve 平均引入的误码率 QBER 约是百分之多少？输入数字作答（如 42 表示 42%）。';
  d.en['st.c11.ch'] = 'Eavesdropper test: in BB84, Eve measures every photon in a random basis. Among the sifted key bits (where Alice and Bob used the same basis), what average error rate QBER does Eve introduce? Answer with a number (e.g., 42 means 42%).';
  d.zh['st.demoBb84Note'] = '点击「发射光子」模拟 BB84：Alice 随机选基编码比特，Bob 随机选基测量；基一致才保留为筛选密钥位。打开 Eve 后再发射若干次，观察误码率上升——窃听者自己会暴露自己。';
  d.en['st.demoBb84Note'] = 'Press "Send photon" to simulate BB84: Alice encodes a bit in a random basis, Bob measures in a random basis; matching bases become sifted key bits. Switch Eve on and send more photons — watch the error rate climb as the eavesdropper betrays herself.';
})();