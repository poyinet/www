/* ============================================================
   JN-25 破译机 · 中途岛加表回收（旗舰，全网独家）
   历史原型：1942 太平洋，日军 JN-25 密码 = 密码本(词→4位码) + 加表(每日密钥流)双重加密。
   美军截获舰队电报，靠「深度」（多封同日电报共享加表）逐列回收加表值，
   中途岛海战翻盘的关键。
   玩法：密码本部分已知，加表未知。猜某列某词 → 算出候选加表 →
   若其余舰船同列全部解成合法码 → 验证通过，整列解出、密码本补全。
   记分：全部电文解出用时（min）。三难度。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.jn25.tut1t'), d: T('gs.jn25.tut1') },
  { t: T('gs.jn25.tut2t'), d: T('gs.jn25.tut2') },
  { t: T('gs.jn25.tut3t'), d: T('gs.jn25.tut3') },
  { t: T('gs.jn25.tut4t'), d: T('gs.jn25.tut4') }
];

(function () {
  /* ==JN-CORE-START== */
  var JNCORE = (function () {
    function mod(n, m) { return ((n % m) + m) % m; }
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var POOL = ['FLEET', 'ATTACK', 'POSITION', 'ENEMY', 'SUBMARINE', 'CARRIER', 'FORCE', 'LANDING',
      'DEFENSE', 'NIGHT', 'DAWN', 'WEATHER', 'REPORT', 'COURSE', 'SPEED', 'FUEL', 'ORDERS',
      'PATROL', 'CONVOY', 'HARBOR', 'BOMBER', 'RADAR', 'DESTROYER', 'TANKER'];

    /* 生成挑战：部分密码本已知，加表未知，保证「或aclesolver」可全解 */
    function genJn25(level, rng) {
      for (var attempt = 0; attempt < 60; attempt++) {
        var K = level === 3 ? 5 : 4;
        var M = level === 1 ? 4 : level === 2 ? 5 : 6;
        var poolSize = level === 1 ? 10 : level === 2 ? 14 : 18;
        var knownFrac = level === 1 ? 0.7 : level === 2 ? 0.6 : 0.5;
        var hintCount = level === 3 ? 1 : 2;

        // 词池
        var pool = [], used = {};
        while (pool.length < poolSize) {
          var w = POOL[Math.floor(rng() * POOL.length)];
          if (!used[w]) { used[w] = true; pool.push(w); }
        }
        // 唯一 4 位码
        var book = {}, codeSet = {};
        pool.forEach(function (word) {
          var c;
          do { c = Math.floor(rng() * 10000); } while (codeSet[c]);
          codeSet[c] = true;
          book[word] = c;
        });
        // 已知码集合（缴获碎片）
        var known = {};
        var kn = Math.max(2, Math.round(poolSize * knownFrac));
        pool.forEach(function (word, i) { if (i < kn) known[word] = true; });
        // 电文 M×K
        var messages = [];
        for (var m = 0; m < M; m++) {
          var row = [];
          for (var k = 0; k < K; k++) row.push(pool[Math.floor(rng() * pool.length)]);
          messages.push(row);
        }
        // 加表 + 密文
        var additive = [];
        for (var k2 = 0; k2 < K; k2++) additive.push(Math.floor(rng() * 10000));
        var trans = messages.map(function (row) {
          return row.map(function (word, kk) { return mod(book[word] + additive[kk], 10000); });
        });
        var hintCols = [];
        for (var h = 0; h < hintCount; h++) hintCols.push(h);

        var ch = { K: K, M: M, pool: pool, book: book, known: known, messages: messages, additive: additive, trans: trans, hintCols: hintCols, level: level };
        if (solveOracle(ch).allDecoded && !hasFalseVerify(ch)) return ch;
      }
      return null;
    }

    /* 检查是否存在「不在该列却验证通过」的词（会污染密码本/误导胜利） */
    function hasFalseVerify(ch) {
      for (var k = 0; k < ch.K; k++) {
        var inCol = {};
        for (var m = 0; m < ch.M; m++) inCol[ch.messages[m][k]] = true;
        for (var i = 0; i < ch.pool.length; i++) {
          var w = ch.pool[i];
          if (inCol[w]) continue;
          var r = tryWord(ch, k, w);
          if (r && r.ok) return true;
        }
      }
      return false;
    }

    function codeToWord(ch, code) {
      for (var w in ch.book) if (ch.book[w] === code) return w;
      return null;
    }

    /* 猜词验证：词 W 是否匹配某舰第 k 列。
       对每艘舰 m 试算候选加表 = trans[m][k] − code(W)，
       若某候选能把「其余全部舰船」同列解成合法码 → 验证通过，返回 {ok, additive, decodes} */
    function tryWord(ch, k, W) {
      var cW = ch.book[W];
      if (cW === undefined) return null;
      for (var anchor = 0; anchor < ch.M; anchor++) {
        var cand = mod(ch.trans[anchor][k] - cW, 10000);
        var decodes = [];
        var ok = true;
        for (var m = 0; m < ch.M; m++) {
          var code = mod(ch.trans[m][k] - cand, 10000);
          var word = codeToWord(ch, code);
          decodes.push({ m: m, code: code, word: word });
          if (word === null) { ok = false; break; }
        }
        if (ok) return { ok: true, additive: cand, anchor: anchor, decodes: decodes };
      }
      return { ok: false, additive: null, anchor: -1, decodes: null };
    }

    /* 可解性 oracle：模拟「已知词 → 逐列验证解出 → 补全码 → 再解」的贪心链 */
    function solveOracle(ch) {
      var decoded = {}; // k → additive
      var known = {};
      for (var w in ch.known) known[w] = true;
      ch.hintCols.forEach(function (k) {
        decoded[k] = ch.additive[k];
        for (var m = 0; m < ch.M; m++) known[ch.messages[m][k]] = true; // 解出列即确认词码
      });
      var changed = true;
      while (changed) {
        changed = false;
        for (var k = 0; k < ch.K; k++) {
          if (decoded[k] !== undefined) continue;
          for (var w in known) {
            if (!known[w]) continue;
            var r = tryWord(ch, k, w);
            if (r && r.ok) {
              decoded[k] = r.additive;
              for (var m2 = 0; m2 < ch.M; m2++) known[ch.messages[m2][k]] = true;
              changed = true;
              break;
            }
          }
        }
      }
      var allDecoded = true;
      for (var k2 = 0; k2 < ch.K; k2++) if (decoded[k2] === undefined) allDecoded = false;
      return { decoded: decoded, allDecoded: allDecoded, known: known };
    }

    return {
      mod: mod, mulberry32: mulberry32, POOL: POOL,
      genJn25: genJn25, codeToWord: codeToWord, tryWord: tryWord, solveOracle: solveOracle
    };
  })();
  /* ==JN-CORE-END== */

  var mod = JNCORE.mod, genJn25 = JNCORE.genJn25, tryWord = JNCORE.tryWord, mulberry32 = JNCORE.mulberry32;

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  root.innerHTML =
    '<div class="jn-wrap">' +
    '  <div class="jn-info">' +
    '    <span>' + T('gs.jn25.diffLbl') + ' <span id="jn-diff" class="stat-value"></span></span>' +
    '    <span>' + T('gs.jn25.timeLbl') + ' <span id="jn-timer" class="stat-value">0s</span></span>' +
    '    <span>' + T('gs.jn25.progLbl') + ' <span id="jn-prog" class="stat-value">0</span>/<span id="jn-total" class="stat-value">0</span></span>' +
    '  </div>' +
    '  <div class="jn-flavor">' + T('gs.jn25.flavor') + '</div>' +
    '  <div class="jn-lbl">' + T('gs.jn25.bookLbl') + '</div>' +
    '  <div class="jn-book" id="jn-book"></div>' +
    '  <div class="jn-lbl">' + T('gs.jn25.additiveLbl') + '</div>' +
    '  <div class="jn-additive" id="jn-additive"></div>' +
    '  <div class="jn-lbl">' + T('gs.jn25.gridLbl') + '</div>' +
    '  <div class="jn-grid" id="jn-grid"></div>' +
    '  <div class="jn-lbl">' + T('gs.jn25.tryLbl') + '<span id="jn-curk" class="stat-value">-</span>' + T('gs.jn25.tryLblEnd') + '</div>' +
    '  <div class="jn-try" id="jn-try">' + T('gs.jn25.tryEmpty') + '</div>' +
    '  <div class="game-controls">' +
    '    <button class="btn purple" id="jn-hint">' + T('gs.jn25.hintBtn') + '</button>' +
    '    <button class="btn yellow" id="jn-new">' + T('gs.jn25.newBtn') + '</button>' +
    '  </div>' +
    '</div>';

  var el = function (id) { return document.getElementById(id); };
  var LEVELS = [T('gs.jn25.dEasy'), T('gs.jn25.dNormal'), T('gs.jn25.dHard')];
  var level = 0;
  var chal = null;
  var decodedAdd = {};   // k → additive（已解列）
  var confirmed = {};    // word → true（密码本已确认）
  var timerTick = null, startTs = 0, answered = false;
  var curK = -1;

  function elapsed() { return Math.round((Date.now() - startTs) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }
  function startTimer() {
    stopTimer();
    startTs = Date.now();
    timerTick = setInterval(function () { el('jn-timer').textContent = elapsed() + 's'; }, 500);
  }

  function newChallenge() {
    answered = false;
    curK = -1;
    chal = genJn25(level + 1, mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0));
    if (!chal) { if (Arcade.ui) Arcade.ui.toast(T('gs.jn25.genFail'), 'warn'); return; }
    decodedAdd = {};
    confirmed = {};
    chal.hintCols.forEach(function (k) {
      decodedAdd[k] = chal.additive[k];
      for (var m = 0; m < chal.M; m++) confirmed[chal.messages[m][k]] = true;
    });
    for (var w in chal.known) confirmed[w] = true;
    el('jn-diff').textContent = LEVELS[level];
    el('jn-total').textContent = chal.K;
    el('jn-grid').style.setProperty('--K', chal.K);
    renderBook();
    renderAdditive();
    renderGrid();
    renderTry();
    startTimer();
  }

  function renderBook() {
    var html = '';
    chal.pool.forEach(function (w) {
      var on = confirmed[w] === true;
      html += '<span class="jn-word' + (on ? ' on' : '') + '">' + w + ' <b>' + (on ? String(chal.book[w]).padStart(4, '0') : '????') + '</b></span>';
    });
    el('jn-book').innerHTML = html;
  }

  function renderAdditive() {
    var html = '';
    for (var k = 0; k < chal.K; k++) {
      var on = decodedAdd[k] !== undefined;
      html += '<span class="jn-add' + (on ? ' on' : '') + '" data-k="' + k + '">' + T('gs.jn25.colShort').replace('{n}', k + 1) + ' ' +
        (on ? String(decodedAdd[k]).padStart(4, '0') : '????') + '</span>';
    }
    el('jn-additive').innerHTML = html;
  }

  function renderGrid() {
    var html = '<div class="jn-gridhead"><span>' + T('gs.jn25.shipLbl') + '</span>' +
      Array.from({ length: chal.K }, function (_, k) { return '<span>' + T('gs.jn25.colShort').replace('{n}', k + 1) + '</span>'; }).join('') + '</div>';
    var ships = [T('gs.jn25.shipFlag'), T('gs.jn25.shipCruiser'), T('gs.jn25.shipDestroyer'), T('gs.jn25.shipEscort'), T('gs.jn25.shipTransport'), T('gs.jn25.shipSupply')];
    for (var m = 0; m < chal.M; m++) {
      html += '<div class="jn-row"><span class="jn-ship">' + (ships[m] || T('gs.jn25.shipGeneric').replace('{n}', m + 1)) + '</span>';
      for (var k = 0; k < chal.K; k++) {
        var dec = decodedAdd[k] !== undefined;
        var word = dec ? chal.messages[m][k] : null;
        html += '<span class="jn-cell' + (dec ? ' on' : '') + '" data-m="' + m + '" data-k="' + k + '">' +
          '<span class="jn-cg">' + String(chal.trans[m][k]).padStart(4, '0') + '</span>' +
          (word ? '<span class="jn-cw">' + word + '</span>' : '') + '</span>';
      }
      html += '</div>';
    }
    el('jn-grid').innerHTML = html;
    el('jn-grid').querySelectorAll('.jn-cell').forEach(function (c) {
      c.addEventListener('click', function () {
        if (answered) return;
        curK = parseInt(this.getAttribute('data-k'), 10);
        renderGrid();
        renderTry();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
    });
  }

  function renderTry() {
    var box = el('jn-try');
    if (curK < 0) { box.innerHTML = T('gs.jn25.tryEmpty'); return; }
    if (decodedAdd[curK] !== undefined) { box.innerHTML = T('gs.jn25.colSolved').replace('{n}', curK + 1); return; }
    var html = T('gs.jn25.tryPrompt').replace('{n}', curK + 1);
    var any = false;
    chal.pool.forEach(function (w) {
      if (confirmed[w] !== true) return;
      any = true;
      html += '<button class="jn-guess" data-w="' + w + '">' + w + '</button>';
    });
    if (!any) { box.innerHTML = T('gs.jn25.tryNoWord'); return; }
    box.innerHTML = html;
    box.querySelectorAll('.jn-guess').forEach(function (b) {
      b.addEventListener('click', function () {
        tryGuess(this.getAttribute('data-w'));
      });
    });
  }

  function tryGuess(W) {
    if (answered || curK < 0 || decodedAdd[curK] !== undefined) return;
    var r = tryWord(chal, curK, W);
    if (r.ok) {
      decodedAdd[curK] = r.additive;
      for (var m = 0; m < chal.M; m++) confirmed[chal.messages[m][curK]] = true;
      var box = el('jn-try');
      var preview = r.decodes.map(function (d) { return d.word; }).join(' / ');
      box.innerHTML = T('gs.jn25.guessOk').replace('{n}', curK + 1).replace('{a}', String(r.additive).padStart(4, '0')).replace('{p}', preview);
      if (Arcade.juice) Arcade.juice.select();
      if (Arcade.audio) Arcade.audio.play('coin');
      renderBook();
      renderAdditive();
      renderGrid();
      checkWin();
    } else {
      var box2 = el('jn-try');
      box2.innerHTML = T('gs.jn25.guessFail').replace('{w}', W);
      box2.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  function checkWin() {
    var done = 0;
    for (var k = 0; k < chal.K; k++) if (decodedAdd[k] !== undefined) done++;
    el('jn-prog').textContent = done;
    if (done === chal.K) {
      answered = true;
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.audio) Arcade.audio.play('win');
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      if (Arcade.ui) Arcade.ui.toast(T('gs.jn25.win').replace('{n}', elapsed()), 'win');
      setTimeout(newChallenge, 1500);
    }
  }

  el('jn-hint').addEventListener('click', function () {
    if (answered || !chal) return;
    // 揭示一个未解列的正确词
    for (var k = 0; k < chal.K; k++) {
      if (decodedAdd[k] === undefined) {
        var w = chal.messages[0][k];
        confirmed[w] = true;
        renderBook();
        var box = el('jn-try');
        box.innerHTML = T('gs.jn25.hintMsg').replace('{n}', k + 1).replace('{w}', w);
        box.style.color = '';
        if (Arcade.audio) Arcade.audio.play('ui');
        return;
      }
    }
  });

  el('jn-new').addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    newChallenge();
  });

  /* 难度切换 */
  var diffRow = document.createElement('div');
  diffRow.className = 'jn-diffs';
  diffRow.innerHTML = LEVELS.map(function (d, i) {
    return '<button class="mode-btn' + (i === level ? ' selected' : '') + '" data-lv="' + i + '">' + d + '</button>';
  }).join('');
  var infoRow = root.querySelector('.jn-info');
  infoRow.appendChild(diffRow);
  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      level = parseInt(this.getAttribute('data-lv'), 10);
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('selected', x === b); });
      newChallenge();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.jn25.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    stopTimer();
    level = 0;
    diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('selected', x.getAttribute('data-lv') === '0'); });
    newChallenge();
  };

  // 初始化
  newChallenge();


})();
