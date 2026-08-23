/* ============================================================
   Playfair 密码机 · 二战英军双字母替换密码（旗舰级）
   - 5x5 密钥方阵（I/J 合并为 I）
   - 明文按字母对处理：同行→右移一格 / 同列→下移一格 /
     矩形→对角互换；同字母对间插 X；奇数长度补 X
   - 加密与解密互逆（同行/同列反向移动，矩形相同）
   三模式：
   - 演练：任意密钥词，输入明/密文即时变换，观察方阵
   - 破译挑战：给密文+部分密钥，缺字母玩家填入，解密后
     反馈正确字母对数，找齐全部缺失密钥字母即通关
   记分：挑战通关用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.playfair.tut1t'), d: T('gs.playfair.tut1') },
  { t: T('gs.playfair.tut2t'), d: T('gs.playfair.tut2') },
  { t: T('gs.playfair.tut3t'), d: T('gs.playfair.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ---------- 密钥方阵构建 ----------
     返回 {grid: 25 长度数组(0-24 为字母索引，I/J 合并为 I=8), pos: 字母索引->位置} */
  function buildGrid(keyword) {
    var seen = {};
    var seq = [];
    var kw = (keyword || '').toUpperCase().replace(/[^A-Z]/g, '');
    for (var i = 0; i < kw.length; i++) {
      var c = kw.charCodeAt(i) - 65;
      if (c === 9) c = 8; // J -> I
      if (!seen[c]) { seen[c] = true; seq.push(c); }
    }
    for (var j = 0; j < 26; j++) {
      var L = j === 9 ? 8 : j;
      if (!seen[L]) { seen[L] = true; seq.push(L); }
    }
    var grid = seq; // 25 个字母（J 被合并，无 9）
    var pos = {};
    for (var k = 0; k < grid.length; k++) pos[grid[k]] = k;
    return { grid: grid, pos: pos };
  }

  /* 加密一对明文（返回密文字母对，两个字母索引）；dir=1 加密 / dir=-1 解密 */
  function transformPair(g, a, b, dir) {
    var pa = g.pos[a], pb = g.pos[b];
    var ra = Math.floor(pa / 5), ca = pa % 5;
    var rb = Math.floor(pb / 5), cb = pb % 5;
    var out = [0, 0];
    if (ra === rb) {
      out[0] = g.grid[ra * 5 + ((ca + dir + 5) % 5)];
      out[1] = g.grid[rb * 5 + ((cb + dir + 5) % 5)];
    } else if (ca === cb) {
      out[0] = g.grid[(((ra + dir + 5) % 5)) * 5 + ca];
      out[1] = g.grid[(((rb + dir + 5) % 5)) * 5 + cb];
    } else {
      out[0] = g.grid[ra * 5 + cb];
      out[1] = g.grid[rb * 5 + ca];
    }
    return out;
  }

  /* 明文 → 字母对列表（处理同对相同字母插 X、奇数补 X） */
  function pairsFromText(text) {
    var letters = [];
    var t = text.toUpperCase().replace(/[^A-Z]/g, '');
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i) - 65;
      if (c === 9) c = 8;
      letters.push(c);
    }
    var pairs = [];
    var i2 = 0;
    while (i2 < letters.length) {
      var a = letters[i2];
      var b = (i2 + 1 < letters.length) ? letters[i2 + 1] : -1;
      if (b === -1) { pairs.push([a, 23]); i2 += 1; }           // 补 X
      else if (a === b) { pairs.push([a, 23]); i2 += 1; }       // 插 X
      else { pairs.push([a, b]); i2 += 2; }
    }
    return pairs;
  }

  /* 密文 → 字母对列表（直接两两，无填充处理——密文本身是成对的） */
  function pairsFromCipher(text) {
    var t = text.toUpperCase().replace(/[^A-Z]/g, '');
    var pairs = [];
    for (var i = 0; i + 1 < t.length; i += 2) {
      var a = t.charCodeAt(i) - 65, b = t.charCodeAt(i + 1) - 65;
      if (a === 9) a = 8; if (b === 9) b = 8;
      pairs.push([a, b]);
    }
    return pairs;
  }

  function encText(g, text) {
    var pairs = pairsFromText(text);
    var out = '';
    pairs.forEach(function (p) {
      var r = transformPair(g, p[0], p[1], 1);
      out += A[r[0]] + A[r[1]];
    });
    return out;
  }

  function decText(g, text) {
    var pairs = pairsFromCipher(text);
    var out = '';
    pairs.forEach(function (p) {
      var r = transformPair(g, p[0], p[1], -1);
      out += A[r[0]] + A[r[1]];
    });
    return out;
  }

  /* ---------- 挑战关卡 ----------
     keyword: 完整密钥词；mask: 需要玩家填的字母位置（下标数组，如 [2,3] 表示密钥词第 2、3 位未知）
     cipher: 密文；hint: 提示 */
  var LEVELS = [
    {
      keyword: 'PLAYFAIR', mask: [4], cipher: 'IMRSIM', plain: 'DECODE',
      hint: T('gs.playfair.lv1Hint')
    },
    {
      keyword: 'ENIGMA', mask: [1, 3], cipher: 'LCHKNQ', plain: 'CIPHER',
      hint: T('gs.playfair.lv2Hint')
    },
    {
      keyword: 'VICTORY', mask: [2, 4, 6], cipher: 'VLVAHV', plain: 'SECRET',
      hint: T('gs.playfair.lv3Hint')
    }
  ];

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="pf-tabs">' +
    '  <button class="btn pf-tab mode-btn selected" data-mode="free">' + T('gs.playfair.modeFree') + '</button>' +
    '  <button class="btn pf-tab mode-btn" data-mode="challenge">' + T('gs.playfair.modeChal') + '</button>' +
    '</div>';
  var keyHtml =
    '<div class="pf-keyrow">' +
    '  <input class="pf-keyinput" id="pf-key" maxlength="12" placeholder="' + T('gs.playfair.keyPh') + '" aria-label="' + T('gs.playfair.keyAria') + '" value="PLAYFAIR">' +
    '  <button class="btn purple" id="pf-keybtn">' + T('gs.playfair.buildGrid') + '</button>' +
    '</div>';
  var gridHtml = '<div class="pf-grid" id="pf-grid"></div>';

  var freeHtml =
    '<div class="pf-info"><span>' + T('gs.playfair.plainLbl') + '</span><span>' + T('gs.playfair.cipherLbl') + '</span></div>' +
    '<input class="pf-input" id="pf-in" maxlength="40" placeholder="' + T('gs.playfair.inPh') + '" aria-label="' + T('gs.playfair.inAria') + '">' +
    '<div class="pf-info"><span>' + T('gs.playfair.encOut') + '</span></div>' +
    '<div class="pf-output" id="pf-out" aria-live="polite">' + T('gs.playfair.waiting') + '</div>' +
    '<p class="help-text">' + T('gs.playfair.helpText') + '</p>';

  var challengeHtml =
    '<div class="pf-info">' +
    '  <span>' + T('gs.playfair.levelLbl') + ' <span class="stat-value" id="pf-level">1</span>/3</span>' +
    '  <span>' + T('gs.playfair.timeLbl') + ' <span class="stat-value" id="pf-timer">0s</span></span>' +
    '</div>' +
    '<div class="pf-msg" id="pf-msg"></div>' +
    '<div class="vg-label">' + T('gs.playfair.cipherLbl') + '</div>' +
    '<div class="pf-chal-cipher" id="pf-cipher"></div>' +
    '<div class="pf-pair-row" id="pf-slots"></div>' +
    '<div class="pf-info"><span>' + T('gs.playfair.guessLbl') + '</span></div>' +
    '<div class="pf-keyrow">' +
    '  <input class="pf-chal-input" id="pf-guess" maxlength="3" aria-label="' + T('gs.playfair.guessAria') + '" placeholder="' + T('gs.playfair.guessPh') + '">' +
    '  <button class="btn green" id="pf-try">' + T('gs.playfair.decryptBtn') + '</button>' +
    '</div>' +
    '<div class="pf-feedback" id="pf-feedback" style="font-family:var(--font-pixel);font-size:13px;color:var(--neon-yellow);text-shadow:0 0 8px rgba(255,230,0,.5);min-height:20px;margin:8px 0"></div>';

  root.innerHTML = tabsHtml + keyHtml + gridHtml + '<div id="pf-body">' + freeHtml + '</div>';

  var freeMode = true;
  var levelIdx = 0;
  var grid = null;
  var timerTick = null;
  var challengeStart = 0;

  var keyInput = document.getElementById('pf-key');
  var keyBtn = document.getElementById('pf-keybtn');
  var gridEl = document.getElementById('pf-grid');
  var bodyEl = document.getElementById('pf-body');

  /* ---------- 方阵渲染 ---------- */
  function renderGrid(g) {
    gridEl.innerHTML = '';
    for (var i = 0; i < 25; i++) {
      var d = document.createElement('div');
      d.className = 'pf-cell';
      d.textContent = A[g.grid[i]];
      gridEl.appendChild(d);
    }
  }

  function rebuild() {
    grid = buildGrid(keyInput.value);
    renderGrid(grid);
    if (freeMode) runFreeTransform();
  }

  /* ---------- 自由模式 ---------- */
  function runFreeTransform() {
    if (freeMode) {
      var input = document.getElementById('pf-in');
      var out = document.getElementById('pf-out');
      if (!input || !out) return;
      var v = input.value.toUpperCase().replace(/[^A-Za-z]/g, '');
      if (v !== input.value.replace(/[^A-Za-z]/g, '')) input.value = v;
      if (!v) { out.textContent = T('gs.playfair.waiting'); return; }
      out.textContent = encText(grid, v);
    }
  }

  /* ---------- 挑战模式 ---------- */
  function startLevel() {
    var lv = LEVELS[levelIdx];
    var msgEl = document.getElementById('pf-msg');
    var cipherEl = document.getElementById('pf-cipher');
    var slotsEl = document.getElementById('pf-slots');
    var guessEl = document.getElementById('pf-guess');
    var feedbackEl = document.getElementById('pf-feedback');
    var levelEl = document.getElementById('pf-level');
    var timerEl = document.getElementById('pf-timer');

    // 展示密文与已知/缺失密钥
    msgEl.textContent = lv.hint;
    msgEl.style.color = 'var(--neon-pink)';
    cipherEl.textContent = lv.cipher;
    guessEl.value = '';
    feedbackEl.textContent = '';
    levelEl.textContent = (levelIdx + 1) + '/3';
    timerEl.textContent = '0s';

    // 密钥占位展示：已知字母 + _ 缺失位
    var shown = '';
    for (var i = 0; i < lv.keyword.length; i++) {
      shown += lv.mask.indexOf(i) >= 0 ? '·' : lv.keyword[i];
    }
    slotsEl.innerHTML = '';
    var tag = document.createElement('div');
    tag.className = 'pf-pair-slot';
    tag.style.width = 'auto';
    tag.style.padding = '0 10px';
    tag.textContent = T('gs.playfair.keyLabel').replace('{s}', shown);
    slotsEl.appendChild(tag);

    challengeStart = Date.now();
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(function () {
      timerEl.textContent = elapsed() + 's';
    }, 500);
  }

  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }

  function doTry() {
    var lv = LEVELS[levelIdx];
    var guessEl = document.getElementById('pf-guess');
    var feedbackEl = document.getElementById('pf-feedback');
    // 用当前密钥词 + 玩家补全的字母构造完整密钥
    var guess = guessEl.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (guess.length !== lv.mask.length) {
      feedbackEl.textContent = T('gs.playfair.needLetters').replace('{n}', lv.mask.length).replace('{m}', guess.length);
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    var kw = lv.keyword.split('');
    for (var i = 0; i < lv.mask.length; i++) kw[lv.mask[i]] = guess[i];
    var g = buildGrid(kw.join(''));
    var plain = decText(g, lv.cipher);
    // 去末尾填充 X 后与目标明文比较
    var target = lv.plain.replace(/X/g, '');
    var got = plain.replace(/X$/, '').replace(/X/g, '');
    var ok = got === target;
    feedbackEl.textContent = ok
      ? T('gs.playfair.success').replace('{p}', plain).replace('{n}', elapsed())
      : T('gs.playfair.mismatch').replace('{p}', plain).replace('{t}', target);
    if (ok) {
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      setTimeout(function () {
        if (freeMode) return; /* 模式切换守卫（E2E 评审修复：原引用未定义变量 mode） */
        if (levelIdx < LEVELS.length - 1) {
          levelIdx++;
          startLevel();
          if (Arcade.ui) Arcade.ui.toast(T('gs.playfair.nextLevel').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.playfair.allClear'), 'win');
          levelIdx = 0;
          startLevel();
        }
      }, 900);
    } else {
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.fx) Arcade.fx.shake(document.getElementById('pf-guess'));
    }
  }

  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }

  function setMode(mode) {
    freeMode = mode === 'free';
    stopTimer();
    var tabs = root.querySelectorAll('.pf-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === mode);
    if (freeMode) {
      bodyEl.innerHTML = freeHtml;
      keyInput.value = 'PLAYFAIR';
      grid = buildGrid('PLAYFAIR');
      renderGrid(grid);
      document.getElementById('pf-in').addEventListener('input', runFreeTransform);
      runFreeTransform();
    } else {
      bodyEl.innerHTML = challengeHtml;
      document.getElementById('pf-try').addEventListener('click', function () { doTry(); });
      document.getElementById('pf-guess').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doTry();
      });
      levelIdx = 0;
      startLevel();
    }
  }

  /* ---------- 事件 ---------- */
  var tabs = root.querySelectorAll('.pf-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }
  keyBtn.addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    rebuild();
  });
  keyInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') rebuild(); });

  // 初始化
  grid = buildGrid('PLAYFAIR');
  renderGrid(grid);
  document.getElementById('pf-in').addEventListener('input', runFreeTransform);
  runFreeTransform();

  /* ---------- 重开 ---------- */
  window.GAME_RESTART = function () {
    stopTimer();
    freeMode = true;
    var tabs = root.querySelectorAll('.pf-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'free');
    bodyEl.innerHTML = freeHtml;
    keyInput = document.getElementById('pf-key');
    keyInput.value = 'PLAYFAIR';
    grid = buildGrid('PLAYFAIR');
    renderGrid(grid);
    document.getElementById('pf-in').addEventListener('input', runFreeTransform);
    runFreeTransform();
  };


})();
