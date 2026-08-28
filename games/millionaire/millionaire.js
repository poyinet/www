/* 破译 DECODE ARCADE · 百万富翁协议 —— B6 旗舰
   姚氏 1982 模型的教学现场：玩具 RSA 盲化、1-out-of-2 OT 保证、
   决策树首次分歧、门限直觉、MPC 史实。答对 +20，满分 120。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.millionaire.tut1t'), d: T('gs.millionaire.tut1') },
  { t: T('gs.millionaire.tut2t'), d: T('gs.millionaire.tut2') },
  { t: T('gs.millionaire.tut3t'), d: T('gs.millionaire.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  function modPow(b, e, m) {
    var out = 1;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) out = (out * b) % m;
      b = (b * b) % m;
      e >>= 1;
    }
    return out;
  }
  function modInv(a, m) {
    var oldR = ((a % m) + m) % m, r = m, oldS = 1, s = 0, q, tmp;
    while (r !== 0) {
      q = Math.floor(oldR / r);
      tmp = oldR - q * r; oldR = r; r = tmp;
      tmp = oldS - q * s; oldS = s; s = tmp;
    }
    return ((oldS % m) + m) % m;
  }
  function bin4(v) {
    var s = (v >>> 0).toString(2);
    while (s.length < 4) s = '0' + s;
    return s;
  }

  /* 玩具 RSA（盲化演示）：n = 47·53，e = 17 */
  var RSA = { p: 47, q: 53, n: 47 * 53, e: 17 };
  RSA.phi = (RSA.p - 1) * (RSA.q - 1);
  RSA.d = modInv(RSA.e, RSA.phi);

  var TOTAL = 6;
  var idx2 = 0, score = 0, finished = false,
      cur = null, curA = 0, locked = false,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'mil-wrap';
  wrap.innerHTML =
    '<div class="mil-prog" id="mil-prog"></div>' +
    '<div class="mil-stage" id="mil-stage"></div>' +
    '<div class="mil-q" id="mil-q"></div>' +
    '<div class="mil-opts" id="mil-opts"></div>' +
    '<div class="mil-msg" id="mil-msg"></div>' +
    '<div class="mil-expl" id="mil-expl"></div>' +
    '<div class="mil-opts"><button class="btn green" id="mil-next" hidden></button>' +
    '<button class="btn" id="mil-reroll">' + T('gs.millionaire.rerollBtn') + '</button></div>' +
    '<div class="mil-opts"><button class="btn" id="mil-daily">' + T('gs.millionaire.dailyBtn') + '</button></div>' +
    '<div class="mil-help">' + T('gs.millionaire.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('mil-prog'), stageEl = $('mil-stage'), qEl = $('mil-q'),
      optsEl = $('mil-opts'), msgEl = $('mil-msg'), explEl = $('mil-expl'),
      nextB = $('mil-next'), rerollB = $('mil-reroll'), dailyBtn = $('mil-daily');

  function upd() { progEl.textContent = fmt('gs.millionaire.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'mil-msg ' + c; msgEl.textContent = t; }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    /* L2 盲化 */
    var x = 2 + Math.floor(rnd() * (RSA.n - 3));
    var v = modPow(x, RSA.e, RSA.n);
    var x2 = (2 * x) % RSA.n;
    var x3 = (3 * x) % RSA.n;
    var opts2 = [String(x), String(x2), String(v), String(x3)];
    var seen2 = {};
    var ok2 = true;
    opts2.forEach(function (o) { if (seen2[o]) ok2 = false; seen2[o] = 1; });
    if (!ok2) { x = 5; v = modPow(x, RSA.e, RSA.n); opts2 = [String(x), String((2 * x) % RSA.n), String(v), String((3 * x) % RSA.n)]; }
    ls.push({ kind: 'blind', x: x, v: v, opts: opts2, e: 'e2' });
    ls.push({ kind: 'know', q: 'l3q', opts: ['l3o1', 'l3o2', 'l3o3', 'l3o4'], a: 0, e: 'e3' });
    /* L4 决策树 */
    var tree = null, uniq = {}, attempts = 0;
    while (!tree && attempts < 80) {
      attempts++;
      var a = Math.floor(rnd() * 15) + 1;
      var b = Math.floor(rnd() * 15) + 1;
      if (a === b) continue;
      var ab = bin4(a), bb = bin4(b);
      var pos = -1;
      for (var pi = 0; pi < 4; pi++) { if (ab.charAt(pi) !== bb.charAt(pi)) { pos = pi; break; } }
      var winner = ab.charAt(pos) === '1' ? 'A' : 'B';
      var candidates = [];
      for (var d2 = 0; d2 < 4; d2++) {
        if (d2 === pos) continue;
        candidates.push({ pos: d2, win: winner });
        candidates.push({ pos: d2, win: (winner === 'A' ? 'B' : 'A') });
      }
      var wrongs = [];
      var wset = {};
      candidates.forEach(function (c) {
        var w = c.pos + c.win;
        if (!wset[w] && wrongs.length < 3) { wset[w] = 1; wrongs.push(w); }
      });
      if (wrongs.length < 3) continue;
      var right = pos + winner;
      var all4 = [right].concat(wrongs);
      uniq = {};
      var okU = all4.every(function (w) {
        if (uniq[w]) return false;
        uniq[w] = 1;
        return true;
      });
      if (!okU) continue;
      tree = { a: a, b: b, ab: ab, bb: bb, right: right, options: all4, e: 'e4' };
    }
    if (!tree) { /* 兜底 */
      tree = { a: 10, b: 7, ab: '1010', bb: '0111', right: '0A', options: ['0A', '1B', '2A', '3B'] };
    }
    ls.push({ kind: 'tree', d: tree, e: 'e4' });
    ls.push({ kind: 'know', q: 'l5q', opts: ['l5o1', 'l5o2', 'l5o3', 'l5o4'], a: 0, e: 'e5' });
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3', 'l6o4'], a: 0, e: 'e6' });
    return ls;
  }

  function renderOpts(list, correctRef) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    curA = list.indexOf(correctRef);
    optsEl.innerHTML = '';
    list.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = o;
      b.addEventListener('click', function () { optsEl._pick = oi; judge(oi === curA); });
      optsEl.appendChild(b);
    });
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.millionaire.' + ({ know: 'stageKnow', blind: 'stageBlind', tree: 'stageTree' }[cur.kind]));
    qEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    locked = false;

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.millionaire.' + cur.q);
      renderOpts(cur.opts.map(function (k) {
        return T('gs.millionaire.' + k);
      }), T('gs.millionaire.' + cur.opts[cur.a]));
    } else if (cur.kind === 'blind') {
      qEl.textContent = fmt('gs.millionaire.l2q', { v: cur.v, n: RSA.n, e: RSA.e, d: RSA.d });
      renderOpts(cur.opts, String(cur.x));
    } else if (cur.kind === 'tree') {
      var dd = cur.d;
      qEl.textContent = fmt('gs.millionaire.l4q', { a: dd.a, ab: dd.ab, b: dd.b, bb: dd.bb });
      var labels = dd.options.map(function (c) {
        var pos = parseInt(c.slice(0, 1), 10);
        var win = c.slice(1) === 'A' ? 'A' : 'B';
        return '第 ' + (pos + 1) + ' 位 → ' + win + ' 更富';
      });
      var rightLabel = '第 ' + (parseInt(dd.right.slice(0, 1), 10) + 1) + ' 位 → ' + (dd.right.slice(1) === 'A' ? 'A' : 'B') + ' 更富';
      renderOpts(labels, rightLabel);
    }
    upd();
  }

  function judge(ok) {
    if (finished) return;
    locked = true;
    if (ok) { score += 20; setMsg('ok', T('gs.millionaire.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.millionaire.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    if (optsEl.children.length) {
      var pick = optsEl._pick;
      if (pick !== undefined && optsEl.children[pick]) optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
      if (!ok && optsEl.children[curA]) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    }
    explEl.textContent = '📌 ' + T('gs.millionaire.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }
  nextB.onclick = nextQ;

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('millionaire', sec); }
    stageEl.textContent = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.millionaire.done', { score: score }));
    nextB.textContent = T('gs.millionaire.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function regen() {
    if (finished) return;
    levels = buildLevels();
    locked = false;
    renderQ();
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 83 + 37); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  rerollB.addEventListener('click', regen);
  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
