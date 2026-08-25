/* 管道连接 Pipe Connect —— Phase3 通用高质量（旋转连通） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.pipe.tut1t'), d: T('gs.pipe.tut1') },
  { t: T('gs.pipe.tut2t'), d: T('gs.pipe.tut2') },
  { t: T('gs.pipe.tut3t'), d: T('gs.pipe.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var BASE = { I: [1, 0, 1, 0], L: [1, 1, 0, 0], T: [1, 1, 1, 0], X: [1, 1, 1, 1] };
  var SHAPES = ['I', 'L', 'T'];
  var N, grid, sr, sk, rots, won, reachedGoal;

  function rotMask(shape, r) {
    var b = BASE[shape], m = [0, 0, 0, 0];
    for (var i = 0; i < 4; i++) m[(i + r) % 4] = b[i];
    return m;
  }
  function opp(d) { return (d + 2) % 4; }
  function delta(d) { return [[-1, 0], [0, 1], [1, 0], [0, -1]][d]; } // 0上 1右 2下 3左（与 buildPath/solved 编码一致）

  function buildPath() {
    sr = Math.floor(Math.random() * N); // 水源行
    sk = Math.floor(Math.random() * N); // 出水口行
    var path = [[sr, 0]], seen = {}, key = function (r, c) { return r + ',' + c; };
    seen[key(sr, 0)] = true;
    var r = sr, c = 0;
    var guard = 0;
    while (!(r === sk && c === N - 1) && guard++ < 500) {
      var opts = [];
      if (c < N - 1 && !seen[key(r, c + 1)]) opts.push([r, c + 1, 1]); // right
      if (r < N - 1 && !seen[key(r + 1, c)]) opts.push([r + 1, c, 2]); // down
      if (r > 0 && path.length > 1 && !seen[key(r - 1, c)]) opts.push([r - 1, c, 0]); // up
      if (c > 0 && path.length > 1 && !seen[key(r, c - 1)]) opts.push([r, c - 1, 3]); // left
      if (!opts.length) { // 死胡同：回溯一格
        if (path.length <= 1) break;
        path.pop();
        var prev = path[path.length - 1];
        r = prev[0]; c = prev[1];
        continue;
      }
      // 优先向目标 (sk, N-1)
      opts.sort(function (a, b) {
        var da = Math.abs(a[0] - sk) + Math.abs(a[1] - (N - 1));
        var db = Math.abs(b[0] - sk) + Math.abs(b[1] - (N - 1));
        return da - db;
      });
      var pick = opts[0];
      path.push([pick[0], pick[1]]); seen[key(pick[0], pick[1])] = true; r = pick[0]; c = pick[1];
    }
    reachedGoal = (r === sk && c === N - 1);
    if (reachedGoal) {
      // 路径确定后统一设置管口（增量：保留循环里已开的进入/前进方向）
      if (!grid[sr][0].open) grid[sr][0].open = [0, 0, 0, 0];
      grid[sr][0].open[3] = 1; // 起点朝左接水源（左边界）
      if (!grid[sk][N - 1].open) grid[sk][N - 1].open = [0, 0, 0, 0];
      grid[sk][N - 1].open[1] = 1; // 终点朝右接出水口（右边界）
      for (var i = 0; i < path.length - 1; i++) {
        var a = path[i], b = path[i + 1];
        var d = (b[0] - a[0] === 1) ? 2 : (b[0] - a[0] === -1) ? 0 : (b[1] - a[1] === 1) ? 1 : 3;
        if (!grid[a[0]][a[1]].open) grid[a[0]][a[1]].open = [0, 0, 0, 0];
        grid[a[0]][a[1]].open[d] = 1;
        if (!grid[b[0]][b[1]].open) grid[b[0]][b[1]].open = [0, 0, 0, 0];
        grid[b[0]][b[1]].open[opp(d)] = 1;
      }
    }
  }

  function reset() {
    var tries = 0;
    do {
      grid = [];
      for (var r = 0; r < N; r++) { grid[r] = []; for (var c = 0; c < N; c++) grid[r][c] = { shape: SHAPES[Math.floor(Math.random() * SHAPES.length)], rot: Math.floor(Math.random() * 4), open: null, fixed: false }; }
      buildPath();
      tries++;
    } while (!reachedGoal && tries < 60);
    // 为路径格匹配形状+旋转
    for (var r2 = 0; r2 < N; r2++) for (var c2 = 0; c2 < N; c2++) {
      var cell = grid[r2][c2];
      if (cell.open) {
        var found = false;
        for (var s = 0; s < SHAPES.length && !found; s++) for (var rr = 0; rr < 4 && !found; rr++) {
          var m = rotMask(SHAPES[s], rr);
          if (m[0] === cell.open[0] && m[1] === cell.open[1] && m[2] === cell.open[2] && m[3] === cell.open[3]) {
            cell.shape = SHAPES[s]; cell.rot = rr; cell.fixed = true; found = true;
          }
        }
        cell.open = null;
      }
    }
    // 打乱旋转（路径格仍可独立旋回，必可解）
    for (var r3 = 0; r3 < N; r3++) for (var c3 = 0; c3 < N; c3++) grid[r3][c3].rot = Math.floor(Math.random() * 4);
    won = false; rots = 0;
    if (solved()) { grid[sr][0].rot = (grid[sr][0].rot + 1) % 4; } // 避免开局即胜
  }

  function open(cell) { return rotMask(cell.shape, cell.rot); }

  function solved() {
    var visited = {}, q = [[sr, 0]];
    if (!open(grid[sr][0])[3]) return false; // 起点须朝左接水源
    visited[sr + ',' + 0] = true;
    while (q.length) {
      var cur = q.shift(), r = cur[0], c = cur[1], m = open(grid[r][c]);
      for (var d = 0; d < 4; d++) {
        if (!m[d]) continue;
        var dd = delta(d), nr = r + dd[0], nc = c + dd[1];
        if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
        if (visited[nr + ',' + nc]) continue;
        if (open(grid[nr][nc])[opp(d)]) { visited[nr + ',' + nc] = true; q.push([nr, nc]); }
      }
    }
    return visited[sk + ',' + (N - 1)] && open(grid[sk][N - 1])[1];
  }

  var SIZE = 480;
  var wrap = document.createElement('div');
  wrap.className = 'pp-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="pp-diff">' +
    '  <button class="btn mode-btn" data-n="4">4×4</button>' +
    '  <button class="btn mode-btn selected" data-n="5">5×5</button>' +
    '  <button class="btn mode-btn" data-n="6">6×6</button>' +
    '</div>' +
    '<canvas class="pp-canvas" id="pp-canvas" width="' + SIZE + '" height="' + SIZE + '"></canvas>' +
    '<div class="pp-top"><span>' + T('gs.pipe.rotLbl').replace('{n}', '<span id="pp-rots">0</span>') + '</span><span>' + T('gs.pipe.winCond') + '</span></div>' +
    '<div class="pp-msg" id="pp-msg">' + T('gs.pipe.hint') + '</div>' +
    '<div class="game-controls"><button id="pp-restart" class="btn purple">' + T('gs.pipe.newGame') + '</button></div>';
  root.appendChild(wrap);
  var diffRow = wrap.querySelector('#pp-diff');
  var canvas = wrap.querySelector('#pp-canvas'), ctx = canvas.getContext('2d'),
      rotsEl = wrap.querySelector('#pp-rots'), msg = wrap.querySelector('#pp-msg'),
      restartBtn = wrap.querySelector('#pp-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  function draw() {
    var cell = SIZE / N;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#0c0c18'; ctx.fillRect(0, 0, SIZE, SIZE);
    // 水源/出水口
    ctx.fillStyle = '#39ff14'; ctx.fillRect(0, sr * cell + cell / 2 - 6, 4, 12);
    ctx.fillStyle = '#ffe600'; ctx.fillRect(SIZE - 4, sk * cell + cell / 2 - 6, 4, 12);
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var x = c * cell, y = r * cell, cx = x + cell / 2, cy = y + cell / 2;
      var m = open(grid[r][c]);
      var lit = won; // 简单：胜利时全亮
      ctx.strokeStyle = lit ? '#39ff14' : '#00f0ff';
      ctx.lineWidth = Math.max(4, cell * 0.16); ctx.lineCap = 'round';
      if (m[0]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y); ctx.stroke(); }
      if (m[2]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y + cell); ctx.stroke(); }
      if (m[1]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x + cell, cy); ctx.stroke(); }
      if (m[3]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, cy); ctx.stroke(); }
      ctx.fillStyle = lit ? '#39ff14' : '#1a2a3a';
      ctx.beginPath(); ctx.arc(cx, cy, cell * 0.12, 0, 7); ctx.fill();
    }
  }

  function click(e) {
    if (won) return;
    var rect = canvas.getBoundingClientRect();
    var px = (e.clientX - rect.left) * (SIZE / rect.width);
    var py = (e.clientY - rect.top) * (SIZE / rect.height);
    var c = Math.floor(px / (SIZE / N)), r = Math.floor(py / (SIZE / N));
    if (r < 0 || c < 0 || r >= N || c >= N) return;
    grid[r][c].rot = (grid[r][c].rot + 1) % 4;
    rots++; rotsEl.textContent = rots;
    if (Arcade.juice) Arcade.juice.rotate();
    if (solved()) {
      won = true;
      msg.textContent = T('gs.pipe.win').replace('{n}', rots);
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(rots);
    }
    draw();
  }
  canvas.addEventListener('mousedown', click);
  canvas.addEventListener('touchstart', function (e) { click(e.touches[0]); e.preventDefault(); }, { passive: false });

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      N = parseInt(b.getAttribute('data-n'), 10);
      reset(); rotsEl.textContent = '0'; msg.textContent = T('gs.pipe.hint'); draw();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { reset(); rotsEl.textContent = '0'; msg.textContent = T('gs.pipe.hint'); draw(); if (Arcade.audio) Arcade.audio.play('ui'); });

  N = 5; reset(); draw();
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.pipe.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); rotsEl.textContent = '0'; msg.textContent = T('gs.pipe.hint'); draw(); };

})();