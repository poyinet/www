/* protocols 懒初始化改造：9 张演示卡进入视口附近才构建 */
const fs = require('fs');
const f = 'assets/js/protocols.js';
let t = fs.readFileSync(f, 'utf8');
let fail = 0;

/* 1) 注入 LAZY 助手 */
const anchorEl = "    var doc = document;\n    function el(id) { return doc.getElementById(id); }";
if (!t.includes(anchorEl)) { console.error('✗ el 锚点'); process.exit(1); }
t = t.replace(anchorEl, anchorEl + "\n\n    /* 懒初始化：演示卡临近视口才构建（无 IntersectionObserver 的环境立即执行，兼容冒烟桩） */\n    function LAZY(secId, fn) {\n      var sec = doc.getElementById(secId);\n      if (!sec || typeof window.IntersectionObserver === 'undefined') { fn(); return; }\n      var io = new window.IntersectionObserver(function (entries) {\n        entries.forEach(function (en) {\n          if (en.isIntersecting) { io.disconnect(); fn(); }\n        });\n      }, { rootMargin: '600px' });\n      io.observe(sec);\n    }");
console.log('✓ LAZY 注入');

/* 2) 九个演示 IIFE → LAZY 注册 */
const secs = [
  ['① TLS 握手', 'pl-tls'],
  ['② DH 中间人', 'pl-dh'],
  ['③ Merkle 树与区块链', 'pl-merkle'],
  ['④ 零知识证明（三色图）', 'pl-zkp'],
  ['🌀 ChaCha20 quarter-round', 'pl-chacha'],
  ['⑤ ECC 点加法', 'pl-ecc'],
  ['📡 A5/1 LFSR', 'pl-a51'],
  ['🧨 RC4 警示录：密钥流重用灾难（真实 RC4）', 'pl-rc4'],
  ['⑥ 口令破解成本计算器', 'pl-pwd']
];
secs.forEach(function (s) {
  const from = '/* ---------- ' + s[0] + ' ---------- */\n    (function () {';
  const to = '/* ---------- ' + s[0] + ' ---------- */\n    LAZY(\'' + s[1] + '\', function () {';
  if (!t.includes(from)) { console.error('✗ 未命中 opener: ' + s[1]); fail++; return; }
  t = t.replace(from, to);
  console.log('✓ opener ' + s[1]);
});

/* 3) 收尾 })(); → });（仅九段收尾：其后紧跟下一段注释或 pl-ready） */
const closings = [
  ["    })();\n\n    /* ---------- ② DH 中间人", "    });\n\n    /* ---------- ② DH 中间人"],
  ["    })();\n\n    /* ---------- ③ Merkle 树与区块链", "    });\n\n    /* ---------- ③ Merkle 树与区块链"],
  ["    })();\n\n    /* ---------- ④ 零知识证明", "    });\n\n    /* ---------- ④ 零知识证明"],
  ["    })();\n\n    /* ---------- 🌀 ChaCha20", "    });\n\n    /* ---------- 🌀 ChaCha20"],
  ["    })();\n\n    /* ---------- ⑤ ECC 点加法", "    });\n\n    /* ---------- ⑤ ECC 点加法"],
  ["    })();\n\n    /* ---------- 📡 A5/1", "    });\n\n    /* ---------- 📡 A5/1"],
  ["    })();\n\n    /* ---------- 🧨 RC4", "    });\n\n    /* ---------- 🧨 RC4"],
  ["    })();\n\n    /* ---------- ⑥ 口令破解成本计算器", "    });\n\n    /* ---------- ⑥ 口令破解成本计算器"],
  ["    })();\n\n    el('pl-ready').textContent = '9';", "    });\n\n    el('pl-ready').textContent = '9';"]
];
closings.forEach(function (c, i) {
  if (!t.includes(c[0])) { console.error('✗ 未命中 closer #' + i); fail++; return; }
  t = t.replace(c[0], c[1]);
  console.log('✓ closer #' + i);
});

fs.writeFileSync(f, t);
console.log(fail ? ('FAILED ' + fail) : 'ALL OK');
process.exit(fail ? 1 : 0);
