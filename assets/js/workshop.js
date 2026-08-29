/* ============================================================
   破译工坊 · Workshop —— 全网独家的「加密/破解二合一实验室」
   纯前端、零依赖、15 种经典算法：
   加密：明文 + 算法 + 密钥 → 密文
   破解：密文 → 自动检测（凯撒穷举/频率分析/Kasiski/栅栏穷举）→ 一键破解
   依赖：无（独立算法库；页面需 i18n.js + i18n-dict.js 提供文案）
   ============================================================ */
window.Workshop = (function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var idx = function (c) { return A.indexOf(c.toUpperCase()); };
  /* 双语助手（工坊 i18n）：按当前界面语言取文案 */
  function L(zh, en) {
    return (window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en') ? en : zh;
  }

  /* ================= 算法族（加密 enc / 解密 dec） ================= */

  /* 1. 凯撒 */
  function caesarEnc(s, k) {
    return s.split('').map(function (c) {
      var i = idx(c); return i < 0 ? c : A[(i + k % 26 + 26) % 26];
    }).join('');
  }
  function caesarDec(s, k) { return caesarEnc(s, -k); }

  /* 2. 仿射 */
  function modInv(a) { for (var x = 1; x < 26; x++) if ((a * x) % 26 === 1) return x; return 1; }
  function affineEnc(s, a, b) {
    return s.split('').map(function (c) {
      var i = idx(c); return i < 0 ? c : A[((a * i + b) % 26 + 26) % 26];
    }).join('');
  }
  function affineDec(s, a, b) {
    var ai = modInv(a);
    return s.split('').map(function (c) {
      var i = idx(c); return i < 0 ? c : A[((ai * (i - b)) % 26 + 26) % 26];
    }).join('');
  }

  /* 3. 单表替换（密钥=26 字母置换表，按 A-Z 给出替换后字母） */
  function subEnc(s, table) {
    var t = (table || A).toUpperCase();
    return s.split('').map(function (c) {
      var i = idx(c); return i < 0 ? c : (t[i] || c);
    }).join('');
  }
  function subDec(s, table) {
    var t = (table || A).toUpperCase();
    return s.split('').map(function (c) {
      var j = t.indexOf(c.toUpperCase());
      return j < 0 ? c : A[j];
    }).join('');
  }

  /* 4. 维吉尼亚 */
  function vigenere(s, key, mode) {
    var kk = (key || 'KEY').toUpperCase().replace(/[^A-Z]/g, '');
    if (!kk) return s;
    var out = '', ki = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), x = idx(c);
      if (x < 0) { out += c; continue; }
      var shift = idx(kk.charAt(ki % kk.length));
      out += A[((x + (mode === 'enc' ? shift : -shift)) % 26 + 26) % 26];
      ki++;
    }
    return out;
  }

  /* 5. 栅栏（换位） */
  function railEnc(s, rails) {
    var n = s.length, rows = [];
    for (var i = 0; i < rails; i++) rows.push('');
    var r = 0, dir = 1;
    for (var j = 0; j < n; j++) {
      rows[r] += s.charAt(j);
      r += dir;
      if (r === rails - 1) dir = -1;
      if (r === 0) dir = 1;
    }
    return rows.join('');
  }
  function railDec(s, rails) {
    var n = s.length, rows = [];
    for (var i = 0; i < rails; i++) rows.push([]);
    var r = 0, dir = 1, pos = [];
    for (var j = 0; j < n; j++) {
      pos.push(r);
      r += dir;
      if (r === rails - 1) dir = -1;
      if (r === 0) dir = 1;
    }
    var lens = [];
    for (var k = 0; k < rails; k++) lens.push(pos.filter(function (p) { return p === k; }).length);
    var cursor = 0, out = new Array(n);
    for (var ri = 0; ri < rails; ri++) {
      for (var ci = 0; ci < n; ci++) if (pos[ci] === ri) out[ci] = s.charAt(cursor++);
    }
    return out.join('');
  }

  /* 6. Playfair（5×5，I/J 合并） */
  function playfairTable(key) {
    var seen = {}, t = [];
    (key.toUpperCase() + A).split('').forEach(function (c) {
      if (c === 'J') c = 'I';
      if (!seen[c]) { seen[c] = 1; t.push(c); }
    });
    return t;
  }
  function playfair(s, key, mode) {
    var t = playfairTable(key);
    var pos = {};
    for (var i = 0; i < 25; i++) pos[t[i]] = [Math.floor(i / 5), i % 5];
    var clean = s.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (clean.length % 2) clean += 'X';
    var out = '';
    for (var k = 0; k < clean.length; k += 2) {
      var a = pos[clean.charAt(k)], b = pos[clean.charAt(k + 1)];
      if (!a || !b) continue;
      var step = mode === 'enc' ? 1 : 4;
      var na, nb;
      if (a[0] === b[0]) {
        na = t[a[0] * 5 + ((a[1] + step) % 5)];
        nb = t[b[0] * 5 + ((b[1] + step) % 5)];
      } else if (a[1] === b[1]) {
        na = t[((a[0] + step) % 5) * 5 + a[1]];
        nb = t[((b[0] + step) % 5) * 5 + b[1]];
      } else {
        na = t[a[0] * 5 + b[1]];
        nb = t[b[0] * 5 + a[1]];
      }
      out += na + nb;
    }
    return out;
  }

  /* 7. ADFGVX（简化：6×6 Polybius 替换，无列换位） */
  var ADFGVX_ROWS = 'ADFGVX';
  function adfgvxTable(key) {
    var seen = {}, t = [];
    (key.toUpperCase() + A + '0123456789').split('').forEach(function (c) {
      if (!seen[c]) { seen[c] = 1; t.push(c); }
    });
    return t.slice(0, 36);
  }
  function adfgvxEnc(s, key) {
    var t = adfgvxTable(key);
    var pos = {};
    for (var i = 0; i < 36; i++) pos[t[i]] = i;
    var out = '';
    for (var j = 0; j < s.length; j++) {
      var c = s.charAt(j).toUpperCase();
      var p = pos[c];
      if (p === undefined) { out += c; continue; }
      out += ADFGVX_ROWS[Math.floor(p / 6)] + ADFGVX_ROWS[p % 6];
    }
    return out;
  }
  function adfgvxDec(s, key) {
    var t = adfgvxTable(key);
    var out = '';
    var clean = s.toUpperCase().replace(/[^ADFGVX]/g, '');
    for (var j = 0; j + 1 < clean.length; j += 2) {
      var r = ADFGVX_ROWS.indexOf(clean.charAt(j));
      var c = ADFGVX_ROWS.indexOf(clean.charAt(j + 1));
      out += t[r * 6 + c] || '?';
    }
    return out;
  }

  /* 8. 培根（A=0 B=1，5 位一组） */
  function baconEnc(s) {
    return s.toUpperCase().split('').map(function (c) {
      var i = idx(c);
      if (i < 0) return c;
      var bits = '';
      for (var b = 4; b >= 0; b--) bits += (i >> b) & 1 ? 'B' : 'A';
      return bits;
    }).join('');
  }
  function baconDec(bitsStr) {
    var s = bitsStr.replace(/[^AB]/gi, '');
    var out = '';
    for (var i = 0; i + 5 <= s.length; i += 5) {
      var v = 0;
      for (var j = 0; j < 5; j++) v = (v << 1) | (s.charAt(i + j).toUpperCase() === 'B' ? 1 : 0);
      out += v < 26 ? A[v] : '?';
    }
    return out;
  }

  /* 9. 摩斯 */
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.' };
  var MORSE_REV = {};
  for (var mk in MORSE) MORSE_REV[MORSE[mk]] = mk;
  function morseEnc(s) {
    return s.toUpperCase().split('').map(function (c) {
      return MORSE[c] || (c === ' ' ? '/' : c);
    }).join(' ');
  }
  function morseDec(s) {
    return s.trim().split(/\s+/).map(function (tok) {
      if (tok === '/') return ' ';
      return MORSE_REV[tok] || '?';
    }).join('');
  }

  /* 10. 异或（十六进制密文 ↔ ASCII） */
  function xorEnc(plain, key) {
    var out = '';
    for (var i = 0; i < plain.length; i++) {
      out += ('0' + (plain.charCodeAt(i) ^ key.charCodeAt(i % key.length)).toString(16)).slice(-2);
    }
    return out;
  }
  function xorDec(hexStr, key) {
    var hex = String(hexStr || '').replace(/\s+/g, '');
    var out = '';
    for (var i = 0; i + 1 < hex.length; i += 2) {
      var b = parseInt(hex.substring(i, i + 2), 16);
      if (isNaN(b)) continue;
      out += String.fromCharCode(b ^ key.charCodeAt((i / 2) % key.length));
    }
    return out;
  }

  /* 11. Bifid（5×5 坐标重组，I/J 合并） */
  function bifidTable(key) {
    var seen = {}, t = [];
    (key.toUpperCase() + A).split('').forEach(function (c) {
      if (c === 'J') c = 'I';
      if (!seen[c]) { seen[c] = 1; t.push(c); }
    });
    return t;
  }
  /* 加密：明文坐标（行列交替）→ 行全在前列全在后 → 每 2 个一组查表
     解密：密文坐标 → 前 n 个为行、后 n 个为列 → 还原 */
  function bifid(s, key, mode) {
    var t = bifidTable(key);
    var pos = {};
    for (var i = 0; i < 25; i++) pos[t[i]] = [Math.floor(i / 5), i % 5];
    var clean = s.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    var n = clean.length;
    if (!n) return '';
    if (mode === 'enc') {
      var rows = [], cols = [];
      for (var j = 0; j < n; j++) {
        var p = pos[clean.charAt(j)];
        rows.push(p[0]); cols.push(p[1]);
      }
      var all = rows.concat(cols); // 2n：行全在前，列全在后
      var out = '';
      for (var k = 0; k < n; k++) out += t[all[k * 2] * 5 + all[k * 2 + 1]];
      return out;
    } else {
      var seq = [];
      for (var m = 0; m < n; m++) {
        var q = pos[clean.charAt(m)];
        seq.push(q[0], q[1]);
      }
      /* seq = [r0,c0,r1,c1,...]（密文坐标交替）→ 前 n 个行、后 n 个列 */
      var out2 = '';
      for (var z = 0; z < n; z++) out2 += t[seq[z] * 5 + seq[z + n]];
      return out2;
    }
  }

  /* 12. Trifid（3×3×3 立体分块，27 字符 A-Z + .） */
  var T3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.'; // 27 字符
  function trifid(s, mode) {
    var clean = s.toUpperCase().replace(/[^A-Z.]/g, '');
    var n = clean.length;
    if (!n) return '';
    if (mode === 'enc') {
      /* 明文坐标（层/行/列交替）→ 三层分别集中 → 每 3 个一组查表 */
      var L = [], R = [], C = [];
      for (var i = 0; i < n; i++) {
        var v = T3.indexOf(clean.charAt(i));
        if (v < 0) return '';
        L.push(Math.floor(v / 9)); R.push(Math.floor((v % 9) / 3)); C.push(v % 3);
      }
      var all = L.concat(R).concat(C); // 3n：层全在前，行居中，列在后
      var out = '';
      for (var j = 0; j < n; j++) out += T3[all[j * 3] * 9 + all[j * 3 + 1] * 3 + all[j * 3 + 2]] || '?';
      return out;
    } else {
      var seq = [];
      for (var k = 0; k < n; k++) {
        var v2 = T3.indexOf(clean.charAt(k));
        if (v2 < 0) return '';
        seq.push(Math.floor(v2 / 9), Math.floor((v2 % 9) / 3), v2 % 3);
      }
      /* seq = 密文坐标交替（3n）→ 第 i 个明文字母坐标 = (seq[i], seq[n+i], seq[2n+i]) */
      var out2 = '';
      for (var m2 = 0; m2 < n; m2++) out2 += T3[seq[m2] * 9 + seq[m2 + n] * 3 + seq[m2 + 2 * n]] || '?';
      return out2;
    }
  }

  /* 13. 希尔 2×2（密钥=4 数字 k11 k12 k21 k22） */
  function hillEnc(s, a, b, c, d) {
    var det = (a * d - b * c + 26) % 26;
    if (modInv(det) === 1 && det !== 1) {
      var _en = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
      return _en ? 'ERR: key not invertible' : 'ERR: 密钥不可逆';
    }
    var clean = s.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length % 2) clean += 'X';
    var out = '';
    for (var i = 0; i < clean.length; i += 2) {
      var x = idx(clean.charAt(i)), y = idx(clean.charAt(i + 1));
      var e1 = ((a * x + b * y) % 26 + 26) % 26;
      var e2 = ((c * x + d * y) % 26 + 26) % 26;
      out += A[e1] + A[e2];
    }
    return out;
  }
  function hillDec(s, a, b, c, d) {
    var det = (a * d - b * c + 26) % 26;
    var di = modInv(det);
    var na = (d * di) % 26, nb = ((-b * di) % 26 + 26) % 26;
    var nc = ((-c * di) % 26 + 26) % 26, nd = (a * di) % 26;
    return hillEnc(s, na, nb, nc, nd);
  }

  /* 14. Base64 */
  function b64Enc(s) {
    try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return btoa(s); }
  }
  function b64Dec(s) {
    try { return decodeURIComponent(escape(atob(s.trim()))); } catch (e) { try { return atob(s.trim()); } catch (e2) { return '?'; } }
  }

  /* 15. 二进制（8 位 ASCII） */
  function binEnc(s) {
    return s.split('').map(function (c) {
      var b = c.charCodeAt(0).toString(2);
      while (b.length < 8) b = '0' + b;
      return b;
    }).join(' ');
  }
  function binDec(s) {
    return s.trim().split(/\s+/).map(function (b) {
      return String.fromCharCode(parseInt(b, 2));
    }).join('');
  }
  /* 自动密钥（第四期 C1b 第 16 算法）：密钥流 = 引子 + 明文 */
  function autokey(s, key, mode) {
    var kk = (key || 'KEY').toUpperCase().replace(/[^A-Z]/g, '');
    if (!kk) return s;
    var clean = s.replace(/[^A-Z]/g, '');   /* 输入侧字母流（enc=明文 / dec=密文） */
    var produced = '';                       /* 输出字母流 */
    var out = '';
    for (var pos = 0; pos < s.length; pos++) {
      var c = s.charAt(pos), x = idx(c);
      if (x < 0) { out += c; continue; }
      var n = produced.length;
      var kch = n < kk.length ? kk.charAt(n) : (mode === 'enc' ? clean.charAt(n - kk.length) : produced.charAt(n - kk.length));
      var shift = idx(kch || 'A');
      out += A[((x + (mode === 'enc' ? shift : -shift)) % 26 + 26) % 26];
      produced += A[((x + (mode === 'enc' ? shift : -shift)) % 26 + 26) % 26];
    }
    return out;
  }



  /* ================= 现代引擎二：AES-128（FIPS 197）/ HMAC-SHA256（RFC 4231） ================= */
  /* AES 与 WebCrypto（C1/零向量/200 随机往返）对拍；HMAC 与 WebCrypto 对拍（RFC 4231 Case 1-3）*/
  /* ================= AES-128 ================= */
  const AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];
  const ISBOX = new Array(256);
  for (let i = 0; i < 256; i++) ISBOX[AES_SBOX[i]] = i;
  const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
  function xtime(x) { return ((x << 1) ^ ((x & 0x80) ? 0x1b : 0)) & 0xff; }
  function gmul(a, b) {
    let r = 0;
    while (b > 0) { if (b & 1) r ^= a; a = xtime(a); b >>= 1; }
    return r & 0xff;
  }
  function aesExpand(keyBytes) {
    const w = new Array(44);
    for (let i = 0; i < 4; i++) w[i] = ((keyBytes[i * 4] << 24) | (keyBytes[i * 4 + 1] << 16) | (keyBytes[i * 4 + 2] << 8) | keyBytes[i * 4 + 3]) >>> 0;
    const rs = (x) => ((((x << 8) | (x >>> 24)) >>> 0));
    function subW(x) { return ((AES_SBOX[(x >>> 24) & 255] << 24) | (AES_SBOX[(x >>> 16) & 255] << 16) | (AES_SBOX[(x >>> 8) & 255] << 8) | AES_SBOX[x & 255]) >>> 0; }
    for (let i = 4; i < 44; i++) {
      let t = w[i - 1];
      if (i % 4 === 0) t = (subW(rs(t)) ^ (RCON[i / 4 - 1] << 24)) >>> 0;
      w[i] = (w[i - 4] ^ t) >>> 0;
    }
    return w;
  }
  function addRoundKey(st, w, r) {
    for (let i = 0; i < 16; i++) st[i] ^= (w[r * 4 + (i >> 2)] >>> (24 - (i & 3) * 8)) & 0xff;
  }
  function subBytes(st) { for (let i = 0; i < 16; i++) st[i] = AES_SBOX[st[i]]; }
  function invSubBytes(st) { for (let i = 0; i < 16; i++) st[i] = ISBOX[st[i]]; }
  function shiftRows(st) {
    const t = st.slice();
    st[4] = t[5]; st[5] = t[6]; st[6] = t[7]; st[7] = t[4];
    st[8] = t[10]; st[9] = t[11]; st[10] = t[8]; st[11] = t[9];
    st[12] = t[15]; st[13] = t[12]; st[14] = t[13]; st[15] = t[14];
  }
  function invShiftRows(st) {
    const t = st.slice();
    st[4] = t[7]; st[5] = t[4]; st[6] = t[5]; st[7] = t[6];
    st[8] = t[10]; st[9] = t[11]; st[10] = t[8]; st[11] = t[9];
    st[12] = t[13]; st[13] = t[14]; st[14] = t[15]; st[15] = t[12];
  }
  function mixColumns(st) {
    for (let c = 0; c < 4; c++) {
      const i = c * 4, a = st[i], b = st[i + 1], d = st[i + 2], e = st[i + 3];
      st[i] = gmul(a, 2) ^ gmul(b, 3) ^ d ^ e;
      st[i + 1] = a ^ gmul(b, 2) ^ gmul(d, 3) ^ e;
      st[i + 2] = a ^ b ^ gmul(d, 2) ^ gmul(e, 3);
      st[i + 3] = gmul(a, 3) ^ b ^ d ^ gmul(e, 2);
    }
  }
  function invMixColumns(st) {
    for (let c = 0; c < 4; c++) {
      const i = c * 4, a = st[i], b = st[i + 1], d = st[i + 2], e = st[i + 3];
      st[i] = gmul(a, 14) ^ gmul(b, 11) ^ gmul(d, 13) ^ gmul(e, 9);
      st[i + 1] = gmul(a, 9) ^ gmul(b, 14) ^ gmul(d, 11) ^ gmul(e, 13);
      st[i + 2] = gmul(a, 13) ^ gmul(b, 9) ^ gmul(d, 14) ^ gmul(e, 11);
      st[i + 3] = gmul(a, 11) ^ gmul(b, 13) ^ gmul(d, 9) ^ gmul(e, 14);
    }
  }
  function aesBlock(bytes, keyB, enc) {
    /* 二维标准布局 A[r][c] = in[r + 4c]（FIPS 197 5.1）；enc 与 dec 均已与 WebCrypto 对拍 */
    const w = aesExpand(keyB);
    const inA = [];
    for (let i = 0; i < 16; i++) inA[i] = bytes[i] & 255;
    const A = [];
    for (let r = 0; r < 4; r++) { A[r] = []; for (let c = 0; c < 4; c++) A[r][c] = inA[r + 4 * c]; }
    function addKey(rd) {
      for (let c = 0; c < 4; c++) {
        const wd = w[rd * 4 + c];
        for (let r = 0; r < 4; r++) A[r][c] ^= (wd >>> (24 - r * 8)) & 255;
      }
    }
    function sub() { for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) A[r][c] = AES_SBOX[A[r][c]]; }
    function invSub() { for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) A[r][c] = ISBOX[A[r][c]]; }
    function shf() { for (let r = 1; r < 4; r++) { const row = A[r].slice(); for (let c = 0; c < 4; c++) A[r][c] = row[(c + r) % 4]; } }
    function invShf() { for (let r = 1; r < 4; r++) { const row = A[r].slice(); for (let c = 0; c < 4; c++) A[r][c] = row[(c - r + 4) % 4]; } }
    function mixc() {
      for (let c = 0; c < 4; c++) {
        const v = [A[0][c], A[1][c], A[2][c], A[3][c]];
        const m = [gmul(v[0], 2) ^ gmul(v[1], 3) ^ v[2] ^ v[3], v[0] ^ gmul(v[1], 2) ^ gmul(v[2], 3) ^ v[3], v[0] ^ v[1] ^ gmul(v[2], 2) ^ gmul(v[3], 3), gmul(v[0], 3) ^ v[1] ^ v[2] ^ gmul(v[3], 2)];
        for (let r = 0; r < 4; r++) A[r][c] = m[r];
      }
    }
    function invMixc() {
      for (let c = 0; c < 4; c++) {
        const v = [A[0][c], A[1][c], A[2][c], A[3][c]];
        const m = [gmul(v[0], 14) ^ gmul(v[1], 11) ^ gmul(v[2], 13) ^ gmul(v[3], 9), gmul(v[0], 9) ^ gmul(v[1], 14) ^ gmul(v[2], 11) ^ gmul(v[3], 13), gmul(v[0], 13) ^ gmul(v[1], 9) ^ gmul(v[2], 14) ^ gmul(v[3], 11), gmul(v[0], 11) ^ gmul(v[1], 13) ^ gmul(v[2], 9) ^ gmul(v[3], 14)];
        for (let r = 0; r < 4; r++) A[r][c] = m[r];
      }
    }
    if (enc) {
      addKey(0);
      for (let r = 1; r < 10; r++) { sub(); shf(); mixc(); addKey(r); }
      sub(); shf(); addKey(10);
    } else {
      /* 完整数学逆序：逆第 10 轮 → 逆第 9..1 轮（各含 ARK→InvMC→InvShf→InvSub）→ 逆第 0 轮 */
      addKey(10); invShf(); invSub();
      for (let r = 9; r >= 1; r--) { addKey(r); invMixc(); invShf(); invSub(); }
      addKey(0);
    }
    const out = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out[r + 4 * c] = A[r][c];
    return out;
  }
  
  /* ================= 共享字节工具 ================= */
  function utf8Bytes(s) {
    const out = [];
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xc0 | (c >> 6)); out.push(0x80 | (c & 63)); }
      else { out.push(0xe0 | (c >> 12)); out.push(0x80 | ((c >> 6) & 63)); out.push(0x80 | (c & 63)); }
    }
    return out;
  }
  function hexBytes(s) { const a = []; for (let i = 0; i < s.length; i += 2) a.push(parseInt(s.substr(i, 2), 16)); return a; }
  function hexStr(a) { return a.map(b => b.toString(16).padStart(2, '0')).join(''); }
  
  
  /* ================= SHA-256 内部（字节级） ================= */
  function sha256Bytes(data) {
    const bitLen = data.length * 8;
    data.push(0x80);
    while (data.length % 64 !== 56) data.push(0);
    for (let i = 7; i >= 0; i--) data.push((bitLen / Math.pow(2, i * 8)) & 0xff);
    const h = H256.slice();
    const w = new Array(64);
    for (let off = 0; off < data.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = ((data[off + i * 4] << 24) | (data[off + i * 4 + 1] << 16) | (data[off + i * 4 + 2] << 8) | data[off + i * 4 + 3]) >>> 0;
      for (let i = 16; i < 64; i++) {
        const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
        const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        const ch = ((e & f) ^ ((~e) & g)) >>> 0;
        const t1 = (hh + S1 + ch + K256[i] + w[i]) >>> 0;
        const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const out = [];
    h.forEach(function (x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); });
    return out;
  }
  function sha256(s) { return hexStr(sha256Bytes(utf8Bytes(s))); }
  function hmacRaw(keyB, msgB) {
    let k = keyB.slice();
    if (k.length > 64) k = sha256Bytes(k);
    while (k.length < 64) k.push(0);
    const ipad = k.map(function (b) { return b ^ 0x36; });
    const opad = k.map(function (b) { return b ^ 0x5c; });
    const inner = sha256Bytes(ipad.concat(msgB));
    return sha256Bytes(opad.concat(inner));
  }
  function hmacSha256(keyStr, msgStr) { return hexStr(hmacRaw(utf8Bytes(String(keyStr || '')), utf8Bytes(msgStr))); }
  
  
  
  /* ---- AES/HMAC 工坊封装（PKCS#7 + hex，16 字节块） ---- */
  function keyBytes16(s) {
    var raw = utf8Bytes(String(s || ''));
    var arr = [];
    for (var i = 0; i < 16; i++) arr.push(raw[i] !== undefined ? raw[i] : 0);
    return arr;
  }
  function aesEnc(s, keyStr) {
    var data = utf8Bytes(s);
    var pad = 16 - (data.length % 16);
    for (var i = 0; i < pad; i++) data.push(pad);
    var out = [];
    for (var off = 0; off < data.length; off += 16) {
      out = out.concat(aesBlock(data.slice(off, off + 16), keyBytes16(keyStr), true));
    }
    return out.map(function (b) { return b.toString(16).padStart(2, '0').toUpperCase(); }).join(' ');
  }
  function aesDec(hexIn, keyStr) {
    var hex = String(hexIn || '').replace(/[^0-9A-Fa-f]/g, '');
    if (hex.length === 0 || hex.length % 32 !== 0) return 'ERR: hex 长度需为 16 字节整数倍';
    var data = [];
    for (var i = 0; i < hex.length; i += 2) data.push(parseInt(hex.substr(i, 2), 16));
    var out = [];
    for (var off = 0; off < data.length; off += 16) {
      out = out.concat(aesBlock(data.slice(off, off + 16), keyBytes16(keyStr), false));
    }
    var pad = out[out.length - 1];
    if (pad >= 1 && pad <= 16) out.length -= pad;
    return utf8Decode(out);
  }
  
  /* ================= 现代引擎：DES（FIPS 46-3）/ SHA-256（FIPS 180-4） ================= */
  /* 引擎经官方向量对拍验证（NIST/FIPS 81/Wikipedia DES 示例 + SHA-256 4 组标准向量），勿改数值表 */
  const IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
  const FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
  const E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
  const P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
  const PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
  const PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
  const SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
  const SBOX = [
  [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
  [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
  [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
  [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
  [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
  [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
  [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
  [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]
  ];
  function permute64(inp, table, inBits) {
    let out = 0n;
    for (let i = 0; i < table.length; i++) {
      out = (out << 1n) | ((inp >> BigInt(inBits - table[i])) & 1n);
    }
    return out;
  }
  function desSubkeys(key) {
    let k = 0n;
    for (let i = 0; i < 8; i++) k = (k << 8n) | BigInt(key[i] & 0xff);
    const pc1 = permute64(k, PC1, 64);
    let c = Number((pc1 >> 28n) & 0x0fffffffn);
    let d = Number(pc1 & 0x0fffffffn);
    const ks = [];
    for (let r = 0; r < 16; r++) {
      for (let s = 0; s < SHIFTS[r]; s++) {
        c = ((c << 1) & 0x0fffffff) | (c >>> 27);
        d = ((d << 1) & 0x0fffffff) | (d >>> 27);
      }
      ks.push(permute64((BigInt(c) << 28n) | BigInt(d), PC2, 56));
    }
    return ks;
  }
  function desCrypt(bytes, key, enc) {
    const ks = desSubkeys(key);
    const out = [];
    for (let off = 0; off < bytes.length; off += 8) {
      let block = 0n;
      for (let i = 0; i < 8; i++) {
        const b = (bytes[off + i] === undefined ? 0 : bytes[off + i]) & 0xff;
        block = (block << 8n) | BigInt(b);
      }
      const ip = permute64(block, IP, 64);
      let L = Number((ip >> 32n) & 0xffffffffn);
      let R = Number(ip & 0xffffffffn);
      for (let r = 0; r < 16; r++) {
        const s = enc ? ks[r] : ks[15 - r];
        const fE = permute64(BigInt(R), E, 32);
        const x = fE ^ s;
        let f = 0;
        for (let g = 0; g < 8; g++) {
          const six = Number((x >> BigInt(42 - g * 6)) & 63n);
          const row = ((six & 32) >> 4) | (six & 1);
          const col = (six >> 1) & 15;
          f = (f << 4) | SBOX[g][row * 16 + col];
        }
        f = Number(permute64(BigInt(f), P, 32));
        const t = (L ^ f) >>> 0;
        L = R; R = t;
      }
      const pre = (BigInt(R) << 32n) | BigInt(L);
      const res = permute64(pre, FP, 64);
      for (let i = 7; i >= 0; i--) out.push(Number((res >> BigInt(i * 8)) & 0xffn));
    }
    return out;
  }
  
  
  const K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const H256 = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
  function utf8Bytes(s) {
    const out = [];
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xc0 | (c >> 6)); out.push(0x80 | (c & 63)); }
      else { out.push(0xe0 | (c >> 12)); out.push(0x80 | ((c >> 6) & 63)); out.push(0x80 | (c & 63)); }
    }
    return out;
  }
  function sha256(s) {
    const data = utf8Bytes(s);
    const bitLen = data.length * 8;
    data.push(0x80);
    while (data.length % 64 !== 56) data.push(0);
    for (let i = 7; i >= 0; i--) data.push((bitLen / Math.pow(2, i * 8)) & 0xff);
    const h = H256.slice();
    const w = new Array(64);
    for (let off = 0; off < data.length; off += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = ((data[off + i * 4] << 24) | (data[off + i * 4 + 1] << 16) | (data[off + i * 4 + 2] << 8) | data[off + i * 4 + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = (rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15]>>>3)) >>> 0;
        const s1 = (rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2]>>>10)) >>> 0;
        w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
      }
      let a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = (rotr(e,6) ^ rotr(e,11) ^ rotr(e,25)) >>> 0;
        const ch = ((e & f) ^ ((~e) & g)) >>> 0;
        const t1 = (hh + S1 + ch + K256[i] + w[i]) >>> 0;
        const S0 = (rotr(a,2) ^ rotr(a,13) ^ rotr(a,22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const t2 = (S0 + maj) >>> 0;
        hh=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
      h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
    }
    return h.map(x => x.toString(16).padStart(8, '0')).join('');
  }
  
  
  function keyBytes(s) {
    var raw = utf8Bytes(String(s || ''));
    var arr = [];
    for (var i = 0; i < 8; i++) arr.push(raw[i] !== undefined ? raw[i] : 0);
    return arr;
  }
  function utf8Decode(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length;) {
      var b = bytes[i];
      if (b < 0x80) { s += String.fromCharCode(b); i += 1; }
      else if ((b & 0xe0) === 0xc0 && i + 1 < bytes.length) { s += String.fromCharCode(((b & 31) << 6) | (bytes[i + 1] & 63)); i += 2; }
      else if ((b & 0xf0) === 0xe0 && i + 2 < bytes.length) { s += String.fromCharCode(((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63)); i += 3; }
      else { i += 1; }
    }
    return s;
  }
  function desEnc(s, keyStr) {
    var data = utf8Bytes(s);
    var pad = 8 - (data.length % 8);
    for (var i = 0; i < pad; i++) data.push(pad);
    return desCrypt(data, keyBytes(keyStr), true).map(function (b) { return b.toString(16).padStart(2, '0').toUpperCase(); }).join(' ');
  }
  function desDec(hexStr, keyStr) {
    var hex = String(hexStr || '').replace(/[^0-9A-Fa-f]/g, '');
    if (hex.length === 0 || hex.length % 16 !== 0) return 'ERR: hex 长度需为 8 字节整数倍';
    var data = [];
    for (var i = 0; i < hex.length; i += 2) data.push(parseInt(hex.substr(i, 2), 16));
    var out = desCrypt(data, keyBytes(keyStr), false);
    var pad = out[out.length - 1];
    if (pad >= 1 && pad <= 8) out.length -= pad;
    return utf8Decode(out);
  }
  
  /* ================= 算法注册表 ================= */
  var ALGOS = {
    caesar: { name: '凯撒 Caesar', enName: 'Caesar Cipher', enc: caesarEnc, dec: caesarDec, key: 'k', keyLabel: '偏移量', keyEn: 'Shift amount', keyDefault: '3' },
    affine: { name: '仿射 Affine', enName: 'Affine Cipher', enc: affineEnc, dec: affineDec, key: 'ab', keyLabel: 'a, b（如 5,8）', keyEn: 'a, b (e.g. 5,8)', keyDefault: '5,8' },
    substitution: { name: '单表替换 Substitution', enName: 'Monoalphabetic Substitution', enc: subEnc, dec: subDec, key: 'table', keyLabel: '26 字母置换表', keyEn: '26-letter permutation table', keyDefault: 'ZYXWVUTSRQPONMLKJIHGFEDCBA' },
    vigenere: { name: '维吉尼亚 Vigenère', enName: 'Vigenère Cipher', enc: function (s, k) { return vigenere(s, k, 'enc'); }, dec: function (s, k) { return vigenere(s, k, 'dec'); }, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'KEY' },
    autokey: { name: '自动密钥 Autokey', enName: 'Autokey', enc: function (s, k) { return autokey(s, k, 'enc'); }, dec: function (s, k) { return autokey(s, k, 'dec'); }, key: 'word', keyLabel: '引子', keyEn: 'Primer', keyDefault: 'KEY' },
    rail: { name: '栅栏 Rail Fence', enName: 'Rail Fence', enc: railEnc, dec: railDec, key: 'n', keyLabel: '轨道数', keyEn: 'Number of rails', keyDefault: '3' },
    playfair: { name: 'Playfair', enName: 'Playfair', enc: function (s, k) { return playfair(s, k, 'enc'); }, dec: function (s, k) { return playfair(s, k, 'dec'); }, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'MONARCHY' },
    adfgvx: { name: 'ADFGVX（替换层）', enName: 'ADFGVX (substitution layer)', enc: adfgvxEnc, dec: adfgvxDec, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'CIPHER' },
    bacon: { name: '培根 Bacon', enName: 'Bacon Cipher', enc: baconEnc, dec: baconDec, key: 'none', keyLabel: '', keyEn: '', keyDefault: '' },
    morse: { name: '摩斯 Morse', enName: 'Morse Code', enc: morseEnc, dec: morseDec, key: 'none', keyLabel: '', keyEn: '', keyDefault: '' },
    xor: { name: '异或 XOR', enName: 'XOR', enc: xorEnc, dec: xorDec, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'KEY' },
    bifid: { name: 'Bifid', enName: 'Bifid', enc: function (s, k) { return bifid(s, k, 'enc'); }, dec: function (s, k) { return bifid(s, k, 'dec'); }, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'CIPHER' },
    trifid: { name: 'Trifid', enName: 'Trifid', enc: function (s) { return trifid(s, 'enc'); }, dec: function (s) { return trifid(s, 'dec'); }, key: 'none', keyLabel: '', keyEn: '', keyDefault: '' },
    hill: { name: '希尔 2×2 Hill', enName: 'Hill 2×2', enc: hillEnc, dec: hillDec, key: 'ab', keyLabel: 'k11,k12,k21,k22', keyEn: 'k11,k12,k21,k22', keyDefault: '3,2,2,3' },
    base64: { name: 'Base64', enName: 'Base64', enc: b64Enc, dec: b64Dec, key: 'none', keyLabel: '', keyEn: '', keyDefault: '' },
    binary: { name: '二进制 Binary', enName: 'Binary (8-bit)', enc: binEnc, dec: binDec, key: 'none', keyLabel: '', keyEn: '', keyDefault: '' },
    columnar: { name: '列换位 Columnar', enName: 'Columnar Transposition', enc: columnarEnc, dec: columnarDec, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'CIPHER' },
    porta: { name: '波尔塔 Porta', enName: 'Porta Cipher', enc: portaEnc, dec: portaDec, key: 'word', keyLabel: '密钥词（每对字母一档）', keyEn: 'Key word (letter pairs as key groups)', keyDefault: 'PORTA' },
    des: { name: 'DES（真实引擎）', enName: 'DES (real engine)', enc: desEnc, dec: desDec, hashOnly: false, key: 'word', keyLabel: '8 字节密钥（ASCII → PKCS#7）', keyEn: '8-byte key (ASCII → PKCS#7)', keyDefault: 'SECRETKEY' },
    sha256: { name: 'SHA-256（FIPS 180-4）', enName: 'SHA-256 (FIPS 180-4)', enc: sha256, dec: null, hashOnly: true, key: 'none', keyLabel: '', keyEn: '', keyDefault: '' },
    hmac: { name: 'HMAC-SHA256（密钥哈希）', enName: 'HMAC-SHA256 (keyed)', enc: function (msg, key) { return hmacSha256(key, msg); }, dec: null, hashOnly: true, key: 'word', keyLabel: '密钥词', keyEn: 'Key word', keyDefault: 'KEY' },
    aes: { name: 'AES-128（真实引擎）', enName: 'AES-128 (real engine)', enc: aesEnc, dec: aesDec, hashOnly: false, key: 'word', keyLabel: '16 字节密钥（ASCII → 补零/截断）', keyEn: '16-byte key (ASCII → pad/truncate)', keyDefault: 'AES16BYTEKEY!!!' }
  };

  /* ================= 列换位（密钥列换位 + 填充 X） ================= */
  function colOrder(key) {
    var arr = [];
    for (var i = 0; i < key.length; i++) arr.push([key[i], i]);
    arr.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]; });
    return arr.map(function (x) { return x[1]; });
  }
  function columnarEnc(s, k) {
    var t = (String(s).toUpperCase().replace(/[^A-Z]/g, '') || '');
    var key = (String(k).toUpperCase().replace(/[^A-Z]/g, '') || 'CIPHER');
    var cols = key.length;
    var rows = Math.ceil(t.length / cols);
    while (t.length < rows * cols) t += 'X';
    var grid = [];
    for (var r = 0; r < rows; r++) grid.push(t.slice(r * cols, (r + 1) * cols).split(''));
    var order = colOrder(key);
    var out = '';
    order.forEach(function (c) {
      for (var r2 = 0; r2 < rows; r2++) out += grid[r2][c];
    });
    return out;
  }
  function columnarDec(s, k) {
    var t = (String(s).toUpperCase().replace(/[^A-Z]/g, '') || '');
    var key = (String(k).toUpperCase().replace(/[^A-Z]/g, '') || 'CIPHER');
    var cols = key.length;
    var rows = Math.ceil(t.length / cols);
    var order = colOrder(key);
    var colsChars = {};
    var ptr = 0;
    order.forEach(function (c) {
      colsChars[c] = t.slice(ptr, ptr + rows); ptr += rows;
    });
    var out = '';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) out += colsChars[c][r];
    }
    while (out.length && out.charAt(out.length - 1) === 'X') out = out.slice(0, -1);
    return out;
  }

  /* ================= 波尔塔（对称表，行=左旋右旋拼接；加密=取位/解密=反查） ================= */
  function portaRow(gi) {
    var leftA = 'NOPQRSTUVWXYZ';
    var rightA = 'ABCDEFGHIJKLM';
    var left = leftA.slice(gi) + leftA.slice(0, gi);
    var right = rightA.slice(-gi) + rightA.slice(0, -gi);
    return left + right;
  }
  function portaEnc(s, k) {
    var t = (String(s).toUpperCase().replace(/[^A-Z]/g, '') || '');
    var key = (String(k).toUpperCase().replace(/[^A-Z]/g, '') || 'PORTA');
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var gi = Math.floor((key.charCodeAt(i % key.length) - 65) / 2);
      if (gi < 0) gi = 0; if (gi > 12) gi = 12;
      out += portaRow(gi).charAt(t.charCodeAt(i) - 65);
    }
    return out;
  }
  function portaDec(s, k) {
    var t = (String(s).toUpperCase().replace(/[^A-Z]/g, '') || '');
    var key = (String(k).toUpperCase().replace(/[^A-Z]/g, '') || 'PORTA');
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var gi = Math.floor((key.charCodeAt(i % key.length) - 65) / 2);
      if (gi < 0) gi = 0; if (gi > 12) gi = 12;
      var idx = portaRow(gi).indexOf(t.charAt(i));
      out += String.fromCharCode(65 + idx);
    }
    return out;
  }

  function parseKey(keyType, raw) {
    if (keyType === 'k') return parseInt(raw, 10) || 0;
    if (keyType === 'n') return parseInt(raw, 10) || 2;
    if (keyType === 'ab') {
      var parts = String(raw).split(',').map(function (x) { return parseInt(x, 10) || 0; });
      return parts;
    }
    return String(raw || '');
  }

  /* ================= 自动破解（破解模式核心） ================= */
  var COP_AFFINE = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]; // 与 26 互质

  /* Kasiski 估计密钥长（H1）：重复三字符片段的间距取 GCD */
  function kasiskiEstimate(text) {
    var clean = text.replace(/[^A-Z]/g, '');
    if (clean.length < 12) return 0;
    var gaps = [];
    for (var len = 3; len <= 4; len++) {
      for (var i = 0; i + len <= clean.length; i++) {
        var frag = clean.substring(i, i + len);
        var j = clean.indexOf(frag, i + len);
        if (j > 0) gaps.push(j - i);
      }
    }
    if (!gaps.length) return 0;
    var g = gaps[0];
    for (var k = 1; k < gaps.length; k++) g = gcd(g, gaps[k]);
    return g;
  }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }

  /* 按密钥长分列做频率分析，恢复维吉尼亚密钥（H1） */
  function vigenereByColumn(text, klen) {
    var clean = text.replace(/[^A-Z]/g, '');
    if (clean.length < klen * 4) return null;
    var ENG_FREQ = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
    var key = '';
    for (var col = 0; col < klen; col++) {
      var colText = '';
      for (var i = col; i < clean.length; i += klen) colText += clean.charAt(i);
      var counts = {};
      for (var j = 0; j < 26; j++) counts[A[j]] = 0;
      for (var c = 0; c < colText.length; c++) counts[colText.charAt(c)]++;
      var best = 0, bestShift = 0;
      for (var sh = 0; sh < 26; sh++) {
        var score = 0;
        for (var q = 0; q < 26; q++) {
          var letter = A[(q - sh + 26) % 26];
          score += counts[letter] * (26 - ENG_FREQ.indexOf(A[q]));
        }
        if (score > best) { best = score; bestShift = sh; }
      }
      key += A[bestShift];
    }
    try { return vigenere(text, key, 'dec'); } catch (e) { return null; }
  }
  function autoCrack(ciphertext) {
    var ct = String(ciphertext || '').trim();
    if (!ct) return { method: 'empty', result: '' };
    var upper = ct.toUpperCase();

    /* 启发式：纯 A/B → 培根；. - / → 摩斯；0/1 空格 → 二进制；A-Z0-9 → 十六进制候选 */
    var onlyAB = /^[AB\s]+$/.test(upper);
    var onlyMorse = /^[.\-\/\s]+$/.test(upper);
    var onlyBin = /^[01\s]+$/.test(upper) && upper.replace(/\s/g, '').length % 8 === 0;
    var onlyHex = /^[0-9A-F\s]+$/.test(upper) && upper.replace(/\s/g, '').length % 2 === 0 && upper.replace(/\s/g, '').length >= 6;
    var lettersOnly = /^[A-Z\s]+$/.test(upper);

    if (onlyAB && ct.length >= 5) {
      var b = baconDec(ct);
      if (/^[A-Z?]+$/.test(b) && b.indexOf('?') < 0) return { method: 'Bacon (A/B)', result: b };
    }
    if (onlyMorse && ct.indexOf('.') >= 0) {
      var m = morseDec(ct);
      if (m && m.indexOf('?') < 0) return { method: 'Morse', result: m };
    }
    if (onlyBin) {
      try {
        var bn = binDec(ct);
        if (/^[\x20-\x7E\u4e00-\u9fff]+$/.test(bn)) return { method: 'Binary (8-bit)', result: bn };
      } catch (e) {}
    }
    if (onlyHex && /^[0-9A-F]+$/.test(upper.replace(/\s/g, ''))) {
      /* 尝试 XOR 常用密钥 */
      var hexClean = upper.replace(/\s/g, '');
      var candidates = ['KEY', 'SECRET', 'CODE', 'CIPHER', 'TUNNY', 'ENIGMA', 'PASSWORD'];
      for (var ci = 0; ci < candidates.length; ci++) {
        try {
          var xr = xorDec(hexClean, candidates[ci]);
          if (/^[\x20-\x7E]+$/.test(xr) && xr.length >= 4) return { method: 'XOR (key=' + candidates[ci] + ')', result: xr };
        } catch (e) {}
      }
      /* Base64 候选 */
      try {
        var bd = b64Dec(ct);
        if (/^[\x20-\x7E\u4e00-\u9fff]+$/.test(bd)) return { method: 'Base64', result: bd };
      } catch (e) {}
      return { method: L('Hex 无匹配密钥（可尝试 XOR/Base64）', 'Hex: no matching key found (try XOR/Base64)'), result: ct };
    }

    /* Base64 兜底（独立于 lettersOnly：密文可能含 = + / 数字） */
    if (/=+$/.test(ct.trim()) || /^[A-Za-z0-9+/=]{4,}$/.test(ct.trim())) {
      try {
        var bd0 = b64Dec(ct);
        if (/^[\x20-\x7E\u4e00-\u9fff]{2,}$/.test(bd0)) return { method: 'Base64', result: bd0 };
      } catch (e) {}
    }

    if (lettersOnly && ct.replace(/\s/g, '').length >= 4) {
      /* 1) 凯撒穷举：找英文率最高的偏移 */
      var bestShift = 0, bestScore = -1, bestText = '';
      var ENG = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
      for (var k = 0; k < 26; k++) {
        var dec = caesarDec(upper, k);
        var score = 0;
        for (var i = 0; i < dec.length; i++) {
          var ch = dec.charAt(i);
          if (ch >= 'A' && ch <= 'Z') score += 30 - ENG.indexOf(ch);
        }
        if (score > bestScore) { bestScore = score; bestShift = k; bestText = dec; }
      }
      /* 英文可读性粗判：常见词检测（H1：只有强证据才直接判定凯撒，否则继续探测其他算法） */
      var common = /\b(THE|AND|THAT|THIS|WITH|FROM|HAVE|WILL|YOUR|CODE|KEY|SECRET|MESSAGE)\b/.test(bestText);
      if (common) {
        return { method: 'Caesar (shift=' + bestShift + ')', result: bestText, note: bestShift === 0 ? L('（偏移 0 = 已是明文？）', '(shift 0 = already plaintext?)') : '' };
      }
      /* 2) 栅栏穷举 */
      for (var r = 2; r <= 8; r++) {
        var rd = railDec(upper, r);
        if (/\b(THE|AND|THAT|THIS|CODE|KEY|SECRET|MESSAGE|YOUR|WITH)\b/.test(rd)) {
          return { method: 'Rail Fence (rails=' + r + ')', result: rd };
        }
      }
      /* 3) 维吉尼亚 Kasiski 简化：试常用密钥 */
      var vkeys = ['KEY', 'CODE', 'CIPHER', 'SECRET', 'LEMON', 'ABCDE', 'PASSWORD'];
      for (var vi = 0; vi < vkeys.length; vi++) {
        var vd = vigenere(upper, vkeys[vi], 'dec');
        if (/\b(THE|AND|THAT|THIS|CODE|KEY|SECRET|MESSAGE|YOUR|WITH)\b/.test(vd)) {
          return { method: 'Vigenère (key=' + vkeys[vi] + ')', result: vd };
        }
      }
      /* 3.5) 仿射穷举（H1）：a 与 26 互质、b 0-25，全空间扫描 */
      for (var ai = 0; ai < COP_AFFINE.length; ai++) {
        for (var bi = 0; bi < 26; bi++) {
          var ad = affineDec(upper, COP_AFFINE[ai], bi);
          if (/\b(THE|AND|THAT|THIS|CODE|KEY|SECRET|MESSAGE|YOUR|WITH|WAS|FOR)\b/.test(ad)) {
            return { method: 'Affine (a=' + COP_AFFINE[ai] + ', b=' + bi + ')', result: ad };
          }
        }
      }
      /* 3.6) Playfair 常用密钥试钥（H1）：Playfair 解密后无空格，用词边界宽松判定 */
      var pkeys = ['MONARCHY', 'KEY', 'CIPHER', 'PLAYFAIR', 'ARCADE', 'SECRET', 'CODE', 'ENIGMA'];
      for (var pi = 0; pi < pkeys.length; pi++) {
        try {
          var pd = playfair(upper, pkeys[pi], 'dec');
          /* Playfair 输出为连续字母（原空格被吃），检测常见三字组合如 THE/AND/COD/SEC/KEY */
          if (/\b(THE|AND|THAT|THIS|CODE|KEY|SECRET|MESSAGE|YOUR|WITH|WAS|FOR|ROOM|ATTACK)\b/.test(pd) ||
              /(THE|AND|THAT|THIS|CODE|SECRET|MESSAGE|ATTACK|ROOM|FLEET)/.test(pd)) {
            return { method: 'Playfair (key=' + pkeys[pi] + ')', result: pd };
          }
        } catch (e) {}
      }
      /* 3.7) Kasiski 完整版（H1）：找重复片段间距的 GCD 估密钥长（取多因子合理值），再逐列频率分析 */
      var kk = kasiskiEstimate(upper);
      /* 对 GCD 过大的情况，尝试常见密钥长 2-8 */
      var klenCandidates = [];
      if (kk >= 2 && kk <= 12) klenCandidates.push(kk);
      for (var kc = 2; kc <= 8; kc++) if (klenCandidates.indexOf(kc) < 0) klenCandidates.push(kc);
      for (var kci = 0; kci < klenCandidates.length; kci++) {
        var vd2 = vigenereByColumn(upper, klenCandidates[kci]);
        if (vd2 && /\b(THE|AND|THAT|THIS|CODE|KEY|SECRET|MESSAGE|YOUR|WITH)\b/.test(vd2)) {
          return { method: 'Vigenère (Kasiski keylen=' + klenCandidates[kci] + ', column analysis)', result: vd2 };
        }
      }
      /* 4) 无明确命中 → 返回凯撒最佳猜测 */
      return { method: L('未自动识别（展示凯撒最优猜测）', 'Not recognized (showing best Caesar guess)'), result: bestText, note: L('可尝试上方加密模式手动试钥，或选择具体算法解密', 'Try manual encryption above, or pick a specific algorithm to decrypt') };
    }

    return { method: L('无法识别该密文格式', 'Unrecognized ciphertext format'), result: ct };
  }

  return {
    ALGOS: ALGOS,
    parseKey: parseKey,
    enc: function (algoId, plain, keyRaw) {
      var a = ALGOS[algoId];
      if (!a) return '';
      var k = parseKey(a.key, keyRaw);
      if (a.key === 'ab') return a.enc(plain, k[0], k[1], k[2], k[3]);
      return a.enc(plain, k);
    },
    dec: function (algoId, cipher, keyRaw) {
      var a = ALGOS[algoId];
      if (!a || !a.dec) return '';
      var k = parseKey(a.key, keyRaw);
      if (a.key === 'ab') return a.dec(cipher, k[0], k[1], k[2], k[3]);
      return a.dec(cipher, k);
    },
    autoCrack: autoCrack,
    kasiskiEstimate: kasiskiEstimate,
    vigenereByColumn: vigenereByColumn
  };
})();
