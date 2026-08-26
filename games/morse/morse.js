/* 摩斯电码破译 Morse —— P2 密码破译 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.morse.tut1t'), d: T('gs.morse.tut1') },
  { t: T('gs.morse.tut2t'), d: T('gs.morse.tut2') },
  { t: T('gs.morse.tut3t'), d: T('gs.morse.tut3') },
  { t: T('gs.morse.tut4t'), d: T('gs.morse.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var MORSE = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.' };
  var WORDS = ['CODE','NEON','LASER','ROBOT','GAME','VAULT','CIPHER','SIGNAL','MORSE','WORD','KEY','BASE','BOMB','HACK','ECHO','RADAR','FLAME','GHOST','STONE','BRICK'];
  var TOTAL = 5, idx = 0, correct = 0;
  var dailyMode = false;

  /* 每日一题：按日期固定种子（全球同题） */
  function daySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function pickBySeed(arr, seed) {
    var s = Math.abs(Math.floor(seed));
    var out = [];
    var pool = arr.slice();
    for (var i = 0; i < TOTAL && pool.length; i++) {
      var x = (s + i * 7 + i * i * 3) % pool.length;
      out.push(pool.splice(x, 1)[0]);
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'mo-wrap';
  wrap.innerHTML =
    '<div class="mo-progress" id="mo-prog"></div>' +
    '<div class="mo-morse" id="mo-morse"></div>' +
    '<div class="mo-hint" id="mo-hint"></div>' +
    '<input class="mo-input" id="mo-in" maxlength="6" autocomplete="off" spellcheck="false">' +
    '<div class="mo-msg" id="mo-msg"></div>' +
    '<button class="btn accent" id="mo-sub">' + T('gs.morse.submit') + '</button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="mo-daily">📅 ' + T('gs.morse.dailyBtn') + '</button></div>';
  
  /* helpText 知识延伸 */
  var helpDiv = document.createElement('div');
  helpDiv.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  helpDiv.innerHTML = T('gs.morse.helpText');
  wrap.appendChild(helpDiv);
root.appendChild(wrap);
  var prog = wrap.querySelector('#mo-prog'), morseEl = wrap.querySelector('#mo-morse'),
      hint = wrap.querySelector('#mo-hint'), input = wrap.querySelector('#mo-in'),
      msg = wrap.querySelector('#mo-msg'), sub = wrap.querySelector('#mo-sub');

  var answer = '';
  var dailyWords = null;
  var nextTimer = null; // 跳题定时器句柄（重开时取消）
  var solved = false; // 答对后失效输入，防止 700ms 窗口内重复提交刷分
  function next() {
    if (idx >= TOTAL) { finish(); return; }
    solved = false;
    answer = dailyWords ? dailyWords[idx] : WORDS[Math.floor(Math.random() * WORDS.length)];
    var m = '';
    for (var i = 0; i < answer.length; i++) m += (MORSE[answer[i]] || '') + '  ';
    morseEl.textContent = m.trim();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.morse.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct) + (dailyMode ? ' ' + T('gs.morse.dailyTag') : '');
    msg.textContent = '';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    if (solved) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.morse.msgEmpty'); if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      solved = true;
      correct++;
      msg.textContent = T('gs.morse.msgRight'); msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.morse.msgWrong').replace('{answer}', answer); msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    // 句柄化跳题定时器：重开时取消，避免旧定时器在新一局触发 next（竞态）
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    morseEl.textContent = T('gs.morse.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.morse.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.morse.perfect') : T('gs.morse.goodJob');
    msg.style.color = 'var(--neon-yellow)';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
    if (dailyMode && Arcade.daily) Arcade.daily.markSolved('morse', correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  var dailyBtn = wrap.querySelector('#mo-daily');
  if (dailyBtn) {
    dailyBtn.addEventListener('click', function () {
      dailyMode = true;
      dailyWords = pickBySeed(WORDS, daySeed());
      idx = 0; correct = 0;
      input.style.display = ''; sub.style.display = '';
      next();
    });
  }

    window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    dailyMode = false; dailyWords = null;
    input.style.display = ''; sub.style.display = '';
    next();
  };

})();
