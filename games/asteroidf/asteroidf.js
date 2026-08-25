/* 小行星 Asteroid Field —— 批次B 经典街机 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.asteroidf.tut1t'), d: T('gs.asteroidf.tut1') },
  { t: T('gs.asteroidf.tut2t'), d: T('gs.asteroidf.tut2') },
  { t: T('gs.asteroidf.tut3t'), d: T('gs.asteroidf.tut3') },
  { t: T('gs.asteroidf.tut4t'), d: T('gs.asteroidf.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 640, H = 420;
  var ship, bullets, roids, score, lives, over, paused, loopApi, keys;
  var DIFFS = { easy: 3, normal: 5, hard: 7 };
  var difficulty = 'normal';

  function mkRoid(x, y, size) {
    var speed = 0.6 + Math.random() * 1.6;
    var ang = Math.random() * Math.PI * 2;
    return { x: x, y: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, size: size, verts: 8 + Math.floor(Math.random() * 5), rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.03 };
  }

  function setup() {
    ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, ang: -Math.PI / 2, thrust: false };
    bullets = [];
    roids = [];
    var n = DIFFS[difficulty];
    for (var i = 0; i < n; i++) {
      var x = 40 + Math.random() * (W - 80), y = 40 + Math.random() * (H - 80);
      if (Math.hypot(x - W / 2, y - H / 2) < 120) { y = 30; }
      roids.push(mkRoid(x, y, 3));
    }
    score = 0; lives = 3; over = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'as-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="as-diff">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.asteroidf.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.asteroidf.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.asteroidf.dHard') + '</button>' +
    '</div>' +
    '<canvas class="as-canvas" id="as-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="as-top"><span>' + T('gs.asteroidf.score') + ' <span id="as-score">0</span></span><span>' + T('gs.asteroidf.lives') + ' <span id="as-lives">3</span></span></div>' +
    '<div class="as-msg" id="as-msg">' + T('gs.asteroidf.help') + '</div>' +
    '<div class="game-controls"><button id="as-restart" class="btn purple">' + T('gs.asteroidf.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#as-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#as-score'), livesEl = wrap.querySelector('#as-lives'),
      msg = wrap.querySelector('#as-msg'), restartBtn = wrap.querySelector('#as-restart'),
      diffRow = wrap.querySelector('#as-diff');
  keys = { left: false, right: false, thrust: false, fire: false };

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.asteroidf.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.asteroidf.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function wrapAround(o) {
    if (o.x < -30) o.x = W + 30;
    if (o.x > W + 30) o.x = -30;
    if (o.y < -30) o.y = H + 30;
    if (o.y > H + 30) o.y = -30;
  }

  function update() {
    if (over) return;
    // 飞船
    if (keys.left) ship.ang -= 0.07;
    if (keys.right) ship.ang += 0.07;
    if (keys.thrust) {
      ship.vx += Math.cos(ship.ang) * 0.18;
      ship.vy += Math.sin(ship.ang) * 0.18;
      if (Math.random() < 0.4 && Arcade.juice) Arcade.juice.move();
    }
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy;
    wrapAround(ship);
    // 射击
    if (keys.fire) {
      keys.fire = false;
      bullets.push({ x: ship.x + Math.cos(ship.ang) * 18, y: ship.y + Math.sin(ship.ang) * 18, vx: Math.cos(ship.ang) * 7 + ship.vx, vy: Math.sin(ship.ang) * 7 + ship.vy, life: 40 });
      if (Arcade.juice) Arcade.juice.select();
    }
    bullets.forEach(function (b) { b.x += b.vx; b.y += b.vy; b.life--; });
    bullets = bullets.filter(function (b) { return b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20; });
    // 小行星
    roids.forEach(function (r) { r.x += r.vx; r.y += r.vy; r.rot += r.vr; wrapAround(r); });
    // 子弹命中
    var newRoids = [];
    for (var bi = bullets.length - 1; bi >= 0; bi--) {
      var b = bullets[bi];
      for (var ri = roids.length - 1; ri >= 0; ri--) {
        var r = roids[ri];
        var rad = r.size * 11;
        if (Math.hypot(b.x - r.x, b.y - r.y) < rad) {
          bullets.splice(bi, 1);
          roids.splice(ri, 1);
          score += r.size === 3 ? 20 : 50;
          if (r.size > 1) {
            newRoids.push(mkRoid(r.x + 8, r.y + 8, r.size - 1));
            newRoids.push(mkRoid(r.x - 8, r.y - 8, r.size - 1));
          }
          if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-pink)', 10);
          break;
        }
      }
    }
    roids = roids.concat(newRoids);
    // 船被撞
    for (var ri2 = 0; ri2 < roids.length; ri2++) {
      var r2 = roids[ri2];
      if (Math.hypot(ship.x - r2.x, ship.y - r2.y) < r2.size * 11 + 10) {
        lives--;
        if (lives <= 0) {
          over = true;
          msg.textContent = T('gs.asteroidf.dead').replace('{n}', score);
          msg.style.color = 'var(--neon-pink)';
          if (Arcade.juice) Arcade.juice.lose();
          if (Arcade.shell) Arcade.shell.submitScore(score);
        } else {
          ship.x = W / 2; ship.y = H / 2; ship.vx = 0; ship.vy = 0;
          msg.textContent = T('gs.asteroidf.hit').replace('{n}', lives);
          msg.style.color = 'var(--neon-pink)';
          setTimeout(function () { msg.textContent = T('gs.asteroidf.help'); msg.style.color = ''; }, 900);
        }
        break;
      }
    }
    // 清空
    if (!roids.length && !over) {
      over = true;
      msg.textContent = T('gs.asteroidf.clear').replace('{n}', score);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
    }
    scoreEl.textContent = score;
    livesEl.textContent = lives;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#03040c'; ctx.fillRect(0, 0, W, H);
    // 星星
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (var i = 0; i < 60; i++) {
      var sx = (i * 97) % W, sy = (i * 53) % H;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    // 小行星（多边形）
    roids.forEach(function (r) {
      ctx.strokeStyle = '#b967ff'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var v = 0; v < r.verts; v++) {
        var a = r.rot + v / r.verts * Math.PI * 2;
        var rr = r.size * 11 * (0.7 + ((v * 37) % 10) / 20);
        var px = r.x + Math.cos(a) * rr, py = r.y + Math.sin(a) * rr;
        if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    });
    // 子弹
    ctx.fillStyle = '#ffe600';
    bullets.forEach(function (b) { ctx.fillRect(b.x - 2, b.y - 2, 4, 4); });
    // 飞船
    if (!over) {
      ctx.save();
      ctx.translate(ship.x, ship.y); ctx.rotate(ship.ang);
      ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-12, -10); ctx.lineTo(-7, 0); ctx.lineTo(-12, 10); ctx.closePath(); ctx.stroke();
      if (ship.thrust) {
        ctx.fillStyle = '#ff9e2d';
        ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-16, 0); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  Arcade.input.onKeys({
    left: function () { keys.left = true; }, right: function () { keys.right = true; },
    up: function () { keys.thrust = true; }, action: function () { keys.fire = true; }
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.thrust = false;
  });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  if (Arcade.input && Arcade.input.isTouch()) {
    var dpad = Arcade.input.createDPad(root, function (dir, pressed) {
      if (dir === 'left') keys.left = pressed;           // 按下持续转向、松开停止
      else if (dir === 'right') keys.right = pressed;
      else if (dir === 'up' && pressed) { keys.thrust = true; setTimeout(function () { keys.thrust = false; }, 160); }
      else if (dir === 'down' && pressed) { keys.fire = true; }
    });
    dpad.className += ' as-dpad';
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-d');
      setup(); render();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { setup(); render(); if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.asteroidf.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); render(); };

  function render() { scoreEl.textContent = score; livesEl.textContent = lives; msg.textContent = T('gs.asteroidf.help'); msg.style.color = ''; }

  setup(); render();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
