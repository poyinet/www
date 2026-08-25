/* ============================================================
   密码史全景时间线（D1）—— 首页横向滚动时间轴
   40+ 节点：公元前 1900 → 2026，每节点链接到章节/游戏/人物/密件
   link 格式：{type:'story'|'game'|'people'|'artifact'|'term', id}
   渲染由 home.js 或本文件的 buildTimeline() 调用
   ============================================================ */
window.CRYPTO_TIMELINE = [
  { y: -1900, zh: '古埃及象形文字', en: 'Egyptian hieroglyphs', icon: '𓀀', link: { type: 'story', id: 'dawn' } },
  { y: -1500, zh: '楔形文字密码', en: 'Cuneiform cryptography', icon: '🏺', link: { type: 'story', id: 'dawn' } },
  { y: -1000, zh: '周初「阴符」兵符', en: 'Yinfu military tallies (early Zhou)', icon: '🎋', link: { type: 'term', id: 'Yinfu Tally Codes' } },
  { y: -400, zh: '《六韬》记「阴书」拆信法', en: 'Yinshu split-letter method (Liu Tao)', icon: '✂️', link: { type: 'term', id: 'Yinshu Split Letters' } },
  { y: -600, zh: '希伯来 Atbash 密码', en: 'Hebrew Atbash cipher', icon: '✡️', link: { type: 'game', id: 'atbash' } },
  { y: -487, zh: '斯巴达密码棒', en: 'Spartan scytale', icon: '🪢', link: { type: 'story', id: 'caesar' } },
  { y: -100, zh: '凯撒移位密码', en: 'Caesar cipher', icon: '🏛️', link: { type: 'story', id: 'caesar' } },
  { y: 60, zh: '普鲁塔克记载密码棒', en: 'Plutarch on the scytale', icon: '📜', link: { type: 'story', id: 'caesar' } },
  { y: 196, zh: '罗塞塔石碑刻立', en: 'Rosetta Stone carved', icon: '🗿', link: { type: 'artifact', id: 'rosetta' } },
  { y: 725, zh: '阿拉伯密码学兴起', en: 'Arab cryptography rises', icon: '🌙', link: { type: 'story', id: 'arab' } },
  { y: 850, zh: '肯迪发明频率分析', en: 'Al-Kindi\'s frequency analysis', icon: '📊', link: { type: 'story', id: 'arab' } },
  { y: 1044, zh: '《武经总要》载「字验」', en: 'Ziyan codes in the Wujing Zongyao', icon: '📜', link: { type: 'term', id: 'Ziyan Code' } },
  { y: 1560, zh: '戚继光创反切码', en: 'Qi Jiguang devises the fanqie code', icon: '🗡️', link: { type: 'term', id: 'Fanqie Code' } },
  { y: 1676, zh: '《万川集海》辑忍术密法', en: 'Bansenshukai compiles shinobi secret codes', icon: '🥷', link: { type: 'term', id: 'Ninja Secret Codes' } },
  { y: 1250, zh: '欧洲密码手册出现', en: 'First European cipher manuals', icon: '📖', link: { type: 'story', id: 'bacon' } },
  { y: 1379, zh: '拉温德密码手册', en: 'Gabriele de Lavinde\'s cipher manual', icon: '📕', link: { type: 'story', id: 'bacon' } },
  { y: 1466, zh: 'Alberti 发明密码盘', en: 'Alberti invents the cipher disk', icon: '🔃', link: { type: 'story', id: 'bacon' } },
  { y: 1499, zh: '威尼斯设立密码局', en: 'Venice founds a cipher office', icon: '🎭', link: { type: 'story', id: 'bacon' } },
  { y: 1518, zh: 'Trithemius 密码表', en: 'Trithemius\' Polygraphia', icon: '🔤', link: { type: 'people', id: 'trithemius' } },
  { y: 1553, zh: 'Bellaso 多表密码', en: 'Bellaso\'s polyalphabetic', icon: '🔑', link: { type: 'people', id: 'bellaso' } },
  { y: 1563, zh: 'Giovan Battista 密码', en: 'della Porta\'s cipher', icon: '🔐', link: { type: 'story', id: 'bacon' } },
  { y: 1586, zh: '维吉尼亚发表多表密码', en: 'Vigenère publishes his cipher', icon: '📝', link: { type: 'story', id: 'bacon' } },
  { y: 1623, zh: '培根双字体密码', en: 'Bacon\'s biliteral cipher', icon: '🖋️', link: { type: 'story', id: 'bacon' } },
  { y: 1624, zh: '《密码学破译》问世', en: 'Cryptomenytices Patefacta', icon: '📚', link: { type: 'story', id: 'bacon' } },
  { y: 1790, zh: '商博良出生', en: 'Champollion born', icon: '🧱', link: { type: 'people', id: 'champollion' } },
  { y: 1795, zh: '杰斐逊发明转轮密码', en: 'Jefferson invents his cipher wheel', icon: '🛞', link: { type: 'people', id: 'jefferson' } },
  { y: 1822, zh: '商博良破译象形文字', en: 'Champollion cracks hieroglyphs', icon: '🗿', link: { type: 'story', id: 'dawn' } },
  { y: 1844, zh: '莫尔斯电报首传', en: 'First Morse telegraph message', icon: '📠', link: { type: 'term', id: 'Morse Code' } },
  { y: 1854, zh: 'Playfair 密码发明', en: 'Playfair cipher invented', icon: '♟️', link: { type: 'game', id: 'playfair' } },
  { y: 1861, zh: '联邦军密码盘服役', en: 'Union Army cipher disk in use', icon: '🪖', link: { type: 'artifact', id: 'civilwar-disk' } },
  { y: 1863, zh: 'Kasiski 检验法', en: 'Kasiski examination', icon: '🔍', link: { type: 'term', id: 'Kasiski Test' } },
  { y: 1883, zh: 'Kerckhoffs 原则', en: 'Kerckhoffs\' principle', icon: '📏', link: { type: 'people', id: 'kerckhoffs' } },
  { y: 1891, zh: 'Bazeries 密码筒', en: 'Bazeries\' cylinder cipher', icon: '🛢️', link: { type: 'people', id: 'bazeries' } },
  { y: 1894, zh: 'Dreyfus 案密码', en: 'Dreyfus affair cipher', icon: '⚖️', link: { type: 'story', id: 'ww1' } },
  { y: 1914, zh: '一战爆发 · Room 40', en: 'WWI begins · Room 40', icon: '⚔️', link: { type: 'story', id: 'ww1' } },
  { y: 1917, zh: '齐默尔曼电报被破', en: 'Zimmermann Telegram broken', icon: '📡', link: { type: 'artifact', id: 'zimmermann' } },
  { y: 1917, zh: 'Vernam 发明 OTP', en: 'Vernam invents the OTP', icon: '🎞️', link: { type: 'term', id: 'One-Time Pad (OTP)' } },
  { y: 1918, zh: 'ADFGVX 密码登场', en: 'ADFGVX fielded', icon: '🛡️', link: { type: 'game', id: 'adfgvx' } },
  { y: 1926, zh: '德国海军列装 Enigma', en: 'German Navy adopts Enigma', icon: '⚓', link: { type: 'term', id: 'Enigma' } },
  { y: 1929, zh: '美国 SIS 建立', en: 'US SIS founded', icon: '🏛️', link: { type: 'people', id: 'yardley' } },
  { y: 1932, zh: '波兰破译 Enigma', en: 'Rejewski breaks Enigma', icon: '🇵🇱', link: { type: 'people', id: 'turing' } },
  { y: 1938, zh: 'Zygalski 穿孔片', en: 'Zygalski\'s perforated sheets', icon: '📄', link: { type: 'people', id: 'rejewski' } },
  { y: 1939, zh: '布莱切利园启用', en: 'Bletchley Park opens', icon: '🏰', link: { type: 'story', id: 'bletchley' } },
  { y: 1940, zh: '图灵 Bombe 服役', en: 'Turing\'s Bombe in service', icon: '⚙️', link: { type: 'game', id: 'bombe' } },
  { y: 1941, zh: '紫密被破 · 次年珍珠港', en: 'Purple broken · Pearl Harbor next year', icon: '🇯🇵', link: { type: 'story', id: 'purple' } },
  { y: 1942, zh: '中途岛「AF」陷阱', en: 'Midway "AF" trap', icon: '🌊', link: { type: 'story', id: 'midway' } },
  { y: 1943, zh: 'Colossus 诞生', en: 'Colossus built', icon: '💾', link: { type: 'game', id: 'lorenz' } },
  { y: 1945, zh: '二战结束 · 密码保密', en: 'WWII ends · secrets kept', icon: '🕊️', link: { type: 'story', id: 'venona' } },
  { y: 1948, zh: '香农信息论', en: 'Shannon\'s information theory', icon: '📐', link: { type: 'story', id: 'modern' } },
  { y: 1949, zh: '《保密系统的通信理论》', en: 'Shannon\'s secrecy systems', icon: '📘', link: { type: 'people', id: 'shannon' } },
  { y: 1952, zh: '美国 NSA 成立', en: 'NSA founded in the US', icon: '🕵️', link: { type: 'term', id: 'NSA' } },
  { y: 1953, zh: 'VENONA 锁定罗森伯格', en: 'VENONA IDs the Rosenbergs', icon: '🕸️', link: { type: 'artifact', id: 'venona' } },
  { y: 1970, zh: 'Feistel 研发 Lucifer', en: 'Feistel builds Lucifer', icon: '🔀', link: { type: 'people', id: 'feistel' } },
  { y: 1973, zh: '科克斯秘密发明 RSA', en: 'Cocks secretly invents RSA', icon: '🕶️', link: { type: 'people', id: 'cocks' } },
  { y: 1976, zh: 'Diffie-Hellman 密钥交换', en: 'Diffie-Hellman key exchange', icon: '🤝', link: { type: 'term', id: 'Public-Key Crypto' } },
  { y: 1977, zh: 'RSA 公钥算法', en: 'RSA public-key crypto', icon: '🔒', link: { type: 'term', id: 'RSA' } },
  { y: 1977, zh: 'DES 标准发布', en: 'DES standard published', icon: '🗄️', link: { type: 'term', id: 'Data Encryption Standard (DES)' } },
  { y: 1985, zh: '椭圆曲线密码提出', en: 'ECC proposed (Miller & Koblitz)', icon: '📈', link: { type: 'term', id: 'Elliptic Curve Cryptography (ECC)' } },
  { y: 1990, zh: 'Kryptos 雕塑揭幕', en: 'Kryptos sculpture unveiled', icon: '🗿', link: { type: 'artifact', id: 'kryptos' } },
  { y: 1991, zh: 'PGP 免费发布', en: 'PGP released free', icon: '📧', link: { type: 'story', id: 'modern' } },
  { y: 1989, zh: '首次 QKD 实验', en: 'First QKD demo (Bennett et al.)', icon: '⚛️', link: { type: 'term', id: 'Quantum Cryptography' } },
  { y: 2001, zh: 'AES 标准发布', en: 'AES standard published', icon: '🔐', link: { type: 'term', id: 'AES' } },
  { y: 2009, zh: '比特币 · 密码学货币', en: 'Bitcoin: crypto currency', icon: '🪙', link: { type: 'story', id: 'modern' } },
  { y: 2016, zh: 'WhatsApp 端到端加密', en: 'WhatsApp end-to-end encryption', icon: '💬', link: { type: 'term', id: 'End-to-End Encryption' } },
  /* 第四期 A4：量子时代节点 */
  { y: 1970, zh: '威斯纳构想量子钞票', en: 'Wiesner conceives quantum money', icon: '💵', link: { type: 'people', id: 'wiesner' } },
  { y: 1984, zh: 'BB84 协议发表', en: 'BB84 protocol published', icon: '🔑', link: { type: 'term', id: 'BB84' } },
  { y: 1994, zh: 'Shor 算法震动密码界', en: 'Shor\'s algorithm shakes crypto', icon: '⚡', link: { type: 'people', id: 'shor' } },
  { y: 1996, zh: 'Grover 搜索算法', en: 'Grover\'s search algorithm', icon: '🔎', link: { type: 'people', id: 'grover' } },
  { y: 2016, zh: 'NIST 后量子算法征集', en: 'NIST post-quantum competition', icon: '📢', link: { type: 'term', id: 'Post-Quantum Cryptography' } },
  { y: 2017, zh: '墨子号星地量子密钥', en: 'Micius satellite QKD', icon: '🛰️', link: { type: 'story', id: 'quantum' } },
  { y: 2022, zh: 'NIST 选定四种后量子算法', en: 'NIST picks four PQ algorithms', icon: '🗳️', link: { type: 'term', id: 'Kyber (ML-KEM)' } },
  { y: 2024, zh: 'FIPS 203/204/205 发布', en: 'FIPS 203/204/205 published', icon: '🛡️', link: { type: 'artifact', id: 'pqc2024' } },
  { y: 2004, zh: '王小云团队攻破 MD5', en: "Wang's team breaks MD5", icon: '💥', link: { type: 'people', id: 'wangxy' } },
  { y: 2017, zh: 'SHAttered：SHA-1 实际碰撞', en: 'SHAttered: first real SHA-1 collision', icon: '🧨', link: { type: 'term', id: 'SHA-1' } },
  /* 第五期：国密节点 */
  { y: 2006, zh: '国密 SM 系列算法公布', en: 'China publishes the SM cipher suite', icon: '🇨🇳', link: { type: 'term', id: 'SM4' } },
  { y: 2011, zh: '祖冲之算法入选 4G 标准', en: 'ZUC adopted into 4G/LTE security', icon: '📡', link: { type: 'term', id: 'ZUC (Zu Chongzhi)' } },
  { y: 2026, zh: '你在这里 · 破译工坊', en: 'You are here · the Workshop', icon: '🔬', link: { type: 'page', id: 'workshop' } }
];

