/* 摩斯听写 Morse Tap —— 批次A 密码破译招牌（听力训练） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.morsetap.tut1t'), d: T('gs.morsetap.tut1') },
  { t: T('gs.morsetap.tut2t'), d: T('gs.morsetap.tut2') },
  { t: T('gs.morsetap.tut3t'), d: T('gs.morsetap.tut3') },
  { t: T('gs.morsetap.tut4t'), d: T('gs.morsetap.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
  var WORDS = ['CODE', 'NEON', 'LASER', 'ROBOT', 'GAME', 'VAULT', 'CIPHER', 'SIGNAL', 'MORSE', 'WORD',
    'KEY', 'BASE', 'HACK', 'ECHO', 'RADAR', 'FLAME', 'GHOST', 'STONE', 'BRICK', 'PIXEL'];
  var TOTAL = 5;
  var idx = 0, correct = 0, answer = '', solved = false;

  function wordToMorse(w) {
    var m = '';
    for (var i = 0; i < w.length; i++) m += (MORSE[w[i]] || '') + ' ';
    return m.trim();
  }

  var wrap = document.createElement('div');
  wrap.className = 'mt-wrap';
  wrap.innerHTML =
    '<div class="mt-prog" id="mt-prog"></div>' +
    '<div class="mt-word" id="mt-word">' + T('gs.morsetap.startHint') + '</div>' +
    '<input class="mt-input" id="mt-in" autocomplete="off" spellcheck="false" placeholder="' + T('gs.morsetap.inputPh') + '">' +
    '<div class="game-controls">' +
    '  <button class="btn yellow" id="mt-play">' + T('gs.morsetap.playBtn') + '</button>' +
    '  <button class="btn accent" id="mt-sub">' + T('gs.morsetap.submitBtn') + '</button>' +
    '</div>' +
    '<div class="mt-msg" id="mt-msg"></div>' +
    '<div class="mt-help">' + T('gs.morsetap.helpText') + '</div>';
  root.appendChild(wrap);
  var progEl = wrap.querySelector('#mt-prog'), wordEl = wrap.querySelector('#mt-word'),
      input = wrap.querySelector('#mt-in'), msg = wrap.querySelector('#mt-msg'),
      playBtn = wrap.querySelector('#mt-play'), subBtn = wrap.querySelector('#mt-sub');

  var _ac = null; // 复用单例 AudioContext（避免每次播放新建导致的上下文堆积）
  function getAC() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!_ac) _ac = new AC();
    if (_ac.state === 'suspended') { try { _ac.resume(); } catch (e) {} }
    return _ac;
  }

  function beep(ac, start, dur) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 640;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.32, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function playCode() {
    // 尊重全局音效开关（修复：此前绕过 Arcade.audio 静音，关闭音效后摩斯音照常播放）
    var snd = (Arcade.settings && Arcade.settings.get()) ? Arcade.settings.get().sound : true;
    if (!snd) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.morsetap.soundOff'), 'warn');
      return;
    }
    try {
      var ac = getAC();
      if (!ac) { if (Arcade.ui) Arcade.ui.toast(T('gs.morsetap.noAudio'), 'warn'); return; }
      var t = ac.currentTime, unit = 0.1;
      wordToMorse(answer).split('').forEach(function (sym) {
        if (sym === '.') { beep(ac, t, unit); t += unit * 2; }
        else if (sym === '-') { beep(ac, t, unit * 3); t += unit * 4; }
        else if (sym === ' ') { t += unit * 2; }
      });
    } catch (e) { if (Arcade.ui) Arcade.ui.toast(T('gs.morsetap.noAudio'), 'warn'); }
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    solved = false;
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    wordEl.textContent = T('gs.morsetap.listening');
    wordEl.dataset.answer = '';
    input.value = ''; input.maxLength = answer.length;
    progEl.textContent = T('gs.morsetap.progress').replace('{i}', idx + 1).replace('{t}', TOTAL).replace('{n}', correct);
    msg.textContent = '';
  }

  function submit() {
    if (idx >= TOTAL) return;
    if (solved) return;
    var got = input.value.trim().toUpperCase();
    if (got === answer) {
      solved = true;
      correct++; idx++;
      wordEl.textContent = T('gs.morsetap.correct').replace('{w}', answer).replace('{m}', wordToMorse(answer));
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
      setTimeout(next, 900);
    } else {
      msg.textContent = T('gs.morsetap.wrong').replace('{n}', answer.length);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  function finish() {
    wordEl.textContent = T('gs.morsetap.finishTitle');
    input.style.display = 'none'; subBtn.style.display = 'none';
    progEl.textContent = T('gs.morsetap.finishProg').replace('{n}', correct).replace('{t}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.morsetap.finishPerfect') : T('gs.morsetap.finishDone');
    msg.style.color = 'var(--neon-yellow)';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  playBtn.addEventListener('click', playCode);
  subBtn.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

  next();
  window.GAME_RESTART = function () {
    idx = 0; correct = 0;
    input.style.display = ''; subBtn.style.display = '';
    next();
  };

})();
