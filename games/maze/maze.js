/* 迷宫 Maze (DFS 生成) —— P2 逻辑解谜 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.maze.tut1t'), d: T('gs.maze.tut1') },
  { t: T('gs.maze.tut2t'), d: T('gs.maze.tut2') },
  { t: T('gs.maze.tut3t'), d: T('gs.maze.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 13, H = 13, cell = 22, steps = 0, over = false;
  var walls = [], pr = 0, pc = 0;
  var canvas, ctx;

  function gen() {
    walls = [];
    for (var r = 0; r < H; r++) { walls[r] = []; for (var c = 0; c < W; c++) walls[r][c] = { N: true, E: true, S: true, W: true }; }
    var visited = [];
    for (var r2 = 0; r2 < H; r2++) { visited[r2] = []; for (var c2 = 0; c2 < W; c2++) visited[r2][c2] = false; }
    var stack = [[0, 0]]; visited[0][0] = true;
    var dirs = [[-1, 0, 'N', 'S'], [1, 0, 'S', 'N'], [0, -1, 'W', 'E'], [0, 1, 'E', 'W']];
    while (stack.length) {
      var cur = stack[stack.length - 1];
      var r = cur[0], c = cur[1];
      var opts = [];
      for (var i = 0; i < 4; i++) {
        var nr = r + dirs[i][0], nc = c + dirs[i][1];
        if (nr >= 0 && nc >= 0 && nr < H && nc < W && !visited[nr][nc]) opts.push(dirs[i]);
      }
      if (!opts.length) { stack.pop(); continue; }
      var d = opts[Math.floor(Math.random() * opts.length)];
      var nr2 = r + d[0], nc2 = c + d[1];
      walls[r][c][d[2]] = false; walls[nr2][nc2][d[3]] = false;
      visited[nr2][nc2] = true; stack.push([nr2, nc2]);
    }
  }

  var wrap = document.createElement('div');
  wrap.className = 'mz-wrap';
  wrap.innerHTML =
    '<div class="mz-top" id="mz-top">' + T('gs.maze.hud').replace('{n}', 0) + '</div>' +
    '<canvas class="mz-canvas" id="mz-canvas" width="' + (W * cell) + '" height="' + (H * cell) + '"></canvas>' +
    '<div class="mz-dpad">' +
    '<span></span><button data-d="up">⬆</button><span></span>' +
    '<button data-d="left">⬅</button><button data-d="down">⬇</button><button data-d="right">➡</button>' +
    '</div>' +
    '<div class="mz-msg" id="mz-msg"></div>';
  root.appendChild(wrap);
  canvas = wrap.querySelector('#mz-canvas'); ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var top = wrap.querySelector('#mz-top'), msg = wrap.querySelector('#mz-msg');
  wrap.querySelectorAll('.mz-dpad button').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.dataset.d;
      move(d === 'up' ? -1 : d === 'down' ? 1 : 0, d === 'left' ? -1 : d === 'right' ? 1 : 0);
    });
  });

  function draw() {
    ctx.clearRect(0, 0, W * cell, H * cell);
    ctx.strokeStyle = 'rgba(0,240,255,0.85)'; ctx.lineWidth = 2;
    for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) {
      var x = c * cell, y = r * cell, w = walls[r][c];
      ctx.beginPath();
      if (w.N) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); }
      if (w.S) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); }
      if (w.W) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); }
      if (w.E) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); }
      ctx.stroke();
    }
    // 终点
    ctx.fillStyle = '#ffe600';
    ctx.fillRect((W - 1) * cell + cell / 2 - 6, (H - 1) * cell + cell / 2 - 6, 12, 12);
    // 玩家（walls[r][c] 中 r=行=y、c=列=x；pr=行、pc=列 → 绘制用 pc,pr）
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(pc * cell + cell / 2, pr * cell + cell / 2, cell / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function move(dr, dc) {
    if (over) return;
    var nr = pr + dr, nc = pc + dc;
    if (nr < 0 || nc < 0 || nr >= H || nc >= W) return;
    if (dr === -1 && walls[pr][pc].N) return;
    if (dr === 1 && walls[pr][pc].S) return;
    if (dc === -1 && walls[pr][pc].W) return;
    if (dc === 1 && walls[pr][pc].E) return;
    pr = nr; pc = nc; steps++; top.textContent = T('gs.maze.hud').replace('{n}', steps);
    if (Arcade.juice) Arcade.juice.move();
    if (pr === H - 1 && pc === W - 1) { // 终点 = 右下角（行 H-1，列 W-1）
      over = true;
      msg.textContent = T('gs.maze.win').replace('{n}', steps);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(steps);
    } else draw();
  }

  document.addEventListener('keydown', function (e) {
    if (over) return;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move(-1, 0);
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move(1, 0);
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move(0, -1);
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move(0, 1);
  });
  if (window.Arcade && Arcade.input && Arcade.input.onSwipe) {
    Arcade.input.onSwipe(canvas, function (dir) {
      if (dir === 'up') move(-1, 0); else if (dir === 'down') move(1, 0);
      else if (dir === 'left') move(0, -1); else if (dir === 'right') move(0, 1);
    });
  }

  gen(); draw();
  window.GAME_RESTART = function () {
    steps = 0; over = false; pr = 0; pc = 0;
    top.textContent = T('gs.maze.hud').replace('{n}', 0);
    gen(); draw();
  };

})();
