/* ============================================================
   猜数字：难度递进（范围 + 限次），二分法提示，计猜测次数（低分优）
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.guess.tut1t'), d: T('gs.guess.tut1') },
    { t: T('gs.guess.tut2t'), d: T('gs.guess.tut2') },
    { t: T('gs.guess.tut3t'), d: T('gs.guess.tut3') },
    { t: T('gs.guess.tut4t'), d: T('gs.guess.tut4') }
  ];

  var DIFFS = {
    easy:   { max: 50,  limit: 8 },
    normal: { max: 100, limit: 7 },
    hard:   { max: 500, limit: 10 }
  };
  var difficulty = 'normal';

  var target, attempts, history, gameOver, lo, hi, limit;

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.guess.msgStart') + '</div>' +
    '<div class="mode-row" id="diff-row">' +
    '  <button class="btn mode-btn" data-diff="easy">' + T('gs.guess.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-diff="normal">' + T('gs.guess.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-diff="hard">' + T('gs.guess.dHard') + '</button>' +
    '</div>' +
    '<div class="guess-panel card">' +
    '  <div class="guess-range" id="range">' + T('gs.guess.range').replace('{lo}', 1).replace('{hi}', 100) + '</div>' +
    '  <div class="guess-input-row">' +
    '    <input id="guess-input" class="guess-input" type="number" min="1" max="100" placeholder="?" inputmode="numeric">' +
    '    <button id="guess-btn" class="btn">' + T('gs.guess.guessBtn') + '</button>' +
    '  </div>' +
    '  <div class="guess-history" id="history"></div>' +
    '</div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.guess.attempts') + ' <span class="stat-value" id="attempts">0</span> / <span id="limit">7</span></span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="restart-btn" class="btn purple">' + T('gs.guess.restart') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.guess.help') + '</p>';

  var msgEl = document.getElementById('msg');
  var rangeEl = document.getElementById('range');
  var inputEl = document.getElementById('guess-input');
  var btnEl = document.getElementById('guess-btn');
  var historyEl = document.getElementById('history');
  var attemptsEl = document.getElementById('attempts');
  var limitEl = document.getElementById('limit');
  var restartBtn = document.getElementById('restart-btn');
  var diffRow = document.getElementById('diff-row');

  function init() {
    var D = DIFFS[difficulty];
    limit = D.limit;
    target = 1 + Math.floor(Math.random() * D.max);
    attempts = 0;
    history = [];
    gameOver = false;
    lo = 1; hi = D.max;
    msgEl.textContent = T('gs.guess.msgReady').replace('{n}', D.max);
    msgEl.style.color = '';
    rangeEl.textContent = T('gs.guess.range').replace('{lo}', 1).replace('{hi}', D.max);
    limitEl.textContent = limit;
    historyEl.innerHTML = '';
    attemptsEl.textContent = '0';
    inputEl.max = D.max;
    inputEl.value = '';
    inputEl.disabled = false;
    btnEl.disabled = false;
    // 仅桌面自动聚焦（修复：移动端进页面即弹软键盘）
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    if (!isTouch) inputEl.focus();
  }

  function addChip(n, cls, label) {
    var chip = document.createElement('span');
    chip.className = 'guess-chip ' + cls;
    chip.textContent = n + (label ? ' ' + label : '');
    historyEl.appendChild(chip);
  }

  function guess() {
    if (gameOver) return;
    var max = DIFFS[difficulty].max;
    var n = Number(inputEl.value);
    if (!Number.isInteger(n) || n < 1 || n > max) {
      msgEl.textContent = T('gs.guess.msgInvalid').replace('{n}', max);
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    attempts++;
    attemptsEl.textContent = attempts;
    Arcade.juice.move();
    inputEl.value = '';
    var isTouch2 = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    if (!isTouch2) inputEl.focus();

    if (n === target) {
      gameOver = true;
      addChip(n, 'hit', '🎉');
      msgEl.textContent = T('gs.guess.msgWin').replace('{n}', attempts);
      msgEl.style.color = 'var(--neon-green)';
      inputEl.disabled = true;
      btnEl.disabled = true;
      Arcade.shell.submitScore(attempts);
    } else if (n < target) {
      lo = Math.max(lo, n + 1);
      addChip(n, 'low', '↑');
      msgEl.textContent = T('gs.guess.msgLow');
    } else {
      hi = Math.min(hi, n - 1);
      addChip(n, 'high', '↓');
      msgEl.textContent = T('gs.guess.msgHigh');
    }
    rangeEl.textContent = T('gs.guess.range').replace('{lo}', lo).replace('{hi}', hi);

    if (!gameOver && attempts >= limit) {
      gameOver = true;
      msgEl.textContent = T('gs.guess.msgOut').replace('{n}', target);
      msgEl.style.color = 'var(--neon-pink)';
      inputEl.disabled = true;
      btnEl.disabled = true;
      if (Arcade.juice) Arcade.juice.lose();
    }
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-diff');
      init();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  btnEl.addEventListener('click', guess);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') guess();
  });
  restartBtn.addEventListener('click', init);

  init();  window.GAME_RESTART = init;

})();