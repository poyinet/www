/* ============================================================
   记忆翻牌：4x4 配对 8 对 emoji，计步 + 计时（步数低分优）
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.memory.tut1t'), d: T('gs.memory.tut1') },
    { t: T('gs.memory.tut2t'), d: T('gs.memory.tut2') },
    { t: T('gs.memory.tut3t'), d: T('gs.memory.tut3') }
  ];

  var EMOJIS = ['🍎', '🚀', '🎮', '🌟', '🎲', '🍕', '🐱', '⚡', '🌈', '🔥'];
  var DIFFS = {
    easy:   { name: T('gs.memory.dEasy'), cols: 4, rows: 3, pairs: 6 },
    normal: { name: T('gs.memory.dNormal'), cols: 4, rows: 4, pairs: 8 },
    hard:   { name: T('gs.memory.dHard'), cols: 5, rows: 4, pairs: 10 }
  };
  var difficulty = 'normal';
  var PAIRS = DIFFS[difficulty].pairs;
  var FLIP_BACK_MS = 800;         // 不匹配翻回延迟

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.memory.msgStart') + '</div>' +
    '<div class="mem-diffs" id="diff-row">' +
    '  <button class="mode-btn" data-diff="easy">' + T('gs.memory.dEasy') + '</button>' +
    '  <button class="mode-btn selected" data-diff="normal">' + T('gs.memory.dNormal') + '</button>' +
    '  <button class="mode-btn" data-diff="hard">' + T('gs.memory.dHard') + '</button>' +
    '</div>' +
    '<div class="grid-board mem-board" id="board"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.memory.moves') + ' <span class="stat-value" id="moves">0</span></span>' +
    '  <span>' + T('gs.memory.time') + ' <span class="stat-value" id="time">0</span> ' + T('gs.memory.sec') + '</span>' +
    '  <span>' + T('gs.memory.pairs') + ' <span class="stat-value" id="pairs">0</span>/<span class="stat-value" id="pairs-total">' + PAIRS + '</span></span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="restart-btn" class="btn purple">' + T('gs.memory.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.memory.help') + '</p>';

  var boardEl = document.getElementById('board');
  var msgEl = document.getElementById('msg');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var pairsEl = document.getElementById('pairs');
  var restartBtn = document.getElementById('restart-btn');
  var diffRow = document.getElementById('diff-row');

  var firstCard, lock, moves, matched, seconds, timer, started;

  /* Fisher-Yates 洗牌 */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function startTimer() {
    started = true;
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = seconds;
    }, 1000);
  }

  function init() {
    clearInterval(timer);
    firstCard = null;
    lock = false;
    moves = 0;
    matched = 0;
    seconds = 0;
    started = false;
    movesEl.textContent = '0';
    timeEl.textContent = '0';
    pairsEl.textContent = '0';
    var pt = document.getElementById('pairs-total'); if (pt) pt.textContent = PAIRS;
    msgEl.textContent = T('gs.memory.msgStart');
    msgEl.style.color = '';
    var D = DIFFS[difficulty];
    PAIRS = D.pairs;
    boardEl.style.gridTemplateColumns = 'repeat(' + D.cols + ', 1fr)';

    var used = EMOJIS.slice(0, D.pairs);
    var deck = shuffle(used.concat(used));
    boardEl.innerHTML = '';
    deck.forEach(function (emoji) {
      var card = document.createElement('button');
      card.className = 'mem-card';
      card.setAttribute('data-emoji', emoji);
      card.innerHTML =
        '<span class="mem-card-inner">' +
        '<span class="mem-face mem-front">?</span>' +
        '<span class="mem-face mem-back">' + emoji + '</span>' +
        '</span>';
      card.addEventListener('click', onCardClick);
      boardEl.appendChild(card);
    });
  }

  function onCardClick() {
    if (lock) return;
    var card = this;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (!started) startTimer();

    card.classList.add('flipped');
    Arcade.juice.flip();

    if (!firstCard) {
      firstCard = card;
      return;
    }

    moves++;
    movesEl.textContent = moves;
    var a = firstCard;
    var b = card;
    firstCard = null;

    if (a.getAttribute('data-emoji') === b.getAttribute('data-emoji')) {
      a.classList.add('matched');
      b.classList.add('matched');
      matched++;
      Arcade.juice.merge();
      pairsEl.textContent = matched;
      if (matched === PAIRS) win();
    } else {
      lock = true;
      setTimeout(function () {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        lock = false;
      }, FLIP_BACK_MS);
    }
  }

  function win() {
    clearInterval(timer);
    var isNew = Arcade.shell.submitScore(moves);
    msgEl.textContent = (isNew ? T('gs.memory.winNew') : T('gs.memory.winAll')) +
      T('gs.memory.winDetail').replace('{m}', moves).replace('{s}', seconds);
    msgEl.style.color = 'var(--neon-green)';
  }

  diffRow.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    difficulty = b.getAttribute('data-diff');
    var btns = diffRow.getElementsByTagName('button');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-diff') === difficulty) btns[i].classList.add('selected');
      else btns[i].classList.remove('selected');
    }
    init();
  });
  restartBtn.addEventListener('click', init);

  init();  window.GAME_RESTART = init;

})();