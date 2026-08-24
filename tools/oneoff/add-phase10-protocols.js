/* 第十期：protocols 增补 5 卡（数论/差分/AEAD/长度扩展/BigInt RSA） */
const fs = require('fs');
const f = 'assets/js/protocols.js';
let t = fs.readFileSync(f, 'utf8');
let fail = 0;
function rep(from, to, tag) {
  if (!t.includes(from)) { console.error('✗ 未命中: ' + tag); fail++; return; }
  t = t.split(from).join(to);
  console.log('✓ ' + tag);
}

/* META +5 */
rep("      { id: 'sign', icon: '✍️', name: { zh: '数字签名', en: 'Digital Signatures' } },",
    "      { id: 'sign', icon: '✍️', name: { zh: '数字签名', en: 'Digital Signatures' } },\n" +
    "      { id: 'math', icon: '∑', name: { zh: '数论小课堂', en: 'Number Theory 101' } },\n" +
    "      { id: 'diff', icon: '🎯', name: { zh: '差分分析', en: 'Differential Analysis' } },\n" +
    "      { id: 'aead', icon: '🛡️', name: { zh: '认证加密', en: 'Authenticated Encryption' } },\n" +
    "      { id: 'ext', icon: '🧟', name: { zh: '长度扩展攻击', en: 'Length Extension' } },\n" +
    "      { id: 'big', icon: '🐘', name: { zh: '真实大数 RSA', en: 'Real-Bignum RSA' } },", 'META +5');

