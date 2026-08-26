/* 破译 DECODE ARCADE · AES 轮函数实验室 —— 第十三期新游戏
   真实执行 AES 单轮四步变换（标准 S 盒 + GF(2^8) 列混淆），
   每步一道题：先答后验，状态矩阵实时演化。2 轮 × 4 步，答对 +25。
   每日模式：日种子确定性选题。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.aes-lab.tut1t'), d: T('gs.aes-lab.tut1') },
  { t: T('gs.aes-lab.tut2t'), d: T('gs.aes-lab.tut2') },
  { t: T('gs.aes-lab.tut3t'), d: T('gs.aes-lab.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 8;

  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 标准 AES S 盒（FIPS-197） ---------- */
  var SBOX_HEX =
    '637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0' +
    'b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275' +
    '09832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cf' +
    'd0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2' +
    'cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdb' +
    'e0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08' +
    'ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9e' +
    'e1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16';
  var SBOX = [];
  for (var si = 0; si < 256; si++) SBOX[si] = parseInt(SBOX_HEX.substr(si * 2, 2), 16);
  function xt(b) { b <<= 1; if (b & 0x100) b ^= 0x11B; return b & 0xFF; }
  function gmul(a, b) {
    var r = 0;
    while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; }
    return r;
  }

  /* 状态矩阵：16 字节，列主序填充（FIPS 规范）：byte i → 行 i%4 列 floor(i/4) */
  function hex(b) { return ('0' + b.toString(16)).slice(-2).toUpperCase(); }
  function matStr(st, hotIdx) {
    var h = '';
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var idx = c * 4 + r;
        h += '<div class="al-cell' + (idx === hotIdx ? ' hot' : '') + '">' + hex(st[idx]) + '</div>';
      }
    }
    return h;
  }

  function subBytes(st) { for (var i = 0; i < 16; i++) st[i] = SBOX[st[i]]; }
  function shiftRows(st) {
    var out = new Array(16);
    for (var r = 0; r < 4; r++)
      for (var c = 0; c < 4; c++)
        out[c * 4 + r] = st[((c + r) % 4) * 4 + r];
    for (var j = 0; j < 16; j++) st[j] = out[j];
  }
  function mixColumns(st) {
    for (var c = 0; c < 4; c++) {
      var a0 = st[c * 4], a1 = st[c * 4 + 1], a2 = st[c * 4 + 2], a3 = st[c * 4 + 3];
      st[c * 4]     = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3;
      st[c * 4 + 1] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3;
      st[c * 4 + 2] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3);
      st[c * 4 + 3] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2);
    }
  }
  function addRoundKey(st, key) { for (var i = 0; i < 16; i++) st[i] ^= key[i]; }

  /* 预设：初始状态与两把轮密钥（教学示例值，含 FIPS-197 附录样例） */
  var PRESETS = [
    {
      init: [0x32, 0x88, 0x31, 0xe0, 0x43, 0x5a, 0x31, 0x37, 0xf6, 0x30, 0x98, 0x07, 0xa8, 0x8d, 0xa2, 0x34],
      key1: [0x2b, 0x28, 0xab, 0x09, 0x7e, 0xae, 0xf7, 0xcf, 0x15, 0xd2, 0x15, 0x4f, 0x16, 0xa6, 0x88, 0x3c],
      key2: [0xa0, 0xfa, 0xfe, 0x17, 0x88, 0x54, 0x2c, 0xb1, 0x23, 0xa3, 0x39, 0x39, 0x2a, 0x6c, 0x76, 0x05]
    },
    {
      init: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10],
      key1: [0x0f, 0x1e, 0x2d, 0x3c, 0x4b, 0x5a, 0x69, 0x78, 0x87, 0x96, 0xa5, 0xb4, 0xc3, 0xd2, 0xe1, 0xf0],
      key2: [0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00]
    },
    {
      init: [0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0],
      key1: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xa0, 0xb0, 0xc0, 0xd0, 0xe0, 0xf0, 0x01],
      key2: [0x66, 0x33, 0x99, 0xcc, 0x44, 0x88, 0x22, 0xee, 0x11, 0x55, 0xaa, 0xff, 0x7b, 0x3d, 0x5f, 0x19]
    }
  ];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'al-wrap';
  wrap.innerHTML =
    '<div class="al-prog" id="al-prog"></div>' +
    '<div class="al-stage" id="al-stage"></div>' +
    '<div class="al-mat" id="al-mat"></div>' +
    '<div class="al-q" id="al-q"></div>' +
    '<div class="al-btns" id="al-opts"></div>' +
    '<div class="al-msg" id="al-msg"></div>' +
    '<div class="al-expl" id="al-expl"></div>' +
    '<div class="al-btns"><button class="btn green" id="al-next" hidden></button></div>' +
    '<div class="al-btns"><button class="btn" id="al-daily">' + T('gs.aes-lab.dailyBtn') + '</button></div>' +
    '<div class="al-help">' + T('gs.aes-lab.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('al-prog'), stageEl = $('al-stage'), matEl = $('al-mat'),
      qEl = $('al-q'), optsEl = $('al-opts'), msgEl = $('al-msg'),
      explEl = $('al-expl'), nextB = $('al-next'), dailyBtn = $('al-daily');

  /* ---------- 步骤生成：每轮四题，引用真实预设数据 ---------- */
  function buildRounds(rnd) {
    var p = PRESETS[Math.floor(rnd() * PRESETS.length)];
    var subTarget = Math.floor(rnd() * 16);
    var shiftRow = 1 + Math.floor(rnd() * 3);
    var arkCell = Math.floor(rnd() * 16);
    return {
      preset: p,
      rounds: [
        [
          {
            opKey: 'opSub', hot: subTarget,
            q: { zh: 'SubBytes：高亮字节 ' + hex(p.init[subTarget]) + ' 经 S 盒替换后变为？',
                 en: 'SubBytes: the highlighted byte ' + hex(p.init[subTarget]) + ' becomes, after the S-box?' },
            opts: [hex(SBOX[p.init[subTarget]]), hex((p.init[subTarget] + 1) & 0xFF), hex(p.init[subTarget] ^ 0xFF)],
            a: 0,
            expl: { zh: 'S 盒是 AES 唯一的非线性部件——由乘法逆元加仿射变换构成，提供「混淆」。真实替换：' + hex(p.init[subTarget]) + ' → ' + hex(SBOX[p.init[subTarget]]) + '。',
                    en: 'The S-box is AES\'s only nonlinear part — multiplicative inverses plus an affine map, providing confusion. Real substitution: ' + hex(p.init[subTarget]) + ' → ' + hex(SBOX[p.init[subTarget]]) + '.' }
          },
          {
            opKey: 'opShift', hot: -1,
            q: { zh: 'ShiftRows：第 ' + shiftRow + ' 行（从 0 数起）循环左移几字节？',
                 en: 'ShiftRows: how many bytes does row ' + shiftRow + ' (0-indexed) rotate left?' },
            opts: ['0', String(shiftRow), '3', '4'],
            a: 1,
            expl: { zh: '第 r 行循环左移 r 字节——第 0 行不动、第 3 行移 3 位。行间错位让 MixColumns 能把 4 个不同行的字节搅在一起。',
                    en: 'Row r rotates left by r bytes — row 0 stays put, row 3 moves by 3. This staggered offset lets MixColumns blend bytes from four different rows.' }
          },
          {
            opKey: 'opMix', hot: -1,
            q: { zh: 'MixColumns 之后，输出列的每个字节取决于输入列的几个字节？',
                 en: 'After MixColumns, each output byte in a column depends on how many input bytes?' },
            opts: ['1', '2', '4'],
            a: 2,
            expl: { zh: 'MixColumns 在 GF(2^8) 上把每列与固定多项式相乘——每个输出字节都是 4 个输入字节的组合。一比特变、全列变，这就是扩散。',
                    en: 'MixColumns multiplies each column by a fixed polynomial over GF(2^8) — every output byte mixes all four inputs. Flip one bit, the whole column changes: diffusion.' }
          },
          {
            opKey: 'opArk', hot: arkCell, keyByte: p.key1[arkCell],
            q: { zh: 'AddRoundKey：高亮状态字节与轮密钥字节 ' + hex(p.key1[arkCell]) + ' 异或的结果是？',
                 en: 'AddRoundKey: XOR the highlighted state byte with key byte ' + hex(p.key1[arkCell]) + '. Result?' },
            opts: [], a: 0,
            expl: { zh: '轮密钥通过 XOR 注入状态——可逆、线性且每一比特都影响结果。（真实 AES 的各轮密钥由密钥扩展算法从主密钥派生。）',
                    en: 'The round key enters via XOR — invertible, linear, and every key bit matters. (Real AES derives round keys via its key schedule.)' }
          }
        ],
        [
          {
            opKey: 'opSub', hot: -1,
            q: { zh: '第二轮开始。SubBytes 的本质作用是什么？',
                 en: 'Round two begins. What is the essential role of SubBytes?' },
            opts: [
              { zh: '唯一的非线性步骤——没有它 AES 可被解方程攻破', en: 'The only nonlinearity — without it AES could be solved algebraically' },
              { zh: '把明文变成二进制', en: 'Convert plaintext to binary' },
              { zh: '压缩数据长度', en: 'Compress the data length' }
            ],
            a: 0,
            expl: { zh: '若只有移位和异或这类线性操作，整个 AES 就是一个大线性方程组，高斯消元即可破解。S 盒的非线性挡住了这条路。',
                    en: 'With only linear ops like shifts and XOR, all of AES collapses into one big linear system solvable by Gaussian elimination. The S-box\'s nonlinearity blocks exactly that.' }
          },
          {
            opKey: 'opShift', hot: -1,
            q: { zh: '第 1 行为 [A0 B1 C2 D3]，ShiftRows 左移 1 位后是？',
                 en: 'Row 1 is [A0 B1 C2 D3]. After ShiftRows rotates it left by one?' },
            opts: ['A0 B1 C2 D3', 'B1 C2 D3 A0', 'D3 A0 B1 C2'],
            a: 1,
            expl: { zh: '左移一位：首字节绕回末尾——[B1 C2 D3 A0]。四个行分别移 0/1/2/3 位。',
                    en: 'Left by one: the first byte wraps around — [B1 C2 D3 A0]. Rows rotate by 0/1/2/3 respectively.' }
          },
          {
            opKey: 'opMix', hot: -1,
            q: { zh: '为什么 MixColumns 用 GF(2^8) 而不是普通乘法？',
                 en: 'Why does MixColumns multiply over GF(2^8) instead of ordinary arithmetic?' },
            opts: [
              { zh: '普通乘法会溢出超出一个字节', en: 'Ordinary products overflow beyond one byte' },
              { zh: 'GF(2^8) 结果仍在 0–255 内、可逆——加密解密对称', en: 'GF(2^8) stays within 0–255 and is invertible — encryption mirrors decryption' },
              { zh: '历史巧合，没有特别原因', en: 'A historical coincidence with no special reason' }
            ],
            a: 1,
            expl: { zh: 'GF(2^8) 把溢出模到不可约多项式 x^8+x^4+x^3+x+1 上：单字节进、单字节出，非零元素都有逆元——列混淆可逆，解密只需反向执行。',
                    en: 'GF(2^8) reduces overflow modulo x^8+x^4+x^3+x+1: one byte in, one byte out, every nonzero element invertible — decryption just runs the ops backwards.' }
          },
          {
            opKey: 'opArk', hot: arkCell, keyByte: p.key2[arkCell],
            q: { zh: '最后一轮密钥加：高亮字节 XOR 密钥字节 ' + hex(p.key2[arkCell]) + ' = ？',
                 en: 'Final AddRoundKey: highlighted byte XOR key byte ' + hex(p.key2[arkCell]) + ' = ?' },
            opts: [], a: 0,
            expl: { zh: '十轮之后，最后一次 AddRoundKey 的输出就是完整密文。混淆 + 扩散 + 密钥注入——AES 的全部秘密就这三件事。',
                    en: 'After ten rounds the final AddRoundKey output is the ciphertext. Confusion, diffusion, key injection — that\'s all of AES\'s magic.' }
          }
        ]
      ]
    };
  }

  /* ---------- 游戏状态 ---------- */
  var idx = 0, score = 0, answered = false, finished = false,
      curQ = null, order = [], dailyMode = false, startTs = 0,
      state = new Array(16), keys = [null, null], rounds = null,
      preset = null, rnd = Math.random;

  function upd() {
    progEl.textContent = fmt('gs.aes-lab.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'al-msg ' + c; msgEl.textContent = t; }

  function renderQ() {
    /* 进入新一轮：状态重置为初始矩阵 */
    if (idx > 0 && order[idx].r !== order[idx - 1].r) state = preset.init.slice();
    var ri = order[idx];
    curQ = rounds[ri.r][ri.s];
    curQ._a = curQ.a;
    stageEl.textContent = T('gs.aes-lab.' + curQ.opKey);
    matEl.innerHTML = matStr(state, ri.s === 3 ? curQ.hot : curQ.hot);
    qEl.textContent = L(curQ.q);
    var opts;
    if (!curQ.opts.length) {
      /* 密钥加计算题：动态生成选项并打乱 */
      var stByte = state[curQ.hot];
      var correct = hex(stByte ^ curQ.keyByte);
      opts = [correct, hex(stByte), hex((stByte + curQ.keyByte) & 0xFF)];
      if (rnd() < 0.5) { var tmp = opts[0]; opts[0] = opts[2]; opts[2] = tmp; }
      curQ._a = opts.indexOf(correct);
    } else {
      opts = curQ.opts;
    }
    optsEl.innerHTML = '';
    opts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.style.fontFamily = 'var(--font-mono)';
      b.style.fontSize = '12px';
      b.textContent = typeof o === 'string' ? o : L(o);
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'al-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function applyOp(stepInRound, roundIdx) {
    if (stepInRound === 0) subBytes(state);
    else if (stepInRound === 1) shiftRows(state);
    else if (stepInRound === 2) mixColumns(state);
    else addRoundKey(state, keys[roundIdx]);
  }

  function judge(pick) {
    if (answered || finished) return;
    answered = true;
    var ok = pick === curQ._a;
    if (ok) {
      score += 25;
      setMsg('ok', T('gs.aes-lab.correct'));
      if (Arcade.juice) Arcade.juice.win();
    } else {
      setMsg('no', T('gs.aes-lab.wrong'));
      if (Arcade.juice) Arcade.juice.lose();
    }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curQ._a].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L(curQ.expl);
    explEl.classList.add('on');
    var ri = order[idx];
    applyOp(ri.s, ri.r);
    matEl.innerHTML = matStr(state, -1);
    nextB.hidden = false;
    upd();
  }

  function nextQ() {
    idx++; answered = false;
    if (idx >= TOTAL) { finish(); return; }
    renderQ();
  }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('aes-lab', sec);
    }
    stageEl.textContent = ''; matEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.aes-lab.done', { score: score }));
    nextB.textContent = T('gs.aes-lab.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx = 0; score = 0; answered = false; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 5); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    var built = buildRounds(rnd);
    rounds = built.rounds;
    preset = built.preset;
    state = preset.init.slice();
    keys = [preset.key1, preset.key2];
    order = [];
    for (var s = 0; s < 4; s++) order.push({ r: 0, s: s });
    for (var s2 = 0; s2 < 4; s2++) order.push({ r: 1, s: s2 });
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
