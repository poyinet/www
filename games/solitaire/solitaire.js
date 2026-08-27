/* 破译 DECODE ARCADE · 纸牌密码（Solitaire/Pontifex）—— 第四期 C 专项旗舰
   忠实实现 Bruce Schneier 的 Solitaire 手工流密码：
   ① A 王(53)下移1 ② B 王(54)下移2（越顶回位）③ 双王三切 ④ 底牌计数切
   ⑤ 顶牌点数定位出牌（王不出牌重跑）；牌值 >26 减 26 得字母。
   游戏循环：看规程日志 → 密文−密钥 → 还原单词；3 题一轮，计分 max。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.solitaire.tut1t'), d: T('gs.solitaire.tut1') },
  { t: T('gs.solitaire.tut2t'), d: T('gs.solitaire.tut2') },
  { t: T('gs.solitaire.tut3t'), d: T('gs.solitaire.tut3') },
  { t: T('gs.solitaire.tut4t'), d: T('gs.solitaire.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 3;
  var WORDS = ['AGENT', 'CODEX', 'RAVEN', 'CIPHER', 'ORCHID', 'FALCON', 'MARBLE', 'SILVER', 'HARBOR', 'TUNNEL'];

  var wrap = document.createElement('div');
  wrap.className = 'so-wrap';
  wrap.innerHTML =
    '<div class="so-progress" id="so-prog"></div>' +
    '<div class="so-cipher" id="so-cipher"></div>' +
    '<div class="so-log" id="so-log"></div>' +
    '<input class="so-input" id="so-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="so-msg" id="so-msg"></div>' +
    '<button class="btn accent" id="so-sub"></button> ' +
    '<button class="btn" id="so-hint"></button>' +
    '<div class="so-help">' + T('gs.solitaire.helpText') + '</div>';
  root.appendChild(wrap);
  var progEl = wrap.querySelector('#so-prog'), cipherEl = wrap.querySelector('#so-cipher'),
      logEl = wrap.querySelector('#so-log'), input = wrap.querySelector('#so-in'),
      msg = wrap.querySelector('#so-msg'), sub = wrap.querySelector('#so-sub'),
      hintBtn = wrap.querySelector('#so-hint');
  sub.textContent = T('gs.solitaire.submit');
  hintBtn.textContent = T('gs.solitaire.hintBtn');

  function rnd(n) { return Math.floor(Math.random() * n); }
  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  /* ---------- Pontifex 核心 ---------- */
  /* 牌值：梅花1-13 方片14-26 红心27-39 黑桃40-52；A王=53 B王=54。suit(v): 0♣1♦2♥3♠ */
  function cardName(v) {
    var suits = ['♣', '♦', '♥', '♠'];
    if (v === 53) return 'A王';
    if (v === 54) return 'B王';
    var r = ((v - 1) % 13) + 1;
    var faces = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
    var rank = faces[r] || String(r);
    return suits[Math.floor((v - 1) / 13)] + rank;
  }
  function down(deck, v, times) {
    for (var t = 0; t < times; t++) {
      var i = deck.indexOf(v);
      if (i === 53) { deck.splice(i, 1); deck.splice(1, 0, v); }
      else { var tmp = deck[i]; deck[i] = deck[i + 1]; deck[i + 1] = tmp; }
    }
  }
  function tripleCut(deck) {
    var a = deck.indexOf(53), b = deck.indexOf(54);
    if (a > b) { var t = a; a = b; b = t; }
    var top = deck.slice(0, a), mid = deck.slice(a, b + 1), bot = deck.slice(b + 1);
    var out = mid.concat(top, bot);
    for (var i = 0; i < 54; i++) deck[i] = out[i];
  }
  function countCut(deck) {
    var n = Math.min(deck[53], 53);
    if (n <= 0 || n >= 54) return n;
    var head = deck.slice(0, n);
    var rest = deck.slice(n, 53).concat([deck[53]]);
    for (var i = 0; i < 54; i++) deck[i] = rest.concat(head)[i];
    return n;
  }

  /* 从当前牌局产出 k 枚密钥字母，同时生成日志行 */
  function keystream(deck, k, logLines, lang) {
    var keys = '';
    var r = 0;
    while (keys.length < k) {
      r++;
      down(deck, 53, 1);
      down(deck, 54, 2);
      tripleCut(deck);
      var cut = countCut(deck);
      var probe = Math.min(deck[0], 53);
      var outCard = deck[probe];
      if (outCard === 53 || outCard === 54) {
        logLines.push(fmt('gs.solitaire.logRedo', { r: r }));
        continue;
      }
      var v = outCard > 26 ? outCard - 26 : outCard;
      var L = String.fromCharCode(65 + v - 1);
      keys += L;
      logLines.push(fmt('gs.solitaire.logRound', { r: r, cut: cut, card: cardName(outCard), letter: L }));
    }
    return keys;
  }

  /* ---------- 游戏状态 ---------- */
  var idx = 0, correct = 0, hintsUsed = 0;
  var answer = '', nextTimer = null;

  /* ---------- 断点续玩（共享模块 Arcade.savegame：自动 + 恢复；仅存本机） ---------- */
  function writeSave() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.write()); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'solitaire',
      collect: function () {
        /* 本轮已结算（idx 到顶）/ 未开局 → 无局可存，自动清档 */
        if (!answer && idx >= TOTAL) return null;
        return { idx: idx, correct: correct, hintsUsed: hintsUsed };
      },
      apply: function (s) {
        if (!s || typeof s.idx !== 'number' || s.idx < 0 || s.idx >= TOTAL ||
            typeof s.correct !== 'number') return false;
        idx = s.idx;
        correct = Math.max(0, s.correct | 0);
        hintsUsed = Math.max(0, s.hintsUsed | 0);
        if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
        load(); /* 重新载入当前轮的第 idx+1 题（进度保留；题目为随机重发） */
        return true;
      }
    });
  }

  function shuffleDeck() {
    var d = [];
    for (var v = 1; v <= 54; v++) d.push(v);
    for (var i = 53; i > 0; i--) {
      var j = rnd(i + 1);
      var t = d[i]; d[i] = d[j]; d[j] = t;
    }
    return d;
  }
  function vigEnc(word, keys) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      o += String.fromCharCode(((word.charCodeAt(i) - 65 + keys.charCodeAt(i) - 65) % 26) + 65);
    }
    return o;
  }

  function updProg() {
    progEl.textContent = fmt('gs.solitaire.progress', { n: Math.min(idx + 1, TOTAL), total: TOTAL, correct: correct });
  }

  function load() {
    var word = WORDS[rnd(WORDS.length)];
    answer = word;
    var deck = shuffleDeck();
    var lines = [fmt('gs.solitaire.logHead', { word: word, k: word.length })];
    var keys = keystream(deck, word.length, lines);
    cipherEl.textContent = vigEnc(word, keys);
    logEl.innerHTML = lines.join('<br>') + '<br>' + fmt('gs.solitaire.keyLine', { keys: keys });
    logEl.scrollTop = 0;
    msg.textContent = ''; msg.className = 'so-msg';
    input.value = '';
    updProg();
  }

  function submit() {
    if (!answer) return;
    var v = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) return;
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.solitaire.okMsg'); msg.className = 'so-msg ok';
      if (Arcade.juice) Arcade.juice.win();
    } else {
      msg.textContent = fmt('gs.solitaire.noMsg', { ans: answer }); msg.className = 'so-msg no';
      if (Arcade.juice) Arcade.juice.lose();
    }
    idx++;
    updProg();
    if (idx >= TOTAL) {
      var score = correct * 30 - hintsUsed * 10;
      if (score < 0) score = 0;
      if (Arcade.shell) Arcade.shell.submitScore(score);
      if (correct === TOTAL && Arcade.juice) Arcade.juice.win();
      nextTimer = setTimeout(function () { idx = 0; correct = 0; hintsUsed = 0; load(); }, 1600);
      answer = '';
    } else {
      nextTimer = setTimeout(load, 1200);
    }
    writeSave();
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  hintBtn.addEventListener('click', function () {
    if (!answer) return;
    hintsUsed++;
    msg.textContent = fmt('gs.solitaire.hintMsg', { first: answer.charAt(0) });
    msg.className = 'so-msg';
    writeSave();
  });

  window.GAME_RESTART = function () {
    idx = 0; correct = 0; hintsUsed = 0;
    clearTimeout(nextTimer); answer = '';
    clearSave();
    load();
  };

  if (!tryResume()) load();
})();
