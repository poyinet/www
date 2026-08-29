/* ============================================================
   协议实验室（第七期）：TLS 握手 · DH 中间人 · Merkle 树/区块链
   · 零知识证明 · ECC 点加法 · 口令破解成本计算器
   结构仿 machine.js：window.PROTOCOL_LAB 数据 + 页面渲染；
   全部交互本地运行，玩具参数教学示意。
   ============================================================ */
window.PROTOCOL_LAB = (function () {
  var L = null; /* 渲染语言标记，由页面注入 */

  /* ---------- 工具 ---------- */
  function H(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((((h << 5) + h) >>> 0) + s.charCodeAt(i)) >>> 0;
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function modPow(b, e, m) {
    var out = 1;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) out = (out * b) % m;
      b = (b * b) % m;
      e >>= 1;
    }
    return out;
  }

  var LAB = {
    H: H, modPow: modPow,
    /* 六个演示的静态双语元数据 */
    META: [
      { id: 'tls', icon: '🤝', name: { zh: 'TLS 握手', en: 'TLS Handshake' } },
      { id: 'dh', icon: '🕵️', name: { zh: 'DH 中间人', en: 'DH Man-in-the-Middle' } },
      { id: 'merkle', icon: '🌳', name: { zh: 'Merkle 树与区块链', en: 'Merkle Tree & Blockchain' } },
      { id: 'zkp', icon: '🎭', name: { zh: '零知识证明', en: 'Zero-Knowledge Proof' } },
      { id: 'chacha', icon: '🌀', name: { zh: 'ChaCha20', en: 'ChaCha20' } },
      { id: 'ecc', icon: '📈', name: { zh: 'ECC 点加法', en: 'ECC Point Addition' } },
      { id: 'a51', icon: '📡', name: { zh: 'A5/1 流密码', en: 'A5/1 Stream Cipher' } },
      { id: 'rc4', icon: '🧨', name: { zh: 'RC4 警示录', en: 'RC4 Cautionary Tale' } },
      { id: 'sign', icon: '✍️', name: { zh: '数字签名', en: 'Digital Signatures' } },
      { id: 'math', icon: '∑', name: { zh: '数论小课堂', en: 'Number Theory 101' } },
      { id: 'diff', icon: '🎯', name: { zh: '差分分析', en: 'Differential Analysis' } },
      { id: 'aead', icon: '🛡️', name: { zh: '认证加密', en: 'Authenticated Encryption' } },
      { id: 'ext', icon: '🧟', name: { zh: '长度扩展攻击', en: 'Length Extension' } },
      { id: 'big', icon: '🐘', name: { zh: '真实大数 RSA', en: 'Real-Bignum RSA' } },
      { id: 'rng', icon: '🎲', name: { zh: '随机数', en: 'Randomness' } },
      { id: 'pwd', icon: '⏳', name: { zh: '口令破解成本', en: 'Password Cracking Cost' } },
      { id: 'otp', icon: '📨', name: { zh: 'OTP 与复用灾难', en: 'OTP Reuse Disaster' } },
      { id: 'dhpt', icon: '🧮', name: { zh: 'DH 参数验证', en: 'DH Parameter Validation' } }
,
      { id: 'hashchain', icon: '🔗', name: { zh: '哈希链', en: 'Hash Chain' } },
      { id: 'rsadict', icon: '📕', name: { zh: '教科书 RSA', en: 'Textbook RSA' } }
    ],
    /* 协议页按钮英文映射（静态 HTML 按钮默认中文，init 时按语言替换） */
    btns: {
      'tls-next': 'Next step',
      'tls-eve': '🕵️ MITM on',
      'dh-run': '🎲 Re-run',
      'dh-eve': '🕵️ Eve in',
      'chain-tamper': '⚡ Tamper block 2',
      'chain-restore': '↺ Restore',
      'zkp-round': '🎲 Round (commit → pick edge → answer)',
      'zkp-reset': '↺ Reset coloring',
      'cc-step': '▶ Step',
      'cc-reset': '↺ Reset state',
      'ecc-add': 'P+Q',
      'ecc-clear': '↺ Clear points',
      'a51-step': '▶ Step (vote → clock → 1 bit)',
      'a51-fast': '⏩ 100 steps',
      'a51-reset': '🎲 Random reset',
      'rc4-run': '🔒 Same IV, two messages',
      'rc4-reset': '↺ Clear',
      'sign-do': '✍️ Sign with private key',
      'sign-tamper': '🕵️ Eve tampers one digit',
      'sign-verify': '✅ Bob verifies',
      'rng-gen': '🔑 Key from "time seed"',
      'rng-crack': '💥 Brute-force the seed',
      'aead-raw': '🧨 Raw encryption',
      'aead-etm': '🛡️ Encrypt-then-MAC',
      'aead-flip': '🔄 Flip one ciphertext bit',
      'ext-gen': '🔑 Generate secret-prefix MAC',
      'ext-forge': '💥 Forge &admin=true',
      'ext-verify': '🧪 Server verification',
      'big-gen': '⚙️ Generate 256-bit keypair',
      'otp-key': '🎲 New key',
      'otp-pair': '📋 Another pair',
      'otp-drag': '🎯 Drag a crib',
      'otp-solve': '🙈 Show answers',
      'dhpt-run': '🔍 Validate',
      'hc-next': '▶ Reveal next link',
      'hc-replay': '🔁 Replay last value',
      'hc-forge': '🔧 Guess one char off',
      'hc-reset': '↺ New chain',
      'rd-enc': '🔒 Textbook encrypt',
      'rd-dict': '💥 Dict attack (interval)',
      'rd-rand': '🎲 Randomized pad ×2',
      'rd-brutec': '💥 Enumerate all (4544)',


    },
    /* pl-extend 跨链英文（仅 en 模式替换） */
    linkL10n: {
      '📜 相关编年史章节': '📜 Related chronicle',
      '🎯 测验场': '🎯 Quiz',
      '📖 密码学词典': '📖 Glossary',
      '📜 量子转折点': '📜 The Quantum Pivot',
      '📨 OTP 电报房（游戏）': '📨 OTP Telegraph (game)',
      '🔑 DH 握手场（游戏）': '🔑 DH Handshake (game)',
      '📟 TOTP 验证器（游戏）': '📟 TOTP Verifier (game)',
      '🕶️ 盲签密约（游戏）': '🕶️ Blind Signature (game)',
    },
    /* 协议页导航锚点 en */
    navL10n: {
      '🤝 TLS': '🤝 TLS',
      '🔑 DH': '🔑 DH',
      '🌳 Merkle': '🌳 Merkle',
      '🎭 ZKP': '🎭 ZKP',
      '🌀 ChaCha20': '🌀 ChaCha20',
      '📈 ECC': '📈 ECC',
      '📡 A5/1': '📡 A5/1',
      '🧨 RC4': '🧨 RC4',
      '✍️ 签名': '✍️ Signatures',
      '🎲 随机数': '🎲 Randomness',
      '∑ 数论': '∑ Number Theory',
      '🎯 差分': '🎯 Differentials',
      '🛡️ AEAD': '🛡️ AEAD',
      '🧟 长度扩展': '🧟 Length Extension',
      '🐘 大数': '🐘 Big RSA',
      '⏳ 口令成本': '⏳ Password Cost',
      '📨 OTP': '📨 OTP',
      '🧮 DH 参数': '🧮 DH Params',
      '🔗 哈希链': '🔗 Hash Chain',
      '📕 RSA': '📕 Textbook RSA',
    },
    /* 「📚 参考：」前缀 en */
    srcL10n: { "📚 参考：": "📚 Sources: " },
    /* pwd 卡 label en */
    labelL10n: { "算法": "Algorithm", "攻击装备": "Attack rig", "长度": "Length" },



    /* ================= OTP 与复用灾难 ================= */
    otpPairs: [
      { m1: 'ATTACK AT DAWN', m2: 'BRIDGE IS MINE' },
      { m1: 'MEETING AT NOON', m2: 'CANCEL THE MEET' },
      { m1: 'FLEET MOVES EAST', m2: 'FLEET STAYS EAST' }
    ],
    otpIntro: {
      zh: '1917 年 AT&T 的 Gilbert Vernam 把电传打字电报与随机密钥流异或，发明了一次一密；1949 年 Shannon 证明：密钥真随机且绝不重复时，密文对攻击者不泄露任何信息——「完美保密」。但全部安全性只压在一个词上：一次。1942–46 年苏联 KGB/GRU 向多个站点重复发放同一批密码本页，1943 年起美国 Venona 项目靠「密钥复用 + crib 拖拽」破译了约 3000 条谍报电报。本演示：让两条消息共用同一条密钥，看密钥如何被抵消成白给。提示：永远从空格猜起（英文文本 0x20 最高发），再把猜出的词当作新的 crib 滚雪球。',
      en: 'In 1917, AT&T\'s Gilbert Vernam XORed teleprinter text with a random keystream — the one-time pad. In 1949 Shannon proved that with a truly random, never-reused key the ciphertext leaks nothing: "perfect secrecy". All of it rides on one word: ONE-time. In 1942–46 the Soviet KGB/GRU re-issued the same pad pages to multiple stations; starting 1943 the US Venona project exploited those reuses with crib dragging and partially decrypted ~3,000 coded messages. This demo: run two messages under the same key and watch the key cancel itself. Tip: always start from spaces (0x20 is the most frequent byte in English text), then snowball each recovered word into the next crib.'
    },
    otpNote: {
      zh: '为什么「复用」直接泄底？C1 ⊕ C2 =（M1 ⊕ K）⊕（M2 ⊕ K）= M1 ⊕ M2——密钥完好无损地从算式中消失。剩下的是两份明文互相异或：它像一张叠影底片，你只需要猜中一条明文里的一句话，另一条的高余对应段立刻露出来。这就是 Venona 破译员的日常：从俄语电报的固定套路（问候语、日期、代号）入手，把「叠影」一片片刮亮。',
      en: 'Why does reuse leak everything? C1 ⊕ C2 = (M1 ⊕ K) ⊕ (M2 ⊕ K) = M1 ⊕ M2 — the key vanishes from the algebra untouched. What remains is the two plaintexts XORed together: a double-exposure where guessing one phrase in either message instantly exposes the other side of the sandwich. That was the Venona cryptanalyst\'s daily bread: start from the fixed rituals of Russian cable traffic (greetings, dates, code names) and scrape the overlay clean.'
    },

    /* ================= DH 参数验证 ================= */
    dhpIntro: {
      zh: 'DH 的安全不仅看 p 够不够大。g = 1 时共享密钥恒为 1（参数混入攻击）；p 不是安全素数时，小阶子群攻击能把秘密旋进小圈子。本演示真的在做三件事：p 素性、安全素数（p = 2q+1 且 q 素）、g 的阶恰为 p−1（真生成元）。全部通过，才是「可验证参数」（RFC 7919 的 FFDHE 命名组就是经过这种验证后固化的）。',
      en: 'DH security is not just about a big p. With g = 1 the shared secret is always 1 (parameter-mixing); with a non-safe prime, small-subgroup attacks trap secrets in tiny circles. This demo really does three checks: p primality, safe-prime property (p = 2q+1 with q prime), and whether the order of g is exactly p−1 (a true generator). Pass all three and the parameters are "validated" — RFC 7919 FFDHE named groups were hardened exactly this way.'
    },

    /* ================= 哈希链（Lamport 一次性口令） ================= */
    hcIntro: {
      zh: '1981 年 Leslie Lamport 提出用哈希链做一次性口令：服务器只存链顶值，用户每次出示上一环，服务器验证 H(上一环) = 当前持有值后向前推进一格。每一环都不同，密钥从不重复；截获任何一环只能用到一次，且无法倒推出下一环（单向性）。本演示运行真实迭代哈希——玩具 32 位仅供教学，真实为 256 位。',
      en: 'In 1981 Leslie Lamport proposed one-time passwords from a hash chain: the server keeps only the top of the chain; each time the user reveals the previous link, the server checks H(prev) = current and advances one step. Every link is unique, so no key is ever reused; intercepting any link buys exactly one use, never the next (one-wayness). This demo runs real iterated hashing — a toy 32-bit function for teaching, 256 bits in reality.'
    },
    hcNote: {
      zh: '📌 一轮交互里看三件事：① 按顺序出示的每一环都一次通过；② 重放已用过的值立刻被拒（H(x) 永远不是 x）；③ 改一个字符再出示，哈希天翻地覆——服务器直接拒绝。安全根基：单向性。现代替代是 HOTP/TOTP（RFC 4226/6238）：HMAC 把「计数/时间」变成一次性密钥，服务器只需保存共享密钥、无需存链。Lamport 链今天仍活在证书透明性（RFC 6962 的 Merkle 树即哈希链树）与时间戳链一类场合。',
      en: '📌 Watch three things in one round: ① each link in order is accepted; ② replaying a used value is rejected instantly (H(x) is never x); ③ changing one character scrambles the hash — rejected. Root of security: one-wayness. Modern replacements are HOTP/TOTP (RFC 4226/6238): HMAC turns a counter/time into a one-time key, so the server keeps a shared key instead of a chain. Lamport chains still live in certificate transparency (RFC 6962 Merkle trees are hash-chain trees) and timestamp chains.'
    },

    /* ================= 教科书 RSA：字典攻击与语义安全 ================= */
    rdIntro: {
      zh: '教科书 RSA：c = m^e mod n。它可解、可逆、数学全对——却有一个致命特性：确定性。同一明文每次都得到同一密文，于是攻方只要知道明文空间（订单号、证件尾号），就能把每个候选加密一遍对拍——字典攻击。1982 年 Goldwasser 与 Micali 把问题形式化：加密必须是概率性的，这就是「语义安全」的起点；1994 年 Bellare–Rogaway 的 OAEP 把 RSA 变成随机填充，成为今日标准姿势（PKCS #1 v2.2，RFC 8017）。本演示：真实模幂，n = 97×113 = 10961（玩具）。',
      en: 'Textbook RSA: c = m^e mod n. Solvable, reversible, mathematically fine — with one fatal property: deterministic. The same plaintext yields the same ciphertext every time, so anyone who knows the plaintext space (order numbers, ID tails) can encrypt every candidate and match — a dictionary attack. In 1982 Goldwasser and Micali formalized the fix: encryption must be probabilistic — the origin of semantic security. Bellare–Rogaway’s OAEP (1994) made RSA randomized; that is the standard posture today (PKCS #1 v2.2, RFC 8017). This demo: real modular exponentiation, n = 97×113 = 10961 (toy).'
    },
    rdNote: {
      zh: '📌 三步对照：① 教科书加密后字典攻击直接命中——m 在区间内被还原；② 随机填充版：同一明文两次加密得到不同密文（确定性被打破）；③ 全空间枚举演示：填了随机值也照样破——因为玩具模数只有 14 位。这就是现实世界必须 2048 位模数 + OAEP 随机填充的原因。教训：数学正确只是起点，安全性质（语义安全）才是终点——就连 RSA 解密实现也曾在 1998 年被 Bleichenbacher 的填充预言攻击击中。',
      en: '📌 Three contrasts: ① textbook encryption falls to the dictionary attack — m is recovered from the interval; ② with random padding the same m encrypts to different ciphertexts (determinism broken); ③ full-space enumeration still works because the toy modulus is only 14 bits — exactly why the real world needs 2048-bit moduli with OAEP padding. Lesson: mathematical correctness is only the start; security properties (semantic security) are the goal. Even RSA decryption itself was hit by Bleichenbacher’s padding-oracle attack in 1998.'
    },
    dhpPresets: [
      { p: 23, g: 5, tag: '23 / 5' },
      { p: 47, g: 5, tag: '47 / 5' },
      { p: 59, g: 2, tag: '59 / 2' },
      { p: 1009, g: 11, tag: '1009 / 11' }
    ],
    dhpNote: {
      zh: '📌 试试教材外的两组：1009 / 11 会连环翻车（(1009−1)/2 不是素数、11 的阶不足 p−1）——这正是「参数混入攻击」与「小阶子群攻击」的猎物。现实世界：TLS 1.3 的 ECDHE 与 RFC 7919 的 FFDHE 命名组都是先验证、后固化；X25519 甚至绕过了「g 的阶」问题（曲线阶与基点为规范固定值）。',
      en: '📌 Try the extra pair 1009 / 11: it fails on several counts ((1009−1)/2 is not prime; the order of 11 is short) — precisely the prey of parameter-mixing and small-subgroup attacks. In the real world, TLS 1.3 ECDHE and RFC 7919 FFDHE named groups are validated then frozen; X25519 even sidesteps the whole order question with canonical, standardised curve and base point.'
    },

    /* ================= RC4 历史警示 ================= */
    rc4Intro: {
      zh: 'RC4 曾加密过 WEP Wi-Fi 与半个互联网的 TLS 流量——却在 2015 年被 RFC 7465 全面禁用。死因有二：WEP 死于 IV 可预测导致的「密钥流重用」；TLS 中的 RC4 则死于输出统计偏置（FMS 2001 → RC4 NOMORE 2015），终被 RFC 7465 全面禁用。共同教训：本演示用真实 RC4（KSA+PRGA）复现 WEP 式灾难：固定密钥、只换 3 字节 IV，窃听者无需密钥就能读出两段明文的异或关系。',
      en: 'RC4 once encrypted WEP Wi-Fi and half the internet\'s TLS traffic — until RFC 7465 banned it outright in 2015. It died twice over: WEP fell to predictable-IV keystream reuse, while TLS RC4 was banned for output biases (FMS 2001 → RC4 NOMORE 2015, RFC 7465). Shared lesson: This demo reproduces the WEP-style disaster with REAL RC4 (KSA+PRGA): fixed key, only a 3-byte IV changes — and an eavesdropper reads the XOR of two plaintexts without any key.'
    },

    /* ================= ChaCha20 quarter-round ================= */
    chachaIntro: {
      zh: 'ChaCha20 把 4×4 的 32 位字状态搅 20 轮：每轮先对四列、再对四条对角线各跑一次 quarter-round——八条指令（加法、异或、循环移位交替），现代 CPU 上快得飞起，且常数时间无查表侧信道。单步走一遍双轮的 64 条操作，亲眼看雪崩扩散。',
      en: 'ChaCha20 churns a 4×4 state of 32-bit words for 20 rounds: each round runs a quarter-round over the four columns then the four diagonals — eight instructions alternating add, XOR and rotation. Blazing fast on modern CPUs and constant-time with no table lookups. Single-step all 96 ops of one double round and watch the avalanche.'
    },

    /* ================= A5/1 ================= */
    a51Intro: {
      zh: 'GSM 手机的通话加密：三个不同长度的 LFSR（19/22/23 位）靠「少数服从多数」钟控——多数位决定谁走谁留，输出位是三个最高位的异或。简单、硬件便宜，却在 2009 年被 Karsten Nohl 用彩虹表实测攻破：如今它只活在教科书里。单步看多数投票与密钥流诞生。',
      en: 'GSM call encryption: three LFSRs (19/22/23 bits) clocked by majority vote — the majority clock-bit decides who steps, and each output bit is the XOR of three top cells. Cheap in hardware, broken in practice by Karsten Nohl\'s rainbow tables (2009). Today it lives only in textbooks. Step through the voting and the keystream.'
    },

    /* ================= ① TLS 握手 ================= */
    tlsSteps: function () {
      return [
        { from: 'C', to: 'S', tag: { zh: 'ClientHello（明文）', en: 'ClientHello (plaintext)' },
          txt: { zh: '客户端发出：客户端随机数 + 支持的密码套件列表 + SNI。此刻还没有任何秘密。', en: 'Client sends: random nonce + supported cipher suites + SNI. No secret exists yet.' } },
        { from: 'S', to: 'C', tag: { zh: 'ServerHello + 证书（明文）', en: 'ServerHello + Certificate (plaintext)' },
          txt: { zh: '服务器回应：服务器随机数 + 选定套件 + 证书——证书里是服务器公钥，由 CA 用自己的私钥签名。', en: 'Server replies: server nonce + chosen suite + certificate — containing the server public key, signed by a CA private key.' } },
        { from: 'C', to: 'S', tag: { zh: '验证证书 → 密钥交换（密文）', en: 'Verify cert → Key exchange (encrypted)' },
          txt: { zh: '客户端沿 CA 链验证证书真伪；通过后生成预主密钥，用服务器公钥加密发送。只有持有对应私钥的真服务器能解开。', en: 'The client validates the chain; then encrypts a pre-master secret with the server public key. Only the true holder of the private key can decrypt it.' } },
        { from: 'L', to: 'L', tag: { zh: '双方导出会话密钥（本地）', en: 'Both derive session keys (local)' },
          txt: { zh: '两端各自用「预主密钥 + 两个随机数」推导出同一组对称会话密钥——它从不在线路上出现。', en: 'Both sides derive identical symmetric session keys from the pre-master secret and both nonces — the keys themselves never travel.' } },
        { from: 'C', to: 'S', tag: { zh: 'Finished（加密）', en: 'Finished (encrypted)' },
          txt: { zh: '客户端把此前全部握手消息的摘要用会话密钥加密发回——篡改过握手的中间人无法伪造它。', en: 'A MAC of the whole handshake, encrypted with the session key — a tampering MITM cannot forge it.' } },
        { from: 'S', to: 'C', tag: { zh: 'Finished ✓ 应用数据（加密）', en: 'Finished ✓ App data (encrypted)' },
          txt: { zh: '服务器同样回验，握手完成。此后所有 HTTP 内容都在对称加密之下。', en: 'The server verifies back; handshake complete. All further traffic rides under symmetric encryption.' } }
      ];
    },
    tlsEve: {
      zh: '🕵️ 中间人视角：第 1–2 步是明文，Eve 可以看也可以改——但她在第 3 步会露馅：没有 CA 私钥就造不出可信证书，客户端验证证书链失败并报警断连。这就是「HTTPS 能防中间人」的全部根基：不是保密了握手，而是认证了身份。',
      en: '🕵️ MITM view: steps 1–2 are plaintext — Eve can read and even modify them. But she trips at step 3: without the CA private key she cannot forge a trusted certificate, so chain verification fails and the client aborts. That is the entire foundation of HTTPS anti-MITM: not hiding the handshake, authenticating identity.'
    },

    /* ================= ② DH 中间人 ================= */
    dhParams: { p: 23, g: 5 },

    /* ================= ③ Merkle 树与区块链 ================= */
    merkleLeaves: ['TX-A 5 coins', 'TX-B 2 coins', 'TX-C 1 coin', 'TX-D 7 coins'],
    chainSeed: [
      { data: { zh: '区块 1 · 创世区块', en: 'Block 1 · Genesis' }, prev: '00000000' },
      { data: { zh: '区块 2 · Alice→Bob 转账', en: 'Block 2 · Alice→Bob transfer' }, prev: '' },
      { data: { zh: '区块 3 · Bob→Carol 转账', en: 'Block 3 · Bob→Carol transfer' }, prev: '' }
    ],
    merkleNote: {
      zh: '改动任何一片叶子（哪怕一个字母），它的哈希立刻变，并且一路向上传染到树根——Merkle 根就是整组数据的指纹。',
      en: 'Change any single leaf (even one letter) and its hash flips, cascading up to the root — the Merkle root is the fingerprint of the whole set.'
    },
    chainNote: {
      zh: '区块链 = 用「前块哈希」串起来的链。篡改第 2 块的数据，它的哈希变红、第 3 块记录的 prev 对不上而断裂——攻击者想改旧账，就必须重算其后所有区块，这正是「不可篡改」的机械原理。',
      en: 'A blockchain is a chain glued by previous-block hashes. Tamper with block 2: its own hash turns red and block 3 recorded prev no longer matches — rewriting history means recomputing every later block. That is the mechanical meaning of immutability.'
    },

    /* ================= ④ 零知识证明（三色图） ================= */
    zkpNodes: [
      { id: 'A', x: 70, y: 42 }, { id: 'B', x: 230, y: 42 },
      { id: 'C', x: 40, y: 178 }, { id: 'D', x: 260, y: 178 },
      { id: 'E', x: 150, y: 112 }
    ],
    zkpEdges: [['A', 'B'], ['B', 'D'], ['D', 'C'], ['C', 'A'], ['A', 'E'], ['B', 'E'], ['C', 'E'], ['D', 'E']],
    zkpBase: { A: 1, B: 2, C: 2, D: 1, E: 0 },   /* 合法三着色（同三角内互异） */
    zkpColors: ['#ff2d95', '#39ff14', '#ffe600'],
    zkpNames: [{ zh: '品红', en: 'magenta' }, { zh: '绿', en: 'green' }, { zh: '黄', en: 'yellow' }],
    zkpIntro: {
      zh: '证明者宣称自己知道这张图的合法三着色，但不想泄露它。协议：每轮把三种颜色随机改名（承诺）→ 验证者随机挑一条边 → 只揭开这条边两端（应答）。端点永远异色 ⇒ 通过；每轮换名 ⇒ 验证者拼不出完整着色。重复 n 轮，作弊被识破的概率指数上升，而「知识」零泄露。',
      en: 'Prover claims knowledge of a valid 3-coloring without revealing it. Each round: randomly rename the three colors (commit) → verifier picks a random edge → only those two ends are revealed (response). Ends always differ ⇒ pass; renaming every round ⇒ the verifier cannot assemble the full coloring. After n rounds cheating gets exponentially unlikely while zero knowledge leaks.'
    },

    /* ================= ⑤ ECC 点加法 ================= */
    eccDefault: { a: -7, b: 10 },
    eccIntro: {
      zh: '椭圆曲线 y² = x³ + ax + b 上定义一种「加法」：两点连线延长交曲线于第三点，其关于 x 轴的镜像即为「和」。已知一端与和，反推另一端——数学上没有高效算法。ECC 的安全性就藏在这条几何规则里（演示为实数域示意，真实曲线在有限域上）。',
      en: 'On y² = x³ + ax + b, "addition" is geometric: the chord through two points meets the curve at a third; mirroring it across the x-axis gives the sum. Recovering either input from the other plus the sum has no efficient algorithm — that is where ECC security lives (real-domain sketch here; real curves live over finite fields).'
    },

    /* ================= ∑ 数论小课堂 ================= */
    mathIntro: {
      zh: '公钥密码的全部数学压在三块基石上：费马小定理（a^(p−1) ≡ 1 mod p，素数的指纹，RSA/素性测试的根）· 欧拉函数 φ(n)（≤n 且与 n 互素的个数，RSA 的 φ=(p−1)(q−1)）· 原根（g 的幂跑遍整个乘法群，DH 的 g=5 就是 23 的原根）。下方全部可交互验证；卡迈克尔数 561 会伪装成素数骗过费马测试——所以真实世界用 Miller-Rabin。',
      en: 'All public-key math rests on three stones: Fermat\'s little theorem (a^(p−1) ≡ 1 mod p — a prime fingerprint, root of RSA and primality testing) · Euler\'s totient φ(n) (count of coprimes ≤ n; RSA\'s φ=(p−1)(q−1)) · primitive roots (powers of g sweep the whole group; DH\'s g=5 is one for 23). Verify interactively below; Carmichael number 561 fools the Fermat test — hence Miller-Rabin in the real world.'
    },

    /* ================= 🎯 差分分析 ================= */
    diffIntro: {
      zh: '现代密码分析的核心思想：不看单个输入，看「输入差分」如何影响「输出差分」。下方是 PRESENT 轻量级密码真实在用的 4-bit S 盒——活算它的 16×16 差分分布表：选一个输入差分 Δx，若某输出差分 Δy 的计数明显偏高，攻击者就拿到了一把统计杠杆（差分密码分析 1990 年由 Biham-Shamir 公开，曾直逼 DES）。',
      en: 'The core idea of modern cryptanalysis: ignore individual inputs, watch how input DIFFERENCES map to output differences. Below is the real 4-bit S-box of the PRESENT lightweight cipher — its 16×16 difference-distribution table computed live. Pick Δx; a biased count for some Δy hands the attacker a statistical lever (differential cryptanalysis, publicized by Biham–Shamir in 1990, once pressed hard against DES).'
    },

    /* ================= 🛡️ 认证加密 ================= */
    aeadIntro: {
      zh: '只有加密没有认证的密文，改一位你也不知道。对比两种方案对同一比特翻转的结局：裸加密 → 接收方解出被篡改的明文且毫无察觉；Encrypt-then-MAC → 标签对不上，当场拒收。顺序本身也是学问：MAC-then-Encrypt（先签后加）曾让 TLS 1.0 时代饱受 padding-oracle 之苦——现代答案是一个原子里同时完成两者的 AEAD（GCM/ChaCha20-Poly1305）。',
      en: 'Ciphertext without authentication lets a bit-flip slip through unnoticed. Compare both schemes under the same bit flip: raw encryption → receiver decrypts tampered plaintext with zero suspicion; Encrypt-then-MAC → tag mismatch, rejected on sight. Order matters too: MAC-then-Encrypt plagued TLS 1.0 with padding oracles — the modern answer is AEAD (GCM / ChaCha20-Poly1305), doing both in one atomic primitive.'
    },

    /* ================= 🧟 长度扩展攻击 ================= */
    extIntro: {
      zh: 'SHA-1/MD5 属于 Merkle-Damgård 结构：H(k‖msg) 这种「秘密前缀 MAC」有个致命缺陷——知道一条 msg 和它的 MAC，就能在不知道密钥的情况下，为 msg‖glue‖任意后缀 造出合法 MAC（把内部状态原样接力）。下方用真实 SHA-1 完整复现：伪造出的 MAC 经服务端重算验证通过。防御：用 HMAC（两层结构免疫），或换 SHA-3 这类非 MD 结构。',
      en: 'SHA-1/MD5 are Merkle-Damgård constructions: a secret-prefix MAC like H(k‖msg) has a fatal flaw — given msg and its MAC, you can forge a valid MAC for msg‖glue‖anything WITHOUT the key, by chaining the internal state forward. Reproduced fully with real SHA-1 below: the forged MAC passes server re-verification. Defenses: HMAC (two-layer, immune) or SHA-3 (non-MD).'
    },

    /* ================= 🐘 真实大数 RSA ================= */
    bigIntro: {
      zh: '前面所有 RSA 都是玩具数字——这里来真的：用 BigInt 跑 Miller-Rabin 素性测试，现场生成 256 位密钥对（n 有 64 位十六进制那么长）。注意生成耗时：这就是真实世界的成本感；现行标准是 2048 位（长度的 8 倍，成本指数级更高）。加密解密走完整模幂往返。',
      en: 'Every RSA before this used toy numbers — here comes the real thing: BigInt Miller-Rabin primality testing generates a 256-bit keypair live (n is 64 hex digits long). Watch the elapsed time: that is what real-world cost feels like; the current standard is 2048-bit (8× the length, exponentially costlier). Full modular-exponentiation round trip included.'
    },

    /* ================= ✍️ 数字签名 ================= */
    signIntro: {
      zh: 'RSA 的神来之笔：把加密倒过来用。加密是「公钥锁、私钥开」；签名是「私钥锁、公钥开」——只有持有私钥的人能产出签名，而全世界都能用公钥验证它。走一遍：签名 → 传输中被 Eve 篡改 → 验证当场识破。真实系统先对消息的哈希值签名并加填充（PSS），本演示为看清数学直接签原始小数字。',
      en: 'RSA\'s masterstroke: encryption used in reverse. Encryption locks with the public key and opens with the private one; signing locks with the PRIVATE key and opens with the public — only the private-key holder can produce a signature, yet everyone can verify it. Walk the flow: sign → Eve tampers in transit → verification catches it instantly. Real systems sign a hash with padding (PSS); this demo signs raw small numbers to expose the math.'
    },

    /* ================= 🎲 随机数 ================= */
    rngIntro: {
      zh: '密码学的地基不是算法，是随机数。再强的算法遇上可预测的密钥等于零。本演示用「当前秒数当种子」的普通 LCG 生成一把"随机"密钥——攻击者只需穷举一天之内的 86400 个种子，秒级还原全部输出。V8 的 Math.random（xorshift128+）同样可从连续输出恢复内部状态。密码学必须使用 CSPRNG：种子来自操作系统熵源，且不可观测、不可穷举。',
      en: 'The foundation of cryptography is not algorithms — it is randomness. The strongest cipher with a predictable key equals zero. This demo generates a "random" key from an ordinary LCG seeded by the current second: an attacker brute-forces just 86,400 seeds per day and reproduces every output. V8\'s Math.random (xorshift128+) can likewise have its state recovered from outputs. Cryptography demands a CSPRNG: seeded from OS entropy, unobservable and unenumerable.'
    },

    /* ================= ⑥ 口令破解成本 ================= */
    pwdCharsets: [
      { id: 'lower', label: { zh: '小写 a-z', en: 'lower a-z' }, n: 26 },
      { id: 'upper', label: { zh: '大写 A-Z', en: 'upper A-Z' }, n: 26 },
      { id: 'digit', label: { zh: '数字 0-9', en: 'digits 0-9' }, n: 10 },
      { id: 'symbol', label: { zh: '符号 !@#…', en: 'symbols !@#…' }, n: 33 }
    ],
    pwdAlgos: [
      { id: 'md5', name: 'MD5', rate: 2e10, note: { zh: '已被攻破的快哈希', en: 'broken fast hash' } },
      { id: 'sha256', name: 'SHA-256', rate: 7e9, note: { zh: '现代快哈希（无盐则仍可穷举）', en: 'modern fast hash (unsalted = still brute-forceable)' } },
      { id: 'bcrypt', name: 'bcrypt(12)', rate: 2e4, note: { zh: '故意慢 + 自带盐', en: 'deliberately slow + salted' } },
      { id: 'argon2', name: 'Argon2id', rate: 2e2, note: { zh: '内存困难，GPU 优势归零', en: 'memory-hard, neutralizes GPUs' } }
    ],
    pwdRigs: [
      { id: 'cpu', u: 2e-4, name: { zh: '单台 CPU', en: 'single CPU' } },
      { id: 'gpu', u: 8, name: { zh: '8 卡矿架', en: '8-GPU rig' } },
      { id: 'cloud', u: 1000, name: { zh: '云端千卡集群', en: 'cloud 1000-GPU cluster' } },
      { id: 'nation', u: 1e6, name: { zh: '国家级（百万卡）', en: 'nation-state (1M GPUs)' } }
    ],
    pwdIntro: {
      zh: '穷举时间 = 组合数 ÷ 每秒尝试数。拖动长度、勾选字符集、换算法与装备——你会看到：对抗快哈希时「长度」几乎就是一切；而 Argon2 这类内存困难算法能把百万卡集群打回原形。（速率为公开基准的量级估算，用于建立直觉）',
      en: 'Time = combinations ÷ guesses per second. Drag length, tick charsets, swap algorithms and rigs — against fast hashes, length is nearly everything; memory-hard Argon2 drags a million-GPU farm back to earth. (Rates are order-of-magnitude estimates from public benchmarks, for intuition.)'
    },
    fmtInt: function (n) {
      return ('' + n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  };

  return LAB;
})();

/* ============================================================
   交互初始化（页面加载后调用 PROTOCOL_LAB.init()）
   ============================================================ */
(function () {
  var LAB = window.PROTOCOL_LAB;

  LAB.init = function () {
    var isEn = !!(window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en');
    var modPow = LAB.modPow;
    var H = LAB.H;
    function L(o) { return isEn ? o.en : o.zh; }
    var doc = document;
    function el(id) { return doc.getElementById(id); }
    /* 按钮文案双语化（en 模式：HTML 静态按钮默认中文 → 英文） */
    if (isEn && LAB.btns) {
      Object.keys(LAB.btns).forEach(function (bid) {
        var b = doc.getElementById(bid);
        if (b && LAB.btns[bid]) b.textContent = LAB.btns[bid];
      });

    /* pl-extend 跨链文本双语化 */
    if (isEn && LAB.linkL10n) {
      Array.prototype.forEach.call(doc.querySelectorAll('.pl-extend a'), function (a) {
        var t = a.textContent.trim();
        if (LAB.linkL10n[t]) a.textContent = LAB.linkL10n[t];
      });
      /* 导航锚点 / 参考前缀 / label（只动文本节点） */
      Array.prototype.forEach.call(doc.querySelectorAll('.pl-nav a'), function (a) {
        var t = a.textContent.trim();
        if (LAB.navL10n[t]) a.textContent = LAB.navL10n[t];
      });
      Array.prototype.forEach.call(doc.querySelectorAll('.pl-src'), function (d) {
        if (d.firstChild && d.firstChild.nodeType === 3) {
          var v = d.firstChild.textContent.trim();
          if (LAB.srcL10n[v]) d.firstChild.textContent = LAB.srcL10n[v];
        }
      });
      Array.prototype.forEach.call(doc.querySelectorAll('label'), function (l) {
        if (l.firstChild && l.firstChild.nodeType === 3) {
          var t = l.firstChild.textContent.trim();
          if (LAB.labelL10n[t]) l.firstChild.textContent = LAB.labelL10n[t];
        }
      });
    }
    }

    /* 懒初始化：演示卡临近视口才构建（无 IntersectionObserver 的环境立即执行，兼容冒烟桩） */
    function LAZY(secId, fn) {
      var sec = doc.getElementById(secId);
      if (!sec || typeof window.IntersectionObserver === 'undefined') { fn(); return; }
      var io = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { io.disconnect(); fn(); }
        });
      }, { rootMargin: '600px' });
      io.observe(sec);
    }

    /* ---------- ① TLS 握手 ---------- */
    LAZY('pl-tls', function () {
      var steps = LAB.tlsSteps();
      var box = el('tls-steps');
      var idx = 0, eve = false;
      function arrow(a, b) {
        if (a === 'L') return 'C ∥ S';
        if (a === 'C' && b === 'S') return 'C ⟶ S';
        return 'S ⟶ C';
      }
      function render() {
        var h = '';
        steps.forEach(function (s, i) {
          h += '<div class="pl-step' + (i < idx ? ' on' : '') + '">' +
            '<span class="pl-dir">' + arrow(s.from, s.to) + '</span>' +
            '<b>' + L(s.tag) + '</b><p>' + L(s.txt) + '</p></div>';
        });
        box.innerHTML = h;
        var note = el('tls-note');
        if (eve && idx >= 2) note.textContent = L(LAB.tlsEve);
        else if (eve) note.textContent = isEn ? "🕵️ Eve is watching the plaintext steps…" : '🕵️ Eve 正在监听明文步骤……';
        else note.textContent = '';
        el('tls-next').textContent = idx >= steps.length
          ? (isEn ? '↺ Restart' : '↺ 重新开始')
          : (isEn ? 'Next step (' + (idx + 1) + '/' + steps.length + ')' : '下一步（' + (idx + 1) + '/' + steps.length + '）');
      }
      el('tls-next').addEventListener('click', function () {
        idx = idx >= steps.length ? 0 : idx + 1;
        render();
      });
      el('tls-eve').addEventListener('click', function () {
        eve = !eve;
        this.classList.toggle('on', eve);
        render();
      });
      render();
    });

    /* ---------- ② DH 中间人 ---------- */
    LAZY('pl-dh', function () {
      var p = LAB.dhParams.p, g = LAB.dhParams.g;
      var e = 6; /* Eve 的私钥（演示固定） */
      var eveOn = false;
      (function () {
        var sa = el('dh-a'), sb = el('dh-b');
        for (var v = 3; v <= 12; v++) {
          var o1 = doc.createElement('option'), o2 = doc.createElement('option');
          o1.value = o2.value = String(v);
          o1.textContent = o2.textContent = String(v);
          if (v === 6) { o1.selected = true; }
          if (v === 9) { o2.selected = true; }
          sa.appendChild(o1); sb.appendChild(o2);
        }
        sa.value = '6'; sb.value = '9';
      })();
      function run() {
        var a = parseInt(el('dh-a').value, 10);
        var b = parseInt(el('dh-b').value, 10);
        var withEve = eveOn;
        var A = modPow(g, a, p), B = modPow(g, b, p), E = modPow(g, e, p);
        var rows = [];
        rows.push('<tr><th colspan="2">' + L({ zh: '公开参数：p = ' + p + '，g = ' + g, en: 'Public: p = ' + p + ', g = ' + g }) + '</th></tr>');
        rows.push('<tr><td>' + L({ zh: 'Alice 私钥 a = ' + a, en: 'Alice secret a = ' + a }) + '</td><td>' + L({ zh: 'Bob 私钥 b = ' + b, en: 'Bob secret b = ' + b }) + '</td></tr>');
        if (!withEve) {
          rows.push('<tr><td>' + L({ zh: 'A 公开发送 ' + A, en: 'A sends public ' + A }) + '</td><td>' + L({ zh: 'B 公开发送 ' + B, en: 'B sends public ' + B }) + '</td></tr>');
          var k1 = modPow(B, a, p), k2 = modPow(A, b, p);
          rows.push('<tr class="ok"><td colspan="2">' +
            L({ zh: '共享密钥：B^a = ' + k1 + ' = A^b ✓ 两端一致——但注意：这条信道没有认证！', en: 'Shared key: B^a = ' + k1 + ' = A^b ✓ both ends agree — yet note: this channel has NO authentication!' }) +
            '</td></tr>');
          el('dh-verdict').innerHTML = '<span class="ok">' +
            L({ zh: '✓ 数学上完美协商成功。勾选「Eve 在场」看看没有认证时会发生什么。', en: '✓ Perfect negotiation in math. Tick "Eve is present" to see what happens without authentication.' }) + '</span>';
        } else {
          rows.push('<tr class="bad"><td colspan="2">' +
            L({ zh: 'Eve 拦截并把双方公钥都换成自己的 E = ' + E, en: 'Eve intercepts and swaps both public keys with her own E = ' + E }) + '</td></tr>');
          rows.push('<tr><td>Alice 实际收到 ' + E + '</td><td>Bob 实际收到 ' + E + '</td></tr>');
          var kAE = modPow(E, a, p), kBE = modPow(E, b, p);
          rows.push('<tr><td>Alice 算出密钥 ' + kAE + '</td><td>Bob 算出密钥 ' + kBE + '</td></tr>');
          rows.push('<tr><td>Eve 与 Alice 共享 ' + kAE + '</td><td>Eve 与 Bob 共享 ' + kBE + '</td></tr>');
          el('dh-verdict').innerHTML = '<span class="bad">' +
            (a === b ? (isEn ? '(Demo coincidence: a=b makes the two keys equal — practically never happens.) ' : '（演示巧合：a=b 时两把钥匙恰好相同——真实场景几乎不会发生。）') : '') +
            L({ zh: '✗ Alice 和 Bob 各自「协商成功」，却都在跟 Eve 说悄悄话——两个密钥不相等，DH 本身毫无察觉。对照 BB84：窃听会留痕；DH 无认证即失守。现实中的解药就是上一节的数字证书。', en: '✗ Alice and Bob each "succeeded" — but are whispering to Eve. Two unequal keys, and plain DH never notices. Contrast BB84: eavesdropping leaves marks; DH without authentication simply fails. The real-world antidote is the certificate from section one.' }) + '</span>';
        }
        el('dh-out').innerHTML = rows.join('');
      }
      ['dh-a', 'dh-b'].forEach(function (id) { el(id).addEventListener('change', run); });
      el('dh-eve').addEventListener('click', function () {
        eveOn = !eveOn;
        this.classList.toggle('on', eveOn);
        run();
      });
      el('dh-run').addEventListener('click', run);
      run();
    });

    /* ---------- ③ Merkle 树与区块链 ---------- */
    LAZY('pl-merkle', function () {
      var leaves = LAB.merkleLeaves.slice();
      function treeOf(lvs) {
        var lv = [lvs.map(H)];
        while (lv[lv.length - 1].length > 1) {
          var cur = lv[lv.length - 1], nx = [];
          for (var i = 0; i < cur.length; i += 2) {
            nx.push(cur[i + 1] !== undefined ? H(cur[i] + cur[i + 1]) : cur[i]);
          }
          lv.push(nx);
        }
        return lv;
      }
      function hexRnd(avoid) {
        var s = '0123456789abcdef', c;
        do { c = s.charAt(Math.floor(Math.random() * 16)); } while (c === avoid);
        return c;
      }
      function renderTree(changed) {
        changed = changed || {};
        var lv = treeOf(leaves);
        var h = '<div class="pl-mtree">';
        for (var l = lv.length - 1; l >= 0; l--) {
          h += '<div class="pl-mrow lv' + l + '">';
          lv[l].forEach(function (v, i) {
            var key = l + '-' + i;
            h += '<span class="pl-mnode' + (changed[key] ? ' flash' : '') + '" title="' + v + '">' + v + '</span>';
          });
          h += '</div>';
        }
        h += '</div><div class="ws-note" style="text-align:center">' + L(LAB.merkleNote) + '</div>';
        el('merkle-tree').innerHTML = h;
      }
      (function () {
        var h = '';
        leaves.forEach(function (leaf, i) {
          h += '<button class="btn" data-i="' + i + '">✏️ ' + leaf + '</button>';
        });
        el('merkle-leaves').innerHTML = h;
        Array.prototype.forEach.call(el('merkle-leaves').children, function (btn) {
          btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-i'), 10);
            /* 无条件改写最后一个字符，保证哈希必然变化 */
            leaves[i] = leaves[i].slice(0, -1) + hexRnd(leaves[i].slice(-1));
            this.textContent = '✏️ ' + leaves[i];
            var chg = {};
            chg['0-' + i] = 1;
            renderTree(chg);
          });
        });
      renderTree();
      })();

      /* 区块链 */
      var blocks = [];
      function buildChain() {
        blocks = LAB.chainSeed.map(function (b) { return { data: L(b.data), prev: b.prev }; });
        blocks.forEach(function (b, i) {
          if (!b.prev) b.prev = i ? blocks[i - 1].hash : '00000000';
          b.hash = H(b.prev + '|' + b.data);
        });
      }
      function renderChain(brokenAt) {
        var h = '<div class="pl-chain">';
        blocks.forEach(function (b, i) {
          var bad = brokenAt !== null && i >= brokenAt;
          h += '<div class="pl-block' + (bad ? ' bad' : '') + '">' +
            '<div class="k">#' + (i + 1) + ' · prev ' + b.prev.slice(0, 8) + '</div>' +
            '<div class="d">' + b.data + '</div>' +
            '<div class="hh">hash ' + b.hash + '</div></div>' +
            (i < blocks.length - 1 ? '<div class="pl-link' + (brokenAt !== null && i + 1 >= brokenAt ? ' bad' : '') + '">⇣</div>' : '');
        });
        h += '</div>';
        el('chain-view').innerHTML = h;
      }
      buildChain(); renderChain(null);
      el('chain-tamper').addEventListener('click', function () {
        blocks[1].data = blocks[1].data + (isEn ? ' [TAMPERED +100]' : '【被篡改 +100】');
        renderChain(1);
      });
      el('chain-restore').addEventListener('click', function () {
      buildChain(); renderChain(null);
      el('chain-note').textContent = L(LAB.chainNote);
      });
    });

    /* ---------- ④ 零知识证明（三色图） ---------- */
    LAZY('pl-zkp', function () {
      var nodes = LAB.zkpNodes, edges = LAB.zkpEdges, base = LAB.zkpBase;
      var pos = {};
      nodes.forEach(function (n) { pos[n.id] = n; });
      var svg = '<svg viewBox="0 0 300 220" style="position:absolute;inset:0;width:100%;height:100%">';
      edges.forEach(function (e, i) {
        svg += '<line data-e="' + i + '" x1="' + pos[e[0]].x + '" y1="' + pos[e[0]].y +
          '" x2="' + pos[e[1]].x + '" y2="' + pos[e[1]].y + '" stroke="rgba(255,255,255,.25)" stroke-width="3"/>';
      });
      svg += '</svg>';
      el('zkp-graph').innerHTML = svg + nodes.map(function (n) {
        return '<button class="pl-znode" data-id="' + n.id + '" style="left:' + (n.x - 16) + 'px;top:' + (n.y - 16) + 'px;background:' +
          LAB.zkpColors[base[n.id]] + '" title="' + n.id + '">' + n.id + '</button>';
      }).join('');
      var rounds = 0;
      function setNode(id, color, blur) {
        var n = el('zkp-graph').querySelector('[data-id="' + id + '"]');
        n.style.background = color;
        n.classList.toggle('pl-blur', !!blur);
      }
      function stat() {
        el('zkp-stat').textContent = rounds
          ? (isEn ? 'Rounds passed: ' + rounds + ' · info leaked per round ≈ 0' : '已通过轮数：' + rounds + ' · 每轮泄露信息 ≈ 0')
          : (isEn ? 'Click a round to commit & answer a random edge' : '点击「下一轮」开始承诺与应答');
      }
      el('zkp-round').addEventListener('click', function () {
        /* 随机换名（承诺）→ 随机挑边 → 揭开两端 */
        var perm = [0, 1, 2], i, j, tmp;
        for (i = 2; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; }
        committed = true;
        nodes.forEach(function (n) { setNode(n.id, '#555', true); });
        var ei = Math.floor(Math.random() * edges.length);
        var pair = edges[ei];
        Array.prototype.forEach.call(el('zkp-graph').querySelectorAll('line'), function (ln) {
          ln.setAttribute('stroke', parseInt(ln.getAttribute('data-e'), 10) === ei ? '#39ff14' : 'rgba(255,255,255,.12)');
        });
        setTimeout(function () {
          setNode(pair[0], LAB.zkpColors[perm[base[pair[0]]]], false);
          setNode(pair[1], LAB.zkpColors[perm[base[pair[1]]]], false);
          rounds++;
          stat();
          setTimeout(function () {
            nodes.forEach(function (n) { setNode(n.id, '#555', true); });
            Array.prototype.forEach.call(el('zkp-graph').querySelectorAll('line'), function (ln) {
              ln.setAttribute('stroke', 'rgba(255,255,255,.25)');
            });
          }, 1400);
        }, 350);
      });
      el('zkp-reset').addEventListener('click', function () {
        rounds = 0; committed = false;
        nodes.forEach(function (n) { setNode(n.id, LAB.zkpColors[base[n.id]], false); });
        stat();
      });
      stat();
      el('zkp-intro').textContent = L(LAB.zkpIntro);
    });

    /* ---------- ⑤ ECC 点加法 ---------- */
    LAZY('pl-ecc', function () {
      var cv = el('ecc-cv');
      var ctx = cv.getContext('2d');
      var WID = cv.width, HEI = cv.height;
      var XMIN = -3.4, XMAX = 3.4, YMAX = 7.5;
      function fx(x, a, b) { return x * x * x + a * x + b; }
      function toPx(x, y) {
        return { x: (x - XMIN) / (XMAX - XMIN) * WID, y: HEI / 2 - y / YMAX * (HEI / 2 - 8) };
      }
      function draw(a, b, P, Q, R, chord) {
        ctx.clearRect(0, 0, WID, HEI);
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.moveTo(0, HEI / 2); ctx.lineTo(WID, HEI / 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,240,255,.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        var first = true;
        for (var px = XMIN; px <= XMAX; px += 0.01) {
          var v = fx(px, a, b);
          if (v < 0) continue;
          var y = Math.sqrt(v);
          var q = toPx(px, y);
          if (first) { ctx.moveTo(q.x, q.y); first = false; } else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        ctx.beginPath();
        first = true;
        for (px = XMAX; px >= XMIN; px -= 0.01) {
          var v2 = fx(px, a, b);
          if (v2 < 0) continue;
          var y2 = -Math.sqrt(v2);
          var q2 = toPx(px, y2);
          if (first) { ctx.moveTo(q2.x, q2.y); first = false; } else ctx.lineTo(q2.x, q2.y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        if (chord) {
          ctx.strokeStyle = 'rgba(185,103,255,.9)';
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(chord.x1, chord.y1); ctx.lineTo(chord.x2, chord.y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        [[P, '#00f0ff'], [Q, '#ffe600'], [R, '#ff2d95']].forEach(function (pt) {
          if (!pt[0]) return;
          var c = toPx(pt[0].x, pt[0].y);
          ctx.fillStyle = pt[1];
          ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
        });
      }
      var st = { a: LAB.eccDefault.a, b: LAB.eccDefault.b, P: null, Q: null };
      var msg = el('ecc-msg');
      function singular(a, b) { return Math.abs(4 * a * a * a + 27 * b * b) < 0.001; }
      function redraw() {
        if (singular(st.a, st.b)) {
          ctx.clearRect(0, 0, WID, HEI);
          msg.textContent = isEn ? '⚠ Singular curve (4a³+27b²=0) — adjust sliders' : '⚠ 奇异曲线（4a³+27b²=0）——请调整滑杆';
          return;
        }
        draw(st.a, st.b, st.P, st.Q, null, null);
        msg.textContent = isEn
          ? 'Click two points on the curve, then press P+Q'
          : '在曲线上点选两个点，再按 P+Q';
      }
      cv.addEventListener('click', function (ev) {
        if (singular(st.a, st.b)) return;
        var rect = cv.getBoundingClientRect();
        var mx = (ev.clientX - rect.left) / rect.width * WID;
        var my = (ev.clientY - rect.top) / rect.height * HEI;
        var best = null, bd = 20 * 20;
        for (var sx = XMIN; sx <= XMAX; sx += 0.005) {
          var v = fx(sx, st.a, st.b);
          if (v < 0) continue;
          var ys = Math.sqrt(v);
          [ys, -ys].forEach(function (sy) {
            var c = toPx(sx, sy);
            var d2 = (c.x - mx) * (c.x - mx) + (c.y - my) * (c.y - my);
            if (d2 < bd) { bd = d2; best = { x: sx, y: sy }; }
          });
        }
        if (!best) return;
        cv.setAttribute('data-last', best.x.toFixed(3) + ',' + best.y.toFixed(3));
        if (!st.P || (st.P && st.Q)) { st.P = best; st.Q = null; }
        else st.Q = best;
        redraw();
      });
      el('ecc-add').addEventListener('click', function () {
        if (!st.P || !st.Q) return;
        if (singular(st.a, st.b)) return;
        var a = st.a, b = st.b, P = st.P, Q = st.Q, m, c1 = toPx(P.x, P.y), c2 = toPx(Q.x, Q.y);
        if (Math.abs(P.x - Q.x) < 1e-9 && Math.abs(P.y + Q.y) < 1e-9 && Math.abs(P.y) > 1e-9) { msg.textContent = isEn ? 'P + (-P) = point at infinity ∞' : 'P + (-P) = 无穷远点 ∞'; return; }
          if (Math.abs(P.x - Q.x) < 1e-9 && Math.abs(Math.abs(P.y) - Math.abs(Q.y)) < 1e-9) {
          if (Math.abs(P.y) < 1e-9) { msg.textContent = isEn ? 'P+P = point at infinity ∞' : 'P+P = 无穷远点 ∞'; return; }
          m = (3 * P.x * P.x + a) / (2 * P.y);           /* 切线（倍点） */
        } else {
          m = (Q.y - P.y) / (Q.x - P.x);                  /* 割线 */
        }
        var r = m * m - P.x - Q.x;
        var ry = m * (r - P.x) + P.y;
        var R = { x: r, y: -ry };                          /* 镜像 */
        var far = toPx(XMIN, m * (XMIN - P.x) + P.y);
        var far2 = toPx(XMAX, m * (XMAX - P.x) + P.y);
        draw(st.a, st.b, P, Q, R, { x1: far.x, y1: far.y, x2: far2.x, y2: far2.y });
        msg.textContent = (isEn ? 'P+Q = (' + r.toFixed(3) + ', ' + R.y.toFixed(3) + ')' : 'P+Q = (' + r.toFixed(3) + ', ' + R.y.toFixed(3) + ')');
      });
      [['ecc-a', 'a'], ['ecc-b', 'b']].forEach(function (pair) {
        el(pair[0]).addEventListener('input', function () {
          st[pair[1]] = parseFloat(this.value);
          el('ecc-ab').textContent = 'a=' + st.a + ' , b=' + st.b;
          st.P = st.Q = null;
          redraw();
        });
        el(pair[0]).value = String(st[pair[1]]);
      });
      el('ecc-ab').textContent = 'a=' + st.a + ' , b=' + st.b;
      el('ecc-clear').addEventListener('click', function () { st.P = st.Q = null; redraw(); });
      redraw();
    });

    /* ---------- ⑥ 口令破解成本计算器 ---------- */
    LAZY('pl-pwd', function () {
      var lenEl = el('pwd-len');
      /* 动态构建字符集勾选框 / 算法与装备下拉 */
      (function () {
        var box = el('pwd-cs');
        LAB.pwdCharsets.forEach(function (cs, i) {
          var lb = doc.createElement('label');
          var cb = doc.createElement('input');
          cb.type = 'checkbox';
          cb.id = 'pwd-cs-' + cs.id;
          cb.checked = i < 2;
          lb.appendChild(cb);
          lb.appendChild(doc.createTextNode(' ' + L(cs.label) + ' (' + cs.n + ')'));
          box.appendChild(lb);
        });
        var algo = el('pwd-algo'), rig = el('pwd-rig');
        LAB.pwdAlgos.forEach(function (a) {
          var o = doc.createElement('option');
          o.value = a.id;
          o.textContent = a.name + (a.id === 'md5' ? ' ⚠' : '');
          algo.appendChild(o);
        });
        LAB.pwdRigs.forEach(function (r) {
          var o = doc.createElement('option');
          o.value = r.id;
          o.textContent = L(r.name);
          rig.appendChild(o);
        });
        algo.value = 'sha256'; rig.value = 'gpu';
        el('pwd-intro-holder').textContent = L(LAB.pwdIntro);
      })();
      function charsetSize() {
        var n = 0;
        LAB.pwdCharsets.forEach(function (cs) {
          if (el('pwd-cs-' + cs.id).checked) n += cs.n;
        });
        return n;
      }
      function humanTime(sec) {
        if (sec < 1) return isEn ? 'instant' : '瞬间';
        var yr = 31557600;
        if (sec / yr >= 1e4) {
          var e10 = Math.floor(Math.log10(sec / yr));
          var man = (sec / yr) / Math.pow(10, e10);
          return L({ zh: '约 ' + man.toFixed(1) + '×10' + sup(e10) + ' 年', en: '≈' + man.toFixed(1) + '×10' + sup(e10) + ' years' });
        }
        var units = [
          [1, { zh: '秒', en: 's' }], [60, { zh: '分钟', en: 'min' }],
          [3600, { zh: '小时', en: 'h' }], [86400, { zh: '天', en: 'days' }],
          [yr, { zh: '年', en: 'years' }]
        ];
        for (var i = units.length - 1; i >= 0; i--) {
          if (sec >= units[i][0]) {
            return LAB.fmtInt(Math.round(sec / units[i][0])) + ' ' + L(units[i][1]);
          }
        }
        return LAB.fmtInt(Math.round(sec)) + ' s';
      }
      function sup(n) {
        var map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '' };
        return String(n).split('').map(function (c) { return map[c] !== undefined ? map[c] : c; }).join('');
      }
      function run() {
        var cs = charsetSize(), len = parseInt(lenEl.value, 10);
        el('pwd-len-v').textContent = len;
        var algo = LAB.pwdAlgos.filter(function (x) { return x.id === el('pwd-algo').value; })[0];
        var rig = LAB.pwdRigs.filter(function (x) { return x.id === el('pwd-rig').value; })[0];
        if (!algo || !rig || cs < 2) {
          el('pwd-out').innerHTML = '<span class="bad">' + (isEn ? 'Tick at least one charset' : '至少勾选一个字符集') + '</span>';
          return;
        }
        var comb = Math.pow(cs, len);
        var bits = len * Math.log(cs) / Math.LN2;
        var rate = algo.rate * rig.u;
        var sec = comb / rate;
        var yr1 = 31557600;
        var cls = sec < 86400 ? 'bad' : (sec < yr1 ? 'warn' : 'ok');
        var combTxt;
        if (comb < 1e15) combTxt = LAB.fmtInt(comb);
        else {
          var ep = comb.toExponential(2).split('e+');
          combTxt = ep[0] + '×10' + sup(ep[1]);
        }
        el('pwd-out').innerHTML =
          '<div>' + L({ zh: '组合数：', en: 'Combinations: ' }) + '<b>' + combTxt + '</b></div>' +
          '<div>' + L({ zh: '熵：', en: 'Entropy: ' }) + '<b>' + bits.toFixed(1) + ' bits</b></div>' +
          '<div>' + L({ zh: '穷举耗时（' + algo.name + ' @ ' + L(rig.name) + '）：', en: 'Crack time (' + algo.name + ' @ ' + L(rig.name) + '): ' }) +
          '<b class="' + cls + '">' + humanTime(sec) + '</b></div>' +
          '<div class="ws-note">' + L(algo.note) + '</div>';
      }
      LAB.pwdCharsets.forEach(function (cs) { el('pwd-cs-' + cs.id).addEventListener('change', run); });
      lenEl.addEventListener('input', run);
      ['pwd-algo', 'pwd-rig'].forEach(function (id) { el(id).addEventListener('change', run); });
      run();
    });

    /* ---------- 🌀 ChaCha20 quarter-round ---------- */
    LAZY('pl-chacha', function () {
      el('cc-intro').textContent = L(LAB.chachaIntro);
      var st = new Uint32Array(16);
      var CONSTANTS = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]; /* "expand 32-byte k" */
      function freshState() {
        for (var i = 0; i < 4; i++) st[i] = CONSTANTS[i];
        for (i = 4; i < 12; i++) st[i] = (Math.random() * 4294967296) >>> 0;
        st[12] = 0; /* counter */
        for (i = 13; i < 16; i++) st[i] = (Math.random() * 4294967296) >>> 0;
      }
      function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
      /* 标准对角线索引（显式列出，避免取模歧义） */
      var DIAG = [[0, 5, 10, 15], [1, 6, 11, 12], [2, 7, 8, 13], [3, 4, 9, 14]];
      function buildOps() {
        var ops = [];
        function qr(A, B, C, D) {
          ops.push({ t: 'a += b', hl: [A, B], f: function () { st[A] = (st[A] + st[B]) >>> 0; } });
          ops.push({ t: 'd ^= a', hl: [D, A], f: function () { st[D] = (st[D] ^ st[A]) >>> 0; } });
          ops.push({ t: 'd <<<= 16', hl: [D], f: function () { st[D] = rotl(st[D], 16); } });
          ops.push({ t: 'c += d', hl: [C, D], f: function () { st[C] = (st[C] + st[D]) >>> 0; } });
          ops.push({ t: 'b ^= c', hl: [B, C], f: function () { st[B] = (st[B] ^ st[C]) >>> 0; } });
          ops.push({ t: 'b <<<= 12', hl: [B], f: function () { st[B] = rotl(st[B], 12); } });
          ops.push({ t: 'a += b', hl: [A, B], f: function () { st[A] = (st[A] + st[B]) >>> 0; } });
          ops.push({ t: 'd ^= a', hl: [D, A], f: function () { st[D] = (st[D] ^ st[A]) >>> 0; } });
          ops.push({ t: 'd <<<= 8', hl: [D], f: function () { st[D] = rotl(st[D], 8); } });
          ops.push({ t: 'c += d', hl: [C, D], f: function () { st[C] = (st[C] + st[D]) >>> 0; } });
          ops.push({ t: 'b ^= c', hl: [B, C], f: function () { st[B] = (st[B] ^ st[C]) >>> 0; } });
          ops.push({ t: 'b <<<= 7', hl: [B], f: function () { st[B] = rotl(st[B], 7); } });
        }
        for (var c = 0; c < 4; c++) qr(c, c + 4, c + 8, c + 12);            /* 列 QR */
        DIAG.forEach(function (q) { qr(q[0], q[1], q[2], q[3]); });          /* 对角 QR */
        return ops;
      }
      var grid = el('cc-grid'), statEl = el('cc-stat');
      var ops = [], opIdx = 0;
      function renderGrid(hl) {
        var h = '<table class="pl-cc">';
        for (var r = 0; r < 4; r++) {
          h += '<tr>';
          for (var c = 0; c < 4; c++) {
            var i = r * 4 + c;
            var hot = hl && hl.indexOf(i) >= 0;
            h += '<td class="' + (hot ? 'hot' : '') + '">' + w8c(st[i]).substr(0, 8) + '</td>';
          }
          h += '</tr>';
        }
        grid.innerHTML = h + '</table>';
      }
      function w8c(x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }
      function reset() {
        freshState();
        ops = buildOps();
        opIdx = 0;
        renderGrid(null);
        statEl.textContent = isEn ? 'Step through the double round (columns → diagonals), 96 ops' : '单步走完一个双轮（先列后对角），共 96 条操作（8 个 quarter-round × 12 条指令）';
      }
      el('cc-step').addEventListener('click', function () {
        if (opIdx >= ops.length) { reset(); return; }
        var o = ops[opIdx];
        o.f();
        renderGrid(o.hl);
        opIdx++;
        statEl.textContent = isEn
          ? 'Op ' + opIdx + '/96 · ' + o.t + (opIdx === 96 ? ' — double round done; ×10 more for ChaCha20' : '')
          : '操作 ' + opIdx + '/96 · ' + o.t + (opIdx === 96 ? ' —— 双轮完成；ChaCha20 还要再来十遍' : '');
      });
      el('cc-reset').addEventListener('click', reset);
      reset();
    });

    /* ---------- 📡 A5/1 LFSR ---------- */
    LAZY('pl-a51', function () {
      el('a51-intro').textContent = L(LAB.a51Intro);
      var LEN = [19, 22, 23];
      var TAPS = [[13, 16, 17, 18], [20, 21], [7, 20, 21, 22]];
      var CLOCKBIT = [8, 10, 10];
      var regs = [[], [], []];
      var stream = [];
      function resetRegs() {
        for (var r = 0; r < 3; r++) {
          regs[r] = [];
          for (var i = 0; i < LEN[r]; i++) regs[r].push(Math.random() < 0.5 ? 0 : 1);
        }
        stream = [];
      }
      function render(hlMajor, tapped) {
        var h = '';
        for (var r = 0; r < 3; r++) {
          h += '<div class="pl-r"><span class="pl-rl">R' + (r + 1) + '(' + LEN[r] + ')</span><span class="pl-cells">';
          for (var i = regs[r].length - 1; i >= 0; i--) {
            var cls = 'pl-bit';
            if (hlMajor && CLOCKBIT[r] === i) cls += ' maj';
            if (tapped && TAPS[r].indexOf(i) >= 0 && hlMajor) cls += ' tap';
            h += '<span class="' + cls + '">' + regs[r][i] + '</span>';
          }
          h += '</span><span class="pl-out">out ' + (regs[r][LEN[r] - 1]) + '</span></div>';
        }
        el('a51-registers').innerHTML = h;
        var ks = '';
        for (i = Math.max(0, stream.length - 40); i < stream.length; i++) ks += stream[i];
        el('a51-stream').innerHTML = '<span class="pl-klabel">keystream</span> ' + (ks || '—') +
          ' <small>(' + stream.length + ' bits)</small>';
      }
      function step() {
        var m = regs[0][CLOCKBIT[0]] + regs[1][CLOCKBIT[1]] + regs[2][CLOCKBIT[2]];
        var majority = m >= 2 ? 1 : 0;
        for (var r = 0; r < 3; r++) {
          if (regs[r][CLOCKBIT[r]] === majority) {
            var fb = 0;
            TAPS[r].forEach(function (t) { fb ^= regs[r][t]; });
            regs[r].pop();
            regs[r].unshift(fb & 1);
          }
        }
        stream.push(regs[0][LEN[0] - 1] ^ regs[1][LEN[1] - 1] ^ regs[2][LEN[2] - 1]);
        render(true, true);
      }
      el('a51-step').addEventListener('click', function () { step(); });
      el('a51-fast').addEventListener('click', function () {
        for (var i = 0; i < 100; i++) step();
      });
      el('a51-reset').addEventListener('click', function () { resetRegs(); render(false, false); });
      resetRegs(); render(false, false);
    });

    /* ---------- 🧨 RC4 警示录：密钥流重用灾难（真实 RC4） ---------- */
    LAZY('pl-rc4', function () {
      el('rc4-intro').textContent = L(LAB.rc4Intro);
      function ksa(key) {
        var S = [], i, j = 0;
        for (i = 0; i < 256; i++) S[i] = i;
        for (i = 0; i < 256; i++) {
          j = (j + S[i] + key[i % key.length]) & 255;
          var t = S[i]; S[i] = S[j]; S[j] = t;
        }
        return S;
      }
      function prga(S, n) {
        var S2 = S.slice(), i = 0, j = 0, out = [];
        for (var k = 0; k < n; k++) {
          i = (i + 1) & 255;
          j = (j + S2[i]) & 255;
          var t = S2[i]; S2[i] = S2[j]; S2[j] = t;
          out.push(S2[(S2[i] + S2[j]) & 255]);
        }
        return out;
      }
      function toBytes(str) {
        var b = [];
        for (var i = 0; i < str.length; i++) b.push(str.charCodeAt(i) & 255);
        return b;
      }
      function hexRow(label, bytes) {
        var h = '';
        for (var i = 0; i < bytes.length; i++) h += ('0' + bytes[i].toString(16)).slice(-2).toUpperCase() + ' ';
        return '<div class="pl-r"><span class="pl-rl">' + label + '</span><span class="pl-cells">' + h + '</span></div>';
      }
      var M1 = 'ATTACK', M2 = 'RETREA';
      el('rc4-run').addEventListener('click', function () {
        var secret = [];
        for (var i = 0; i < 5; i++) secret.push(Math.floor(Math.random() * 256));
        var iv = [];
        for (i = 0; i < 3; i++) iv.push(Math.floor(Math.random() * 256));
        var p1 = toBytes(M1), p2 = toBytes(M2);
        var ks1 = prga(ksa(secret.concat(iv)), p1.length);
        var ks2 = prga(ksa(secret.concat(iv)), p2.length);   /* WEP 式：IV 不变 → 同一密钥流 */
        var c1 = p1.map(function (b, k) { return b ^ ks1[k]; });
        var c2 = p2.map(function (b, k) { return b ^ ks2[k]; });
        var xorC = c1.map(function (b, k) { return b ^ c2[k]; });
        var xorP = p1.map(function (b, k) { return b ^ p2[k]; });
        var kh = secret.map(function () { return '••'; }).join(' ');
        var ivh = iv.map(function (b) { return ('0' + b.toString(16)).slice(-2).toUpperCase(); }).join(' ');
        el('rc4-view').innerHTML =
          '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'secret key' : '秘密密钥') + '</span><span class="pl-cells mono">' + kh + '</span></div>' +
          '<div class="pl-r"><span class="pl-rl">IV</span><span class="pl-cells mono">' + ivh + '</span></div>' +
          hexRow('P1 ⊕ P2', xorP) +
          hexRow('C1 ⊕ C2', xorC) +
          '<div class="ws-note" style="text-align:center">' + (isEn
            ? 'The two rows are IDENTICAL — the eavesdropper recovered P1⊕P2 without the key. Reused keystream hands over plaintext relations for free.'
            : '两行完全相同——窃听者没拿到密钥，却白得了两段明文的异或关系。重用的密钥流等于把明文关系拱手送上。') + '</div>';
        if (Arcade.audio) Arcade.audio.play('ui');
      });
      el('rc4-reset').addEventListener('click', function () {
        el('rc4-view').innerHTML = '';
      });
    });

    /* ---------- ✍️ 数字签名（RSA 倒置） ---------- */
    LAZY('pl-sign', function () {
      el('sign-intro').textContent = L(LAB.signIntro);
      var P = { p: 5, q: 11, e: 3 };
      P.n = P.p * P.q;
      var phi = (P.p - 1) * (P.q - 1);
      var d = 1;
      while ((P.e * d) % phi !== 1) d++;
      P.d = d;
      el('sign-params').textContent = (isEn ? 'p = 5, q = 11 → n = 55, φ = 40, public key e = 3, private key d = 27' : 'p = 5，q = 11 → n = 55，φ = 40，公钥 e = 3，私钥 d = 27');
      var st = { m: 7, s: null, sent: null, tampered: false };
      function render() {
        var h = '';
        h += '<div class="pl-r"><span class="pl-rl">m</span><span class="pl-cells mono">' + st.m + '</span></div>';
        if (st.s !== null) h += '<div class="pl-r"><span class="pl-rl">s = m^d</span><span class="pl-cells mono">' + st.s + '</span></div>';
        if (st.sent !== null) h += '<div class="pl-r"><span class="pl-rl">m\' 传输</span><span class="pl-cells mono">' + st.sent + (st.tampered ? ' ⚡' : '') + '</span></div>';
        el('sign-view').innerHTML = h;
        el('sign-verdict').textContent = '';
      }
      function upd() { el('sign-m-v').textContent = st.m; }
      el('sign-m').addEventListener('input', function () {
        st.m = parseInt(this.value, 10); upd();
        st.s = null; st.sent = null; st.tampered = false; render();
        el('sign-verify').hidden = true;
      });
      el('sign-do').addEventListener('click', function () {
        st.s = LAB.modPow(st.m, P.d, P.n);
        st.sent = st.m;
        st.tampered = false;
        render();
        el('sign-verify').hidden = false;
        el('sign-verdict').textContent = isEn ? 'Signed with the PRIVATE key. Now send it — or let Eve tamper.' : '已用私钥签名。现在发送——或者让 Eve 改一个数字。';
      });
      el('sign-tamper').addEventListener('click', function () {
        if (st.s === null) return;
        st.sent = (st.m + 1) % P.n;
        st.tampered = true;
        render();
      });
      el('sign-verify').addEventListener('click', function () {
        if (st.s === null) return;
        var back = LAB.modPow(st.s, P.e, P.n);
        var ok = back === st.sent;
        el('sign-verdict').textContent = ok
          ? (isEn ? '✓ s^e mod n = ' + back + ' = m\' — signature VALID (authentic + untampered)' : '✓ s^e mod n = ' + back + ' = m\' —— 验证通过（确系私钥持有者所签，且未被篡改）')
          : (isEn ? '✗ s^e mod n = ' + back + ' ≠ m\' = ' + st.sent + ' — TAMPERED. Verification fails.' : '✗ s^e mod n = ' + back + ' ≠ m\' = ' + st.sent + ' —— 验证失败，消息被篡改！');
        if (Arcade.audio) Arcade.audio.play(ok ? 'ui' : 'error');
      });
      upd(); render();
    });

    /* ---------- 🎲 CSPRNG 直觉实验室 ---------- */
    LAZY('pl-rng', function () {
      el('rng-intro').textContent = L(LAB.rngIntro);
      function lcg(seed, n) {
        var s = seed % 2147483647, out = [];
        for (var i = 0; i < n; i++) { s = (s * 1103515245 + 12345) % 2147483647; out.push((s >>> 8) & 255); }
        return out;
      }
      function hex(b) { return ('0' + b.toString(16)).slice(-2).toUpperCase(); }
      el('rng-gen').addEventListener('click', function () {
        var seed = Math.floor(Date.now() / 1000);           /* 「随机」= 当前秒数 */
        var key = lcg(seed, 8);
        el('rng-view').innerHTML =
          '<div class="pl-r"><span class="pl-rl">seed</span><span class="pl-cells mono">' + seed + '（' + (isEn ? 'unix seconds' : 'Unix 秒') + '）</span></div>' +
          '<div class="pl-r"><span class="pl-rl">key</span><span class="pl-cells mono">' + key.map(hex).join(' ') + '</span></div>' +
          '<div class="ws-note" style="text-align:center">' + (isEn ? 'Looks random. The seed space is one day = 86,400 values. Press attack.' : '看起来很随机。种子空间只有一天 = 86400 个。按攻击试试。') + '</div>';
      });
      el('rng-crack').addEventListener('click', function () {
        var txt = el('rng-view').textContent || '';
        var mm = txt.match(/key\s*([0-9A-F]{2}(?:\s*[0-9A-F]{2}){7})/);
        if (!mm) { el('rng-crackstat').textContent = isEn ? 'Generate a key first' : '请先生成一把密钥'; return; }
        var target = mm[1].split(/\s+/).map(function (h) { return parseInt(h, 16); });
        var found = -1, tries = 0;
        for (var s0 = 0; s0 < 86400 && found < 0; s0++) {
          var cand = lcg(s0, 3);
          if (cand[0] === target[0] && cand[1] === target[1] && cand[2] === target[2]) { found = s0; }
          tries++;
        }
        el('rng-crackstat').textContent = isEn
          ? '🕵️ ' + tries + ' seeds enumerated in milliseconds → seed = ' + found + ' → the whole keystream is now predictable.'
          : '🕵️ 枚举 ' + tries + ' 个种子（毫秒级）→ 命中种子 = ' + found + ' → 整条密钥流已可预测。';
      });
    });

    /* ---------- ∑ 数论小课堂 ---------- */
    LAZY('pl-math', function () {
      el('math-intro').textContent = L(LAB.mathIntro);
      function isPrime(n) { for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; }
      function phi(n) { var r = 0; for (var i = 1; i <= n; i++) if (gcd(i, n) === 1) r++; return r; }
      function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
      function ord(g, p) { for (var k = 1; k < p; k++) if (LAB.modPow(g, k, p) === 1) return k; return 0; }
      var curP = 23;
      function render() {
        var h = '<div class="pl-r"><span class="pl-rl">a^(p−1)</span><span class="pl-cells mono">';
        for (var a = 1; a < curP; a++) {
          var v = LAB.modPow(a, curP - 1, curP);
          h += '<span class="pl-bit' + (v === 1 ? ' maj' : '') + '">' + v + '</span>';
        }
        h += '</span></div>';
        h += '<div class="pl-r"><span class="pl-rl">φ(p)</span><span class="pl-cells mono">' + (curP - 1) + '</span></div>';
        var roots = [];
        for (var g = 1; g < curP; g++) if (ord(g, curP) === curP - 1) roots.push(g);
        h += '<div class="pl-r"><span class="pl-rl">' + L({ zh: '原根', en: 'prim. roots' }) + '</span><span class="pl-cells mono">' + roots.join(', ') + '</span></div>';
        el('math-view').innerHTML = h;
        el('math-note').textContent = L({ zh: 'p = ' + curP + '：所有 a^(p−1) mod p 都等于 1（费马小定理）；原根共 ' + roots.length + ' 个——DH 卡里的 g=5 正是其中之一。', en: 'p = ' + curP + ': every a^(p−1) mod p equals 1 (Fermat); ' + roots.length + ' primitive roots — the DH card uses g=5, one of them.' });
      }
      [13, 17, 23, 97].forEach(function (p) {
        var c = doc.createElement('span');
        c.className = 'ws-sample';
        c.textContent = 'p = ' + p;
        c.addEventListener('click', function () {
          curP = p;
          Array.prototype.forEach.call(el('math-p').children, function (x) { x.style.cssText = ''; });
          c.style.cssText = 'background:rgba(0,240,255,.25);border-color:rgba(0,240,255,.6)';
          render();
        });
        el('math-p').appendChild(c);
      });
      var phiN = doc.createElement('input');
      phiN.className = 'ws-input'; phiN.style.cssText = 'width:auto;padding:6px 10px'; phiN.value = '561';
      el('math-phi').appendChild(phiN);
      var phiOut = doc.createElement('span');
      phiOut.className = 'ws-note';
      el('math-phi').appendChild(phiOut);
      function updPhi() {
        var n = parseInt(phiN.value, 10);
        if (!n || n > 100000) { phiOut.textContent = ''; return; }
        var v = phi(n);
        phiOut.textContent = L({ zh: 'φ(' + n + ') = ' + v + (isPrime(n) ? '（素数：φ=p−1）' : (n === 561 ? ' ← 卡迈克尔数：合数却满足费马测试！' : '')) , en: 'φ(' + n + ') = ' + v + (isPrime(n) ? ' (prime: φ=p−1)' : (n === 561 ? ' ← Carmichael: composite yet passes Fermat!' : '')) });
      }
      phiN.addEventListener('input', updPhi);
      updPhi();
      render();
    });

    /* ---------- 🎯 差分分析 ---------- */
    LAZY('pl-diff', function () {
      el('diff-intro').textContent = L(LAB.diffIntro);
      var SB = [0xC,5,6,0xB,9,0,0xA,0xD,3,0xE,0xF,8,4,7,1,2];   /* PRESENT S-box */
      var DDT = [];
      for (var dx = 0; dx < 16; dx++) {
        DDT.push([]);
        for (var dy = 0; dy < 16; dy++) DDT[dx].push(0);
      }
      for (dx = 0; dx < 16; dx++) for (var x = 0; x < 16; x++) DDT[dx][SB[x] ^ SB[x ^ dx]]++;
      var sel = 1;
      function render() {
        var h = '<table class="pl-cc pl-ddt">';
        h += '<tr><td class="h">Δx\\Δy</td>';
        for (var d = 0; d < 16; d++) h += '<td class="h">' + d.toString(16).toUpperCase() + '</td>';
        h += '</tr>';
        var max = 0;
        for (dx = 1; dx < 16; dx++) for (dy = 0; dy < 16; dy++) if (DDT[dx][dy] > max) max = DDT[dx][dy];
        for (dx = 0; dx < 16; dx++) {
          h += '<tr><td class="h">' + dx.toString(16).toUpperCase() + '</td>';
          for (dy = 0; dy < 16; dy++) {
            var v = DDT[dx][dy];
            var cls = v === 0 ? ' dim' : '';
            if (v === max && dx > 0) cls = ' hot';
            if (dx === sel) cls += ' row';
            h += '<td class="cc' + cls + '">' + (v || '·') + '</td>';
          }
          h += '</tr>';
        }
        el('diff-view').innerHTML = h + '</table>';
        var rowMax = 0, best = [];
        for (dy = 0; dy < 16; dy++) { if (DDT[sel][dy] > rowMax) rowMax = DDT[sel][dy]; }
        for (dy = 0; dy < 16; dy++) if (DDT[sel][dy] === rowMax && rowMax > 0) best.push(dy.toString(16).toUpperCase());
        el('diff-note').textContent = L({ zh: 'Δx = ' + sel.toString(16).toUpperCase() + ' 行：最高计数 ' + rowMax + '/16 落在 Δy = ' + best.join('/') + ' ——偏置即杠杆。', en: 'Row Δx = ' + sel.toString(16).toUpperCase() + ': peak count ' + rowMax + '/16 at Δy = ' + best.join('/') + ' — bias is the lever.' });
      }
      var chipBox = el('diff-chips');
      for (dx = 0; dx < 16; dx++) {
        (function (dx) {
          var c = doc.createElement('span');
          c.className = 'ws-sample';
          c.textContent = 'Δ' + dx.toString(16).toUpperCase();
          c.addEventListener('click', function () {
            sel = dx;
            Array.prototype.forEach.call(chipBox.children, function (x) { x.style.cssText = ''; });
            c.style.cssText = 'background:rgba(255,45,149,.25);border-color:rgba(255,45,149,.6)';
            render();
          });
          chipBox.appendChild(c);
        })(dx);
      }
      render();
    });

    /* ---------- 🛡️ 认证加密 ---------- */
    LAZY('pl-aead', function () {
      el('aead-intro').textContent = L(LAB.aeadIntro);
      var MSG = 'PAY-100';
      function ks(k, n) { var s = k, out = []; for (var i = 0; i < n; i++) { s = (s * 1103515245 + 12345) % 2147483647; out.push((s >>> 8) & 255); } return out; }
      function mac(k, m) { var h = 5381; for (var i = 0; i < m.length; i++) h = ((((h << 5) + h) >>> 0) + m.charCodeAt(i)) >>> 0; return h; }
      var K = 0;
      var st = { mode: null, c: null, tag: null };
      function bytes(str) { var b = []; for (var i = 0; i < str.length; i++) b.push(str.charCodeAt(i)); return b; }
      function toStr(b) { var s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; }
      function hexRow(label, b, hot) {
        var h = '<div class="pl-r"><span class="pl-rl">' + label + '</span><span class="pl-cells mono">';
        for (var i = 0; i < b.length; i++) {
          var cls = hot && hot.indexOf(i) >= 0 ? ' style="color:var(--neon-pink)"' : '';
          h += '<span' + cls + '>' + ('0' + b[i].toString(16)).slice(-2).toUpperCase() + '</span> ';
        }
        return h + '</span></div>';
      }
      function start(mode) {
        K = Math.floor(Math.random() * 2147483000) + 1;
        st.mode = mode;
        var m = bytes(MSG);
        var kst = ks(K, m.length);
        st.c = m.map(function (b, i) { return b ^ kst[i]; });
        st.tag = st.mode === 'etm' ? mac(K, toStr(st.c)) : null;
        el('aead-view').innerHTML =
          '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'plaintext' : '明文') + '</span><span class="pl-cells mono">' + MSG + '</span></div>' +
          hexRow(st.mode === 'etm' ? 'C (EtM)' : 'C', st.c) +
          (st.tag !== null ? '<div class="pl-r"><span class="pl-rl">tag</span><span class="pl-cells mono">' + st.tag.toString(16).toUpperCase() + '</span></div>' : '');
        el('aead-verdict').textContent = isEn ? 'Ciphertext ready — flip one bit in transit.' : '密文就绪——传输中翻转一位试试。';
      }
      el('aead-raw').addEventListener('click', function () { start('raw'); });
      el('aead-etm').addEventListener('click', function () { start('etm'); });
      el('aead-flip').addEventListener('click', function () {
        if (!st.c) return;
        var pos = 3;
        st.c[pos] ^= 1;
        var kst = ks(K, st.c.length);
        var m2 = st.c.map(function (b, i) { return b ^ kst[i]; });
        var accepted;
        if (st.mode === 'etm') {
          accepted = mac(K, toStr(st.c)) === st.tag;
        } else {
          accepted = true;   /* 无认证：解密即接受 */
        }
        var mStr = toStr(m2).replace(/[^\x20-\x7E]/g, '?');
        el('aead-view').innerHTML += hexRow("m' 接收方解得", m2, [pos]);
        el('aead-verdict').textContent = accepted
          ? (isEn ? '✗ Receiver ACCEPTED tampered plaintext: "' + mStr + '" — no authentication, no suspicion.' : '✗ 接收方接受了被篡改的明文："' + mStr + '" ——没有认证，毫无怀疑。')
          : (isEn ? '✓ Tag mismatch — tampered ciphertext REJECTED before decryption is trusted.' : '✓ 标签不匹配——被篡改的密文在解密前就被拒收。');
        if (Arcade.audio) Arcade.audio.play(accepted ? 'error' : 'ui');
      });
    });

    /* ---------- 🧟 长度扩展攻击 ---------- */
    LAZY('pl-ext', function () {
      el('ext-intro').textContent = L(LAB.extIntro);
      /* 真实 SHA-1（FIPS 180-1） */
      function sha1Core(h, block) {
        var w = [], i;
        for (i = 0; i < 16; i++) w[i] = (block[i * 4] << 24) | (block[i * 4 + 1] << 16) | (block[i * 4 + 2] << 8) | block[i * 4 + 3];
        for (i = 16; i < 80; i++) {
          var x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
          w[i] = ((x << 1) | (x >>> 31)) >>> 0;
        }
        var a = h[0], b = h[1], c = h[2], dd = h[3], e = h[4];
        for (i = 0; i < 80; i++) {
          var f, k;
          if (i < 20) { f = (b & c) | (~b & dd); k = 0x5A827999; }
          else if (i < 40) { f = b ^ c ^ dd; k = 0x6ED9EBA1; }
          else if (i < 60) { f = (b & c) | (b & dd) | (c & dd); k = 0x8F1BBCDC; }
          else { f = b ^ c ^ dd; k = 0xCA62C1D6; }
          var tmp = (((a << 5) | (a >>> 27)) + (f >>> 0) + (e >>> 0) + k + (w[i] >>> 0)) >>> 0;
          e = dd; dd = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = tmp;
        }
        h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + dd) >>> 0; h[4] = (h[4] + e) >>> 0;
      }
      function sha1(bytesArr) {
        var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
        var msg = bytesArr.slice();
        var bitLen = msg.length * 8;
        msg.push(0x80);
        while (msg.length % 64 !== 56) msg.push(0);
        for (var i = 7; i >= 0; i--) msg.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 255);
        for (i = 0; i < msg.length; i += 64) sha1Core(h, msg.slice(i, i + 64));
        var out = '';
        for (i = 0; i < 5; i++) out += ('00000000' + h[i].toString(16)).slice(-8);
        return { hex: out, h: h };
      }
      function sha1Extend(macHex, origLen, suffixBytes) {
        var h = [];
        for (var i = 0; i < 5; i++) h.push(parseInt(macHex.substr(i * 8, 8), 16) >>> 0);
        var glue = [0x80];
        while ((origLen + glue.length) % 64 !== 56) glue.push(0);
        var bitLen = origLen * 8;
        for (i = 7; i >= 0; i--) glue.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 255);
        var stream = glue.concat(suffixBytes.slice());
        var newLen = origLen + stream.length;
        stream.push(0x80);
        while (stream.length % 64 !== 56) stream.push(0);
        bitLen = newLen * 8;
        for (i = 7; i >= 0; i--) stream.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 255);
        for (i = 0; i < stream.length; i += 64) sha1Core(h, stream.slice(i, i + 64));
        var out = '';
        for (i = 0; i < 5; i++) out += ('00000000' + h[i].toString(16)).slice(-8);
        return { hex: out, glue: glue };
      }
      function toB(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
      var st = { secret: null, msg: 'amount=100&to=Bob', mac: null };
      el('ext-gen').addEventListener('click', function () {
        st.secret = [];
        for (var i = 0; i < 8; i++) st.secret.push(Math.floor(Math.random() * 256));
        st.mac = sha1(st.secret.concat(toB(st.msg))).hex;
        el('ext-view').innerHTML =
          '<div class="pl-r"><span class="pl-rl">secret</span><span class="pl-cells mono">' + st.secret.map(function () { return '••'; }).join(' ') + ' (8B, ' + (isEn ? 'hidden' : '保密') + ')</span></div>' +
          '<div class="pl-r"><span class="pl-rl">msg</span><span class="pl-cells mono">' + st.msg + '</span></div>' +
          '<div class="pl-r"><span class="pl-rl">MAC</span><span class="pl-cells mono">' + st.mac + '</span></div>' +
          '<div class="ws-note" style="text-align:center">' + (isEn ? 'Server accepts (msg, MAC) pairs where MAC = SHA-1(secret ‖ msg).' : '服务端接受满足 MAC = SHA-1(secret ‖ msg) 的 (msg, MAC) 对。') + '</div>';
        el('ext-verdict').textContent = '';
      });
      el('ext-forge').addEventListener('click', function () {
        if (!st.mac) { el('ext-verdict').textContent = isEn ? 'Generate a MAC first' : '请先生成 MAC'; return; }
        var suffix = toB('&admin=true');
        var forged = sha1Extend(st.mac, st.secret.length + st.msg.length, suffix);
        var newMsg = st.msg;
        for (var i = 0; i < forged.glue.length; i++) newMsg += '\u25A1';
        newMsg += '&admin=true';
        st.forgedMac = forged.hex;
        st.forgedFull = st.secret.concat(toB(st.msg), forged.glue, suffix);
        el('ext-view').innerHTML +=
          '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'forged msg' : '伪造消息') + '</span><span class="pl-cells mono">' + newMsg + '</span></div>' +
          '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'forged MAC' : '伪造 MAC') + '</span><span class="pl-cells mono">' + forged.hex + '</span></div>';
        el('ext-verdict').textContent = isEn ? 'Forged without the key. Press server verify.' : '未用密钥即完成伪造。按服务端验证试试。';
      });
      el('ext-verify').addEventListener('click', function () {
        if (!st.forgedMac) { el('ext-verdict').textContent = isEn ? 'Forge first' : '请先伪造'; return; }
        var real = sha1(st.forgedFull).hex;
        var ok = real === st.forgedMac;
        el('ext-verdict').textContent = ok
          ? (isEn ? '✗ Server ACCEPTED the forged pair — attacker injected &admin=true with zero knowledge of the secret.' : '✗ 服务端接受了伪造对——攻击者对密钥一无所知，却成功注入 &admin=true。')
          : (isEn ? '✓ Rejected (this should not happen — check the implementation!)' : '✓ 拒收（这不该发生——检查实现！）');
        if (Arcade.audio) Arcade.audio.play(ok ? 'error' : 'ui');
      });
    });

    /* ---------- 🐘 真实大数 RSA ---------- */
    LAZY('pl-big', function () {
      el('big-intro').textContent = L(LAB.bigIntro);
      function bigRand(bits) {
        var v = 0n;
        for (var i = 0; i < bits; i++) v = (v << 1n) | (Math.random() < 0.5 ? 1n : 0n);
        v |= 1n << BigInt(bits - 1);
        v |= 1n;
        return v;
      }
      function modPow(b, e, m) {
        var out = 1n; b %= m;
        while (e > 0n) {
          if (e & 1n) out = out * b % m;
          b = b * b % m;
          e >>= 1n;
        }
        return out;
      }
      function isPrime(n) {
        for (var w = [2n, 3n, 5n, 7n, 11n, 13n], i = 0; i < w.length; i++) {
          var d = n - 1n, r = 0n;
          while (d % 2n === 0n) { d /= 2n; r++; }
          var x = modPow(w[i], d, n);
          if (x === 1n || x === n - 1n) continue;
          var ok = false;
          for (var j = 1n; j < r; j++) { x = x * x % n; if (x === n - 1n) { ok = true; break; } }
          if (!ok) return false;
        }
        return true;
      }
      function genPrime(bits) {
        for (;;) { var c = bigRand(bits); if (isPrime(c)) return c; }
      }
      function gcdB(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
      function modInv(a, m) {
        var oldR = ((a % m) + m) % m, r = m;
        var oldS = 1n, s = 0n;
        while (r !== 0n) {
          var q = oldR / r;
          var tmp = oldR - q * r; oldR = r; r = tmp;
          tmp = oldS - q * s; oldS = s; s = tmp;
        }
        return ((oldS % m) + m) % m;
      }
      el('big-gen').addEventListener('click', function () {
        el('big-note').textContent = isEn ? 'Computing… (this cost IS the real-world feel)' : '计算中……（这正是真实世界的成本感）';
        setTimeout(function () {
          var t0 = Date.now();
          var p = genPrime(128), q = genPrime(128);
          var n = p * q, phi = (p - 1n) * (q - 1n), e = 65537n;
          while (gcdB(e, phi) !== 1n) e += 2n;
          var d = modInv(e, phi);
          var m = 42n, c = modPow(m, e, n), back = modPow(c, d, n);
          var ms = Date.now() - t0;
          var nh = n.toString(16).toUpperCase();
          el('big-view').innerHTML =
            '<div class="pl-r"><span class="pl-rl">n (' + nh.length * 4 + ' bit)</span><span class="pl-cells mono">' + nh + '</span></div>' +
            '<div class="pl-r"><span class="pl-rl">e</span><span class="pl-cells mono">' + e + '</span></div>' +
            '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'roundtrip' : '往返验证') + '</span><span class="pl-cells mono">m=42 → c → ' + back + (back === m ? ' ✓' : ' ✗') + '</span></div>' +
            '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'elapsed' : '耗时') + '</span><span class="pl-cells mono">' + ms + ' ms</span></div>';
          el('big-note').textContent = isEn
            ? '256-bit demo keypair. Real standard: 2048-bit (8× the length, exponentially costlier).'
            : '256 位演示密钥对。真实标准 2048 位（长度 8 倍，成本指数级）。';
        }, 60);
      });
    });

    /* ---------- 📨 OTP 与复用灾难 ---------- */
    LAZY('pl-otp', function () {
      el('otp-intro').textContent = L(LAB.otpIntro);
      el('otp-note').textContent = L(LAB.otpNote);
      var PAIRS = LAB.otpPairs;
      var pi = 0, K = [], C1 = [], C2 = [], X = [], solved = false;
      function chrs(s) { return s.split('').map(function (c) { return c.charCodeAt(0); }); }
      function txt(a) { return String.fromCharCode.apply(null, a); }
      function hx(a) { return a.map(function (b) { return ('0' + ((b & 255).toString(16))).slice(-2).toUpperCase(); }).join(' '); }
      function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      function randKey(n) { var k = []; for (var i = 0; i < n; i++) k.push(Math.random() * 256 | 0); return k; }
      function enc(m, k) { return m.map(function (b, i) { return b ^ k[i]; }); }
      function plainLen() { return Math.min(PAIRS[pi].m1.length, PAIRS[pi].m2.length); }
      function setup() {
        var n = plainLen();
        K = randKey(n);
        C1 = enc(chrs(PAIRS[pi].m1.slice(0, n)), K);
        C2 = enc(chrs(PAIRS[pi].m2.slice(0, n)), K);
        X = C1.map(function (b, i) { return b ^ C2[i]; });
        solved = false;
        render();
        el('otp-verdict').textContent = '';
        rebuildPos();
      }
      function render() {
        var r = [];
        if (solved) {
          var p = PAIRS[pi];
          r.push('<tr class="ok"><td>' + (isEn ? 'M1 plaintext' : '明文 M1') + '</td><td class="mono">' + esc(p.m1) + '</td></tr>');
          r.push('<tr class="ok"><td>' + (isEn ? 'M2 plaintext' : '明文 M2') + '</td><td class="mono">' + esc(p.m2) + '</td></tr>');
        }
        r.push('<tr><td>C1 (' + (isEn ? 'ciphertext' : '密文') + ')</td><td class="mono">' + hx(C1) + '</td></tr>');
        r.push('<tr><td>C2 (' + (isEn ? 'ciphertext' : '密文') + ')</td><td class="mono">' + hx(C2) + '</td></tr>');
        r.push('<tr class="bad"><td>C1 ⊕ C2</td><td class="mono">' + hx(X) + '</td></tr>');
        el('otp-view').innerHTML = r.join('');
        var sol = el('otp-solve');
        if (sol) sol.textContent = solved ? (isEn ? '🙈 Hide answers' : '🙈 隐藏答案') : (isEn ? '⚡ Reveal plaintexts' : '⚡ 显示答案');
      }
      function rebuildPos() {
        var n = plainLen();
        var L2 = el('otp-crib').value.replace(/[^\x20-\x7E]/g, '').length;
        var max = Math.max(0, n - L2);
        var sel = el('otp-pos');
        sel.innerHTML = '';
        for (var i = 0; i <= max; i++) {
          var op = doc.createElement('option');
          op.value = String(i);
          op.textContent = (isEn ? 'char ' : '第 ') + i + (isEn ? '' : ' 位');
          sel.appendChild(op);
        }
      }
      function isLikely(s) {
        var ok = 0;
        for (var i = 0; i < s.length; i++) {
          var c = s.charCodeAt(i);
          if (c === 0x20 || (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) ok++;
        }
        return s.length > 0 && ok / s.length >= 0.8;
      }
      (function () {
        var w = el('otp-which');
        [[isEn ? 'I guess M2 contains' : '我猜 M2 里有', 'm2'], [isEn ? 'I guess M1 contains' : '我猜 M1 里有', 'm1']].forEach(function (o) {
          var op = doc.createElement('option');
          op.value = o[1];
          op.textContent = o[0] + ' …';
          w.appendChild(op);
        });
      })();
      el('otp-key').addEventListener('click', setup);
      el('otp-pair').addEventListener('click', function () {
        pi = (pi + 1) % PAIRS.length;
        setup();
      });
      el('otp-crib').addEventListener('input', rebuildPos);
      el('otp-solve').addEventListener('click', function () {
        solved = !solved;
        render();
      });
      el('otp-drag').addEventListener('click', function () {
        var crib = el('otp-crib').value.replace(/[^\x20-\x7E]/g, '');
        var v = el('otp-verdict');
        if (!crib.length) {
          v.textContent = isEn
            ? 'Type a crib first — a likely word or phrase (a single space is the classic starter).'
            : '先输入一个 crib——一个可能出现的词或短语（单个空格是经典开场）。';
          return;
        }
        var which = el('otp-which').value;
        var p = parseInt(el('otp-pos').value, 10);
        if (isNaN(p) || p < 0) p = 0;
        var cb = chrs(crib);
        var seg = X.slice(p, p + cb.length).map(function (b, i) { return b ^ cb[i]; });
        var cand = txt(seg);
        var guess = which === 'm2' ? 'M2' : 'M1';
        var other = which === 'm2' ? 'M1' : 'M2';
        var html;
        if (solved) {
          var real = which === 'm2' ? PAIRS[pi].m2.slice(p, p + cb.length) : PAIRS[pi].m1.slice(p, p + cb.length);
          var realOther = which === 'm2' ? PAIRS[pi].m1.slice(p, p + cb.length) : PAIRS[pi].m2.slice(p, p + cb.length);
          var good = real.toUpperCase() === crib.toUpperCase();
          html = isEn
            ? 'If ' + guess + '[' + p + '..' + (p + cb.length) + '] = "<b>' + esc(crib) + '</b>", then ' + other + ' there = "<b>' + esc(cand) + '</b>"' + (good
              ? ' — guess verified ✓ the other side really reads "' + esc(realOther) + '"'
              : ' — but the real ' + guess + ' there is "' + esc(real) + '"; move on')
            : '若 ' + guess + ' 第 ' + p + ' 位起 = "<b>' + esc(crib) + '</b>" ⇒ ' + other + ' 同区间 = "<b>' + esc(cand) + '</b>"' + (good
              ? '——猜中了 ✓ 另一份明文对应段实为 "' + esc(realOther) + '"'
              : '——但 ' + guess + ' 该处实为 "' + esc(real) + '"，换个位置继续');
        } else {
          html = isEn
            ? 'If ' + guess + '[' + p + '..' + (p + cb.length) + '] = "<b>' + esc(crib) + '</b>", then ' + other + ' there = "<b>' + esc(cand) + '</b>"' + (isLikely(cand)
              ? ' 😉 that reads like language — snowball it into the next crib'
              : ' — gibberish so far; try another position or word')
            : '若 ' + guess + ' 第 ' + p + ' 位起 = "<b>' + esc(crib) + '</b>" ⇒ ' + other + ' 同区间 = "<b>' + esc(cand) + '</b>"' + (isLikely(cand)
              ? ' 😉 读起来像语言——把它当作下一个 crib 滚雪球'
              : '——暂时是乱码，换个位置或换个词试试');
        }
        v.innerHTML = html;
      });
      setup();
    });

    /* ---------- 🧮 DH 参数验证 ---------- */
    LAZY('pl-dhpt', function () {
      el('dhpt-intro').textContent = L(LAB.dhpIntro);
      el('dhpt-note').textContent = L(LAB.dhpNote);
      function isPrimeNum(n) {
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        for (var d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
        return true;
      }
      function distinctPrimeFactors(n) {
        var out = [];
        for (var d = 2; d * d <= n; d++) {
          if (n % d === 0) {
            out.push(d);
            while (n % d === 0) n /= d;
          }
        }
        if (n > 1) out.push(n);
        return out;
      }
      function mpow(b, e, m) {
        var out = 1;
        b %= m;
        while (e > 0) {
          if (e & 1) out = (out * b) % m;
          b = (b * b) % m;
          e >>= 1;
        }
        return out;
      }
      function run(p, g) {
        if (!isNaN(p) && !isNaN(g)) {
          var rows = [];
          var okP = isPrimeNum(p);
          rows.push({ k: isEn ? 'p primality' : 'p 素性', v: okP ? '✓ prime' : (p < 2 ? '✗ p < 2' : '✗ not prime'), gd: okP });
          var okSafe = okP && p > 3 && isPrimeNum((p - 1) / 2);
          rows.push({ k: isEn ? 'safe prime p=2q+1 (q prime)' : '安全素数 p=2q+1（q 为素数）', v: okSafe ? '✓ q = ' + ((p - 1) / 2) + ' is prime' : '✗ (p-1)/2 not prime', gd: okSafe });
          var okG = g >= 2 && g <= p - 2;
          rows.push({ k: isEn ? 'g in [2, p-2]' : 'g ∈ [2, p−2]', v: okG ? '✓ inside range' : '✗ degenerate (g=1 or beyond)', gd: okG });
          var okOrd = false, ordNote = '';
          if (okG && okP) {
            var fs = distinctPrimeFactors(p - 1);
            okOrd = fs.every(function (r) { return mpow(g, (p - 1) / r, p) !== 1; });
            ordNote = okOrd ? '✓ order = ' + (p - 1) + ' (full generator)'
              : '✗ order < p-1 — small-subgroup trap window';
          }
          rows.push({ k: isEn ? 'order of g == p-1' : 'g 的阶 = p−1（真生成元）', v: okOrd ? ordNote : (okP ? ordNote : (isEn ? '— skip (p invalid)' : '— 跳过（p 无效）')), gd: okOrd });
          var allOk = okP && okSafe && okG && okOrd;
          var h = '';
          rows.forEach(function (r) {
            h += '<tr class="' + (r.gd ? 'ok' : 'bad') + '"><td>' + r.k + '</td><td>' + r.v + '</td></tr>';
          });
          h += '<tr><td colspan="2" class="' + (allOk ? 'ok' : 'bad') + '">' +
            (allOk
              ? (isEn ? '✓ Validated parameter set — no small subgroup, no degeneration. For real use: p ≥ 2048 bits (RFC 7919).' : '✓ 参数通过验证——无小阶子群、无退化。现实使用：p ≥ 2048 位（RFC 7919 命名组）。')
              : (isEn ? '✗ Rejected. Never ship unvalidated DH parameters.' : '✗ 拒绝。未经验证的 DH 参数绝不可投入使用。')) +
            '</td></tr>';
          el('dhpt-out').innerHTML = h;
        } else {
          el('dhpt-out').innerHTML = '<tr><td colspan="2" class="bad">' + (isEn ? '✗ Enter integers for p and g.' : '✗ 请输入整数 p 与 g。') + '</td></tr>';
        }
      }
      el('dhpt-run').addEventListener('click', function () {
        run(parseInt(el('dhpt-p').value, 10), parseInt(el('dhpt-g').value, 10));
      });
      /* 预设按钮挂载区 */
      var presetBox = el('dhpt-presets');
      presetBox.innerHTML = '';
      (LAB.dhpPresets || []).forEach(function (pr) {
        var b = document.createElement('button');
        b.className = 'btn';
        b.textContent = pr.tag;
        b.addEventListener('click', function () {
          el('dhpt-p').value = String(pr.p);
          el('dhpt-g').value = String(pr.g);
          run(pr.p, pr.g);
        });
        presetBox.appendChild(b);
      });
      el('dhpt-p').value = '23';
      el('dhpt-g').value = '5';
      run(23, 5);
    });


    /* ---------- 🔗 哈希链：一次一验的顺序认证 ---------- */
    LAZY('pl-hashchain', function () {
      el('hc-intro').textContent = L(LAB.hcIntro);
      el('hc-note').textContent = L(LAB.hcNote);
      var LEN = 6, chain = [], srv = LEN, last = null;
      function h(v) { return H('hc:' + v); }
      function log(line, cls) {
        var d = document.createElement('div');
        if (cls) d.className = cls;
        d.textContent = line;
        el('hc-log').appendChild(d);
      }
      function render() {
        var h = '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'server holds' : '服务器持有') + '</span><span class="pl-cells mono">c' + srv + ' = ' + chain[srv] + '</span></div>';
        h += '<div class="pl-r"><span class="pl-rl">' + (isEn ? 'chain (top = next to reveal)' : '链（靠上 = 下一步要出示的）') + '</span><span class="pl-cells mono">';
        for (var i = LEN; i >= 1; i--) {
          var shown = i >= srv;
          h += (i === srv ? '<b>[' : '') + 'c' + i + '=' + (shown ? chain[i] : '████') + (i === srv ? ']</b> ' : ' ');
        }
        h += '</span></div>';
        el('hc-chain').innerHTML = h;
      }
      function fresh() {
        chain = [];
        chain[0] = ('000000' + String(Math.floor(Math.random() * 1e6))).slice(-6);
        for (var i = 1; i <= LEN; i++) chain[i] = h(chain[i - 1]);
        srv = LEN; last = null;
        el('hc-log').innerHTML = '';
        render();
      }
      el('hc-next').addEventListener('click', function () {
        if (srv <= 1) { log(isEn ? 'All links revealed — the chain is spent. Reset for a new one.' : '六环已全部出示——链已用完，请换新链。'); return; }
        var v = chain[srv - 1];
        log(isEn ? 'User reveals c' + (srv - 1) + ' = ' + v + '  →  server checks H(c' + (srv - 1) + ') == c' + srv + ' … ' + (h(v) === chain[srv] ? '✓ match' : '✗ mismatch') : '用户出示 c' + (srv - 1) + ' = ' + v + ' → 服务器验证 H(c' + (srv - 1) + ') == c' + srv + ' …… ' + (h(v) === chain[srv] ? '✓ 通过' : '✗ 不符'));
        srv--; last = v;
        render();
        if (srv > 0) log(isEn ? 'Accepted — server now holds c' + srv + '. But nobody can compute c' + (srv - 1) + ' from c' + srv + ': that is the one-way wall.' : '通过——服务器现在持有 c' + srv + '。但任何人都无法从 c' + srv + ' 算出 c' + (srv - 1) + '：一堵单向墙。');
      });
      el('hc-replay').addEventListener('click', function () {
        if (last === null) { log(isEn ? 'Reveal a link first.' : '请先出示一环。'); return; }
        log(isEn ? 'Attacker replays the same value ' + last + '  →  server checks H(' + last + ') == ' + last + ' …' : '攻击者重放同一值 ' + last + ' → 服务器验证 H(' + last + ') == ' + last + ' ……');
        log(isEn ? '✗ Rejected. A hash of X is never X itself — a used link cannot be spent twice. That is the point of the word "one-time".' : '✗ 拒绝。哈希值几乎不可能等于自身——用过的环不能再花第二次。这就是「一次一验」的含义。', 'bad');
      });
      el('hc-forge').addEventListener('click', function () {
        if (srv <= 1) { log(isEn ? 'The chain is spent — press reset first.' : '链已用完——请先换新链。'); return; }
        var v = chain[srv - 1];
        var fake = v.slice(0, -1) + (v.charCodeAt(v.length - 1) === 48 ? '1' : '0');
        log(isEn ? 'Attacker guesses "' + fake + '" (one char off)  →  H = ' + h(fake) + ' ≠ ' + chain[srv] + '  →  server rejects.' : '攻击者猜值 "' + fake + '"（差一个字符）→ H = ' + h(fake) + ' ≠ ' + chain[srv] + ' → 服务器拒绝。', 'bad');
      });
      el('hc-reset').addEventListener('click', function () { fresh(); log(isEn ? 'New chain: c0 (secret seed) → c1 → … → c6. Server holds c6.' : '新链已生成：c0（秘密种子）→ c1 → … → c6。服务器持有 c6。'); });
      fresh();
      log(isEn ? 'Chain ready. Server holds c6; the user knows every link. Press "reveal next link".' : '新链就绪。服务器持有 c6；用户知道所有环节。按「出示下一环」。');
    });

    /* ---------- 📕 教科书 RSA：字典攻击与语义安全 ---------- */
    LAZY('pl-rsadict', function () {
      el('rd-intro').textContent = L(LAB.rdIntro);
      el('rd-note').textContent = L(LAB.rdNote);
      var P = 97, Q = 113, N = P * Q, E = 17;
      var LO = 100, HI = 170;
      var lastC = null, lastM = null;
      function out(rows) {
        el('rd-out').innerHTML = rows.map(function (r) {
          return '<tr class="' + (r.gd === undefined ? '' : (r.gd ? 'ok' : 'bad')) + '"><td>' + r.k + '</td><td class="mono">' + r.v + '</td></tr>';
        }).join('');
      }
      el('rd-enc').addEventListener('click', function () {
        var m = parseInt(el('rd-m').value, 10);
        if (isNaN(m) || m < 0 || m >= N) { out([{ k: isEn ? 'input' : '输入', v: isEn ? 'Enter an integer 0 ≤ m < ' + N : '请输入 0 ≤ m < ' + N + ' 的整数', gd: false }]); return; }
        var c = modPow(m, E, N);
        out([
          { k: isEn ? 'public key' : '公钥', v: 'n = ' + N + ' (' + P + '×' + Q + '), e = ' + E },
          { k: isEn ? 'plaintext m' : '明文 m', v: m },
          { k: isEn ? 'ciphertext (textbook)' : '密文（教科书式）', v: 'c = ' + m + '^' + E + ' mod ' + N + ' = ' + c },
          { k: isEn ? 'remark' : '提示', v: isEn ? 'Deterministic: same m → same c, every single time.' : '确定性：同一 m 永远得到同一 c。' }
        ]);
      });
      el('rd-dict').addEventListener('click', function () {
        var m = parseInt(el('rd-m').value, 10);
        if (isNaN(m) || m < LO || m > HI) { out([{ k: isEn ? 'attack' : '攻击', v: isEn ? 'Assume the attacker knows m ∈ [' + LO + ',' + HI + '] (an order number). Pick m inside that range first.' : '假设攻击者已知明文区间 [' + LO + ',' + HI + ']（如订单号）。请先把 m 选进该区间。', gd: false }]); return; }
        var c = modPow(m, E, N), found = -1, tries = 0;
        for (var x = LO; x <= HI; x++) { tries++; if (modPow(x, E, N) === c) { found = x; break; } }
        if (found === m) {
          out([
            { k: isEn ? 'ciphertext captured' : '截获的密文', v: c },
            { k: isEn ? 'brute force over [' + LO + ',' + HI + ']' : '对区间 [' + LO + ',' + HI + '] 枚举', v: tries + ' ' + (isEn ? 'candidates' : '次尝试') },
            { k: isEn ? 'result' : '结果', v: (isEn ? '💥 Recovered m = ' : '💥 破译出明文 m = ') + found + ' — ' + (isEn ? 'the "encryption" kept nothing secret.' : '「加密」没有守住任何秘密。'), gd: true }
          ]);
        }
      });
      el('rd-rand').addEventListener('click', function () {
        var m = parseInt(el('rd-m').value, 10);
        if (isNaN(m) || m < 0 || m >= N) { return; }
        var r = Math.floor(Math.random() * 64);
        var x = m * 64 + r;
        var c = modPow(x, E, N);
        lastC = c; lastM = m;
        out([
          { k: isEn ? 'plaintext' : '明文', v: m },
          { k: isEn ? 'random padding r' : '随机填充 r', v: r },
          { k: isEn ? 'encrypted as x = m·64 + r' : '实际加密 x = m·64 + r', v: x },
          { k: isEn ? 'ciphertext (padded)' : '密文（填充版）', v: c },
          { k: isEn ? 'remark' : '提示', v: isEn ? 'Try again: the same m gives a different c — randomness is what semantic security requires.' : '再点一次：同一 m 得到不同的 c——随机性正是语义安全的要求。' }
        ]);
      });
      el('rd-brutec').addEventListener('click', function () {
        if (lastC === null) { out([{ k: isEn ? 'attack' : '攻击', v: isEn ? 'First click "randomized pad" to produce a padded ciphertext to attack.' : '请先点「随机填充版」生成一个待攻击的填充密文。', gd: false }]); return; }
        var found = -1, tries = 0;
        outer:
        for (var mm = LO; mm <= HI; mm++) {
          for (var rr = 0; rr < 64; rr++) {
            tries++;
            if (modPow(mm * 64 + rr, E, N) === lastC) { found = mm; break outer; }
          }
        }
        out([
          { k: isEn ? 'ciphertext under attack' : '被攻击的密文', v: lastC },
          { k: isEn ? 'full enumeration of m·64+r' : '枚举全部 m·64+r 组合', v: tries + ' / ' + (HI - LO + 1) * 64 },
          { k: isEn ? 'result' : '结果', v: found >= 0 ? ('💥 ' + (isEn ? 'm = ' : 'm = ') + found + ' — ' + (isEn ? 'a 14-bit toy modulus cannot hide even padded messages; real OAEP uses ~2048-bit n with padding no one can enumerate.' : '14 位玩具模数连填充消息也藏不住；真实 OAEP 用 ~2048 位模数与无法枚举的随机填充。')) : (isEn ? '✗ not found' : '✗ 未命中'), gd: true }
        ]);
      });
      el('rd-m').value = '137';
      out([{ k: isEn ? 'ready' : '就绪', v: isEn ? 'n = ' + N + ' (97×113), e = ' + E + ', known plaintext interval [' + LO + ',' + HI + ']' : 'n = ' + N + '（97×113），e = ' + E + '，已知明文区间 [' + LO + ',' + HI + ']' }]);
    });

    el('pl-ready').textContent = '20';
  };
})();
