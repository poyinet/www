/* 破译 DECODE ARCADE · 书密码实战 —— 第十七期新游戏
   共享书 = 密钥：坐标（线-词）查词的真实编码与解码；
   第 4 关演示「认书攻击」——同坐标换书，密文立刻露出谁是密钥。
   史实：Beale Ciphers（独立宣言为书）+ SOE 诗码一次性使用。
   答对 +20，满分 120。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.book-cipher.tut1t'), d: T('gs.book-cipher.tut1') },
  { t: T('gs.book-cipher.tut2t'), d: T('gs.book-cipher.tut2') },
  { t: T('gs.book-cipher.tut3t'), d: T('gs.book-cipher.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- 语料库（共享书内容；含消息词 NIGHT/ATTACK/AT/DAWN） ---------- */
  var BANK = [
    'THE NIGHT WAS DARK AND CLOUDY',
    'THE ENEMY WILL ATTACK AT DAWN',
    'A SECOND WAVE ARRIVED BY DAWN',
    'THE COFFEE WAS HOT AND STRONG',
    'WE MET AT THE OLD MILL',
    'SIGNAL THE SHIP TO TURN NORTH',
    'DAWN CAME SLOWLY OVER THE RIDGE',
    'EVERY CODE NEEDS A KEY',
    'THE PRINTERS RUN ALL NIGHT',
    'THE CLASSES BEGAN AT NOON',
    'BRIDGE TWO IS CLOSED FOR REPAIRS',
    'THE BOOKS WERE STOLEN FROM THE VAULT',
    'WE SHIP THE GOODS BY RAIL',
    'THE LETTERS ARE ON THE DESK',
    'HER WATCH SAYS TEN PAST THREE',
    'THE GARDEN GROWS WEEDS AND WHEAT',
    'A FIRE BURNS IN THE STONE HOUSE',
    'THE TRAIN LEFT BEFORE THE STORM'
  ];
  var MSG_WORDS = ['NIGHT', 'ATTACK', 'AT', 'DAWN'];
  var MANDATORY = [0, 1]; /* 含 NIGHT、ATTACK/AT/DAWN 的必选行 */
  var TOTAL = 6;

  var idx2 = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      levels = null, book = null, suspects = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'bc-wrap';
  wrap.innerHTML =
    '<div class="bc-prog" id="bc-prog"></div>' +
    '<div class="bc-stage" id="bc-stage"></div>' +
    '<div class="bc-book" id="bc-book"></div>' +
    '<div class="bc-q" id="bc-q"></div>' +
    '<div class="bc-check" id="bc-check"></div>' +
    '<div class="bc-btns" id="bc-opts"></div>' +
    '<div class="bc-msg" id="bc-msg"></div>' +
    '<div class="bc-expl" id="bc-expl"></div>' +
    '<div class="bc-btns"><button class="btn green" id="bc-next" hidden></button></div>' +
    '<div class="bc-btns"><button class="btn" id="bc-daily">' + T('gs.book-cipher.dailyBtn') + '</button></div>' +
    '<div class="bc-help">' + T('gs.book-cipher.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('bc-prog'), stageEl = $('bc-stage'), bookEl = $('bc-book'),
      qEl = $('bc-q'), checkEl = $('bc-check'), optsEl = $('bc-opts'),
      msgEl = $('bc-msg'), explEl = $('bc-expl'), nextB = $('bc-next'), dailyBtn = $('bc-daily');

  function upd() { progEl.textContent = fmt('gs.book-cipher.prog', { n: Math.min(idx2 + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'bc-msg ' + c; msgEl.textContent = t; }
  function coordFmt(l, w) { return fmt('gs.book-cipher.coordFmt', { l: l, w: w }); }
  function wordAt(lines, l, w) { var ws = lines[l - 1].split(' '); return ws[w - 1]; }
  function findCoord(lines, word) {
    for (var l = 0; l < lines.length; l++) {
      var ws = lines[l].split(' ');
      var i = ws.indexOf(word);
      if (i >= 0) return { l: l + 1, w: i + 1 };
    }
    return null;
  }

  /* 共享书：必选含消息词的行 + 随机补足 12 行 */
  function buildBook() {
    var lines = [];
    MANDATORY.forEach(function (i) { lines.push(BANK[i]); });
    var rest = shuffle(BANK.map(function (x, i) { return i; }), rnd).filter(function (i) { return MANDATORY.indexOf(i) < 0; }).slice(0, 10);
    rest.forEach(function (i) { lines.push(BANK[i]); });
    return shuffle(lines, rnd);
  }
  /* 同尺寸「假书」：行序乱 + 每行词序打乱（坐标可查但采到的是词沙拉） */
  function garbledBook() {
    var lines = book.map(function (line) { return shuffle(line.split(' '), rnd).join(' '); });
    return shuffle(lines, rnd);
  }
  /* 保证真书解码后确实是消息词序（等价于 findCoord 每组均有词） */
  function msgCoords() {
    var out = [];
    for (var i = 0; i < MSG_WORDS.length; i++) {
      var c = findCoord(book, MSG_WORDS[i]);
      if (!c) return null;
      out.push(c);
    }
    return out;
  }

  function buildLevels() {
    var ls = [];
    book = buildBook();
    suspects = [book, garbledBook(), garbledBook()];
    var mcs = msgCoords();
    while (!mcs || suspects[1].join('|') === suspects[0].join('|') || suspects[2].join('|') === suspects[0].join('|')) {
      book = buildBook();
      suspects = [book, garbledBook(), garbledBook()];
      mcs = msgCoords();
    }
    var encWord = MSG_WORDS[Math.floor(rnd() * MSG_WORDS.length)];
    var encC = findCoord(book, encWord);
    var decL = 1 + Math.floor(rnd() * 12);
    var decLine = book[decL - 1].split(' ');
    var decW = 1 + Math.floor(rnd() * Math.min(decLine.length - 1, 7));
    ls.push({ kind: 'know', q: 'l1q', opts: ['l1o1', 'l1o2', 'l1o3', 'l1o4'], a: 0, e: 'e1' });
    ls.push({ kind: 'enc', word: encWord, coord: encC, e: 'e2' });
    ls.push({ kind: 'dec', l: decL, w: decW, word: wordAt(book, decL, decW), e: 'e3' });
    ls.push({ kind: 'attack', coords: mcs, e: 'e4' });
    ls.push({ kind: 'know', q: 'l5q', opts: ['l5o1', 'l5o2', 'l5o3'], a: 0, e: 'e5' });
    ls.push({ kind: 'know', q: 'l6q', opts: ['l6o1', 'l6o2', 'l6o3'], a: 0, e: 'e6' });
    return ls;
  }

  function bookHtml(lines, title) {
    var out = '<div class="bc-title">' + title + '</div><div class="bc-lines">';
    for (var i = 0; i < lines.length; i++) {
      out += '<div class="bc-line"><span class="bc-lno">' + (i + 1) + '</span>' + lines[i].split(' ').map(function (w, wi) {
        return '<span class="bc-word" data-l="' + (i + 1) + '" data-w="' + (wi + 1) + '">' + w + '</span>';
      }).join(' ') + '</div>';
    }
    return out + '</div>';
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
    stageEl.textContent = T('gs.book-cipher.' + ({ know: 'stageKnow', enc: 'stageEnc', dec: 'stageDec', attack: 'stageAttack' }[cur.kind]));
    bookEl.innerHTML = (cur.kind === 'attack') ? '' : bookHtml(book, T('gs.book-cipher.bookTitle'));
    explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('', '');
    nextB.hidden = true;
    optsEl.innerHTML = '';
    checkEl.innerHTML = '';

    if (cur.kind === 'know') {
      qEl.textContent = T('gs.book-cipher.' + cur.q);
      curA = cur.a;
      renderOpts(cur.opts.map(function (k) { return T('gs.book-cipher.' + k); }));
    } else if (cur.kind === 'enc') {
      qEl.textContent = fmt('gs.book-cipher.l2q', { w: cur.word });
      curA = 0;
      var f1 = coordFmt(1 + Math.floor(rnd() * 11), 2 + Math.floor(rnd() * 6));
      var f2 = coordFmt(1 + Math.floor(rnd() * 11), 2 + Math.floor(rnd() * 6));
      var real = coordFmt(cur.coord.l, cur.coord.w);
      var lst = [real, f1, f2];
      if (lst[1] === lst[0]) lst[1] = coordFmt(12, 8);
      if (lst[2] === lst[0] || lst[2] === lst[1]) lst[2] = coordFmt(11, 7);
      renderOpts(lst);
    } else if (cur.kind === 'dec') {
      qEl.textContent = fmt('gs.book-cipher.l3q', { c: coordFmt(cur.l, cur.w) });
      curA = 0;
      var other = book[Math.floor(rnd() * 12)].split(' ');
      var fw1 = other[Math.floor(rnd() * other.length)];
      var fw2 = other[Math.floor(rnd() * other.length)];
      var dl = [cur.word, fw1, fw2];
      if (dl[1] === dl[0]) dl[1] = 'SIGNAL';
      if (dl[2] === dl[0] || dl[2] === dl[1]) dl[2] = 'BRIDGE';
      renderOpts(dl);
    } else if (cur.kind === 'attack') {
      qEl.textContent = fmt('gs.book-cipher.l4q', { c: cur.coords.map(function (c) { return coordFmt(c.l, c.w); }).join(' · ') });
      /* 三本书展示顺序随机 + 查验结果公开（教学：谁拼得出通顺电文） */
      var order = shuffle([0, 1, 2], rnd);
      var titles = ['l4a', 'l4b', 'l4c'];
      var names = ['', '', ''];
      checkEl.innerHTML = '';
      order.forEach(function (si, pos) {
        var lines = suspects[si];
        var dec = cur.coords.map(function (c) { return wordAt(lines, c.l, c.w); }).join(' ');
        names[pos] = T('gs.book-cipher.' + ['suspectA', 'suspectB', 'suspectC'][si]);
        var card = document.createElement('div');
        card.className = 'bc-card' + (si === 0 ? ' real' : '');
        card.innerHTML = '<div class="bc-card-t">' + T('gs.book-cipher.' + titles[si]) + '</div>' +
          '<div class="bc-card-d">' + fmt('gs.book-cipher.l4res', { book: names[pos], words: dec }) + '</div>';
        checkEl.appendChild(card);
      });
      curA = 0;
      renderOpts(names);
    }
    upd();
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 20; setMsg('ok', T('gs.book-cipher.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.book-cipher.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + T('gs.book-cipher.' + cur.e);
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx2++; if (idx2 >= TOTAL) { finish(); return; } renderQ(); }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('book-cipher', sec); }
    stageEl.textContent = ''; bookEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; checkEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.book-cipher.done', { score: score }));
    nextB.textContent = T('gs.book-cipher.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx2 = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 23 + 41); }
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
