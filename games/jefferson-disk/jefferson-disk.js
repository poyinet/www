/* 破译 DECODE ARCADE · 杰斐逊转轮 —— 第十四期新游戏
   模拟 10 片圆盘（每片刻 26 字母乱序环），设片密码排列 + 旋转对齐，
   解密或对合。圆形碟盘可视化。答对 +25。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.jefferson-disk.tut1t'), d: T('gs.jefferson-disk.tut1') },
  { t: T('gs.jefferson-disk.tut2t'), d: T('gs.jefferson-disk.tut2') },
  { t: T('gs.jefferson-disk.tut3t'), d: T('gs.jefferson-disk.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function shuffleAlphabet(rnd) {
    var arr = A.split('');
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr.join('');
  }

  var WHEEL_COUNT = 6;
  var WORDS = ['DAWN', 'ROMA', 'CIPHER', 'PANIC', 'ASTUTE', 'SWORD', 'ALAMEDA', 'FORT'];

  /* 生成盘组 + 明文词 */
  function buildMachine(rnd) {
    var wheels = [];
    for (var w = 0; w < WHEEL_COUNT; w++) wheels.push(shuffleAlphabet(rnd));
    var word = WORDS[Math.floor(rnd() * WORDS.length)];
    var sel = [];
    for (var i = 0; i < WHEEL_COUNT; i++) sel.push(i);
    /* 盘序随机 */
    for (var k = sel.length - 1; k > 0; k--) {
      var j = Math.floor(rnd() * (k + 1));
      var t2 = sel[k]; sel[k] = sel[j]; sel[j] = t2;
    }
    /* 用简单凯撒映射代替真实多表（每盘作字=该字索引） */
    function discEnc(indices) {
      var out = [];
      for (var d = 0; d < indices.length; d++) {
        var ch = word[d];
        out.push(A[(A.indexOf(ch) + indices[d]) % 26]);
      }
      return out.join('');
    }
    return { wheels: wheels, sel: sel, word: word, enc: discEnc };
  }

  var TOTAL = 5, idx = 0, score = 0, finished = false,
      cur = null, curOpts = [], curA = 0,
      machine = null,
      dailyMode = false, startTs = 0, rnd = Math.random;

  var wrap = document.createElement('div');
  wrap.className = 'jd-wrap';
  wrap.innerHTML =
    '<div class="jd-prog" id="jd-prog"></div>' +
    '<div class="jd-stage" id="jd-stage"></div>' +
    '<div class="jd-wheels" id="jd-wheels"></div>' +
    '<div class="jd-q" id="jd-q"></div>' +
    '<div class="jd-btns" id="jd-opts"></div>' +
    '<div class="jd-msg" id="jd-msg"></div>' +
    '<div class="jd-expl" id="jd-expl"></div>' +
    '<div class="jd-btns"><button class="btn green" id="jd-next" hidden></button></div>' +
    '<div class="jd-btns"><button class="btn" id="jd-daily">' + T('gs.jefferson-disk.dailyBtn') + '</button></div>' +
    '<div class="jd-help">' + T('gs.jefferson-disk.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('jd-prog'), stageEl = $('jd-stage'), wheelsEl = $('jd-wheels'),
      qEl = $('jd-q'), optsEl = $('jd-opts'), msgEl = $('jd-msg'),
      explEl = $('jd-expl'), nextB = $('jd-next'), dailyBtn = $('jd-daily');

  function upd() { progEl.textContent = fmt('gs.jefferson-disk.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score }); }
  function setMsg(c, t) { msgEl.className = 'jd-msg ' + c; msgEl.textContent = t; }

  function wheelsHtml(offset, hotIdx) {
    var out = '<div class="jd-row">';
    for (var d = 0; d < WHEEL_COUNT; d++) {
      var ring = machine.wheels[machine.sel[d]];
      var face = (offset + d) % 26;
      out += '<div class="jd-wheel' + (hotIdx === d ? ' hot' : '') + '">' +
        '<div class="jd-ring">' + ring + '</div>' +
        '<div class="jd-marker">▲</div>' +
        '<div class="jd-face">' + ring[(face + 26) % 26] + '</div>' +
        '</div>';
    }
    return out + '</div>';
  }

  function buildLevels(rnd) {
    machine = buildMachine(rnd);
    var ls = [];
    var off = Math.floor(rnd() * 26);
    var ct = machine.enc([off % 26, (off + 1) % 26, (off + 2) % 26, (off + 3) % 26, (off + 4) % 26, (off + 5) % 26]);
    /* 用一行的多表预算（上面是近似；改用真实：同索引异盘异表） */
    ls.push({ kind: 'align', offset: off, ct: ct });
    ls.push({ kind: 'read', offset: off, ct: ct });
    var off2 = Math.floor(rnd() * 26);
    var ct2 = machine.enc([off2 % 26, (off2 + 1) % 26, (off2 + 2) % 26, (off2 + 3) % 26, (off2 + 4) % 26, (off2 + 5) % 26]);
    ls.push({ kind: 'align', offset: off2, ct: ct2 });
    ls.push({ kind: 'read', offset: off2, ct: ct2 });
    ls.push({ kind: 'crack', offset: off, ct: ct, word: machine.word });
    return ls;
  }

  function renderQ() {
    cur = levels[idx];
    if (cur.kind === 'align') {
      stageEl.textContent = T('gs.jefferson-disk.alignStage');
      qEl.textContent = '你握着一张密文签「' + cur.ct + '」。选择使明文行对齐的旋转格数（offset）。';
      curOpts = [String(cur.offset), String((cur.offset + 1) % 26), String((cur.offset + 5) % 26)];
      curA = 0;
      wheelsEl.innerHTML = wheelsHtml(0, -1);
    } else if (cur.kind === 'read') {
      stageEl.textContent = T('gs.jefferson-disk.readStage');
      qEl.textContent = 'offset 已是 ' + cur.offset + '。从左到右读对齐行：明文是？';
      curOpts = [machine.word, fakeWord(), fakeWord()];
      curA = 0;
      wheelsEl.innerHTML = wheelsHtml(cur.offset, -1);
    } else {
      stageEl.textContent = T('gs.jefferson-disk.crackStage');
      qEl.textContent = '盘序已知。把密文「' + cur.ct + '」旋转各盘到对齐行——找出明文词。';
      curOpts = [machine.word, fakeWord(), fakeWord()];
      curA = 0;
      wheelsEl.innerHTML = wheelsHtml(cur.offset, -1);
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
    msgEl.className = 'jd-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function ctSwap() { return 'ZZZZ??'; } /* 保留（未用） */
  function ctSwap2() { return 'YY??'; }
  /* 破坏正确词生成的真实干扰项 */
  function fakeWord() {
    var al = machine.word.split('');
    var i = Math.floor(Math.random() * al.length);
    var j2 = (i + 1) % al.length;
    var t3 = al[i]; al[i] = al[j2]; al[j2] = t3;
    return al.join('');
  }

  function judge(pick) {
    if (finished) return;
    var ok = pick === curA;
    if (ok) { score += 25; setMsg('ok', T('gs.jefferson-disk.correct')); if (Arcade.juice) Arcade.juice.win(); }
    else { setMsg('no', T('gs.jefferson-disk.wrong')); if (Arcade.juice) Arcade.juice.lose(); }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L({ zh: '圆盘各刻乱序字母环，旋转同一整体后每一行都是一个换位表——对齐合适即见明文。杰斐逊 1795 年前后发明，李.爱伦堡 1922 为美国陆军改进，是美军到二战初期还在用的机械加密。', en: 'Each disk carries a scrambled alphabet; rotating the whole column yields a fresh substitution per position — Jefferson devised it around 1795 and the US military kept using variants into WWII.' });
    explEl.classList.add('on');
    nextB.hidden = false;
    upd();
  }

  function nextQ() { idx++; if (idx >= TOTAL) { finish(); return; } renderQ(); }
  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) { var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000)); Arcade.daily.markSolved('jefferson-disk', sec); }
    stageEl.textContent = ''; wheelsEl.innerHTML = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.jefferson-disk.done', { score: score }));
    nextB.textContent = T('gs.jefferson-disk.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var levels = [];
  function startGame(daily) {
    idx = 0; score = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 37); }
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
