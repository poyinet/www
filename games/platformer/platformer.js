/* 平台跳跃 Platformer —— Phase3 通用高质量（Canvas 横版） */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.platformer.tut1t'), d: T('gs.platformer.tut1') },
  { t: T('gs.platformer.tut2t'), d: T('gs.platformer.tut2') },
  { t: T('gs.platformer.tut3t'), d: T('gs.platformer.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 720, H = 320;
  var GRAV = 0.6, JUMP = -10.5, SPEED = 3.2;
  var LEVEL_W = 2400;

  var player, platforms, coins, spikes, goal, cam, score, won, dead, keys;

  function build() {
    player = { x: 40, y: H - 80, w: 22, h: 30, vy: 0, onGround: false };
    platforms = [
      { x: 0, y: H - 40, w: 360, h: 40 },
      { x: 440, y: H - 90, w: 140, h: 16 },
      { x: 640, y: H - 150, w: 140, h: 16 },
      { x: 860, y: H - 100, w: 120, h: 16 },
      { x: 1040, y: H - 170, w: 160, h: 16 },
      { x: 1280, y: H - 120, w: 140, h: 16 },
      { x: 1480, y: H - 200, w: 140, h: 16 },
      { x: 1700, y: H - 130, w: 160, h: 16 },
      { x: 1940, y: H - 90, w: 200, h: 16 },
      { x: 2180, y: H - 40, w: LEVEL_W - 2180, h: 40 }
    ];
    coins = [
      { x: 500, y: H - 120 }, { x: 690, y: H - 180 }, { x: 900, y: H - 130 },
      { x: 1100, y: H - 200 }, { x: 1340, y: H - 150 }, { x: 1540, y: H - 230 },
      { x: 1760, y: H - 160 }, { x: 2020, y: H - 120 }, { x: 2300, y: H - 70 }
    ].map(function (c) { return { x: c.x, y: c.y, r: 9, got: false }; });
    spikes = [
      { x: 240, y: H - 54 },        // 起始地面上的尖刺
      { x: 1100, y: H - 184 },      // 中段平台顶部的尖刺（平台顶在 H-170）
      { x: 2300, y: H - 54 }        // 终点前最后地面上的尖刺
    ].map(function (s) { return { x: s.x, y: s.y, w: 40, h: 14 }; });
    goal = { x: LEVEL_W - 70, y: H - 90, w: 14, h: 50 };
    cam = 0; score = 0; won = false; dead = false; keys = { left: false, right: false, jump: false };
  }

  build(); // 需在 wrap.innerHTML 使用 coins.length 之前初始化

  var wrap = document.createElement('div');
  wrap.className = 'pf-wrap';
  wrap.innerHTML =
    '<canvas class="pf-canvas" id="pf-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="pf-top"><span>' + T('gs.platformer.coinsFmt').replace('{a}', '<span id="pf-score">0</span>').replace('{b}', coins.length) + '</span><span>' + T('gs.platformer.moveHint') + '</span></div>' +
    '<div class="pf-msg" id="pf-msg">' + T('gs.platformer.hint') + '</div>' +
    '<div class="game-controls"><button id="pf-restart" class="btn purple">' + T('gs.platformer.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#pf-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#pf-score'), msg = wrap.querySelector('#pf-msg'),
      restartBtn = wrap.querySelector('#pf-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var paused = false, loopApi = null;

  function togglePause() {
    if (won || dead) return;
    paused = !paused;
    if (paused) {
      msg.textContent = T('gs.platformer.paused');
      msg.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      msg.textContent = T('gs.platformer.hint');
      msg.style.color = 'var(--neon-green)';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update() {
    if (won || dead) return;
    var dx = (keys.right ? SPEED : 0) - (keys.left ? SPEED : 0);
    player.x += dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > LEVEL_W) player.x = LEVEL_W - player.w;
    player.vy += GRAV;
    player.y += player.vy;
    // 平台碰撞
    player.onGround = false;
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (aabb(player, p)) {
        if (player.vy > 0 && player.y + player.h - player.vy <= p.y + 1) {
          player.y = p.y - player.h; player.vy = 0; player.onGround = true;
        } else if (player.vy < 0 && player.y - player.vy >= p.y + p.h - 1) {
          player.y = p.y + p.h; player.vy = 0;
        }
      }
    }
    if (keys.jump && player.onGround) { player.vy = JUMP; player.onGround = false; if (Arcade.juice) Arcade.juice.move(); }
    // 金币
    for (var c = 0; c < coins.length; c++) {
      var co = coins[c];
      if (!co.got && Math.abs(player.x + player.w / 2 - co.x) < 18 && Math.abs(player.y + player.h / 2 - co.y) < 18) {
        co.got = true; score++; scoreEl.textContent = score; if (Arcade.juice) Arcade.juice.coin(co.x - cam, co.y, 'var(--neon-yellow)');
      }
    }
    // 尖刺
    for (var s = 0; s < spikes.length; s++) if (aabb(player, spikes[s])) die(true);
    // 掉出
    if (player.y > H + 60) die();
    // 终点
    if (aabb(player, goal)) {
      won = true; msg.textContent = T('gs.platformer.winFmt').replace('{n}', score);
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
    }
    // 镜头
    cam = Math.max(0, Math.min(player.x - 260, LEVEL_W - W));
  }

  function die(bySpike) {
    dead = true;
    // 区分死因（修复：撞尖刺也显示「摔了」）
    msg.textContent = bySpike ? T('gs.platformer.spike') : T('gs.platformer.fall');
    msg.style.color = 'var(--neon-pink)';
    if (Arcade.juice) Arcade.juice.lose();
    setTimeout(function () { build(); syncScoreHud(); msg.textContent = T('gs.platformer.hint'); msg.style.color = 'var(--neon-green)'; }, 700);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#120a26'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-cam, 0);
    ctx.fillStyle = 'rgba(185,103,255,0.7)';
    platforms.forEach(function (p) { ctx.fillRect(p.x, p.y, p.w, p.h); });
    ctx.fillStyle = '#ff2d95';
    spikes.forEach(function (s) { ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.x + s.w / 2, s.y); ctx.lineTo(s.x + s.w, s.y + s.h); ctx.fill(); });
    ctx.fillStyle = '#ffe600';
    coins.forEach(function (c) { if (!c.got) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill(); } });
    ctx.fillStyle = '#39ff14'; ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();
  }

  Arcade.input.onKeys({ left: function () { keys.left = true; }, right: function () { keys.right = true; },
    up: function () { keys.jump = true; }, action: function () { keys.jump = true; },
    any: function () {} });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW' || e.code === 'Enter') keys.jump = false; // Enter 也清，防粘滞
  });
  canvas.addEventListener('mousedown', function () { keys.jump = true; });
  window.addEventListener('mouseup', function () { keys.jump = false; });
  canvas.addEventListener('touchstart', function (e) { keys.jump = true; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', function () { keys.jump = false; });

  // 触屏虚拟方向键（仅移动端显示）
  if (Arcade.input && Arcade.input.isTouch()) {
    var dpad = Arcade.input.createDPad(root, function (dir, pressed) {
      if (dir === 'left') keys.left = pressed;
      else if (dir === 'right') keys.right = pressed;
      else if (dir === 'up' && pressed) { keys.jump = true; setTimeout(function () { keys.jump = false; }, 150); }
    });
    dpad.classList.add('pf-dpad');
  }

  function syncScoreHud() { if (scoreEl) scoreEl.textContent = score; }

  restartBtn.addEventListener('click', function () { build(); syncScoreHud(); msg.textContent = T('gs.platformer.hint'); msg.style.color = 'var(--neon-green)'; if (Arcade.audio) Arcade.audio.play('ui'); });

  build();
  syncScoreHud();
  loopApi = Arcade.loop.start(update, draw, 16);
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.platformer.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { build(); syncScoreHud(); msg.textContent = T('gs.platformer.hint'); msg.style.color = 'var(--neon-green)'; };

})();
