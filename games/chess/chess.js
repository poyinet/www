/* 国际象棋 Chess vs AI —— 批次D 棋牌策略 */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.chess.tut1t'), d: T('gs.chess.tut1') },
  { t: T('gs.chess.tut2t'), d: T('gs.chess.tut2') },
  { t: T('gs.chess.tut3t'), d: T('gs.chess.tut3') },
  { t: T('gs.chess.tut4t'), d: T('gs.chess.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var DIFFS = { easy: 'easy', normal: 'normal', hard: 'hard' };
  var difficulty = 'normal';
  var PIECES = { K: 1000, Q: 9, R: 5, B: 3, N: 3, P: 1 };
  var board, turn, selected, moves, msg, over, capturedScore;
  var puzzleMode = false, replayBase = null, replaying = false, replayTimer = null;
  var currentPuzzle = null;

  /* ---------- 断点续玩（共享模块 Arcade.savegame：自动 + 即时快照 + 恢复；仅存本机） ---------- */
  function writeSave() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.write()); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'chess',
      collect: function () {
        if (over || replaying) return null; /* 终局自动清档，重进是新局；回放中不落盘 */
        return {
          board: board, turn: turn, capturedScore: capturedScore,
          history: history, difficulty: difficulty,
          puzzleMode: puzzleMode,
          puzzleIndex: puzzleMode && currentPuzzle ? PUZZLES.indexOf(currentPuzzle) : -1,
          replayBase: replayBase
        };
      },
      apply: function (s) {
        if (!s || !Array.isArray(s.board) || s.board.length !== 8 || !Array.isArray(s.history)) return false;
        for (var ri = 0; ri < 8; ri++) if (!Array.isArray(s.board[ri]) || s.board[ri].length !== 8) return false;
        if (s.turn !== 'w' && s.turn !== 'b') return false;
        if (s.difficulty !== 'easy' && s.difficulty !== 'normal' && s.difficulty !== 'hard') return false;
        board = s.board.map(function (r) { return r.slice(); });
        turn = s.turn;
        selected = null; moves = []; over = false;
        capturedScore = s.capturedScore || 0;
        history = s.history;
        difficulty = s.difficulty;
        puzzleMode = !!s.puzzleMode;
        currentPuzzle = (puzzleMode && typeof s.puzzleIndex === 'number' && s.puzzleIndex >= 0 && s.puzzleIndex < PUZZLES.length) ? PUZZLES[s.puzzleIndex] : null;
        replayBase = typeof s.replayBase === 'string' ? s.replayBase : JSON.stringify(board);
        replaying = false; replayTimer = null;
        if (puzzleMode) {
          if (modeRow) {
            modeRow.querySelector('[data-mode="std"]').classList.remove('selected');
            modeRow.querySelector('[data-mode="puzzle"]').classList.add('selected');
            puzzleRow.style.display = '';
          }
          if (currentPuzzle) {
            var pzBtn = puzzleRow.querySelector('[data-pz="' + PUZZLES.indexOf(currentPuzzle) + '"]');
            if (pzBtn) { puzzleRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); }); pzBtn.classList.add('selected'); }
          }
        } else if (modeRow) {
          modeRow.querySelector('[data-mode="puzzle"]').classList.remove('selected');
          modeRow.querySelector('[data-mode="std"]').classList.add('selected');
          puzzleRow.style.display = 'none';
        }
        diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
        var diffBtn = diffRow.querySelector('[data-d="' + difficulty + '"]');
        if (diffBtn) diffBtn.classList.add('selected');
        render();
        if (turn === 'b') {
          msg.textContent = T('gs.chess.aiThink');
          msg.style.color = 'var(--text-dim)';
          setTimeout(aiTurn, 420);
        } else {
          msg.textContent = T('gs.chess.msgYourTurn');
          msg.style.color = '';
        }
        return true;
      }
    });
  }

  /* 残局库：FEN 式行（大写=白，小写=黑，. = 空） */
  var PUZZLES = [
    { name: '王后杀王', desc: '单后配合王，把黑王逼到边角将死', rows: [
      '....k...', '........', '........', '...Q....', '........', '........', '....K...', '........'
    ]},
    { name: '双车杀王', desc: '两车交替逼近，把黑王逼到边线', rows: [
      'R.......', '........', '........', '...K....', '.....k..', '........', '........', 'R.......'
    ]},
    { name: '王车杀王', desc: '用车逐格压缩黑王活动空间', rows: [
      '....k...', '........', '........', '........', '........', '....K...', '........', 'R.......'
    ]},
    { name: '后车杀王', desc: '后车合力碾压，几招之内解决战斗', rows: [
      '........', '........', '........', '....k...', '........', '...Q....', '....K...', 'R.......'
    ]},
    { name: '双后杀王', desc: '两个后协同封锁，把黑王困死在边线', rows: [
      '....k...', '........', '........', '........', '..K.....', '........', '...Q.Q..', '........'
    ]}
  ];
  function parsePuzzle(rows) {
    var b = [];
    for (var r = 0; r < 8; r++) {
      b[r] = [];
      for (var c = 0; c < 8; c++) {
        var ch = rows[r][c];
        b[r][c] = ch === '.' ? null : (ch === ch.toUpperCase() ? 'w' + ch : 'b' + ch.toUpperCase());
      }
    }
    return b;
  }
  function loadPuzzle(pz) {
    clearSave();
    puzzleMode = true;
    currentPuzzle = pz;
    board = parsePuzzle(pz.rows);
    turn = 'w'; selected = null; moves = []; over = false; capturedScore = 0;
    history = [];
    replayBase = JSON.stringify(board);
    var pzi = PUZZLES.indexOf(pz);
    render();
    msg.textContent = T('gs.chess.puzzleMsg').replace('{n}', T('gs.chess.pz' + pzi + 'n')).replace('{d}', T('gs.chess.pz' + pzi + 'd'));
    msg.style.color = 'var(--neon-yellow)';
  }

  function newGame() {
    clearSave();
    board = [];
    var back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    for (var c = 0; c < 8; c++) { board[0] = board[0] || []; board[1] = board[1] || []; board[0][c] = 'b' + back[c]; board[1][c] = 'bp'; }
    for (var r = 2; r < 6; r++) { board[r] = []; for (var cc = 0; cc < 8; cc++) board[r][cc] = null; }
    board[6] = []; board[7] = [];
    for (var c2 = 0; c2 < 8; c2++) { board[6][c2] = 'wp'; board[7][c2] = 'w' + back[c2]; }
    turn = 'w'; selected = null; moves = []; over = false; capturedScore = 0;
    history = [];
    puzzleMode = false;
    replayBase = JSON.stringify(board);
  }

  function inB(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function isOwn(piece, color) { return piece && piece[0] === color; }

  /* 生成某棋子的所有合法走法（不含送将校验，走后再验） */
  function genMoves(r, c) {
    var p = board[r][c];
    if (!p) return [];
    var color = p[0], type = p[1].toUpperCase();
    var out = [];
    var dirs = {
      R: [[1,0],[-1,0],[0,1],[0,-1]],
      B: [[1,1],[1,-1],[-1,1],[-1,-1]],
      Q: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
      K: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
      N: [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]
    };
    function add(rr, cc) { if (inB(rr, cc) && !isOwn(board[rr][cc], color) && !(board[rr][cc] && board[rr][cc][1] === 'K')) out.push([rr, cc]); }
    if (type === 'P') {
      var f = color === 'w' ? -1 : 1;
      if (inB(r + f, c) && !board[r + f][c]) { out.push([r + f, c]); if (((color === 'w' && r === 6) || (color === 'b' && r === 1)) && !board[r + 2 * f][c]) out.push([r + 2 * f, c]); }
      function pCap(rr, cc) { return board[rr][cc] && !isOwn(board[rr][cc], color) && board[rr][cc][1] !== 'K'; }
      if (inB(r + f, c - 1) && pCap(r + f, c - 1)) out.push([r + f, c - 1]);
      if (inB(r + f, c + 1) && pCap(r + f, c + 1)) out.push([r + f, c + 1]);
    } else {
      var d = dirs[type];
      for (var i = 0; i < d.length; i++) {
        var dr = d[i][0], dc = d[i][1];
        if (type === 'N' || type === 'K') { add(r + dr, c + dc); continue; }
        var rr2 = r + dr, cc2 = c + dc;
        while (inB(rr2, cc2)) {
          if (!board[rr2][cc2]) { out.push([rr2, cc2]); }
          else { if (!isOwn(board[rr2][cc2], color) && board[rr2][cc2][1] !== 'K') out.push([rr2, cc2]); break; }
          rr2 += dr; cc2 += dc;
        }
      }
    }
    return out;
  }

  function kingPos(color) {
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (board[r][c] === color + 'K') return { r: r, c: c };
    return null;
  }
  function isInCheck(color) {
    var kp = kingPos(color);
    if (!kp) return true;
    var opp = color === 'w' ? 'b' : 'w';
    // 王：相邻格
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var nr = kp.r + dr, nc = kp.c + dc;
      if (inB(nr, nc) && board[nr][nc] === opp + 'K') return true;
    }
    // 马
    var kn = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
    for (var i = 0; i < kn.length; i++) {
      var nr2 = kp.r + kn[i][0], nc2 = kp.c + kn[i][1];
      if (inB(nr2, nc2) && board[nr2][nc2] === opp + 'N') return true;
    }
    // 直线：车/后
    var ortho = [[1,0],[-1,0],[0,1],[0,-1]];
    for (var j = 0; j < 4; j++) {
      var rr = kp.r + ortho[j][0], cc = kp.c + ortho[j][1];
      while (inB(rr, cc)) {
        var p = board[rr][cc];
        if (p) { if (p[0] === opp && (p[1] === 'R' || p[1] === 'Q')) return true; break; }
        rr += ortho[j][0]; cc += ortho[j][1];
      }
    }
    // 斜线：象/后
    var diag = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (var k = 0; k < 4; k++) {
      var rr2 = kp.r + diag[k][0], cc2 = kp.c + diag[k][1];
      while (inB(rr2, cc2)) {
        var p2 = board[rr2][cc2];
        if (p2) { if (p2[0] === opp && (p2[1] === 'B' || p2[1] === 'Q')) return true; break; }
        rr2 += diag[k][0]; cc2 += diag[k][1];
      }
    }
    // 兵：斜吃（黑兵向下攻白王 → 白王查上一行 kp.r-1；白兵向上攻黑王 → 黑王查下一行 kp.r+1）
    var pr = color === 'w' ? kp.r - 1 : kp.r + 1;
    if (inB(pr, kp.c - 1) && board[pr][kp.c - 1] === opp + 'P') return true;
    if (inB(pr, kp.c + 1) && board[pr][kp.c + 1] === opp + 'P') return true;
    return false;
  }
  /* 模拟走子后是否合法（不送将） */
  function legalMove(r, c, nr, nc) {
    var saved = board[nr][nc];
    var color = board[r][c][0];
    board[nr][nc] = board[r][c]; board[r][c] = null;
    var check = isInCheck(color);
    board[r][c] = board[nr][nc]; board[nr][nc] = saved;
    return !check;
  }
  function allLegal(color) {
    var out = [];
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var p = board[r][c];
      if (p && p[0] === color) {
        var ms = genMoves(r, c);
        for (var i = 0; i < ms.length; i++) if (legalMove(r, c, ms[i][0], ms[i][1])) out.push({ fr: r, fc: c, tr: ms[i][0], tc: ms[i][1] });
      }
    }
    return out;
  }

  function doMove(m, noScore) {
    var piece = board[m.fr][m.fc];
    var cap = board[m.tr][m.tc];
    var rec = { fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc, piece: piece, cap: cap, scoreDelta: 0 };
    if (cap && !noScore) { rec.scoreDelta = PIECES[cap[1]] || 1; capturedScore += rec.scoreDelta; }
    board[m.tr][m.tc] = piece; board[m.fr][m.fc] = null;
    // 兵升变
    if (piece[1] === 'P' && (m.tr === 0 || m.tr === 7)) { rec.promoted = piece[0] + 'Q'; board[m.tr][m.tc] = rec.promoted; }
    return rec;
  }
  function undoMove(rec) {
    board[rec.fr][rec.fc] = rec.piece;
    board[rec.tr][rec.tc] = rec.cap || null;
    if (rec.scoreDelta) capturedScore -= rec.scoreDelta;
  }
  var history = [];
  function recordMove(rec) { history.push(rec); }
  function undoLastPair() {
    // 悔掉最近 AI 步 + 玩家步
    if (history.length === 0) return false;
    var n = history.length;
    undoMove(history[n - 1]); history.pop();
    if (history.length && history[history.length - 1].piece[0] === 'w') {
      undoMove(history[history.length - 1]); history.pop();
    }
    turn = 'w'; selected = null; moves = []; over = false;
    render();
    if (!gameEnd()) { msg.textContent = T('gs.chess.msgUndone'); msg.style.color = ''; }
    writeSave();
    return true;
  }

  function gameEnd() {
    var myMoves = allLegal(turn);
    if (!myMoves.length) {
      over = true;
      if (isInCheck(turn)) {
        var winner = turn === 'w' ? T('gs.chess.winBlack') : T('gs.chess.winYou');
        var sc = capturedScore;
        if (puzzleMode && turn === 'b') sc = Math.max(10, 100 - Math.floor(history.length / 2) * 2) + capturedScore;
        msg.textContent = T('gs.chess.checkmate').replace('{w}', winner).replace('{s}', sc);
        msg.style.color = turn === 'w' ? 'var(--neon-pink)' : 'var(--neon-green)';
        if (turn === 'w') { if (Arcade.juice) Arcade.juice.lose(); }
        else { if (Arcade.juice) Arcade.juice.win(); if (Arcade.shell) Arcade.shell.submitScore(sc); }
      } else {
        over = true;
        msg.textContent = T('gs.chess.stalemate').replace('{s}', capturedScore);
        msg.style.color = 'var(--neon-yellow)';
        if (Arcade.shell) Arcade.shell.submitScore(capturedScore);
      }
      return true;
    }
    return false;
  }

  /* ---------- AI ---------- */
  function evalBoard() {
    var s = 0;
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var p = board[r][c];
      if (!p) continue;
      s += (p[0] === 'b' ? 1 : -1) * (PIECES[p[1]] || 1);
    }
    // 将军惩罚：推动 AI 积极攻防（黑被将军=黑差）
    if (isInCheck('b')) s -= 30;
    if (isInCheck('w')) s += 30;
    // 王空间启发：黑王越靠边角越差（白方会逼王，AI 黑方会往中心逃）
    var bk = kingPos('b');
    if (bk) {
      var edgeDist = Math.min(bk.r, 7 - bk.r, bk.c, 7 - bk.c);
      s -= (3 - edgeDist) * 5;
    }
    // 白王逼近黑王奖励：白王离黑王越近，黑方越差（杀王的关键）
    var wk = kingPos('w');
    if (bk && wk) {
      s += Math.max(Math.abs(wk.r - bk.r), Math.abs(wk.c - bk.c));
    }
    return s; // 正=黑（AI）优
  }
  function aiMove() {
    var moves = allLegal('b');
    if (!moves.length) return;
    if (difficulty === 'easy') {
      // 简单：随机 + 稍微偏向吃子
      var captures = moves.filter(function (m) { return board[m.tr][m.tc]; });
      var pool = captures.length ? captures : moves;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (difficulty === 'normal') {
      // 中等：贪心吃子（吃最大价值）
      var best = moves[0], bv = -999;
      for (var i = 0; i < moves.length; i++) {
        var v = board[moves[i].tr][moves[i].tc] ? PIECES[board[moves[i].tr][moves[i].tc][1]] : 0;
        if (v > bv) { bv = v; best = moves[i]; }
      }
      return best;
    }
    // 困难：minimax 深度 2
    var best2 = moves[0], bestVal = -99999;
    for (var i2 = 0; i2 < moves.length; i2++) {
      var rec2 = doMove(moves[i2], true);
      var v2 = minimax(1, false, -99999, 99999);
      undoMove(rec2);
      if (v2 > bestVal) { bestVal = v2; best2 = moves[i2]; }
    }
    return best2;
  }
  function minimax(depth, maximizing, alpha, beta) {
    var moves = allLegal(maximizing ? 'b' : 'w');
    if (!moves.length) return maximizing ? -9999 + depth : 9999 - depth;
    if (depth === 0) return evalBoard();
    if (maximizing) {
      var best = -99999;
      for (var i = 0; i < moves.length; i++) {
        var rec = doMove(moves[i], true);
        best = Math.max(best, minimax(depth - 1, false, alpha, beta));
        undoMove(rec);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      var best2 = 99999;
      for (var i2 = 0; i2 < moves.length; i2++) {
        var rec2 = doMove(moves[i2], true);
        best2 = Math.min(best2, minimax(depth - 1, true, alpha, beta));
        undoMove(rec2);
        beta = Math.min(beta, best2);
        if (beta <= alpha) break;
      }
      return best2;
    }
  }

  function aiTurn() {
    if (over || turn !== 'b' || replaying) return;
    var m = aiMove();
    if (!m) return;
    recordMove(doMove(m));
    if (Arcade.juice) Arcade.juice.move();
    turn = 'w';
    render();
    if (!gameEnd()) {
      msg.textContent = T('gs.chess.msgYourTurn');
      msg.style.color = '';
    }
    writeSave();
  }

  /* ---------- UI ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'ch-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="ch-mode">' +
    '  <button class="btn mode-btn selected" data-mode="std">' + T('gs.chess.modeStd') + '</button>' +
    '  <button class="btn mode-btn" data-mode="puzzle">' + T('gs.chess.modePuzzle') + '</button>' +
    '</div>' +
    '<div class="mode-row" id="ch-diff">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.chess.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.chess.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.chess.dHard') + '</button>' +
    '</div>' +
    '<div class="mode-row" id="ch-puzzles" style="display:none">' +
    '  <button class="btn mode-btn selected" data-pz="0">' + T('gs.chess.pz0n') + '</button>' +
    '  <button class="btn mode-btn" data-pz="1">' + T('gs.chess.pz1n') + '</button>' +
    '  <button class="btn mode-btn" data-pz="2">' + T('gs.chess.pz2n') + '</button>' +
    '  <button class="btn mode-btn" data-pz="3">' + T('gs.chess.pz3n') + '</button>' +
    '  <button class="btn mode-btn" data-pz="4">' + T('gs.chess.pz4n') + '</button>' +
    '</div>' +
    '<div class="ch-grid" id="ch-grid"></div>' +
    '<div class="ch-msg" id="ch-msg">' + T('gs.chess.msgStart') + '</div>' +
    '<div class="game-controls">' +
    '  <button class="btn cyan" id="ch-undo">' + T('gs.chess.undo') + '</button>' +
    '  <button class="btn cyan" id="ch-replay">' + T('gs.chess.replay') + '</button>' +
    '  <button class="btn yellow" id="ch-hint">' + T('gs.chess.hint') + '</button>' +
    '  <button class="btn purple" id="ch-restart">' + T('gs.chess.restart') + '</button>' +
    '</div>' +
    '<div class="ch-help">' + T('gs.chess.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#ch-grid'), msg = wrap.querySelector('#ch-msg'),
      restartBtn = wrap.querySelector('#ch-restart'), undoBtn = wrap.querySelector('#ch-undo'),
      hintBtn = wrap.querySelector('#ch-hint'), diffRow = wrap.querySelector('#ch-diff'),
      modeRow = wrap.querySelector('#ch-mode'), puzzleRow = wrap.querySelector('#ch-puzzles'),
      replayBtn = wrap.querySelector('#ch-replay');
  var cells = [];

  /* 提示：返回对白方价值最高的走法（吃子优先） */
  function getHint() {
    var all = allLegal('w');
    if (!all.length) return null;
    var best = all[0], bv = -999;
    for (var i = 0; i < all.length; i++) {
      var m = all[i];
      var v = board[m.tr][m.tc] ? PIECES[board[m.tr][m.tc][1]] : 0;
      if (v > bv) { bv = v; best = m; }
    }
    return best;
  }
  modeRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      modeRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      var m = b.getAttribute('data-mode');
      puzzleRow.style.display = m === 'puzzle' ? '' : 'none';
      if (m === 'puzzle') {
        if (!puzzleMode) loadPuzzle(PUZZLES[0]);
        msg.textContent = T('gs.chess.msgPickPuzzle');
        msg.style.color = 'var(--neon-yellow)';
      } else {
        if (puzzleMode) { newGame(); render(); }
        msg.textContent = T('gs.chess.msgStart');
        msg.style.color = '';
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  puzzleRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      puzzleRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      loadPuzzle(PUZZLES[Number(b.getAttribute('data-pz'))]);
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  replayBtn.addEventListener('click', function () {
    if (replaying) return;
    if (!history.length) { msg.textContent = T('gs.chess.replayNone'); msg.style.color = 'var(--text-dim)'; return; }
    replaying = true;
    var savedBoard = JSON.stringify(board), savedHistory = history.slice(),
        savedTurn = turn, savedCaptured = capturedScore, savedOver = over;
    board = JSON.parse(replayBase);
    selected = null; moves = []; msg.textContent = '';
    render();
    msg.textContent = T('gs.chess.replayPlay').replace('{n}', savedHistory.length);
    msg.style.color = 'var(--neon-cyan)';
    var i = 0;
    replayTimer = setInterval(function () {
      if (i >= savedHistory.length) {
        clearInterval(replayTimer); replayTimer = null;
        board = JSON.parse(savedBoard); history = savedHistory;
        turn = savedTurn; capturedScore = savedCaptured; over = savedOver;
        replaying = false; selected = null; moves = [];
        render();
        msg.textContent = T('gs.chess.replayDone');
        msg.style.color = '';
        return;
      }
      var rec = savedHistory[i++];
      board[rec.fr][rec.fc] = null;
      board[rec.tr][rec.tc] = rec.promoted || rec.piece;
      render();
    }, 320);
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  undoBtn.addEventListener('click', function () {
    if (replaying) { msg.textContent = T('gs.chess.replayWait'); msg.style.color = 'var(--text-dim)'; return; }
    if (turn !== 'w' || over) { msg.textContent = T('gs.chess.undoOnlyTurn'); msg.style.color = 'var(--text-dim)'; return; }
    undoLastPair();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  hintBtn.addEventListener('click', function () {
    if (turn !== 'w' || over) { msg.textContent = T('gs.chess.hintOnlyTurn'); msg.style.color = 'var(--text-dim)'; return; }
    var h = getHint();
    if (h) {
      selected = [h.fr, h.fc];
      moves = [{ r: h.tr, c: h.tc }];
      msg.textContent = T('gs.chess.hintMove').replace('{p}', pieceName(board[h.fr][h.fc])).replace('{r}', h.tr + 1).replace('{c}', h.tc + 1);
      msg.style.color = 'var(--neon-yellow)';
      render();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  function pieceName(p) {
    if (!p) return T('gs.chess.piece');
    var names = { K: T('gs.chess.pK'), Q: T('gs.chess.pQ'), R: T('gs.chess.pR'), B: T('gs.chess.pB'), N: T('gs.chess.pN'), P: T('gs.chess.pP') };
    return names[p[1]] || p[1];
  }

  function render() {
    gridEl.innerHTML = '';
    cells = [];
    var g = '';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var d = document.createElement('div');
      d.className = 'ch-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      var p = board[r][c];
      var glyph = { wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙', bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟' };
      if (p) { d.textContent = glyph[p[0] + p[1]] || ''; d.style.color = p[0] === 'w' ? '#f5f0e6' : '#2b2b2b'; }
      if (selected && selected[0] === r && selected[1] === c) d.classList.add('sel');
      var isMove = moves.some(function (m) { return m[0] === r && m[1] === c; });
      if (isMove) d.classList.add(board[r][c] ? 'capture' : 'move');
      d.addEventListener('click', (function (rr, cc) { return function () { click(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  function click(r, c) {
    if (over || turn !== 'w' || replaying) return;
    var p = board[r][c];
    if (selected) {
      var isTarget = moves.some(function (m) { return m[0] === r && m[1] === c; });
      if (isTarget) {
        recordMove(doMove({ fr: selected[0], fc: selected[1], tr: r, tc: c }));
        if (Arcade.juice) Arcade.juice.move();
        selected = null; moves = [];
        turn = 'b';
        render();
        if (!gameEnd()) {
          msg.textContent = T('gs.chess.aiThink');
          msg.style.color = 'var(--text-dim)';
          setTimeout(aiTurn, 420);
        }
        writeSave();
        return;
      }
      if (p && p[0] === 'w') { selected = [r, c]; moves = legalMovesFor(r, c); render(); return; }
      selected = null; moves = [];
    } else if (p && p[0] === 'w') {
      selected = [r, c]; moves = legalMovesFor(r, c);
    }
    render();
  }

  function legalMovesFor(r, c) {
    var all = genMoves(r, c);
    return all.filter(function (m) { return legalMove(r, c, m[0], m[1]); });
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-d');
      if (puzzleMode) {
        var diffKey = { easy: 'gs.chess.dEasy', normal: 'gs.chess.dNormal', hard: 'gs.chess.dHard' };
        msg.textContent = T('gs.chess.diffChanged').replace('{d}', T(diffKey[difficulty]));
        msg.style.color = 'var(--neon-yellow)';
      } else {
        newGame(); render();
        msg.textContent = T('gs.chess.msgStart');
        msg.style.color = '';
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  function restartCurrent() {
    if (puzzleMode && currentPuzzle) { loadPuzzle(currentPuzzle); return; }
    newGame(); render();
    msg.textContent = T('gs.chess.msgStart');
    msg.style.color = '';
  }
  restartBtn.addEventListener('click', function () { restartCurrent(); if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.chess.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { restartCurrent(); };

  if (!tryResume()) newGame();
  render();

})();
