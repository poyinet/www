/* ============================================================
   扫雷：DOM 网格，初级 9x9/10 雷、中级 16x16/40 雷
   首次点击后再布雷（首点必安全）；Flood fill 展开；右旗插旗
   计时低分优（best-mode: min）
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.minesweeper.tut1t'), d: T('gs.minesweeper.tut1') },
    { t: T('gs.minesweeper.tut2t'), d: T('gs.minesweeper.tut2') },
    { t: T('gs.minesweeper.tut3t'), d: T('gs.minesweeper.tut3') }
  ];

  var DIFFS = {
    easy: { cols: 9, rows: 9, mines: 10 },
    mid:  { cols: 16, rows: 16, mines: 40 },
    hard: { cols: 20, rows: 20, mines: 80 }
  };

  root.innerHTML =
    '<div class="game-controls">' +
    '  <button id="diff-easy" class="btn green">' + T('gs.minesweeper.dEasy') + '</button>' +
    '  <button id="diff-mid" class="btn yellow">' + T('gs.minesweeper.dMid') + '</button>' +
    '  <button id="diff-hard" class="btn red">' + T('gs.minesweeper.dHard') + '</button>' +
    '  <button id="diff-custom" class="btn">' + T('gs.minesweeper.custom') + '</button>' +
    '</div>' +
    '<div class="ms-custom hidden" id="custom">' +
    '  <span>' + T('gs.minesweeper.cols') + '<input id="cust-cols" type="number" min="5" max="30" value="12"></span>' +
    '  <span>' + T('gs.minesweeper.rows') + '<input id="cust-rows" type="number" min="5" max="30" value="12"></span>' +
    '  <span>' + T('gs.minesweeper.mines') + '<input id="cust-mines" type="number" min="1" max="400" value="25"></span>' +
    '  <button id="cust-go" class="btn green">' + T('gs.minesweeper.go') + '</button>' +
    '</div>' +
    '<div class="game-message" id="msg">' + T('gs.minesweeper.msgInit') + '</div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.minesweeper.minesLeft') + ' <span class="stat-value" id="mines-left">10</span></span>' +
    '  <span>' + T('gs.minesweeper.timeFmt').replace('{n}', '<span class="stat-value" id="timer">0</span>') + '</span>' +
    '</div>' +
    '<div class="grid-board ms-board d-easy" id="board"></div>' +
    '<div class="game-controls">' +
    '  <button id="mode-btn" class="btn purple">' + T('gs.minesweeper.modeReveal') + '</button>' +
    '  <button id="restart-btn" class="btn pink">' + T('gs.minesweeper.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.minesweeper.help') + '</p>';

  var boardEl = document.getElementById('board');
  var msgEl = document.getElementById('msg');
  var minesLeftEl = document.getElementById('mines-left');
  var timerEl = document.getElementById('timer');
  var modeBtn = document.getElementById('mode-btn');
  var restartBtn = document.getElementById('restart-btn');
  var diffEasyBtn = document.getElementById('diff-easy');
  var diffMidBtn = document.getElementById('diff-mid');
  var diffHardBtn = document.getElementById('diff-hard');
  var diffCustomBtn = document.getElementById('diff-custom');
  var customEl = document.getElementById('custom');
  var custCols = document.getElementById('cust-cols');
  var custRows = document.getElementById('cust-rows');
  var custMines = document.getElementById('cust-mines');
  var custGo = document.getElementById('cust-go');

  var diff, cols, rows, mineCount;
  var cells;          // cells[r][c] = {mine, revealed, flagged, count, boom}
  var started, over, flags, revealedCount;
  var flagMode = false;
  var seconds = 0, timerId = null;

  function buildCells() {
    var g = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) {
        row.push({ mine: false, revealed: false, flagged: false, count: 0, boom: false });
      }
      g.push(row);
    }
    return g;
  }

  function init(conf) {
    diff = conf;
    cols = conf.cols;
    rows = conf.rows;
    mineCount = conf.mines;
    cells = buildCells();
    started = false;
    over = false;
    flags = 0;
    revealedCount = 0;
    flagMode = false;
    updateModeBtn();
    stopTimer();
    seconds = 0;
    timerEl.textContent = '0';
    minesLeftEl.textContent = String(mineCount);
    msgEl.textContent = T('gs.minesweeper.msgInit');
    msgEl.style.color = '';
    boardEl.className = 'grid-board ms-board ' + (cols <= 9 ? 'd-easy' : cols <= 14 ? 'd-mid' : 'd-hard');
    boardEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    render();
  }

  /* 首次点击后布雷：避开首点及其 8 邻域 */
  function placeMines(safeR, safeC) {
    var banned = {};
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        banned[(safeR + dr) + ',' + (safeC + dc)] = true;
      }
    }
    var placed = 0;
    while (placed < mineCount) {
      var r = Math.floor(Math.random() * rows);
      var c = Math.floor(Math.random() * cols);
      if (banned[r + ',' + c] || cells[r][c].mine) continue;
      cells[r][c].mine = true;
      placed++;
    }
    for (var rr = 0; rr < rows; rr++) {
      for (var cc = 0; cc < cols; cc++) {
        if (cells[rr][cc].mine) continue;
        var n = 0;
        forEachNeighbor(rr, cc, function (nr, nc) {
          if (cells[nr][nc].mine) n++;
        });
        cells[rr][cc].count = n;
      }
    }
  }

  function forEachNeighbor(r, c, fn) {
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
      }
    }
  }

  function startTimer() {
    stopTimer();
    seconds = 0;
    timerEl.textContent = '0';
    timerId = setInterval(function () {
      seconds++;
      timerEl.textContent = String(seconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function reveal(r, c) {
    if (over) return;
    var cell = cells[r][c];
    if (cell.revealed || cell.flagged) return;
    if (!started) {
      placeMines(r, c);
      started = true;
      startTimer();
    }
    if (cell.mine) {
      loseGame(r, c);
      return;
    }
    Arcade.juice.move();
    flood(r, c);
    if (!over && revealedCount === rows * cols - mineCount) winGame();
  }

  /* Flood fill 展开空白区 */
  function flood(r, c) {
    var stack = [[r, c]];
    while (stack.length) {
      var p = stack.pop();
      var rr = p[0], cc = p[1];
      var cell = cells[rr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      revealedCount++;
      if (cell.count === 0 && !cell.mine) {
        forEachNeighbor(rr, cc, function (nr, nc) {
          if (!cells[nr][nc].revealed) stack.push([nr, nc]);
        });
      }
    }
  }

  function toggleFlag(r, c) {
    if (over) return;
    var cell = cells[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    minesLeftEl.textContent = String(mineCount - flags);
    Arcade.juice.flip();
  }

  function loseGame(br, bc) {
    over = true;
    stopTimer();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (cells[r][c].mine) cells[r][c].revealed = true;
      }
    }
    cells[br][bc].boom = true;
    msgEl.textContent = T('gs.minesweeper.lose').replace('{s}', seconds);
    msgEl.style.color = 'var(--neon-pink)';
    Arcade.juice.lose();
  }

  function winGame() {
    over = true;
    stopTimer();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (cells[r][c].mine && !cells[r][c].flagged) cells[r][c].flagged = true;
      }
    }
    flags = mineCount;
    minesLeftEl.textContent = '0';
    msgEl.textContent = T('gs.minesweeper.win').replace('{s}', seconds);
    msgEl.style.color = 'var(--neon-green)';
    Arcade.shell.submitScore(seconds);
  }

  function render() {
    var html = '';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = cells[r][c];
        var cls = 'ms-cell';
        var text = '';
        if (cell.revealed) {
          if (cell.mine) {
            cls += cell.boom ? ' boom' : ' mine';
            text = '💣';
          } else {
            cls += ' open';
            if (cell.count > 0) {
              cls += ' n' + cell.count;
              text = String(cell.count);
            }
          }
        } else if (cell.flagged) {
          cls += ' flagged';
          text = '🚩';
        }
        html += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + text + '</div>';
      }
    }
    boardEl.innerHTML = html;
  }

  function cellFromEvent(e) {
    var t = e.target;
    while (t && t !== boardEl) {
      if (t.getAttribute && t.getAttribute('data-r') !== null) return t;
      t = t.parentNode;
    }
    return null;
  }

  boardEl.addEventListener('click', function (e) {
    var t = cellFromEvent(e);
    if (!t || over) return;
    var r = Number(t.getAttribute('data-r'));
    var c = Number(t.getAttribute('data-c'));
    if (flagMode) toggleFlag(r, c);
    else reveal(r, c);
    render();
  });

  boardEl.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var t = cellFromEvent(e);
    if (!t || over) return;
    toggleFlag(Number(t.getAttribute('data-r')), Number(t.getAttribute('data-c')));
    render();
  });

  function updateModeBtn() {
    modeBtn.textContent = flagMode ? T('gs.minesweeper.modeFlag') : T('gs.minesweeper.modeReveal');
  }

  modeBtn.addEventListener('click', function () {
    flagMode = !flagMode;
    updateModeBtn();
  });

  // 仅触屏设备显示「翻开/插旗」模式切换按钮
  if (!Arcade.input.isTouch()) {
    modeBtn.style.display = 'none';
  }

  diffEasyBtn.addEventListener('click', function () { init(DIFFS.easy); });
  diffMidBtn.addEventListener('click', function () { init(DIFFS.mid); });
  diffHardBtn.addEventListener('click', function () { init(DIFFS.hard); });
  diffCustomBtn.addEventListener('click', function () { customEl.classList.toggle('hidden'); });
  custGo.addEventListener('click', function () {
    var cc = Math.max(5, Math.min(30, parseInt(custCols.value, 10) || 12));
    var rr = Math.max(5, Math.min(30, parseInt(custRows.value, 10) || 12));
    // 首点 3×3 安全区最多占 9 格 → 雷数上限 = 格数 - 9，否则 placeMines 永不退出（死循环）
    var mm = Math.max(1, Math.min(cc * rr - 9, parseInt(custMines.value, 10) || 25));
    customEl.classList.add('hidden');
    init({ cols: cc, rows: rr, mines: mm });
  });
  restartBtn.addEventListener('click', function () { init(diff); });

  init(DIFFS.easy);    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.minesweeper.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { init(diff); };

})();