/* 时间线渲染：mode='h' 横向卡片（默认）/ mode='v' 纵向紧凑（编年史页） */
window.buildCryptoTimeline = function (hostId, mode) {
  var host = document.getElementById(hostId || 'crypto-timeline');
  if (!host || !window.CRYPTO_TIMELINE) return;
  var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
  var items = window.CRYPTO_TIMELINE;
  var vertical = mode === 'v';
  /* F3 成就 timeline60：浏览时间线即标记 */
  try {
    if (!localStorage.getItem('arcade_timeline_viewed')) localStorage.setItem('arcade_timeline_viewed', '1');
  } catch (e) {}

  function linkHref(l) {
    if (!l) return null;
    var pre = window.__arcadePagePrefix || '';
    if (l.type === 'story') return pre + 'story.html?id=' + l.id;
    if (l.type === 'game') return pre + 'games/' + l.id + '/index.html';
    if (l.type === 'people') return pre + 'people.html';
    if (l.type === 'artifact') return pre + 'artifacts.html';
    if (l.type === 'page') return pre + l.id + '.html';
    if (l.type === 'term') return pre + 'glossary.html';
    return null;
  }

  /* 年份归一：负 → BC */
  function yearLabel(y) { return y < 0 ? 'BC ' + (-y) : y; }

  var html = '';
  items.forEach(function (it, i) {
    var href = linkHref(it.link);
    var label = isEn ? it.en : it.zh;
    if (vertical) {
      /* 纵向紧凑：年份 + 图标 + 文本，逐行排列 */
      var cls = href ? 'st-h-node' : 'st-h-node';
      var txCls = href ? '' : 'dim';
      var node = href
        ? '<a class="' + cls + '" href="' + href + '">' +
          '<span class="st-h-year">' + yearLabel(it.y) + '</span>' +
          '<span class="st-h-ic">' + it.icon + '</span>' +
          '<span class="st-h-tx">' + label + '</span></a>'
        : '<div class="' + cls + '">' +
          '<span class="st-h-year">' + yearLabel(it.y) + '</span>' +
          '<span class="st-h-ic">' + it.icon + '</span>' +
          '<span class="st-h-tx ' + txCls + '">' + label + '</span></div>';
      html += node;
    } else {
      var inner =
        '<span class="ct-ic">' + it.icon + '</span>' +
        '<span class="ct-txt"><span class="ct-year">' + yearLabel(it.y) + '</span>' +
        '<span class="ct-label">' + label + '</span></span>';
      var node = href
        ? '<a class="ct-node' + (it.link ? ' link' : '') + '" href="' + href + '"' + (it.link.type === 'page' ? ' data-ws="1"' : '') + '>' + inner + '</a>'
        : '<div class="ct-node">' + inner + '</div>';
      html += '<div class="ct-item">' + node + '</div>';
    }
  });

  if (vertical) {
    host.innerHTML =
      '<div class="st-history-title">🗺️ ' + (isEn ? 'Timeline of Cryptography' : '密码史全景时间线') + '</div>' +
      '<div class="st-history-track">' + html + '</div>';
  } else {
    host.innerHTML =
      '<div class="ct-head"><span class="ct-title">🗺️ ' + (isEn ? 'Timeline of Cryptography' : '密码史全景时间线') + '</span>' +
      '<span class="ct-scroll-hint">' + (isEn ? '← scroll →' : '← 左右滑动 →') + '</span></div>' +
      '<div class="ct-track">' + html + '</div>';
  }
};
