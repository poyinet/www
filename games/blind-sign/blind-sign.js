/* 破译 DECODE ARCADE · 盲签密约 —— 旗舰（第 142 款）
   Chaum 盲签名真实现：RSA 盲化 m′ = m·r^e、银行签名、去盲 s = s′·r^{-1}、
   验签、盲性判断（完美不可区分）、双花检测、史实。答对 +20，满分 140。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.blind-sign.tut1t'), d: T('gs.blind-sign.tut1') },
  { t: T('gs.blind-sign.tut2t'), d: T('gs.blind-sign.tut2') },
  { t: T('gs.blind-sign.tut3t'), d: T('gs.blind-sign.tut3') }
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
    if (oldR !== 1) return null;
    return ((oldS % m) + m) % m;
  }

  /* 玩具 RSA（同 DH 游戏组）：n = 47·53，e = 17 */
  var RSA = { p: 47, q: 53, e: 17 };
  RSA.n = RSA.p * RSA.q;
  RSA.phi = (RSA.p - 1) * (RSA.q - 1);
  RSA.d = modInv(RSA.e, RSA.phi);

  var TOTAL = 7;
  var idx2 = 0, score = 0, finished = false,
      cur = null, curA = 0, locked = false,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'bs-wrap';
  wrap.innerHTML =
    '<div class="bs-prog" id="bs-prog"></div>' +
    '<div class="bs-stage" id="bs-stage"></div>' +
    '<div class="bs-q" id="bs-q"></div>' +
    '<div class="bs-opts" id="bs-opts"></div>' +
    '<div class="bs-msg" id="bs-msg"></div>' +
    '<div class="bs-expl" id="bs-expl"></div>' +
    '<div class="bs-opts"><button class="btn green" id="bs-next" hidden></button>' +
    '<button class="btn" id="bs-reroll">' + T('gs.blind-sign.againBtn') + '</button></div>' +
    '<div class="bs-opts"><button class="btn" id="bs-daily">' + T('gs.blind-sign.dailyBtn') + '</button></div>' +
    '<div class="bs-help">' + T('gs.blind-sign.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('bs-prog'), stageEl = $('bs-stage'), qEl = $('bs-q'),
      optsEl = $('bs-opts'), msgEl = $('bs-msg'), explEl = $('bs-expl'),
      nextB = $('bs-next'), rerollB = $('bs-reroll'), dailyBtn = $('bs-daily');

  function upd() { progEl.textContent = fmt('gs.blind-sign.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'bs-msg ' + c; msgEl.textContent = t; }

  function goodR() {
    for (var t = 0; t < 200; t++) {
      var r = 2 + Math.floor(rnd() * (RSA.n - 3));
      if (r % RSA.p !== 0 && r % RSA.q !== 0) return r;
    }
    return 3;
  }
  function goodM() {
    /* 币序号：随机 2..n-1 且与 n 互质（可逆） */
    for (var t = 0; t < 200; t++) {
      var m = 2 + Math.floor(rnd() * (RSA.n - 3));
      if (m % RSA.p !== 0 && m % RSA.q !== 0) return m;
    }
    return 5;
  }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    /* L2 盲化 */
    var m = goodM(), r = goodR();
    var mp = (m * modPow(r, RSA.e, RSA.n)) % RSA.n;
    var d1 = (m * modPow(r + 1, RSA.e, RSA.n)) % RSA.n;
    var d2 = (m * modPow(r, 2 * RSA.e, RSA.n)) % RSA.n;
    var d3 = modPow(m, RSA.e, RSA.n);
    var opts2 = [String(mp), String(d1), String(d2), String(d3)];
    ls.push({ kind: 'blind', m: m, r: r, mp: mp, opts: opts2, e: 'e2' });
    /* L3 去盲 */
    var sp = modPow(mp, RSA.d, RSA.n);
    var s = (sp * modInv(r, RSA.n)) % RSA.n;
    var s2 = (sp * modInv(r + 1, RSA.n)) % RSA.n;
    var s3 = modPow(m, RSA.d + 1, RSA.n);
    var s4 = mp;
    var opts3 = [String(s), String(s2), String(s3), String(s4)];
    ls.push({ kind: 'unblind', sp: sp, r: r, s: s, opts: opts3, e: 'e3' });
    /* L4 验签方程（know） */
    ls.push({ kind: 'know', q: 'l4q', opts: ['l4o1', 'l4o2', 'l4o3', 'l4o4'], a: 0, e: 'e4' });
    /* L5 盲性：两枚候选币 + 视图 */
    var m0 = goodM(), m1 = goodM();
    if (m0 === m1) m1 = m1 + 1;
    ls.push({ kind: 'blindness', mp: mp, m0: m0, m1: m1, e: 'e5' });
    /* L6 双花（know） */
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3', 'l6o4'], a: 0, e: 'e6' });
    /* L7 史实（know） */
    ls.push({ kind: 'know', q: 'l7q', opts: ['l7o1', 'l7o2', 'l7o3', 'l7o4'], a: 0, e: 'e7' });
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
    stageEl.textContent = T('gs.blind-sign.' + ({ know: 'stageKnow', blind: 'stageBlind', unblind: 'stageUnblind', blindness: 'stageBrain' }[cur.kind]));
    qEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    locked = false;

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.blind-sign.' + cur.q);
      renderOpts(cur.opts.map(function (k) { return T('gs.blind-sign.' + k); }), T('gs.blind-sign.' + cur.opts[cur.a]));
    } else if (cur.kind === 'blind') {
      qEl.textContent = fmt('gs.blind-sign.l2q', { m: cur.m, r: cur.r, e: RSA.e, n: RSA.n });
      renderOpts(cur.opts, String(cur.mp));
    } else if (cur.kind === 'unblind') {
      qEl.textContent = fmt('gs.blind-sign.l3q', { sp: cur.sp, d: RSA.d });
      renderOpts(cur.opts, String(cur.s));
    } else if (cur.kind === 'blindness') {
      qEl.textContent = fmt('gs.blind-sign.l5q', { mp: cur.mp, m0: cur.m0, m1: cur.m1 });
      /* 展示两个候选 r 均可合法解出（引擎计算，帮助题面理解） */
      var r0 = null, r1 = null;
      try {
        r0 = (cur.mp * modInv(cur.m0, RSA.n)) % RSA.n;
        r0 = modPow(r0, RSA.d, RSA.n);
        r1 = (cur.mp * modInv(cur.m1, RSA.n)) % RSA.n;
        r1 = modPow(r1, RSA.d, RSA.n);
      } catch (e) {}
      explEl.textContent = '';
      renderOpts(['1', '2', '3', '4'], '1'); /* 占位不适用：直接渲染判断选项 */
      optsEl.innerHTML = '';
      ['l5o1', 'l5o2', 'l5o3', 'l5o4'].forEach(function (k, i) {
        var b = document.createElement('button');
        b.className = 'btn accent';
        b.textContent = T('gs.blind-sign.' + k);
        b.addEventListener('click', function () { optsEl._pick = i; judge(i === 0); });
        optsEl.appendChild(b);
      });
      curA = 0;
      extraNote(r0, r1);
    }
    upd();
  }
  function extraNote(r0, r1) {
    /* 在解释区预置「两个候选盲因子」的数学帮助（judge 时会被覆盖，先显示） */
    explEl.textContent = '📌 ' + fmt('gs.blind-sign.e5hint', { r0: r0 === null ? '-' : r0, r1: r1 === null ? '-' : r1 });
    explEl.classList.add('on');
  }

  function judge(ok) {
    if (finished) return;
    locked = true;
    if (ok) { score += 20; setMsg('ok', T('gs.blind-sign.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.blind-sign.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    if (optsEl.children.length) {
      var pick = optsEl._pick;
      if (pick !== undefined && optsEl.children[pick]) optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
      if (!ok && optsEl.children[curA]) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    }
    explEl.textContent = '📌 ' + T('gs.blind-sign.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }
  nextB.onclick = nextQ;

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('blind-sign', sec); }
    stageEl.textContent = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.blind-sign.done', { score: score }));
    nextB.textContent = T('gs.blind-sign.againBtn');
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
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 91 + 43); }
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
