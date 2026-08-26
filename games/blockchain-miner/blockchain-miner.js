/* 破译 DECODE ARCADE · 区块链矿工 —— 第十三期新游戏
   真实挖矿交互（nonce 试错找哈希前缀，难度 0→00）+ 六道共识机制题。
   每步 +25。每日模式：日种子决定区块数据。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.blockchain-miner.tut1t'), d: T('gs.blockchain-miner.tut1') },
  { t: T('gs.blockchain-miner.tut2t'), d: T('gs.blockchain-miner.tut2') },
  { t: T('gs.blockchain-miner.tut3t'), d: T('gs.blockchain-miner.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 8;

  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* 教学哈希：djb2 变体，8 位十六进制（与协议实验室同款） */
  function H(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((((h << 5) + h) >>> 0) + str.charCodeAt(i)) >>> 0;
    return ('00000000' + h.toString(16)).slice(-8);
  }

  /* 六道共识题（内联双语） */
  var QUIZ = [
    {
      q: { zh: '你刚才每改一位 nonce，输出的哈希就面目全非。这体现了哈希的什么性质？', en: 'Every nonce tweak produced a totally different hash. Which hash property is this?' },
      opts: [
        { zh: '雪崩效应——输入变一比特，输出约一半比特翻转', en: 'Avalanche effect — one input bit flips about half the output bits', },
        { zh: '可交换性', en: 'Commutativity' },
        { zh: '单调递增', en: 'Monotonic increase' }
      ],
      a: 0,
      expl: { zh: '雪崩效应让「猜 nonce」变成无规律可循的抽奖——除了老老实实一次次算，没有任何捷径能预判结果。',
              en: 'Avalanche makes nonce-guessing a pure lottery: there is no shortcut that predicts a result — you can only grind through hashes.' }
    },
    {
      q: { zh: '第二关难度从 1 个前导零升到 2 个。平均尝试次数变成了几倍？', en: 'Difficulty went from one leading zero to two. Average tries multiplied by?' },
      opts: ['2', '16', '256'],
      a: 1,
      expl: { zh: '每个十六进制零贡献 1/16 概率：难度 N 平均要试 16^N 次。比特币全网难度相当于约 19 个零——这就是 ASIC 矿场存在的原因。',
              en: 'Each hex zero adds a factor of 16: difficulty N needs ~16^N tries on average. Bitcoin\'s network difficulty equals roughly nineteen zeros — hence dedicated ASIC farms.' }
    },
    {
      q: { zh: '块头里的 Merkle 根有什么用？', en: 'What does the Merkle root in the block header do?' },
      opts: [
        { zh: '把成百上千笔交易压缩成一个哈希——动任何一笔交易都会改变根值', en: 'Compresses thousands of transactions into one hash — touching any transaction changes the root' },
        { zh: '加密交易内容保护隐私', en: 'Encrypts transactions for privacy' },
        { zh: '存储下一区块的地址', en: 'Stores the next block\'s address' }
      ],
      a: 0,
      expl: { zh: 'Merkle 树两两哈希直到只剩一个根。验证某笔交易只需 log(N) 个中间哈希（SPV 轻节点原理），而篡改任意一笔都必然改变根、进而要求重新挖矿。',
              en: 'The Merkle tree pairwise-hashes down to one root. Proving one transaction needs only log(N) sibling hashes (how SPV light nodes work); tampering with any of them changes the root and forces re-mining.' }
    },
    {
      q: { zh: '为什么说改写历史区块「几乎不可能」？', en: 'Why is rewriting a historical block "practically impossible"?' },
      opts: [
        { zh: '历史区块有密码学加密保护', en: 'Historical blocks are encrypted' },
        { zh: '改一个块就改变其哈希，后续所有块的 prev-hash 全部失配，必须重挖其后整条链并追平全网', en: 'Changing one block changes its hash, invalidating every later block — you must re-mind the whole tail faster than the entire network' },
        { zh: '因为没人记得住旧数据', en: 'Because nobody remembers old data' }
      ],
      a: 1,
      expl: { zh: '每个块头都含上一块的哈希，环环相扣。篡改者的算力必须超过其余所有人的总和才能让伪造链追平主链——这正是「51%」的由来。',
              en: 'Each header embeds the previous hash, chaining them together. A rewriter needs more hashpower than everyone else combined to outrun the honest chain — the origin of the term "51% attack".' }
    },
    {
      q: { zh: '如果某个组织掌握了全网 51% 的算力，它能做什么？', en: 'If one party controls 51% of total hashpower, what can they do?' },
      opts: [
        { zh: '修改所有人的钱包余额任意取款', en: 'Edit anyone\'s wallet balance at will' },
        { zh: '重组最近的区块实现「双花」，但不能凭空造币或改别人的私钥签名', en: 'Re-organize recent blocks to double-spend — but cannot mint coins or forge others\' signatures' },
        { zh: '关闭整个网络', en: 'Shut down the whole network' }
      ],
      a: 1,
      expl: { zh: '多数算力可以让自己私藏的链后来居上，撤销近期交易实现双花；但花别人钱的交易仍需其私钥签名，算力再大也造不出有效签名。2018 年 ETC 与 BTG 都真实遭遇过此攻击。',
              en: 'Majority hashpower lets a hidden chain overtake the public one, reversing recent spends (double-spend); but spending others\' funds still needs their private keys — no hashrate forges signatures. ETC and BTG both suffered real 51% attacks in 2018.' }
    },
    {
      q: { zh: '出块奖励（新铸币+手续费）在系统里扮演什么角色？', en: 'What role does the block reward (new coins + fees) play?' },
      opts: [
        { zh: '纯装饰，没有实际功能', en: 'Pure decoration, no real function' },
        { zh: '激励矿工投入算力——用经济动机购买整个网络的安全性', en: 'It pays miners for hashpower — buying the network\'s security with economic incentives' },
        { zh: '用于支付电费账单', en: 'To pay electricity bills' }
      ],
      a: 1,
      expl: { zh: '中本聪最天才的设计不是技术而是博弈：奖励把「维护诚实」变成最有利可图的选择。攻击网络的成本因此水涨船高——安全不再靠锁，而靠利益。',
              en: 'Satoshi\'s most brilliant move was game-theoretic, not technical: rewards make honesty the most profitable strategy, so attacking the network costs more than defending it — security by incentive, not by lock.' }
    }
  ];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'bm-wrap';
  wrap.innerHTML =
    '<div class="bm-prog" id="bm-prog"></div>' +
    '<div class="bm-stage" id="bm-stage"></div>' +
    '<div class="bm-block" id="bm-block" hidden></div>' +
    '<div class="bm-hash" id="bm-hash"></div>' +
    '<div class="bm-tries" id="bm-tries"></div>' +
    '<div class="bm-btns" id="bm-minebtns">' +
    '  <button class="btn yellow" id="bm-hash">' + T('gs.blockchain-miner.hashBtn') + '</button>' +
    '  <button class="btn pink" id="bm-auto">' + T('gs.blockchain-miner.autoBtn') + '</button>' +
    '</div>' +
    '<div class="bm-q" id="bm-q"></div>' +
    '<div class="bm-btns" id="bm-opts"></div>' +
    '<div class="bm-msg" id="bm-msg"></div>' +
    '<div class="bm-expl" id="bm-expl"></div>' +
    '<div class="bm-btns"><button class="btn green" id="bm-next" hidden></button></div>' +
    '<div class="bm-btns"><button class="btn" id="bm-daily">' + T('gs.blockchain-miner.dailyBtn') + '</button></div>' +
    '<div class="bm-help">' + T('gs.blockchain-miner.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('bm-prog'), stageEl = $('bm-stage'), blockEl = $('bm-block'),
      hashEl = $('bm-hash'), triesEl = $('bm-tries'), mineBtns = $('bm-minebtns'),
      hashB = $('bm-hash'), autoB = $('bm-auto'), qEl = $('bm-q'),
      optsEl = $('bm-opts'), msgEl = $('bm-msg'), explEl = $('bm-expl'),
      nextB = $('bm-next'), dailyBtn = $('bm-daily');

  /* 步骤序列：mine(0) q q q mine(1) q q q */
  var SEQ = ['m', 'q', 'q', 'q', 'm', 'q', 'q', 'q'];
  var DIFF = ['0', '00'];
  var QORDER = [[0, 1, 2], [3, 4, 5]];

  var idx = 0, score = 0, finished = false,
      dailyMode = false, startTs = 0,
      headerBase = '', nonce = 0, tries = 0, mined = false,
      curQ = null, curOpts = [], curA = 0, answered = false,
      autoTimer = null, rnd = Math.random;

  function upd() {
    progEl.textContent = fmt('gs.blockchain-miner.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'bm-msg ' + c; msgEl.textContent = t; }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  /* ---------- 挖矿步 ---------- */
  function renderMine(mi) {
    var pfx = DIFF[mi];
    mined = false; tries = 0;
    stageEl.textContent = fmt('gs.blockchain-miner.mineTarget', { pfx: pfx });
    blockEl.hidden = false;
    blockEl.textContent = 'header: ' + headerBase[mi];
    hashEl.className = 'bm-hash'; hashEl.textContent = '—';
    triesEl.textContent = '';
    qEl.textContent = ''; optsEl.innerHTML = '';
    explEl.classList.remove('on'); explEl.textContent = '';
    mineBtns.style.display = 'flex';
    nextB.hidden = true;
    upd();

    function tryHash() {
      if (mined || finished) return true;
      tries++;
      var h = H(headerBase[mi] + '|' + nonce);
      nonce++;
      hashEl.textContent = h;
      if (h.indexOf(pfx) === 0) {
        mined = true;
        stopAuto();
        score += 25;
        hashEl.className = 'bm-hash hit';
        triesEl.textContent = fmt('gs.blockchain-miner.tries', { n: tries, v: nonce });
        setMsg('ok', fmt('gs.blockchain-miner.found', { n: tries }));
        if (Arcade.juice) Arcade.juice.win();
        nextB.hidden = false;
        nextB.onclick = nextQ;
        upd();
        return true;
      }
      triesEl.textContent = fmt('gs.blockchain-miner.tries', { n: tries, v: nonce });
      return false;
    }

    hashB.onclick = tryHash;
    autoB.onclick = function () {
      if (autoTimer || mined || finished) return;
      autoTimer = setInterval(function () {
        for (var k = 0; k < 3; k++) { if (tryHash()) break; }
      }, 30);
    };
  }

  /* ---------- 问答题 ---------- */
  function renderQuiz(qi) {
    curQ = QUIZ[qi];
    answered = false;
    stageEl.textContent = L({ zh: '🧠 共识机制问答', en: '🧠 Consensus quiz' });
    blockEl.hidden = true; hashEl.textContent = ''; triesEl.textContent = '';
    mineBtns.style.display = 'none';
    qEl.textContent = L(curQ.q);
    curOpts = curQ.opts.slice();
    curA = 0;
    for (var i = curOpts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = curOpts[i]; curOpts[i] = curOpts[j]; curOpts[j] = tmp;
    }
    optsEl.innerHTML = '';
    curOpts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.style.fontSize = '12px';
      b.textContent = L(o);
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'bm-msg'; msgEl.textContent = '';
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
      setMsg('ok', T('gs.blockchain-miner.correct'));
      if (Arcade.juice) Arcade.juice.win();
    } else {
      setMsg('no', T('gs.blockchain-miner.wrong'));
      if (Arcade.juice) Arcade.juice.lose();
    }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    explEl.textContent = '📌 ' + L(curQ.expl);
    explEl.classList.add('on');
    nextB.hidden = false;
  }

  function nextQ() {
    idx++; answered = false;
    if (idx >= TOTAL) { finish(); return; }
    renderStep();
  }

  function renderStep() {
    if (SEQ[idx] === 'm') renderMine(idx === 0 ? 0 : 1);
    else renderQuiz(QORDER[idx < 4 ? 0 : 1][idx === 1 || idx === 5 ? 0 : (idx === 2 || idx === 6 ? 1 : 2)]);
  }

  function finish() {
    finished = true;
    stopAuto();
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('blockchain-miner', sec);
    }
    stageEl.textContent = ''; blockEl.hidden = true; hashEl.textContent = '';
    triesEl.textContent = ''; mineBtns.style.display = 'none'; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.blockchain-miner.done', { score: score }));
    nextB.textContent = T('gs.blockchain-miner.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx = 0; score = 0; answered = false; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 41); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    stopAuto();
    /* 日种子生成区块头基础串 */
    headerBase = [
      'prev=000000' + Math.floor(rnd() * 0xfffff).toString(16) + '|tx=Alice->Bob:' + Math.floor(rnd() * 900 + 100) + 'BTC',
      'prev=' + H(String(Math.floor(rnd() * 1e9))) + '|tx=Carol->Dave:' + Math.floor(rnd() * 900 + 100) + 'BTC'
    ];
    nonce = Math.floor(rnd() * 100000);
    setMsg('', '');
    renderStep();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
