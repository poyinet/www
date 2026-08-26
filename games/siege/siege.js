/* 攻城棋 Siege —— 批次D 棋牌策略（原创轻策略：王 + 兵，占高地攻坚） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.siege.tut1t'), d: T('gs.siege.tut1') },
  { t: T('gs.siege.tut2t'), d: T('gs.siege.tut2') },
  { t: T('gs.siege.tut3t'), d: T('gs.siege.tut3') },
  { t: T('gs.siege.tut4t'), d: T('gs.siege.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var R = 8, C = 8;
  var DIFFS = { easy: 'easy', normal: 'normal', hard: 'hard' };
  var difficulty = 'normal';
  var board, turn, selected, moves, over, score;

  function newGame() {
    board = [];
    for (var r = 0; r < R; r++) {
      board[r] = [];
      for (var c = 0; c < C; c++) {
        var terrain = (r + c) % 3 === 0 ? 'stone' : 'grass'; // 随机高地
        var v = null;
        if (r === 0 && c % 2 === 1) v = { color: 'red', type: 'soldier', terrain: terrain };
        if (r === 0 && c === 4) v = { color: 'red', type: 'king', terrain: terrain };
        if (r === 7 && c % 2 === 0) v = { color: 'blue', type: 'soldier', terrain: terrain };
        if (r === 7 && c === 3) v = { color: 'blue', type: 'king', terrain: terrain };
        board[r][c] = v;
      }
    }
    turn = 'blue'; selected = null; moves = []; over = false; score = 0;
  }

  function inB(r, c) { return r >= 0 && r < R && c >= 0 && c < C; }
  function isTerrain(r, c) { return (r + c) % 3 === 0; }

  function movesFor(r, c) {
    var p = board[r][c];
    if (!p) return [];
    var out = [];
    var color = p.color;
    if (p.type === 'king') {
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (!inB(nr, nc)) continue;
        if (!board[nr][nc]) out.push({ r: nr, c: nc, kind: 'move' });
        else if (board[nr][nc].color !== color) out.push({ r: nr, c: nc, kind: 'attack' });
      }
    } else {
      // 兵：移动 1 格向前或横；攻击斜前
      var f = color === 'blue' ? -1 : 1;
      if (inB(r + f, c) && !board[r + f][c]) out.push({ r: r + f, c: c, kind: 'move' });
      if (inB(r, c - 1) && !board[r][c - 1]) out.push({ r: r, c: c - 1, kind: 'move' });
      if (inB(r, c + 1) && !board[r][c + 1]) out.push({ r: r, c: c + 1, kind: 'move' });
      var atkRng = isTerrain(r, c) ? 2 : 1; // 高地上攻击距离 2
      for (var d2 = -1; d2 <= 1; d2 += 2) { // 斜前攻击（教程：兵走 1 格斜吃）
        for (var dist = 1; dist <= atkRng; dist++) {
          var ar = r + f * dist, ac = c + d2 * dist;
          if (!inB(ar, ac)) continue;
          if (board[ar][ac]) {
            if (board[ar][ac].color !== color) out.push({ r: ar, c: ac, kind: 'attack' });
            break;
          }
        }
      }
    }
    return out;
  }

  function allMoves(color) {
    var out = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var p = board[r][c];
      if (p && p.color === color) {
        movesFor(r, c).forEach(function (m) { out.push({ fr: r, fc: c, tr: m.r, tc: m.c, kind: m.kind }); });
      }
    }
    return out;
  }

  function doMove(m, isPlayer) {
    var p = board[m.fr][m.fc];
    var target = board[m.tr][m.tc];
    if (target) {
      if (isPlayer) score += target.type === 'king' ? 10 : 1;
    }
    board[m.tr][m.tc] = p;
    board[m.fr][m.fc] = null;
    if (p.type === 'soldier' && (m.tr === 0 || m.tr === R - 1)) board[m.tr][m.tc] = { color: p.color, type: 'king', terrain: isTerrain(m.tr, m.tc) }; // 晋升王
  }

  function kingAlive(color) {
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (board[r][c] && board[r][c].type === 'king' && board[r][c].color === color) return true;
    return false;
  }

  function gameEnd() {
    if (!kingAlive('red')) {
      over = true;
      msg.textContent = T('gs.siege.win').replace('{n}', score);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
      return true;
    }
    if (!kingAlive('blue')) {
      over = true;
      msg.textContent = T('gs.siege.lose').replace('{n}', score);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
      if (Arcade.shell) Arcade.shell.submitScore(score);
      return true;
    }
    // 无子可走（僵局）：当前行动方无任何合法着法 → 对方胜（修复此前可无限僵持）
    if (turn && !allMoves(turn).length) {
      over = true;
      var blueWin = turn === 'red';
      msg.textContent = blueWin
        ? T('gs.siege.stalemateWin').replace('{n}', score)
        : T('gs.siege.stalemateLose').replace('{n}', score);
      msg.style.color = blueWin ? 'var(--neon-green)' : 'var(--neon-pink)';
      if (blueWin) {
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(score);
      } else {
        if (Arcade.juice) Arcade.juice.lose();
      }
      return true;
    }
    return false;
  }

  /* ---------- AI ---------- */
  function aiMove() {
    var moves = allMoves('red');
    if (!moves.length) return null;
    if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
    if (difficulty === 'normal') {
      // 优先攻击、其次推进、避免暴露王
      var attacks = moves.filter(function (m) { return m.kind === 'attack'; });
      if (attacks.length) {
        var kingAtk = attacks.filter(function (m) { return board[m.tr][m.tc].type === 'king'; });
        return (kingAtk.length ? kingAtk : attacks)[Math.floor(Math.random() * Math.min(3, (kingAtk.length ? kingAtk : attacks).length))];
      }
      var advances = moves.filter(function (m) { return m.tr - m.fr > 0; }); // 红向下推进
      return (advances.length ? advances : moves)[Math.floor(Math.random() * Math.min(3, (advances.length ? advances : moves).length))];
    }
    // 困难：评估 + 随机探索（简化贪心）
    var best = null, bv = -999;
    for (var i = 0; i < moves.length; i++) {
      var v = 0;
      if (moves[i].kind === 'attack') v += board[moves[i].tr][moves[i].tc].type === 'king' ? 50 : 10;
      v += (moves[i].tr - moves[i].fr) * 2; // 推进分（红向下推进）
      if (moves[i].kind === 'move' && board[moves[i].fr][moves[i].fc].type === 'king') v -= 5; // 王别乱动
      if (v > bv) { bv = v; best = moves[i]; }
    }
    return best;
  }

  function aiTurn() {
    if (over || turn !== 'red') return;
    var m = aiMove();
    if (m) {
      doMove(m, false);
      if (Arcade.juice) Arcade.juice.move();
    }
    turn = 'blue';
    render();
    if (!gameEnd()) { msg.textContent = T('gs.siege.yourTurn'); msg.style.color = ''; }
  }

  /* ---------- UI ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'sg-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="sg-diff">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.siege.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.siege.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.siege.dHard') + '</button>' +
    '</div>' +
    '<div class="sg-grid" id="sg-grid"></div>' +
    '<div class="sg-msg" id="sg-msg">' + T('gs.siege.startMsg') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="sg-restart">' + T('gs.siege.restart') + '</button></div>' +
    '<div class="sg-help">' + T('gs.siege.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#sg-grid'), msg = wrap.querySelector('#sg-msg'),
      restartBtn = wrap.querySelector('#sg-restart'), diffRow = wrap.querySelector('#sg-diff');
  var cells = [];

  var GLYPHS = { blueKing: '♚', blueSoldier: '♟', redKing: '♚', redSoldier: '♟' };
  var COLORS = { blue: '#00f0ff', red: '#ff2d95' };

  function render() {
    gridEl.innerHTML = '';
    cells = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var d = document.createElement('div');
      d.className = 'sg-cell ' + (isTerrain(r, c) ? 'stone' : 'grass');
      var p = board[r][c];
      if (p) {
        d.textContent = GLYPHS[p.color + p.type[0].toUpperCase() + p.type.slice(1)];
        d.style.color = COLORS[p.color];
      }
      if (selected && selected[0] === r && selected[1] === c) d.classList.add('sel');
      var mv = moves.filter(function (m) { return m.r === r && m.c === c; })[0];
      if (mv) d.classList.add(mv.kind === 'attack' ? 'attack' : 'move');
      d.addEventListener('click', (function (rr, cc) { return function () { click(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  function click(r, c) {
    if (over || turn !== 'blue') return;
    var p = board[r][c];
    if (selected) {
      var target = moves.filter(function (m) { return m.r === r && m.c === c; })[0];
      if (target) {
        doMove({ fr: selected[0], fc: selected[1], tr: r, tc: c, kind: target.kind }, true);
        selected = null; moves = [];
        turn = 'red';
        render();
        if (!gameEnd()) {
          msg.textContent = T('gs.siege.aiTurn');
          msg.style.color = 'var(--text-dim)';
          setTimeout(aiTurn, 350);
        }
        return;
      }
      if (p && p.color === 'blue') { selected = [r, c]; moves = movesFor(r, c); render(); return; }
      selected = null; moves = [];
    } else if (p && p.color === 'blue') {
      selected = [r, c]; moves = movesFor(r, c);
    }
    render();
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-d');
      newGame(); render();
      msg.textContent = T('gs.siege.startMsg');
      msg.style.color = '';
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { newGame(); render(); msg.textContent = T('gs.siege.startMsg'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.siege.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { newGame(); render(); msg.textContent = T('gs.siege.startMsg'); msg.style.color = ''; };

  newGame(); render();

})();
