/* ============================================================
   希尔密码机 Hill Cipher Machine · 矩阵加密旗舰（全网独家）
   1929 年 Lester Hill 提出第一个多字母分组密码：
   每 2 个字母一组，用 2×2 密钥矩阵做线性变换 C = K·P (mod 26)。
   只有行列式与 26 互质的密钥才可逆，才能解密。
   三模式：
   - 原理演示：拨动密钥矩阵看实时加密与行列式/逆矩阵
   - 破解挑战：3 关递进（已知密钥 / 已知明文攻击 / 密码本盲攻）
   - 自由模式：任意密钥加密，或用已知明文对反推密钥
   记分：挑战用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.hill.tut1t'), d: T('gs.hill.tut1') },
  { t: T('gs.hill.tut2t'), d: T('gs.hill.tut2') },
  { t: T('gs.hill.tut3t'), d: T('gs.hill.tut3') },
  { t: T('gs.hill.tut4t'), d: T('gs.hill.tut4') }
];

(function () {
  /* ==HILL-CORE-START== */
  var HILLCORE = (function () {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function idx(c) { return c.charCodeAt(0) - 65; }
    function mod(n, m) { return ((n % m) + m) % m; }
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
    /* 模 26 乘法逆元（扩展欧几里得），不存在返回 null */
    function modInv(a) {
      a = mod(a, 26);
      if (gcd(a, 26) !== 1) return null;
      var m = 26, t, q, x0 = 0, x1 = 1;
      while (a > 1) {
        q = Math.floor(a / m);
        t = m; m = a % m; a = t;
        t = x0; x0 = x1 - q * x0; x1 = t;
      }
      return mod(x1, 26);
    }
    function det2(m) { return mod(m[0][0] * m[1][1] - m[0][1] * m[1][0], 26); }
    function matInv2(m) {
      var d = det2(m), di = modInv(d);
      if (di === null) return null;
      return [
        [mod(di * m[1][1], 26), mod(-di * m[0][1], 26)],
        [mod(-di * m[1][0], 26), mod(di * m[0][0], 26)]
      ];
    }
    function matMulVec(m, v) {
      return [mod(m[0][0] * v[0] + m[0][1] * v[1], 26), mod(m[1][0] * v[0] + m[1][1] * v[1], 26)];
    }
    function matMul(m1, m2) {
      return [
        [mod(m1[0][0] * m2[0][0] + m1[0][1] * m2[1][0], 26), mod(m1[0][0] * m2[0][1] + m1[0][1] * m2[1][1], 26)],
        [mod(m1[1][0] * m2[0][0] + m1[1][1] * m2[1][0], 26), mod(m1[1][0] * m2[0][1] + m1[1][1] * m2[1][1], 26)]
      ];
    }
    function hillEnc(key, text) {
      var t = String(text).toUpperCase().replace(/[^A-Z]/g, '');
      if (t.length % 2 === 1) t += 'X'; // 奇数补 X
      var out = '';
      for (var i = 0; i < t.length; i += 2) {
        var v = matMulVec(key, [idx(t[i]), idx(t[i + 1])]);
        out += A[v[0]] + A[v[1]];
      }
      return out;
    }
    function hillDec(key, cipher) {
      var inv = matInv2(key);
      if (!inv) return null;
      var c = String(cipher).toUpperCase().replace(/[^A-Z]/g, '');
      if (c.length % 2 === 1) c = c.slice(0, -1);
      var out = '';
      for (var i = 0; i < c.length; i += 2) {
        var v = matMulVec(inv, [idx(c[i]), idx(c[i + 1])]);
        out += A[v[0]] + A[v[1]];
      }
      return out.replace(/X$/, ''); // 去掉补位 X（与全站约定一致）
    }
    /* 已知明文攻击：2 组「明文→密文」字母对反推密钥 K = C·P⁻¹
       输入为字符串数组：plainPairs=['AB','CD'] 表示两对明文，cipherPairs 同理。
       Hill 关系 C = K·P 中字母对是列向量，故 P 矩阵列 = 字母对。 */
    function kpa(plainPairs, cipherPairs) {
      var P = [[idx(plainPairs[0][0]), idx(plainPairs[1][0])], [idx(plainPairs[0][1]), idx(plainPairs[1][1])]];
      var C = [[idx(cipherPairs[0][0]), idx(cipherPairs[1][0])], [idx(cipherPairs[0][1]), idx(cipherPairs[1][1])]];
      var Pi = matInv2(P);
      if (!Pi) return null;
      return matMul(C, Pi);
    }
    function isInvertible(m) { return matInv2(m) !== null; }
    function genKey(rng) {
      for (var i = 0; i < 300; i++) {
        var m = [[Math.floor(rng() * 26), Math.floor(rng() * 26)], [Math.floor(rng() * 26), Math.floor(rng() * 26)]];
        if (isInvertible(m)) return m;
      }
      return null;
    }
    function letters(m) { return A[m[0][0]] + A[m[0][1]] + A[m[1][0]] + A[m[1][1]]; }
    function parseMatrix(str) {
      var s = String(str).toUpperCase().replace(/[^A-Z]/g, '');
      if (s.length !== 4) return null;
      var v = s.split('').map(idx);
      return [[v[0], v[1]], [v[2], v[3]]];
    }
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    /* 挑战词表：偶数长度、不以 X 结尾、且前 4 字母组成的矩阵行列式与 26 互质
       （保证 L2/L3 已知明文攻击一定能反推密钥） */
    var POOL = [
      'PUZZLE', 'BRIDGE', 'SPRING', 'TROPIC', 'ZEBRAS', 'PANTRY', 'RABBIT',
      'TANDEM', 'HOTDOG', 'TURTLE', 'VECTOR', 'FACTOR', 'LONDON', 'BERLIN',
      'BRAZIL', 'JORDAN', 'ZAMBIA', 'ETHIOPIA', 'ZIMBABWE', 'STRAWBERRY', 'HILLCIPHER'
    ];
    function pickCodebook(secret, rng) {
      var others = POOL.filter(function (w) { return w !== secret; });
      // Fisher-Yates 洗牌后取 7 个
      for (var i = others.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var t = others[i]; others[i] = others[j]; others[j] = t;
      }
      var cb = others.slice(0, 7);
      cb.push(secret);
      for (var k = cb.length - 1; k > 0; k--) {
        var j2 = Math.floor(rng() * (k + 1));
        var t2 = cb[k]; cb[k] = cb[j2]; cb[j2] = t2;
      }
      return cb;
    }
    function genChallenge(level, rng) {
      var key = genKey(rng), guard = 0;
      var word = POOL[Math.floor(rng() * POOL.length)];
      var cipher = hillEnc(key, word);
      // 密文末位若为 X 会与「去补位」约定冲突 → 重roll密钥
      while (cipher[cipher.length - 1] === 'X' && guard++ < 60) {
        key = genKey(rng);
        cipher = hillEnc(key, word);
      }
      return {
        level: level,
        key: key,
        message: word,
        cipher: cipher,
        codebook: level === 3 ? pickCodebook(word, rng) : null
      };
    }
    return {
      A: A, idx: idx, mod: mod, gcd: gcd, modInv: modInv,
      det2: det2, matInv2: matInv2, matMulVec: matMulVec, matMul: matMul,
      hillEnc: hillEnc, hillDec: hillDec, kpa: kpa, isInvertible: isInvertible,
      genKey: genKey, letters: letters, parseMatrix: parseMatrix,
      mulberry32: mulberry32, POOL: POOL, genChallenge: genChallenge
    };
  })();
  /* ==HILL-CORE-END== */

  var A = HILLCORE.A, idx = HILLCORE.idx;
  var hillEnc = HILLCORE.hillEnc, hillDec = HILLCORE.hillDec, kpa = HILLCORE.kpa;
  var parseMatrix = HILLCORE.parseMatrix, letters = HILLCORE.letters, genChallenge = HILLCORE.genChallenge;
  var mulberry32 = HILLCORE.mulberry32;

  /* ================= 关卡定义 ================= */
  var LEVEL_NAMES = [T('gs.hill.lvName1'), T('gs.hill.lvName2'), T('gs.hill.lvName3')];
  var LEVEL_GOAL = [T('gs.hill.lvGoal1'), T('gs.hill.lvGoal2'), T('gs.hill.lvGoal3')];
  var LEVEL_HINT = [T('gs.hill.lvHint1'), T('gs.hill.lvHint2'), T('gs.hill.lvHint3')];

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="hl-tabs">' +
    '  <button class="btn hl-tab mode-btn selected" data-mode="lab">' + T('gs.hill.modeLab') + '</button>' +
    '  <button class="btn hl-tab mode-btn" data-mode="chal">' + T('gs.hill.modeChal') + '</button>' +
    '  <button class="btn hl-tab mode-btn" data-mode="free">' + T('gs.hill.modeFree') + '</button>' +
    '</div>';

  var machineHtml =
    '<div class="hl-machine">' +
    '  <div class="hl-info"><span>' + T('gs.hill.machineTitle') + '</span><span id="hl-status">' + T('gs.hill.standby') + '</span></div>' +
    '  <div class="hl-matrix" id="hl-matrix"></div>' +
    '  <div class="hl-det" id="hl-det"></div>' +
    '</div>';

  var labHtml =
    '<div class="hl-hint">' + T('gs.hill.labHint') + '</div>' +
    '<div class="hl-row">' +
    '  <span class="hl-lbl">' + T('gs.hill.plainLbl') + '</span>' +
    '  <input id="hl-lab-in" maxlength="20" placeholder="' + T('gs.hill.inputPh') + '" aria-label="' + T('gs.hill.plainLbl') + '">' +
    '  <button class="btn yellow" id="hl-lab-back">' + T('gs.hill.backBtn') + '</button>' +
    '</div>' +
    '<div class="hl-info"><span>' + T('gs.hill.encOutLbl') + '</span></div>' +
    '<div class="hl-cipher" id="hl-lab-out">——</div>' +
    '<div class="hl-math" id="hl-lab-math"></div>';

  var chalHtml =
    '<div class="hl-info">' +
    '  <span>' + T('gs.hill.levelLbl') + ' <span class="stat-value" id="hl-level">1</span>/3 · <span class="stat-value" id="hl-lvname"></span></span>' +
    '  <span>' + T('gs.hill.timeLbl') + ' <span class="stat-value" id="hl-timer">0s</span></span>' +
    '</div>' +
    '<div class="hl-msg" id="hl-msg"></div>' +
    '<div class="hl-hint" id="hl-hint"></div>' +
    '<div class="hl-info"><span>' + T('gs.hill.cipherLbl') + '</span></div>' +
    '<div class="hl-cipher" id="hl-cipher"></div>' +
    '<div class="hl-keynotice" id="hl-keynotice" style="display:none"></div>' +
    '<div class="hl-pairs" id="hl-pairs" style="display:none"></div>' +
    '<div class="hl-codebook" id="hl-codebook" style="display:none"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn purple" id="hl-kpa" style="display:none">' + T('gs.hill.kpaBtn') + '</button>' +
    '  <button class="btn green" id="hl-dec">' + T('gs.hill.decBtn') + '</button>' +
    '</div>' +
    '<div class="hl-result" id="hl-result">——</div>' +
    '<div class="hl-row">' +
    '  <input id="hl-answer" maxlength="20" placeholder="' + T('gs.hill.ansPh') + '" aria-label="' + T('gs.hill.ansAria') + '">' +
    '  <button class="btn yellow" id="hl-submit">' + T('gs.hill.submitBtn') + '</button>' +
    '</div>';

  var freeHtml =
    '<div class="hl-hint">' + T('gs.hill.freeHint') + '</div>' +
    '<div class="hl-row">' +
    '  <span class="hl-lbl">' + T('gs.hill.plainLbl') + '</span>' +
    '  <input id="hl-free-in" maxlength="20" placeholder="' + T('gs.hill.inputPh') + '" aria-label="' + T('gs.hill.plainLbl') + '">' +
    '  <button class="btn yellow" id="hl-free-enc">' + T('gs.hill.encBtn') + '</button>' +
    '</div>' +
    '<div class="hl-info"><span>' + T('gs.hill.cipherLbl2') + '</span></div>' +
    '<div class="hl-cipher" id="hl-free-out">——</div>' +
    '<div class="hl-math" id="hl-free-math"></div>' +
    '<div class="hl-pairs">' + T('gs.hill.kpaDesc') + '</div>' +
    '<div class="hl-row">' +
    '  <input id="hl-free-p" maxlength="4" placeholder="' + T('gs.hill.kpaPPh') + '" aria-label="' + T('gs.hill.kpaPPh') + '" style="width:110px">' +
    '  <input id="hl-free-c" maxlength="4" placeholder="' + T('gs.hill.kpaCPh') + '" aria-label="' + T('gs.hill.kpaCPh') + '" style="width:110px">' +
    '  <button class="btn purple" id="hl-free-kpa">' + T('gs.hill.kpaBtn2') + '</button>' +
    '</div>' +
    '<div class="hl-result" id="hl-free-result">——</div>';

  root.innerHTML = tabsHtml + machineHtml + '<div id="hl-body">' + labHtml + '</div>';

  var keyLetters = 'AAAA';
  var mode = 'lab';
  var levelIdx = 0;
  var chal = null;
  var chalKeySet = false;
  var attempts = 0;
  var answered = false;
  var timerTick = null;
  var challengeStart = 0;
  var bodyEl = document.getElementById('hl-body');
  var statusEl = document.getElementById('hl-status');
  var matrixEl = document.getElementById('hl-matrix');
  var detEl = document.getElementById('hl-det');

  function setStatus(s, cls) {
    statusEl.textContent = s;
    statusEl.style.color = cls || '';
  }
  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }

  /* ---------- 矩阵渲染（4 个字母鼓 + 行列式/逆矩阵） ---------- */
  function renderMatrix() {
    matrixEl.innerHTML = '';
    var labels = [T('gs.hill.cellA'), T('gs.hill.cellB'), T('gs.hill.cellC'), T('gs.hill.cellD')];
    for (var i = 0; i < 4; i++) {
      var cell = document.createElement('div');
      cell.className = 'hl-cell';
      cell.innerHTML =
        '<div class="clabel">' + labels[i] + '</div>' +
        '<button class="carrow" data-dir="up" aria-label="' + T('gs.hill.ariaInc') + '">▲</button>' +
        '<div class="cletter">' + keyLetters[i] + '</div>' +
        '<button class="carrow" data-dir="down" aria-label="' + T('gs.hill.ariaDec') + '">▼</button>';
      matrixEl.appendChild(cell);
      (function (slot, el) {
        el.querySelectorAll('.carrow').forEach(function (b) {
          b.addEventListener('click', function () {
            var dir = this.getAttribute('data-dir');
            var ch = keyLetters.charCodeAt(slot) - 65;
            ch = (ch + (dir === 'up' ? 1 : 25)) % 26;
            keyLetters = keyLetters.slice(0, slot) + A[ch] + keyLetters.slice(slot + 1);
            renderMatrix();
            if (Arcade.audio) Arcade.audio.play('move');
            onKeyChanged();
          });
        });
      })(i, cell);
    }
    // 行列式与逆矩阵
    var km = parseMatrix(keyLetters);
    var inv = km ? HILLCORE.matInv2(km) : null;
    var det = km ? HILLCORE.det2(km) : -1;
    if (inv) {
      detEl.className = 'hl-det';
      detEl.innerHTML = T('gs.hill.detOk').replace('{d}', det)
        .replace('{m}', A[inv[0][0]] + ' ' + A[inv[0][1]] + ' ; ' + A[inv[1][0]] + ' ' + A[inv[1][1]]);
    } else {
      detEl.className = 'hl-det bad';
      detEl.innerHTML = T('gs.hill.detBad').replace('{d}', det);
    }
  }

  /* 密钥鼓变化后的联动（挑战 L1 实时对照通报） */
  function onKeyChanged() {
    if (mode === 'lab') { var inp = document.getElementById('hl-lab-in'); if (inp) runLab(); }
    if (mode === 'chal' && levelIdx === 0 && chal && !answered) {
      if (keyLetters === letters(chal.key)) {
        setStatus(T('gs.hill.keyMatch'), 'var(--neon-green)');
      } else {
        setStatus(T('gs.hill.keySet'), '');
      }
    }
  }

  /* ---------- 原理演示 ---------- */
  function runLab() {
    var inp = document.getElementById('hl-lab-in');
    var out = document.getElementById('hl-lab-out');
    var math = document.getElementById('hl-lab-math');
    if (!inp || !out) return;
    var v = inp.value.toUpperCase().replace(/[^A-Za-z]/g, '');
    if (v !== inp.value.replace(/[^A-Za-z]/g, '')) inp.value = v;
    if (!v) { out.textContent = '——'; math.textContent = ''; return; }
    var km = parseMatrix(keyLetters);
    var enc = hillEnc(km, v);
    out.textContent = enc;
    // 展示分块数学
    var blocks = [];
    var t = (v.length % 2 === 1 ? v + 'X' : v);
    for (var i = 0; i < t.length; i += 2) {
      blocks.push('[' + t[i] + ' ' + t[i + 1] + ']→[' + enc[i] + ' ' + enc[i + 1] + ']');
    }
    var inv = HILLCORE.matInv2(km);
    math.innerHTML = T('gs.hill.blockMath').replace('{b}', blocks.join('　')) + (inv ? '' : T('gs.hill.blockMathBad'));
    setStatus(T('gs.hill.demoMode'), '');
  }

  function labBack() {
    var out = document.getElementById('hl-lab-out');
    var math = document.getElementById('hl-lab-math');
    if (!out || out.textContent === '——') { if (Arcade.ui) Arcade.ui.toast(T('gs.hill.inputFirst'), 'warn'); return; }
    var km = parseMatrix(keyLetters);
    var inv = HILLCORE.matInv2(km);
    if (!inv) { if (Arcade.ui) Arcade.ui.toast(T('gs.hill.keyNotInv'), 'warn'); return; }
    var dec = hillDec(km, out.textContent);
    math.innerHTML = T('gs.hill.decBack').replace('{p}', dec);
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ---------- 破解挑战 ---------- */
  function startChal() {
    stopTimer();
    answered = false;
    var lv = levelIdx + 1;
    chal = genChallenge(lv, mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0));
    chalKeySet = false;
    attempts = 0;
    document.getElementById('hl-level').textContent = lv + '/3';
    document.getElementById('hl-lvname').textContent = LEVEL_NAMES[levelIdx];
    document.getElementById('hl-msg').textContent = LEVEL_GOAL[levelIdx];
    document.getElementById('hl-hint').innerHTML = LEVEL_HINT[levelIdx];
    document.getElementById('hl-cipher').textContent = chal.cipher;
    document.getElementById('hl-answer').value = '';
    var res = document.getElementById('hl-result');
    res.textContent = '——';
    res.style.color = '';
    var keyNotice = document.getElementById('hl-keynotice');
    var pairsEl = document.getElementById('hl-pairs');
    var cbEl = document.getElementById('hl-codebook');
    var kpaBtn = document.getElementById('hl-kpa');
    var decBtn = document.getElementById('hl-dec');
    keyNotice.style.display = 'none';
    pairsEl.style.display = 'none';
    cbEl.style.display = 'none';
    kpaBtn.style.display = 'none';
    decBtn.style.display = 'inline-block';
    if (lv === 1) {
      keyNotice.style.display = 'block';
      keyNotice.textContent = T('gs.hill.keyNotice').replace('{m}',
        letters(chal.key)[0] + ' ' + letters(chal.key)[1] + ' ; ' +
        letters(chal.key)[2] + ' ' + letters(chal.key)[3]);
      // 鼓轮打乱，让玩家自己拨
      var rng = mulberry32((Date.now() ^ 0x5f3759df) >>> 0);
      keyLetters = '';
      for (var i = 0; i < 4; i++) keyLetters += A[Math.floor(rng() * 26)];
      renderMatrix();
      setStatus(T('gs.hill.setKeyStatus'), '');
    } else if (lv === 2) {
      pairsEl.style.display = 'block';
      pairsEl.innerHTML = T('gs.hill.pairsLbl')
        .replace('{p1}', chal.message.substr(0, 2))
        .replace('{c1}', chal.cipher.substr(0, 2))
        .replace('{p2}', chal.message.substr(2, 2))
        .replace('{c2}', chal.cipher.substr(2, 2));
      kpaBtn.style.display = 'inline-block';
      keyLetters = 'AAAA';
      renderMatrix();
      setStatus(T('gs.hill.kpaStatus'), '');
    } else {
      cbEl.style.display = 'block';
      cbEl.innerHTML = '';
      chal.codebook.forEach(function (w) {
        var b = document.createElement('button');
        b.className = 'hl-word';
        b.textContent = w;
        b.addEventListener('click', function () { tryWord(w, b); });
        cbEl.appendChild(b);
      });
      keyLetters = 'AAAA';
      renderMatrix();
      setStatus(T('gs.hill.cbStatus'), '');
    }
    challengeStart = Date.now();
    timerTick = setInterval(function () {
      var el = document.getElementById('hl-timer');
      if (el) el.textContent = elapsed() + 's';
    }, 500);
  }

  function doKpa() {
    if (!chal) return;
    var key = kpa([chal.message.substr(0, 2), chal.message.substr(2, 2)],
                  [chal.cipher.substr(0, 2), chal.cipher.substr(2, 2)]);
    if (!key) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.hill.kpaFail'), 'warn');
      return;
    }
    keyLetters = letters(key);
    renderMatrix();
    chalKeySet = true;
    setStatus(T('gs.hill.kpaLocked'), 'var(--neon-green)');
    if (Arcade.juice) Arcade.juice.select();
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function doDec() {
    if (!chal) return;
    var res = document.getElementById('hl-result');
    if (levelIdx === 0) {
      if (keyLetters !== letters(chal.key)) {
        if (Arcade.ui) Arcade.ui.toast(T('gs.hill.keyMismatch'), 'warn');
        if (Arcade.audio) Arcade.audio.play('error');
        return;
      }
    } else if (levelIdx === 1) {
      if (!chalKeySet) {
        if (Arcade.ui) Arcade.ui.toast(T('gs.hill.kpaFirst'), 'warn');
        if (Arcade.audio) Arcade.audio.play('error');
        return;
      }
    }
    var km = parseMatrix(keyLetters);
    var dec = hillDec(km, chal.cipher);
    res.innerHTML = T('gs.hill.decResult').replace('{p}', dec);
    res.style.color = 'var(--neon-green)';
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function tryWord(w, btn) {
    if (answered || !chal) return;
    var res = document.getElementById('hl-result');
    var key = kpa([w.substr(0, 2), w.substr(2, 2)],
                  [chal.cipher.substr(0, 2), chal.cipher.substr(2, 2)]);
    if (!key) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.hill.wordNoKey'), 'warn');
      return;
    }
    keyLetters = letters(key);
    renderMatrix();
    var dec = hillDec(key, chal.cipher);
    if (dec === chal.message) {
      attempts++;
      btn.classList.add('used');
      res.innerHTML = T('gs.hill.guessHit').replace('{p}', dec).replace('{n}', attempts);
      res.style.color = 'var(--neon-green)';
      setStatus(T('gs.hill.keyLockedMsg'), 'var(--neon-green)');
      if (Arcade.juice) Arcade.juice.select();
      if (Arcade.audio) Arcade.audio.play('ui');
    } else {
      attempts++;
      btn.classList.add('used');
      res.innerHTML = T('gs.hill.guessMiss').replace('{w}', w).replace('{p}', dec).replace('{n}', attempts);
      res.style.color = '';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  function submitAnswer() {
    if (answered || !chal) return;
    var v = document.getElementById('hl-answer').value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) { if (Arcade.ui) Arcade.ui.toast(T('gs.hill.ansFirst'), 'warn'); return; }
    if (v === chal.message) {
      answered = true;
      stopTimer();
      var t = elapsed();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.audio) Arcade.audio.play('win');
      if (Arcade.shell) Arcade.shell.submitScore(t);
      var res = document.getElementById('hl-result');
      res.innerHTML = T('gs.hill.winMsg').replace('{p}', chal.message).replace('{t}', t);
      res.style.color = 'var(--neon-green)';
      setTimeout(function () {
        if (levelIdx < 2) {
          levelIdx++;
          startChal();
          if (Arcade.ui) Arcade.ui.toast(T('gs.hill.nextLevel').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.hill.allDone'), 'win');
          levelIdx = 0;
          startChal();
        }
      }, 1100);
    } else {
      if (Arcade.ui) Arcade.ui.toast(T('gs.hill.ansWrong'), 'warn');
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  /* ---------- 自由模式 ---------- */
  function freeEnc() {
    var inp = document.getElementById('hl-free-in');
    var out = document.getElementById('hl-free-out');
    var math = document.getElementById('hl-free-math');
    var v = inp.value.toUpperCase().replace(/[^A-Za-z]/g, '');
    if (v !== inp.value.replace(/[^A-Za-z]/g, '')) inp.value = v;
    if (v.length < 2) { if (Arcade.ui) Arcade.ui.toast(T('gs.hill.plainShort'), 'warn'); return; }
    var km = parseMatrix(keyLetters);
    var enc = hillEnc(km, v);
    out.textContent = enc;
    var inv = HILLCORE.matInv2(km);
    var t = (v.length % 2 === 1 ? v + 'X' : v);
    var blocks = [];
    for (var i = 0; i < t.length; i += 2) {
      blocks.push('[' + t[i] + ' ' + t[i + 1] + ']→[' + enc[i] + ' ' + enc[i + 1] + ']');
    }
    math.innerHTML = T('gs.hill.blockMath').replace('{b}', blocks.join('　')) + (inv ? '' : T('gs.hill.keyNotInvFree'));
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function freeKpa() {
    var p = document.getElementById('hl-free-p').value.toUpperCase().replace(/[^A-Z]/g, '');
    var c = document.getElementById('hl-free-c').value.toUpperCase().replace(/[^A-Z]/g, '');
    var res = document.getElementById('hl-free-result');
    if (p.length !== 4 || c.length !== 4) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.hill.kpaLen'), 'warn');
      return;
    }
    var key = kpa([p.substr(0, 2), p.substr(2, 2)], [c.substr(0, 2), c.substr(2, 2)]);
    if (!key) {
      res.textContent = T('gs.hill.kpaBad');
      res.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    keyLetters = letters(key);
    renderMatrix();
    res.innerHTML = T('gs.hill.kpaGood').replace('{m}',
      letters(key)[0] + ' ' + letters(key)[1] + ' ; ' + letters(key)[2] + ' ' + letters(key)[3]);
    res.style.color = 'var(--neon-green)';
    setStatus(T('gs.hill.kpaLoaded'), 'var(--neon-green)');
    if (Arcade.juice) Arcade.juice.select();
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ---------- 模式切换 ---------- */
  function setMode(m) {
    mode = m;
    stopTimer();
    var tabs = root.querySelectorAll('.hl-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === m);
    keyLetters = 'AAAA';
    renderMatrix();
    setStatus(m === 'chal' ? T('gs.hill.statusChal') : (m === 'free' ? T('gs.hill.statusFree') : T('gs.hill.standby')));
    if (m === 'lab') {
      bodyEl.innerHTML = labHtml;
      document.getElementById('hl-lab-in').addEventListener('input', runLab);
      document.getElementById('hl-lab-back').addEventListener('click', labBack);
      runLab();
    } else if (m === 'chal') {
      bodyEl.innerHTML = chalHtml;
      document.getElementById('hl-kpa').addEventListener('click', doKpa);
      document.getElementById('hl-dec').addEventListener('click', doDec);
      document.getElementById('hl-submit').addEventListener('click', submitAnswer);
      document.getElementById('hl-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitAnswer(); });
      levelIdx = 0;
      startChal();
    } else {
      bodyEl.innerHTML = freeHtml;
      document.getElementById('hl-free-enc').addEventListener('click', freeEnc);
      document.getElementById('hl-free-kpa').addEventListener('click', freeKpa);
      document.getElementById('hl-free-in').addEventListener('input', function () {
        var v = this.value.toUpperCase().replace(/[^A-Za-z]/g, '');
        if (v !== this.value.replace(/[^A-Za-z]/g, '')) this.value = v;
      });
    }
  }

  var tabs = root.querySelectorAll('.hl-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }

  // 初始化
  renderMatrix();
  document.getElementById('hl-lab-in').addEventListener('input', runLab);
  document.getElementById('hl-lab-back').addEventListener('click', labBack);
  runLab();

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.hill.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    stopTimer();
    mode = 'lab';
    answered = false;
    var tabs = root.querySelectorAll('.hl-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'lab');
    keyLetters = 'AAAA';
    bodyEl.innerHTML = labHtml;
    renderMatrix();
    setStatus(T('gs.hill.standby'));
    document.getElementById('hl-lab-in').addEventListener('input', runLab);
    document.getElementById('hl-lab-back').addEventListener('click', labBack);
    runLab();
  };


})();
