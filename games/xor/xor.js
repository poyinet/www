/* ============================================================
   异或破译 XOR · 现代密码学方向（旗舰级）
   原理：明文 P 与密钥 K 逐字节异或得密文 C = P ⊕ K；解密同式。
   三种玩法：
   - 演练：给明文 → 自动生成密文；玩家输入密钥还原（学原理）
   - 破译挑战（已知密钥）：给密文 + 密钥，还原 ASCII 电文
   - 密文分析（找密钥）：给密文 + 密钥长度，逐字节猜测密钥
     恢复可读文本（反馈每字节是否可打印/常见字母）
   记分：挑战用时（秒，min 模式）
   ============================================================ */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.xor.tut1t'), d: T('gs.xor.tut1') },
  { t: T('gs.xor.tut2t'), d: T('gs.xor.tut2') },
  { t: T('gs.xor.tut3t'), d: T('gs.xor.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ---------- 核心运算 ---------- */
  function hexToBytes(hex) {
    var h = hex.replace(/[^0-9a-fA-F]/g, '');
    var out = [];
    for (var i = 0; i + 1 < h.length; i += 2) out.push(parseInt(h.substr(i, 2), 16));
    return out;
  }
  function bytesToHex(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i].toString(16).toUpperCase();
      if (b.length === 1) b = '0' + b;
      s += b;
    }
    return s;
  }
  function strToBytes(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xFF);
    return out;
  }
  function bytesToStr(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }
  function xorBytes(a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i] ^ b[i % b.length]);
    return out;
  }
  function encHex(plain, key) { return bytesToHex(xorBytes(strToBytes(plain), strToBytes(key))); }

  /* 明文可读性评分：字母/数字/空格/常见标点得分，控制字符重罚
     英文电文的字符几乎都落在可打印区间且以字母为主，评分可区分正确/错误密钥字节 */
  function readability(byte) {
    if (byte >= 65 && byte <= 90) return 4;   // A-Z
    if (byte >= 97 && byte <= 122) return 4;  // a-z
    if (byte === 32) return 3;                 // 空格
    if (byte >= 48 && byte <= 57) return 2;    // 数字
    if (byte >= 33 && byte <= 126) return 1;   // 其他可打印（标点等）
    return -6;                                 // 控制字符
  }
  function scoreBytes(bytes) {
    var s = 0, n = bytes.length || 1;
    for (var i = 0; i < bytes.length; i++) s += readability(bytes[i]);
    return s / n; // 归一化：平均分
  }

  /* ---------- 挑战关卡 ----------
     plain: 目标明文；key: 密钥；hex: 预生成密文（十六进制） */
  var LEVELS = [
    {
      plain: 'NEON SIGNAL', key: 'XOR', 
      hex: '160A1D166F0111081C1903',
      hint: T('gs.xor.hint1')
    },
    {
      plain: 'SECRET CODE', key: 'PIXEL',
      hex: '030C1B170904691B0A0815',
      hint: T('gs.xor.hint2')
    },
    {
      plain: 'THE MACHINE LIES', key: 'ZODIAC',
      hex: '0E0701690C0219070D0704631606011A',
      hint: T('gs.xor.hint3')
    }
  ];

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="xr-tabs" style="display:flex;gap:8px;justify-content:center;margin-bottom:14px">' +
    '  <button class="btn mode-btn selected" data-mode="free">' + T('gs.xor.modeFree') + '</button>' +
    '  <button class="btn mode-btn" data-mode="chal">' + T('gs.xor.modeChal') + '</button>' +
    '  <button class="btn mode-btn" data-mode="anal">' + T('gs.xor.modeAnal') + '</button>' +
    '</div>';

  var freeHtml =
    '<div class="xr-info"><span>' + T('gs.xor.freePlain') + '</span><span>' + T('gs.xor.autoCipher') + '</span></div>' +
    '<input class="xr-key" id="xr-plain" maxlength="40" placeholder="' + T('gs.xor.phPlain') + '" aria-label="' + T('gs.xor.ariaPlain') + '">' +
    '<div class="xr-hex" id="xr-autohex" aria-live="polite">' + T('gs.xor.hexEmpty') + '</div>' +
    '<div class="xr-info"><span>' + T('gs.xor.freeKey') + '</span></div>' +
    '<input class="xr-key" id="xr-freekey" maxlength="12" placeholder="' + T('gs.xor.phKey') + '" aria-label="' + T('gs.xor.ariaKey') + '" value="XOR">' +
    '<div class="xr-info"><span>' + T('gs.xor.resultLbl') + '</span></div>' +
    '<div class="xr-out" id="xr-freeout" aria-live="polite">——</div>' +
    '<p class="help-text">' + T('gs.xor.freeHelp') + '</p>';

  var chalHtml =
    '<div class="xr-info">' +
    '  <span>' + T('gs.xor.chalLevel') + ' <span class="stat-value" id="xr-level">1</span>/3</span>' +
    '  <span>' + T('gs.xor.chalTime') + ' <span class="stat-value" id="xr-timer">0s</span></span>' +
    '</div>' +
    '<div class="xr-msg" id="xr-msg"></div>' +
    '<div class="vg-label">' + T('gs.xor.lblCipher') + '</div>' +
    '<div class="xr-chal" id="xr-cipher"></div>' +
    '<div class="xr-info"><span>' + T('gs.xor.chalKey') + '</span></div>' +
    '<div class="xr-info"><input class="xr-chal-input" id="xr-chalkey" maxlength="12" placeholder="' + T('gs.xor.chalKeyPh') + '" aria-label="' + T('gs.xor.ariaKey') + '"></div>' +
    '<div class="xr-info"><span>' + T('gs.xor.resultLbl') + '</span></div>' +
    '<div class="xr-out" id="xr-chalout" aria-live="polite">——</div>' +
    '<div class="game-controls"><button class="btn green" id="xr-go">' + T('gs.xor.decrypt') + '</button></div>';

  var analHtml =
    '<div class="xr-info"><span>' + T('gs.xor.analTitle') + '</span><span>' + T('gs.xor.analGoal') + '</span></div>' +
    '<div class="xr-msg" id="xr-amsg"></div>' +
    '<div class="vg-label">' + T('gs.xor.lblCipher') + '</div>' +
    '<div class="xr-chal" id="xr-ahex"></div>' +
    '<div class="xr-info"><span>' + T('gs.xor.analKeyLen') + ' <b id="xr-aklen">3</b> · ' + T('gs.xor.analDerived') + ' <b id="xr-aguessed" style="color:var(--neon-green)"></b></span></div>' +
    '<div class="xr-chal-row" id="xr-abytes"></div>' +
    '<div class="xr-info"><span>' + T('gs.xor.analGuessLbl') + '</span></div>' +
    '<div class="xr-info"><input class="xr-chal-input" id="xr-aguess" maxlength="12" placeholder="' + T('gs.xor.analGuessPh') + '" aria-label="' + T('gs.xor.analGuessAria') + '" style="width:180px"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="xr-aset">' + T('gs.xor.analSet') + '</button>' +
    '  <button class="btn purple" id="xr-aback">' + T('gs.xor.analReset') + '</button>' +
    '</div>' +
    '<div class="xr-info"><span>' + T('gs.xor.analPreview') + '</span></div>' +
    '<div class="xr-out" id="xr-apreview" aria-live="polite">——</div>' +
    '<p class="help-text">' + T('gs.xor.analHelp') + '</p>';

  root.innerHTML = tabsHtml + '<div id="xr-body">' + freeHtml + '</div>';

  var bodyEl = document.getElementById('xr-body');
  var freeMode = true, chalMode = false, analMode = false;
  var levelIdx = 0;
  var timerTick = null;
  var challengeStart = 0;
  var analBytes = [];     // 已猜密钥字节
  var analIdx = 0;        // 当前第几个字节
  var analHex = [];
  var analKeyLen = 3;

  /* ---------- 自由模式 ---------- */
  function runFree() {
    var plainEl = document.getElementById('xr-plain');
    var autoEl = document.getElementById('xr-autohex');
    var keyEl = document.getElementById('xr-freekey');
    var outEl = document.getElementById('xr-freeout');
    if (!plainEl) return;
    var p = plainEl.value.toUpperCase().replace(/[^A-Za-z0-9 !?.,'-]/g, '');
    if (p !== plainEl.value) plainEl.value = p;
    var k = keyEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (k !== keyEl.value) keyEl.value = k;
    if (!p) { autoEl.textContent = T('gs.xor.hexEmpty'); outEl.textContent = '——'; return; }
    autoEl.textContent = T('gs.xor.hexPrefix') + encHex(p, k || 'X');
    if (!k) { outEl.textContent = T('gs.xor.needKey'); return; }
    var dec = xorBytes(hexToBytes(encHex(p, k)), strToBytes(k));
    outEl.textContent = bytesToStr(dec);
  }

  /* ---------- 挑战模式 ---------- */
  function startChal() {
    var lv = LEVELS[levelIdx];
    document.getElementById('xr-msg').textContent = lv.hint;
    document.getElementById('xr-cipher').textContent = lv.hex;
    document.getElementById('xr-chalkey').value = '';
    document.getElementById('xr-chalout').textContent = T('gs.xor.chalWait');
    document.getElementById('xr-chalout').style.color = '';
    document.getElementById('xr-level').textContent = (levelIdx + 1) + '/3';
    document.getElementById('xr-timer').textContent = '0s';
    challengeStart = Date.now();
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(function () {
      document.getElementById('xr-timer').textContent = elapsed() + 's';
    }, 500);
  }

  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }

  function doChal() {
    var lv = LEVELS[levelIdx];
    var key = document.getElementById('xr-chalkey').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    var outEl = document.getElementById('xr-chalout');
    if (!key) {
      outEl.textContent = T('gs.xor.needKey');
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    var dec = xorBytes(hexToBytes(lv.hex), strToBytes(key));
    var str = bytesToStr(dec);
    var target = lv.plain.replace(/[^A-Z0-9 !?.,'-]/g, '');
    var got = str.replace(/[^A-Z0-9 !?.,'-]/g, '').toUpperCase();
    outEl.textContent = str;
    if (got === target) {
      outEl.style.color = 'var(--neon-green)';
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      setTimeout(function () {
        if (!chalMode) return; /* 模式切换守卫（E2E 评审修复：原引用未定义变量 mode 抛 ReferenceError，挑战卡死第 1 关） */
        if (levelIdx < LEVELS.length - 1) {
          levelIdx++;
          startChal();
          if (Arcade.ui) Arcade.ui.toast(T('gs.xor.toastNext').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.xor.toastAll'), 'win');
          levelIdx = 0;
          startChal();
        }
      }, 900);
    } else {
      outEl.style.color = '';
      if (Arcade.audio) Arcade.audio.play('error');
      document.getElementById('xr-msg').textContent = T('gs.xor.wrongKey').replace('{h}', lv.hint);
    }
  }

  /* ---------- 密文分析模式（已知明文攻击 KPA 教学） ----------
     原理：若猜出明文某位置字符 P，则密钥字节 K = 密文C ⊕ P。
     玩家输入假设明文片段（如 THE），系统从密文开头对齐反推密钥字节并填入。 */
  var ANAL_SAMPLES = [
    { len: 3, hex: '160A1D166F0111081C1903', plain: 'NEON SIGNAL', hint: T('gs.xor.analHint1') },
    { len: 5, hex: '030C1B170904691B0A0815', plain: 'SECRET CODE', hint: T('gs.xor.analHint2') },
    { len: 6, hex: '0E0701690C0219070D0704631606011A', plain: 'THE MACHINE LIES', hint: T('gs.xor.analHint3') }
  ];
  var analSample = 0;
  var analKnown = {};  // 密钥位置 -> 字节（已推导）
  var analKnownCount = 0;

  function startAnal() {
    var s = ANAL_SAMPLES[analSample];
    analKeyLen = s.len;
    analHex = hexToBytes(s.hex);
    analKnown = {};
    analKnownCount = 0;
    document.getElementById('xr-amsg').textContent = T('gs.xor.analSampleMsg').replace('{n}', analSample + 1).replace('{h}', s.hint);
    document.getElementById('xr-amsg').style.color = 'var(--neon-pink)';
    document.getElementById('xr-ahex').textContent = s.hex;
    document.getElementById('xr-aguess').value = '';
    renderAnal();
  }

  function renderAnal() {
    document.getElementById('xr-aklen').textContent = analKeyLen;
    document.getElementById('xr-aguessed').textContent = analKnownCount + ' / ' + analKeyLen + ' ' + T('gs.xor.bytes');
    var row = document.getElementById('xr-abytes');
    row.innerHTML = '';
    for (var i = 0; i < analKeyLen; i++) {
      var d = document.createElement('div');
      if (analKnown[i] !== undefined) {
        d.className = 'xr-chal-byte ok';
        d.textContent = analKnown[i].toString(16).toUpperCase();
      } else {
        d.className = 'xr-chal-byte';
        d.textContent = '·';
      }
      row.appendChild(d);
    }
    updatePreview();
  }

  function updatePreview() {
    var out = '';
    var allKnown = true;
    for (var i = 0; i < analHex.length; i++) {
      var kb = analKnown[i % analKeyLen];
      if (kb === undefined) { allKnown = false; out += '·'; continue; }
      var b = analHex[i] ^ kb;
      out += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '·';
    }
    var el = document.getElementById('xr-apreview');
    el.textContent = out;
    el.style.color = allKnown ? 'var(--neon-green)' : 'var(--neon-cyan)';
    return out;
  }

  /* 玩家输入假设明文 → 反推密钥字节 */
  function analGuess() {
    var v = document.getElementById('xr-aguess').value.toUpperCase().replace(/[^A-Z0-9 !?.,'-]/g, '');
    if (!v) {
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    var added = 0;
    var msgEl = document.getElementById('xr-amsg');
    for (var i = 0; i < v.length; i++) {
      if (i >= analHex.length) break; // 猜测超过密文长度时停止，避免 undefined^c 污染密钥字节
      var plainByte = v.charCodeAt(i);
      var keyPos = i % analKeyLen;
      var kb = analHex[i] ^ plainByte;
      if (analKnown[keyPos] === undefined) {
        analKnown[keyPos] = kb;
        analKnownCount++;
        added++;
      }
    }
    renderAnal();
    msgEl.textContent = added
      ? T('gs.xor.analDerivedOk').replace('{v}', v).replace('{n}', added)
      : T('gs.xor.analDerivedNone');
    msgEl.style.color = 'var(--neon-green)';
    if (Arcade.audio) Arcade.audio.play('coin');
    // 全部推导完 → 检查是否解出目标明文
    if (analKnownCount === analKeyLen) {
      var full = [];
      for (var j = 0; j < analHex.length; j++) full.push(analHex[j] ^ analKnown[j % analKeyLen]);
      var str = bytesToStr(full);
      var target = ANAL_SAMPLES[analSample].plain;
      if (str === target) {
        msgEl.textContent = T('gs.xor.analRecovered').replace('{k}', [0,1,2,3,4,5].slice(0, analKeyLen).map(function (k) {
          return analKnown[k].toString(16).toUpperCase();
        }).join(' ')).replace('{s}', str);
        msgEl.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        setTimeout(function () {
          if (analSample < ANAL_SAMPLES.length - 1) {
            analSample++;
            startAnal();
          } else {
            analSample = 0;
            startAnal();
            if (Arcade.ui) Arcade.ui.toast(T('gs.xor.toastAllMsg'), 'win');
          }
        }, 900);
      } else {
        msgEl.textContent = T('gs.xor.analNotPlain').replace('{s}', str);
        msgEl.style.color = 'var(--neon-yellow)';
      }
    } else {
      // 未推导完：提示预览变化
      var preview = updatePreview();
      if (preview.indexOf('·') < 0) {
        // 预览全部可打印但明文未达目标 → 提示可能假设有误
      }
    }
  }

  function analReset() {
    analKnown = {};
    analKnownCount = 0;
    document.getElementById('xr-aguess').value = '';
    var s = ANAL_SAMPLES[analSample];
    document.getElementById('xr-amsg').textContent = T('gs.xor.analResetMsg').replace('{h}', s.hint);
    document.getElementById('xr-amsg').style.color = 'var(--neon-pink)';
    renderAnal();
    if (Arcade.audio) Arcade.audio.play('back');
  }

  /* ---------- 模式切换 ---------- */
  function setMode(mode) {
    freeMode = mode === 'free';
    chalMode = mode === 'chal';
    analMode = mode === 'anal';
    stopTimer();
    var tabs = root.querySelectorAll('.xr-tabs .mode-btn');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === mode);
    if (freeMode) {
      bodyEl.innerHTML = freeHtml;
      document.getElementById('xr-plain').addEventListener('input', runFree);
      document.getElementById('xr-freekey').addEventListener('input', runFree);
      runFree();
    } else if (chalMode) {
      bodyEl.innerHTML = chalHtml;
      document.getElementById('xr-go').addEventListener('click', doChal);
      document.getElementById('xr-chalkey').addEventListener('keydown', function (e) { if (e.key === 'Enter') doChal(); });
      levelIdx = 0;
      startChal();
    } else {
      bodyEl.innerHTML = analHtml;
      document.getElementById('xr-aset').addEventListener('click', analGuess);
      document.getElementById('xr-aback').addEventListener('click', analReset);
      document.getElementById('xr-aguess').addEventListener('keydown', function (e) { if (e.key === 'Enter') analGuess(); });
      analSample = 0;
      startAnal();
    }
  }

  var tabs = root.querySelectorAll('.xr-tabs .mode-btn');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }

  // 初始化
  document.getElementById('xr-plain').addEventListener('input', runFree);
  document.getElementById('xr-freekey').addEventListener('input', runFree);
  runFree();

  window.GAME_RESTART = function () {
    stopTimer();
    freeMode = true;
    var tabs = root.querySelectorAll('.xr-tabs .mode-btn');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'free');
    bodyEl.innerHTML = freeHtml;
    document.getElementById('xr-plain').addEventListener('input', runFree);
    document.getElementById('xr-freekey').addEventListener('input', runFree);
    runFree();
  };


})();
