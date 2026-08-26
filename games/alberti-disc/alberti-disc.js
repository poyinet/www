/* 破译 DECODE ARCADE · 阿尔贝蒂密码盘 —— 第十四期新游戏
   双盘旋转多表替换：玩家设置索引字，逐字母映射加密；
   三关：设盘加密、换键破译、认识多表的历史。答对 +25。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.alberti-disc.tut1t'), d: T('gs.alberti-disc.tut1') },
  { t: T('gs.alberti-disc.tut2t'), d: T('gs.alberti-disc.tut2') },
  { t: T('gs.alberti-disc.tut3t'), d: T('gs.alberti-disc.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  /* 索引字代表盘面偏移：外盘固定 A-Z，内盘可旋转 s 位 */
  function ring(s) {
    var out = '';
    for (var i = 0; i < 26; i++) out += A[(i + s) % 26];
    return out;
  }
  function enc(p, s) {
    var inner = ring(s), out = '';
    for (var i = 0; i < p.length; i++) {
      var up = p[i].toUpperCase();
      if (A.indexOf(up) < 0) { out += p[i]; continue; }
      out += A[inner.indexOf(up)];
    }
    return out;
  }
  function dec(c, s) {
    var inner = ring(s), out = '';
    for (var i = 0; i < c.length; i++) {
      var up = c[i].toUpperCase();
      if (A.indexOf(up) < 0) { out += c[i]; continue; }
      out += inner[A.indexOf(up)];
    }
    return out;
  }

  var WORDS = [
    ['VENI', 'VEDI', 'VICI'],
    ['ROMA', 'SILENT', 'FLUMEN'],
    ['LAURUM', 'ARMA', 'TOTUS'],
    ['FORTUNA', 'VOLVENS', 'ROTAT']
  ];

  var TOTAL = 6, idx = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'ad-wrap';
  wrap.innerHTML =
    '<div class="ad-prog" id="ad-prog"></div>' +
    '<div class="ad-stage" id="ad-stage"></div>' +
    '<div class="ad-rings" id="ad-rings"></div>' +
    '<div class="ad-q" id="ad-q"></div>' +
    '<div class="ad-btns" id="ad-opts"></div>' +
    '<div class="ad-msg" id="ad-msg"></div>' +
    '<div class="ad-expl" id="ad-expl"></div>' +
    '<div class="ad-btns"><button class="btn green" id="ad-next" hidden></button></div>' +
    '<div class="ad-btns"><button class="btn" id="ad-daily">' + T('gs.alberti-disc.dailyBtn') + '</button></div>' +
    '<div class="ad-help">' + T('gs.alberti-disc.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('ad-prog'), stageEl = $('ad-stage'), ringsEl = $('ad-rings'),
      qEl = $('ad-q'), optsEl = $('ad-opts'), msgEl = $('ad-msg'),
      explEl = $('ad-expl'), nextB = $('ad-next'), dailyBtn = $('ad-daily');

  function upd() { progEl.textContent = fmt('gs.alberti-disc.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'ad-msg ' + c; msgEl.textContent = t; }

  function ringHtml(s) {
    var inner = ring(s);
    var row = function (label, chars) {
      var out = '<div class="ad-row"><span class="ad-lbl">' + label + '</span>';
      for (var i = 0; i < chars.length; i++) out += '<span class="ad-l">' + chars[i] + '</span>';
      return out + '</div>';
    };
    return row('外', A) + row('内', inner);
  }

  function buildLevels(rnd) {
    var ls = [];
    var pick = WORDS[Math.floor(rnd() * WORDS.length)];
    var plain = pick[Math.floor(rnd() * pick.length)];
    var s = 1 + Math.floor(rnd() * 25);
    ls.push({ kind: 'enc', plain: plain, s: s });
    ls.push({ kind: 'dec', ct: enc(plain, s), s: s, knowIdx: true });
    ls.push({ kind: 'crack', ct: enc(plain, s), plain: plain, s: s });
    var pick2 = WORDS[Math.floor(rnd() * WORDS.length)];
    var plain2 = pick2[Math.floor(rnd() * pick2.length)];
    var s2 = 1 + Math.floor(rnd() * 25);
    ls.push({ kind: 'enc', plain: plain2, s: s2 });
    ls.push({ kind: 'dec', ct: enc(plain2, s2), s: s2, knowIdx: true });
    ls.push({ kind: 'crack', ct: enc(plain2, s2), plain: plain2, s: s2 });
    return ls;
  }

  function renderQ() {
    cur = levels[idx];
    if (cur.kind === 'enc') {
      stageEl.textContent = L({ zh: '🧮 设盘加密', en: '🧮 Set & encrypt' });
      ringsEl.innerHTML = ringHtml(cur.s);
      qEl.textContent = '你把内盘转到索引 ' + cur.s + ' 位。明文「' + cur.plain + '」逐字母映射后是？';
      var c = enc(cur.plain, cur.s);
      curOpts = [c, enc(cur.plain, (cur.s + 1) % 26), enc(cur.plain, (cur.s + 7) % 26)];
      curA = 0;
    } else if (cur.kind === 'dec') {
      stageEl.textContent = L({ zh: '📖 盘面解译', en: '📖 Unfold the disc' });
      ringsEl.innerHTML = ringHtml(cur.s);
      qEl.textContent = '内盘索引 ' + cur.s + ' 位。密文「' + cur.ct + '」解译回明文是？';
      curOpts = [dec(cur.ct, cur.s), dec(cur.ct, (cur.s + 1) % 26), dec(cur.ct, (cur.s + 9) % 26)];
      curA = 0;
    } else {
      stageEl.textContent = L({ zh: '🎯 破译：未知索引', en: '🎯 Crack: unknown index' });
      ringsEl.innerHTML = '';
      qEl.textContent = '缴获密文「' + cur.ct + '」。试不同索引，使盘面解译出可读单词——索引是？';
      curOpts = [];
      var real = cur.s;
      curOpts = [real, (real + 1) % 26, (real + 5) % 26, (real + 13) % 26];
      /* 去重 */
      var seen = {};
      curOpts = curOpts.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; });
      if (curOpts.indexOf(real) < 0) curOpts.push(real);
      curA = curOpts.indexOf(real);
    }
    /* 打乱后重算（C-1 防护） */
    var correctRef = curOpts[curA];
    for (var i = curOpts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = curOpts[i]; curOpts[i] = curOpts[j]; curOpts[j] = tmp;
    }
    curA = curOpts.indexOf(correctRef);
    optsEl.innerHTML = '';
    curOpts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = String(o);
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'ad-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 25; setMsg('ok', T('gs.alberti-disc.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.alberti-disc.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    var ans = typeof curOpts[curA] === 'string' && curOpts[curA].length <= 2 ? '索引 ' + curOpts[curA] + ' 位' : curOpts[curA];
    if (cur.kind === 'enc') explEl.textContent = '📌 内盘每移位 1 位，整个字母表就对应偏移一格——逐字查盘连成密文。';
    else if (cur.kind === 'dec') explEl.textContent = '📌 查外盘密文字母 → 对应内盘字母即明文，加解密用同一张表。';
    else explEl.textContent = '📌 ' + ans + ' 时盘面上出现完整的可读词——其余索引只能得到乱码。未知索引=未知密钥。';
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx++; if (idx >= TOTAL) { finish(); return; } renderQ(); }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('alberti-disc', sec); }
    stageEl.textContent = ''; ringsEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.alberti-disc.done', { score: score }));
    nextB.textContent = T('gs.alberti-disc.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var levels = [];
  function startGame(daily) {
    idx = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 23); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    levels = buildLevels(rnd);
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
