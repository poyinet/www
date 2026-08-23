/* ============================================================
   破译工作室 Cryptanalysis Workbench · 古典密码分析工具箱（旗舰，全网独家）
   三个真实的分析工作站，还原密码学家的工作流：
   - 词频台：单表替换密码 —— 频率柱状图对照 ETAOIN + 词型匹配词典破译
   - Kasiski 台：维吉尼亚密码 —— 重复三字母组求间距 + 重合指数(IC)定密钥长度，
                  再按列频率逐列猜密钥字母
   - 已知明文台：维吉尼亚密码 —— 已知明文片段(crib)滑动偏移，
                  用 C−P 恢复密钥段，按解密通顺度定位正确偏移
   记分：每台挑战用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.workshop.tut1t'), d: T('gs.workshop.tut1') },
  { t: T('gs.workshop.tut2t'), d: T('gs.workshop.tut2') },
  { t: T('gs.workshop.tut3t'), d: T('gs.workshop.tut3') },
  { t: T('gs.workshop.tut4t'), d: T('gs.workshop.tut4') }
];

(function () {
  /* ==WK-CORE-START== */
  var WKCORE = (function () {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function idx(c) { return c.charCodeAt(0) - 65; }
    function norm(s) { return String(s).toUpperCase().replace(/[^A-Z]/g, ''); }
    /* 英文词频（百分比，A-Z） */
    var ENGFREQ = [8.17, 1.49, 2.78, 4.25, 12.70, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41, 6.75, 7.51, 1.93, 0.10, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07];
    var BIG = { TH: 2.7, HE: 2.3, IN: 2.0, ER: 1.8, AN: 1.6, RE: 1.4, ON: 1.4, AT: 1.2, EN: 1.1, ND: 1.0, ST: 1.0, OU: 1.0, EA: 0.9, NG: 0.9, OR: 0.9, TI: 0.9, AS: 0.8, AR: 0.8, TE: 0.8, IS: 0.7, IT: 0.7, HA: 0.7, ED: 0.7 };
    /* 对数似然比：每字母 log(26·p_eng)。英文≈+0.87，均匀≈−1.16 —— 短文本也可靠 */
    function logLScore(text) {
      var t = norm(text), n = t.length;
      if (n < 2) return 0;
      var cnt = new Array(26).fill(0);
      for (var i = 0; i < n; i++) cnt[idx(t[i])]++;
      var ll = 0;
      for (var k = 0; k < 26; k++) {
        if (!cnt[k]) continue;
        ll += cnt[k] * Math.log(26 * ENGFREQ[k] / 100);
      }
      return ll / n;
    }
    /* 通顺度评分 0-100：似然比 + 常见双字母组加分 */
    function engScore(text) {
      var t = norm(text);
      var n = t.length;
      if (n < 8) return 0;
      var ll = logLScore(t);
      var freqScore = Math.max(0, Math.min(1, (ll + 1.16) / 2.0));
      var bs = 0;
      for (var j = 0; j < n - 1; j++) {
        var bg = t.substr(j, 2);
        if (BIG[bg]) bs += BIG[bg];
      }
      var big = Math.min(1, bs / n / 0.7);
      return Math.round(100 * Math.min(1, 0.8 * freqScore + 0.2 * big));
    }
    /* 列拟合度（同似然比归一）：正确 Caesar 移位≈1，错误≈0 */
    function colFit(col) {
      var n = col.length;
      if (n < 2) return 0;
      var ll = logLScore(col);
      return Math.max(0, Math.min(1.2, (ll + 1.16) / 2.0));
    }
    /* ---------- 维吉尼亚 ---------- */
    function vigEnc(plain, key) {
      var p = norm(plain), k = norm(key), out = '';
      for (var i = 0; i < p.length; i++) out += A[(idx(p[i]) + idx(k[i % k.length])) % 26];
      return out;
    }
    function vigDec(cipher, key) {
      var c = norm(cipher), k = norm(key), out = '';
      for (var i = 0; i < c.length; i++) out += A[(idx(c[i]) - idx(k[i % k.length]) + 26) % 26];
      return out;
    }
    /* keyArr: 数字移位数组（可含 null=未知），解密未知位输出 '·' */
    function decWithKey(cipher, keyArr) {
      var c = norm(cipher), out = '';
      for (var i = 0; i < c.length; i++) {
        var s = keyArr[i % keyArr.length];
        out += (s === null) ? '·' : A[(idx(c[i]) - s + 26) % 26];
      }
      return out;
    }
    function icText(text) {
      var t = norm(text), n = t.length;
      if (n < 2) return 0;
      var cnt = new Array(26).fill(0);
      for (var i = 0; i < n; i++) cnt[idx(t[i])]++;
      var s = 0;
      for (var k = 0; k < 26; k++) s += cnt[k] * (cnt[k] - 1);
      return s / (n * (n - 1));
    }
    function avgICForLen(cipher, L) {
      var t = norm(cipher);
      var cols = new Array(L);
      for (var i = 0; i < L; i++) cols[i] = '';
      for (var j = 0; j < t.length; j++) cols[j % L] += t[j];
      var sum = 0;
      for (var c = 0; c < L; c++) sum += icText(cols[c]);
      return sum / L;
    }
    /* 长度分析：返回 2..12 的 IC 曲线 + 全局拟合度曲线 + 推荐长度
       （多重长度 2L/3L 也能解出英文 → 取「拟合度达标的 最小长度」消歧） */
    function icAnalysis(cipher) {
      var t = norm(cipher);
      var rows = [];
      for (var L = 2; L <= 12; L++) rows.push({ len: L, ic: avgICForLen(t, L) });
      var fits = [];
      for (var F = 2; F <= 12; F++) {
        var sol = solveColumns(t, F);
        fits.push({ len: F, fit: sol.key ? engScore(decWithKey(t, sol.key)) : 0 });
      }
      var best = null;
      var maxFit = 0;
      for (var m = 0; m < fits.length; m++) if (fits[m].fit > maxFit) maxFit = fits[m].fit;
      for (var r = 0; r < fits.length; r++) {
        if (maxFit - fits[r].fit <= 6) { best = fits[r].len; break; } // 最小达标长度（多重长度同分时取最小）
      }
      if (best === null) {
        var sorted = fits.slice().sort(function (a, b) { return b.fit - a.fit; });
        best = sorted[0].len;
      }
      var sortedIc = rows.slice().sort(function (a, b) { return b.ic - a.ic; });
      return { rows: rows, sorted: sortedIc, best: best, fits: fits };
    }
    /* Kasiski 重复三字母组 */
    function kasiskiRepeats(cipher) {
      var t = norm(cipher);
      var map = {};
      for (var i = 0; i <= t.length - 3; i++) {
        var tri = t.substr(i, 3);
        if (!map[tri]) map[tri] = [];
        map[tri].push(i);
      }
      var out = [];
      for (var tri2 in map) {
        var pos = map[tri2];
        if (pos.length >= 2) {
          var dists = [];
          for (var j = 1; j < pos.length; j++) dists.push(pos[j] - pos[j - 1]);
          out.push({ tri: tri2, positions: pos, distances: dists });
        }
      }
      out.sort(function (a, b) { return b.positions.length - a.positions.length; });
      return out;
    }
    /* 一列的 Caesar 最佳移位（chi2 拟合英文频率） */
    function bestShift(col) {
      var best = 0, bestS = -1;
      for (var s = 0; s < 26; s++) {
        var shifted = '';
        for (var i = 0; i < col.length; i++) shifted += A[(idx(col[i]) - s + 26) % 26];
        var sc = colFit(shifted);
        if (sc > bestS) { bestS = sc; best = s; }
      }
      return { shift: best, letter: A[best], score: Math.round(bestS * 100) };
    }
    function columnsOf(cipher, L) {
      var t = norm(cipher);
      var cols = new Array(L);
      for (var i = 0; i < L; i++) cols[i] = '';
      for (var j = 0; j < t.length; j++) cols[j % L] += t[j];
      return cols;
    }
    /* 已知明文攻击：crib 在偏移 offset 处 → 恢复密钥移位数组（未知位 null） */
    function recoverKey(cipher, crib, offset, L) {
      var c = norm(cipher), p = norm(crib);
      var key = new Array(L).fill(null);
      for (var i = 0; i < p.length; i++) {
        if (offset + i >= c.length) break;
        var slot = (offset + i) % L;
        key[slot] = (idx(c[offset + i]) - idx(p[i]) + 26) % 26;
      }
      return key;
    }
    function keyFull(key) { return key.every(function (s) { return s !== null; }); }
    /* 自动扫描：每个偏移恢复密钥→解密→通顺度排序 */
    function kpaScan(cipher, crib, L) {
      var c = norm(cipher), p = norm(crib);
      var out = [];
      for (var off = 0; off + p.length <= c.length; off++) {
        var key = recoverKey(c, p, off, L);
        if (!keyFull(key)) continue;
        var dec = vigDec(c, key.map(function (s) { return A[s]; }).join(''));
        out.push({ offset: off, key: key, score: engScore(dec), dec: dec });
      }
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    }
    /* ---------- 单表替换 ---------- */
    function randSubKey(rng) {
      var arr = A.split('');
      for (var i = 25; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr.join('');
    }
    function subEnc(text, key) {
      var out = '', t = String(text).toUpperCase();
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        if (ch < 'A' || ch > 'Z') { out += ch; continue; }
        out += key[idx(ch)];
      }
      return out;
    }
    function subDec(text, key) {
      var out = '', t = String(text).toUpperCase();
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        if (ch < 'A' || ch > 'Z') { out += ch; continue; }
        out += A[key.indexOf(ch)];
      }
      return out;
    }
    function patternOf(word) {
      var map = {}, next = 0, out = '';
      for (var i = 0; i < word.length; i++) {
        var ch = word[i];
        if (map[ch] === undefined) map[ch] = next++;
        out += String.fromCharCode(65 + map[ch]);
      }
      return out;
    }
    /* 常用英语词典（词频台消息源 + KPA 台填充词源） */
    var DICT = ('THE AND FOR YOU ARE NOT WAS HIS HER ONE ALL BUT CAN NEW OUT OUR HAD HOW ITS TWO USE WHO MAY MAN DAY WAY GET SEE ' +
      'THAT WITH FROM HAVE THIS CODE KEYS MOVE STOP RAID SIGN ZONE THEM THEY WILL JUST KNOW MAKE MORE TIME WORD NAME SHIP GATE LINE TREE LAKE ROCK GOLD SILK FIRE BOMB TEST ' +
      'STORM NIGHT LIGHT CODES ENEMY WATCH ALPHA DELTA TROOP DAWN GUARD RADIO POWER TOWER GLASS HOUSE QUEEN KING RIVER MOUNT FOREST COAST CLOUD ' +
      'ATTACK SIGNAL SECRET BOMBER TARGET RAIDER MORSE CIPHER CASTLE BRIDGE CANYON DESERT ISLAND GARDEN POCKET ROCKET BATTLE STREET TUNNEL HARBOR MACHINE VILLAGE PATROL ' +
      'MESSAGE WEATHER BOMBING CAPTAIN GENERAL COURIER SIGNALS COVERT SURVIVE ' +
      'CODEBOOK WIRELESS MACHINES STRATEGY FORTRESS INVASION MIDNIGHT ELEPHANT AIRFIELD BARRACKS ' +
      'SUBMARINE BATTALION TELEGRAPH ENCRYPTED DETACHMENT INTERCEPT ').split(' ').filter(function (w) { return w.length >= 3; });
    function patternWords(pat) {
      return DICT.filter(function (w) { return w.length === pat.length && patternOf(w) === pat; });
    }
    /* 维吉尼亚挑战句池（去空格后 48-72 字母，保证 IC/Kasiski 可靠） */
    var SENTENCES = [
      'THE ENEMY ATTACKS AT DAWN WITH ALL AVAILABLE FORCES INCLUDING THE NAVY',
      'SECRET MESSAGES TRAVEL BY WIRELESS RADIO ACROSS THE BATTLEFIELD',
      'THE SUBMARINE SURFACES AT MIDNIGHT TO MEET THE RESISTANCE',
      'WE MUST BREAK THEIR CIPHER BEFORE THE NEXT MAJOR ATTACK BEGINS',
      'THE GENERAL ORDERS THE COURIER TO DELIVER THE SECRET CODEBOOK TONIGHT',
      'SIGNALS FROM THE OBSERVATORY REVEAL THE POSITION OF THE ENEMY FLEET',
      'THE CAVALRY MOVES AT NIGHT THROUGH THE FOREST TO THE RIVER CROSSING',
      'ATTENTION ALL UNITS THE CODE WORD FOR TOMORROW IS BLACKOUT REPEAT',
      'WE INTERCEPTED THEIR TRANSMISSION AND RECOVERED THE DAILY KEY',
      'THE FORTRESS GUARDS THE MOUNTAIN PASS WITH TURRETS AND SEARCHLIGHTS',
      'RADIO OPERATORS REPORT STRANGE SIGNALS FROM THE NORTHERN HILLS',
      'THE BRIDGE ACROSS THE CANAL IS GUARDED BY HIDDEN GUN EMPLACEMENTS'
    ];
    var CRIDS = {
      3: ['THE', 'AND', 'FOR', 'YOU', 'ARE', 'NOT', 'WAS', 'HIS'],
      4: ['THAT', 'WITH', 'FROM', 'HAVE', 'THIS', 'CODE', 'KEYS', 'MOVE', 'STOP', 'RAID', 'SIGN', 'ZONE'],
      5: ['STORM', 'NIGHT', 'LIGHT', 'CODES', 'ENEMY', 'WATCH', 'ALPHA', 'DELTA', 'TROOP', 'RAVEN', 'GUARD'],
      6: ['ATTACK', 'SIGNAL', 'SECRET', 'BOMBER', 'TARGET', 'RAIDER', 'COVERT', 'CIPHER'],
      7: ['MESSAGE', 'WEATHER', 'BOMBING', 'CAPTAIN', 'GENERAL', 'COURIER', 'SIGNALS'],
      8: ['CODEBOOK', 'WIRELESS', 'MACHINES', 'STRATEGY', 'FORTRESS', 'INVASION', 'MIDNIGHT']
    };
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function randKey(rng, L) {
      var key = '';
      for (var i = 0; i < L; i++) key += A[Math.floor(rng() * 26)];
      var allSame = true;
      for (var j = 1; j < key.length; j++) if (key[j] !== key[0]) { allSame = false; break; }
      if (allSame) key = 'A' + key.substr(1);
      return key;
    }
    /* 词频台挑战：3-5 个词典词组成明文（保证频率统计有信号） */
    function genSubChallenge(rng) {
      var key = randSubKey(rng);
      var words = [], total = 0;
      while (total < 16 && words.length < 5) {
        var w = DICT[Math.floor(rng() * DICT.length)];
        words.push(w);
        total += w.length;
      }
      var plain = words.join(' ');
      return { key: key, plain: plain, cipher: subEnc(plain, key), words: words };
    }
    /* Kasiski 台挑战：两句拼接（96-144 字母，保证 IC/列频可靠）+ 密钥长度 3-5 */
    function genVigChallenge(rng) {
      var L = 3 + Math.floor(rng() * 3);
      var key = randKey(rng, L);
      var s1 = SENTENCES[Math.floor(rng() * SENTENCES.length)];
      var s2 = SENTENCES[Math.floor(rng() * SENTENCES.length)];
      var plain = norm(s1) + norm(s2);
      return { key: key, plain: plain, cipher: vigEnc(plain, key), L: L, sentence: s1 + ' ' + s2 };
    }
    /* 已知明文台挑战：词典词填充（≥80 字母）+ 嵌入 crib（长度=密钥长度）
       约束：crib 只在 offset 出现一次，且其它窗口与 crib 至少差 2 个字母
       （避免「近似的 crib」反推出只差一格的密钥，造成双解） */
    function genKpaChallenge(rng) {
      for (var attempt = 0; attempt < 60; attempt++) {
        var L = 3 + Math.floor(rng() * 4);
        var key = randKey(rng, L);
        var crib = CRIDS[L][Math.floor(rng() * CRIDS[L].length)];
        var f1 = [], t1 = 0;
        while (t1 < 20) { var w1 = DICT[Math.floor(rng() * DICT.length)]; f1.push(w1); t1 += w1.length; }
        var f2 = [], t2 = t1;
        while (t2 < 80) { var w2 = DICT[Math.floor(rng() * DICT.length)]; f2.push(w2); t2 += w2.length; }
        var plain = f1.join('') + crib + f2.join('');
        var offset = t1;
        var ok = plain.indexOf(crib) === offset && plain.lastIndexOf(crib) === offset;
        if (ok) {
          for (var o = 0; o + crib.length <= plain.length; o++) {
            if (o === offset) continue;
            var d = 0;
            for (var q = 0; q < crib.length; q++) if (plain[o + q] !== crib[q]) d++;
            if (d <= 1) { ok = false; break; }
          }
        }
        if (ok) {
          return { key: key, plain: plain, cipher: vigEnc(plain, key), L: L, crib: crib, offset: offset };
        }
      }
      // 兜底（约束放宽）
      var L2 = 3 + Math.floor(rng() * 4);
      var key2 = randKey(rng, L2);
      var crib2 = CRIDS[L2][Math.floor(rng() * CRIDS[L2].length)];
      var g1 = [], s1 = 0;
      while (s1 < 20) { var w3 = DICT[Math.floor(rng() * DICT.length)]; g1.push(w3); s1 += w3.length; }
      var g2 = [], s2 = s1;
      while (s2 < 80) { var w4 = DICT[Math.floor(rng() * DICT.length)]; g2.push(w4); s2 += w4.length; }
      var plain2 = g1.join('') + crib2 + g2.join('');
      return { key: key2, plain: plain2, cipher: vigEnc(plain2, key2), L: L2, crib: crib2, offset: s1 };
    }
    /* 全局列求解：每列取 top3 移位候选，组合穷举取全局通顺度最高（L>6 时每列只取 top1） */
    function solveColumns(cipher, L) {
      var cols = columnsOf(cipher, L);
      var cands = [];
      for (var i = 0; i < L; i++) {
        var per = [];
        var scored = [];
        for (var s = 0; s < 26; s++) scored.push({ s: s, f: colFitShift(cols[i], s) });
        scored.sort(function (a, b) { return b.f - a.f; });
        var top = L > 6 ? 1 : 3;
        for (var t = 0; t < top; t++) per.push(scored[t].s);
        cands.push(per);
      }
      var bestKey = null, bestScore = -1;
      function walk(colIdx, keyArr) {
        if (colIdx === L) {
          var dec = decWithKey(cipher, keyArr);
          var sc = engScore(dec);
          if (sc > bestScore) { bestScore = sc; bestKey = keyArr.slice(); }
          return;
        }
        for (var c = 0; c < cands[colIdx].length; c++) {
          keyArr[colIdx] = cands[colIdx][c];
          walk(colIdx + 1, keyArr);
        }
      }
      walk(0, new Array(L).fill(null));
      return { key: bestKey, score: bestScore };
    }
    function colFitShift(col, s) {
      var shifted = '';
      for (var i = 0; i < col.length; i++) shifted += A[(idx(col[i]) - s + 26) % 26];
      return colFit(shifted);
    }
    return {
      A: A, idx: idx, norm: norm, engScore: engScore, colFit: colFit,
      vigEnc: vigEnc, vigDec: vigDec, decWithKey: decWithKey,
      icText: icText, avgICForLen: avgICForLen, icAnalysis: icAnalysis,
      kasiskiRepeats: kasiskiRepeats, bestShift: bestShift, columnsOf: columnsOf,
      recoverKey: recoverKey, keyFull: keyFull, kpaScan: kpaScan,
      randSubKey: randSubKey, subEnc: subEnc, subDec: subDec,
      patternOf: patternOf, DICT: DICT, patternWords: patternWords,
      SENTENCES: SENTENCES, CRIDS: CRIDS, mulberry32: mulberry32,
      genSubChallenge: genSubChallenge, genVigChallenge: genVigChallenge, genKpaChallenge: genKpaChallenge,
      solveColumns: solveColumns
    };
  })();
  /* ==WK-CORE-END== */

  var A = WKCORE.A, idx = WKCORE.idx, norm = WKCORE.norm, engScore = WKCORE.engScore;
  var vigEnc = WKCORE.vigEnc, vigDec = WKCORE.vigDec, decWithKey = WKCORE.decWithKey;
  var icAnalysis = WKCORE.icAnalysis, kasiskiRepeats = WKCORE.kasiskiRepeats;
  var bestShift = WKCORE.bestShift, columnsOf = WKCORE.columnsOf;
  var recoverKey = WKCORE.recoverKey, keyFull = WKCORE.keyFull, kpaScan = WKCORE.kpaScan;
  var subEnc = WKCORE.subEnc, patternOf = WKCORE.patternOf, patternWords = WKCORE.patternWords;
  var genSubChallenge = WKCORE.genSubChallenge, genVigChallenge = WKCORE.genVigChallenge, genKpaChallenge = WKCORE.genKpaChallenge;
  var mulberry32 = WKCORE.mulberry32;

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="wk-tabs">' +
    '  <button class="btn wk-tab mode-btn selected" data-st="freq">' + T('gs.workshop.stFreq') + '</button>' +
    '  <button class="btn wk-tab mode-btn" data-st="kasiski">' + T('gs.workshop.stKasiski') + '</button>' +
    '  <button class="btn wk-tab mode-btn" data-st="kpa">' + T('gs.workshop.stKpa') + '</button>' +
    '</div>';
  root.innerHTML = tabsHtml + '<div id="wk-body"></div>';
  var bodyEl = document.getElementById('wk-body');
  var station = 'freq';
  var timerTick = null, challengeStart = 0, answered = false;

  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }
  function startTimer(timerId) {
    stopTimer();
    challengeStart = Date.now();
    timerTick = setInterval(function () {
      var el = document.getElementById(timerId);
      if (el) el.textContent = elapsed() + 's';
    }, 500);
  }
  function win(stationName) {
    answered = true;
    stopTimer();
    var t = elapsed();
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.audio) Arcade.audio.play('win');
    if (Arcade.shell) Arcade.shell.submitScore(t);
    if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.winToast').replace('{s}', stationName).replace('{t}', t), 'win');
    setTimeout(function () { newChallenge(); }, 1200);
  }
  function freshRng() { return mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0); }

  /* ================= 词频台 ================= */
  var freqState = null; // {plain, cipher, key, guess{}}
  var freqSel = null;

  function freqHtml() {
    return '' +
      '<div class="wk-hint">' + T('gs.workshop.freqHint') + '</div>' +
      '<div class="wk-info"><span>' + T('gs.workshop.interceptLbl') + ' \u00b7 ' + T('gs.workshop.timeLbl') + ' <span class="stat-value" id="f-timer">0s</span></span>' +
      '<span><button class="btn purple" id="f-new">' + T('gs.workshop.newBtn') + '</button></span></div>' +
      '<div class="wk-cipher" id="f-cipher"></div>' +
      '<div class="wk-chart" id="f-chart"></div>' +
      '<div class="wk-ref">' + T('gs.workshop.freqRef') + '</div>' +
      '<div class="wk-lbl">' + T('gs.workshop.freqLbl1') + '</div>' +
      '<div class="wk-map" id="f-map"></div>' +
      '<div class="wk-strip" id="f-strip"></div>' +
      '<div class="wk-lbl">' + T('gs.workshop.freqLbl2') + '</div>' +
      '<div class="wk-words" id="f-words"></div>' +
      '<div class="wk-preview" id="f-preview"></div>' +
      '<div class="wk-patline" id="f-pat"></div>' +
      '<div class="wk-row"><input id="f-answer" maxlength="40" placeholder="' + T('gs.workshop.ansPh') + '" aria-label="' + T('gs.workshop.ansPh') + '"><button class="btn yellow" id="f-submit">' + T('gs.workshop.submitBtn') + '</button></div>';
  }

  function freqNew() {
    answered = false;
    freqState = genSubChallenge(freshRng());
    freqSel = null;
    freqState.guess = {};
    var g = freqState.guess;
    for (var i = 0; i < 26; i++) g[A[i]] = null;
    renderFreq();
    startTimer('f-timer');
  }

  function renderFreq() {
    var st = freqState;
    // 密文
    document.getElementById('f-cipher').textContent = st.cipher;
    // 频率图
    var cnt = {};
    var ci = norm(st.cipher);
    for (var i = 0; i < 26; i++) cnt[A[i]] = 0;
    for (var j = 0; j < ci.length; j++) cnt[ci[j]]++;
    var max = 1;
    for (var k = 0; k < 26; k++) if (cnt[A[k]] > max) max = cnt[A[k]];
    var chart = '';
    for (var l = 0; l < 26; l++) {
      var ch = A[l];
      var h = Math.round(42 * cnt[ch] / max);
      chart += '<div class="wk-bar"><div class="wk-barfill" style="height:' + h + 'px" title="' + T('gs.workshop.barTitle').replace('{c}', ch).replace('{n}', cnt[ch]) + '"></div><div class="wk-barletter">' + ch + '</div><div class="wk-barcnt">' + (cnt[ch] || '') + '</div></div>';
    }
    document.getElementById('f-chart').innerHTML = chart;
    // 映射盘
    var map = '';
    for (var m = 0; m < 26; m++) {
      var mc = A[m];
      var val = st.guess[mc] || '?';
      map += '<button class="wk-tile' + (freqSel === mc ? ' sel' : '') + '" data-c="' + mc + '">' + mc + '<span>→</span>' + val + '</button>';
    }
    document.getElementById('f-map').innerHTML = map;
    // 字母条
    var strip = '';
    for (var s = 0; s < 26; s++) strip += '<button class="wk-striptile" data-l="' + A[s] + '">' + A[s] + '</button>';
    document.getElementById('f-strip').innerHTML = strip + '<button class="wk-striptile clr" data-l="CLR">' + T('gs.workshop.clearSel') + '</button>';
    // 密文单词（可点击）
    var wordsHtml = '';
    st.words.forEach(function (w) {
      var pat = patternOf(w);
      wordsHtml += '<button class="wk-word" data-w="' + w + '" data-pat="' + pat + '">' + w + '</button>';
    });
    document.getElementById('f-words').innerHTML = T('gs.workshop.wordsLbl') + wordsHtml;
    renderFreqPreview();
  }

  function renderFreqPreview() {
    var st = freqState;
    var out = '';
    for (var i = 0; i < st.cipher.length; i++) {
      var ch = st.cipher[i];
      if (ch === ' ') { out += ' '; continue; }
      var g = st.guess[ch];
      out += '<span class="wk-pv' + (g ? '' : ' unknown') + '">' + (g || '·') + '</span>';
    }
    var dec = '';
    for (var j = 0; j < st.cipher.length; j++) {
      var c2 = st.cipher[j];
      if (c2 === ' ') { dec += ' '; continue; }
      dec += st.guess[c2] || '';
    }
    document.getElementById('f-preview').innerHTML = T('gs.workshop.previewLbl') + out;
    document.getElementById('f-pat').textContent = dec.trim() ? T('gs.workshop.curTextLbl') + dec : '';
  }

  function freqBind() {
    document.getElementById('f-new').addEventListener('click', function () { freqNew(); });
    document.getElementById('f-map').addEventListener('click', function (e) {
      var t = e.target.closest('.wk-tile');
      if (!t) return;
      freqSel = t.getAttribute('data-c');
      renderFreq();
    });
    document.getElementById('f-map').addEventListener('contextmenu', function (e) {
      var t = e.target.closest('.wk-tile');
      if (!t) return;
      e.preventDefault();
      freqState.guess[t.getAttribute('data-c')] = null;
      if (freqSel === t.getAttribute('data-c')) freqSel = null;
      renderFreq();
    });
    document.getElementById('f-strip').addEventListener('click', function (e) {
      var t = e.target.closest('.wk-striptile');
      if (!t) return;
      var l = t.getAttribute('data-l');
      if (l === 'CLR') { freqSel = null; }
      else if (freqSel) {
        freqState.guess[freqSel] = l;
        // 自动选中下一个未猜的密文字母
        var order = norm(freqState.cipher).split('');
        var found = false;
        for (var i = 0; i < order.length; i++) {
          var c = order[i];
          if (!freqState.guess[c] && c !== freqSel) { freqSel = c; found = true; break; }
        }
        if (!found) freqSel = null;
      }
      if (Arcade.audio) Arcade.audio.play('ui');
      renderFreq();
    });
    document.getElementById('f-words').addEventListener('click', function (e) {
      var b = e.target.closest('.wk-word');
      if (!b) return;
      var w = b.getAttribute('data-w'), pat = b.getAttribute('data-pat');
      var matches = patternWords(pat);
      var html = T('gs.workshop.patMatch').replace('{w}', w).replace('{p}', pat);
      if (!matches.length) html += T('gs.workshop.noMatch');
      matches.forEach(function (mw) {
        html += '<button class="wk-match" data-w="' + w + '" data-mw="' + mw + '">' + mw + '</button>';
      });
      document.getElementById('f-pat').innerHTML = html;
    });
    document.getElementById('f-pat').addEventListener('click', function (e) {
      var b = e.target.closest('.wk-match');
      if (!b) return;
      var w = b.getAttribute('data-w'), mw = b.getAttribute('data-mw');
      for (var i = 0; i < w.length; i++) freqState.guess[w[i]] = mw[i];
      freqSel = null;
      if (Arcade.audio) Arcade.audio.play('move');
      renderFreq();
    });
    document.getElementById('f-submit').addEventListener('click', freqSubmit);
    document.getElementById('f-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') freqSubmit(); });
  }

  function freqSubmit() {
    if (answered || !freqState) return;
    var v = norm(document.getElementById('f-answer').value);
    var target = norm(freqState.plain);
    if (!v) { if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.ansFirst'), 'warn'); return; }
    if (v === target) { win(T('gs.workshop.stFreq')); }
    else {
      if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.ansWrongFreq'), 'warn');
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  /* ================= Kasiski 台 ================= */
  var vigState = null; // {key, plain, cipher, L}
  var vigKeyArr = null; // 数字移位数组（当前密钥）
  var vigLen = 5;

  function vigHtml() {
    return '' +
      '<div class="wk-hint">' + T('gs.workshop.vigHint') + '</div>' +
      '<div class="wk-info"><span>' + T('gs.workshop.interceptLbl') + ' \u00b7 ' + T('gs.workshop.timeLbl') + ' <span class="stat-value" id="k-timer">0s</span></span>' +
      '<span><button class="btn purple" id="k-new">' + T('gs.workshop.newBtn') + '</button></span></div>' +
      '<div class="wk-cipher" id="k-cipher"></div>' +
      '<div class="game-controls"><button class="btn green" id="k-kasiski">' + T('gs.workshop.kasiskiBtn') + '</button>' +
      '<button class="btn cyan" id="k-ic">' + T('gs.workshop.icBtn') + '</button></div>' +
      '<div class="wk-result" id="k-out1">' + T('gs.workshop.kStart') + '</div>' +
      '<div class="wk-info"><span>' + T('gs.workshop.keyLenLbl') + ' <select id="k-len"></select></span>' +
      '<span><button class="btn purple" id="k-cols">' + T('gs.workshop.colsBtn') + '</button>' +
      '<button class="btn yellow" id="k-fill">' + T('gs.workshop.fillBtn') + '</button></span></div>' +
      '<div class="wk-result" id="k-out2">——</div>' +
      '<div class="wk-keyline" id="k-keyline"></div>' +
      '<div class="wk-preview" id="k-preview"></div>' +
      '<div class="game-controls"><button class="btn yellow" id="k-submit">' + T('gs.workshop.submitKeyBtn') + '</button></div>' +
      '<div class="wk-dim">' + T('gs.workshop.kDim') + '</div>';
  }

  function vigNew() {
    answered = false;
    vigState = genVigChallenge(freshRng());
    vigLen = vigState.L;
    vigKeyArr = new Array(vigLen).fill(null);
    document.getElementById('k-cipher').textContent = vigState.cipher;
    // 长度选择器
    var sel = document.getElementById('k-len');
    sel.innerHTML = '';
    for (var L = 2; L <= 12; L++) {
      var o = document.createElement('option');
      o.value = L; o.textContent = L;
      if (L === vigLen) o.selected = true;
      sel.appendChild(o);
    }
    document.getElementById('k-out1').textContent = T('gs.workshop.kStart');
    document.getElementById('k-out2').textContent = '——';
    renderVigKey();
    renderVigPreview();
    startTimer('k-timer');
  }

  function renderVigKey() {
    var html = '';
    for (var i = 0; i < vigKeyArr.length; i++) {
      var v = vigKeyArr[i];
      html += '<button class="wk-ktile" data-i="' + i + '">' + (v === null ? '?' : A[v]) + '</button>';
    }
    document.getElementById('k-keyline').innerHTML = T('gs.workshop.keyLineLbl') + html;
  }

  function renderVigPreview() {
    var dec = decWithKey(vigState.cipher, vigKeyArr);
    var html = '';
    for (var i = 0; i < dec.length; i++) {
      html += '<span class="wk-pv' + (dec[i] === '·' ? ' unknown' : '') + '">' + dec[i] + '</span>';
    }
    var score = keyFull(vigKeyArr) ? engScore(dec) : 0;
    document.getElementById('k-preview').innerHTML = T('gs.workshop.liveDec') + html +
      '<br>' + T('gs.workshop.fluency') + ' <span class="wk-meter"><span class="wk-meterfill" style="width:' + score + '%"></span></span> ' + score + '/100' +
      (keyFull(vigKeyArr) && score > 55 ? T('gs.workshop.looksEnglish') : '');
  }

  function vigBind() {
    document.getElementById('k-new').addEventListener('click', function () { vigNew(); });
    document.getElementById('k-kasiski').addEventListener('click', function () {
      var reps = kasiskiRepeats(vigState.cipher);
      var out = document.getElementById('k-out1');
      if (!reps.length) {
        out.innerHTML = T('gs.workshop.noRepeats');
      } else {
        var html = T('gs.workshop.repeatsLbl') + '<br>';
        reps.slice(0, 6).forEach(function (r) {
          html += '<span class="wk-tri">' + r.tri + '</span> ' + T('gs.workshop.posLbl') + ' ' + r.positions.join(',') + ' \u2192 ' + T('gs.workshop.gapLbl') + ' ' + r.distances.join(',') + '<br>';
        });
        out.innerHTML = html;
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    });
    document.getElementById('k-ic').addEventListener('click', function () {
      var ana = icAnalysis(vigState.cipher);
      var maxFit = 1;
      ana.fits.forEach(function (f) { if (f.fit > maxFit) maxFit = f.fit; });
      var html = T('gs.workshop.icTitle') + '<div class="wk-icrow">';
      ana.fits.forEach(function (f) {
        var h = Math.round(44 * f.fit / maxFit);
        html += '<div class="wk-ic' + (f.len === ana.best ? ' best' : '') + '" data-l="' + f.len + '" title="L=' + f.len + ' ' + T('gs.workshop.fluency') + ' ' + f.fit + '"><div class="wk-icfill" style="height:' + h + 'px"></div>' + f.len + '</div>';
      });
      html += '</div><div class="wk-dim">' + T('gs.workshop.icRef');
      ana.rows.forEach(function (r) {
        html += 'L' + r.len + '=' + r.ic.toFixed(2) + '\u3000';
      });
      html += '</div>' + T('gs.workshop.recLen').replace('{n}', ana.best);
      var out = document.getElementById('k-out1');
      out.innerHTML = html;
      out.querySelectorAll('.wk-ic').forEach(function (b) {
        b.addEventListener('click', function () {
          vigLen = parseInt(this.getAttribute('data-l'), 10);
          document.getElementById('k-len').value = vigLen;
          vigKeyArr = new Array(vigLen).fill(null);
          renderVigKey();
          renderVigPreview();
        });
      });
      document.getElementById('k-len').value = ana.best;
      vigLen = ana.best;
      vigKeyArr = new Array(vigLen).fill(null);
      renderVigKey();
      renderVigPreview();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
    document.getElementById('k-len').addEventListener('change', function () {
      vigLen = parseInt(this.value, 10);
      vigKeyArr = new Array(vigLen).fill(null);
      renderVigKey();
      renderVigPreview();
    });
    document.getElementById('k-cols').addEventListener('click', function () {
      var cols = columnsOf(vigState.cipher, vigLen);
      var html = T('gs.workshop.colsTitle') + '<br>';
      for (var i = 0; i < cols.length; i++) {
        var b = bestShift(cols[i]);
        html += '<button class="wk-col" data-i="' + i + '" data-s="' + b.shift + '" title="' + T('gs.workshop.colTip').replace('{n}', b.score) + '">' + T('gs.workshop.colBtn').replace('{n}', i + 1).replace('{l}', b.letter).replace('{s}', b.score) + '</button>';
      }
      html += T('gs.workshop.colsHint');
      document.getElementById('k-out2').innerHTML = html;
      document.getElementById('k-out2').querySelectorAll('.wk-col').forEach(function (b2) {
        b2.addEventListener('click', function () {
          vigKeyArr[parseInt(this.getAttribute('data-i'), 10)] = parseInt(this.getAttribute('data-s'), 10);
          renderVigKey();
          renderVigPreview();
          if (Arcade.audio) Arcade.audio.play('move');
        });
      });
    });
    document.getElementById('k-fill').addEventListener('click', function () {
      var sol = WKCORE.solveColumns(vigState.cipher, vigLen);
      if (sol.key) {
        vigKeyArr = sol.key;
        renderVigKey();
        renderVigPreview();
        if (Arcade.juice) Arcade.juice.select();
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    });
    document.getElementById('k-keyline').addEventListener('click', function (e) {
      var t = e.target.closest('.wk-ktile');
      if (!t) return;
      var i = parseInt(t.getAttribute('data-i'), 10);
      vigKeyArr[i] = (vigKeyArr[i] === null ? 0 : (vigKeyArr[i] + 1) % 26);
      renderVigKey();
      renderVigPreview();
    });
    document.getElementById('k-submit').addEventListener('click', vigSubmit);
  }

  function vigSubmit() {
    if (answered || !vigState) return;
    if (!keyFull(vigKeyArr)) { if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.keyFillFirst'), 'warn'); return; }
    var dec = vigDec(vigState.cipher, vigKeyArr.map(function (s) { return A[s]; }).join(''));
    if (dec === vigState.plain) { win(T('gs.workshop.stKasiski')); }
    else {
      if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.keyWrong'), 'warn');
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  /* ================= 已知明文台 ================= */
  var kpaState = null; // {key, plain, cipher, L, crib, offset}
  var kpaKeyArr = null;

  function kpaHtml() {
    return '' +
      '<div class="wk-hint">' + T('gs.workshop.kpaHint') + '</div>' +
      '<div class="wk-info"><span>' + T('gs.workshop.interceptLbl') + ' \u00b7 ' + T('gs.workshop.timeLbl') + ' <span class="stat-value" id="p-timer">0s</span></span>' +
      '<span><button class="btn purple" id="p-new">' + T('gs.workshop.newBtn') + '</button></span></div>' +
      '<div class="wk-cipher" id="p-cipher"></div>' +
      '<div class="wk-info"><span>' + T('gs.workshop.offsetLbl') + ' <span class="stat-value" id="p-offv">0</span></span>' +
      '<input type="range" id="p-off" min="0" max="0" value="0" aria-label="' + T('gs.workshop.offsetAria') + '"></div>' +
      '<div class="game-controls"><button class="btn green" id="p-try">' + T('gs.workshop.tryBtn') + '</button>' +
      '<button class="btn cyan" id="p-scan">' + T('gs.workshop.scanBtn') + '</button></div>' +
      '<div class="wk-result" id="p-out">——</div>' +
      '<div class="wk-keyline" id="p-keyline"></div>' +
      '<div class="wk-preview" id="p-preview"></div>' +
      '<div class="game-controls"><button class="btn yellow" id="p-submit">' + T('gs.workshop.submitKeyBtn') + '</button></div>' +
      '<div class="wk-dim">' + T('gs.workshop.pDim') + '</div>';
  }

  function kpaNew() {
    answered = false;
    kpaState = genKpaChallenge(freshRng());
    document.getElementById('p-crib').textContent = kpaState.crib;
    document.getElementById('p-len').textContent = kpaState.L;
    document.getElementById('p-cipher').textContent = kpaState.cipher;
    var max = kpaState.cipher.length - kpaState.crib.length;
    var slider = document.getElementById('p-off');
    slider.max = max;
    slider.value = 0;
    document.getElementById('p-offv').textContent = '0';
    kpaKeyArr = new Array(kpaState.L).fill(null);
    document.getElementById('p-out').textContent = '——';
    renderKpaKey();
    renderKpaPreview(0);
    startTimer('p-timer');
  }

  function renderKpaKey() {
    var html = '';
    for (var i = 0; i < kpaKeyArr.length; i++) {
      var v = kpaKeyArr[i];
      html += '<span class="wk-ktile static">' + (v === null ? '?' : A[v]) + '</span>';
    }
    document.getElementById('p-keyline').innerHTML = T('gs.workshop.curKeyLbl') + html;
  }

  function renderKpaPreview(score) {
    var dec = decWithKey(kpaState.cipher, kpaKeyArr);
    var html = '';
    for (var i = 0; i < dec.length; i++) {
      html += '<span class="wk-pv' + (dec[i] === '·' ? ' unknown' : '') + '">' + dec[i] + '</span>';
    }
    var s = (score !== undefined && score !== null) ? score : (keyFull(kpaKeyArr) ? engScore(dec) : 0);
    document.getElementById('p-preview').innerHTML = T('gs.workshop.liveDec') + html +
      '<br>' + T('gs.workshop.fluency') + ' <span class="wk-meter"><span class="wk-meterfill" style="width:' + s + '%"></span></span> ' + s + '/100' +
      (keyFull(kpaKeyArr) && s > 55 ? T('gs.workshop.looksEnglish') : '');
  }

  function kpaTry(offset) {
    var key = recoverKey(kpaState.cipher, kpaState.crib, offset, kpaState.L);
    kpaKeyArr = key;
    renderKpaKey();
    var dec = decWithKey(kpaState.cipher, key);
    renderKpaPreview(engScore(dec));
    if (keyFull(key)) {
      var out = document.getElementById('p-out');
      if (engScore(dec) > 55) {
        out.innerHTML = T('gs.workshop.offsetHit').replace('{n}', offset);
        out.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.select();
      } else {
        out.innerHTML = T('gs.workshop.offsetMiss').replace('{n}', offset);
        out.style.color = '';
        if (Arcade.audio) Arcade.audio.play('error');
      }
    }
  }

  function kpaBind() {
    document.getElementById('p-new').addEventListener('click', function () { kpaNew(); });
    document.getElementById('p-off').addEventListener('input', function () {
      document.getElementById('p-offv').textContent = this.value;
    });
    document.getElementById('p-try').addEventListener('click', function () {
      kpaTry(parseInt(document.getElementById('p-off').value, 10));
    });
    document.getElementById('p-scan').addEventListener('click', function () {
      var top = kpaScan(kpaState.cipher, kpaState.crib, kpaState.L).slice(0, 3);
      var html = T('gs.workshop.scanTitle');
      top.forEach(function (r) {
        html += '<button class="wk-offset" data-o="' + r.offset + '">' + T('gs.workshop.offsetBtn').replace('{n}', r.offset).replace('{s}', r.score) + '</button>';
      });
      var out = document.getElementById('p-out');
      out.innerHTML = html;
      out.style.color = '';
      out.querySelectorAll('.wk-offset').forEach(function (b) {
        b.addEventListener('click', function () {
          document.getElementById('p-off').value = this.getAttribute('data-o');
          document.getElementById('p-offv').textContent = this.getAttribute('data-o');
          kpaTry(parseInt(this.getAttribute('data-o'), 10));
        });
      });
      if (Arcade.audio) Arcade.audio.play('ui');
    });
    document.getElementById('p-submit').addEventListener('click', kpaSubmit);
  }

  function kpaSubmit() {
    if (answered || !kpaState) return;
    if (!keyFull(kpaKeyArr)) { if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.kpaFirst'), 'warn'); return; }
    var dec = vigDec(kpaState.cipher, kpaKeyArr.map(function (s) { return A[s]; }).join(''));
    if (dec === kpaState.plain) { win(T('gs.workshop.stKpa')); }
    else {
      if (Arcade.ui) Arcade.ui.toast(T('gs.workshop.keyWrong2'), 'warn');
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  /* ================= 模式切换 ================= */
  function newChallenge() {
    if (station === 'freq') freqNew();
    else if (station === 'kasiski') vigNew();
    else kpaNew();
  }

  function setStation(s) {
    station = s;
    answered = false;
    stopTimer();
    var tabs = root.querySelectorAll('.wk-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-st') === s);
    if (s === 'freq') {
      bodyEl.innerHTML = freqHtml();
      freqBind();
      freqNew();
    } else if (s === 'kasiski') {
      bodyEl.innerHTML = vigHtml();
      vigBind();
      vigNew();
    } else {
      bodyEl.innerHTML = kpaHtml();
      kpaBind();
      kpaNew();
    }
  }

  var tabs = root.querySelectorAll('.wk-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setStation(this.getAttribute('data-st'));
    });
  }

  // 初始化
  setStation('freq');

  window.GAME_RESTART = function () {
    stopTimer();
    station = 'freq';
    answered = false;
    var tabs = root.querySelectorAll('.wk-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-st') === 'freq');
    bodyEl.innerHTML = freqHtml();
    freqBind();
    freqNew();
  };


})();
