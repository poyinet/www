/* ============================================================
   像素飞鸟：点一下飞一下，穿越管道计分（高分优）
   恒定重力 + 点击/空格瞬时冲量；管道宽 60、缺口 140 随机高度
   碰撞（管道/地面/顶部）→ 落地动画 → 结算
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.pixelbird.tut1t'), d: T('gs.pixelbird.tut1') },
    { t: T('gs.pixelbird.tut2t'), d: T('gs.pixelbird.tut2') },
    { t: T('gs.pixelbird.tut3t'), d: T('gs.pixelbird.tut3') }
  ];

  root.innerHTML =
    '<div class="game-stats">' +
    '  <span>' + T('gs.pixelbird.hudScore') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.pixelbird.hudSpeed') + ' <span class="stat-value" id="speed">1.0x</span></span>' +
    '</div>' +
    '<div class="pixelbird-stage">' +
    '  <canvas id="cv" class="game-canvas" width="400" height="500"></canvas>' +
    '  <button id="pause-btn" class="btn" style="position:absolute;top:8px;left:8px;z-index:5;min-width:44px;min-height:44px;padding:6px 10px" aria-label="' + T('gs.pixelbird.pause') + '">⏸</button>' +
    '  <div class="game-overlay" id="overlay" hidden>' +
    '    <div class="ov-title">' + T('gs.pixelbird.ovTitle') + '</div>' +
    '    <div class="ov-score">' + T('gs.pixelbird.hudScore') + '<b id="final-score">0</b></div>' +
    '    <div class="ov-record" id="ov-record"></div>' +
    '    <button id="restart-btn" class="btn green">' + T('gs.pixelbird.btnRestart') + '</button>' +
    '  </div>' +
    '</div>' +
    '<p class="help-text">' + T('gs.pixelbird.help') + '</p>';

  var W = 400, H = 500, GROUND_H = 36;
  var GRAVITY = 0.45, IMPULSE = -7.4, MAX_FALL = 10;
  var PIPE_W = 60, GAP = 140, SPAWN_STEPS = 92;

  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(cv);
  var scoreEl = document.getElementById('score');
  var speedEl = document.getElementById('speed');
  var overlay = document.getElementById('overlay');
  var finalScoreEl = document.getElementById('final-score');
  var recordEl = document.getElementById('ov-record');
  var restartBtn = document.getElementById('restart-btn');

  var bird = { x: 96, y: H / 2, vy: 0, r: 13 };
  var pipes, score, state, tick, spawnIn, angle;
  /* idle 待机 | play 飞行 | dead 坠落中 | over 已结算 */
  var paused = false, loopApi = null;
  var helpEl = document.querySelector('.help-text');

  function togglePause() {
    paused = !paused;
    if (paused) {
      helpEl.textContent = T('gs.pixelbird.paused');
      helpEl.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      helpEl.textContent = T('gs.pixelbird.helpTap');
      helpEl.style.color = '';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* 背景星星（生成一次） */
  var stars = [];
  for (var i = 0; i < 34; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * (H - GROUND_H),
      r: 0.6 + Math.random() * 1.4,
      a: 0.15 + Math.random() * 0.4
    });
  }

  function pipeSpeed() {
    return 2.2 + Math.min(score * 0.04, 1.4);
  }

  function init() {
    pipes = [];
    score = 0;
    state = 'idle';
    tick = 0;
    spawnIn = 40;
    angle = 0;
    bird.y = H / 2;
    bird.vy = 0;
    scoreEl.textContent = '0';
    speedEl.textContent = '1.0x';
    overlay.hidden = true;
  }

  function flap() {
    if (state === 'idle') state = 'play';
    if (state !== 'play') return;
    bird.vy = IMPULSE;
    Arcade.juice.move();
  }

  function spawnPipe() {
    var minC = GAP / 2 + 60;
    var maxC = H - GROUND_H - GAP / 2 - 60;
    pipes.push({
      x: W + 20,
      gapY: minC + Math.random() * (maxC - minC),
      passed: false
    });
  }

  function die() {
    if (state !== 'play') return;
    state = 'dead';
  }

  function settle() {
    state = 'over';
    finalScoreEl.textContent = score;
    var isNew = Arcade.shell.submitScore(score);
    recordEl.textContent = isNew ? T('gs.pixelbird.newRecord') : '';
    overlay.hidden = false;
  }

  function update() {
    tick++;

    if (state === 'idle') {
      bird.y = H / 2 + Math.sin(tick * 0.06) * 8;
      angle = Math.sin(tick * 0.06 + 1) * 0.15;
      return;
    }

    if (state === 'play') {
      /* 重力 */
      bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
      bird.y += bird.vy;
      angle = Math.max(-0.45, Math.min(1.3, bird.vy * 0.085));

      /* 生成与推进管道 */
      spawnIn--;
      if (spawnIn <= 0) {
        spawnPipe();
        spawnIn = SPAWN_STEPS;
      }
      var v = pipeSpeed();
      for (var i = pipes.length - 1; i >= 0; i--) {
        var p = pipes[i];
        p.x -= v;
        if (!p.passed && p.x + PIPE_W < bird.x) {
          p.passed = true;
          score++;
          Arcade.juice.coin();
          scoreEl.textContent = score;
          speedEl.textContent = (pipeSpeed() / 2.2).toFixed(1) + 'x';
        }
        if (p.x + PIPE_W < -10) pipes.splice(i, 1);
      }

      /* 碰撞：天花板 / 地面 */
      if (bird.y - bird.r <= 0) { bird.y = bird.r; die(); return; }
      if (bird.y + bird.r >= H - GROUND_H) {
        bird.y = H - GROUND_H - bird.r;
        die();
        return;
      }

      /* 碰撞：管道矩形 */
      for (var j = 0; j < pipes.length; j++) {
        var q = pipes[j];
        if (bird.x + bird.r > q.x && bird.x - bird.r < q.x + PIPE_W) {
          if (bird.y - bird.r < q.gapY - GAP / 2 || bird.y + bird.r > q.gapY + GAP / 2) {
            die();
            return;
          }
        }
      }
    } else if (state === 'dead') {
      /* 落地动画：旋转俯冲坠地 */
      bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
      bird.y += bird.vy;
      angle += (Math.PI / 2 - angle) * 0.12;
      if (bird.y + bird.r >= H - GROUND_H) {
        bird.y = H - GROUND_H - bird.r;
        settle();
      }
    }
  }

  function drawPipe(p) {
    var topH = p.gapY - GAP / 2;
    var botY = p.gapY + GAP / 2;
    var botH = H - GROUND_H - botY;
    ctx.fillStyle = 'rgba(57,255,20,0.14)';
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    /* 上管 */
    ctx.fillRect(p.x, 0, PIPE_W, topH);
    ctx.strokeRect(p.x + 1, -2, PIPE_W - 2, topH + 2);
    ctx.fillRect(p.x - 3, topH - 14, PIPE_W + 6, 14);
    ctx.strokeRect(p.x - 3, topH - 14, PIPE_W + 6, 14);
    /* 下管 */
    ctx.fillRect(p.x, botY, PIPE_W, botH);
    ctx.strokeRect(p.x + 1, botY, PIPE_W - 2, botH + 2);
    ctx.fillRect(p.x - 3, botY, PIPE_W + 6, 14);
    ctx.strokeRect(p.x - 3, botY, PIPE_W + 6, 14);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    /* 夜空 + 星星 */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d0d20');
    g.addColorStop(1, '#07070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    /* 管道 */
    for (var j = 0; j < pipes.length; j++) drawPipe(pipes[j]);

    /* 地面 */
    ctx.fillStyle = '#101020';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.strokeStyle = 'rgba(0,240,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - GROUND_H);
    ctx.lineTo(W, H - GROUND_H);
    ctx.stroke();

    /* 小鸟（emoji，随速度旋转） */
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(angle);
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐤', 0, 0);
    ctx.restore();

    /* 分数大字 */
    ctx.save();
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(255,230,0,0.8)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffe600';
    ctx.fillText(score, W / 2, 18);
    ctx.restore();

    /* 待机提示 */
    if (state === 'idle') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,240,255,0.9)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(T('gs.pixelbird.idleTitle'), W / 2, H / 2 - 90);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(232,232,240,0.75)';
      ctx.font = '14px sans-serif';
      ctx.fillText(T('gs.pixelbird.idleHint'), W / 2, H / 2 - 56);
      ctx.restore();
    }
  }

  /* ---------- 输入 ---------- */

  cv.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    flap();
  });
  Arcade.input.onKeys({ action: flap });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });
  var pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.addEventListener('click', function () { togglePause(); });

  restartBtn.addEventListener('click', init);

  init();
  loopApi = Arcade.loop.start(update, render, 16);
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.pixelbird.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = init;
})();
