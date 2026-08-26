/* 破译 DECODE ARCADE · PGP 加密邮件 —— 第十三期新游戏
   八步走完 PGP 真实工作流：会话密钥→对称加密→公钥封装→签名→信任网。
   每步一道选择题，答对 +25。每日模式：日种子确定性出题。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.pgp-mail.tut1t'), d: T('gs.pgp-mail.tut1') },
  { t: T('gs.pgp-mail.tut2t'), d: T('gs.pgp-mail.tut2') },
  { t: T('gs.pgp-mail.tut3t'), d: T('gs.pgp-mail.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* 八步流程题（内联双语，pqc-match 模式） */
  var STEPS = [
    {
      stage: { zh: 'STEP 1 · 准备', en: 'STEP 1 · Setup' },
      q: { zh: '你要给 Alice 寄一封机密邮件。第一步需要什么？', en: 'You are emailing Alice confidentially. What do you need first?' },
      opts: [
        { zh: 'Alice 的公钥（她已公开发布）', en: "Alice's public key (she published it openly)" },
        { zh: 'Alice 的邮箱密码', en: "Alice's email password" },
        { zh: '与 Alice 当面约定的暗号', en: 'A secret phrase agreed with Alice in person' }
      ],
      a: 0,
      expl: { zh: '公钥密码的优雅之处：发件人只需要对方公开的那把锁，不需要任何事先共享的秘密——这正是 1976 年 Diffie-Hellman 论文《密码学的新方向》许诺的世界。',
              en: 'The elegance of public-key crypto: the sender needs only the recipient\'s published lock, no pre-shared secret — exactly what Diffie and Hellman promised in their 1976 "New Directions" paper.' }
    },
    {
      stage: { zh: 'STEP 2 · 会话密钥', en: 'STEP 2 · Session key' },
      q: { zh: 'PGP 为这封邮件生成一把一次性的会话密钥。它应该是什么？', en: 'PGP generates a one-time session key for this message. What should it be?' },
      opts: [
        { zh: '你的生日倒序——方便记忆', en: 'Your birthday reversed — easy to remember' },
        { zh: '密码学安全的随机数（如 /dev/random）', en: 'A cryptographically secure random value (e.g. from /dev/random)' },
        { zh: '固定常量，便于收件人验证', en: 'A fixed constant so the recipient can verify' }
      ],
      a: 1,
      expl: { zh: '会话密钥是整封信真正的钥匙，必须不可预测。1995 年 Netscape SSL 的随机数缺陷（用时间当种子）正是被两位研究生实锤攻破的。',
              en: 'The session key is the real key to the letter and must be unpredictable. Netscape\'s 1995 SSL fell precisely because its randomness was seeded by the clock — two grad students broke it.' }
    },
    {
      stage: { zh: 'STEP 3 · 加密正文', en: 'STEP 3 · Encrypt body' },
      q: { zh: '邮件正文有 2MB。用哪种算法加密正文本身？', en: 'The body is 2 MB. Which cipher encrypts the body itself?' },
      opts: [
        { zh: 'RSA 公钥算法逐块加密', en: 'RSA on every block' },
        { zh: '会话密钥做对称加密（AES/CAST5 等）', en: 'Symmetric cipher under the session key (AES/CAST5...)' },
        { zh: 'Base64 编码即足够', en: 'Base64 encoding is enough' }
      ],
      a: 1,
      expl: { zh: '公钥运算慢千倍，只适合处理小数据。PGP 的「混合加密」：正文交给快速的对称密码，RSA 只负责保护那把会话密钥。',
              en: 'Public-key math is ~1000x slower, fit only for small data. PGP\'s hybrid design: fast symmetric ciphers carry the body, RSA guards only the session key.' }
    },
    {
      stage: { zh: 'STEP 4 · 封装密钥', en: 'STEP 4 · Wrap key' },
      q: { zh: '现在把会话密钥安全地「放进信封」。正确做法是？', en: 'Now the session key must travel safely. The right move?' },
      opts: [
        { zh: '用 Alice 的公钥加密会话密钥，附在密文前', en: "Encrypt the session key with Alice's public key and prepend it" },
        { zh: '把会话密钥藏在邮件图片里', en: 'Hide the session key inside an image attachment' },
        { zh: '另发一封邮件单独告知密钥', en: 'Email the key separately in a second message' }
      ],
      a: 0,
      expl: { zh: '数字信封：只有持有对应私钥的 Alice 能拆开信封取出会话密钥。窃听者拿到整包也只见乱码——这就是 HTTPS 每次握手在做的事。',
              en: 'The digital envelope: only Alice\'s private key can open it. An eavesdropper sees nothing but noise — this is what every HTTPS handshake still does today.' }
    },
    {
      stage: { zh: 'STEP 5 · 数字签名', en: 'STEP 5 · Sign' },
      q: { zh: 'Alice 需要确认邮件确实来自你。签名用什么生成？', en: 'Alice must be sure it is from you. What creates the signature?' },
      opts: [
        { zh: '你的私钥对邮件摘要签名', en: 'Your private key signing the message digest' },
        { zh: '你的公钥加密整封邮件', en: 'Your public key encrypting the whole mail' },
        { zh: 'Alice 的私钥', en: "Alice's private key" }
      ],
      a: 0,
      expl: { zh: '先用 SHA 哈希出摘要，再用你的私钥签名摘要——只有你能生成，任何人可用你的公钥验证。「私钥签名、公钥验签」与加密方向恰好相反。',
              en: 'Hash the mail into a digest, sign the digest with your private key — only you could make it, anyone can check with your public key. Signing is encryption in reverse.' }
    },
    {
      stage: { zh: 'STEP 6 · 装甲发送', en: 'STEP 6 · Armor & send' },
      q: { zh: '密文要穿过只能传文本的老邮件系统。PGP 的做法是？', en: 'Ciphertext must survive text-only mail gateways. PGP does what?' },
      opts: [
        { zh: '压缩成 zip 附带密码', en: 'Zip it with a password' },
        { zh: 'Base64「ASCII 装甲」转成可打印字符', en: 'Base64 "ASCII armor" into printable characters' },
        { zh: '拆成多张图片发送', en: 'Split it across several images' }
      ],
      a: 1,
      expl: { zh: '-----BEGIN PGP MESSAGE----- 开头的装甲块就是 Base64：把二进制密文映射到 64 个可打印字符，穿越任何只认文本的通道。你已在站内 base64 游戏里练过它。',
              en: 'Those -----BEGIN PGP MESSAGE----- blocks are Base64: binary mapped onto 64 printable characters that survive any text-only channel — the very codec you played in our base64 game.' }
    },
    {
      stage: { zh: 'STEP 7 · 验证公钥', en: 'STEP 7 · Verify keys' },
      q: { zh: '没有证书机构（CA），你怎么确认手里的「Alice 公钥」是真的？', en: 'With no certificate authority, how do you know this "Alice key" is genuine?' },
      opts: [
        { zh: '对比当面核对过的公钥指纹（短哈希）', en: 'Compare the key fingerprint (short hash) verified face-to-face' },
        { zh: '看密钥长度够不够长', en: 'Check that the key is long enough' },
        { zh: '相信第一封邮件里附带的公钥', en: 'Trust whatever key arrives attached in the first email' }
      ],
      a: 0,
      expl: { zh: '指纹是把公钥哈希成的一串短码，见面念一遍即可核对——这是 PGP「信任之网」的地基：没有中心化 CA，靠人与人的签名互相背书。',
              en: 'A fingerprint hashes the key into a short code you can read aloud over coffee — the bedrock of PGP\'s Web of Trust: no central CA, just people signing each other\'s keys.' }
    },
    {
      stage: { zh: 'STEP 8 · 抵达', en: 'STEP 8 · Arrival' },
      q: { zh: 'Alice 收到邮件。她解密的最后一步动作顺序是？', en: 'Alice received the mail. In what order does she unwrap it?' },
      opts: [
        { zh: '用自己的私钥解出会话密钥 → 解密正文 → 用你的公钥验证签名', en: "Her private key unwraps the session key → decrypt the body → verify your signature with your public key" },
        { zh: '先解密正文，再猜会话密钥', en: 'Decrypt the body first, then guess the session key' },
        { zh: '把邮件转发给你请求解密许可', en: 'Forward it back to you asking for permission' }
      ],
      a: 0,
      expl: { zh: '拆封顺序与封装相反：她的私钥开信封、会话密钥解正文、你的公钥验签章。1996 年 Zimmermann 案撤销时，这套流程已成为全球数百万人的日常。',
              en: 'Unwrapping mirrors wrapping: her private key opens the envelope, the session key decrypts, your public key checks the seal. When Zimmermann\'s case dropped in 1996, this flow was already millions of people\'s daily routine.' }
    }
  ];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'pm-wrap';
  wrap.innerHTML =
    '<div class="pm-prog" id="pm-prog"></div>' +
    '<div class="pm-stage" id="pm-stage"></div>' +
    '<div class="pm-q" id="pm-q"></div>' +
    '<div class="pm-btns" id="pm-opts"></div>' +
    '<div class="pm-msg" id="pm-msg"></div>' +
    '<div class="pm-expl" id="pm-expl"></div>' +
    '<div class="pm-btns"><button class="btn green" id="pm-next" hidden></button></div>' +
    '<div class="pm-btns"><button class="btn" id="pm-daily">' + T('gs.pgp-mail.dailyBtn') + '</button></div>' +
    '<div class="pm-help">' + T('gs.pgp-mail.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('pm-prog'), stageEl = $('pm-stage'), qEl = $('pm-q'),
      optsEl = $('pm-opts'), msgEl = $('pm-msg'), explEl = $('pm-expl'),
      nextB = $('pm-next'), dailyBtn = $('pm-daily');

  var idx = 0, score = 0, answered = false, finished = false,
      curQ = null, curOpts = [], curA = 0, order = [],
      dailyMode = false, startTs = 0;

  function upd() {
    progEl.textContent = fmt('gs.pgp-mail.prog', { n: Math.min(idx + 1, order.length), total: order.length, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'pm-msg ' + c; msgEl.textContent = t; }

  function renderQ() {
    curQ = STEPS[order[idx]];
    stageEl.textContent = L(curQ.stage);
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
    msgEl.className = 'pm-msg'; msgEl.textContent = '';
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
      setMsg('ok', T('gs.pgp-mail.correct'));
      if (Arcade.juice) Arcade.juice.win();
    } else {
      setMsg('no', T('gs.pgp-mail.wrong'));
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
      Arcade.daily.markSolved('pgp-mail', sec);
    }
    stageEl.textContent = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.pgp-mail.done', { score: score }));
    nextB.textContent = T('gs.pgp-mail.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  var rnd = Math.random;
  function startGame(daily) {
    idx = 0; score = 0; answered = false; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 23); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    order = [];
    for (var i = 0; i < STEPS.length; i++) order.push(i);
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
