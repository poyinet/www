/* 电路连接 Circuit —— 批次C 益智休闲（复用 pipe 已验证的可解生成器） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.circuit.tut1t'), d: T('gs.circuit.tut1') },
  { t: T('gs.circuit.tut2t'), d: T('gs.circuit.tut2') },
  { t: T('gs.circuit.tut3t'), d: T('gs.circuit.tut3') }
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
  function delta(d) { return [[-1, 0], [0, 1], [1, 0], [0, -1]][d]; } // 0上 1右 2下 3左

  function buildPath() {
    sr = Math.floor(Math.random() * N); // 电源行
    sk = Math.floor(Math.random() * N); // 灯泡行
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
      if (!grid[sr][0].open) grid[sr][0].open = [0, 0, 0, 0];
      grid[sr][0].open[3] = 1; // 电源朝左（左边界）
      if (!grid[sk][N - 1].open) grid[sk][N - 1].open = [0, 0, 0, 0];
      grid[sk][N - 1].open[1] = 1; // 灯泡朝右（右边界）
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
    for (var r3 = 0; r3 < N; r3++) for (var c3 = 0; c3 < N; c3++) grid[r3][c3].rot = Math.floor(Math.random() * 4);
    won = false; rots = 0;
    if (solved()) { grid[sr][0].rot = (grid[sr][0].rot + 1) % 4; }
  }

  function open(cell) { return rotMask(cell.shape, cell.rot); }

  function solved() {
    var visited = {}, q = [[sr, 0]];
    if (!open(grid[sr][0])[3]) return false;
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
  wrap.className = 'ci-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="ci-diff">' +
    '  <button class="btn mode-btn" data-n="4">4×4</button>' +
    '  <button class="btn mode-btn selected" data-n="5">5×5</button>' +
    '  <button class="btn mode-btn" data-n="6">6×6</button>' +
    '</div>' +
    '<canvas class="ci-canvas" id="ci-canvas" width="' + SIZE + '" height="' + SIZE + '"></canvas>' +
    '<div class="ci-top"><span>' + T('gs.circuit.rotCount').replace('{n}', '<span id="ci-rots">0</span>') + '</span><span>' + T('gs.circuit.goal') + '</span></div>' +
    '<div class="ci-msg" id="ci-msg">' + T('gs.circuit.startMsg') + '</div>' +
    '<div class="game-controls"><button id="ci-restart" class="btn purple">' + T('gs.circuit.restart') + '</button></div>';
  root.appendChild(wrap);
  var diffRow = wrap.querySelector('#ci-diff');
  var canvas = wrap.querySelector('#ci-canvas'), ctx = canvas.getContext('2d'),
      rotsEl = wrap.querySelector('#ci-rots'), msg = wrap.querySelector('#ci-msg'),
      restartBtn = wrap.querySelector('#ci-restart');

  function draw() {
    var cell = SIZE / N;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#0a0a16'; ctx.fillRect(0, 0, SIZE, SIZE);
    // 电源 / 灯泡
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 16, sr * cell + cell / 2);
    ctx.fillText('💡', SIZE - 16, sk * cell + cell / 2);
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var x = c * cell, y = r * cell, cx = x + cell / 2, cy = y + cell / 2;
      var m = open(grid[r][c]);
      var lit = won;
      ctx.strokeStyle = lit ? '#ffe600' : '#00f0ff';
      ctx.lineWidth = Math.max(4, cell * 0.15); ctx.lineCap = 'round';
      if (m[0]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y); ctx.stroke(); }
      if (m[2]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y + cell); ctx.stroke(); }
      if (m[1]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x + cell, cy); ctx.stroke(); }
      if (m[3]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, cy); ctx.stroke(); }
      ctx.fillStyle = lit ? '#ffe600' : '#13233a';
      ctx.beginPath(); ctx.arc(cx, cy, cell * 0.11, 0, 7); ctx.fill();
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
      msg.textContent = T('gs.circuit.win').replace('{r}', T('gs.circuit.rotCount').replace('{n}', rots));
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
      reset(); rotsEl.textContent = '0'; msg.textContent = T('gs.circuit.startMsg'); draw();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { reset(); rotsEl.textContent = '0'; msg.textContent = T('gs.circuit.startMsg'); draw(); if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { reset(); rotsEl.textContent = '0'; msg.textContent = T('gs.circuit.startMsg'); draw(); };

  N = 5; reset(); draw();

})();
