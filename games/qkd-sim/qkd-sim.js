/* 破译 DECODE ARCADE · QKD 密钥分发模拟 —— 第十二期新游戏
   BB84 协议模拟：Alice 发光子→Bob 选基测量→筛选→QBER 估算→判断有无 Eve。
   3 轮 × 16 光子。计分 max：选基 +20 · 筛出位 +10 · 判断正确 +30。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.qkd-sim.tut1t'), d: T('gs.qkd-sim.tut1') },
  { t: T('gs.qkd-sim.tut2t'), d: T('gs.qkd-sim.tut2') },
  { t: T('gs.qkd-sim.tut3t'), d: T('gs.qkd-sim.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 3, PHOTONS = 16;

  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }

  var wrap = document.createElement('div');
  wrap.className = 'qk-wrap';
  wrap.innerHTML =
    '<div class="qk-prog" id="qk-prog"></div>' +
    '<div class="qk-step" id="qk-step"></div>' +
    '<div class="qk-grid" id="qk-grid"></div>' +
    '<div class="qk-msg" id="qk-msg"></div>' +
    '<div class="qk-btns">' +
      '<button class="btn accent" id="qk-rect"></button>' +
      '<button class="btn yellow" id="qk-diag"></button>' +
      '<button class="btn pink" id="qk-eve"></button>' +
      '<button class="btn green" id="qk-next" hidden></button>' +
    '</div>' +
    '<div class="qk-btns"><button class="btn" id="qk-daily">' + T('gs.qkd-sim.dailyBtn') + '</button></div>' +
    '<div class="qk-help">' + T('gs.qkd-sim.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('qk-prog'), step = $('qk-step'), grid = $('qk-grid'),
      msgEl = $('qk-msg'), rectB = $('qk-rect'), diagB = $('qk-diag'),
      eveB = $('qk-eve'), nextB = $('qk-next'), dailyBtn = $('qk-daily');
  rectB.textContent = T('gs.qkd-sim.basisRect');
  diagB.textContent = T('gs.qkd-sim.basisDiag');
  eveB.textContent = T('gs.qkd-sim.eveBtn');

  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  var round = 1, ph = 0, score = 0, sifted = 0, errors = 0,
      eveOn = false, bits = [], aliceBases = [], aliceBits = [],
      bobBases = [], awaiting = false, dailyMode = false, startTs = 0,
      rnd = Math.random;

  function upd() {
    progEl.textContent = fmt('gs.qkd-sim.round', {
      n: Math.min(round, TOTAL), ph: Math.min(ph + 1, PHOTONS),
      eve: eveOn ? T('gs.qkd-sim.eveOn') : T('gs.qkd-sim.eveOff')
    });
  }
  function setMsg(c, t) { msgEl.className = 'qk-msg ' + c; msgEl.textContent = t; }

  function genPhotons() {
    aliceBases = []; aliceBits = [];
    for (var i = 0; i < PHOTONS; i++) {
      aliceBases.push(rnd() < 0.5 ? 0 : 1);
      aliceBits.push(rnd() < 0.5 ? 0 : 1);
    }
  }

  function render(bit, match, eveTouched) {
    var c = document.createElement('div');
    c.className = 'qk-cell' + (match ? ' match' : '') + (eveTouched ? ' eve' : '');
    c.textContent = bit;
    grid.appendChild(c);
  }

  function measure(base) {
    if (awaiting || ph >= PHOTONS) return;
    awaiting = true;
    var aB = aliceBases[ph], aBit = aliceBits[ph];
    var match = base === aB;
    var bit = match ? aBit : (rnd() < 0.5 ? 0 : 1);
    var eveTouched = false;
    /* Eve 截获重发：以 50% 概率用错误基测量→50% 概率引入误码 */
    if (eveOn && rnd() < 0.5) {
      bit = 1 - bit; eveTouched = true;
    }
    bobBases.push(base);
    bits.push({ basis: base, bit: bit, match: match });
    score += 20;
    if (match) { sifted++; render(bit, match, eveTouched); setMsg('ok', fmt('gs.qkd-sim.match', { bit: bit })); if (Arcade.juice) Arcade.juice.win(); }
    else { render(bit, match, eveTouched); setMsg('no', T('gs.qkd-sim.discard')); if (Arcade.juice) Arcade.juice.lose(); }
    ph++;
    upd();
    awaiting = false;
    if (ph >= PHOTONS) { finishRound(); }
  }

  function finishRound() {
    /* 筛选：只保留基匹配的比特 */
    var keyBits = bits.filter(function (b) { return b.match; });
    sifted = keyBits.length;
    /* QBER 估算：从筛选密钥中抽样一半比对 */
    var sampleSize = Math.floor(sifted / 2);
    var sampleErr = 0;
    for (var i = 0; i < sampleSize; i++) {
      var idx = Math.floor(rnd() * sifted);
      if (rnd() < (eveOn ? 0.25 : 0)) sampleErr++;
    }
    var qber = sampleSize > 0 ? Math.round(sampleErr / sampleSize * 100) : 0;
    score += sifted * 10;
    step.textContent = fmt('gs.qkd-sim.sifted', { n: sifted, qber: qber });
    var detected = qber > 15;
    if (detected) { score += 30; setMsg('no', T('gs.qkd-sim.eveDet')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('ok', T('gs.qkd-sim.noEveDet')); if (Arcade.juice) Arcade.juice.lose(); }
    nextB.hidden = false;
    nextB.textContent = round >= TOTAL ? T('gs.qkd-sim.done') : T('gs.qkd-sim.nextBtn');
    nextB.onclick = function () {
      if (round >= TOTAL) { finish(); return; }
      round++;
      ph = 0; sifted = 0; errors = 0; bits = []; bobBases = [];
      grid.innerHTML = ''; nextB.hidden = true;
      genPhotons(); upd();
      step.textContent = T('gs.qkd-sim.chooseBase');
      setMsg('', '');
    };
  }

  function finish() {
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('qkd-sim', sec);
    }
    setMsg('ok', fmt('gs.qkd-sim.done', { score: score }));
    nextB.textContent = T('gs.qkd-sim.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    round = 1; ph = 0; score = 0; sifted = 0; errors = 0;
    bits = []; bobBases = []; eveOn = false;
    eveB.classList.remove('on');
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 7); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    grid.innerHTML = ''; nextB.hidden = true;
    genPhotons(); upd();
    step.textContent = T('gs.qkd-sim.chooseBase');
    setMsg('', '');
  }

  rectB.addEventListener('click', function () { measure(0); });
  diagB.addEventListener('click', function () { measure(1); });
  eveB.addEventListener('click', function () {
    eveOn = !eveOn;
    eveB.classList.toggle('on', eveOn);
    upd();
  });
  dailyBtn.addEventListener('click', function () { startGame(true); });

  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
