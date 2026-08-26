/* 破译 DECODE ARCADE · TOTP 双因素验证 —— 第十三期新游戏
   两道真实计算题（教学哈希模拟 HOTP 截断）+ 六道双因素安全题。
   每步 +25。顶部演示码随时间步轮转。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.totp-verify.tut1t'), d: T('gs.totp-verify.tut1') },
  { t: T('gs.totp-verify.tut2t'), d: T('gs.totp-verify.tut2') },
  { t: T('gs.totp-verify.tut3t'), d: T('gs.totp-verify.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 8;

  function fmt(k, v) { var s = T(k); for (var k2 in (v || {})) s = s.split('{' + k2 + '}').join(v[k2]); return s; }
  function L(x) { return (typeof x === 'object' && x !== null) ? (isEn() ? x.en : x.zh) : x; }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function mulberry(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

  /* 教学哈希：djb2 变体（与协议实验室同款） */
  function H(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((((h << 5) + h) >>> 0) + str.charCodeAt(i)) >>> 0;
    return ('00000000' + h.toString(16)).slice(-8);
  }
  /* 教学 TOTP：截断哈希取 6 位十进制 */
  function totp(key, timeSlice) {
    var v = parseInt(H(key + ':' + timeSlice).slice(0, 6), 16) % 1000000;
    return ('000000' + v).slice(-6);
  }

  /* 六道安全题（内联双语） */
  var QUIZ = [
    {
      q: { zh: '扫码绑定时你其实交换了什么？', en: 'What do you actually exchange when scanning the setup QR code?' },
      opts: [
        { zh: '一把共享密钥——此后双方各自算同一串验证码', en: 'A shared secret — both sides now derive the same codes independently' },
        { zh: '你的账号密码', en: 'Your account password' },
        { zh: '一次性验证码本身', en: 'The one-time codes themselves' }
      ],
      a: 0,
      expl: { zh: '二维码内容通常是 otpauth://totp/站点?secret=XXXX。密钥此后不再上网——验证码在两端独立生成、无需网络，这也是它比短信验证更抗拦截的原因。',
              en: 'The QR encodes otpauth://totp/site?secret=XXXX. The secret never travels again — both ends compute offline, which is exactly why app codes resist interception better than SMS.' }
    },
    {
      q: { zh: '为什么验证码每 30 秒就作废？', en: 'Why does each code expire after just 30 seconds?' },
      opts: [
        { zh: '省电', en: 'To save battery' },
        { zh: '把攻击窗口压到半分钟——偷窥到的码几乎立刻失效', en: 'It shrinks the attack window to half a minute — a peeked code dies almost immediately' },
        { zh: '让用户保持警觉', en: 'To keep users alert' }
      ],
      a: 1,
      expl: { zh: '时间片是「新鲜度」的来源：即使验证码被肩窥或钓鱼页骗走，30 秒后它就是废纸。服务器通常还允许±1 片容差以吸收时钟漂移。',
              en: 'Time slices buy freshness: even a shoulder-surfed or phished code turns worthless in half a minute. Servers typically accept ±1 slice to absorb clock drift.' }
    },
    {
      q: { zh: 'SIM 劫持攻击为什么能绕过短信验证码，却绕不过 authenticator 应用？', en: 'Why does SIM swapping beat SMS codes but not authenticator apps?' },
      opts: [
        { zh: '短信码走运营商信道，攻击者骗补 SIM 卡即可接收；App 码只存在手机本地密钥里', en: 'SMS rides the carrier network — a fraudulently swapped SIM receives it; app codes live in an on-device secret' },
        { zh: '短信码更短', en: 'SMS codes are shorter' },
        { zh: 'App 码有更长有效期', en: 'App codes last longer' }
      ],
      a: 0,
      expl: { zh: '2019 年推特 CEO 账号事件即 SIM 劫持。TOTP 密钥从不出现在运营商侧，换卡拿不到；FIDO2/Passkey 更进一步——连共享密钥都没有，私钥永不出设备。',
              en: "Jack Dorsey's 2019 takeover was a SIM swap. The TOTP secret never touches the carrier, so a swapped SIM gains nothing; FIDO2/Passkey goes further with no shared secret at all — the private key never leaves the device." }
    },
    {
      q: { zh: '手机丢了进不去账户，印在绑定时的那组「恢复码」是干什么用的？', en: 'If you lose your phone, what are the recovery codes printed at setup for?' },
      opts: [
        { zh: '一次性的备用第二因子——每个只能用一次，用完作废', en: 'One-time backup second factors — each works once then dies' },
        { zh: '解锁手机的 PIN', en: 'A PIN to unlock the phone' },
        { zh: '客服工单编号', en: 'Support ticket numbers' }
      ],
      a: 0,
      expl: { zh: '恢复码是打印出来的一次性第二因子集合，本质是把「你持有的」从手机换成一张纸。妥善离线保存它们——放在被入侵的邮箱里等于没设防。',
              en: 'Recovery codes are a printable set of one-time second factors — moving "what you hold" from phone to paper. Store them offline: saving them in an inbox defeats the purpose.' }
    },
    {
      q: { zh: '钓鱼站点实时转发验证码（AiTM 中间人），TOTP 还挡得住吗？', en: 'An AiTM phishing site relays your code in real time. Does TOTP still protect you?' },
      opts: [
        { zh: '挡不住实时转发——这正是 Passkey 存在的理由', en: 'No — real-time relay defeats it, which is why Passkeys exist' },
        { zh: '完全没问题', en: 'Totally fine' },
        { zh: '换个更长的密码就行', en: 'Just use a longer password' }
      ],
      a: 0,
      expl: { zh: 'AiTM 反向代理能即时中继你输入的验证码。FIDO2/Passkey 的响应绑定「真实域名」，假站要不到有效凭据——这是 2023 年后各大平台全面转向 Passkey 的核心动因。',
              en: 'An AiTM reverse proxy relays your code instantly. FIDO2/Passkey responses are cryptographically bound to the true domain, so fake sites get nothing — the core reason platforms rushed to Passkeys after 2023.' }
    },
    {
      q: { zh: '「你知道的」（口令）+「你持有的」（验证码）组合成双因素。它的对手最怕什么？', en: 'Password (what you know) plus code (what you hold) makes two factors. What is this scheme\'s worst enemy?' },
      opts: [
        { zh: '暴力破解单个口令', en: 'Brute-forcing one password' },
        { zh: '两样东西被同一条链路一起偷走（如同一台被植入木马的手机）', en: 'Both stolen through one channel — e.g. one malware-infected device holds password and code generator alike' },
        { zh: '用户忘记口令', en: 'Users forgetting passwords' }
      ],
      a: 1,
      expl: { zh: '双因素的强度来自「两类锁不同路」。若口令管理器和验证器装在同一台中毒手机上，两条链路合而为一——真正的多因素应尽量分散存储位置。',
              en: 'Two-factor strength comes from separate paths. If your password manager and authenticator share one infected phone, the paths merge into one — real MFA spreads secrets across devices.' }
    }
  ];

  /* UI */
  var wrap = document.createElement('div');
  wrap.className = 'tv-wrap';
  wrap.innerHTML =
    '<div class="tv-prog" id="tv-prog"></div>' +
    '<div class="tv-stage" id="tv-stage"></div>' +
    '<div class="tv-code" id="tv-code">······</div>' +
    '<div class="tv-clock" id="tv-clock"></div>' +
    '<div class="tv-q" id="tv-q"></div>' +
    '<div class="tv-btns" id="tv-opts"></div>' +
    '<div class="tv-msg" id="tv-msg"></div>' +
    '<div class="tv-expl" id="tv-expl"></div>' +
    '<div class="tv-btns"><button class="btn green" id="tv-next" hidden></button></div>' +
    '<div class="tv-btns"><button class="btn" id="tv-daily">' + T('gs.totp-verify.dailyBtn') + '</button></div>' +
    '<div class="tv-help">' + T('gs.totp-verify.helpText') + '</div>';
  root.appendChild(wrap);
  var $ = function (id) { return wrap.querySelector('#' + id); };
  var progEl = $('tv-prog'), stageEl = $('tv-stage'), codeEl = $('tv-code'),
      clockEl = $('tv-clock'), qEl = $('tv-q'), optsEl = $('tv-opts'),
      msgEl = $('tv-msg'), explEl = $('tv-expl'), nextB = $('tv-next'),
      dailyBtn = $('tv-daily');

  /* 步骤序列：calc q q calc q q q q → idx0 计算，idx1-2 问答，idx3 计算，idx4-7 问答 */
  var PLAN = ['c', 'q', 'q', 'c', 'q', 'q', 'q', 'q'];
  var QIDX = [0, 1, 2, 3, 4, 5];
  var CALC_SLICE = [17, 42];

  var idx = 0, score = 0, answered = false, finished = false,
      curQ = null, curOpts = [], curA = 0,
      demoKey = '', demoTimer = null, demoSlice = 0,
      dailyMode = false, startTs = 0, rnd = Math.random;

  function upd() {
    progEl.textContent = fmt('gs.totp-verify.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, score: score });
  }
  function setMsg(c, t) { msgEl.className = 'tv-msg ' + c; msgEl.textContent = t; }

  /* 顶部演示码：每 3 秒推进一个时间片（教学加速） */
  function startDemo() {
    stopDemo();
    demoSlice = Math.floor(Date.now() / 30000);
    tick();
    demoTimer = setInterval(tick, 3000);
  }
  function stopDemo() { if (demoTimer) { clearInterval(demoTimer); demoTimer = null; } }
  function tick() {
    demoSlice++;
    codeEl.textContent = totp(demoKey, demoSlice);
    clockEl.textContent = '⏱ time-slice #' + demoSlice + ' (demo ×10000)';
  }

  /* ---------- 计算步 ---------- */
  function renderCalc(sliceNo) {
    answered = false;
    stageEl.textContent = T('gs.totp-verify.calcStage');
    var key = 'K' + (sliceNo * 7 % 10) + 'X' + Math.floor(rnd() * 90 + 10);
    var slice = CALC_SLICE[sliceNo] + Math.floor(rnd() * 3);
    var correct = totp(key, slice);
    curOpts = [correct,
      String((parseInt(correct, 10) + 111111) % 1000000).padStart(6, '0'),
      H(key + '#' + slice).slice(0, 6)];
    curA = 0;
    for (var i = 2; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = curOpts[i]; curOpts[i] = curOpts[j]; curOpts[j] = tmp;
    }
    curA = curOpts.indexOf(correct);
    qEl.textContent = L({
      zh: '密钥 K=' + key + '，当前时间片 T=' + slice + '（即第 ' + slice + ' 个 30 秒）。按 截断(H(K|T)) mod 10⁶ 计算六位验证码：',
      en: 'Key K=' + key + ', current time slice T=' + slice + '. Compute truncate(H(K|T)) mod 10^6:'
    });
    optsEl.innerHTML = '';
    curOpts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.className = 'btn accent';
      b.style.fontFamily = 'var(--font-mono)';
      b.style.fontSize = '15px';
      b.style.letterSpacing = '3px';
      b.textContent = o;
      b.addEventListener('click', function () { judge(oi); });
      optsEl.appendChild(b);
    });
    msgEl.className = 'tv-msg'; msgEl.textContent = '';
    explEl.textContent = '📌 ' + L({
      zh: '真实算法用 HMAC-SHA1 而非本站教学哈希，但骨架一致：密钥+时间片 → 哈希 → 动态截断 → 六位十进制。RFC 6238 于 2011 年标准化。',
      en: 'Real TOTP uses HMAC-SHA1 rather than our teaching hash, but the skeleton is identical: key+time-slice → hash → dynamic truncation → six digits. Standardized as RFC 6238 in 2011.'
    });
    explEl.classList.add('on');
    msgEl.className = 'tv-msg'; msgEl.textContent = '';
    nextB.hidden = true;
    nextB.onclick = nextQ;
    upd();
  }

  /* ---------- 问答 ---------- */
  function renderQuiz(qi) {
    curQ = QUIZ[qi];
    answered = false;
    stageEl.textContent = T('gs.totp-verify.quizStage');
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
    msgEl.className = 'tv-msg'; msgEl.textContent = '';
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
      setMsg('ok', T('gs.totp-verify.correct'));
      if (Arcade.juice) Arcade.juice.win();
    } else {
      setMsg('no', T('gs.totp-verify.wrong'));
      if (Arcade.juice) Arcade.juice.lose();
    }
    optsEl.children[pick].style.borderColor = ok ? 'rgba(57,255,20,.9)' : 'rgba(255,45,149,.9)';
    if (!ok) optsEl.children[curA].style.borderColor = 'rgba(57,255,20,.9)';
    nextB.hidden = false;
  }

  function nextQ() {
    idx++; answered = false;
    if (idx >= TOTAL) { finish(); return; }
    renderStep();
  }

  function renderStep() {
    if (PLAN[idx] === 'c') renderCalc(idx < 4 ? 0 : 1);
    else renderQuiz(QIDX[PLAN.slice(0, idx).filter(function (x) { return x === 'q'; }).length]);
  }

  function finish() {
    finished = true;
    if (Arcade.shell) Arcade.shell.submitScore(score);
    if (dailyMode && Arcade.daily) {
      var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
      Arcade.daily.markSolved('totp-verify', sec);
    }
    stageEl.textContent = ''; qEl.textContent = '';
    optsEl.innerHTML = ''; explEl.classList.remove('on'); explEl.textContent = '';
    setMsg('ok', fmt('gs.totp-verify.done', { score: score }));
    nextB.textContent = T('gs.totp-verify.againBtn');
    nextB.hidden = false;
    nextB.onclick = function () { startGame(false); };
  }

  function startGame(daily) {
    idx = 0; score = 0; answered = false; finished = false;
    dailyMode = !!daily;
    if (dailyMode) { startTs = Date.now(); rnd = mulberry(daySeed() * 31 + 59); }
    else rnd = Math.random;
    dailyBtn.hidden = dailyMode;
    demoKey = 'DEMO' + Math.floor(rnd() * 9000 + 1000);
    startDemo();
    setMsg('', '');
    renderStep();
  }

  dailyBtn.addEventListener('click', function () { startGame(true); });
  window.GAME_RESTART = function () { startGame(false); };
  startGame(false);
})();
