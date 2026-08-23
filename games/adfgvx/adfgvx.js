/* ============================================================
   ADFGVX 密码机 · 一战德军双层密码（旗舰级）
   第一步（Polybius 替换）：26 字母 + 10 数字填入 6×6 方阵，
     每个明文字母 -> 两个符号（行/列，取自 A D F G V X 六个字母）
   第二步（列换位）：把符号对写入密钥长度的列，按密钥字母顺序
     逐列读出，得到最终密文
   解密：逆过程（按密钥列序填回 → Polybius 反查）
   三模式：
   - 演练：任意密钥，输入明/密文即时变换
   - 破译挑战：给密文 + 密钥，还原明文
   记分：挑战通关用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.adfgvx.tut1t'), d: T('gs.adfgvx.tut1') },
  { t: T('gs.adfgvx.tut2t'), d: T('gs.adfgvx.tut2') },
  { t: T('gs.adfgvx.tut3t'), d: T('gs.adfgvx.tut3') }
];

(function () {
  var SYMS = 'ADFGVX';
  var A26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ---------- 方阵：密钥词打头 + 剩余 A-Z0-9 补齐 36 格 ---------- */
  function buildTable(keyword) {
    var seen = {}, seq = [];
    var kw = (keyword || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < kw.length; i++) {
      var ch = kw[i];
      if (!seen[ch]) { seen[ch] = true; seq.push(ch); }
    }
    var all = A26 + '0123456789';
    for (var j = 0; j < all.length; j++) {
      var c = all[j];
      if (!seen[c]) { seen[c] = true; seq.push(c); }
    }
    return seq; // 36 格
  }

  /* Polybius 替换：明文 -> ADFGVX 符号串 */
  function polybiusEnc(table, text) {
    var out = '';
    var t = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < t.length; i++) {
      var p = table.indexOf(t[i]);
      if (p < 0) continue;
      out += SYMS[Math.floor(p / 6)] + SYMS[p % 6];
    }
    return out;
  }

  /* Polybius 逆替换：ADFGVX 符号串 -> 明文 */
  function polybiusDec(table, syms) {
    var out = '';
    for (var i = 0; i + 1 < syms.length; i += 2) {
      var r = SYMS.indexOf(syms[i]), c = SYMS.indexOf(syms[i + 1]);
      if (r < 0 || c < 0) continue;
      out += table[r * 6 + c];
    }
    return out;
  }

  /* 列换位加密：把符号串按密钥长度分列（列数=密钥长度），按密钥字母序逐列读出 */
  function transEnc(syms, key) {
    var cols = key.length;
    var rows = Math.ceil(syms.length / cols);
    var grid2 = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        row.push(i < syms.length ? syms[i] : '');
      }
      grid2.push(row);
    }
    // 列顺序：按密钥字母排序（稳定）
    var colOrder = [];
    for (var j = 0; j < cols; j++) colOrder.push(j);
    colOrder.sort(function (a, b) {
      var ca = key[a], cb = key[b];
      return ca < cb ? -1 : (ca > cb ? 1 : a - b);
    });
    var out = '';
    for (var k = 0; k < colOrder.length; k++) {
      var cidx = colOrder[k];
      for (var rr = 0; rr < rows; rr++) {
        var v = grid2[rr][cidx];
        if (v) out += v;
      }
    }
    return { out: out, colOrder: colOrder, rows: rows };
  }

  /* 列换位解密：按密钥列序把密文填回各列，再按行读出 */
  function transDec(syms, key) {
    var cols = key.length;
    var rows = Math.ceil(syms.length / cols);
    var colOrder = [];
    for (var j = 0; j < cols; j++) colOrder.push(j);
    colOrder.sort(function (a, b) {
      var ca = key[a], cb = key[b];
      return ca < cb ? -1 : (ca > cb ? 1 : a - b);
    });
    // 每列长度：矩阵按行写入，最后一行只填到第 extra-1 列
    // 因此原始列 0..extra-1 有 rows 个，extra..cols-1 有 rows-1 个（与排序无关）
    var colLens = [];
    var base = Math.floor(syms.length / cols);
    var extra = syms.length % cols;
    for (var c = 0; c < cols; c++) {
      colLens[c] = base + (c < extra ? 1 : 0);
    }
    var grid2 = [];
    for (var r = 0; r < rows; r++) grid2.push(new Array(cols).fill(''));
    var p = 0;
    for (var k = 0; k < colOrder.length; k++) {
      var cidx = colOrder[k];
      for (var rr = 0; rr < colLens[cidx]; rr++) grid2[rr][cidx] = syms[p++];
    }
    var out = '';
    for (var rr2 = 0; rr2 < rows; rr2++) {
      for (var cc = 0; cc < cols; cc++) {
        if (grid2[rr2][cc]) out += grid2[rr2][cc];
      }
    }
    return out;
  }

  function encFull(text, key) {
    var syms = polybiusEnc(buildTable(key), text);
    return transEnc(syms, key).out;
  }
  function decFull(syms, key) {
    var t = transDec(syms, key);
    return polybiusDec(buildTable(key), t);
  }

  /* ---------- 挑战关卡 ---------- */
  var LEVELS = [
    {
      key: 'RAILWAY', plain: 'STORM FRONT', hint: T('gs.adfgvx.lv1Hint')
    },
    {
      key: 'KAISER', plain: 'NIGHT RAID', hint: T('gs.adfgvx.lv2Hint')
    },
    {
      key: 'BLITZKRIEG', plain: 'AIRBORNE UNIT', hint: T('gs.adfgvx.lv3Hint')
    }
  ];

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="ad-tabs">' +
    '  <button class="btn ad-tab mode-btn selected" data-mode="free">' + T('gs.adfgvx.modeFree') + '</button>' +
    '  <button class="btn ad-tab mode-btn" data-mode="chal">' + T('gs.adfgvx.modeChal') + '</button>' +
    '</div>';
  var keyHtml =
    '<div class="ad-keyrow">' +
    '  <input class="ad-keyinput" id="ad-key" maxlength="12" placeholder="' + T('gs.adfgvx.keyPh') + '" aria-label="' + T('gs.adfgvx.keyAria') + '" value="RAILWAY">' +
    '  <button class="btn purple" id="ad-keybtn">' + T('gs.adfgvx.buildGrid') + '</button>' +
    '</div>';
  var gridHtml = '<div class="ad-grid" id="ad-grid"></div>';

  var freeHtml =
    '<div class="ad-info"><span>' + T('gs.adfgvx.plainCipher') + '</span><span>' + T('gs.adfgvx.transformOut') + '</span></div>' +
    '<input class="ad-input" id="ad-in" maxlength="40" placeholder="' + T('gs.adfgvx.inPh') + '" aria-label="' + T('gs.adfgvx.inAria') + '">' +
    '<div class="ad-output" id="ad-out" aria-live="polite">' + T('gs.adfgvx.waiting') + '</div>' +
    '<p class="help-text">' + T('gs.adfgvx.helpText') + '</p>';

  var chalHtml =
    '<div class="ad-info">' +
    '  <span>' + T('gs.adfgvx.levelLbl') + ' <span class="stat-value" id="ad-level">1</span>/3</span>' +
    '  <span>' + T('gs.adfgvx.timeLbl') + ' <span class="stat-value" id="ad-timer">0s</span></span>' +
    '</div>' +
    '<div class="ad-msg" id="ad-msg"></div>' +
    '<div class="vg-label">' + T('gs.adfgvx.cipherLbl') + '</div>' +
    '<div class="ad-cipher" id="ad-cipher"></div>' +
    '<div class="ad-hint" id="ad-hint"></div>' +
    '<div class="ad-info"><span>' + T('gs.adfgvx.answerLbl') + '</span></div>' +
    '<input class="ad-chalinput" id="ad-answer" maxlength="20" placeholder="' + T('gs.adfgvx.answerPh') + '" aria-label="' + T('gs.adfgvx.inAria') + '">' +
    '<div class="game-controls"><button class="btn green" id="ad-go">' + T('gs.adfgvx.submit') + '</button></div>';

  root.innerHTML = tabsHtml + keyHtml + gridHtml + '<div id="ad-body">' + freeHtml + '</div>';

  var freeMode = true;
  var levelIdx = 0;
  var table = buildTable('RAILWAY');
  var timerTick = null;
  var challengeStart = 0;

  var keyInput = document.getElementById('ad-key');
  var keyBtn = document.getElementById('ad-keybtn');
  var gridEl = document.getElementById('ad-grid');
  var bodyEl = document.getElementById('ad-body');

  function renderGrid(t) {
    gridEl.innerHTML = '';
    // 表头行
    var h = document.createElement('div');
    h.className = 'ad-cell head';
    h.textContent = '';
    gridEl.appendChild(h);
    for (var c = 0; c < 6; c++) {
      var hc = document.createElement('div');
      hc.className = 'ad-cell head';
      hc.textContent = SYMS[c];
      gridEl.appendChild(hc);
    }
    for (var r = 0; r < 6; r++) {
      var hr = document.createElement('div');
      hr.className = 'ad-cell head';
      hr.textContent = SYMS[r];
      gridEl.appendChild(hr);
      for (var c2 = 0; c2 < 6; c2++) {
        var d = document.createElement('div');
        d.className = 'ad-cell';
        d.textContent = t[r * 6 + c2];
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
    var input = document.getElementById('ad-in');
    var out = document.getElementById('ad-out');
    if (!input || !out) return;
    var v = input.value.toUpperCase().replace(/[^A-Za-z0-9]/g, '');
    if (v !== input.value.replace(/[^A-Za-z0-9]/g, '')) input.value = v;
    if (!v) { out.textContent = T('gs.adfgvx.waiting'); return; }
    out.textContent = encFull(v, keyInput.value || 'KEY');
  }

  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }

  function startChal() {
    var lv = LEVELS[levelIdx];
    var key = lv.key;
    var cipher = encFull(lv.plain, key);
    document.getElementById('ad-msg').textContent = T('gs.adfgvx.levelMsg').replace('{n}', levelIdx + 1);
    document.getElementById('ad-cipher').textContent = cipher;
    document.getElementById('ad-hint').innerHTML = '💡 ' + lv.hint + '<br>' + T('gs.adfgvx.keyLabel') + ' <b>' + key + '</b>';
    document.getElementById('ad-answer').value = '';
    document.getElementById('ad-level').textContent = (levelIdx + 1) + '/3';
    document.getElementById('ad-timer').textContent = '0s';
    // 屏上 6×6 方阵按本关密钥重建（修复：此前常驻自由模式默认 RAILWAY 表，第 2/3 关照表手工解码得错误明文）
    table = buildTable(key);
    renderGrid(table);
    challengeStart = Date.now();
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(function () {
      var el = document.getElementById('ad-timer');
      if (el) el.textContent = elapsed() + 's';
    }, 500);
  }

  function submit() {
    var lv = LEVELS[levelIdx];
    var v = document.getElementById('ad-answer').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    var target = lv.plain.replace(/[^A-Z0-9]/g, '');
    if (v === target) {
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      document.getElementById('ad-msg').textContent = T('gs.adfgvx.success').replace('{n}', elapsed());
      setTimeout(function () {
        if (freeMode) return; // 模式切换守卫（防对已销毁 DOM 操作）
        if (levelIdx < LEVELS.length - 1) {
          levelIdx++;
          startChal();
          if (Arcade.ui) Arcade.ui.toast(T('gs.adfgvx.nextLevel').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.adfgvx.allClear'), 'win');
          levelIdx = 0;
          startChal();
        }
      }, 900);
    } else {
      document.getElementById('ad-msg').textContent = T('gs.adfgvx.fail');
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.fx) Arcade.fx.shake(document.getElementById('ad-answer'));
    }
  }

  function setMode(mode) {
    freeMode = mode === 'free';
    stopTimer();
    var tabs = root.querySelectorAll('.ad-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === mode);
    if (freeMode) {
      bodyEl.innerHTML = freeHtml;
      keyInput = document.getElementById('ad-key');
      keyInput.value = 'RAILWAY';
      table = buildTable('RAILWAY');
      renderGrid(table);
      document.getElementById('ad-in').addEventListener('input', runFreeTransform);
      runFreeTransform();
    } else {
      bodyEl.innerHTML = chalHtml;
      document.getElementById('ad-go').addEventListener('click', submit);
      document.getElementById('ad-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      levelIdx = 0;
      startChal();
    }
  }

  var tabs = root.querySelectorAll('.ad-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }
  keyBtn.addEventListener('click', function () { if (Arcade.audio) Arcade.audio.play('ui'); rebuild(); });
  keyInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') rebuild(); });

  renderGrid(table);
  document.getElementById('ad-in').addEventListener('input', runFreeTransform);
  runFreeTransform();

  window.GAME_RESTART = function () {
    stopTimer();
    freeMode = true;
    var tabs = root.querySelectorAll('.ad-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'free');
    bodyEl.innerHTML = freeHtml;
    keyInput = document.getElementById('ad-key');
    keyInput.value = 'RAILWAY';
    table = buildTable('RAILWAY');
    renderGrid(table);
    document.getElementById('ad-in').addEventListener('input', runFreeTransform);
    runFreeTransform();
  };


})();
