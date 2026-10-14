/* 由 gen-site-bundle.js 从仓库 MD 生成 —— 站点知识图谱页加载用（勿手改）
2026-10-13T23:19:18.468Z */
window.KNOWLEDGE = {
  "generated": "2026-10-13T23:19:18.468Z",
  "source": "cryptography-decode-history（Markdown 真源）",
  "stats": {
    "domains": 24,
    "eras": 14,
    "people": 87,
    "artifacts": 48,
    "machines": 7,
    "terms": 282
  },
  "domains": [
    {
      "id": "d01",
      "title": "基础与术语",
      "titleEn": "Foundations & Terminology",
      "zh": "密码学的地基：把可读的**明文**变成不可读的**密文**（加密），再变回来（解密），全程由**密钥**控制。要分清两件事——**密码（cipher）改字母、编码（code）改单词**；**替换**换字母、**换位**挪位置。一切现代加密都站在这棵树的两条主干上。",
      "en": "The bedrock: turn readable **plaintext** into unreadable **ciphertext** (encrypt) and back (decrypt), driven by a **key**. Keep two things straight — a **cipher** scrambles letters, a **code** swaps words; **substitution** changes letters, **transposition** moves them. Every modern scheme stands on these two trunks.",
      "termCount": 34,
      "terms": [
        "Plaintext",
        "Ciphertext",
        "Key",
        "Cipher",
        "Code",
        "Cryptanalysis",
        "Cryptography",
        "Steganography",
        "Bletchley Park",
        "Room 40",
        "Colossus",
        "SIS",
        "Bacon's Biliteral",
        "Morse Code",
        "Baudot Code",
        "Polybius Square",
        "Decryption",
        "Encryption",
        "Steganographic Image",
        "Caesar Box",
        "Authentication",
        "Integrity",
        "Non-repudiation",
        "Confusion",
        "Diffusion",
        "NSA",
        "GCHQ",
        "NIST",
        "VENONA Project",
        "One-Way Function",
        "Trapdoor Function",
        "Discrete Logarithm",
        "Chinese Remainder Theorem",
        "First Computers (ENIAC/EDSAC)"
      ],
      "proto": 0,
      "work": 3
    },
    {
      "id": "d02",
      "title": "单表替换",
      "titleEn": "Monoalphabetic Substitution",
      "zh": "单表替换：每个字母**永远**映射到同一个字母（凯撒是它的特例，整体平移）。因为明文的字母频率是固定的（英文 e 最高），攻击者只需数密文里哪个字母最频繁就能破——**频率分析**是它的死穴。",
      "en": "Monoalphabetic: every letter maps to the **same** letter forever (Caesar is its special case — a uniform shift). Plaintext letter frequencies are fixed (e is most common in English), so counting the most frequent ciphertext letter breaks it — **frequency analysis** is the fatal flaw.",
      "termCount": 16,
      "terms": [
        "Caesar Cipher",
        "Substitution",
        "Affine Cipher",
        "Yinfu Tally Codes",
        "Yinshu Split Letters",
        "Ziyan Code",
        "Fanqie Code",
        "Nomenclator",
        "Great Cipher of Louis XIV",
        "Homophonic Substitution",
        "Book Cipher",
        "Null Cipher",
        "Homophonic with Nomenclator",
        "Codebook",
        "Navajo Code Talkers",
        "Red Army Radio Cipher"
      ],
      "proto": 0,
      "work": 4
    },
    {
      "id": "d03",
      "title": "多表替换",
      "titleEn": "Polyalphabetic Substitution",
      "zh": "多表替换：用**多张**替换表轮替，同一个字母在不同位置变成不同字母，把字母频率抹平（维吉尼亚、Playfair、Hill 同属此族）。频率分析失灵后，曾长期「不可破」，直到 19 世纪 Kasiski 利用周期重复把它打穿。",
      "en": "Polyalphabetic: rotate through **multiple** substitution tables so the same letter becomes different letters at different positions, flattening letter frequencies (Vigenère, Playfair, Hill). Frequency analysis stops working, so these ciphers stood \"unbreakable\" until Kasiski exploited periodic repeats in the 1800s.",
      "termCount": 12,
      "terms": [
        "Vigenère",
        "Playfair",
        "Hill Cipher",
        "Nihilist Cipher",
        "Two-Square Cipher",
        "Gronsfeld Cipher",
        "Alberti Cipher Disk",
        "Beaufort Cipher",
        "Tabula Recta",
        "Autokey Cipher",
        "Porta Cipher",
        "Four-Square Cipher"
      ],
      "proto": 0,
      "work": 5
    },
    {
      "id": "d04",
      "title": "换位",
      "titleEn": "Transposition",
      "zh": "换位：字母**不变**，只改变它们的**排列顺序**（栅栏、斯巴达密码棒、列方）。它不掩盖字母频率，常与替换组合成混合密码——单用换位极易被破，但与替换结合会大幅增加密钥空间。",
      "en": "Transposition: the letters stay the same, only their **positions** change (rail fence, Spartan scytale, columnar). It hides nothing about letter frequency, so it is usually combined with substitution. Alone it breaks easily; combined it multiplies the key space.",
      "termCount": 8,
      "terms": [
        "Transposition",
        "Rail Fence",
        "ADFGVX",
        "Bifid Cipher",
        "Trifid Cipher",
        "Scytale",
        "Double Transposition",
        "Half-a-Radio"
      ],
      "proto": 0,
      "work": 5
    },
    {
      "id": "d05",
      "title": "转子/机械密码",
      "titleEn": "Rotor & Mechanical Ciphers",
      "zh": "转子/机械密码：用**机电转子**自动完成换位与替换的联动（恩尼格玛、洛伦兹）。恩尼格玛的妙处是加密=解密的对称性，但**密钥设定**（转子序、环位、插线板）成了唯一弱点——波兰数学家的格罗夫与图灵的 Bombe 正是从这里入手。",
      "en": "Rotor & mechanical: electromechanical rotors automate linked substitution and permutation (Enigma, Lorenz). Enigma’s gift was encrypt-equals-decrypt symmetry, but its **key setup** (rotor order, ring settings, plugboard) was the only weak point — Polish grogs and Turing’s Bombe attacked exactly there.",
      "termCount": 8,
      "terms": [
        "Enigma",
        "Bombe",
        "Purple",
        "JN-25",
        "Typex",
        "Hagelin C-38",
        "Rockex Cipher",
        "Combined Cipher Machine (CCM)"
      ],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d06",
      "title": "OTP 与流密码",
      "titleEn": "OTP & Stream Ciphers",
      "zh": "OTP 与流密码：把随机**密钥流**与明文逐位异或。密钥若真随机、只用一次、绝不复用，就达到香农证明的**完美保密**；一旦复用，两条密文异或会直接泄出明文（Venona 的教训）。RC4/ChaCha20 用伪随机流替代真随机，快但有统计偏差的隐患。",
      "en": "OTP & stream ciphers: XOR a random **keystream** with the plaintext. If the key is truly random, used once, never reused, it reaches Shannon’s **perfect secrecy**; reuse leaks plaintext straight out (the Venona lesson). RC4/ChaCha20 substitute pseudorandom streams for speed, at the risk of statistical bias.",
      "termCount": 8,
      "terms": [
        "One-Time Pad (OTP)",
        "XOR",
        "One-Time Pad History",
        "RC4",
        "ChaCha20",
        "Pseudorandom Function (PRF)",
        "Pseudorandom Generator (PRG)",
        "Stream Cipher (Keystream)"
      ],
      "proto": 4,
      "work": 1
    },
    {
      "id": "d07",
      "title": "破译方法",
      "titleEn": "Cryptanalysis",
      "zh": "破译方法：不靠密钥，靠算法与统计的弱点——频率分析（单表）、Kasiski/周期检测（多表）、已知/部分明文攻击、唯密文攻击；进入计算机时代升级为**差分/线性分析**（DES 之敌）与**代数攻击**。攻击者模型决定难度：唯密文最难，已知明文次之。",
      "en": "Cryptanalysis: break without the key, by exploiting statistical and structural weaknesses — frequency analysis (mono), Kasiski/period detection (poly), known/partial-plaintext attacks, ciphertext-only; in the computer era this escalates to **differential/linear** attacks (DES’s nemesis) and algebraic attacks. The attacker model sets the difficulty: ciphertext-only is hardest.",
      "termCount": 53,
      "terms": [
        "Frequency Analysis",
        "Crib",
        "Known-Plaintext Attack",
        "Depth",
        "Kasiski Test",
        "Brute Force",
        "Known Plaintext",
        "Chosen-Plaintext Attack",
        "Birthday Attack",
        "Man-in-the-Middle",
        "Traffic Analysis",
        "Differential Cryptanalysis",
        "Linear Cryptanalysis",
        "Rainbow Table",
        "Side-Channel Attack",
        "Timing Attack",
        "Chosen-Ciphertext Attack",
        "Meet-in-the-Middle Attack",
        "Ciphertext-Only Attack",
        "One-Time Pad Reuse",
        "CCA2",
        "Distinguishing Attack",
        "Constant-Time Implementation",
        "Padding Oracle Attack",
        "Backdoor",
        "Phishing",
        "Password Spraying",
        "Canary Trap",
        "Steganalysis",
        "Replay Attack",
        "Shor's Algorithm",
        "Grover's Algorithm",
        "Ninja Secret Codes",
        "Variant Kana Steganography",
        "Hash Collision Attack",
        "Meet-in-the-Middle",
        "Miller-Rabin",
        "Power Analysis",
        "Cardan Grille",
        "S-Box",
        "Key Derivation for Storage",
        "Cold Boot",
        "Differential Side-Channel",
        "Kasiski vs Index of Coincidence",
        "Banburismus",
        "Depth",
        "Fault Attack",
        "Replay Attack",
        "SIGINT",
        "Key Confusion Attack",
        "Algebraic Attack",
        "Dictionary Attack",
        "Speculative Execution Side-Channel"
      ],
      "proto": 1,
      "work": 0
    },
    {
      "id": "d08",
      "title": "对称分组密码",
      "titleEn": "Symmetric Block Ciphers",
      "zh": "对称分组密码：把明文切成定长**块**（通常 128 位），用同一密钥逐块加密（AES/DES）。DES 的 56 位密钥已被暴力破解淘汰，AES 是 2001 年 NIST 选定的 Rijndael，128/192/256 位密钥、128 位分组，是当今事实标准。结构分 **Feistel**（DES）与 **SPN**（AES）两大流派。",
      "en": "Symmetric block ciphers: cut plaintext into fixed **blocks** (usually 128 bits), encrypt each with the same key (AES/DES). DES’s 56-bit key is broken by brute force; AES, chosen by NIST in 2001, is Rijndael with 128/192/256-bit keys on 128-bit blocks — today’s de facto standard. Structures split into **Feistel** (DES) and **SPN** (AES).",
      "termCount": 20,
      "terms": [
        "Block Cipher",
        "Symmetric Key",
        "AES",
        "Data Encryption Standard (DES)",
        "Feistel Network",
        "Substitution-Permutation Network (SPN)",
        "Symmetric Cryptography",
        "Block Cipher Mode (ECB/CBC/GCM)",
        "Cipher Block Chaining (CBC)",
        "Counter Mode (CTR)",
        "Galois/Counter Mode (GCM)",
        "3DES (Triple DES)",
        "Blowfish / Twofish",
        "Camellia",
        "Key Schedule",
        "Feistel vs SPN (Confusion vs Diffusion)",
        "Padding",
        "KASUMI",
        "RC6",
        "CFB/OFB 模式"
      ],
      "proto": 0,
      "work": 2
    },
    {
      "id": "d09",
      "title": "哈希",
      "titleEn": "Hash Functions",
      "zh": "哈希：单向函数，输入任意长、输出定长摘要，且**碰撞**（两个不同输入同摘要）在计算上不可行。它回答「这文件没被动过」。SHA-1 已被 SHAttered 实际碰撞攻破，SHA-2（SHA-256）与 SHA-3（Keccak 海绵）是现役标准，广泛用于文件校验、证书指纹、区块链。",
      "en": "Hash functions: one-way, any-length input to fixed-length digest, where a **collision** (two inputs, same digest) is computationally infeasible. They answer \"this file is untouched.\" SHA-1 fell to real SHAttered collisions; SHA-2 (SHA-256) and SHA-3 (Keccak sponge) are current standards for file checks, certificate fingerprints, and blockchains.",
      "termCount": 10,
      "terms": [
        "Cryptographic Hash",
        "Salt (Cryptography)",
        "Merkle Tree",
        "Proof of Work (PoW)",
        "SHA-3",
        "MD5",
        "SHA-1",
        "Hashcash",
        "SHA-2",
        "RIPEMD & Whirlpool"
      ],
      "proto": 2,
      "work": 1
    },
    {
      "id": "d10",
      "title": "消息认证与 AEAD",
      "titleEn": "Authentication & AEAD",
      "zh": "消息认证与 AEAD：光加密不够——还须**认证**（完整性 + 来源）。MAC/HMAC 用密钥给消息盖戳，接收方可验签防篡改；AEAD（GCM、ChaCha20-Poly1305）把加密与认证合成一步，同时给机密性与完整性，是现代 TLS 的默认姿势。",
      "en": "Authentication & AEAD: encryption alone is not enough — you also need **authentication** (integrity + origin). MAC/HMAC stamps a message with a key so the receiver can detect tampering; AEAD (GCM, ChaCha20-Poly1305) fuses encryption and authentication into one step, delivering confidentiality and integrity together — the modern TLS default.",
      "termCount": 4,
      "terms": [
        "Message Authentication Code (MAC)",
        "HMAC",
        "Poly1305",
        "KMAC / cSHAKE"
      ],
      "proto": 1,
      "work": 1
    },
    {
      "id": "d11",
      "title": "非对称公钥",
      "titleEn": "Asymmetric Public-key",
      "zh": "非对称公钥：一对密钥——**公钥加密、私钥解密**（或私钥签名、公钥验证），从根本上解决了密钥分发难题。RSA 基于大数分解难题，ElGamal 基于离散对数，ECC 基于椭圆曲线群上的离散对数（相同安全强度下密钥更短）。Diffie-Hellman 则是公钥思想里第一个纯密钥交换方案。",
      "en": "Asymmetric public-key: a key **pair** — public key encrypts, private key decrypts (or signs/verifies) — solving key distribution at the root. RSA rests on integer factorization, ElGamal on discrete log, ECC on elliptic-curve discrete log (shorter keys at equal security). Diffie-Hellman is the first pure key-exchange scheme in the public-key lineage.",
      "termCount": 10,
      "terms": [
        "Public-Key Crypto",
        "Asymmetric Key",
        "RSA",
        "Elliptic Curve Cryptography (ECC)",
        "Asymmetric Cryptography",
        "ElGamal",
        "Paillier Encryption",
        "Rabin Cryptosystem",
        "DH Parameter Validation",
        "NIST P-256 (secp256r1)"
      ],
      "proto": 5,
      "work": 0
    },
    {
      "id": "d12",
      "title": "数字签名",
      "titleEn": "Digital Signatures",
      "zh": "数字签名：私钥签、公钥验，只有持私钥者能产出、全世界都能验签——提供**不可否认性**。RSA 签名、ECDSA（FIPS 186）、EdDSA 是三大主力；**随机数 k 复用**是签名崩溃的头号原因（k 相同则两条签名泄出私钥）。",
      "en": "Digital signatures: sign with the private key, verify with the public — only the holder of the private key can produce a valid signature, so it provides **non-repudiation**. RSA signatures, ECDSA (FIPS 186), and EdDSA are the mainstay; **reusing the nonce k** is the number-one reason signatures collapse (same k on two messages leaks the private key).",
      "termCount": 5,
      "terms": [
        "Digital Signature",
        "Digital Signature Algorithm (DSA)",
        "Schnorr Signature",
        "Hash-Based Signatures",
        "Ring Signature"
      ],
      "proto": 2,
      "work": 0
    },
    {
      "id": "d13",
      "title": "密钥管理",
      "titleEn": "Key Management",
      "zh": "密钥管理：密钥不是「生成好就完事」，**生成、分发、轮换、撤销、恢复、审计**六件事缺一不可。哈希链一次性口令（Lamport）、口令哈希（argon2）、密钥指纹是日常运维的三件套。再强的算法，密钥管理一旦出错全盘皆输。",
      "en": "Key management: a key is never \"generate and done\" — **generation, distribution, rotation, revocation, recovery, and audit** are all mandatory. Hash-chain one-time passwords (Lamport), password hashing (argon2), and key fingerprints are the daily three-piece set. Even the strongest algorithm loses everything if key management fails.",
      "termCount": 6,
      "terms": [
        "Initialization Vector (IV)",
        "Key Length",
        "Key Space",
        "Key Derivation Function (KDF)",
        "bcrypt",
        "Argon2"
      ],
      "proto": 1,
      "work": 0
    },
    {
      "id": "d14",
      "title": "协议与 PKI",
      "titleEn": "Protocols & PKI",
      "zh": "协议与 PKI：把算法拼成可用的安全协议。TLS 1.3 一个往返完成握手 + 前向保密；X.509 证书链把「公钥 = 实体」的信任交给 CA 体系；Let’s Encrypt 让免费签发成为可能。PKI 是整个公钥互联网的信任骨架。",
      "en": "Protocols & PKI: assemble algorithms into usable secure protocols. TLS 1.3 completes handshake + forward secrecy in one round trip; X.509 certificate chains delegate \"this public key is that entity\" to the CA system; Let’s Encrypt made free issuance possible. PKI is the trust backbone of the public-key internet.",
      "termCount": 56,
      "terms": [
        "HTTPS",
        "Base64",
        "Transport Layer Security (TLS)",
        "Public Key Infrastructure (PKI)",
        "Certificate Authority (CA)",
        "Digital Envelope",
        "Key Exchange",
        "End-to-End Encryption",
        "Zero-Knowledge Proof",
        "Homomorphic Encryption",
        "Post-Quantum Cryptography",
        "Kerckhoffs's Principle",
        "Certificate Transparency (CT)",
        "Online Certificate Status Protocol (OCSP)",
        "HTTP Strict Transport Security (HSTS)",
        "Key Confirmation",
        "Key Rotation",
        "WebCrypto",
        "Lattice-based Cryptography",
        "Kyber (ML-KEM)",
        "Dilithium (ML-DSA)",
        "Harvest Now, Decrypt Later",
        "SM2",
        "ZUC (Zu Chongzhi)",
        "Double Ratchet",
        "Kerberos",
        "Forward Secrecy",
        "Needham-Schroeder",
        "TOTP",
        "Passkey (FIDO2/WebAuthn)",
        "S/MIME",
        "PAKE",
        "Noise Protocol Framework",
        "WireGuard",
        "Threshold Signature",
        "Off-the-Record (OTR)",
        "Diffie-Hellman Key Exchange",
        "PGP (Pretty Good Privacy)",
        "SSH",
        "Tor",
        "A5/1",
        "Key Encapsulation Mechanism",
        "SM9",
        "Two-Factor Authentication",
        "Content Security Policy (CSP)",
        "Identity-Based Encryption (IBE)",
        "Zero Trust Architecture",
        "Ransomware",
        "CAPTCHA",
        "RSA Padding (PKCS#1)",
        "Secure Boot & Firmware Signing",
        "FIPS 140",
        "Cryptography Law of China",
        "Commercial Cryptography Regulation",
        "HMAC (Keyed Hash MAC)",
        "DNSSEC"
      ],
      "proto": 2,
      "work": 0
    },
    {
      "id": "d15",
      "title": "零知识证明",
      "titleEn": "Zero-knowledge Proofs",
      "zh": "零知识证明：证明者向验证者证明「我知道某事」，却**不泄露**任何额外信息（经典的 3-着色例子）。它是区块链隐私（ZK-SNARKs）、身份认证、区块链扩容的理论基石——把「证明知识」与「透露知识」彻底解耦。",
      "en": "Zero-knowledge proofs: a prover convinces a verifier \"I know X\" while revealing **no** extra information (the classic 3-coloring example). They underpin blockchain privacy (ZK-SNARKs), identity authentication, and blockchain scaling — decoupling \"proving knowledge\" from \"revealing knowledge.\"",
      "termCount": 0,
      "terms": [],
      "proto": 1,
      "work": 0
    },
    {
      "id": "d16",
      "title": "秘密共享与 MPC",
      "titleEn": "Secret Sharing & MPC",
      "zh": "秘密共享与 MPC：把秘密切成 n 份，任意 t<n 份可恢复、t-1 份毫无信息（Shamir 门限方案）。多方安全计算（MPC）让若干方在不泄露各自输入的前提下**联合计算**——门限解密、门限签名、联邦学习都是它的下游。",
      "en": "Secret sharing & MPC: split a secret into n shares so any t < n recover it and t−1 reveal nothing (Shamir threshold). Multi-party computation (MPC) lets several parties **jointly compute** without revealing their inputs — threshold decryption, threshold signatures, and federated learning are downstream.",
      "termCount": 1,
      "terms": [
        "Shamir's Secret Sharing"
      ],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d17",
      "title": "侧信道与物理攻击",
      "titleEn": "Side-Channel & Physical Attacks",
      "zh": "侧信道与物理攻击：算法本身没破，**实现**泄密——计时（差分耗时）、功耗（DPA/SPA）、电磁、缓存、故障注入。现代实现必须**常数时间**、掩码、随机化；这是「算法对」却「部署错」的常见死因。",
      "en": "Side-channel & physical attacks: the algorithm is fine, the **implementation** leaks — timing (differential execution time), power (DPA/SPA), EM, cache, fault injection. Modern implementations must be **constant-time**, masked, randomized; this is the classic \"algorithm right, deployment wrong\" failure.",
      "termCount": 0,
      "terms": [],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d18",
      "title": "隐写与信息隐藏",
      "titleEn": "Steganography & Info Hiding",
      "zh": "隐写与信息隐藏：不加密内容，而是**隐藏通信本身的存在**（密信藏于图、文件藏于文件）。历史用「看不见的墨水」，现代用 LSB 替换、隐写于 JPEG 量化表、隐于噪声。隐写不保证内容保密，只保证「有人通信」这件事不暴露。",
      "en": "Steganography & info hiding: don’t encrypt the content, **hide the existence of communication itself** (ciphertext in images, files in files). Historically \"invisible ink,\" modern LSB substitution, JPEG quantization-table steganography, steganographic noise. Steganography guarantees nothing about the content’s secrecy — only that \"someone is communicating\" stays hidden.",
      "termCount": 0,
      "terms": [],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d19",
      "title": "随机数与 CSPRNG",
      "titleEn": "Randomness & CSPRNG",
      "zh": "随机数与 CSPRNG：密码学的地基不是算法，是**随机性**——可预测的种子让一切算法归零。PRNG 快但可预测；CSPRNG（/dev/urandom、BCrypt）用真熵做种，输出不可由内部状态反推。密钥、nonce、盐都必须来自 CSPRNG。",
      "en": "Randomness & CSPRNG: cryptography’s bedrock is **randomness**, not algorithms — a predictable seed zeroes out every scheme. PRNGs are fast but predictable; CSPRNGs (/dev/urandom, CryptGenRandom) seed from real entropy so output is not reversible from internal state. Keys, nonces, and salts must all come from a CSPRNG.",
      "termCount": 0,
      "terms": [],
      "proto": 1,
      "work": 0
    },
    {
      "id": "d20",
      "title": "中国国密",
      "titleEn": "China National Cryptography",
      "zh": "中国国密：SM2（椭圆曲线公钥，GB/T 32918）/ SM3（哈希，GB/T 32905）/ SM4（分组密码，GB/T 32907）/ ZUC（序列密码，3GPP 128-EEA3/EIA3）。《密码法》（2020）让这套标准从「用」走向「立」，走进政务、金融、移动通信。",
      "en": "China National Cryptography: SM2 (elliptic-curve public key, GB/T 32918) / SM3 (hash, GB/T 32905) / SM4 (block cipher, GB/T 32907) / ZUC (stream cipher, 3GPP 128-EEA3/EIA3). The Cryptography Law (2020) moved this family from \"using standards\" to \"making standards,\" into government, finance, and mobile networks.",
      "termCount": 2,
      "terms": [
        "SM4",
        "SM3"
      ],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d21",
      "title": "量子密码",
      "titleEn": "Quantum Cryptography",
      "zh": "量子密码：用物理（而非计算困难）保证安全。量子密钥分发（QKD，如 BB84）让窃听本身就被**测不准原理**暴露——窃听即扰动、扰动即发现。它解决密钥分发，不替代公钥算法；是「换掉地基」而非「打补丁」。",
      "en": "Quantum cryptography: security from physics, not computational hardness. Quantum key distribution (QKD, e.g. BB84) makes eavesdropping itself detectable via the **uncertainty principle** — to observe is to perturb, and perturb is to be caught. It solves key distribution, not public-key substitution; it \"changes the foundation,\" not a patch.",
      "termCount": 3,
      "terms": [
        "Quantum Cryptography",
        "BB84",
        "Quantum Key Distribution (QKD)"
      ],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d22",
      "title": "后量子",
      "titleEn": "Post-Quantum",
      "zh": "后量子：量子计算机将破掉 RSA/ECC 的数学根（Shor 算法），但**格密码**（基于 LWE/RLWE 的难题）在已知模型下安全。NIST 2024 首批后量子标准 ML-KEM (Kyber)、ML-DSA (Dilithium)、SLH-DSA (SPHINCS+) 是正式上岗的答案；混合方案（经典 + PQ）是过渡默认。",
      "en": "Post-quantum: a quantum computer breaks the math under RSA/ECC (Shor), but **lattice** problems (LWE/RLWE) remain safe under known models. NIST’s first post-quantum standards — ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+) — are the answer that has formally entered service; hybrid schemes (classic + PQ) are the transitional default.",
      "termCount": 7,
      "terms": [
        "Learning With Errors (LWE)",
        "Ring-LWE (RLWE)",
        "McEliece",
        "Falcon",
        "NTRU",
        "Post-Quantum Hybrids",
        "SLH-DSA (SPHINCS+)"
      ],
      "proto": 0,
      "work": 0
    },
    {
      "id": "d23",
      "title": "应用安全工程",
      "titleEn": "Applied Security Engineering",
      "zh": "应用安全工程：算法之外才是真战场——口令强度（熵 = 字符集 × 长度）、argon2id 内存困难哈希、供应链完整性、零信任。再强的算法被 `password123` 和一次钓鱼点击击穿，「安全」是系统属性不是组件属性。",
      "en": "Applied security engineering: the real battlefield is outside the algorithm — password strength (entropy = charset × length), argon2id memory-hard hashing, supply-chain integrity, zero trust. Even the strongest algorithm falls to `password123` and one phishing click; \"security\" is a system property, not a component property.",
      "termCount": 6,
      "terms": [
        "Format-Preserving Encryption (FPE)",
        "Password Manager",
        "Supply Chain Attack",
        "Zero-Day",
        "PRISM & 2013 Surveillance Disclosures",
        "CVE & Vulnerability Management"
      ],
      "proto": 1,
      "work": 0
    },
    {
      "id": "d24",
      "title": "理论基础",
      "titleEn": "Theoretical Foundations",
      "zh": "理论基础：香农的信息论给了密码学「完美保密」的形式化——熵、混淆、扩散是三个基石。费马小定理、欧拉函数、离散对数三大数学问题撑起公钥密码；**可证明安全**（IND-CPA/IND-CCA 模型）让「安全」从经验判断升格为数学定理。",
      "en": "Theoretical foundations: Shannon’s information theory gives cryptography its formal notion of **perfect secrecy** — entropy, confusion, and diffusion are the three pillars. Fermat’s little theorem, Euler’s φ, and discrete log prop up public-key schemes; **provable security** (IND-CPA/IND-CCA models) upgrades \"secure\" from intuition to theorem.",
      "termCount": 13,
      "terms": [
        "Entropy",
        "Perfect Secrecy",
        "Random Oracle Model",
        "Bilinear Pairing",
        "Oblivious Transfer",
        "Merkle–Damgård Construction",
        "Blind Signature",
        "Simulation Paradigm",
        "Sponge Construction",
        "Multiparty Computation (MPC)",
        "Zero-Knowledge Sudoku",
        "ZK Three Properties (Soundness/Completeness/Zero-Knowledge)",
        "Turing Machine (1936)"
      ],
      "proto": 1,
      "work": 0
    }
  ],
  "eras": [
    {
      "id": "e01-origins",
      "title": "e01-origins",
      "titleEn": "e01-origins",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "dawn",
          "title": "破译的黎明",
          "href": "story.html?id=dawn"
        }
      ]
    },
    {
      "id": "e02-classical",
      "title": "e02-classical",
      "titleEn": "e02-classical",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "caesar",
          "title": "凯撒的密令",
          "href": "story.html?id=caesar"
        }
      ]
    },
    {
      "id": "e03-byzantine-islamic",
      "title": "拜占庭与早期伊斯兰",
      "titleEn": "Byzantine & Early Islamic",
      "zh": "西罗马 476 年陷落，但东罗马（拜占庭）把罗马的密写传统一路带进中世纪——行政与军情仍依赖移位与替换。真正的转折发生在伊斯兰世界：阿拉伯语从 7 世纪起成为科学语言，密码学随之进入「翻译—记录」阶段。阿拉伯学者不仅保存了希腊密码思想，更开始用阿拉伯文字母的频率特性研究密码——为下一个时代的黄金时代埋下种子。",
      "en": "After the fall of the Western Roman Empire in 476, the Eastern (Byzantine) Empire carried Roman cipher practice into the medieval era — administration and military traffic still relied on shift and substitution. The real pivot came in the Islamic world: Arabic became the language of science from the 7th century, and cryptography entered a \"translation-and-recording\" phase. Arab scholars preserved Greek cipher ideas and began analyzing ciphers using the letter-frequency properties of the Arabic script — planting the seed for the coming Golden Age.\n\n## 关联\n\n- 技术域：见 `../../tech/` 24 域\n- 实体：人物/密件/机器 见 `../people/` `../artifacts/` `../machines/`",
      "type": "era"
    },
    {
      "id": "e04-arabic-golden-age",
      "title": "e04-arabic-golden-age",
      "titleEn": "e04-arabic-golden-age",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "arab",
          "title": "阿拉伯的破译者",
          "href": "story.html?id=arab"
        }
      ]
    },
    {
      "id": "e05-medieval-europe",
      "title": "中世纪欧洲",
      "titleEn": "Medieval Europe",
      "zh": "1258 年蒙古 sack 巴格达，阿拉伯黄金时代落幕，密码学重心移回欧洲。中世纪欧洲的密写服务于**秘密外交**：教廷、各国王室各有一套「名册」（nomenclator）与代号体系，机密信件以替换或密语写成。这段时期的密码是**国家机密**而非科学，直到文艺复兴，数学才重新介入，密码学才从手艺变成学问。",
      "en": "After the 1258 sack of Baghdad, the Arab Golden Age ended and cryptography’s center of gravity shifted back to Europe. Medieval European secrecy served **secret diplomacy**: the papacy and royal courts each kept a \"nomenclator\" and code system, with confidential letters written in substitution or code. Cipher practice was a state secret, not a science — until the Renaissance, when mathematics re-entered and cryptography became a field of study again.\n\n## 关联\n\n- 技术域：见 `../../tech/` 24 域\n- 实体：人物/密件/机器 见 `../people/` `../artifacts/` `../machines/`",
      "type": "era"
    },
    {
      "id": "e06-renaissance",
      "title": "e06-renaissance",
      "titleEn": "e06-renaissance",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "bacon",
          "title": "培根的隐形墨水",
          "href": "story.html?id=bacon"
        }
      ]
    },
    {
      "id": "e09-ww1",
      "title": "e09-ww1",
      "titleEn": "e09-ww1",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "ww1",
          "title": "一战的电波战",
          "href": "story.html?id=ww1"
        }
      ]
    },
    {
      "id": "e10-interwar",
      "title": "战间期",
      "titleEn": "Interwar Period",
      "zh": "两次大战之间，转子机从德军的 Enigma 升级为**国家安全工具**，而密码学第一次成为一门**工业**。波兰密码局（Biuro Szyfrów）的雷耶夫斯基、罗życki、齐加利斯克在 1932–39 年间连续破解德军 Enigma——这是「人类 vs 机器」的第一次胜利。德国则把 Enigma 加到 4 转子、加插线板，为二战的大对决上了膛。这段时期确立了「破译即工业」的新范式。",
      "en": "Between the wars, rotor machines rose from the German Enigma to a **national-security tool**, and cryptography became an **industry** for the first time. The Polish Cipher Bureau’s Rejewski, Różycki, and Zygalski broke the Wehrmacht Enigma in 1932–39 — the first human victory over a machine. Germany, in turn, hardened the Enigma to 4 rotors and a plugboard, loading the great WW2 duel. This period established the \"codebreaking as industry\" paradigm.\n\n## 关联\n\n- 技术域：见 `../../tech/` 24 域\n- 实体：人物/密件/机器 见 `../people/` `../artifacts/` `../machines/`",
      "type": "era"
    },
    {
      "id": "e11-ww2",
      "title": "e11-ww2",
      "titleEn": "e11-ww2",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "bletchley",
          "title": "布莱切利园的机器",
          "href": "story.html?id=bletchley"
        },
        {
          "id": "midway",
          "title": "中途岛之雾",
          "href": "story.html?id=midway"
        },
        {
          "id": "purple",
          "title": "紫密与珍珠港",
          "href": "story.html?id=purple"
        },
        {
          "id": "lorenz",
          "title": "洛伦兹与第一台计算机",
          "href": "story.html?id=lorenz"
        }
      ]
    },
    {
      "id": "e12-cold-war-info-theory",
      "title": "e12-cold-war-info-theory",
      "titleEn": "e12-cold-war-info-theory",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "venona",
          "title": "VENONA 与冷战间谍",
          "href": "story.html?id=venona"
        }
      ]
    },
    {
      "id": "e13-public-key",
      "title": "e13-public-key",
      "titleEn": "e13-public-key",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "modern",
          "title": "数学家的反击",
          "href": "story.html?id=modern"
        }
      ]
    },
    {
      "id": "e16-quantum-turn",
      "title": "e16-quantum-turn",
      "titleEn": "e16-quantum-turn",
      "zh": "",
      "en": "",
      "type": "era",
      "chapters": [
        {
          "id": "quantum",
          "title": "量子转折点",
          "href": "story.html?id=quantum"
        }
      ]
    },
    {
      "id": "e18-frontier",
      "title": "前沿",
      "titleEn": "The Frontier",
      "zh": "当下的三条前沿线：**完全同态加密（FHE）**——在密文上直接计算，解密前不出结果；**后量子迁移**——NIST 2024 标准（ML-KEM/ML-DSA/SLH-DSA）正式上岗，混合方案成为过渡默认；**AI 与密码分析**——大模型与对抗机器学习开始参与密码分析与侧信道推断。量子安全网络、隐私计算、AI 安全是未来十年的主战场。",
      "en": "Three frontier lines today: **fully homomorphic encryption (FHE)** — compute on ciphertext without decrypting; **post-quantum migration** — NIST’s 2024 standards (ML-KEM/ML-DSA/SLH-DSA) have entered service and hybrid schemes are the transitional default; **AI and cryptanalysis** — LLMs and adversarial ML are beginning to participate in cryptanalysis and side-channel inference. Quantum-safe networks, privacy computing, and AI security are the next decade’s main battlegrounds.\n\n## 关联\n\n- 技术域：见 `../../tech/` 24 域\n- 实体：人物/密件/机器 见 `../people/` `../artifacts/` `../machines/`",
      "type": "era"
    },
    {
      "id": "e19-china",
      "title": "中国平行线",
      "titleEn": "China's Parallel Line",
      "zh": "中国密码学从先秦**阴符**（兵符验信）到《六韬》**阴书**（拆信防截），到明将戚继光**反切码**，是一条与西方并行的密写传统。1930 年龙冈战斗缴获的**半部电台**，发展为曾希圣领导的红军无线电侦察——与同时代任何信号情报部队并驾齐驱。当代中国以 **SM2/SM3/SM4/ZUC** 四件套与《密码法》（2020）从「用标准」走向「立标准」，并率先把量子密钥分发投入运营。",
      "en": "Chinese cryptography runs parallel to the West, from the pre-Qin **yinfu** (tally authentication) and the Liu Tao’s **yinshu** (split-letter anti-intercept) to Qi Jiguang’s **fanqie** code — a distinct secrecy tradition. The \"half radio\" captured at Longgang (1930) grew into Zeng Xisheng’s Red Army signals intelligence, matching any contemporary SIGINT force. Modern China moved from \"using standards\" to \"making standards\" via the SM2/SM3/SM4/ZUC family and the Cryptography Law (2020), and first to operationalize quantum key distribution.\n\n## 关联\n\n- 技术域：见 `../../tech/` 24 域\n- 实体：人物/密件/机器 见 `../people/` `../artifacts/` `../machines/`",
      "type": "era"
    }
  ]
};
