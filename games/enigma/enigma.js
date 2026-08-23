/* ============================================================
   恩尼格玛 Enigma · 密码破译（P 级旗舰）
   复刻二战 Enigma I 密码机：
     - 三转子（I/II/III 标准线序）+ 双步进（notch 推进）
     - 反射器 UKW-B + 插线板（字母两两互换）
     - 对称性：同一设置下加密=解密
   两种模式：
     - 自由演练：任意设置，输入明/密文即时变换
     - 破译挑战：3 关递进，已知转子顺序+插线板，旋转转子
       找到能解出通顺明文的初始位置（反馈每字母对错 + 提示扣时）
   记分：挑战通关用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.enigma.tut1t'), d: T('gs.enigma.tut1') },
  { t: T('gs.enigma.tut2t'), d: T('gs.enigma.tut2') },
  { t: T('gs.enigma.tut3t'), d: T('gs.enigma.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ---------- Enigma I 组件 ---------- */
  var ROTORS = {
    I:   { w: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 16 }, // Q
    II:  { w: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 4  }, // E
    III: { w: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 21 }, // V
    IV:  { w: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 9  }, // J
    V:   { w: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 25 }, // Z
    VI:  { w: 'JPGVOUMFYQBENHZRDKASXLICTW', notch: 12 }, // M（双 notch）
    VII: { w: 'NZJHGRCXMYSWBOUFAIVLPEKQDT', notch: 12 }, // M（双 notch）
    VIII:{ w: 'FKQHTLXOCBJSPDZRAMEWNIUYGV', notch: 12 }  // M（双 notch）
  };
  // M4 海军版：静转子（无 notch）+ 薄反射器（beta/gamma + thin-b/thin-c）
  var STATIC_ROTORS = {
    BETA:  { w: 'LEYJVCNIXWPBQMDRTAKZGFUHOS' },
    GAMMA: { w: 'FSOKANUERHMBTIYCWLQPZXVGJD' }
  };
  var REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  var THIN_REFLECTORS = {
    B: 'ENKQAUYWJICOPBLMDXZVFTHRGS',
    C: 'RDOBJNTKVEHMLFCWZAXGYIPSUQ'
  };
  var ROTOR_NAMES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  function idx(c) { return c.charCodeAt(0) - 65; }

  /* 单转子正向（右→左）与反向（左→右） */
  function fwd(x, r, pos) {
    var c = r.w[(x + pos) % 26];
    return (idx(c) - pos + 26) % 26;
  }
  function rev(x, r, pos) {
    var c = A[(x + pos) % 26];
    var i = r.w.indexOf(c);
    return (i - pos + 26) % 26;
  }

  /* 双步进：右转子每键推进；中转子在自身 notch 或右转子 notch 时联动（Enigma 真实行为）
     M4 静转子（最左）不步进 */
  function stepOnce(order, pos) {
    var n = order.length;
    var n1 = ROTORS[order[n - 2]].notch;
    var n2 = ROTORS[order[n - 1]].notch;
    if (pos[n - 2] === n1) {
      pos[n - 3] = (pos[n - 3] + 1) % 26;
      pos[n - 2] = (pos[n - 2] + 1) % 26;
    } else if (pos[n - 1] === n2) {
      pos[n - 2] = (pos[n - 2] + 1) % 26;
    }
    pos[n - 1] = (pos[n - 1] + 1) % 26;
  }

  /* 单字母加密（步进后变换）。plug: 26 长数组，plug[i]=j 表示 i↔j 互换（i===j 时不换）
     order 可含 'BETA'/'GAMMA'（静转子，最左），reflector 可为薄反射器名 */
  function encLetter(ch, order, pos, plug, reflectorName) {
    stepOnce(order, pos);
    var n = order.length;
    var x = idx(ch);
    x = plug[x];
    // 最右 → 最左正向
    for (var i = n - 1; i >= 0; i--) {
      var rn = order[i];
      var r = ROTORS[rn] || STATIC_ROTORS[rn];
      var p = ROTORS[rn] ? pos[i] : 0; // 静转子位置固定为 0
      x = fwd(x, r, p);
    }
    var refl = reflectorName ? THIN_REFLECTORS[reflectorName] : REFLECTOR;
    x = idx(refl[x]);
    // 最左 → 最右反向
    for (var j = 0; j < n; j++) {
      var rn2 = order[j];
      var r2 = ROTORS[rn2] || STATIC_ROTORS[rn2];
      var p2 = ROTORS[rn2] ? pos[j] : 0;
      x = rev(x, r2, p2);
    }
    x = plug[x];
    return A[x];
  }

  /* 整段变换（encrypt 与 decrypt 相同，Enigma 对称） */
  function transform(text, order, startPos, plug, reflectorName) {
    var pos = startPos.slice();
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch < 'A' || ch > 'Z') { out += ch; continue; }
      out += encLetter(ch, order, pos, plug, reflectorName);
    }
    return out;
  }

  function identityPlug() {
    var p = [];
    for (var i = 0; i < 26; i++) p[i] = i;
    return p;
  }
  function buildPlug(pairs) {
    var p = identityPlug();
    pairs.forEach(function (pr) {
      var a = idx(pr[0]), b = idx(pr[1]);
      p[a] = b; p[b] = a;
    });
    return p;
  }
  function plugLabel(pairs) {
    if (!pairs.length) return T('gs.enigma.none');
    return pairs.map(function (pr) { return pr[0] + '/' + pr[1]; }).join(' · ');
  }

  /* ---------- 挑战关卡 ----------
     text：目标明文（大写字母）；order：转子顺序（左→右）；
     plugs：插线板对；seed：正确初始位置 [左,中,右]；hint：明文主题提示 */
  var LEVELS = [
    {
      text: 'NEONARCADE', order: ['I', 'II', 'III'], plugs: [['C', 'F']], seed: [7, 0, 3],
      hint: T('gs.enigma.lv1Hint')
    },
    {
      text: 'BREAKTHECODE', order: ['III', 'I', 'II'], plugs: [['A', 'B'], ['I', 'J']], seed: [14, 9, 20],
      hint: T('gs.enigma.lv2Hint')
    },
    {
      text: 'DECODESECRETS', order: ['II', 'III', 'I'], plugs: [['B', 'E'], ['G', 'K'], ['N', 'R']], seed: [23, 5, 18],
      hint: T('gs.enigma.lv3Hint')
    }
  ];

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var tabsHtml =
    '<div class="en-tabs">' +
    '  <button class="btn en-tab mode-btn selected" data-mode="free">' + T('gs.enigma.modeFree') + '</button>' +
    '  <button class="btn en-tab mode-btn" data-mode="challenge">' + T('gs.enigma.modeChal') + '</button>' +
    '  <button class="btn en-tab mode-btn" data-mode="m4">' + T('gs.enigma.modeM4') + '</button>' +
    '  <button class="btn en-tab mode-btn" data-mode="raid">' + T('gs.enigma.modeRaid') + '</button>' +
    '</div>';

  var rotorHtml = '';
  var POS_NAMES = [T('gs.enigma.left'), T('gs.enigma.mid'), T('gs.enigma.right')];
  for (var i = 0; i < 3; i++) {
    rotorHtml +=
      '<div class="en-rotor" data-slot="' + i + '">' +
      '  <div class="rl">' + T('gs.enigma.rotorLbl').replace('{n}', POS_NAMES[i]) + '</div>' +
      '  <div class="rletter" data-role="letter">A</div>' +
      '  <div class="rrow">' +
      '    <button class="mode-btn" data-act="up" aria-label="' + T('gs.enigma.ariaDec') + '">▲</button>' +
      '    <button class="mode-btn" data-act="down" aria-label="' + T('gs.enigma.ariaInc') + '">▼</button>' +
      '  </div>' +
      '  <select data-role="type" aria-label="' + T('gs.enigma.ariaType') + '">' +
      '    <option value="I">I</option><option value="II">II</option><option value="III">III</option>' +
      '  </select>' +
      '</div>';
  }
  var plugHtml =
    '<div class="en-plug-row" id="en-plug-row"></div>' +
    '<div class="en-info"><span id="en-plug-state">' + T('gs.enigma.plugState').replace('{n}', T('gs.enigma.none')) + '</span><span id="en-time"></span></div>';

  var freeHtml =
    '<div class="en-info"><span>' + T('gs.enigma.freeIn') + '</span><span>' + T('gs.enigma.freeOut') + '</span></div>' +
    '<input class="en-input" id="en-input" maxlength="60" placeholder="' + T('gs.enigma.inPh') + '" aria-label="' + T('gs.enigma.inAria') + '">' +
    '<div class="en-output" id="en-output" aria-live="polite">' + T('gs.enigma.waiting') + '</div>' +
    '<p class="help-text">' + T('gs.enigma.helpText') + '</p>';

  var challengeHtml =
    '<div class="en-info">' +
    '  <span>' + T('gs.enigma.levelLbl') + ' <span class="stat-value" id="en-level">1</span>/3</span>' +
    '  <span>' + T('gs.enigma.timeLbl') + ' <span class="stat-value" id="en-timer">0s</span></span>' +
    '</div>' +
    '<div class="en-hint" id="en-level-hint"></div>' +
    '<div class="vg-label">' + T('gs.enigma.cipherLbl') + '</div>' +
    '<div class="en-output" id="en-cipher" style="color:var(--neon-pink);text-shadow:0 0 8px rgba(255,45,149,.4)"></div>' +
    '<div class="vg-label">' + T('gs.enigma.decryptLbl') + '</div>' +
    '<div class="en-output" id="en-decrypt" aria-live="polite">' + T('gs.enigma.decryptWait') + '</div>' +
    '<div class="en-feedback" id="en-feedback"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="en-go">' + T('gs.enigma.goBtn') + '</button>' +
    '  <button class="btn yellow" id="en-hint">' + T('gs.enigma.hintBtn') + '</button>' +
    '</div>';

  /* M4 海军：四转子（BETA/GAMMA 静转子 + 3 个旋转转子）+ 薄反射器 + 每日密钥 */
  var m4Html =
    '<div class="en-info">' +
    '  <span>' + T('gs.enigma.m4Title') + '</span>' +
    '  <span>' + T('gs.enigma.dateLbl') + ' <span class="stat-value" id="m4-date"></span></span>' +
    '</div>' +
    '<div class="en-hint" id="m4-hint">' + T('gs.enigma.m4Hint') + '</div>' +
    '<div class="en-rotors" id="m4-rotors"></div>' +
    '<div class="en-info"><span>' + T('gs.enigma.reflLbl') + ' <select id="m4-refl" aria-label="' + T('gs.enigma.ariaRefl') + '"><option value="B">' + T('gs.enigma.thinB') + '</option><option value="C">' + T('gs.enigma.thinC') + '</option></select></span>' +
    '<span>' + T('gs.enigma.staticLbl') + ' <select id="m4-static" aria-label="' + T('gs.enigma.ariaStatic') + '"><option value="BETA">BETA</option><option value="GAMMA">GAMMA</option></select></span></div>' +
    '<div class="vg-label">' + T('gs.enigma.m4DailyLbl') + '</div>' +
    '<div class="en-output" id="m4-cipher" style="color:var(--neon-pink);text-shadow:0 0 8px rgba(255,45,149,.4)"></div>' +
    '<div class="vg-label">' + T('gs.enigma.decryptLbl') + '</div>' +
    '<div class="en-output" id="m4-decrypt" aria-live="polite">' + T('gs.enigma.m4DecryptWait') + '</div>' +
    '<div class="en-feedback" id="m4-feedback"></div>' +
    '<div class="en-info"><span>' + T('gs.enigma.todayKey') + '<b id="m4-key"></b></span><span>' + T('gs.enigma.timeLbl') + ' <b id="m4-timer">0s</b></span></div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="m4-go">' + T('gs.enigma.goBtn') + '</button>' +
    '  <button class="btn yellow" id="m4-show">' + T('gs.enigma.showKeyBtn') + '</button>' +
    '</div>';

  root.innerHTML = tabsHtml + rotorHtml + plugHtml + '<div id="en-body">' + freeHtml + '</div>';

  var freeMode = true;
  var levelIdx = 0;
  var order = ['I', 'II', 'III'];
  var pos = [0, 0, 0];           // [左,中,右] 当前演示位置
  var pluggedPairs = [];          // 自由模式插线板
  var plugPicked = null;          // 接线模式选中字母
  var challengeStart = 0;
  var timerTick = null;
  var hintCount = 0; // 提示次数（每次 +10s 惩罚，与教程一致）

  var inputEl = document.getElementById('en-input');
  var outputEl = document.getElementById('en-output');
  var cipherEl = document.getElementById('en-cipher');
  var decryptEl = document.getElementById('en-decrypt');
  var feedbackEl = document.getElementById('en-feedback');
  var levelEl = document.getElementById('en-level');
  var timerEl = document.getElementById('en-timer');
  var levelHintEl = document.getElementById('en-level-hint');
  var plugRowEl = document.getElementById('en-plug-row');
  var plugStateEl = document.getElementById('en-plug-state');
  var bodyEl = document.getElementById('en-body');

  /* ---------- 渲染 ---------- */
  function renderRotors() {
    var rotors = root.querySelectorAll('.en-rotor');
    for (var i = 0; i < rotors.length; i++) {
      var letter = rotors[i].querySelector('[data-role="letter"]');
      letter.textContent = A[pos[i]];
      var sel = rotors[i].querySelector('[data-role="type"]');
      sel.value = order[i];
      if (freeMode) sel.disabled = false; else sel.disabled = true;
    }
  }

  function renderPlugRow() {
    plugRowEl.innerHTML = '';
    for (var i = 0; i < 26; i++) {
      (function (ch) {
        var b = document.createElement('button');
        b.className = 'en-plug';
        b.type = 'button';
        b.textContent = ch;
        b.setAttribute('aria-label', T('gs.enigma.plugAria').replace('{n}', ch));
        var paired = null;
        pluggedPairs.forEach(function (pr) {
          if (pr[0] === ch) paired = pr[1];
          if (pr[1] === ch) paired = pr[0];
        });
        if (plugPicked === ch) b.classList.add('picked');
        if (paired) b.classList.add('paired');
        if (!freeMode) {
          // 挑战模式插线板由关卡固定，只展示不可改
          b.disabled = true;
          if (levelHasPlug(ch)) b.classList.add('paired');
        } else {
          b.addEventListener('click', function () {
            if (plugPicked === null) {
              plugPicked = ch;
            } else if (plugPicked === ch) {
              plugPicked = null;
            } else {
              // 已配对则取消，否则新建
              pluggedPairs = pluggedPairs.filter(function (pr) {
                return pr[0] !== plugPicked && pr[1] !== plugPicked && pr[0] !== ch && pr[1] !== ch;
              });
              pluggedPairs.push([plugPicked, ch]);
              plugPicked = null;
            }
            renderPlugRow();
            if (freeMode) runFreeTransform();
          });
        }
        plugRowEl.appendChild(b);
      })(A[i]);
    }
    plugStateEl.textContent = freeMode
      ? T('gs.enigma.plugState').replace('{n}', plugLabel(pluggedPairs))
      : T('gs.enigma.plugFixed').replace('{n}', plugLabel(LEVELS[levelIdx].plugs));
  }

  function levelHasPlug(ch) {
    var plugs = LEVELS[levelIdx].plugs;
    for (var i = 0; i < plugs.length; i++) {
      if (plugs[i][0] === ch || plugs[i][1] === ch) return true;
    }
    return false;
  }

  function setMode(mode) {
    freeMode = mode === 'free';
    stopTimer();
    var tabs = root.querySelectorAll('.en-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === mode);
    if (freeMode) {
      order = ['I', 'II', 'III'];
      pos = [0, 0, 0];
      pluggedPairs = [];
      plugPicked = null;
      bodyEl.innerHTML = freeHtml;
      inputEl = document.getElementById('en-input');
      outputEl = document.getElementById('en-output');
      inputEl.addEventListener('input', runFreeTransform);
      runFreeTransform();
      renderRotors();
      renderPlugRow();
    } else if (mode === 'm4') {
      startM4();
    } else if (mode === 'raid') {
      startRaid();
    } else {
      bodyEl.innerHTML = challengeHtml;
      cipherEl = document.getElementById('en-cipher');
      decryptEl = document.getElementById('en-decrypt');
      feedbackEl = document.getElementById('en-feedback');
      levelEl = document.getElementById('en-level');
      timerEl = document.getElementById('en-timer');
      levelHintEl = document.getElementById('en-level-hint');
      document.getElementById('en-go').addEventListener('click', doDecrypt);
      document.getElementById('en-hint').addEventListener('click', useHint);
      levelIdx = 0;
      startLevel();
    }
  }

  /* ================= M4 海军模式 ================= */
  // mulberry32：确定性伪随机（日期种子）
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var M4_PLAINS = [
    'U BOAT SIGHTED', 'CONVOY NORTH', 'TORPEDO AWAY',
    'SUBMARINE DOWN', 'HUNT THE WOLF', 'SECRET NAVAL CODE',
    'KRIEGSMARINE', 'ATLANTIC WOLVES', 'BISMARCK SAILING'
  ];
  var m4 = {
    staticR: 'BETA', refl: 'B', rotors: ['VI', 'VII', 'VIII'],
    // pos: [静转子(固定0), 左, 中, 右]——4 元素对齐 4 转子路径
    pos: [0, 0, 0, 0], seed: [0, 0, 0, 0], plain: '', cipher: '', started: false
  };

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function m4Order() { return [m4.staticR].concat(m4.rotors); }

  function startM4() {
    stopTimer();
    bodyEl.innerHTML = m4Html;
    var d = new Date();
    document.getElementById('m4-date').textContent = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    document.getElementById('m4-refl').value = m4.refl;
    document.getElementById('m4-static').value = m4.staticR;
    document.getElementById('m4-refl').addEventListener('change', function () {
      m4.refl = this.value;
      updateM4Cipher();
    });
    document.getElementById('m4-static').addEventListener('change', function () {
      m4.staticR = this.value;
      updateM4Cipher();
    });
    document.getElementById('m4-go').addEventListener('click', doM4Decrypt);
    document.getElementById('m4-show').addEventListener('click', showM4Key);
    buildM4Rotors();
    generateM4Daily();
  }

  /* 生成每日密文：日期种子选明文 + 随机转子/位置（当日固定） */
  function generateM4Daily() {
    var rnd = mulberry32(todaySeed());
    var idx2 = Math.floor(rnd() * M4_PLAINS.length);
    m4.plain = M4_PLAINS[idx2].replace(/ /g, '');
    var rset = ['VI', 'VII', 'VIII'];
    // 洗牌
    for (var i = rset.length - 1; i > 0; i--) {
      var j2 = Math.floor(rnd() * (i + 1));
      var t2 = rset[i]; rset[i] = rset[j2]; rset[j2] = t2;
    }
    m4.rotors = rset;
    m4.seed = [0, Math.floor(rnd() * 26), Math.floor(rnd() * 26), Math.floor(rnd() * 26)];
    m4.pos = [0, 0, 0, 0]; // 玩家从 0 开始拨（静转子固定 0）
    m4.refl = rnd() < 0.5 ? 'B' : 'C';
    m4.staticR = rnd() < 0.5 ? 'BETA' : 'GAMMA';
    document.getElementById('m4-refl').value = m4.refl;
    document.getElementById('m4-static').value = m4.staticR;
    m4.cipher = transform(m4.plain, m4Order(), m4.seed, identityPlug(), m4.refl);
    m4.started = true;
    document.getElementById('m4-hint').textContent =
      T('gs.enigma.m4Hint2').replace('{a}', m4.plain.length).replace('{b}', m4.rotors.join('-')).replace('{c}', m4.staticR);
    document.getElementById('m4-cipher').textContent = m4.cipher;
    document.getElementById('m4-key').textContent = '····';
    document.getElementById('m4-feedback').textContent = '';
    document.getElementById('m4-decrypt').textContent = T('gs.enigma.decryptWait');
    document.getElementById('m4-decrypt').style.color = '';
    renderM4Rotors();
    m4Start = Date.now();
    if (m4Tick) clearInterval(m4Tick);
    m4Tick = setInterval(function () {
      var el = document.getElementById('m4-timer');
      if (el) el.textContent = m4Elapsed() + 's';
    }, 500);
  }
  var m4Start = 0, m4Tick = null;
  function m4Elapsed() { return Math.round((Date.now() - m4Start) / 1000); }
  function stopM4Timer() { if (m4Tick) { clearInterval(m4Tick); m4Tick = null; } }

  function buildM4Rotors() {
    var box = document.getElementById('m4-rotors');
    box.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('div');
      d.className = 'en-rotor';
      d.setAttribute('data-slot', i);
      d.innerHTML =
        '<div class="rl">' + T('gs.enigma.rotorLbl').replace('{n}', POS_NAMES[i]) + '</div>' +
        '<div class="rletter" data-role="letter">A</div>' +
        '<div class="rrow">' +
        '  <button class="mode-btn" data-act="up" aria-label="' + T('gs.enigma.ariaDec') + '">▲</button>' +
        '  <button class="mode-btn" data-act="down" aria-label="' + T('gs.enigma.ariaInc') + '">▼</button>' +
        '</div>' +
        '<select data-role="type" aria-label="' + T('gs.enigma.ariaType') + '">' +
        '  <option value="VI">VI</option><option value="VII">VII</option><option value="VIII">VIII</option>' +
        '  <option value="IV">IV</option><option value="V">V</option>' +
        '</select>';
      box.appendChild(d);
      (function (slot, el) {
        el.querySelectorAll('[data-act]').forEach(function (b) {
          b.addEventListener('click', function () {
            // slot 0/1/2 对应 pos[1]/pos[2]/pos[3]（pos[0] 是静转子固定 0）
            m4.pos[slot + 1] = (m4.pos[slot + 1] + (this.getAttribute('data-act') === 'up' ? 25 : 1)) % 26;
            renderM4Rotors();
            if (Arcade.audio) Arcade.audio.play('move');
          });
        });
        el.querySelector('[data-role="type"]').addEventListener('change', function () {
          m4.rotors[slot] = this.value;
          updateM4Cipher(); // 换转子型号时同步重生成当日电文（修复：此前密文/密钥/提示失同步导致无解）
          renderM4Rotors();
          if (Arcade.audio) Arcade.audio.play('ui');
        });
      })(i, d);
    }
  }

  function renderM4Rotors() {
    var rotors = document.querySelectorAll('#m4-rotors .en-rotor');
    for (var i = 0; i < rotors.length; i++) {
      rotors[i].querySelector('[data-role="letter"]').textContent = A[m4.pos[i + 1]];
      rotors[i].querySelector('[data-role="type"]').value = m4.rotors[i];
    }
  }

  function updateM4Cipher() {
    if (!m4.started) return;
    m4.cipher = transform(m4.plain, m4Order(), m4.seed, identityPlug(), m4.refl);
    var el = document.getElementById('m4-cipher');
    if (el) el.textContent = m4.cipher;
  }

  function doM4Decrypt() {
    if (!m4.started) return;
    var out = transform(m4.cipher, m4Order(), m4.pos, identityPlug(), m4.refl);
    var ok = 0;
    var html = '';
    for (var i = 0; i < out.length; i++) {
      var good = out[i] === m4.plain[i];
      if (good) ok++;
      html += '<span style="color:' + (good ? 'var(--neon-green)' : 'var(--text-dim)') + '">' + out[i] + '</span>';
    }
    var decEl = document.getElementById('m4-decrypt');
    var fbEl = document.getElementById('m4-feedback');
    decEl.innerHTML = html;
    fbEl.textContent = T('gs.enigma.lettersOk').replace('{a}', ok).replace('{b}', m4.plain.length);
    if (Arcade.juice) Arcade.juice.select();
    if (ok === m4.plain.length) {
      fbEl.textContent = T('gs.enigma.m4Win').replace('{n}', m4Elapsed());
      decEl.style.color = 'var(--neon-green)';
      stopM4Timer();
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(m4Elapsed());
      if (Arcade.daily) Arcade.daily.markSolved('enigma', m4Elapsed());
    }
  }

  function showM4Key() {
    if (!m4.started) return;
    var el = document.getElementById('m4-key');
    var shown = el.textContent === '····' ? T('gs.enigma.m4KeyShow').replace('{a}', m4.staticR).replace('{b}', m4.rotors.join('-')).replace('{c}', A[m4.seed[1]] + A[m4.seed[2]] + A[m4.seed[3]]).replace('{d}', m4.refl) : '····';
    el.textContent = shown;
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ================= 限时截获战（3 分钟连续破译） ================= */
  var RAID_TIME = 180; // 秒
  var RAID_MSGS = [
    'WATCHTOWER', 'NIGHTFALL', 'IRONCROSS', 'BLACKOUT', 'FIRESTORM',
    'REDSKY', 'STORMFRONT', 'SILENTRUN', 'EAGLENEST', 'CODEGATE',
    'SHADOWFOX', 'TIN SOLDIER', 'BROKEN ARROW', 'DARK WATERS', 'LAST STAND'
  ];
  var raid = {
    running: false, timeLeft: RAID_TIME, score: 0, solved: 0,
    text: '', order: ['I', 'II', 'III'], seed: [0, 0, 0], plugs: [], cipher: '',
    pos: [0, 0, 0]
  };
  var raidTick = null;

  var raidHtml =
    '<div class="en-info">' +
    '  <span>' + T('gs.enigma.raidLeft') + '<span class="stat-value" id="raid-time" style="color:var(--neon-yellow)">180s</span></span>' +
    '  <span>' + T('gs.enigma.raidSolved').replace('{n}', '<span class="stat-value" id="raid-solved">0</span>') + '</span>' +
    '  <span>' + T('gs.enigma.raidScore') + '<span class="stat-value" id="raid-score">0</span></span>' +
    '</div>' +
    '<div class="en-hint" id="raid-hint">' + T('gs.enigma.raidHint') + '</div>' +
    '<div class="vg-label">' + T('gs.enigma.raidNo') + '<span id="raid-no">1</span></div>' +
    '<div class="en-output" id="raid-cipher" style="color:var(--neon-pink);text-shadow:0 0 8px rgba(255,45,149,.4)"></div>' +
    '<div class="en-rotors" id="raid-rotors"></div>' +
    '<div class="en-info"><span>' + T('gs.enigma.plugFixed').replace('{n}', '<b id="raid-plug"></b>') + '</span><span>' + T('gs.enigma.rotorColon') + '<b id="raid-order"></b></span></div>' +
    '<div class="vg-label">' + T('gs.enigma.decryptLbl') + '</div>' +
    '<div class="en-output" id="raid-decrypt" aria-live="polite">' + T('gs.enigma.decryptWait') + '</div>' +
    '<div class="en-feedback" id="raid-feedback"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="raid-go">' + T('gs.enigma.goBtn') + '</button>' +
    '  <button class="btn yellow" id="raid-skip">' + T('gs.enigma.skipBtn') + '</button>' +
    '</div>';

  function buildRaidRotors() {
    var box = document.getElementById('raid-rotors');
    box.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('div');
      d.className = 'en-rotor';
      d.setAttribute('data-slot', i);
      d.innerHTML =
        '<div class="rl">' + T('gs.enigma.rotorLbl').replace('{n}', POS_NAMES[i]) + '</div>' +
        '<div class="rletter" data-role="letter">A</div>' +
        '<div class="rrow">' +
        '  <button class="mode-btn" data-act="up" aria-label="' + T('gs.enigma.ariaDec') + '">▲</button>' +
        '  <button class="mode-btn" data-act="down" aria-label="' + T('gs.enigma.ariaInc') + '">▼</button>' +
        '</div>' +
        '<div class="en-info" style="font-size:10px">' + T('gs.enigma.rotorPosLbl').replace('{n}', POS_NAMES[i]) + '</div>';
      box.appendChild(d);
      (function (slot, el) {
        el.querySelectorAll('[data-act]').forEach(function (b) {
          b.addEventListener('click', function () {
            raid.pos[slot] = (raid.pos[slot] + (this.getAttribute('data-act') === 'up' ? 25 : 1)) % 26;
            renderRaidRotors();
            if (Arcade.audio) Arcade.audio.play('move');
          });
        });
      })(i, d);
    }
  }

  function renderRaidRotors() {
    var rotors = document.querySelectorAll('#raid-rotors .en-rotor');
    for (var i = 0; i < rotors.length; i++) {
      rotors[i].querySelector('[data-role="letter"]').textContent = A[raid.pos[i]];
    }
  }

  /* 生成一份新截获电文（随机转子顺序+插线板+正确位置） */
  function raidNext() {
    var msg = RAID_MSGS[Math.floor(Math.random() * RAID_MSGS.length)].replace(/ /g, '');
    var names = ['I', 'II', 'III', 'IV', 'V'];
    // 洗牌选 3
    for (var i = names.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = names[i]; names[i] = names[j]; names[j] = t;
    }
    raid.text = msg;
    raid.order = [names[0], names[1], names[2]];
    raid.seed = [Math.floor(Math.random() * 26), Math.floor(Math.random() * 26), Math.floor(Math.random() * 26)];
    raid.pos = [0, 0, 0];
    // 随机 0-2 组插线板
    raid.plugs = [];
    var used = {};
    var nPlug = Math.floor(Math.random() * 3);
    var guard = 0;
    while (raid.plugs.length < nPlug && guard++ < 30) {
      var a = A[Math.floor(Math.random() * 26)], b = A[Math.floor(Math.random() * 26)];
      if (a === b || used[a] || used[b]) continue;
      used[a] = true; used[b] = true;
      raid.plugs.push([a, b]);
    }
    raid.cipher = transform(raid.text, raid.order, raid.seed, buildPlug(raid.plugs));
    document.getElementById('raid-cipher').textContent = raid.cipher;
    document.getElementById('raid-plug').textContent = plugLabel(raid.plugs);
    document.getElementById('raid-order').textContent = raid.order.join('-');
    document.getElementById('raid-no').textContent = (raid.solved + 1);
    document.getElementById('raid-decrypt').textContent = T('gs.enigma.decryptWait');
    document.getElementById('raid-decrypt').style.color = '';
    document.getElementById('raid-feedback').textContent = '';
    renderRaidRotors();
  }

  function doRaidDecrypt() {
    if (!raid.running) return;
    var out = transform(raid.cipher, raid.order, raid.pos, buildPlug(raid.plugs));
    var ok = 0;
    var html = '';
    for (var i = 0; i < out.length; i++) {
      var good = out[i] === raid.text[i];
      if (good) ok++;
      html += '<span style="color:' + (good ? 'var(--neon-green)' : 'var(--text-dim)') + '">' + out[i] + '</span>';
    }
    var decEl = document.getElementById('raid-decrypt');
    var fbEl = document.getElementById('raid-feedback');
    decEl.innerHTML = html;
    fbEl.textContent = T('gs.enigma.lettersOk').replace('{a}', ok).replace('{b}', raid.text.length);
    if (Arcade.juice) Arcade.juice.select();
    if (ok === raid.text.length) {
      raid.score += 10;
      raid.solved++;
      document.getElementById('raid-score').textContent = raid.score;
      document.getElementById('raid-solved').textContent = raid.solved;
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.audio) Arcade.audio.play('win');
      setTimeout(raidNext, 500);
    }
  }

  function raidSkip() {
    if (!raid.running) return;
    if (Arcade.audio) Arcade.audio.play('ui');
    raidNext();
  }

  function startRaid() {
    stopTimer();
    stopM4Timer();
    if (raidTick) clearInterval(raidTick);
    bodyEl.innerHTML = raidHtml;
    raid.running = true;
    raid.timeLeft = RAID_TIME;
    raid.score = 0;
    raid.solved = 0;
    document.getElementById('raid-time').textContent = RAID_TIME + 's';
    document.getElementById('raid-solved').textContent = '0';
    document.getElementById('raid-score').textContent = '0';
    document.getElementById('raid-go').addEventListener('click', doRaidDecrypt);
    document.getElementById('raid-skip').addEventListener('click', raidSkip);
    buildRaidRotors();
    raidNext();
    raidTick = setInterval(function () {
      if (document.hidden) return; // 切后台暂停倒计时（避免隐藏时 raid 被耗尽）
      raid.timeLeft--;
      var el = document.getElementById('raid-time');
      if (el) {
        el.textContent = raid.timeLeft + 's';
        el.style.color = raid.timeLeft <= 30 ? 'var(--neon-pink)' : 'var(--neon-yellow)';
      }
      if (raid.timeLeft <= 0) endRaid();
    }, 1000);
  }

  function endRaid() {
    if (!raid.running) return;
    raid.running = false;
    if (raidTick) { clearInterval(raidTick); raidTick = null; }
    /* 记分修复（A2）：轰炸小游戏是「越高越好」的分数，不能写入本页
       bestMode=min（秒数）的主最佳记录——改用独立键 arcade_best_enigma-raid */
    if (Arcade.storage) Arcade.storage.submitBest('enigma-raid', raid.score, 'max');
    if (Arcade.ui) Arcade.ui.toast(T('gs.enigma.raidTimeUp').replace('{n}', raid.score), 'warn');
    document.getElementById('raid-feedback').textContent =
      T('gs.enigma.raidEnd').replace('{a}', raid.solved).replace('{b}', raid.score);
    if (Arcade.fx) Arcade.fx.flash('var(--neon-pink)');
    // 重开按钮：把「解密」当重开（时间耗尽后点击重新开始）
    document.getElementById('raid-go').onclick = startRaid;
  }

  function startLevel() {
    stopTimer();
    var lv = LEVELS[levelIdx];
    order = lv.order.slice();
    pos = lv.seed.slice();   // 初始即正确位置——挑战里玩家拨乱它再找回来？
    // 不对：挑战应该从随机位置开始找。改为从非目标位置起步：
    pos = [0, 0, 0];
    pluggedPairs = [];
    plugPicked = null;
    hintCount = 0;
    cipherEl.textContent = transform(lv.text, lv.order, lv.seed, buildPlug(lv.plugs));
    levelHintEl.innerHTML = T('gs.enigma.lvHint').replace('{a}', lv.hint).replace('{b}', lv.order.join('-')).replace('{c}', plugLabel(lv.plugs)).replace('{d}', lv.text.length);
    decryptEl.textContent = T('gs.enigma.decryptWait');
    decryptEl.style.color = '';
    feedbackEl.textContent = '';
    levelEl.textContent = (levelIdx + 1) + '/3';
    renderRotors();
    renderPlugRow();
    challengeStart = Date.now();
    timerEl.textContent = '0s';
    timerTick = setInterval(updateTimer, 500);
  }

  function updateTimer() {
    if (timerEl) timerEl.textContent = elapsed() + 's';
  }
  function elapsed() {
    return Math.round((Date.now() - challengeStart) / 1000);
  }
  function stopTimer() {
    if (timerTick) { clearInterval(timerTick); timerTick = null; }
  }

  /* 挑战：用当前转子位置解密密文，反馈每字母对错 */
  function doDecrypt() {
    var lv = LEVELS[levelIdx];
    var plug = buildPlug(lv.plugs);
    var out = transform(cipherEl.textContent, order, pos, plug);
    var ok = 0;
    var html = '';
    for (var i = 0; i < out.length; i++) {
      var good = out[i] === lv.text[i];
      if (good) ok++;
      html += '<span style="color:' + (good ? 'var(--neon-green)' : 'var(--text-dim)') + '">' + out[i] + '</span>';
    }
    decryptEl.innerHTML = html;
    feedbackEl.textContent = T('gs.enigma.lettersOk').replace('{a}', ok).replace('{b}', lv.text.length) + (hintCount ? T('gs.enigma.hintPenalty').replace('{n}', hintCount * 10) : '');
    if (Arcade.juice) Arcade.juice.select();
    if (ok === lv.text.length) {
      feedbackEl.textContent = T('gs.enigma.chalWin').replace('{n}', elapsed());
      decryptEl.style.color = 'var(--neon-green)';
      stopTimer();
      if (Arcade.juice) Arcade.juice.win();
      var finalSec = elapsed() + hintCount * 10; // 每次提示 +10s（修复固定 +10s 与教程不符）
      if (Arcade.shell) Arcade.shell.submitScore(finalSec);
      // 下一关 / 通关结算（模式切换守卫：仅当仍在本模式时推进）
      setTimeout(function () {
        if (freeMode) return; /* 模式切换守卫（E2E 评审修复：原引用未定义变量 mode） */
        if (levelIdx < LEVELS.length - 1) {
          levelIdx++;
          startLevel();
          if (Arcade.ui) Arcade.ui.toast(T('gs.enigma.nextLevel').replace('{n}', levelIdx + 1), 'win');
        } else {
          if (Arcade.ui) Arcade.ui.toast(T('gs.enigma.allDone'), 'win');
          levelIdx = 0;
          startLevel();
        }
      }, 900);
    }
  }

  /* 提示：亮出当前关某个未正确转子的字母（+10s 惩罚） */
  function useHint() {
    var lv = LEVELS[levelIdx];
    var wrong = [];
    for (var i = 0; i < 3; i++) if (pos[i] !== lv.seed[i]) wrong.push(i);
    if (!wrong.length) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.enigma.noWrong'), 'warn');
      return;
    }
    var slot = wrong[Math.floor(Math.random() * wrong.length)];
    pos[slot] = lv.seed[slot];
    hintCount++; // 每次提示 +10s（与教程一致）
    renderRotors();
    if (Arcade.audio) Arcade.audio.play('coin');
    if (Arcade.fx) Arcade.fx.burst(window.innerWidth / 2, 120, 'var(--neon-yellow)', 10);
    feedbackEl.textContent = T('gs.enigma.hintShown').replace('{n}', POS_NAMES[slot]);
  }

  /* 自由模式：输入即变换 */
  function runFreeTransform() {
    if (!inputEl) return;
    var v = inputEl.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (v.length !== inputEl.value.replace(/[^A-Za-z]/g, '').length) {
      inputEl.value = v;
    }
    if (!v) { outputEl.textContent = T('gs.enigma.waiting'); return; }
    var plug = buildPlug(pluggedPairs);
    outputEl.textContent = transform(v, order, pos.slice(), plug);
    if (Arcade.audio) Arcade.audio.play('type');
  }

  /* ---------- 事件绑定 ---------- */
  var tabs = root.querySelectorAll('.en-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }

  var rotors = root.querySelectorAll('.en-rotor');
  for (var j = 0; j < rotors.length; j++) {
    (function (slot, el) {
      el.querySelectorAll('[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (Arcade.audio) Arcade.audio.play('move');
          pos[slot] = (pos[slot] + (this.getAttribute('data-act') === 'up' ? 25 : 1)) % 26;
          renderRotors();
          if (freeMode) runFreeTransform();
        });
      });
      el.querySelector('[data-role="type"]').addEventListener('change', function () {
        order[slot] = this.value;
        renderRotors();
        if (freeMode) runFreeTransform();
      });
    })(j, rotors[j]);
  }

  inputEl.addEventListener('input', runFreeTransform);
  renderRotors();
  renderPlugRow();
  runFreeTransform();

  /* ---------- 重开 ---------- */
  window.GAME_RESTART = function () {
    stopTimer();
    stopM4Timer();
    if (raidTick) { clearInterval(raidTick); raidTick = null; }
    freeMode = true;
    var tabs = root.querySelectorAll('.en-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === 'free');
    order = ['I', 'II', 'III'];
    pos = [0, 0, 0];
    pluggedPairs = [];
    plugPicked = null;
    bodyEl.innerHTML = freeHtml;
    inputEl = document.getElementById('en-input');
    outputEl = document.getElementById('en-output');
    inputEl.addEventListener('input', runFreeTransform);
    renderRotors();
    renderPlugRow();
    runFreeTransform();
  };

  /* 挑战关卡自动教程只弹一次 */

})();
