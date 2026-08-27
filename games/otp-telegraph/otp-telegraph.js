/* 破译 DECODE ARCADE · OTP 电报房 —— B1 旗舰
   真实 Vernam 电报机体验：ITA2 五单位码 + 密钥带逐位异或；
   第 5 关「深度破译」= 两封同密钥电文相减消去密钥（VENONA 数学）。
   答对 +20，满分 140。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.otp-telegraph.tut1t'), d: T('gs.otp-telegraph.tut1') },
  { t: T('gs.otp-telegraph.tut2t'), d: T('gs.otp-telegraph.tut2') },
  { t: T('gs.otp-telegraph.tut3t'), d: T('gs.otp-telegraph.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- ITA2（字母档 + 空格） ---------- */
  var ITA2 = { 'A': '00011', 'B': '11001', 'C': '01110', 'D': '01001', 'E': '00001', 'F': '01101', 'G': '11010',
    'H': '10100', 'I': '00110', 'J': '01011', 'K': '01111', 'L': '10010', 'M': '11100', 'N': '01100',
    'O': '11000', 'P': '10110', 'Q': '10111', 'R': '01010', 'S': '00101', 'T': '10000', 'U': '00111',
    'V': '11110', 'W': '10011', 'X': '11101', 'Y': '10101', 'Z': '10001', ' ': '00100' };
  function xor5(a, b) {
    var out = '';
    for (var i = 0; i < 5; i++) out += (a.charAt(i) === b.charAt(i)) ? '0' : '1';
    return out;
  }
  function randGroup() {
    var g = '';
    for (var i = 0; i < 5; i++) g += (Math.random() < 0.5 ? '0' : '1');
    return g;
  }
  function fakeGroup(real) {
    for (var t = 0; t < 40; t++) {
      var g = randGroup();
      if (g !== real) return g;
    }
    return xor5(real, '11111');
  }

  var WORDS = ['SIGNAL', 'COURIER', 'COMRADE', 'TELEGRAM', 'MESSAGE', 'WIRETAP'];
  var TOTAL = 7;

  var idx2 = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'otp-wrap';
  wrap.innerHTML =
    '<div class="otp-prog" id="otp-prog"></div>' +
    '<div class="otp-stage" id="otp-stage"></div>' +
    '<div class="otp-table" id="otp-table"></div>' +
    '<div class="otp-q" id="otp-q"></div>' +
    '<div class="otp-btns" id="otp-opts"></div>' +
    '<div class="otp-msg" id="otp-msg"></div>' +
    '<div class="otp-expl" id="otp-expl"></div>' +
    '<div class="otp-btns"><button class="btn green" id="otp-next" hidden></button></div>' +
    '<div class="otp-btns"><button class="btn" id="otp-daily">' + T('gs.otp-telegraph.dailyBtn') + '</button></div>' +
    '<div class="otp-help">' + T('gs.otp-telegraph.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('otp-prog'), stageEl = $('otp-stage'), tableEl = $('otp-table'),
      qEl = $('otp-q'), optsEl = $('otp-opts'), msgEl = $('otp-msg'),
      explEl = $('otp-expl'), nextB = $('otp-next'), dailyBtn = $('otp-daily');

  function upd() { progEl.textContent = fmt('gs.otp-telegraph.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'otp-msg ' + c; msgEl.textContent = t; }

  function tableHtml() {
    var rows = Object.keys(ITA2).map(function (k) {
      return '<span class="otp-ch"><i>' + (k === ' ' ? '␣' : k) + '</i>' + ITA2[k] + '</span>';
    }).join('');
    return '<div class="otp-t-title">' + T('gs.otp-telegraph.ita2Title') + '</div>' +
      '<div class="otp-grid">' + rows + '</div>' +
      '<div class="otp-note">' + T('gs.otp-telegraph.tapeNote') + '</div>';
  }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    /* L2 单字加密 */
    var p2 = 'V';
    var k2 = randGroup();
    ls.push({ kind: 'enc', p: p2, k: k2, e: 'e2' });
    /* L3 单字解码 */
    var p3 = 'K';
    var k3 = randGroup();
    var c3 = xor5(ITA2[p3], k3);
    ls.push({ kind: 'dec', c: c3, k: k3, e: 'e3' });
    /* L4 全电文（词表随机） */
    var w = WORDS[Math.floor(rnd() * WORDS.length)];
    var keys = [];
    for (var i = 0; i < w.length; i++) keys.push(randGroup());
    var ct = '';
    for (var j = 0; j < w.length; j++) ct += xor5(ITA2[w.charAt(j)], keys[j]);
    ls.push({ kind: 'msg', w: w, keys: keys, ct: ct, e: 'e4' });
    /* L5 深度破译：M1 已知 + 差分 → M2 同位置字母 */
    var m1 = 'ATTACK', m2 = 'BRIDGE';
    var pos = 1 + Math.floor(rnd() * (m1.length - 1));
    var diff = xor5(ITA2[m1.charAt(pos)], ITA2[m2.charAt(pos)]);
    ls.push({ kind: 'depth', m1: m1, m2: m2, pos: pos, diff: diff, e: 'e5' });
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3', 'l6o4'], a: 0, e: 'e6' });
    ls.push({ kind: 'know', q: 'l7q', opts: ['l7o1', 'l7o2', 'l7o3', 'l7o4'], a: 0, e: 'e7' });
    return ls;
  }

  function renderOpts(list) {
    var correctRef = list[curA];
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    curA = list.indexOf(correctRef);
    curOpts = list;
    optsEl.innerHTML = '';
    list.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = o;
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.otp-telegraph.' + ({ know: 'stageKnow', enc: 'stageEnc', dec: 'stageDec', msg: 'stageMsg', depth: 'stageDepth' }[cur.kind]));
    tableEl.innerHTML = tableHtml();
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.otp-telegraph.' + cur.q);
      curA = cur.a;
      renderOpts(cur.opts.map(function (k) { return T('gs.otp-telegraph.' + k); }));
    } else if (cur.kind === 'enc') {
      qEl.textContent = fmt('gs.otp-telegraph.l2q', { k: cur.k, p: cur.p });
      curA = 0;
      var real = xor5(ITA2[cur.p], cur.k);
      renderOpts([real, fakeGroup(real), fakeGroup(real)]);
    } else if (cur.kind === 'dec') {
      qEl.textContent = fmt('gs.otp-telegraph.l3q', { c: cur.c, k: cur.k });
      curA = 0;
      var realC = '';
      for (var kk in ITA2) { if (xor5(ITA2[kk], cur.k) === cur.c) realC = kk; }
      renderOpts([realC, 'M', 'R']);
    } else if (cur.kind === 'msg') {
      qEl.textContent = fmt('gs.otp-telegraph.l4q', { w: cur.w, k: ' ' + cur.keys[0] });
      curA = 0;
      /* 干扰项 = 真实计算：另一明文同密钥带 / 本明文换密钥带 */
      var w2 = WORDS[(WORDS.indexOf(cur.w) + 2) % WORDS.length];
      var ct2 = '';
      for (var j2 = 0; j2 < w2.length; j2++) ct2 += xor5(ITA2[w2.charAt(j2)], cur.keys[j2]);
      var flip = cur.ct;
      var posF = cur.ct.length - 1;
      flip = flip.slice(0, posF) + (flip.charAt(posF) === '0' ? '1' : '0');
      renderOpts([cur.ct, ct2.slice(0, cur.ct.length), flip]);
    } else if (cur.kind === 'depth') {
      qEl.textContent = fmt('gs.otp-telegraph.l5q', { n: cur.pos + 1, m: cur.m1.charAt(cur.pos) });
      curA = 0;
      var mm = cur.m2.charAt(cur.pos);
      var others = [];
      var PA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (var i2 = 0; others.length < 2; i2++) {
        var cc = PA.charAt(Math.floor(rnd() * 26));
        if (cc !== mm && others.indexOf(cc) < 0) others.push(cc);
      }
      renderOpts([mm].concat(others));
    }
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 20; setMsg('ok', T('gs.otp-telegraph.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.otp-telegraph.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + T('gs.otp-telegraph.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('otp-telegraph', sec); }
    stageEl.textContent = ''; tableEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.otp-telegraph.done', { score: score }));
    nextB.textContent = T('gs.otp-telegraph.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 11); }
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
