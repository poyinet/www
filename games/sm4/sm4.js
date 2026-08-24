/* 破译 DECODE ARCADE · SM4 国密试炼场 —— 第八期 #13 旗舰游戏
   内置真实 SM4 引擎（GB/T 32907-2016 / IETF draft-ribose-cfrg-sm4），
   常量取自官方文本，启动即对拍 GB/T 附录示例向量：
     Key = Plaintext = 0123456789ABCDEF FEDCBA9876543210
     Cipher          = 681EDF34D206965E86B3E94F536E4246
   玩法：3 轮 × 4 题（S 盒查表 / 官方轮迹追踪 / 结构与史话），首答 +20 + 连击、整轮 +30。
   支持每日模式（日种子确定性出题）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.sm4.tut1t'), d: T('gs.sm4.tut1') },
  { t: T('gs.sm4.tut2t'), d: T('gs.sm4.tut2') },
  { t: T('gs.sm4.tut3t'), d: T('gs.sm4.tut3') },
  { t: T('gs.sm4.tut4t'), d: T('gs.sm4.tut4') },
  { t: T('gs.sm4.tut5t'), d: T('gs.sm4.tut5') }
];

/* ---------- 真实 SM4 核心（常量源自 IETF draft-ribose-cfrg-sm4-10 §6/§7.3） ---------- */
var SM4 = (function () {
  /* Figure 1: SM4 S-box Values —— 官方 16×16 表 */
  var SBOX = [
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
  var FK = [0xA3B1BAC6, 0x56AA3350, 0x677D9197, 0xB27022DC];
  /* CK 按标准公式生成：ck_{i,j} = (4i+j)×7 mod 256 */
  var CK = [];
  for (var ci = 0; ci < 32; ci++) {
    CK.push(((((4 * ci + 0) * 7) % 256) << 24) | ((((4 * ci + 1) * 7) % 256) << 16) |
            ((((4 * ci + 2) * 7) % 256) << 8) | (((4 * ci + 3) * 7) % 256));
  }
  function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
  function tau(A) {
    return ((SBOX[(A >>> 24) & 255] << 24) | (SBOX[(A >>> 16) & 255] << 16) |
            (SBOX[(A >>> 8) & 255] << 8) | SBOX[A & 255]) >>> 0;
  }
  function L(B) { return (B ^ rotl(B, 2) ^ rotl(B, 10) ^ rotl(B, 18) ^ rotl(B, 24)) >>> 0; }
  function Lp(B) { return (B ^ rotl(B, 13) ^ rotl(B, 23)) >>> 0; }
  function T(A) { return L(tau(A)); }
  function Tp(A) { return Lp(tau(A)); }

  function keySchedule(MK) {
    var K = [MK[0] ^ FK[0], MK[1] ^ FK[1], MK[2] ^ FK[2], MK[3] ^ FK[3]];
    var rk = [];
    for (var i = 0; i < 32; i++) {
      K.push((K[i] ^ Tp(K[i + 1] ^ K[i + 2] ^ K[i + 3] ^ CK[i])) >>> 0);
      rk.push(K[i + 4]);
    }
    return rk;
  }
  /* 加解密并记录全部中间字 X0..X35（官方示例对拍用） */
  function cryptBlock(Xin, rk, reverse) {
    var s = Xin.slice();
    for (var i = 0; i < 32; i++) {
      var k = reverse ? rk[31 - i] : rk[i];
      s.push((s[i] ^ T(s[i + 1] ^ s[i + 2] ^ s[i + 3] ^ k)) >>> 0);
    }
    return [s[35], s[34], s[33], s[32]];
  }
  function hexToWords(h) {
    var wds = [];
    for (var i = 0; i < 4; i++) wds.push(parseInt(h.substr(i * 8, 8), 16) >>> 0);
    return wds;
  }
  function wordsToHex(wds) {
    var out = '';
    for (var i = 0; i < wds.length; i++) out += ('00000000' + (wds[i] >>> 0).toString(16)).slice(-8).toUpperCase();
    return out;
  }
  function encryptBlockHex(blockHex, keyHex) {
    return wordsToHex(cryptBlock(hexToWords(blockHex), keySchedule(hexToWords(keyHex)), false));
  }
  function decryptBlockHex(blockHex, keyHex) {
    return wordsToHex(cryptBlock(hexToWords(blockHex), keySchedule(hexToWords(keyHex)), true));
  }
  /* GB/T 32907-2016 附录示例：全向量对拍 + 已知锚点抽查 */
  var SELF_TEST = (function () {
    var kp = '0123456789ABCDEFFEDCBA9876543210';
    var c = encryptBlockHex(kp, kp);
    if (c !== '681EDF34D206965E86B3E94F536E4246') return false;
    if (decryptBlockHex(c, kp) !== kp) return false;
    return SBOX[0xEF] === 0x84 && CK[0] === 0x00070E15 && CK[31] === 0x646B7279 &&
           FK[0] === 0xA3B1BAC6;
  })();

  return {
    SBOX: SBOX, FK: FK, CK: CK, rotl: rotl, tau: tau, T: T,
    keySchedule: keySchedule,
    hexToWords: hexToWords,
    wordsToHex: wordsToHex,
    encryptBlockHex: encryptBlockHex,
    decryptBlockHex: decryptBlockHex,
    SELF_TEST: SELF_TEST
  };
})();

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 3;

  var isEn = function () { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; };
  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function h2(n) { return ('0' + n.toString(16).toUpperCase()).slice(-2); }
  function w8(x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8).toUpperCase(); }
  function daySeed() {
    var dt = new Date();
    return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
  }
  function mulberry(seed) {
    var s = Math.abs(Math.floor(seed)) % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = s * 16807 % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* 官方示例（GB/T A.1）的实时中间值：Key=PT=01234567FEDCBA98… */
  var EX_KEY = '0123456789ABCDEFFEDCBA9876543210';
  var EX_RK = SM4.keySchedule(SM4.hexToWords(EX_KEY));
  var EX_TRACE = (function () {
    var hexToW = function (h) {
      var wds = [];
      for (var i = 0; i < 4; i++) wds.push(parseInt(h.substr(i * 8, 8), 16) >>> 0);
      return wds;
    };
    var s = hexToW(EX_KEY);
    for (var i = 0; i < 32; i++) s.push((s[i] ^ SM4.T(s[i + 1] ^ s[i + 2] ^ s[i + 3] ^ EX_RK[i])) >>> 0);
    return s;
  })();

  /* ---------- 题库：结构 / 史话（options[0] 恒正确，展示前洗牌） ---------- */
  var STRUCT_Q = [
    {
      q: { zh: 'SM4 解密时轮密钥的使用顺序是？', en: 'In SM4 decryption, round keys are used…' },
      ok: { zh: 'rk31 → rk0 反序使用', en: 'Reversed: rk31 → rk0' },
      bad: { zh: ['与加密完全相同', '只用偶数编号 rk', '每轮重新扩展'], en: ['identical to encryption', 'only even-numbered rks', 're-expanded each round'] },
      hint: { zh: 'Feistel 的美德：解密=加密反序。', en: 'Feistel virtue: decryption = encryption reversed.' }
    },
    {
      q: { zh: '哪个循环位移属于线性变换 L（而非 L\'）？', en: 'Which rotation belongs to L rather than L\'?' },
      ok: { zh: '<<< 10', en: '<<< 10' },
      bad: { zh: ['<<< 13', '<<< 23', 'L 无循环位移'], en: ['<<< 13', '<<< 23', 'L has no rotations'] },
      hint: { zh: 'L 用 2/10/18/24；L\' 只用 13/23。', en: 'L uses 2/10/18/24; L\' only 13/23.' }
    },
    {
      q: { zh: 'CK 常量的生成公式是？', en: 'What formula generates the CK constants?' },
      ok: { zh: 'ck=(4i+j)×7 mod 256', en: 'ck=(4i+j)×7 mod 256' },
      bad: { zh: ['质数表逐位截取', 'FK 循环左移', '由主密钥派生'], en: ['truncated primes', 'FK rotated left', 'derived from master key'] },
      hint: { zh: '最工业风的常量：7 的乘法表。', en: 'The most industrial constants ever: the 7-times table.' }
    },
    {
      q: { zh: '家族密钥 FK_0 = ？', en: 'Family key FK_0 = ?' },
      ok: { zh: 'A3B1BAC6', en: 'A3B1BAC6' },
      bad: { zh: ['56AA3350', '677D9197', '00070E15'], en: ['56AA3350', '677D9197', '00070E15'] },
      hint: { zh: '经典常量值得背下来。', en: 'A classic constant worth memorizing.' }
    },
    {
      q: { zh: 'SM4 的分组/密钥长度分别是？', en: 'SM4 block / key sizes are…' },
      ok: { zh: '128 位 / 128 位', en: '128 bits / 128 bits' },
      bad: { zh: ['64 位 / 64 位', '128 位 / 256 位', '256 位 / 128 位'], en: ['64 / 64 bits', '128 / 256 bits', '256 / 128 bits'] },
      hint: { zh: 'AES 同级参数，轮数翻倍到 32。', en: 'AES-class parameters, doubled rounds: 32.' }
    },
    {
      q: { zh: 'tau 非线性层由几个并行 S 盒组成？', en: 'How many parallel S-boxes form tau?' },
      ok: { zh: '4 个（每字节一个）', en: '4 — one per byte' },
      bad: { zh: ['1 个串行复用', '8 个半字节级', '16 个'], en: ['1 reused serially', '8 nibble-level', '16'] },
      hint: { zh: '32 位字 ÷ 8 位 S 盒。', en: '32-bit word ÷ 8-bit S-box.' }
    },
    {
      q: { zh: 'SM4 与 AES 的加密轮数分别是？', en: 'Rounds of SM4 vs AES-128?' },
      ok: { zh: '32 轮 vs 10 轮', en: '32 vs 10' },
      bad: { zh: ['10 轮 vs 32 轮', '都是 16 轮', '64 轮 vs 32 轮'], en: ['10 vs 32', 'both 16', '64 vs 32'] },
      hint: { zh: '轮数翻倍换来硬件友好下的充分冗余。', en: 'Doubled rounds buy ample margin while staying hardware-friendly.' }
    },
    {
      q: { zh: 'tau 与 L 的分工是？', en: 'Division of labor between tau and L?' },
      ok: { zh: 'tau 提供非线性（混淆），L 提供线性扩散', en: 'tau gives non-linearity (confusion), L spreads it (diffusion)' },
      bad: { zh: ['都只做代换', 'tau 扩散、L 混淆', '两者都可逆但都不必要'], en: ['both just substitute', 'tau diffuses, L confuses', 'both invertible but unnecessary'] },
      hint: { zh: '香农的两大原则：混淆 + 扩散。', en: 'Shannon\'s two principles: confusion and diffusion.' }
    },
    {
      q: { zh: 'SM4 属于哪一类密码结构？', en: 'SM4 belongs to which cipher structure?' },
      ok: { zh: '非平衡 Feistel 网络', en: 'Unbalanced Feistel network' },
      bad: { zh: ['SPN 替换-置换网络', '纯流密码', 'Lai-Massey 结构'], en: ['SPN', 'pure stream cipher', 'Lai-Massey'] },
      hint: { zh: '每轮只更新一个字——与 AES 的整体置换不同。', en: 'One word updates per round — unlike AES\' whole-state permutation.' }
    },
    {
      q: { zh: '加解密共用同一套电路的关键在于？', en: 'What lets SM4 reuse the encryption circuit for decryption?' },
      ok: { zh: '轮密钥反序即可，结构完全同构', en: 'Same structure — just reverse the round-key order' },
      bad: { zh: ['需要独立的解密算法', '把 S 盒换成逆 S 盒', '把 L 改为 L\''], en: ['needs a separate algorithm', 'swap in inverse S-box', 'replace L with L\''] },
      hint: { zh: '硬件工程师最爱的一点。', en: 'Hardware engineers love this bit.' }
    },
    {
      q: { zh: '反序变换 R 输出的是？', en: 'The reverse transform R outputs…' },
      ok: { zh: '(X35, X34, X33, X32) 反序作为密文', en: '(X35, X34, X33, X32) reversed as ciphertext' },
      bad: { zh: ['(X32..X35) 原序', '仅 X35 一个字', '全部 X0..X35'], en: ['(X32…X35) in order', 'only X35', 'all of X0…X35'] },
      hint: { zh: '32 轮跑完停在 X35，倒着读出来就是密文。', en: 'After 32 rounds you stop at X35; read backwards for ciphertext.' }
    }
  ];
  var HISTORY_Q = [
    {
      q: { zh: 'SM4 在 2006 年首次公开时的名字是？', en: 'SM4 was first published in 2006 as…' },
      ok: { zh: 'SMS4', en: 'SMS4' },
      bad: { zh: ['SM2', 'SCB2', 'WPI-4'], en: ['SM2', 'SCB2', 'WPI-4'] },
      hint: { zh: '多一个 S——后与 SM2/SM3 排齐而更名。', en: 'One extra S — dropped to align with SM2/SM3.' }
    },
    {
      q: { zh: 'SM4 最初为保护什么系统而生？', en: 'SM4 was originally created to protect…' },
      ok: { zh: 'WAPI 无线局域网', en: 'the WAPI wireless LAN' },
      bad: { zh: ['银行磁条卡', '二代身份证', '北斗短报文'], en: ['bank magstripes', '2nd-gen ID cards', 'BeiDou SMS'] },
      hint: { zh: 'IEEE 802.11i 的中国对手方案。', en: 'China\'s answer to IEEE 802.11i.' }
    },
    {
      q: { zh: '哪一年成为国家标准 GB/T 32907？', en: 'It became national standard GB/T 32907 in…' },
      ok: { zh: '2016 年', en: '2016' },
      bad: { zh: ['2006 年', '2012 年', '2019 年'], en: ['2006', '2012', '2019'] },
      hint: { zh: '同期进入 ISO/IEC 18033-3。', en: 'It entered ISO/IEC 18033-3 around then.' }
    },
    {
      q: { zh: 'SM4 第一设计人是？', en: 'SM4\'s principal designer is…' },
      ok: { zh: '吕述望', en: 'Shu-Wang Lu' },
      bad: { zh: ['王小云', '冯登国', '卿斯汉'], en: ['Xiaoyun Wang', 'Deng-Guo Feng', 'Sihan Qing'] },
      hint: { zh: '中科院信息安全中心元老。', en: 'A veteran of the CAS information-security center.' }
    },
    {
      q: { zh: 'SM4 被收录进的国际标准是？', en: 'Which international standard includes SM4?' },
      ok: { zh: 'ISO/IEC 18033-3 (2017)', en: 'ISO/IEC 18033-3 (2017)' },
      bad: { zh: ['NIST FIPS 197', 'RFC 8439', 'ITU-T X.509'], en: ['NIST FIPS 197', 'RFC 8439', 'ITU-T X.509'] },
      hint: { zh: '加密算法国际标准第 3 部分：分组密码。', en: 'Part 3 of the encryption-algorithm standard: block ciphers.' }
    },
    {
      q: { zh: '国密家族的分工正确的是？', en: 'Correct division of labor in the Guomi family?' },
      ok: { zh: 'SM2 公钥 · SM3 哈希 · SM4 分组 · ZUC 流', en: 'SM2 public-key · SM3 hash · SM4 block · ZUC stream' },
      bad: { zh: ['SM2 哈希 · SM3 分组', '全部都是分组密码', 'SM4 公钥 · SM2 流密码'], en: ['SM2 hash, SM3 block', 'all four are block ciphers', 'SM4 public-key, SM2 stream'] },
      hint: { zh: '四件套覆盖公钥/哈希/分组/流四大赛道。', en: 'Four tools covering public-key, hash, block and stream.' }
    },
    {
      q: { zh: 'SMS4 于 2006 年公开时伴随的重要承诺是？', en: 'What accompanied SMS4\'s 2006 publication?' },
      ok: { zh: '算法全文完全公开——可被全世界审查', en: 'The full algorithm was published — open to worldwide review' },
      bad: { zh: ['仅公布接口不公布细节', '只对签约企业公开', '十年后才解密'], en: ['interface only, no details', 'signed partners only', 'declassified a decade later'] },
      hint: { zh: '与「保密才有安全」的旧思路分道扬镳。', en: 'A clean break from security-by-secrecy thinking.' }
    }
  ];

  var wrap = document.createElement('div');
  wrap.className = 's4-wrap';
  wrap.innerHTML =
    '<div class="s4-prog" id="s4-prog"></div>' +
    '<div id="s4-badge" class="s4-badge"></div>' +
    '<div class="s4-step" id="s4-step"></div>' +
    '<div class="s4-btns" id="s4-opts"></div>' +
    '<div class="s4-msg" id="s4-msg"></div>' +
    '<div class="s4-btns"><button class="btn yellow" id="s4-hint" hidden></button></div>' +
    '<div class="s4-hintbox" id="s4-hintbox" hidden></div>' +
    '<div class="s4-btns"><button class="btn yellow" id="s4-sboxbtn"></button></div>' +
    '<div class="s4-sbox" id="s4-sbox"></div>' +
    '<div class="s4-btns"><button class="btn yellow" id="s4-next" hidden></button></div>' +
    '<div class="s4-btns"><button class="btn" id="s4-daily"></button></div>' +
    '<div class="s4-help">' + T('gs.sm4.helpText') + '</div>';
  root.appendChild(wrap);
  var el = function (id) { return wrap.querySelector('#' + id); };
  var progEl = el('s4-prog'), stepEl = el('s4-step'), optsEl = el('s4-opts'),
      msgEl = el('s4-msg'), nextBtn = el('s4-next'), dailyBtn = el('s4-daily'),
      badgeEl = el('s4-badge'), sboxBox = el('s4-sbox'), sboxBtn = el('s4-sboxbtn'),
      hintBtn = el('s4-hint'), hintBox = el('s4-hintbox');
  hintBtn.textContent = T('gs.sm4.hintBtn');
  dailyBtn.textContent = T('gs.sm4.dailyBtn');

  /* 引擎自检徽章 + 官方 S 盒表 */
  if (SM4.SELF_TEST) {
    badgeEl.textContent = T('gs.sm4.selfTestOk');
  } else {
    badgeEl.textContent = T('gs.sm4.selfTestFail');
    badgeEl.className += ' fail';
  }
  (function () {
    var h = '<table>';
    h += '<tr><td class="h">·</td>';
    for (var c = 0; c < 16; c++) h += '<td class="h">' + c.toString(16).toUpperCase() + '</td>';
    h += '</tr>';
    for (var r = 0; r < 16; r++) {
      h += '<tr><td class="h">' + r.toString(16).toUpperCase() + '</td>';
      for (c = 0; c < 16; c++) h += '<td>' + h2(SM4.SBOX[r * 16 + c]) + '</td>';
      h += '</tr>';
    }
    sboxBox.innerHTML = h + '</table>';
  })();
  function syncSbox() {
    var open = sboxBox.classList.contains('on');
    sboxBtn.textContent = open ? T('gs.sm4.sboxHide') : T('gs.sm4.sboxBtn');
  }
  sboxBtn.addEventListener('click', function () {
    sboxBox.classList.toggle('on');
    syncSbox();
  });
  syncSbox();

  var roundNum = 0, score = 0, streak = 0, stepIdx = 1, firstTry = true,
      answered = false, finished = false, dailyMode = false, startTs = 0,
      cur = null, nextTimer = null, hintTaken = false;

  function updProg() {
    progEl.textContent = fmt('gs.sm4.prog', {
      round: Math.min(roundNum, TOTAL), total: TOTAL, step: Math.min(stepIdx, 4), streak: streak
    });
  }
  function setMsg(cls, txt) { msgEl.className = 's4-msg ' + cls; msgEl.textContent = txt; }

  function makeQ(rnd) {
    var kind = ['sbox', 'trace', stepIdx >= 3 ? (roundNum % 2 ? 'struct' : 'history') : 'struct', 'history'][stepIdx - 1];
    if (stepIdx === 3) kind = ((roundNum + stepIdx) % 2 === 0) ? 'struct' : 'trace';
    if (kind === 'sbox') {
      var inByte = 0;
      while (inByte === 0 || inByte > 255) inByte = Math.floor(rnd() * 256);
      var correct = SM4.SBOX[inByte];
      var bads = [];
      while (bads.length < 3) {
        var v = SM4.SBOX[Math.floor(rnd() * 256)];
        if (v !== correct && bads.indexOf(v) < 0) bads.push(v);
      }
      return {
        html: fmt('gs.sm4.qSbox', { inp: h2(inByte) }),
        options: shuffle([
          { t: h2(correct), ok: true },
          { t: h2(bads[0]), ok: false }, { t: h2(bads[1]), ok: false }, { t: h2(bads[2]), ok: false }
        ], rnd),
        hint: fmt('gs.sm4.hintSbox', {
          row: (inByte >> 4).toString(16).toUpperCase(),
          col: (inByte & 15).toString(16).toUpperCase(),
          val: h2(correct)
        })
      };
    }
    if (kind === 'trace') {
      var xi = Math.min(28, (roundNum - 1) * 9 + stepIdx * 2);
      var truth = (EX_TRACE[xi] ^ SM4.T(EX_TRACE[xi + 1] ^ EX_TRACE[xi + 2] ^ EX_TRACE[xi + 3] ^ EX_RK[xi])) >>> 0;
      var wrong = [(truth ^ 0x00010000) >>> 0, (truth ^ 0xFF00FF00) >>> 0, SM4.rotl(truth, 1)];
      return {
        html: fmt('gs.sm4.qTrace', {
          i: String(xi),
          x0: w8(EX_TRACE[xi]), x1: w8(EX_TRACE[xi + 1]),
          x2: w8(EX_TRACE[xi + 2]), x3: w8(EX_TRACE[xi + 3]),
          rk: w8(EX_RK[xi])
        }),
        options: shuffle([
          { t: w8(truth), ok: true },
          { t: w8(wrong[0]), ok: false }, { t: w8(wrong[1]), ok: false }, { t: w8(wrong[2]), ok: false }
        ], rnd),
        hint: fmt('gs.sm4.hintTrace', {})
      };
    }
    var pool = kind === 'history' ? HISTORY_Q : STRUCT_Q;
    var q = pool[(Math.floor(rnd() * 97) + stepIdx * 7 + roundNum * 13) % pool.length];
    var opts = [{ t: isEn() ? q.ok.en : q.ok.zh, ok: true }];
    var badList = isEn() ? q.bad.en : q.bad.zh;
    for (var bi = 0; bi < badList.length; bi++) opts.push({ t: badList[bi], ok: false });
    return {
      html: isEn() ? q.q.en : q.q.zh,
      options: shuffle(opts, rnd),
      hint: isEn() ? q.hint.en : q.hint.zh
    };
  }

  function renderStep() {
    updProg();
    hintTaken = false;
    hintBox.hidden = true;
    hintBtn.hidden = !cur || !cur.hint;
    cur = makeQ(dailyMode ? mulberry(daySeed() * 31 + roundNum * 17 + stepIdx * 3) : mulberry(Math.floor(Math.random() * 2147483000) + 1));
    stepEl.innerHTML = cur.html;
    optsEl.innerHTML = '';
    cur.options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.style.fontFamily = 'var(--font-mono)';
      b.textContent = o.t;
      b.addEventListener('click', function () { judge(o.ok); });
      optsEl.appendChild(b);
    });
    setMsg('', '');
  }

  function award(ok) {
    var gained;
    if (ok && firstTry) { streak++; gained = 20 + (streak - 1) * 5; }
    else if (ok) { gained = 10; }
    else { streak = 0; gained = 0; }
    score += gained;
    return gained;
  }
  function judge(ok) {
    if (answered || finished) return;
    if (ok) {
      answered = true;
      var g = award(true);
      if (Arcade.juice) Arcade.juice.win();
      setMsg('ok', fmt('gs.sm4.ok', { pts: g }));
      nextTimer = setTimeout(advance, 700);
    } else {
      firstTry = false;
      award(false);
      if (Arcade.juice) Arcade.juice.lose();
      setMsg('no', T('gs.sm4.retry'));
    }
  }
  function advance() {
    stepIdx++;
    firstTry = true;
    answered = false;
    if (stepIdx <= 4) { renderStep(); return; }
    score += 30;
    if (roundNum >= TOTAL) { finish(); return; }
    setMsg('ok', fmt('gs.sm4.roundDone', { n: roundNum }));
    stepEl.textContent = '';
    optsEl.innerHTML = '';
    nextBtn.textContent = T('gs.sm4.nextBtn');
    nextBtn.hidden = false;
    updProg();
  }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('sm4', sec);
    }
    setMsg('ok', fmt('gs.sm4.done', { score: score }));
    nextBtn.textContent = T('gs.sm4.againBtn');
    nextBtn.hidden = false;
    dailyBtn.hidden = false;
    updProg();
  }
  function nextRound() {
    roundNum++;
    stepIdx = 1;
    firstTry = true;
    answered = false;
    nextBtn.hidden = true;
    renderStep();
  }
  function startGame(daily) {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    roundNum = 0;
    score = 0;
    streak = 0;
    finished = false;
    dailyMode = !!daily;
    if (dailyMode) startTs = Date.now();
    dailyBtn.hidden = dailyMode;
    nextRound();
  }
  hintBtn.addEventListener('click', function () {
    if (finished || answered || !cur || !cur.hint) return;
    if (!hintTaken) { hintTaken = true; score = Math.max(0, score - 10); setMsg('', T('gs.sm4.hintUsed')); }
    hintBox.hidden = false;
    hintBox.textContent = cur.hint;
  });
  nextBtn.addEventListener('click', function () {
    if (finished) startGame(false);
    else nextRound();
  });
  dailyBtn.addEventListener('click', function () { startGame(true); });

  window.GAME_RESTART = function () { startGame(false); };

  startGame(false);
})();
