/* 恐龙快跑 Pixel Dino —— 批次B 经典街机 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.pixeldino.tut1t'), d: T('gs.pixeldino.tut1') },
  { t: T('gs.pixeldino.tut2t'), d: T('gs.pixeldino.tut2') },
  { t: T('gs.pixeldino.tut3t'), d: T('gs.pixeldino.tut3') },
  { t: T('gs.pixeldino.tut4t'), d: T('gs.pixeldino.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 640, H = 300;
  var GROUND_Y = 250;
  var GRAV = 0.55, JUMP_V = -13;
  var dino, obstacles, score, speed, over, paused, loopApi;

  function setup() {
    dino = { x: 70, y: GROUND_Y, vy: 0, w: 40, h: 44, onGround: true, jumps: 0 };
    obstacles = [];
    score = 0; speed = 6; over = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'dn-wrap';
  wrap.innerHTML =
    '<canvas class="dn-canvas" id="dn-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="dn-top"><span>' + T('gs.pixeldino.distance') + ' <span id="dn-score">0</span>m</span><span>' + T('gs.pixeldino.speed') + ' <span id="dn-speed">1x</span></span></div>' +
    '<div class="dn-msg" id="dn-msg">' + T('gs.pixeldino.help') + '</div>' +
    '<div class="game-controls"><button id="dn-restart" class="btn purple">' + T('gs.pixeldino.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#dn-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#dn-score'), speedEl = wrap.querySelector('#dn-speed'),
      msg = wrap.querySelector('#dn-msg'), restartBtn = wrap.querySelector('#dn-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.pixeldino.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.pixeldino.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function jump() {
    if (over) return;
    if (dino.onGround) {
      dino.vy = JUMP_V; dino.onGround = false; dino.jumps = 1;
      if (Arcade.juice) Arcade.juice.move();
    } else if (dino.jumps === 1) {
      dino.vy = JUMP_V * 0.85; dino.jumps = 2;
      if (Arcade.juice) Arcade.juice.rotate();
    }
  }

  function update() {
    if (over) return;
    // 生成障碍（最小间距 ≥300px：保证相邻障碍间隔大于一次跳跃距离，防高速连续不可规避组合）
    var canSpawn = true;
    for (var oi = 0; oi < obstacles.length; oi++) {
      if (obstacles[oi].x > W + 20 - 300) { canSpawn = false; break; }
    }
    if (canSpawn && Math.random() < 0.018) {
      var t = Math.random();
      if (t < 0.55) obstacles.push({ x: W + 20, y: GROUND_Y - 30, w: 26, h: 30, kind: 'cactus' });
      else if (t < 0.8) obstacles.push({ x: W + 20, y: GROUND_Y - 44, w: 34, h: 44, kind: 'cactusBig' });
      else obstacles.push({ x: W + 20, y: GROUND_Y - 62, w: 34, h: 62, kind: 'tall' });
    }
    // 移动
    speed = Math.min(13, 6 + score * 0.008);
    obstacles.forEach(function (o) { o.x -= speed; });
    obstacles = obstacles.filter(function (o) { return o.x > -60; });
    // 恐龙物理
    if (!dino.onGround) {
      dino.vy += GRAV;
      dino.y += dino.vy;
      if (dino.y >= GROUND_Y) { dino.y = GROUND_Y; dino.onGround = true; dino.jumps = 0; }
    }
    // 碰撞（略宽容）
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (dino.x + dino.w - 8 > o.x && dino.x + 8 < o.x + o.w && dino.y + dino.h - 4 > o.y) {
        over = true;
        msg.textContent = T('gs.pixeldino.dead').replace('{n}', Math.round(score));
        msg.style.color = 'var(--neon-pink)';
        if (Arcade.juice) Arcade.juice.lose();
        if (Arcade.shell) Arcade.shell.submitScore(Math.round(score));
        return;
      }
    }
    // 计分
    score += speed * 0.06;
    scoreEl.textContent = Math.round(score);
    speedEl.textContent = (speed / 6).toFixed(1) + 'x';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, W, H);
    // 地面
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
    // 障碍
    obstacles.forEach(function (o) {
      if (o.kind === 'cactus') {
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(o.x + 8, o.y, 10, o.h);
        ctx.fillRect(o.x, o.y + 12, 8, 18);
        ctx.fillRect(o.x + 18, o.y + 16, 8, 14);
      } else if (o.kind === 'cactusBig') {
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(o.x + 12, o.y, 12, o.h);
        ctx.fillRect(o.x, o.y + 14, 10, 22);
        ctx.fillRect(o.x + 24, o.y + 20, 10, 16);
      } else {
        ctx.fillStyle = '#b967ff';
        ctx.fillRect(o.x + 6, o.y, 20, o.h);
      }
    });
    // 恐龙
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(dino.x + 6, dino.y + 8, 5, 5);
    ctx.fillRect(dino.x + 20, dino.y + 8, 5, 5);
    ctx.fillStyle = '#00f0ff';
    if (!dino.onGround) { // 跳跃时腿收起
      ctx.fillRect(dino.x, dino.y + dino.h - 6, 14, 6);
      ctx.fillRect(dino.x + 26, dino.y + dino.h - 6, 14, 6);
    } else {
      ctx.fillRect(dino.x, dino.y + dino.h - 4, 10, 4);
      ctx.fillRect(dino.x + 30, dino.y + dino.h - 4, 10, 4);
    }
    // 尾巴
    ctx.fillRect(dino.x - 8, dino.y + 20, 8, 5);
  }

  Arcade.input.onKeys({ up: jump, action: jump });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });
  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); jump(); });

  restartBtn.addEventListener('click', function () { setup(); scoreEl.textContent = '0'; speedEl.textContent = '1x'; msg.textContent = T('gs.pixeldino.help'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { setup(); scoreEl.textContent = '0'; speedEl.textContent = '1x'; msg.textContent = T('gs.pixeldino.help'); msg.style.color = ''; };

  setup();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
