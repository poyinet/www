#!/usr/bin/env node
/* ============================================================
   第四期事故恢复：向恢复版 i18n-dict.js 重放今日全部增量
   1) 追加 Phase A 量子块（era11/c11 标题/5人物/3密件）
   2) 追加 Phase B 东方密件 ×2
   3) 追加 Phase C g.bb84/autokey/hashlab 入口键 zh/en
   4) 计数替换：测验 100→110、编年史成就 11→12 章（zh/en）
   幂等：检测 era11 已存在则跳过追加。
   用法：node tools/oneoff/replay-phase4-dict.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(process.cwd(), 'assets', 'js', 'core', 'i18n-dict.js');
let s = fs.readFileSync(FILE, 'utf8');

/* ---------- (4) 计数替换（先做，幂等安全） ---------- */
s = s.replace(/'quiz\.entrySub': '100 题测出你的段位'/, "'quiz.entrySub': '110 题测出你的段位'");
s = s.replace(/'quiz\.sub': '100 道题 · 4 个段位（入门\/进阶\/专家\/大师）· 每轮随机抽 10 题——答完评出你的「密码学段位」'/, "'quiz.sub': '110 道题 · 4 个段位（入门/进阶/专家/大师）· 每轮随机抽 10 题——答完评出你的「密码学段位」'");
s = s.replace(/'quiz\.entrySub': '100 questions — find your rank'/, "'quiz.entrySub': '110 questions — find your rank'");
s = s.replace(/'quiz\.sub': '100 questions — 4 ranks \(Novice \/ Advanced \/ Expert \/ Master\) — 10 random questions per round — earn your cipher rank'/, "'quiz.sub': '110 questions — 4 ranks (Novice / Advanced / Expert / Master) — 10 random questions per round — earn your cipher rank'");
s = s.replace(/'achv\.call\.d': '读完编年史全部 11 章'/, "'achv.call.d': '读完编年史全部 12 章'");
s = s.replace(/'achv\.call\.d': 'Read all 11 chronicle chapters'/, "'achv.call.d': 'Read all 12 chronicle chapters'");

/* ---------- g.* 入口键（C3/A6，zh 与 en 各插在对应 starflag 行后） ---------- */
if (!s.includes("'g.bb84.t'")) {
  s = s.replace(
    /('g\.starflag\.t': '星条旗密码', 'g\.starflag\.d': '[^']*'),/,
    "$1\n    'g.bb84.t': 'BB84 量子密钥', 'g.bb84.d': '量子密钥分发实战：选基测量光子、筛出共享密钥，抓出留下误码指纹的窃听者 Eve。',\n    'g.autokey.t': '自动密钥', 'g.autokey.d': '维吉尼亚进阶：密钥流由「引子+明文自身」接续生长，解开开头几位，后面的钥匙自己长出来。',\n    'g.hashlab.t': '哈希雪崩实验室', 'g.hashlab.d': '翻转输入的一个比特，看 SHA-256 的 256 位指纹天翻地覆——亲手测量雪崩效应。',"
  );
}
if (!s.includes("'g.bb84.t': 'BB84 Quantum Key'")) {
  s = s.replace(
    /('g\.starflag\.t': 'Star & Stripes', 'g\.starflag\.d': '[\s\S]*?'\),)/,
    "$1\n    'g.bb84.t': 'BB84 Quantum Key', 'g.bb84.d': 'Play Bob in a real BB84 exchange: pick measurement bases, sift the shared key, and catch eavesdropper Eve by her error fingerprint.',\n    'g.autokey.t': 'Autokey', 'g.autokey.d': 'Vigenere grown up: the keystream is primer plus the plaintext itself — solve the first letters and the key grows on its own.',\n    'g.hashlab.t': 'Hash Avalanche Lab', 'g.hashlab.d': 'Flip one bit of the input and watch a SHA-256 fingerprint turn upside down — measure the avalanche yourself.',"
  );
}

