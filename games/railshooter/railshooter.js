/* 轨道射击 Rail Shooter —— 横向新游戏 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.railshooter.tut1t'), d: T('gs.railshooter.tut1') },
  { t: T('gs.railshooter.tut2t'), d: T('gs.railshooter.tut2') },
  { t: T('gs.railshooter.tut3t'), d: T('gs.railshooter.tut3') },
  { t: T('gs.railshooter.tut4t'), d: T('gs.railshooter.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 600, H = 360;
  var TARGETS = [
    { x: 80, y: 90, vx: 2, r: 20, type: 'enemy' },
    { x: W - 80, y: 130, vx: -2.4, r: 22, type: 'enemy' },
    { x: W / 2, y: 60, vx: 1.6, r: 18, type: 'enemy' },
    { x: 150, y: 200, vx: 3, r: 16, type: 'enemy' },
    { x: W - 150, y: 230, vx: -1.8, r: 24, type: 'enemy' },
    { x: W / 2, y: 250, vx: 2.6, r: 14, type: 'enemy' }
  ];
  var TIME = 90;

  var cursor, score, timeLeft, over, paused, loopApi, startTs, hitFlash;

  function setup() {
    cursor = { x: W / 2, y: H / 2 };
    score = 0; timeLeft = TIME; over = false;
    startTs = Date.now();
    hitFlash = 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'rs-wrap';
  wrap.innerHTML =
    '<canvas class="rs-canvas" id="rs-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="rs-top"><span>' + T('gs.railshooter.hudScore') + ' <b id="rs-score">0</b></span><span>' + T('gs.railshooter.hudTime') + ' <b id="rs-time">90</b>s</span></div>' +
    '<div class="rs-msg" id="rs-msg">' + T('gs.railshooter.help') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="rs-restart">' + T('gs.railshooter.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#rs-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#rs-score'), timeEl = wrap.querySelector('#rs-time'),
      msg = wrap.querySelector('#rs-msg'), restartBtn = wrap.querySelector('#rs-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.railshooter.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.railshooter.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function update() {
    if (over) return;
    timeLeft = Math.max(0, TIME - Math.floor((Date.now() - startTs) / 1000));
    if (timeLeft <= 0) {
      over = true;
      msg.textContent = T('gs.railshooter.timeUp').replace('{n}', score);
      msg.style.color = 'var(--neon-yellow)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
      return;
    }
    // 目标移动（镜像往返）
    TARGETS.forEach(function (t) {
      t.x += t.vx;
      if (t.x < t.r + 6 || t.x > W - t.r - 6) t.vx = -t.vx;
    });
    if (hitFlash > 0) hitFlash--;
    timeEl.textContent = timeLeft;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    // 背景星
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (var i = 0; i < 40; i++) ctx.fillRect((i * 83) % W, (i * 47) % H, 1.5, 1.5);
    // 目标
    TARGETS.forEach(function (t) {
      ctx.strokeStyle = '#ff2d95'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,45,149,0.2)';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r - 4, 0, 7); ctx.fill();
    });
    // 准星
    var c = cursor;
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x - 22, c.y); ctx.lineTo(c.x - 8, c.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x + 8, c.y); ctx.lineTo(c.x + 22, c.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x, c.y - 22); ctx.lineTo(c.x, c.y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x, c.y + 8); ctx.lineTo(c.x, c.y + 22); ctx.stroke();
    if (hitFlash > 0) {
      ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c.x, c.y, 24, 0, 7); ctx.stroke();
    }
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: cx * (W / rect.width), y: cy * (H / rect.height) };
  }
  function shoot(e) {
    if (over) return;
    var p = toCanvas(e);
    cursor.x = p.x; cursor.y = p.y;
    var hit = null, bestD = 1e9;
    TARGETS.forEach(function (t) {
      var d = Math.hypot(p.x - t.x, p.y - t.y);
      if (d < t.r + 8 && d < bestD) { bestD = d; hit = t; }
    });
    if (hit) {
      var center = bestD < hit.r * 0.4;
      score += center ? 15 : 10;
      hitFlash = 10;
      if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-yellow)', 8);
    } else {
      score = Math.max(0, score - 5);
      if (Arcade.audio) Arcade.audio.play('error');
    }
    scoreEl.textContent = score;
  }
  function moveCursor(e) {
    var p = toCanvas(e);
    cursor.x = p.x; cursor.y = p.y;
  }
  canvas.addEventListener('mousemove', moveCursor);
  canvas.addEventListener('mousedown', shoot);
  canvas.addEventListener('touchmove', function (e) { moveCursor(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchstart', function (e) { shoot(e); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') { shoot({ clientX: cursor.x * (canvas.getBoundingClientRect().width / W) + canvas.getBoundingClientRect().left, clientY: cursor.y * (canvas.getBoundingClientRect().height / H) + canvas.getBoundingClientRect().top }); e.preventDefault(); }
    if (e.code === 'KeyP') togglePause();
  });

  restartBtn.addEventListener('click', function () { setup(); scoreEl.textContent = '0'; timeEl.textContent = TIME; msg.textContent = T('gs.railshooter.help'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.railshooter.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); scoreEl.textContent = '0'; timeEl.textContent = TIME; msg.textContent = T('gs.railshooter.help'); msg.style.color = ''; };

  setup();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
