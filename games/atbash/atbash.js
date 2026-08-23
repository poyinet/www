/* 阿特巴什 Atbash —— C4 新游戏：字母表镜像替换
   A↔Z, B↔Y, C↔X … 最古老的替换密码之一（希伯来文传统，罗马时代用于拉丁文）。
   5 题一轮：显示镜像密文，输入明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.atbash.tut1t'), d: T('gs.atbash.tut1') },
  { t: T('gs.atbash.tut2t'), d: T('gs.atbash.tut2') },
  { t: T('gs.atbash.tut3t'), d: T('gs.atbash.tut3') },
  { t: T('gs.atbash.tut4t'), d: T('gs.atbash.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'MIRROR', 'ALPHABET', 'SECRET', 'CODE', 'KEY', 'REVERSE', 'VAULT', 'SIGNAL'];
  var TOTAL = 5, idx = 0, correct = 0;
  var dailyMode = false;

  /* 阿特巴什：A(0)↔Z(25), B(1)↔Y(24)… */
  function atbash(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 65 && c <= 90) o += String.fromCharCode(90 - (c - 65));
      else o += s[i];
    }
    return o;
  }

  function daySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function pickBySeed(arr, seed) {
    var s = Math.abs(Math.floor(seed));
    var out = [], pool = arr.slice();
    for (var i = 0; i < TOTAL && pool.length; i++) {
      var x = (s + i * 7 + i * i * 3) % pool.length;
      out.push(pool.splice(x, 1)[0]);
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'at-wrap';
  wrap.innerHTML =
    '<div class="at-progress" id="at-prog"></div>' +
    '<div class="at-cipher" id="at-cipher"></div>' +
    '<div class="at-hint" id="at-hint"></div>' +
    '<input class="at-input" id="at-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="at-msg" id="at-msg"></div>' +
    '<button class="btn accent" id="at-sub">' + T('gs.atbash.submit') + '</button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="at-daily">📅 ' + T('gs.atbash.dailyBtn') + '</button></div>' +
    '<div class="at-help">' + T('gs.atbash.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#at-prog'), cipherEl = wrap.querySelector('#at-cipher'),
      hint = wrap.querySelector('#at-hint'), input = wrap.querySelector('#at-in'),
      msg = wrap.querySelector('#at-msg'), sub = wrap.querySelector('#at-sub');

  var answer = '', dailyWords = null, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = dailyWords ? dailyWords[idx] : WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.textContent = atbash(answer);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.atbash.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct) + (dailyMode ? ' ' + T('gs.atbash.dailyTag') : '');
    msg.textContent = ''; msg.className = 'at-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.atbash.msgEmpty'); msg.className = 'at-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.atbash.msgRight'); msg.className = 'at-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.atbash.msgWrong').replace('{answer}', answer); msg.className = 'at-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.atbash.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.atbash.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.atbash.perfect') : T('gs.atbash.goodJob');
    msg.className = 'at-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
    if (dailyMode && Arcade.daily) Arcade.daily.markSolved('atbash', correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  var dailyBtn = wrap.querySelector('#at-daily');
  if (dailyBtn) dailyBtn.addEventListener('click', function () {
    dailyMode = true;
    dailyWords = pickBySeed(WORDS, daySeed());
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  });

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    dailyMode = false; dailyWords = null;
    input.style.display = ''; sub.style.display = '';
    next();
  };
})();
