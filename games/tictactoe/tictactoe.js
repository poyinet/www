/* ============================================================
   井字棋：3×3 双人对弈 / 人机简单（随机）/ 人机困难（minimax 必不败）
   玩家执 X 先手，AI 执 O，不记最高分
   ============================================================ */

(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.tictactoe.tut1t'), d: T('gs.tictactoe.tut1') },
    { t: T('gs.tictactoe.tut2t'), d: T('gs.tictactoe.tut2') },
    { t: T('gs.tictactoe.tut3t'), d: T('gs.tictactoe.tut3') }
  ];

  root.innerHTML =
    '<div class="game-message" id="msg"></div>' +
    '<div class="game-controls" id="mode-controls">' +
    '  <button class="btn mode-btn active" data-mode="pvp">' + T('gs.tictactoe.pvp') + '</button>' +
    '  <button class="btn pink mode-btn" data-mode="easy">' + T('gs.tictactoe.aiEasy') + '</button>' +
    '  <button class="btn yellow mode-btn" data-mode="medium">' + T('gs.tictactoe.aiMedium') + '</button>' +
    '  <button class="btn purple mode-btn" data-mode="hard">' + T('gs.tictactoe.aiHard') + '</button>' +
    '</div>' +
    '<div class="ttt-board" id="board"></div>' +
    '<div class="game-controls">' +
    '  <button id="restart-btn" class="btn green">' + T('gs.tictactoe.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.tictactoe.help') + '</p>';

  var msgEl = document.getElementById('msg');
  var boardEl = document.getElementById('board');
  var restartBtn = document.getElementById('restart-btn');
  var modeBtns = document.querySelectorAll('.mode-btn');

  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  var board, current, mode, gameOver, aiThinking, aiTimer, streak = 0;
  var cells = [];

  // 构建 3×3 棋盘 DOM
  for (var i = 0; i < 9; i++) {
    var cell = document.createElement('button');
    cell.className = 'ttt-cell';
    cell.setAttribute('data-i', i);
    cell.addEventListener('click', onCellClick);
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  /** 判定胜负：返回 { player, line } / { player:'draw' } / null */
  function getResult(bd) {
    for (var k = 0; k < LINES.length; k++) {
      var a = LINES[k][0], b = LINES[k][1], c = LINES[k][2];
      if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {
        return { player: bd[a], line: LINES[k] };
      }
    }
    var full = true;
    for (var i = 0; i < 9; i++) {
      if (!bd[i]) { full = false; break; }
    }
    return full ? { player: 'draw', line: null } : null;
  }

  /** minimax 全搜索：AI(O) 胜 +10-深度，X 胜 深度-10，平 0 */
  function minimax(bd, depth, isMax) {
    var res = getResult(bd);
    if (res) {
      if (res.player === 'O') return 10 - depth;
      if (res.player === 'X') return depth - 10;
      return 0;
    }
    var best = isMax ? -Infinity : Infinity;
    for (var i = 0; i < 9; i++) {
      if (!bd[i]) {
        bd[i] = isMax ? 'O' : 'X';
        var s = minimax(bd, depth + 1, !isMax);
        bd[i] = '';
        best = isMax ? Math.max(best, s) : Math.min(best, s);
      }
    }
    return best;
  }

  /** 困难 AI：minimax 选最优，同分随机增加变化 */
  function bestMove() {
    var bestScore = -Infinity;
    var candidates = [];
    for (var i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        var s = minimax(board, 1, false);
        board[i] = '';
        if (s > bestScore) {
          bestScore = s;
          candidates = [i];
        } else if (s === bestScore) {
          candidates.push(i);
        }
      }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /** 简单 AI：随机空格 */
  function randomMove() {
    var empty = [];
    for (var i = 0; i < 9; i++) {
      if (!board[i]) empty.push(i);
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  /** 找出某方一步制胜的落点，没有则返回 -1 */
  function findWinningFor(p) {
    for (var i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = p;
        var res = getResult(board);
        board[i] = '';
        if (res && res.player === p) return i;
      }
    }
    return -1;
  }

  /** 中等 AI：必胜必挡 + 优先中心与角，约 20% 失误率（可被击败） */
  function mediumMove() {
    var win = findWinningFor('O'); if (win >= 0) return win;
    var block = findWinningFor('X'); if (block >= 0) return block;
    if (Math.random() < 0.2) return randomMove(); // 故意失误，给玩家机会
    if (!board[4]) return 4; // 中心
    var corners = [0, 2, 6, 8], avail = [];
    for (var k = 0; k < corners.length; k++) if (!board[corners[k]]) avail.push(corners[k]);
    if (avail.length) return avail[Math.floor(Math.random() * avail.length)];
    return randomMove();
  }

  function aiMove() {
    aiThinking = false;
    if (gameOver) return;
    var idx = mode === 'easy' ? randomMove()
            : mode === 'medium' ? mediumMove()
            : bestMove();
    if (idx !== undefined) place(idx, 'O');
  }

  /** 落子并处理后续（判胜/换边/触发 AI） */
  function place(idx, player) {
    board[idx] = player;
    Arcade.juice.move();
    render();

    var res = getResult(board);
    if (res) {
      gameOver = true;
      render();
      if (res.player === 'draw') {
        setMessage(T('gs.tictactoe.draw'), 'var(--neon-yellow)');
        Arcade.juice.select();
      } else {
        for (var k = 0; k < res.line.length; k++) {
          cells[res.line[k]].classList.add('win');
        }
        if (mode === 'pvp') {
          var color = res.player === 'X' ? 'var(--neon-cyan)' : 'var(--neon-pink)';
          setMessage(res.player + T('gs.tictactoe.winSuffix'), color);
        } else if (res.player === 'X') {
          setMessage(T('gs.tictactoe.youWin'), 'var(--neon-green)');
          Arcade.juice.win();
          streak++; if (Arcade.shell) Arcade.shell.submitScore(streak);
        } else {
          setMessage(T('gs.tictactoe.aiWin'), 'var(--neon-pink)');
          Arcade.juice.lose();
          streak = 0; // 失败不提交（防 BEST=0 污染）
        }
      }
      return;
    }

    current = player === 'X' ? 'O' : 'X';

    if (mode !== 'pvp' && current === 'O') {
      aiThinking = true;
      setMessage(T('gs.tictactoe.aiThinking'), '');
      render();
      aiTimer = setTimeout(aiMove, 500);
    } else {
      updateTurnMessage();
      render();
    }
  }

  function updateTurnMessage() {
    if (mode === 'pvp') {
      setMessage(T('gs.tictactoe.turnPvp').replace('{n}', current), '');
    } else {
      setMessage(T('gs.tictactoe.yourTurnX'), '');
    }
  }

  function setMessage(text, color) {
    msgEl.textContent = text;
    msgEl.style.color = color || '';
  }

  /** 刷新格子显示与可点状态 */
  function render() {
    for (var i = 0; i < 9; i++) {
      var v = board[i];
      cells[i].textContent = v;
      cells[i].classList.toggle('x', v === 'X');
      cells[i].classList.toggle('o', v === 'O');
      cells[i].disabled = gameOver || !!v || aiThinking;
    }
  }

  function onCellClick(e) {
    if (gameOver || aiThinking) return;
    var idx = Number(e.currentTarget.getAttribute('data-i'));
    if (board[idx]) return;
    if (mode !== 'pvp' && current !== 'X') return;
    place(idx, 'X');
  }

  function init() {
    clearTimeout(aiTimer);
    board = ['', '', '', '', '', '', '', '', ''];
    current = 'X';
    gameOver = false;
    aiThinking = false;
    for (var i = 0; i < 9; i++) {
      cells[i].classList.remove('win');
    }
    if (mode === 'pvp') {
      setMessage(T('gs.tictactoe.startPvp'), '');
    } else {
      setMessage(T('gs.tictactoe.startAi'), '');
    }
    render();
  }

  restartBtn.addEventListener('click', init);

  for (var m = 0; m < modeBtns.length; m++) {
    modeBtns[m].addEventListener('click', function (e) {
      var next = e.currentTarget.getAttribute('data-mode');
      if (next === mode) return;
      mode = next;
      for (var k = 0; k < modeBtns.length; k++) {
        modeBtns[k].classList.toggle('active', modeBtns[k] === e.currentTarget);
      }
      init(); // 换模式自动重开
    });
  }

  mode = 'pvp';
  init();    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.tictactoe.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = init;

})();