/* ============================================================
   洛伦兹 LORENZ 破译机（德军 SZ40「Tunny」，布莱切利园 Colossus 的猎物）
   全网独家：真实 SZ40 结构——12 轮（χ1-5：41/31/29/26/23；ψ1-5：43/47/51/53/59；
   μ37 控制 ψ 步进），5-bit 电传字符，密文 = 明文 ⊕ χ ⊕ ψ'（ψ' 为 ψ 差分派生）。
   轮齿序列依公开文献常见实现版本。破译三关：KPA 扫描 ψ / 扫描 χ /
   Colossus 式 Δχ 统计（无明文，仅靠密文差分偏差）。
   核心逻辑用 ==LORENZ-CORE-START== / ==LORENZ-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==LORENZ-CORE-START== */
  var L_SYM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .,?!-'; // 32 符号 5-bit 全空间
  var L_CHI_LEN = [41, 31, 29, 26, 23];
  var L_PSI_LEN = [43, 47, 51, 53, 59];
  var L_MU_LEN = 37;
  /* 轮齿（公开文献常见实现；1=凸轮顶起） */
  var L_CHI_BITS = [
    '11001010001111101100101000011001011101100',
    '0110110111010110000100110010101',
    '00110011010010101010110010010',
    '10111100100101100111000101',
    '00101010011001101111011'
  ];
  var L_PSI_BITS = [
    '0110100110001011000100111011001101010010011',
    '10110010111010010001101001011010011010101101111',
    '010011010101001000110010110011010011101101001010001',
    '11010100011001101101000110100110011010010010101101001',
    '10011010010101101001011001001101001011010100110100101011001'
  ];
  var L_MU_BITS = '1101010010010101100101010010010100101';

  function L_bitAt(bits, pos) { return bits.charCodeAt(pos % bits.length) - 48; }

  function L_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function L_pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

  /** 生成密钥流：返回 5-bit 值数组；pos 状态推进（chiPos/psiPos/muPos 为各轮起始位） */
  function L_keyStream(len, chiPos, psiPos, muPos) {
    var chi = chiPos.slice(), psi = psiPos.slice(), mu = muPos;
    var prevPsi = [0, 0, 0, 0, 0]; // ψ' 差分：前一字符的 ψ 输出
    var ks = [];
    for (var i = 0; i < len; i++) {
      var k = 0;
      for (var b = 0; b < 5; b++) {
        var chiBit = L_bitAt(L_CHI_BITS[b], chi[b]);
        var psiBit = L_bitAt(L_PSI_BITS[b], psi[b]);
        // ψ' 差分派生：当前 ψ 与上一字符 ψ 异或
        var psiPrime = psiBit ^ prevPsi[b];
        prevPsi[b] = psiBit;
        k = k * 2 + (chiBit ^ psiPrime);
      }
      ks.push(k);
      // 步进：χ 全步进；μ 步进；μ active → ψ 步进
      for (var c = 0; c < 5; c++) chi[c] = (chi[c] + 1) % L_CHI_LEN[c];
      var muActive = L_bitAt(L_MU_BITS, mu);
      mu = (mu + 1) % L_MU_LEN;
      if (muActive) for (var p = 0; p < 5; p++) psi[p] = (psi[p] + 1) % L_PSI_LEN[p];
    }
    return ks;
  }

  /** 字符 ↔ 5-bit：A-Z → 0-25；空格 → 26；标点 → 27-31（32 符号全空间） */
  function L_charToVal(ch) { return L_SYM.indexOf(ch); }
  function L_valToChar(v) { return L_SYM[v]; }

  /** 加密：明文 → 密文（5-bit XOR，全符号加密） */
  function L_encrypt(text, chiPos, psiPos, muPos) {
    var len = 0;
    for (var i = 0; i < text.length; i++) if (L_charToVal(text[i]) >= 0) len++;
    var ks = L_keyStream(len, chiPos, psiPos, muPos);
    var out = '', ki = 0;
    for (var j = 0; j < text.length; j++) {
      var v = L_charToVal(text[j]);
      if (v < 0) continue;
      out += L_valToChar(v ^ ks[ki++]);
    }
    return out;
  }
  /** 解密：同一密钥流反向 */
  function L_decrypt(text, chiPos, psiPos, muPos) { return L_encrypt(text, chiPos, psiPos, muPos); }

  /* ---------- 明文可读性评分（统计破译辅助，Colossus 式判断） ---------- */
  var L_FREQ = { E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07 };
  var L_WORDS = ['THE', 'AND', 'ING', 'HER', 'THAT', 'WITH', 'FROM', 'THIS', 'HAVE', 'WERE', 'YOUR', 'THEY', 'WILL', 'MEET', 'SHIP', 'BASE', 'ARMY', 'NAVY', 'CODE', 'SECRET', 'ATTACK', 'ENEMY', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'ORDER', 'TROOPS', 'SUPPLY', 'CONVOY', 'MISSION', 'BEGIN', 'UNTIL', 'FURTHER'];
  function L_score(text, crib) {
    var s = 0, letters = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch >= 'A' && ch <= 'Z') { s += (L_FREQ[ch] || 0) * 10; letters++; }
    }
    if (!letters) return 0;
    var t = text.replace(/[^A-Z]/g, '');
    for (var w = 0; w < L_WORDS.length; w++) {
      var word = L_WORDS[w];
      for (var k = 0; k <= t.length - word.length; k++) {
        if (t.substr(k, word.length) === word) s += 40 + word.length * 12;
      }
    }
    if (crib && text.indexOf(crib) >= 0) s += 500;
    var words = text.split(/[^A-Z]+/).filter(function (x) { return x.length; });
    for (var wi = 0; wi < words.length; wi++) {
      var wd = words[wi];
      var vc = 0;
      for (var c = 0; c < wd.length; c++) if ('AEIOUY'.indexOf(wd[c]) >= 0) vc++;
      var ratio = vc / wd.length;
      if (ratio >= 0.2 && ratio <= 0.6) s += 15;
      if (wd.length >= 4) s += 8;
    }
    return s;
  }

  /* ---------- 挑战生成 ---------- */
  var L_PLAINS = [
    'THE ATTACK WILL BEGIN AT DAWN TOMORROW MORNING',
    'ENEMY ARMORED COLUMN ADVANCES TOWARD THE CAPITAL',
    'REINFORCEMENTS WILL ARRIVE BY RAIL TONIGHT',
    'ALL UNITS HOLD POSITIONS UNTIL FURTHER ORDERS',
    'RADIO SILENCE IS MANDATORY FOR THE NEXT SIX HOURS',
    'SECRET DEPOT LOCATED NEAR THE NORTHERN FOREST',
    'OPERATION BEGINS WHEN THE MOON IS FULL',
    'BRIDGE BLOWN PREPARE ALTERNATE CROSSING POINT',
    'SUPPLY TRAIN DEPARTS THE MAIN STATION AT MIDNIGHT',
    'HEADQUARTERS MOVES TO THE SECONDARY BUNKER',
    'PASSWORD FOR THE NEW WEEK IS BLUE FALCON',
    'COURIER WILL CARRY THE NEW CODE BOOK TOMORROW'
  ];

  /* 生成一关：{ level, cipher, cipherVals, plain, chiPos, psiPos, muPos,
       knownChi, knownPsi, unknownChi, unknownPsi, target, crib }
     L1 未知 ψ1-2（KPA 密钥流）；L2 未知 χ1-2（KPA 密钥流）；
     L3 未知 χ1-2（无密钥流，仅截获密文 + 已知明文词 crib，统计判断明文性） */
  function L_genChallenge(level, seed) {
    var rnd = L_mulberry32(seed || (Date.now() % 2147483647));
    var chiPos = [];
    for (var i = 0; i < 5; i++) chiPos.push(Math.floor(rnd() * L_CHI_LEN[i]));
    var psiPos = [];
    for (var j = 0; j < 5; j++) psiPos.push(Math.floor(rnd() * L_PSI_LEN[j]));
    var muPos = Math.floor(rnd() * L_MU_LEN);
    var plain = '';
    if (level === 1) plain = L_pick(rnd, L_PLAINS).slice(0, 30);
    else if (level === 2) plain = (L_pick(rnd, L_PLAINS) + ' ' + L_pick(rnd, L_PLAINS)).slice(0, 44);
    else plain = (L_pick(rnd, L_PLAINS) + ' ' + L_pick(rnd, L_PLAINS) + ' ' + L_pick(rnd, L_PLAINS)).slice(0, 72);
    var cipher = L_encrypt(plain, chiPos, psiPos, muPos);
    var cipherVals = [];
    for (var k = 0; k < cipher.length; k++) cipherVals.push(L_charToVal(cipher[k]));
    var plainVals = [];
    for (var m = 0; m < plain.length; m++) plainVals.push(L_charToVal(plain[m]));
    var target = null;
    if (level <= 2) {
      target = [];
      for (var n = 0; n < plainVals.length; n++) target.push(plainVals[n] ^ cipherVals[n]);
    }
    // crib = 明文中最长的词（≥5 字母）
    var crib = '';
    plain.split(/[^A-Z]+/).forEach(function (wd) { if (wd.length >= 5 && wd.length > crib.length) crib = wd; });
    var knownChi = [], knownPsi = [], unknownChi = [], unknownPsi = [];
    if (level === 1) { knownChi = [0, 1, 2, 3, 4]; knownPsi = [2, 3, 4]; unknownPsi = [0, 1]; }
    else if (level === 2) { knownChi = [2, 3, 4]; knownPsi = [0, 1, 2, 3, 4]; unknownChi = [0, 1]; }
    else { knownChi = [2, 3, 4]; knownPsi = [0, 1, 2, 3, 4]; unknownChi = [0, 1]; }
    return { level: level, cipher: cipher, cipherVals: cipherVals, plain: plain,
      chiPos: chiPos, psiPos: psiPos, muPos: muPos,
      knownChi: knownChi, knownPsi: knownPsi, unknownChi: unknownChi, unknownPsi: unknownPsi,
      target: target, crib: crib };
  }

  /** KPA 密钥流匹配（L1/L2） */
  function L_matchCount(chiPos, psiPos, muPos, target) {
    var ks = L_keyStream(target.length, chiPos, psiPos, muPos);
    var m = 0;
    for (var i = 0; i < target.length; i++) if (ks[i] === target[i]) m++;
    return m;
  }
  /* ==LORENZ-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var CHI_LBL = ['χ1·41', 'χ2·31', 'χ3·29', 'χ4·26', 'χ5·23'];
  var PSI_LBL = ['ψ1·43', 'ψ2·47', 'ψ3·51', 'ψ4·53', 'ψ5·59'];
  var LEVEL_INFO = [
    { t: T('gs.lorenz.l1t'), d: T('gs.lorenz.l1d') },
    { t: T('gs.lorenz.l2t'), d: T('gs.lorenz.l2d') },
    { t: T('gs.lorenz.l3t'), d: T('gs.lorenz.l3d') }
  ];

  root.innerHTML =
    '<div class="lz-wrap">' +
    '  <div class="lz-tabs">' +
    '    <button class="btn mode-btn" id="lz-tab-demo">' + T('gs.lorenz.tabDemo') + '</button>' +
    '    <button class="btn mode-btn selected" id="lz-tab-chal">' + T('gs.lorenz.tabChal') + '</button>' +
    '  </div>' +

    /* ---- 演示 ---- */
    '  <div id="lz-demo" style="display:none">' +
    '    <div class="lz-flavor">' + T('gs.lorenz.demoFlavor') + '</div>' +
    '    <div class="lz-demo-row">' +
    '      <div class="lz-grp"><div class="lz-grp-t">' + T('gs.lorenz.chiStart') + '</div>' +
    '        <div id="lz-chi"></div></div>' +
    '      <div class="lz-grp"><div class="lz-grp-t">' + T('gs.lorenz.psiStart') + '</div>' +
    '        <div id="lz-psi"></div></div>' +
    '      <div class="lz-grp"><div class="lz-grp-t">' + T('gs.lorenz.muStart') + '</div>' +
    '        <div id="lz-mu"></div></div>' +
    '    </div>' +
    '    <div class="lz-lbl">' + T('gs.lorenz.plainLbl') + '</div>' +
    '    <input class="lz-in" id="lz-in" maxlength="80" value="THE ATTACK AT DAWN" autocomplete="off">' +
    '    <div class="lz-row">' +
    '      <button class="btn" id="lz-enc">' + T('gs.lorenz.encBtn') + '</button>' +
    '      <button class="btn" id="lz-dec">' + T('gs.lorenz.decBtn') + '</button>' +
    '    </div>' +
    '    <div class="lz-out" id="lz-out"></div>' +
    '  </div>' +

    /* ---- 挑战 ---- */
    '  <div id="lz-chal">' +
    '    <div class="lz-info"><span id="lz-lev"></span><span id="lz-timer">0s</span></div>' +
    '    <div class="lz-flavor" id="lz-brief"></div>' +
    '    <div class="lz-lbl">' + T('gs.lorenz.cipherLbl') + '</div>' +
    '    <div class="lz-cipher" id="lz-cipher"></div>' +
    '    <div id="lz-ksbox"><div class="lz-lbl">' + T('gs.lorenz.ksLbl') + '</div>' +
    '      <div class="lz-ks" id="lz-ks"></div></div>' +
    '    <div class="lz-lbl" id="lz-know"></div>' +
    '    <div id="lz-op"></div>' +
    '    <div class="lz-lbl" id="lz-prevlbl">' + T('gs.lorenz.prevLbl') + '</div>' +
    '    <div class="lz-out" id="lz-prev"></div>' +
    '    <div class="lz-match"><span id="lz-mlbl">' + T('gs.lorenz.matchLbl') + '</span><div class="progress-bar slim"><i id="lz-mbar" style="width:0%"></i></div><b id="lz-mnum">0/0</b></div>' +
    '    <div class="lz-row">' +
    '      <button class="btn" id="lz-hint">' + T('gs.lorenz.hintBtn') + '</button>' +
    '      <button class="btn" id="lz-submit">' + T('gs.lorenz.submitBtn') + '</button>' +
    '    </div>' +
    '    <div class="lz-msg" id="lz-msg"></div>' +
    '  </div>' +
    '  <div class="lz-overlay hidden" id="lz-overlay">' +
    '    <h2 id="lz-ov-title"></h2>' +
    '    <p id="lz-ov-text"></p>' +
    '    <button class="btn" id="lz-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var tabDemo = document.getElementById('lz-tab-demo');
  var tabChal = document.getElementById('lz-tab-chal');
  var demoEl = document.getElementById('lz-demo');
  var chalEl = document.getElementById('lz-chal');
  function showTab(which) {
    demoEl.style.display = which === 'demo' ? '' : 'none';
    chalEl.style.display = which === 'chal' ? '' : 'none';
    tabDemo.classList.toggle('selected', which === 'demo');
    tabChal.classList.toggle('selected', which === 'chal');
    Arcade.audio && Arcade.audio.play('ui');
  }
  tabDemo.addEventListener('click', function () { showTab('demo'); });
  tabChal.addEventListener('click', function () { showTab('chal'); });

  /* ---------- 演示 ---------- */
  var demoChi = [0, 0, 0, 0, 0];
  var demoPsi = [0, 0, 0, 0, 0];
  var demoMu = 0;
  function buildDemoWheel(box, labels, lens, arr, prefix) {
    for (var i = 0; i < labels.length; i++) {
      (function (idx, lb, len) {
        var cell = document.createElement('div');
        cell.className = 'lz-dwheel';
        cell.innerHTML =
          '<div class="lz-dwname">' + lb + '</div>' +
          '<div class="lz-dwpos" id="' + prefix + '-' + idx + '">' + arr[idx] + '</div>' +
          '<button class="btn lz-wbtn" data-i="' + idx + '" data-d="-1">◀</button>' +
          '<button class="btn lz-wbtn" data-i="' + idx + '" data-d="1">▶</button>';
        box.appendChild(cell);
      })(i, labels[i], lens[i]);
    }
    var bs = box.querySelectorAll('button[data-i]');
    for (var k = 0; k < bs.length; k++) {
      bs[k].addEventListener('click', function () {
        var idx = parseInt(this.dataset.i, 10), d = parseInt(this.dataset.d, 10);
        var len = lens[idx];
        arr[idx] = (arr[idx] + d + len) % len;
        document.getElementById(prefix + '-' + idx).textContent = arr[idx];
        if (Arcade.audio) Arcade.audio.play('ui');
      });
    }
  }
  buildDemoWheel(document.getElementById('lz-chi'), CHI_LBL, L_CHI_LEN, demoChi, 'lz-dc');
  buildDemoWheel(document.getElementById('lz-psi'), PSI_LBL, L_PSI_LEN, demoPsi, 'lz-dp');
  (function () {
    var cell = document.createElement('div');
    cell.className = 'lz-dwheel';
    var bDec = document.createElement('button');
    bDec.className = 'btn lz-wbtn';
    bDec.textContent = '◀';
    var bInc = document.createElement('button');
    bInc.className = 'btn lz-wbtn';
    bInc.textContent = '▶';
    var pos = document.createElement('div');
    pos.className = 'lz-dwpos';
    pos.id = 'lz-dmu';
    pos.textContent = '0';
    var nameEl = document.createElement('div');
    nameEl.className = 'lz-dwname';
    nameEl.textContent = 'μ·37';
    cell.appendChild(nameEl);
    cell.appendChild(pos);
    cell.appendChild(bDec);
    cell.appendChild(bInc);
    document.getElementById('lz-mu').appendChild(cell);
    bDec.addEventListener('click', function () { demoMu = (demoMu - 1 + 37) % 37; document.getElementById('lz-dmu').textContent = demoMu; });
    bInc.addEventListener('click', function () { demoMu = (demoMu + 1) % 37; document.getElementById('lz-dmu').textContent = demoMu; });
  })();
  var outEl = document.getElementById('lz-out');
  document.getElementById('lz-enc').addEventListener('click', function () {
    var v = document.getElementById('lz-in').value.toUpperCase();
    outEl.textContent = L_encrypt(v, demoChi.slice(), demoPsi.slice(), demoMu);
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  document.getElementById('lz-dec').addEventListener('click', function () {
    var v = document.getElementById('lz-in').value.toUpperCase();
    outEl.textContent = L_decrypt(v, demoChi.slice(), demoPsi.slice(), demoMu);
    if (Arcade.audio) Arcade.audio.play('coin');
  });

  /* ---------- 挑战 ---------- */
  var chal = null;
  var chalStart = 0, totalMs = 0, levelIdx = 0;
  var timerTick = null;
  var levEl = document.getElementById('lz-lev');
  var timerEl = document.getElementById('lz-timer');
  var briefEl = document.getElementById('lz-brief');
  var cipherEl = document.getElementById('lz-cipher');
  var ksBox = document.getElementById('lz-ksbox');
  var ksEl = document.getElementById('lz-ks');
  var knowEl = document.getElementById('lz-know');
  var opEl = document.getElementById('lz-op');
  var prevlbl = document.getElementById('lz-prevlbl');
  var prevEl = document.getElementById('lz-prev');
  var mlbl = document.getElementById('lz-mlbl');
  var mbar = document.getElementById('lz-mbar');
  var mnum = document.getElementById('lz-mnum');
  var msgEl = document.getElementById('lz-msg');
  var overlayEl = document.getElementById('lz-overlay');
  var ovTitle = document.getElementById('lz-ov-title');
  var ovText = document.getElementById('lz-ov-text');
  var ovBtn = document.getElementById('lz-ov-btn');

  var playChi = [0, 0, 0, 0, 0];
  var playPsi = [0, 0, 0, 0, 0];

  function fullPos() {
    var chi = playChi.slice(), psi = playPsi.slice();
    return { chi: chi, psi: psi, mu: chal.muPos };
  }

  function refresh() {
    var fp = fullPos();
    if (chal.level <= 2) {
      var m = L_matchCount(fp.chi, fp.psi, fp.mu, chal.target);
      mbar.style.width = Math.round(m / chal.target.length * 100) + '%';
      mnum.textContent = m + '/' + chal.target.length;
    } else {
      var dec = L_decrypt(chal.cipher, fp.chi, fp.psi, fp.mu);
      prevEl.textContent = dec;
      var s = L_score(dec, chal.crib);
      var max = 2600;
      mbar.style.width = Math.min(100, Math.round(s / max * 100)) + '%';
      mnum.textContent = s;
    }
  }

  function buildOps() {
    opEl.innerHTML = '';
    var unk = [];
    if (chal.level === 1) unk = chal.unknownPsi.map(function (i) { return { idx: i, len: L_PSI_LEN[i], lbl: PSI_LBL[i], kind: 'psi' }; });
    else unk = chal.unknownChi.map(function (i) { return { idx: i, len: L_CHI_LEN[i], lbl: CHI_LBL[i], kind: 'chi' }; });
    unk.forEach(function (u, k) {
      if (u.kind === 'psi') playPsi[u.idx] = 0; else playChi[u.idx] = 0;
      var row = document.createElement('div');
      row.className = 'lz-posrow';
      row.innerHTML =
        '<span class="lz-plbl">' + T('gs.lorenz.unknown') + ' · ' + u.lbl + '</span>' +
        '<button class="btn lz-wbtn" data-k="' + k + '" data-d="-1">◀</button>' +
        '<b class="lz-pval" id="lz-pv-' + u.kind + '-' + u.idx + '">0</b>' +
        '<button class="btn lz-wbtn" data-k="' + k + '" data-d="1">▶</button>';
      opEl.appendChild(row);
    });
    // 已知轮位只读显示
    var known = [];
    chal.knownChi.forEach(function (i) { playChi[i] = chal.chiPos[i]; known.push({ lbl: CHI_LBL[i], v: chal.chiPos[i], kind: 'chi' }); });
    chal.knownPsi.forEach(function (i) { playPsi[i] = chal.psiPos[i]; known.push({ lbl: PSI_LBL[i], v: chal.psiPos[i], kind: 'psi' }); });
    known.forEach(function (kd) {
      var row = document.createElement('div');
      row.className = 'lz-posrow known';
      row.innerHTML = '<span class="lz-plbl">' + kd.lbl + '</span><b class="lz-pval">' + kd.v + '</b><span class="lz-ok">' + T('gs.lorenz.knownBadge') + '</span>';
      opEl.appendChild(row);
    });
    var bs = opEl.querySelectorAll('button[data-k]');
    for (var i = 0; i < bs.length; i++) {
      bs[i].addEventListener('click', function () {
        var k = parseInt(this.dataset.k, 10), d = parseInt(this.dataset.d, 10);
        var u = unk[k];
        if (u.kind === 'psi') { playPsi[u.idx] = (playPsi[u.idx] + d + u.len) % u.len; document.getElementById('lz-pv-psi-' + u.idx).textContent = playPsi[u.idx]; }
        else { playChi[u.idx] = (playChi[u.idx] + d + u.len) % u.len; document.getElementById('lz-pv-chi-' + u.idx).textContent = playChi[u.idx]; }
        refresh();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
    }
  }

  /* 提示：机器扫描 */
  function doHint() {
    var t0 = Date.now();
    var hintTxt = '';
    if (chal.level === 1) {
      var best = [];
      for (var a = 0; a < 43; a++)
        for (var b = 0; b < 47; b++) {
          var psi = chal.psiPos.slice(); psi[0] = a; psi[1] = b;
          best.push({ p: [a, b], m: L_matchCount(chal.chiPos, psi, chal.muPos, chal.target) });
        }
      best.sort(function (x, y) { return y.m - x.m; });
      hintTxt = T('gs.lorenz.hintPsi').replace('{n}', best.slice(0, 3).map(function (x) { return '(' + x.p[0] + ',' + x.p[1] + ')'; }).join(' / '));
    } else if (chal.level === 2) {
      var best2 = [];
      for (var a = 0; a < 41; a++)
        for (var b = 0; b < 31; b++) {
          var chi = chal.chiPos.slice(); chi[0] = a; chi[1] = b;
          best2.push({ p: [a, b], m: L_matchCount(chi, chal.psiPos, chal.muPos, chal.target) });
        }
      best2.sort(function (x, y) { return y.m - x.m; });
      hintTxt = T('gs.lorenz.hintChi').replace('{n}', best2.slice(0, 3).map(function (x) { return '(' + x.p[0] + ',' + x.p[1] + ')'; }).join(' / '));
    } else {
      var best3 = [];
      for (var a = 0; a < 41; a++)
        for (var b = 0; b < 31; b++) {
          var chi3 = chal.chiPos.slice(); chi3[0] = a; chi3[1] = b;
          var dec = L_decrypt(chal.cipher, chi3, chal.psiPos, chal.muPos);
          best3.push({ p: [a, b], s: L_score(dec, chal.crib) });
        }
      best3.sort(function (x, y) { return y.s - x.s; });
      hintTxt = T('gs.lorenz.hintStat').replace('{n}', best3.slice(0, 3).map(function (x) { return '(' + x.p[0] + ',' + x.p[1] + '·' + x.s + ')'; }).join(' / '));
    }
    msgEl.textContent = '💡 ' + hintTxt + T('gs.lorenz.scanMs').replace('{n}', Date.now() - t0);
    if (Arcade.audio) Arcade.audio.play('coin');
  }

  function startLevel() {
    chalStart = Date.now(); // 每关起算（totalMs 跨关累计）
    chal = L_genChallenge(levelIdx + 1);
    levEl.textContent = LEVEL_INFO[levelIdx].t + ' · ' + T('gs.lorenz.levelOf').replace('{n}', levelIdx + 1);
    briefEl.textContent = LEVEL_INFO[levelIdx].d;
    cipherEl.textContent = chal.cipher;
    if (chal.level <= 2) {
      ksBox.style.display = '';
      ksEl.textContent = chal.target.map(function (v) { return v.toString(16).toUpperCase(); }).join(' ');
      prevlbl.style.display = 'none';
      prevEl.style.display = 'none';
      mlbl.textContent = T('gs.lorenz.matchLbl');
    } else {
      ksBox.style.display = 'none';
      prevlbl.style.display = '';
      prevEl.style.display = '';
      prevEl.textContent = '';
      mlbl.textContent = T('gs.lorenz.readLbl');
    }
    var chiPart = chal.knownChi.map(function (i) { return CHI_LBL[i] + '=' + chal.chiPos[i]; }).join(' ');
    var psiPart = chal.knownPsi.map(function (i) { return PSI_LBL[i] + '=' + chal.psiPos[i]; }).join(' ');
    var cribPart = chal.level === 3 ? T('gs.lorenz.cribInfo').replace('{n}', '<b style="color:var(--neon-yellow)">' + chal.crib + '</b>') : '';
    knowEl.textContent = T('gs.lorenz.knownInfo').replace('{a}', chal.muPos).replace('{b}', chiPart).replace('{c}', psiPart).replace('{d}', cribPart);
    buildOps();
    mbar.style.width = '0%';
    mnum.textContent = '0';
    msgEl.textContent = '';
    refresh();
  }

  var finished = false;
  document.getElementById('lz-hint').addEventListener('click', doHint);
  document.getElementById('lz-submit').addEventListener('click', function () {
    if (!chal || finished) return;
    var fp = fullPos();
    if (chal.level <= 2) {
      var m = L_matchCount(fp.chi, fp.psi, fp.mu, chal.target);
      if (m === chal.target.length) { winLevel(); }
      else { msgEl.textContent = T('gs.lorenz.mismatch').replace('{a}', m).replace('{b}', chal.target.length); if (Arcade.audio) Arcade.audio.play('error'); }
    } else {
      var dec = L_decrypt(chal.cipher, fp.chi, fp.psi, fp.mu);
      if (dec === chal.plain) { winLevel(); }
      else {
        var bad = 0;
        for (var i = 0; i < chal.plain.length; i++) if (dec[i] !== chal.plain[i]) bad++;
        msgEl.textContent = T('gs.lorenz.badChars').replace('{n}', bad);
        if (Arcade.audio) Arcade.audio.play('error');
      }
    }
  });

  function winLevel() {
    totalMs += Date.now() - chalStart;
    if (Arcade.juice) Arcade.juice.win();
    if (levelIdx < 2) {
      levelIdx++;
      startLevel();
      if (Arcade.ui) Arcade.ui.toast(T('gs.lorenz.winLevel').replace('{n}', levelIdx + 1), 'win');
    } else {
      finished = true;
      ovTitle.textContent = T('gs.lorenz.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.lorenz.winD').replace('{n}', totalSec());
      ovBtn.textContent = T('gs.lorenz.again');
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

  function resetClock() {
    totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

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
    { t: T('gs.lorenz.tut1t'), d: T('gs.lorenz.tut1') },
    { t: T('gs.lorenz.tut2t'), d: T('gs.lorenz.tut2') },
    { t: T('gs.lorenz.tut3t'), d: T('gs.lorenz.tut3') },
    { t: T('gs.lorenz.tut4t'), d: T('gs.lorenz.tut4') }
  ];

})();
