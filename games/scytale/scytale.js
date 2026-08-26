/* 破译 DECODE ARCADE · 斯巴达密码棒 —— 第十四期新游戏
   三关交互：读密（横排还原）→ 缠纸（纵列加密）→ 破译（试直径）。
   每次生成真实换位数据；答对 +30。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.scytale.tut1t'), d: T('gs.scytale.tut1') },
  { t: T('gs.scytale.tut2t'), d: T('gs.scytale.tut2') },
  { t: T('gs.scytale.tut3t'), d: T('gs.scytale.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 换位核心 ----------
     wrap(plain, d): 按 d 列蛇形纵向书写（第 i 字符在列 i%d、行 floor(i/d)），
     解卷按横排读出 = 密文（行优先）。 */
  function scytaleWrap(pt, d) {
    var rows = Math.ceil(pt.length / d);
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid.push([]);
      for (var c = 0; c < d; c++) grid[r].push('·');
    }
    var out = '';
    for (var i = 0; i < pt.length; i++) {
      var col = i % d, row = Math.floor(i / d);
      grid[row][col] = pt[i];
    }
    for (r = 0; r < rows; r++) for (var c = 0; c < d; c++) out += grid[r][c];
    return out;
  }
  /* 解卷明文：把「解卷后的串」按 d 列行优先读回，还原纵向明文 */
  function unroll(ct, d) {
    var out = '';
    for (var c = 0; c < d; c++) for (var r = 0; r < Math.ceil(ct.length / d); r++) {
      var idx = r * d + c;
      if (idx < ct.length) out += ct[idx];
    }
    return out;
  }

  var POOL = [
    ['HELPARRIVING', '赴援', 'reinforcements', 'en', 'zh'],
    ['MEETATMIDNIGHT', '午夜会合', 'meet at midnight', 'en', 'zh'],
    ['SECONDWAVE', '第二波', 'second wave', 'en', 'zh'],
    ['HOLDTHECREST', '守住山脊', 'hold the crest', 'en', 'zh'],
    ['CARRIERISSAFE', '信使安全', 'carrier safe', 'en', 'zh'],
    ['FIREUPONDOWN', '开火', 'fire upon dawn', 'en', 'zh']
  ];
  var DIAMS = [3, 4, 5, 6];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'sc-wrap';
  wrap.innerHTML =
    '<div class="sc-prog" id="sc-prog"></div>' +
    '<div class="sc-stage" id="sc-stage"></div>' +
    '<div class="sc-rod" id="sc-rod"></div>' +
    '<div class="sc-q" id="sc-q"></div>' +
    '<div class="sc-btns" id="sc-opts"></div>' +
    '<div class="sc-msg" id="sc-msg"></div>' +
    '<div class="sc-expl" id="sc-expl"></div>' +
    '<div class="sc-btns"><button class="btn green" id="sc-next" hidden></button></div>' +
    '<div class="sc-btns"><button class="btn" id="sc-daily">' + T('gs.scytale.dailyBtn') + '</button></div>' +
    '<div class="sc-help">' + T('gs.scytale.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('sc-prog'), stageEl = $('sc-stage'), rodEl = $('sc-rod'),
      qEl = $('sc-q'), optsEl = $('sc-opts'), msgEl = $('sc-msg'),
      explEl = $('sc-expl'), nextB = $('sc-next'), dailyBtn = $('sc-daily');

  /* 三关每题：{kind:'read'|'wrap'|'break', data} */
  var TOTAL = 6, idx = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      dailyMode = false, startTs = 0, rnd = Math.random;

  function upd() {
    progEl.textContent = fmt('gs.scytale.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'sc-msg ' + c; msgEl.textContent = t; }
  function rodHtml(pt, d) {
    var ct = scytaleWrap(pt, d), h = '';
    var rows = Math.ceil(ct.length / d);
    for (var c = 0; c < d; c++) {
      h += '<div class="sc-col">';
      for (var r2 = 0; r2 < rows; r2++) h += '<div class="cl">' + ct[r2 * d + c] + '</div>';
      h += '</div>';
    }
    return h;
  }

  function buildLevels(rnd) {
    var levels = [];
    for (var i = 0; i < 6; i++) {
      var pick = POOL[Math.floor(rnd() * POOL.length)];
      var d = DIAMS[Math.floor(rnd() * DIAMS.length)];
      if (i < 2) levels.push({ kind: 'read', pt: pick[0], d: d, ans: pick[1] });
      else if (i < 4) levels.push({ kind: 'wrap', pt: pick[0], d: d, ansM: pick[2] });
      else levels.push({ kind: 'break', pt: pick[0], d: d, ansD: d });
    }
    return levels;
  }

  /* 渲染 */
  function renderQ() {
    cur = levels[idx];
    stageEl.textContent = T('gs.scytale.' + cur.kind + 'Instr').replace('{diam}', cur.d);
    if (cur.kind === 'read') {
      /* 展示缠好的矩阵（密文=c 列纵向，实际是 wrap 输出），玩家选 = 密文对应的明文 */
      rodEl.innerHTML = rodHtml(cur.pt, cur.d);
      var ct = scytaleWrap(cur.pt, cur.d);
      qEl.textContent = '📜 密语：「' + ct.replace(/·/g, '□') + '」——按 {d} 列纵读还原，它是？'.replace('{d}', cur.d);
      var baseIdx = 0;
      for (var pi = 0; pi < POOL.length; pi++) if (POOL[pi][0] === cur.pt) { baseIdx = pi; break; }
      curOpts = [cur.ans, POOL[(baseIdx + 1) % POOL.length][1], POOL[(baseIdx + 2) % POOL.length][1]];
    } else if (cur.kind === 'wrap') {
      rodEl.innerHTML = '';
      var plain = cur.pt;
      qEl.textContent = '🧵 羊皮纸已贴满「' + plain.replace(/(.{4})/g, '$1 ') + '」，原棒直径 {d} 格——读出的密文应为？'.replace('{d}', cur.d);
      var ct = scytaleWrap(plain, cur.d);
      curOpts = [ct, scytaleWrap(plain, DIAMS[(DIAMS.indexOf(cur.d) + 1) % DIAMS.length]), scytaleWrap(plain, DIAMS[(DIAMS.indexOf(cur.d) + 2) % DIAMS.length])];
      /* 去重兜底 */
      if (curOpts[1] === curOpts[0]) curOpts[1] = scytaleWrap(plain, DIAMS[(DIAMS.indexOf(cur.d) + 3) % DIAMS.length]);
      if (curOpts[2] === curOpts[0] || curOpts[2] === curOpts[1]) curOpts[2] = scytaleWrap(plain, (cur.d + 1 > 5 ? 3 : cur.d + 2));
    } else {
      rodEl.innerHTML = '';
      var ct2 = wrap(cur.pt, cur.d);
      qEl.textContent = '🕵️ 缴获密文「' + ct2.replace(/·/g, '□') + '」——哪根直径的棒能读出可懂明文？';
      curOpts = DIAMS.map(function (x) { return x; });
      /* 展示各直径纵读结果 */
    }
    /* 打乱后重算正确索引（C-1 防护） */
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
      b.style.fontFamily = 'var(--font-mono)';
      b.style.fontSize = '12px';
      b.textContent = o;
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'sc-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 30; setMsg('ok', T('gs.scytale.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.scytale.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    var cap = curOpts[curA];
    if (cur.kind === 'read') explEl.textContent = '📌 把「' + cap + '」沿 {d} 列纵向排布再横排读，就还原出原文——换位密码不改变字母，只改变顺序。'.replace('{d}', cur.d);
    else if (cur.kind === 'wrap') explEl.textContent = '📌 逐字母沿列写入（' + cur.d + ' 格棒），横读即出密文——直径就是这把棒子的密钥。';
    else explEl.textContent = '📌 直径 ' + cur.d + ' 时纵列数恰好让字母排回可读物；换其他直径只能得到乱序——这就是 Scytale「猜直径=猜密钥」。';
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() {
    idx++;
    if (idx >= TOTAL) { finish(); return; }
    renderQ();
  }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('scytale', sec);
    }
    stageEl.textContent = ''; rodEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.scytale.done', { score: score }));
    nextB.textContent = T('gs.scytale.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var levels = [];
  function startGame(daily) {
    idx = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 17); }
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
