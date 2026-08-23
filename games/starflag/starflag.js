/* 星条旗密码 Star & Stripes —— C4 新游戏：星★=1 / 条纹─=0 的 5 位编码
   培根双字体密码的「星条旗」变体：用两种可区分的符号（星与条纹）隐藏 5 位二进制码，
   每 5 个符号 = 一个字母（A=00000）。5 题一轮：显示星条符号串，输入明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.starflag.tut1t'), d: T('gs.starflag.tut1') },
  { t: T('gs.starflag.tut2t'), d: T('gs.starflag.tut2') },
  { t: T('gs.starflag.tut3t'), d: T('gs.starflag.tut3') },
  { t: T('gs.starflag.tut4t'), d: T('gs.starflag.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['STAR', 'FLAG', 'STRIPE', 'BINARY', 'BACON', 'FIFTY', 'SIGNAL', 'FLYING', 'RED', 'BLUE'];
  var TOTAL = 5, idx = 0, correct = 0;
  var dailyMode = false;

  var STAR = '★', BAR = '─';
  function encStar(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 65 || c > 90) continue;
      var v = c - 65; // 0-25
      var bits = '';
      for (var b = 4; b >= 0; b--) bits += (v >> b) & 1 ? STAR : BAR;
      out.push(bits);
    }
    return out.join(' ');
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
  wrap.className = 'sf-wrap';
  wrap.innerHTML =
    '<div class="sf-progress" id="sf-prog"></div>' +
    '<div class="sf-cipher" id="sf-cipher"></div>' +
    '<div class="sf-legend">' + T('gs.starflag.legend') + '</div>' +
    '<div class="sf-hint" id="sf-hint"></div>' +
    '<input class="sf-input" id="sf-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="sf-msg" id="sf-msg"></div>' +
    '<button class="btn accent" id="sf-sub">' + T('gs.starflag.submit') + '</button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="sf-daily">📅 ' + T('gs.starflag.dailyBtn') + '</button></div>' +
    '<div class="sf-help">' + T('gs.starflag.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#sf-prog'), cipherEl = wrap.querySelector('#sf-cipher'),
      hint = wrap.querySelector('#sf-hint'), input = wrap.querySelector('#sf-in'),
      msg = wrap.querySelector('#sf-msg'), sub = wrap.querySelector('#sf-sub');

  var answer = '', dailyWords = null, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = dailyWords ? dailyWords[idx] : WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.textContent = encStar(answer);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.starflag.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct) + (dailyMode ? ' ' + T('gs.starflag.dailyTag') : '');
    msg.textContent = ''; msg.className = 'sf-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.starflag.msgEmpty'); msg.className = 'sf-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.starflag.msgRight'); msg.className = 'sf-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.starflag.msgWrong').replace('{answer}', answer); msg.className = 'sf-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.starflag.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.starflag.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.starflag.perfect') : T('gs.starflag.goodJob');
    msg.className = 'sf-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
    if (dailyMode && Arcade.daily) Arcade.daily.markSolved('starflag', correct); // 答对数非秒：大厅显示口径待统一
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  var dailyBtn = wrap.querySelector('#sf-daily');
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
