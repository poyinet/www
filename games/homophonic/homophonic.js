/* 破译 DECODE ARCADE · homophonic —— 同音替换
   真实多替身码表：按英文字母频率分配替身卡（E 多 Z 少），
   密文用随机替身字符加密；玩家选密码表位→防破译（频率平坦化）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.homophonic.tut1t'), d: T('gs.homophonic.tut1') },
  { t: T('gs.homophonic.tut2t'), d: T('gs.homophonic.tut2') },
  { t: T('gs.homophonic.tut3t'), d: T('gs.homophonic.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  /* 替身池：10×6 网格，与英文字母频率对应分配 */
  var FREQ = [12, 2, 4, 6, 12, 3, 3, 6, 8, 1, 1, 6, 4, 6, 10, 3, 1, 8, 8, 10, 4, 3, 3, 1, 3, 1];
  var GLYPH = '';
  var WORDS = ['HELP', 'VENI', 'WAR', 'GOLD', 'BACK', 'NINE'];
  var TARGET = '';

  /* 生成替身码表：给每个字母分配对应数量的字符（取自 60 字池），返回映射 letter → [aliases] */
  function buildTable(rnd) {
    var pool = [];
    for (var i = 0; i < 60; i++) pool.push(('0' + i.toString(36)).toUpperCase());
    var table = {};
    var start = 0;
    for (var li = 0; li < 26; li++) {
      var n = FREQ[li];
      var aliases = [];
      for (var k = 0; k < n; k++) aliases.push(pool[start + k]);
      start += n;
      table[A[li]] = aliases;
    }
    return table;
  }
  function encHomophonic(pt, table, rnd) {
    var out = '';
    for (var i = 0; i < pt.length; i++) {
      var ch = pt[i].toUpperCase();
      if (!A.includes(ch)) { out += ch; continue; }
      var al = table[ch];
      out += al[Math.floor(rnd() * al.length)];
    }
    return out;
  }
  function decHomophonic(ct, table) {
    var rev = {};
    Object.keys(table).forEach(k => table[k].forEach(v => rev[v] = k));
    var out = '';
    for (var i = 0; i < ct.length; i++) out += rev[ct[i]] || '?';
    return out;
  }

  var TOTAL = 6, idx = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      table = null, target = '',
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'ho-wrap';
  wrap.innerHTML =
    '<div class="ho-prog" id="ho-prog"></div>' +
    '<div class="ho-stage" id="ho-stage"></div>' +
    '<div class="ho-table" id="ho-table"></div>' +
    '<div class="ho-q" id="ho-q"></div>' +
    '<div class="ho-btns" id="ho-opts"></div>' +
    '<div class="ho-msg" id="ho-msg"></div>' +
    '<div class="ho-expl" id="ho-expl"></div>' +
    '<div class="ho-btns"><button class="btn green" id="ho-next" hidden></button></div>' +
    '<div class="ho-btns"><button class="btn" id="ho-daily">' + T('gs.homophonic.dailyBtn') + '</button></div>' +
    '<div class="ho-help">' + T('gs.homophonic.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('ho-prog'), stageEl = $('ho-stage'), tableEl = $('ho-table'),
      qEl = $('ho-q'), optsEl = $('ho-opts'), msgEl = $('ho-msg'),
      explEl = $('ho-expl'), nextB = $('ho-next'), dailyBtn = $('ho-daily');

  function upd() { progEl.textContent = fmt('gs.homophonic.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'ho-msg ' + c; msgEl.textContent = t; }

  function tableHtml() {
    var out = '';
    for (var li = 0; li < 26; li++) {
      out += '<div class="ho-line"><span class="ho-letter">' + A[li] + '→</span>' +
        table[A[li]].map(g => '<span class="ho-glyph">' + g + '</span>').join(' ') + '</div>';
    }
    return out;
  }

  function buildLevels(rnd) {
    var ls = [];
    var w = WORDS[Math.floor(rnd() * WORDS.length)];
    target = w;
    ls.push({ kind: 'assign', word: w });
    ls.push({ kind: 'encrypt', word: w });
    ls.push({ kind: 'fight', word: w });
    var w2 = WORDS[Math.floor(rnd() * WORDS.length)];
    ls.push({ kind: 'encrypt', word: w2 });
    ls.push({ kind: 'fight', word: w2 });
    ls.push({ kind: 'crack', word: w2 });
    return ls;
  }

  function renderQ() {
    cur = levels[idx];
    if (cur.kind === 'assign') {
      stageEl.textContent = L({ zh: '🃏 分卡：构建替身码表', en: '🃏 Deal: build the table' });
      tableEl.innerHTML = '<div class="ho-line">A→12 张 · E→12 张 · R→8 张 · Z→1 张 · Q→1 张…</div>';
      qEl.textContent = '按频率给字母分替身卡：哪个字母拿到的卡最多？';
      curOpts = ['E 与 A', 'Z 与 Q', 'G 与 M', 'W 与 X'];
      curA = 0;
    } else if (cur.kind === 'encrypt') {
      stageEl.textContent = L({ zh: '🔏 加密：替身随机换脸', en: '🔏 Encrypt: aliases at random' });
      tableEl.innerHTML = tableHtml();
      qEl.textContent = '码表完成。用同一码表加密两次「' + cur.word + '」——两次结果？';
      var c1 = encHomophonic(cur.word, table, rnd);
      var c2 = '';
      do { c2 = encHomophonic(cur.word, table, rnd); } while (c2 === c1);
      curOpts = ['一模一样（同字同表）', '几乎不同（相同字母可出不同替身）', '第二次无法加密'];
      curA = 1;
    } else if (cur.kind === 'fight') {
      stageEl.textContent = L({ zh: '📊 反频率分析', en: '📊 Foil frequency analysis' });
      tableEl.innerHTML = tableHtml();
      var ct = encHomophonic(cur.word, table, rnd);
      qEl.textContent = '把「' + cur.word + '」加密出：' + ct + '。现在对手数字母频率——谁的结论会错？';
      curOpts = ['替身让 E 的密度被打散，频率分布更像均匀', '替身让 E 更容易被找出来', '同音替换便于统计'];
      curA = 0;
    } else {
      stageEl.textContent = L({ zh: '🔍 破译：用字典反查', en: '🔍 Crack via dictionary' });
      tableEl.innerHTML = tableHtml();
      var ct2 = encHomophonic(cur.word, table, rnd);
      qEl.textContent = '你截到密文「' + ct2 + '」，已知它是四字母军名词典中的词——它是什么？';
      curOpts = [
        decHomophonic(ct2, table),
        WORDS[(WORDS.indexOf(cur.word) + 1) % WORDS.length],
        WORDS[(WORDS.indexOf(cur.word) + 2) % WORDS.length]
      ];
      curA = 0;
    }
    /* C-1 防护 */
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
      b.textContent = o;
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'ho-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 20; setMsg('ok', T('gs.homophonic.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.homophonic.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L({ zh: '多替身把同一字母伪装成不同符号：E 的 12 张卡让它在文中各点「掉皮更换」，统计收敛失败——这是文艺复兴对抗频率分析的关键。', en: 'Aliases make the same letter wear different faces; with twelve cards E no longer stands out, and statistics lose their high ground.' });
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx++; if (idx >= TOTAL) { finish(); return; } renderQ(); }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('homophonic', sec); }
    stageEl.textContent = ''; tableEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.homophonic.done', { score: score }));
    nextB.textContent = T('gs.homophonic.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var levels = [];
  function startGame(daily) {
    idx = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 83); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    table = buildTable(rnd);
    levels = buildLevels(rnd);
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
