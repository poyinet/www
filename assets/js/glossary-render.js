/* 词典渲染逻辑（自 glossary.html 外置；数据在 glossary-data.js） */
(function () {
  /* isEn / COMPARE / CATS / T 等在此定义 */
  var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
    var CATS = {
      basic: { key: 'glossary.catBasic', zh: '🧱 基础概念', en: '🧱 Basics' },
      classical: { key: 'glossary.catClassical', zh: '🏛️ 古典密码', en: '🏛️ Classical Ciphers' },
      methods: { key: 'glossary.catMethods', zh: '🔍 破译方法', en: '🔍 Breaking Methods' },
      modern: { key: 'glossary.catModern', zh: '💻 现代密码', en: '💻 Modern Cryptography' },
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
        en: 'A stream cipher encrypts bit by bit (RC4, ChaCha20); a block cipher encrypts fixed-size blocks (AES, DES).' }
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
      ['basic', 'classical', 'methods', 'modern', 'protocol', 'people', 'encoding'].forEach(function (cat) {
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
          html += '<div class="gl-item">' +
            '<span class="gl-term">' + g.term + '</span><span class="gl-term-zh">' + g.zh + '</span>' +
            '<div class="gl-def">' + (isEn ? g.enDef : g.zhDef) + '</div>' +
            playLink + chLinks + '</div>';
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
