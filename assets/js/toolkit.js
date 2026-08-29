/* 密码工具箱专题页：现实世界的工具与标准（渲染外置，双语，动态）
   内容线：传输 TLS / 密钥身份 / 口令登录 / 哈希完整性 / 国密四件套 / 基线与前沿
   规则：标准号与年份为史实；命令为常见工具的真实用法；链接全部指向站内页面。 */
(function () {
  function render() {
    var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
    function L(o) { return isEn ? o.en : o.zh; }
    var host = document.getElementById('tk-root');
    if (!host) return;
    /* 埋点：专题页访问成就 */
    try { localStorage.setItem('arcade_toolkit_viewed', '1'); } catch (e) {}

    function card(ic, t, d, code, links) {
      return {
        ic: ic, t: t, d: d, code: code || null,
        links: links || []
      };
    }
    function link(t, href) { return { t: t, href: href }; }

    var SECTIONS = [
      {
        ic: '🔒', t: L({ zh: '① 传输与信道', en: '① Transport & Channels' }),
        d: L({ zh: '网站的 HTTPS、应用的 TLS 连接、证书信任链——现代网络的第一道防线，也是「我被劫持了吗」的答案所在。', en: 'HTTPS sites, app TLS connections, the certificate trust chain — the first line of the modern network and the answer to "was I hijacked?".' }),
        cards: [
          card('🌐', L({ zh: 'TLS 1.3', en: 'TLS 1.3' }),
            L({ zh: '现代网络传输的默认通道（RFC 8446，2018）：握手只要一个往返，密钥协商用临时 DH（有限域或椭圆曲线）；0-RTT 恢复飞快，前向保密是强制项。', en: 'The default tunnel of the modern web (RFC 8446, 2018): one round trip, ephemeral finite-field or elliptic-curve DH key agreement; fast 0-RTT resumption — and forward secrecy is mandatory.' }),
            'openssl s_client -connect www.example.com:443 -tls1_3',
            [link(L({ zh: '🧩 协议实验室（TLS 握手演示）', en: '🧩 Protocol Lab (TLS handshake)' }), 'protocols.html'), link(L({ zh: '🤝 DH 密钥交换（游戏）', en: '🤝 DH Key Exchange (game)' }), 'games/dh-handshake/')]),
          card('🧬', L({ zh: 'AEAD：AES-GCM / ChaCha20-Poly1305', en: 'AEAD: AES-GCM / ChaCha20-Poly1305' }),
            L({ zh: '把「加密」与「防篡改」合并成一步：GCM 是 CTR 模式 + GMAC 认证标签；ChaCha20-Poly1305 为没有 AES 硬件加速的设备而生（RFC 8439）。TLS 1.3 的安全套件只留 AEAD。', en: 'Encryption and tamper-detection united: GCM is CTR mode plus the GMAC tag; ChaCha20-Poly1305 (RFC 8439) serves devices without AES hardware. TLS 1.3 suites are AEAD-only.' }),
            'openssl list -cipher-algorithms | findstr -i chacha',
            [link(L({ zh: '🧪 分组模式实验室（游戏）', en: '🧪 Block Modes Lab (game)' }), 'games/block-modes/'), link(L({ zh: '🔵 协议实验室', en: '🔵 Protocol Lab' }), 'protocols.html')]),
          card('🏛️', L({ zh: 'X.509 证书链与 Let’s Encrypt', en: 'X.509 chains & Let’s Encrypt' }),
            L({ zh: '你是谁、谁给你背书、谁信任谁——证书链把「公钥 = 实体」的信任交给 CA 体系。证书本身不保密，只保真；2015 年起 Let’s Encrypt 免费签发，加密普及的推手。', en: 'Who you are, who vouches for you, who trusts whom — the certificate chain delegates "this public key is that entity" to CAs. Certificates authenticate, they never hide; since 2015 Let’s Encrypt has signed for free.' }),
            'openssl x509 -in cert.pem -noout -issuer -subject',
            [link(L({ zh: '📎 密件：Let’s Encrypt', en: '📎 Artifact: Let’s Encrypt' }), 'artifacts.html'), link(L({ zh: '🧠 测验场（证书题）', en: '🧠 Quiz (certificates)' }), 'quiz.html')]),
          card('🚨', L({ zh: '中间人与 HSTS', en: 'MITM & HSTS' }),
            L({ zh: '公共 Wi-Fi 劫持、伪造证书、DNS 摆刀——中间人攻击的剧本都围绕「让你以为连的是真网站」。HSTS 让浏览器强制 HTTPS 并记住域名，首访也不落单。', en: 'Wi-Fi hijacks, rogue certs, DNS tricks — every MITM script makes a fake site look right. HSTS forces HTTPS for a domain and remembers it, covering even the first visit.' }),
            'Strict-Transport-Security: max-age=31536000; includeSubDomains',
            [link(L({ zh: '🕵️ 协议实验室（DH 中间人演示）', en: '🕵️ Protocol Lab (DH MITM)' }), 'protocols.html'), link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html')])
        ]
      },
      {
        ic: '🗝️', t: L({ zh: '② 密钥与身份', en: '② Keys & Identity' }),
        d: L({ zh: '密钥不是「生成好就完事」：轮换、撤销、恢复、审计四件事在日常运维里一样都不能少。', en: 'A key is never "generated and done": rotation, revocation, recovery and audit are daily processes.' }),
        cards: [
          card('🖥️', L({ zh: 'SSH 密钥：ed25519', en: 'SSH keys: ed25519' }),
            L({ zh: '服务器登录的事实标准。Ed25519（RFC 8032）签名快、公钥短、安全余量大——一条命令生成，密钥绝不出机。', en: 'The de facto standard for server login. Ed25519 (RFC 8032) signs fast with short keys — one command, and the private key never leaves the machine.' }),
            'ssh-keygen -t ed25519 -a 100',
            [link(L({ zh: '✉️ 密钥邮件（游戏）', en: '✉️ PGP Mail (game)' }), 'games/pgp-mail/'), link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html')]),
          card('💌', L({ zh: 'OpenPGP / GnuPG', en: 'OpenPGP / GnuPG' }),
            L({ zh: '加密邮件与文件签名的经典标准（RFC 4880，新版 RFC 9580）：每人一对密钥，信任在密钥服务器与彼此背书之间织网。GPG 是参考实现，支持子密钥分离。', en: 'The classic standard for encrypted mail and signed files (RFC 4880; updated RFC 9580): one pair per user, trust woven between key servers and endorsements. GnuPG is the reference implementation.' }),
            'gpg --gen-key',
            [link(L({ zh: '✉️ PGP 邮件（游戏）', en: '✉️ PGP Mail (game)' }), 'games/pgp-mail/'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('📟', L({ zh: 'TOTP 一次性密码', en: 'TOTP one-time passwords' }),
            L({ zh: '基于共享密钥与当前时间切片（RFC 6238）的动态口令：认证器 App 每 30 秒一变。密钥不泄、时间同步，才能挡住登录重放。', en: 'Time-sliced one-time passwords from a shared seed (RFC 6238): authenticator apps rotate every 30 seconds. Keep the seed safe and the clock honest, and replay stops.' }),
            'oathtool --totp -b BASE32KEY',
            [link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🧾', L({ zh: '密钥生命周期', en: 'Key lifecycle' }),
            L({ zh: '生成只是第一分钟：轮换计划、吊销机制、丢失恢复、审计日志——公钥指纹（人类可读化）就是日常审计的最小单位。', en: 'Generation is the first minute only: rotation schedule, revocation path, recovery drill, audit logs — the human-readable fingerprint is your smallest audit unit.' }),
            'ssh-keygen -lf id_ed25519.pub -E sha256',
            [link(L({ zh: '👤 人物志', en: '👤 People' }), 'people.html'), link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html')])
        ]
      },
      {
        ic: '🔑', t: L({ zh: '③ 口令与登录', en: '③ Passwords & Sign-in' }),
        d: L({ zh: '口令是最后一层人肉防线：服务端怎么存、你这边怎么生成、登录时怎么验——三层都对了才叫安全。', en: 'Passwords are the last human gate: storage, generation, verification — only when all three are right is it secure.' }),
        cards: [
          card('📱', L({ zh: 'Passkeys / WebAuthn', en: 'Passkeys / WebAuthn' }),
            L({ zh: '把口令换成「设备 + 生物识别」：FIDO2/WebAuthn 把挑战与源站域名绑定，钓鱼站拿回应答也无法回放。2022 年起主流平台全量支持——口令退场的开始。', en: 'Passkeys replace passwords with device plus biometrics: FIDO2/WebAuthn binds the challenge to the origin, so phishing sites cannot replay it. Mainstream since 2022 — the start of password retirement.' }),
            'navigator.credentials.get({ publicKey: { … } })',
            [link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🧱', L({ zh: '口令哈希：argon2id', en: 'Password hashing: argon2id' }),
            L({ zh: '服务端绝不能明文存口令。argon2id（2015 年 Password Hashing Competition 冠军）把内存、时间、并行度设为显式参数，让 GPU 暴力破解的成本曲线陡升。', en: 'Servers must never store plaintext passwords. argon2id (winner of the 2015 Password Hashing Competition) makes memory, time and parallelism explicit — steepening the GPU brute-force cost curve.' }),
            'argon2id  v=19  m=19456KiB  t=2  p=1',
            [link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🎲', L({ zh: '口令熵与词组口令', en: 'Entropy & passphrases' }),
            L({ zh: '「强度」= 熵 = 字符集 × 长度。四个随机词组成的词组在熵与可记忆性上双杀「P@ssw0rd!」——随机性优先，花样装饰次之。', en: 'Strength is entropy: charset × length. Four random words beat "P@ssw0rd!" on both entropy and memorability — randomness first, adornment never.' }),
            'openssl rand -base64 24',
            [link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🗄️', L({ zh: '密码管理器', en: 'Password managers' }),
            L({ zh: '一个主口令，管所有随机口令：每个站点的口令互不相同，单站泄露不会扩散；主口令本身交由内存困难派生与设备密钥保护。', en: 'One master password over many random ones: per-site uniqueness stops single-site leaks from spreading, while memory-hard derivation plus device keys protect the master itself.' }),
            'pwgen -s 24',
            [link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')])
        ]
      },
      {
        ic: '🧮', t: L({ zh: '④ 哈希与完整性', en: '④ Hashes & Integrity' }),
        d: L({ zh: '「这文件没被动过」「这消息就是你发的」——哈希与消息认证码回答这两个问题，也是软件供应链的第一道保险。', en: '"This file is untouched", "this message is from you" — hashes and MACs answer both, and underwrite the software supply chain.' }),
        cards: [
          card('⚙️', L({ zh: 'SHA-256 / SHA-2', en: 'SHA-256 / SHA-2' }),
            L({ zh: '通用哈希的默认答案（FIPS 180-4）：压缩函数迭代，输出 256 位摘要；文件校验、证书指纹、日志完整性都靠它。SHA-1 已谢幕（2017 年 SHAttered 给出实际碰撞）。', en: 'The default general-purpose hash (FIPS 180-4): iterated compression, 256-bit output; file checks, cert fingerprints, log integrity. SHA-1 stepped down after SHAttered produced real collisions in 2017.' }),
            'sha256sum file.iso',
            [link(L({ zh: '🧪 破译工坊', en: '🧪 Workshop' }), 'workshop.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🕳️', L({ zh: 'SHA-3', en: 'SHA-3' }),
            L({ zh: '另一条血统：Keccak 海绵构造（FIPS 202，2015）。结构与 SHA-2 完全不同，天然抗长度扩展攻击，并支持可扩展输出 SHAKE128/256。', en: 'A different bloodline: the Keccak sponge construction (FIPS 202, 2015). Structurally unlike SHA-2, naturally safe against length extension, with extendable output SHAKE128/256.' }),
            'openssl dgst -sha3-256 file',
            [link(L({ zh: '🧪 破译工坊', en: '🧪 Workshop' }), 'workshop.html'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🔏', L({ zh: 'HMAC', en: 'HMAC' }),
            L({ zh: '给消息盖「密钥戳」：HMAC（RFC 2104）证明消息来自持有密钥的一方且未被改动；验签用 constant-time 比较防时序窃取。', en: 'A keyed stamp on a message: HMAC (RFC 2104) proves origin from the key holder and non-alteration; verification compares in constant time against timing leaks.' }),
            'openssl dgst -sha256 -hmac "MY KEY" msg',
            [link(L({ zh: '🧪 分组模式实验室（游戏）', en: '🧪 Block Modes Lab (game)' }), 'games/block-modes/'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🧂', L({ zh: '盐、指纹与校验', en: 'Salt, fingerprints & verification' }),
            L({ zh: '哈希是确定的：同样输入永远同样摘要——所以口令要加盐、签名包要指纹、发行公告要贴摘要，防的都是「重放」与「替换」。', en: 'Hashes are deterministic: same input, same digest forever. Salt passwords, fingerprint keys, publish hashes for distributions — all against replay and substitution.' }),
            'sha256sum -c SHA256SUMS',
            [link(L({ zh: '📎 密件册', en: '📎 Artifacts' }), 'artifacts.html'), link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html')])
        ]
      },
      {
        ic: '🏮', t: L({ zh: '⑤ 国密四件套', en: '⑤ The SM Family' }),
        d: L({ zh: 'SM2 / SM3 / SM4 / ZUC——中国国家密码管理机构的四件标准武器，分别覆盖公钥、哈希、对称与序列密码。', en: 'SM2 / SM3 / SM4 / ZUC: China’s four national-standard families covering public-key, hashing, symmetric and stream ciphers.' }),
        cards: [
          card('🇨🇳', L({ zh: 'SM4', en: 'SM4' }),
            L({ zh: '国密分组密码（GB/T 32907）：128 位密钥与分组、32 轮 Feistel 结构，安全画像对齐 AES-128；智能卡与行业芯片里最常见。', en: 'The national block cipher (GB/T 32907): 128-bit key and block, 32-round Feistel — an AES-128-class profile, ubiquitous in smart cards and industrial chips.' }),
            'GB/T 32907 · 128-bit block · 32 rounds',
            [link(L({ zh: '🀄 国密网关（游戏）', en: '🀄 GM Gateway (game)' }), 'games/gm-gateway/'), link(L({ zh: '🏮 中华密码史', en: '🏮 Chinese Crypto' }), 'zh-crypto.html')]),
          card('📚', L({ zh: 'SM3', en: 'SM3' }),
            L({ zh: '国密哈希（GB/T 32905）：256 位摘要，与 SM2 组成《密码法》下的签名组合；算法描述公开、实现开源。', en: 'The national hash (GB/T 32905): 256-bit digest; paired with SM2 it forms the signing stack referenced by the PRC Cryptography Law. Spec public, implementations open.' }),
            'GB/T 32905 · 256-bit digest',
            [link(L({ zh: '🀄 国密网关（游戏）', en: '🀄 GM Gateway (game)' }), 'games/gm-gateway/'), link(L({ zh: '🏮 中华密码史', en: '🏮 Chinese Crypto' }), 'zh-crypto.html')]),
          card('🛡️', L({ zh: 'SM2', en: 'SM2' }),
            L({ zh: '国密椭圆曲线公钥（GB/T 32918）：SM2 曲线上的签名与密钥交换，是国产 CA 与政务系统的标准后端。', en: 'The national elliptic-curve public-key standard (GB/T 32918): signatures and key exchange over the SM2 curve — the standard backend of domestic CAs and government systems.' }),
            'GB/T 32918 · 256-bit curve',
            [link(L({ zh: '🀄 国密网关（游戏）', en: '🀄 GM Gateway (game)' }), 'games/gm-gateway/'), link(L({ zh: '🏮 中华密码史', en: '🏮 Chinese Crypto' }), 'zh-crypto.html')]),
          card('🌀', L({ zh: 'ZUC 祖冲之', en: 'ZUC (Zuchongzhi)' }),
            L({ zh: '国密序列密码：2011 年被 3GPP 采纳为移动通信标准加密算法 128-EEA3 / 128-EIA3，与 SM 系列并行撑起另一条战线。', en: 'The national stream cipher: adopted by 3GPP in 2011 as 128-EEA3 / 128-EIA3 for mobile networks — a parallel front to the SM family.' }),
            '3GPP 128-EEA3 / 128-EIA3',
            [link(L({ zh: '🀄 国密网关（游戏）', en: '🀄 GM Gateway (game)' }), 'games/gm-gateway/'), link(L({ zh: '🏮 中华密码史', en: '🏮 Chinese Crypto' }), 'zh-crypto.html')])
        ]
      },
      {
        ic: '⚛️', t: L({ zh: '⑥ 基线与前沿', en: '⑥ Baselines & Beyond' }),
        d: L({ zh: '经典与量子的换挡期：标准刚落地、混合成默认、迁移有年表——这三张牌是未来十年的技术基线。', en: 'Between classical and quantum: fresh standards, hybrid defaults, a migration timetable — the next decade’s technical baselines.' }),
        cards: [
          card('📜', L({ zh: '后量子标准 FIPS 203/204/205', en: 'Post-quantum: FIPS 203/204/205' }),
            L({ zh: '2024 年 8 月 NIST 发布首批后量子标准：ML-KEM（Kyber，FIPS 203）做密钥封装、ML-DSA（Dilithium，FIPS 204）做签名、SLH-DSA（SPHINCS+，FIPS 205）做保守的哈希基签名——格密码正式上岗。', en: 'NIST published the first post-quantum standards in August 2024: ML-KEM (Kyber, FIPS 203) for key encapsulation, ML-DSA (Dilithium, FIPS 204) and the conservative hash-based SLH-DSA (SPHINCS+, FIPS 205) for signatures.' }),
            'FIPS 203 · 204 · 205 (2024)',
            [link(L({ zh: '🧬 BB84 量子密钥（游戏）', en: '🧬 BB84 Quantum Keys (game)' }), 'games/bb84/'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🧪', L({ zh: '混合方案', en: 'Hybrid schemes' }),
            L({ zh: '过渡期默认「先混合、后纯 PQ」：TLS 把经典 X25519 与 ML-KEM 拼在一起，攻击者必须两套都破——没有系统独自背全部鸡蛋。', en: 'Hybrid-first during transition: TLS combines classic X25519 with ML-KEM; an attacker must break both — no single unproven system carries the load.' }),
            'X25519 + ML-KEM (Kyber768)',
            [link(L({ zh: '🤝 DH 密钥交换（游戏）', en: '🤝 DH Key Exchange (game)' }), 'games/dh-handshake/'), link(L({ zh: '📖 密码学词典', en: '📖 Glossary' }), 'glossary.html')]),
          card('🔮', L({ zh: '前向保密', en: 'Forward secrecy' }),
            L({ zh: '会话密钥每次连接临时生成（DHE/ECDHE）：长期私钥今日泄露，历史流量依旧安全——TLS 1.3 已把它从可选变强制。', en: 'Session keys are ephemeral per connection (DHE/ECDHE): leak the long-term key today, past traffic stays safe. TLS 1.3 moved this from optional to mandatory.' }),
            'Ephemeral DH · no static sessions',
            [link(L({ zh: '🤝 DH 密钥交换（游戏）', en: '🤝 DH Key Exchange (game)' }), 'games/dh-handshake/'), link(L({ zh: '🧩 协议实验室', en: '🧩 Protocol Lab' }), 'protocols.html')]),
          card('⏳', L({ zh: '量子威胁时间表', en: 'The quantum clock' }),
            L({ zh: '「先收割、后解密」（HNDL）：攻击者此刻录下加密流量，等量子计算机成熟再回放。迁移从现在开始，NIST 指向 2035 年前完成大规模系统替换。', en: 'Harvest now, decrypt later: record the traffic today, decrypt once quantum machines mature. Migration starts now — NIST points at 2035 for large-system replacement.' }),
            'HNDL · migrate by 2035',
            [link(L({ zh: '🧬 BB84 量子密钥（游戏）', en: '🧬 BB84 Quantum Keys (game)' }), 'games/bb84/'), link(L({ zh: '🧠 测验场', en: '🧠 Quiz' }), 'quiz.html')])
        ]
      }
    ];

    var html = SECTIONS.map(function (sec) {
      var cardsHtml = sec.cards.map(function (c) {
        var codeHtml = c.code ? '<div class="tk-code">$ ' + c.code + '</div>' : '';
        var linksHtml = c.links.length ? '<div class="tk-links">' + c.links.map(function (l) {
          return '<a class="tk-l" href="' + l.href + '">' + l.t + '</a>';
        }).join('') + '</div>' : '';
        return '<div class="tk-card">' +
          '<div class="tk-cic">' + c.ic + '</div>' +
          '<div class="tk-ct">' + c.t + '</div>' +
          '<div class="tk-cd">' + c.d + '</div>' +
          codeHtml + linksHtml + '</div>';
      }).join('');
      return '<section class="tk-sec">' +
        '<div class="tk-t">' + sec.ic + ' ' + sec.t + '</div>' +
        '<div class="tk-d">' + sec.d + '</div>' +
        '<div class="tk-grid">' + cardsHtml + '</div></section>';
    }).join('');
    host.innerHTML = html;
  }
  window.TOOLKIT = { render: render };
})();
