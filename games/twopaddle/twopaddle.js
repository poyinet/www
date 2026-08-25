/* 乒乓球 Two-Paddle vs AI —— 批次B 经典街机 */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.twopaddle.tut1t'), d: T('gs.twopaddle.tut1') },
  { t: T('gs.twopaddle.tut2t'), d: T('gs.twopaddle.tut2') },
  { t: T('gs.twopaddle.tut3t'), d: T('gs.twopaddle.tut3') },
  { t: T('gs.twopaddle.tut4t'), d: T('gs.twopaddle.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 640, H = 400, PW = 10, PH = 72, WIN = 7;
  var DIFFS = {
    easy:   { speed: 3.2, react: 0.5, err: 0.35 },
    normal: { speed: 4.2, react: 0.75, err: 0.15 },
    hard:   { speed: 5.2, react: 0.92, err: 0.03 }
  };
  var difficulty = 'normal';
  var lp, rp, ball, ls, rs, over, paused, loopApi, keys;

  function reset() {
    lp = { x: 18, y: H / 2 - PH / 2 };
    rp = { x: W - 28, y: H / 2 - PH / 2 };
    serve();
    ls = 0; rs = 0; over = false; paused = false;
  }
  function serve() {
    ball = { x: W / 2, y: H / 2, vx: (Math.random() < 0.5 ? -1 : 1) * 4, vy: (Math.random() * 2 - 1) * 3 };
  }

  var wrap = document.createElement('div');
  wrap.className = 'pg-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="pg-diff">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.twopaddle.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.twopaddle.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.twopaddle.dHard') + '</button>' +
    '</div>' +
    '<canvas class="pg-canvas" id="pg-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="pg-top"><span class="l">' + T('gs.twopaddle.you') + ' <span id="pg-ls">0</span></span><span class="r"><span id="pg-rs">0</span> AI</span></div>' +
    '<div class="pg-msg" id="pg-msg">' + T('gs.twopaddle.hint').replace('{n}', WIN) + '</div>' +
    '<div class="game-controls"><button id="pg-restart" class="btn purple">' + T('gs.twopaddle.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#pg-canvas'), ctx = canvas.getContext('2d'),
      lsEl = wrap.querySelector('#pg-ls'), rsEl = wrap.querySelector('#pg-rs'),
      msg = wrap.querySelector('#pg-msg'), restartBtn = wrap.querySelector('#pg-restart'),
      diffRow = wrap.querySelector('#pg-diff');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  keys = { up: false, down: false };

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.twopaddle.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.twopaddle.hint').replace('{n}', WIN); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function update() {
    if (over) return;
    if (keys.up) lp.y -= 6;
    if (keys.down) lp.y += 6;
    lp.y = Math.max(0, Math.min(H - PH, lp.y));
    // AI：追踪球，带反应延迟和误差
    var d = DIFFS[difficulty];
    var targetY = ball.y - PH / 2 + (Math.random() * 2 - 1) * PH * d.err;
    if (Math.random() < d.react) {
      if (rp.y + PH / 2 < targetY) rp.y += 4.5;
      else if (rp.y + PH / 2 > targetY) rp.y -= 4.5;
    }
    rp.y = Math.max(0, Math.min(H - PH, rp.y));

    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y < 8) { ball.y = 8; ball.vy = Math.abs(ball.vy); }
    if (ball.y > H - 8) { ball.y = H - 8; ball.vy = -Math.abs(ball.vy); }
    // 左拍（玩家）
    if (ball.vx < 0 && ball.x - 8 < lp.x + PW && ball.x > lp.x && ball.y > lp.y && ball.y < lp.y + PH) {
      ball.vx = Math.abs(ball.vx) + 0.3;
      ball.vy = ((ball.y - (lp.y + PH / 2)) / (PH / 2)) * 5;
      if (Arcade.juice) Arcade.juice.move();
    }
    // 右拍（AI）
    if (ball.vx > 0 && ball.x + 8 > rp.x && ball.x < rp.x + PW && ball.y > rp.y && ball.y < rp.y + PH) {
      ball.vx = -(Math.abs(ball.vx) + 0.3);
      ball.vy = ((ball.y - (rp.y + PH / 2)) / (PH / 2)) * 5;
      if (Arcade.juice) Arcade.juice.move();
    }
    if (ball.x < -12) { rs++; rsEl.textContent = rs; checkWin('AI'); serve(); }
    if (ball.x > W + 12) { ls++; lsEl.textContent = ls; checkWin('你'); serve(); }
  }

  function checkWin(who) {
    if (ls >= WIN || rs >= WIN) {
      over = true;
      msg.textContent = (who === '你' ? T('gs.twopaddle.win') : T('gs.twopaddle.lose')) + ' ' + ls + ' : ' + rs;
      msg.style.color = who === '你' ? 'var(--neon-green)' : 'var(--neon-pink)';
      if (who === '你') { if (Arcade.juice) Arcade.juice.win(); if (Arcade.shell) Arcade.shell.submitScore(ls); }
      else { if (Arcade.juice) Arcade.juice.lose(); }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#07070f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(lp.x, lp.y, PW, PH);
    ctx.fillStyle = '#ff2d95'; ctx.fillRect(rp.x, rp.y, PW, PH);
    ctx.fillStyle = '#ffe600'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, 7); ctx.fill();
  }

  Arcade.input.onKeys({
    up: function () { keys.up = true; }, down: function () { keys.down = true; }
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
  });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  if (Arcade.input && Arcade.input.isTouch()) {
    var dpad = Arcade.input.createDPad(root, function (dir, pressed) {
      if (dir === 'up') keys.up = pressed;   // 按住持续上移、松开停止
      else if (dir === 'down') keys.down = pressed;
    });
    dpad.className += ' pg-dpad';
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-d');
      reset(); render();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { reset(); render(); if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.twopaddle.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); render(); };

  function render() { lsEl.textContent = ls; rsEl.textContent = rs; }

  reset(); render();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
