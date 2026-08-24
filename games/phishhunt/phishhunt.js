/* 破译 DECODE ARCADE · 钓鱼邮件狩猎 —— 第八期 #18 新游戏
   八封邮件真假连判：判对 +20 + 连击；答后亮出线索。支持每日模式。案例均为教学虚构。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.phishhunt.tut1t'), d: T('gs.phishhunt.tut1') },
  { t: T('gs.phishhunt.tut2t'), d: T('gs.phishhunt.tut2') },
  { t: T('gs.phishhunt.tut3t'), d: T('gs.phishhunt.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var TOTAL = 8;

  /* 案例库（教学虚构）：phish=true 为钓鱼；clues 双语 */
  var MAILS = [
    { phish: true,
      from: 'security@paypa1-verify.com',
      subj: { zh: '【紧急】您的账户已被限制，请立即验证', en: '[URGENT] Your account is limited — verify now' },
      body: { zh: '我们检测到异常登录，您的账户将在 24 小时内被永久冻结。请立即点击 <a>https://paypa1-verify.com/login</a> 验证身份并输入完整密码与卡号。',
              en: 'We detected unusual sign-in. Your account will be permanently frozen within 24 hours. Verify at once via <a>https://paypa1-verify.com/login</a> with your full password and card number.' },
      clues: { zh: ['域名是 paypa1（数字 1）不是 paypal.com', '24 小时冻结的恐慌话术', '正规平台从不索要完整密码+卡号'],
               en: ['Domain is paypa1 (digit one), not paypal.com', '24-hour freeze scare tactic', 'No real platform asks for full password AND card number'] } },
    { phish: false,
      from: 'receipts@figma.com',
      subj: { zh: '您在 Figma 的月度收据', en: 'Your monthly Figma receipt' },
      body: { zh: '感谢订阅 Professional 计划。本月账单已生成，可登录账户后在 Billing 页面查看——如需发票 PDF 请从站内下载。',
              en: 'Thanks for your Professional plan subscription. This month\'s invoice is ready in Billing after you sign in — download the PDF from the dashboard.' },
      clues: { zh: ['域名与官方一致', '不索要任何凭据', '引导回站内而非外部链接'], en: ['Domain matches the official one', 'Asks for no credentials', 'Points in-dashboard, not to external links'] } },
    { phish: true,
      from: '"Boss" <ceo.office@hq-mailer.net>',
      subj: { zh: '保密：帮我处理一件事，别告诉财务', en: 'Confidential: handle this for me, don\'t tell finance' },
      body: { zh: '我在开会不方便打电话。立刻购买 5 张各 2000 元的礼品卡，把卡号密码拍照发我，今天下班前完成，事后报销。',
              en: 'I am in meetings, can\'t call. Buy five $400 gift cards NOW, photograph codes and numbers to me before end of day; you\'ll be reimbursed.' },
      clues: { zh: ['发件域 hq-mailer.net 与公司无关', '绕过正常审批+保密话术', '礼品卡=不可追回的转账', '制造「不能电话核实」的情境'],
               en: ['Domain hq-mailer.net unrelated to company', 'Bypasses approvals + secrecy script', 'Gift cards = irreversible transfer', 'Manufactured "can\'t verify by phone" pressure'] } },
    { phish: false,
      from: 'no-reply@calendar.google.com',
      subj: { zh: '邀请：周四 10:00 项目评审会', en: 'Invitation: Project review Thu 10:00' },
      body: { zh: '王小明 邀请你参加「项目评审」视频会议。你可以在日历中接受或婉拒，无需输入任何账户信息。',
              en: 'Wang Xiaoming invited you to "Project review" video call. Accept or decline from your calendar — no account details needed.' },
      clues: { zh: ['来自日历系统官方域', '正文不含任何链接或索求', '动作在自家日历里完成'], en: ['From the calendar system\'s official domain', 'No links or requests in body', 'Action happens inside your own calendar'] } },
    { phish: true,
      from: 'IT-Support <it.support.micros0ft.helpdesk.ru@example-mail.com>',
      subj: { zh: '您的邮箱将在今日 17:00 被停用', en: 'Mailbox deactivation today at 17:00' },
      body: { zh: '系统升级需要重新激活：请在网页里输入你的工号、邮箱密码和手机验证码，否则今晚清空全部邮件。<a>http://202.96.13.9/mail/activate</a>（IP 裸地址）',
              en: 'System upgrade requires reactivation: enter employee ID, mailbox password and SMS code on this page or ALL mail is wiped tonight. <a>http://202.96.13.9/mail/activate</a> (bare IP)' },
      clues: { zh: ['IP 裸地址而非域名', '微软拼写 micros0ft + .ru 片段', '索要短信验证码=接管账户的最后一步', '当日清空的恐吓时限'],
               en: ['Bare IP address instead of a domain', 'micros0ft misspelling + .ru fragment', 'Asking the SMS code = final step of takeover', 'Same-day wipe deadline threat'] } },
    { phish: false,
      from: 'code@auth.bankapp.com',
      subj: { zh: '您的登录验证码 884217', en: 'Your login code 884217' },
      body: { zh: '您刚请求了登录验证码（若非本人操作，请立即修改密码并联系客服）。任何人索取此码都可能是诈骗——本条无需回复。',
              en: 'You requested a login code. If this wasn\'t you, change your password and contact support immediately. Never share this code — no reply needed.' },
      clues: { zh: ['你自己刚触发过该登录', '官方域发送', '正文主动提醒「验证码不可给任何人」'], en: ['You triggered this login yourself', 'Sent from the official domain', 'Body itself warns never to share the code'] } },
    { phish: true,
      from: 'prize@lucky-draw-intl.biz',
      subj: { zh: '恭喜！您已获得国际彩票二等奖 $800,000', en: 'Congrats! You won $800,000 in an international draw' },
      body: { zh: '您从未参与过的抽奖中大奖啦！仅需支付 ¥3000「手续费」并提供银行账号即可领取，名额保留 6 小时！',
              en: 'You won a lottery you never entered! Pay only ¥3000 "processing fee" plus your bank account to claim — reserved for 6 hours!' },
      clues: { zh: ['从未参加过的抽奖', '领奖先付费=经典骗局', '.biz 廉价域+6小时限时压迫'], en: ['A lottery you never entered', 'Pay-first prizes = classic scam', '.biz cheap domain + 6-hour countdown'] } },
    { phish: false,
      from: 'updates@arxiv.org',
      subj: { zh: '您关注的分类有 3 篇新论文', en: '3 new papers in categories you follow' },
      body: { zh: 'cs.CR 今日新增：后量子签名综述等 3 篇。全文可在 arxiv.org 站内检索编号阅读，本邮件不含附件。',
              en: 'cs.CR today: a post-quantum signatures survey and two more. Read by ID on arxiv.org — no attachments in this mail.' },
      clues: { zh: ['学术订阅官方域', '无附件无链接诱饵', '内容与你此前的订阅行为吻合'], en: ['Official academic domain', 'No attachments or bait links', 'Content matches your own subscriptions'] } },
    { phish: true,
      from: 'hr@company-careers.work',
      subj: { zh: '录用通知：先垫付培训费 8800 元', en: 'Offer letter: please pre-pay training fee first' },
      body: { zh: '恭喜通过面试！入职前需自费完成指定机构培训（8800 元），并将身份证照片发至本邮箱备案，今天内缴费锁定名额。',
              en: 'Congratulations on passing! Before onboarding you must self-fund training (¥8800) at our designated center and email photos of your ID today to lock the slot.' },
      clues: { zh: ['招聘流程反向收钱＝诈骗铁律', '域名 company-careers.work 非官方企业域', '索要身份证照片', '限时锁名额话术'],
               en: ['Jobs that charge YOU = scam rule of thumb', 'company-careers.work is not the corporate domain', 'Requests ID photos', 'Slot-locking urgency'] } },
    { phish: true,
      from: 'docs-share@docs-consumer.xyz',
      subj: { zh: '张三 已与你共享文档《Q2 绩效表》', en: 'Zhang San shared "Q2 Review" with you' },
      body: { zh: '点击下方链接查看文档：<a>https://docs-consumer.xyz/oauth?continue</a>——登录您的邮箱账户以获得访问权限。',
              en: 'Open the document here: <a>https://docs-consumer.xyz/oauth?continue</a> — sign in with your email account to gain access.' },
      clues: { zh: ['域名不是 docs.google.com 官方域', '看文档不需要「登录邮箱授权」', 'OAuth 授权页=交出邮箱全部权限'],
               en: ['Domain is not the official docs provider', 'Viewing a doc never needs mailbox re-auth', 'An OAuth prompt there hands over full mail access'] } },
    { phish: true,
      from: 'express@kuaidi-peisong.vip',
      subj: { zh: '您的包裹运输中丢失，可申请双倍理赔', en: 'Your parcel was lost — claim double compensation' },
      body: { zh: '很抱歉您的快递在转运中丢失。请立即填写银行卡号与短信验证码开通理赔通道，双倍金额将在 10 分钟内到账。',
              en: 'Your parcel was lost in transit. Enter your bank card number and SMS code now to open the claim channel — double amount arrives in 10 minutes.' },
      clues: { zh: ['.vip 廉价域冒充快递公司', '理赔索要短信验证码=转走你的钱', '你根本没查过这个单号的快递'],
               en: ['.vip throwaway domain impersonating couriers', 'Claim needs your SMS code = drains the account', 'You never tracked such a tracking number'] } },
    { phish: true,
      from: 'job@easy-parttime-income.top',
      subj: { zh: '【招聘】动动手指日入 300，手机即可', en: '[Job] Earn ¥300/day with just your phone' },
      body: { zh: '居家兼职：先垫付完成网店刷单任务，本金+佣金 5 分钟返还。新手首单小额体验，导师一对一指导。',
              en: 'Work from home: pre-pay to complete store-order brushing tasks, principal plus commission returns in 5 minutes. Newbie trial orders available.' },
      clues: { zh: ['刷单本身即违法且无真实雇主', '「先垫付后返款」= 有去无回', '.top 廉价域 + 日入承诺话术'],
               en: ['Order-brushing is illegal with no real employer', 'Pre-pay-then-refund = money never returns', '.top throwaway domain + daily-income bait'] } },
    { phish: false,
      from: 'wang.li@ourcompany.com',
      subj: { zh: 'Re: 周报汇总表已更新', en: 'Re: Weekly report sheet updated' },
      body: { zh: '已在内部 Wiki 更新本周汇总，路径不变：Engineering/Weekly/2026-W35。有问题明天站会当面聊。',
              en: 'Updated this week\'s rollup on the internal wiki, same path: Engineering/Weekly/2026-W35. Ping me at standup if anything looks off.' },
      clues: { zh: ['公司内部域名发件', '回复线程与你此前的对话吻合', '不包含任何链接或索求'], en: ['From the corporate domain', 'Thread matches your prior conversation', 'No links or asks inside'] } },
    { phish: false,
      from: 'itinerary@airlines-confirmation.com',
      subj: { zh: '出行确认：CA1832 北京→上海 09-02', en: 'Trip confirmed: CA1832 Beijing→Shanghai Sep 2' },
      body: { zh: '您预订的航班已出票。值机开放时间为起飞前 48 小时，可在 App 内选座；如需改签请通过 App 或官网办理。',
              en: 'Your booked flight is ticketed. Check-in opens 48h before departure; seat selection and changes happen in the app or on the official site.' },
      clues: { zh: ['与你的真实订单信息一致', '官方确认域发送', '引导 App/官网而非外部短链'], en: ['Matches your actual booking', 'Sent by the official confirmation domain', 'Directs to app/official site, not shortened links'] } },
    { phish: false,
      from: 'alerts-noreply@github.com',
      subj: { zh: '[repo] 安全公告：依赖项 CVE-2026-1234 已修复', en: '[repo] Security alert: dependency CVE-2026-1234 patched' },
      body: { zh: '您关注的仓库已将受影响的依赖升级至修复版本。详情可在仓库的 Security 标签页查看，无需任何操作。',
              en: 'A watched repository bumped the affected dependency to the patched version. See the repo Security tab for details — no action required.' },
      clues: { zh: ['github.com 官方告警地址', '明确写着「无需操作」', '与你实际 Watch 的仓库对应'], en: ['Official github.com alert address', 'Explicitly says no action required', 'Corresponds to repos you actually watch'] } }
  ];

  function fmt(key, vars) {
    var s = T(key);
    for (var k in (vars || {})) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function isEn() { return window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en'; }
  function daySeed() {
    var dt = new Date();
    return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
  }

  var wrap = document.createElement('div');
  wrap.className = 'ph-wrap';
  wrap.innerHTML =
    '<div class="ph-prog" id="ph-prog"></div>' +
    '<div class="ph-mail" id="ph-mail"></div>' +
    '<div class="ph-btns">' +
      '<button class="btn pink" id="ph-phish"></button>' +
      '<button class="btn accent" id="ph-real"></button>' +
    '</div>' +
    '<div class="ph-msg" id="ph-msg"></div>' +
    '<div class="ph-clues" id="ph-clues"></div>' +
    '<div class="ph-btns"><button class="btn yellow" id="ph-next" hidden></button></div>' +
    '<div class="ph-btns"><button class="btn" id="ph-daily"></button></div>' +
    '<div class="ph-help">' + T('gs.phishhunt.helpText') + '</div>';
  root.appendChild(wrap);
  var el = function (id) { return wrap.querySelector('#' + id); };
  var progEl = el('ph-prog'), mailEl = el('ph-mail'), msgEl = el('ph-msg'),
      clueBox = el('ph-clues'), nextBtn = el('ph-next'), dailyBtn = el('ph-daily');
  el('ph-phish').textContent = T('gs.phishhunt.phishBtn');
  el('ph-real').textContent = T('gs.phishhunt.realBtn');
  dailyBtn.textContent = T('gs.phishhunt.dailyBtn');
  nextBtn.textContent = T('gs.phishhunt.againBtn');

  var idx = 0, score = 0, streak = 0, answered = false, finished = false,
      dailyMode = false, startTs = 0, cur = null, order = [], nextTimer = null;

  function updProg() {
    progEl.textContent = fmt('gs.phishhunt.prog', { n: Math.min(idx + 1, TOTAL), total: TOTAL, streak: streak });
  }
  function setMsg(cls, txt) { msgEl.className = 'ph-msg ' + cls; msgEl.textContent = txt; }

  function renderMail(m) {
    var lang = isEn() ? 'en' : 'zh';
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    mailEl.innerHTML =
      '<div class="ph-from">📧 ' + esc(m.from) + '</div>' +
      '<div class="ph-subj">' + esc(m.subj[lang]) + '</div>' +
      '<div class="ph-body">' + m.body[lang].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/&lt;a&gt;/g, '<a>').replace(/&lt;\/a&gt;/g, '</a>') + '</div>';
  }
  function showClues(m) {
    var list = isEn() ? m.clues.en : m.clues.zh;
    var h = '<b>' + T('gs.phishhunt.cluesT') + '</b><br>';
    for (var i = 0; i < list.length; i++) h += '· ' + list[i] + '<br>';
    clueBox.innerHTML = h;
    clueBox.classList.add('on');
  }
  function judge(saidPhish) {
    if (answered || finished) return;
    answered = true;
    var ok = saidPhish === cur.phish;
    if (ok) {
      streak++;
      score += 20 + (streak - 1) * 5;
      if (Arcade.juice) Arcade.juice.win();
      setMsg('ok', fmt('gs.phishhunt.ok', { pts: (20 + (streak - 1) * 5) }));
    } else {
      streak = 0;
      if (Arcade.juice) Arcade.juice.lose();
      setMsg('no', T('gs.phishhunt.no'));
    }
    showClues(cur);
    nextTimer = setTimeout(nextQ, 1600);
  }
  function nextQ() {
    idx++;
    answered = false;
    clueBox.classList.remove('on');
    if (idx >= TOTAL || idx >= order.length) {
      finished = true;
      if (Arcade.shell) Arcade.shell.submitScore(score);
      if (dailyMode && Arcade.daily) {
        var sec = Math.max(1, Math.round((Date.now() - startTs) / 1000));
        Arcade.daily.markSolved('phishhunt', sec);
      }
      setMsg('ok', fmt('gs.phishhunt.done', { score: score }));
      nextBtn.hidden = false;
      return;
    }
    startQuestion();
  }
  function startQuestion() {
    updProg();
    answered = false;
    cur = MAILS[order[idx]];
    renderMail(cur);
    setMsg('', '');
  }
  function buildOrder(rnd) {
    var arr = [];
    for (var i = 0; i < MAILS.length; i++) arr.push(i);
    for (i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr.slice(0, TOTAL);
  }
  function startGame(daily) {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; score = 0; streak = 0; finished = false;
    dailyMode = !!daily;
    if (dailyMode) startTs = Date.now();
    dailyBtn.hidden = dailyMode;
    order = buildOrder(dailyMode
      ? (function () { var s = daySeed(); return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; })()
      : Math.random);
    nextBtn.hidden = true;
    startQuestion();
  }
  el('ph-phish').addEventListener('click', function () { judge(true); });
  el('ph-real').addEventListener('click', function () { judge(false); });
  nextBtn.addEventListener('click', function () { startGame(false); });
  dailyBtn.addEventListener('click', function () { startGame(true); });

  window.GAME_RESTART = function () { startGame(false); };

  startGame(false);
})();
