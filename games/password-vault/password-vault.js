/* 破译 DECODE ARCADE · 口令保险库 —— 第十三期新游戏
   八道真实场景题：口令强度判定 + 存储方案选择。
   答对 +20。每日模式：日种子确定性出题顺序与选项排列。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.password-vault.tut1t'), d: T('gs.password-vault.tut1') },
  { t: T('gs.password-vault.tut2t'), d: T('gs.password-vault.tut2') },
  { t: T('gs.password-vault.tut3t'), d: T('gs.password-vault.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* 题库：tag=场景类型键；case 可选（强度题展示口令）；opts/a/expl 内联双语 */
  var BANK = [
    {
      tag: 'tagStrength', pw: '123456',
      q: { zh: '这是某年「最常见口令榜」第一名，判定其强度：', en: 'This topped the "most common passwords" list one year. Rate its strength:' },
      opts: [
        { zh: '弱——字典词，破解耗时不足一秒', en: 'Weak — a dictionary hit, cracked in under a second' },
        { zh: '中——纯数字有 100 万种组合', en: 'Medium — six digits give a million combos' },
        { zh: '强——没人猜得到', en: 'Strong — nobody would guess it' }
      ],
      a: 0,
      expl: { zh: '它常年占据泄露口令统计榜首：攻击者的字典第一行就是它，再长的暴力搜索都不需要。',
              en: 'It perennially tops breach statistics: the first line of every attacker\'s dictionary, no brute force needed.' }
    },
    {
      tag: 'tagStrength', pw: 'P@ssw0rd',
      q: { zh: '「带符号的词典词」，判定其强度：', en: 'A dictionary word with symbol swaps. Rate its strength:' },
      opts: [
        { zh: '强——包含大小写、数字和符号', en: 'Strong — upper case, digits and a symbol' },
        { zh: '弱——@→a、0→o 的替换是破解规则的默认项', en: 'Weak — @→a and 0→o swaps are default rules in cracking tools' },
        { zh: '中——8 位长度勉强及格', en: 'Medium — eight characters barely pass' }
      ],
      a: 1,
      expl: { zh: 'hashcat/john 等工具自带「leet 替换」规则集：password→P@ssw0rd 只是字典变换的一条规则，实际熵几乎没增加。',
              en: 'Cracking tools like hashcat ship leet-speak rule sets: password→P@ssw0rd is one dictionary transformation away — real entropy barely increased.' }
    },
    {
      tag: 'tagStrength', pw: 'correct-horse-battery-staple',
      q: { zh: '四个随机单词组成的长短语，判定其强度：', en: 'A long phrase of four random words. Rate its strength:' },
      opts: [
        { zh: '中——全是词典词，必被字典攻破', en: 'Medium — all dictionary words, doomed by a dictionary attack' },
        { zh: '强——熵随长度指数增长，约 45–52 比特且好记', en: 'Strong — entropy grows exponentially with length, ~45–52 bits and memorable' },
        { zh: '弱——没有符号和数字', en: 'Weak — no symbols or digits' }
      ],
      a: 1,
      expl: { zh: '随机选词时每个单词贡献约 10–13 比特熵；28 位长短语的搜索空间远超 8 位乱串。「长度是熵之王」——出自 XKCD 936 的经典科普。',
              en: 'Each randomly chosen word contributes roughly 10–13 bits of entropy; a 28-character phrase beats an 8-character gibberish string. Length is the king of entropy — the famous XKCD 936 lesson.' }
    },
    {
      tag: 'tagStrength', pw: 'Tr0ub4dor&3',
      q: { zh: '随机替换过的短口令，判定其强度：', en: 'A short password with random-looking substitutions. Rate its strength:' },
      opts: [
        { zh: '强——字符集覆盖四种类型', en: 'Strong — covers four character classes' },
        { zh: '弱——只有 11 位且模式可预测', en: 'Weak — only 11 characters with predictable patterns' },
        { zh: '中——比纯词典词强，但长度太短撑不起这个复杂度', en: 'Medium — better than plain dictionary words, but too short to cash in the complexity' }
      ],
      a: 2,
      expl: { zh: '同样的 XKCD 结论：插入符号和替换让记忆成本飙升、却只增加少量熵。11 位混合串约 40 比特，低于四词短语。',
              en: 'The same XKCD point: substitutions are hard to remember yet add little entropy. An 11-char mix sits around 40 bits — below the four-word phrase.' }
    },
    {
      tag: 'tagStorage',
      q: { zh: '你要为一家银行网站设计口令存储。以下哪个方案是对的？', en: 'You design password storage for a bank. Which scheme is right?' },
      opts: [
        { zh: 'AES 加密口令后存库，密钥放应用服务器', en: 'Encrypt passwords with AES, keep the key on the app server' },
        { zh: 'SHA-256 存哈希——够快够现代', en: 'Store SHA-256 hashes — fast and modern' },
        { zh: 'Argon2id（加盐、调高内存/时间参数）', en: 'Argon2id with salt, tuned memory/time parameters' }
      ],
      a: 2,
      expl: { zh: '可加密就能解密——密钥泄露即全灭；SHA-256 太快，GPU 每秒可算数十亿次。银行级答案是 Argon2/bcrypt 这类内存困难型慢 KDF，2015 年密码 hashing 竞赛（PHC）冠军即 Argon2。',
              en: 'Encryption can be decrypted — leak the key and everything falls; SHA-256 is far too fast, GPUs try billions per second. The bank-grade answer is a memory-hard slow KDF: Argon2 won the 2015 Password Hashing Competition.' }
    },
    {
      tag: 'tagStorage',
      q: { zh: '往口令哈希里加一撮「盐」（随机数据），主要防的是什么？', en: 'Adding a pinch of salt (random data) to each password hash primarily defeats what?' },
      opts: [
        { zh: '彩虹表——预计算的哈希对照表瞬间失效', en: 'Rainbow tables — precomputed hash tables become instantly useless' },
        { zh: '钓鱼邮件', en: 'Phishing emails' },
        { zh: '中间人窃听', en: 'Man-in-the-middle eavesdropping' }
      ],
      a: 0,
      expl: { zh: '彩虹表是「明文→哈希」的海量预计算表。盐让相同口令产生不同哈希，表就得为每个盐重新算——成本从查一次表变成重算全部。2012 年 LinkedIn 泄露正是无盐 SHA-1 才被快速破解。',
              en: 'Rainbow tables are massive precomputed plaintext→hash maps. Salting makes identical passwords hash differently, so tables must be recomputed per salt — lookup becomes full recalculation. LinkedIn\'s 2012 breach fell fast precisely because its SHA-1 was unsalted.' }
    },
    {
      tag: 'tagStorage',
      q: { zh: 'bcrypt/Argon2 故意把计算设计得很「慢」，原因是？', en: 'bcrypt/Argon2 are deliberately slow. Why?' },
      opts: [
        { zh: '节省服务器电量', en: 'To save server power' },
        { zh: '兼容老旧硬件', en: 'For compatibility with old hardware' },
        { zh: '登录一次只慢几十毫秒，而攻击者每秒十亿次的暴力破解被拖慢千万倍', en: 'One login costs tens of milliseconds, while the attacker\'s billion-per-second guesses grind down ten-million-fold' }
      ],
      a: 2,
      expl: { zh: 'KDF 的工作因子可调：合法用户感知不到，攻击者的离线穷举却被等比例放大成本——这是「用时间换安全」的定价策略。',
              en: 'KDF work factors are tunable: legitimate users barely notice, while offline brute-force cost scales up by the same factor — pricing security in time.' }
    },
    {
      tag: 'tagStorage',
      q: { zh: '口令不幸泄露后，开启的两步验证（2FA/TOTP）为什么仍能保住账户？', en: 'After a password leaks, why does two-factor auth (TOTP) still protect the account?' },
      opts: [
        { zh: '它会自动修改泄露的口令', en: 'It automatically changes the leaked password' },
        { zh: '攻击者还缺第二因子——你手机上每 30 秒轮换的验证码', en: 'The attacker still lacks the second factor — the 30-second rotating code on your phone' },
        { zh: '它把账户暂时冻结', en: 'It freezes the account temporarily' }
      ],
      a: 1,
      expl: { zh: 'TOTP 验证码由共享密钥+当前时间片生成、30 秒一轮换。口令是「你知道的」，验证码是「你持有的」——两把锁不同类，偷走一把开不了门。',
              en: 'TOTP codes derive from a shared secret plus the current time slice, rotating every 30 seconds. A password is something you know; the code is something you hold — two different lock classes, and stealing one opens nothing.' }
    }
  ];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'pv-wrap';
  wrap.innerHTML =
    '<div class="pv-prog" id="pv-prog"></div>' +
    '<div class="pv-tag" id="pv-tag"></div>' +
    '<div class="pv-case" id="pv-case" hidden></div>' +
    '<div class="pv-q" id="pv-q"></div>' +
    '<div class="pv-btns" id="pv-opts"></div>' +
    '<div class="pv-msg" id="pv-msg"></div>' +
    '<div class="pv-expl" id="pv-expl"></div>' +
    '<div class="pv-btns"><button class="btn green" id="pv-next" hidden></button></div>' +
    '<div class="pv-btns"><button class="btn" id="pv-daily">' + T('gs.password-vault.dailyBtn') + '</button></div>' +
    '<div class="pv-help">' + T('gs.password-vault.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('pv-prog'), tagEl = $('pv-tag'), caseEl = $('pv-case'),
      qEl = $('pv-q'), optsEl = $('pv-opts'), msgEl = $('pv-msg'),
      explEl = $('pv-expl'), nextB = $('pv-next'), dailyBtn = $('pv-daily');

  var idx = 0, score = 0, answered = false, finished = false,
      curQ = null, curOpts = [], curA = 0, order = [],
      dailyMode = false, startTs = 0;

  function upd() {
    progEl.textContent = fmt('gs.password-vault.prog', { n: Math.min(idx + 1, order.length), total: order.length, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'pv-msg ' + c; msgEl.textContent = t; }

  function renderQ() {
    curQ = BANK[order[idx]];
    tagEl.textContent = T('gs.password-vault.' + curQ.tag);
    if (curQ.pw) {
      caseEl.hidden = false;
      caseEl.innerHTML = '<span class="pw">' + curQ.pw.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
    } else {
      caseEl.hidden = true;
      caseEl.textContent = '';
    }
    qEl.textContent = L(curQ.q);
    /* 打乱选项 */
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
    msgEl.className = 'pv-msg'; msgEl.textContent = '';
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
      score += 20;
      setMsg('ok', T('gs.password-vault.correct'));
      if (Arcade.juice) Arcade.juice.win();
    } else {
      setMsg('no', T('gs.password-vault.wrong'));
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
    if (idx >= order.length) { finish(); return; }
    renderQ();
  }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('password-vault', sec);
    }
    tagEl.textContent = ''; caseEl.hidden = true; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.password-vault.done', { score: score }));
    nextB.textContent = T('gs.password-vault.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var rnd = Math.random;
  function startGame(daily) {
    idx = 0; score = 0; answered = false; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 11); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    order = [];
    for (var i = 0; i < BANK.length; i++) order.push(i);
    for (i = order.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t2 = order[i]; order[i] = order[j]; order[j] = t2;
    }
    setMsg('', '');
    renderQ();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
