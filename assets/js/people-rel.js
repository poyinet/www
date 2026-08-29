/* 人物关系图谱：87 人 × 密码史关系网（合作/师承/竞争/同僚/家族/并行/承接）
   数据为公开史实；点击任一姓名打开对应人物档案。 */
(function () {
  var REL = [
    /* —— 合作 Collaboration —— */
    { a: 'diffie', b: 'hellman', type: 'collab', zh: '合著《密码学的新方向》(1976)，公钥密码学开篇', en: 'co-authored "New Directions in Cryptography" (1976), the public-key opening', year: '1976' },
    { a: 'rivest', b: 'shamir', type: 'collab', zh: 'RSA 三杰之二：模幂、取因难、签名化', en: 'two of the RSA trio: modexp, factoring hardness, signatures', year: '1977' },
    { a: 'rivest', b: 'adleman', type: 'collab', zh: 'RSA 三杰之三：把反例教会了 RSA，顺手成了艺术家', en: 'the third musketeer of RSA', year: '1977' },
    { a: 'shamir', b: 'adleman', type: 'collab', zh: '一起完成 RSA 论文与公钥签名体系', en: 'completed the RSA paper and signature scheme together', year: '1977' },
    { a: 'bennett', b: 'brassard', type: 'collab', zh: 'BB84 量子密钥分发协议（1984）', en: 'the BB84 quantum key distribution protocol (1984)', year: '1984' },
    { a: 'goldwasser', b: 'micali', type: 'collab', zh: '可证明安全理论的奠基对话', en: 'founding dialogue of provable security', year: '1984' },
    { a: 'micali', b: 'rackoff', type: 'collab', zh: '零知识证明三性形式化（1989）', en: 'formalised the three properties of zero knowledge (1989)', year: '1989' },
    { a: 'daemen', b: 'rijmen', type: 'collab', zh: 'Rijndael——AES 算法的两位父亲', en: 'Rijndael — the two fathers of the AES', year: '1998' },
    { a: 'biham', b: 'shamir', type: 'collab', zh: '差分密码分析（1990）— 教师与学生的联手一击', en: 'differential cryptanalysis (1990) — teacher and student combined', year: '1990' },
    { a: 'turing', b: 'welchman', type: 'collab', zh: '布莱切利园：Bombe 的设计者与插线板洞察者', en: 'Bletchley: the Bombe designer and the plugboard insight', year: '1939' },
    { a: 'knox', b: 'alexander', type: 'collab', zh: '布莱切利园破译小组（Hut 8 对 Enigma 的包围）', en: 'Bletchley Hut 8: closing in on Enigma', year: '1940' },
    { a: 'rejewski', b: 'zygalski', type: 'collab', zh: '波兰密码局三杰之二：特征法与世界之窗', en: 'two of the Polish trio: characteristics and the Zygalski sheets', year: '1932' },
    { a: 'rejewski', b: 'rozycki', type: 'collab', zh: '波兰三杰之三：轰炸机与环形检查', en: 'the third Pole: the bomba and the clock method', year: '1932' },
    { a: 'cocks', b: 'ellis', type: 'collab', zh: 'GCHQ 三人组：先于 RSA 的秘密公钥', en: 'the GCHQ trio: public key before RSA', year: '1973' },
    { a: 'cocks', b: 'williamson', type: 'collab', zh: 'GCHQ 三人完成密钥交换三定律', en: 'completed the GCHQ key-exchange corpus', year: '1974' },
    { a: 'rochefort', b: 'driscoll', type: 'collab', zh: '中途岛海战：JN-25 破译的军官与数学家', en: 'Midway: the officer and the mathematician of JN-25', year: '1942' },
    { a: 'gardner', b: 'tiltman', type: 'collab', zh: 'VENONA：把苏联密钥复用撕开口子的组合', en: 'VENONA: the pair that tore open Soviet key reuse', year: '1946' },
    { a: 'newman', b: 'turing', type: 'collab', zh: '曼彻斯特时期：图灵机到自动计算机工程设计', en: 'Manchester: from Turing machines to real computers', year: '1948' },
    { a: 'tutte', b: 'flowers', type: 'collab', zh: 'Colossus：数学破译与电子工程的合作', en: 'Colossus: the mathematician and the engineer in league', year: '1943' },
    { a: 'tutte', b: 'roberts', type: 'collab', zh: '洛伦兹密码：手工差分到统计引擎', en: 'Lorenz: from hand differencing to the statistical engine', year: '1943' },
    { a: 'vernam', b: 'mauborgne', type: 'collab', zh: 'Vernam 发明异或电传加密，Mauborgne 提出一次性密钥', en: 'Vernam invented XOR tape, Mauborgne added the one-time key', year: '1917' },
    { a: 'miller', b: 'koblitz', type: 'parallel', zh: '独立提出椭圆曲线密码（1985，相隔数月）', en: 'independently proposed elliptic-curve crypto (1985, months apart)', year: '1985' },
    { a: 'merkle', b: 'diffie', type: 'parallel', zh: '同窗竞速：Merkle 谜题与 DH 论文双双登上 1976 舞台', en: 'a classmate race: Merkle puzzles and DH both hit the 1976 stage', year: '1976' },
    { a: 'babbage', b: 'kasiski', type: 'parallel', zh: '相隔数十年各自独立破译维吉尼亚（1854 / 1863）', en: 'independently broke Vigenère decades apart (1854 / 1863)', year: '1863' },
    { a: 'bazeries', b: 'jefferson', type: 'parallel', zh: '转轮密码的两位平行发明者', en: 'parallel inventors of the cylinder cipher', year: '1895' },
    { a: 'kocher', b: 'bernstein', type: 'parallel', zh: '时序攻击与缓存计时：侧信道的两次独立切入', en: 'timing attacks and cache timing: two independent entries into side channels', year: '1996' },
    { a: 'shor', b: 'grover', type: 'parallel', zh: '量子算法的两翼：多项式分解与平方加速搜索', en: 'the two wings of quantum algorithms: polynomial factoring and quadratic search', year: '1996' },
    { a: 'friedman', b: 'efriedman', type: 'family', zh: '密码学最强夫妻档：陆军破译局的双核', en: 'the strongest couple in cryptology: the twin core of the Army\'s bureau', year: '1917' },
    { a: 'gauss', b: 'galois', type: 'mentor', zh: '数论奠基到群论：RSA 与椭圆曲线的共同祖先', en: 'number theory to group theory: common ancestors of RSA and ECC', year: '1830' },
    { a: 'trithemius', b: 'bellaso', type: 'mentor', zh: '多表替换：修道院密码到贝拉索的多表替换', en: 'polyalphabetic lineage: the abbot\'s tables to Bellaso\'s practice', year: '1553' },
    { a: 'bellaso', b: 'vigenere', type: 'mentor', zh: 'Bellaso 发明、Vigenère 著书扬名——冠名的错位经典', en: 'Bellaso invented, Vigenère published — the great naming misattribution', year: '1586' },
    { a: 'playfair', b: 'wheatstone', type: 'mentor', zh: 'Wheatstone 发明二字母方阵，Playfair 勋爵把它推广成名', en: 'Wheatstone invented the digraph square; Lord Playfair championed it', year: '1854' },
    { a: 'wiesner', b: 'bennett', type: 'mentor', zh: '《共轭编码》的种子被贝内特重新发现，成就 BB84', en: 'Bennett rediscovered "Conjugate Coding", leading to BB84', year: '1983' },
    { a: 'alberti', b: 'trithemius', type: 'mentor', zh: '多字母替换的文艺复兴师承：阿尔伯蒂的转盘', en: 'Renaissance lineage: Alberti\'s cipher disk', year: '1467' },
    { a: 'rowlett', b: 'safford', type: 'colleague', zh: '美军破译局：紫密小组成员', en: 'US Army signals: the Purple team', year: '1940' },
    { a: 'turing', b: 'clarke', type: 'colleague', zh: '布莱切利园 Hut 8：审稿人兼谈心人', en: 'Hut 8: reviewer and confidante', year: '1941' },
    { a: 'flowers', b: 'roberts', type: 'colleague', zh: 'Colossus 建设团队', en: 'the Colossus build team', year: '1943' },
    { a: 'shannon', b: 'vonneumann', type: 'colleague', zh: '信息论与存储程序架构：同一时代的同一语言', en: 'information theory and stored-program design: one era, one language', year: '1946' },
    { a: 'chaum', b: 'micali', type: 'colleague', zh: '密码学协议与可证明安全的交汇', en: 'cryptographic protocols meet provable security', year: '1985' },
    { a: 'fekete', b: 'none', type: 'colleague' }, /* 占位防越界，不渲染 */
    { a: 'morse', b: 'bacon', type: 'parallel', zh: '二元编码双线：培根 5 位双字体与莫尔斯点划', en: 'binary coding twins: Bacon\'s 5-bit biliteral and Morse\'s dots and dashes', year: '1838' },
    { a: 'rosenberg', b: 'gardner', type: 'rival', zh: 'VENONA 的两端：被破译的间谍与破译的数学家', en: 'the two ends of VENONA: the spy and the mathematician', year: '1950' },
    { a: 'yardley', b: 'friedman', type: 'rival', zh: '黑室与陆军密码局：两次世界大战间的同行竞争', en: 'the Black Chamber vs the Signal Corps: rivals of the interwar years', year: '1930' },
    { a: 'hellman', b: 'merkle', type: 'collab', zh: 'Merkle 的谜题方案进入 Hellman 的视线，促成新方向', en: 'Merkle\'s puzzles met Hellman\'s push; New Directions followed', year: '1976' },
    { a: 'elgamal', b: 'diffie', type: 'mentor', zh: 'ElGamal 加密：站在 DH 密钥交换上的数字签名', en: 'ElGamal encryption stands on the DH exchange', year: '1985' },
    { a: 'yao', b: 'rabin', type: 'mentor', zh: '姚氏百万富翁与 Rabin OT：安全计算的两块启航石', en: 'Yao\'s millionaires and Rabin\'s OT: the two launch stones of secure computation', year: '1981' },
    { a: 'regev', b: 'gentry', type: 'mentor', zh: '格上学习误差到全同态加密：后量子与隐私计算的合流', en: 'LWE to FHE: where post-quantum meets privacy computing', year: '2009' },
    { a: 'heninger', b: 'miller', type: 'colleague', zh: '后量子标准与密码学社区评审', en: 'post-quantum standards and community review', year: '2016' },
    { a: 'wangxy', b: 'daemen', type: 'rival', zh: '哈希战场：MD5/SHA-1 的碰撞风暴对 AES 家族的稳固', en: 'the hash battlefield: collision storms vs the AES family', year: '2005' },
    { a: 'matsui', b: 'biham', type: 'rival', zh: '线性分析与差分分析：两把统计之刀的平行磨砺', en: 'linear vs differential: two statistical blades in parallel', year: '1993' },
    { a: 'cardano', b: 'alberti', type: 'mentor', zh: '文艺复兴同代人：隐写网格与密码盘互为镜像', en: 'Renaissance contemporaries: steganographic grille and cipher disk as mirrors', year: '1550' },
    { a: 'ekert', b: 'brassard', type: 'mentor', zh: 'E91 纠缠协议与 BB84：量子密钥的两条原理', en: 'E91 entanglement and BB84: two principles of quantum keys', year: '1991' },
    { a: 'pzimmermann', b: 'schneier', type: 'colleague', zh: 'PGP 的传播者与《应用密码学》的作者：加密平民化双雄', en: 'PGP\'s champion and the author of Applied Cryptography: twin forces of crypto for everyone', year: '1993' }
  ].filter(function (r) { return r.type && r.b !== 'none'; });

  var TYPE_LABEL = {
    collab: { zh: '🤝 合作', en: '🤝 Collaboration' },
    rival: { zh: '⚔️ 竞争', en: '⚔️ Rivalry' },
    mentor: { zh: '🌱 师承与命名', en: '🌱 Mentorship & naming' },
    family: { zh: '💞 家族', en: '💞 Family' },
    colleague: { zh: '🏛️ 同僚', en: '🏛️ Colleagues' },
    parallel: { zh: '🌐 独立并行', en: '🌐 Parallel discovery' }
  };

  function render() {
    var host = document.getElementById('pp-rels');
    if (!host) return;

    try { localStorage.setItem('arcade_rels_viewed', '1'); } catch (e) {}
    var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
    var T = (window.Arcade && Arcade.i18n) ? Arcade.i18n.t : function (k) { return k; };
    function nm(pid) {
      var n = T('stp.' + pid + '.name');
      return n && n.indexOf('stp.') !== 0 ? n : pid;
    }
    var byType = {};
    REL.forEach(function (r) {
      (byType[r.type] = byType[r.type] || []).push(r);
    });
    var html = '<div class="pp-rel-head">🗺️ ' + (isEn ? 'Who is who — the relationship web' : '谁与谁——密码史关系网') + '</div>' +
      '<div class="pp-rel-note">' + (isEn ? 'Lines are historical facts; every name opens the profile.' : '关系均为公开史实；点击任一姓名打开人物档案。') + '</div>';
    Object.keys(byType).forEach(function (t) {
      if (t === 'rival') return; /* 上移竞争组顺序 */
      html += relGroup(t, byType[t], isEn, nm);
    });
    if (byType.rival) html += relGroup('rival', byType.rival, isEn, nm);
    host.innerHTML = html;
    function relGroup(t, list, en, nameFn) {
      const lab = TYPE_LABEL[t] || { zh: t, en: t };
      const items = list.map(function (r) {
        const who = '<span class="pp-rel-a" data-person="' + r.a + '">' + nameFn(r.a) + '</span> ⇄ <span class="pp-rel-a" data-person="' + r.b + '">' + nameFn(r.b) + '</span>';
        return '<span class="pp-rel-item">' + who + ' <i>' + (en ? r.en : r.zh) + '</i></span>';
      }).join('');
      return '<div class="pp-rel-group"><div class="pp-rel-t">' + (en ? lab.en : lab.zh) + '</div><div class="pp-rel-items">' + items + '</div></div>';
    }
    var links = host.querySelectorAll('.pp-rel-a');
    for (var i = 0; i < links.length; i++) {
      (function (el) {
        el.addEventListener('click', function () {
          var pid = el.getAttribute('data-person');
          if (Arcade.tutorial && Arcade.tutorial.profile) Arcade.tutorial.profile(pid);
        });
      })(links[i]);
    }
  }
  window.PEOPLE_REL = { REL: REL, render: render };
})();
