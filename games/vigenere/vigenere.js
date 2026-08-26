/* 维吉尼亚密码 Vigenère —— Phase2 破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.vigenere.tut1t'), d: T('gs.vigenere.tut1') },
  { t: T('gs.vigenere.tut2t'), d: T('gs.vigenere.tut2') },
  { t: T('gs.vigenere.tut3t'), d: T('gs.vigenere.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var PLAINS = {
    easy:   ['ATTACK', 'SECRET', 'MEET ME', 'GO NOW'],
    normal: ['THE EAGLE FLIES', 'DECODE THE SIGNAL', 'RETREAT AT NIGHT'],
    hard:   ['MEET ME AT THE OLD BRIDGE', 'THE QUICK BROWN FOX JUMPS', 'BREAK THE ENEMY CODE NOW']
  };
  var KEYS = ['LEMON', 'CRYPTO', 'KEY', 'BLAZE', 'ORANGE', 'NIGHT'];
  var difficulty = 'normal';

  function encrypt(p, k) {
    var out = '', ki = 0;
    for (var i = 0; i < p.length; i++) {
      var ch = p[i];
      if (ch === ' ') { out += ' '; continue; }
      var shift = k.charCodeAt(ki % k.length) - 65;
      out += String.fromCharCode((ch.charCodeAt(0) - 65 + shift) % 26 + 65);
      ki++;
    }
    return out;
  }

  var plain, key, cipher, won, started, startTs, timer;

  function setup() {
    var pool = PLAINS[difficulty];
    plain = pool[Math.floor(Math.random() * pool.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    cipher = encrypt(plain, key);
    won = false; started = false; startTs = 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'vg-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="vg-diff">' +
    '  <button class="btn mode-btn" data-diff="easy">' + T('gs.vigenere.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-diff="normal">' + T('gs.vigenere.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-diff="hard">' + T('gs.vigenere.dHard') + '</button>' +
    '</div>' +
    '<div class="vg-label">' + T('gs.vigenere.lblCipher') + '</div>' +
    '<div class="vg-cipher" id="vg-cipher"></div>' +
    '<div class="vg-key" id="vg-key"></div>' +
    '<div class="vg-top"><span>' + T('gs.vigenere.keyHint') + '</span><span id="vg-time">00:00</span></div>' +
    '<input class="vg-input" id="vg-input" placeholder="' + T('gs.vigenere.phInput') + '" autocomplete="off" spellcheck="false">' +
    '<div class="vg-msg" id="vg-msg"></div>' +
    '<div class="game-controls"><button id="vg-reset" class="btn purple">' + T('gs.vigenere.newPuzzle') + '</button></div>';
  
  /* helpText 知识延伸 */
  var helpDiv = document.createElement('div');
  helpDiv.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  helpDiv.innerHTML = T('gs.vigenere.helpText');
  wrap.appendChild(helpDiv);
root.appendChild(wrap);
  var diffRow = wrap.querySelector('#vg-diff');
  var cipherEl = wrap.querySelector('#vg-cipher'), keyEl = wrap.querySelector('#vg-key'),
      inputEl = wrap.querySelector('#vg-input'), msg = wrap.querySelector('#vg-msg'),
      timeEl = wrap.querySelector('#vg-time'), resetBtn = wrap.querySelector('#vg-reset');

  function norm(s) { return s.toUpperCase().replace(/[^A-Z]/g, ''); }

  function render() {
    cipherEl.textContent = cipher;
    keyEl.textContent = T('gs.vigenere.key').replace('{key}', key);
    inputEl.value = '';
    msg.textContent = '';
    timeEl.textContent = '00:00';
  }

  function tick() {
    if (won || !started) return;
    var s = Math.round((Date.now() - startTs) / 1000);
    timeEl.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    setTimeout(tick, 500);
  }

  function check() {
    if (won) return;
    if (!started) { started = true; startTs = Date.now(); tick(); }
    if (norm(inputEl.value) === norm(plain)) {
      won = true;
      var sec = Math.round((Date.now() - startTs) / 1000);
      timeEl.textContent = ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2);
      msg.textContent = T('gs.vigenere.msgWin').replace('{plain}', plain);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.audio) Arcade.audio.play('win');
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(sec);
    }
  }

  inputEl.addEventListener('input', function () {
    var v = norm(inputEl.value), t = norm(plain);
    if (v.length && t.indexOf(v) === 0) { if (Arcade.juice) Arcade.juice.select(); }
    else if (v.length) { if (Arcade.audio) Arcade.audio.play('error'); }
    check();
  });

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

  window.GAME_RESTART = function () { setup(); render(); }; // setup 后必须 render，否则界面仍显示旧题

})();