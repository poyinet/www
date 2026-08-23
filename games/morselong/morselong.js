/* 摩斯长报文 Morse Long Message —— Phase2 破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.morselong.tut1t'), d: T('gs.morselong.tut1') },
  { t: T('gs.morselong.tut2t'), d: T('gs.morselong.tut2') },
  { t: T('gs.morselong.tut3t'), d: T('gs.morselong.tut3').replace('·', '·') },
  { t: T('gs.morselong.tut4t'), d: T('gs.morselong.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var MORSE = { A:'·-',B:'-···',C:'-·-·',D:'-··',E:'·',F:'··-·',G:'--·',H:'····',I:'··',J:'·---',K:'-·-',L:'·-··',M:'--',N:'-·',O:'---',P:'·--·',Q:'--·-',R:'·-·',S:'···',T:'-',U:'··-',V:'···-',W:'·--',X:'-··-',Y:'-·--',Z:'--··' };
  var PLAINS = {
    easy:   ['SOS', 'HELLO WORLD', 'GAME OVER'],
    normal: ['MEET ME AT DAWN', 'THE SIGNAL IS CLEAR', 'RETURN TO BASE NOW'],
    hard:   ['THE EAGLE HAS LANDED SAFELY', 'DECODE THIS LONG MESSAGE NOW', 'ATTACK AT FIRST LIGHT TOMORROW']
  };
  var difficulty = 'normal';

  function toMorse(s) {
    return s.split(' ').map(function (w) {
      return w.split('').map(function (ch) { return MORSE[ch]; }).join(' ');
    }).join(' / ');
  }

  var plain, cipher, won, started, startTs;

  function setup() {
    var pool = PLAINS[difficulty];
    plain = pool[Math.floor(Math.random() * pool.length)];
    cipher = toMorse(plain);
    won = false; started = false; startTs = 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ml-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="ml-diff">' +
    '  <button class="btn mode-btn" data-diff="easy">' + T('gs.morselong.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-diff="normal">' + T('gs.morselong.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-diff="hard">' + T('gs.morselong.dHard') + '</button>' +
    '</div>' +
    '<div class="ml-label">' + T('gs.morselong.lblCipher') + '</div>' +
    '<div class="ml-cipher" id="ml-cipher"></div>' +
    '<button class="btn yellow" id="ml-play">' + T('gs.morselong.play') + '</button>' +
    '<div class="ml-top"><span>' + T('gs.morselong.typeHint') + '</span><span id="ml-time">00:00</span></div>' +
    '<input class="ml-input" id="ml-input" placeholder="' + T('gs.morselong.phInput') + '" autocomplete="off" spellcheck="false">' +
    '<div class="ml-msg" id="ml-msg"></div>' +
    '<div class="game-controls"><button id="ml-reset" class="btn purple">' + T('gs.morselong.newPuzzle') + '</button></div>';
  root.appendChild(wrap);
  var diffRow = wrap.querySelector('#ml-diff');
  var cipherEl = wrap.querySelector('#ml-cipher'), inputEl = wrap.querySelector('#ml-input'),
      msg = wrap.querySelector('#ml-msg'), timeEl = wrap.querySelector('#ml-time'),
      playBtn = wrap.querySelector('#ml-play'), resetBtn = wrap.querySelector('#ml-reset');

  function norm(s) { return s.toUpperCase().replace(/[^A-Z]/g, ''); }

  function render() { cipherEl.textContent = cipher; inputEl.value = ''; msg.textContent = ''; }

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
      msg.textContent = T('gs.morselong.msgWin').replace('{plain}', plain);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(sec);
    }
  }

  function playBeep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ac = new AC();
      var t = ac.currentTime, unit = 0.09;
      cipher.split('').forEach(function (sym) {
        if (sym === '·') { beep(ac, t, unit); t += unit * 2; }
        else if (sym === '-') { beep(ac, t, unit * 3); t += unit * 4; }
        else if (sym === ' ') { t += unit * 2; }
        else if (sym === '/') { t += unit * 4; }
      });
      setTimeout(function () { ac.close(); }, (t - ac.currentTime) * 1000 + 200);
    } catch (e) { if (Arcade.ui) Arcade.ui.toast(T('gs.morselong.noAudio'), 'warn'); }
  }
  function beep(ac, start, dur) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 620;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }

  inputEl.addEventListener('input', function () {
    var v = norm(inputEl.value), t = norm(plain);
    if (v.length && t.indexOf(v) === 0) { if (Arcade.juice) Arcade.juice.select(); }
    check();
  });
  playBtn.addEventListener('click', playBeep);

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
