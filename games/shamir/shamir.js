/* 破译 DECODE ARCADE · Shamir 分钥密约 —— 第六期 #1 新游戏
   门限秘密分享（k=2 线性情形）：分发验证 → 门限认知 → 收集判断 → 相邻相减求斜率 → 回归 x=0 还原秘密。
   3 轮 × 5 步。计分 max：首答 +20 + 连击加成，整轮 +30，提示 −10。
   支持每日模式（日种子确定性出题，Park–Miller 逐轮派生）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.shamir.tut1t'), d: T('gs.shamir.tut1') },
  { t: T('gs.shamir.tut2t'), d: T('gs.shamir.tut2') },
  { t: T('gs.shamir.tut3t'), d: T('gs.shamir.tut3') },
  { t: T('gs.shamir.tut4t'), d: T('gs.shamir.tut4') },
  { t: T('gs.shamir.tut5t'), d: T('gs.shamir.tut5') }
];

(function () {
  var root = document.getElementById('game-root');
  var P = 101, TOTAL = 3;

  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function daySeed() {
    var dt = new Date();
    return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
  }
  function mulberry(seed) {
    var s = Math.abs(Math.floor(seed)) % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = s * 16807 % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /* 一轮参数：秘密字母 v、斜率 a(1..25)、相邻两份额 x1,x2=x1+1（1..5）、判断题份数 m */
  function makeRound(rnd, roundNum) {
    var v = Math.floor(rnd() * 26);
    var a = 1 + Math.floor(rnd() * 25);
    var x1 = 1 + Math.floor(rnd() * 4);
    var x2 = x1 + 1;
    var y1 = (v + a * x1) % P;
    var y2 = (v + a * x2) % P;
    var m = [1, 2, 4][Math.max(0, Math.min(2, roundNum - 1))];
    return {
      v: v, L: String.fromCharCode(65 + v), a: a,
      x1: x1, x2: x2, y1: y1, y2: y2, m: m,
      shareX: 1 + Math.floor(rnd() * 5)
    };
  }

  var wrap = document.createElement('div');
  wrap.className = 'sm-wrap';
  wrap.innerHTML =
    '<div class="sm-prog" id="sm-prog"></div>' +
    '<div class="sm-given" id="sm-given"></div>' +
    '<div class="sm-step" id="sm-step"></div>' +
    '<input class="sm-input" id="sm-in" inputmode="numeric" maxlength="6" autocomplete="off" spellcheck="false">' +
    '<div class="sm-btns" id="sm-opts"></div>' +
    '<div class="sm-msg" id="sm-msg"></div>' +
    '<div class="sm-hintbox" id="sm-hintbox" hidden></div>' +
    '<div class="sm-btns">' +
      '<button class="btn accent" id="sm-sub"></button>' +
      '<button class="btn yellow" id="sm-hint" hidden></button>' +
    '</div>' +
    '<div class="sm-btns"><button class="btn yellow" id="sm-next" hidden></button></div>' +
    '<div class="sm-btns"><button class="btn" id="sm-daily">' + T('gs.shamir.dailyBtn') + '</button></div>' +
    '<div class="sm-help">' + T('gs.shamir.helpText') + '</div>';
  root.appendChild(wrap);
  var el = function (id) { return wrap.querySelector('#' + id); };
  var progEl = el('sm-prog'), givenEl = el('sm-given'), stepEl = el('sm-step'),
      input = el('sm-in'), optsEl = el('sm-opts'), msgEl = el('sm-msg'),
      hintBox = el('sm-hintbox'), subBtn = el('sm-sub'), hintBtn = el('sm-hint'),
      nextBtn = el('sm-next'), dailyBtn = el('sm-daily');
  subBtn.textContent = T('gs.shamir.submit');
  hintBtn.textContent = T('gs.shamir.hintBtn');
  input.placeholder = T('gs.shamir.phNum');

  var roundNum = 0, score = 0, streak = 0, stepIdx = 1, firstTry = true,
      answered = false, finished = false, dailyMode = false, startTs = 0,
      cur = null, nextTimer = null, hintTaken = false;

  function updProg() {
    progEl.textContent = fmt('gs.shamir.prog', {
      round: Math.min(roundNum, TOTAL), total: TOTAL, step: Math.min(stepIdx, 5), streak: streak
    });
  }
  function setMsg(cls, txt) { msgEl.className = 'sm-msg ' + cls; msgEl.textContent = txt; }

  function renderStep() {
    updProg();
    hintTaken = false;
    hintBox.hidden = true;
    optsEl.innerHTML = '';
    givenEl.innerHTML = T('gs.shamir.given');
    if (stepIdx === 1) stepEl.textContent = fmt('gs.shamir.step1', { a: cur.a, x: cur.shareX });
    else if (stepIdx === 2) stepEl.textContent = T('gs.shamir.step2');
    else if (stepIdx === 3) stepEl.textContent = fmt('gs.shamir.step3', { m: cur.m });
    else if (stepIdx === 4) stepEl.textContent = fmt('gs.shamir.step4',
      { x1: cur.x1, y1: cur.y1, x2: cur.x2, y2: cur.y2 });
    else stepEl.textContent = fmt('gs.shamir.step5', {});
    var isChoice = stepIdx === 2 || stepIdx === 3;
    input.hidden = isChoice;
    subBtn.hidden = isChoice;
    hintBtn.hidden = !(stepIdx === 1 || stepIdx === 3 || stepIdx === 4 || stepIdx === 5);
    if (stepIdx === 2) {
      [1, 2, 5].forEach(function (num) {
        makeOpt(String(num), num === 2);
      });
    } else if (stepIdx === 3) {
      makeOpt(T('gs.shamir.yesBtn'), cur.m >= 2, 0);
      makeOpt(T('gs.shamir.noBtn'), cur.m < 2, 1);
    }
    if (!isChoice) input.value = '';
  }
  function makeOpt(label, ok, colorIdx) {
    var b = document.createElement('button');
    b.className = 'btn ' + ['accent', 'yellow', 'pink'][colorIdx === undefined ? optsEl.children.length % 3 : colorIdx];
    b.textContent = label;
    b.addEventListener('click', function () { judge(ok); });
    optsEl.appendChild(b);
  }

  function award(ok) {
    var gained;
    if (ok && firstTry) { streak++; gained = 20 + (streak - 1) * 5; }
    else if (ok) { gained = 10; }
    else { streak = 0; gained = 0; }
    score += gained;
    return gained;
  }
  function judge(ok) {
    if (answered || finished) return;
    if (ok) {
      answered = true;
      var g = award(true);
      if (Arcade.juice) Arcade.juice.win();
      setMsg('ok', fmt('gs.shamir.ok', { pts: g }));
      nextTimer = setTimeout(advance, 700);
    } else {
      firstTry = false;
      award(false);
      if (Arcade.juice) Arcade.juice.lose();
      setMsg('no', T('gs.shamir.retry'));
    }
  }
  function submit() {
    if (answered || finished || stepIdx === 2 || stepIdx === 3) return;
    var raw = input.value.trim();
    if (!/^\d+$/.test(raw)) return;
    var v = parseInt(raw, 10);
    var expect = stepIdx === 1 ? ((cur.a * cur.shareX) % P)
               : stepIdx === 4 ? cur.a
               : cur.v;
    judge(v === expect);
  }
  function advance() {
    stepIdx++;
    firstTry = true;
    answered = false;
    if (stepIdx <= 5) { renderStep(); return; }
    score += 30;
    if (roundNum >= TOTAL) { finish(); return; }
    setMsg('ok', fmt('gs.shamir.roundDone', { n: roundNum }));
    givenEl.innerHTML = T('gs.shamir.given') + '<br>' + fmt('gs.shamir.reveal', { L: cur.L });
    stepEl.textContent = '';
    input.hidden = true;
    subBtn.hidden = true;
    hintBtn.hidden = true;
    hintBox.hidden = true;
    nextBtn.textContent = T('gs.shamir.nextBtn');
    nextBtn.hidden = false;
    updProg();
  }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('shamir', sec);
    }
    setMsg('ok', fmt('gs.shamir.done', { score: score }));
    givenEl.innerHTML = T('gs.shamir.given') + '<br>' + fmt('gs.shamir.reveal', { L: cur.L });
    nextBtn.textContent = T('gs.shamir.againBtn');
    nextBtn.hidden = false;
    dailyBtn.hidden = false;
    updProg();
  }
  function nextRound() {
    roundNum++;
    stepIdx = 1;
    firstTry = true;
    answered = false;
    cur = makeRound(dailyMode ? mulberry(daySeed() * 31 + roundNum * 7) : Math.random, roundNum);
    nextBtn.hidden = true;
    input.hidden = false;
    subBtn.hidden = false;
    renderStep();
  }
  function startGame(daily) {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    roundNum = 0;
    score = 0;
    streak = 0;
    finished = false;
    dailyMode = !!daily;
    if (dailyMode) startTs = Date.now();
    dailyBtn.hidden = dailyMode;
    nextRound();
  }

  subBtn.addEventListener('click', submit);
  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') submit();
  });
  hintBtn.addEventListener('click', function () {
    if (finished) return;
    if (hintTaken) { hintBox.hidden = false; return; }
    hintTaken = true;
    score = Math.max(0, score - 10);
    hintBox.hidden = false;
    if (stepIdx === 1) {
      hintBox.textContent = fmt('gs.shamir.hint1', { a: cur.a, x: cur.shareX, ax: cur.a * cur.shareX });
    } else if (stepIdx === 3) {
      hintBox.textContent = T('gs.shamir.hint3');
    } else if (stepIdx === 4) {
      hintBox.textContent = fmt('gs.shamir.hint4', { y1: cur.y1, y2: cur.y2, diff: (cur.y2 - cur.y1 + P) % P });
    } else if (stepIdx === 5) {
      var inner = ((cur.y1 - cur.x1 * cur.a) % P + P) % P;
      hintBox.textContent = fmt('gs.shamir.hint5', { y1: cur.y1, x1: cur.x1, ap: cur.a, inner: inner });
    } else {
      hintBox.textContent = '';
    }
    setMsg('', T('gs.shamir.hintUsed'));
  });
  nextBtn.addEventListener('click', function () {
    if (finished) startGame(false);
    else nextRound();
  });
  dailyBtn.addEventListener('click', function () { startGame(true); });

  window.GAME_RESTART = function () { startGame(false); };

  startGame(false);
})();
