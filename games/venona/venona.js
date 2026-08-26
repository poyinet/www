/* ============================================================
   VENONA 双密复用破译 · 一次性密码本违规（旗舰，全网独家）
   历史原型：冷战真实反间谍破译 —— 苏联间谍两次使用同一段密钥流
   （一次性密码本被违规复用），美英代号 VENONA，靠「crib 拖拽」
   逐字撕开两封电文。
   数学：C1=P1+K，C2=P2+K ⇒ C1−C2 = P1−P2（mod 27），密钥被消去。
   猜中 P1 某处是某词 → 用差值直接算出 P2 同位置的字母；
   两侧联动揭示，直到两封电文全部还原。
   三难度：入门/进阶/高手（高手含干扰词）。记分：用时（min）。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.venona.tut1t'), d: T('gs.venona.tut1') },
  { t: T('gs.venona.tut2t'), d: T('gs.venona.tut2') },
  { t: T('gs.venona.tut3t'), d: T('gs.venona.tut3') },
  { t: T('gs.venona.tut4t'), d: T('gs.venona.tut4') }
];

(function () {
  /* ==VENONA-CORE-START== */
  var VENCORE = (function () {
    var SYM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '; // 27 符号：A-Z + 空格
    function sidx(c) { return c === ' ' ? 26 : c.charCodeAt(0) - 65; }
    function sletter(n) { return SYM[((n % 27) + 27) % 27]; }
    function enc(plain, key) {
      var out = '';
      for (var i = 0; i < plain.length; i++) out += sletter(sidx(plain[i]) + key[i]);
      return out;
    }
    function dec(cipher, key) {
      var out = '';
      for (var i = 0; i < cipher.length; i++) out += sletter(sidx(cipher[i]) - key[i]);
      return out;
    }
    function diffArr(c1, c2) {
      var d = [];
      for (var i = 0; i < c1.length; i++) d.push(sidx(c1[i]) - sidx(c2[i]));
      return d;
    }
    /* ---------- 可读性评分（对数似然比 + 双字母组 + 空格 + 词典） ---------- */
    var ENGFREQ = [8.17, 1.49, 2.78, 4.25, 12.70, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41, 6.75, 7.51, 1.93, 0.10, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07];
    var BIG = { TH: 1, HE: 1, IN: 1, ER: 1, AN: 1, RE: 1, ON: 1, AT: 1, EN: 1, ND: 1, ST: 1, OU: 1, EA: 1, NG: 1, OR: 1, TI: 1, AS: 1, AR: 1, TE: 1, IS: 1, IT: 1, HA: 1, ED: 1, OF: 1, NT: 1 };
    var WORDS = ('THE AND FOR YOU ARE NOT WAS HIS HER ONE ALL BUT CAN NEW OUT OUR HAD HOW ITS TWO USE WHO MAY MAN DAY WAY GET SEE ' +
      'THAT WITH FROM HAVE THIS CODE KEYS MOVE STOP RAID SIGN ZONE THEM THEY WILL JUST KNOW MAKE MORE TIME WORD NAME SHIP GATE LINE TREE LAKE ROCK GOLD SILK FIRE BOMB TEST ' +
      'STORM NIGHT LIGHT CODES ENEMY WATCH ALPHA DELTA TROOP DAWN GUARD RADIO POWER TOWER GLASS HOUSE QUEEN KING RIVER MOUNT FOREST COAST CLOUD ' +
      'ATTACK SIGNAL SECRET BOMBER TARGET RAIDER MORSE CIPHER CASTLE BRIDGE CANYON DESERT ISLAND GARDEN POCKET ROCKET BATTLE STREET TUNNEL HARBOR MACHINE VILLAGE PATROL ' +
      'MESSAGE WEATHER BOMBING CAPTAIN GENERAL COURIER SIGNALS COVERT SURVIVE ' +
      'CODEBOOK WIRELESS MACHINES STRATEGY FORTRESS INVASION MIDNIGHT ELEPHANT AIRFIELD BARRACKS ' +
      'SUBMARINE BATTALION TELEGRAPH ENCRYPTED INTERCEPT SOVIET MOSCOW AGENT COURIER MEETING REPORT').split(' ').filter(function (w) { return w.length >= 3; });
    var WDICT = {};
    WORDS.forEach(function (w) { WDICT[w] = true; });
    function readScore(s) {
      var cnt = new Array(26).fill(0), n = 0, sp = 0;
      for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c >= 65 && c <= 90) { cnt[c - 65]++; n++; }
        else if (c === 32) { sp++; n++; }
      }
      if (n < 3) return -40;
      var ll = 0;
      for (var k = 0; k < 26; k++) if (cnt[k]) ll += cnt[k] * Math.log(26 * ENGFREQ[k] / 100);
      var freq = Math.max(0, (ll / n + 1.16) / 2.0);
      var hits = 0;
      for (var j = 0; j < s.length - 1; j++) { var bg = s.substr(j, 2); if (BIG[bg]) hits++; }
      var big = Math.min(1, hits / Math.max(1, s.length - 1) / 0.38);
      var word = Math.min(1, sp / n / 0.13);
      var tokens = s.split(' ');
      var dict = 0;
      var dt = 0;
      tokens.forEach(function (t) {
        if (t.length >= 2) { dt++; if (WDICT[t]) dict++; }
      });
      var dictScore = dt ? dict / dt : 0;
      return Math.round(100 * (0.26 * freq + 0.16 * big + 0.14 * word + 0.44 * dictScore));
    }
    /* 扫描用整词评分：派生段必须是一个完整词典词才算命中
       （真实 crib 落点派生对侧整词；部分词匹配/含空格一律判负，防干扰词误导） */
    function wordScore(seg) {
      var t = String(seg).trim();
      if (t.indexOf(' ') >= 0) return -10;
      if (t.length < 2 || !WDICT[t]) return -10;
      return readScore(t);
    }
    /* ---------- crib 拖拽扫描 ----------
       每个位置给出一种「命中解读」：dir=2 表示 P1 含该词（P2 派生整词），
       dir=1 表示 P2 含该词（P1 派生整词），dir=0 表示无整词命中 */
    function dragScan(c1, c2, crib) {
      var d = diffArr(c1, c2);
      var out = [];
      for (var i = 0; i + crib.length <= c1.length; i++) {
        var seg2 = '', seg1 = '';
        for (var j = 0; j < crib.length; j++) {
          seg2 += sletter(sidx(crib[j]) - d[i + j]);
          seg1 += sletter(sidx(crib[j]) + d[i + j]);
        }
        var w2 = wordScore(seg2), w1 = wordScore(seg1);
        var dir = 0, seg = '', score = -10;
        if (w2 > w1) { dir = 2; seg = seg2; score = w2; }
        else if (w1 > 0) { dir = 1; seg = seg1; score = w1; }
        out.push({ i: i, dir: dir, seg: seg, score: score });
      }
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    }
    /* ---------- 挑战生成 ---------- */
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    /* 同长度词对：两封电文共享词边界（真实 VENONA 的「同格式电文」），
       保证 crib 落点总能派生对侧的一个整词（词典命中 → 扫描决定性） */
    var BY_LEN = {};
    WORDS.forEach(function (w) { (BY_LEN[w.length] = BY_LEN[w.length] || []).push(w); });
    function pickPaired(rng, n, minTotal, lenMin) {
      for (var attempt = 0; attempt < 80; attempt++) {
        var a = [], b = [], total = 0;
        var ok2 = true;
        for (var s = 0; s < n && ok2; s++) {
          var len = lenMin + Math.floor(rng() * (9 - lenMin));
          var pool = BY_LEN[len];
          if (!pool || pool.length < 2) { ok2 = false; break; }
          var wa = pool[Math.floor(rng() * pool.length)];
          var wb = pool[Math.floor(rng() * pool.length)];
          var guard = 0;
          while (wb === wa && guard++ < 25) wb = pool[Math.floor(rng() * pool.length)];
          if (wb === wa) { ok2 = false; break; }
          a.push(wa); b.push(wb);
          total += len;
        }
        if (ok2 && total >= minTotal && a.join(' ') !== b.join(' ')) {
          return { a: a, b: b };
        }
      }
      return null;
    }
    function genVenona(level, rng) {
      var n = level === 1 ? 2 : level === 2 ? 3 : 4;
      var minTotal = level === 1 ? 10 : level === 2 ? 16 : 24;
      var lenMin = level === 3 ? 4 : 3;
      var pair = pickPaired(rng, n, minTotal, lenMin);
      if (!pair) { pair = { a: ['NEON', 'SIGNAL', 'SECRET'], b: ['BLACK', 'RAIDER', 'CIPHER'] }; }
      var p1 = pair.a.join(' '), p2 = pair.b.join(' ');
      var L = p1.length;
      var key = [];
      for (var i = 0; i < L; i++) key.push(Math.floor(rng() * 27));
      var c1 = enc(p1, key), c2 = enc(p2, key);
      var cribs = pair.a.slice();
      if (level === 3) {
        // 干扰词：不在两封电文里的词（取 ≥5 字母，避免短词偶发词典命中）
        var decoys = [];
        var used = {};
        pair.a.concat(pair.b).forEach(function (w) { used[w] = true; });
        var pool5 = WORDS.filter(function (w) { return w.length >= 5; });
        for (var d = 0; d < 2; d++) {
          var w2 = pool5[Math.floor(rng() * pool5.length)];
          if (used[w2]) { d--; continue; }
          used[w2] = true;
          decoys.push(w2);
        }
        cribs = cribs.concat(decoys);
        for (var s = cribs.length - 1; s > 0; s--) {
          var j2 = Math.floor(rng() * (s + 1));
          var t2 = cribs[s]; cribs[s] = cribs[j2]; cribs[j2] = t2;
        }
      }
      return { p1: p1, p2: p2, key: key, c1: c1, c2: c2, cribs: cribs, level: level, L: L };
    }
    return {
      SYM: SYM, sidx: sidx, sletter: sletter, enc: enc, dec: dec, diffArr: diffArr,
      readScore: readScore, dragScan: dragScan, WORDS: WORDS,
      mulberry32: mulberry32, genVenona: genVenona
    };
  })();
  /* ==VENONA-CORE-END== */

  var sidx = VENCORE.sidx, sletter = VENCORE.sletter;
  var dragScan = VENCORE.dragScan, genVenona = VENCORE.genVenona, mulberry32 = VENCORE.mulberry32;

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  root.innerHTML =
    '<div class="vn-wrap">' +
    '  <div class="vn-info">' +
    '    <span>' + T('gs.venona.diffLbl') + ' <span id="vn-diff" class="stat-value"></span></span>' +
    '    <span>' + T('gs.venona.timeLbl') + ' <span id="vn-timer" class="stat-value">0s</span></span>' +
    '    <span>' + T('gs.venona.progLbl') + ' <span id="vn-prog" class="stat-value">0</span>/<span id="vn-total" class="stat-value">0</span></span>' +
    '  </div>' +
    '  <div class="vn-flavor">' + T('gs.venona.flavor') + '</div>' +
    '  <div class="vn-cipher">' +
    '    <div class="vn-cipherline"><span class="vn-cl">' + T('gs.venona.msg1') + '</span><span id="vn-c1"></span></div>' +
    '    <div class="vn-cipherline"><span class="vn-cl">' + T('gs.venona.msg2') + '</span><span id="vn-c2"></span></div>' +
    '  </div>' +
    '  <div class="vn-lbl">' + T('gs.venona.cribsLbl') + '</div>' +
    '  <div class="vn-cribs" id="vn-cribs"></div>' +
    '  <div class="vn-lbl">' + T('gs.venona.scanLbl') + '</div>' +
    '  <div class="vn-scan" id="vn-scan">——</div>' +
    '  <div class="vn-lbl">' + T('gs.venona.revealLbl') + '</div>' +
    '  <div class="vn-reveal"><span class="vn-rl">' + T('gs.venona.msg1') + '</span><span id="vn-r1"></span></div>' +
    '  <div class="vn-reveal"><span class="vn-rl">' + T('gs.venona.msg2') + '</span><span id="vn-r2"></span></div>' +
    '  <div class="game-controls">' +
    '    <button class="btn purple" id="vn-undo">' + T('gs.venona.undoBtn') + '</button>' +
    '    <button class="btn red" id="vn-clear">' + T('gs.venona.clearBtn') + '</button>' +
    '    <button class="btn yellow" id="vn-new">' + T('gs.venona.newBtn') + '</button>' +
    '  </div>' +
    '</div>';

  var el = function (id) { return document.getElementById(id); };
  var LEVELS = ['gs.venona.lv1', 'gs.venona.lv2', 'gs.venona.lv3'];
  var level = 0;
  var chal = null;
  var known1 = null, known2 = null;
  var lockStack = [];
  var timerTick = null, startTs = 0, answered = false;
  var curCrib = null;

  function elapsed() { return Math.round((Date.now() - startTs) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }
  function startTimer() {
    stopTimer();
    startTs = Date.now();
    timerTick = setInterval(function () { el('vn-timer').textContent = elapsed() + 's'; }, 500);
  }

  function newChallenge() {
    answered = false;
    curCrib = null;
    lockStack = [];
    chal = genVenona(level + 1, mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0));
    known1 = new Array(chal.L).fill(null);
    known2 = new Array(chal.L).fill(null);
    el('vn-diff').textContent = T(LEVELS[level]);
    el('vn-c1').textContent = chal.c1;
    el('vn-c2').textContent = chal.c2;
    el('vn-total').textContent = chal.L;
    el('vn-scan').textContent = T('gs.venona.scanStart');
    el('vn-scan').style.color = '';
    renderCribs();
    renderReveal();
    startTimer();
  }

  function renderCribs() {
    var box = el('vn-cribs');
    box.innerHTML = '';
    chal.cribs.forEach(function (w) {
      var b = document.createElement('button');
      b.className = 'vn-crib' + (curCrib === w ? ' sel' : '');
      b.textContent = w;
      b.addEventListener('click', function () {
        curCrib = w;
        renderCribs();
        scan();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
      box.appendChild(b);
    });
  }

  function scan() {
    if (!curCrib) return;
    var res = dragScan(chal.c1, chal.c2, curCrib).filter(function (r) { return r.score >= 50; });
    var box = el('vn-scan');
    if (!res.length) {
      box.innerHTML = T('gs.venona.decoyMsg').replace('{w}', curCrib);
      box.style.color = 'var(--neon-pink)';
      return;
    }
    box.style.color = '';
    var html = '';
    res.slice(0, 8).forEach(function (r) {
      var side = r.dir === 2 ? T('gs.venona.msg1') : T('gs.venona.msg2');
      var label = T('gs.venona.candLbl').replace('{i}', r.i).replace('{s}', side).replace('{w}', r.seg).replace('{sc}', r.score);
      html += '<button class="vn-cand" data-i="' + r.i + '" data-dir="' + r.dir + '" title="' + label.replace(/"/g, '') + '">' + label + '</button>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.vn-cand').forEach(function (b) {
      b.addEventListener('click', function () {
        lock(parseInt(this.getAttribute('data-i'), 10), curCrib, parseInt(this.getAttribute('data-dir'), 10));
      });
    });
  }

  /* 锁定：dir=2 → P1 含 crib（P2 由差值联动）；dir=1 → P2 含 crib（P1 联动） */
  function lock(i, crib, dir) {
    if (answered) return;
    var d = VENCORE.diffArr(chal.c1, chal.c2);
    for (var j = 0; j < crib.length; j++) {
      if (dir === 2) {
        known1[i + j] = crib[j];
        known2[i + j] = sletter(sidx(crib[j]) - d[i + j]);
      } else {
        known2[i + j] = crib[j];
        known1[i + j] = sletter(sidx(crib[j]) + d[i + j]);
      }
    }
    lockStack.push({ i: i, w: crib });
    renderReveal();
    checkWin();
    if (Arcade.audio) Arcade.audio.play('move');
  }

  function undo() {
    if (answered || !lockStack.length) return;
    var last = lockStack.pop();
    for (var j = 0; j < last.w.length; j++) {
      known1[last.i + j] = null;
      known2[last.i + j] = null;
    }
    renderReveal();
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function renderReveal() {
    var h1 = '', h2 = '', correct = 0, totalLetters = 0;
    for (var i = 0; i < chal.L; i++) {
      if (chal.p1[i] === ' ') { // 空格是分隔符，直接显示
        h1 += '<span class="vn-sp">&nbsp;</span>';
        h2 += '<span class="vn-sp">&nbsp;</span>';
        continue;
      }
      totalLetters++;
      var k1 = known1[i], k2 = known2[i];
      var c1ok = k1 !== null && k1 === chal.p1[i];
      var c2ok = k2 !== null && k2 === chal.p2[i];
      if (c1ok) correct++;
      if (c2ok) correct++;
      h1 += '<span class="vn-ch' + (c1ok ? ' on' : '') + '">' + (k1 === null ? '·' : k1) + '</span>';
      h2 += '<span class="vn-ch' + (c2ok ? ' on' : '') + '">' + (k2 === null ? '·' : k2) + '</span>';
    }
    el('vn-r1').innerHTML = h1;
    el('vn-r2').innerHTML = h2;
    el('vn-prog').textContent = correct;
    el('vn-total').textContent = totalLetters * 2;
  }

  function checkWin() {
    for (var i = 0; i < chal.L; i++) {
      if (chal.p1[i] === ' ') continue; // 空格是分隔符，不需锁定
      if (known1[i] !== chal.p1[i] || known2[i] !== chal.p2[i]) return;
    }
    answered = true;
    stopTimer();
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.audio) Arcade.audio.play('win');
    if (Arcade.shell) Arcade.shell.submitScore(elapsed());
    if (Arcade.ui) Arcade.ui.toast(T('gs.venona.winToast').replace('{t}', elapsed()), 'win');
    setTimeout(newChallenge, 1400);
  }

  el('vn-undo').addEventListener('click', undo);
  el('vn-clear').addEventListener('click', function () {
    known1 = new Array(chal.L).fill(null);
    known2 = new Array(chal.L).fill(null);
    lockStack = [];
    renderReveal();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  el('vn-new').addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    newChallenge();
  });

  /* 难度切换 */
  var diffRow = document.createElement('div');
  diffRow.className = 'vn-diffs';
  diffRow.innerHTML = LEVELS.map(function (d, i) {
    return '<button class="mode-btn' + (i === level ? ' selected' : '') + '" data-lv="' + i + '">' + T(d) + '</button>';
  }).join('');
  var infoRow = root.querySelector('.vn-info');
  infoRow.appendChild(diffRow);
  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      level = parseInt(this.getAttribute('data-lv'), 10);
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('selected', x === b); });
      newChallenge();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.venona.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    stopTimer();
    level = 0;
    diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('selected', x.getAttribute('data-lv') === '0'); });
    newChallenge();
  };

  // 初始化
  newChallenge();


})();
