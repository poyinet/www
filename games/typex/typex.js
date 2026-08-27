/* 破译 DECODE ARCADE · Typex 打字密码机 —— 第十六期新游戏
   复刻英军五转子打字密码机（两固定 + 三步进 + 反射器）：
   设置单加密 / 逆向复原 / 用已知明文（crib）扫描 26³ 轮位破译截获。
   史实框架验证：五转子、两静三动、无插线板 Mark II、德军从未实战破译；
   转子绕组与步进规则按通行商用 Enigma 线序示意（Typex 实际绕组未完全公开）。
   答对 +20，满分 140。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.typex.tut1t'), d: T('gs.typex.tut1') },
  { t: T('gs.typex.tut2t'), d: T('gs.typex.tut2') },
  { t: T('gs.typex.tut3t'), d: T('gs.typex.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- 转子引擎（Enigma 商用线序示意） ---------- */
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var ROTORS = {
    I:   { w: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 16 }, // Q
    II:  { w: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 4  }, // E
    III: { w: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 21 }, // V
    IV:  { w: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 9  }, // J
    V:   { w: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 25 }  // Z
  };
  var REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  var ORDER = ['I', 'II', 'III', 'IV', 'V'];          /* 左→右；Ⅰ/Ⅱ 为固定轮，Ⅲ/Ⅳ/Ⅴ 步进 */

  function idx(c) { return c.charCodeAt(0) - 65; }
  function fwd(x, r, pos) { var c = r.w[(x + pos) % 26]; return (idx(c) - pos + 26) % 26; }
  function rev(x, r, pos) { var c = A[(x + pos) % 26]; var i = r.w.indexOf(c); return (i - pos + 26) % 26; }

  /* 双步进：右轮每键推进；中轮在自身 notch 或右轮 notch 时联动（真实 Enigma 行为）。
     固定轮（索引 0/1）永不步进。 */
  function stepOnce(pos) {
    var n = ORDER.length;
    var n1 = ROTORS[ORDER[n - 2]].notch;
    var n2 = ROTORS[ORDER[n - 1]].notch;
    if (pos[n - 2] === n1) {
      pos[n - 3] = (pos[n - 3] + 1) % 26;
      pos[n - 2] = (pos[n - 2] + 1) % 26;
    } else if (pos[n - 1] === n2) {
      pos[n - 2] = (pos[n - 2] + 1) % 26;
    }
    pos[n - 1] = (pos[n - 1] + 1) % 26;
  }

  function encLetter(ch, pos) {
    stepOnce(pos);
    var x = idx(ch);
    for (var i = ORDER.length - 1; i >= 0; i--) {
      var r = ROTORS[ORDER[i]];
      x = fwd(x, r, pos[i]);
    }
    x = idx(REFLECTOR[x]);
    for (var j = 0; j < ORDER.length; j++) {
      var r2 = ROTORS[ORDER[j]];
      x = rev(x, r2, pos[j]);
    }
    return A[x];
  }

  function transform(text, startPos) {
    var pos = startPos.slice();
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch < 'A' || ch > 'Z') { out += ch; continue; }
      out += encLetter(ch, pos);
    }
    return out;
  }
  function lettersOf(n) { return A[n % 26]; }
  function keyLbl(pos) { return lettersOf(pos[2]) + ' ' + lettersOf(pos[3]) + ' ' + lettersOf(pos[4]); }

  /* ---------- 关卡 ---------- */
  var WORDS = ['ATTACK', 'SWORD', 'NIGHT', 'DAWN', 'CODEX', 'OUTPOST'];
  var TAILS = ['SUMMIT', 'BEACON', 'MIDDAY', 'HARBOR'];
  var CRIB = 'ATTACKAT';
  var TOTAL = 7, STEP_MAX = 17576; /* 26³ */

  var idx2 = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      levels = null, machine = null,
      dailyMode = false, startTs = 0, rnd = Math.random,
      scanTimer = null;

  var wrap = document.createElement('div');
  wrap.className = 'tx-wrap';
  wrap.innerHTML =
    '<div class="tx-prog" id="tx-prog"></div>' +
    '<div class="tx-stage" id="tx-stage"></div>' +
    '<div class="tx-rotors" id="tx-rotors"></div>' +
    '<div class="tx-sheet" id="tx-sheet"></div>' +
    '<div class="tx-q" id="tx-q"></div>' +
    '<div class="tx-scan" id="tx-scan"></div>' +
    '<div class="tx-btns" id="tx-opts"></div>' +
    '<div class="tx-msg" id="tx-msg"></div>' +
    '<div class="tx-expl" id="tx-expl"></div>' +
    '<div class="tx-btns"><button class="btn green" id="tx-next" hidden></button></div>' +
    '<div class="tx-btns"><button class="btn" id="tx-daily">' + T('gs.typex.dailyBtn') + '</button></div>' +
    '<div class="tx-help">' + T('gs.typex.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('tx-prog'), stageEl = $('tx-stage'), rotorsEl = $('tx-rotors'),
      sheetEl = $('tx-sheet'), qEl = $('tx-q'), scanEl = $('tx-scan'),
      optsEl = $('tx-opts'), msgEl = $('tx-msg'), explEl = $('tx-expl'),
      nextB = $('tx-next'), dailyBtn = $('tx-daily');

  function upd() { progEl.textContent = fmt('gs.typex.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'tx-msg ' + c; msgEl.textContent = t; }

  /* 五转子可视化：fixed 两个标固定，步进三个显示轮位 */
  function rotorsHtml(pos, hideStep) {
    var out = '<div class="tx-row">';
    for (var i = 0; i < 5; i++) {
      var fixed = i < 2;
      out += '<div class="tx-rotor' + (fixed ? ' fixed' : '') + '">' +
        '<div class="tx-rn">' + ORDER[i] + '</div>' +
        '<div class="tx-rp">' + (hideStep && !fixed ? '?' : lettersOf(pos[i])) + '</div>' +
        '<div class="tx-rt">' + (fixed ? '⚙' : '▲') + '</div>' +
        '</div>';
    }
    return out + '</div>';
  }

  function buildLevels() {
    var ls = [];
    var start = [];
    for (var i = 0; i < 5; i++) start.push(Math.floor(rnd() * 26));
    var w1 = WORDS[Math.floor(rnd() * WORDS.length)];
    var w2 = WORDS[Math.floor(rnd() * WORDS.length)];
    var w3 = TAILS[Math.floor(rnd() * TAILS.length)];
    if (w2 === w1) w2 = WORDS[(WORDS.indexOf(w1) + 1) % WORDS.length];
    var msg = CRIB + w3;
    var pos1 = start.slice();
    var ct1 = transform(w1, pos1);
    var pos2 = start.slice();
    var ct2 = transform(w2, pos2);
    var hidePos = [];
    for (var k = 0; k < 5; k++) hidePos.push(Math.floor(rnd() * 26));
    var ctMsg = transform(msg, hidePos);
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1', pos: start.slice(), hideStep: false });
    ls.push({ kind: 'know', q: 'l2q', opts: ['l2o1', 'l2o2', 'l2o3', 'l2o4'], a: 1, e: 'e2', pos: start.slice(), hideStep: false });
    ls.push({ kind: 'enc', w: w1, ct: ct1, pos: pos1, e: 'e3' });               /* 设置单加密 */
    ls.push({ kind: 'dec', w: w2, ct: ct2, pos: pos2, e: 'e4' });               /* 逆向复原 */
    ls.push({ kind: 'crib', ct: ctMsg, msg: msg, tail: w3, pos: hidePos, e: 'e5' }); /* crib 扫描 */
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2'], a: 0, e: 'e6', pos: hidePos, hideStep: false });
    ls.push({ kind: 'know', q: 'l7q', opts: ['l7o1', 'l7o2'], a: 0, e: 'e7', pos: hidePos, hideStep: false });
    return ls;
  }

  /* 干扰项：真实计算，绝不公式化 */
  function fakeCt(w, pos, times) {
    var p = pos.slice();
    p[2] = (p[2] + (times || 1)) % 26;
    return transform(w, p);
  }

  function renderOpts(list, desc) {
    var correctRef = list[curA];
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    curA = list.indexOf(correctRef);
    curOpts = list;
    optsEl.innerHTML = '';
    list.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = o;
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
  }

  function renderQ() {
    cur = levels[idx2];
    stageEl.textContent = T('gs.typex.' + ({ know: 'stageKnow', enc: 'stageEnc', dec: 'stageDec', crib: 'stageCrib' }[cur.kind]));
    rotorsEl.innerHTML = rotorsHtml(cur.pos, cur.hideStep);
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    scanEl.innerHTML = '';
    optsEl.innerHTML = '';

    if (cur.kind === 'know') {
      sheetEl.innerHTML = '<div class="tx-kv">' + L({ zh: '固定轮（Ⅰ/Ⅱ）设置：', en: 'Static rotors (I/II): ' }) + '<b>' + lettersOf(cur.pos[0]) + ' ' + lettersOf(cur.pos[1]) + '</b> · ' +
        L({ zh: '步进轮起始：', en: 'Stepping start: ' }) + '<b>' + keyLbl(cur.pos) + '</b></div>';
      qEl.textContent = T('gs.typex.' + cur.q);
      curA = cur.a;
      renderOpts(cur.opts.map(function (k) { return T('gs.typex.' + k); }));
    } else if (cur.kind === 'enc') {
      sheetEl.innerHTML = '<div class="tx-kv">' + L({ zh: '每日设置单：', en: 'Daily setting sheet: ' }) + '<b>' + lettersOf(cur.pos[0]) + ' ' + lettersOf(cur.pos[1]) + ' · ' + keyLbl(cur.pos) + '</b></div>';
      qEl.textContent = fmt('gs.typex.l3q', { w: cur.w });
      curA = 0;
      var f1 = fakeCt(cur.w, cur.pos, 7);
      var f2 = transform(WORDS[(WORDS.indexOf(cur.w) + 1) % WORDS.length], cur.pos);
      var lst = [cur.ct, f1, f2];
      if (lst[1] === lst[0]) lst[1] = fakeCt(cur.w, cur.pos, 11);
      if (lst[2] === lst[0] || lst[2] === lst[1]) lst[2] = fakeCt(cur.w, cur.pos, 17);
      renderOpts(lst);
    } else if (cur.kind === 'dec') {
      sheetEl.innerHTML = '<div class="tx-kv">' + L({ zh: '同一设置单：', en: 'Same setting sheet: ' }) + '<b>' + lettersOf(cur.pos[0]) + ' ' + lettersOf(cur.pos[1]) + ' · ' + keyLbl(cur.pos) + '</b></div>';
      qEl.textContent = fmt('gs.typex.l4q', { c: cur.ct });
      curA = 0;
      var d1 = WORDS[(WORDS.indexOf(cur.w) + 1) % WORDS.length];
      var d2 = WORDS[(WORDS.indexOf(cur.w) + 2) % WORDS.length];
      var dl = [cur.w, d1, d2];
      if (dl[1] === dl[0]) dl[1] = WORDS[(WORDS.indexOf(cur.w) + 3) % WORDS.length];
      if (dl[2] === dl[0] || dl[2] === dl[1]) dl[2] = WORDS[(WORDS.indexOf(cur.w) + 4) % WORDS.length];
      renderOpts(dl);
    } else if (cur.kind === 'crib') {
      cur.scanned = false;
      sheetEl.innerHTML = '<div class="tx-kv">' + L({ zh: '截获电文（部分）：', en: 'Intercept (partial): ' }) + '<b class="tx-ct">' + cur.ct + '</b><br>' +
        L({ zh: '已知明文 crib：', en: 'Known plaintext crib: ' }) + '<b>' + CRIB + '</b> · ' +
        L({ zh: '固定轮已知：', en: 'Static rotors known: ' }) + '<b>' + lettersOf(cur.pos[0]) + ' ' + lettersOf(cur.pos[1]) + '</b></div>';
      qEl.textContent = T('gs.typex.l5q');
      scanEl.innerHTML = '<button class="btn yellow" id="tx-scan-btn">' + T('gs.typex.scanBtn') + '</button><div class="tx-scan-progress" id="tx-scan-prog" hidden></div>';
      $('tx-scan-btn').addEventListener('click', runScan);
    }
    upd();
  }

  function runScan() {
    var btn = $('tx-scan-btn');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    var prog = $('tx-scan-prog');
    prog.hidden = false;
    var i = 0, hits = [];
    scanTimer = setInterval(function () {
      var t0 = i;
      for (; i < Math.min(t0 + 3500, STEP_MAX); i++) {
        var p = [cur.pos[0], cur.pos[1], i % 26, Math.floor(i / 26) % 26, Math.floor(i / 676) % 26];
        if (transform(CRIB, p) === cur.ct.slice(0, CRIB.length)) hits.push(keyLbl(p));
      }
      prog.textContent = fmt('gs.typex.scanning', { n: i, total: STEP_MAX });
      if (i >= STEP_MAX) {
        clearInterval(scanTimer); scanTimer = null;
        if (!hits.length) { prog.textContent = T('gs.typex.scanNone'); btn.disabled = false; return; }
        cur.found = hits[0];
        cur.hits = hits;
        prog.textContent = fmt('gs.typex.scanHit', { n: hits.length, key: hits[0] }) + (hits.length > 1 ? ' ' + fmt('gs.typex.scanEq', { n: hits.length - 1 }) : '');
        /* 干扰项 = 不会命中 crib 的其它设置（真实机器上被扫描排除） */
        var wrong = [];
        var t = 0;
        while (wrong.length < 2 && t < 300) {
          var q = [cur.pos[0], cur.pos[1], Math.floor(rnd() * 26), Math.floor(rnd() * 26), Math.floor(rnd() * 26)];
          var kk = keyLbl(q);
          if (hits.indexOf(kk) < 0 && wrong.indexOf(kk) < 0) wrong.push(kk);
          t++;
        }
        cur.scanned = true;
        curA = 0;
        renderOpts(hits.slice(0, 3).concat(wrong.slice(0, 3 - Math.min(hits.length, 3))));
      }
    }, 30);
  }

  function judge(pick) {
    if (finished || (!cur.scanned && cur.kind === 'crib')) return;
    /* 双步进等价轮位：凡能还原 crib 的命中设置一律算对 */
    var ok = cur.hits && cur.kind === 'crib' ? cur.hits.indexOf(curOpts[pick]) >= 0 && cur.scanned : pick === curA;
    if (ok) { score += 20; setMsg('ok', T('gs.typex.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.typex.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + T('gs.typex.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }

  function finish() {
    finished = true;
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('typex', sec); }
    stageEl.textContent = ''; rotorsEl.innerHTML = ''; sheetEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; scanEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.typex.done', { score: score }));
    nextB.textContent = T('gs.typex.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 17 + 53); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels();
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