/* ---------- (1)(2) 追加大块 ---------- */
const BLOCK = `

/* ============================================================
   第四期 A1-A3：量子时代（第 12 章 · c11）
   era11 + 章节标题/一句话 + 人物 5 位全字段 + 密件 3 件
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['era11'] = '当代 · 量子前沿'; d.en['era11'] = 'Today · Quantum Frontier';
  d.zh['st.c11.t'] = '量子转折点';
  d.en['st.c11.t'] = 'The Quantum Turn';
  d.zh['st.c11.t.one'] = '从 Shor 威胁到后量子迁移：密码学驶入量子时代';
  d.en['st.c11.t.one'] = 'From the Shor threat to post-quantum migration: cryptography enters the quantum age';

  /* ---- 人物 ---- */
  d.zh['stp.wiesner.name'] = '斯蒂芬·威斯纳'; d.en['stp.wiesner.name'] = 'Stephen Wiesner';
  d.zh['stp.wiesner.icon'] = '💵'; d.en['stp.wiesner.icon'] = '💵';
  d.zh['stp.wiesner.role'] = '《共轭编码》作者 · 量子货币与量子密码学的构想者';
  d.en['stp.wiesner.role'] = 'Author of "Conjugate Coding" · visionary of quantum money and quantum cryptography';
  d.zh['stp.wiesner.era'] = '1942–2021 · 美国 / 以色列'; d.en['stp.wiesner.era'] = '1942–2021 · USA / Israel';
  d.zh['stp.wiesner.fact'] = '威斯纳约 1970 年写成的《共轭编码》手稿接连被期刊拒稿，此后沉睡十余年；直到贝内特与布拉萨德把它从故纸堆里翻出来，才催生出 BB84。这篇「史上被拒稿最久的奠基论文」最终于 1983 年发表在一份计算机理论通讯上。';
  d.en['stp.wiesner.fact'] = 'Wiesner\\'s "Conjugate Coding", written around 1970, was rejected by journal after journal and slept for over a decade — until Bennett and Brassard dug it out and BB84 was born. One of the foundational papers of quantum information finally appeared in 1983 in a modest computer-theory newsletter.';
  d.zh['stp.bennett.name'] = '查尔斯·贝内特'; d.en['stp.bennett.name'] = 'Charles Bennett';
  d.zh['stp.bennett.icon'] = '🔬'; d.en['stp.bennett.icon'] = '🔬';
  d.zh['stp.bennett.role'] = 'IBM 量子信息先驱 · BB84 协议共同发明人';
  d.en['stp.bennett.role'] = 'IBM quantum-information pioneer · co-inventor of BB84';
  d.zh['stp.bennett.era'] = '1943– · 美国'; d.en['stp.bennett.era'] = '1943– · USA';
  d.zh['stp.bennett.fact'] = '据两人回忆，BB84 的火种点燃于 1979 年墨西哥城的一场学术会议——贝内特与布拉萨德边游泳边聊起威斯纳的量子钞票，把一个被拒稿的想法聊成了整个量子密码学。后来他还证明了量子远程传态的可行性。';
  d.en['stp.bennett.fact'] = 'By their own telling, the spark of BB84 came at a 1979 conference in Mexico City, where Bennett and Brassard talked about Wiesner\\'s quantum money while swimming — turning a rejected manuscript into a whole field. Bennett later proved quantum teleportation possible.';
  d.zh['stp.brassard.name'] = '吉尔·布拉萨德'; d.en['stp.brassard.name'] = 'Gilles Brassard';
  d.zh['stp.brassard.icon'] = '🃏'; d.en['stp.brassard.icon'] = '🃏';
  d.zh['stp.brassard.role'] = '蒙特利尔大学量子密码学家 · BB84 协议共同发明人';
  d.en['stp.brassard.role'] = 'Université de Montréal cryptologist · co-inventor of BB84';
  d.zh['stp.brassard.era'] = '1955– · 加拿大'; d.en['stp.brassard.era'] = '1955– · Canada';
  d.zh['stp.brassard.fact'] = 'BB84 的名字来自会议年份与人名缩写（Bennett & Brassard, 1984），而那篇开创性论文当年只是在印度班加罗尔一个小型分会场上宣读的一页摘要——如今它被公认为量子密码学的出生证明。';
  d.en['stp.brassard.fact'] = 'BB84 is simply "Bennett & Brassard, 1984" — and the founding paper was a one-page abstract read at a small session of an IEEE conference in Bangalore, India. Today it is recognized as the birth certificate of quantum cryptography.';
  d.zh['stp.shor.name'] = '彼得·秀尔'; d.en['stp.shor.name'] = 'Peter Shor';
  d.zh['stp.shor.icon'] = '⚡'; d.en['stp.shor.icon'] = '⚡';
  d.zh['stp.shor.role'] = 'Shor 算法发明人 · 敲响公钥密码警钟的数学家';
  d.en['stp.shor.role'] = "Inventor of Shor's algorithm · the mathematician who rang the alarm for public-key crypto";
  d.zh['stp.shor.era'] = '1959– · 美国'; d.en['stp.shor.era'] = '1959– · USA';
  d.zh['stp.shor.fact'] = '1994 年秀尔在贝尔实验室的一次研讨会上公布算法后，消息几天内就传遍各大实验室与安全机构——RSA 的根基「大数分解」在量子计算机面前竟有多项式时间解法。那是密码学界第一次集体意识到：量子力学也可能是密码的掘墓人。';
  d.en['stp.shor.fact'] = 'When Shor presented his algorithm at a Bell Labs seminar in 1994, word reached labs and security agencies within days: factoring — RSA\\'s very foundation — had a polynomial-time quantum solution. Cryptography collectively realized quantum mechanics could be the gravedigger as well as the guardian.';
  d.zh['stp.grover.name'] = '洛夫·格罗弗'; d.en['stp.grover.name'] = 'Lov Grover';
  d.zh['stp.grover.icon'] = '🔎'; d.en['stp.grover.icon'] = '🔎';
  d.zh['stp.grover.role'] = 'Grover 搜索算法发明人 · 对称密钥长度的「减半者」';
  d.en['stp.grover.role'] = "Inventor of Grover's search algorithm · the halver of symmetric key strength";
  d.zh['stp.grover.era'] = '1961– · 美国'; d.en['stp.grover.era'] = '1961– · USA';
  d.zh['stp.grover.fact'] = '格罗弗算法只能把暴力搜索从 N 步降到约 √N 步——听起来吓人，对策却简单：密钥加倍即可。AES-256 因此在量子时代依然稳坐钓鱼台；真正被 Shor 算法「处决」的，只有依赖数论结构的公钥家族。';
  d.en['stp.grover.fact'] = "Grover's algorithm only speeds brute force from N steps to about √N — scary, but the fix is easy: double the key. AES-256 remains comfortable in the quantum era; what Shor truly condemns is the number-theoretic public-key family.";

  /* ---- 密件 ---- */
  d.zh['sta.qmoney.name'] = '量子钞票备忘'; d.en['sta.qmoney.name'] = 'Quantum Money Memo';
  d.zh['sta.qmoney.icon'] = '💵'; d.en['sta.qmoney.icon'] = '💵';
  d.zh['sta.qmoney.era'] = '约 1970 · 美国'; d.en['sta.qmoney.era'] = 'c. 1970 · USA';
  d.zh['sta.qmoney.desc'] = '斯蒂芬·威斯纳《共轭编码》手稿的核心构想：用无法被克隆的量子态印制钞票，伪币制造者一旦测量就会破坏原态而暴露。稿件尘封十余年，却孕育了 BB84 与整个量子密码学。以下为构想要点的史料化节选。';
  d.en['sta.qmoney.desc'] = 'The core idea of Stephen Wiesner\\'s "Conjugate Coding" memo: print banknotes with quantum states that cannot be cloned — any counterfeiter who measures them disturbs the original state and gives himself away. The memo slept for a decade yet seeded BB84 and all of quantum cryptography. Below, a dramatized excerpt of its key idea.';
  d.zh['sta.bb84paper.name'] = 'BB84 会议摘要'; d.en['sta.bb84paper.name'] = 'The BB84 Abstract';
  d.zh['sta.bb84paper.icon'] = '📄'; d.en['sta.bb84paper.icon'] = '📄';
  d.zh['sta.bb84paper.era'] = '1984 · 印度班加罗尔'; d.en['sta.bb84paper.era'] = '1984 · Bangalore, India';
  d.zh['sta.bb84paper.desc'] = '贝内特与布拉萨德在 IEEE 国际会议系统科学分会发表的页摘要：首次给出实用的量子密钥分发协议——以光子偏振为骰子、以测不准原理为锁，窃听必然留下扰动指纹。量子密码学就此诞生。';
  d.en['sta.bb84paper.desc'] = 'Bennett and Brassard\\'s one-page abstract at an IEEE conference session in Bangalore: the first practical quantum key distribution protocol — photons as dice, the uncertainty principle as the lock, eavesdropping betrayed by its own disturbance. Quantum cryptography was born here.';
  d.zh['sta.pqc2024.name'] = 'FIPS 203 标准公告'; d.en['sta.pqc2024.name'] = 'FIPS 203 Announcement';
  d.zh['sta.pqc2024.icon'] = '🛡️'; d.en['sta.pqc2024.icon'] = '🛡️';
  d.zh['sta.pqc2024.era'] = '2024 · 美国马里兰州（NIST）'; d.en['sta.pqc2024.era'] = '2024 · Maryland, USA (NIST)';
  d.zh['sta.pqc2024.desc'] = '2024 年 8 月 13 日，美国国家标准与技术研究院正式发布首批后量子密码标准：FIPS 203（ML-KEM，基于 Kyber）、204（ML-DSA）与 205（SLH-DSA）。面对「先截获、后解密」的量子倒计时，全球互联网开始了一场静悄悄的换锁迁移。本卡片为公告的史料化演绎。';
  d.en['sta.pqc2024.desc'] = 'On August 13, 2024, NIST published the first post-quantum cryptography standards: FIPS 203 (ML-KEM, based on Kyber), 204 (ML-DSA) and 205 (SLH-DSA). Facing the "harvest now, decrypt later" countdown, the world\\'s networks began a quiet migration to new locks. This card dramatizes the announcement.';
})();

/* ============================================================
   第四期 B5：东方密码密件 ×2（字验 / 反切码）
   ============================================================ */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['sta.ziyan.name'] = '字验军符册'; d.en['sta.ziyan.name'] = 'Ziyan Field Manual';
  d.zh['sta.ziyan.icon'] = '📜'; d.en['sta.ziyan.icon'] = '📜';
  d.zh['sta.ziyan.era'] = '1044 · 北宋'; d.en['sta.ziyan.era'] = '1044 · Northern Song';
  d.zh['sta.ziyan.desc'] = '《武经总要》前集所载「字验」：选一首四十字的五言诗为底本，以主将临时分发的钥字定诗中一字，其位次对应「请弓」「请粮」「被贼围」等四十项军情之一。钥字逐日更换，码本随之而换——千年前的「日密钥」实践。以下为依原制重构的一页。';
  d.en['sta.ziyan.desc'] = 'The "ziyan" method in the Wujing Zongyao (1044): choose a forty-character poem as the base; a key character issued daily by the general selects one position, which maps to one of forty pre-agreed tactical reports such as "request arrows" or "besieged". Change the key character and the whole encoding changes — a thousand-year-old daily-key practice. Below, one page reconstructed from the original system.';
  d.zh['sta.fanqie.name'] = '反切码注本'; d.en['sta.fanqie.name'] = 'Fanqie Code Notebook';
  d.zh['sta.fanqie.icon'] = '🗡️'; d.en['sta.fanqie.icon'] = '🗡️';
  d.zh['sta.fanqie.era'] = '1560 年代 · 明'; d.en['sta.fanqie.era'] = '1560s · Ming Dynasty';
  d.zh['sta.fanqie.desc'] = '戚继光《纪效新书》所载反切码：取两首诗词，「重唱诗」取二十声母、「合声诗」取四十字韵母，声韵两两交叉得八百音码，再配以金鼓旗号传递——将本土音韵学化作军中密码。以下为依原法重构的编码页。';
  d.en['sta.fanqie.desc'] = 'The fanqie code in Qi Jiguang\\'s Jixiao Xinshu: take two poems — twenty initials from one, forty finals from the other — cross twenty initials with forty finals to form eight hundred sound-codes, then signal them by gongs, drums and flags, turning phonology into an army cipher. Below, one page reconstructed from the original method.';
})();
`;

if (!s.includes("d.zh['era11']")) {
  s += BLOCK;
  console.log('appended Phase A/B dict blocks');
} else {
  console.log('blocks already present, skip append');
}

fs.writeFileSync(FILE, s, 'utf8');
console.log('replay done');
