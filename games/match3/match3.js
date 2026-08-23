/* ============================================================
   消消乐：8x8 六色糖果，交换三连消除，级联连锁倍分
   30 步限制，死局自动重洗，得分高分优
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.match3.tut1t'), d: T('gs.match3.tut1') },
    { t: T('gs.match3.tut2t'), d: T('gs.match3.tut2') },
    { t: T('gs.match3.tut3t'), d: T('gs.match3.tut3') }
  ];

  var SIZE = 8;
  var CELLS = SIZE * SIZE;
  var TYPES = 6;
  var MAX_MOVES = 30;
  var CLEAR_MS = 260;          // 消除缩放淡出动画时长
  var EMOJIS = ['🍬', '🍭', '🍓', '🍋', '🍇', '🫐'];
  var DEFAULT_MSG = T('gs.match3.msgStart');

  root.innerHTML =
    '<div class="game-message" id="msg">' + DEFAULT_MSG + '</div>' +
    '<div class="grid-board m3-board" id="board"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.match3.score') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.match3.movesLeft') + ' <span class="stat-value" id="moves">' + MAX_MOVES + '</span></span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="restart-btn" class="btn purple">' + T('gs.match3.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.match3.help').replace('{m}', MAX_MOVES) + '</p>';

  var boardEl = document.getElementById('board');
  var msgEl = document.getElementById('msg');
  var scoreEl = document.getElementById('score');
  var movesEl = document.getElementById('moves');
  var restartBtn = document.getElementById('restart-btn');

  var board = [];      // 64 格，值为 0~5（emoji 下标），消除瞬间为 null
  var cells = [];
  var score, movesLeft, selected, busy, over, gen;

  function randType() {
    return Math.floor(Math.random() * TYPES);
  }

  function idx(r, c) {
    return r * SIZE + c;
  }

  function swap(b, i, j) {
    var t = b[i]; b[i] = b[j]; b[j] = t;
  }

  /* ---------- 棋盘生成 ---------- */

  /* 生成无初始三连的棋盘：逐格填充，避开与左两格/上两格同色 */
  function generateBoard() {
    var b = new Array(CELLS);
    for (var i = 0; i < CELLS; i++) {
      var r = Math.floor(i / SIZE);
      var c = i % SIZE;
      var t;
      do {
        t = randType();
      } while ((c >= 2 && b[i - 1] === t && b[i - 2] === t) ||
               (r >= 2 && b[i - SIZE] === t && b[i - 2 * SIZE] === t));
      b[i] = t;
    }
    return b;
  }

  /* 扫描全盘三连，返回布尔标记数组；无三连返回 null */
  function findMatches(b) {
    var mark = new Array(CELLS).fill(false);
    var found = false;
    var r, c, k, run;
    for (r = 0; r < SIZE; r++) {           // 行扫描
      run = 1;
      for (c = 1; c <= SIZE; c++) {
        if (c < SIZE && b[idx(r, c)] !== null && b[idx(r, c)] === b[idx(r, c - 1)]) {
          run++;
        } else {
          if (run >= 3) {
            for (k = c - run; k < c; k++) mark[idx(r, k)] = true;
            found = true;
          }
          run = 1;
        }
      }
    }
    for (c = 0; c < SIZE; c++) {           // 列扫描
      run = 1;
      for (r = 1; r <= SIZE; r++) {
        if (r < SIZE && b[idx(r, c)] !== null && b[idx(r, c)] === b[idx(r - 1, c)]) {
          run++;
        } else {
          if (run >= 3) {
            for (k = r - run; k < r; k++) mark[idx(k, c)] = true;
            found = true;
          }
          run = 1;
        }
      }
    }
    return found ? mark : null;
  }

  /* 交换 i,j 是否会产生三连（先试换再换回） */
  function wouldMatch(b, i, j) {
    swap(b, i, j);
    var m = findMatches(b) !== null;
    swap(b, i, j);
    return m;
  }

  /* 是否还存在有效移动 */
  function hasValidMove(b) {
    for (var i = 0; i < CELLS; i++) {
      var r = Math.floor(i / SIZE);
      var c = i % SIZE;
      if (c < SIZE - 1 && wouldMatch(b, i, i + 1)) return true;
      if (r < SIZE - 1 && wouldMatch(b, i, i + SIZE)) return true;
    }
    return false;
  }

  /* 初始棋盘：无三连且至少存在一步有效移动 */
  function freshBoard() {
    var b, guard = 0;
    do {
      b = generateBoard();
      guard++;
    } while (!hasValidMove(b) && guard < 60);
    return b;
  }

  /* 死局重洗：洗牌现有糖果，直到无现成三连且有有效移动 */
  function reshuffle() {
    var guard = 0;
    while (guard < 60) {
      for (var i = CELLS - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        swap(board, i, j);
      }
      if (!findMatches(board) && hasValidMove(board)) return;
      guard++;
    }
    board = freshBoard();   // 洗牌运气太差时直接重生成
  }

  /* ---------- 渲染 ---------- */

  function render() {
    for (var i = 0; i < CELLS; i++) {
      cells[i].textContent = board[i] === null ? '' : EMOJIS[board[i]];
      cells[i].classList.toggle('selected', i === selected);
    }
    scoreEl.textContent = score;
    movesEl.textContent = movesLeft;
  }

  /* ---------- 消除 / 下落 / 级联 ---------- */

  function applyGravity() {
    for (var c = 0; c < SIZE; c++) {
      var write = SIZE - 1;
      for (var r = SIZE - 1; r >= 0; r--) {
        var v = board[idx(r, c)];
        if (v !== null) {
          board[idx(write, c)] = v;
          if (write !== r) board[idx(r, c)] = null;
          write--;
        }
      }
      for (var r2 = write; r2 >= 0; r2--) {
        board[idx(r2, c)] = randType();   // 顶部随机补充
      }
    }
  }

  /* 级联消除：第 chain 连锁倍率 ×chain */
  function resolveBoard(chain, g) {
    if (g !== gen) return;   // 防止旧局定时器污染新局
    var mark = findMatches(board);
    if (!mark) {
      endCascade(g);
      return;
    }
    busy = true;
    var count = 0;
    for (var i = 0; i < CELLS; i++) {
      if (mark[i]) {
        count++;
        cells[i].classList.add('clearing');
      }
    }
    score += count * 10 * chain;
    scoreEl.textContent = score;
    Arcade.juice.clear();
    if (chain >= 2) {
      msgEl.textContent = T('gs.match3.chain').replace('{n}', chain);
      msgEl.style.color = '';
    }
    setTimeout(function () {
      if (g !== gen) return;
      for (var j = 0; j < CELLS; j++) {
        if (mark[j]) {
          board[j] = null;
          cells[j].classList.remove('clearing');
        }
      }
      applyGravity();
      render();
      setTimeout(function () { resolveBoard(chain + 1, g); }, 60);
    }, CLEAR_MS);
  }

  function endCascade(g) {
    if (g !== gen) return;
    busy = false;
    selected = -1;
    render();
    if (movesLeft <= 0) {
      gameOver();
      return;
    }
    if (!hasValidMove(board)) {
      busy = true;
      msgEl.textContent = T('gs.match3.deadlock');
      msgEl.style.color = '';
      setTimeout(function () {
        if (g !== gen) return;
        reshuffle();
        busy = false;
        msgEl.textContent = T('gs.match3.reshuffled');
        render();
      }, 500);
    }
  }

  function gameOver() {
    over = true;
    var isNew = Arcade.shell.submitScore(score);
    msgEl.textContent = (isNew ? T('gs.match3.winNew') : T('gs.match3.over')) + T('gs.match3.finalScore').replace('{n}', score);
    msgEl.style.color = isNew ? 'var(--neon-green)' : '';
  }

  /* ---------- 交互 ---------- */

  function onCellClick() {
    if (busy || over) return;
    var i = Number(this.getAttribute('data-i'));

    if (selected < 0) {                 // 第一次点击：选中
      selected = i;
      Arcade.juice.select();
      render();
      return;
    }
    if (i === selected) {               // 再点自己：取消选中
      selected = -1;
      render();
      return;
    }
    var ra = Math.floor(selected / SIZE), ca = selected % SIZE;
    var rb = Math.floor(i / SIZE), cb = i % SIZE;
    if (Math.abs(ra - rb) + Math.abs(ca - cb) !== 1) {   // 非相邻：改选
      selected = i;
      render();
      return;
    }

    var s = selected;
    selected = -1;
    swap(board, s, i);
    if (!findMatches(board)) {          // 无三连：换回并提示
      swap(board, s, i);
      msgEl.textContent = T('gs.match3.invalid');
      msgEl.style.color = '';
      render();
      return;
    }
    movesLeft--;
    msgEl.textContent = '';
    render();
    resolveBoard(1, gen);
  }

  /* 滑动交换：在起始格上滑动，方向决定交换目标（移动端手势） */
  var swipeStart = -1;
  function onCellTouchStart(e) {
    if (busy || over) return;
    var t = e.touches[0];
    swipeStart = { i: Number(this.getAttribute('data-i')), x: t.clientX, y: t.clientY };
  }
  function onCellTouchEnd(e) {
    // preventDefault 抑制 touchend 后的合成 click，避免「轻触→onCellClick 两次→选中又被取消」
    if (e.cancelable) e.preventDefault();
    if (busy || over || swipeStart === -1) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - swipeStart.x, dy = t.clientY - swipeStart.y;
    var si = swipeStart.i;
    swipeStart = -1;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) { onCellClick.call(this); return; } // 视为点击
    var tr, tc;
    if (Math.abs(dx) > Math.abs(dy)) { tr = 0; tc = dx > 0 ? 1 : -1; }
    else { tr = dy > 0 ? 1 : -1; tc = 0; }
    var r = Math.floor(si / SIZE) + tr, c = si % SIZE + tc;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    var target = r * SIZE + c;
    if (selected >= 0) selected = -1;
    var s = si;
    swap(board, s, target);
    if (!findMatches(board)) {
      swap(board, s, target);
      msgEl.textContent = T('gs.match3.invalid');
      msgEl.style.color = '';
      render();
      return;
    }
    movesLeft--;
    msgEl.textContent = '';
    render();
    resolveBoard(1, gen);
  }

  /* ---------- 初始化 ---------- */

  function buildCells() {
    boardEl.innerHTML = '';
    cells = [];
    for (var i = 0; i < CELLS; i++) {
      var d = document.createElement('div');
      d.className = 'm3-cell';
      d.setAttribute('data-i', i);
      d.addEventListener('click', onCellClick);
      d.addEventListener('touchstart', onCellTouchStart, { passive: true });
      d.addEventListener('touchend', onCellTouchEnd, { passive: false });
      boardEl.appendChild(d);
      cells.push(d);
    }
  }

  function init() {
    gen = (gen || 0) + 1;   // 局数标记，使旧局挂起的定时器失效
    board = freshBoard();
    score = 0;
    movesLeft = MAX_MOVES;
    selected = -1;
    busy = false;
    over = false;
    msgEl.textContent = DEFAULT_MSG;
    msgEl.style.color = '';
    render();
  }

  buildCells();
  restartBtn.addEventListener('click', init);
  init();  window.GAME_RESTART = init;

})();