/* intros +5（挂在 rngIntro 后） */
rep("    /* ================= ✍️ 数字签名 ================= */",
    "    /* ================= ∑ 数论小课堂 ================= */\n    mathIntro: {\n      zh: '公钥密码的全部数学压在三块基石上：费马小定理（a^(p−1) ≡ 1 mod p，素数的指纹，RSA/素性测试的根）· 欧拉函数 φ(n)（≤n 且与 n 互素的个数，RSA 的 φ=(p−1)(q−1)）· 原根（g 的幂跑遍整个乘法群，DH 的 g=5 就是 23 的原根）。下方全部可交互验证；卡迈克尔数 561 会伪装成素数骗过费马测试——所以真实世界用 Miller-Rabin。',\n      en: 'All public-key math rests on three stones: Fermat\\'s little theorem (a^(p−1) ≡ 1 mod p — a prime fingerprint, root of RSA and primality testing) · Euler\\'s totient φ(n) (count of coprimes ≤ n; RSA\\'s φ=(p−1)(q−1)) · primitive roots (powers of g sweep the whole group; DH\\'s g=5 is one for 23). Verify interactively below; Carmichael number 561 fools the Fermat test — hence Miller-Rabin in the real world.'\n    },\n\n    /* ================= 🎯 差分分析 ================= */\n    diffIntro: {\n      zh: '现代密码分析的核心思想：不看单个输入，看「输入差分」如何影响「输出差分」。下方是 PRESENT 轻量级密码真实在用的 4-bit S 盒——活算它的 16×16 差分分布表：选一个输入差分 Δx，若某输出差分 Δy 的计数明显偏高，攻击者就拿到了一把统计杠杆（差分密码分析 1990 年由 Biham-Shamir 公开，曾直逼 DES）。',\n      en: 'The core idea of modern cryptanalysis: ignore individual inputs, watch how input DIFFERENCES map to output differences. Below is the real 4-bit S-box of the PRESENT lightweight cipher — its 16×16 difference-distribution table computed live. Pick Δx; a biased count for some Δy hands the attacker a statistical lever (differential cryptanalysis, publicized by Biham–Shamir in 1990, once pressed hard against DES).'\n    },\n\n    /* ================= 🛡️ 认证加密 ================= */\n    aeadIntro: {\n      zh: '只有加密没有认证的密文，改一位你也不知道。对比两种方案对同一比特翻转的结局：裸加密 → 接收方解出被篡改的明文且毫无察觉；Encrypt-then-MAC → 标签对不上，当场拒收。顺序本身也是学问：MAC-then-Encrypt（先签后加）曾让 TLS 1.0 时代饱受 padding-oracle 之苦——现代答案是一个原子里同时完成两者的 AEAD（GCM/ChaCha20-Poly1305）。',\n      en: 'Ciphertext without authentication lets a bit-flip slip through unnoticed. Compare both schemes under the same bit flip: raw encryption → receiver decrypts tampered plaintext with zero suspicion; Encrypt-then-MAC → tag mismatch, rejected on sight. Order matters too: MAC-then-Encrypt plagued TLS 1.0 with padding oracles — the modern answer is AEAD (GCM / ChaCha20-Poly1305), doing both in one atomic primitive.'\n    },\n\n    /* ================= 🧟 长度扩展攻击 ================= */\n    extIntro: {\n      zh: 'SHA-1/MD5 属于 Merkle-Damgård 结构：H(k‖msg) 这种「秘密前缀 MAC」有个致命缺陷——知道一条 msg 和它的 MAC，就能在不知道密钥的情况下，为 msg‖glue‖任意后缀 造出合法 MAC（把内部状态原样接力）。下方用真实 SHA-1 完整复现：伪造出的 MAC 经服务端重算验证通过。防御：用 HMAC（两层结构免疫），或换 SHA-3 这类非 MD 结构。',\n      en: 'SHA-1/MD5 are Merkle-Damgård constructions: a secret-prefix MAC like H(k‖msg) has a fatal flaw — given msg and its MAC, you can forge a valid MAC for msg‖glue‖anything WITHOUT the key, by chaining the internal state forward. Reproduced fully with real SHA-1 below: the forged MAC passes server re-verification. Defenses: HMAC (two-layer, immune) or SHA-3 (non-MD).'\n    },\n\n    /* ================= 🐘 真实大数 RSA ================= */\n    bigIntro: {\n      zh: '前面所有 RSA 都是玩具数字——这里来真的：用 BigInt 跑 Miller-Rabin 素性测试，现场生成 256 位密钥对（n 有 64 位十六进制那么长）。注意生成耗时：这就是真实世界的成本感；现行标准是 2048 位（长度的 8 倍，成本指数级更高）。加密解密走完整模幂往返。',\n      en: 'Every RSA before this used toy numbers — here comes the real thing: BigInt Miller-Rabin primality testing generates a 256-bit keypair live (n is 64 hex digits long). Watch the elapsed time: that is what real-world cost feels like; the current standard is 2048-bit (8× the length, exponentially costlier). Full modular-exponentiation round trip included.'\n    },\n\n    /* ================= ✍️ 数字签名 ================= */", 'intros +5');

