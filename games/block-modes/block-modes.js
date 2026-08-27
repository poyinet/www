/* 破译 DECODE ARCADE · 块模式实验室 —— B3 旗舰
   真实微型块密码（2 字节块 Feistel + AES S 盒轮函数）驱动真实模式结构：
   ECB（重复块→重复密文块）/ CBC（链式 + IV）/ CTR（计数器密钥流）/ GCM（认证）。
   答对 +20，满分 140。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.block-modes.tut1t'), d: T('gs.block-modes.tut1') },
  { t: T('gs.block-modes.tut2t'), d: T('gs.block-modes.tut2') },
  { t: T('gs.block-modes.tut3t'), d: T('gs.block-modes.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- AES 官方 S 盒 ---------- */
  var SBOX_HEX =
    '637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0' +
    'b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275' +
    '09832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cf' +
    'd0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2' +
    'cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdb' +
    'e0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08' +
    'ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9e' +
    'e1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16';
  var SBOX = [];
  for (var si = 0; si < 256; si++) SBOX[si] = parseInt(SBOX_HEX.substr(si * 2, 2), 16);
  function F(x, k) { return SBOX[(x ^ k) & 255]; }
  /* 2 字节块 Feistel（2 轮 + 换位，密钥 2 字节）——逆为自己两轮反向 */
  function encBlock(P, K) {
    var l = P[0], r = P[1];
    var t = r; r = l ^ F(r, K[0]); l = t;
    t = r; r = l ^ F(r, K[1]); l = t;
    return [r, l];
  }
  function xorB(a, b) { return [(a[0] ^ b[0]) & 255, (a[1] ^ b[1]) & 255]; }
  function randByte() { return Math.floor(rnd() * 256); }
  function randKey() { return [randByte(), randByte()]; }
  function hex2(b) { return ('0' + (b & 255).toString(16)).slice(-2).toUpperCase(); }
  function hx2(a) { return hex2(a[0]) + ' ' + hex2(a[1]); }
  function fromHex(s) {
    var p = s.trim().split(/\s+/);
    return [parseInt(p[0], 16), parseInt(p[1], 16)];
  }

  /* ---------- 模式引擎 ---------- */
  function ecbEnc(blocks, K) { return blocks.map(function (b) { return encBlock(b, K); }); }
  function cbcEnc(blocks, K, iv) {
    var out = [], prev = iv;
    blocks.forEach(function (b) {
      var c = encBlock(xorB(b, prev), K);
      out.push(c); prev = c;
    });
    return out;
  }
  function ctrEnc(blocks, K, ctrBase) {
    var out = [], ks = [];
    blocks.forEach(function (b, i) {
      var ctr = [ctrBase[0], (ctrBase[1] + i) & 255];
      ks.push(encBlock(ctr, K));
      out.push(xorB(b, ks[i]));
    });
    return out;
  }

  var TOTAL = 7;
  var idx2 = 0, score = 0, finished = false,
      cur = null, curA = 0, locked = false,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'bm-wrap';
  wrap.innerHTML =
    '<div class="bm-prog" id="bm-prog"></div>' +
    '<div class="bm-stage" id="bm-stage"></div>' +
    '<div class="bm-q" id="bm-q"></div>' +
    '<div class="bm-extra" id="bm-extra"></div>' +
    '<div class="bm-opts" id="bm-opts"></div>' +
    '<div class="bm-msg" id="bm-msg"></div>' +
    '<div class="bm-expl" id="bm-expl"></div>' +
    '<div class="bm-opts"><button class="btn green" id="bm-next" hidden></button></div>' +
    '<div class="bm-opts"><button class="btn" id="bm-daily">' + T('gs.block-modes.dailyBtn') + '</button></div>' +
    '<div class="bm-help">' + T('gs.block-modes.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('bm-prog'), stageEl = $('bm-stage'), qEl = $('bm-q'),
      extraEl = $('bm-extra'), optsEl = $('bm-opts'), msgEl = $('bm-msg'),
      explEl = $('bm-expl'), nextB = $('bm-next'), dailyBtn = $('bm-daily');

  function upd() { progEl.textContent = fmt('gs.block-modes.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'bm-msg ' + c; msgEl.textContent = t; }

  /* ---------- 级别 ---------- */
  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    ls.push({ kind: 'ecb', e: 'e2' });
    var K = randKey();
    var iv = randKey();
    var p1 = randKey(), p2 = randKey();
    var c1 = encBlock(xorB(p1, iv), K);
    var c2 = encBlock(xorB(p2, c1), K);
    ls.push({ kind: 'cbc', p2: p2, c1: c1, K: K, iv: iv, c2: c2, e: 'e3' });
    ls.push({ kind: 'know', q: 'l4q', opts: ['l4o1', 'l4o2', 'l4o3', 'l4o4'], a: 0, e: 'e4' });
    var K5 = randKey();
    var ctr = [0x00, 0x01];
    var p5 = randKey();
    var ks5 = encBlock(ctr, K5);
    var c5 = xorB(p5, ks5);
    ls.push({ kind: 'ctr', ctr: ctr, K: K5, p: p5, ks: ks5, c: c5, e: 'e5' });
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3', 'l6o4'], a: 0, e: 'e6' });
    ls.push({ kind: 'know', q: 'l7q', opts: ['l7o1', 'l7o2', 'l7o3', 'l7o4'], a: 0, e: 'e7' });
    return ls;
  }

  /* ---------- 选项 ---------- */
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

  /* ---------- 网格渲染 ---------- */
  function gridHtml(vals) {
    var h = '<div class="bm-grid">';
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i];
      h += '<span class="bm-px" style="background:rgb(' + v + ',' + v + ',' + v + ')"></span>';
      if (i % 8 === 7) h += '<br>';
    }
    return h + '</div>';
  }
  var PNG = [30, 30, 30, 30, 30, 30, 30, 30,
             30, 30, 90, 90, 90, 90, 30, 30,
             30, 30, 90, 90, 90, 90, 30, 30,
             30, 30, 30, 30, 90, 30, 30, 30];

  function renderEcb() {
    qEl.textContent = T('gs.block-modes.l2q');
    var blocks = [];
    var png = [];
    for (var i = 0; i < PNG.length; i += 2) {
      blocks.push([PNG[i], PNG[i + 1]]);
      png.push(PNG[i], PNG[i + 1]);
    }
    var K = randKey();
    var iv = randKey();
    var ecb = ecbEnc(blocks, K).reduce(function (acc, b) { return acc.concat(b); }, []);
    var cbc = cbcEnc(blocks, K, iv).reduce(function (acc, b) { return acc.concat(b); }, []);
    var ctr = ctrEnc(blocks, K, [0x00, 0x01]).reduce(function (acc, b) { return acc.concat(b); }, []);
    var imgs = [
      { vals: ecb, ok: true },
      { vals: cbc },
      { vals: ctr }
    ];
    for (var s = imgs.length - 1; s > 0; s--) {
      var j = Math.floor(rnd() * (s + 1));
      var tt = imgs[s]; imgs[s] = imgs[j]; imgs[j] = tt;
    }
    var letters = ['A', 'B', 'C'];
    curA = -1;
    var h = '<div class="bm-lexi">' + gridHtml(png) + '</div><div class="bm-row3">';
    imgs.forEach(function (im, oi) {
      h += '<div class="bm-cand"><div class="bm-mini">' + gridHtml(im.vals) + '</div>' +
        '<button class="btn" data-oi="' + oi + '">' + letters[oi] + '</button></div>';
    });
    h += '</div>';
    extraEl.innerHTML = h + '<p class="bm-note">' + T('gs.block-modes.l2pick') + '</p>';
    extraEl.querySelectorAll('button[data-oi]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (locked) return;
        var oi = parseInt(b.getAttribute('data-oi'), 10);
        var ok = imgs[oi].ok === true;
        b.style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
        var all = extraEl.querySelectorAll('button[data-oi]');
        all.forEach(function (b2) {
          var oi2 = parseInt(b2.getAttribute('data-oi'), 10);
          if (oi2 !== oi && imgs[oi2].ok === true) b2.style.borderColor = 'rgba(57,255,20,.9)';
        });
        judge(ok);
      });
    });
  }

  function renderCbc() {
    qEl.textContent = fmt('gs.block-modes.l3q', { p2: hx2(cur.p2), c1: hx2(cur.c1), k: hx2(cur.K) });
    extraEl.innerHTML = '<p class="bm-note">联系公式：C1 = E(P1 ⊕ IV)，IV = ' + hx2(cur.iv) + '；C2 = E(P2 ⊕ C1)</p>';
    var real = hx2(cur.c2);
    var d1 = hx2(encBlock(xorB(cur.p2, cur.iv), cur.K));
    var d2 = hx2(encBlock(cur.p2, cur.K));
    var d3 = hx2(xorB(cur.p2, cur.c1));
    renderOpts([real, d1, d2, d3], real);
  }

  function renderCtr() {
    qEl.textContent = fmt('gs.block-modes.l5q', { ctr: hx2(cur.ctr), k: hx2(cur.K), p: hx2(cur.p) });
    extraEl.innerHTML = '<p class="bm-note">KS = E(' + hx2(cur.ctr) + ', K) = ' + hx2(cur.ks) + '</p>';
    var real = hx2(cur.c);
    var d1 = hx2(encBlock(cur.p, cur.K));
    var d2 = hx2(xorB(cur.ks, [0x00, 0x01]));
    var d3 = hx2(encBlock([0x00, 0x02], cur.K));
    renderOpts([real, d1, d2, d3], real);
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.block-modes.' + ({ know: 'stageKnow', ecb: 'stageEcb', cbc: 'stageCbc', ctr: 'stageCtr' }[cur.kind]));
    qEl.textContent = '';
    extraEl.innerHTML = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    locked = false;
    if (cur.kind === 'know') {
      qEl.textContent = T('gs.block-modes.' + cur.q);
      renderOpts(cur.opts.map(function (k) { return T('gs.block-modes.' + k); }), T('gs.block-modes.' + cur.opts[cur.a]));
    } else if (cur.kind === 'ecb') {
      renderEcb();
    } else if (cur.kind === 'cbc') {
      renderCbc();
    } else if (cur.kind === 'ctr') {
      renderCtr();
    }
    upd();
  }

  function judge(ok) {
    if (finished) return;
    locked = true;
    if (ok) { score += 20; setMsg('ok', T('gs.block-modes.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.block-modes.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    if (optsEl.children.length) {
      var pick = optsEl._pick;
      if (pick !== undefined && optsEl.children[pick]) optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
      if (!ok && optsEl.children[curA]) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    }
    explEl.textContent = '📌 ' + T('gs.block-modes.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }
  nextB.onclick = nextQ;

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('block-modes', sec); }
    stageEl.textContent = ''; qEl.textContent = '';
    extraEl.innerHTML = ''; optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.block-modes.done', { score: score }));
    nextB.textContent = T('gs.block-modes.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 53 + 17); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
