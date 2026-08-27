/* 破译 DECODE ARCADE · 纳瓦霍传令兵 —— 第十八期新游戏
   语言密码体验：纳瓦霍军用词汇码（官方词表节选，译音示意）——
   整词对照编码/解码 + 「为何破不了」史实题。
   答对 +20，满分 120。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.navajo-talker.tut1t'), d: T('gs.navajo-talker.tut1') },
  { t: T('gs.navajo-talker.tut2t'), d: T('gs.navajo-talker.tut2') },
  { t: T('gs.navajo-talker.tut3t'), d: T('gs.navajo-talker.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 官方词汇码节选（译音示意） ---------- */
  var CODE = [
    { en: 'TANK',        nv: 'Chay-da-gahi',   gloss: '乌龟' },
    { en: 'SUBMARINE',   nv: 'Besh-lo',        gloss: '铁鱼' },
    { en: 'BOMB',        nv: 'A-yashi',        gloss: '鸡蛋' },
    { en: 'FIGHTER',     nv: 'Da-he-tih-hi',   gloss: '蜂鸟' },
    { en: 'DIVE BOMBER', nv: 'Gini',           gloss: '鸡鹰' },
    { en: 'AMERICA',     nv: 'Ne-he-mah',      gloss: '我们的母亲' }
  ];
  var MSGS = [
    ['TANK', 'SUBMARINE'],
    ['BOMB', 'FIGHTER'],
    ['AMERICA', 'DIVE BOMBER']
  ];
  var TOTAL = 6;

  var idx2 = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'nvt-wrap';
  wrap.innerHTML =
    '<div class="nvt-prog" id="nvt-prog"></div>' +
    '<div class="nvt-stage" id="nvt-stage"></div>' +
    '<div class="nvt-table" id="nvt-table"></div>' +
    '<div class="nvt-q" id="nvt-q"></div>' +
    '<div class="nvt-btns" id="nvt-opts"></div>' +
    '<div class="nvt-msg" id="nvt-msg"></div>' +
    '<div class="nvt-expl" id="nvt-expl"></div>' +
    '<div class="nvt-btns"><button class="btn green" id="nvt-next" hidden></button></div>' +
    '<div class="nvt-btns"><button class="btn" id="nvt-daily">' + T('gs.navajo-talker.dailyBtn') + '</button></div>' +
    '<div class="nvt-help">' + T('gs.navajo-talker.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('nvt-prog'), stageEl = $('nvt-stage'), tableEl = $('nvt-table'),
      qEl = $('nvt-q'), optsEl = $('nvt-opts'), msgEl = $('nvt-msg'),
      explEl = $('nvt-expl'), nextB = $('nvt-next'), dailyBtn = $('nvt-daily');

  function upd() { progEl.textContent = fmt('gs.navajo-talker.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'nvt-msg ' + c; msgEl.textContent = t; }

  function tableHtml() {
    var rows = CODE.map(function (c) {
      return '<div class="nvt-row"><b>' + c.en + '</b><span>=</span><i>' + c.nv + '</i><span class="nvt-g">' +
        (isEn() ? c.nv : c.gloss + ' · ') + '</span></div>';
    }).join('');
    return '<div class="nvt-t-title">' + T('gs.navajo-talker.codeTable') + '</div><div class="nvt-grid">' + rows + '</div>';
  }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    var m = MSGS[Math.floor(rnd() * MSGS.length)];
    ls.push({ kind: 'enc', w: m[0], e: 'e2' });
    ls.push({ kind: 'dec', c: m[1], e: 'e3' });
    ls.push({ kind: 'attack', opts: ['l4o1', 'l4o2', 'l4o3', 'l4o4'], a: 0, e: 'e4' });
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

  function codeOf(en) {
    for (var i = 0; i < CODE.length; i++) if (CODE[i].en === en) return CODE[i];
    return null;
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.navajo-talker.' + ({ know: 'stageKnow', enc: 'stageEnc', dec: 'stageDec', attack: 'stageAttack' }[cur.kind]));
    tableEl.innerHTML = tableHtml();
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.navajo-talker.' + cur.q);
      curA = cur.a;
      renderOpts(cur.opts.map(function (k) { return T('gs.navajo-talker.' + k); }));
    } else if (cur.kind === 'enc') {
      qEl.textContent = fmt('gs.navajo-talker.l2q', { w: cur.w });
      curA = 0;
      var real = codeOf(cur.w);
      var wrong = CODE.filter(function (c) { return c.en !== cur.w; }).sort(function () { return rnd() - 0.5; }).slice(0, 2);
      renderOpts([real.nv].concat(wrong.map(function (c) { return c.nv; })));
    } else if (cur.kind === 'dec') {
      var c2 = codeOf(cur.c);
      qEl.textContent = fmt('gs.navajo-talker.l3q', { c: c2.nv });
      curA = 0;
      var opts = [cur.c];
      CODE.filter(function (c) { return c.en !== cur.c; }).sort(function () { return rnd() - 0.5; }).slice(0, 2).forEach(function (c) { opts.push(c.en); });
      renderOpts(opts);
    } else if (cur.kind === 'attack') {
      qEl.textContent = T('gs.navajo-talker.l4q');
      curA = cur.a;
      renderOpts(cur.opts.map(function (k) { return T('gs.navajo-talker.' + k); }));
    }
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 20; setMsg('ok', T('gs.navajo-talker.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.navajo-talker.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + T('gs.navajo-talker.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('navajo-talker', sec); }
    stageEl.textContent = ''; tableEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.navajo-talker.done', { score: score }));
    nextB.textContent = T('gs.navajo-talker.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 29 + 7); }
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
