/* 破译 DECODE ARCADE · 卡当格栅 —— 第十四期新游戏
   4×4 格栅：四孔一组，四转覆盖全格 —— 加密时按旋转序写入，
   解密时旋转四次读出隐藏文字。含加密/解密/构造关。答对 +25。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.cardan-grille.tut1t'), d: T('gs.cardan-grille.tut1') },
  { t: T('gs.cardan-grille.tut2t'), d: T('gs.cardan-grille.tut2') },
  { t: T('gs.cardan-grille.tut3t'), d: T('gs.cardan-grille.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 格栅数学：4×4 旋转群 ----------
     四个旋转（0/90/180/270）构成 Z4 作用在 16 格上。
     合法格栅 = 四孔集每格只被四转覆盖恰好一次。 */
  function rotate(idx, quarter) {
    var r = Math.floor(idx / 4), c = idx % 4, t2, out = idx;
    for (var q = 0; q < quarter; q++) {
      t2 = c * 4 + (3 - r); /* (r,c) → (c, 3−r) */
      r = Math.floor(t2 / 4); c = t2 % 4; out = t2;
    }
    return out;
  }
  function makeGrille(rnd) {
    /* 贪心选 4 孔：每个新孔不能落到已有孔的四转覆盖上 */
    var holes = [];
    var covered = [];
    var cands = [];
    for (var i = 0; i < 16; i++) cands.push(i);
    /* 洗牌 */
    for (var k = cands.length - 1; k > 0; k--) {
      var jj = Math.floor(rnd() * (k + 1));
      var tp = cands[k]; cands[k] = cands[jj]; cands[jj] = tp;
    }
    for (var z = 0; z < cands.length && holes.length < 4; z++) {
      var x = cands[z];
      if (covered.indexOf(x) >= 0) continue;
      holes.push(x);
      for (var q = 0; q < 4; q++) covered.push(rotate(x, q));
    }
    return holes;
  }
  /* 用格栅在空纸上按旋转序写密：第 i 个字落第 i 个孔（旋转分位），填满后加密完成 */
  function writeGrille(secret, holes, rnd) {
    var cells = new Array(16);
    for (var i = 0; i < 16; i++) cells[i] = '·';
    /* 每旋转写一个字符：轮到 hole[j]，实际格子 = rotate(hole[j], turn) */
    var order = [];
    for (var turn = 0; turn < 4; turn++) for (var h = 0; h < 4; h++) order.push(rotate(holes[h], turn));
    var chars = secret.split('');
    /* 任意 pad 填充不足 */
    var pad = '·'; /* 卡片外格子用 · 表示未显现 */
    for (var ch = 0; ch < chars.length; ch++) {
      if (order[ch] !== undefined && chars[ch] !== ' ') cells[order[ch]] = chars[ch] || pad;
    }
    return cells.join('');
  }

  var SECRETS = [
    ['HELP', '救兵'],
    ['WAR', '开战'],
    ['LEAVE', '撤离'],
    ['MARCH', '行军'],
    ['GOLD', '黄金'],
    ['SAVE', '撤退']
  ];

  var TOTAL = 5, idx = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      holes = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'cg-wrap';
  wrap.innerHTML =
    '<div class="cg-prog" id="cg-prog"></div>' +
    '<div class="cg-stage" id="cg-stage"></div>' +
    '<div class="cg-grid" id="cg-grid"></div>' +
    '<div class="cg-q" id="cg-q"></div>' +
    '<div class="cg-btns" id="cg-opts"></div>' +
    '<div class="cg-msg" id="cg-msg"></div>' +
    '<div class="cg-expl" id="cg-expl"></div>' +
    '<div class="cg-btns"><button class="btn green" id="cg-next" hidden></button></div>' +
    '<div class="cg-btns"><button class="btn" id="cg-daily">' + T('gs.cardan-grille.dailyBtn') + '</button></div>' +
    '<div class="cg-help">' + T('gs.cardan-grille.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('cg-prog'), stageEl = $('cg-stage'), gridEl = $('cg-grid'),
      qEl = $('cg-q'), optsEl = $('cg-opts'), msgEl = $('cg-msg'),
      explEl = $('cg-expl'), nextB = $('cg-next'), dailyBtn = $('cg-daily');

  function upd() { progEl.textContent = fmt('gs.cardan-grille.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'cg-msg ' + c; msgEl.textContent = t; }

  function gridHtml(cells, showHoles, turn) {
    var out = '<div class="cg-board">';
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var i = r * 4 + c;
        var isHole = showHoles && holes.indexOf(i) >= 0;
        var ch2 = cells[i];
        out += '<div class="cg-cell' + (isHole ? ' hole' : '') + (ch2 !== '·' && ch2 !== '' ? ' ink' : '') + '">' +
          '<span class="v">' + (ch2 && ch2 !== '·' ? ch2 : '&nbsp;') + '</span>' +
          (isHole ? '<span class="h">◉</span>' : '') +
          '</div>';
      }
    }
    return out + '</div>';
  }

  function buildLevels(rnd) {
    holes = makeGrille(rnd);
    var secret = SECRETS[Math.floor(rnd() * SECRETS.length)];
    var ls = [];
    ls.push({ kind: 'construct', secret: secret });
    ls.push({ kind: 'encrypt', secret: secret });
    ls.push({ kind: 'crack', secret: secret });
    var secret2 = SECRETS[Math.floor(rnd() * SECRETS.length)];
    ls.push({ kind: 'encrypt', secret: secret2 });
    ls.push({ kind: 'crack', secret: secret2 });
    return ls;
  }

  function renderQ() {
    cur = levels[idx];
    stageEl.textContent = T('gs.cardan-grille.' + cur.kind + 'Stage');
    qEl.textContent = '';
    var secretLen = cur.secret[0].length;
    if (cur.kind === 'construct') {
      gridEl.innerHTML = gridHtml('·'.repeat(16), true, 0);
      qEl.innerHTML = '为 4×4 纸面选 4 孔：每次旋转 90°，四个方向能覆盖到 <b>全部 16 格</b>（等同下图孔位）。正确孔位是？';
      curOpts = [holes.slice(), makeGrille(Math.random), makeGrille(Math.random)];
      curA = 0;
    } else if (cur.kind === 'encrypt') {
      gridEl.innerHTML = '';
      var cells = writeGrille(cur.secret[0], holes, rnd);
      qEl.textContent = '用格栅把「' + cur.secret[0] + '」按旋转序写入 16 格。四转完成后纸上显现的掩码结果（含未写格 · ）是？';
      curOpts = [cells, writeGrille(cur.secret[0], makeGrille(Math.random), rnd), writeGrille(cur.secret[0], makeGrille(Math.random), rnd)];
      curA = 0;
    } else {
      /* 解密：给出掩码+四转定位，找出隐藏词 */
      gridEl.innerHTML = '';
      var useHoles = holes;
      /* 用同一格栅读出：密文字符按 order 收集 */
      var reading = '';
      var ct2 = writeGrille(cur.secret[0], useHoles, rnd);
      /* 逆转：readGrille —— 每个孔在 4 个旋转位各读一个字符 */
      var order2 = [];
      for (var turn = 0; turn < 4; turn++) for (var h = 0; h < 4; h++) order2.push(rotate(useHoles[h], turn));
      for (var ch5 = 0; ch5 < order2.length; ch5++) reading += ct2[order2[ch5]];
      qEl.textContent = '缴获卡片上隐约可见："' + ct2.replace(/·/g, '□') + '"。把格栅四转会合隐藏词——它是？';
      curOpts = [cur.secret[1], SECRETS[(SECRETS.indexOf(cur.secret) + 1) % SECRETS.length][1], SECRETS[(SECRETS.indexOf(cur.secret) + 2) % SECRETS.length][1]];
      curA = 0;
    }
    /* C-1 防护：打乱后重算 */
    var correctRef = curOpts[curA];
    for (var i = curOpts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = curOpts[i]; curOpts[i] = curOpts[j]; curOpts[j] = tmp;
    }
    curA = curOpts.indexOf(correctRef);
    optsEl.innerHTML = '';
    curOpts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = Array.isArray(o) ? 'A/B/C 孔位' : String(o);
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'cg-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }


  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 25; setMsg('ok', T('gs.cardan-grille.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.cardan-grille.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L({ zh: '格栅四转覆盖全盘：每个孔位在 0°/90°/180°/270° 各出现一次，轮转写读——卡当 1550 年发明，二战仍用它传递情报。', en: 'Four rotations cover the board: each hole visits all four corners, writing/reading in rotation — Cardano\'s 1550 invention still carried intelligence in WWII.' });
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx++; if (idx >= TOTAL) { finish(); return; } renderQ(); }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('cardan-grille', sec); }
    stageEl.textContent = ''; gridEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.cardan-grille.done', { score: score }));
    nextB.textContent = T('gs.cardan-grille.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var levels = [];
  function startGame(daily) {
    idx = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 29); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels(rnd);
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
