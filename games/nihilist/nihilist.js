/* 尼希尔斯特密码 Nihilist —— C4 新游戏：波利比奥斯坐标 + 密钥数字逐位相加
   俄国民粹派（Nihilist）地下组织使用的经典密码：明文 → 5×5 坐标两位数字，
   密钥词同样转坐标，逐位相加得到数字密文。破解时逐位相减再查表。
   5 题一轮：显示密钥 + 数字密文，输入明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.nihilist.tut1t'), d: T('gs.nihilist.tut1') },
  { t: T('gs.nihilist.tut2t'), d: T('gs.nihilist.tut2') },
  { t: T('gs.nihilist.tut3t'), d: T('gs.nihilist.tut3') },
  { t: T('gs.nihilist.tut4t'), d: T('gs.nihilist.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['NIHILIST', 'RUSSIA', 'UNDERGROUND', 'REVOLUTION', 'BOMB', 'PLOT', 'CONSPIRACY', 'TSAR', 'SECRET', 'CELL'];
  var KEYS = ['MOSCOW', 'TSAR', 'VOLGA', 'SIBERIA', 'TROIKA', 'NEVA', 'KREMLIN', 'URALS'];
  var TOTAL = 5, idx = 0, correct = 0;
  var dailyMode = false;

  var TBL = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 24 字母去 J
  function coord(ch) {
    var c = ch === 'J' ? 'I' : ch;
    var p = TBL.indexOf(c);
    if (p < 0) return null;
    return (Math.floor(p / 5) + 1) * 10 + (p % 5 + 1); // 两位数字，如 A=11
  }
  function keyDigits(key) {
    var out = [];
    for (var i = 0; i < key.length; i++) {
      var d = coord(key.charAt(i));
      if (d) out.push(d);
    }
    return out;
  }
  /* 标准 Nihilist 加密：明文坐标 + 密钥坐标（整数相加，密文 22~110） */
  function encNihilist(plain, key) {
    var kd = keyDigits(key);
    if (!kd.length) kd = [11];
    var out = [];
    for (var i = 0; i < plain.length; i++) {
      var cd = coord(plain.charAt(i));
      if (!cd) continue;
      out.push(cd + kd[i % kd.length]);
    }
    return out.join(' ');
  }
  /* 密钥坐标串（帮助玩家计算） */
  function keyCoordsStr(key) {
    return keyDigits(key).join(' ');
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
  wrap.className = 'ni-wrap';
  wrap.innerHTML =
    '<div class="ni-progress" id="ni-prog"></div>' +
    '<div class="ni-key" id="ni-key"></div>' +
    '<div class="ni-cipher" id="ni-cipher"></div>' +
    '<div class="ni-hint" id="ni-hint"></div>' +
    '<input class="ni-input" id="ni-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="ni-msg" id="ni-msg"></div>' +
    '<button class="btn accent" id="ni-sub">' + T('gs.nihilist.submit') + '</button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="ni-daily">📅 ' + T('gs.nihilist.dailyBtn') + '</button></div>' +
    '<div class="ni-help">' + T('gs.nihilist.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ni-prog'), keyEl = wrap.querySelector('#ni-key'),
      cipherEl = wrap.querySelector('#ni-cipher'), hint = wrap.querySelector('#ni-hint'),
      input = wrap.querySelector('#ni-in'), msg = wrap.querySelector('#ni-msg'), sub = wrap.querySelector('#ni-sub');

  var answer = '', key = '', dailyWords = null, dailyKeys = null, nextTimer = null, solved = false;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    solved = false;
    answer = dailyWords ? dailyWords[idx] : WORDS[Math.floor(Math.random() * WORDS.length)];
    key = dailyKeys ? dailyKeys[idx] : KEYS[Math.floor(Math.random() * KEYS.length)];
    keyEl.textContent = T('gs.nihilist.keyF').replace('{k}', key) + '  ·  ' + T('gs.nihilist.keyCoord') + ' ' + keyCoordsStr(key);
    cipherEl.textContent = encNihilist(answer, key);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.nihilist.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct) + (dailyMode ? ' ' + T('gs.nihilist.dailyTag') : '');
    msg.textContent = ''; msg.className = 'ni-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    if (solved) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.nihilist.msgEmpty'); msg.className = 'ni-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      solved = true;
      correct++;
      msg.textContent = T('gs.nihilist.msgRight'); msg.className = 'ni-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.nihilist.msgWrong').replace('{answer}', answer); msg.className = 'ni-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.nihilist.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.nihilist.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.nihilist.perfect') : T('gs.nihilist.goodJob');
    msg.className = 'ni-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
    if (dailyMode && Arcade.daily) Arcade.daily.markSolved('nihilist', correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  var dailyBtn = wrap.querySelector('#ni-daily');
  if (dailyBtn) dailyBtn.addEventListener('click', function () {
    dailyMode = true;
    dailyWords = pickBySeed(WORDS, daySeed());
    dailyKeys = pickBySeed(KEYS, daySeed() + 31);
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  });

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    dailyMode = false; dailyWords = null; dailyKeys = null;
    input.style.display = ''; sub.style.display = '';
    next();
  };
})();
