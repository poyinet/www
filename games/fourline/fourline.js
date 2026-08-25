/* 四子棋 Four in a Row (vs AI) —— P2 逻辑解谜 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.fourline.tut1t'), d: T('gs.fourline.tut1') },
  { t: T('gs.fourline.tut2t'), d: T('gs.fourline.tut2') },
  { t: T('gs.fourline.tut3t'), d: T('gs.fourline.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var COLS = 7, ROWS = 6, board = [], turn = 1, over = false, streak = 0, aiLevel = 'medium';
  var aiTimer = null; // AI 落子定时器：重开时清除，防止旧局 AI 在新局落子

  function reset() {
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
    board = []; for (var r = 0; r < ROWS; r++) { board[r] = []; for (var c = 0; c < COLS; c++) board[r][c] = 0; }
    turn = 1; over = false; render();
  }

  var wrap = document.createElement('div');
  wrap.className = 'c4-wrap';
  wrap.innerHTML =
    '<div class="c4-top" id="c4-top">' + T('gs.fourline.hudStreak').replace('{n}', 0) + ' · ' + T('gs.fourline.yourTurn') + '</div>' +
    '<div class="game-controls c4-diffs" id="c4-diffs">' +
    '  <button class="btn purple mode-btn" data-level="easy">' + T('gs.fourline.dEasy') + '</button>' +
    '  <button class="btn pink mode-btn active" data-level="medium">' + T('gs.fourline.dMedium') + '</button>' +
    '  <button class="btn green mode-btn" data-level="hard">' + T('gs.fourline.dHard') + '</button>' +
    '</div>' +
    '<div class="c4-board" id="c4-board"></div>' +
    '<div class="c4-msg" id="c4-msg"></div>';
  root.appendChild(wrap);
  var boardEl = wrap.querySelector('#c4-board'), top = wrap.querySelector('#c4-top'), msg = wrap.querySelector('#c4-msg');
  var cells = [];
  for (var i = 0; i < ROWS * COLS; i++) {
    var cell = document.createElement('div'); cell.className = 'c4-cell';
    (function (cc) { cell.addEventListener('click', function () { drop(cc); }); })(i % COLS);
    boardEl.appendChild(cell); cells.push(cell);
  }

  var diffBtns = wrap.querySelectorAll('#c4-diffs .mode-btn');
  for (var di = 0; di < diffBtns.length; di++) {
    diffBtns[di].addEventListener('click', function (e) {
      aiLevel = e.currentTarget.getAttribute('data-level');
      for (var k = 0; k < diffBtns.length; k++) diffBtns[k].classList.toggle('active', diffBtns[k] === e.currentTarget);
    });
  }

  function render() {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var el = cells[r * COLS + c]; el.className = 'c4-cell' + (board[r][c] === 1 ? ' p1' : board[r][c] === 2 ? ' p2' : '');
    }
    top.textContent = T('gs.fourline.hudStreak').replace('{n}', streak) + ' · ' + (over ? '—' : (turn === 1 ? T('gs.fourline.yourTurn') : T('gs.fourline.aiTurn')));
  }

  function drop(col) {
    if (over || turn !== 1) return;
    var row = -1;
    for (var r = ROWS - 1; r >= 0; r--) if (!board[r][col]) { row = r; break; }
    if (row < 0) {
      if (Arcade.audio) Arcade.audio.play('error');
      msg.textContent = T('gs.fourline.colFull'); // 满列提示（修复：此前仅无声 error）
      msg.style.color = 'var(--neon-pink)';
      return;
    }
    board[row][col] = 1; if (Arcade.juice) Arcade.juice.drop();
    if (checkWin(row, col, 1)) return win(1);
    if (full()) return draw();
    turn = 2; render();
    if (aiTimer) clearTimeout(aiTimer);
    aiTimer = setTimeout(aiMove, 360);
  }

  function aiMove() {
    if (over) return;
    var col = choose();
    var row = -1;
    for (var r = ROWS - 1; r >= 0; r--) if (!board[r][col]) { row = r; break; }
    if (row < 0) return;
    board[row][col] = 2; if (Arcade.juice) Arcade.juice.drop();
    if (checkWin(row, col, 2)) return win(2);
    if (full()) return draw();
    turn = 1; render();
  }

  function choose() {
    if (aiLevel === 'easy') return randomCol();
    if (aiLevel === 'medium') return chooseMedium();
    return chooseHard();
  }
  function randomCol() {
    var valid = [];
    for (var c = 0; c < COLS; c++) if (board[0][c] === 0) valid.push(c);
    return valid[Math.floor(Math.random() * valid.length)];
  }
  function chooseMedium() {
    var winCol = findWin(2); if (winCol >= 0) return winCol;
    var block = findWin(1); if (block >= 0) return block;
    var center = [3, 2, 4, 1, 5, 0, 6];
    for (var i = 0; i < center.length; i++) { var c = center[i]; if (board[0][c] === 0) return c; }
    return randomCol();
  }
  function findWin(p) {
    for (var c = 0; c < COLS; c++) {
      var row = -1; for (var r = ROWS - 1; r >= 0; r--) if (!board[r][c]) { row = r; break; }
      if (row < 0) continue;
      board[row][c] = p;
      var w = checkWin(row, c, p); board[row][c] = 0;
      if (w) return c;
    }
    return -1;
  }

  /* ---- 困难 AI：negamax + α-β 剪枝（自写棋盘版胜负判定）---- */
  function checkWinB(bd, r, c, p) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var d = 0; d < dirs.length; d++) {
      var cnt = 1, dr = dirs[d][0], dc = dirs[d][1];
      for (var s = 1; s < 4; s++) { var nr = r + dr * s, nc = c + dc * s; if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || bd[nr][nc] !== p) break; cnt++; }
      for (var s2 = 1; s2 < 4; s2++) { var pr = r - dr * s2, pc = c - dc * s2; if (pr < 0 || pc < 0 || pr >= ROWS || pc >= COLS || bd[pr][pc] !== p) break; cnt++; }
      if (cnt >= 4) return true;
    }
    return false;
  }
  function getRow(bd, col) { for (var r = ROWS - 1; r >= 0; r--) if (!bd[r][col]) return r; return -1; }
  function scoreWindow(w, p) {
    var me = 0, op = 0, empty = 0, opp = p === 1 ? 2 : 1;
    for (var i = 0; i < w.length; i++) { if (w[i] === p) me++; else if (w[i] === opp) op++; else if (w[i] === 0) empty++; }
    if (me === 4) return 1000000;
    if (me === 3 && empty === 1) return 120;
    if (me === 2 && empty === 2) return 14;
    if (op === 4) return -1000000;
    if (op === 3 && empty === 1) return -120;
    if (op === 2 && empty === 2) return -14;
    return 0;
  }
  function evaluateB(bd, p) {
    var score = 0, opp = p === 1 ? 2 : 1;
    for (var r = 0; r < ROWS; r++) { if (bd[r][3] === p) score += 6; else if (bd[r][3] === opp) score -= 6; }
    for (var r2 = 0; r2 < ROWS; r2++) {
      for (var c = 0; c < COLS - 3; c++) score += scoreWindow([bd[r2][c], bd[r2][c + 1], bd[r2][c + 2], bd[r2][c + 3]], p);
    }
    for (var r3 = 0; r3 < ROWS - 3; r3++) {
      for (var c = 0; c < COLS; c++) score += scoreWindow([bd[r3][c], bd[r3 + 1][c], bd[r3 + 2][c], bd[r3 + 3][c]], p);
    }
    for (var r4 = 0; r4 < ROWS - 3; r4++) for (var c2 = 0; c2 < COLS - 3; c2++) score += scoreWindow([bd[r4][c2], bd[r4 + 1][c2 + 1], bd[r4 + 2][c2 + 2], bd[r4 + 3][c2 + 3]], p);
    for (var r5 = 3; r5 < ROWS; r5++) for (var c3 = 0; c3 < COLS - 3; c3++) score += scoreWindow([bd[r5][c3], bd[r5 - 1][c3 + 1], bd[r5 - 2][c3 + 2], bd[r5 - 3][c3 + 3]], p);
    return score;
  }
  var HARD_DEPTH = 6;
  function negamax(bd, depth, alpha, beta, player) {
    var valid = []; for (var c = 0; c < COLS; c++) if (bd[0][c] === 0) valid.push(c);
    if (valid.length === 0) return 0;
    if (depth === 0) return evaluateB(bd, player);
    var opp = player === 1 ? 2 : 1, order = [3, 2, 4, 1, 5, 0, 6], best = -Infinity;
    for (var i = 0; i < order.length; i++) {
      var col = order[i]; if (bd[0][col] !== 0) continue;
      var row = getRow(bd, col);
      bd[row][col] = player;
      var won = checkWinB(bd, row, col, player);
      var s = won ? 100000 + depth : -negamax(bd, depth - 1, -beta, -alpha, opp);
      bd[row][col] = 0;
      if (s > best) best = s;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }
  function chooseHard() {
    var order = [3, 2, 4, 1, 5, 0, 6], bestScore = -Infinity, candidates = [];
    for (var i = 0; i < order.length; i++) {
      var col = order[i]; if (board[0][col] !== 0) continue;
      var row = getRow(board, col);
      board[row][col] = 2;
      var won = checkWinB(board, row, col, 2);
      var s = won ? 100000 : -negamax(board, HARD_DEPTH - 1, -Infinity, Infinity, 1);
      board[row][col] = 0;
      if (s > bestScore) { bestScore = s; candidates = [col]; }
      else if (s === bestScore) candidates.push(col);
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function checkWin(r, c, p) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var d = 0; d < dirs.length; d++) {
      var cnt = 1, dr = dirs[d][0], dc = dirs[d][1];
      for (var s = 1; s < 4; s++) { var nr = r + dr * s, nc = c + dc * s; if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || board[nr][nc] !== p) break; cnt++; }
      for (var s2 = 1; s2 < 4; s2++) { var pr = r - dr * s2, pc = c - dc * s2; if (pr < 0 || pc < 0 || pr >= ROWS || pc >= COLS || board[pr][pc] !== p) break; cnt++; }
      if (cnt >= 4) return true;
    }
    return false;
  }
  function full() { for (var c = 0; c < COLS; c++) if (!board[0][c]) return false; return true; }

  function win(p) {
    over = true;
    if (p === 1) { streak++; msg.textContent = T('gs.fourline.win').replace('{n}', streak); msg.style.color = 'var(--neon-green)'; if (Arcade.juice) Arcade.juice.win(); if (Arcade.shell) Arcade.shell.submitScore(streak); }
    else { streak = 0; msg.textContent = T('gs.fourline.lose'); msg.style.color = 'var(--neon-pink)'; if (Arcade.juice) Arcade.juice.lose(); }
    render();
    setTimeout(reset, 1400);
  }
  function draw() {
    over = true; streak = 0;
    msg.textContent = T('gs.fourline.draw'); msg.style.color = 'var(--neon-yellow)';
    render(); setTimeout(reset, 1400);
  }

  reset();
      /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.fourline.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); };

})();
