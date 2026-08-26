/* 桥梁搭建 Bridge Builder —— 横向新游戏 物理类 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bridge.tut1t'), d: T('gs.bridge.tut1') },
  { t: T('gs.bridge.tut2t'), d: T('gs.bridge.tut2') },
  { t: T('gs.bridge.tut3t'), d: T('gs.bridge.tut3') },
  { t: T('gs.bridge.tut4t'), d: T('gs.bridge.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 600, H = 300;
  var LEFT = { x: 30, y: 160 };
  var RIGHT = { x: W - 30, y: 160 };
  var BALL_R = 12;

  var planks, ball, over, won, startTs, paused, loopApi, hover;

  /* 木板：连接两个节点（初始两岸 + 放置产生的节点） */
  function setup() {
    paused = false; // 重开/重试后解除暂停，否则循环保持挂起
    planks = [];
    nodes = [
      { x: LEFT.x, y: LEFT.y, fixed: true },
      { x: RIGHT.x, y: RIGHT.y, fixed: true }
    ];
    // 待命状态：小球停在起点不动，按「放球」才释放（修复此前开局即滚落卡死的软锁）
    ball = { x: LEFT.x, y: LEFT.y - 30, vx: 0, vy: 0, onPlank: false, done: false, ready: true };
    over = false; won = false;
    startTs = 0; // 放球时才起算（避免搭桥等待计入超时）
  }
  var nodes = [];

  function addPlank(ax, ay, bx, by) {
    // 找最近节点或新建
    var na = nearestNode(ax, ay), nb = nearestNode(bx, by);
    if (na && nb && na !== nb) {
      var dup = planks.some(function (p) { return (p.a === na && p.b === nb) || (p.a === nb && p.b === na); });
      if (!dup) planks.push({ a: na, b: nb });
    }
  }
  function nearestNode(x, y) {
    // 命中半径按画布实际缩放等比放大，保证小屏触控精度（逻辑 22px 在 320px 屏上等效 ~11 CSS px）
    var rect = canvas.getBoundingClientRect();
    var bd = 22 * (W / (rect.width || 1));
    var best = null;
    for (var i = 0; i < nodes.length; i++) {
      var d = Math.hypot(nodes[i].x - x, nodes[i].y - y);
      if (d < bd) { bd = d; best = nodes[i]; }
    }
    return best;
  }
  function addNodeAt(x, y) {
    nodes.push({ x: x, y: y, fixed: false });
    return nodes[nodes.length - 1];
  }

  var wrap = document.createElement('div');
  wrap.className = 'br-wrap';
  wrap.innerHTML =
    '<canvas class="br-canvas" id="br-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="br-top"><span>' + T('gs.bridge.hudPlanks') + ' <b id="br-count">0</b></span><span>' + T('gs.bridge.hudGoal') + '</span></div>' +
    '<div class="br-msg" id="br-msg">' + T('gs.bridge.help') + '</div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="br-go">' + T('gs.bridge.drop') + '</button>' +
    '  <button class="btn purple" id="br-restart">' + T('gs.bridge.reset') + '</button>' +
    '</div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#br-canvas'), ctx = canvas.getContext('2d'),
      countEl = wrap.querySelector('#br-count'), msg = wrap.querySelector('#br-msg'),
      goBtn = wrap.querySelector('#br-go'), restartBtn = wrap.querySelector('#br-restart');

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.bridge.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.bridge.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function update() {
    if (over || won) return;
    if (ball.done) return;
    if (ball.ready) return; // 待命：等「放球」
    // 球滚过木板：找脚下的板
    var onPlank = null;
    for (var i = 0; i < planks.length; i++) {
      var p = planks[i];
      var p1 = p.a, p2 = p.b;
      // 球 x 在板投影内
      var minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      if (ball.x >= minX - 4 && ball.x <= maxX + 4) {
        var t = (ball.x - p1.x) / (p2.x - p1.x || 1);
        var yOn = p1.y + (p2.y - p1.y) * t;
        if (Math.abs(ball.y + BALL_R - yOn) < 16) { onPlank = p; break; }
      }
    }
    if (onPlank) {
      var pA = onPlank.a, pB = onPlank.b;
      var t2 = (ball.x - pA.x) / (pB.x - pA.x || 1);
      ball.y = pA.y + (pB.y - pA.y) * t2 - BALL_R;
      ball.vy = 0;
      // 沿板滑动
      ball.vx = (pB.x > pA.x ? 1 : -1) * (Math.abs(pB.x - pA.x) > Math.abs(pB.y - pA.y) ? 2.5 : 1.6);
    } else {
      // 自由落体
      ball.vy += 0.4;
      ball.y += ball.vy;
      ball.vx *= 0.99;
    }
    ball.x += ball.vx;
    // 边界
    if (ball.y > H - 10) { ball.y = H - 10; ball.vy = 0; ball.vx = 0; }
    if (ball.x < 10) { ball.x = 10; ball.vx = 0; }
    // 到达终点
    if (Math.hypot(ball.x - RIGHT.x, ball.y - RIGHT.y) < 26) {
      won = true; ball.done = true;
      var sec = Math.round((Date.now() - startTs) / 1000);
      msg.textContent = T('gs.bridge.win').replace('{n}', sec).replace('{m}', planks.length);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(planks.length);
    }
    // 超时（放球后起算）
    if (!won && startTs && Date.now() - startTs > 60000) {
      over = true;
      msg.textContent = T('gs.bridge.timeout');
      msg.style.color = 'var(--neon-pink)';
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1420'; ctx.fillRect(0, 0, W, H);
    // 两岸
    ctx.fillStyle = '#3a6a4a';
    ctx.fillRect(0, 0, 14, H);
    ctx.fillRect(W - 14, 0, 14, H);
    ctx.fillStyle = '#39ff14';
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🏁', RIGHT.x, RIGHT.y + 6);
    // 木板
    planks.forEach(function (p) {
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(p.b.x, p.b.y); ctx.stroke();
      ctx.strokeStyle = '#c8a86a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(p.b.x, p.b.y); ctx.stroke();
    });
    // 节点
    nodes.forEach(function (n) {
      if (n.fixed) { ctx.fillStyle = '#00f0ff'; ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, 7); ctx.fill(); }
    });
    // 球
    if (!ball.done) {
      ctx.fillStyle = '#ff9e2d';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ball.x - 4, ball.y - 4, 4, 0, 7); ctx.fill();
    }
  }

  function click(e) {
    if (over || won || ball.done) return;
    var rect = canvas.getBoundingClientRect();
    var scale = W / (rect.width || 1); // 逻辑坐标缩放系数
    var px = (e.clientX - rect.left) * scale;
    var py = (e.clientY - rect.top) * scale;
    // 删除木板（命中半径随缩放放大）
    var hitPlank = null, bd = 8 * scale;
    planks.forEach(function (p) {
      // 点到线段距离
      var d = distToSeg(px, py, p.a, p.b);
      if (d < bd) { bd = d; hitPlank = p; }
    });
    if (hitPlank) {
      planks = planks.filter(function (p) { return p !== hitPlank; });
      if (Arcade.audio) Arcade.audio.play('ui');
      return;
    }
    // 新建木板：从最近节点到点击点（若点击点落在已有板上则连到板的中点）
    var na = nearestNode(px, py);
    if (!na) return;
    // 若点到已有板的距离近，把板分成两段
    var mid = null;
    planks.forEach(function (p) {
      if (distToSeg(px, py, p.a, p.b) < 14 * scale) {
        var mx = (p.a.x + p.b.x) / 2, my = (p.a.y + p.b.y) / 2;
        var nm = nearestNode(mx, my);
        if (!nm) { nodes.push({ x: mx, y: my, fixed: false }); nm = nodes[nodes.length - 1]; }
        // 拆板：a-nm, nm-b
        planks = planks.filter(function (x) { return x !== p; });
        planks.push({ a: p.a, b: nm });
        planks.push({ a: nm, b: p.b });
        mid = nm;
      }
    });
    var nb = mid || addNodeAt(px, py);
    var dup = planks.some(function (p) { return (p.a === na && p.b === nb) || (p.a === nb && p.b === na); });
    if (!dup && na !== nb) planks.push({ a: na, b: nb });
    countEl.textContent = planks.length;
    if (Arcade.juice) Arcade.juice.select();
  }
  function distToSeg(px, py, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len2 = dx * dx + dy * dy;
    var t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (len2 || 1)));
    var cx = a.x + t * dx, cy = a.y + t * dy;
    return Math.hypot(px - cx, py - cy);
  }
  canvas.addEventListener('mousedown', click);
  canvas.addEventListener('touchstart', function (e) { click(e.touches[0]); e.preventDefault(); }, { passive: false });

  goBtn.addEventListener('click', function () {
    if (over) return;
    if (ball.done || won) { setup(); }
    ball.ready = false; ball.done = false; startTs = Date.now();
    msg.textContent = T('gs.bridge.rolling');
    msg.style.color = 'var(--neon-yellow)';
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  restartBtn.addEventListener('click', function () { setup(); if (loopApi) loopApi.resume(); countEl.textContent = '0'; msg.textContent = T('gs.bridge.help'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.bridge.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); if (loopApi) loopApi.resume(); countEl.textContent = '0'; msg.textContent = T('gs.bridge.help'); msg.style.color = ''; };
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  setup();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
