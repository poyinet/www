/* ============================================================
   破译战役 Campaign · 密码学闯关（旗舰级）
   9 关递进，覆盖密码破译史：
   凯撒 → 仿射 → 栅栏 → 维吉尼亚 → 替换 → Playfair → 简化恩尼格玛
   每关程序化生成密文（保证每次不同但必可解），剧情串联二战谍报行动
   记分：总用时（秒，min 模式），破关越多用时越少分越高
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.campaign.tut1t'), d: T('gs.campaign.tut1') },
  { t: T('gs.campaign.tut2t'), d: T('gs.campaign.tut2') },
  { t: T('gs.campaign.tut3t'), d: T('gs.campaign.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var idx = function (c) { return c.charCodeAt(0) - 65; };

  /* 密码类型名（LEVELS 内为中文数据，显示处经 T 映射为多语言） */
  var TYPE_KEY = {
    '凯撒密码': 'gs.campaign.typeCaesar',
    '仿射密码': 'gs.campaign.typeAffine',
    '栅栏密码': 'gs.campaign.typeRail',
    '维吉尼亚': 'gs.campaign.typeVigenere',
    '单表替换': 'gs.campaign.typeSub',
    'Playfair': 'gs.campaign.typePlayfair',
    '恩尼格玛': 'gs.campaign.typeEnigma',
    'ADFGVX': 'gs.campaign.typeAdfgvx',
    'Bifid': 'gs.campaign.typeBifid'
  };

  /* ================= 密码算法（全部可逆） ================= */
  function caesarEnc(s, k) {
    return s.split('').map(function (c) {
      return A[(idx(c) + k + 26) % 26];
    }).join('');
  }
  function affineEnc(s, a, b) {
    return s.split('').map(function (c) {
      return A[(a * idx(c) + b) % 26];
    }).join('');
  }
  function railFenceEnc(s, rails) {
    if (rails <= 1) return s;
    var rows = [];
    for (var i = 0; i < rails; i++) rows.push([]);
    var r = 0, dir = 1;
    for (var j = 0; j < s.length; j++) {
      rows[r].push(s[j]);
      r += dir;
      if (r === rails - 1) dir = -1;
      if (r === 0) dir = 1;
    }
    var out = '';
    for (var k = 0; k < rails; k++) out += rows[k].join('');
    return out;
  }
  function vigenereEnc(s, key) {
    return s.split('').map(function (c, i) {
      return A[(idx(c) + idx(key[i % key.length])) % 26];
    }).join('');
  }
  function substitutionEnc(s, map) {
    // map: 26 字母的置换（明文→密文）
    return s.split('').map(function (c) {
      return map[idx(c)];
    }).join('');
  }

  /* Playfair（复用：5x5 方阵 + 配对） */
  function playfairGrid(keyword) {
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
    var pos = {};
    for (var k = 0; k < 25; k++) pos[seq[k]] = k;
    return { grid: seq, pos: pos };
  }
  function playfairEnc(keyword, text) {
    var g = playfairGrid(keyword);
    var letters = [];
    var t = text.toUpperCase().replace(/[^A-Z]/g, '');
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i) - 65;
      if (c === 9) c = 8;
      letters.push(c);
    }
    var pairs = [], i2 = 0;
    while (i2 < letters.length) {
      var a = letters[i2];
      var b = (i2 + 1 < letters.length) ? letters[i2 + 1] : -1;
      if (b === -1) { pairs.push([a, 23]); i2++; }
      else if (a === b) { pairs.push([a, 23]); i2++; }
      else { pairs.push([a, b]); i2 += 2; }
    }
    var out = '';
    pairs.forEach(function (p) {
      var pa = g.pos[p[0]], pb = g.pos[p[1]];
      var ra = Math.floor(pa / 5), ca = pa % 5, rb = Math.floor(pb / 5), cb = pb % 5;
      var r = [0, 0];
      if (ra === rb) { r[0] = g.grid[ra * 5 + ((ca + 1) % 5)]; r[1] = g.grid[rb * 5 + ((cb + 1) % 5)]; }
      else if (ca === cb) { r[0] = g.grid[((ra + 1) % 5) * 5 + ca]; r[1] = g.grid[((rb + 1) % 5) * 5 + cb]; }
      else { r[0] = g.grid[ra * 5 + cb]; r[1] = g.grid[rb * 5 + ca]; }
      out += A[r[0]] + A[r[1]];
    });
    return out;
  }

  /* 简化恩尼格玛（闯关版：3 转子固定顺序，无插线板，转子步进简化） */
  var ROTORS = {
    I:   { w: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 16 },
    II:  { w: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 4 },
    III: { w: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 21 }
  };
  var REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  function rotorFwd(x, r, pos) { var c = r.w[(x + pos) % 26]; return (idx(c) - pos + 26) % 26; }
  function rotorRev(x, r, pos) { var c = A[(x + pos) % 26]; var i = r.w.indexOf(c); return (i - pos + 26) % 26; }
  function enigmaEnc(rotorNames, startPos, text) {
    var pos = startPos.slice();
    var out = '';
    for (var i = 0; i < text.length; i++) {
      // 双步进
      var n1 = ROTORS[rotorNames[1]].notch, n2 = ROTORS[rotorNames[2]].notch;
      if (pos[1] === n1) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
      else if (pos[2] === n2) { pos[1] = (pos[1] + 1) % 26; }
      pos[2] = (pos[2] + 1) % 26;
      var x = idx(text[i]);
      x = rotorFwd(x, ROTORS[rotorNames[2]], pos[2]);
      x = rotorFwd(x, ROTORS[rotorNames[1]], pos[1]);
      x = rotorFwd(x, ROTORS[rotorNames[0]], pos[0]);
      x = idx(REFLECTOR[x]);
      x = rotorRev(x, ROTORS[rotorNames[0]], pos[0]);
      x = rotorRev(x, ROTORS[rotorNames[1]], pos[1]);
      x = rotorRev(x, ROTORS[rotorNames[2]], pos[2]);
      out += A[x];
    }
    return out;
  }

  /* ADFGVX：Polybius 6×6 替换 + 列换位（一战德军） */
  var ADFGVX_SYMS = 'ADFGVX';
  function adfgvxTable(keyword) {
    var seen = {}, seq = [];
    var kw = (keyword || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < kw.length; i++) {
      var ch = kw[i];
      if (!seen[ch]) { seen[ch] = true; seq.push(ch); }
    }
    var all = A + '0123456789';
    for (var j = 0; j < all.length; j++) {
      var c = all[j];
      if (!seen[c]) { seen[c] = true; seq.push(c); }
    }
    return seq;
  }
  function adfgvxEnc(keyword, text) {
    var table = adfgvxTable(keyword);
    var t = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    var syms = '';
    for (var i = 0; i < t.length; i++) {
      var p = table.indexOf(t[i]);
      syms += ADFGVX_SYMS[Math.floor(p / 6)] + ADFGVX_SYMS[p % 6];
    }
    return syms;
  }
  function adfgvxColEnc(syms, key) {
    var cols = key.length;
    var rows = Math.ceil(syms.length / cols);
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
        var v = syms[rr * cols + cidx];
        if (v) out += v;
      }
    }
    return out;
  }
  function adfgvxColDec(syms, key) {
    var cols = key.length;
    var rows = Math.ceil(syms.length / cols);
    var colOrder = [];
    for (var j = 0; j < cols; j++) colOrder.push(j);
    colOrder.sort(function (a, b) {
      var ca = key[a], cb = key[b];
      return ca < cb ? -1 : (ca > cb ? 1 : a - b);
    });
    var colLens = [];
    var base = Math.floor(syms.length / cols);
    var extra = syms.length % cols;
    for (var c = 0; c < cols; c++) colLens[c] = base + (c < extra ? 1 : 0);
    var grid = [];
    for (var r = 0; r < rows; r++) grid.push(new Array(cols).fill(''));
    var p = 0;
    for (var k = 0; k < colOrder.length; k++) {
      var cidx = colOrder[k];
      for (var rr = 0; rr < colLens[cidx]; rr++) grid[rr][cidx] = syms[p++];
    }
    var out = '';
    for (var rr2 = 0; rr2 < rows; rr2++) {
      for (var cc = 0; cc < cols; cc++) if (grid[rr2][cc]) out += grid[rr2][cc];
    }
    return out;
  }
  function adfgvxFullEnc(keyword, key, text) {
    return adfgvxColEnc(adfgvxEnc(keyword, text), key);
  }
  function adfgvxFullDec(keyword, key, syms) {
    var t = adfgvxColDec(syms, key);
    var table = adfgvxTable(keyword);
    var out = '';
    for (var i = 0; i + 1 < t.length; i += 2) {
      var r = ADFGVX_SYMS.indexOf(t[i]), c = ADFGVX_SYMS.indexOf(t[i + 1]);
      out += table[r * 6 + c];
    }
    return out;
  }

  /* Bifid：Polybius 5×5 方格 + 行列重组（二战前的经典双字谜） */
  function bifidTable(keyword) {
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
  function bifidEnc(keyword, text) {
    var table = bifidTable(keyword);
    var t = text.toUpperCase().replace(/[^A-Z]/g, '');
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

  /* ================= 关卡定义 =================
     每关：title 标题 / story 剧情 / type 密码类型 / hint 线索 /
     gen() 返回 {cipher, answer, tool(可选工具配置)} */
  var LEVELS = [
    {
      title: '第一封电报', type: '凯撒密码',
      story: '1940 年，盟军截获第一封德军电文。它只用最简单的凯撒移位加密——偏移量藏在电文开头。',
      gen: function () {
        var words = ['ATTACK AT DAWN', 'NIGHT RAID SOON', 'CONVOY LEAVING'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var k = 3 + Math.floor(Math.random() * 20);
        return { cipher: caesarEnc(plain, k), answer: plain, tool: { type: 'caesar', k: k } };
      },
      hint: '用下方滑块试所有偏移量，直到看到通顺英文。'
    },
    {
      title: '双倍加密', type: '仿射密码',
      story: '德军开始用乘法加偏移的双重变换（仿射密码）。两个参数 a、b 分别藏在线索里。',
      gen: function () {
        var words = ['STORM FRONT', 'RED ALERT', 'IRON CROSS'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var a = 5, b = 8;
        return { cipher: affineEnc(plain, a, b), answer: plain, tool: { type: 'affine', a: a, b: b } };
      },
      hint: '仿射：新字母 = a×原字母 + b (mod 26)。本题 a=5, b=8，用下方工具试解。'
    },
    {
      title: '之字铁路', type: '栅栏密码',
      story: '情报员开始用「之字形」栅栏换位——不是替换字母，而是打乱顺序。',
      gen: function () {
        var words = ['CODE RED', 'FOX ONE', 'GREEN LIGHT'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var rails = 3;
        return { cipher: railFenceEnc(plain, rails), answer: plain, tool: { type: 'rail', rails: rails } };
      },
      hint: '栅栏换位：按之字形把字母分到 3 条轨道再横向读出。把密文按轨道数重新排列即可还原。'
    },
    {
      title: '双表密码', type: '维吉尼亚',
      story: '单一替换已被破解，德军改用多表维吉尼亚——每个位置用不同的字母表。密钥是一个词。',
      gen: function () {
        var words = ['DEAD DROP', 'SAFE HOUSE', 'BLACK OUT'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var key = 'KEY';
        return { cipher: vigenereEnc(plain, key), answer: plain, tool: { type: 'vigenere', key: key } };
      },
      hint: '维吉尼亚：明文字母 - 密钥字母(循环) = 明文字母。密钥是 KEY，用下方工具逐字母解密。'
    },
    {
      title: '打乱字母表', type: '单表替换',
      story: '德军定期更换字母映射表。这次的置换藏在截获的日程里。',
      gen: function () {
        var words = ['MIDNIGHT', 'SILENT RUN', 'EAGLE NEST'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var map = ['Z','Y','X','W','V','U','T','S','R','Q','P','O','N','M','L','K','J','I','H','G','F','E','D','C','B','A'];
        return { cipher: substitutionEnc(plain, map), answer: plain, tool: { type: 'sub', map: map } };
      },
      hint: '单表替换：这次是字母表完全反转（A↔Z, B↔Y…）。把每个密文字母反转即可。'
    },
    {
      title: '方形密码', type: 'Playfair',
      story: '英军自己的 Playfair 密码也落入敌手——密钥词是「BATTLE」。',
      gen: function () {
        var words = ['COUNTER ATTACK', 'HOLD THE LINE', 'SECRET WEAPON'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var key = 'BATTLE';
        return { cipher: playfairEnc(key, plain), answer: plain, tool: { type: 'playfair', key: key } };
      },
      hint: 'Playfair 双字母密码，密钥词 BATTLE。将明文两两分组：同行右移、同列下移、矩形对角互换。'
    },
    {
      title: '终极密码机', type: '恩尼格玛',
      story: '最终情报来自德军恩尼格玛机。转子 I-II-III、初始位置 AAA——盟军密码员已经拿到了设置表。',
      gen: function () {
        var words = ['OPERATION OVERLORD', 'NORMANDY LANDING', 'FINAL OFFENSIVE'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var rotors = ['I', 'II', 'III'], pos = [0, 0, 0];
        return { cipher: enigmaEnc(rotors, pos, plain), answer: plain, tool: { type: 'enigma', rotors: rotors, pos: pos } };
      },
      hint: '恩尼格玛对称：加密=解密。转子 I-II-III、位置 AAA，用下方模拟机把密文「再加密一次」即还原明文。'
    },
    {
      title: '双轨密文', type: 'ADFGVX',
      story: '1918 年，德军启用了 ADFGVX——双层密码：先把字母替换成 ADFGVX 符号，再按密钥列换位。',
      gen: function () {
        var words = ['IRON FRONT', 'RED FORTRESS', 'LAST SALVO'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var kw = 'GAS', key = 'HARBOR';
        var syms = adfgvxEnc(kw, plain);
        var cipher = adfgvxColEnc(syms, key);
        return { cipher: cipher, answer: plain, tool: { type: 'adfgvx', kw: kw, key: key } };
      },
      hint: 'ADFGVX 双层：先用密钥词 GAS 建 6×6 方阵替换成 ADFGVX 符号对，再用密钥 HARBOR 列换位。下方工具给出完整解密。'
    },
    {
      title: '方格重组', type: 'Bifid',
      story: '一战前的 Bifid 密码：把字母换成 5×5 方格坐标，行列数字重组后还原——解密需要同样的重组。',
      gen: function () {
        var words = ['CODEWHEEL', 'CRYPTOLOGY', 'BLACKCHAMBER'];
        var plain = words[Math.floor(Math.random() * words.length)].replace(/ /g, '');
        var kw = 'POLYBIUS';
        return { cipher: bifidEnc(kw, plain), answer: plain, tool: { type: 'bifid', kw: kw } };
      },
      hint: 'Bifid：密钥 POLYBIUS 建 5×5 方格（I/J 合并）。每个字母换成行列坐标，先横排再重组，下方工具直接给出答案。'
    }
  ];

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var html =
    '<div class="bc-top">' +
    '  <span>' + T('gs.campaign.level') + ' <span class="stat-value" id="bc-level">1</span>/' + LEVELS.length + '</span>' +
    '  <span>' + T('gs.campaign.time') + ' <span class="stat-value" id="bc-timer">0s</span></span>' +
    '  <span>' + T('gs.campaign.totalTime') + ' <span class="stat-value" id="bc-total">0s</span></span>' +
    '</div>' +
    '<div class="bc-progress" id="bc-progress"></div>' +
    '<div class="bc-story" id="bc-story"></div>' +
    '<div class="bc-info" id="bc-info"></div>' +
    '<div class="bc-cipher" id="bc-cipher"></div>' +
    '<div class="bc-hint" id="bc-hint"></div>' +
    '<div id="bc-tool"></div>' +
    '<div class="bc-info" style="margin-top:10px"><span>' + T('gs.campaign.enterPlain') + '</span></div>' +
    '<input class="bc-input" id="bc-answer" maxlength="30" placeholder="' + T('gs.campaign.plainPh') + '" aria-label="' + T('gs.campaign.plainAria') + '">' +
    '<div class="bc-msg" id="bc-msg" aria-live="polite"></div>' +
    '<div class="game-controls"><button class="btn green" id="bc-go">' + T('gs.campaign.submit') + '</button></div>' +
    '<div class="bc-overlay hidden" id="bc-overlay">' +
    '  <div class="bc-modal">' +
    '    <h2 id="bc-ov-title"></h2>' +
    '    <p id="bc-ov-text"></p>' +
    '    <div class="game-controls"><button class="btn green" id="bc-ov-btn"></button></div>' +
    '  </div>' +
    '</div>';

  root.innerHTML = html;

  var levelEl = document.getElementById('bc-level');
  var timerEl = document.getElementById('bc-timer');
  var totalEl = document.getElementById('bc-total');
  var progressEl = document.getElementById('bc-progress');
  var storyEl = document.getElementById('bc-story');
  var infoEl = document.getElementById('bc-info');
  var cipherEl = document.getElementById('bc-cipher');
  var hintEl = document.getElementById('bc-hint');
  var toolEl = document.getElementById('bc-tool');
  var answerEl = document.getElementById('bc-answer');
  var msgEl = document.getElementById('bc-msg');
  var goBtn = document.getElementById('bc-go');
  var overlayEl = document.getElementById('bc-overlay');
  var ovTitle = document.getElementById('bc-ov-title');
  var ovText = document.getElementById('bc-ov-text');
  var ovBtn = document.getElementById('bc-ov-btn');

  var levelIdx = 0;
  var totalMs = 0;
  var levelStart = 0;
  var timerTick = null;
  var current = null;

  /* ---------- 工具渲染 ---------- */
  function buildTool(tool) {
    toolEl.innerHTML = '';
    if (!tool) return;
    if (tool.type === 'caesar') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolCaesar') + '</div>' +
        '<input type="range" id="bc-t-range" min="0" max="25" value="0" style="width:220px">' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      var r = document.getElementById('bc-t-range');
      var out = document.getElementById('bc-t-out');
      function upd() {
        out.textContent = T('gs.campaign.shift').replace('{n}', r.value) + ' → ' + caesarEnc(current.cipher, (26 - (+r.value)) % 26);
      }
      r.addEventListener('input', upd);
      upd();
    } else if (tool.type === 'affine') {
      // 逆仿射：a 的逆元 × (密文 - b)
      function invA(a) { for (var i = 1; i < 26; i++) if ((a * i) % 26 === 1) return i; return 1; }
      var ai = invA(tool.a);
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolAffine').replace('{a}', tool.a).replace('{b}', tool.b).replace('{i}', ai) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + current.cipher.split('').map(function (c) {
        var x = (idx(c) - tool.b + 26) % 26;
        return A[(ai * x) % 26];
      }).join('');
    } else if (tool.type === 'rail') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolRail').replace('{n}', tool.rails) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      // 解密：按轨道长度还原
      var n = current.cipher.length, rails = tool.rails;
      var rows = [], sizes = [];
      var rIdx = 0, dir = 1;
      for (var i = 0; i < n; i++) { sizes[rIdx] = (sizes[rIdx] || 0) + 1; rIdx += dir; if (rIdx === rails - 1) dir = -1; if (rIdx === 0) dir = 1; }
      var pos2 = 0;
      for (var k = 0; k < rails; k++) {
        var seg = '';
        for (var m = 0; m < (sizes[k] || 0); m++) seg += current.cipher[pos2++];
        rows.push(seg);
      }
      var ptr = rows.map(function () { return 0; });
      var out2 = '';
      var rr = 0, dd = 1;
      for (var j = 0; j < n; j++) {
        out2 += rows[rr][ptr[rr]++];
        rr += dd;
        if (rr === rails - 1) dd = -1;
        if (rr === 0) dd = 1;
      }
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + out2;
    } else if (tool.type === 'vigenere') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolVigenere').replace('{k}', tool.key) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + current.cipher.split('').map(function (c, i) {
        return A[(idx(c) - idx(tool.key[i % tool.key.length]) + 26) % 26];
      }).join('');
    } else if (tool.type === 'sub') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolSub') + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      var rev = {};
      for (var q = 0; q < 26; q++) rev[tool.map[q]] = A[q];
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + current.cipher.split('').map(function (c) {
        return rev[c];
      }).join('');
    } else if (tool.type === 'playfair') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolPlayfair').replace('{k}', tool.key) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      // 复用 playfairEnc：密文再加密（对称？不——Playfair 解密需反向移动）
      var g = playfairGrid(tool.key);
      var t = current.cipher.split('');
      var pairs = [];
      for (var pi = 0; pi + 1 < t.length; pi += 2) pairs.push([idx(t[pi]), idx(t[pi + 1])]);
      var out3 = '';
      pairs.forEach(function (p) {
        var pa = g.pos[p[0]], pb = g.pos[p[1]];
        var ra = Math.floor(pa / 5), ca = pa % 5, rb = Math.floor(pb / 5), cb = pb % 5;
        var r = [0, 0];
        if (ra === rb) { r[0] = g.grid[ra * 5 + ((ca - 1 + 5) % 5)]; r[1] = g.grid[rb * 5 + ((cb - 1 + 5) % 5)]; }
        else if (ca === cb) { r[0] = g.grid[((ra - 1 + 5) % 5) * 5 + ca]; r[1] = g.grid[((rb - 1 + 5) % 5) * 5 + cb]; }
        else { r[0] = g.grid[ra * 5 + cb]; r[1] = g.grid[rb * 5 + ca]; }
        out3 += A[r[0]] + A[r[1]];
      });
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + out3.replace(/X/g, '') + T('gs.campaign.playfairNote');
    } else if (tool.type === 'enigma') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolEnigma').replace('{r}', tool.rotors.join('-')).replace('{p}', tool.pos.join('')) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + enigmaEnc(tool.rotors, tool.pos.slice(), current.cipher);
    } else if (tool.type === 'adfgvx') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolAdfgvx').replace('{a}', tool.kw).replace('{b}', tool.key) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + adfgvxFullDec(tool.kw, tool.key, current.cipher);
    } else if (tool.type === 'bifid') {
      toolEl.innerHTML =
        '<div class="bc-info">' + T('gs.campaign.toolBifid').replace('{k}', tool.kw) + '</div>' +
        '<div class="bc-cipher" id="bc-t-out" style="font-size:13px;color:var(--neon-yellow)"></div>';
      // Bifid 解密：把密文转坐标，行列重组后反查
      var table = bifidTable(tool.kw);
      var t2 = current.cipher.toUpperCase().replace(/[^A-Z]/g, '');
      var coords = [];
      for (var bi = 0; bi < t2.length; bi++) {
        var cc2 = t2.charCodeAt(bi) - 65;
        if (cc2 === 9) cc2 = 8;
        var pp = table.indexOf(cc2);
        coords.push(Math.floor(pp / 5), pp % 5);
      }
      var half = coords.length / 2;
      var rows2 = coords.slice(0, half), cols2 = coords.slice(half);
      var outB = '';
      for (var bj = 0; bj < half; bj++) {
        outB += A[table[rows2[bj] * 5 + cols2[bj]]];
      }
      document.getElementById('bc-t-out').textContent = T('gs.campaign.sol') + outB;
    }
  }

  /* ---------- 关卡流程 ---------- */
  function renderProgress() {
    progressEl.innerHTML = '';
    for (var i = 0; i < LEVELS.length; i++) {
      var d = document.createElement('div');
      d.className = 'bc-dot' + (i < levelIdx ? ' done' : (i === levelIdx ? ' cur' : ' lock'));
      d.title = T('gs.campaign.lvShort').replace('{n}', i + 1);
      progressEl.appendChild(d);
    }
  }

  function startLevel() {
    var lv = LEVELS[levelIdx];
    current = lv.gen();
    levelEl.textContent = (levelIdx + 1) + '/' + LEVELS.length;
    storyEl.innerHTML = '<span class="from">' + T('gs.campaign.intercept') + '</span> · ' + T('gs.campaign.lv' + (levelIdx + 1) + '.title') + '<br>' + T('gs.campaign.lv' + (levelIdx + 1) + '.story');
    infoEl.innerHTML = T('gs.campaign.typeLbl') + '<b>' + T(TYPE_KEY[lv.type]) + '</b> · ' + T('gs.campaign.lenLbl') + ' <b>' + current.cipher.length + '</b> ' + T('gs.campaign.letters');
    cipherEl.textContent = current.cipher;
    hintEl.textContent = '💡 ' + T('gs.campaign.lv' + (levelIdx + 1) + '.hint');
    answerEl.value = '';
    answerEl.focus();
    msgEl.textContent = '';
    buildTool(current.tool);
    renderProgress();
    levelStart = Date.now();
    // 关卡实时计时：先清后设（进关/通关再战/顶栏重开都有可用计时，修复此前清后不建的冻结）
    if (timerTick) clearInterval(timerTick);
    timerEl.textContent = '0s';
    timerTick = setInterval(function () {
      timerEl.textContent = elapsed() + 's';
    }, 500);
  }

  function elapsed() { return Math.round((Date.now() - levelStart) / 1000); }
  function totalSec() { return Math.round(totalMs / 1000); }

  function submit() {
    var v = answerEl.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) { msgEl.textContent = T('gs.campaign.enterFirst'); return; }
    if (v === current.answer) {
      totalMs += Date.now() - levelStart;
      totalEl.textContent = totalSec() + 's';
      if (Arcade.juice) Arcade.juice.win();
      if (levelIdx < LEVELS.length - 1) {
        levelIdx++;
        startLevel();
        if (Arcade.ui) Arcade.ui.toast(T('gs.campaign.okNext'), 'win');
      } else {
        // 通关：写入剧情互通标记（侦探隐藏结局达成后，战役终局追加联动台词）
        if (Arcade.plot) Arcade.plot.mark('campaign');
        if (Arcade.juice) Arcade.juice.win();
        if (timerTick) { clearInterval(timerTick); timerTick = null; } // 终局停止计时
        var coda = '';
        if (Arcade.plot && Arcade.plot.has('detectiveHidden')) {
          coda = '<br><span style="color:var(--text-dim)">' + T('gs.campaign.coda') + '</span>';
        }
        ovTitle.textContent = T('gs.campaign.winT');
        ovTitle.className = 'win';
        ovText.innerHTML = T('gs.campaign.winD').replace('{n}', totalSec()) + coda;
        ovBtn.textContent = T('gs.campaign.again');
        ovBtn.onclick = function () {
          levelIdx = 0; totalMs = 0; totalEl.textContent = '0s';
          overlayEl.classList.add('hidden');
          startLevel();
        };
        overlayEl.classList.remove('hidden');
        if (Arcade.shell) Arcade.shell.submitScore(totalSec());
      }
    } else {
      msgEl.textContent = T('gs.campaign.wrong');
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.fx) Arcade.fx.shake(answerEl);
    }
  }

  goBtn.addEventListener('click', submit);
  answerEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

  /* ---------- 重开（计时器由 startLevel 统一先清后设） ---------- */
  window.GAME_RESTART = function () {
    if (timerTick) { clearInterval(timerTick); timerTick = null; }
    levelIdx = 0; totalMs = 0; totalEl.textContent = '0s';
    overlayEl.classList.add('hidden');
    startLevel();
  };

  startLevel();

})();
