/* ============================================================
   炸弹机 Bombe · 布莱切利园破解机（旗舰级，全网独家）
   复刻二战破解恩尼格玛的真实机器原理：
   已知明文片段(crib) → Bombe 扫描全部转子位置，
   用「自反一致性检查」筛出候选设置 → 人工验证解密。
   三模式：
   - 原理演示：摆弄转子看加密，理解自反性
   - 破解挑战：3 关递进，给密文+crib，操作炸弹机找转子设置
   - 自由模式：任意设置生成密文，用 Bombe 原理破解
   记分：挑战用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bombe.tut1t'), d: T('gs.bombe.tut1') },
  { t: T('gs.bombe.tut2t'), d: T('gs.bombe.tut2') },
  { t: T('gs.bombe.tut3t'), d: T('gs.bombe.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function idx(c) { return c.charCodeAt(0) - 65; }

  /* ================= Enigma 引擎（与 enigma.js 一致） ================= */
  var ROTORS = {
    I:   { w: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 16 },
    II:  { w: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 4 },
    III: { w: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 21 }
  };
  var REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  function fwd(x, r, pos) { var c = r.w[(x + pos) % 26]; return (idx(c) - pos + 26) % 26; }
  function rev(x, r, pos) { var c = A[(x + pos) % 26]; var i = r.w.indexOf(c); return (i - pos + 26) % 26; }
  function stepOnce(order, pos) {
    var n1 = ROTORS[order[1]].notch, n2 = ROTORS[order[2]].notch;
    if (pos[1] === n1) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
    else if (pos[2] === n2) { pos[1] = (pos[1] + 1) % 26; }
    pos[2] = (pos[2] + 1) % 26;
  }
  function encLetter(ch, order, pos, plug) {
    stepOnce(order, pos);
    var x = idx(ch);
    x = plug[x];
    x = fwd(x, ROTORS[order[2]], pos[2]);
    x = fwd(x, ROTORS[order[1]], pos[1]);
    x = fwd(x, ROTORS[order[0]], pos[0]);
    x = idx(REFLECTOR[x]);
    x = rev(x, ROTORS[order[0]], pos[0]);
    x = rev(x, ROTORS[order[1]], pos[1]);
    x = rev(x, ROTORS[order[2]], pos[2]);
    x = plug[x];
    return A[x];
  }
  function transform(text, order, startPos, plug) {
    var pos = startPos.slice();
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch < 'A' || ch > 'Z') { out += ch; continue; }
      out += encLetter(ch, order, pos, plug);
    }
    return out;
  }
  function identityPlug() { var p = []; for (var i = 0; i < 26; i++) p[i] = i; return p; }
  function buildPlug(pairs) {
    var p = identityPlug();
    (pairs || []).forEach(function (pr) {
      var a = idx(pr[0]), b = idx(pr[1]);
      p[a] = b; p[b] = a;
    });
    return p;
  }

  /* ================= Bombe 核心：crib 一致性扫描 =================
     真实语义：候选 = 电文起始转子设置。从候选位置加密「明文前段」，
     检查 crib 段的输出是否与密文对应段一致（自反性）。
     返回所有通过检查的起始位置。 */
  function bombeScan(fullCipher, plainPrefix, order, plug) {
    var candidates = [];
    var crib = plainPrefix.slice(0, 8); // 用明文前 8 字母作 crib
    for (var p0 = 0; p0 < 26; p0++) {
      for (var p1 = 0; p1 < 26; p1++) {
        for (var p2 = 0; p2 < 26; p2++) {
          var pos = [p0, p1, p2];
          var ok = true;
          for (var i = 0; i < crib.length; i++) {
            var out = encLetter(plainPrefix[i], order, pos, plug);
            if (out !== fullCipher[i]) { ok = false; break; }
          }
          if (ok) candidates.push([p0, p1, p2]);
        }
      }
    }
    return candidates;
  }

  /* ================= 挑战关卡 ================= */
  var LEVELS = [
    {
      order: ['I', 'II', 'III'], secret: [7, 0, 3], plugs: [],
      plain: 'NEONSIGNAL', crib: 'SIGNAL',
      hint: T('gs.bombe.lv1Hint')
    },
    {
      order: ['III', 'I', 'II'], secret: [14, 9, 20], plugs: [['A', 'B']],
      plain: 'BREAKTHECODE', crib: 'BREAK',
      hint: T('gs.bombe.lv2Hint')
    },
    {
      order: ['II', 'III', 'I'], secret: [23, 5, 18], plugs: [],
      plain: 'WATCHTOWER', crib: 'TOWER',
      hint: T('gs.bombe.lv3Hint')
    }
  ];

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="bm-tabs">' +
    '  <button class="btn bm-tab mode-btn selected" data-mode="demo">' + T('gs.bombe.modeDemo') + '</button>' +
    '  <button class="btn bm-tab mode-btn" data-mode="chal">' + T('gs.bombe.modeChal') + '</button>' +
    '  <button class="btn bm-tab mode-btn" data-mode="free">' + T('gs.bombe.modeFree') + '</button>' +
    '</div>';

  var machineHtml =
    '<div class="bm-machine">' +
    '  <div class="bm-info"><span>' + T('gs.bombe.machineTitle') + '</span><span id="bm-status">' + T('gs.bombe.standby') + '</span></div>' +
    '  <div class="bm-bank" id="bm-bank"></div>' +
    '  <div class="bm-lamps" id="bm-lamps"></div>' +
    '</div>';

  var demoHtml =
    '<div class="bm-hint">' + T('gs.bombe.demoHint') + '</div>' +
    '<div class="bm-info"><span>' + T('gs.bombe.plainIn') + '</span></div>' +
    '<input class="bm-crib" id="bm-demo-in" maxlength="20" placeholder="' + T('gs.bombe.inputPh') + '" aria-label="' + T('gs.bombe.plainIn') + '">' +
    '<div class="bm-info"><span>' + T('gs.bombe.demoOut') + '</span></div>' +
    '<div class="bm-cipher" id="bm-demo-out" style="color:var(--neon-green)">——</div>';

  var chalHtml =
    '<div class="bm-info">' +
    '  <span>' + T('gs.bombe.levelLbl') + ' <span class="stat-value" id="bm-level">1</span>/3</span>' +
    '  <span>' + T('gs.bombe.timeLbl') + ' <span class="stat-value" id="bm-timer">0s</span></span>' +
    '</div>' +
    '<div class="bm-msg" id="bm-msg"></div>' +
    '<div class="bm-hint" id="bm-hint"></div>' +
    '<div class="bm-info"><span>' + T('gs.bombe.cipherLbl') + '</span></div>' +
    '<div class="bm-cipher" id="bm-cipher"></div>' +
    '<div class="bm-info"><span>' + T('gs.bombe.cribLbl') + '</span></div>' +
    '<div class="bm-crib" id="bm-crib"></div>' +
    '<div class="bm-rotorselect" id="bm-rotors"></div>' +
    '<div class="bm-result" id="bm-result">' + T('gs.bombe.scanWait') + '</div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="bm-scan">' + T('gs.bombe.scanBtn') + '</button>' +
    '  <button class="btn purple" id="bm-verify">' + T('gs.bombe.verifyBtn') + '</button>' +
    '</div>';

  var freeHtml =
    '<div class="bm-hint">' + T('gs.bombe.freeHint') + '</div>' +
    '<div class="bm-rotorselect" id="bm-free-rotors"></div>' +
    '<div class="bm-info"><span>' + T('gs.bombe.secretLbl') + ' <span class="stat-value" id="bm-free-secret"></span></span>' +
    '<span>' + T('gs.bombe.plainLbl') + ' <input class="bm-crib" id="bm-free-plain" maxlength="16" placeholder="' + T('gs.bombe.plainLbl') + '" style="width:140px;font-size:11px" aria-label="' + T('gs.bombe.plainLbl') + '"></span></div>' +
    '<div class="game-controls">' +
    '  <button class="btn yellow" id="bm-free-enc">' + T('gs.bombe.encBtn') + '</button>' +
    '  <button class="btn green" id="bm-free-scan">' + T('gs.bombe.scanFreeBtn') + '</button>' +
    '</div>' +
    '<div class="bm-info"><span>' + T('gs.bombe.cipherLbl2') + '</span></div>' +
    '<div class="bm-cipher" id="bm-free-cipher">——</div>' +
    '<div class="bm-result" id="bm-free-result">——</div>';

  root.innerHTML = tabsHtml + machineHtml + '<div id="bm-body">' + demoHtml + '</div>';

  var freeMode = true;
  var levelIdx = 0;
  var order = ['I', 'II', 'III'];
  var pos = [0, 0, 0];
  var plug = identityPlug();
  var timerTick = null;
  var challengeStart = 0;
  var candidates = [];
  var selectedCand = null;
  var DRUM_NAMES = [T('gs.bombe.drumLeft'), T('gs.bombe.drumMid'), T('gs.bombe.drumRight')];

  var bankEl = document.getElementById('bm-bank');
  var lampsEl = document.getElementById('bm-lamps');
  var statusEl = document.getElementById('bm-status');
  var bodyEl = document.getElementById('bm-body');

  /* ---------- 机器渲染：3 鼓轮 + 灯板 ---------- */
  function renderBank() {
    bankEl.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('div');
      d.className = 'bm-drum';
      d.innerHTML =
        '<div class="dlabel">' + T('gs.bombe.drumLbl').replace('{n}', DRUM_NAMES[i]) + '</div>' +
        '<button class="darrow" data-act="up" aria-label="' + T('gs.bombe.ariaDec') + '">▲</button>' +
        '<div class="dletter">' + A[pos[i]] + '</div>' +
        '<button class="darrow" data-act="down" aria-label="' + T('gs.bombe.ariaInc') + '">▼</button>';
      bankEl.appendChild(d);
      (function (slot, el) {
        el.querySelectorAll('.darrow').forEach(function (b) {
          b.addEventListener('click', function () {
            pos[slot] = (pos[slot] + (this.getAttribute('data-act') === 'up' ? 25 : 1)) % 26;
            renderBank();
            if (Arcade.audio) Arcade.audio.play('move');
          });
        });
      })(i, d);
    }
  }

  function renderLamps(litChar) {
    lampsEl.innerHTML = '';
    for (var i = 0; i < 26; i++) {
      var l = document.createElement('div');
      l.className = 'bm-lamp' + (A[i] === litChar ? ' lit' : '');
      l.textContent = A[i];
      lampsEl.appendChild(l);
    }
  }

  function setStatus(s, cls) {
    statusEl.textContent = s;
    statusEl.style.color = cls || '';
  }

  /* ---------- 演示模式 ---------- */
  function runDemo() {
    var input = document.getElementById('bm-demo-in');
    var out = document.getElementById('bm-demo-out');
    if (!input || !out) return;
    var v = input.value.toUpperCase().replace(/[^A-Za-z]/g, '');
    if (v !== input.value.replace(/[^A-Za-z]/g, '')) input.value = v;
    if (!v) { out.textContent = '——'; renderLamps(null); return; }
    // 加密第一个字母点亮灯板
    var firstOut = encLetter(v[0], order, pos.slice(), plug);
    renderLamps(firstOut);
    out.textContent = transform(v, order, pos.slice(), plug);
  }

  /* ---------- 挑战模式 ---------- */
  function startChal() {
    var lv = LEVELS[levelIdx];
    // 生成密文（从 secret 开始，包含 crib 位置）
    var cipher = transform(lv.plain, lv.order, lv.secret, buildPlug(lv.plugs));
    document.getElementById('bm-msg').textContent = T('gs.bombe.levelMsg').replace('{n}', levelIdx + 1);
    document.getElementById('bm-hint').innerHTML = '💡 ' + lv.hint + '<br>' + T('gs.bombe.rotorOrderLbl') + ' <b>' + lv.order.join('-') + '</b>';
    document.getElementById('bm-cipher').textContent = cipher;
    document.getElementById('bm-crib').textContent = T('gs.bombe.knownPlainLbl') + lv.crib;
    document.getElementById('bm-level').textContent = (levelIdx + 1) + '/3';
    document.getElementById('bm-result').textContent = T('gs.bombe.scanWait');
    document.getElementById('bm-result').style.color = '';
    // 转子选择（固定顺序）
    var selEl = document.getElementById('bm-rotors');
    selEl.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('select');
      ['I', 'II', 'III'].forEach(function (r) {
        var o = document.createElement('option');
        o.value = r; o.textContent = r;
        if (r === lv.order[i]) o.selected = true;
        s.appendChild(o);
      });
      s.setAttribute('aria-label', T('gs.bombe.ariaRotor').replace('{n}', i));
      s.addEventListener('change', function (e, si) {
        var cur = [document.querySelectorAll('#bm-rotors select')[0].value,
                    document.querySelectorAll('#bm-rotors select')[1].value,
                    document.querySelectorAll('#bm-rotors select')[2].value];
        order = cur.slice();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
      selEl.appendChild(s);
    }
    order = lv.order.slice();
    pos = [0, 0, 0];
    plug = buildPlug(lv.plugs);
    renderBank();
    renderLamps(null);
    challengeStart = Date.now();
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(function () {
      var el = document.getElementById('bm-timer');
      if (el) el.textContent = elapsed() + 's';
    }, 500);
  }

  function elapsed() { return Math.round((Date.now() - challengeStart) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }

  function doScan() {
    var lv = LEVELS[levelIdx];
    var cipher = document.getElementById('bm-cipher').textContent;
    // 已知明文片段：Bombe 假设 crib 在电文开头（真实场景密码员常猜开头词）
    var crib = lv.crib;
    // 用 crib 长度在密文开头匹配（若 crib 在开头）
    var allCands = [];
    // 遍历偏移：crib 可能出现在密文任意位置
    for (var off = 0; off + crib.length <= cipher.length; off++) {
      var plainSeg = '';
      // 偏移 off 处假设明文 = crib，则从起始位置加密 off 步后再验证
      var cands = scanAtOffset(cipher, lv.plain, crib, off, order, plug);
      cands.forEach(function (c) { allCands.push({ pos: c, off: off }); });
    }
    // 去重位置
    var seen = {};
    candidates = [];
    allCands.forEach(function (c) {
      var k = c.pos.join(',');
      if (!seen[k]) { seen[k] = true; candidates.push(c.pos); }
    });
    setStatus(T('gs.bombe.scanDone'), 'var(--neon-green)');
    if (Arcade.audio) Arcade.audio.play('ui');
    if (Arcade.juice) Arcade.juice.select();
    var resEl = document.getElementById('bm-result');
    if (!candidates.length) {
      resEl.textContent = T('gs.bombe.noCand');
      resEl.style.color = 'var(--neon-pink)';
      return;
    }
    var html = T('gs.bombe.foundCands').replace('{n}', candidates.length);
    candidates.forEach(function (c) {
      html += '<span class="cand" data-pos="' + c.join(',') + '">' + A[c[0]] + A[c[1]] + A[c[2]] + '</span>';
    });
    html += T('gs.bombe.clickCandHint');
    resEl.innerHTML = html;
    resEl.style.color = '';
    // 绑定候选点击
    resEl.querySelectorAll('.cand').forEach(function (el2) {
      el2.addEventListener('click', function () {
        var p = this.getAttribute('data-pos').split(',').map(Number);
        pos = p;
        renderBank();
        if (Arcade.audio) Arcade.audio.play('move');
      });
    });
  }

  /* 偏移扫描：候选=起始位置。假设 crib 出现在明文偏移 off 处，
     从候选位置开始步进（前 off 步明文未知，用占位输入照常步进），
     检查 crib 段输出与密文一致。密码员只需知道 crib。 */
  function scanAtOffset(cipher, fullPlain, crib, off, order, plug) {
    var candidates = [];
    var needLen = off + crib.length;
    for (var p0 = 0; p0 < 26; p0++) {
      for (var p1 = 0; p1 < 26; p1++) {
        for (var p2 = 0; p2 < 26; p2++) {
          var pos = [p0, p1, p2];
          var ok = true;
          for (var i = 0; i < needLen; i++) {
            var input = i >= off ? crib[i - off] : 'X'; // 前 off 步占位
            var out = encLetter(input, order, pos, plug);
            if (i >= off && out !== cipher[i]) { ok = false; break; }
          }
          if (ok) candidates.push([p0, p1, p2]);
        }
      }
    }
    return candidates;
  }

  function doVerify() {
    var lv = LEVELS[levelIdx];
    var cipher = document.getElementById('bm-cipher').textContent;
    var out = transform(cipher, order, pos, plug);
    var plainTarget = lv.plain;
    var ok = out === plainTarget;
    var resEl = document.getElementById('bm-result');
    if (ok) {
      resEl.innerHTML = T('gs.bombe.winMsg').replace('{p}', out).replace('{t}', elapsed());
      resEl.style.color = 'var(--neon-green)';
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(elapsed());
      setTimeout(function () {
        if (levelIdx < LEVELS.length - 1) {
          levelIdx++;
          startChal();
          if (Arcade.ui) Arcade.ui.toast(T('gs.bombe.nextLevel').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.bombe.allDone'), 'win');
          levelIdx = 0;
          startChal();
        }
      }, 1000);
    } else {
      resEl.innerHTML = T('gs.bombe.wrongMsg').replace('{p}', out);
      resEl.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  /* ---------- 自由模式 ---------- */
  var freeSecret = [3, 7, 12];
  var freeOrder = ['I', 'II', 'III'];
  function startFree() {
    var selEl = document.getElementById('bm-free-rotors');
    selEl.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('select');
      ['I', 'II', 'III'].forEach(function (r) {
        var o = document.createElement('option');
        o.value = r; o.textContent = r;
        s.appendChild(o);
      });
      s.value = freeOrder[i];
      s.addEventListener('change', function (e, si) {
        var sel = document.querySelectorAll('#bm-free-rotors select');
        freeOrder = [sel[0].value, sel[1].value, sel[2].value];
      });
      selEl.appendChild(s);
    }
    document.getElementById('bm-free-secret').textContent = A[freeSecret[0]] + A[freeSecret[1]] + A[freeSecret[2]];
    document.getElementById('bm-free-cipher').textContent = '——';
    document.getElementById('bm-free-result').textContent = '——';
  }

  function freeEncrypt() {
    var plain = document.getElementById('bm-free-plain').value.toUpperCase().replace(/[^A-Z]/g, '');
    if (plain.length < 4) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.bombe.plainTooShort'), 'warn');
      return;
    }
    var cipher = transform(plain, freeOrder, freeSecret, identityPlug());
    document.getElementById('bm-free-cipher').textContent = cipher;
    document.getElementById('bm-free-result').textContent = T('gs.bombe.cipherReady');
  }

  function freeScan() {
    var cipher = document.getElementById('bm-free-cipher').textContent;
    var plain = document.getElementById('bm-free-plain').value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cipher || cipher === '——' || plain.length < 3) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.bombe.scanFirst'), 'warn');
      return;
    }
    var crib = plain.substr(0, 6); // 用明文前 6 字母作 crib
    var allCands = [];
    for (var off = 0; off + crib.length <= cipher.length; off++) {
      var seg = cipher.substr(off, crib.length);
      var cands = bombeScan(seg, crib, freeOrder, identityPlug());
      cands.forEach(function (c) { allCands.push({ pos: c, off: off }); });
    }
    var seen = {};
    var cands2 = [];
    allCands.forEach(function (c) {
      var k = c.pos.join(',');
      if (!seen[k]) { seen[k] = true; cands2.push(c.pos); }
    });
    var resEl = document.getElementById('bm-free-result');
    if (!cands2.length) {
      resEl.textContent = T('gs.bombe.noCandFree');
      resEl.style.color = 'var(--neon-pink)';
      return;
    }
    var isSecret = cands2.some(function (c) {
      return c[0] === freeSecret[0] && c[1] === freeSecret[1] && c[2] === freeSecret[2];
    });
    resEl.innerHTML = T(isSecret ? 'gs.bombe.foundFreeIn' : 'gs.bombe.foundFreeOut')
      .replace('{n}', cands2.length)
      .replace('{s}', A[freeSecret[0]] + A[freeSecret[1]] + A[freeSecret[2]]) +
      cands2.slice(0, 12).map(function (c) { return '<span class="cand">' + A[c[0]] + A[c[1]] + A[c[2]] + '</span>'; }).join(' ');
    resEl.style.color = '';
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ---------- 模式切换 ---------- */
  function setMode(mode) {
    freeMode = mode === 'demo';
    stopTimer();
    var tabs = root.querySelectorAll('.bm-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === mode);
    order = ['I', 'II', 'III'];
    pos = [0, 0, 0];
    plug = identityPlug();
    renderBank();
    renderLamps(null);
    setStatus(mode === 'chal' ? T('gs.bombe.statusChal') : (mode === 'free' ? T('gs.bombe.statusFree') : T('gs.bombe.standby')));
    if (mode === 'demo') {
      bodyEl.innerHTML = demoHtml;
      document.getElementById('bm-demo-in').addEventListener('input', runDemo);
      runDemo();
    } else if (mode === 'chal') {
      bodyEl.innerHTML = chalHtml;
      document.getElementById('bm-scan').addEventListener('click', doScan);
      document.getElementById('bm-verify').addEventListener('click', doVerify);
      levelIdx = 0;
      startChal();
    } else {
      bodyEl.innerHTML = freeHtml;
      document.getElementById('bm-free-enc').addEventListener('click', freeEncrypt);
      document.getElementById('bm-free-scan').addEventListener('click', freeScan);
      startFree();
    }
  }

  var tabs = root.querySelectorAll('.bm-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }

  // 初始化
  renderBank();
  renderLamps(null);
  document.getElementById('bm-demo-in').addEventListener('input', runDemo);
  runDemo();

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.bombe.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    stopTimer();
    freeMode = true;
    var tabs = root.querySelectorAll('.bm-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'demo');
    order = ['I', 'II', 'III'];
    pos = [0, 0, 0];
    plug = identityPlug();
    bodyEl.innerHTML = demoHtml;
    renderBank();
    renderLamps(null);
    document.getElementById('bm-demo-in').addEventListener('input', runDemo);
    runDemo();
  };


})();
