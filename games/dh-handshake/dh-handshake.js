/* 破译 DECODE ARCADE · DH 握手场 —— B4 旗舰
   真实模幂交换（可换 p/g 组）、共享密钥验证、Eve 中间人、参数退化陷阱、史实红线。
   答对 +20，满分 120。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.dh-handshake.tut1t'), d: T('gs.dh-handshake.tut1') },
  { t: T('gs.dh-handshake.tut2t'), d: T('gs.dh-handshake.tut2') },
  { t: T('gs.dh-handshake.tut3t'), d: T('gs.dh-handshake.tut3') }
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
  function randEx() { return 3 + Math.floor(rnd() * 10); }

  /* 可换参数组（教学小模数；真实世界 p 为 2048+ 位） */
  var PARAMS = [
    { p: 23, g: 5 },
    { p: 31, g: 3 },
    { p: 29, g: 2 },
    { p: 47, g: 5 }
  ];

  var TOTAL = 6;
  var idx2 = 0, score = 0, finished = false,
      cur = null, curA = 0, locked = false,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'dh-wrap';
  wrap.innerHTML =
    '<div class="dh-prog" id="dh-prog"></div>' +
    '<div class="dh-stage" id="dh-stage"></div>' +
    '<div class="dh-param" id="dh-params"></div>' +
    '<div class="dh-q" id="dh-q"></div>' +
    '<div class="dh-opts" id="dh-opts"></div>' +
    '<div class="dh-msg" id="dh-msg"></div>' +
    '<div class="dh-expl" id="dh-expl"></div>' +
    '<div class="dh-opts"><button class="btn green" id="dh-next" hidden></button>' +
    '<button class="btn" id="dh-reg">' + T('gs.dh-handshake.regBtn') + '</button></div>' +
    '<div class="dh-opts"><button class="btn" id="dh-daily">' + T('gs.dh-handshake.dailyBtn') + '</button></div>' +
    '<div class="dh-help">' + T('gs.dh-handshake.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('dh-prog'), stageEl = $('dh-stage'), paramEl = $('dh-params'), qEl = $('dh-q'),
      optsEl = $('dh-opts'), msgEl = $('dh-msg'), explEl = $('dh-expl'),
      nextB = $('dh-next'), regB = $('dh-reg'), dailyBtn = $('dh-daily');

  function upd() { progEl.textContent = fmt('gs.dh-handshake.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'dh-msg ' + c; msgEl.textContent = t; }
  function showParams(pp) {
    paramEl.textContent = 'p = ' + pp.p + ' · g = ' + pp.g;
    paramEl.style.display = 'inline-block';
  }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    var pi = Math.floor(rnd() * PARAMS.length);
    var pp = PARAMS[pi];
    ls.push({ kind: 'pub', p: pp.p, g: pp.g, a: randEx(), e: 'e2' });
    ls.push({ kind: 'share', p: pp.p, g: pp.g, b: randEx(), e: 'e3' });
    ls.push({ kind: 'mitm', p: pp.p, g: pp.g, a: randEx(), e: randEx(), e4: 'e4' });
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
    stageEl.textContent = T('gs.dh-handshake.' + ({ know: 'stageKnow', pub: 'stagePub', share: 'stageShare', mitm: 'stageMitm' }[cur.kind]));
    qEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    locked = false;

    if (cur.kind === 'know') {
      paramEl.textContent = '';
      qEl.textContent = T('gs.dh-handshake.' + cur.q);
      renderOpts(cur.opts.map(function (k) { return T('gs.dh-handshake.' + k); }), T('gs.dh-handshake.' + cur.opts[cur.a]));
    } else if (cur.kind === 'pub') {
      showParams(cur);
      qEl.textContent = fmt('gs.dh-handshake.l2q', { p: cur.p, g: cur.g, a: cur.a });
      var A = modPow(cur.g, cur.a, cur.p);
      var d1 = modPow(cur.g, cur.a + 1, cur.p);
      var d2 = modPow(cur.g, cur.a - 1, cur.p);
      var d3 = modPow(cur.g, cur.a * 2, cur.p);
      renderOpts([String(A), String(d1), String(d2), String(d3)], String(A));
    } else if (cur.kind === 'share') {
      showParams(cur);
      var A2 = modPow(cur.g, randEx(), cur.p);
      qEl.textContent = fmt('gs.dh-handshake.l3q', { B: A2, g: cur.g, p: cur.p, b: cur.b });
      var K = modPow(A2, cur.b, cur.p);
      var s2 = modPow(A2, cur.b + 1, cur.p);
      var s3 = modPow(A2, Math.max(1, cur.b - 1), cur.p);
      var s4 = modPow(cur.g, cur.b, cur.p);
      renderOpts([String(K), String(s2), String(s3), String(s4)], String(K));
    } else if (cur.kind === 'mitm') {
      showParams(cur);
      var E = modPow(cur.g, cur.e, cur.p);
      qEl.textContent = fmt('gs.dh-handshake.l4q', { p: cur.p, g: cur.g, a: cur.a, e: cur.e });
      var k1 = modPow(E, cur.a, cur.p); /* Alice 与 Eve 的共享密钥 */
      var k2 = modPow(E, cur.a + 1, cur.p);
      var k3 = modPow(E, Math.max(1, cur.a - 1), cur.p);
      var k4 = modPow(cur.g, cur.a, cur.p); /* Alice 的公开值 A */
      renderOpts([String(k1), String(k2), String(k3), String(k4)], String(k1));
    }
    upd();
  }

  function judge(ok) {
    if (finished) return;
    locked = true;
    if (ok) { score += 20; setMsg('ok', T('gs.dh-handshake.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.dh-handshake.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    if (optsEl.children.length) {
      var pick = optsEl._pick;
      if (pick !== undefined && optsEl.children[pick]) optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
      if (!ok && optsEl.children[curA]) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    }
    explEl.textContent = '📌 ' + T('gs.dh-handshake.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }
  nextB.onclick = nextQ;

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('dh-handshake', sec); }
    paramEl.textContent = ''; stageEl.textContent = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.dh-handshake.done', { score: score }));
    nextB.textContent = T('gs.dh-handshake.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 61 + 23); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  function regen() {
    if (finished) return;
    levels = buildLevels();
    locked = false;
    renderQ();
  }
  regB.addEventListener('click', regen);
  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
