/* 节拍脉冲 Rhythm —— Phase3 通用高质量（tap timing） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.rhythm.tut1t'), d: T('gs.rhythm.tut1') },
  { t: T('gs.rhythm.tut2t'), d: T('gs.rhythm.tut2') },
  { t: T('gs.rhythm.tut3t'), d: T('gs.rhythm.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 360, H = 520;
  var HIT_Y = H - 90, LEAD = 1600, SPEED = (HIT_Y - 50) / LEAD;
  var PERFECT = 70, GOOD = 150;
  var N = 32, notes, score, combo, maxCombo, startTs, ended, judge, judgeT;

  function reset() {
    notes = []; for (var i = 0; i < N; i++) notes.push({ time: 1500 + i * 520, done: false, res: null });
    score = 0; combo = 0; maxCombo = 0; startTs = Date.now(); ended = false; judge = ''; judgeT = 0;
  }

  var paused = false, loopApi = null, pauseStartTs = 0;

  function togglePause() {
    if (ended) return;
    paused = !paused;
    if (paused) {
      pauseStartTs = Date.now();
      judgeEl.textContent = T('gs.rhythm.paused');
      judgeEl.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      startTs += Date.now() - pauseStartTs; // 冻结时间轴
      judgeEl.textContent = '';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  var wrap = document.createElement('div');
  wrap.className = 'rh-wrap';
  wrap.innerHTML =
    '<canvas class="rh-canvas" id="rh-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="rh-top"><span>' + T('gs.rhythm.hudScore') + ' <span id="rh-score">0</span></span><span>' + T('gs.rhythm.hudCombo') + ' <span id="rh-combo">0</span></span></div>' +
    '<div class="rh-judge" id="rh-judge"></div>' +
    '<div class="game-controls">' +
    '  <button id="rh-pause" class="btn green">⏸ ' + T('gs.rhythm.pause') + '</button>' +
    '  <button id="rh-restart" class="btn purple">' + T('gs.rhythm.restart') + '</button>' +
    '</div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#rh-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#rh-score'), comboEl = wrap.querySelector('#rh-combo'),
      judgeEl = wrap.querySelector('#rh-judge'), restartBtn = wrap.querySelector('#rh-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  function setJudge(txt, color) { judge = txt; judgeT = Date.now(); judgeEl.textContent = txt; judgeEl.style.color = color; }
  function jtxt(k) { return T(k); } // 判定词走 i18n（修复中文模式显示英文判定）

  function update() {
    if (ended) return;
    var now = Date.now() - startTs;
    for (var i = 0; i < notes.length; i++) {
      if (!notes[i].done && now > notes[i].time + GOOD) {
        notes[i].done = true; notes[i].res = 'miss'; combo = 0; comboEl.textContent = 0;
        setJudge(T('gs.rhythm.jMiss'), 'var(--neon-pink)'); if (Arcade.juice) Arcade.juice.lose();
      }
    }
    if (now > notes[notes.length - 1].time + GOOD + 400) {
      ended = true;
      judgeEl.textContent = T('gs.rhythm.done').replace('{n}', maxCombo);
      judgeEl.style.color = 'var(--neon-yellow)';
      if (Arcade.shell) Arcade.shell.submitScore(score);
    }
  }

  var lastTapT = 0;
  function tap() {
    if (ended) return;
    // 键盘长按自动连发防抖（修复：重复 keydown 第二次落在误差窗外被判 MISS 清零连击）
    var tNow = Date.now();
    if (tNow - lastTapT < 80) return;
    lastTapT = tNow;
    var now = tNow - startTs;
    var best = -1, bestDiff = 1e9;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].done) continue;
      var d = Math.abs(notes[i].time - now);
      if (d < bestDiff) { bestDiff = d; best = i; }
    }
    if (best < 0 || bestDiff > GOOD) { combo = 0; comboEl.textContent = 0; setJudge(T('gs.rhythm.jMiss'), 'var(--neon-pink)'); if (Arcade.juice) Arcade.juice.lose(); return; }
    notes[best].done = true;
    var gain;
    if (bestDiff <= PERFECT) { gain = 100; setJudge(T('gs.rhythm.jPerfect'), 'var(--neon-green)'); }
    else { gain = 50; setJudge(T('gs.rhythm.jGood'), 'var(--neon-cyan)'); }
    combo++; if (combo > maxCombo) maxCombo = combo;
    comboEl.textContent = combo;
    score += gain + Math.min(combo, 20) * 2;
    scoreEl.textContent = score;
    if (Arcade.juice) Arcade.juice.select();
  }

  function draw() {
    var now = Date.now() - startTs;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, HIT_Y); ctx.lineTo(W, HIT_Y); ctx.stroke();
    ctx.fillStyle = 'rgba(185,103,255,0.5)'; ctx.fillRect(W / 2 - 30, HIT_Y - 4, 60, 8);
    ctx.fillStyle = 'var(--neon-pink)';
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].done) continue;
      var y = HIT_Y - (notes[i].time - now) * SPEED;
      if (y < -20 || y > H + 20) continue;
      ctx.beginPath(); ctx.arc(W / 2, y, 18, 0, 7);
      ctx.fillStyle = (Math.abs(notes[i].time - now) <= PERFECT) ? '#39ff14' : '#ff2d95';
      ctx.fill();
    }
    if (judgeT && Date.now() - judgeT > 500) { judgeEl.textContent = ''; judgeT = 0; }
  }

  Arcade.input.onKeys({ action: tap, up: tap });
  canvas.addEventListener('pointerdown', function (e) { tap(); e.preventDefault(); });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });
  var pauseBtn = document.getElementById('rh-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', function () { togglePause(); });

  restartBtn.addEventListener('click', function () { reset(); scoreEl.textContent = '0'; comboEl.textContent = '0'; judgeEl.textContent = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.rhythm.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); scoreEl.textContent = '0'; comboEl.textContent = '0'; judgeEl.textContent = ''; };

  reset();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
