/* 破译 DECODE ARCADE · 零知识洞穴 —— 第十三期新游戏
   Ali Baba 洞穴三轮交互证明（选边→验证者随机喊出口→总能走出）
   + 五道零知识问答。每步 +25。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.zkp-cave.tut1t'), d: T('gs.zkp-cave.tut1') },
  { t: T('gs.zkp-cave.tut2t'), d: T('gs.zkp-cave.tut2') },
  { t: T('gs.zkp-cave.tut3t'), d: T('gs.zkp-cave.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 8;

  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* 五道问答（内联双语） */
  var QUIZ = [
    {
      q: { zh: '零知识证明必须同时满足哪三条性质？', en: 'Which three properties must a zero-knowledge proof satisfy?' },
      opts: [
        { zh: '完备性、可靠性、零知识性', en: 'Completeness, soundness, zero-knowledge' },
        { zh: '机密性、完整性、可用性', en: 'Confidentiality, integrity, availability' },
        { zh: '加密、签名、哈希', en: 'Encryption, signature, hashing' }
      ],
      a: 0,
      expl: { zh: '完备：真的假不了；可靠：假的真不了（除非运气）；零知识：验证者除「命题为真」外一无所获。三者的平衡由轮数与模拟器技术调校。',
              en: 'Complete: truth convinces; sound: lies fail (barring luck); zero-knowledge: the verifier learns nothing beyond the claim. Rounds and simulator techniques balance the three.' }
    },
    {
      q: { zh: '不知道咒语的骗子想连续通过你刚才的 3 轮，概率是多少？', en: "What's the chance a cheater without the word passes all 3 rounds you just played?" },
      opts: ['1/2', '1/8', '1/64'],
      a: 1,
      expl: { zh: '(1/2)^3 = 1/8。每加一轮概率减半——20 轮后约百万分之一。安全性与轮数线性挂钩、成本却极低，这正是交互式证明的美感。',
              en: '(1/2)^3 = 1/8. Each round halves it — after twenty rounds about one in a million. Security scales linearly with rounds at negligible cost: the beauty of interactive proofs.' }
    },
    {
      q: { zh: '洞穴里「咒语」对应真实数学中的什么？', en: 'In real math, what does the cave\'s magic word correspond to?' },
      opts: [
        { zh: '一个难解问题的解（如离散对数的 x）', en: 'A solution to a hard problem (e.g. x in a discrete log)' },
        { zh: '一把对称密钥', en: 'A symmetric key' },
        { zh: '验证者的私钥', en: "The verifier's private key" }
      ],
      a: 0,
      expl: { zh: 'Schnorr 协议里你知道 x 使得 g^x=h；每轮随机 r 出示 g^r，被质询后给出 r+cx——能应答即证明知道 x，而 h 与 g^r 都不泄露 x 的丝毫。',
              en: 'In Schnorr you know x with g^x=h; each round you commit g^r for random r and answer the challenge with r+cx — answering proves knowledge of x while revealing nothing about it.' }
    },
    {
      q: { zh: '非交互式零知识（NIZK，如区块链里的 zk-SNARK）靠什么取代「验证者现场喊话」？', en: 'What replaces the verifier\'s live challenges in non-interactive ZK (zk-SNARKs)?' },
      opts: [
        { zh: '把挑战换成对要证明内容的哈希（Fiat-Shamir 启发式）', en: 'The challenge becomes a hash of the commitment (Fiat-Shamir heuristic)' },
        { zh: '直接公开咒语', en: 'Simply publishing the magic word' },
        { zh: '让验证者提前写好所有问题装进信封', en: 'The verifier pre-seals all questions in envelopes' }
      ],
      a: 0,
      expl: { zh: 'Fiat-Shamir 把交互「压扁」成单次发布：证明者自己对承诺做哈希当挑战——因为哈希不可预知，作弊者无法为假承诺挑到有利挑战。SNARK 让以太坊rollup得以把千笔交易压缩成一个几十字节的可验证证明。',
              en: 'Fiat-Shamir flattens interaction: the prover hashes the commitment into its own challenge — unpredictable, so cheaters cannot pick favorable ones. SNARKs let Ethereum rollups compress thousands of transactions into one tiny proof.' }
    },
    {
      q: { zh: '你在洞穴里每次「用咒语开门」，向验证者泄露了什么？', en: 'Each time you used the word at the door, what did the verifier learn?' },
      opts: [
        { zh: '咒语的第一个字母', en: 'The first letter of the word' },
        { zh: '门的位置和朝向', en: 'The door\'s location' },
        { zh: '什么都没有——只确认了「你能开门」这一事实', en: 'Nothing — only that you can open it' }
      ],
      a: 2,
      expl: { zh: '这就是「零知识」的本义：整个交互可被一台不认识你的计算机完美模拟出来——既然模拟得出，真实过程就不含任何额外信息。Goldwasser 与 Micali 因此拿下图灵奖。',
              en: 'That is the point of zero-knowledge: a simulator could reproduce the whole transcript without ever knowing the word — so the transcript carries no extractable secret. Goldwasser and Micali won the Turing Award for this.' }
    }
  ];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'zk-wrap';
  wrap.innerHTML =
    '<div class="zk-prog" id="zk-prog"></div>' +
    '<div class="zk-stage" id="zk-stage"></div>' +
    '<div class="zk-cave" id="zk-cave"></div>' +
    '<div class="zk-btns" id="zk-sidebtns"></div>' +
    '<div class="zk-q" id="zk-q"></div>' +
    '<div class="zk-btns" id="zk-opts"></div>' +
    '<div class="zk-msg" id="zk-msg"></div>' +
    '<div class="zk-expl" id="zk-expl"></div>' +
    '<div class="zk-btns"><button class="btn green" id="zk-next" hidden></button></div>' +
    '<div class="zk-btns"><button class="btn" id="zk-daily">' + T('gs.zkp-cave.dailyBtn') + '</button></div>' +
    '<div class="zk-help">' + T('gs.zkp-cave.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('zk-prog'), stageEl = $('zk-stage'), caveEl = $('zk-cave'),
      sideBtns = $('zk-sidebtns'), qEl = $('zk-q'), optsEl = $('zk-opts'),
      msgEl = $('zk-msg'), explEl = $('zk-expl'), nextB = $('zk-next'),
      dailyBtn = $('zk-daily');

  /* 步骤序列：cave c c c quiz q q q q → idx0-2 洞穴，idx3-7 问答 */
  var QIDX = [0, 1, 2, 3, 4];

  var idx = 0, score = 0, answered = false, finished = false,
      enteredSide = null, demandSide = null, emergedThisRound = false,
      curQ = null, curOpts = [], curA = 0,
      dailyMode = false, startTs = 0, rnd = Math.random;

  function upd() {
    progEl.textContent = fmt('gs.zkp-cave.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'zk-msg ' + c; msgEl.textContent = t; }

  /* ---------- 洞穴步 ---------- */
  function renderCave(roundNo) {
    enteredSide = null; demandSide = null; emergedThisRound = false;
    stageEl.textContent = fmt('gs.zkp-cave.enterLbl', { n: roundNo });
    caveEl.innerHTML =
      '🕳️ 洞穴入口<br>' +
      '&nbsp;&nbsp;├── 🌀 L 路<br>' +
      '&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── [🚪 咒语门]<br>' +
      '&nbsp;&nbsp;└── 🔶 R 路';
    sideBtns.style.display = 'flex';
    qEl.textContent = ''; optsEl.innerHTML = '';
    msgEl.className = 'zk-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    upd();

    sideBtns.innerHTML = '';
    [['L', T('gs.zkp-cave.left')], ['R', T('gs.zkp-cave.right')]].forEach(function (pair) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.textContent = pair[1];
      b.addEventListener('click', function () { enter(pair[0], roundNo); });
      sideBtns.appendChild(b);
    });
  }

  function enter(side, roundNo) {
    if (enteredSide) return;
    enteredSide = side;
    /* 验证者随机喊出口（日/普通均用 rnd） */
    demandSide = rnd() < 0.5 ? 'L' : 'R';
    stageEl.textContent = fmt('gs.zkp-cave.demand', { side: T(demandSide === 'L' ? 'gs.zkp-cave.sideL' : 'gs.zkp-cave.sideR') });
    sideBtns.innerHTML = '';
    /* 你知道咒语：任何出口都能满足 */
    var btn = document.createElement('button');
    btn.className = 'btn green';
    btn.textContent = enteredSide === demandSide
      ? T('gs.zkp-cave.walkBtn')
      : T('gs.zkp-cave.magicBtn');
    btn.addEventListener('click', function () { emerge(); });
    sideBtns.appendChild(btn);
  }

  function emerge() {
    if (!enteredSide || finished || emergedThisRound) return;
    emergedThisRound = true;
    score += 25;
    setMsg('ok', T('gs.zkp-cave.roundOk'));
    if (Arcade.juice) Arcade.juice.win();
    caveEl.innerHTML = caveEl.innerHTML.replace('[🚪 咒语门]', '✨[已开启]✨');
    nextB.hidden = false;
    upd();
  }

  /* ---------- 问答 ---------- */
  function renderQuiz(qi) {
    curQ = QUIZ[qi];
    answered = false;
    stageEl.textContent = L({ zh: '🧠 零知识问答', en: '🧠 Zero-knowledge quiz' });
    caveEl.textContent = ''; sideBtns.style.display = 'none'; sideBtns.innerHTML = '';
    qEl.textContent = L(curQ.q);
    curOpts = curQ.opts.slice();
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
      b.style.fontSize = '12px';
      b.textContent = L(o);
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'zk-msg'; msgEl.textContent = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  function judge(pick) {
    if (answered || finished) return;
    answered = true;
    var ok = pick === curA;
    if (ok) {
      score += 25;
      setMsg('ok', T('gs.zkp-cave.correct'));
      if (Arcade.juice) Arcade.juice.win();
    } else {
      setMsg('no', T('gs.zkp-cave.wrong'));
      if (Arcade.juice) Arcade.juice.lose();
    }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L(curQ.expl);
    explEl.classList.add('on');
    nextB.hidden = false;
  }

  function nextQ() {
    idx++;
    if (idx >= TOTAL) { finish(); return; }
    renderStep();
  }

  function renderStep() {
    if (idx < 3) renderCave(idx + 1);
    else renderQuiz(QIDX[idx - 3]);
  }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('zkp-cave', sec);
    }
    stageEl.textContent = ''; caveEl.textContent = ''; qEl.textContent = '';
    sideBtns.style.display = 'none'; sideBtns.innerHTML = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.zkp-cave.done', { score: score }));
    nextB.textContent = T('gs.zkp-cave.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx = 0; score = 0; answered = false; finished = false; enteredSide = null;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 71); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    setMsg('', '');
    renderStep();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
