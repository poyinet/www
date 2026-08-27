/* ============================================================
   五子棋：15×15，双人对弈 / 人机三档（简单随机 / 中等启发 / 困难两步预判）
   黑棋（玩家）先行，白棋（AI）后手；四方向连珠 >= 5 判胜；支持悔棋
   ============================================================ */

(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.gomoku.tut1t'), d: T('gs.gomoku.tut1') },
    { t: T('gs.gomoku.tut2t'), d: T('gs.gomoku.tut2') },
    { t: T('gs.gomoku.tut3t'), d: T('gs.gomoku.tut3') }
  ];

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.gomoku.blackTurn') + '</div>' +
    '<canvas id="board" class="game-canvas gomoku-canvas" width="600" height="600"></canvas>' +
    '<div class="game-controls" id="mode-controls">' +
    '  <button class="btn mode-btn active" data-mode="pvp">' + T('gs.gomoku.pvp') + '</button>' +
    '  <button class="btn purple mode-btn" data-mode="easy">' + T('gs.gomoku.aiEasy') + '</button>' +
    '  <button class="btn yellow mode-btn" data-mode="medium">' + T('gs.gomoku.aiMedium') + '</button>' +
    '  <button class="btn pink mode-btn" data-mode="hard">' + T('gs.gomoku.aiHard') + '</button>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="undo-btn" class="btn yellow">' + T('gs.gomoku.undo') + '</button>' +
    '  <button id="restart-btn" class="btn green">' + T('gs.gomoku.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.gomoku.help') + '</p>';

  var msgEl = document.getElementById('msg');
  var canvas = document.getElementById('board');
  var undoBtn = document.getElementById('undo-btn');
  var restartBtn = document.getElementById('restart-btn');
  var modeBtns = document.querySelectorAll('#mode-controls .mode-btn');
  var ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  var SIZE = 15;          // 15×15 交叉点
  var LOGICAL = 600;      // 逻辑像素
  var MARGIN = 20;        // 留白边
  var CELL = 40;          // 格距（14 间隔 × 40 = 560）
  var EMPTY = 0, BLACK = 1, WHITE = 2;

  var board, current, moves, gameOver, winCells, flashOn, flashTimer, hintTimer;
  var mode = 'pvp', aiThinking = false, aiTimer = null, streak = 0;

  /* ---------- 断点续玩（共享模块 Arcade.savegame：自动 + 即时快照 + 恢复；仅存本机） ---------- */
  function writeSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.write(); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'gomoku',
      collect: function () {
        if (gameOver) return null; /* 终局自动清档，重进是新局 */
        return { board: board, current: current, moves: moves, mode: mode, streak: streak };
      },
      apply: function (s) {
        if (!s || !Array.isArray(s.board) || s.board.length !== SIZE) return false;
        for (var ri = 0; ri < SIZE; ri++) if (!Array.isArray(s.board[ri]) || s.board[ri].length !== SIZE) return false;
        if (s.current !== BLACK && s.current !== WHITE) return false;
        if (!Array.isArray(s.moves)) return false;
        if (s.mode !== 'pvp' && s.mode !== 'easy' && s.mode !== 'medium' && s.mode !== 'hard') return false;
        board = s.board.map(function (r) { return r.slice(); });
        current = s.current;
        moves = s.moves;
        mode = s.mode;
        streak = s.streak || 0;
        gameOver = false; winCells = null; aiThinking = false;
        flashOn = false;
        clearTimeout(hintTimer); clearTimeout(aiTimer);
        for (var mb = 0; mb < modeBtns.length; mb++) modeBtns[mb].classList.toggle('active', modeBtns[mb].getAttribute('data-mode') === mode);
        if (mode !== 'pvp' && current === WHITE) {
          aiThinking = true;
          msgEl.textContent = T('gs.gomoku.aiThinkingWhite');
          msgEl.style.color = '';
          draw();
          aiTimer = setTimeout(aiMove, 450);
        } else {
          setTurnMessage();
          updateUndoBtn();
          draw();
        }
        return true;
      }
    });
  }

  // DPR 适配：高分屏清晰
  var dpr = window.devicePixelRatio || 1;
  canvas.width = LOGICAL * dpr;
  canvas.height = LOGICAL * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 预生成木纹线条（每局不变，避免闪烁）
  var woodLines = [];
  for (var i = 0; i < 26; i++) {
    woodLines.push({
      x: Math.random() * LOGICAL,
      w: 1 + Math.random() * 3,
      alpha: 0.04 + Math.random() * 0.08
    });
  }

  var STARS = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];

  function px(idx) { return MARGIN + idx * CELL; }

  function draw() {
    // 木纹深色底
    var bg = ctx.createLinearGradient(0, 0, LOGICAL, LOGICAL);
    bg.addColorStop(0, '#2b1d12');
    bg.addColorStop(0.5, '#3a2817');
    bg.addColorStop(1, '#241709');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, LOGICAL, LOGICAL);
    for (var i = 0; i < woodLines.length; i++) {
      var wl = woodLines[i];
      ctx.fillStyle = 'rgba(0,0,0,' + wl.alpha + ')';
      ctx.fillRect(wl.x, 0, wl.w, LOGICAL);
    }

    // 霓虹网格线
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 4;
    for (var k = 0; k < SIZE; k++) {
      ctx.beginPath();
      ctx.moveTo(MARGIN, px(k));
      ctx.lineTo(px(SIZE - 1), px(k));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px(k), MARGIN);
      ctx.lineTo(px(k), px(SIZE - 1));
      ctx.stroke();
    }
    // 外框加亮
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(MARGIN, MARGIN, CELL * (SIZE - 1), CELL * (SIZE - 1));
    ctx.shadowBlur = 0;

    // 星位
    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
    for (var s = 0; s < STARS.length; s++) {
      ctx.beginPath();
      ctx.arc(px(STARS[s][0]), px(STARS[s][1]), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 棋子
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c] !== EMPTY) drawPiece(r, c, board[r][c]);
      }
    }

    // 最后落子标记圈
    if (moves.length > 0 && !winCells) {
      var last = moves[moves.length - 1];
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px(last.c), px(last.r), CELL * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 胜利五子闪烁高亮 + 发光连线
    if (winCells && flashOn) {
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.95)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 14;
      var first = winCells[0], lastW = winCells[winCells.length - 1];
      ctx.beginPath();
      ctx.moveTo(px(first.c), px(first.r));
      ctx.lineTo(px(lastW.c), px(lastW.r));
      ctx.stroke();
      for (var w = 0; w < winCells.length; w++) {
        ctx.beginPath();
        ctx.arc(px(winCells[w].c), px(winCells[w].r), CELL * 0.46, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
  }

  function drawPiece(r, c, player) {
    var x = px(c), y = px(r), radius = CELL * 0.42;
    var g = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    if (player === BLACK) {
      g.addColorStop(0, '#555555');
      g.addColorStop(1, '#0a0a0a');
      ctx.shadowColor = 'rgba(255, 255, 255, 0.55)'; // 白边光晕
      ctx.shadowBlur = 8;
    } else {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#c9c9c9');
      ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (player === BLACK) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /** 沿四方向统计连珠，>=5 返回连成一线的坐标数组，否则 null */
  function checkWin(r, c, player) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var line = [{ r: r, c: c }];
      var i;
      for (i = 1; i < 5; i++) {
        var rr = r + dr * i, cc = c + dc * i;
        if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || board[rr][cc] !== player) break;
        line.push({ r: rr, c: cc });
      }
      for (i = 1; i < 5; i++) {
        var rr2 = r - dr * i, cc2 = c - dc * i;
        if (rr2 < 0 || rr2 >= SIZE || cc2 < 0 || cc2 >= SIZE || board[rr2][cc2] !== player) break;
        line.unshift({ r: rr2, c: cc2 });
      }
      if (line.length >= 5) return line;
    }
    return null;
  }

  function setTurnMessage() {
    if (mode !== 'pvp') {
      msgEl.textContent = current === BLACK ? T('gs.gomoku.yourTurnBlack') : T('gs.gomoku.aiThinkingWhite');
      msgEl.style.color = '';
      return;
    }
    msgEl.textContent = current === BLACK ? T('gs.gomoku.blackTurn') : T('gs.gomoku.whiteTurn');
    msgEl.style.color = '';
  }

  function updateUndoBtn() {
    undoBtn.disabled = gameOver || moves.length === 0;
  }

  /* ===================== AI ===================== */
  /** 候选着法：已有棋子周围 2 格内的空点；空盘则下天元 */
  function candidateMoves(bd) {
    var seen = {}, has = false, res = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (bd[r][c] !== EMPTY) {
          has = true;
          for (var dr = -2; dr <= 2; dr++) {
            for (var dc = -2; dc <= 2; dc++) {
              var nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && bd[nr][nc] === EMPTY) {
                var key = nr * SIZE + nc;
                if (!seen[key]) { seen[key] = true; res.push({ r: nr, c: nc }); }
              }
            }
          }
        }
      }
    }
    if (!has) return [{ r: 7, c: 7 }];
    return res;
  }

  /** 单方向连珠评分（含两端开放情况） */
  function runScore(bd, r, c, player, dr, dc) {
    var cnt = 1, openPos = 0, openNeg = 0;
    var rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && bd[rr][cc] === player) { cnt++; rr += dr; cc += dc; }
    if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && bd[rr][cc] === EMPTY) openPos = 1;
    rr = r - dr; cc = c - dc;
    while (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && bd[rr][cc] === player) { cnt++; rr -= dr; cc -= dc; }
    if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && bd[rr][cc] === EMPTY) openNeg = 1;
    var open = openPos + openNeg;
    if (cnt >= 5) return 1000000;
    if (cnt === 4) return open === 2 ? 100000 : open === 1 ? 10000 : 0;
    if (cnt === 3) return open === 2 ? 1000 : open === 1 ? 100 : 0;
    if (cnt === 2) return open === 2 ? 100 : open === 1 ? 10 : 0;
    if (cnt === 1) return open === 2 ? 1 : 0;
    return 0;
  }

  /** 在 (r,c) 落 player 后的综合形分（四方向求和） */
  function scoreMove(bd, r, c, player) {
    var total = 0, dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    bd[r][c] = player;
    for (var d = 0; d < 4; d++) total += runScore(bd, r, c, player, dirs[d][0], dirs[d][1]);
    bd[r][c] = EMPTY;
    return total;
  }

  /** 找出 player 一步即获胜的着点，没有返回 null */
  function findWinMove(bd, player) {
    var cands = candidateMoves(bd);
    for (var i = 0; i < cands.length; i++) {
      var m = cands[i];
      bd[m.r][m.c] = player;
      var win = checkWin(m.r, m.c, player);
      bd[m.r][m.c] = EMPTY;
      if (win) return m;
    }
    return null;
  }

  /** 局面评估（从 player 视角）：双方落子形分差 */
  function evaluateBoard(bd, player) {
    var opp = player === BLACK ? WHITE : BLACK, me = 0, op = 0;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (bd[r][c] === player) me += scoreMove(bd, r, c, player);
        else if (bd[r][c] === opp) op += scoreMove(bd, r, c, opp);
      }
    }
    return me - 1.1 * op;
  }

  function aiPick() {
    if (mode === 'easy') return bestEasy();
    if (mode === 'medium') return bestMedium();
    return bestHard();
  }
  function bestEasy() {
    var cands = candidateMoves(board);
    if (!cands.length) return null;
    if (Math.random() < 0.5) return cands[Math.floor(Math.random() * cands.length)];
    var w = findWinMove(board, WHITE); if (w) return w;
    if (Math.random() < 0.6) { var b = findWinMove(board, BLACK); if (b) return b; }
    return cands[Math.floor(Math.random() * cands.length)];
  }
  function bestMedium() {
    var w = findWinMove(board, WHITE); if (w) return w;
    var b = findWinMove(board, BLACK); if (b) return b;
    var cands = candidateMoves(board), best = null, bestS = -Infinity;
    for (var i = 0; i < cands.length; i++) {
      var m = cands[i];
      board[m.r][m.c] = WHITE; var at = scoreMove(board, m.r, m.c, WHITE); board[m.r][m.c] = EMPTY;
      board[m.r][m.c] = BLACK; var df = scoreMove(board, m.r, m.c, BLACK); board[m.r][m.c] = EMPTY;
      var s = at + 0.9 * df; // 攻守兼顾
      if (s > bestS) { bestS = s; best = m; }
    }
    return best || cands[0];
  }
  function bestHard() {
    var w = findWinMove(board, WHITE); if (w) return w;
    var b = findWinMove(board, BLACK); if (b) return b;
    var cands = candidateMoves(board), scored = [];
    for (var i = 0; i < cands.length; i++) {
      var m = cands[i];
      board[m.r][m.c] = WHITE; var at = scoreMove(board, m.r, m.c, WHITE); board[m.r][m.c] = EMPTY;
      board[m.r][m.c] = BLACK; var df = scoreMove(board, m.r, m.c, BLACK); board[m.r][m.c] = EMPTY;
      scored.push({ m: m, s: at + 0.8 * df });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    var top = scored.slice(0, 12), best = null, bestScore = -Infinity;
    for (var t = 0; t < top.length; t++) {
      var mm = top[t].m;
      board[mm.r][mm.c] = WHITE;
      var win = checkWin(mm.r, mm.c, WHITE);
      var sc;
      if (win) sc = 1e9;
      else {
        var oc = candidateMoves(board), oscored = [];
        for (var j = 0; j < oc.length; j++) {
          var o = oc[j];
          board[o.r][o.c] = BLACK; var os = scoreMove(board, o.r, o.c, BLACK); board[o.r][o.c] = EMPTY;
          oscored.push({ o: o, s: os });
        }
        oscored.sort(function (a, b) { return b.s - a.s; });
        var otop = oscored.slice(0, 8), worst = -Infinity;
        for (var k = 0; k < otop.length; k++) {
          var oo = otop[k].o;
          board[oo.r][oo.c] = BLACK;
          var v = evaluateBoard(board, WHITE);
          board[oo.r][oo.c] = EMPTY;
          if (v < worst) worst = v; // 对手取对白方最差的应对（min）
        }
        sc = worst;
      }
      board[mm.r][mm.c] = EMPTY;
      if (sc > bestScore) { bestScore = sc; best = mm; }
    }
    return best || cands[0];
  }

  function aiMove() {
    aiThinking = false;
    if (gameOver || mode === 'pvp') return;
    var mv = aiPick();
    if (!mv) { current = BLACK; setTurnMessage(); updateUndoBtn(); draw(); return; }
    board[mv.r][mv.c] = WHITE;
    Arcade.juice.move();
    moves.push({ r: mv.r, c: mv.c, player: WHITE });
    var line = checkWin(mv.r, mv.c, WHITE);
    if (line) {
      gameOver = true; winCells = line;
      msgEl.textContent = T('gs.gomoku.aiWin'); msgEl.style.color = 'var(--neon-pink)';
      Arcade.juice.lose();
      streak = 0;
      // 失败不提交（修复：此前 submitScore(0) 会把 BEST=0 写入榜单）
      flashOn = true;
      flashTimer = setInterval(function () { flashOn = !flashOn; draw(); }, 350);
    } else if (moves.length === SIZE * SIZE) {
      gameOver = true;
      msgEl.textContent = T('gs.gomoku.draw'); msgEl.style.color = 'var(--neon-yellow)';
    } else {
      current = BLACK; setTurnMessage();
    }
    updateUndoBtn();
    draw();
    writeSave();
  }

  function onTap(e) {
    if (gameOver || aiThinking) return;
    if (mode !== 'pvp' && current !== BLACK) return; // 人机模式：AI 回合禁止点击
    var rect = canvas.getBoundingClientRect();
    var scale = LOGICAL / rect.width;
    var x = (e.clientX - rect.left) * scale;
    var y = (e.clientY - rect.top) * scale;

    // 吸附最近交叉点，距离阈值半格
    var c = Math.round((x - MARGIN) / CELL);
    var r = Math.round((y - MARGIN) / CELL);
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    if (Math.hypot(px(c) - x, px(r) - y) > CELL / 2) return;

    if (board[r][c] !== EMPTY) {
      clearTimeout(hintTimer);
      msgEl.textContent = T('gs.gomoku.occupied');
      msgEl.style.color = 'var(--neon-pink)';
      hintTimer = setTimeout(function () {
        if (!gameOver && !aiThinking) setTurnMessage();
      }, 1200);
      return;
    }

    clearTimeout(hintTimer);
    board[r][c] = current;
    Arcade.juice.move();
    moves.push({ r: r, c: c, player: current });

    var line = checkWin(r, c, current);
    if (line) {
      gameOver = true;
      winCells = line;
      msgEl.textContent = current === BLACK ? T('gs.gomoku.blackWin') : T('gs.gomoku.whiteWin');
      msgEl.style.color = 'var(--neon-yellow)';
      Arcade.juice.win();
      if (mode !== 'pvp' && current === BLACK) { streak++; if (Arcade.shell) Arcade.shell.submitScore(streak); }
      flashOn = true;
      flashTimer = setInterval(function () {
        flashOn = !flashOn;
        draw();
      }, 350);
    } else if (moves.length === SIZE * SIZE) {
      gameOver = true;
      msgEl.textContent = T('gs.gomoku.draw');
      msgEl.style.color = 'var(--neon-yellow)';
    } else {
      current = current === BLACK ? WHITE : BLACK;
      setTurnMessage();
      if (mode !== 'pvp' && current === WHITE) {
        aiThinking = true;
        msgEl.textContent = T('gs.gomoku.aiThinkingWhite');
        msgEl.style.color = '';
        draw();
        aiTimer = setTimeout(aiMove, 450);
      }
    }
    updateUndoBtn();
    draw();
    writeSave();
  }

  function init() {
    clearSave();
    clearInterval(flashTimer);
    clearTimeout(hintTimer);
    clearTimeout(aiTimer);
    aiThinking = false;
    board = [];
    for (var r = 0; r < SIZE; r++) {
      var row = [];
      for (var c = 0; c < SIZE; c++) row.push(EMPTY);
      board.push(row);
    }
    current = BLACK;
    moves = [];
    gameOver = false;
    streak = 0;
    winCells = null;
    setTurnMessage();
    updateUndoBtn();
    draw();
  }

  undoBtn.addEventListener('click', function () {
    if (gameOver || moves.length === 0) return;
    clearTimeout(aiTimer);
    aiThinking = false;
    var last = moves.pop();
    board[last.r][last.c] = EMPTY;
    // 人机模式：额外撤销 AI 的上一手，回到玩家回合
    if (mode !== 'pvp' && moves.length > 0) {
      var prev = moves.pop();
      board[prev.r][prev.c] = EMPTY;
    }
    current = BLACK;
    setTurnMessage();
    updateUndoBtn();
    draw();
  });

  restartBtn.addEventListener('click', init);
  canvas.addEventListener('pointerdown', onTap);

  for (var mb = 0; mb < modeBtns.length; mb++) {
    modeBtns[mb].addEventListener('click', function (e) {
      var next = e.currentTarget.getAttribute('data-mode');
      if (next === mode) return;
      mode = next;
      for (var k = 0; k < modeBtns.length; k++) modeBtns[k].classList.toggle('active', modeBtns[k] === e.currentTarget);
      init(); // 换模式自动重开
    });
  }

  if (!tryResume()) init();
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.gomoku.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = init;

})();