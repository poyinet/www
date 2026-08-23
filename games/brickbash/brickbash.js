/* ============================================================
   打砖块：弹球击碎全部砖块（高分优）
   5 行 × 8 列霓虹砖块，每块 10 分；清屏进下一关球速 +15%；3 条命
   挡板反弹角由击中位置决定：中间直上、边缘大角度
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.brickbash.tut1t'), d: T('gs.brickbash.tut1') },
    { t: T('gs.brickbash.tut2t'), d: T('gs.brickbash.tut2') },
    { t: T('gs.brickbash.tut3t'), d: T('gs.brickbash.tut3') }
  ];

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.brickbash.msgStart') + '</div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.brickbash.hudScore') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.brickbash.hudLives') + ' <span class="stat-value" id="lives">❤️❤️❤️</span></span>' +
    '  <span>' + T('gs.brickbash.hudLevel') + ' <span class="stat-value" id="level">1</span></span>' +
    '</div>' +
    '<div class="brickbash-stage">' +
    '  <canvas id="cv" class="game-canvas" width="400" height="500"></canvas>' +
    '  <button id="pause-btn" class="btn" style="position:absolute;top:8px;left:8px;z-index:5;min-width:44px;min-height:44px;padding:6px 10px" aria-label="' + T('gs.brickbash.pause') + '">⏸</button>' +
    '  <div class="game-overlay" id="overlay" hidden>' +
    '    <div class="ov-title">' + T('gs.brickbash.ovTitle') + '</div>' +
    '    <div class="ov-score">' + T('gs.brickbash.hudScore') + '<b id="final-score">0</b></div>' +
    '    <div class="ov-record" id="ov-record"></div>' +
    '    <button id="restart-btn" class="btn green">' + T('gs.brickbash.btnRestart') + '</button>' +
    '  </div>' +
    '</div>' +
    '<p class="help-text">' + T('gs.brickbash.help') + '</p>';

  var W = 400, H = 500;
  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var msgEl = document.getElementById('msg');
  var scoreEl = document.getElementById('score');
  var livesEl = document.getElementById('lives');
  var levelEl = document.getElementById('level');
  var overlay = document.getElementById('overlay');
  var finalScoreEl = document.getElementById('final-score');
  var recordEl = document.getElementById('ov-record');
  var restartBtn = document.getElementById('restart-btn');

  /* 砖块几何 */
  var ROWS = 5, COLS = 8;
  var BRICK_TOP = 64, BRICK_GAP = 6, BRICK_H = 18, BRICK_MX = 14;
  var BRICK_W = (W - BRICK_MX * 2 - BRICK_GAP * (COLS - 1)) / COLS;
  var ROW_COLORS = ['#00f0ff', '#ff2d95', '#ffe600', '#39ff14', '#b967ff'];

  var BASE_SPEED = 4.6;
  var MAX_BOUNCE_ANGLE = Math.PI / 3; /* 边缘最大 60° */

  var paddle = { x: W / 2, w: 72, h: 12, y: H - 34 };
  var ball = { x: W / 2, y: 0, vx: 0, vy: 0, r: 6, stuck: true };
  var bricks, alive, score, lives, level, speed, playing;
  var keys = { left: false, right: false };
  var paused = false, loopApi = null;

  function togglePause() {
    paused = !paused;
    if (paused) {
      msgEl.textContent = T('gs.brickbash.paused');
      msgEl.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      msgEl.textContent = playing ? (ball.stuck ? T('gs.brickbash.msgStart') : T('gs.brickbash.msgPlaying')) : '';
      msgEl.style.color = '';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function buildBricks() {
    bricks = [];
    alive = ROWS * COLS;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        bricks.push({
          x: BRICK_MX + c * (BRICK_W + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: BRICK_W,
          h: BRICK_H,
          color: ROW_COLORS[r],
          dead: false
        });
      }
    }
  }

  function stickBall() {
    ball.stuck = true;
    ball.x = paddle.x;
    ball.y = paddle.y - ball.r - 1;
  }

  function updateStats() {
    scoreEl.textContent = score;
    var hearts = '';
    for (var i = 0; i < lives; i++) hearts += '❤️';
    livesEl.textContent = hearts || '💔';
    levelEl.textContent = level;
  }

  function init() {
    score = 0;
    lives = 3;
    level = 1;
    speed = BASE_SPEED;
    playing = true;
    paddle.x = W / 2;
    buildBricks();
    stickBall();
    updateStats();
    msgEl.textContent = T('gs.brickbash.msgStart');
    overlay.hidden = true;
  }

  function launch() {
    if (!playing || !ball.stuck) return;
    var a = (Math.random() - 0.5) * 0.8; /* 初始略偏 ±23° */
    ball.vx = speed * Math.sin(a);
    ball.vy = -speed * Math.cos(a);
    ball.stuck = false;
    msgEl.textContent = '';
  }

  function loseLife() {
    lives--;
    updateStats();
    if (lives <= 0) {
      playing = false;
      finalScoreEl.textContent = score;
      var isNew = Arcade.shell.submitScore(score);
      recordEl.textContent = isNew ? T('gs.brickbash.newRecord') : '';
      overlay.hidden = false;
    } else {
      stickBall();
      msgEl.textContent = T('gs.brickbash.livesLeft').replace('{n}', lives);
    }
  }

  function nextLevel() {
    level++;
    speed *= 1.15;
    buildBricks();
    stickBall();
    updateStats();
    Arcade.juice.coin();
    msgEl.textContent = T('gs.brickbash.levelUp').replace('{n}', level);
  }

  function update() {
    if (!playing) return;

    /* 键盘移动挡板 */
    if (keys.left) paddle.x -= 6;
    if (keys.right) paddle.x += 6;
    paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.x));

    if (ball.stuck) {
      stickBall();
      return;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    /* 左右墙 / 天花板 */
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = -ball.vx; }
    if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -ball.vx; }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy = -ball.vy; }

    /* 落底丢命 */
    if (ball.y - ball.r > H) { loseLife(); return; }

    /* 挡板反弹：按击中位置改变反弹角 */
    if (
      ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      Math.abs(ball.x - paddle.x) <= paddle.w / 2 + ball.r
    ) {
      var p = (ball.x - paddle.x) / (paddle.w / 2);
      if (p > 1) p = 1;
      if (p < -1) p = -1;
      var angle = p * MAX_BOUNCE_ANGLE;
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
      ball.y = paddle.y - ball.r;
    }

    /* 砖块 AABB 碰撞（每步最多一块） */
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (b.dead) continue;
      if (
        ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h
      ) {
        b.dead = true;
        alive--;
        score += 10;
        scoreEl.textContent = score;
        var brc = cv.getBoundingClientRect();
        Arcade.juice.clear(
          brc.left + (b.x + b.w / 2) * (brc.width / cv.width),
          brc.top + (b.y + b.h / 2) * (brc.height / cv.height),
          b.color, 10
        );
        /* 按最小穿透轴反弹 */
        var overlapX = (ball.r + b.w / 2) - Math.abs(ball.x - (b.x + b.w / 2));
        var overlapY = (ball.r + b.h / 2) - Math.abs(ball.y - (b.y + b.h / 2));
        if (overlapX < overlapY) ball.vx = -ball.vx;
        else ball.vy = -ball.vy;
        if (alive === 0) nextLevel();
        break;
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0b18');
    g.addColorStop(1, '#07070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* 砖块：半透明填充 + 霓虹描边 */
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (b.dead) continue;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }

    /* 挡板 */
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00f0ff';
    roundRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, 6);
    ctx.fill();
    ctx.restore();

    /* 球 */
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* 待发提示箭头 */
    if (playing && ball.stuck) {
      ctx.fillStyle = 'rgba(255,230,0,0.85)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', ball.x, ball.y - 18);
    }
  }

  /* ---------- 输入 ---------- */

  function pointerX(e) {
    var rect = cv.getBoundingClientRect();
    return (e.clientX - rect.left) * (cv.width / rect.width);
  }

  function movePaddleTo(e) {
    if (!playing) return;
    paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, pointerX(e)));
  }

  cv.addEventListener('pointermove', movePaddleTo);
  cv.addEventListener('pointerdown', function (e) {
    movePaddleTo(e);
    launch();
  });

  Arcade.input.onKeys({
    action: launch
  });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyP') togglePause();
  });
  var pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.addEventListener('click', function () { togglePause(); });

  restartBtn.addEventListener('click', init);

  init();
  loopApi = Arcade.loop.start(update, render, 16);
  window.GAME_RESTART = init;
})();
