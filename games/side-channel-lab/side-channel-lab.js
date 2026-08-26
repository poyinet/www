/* 破译 DECODE ARCADE · side-channel-lab —— 第十四期新游戏
   真实时序侧信道攻防：加密校验采用「逐字节提早返回」——
   猜测每多匹配一位就多花一位的时间。玩家扮演攻击者，
   通过观察「耗时条」猜测每一位，逐字节还原密码。答对给分。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.side-channel-lab.tut1t'), d: T('gs.side-channel-lab.tut1') },
  { t: T('gs.side-channel-lab.tut2t'), d: T('gs.side-channel-lab.tut2') },
  { t: T('gs.side-channel-lab.tut3t'), d: T('gs.side-channel-lab.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  var PASSWORD_LEN = 4;
  var KEYS = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz0123456789'];
  var WORDS = ['ROMA', 'LION', 'VOTE', 'MINT', 'DUNE'];

  /* 攻击目标：每个字符在 alphabet 中 */
  var target = '';
  var alpha = '';

  /* 模拟逐字节比较：返回匹配前缀长度 + 噪声 */
  function compareTimes(guess) {
    var same = 0;
    for (var i = 0; i < Math.min(guess.length, target.length); i++) if (guess[i] === target[i]) same = i + 1; else break;
    return same;
  }

  var TOTAL = 4, idx = 0, score = 0, finished = false,
      cur = null, guessedPrefix = '',
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'sc-wrap';
  wrap.innerHTML =
    '<div class="sc-prog" id="sc-prog"></div>' +
    '<div class="sc-stage" id="sc-stage"></div>' +
    '<div class="sc-monitor" id="sc-monitor"></div>' +
    '<div class="sc-q" id="sc-q"></div>' +
    '<div class="sc-btns" id="sc-opts"></div>' +
    '<div class="sc-msg" id="sc-msg"></div>' +
    '<div class="sc-expl" id="sc-expl"></div>' +
    '<div class="sc-btns"><button class="btn green" id="sc-next" hidden></button></div>' +
    '<div class="sc-btns"><button class="btn" id="sc-daily">' + T('gs.side-channel-lab.dailyBtn') + '</button></div>' +
    '<div class="sc-help">' + T('gs.side-channel-lab.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('sc-prog'), stageEl = $('sc-stage'), monEl = $('sc-monitor'),
      qEl = $('sc-q'), optsEl = $('sc-opts'), msgEl = $('sc-msg'),
      explEl = $('sc-expl'), nextB = $('sc-next'), dailyBtn = $('sc-daily');

  function upd() { progEl.textContent = fmt('gs.side-channel-lab.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score, pos: guessedPrefix.length }); }
  function setMsg(c, t) { msgEl.className = 'sc-msg ' + c; msgEl.textContent = t; }
  function boxHtml() {
    var g = '';
    for (var i = 0; i < PASSWORD_LEN; i++) {
      g += '<div class="sl-slot' + (i < guessedPrefix.length ? ' ok' : (i === guessedPrefix.length ? ' cur' : '')) + '">' +
        (guessedPrefix[i] || '·') + '</div>';
    }
    for (var i2 = 0; i2 < 6; i2++) {
      g += '<div class="sl-line" id="sl-line-' + i2 + '">' +
        '<span class="sl-tag">t' + (60 + i2) + '</span>' +
        '<span class="sl-bar"><i style="width:0%"></i></span>' +
        '</div>';
    }
    return g;
  }

  function estimateBars(guess) {
    /* 用「时长条」模拟侧信道观测。返回数组，每组 0-100 */
    var bars = [];
    var len = PASSWORD_LEN;
    var base = 0;
    for (var i = 0; i < 6; i++) {
      /* 猜对的前缀越多，耗时越长 */
      var t = compareTimes(guess);
      if (t > 0) base = t;
      /* 一次请求耗时：0-100，前缀越多用时越长 */
      var v = Math.min(100, 12 + base * 24 + Math.floor(rnd() * 14));
      bars.push(v);
    }
    return bars;
  }

  function renderQ() {
    var pos = guessedPrefix.length;
    if (pos >= PASSWORD_LEN) { finish(); return; }
    stageEl.textContent = fmt('gs.side-channel-lab.stage', { pos: pos, len: PASSWORD_LEN });
    /* 展示监听数据：显示已破解前缀，右侧展示 6 条估计时长 */
    monEl.innerHTML = boxHtml();
    qEl.innerHTML = '📶 你看到 6 次登录尝试的耗时直方图（每次用不同猜测）。<b>当前候选前缀「' + guessedPrefix + '」</b>。从图中推断第 ' + (pos + 1) + ' 位是哪个字符？';
    curK = target[pos];
    curOpts = alpha.split('');
    /* 不放太多字母，先截为 10 个选项（正确 + 9 个相邻） */
    charOpts = [curK];
    var start = alpha.indexOf(curK);
    while (charOpts.length < 10) {
      var c2 = alpha[(start + charOpts.length * 5) % alpha.length];
      if (charOpts.indexOf(c2) < 0) charOpts.push(c2);
    }
    var correctRef = charOpts[0];
    for (var i = charOpts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = charOpts[i]; charOpts[i] = charOpts[j]; charOpts[j] = tmp;
    }
    curA = charOpts.indexOf(correctRef);
    optsEl.innerHTML = '';
    charOpts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = o;
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    /* 渲染时长条 */
    var bars = estimateBars(guessedPrefix);
    for (var n = 0; n < bars.length; n++) {
      var lineEl = $('sl-line-' + n);
      var bar = lineEl.querySelector('.sl-bar i');
      bar.style.width = bars[n] + '%';
      var tag = lineEl.querySelector('.sl-tag');
      if (n === bars.length - 1) tag.style.color = 'var(--neon-yellow)';
    }
    msgEl.className = 'sc-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  var curK = '', charOpts = [], curA = 0;

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) {
      guessedPrefix += curK;
      score += 25;
      setMsg('ok', T('gs.side-channel-lab.correct'));
      if (Arcade.juice) Arcade.juice.win();
      nextB.hidden = false;
      nextB.onclick = nextQ;
    } else {
      setMsg('no', T('gs.side-channel-lab.wrong'));
      if (Arcade.juice) Arcade.juice.lose();
      explEl.textContent = '📌 ' + L({ zh: '长于其他人的耗时条暴露了匹配长度——这就是时序侧信道：没有密码的直接信息，只有「比较了多久」。', en: 'The longer bar exposes how far the comparison went — a timing side channel leaks matched length, not the password itself.' });
      explEl.classList.add('on');
    }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    upd();
  }

  function nextQ() {
    if (guessedPrefix.length >= PASSWORD_LEN) { finish(); return; }
    renderQ();
  }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('side-channel-lab', sec); }
    stageEl.textContent = ''; monEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.side-channel-lab.done', { score: score, pw: target }));
    nextB.textContent = T('gs.side-channel-lab.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx = 0; score = 0; finished = false; guessedPrefix = '';
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 43); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    alpha = KEYS[0];
    /* 选一个四字母词 */
    var w = WORDS[Math.floor(rnd() * WORDS.length)];
    /* 避免与字首重复；混入随机字母 */
    var tgt = '';
    for (var i = 0; i < PASSWORD_LEN; i++) {
      var p = w[i] || alpha[Math.floor(rnd() * 26)];
      if (!tgt.includes(p)) tgt += p;
    }
    if (tgt.length < PASSWORD_LEN) tgt += 'MINT';
    target = tgt.slice(0, PASSWORD_LEN);
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
