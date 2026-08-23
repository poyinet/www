/* ============================================================
   数字华容道：滑块排成顺序，计步 + 计时（步数低分优）
   难度递进：3×3 / 4×4 / 5×5（打乱步数随尺寸放大，保证有解）
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.puzzle15.tut1t'), d: T('gs.puzzle15.tut1') },
    { t: T('gs.puzzle15.tut2t'), d: T('gs.puzzle15.tut2') },
    { t: T('gs.puzzle15.tut3t'), d: T('gs.puzzle15.tut3') },
    { t: T('gs.puzzle15.tut4t'), d: T('gs.puzzle15.tut4') }
  ];

  var SIZE = 4;
  var CELLS, SHUFFLE_STEPS;

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.puzzle15.msgStart') + '</div>' +
    '<div class="mode-row" id="size-row">' +
    '  <button class="btn mode-btn" data-size="3">' + T('gs.puzzle15.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-size="4">' + T('gs.puzzle15.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-size="5">' + T('gs.puzzle15.dHard') + '</button>' +
    '</div>' +
    '<div class="grid-board p15-board" id="board"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.puzzle15.moves') + ' <span class="stat-value" id="moves">0</span></span>' +
    '  <span>' + T('gs.puzzle15.time') + ' <span class="stat-value" id="time">0</span> ' + T('gs.puzzle15.sec') + '</span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="shuffle-btn" class="btn purple">' + T('gs.puzzle15.shuffle') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.puzzle15.help') + '</p>';

  var boardEl = document.getElementById('board');
  var msgEl = document.getElementById('msg');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var shuffleBtn = document.getElementById('shuffle-btn');
  var sizeRow = document.getElementById('size-row');

  var board = [];
  var cells = [];
  var moves, seconds, timer, started, won;

  function isSolved() {
    for (var i = 0; i < CELLS - 1; i++) {
      if (board[i] !== i + 1) return false;
    }
    return board[CELLS - 1] === 0;
  }

  function emptyNeighbors() {
    var e = board.indexOf(0);
    var r = Math.floor(e / SIZE);
    var c = e % SIZE;
    var list = [];
    if (r > 0) list.push(e - SIZE);
    if (r < SIZE - 1) list.push(e + SIZE);
    if (c > 0) list.push(e - 1);
    if (c < SIZE - 1) list.push(e + 1);
    return list;
  }

  function moveTile(pos) {
    var e = board.indexOf(0);
    board[e] = board[pos];
    board[pos] = 0;
  }

  function shuffleBoard() {
    do {
      board = [];
      for (var i = 0; i < CELLS - 1; i++) board.push(i + 1);
      board.push(0);
      for (var k = 0; k < SHUFFLE_STEPS; k++) {
        var ns = emptyNeighbors();
        moveTile(ns[Math.floor(Math.random() * ns.length)]);
      }
    } while (isSolved());
  }

  function buildCells() {
    boardEl.style.gridTemplateColumns = 'repeat(' + SIZE + ', 1fr)';
    boardEl.innerHTML = '';
    cells = [];
    for (var i = 0; i < CELLS; i++) {
      var d = document.createElement('button');
      d.className = 'p15-tile';
      d.setAttribute('data-pos', i);
      d.addEventListener('click', onTileClick);
      boardEl.appendChild(d);
      cells.push(d);
    }
  }

  function render() {
    var movable = emptyNeighbors();
    for (var i = 0; i < CELLS; i++) {
      var d = cells[i];
      var v = board[i];
      if (v === 0) {
        d.textContent = '';
        d.className = 'p15-tile empty';
      } else {
        d.textContent = v;
        d.className = 'p15-tile' + (!won && movable.indexOf(i) >= 0 ? ' movable' : '');
      }
    }
  }

  function startTimer() {
    started = true;
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = seconds;
    }, 1000);
  }

  function onTileClick() {
    if (won) return;
    var pos = Number(this.getAttribute('data-pos'));
    if (emptyNeighbors().indexOf(pos) < 0) return;
    if (!started) startTimer();
    moveTile(pos);
    Arcade.juice.move();
    moves++;
    movesEl.textContent = moves;
    if (isSolved()) {
      won = true;
      clearInterval(timer);
      var isNew = Arcade.shell.submitScore(moves);
      msgEl.textContent = (isNew ? T('gs.puzzle15.winNew') : T('gs.puzzle15.winDone')) +
        T('gs.puzzle15.winDetail').replace('{m}', moves).replace('{s}', seconds);
      msgEl.style.color = 'var(--neon-green)';
    }
    render();
  }

  function init() {
    CELLS = SIZE * SIZE;
    SHUFFLE_STEPS = CELLS * 12;
    clearInterval(timer);
    moves = 0;
    seconds = 0;
    started = false;
    won = false;
    movesEl.textContent = '0';
    timeEl.textContent = '0';
    msgEl.textContent = T('gs.puzzle15.msgStart');
    msgEl.style.color = '';
    buildCells();
    shuffleBoard();
    render();
  }

  sizeRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      sizeRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      SIZE = parseInt(b.getAttribute('data-size'), 10);
      init();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  shuffleBtn.addEventListener('click', init);
  window.GAME_RESTART = init;
  init();
})();
