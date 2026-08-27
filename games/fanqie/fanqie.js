/* 破译 DECODE ARCADE · 反切码军情室 —— 第十九期新游戏
   戚继光《纪效新书·号令》反切暗号体验：十六声母 × 十六韵母 + 十六军情，
   坐标式两字暗号编码/解码（字表为示意，机制按史料复刻）。
   答对 +20，满分 120。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.fanqie.tut1t'), d: T('gs.fanqie.tut1') },
  { t: T('gs.fanqie.tut2t'), d: T('gs.fanqie.tut2') },
  { t: T('gs.fanqie.tut3t'), d: T('gs.fanqie.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 暗号本（示意字表：机制按史实，字表为教学示意） ---------- */
  var TABLE_A = ['兵', '昌', '丁', '干', '平', '明', '洪', '卫', '全', '郑', '姚', '曹', '何', '魏', '阎', '金'];
  var TABLE_B = ['安', '昂', '恩', '生', '东', '阳', '云', '雷', '忠', '和', '平', '茂', '清', '海', '泽', '武'];
  var ORDERS = ['请战', '固守', '撤退', '增援', '夜袭', '黎明', '伏击', '火攻',
                '水战', '抢占', '佯攻', '会师', '绕后', '断粮道', '散开', '警戒'];
  var TOTAL = 6;
  function sigOf(idx) { return TABLE_A[Math.floor(idx / 4)] + TABLE_B[idx % 4]; }
  function idxOf(st) {
    var a = TABLE_A.indexOf(st.charAt(0)), b = TABLE_B.indexOf(st.charAt(1));
    return (a < 0 || b < 0) ? -1 : a * 4 + b;
  }

  var idx2 = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'fq-wrap';
  wrap.innerHTML =
    '<div class="fq-prog" id="fq-prog"></div>' +
    '<div class="fq-stage" id="fq-stage"></div>' +
    '<div class="fq-table" id="fq-table"></div>' +
    '<div class="fq-q" id="fq-q"></div>' +
    '<div class="fq-btns" id="fq-opts"></div>' +
    '<div class="fq-msg" id="fq-msg"></div>' +
    '<div class="fq-expl" id="fq-expl"></div>' +
    '<div class="fq-btns"><button class="btn green" id="fq-next" hidden></button></div>' +
    '<div class="fq-btns"><button class="btn" id="fq-daily">' + T('gs.fanqie.dailyBtn') + '</button></div>' +
    '<div class="fq-help">' + T('gs.fanqie.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('fq-prog'), stageEl = $('fq-stage'), tableEl = $('fq-table'),
      qEl = $('fq-q'), optsEl = $('fq-opts'), msgEl = $('fq-msg'),
      explEl = $('fq-expl'), nextB = $('fq-next'), dailyBtn = $('fq-daily');

  function upd() { progEl.textContent = fmt('gs.fanqie.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'fq-msg ' + c; msgEl.textContent = t; }

  function tableHtml() {
    var aRow = TABLE_A.map(function (c) { return '<span class="fq-ch">' + c + '</span>'; }).join('');
    var bRow = TABLE_B.map(function (c) { return '<span class="fq-ch">' + c + '</span>'; }).join('');
    var oRows = ORDERS.map(function (o, i) {
      return '<span class="fq-ord" data-i="' + i + '">' + o + ' <i>' + sigOf(i) + '</i></span>';
    }).join('');
    return '<div class="fq-t-title">' + T('gs.fanqie.tableTitle') + '</div>' +
      '<div class="fq-rows">' +
        '<div class="fq-lbl">' + T('gs.fanqie.tA') + '</div><div class="fq-chs">' + aRow + '</div>' +
        '<div class="fq-lbl">' + T('gs.fanqie.tB') + '</div><div class="fq-chs">' + bRow + '</div>' +
        '<div class="fq-lbl">' + T('gs.fanqie.ordersLbl') + '</div><div class="fq-ord-grid">' + oRows + '</div>' +
      '</div>';
  }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    var encIdx = 2 + Math.floor(rnd() * 14); /* 避开前两条，展示感更强 */
    ls.push({ kind: 'enc', idx: encIdx, e: 'e2' });
    var decIdx = (encIdx + 5 + Math.floor(rnd() * 9)) % 16;
    ls.push({ kind: 'dec', idx: decIdx, e: 'e3' });
    ls.push({ kind: 'know', q: 'l4q', opts: ['l4o1', 'l4o2', 'l4o3', 'l4o4'], a: 0, e: 'e4' });
    ls.push({ kind: 'know', q: 'l5q', opts: ['l5o1', 'l5o2', 'l5o3', 'l5o4'], a: 0, e: 'e5' });
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3', 'l6o4'], a: 0, e: 'e6' });
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

  function fakeSig(real) {
    for (var t = 0; t < 40; t++) {
      var s = sigOf(Math.floor(rnd() * 16));
      if (s !== real) return s;
    }
    return sigOf((idxOf(real) + 1) % 16);
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.fanqie.' + ({ know: 'stageKnow', enc: 'stageEnc', dec: 'stageDec' }[cur.kind] || 'stageKnow'));
    tableEl.innerHTML = tableHtml();
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.fanqie.' + cur.q);
      curA = cur.a;
      renderOpts(cur.opts.map(function (k) { return T('gs.fanqie.' + k); }));
    } else if (cur.kind === 'enc') {
      qEl.textContent = fmt('gs.fanqie.l2q', { o: ORDERS[cur.idx] });
      curA = 0;
      var real = sigOf(cur.idx);
      renderOpts([real, fakeSig(real), fakeSig(real)]);
    } else if (cur.kind === 'dec') {
      qEl.textContent = fmt('gs.fanqie.l3q', { c: sigOf(cur.idx) });
      curA = 0;
      var opts = [ORDERS[cur.idx]];
      for (var i = 0; opts.length < 3; i++) {
        var o = ORDERS[Math.floor(rnd() * 16)];
        if (opts.indexOf(o) < 0) opts.push(o);
      }
      renderOpts(opts);
    }
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 20; setMsg('ok', T('gs.fanqie.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.fanqie.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + T('gs.fanqie.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('fanqie', sec); }
    stageEl.textContent = ''; tableEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.fanqie.done', { score: score }));
    nextB.textContent = T('gs.fanqie.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 13 + 19); }
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
