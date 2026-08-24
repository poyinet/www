/* ============================================================
   协议实验室（第七期）：TLS 握手 · DH 中间人 · Merkle 树/区块链
   · 零知识证明 · ECC 点加法 · 口令破解成本计算器
   结构仿 machine.js：window.PROTOCOL_LAB 数据 + 页面渲染；
   全部交互本地运行，玩具参数教学示意。
   ============================================================ */
window.PROTOCOL_LAB = (function () {
  var L = null; /* 渲染语言标记，由页面注入 */

  /* ---------- 工具 ---------- */
  function H(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((((h << 5) + h) >>> 0) + s.charCodeAt(i)) >>> 0;
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function modPow(b, e, m) {
    var out = 1;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) out = (out * b) % m;
      b = (b * b) % m;
      e >>= 1;
    }
    return out;
  }

  var LAB = {
    H: H, modPow: modPow,
    /* 六个演示的静态双语元数据 */
    META: [
      { id: 'tls', icon: '🤝', name: { zh: 'TLS 握手', en: 'TLS Handshake' } },
      { id: 'dh', icon: '🕵️', name: { zh: 'DH 中间人', en: 'DH Man-in-the-Middle' } },
      { id: 'merkle', icon: '🌳', name: { zh: 'Merkle 树与区块链', en: 'Merkle Tree & Blockchain' } },
      { id: 'zkp', icon: '🎭', name: { zh: '零知识证明', en: 'Zero-Knowledge Proof' } },
      { id: 'chacha', icon: '🌀', name: { zh: 'ChaCha20', en: 'ChaCha20' } },
      { id: 'ecc', icon: '📈', name: { zh: 'ECC 点加法', en: 'ECC Point Addition' } },
      { id: 'a51', icon: '📡', name: { zh: 'A5/1 流密码', en: 'A5/1 Stream Cipher' } },
      { id: 'pwd', icon: '⏳', name: { zh: '口令破解成本', en: 'Password Cracking Cost' } }
    ],

    /* ================= ChaCha20 quarter-round ================= */
    chachaIntro: {
      zh: 'ChaCha20 把 4×4 的 32 位字状态搅 20 轮：每轮先对四列、再对四条对角线各跑一次 quarter-round——八条指令（加法、异或、循环移位交替），现代 CPU 上快得飞起，且常数时间无查表侧信道。单步走一遍双轮的 64 条操作，亲眼看雪崩扩散。',
      en: 'ChaCha20 churns a 4×4 state of 32-bit words for 20 rounds: each round runs a quarter-round over the four columns then the four diagonals — eight instructions alternating add, XOR and rotation. Blazing fast on modern CPUs and constant-time with no table lookups. Single-step all 64 ops of one double round and watch the avalanche.'
    },

    /* ================= A5/1 ================= */
    a51Intro: {
      zh: 'GSM 手机的通话加密：三个不同长度的 LFSR（19/22/23 位）靠「少数服从多数」钟控——多数位决定谁走谁留，输出位是三个最高位的异或。简单、硬件便宜，却在 2009 年被 Karsten Nohl 用彩虹表实测攻破：如今它只活在教科书里。单步看多数投票与密钥流诞生。',
      en: 'GSM call encryption: three LFSRs (19/22/23 bits) clocked by majority vote — the majority clock-bit decides who steps, and each output bit is the XOR of three top cells. Cheap in hardware, broken in practice by Karsten Nohl\'s rainbow tables (2009). Today it lives only in textbooks. Step through the voting and the keystream.'
    },

    /* ================= ① TLS 握手 ================= */
    tlsSteps: function () {
      return [
        { from: 'C', to: 'S', tag: { zh: 'ClientHello（明文）', en: 'ClientHello (plaintext)' },
          txt: { zh: '客户端发出：客户端随机数 + 支持的密码套件列表 + SNI。此刻还没有任何秘密。', en: 'Client sends: random nonce + supported cipher suites + SNI. No secret exists yet.' } },
        { from: 'S', to: 'C', tag: { zh: 'ServerHello + 证书（明文）', en: 'ServerHello + Certificate (plaintext)' },
          txt: { zh: '服务器回应：服务器随机数 + 选定套件 + 证书——证书里是服务器公钥，由 CA 用自己的私钥签名。', en: 'Server replies: server nonce + chosen suite + certificate — containing the server public key, signed by a CA private key.' } },
        { from: 'C', to: 'S', tag: { zh: '验证证书 → 密钥交换（密文）', en: 'Verify cert → Key exchange (encrypted)' },
          txt: { zh: '客户端沿 CA 链验证证书真伪；通过后生成预主密钥，用服务器公钥加密发送。只有持有对应私钥的真服务器能解开。', en: 'The client validates the chain; then encrypts a pre-master secret with the server public key. Only the true holder of the private key can decrypt it.' } },
        { from: 'C', to: 'S', tag: { zh: '双方导出会话密钥（本地）', en: 'Both derive session keys (local)' },
          txt: { zh: '两端各自用「预主密钥 + 两个随机数」推导出同一组对称会话密钥——它从不在线路上出现。', en: 'Both sides derive identical symmetric session keys from the pre-master secret and both nonces — the keys themselves never travel.' } },
        { from: 'C', to: 'S', tag: { zh: 'Finished（加密）', en: 'Finished (encrypted)' },
          txt: { zh: '客户端把此前全部握手消息的摘要用会话密钥加密发回——篡改过握手的中间人无法伪造它。', en: 'A MAC of the whole handshake, encrypted with the session key — a tampering MITM cannot forge it.' } },
        { from: 'S', to: 'C', tag: { zh: 'Finished ✓ 应用数据（加密）', en: 'Finished ✓ App data (encrypted)' },
          txt: { zh: '服务器同样回验，握手完成。此后所有 HTTP 内容都在对称加密之下。', en: 'The server verifies back; handshake complete. All further traffic rides under symmetric encryption.' } }
      ];
    },
    tlsEve: {
      zh: '🕵️ 中间人视角：第 1–2 步是明文，Eve 可以看也可以改——但她在第 3 步会露馅：没有 CA 私钥就造不出可信证书，客户端验证证书链失败并报警断连。这就是「HTTPS 能防中间人」的全部根基：不是保密了握手，而是认证了身份。',
      en: '🕵️ MITM view: steps 1–2 are plaintext — Eve can read and even modify them. But she trips at step 3: without the CA private key she cannot forge a trusted certificate, so chain verification fails and the client aborts. That is the entire foundation of HTTPS anti-MITM: not hiding the handshake, authenticating identity.'
    },

    /* ================= ② DH 中间人 ================= */
    dhParams: { p: 23, g: 5 },

    /* ================= ③ Merkle 树与区块链 ================= */
    merkleLeaves: ['TX-A 5 coins', 'TX-B 2 coins', 'TX-C 1 coin', 'TX-D 7 coins'],
    chainSeed: [
      { data: { zh: '区块 1 · 创世区块', en: 'Block 1 · Genesis' }, prev: '00000000' },
      { data: { zh: '区块 2 · Alice→Bob 转账', en: 'Block 2 · Alice→Bob transfer' }, prev: '' },
      { data: { zh: '区块 3 · Bob→Carol 转账', en: 'Block 3 · Bob→Carol transfer' }, prev: '' }
    ],
    merkleNote: {
      zh: '改动任何一片叶子（哪怕一个字母），它的哈希立刻变，并且一路向上传染到树根——Merkle 根就是整组数据的指纹。',
      en: 'Change any single leaf (even one letter) and its hash flips, cascading up to the root — the Merkle root is the fingerprint of the whole set.'
    },
    chainNote: {
      zh: '区块链 = 用「前块哈希」串起来的链。篡改第 2 块的数据，它的哈希变红、第 3 块记录的 prev 对不上而断裂——攻击者想改旧账，就必须重算其后所有区块，这正是「不可篡改」的机械原理。',
      en: 'A blockchain is a chain glued by previous-block hashes. Tamper with block 2: its own hash turns red and block 3 recorded prev no longer matches — rewriting history means recomputing every later block. That is the mechanical meaning of immutability.'
    },

    /* ================= ④ 零知识证明（三色图） ================= */
    zkpNodes: [
      { id: 'A', x: 70, y: 42 }, { id: 'B', x: 230, y: 42 },
      { id: 'C', x: 40, y: 178 }, { id: 'D', x: 260, y: 178 },
      { id: 'E', x: 150, y: 112 }
    ],
    zkpEdges: [['A', 'B'], ['B', 'D'], ['D', 'C'], ['C', 'A'], ['A', 'E'], ['B', 'E'], ['C', 'E'], ['D', 'E']],
    zkpBase: { A: 1, B: 2, C: 1, D: 2, E: 0 },   /* 合法三着色（同三角内互异） */
    zkpColors: ['#ff2d95', '#39ff14', '#ffe600'],
    zkpNames: [{ zh: '品红', en: 'magenta' }, { zh: '绿', en: 'green' }, { zh: '黄', en: 'yellow' }],
    zkpIntro: {
      zh: '证明者宣称自己知道这张图的合法三着色，但不想泄露它。协议：每轮把三种颜色随机改名（承诺）→ 验证者随机挑一条边 → 只揭开这条边两端（应答）。端点永远异色 ⇒ 通过；每轮换名 ⇒ 验证者拼不出完整着色。重复 n 轮，作弊被识破的概率指数上升，而「知识」零泄露。',
      en: 'Prover claims knowledge of a valid 3-coloring without revealing it. Each round: randomly rename the three colors (commit) → verifier picks a random edge → only those two ends are revealed (response). Ends always differ ⇒ pass; renaming every round ⇒ the verifier cannot assemble the full coloring. After n rounds cheating gets exponentially unlikely while zero knowledge leaks.'
    },

    /* ================= ⑤ ECC 点加法 ================= */
    eccDefault: { a: -7, b: 10 },
    eccIntro: {
      zh: '椭圆曲线 y² = x³ + ax + b 上定义一种「加法」：两点连线延长交曲线于第三点，其关于 x 轴的镜像即为「和」。已知一端与和，反推另一端——数学上没有高效算法。ECC 的安全性就藏在这条几何规则里（演示为实数域示意，真实曲线在有限域上）。',
      en: 'On y² = x³ + ax + b, "addition" is geometric: the chord through two points meets the curve at a third; mirroring it across the x-axis gives the sum. Recovering either input from the other plus the sum has no efficient algorithm — that is where ECC security lives (real-domain sketch here; real curves live over finite fields).'
    },

    /* ================= ⑥ 口令破解成本 ================= */
    pwdCharsets: [
      { id: 'lower', label: { zh: '小写 a-z', en: 'lower a-z' }, n: 26 },
      { id: 'upper', label: { zh: '大写 A-Z', en: 'upper A-Z' }, n: 26 },
      { id: 'digit', label: { zh: '数字 0-9', en: 'digits 0-9' }, n: 10 },
      { id: 'symbol', label: { zh: '符号 !@#…', en: 'symbols !@#…' }, n: 33 }
    ],
    pwdAlgos: [
      { id: 'md5', name: 'MD5', rate: 2e10, note: { zh: '已被攻破的快哈希', en: 'broken fast hash' } },
      { id: 'sha256', name: 'SHA-256', rate: 7e9, note: { zh: '现代快哈希（无盐则仍可穷举）', en: 'modern fast hash (unsalted = still brute-forceable)' } },
      { id: 'bcrypt', name: 'bcrypt(12)', rate: 2e4, note: { zh: '故意慢 + 自带盐', en: 'deliberately slow + salted' } },
      { id: 'argon2', name: 'Argon2id', rate: 2e2, note: { zh: '内存困难，GPU 优势归零', en: 'memory-hard, neutralizes GPUs' } }
    ],
    pwdRigs: [
      { id: 'cpu', u: 2e-4, name: { zh: '单台 CPU', en: 'single CPU' } },
      { id: 'gpu', u: 8, name: { zh: '8 卡矿架', en: '8-GPU rig' } },
      { id: 'cloud', u: 1000, name: { zh: '云端千卡集群', en: 'cloud 1000-GPU cluster' } },
      { id: 'nation', u: 1e6, name: { zh: '国家级（百万卡）', en: 'nation-state (1M GPUs)' } }
    ],
    pwdIntro: {
      zh: '穷举时间 = 组合数 ÷ 每秒尝试数。拖动长度、勾选字符集、换算法与装备——你会看到：对抗快哈希时「长度」几乎就是一切；而 Argon2 这类内存困难算法能把百万卡集群打回原形。（速率为公开基准的量级估算，用于建立直觉）',
      en: 'Time = combinations ÷ guesses per second. Drag length, tick charsets, swap algorithms and rigs — against fast hashes, length is nearly everything; memory-hard Argon2 drags a million-GPU farm back to earth. (Rates are order-of-magnitude estimates from public benchmarks, for intuition.)'
    },
    fmtInt: function (n) {
      return ('' + n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  };

  return LAB;
})();

/* ============================================================
   交互初始化（页面加载后调用 PROTOCOL_LAB.init()）
   ============================================================ */
(function () {
  var LAB = window.PROTOCOL_LAB;

  LAB.init = function () {
    var isEn = !!(window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en');
    var modPow = LAB.modPow;
    var H = LAB.H;
    function L(o) { return isEn ? o.en : o.zh; }
    var doc = document;
    function el(id) { return doc.getElementById(id); }

    /* ---------- ① TLS 握手 ---------- */
    (function () {
      var steps = LAB.tlsSteps();
      var box = el('tls-steps');
      var idx = 0, eve = false;
      function arrow(a, b) {
        if (a === 'C' && b === 'S') return 'C ⟶ S';
        return 'S ⟶ C';
      }
      function render() {
        var h = '';
        steps.forEach(function (s, i) {
          h += '<div class="pl-step' + (i < idx ? ' on' : '') + '">' +
            '<span class="pl-dir">' + arrow(s.from, s.to) + '</span>' +
            '<b>' + L(s.tag) + '</b><p>' + L(s.txt) + '</p></div>';
        });
        box.innerHTML = h;
        var note = el('tls-note');
        if (eve && idx >= 2) note.textContent = L(LAB.tlsEve);
        else if (eve) note.textContent = isEn ? "🕵️ Eve is watching the plaintext steps…" : '🕵️ Eve 正在监听明文步骤……';
        else note.textContent = '';
        el('tls-next').textContent = idx >= steps.length
          ? (isEn ? '↺ Restart' : '↺ 重新开始')
          : (isEn ? 'Next step (' + (idx + 1) + '/' + steps.length + ')' : '下一步（' + (idx + 1) + '/' + steps.length + '）');
      }
      el('tls-next').addEventListener('click', function () {
        idx = idx >= steps.length ? 0 : idx + 1;
        render();
      });
      el('tls-eve').addEventListener('click', function () {
        eve = !eve;
        this.classList.toggle('on', eve);
        render();
      });
      render();
    })();

    /* ---------- ② DH 中间人 ---------- */
    (function () {
      var p = LAB.dhParams.p, g = LAB.dhParams.g;
      var e = 6; /* Eve 的私钥（演示固定） */
      var eveOn = false;
      (function () {
        var sa = el('dh-a'), sb = el('dh-b');
        for (var v = 3; v <= 12; v++) {
          var o1 = doc.createElement('option'), o2 = doc.createElement('option');
          o1.value = o2.value = String(v);
          o1.textContent = o2.textContent = String(v);
          if (v === 6) { o1.selected = true; }
          if (v === 9) { o2.selected = true; }
          sa.appendChild(o1); sb.appendChild(o2);
        }
        sa.value = '6'; sb.value = '9';
      })();
      function run() {
        var a = parseInt(el('dh-a').value, 10);
        var b = parseInt(el('dh-b').value, 10);
        var withEve = eveOn;
        var A = modPow(g, a, p), B = modPow(g, b, p), E = modPow(g, e, p);
        var rows = [];
        rows.push('<tr><th colspan="2">' + L({ zh: '公开参数：p = ' + p + '，g = ' + g, en: 'Public: p = ' + p + ', g = ' + g }) + '</th></tr>');
        rows.push('<tr><td>Alice 私钥 a = ' + a + '</td><td>Bob 私钥 b = ' + b + '</td></tr>'.replace('Alice 私钥 a', isEn ? 'Alice secret a' : 'Alice 私钥 a').replace('Bob 私钥 b', isEn ? 'Bob secret b' : 'Bob 私钥 b'));
        if (!withEve) {
          rows.push('<tr><td>A 公开发送 ' + A + '</td><td>B 公开发送 ' + B + '</td></tr>');
          var k1 = modPow(B, a, p), k2 = modPow(A, b, p);
          rows.push('<tr class="ok"><td colspan="2">' +
            L({ zh: '共享密钥：B^a = ' + k1 + ' = A^b ✓ 两端一致——但注意：这条信道没有认证！', en: 'Shared key: B^a = ' + k1 + ' = A^b ✓ both ends agree — yet note: this channel has NO authentication!' }) +
            '</td></tr>');
          el('dh-verdict').innerHTML = '<span class="ok">' +
            L({ zh: '✓ 数学上完美协商成功。勾选「Eve 在场」看看没有认证时会发生什么。', en: '✓ Perfect negotiation in math. Tick "Eve is present" to see what happens without authentication.' }) + '</span>';
        } else {
          rows.push('<tr class="bad"><td colspan="2">' +
            L({ zh: 'Eve 拦截并把双方公钥都换成自己的 E = ' + E, en: 'Eve intercepts and swaps both public keys with her own E = ' + E }) + '</td></tr>');
          rows.push('<tr><td>Alice 实际收到 ' + E + '</td><td>Bob 实际收到 ' + E + '</td></tr>');
          var kAE = modPow(E, a, p), kBE = modPow(E, b, p);
          rows.push('<tr><td>Alice 算出密钥 ' + kAE + '</td><td>Bob 算出密钥 ' + kBE + '</td></tr>');
          rows.push('<tr><td>Eve 与 Alice 共享 ' + kAE + '</td><td>Eve 与 Bob 共享 ' + kBE + '</td></tr>');
          el('dh-verdict').innerHTML = '<span class="bad">' +
            L({ zh: '✗ Alice 和 Bob 各自「协商成功」，却都在跟 Eve 说悄悄话——两个密钥不相等，DH 本身毫无察觉。对照 BB84：窃听会留痕；DH 无认证即失守。现实中的解药就是上一节的数字证书。', en: '✗ Alice and Bob each "succeeded" — but are whispering to Eve. Two unequal keys, and plain DH never notices. Contrast BB84: eavesdropping leaves marks; DH without authentication simply fails. The real-world antidote is the certificate from section one.' }) + '</span>';
        }
        el('dh-out').innerHTML = rows.join('');
      }
      ['dh-a', 'dh-b'].forEach(function (id) { el(id).addEventListener('change', run); });
      el('dh-eve').addEventListener('click', function () {
        eveOn = !eveOn;
        this.classList.toggle('on', eveOn);
        run();
      });
      el('dh-run').addEventListener('click', run);
      run();
    })();

    /* ---------- ③ Merkle 树与区块链 ---------- */
    (function () {
      var leaves = LAB.merkleLeaves.slice();
      function treeOf(lvs) {
        var lv = [lvs.map(H)];
        while (lv[lv.length - 1].length > 1) {
          var cur = lv[lv.length - 1], nx = [];
          for (var i = 0; i < cur.length; i += 2) {
            nx.push(cur[i + 1] !== undefined ? H(cur[i] + cur[i + 1]) : cur[i]);
          }
          lv.push(nx);
        }
        return lv;
      }
      function hexRnd() {
        var s = '0123456789abcdef';
        return s.charAt(Math.floor(Math.random() * 16));
      }
      function renderTree(changed) {
        changed = changed || {};
        var lv = treeOf(leaves);
        var h = '<div class="pl-mtree">';
        for (var l = lv.length - 1; l >= 0; l--) {
          h += '<div class="pl-mrow lv' + l + '">';
          lv[l].forEach(function (v, i) {
            var key = l + '-' + i;
            h += '<span class="pl-mnode' + (changed[key] ? ' flash' : '') + '" title="' + v + '">' + v + '</span>';
          });
          h += '</div>';
        }
        h += '</div><div class="ws-note" style="text-align:center">' + L(LAB.merkleNote) + '</div>';
        el('merkle-tree').innerHTML = h;
      }
      (function () {
        var h = '';
        leaves.forEach(function (leaf, i) {
          h += '<button class="btn" data-i="' + i + '">✏️ ' + leaf + '</button>';
        });
        el('merkle-leaves').innerHTML = h;
        Array.prototype.forEach.call(el('merkle-leaves').children, function (btn) {
          btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-i'), 10);
            /* 无条件改写最后一个字符，保证哈希必然变化 */
            leaves[i] = leaves[i].slice(0, -1) + hexRnd();
            this.textContent = '✏️ ' + leaves[i];
            var chg = {};
            chg['0-' + i] = 1;
            renderTree(chg);
          });
        });
        renderTree();
      })();

      /* 区块链 */
      var blocks = [];
      function buildChain() {
        blocks = LAB.chainSeed.map(function (b) { return { data: L(b.data), prev: b.prev }; });
        blocks.forEach(function (b, i) {
          if (!b.prev) b.prev = i ? blocks[i - 1].hash : '00000000';
          b.hash = H(b.prev + '|' + b.data);
        });
      }
      function renderChain(brokenAt) {
        var h = '<div class="pl-chain">';
        blocks.forEach(function (b, i) {
          var bad = brokenAt !== null && i >= brokenAt;
          h += '<div class="pl-block' + (bad ? ' bad' : '') + '">' +
            '<div class="k">#' + (i + 1) + ' · prev ' + b.prev.slice(0, 8) + '</div>' +
            '<div class="d">' + b.data + '</div>' +
            '<div class="hh">hash ' + b.hash + '</div></div>' +
            (i < blocks.length - 1 ? '<div class="pl-link' + (brokenAt !== null && i + 1 >= brokenAt ? ' bad' : '') + '">⇣</div>' : '');
        });
        h += '</div>';
        el('chain-view').innerHTML = h;
      }
      buildChain(); renderChain(null);
      el('chain-tamper').addEventListener('click', function () {
        blocks[1].data = blocks[1].data + (isEn ? ' [TAMPERED +100]' : '【被篡改 +100】');
        renderChain(1);
      });
      el('chain-restore').addEventListener('click', function () {
      buildChain(); renderChain(null);
      el('chain-note').textContent = L(LAB.chainNote);
      });
    })();

    /* ---------- ④ 零知识证明（三色图） ---------- */
    (function () {
      var nodes = LAB.zkpNodes, edges = LAB.zkpEdges, base = LAB.zkpBase;
      var pos = {};
      nodes.forEach(function (n) { pos[n.id] = n; });
      var svg = '<svg viewBox="0 0 300 220" style="position:absolute;inset:0;width:100%;height:100%">';
      edges.forEach(function (e, i) {
        svg += '<line data-e="' + i + '" x1="' + pos[e[0]].x + '" y1="' + pos[e[0]].y +
          '" x2="' + pos[e[1]].x + '" y2="' + pos[e[1]].y + '" stroke="rgba(255,255,255,.25)" stroke-width="3"/>';
      });
      svg += '</svg>';
      el('zkp-graph').innerHTML = svg + nodes.map(function (n) {
        return '<button class="pl-znode" data-id="' + n.id + '" style="left:' + (n.x - 16) + 'px;top:' + (n.y - 16) + 'px;background:' +
          LAB.zkpColors[base[n.id]] + '" title="' + n.id + '">' + n.id + '</button>';
      }).join('');
      var rounds = 0, committed = false;
      function setNode(id, color, blur) {
        var n = el('zkp-graph').querySelector('[data-id="' + id + '"]');
        n.style.background = color;
        n.classList.toggle('pl-blur', !!blur);
      }
      function stat() {
        el('zkp-stat').textContent = rounds
          ? (isEn ? 'Rounds passed: ' + rounds + ' · info leaked per round ≈ 0' : '已通过轮数：' + rounds + ' · 每轮泄露信息 ≈ 0')
          : (isEn ? 'Click a round to commit & answer a random edge' : '点击「下一轮」开始承诺与应答');
      }
      el('zkp-round').addEventListener('click', function () {
        /* 随机换名（承诺）→ 随机挑边 → 揭开两端 */
        var perm = [0, 1, 2], i, j, tmp;
        for (i = 2; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; }
        committed = true;
        nodes.forEach(function (n) { setNode(n.id, '#555', true); });
        var ei = Math.floor(Math.random() * edges.length);
        var pair = edges[ei];
        Array.prototype.forEach.call(el('zkp-graph').querySelectorAll('line'), function (ln) {
          ln.setAttribute('stroke', parseInt(ln.getAttribute('data-e'), 10) === ei ? '#39ff14' : 'rgba(255,255,255,.12)');
        });
        setTimeout(function () {
          setNode(pair[0], LAB.zkpColors[perm[base[pair[0]]]], false);
          setNode(pair[1], LAB.zkpColors[perm[base[pair[1]]]], false);
          rounds++;
          stat();
          setTimeout(function () {
            nodes.forEach(function (n) { setNode(n.id, '#555', true); });
            Array.prototype.forEach.call(el('zkp-graph').querySelectorAll('line'), function (ln) {
              ln.setAttribute('stroke', 'rgba(255,255,255,.25)');
            });
          }, 1400);
        }, 350);
      });
      el('zkp-reset').addEventListener('click', function () {
        rounds = 0; committed = false;
        nodes.forEach(function (n) { setNode(n.id, LAB.zkpColors[base[n.id]], false); });
        stat();
      });
      stat();
      el('zkp-intro').textContent = L(LAB.zkpIntro);
    })();

    /* ---------- ⑤ ECC 点加法 ---------- */
    (function () {
      var cv = el('ecc-cv');
      var ctx = cv.getContext('2d');
      var WID = cv.width, HEI = cv.height;
      var XMIN = -3.4, XMAX = 3.4, YMAX = 7.5;
      function fx(x, a, b) { return x * x * x + a * x + b; }
      function toPx(x, y) {
        return { x: (x - XMIN) / (XMAX - XMIN) * WID, y: HEI / 2 - y / YMAX * (HEI / 2 - 8) };
      }
      function draw(a, b, P, Q, R, chord) {
        ctx.clearRect(0, 0, WID, HEI);
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.moveTo(0, HEI / 2); ctx.lineTo(WID, HEI / 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,240,255,.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        var first = true;
        for (var px = XMIN; px <= XMAX; px += 0.01) {
          var v = fx(px, a, b);
          if (v < 0) continue;
          var y = Math.sqrt(v);
          var q = toPx(px, y);
          if (first) { ctx.moveTo(q.x, q.y); first = false; } else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        ctx.beginPath();
        first = true;
        for (px = XMAX; px >= XMIN; px -= 0.01) {
          var v2 = fx(px, a, b);
          if (v2 < 0) continue;
          var y2 = -Math.sqrt(v2);
          var q2 = toPx(px, y2);
          if (first) { ctx.moveTo(q2.x, q2.y); first = false; } else ctx.lineTo(q2.x, q2.y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        if (chord) {
          ctx.strokeStyle = 'rgba(185,103,255,.9)';
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(chord.x1, chord.y1); ctx.lineTo(chord.x2, chord.y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        [[P, '#00f0ff'], [Q, '#ffe600'], [R, '#ff2d95']].forEach(function (pt) {
          if (!pt[0]) return;
          var c = toPx(pt[0].x, pt[0].y);
          ctx.fillStyle = pt[1];
          ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
        });
      }
      var st = { a: LAB.eccDefault.a, b: LAB.eccDefault.b, P: null, Q: null };
      var msg = el('ecc-msg');
      function singular(a, b) { return Math.abs(4 * a * a * a + 27 * b * b) < 0.001; }
      function redraw() {
        if (singular(st.a, st.b)) {
          msg.textContent = isEn ? '⚠ Singular curve (4a³+27b²=0) — adjust sliders' : '⚠ 奇异曲线（4a³+27b²=0）——请调整滑杆';
          return;
        }
        draw(st.a, st.b, st.P, st.Q, null, null);
        msg.textContent = isEn
          ? 'Click two points on the curve, then press P+Q'
          : '在曲线上点选两个点，再按 P+Q';
      }
      cv.addEventListener('click', function (ev) {
        if (singular(st.a, st.b)) return;
        var rect = cv.getBoundingClientRect();
        var mx = (ev.clientX - rect.left) / rect.width * WID;
        var my = (ev.clientY - rect.top) / rect.height * HEI;
        var best = null, bd = 20 * 20;
        for (var sx = XMIN; sx <= XMAX; sx += 0.005) {
          var v = fx(sx, st.a, st.b);
          if (v < 0) continue;
          var ys = Math.sqrt(v);
          [ys, -ys].forEach(function (sy) {
            var c = toPx(sx, sy);
            var d2 = (c.x - mx) * (c.x - mx) + (c.y - my) * (c.y - my);
            if (d2 < bd) { bd = d2; best = { x: sx, y: sy }; }
          });
        }
        if (!best) return;
        cv.setAttribute('data-last', best.x.toFixed(3) + ',' + best.y.toFixed(3));
        if (!st.P || (st.P && st.Q)) { st.P = best; st.Q = null; }
        else st.Q = best;
        redraw();
      });
      el('ecc-add').addEventListener('click', function () {
        if (!st.P || !st.Q) return;
        if (singular(st.a, st.b)) return;
        var a = st.a, b = st.b, P = st.P, Q = st.Q, m, c1 = toPx(P.x, P.y), c2 = toPx(Q.x, Q.y);
        if (Math.abs(P.x - Q.x) < 1e-9 && Math.abs(Math.abs(P.y) - Math.abs(Q.y)) < 1e-9) {
          if (Math.abs(P.y) < 1e-9) { msg.textContent = isEn ? 'P+P = point at infinity ∞' : 'P+P = 无穷远点 ∞'; return; }
          m = (3 * P.x * P.x + a) / (2 * P.y);           /* 切线（倍点） */
        } else {
          m = (Q.y - P.y) / (Q.x - P.x);                  /* 割线 */
        }
        var r = m * m - P.x - Q.x;
        var ry = m * (r - P.x) + P.y;
        var R = { x: r, y: -ry };                          /* 镜像 */
        var far = toPx(XMIN, m * (XMIN - P.x) + P.y);
        var far2 = toPx(XMAX, m * (XMAX - P.x) + P.y);
        draw(st.a, st.b, P, Q, R, { x1: far.x, y1: far.y, x2: far2.x, y2: far2.y });
        msg.textContent = (isEn ? 'P+Q = (' + r.toFixed(3) + ', ' + R.y.toFixed(3) + ')' : 'P+Q = (' + r.toFixed(3) + ', ' + R.y.toFixed(3) + ')');
      });
      [['ecc-a', 'a'], ['ecc-b', 'b']].forEach(function (pair) {
        el(pair[0]).addEventListener('input', function () {
          st[pair[1]] = parseFloat(this.value);
          el('ecc-ab').textContent = 'a=' + st.a + ' , b=' + st.b;
          st.P = st.Q = null;
          redraw();
        });
        el(pair[0]).value = String(st[pair[1]]);
      });
      el('ecc-ab').textContent = 'a=' + st.a + ' , b=' + st.b;
      el('ecc-clear').addEventListener('click', function () { st.P = st.Q = null; redraw(); });
      redraw();
    })();

    /* ---------- ⑥ 口令破解成本计算器 ---------- */
    (function () {
      var lenEl = el('pwd-len');
      /* 动态构建字符集勾选框 / 算法与装备下拉 */
      (function () {
        var box = el('pwd-cs');
        LAB.pwdCharsets.forEach(function (cs, i) {
          var lb = doc.createElement('label');
          var cb = doc.createElement('input');
          cb.type = 'checkbox';
          cb.id = 'pwd-cs-' + cs.id;
          cb.checked = i < 2;
          lb.appendChild(cb);
          lb.appendChild(doc.createTextNode(' ' + L(cs.label) + ' (' + cs.n + ')'));
          box.appendChild(lb);
        });
        var algo = el('pwd-algo'), rig = el('pwd-rig');
        LAB.pwdAlgos.forEach(function (a) {
          var o = doc.createElement('option');
          o.value = a.id;
          o.textContent = a.name + (a.id === 'md5' ? ' ⚠' : '');
          algo.appendChild(o);
        });
        LAB.pwdRigs.forEach(function (r) {
          var o = doc.createElement('option');
          o.value = r.id;
          o.textContent = L(r.name);
          rig.appendChild(o);
        });
        algo.value = 'sha256'; rig.value = 'gpu';
        el('pwd-intro-holder').textContent = L(LAB.pwdIntro);
      })();
      function charsetSize() {
        var n = 0;
        LAB.pwdCharsets.forEach(function (cs) {
          if (el('pwd-cs-' + cs.id).checked) n += cs.n;
        });
        return n;
      }
      function humanTime(sec) {
        if (sec < 1) return isEn ? 'instant' : '瞬间';
        var yr = 31557600;
        if (sec / yr >= 1e8) return L({ zh: '约 ' + (sec / yr / 1e8).toExponential(1) + ' 亿年', en: '≈' + (sec / yr / 1e8).toExponential(1) + 'e8 years' });
        if (sec / yr >= 1e4) return L({ zh: '约 ' + LAB.fmtInt(Math.round(sec / yr / 1e4)) + ' 万年', en: '≈' + LAB.fmtInt(Math.round(sec / yr / 1e4)) + '0K years' });
        var units = [
          [1, { zh: '秒', en: 's' }], [60, { zh: '分钟', en: 'min' }],
          [3600, { zh: '小时', en: 'h' }], [86400, { zh: '天', en: 'days' }],
          [yr, { zh: '年', en: 'years' }]
        ];
        for (var i = units.length - 1; i >= 0; i--) {
          if (sec >= units[i][0]) {
            return LAB.fmtInt(Math.round(sec / units[i][0])) + ' ' + L(units[i][1]);
          }
        }
        return LAB.fmtInt(Math.round(sec)) + ' s';
      }
      function sup(n) {
        var map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '' };
        return String(n).split('').map(function (c) { return map[c] !== undefined ? map[c] : c; }).join('');
      }
      function run() {
        var cs = charsetSize(), len = parseInt(lenEl.value, 10);
        el('pwd-len-v').textContent = len;
        var algo = LAB.pwdAlgos.filter(function (x) { return x.id === el('pwd-algo').value; })[0];
        var rig = LAB.pwdRigs.filter(function (x) { return x.id === el('pwd-rig').value; })[0];
        if (!algo || !rig || cs < 2) {
          el('pwd-out').innerHTML = '<span class="bad">' + (isEn ? 'Tick at least one charset' : '至少勾选一个字符集') + '</span>';
          return;
        }
        var comb = Math.pow(cs, len);
        var bits = len * Math.log(cs) / Math.LN2;
        var rate = algo.rate * rig.u;
        var sec = comb / rate;
        var yr1 = 31557600;
        var cls = sec < 86400 ? 'bad' : (sec < yr1 ? 'warn' : 'ok');
        var combTxt;
        if (comb < 1e15) combTxt = LAB.fmtInt(comb);
        else {
          var ep = comb.toExponential(2).split('e+');
          combTxt = ep[0] + '×10' + sup(ep[1]);
        }
        el('pwd-out').innerHTML =
          '<div>' + L({ zh: '组合数：', en: 'Combinations: ' }) + '<b>' + combTxt + '</b></div>' +
          '<div>' + L({ zh: '熵：', en: 'Entropy: ' }) + '<b>' + bits.toFixed(1) + ' bits</b></div>' +
          '<div>' + L({ zh: '穷举耗时（' + algo.name + ' @ ' + L(rig.name) + '）：', en: 'Crack time (' + algo.name + ' @ ' + L(rig.name) + '): ' }) +
          '<b class="' + cls + '">' + humanTime(sec) + '</b></div>' +
          '<div class="ws-note">' + L(algo.note) + '</div>';
      }
      LAB.pwdCharsets.forEach(function (cs) { el('pwd-cs-' + cs.id).addEventListener('change', run); });
      lenEl.addEventListener('input', run);
      ['pwd-algo', 'pwd-rig'].forEach(function (id) { el(id).addEventListener('change', run); });
      run();
    })();

    /* ---------- 🌀 ChaCha20 quarter-round ---------- */
    (function () {
      el('cc-intro').textContent = L(LAB.chachaIntro);
      var st = new Uint32Array(16);
      var CONSTANTS = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]; /* "expand 32-byte k" */
      function freshState() {
        for (var i = 0; i < 4; i++) st[i] = CONSTANTS[i];
        for (i = 4; i < 12; i++) st[i] = (Math.random() * 4294967296) >>> 0;
        st[12] = 0; /* counter */
        for (i = 13; i < 16; i++) st[i] = (Math.random() * 4294967296) >>> 0;
      }
      function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
      /* 标准对角线索引（显式列出，避免取模歧义） */
      var DIAG = [[0, 5, 10, 15], [1, 6, 11, 12], [2, 7, 8, 13], [3, 4, 9, 14]];
      function buildOps() {
        var ops = [];
        function qr(A, B, C, D) {
          ops.push({ t: 'a += b', hl: [A, B], f: function () { st[A] = (st[A] + st[B]) >>> 0; } });
          ops.push({ t: 'd ^= a', hl: [D, A], f: function () { st[D] = (st[D] ^ st[A]) >>> 0; } });
          ops.push({ t: 'd <<<= 16', hl: [D], f: function () { st[D] = rotl(st[D], 16); } });
          ops.push({ t: 'c += d', hl: [C, D], f: function () { st[C] = (st[C] + st[D]) >>> 0; } });
          ops.push({ t: 'b ^= c', hl: [B, C], f: function () { st[B] = (st[B] ^ st[C]) >>> 0; } });
          ops.push({ t: 'b <<<= 12', hl: [B], f: function () { st[B] = rotl(st[B], 12); } });
          ops.push({ t: 'a += b', hl: [A, B], f: function () { st[A] = (st[A] + st[B]) >>> 0; } });
          ops.push({ t: 'd ^= a', hl: [D, A], f: function () { st[D] = (st[D] ^ st[A]) >>> 0; } });
          ops.push({ t: 'd <<<= 8', hl: [D], f: function () { st[D] = rotl(st[D], 8); } });
          ops.push({ t: 'c += d', hl: [C, D], f: function () { st[C] = (st[C] + st[D]) >>> 0; } });
          ops.push({ t: 'b ^= c', hl: [B, C], f: function () { st[B] = (st[B] ^ st[C]) >>> 0; } });
          ops.push({ t: 'b <<<= 7', hl: [B], f: function () { st[B] = rotl(st[B], 7); } });
        }
        for (var c = 0; c < 4; c++) qr(c, c + 4, c + 8, c + 12);            /* 列 QR */
        DIAG.forEach(function (q) { qr(q[0], q[1], q[2], q[3]); });          /* 对角 QR */
        return ops;
      }
      var grid = el('cc-grid'), statEl = el('cc-stat');
      var ops = [], opIdx = 0;
      function renderGrid(hl) {
        var h = '<table class="pl-cc">';
        for (var r = 0; r < 4; r++) {
          h += '<tr>';
          for (var c = 0; c < 4; c++) {
            var i = r * 4 + c;
            var hot = hl && hl.indexOf(i) >= 0;
            h += '<td class="' + (hot ? 'hot' : '') + '">' + w8c(st[i]).substr(0, 8) + '</td>';
          }
          h += '</tr>';
        }
        grid.innerHTML = h + '</table>';
      }
      function w8c(x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }
      function reset() {
        freshState();
        ops = buildOps();
        opIdx = 0;
        renderGrid(null);
        statEl.textContent = isEn ? 'Step through the double round (columns → diagonals), 64 ops' : '单步走完一个双轮（先列后对角），共 64 条操作';
      }
      el('cc-step').addEventListener('click', function () {
        if (opIdx >= ops.length) { reset(); return; }
        var o = ops[opIdx];
        o.f();
        renderGrid(o.hl);
        opIdx++;
        statEl.textContent = isEn
          ? 'Op ' + opIdx + '/64 · ' + o.t + (opIdx === 64 ? ' — double round done; ×10 more for ChaCha20' : '')
          : '操作 ' + opIdx + '/64 · ' + o.t + (opIdx === 64 ? ' —— 双轮完成；ChaCha20 还要再来十遍' : '');
      });
      el('cc-reset').addEventListener('click', reset);
      reset();
    })();

    /* ---------- 📡 A5/1 LFSR ---------- */
    (function () {
      el('a51-intro').textContent = L(LAB.a51Intro);
      var LEN = [19, 22, 23];
      var TAPS = [[13, 16, 17, 18], [20, 21], [7, 20, 21, 22]];
      var CLOCKBIT = [8, 10, 10];
      var regs = [[], [], []];
      var stream = [];
      function resetRegs() {
        for (var r = 0; r < 3; r++) {
          regs[r] = [];
          for (var i = 0; i < LEN[r]; i++) regs[r].push(Math.random() < 0.5 ? 0 : 1);
        }
        stream = [];
      }
      function render(hlMajor, tapped) {
        var h = '';
        for (var r = 0; r < 3; r++) {
          h += '<div class="pl-r"><span class="pl-rl">R' + (r + 1) + '(' + LEN[r] + ')</span><span class="pl-cells">';
          for (var i = regs[r].length - 1; i >= 0; i--) {
            var cls = 'pl-bit';
            if (hlMajor && CLOCKBIT[r] === i) cls += ' maj';
            if (tapped && TAPS[r].indexOf(i) >= 0 && hlMajor) cls += ' tap';
            h += '<span class="' + cls + '">' + regs[r][i] + '</span>';
          }
          h += '</span><span class="pl-out">out ' + (regs[r][LEN[r] - 1]) + '</span></div>';
        }
        el('a51-registers').innerHTML = h;
        var ks = '';
        for (i = Math.max(0, stream.length - 40); i < stream.length; i++) ks += stream[i];
        el('a51-stream').innerHTML = '<span class="pl-klabel">keystream</span> ' + (ks || '—') +
          ' <small>(' + stream.length + ' bits)</small>';
      }
      function step() {
        var m = regs[0][CLOCKBIT[0]] + regs[1][CLOCKBIT[1]] + regs[2][CLOCKBIT[2]];
        var majority = m >= 2 ? 1 : 0;
        for (var r = 0; r < 3; r++) {
          if (regs[r][CLOCKBIT[r]] === majority) {
            var fb = 0;
            TAPS[r].forEach(function (t) { fb ^= regs[r][t]; });
            regs[r].pop();
            regs[r].unshift(fb & 1);
          }
        }
        stream.push(regs[0][LEN[0] - 1] ^ regs[1][LEN[1] - 1] ^ regs[2][LEN[2] - 1]);
        render(true, true);
      }
      el('a51-step').addEventListener('click', function () { step(); });
      el('a51-fast').addEventListener('click', function () {
        for (var i = 0; i < 100; i++) step();
      });
      el('a51-reset').addEventListener('click', function () { resetRegs(); render(false, false); });
      resetRegs(); render(false, false);
    })();

    el('pl-ready').textContent = '8';
  };
})();
