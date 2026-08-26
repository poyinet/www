/* 破译 DECODE ARCADE · homomorphic-lab —— 第十四期新游戏
   真·模加法同态：密文 = (明文 + 随机数×模数) mod N 的简单加法同态，
   玩家对（加扰的）密文做加/减，再解密看是否等于明文运算的结果。
   交互演示「在密文上做运算，无需明文」的核心思想。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.homomorphic-lab.tut1t'), d: T('gs.homomorphic-lab.tut1') },
  { t: T('gs.homomorphic-lab.tut2t'), d: T('gs.homomorphic-lab.tut2') },
  { t: T('gs.homomorphic-lab.tut3t'), d: T('gs.homomorphic-lab.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 加法同态（真实算法 core） ----------
     c = (p + r·N′) mod N′? 用真正教科书式：N = p·q 的群、E(p,r) = p + r·N mod N²
     简化教学版：取模 M=100，密钥 k 大整数（仅知持有者），
     E(x) = (x + k) mod M；E(x)+E(y) = (x+y+2k) mod M = E(x+y)+k → 同态成立。
     ——注意这是「加扰」而非安全同态，作为直觉演示非常贴切。 */
  var MOD = 100;
  var KEY = 0;
  function encrypt(x) { return (x + KEY) % MOD; }
  function decrypt(c) { return (c - KEY + MOD) % MOD; }
  function computeAdd(a, b) { return (a + b) % MOD; }   /* 密文上做加法 */
  function computeSub(a, b) { return (a - b + MOD) % MOD; }

  var TOTAL = 6, idx = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      A = 0, B = 0, KEY = 0, rnd = Math.random;

  /* 题目：给出明文 a,b，问密文加/减再解密的结果，或选择正确操作 */
  function buildLevels() {
    var ls = [];
    var a = Math.floor(rnd() * 90) + 2;
    var b = Math.floor(rnd() * 90) + 2;
    ls.push({ kind: 'cryptoAdd', a: a, b: b, op: '+' });
    ls.push({ kind: 'cryptoAdd', a: a, b: b, op: '+' });
    var c = Math.floor(rnd() * 80) + 2;
    var d = Math.floor(rnd() * 80) + 2;
    ls.push({ kind: 'cryptoAdd', a: c, b: d, op: '+' });
    var e = Math.floor(rnd() * 80) + 2;
    var f = Math.floor(rnd() * 60) + 2;
    ls.push({ kind: 'cryptoAdd', a: e, b: f, op: '-' });
    var g = Math.floor(rnd() * 80) + 2;
    var h = Math.floor(rnd() * 60) + 2;
    ls.push({ kind: 'cryptoAdd', a: g, b: h, op: '+' });
    var i = Math.floor(rnd() * 80) + 2;
    var j = Math.floor(rnd() * 60) + 2;
    ls.push({ kind: 'cryptoAdd', a: i, b: j, op: '-' });
    return ls;
  }

  var wrap = document.createElement('div');
  wrap.className = 'hm-wrap';
  wrap.innerHTML =
    '<div class="hm-prog" id="hm-prog"></div>' +
    '<div class="hm-stage" id="hm-stage"></div>' +
    '<div class="hm-box" id="hm-box"></div>' +
    '<div class="hm-q" id="hm-q"></div>' +
    '<div class="hm-btns" id="hm-opts"></div>' +
    '<div class="hm-msg" id="hm-msg"></div>' +
    '<div class="hm-expl" id="hm-expl"></div>' +
    '<div class="hm-btns"><button class="btn green" id="hm-next" hidden></button></div>' +
    '<div class="hm-btns"><button class="btn" id="hm-daily">' + T('gs.homomorphic-lab.dailyBtn') + '</button></div>' +
    '<div class="hm-help">' + T('gs.homomorphic-lab.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('hm-prog'), stageEl = $('hm-stage'), boxEl = $('hm-box'),
      qEl = $('hm-q'), optsEl = $('hm-opts'), msgEl = $('hm-msg'),
      explEl = $('hm-expl'), nextB = $('hm-next'), dailyBtn = $('hm-daily');

  function upd() { progEl.textContent = fmt('gs.homomorphic-lab.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'hm-msg ' + c; msgEl.textContent = t; }

  function renderQ() {
    cur = levels[idx];
    var kind = cur.kind;
    stageEl.textContent = L({ zh: '🧮 云端密算台', en: '🧮 Cloud compute bay' });
    var a = cur.a, b = cur.b;
    var realOp = cur.op === '-' ? ' 减 ' : ' 加 ';
    /* 计算密文 */
    var ea = encrypt(a), eb = encrypt(b);
    var combined = cur.op === '-' ? computeSub(ea, eb) : computeAdd(ea, eb);
    var plainResult = cur.op === '-' ? (a - b + MOD) % MOD : (a + b) % MOD;

    boxEl.innerHTML =
      '<div class="hm-cols">' +
        '<div class="hm-col"><div class="hm-lab">📤 发送方</div>' +
          '<div>明文 a = ' + a + ' → 密文 E(a) = ' + ea + '</div>' +
          '<div>明文 b = ' + b + ' → 密文 E(b) = ' + eb + '</div>' +
        '</div>' +
        '<div class="hm-col"><div class="hm-lab">☁️ 云计算</div>' +
          '<div>拿不到 a 与 b，只有 ' + ea + ' 与 ' + eb + '</div>' +
          '<div>对密文做' + realOp + '：' + String(ea) + (cur.op === '-' ? ' − ' : ' + ') + eb + ' = <b>' + combined + '</b></div>' +
        '</div>' +
      '</div>';
    qEl.textContent = '解密这堆密文运算后的结果（用你的密钥）。';
    curOpts = [String(plainResult), String((plainResult + 1) % MOD), String((plainResult + MOD - 1) % MOD)];
    curA = 0;
    var correctRef = curOpts[curA];
    for (var i = curOpts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = curOpts[i]; curOpts[i] = curOpts[j]; curOpts[j] = tmp;
    }
    curA = curOpts.indexOf(correctRef);
    optsEl.innerHTML = '';
    curOpts.forEach(function (o, oi) {
      var b2 = document.createElement('button');
      b2.className = 'btn accent';
      b2.textContent = o;
      b2.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b2);
    });
    msgEl.className = 'hm-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 25; setMsg('ok', T('gs.homomorphic-lab.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.homomorphic-lab.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L({ zh: '解密后：D( E(a)+E(b) ) = a+b —— 云端从头到尾没有看到任何一个明文字母，只处理了密文。真实同态加密用格等数学保证这一点（安全版），本站是清洗过的直觉演示。', en: 'Decrypting the combined ciphertext yields a+b — the cloud handled ciphertext only. Real HE achieves this with lattices (a secure variant); our version is a clean intuition demo.' });
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx++; if (idx >= TOTAL) { finish(); return; } renderQ(); }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('homomorphic-lab', sec); }
    stageEl.textContent = ''; boxEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.homomorphic-lab.done', { score: score }));
    nextB.textContent = T('gs.homomorphic-lab.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var levels = [];
  function startGame(daily) {
    idx = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 61); }
    else rnd = Math.random;
    KEY = Math.floor(rnd() * (MOD - 1)) + 1;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
