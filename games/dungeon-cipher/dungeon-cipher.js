/* ============================================================
   密码地牢 Cipher Dungeon · Roguelike × 密码破译融合（旗舰，全网独家）
   你潜入敌后密码地牢，每层都有一名守卫拦截了加密电报。
   破译电文 = 攻击！解密正确击退守卫继续下潜；错误 = 守卫反击扣血。
   五类密码逐层递进：凯撒 / 单字节XOR / 仿射 / 栅栏 / 培根，
   每类都有真实破译工具（穷举列表、可读性评分、拨盘实时解密）。
   越深层电文越长、反击越重；可拾取医疗包与破译卷轴。
   记分：层数×100 + 剩余HP×2（max 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.dungeon-cipher.tut1t'), d: T('gs.dungeon-cipher.tut1') },
  { t: T('gs.dungeon-cipher.tut2t'), d: T('gs.dungeon-cipher.tut2') },
  { t: T('gs.dungeon-cipher.tut3t'), d: T('gs.dungeon-cipher.tut3') },
  { t: T('gs.dungeon-cipher.tut4t'), d: T('gs.dungeon-cipher.tut4') }
];

(function () {
  /* ==CD-CORE-START== */
  var CDCORE = (function () {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function idx(c) { return c.charCodeAt(0) - 65; }
    function norm(s) { return String(s).toUpperCase().replace(/[^A-Z]/g, ''); }
    function mod(n, m) { return ((n % m) + m) % m; }
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
    function modInv(a) {
      a = mod(a, 26);
      if (gcd(a, 26) !== 1) return null;
      var m = 26, t, q, x0 = 0, x1 = 1;
      while (a > 1) {
        q = Math.floor(a / m);
        t = m; m = a % m; a = t;
        t = x0; x0 = x1 - q * x0; x1 = t;
      }
      return mod(x1, 26);
    }
    /* ---------- 五类密码 ---------- */
    function caesarEnc(text, shift) {
      var out = '', t = String(text).toUpperCase();
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        out += (ch >= 'A' && ch <= 'Z') ? A[(idx(ch) + shift) % 26] : ch;
      }
      return out;
    }
    function caesarDec(text, shift) { return caesarEnc(text, 26 - (shift % 26)); }
    function xorEnc(text, key) {
      var out = '';
      var t = String(text);
      for (var i = 0; i < t.length; i++) out += String.fromCharCode(t.charCodeAt(i) ^ key);
      return out;
    }
    function affineEnc(text, a, b) {
      var out = '', t = String(text).toUpperCase();
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        out += (ch >= 'A' && ch <= 'Z') ? A[mod(a * idx(ch) + b, 26)] : ch;
      }
      return out;
    }
    function affineDec(text, a, b) {
      var inv = modInv(a);
      if (inv === null) return null;
      var out = '', t = String(text).toUpperCase();
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        out += (ch >= 'A' && ch <= 'Z') ? A[mod(inv * (idx(ch) - b), 26)] : ch;
      }
      return out;
    }
    function railEnc(text, rails) {
      var t = norm(text);
      if (rails <= 1) return t;
      var rows = [];
      for (var r = 0; r < rails; r++) rows.push('');
      var row = 0, dir = 1;
      for (var i = 0; i < t.length; i++) {
        rows[row] += t[i];
        row += dir;
        if (row === rails - 1 || row === 0) dir = -dir;
      }
      return rows.join('');
    }
    function railDec(cipher, rails) {
      var c = norm(cipher);
      if (rails <= 1) return c;
      var n = c.length;
      var rows = [];
      for (var r = 0; r < rails; r++) rows.push('');
      var row = 0, dir = 1;
      var lens = [];
      for (var i = 0; i < rails; i++) lens.push(0);
      for (var j = 0; j < n; j++) { lens[row]++; row += dir; if (row === rails - 1 || row === 0) dir = -dir; }
      var pos = 0;
      for (var r2 = 0; r2 < rails; r2++) { rows[r2] = c.substr(pos, lens[r2]); pos += lens[r2]; }
      var out = '';
      row = 0; dir = 1;
      var ptr = [];
      for (var r3 = 0; r3 < rails; r3++) ptr.push(0);
      for (var k = 0; k < n; k++) {
        out += rows[row][ptr[row]++];
        row += dir;
        if (row === rails - 1 || row === 0) dir = -dir;
      }
      return out;
    }
    var BACON = {
      A: '00000', B: '00001', C: '00010', D: '00011', E: '00100', F: '00101',
      G: '00110', H: '00111', I: '01000', J: '01000', K: '01001', L: '01010',
      M: '01011', N: '01100', O: '01101', P: '01110', Q: '01111', R: '10000',
      S: '10001', T: '10010', U: '10011', V: '10011', W: '10100', X: '10101',
      Y: '10110', Z: '10111'
    };
    var BACON_REV = {};
    for (var bl in BACON) if (!BACON_REV[BACON[bl]]) BACON_REV[BACON[bl]] = bl;
    function baconEnc(text) {
      var t = norm(text);
      var groups = [];
      for (var i = 0; i < t.length; i++) groups.push(BACON[t[i]]);
      return groups.join(' ');
    }
    function baconDec(code) {
      var groups = String(code).toUpperCase().replace(/[^01AB]/g, '').match(/.{5}/g) || [];
      var out = '';
      for (var i = 0; i < groups.length; i++) {
        var key = groups[i].split('').map(function (b) { return (b === '0' || b === 'A') ? '0' : '1'; }).join('');
        out += BACON_REV[key] || '?';
      }
      return out;
    }
    /* ---------- 可读性评分（对数似然比 + 双字母组 + 空格词形） ---------- */
    var ENGFREQ = [8.17, 1.49, 2.78, 4.25, 12.70, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41, 6.75, 7.51, 1.93, 0.10, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07];
    var BIG = { TH: 1, HE: 1, IN: 1, ER: 1, AN: 1, RE: 1, ON: 1, AT: 1, EN: 1, ND: 1, ST: 1, OU: 1, EA: 1, NG: 1, OR: 1, TI: 1, AS: 1, AR: 1, TE: 1, IS: 1, IT: 1, HA: 1, ED: 1, OF: 1, NT: 1 };
    function readScore(s) {
      var cnt = new Array(26).fill(0), n = 0, sp = 0, other = 0;
      var upper = String(s).toUpperCase();
      for (var i = 0; i < upper.length; i++) {
        var c = upper.charCodeAt(i);
        if (c >= 65 && c <= 90) { cnt[c - 65]++; n++; }
        else if (c === 32) { sp++; n++; }
        else other++;
      }
      if (n < 4) return -60;
      var ll = 0;
      for (var k = 0; k < 26; k++) if (cnt[k]) ll += cnt[k] * Math.log(26 * ENGFREQ[k] / 100);
      var freq = Math.max(0, (ll / n + 1.16) / 2.0);
      var hits = 0;
      for (var j = 0; j < upper.length - 1; j++) {
        var bg = upper.substr(j, 2);
        if (BIG[bg]) hits++;
      }
      var big = Math.min(1, hits / Math.max(1, upper.length - 1) / 0.38);
      var word = Math.min(1, sp / n / 0.13);
      var dict = dictHit(upper);
      return Math.round(100 * (0.28 * freq + 0.17 * big + 0.15 * word + 0.40 * dict) - other * 5);
    }
    /* ---------- 破译工具 ---------- */
    function caesarCands(cipher) {
      var out = [];
      for (var s = 0; s < 26; s++) {
        var text = caesarDec(cipher, s);
        out.push({ key: s, text: text, score: readScore(text) });
      }
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    }
    function railCands(cipher) {
      var out = [];
      for (var r = 2; r <= 7; r++) {
        var text = railDec(cipher, r);
        out.push({ key: r, text: text, score: readScore(text) });
      }
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    }
    function xorCands(cipher) {
      var out = [];
      for (var k = 1; k < 256; k++) {
        var dec = '';
        for (var i = 0; i < cipher.length; i++) dec += String.fromCharCode(cipher.charCodeAt(i) ^ k);
        out.push({ key: k, text: dec, score: readScore(dec) });
      }
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    }
    var COP = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
    function affineCands(cipher) {
      var out = [];
      for (var i = 0; i < COP.length; i++) {
        for (var b = 0; b < 26; b++) {
          var text = affineDec(cipher, COP[i], b);
          if (text === null) continue;
          out.push({ a: COP[i], b: b, text: text, score: readScore(text) });
        }
      }
      out.sort(function (x, y) { return y.score - x.score; });
      return out;
    }
    /* ---------- 电文词库与挑战生成 ---------- */
    var WORDS = [
      'NEON SIGNAL', 'SECRET KEY', 'CODE BREAK', 'NIGHT RAID', 'HIDDEN GATE', 'GOLDEN KEY',
      'SAFE HOUSE', 'TARGET ZONE', 'SILENT RUN', 'DEEP LAKE', 'BLACK BOX', 'IRON GATE',
      'FINAL CODE', 'QUIET STORM', 'ENEMY BASE', 'CLEAR SKY', 'FIRST STRIKE', 'LAST ORDER',
      'SOFT TARGET', 'HARD LINE', 'RED ALERT', 'BLUE LIGHT', 'DARK ROOM', 'FAST RUN',
      'TALL TOWER', 'DEEP LAKE', 'COLD NIGHT', 'WARM BEACH', 'HIGH WALL', 'LONG ROAD',
      'SIDE DOOR', 'BACK DOOR', 'FRONT LINE', 'OPEN FILE', 'CLOSE CALL', 'SAFE ZONE',
      'FREE PASS', 'FAIR PLAY', 'NEXT STEP', 'TOP SECRET', 'EARLY BIRD', 'LATE NIGHT',
      'NEW MOON', 'FULL MOON', 'OLD TOWN', 'BIG CITY', 'SMALL KEY', 'LOST SOUL',
      'FIND WAY', 'KEEP GOING',
      'MIDNIGHT RAID', 'SECRET MESSAGE', 'ENEMY SUBMARINE', 'BATTLE STATION',
      'UNDERGROUND BASE', 'PHANTOM FLEET', 'GOLDEN HORIZON', 'ANCIENT TOMB', 'CODE BREAKER',
      'SILENT NIGHT', 'QUIET FOREST', 'BLUE THUNDER', 'DARK HORIZON',
      'STORM FRONT', 'DRAGON FIRE', 'RED SUNRISE', 'BOMBING RAID', 'HIDDEN FORTRESS',
      'ANCIENT SECRET', 'MOONLIGHT RUN', 'SHINING SWORD', 'DARK CASTLE', 'LOST TEMPLE', 'ROYAL GUARD'
    ];
    /* 词库字典（由 WORDS 自动派生：单词 + 整句）——短电文破译的决定性判据 */
    var WDICT = {}, PH = {};
    (function () {
      WORDS.forEach(function (w) {
        PH[norm(w)] = true;
        w.split(' ').forEach(function (t) { if (t.length >= 2) WDICT[t] = true; });
      });
    })();
    function dictHit(s) {
      var tokens = String(s).split(' ');
      if (tokens.length >= 2) {
        var hits = 0;
        tokens.forEach(function (w) {
          var l = norm(w);
          if (l.length >= 2 && (WDICT[l] || PH[l])) hits++;
        });
        return hits / tokens.length;
      }
      var t = norm(s);
      return (t.length >= 2 && (WDICT[t] || PH[t])) ? 1 : 0;
    }
    function poolForFloor(floor) {
      var minLen = floor <= 2 ? 6 : floor <= 5 ? 8 : floor <= 9 ? 10 : 11;
      return WORDS.filter(function (w) { return norm(w).length >= minLen; });
    }
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var TYPE_BANDS = [
      { max: 2, type: 'caesar' }, { max: 4, type: 'xor' }, { max: 6, type: 'affine' },
      { max: 8, type: 'rail' }, { max: 9, type: 'bacon' }
    ];
    function genChallenge(floor, rng) {
      var type = null;
      for (var i = 0; i < TYPE_BANDS.length; i++) {
        if (floor <= TYPE_BANDS[i].max) { type = TYPE_BANDS[i].type; break; }
      }
      if (!type) {
        var pool = ['caesar', 'xor', 'affine', 'rail'];
        if (floor >= 12) pool.push('bacon');
        type = pool[Math.floor(rng() * pool.length)];
      }
      var list = poolForFloor(floor);
      var plain = list[Math.floor(rng() * list.length)];
      var key = null, cipher = '';
      if (type === 'caesar') {
        key = 1 + Math.floor(rng() * 25);
        cipher = caesarEnc(plain, key);
      } else if (type === 'xor') {
        key = 1 + Math.floor(rng() * 255);
        cipher = xorEnc(plain, key);
      } else if (type === 'affine') {
        key = [COP[Math.floor(rng() * COP.length)], Math.floor(rng() * 26)];
        cipher = affineEnc(plain, key[0], key[1]);
      } else if (type === 'rail') {
        key = 2 + Math.floor(rng() * 6);
        cipher = railEnc(plain, key);
      } else {
        cipher = baconEnc(plain);
      }
      return { type: type, plain: plain, cipher: cipher, key: key, floor: floor };
    }
    return {
      A: A, norm: norm, mod: mod, modInv: modInv, readScore: readScore,
      caesarEnc: caesarEnc, caesarDec: caesarDec, xorEnc: xorEnc,
      affineEnc: affineEnc, affineDec: affineDec, railEnc: railEnc, railDec: railDec,
      baconEnc: baconEnc, baconDec: baconDec, BACON: BACON, BACON_REV: BACON_REV,
      caesarCands: caesarCands, railCands: railCands, xorCands: xorCands, affineCands: affineCands,
      COP: COP, WORDS: WORDS, mulberry32: mulberry32, genChallenge: genChallenge
    };
  })();
  /* ==CD-CORE-END== */

  var norm = CDCORE.norm, readScore = CDCORE.readScore;
  var caesarCands = CDCORE.caesarCands, railCands = CDCORE.railCands;
  var xorCands = CDCORE.xorCands, affineCands = CDCORE.affineCands;
  var affineDec = CDCORE.affineDec, baconDec = CDCORE.baconDec;
  var genChallenge = CDCORE.genChallenge, mulberry32 = CDCORE.mulberry32;

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  root.innerHTML =
    '<div class="cd-dungeon">' +
    '  <div class="cd-info">' +
    '    <span>' + T('gs.dungeon-cipher.floorLbl') + '</span>' +
    '    <span>' + T('gs.dungeon-cipher.hpLbl') + '</span>' +
    '    <span>💎 <span class="stat-value" id="cd-score">0</span></span>' +
    '  </div>' +
    '  <div class="cd-msg" id="cd-msg"></div>' +
    '  <div class="cd-cipher" id="cd-cipher"></div>' +
    '  <div class="cd-hint" id="cd-hint"></div>' +
    '  <div id="cd-tools"></div>' +
    '  <div class="cd-row" id="cd-answer-row" style="display:none">' +
    '    <input id="cd-answer" maxlength="20" placeholder="' + T('gs.dungeon-cipher.ansPh') + '" aria-label="' + T('gs.dungeon-cipher.ansAria') + '">' +
    '    <button class="btn yellow" id="cd-answer-submit">' + T('gs.dungeon-cipher.attackBtn') + '</button>' +
    '  </div>' +
    '  <div class="cd-result" id="cd-result"></div>' +
    '  <div class="cd-items" id="cd-items"></div>' +
    '  <div class="game-controls">' +
    '    <button class="btn red" id="cd-retreat">' + T('gs.dungeon-cipher.retreatBtn') + '</button>' +
    '    <button class="btn green" id="cd-next" style="display:none">' + T('gs.dungeon-cipher.nextBtn') + '</button>' +
    '  </div>' +
    '</div>';

  var ENEMIES = ['gs.dungeon-cipher.enemy1', 'gs.dungeon-cipher.enemy2', 'gs.dungeon-cipher.enemy3', 'gs.dungeon-cipher.enemy4', 'gs.dungeon-cipher.enemy5', 'gs.dungeon-cipher.enemy6', 'gs.dungeon-cipher.enemy7', 'gs.dungeon-cipher.enemy8', 'gs.dungeon-cipher.enemy9'];
  var run = null;

  function el(id) { return document.getElementById(id); }

  function startRun() {
    run = {
      hp: 100, floor: 0, score: 0, over: false,
      rng: mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0),
      items: [], challenge: null, answered: false
    };
    nextFloor();
  }

  function nextFloor() {
    if (run.over) return;
    run.floor++;
    run.answered = false;
    run.challenge = genChallenge(run.floor, run.rng);
    renderFloor();
  }

  function enemyName() {
    var i = Math.min(run.floor - 1, ENEMIES.length - 1);
    return T(ENEMIES[i]);
  }

  function damageFor(floor) { return Math.min(30, 10 + floor * 2); }

  function renderFloor() {
    var ch = run.challenge;
    el('cd-floor').textContent = run.floor;
    el('cd-hp').textContent = run.hp;
    el('cd-score').textContent = run.score;
    el('cd-enemy').textContent = enemyName() + ' \u00b7 HP ' + Math.max(1, 3 - Math.floor(run.floor / 4));
    var typeNames = {
      caesar: 'gs.dungeon-cipher.typeCaesar', xor: 'gs.dungeon-cipher.typeXor',
      affine: 'gs.dungeon-cipher.typeAffine', rail: 'gs.dungeon-cipher.typeRail',
      bacon: 'gs.dungeon-cipher.typeBacon'
    };
    var typeTips = {
      caesar: 'gs.dungeon-cipher.tipCaesar',
      xor: 'gs.dungeon-cipher.tipXor',
      affine: 'gs.dungeon-cipher.tipAffine',
      rail: 'gs.dungeon-cipher.tipRail',
      bacon: 'gs.dungeon-cipher.tipBacon'
    };
    el('cd-msg').textContent = T('gs.dungeon-cipher.msgAttack').replace('{e}', enemyName());
    el('cd-cipher').textContent = ch.type === 'xor' ? toHex(ch.cipher) : ch.cipher;
    el('cd-hint').innerHTML = T('gs.dungeon-cipher.typeHint').replace('{t}', T(typeNames[ch.type])) +
      T(typeTips[ch.type]) +
      T('gs.dungeon-cipher.floorHint').replace('{n}', run.floor).replace('{d}', damageFor(run.floor));
    el('cd-result').textContent = '';
    el('cd-result').style.color = '';
    el('cd-next').style.display = 'none';
    el('cd-answer-row').style.display = ch.type === 'bacon' ? 'flex' : 'none';
    el('cd-answer').value = '';
    buildTools(ch);
    renderItems();
  }

  function toHex(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      out += (s.charCodeAt(i) & 0xFF).toString(16).toUpperCase().padStart(2, '0');
      if (i % 2 === 1) out += ' ';
    }
    return out;
  }

  /* ---------- 各类型工具 ---------- */
  function buildTools(ch) {
    var box = el('cd-tools');
    box.innerHTML = '';
    if (ch.type === 'caesar') {
      box.innerHTML = '<div class="cd-lbl">' + T('gs.dungeon-cipher.toolCaesar') + '</div><div class="cd-grid">';
      caesarCands(ch.cipher).forEach(function (c) {
        box.innerHTML += '<button class="cd-cand" data-guess="' + c.text.replace(/"/g, '') + '" title="' + T('gs.dungeon-cipher.candTip').replace('{k}', c.key).replace('{s}', c.score) + '">' + T('gs.dungeon-cipher.candCaesar').replace('{k}', c.key).replace('{t}', c.text).replace('{s}', c.score) + '</button>';
      });
      box.innerHTML += '</div>';
    } else if (ch.type === 'rail') {
      box.innerHTML = '<div class="cd-lbl">' + T('gs.dungeon-cipher.toolRail') + '</div><div class="cd-grid">';
      railCands(ch.cipher).forEach(function (c) {
        box.innerHTML += '<button class="cd-cand" data-guess="' + c.text.replace(/"/g, '') + '" title="' + T('gs.dungeon-cipher.railTip').replace('{k}', c.key).replace('{s}', c.score) + '">' + T('gs.dungeon-cipher.candRail').replace('{k}', c.key).replace('{t}', c.text).replace('{s}', c.score) + '</button>';
      });
      box.innerHTML += '</div>';
    } else if (ch.type === 'xor') {
      box.innerHTML = '<div class="cd-lbl">' + T('gs.dungeon-cipher.toolXor') + '</div><div class="cd-grid">';
      xorCands(ch.cipher).slice(0, 14).forEach(function (c) {
        box.innerHTML += '<button class="cd-cand" data-guess="' + c.text.replace(/"/g, '') + '" title="' + T('gs.dungeon-cipher.xorTip').replace('{k}', '0x' + c.key.toString(16)).replace('{s}', c.score) + '">' + T('gs.dungeon-cipher.candXor').replace('{k}', '0x' + c.key.toString(16).toUpperCase()).replace('{t}', c.text).replace('{s}', c.score) + '</button>';
      });
      box.innerHTML += '</div>';
    } else if (ch.type === 'affine') {
      var sel = '';
      CDCORE.COP.forEach(function (a) { sel += '<option value="' + a + '">' + a + '</option>'; });
      var bOpts = '';
      for (var b = 0; b < 26; b++) bOpts += '<option value="' + b + '">' + b + '</option>';
      box.innerHTML =
        '<div class="cd-lbl">' + T('gs.dungeon-cipher.toolAffine') + '</div>' +
        '<div class="cd-row">' +
        '  a <select id="cd-a">' + sel + '</select>' +
        '  b <select id="cd-b">' + bOpts + '</select>' +
        '  <button class="btn cyan" id="cd-affine-go">' + T('gs.dungeon-cipher.applyBtn') + '</button>' +
        '  <button class="btn purple" id="cd-affine-solve">' + T('gs.dungeon-cipher.solveBtn') + '</button>' +
        '</div>' +
        '<div class="cd-meterline">' + T('gs.dungeon-cipher.readLbl') + ' <span class="cd-meter"><span class="cd-meterfill" id="cd-meterfill" style="width:0%"></span></span> <span id="cd-meterval">0</span></div>' +
        '<div class="cd-preview" id="cd-affine-preview">——</div>' +
        '<div class="cd-grid" id="cd-affine-cands"></div>';
      el('cd-a').value = 5;
      el('cd-b').value = 0;
      bindAffine();
    } else {
      // bacon：显示分组 + 培根表 + 输入答案
      var tableHtml = '<div class="cd-lbl">' + T('gs.dungeon-cipher.baconTable') + '</div><div class="cd-bacon-table">';
      var rows = '';
      var letters = 'ABCDEFGHIKLMNOPQRSTUWXYZ';
      for (var i = 0; i < letters.length; i++) {
        rows += '<span>' + letters[i] + '=' + CDCORE.BACON[letters[i]] + '</span>';
      }
      tableHtml += rows + '</div>';
      box.innerHTML =
        '<div class="cd-lbl">' + T('gs.dungeon-cipher.toolBacon') + '</div>' +
        '<div class="cd-bacongroups">' + ch.cipher + '</div>' +
        tableHtml +
        '<div class="cd-lbl">' + T('gs.dungeon-cipher.baconExample') + '</div>';
    }
    // 绑定候选点击
    box.querySelectorAll('.cd-cand').forEach(function (b) {
      b.addEventListener('click', function () {
        if (run.answered || run.over) return;
        submitGuess(this.getAttribute('data-guess'));
      });
    });
  }

  function bindAffine() {
    var aSel = el('cd-a'), bSel = el('cd-b');
    function apply() {
      if (run.answered || run.over) return;
      var text = affineDec(run.challenge.cipher, parseInt(aSel.value, 10), parseInt(bSel.value, 10));
      var sc = text === null ? 0 : readScore(text);
      el('cd-affine-preview').textContent = text === null ? T('gs.dungeon-cipher.affineBad') : text;
      el('cd-meterfill').style.width = Math.max(0, Math.min(100, sc)) + '%';
      el('cd-meterval').textContent = sc;
    }
    el('cd-affine-go').addEventListener('click', apply);
    el('cd-affine-solve').addEventListener('click', function () {
      var cands = affineCands(run.challenge.cipher).slice(0, 12);
      var html = '';
      cands.forEach(function (c) {
        html += '<button class="cd-cand" data-guess="' + c.text.replace(/"/g, '') + '" title="' + T('gs.dungeon-cipher.affineTip').replace('{a}', c.a).replace('{b}', c.b).replace('{s}', c.score) + '">' + T('gs.dungeon-cipher.affineCand').replace('{a}', c.a).replace('{b}', c.b).replace('{t}', c.text).replace('{s}', c.score) + '</button>';
      });
      el('cd-affine-cands').innerHTML = html;
      el('cd-affine-cands').querySelectorAll('.cd-cand').forEach(function (b) {
        b.addEventListener('click', function () { submitGuess(this.getAttribute('data-guess')); });
      });
      if (Arcade.audio) Arcade.audio.play('ui');
    });
    apply();
  }

  /* ---------- 攻击判定 ---------- */
  function submitGuess(guess) {
    if (run.answered || run.over) return;
    var g = norm(guess), p = norm(run.challenge.plain);
    if (g === p) { winFloor(); }
    else { wrongAttack(guess); }
  }

  function wrongAttack(guess) {
    var dmg = damageFor(run.floor);
    run.hp -= dmg;
    var res = el('cd-result');
    if (run.hp <= 0) {
      run.hp = 0;
      res.innerHTML = T('gs.dungeon-cipher.deadMsg').replace('{d}', dmg).replace('{n}', run.floor);
      res.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
      gameOver();
      return;
    }
    res.innerHTML = T('gs.dungeon-cipher.wrongMsg').replace('{g}', guess).replace('{d}', dmg).replace('{h}', run.hp);
    res.style.color = 'var(--neon-pink)';
    el('cd-hp').textContent = run.hp;
    if (Arcade.audio) Arcade.audio.play('error');
  }

  function winFloor() {
    run.answered = true;
    run.score += 100;
    el('cd-result').innerHTML = T('gs.dungeon-cipher.winMsg').replace('{e}', enemyName());
    el('cd-result').style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.audio) Arcade.audio.play('win');
    // 每 3 层补给
    if (run.floor % 3 === 0) {
      run.hp = Math.min(100, run.hp + 10);
      if (Arcade.ui) Arcade.ui.toast(T('gs.dungeon-cipher.supply').replace('{n}', run.floor), 'win');
    }
    // 掉落
    if (run.rng() < 0.35 && run.items.length < 3) {
      var item = run.rng() < 0.5 ? 'heal' : 'scroll';
      run.items.push(item);
      if (Arcade.ui) Arcade.ui.toast(item === 'heal' ? T('gs.dungeon-cipher.itemHeal') : T('gs.dungeon-cipher.itemScroll'), 'win');
    }
    el('cd-score').textContent = run.score;
    el('cd-hp').textContent = run.hp;
    el('cd-next').style.display = 'inline-block';
    renderItems();
  }

  /* ---------- 道具 ---------- */
  function renderItems() {
    var box = el('cd-items');
    if (!run.items.length) { box.innerHTML = ''; return; }
    var html = '<span class="cd-lbl">' + T('gs.dungeon-cipher.itemsLbl') + '</span>';
    run.items.forEach(function (it, i) {
      html += '<button class="cd-item" data-i="' + i + '">' + (it === 'heal' ? T('gs.dungeon-cipher.itemHealBtn') : T('gs.dungeon-cipher.itemScrollBtn')) + '</button>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.cd-item').forEach(function (b) {
      b.addEventListener('click', function () {
        if (run.over) return;
        var i = parseInt(this.getAttribute('data-i'), 10);
        var it = run.items[i];
        if (it === 'heal') {
          run.hp = Math.min(100, run.hp + 30);
          run.items.splice(i, 1);
          el('cd-hp').textContent = run.hp;
          if (Arcade.ui) Arcade.ui.toast(T('gs.dungeon-cipher.healUse'), 'win');
          if (Arcade.audio) Arcade.audio.play('ui');
          renderItems();
        } else if (it === 'scroll') {
          if (run.answered) return;
          run.items.splice(i, 1);
          renderItems();
          if (Arcade.ui) Arcade.ui.toast(T('gs.dungeon-cipher.scrollUse'), 'win');
          winFloor();
        }
      });
    });
  }

  /* ---------- 结算 ---------- */
  function finalize() {
    run.over = true;
    var hp = Math.max(0, run.hp);
    var res = el('cd-result');
    // 至少完成 1 次有效破译才计分/提交，否则零破译撤离白嫖分数
    if (run.score < 100) {
      run.score = 0;
      el('cd-score').textContent = 0;
      res.innerHTML = T('gs.dungeon-cipher.noSolveMsg');
      res.style.color = 'var(--neon-pink)';
      return;
    }
    // 与教程/结算文案公式一致：层数×100 + HP×2（此前只累计每层 +100，HP 未参与）
    var total = run.floor * 100 + hp * 2;
    run.score = total;
    res.innerHTML = T('gs.dungeon-cipher.finalMsg')
      .replace('{f}', run.floor).replace('{s}', total).replace('{h}', hp);
    res.style.color = 'var(--neon-yellow)';
    el('cd-score').textContent = total;
    if (Arcade.shell) Arcade.shell.submitScore(total);
  }

  function gameOver() {
    finalize();
    el('cd-hp').textContent = 0;
    el('cd-score').textContent = run.score;
    el('cd-next').style.display = 'none';
    el('cd-answer-row').style.display = 'none';
    el('cd-tools').innerHTML = '';
  }

  /* ---------- 事件绑定 ---------- */
  el('cd-retreat').addEventListener('click', function () {
    if (run.over) return;
    if (Arcade.audio) Arcade.audio.play('ui');
    finalize();
    el('cd-next').style.display = 'none';
  });
  el('cd-next').addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    nextFloor();
  });
  el('cd-answer-submit').addEventListener('click', function () {
    submitGuess(el('cd-answer').value);
  });
  el('cd-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitGuess(this.value); });

    var hd=document.createElement('div');hd.style.cssText='font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';hd.textContent=T('gs.dungeon-cipher.helpText');root.appendChild(hd);

  window.GAME_RESTART = function () { startRun(); };

  // 初始化
  startRun();


})();
