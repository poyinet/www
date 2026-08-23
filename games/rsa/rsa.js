/* 破译 DECODE ARCADE · RSA 小素数保险柜 —— 第六期 #4 新游戏
   从小素数 p、q 出发手算 n → φ → 选 e → 求 d → 加密一个字母；
   3 轮 × 5 步。计分 max：首答 +20 + 连击加成，整轮 +30，提示 −10。
   支持每日模式（日种子确定性出题）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.rsa.tut1t'), d: T('gs.rsa.tut1') },
  { t: T('gs.rsa.tut2t'), d: T('gs.rsa.tut2') },
  { t: T('gs.rsa.tut3t'), d: T('gs.rsa.tut3') },
  { t: T('gs.rsa.tut4t'), d: T('gs.rsa.tut4') },
  { t: T('gs.rsa.tut5t'), d: T('gs.rsa.tut5') }
];

(function () {
  var root = document.getElementById('game-root');
  var PRIMES = [3, 5, 7, 11, 13];
  var TOTAL = 3;

  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function egcd(a, b) {
    if (b === 0) return [a, 1, 0];
    var r = egcd(b, a % b);
    return [r[0], r[2], r[1] - Math.floor(a / b) * r[2]];
  }
  function modinv(a, m) {
    var r = egcd(((a % m) + m) % m, m);
    if (r[0] !== 1) return null;
    return ((r[1] % m) + m) % m;
  }
  function modPow(base, exp, mod) {
    var out = 1;
    base = ((base % mod) + mod) % mod;
    while (exp > 0) {
      if (exp & 1) out = (out * base) % mod;
      base = (base * base) % mod;
      exp >>= 1;
    }
    return out;
  }
  var SUP = { 2: '\u00b2', 4: '\u2074', 8: '\u2078', 16: '\u00b9\u2076' };
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

  function makeRound(rnd) {
    var pool = PRIMES.slice();
    var p = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    var q = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    var n = p * q, phi = (p - 1) * (q - 1);
    var mv = Math.floor(rnd() * 26);
    var m = String.fromCharCode(65 + mv);
    var cands = [3, 5, 7, 11, 13, 17].filter(function (x) { return x < phi && gcd(x, phi) === 1; });
    var e = cands[Math.floor(rnd() * cands.length)];
    var d = modinv(e, phi);
    var c = modPow(mv, e, n);
    var evens = [], odds = [];
    for (var x = 2; x < Math.min(phi, 40); x++) {
      if (x === e) continue;
      if (x % 2 === 0) evens.push(x);
      else if (gcd(x, phi) > 1) odds.push(x);
    }
    function take(arr) { return arr.length ? arr.splice(Math.floor(rnd() * arr.length), 1)[0] : null; }
    var d1 = take(evens);
    if (d1 === null) d1 = 2;
    var d2 = take(odds);
    if (d2 === null) d2 = take(evens);
    if (d2 === null || d2 === d1) d2 = (d1 === 2) ? 4 : 2;
    var options = [{ v: e, ok: true }, { v: d1, ok: false }, { v: d2, ok: false }];
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tt = options[i]; options[i] = options[j]; options[j] = tt;
    }
    var eIdx = 0;
    for (i = 0; i < 3; i++) if (options[i].ok) eIdx = i;
    var chainParts = [], val = mv % n, pw = 1;
    chainParts.push(mv + SUP[pw] + '=' + val);
    while (pw * 2 <= e) {
      pw *= 2;
      val = (val * val) % n;
      chainParts.push(mv + SUP[pw] + '=' + val);
    }
    var chain = chainParts.join('\uff0c') + ' (mod ' + n + ')';
    return { p: p, q: q, n: n, phi: phi, mv: mv, m: m, e: e, d: d, c: c, options: options, eIdx: eIdx, chain: chain, ebin: e.toString(2) };
  }

  var wrap = document.createElement('div');
  wrap.className = 'rs-wrap';
  wrap.innerHTML =
    '<div class="rs-prog" id="rs-prog"></div>' +
    '<div class="rs-given" id="rs-given"></div>' +
    '<div class="rs-step" id="rs-step"></div>' +
    '<input class="rs-input" id="rs-in" inputmode="numeric" maxlength="6" autocomplete="off" spellcheck="false">' +
    '<div class="rs-btns" id="rs-opts"></div>' +
    '<div class="rs-msg" id="rs-msg"></div>' +
    '<div class="rs-hintbox" id="rs-hintbox" hidden></div>' +
    '<div class="rs-btns">' +
      '<button class="btn accent" id="rs-sub"></button>' +
      '<button class="btn yellow" id="rs-hint" hidden></button>' +
    '</div>' +
    '<div class="rs-btns"><button class="btn yellow" id="rs-next" hidden></button></div>' +
    '<div class="rs-btns"><button class="btn" id="rs-daily">' + T('gs.rsa.dailyBtn') + '</button></div>' +
    '<div class="rs-help">' + T('gs.rsa.helpText') + '</div>';
  root.appendChild(wrap);
  var el = function (id) { return wrap.querySelector('#' + id); };
  var progEl = el('rs-prog'), givenEl = el('rs-given'), stepEl = el('rs-step'),
      input = el('rs-in'), optsEl = el('rs-opts'), msgEl = el('rs-msg'),
      hintBox = el('rs-hintbox'), subBtn = el('rs-sub'), hintBtn = el('rs-hint'),
      nextBtn = el('rs-next'), dailyBtn = el('rs-daily');
  subBtn.textContent = T('gs.rsa.submit');
  hintBtn.textContent = T('gs.rsa.hintBtn');
  input.placeholder = T('gs.rsa.phNum');

  var roundNum = 0, score = 0, streak = 0, stepIdx = 1, firstTry = true,
      answered = false, finished = false, dailyMode = false, startTs = 0,
      cur = null, nextTimer = null;

  function updProg() {
    progEl.textContent = fmt('gs.rsa.prog', {
      round: Math.min(roundNum, TOTAL), total: TOTAL, step: Math.min(stepIdx, 5), streak: streak
    });
  }
  function setMsg(cls, txt) { msgEl.className = 'rs-msg ' + cls; msgEl.textContent = txt; }

  function renderStep() {
    updProg();
    hintBox.hidden = true;
    optsEl.innerHTML = '';
    var s = cur;
    givenEl.innerHTML = fmt('gs.rsa.given', { p: s.p, q: s.q }) + '<br>' +
      fmt('gs.rsa.target', { m: s.m });
    if (stepIdx === 1) stepEl.textContent = T('gs.rsa.step1');
    else if (stepIdx === 2) stepEl.textContent = T('gs.rsa.step2');
    else if (stepIdx === 3) stepEl.textContent = fmt('gs.rsa.step3', { phi: s.phi });
    else if (stepIdx === 4) stepEl.textContent = fmt('gs.rsa.step4', { e: s.e, phi: s.phi });
    else stepEl.textContent = fmt('gs.rsa.step5', { mv: s.mv, e: s.e, n: s.n, m: s.m });
    var isChoice = stepIdx === 3;
    input.hidden = isChoice;
    subBtn.hidden = isChoice;
    hintBtn.hidden = !(stepIdx >= 4);
    if (isChoice) {
      s.options.forEach(function (o, i) {
        var b = document.createElement('button');
        b.className = 'btn ' + ['accent', 'yellow', 'pink'][i];
        b.textContent = 'e = ' + o.v;
        b.addEventListener('click', function () { judge(o.ok); });
        optsEl.appendChild(b);
      });
    }
    if (!isChoice) input.value = '';
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
      setMsg('ok', fmt('gs.rsa.ok', { pts: g }));
      setTimeout(advance, 700);
    } else {
      firstTry = false;
      award(false);
      if (Arcade.juice) Arcade.juice.lose();
      setMsg('no', T('gs.rsa.retry'));
    }
  }
  function submit() {
    if (answered || finished || stepIdx === 3) return;
    var raw = input.value.trim();
    if (!/^\d+$/.test(raw)) return;
    var v = parseInt(raw, 10);
    var expect = stepIdx === 1 ? cur.n : stepIdx === 2 ? cur.phi : stepIdx === 4 ? cur.d : cur.c;
    judge(v === expect);
  }
  function advance() {
    stepIdx++;
    firstTry = true;
    answered = false;
    if (stepIdx <= 5) { renderStep(); return; }
    score += 30;
    if (roundNum >= TOTAL) { finish(); return; }
    setMsg('ok', fmt('gs.rsa.roundDone', { n: roundNum }));
    stepEl.textContent = '';
    givenEl.innerHTML = '&nbsp;';
    input.hidden = true;
    subBtn.hidden = true;
    hintBtn.hidden = true;
    hintBox.hidden = true;
    nextBtn.textContent = T('gs.rsa.nextBtn');
    nextBtn.hidden = false;
    updProg();
  }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('rsa', sec);
    }
    setMsg('ok', fmt('gs.rsa.done', { score: score }));
    nextBtn.textContent = T('gs.rsa.againBtn');
    nextBtn.hidden = false;
    dailyBtn.hidden = false;
    updProg();
  }
  function nextRound() {
    roundNum++;
    stepIdx = 1;
    firstTry = true;
    answered = false;
    cur = makeRound(dailyMode ? mulberry(daySeed() * 31 + roundNum * 7) : Math.random);
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
    if (finished || stepIdx < 4) return;
    score = Math.max(0, score - 10);
    hintBox.hidden = false;
    hintBox.textContent = stepIdx === 4
      ? fmt('gs.rsa.hintD', { phi: cur.phi })
      : fmt('gs.rsa.hintC', { chain: cur.chain, ebin: cur.ebin });
    setMsg('', T('gs.rsa.hintUsed'));
  });
  nextBtn.addEventListener('click', function () {
    if (finished) startGame(false);
    else nextRound();
  });
  dailyBtn.addEventListener('click', function () { startGame(true); });

  window.GAME_RESTART = function () { startGame(false); };

  startGame(false);
})();
