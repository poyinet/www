/* 破译 DECODE ARCADE · 藏头诗密信 —— 第八期 #17 新游戏
   中文取每行首字、英文取每行首字母，连读成密词；四选一并高亮首字验证。
   5 题一局。计分 max：首答 +20 + 连击加成。支持每日模式。诗作均为原创。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.acrostic.tut1t'), d: T('gs.acrostic.tut1') },
  { t: T('gs.acrostic.tut2t'), d: T('gs.acrostic.tut2') },
  { t: T('gs.acrostic.tut3t'), d: T('gs.acrostic.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 5;

  /* 原创藏头诗库：zh 行首字 / en 行首字母 连读 = word */
  var POEMS_ZH = [
    { word: '破译万岁', lines: ['破晓行舟雾未开', '译尽残碑字字来', '万里星霜凭尺素', '岁华不改旧心怀'] },
    { word: '凯撒密码', lines: ['凯风南来拂战旗', '撒手千金买健儿', '密呈军书封蜡印', '码重千钧不敢迟'] },
    { word: '恩尼格玛', lines: ['恩泽深藏乱世中', '尼姑庵外柳摇风', '格栅小径通幽处', '玛瑙阶前忆故人'] },
    { word: '紫气东来', lines: ['紫电青霜指旧都', '气吞万里扫烟芜', '东风再借烧曹舰', '来日樽前说霸图'] },
    { word: '一生平安', lines: ['一别经年音信遥', '生死茫茫两寂寥', '平戎未有安邦策', '安得锦书渡碧霄'] },
    { word: '香江才女', lines: ['香雾云鬟映月凉', '江南可采旧时光', '才子佳人皆入画', '女儿心事付流觞'] },
    { word: '中国人民', lines: ['中原逐鹿几春秋', '国破山河誓不休', '人民百万齐挥手', '民心所向是神州'] },
    { word: '密码之约', lines: ['密雨斜侵旧驿墙', '码头灯火夜微茫', '之江水送千帆远', '约在春风第几桥'] }
  ];
  var POEMS_EN = [
    { word: 'CIPHER', lines: ['Cold winds carry whispers through the pines', 'In every shadow a secret shines', 'Parchment burned yet meaning survives', 'Hidden deep where the river dives', 'Echoes call from ancient shrines', 'Reading what no one else divines'] },
    { word: 'SECRET', lines: ['Sentinels watch the silent hall', 'Every wall has heard it all', 'Candles gutter, shadows crawl', 'Runes await the final call', 'Evil plans will rise and fall', 'Truth outlasts them all'] },
    { word: 'ENIGMA', lines: ['Embers glow in the machine', 'Night shifts keep the rotors clean', 'In the hut the lamplight keen', 'Ghosts of messages unseen', 'Morse at midnight, sharp and mean', 'At dawn the seas turn green'] },
    { word: 'VENONA', lines: ['Valley deep and mountain high', 'Enemies pass the message by', 'Nobody reads the numbers fly', 'Only patience can untie', 'Nods of chance where secrets lie', 'After war the truth runs dry'] },
    { word: 'QUANTUM', lines: ['Quiet labs where lasers gleam', 'Unbroken codes were once their dream', 'A new lock built on lattice scheme', 'Nature guards the quantum seam', 'The future runs on photon beam'] }
  ];

  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
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

  var wrap = document.createElement('div');
  wrap.className = 'ac-wrap';
  wrap.innerHTML =
    '<div class="ac-prog" id="ac-prog"></div>' +
    '<div class="ac-q" id="ac-q"></div>' +
    '<div class="ac-poem" id="ac-poem"></div>' +
    '<div class="ac-btns" id="ac-opts"></div>' +
    '<div class="ac-msg" id="ac-msg"></div>' +
    '<div class="ac-btnrow"><button class="btn yellow" id="ac-next" hidden></button></div>' +
    '<div class="ac-btnrow"><button class="btn" id="ac-daily"></button></div>' +
    '<div class="ac-help">' + T('gs.acrostic.helpText') + '</div>';
  root.appendChild(wrap);
  var el = function (id) { return wrap.querySelector('#' + id); };
  var progEl = el('ac-prog'), qEl = el('ac-q'), poemEl = el('ac-poem'),
      optsEl = el('ac-opts'), msgEl = el('ac-msg'), nextBtn = el('ac-next'),
      dailyBtn = el('ac-daily');
  nextBtn.textContent = T('gs.acrostic.againBtn');
  dailyBtn.textContent = T('gs.acrostic.dailyBtn');

  var idx = 0, score = 0, streak = 0, answered = false, finished = false,
      dailyMode = false, startTs = 0, cur = null;

  function updProg() {
    progEl.textContent = fmt('gs.acrostic.qText', { n: Math.min(idx + 1, TOTAL), total: TOTAL });
  }
  function setMsg(cls, txt) { msgEl.className = 'ac-msg ' + cls; msgEl.textContent = txt; }

  function renderPoem(lines, reveal) {
    poemEl.classList.toggle('show', !!reveal);
    var h = '';
    for (var i = 0; i < lines.length; i++) {
      var head = isEn() ? lines[i].charAt(0) : lines[i].charAt(0);
      var rest = lines[i].slice(1);
      h += '<div class="ac-line"><b>' + head + '</b>' + rest + '</div>';
    }
    poemEl.innerHTML = h;
  }
  function newQuestion(rnd) {
    var pool = isEn() ? POEMS_EN : POEMS_ZH;
    cur = pool[Math.floor(rnd() * pool.length)];
    var words = pool.map(function (p) { return p.word; });
    var distractors = [];
    while (distractors.length < 3) {
      var cand = words[Math.floor(rnd() * words.length)];
      if (cand !== cur.word && distractors.indexOf(cand) < 0) distractors.push(cand);
    }
    var opts = [{ t: cur.word, ok: true }, { t: distractors[0], ok: false },
                { t: distractors[1], ok: false }, { t: distractors[2], ok: false }];
    for (var i = opts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t2 = opts[i]; opts[i] = opts[j]; opts[j] = t2;
    }
    answered = false;
    setMsg('', '');
    renderPoem(cur.lines, false);
    optsEl.innerHTML = '';
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = o.t;
      b.addEventListener('click', function () {
        if (answered || finished) return;
        if (o.ok) {
          answered = true;
          if (firstTryOfQ) { streak++; score += 20 + (streak - 1) * 5; } else { score += 10; }
          if (Arcade.juice) Arcade.juice.win();
          setMsg('ok', fmt('gs.acrostic.ok', { pts: '+' + (firstTryOfQ ? 20 + (streak - 1) * 5 : 10) }));
          renderPoem(cur.lines, true);
          setTimeout(nextQ, 1100);
        } else {
          firstTryOfQ = false;
          streak = 0;
          if (Arcade.juice) Arcade.juice.lose();
          setMsg('no', T('gs.acrostic.retry'));
        }
      });
      optsEl.appendChild(b);
    });
  }
  var firstTryOfQ = true;
  function nextQ() {
    idx++;
    firstTryOfQ = true;
    if (idx >= TOTAL) {
      finished = true;
      if (Arcade.shell) Arcade.shell.submitScore(score);
      if (dailyMode && Arcade.daily) {
        var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
        Arcade.daily.markSolved('acrostic', sec);
      }
      setMsg('ok', fmt('gs.acrostic.done', { score: score }));
      nextBtn.hidden = false;
      dailyBtn.hidden = false;
      updProg();
      return;
    }
    startQuestion();
  }
  function startQuestion() {
    updProg();
    nextBtn.hidden = true;
    dailyBtn.hidden = !!dailyMode;
    newQuestion(dailyMode ? mulberry(daySeed() * 31 + idx * 7) : mulberry(Math.floor(Math.random() * 2147483000) + 1));
  }
  function startGame(daily) {
    idx = 0; score = 0; streak = 0; finished = false;
    firstTryOfQ = true;
    dailyMode = !!daily;
    if (dailyMode) startTs = Date.now();
    nextQ();
  }
  nextBtn.addEventListener('click', function () { startGame(false); });
  dailyBtn.addEventListener('click', function () { startGame(true); });

  window.GAME_RESTART = function () { startGame(false); };

  startGame(false);
})();
