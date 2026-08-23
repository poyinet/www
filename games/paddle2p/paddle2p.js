/* 双人弹球对决 Two-Paddle Duel —— Phase3 通用高质量（本地双人） */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.paddle2p.tut1t'), d: T('gs.paddle2p.tut1') },
  { t: T('gs.paddle2p.tut2t'), d: T('gs.paddle2p.tut2') },
  { t: T('gs.paddle2p.tut3t'), d: T('gs.paddle2p.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 720, H = 420, PW = 10, PH = 72, WIN = 7;

  var lp, rp, ball, ls, rs, over, keys;

  function reset() {
    lp = { x: 20, y: H / 2 - PH / 2 }; rp = { x: W - 30, y: H / 2 - PH / 2 };
    ball = { x: W / 2, y: H / 2, vx: (Math.random() < 0.5 ? -1 : 1) * 4, vy: (Math.random() * 2 - 1) * 3 };
    ls = 0; rs = 0; over = false; keys = {};
  }

  var wrap = document.createElement('div');
  wrap.className = 'tp-wrap';
  wrap.innerHTML =
    '<canvas class="tp-canvas" id="tp-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="tp-top"><span class="l">' + T('gs.paddle2p.left') + ' W/S : <span id="tp-ls">0</span></span><span class="r"><span id="tp-rs">0</span> : ↑/↓ ' + T('gs.paddle2p.right') + '</span></div>' +
    '<div class="tp-msg" id="tp-msg">' + T('gs.paddle2p.hint').replace('{n}', WIN) + '</div>' +
    '<div class="game-controls"><button id="tp-restart" class="btn purple">' + T('gs.paddle2p.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#tp-canvas'), ctx = canvas.getContext('2d'),
      lsEl = wrap.querySelector('#tp-ls'), rsEl = wrap.querySelector('#tp-rs'),
      msg = wrap.querySelector('#tp-msg'), restartBtn = wrap.querySelector('#tp-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var paused = false, loopApi = null;

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) {
      msg.textContent = T('gs.paddle2p.paused');
      msg.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      msg.textContent = T('gs.paddle2p.hint').replace('{n}', WIN);
      msg.style.color = 'var(--neon-green)';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function update() {
    if (over) return;
    if (keys['KeyW']) lp.y -= 6; if (keys['KeyS']) lp.y += 6;
    if (keys['ArrowUp']) rp.y -= 6; if (keys['ArrowDown']) rp.y += 6;
    lp.y = Math.max(0, Math.min(H - PH, lp.y)); rp.y = Math.max(0, Math.min(H - PH, rp.y));
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y < 8) { ball.y = 8; ball.vy = -ball.vy; }
    if (ball.y > H - 8) { ball.y = H - 8; ball.vy = -ball.vy; }
    // 左拍
    if (ball.vx < 0 && ball.x - 8 < lp.x + PW && ball.x > lp.x && ball.y > lp.y && ball.y < lp.y + PH) {
      ball.vx = Math.abs(ball.vx) + 0.3; ball.vy = ((ball.y - (lp.y + PH / 2)) / (PH / 2)) * 5; if (Arcade.juice) Arcade.juice.move();
    }
    // 右拍
    if (ball.vx > 0 && ball.x + 8 > rp.x && ball.x < rp.x + PW && ball.y > rp.y && ball.y < rp.y + PH) {
      ball.vx = -(Math.abs(ball.vx) + 0.3); ball.vy = ((ball.y - (rp.y + PH / 2)) / (PH / 2)) * 5; if (Arcade.juice) Arcade.juice.move();
    }
    if (ball.x < -10) { rs++; rsEl.textContent = rs; serve(1); checkWin('R'); }
    if (ball.x > W + 10) { ls++; lsEl.textContent = ls; serve(-1); checkWin('L'); }
  }

  function serve(dir) {
    ball.x = W / 2; ball.y = H / 2; ball.vx = dir * 4; ball.vy = (Math.random() * 2 - 1) * 3;
  }
  function checkWin(who) {
    if (ls >= WIN || rs >= WIN) {
      /* 内部状态值用 L/R（A5：中文不进逻辑比较），展示走译键 */
      over = true; msg.textContent = T('gs.paddle2p.win').replace('{p}', who === 'L' ? T('gs.paddle2p.left') : T('gs.paddle2p.right')).replace('{s}', ls + ' : ' + rs);
      msg.style.color = 'var(--neon-yellow)'; if (Arcade.juice) Arcade.juice.win();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#07070f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(lp.x, lp.y, PW, PH);
    ctx.fillStyle = '#ff2d95'; ctx.fillRect(rp.x, rp.y, PW, PH);
    ctx.fillStyle = '#ffe600'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, 7); ctx.fill();
  }

  window.addEventListener('keydown', function (e) { keys[e.code] = true; if (e.code === 'KeyP') togglePause(); });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  // 触屏：左右各一个上下 DPad（左侧控制左拍，右侧控制右拍）
  if (Arcade.input && Arcade.input.isTouch()) {
    function makePad(keyUp, keyDown, cls) {
      var pad = Arcade.input.createDPad(root, function (dir, pressed) {
        if (dir === 'up') keys[keyUp] = pressed;     // 按住持续移动、松开停止
        else if (dir === 'down') keys[keyDown] = pressed;
      });
      pad.classList.add('tp-dpad', cls);
      pad.querySelectorAll('.dpad-btn').forEach(function (b) {
        if (b.getAttribute('aria-label') === 'left' || b.getAttribute('aria-label') === 'right') b.style.visibility = 'hidden';
      });
    }
    makePad('KeyW', 'KeyS', 'left');
    makePad('ArrowUp', 'ArrowDown', 'right');
  }

  restartBtn.addEventListener('click', function () { reset(); lsEl.textContent = '0'; rsEl.textContent = '0'; msg.textContent = T('gs.paddle2p.hint').replace('{n}', WIN); msg.style.color = 'var(--neon-green)'; if (Arcade.audio) Arcade.audio.play('ui'); });

  reset();
  loopApi = Arcade.loop.start(update, draw, 16);
  window.GAME_RESTART = function () { reset(); lsEl.textContent = '0'; rsEl.textContent = '0'; msg.textContent = T('gs.paddle2p.hint').replace('{n}', WIN); msg.style.color = 'var(--neon-green)'; };

})();
