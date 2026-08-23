/* 弹射打靶 Catapult —— 横向新游戏 物理类 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.catapult.tut1t'), d: T('gs.catapult.tut1') },
  { t: T('gs.catapult.tut2t'), d: T('gs.catapult.tut2') },
  { t: T('gs.catapult.tut3t'), d: T('gs.catapult.tut3') },
  { t: T('gs.catapult.tut4t'), d: T('gs.catapult.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 600, H = 340;
  var GRAV = 0.3;

  var targets, rocks, stone, shooting, dragStart, dragNow, shots, over, paused, loopApi;

  function setup() {
    targets = [];
    var n = 4; // 单轮 4 个目标
    for (var i = 0; i < n; i++) {
      var t = i % 3;
      targets.push({
        // 目标限制在弹道可达区（此前 y=120-280 + 固定 0.22 倍率导致桌面端永远打不到）
        x: 100 + Math.random() * 380,
        y: 150 + (t * 45) + Math.random() * 25,
        r: t === 0 ? 14 : 11, // 环形靶大，圆形靶小
        vx: (Math.random() - 0.5) * 0.5,
        alive: true
      });
    }
    rocks = [];
    stone = { x: 40, y: H - 34, r: 9, ready: true };
    shots = 9;
    over = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ca-wrap';
  wrap.innerHTML =
    '<canvas class="ca-canvas" id="ca-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="ca-top"><span>' + T('gs.catapult.hudRocks') + ' <b id="ca-shots">9</b></span><span>' + T('gs.catapult.hudTargets') + ' <b id="ca-targets">0</b></span></div>' +
    '<div class="ca-msg" id="ca-msg">' + T('gs.catapult.help') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="ca-restart">' + T('gs.catapult.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#ca-canvas'), ctx = canvas.getContext('2d'),
      shotsEl = wrap.querySelector('#ca-shots'), targetsEl = wrap.querySelector('#ca-targets'),
      msg = wrap.querySelector('#ca-msg'), restartBtn = wrap.querySelector('#ca-restart');

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.catapult.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.catapult.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function update() {
    if (over) return;
    // 目标移动
    targets.forEach(function (t) {
      if (!t.alive) return;
      t.x += t.vx;
      if (t.x < 60 || t.x > W - 30) t.vx = -t.vx;
    });
    // 石头
    rocks.forEach(function (r, idx) {
      r.vy += GRAV;
      r.x += r.vx;
      r.y += r.vy;
      // 命中目标
      targets.forEach(function (t) {
        if (t.alive && Math.hypot(r.x - t.x, r.y - t.y) < t.r + r.r) {
          t.alive = false;
          if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-yellow)', 12);
        }
      });
      // 落地/出界
      if (r.y > H - 8 || r.x > W + 20 || r.y < -30) rocks.splice(idx, 1);
    });
    // 石头就绪
    if (stone.ready && !rocks.length) {
      stone.x = 40; stone.y = H - 34;
    }
    // 检查胜负
    var alive = targets.filter(function (t) { return t.alive; }).length;
    targetsEl.textContent = alive;
    if (!alive && !over) {
      over = true;
      msg.textContent = T('gs.catapult.clear').replace('{n}', shots);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      /* E2E 评审修复：提交已用石数（10-shots），min 模式下越少越好 */
      if (Arcade.shell) Arcade.shell.submitScore(10 - shots);
      return;
    }
    if (shots <= 0 && alive > 0 && !over && stone.ready) {
      over = true;
      msg.textContent = T('gs.catapult.out').replace('{n}', alive);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
      /* E2E 评审修复：输局不提交 0（避免永久锁成最佳成绩） */
    }
    shotsEl.textContent = shots;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1420'; ctx.fillRect(0, 0, W, H);
    // 地面
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0, H - 8, W, 8);
    // 目标
    targets.forEach(function (t) {
      if (!t.alive) return;
      ctx.strokeStyle = '#ff2d95'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.stroke();
      ctx.fillStyle = '#ff2d95';
      ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, 7); ctx.fill();
    });
    // 弹弓
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(40, H - 34); ctx.lineTo(40, H - 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, H - 34); ctx.lineTo(56, H - 30); ctx.stroke();
    // 石头（拖拽时画蓄力方向）
    var sx = stone.x, sy = stone.y;
    if (dragStart && dragNow) {
      ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(stone.x, stone.y); ctx.lineTo(dragNow.x, dragNow.y); ctx.stroke();
      ctx.setLineDash([]);
      // 预估轨迹（倍率与发射一致：0.7）
      var dx = (stone.x - dragNow.x) * 0.7, dy = (stone.y - dragNow.y) * 0.7;
      ctx.strokeStyle = 'rgba(255,230,0,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      var px = stone.x, py = stone.y, tvx = dx, tvy = dy;
      ctx.moveTo(px, py);
      for (var i = 0; i < 28; i++) {
        tvy += GRAV;
        px += tvx; py += tvy;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#8a8a9a';
    ctx.beginPath(); ctx.arc(sx, sy, stone.r, 0, 7); ctx.fill();
    // 飞行中的石头
    rocks.forEach(function (r) {
      ctx.fillStyle = '#8a8a9a';
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.fill();
    });
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    // touchend 时 touches 为空，须取 changedTouches（修复触屏松手无法发射）
    var t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]) || e;
    var cx = t.clientX - rect.left;
    var cy = t.clientY - rect.top;
    return { x: cx * (W / rect.width), y: cy * (H / rect.height) };
  }
  function down(e) {
    if (over) return;
    var p = toCanvas(e);
    // 抓取命中半径按画布缩放放大（小屏触控精度）
    var rect = canvas.getBoundingClientRect();
    var grabR = 30 * (W / (rect.width || 1));
    if (Math.hypot(p.x - stone.x, p.y - stone.y) < grabR && stone.ready) {
      dragStart = p; dragNow = p;
      e.preventDefault();
    }
  }
  function move(e) { if (dragStart) { dragNow = toCanvas(e); e.preventDefault(); } }
  function up(e) {
    if (!dragStart) return;
    dragNow = toCanvas(e);
    // 发射倍率 0.7：拖拽可达范围覆盖全部目标（此前 0.22 使桌面端无法命中高目标）
    var dx = (stone.x - dragNow.x) * 0.7;
    var dy = (stone.y - dragNow.y) * 0.7;
    var power = Math.hypot(dx, dy);
    if (power > 2) {
      rocks.push({ x: stone.x, y: stone.y, vx: dx, vy: dy, r: stone.r });
      shots--;
      stone.ready = false;
      if (Arcade.juice) Arcade.juice.drop();
      // 石头归位
      setTimeout(function () { stone.ready = true; }, 700);
    }
    dragStart = null; dragNow = null;
  }
  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', up, { passive: false });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  restartBtn.addEventListener('click', function () { setup(); shotsEl.textContent = '9'; targetsEl.textContent = targets.filter(function(t){return t.alive;}).length; msg.textContent = T('gs.catapult.help'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { setup(); shotsEl.textContent = '9'; targetsEl.textContent = targets.filter(function(t){return t.alive;}).length; msg.textContent = T('gs.catapult.help'); msg.style.color = ''; };

  setup();
  targetsEl.textContent = targets.length;
  loopApi = Arcade.loop.start(update, draw, 16);

})();
