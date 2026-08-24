/* ============================================================
   密码机博物馆 Cipher Machine Museum —— H2 全网独有
   5 台改变历史的密码机：原理动画（CSS/JS）+ 历史 + 参数 + 关联游戏。
   依赖：core/i18n.js + core/i18n-dict.js（文案键 cm.*）+ stories.js/games.js
   ============================================================ */
window.MACHINE_MUSEUM = (function () {
  /* 每台机器：id/名称/图标/服役年代/国别/原理摘要/历史/参数/关联游戏 */
  var MACHINES = [
    {
      id: 'enigma', icon: '⚙️',
      name: { zh: '恩尼格玛 Enigma', en: 'Enigma' },
      era: { zh: '1920s–1945 · 德国', en: '1920s–1945 · Germany' },
      summary: { zh: '转子 + 插线板，加密=解密的奇妙对称；德国最高统帅部信心来源。', en: 'Rotors plus plugboard, with the eerie symmetry that encrypting equals decrypting — the pride of the German high command.' },
      history: { zh: '1918 年谢尔比乌斯申请专利，1926 年起被德国海军采用，随后陆军空军全面列装。盟军破译它需要波兰数学家的早期突破、图灵的 Bombe 与布莱切利园的工业级情报运作——这是「人类vs机器」的第一次大对决。', en: 'Patented by Scherbius in 1918 and adopted by the German Navy from 1926, Enigma spread across all three services. Breaking it demanded Polish mathematical breakthroughs, Turing\'s Bombe, and Bletchley Park\'s industrial intelligence machine — humanity\'s first great duel against a machine cipher.' },
      params: [
        { zh: '转子', en: 'Rotors', v: { zh: '3 个（后期海军 4 个）', en: '3 (4 in naval M4)' } },
        { zh: '密钥空间', en: 'Key space', v: { zh: '约 1.59×10²⁰ 种设置', en: '~1.59×10²⁰ settings' } },
        { zh: '插线板', en: 'Plugboard', v: { zh: '10 对字母互换', en: '10 letter pairs' } }
      ],
      game: 'enigma'
    },
    {
      id: 'bombe', icon: '🔌',
      name: { zh: '炸弹机 Bombe', en: 'Bombe' },
      era: { zh: '1940–1945 · 英国布莱切利园', en: '1940–1945 · Bletchley Park' },
      summary: { zh: '图灵设计、韦尔奇曼加对角线板：用「已知明文」快速筛掉不可能的转子设置。', en: 'Designed by Turing, sped up by Welchman\'s diagonal board: it used "cribs" of known plaintext to eliminate impossible rotor settings fast.' },
      history: { zh: '灵感来自波兰的 Bomba（雷耶夫斯基 1938）。英国的 Bombe 每台重约一吨，布莱切利园最终运行了 200+ 台。对角线板让单次测试从数小时缩到约 20 分钟，把「理论可破」变成「每天可破」。', en: 'Inspired by Poland\'s Bomba (Rejewski, 1938). Each British Bombe weighed about a ton, and Bletchley ran 200+. Welchman\'s diagonal board cut a test from hours to about 20 minutes, turning "breakable in theory" into "broken every day".' },
      params: [
        { zh: '用途', en: 'Purpose', v: { zh: '筛转子设置，非解密机', en: 'Sieves rotor settings, not a decoder' } },
        { zh: '速度', en: 'Speed', v: { zh: '约 20 分钟/测试', en: '~20 min per test' } },
        { zh: '数量', en: 'Count', v: { zh: '全期 200+ 台', en: '200+ built' } }
      ],
      game: 'bombe'
    },
    {
      id: 'm209', icon: '🗜️',
      name: { zh: 'M-209 转轮密码机', en: 'M-209 (Hagelin C-38)' },
      era: { zh: '1942–1960s · 美国', en: '1942–1960s · USA' },
      summary: { zh: '六轮凸轮齿条转轮机：美军的「便携恩尼格玛」，比 Enigma 小巧得多。', en: 'Six cam-and-pin wheels — America\'s "pocket Enigma", far more portable than its German counterpart.' },
      history: { zh: '瑞典工程师哈格林的设计，1942 年美军采用，生产 14 万台，从诺曼底用到越战初期。它的密钥周期约 26 位 × 26 × 26 × 26 × 25 × 23，但实际周期远小于理论值——这为后来的已知明文攻击埋下伏笔。', en: 'Designed by Swedish engineer Boris Hagelin and adopted by the US in 1942, 140,000 units served from Normandy into the early Vietnam era. Its nominal period is huge, but the real cycle is far shorter — a weakness later exploited by known-plaintext attacks.' },
      params: [
        { zh: '轮数', en: 'Wheels', v: { zh: '6 轮凸轮', en: '6 cam wheels' } },
        { zh: '产量', en: 'Built', v: { zh: '约 14 万台', en: '~140,000' } },
        { zh: '尺寸', en: 'Size', v: { zh: '饼干罐大小', en: 'Cracker-tin sized' } }
      ],
      game: 'm209'
    },
    {
      id: 'purple', icon: '🎛️',
      name: { zh: '紫密 Purple', en: 'Purple (Type B)' },
      era: { zh: '1939–1945 · 日本', en: '1939–1945 · Japan' },
      summary: { zh: '六元音路 + 二十辅音路，无转子的步进开关机；美国叫它「紫」。', en: 'Six vowel paths plus twenty consonant paths, no rotors — stepping switches only. The US called it Purple.' },
      history: { zh: '日本人认为它远胜 Enigma：没有转子，原理完全不同。但弗里德曼的 SIS 团队从未见过真机，仅凭拦截电文推演出完整逻辑——先再造算法，再复原机器。1940 年 9 月「魔术」开始持续读取日本外交电报。', en: 'Japan believed Purple was beyond Enigma because it had no rotors. But Friedman\'s SIS never saw the machine — they deduced its full logic from traffic alone, reconstructing the algorithm before the hardware. "Magic" began reading Japan\'s top diplomatic traffic in September 1940.' },
      params: [
        { zh: '结构', en: 'Design', v: { zh: '25 档步进开关 ×2 组', en: '25-step switches ×2 banks' } },
        { zh: '破译方', en: 'Broken by', v: { zh: '美国 SIS（弗里德曼）', en: 'US SIS (Friedman)' } },
        { zh: '意义', en: 'Impact', v: { zh: '持续读取日本外交', en: 'Continuous read of Japanese diplomacy' } }
      ],
      game: 'purple'
    },
    {
      id: 'lorenz', icon: '💾',
      name: { zh: '洛伦兹 SZ40/42（Tunny）', en: 'Lorenz SZ40/42 (Tunny)' },
      era: { zh: '1941–1945 · 德国', en: '1941–1945 · Germany' },
      summary: { zh: '十二轮电传密码机：5 比特博多码流上做异或，比 Enigma 更「现代」。', en: 'Twelve wheels on a 5-bit Baudot teleprinter stream, doing XOR — more modern in concept than Enigma.' },
      history: { zh: '德国最高层用它传输战略级电报。破译它需要「差分统计」（Δ 运算）找规律，而计算量催生了 Colossus——世界第一台可编程电子计算机，每秒处理 5,000 字符。图灵曾赴布莱切利园指导 Tunny 破译，这是电子计算机的隐秘摇篮。', en: 'Germany\'s highest command used it for strategic traffic. Breaking it demanded differencing (Δ) to expose structure, and the compute load gave birth to Colossus — the first programmable electronic computer, 5,000 chars per second. Turing visited Bletchley to advise on Tunny; this was computing\'s secret cradle.' },
      params: [
        { zh: '轮数', en: 'Wheels', v: { zh: '12 轮（χ×5 ψ×5 μ×2）', en: '12 (χ×5 ψ×5 μ×2)' } },
        { zh: '速率', en: 'Speed', v: { zh: '每秒 5 比特组', en: '5 baud' } },
        { zh: '破译工具', en: 'Tool', v: { zh: 'Colossus', en: 'Colossus' } }
      ],
      game: 'lorenz'
    },
    {
      id: 'aes', icon: '🔐',
      name: { zh: 'AES Rijndael', en: 'AES (Rijndael)' },
      era: { zh: '2001– · 比利时设计 / 美国标准', en: '2001– · Belgium / USA' },
      summary: { zh: '当代世界的万能锁：128 位分组、10/12/14 轮，SubBytes-ShiftRows-MixColumns-AddRoundKey 四拍循环——你每天的 HTTPS 都在跑它。', en: 'The universal lock of our era: 128-bit blocks, 10/12/14 rounds cycling SubBytes-ShiftRows-MixColumns-AddRoundKey — every HTTPS connection you make runs it.' },
      history: { zh: '1997 年 NIST 发起公开竞选，比利时密码学家 Daemen 与 Rijmen 的 Rijndael 从 15 个候选中胜出，2001 年成为 FIPS 197。开放设计、全球公开评审——与「保密才有安全」的旧世界彻底分道扬镳；王小云对 SHA-1 的攻击同样证明了公开竞赛的力量（见现代章）。下方动画用示意运算走一遍四拍数据流。', en: 'NIST launched an open competition in 1997; Belgian cryptographers Daemen & Rijmen won with Rijndael among 15 candidates, standardized as FIPS 197 in 2001. Open design, worldwide public review — a clean break from the old "security by secrecy" world; Xiaoyun Wang\'s SHA-1 breaks proved the same power of open contests (see the modern chapter). The animation below walks the four-beat data flow with illustrative ops.' },
      params: [
        { zh: '分组', en: 'Block', v: { zh: '128 位', en: '128 bits' } },
        { zh: '密钥/轮数', en: 'Key/Rounds', v: { zh: '128→10 · 192→12 · 256→14', en: '128→10 · 192→12 · 256→14' } },
        { zh: '结构', en: 'Structure', v: { zh: 'SPN（替换-置换网络）', en: 'SPN (substitution-permutation)' } }
      ],
      game: 'hashlab',
      lab: true
    },
    {
      id: 'des', icon: '💾',
      name: { zh: 'DES 数据加密标准', en: 'DES (Data Encryption Standard)' },
      era: { zh: '1977–2005 · 美国', en: '1977–2005 · USA' },
      summary: { zh: '第一个世界级公开加密标准：56 位密钥统治全球金融二十年——也是被暴力计算正面击碎的第一王座。它的倒下直接催生了公开竞赛选出的 AES。', en: 'The first world-scale public encryption standard: a 56-bit key ruled global finance for two decades — and became the first throne smashed head-on by brute computation. Its fall directly triggered the open competition that crowned AES.' },
      history: { zh: '源自 IBM 的 Lucifer 方案，NSA 参与修订后于 1977 年被 NIST 标准化。学界首次系统研究真实密码的设计（S 盒、差分分析的思想源头），但 56 位密钥始终是心结：1998 年 EFF 用 25 万美元的「Deep Crack」机器 56 小时穷举破译；1999 年与 distributed.net 联手压到 22.5 小时。NIST 随即启动公开竞赛，Rijndael 胜出成为 AES（见上一台）。DES 的真正遗产不是算法本身，而是「密码必须经得起全世界公开攻击」这一范式。', en: 'Born from IBM\'s Lucifer and revised with NSA input, DES was standardized by NIST in 1977. It gave academia the first real cipher to study (S-boxes; the seeds of differential cryptanalysis) — yet the 56-bit key was always the achilles heel: in 1998 EFF\'s $250k "Deep Crack" brute-forced it in 56 hours, and in 1999 with distributed.net in 22.5. NIST then ran the open competition that produced AES (previous exhibit). DES\'s true legacy is not the algorithm but the paradigm: ciphers must survive worldwide open attack.' },
      params: [
        { zh: '密钥', en: 'Key', v: { zh: '56 位（含校验共 64）', en: '56 bits (64 with parity)' } },
        { zh: '分组/轮数', en: 'Block/Rounds', v: { zh: '64 位 / 16 轮 Feistel', en: '64 bits / 16 Feistel rounds' } },
        { zh: '终结者', en: 'Undone by', v: { zh: 'EFF Deep Crack（22.5h · 1999）', en: 'EFF Deep Crack (22.5h, 1999)' } }
      ],
      game: ''
    }
  ];

  return { MACHINES: MACHINES };
})();
