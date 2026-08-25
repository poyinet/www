/* 迷宫吃豆 Maze Dot —— 批次B 经典街机 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.mazedot.tut1t'), d: T('gs.mazedot.tut1') },
  { t: T('gs.mazedot.tut2t'), d: T('gs.mazedot.tut2') },
  { t: T('gs.mazedot.tut3t'), d: T('gs.mazedot.tut3') },
  { t: T('gs.mazedot.tut4t'), d: T('gs.mazedot.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var COLS = 15, ROWS = 15, CELL = 30, W = COLS * CELL, H = ROWS * CELL;
  var PAC_SPEED = 3.4, GHOST_SPEED = 2.6;

  /* 手绘迷宫：1=墙 2=豆子 3=大力丸 0=空 */
  var MAP_T = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,2,1,2,1,1,2,1],
    [1,3,1,0,2,0,2,1,2,0,2,0,1,3,1],
    [1,2,1,1,2,2,2,2,2,2,2,1,1,2,1],
    [1,2,2,2,2,1,1,0,1,1,2,2,2,2,1],
    [1,2,1,0,2,0,2,2,2,0,2,0,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,0,2,0,2,2,2,0,2,0,1,2,1],
    [1,2,2,2,2,1,1,0,1,1,2,2,2,2,1],
    [1,2,1,1,2,2,2,2,2,2,2,1,1,2,1],
    [1,3,1,0,2,0,2,1,2,0,2,0,1,3,1],
    [1,2,1,1,2,1,2,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  var grid, pac, ghosts, score, dotsLeft, over, won, paused, loopApi, dirQueue, level, combo, fearEl;

  function makeGhosts() {
    ghosts = [
      { x: 7 * CELL + CELL / 2, y: 7 * CELL + CELL / 2, dir: 'left', color: '#ff2d95', scared: 0, speed: GHOST_SPEED },
      { x: 4 * CELL + CELL / 2, y: 7 * CELL + CELL / 2, dir: 'up', color: '#00f0ff', scared: 0, speed: GHOST_SPEED },
      { x: 10 * CELL + CELL / 2, y: 7 * CELL + CELL / 2, dir: 'down', color: '#ff9e2d', scared: 0, speed: GHOST_SPEED }
    ];
    // 双鬼模式：第 3 关起出现镜像鬼，第 5 关起再添一只
    if (level >= 3) ghosts.push({ x: 7 * CELL + CELL / 2, y: 3 * CELL + CELL / 2, dir: 'down', color: '#39ff14', scared: 0, speed: GHOST_SPEED + 0.2, mirror: true });
    if (level >= 5) ghosts.push({ x: 7 * CELL + CELL / 2, y: 5 * CELL + CELL / 2, dir: 'up', color: '#b967ff', scared: 0, speed: GHOST_SPEED + 0.4, mirror: true });
    ghosts.forEach(function (g) { g.speed = Math.min(g.speed + level * 0.25, PAC_SPEED - 0.15); }); // 封顶：幽灵永不超过玩家速度（修复高关无解）
  }

  function setup() {
    grid = [];
    dotsLeft = 0;
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = MAP_T[r][c];
        if (MAP_T[r][c] === 2 || MAP_T[r][c] === 3) dotsLeft++;
      }
    }
    pac = { x: 7 * CELL + CELL / 2, y: 11 * CELL + CELL / 2, dir: 'left', next: null };
    score = 0; over = false; won = false; level = 1; combo = 0;
    makeGhosts();
    dirQueue = [];
  }

  var wrap = document.createElement('div');
  wrap.className = 'pm-wrap';
  wrap.innerHTML =
    '<canvas class="pm-canvas" id="pm-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="pm-top"><span>' + T('gs.mazedot.score') + ' <span id="pm-score">0</span></span><span>' + T('gs.mazedot.dots') + ' <span id="pm-dots">0</span></span><span>😱 <span id="pm-fear">0</span>s</span></div>' +
    '<div class="pm-msg" id="pm-msg">' + T('gs.mazedot.help') + '</div>' +
    '<div class="game-controls"><button id="pm-restart" class="btn purple">' + T('gs.mazedot.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#pm-canvas'), ctx = canvas.getContext('2d'),
      scoreEl = wrap.querySelector('#pm-score'), dotsEl = wrap.querySelector('#pm-dots'),
      msg = wrap.querySelector('#pm-msg'), restartBtn = wrap.querySelector('#pm-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  fearEl = wrap.querySelector('#pm-fear');

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.mazedot.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.mazedot.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function cellAt(x, y) {
    var r = Math.floor(y / CELL), c = Math.floor(x / CELL);
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return 1;
    return grid[r][c];
  }
  function isWall(x, y) { return cellAt(x, y) === 1; }
  /* 判断 pac 沿 dir 走 next 步是否会撞墙 */
  function canMove(x, y, dir) {
    var nx = x, ny = y;
    if (dir === 'left') nx -= PAC_SPEED;
    else if (dir === 'right') nx += PAC_SPEED;
    else if (dir === 'up') ny -= PAC_SPEED;
    else if (dir === 'down') ny += PAC_SPEED;
    var r = Math.floor(ny / CELL), c = Math.floor(nx / CELL);
    // 允许在格子中心转弯；检查目标格是否墙
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return false;
    return grid[r][c] !== 1;
  }

  function move(dir) { if (!over) { pac.next = dir; } }

  function update() {
    if (over) return;
    // 应用转向（仅当目标方向可行）
    if (pac.next && canMove(pac.x, pac.y, pac.next)) { pac.dir = pac.next; pac.next = null; }
    if (!canMove(pac.x, pac.y, pac.dir)) { /* 撞墙停住 */ }
    else {
      if (pac.dir === 'left') pac.x -= PAC_SPEED;
      else if (pac.dir === 'right') pac.x += PAC_SPEED;
      else if (pac.dir === 'up') pac.y -= PAC_SPEED;
      else if (pac.dir === 'down') pac.y += PAC_SPEED;
    }
    // 吃豆
    var r = Math.floor(pac.y / CELL), c = Math.floor(pac.x / CELL);
    if (grid[r][c] === 2) {
      grid[r][c] = 0; dotsLeft--; score += 1;
      if (Arcade.juice) Arcade.juice.select();
    } else if (grid[r][c] === 3) {
      grid[r][c] = 0; dotsLeft--; score += 10;
      combo = 0;
      ghosts.forEach(function (g) { g.scared = 400; });
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-yellow)');
    }
    // 恐惧剩余（显示用）
    var maxScared = 0;
    ghosts.forEach(function (g) { if (g.scared > maxScared) maxScared = g.scared; });
    if (fearEl) fearEl.textContent = maxScared > 0 ? Math.ceil(maxScared / 60) : 0;
    // 幽灵
    ghosts.forEach(function (g) {
      if (g.scared > 0) g.scared--;
      // 幽灵 AI：在格点中心选方向（朝 pac 或随机）
      var cx = Math.round(g.x / CELL) * CELL + CELL / 2, cy = Math.round(g.y / CELL) * CELL + CELL / 2;
      if (Math.abs(g.x - cx) < 1 && Math.abs(g.y - cy) < 1) {
        g.x = cx; g.y = cy;
        var opts = [];
        var dirs = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
        for (var i = 0; i < 4; i++) {
          var d = dirs[i];
          if (d[0] === g.dir) continue; // 不回头
          var nr = cy / CELL + d[2], nc = cx / CELL + d[1];
          if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
          if (grid[nr][nc] === 1) continue;
          opts.push(d);
        }
        if (!opts.length) g.dir = g.dir;
        else if (g.scared > 0) { // 害怕时随机逃
          g.dir = opts[Math.floor(Math.random() * opts.length)][0];
        } else {
          // 简单追逐：选离 pac 曼哈顿距离最小的方向
          var best = opts[0], bd = 1e9;
          for (var j = 0; j < opts.length; j++) {
            var dd = Math.abs((cy / CELL + opts[j][2]) * CELL - pac.y) + Math.abs((cx / CELL + opts[j][1]) * CELL - pac.x);
            if (dd < bd) { bd = dd; best = opts[j]; }
          }
          g.dir = best[0];
        }
      }
      if (g.dir === 'left') g.x -= g.speed;
      else if (g.dir === 'right') g.x += g.speed;
      else if (g.dir === 'up') g.y -= g.speed;
      else if (g.dir === 'down') g.y += g.speed;
      // 与 pac 碰撞
      var dist = Math.hypot(g.x - pac.x, g.y - pac.y);
      if (dist < 20) {
        if (g.scared > 0) {
          // 吃幽灵：连吃翻倍（50→100→200→400），吃后其余幽灵恐惧时间减半
          var pts = Math.min(400, 50 * Math.pow(2, combo));
          score += pts; combo++;
          g.scared = 0;
          g.x = 7 * CELL + CELL / 2; g.y = 7 * CELL + CELL / 2;
          ghosts.forEach(function (gh) { if (gh !== g && gh.scared > 0) gh.scared = Math.floor(gh.scared / 2); });
          if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-pink)');
          msg.textContent = T('gs.mazedot.ghostEat').replace('{n}', pts) + (combo > 1 ? T('gs.mazedot.combo').replace('{n}', combo) : '');
          msg.style.color = 'var(--neon-cyan)';
        } else {
          over = true;
          msg.textContent = T('gs.mazedot.dead').replace('{n}', score);
          msg.style.color = 'var(--neon-pink)';
          if (Arcade.juice) Arcade.juice.lose();
          if (Arcade.shell) Arcade.shell.submitScore(score);
          return;
        }
      }
    });
    // 通关 → 下一关
    if (dotsLeft <= 0 && !won) {
      level++;
      if (level > 5) {
        won = true; over = true;
        var finalScore = score + (level - 1) * 20;
        msg.textContent = T('gs.mazedot.win').replace('{n}', finalScore);
        msg.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(finalScore);
        return;
      }
      // 重置豆子与幽灵，速度提升 + 镜像鬼加入
      resetDots();
      combo = 0;
      makeGhosts();
      msg.textContent = T('gs.mazedot.levelUp').replace('{n}', level) + (level >= 3 ? T('gs.mazedot.mirrorGhost') : '');
      msg.style.color = 'var(--neon-yellow)';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
      scoreEl.textContent = score;
      dotsEl.textContent = dotsLeft;
      if (fearEl) fearEl.textContent = 0;
      return;
    }
    scoreEl.textContent = score;
    dotsEl.textContent = dotsLeft;
  }

  function resetDots() {
    dotsLeft = 0;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if (MAP_T[r][c] === 2 || MAP_T[r][c] === 3) { grid[r][c] = MAP_T[r][c]; dotsLeft++; }
    }
    pac.x = 7 * CELL + CELL / 2; pac.y = 11 * CELL + CELL / 2; pac.dir = 'left';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var v = grid[r][c], x = c * CELL, y = r * CELL;
      if (v === 1) {
        ctx.fillStyle = '#16224a';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = '#0a1230';
        ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
      } else if (v === 2) {
        ctx.fillStyle = '#ffd9e8';
        ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, 4, 0, 7); ctx.fill();
      } else if (v === 3) {
        ctx.fillStyle = '#ffe600';
        ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, 9, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, 4, 0, 7); ctx.fill();
      }
    }
    // 幽灵：通用圆球造型（去除经典幽灵轮廓与眼白样式，规避 PAC-MAN 角色相似度）
    ghosts.forEach(function (g) {
      ctx.fillStyle = g.scared > 0 ? '#4a6cff' : g.color;
      var gx = g.x, gy = g.y, R = 11;
      ctx.beginPath(); ctx.arc(gx, gy, R, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(gx - 4, gy - 2, 3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 4, gy - 2, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#0a0a12';
      ctx.beginPath(); ctx.arc(gx - 4, gy - 2, 1.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 4, gy - 2, 1.4, 0, 7); ctx.fill();
    });
    // 主角：霓虹青「破译光球」原创造型（替代 PAC-MAN 黄嘴角色，规避角色相似度）
    if (!over || won) {
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(pac.x, pac.y, 12, 0, 7); ctx.fill();
      // 嘴部小楔形：保持「吃豆」读感
      ctx.fillStyle = '#0a0a12';
      ctx.beginPath(); ctx.moveTo(pac.x, pac.y);
      ctx.arc(pac.x, pac.y, 12, -0.45, 0.45);
      ctx.closePath(); ctx.fill();
      // 尾迹光
      ctx.fillStyle = 'rgba(0,240,255,0.35)';
      ctx.beginPath(); ctx.arc(pac.x - 9, pac.y, 6, 0, 7); ctx.fill();
    }
  }

  Arcade.input.onKeys({ left: function () { move('left'); }, right: function () { move('right'); }, up: function () { move('up'); }, down: function () { move('down'); } });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  if (Arcade.input && Arcade.input.isTouch()) {
    var dpad = Arcade.input.createDPad(root, function (dir, pressed) { if (pressed) move(dir); });
    dpad.className += ' pm-dpad';
  }

  restartBtn.addEventListener('click', function () { setup(); scoreEl.textContent = '0'; dotsEl.textContent = dotsLeft; msg.textContent = T('gs.mazedot.help'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.mazedot.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); scoreEl.textContent = '0'; dotsEl.textContent = dotsLeft; msg.textContent = T('gs.mazedot.help'); msg.style.color = ''; };

  setup();
  scoreEl.textContent = '0'; dotsEl.textContent = dotsLeft;
  loopApi = Arcade.loop.start(update, draw, 16);

})();
