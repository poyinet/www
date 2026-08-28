/* 破译 DECODE ARCADE · 国密网关 —— B5 旗舰
   真实国密管线：SM4（GB/T 32907 引擎，官方向量对拍）+ SM3（GB/T 32905 实现）
   + SM2 式验签（微型曲线 y^2=x^3+2x+2 mod 17，阶 19，方程与 256 位国密一致）
   + SM9 标识密码概念 + 国标/法律时间线。答对 +20，满分 120。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.gm-gateway.tut1t'), d: T('gs.gm-gateway.tut1') },
  { t: T('gs.gm-gateway.tut2t'), d: T('gs.gm-gateway.tut2') },
  { t: T('gs.gm-gateway.tut3t'), d: T('gs.gm-gateway.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ================= SM4 引擎（GB/T 32907-2016 完整实现） ================= */
  var SBOX4 = [
    0xD6,0x90,0xE9,0xFE,0xCC,0xE1,0x3D,0xB7,0x16,0xB6,0x14,0xC2,0x28,0xFB,0x2C,0x05,
    0x2B,0x67,0x9A,0x76,0x2A,0xBE,0x04,0xC3,0xAA,0x44,0x13,0x26,0x49,0x86,0x06,0x99,
    0x9C,0x42,0x50,0xF4,0x91,0xEF,0x98,0x7A,0x33,0x54,0x0B,0x43,0xED,0xCF,0xAC,0x62,
    0xE4,0xB3,0x1C,0xA9,0xC9,0x08,0xE8,0x95,0x80,0xDF,0x94,0xFA,0x75,0x8F,0x3F,0xA6,
    0x47,0x07,0xA7,0xFC,0xF3,0x73,0x17,0xBA,0x83,0x59,0x3C,0x19,0xE6,0x85,0x4F,0xA8,
    0x68,0x6B,0x81,0xB2,0x71,0x64,0xDA,0x8B,0xF8,0xEB,0x0F,0x4B,0x70,0x56,0x9D,0x35,
    0x1E,0x24,0x0E,0x5E,0x63,0x58,0xD1,0xA2,0x25,0x22,0x7C,0x3B,0x01,0x21,0x78,0x87,
    0xD4,0x00,0x46,0x57,0x9F,0xD3,0x27,0x52,0x4C,0x36,0x02,0xE7,0xA0,0xC4,0xC8,0x9E,
    0xEA,0xBF,0x8A,0xD2,0x40,0xC7,0x38,0xB5,0xA3,0xF7,0xF2,0xCE,0xF9,0x61,0x15,0xA1,
    0xE0,0xAE,0x5D,0xA4,0x9B,0x34,0x1A,0x55,0xAD,0x93,0x32,0x30,0xF5,0x8C,0xB1,0xE3,
    0x1D,0xF6,0xE2,0x2E,0x82,0x66,0xCA,0x60,0xC0,0x29,0x23,0xAB,0x0D,0x53,0x4E,0x6F,
    0xD5,0xDB,0x37,0x45,0xDE,0xFD,0x8E,0x2F,0x03,0xFF,0x6A,0x72,0x6D,0x6C,0x5B,0x51,
    0x8D,0x1B,0xAF,0x92,0xBB,0xDD,0xBC,0x7F,0x11,0xD9,0x5C,0x41,0x1F,0x10,0x5A,0xD8,
    0x0A,0xC1,0x31,0x88,0xA5,0xCD,0x7B,0xBD,0x2D,0x74,0xD0,0x12,0xB8,0xE5,0xB4,0xB0,
    0x89,0x69,0x97,0x4A,0x0C,0x96,0x77,0x7E,0x65,0xB9,0xF1,0x09,0xC5,0x6E,0xC6,0x84,
    0x18,0xF0,0x7D,0xEC,0x3A,0xDC,0x4D,0x20,0x79,0xEE,0x5F,0x3E,0xD7,0xCB,0x39,0x48
  ];
  var FK4 = [0xA3B1BAC6, 0x56AA3350, 0x677D9197, 0xB27022DC];
  var CK4 = [];
  for (var cki = 0; cki < 32; cki++) {
    CK4.push(((((4 * cki + 0) * 7) % 256) << 24) | ((((4 * cki + 1) * 7) % 256) << 16) |
            ((((4 * cki + 2) * 7) % 256) << 8) | (((4 * cki + 3) * 7) % 256));
  }
  function rotl32(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
  function tau4(A) {
    return ((SBOX4[(A >>> 24) & 255] << 24) | (SBOX4[(A >>> 16) & 255] << 16) |
            (SBOX4[(A >>> 8) & 255] << 8) | SBOX4[A & 255]) >>> 0;
  }
  function L4(B) { return (B ^ rotl32(B, 2) ^ rotl32(B, 10) ^ rotl32(B, 18) ^ rotl32(B, 24)) >>> 0; }
  function Lp4(B) { return (B ^ rotl32(B, 13) ^ rotl32(B, 23)) >>> 0; }
  function T4(A) { return L4(tau4(A)); }
  function Tp4(A) { return Lp4(tau4(A)); }
  function keySchedule4(MK) {
    var K = [MK[0] ^ FK4[0], MK[1] ^ FK4[1], MK[2] ^ FK4[2], MK[3] ^ FK4[3]];
    var rk = [];
    for (var i = 0; i < 32; i++) {
      K.push((K[i] ^ Tp4(K[i + 1] ^ K[i + 2] ^ K[i + 3] ^ CK4[i])) >>> 0);
      rk.push(K[i + 4]);
    }
    return rk;
  }
  function cryptBlock4(Xin, rk, reverse) {
    var s = Xin.slice();
    for (var i = 0; i < 32; i++) {
      var k = reverse ? rk[31 - i] : rk[i];
      s.push((s[i] ^ T4(s[i + 1] ^ s[i + 2] ^ s[i + 3] ^ k)) >>> 0);
    }
    return [s[35], s[34], s[33], s[32]];
  }
  function hexWords(h) {
    var w = [];
    for (var i = 0; i < 4; i++) w.push(parseInt(h.substr(i * 8, 8), 16) >>> 0);
    return w;
  }
  function wordsHex(w) {
    var o = '';
    for (var i = 0; i < w.length; i++) o += ('00000000' + (w[i] >>> 0).toString(16)).slice(-8).toUpperCase();
    return o;
  }
  function sm4Enc(blockHex, keyHex) { return wordsHex(cryptBlock4(hexWords(blockHex), keySchedule4(hexWords(keyHex)), false)); }
  function sm4Dec(blockHex, keyHex) { return wordsHex(cryptBlock4(hexWords(blockHex), keySchedule4(hexWords(keyHex)), true)); }
  function randHex32() {
    var h = '';
    for (var i = 0; i < 16; i++) h += ('0' + Math.floor(rnd() * 256).toString(16)).slice(-2);
    return h.toUpperCase();
  }

  /* ================= SM3 引擎（GB/T 32905-2016 完整实现） ================= */
  var SM3_IV = [0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e];
  function P0(x) { return (x ^ rotl32(x, 9) ^ rotl32(x, 17)) >>> 0; }
  function P1(x) { return (x ^ rotl32(x, 15) ^ rotl32(x, 23)) >>> 0; }
  function sm3(bytes) {
    var msg = bytes.slice();
    var bitLen = msg.length * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    for (var i = 0; i < 8; i++) msg.push(Math.floor(bitLen / Math.pow(2, 8 * (7 - i))) & 0xFF); /* 大端 64 位比特长度 */
    var V = SM3_IV.slice();
    for (var off = 0; off < msg.length; off += 64) {
      var W = [], Wp = [], j;
      for (j = 0; j < 16; j++) W[j] = ((msg[off + 4 * j] << 24) | (msg[off + 4 * j + 1] << 16) | (msg[off + 4 * j + 2] << 8) | msg[off + 4 * j + 3]) >>> 0;
      for (j = 16; j < 68; j++) W[j] = (P1(W[j - 16] ^ W[j - 9] ^ rotl32(W[j - 3], 15)) ^ rotl32(W[j - 13], 7) ^ W[j - 6]) >>> 0;
      for (j = 0; j < 64; j++) Wp[j] = (W[j] ^ W[j + 4]) >>> 0;
      var A = V[0], B = V[1], C = V[2], D = V[3], E = V[4], F = V[5], G = V[6], H = V[7];
      for (j = 0; j < 64; j++) {
        var Tj = j < 16 ? 0x79cc4519 : 0x7a879d8a;
        var SS1 = rotl32((rotl32(A, 12) + E + rotl32(Tj, j)) >>> 0, 7);
        var SS2 = (SS1 ^ rotl32(A, 12)) >>> 0;
        var FF, GG;
        if (j < 16) { FF = (A ^ B ^ C) >>> 0; GG = (E ^ F ^ G) >>> 0; }
        else { FF = ((A & B) | (A & C) | (B & C)) >>> 0; GG = ((E & F) | ((~E) & G)) >>> 0; }
        var TT1 = (FF + D + SS2 + Wp[j]) >>> 0;
        var TT2 = (GG + H + SS1 + W[j]) >>> 0;
        D = C; C = rotl32(B, 9); B = A; A = TT1;
        H = G; G = rotl32(F, 19); F = E; E = P0(TT2);
      }
      V = [(V[0] ^ A) >>> 0, (V[1] ^ B) >>> 0, (V[2] ^ C) >>> 0, (V[3] ^ D) >>> 0,
           (V[4] ^ E) >>> 0, (V[5] ^ F) >>> 0, (V[6] ^ G) >>> 0, (V[7] ^ H) >>> 0];
    }
    var out = '';
    for (var vi = 0; vi < 8; vi++) out += ('00000000' + (V[vi] >>> 0).toString(16)).slice(-8);
    return out;
  }

  /* ================= 微型椭圆曲线（SM2 验签方程，玩具参数） ================= */
  var EC = { a: 2, b: 2, p: 17, n: 19, G: [5, 1] };
  function eInv(x, m) {
    var t = 0, nt = 1, r = m, nr = ((x % m) + m) % m, q, tmp;
    while (nr) { q = Math.floor(r / nr); tmp = t - q * nt; t = nt; nt = tmp; tmp = r - q * nr; r = nr; nr = tmp; }
    if (r > 1) return null;
    return ((t % m) + m) % m;
  }
  function eAdd(P, Q) {
    if (!P) return Q;
    if (!Q) return P;
    var x1 = P[0], y1 = P[1], x2 = Q[0], y2 = Q[1], lam;
    if (x1 === x2) {
      if ((y1 + y2) % EC.p === 0) return null;
      lam = ((3 * x1 * x1 + EC.a) * eInv((2 * y1) % EC.p, EC.p)) % EC.p;
    } else {
      lam = (((y2 - y1) % EC.p + EC.p) % EC.p) * eInv(((x2 - x1) % EC.p + EC.p) % EC.p, EC.p) % EC.p;
    }
    lam = ((lam % EC.p) + EC.p) % EC.p;
    var x3 = (((lam * lam - x1 - x2) % EC.p) + EC.p) % EC.p;
    var y3 = (((lam * (x1 - x3) - y1) % EC.p) + EC.p) % EC.p;
    return [x3, y3];
  }
  function eMul(k, P) {
    var R = null, A = P;
    k = ((k % EC.n) + EC.n) % EC.n;
    while (k > 0) {
      if (k & 1) R = eAdd(R, A);
      A = eAdd(A, A);
      k >>= 1;
    }
    return R;
  }

  var TOTAL = 6;
  var idx2 = 0, score = 0, finished = false,
      cur = null, curA = 0, locked = false,
      levels = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'gm-wrap';
  wrap.innerHTML =
    '<div class="gm-prog" id="gm-prog"></div>' +
    '<div class="gm-stage" id="gm-stage"></div>' +
    '<div class="gm-q" id="gm-q"></div>' +
    '<div class="gm-opts" id="gm-opts"></div>' +
    '<div class="gm-msg" id="gm-msg"></div>' +
    '<div class="gm-expl" id="gm-expl"></div>' +
    '<div class="gm-opts"><button class="btn green" id="gm-next" hidden></button>' +
    '<button class="btn" id="gm-reroll">' + T('gs.gm-gateway.rerollBtn') + '</button></div>' +
    '<div class="gm-opts"><button class="btn" id="gm-daily">' + T('gs.gm-gateway.dailyBtn') + '</button></div>' +
    '<div class="gm-help">' + T('gs.gm-gateway.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('gm-prog'), stageEl = $('gm-stage'), qEl = $('gm-q'),
      optsEl = $('gm-opts'), msgEl = $('gm-msg'), explEl = $('gm-expl'),
      nextB = $('gm-next'), rerollB = $('gm-reroll'), dailyBtn = $('gm-daily');

  function upd() { progEl.textContent = fmt('gs.gm-gateway.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'gm-msg ' + c; msgEl.textContent = t; }

  function buildLevels() {
    var ls = [];
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    /* L2 SM4 */
    var mk = randHex32();
    var pt1 = randHex32(), pt2 = randHex32(), mk2 = randHex32();
    var c1 = sm4Enc(pt1, mk);
    ls.push({ kind: 'sm4', mk: mk, pt: pt1, c: c1, c2: sm4Enc(pt2, mk), c3: sm4Enc(pt1, mk2), e: 'e2' });
    /* L3 SM3 */
    var WORDS = ['HELLO', 'ALPHA', 'CIPHER', 'SHANGHAI', 'SECRET'];
    var w = WORDS[Math.floor(rnd() * WORDS.length)];
    var mb = [];
    for (var i = 0; i < w.length; i++) mb.push(w.charCodeAt(i));
    var dg = sm3(mb);
    var dg2 = sm3(mb.concat([0]));
    var dg3 = sm3(mb.slice(0, mb.length - 1));
    var mb4 = mb.slice(); mb4[mb4.length - 1] ^= 1;
    var dg4 = sm3(mb4);
    var opts4 = [dg, dg2, dg3, dg4];
    ls.push({ kind: 'sm3', w: w, dg: dg, opts: opts4, e: 'e3' });
    /* L4 SM2 式验签（微型曲线） */
    var sign = null;
    for (var tries = 0; tries < 60 && !sign; tries++) {
      var d = 2 + Math.floor(rnd() * 16);
      var A = eMul(d, EC.G);
      var k = 2 + Math.floor(rnd() * 16);
      var R = eMul(k, EC.G);
      if (!A || !R) continue;
      var eHex = sm3(mb);
      var e0 = parseInt(eHex.slice(0, 4), 16) % EC.n;
      var r = (R[0] + e0) % EC.n;
      var s = (eInv((1 + d) % EC.n, EC.n) * ((((k - r * d) % EC.n) + EC.n) % EC.n)) % EC.n;
      if (s === 0) continue;
      var t = (r + s) % EC.n;
      var sg = eMul(s, EC.G), ta = eMul(t, A);
      var pt1v = eAdd(sg, ta);
      var x1v = pt1v ? pt1v[0] : -1;
      var opts = [String(x1v), String(sg ? sg[0] : -1), String(ta ? ta[0] : -1), String(A[0])];
      var uniq = {};
      var okUnique = true;
      opts.forEach(function (o) { if (uniq[o]) okUnique = false; uniq[o] = 1; });
      if (!okUnique) continue;
      sign = { d: d, A: A, k: k, R: R, r: r, e: eHex, s: s, x1: x1v, sg: sg, ta: ta, opts: opts, ok: ((x1v + e0) % EC.n) === r };
    }
    if (!sign) { /* 极罕见兜底：固定值 */
      var dF = 5, AF = eMul(dF, EC.G), kF = 3, RF = eMul(kF, EC.G);
      var eHexF = sm3(mb), e0F = parseInt(eHexF.slice(0, 4), 16) % EC.n;
      var rF = (RF[0] + e0F) % EC.n;
      var sF = (eInv((1 + dF) % EC.n, EC.n) * ((((kF - rF * dF) % EC.n) + EC.n) % EC.n)) % EC.n;
      var tF = (rF + sF) % EC.n, sgF = eMul(sF, EC.G), taF = eMul(tF, AF), ptF = eAdd(sgF, taF);
      var x1F = ptF ? ptF[0] : -1;
      sign = { d: dF, A: AF, k: kF, R: RF, r: rF, e: eHexF, s: sF, x1: x1F, sg: sgF, ta: taF, opts: [String(x1F), String(sgF ? sgF[0] : -1), String(taF ? taF[0] : -1), String(AF[0])], ok: ((x1F + e0F) % EC.n) === rF };
    }
    ls.push({ kind: 'sign', sign: sign, e: 'e4' });
    ls.push({ kind: 'know', q: 'l5q', opts: ['l5o1', 'l5o2', 'l5o3', 'l5o4'], a: 0, e: 'e5' });
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3', 'l6o4'], a: 0, e: 'e6' });
    return ls;
  }

  function renderOpts(list, correctRef) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    curA = list.indexOf(correctRef);
    optsEl.innerHTML = '';
    list.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = o;
      b.addEventListener('click', function () { optsEl._pick = oi; judge(oi === curA); });
      optsEl.appendChild(b);
    });
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.gm-gateway.' + ({ know: 'stageKnow', sm4: 'stageSm4', sm3: 'stageSm3', sign: 'stageSign' }[cur.kind]));
    qEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    locked = false;

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.gm-gateway.' + cur.q);
      renderOpts(cur.opts.map(function (k) { return T('gs.gm-gateway.' + k); }), T('gs.gm-gateway.' + cur.opts[cur.a]));
    } else if (cur.kind === 'sm4') {
      qEl.textContent = fmt('gs.gm-gateway.l2q', { mk: cur.mk, pt: cur.pt });
      renderOpts([cur.c, cur.c2, cur.c3, cur.pt], cur.c);
    } else if (cur.kind === 'sm3') {
      qEl.textContent = fmt('gs.gm-gateway.l3q', { msg: cur.w });
      renderOpts(cur.opts, cur.dg);
    } else if (cur.kind === 'sign') {
      var sg = cur.sign;
      qEl.textContent = fmt('gs.gm-gateway.l4q', {
        pa: '(' + sg.A[0] + ',' + sg.A[1] + ')',
        r: sg.r, s: sg.s, e: sg.e
      });
      renderOpts(sg.opts, String(sg.x1));
    }
    upd();
  }

  function judge(ok) {
    if (finished) return;
    locked = true;
    if (ok) { score += 20; setMsg('ok', T('gs.gm-gateway.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.gm-gateway.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    if (optsEl.children.length) {
      var pick = optsEl._pick;
      if (pick !== undefined && optsEl.children[pick]) optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
      if (!ok && optsEl.children[curA]) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    }
    var extra = '';
    if (cur.kind === 'sign') extra = fmt('gs.gm-gateway.e4', { ok: cur.sign.ok ? (isEn() ? 'valid' : '有效') : (isEn() ? 'invalid' : '无效') });
    explEl.textContent = '📌 ' + (extra || T('gs.gm-gateway.' + cur.e));
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }
  nextB.onclick = nextQ;

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('gm-gateway', sec); }
    stageEl.textContent = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.gm-gateway.done', { score: score }));
    nextB.textContent = T('gs.gm-gateway.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function regen() {
    if (finished) return;
    levels = buildLevels();
    locked = false;
    renderQ();
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 71 + 29); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  rerollB.addEventListener('click', regen);
  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  window.GM_ENGINE = { sm4Enc: sm4Enc, sm4Dec: sm4Dec, sm3: sm3, eAdd: eAdd, eMul: eMul, eInv: eInv, EC: EC };
  startGame(false);
})();
