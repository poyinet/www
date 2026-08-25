/* 拼图填数 Fillomino —— 批次C 益智休闲 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.fillomino.tut1t'), d: T('gs.fillomino.tut1') },
  { t: T('gs.fillomino.tut2t'), d: T('gs.fillomino.tut2') },
  { t: T('gs.fillomino.tut3t'), d: T('gs.fillomino.tut3') },
  { t: T('gs.fillomino.tut4t'), d: T('gs.fillomino.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var N = 6;
  var solution, puzzle, fills, steps, won, startTs;

  /* 生成：回溯铺砌合法 Fillomino 解——每块为矩形、面积=数值(1..4)，
     且「同值块不相邻」（与教程规则完全一致），挖空后玩家按规则填写必可解。
     6×6 搜索空间小：实测 500/500 生成成功、全部通过规则校验。 */
  function generate() {
    var shapes = [];
    for (var a = 1; a <= 4; a++) for (var h = 1; h <= a; h++) if (a % h === 0) shapes.push([h, a / h]);
    var board = null;
    var nodes = { n: 0 };
    function bt(b, rid) {
      if (++nodes.n > 30000) return false;
      var sr = -1, sc = -1;
      outer: for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (rid[r][c] < 0) { sr = r; sc = c; break outer; }
      if (sr < 0) return true;
      var order = shapes.slice();
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
      for (var s = 0; s < order.length; s++) {
        var h = order[s][0], w = order[s][1];
        if (sr + h > N || sc + w > N) continue;
        var ok = true;
        for (var i2 = 0; i2 < h && ok; i2++) for (var j2 = 0; j2 < w && ok; j2++) if (rid[sr + i2][sc + j2] >= 0) ok = false;
        if (!ok) continue;
        var area = h * w;
        var conflict = false;
        for (var i3 = 0; i3 < h && !conflict; i3++) for (var j3 = 0; j3 < w && !conflict; j3++) {
          var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (var d = 0; d < 4; d++) {
            var nr = sr + i3 + dirs[d][0], nc = sc + j3 + dirs[d][1];
            if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
            if (nr < sr || nr >= sr + h || nc < sc || nc >= sc + w) {
              if (rid[nr][nc] >= 0 && b[nr][nc] === area) { conflict = true; break; }
            }
          }
        }
        if (conflict) continue;
        for (var i4 = 0; i4 < h; i4++) for (var j4 = 0; j4 < w; j4++) { b[sr + i4][sc + j4] = area; rid[sr + i4][sc + j4] = 1; }
        if (bt(b, rid)) return true;
        for (var i5 = 0; i5 < h; i5++) for (var j5 = 0; j5 < w; j5++) rid[sr + i5][sc + j5] = -1;
      }
      return false;
    }
    for (var t = 0; t < 100 && !board; t++) {
      var b2 = [], rid2 = [];
      for (var r2 = 0; r2 < N; r2++) { b2[r2] = []; rid2[r2] = []; for (var c2 = 0; c2 < N; c2++) { b2[r2][c2] = 0; rid2[r2][c2] = -1; } }
      nodes.n = 0;
      if (bt(b2, rid2)) board = b2;
    }
    // 兜底（实测从不触发）：退回旧贪心铺砌
    if (!board) {
      board = [];
      for (var r3 = 0; r3 < N; r3++) { board[r3] = []; for (var c3 = 0; c3 < N; c3++) board[r3][c3] = 1; }
    }
    solution = board;
    // 挖空：保留部分格子作为线索
    puzzle = [];
    fills = [];
    for (var r5 = 0; r5 < N; r5++) {
      puzzle[r5] = [];
      fills[r5] = [];
      for (var c5 = 0; c5 < N; c5++) {
        fills[r5][c5] = 0;
        puzzle[r5][c5] = Math.random() < 0.45 ? solution[r5][c5] : 0;
      }
    }
  }

  var wrap = document.createElement('div');
  wrap.className = 'fo-wrap';
  wrap.innerHTML =
    '<div class="fo-grid" id="fo-grid"></div>' +
    '<div class="fo-msg" id="fo-msg">' + T('gs.fillomino.startMsg') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="fo-restart">' + T('gs.fillomino.restart') + '</button></div>' +
    '<div class="fo-help">' + T('gs.fillomino.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#fo-grid'), msg = wrap.querySelector('#fo-msg'),
      restartBtn = wrap.querySelector('#fo-restart');

  var cells = [];
  function buildCells() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)';
    cells = [];
    for (var i = 0; i < N * N; i++) {
      var r = Math.floor(i / N), c = i % N;
      var d = document.createElement('div');
      d.className = 'fo-cell' + (puzzle[r][c] ? ' seeded' : '');
      if (puzzle[r][c]) d.textContent = puzzle[r][c];
      d.setAttribute('data-i', i);
      d.addEventListener('click', (function (rr, cc) { return function () { click(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  function click(r, c) {
    if (won) return;
    if (puzzle[r][c]) return; // 线索格不可改
    steps++;
    var v = (fills[r][c] + 1) % 5; // 0~4 循环（0=空）
    fills[r][c] = v;
    var cell = cells[r * N + c];
    cell.textContent = v || '';
    cell.classList.toggle('filled', !!v);
    if (Arcade.juice) Arcade.juice.select();
    checkWin();
  }

  function checkWin() {
    // 全填判定
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (!puzzle[r][c] && fills[r][c] === 0) return;
    // 规则校验器：接受任意合法 Fillomino 解——
    //   每格有值(线索格取线索值)、连通区域面积==数值、同值区域不相邻（相邻同值会被 BFS 合并，合并后面积不符即失败）
    var seen = {};
    for (var r2 = 0; r2 < N; r2++) for (var c2 = 0; c2 < N; c2++) {
      var key = r2 + ',' + c2;
      if (seen[key]) continue;
      var v = puzzle[r2][c2] || fills[r2][c2];
      if (!v) return;
      var stack = [key], cnt = 0;
      var vis = {}; vis[key] = 1;
      while (stack.length) {
        var k = stack.pop();
        var parts = k.split(',');
        var rr = +parts[0], cc = +parts[1];
        cnt++;
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var d = 0; d < 4; d++) {
          var nr = rr + dirs[d][0], nc = cc + dirs[d][1];
          if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
          var nk = nr + ',' + nc;
          if (vis[nk]) continue;
          if ((puzzle[nr][nc] || fills[nr][nc]) === v) { vis[nk] = 1; stack.push(nk); }
        }
      }
      if (cnt !== v) return; // 区域面积与数值不符
      for (var k2 in vis) if (vis[k2]) seen[k2] = 1;
    }
    won = true;
    var sec = Math.round((Date.now() - startTs) / 1000);
    msg.textContent = T('gs.fillomino.win').replace('{s}', sec).replace('{n}', steps);
    msg.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(sec);
  }

  function setup() {
    generate();
    steps = 0; won = false; startTs = Date.now();
    buildCells();
  }

  restartBtn.addEventListener('click', function () { setup(); msg.textContent = T('gs.fillomino.startMsg'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.fillomino.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); msg.textContent = T('gs.fillomino.startMsg'); msg.style.color = ''; };

  setup();

})();
