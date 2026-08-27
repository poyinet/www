/* ============================================================
   黑白棋：8×8 标准翻转规则，双人对弈 / 人机对战（AI 执白后手）
   AI：位置权重表 + 翻转数贪心一步决策，不记最高分
   ============================================================ */

(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.reversi.tut1t'), d: T('gs.reversi.tut1') },
    { t: T('gs.reversi.tut2t'), d: T('gs.reversi.tut2') },
    { t: T('gs.reversi.tut3t'), d: T('gs.reversi.tut3') }
  ];

  root.innerHTML =
    '<div class="game-message" id="msg"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.reversi.blackLabel') + ' <span class="stat-value" id="score-b">2</span></span>' +
    '  <span class="stat-value">:</span>' +
    '  <span>' + T('gs.reversi.whiteLabel') + ' <span class="stat-value" id="score-w">2</span></span>' +
    '</div>' +
    '<div class="rv-board" id="board"></div>' +
    '<div class="game-controls" id="mode-controls">' +
    '  <button class="btn mode-btn active" data-mode="pvp">' + T('gs.reversi.pvp') + '</button>' +
    '  <button class="btn pink mode-btn" data-mode="ai">' + T('gs.reversi.aiMode') + '</button>' +
    '</div>' +
    '<div class="game-controls" id="diff-controls">' +
    '  <button class="btn purple mode-btn" data-diff="easy">' + T('gs.reversi.dEasy') + '</button>' +
    '  <button class="btn yellow mode-btn active" data-diff="medium">' + T('gs.reversi.dNormal') + '</button>' +
    '  <button class="btn green mode-btn" data-diff="hard">' + T('gs.reversi.dHard') + '</button>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="restart-btn" class="btn green">' + T('gs.reversi.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.reversi.help') + '</p>';

  var msgEl = document.getElementById('msg');
  var boardEl = document.getElementById('board');
  var scoreBEl = document.getElementById('score-b');
  var scoreWEl = document.getElementById('score-w');
  var restartBtn = document.getElementById('restart-btn');
  var modeBtns = document.querySelectorAll('.mode-btn');

  var SIZE = 8;
  var EMPTY = 0, BLACK = 1, WHITE = 2;

  var DIRS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  // 经典位置权重表：角 +120、角邻位为负、边加分
  var WEIGHTS = [
    [120, -20,  20,   5,   5,  20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [120, -20,  20,   5,   5,  20, -20, 120]
  ];

  var board, current, mode, gameOver, aiThinking, aiTimer, streak = 0;
  var cells = [];

  /* ---------- 断点续玩（共享模块 Arcade.savegame：自动 + 即时快照 + 恢复；仅存本机） ---------- */
  function writeSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.write(); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'reversi',
      collect: function () {
        if (gameOver) return null; /* 终局自动清档，重进是新局 */
        return { board: board, current: current, mode: mode, streak: streak, aiDepth: AI_DEPTH };
      },
      apply: function (s) {
        if (!s || !Array.isArray(s.board) || s.board.length !== SIZE) return false;
        for (var ri = 0; ri < SIZE; ri++) if (!Array.isArray(s.board[ri]) || s.board[ri].length !== SIZE) return false;
        if (s.current !== BLACK && s.current !== WHITE) return false;
        if (s.mode !== 'pvp' && s.mode !== 'ai') return false;
        board = s.board.map(function (r) { return r.slice(); });
        current = s.current;
        mode = s.mode;
        streak = s.streak || 0;
        AI_DEPTH = (s.aiDepth === 2 || s.aiDepth === 6) ? s.aiDepth : 4;
        gameOver = false; aiThinking = false;
        clearTimeout(aiTimer);
        for (var mb = 0; mb < modeBtns.length; mb++) {
          var dm = modeBtns[mb].getAttribute('data-mode');
          if (dm) modeBtns[mb].classList.toggle('active', dm === mode);
        }
        for (var dm2 = 0; dm2 < diffBtns.length; dm2++) {
          var d = diffBtns[dm2].getAttribute('data-diff');
          var depth = d === 'easy' ? 2 : d === 'hard' ? 6 : 4;
          diffBtns[dm2].classList.toggle('active', depth === AI_DEPTH);
        }
        render();
        turnMessage();
        maybeAi();
        return true;
      }
    });
  }

  // 构建 8×8 棋盘 DOM
  for (var i = 0; i < SIZE * SIZE; i++) {
    var cell = document.createElement('div');
    cell.className = 'rv-cell' + ((Math.floor(i / SIZE) + i % SIZE) % 2 ? ' alt' : '');
    cell.setAttribute('data-i', i);
    cell.addEventListener('click', onCellClick);
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  function inBounds(r, c) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  }

  /** 该点落子能翻转的对方棋子坐标列表（空数组 = 不可落子） */
  function getFlips(bd, r, c, player) {
    if (bd[r][c] !== EMPTY) return [];
    var opp = player === BLACK ? WHITE : BLACK;
    var all = [];
    for (var d = 0; d < DIRS.length; d++) {
      var dr = DIRS[d][0], dc = DIRS[d][1];
      var line = [];
      var rr = r + dr, cc = c + dc;
      while (inBounds(rr, cc) && bd[rr][cc] === opp) {
        line.push({ r: rr, c: cc });
        rr += dr;
        cc += dc;
      }
      if (line.length > 0 && inBounds(rr, cc) && bd[rr][cc] === player) {
        all = all.concat(line);
      }
    }
    return all;
  }

  /** 当前玩家全部合法着法 */
  function legalMoves(bd, player) {
    var res = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var flips = getFlips(bd, r, c, player);
        if (flips.length > 0) res.push({ r: r, c: c, flips: flips });
      }
    }
    return res;
  }

  function countPieces() {
    var b = 0, w = 0;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c] === BLACK) b++;
        else if (board[r][c] === WHITE) w++;
      }
    }
    return { b: b, w: w };
  }

  function setMessage(text, color) {
    msgEl.textContent = text;
    msgEl.style.color = color || '';
  }

  /** 渲染棋盘；changed = 本次变化的格子（播翻转动画） */
  function render(changed) {
    var hintMap = {};
    if (!gameOver && !aiThinking && (mode === 'pvp' || current === BLACK)) {
      var moves = legalMoves(board, current);
      for (var m = 0; m < moves.length; m++) {
        hintMap[moves[m].r * SIZE + moves[m].c] = true;
      }
    }
    var flipMap = {};
    if (changed) {
      for (var f = 0; f < changed.length; f++) {
        flipMap[changed[f].r * SIZE + changed[f].c] = true;
      }
    }
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var idx = r * SIZE + c;
        var cell = cells[idx];
        cell.innerHTML = '';
        var v = board[r][c];
        if (v !== EMPTY) {
          var disc = document.createElement('div');
          disc.className = 'disc ' + (v === BLACK ? 'black' : 'white') +
            (flipMap[idx] ? ' flip' : '');
          cell.appendChild(disc);
          cell.classList.remove('hint');
        } else if (hintMap[idx]) {
          var dot = document.createElement('div');
          dot.className = 'hint-dot ' + (current === BLACK ? 'black' : 'white');
          cell.appendChild(dot);
          cell.classList.add('hint');
        } else {
          cell.classList.remove('hint');
        }
      }
    }
    var s = countPieces();
    scoreBEl.textContent = s.b;
    scoreWEl.textContent = s.w;
  }

  function turnMessage() {
    if (mode === 'ai') {
      setMessage(current === BLACK ? T('gs.reversi.yourTurnBlack') : T('gs.reversi.aiThinking'), '');
    } else {
      setMessage(current === BLACK ? T('gs.reversi.blackTurn') : T('gs.reversi.whiteTurn'), '');
    }
  }

  function finishGame() {
    gameOver = true;
    var s = countPieces();
    var text;
    if (s.b > s.w) text = T('gs.reversi.endBlack').replace('{b}', s.b).replace('{w}', s.w);
    else if (s.w > s.b) text = T('gs.reversi.endWhite').replace('{b}', s.b).replace('{w}', s.w);
    else text = T('gs.reversi.endDraw').replace('{b}', s.b).replace('{w}', s.w);
    setMessage(text, 'var(--neon-yellow)');
    if (s.b > s.w) { Arcade.juice.win(); if (mode === 'ai') { streak++; if (Arcade.shell) Arcade.shell.submitScore(streak); } }
    else if (s.w > s.b) { Arcade.juice.lose(); if (mode === 'ai') { streak = 0; } } // 失败不提交（防 BEST=0 污染）
    else Arcade.juice.select();
  }

  /** 落子后：换边 / 跳过 / 终局 / 触发 AI */
  function afterMove(changed) {
    var opp = current === BLACK ? WHITE : BLACK;
    var oppMoves = legalMoves(board, opp);
    var myMoves = legalMoves(board, current);

    if (oppMoves.length === 0 && myMoves.length === 0) {
      finishGame();
      render(changed);
      return;
    }
    if (oppMoves.length === 0) {
      var name = opp === BLACK ? T('gs.reversi.blackName') : T('gs.reversi.whiteName');
      setMessage(T('gs.reversi.skip').replace('{n}', name), 'var(--neon-yellow)');
      // current 不变，继续由原方落子
      render(changed);
      maybeAi();
      return;
    }
    current = opp;
    turnMessage();
    render(changed);
    maybeAi();
  }

  function place(r, c, mv) {
    board[r][c] = current;
    Arcade.juice.move();
    var changed = [{ r: r, c: c }];
    for (var i = 0; i < mv.flips.length; i++) {
      board[mv.flips[i].r][mv.flips[i].c] = current;
      changed.push(mv.flips[i]);
    }
    afterMove(changed);
    writeSave();
  }

  /* ---- AI（白方）：minimax + α-β 剪枝，深度 4 ---- */
  var AI_DEPTH = 4;

  function cloneBoard(bd) {
    var b = [];
    for (var r = 0; r < SIZE; r++) b.push(bd[r].slice());
    return b;
  }

  function cntOf(bd) {
    var b = 0, w = 0;
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++) {
        if (bd[r][c] === BLACK) b++;
        else if (bd[r][c] === WHITE) w++;
      }
    return { b: b, w: w };
  }

  /* 局面评估：从白方视角，位置权重为主，终盘加子差 */
  function evaluateBoard(bd) {
    var s = 0;
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++) {
        if (bd[r][c] === WHITE) s += WEIGHTS[r][c];
        else if (bd[r][c] === BLACK) s -= WEIGHTS[r][c];
      }
    var cnt = cntOf(bd);
    if (cnt.b + cnt.w >= SIZE * SIZE - 4) s += (cnt.w - cnt.b) * 8; // 接近终盘时子差更重要
    return s;
  }

  /* isMax = true：轮到白方（AI）下，最大化 */
  function search(bd, depth, alpha, beta, isMax) {
    var me = isMax ? WHITE : BLACK;
    var opp = isMax ? BLACK : WHITE;
    var moves = legalMoves(bd, me);
    var oppMoves = legalMoves(bd, opp);
    if (depth === 0 || (moves.length === 0 && oppMoves.length === 0)) {
      return evaluateBoard(bd);
    }
    if (moves.length === 0) {
      // 无棋可走，跳过交给对方（不消耗深度）
      return search(bd, depth, alpha, beta, !isMax);
    }
    if (isMax) {
      var best = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var nb = cloneBoard(bd);
        nb[moves[i].r][moves[i].c] = WHITE;
        for (var k = 0; k < moves[i].flips.length; k++) {
          nb[moves[i].flips[k].r][moves[i].flips[k].c] = WHITE;
        }
        best = Math.max(best, search(nb, depth - 1, alpha, beta, false));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      var worst = Infinity;
      for (var j = 0; j < moves.length; j++) {
        var mb = cloneBoard(bd);
        mb[moves[j].r][moves[j].c] = BLACK;
        for (var m = 0; m < moves[j].flips.length; m++) {
          mb[moves[j].flips[m].r][moves[j].flips[m].c] = BLACK;
        }
        worst = Math.min(worst, search(mb, depth - 1, alpha, beta, true));
        beta = Math.min(beta, worst);
        if (beta <= alpha) break;
      }
      return worst;
    }
  }

  function aiMove() {
    aiThinking = false;
    if (gameOver) return;
    var moves = legalMoves(board, WHITE);
    if (moves.length === 0) return; // 理论上 afterMove 已处理跳过
    var bestScore = -Infinity;
    var candidates = [];
    for (var i = 0; i < moves.length; i++) {
      var nb = cloneBoard(board);
      nb[moves[i].r][moves[i].c] = WHITE;
      for (var k = 0; k < moves[i].flips.length; k++) {
        nb[moves[i].flips[k].r][moves[i].flips[k].c] = WHITE;
      }
      var s = search(nb, AI_DEPTH - 1, -Infinity, Infinity, false);
      if (s > bestScore) { bestScore = s; candidates = [moves[i]]; }
      else if (s === bestScore) candidates.push(moves[i]);
    }
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    place(pick.r, pick.c, pick);
  }

  function maybeAi() {
    if (gameOver || mode !== 'ai' || current !== WHITE) return;
    aiThinking = true;
    render();
    aiTimer = setTimeout(aiMove, 600);
  }

  function onCellClick(e) {
    if (gameOver || aiThinking) return;
    if (mode === 'ai' && current !== BLACK) return;
    var idx = Number(e.currentTarget.getAttribute('data-i'));
    var r = Math.floor(idx / SIZE), c = idx % SIZE;
    var moves = legalMoves(board, current);
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].r === r && moves[i].c === c) {
        place(r, c, moves[i]);
        return;
      }
    }
  }

  function init() {
    clearSave();
    clearTimeout(aiTimer);
    board = [];
    for (var r = 0; r < SIZE; r++) {
      var row = [];
      for (var c = 0; c < SIZE; c++) row.push(EMPTY);
      board.push(row);
    }
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    current = BLACK;
    gameOver = false;
    aiThinking = false;
    streak = 0;
    if (mode === 'ai') {
      setMessage(T('gs.reversi.startAi'), '');
    } else {
      setMessage(T('gs.reversi.startBlack'), '');
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

  // 难度档位：控制 minimax 搜索深度（easy 浅 / hard 深）
  var diffBtns = document.querySelectorAll('#diff-controls .mode-btn');
  for (var dm = 0; dm < diffBtns.length; dm++) {
    diffBtns[dm].addEventListener('click', function (e) {
      var d = e.currentTarget.getAttribute('data-diff');
      AI_DEPTH = d === 'easy' ? 2 : d === 'hard' ? 6 : 4;
      for (var k = 0; k < diffBtns.length; k++) diffBtns[k].classList.toggle('active', diffBtns[k] === e.currentTarget);
    });
  }

  if (!tryResume()) { mode = 'pvp'; init(); }
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.reversi.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = init;

})();