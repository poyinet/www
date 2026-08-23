/* ============================================================
   Bifid 密码 · 法国军情双字谜（旗舰级）
   原理：5×5 波利比奥斯方格（密钥词 + I/J 合并）。
   加密：每个字母换成「行号+列号」，所有行号排一行、列号排一行，
         横向合并成新坐标对，查表得密文。
   解密：密文换坐标 → 拆成两半（前一半=行，后一半=列）→ 还原明文。
   三模式：
   - 演练：任意密钥，输入明/密文即时变换，观察行列重组
   - 破译挑战：3 关递进，给密文+密钥，还原明文
   - 每日一题：日期种子生成当日密文
   记分：挑战用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bifid.tut1t'), d: T('gs.bifid.tut1') },
  { t: T('gs.bifid.tut2t'), d: T('gs.bifid.tut2') },
  { t: T('gs.bifid.tut3t'), d: T('gs.bifid.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function idx(c) { return c.charCodeAt(0) - 65; }

  /* ---------- 5×5 方格（I/J 合并为 I） ---------- */
  function buildTable(keyword) {
    var seen = {}, seq = [];
    var kw = (keyword || '').toUpperCase().replace(/[^A-Z]/g, '');
    for (var i = 0; i < kw.length; i++) {
      var c = kw.charCodeAt(i) - 65;
      if (c === 9) c = 8;
      if (!seen[c]) { seen[c] = true; seq.push(c); }
    }
    for (var j = 0; j < 26; j++) {
      var L = j === 9 ? 8 : j;
      if (!seen[L]) { seen[L] = true; seq.push(L); }
    }
    return seq; // 25 格
  }

  /* 加密：明文 -> 行列分排 -> 横合并 -> 查表（奇数长度补 X） */
  function encText(keyword, text) {
    var table = buildTable(keyword);
    var t = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (t.length % 2 === 1) t += 'X'; // Bifid 加密要求偶数（补 X 保长度）
    var rows = [], cols = [];
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i) - 65;
      if (c === 9) c = 8;
      var p = table.indexOf(c);
      rows.push(Math.floor(p / 5));
      cols.push(p % 5);
    }
    var merged = rows.concat(cols);
    var out = '';
    for (var j = 0; j < t.length; j++) {
      var r = merged[j * 2], c2 = merged[j * 2 + 1];
      out += A[table[r * 5 + c2]];
    }
    return out;
  }

  /* 解密：密文 -> 坐标 -> 拆两半（行/列） -> 查表（去尾部填充 X） */
  function decText(keyword, text) {
    var table = buildTable(keyword);
    var t = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (t.length % 2 !== 0) return t;
    var coords = [];
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i) - 65;
      if (c === 9) c = 8;
      var p = table.indexOf(c);
      coords.push(Math.floor(p / 5), p % 5);
    }
    var half = coords.length / 2;
    var out = '';
    for (var j = 0; j < half; j++) {
      var r = coords[j], c2 = coords[half + j];
      out += A[table[r * 5 + c2]];
    }
    return out.replace(/X$/, '');
  }

  /* ---------- 挑战关卡 ---------- */
  var LEVELS = [
    {
      key: 'LYON', plain: 'CODE BREAK', hint: T('gs.bifid.lv1Hint')
    },
    {
      key: 'VICHY', plain: 'RESISTANCE', hint: T('gs.bifid.lv2Hint')
    },
    {
      key: 'PARIS', plain: 'FREE FRANCE', hint: T('gs.bifid.lv3Hint')
    }
  ];

  /* ---------- 每日一题 ---------- */
  var DAILY_WORDS = ['FREEFRANCE', 'IRONCURTAIN', 'NIGHTFALL', 'CODEMASTER', 'BERLINGROUP', 'SECRETFILE'];
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="bf-tabs">' +
    '  <button class="btn bf-tab mode-btn selected" data-mode="free">' + T('gs.bifid.modeFree') + '</button>' +
    '  <button class="btn bf-tab mode-btn" data-mode="chal">' + T('gs.bifid.modeChal') + '</button>' +
    '  <button class="btn bf-tab mode-btn" data-mode="daily">' + T('gs.bifid.modeDaily') + '</button>' +
    '</div>';
  var keyHtml =
    '<div class="bf-keyrow">' +
    '  <input class="bf-keyinput" id="bf-key" maxlength="12" placeholder="' + T('gs.bifid.keyPh') + '" aria-label="' + T('gs.bifid.keyAria') + '" value="LYON">' +
    '  <button class="btn purple" id="bf-keybtn">' + T('gs.bifid.buildGrid') + '</button>' +
    '</div>';
  var gridHtml = '<div class="bf-grid" id="bf-grid"></div>';

  var freeHtml =
    '<div class="bf-info"><span>' + T('gs.bifid.plainLbl') + '</span><span>' + T('gs.bifid.cipherLbl') + '</span></div>' +
    '<input class="bf-input" id="bf-in" maxlength="40" placeholder="' + T('gs.bifid.inPh') + '" aria-label="' + T('gs.bifid.inAria') + '">' +
    '<div class="bf-info"><span>' + T('gs.bifid.encOut') + '</span></div>' +
    '<div class="bf-output" id="bf-out" aria-live="polite">' + T('gs.bifid.waiting') + '</div>' +
    '<p class="help-text">' + T('gs.bifid.helpText') + '</p>';

  var chalHtml =
    '<div class="bf-info">' +
    '  <span>' + T('gs.bifid.levelLbl') + ' <span class="stat-value" id="bf-level">1</span>/3</span>' +
    '  <span>' + T('gs.bifid.timeLbl') + ' <span class="stat-value" id="bf-timer">0s</span></span>' +
    '</div>' +
    '<div class="bf-msg" id="bf-msg"></div>' +
    '<div class="vg-label">' + T('gs.bifid.cipherLbl') + '</div>' +
    '<div class="bf-cipher" id="bf-cipher"></div>' +
    '<div class="bf-hint" id="bf-hint"></div>' +
    '<div class="bf-info"><span>' + T('gs.bifid.answerLbl') + '</span></div>' +
    '<input class="bf-chalinput" id="bf-answer" maxlength="20" placeholder="' + T('gs.bifid.answerPh') + '" aria-label="' + T('gs.bifid.inAria') + '">' +
    '<div class="game-controls"><button class="btn green" id="bf-go">' + T('gs.bifid.submit') + '</button></div>';

  var dailyHtml =
    '<div class="bf-info">' +
    '  <span>' + T('gs.bifid.dailyLbl') + ' · <span class="stat-value" id="bf-ddate"></span></span>' +
    '  <span>' + T('gs.bifid.timeLbl') + ' <span class="stat-value" id="bf-dtimer">0s</span></span>' +
    '</div>' +
    '<div class="bf-msg" id="bf-dmsg"></div>' +
    '<div class="vg-label">' + T('gs.bifid.dailyCipherLbl') + '</div>' +
    '<div class="bf-cipher" id="bf-dcipher"></div>' +
    '<div class="bf-hint" id="bf-dhint"></div>' +
    '<div class="bf-info"><span>' + T('gs.bifid.answerLbl') + '</span></div>' +
    '<input class="bf-chalinput" id="bf-danswer" maxlength="20" placeholder="' + T('gs.bifid.answerPh') + '" aria-label="' + T('gs.bifid.inAria') + '">' +
    '<div class="game-controls"><button class="btn green" id="bf-dgo">' + T('gs.bifid.submit') + '</button></div>';

  root.innerHTML = tabsHtml + keyHtml + gridHtml + '<div id="bf-body">' + freeHtml + '</div>';

  var freeMode = true;
  var levelIdx = 0;
  var table = buildTable('LYON');
  var timerTick = null;
  var challengeStart = 0;
  var daily = { key: 'PARIS', plain: '', cipher: '' };

  var keyInput = document.getElementById('bf-key');
  var keyBtn = document.getElementById('bf-keybtn');
  var gridEl = document.getElementById('bf-grid');
  var bodyEl = document.getElementById('bf-body');

  function renderGrid(t) {
    gridEl.innerHTML = '';
    // 表头行：列号
    var h0 = document.createElement('div');
    h0.className = 'bf-cell head';
    h0.innerHTML = '<div class="ch"></div><div class="num"></div>';
    gridEl.appendChild(h0);
    for (var c = 1; c <= 5; c++) {
      var hc = document.createElement('div');
      hc.className = 'bf-cell head';
      hc.innerHTML = '<div class="ch"></div><div class="num">' + c + '</div>';
      gridEl.appendChild(hc);
    }
    for (var r = 0; r < 5; r++) {
      var hr = document.createElement('div');
      hr.className = 'bf-cell head';
      hr.innerHTML = '<div class="ch"></div><div class="num">' + (r + 1) + '</div>';
      gridEl.appendChild(hr);
      for (var c2 = 0; c2 < 5; c2++) {
        var d = document.createElement('div');
        d.className = 'bf-cell';
        d.innerHTML = '<div class="ch">' + A[t[r * 5 + c2]] + '</div><div class="num">' + (r + 1) + ',' + (c2 + 1) + '</div>';
        gridEl.appendChild(d);
      }
    }
  }

  function rebuild() {
    table = buildTable(keyInput.value);
    renderGrid(table);
    if (freeMode) runFreeTransform();
  }

  function runFreeTransform() {
    var input = document.getElementById('bf-in');
    var out = document.getElementById('bf-out');
    if (!input || !out) return;
    var v = input.value.toUpperCase().replace(/[^A-Za-z]/g, '');
    if (v !== input.value.replace(/[^A-Za-z]/g, '')) input.value = v;
    if (!v) { out.textContent = T('gs.bifid.waiting'); return; }
    out.textContent = encText(keyInput.value || 'KEY', v);
  }

  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }
  function startTimer(elId) {
    challengeStart = Date.now();
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(function () {
      var el = document.getElementById(elId);
      if (el) el.textContent = elapsed() + 's';
    }, 500);
  }

  function startChal() {
    var lv = LEVELS[levelIdx];
    var cipher = encText(lv.key, lv.plain);
    document.getElementById('bf-msg').textContent = T('gs.bifid.levelMsg').replace('{n}', levelIdx + 1);
    document.getElementById('bf-cipher').textContent = cipher;
    document.getElementById('bf-hint').innerHTML = '💡 ' + lv.hint + '<br>' + T('gs.bifid.keyLabel') + ' <b>' + lv.key + '</b>';
    document.getElementById('bf-answer').value = '';
    document.getElementById('bf-level').textContent = (levelIdx + 1) + '/3';
    startTimer('bf-timer');
  }

  function chalSubmit() {
    var lv = LEVELS[levelIdx];
    var v = document.getElementById('bf-answer').value.toUpperCase().replace(/[^A-Z]/g, '');
    var target = lv.plain.replace(/[^A-Z]/g, '');
    if (v === target) {
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      document.getElementById('bf-msg').textContent = T('gs.bifid.success').replace('{n}', elapsed());
      setTimeout(function () {
        if (levelIdx < LEVELS.length - 1) {
          levelIdx++;
          startChal();
          if (Arcade.ui) Arcade.ui.toast(T('gs.bifid.nextLevel').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.bifid.allClear'), 'win');
          levelIdx = 0;
          startChal();
        }
      }, 900);
    } else {
      document.getElementById('bf-msg').textContent = T('gs.bifid.fail');
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.fx) Arcade.fx.shake(document.getElementById('bf-answer'));
    }
  }

  /* ---------- 每日一题 ---------- */
  function startDaily() {
    var rnd = mulberry32(todaySeed());
    daily.key = ['LYON', 'VICHY', 'PARIS', 'TOURS'][Math.floor(rnd() * 4)];
    daily.plain = DAILY_WORDS[Math.floor(rnd() * DAILY_WORDS.length)];
    daily.cipher = encText(daily.key, daily.plain);
    var d = new Date();
    document.getElementById('bf-ddate').textContent = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    document.getElementById('bf-dmsg').textContent = T('gs.bifid.dailyKey').replace('{k}', daily.key);
    document.getElementById('bf-dcipher').textContent = daily.cipher;
    document.getElementById('bf-dhint').innerHTML = T('gs.bifid.dailyHint').replace('{k}', daily.key).replace('{n}', daily.plain.length);
    document.getElementById('bf-danswer').value = '';
    startTimer('bf-dtimer');
  }

  function dailySubmit() {
    var v = document.getElementById('bf-danswer').value.toUpperCase().replace(/[^A-Z]/g, '');
    if (v === daily.plain) {
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      if (Arcade.daily) Arcade.daily.markSolved('bifid', elapsed());
      document.getElementById('bf-dmsg').textContent = T('gs.bifid.dailySuccess').replace('{n}', elapsed());
      document.getElementById('bf-dmsg').style.color = 'var(--neon-green)';
    } else {
      document.getElementById('bf-dmsg').textContent = T('gs.bifid.dailyFail');
      document.getElementById('bf-dmsg').style.color = '';
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.fx) Arcade.fx.shake(document.getElementById('bf-danswer'));
    }
  }

  /* ---------- 模式切换 ---------- */
  function setMode(mode) {
    freeMode = mode === 'free';
    stopTimer();
    var tabs = root.querySelectorAll('.bf-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === mode);
    if (freeMode) {
      bodyEl.innerHTML = freeHtml;
      keyInput = document.getElementById('bf-key');
      keyInput.value = 'LYON';
      table = buildTable('LYON');
      renderGrid(table);
      document.getElementById('bf-in').addEventListener('input', runFreeTransform);
      runFreeTransform();
    } else if (mode === 'chal') {
      bodyEl.innerHTML = chalHtml;
      document.getElementById('bf-go').addEventListener('click', chalSubmit);
      document.getElementById('bf-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') chalSubmit(); });
      levelIdx = 0;
      startChal();
    } else {
      bodyEl.innerHTML = dailyHtml;
      document.getElementById('bf-dgo').addEventListener('click', dailySubmit);
      document.getElementById('bf-danswer').addEventListener('keydown', function (e) { if (e.key === 'Enter') dailySubmit(); });
      startDaily();
    }
  }

  var tabs = root.querySelectorAll('.bf-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }
  keyBtn.addEventListener('click', function () { if (Arcade.audio) Arcade.audio.play('ui'); rebuild(); });
  keyInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') rebuild(); });

  renderGrid(table);
  document.getElementById('bf-in').addEventListener('input', runFreeTransform);
  runFreeTransform();

  window.GAME_RESTART = function () {
    stopTimer();
    freeMode = true;
    var tabs = root.querySelectorAll('.bf-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'free');
    bodyEl.innerHTML = freeHtml;
    keyInput = document.getElementById('bf-key');
    keyInput.value = 'LYON';
    table = buildTable('LYON');
    renderGrid(table);
    document.getElementById('bf-in').addEventListener('input', runFreeTransform);
    runFreeTransform();
  };


})();