/* init +5：插在 pl-ready 之前 */
rep("    el('pl-ready').textContent = '11';",
"    /* ---------- ∑ 数论小课堂 ---------- */\n" +
"    LAZY('pl-math', function () {\n" +
"      el('math-intro').textContent = L(LAB.mathIntro);\n" +
"      function isPrime(n) { for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; }\n" +
"      function phi(n) { var r = 0; for (var i = 1; i <= n; i++) if (gcd(i, n) === 1) r++; return r; }\n" +
"      function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }\n" +
"      function ord(g, p) { for (var k = 1; k < p; k++) if (LAB.modPow(g, k, p) === 1) return k; return 0; }\n" +
"      var curP = 23;\n" +
"      function render() {\n" +
"        var h = '<div class=\"pl-r\"><span class=\"pl-rl\">a^(p−1)</span><span class=\"pl-cells mono\">';\n" +
"        for (var a = 1; a < curP; a++) {\n" +
"          var v = LAB.modPow(a, curP - 1, curP);\n" +
"          h += '<span class=\"pl-bit' + (v === 1 ? ' maj' : '') + '\">' + v + '</span>';\n" +
"        }\n" +
"        h += '</span></div>';\n" +
"        h += '<div class=\"pl-r\"><span class=\"pl-rl\">φ(p)</span><span class=\"pl-cells mono\">' + (curP - 1) + '</span></div>';\n" +
"        var roots = [];\n" +
"        for (var g = 1; g < curP; g++) if (ord(g, curP) === curP - 1) roots.push(g);\n" +
"        h += '<div class=\"pl-r\"><span class=\"pl-rl\">' + L({ zh: '原根', en: 'prim. roots' }) + '</span><span class=\"pl-cells mono\">' + roots.join(', ') + '</span></div>';\n" +
"        el('math-view').innerHTML = h;\n" +
"        el('math-note').textContent = L({ zh: 'p = ' + curP + '：所有 a^(p−1) mod p 都等于 1（费马小定理）；原根共 ' + roots.length + ' 个——DH 卡里的 g=5 正是其中之一。', en: 'p = ' + curP + ': every a^(p−1) mod p equals 1 (Fermat); ' + roots.length + ' primitive roots — the DH card uses g=5, one of them.' });\n" +
"      }\n" +
"      [13, 17, 23, 97].forEach(function (p) {\n" +
"        var c = doc.createElement('span');\n" +
"        c.className = 'ws-sample';\n" +
"        c.textContent = 'p = ' + p;\n" +
"        c.addEventListener('click', function () {\n" +
"          curP = p;\n" +
"          Array.prototype.forEach.call(el('math-p').children, function (x) { x.style.cssText = ''; });\n" +
"          c.style.cssText = 'background:rgba(0,240,255,.25);border-color:rgba(0,240,255,.6)';\n" +
"          render();\n" +
"        });\n" +
"        el('math-p').appendChild(c);\n" +
"      });\n" +
"      var phiN = doc.createElement('input');\n" +
"      phiN.className = 'ws-input'; phiN.style.cssText = 'width:auto;padding:6px 10px'; phiN.value = '561';\n" +
"      el('math-phi').appendChild(phiN);\n" +
"      var phiOut = doc.createElement('span');\n" +
"      phiOut.className = 'ws-note';\n" +
"      el('math-phi').appendChild(phiOut);\n" +
"      function updPhi() {\n" +
"        var n = parseInt(phiN.value, 10);\n" +
"        if (!n || n > 100000) { phiOut.textContent = ''; return; }\n" +
"        var v = phi(n);\n" +
"        phiOut.textContent = L({ zh: 'φ(' + n + ') = ' + v + (isPrime(n) ? '（素数：φ=p−1）' : (n === 561 ? ' ← 卡迈克尔数：合数却满足费马测试！' : '')) , en: 'φ(' + n + ') = ' + v + (isPrime(n) ? ' (prime: φ=p−1)' : (n === 561 ? ' ← Carmichael: composite yet passes Fermat!' : '')) });\n" +
"      }\n" +
"      phiN.addEventListener('input', updPhi);\n" +
"      updPhi();\n" +
"      render();\n" +
"    });\n\n" +
"    /* ---------- 🎯 差分分析 ---------- */\n" +
"    LAZY('pl-diff', function () {\n" +
"      el('diff-intro').textContent = L(LAB.diffIntro);\n" +
"      var SB = [0xC,5,6,0xB,9,0,0xA,0xD,3,0xE,0xF,8,4,7,1,2];   /* PRESENT S-box */\n" +
"      var DDT = [];\n" +
"      for (var dx = 0; dx < 16; dx++) {\n" +
"        DDT.push([]);\n" +
"        for (var dy = 0; dy < 16; dy++) DDT[dx].push(0);\n" +
"      }\n" +
"      for (dx = 0; dx < 16; dx++) for (var x = 0; x < 16; x++) DDT[dx][SB[x] ^ SB[x ^ dx]]++;\n" +
"      var sel = 1;\n" +
"      function render() {\n" +
"        var h = '<table class=\"pl-cc pl-ddt\">';\n" +
"        h += '<tr><td class=\"h\">Δx\\\\Δy</td>';\n" +
"        for (var d = 0; d < 16; d++) h += '<td class=\"h\">' + d.toString(16).toUpperCase() + '</td>';\n" +
"        h += '</tr>';\n" +
"        var max = 0;\n" +
"        for (dx = 1; dx < 16; dx++) for (dy = 0; dy < 16; dy++) if (DDT[dx][dy] > max) max = DDT[dx][dy];\n" +
"        for (dx = 0; dx < 16; dx++) {\n" +
"          h += '<tr><td class=\"h\">' + dx.toString(16).toUpperCase() + '</td>';\n" +
"          for (dy = 0; dy < 16; dy++) {\n" +
"            var v = DDT[dx][dy];\n" +
"            var cls = v === 0 ? ' dim' : '';\n" +
"            if (v === max && dx > 0) cls = ' hot';\n" +
"            if (dx === sel) cls += ' row';\n" +
"            h += '<td class=\"cc' + cls + '\">' + (v || '·') + '</td>';\n" +
"          }\n" +
"          h += '</tr>';\n" +
"        }\n" +
"        el('diff-view').innerHTML = h + '</table>';\n" +
"        var rowMax = 0, best = [];\n" +
"        for (dy = 0; dy < 16; dy++) { if (DDT[sel][dy] > rowMax) rowMax = DDT[sel][dy]; }\n" +
"        for (dy = 0; dy < 16; dy++) if (DDT[sel][dy] === rowMax && rowMax > 0) best.push(dy.toString(16).toUpperCase());\n" +
"        el('diff-note').textContent = L({ zh: 'Δx = ' + sel.toString(16).toUpperCase() + ' 行：最高计数 ' + rowMax + '/16 落在 Δy = ' + best.join('/') + ' ——偏置即杠杆。', en: 'Row Δx = ' + sel.toString(16).toUpperCase() + ': peak count ' + rowMax + '/16 at Δy = ' + best.join('/') + ' — bias is the lever.' });\n" +
"      }\n" +
"      var chipBox = el('diff-chips');\n" +
"      for (dx = 0; dx < 16; dx++) {\n" +
"        (function (dx) {\n" +
"          var c = doc.createElement('span');\n" +
"          c.className = 'ws-sample';\n" +
"          c.textContent = 'Δ' + dx.toString(16).toUpperCase();\n" +
"          c.addEventListener('click', function () {\n" +
"            sel = dx;\n" +
"            Array.prototype.forEach.call(chipBox.children, function (x) { x.style.cssText = ''; });\n" +
"            c.style.cssText = 'background:rgba(255,45,149,.25);border-color:rgba(255,45,149,.6)';\n" +
"            render();\n" +
"          });\n" +
"          chipBox.appendChild(c);\n" +
"        })(dx);\n" +
"      }\n" +
"      render();\n" +
"    });\n\n" +
"    /* ---------- 🛡️ 认证加密 ---------- */\n" +
"    LAZY('pl-aead', function () {\n" +
"      el('aead-intro').textContent = L(LAB.aeadIntro);\n" +
"      var MSG = 'PAY-100';\n" +
"      function ks(k, n) { var s = k, out = []; for (var i = 0; i < n; i++) { s = (s * 1103515245 + 12345) % 2147483647; out.push((s >>> 8) & 255); } return out; }\n" +
"      function mac(k, m) { var h = 5381; for (var i = 0; i < m.length; i++) h = ((((h << 5) + h) >>> 0) + m.charCodeAt(i)) >>> 0; return h; }\n" +
"      var K = 0;\n" +
"      var st = { mode: null, c: null, tag: null };\n" +
"      function bytes(str) { var b = []; for (var i = 0; i < str.length; i++) b.push(str.charCodeAt(i)); return b; }\n" +
"      function toStr(b) { var s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; }\n" +
"      function hexRow(label, b, hot) {\n" +
"        var h = '<div class=\"pl-r\"><span class=\"pl-rl\">' + label + '</span><span class=\"pl-cells mono\">';\n" +
"        for (var i = 0; i < b.length; i++) {\n" +
"          var cls = hot && hot.indexOf(i) >= 0 ? ' style=\"color:var(--neon-pink)\"' : '';\n" +
"          h += '<span' + cls + '>' + ('0' + b[i].toString(16)).slice(-2).toUpperCase() + '</span> ';\n" +
"        }\n" +
"        return h + '</span></div>';\n" +
"      }\n" +
"      function start(mode) {\n" +
"        K = Math.floor(Math.random() * 2147483000) + 1;\n" +
"        st.mode = mode;\n" +
"        var m = bytes(MSG);\n" +
"        var kst = ks(K, m.length);\n" +
"        st.c = m.map(function (b, i) { return b ^ kst[i]; });\n" +
"        st.tag = st.mode === 'etm' ? mac(K, toStr(st.c)) : null;\n" +
"        el('aead-view').innerHTML =\n" +
"          '<div class=\"pl-r\"><span class=\"pl-rl\">' + (isEn ? 'plaintext' : '明文') + '</span><span class=\"pl-cells mono\">' + MSG + '</span></div>' +\n" +
"          hexRow(st.mode === 'etm' ? 'C (EtM)' : 'C', st.c) +\n" +
"          (st.tag !== null ? '<div class=\"pl-r\"><span class=\"pl-rl\">tag</span><span class=\"pl-cells mono\">' + st.tag.toString(16).toUpperCase() + '</span></div>' : '');\n" +
"        el('aead-verdict').textContent = isEn ? 'Ciphertext ready — flip one bit in transit.' : '密文就绪——传输中翻转一位试试。';\n" +
"      }\n" +
"      el('aead-raw').addEventListener('click', function () { start('raw'); });\n" +
"      el('aead-etm').addEventListener('click', function () { start('etm'); });\n" +
"      el('aead-flip').addEventListener('click', function () {\n" +
"        if (!st.c) return;\n" +
"        var pos = 3;\n" +
"        st.c[pos] ^= 1;\n" +
"        var kst = ks(K, st.c.length);\n" +
"        var m2 = st.c.map(function (b, i) { return b ^ kst[i]; });\n" +
"        var accepted;\n" +
"        if (st.mode === 'etm') {\n" +
"          accepted = mac(K, toStr(st.c)) === st.tag;\n" +
"        } else {\n" +
"          accepted = true;   /* 无认证：解密即接受 */\n" +
"        }\n" +
"        var mStr = toStr(m2).replace(/[^\\x20-\\x7E]/g, '?');\n" +
"        el('aead-view').innerHTML += hexRow(\"m' 接收方解得\", m2, [pos]);\n" +
"        el('aead-verdict').textContent = accepted\n" +
"          ? (isEn ? '✗ Receiver ACCEPTED tampered plaintext: \"' + mStr + '\" — no authentication, no suspicion.' : '✗ 接收方接受了被篡改的明文：\"' + mStr + '\" ——没有认证，毫无怀疑。')\n" +
"          : (isEn ? '✓ Tag mismatch — tampered ciphertext REJECTED before decryption is trusted.' : '✓ 标签不匹配——被篡改的密文在解密前就被拒收。');\n" +
"        if (Arcade.audio) Arcade.audio.play(accepted ? 'error' : 'ui');\n" +
"      });\n" +
"    })();\n\n" +
"    /* ---------- 🧟 长度扩展攻击 ---------- */\n" +
"    LAZY('pl-ext', function () {\n" +
"      el('ext-intro').textContent = L(LAB.extIntro);\n" +
"      /* 真实 SHA-1（FIPS 180-1） */\n" +
"      function sha1Core(h, block) {\n" +
"        var w = [], i;\n" +
"        for (i = 0; i < 16; i++) w[i] = (block[i * 4] << 24) | (block[i * 4 + 1] << 16) | (block[i * 4 + 2] << 8) | block[i * 4 + 3];\n" +
"        for (i = 16; i < 80; i++) {\n" +
"          var x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];\n" +
"          w[i] = ((x << 1) | (x >>> 31)) >>> 0;\n" +
"        }\n" +
"        var a = h[0], b = h[1], c = h[2], dd = h[3], e = h[4];\n" +
"        for (i = 0; i < 80; i++) {\n" +
"          var f, k;\n" +
"          if (i < 20) { f = (b & c) | (~b & dd); k = 0x5A827999; }\n" +
"          else if (i < 40) { f = b ^ c ^ dd; k = 0x6ED9EBA1; }\n" +
"          else if (i < 60) { f = (b & c) | (b & dd) | (c & dd); k = 0x8F1BBCDC; }\n" +
"          else { f = b ^ c ^ dd; k = 0xCA62C1D6; }\n" +
"          var tmp = (((a << 5) | (a >>> 27)) + (f >>> 0) + (e >>> 0) + k + (w[i] >>> 0)) >>> 0;\n" +
"          e = dd; dd = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = tmp;\n" +
"        }\n" +
"        h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + dd) >>> 0; h[4] = (h[4] + e) >>> 0;\n" +
"      }\n" +
"      function sha1(bytesArr) {\n" +
"        var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];\n" +
"        var msg = bytesArr.slice();\n" +
"        var bitLen = msg.length * 8;\n" +
"        msg.push(0x80);\n" +
"        while (msg.length % 64 !== 56) msg.push(0);\n" +
"        for (var i = 7; i >= 0; i--) msg.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 255);\n" +
"        for (i = 0; i < msg.length; i += 64) sha1Core(h, msg.slice(i, i + 64));\n" +
"        var out = '';\n" +
"        for (i = 0; i < 5; i++) out += ('00000000' + h[i].toString(16)).slice(-8);\n" +
"        return { hex: out, h: h };\n" +
"      }\n" +
"      function sha1Extend(macHex, origLen, suffixBytes) {\n" +
"        var h = [];\n" +
"        for (var i = 0; i < 5; i++) h.push(parseInt(macHex.substr(i * 8, 8), 16) >>> 0);\n" +
"        var glue = [0x80];\n" +
"        while ((origLen + glue.length) % 64 !== 56) glue.push(0);\n" +
"        var bitLen = origLen * 8;\n" +
"        for (i = 7; i >= 0; i--) glue.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 255);\n" +
"        var stream = glue.concat(suffixBytes.slice());\n" +
"        var newLen = origLen + stream.length;\n" +
"        stream.push(0x80);\n" +
"        while (stream.length % 64 !== 56) stream.push(0);\n" +
"        bitLen = newLen * 8;\n" +
"        for (i = 7; i >= 0; i--) stream.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 255);\n" +
"        for (i = 0; i < stream.length; i += 64) sha1Core(h, stream.slice(i, i + 64));\n" +
"        var out = '';\n" +
"        for (i = 0; i < 5; i++) out += ('00000000' + h[i].toString(16)).slice(-8);\n" +
"        return { hex: out, glue: glue };\n" +
"      }\n" +
"      function toB(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }\n" +
"      var st = { secret: null, msg: 'amount=100&to=Bob', mac: null };\n" +
"      el('ext-gen').addEventListener('click', function () {\n" +
"        st.secret = [];\n" +
"        for (var i = 0; i < 8; i++) st.secret.push(Math.floor(Math.random() * 256));\n" +
"        st.mac = sha1(st.secret.concat(toB(st.msg))).hex;\n" +
"        el('ext-view').innerHTML =\n" +
"          '<div class=\"pl-r\"><span class=\"pl-rl\">secret</span><span class=\"pl-cells mono\">' + st.secret.map(function () { return '••'; }).join(' ') + ' (8B, ' + (isEn ? 'hidden' : '保密') + ')</span></div>' +\n" +
"          '<div class=\"pl-r\"><span class=\"pl-rl\">msg</span><span class=\"pl-cells mono\">' + st.msg + '</span></div>' +\n          '<div class=\"pl-r\"><span class=\"pl-rl\">MAC</span><span class=\"pl-cells mono\">' + st.mac + '</span></div>' +\n" +
"          '<div class=\"ws-note\" style=\"text-align:center\">' + (isEn ? 'Server accepts (msg, MAC) pairs where MAC = SHA-1(secret ‖ msg).' : '服务端接受满足 MAC = SHA-1(secret ‖ msg) 的 (msg, MAC) 对。') + '</div>';\n" +
"        el('ext-verdict').textContent = '';\n" +
"      });\n" +
"      el('ext-forge').addEventListener('click', function () {\n" +
"        if (!st.mac) { el('ext-verdict').textContent = isEn ? 'Generate a MAC first' : '请先生成 MAC'; return; }\n" +
"        var suffix = toB('&admin=true');\n" +
"        var forged = sha1Extend(st.mac, st.secret.length + st.msg.length, suffix);\n" +
"        var newMsg = st.msg;\n" +
"        for (var i = 0; i < forged.glue.length; i++) newMsg += '\\u25A1';\n" +
"        newMsg += '&admin=true';\n" +
"        st.forgedMac = forged.hex;\n" +
"        st.forgedFull = st.secret.concat(toB(st.msg), forged.glue, suffix);\n" +
"        el('ext-view').innerHTML +=\n" +
"          '<div class=\"pl-r\"><span class=\"pl-rl\">' + (isEn ? 'forged msg' : '伪造消息') + '</span><span class=\"pl-cells mono\">' + newMsg + '</span></div>' +\n" +
"          '<div class=\"pl-r\"><span class=\"pl-rl\">' + (isEn ? 'forged MAC' : '伪造 MAC') + '</span><span class=\"pl-cells mono\">' + forged.hex + '</span></div>';\n" +
"        el('ext-verdict').textContent = isEn ? 'Forged without the key. Press server verify.' : '未用密钥即完成伪造。按服务端验证试试。';\n" +
"      });\n" +
"      el('ext-verify').addEventListener('click', function () {\n" +
"        if (!st.forgedMac) { el('ext-verdict').textContent = isEn ? 'Forge first' : '请先伪造'; return; }\n" +
"        var real = sha1(st.forgedFull).hex;\n" +
"        var ok = real === st.forgedMac;\n" +
"        el('ext-verdict').textContent = ok\n" +
"          ? (isEn ? '✗ Server ACCEPTED the forged pair — attacker injected &admin=true with zero knowledge of the secret.' : '✗ 服务端接受了伪造对——攻击者对密钥一无所知，却成功注入 &admin=true。')\n" +
"          : (isEn ? '✓ Rejected (this should not happen — check the implementation!)' : '✓ 拒收（这不该发生——检查实现！）');\n" +
"        if (Arcade.audio) Arcade.audio.play(ok ? 'error' : 'ui');\n" +
"      });\n" +
"    })();\n\n" +
"    /* ---------- 🐘 真实大数 RSA ---------- */\n" +
"    LAZY('pl-big', function () {\n" +
"      el('big-intro').textContent = L(LAB.bigIntro);\n" +
"      function bigRand(bits) {\n" +
"        var v = 0n;\n" +
"        for (var i = 0; i < bits; i++) v = (v << 1n) | (Math.random() < 0.5 ? 1n : 0n);\n" +
"        v |= 1n << BigInt(bits - 1);\n" +
"        v |= 1n;\n" +
"        return v;\n" +
"      }\n" +
"      function modPow(b, e, m) {\n" +
"        var out = 1n; b %= m;\n" +
"        while (e > 0n) {\n" +
"          if (e & 1n) out = out * b % m;\n" +
"          b = b * b % m;\n" +
"          e >>= 1n;\n" +
"        }\n" +
"        return out;\n" +
"      }\n" +
"      function isPrime(n) {\n" +
"        for (var w = [2n, 3n, 5n, 7n, 11n, 13n], i = 0; i < w.length; i++) {\n" +
"          var d = n - 1n, r = 0n;\n" +
"          while (d % 2n === 0n) { d /= 2n; r++; }\n" +
"          var x = modPow(w[i], d, n);\n" +
"          if (x === 1n || x === n - 1n) continue;\n" +
"          var ok = false;\n" +
"          for (var j = 1n; j < r; j++) { x = x * x % n; if (x === n - 1n) { ok = true; break; } }\n" +
"          if (!ok) return false;\n" +
"        }\n" +
"        return true;\n" +
"      }\n" +
"      function genPrime(bits) {\n" +
"        for (;;) { var c = bigRand(bits); if (isPrime(c)) return c; }\n" +
"      }\n" +
"      function gcdB(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }\n" +
"      function modInv(a, m) {\n" +
"        var oldR = ((a % m) + m) % m, r = m;\n" +
"        var oldS = 1n, s = 0n;\n" +
"        while (r !== 0n) {\n" +
"          var q = oldR / r;\n" +
"          var tmp = oldR - q * r; oldR = r; r = tmp;\n" +
"          tmp = oldS - q * s; oldS = s; s = tmp;\n" +
"        }\n" +
"        return ((oldS % m) + m) % m;\n" +
"      }\n" +
"      el('big-gen').addEventListener('click', function () {\n" +
"        el('big-note').textContent = isEn ? 'Computing… (this cost IS the real-world feel)' : '计算中……（这正是真实世界的成本感）';\n" +
"        setTimeout(function () {\n" +
"          var t0 = Date.now();\n" +
"          var p = genPrime(128), q = genPrime(128);\n" +
"          var n = p * q, phi = (p - 1n) * (q - 1n), e = 65537n;\n" +
"          while (gcdB(e, phi) !== 1n) e += 2n;\n" +
"          var d = modInv(e, phi);\n" +
"          var m = 42n, c = modPow(m, e, n), back = modPow(c, d, n);\n" +
"          var ms = Date.now() - t0;\n" +
"          var nh = n.toString(16).toUpperCase();\n" +
"          el('big-view').innerHTML =\n" +
"            '<div class=\"pl-r\"><span class=\"pl-rl\">n (' + nh.length * 4 + ' bit)</span><span class=\"pl-cells mono\">' + nh + '</span></div>' +\n" +
"            '<div class=\"pl-r\"><span class=\"pl-rl\">e</span><span class=\"pl-cells mono\">' + e + '</span></div>' +\n" +
"            '<div class=\"pl-r\"><span class=\"pl-rl\">' + (isEn ? 'roundtrip' : '往返验证') + '</span><span class=\"pl-cells mono\">m=42 → c → ' + back + (back === m ? ' ✓' : ' ✗') + '</span></div>' +\n" +
"            '<div class=\"pl-r\"><span class=\"pl-rl\">' + (isEn ? 'elapsed' : '耗时') + '</span><span class=\"pl-cells mono\">' + ms + ' ms</span></div>';\n" +
"          el('big-note').textContent = isEn\n" +
"            ? '256-bit demo keypair. Real standard: 2048-bit (8× the length, exponentially costlier).'\n" +
"            : '256 位演示密钥对。真实标准 2048 位（长度 8 倍，成本指数级）。';\n" +
"        }, 60);\n" +
"      });\n" +
"    })();\n\n" +
"    el('pl-ready').textContent = '16';", 'init +5');

fs.writeFileSync(f, t);
console.log(fail ? 'FAILED ' + fail : 'ALL OK');
process.exit(fail ? 1 : 0);
