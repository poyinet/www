/* 破译 DECODE ARCADE · 哈希雪崩实验室（第四期 C2 教育向实验）
   内置纯 JS SHA-256（无依赖）：自由台实时展示 256 位指纹网格 + 随机翻位雪崩观测；
   挑战轮 5 题预测翻转比例。计分 max：对 +20 + 连击加成。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.hashlab.tut1t'), d: T('gs.hashlab.tut1') },
  { t: T('gs.hashlab.tut2t'), d: T('gs.hashlab.tut2') },
  { t: T('gs.hashlab.tut3t'), d: T('gs.hashlab.tut3') },
  { t: T('gs.hashlab.tut4t'), d: T('gs.hashlab.tut4') },
  { t: T('gs.hashlab.tut5t'), d: T('gs.hashlab.tut5') }
];

/* ---------- 纯 JS SHA-256（FIPS 180-4） ---------- */
var SHA256 = (function () {
  var K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  return function (msg) {
    var bytes = [], i;
    for (i = 0; i < msg.length; i++) {
      var c = msg.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
      else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (i = 7; i >= 0; i--) bytes.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 0xff);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (var b = 0; b < bytes.length; b += 64) {
      var W = new Array(64);
      for (i = 0; i < 16; i++) {
        W[i] = (bytes[b + i * 4] << 24) | (bytes[b + i * 4 + 1] << 16) | (bytes[b + i * 4 + 2] << 8) | bytes[b + i * 4 + 3];
      }
      for (i = 16; i < 64; i++) {
        var s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        var s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      var a = H[0], bb = H[1], cc = H[2], dd = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + W[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & bb) ^ (a & cc) ^ (bb & cc);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (dd + t1) | 0; dd = cc; cc = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + dd) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = '';
    for (i = 0; i < 8; i++) hex += ('00000000' + ((H[i] >>> 0).toString(16))).slice(-8);
    return hex;
  };
})();

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 5;

  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  var wrap = document.createElement('div');
  wrap.className = 'hl-wrap';
  wrap.innerHTML =
    '<input class="hl-input" id="hl-in" value="ATTACK AT DAWN" maxlength="40" autocomplete="off" spellcheck="false">' +
    '<div class="hl-hash" id="hl-grid"></div>' +
    '<div class="hl-btns">' +
      '<button class="btn accent" id="hl-flip"></button>' +
      '<button class="btn" id="hl-reset"></button>' +
    '</div>' +
    '<div class="hl-meter"><div id="hl-bar" style="width:0%"></div></div>' +
    '<div class="hl-stat" id="hl-stat">&nbsp;</div>' +
    '<div class="hl-q" id="hl-q"></div>' +
    '<div class="hl-btns" id="hl-opts"></div>' +
    '<div class="hl-msg" id="hl-msg"></div>' +
    '<div class="hl-btns"><button class="btn yellow" id="hl-next" hidden></button></div>' +
    '<div class="hl-bd-title" id="hl-bd-title"></div>' +
    '<div class="hl-btns" id="hl-bd-chips"></div>' +
    '<div class="hl-btns">' +
      '<button class="btn accent" id="hl-bd-start"></button>' +
      '<button class="btn" id="hl-bd-pause"></button>' +
      '<button class="btn" id="hl-bd-reset"></button>' +
    '</div>' +
    '<div class="hl-stat" id="hl-bd-stat">&nbsp;</div>' +
    '<div class="hl-bd-found" id="hl-bd-found"></div>' +
    '<div class="hl-bd-list" id="hl-bd-list"></div>' +
    '<div class="hl-help">' + T('gs.hashlab.helpText') + '</div>' +
    '<div class="hl-help">' + T('gs.hashlab.bdayHelp') + '</div>';
  root.appendChild(wrap);
  var el = function (id) { return wrap.querySelector('#' + id); };
  var input = el('hl-in'), grid = el('hl-grid'), flipBtn = el('hl-flip'), resetBtn = el('hl-reset'),
      bar = el('hl-bar'), statEl = el('hl-stat'), qEl = el('hl-q'), optsEl = el('hl-opts'),
      msgEl = el('hl-msg'), nextBtn = el('hl-next');
  flipBtn.textContent = T('gs.hashlab.flipBtn');
  resetBtn.textContent = T('gs.hashlab.resetBtn');
  var baseText = 'ATTACK AT DAWN', curText = baseText, curHash = '';
  var round = 0, score = 0, streak = 0, qIdx = 0, answered = false;

  /* 颜色：按 nibble 值取 neon 系色阶 */
  function nibColor(v) {
    var palette = ['rgba(0,240,255,.15)', 'rgba(0,240,255,.3)', 'rgba(57,255,20,.28)', 'rgba(57,255,20,.42)',
                   'rgba(255,230,0,.35)', 'rgba(255,230,0,.5)', 'rgba(255,45,149,.45)', 'rgba(185,103,255,.55)',
                   'rgba(185,103,255,.75)', 'rgba(255,45,149,.75)', 'rgba(255,230,0,.65)', 'rgba(57,255,20,.6)',
                   'rgba(0,240,255,.55)', 'rgba(255,255,255,.5)', 'rgba(255,45,149,.95)', 'rgba(255,230,0,.95)'];
    return palette[v % 16];
  }
  function renderGrid(hash, changedSet) {
    var html = '';
    for (var i = 0; i < hash.length; i++) {
      var v = parseInt(hash.charAt(i), 16);
      var cls = changedSet && changedSet[i] ? ' hl-flip' : '';
      html += '<div class="hl-cell' + cls + '" style="background:' + nibColor(v) + '">' + hash.charAt(i).toUpperCase() + '</div>';
    }
    grid.innerHTML = html;
  }

  function setBase(text) {
    baseText = text.toUpperCase().replace(/[^\x20-\x7E]/g, '') || 'ATTACK AT DAWN';
    curText = baseText;
    curHash = SHA256(curText);
    renderGrid(curHash, null);
    bar.style.width = '0%';
    statEl.innerHTML = '&nbsp;';
  }

  /* 随机翻一位：返回 {bits, pct, changedSet} */
  function flipRandomBit() {
    if (!curText.length) return null;
    var charIdx = Math.floor(Math.random() * curText.length);
    var newCode;
    do { newCode = curText.charCodeAt(charIdx) ^ (1 << Math.floor(Math.random() * 7)); } while (newCode < 0x20);
    curText = curText.slice(0, charIdx) + String.fromCharCode(newCode) + curText.slice(charIdx + 1);
    input.value = curText;
    var newHash = SHA256(curText);
    var bits = 0, changedSet = {};
    for (var i = 0; i < 64; i++) {
      var a = parseInt(curHash.charAt(i), 16), b = parseInt(newHash.charAt(i), 16);
      var d = a ^ b;
      for (var j = 0; j < 4; j++) if (d & (1 << j)) { bits++; changedSet[i] = 1; }
    }
    renderGrid(newHash, changedSet);
    var res = { bits: bits, pct: Math.round(bits / 256 * 100) };
    curHash = newHash;
    return res;
  }

  /* ---------- 挑战轮 ---------- */
  var QUESTIONS = ['THE EAGLE HAS LANDED', 'MEET ME AT THE CODE ROOM', 'CRYPTOGRAPHY IS MATHEMATICS',
                   'VENONA FILES SEALED', 'QUANTUM DAWN PROTOCOL'];
  var current = null;

  function newRound() {
    round++; qIdx = 0; score = 0; streak = 0;
    msgEl.textContent = ''; msgEl.className = 'hl-msg';
    nextBtn.hidden = true;
    nextQuestion();
  }
  function nextQuestion() {
    answered = false;
    var pos = 1 + Math.floor(Math.random() * 12);
    current = { base: QUESTIONS[(round - 1 + qIdx) % QUESTIONS.length], pos: pos };
    input.value = current.base;
    setBase(current.base);
    qEl.textContent = fmt('gs.hashlab.explainTitle', { n: qIdx + 1, total: TOTAL, streak: streak }) + '　' +
      fmt('gs.hashlab.qText', { base: current.base.slice(0, 14) + (current.base.length > 14 ? '…' : ''), pos: pos });
    optsEl.innerHTML = '';
    [T('gs.hashlab.optFew'), T('gs.hashlab.optHalf'), T('gs.hashlab.optMore')].forEach(function (label, i) {
      var b = document.createElement('button');
      b.className = 'btn ' + ['accent', 'yellow', 'pink'][i];
      b.textContent = label;
      b.addEventListener('click', function () { answer(i); });
      optsEl.appendChild(b);
    });
  }
  function answer(optIdx) {
    if (answered) return;
    answered = true;
    /* 执行翻转：先重置为基准（防自由台打字污染基线），再翻转指定字符的一个安全比特 */
    curText = current.base;
    curHash = SHA256(curText);
    var charIdx = Math.min(Math.max(0, current.pos - 1), curText.length - 1);
    var newCode;
    do { newCode = curText.charCodeAt(charIdx) ^ (1 << Math.floor(Math.random() * 7)); } while (newCode < 0x20);
    curText = curText.slice(0, charIdx) + String.fromCharCode(newCode) + curText.slice(charIdx + 1);
    input.value = curText;
    var newHash = SHA256(curText);
    var bits = 0, changedSet = {};
    for (var i = 0; i < 64; i++) {
      var d = parseInt(curHash.charAt(i), 16) ^ parseInt(newHash.charAt(i), 16);
      for (var j = 0; j < 4; j++) if (d & (1 << j)) { bits++; changedSet[i] = 1; }
    }
    renderGrid(newHash, changedSet);
    curHash = newHash;
    bar.style.width = Math.round(bits / 256 * 100 * 2) + '%';
    statEl.textContent = fmt('gs.hashlab.avalancheStat', { bits: bits, pct: Math.round(bits / 256 * 100) });

    var correctOpt = (bits < 26) ? 0 : (bits <= 230 ? 1 : 2);
    var ok = optIdx === correctOpt;
    var gained = 0;
    if (ok) { streak++; gained = 20 + (streak - 1) * 5; score += gained; }
    else { streak = 0; }
    msgEl.className = 'hl-msg ' + (ok ? 'ok' : 'no');
    msgEl.textContent = ok ? fmt('gs.hashlab.okMsg', { pts: '+' + gained }) : fmt('gs.hashlab.noMsg', { bits: bits });
    if (Arcade.juice) Arcade.juice[ok ? 'win' : 'lose']();
    qIdx++;
    setTimeout(function () {
      if (qIdx >= TOTAL) {
        if (Arcade.shell) Arcade.shell.submitScore(score);
        nextBtn.textContent = T('gs.hashlab.nextBtn');
        msgEl.textContent = fmt('gs.hashlab.doneMsg', { score: score });
        nextBtn.hidden = false;
      } else {
        nextQuestion();
      }
    }, 1400);
  }

  /* ---------- 生日攻击观测台（截断指纹演示，非真实碰撞） ---------- */
  var bdTitle = el('hl-bd-title'), bdChips = el('hl-bd-chips'),
      bdStart = el('hl-bd-start'), bdPause = el('hl-bd-pause'), bdClear = el('hl-bd-reset'),
      bdStat = el('hl-bd-stat'), bdFound = el('hl-bd-found'), bdList = el('hl-bd-list');
  bdTitle.textContent = T('gs.hashlab.bdayTitle');
  bdStart.textContent = T('gs.hashlab.bdayStart');
  bdPause.textContent = T('gs.hashlab.bdayPause');
  bdClear.textContent = T('gs.hashlab.bdayReset');
  var BD_WIDTHS = [16, 20, 24], BD_BATCH = 600, BD_MAX_FOUND = 3, BD_MAX_TRIALS = 2000000;
  var bd = { bits: 20, running: false, attempts: 0, seen: new Map(), found: [], timer: null };
  function fmtInt(n) { return ('' + n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function bdExpected() {
    return Math.round(Math.sqrt(Math.PI / 2) * Math.sqrt(Math.pow(2, bd.bits)));
  }
  function renderBdayChips() {
    bdChips.innerHTML = '';
    BD_WIDTHS.forEach(function (w) {
      var c = document.createElement('button');
      c.className = 'hl-chip' + (w === bd.bits ? ' on' : '');
      c.textContent = fmt('gs.hashlab.bdayChip', { n: w });
      c.addEventListener('click', function () {
        if (bd.bits === w) return;
        bd.bits = w;
        bdayStop();
        bdayResetStats();
      });
      bdChips.appendChild(c);
    });
  }
  function renderBday() {
    bdStat.textContent = fmt('gs.hashlab.bdayStat', {
      attempts: fmtInt(bd.attempts),
      unique: fmtInt(bd.seen.size),
      expected: fmtInt(bdExpected())
    });
  }
  function renderBdayList() {
    if (!bd.found.length) { bdFound.innerHTML = '&nbsp;'; bdList.innerHTML = ''; return; }
    bdFound.textContent = T('gs.hashlab.bdayFound') + ' ' + bd.found.length;
    var html = '';
    bd.found.forEach(function (f) {
      html += '<div>' + fmt('gs.hashlab.bdayPair', { a: f.a, b: f.b, fp: '<b style="color:var(--neon-yellow)">' + f.fp.toUpperCase() + '</b>' }) + '</div>';
    });
    bdList.innerHTML = html;
  }
  function bdayStop() {
    bd.running = false;
    if (bd.timer) { clearTimeout(bd.timer); bd.timer = null; }
    bdStart.hidden = false;
    bdPause.hidden = true;
  }
  function bdayResetStats() {
    bd.attempts = 0;
    bd.seen = new Map();
    bd.found = [];
    renderBday();
    renderBdayList();
  }
  function bdayStep() {
    if (!bd.running) return;
    var hexChars = bd.bits / 4;
    for (var i = 0; i < BD_BATCH; i++) {
      var id = ++bd.attempts;
      var fp = SHA256('BD#' + id).slice(0, hexChars);
      var prev = bd.seen.get(fp);
      if (prev !== undefined) {
        bd.found.push({ a: prev, b: id, fp: fp });
        if (Arcade.juice) Arcade.juice.win();
        if (bd.found.length >= BD_MAX_FOUND) {
          renderBday(); renderBdayList();
          bdStat.textContent += ' · ' + fmt('gs.hashlab.bdayDone', { n: bd.found.length });
          bdayStop();
          return;
        }
      } else {
        bd.seen.set(fp, id);
      }
    }
    renderBday();
    if (bd.attempts >= BD_MAX_TRIALS) { bdayStop(); return; }
    bd.timer = setTimeout(bdayStep, 0);
  }
  bdStart.addEventListener('click', function () {
    if (bd.running) return;
    bd.running = true;
    bdStart.hidden = true;
    bdPause.hidden = false;
    bdayStep();
  });
  bdPause.addEventListener('click', bdayStop);
  bdClear.addEventListener('click', function () {
    bdayStop();
    bdayResetStats();
  });
  bdPause.hidden = true;
  renderBdayChips();
  renderBday();

  flipBtn.addEventListener('click', function () {
    var r = flipRandomBit();
    if (r) statEl.textContent = fmt('gs.hashlab.avalancheStat', { bits: r.bits, pct: r.pct });
    bar.style.width = Math.round(r.pct * 2) + '%';
  });
  resetBtn.addEventListener('click', function () {
    input.value = baseText;
    setBase(baseText);
  });
  /* 自由台：打字实时看指纹变化（不影响挑战轮基准） */
  input.addEventListener('input', function () {
    curText = input.value;
    curHash = SHA256(curText);
    renderGrid(curHash, null);
    bar.style.width = '0%';
    statEl.innerHTML = '&nbsp;';
  });
  nextBtn.addEventListener('click', newRound);
  window.GAME_RESTART = function () { bdayStop(); newRound(); };

  newRound();
})();
