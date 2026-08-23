/* 波利比奥斯方阵 Polybius —— C4 新游戏：5×5 坐标密码
   公元前 2 世纪希腊历史学家波利比奥斯发明：每个字母用「行-列」两位数字表示。
   5 题一轮：显示坐标串，输入明文。I/J 合并占一格。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.polybius.tut1t'), d: T('gs.polybius.tut1') },
  { t: T('gs.polybius.tut2t'), d: T('gs.polybius.tut2') },
  { t: T('gs.polybius.tut3t'), d: T('gs.polybius.tut3') },
  { t: T('gs.polybius.tut4t'), d: T('gs.polybius.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['POLYBIUS', 'SQUARE', 'GRID', 'COORD', 'ROW', 'COLUMN', 'TABLET', 'HELLO', 'MORSE', 'SIGNAL'];
  var TOTAL = 5, idx = 0, correct = 0;
  var dailyMode = false;

  /* 标准 5×5（I/J 合并） */
  var TBL = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 25 字母去 J
  function encPolybius(s) {
    var o = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var p = TBL.indexOf(ch === 'J' ? 'I' : ch);
      if (p < 0) continue;
      o.push((Math.floor(p / 5) + 1) + '' + (p % 5 + 1));
    }
    return o.join(' ');
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
  wrap.className = 'pb-wrap';
  /* 方阵帮助：5×5 + 表头 */
  var gridHtml = '<div class="pb-grid">' +
    '<div class="pb-cell h"></div>' + '<div class="pb-cell h">1</div>' + '<div class="pb-cell h">2</div>' + '<div class="pb-cell h">3</div>' + '<div class="pb-cell h">4</div>' + '<div class="pb-cell h">5</div>';
  for (var r = 0; r < 5; r++) {
    gridHtml += '<div class="pb-cell h">' + (r + 1) + '</div>';
    for (var c = 0; c < 5; c++) {
      gridHtml += '<div class="pb-cell c">' + TBL[r * 5 + c] + '</div>';
    }
  }
  gridHtml += '</div>';

  wrap.innerHTML =
    '<div class="pb-progress" id="pb-prog"></div>' +
    '<div class="pb-cipher" id="pb-cipher"></div>' +
    gridHtml +
    '<div class="pb-hint" id="pb-hint"></div>' +
    '<input class="pb-input" id="pb-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="pb-msg" id="pb-msg"></div>' +
    '<button class="btn accent" id="pb-sub">' + T('gs.polybius.submit') + '</button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="pb-daily">📅 ' + T('gs.polybius.dailyBtn') + '</button></div>' +
    '<div class="pb-help">' + T('gs.polybius.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#pb-prog'), cipherEl = wrap.querySelector('#pb-cipher'),
      hint = wrap.querySelector('#pb-hint'), input = wrap.querySelector('#pb-in'),
      msg = wrap.querySelector('#pb-msg'), sub = wrap.querySelector('#pb-sub');

  var answer = '', dailyWords = null, nextTimer = null, solved = false;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    solved = false;
    answer = dailyWords ? dailyWords[idx] : WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.textContent = encPolybius(answer);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.polybius.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct) + (dailyMode ? ' ' + T('gs.polybius.dailyTag') : '');
    msg.textContent = ''; msg.className = 'pb-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    if (solved) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.polybius.msgEmpty'); msg.className = 'pb-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      solved = true;
      correct++;
      msg.textContent = T('gs.polybius.msgRight'); msg.className = 'pb-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.polybius.msgWrong').replace('{answer}', answer); msg.className = 'pb-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.polybius.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.polybius.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.polybius.perfect') : T('gs.polybius.goodJob');
    msg.className = 'pb-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
    if (dailyMode && Arcade.daily) Arcade.daily.markSolved('polybius', correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  var dailyBtn = wrap.querySelector('#pb-daily');
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
