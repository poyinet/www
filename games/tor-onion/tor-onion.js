/* 破译 DECODE ARCADE · Tor 洋葱路由 —— B2 旗舰
   真实机制教学：三跳电路规则检查（守卫稳定/家族互异/出口端口）、
   三层异或封装（教学示意，真实 Tor 为 AES-CTR）、出口可见性、
   流量分析尺寸配对、史实与边界。答对 +20，满分 140。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.tor-onion.tut1t'), d: T('gs.tor-onion.tut1') },
  { t: T('gs.tor-onion.tut2t'), d: T('gs.tor-onion.tut2') },
  { t: T('gs.tor-onion.tut3t'), d: T('gs.tor-onion.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 中继池：字段即规则数据 ---------- */
  var RELAYS = [
    { n: 'rl1', stable: true, days: 40, fam: 's', port80: true, key: 'rl1' },
    { n: 'rl2', stable: false, days: 3, fam: 't', port80: true, key: 'rl2' },
    { n: 'rl3', stable: true, days: 60, fam: 's', port80: false, key: 'rl3' },
    { n: 'rl4', stable: true, days: 90, fam: 'p', port80: true, key: 'rl4' },
    { n: 'rl5', stable: false, days: 8, fam: 't', port80: true, key: 'rl5' },
    { n: 'rl6', stable: true, days: 50, fam: 'p', port80: false, key: 'rl6' }
  ];
  var WORDS = ['CAT', 'DOG', 'APE', 'HAT', 'KEY', 'MAP'];
  var TOTAL = 7;

  var idx2 = 0, score = 0, finished = false,
      cur = null, curA = 0, locked = false,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'to-wrap';
  wrap.innerHTML =
    '<div class="to-prog" id="to-prog"></div>' +
    '<div class="to-stage" id="to-stage"></div>' +
    '<div class="to-q" id="to-q"></div>' +
    '<div class="to-extra" id="to-extra"></div>' +
    '<div class="to-opts" id="to-opts"></div>' +
    '<div class="to-msg" id="to-msg"></div>' +
    '<div class="to-expl" id="to-expl"></div>' +
    '<div class="to-opts"><button class="btn green" id="to-next" hidden></button></div>' +
    '<div class="to-opts"><button class="btn" id="to-daily">' + T('gs.tor-onion.dailyBtn') + '</button></div>' +
    '<div class="to-help">' + T('gs.tor-onion.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('to-prog'), stageEl = $('to-stage'), qEl = $('to-q'),
      extraEl = $('to-extra'), optsEl = $('to-opts'), msgEl = $('to-msg'),
      explEl = $('to-expl'), nextB = $('to-next'), dailyBtn = $('to-daily');

  function upd() { progEl.textContent = fmt('gs.tor-onion.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'to-msg ' + c; msgEl.textContent = t; }
  function hx(bs) {
    return bs.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2).toUpperCase(); }).join(' ');
  }
  function randByte() { return Math.floor(rnd() * 256); }
  function xorBytes(a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) out.push((a[i] ^ b[i]) & 255);
    return out;
  }
  function bytesOf(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  /* ---------- 级别构建 ---------- */
  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    ls.push({ kind: 'build', e: 'e2' });
    var w = WORDS[Math.floor(rnd() * WORDS.length)];
    var k1 = [], k2 = [], k3 = [];
    for (var i = 0; i < w.length; i++) { k1.push(randByte()); k2.push(randByte()); k3.push(randByte()); }
    var x1 = xorBytes(bytesOf(w), k3);
    ls.push({ kind: 'wrap', w: w, k3: k3, k1: k1, k2: k2, x1: x1, e: 'e3' });
    ls.push({ kind: 'peel', e: 'e4' });
    ls.push({ kind: 'know', q: 'l5q', opts: ['l5a1', 'l5a2', 'l5a3'], a: 2, e: 'e5', noShuffle: true });
    ls.push({ kind: 'corr', e: 'e6' });
    ls.push({ kind: 'know', q: 'l7q', opts: ['l7o1', 'l7o2', 'l7o3', 'l7o4'], a: 0, e: 'e7' });
    return ls;
  }

  /* ---------- 通用选项渲染 ---------- */
  function renderOpts(list, correctRef) {
    if (!cur.noShuffle) {
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = list[i]; list[i] = list[j]; list[j] = t;
      }
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

  /* ---------- 级别渲染 ---------- */
  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.tor-onion.' + ({ know: 'stageKnow', build: 'stageBuild', wrap: 'stageWrap', peel: 'stagePeel', corr: 'stageCorr' }[cur.kind]));
    qEl.textContent = '';
    extraEl.innerHTML = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    locked = false;

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.tor-onion.' + cur.q);
      renderOpts(cur.opts.map(function (k) { return T('gs.tor-onion.' + k); }), T('gs.tor-onion.' + cur.opts[cur.a]));
    } else if (cur.kind === 'build') {
      renderBuild();
    } else if (cur.kind === 'wrap') {
      qEl.textContent = fmt('gs.tor-onion.l3q', { m: cur.w, k: hx(cur.k3), x: '' });
      var real = hx(cur.x1);
      var d1 = hx(xorBytes(bytesOf(cur.w), cur.k2));
      var d2 = hx(xorBytes(bytesOf(cur.w), xorBytes(cur.k1, cur.k2)));
      var d3 = hx(xorBytes(bytesOf(cur.w), xorBytes(cur.k2, cur.k3)));
      renderOpts([real, d1, d2, d3], real);
    } else if (cur.kind === 'peel') {
      renderPeel();
    } else if (cur.kind === 'corr') {
      renderCorr();
    }
    upd();
  }

  /* ---------- L2 建电路 ---------- */
  var sel = [];
  function renderBuild() {
    qEl.textContent = T('gs.tor-onion.l2q');
    var r = '<div class="to-rules">' +
      '<div>• ' + T('gs.tor-onion.rule1') + '</div>' +
      '<div>• ' + T('gs.tor-onion.rule2') + '</div>' +
      '<div>• ' + T('gs.tor-onion.rule3') + '</div></div>' +
      '<div class="to-slots">' +
      '<div class="to-slot" id="to-s0">' + T('gs.tor-onion.slotGuard') + '</div>' +
      '<div class="to-slot" id="to-s1">' + T('gs.tor-onion.slotMiddle') + '</div>' +
      '<div class="to-slot" id="to-s2">' + T('gs.tor-onion.slotExit') + '</div>' +
      '</div>' +
      '<div class="to-relays" id="to-relays"></div>' +
      '<div class="to-opts"><button class="btn yellow" id="to-buildsub">' + T('gs.tor-onion.submitBuild') + '</button></div>';
    extraEl.innerHTML = r;
    sel = [];
    var order = RELAYS.slice();
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    var box = $('to-relays');
    order.forEach(function (rl) {
      var b = document.createElement('button');
      b.className = 'btn';
      b.setAttribute('data-ridx', String(RELAYS.indexOf(rl)));
      b.textContent = T('gs.tor-onion.' + rl.key);
      b.addEventListener('click', function () {
        if (locked) return;
        var ri = parseInt(b.getAttribute('data-ridx'), 10);
        var at = sel.indexOf(ri);
        if (at >= 0) sel.splice(at, 1);
        else if (sel.length < 3) sel.push(ri);
        paintSlots();
      });
      box.appendChild(b);
    });
    paintSlots();
    $('to-buildsub').addEventListener('click', function () {
      if (locked) return;
      if (sel.length < 3) { setMsg('no', T('gs.tor-onion.wrong')); return; }
      var guard = RELAYS[sel[0]], mid = RELAYS[sel[1]], exit = RELAYS[sel[2]];
      var bad = [];
      if (!guard.stable) bad.push(T('gs.tor-onion.rule1'));
      if (guard.fam === mid.fam || mid.fam === exit.fam || guard.fam === exit.fam) bad.push(T('gs.tor-onion.rule2'));
      if (!exit.port80) bad.push(T('gs.tor-onion.rule3'));
      judge(bad.length === 0, function () {
        if (bad.length) return fmt('gs.tor-onion.l2fail', { r: bad.join('；') });
        return '';
      });
    });
    function paintSlots() {
      for (var s = 0; s < 3; s++) {
        var el2 = $('to-s' + s);
        el2.textContent = T('gs.tor-onion.slot' + ['Guard', 'Middle', 'Exit'][s]) +
          (sel[s] !== undefined ? ' · ' + T('gs.tor-onion.' + RELAYS[sel[s]].key) : '');
      }
    }
  }

  /* ---------- L4 出口可见性 ---------- */
  function renderPeel() {
    qEl.textContent = T('gs.tor-onion.l4q');
    var want = [true, false, true];
    var got = [null, null, null];
    var r = '';
    for (var i = 1; i <= 3; i++) {
      r += '<div class="to-row" data-i="' + i + '"><span class="to-rl">' + T('gs.tor-onion.l4r' + i) + '</span>' +
        '<button class="btn" data-a="1">' + T('gs.tor-onion.l4yes') + '</button>' +
        '<button class="btn" data-a="0">' + T('gs.tor-onion.l4no') + '</button></div>';
    }
    r += '<div class="to-opts"><button class="btn yellow" id="to-peelsub">' + T('gs.tor-onion.submitPeel') + '</button></div>';
    extraEl.innerHTML = r;
    var rows = extraEl.querySelectorAll('.to-row');
    rows.forEach(function (rowEl) {
      var i2 = parseInt(rowEl.getAttribute('data-i'), 10) - 1;
      rowEl.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          if (locked) return;
          got[i2] = b.getAttribute('data-a') === '1';
          rowEl.querySelectorAll('button').forEach(function (b2) {
            b2.classList.remove('on');
            b2.style.borderColor = '';
          });
          b.classList.add('on');
          b.style.borderColor = 'rgba(0,240,255,.9)';
        });
      });
    });
    $('to-peelsub').addEventListener('click', function () {
      if (locked) return;
      if (got[0] === null || got[1] === null || got[2] === null) { setMsg('no', T('gs.tor-onion.wrong')); return; }
      var ok = got[0] === want[0] && got[1] === want[1] && got[2] === want[2];
      judge(ok);
    });
  }

  /* ---------- L6 尺寸配对 ---------- */
  function renderCorr() {
    qEl.textContent = T('gs.tor-onion.l6q');
    var sizes = [5, 3, 4];
    var r = '<div class="to-row"><span class="to-rl">' + T('gs.tor-onion.l6fe') + '</span>' +
      '<span class="to-cell">█████</span></div>';
    for (var i = 0; i < 3; i++) {
      var blocks = '';
      for (var j = 0; j < sizes[i]; j++) blocks += '█';
      r += '<div class="to-row"><span class="to-rl">' + T('gs.tor-onion.l6f' + (i + 1)) + '</span>' +
        '<span class="to-cell">' + blocks + '</span></div>';
    }
    extraEl.innerHTML = r;
    renderOpts(['E1', 'E2', 'E3'], 'E1');
  }

  /* ---------- 判定 ---------- */
  function judge(ok, failFn) {
    if (finished) return;
    locked = true;
    if (ok) { score += 20; setMsg('ok', T('gs.tor-onion.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.tor-onion.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    if (optsEl.children.length) {
      var pick = optsEl._pick;
      if (pick !== undefined && optsEl.children[pick]) optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
      if (!ok && optsEl.children[curA]) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    }
    explEl.textContent = '📌 ' + (ok ? T('gs.tor-onion.' + cur.e) : (failFn ? failFn() : T('gs.tor-onion.' + cur.e)));
    explEl.classList.add('on');
    nextB.onclick = nextQ;
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('tor-onion', sec); }
    stageEl.textContent = ''; qEl.textContent = '';
    extraEl.innerHTML = ''; optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.tor-onion.done', { score: score }));
    nextB.textContent = T('gs.tor-onion.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 41 + 7); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  nextB.onclick = nextQ;
  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
