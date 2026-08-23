/* 破译 DECODE ARCADE · BB84 量子密钥分发（第四期 A6 旗舰游戏）
   你扮演接收方 Bob：选基测量光子 → 筛选共享密钥 → 抽样比对误码 → 判定 Eve 是否在线。
   物理模拟忠实 BB84：Alice 随机基编码；Eve 以 50% 概率在场且随机选基，
   选错基时测得比特随机化（重发被扰动的态），在筛选密钥中留下约 25% 误码指纹。
   一局 12 光子，多局累计，单局最高分入 BEST（max 模式）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bb84.tut1t'), d: T('gs.bb84.tut1') },
  { t: T('gs.bb84.tut2t'), d: T('gs.bb84.tut2') },
  { t: T('gs.bb84.tut3t'), d: T('gs.bb84.tut3') },
  { t: T('gs.bb84.tut4t'), d: T('gs.bb84.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 12, SAMPLE = 4;

  var wrap = document.createElement('div');
  wrap.className = 'bb-wrap';
  wrap.innerHTML =
    '<div class="bb-prog" id="bb-prog"></div>' +
    '<div class="bb-photon" id="bb-photon">⚛️</div>' +
    '<div class="bb-result" id="bb-result"></div>' +
    '<div class="bb-btns" id="bb-basis">' +
      '<button class="btn accent" id="bb-plus"></button>' +
      '<button class="btn pink" id="bb-x"></button>' +
    '</div>' +
    '<div class="bb-key" id="bb-key" hidden></div>' +
    '<div class="bb-sample" id="bb-sample" hidden></div>' +
    '<div class="bb-btns" id="bb-verdict" hidden>' +
      '<button class="btn green" id="bb-keep"></button>' +
      '<button class="btn yellow" id="bb-drop"></button>' +
    '</div>' +
    '<div class="bb-msg" id="bb-msg"></div>' +
    '<div class="bb-btns"><button class="btn yellow" id="bb-next" hidden></button></div>' +
    '<div class="bb-help">' + T('gs.bb84.helpText') + '</div>';
  root.appendChild(wrap);

  var el = function (id) { return wrap.querySelector('#' + id); };
  var progEl = el('bb-prog'), photonEl = el('bb-photon'), resultEl = el('bb-result'),
      basisBox = el('bb-basis'), plusBtn = el('bb-plus'), xBtn = el('bb-x'),
      keyEl = el('bb-key'), sampleEl = el('bb-sample'), verdictBox = el('bb-verdict'),
      keepBtn = el('bb-keep'), dropBtn = el('bb-drop'),
      msgEl = el('bb-msg'), nextBtn = el('bb-next');
  plusBtn.textContent = T('gs.bb84.basisPlus');
  xBtn.textContent = T('gs.bb84.basisX');
  keepBtn.textContent = T('gs.bb84.keepBtn');
  dropBtn.textContent = T('gs.bb84.dropBtn');

  /* rnd(n)：0..n-1 随机整数 */
  function rnd(n) { return Math.floor(Math.random() * n); }

  var round = 0, score = 0, idx = 0, siftedCount = 0;
  var photons = [], results = [];   /* photons: {bit, base, eve, wire}; results: player basis/bit or null */
  var samples = [];                 /* [{i, aBit, bBit}] */
  var eveHere = false;
  var finished = false;

  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function updProg() {
    progEl.textContent = fmt('gs.bb84.progress', { n: Math.min(idx + 1, TOTAL), total: TOTAL, sifted: siftedCount, score: score });
  }

  function newRound() {
    round++;
    idx = 0; siftedCount = 0; finished = false;
    photons = []; results = []; samples = [];
    eveHere = Math.random() < 0.5;
    keyEl.hidden = true; sampleEl.hidden = true; verdictBox.hidden = true; nextBtn.hidden = true;
    msgEl.textContent = ''; msgEl.className = 'bb-msg'; sampleEl.innerHTML = ''; keyEl.textContent = '';
    photonEl.textContent = '⚛️'; resultEl.textContent = '';
    basisBox.hidden = false;
    nextPhoton();
  }

  function nextPhoton() {
    if (idx >= TOTAL) { finishRound(); return; }
    var bit = rnd(2), base = rnd(2);           /* Alice 的比特与基 */
    var wire = bit;
    if (eveHere) {
      var eBase = rnd(2);
      if (eBase !== base) wire = rnd(2);       /* Eve 选错基：测量结果随机化并重发被扰动态 */
    }
    photons.push({ bit: bit, base: base, wire: wire });
    results.push(null);
    photonEl.textContent = '⚛️ ' + (idx + 1) + '/' + TOTAL;
    resultEl.textContent = T('gs.bb84.waiting');
    updProg();
  }

  function measure(basis) {
    if (finished || idx >= TOTAL) return;
    var p = photons[idx];
    if (!p) return; /* 快速连按/键盘重复：光子尚未生成时忽略 */
    var got;
    if (basis === p.base) got = p.wire;        /* 基匹配：得到线上的真实比特 */
    else got = rnd(2);                          /* 基不同：结果随机，该位将来被丢弃 */
    results[idx] = { base: basis, bit: got };
    if (basis === p.base) siftedCount++;
    resultEl.textContent = fmt('gs.bb84.measured', { bit: got, basis: basis === 0 ? '＋' : '×' });
    if (got && Arcade.juice) Arcade.juice.coin();
    idx++;
    updProg();
    setTimeout(function () { nextPhoton(); }, 420);
  }

  function finishRound() {
    finished = true;
    basisBox.hidden = true;
    photonEl.textContent = '🔐';
    /* 筛选密钥：基一致的位 */
    var keyBits = [];
    for (var i = 0; i < TOTAL; i++) {
      if (results[i] && results[i].base === photons[i].base) keyBits.push({ i: i, a: photons[i].bit, b: results[i].bit });
    }
    /* 抽样比对：取前 min(4, m) 位公开 */
    var k = Math.min(SAMPLE, keyBits.length);
    var errs = 0, html = '';
    for (var j = 0; j < k; j++) {
      var s = keyBits[j];
      samples.push(s);
      var bad = s.a !== s.b;
      if (bad) errs++;
      html += fmt('gs.bb84.sampleRow', { i: j + 1, a: s.a, b: s.b, verdict: bad ? '<b class="err">' + T('gs.bb84.errTag') + '</b>' : '<b class="okc">' + T('gs.bb84.okTag') + '</b>' }) + '<br>';
    }
    sampleEl.hidden = false;
    sampleEl.innerHTML = html || '&nbsp;';
    keyEl.hidden = false;
    keyEl.textContent = T('gs.bb84.verdictQ') + '　' + fmt('gs.bb84.siftInfo', { m: keyBits.length, k: k });
    wrap.dataset.errs = String(errs);
    wrap.dataset.kept = String(Math.max(0, keyBits.length - k));
    verdictBox.hidden = false;
  }

  function settle(accused) {
    verdictBox.hidden = true;
    var errs = parseInt(wrap.dataset.errs || '0', 10);
    var kept = parseInt(wrap.dataset.kept || '0', 10);
    var gained = 0, okMsg = false;
    if (!accused) {
      if (!eveHere) {
        gained = 10 + kept * 2; okMsg = true;
        msgEl.textContent = fmt('gs.bb84.rSafeKept', { pts: '+' + gained, kept: kept });
      } else {
        gained = -8;
        msgEl.textContent = fmt('gs.bb84.rMissed', { pts: '-8' });
      }
    } else {
      if (eveHere) {
        gained = 15; okMsg = true;
        msgEl.textContent = fmt('gs.bb84.rCaught', { pts: '+15' });
      } else {
        gained = -6;
        msgEl.textContent = fmt('gs.bb84.rSafeMissed', { pts: '-6' });
      }
    }
    score = Math.max(0, score + gained);
    msgEl.className = 'bb-msg ' + (okMsg ? 'ok' : 'no');
    msgEl.appendChild(document.createElement('br'));
    var tail = document.createElement('span');
    tail.style.fontSize = '11px';
    tail.textContent = fmt('gs.bb84.roundEnd', { score: score });
    msgEl.appendChild(tail);
    updProg();
    if (Arcade.shell) Arcade.shell.submitScore(score);   /* 单局最高分（max） */
    if (okMsg && Arcade.audio) Arcade.audio.play('record');
    else if (Arcade.audio) Arcade.audio.play('error');
    if (okMsg && Arcade.juice) Arcade.juice.win();
    nextBtn.textContent = T('gs.bb84.nextRound');
    nextBtn.hidden = false;
  }

  plusBtn.addEventListener('click', function () { measure(0); });
  xBtn.addEventListener('click', function () { measure(1); });
  keepBtn.addEventListener('click', function () { settle(false); });
  dropBtn.addEventListener('click', function () { settle(true); });
  nextBtn.addEventListener('click', function () { newRound(); });

  /* 键盘辅助：A/1=＋ 基，L/2=× 基（桌面可达性） */
  document.addEventListener('keydown', function (ev) {
    if (finished) return;
    var kk = ev.key || '';
    if (kk === 'a' || kk === 'A' || kk === '1') measure(0);
    else if (kk === 'l' || kk === 'L' || kk === '2') measure(1);
  });

  /* 重开（S4）：注册到全局重开钩子 */
  window.GAME_RESTART = function () {
    score = 0; round = 0;
    newRound();
  };

  newRound();
})();
