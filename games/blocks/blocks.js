/* ============================================================
   俄罗斯方块：Canvas 240x480（10x20 格）+ NEXT 预览 + HOLD 暂存
   7 种方块 4x4 矩阵 + 霓虹 7 色；简化踢墙；消行闪烁后消失
   重力用 loop.setStep（800ms 起，每级 -70ms，最低 100ms）
   提质：HOLD 暂存、ghost 落点预览、软降/硬降计分、顶部堆叠压力
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.blocks.tut1t'), d: T('gs.blocks.tut1') },
    { t: T('gs.blocks.tut2t'), d: T('gs.blocks.tut2') },
    { t: T('gs.blocks.tut3t'), d: T('gs.blocks.tut3') }
  ];

  var COLS = 10, ROWS = 20, CELL = 24;

  var SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    T: [[0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    S: [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    Z: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    L: [[0, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
  };
  var COLORS = {
    I: '#00f0ff', O: '#ffe600', T: '#b967ff', S: '#39ff14',
    Z: '#ff2d95', J: '#2d7dff', L: '#ff9f1c'
  };
  var TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  var LINE_SCORE = [0, 100, 300, 500, 800];
  var CLEAR_TICKS = 6;      // 消行闪烁步数（动画期间步长切到 60ms）
  var CLEAR_STEP_MS = 60;

  root.innerHTML =
    '<div class="blocks-layout">' +
    '  <div class="blocks-stage">' +
    '    <canvas id="board" class="game-canvas" width="240" height="480"></canvas>' +
    '    <div class="blocks-overlay hidden" id="overlay">' +
    '      <div class="blocks-overlay-title">' + T('gs.blocks.gameOver') + '</div>' +
    '      <div class="blocks-overlay-score">' + T('gs.blocks.score') + ' <span id="final-score">0</span></div>' +
    '      <button id="restart-btn" class="btn green">' + T('gs.blocks.restart') + '</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="blocks-side">' +
    '    <div class="blocks-next-label">HOLD</div>' +
    '    <canvas id="hold" class="blocks-next" width="96" height="96"></canvas>' +
    '    <div class="blocks-next-label">NEXT</div>' +
    '    <canvas id="next" class="blocks-next" width="96" height="96"></canvas>' +
    '  </div>' +
    '</div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.blocks.score') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.blocks.level') + ' <span class="stat-value" id="level">1</span></span>' +
    '  <span>' + T('gs.blocks.linesFmt').replace('{n}', '<span class="stat-value" id="lines">0</span>') + '</span>' +
    '  <span id="sprint-label" style="display:none">' + T('gs.blocks.sprintDash') + '</span>' +
    '</div>' +
    '<div class="game-controls blocks-touch" id="touch-controls" style="display:none">' +
    '  <button class="btn" data-act="left" aria-label="' + T('gs.blocks.ariaLeft') + '">←</button>' +
    '  <button class="btn" data-act="right" aria-label="' + T('gs.blocks.ariaRight') + '">→</button>' +
    '  <button class="btn" data-act="down" aria-label="' + T('gs.blocks.ariaSoftDrop') + '">↓</button>' +
    '  <button class="btn purple" data-act="rotate" aria-label="' + T('gs.blocks.ariaRotate') + '">⟳</button>' +
    '  <button class="btn yellow" data-act="drop" aria-label="' + T('gs.blocks.ariaHardDrop') + '">⤓</button>' +
    '  <button class="btn teal" data-act="hold" aria-label="' + T('gs.blocks.ariaHold') + '">⇄</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.blocks.help') + '</p>';

  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var nextCanvas = document.getElementById('next');
  var nctx = nextCanvas.getContext('2d');
  var holdCanvas = document.getElementById('hold');
  var hctx = holdCanvas.getContext('2d');
  var overlayEl = document.getElementById('overlay');
  var finalScoreEl = document.getElementById('final-score');
  var restartBtn = document.getElementById('restart-btn');
  var scoreEl = document.getElementById('score');
  var levelEl = document.getElementById('level');
  var linesEl = document.getElementById('lines');
  sprintLabel = document.getElementById('sprint-label');
  var sprintBtn = document.createElement('button');
  sprintBtn.className = 'btn yellow';
  sprintBtn.textContent = T('gs.blocks.sprintBtn');
  sprintBtn.style.marginTop = '6px';
  sprintBtn.addEventListener('click', function () {
    sprintMode = !sprintMode;
    sprintBtn.textContent = sprintMode ? T('gs.blocks.sprintExit') : T('gs.blocks.sprintBtn');
    sprintBtn.style.background = sprintMode ? 'var(--neon-yellow)' : '';
    sprintBtn.style.color = sprintMode ? '#1a1400' : '';
    sprintLabel.style.display = sprintMode ? '' : 'none';
    init();
    if (gameLoop && !gameLoop.isRunning()) gameLoop.resume();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  var controlsRow = document.querySelector('.game-controls');
  if (controlsRow) controlsRow.appendChild(sprintBtn);
  var touchEl = document.getElementById('touch-controls');

  var board, cur, nextType, holdType, canHold, score, level, lines, over, clearAnim;
  // sprintLabel 在 83 行先赋值；此处仅声明不赋 null，避免覆盖（修复 sprint 计时不显示）
  var sprintStart = Date.now(), sprintLabel, sprintMode = false;  var paused = false, pausedAt = 0, pausedShift = 0;
  var gameLoop;

  function stepFor(lv) {
    return Math.max(100, 800 - (lv - 1) * 70);
  }

  function emptyRow() {
    var row = [];
    for (var c = 0; c < COLS; c++) row.push(0);
    return row;
  }

  function emptyBoard() {
    var b = [];
    for (var r = 0; r < ROWS; r++) b.push(emptyRow());
    return b;
  }

  function randomType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function init() {
    board = emptyBoard();
    score = 0;
    level = 1;
    lines = 0;
    over = false;
    clearAnim = null;
    holdType = null;
    canHold = true;
    nextType = randomType();
    paused = false;
    pausedShift = 0;
    sprintStart = Date.now();
    spawn();
    drawHold();
    updateStats();
    overlayEl.classList.add('hidden');
    if (sprintLabel) sprintLabel.textContent = T('gs.blocks.sprintInit');
  }

  /** 完全重开：复位竞速模式（按钮/标签状态同步），再 init */
  function fullRestart() {
    sprintMode = false;
    paused = false;
    pausedShift = 0;
    if (sprintBtn) {
      sprintBtn.textContent = T('gs.blocks.sprintBtn');
      sprintBtn.style.background = '';
      sprintBtn.style.color = '';
    }
    if (sprintLabel) sprintLabel.style.display = 'none';
    if (gameLoop && gameLoop.isRunning()) gameLoop.resume();
    init();
  }

  /** P 键暂停/继续（实时类约定）；竞速计时冻结 */
  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) {
      pausedAt = Date.now();
      if (gameLoop) gameLoop.pause();
      if (Arcade.ui) Arcade.ui.toast(T('gs.blocks.paused'), 'warn');
      if (Arcade.audio) Arcade.audio.play('ui');
    } else {
      pausedShift += Date.now() - pausedAt;
      if (gameLoop && !gameLoop.isRunning()) gameLoop.resume();
      if (Arcade.audio) Arcade.audio.play('ui');
    }
  }

  function updateStats() {
    scoreEl.textContent = String(score);
    levelEl.textContent = String(level);
    linesEl.textContent = String(lines);
  }

  function collides(matrix, px, py) {
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        if (!matrix[r][c]) continue;
        var bx = px + c, by = py + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function newCurrent(type) {
    cur = { type: type, m: SHAPES[type], x: 3, y: 0 };
    if (collides(cur.m, cur.x, cur.y)) gameOver();
  }

  function spawn() {
    newCurrent(nextType);
    nextType = randomType();
    drawNext();
    canHold = true;
  }

  /* HOLD 暂存：每次落定后解锁一次，防无限 swap 刷分 */
  function holdSwap() {
    if (over || clearAnim || !cur || !canHold) return;
    Arcade.juice.rotate();
    var t = cur.type;
    if (holdType === null) {
      holdType = t;
      newCurrent(nextType);
      nextType = randomType();
      drawNext();
    } else {
      var h = holdType;
      holdType = t;
      newCurrent(h);
    }
    canHold = false;
    drawHold();
  }

  function rotate(matrix) {
    var out = [];
    for (var r = 0; r < 4; r++) {
      var row = [];
      for (var c = 0; c < 4; c++) row.push(matrix[3 - c][r]);
      out.push(row);
    }
    return out;
  }

  /* 简化踢墙：原地 → 左移1 → 右移1 → 上移1 */
  function tryRotate() {
    if (over || clearAnim || !cur) return;
    var rm = rotate(cur.m);
    var kicks = [[0, 0], [-1, 0], [1, 0], [0, -1]];
    for (var i = 0; i < kicks.length; i++) {
      var nx = cur.x + kicks[i][0];
      var ny = cur.y + kicks[i][1];
      if (!collides(rm, nx, ny)) {
        cur.m = rm;
        cur.x = nx;
        cur.y = ny;
        return;
      }
    }
  }

  function tryMove(dx, dy) {
    if (over || clearAnim || !cur) return false;
    if (!collides(cur.m, cur.x + dx, cur.y + dy)) {
      cur.x += dx;
      cur.y += dy;
      return true;
    }
    return false;
  }

  function softDrop() {
    if (tryMove(0, 1)) { score += 1; updateStats(); }
  }

  function hardDrop() {
    if (over || clearAnim || !cur) return;
    var dist = 0;
    while (!collides(cur.m, cur.x, cur.y + 1)) { cur.y++; dist++; }
    if (dist > 0) { score += dist * 2; updateStats(); }
    lockPiece();
  }

  function lockPiece() {
    var topOut = false;
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        if (!cur.m[r][c]) continue;
        var bx = cur.x + c, by = cur.y + r;
        if (by < 0) { topOut = true; continue; }
        board[by][bx] = cur.type;
      }
    }
    if (topOut) return gameOver();

    var full = [];
    for (var rr = 0; rr < ROWS; rr++) {
      var isFull = true;
      for (var cc = 0; cc < COLS; cc++) {
        if (!board[rr][cc]) { isFull = false; break; }
      }
      if (isFull) full.push(rr);
    }

    if (full.length) {
      Arcade.juice.clear();
      lines += full.length;
      score += LINE_SCORE[full.length] * level;
      var newLevel = Math.floor(lines / 10) + 1;
      if (newLevel !== level) level = newLevel;
      updateStats();
      if (sprintMode && lines >= 40) {
        over = true;
        gameLoop.pause();
        var sec = Math.round((Date.now() - sprintStart) / 1000);
        var mm = Math.floor(sec / 60), ss = sec % 60;
        if (Arcade.ui) Arcade.ui.toast(T('gs.blocks.sprintDone').replace('{m}', mm).replace('{s}', (ss < 10 ? '0' : '') + ss), 'win');
        finalScoreEl.textContent = String(score);
        overlayEl.classList.remove('hidden');
        if (Arcade.juice) Arcade.juice.win();
        /* E2E 评审修复：竞速模式提交用时秒与 bestMode=max 方向相反，不再提交（普通模式 score 提交正确） */
        return;
      }
      cur = null;
      clearAnim = { rows: full, ticks: CLEAR_TICKS };
      gameLoop.setStep(CLEAR_STEP_MS); // 闪烁动画期间切快步长
    } else {
      spawn();
    }
  }

  function finishClear() {
    var clearing = clearAnim.rows;
    board = board.filter(function (_, idx) { return clearing.indexOf(idx) === -1; });
    while (board.length < ROWS) board.unshift(emptyRow());
    clearAnim = null;
    gameLoop.setStep(stepFor(level));
    spawn();
  }

  function gameOver() {
    over = true;
    gameLoop.pause();
    finalScoreEl.textContent = String(score);
    overlayEl.classList.remove('hidden');
    Arcade.shell.submitScore(score);
  }

  function update() {
    if (over) return;
    if (paused) return;
    if (sprintMode && sprintLabel) {
      var sec = Math.round((Date.now() - pausedShift - sprintStart) / 1000);
      var mm = Math.floor(sec / 60), ss = sec % 60;
      sprintLabel.textContent = T('gs.blocks.sprintTime').replace('{t}', mm + ':' + (ss < 10 ? '0' : '') + ss);
    }
    if (clearAnim) {
      clearAnim.ticks--;
      if (clearAnim.ticks <= 0) finishClear();
      return;
    }
    if (!cur) return;
    if (!collides(cur.m, cur.x, cur.y + 1)) {
      cur.y++;
    } else {
      lockPiece();
    }
  }

  function drawCell(gx, gy, color, blur) {
    var x = gx * CELL, y = gy * CELL;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.restore();
    // 顶部高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x + 3, y + 3, CELL - 6, 4);
  }

  function render() {
    ctx.fillStyle = '#07070d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 淡网格线
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 1; i < COLS; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, canvas.height);
    }
    for (var j = 1; j < ROWS; j++) {
      ctx.moveTo(0, j * CELL + 0.5);
      ctx.lineTo(canvas.width, j * CELL + 0.5);
    }
    ctx.stroke();

    // 已锁定方块
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(c, r, COLORS[board[r][c]], 6);
      }
    }

    // ghost 落点预览（半透明影子）
    if (cur && !clearAnim) {
      var gy = cur.y;
      while (!collides(cur.m, cur.x, gy + 1)) gy++;
      ctx.save();
      ctx.globalAlpha = 0.26;
      for (var gmr = 0; gmr < 4; gmr++) {
        for (var gmc = 0; gmc < 4; gmc++) {
          if (!cur.m[gmr][gmc]) continue;
          var gby = gy + gmr;
          if (gby < 0) continue;
          drawCell(cur.x + gmc, gby, COLORS[cur.type], 0);
        }
      }
      ctx.restore();
    }

    // 消行闪烁（偶数 tick 盖白）
    if (clearAnim && clearAnim.ticks % 2 === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 16;
      for (var k = 0; k < clearAnim.rows.length; k++) {
        ctx.fillRect(0, clearAnim.rows[k] * CELL, canvas.width, CELL);
      }
      ctx.restore();
    }

    // 当前下落方块
    if (cur) {
      for (var mr = 0; mr < 4; mr++) {
        for (var mc = 0; mc < 4; mc++) {
          if (!cur.m[mr][mc]) continue;
          var by = cur.y + mr;
          if (by < 0) continue;
          drawCell(cur.x + mc, by, COLORS[cur.type], 12);
        }
      }
    }
  }

  function drawNext() {
    nctx.fillStyle = '#07070d';
    nctx.fillRect(0, 0, 96, 96);
    var m = SHAPES[nextType];
    var minR = 4, maxR = -1, minC = 4, maxC = -1;
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        if (m[r][c]) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    var cell = 20;
    var w = (maxC - minC + 1) * cell;
    var h = (maxR - minR + 1) * cell;
    var offX = (96 - w) / 2;
    var offY = (96 - h) / 2;
    var color = COLORS[nextType];
    for (var rr = minR; rr <= maxR; rr++) {
      for (var cc = minC; cc <= maxC; cc++) {
        if (!m[rr][cc]) continue;
        var x = offX + (cc - minC) * cell;
        var y = offY + (rr - minR) * cell;
        nctx.save();
        nctx.shadowColor = color;
        nctx.shadowBlur = 10;
        nctx.fillStyle = color;
        nctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        nctx.restore();
      }
    }
  }

  function drawHold() {
    hctx.fillStyle = '#07070d';
    hctx.fillRect(0, 0, 96, 96);
    if (!holdType) return;
    var m = SHAPES[holdType];
    var minR = 4, maxR = -1, minC = 4, maxC = -1;
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        if (m[r][c]) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    var cell = 20;
    var w = (maxC - minC + 1) * cell;
    var h = (maxR - minR + 1) * cell;
    var offX = (96 - w) / 2;
    var offY = (96 - h) / 2;
    var color = COLORS[holdType];
    for (var rr = minR; rr <= maxR; rr++) {
      for (var cc = minC; cc <= maxC; cc++) {
        if (!m[rr][cc]) continue;
        var x = offX + (cc - minC) * cell;
        var y = offY + (rr - minR) * cell;
        hctx.save();
        hctx.shadowColor = color;
        hctx.shadowBlur = 10;
        hctx.fillStyle = color;
        hctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        hctx.restore();
      }
    }
  }

  Arcade.input.onKeys({
    left: function () { tryMove(-1, 0); Arcade.juice.move(); },
    right: function () { tryMove(1, 0); Arcade.juice.move(); },
    down: function () { softDrop(); Arcade.juice.move(); },
    up: function () { tryRotate(); Arcade.juice.rotate(); },
    action: function () { hardDrop(); Arcade.juice.drop(); }
  });

  // HOLD 暂存键（C / Shift）+ P 暂停
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
      holdSwap();
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
    }
  });

  // 触屏按钮行（仅触屏显示）
  if (Arcade.input.isTouch()) {
    touchEl.style.display = '';
    var btns = touchEl.getElementsByTagName('button');
    for (var bi = 0; bi < btns.length; bi++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.getAttribute('data-act');
          if (act === 'left') tryMove(-1, 0);
          else if (act === 'right') tryMove(1, 0);
          else if (act === 'down') softDrop();
          else if (act === 'rotate') tryRotate();
          else if (act === 'drop') hardDrop();
          else if (act === 'hold') holdSwap();
        });
      })(btns[bi]);
    }
  }

  restartBtn.addEventListener('click', function () {
    fullRestart();
    gameLoop.setStep(stepFor(level));
    if (!gameLoop.isRunning()) gameLoop.resume();
  });

  init();
  gameLoop = Arcade.loop.start(update, render, stepFor(level));    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.blocks.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = fullRestart;

})();