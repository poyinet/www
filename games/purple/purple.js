/* ============================================================
   紫密 PURPLE 破译机（二战日本海军「九七式欧文印字機」Type B）
   全网独家：真实 Purple 结构——6 个 25 档步进开关（4 个「二十组」+ 2 个「六组」），
   元音/辅音双路径置换 + 步进规律完全依公开文献（快轮每键、中轮每25、慢轮每625/15625）。
   注：六组开关的内部接线依公开结构复原，置换细节采用站内固定实现（种子固定）。
   核心逻辑用 ==PURPLE-CORE-START== / ==PURPLE-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ================= 核心：紫机引擎 ================= */
  /* ==PURPLE-CORE-START== */
  var P_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var P_VOWELS = 'AEIOUY'; // 六组（6 元音）
  var P_CONS = 'BCDFGHJKLMNPQRSTVWXZ'; // 二十组（20 辅音）

  function P_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function P_shuffle(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /** 生成 6 轮 × 25 档置换表（固定种子）
      tables.fwd[w][pos] = 该档置换 perm（w<4 长度 20 作用于辅音；w>=4 长度 6 作用于元音）
      tables.rev[w][pos] = 逆置换 */
  function P_genTables(seed) {
    var rnd = P_mulberry32(seed);
    var fwd = [], rev = [];
    for (var w = 0; w < 6; w++) {
      var n = w < 4 ? 20 : 6;
      var t = [], iv = [];
      for (var pos = 0; pos < 25; pos++) {
        var base = [];
        for (var i = 0; i < n; i++) base.push(i);
        P_shuffle(base, rnd);
        var perm = base.slice();
        var inv = new Array(n);
        for (var k = 0; k < n; k++) inv[perm[k]] = k;
        t.push(perm); iv.push(inv);
      }
      fwd.push(t); rev.push(iv);
    }
    return { fwd: fwd, rev: rev };
  }

  var P_TABLES = P_genTables(20260815);

  /** 插线板（≤6 对，仅二十组辅音间交换；自逆） */
  function P_plug(p, pairs) {
    for (var i = 0; i < pairs.length; i++) {
      if (p === pairs[i][0]) return pairs[i][1];
      if (p === pairs[i][1]) return pairs[i][0];
    }
    return p;
  }

  /** 步进（真实 Purple：快轮每键+1；轮1/轮4 每25键；轮2/轮5 每625键；轮3 每15625键）
      n = 已处理字符数（从 1 起） */
  function P_advance(pos, n) {
    pos[0] = (pos[0] + 1) % 25;
    if (n % 25 === 0) { pos[1] = (pos[1] + 1) % 25; pos[4] = (pos[4] + 1) % 25; }
    if (n % 625 === 0) { pos[2] = (pos[2] + 1) % 25; pos[5] = (pos[5] + 1) % 25; }
    if (n % 15625 === 0) pos[3] = (pos[3] + 1) % 25;
  }

  /** 加密：明文（A-Z + 空格，空格不加密保留）→ 密文。state.pos 会被步进推进（真实机器同步） */
  function P_encrypt(text, pos, pairs, tables) {
    tables = tables || P_TABLES;
    var out = '', n = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += ' '; continue; }
      var vi = P_VOWELS.indexOf(ch);
      if (vi >= 0) {
        var p = vi;
        p = tables.fwd[4][pos[4]][p];
        p = tables.fwd[5][pos[5]][p];
        out += P_VOWELS[p];
      } else {
        var p2 = P_CONS.indexOf(ch);
        if (p2 < 0) continue;
        for (var w = 0; w < 4; w++) p2 = tables.fwd[w][pos[w]][p2];
        p2 = P_plug(p2, pairs);
        out += P_CONS[p2];
      }
      P_advance(pos, ++n);
    }
    return out;
  }

  /** 解密：密文 → 逆路径 → 明文（同一机器反向） */
  function P_decrypt(text, pos, pairs, tables) {
    tables = tables || P_TABLES;
    var out = '', n = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += ' '; continue; }
      var vi = P_VOWELS.indexOf(ch);
      if (vi >= 0) {
        var p = vi;
        p = tables.rev[5][pos[5]][p];
        p = tables.rev[4][pos[4]][p];
        out += P_VOWELS[p];
      } else {
        var p2 = P_CONS.indexOf(ch);
        if (p2 < 0) continue;
        p2 = P_plug(p2, pairs);
        for (var w = 3; w >= 0; w--) p2 = tables.rev[w][pos[w]][p2];
        out += P_CONS[p2];
      }
      P_advance(pos, ++n);
    }
    return out;
  }

  /* ---------- 明文可读性评分（破译辅助） ---------- */
  var P_FREQ = { E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07 };
  var P_BIGRAMS = ['TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ON', 'AT', 'EN', 'ND', 'TI', 'ES', 'OR', 'TE', 'OF', 'ED', 'IS', 'IT', 'AL', 'AR', 'ST', 'TO', 'NT', 'NG', 'SE', 'HA', 'AS', 'OU', 'IO', 'LE', 'VE', 'CO', 'ME', 'DE', 'HI', 'RI', 'RO', 'IC', 'NE', 'EA', 'RA', 'CE', 'LI', 'CH', 'LL', 'BE', 'MA', 'SI', 'OM', 'UR'];
  var P_WORDS = ['THE', 'AND', 'ING', 'HER', 'THAT', 'WITH', 'FROM', 'THIS', 'HAVE', 'WERE', 'YOUR', 'THEY', 'WILL', 'MEET', 'SHIP', 'BASE', 'ARMY', 'NAVY', 'CODE', 'SECRET', 'ATTACK', 'SQUADRON', 'ENEMY', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'ORDER', 'MOVES', 'TROOPS', 'SUPPLY', 'CONVOY', 'MISSION'];
  var P_TRIGRAMS = ['THE', 'AND', 'ING', 'ENT', 'ION', 'HER', 'FOR', 'THA', 'NTH', 'INT', 'ERE', 'TIO', 'TER', 'EST', 'ERS', 'ATI', 'HAT', 'ATE', 'ALL', 'HIS', 'STI', 'WIT', 'ITH', 'NOT', 'HEN', 'VER', 'OUR', 'TIN', 'AVE', 'ONE', 'YOU', 'ESS', 'MEN', 'EVE', 'TED', 'THI', 'WAS', 'SED', 'MOR'];
  function P_score(text) {
    var t = text.replace(/ /g, '');
    if (!t.length) return 0;
    var s = 0;
    for (var i = 0; i < t.length; i++) s += (P_FREQ[t[i]] || 0) * 10;
    for (var j = 0; j < t.length - 1; j++) if (P_BIGRAMS.indexOf(t.substr(j, 2)) >= 0) s += 20;
    for (var g = 0; g < t.length - 2; g++) if (P_TRIGRAMS.indexOf(t.substr(g, 3)) >= 0) s += 50;
    for (var w = 0; w < P_WORDS.length; w++) {
      var word = P_WORDS[w];
      for (var k = 0; k <= t.length - word.length; k++) {
        if (t.substr(k, word.length) === word) s += 40 + word.length * 12;
      }
    }
    var words = text.split(' ');
    for (var wi = 0; wi < words.length; wi++) {
      var wd = words[wi];
      if (!wd.length) continue;
      var vc = 0;
      for (var c = 0; c < wd.length; c++) if (P_VOWELS.indexOf(wd[c]) >= 0) vc++;
      var ratio = vc / wd.length;
      if (ratio >= 0.2 && ratio <= 0.6) s += 15;
      if (wd.length >= 4) s += 8;
    }
    return s;
  }

  /* ---------- 挑战生成 ---------- */
  var PLAINS = [
    'THE ATTACK WILL BEGIN AT DAWN',
    'ENEMY FLEET SPOTTED NEAR THE ISLAND',
    'REINFORCEMENTS ARRIVE BY MIDNIGHT',
    'SUBMARINE MOVING TO NEW POSITION',
    'CODE BOOK SECURED ON THE CARRIER',
    'ALL UNITS ADVANCE TO THE FRONT',
    'SUPPLY CONVOY LEAVES AT NOON',
    'SECRET DOCUMENTS BURNED BEFORE DAWN',
    'RADIO SILENCE UNTIL FURTHER ORDER',
    'AMBUSH SET ON THE NORTHERN ROAD',
    'WEATHER PERMITS FLIGHT TOMORROW',
    'CAPTURED OFFICER HOLDS THE MAP',
    'BRIDGE DESTROYED RETREAT TO HILL',
    'INTERCEPTED MESSAGE CONFIRMS SUSPICION',
    'AIRFIELD READY FOR NIGHT OPERATION',
    'PASSWORD CHANGED EFFECTIVE TOMORROW'
  ];

  function P_pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

  /* 生成一关：level 1 未知快轮(轮0)；level 2 未知轮0+轮1；level 3 轮位全知、插线板 2 对未知 */
  function P_genChallenge(level, seed) {
    var rnd = P_mulberry32(seed || (Date.now() % 2147483647));
    var pos = [];
    for (var i = 0; i < 6; i++) pos.push(Math.floor(rnd() * 25));
    var pairs = [];
    var plain = '';
    if (level === 1) {
      plain = P_pick(rnd, PLAINS).slice(0, 20);
    } else if (level === 2) {
      plain = P_pick(rnd, PLAINS) + ' ' + P_pick(rnd, PLAINS);
      plain = plain.slice(0, 34);
    } else {
      plain = P_pick(rnd, PLAINS) + ' ' + P_pick(rnd, PLAINS) + ' ' + P_pick(rnd, PLAINS);
      plain = plain.slice(0, 38);
      var pool = [];
      for (var c = 0; c < 20; c++) pool.push(c);
      for (var k = 0; k < 4; k++) { var j = Math.floor(rnd() * pool.length); var tmp = pool[k]; pool[k] = pool[j]; pool[j] = tmp; }
      pairs = [[pool[0], pool[1]], [pool[2], pool[3]]];
    }
    var cipher = P_encrypt(plain, pos.slice(), pairs);
    var knownPos = null, unknownPos = null;
    if (level === 1) { knownPos = pos.slice(1); unknownPos = [0]; }
    else if (level === 2) { knownPos = pos.slice(2); unknownPos = [0, 1]; }
    else { knownPos = pos.slice(); unknownPos = []; }
    return { level: level, cipher: cipher, knownPos: knownPos, unknownPos: unknownPos, plug: pairs, pos: pos, plain: plain };
  }
  /* ==PURPLE-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  /* 显示层翻译辅助：轮名展示走 gs.purple.wheelN 译键（A5 清除硬编码死数据） */
  function wheelName(i) { return T('gs.purple.wheel' + i); }

  var LEVEL_INFO = [
    { t: T('gs.purple.lv1t'), d: T('gs.purple.lv1d') },
    { t: T('gs.purple.lv2t'), d: T('gs.purple.lv2d') },
    { t: T('gs.purple.lv3t'), d: T('gs.purple.lv3d') }
  ];

  root.innerHTML =
    '<div class="pp-wrap">' +
    '  <div class="pp-tabs">' +
    '    <button class="btn mode-btn" id="pp-tab-demo">' + T('gs.purple.tabDemo') + '</button>' +
    '    <button class="btn mode-btn selected" id="pp-tab-chal">' + T('gs.purple.tabChal') + '</button>' +
    '  </div>' +

    /* ---- 演示模式 ---- */
    '  <div id="pp-demo" style="display:none">' +
    '    <div class="pp-flavor">' + T('gs.purple.demoFlavor') + '</div>' +
    '    <div class="pp-wheels" id="pp-wheels"></div>' +
    '    <div class="pp-lbl">' + T('gs.purple.plugLbl') + '</div>' +
    '    <div class="pp-board" id="pp-plug"></div>' +
    '    <div class="pp-pairs" id="pp-pairs"></div>' +
    '    <div class="pp-lbl">' + T('gs.purple.plainLbl') + '</div>' +
    '    <input class="pp-in" id="pp-in" maxlength="80" value="THE ATTACK AT DAWN" autocomplete="off">' +
    '    <div class="pp-row">' +
    '      <button class="btn" id="pp-enc">' + T('gs.purple.enc') + '</button>' +
    '      <button class="btn" id="pp-dec">' + T('gs.purple.dec') + '</button>' +
    '    </div>' +
    '    <div class="pp-out" id="pp-out"></div>' +
    '  </div>' +

    /* ---- 挑战模式 ---- */
    '  <div id="pp-chal">' +
    '    <div class="pp-info"><span id="pp-lev"></span><span id="pp-timer">0s</span></div>' +
    '    <div class="pp-flavor" id="pp-brief"></div>' +
    '    <div class="pp-lbl">' + T('gs.purple.cipherLbl') + '</div>' +
    '    <div class="pp-cipher" id="pp-cipher"></div>' +
    '    <div class="pp-lbl" id="pp-know"></div>' +
    '    <div id="pp-op"></div>' +
    '    <div class="pp-lbl">' + T('gs.purple.prevLbl') + '</div>' +
    '    <div class="pp-out" id="pp-prev"></div>' +
    '    <div class="pp-scorebar"><span>' + T('gs.purple.readability') + '</span><div class="progress-bar slim"><i id="pp-scorebar" style="width:0%"></i></div><b id="pp-score"></b></div>' +
    '    <div class="pp-row">' +
    '      <button class="btn" id="pp-hint">' + T('gs.purple.hint') + '</button>' +
    '      <button class="btn" id="pp-submit">' + T('gs.purple.submit') + '</button>' +
    '    </div>' +
    '    <div class="pp-msg" id="pp-msg"></div>' +
    '  </div>' +
    '  <div class="pp-overlay hidden" id="pp-overlay">' +
    '    <h2 id="pp-ov-title"></h2>' +
    '    <p id="pp-ov-text"></p>' +
    '    <button class="btn" id="pp-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var tabDemo = document.getElementById('pp-tab-demo');
  var tabChal = document.getElementById('pp-tab-chal');
  var demoEl = document.getElementById('pp-demo');
  var chalEl = document.getElementById('pp-chal');
  function showTab(which) {
    demoEl.style.display = which === 'demo' ? '' : 'none';
    chalEl.style.display = which === 'chal' ? '' : 'none';
    tabDemo.classList.toggle('selected', which === 'demo');
    tabChal.classList.toggle('selected', which === 'chal');
    Arcade.audio && Arcade.audio.play('ui');
  }
  tabDemo.addEventListener('click', function () { showTab('demo'); });
  tabChal.addEventListener('click', function () { showTab('chal'); });

  /* ---------- 演示：转轮组 ---------- */
  var demoPos = [0, 0, 0, 0, 0, 0];
  var demoPairs = [];
  var wheelsBox = document.getElementById('pp-wheels');
  for (var w = 0; w < 6; w++) {
    (function (wi) {
      var cell = document.createElement('div');
      cell.className = 'pp-wheel' + (wi < 4 ? ' w20' : ' w6');
      cell.innerHTML =
        '<div class="pp-wname">' + wheelName(wi) + '</div>' +
        '<div class="pp-wpos" id="pp-wpos-' + wi + '">0</div>' +
        '<button class="btn pp-wbtn" id="pp-wdec-' + wi + '">◀</button>' +
        '<button class="btn pp-wbtn" id="pp-winc-' + wi + '">▶</button>';
      wheelsBox.appendChild(cell);
      document.getElementById('pp-wdec-' + wi).addEventListener('click', function () { demoPos[wi] = (demoPos[wi] + 24) % 25; paintDemo(); });
      document.getElementById('pp-winc-' + wi).addEventListener('click', function () { demoPos[wi] = (demoPos[wi] + 1) % 25; paintDemo(); });
    })(w);
  }

  /* 演示插线板 */
  var plugBox = document.getElementById('pp-plug');
  var selPlug = null;
  var cons = P_CONS.split('');
  for (var ci = 0; ci < cons.length; ci++) {
    (function (ch, idx) {
      var b = document.createElement('button');
      b.className = 'pp-letter';
      b.textContent = ch;
      b.dataset.idx = idx;
      b.addEventListener('click', function () {
        if (selPlug === null) { selPlug = idx; paintPlug(); }
        else if (selPlug === idx) { selPlug = null; paintPlug(); }
        else {
          demoPairs = demoPairs.filter(function (p) { return p[0] !== selPlug && p[1] !== selPlug && p[0] !== idx && p[1] !== idx; });
          demoPairs.push([selPlug, idx]);
          selPlug = null;
          paintPlug(); paintPairs();
        }
      });
      plugBox.appendChild(b);
    })(cons[ci], ci);
  }
  var pairsEl = document.getElementById('pp-pairs');
  function paintPairs() {
    var t = demoPairs.length ? T('gs.purple.plugged') + demoPairs.map(function (p) { return '<span class="pp-pair">' + P_CONS[p[0]] + '↔' + P_CONS[p[1]] + '</span>'; }).join('') : T('gs.purple.noPlug');
    pairsEl.innerHTML = t;
  }
  function paintPlug() {
    var bs = plugBox.querySelectorAll('.pp-letter');
    for (var i = 0; i < bs.length; i++) {
      var idx = parseInt(bs[i].dataset.idx, 10);
      bs[i].classList.toggle('sel', idx === selPlug);
      var on = demoPairs.some(function (p) { return p[0] === idx || p[1] === idx; });
      bs[i].classList.toggle('on', on);
    }
  }
  function paintDemo() {
    for (var w = 0; w < 6; w++) document.getElementById('pp-wpos-' + w).textContent = demoPos[w];
  }
  var outEl = document.getElementById('pp-out');
  document.getElementById('pp-enc').addEventListener('click', function () {
    var v = document.getElementById('pp-in').value.toUpperCase();
    outEl.textContent = P_encrypt(v, demoPos.slice(), demoPairs);
    paintDemo();
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  document.getElementById('pp-dec').addEventListener('click', function () {
    var v = document.getElementById('pp-in').value.toUpperCase();
    outEl.textContent = P_decrypt(v, demoPos.slice(), demoPairs);
    paintDemo();
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  paintDemo(); paintPairs(); paintPlug();

  /* ---------- 挑战 ---------- */
  var chal = null;
  var chalStart = 0, totalMs = 0, levelIdx = 0;
  var timerTick = null;
  var levEl = document.getElementById('pp-lev');
  var timerEl = document.getElementById('pp-timer');
  var briefEl = document.getElementById('pp-brief');
  var cipherEl = document.getElementById('pp-cipher');
  var knowEl = document.getElementById('pp-know');
  var opEl = document.getElementById('pp-op');
  var prevEl = document.getElementById('pp-prev');
  var scoreBar = document.getElementById('pp-scorebar');
  var scoreNum = document.getElementById('pp-score');
  var msgEl = document.getElementById('pp-msg');
  var overlayEl = document.getElementById('pp-overlay');
  var ovTitle = document.getElementById('pp-ov-title');
  var ovText = document.getElementById('pp-ov-text');
  var ovBtn = document.getElementById('pp-ov-btn');

  var playPos = [0, 0, 0, 0, 0, 0];
  var playPairs = [];

  function refreshPreview() {
    var dec = P_decrypt(chal.cipher, playPos.slice(), playPairs);
    prevEl.textContent = dec;
    var s = P_score(dec);
    var max = P_score('THE ATTACK WILL BEGIN AT DAWN AND THE FLEET MOVES NORTH') + 1000;
    var pct = Math.min(100, Math.round(s / max * 100));
    scoreBar.style.width = pct + '%';
    scoreNum.textContent = s;
    return dec;
  }
  function allCorrect(dec) {
    var a = dec.replace(/ /g, ''), b = chal.plain.replace(/ /g, '');
    return a === b;
  }

  /* 未知轮位步进器（L1/L2） */
  function buildPosOps() {
    opEl.innerHTML = '';
    playPairs = [];
    // 已知轮位写入 playPos（修复：此前只清零未知轮，已知轮恒为 0 导致 L1/L2 数学上不可解）
    for (var wi0 = 0; wi0 < 6; wi0++) playPos[wi0] = 0;
    chal.knownPos.forEach(function (v, idx) { playPos[idx + chal.unknownPos.length] = v; });
    chal.unknownPos.forEach(function (wi, k) {
      playPos[wi] = 0;
      var row = document.createElement('div');
      row.className = 'pp-posrow';
      row.innerHTML =
        '<span class="pp-plbl">' + T('gs.purple.unknown') + ' · ' + wheelName(wi) + '</span>' +
        '<button class="btn pp-wbtn" data-k="' + k + '" data-d="-1">◀</button>' +
        '<b class="pp-pval" id="pp-pv-' + wi + '">0</b>' +
        '<button class="btn pp-wbtn" data-k="' + k + '" data-d="1">▶</button>';
      opEl.appendChild(row);
    });
    var bs = opEl.querySelectorAll('button[data-k]');
    for (var i = 0; i < bs.length; i++) {
      bs[i].addEventListener('click', function () {
        var k = parseInt(this.dataset.k, 10), d = parseInt(this.dataset.d, 10);
        var wi = chal.unknownPos[k];
        playPos[wi] = (playPos[wi] + d + 25) % 25;
        document.getElementById('pp-pv-' + wi).textContent = playPos[wi];
        refreshPreview();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
    }
  }

  /* L3 插线板 */
  function buildPlugOps() {
    opEl.innerHTML = '';
    playPairs = [];
    playPos = chal.pos.slice(); // 全轮位已知（修复：此前用全零轮位解密，L3 同样不可解）
    var lbl = document.createElement('div');
    lbl.className = 'pp-plbl';
    lbl.textContent = T('gs.purple.plugHelp');
    opEl.appendChild(lbl);
    var board = document.createElement('div');
    board.className = 'pp-board';
    opEl.appendChild(board);
    var pairLine = document.createElement('div');
    pairLine.className = 'pp-pairs';
    opEl.appendChild(pairLine);
    var sel = null;
    var cons2 = P_CONS.split('');
    for (var ci = 0; ci < cons2.length; ci++) {
      (function (ch, idx) {
        var b = document.createElement('button');
        b.className = 'pp-letter';
        b.textContent = ch;
        b.dataset.idx = idx;
        b.addEventListener('click', function () {
          if (sel === null) { sel = idx; paint(); }
          else if (sel === idx) { sel = null; paint(); }
          else {
            playPairs = playPairs.filter(function (p) { return p[0] !== sel && p[1] !== sel && p[0] !== idx && p[1] !== idx; });
            playPairs.push([sel, idx]);
            sel = null;
            paint(); refreshPreview();
          }
        });
        board.appendChild(b);
      })(cons2[ci], ci);
    }
    function paint() {
      var bs = board.querySelectorAll('.pp-letter');
      var line = '';
      for (var i = 0; i < bs.length; i++) {
        var idx = parseInt(bs[i].dataset.idx, 10);
        bs[i].classList.toggle('sel', idx === sel);
        bs[i].classList.toggle('on', playPairs.some(function (p) { return p[0] === idx || p[1] === idx; }));
      }
      line = playPairs.length ? playPairs.map(function (p) { return '<span class="pp-pair">' + P_CONS[p[0]] + '↔' + P_CONS[p[1]] + '</span>'; }).join('') : T('gs.purple.noPlug');
      pairLine.innerHTML = T('gs.purple.plugged') + line;
    }
    paint();
  }

  /* 提示 */
  function doHint() {
    var hintTxt = '';
    if (chal.level === 1) {
      var best = [];
      for (var a = 0; a < 25; a++) {
        var full = [a].concat(chal.knownPos);
        best.push({ a: a, s: P_score(P_decrypt(chal.cipher, full, [])) });
      }
      best.sort(function (x, y) { return y.s - x.s; });
      hintTxt = T('gs.purple.hint1').replace('{n}', best.slice(0, 3).map(function (x) { return x.a; }).join(' / '));
    } else if (chal.level === 2) {
      var best2 = [];
      for (var a2 = 0; a2 < 25; a2++) {
        for (var b2 = 0; b2 < 25; b2++) {
          var full2 = [a2, b2].concat(chal.knownPos);
          best2.push({ a: a2, b: b2, s: P_score(P_decrypt(chal.cipher, full2, [])) });
        }
      }
      best2.sort(function (x, y) { return y.s - x.s; });
      hintTxt = T('gs.purple.hint2').replace('{n}', best2.slice(0, 3).map(function (x) { return '(' + x.a + ', ' + x.b + ')'; }).join(' / '));
    } else {
      var pair = chal.plug[0];
      hintTxt = T('gs.purple.hint3').replace('{l}', P_CONS[pair[0]]);
    }
    msgEl.textContent = '💡 ' + hintTxt;
    if (Arcade.audio) Arcade.audio.play('coin');
  }

  function startLevel() {
    chalStart = Date.now(); // 每关起算（totalMs 跨关累计）
    chal = P_genChallenge(levelIdx + 1);
    levEl.textContent = LEVEL_INFO[levelIdx].t + ' · ' + T('gs.purple.levelF').replace('{a}', levelIdx + 1).replace('{b}', 3);
    briefEl.textContent = LEVEL_INFO[levelIdx].d;
    cipherEl.textContent = chal.cipher;
    if (chal.level === 3) {
      knowEl.textContent = T('gs.purple.known') + chal.knownPos.map(function (v, wi) { return wheelName(wi) + '=' + v; }).join(' ');
      buildPlugOps();
    } else {
      knowEl.textContent = T('gs.purple.known') + chal.knownPos.map(function (v, wi) { return wheelName(wi + 1) + '=' + v; }).join(' ') + T('gs.purple.adjHint');
      buildPosOps();
    }
    prevEl.textContent = '';
    scoreBar.style.width = '0%';
    scoreNum.textContent = '0';
    msgEl.textContent = '';
    refreshPreview();
  }

  var finished = false;
  document.getElementById('pp-hint').addEventListener('click', doHint);
  document.getElementById('pp-submit').addEventListener('click', function () {
    if (!chal || finished) return;
    var dec = refreshPreview();
    if (chal.level === 3) {
      var a = dec.replace(/ /g, ''), b = chal.plain.replace(/ /g, '');
      var match = 0;
      for (var i = 0; i < b.length; i++) if (a[i] === b[i]) match++;
      var pct = Math.round(match / b.length * 100);
      if (pct === 100) { winLevel(); }
      else { msgEl.textContent = T('gs.purple.miss3').replace('{n}', pct); if (Arcade.audio) Arcade.audio.play('error'); }
      return;
    }
    if (allCorrect(dec)) { winLevel(); }
    else {
      var d1 = dec.replace(/ /g, ''), d2 = chal.plain.replace(/ /g, '');
      var bad = 0;
      for (var j = 0; j < d2.length; j++) if (d1[j] !== d2[j]) bad++;
      msgEl.textContent = T('gs.purple.miss').replace('{n}', bad);
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  function winLevel() {
    totalMs += Date.now() - chalStart;
    if (Arcade.juice) Arcade.juice.win();
    if (levelIdx < 2) {
      levelIdx++;
      startLevel();
      if (Arcade.ui) Arcade.ui.toast(T('gs.purple.toastWin').replace('{n}', levelIdx + 1), 'win');
    } else {
      finished = true;
      ovTitle.textContent = T('gs.purple.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.purple.winD').replace('{t}', totalSec());
      ovBtn.textContent = T('gs.purple.again');
      ovBtn.onclick = function () {
        finished = false;
        levelIdx = 0; totalMs = 0;
        overlayEl.classList.add('hidden');
        resetClock();
        startLevel();
      };
      overlayEl.classList.remove('hidden');
      if (Arcade.shell) Arcade.shell.submitScore(totalSec());
    }
  }

  function totalSec() { return Math.round(totalMs / 1000); }

  /* 计时 */
  function resetClock() {
    totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

  /* ---------- 重开 ---------- */
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.purple.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    finished = false;
    levelIdx = 0; totalMs = 0;
    overlayEl.classList.add('hidden');
    resetClock();
    startLevel();
  };

  showTab('chal');
  resetClock();
  startLevel();

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.purple.tut1t'), d: T('gs.purple.tut1') },
    { t: T('gs.purple.tut2t'), d: T('gs.purple.tut2') },
    { t: T('gs.purple.tut3t'), d: T('gs.purple.tut3') },
    { t: T('gs.purple.tut4t'), d: T('gs.purple.tut4') }
  ];

})();
