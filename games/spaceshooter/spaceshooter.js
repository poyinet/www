/* 太空射击 Space Shooter —— Phase3 通用高质量（Canvas） */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.spaceshooter.tut1t'), d: T('gs.spaceshooter.tut1') },
  { t: T('gs.spaceshooter.tut2t'), d: T('gs.spaceshooter.tut2') },
  { t: T('gs.spaceshooter.tut3t'), d: T('gs.spaceshooter.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 520, H = 600;
  var player, bullets, enemies, enemyDir, score, lives, over, cool, wave, keys;

  function spawnWave(n) {
    enemies = [];
    var cols = 7, ew = 34, eh = 24, gap = 14;
    var totalW = cols * ew + (cols - 1) * gap;
    var startX = (W - totalW) / 2;
    for (var r = 0; r < n; r++) for (var c = 0; c < cols; c++) {
      enemies.push({ x: startX + c * (ew + gap), y: 50 + r * (eh + 18), w: ew, h: eh, alive: true });
    }
    enemyDir = 1;
  }

  function reset() {
    player = { x: W / 2 - 17, y: H - 50, w: 34, h: 20, speed: 4.5 };
    bullets = []; enemies = []; score = 0; lives = 3; over = false; cool = 0; wave = 1; keys = { left: false, right: false, fire: false };
    spawnWave(3);
  }

  var wrap = document.createElement('div');
  wrap.className = 'ss-wrap';
  wrap.innerHTML =
    '<canvas class="ss-canvas" id="ss-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="ss-top"><span>' + T('gs.spaceshooter.killsFmt').replace('{n}', '<span id="ss-score">0</span>') + '</span><span>' + T('gs.spaceshooter.statusFmt').replace('{a}', '<span id="ss-lives">3</span>').replace('{b}', '<span id="ss-wave">1</span>') + '</span></div>' +
    '<div class="ss-msg" id="ss-msg">' + T('gs.spaceshooter.hint') + '</div>' +
    '<div class="game-controls"><button id="ss-restart" class="btn purple">' + T('gs.spaceshooter.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#ss-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#ss-score'), livesEl = wrap.querySelector('#ss-lives'),
      waveEl = wrap.querySelector('#ss-wave'), msg = wrap.querySelector('#ss-msg'),
      restartBtn = wrap.querySelector('#ss-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var paused = false, loopApi = null;

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) {
      msg.textContent = T('gs.spaceshooter.paused');
      msg.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      msg.textContent = T('gs.spaceshooter.hint');
      msg.style.color = '';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function descend() {
    enemies.forEach(function (e) { if (e.alive) e.y += 14; });
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function update() {
    if (over) return;
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;
    if (keys.fire && cool <= 0) { bullets.push({ x: player.x + player.w / 2, y: player.y }); cool = 10; if (Arcade.juice) Arcade.juice.select(); }
    if (cool > 0) cool--;
    for (var b = bullets.length - 1; b >= 0; b--) {
      bullets[b].y -= 8;
      if (bullets[b].y < -10) bullets.splice(b, 1);
    }
    // 敌人移动（撞边则整体下移一格）
    var minX = 1e9, maxX = -1e9;
    enemies.forEach(function (e) { if (e.alive) { minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x + e.w); } });
    if (minX <= 10 && enemyDir === -1) { enemyDir = 1; descend(); }
    else if (maxX >= W - 10 && enemyDir === 1) { enemyDir = -1; descend(); }
    var speed = 0.5 + wave * 0.25;
    enemies.forEach(function (e) { if (e.alive) { e.x += enemyDir * speed; } });
    // 子弹命中
    for (var i = bullets.length - 1; i >= 0; i--) {
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e.alive && bullets[i].x > e.x && bullets[i].x < e.x + e.w && bullets[i].y > e.y && bullets[i].y < e.y + e.h) {
          e.alive = false; bullets.splice(i, 1); score++; scoreEl.textContent = score;
          if (Arcade.juice) Arcade.juice.clear(e.x + e.w / 2, e.y + e.h / 2, 'var(--neon-cyan)', 10);
          break;
        }
      }
    }
    // 敌人到底线
    enemies.forEach(function (e) {
      if (over) return;
      if (e.alive && e.y + e.h >= player.y) {
        e.alive = false; lives--; livesEl.textContent = lives;
        if (Arcade.juice) Arcade.juice.lose();
        if (lives <= 0) gameOver();
      }
    });
    if (!over && enemies.every(function (e) { return !e.alive; })) {
      wave++; waveEl.textContent = wave; spawnWave(Math.min(3 + Math.floor(wave / 2), 5));
      msg.textContent = T('gs.spaceshooter.waveFmt').replace('{n}', wave); if (Arcade.audio) Arcade.audio.play('ui');
    }
  }

  function gameOver() {
    over = true; msg.textContent = T('gs.spaceshooter.loseFmt').replace('{n}', score);
    if (Arcade.juice) Arcade.juice.lose();
    if (Arcade.shell) Arcade.shell.submitScore(score);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = '#ffe600';
    bullets.forEach(function (b) { ctx.fillRect(b.x - 2, b.y - 8, 4, 8); });
    enemies.forEach(function (e) { if (e.alive) { ctx.fillStyle = '#ff2d95'; ctx.fillRect(e.x, e.y, e.w, e.h); } });
  }

  Arcade.input.onKeys({ left: function () { keys.left = true; }, right: function () { keys.right = true; }, action: function () { keys.fire = true; }, up: function () { keys.fire = true; } });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.fire = false;
  });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });
  canvas.addEventListener('pointerdown', function (e) {
    var rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (W / rect.width);
    if (x < W / 2) { keys.left = true; } else { keys.right = true; }
    keys.fire = true;
  });
  canvas.addEventListener('pointerup', function () { keys.left = keys.right = keys.fire = false; });

  restartBtn.addEventListener('click', function () { reset(); scoreEl.textContent = '0'; livesEl.textContent = '3'; waveEl.textContent = '1'; msg.textContent = T('gs.spaceshooter.hint'); if (Arcade.audio) Arcade.audio.play('ui'); });

  reset();
  loopApi = Arcade.loop.start(update, draw, 16);
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.spaceshooter.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); scoreEl.textContent = '0'; livesEl.textContent = '3'; waveEl.textContent = '1'; msg.textContent = T('gs.spaceshooter.hint'); msg.style.color = ''; };

})();
