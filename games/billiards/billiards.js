/* 台球 Billiards —— Phase3 通用高质量（Canvas 物理） */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.billiards.tut1t'), d: T('gs.billiards.tut1') },
  { t: T('gs.billiards.tut2t'), d: T('gs.billiards.tut2') },
  { t: T('gs.billiards.tut3t'), d: T('gs.billiards.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 600, H = 330, M = 22, R = 9, PR = 17;
  var LEFT = M, RIGHT = W - M, TOP = M, BOT = H - M;
  var POCKETS = [
    { x: LEFT, y: TOP }, { x: W / 2, y: TOP }, { x: RIGHT, y: TOP },
    { x: LEFT, y: BOT }, { x: W / 2, y: BOT }, { x: RIGHT, y: BOT }
  ];
  var COLORS = ['#ffd400', '#0050ff', '#ff2d2d', '#8b2dff', '#ff7a00', '#39ff14'];
  var balls = [], cue, score, won, aiming, aimStart, aimNow, loop;

  function reset() {
    balls = [];
    cue = { x: 150, y: H / 2, vx: 0, vy: 0, r: R, color: '#ffffff', cue: true };
    balls.push(cue);
    var bx = 400, by = H / 2, gap = 20, k = 0;
    for (var col = 0; col < 3; col++) {
      for (var row = 0; row <= col; row++) {
        balls.push({ x: bx + col * gap * 0.87, y: by + (row - col / 2) * gap, vx: 0, vy: 0, r: R, color: COLORS[k % COLORS.length] });
        k++;
      }
    }
    score = 0; won = false; aiming = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'bl-wrap';
  wrap.innerHTML =
    '<canvas class="bl-canvas" id="bl-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="bl-top"><span>' + T('gs.billiards.pocketed') + ' <span id="bl-score">0</span> / 6</span><span>' + T('gs.billiards.aimHint') + '</span></div>' +
    '<div class="bl-msg" id="bl-msg">' + T('gs.billiards.hint') + '</div>' +
    '<div class="game-controls"><button id="bl-restart" class="btn purple">' + T('gs.billiards.rack') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#bl-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#bl-score'), msg = wrap.querySelector('#bl-msg'),
      restartBtn = wrap.querySelector('#bl-restart');
  var paused = false;

  function togglePause() {
    paused = !paused;
    if (paused) {
      msg.textContent = T('gs.billiards.paused');
      msg.style.color = 'var(--neon-yellow)';
      if (loop) loop.pause();
    } else {
      msg.textContent = T('gs.billiards.hint');
      msg.style.color = '';
      if (loop) loop.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function allStopped() {
    for (var i = 0; i < balls.length; i++) if (Math.abs(balls[i].vx) > 0.05 || Math.abs(balls[i].vy) > 0.05) return false;
    return true;
  }
  function speed(b) { return Math.sqrt(b.vx * b.vx + b.vy * b.vy); }

  function step() {
    for (var s = 0; s < 2; s++) {
      for (var i = 0; i < balls.length; i++) {
        var b = balls[i];
        b.x += b.vx / 2; b.y += b.vy / 2;
        b.vx *= 0.992; b.vy *= 0.992;
        if (speed(b) < 0.04) { b.vx = 0; b.vy = 0; }
      }
      // 墙
      for (var i2 = 0; i2 < balls.length; i2++) {
        var bb = balls[i2];
        if (bb.x < LEFT + bb.r) { bb.x = LEFT + bb.r; bb.vx = -bb.vx * 0.9; }
        if (bb.x > RIGHT - bb.r) { bb.x = RIGHT - bb.r; bb.vx = -bb.vx * 0.9; }
        if (bb.y < TOP + bb.r) { bb.y = TOP + bb.r; bb.vy = -bb.vy * 0.9; }
        if (bb.y > BOT - bb.r) { bb.y = BOT - bb.r; bb.vy = -bb.vy * 0.9; }
      }
      // 球碰
      for (var a = 0; a < balls.length; a++) {
        for (var c = a + 1; c < balls.length; c++) {
          var A = balls[a], B = balls[c];
          var dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy);
          var min = A.r + B.r;
          if (d > 0 && d < min) {
            var nx = dx / d, ny = dy / d, overlap = (min - d) / 2;
            A.x -= nx * overlap; A.y -= ny * overlap; B.x += nx * overlap; B.y += ny * overlap;
            var avn = A.vx * nx + A.vy * ny, bvn = B.vx * nx + B.vy * ny;
            var diff = bvn - avn;
            A.vx += nx * diff; A.vy += ny * diff; B.vx -= nx * diff; B.vy -= ny * diff;
          }
        }
      }
    }
    // 进袋
    for (var p = balls.length - 1; p >= 0; p--) {
      var ball = balls[p];
      for (var pk = 0; pk < POCKETS.length; pk++) {
        var px = POCKETS[pk].x - ball.x, py = POCKETS[pk].y - ball.y;
        if (px * px + py * py < PR * PR) {
          if (ball.cue) { ball.x = 150; ball.y = H / 2; ball.vx = 0; ball.vy = 0; }
          else { balls.splice(p, 1); score++; if (Arcade.juice) Arcade.juice.coin(ball.x, ball.y, ball.color); }
          break;
        }
      }
    }
    scoreEl.textContent = score;
    if (!won && balls.length === 1) {
      won = true;
      msg.textContent = T('gs.billiards.win').replace('{n}', score);
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b3d24'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(57,255,20,0.5)'; ctx.lineWidth = 3;
    ctx.strokeRect(LEFT, TOP, RIGHT - LEFT, BOT - TOP);
    ctx.fillStyle = '#062';
    POCKETS.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, PR, 0, 7); ctx.fill(); });
    balls.forEach(function (b) {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.fillStyle = b.color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
    });
    if (aiming && aimStart && aimNow) {
      var dx = aimStart.x - aimNow.x, dy = aimStart.y - aimNow.y;
      var len = Math.min(Math.sqrt(dx * dx + dy * dy), 130);
      var ang = Math.atan2(dy, dx);
      ctx.strokeStyle = 'rgba(255,230,0,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + Math.cos(ang) * len, cue.y + Math.sin(ang) * len); ctx.stroke();
    }
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: cx * (W / rect.width), y: cy * (H / rect.height) };
  }
  function down(e) {
    if (won || !allStopped()) return;
    var p = toCanvas(e);
    // 抓球命中半径按画布缩放放大（小屏触控精度）
    var rect = canvas.getBoundingClientRect();
    var grabR = 30 * (W / (rect.width || 1));
    if (Math.sqrt((p.x - cue.x) * (p.x - cue.x) + (p.y - cue.y) * (p.y - cue.y)) < grabR) {
      aiming = true; aimStart = p; aimNow = p; e.preventDefault();
    }
  }
  function move(e) { if (aiming) { aimNow = toCanvas(e); e.preventDefault(); } }
  function up(e) {
    if (!aiming) return;
    aiming = false;
    var dx = aimStart.x - aimNow.x, dy = aimStart.y - aimNow.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 6) return;
    var power = Math.min(len, 130) / 130 * 15;
    var ang = Math.atan2(dy, dx);
    cue.vx = Math.cos(ang) * power; cue.vy = Math.sin(ang) * power;
    if (Arcade.juice) Arcade.juice.drop();
    e.preventDefault();
  }
  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', up, { passive: false });

  restartBtn.addEventListener('click', function () { reset(); msg.textContent = T('gs.billiards.hint'); if (Arcade.audio) Arcade.audio.play('ui'); });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  reset();
  loop = Arcade.loop.start(step, draw, 16);
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.billiards.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); msg.textContent = T('gs.billiards.hint'); };

})();
