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
    porta: { name: '波尔塔 Porta', enName: 'Porta Cipher', enc: portaEnc, dec: portaDec, key: 'word', keyLabel: '密钥词（每对字母一档）', keyEn: 'Key word (letter pairs as key groups)', keyDefault: 'PORTA' }
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
      if (!a) return '';
      var k = parseKey(a.key, keyRaw);
      if (a.key === 'ab') return a.dec(cipher, k[0], k[1], k[2], k[3]);
      return a.dec(cipher, k);
    },
    autoCrack: autoCrack,
    kasiskiEstimate: kasiskiEstimate,
    vigenereByColumn: vigenereByColumn
  };
})();
