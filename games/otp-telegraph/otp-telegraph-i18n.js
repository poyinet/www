/* 破译 DECODE ARCADE · otp-telegraph 游戏内文案（zh/en 对称） */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.otp-telegraph.tutTitle'] = 'OTP 电报房 · 玩法';
  d.en['gs.otp-telegraph.tutTitle'] = 'OTP Telegraph Room · How to Play';
  d.zh['gs.otp-telegraph.tut1t'] = '目标';
  d.en['gs.otp-telegraph.tut1t'] = 'Objective';
  d.zh['gs.otp-telegraph.tut1'] = '七关：认识 Vernam 电报机 → 五单位码逐字加密 → 收报解码 → 全电文收发 → 密钥复用深度破译 → 两道史实铁律题。答对 +20，满分 140。';
  d.en['gs.otp-telegraph.tut1'] = 'Seven levels: meet the Vernam telegraph machine, encrypt letter by letter in 5-unit code, decode the tape, send a full message, break a reused-key depth, then two law-and-history questions. +20 each, 140 max.';
  d.zh['gs.otp-telegraph.tut2t'] = '机械原理';
  d.en['gs.otp-telegraph.tut2t'] = 'Mechanics';
  d.zh['gs.otp-telegraph.tut2'] = '1917 年 Vernam 的发明：电传纸带把字母写成五位码（ITA2），密钥带与明文带逐位异或——密文带即「明文 + 密钥」的逐位和；密钥带随机、等长、只用一次，就是香农证明的完美好保密。';
  d.en['gs.otp-telegraph.tut2'] = 'Vernam in 1917: teletype tape encodes letters as 5-bit groups (ITA2); the key tape XORs with the message tape, bit by bit — ciphertext is the bitwise sum. With a random, equal-length, single-use key, Shannon proved it perfectly secret.';
  d.zh['gs.otp-telegraph.tut3t'] = '计分';
  d.en['gs.otp-telegraph.tut3t'] = 'Scoring';
  d.zh['gs.otp-telegraph.tut3'] = '每关 +20。第 5 关亲手经历「密钥重复使用」的灾难：两封同密钥电文相减，密钥消失，密文只剩明文的差分——这就是 VENONA 攻破苏联间谍网的数学。';
  d.en['gs.otp-telegraph.tut3'] = '+20 per level. Level 5 hands you the key-reuse disaster: subtract two same-key messages and the key vanishes, leaving only the plaintext difference — the exact math behind VENONA breaking Soviet networks.';
  d.zh['gs.otp-telegraph.helpText'] = '为什么重要：OTP 是唯一被信息论证明「不可破」的加密——条件是密钥真随机、等长、只用一次。现实里密钥分发让人望而却步，苏联人用五位数本重复加密，被 VENONA 项目分了三半；二战后的美苏热线倒是把 OTP 用成了现实。<a class="gh-link" href="../../story.html?id=ww1">见编年史「一战的电波战」→</a>（密钥复用灾难详见 venona 章）';
  d.en['gs.otp-telegraph.helpText'] = 'Why it matters: the OTP is the only provably unbreakable scheme — given true randomness, equal length and single use. Key distribution makes it impractical; Soviet five-digit pads reused it and VENONA took them apart, while the Cold War hotline made OTP real with low traffic and diplomatic key drops.<a class="gh-link" href="../../story.html?id=ww1">See "The Radio War of WWI" &rarr;</a> (the reuse disaster is in the VENONA chapter)';
  d.zh['gs.otp-telegraph.dailyBtn'] = '📅 每日挑战';
  d.en['gs.otp-telegraph.dailyBtn'] = '📅 Daily challenge';
  d.zh['gs.otp-telegraph.prog'] = '第 {n} / {total} 关 · 得分 {score}';
  d.en['gs.otp-telegraph.prog'] = 'Level {n}/{total} · Score {score}';
  d.zh['gs.otp-telegraph.stageKnow'] = '📨 认识 Vernam 电报机';
  d.en['gs.otp-telegraph.stageKnow'] = '📨 Meet the Vernam machine';
  d.zh['gs.otp-telegraph.stageEnc'] = '⌨️ 逐字加密';
  d.en['gs.otp-telegraph.stageEnc'] = '⌨️ Encrypt a letter';
  d.zh['gs.otp-telegraph.stageDec'] = '📻 收报解码';
  d.en['gs.otp-telegraph.stageDec'] = '📻 Decode';
  d.zh['gs.otp-telegraph.stageMsg'] = '📡 全电文收发';
  d.en['gs.otp-telegraph.stageMsg'] = '📡 Full dispatch';
  d.zh['gs.otp-telegraph.stageDepth'] = '🧨 复用深度破译';
  d.en['gs.otp-telegraph.stageDepth'] = '🧨 Depth attack';
  d.zh['gs.otp-telegraph.correct'] = '✓ 正确！';
  d.en['gs.otp-telegraph.correct'] = '✓ Correct!';
  d.zh['gs.otp-telegraph.wrong'] = '✗ 正确答案已标出';
  d.en['gs.otp-telegraph.wrong'] = '✗ The right answer is marked';
  d.zh['gs.otp-telegraph.nextBtn'] = '下一关 →';
  d.en['gs.otp-telegraph.nextBtn'] = 'Next →';
  d.zh['gs.otp-telegraph.done'] = '电文已送达！最终得分 {score}。';
  d.en['gs.otp-telegraph.done'] = 'Telegram delivered! Final score {score}.';
  d.zh['gs.otp-telegraph.againBtn'] = '↻ 再发一通';
  d.en['gs.otp-telegraph.againBtn'] = '↻ New telegram';
  d.zh['gs.otp-telegraph.ita2Title'] = '📜 ITA2 五单位码（字母档节选）';
  d.en['gs.otp-telegraph.ita2Title'] = '📜 ITA2 5-unit code (letters case, excerpt)';
  d.zh['gs.otp-telegraph.tapeNote'] = '逐位异或：明文 ⊕ 密钥 = 密文（再次异或即还原）';
  d.en['gs.otp-telegraph.tapeNote'] = 'Bitwise XOR: plaintext + key = ciphertext (XOR again to recover)';
  d.zh['gs.otp-telegraph.l1q'] = 'Vernam 电报机加密的核心运算是？';
  d.en['gs.otp-telegraph.l1q'] = 'What is the core operation of the Vernam telegraph cipher?';
  d.zh['gs.otp-telegraph.l1o1'] = '五单位码与密钥带逐位异或', 
  d.en['gs.otp-telegraph.l1o1'] = 'Bitwise XOR of 5-unit codes with a key tape';
  d.zh['gs.otp-telegraph.l1o2'] = '字母表整体平移';
  d.en['gs.otp-telegraph.l1o2'] = 'Alphabet slide';
  d.zh['gs.otp-telegraph.l1o3'] = '按词表整词替换';
  d.en['gs.otp-telegraph.l1o3'] = 'Whole-word codebook';
  d.zh['gs.otp-telegraph.l1o4'] = '机械转子轮流进';
  d.en['gs.otp-telegraph.l1o4'] = 'Rotor stepping';
  d.zh['gs.otp-telegraph.e1'] = '1917 年贝尔实验室的 Vernam 把电传纸带（五单位码）与密钥带逐位相加——异或原子在这台机器上第一次作为「加密」出现；同年 Mauborgne 坚持密钥带必须一次性，OTP 就此成立。';
  d.en['gs.otp-telegraph.e1'] = 'In 1917 Bell Labs Vernam XORed the teletype message tape with a key tape — XOR as encryption was born on this machine; Mauborgne insisted the key be single-use, and the one-time pad became real.';
  d.zh['gs.otp-telegraph.l2q'] = '用密钥组 {k} 给明文字母「{p}」加密，密文组是？';
  d.en['gs.otp-telegraph.l2q'] = 'With key group {k}, the letter "{p}" encrypts to which group?';
  d.zh['gs.otp-telegraph.e2'] = '查 ITA2 表得字母码，与密钥组逐位异或：同 0 异 1——五位的每一位都要动手，这就是「加法」的机械语义。';
  d.en['gs.otp-telegraph.e2'] = 'Look up the letter in the ITA2 table, then XOR with the key group bit by bit: same is 0, different is 1 — the mechanical meaning of addition.';
  d.zh['gs.otp-telegraph.l3q'] = '收到密文组 {c}，用密钥组 {k} 还原的字母是？';
  d.en['gs.otp-telegraph.l3q'] = 'Group {c} arrives with key {k} — which letter does it decode to?';
  d.zh['gs.otp-telegraph.e3'] = '异或的自反性：密文 ⊕ 密钥 = 明文——同一台机器，发报收报一个动作；密钥带必须销毁。';
  d.en['gs.otp-telegraph.e3'] = 'XOR is its own inverse: ciphertext + key = plaintext. One machine, one action; then the key tape must be destroyed.';
  d.zh['gs.otp-telegraph.l4q'] = '明文「{w}」经密钥带（首组 {k}）发出的密文是？';
  d.en['gs.otp-telegraph.l4q'] = 'Plaintext "{w}" with key tape starting {k} produces which ciphertext?';
  d.zh['gs.otp-telegraph.e4'] = '五单位码以五位一组连续异或——密钥带长度必须≥明文；电报员逐字推进密钥，绝不回头。';
  d.en['gs.otp-telegraph.e4'] = 'Five bits at a time, continuous XOR while the key tape must be at least as long as the message — the operator advances the key and never looks back.';
  d.zh['gs.otp-telegraph.l5q'] = '两封同密钥密文相减后发现：第 {n} 位差分是 00000——若知甲方该位置是「{m}」，乙方同位字母是？';
  d.en['gs.otp-telegraph.l5q'] = 'Subtracting two same-key messages shows position {n} has difference 00000. If Alice there has "{m}", Bob has?';
  d.zh['gs.otp-telegraph.e5'] = 'C1⊕C2 = M1⊕M2：密钥被相减消去——同位置字母相同则得 00000；已知一方即可还原另一方。VENONA 靠这种「深度」从数千封苏联电文中撕开协议。';
  d.en['gs.otp-telegraph.e5'] = 'C1+C2 = M1+M2: the key cancels. Equal letters give 00000; know one side and recover the other. VENONA used exactly this depth to tear open thousands of Soviet messages.';
  d.zh['gs.otp-telegraph.l6q'] = '香农证明 OTP 完美保密需要三个条件，缺一不可的是？';
  d.en['gs.otp-telegraph.l6q'] = 'Shannon proved OTP perfect secrecy under three conditions — which is indispensable?';
  d.zh['gs.otp-telegraph.l6o1'] = '密钥真随机、与明文等长、只用一次——任一违反即失效',
  d.en['gs.otp-telegraph.l6o1'] = 'Truly random, as long as the message, used once — breaking any one destroys it';
  d.zh['gs.otp-telegraph.l6o2'] = '密钥必须由空军运送',
  d.en['gs.otp-telegraph.l6o2'] = 'Keys must be flown by air force';
  d.zh['gs.otp-telegraph.l6o3'] = '密钥必须很长',
  d.en['gs.otp-telegraph.l6o3'] = 'Keys must be very long';
  d.zh['gs.otp-telegraph.l6o4'] = '双方必须互信',
  d.en['gs.otp-telegraph.l6o4'] = 'Both sides must trust each other';
  d.zh['gs.otp-telegraph.e6'] = '苏联人用五位数本二次加密（每次换页不换本）——防住了统计，输给了深度：破译员从重复本中恢复了数千条明文。完美保密是一场「完美执行」的战争。';
  d.en['gs.otp-telegraph.e6'] = 'Soviet pads reused five-digit books with turnover but not replacement — defeating statistics yet losing to depth: cryptanalysts recovered thousands of plaintexts. Perfect secrecy is a war of perfect execution.';
  d.zh['gs.otp-telegraph.l7q'] = '冷战美苏「热线」为什么能把 OTP 变成现实？',
  d.en['gs.otp-telegraph.l7q'] = 'How did the Cold War hotline make OTP practical?';
  d.zh['gs.otp-telegraph.l7o1'] = '通信量极小 + 密钥由外交信使定期递送（一次一换）',
  d.en['gs.otp-telegraph.l7o1'] = 'Tiny traffic plus keys delivered by diplomatic courier and rotated';
  d.zh['gs.otp-telegraph.l7o2'] = '热线是光纤',
  d.en['gs.otp-telegraph.l7o2'] = 'The hotline was fibre';
  d.zh['gs.otp-telegraph.l7o3'] = '双方共享一台计算机',
  d.en['gs.otp-telegraph.l7o3'] = 'They shared a computer';
  d.zh['gs.otp-telegraph.l7o4'] = '热线从不加密',
  d.en['gs.otp-telegraph.l7o4'] = 'The hotline was unencrypted';
  d.zh['gs.otp-telegraph.e7'] = '代价问题：OTP 不是不可用，而是「成本」问题。热线一年只需几十封电文，外交信使的密钥递送完全可行——它是 OTP 原理的现实注脚，也是「越极端越安全」的极致样本。';
  d.en['gs.otp-telegraph.e7'] = 'The issue is cost, not security: the hotline carried a few dozen telegrams a year and courier key drops were entirely feasible — a living footnote to OTP theory, and the extreme case where more extreme means safer.';
})();
