/* 切绳救星 Rope Rescue —— 横向新游戏 物理类 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.roperescue.tut1t'), d: T('gs.roperescue.tut1') },
  { t: T('gs.roperescue.tut2t'), d: T('gs.roperescue.tut2') },
  { t: T('gs.roperescue.tut3t'), d: T('gs.roperescue.tut3') },
  { t: T('gs.roperescue.tut4t'), d: T('gs.roperescue.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 540, H = 420;
  var GRAV = 0.35;

  var candies, mouth, cuts, score, level, over, paused, loopApi, swipeStart, swipeEnd;

  function spawnCandy(x, y, anchorX, anchorY) {
    return {
      x: x, y: y, vx: 0, vy: 0,
      ax: anchorX, ay: anchorY,
      attached: true, eaten: false, cut: 0, swing: 0
    };
  }

  function setup() {
    paused = false; // 重开/重试后解除暂停，否则循环保持挂起
    candies = [];
    var lv = level;
    if (lv === 1) {
      candies.push(spawnCandy(W * 0.3, 120, W * 0.3, 40));
      candies.push(spawnCandy(W * 0.7, 100, W * 0.7, 30));
    } else if (lv === 2) {
      candies.push(spawnCandy(W * 0.25, 140, W * 0.15, 40));
      candies.push(spawnCandy(W * 0.55, 120, W * 0.65, 30));
      candies.push(spawnCandy(W * 0.8, 150, W * 0.9, 50));
    } else {
      candies.push(spawnCandy(W * 0.2, 130, W * 0.35, 35));
      candies.push(spawnCandy(W * 0.5, 110, W * 0.4, 25));
      candies.push(spawnCandy(W * 0.75, 160, W * 0.85, 45));
    }
    mouth = { x: W / 2, y: H - 24, r: 26, eatT: 0 };
    cuts = 0;
    over = false;
    score = 0; /* E2E 评审修复：score 未初始化导致终局 NaN 并污染最高分 */
    swipeStart = null; swipeEnd = null;
  }

  var wrap = document.createElement('div');
  wrap.className = 'cr-wrap';
  wrap.innerHTML =
    '<canvas class="cr-canvas" id="cr-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="cr-top"><span>' + T('gs.roperescue.hudLevel').replace('{n}', '<b id="cr-level">1</b>') + '</span><span>' + T('gs.roperescue.hudEaten') + ' <b id="cr-score">0</b></span></div>' +
    '<div class="cr-msg" id="cr-msg">' + T('gs.roperescue.help') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="cr-restart">' + T('gs.roperescue.retry') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#cr-canvas'), ctx = canvas.getContext('2d'),
      levelEl = wrap.querySelector('#cr-level'), scoreEl = wrap.querySelector('#cr-score'),
      msg = wrap.querySelector('#cr-msg'), restartBtn = wrap.querySelector('#cr-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.roperescue.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.roperescue.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function lineCross(a1, a2, b1, b2) {
    function side(p1, p2, p) { return (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x); }
    var d1 = side(a1, a2, b1), d2 = side(a1, a2, b2);
    var d3 = side(b1, b2, a1), d4 = side(b1, b2, a2);
    return d1 * d2 <= 0 && d3 * d4 <= 0;
  }

  function update() {
    if (over) return;
    // 糖果摆锤物理
    candies.forEach(function (c) {
      if (c.eaten) return;
      if (c.attached) {
        // 摆锤：绳长固定，用摆角近似
        var len = Math.hypot(c.ax - c.x, c.ay - c.y) || 1;
        var ang = Math.atan2(c.y - c.ay, c.x - c.ax);
        // 重力矩
        c.swing += (-9.8 / Math.max(len, 40)) * Math.sin(ang) * 6;
        c.swing *= 0.995;
        if (c.swing > 2.5) c.swing = 2.5; else if (c.swing < -2.5) c.swing = -2.5; // 限幅，防陀螺越摆越快
        ang += c.swing * 0.03;
        c.x = c.ax + Math.cos(ang) * len;
        c.y = c.ay + Math.sin(ang) * len;
      } else {
        c.vy += GRAV;
        c.x += c.vx;
        c.y += c.vy;
        // 撞墙反弹简化
        if (c.x < 12) { c.x = 12; c.vx = Math.abs(c.vx) * 0.6; }
        if (c.x > W - 12) { c.x = W - 12; c.vx = -Math.abs(c.vx) * 0.6; }
        if (c.y > H - 40 && c.vy > 0) { c.vy *= -0.5; c.y = H - 40; }
      }
      // 检查进嘴
      if (Math.hypot(c.x - mouth.x, c.y - mouth.y) < mouth.r + 10) {
        if (!c.eaten && !c.attached) {
          c.eaten = true;
          score++;
          mouth.eatT = 12;
          if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-pink)');
          checkProgress();
        }
      }
    });
    if (mouth.eatT > 0) mouth.eatT--;
    // HUD 显示本关进度（每关糖果数不同：1 关 2 颗、2/3 关 3 颗），总分仅在终局结算
    var eatenNow = candies.filter(function (c) { return c.eaten; }).length;
    scoreEl.textContent = eatenNow + ' / ' + candies.length;
  }

  function checkProgress() {
    var eaten = candies.filter(function (c) { return c.eaten; }).length;
    if (eaten === candies.length) {
      over = true;
      if (level >= 3) {
        msg.textContent = T('gs.roperescue.allDone').replace('{n}', score);
        msg.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(score);
      } else {
        msg.textContent = T('gs.roperescue.levelDone').replace('{n}', level);
        msg.style.color = 'var(--neon-yellow)';
        restartBtn.textContent = T('gs.roperescue.nextLevel');
        if (Arcade.juice) Arcade.juice.win();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1626'; ctx.fillRect(0, 0, W, H);
    // 顶部横梁
    ctx.fillStyle = '#3a4a6a'; ctx.fillRect(0, 0, W, 8);
    // 绳子
    candies.forEach(function (c) {
      if (c.eaten) return;
      if (c.attached) {
        ctx.strokeStyle = '#d8d8e8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c.ax, c.ay); ctx.lineTo(c.x, c.y); ctx.stroke();
      }
    });
    // 切割线
    if (swipeStart && swipeEnd) {
      ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(swipeStart.x, swipeStart.y); ctx.lineTo(swipeEnd.x, swipeEnd.y); ctx.stroke();
    }
    // 小嘴
    var m = mouth;
    ctx.fillStyle = '#ff5c74';
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff2d95';
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.6, 0, 7); ctx.fill();
    // 糖果
    candies.forEach(function (c) {
      if (c.eaten) return;
      ctx.fillStyle = '#ff9e2d';
      ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe600';
      ctx.beginPath(); ctx.arc(c.x - 4, c.y - 4, 3, 0, 7); ctx.fill();
    });
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    // touchend 时 touches 为空，须取 changedTouches[0]（修复移动端切割崩溃）
    var t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]) || e;
    var cx = t.clientX - rect.left;
    var cy = t.clientY - rect.top;
    return { x: cx * (W / rect.width), y: cy * (H / rect.height) };
  }
  function down(e) { swipeStart = toCanvas(e); swipeEnd = swipeStart; e.preventDefault(); }
  function move(e) { if (swipeStart) { swipeEnd = toCanvas(e); e.preventDefault(); } }
  function up(e) {
    if (!swipeStart) return;
    swipeEnd = toCanvas(e);
    // 切割：穿过绳子的线
    candies.forEach(function (c) {
      if (c.attached && !c.eaten) {
        if (lineCross(swipeStart, swipeEnd, { x: c.ax, y: c.ay }, { x: c.x, y: c.y })) {
          c.attached = false;
          // 切向初速：沿摆锤实际运动方向（修正原先方向相反/依赖 swing 绝对值的反直觉手感）
          var len = Math.hypot(c.ax - c.x, c.ay - c.y) || 1;
          var ang = Math.atan2(c.y - c.ay, c.x - c.ax);
          var tang = c.swing * 0.03 * 1.5;
          c.vx = -Math.sin(ang) * len * tang;
          c.vy = Math.cos(ang) * len * tang;
          cuts++;
          if (Arcade.juice) Arcade.juice.rotate();
        }
      }
    });
    if (cuts > 0 && Arcade.audio) Arcade.audio.play('type');
    swipeStart = null; swipeEnd = null;
  }
  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', up, { passive: false });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  restartBtn.addEventListener('click', function () {
    if (over && level < 3) { level++; }
    setup();
    if (loopApi && !loopApi.isRunning()) loopApi.resume(); // 暂停中重开需恢复循环（修复冻结画面）
    levelEl.textContent = level;
    scoreEl.textContent = '0 / ' + candies.length;
    restartBtn.textContent = T('gs.roperescue.retry');
    msg.textContent = T('gs.roperescue.help');
    msg.style.color = '';
    if (Arcade.audio) Arcade.audio.play('ui');
  });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.roperescue.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); if (loopApi && !loopApi.isRunning()) loopApi.resume(); levelEl.textContent = level; scoreEl.textContent = '0 / ' + candies.length; restartBtn.textContent = T('gs.roperescue.retry'); msg.textContent = T('gs.roperescue.help'); msg.style.color = ''; };

  level = 1; setup();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
