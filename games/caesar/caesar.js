/* 凯撒密码解码 Caesar —— P2 密码破译 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.caesar.tut1t'), d: T('gs.caesar.tut1') },
  { t: T('gs.caesar.tut2t'), d: T('gs.caesar.tut2') },
  { t: T('gs.caesar.tut3t'), d: T('gs.caesar.tut3') },
  { t: T('gs.caesar.tut4t'), d: T('gs.caesar.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var PLAIN = ['OPEN THE VAULT', 'DECODE THE SIGNAL', 'BREAK THE CODE', 'SECRET MESSAGE',
    'FIND THE KEY', 'HIDDEN TREASURE', 'ENTER THE BASE', 'LAUNCH SEQUENCE', 'ACCESS GRANTED'];
  var dailyMode = false;

  /* 每日一题：按日期生成固定种子（同一日全球同一题） */
  function daySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function pick(arr, seed) {
    var x = seed || 0;
    var s = Math.abs(Math.floor(x));
    return arr[s % arr.length];
  }

  var plain = PLAIN[Math.floor(Math.random() * PLAIN.length)];
  var shift = 1 + Math.floor(Math.random() * 25);
  var cipher = enc(plain, shift);
  var tries = 0, solved = false;

  function enc(s, k) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 65 && c <= 90) o += String.fromCharCode((c - 65 + k) % 26 + 65);
      else o += s[i];
    }
    return o;
  }
  function dec(s, k) { return enc(s, (26 - k) % 26); }

  var wrap = document.createElement('div');
  wrap.className = 'ca-wrap';
  wrap.innerHTML =
    '<div class="ca-label">' + T('gs.caesar.lblCipher') + '</div>' +
    '<div class="ca-cipher">' + cipher + '</div>' +
    '<div class="ca-label">' + T('gs.caesar.lblPreview') + '</div>' +
    '<div class="ca-preview" id="ca-pre"></div>' +
    '<div class="ca-offset"><span>' + T('gs.caesar.offset') + '</span><input type="range" id="ca-range" min="0" max="25" value="0"><span class="val" id="ca-val">0</span></div>' +
    '<div class="ca-tries" id="ca-tries">' + T('gs.caesar.tries').replace('{n}', 0) + '</div>' +
    '<div class="ca-msg" id="ca-msg"></div>' +
    '<button class="btn accent" id="ca-check">' + T('gs.caesar.check') + '</button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="ca-daily">📅 ' + T('gs.caesar.dailyBtn') + '</button></div>';
  root.appendChild(wrap);

  var range = wrap.querySelector('#ca-range');
  var pre = wrap.querySelector('#ca-pre');
  var val = wrap.querySelector('#ca-val');
  var msg = wrap.querySelector('#ca-msg');
  var triesEl = wrap.querySelector('#ca-tries');

  function update() {
    var k = parseInt(range.value, 10);
    val.textContent = k;
    pre.textContent = dec(cipher, k);
  }
  range.addEventListener('input', update);
  update();

  wrap.querySelector('#ca-check').addEventListener('click', function () {
    if (solved) return;
    tries++;
    triesEl.textContent = T('gs.caesar.tries').replace('{n}', tries);
    if (parseInt(range.value, 10) === shift) {
      solved = true;
      msg.textContent = T('gs.caesar.msgWin').replace('{shift}', shift);
      msg.style.color = 'var(--neon-green)';
      pre.style.borderColor = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win(null, null);
      if (Arcade.shell) Arcade.shell.submitScore(tries);
      if (dailyMode && Arcade.daily) Arcade.daily.markSolved('caesar', tries);
    } else {
      msg.textContent = T('gs.caesar.msgFail');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  var dailyBtn = wrap.querySelector('#ca-daily');
  if (dailyBtn) {
    dailyBtn.addEventListener('click', function () {
      dailyMode = true;
      plain = pick(PLAIN, daySeed());
      shift = 1 + (daySeed() % 25);
      cipher = enc(plain, shift);
      tries = 0; solved = false;
      wrap.querySelector('.ca-cipher').textContent = cipher;
      range.value = 0; update();
      msg.textContent = T('gs.caesar.dailyTag');
      msg.style.color = 'var(--neon-yellow)';
      pre.style.borderColor = '';
      triesEl.textContent = T('gs.caesar.tries').replace('{n}', 0);
    });
  }

  window.GAME_RESTART = function () {
    if (dailyMode) {
      plain = pick(PLAIN, daySeed());
      shift = 1 + (daySeed() % 25);
    } else {
      plain = PLAIN[Math.floor(Math.random() * PLAIN.length)];
      shift = 1 + Math.floor(Math.random() * 25);
    }
    cipher = enc(plain, shift);
    tries = 0; solved = false;
    wrap.querySelector('.ca-cipher').textContent = cipher;
    range.value = 0; update();
    msg.textContent = ''; msg.style.color = '';
    pre.style.borderColor = '';
    triesEl.textContent = T('gs.caesar.tries').replace('{n}', 0);
  };

})();
