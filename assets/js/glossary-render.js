/* 词典渲染逻辑（自 glossary.html 外置；数据在 glossary-data.js） */
(function () {
  /* isEn / COMPARE / CATS / T 等在此定义 */
  var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
    var CATS = {
      basic: { key: 'glossary.catBasic', zh: '🧱 基础概念', en: '🧱 Basics' },
      classical: { key: 'glossary.catClassical', zh: '🏛️ 古典密码', en: '🏛️ Classical Ciphers' },
      methods: { key: 'glossary.catMethods', zh: '🔍 破译方法', en: '🔍 Breaking Methods' },
      modern: { key: 'glossary.catModern', zh: '💻 现代密码', en: '💻 Modern Cryptography' },
      theoretical: { key: 'glossary.catTheoretical', zh: '🧪 理论基础', en: '🧪 Theory' },
      postquantum: { key: 'glossary.catPostquantum', zh: '⚛️ 后量子', en: '⚛️ Post-Quantum' },
      protocol: { key: 'glossary.catProtocol', zh: '🛡️ 协议与工程', en: '🛡️ Protocols & Engineering' },
      people: { key: 'glossary.catPeople', zh: '👤 人物与机构', en: '👤 People & Places' },
      encoding: { key: 'glossary.catEncoding', zh: '📡 隐写与编码', en: '📡 Steganography & Codes' }
    };

    var root = document.getElementById('gl-root');
    var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';

    /* G1 易混辨析：容易混淆的概念对比卡 */
    var COMPARE = [
      { a: { zh: '加密', en: 'Encryption' }, b: { zh: '编码', en: 'Encoding' },
        zh: '加密需要密钥，可逆地隐藏内容；编码不需要密钥，只是格式转换（如 Base64、ASCII）。',
        en: 'Encryption needs a key and hides content reversibly; encoding needs no key and is just format conversion (e.g. Base64, ASCII).' },
      { a: { zh: '对称密码', en: 'Symmetric' }, b: { zh: '非对称密码', en: 'Asymmetric' },
        zh: '加解密用同一把密钥（AES、凯撒）；非对称用公钥/私钥一对（RSA、ECC），公钥可公开。',
        en: 'One key encrypts and decrypts (AES, Caesar); asymmetric uses a public/private pair (RSA, ECC) — the public key can be shared.' },
      { a: { zh: '替换密码', en: 'Substitution' }, b: { zh: '换位密码', en: 'Transposition' },
        zh: '替换改变字母本身（A→D）；换位只重排顺序，字母不变（栅栏、列换位）。',
        en: 'Substitution changes the letters themselves (A→D); transposition only rearranges them (rail fence, columnar).' },
      { a: { zh: '哈希', en: 'Hash' }, b: { zh: '加密', en: 'Encryption' },
        zh: '哈希是单向的，不可逆、无密钥、定长输出；加密可逆且有密钥。',
        en: 'A hash is one-way, keyless and fixed-length; encryption is reversible and keyed.' },
      { a: { zh: '流密码', en: 'Stream cipher' }, b: { zh: '分组密码', en: 'Block cipher' },
        zh: '流密码逐比特/字节加密（RC4、ChaCha20）；分组密码按固定块加密（AES、DES）。',
        en: 'A stream cipher encrypts bit by bit (RC4, ChaCha20); a block cipher encrypts fixed-size blocks (AES, DES).' },
      { a: { zh: 'MAC', en: 'MAC' }, b: { zh: '数字签名', en: 'Digital signature' },
        zh: 'MAC 用对称密钥做认证：发送方能验证，但因为共享密钥，接收方也能伪造——不抗抵赖；数字签名用非对称密钥，只有私钥持有者能签名，任何人可验，支持不可否认。',
        en: 'A MAC authenticates with a symmetric key: verifiers can also forge — no non-repudiation. A signature binds a private key to a message: only the holder signs, anyone verifies, and the signer cannot deny it.' },
      { a: { zh: 'CBC 模式', en: 'CBC mode' }, b: { zh: 'CTR 模式', en: 'CTR mode' },
        zh: 'CBC 逐块链接（每块先异或上一密文块）——加密与解密必须串行，一个比特错位会污染两块；CTR 用计数器生成密钥流——完全并行、无填充、位错误只损一位，但要求计数器绝不重复。',
        en: 'CBC chains block to block (XOR with the previous ciphertext): sequential encryption/decryption, and one flipped bit corrupts two blocks. CTR turns counters into keystream — parallel, padding-free, one bit error harms one bit, but counters must never repeat.' },
      { a: { zh: '一次性密码本', en: 'One-time pad' }, b: { zh: '流密码', en: 'Stream cipher' },
        zh: 'OTP 是理想极限：真随机密钥、只用一次，完美的保密性；流密码是实用近似：密钥流由伪随机算法生成（Keystream = E(counter, key)），可复用、可分发——代价是数学上的「伪」而非「真」。',
        en: 'The OTP is the ideal: truly random, single-use, perfectly secret. Stream ciphers are the practical approximation: keystream from a pseudorandom generator — reusable, distributable, but mathematically "pseudo" rather than "true".' },
      { a: { zh: '差分分析', en: 'Differential analysis' }, b: { zh: '线性分析', en: 'Linear analysis' },
        zh: '差分分析追踪「输入差 → 输出差」的高概率路径（Biham–Shamir 1990）；线性分析用线性逼近代替差分（Matsui 1993，首次实测破 DES）。两者都是统计的，但一个测「差值传播」、一个测「线性相关」。',
        en: 'Differential analysis follows high-probability input-to-output difference paths (Biham–Shamir 1990); linear analysis replaces differences with linear approximations (Matsui 1993, the first practical attack on DES). Both are statistical: one measures difference propagation, the other linear correlation.' },
      { a: { zh: '密码学随机', en: 'Cryptographic randomness' }, b: { zh: '普通随机', en: 'Ordinary randomness' },
        zh: 'Math.random 之类只求“分布均匀”，种子可预测——无法用于密钥；密码学 CSPRNG 要求不可预测性：即使观察到全部输出历史，也无法推断下一个比特（SP 800-90A：系统熵 + 密码学后处理）。',
        en: 'Math.random-like generators only aim for uniform distribution with predictable seeds — useless for keys. A CSPRNG demands unpredictability: given the whole output history, the next bit stays unknown (SP 800-90A: system entropy plus cryptographic processing).' },
      { a: { zh: '零知识证明', en: 'Zero-knowledge proof' }, b: { zh: '数字签名', en: 'Digital signature' },
        zh: '两者都证明「我知道某事」，但对象不同：签名把知识绑定到一条消息上并支持离线验证；零知识只证明命题本身为真，与具体消息无关——验证者学不到知识内容。',
        en: 'Both attest that "I know something", but differently: a signature binds the knowledge to a message and verifies offline; a zero-knowledge proof establishes only that a statement is true — the verifier learns nothing else.' },
      { a: { zh: 'CVE', en: 'CVE' }, b: { zh: 'CWE', en: 'CWE' },
        zh: 'CVE 是「某一个具体漏洞」的编号（CVE-2014-0160 = Heartbleed 实例）；CWE 是漏洞「类别」（如缓冲区溢出、注入）。一个 CWE 类别下可以有成百上千个 CVE。',
        en: 'A CVE identifies one specific vulnerability instance (CVE-2014-0160 = Heartbleed); a CWE names a category of weakness (buffer overflow, injection). One CWE class can contain hundreds of CVEs.' }
    ];
    function renderCompare() {
      var box = document.getElementById('gl-compare');
      if (!box) return;
      var html = '<div class="gl-cat"><div class="gl-cat-title">⚖️ ' + (isEn ? 'Confusing Pairs, Compared' : '易混辨析 · 一眼分清') + '</div><div class="gl-grid">';
      COMPARE.forEach(function (c) {
        html += '<div class="gl-item">' +
          '<div class="gl-cmp"><span class="gl-term">' + (isEn ? c.a.en : c.a.zh) + '</span><span class="gl-cmp-vs">VS</span><span class="gl-term" style="color:var(--neon-cyan)">' + (isEn ? c.b.en : c.b.zh) + '</span></div>' +
          '<div class="gl-def">' + (isEn ? c.en : c.zh) + '</div></div>';
      });
      html += '</div></div>';
      box.innerHTML = html;
    }

    function build() {
      if (!root) return;
      var html = '';
      ['basic', 'classical', 'methods', 'modern', 'protocol', 'people', 'encoding', 'theoretical', 'postquantum'].forEach(function (cat) {
        var items = window.GLOSSARY.filter(function (g) { return g.cat === cat; });
        if (!items.length) return;
        var catMeta = CATS[cat];
        html += '<div class="gl-cat"><div class="gl-cat-title">' + (isEn ? catMeta.en : catMeta.zh) + '</div><div class="gl-grid">';
        items.forEach(function (g) {
          var playLink = g.game
            ? '<a class="gl-play" href="games/' + g.game + '/index.html">🎮 ' + T('glossary.play') + '</a>'
            : '';
          var CH_IDS = { dawn: 'c0', caesar: 'c1', arab: 'c2', bacon: 'c3', ww1: 'c4', bletchley: 'c5', midway: 'c6', purple: 'c7', lorenz: 'c8', venona: 'c9', modern: 'c10', quantum: 'c11' };
          var chLinks = (g.chapters || []).map(function (cid) {
            var num = CH_IDS[cid];
            return '<a class="gl-ch" href="story.html?id=' + cid + '">📜 ' + (num ? T('st.' + num + '.t') : cid) + '</a>';
          }).join('');
          var srcs = (window.GLOSSARY_SOURCES && window.GLOSSARY_SOURCES[g.term]) || [];
          var srcHtml = srcs.length
            ? '<div class="gl-src">📚 ' + T('common.srcTitle') + ' ' + srcs.map(function (s) {
                return s.url
                  ? '<a class="gl-src-a" href="' + s.url + '" target="_blank" rel="noopener">' + s.label + '</a>'
                  : '<span class="gl-src-a">' + s.label + '</span>';
              }).join(' · ') + '</div>'
            : '';
          html += '<div class="gl-item">' +
            '<span class="gl-term">' + g.term + '</span><span class="gl-term-zh">' + g.zh + '</span>' +
            '<div class="gl-def">' + (isEn ? g.enDef : g.zhDef) + '</div>' +
            playLink + chLinks + srcHtml + '</div>';
        });
        html += '</div></div>';
      });
      root.innerHTML = html;
      var count = document.getElementById('gl-count');
      if (count) count.textContent = isEn
        ? window.GLOSSARY.length + ' terms · EN 中文对照 · read, play, decrypt'
        : window.GLOSSARY.length + ' 个术语 · 中英对照 · 读史、玩戏、破译';
      /* 阅读计数（F3 成就 gloss30）：浏览术语页累计 +1 */
      try {
        var n = parseInt(localStorage.getItem('arcade_gloss_read') || '0', 10);
        localStorage.setItem('arcade_gloss_read', String(n + 1));
      } catch (e) {}
    }

    if (window.Arcade && Arcade.i18n) {
      Arcade.i18n.applyStatic();
      document.title = (isEn ? 'Cryptography Glossary' : '密码学词典') + Arcade.i18n.t('app.titleSuffix');
    }
    renderCompare();
    build();
  
})();
