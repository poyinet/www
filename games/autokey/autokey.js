/* 破译 DECODE ARCADE · 自动密钥（Autokey）—— C4 新游戏：维吉尼亚进阶
   密钥流 = 引子(primer) + 明文自身。玩家按链式规则还原明文，5 题一轮。
   支持每日模式（日种子出题）。计分 max：答对 ×20 − 提示 ×5。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.autokey.tut1t'), d: T('gs.autokey.tut1') },
  { t: T('gs.autokey.tut2t'), d: T('gs.autokey.tut2') },
  { t: T('gs.autokey.tut3t'), d: T('gs.autokey.tut3') },
  { t: T('gs.autokey.tut4t'), d: T('gs.autokey.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'PRIMER', 'GARDEN', 'SILVER', 'ORANGE', 'PLANET', 'MARKET', 'WINTER',
               'CASTLE', 'FRIEND', 'HARVEST', 'LANTERN', 'PILLARS', 'THUNDER', 'VOYAGES', 'WHISPERS'];
  var PRIMERS = ['KEY', 'ARC', 'SUN', 'TOP', 'ZEP', 'IVY'];
  var TOTAL = 5, idx = 0, correct = 0, hintsUsed = 0, dailyMode = false;

  function daySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function pickBySeed(arr, seed) {
    var s = Math.abs(Math.floor(seed));
    var out = [], pool = arr.slice();
    for (var i = 0; i < TOTAL && pool.length; i++) {
      var x = (s + i * 11 + i * i * 3) % pool.length;
      out.push(pool.splice(x, 1)[0]);
    }
    return out;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }

  /* autokey 加密：密钥流 = primer + 明文 */
  function enc(word, primer) {
    var key = primer + word, out = '';
    for (var i = 0; i < word.length; i++) {
      out += String.fromCharCode((word.charCodeAt(i) - 65 + key.charCodeAt(i) - 65) % 26 + 65);
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ak-wrap';
  wrap.innerHTML =
    '<div class="ak-progress" id="ak-prog"></div>' +
    '<div class="ak-primer" id="ak-primer"></div>' +
    '<div class="ak-cipher" id="ak-cipher"></div>' +
    '<div class="ak-chain" id="ak-chain"></div>' +
    '<input class="ak-input" id="ak-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="ak-msg" id="ak-msg"></div>' +
    '<button class="btn accent" id="ak-sub"></button> ' +
    '<button class="btn" id="ak-hint"></button>' +
    '<div style="margin-top:10px"><button class="btn yellow" id="ak-daily">📅 ' + T('gs.autokey.dailyBtn') + '</button></div>' +
    '<div class="ak-help">' + T('gs.autokey.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ak-prog'), primerEl = wrap.querySelector('#ak-primer'),
      cipherEl = wrap.querySelector('#ak-cipher'), chainEl = wrap.querySelector('#ak-chain'),
      input = wrap.querySelector('#ak-in'), msg = wrap.querySelector('#ak-msg'),
      sub = wrap.querySelector('#ak-sub'), hintBtn = wrap.querySelector('#ak-hint'),
      dailyBtn = wrap.querySelector('#ak-daily');
  sub.textContent = T('gs.autokey.submit');
  hintBtn.textContent = T('gs.autokey.hintBtn');

  var answer = '', primer = '', dailyWords = null, nextTimer = null;

  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function updProg() {
    prog.textContent = fmt('gs.autokey.progress', { n: Math.min(idx + 1, TOTAL), total: TOTAL, correct: correct });
  }

  /* 链式提示：展示前 hintSteps 步推演 */
  function renderChain(steps) {
    var html = T('gs.autokey.chainHead') + '<br>';
    for (var i = 0; i < steps.length; i++) {
      html += fmt('gs.autokey.hintLine', steps[i]) + '<br>';
    }
    if (!steps.length) html += '&nbsp;';
    chainEl.innerHTML = html;
  }

  function load() {
    var word, pl;
    if (dailyWords) { word = dailyWords[idx].w; primer = dailyWords[idx].p; }
    else { word = WORDS[rnd(WORDS.length)]; primer = PRIMERS[rnd(PRIMERS.length)]; }
    answer = word;
    pl = primer.length;
    primerEl.textContent = fmt('gs.autokey.primerLabel', { p: primer });
    cipherEl.textContent = enc(word, primer);
    msg.textContent = ''; msg.className = 'ak-msg';
    input.value = '';
    /* 默认展示第一步推演 */
    var steps = [];
    for (var i = 0; i < Math.min(pl, 3); i++) {
      var c = cipherEl.textContent.charCodeAt(i) - 65, k = primer.charCodeAt(i) - 65;
      steps.push({ c: String.fromCharCode(c + 65), k: String.fromCharCode(k + 65), p: String.fromCharCode(((c - k + 26) % 26) + 65), i: i + 1, n: word.length });
    }
    renderChain(steps);
    updProg();
  }

  function submit() {
    if (!answer) return;
    var v = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) return;
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.autokey.okMsg'); msg.className = 'ak-msg ok';
      if (Arcade.juice) Arcade.juice.win();
    } else {
      msg.textContent = fmt('gs.autokey.noMsg', { pl: primer.length }); msg.className = 'ak-msg no';
      if (Arcade.juice) Arcade.juice.lose();
    }
    idx++;
    updProg();
    if (idx >= TOTAL) {
      var score = correct * 20 - hintsUsed * 5;
      if (score < 0) score = 0;
      if (Arcade.shell) Arcade.shell.submitScore(score);
      if (dailyMode && Arcade.daily) Arcade.daily.markSolved('autokey', correct);
      if (correct === TOTAL && Arcade.juice) Arcade.juice.win();
      nextTimer = setTimeout(function () { idx = 0; correct = 0; hintsUsed = 0; dailyWords = null; dailyMode = false; load(); }, 1600);
      answer = '';
    } else {
      nextTimer = setTimeout(load, 1100);
    }
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  hintBtn.addEventListener('click', function () {
    if (!answer) return;
    hintsUsed++;
    var steps = [];
    var n = Math.min(answer.length, primer.length + Math.min(3, answer.length - primer.length));
    for (var i = 0; i < n; i++) {
      var ci = i < primer.length ? primer.charCodeAt(i) : answer.charCodeAt(i - primer.length);
      var c = cipherEl.textContent.charCodeAt(i) - 65, k = ci - 65;
      steps.push({ c: String.fromCharCode(c + 65), k: String.fromCharCode(k + 65), p: String.fromCharCode(((c - k + 26) % 26) + 65), i: i + 1, n: answer.length });
    }
    renderChain(steps);
  });
  dailyBtn.addEventListener('click', function () {
    var seed = daySeed(), words = pickBySeed(WORDS, seed);
    dailyWords = [];
    for (var i = 0; i < TOTAL; i++) {
      var pseed = (seed * 31 + i * 7) % 9973;
      dailyWords.push({ w: words[i], p: PRIMERS[pseed % PRIMERS.length] });
    }
    idx = 0; correct = 0; hintsUsed = 0; dailyMode = true;
    clearTimeout(nextTimer); answer = '';
    load();
  });

  window.GAME_RESTART = function () {
    idx = 0; correct = 0; hintsUsed = 0; dailyWords = null; dailyMode = false;
    clearTimeout(nextTimer); answer = '';
    load();
  };

  load();
})();
