/* ============================================================
   2048：DOM 4x4 网格
   单行压缩合并 + 方向读写复用四方向；合并数值累加计分
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.g2048.tut1t'), d: T('gs.g2048.tut1') },
    { t: T('gs.g2048.tut2t'), d: T('gs.g2048.tut2') },
    { t: T('gs.g2048.tut3t'), d: T('gs.g2048.tut3') }
  ];

  var SIZE = 4;

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.g2048.hint') + '</div>' +
    '<div class="grid-board g2048-board" id="board"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.g2048.score') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.g2048.maxTile') + ' <span class="stat-value" id="max-tile">2</span></span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="undo-btn" class="btn">' + T('gs.g2048.undo') + '</button>' +
    '  <button id="restart-btn" class="btn pink">' + T('gs.g2048.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.g2048.help') + '</p>';

  var boardEl = document.getElementById('board');
  var msgEl = document.getElementById('msg');
  var scoreEl = document.getElementById('score');
  var maxTileEl = document.getElementById('max-tile');
  var restartBtn = document.getElementById('restart-btn');
  var undoBtn = document.getElementById('undo-btn');

  var grid, score, over, won, undoStack;
  var newCells, mergedCells; // Set<'r,c'>，用于 CSS 动画标记

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < SIZE; r++) g.push([0, 0, 0, 0]);
    return g;
  }

  function init() {
    grid = emptyGrid();
    score = 0;
    over = false;
    won = false;
    undoStack = [];
    newCells = new Set();
    mergedCells = new Set();
    scoreEl.textContent = '0';
    msgEl.textContent = T('gs.g2048.hint');
    msgEl.style.color = '';
    addRandomTile();
    addRandomTile();
    render();
  }

  function addRandomTile() {
    var empty = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (!empty.length) return;
    var pick = empty[Math.floor(Math.random() * empty.length)];
    grid[pick[0]][pick[1]] = Math.random() < 0.9 ? 2 : 4;
    newCells.add(pick[0] + ',' + pick[1]);
  }

  /* 单行压缩合并：去零 → 相邻相等合并（每格每步只合一次）→ 补零 */
  function compress(line) {
    var nums = line.filter(function (v) { return v !== 0; });
    var out = [];
    var gained = 0;
    var mergedAt = [];
    for (var i = 0; i < nums.length; i++) {
      if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
        var v = nums[i] * 2;
        out.push(v);
        gained += v;
        mergedAt.push(out.length - 1);
        i++;
      } else {
        out.push(nums[i]);
      }
    }
    while (out.length < SIZE) out.push(0);
    return { line: out, gained: gained, mergedAt: mergedAt };
  }

  /* 取出沿移动方向的第 i 条线（靠目标边的格子排在最前） */
  function getLine(dirKey, i) {
    var line = [];
    for (var j = 0; j < SIZE; j++) {
      if (dirKey === 'left') line.push(grid[i][j]);
      else if (dirKey === 'right') line.push(grid[i][SIZE - 1 - j]);
      else if (dirKey === 'up') line.push(grid[j][i]);
      else line.push(grid[SIZE - 1 - j][i]); // down
    }
    return line;
  }

  function setLine(dirKey, i, line, mergedAt) {
    var changed = false;
    for (var j = 0; j < SIZE; j++) {
      var r, c;
      if (dirKey === 'left') { r = i; c = j; }
      else if (dirKey === 'right') { r = i; c = SIZE - 1 - j; }
      else if (dirKey === 'up') { r = j; c = i; }
      else { r = SIZE - 1 - j; c = i; }
      if (grid[r][c] !== line[j]) changed = true;
      grid[r][c] = line[j];
      if (mergedAt.indexOf(j) !== -1) mergedCells.add(r + ',' + c);
    }
    return changed;
  }

  function hasValue(v) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === v) return true;
      }
    }
    return false;
  }

  function canMove() {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return true;
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  function move(dirKey) {
    if (over) return;
    var snapshot = { grid: grid.map(function (r) { return r.slice(); }), score: score };
    newCells = new Set();
    mergedCells = new Set();
    var moved = false;
    var gainedTotal = 0;

    for (var i = 0; i < SIZE; i++) {
      var res = compress(getLine(dirKey, i));
      gainedTotal += res.gained;
      if (setLine(dirKey, i, res.line, res.mergedAt)) moved = true;
    }
    if (!moved) return;

    undoStack.push(snapshot);
    score += gainedTotal;
    scoreEl.textContent = String(score);
    if (gainedTotal > 0) Arcade.juice.clear();
    else Arcade.juice.move();
    addRandomTile();
    render();

    if (!won && hasValue(2048)) {
      won = true;
      msgEl.textContent = T('gs.g2048.won');
      msgEl.style.color = 'var(--neon-green)';
    }
    if (!canMove()) {
      over = true;
      msgEl.textContent = T('gs.g2048.over').replace('{s}', score);
      msgEl.style.color = 'var(--neon-pink)';
      Arcade.shell.submitScore(score);
    }
  }

  function render() {
    var html = '';
    var max = 0;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var v = grid[r][c];
        if (v > max) max = v;
        var cls = 'g2048-cell';
        var text = '';
        if (v !== 0) {
          cls += ' v' + (v <= 2048 ? v : 'super');
          if (newCells.has(r + ',' + c)) cls += ' tile-new';
          if (mergedCells.has(r + ',' + c)) cls += ' tile-merged';
          text = String(v);
        }
        html += '<div class="' + cls + '">' + text + '</div>';
      }
    }
    boardEl.innerHTML = html;
    maxTileEl.textContent = String(max);
  }

  Arcade.input.onKeys({
    up: function () { move('up'); },
    down: function () { move('down'); },
    left: function () { move('left'); },
    right: function () { move('right'); }
  });

  Arcade.input.onSwipe(boardEl, move);

  function undo() {
    if (!undoStack.length) return;
    var s = undoStack.pop();
    grid = s.grid.map(function (r) { return r.slice(); });
    score = s.score;
    over = false;
    won = false;
    newCells = new Set();
    mergedCells = new Set();
    scoreEl.textContent = String(score);
    msgEl.textContent = T('gs.g2048.undone');
    msgEl.style.color = '';
    render();
  }

  restartBtn.addEventListener('click', init);
  undoBtn.addEventListener('click', undo);
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyU') { e.preventDefault(); undo(); }
  });

  init();    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.g2048.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = init;

})();