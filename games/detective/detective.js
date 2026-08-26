/* ============================================================
   密码侦探 Detective · 沉浸式谍战解谜（旗舰级，全站首款叙事游戏）
   六章剧情：
   第一章「车站密信」：车站场景找线索 → 凯撒密码解信
   第二章「使馆密码本」：使馆场景 → 摩斯电码破译
   第三章「潜艇坐标」：港口场景 → 维吉尼亚解密坐标
   第四章「地下隧道」：隧道场景 → 栅栏密码还原暗语
   第五章「午夜快车」：列车场景 → 仿射密码解代号
   第六章「最终坐标」：货轮场景 → ADFGVX 双层解密
   玩法：点击场景高亮点收集线索 → 打开密码拼图 → 输入答案推进剧情
   记分：总用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.detective.tut1t'), d: T('gs.detective.tut1') },
  { t: T('gs.detective.tut2t'), d: T('gs.detective.tut2') },
  { t: T('gs.detective.tut3t'), d: T('gs.detective.tut3') },
  { t: T('gs.detective.tut4t'), d: T('gs.detective.tut4') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function idx(c) { return c.charCodeAt(0) - 65; }
  function caesarDec(s, k) {
    return s.split('').map(function (c) {
      return A[(idx(c) - k + 26) % 26];
    }).join('');
  }
  function vigenereDec(s, key) {
    return s.split('').map(function (c, i) {
      return A[(idx(c) - idx(key[i % key.length]) + 26) % 26];
    }).join('');
  }
  var MORSE = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z'
  };
  function morseDec(s) {
    return s.trim().split(/\s+/).map(function (m) {
      return MORSE[m] || '?';
    }).join('');
  }
  /* 栅栏密码解密：按轨道数还原 */
  function railDec(s, rails) {
    if (rails <= 1) return s;
    var n = s.length;
    var sizes = [];
    var r = 0, dir = 1;
    for (var i = 0; i < n; i++) {
      sizes[r] = (sizes[r] || 0) + 1;
      r += dir;
      if (r === rails - 1) dir = -1;
      if (r === 0) dir = 1;
    }
    var rows = [];
    var pos = 0;
    for (var k = 0; k < rails; k++) {
      rows.push(s.substr(pos, sizes[k] || 0));
      pos += sizes[k] || 0;
    }
    var ptr = rows.map(function () { return 0; });
    var out = '';
    var rr = 0, dd = 1;
    for (var j = 0; j < n; j++) {
      out += rows[rr][ptr[rr]++];
      rr += dd;
      if (rr === rails - 1) dd = -1;
      if (rr === 0) dd = 1;
    }
    return out;
  }
  /* 仿射密码解密：x = a⁻¹ × (密文 - b) mod 26 */
  function affineDec(s, a, b) {
    var ai = 1;
    for (var i = 1; i < 26; i++) if ((a * i) % 26 === 1) { ai = i; break; }
    return s.split('').map(function (c) {
      return A[((ai * ((idx(c) - b + 26) % 26)) % 26 + 26) % 26];
    }).join('');
  }
  /* ADFGVX 解密：逆列换位 + Polybius 反查 */
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
  function adfgvxDec(keyword, key, syms) {
    var t = adfgvxColDec(syms, key);
    var table = adfgvxTable(keyword);
    var out = '';
    for (var i = 0; i + 1 < t.length; i += 2) {
      var r = ADFGVX_SYMS.indexOf(t[i]), c = ADFGVX_SYMS.indexOf(t[i + 1]);
      if (r < 0 || c < 0) continue;
      out += table[r * 6 + c];
    }
    return out;
  }

  /* ================= 章节数据 ================= */
  var CHAPTERS = [
    {
      title: '第一章 · 车站密信',
      intro: '1943 年冬，柏林中央车站。你收到线报：一名信使会在候车室留下密信。你需要在人群中找到线索。',
      scene: 'station',
      clues: [
        { id: 'letter', x: 150, y: 120, label: '✉', found: false, pickup: '你在长椅下发现一封被揉皱的信，上面写着一串字母。' },
        { id: 'note', x: 330, y: 90, label: '📄', found: false, pickup: '垃圾桶里有半张纸条：「偏移量藏在列车时刻表上：第 7 站台」→ 提示：偏移 7。' },
        { id: 'h1', x: 420, y: 260, hidden: true, found: false, pickup: '长椅缝里卡着一枚徽章，背面刻着「影子」——这与任务简报里的描述对不上……' }
      ],
      puzzle: {
        type: 'caesar',
        cipher: 'ZLJYLA',
        answer: 'SECRET',
        question: '信上的字母是「ZLJYLA」，纸条提示偏移量为 7。解开凯撒密码，得到信的内容。',
        hint: '凯撒移位 7：把每个字母往前移 7 位。'
      },
      outcome: '你破译了密信：「SECRET」——接头暗号。站台广播响起，一个穿灰大衣的身影走向你……'
    },
    {
      title: '第二章 · 使馆密码本',
      intro: '你循着暗号来到中立国使馆。窗外，使馆顶楼用灯光打着忽明忽暗的信号——那是摩斯电码！',
      scene: 'embassy',
      clues: [
        { id: 'window', x: 220, y: 100, label: '💡', found: false, pickup: '顶楼的灯在闪烁：长短短 长短短 长短短 短 长长长 长短短 短短短——你记下了灯光节奏。' },
        { id: 'book', x: 90, y: 260, label: '📖', found: false, pickup: '窗台上有一本密码本，扉页写着：「灯光信号中，/ 表示字母间隔」。' },
        { id: 'h2', x: 30, y: 290, hidden: true, found: false, pickup: '花坛泥土里埋着半截烧焦的照片——照片上的人，和给你任务的人长得很像……' }
      ],
      puzzle: {
        type: 'morse',
        cipher: '--. --- / - .... . / - .... .. .-. -.. / ... - --- .--. / .-. . -.-. . .. ...- . -..',
        answer: 'GOTHETHIRDSTOPRECEIVED', // 摩斯解码 GO THE THIRD STOP RECEIVED 去空格
        question: '灯光信号译成摩斯码：...。请把点划还原成字母（空格已按字母间隔分开，答案连写）。',
        hint: '摩斯：短亮=点(.)，长亮=划(-)。对照记忆：S=... T=- E=. A=.-'
      },
      outcome: '灯光信号是「GO THE THIRD STOP RECEIVED」——第三站接头人已收到命令。你合上密码本，目标锁定……'
    },
    {
      title: '第三章 · 潜艇坐标',
      intro: '最后一条线索指向军港。你截获一段用电台发出的加密坐标，密钥藏在港口的旗语里：「FLAG」。',
      scene: 'harbor',
      clues: [
        { id: 'radio', x: 280, y: 130, label: '📻', found: false, pickup: '电台里传出加密坐标：「XPCZTCSKAPN」——维吉尼亚密码。' },
        { id: 'flag', x: 120, y: 80, label: '🚩', found: false, pickup: '港口旗语拼出密钥：「FLAG」。' },
        { id: 'h3', x: 440, y: 250, hidden: true, found: false, pickup: '码头木箱的夹层里有一封信，落款是「影子」，信上只写着一个词：陷阱。' }
      ],
      puzzle: {
        type: 'vigenere',
        cipher: 'XPCZTCSKAPN',
        answer: 'SECTORSEVEN', // 维吉尼亚 FLAG 解 XPCZTCSKAPN -> SECTORSEVEN
        question: '加密坐标「XPCZTCSKAPN」，密钥 FLAG。用维吉尼亚密码还原坐标（两词连写）。',
        hint: '维吉尼亚：密文字母 - 密钥字母(循环 FLAGFLAG…) = 明文字母。'
      },
      outcome: '坐标指向第七海区——那是敌方潜艇补给线的咽喉。但情报还不完整：指挥官说，真正的目标是藏在城市地下的秘密隧道……'
    },
    {
      title: '第四章 · 地下隧道',
      intro: '第七海区的潜艇补给必须经过一段废弃地铁隧道。你潜入地下，墙上的通风管道刻着被「之字形」打乱的电报——栅栏密码。',
      scene: 'tunnel',
      clues: [
        { id: 'pipe', x: 300, y: 130, label: '⚙', found: false, pickup: '通风管道上刻着电报：「HENIDNUNLDTE」——之字形栅栏，3 条轨道。' },
        { id: 'chalk', x: 120, y: 250, label: '✏', found: false, pickup: '地上有粉笔画的示意图：3 条上下起伏的波浪线，提示栅栏轨道数为 3。' },
        { id: 'h4', x: 430, y: 90, hidden: true, found: false, pickup: '隧道墙缝里夹着一张便条：「影子」的笔记——他一直在跟踪你，而且知道你的每一步。' }
      ],
      puzzle: {
        type: 'rail',
        cipher: 'HENIDNUNLDTE',
        answer: 'HIDDENTUNNEL',
        question: '管道电报「HENIDNUNLDTE」是 3 轨栅栏密码。按之字形还原字母，得到隧道暗语（连写）。',
        hint: '栅栏：把密文按 3 条轨道的长度分段，再按之字形顺序读回。'
      },
      outcome: '暗语是「HIDDEN TUNNEL」——隐藏隧道。你在墙壁夹层里摸到一块松动的砖，后面是一条通往城外的密道……'
    },
    {
      title: '第五章 · 午夜快车',
      intro: '密道通向城外车站。一列午夜快车即将发车，车票背面印着用乘法加密的仿射密码——参数就藏在列车时刻里。',
      scene: 'train',
      clues: [
        { id: 'ticket', x: 180, y: 150, label: '🎫', found: false, pickup: '车票背面写着「LRSQRHMUXOAKXPP」——仿射密码。' },
        { id: 'timetable', x: 350, y: 90, label: '🕐', found: false, pickup: '时刻表上潦草写着：a=5, b=3（仿射参数）。' },
        { id: 'h5', x: 440, y: 280, hidden: true, found: false, pickup: '车厢角落的行李箱标签写着「指挥部的专列」——但你接到的任务里，从没提到过这趟车。' }
      ],
      puzzle: {
        type: 'affine',
        cipher: 'LRSQRHMUXOAKXPP',
        answer: 'MIDNIGHTEXPRESS',
        question: '车票密文「LRSQRHMUXOAKXPP」是仿射密码，a=5、b=3。解密得到午夜快车的代号（连写）。',
        hint: '仿射解密：先求 a=5 的逆元（5×21≡1 mod 26 → 逆元 21），再算 21×(密文-3) mod 26。'
      },
      outcome: '「MIDNIGHT EXPRESS」——午夜快车。你趁列车停靠时登上车厢，在行李架夹层找到了敌人的行动地图……'
    },
    {
      title: '第六章 · 最终坐标',
      intro: '地图指向港口一艘货轮「红星号」。货轮驾驶舱的电台里，一段 ADFGVX 双层密文正在播出——这就是敌人的最终坐标。',
      scene: 'ship',
      clues: [
        { id: 'radio2', x: 300, y: 120, label: '📻', found: false, pickup: '电台频率上只有一串符号：「DXADDVFDDAVGGAAVDFDD」——ADFGVX 双层密码。' },
        { id: 'atlas', x: 120, y: 180, label: '🗺', found: false, pickup: '海图角落写着：方阵密钥 ATLAS，列换位密钥 STORM。' },
        { id: 'h6', x: 440, y: 140, hidden: true, found: false, pickup: '驾驶舱抽屉深处有一个信封，封口是你的任务代号——里面只有一面镜子和一张字条：「你也是影子。」' }
      ],
      puzzle: {
        type: 'adfgvx',
        cipher: 'DXADDVFDDAVGGAAVDFDD',
        answer: 'REDOCTOBER',
        question: '电台密文「DXADDVFDDAVGGAAVDFDD」，方阵密钥 ATLAS、列密钥 STORM。解密 ADFGVX 得到最终坐标代号（连写）。',
        hint: 'ADFGVX 双层：先按列密钥 STORM 逆列换位，再用 ATLAS 建 6×6 方阵把 ADFGVX 符号对反查成字母。'
      },
      outcome: '「RED OCTOBER」——红色十月。你破译了敌人的最终坐标，情报及时送达盟军指挥部。六章谍战任务，圆满完成！'
    }
  ];

  /* ================= 场景 SVG ================= */
  var SCENES = {
    station: {
      w: 480, h: 320,
      draw: function () {
        return '' +
          '<rect x="0" y="0" width="480" height="320" fill="#101022"/>' +
          '<rect x="20" y="40" width="440" height="220" fill="#1a1a30" rx="10"/>' +
          '<rect x="30" y="50" width="420" height="40" fill="#222244" rx="4"/>' +
          '<text x="240" y="77" text-anchor="middle" fill="#8a8aa0" font-size="14" font-family="monospace">' + T('gs.detective.scStation') + '</text>' +
          '<rect x="60" y="120" width="60" height="120" fill="#26264a" rx="4"/>' +
          '<rect x="120" y="120" width="60" height="120" fill="#26264a" rx="4"/>' +
          '<rect x="180" y="120" width="60" height="120" fill="#26264a" rx="4"/>' +
          '<rect x="240" y="120" width="60" height="120" fill="#26264a" rx="4"/>' +
          '<rect x="300" y="120" width="60" height="120" fill="#26264a" rx="4"/>' +
          '<rect x="360" y="120" width="60" height="120" fill="#26264a" rx="4"/>' +
          '<rect x="40" y="240" width="400" height="6" fill="#333366"/>' +
          '<rect x="40" y="250" width="400" height="10" fill="#2a2a50"/>' +
          '<circle cx="60" cy="130" r="18" fill="#0f0f20"/>' +
          '<circle cx="60" cy="130" r="4" fill="#ffe600"/>';
      }
    },
    embassy: {
      w: 480, h: 320,
      draw: function () {
        return '' +
          '<rect x="0" y="0" width="480" height="320" fill="#0d0d1c"/>' +
          '<rect x="80" y="60" width="320" height="240" fill="#1c1c38" rx="6"/>' +
          '<rect x="80" y="60" width="320" height="30" fill="#282850" rx="6"/>' +
          '<text x="240" y="80" text-anchor="middle" fill="#8a8aa0" font-size="12" font-family="monospace">' + T('gs.detective.scEmbassy') + '</text>' +
          '<rect x="150" y="110" width="80" height="60" fill="#14142c" rx="4"/>' +
          '<rect x="260" y="110" width="80" height="60" fill="#14142c" rx="4"/>' +
          '<rect x="120" y="200" width="240" height="70" fill="#14142c" rx="4"/>' +
          '<rect x="120" y="200" width="240" height="14" fill="#1e1e40"/>' +
          '<circle cx="190" cy="140" r="20" fill="#ffee80" opacity="0.9"/>' +
          '<rect x="360" y="140" width="20" height="120" fill="#26264a"/>';
      }
    },
    harbor: {
      w: 480, h: 320,
      draw: function () {
        return '' +
          '<rect x="0" y="0" width="480" height="320" fill="#0a0f1a"/>' +
          '<rect x="0" y="200" width="480" height="120" fill="#0d1526"/>' +
          '<path d="M0,210 Q120,190 240,210 T480,210" stroke="#1a2a4a" fill="none" stroke-width="4"/>' +
          '<rect x="60" y="140" width="120" height="70" fill="#1e1e3a" rx="4"/>' +
          '<rect x="60" y="140" width="120" height="16" fill="#2a2a52"/>' +
          '<circle cx="200" cy="180" r="10" fill="#1e1e3a"/>' +
          '<rect x="320" y="180" width="90" height="30" fill="#1e1e3a" rx="4"/>' +
          '<rect x="340" y="150" width="8" height="30" fill="#2a2a52"/>' +
          '<rect x="360" y="150" width="8" height="30" fill="#2a2a52"/>' +
          '<rect x="380" y="150" width="8" height="30" fill="#2a2a52"/>' +
          '<rect x="400" y="150" width="8" height="30" fill="#2a2a52"/>' +
          '<rect x="340" y="120" width="76" height="8" fill="#2a2a52"/>';
      }
    },
    tunnel: {
      w: 480, h: 320,
      draw: function () {
        return '' +
          '<rect x="0" y="0" width="480" height="320" fill="#07070f"/>' +
          '<path d="M0,60 Q240,20 480,60 L480,260 Q240,300 0,260 Z" fill="#101022"/>' +
          '<ellipse cx="240" cy="60" rx="180" ry="30" fill="#0a0a18"/>' +
          '<rect x="60" y="90" width="360" height="8" fill="#1c1c30"/>' +
          '<rect x="60" y="110" width="360" height="8" fill="#1c1c30"/>' +
          '<rect x="60" y="130" width="360" height="8" fill="#1c1c30"/>' +
          '<rect x="60" y="150" width="360" height="8" fill="#1c1c30"/>' +
          '<circle cx="90" cy="220" r="6" fill="#2a2a44"/>' +
          '<circle cx="140" cy="220" r="6" fill="#2a2a44"/>' +
          '<circle cx="190" cy="220" r="6" fill="#2a2a44"/>' +
          '<rect x="40" y="230" width="400" height="6" fill="#1c1c30"/>';
      }
    },
    train: {
      w: 480, h: 320,
      draw: function () {
        return '' +
          '<rect x="0" y="0" width="480" height="320" fill="#0d0d1a"/>' +
          '<rect x="20" y="80" width="440" height="200" fill="#1c1c34" rx="8"/>' +
          '<rect x="20" y="80" width="440" height="30" fill="#262648" rx="8"/>' +
          '<text x="240" y="100" text-anchor="middle" fill="#8a8aa0" font-size="13" font-family="monospace">' + T('gs.detective.scTrain') + '</text>' +
          '<rect x="60" y="130" width="80" height="50" fill="#14142c" rx="4"/>' +
          '<rect x="60" y="185" width="80" height="50" fill="#14142c" rx="4"/>' +
          '<rect x="200" y="130" width="80" height="50" fill="#14142c" rx="4"/>' +
          '<rect x="200" y="185" width="80" height="50" fill="#14142c" rx="4"/>' +
          '<rect x="340" y="130" width="80" height="50" fill="#14142c" rx="4"/>' +
          '<rect x="340" y="185" width="80" height="50" fill="#14142c" rx="4"/>' +
          '<circle cx="100" cy="150" r="3" fill="#00f0ff" opacity="0.5"/>' +
          '<rect x="40" y="250" width="400" height="10" fill="#262648"/>' +
          '<circle cx="60" cy="270" r="16" fill="#101020" stroke="#262648" stroke-width="3"/>' +
          '<circle cx="420" cy="270" r="16" fill="#101020" stroke="#262648" stroke-width="3"/>';
      }
    },
    ship: {
      w: 480, h: 320,
      draw: function () {
        return '' +
          '<rect x="0" y="0" width="480" height="320" fill="#0a0f1c"/>' +
          '<path d="M0,240 Q120,220 240,240 T480,240 L480,320 L0,320 Z" fill="#0d1526"/>' +
          '<path d="M0,250 Q120,235 240,250 T480,250" stroke="#1a2a4a" fill="none" stroke-width="3"/>' +
          '<rect x="150" y="120" width="180" height="90" fill="#1c1c34" rx="6"/>' +
          '<rect x="150" y="120" width="180" height="18" fill="#262648" rx="6"/>' +
          '<text x="240" y="134" text-anchor="middle" fill="#8a8aa0" font-size="11" font-family="monospace">' + T('gs.detective.scShip') + '</text>' +
          '<rect x="180" y="150" width="60" height="34" fill="#14142c" rx="4"/>' +
          '<rect x="260" y="150" width="40" height="34" fill="#14142c" rx="4"/>' +
          '<rect x="220" y="90" width="8" height="30" fill="#262648"/>' +
          '<polygon points="224,60 250,90 198,90" fill="#1e1e3a"/>' +
          '<circle cx="240" cy="66" r="3" fill="#ffe600" opacity="0.8"/>' +
          '<rect x="60" y="220" width="100" height="14" fill="#1c1c34"/>' +
          '<rect x="320" y="220" width="100" height="14" fill="#1c1c34"/>';
      }
    }
  };

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  var html =
    '<div class="dt-chap" id="dt-chap"></div>' +
    '<div class="dt-scene" id="dt-scene"></div>' +
    '<div class="dt-narrative" id="dt-narrative"></div>' +
    '<div class="dt-inv" id="dt-inv"></div>' +
    '<div class="dt-actions" id="dt-actions"></div>' +
    '<div class="dt-msg" id="dt-msg" aria-live="polite"></div>' +
    '<div class="dt-overlay hidden" id="dt-overlay">' +
    '  <div class="dt-modal">' +
    '    <h2 id="dt-ov-title"></h2>' +
    '    <p id="dt-ov-text"></p>' +
    '    <div class="game-controls"><button class="btn green" id="dt-ov-btn"></button></div>' +
    '  </div>' +
    '</div>';

  root.innerHTML = html;

  var chapEl = document.getElementById('dt-chap');
  var sceneEl = document.getElementById('dt-scene');
  var narrEl = document.getElementById('dt-narrative');
  var invEl = document.getElementById('dt-inv');
  var actEl = document.getElementById('dt-actions');
  var msgEl = document.getElementById('dt-msg');
  var overlayEl = document.getElementById('dt-overlay');
  var ovTitle = document.getElementById('dt-ov-title');
  var ovText = document.getElementById('dt-ov-text');
  var ovBtn = document.getElementById('dt-ov-btn');

  var chapterIdx = 0;
  var totalMs = 0;
  var chapStart = 0;
  var timerTick = null;
  var foundClues = [];
  var puzzleOpen = false;
  var hiddenFound = 0;   // 隐藏线索（每章未用提示破解即获得 1 个，集齐 6 个解锁隐藏结局）

  function elapsed() { return Math.round((Date.now() - chapStart) / 1000); }
  function totalSec() { return Math.round(totalMs / 1000); }

  /* ---------- 场景渲染 ---------- */
  function renderScene() {
    var ch = CHAPTERS[chapterIdx];
    var sc = SCENES[ch.scene];
    var svg = '<svg viewBox="0 0 ' + sc.w + ' ' + sc.h + '" xmlns="http://www.w3.org/2000/svg">' +
      sc.draw();
    ch.clues.forEach(function (c) {
      var found = foundClues.indexOf(c.id) >= 0;
      if (c.hidden) {
        // 隐藏线索：小圆点、不闪烁，需要仔细找
        svg += '<g class="dt-clue' + (found ? ' found' : ' hidden-clue') + '" data-clue="' + c.id + '" data-hidden="1" role="button" tabindex="0" aria-label="' + T('gs.detective.hiddenAria') + '">' +
          '<circle cx="' + c.x + '" cy="' + c.y + '" r="4" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>' +
          '</g>';
      } else {
        svg += '<g class="dt-clue' + (found ? ' found' : '') + '" data-clue="' + c.id + '" role="button" tabindex="0" aria-label="' + T('gs.detective.clueAria').replace('{n}', c.label) + '">' +
          '<circle cx="' + c.x + '" cy="' + c.y + '" r="14" fill="rgba(255,230,0,0.15)" stroke="#ffe600" stroke-width="2"/>' +
          '<text x="' + c.x + '" y="' + (c.y + 5) + '" text-anchor="middle" class="dt-clue-label">' + c.label + '</text>' +
          '</g>';
      }
    });
    svg += '</svg>';
    sceneEl.innerHTML = svg;
    // 绑定点击
    var gs = sceneEl.querySelectorAll('.dt-clue');
    for (var i = 0; i < gs.length; i++) {
      (function (g) {
        function pick() {
          var id = g.getAttribute('data-clue');
          if (foundClues.indexOf(id) >= 0) return;
          var c = ch.clues.filter(function (x) { return x.id === id; })[0];
          var ci = ch.clues.indexOf(c);
          foundClues.push(id);
          if (c.hidden) {
            hiddenFound++;
            narrEl.innerHTML = '<span class="sys">' + T('gs.detective.hiddenFound') + '</span>' + T('gs.detective.c' + (chapterIdx + 1) + '.clue' + (ci + 1)) + T('gs.detective.hiddenCount').replace('{n}', hiddenFound);
            if (Arcade.juice) Arcade.juice.win();
          } else {
            narrEl.innerHTML = '<span class="sys">' + T('gs.detective.clueGot') + '</span>' + T('gs.detective.c' + (chapterIdx + 1) + '.clue' + (ci + 1));
            if (Arcade.audio) Arcade.audio.play('coin');
            if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-yellow)');
          }
          g.classList.add('found');
          updateUI();
        }
        g.addEventListener('click', pick);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      })(gs[i]);
    }
  }

  function updateUI() {
    var ch = CHAPTERS[chapterIdx];
    // 物品栏（只显示普通线索；隐藏线索通过 foundClues 计数单独提示）
    invEl.innerHTML = '';
    ch.clues.forEach(function (c) {
      if (!c.hidden && foundClues.indexOf(c.id) >= 0) {
        var d = document.createElement('div');
        d.className = 'dt-item';
        d.textContent = c.label + ' ' + T('gs.detective.clueItem');
        invEl.appendChild(d);
      }
    });
    if (hiddenFound > 0) {
      var hd = document.createElement('div');
      hd.className = 'dt-item';
      hd.style.borderColor = 'rgba(255,255,255,0.3)';
      hd.textContent = T('gs.detective.hiddenBadge').replace('{n}', hiddenFound);
      invEl.appendChild(hd);
    }
    // 动作按钮：普通线索全收集后出现「破解」
    actEl.innerHTML = '';
    var needClues = ch.clues.filter(function (c) { return !c.hidden; });
    var gotClues = needClues.filter(function (c) { return foundClues.indexOf(c.id) >= 0; });
    if (gotClues.length === needClues.length && !puzzleOpen) {
      var b = document.createElement('button');
      b.className = 'btn green';
      b.textContent = T('gs.detective.crack');
      b.addEventListener('click', openPuzzle);
      actEl.appendChild(b);
    }
  }

  /* ---------- 密码拼图 ---------- */
  function openPuzzle() {
    puzzleOpen = true;
    var ch = CHAPTERS[chapterIdx];
    actEl.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'dt-puzzle';
    box.innerHTML =
      '<div class="dt-puzzle-title">🔐 ' + T('gs.detective.c' + (chapterIdx + 1) + '.q') + '</div>' +
      '<div class="dt-hint">💡 ' + T('gs.detective.c' + (chapterIdx + 1) + '.hint') + '</div>' +
      '<input class="dt-input" id="dt-answer" maxlength="24" placeholder="' + T('gs.detective.ansPh') + '" aria-label="' + T('gs.detective.ansAria') + '" ' +
      'style="width:100%;font-family:var(--font-pixel);font-size:15px;text-align:center;color:var(--neon-green);' +
      'background:rgba(57,255,20,0.05);border:2px solid rgba(57,255,20,0.4);border-radius:8px;padding:11px;outline:none">' +
      '<div class="game-controls" style="margin-top:10px">' +
      '  <button class="btn green" id="dt-submit">' + T('gs.detective.submit') + '</button>' +
      '</div>';
    actEl.appendChild(box);
    var ans = document.getElementById('dt-answer');
    function submit() {
      var v = ans.value.toUpperCase().replace(/[^A-Z]/g, '');
      if (v === ch.puzzle.answer) {
        puzzleOpen = false;
        totalMs += Date.now() - chapStart;
        narrEl.innerHTML = '<span class="sys">' + T('gs.detective.solved') + '</span>' + T('gs.detective.c' + (chapterIdx + 1) + '.outcome');
        msgEl.textContent = '';
        if (Arcade.juice) Arcade.juice.win();
        if (chapterIdx < CHAPTERS.length - 1) {
          setTimeout(function () {
            chapterIdx++;
            foundClues = [];
            startChapter();
            if (Arcade.ui) Arcade.ui.toast('📡 ' + T('gs.detective.enter') + T('gs.detective.c' + (chapterIdx + 1) + '.title'), 'win');
          }, 1200);
        } else {
          setTimeout(function () {
            if (timerTick) { clearInterval(timerTick); timerTick = null; } // 终局停止计时
            // 隐藏结局：6 章全部找到隐藏线索才解锁（否则普通结局）
            var isHiddenEnding = hiddenFound >= CHAPTERS.length;
            // 剧情互通：写入通关标记（隐藏结局另有标记）；战役通关后结局文案联动
            if (Arcade.plot) {
              Arcade.plot.mark('detective');
              if (isHiddenEnding) Arcade.plot.mark('detectiveHidden');
            }
            var coda = '';
            if (Arcade.plot && Arcade.plot.has('campaign')) {
              coda = isHiddenEnding
                ? '<br><span style="color:var(--text-dim)">' + T('gs.detective.codaHidden') + '</span>'
                : '<br><span style="color:var(--text-dim)">' + T('gs.detective.codaNormal') + '</span>';
            }
            if (isHiddenEnding) {
              ovTitle.textContent = T('gs.detective.endHiddenT');
              ovTitle.className = 'win';
              ovText.innerHTML = T('gs.detective.endHiddenD').replace('{n}', totalSec()) + coda;
              if (Arcade.ui) Arcade.ui.toast(T('gs.detective.endHiddenToast'), 'win');
            } else {
              ovTitle.textContent = T('gs.detective.endT');
              ovTitle.className = 'win';
              ovText.innerHTML = T('gs.detective.endD').replace('{n}', totalSec()) + coda;
            }
            ovBtn.textContent = isHiddenEnding ? T('gs.detective.replayHidden') : T('gs.detective.replay');
            ovBtn.onclick = function () {
              chapterIdx = 0; foundClues = []; totalMs = 0; puzzleOpen = false; hiddenFound = 0;
              overlayEl.classList.add('hidden');
              startChapter();
            };
            overlayEl.classList.remove('hidden');
            if (Arcade.shell) Arcade.shell.submitScore(totalSec());
          }, 1200);
        }
      } else {
        msgEl.textContent = T('gs.detective.wrong');
        if (Arcade.audio) Arcade.audio.play('error');
        if (Arcade.fx) Arcade.fx.shake(ans);
      }
    }
    document.getElementById('dt-submit').addEventListener('click', submit);
    ans.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    ans.focus();
  }

  function startChapter() {
    var ch = CHAPTERS[chapterIdx];
    chapEl.textContent = T('gs.detective.c' + (chapterIdx + 1) + '.title');
    // 剧情互通：破译战役通关后，第一章任务简报追加前线联动战报
    var link = '';
    if (chapterIdx === 0 && Arcade.plot && Arcade.plot.has('campaign')) {
      link = '<br><span style="color:var(--text-dim)">' + T('gs.detective.linkBrief') + '</span>';
    }
    narrEl.innerHTML = '<span class="sys">' + T('gs.detective.brief') + '</span>' + T('gs.detective.c' + (chapterIdx + 1) + '.intro') + link;
    msgEl.textContent = T('gs.detective.tapHint');
    renderScene();
    updateUI();
    puzzleOpen = false;
    chapStart = Date.now();
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(function () {
      var el = document.getElementById('dt-timer');
      /* 评审修复：显示已完成章节累计 + 当前章节实时走秒（原仅显示冻结的 totalSec） */
      if (el) el.textContent = (totalSec() + elapsed()) + 's';
    }, 500);
  }

  // 顶部计时器（挂在章节标题后）
  var timerEl = document.createElement('div');
  timerEl.style.cssText = 'font-family:var(--font-pixel);font-size:10px;color:var(--neon-yellow);text-shadow:0 0 8px rgba(255,230,0,.5);';
  timerEl.id = 'dt-timer';
  timerEl.textContent = '0s';
  if (chapEl.parentNode) chapEl.parentNode.insertBefore(timerEl, chapEl.nextSibling);

  startChapter();

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.detective.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    chapterIdx = 0; foundClues = []; totalMs = 0; puzzleOpen = false; hiddenFound = 0; // 隐藏线索跨局清零，避免跨局凑满解锁
    overlayEl.classList.add('hidden');
    startChapter();
  };


})();
