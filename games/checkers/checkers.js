/* 跳棋 Checkers vs AI —— 批次D 棋牌策略 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.checkers.tut1t'), d: T('gs.checkers.tut1') },
  { t: T('gs.checkers.tut2t'), d: T('gs.checkers.tut2') },
  { t: T('gs.checkers.tut3t'), d: T('gs.checkers.tut3') },
  { t: T('gs.checkers.tut4t'), d: T('gs.checkers.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var DIFFS = { easy: 'easy', normal: 'normal', hard: 'hard' };
  var difficulty = 'normal';
  var board, turn, selected, moves, over, score;
  var R = 8, C = 8;

  function newGame() {
    board = [];
    for (var r = 0; r < R; r++) {
      board[r] = [];
      for (var c = 0; c < C; c++) {
        var isDark = (r + c) % 2 === 1;
        var v = null;
        if (isDark) {
          if (r < 3) v = { color: 'black', king: false };
          if (r > 4) v = { color: 'red', king: false };
        }
        board[r][c] = v;
      }
    }
    turn = 'red'; selected = null; moves = []; over = false; score = 0;
  }

  function inB(r, c) { return r >= 0 && r < R && c >= 0 && c < C; }
  function isDark(r, c) { return (r + c) % 2 === 1; }

  /* 单步斜走 */
  function stepMoves(r, c) {
    var p = board[r][c];
    if (!p) return [];
    var out = [];
    var dirs = p.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (p.color === 'red' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      // 王可滑行任意格（沿途须为空暗格）；兵只走 1 格
      while (inB(nr, nc) && isDark(nr, nc) && !board[nr][nc]) {
        out.push({ r: nr, c: nc, jumps: [] });
        if (!p.king) break;
        nr += dirs[i][0]; nc += dirs[i][1];
      }
    }
    return out;
  }
  /* 单步跳吃（王可沿斜线越任意距离；只越遇到的第一个敌子） */
  function jumpMoves(r, c, visited) {
    var p = board[r][c];
    if (!p) return [];
    var out = [];
    var dirs = p.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (p.color === 'red' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
    for (var i = 0; i < dirs.length; i++) {
      var dr = dirs[i][0], dc = dirs[i][1];
      var mr = r + dr, mc = c + dc;
      while (inB(mr, mc) && isDark(mr, mc)) {
        var mid = board[mr][mc];
        if (mid) {
          if (mid.color !== p.color && !visited[mr + ',' + mc]) {
            var lr = mr + dr, lc = mc + dc;
            if (inB(lr, lc) && isDark(lr, lc) && !board[lr][lc]) out.push({ r: lr, c: lc, jumps: [[mr, mc]] });
          }
          break; // 遇到子（敌/己）即停
        }
        if (!p.king) break; // 兵前方为空则不能跳
        mr += dr; mc += dc;
      }
    }
    return out;
  }
  /* 连锁跳吃：从 (r,c) 出发，递归展开全部最大跳吃链（强制连跳） */
  function expandChains(fr, fc, captured) {
    var chains = [];
    var hops = jumpMoves(fr, fc, captured);
    for (var i = 0; i < hops.length; i++) {
      var h = hops[i];
      var cm = h.jumps[0];
      var cap2 = {};
      for (var k in captured) cap2[k] = true;
      cap2[cm[0] + ',' + cm[1]] = true;
      // 临时移动棋子找后续跳
      var p = board[fr][fc];
      var savedMid = board[cm[0]][cm[1]];
      board[cm[0]][cm[1]] = null;
      board[fr][fc] = null;
      board[h.r][h.c] = p;
      var sub = expandChains(h.r, h.c, cap2);
      board[h.r][h.c] = null;
      board[fr][fc] = p;
      board[cm[0]][cm[1]] = savedMid;
      if (sub.length) {
        for (var s = 0; s < sub.length; s++) {
          chains.push({ fr: fr, fc: fc, tr: sub[s].tr, tc: sub[s].tc, jumps: [[cm[0], cm[1]]].concat(sub[s].jumps) });
        }
      } else {
        chains.push({ fr: fr, fc: fc, tr: h.r, tc: h.c, jumps: [[cm[0], cm[1]]] });
      }
    }
    return chains;
  }
  /* 所有合法走法（含连锁跳吃；有跳必跳） */
  function allMoves(color) {
    var out = [];
    var mustJump = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var p = board[r][c];
      if (p && p.color === color) {
        var chains = expandChains(r, c, {});
        if (chains.length) mustJump = mustJump.concat(chains);
        else if (!mustJump.length) {
          var sm = stepMoves(r, c);
          out = out.concat(sm.map(function (m) { return { fr: r, fc: c, tr: m.r, tc: m.c, jumps: [] }; }));
        }
      }
    }
    return mustJump.length ? mustJump : out;
  }

  function doMove(m, isPlayer) {
    var p = board[m.fr][m.fc];
    // 记录状态供 undo 精确还原（含被吃子是否为王）
    m._prevKing = !!p.king;
    m._captured = [];
    for (var i = 0; i < m.jumps.length; i++) {
      var jr = m.jumps[i][0], jc = m.jumps[i][1];
      var cp = board[jr][jc];
      m._captured.push({ r: jr, c: jc, color: cp.color, king: !!cp.king });
      board[jr][jc] = null;
      if (isPlayer) score += 1;
    }
    board[m.tr][m.tc] = p;
    board[m.fr][m.fc] = null;
    // 升王（仅在最终落点、原本非王时）
    if (p.color === 'red' && m.tr === 0 && !p.king) { p.king = true; if (isPlayer) score += 2; }
    if (p.color === 'black' && m.tr === R - 1 && !p.king) { p.king = true; }
  }

  function count(color) {
    var n = 0;
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (board[r][c] && board[r][c].color === color) n++;
    return n;
  }
  function gameEnd() {
    var myMoves = allMoves(turn);
    if (!myMoves.length || count('red') === 0 || count('black') === 0) {
      over = true;
      var redLeft = count('red'), blackLeft = count('black');
      if (redLeft === 0) {
        msg.textContent = T('gs.checkers.loseAll').replace('{n}', score);
        msg.style.color = 'var(--neon-pink)';
        if (Arcade.juice) Arcade.juice.lose();
      } else if (blackLeft === 0) {
        score += 5;
        msg.textContent = T('gs.checkers.winScore').replace('{n}', score);
        msg.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(score);
      } else if (turn === 'red') {
        // 红方（玩家）无子可走 → 负
        msg.textContent = T('gs.checkers.loseNoMoves').replace('{n}', score);
        msg.style.color = 'var(--neon-pink)';
        if (Arcade.juice) Arcade.juice.lose();
      } else {
        // 黑方（AI）无子可走 → 玩家胜（教程承诺的胜利条件）
        score += 5;
        msg.textContent = T('gs.checkers.winAiNoMoves').replace('{n}', score);
        msg.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(score);
      }
      return true;
    }
    return false;
  }

  /* ---------- AI ---------- */
  function aiMove() {
    var moves = allMoves('black');
    if (!moves.length) return;
    if (difficulty === 'easy') {
      var jumps = moves.filter(function (m) { return m.jumps.length; });
      var pool = jumps.length ? jumps : moves;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (difficulty === 'normal') {
      var best = moves[0], bv = -999;
      for (var i = 0; i < moves.length; i++) {
        var v = moves[i].jumps.length * 2 + (moves[i].tr === R - 1 ? 1 : 0);
        if (v > bv) { bv = v; best = moves[i]; }
      }
      return best;
    }
    // 困难：minimax 深度 3（简化评估）
    var best2 = moves[0], bestVal = -99999;
    for (var i2 = 0; i2 < moves.length; i2++) {
      doMove(moves[i2], false);
      var v2 = mini(2, true);
      undo(moves[i2]);
      if (v2 > bestVal) { bestVal = v2; best2 = moves[i2]; }
    }
    return best2;
  }
  function undo(m) {
    var p = board[m.tr][m.tc];
    board[m.fr][m.fc] = p;
    board[m.tr][m.tc] = null;
    p.king = !!m._prevKing; // 精确还原（原本是王的保持王）
    for (var i = 0; i < (m._captured || []).length; i++) {
      var cp = m._captured[i];
      board[cp.r][cp.c] = { color: cp.color, king: cp.king };
    }
  }
  function evalB() {
    var s = 0;
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var p = board[r][c];
      if (!p) continue;
      var v = p.king ? 3 : 1;
      s += p.color === 'black' ? v : -v;
    }
    return s; // 正=黑(AI)优
  }
  function mini(depth, maximizing) {
    var moves = allMoves(maximizing ? 'black' : 'red');
    if (!moves.length) return maximizing ? -999 : 999;
    if (depth === 0) return evalB();
    var best = maximizing ? -99999 : 99999;
    for (var i = 0; i < moves.length; i++) {
      doMove(moves[i], false);
      var v = mini(depth - 1, !maximizing);
      undo(moves[i]);
      if (maximizing) best = Math.max(best, v); else best = Math.min(best, v);
    }
    return best;
  }

  function aiTurn() {
    if (over || turn !== 'black') return;
    var m = aiMove();
    if (!m) return;
    doMove(m, false);
    if (Arcade.juice) Arcade.juice.move();
    turn = 'red';
    render();
    if (!gameEnd()) { msg.textContent = T('gs.checkers.yourTurn'); msg.style.color = ''; }
  }

  /* ---------- UI ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'ck-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="ck-diff">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.checkers.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.checkers.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.checkers.dHard') + '</button>' +
    '</div>' +
    '<div class="ck-grid" id="ck-grid"></div>' +
    '<div class="ck-msg" id="ck-msg">' + T('gs.checkers.startMsg') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="ck-restart">' + T('gs.checkers.restart') + '</button></div>' +
    '<div class="ck-help">' + T('gs.checkers.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#ck-grid'), msg = wrap.querySelector('#ck-msg'),
      restartBtn = wrap.querySelector('#ck-restart'), diffRow = wrap.querySelector('#ck-diff');
  var cells = [];

  function render() {
    gridEl.innerHTML = '';
    cells = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var d = document.createElement('div');
      d.className = 'ck-cell ' + (isDark(r, c) ? 'dark' : 'light');
      var p = board[r][c];
      if (p) {
        var pc = document.createElement('div');
        pc.className = 'ck-piece ' + p.color + (p.king ? ' king' : '');
        d.appendChild(pc);
      }
      if (selected && selected[0] === r && selected[1] === c) d.classList.add('sel');
      var isMove = moves.some(function (m) { return m.r === r && m.c === c; });
      if (isMove) d.classList.add(moves.filter(function (m) { return m.r === r && m.c === c; })[0].jumps.length ? 'jump' : 'move');
      d.addEventListener('click', (function (rr, cc) { return function () { click(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  function click(r, c) {
    if (over || turn !== 'red') return;
    var p = board[r][c];
    // 有跳必跳：场上存在可跳吃的红子时，只允许选择可跳的棋子（与 AI 规则一致）
    function forcedJumpPieces() {
      var res = {};
      for (var r2 = 0; r2 < R; r2++) for (var c2 = 0; c2 < C; c2++) {
        var pp = board[r2][c2];
        if (pp && pp.color === 'red' && expandChains(r2, c2, {}).length) res[r2 + ',' + c2] = true;
      }
      return res;
    }
    var forced = forcedJumpPieces();
    var hasForced = Object.keys(forced).length > 0;
    if (selected) {
      var target = moves.filter(function (m) { return m.r === r && m.c === c; })[0];
      if (target) {
        doMove({ fr: selected[0], fc: selected[1], tr: r, tc: c, jumps: target.jumps }, true);
        selected = null; moves = [];
        turn = 'black';
        render();
        if (!gameEnd()) {
          msg.textContent = T('gs.checkers.aiThinking');
          msg.style.color = 'var(--text-dim)';
          setTimeout(aiTurn, 350);
        }
        return;
      }
      if (p && p.color === 'red') {
        if (hasForced && !forced[r + ',' + c]) { msg.textContent = T('gs.checkers.mustJump'); msg.style.color = 'var(--neon-yellow)'; render(); return; }
        selected = [r, c]; moves = movesFor(r, c); render(); return;
      }
      selected = null; moves = [];
    } else if (p && p.color === 'red') {
      if (hasForced && !forced[r + ',' + c]) { msg.textContent = T('gs.checkers.mustJump'); msg.style.color = 'var(--neon-yellow)'; render(); return; }
      selected = [r, c]; moves = movesFor(r, c);
    }
    render();
  }

  function movesFor(r, c) {
    var chains = expandChains(r, c, {});
    if (chains.length) return chains.map(function (m) { return { r: m.tr, c: m.tc, jumps: m.jumps }; });
    return stepMoves(r, c).map(function (m) { return { r: m.r, c: m.c, jumps: [] }; });
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-d');
      newGame(); render();
      msg.textContent = T('gs.checkers.startMsg');
      msg.style.color = '';
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { newGame(); render(); msg.textContent = T('gs.checkers.startMsg'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { newGame(); render(); msg.textContent = T('gs.checkers.startMsg'); msg.style.color = ''; };

  newGame(); render();

})();
