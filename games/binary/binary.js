/* 二进制破译 Binary Decode —— Phase2 破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.binary.tut1t'), d: T('gs.binary.tut1') },
  { t: T('gs.binary.tut2t'), d: T('gs.binary.tut2') },
  { t: T('gs.binary.tut3t'), d: T('gs.binary.tut3') },
  { t: T('gs.binary.tut4t'), d: T('gs.binary.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var MESSAGES = {
    easy:   ['HI', 'SOS', 'BYE', 'CAT'],
    normal: ['HELLO', 'GAMEOVER', 'DECODE', 'RETREAT'],
    hard:   ['THE EAGLE', 'MEET AT DAWN', 'CODE IS BROKEN', 'ATTACK NOW X']
  };
  var difficulty = 'normal';

  function toBits(ch) { return ('00000000' + ch.charCodeAt(0).toString(2)).slice(-8); }

  var msg, bits, cells, won, started, startTs;

  function setup() {
    var pool = MESSAGES[difficulty];
    msg = pool[Math.floor(Math.random() * pool.length)];
    bits = [];
    for (var i = 0; i < msg.length; i++) bits.push(toBits(msg[i]));
    won = false; started = false; startTs = 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'bin-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="bin-diff">' +
    '  <button class="btn mode-btn" data-diff="easy">' + T('gs.binary.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-diff="normal">' + T('gs.binary.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-diff="hard">' + T('gs.binary.dHard') + '</button>' +
    '</div>' +
    '<div class="bin-label">' + T('gs.binary.lblCipher') + '</div>' +
    '<div class="bin-row" id="bin-row"></div>' +
    '<div class="bin-top"><span>' + T('gs.binary.typeHint') + '</span><span id="bin-time">00:00</span></div>' +
    '<div class="bin-msg" id="bin-msg"></div>' +
    '<div class="game-controls"><button id="bin-reset" class="btn purple">' + T('gs.binary.newPuzzle') + '</button></div>';
  
  /* helpText 知识延伸 */
  var helpDiv = document.createElement('div');
  helpDiv.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  helpDiv.innerHTML = T('gs.binary.helpText');
  wrap.appendChild(helpDiv);
root.appendChild(wrap);
  var diffRow = wrap.querySelector('#bin-diff');
  var rowEl = wrap.querySelector('#bin-row'), msgEl = wrap.querySelector('#bin-msg'),
      timeEl = wrap.querySelector('#bin-time'), resetBtn = wrap.querySelector('#bin-reset');

  function render() {
    rowEl.innerHTML = '';
    cells = [];
    for (var i = 0; i < bits.length; i++) {
      var cell = document.createElement('div'); cell.className = 'bin-cell';
      var isSpace = msg[i] === ' ';
      cell.innerHTML = '<div class="bin-bits">' + bits[i] + '</div>' +
        '<input class="bin-letter' + (isSpace ? ' space' : '') + '" maxlength="1" data-i="' + i + '" autocomplete="off" spellcheck="false">';
      rowEl.appendChild(cell);
      var inp = cell.querySelector('input');
      if (isSpace) {
        // 空格位自动填入并锁定（修复：此前需手输字面空格，空着永不判胜成软锁）
        inp.value = ' ';
        inp.readOnly = true;
        inp.classList.add('ok');
      }
      inp.addEventListener('input', onInput);
      cells.push(inp);
    }
    msgEl.textContent = '';
    cells[0].focus();
  }

  function tick() {
    if (won || !started) return;
    var s = Math.round((Date.now() - startTs) / 1000);
    timeEl.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    setTimeout(tick, 500);
  }

  function onInput(e) {
    var i = parseInt(this.getAttribute('data-i'), 10);
    var v = (this.value || '').toUpperCase();
    this.value = v;
    var correct = v === msg[i];
    this.classList.toggle('ok', correct && v.length === 1);
    if (!started) { started = true; startTs = Date.now(); tick(); }
    if (Arcade.juice && correct && v.length === 1) Arcade.juice.select();
    check();
  }

  function check() {
    if (won) return;
    for (var i = 0; i < msg.length; i++) if ((cells[i].value || '').toUpperCase() !== msg[i]) return;
    won = true;
    var sec = Math.round((Date.now() - startTs) / 1000);
    timeEl.textContent = ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2);
    msgEl.textContent = T('gs.binary.msgWin').replace('{msg}', msg);
    msgEl.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(sec);
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-diff');
      setup(); render();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  resetBtn.addEventListener('click', function () { setup(); render(); if (Arcade.audio) Arcade.audio.play('ui'); });

  setup(); render();
    window.GAME_RESTART = function () { location.reload(); };

})();
