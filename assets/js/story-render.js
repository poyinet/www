(function () {
'use strict';
/* 编年史章节渲染逻辑（自 story.html 外置：SW 可缓存、HTML 减重）
   依赖（须先加载）：core/i18n.js、i18n-dict.js、i18n-story.js、games.js、glossary-data.js、stories.js */
if (window.Arcade && Arcade.i18n) {
      Arcade.i18n.applyStatic();
      document.title = T('st.pageTitle') + Arcade.i18n.t('app.titleSuffix');
    }
    var stories = window.Arcade && Arcade.stories ? Arcade.stories : null;
    var isStoryEn = !!(window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en');
    var qs = window.location.search || '';
    var id = (qs.match(/[?&]id=([^&]+)/) || [])[1] || '';

    var root = document.getElementById('sy-root');
    /* E2E 修复：A26 原声明困在 demo 构建函数局部作用域，bindDemo 的解算器跨作用域
       引用时为 undefined —— 提升到页面脚本共享作用域 */
    var A26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (!stories) { root.textContent = 'stories 模块未加载'; }
    else if (id === 'final') { renderFinal(); }
    else { var ch = stories.get(id); if (!ch) { root.textContent = T('st.notFound'); } else { renderChapter(ch); } }

    function renderChapter(ch) {
      /* F1：清理上一章遗留的演示定时器（root.innerHTML 重建后旧 DOM 引用会空转） */
      if (window.__demoTimer) { clearInterval(window.__demoTimer); window.__demoTimer = null; }
      document.title = T(ch.titleKey) + Arcade.i18n.t('app.titleSuffix');
      // 更新（而非追加）description meta，避免重复/累积
      var meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.setAttribute('content', T(ch.titleKey + '.one'));

      stories.markRead(ch.id); // 读毕标记 +5 XP

      var idx = 0;
      stories.getAll().forEach(function (x, i) { if (x.id === ch.id) idx = i; });
      document.getElementById('sy-prog').textContent = T('st.chapterF').replace('{n}', idx + 1).replace('{t}', stories.getAll().length);

      var html = '<div class="sy-era">' + T(ch.era) + '</div>' +
        '<h1 class="sy-title">' + T(ch.titleKey) + '</h1>' +
        /* C6 入门友好度：TL;DR 折叠段 + 前置提示 */
        (function () {
          var base = ch.titleKey.replace(/\.t$/, '');
          var tldr = T(base + '.tldr');
          var pre = T(base + '.prereq');
          var s = '';
          if (tldr !== base + '.tldr') {
            s += '<details class="sy-tldr"><summary>⚡ ' + T('st.tldrLabel') + '</summary>' +
              '<div class="sy-tldr-body">' + tldr + '</div></details>';
          }
          if (pre && pre !== base + '.prereq') {
            s += '<div class="sy-prereq">📌 ' + pre + '</div>';
            var pl = T('st.prereqLabel');
            if (pl !== 'st.prereqLabel') s = s.replace('</div>', '</div>');
          }
          return s;
        })() +
        (ch.concept ? '<div class="sy-concept"><span class="sy-concept-ic">' + ch.concept.ic + '</span><span class="sy-concept-tx">' + (isStoryEn ? ch.concept.en : ch.concept.zh) + '</span></div>' : '') +
        (ch.region ? '<div class="sy-region">' + T('st.region') + '：' + T(ch.region) + '</div>' : '') +
        '<div class="sy-body">' + renderBody(T(ch.bodyKey), ch) + '</div>';
      if (ch.funFacts && T(ch.titleKey.replace(/\.t$/, '') + '.facts')) {
        var f1 = T(ch.titleKey.replace(/\.t$/, '') + '.facts');
        var f2 = T(ch.titleKey.replace(/\.t$/, '') + '.facts2');
        var factsHtml = '<div class="sy-facts">💡 ' + f1 + '</div>';
        if (f2 && f2.indexOf('facts2') < 0) factsHtml += '<div class="sy-facts">💡 ' + f2 + '</div>';
        html += factsHtml;
      }
      html += renderLetter(ch);
      html += renderGames(ch);
      html += renderDemo(ch);
      html += renderChallenge(ch);
      html += renderChapterQuiz(ch);
      html += renderExtend(ch);
      html += renderSources(ch);
      html += renderNav(ch);
      root.innerHTML = html;

      bindLetter(ch);
      bindChallenge(ch);
      bindDemo(ch);
      bindChapterQuiz(ch);
      bindPersonChips();
    }

    /* 正文术语注（P2 沉浸）：关键术语词 → hover 释义（随界面语言） */
    var GLOSS_NOTES = {
      '凯撒密码': { zh: '把字母表整体平移固定位数的替换密码', en: 'a substitution cipher shifting the alphabet by a fixed number' },
      '移位密码': { zh: '每个字母按固定偏移平移的密码', en: 'a cipher shifting every letter by a fixed offset' },
      '频率分析': { zh: '统计字母出现次数对照语言规律来破译', en: 'counting letter frequencies to match the language and break the cipher' },
      '替换密码': { zh: '每个字母按固定规则换成另一个字母', en: 'each letter replaced by another per a fixed rule' },
      '换位密码': { zh: '字母不变，只改变排列顺序', en: 'letters unchanged, only their order is scrambled' },
      '隐写术': { zh: '把秘密藏进普通载体，隐藏秘密的存在本身', en: 'hiding a secret inside an innocent carrier — hiding its very existence' },
      '一次性密码本': { zh: '密钥与明文等长且只用一次的密码，理论上不可破', en: 'a truly random key used once, provably unbreakable' },
      '已知明文': { zh: '破译者已知的明文片段，用作破译钩子', en: 'a plaintext fragment the breaker knows, used as a hook' },
      '明文': { zh: '加密前的原始文字', en: 'the original readable text' },
      '密文': { zh: '加密后无法直接读懂的文本', en: 'the scrambled text produced by encryption' },
      '密钥': { zh: '控制加解密方式的一串秘密参数', en: 'a secret parameter controlling encryption and decryption' },
      '维吉尼亚密码': { zh: '密钥逐字母选择字母表的多表替换密码', en: 'a polyalphabetic cipher choosing an alphabet per letter' },
      '加表': { zh: '附加在码组上的密钥数字表，定期换版、期内复用', en: 'an additive table superimposed on code groups, changed periodically' },
      '深度': { zh: '同版加表期内两封密电相减抵消加表，只剩明文差值', en: 'two messages under the same additive cancel it when subtracted' },
      '转子': { zh: 'Enigma 的核心旋转盘，每次按键步进一格改变接线', en: 'Enigma\'s core rotating disc, stepping one position per keypress' },
      '插线板': { zh: 'Enigma 前面板的字母对交换装置', en: 'Enigma\'s front-panel letter-pair swapping board' },
      '反射器': { zh: 'Enigma 内部使加密等于解密的固定反射盘', en: 'Enigma\'s fixed reflector making encryption equal decryption' },
      '差分': { zh: '相邻比特或块的异或差值，统计分析的起点', en: 'the XOR difference of adjacent bits or blocks, the start of statistical analysis' },
      '熵': { zh: '香农定义的信息不确定性度量，单位为比特', en: 'Shannon\'s measure of information uncertainty, in bits' },
      '完美保密': { zh: '密文与明文统计独立——OTP 的性质', en: 'ciphertext statistically independent of plaintext — OTP\'s property' },
      '公钥': { zh: '可公开分发的加密密钥，与私钥配对使用', en: 'the publicly shared key, paired with a private key' },
      '哈希碰撞': { zh: '两个不同输入产生同一哈希输出', en: 'two different inputs producing the same hash output' },
      'QKD': { zh: '量子密钥分发——利用量子力学原理安全分发密钥', en: 'Quantum Key Distribution — securely distributing keys via quantum mechanics' },
      '筛选密钥': { zh: 'BB84 中双方保留基匹配部分的原始密钥', en: 'the sifted key in BB84, keeping only matching-basis bits' },
      'QBER': { zh: '量子误码率——超过阈值即判定存在窃听', en: 'Quantum Bit Error Rate — above threshold, eavesdropping is detected' },
      '差分分析': { zh: '通过对比输入/输出差分来攻击分组密码', en: 'attacking block ciphers by comparing input/output differences' },
      '字验': { zh: '北宋以诗配军情的验证体系', en: 'the Song-dynasty poem-to-military-action verification system' },
      '反切码': { zh: '戚继光以两首诗的声母韵母交叉编密', en: 'Qi Jiguang\'s cipher crossing initials and finals from two poems' },
      '恩尼格玛': { zh: '二战德国最著名的转子密码机，转子—插线板—反射器组合实现多表替换', en: 'Germany\'s famous WWII cipher machine: rotors, plugboard, reflector' },
      '紫密': { zh: '二战日本最高级的预判密码，盟军称「紫」(Purple)，是一种机电式多表替换', en: 'the Japanese high-grade diplomatic cipher, called Purple, an electromechanical polyalphabetic' },
      '密码本': { zh: '预先编制的词→码组对照簿，战时定期换版，常以加表增强保密', en: 'a precompiled book mapping words to code groups, changed periodically, often with added tables' },
      '分组密码': { zh: '把明文切成固定大小块整体加密的密码，现代的 AES 是代表', en: 'a cipher encrypting fixed-size blocks of plaintext, like modern AES' },
      '哈希函数': { zh: '把任意长度输入映射到固定长度摘要的单向函数，用途为完整性校验', en: 'a one-way function mapping any input to a fixed-length digest for integrity checks' },
      '多表替换': { zh: '多个替换表轮流使用以掩盖字母频率，维吉尼亚密码是其代表', en: 'a cipher cycling several substitution alphabets to mask letter frequencies' },
      '椭圆曲线': { zh: '在椭圆曲线上定义群运算的公钥数学，现代密钥与签名的热门结构', en: 'a public-key math structure built on curves, used for modern keys and signatures' },
      '素数': { zh: '只能被 1 和自身整除的数，RSA 的安全性建立在大素数因子分解的难度上', en: 'a number divisible only by 1 and itself; RSA depends on factoring large ones' },
      '密钥交换': { zh: '双方在公开信道上协商出共享密钥而不泄露给窃听者的过程', en: 'two parties agreeing a shared secret over a public channel without leaking it' },
      '钓鱼': { zh: '伪装成可信机构骗取口令的社交工程攻击，与密码本身无关', en: 'a social-engineering attack impersonating a trusted party to steal credentials' },
      '象形文字': { zh: '古埃及的图画文字，罗塞塔石碑正是破译象形文字的钥匙', en: 'ancient Egyptian picture writing, unlocked by the Rosetta Stone' },
      '密电': { zh: '加密的电报，中途被截获也读不懂，战争年代的情报神经', en: 'an encrypted telegram: interceptable yet unreadable, the wartime nerves of intelligence' },
      '字母表': { zh: '一组有序字母的集合，替换与移位密码的操作空间', en: 'an ordered set of letters a substitution or shift cipher operates on' },
      '密码分析': { zh: '在不知密钥的前提下从密文推断明文或密钥，密码学的另一半', en: 'the art of breaking ciphers without the key — the other half of cryptography' }
    };
    function glossify(s) {
      var out = s;
      /* 保护已生成的 sy-person chip，避免术语词（如「凯撒密码」）误伤 chip 内文字 */
      var chips = [];
      out = out.replace(/<span class="sy-person"[\s\S]*?<\/span>/g, function (m) {
        chips.push(m);
        return '\u0000' + (chips.length - 1) + '\u0000';
      });
      for (var term in GLOSS_NOTES) {
        if (!GLOSS_NOTES.hasOwnProperty(term)) continue;
        var note = GLOSS_NOTES[term];
        var tip = isStoryEn ? note.en : note.zh;
        /* E3：触屏/键盘可用——点击或 Enter 弹出释义 toast */
        out = out.split(term).join('<span class="sy-gloss" tabindex="0" role="button" data-tip="' +
          String(tip).replace(/"/g, '&quot;') + '" title="' + String(tip).replace(/"/g, '&quot;') + '">' + term + '</span>');
      }
      out = out.replace(/\u0000(\d+)\u0000/g, function (m, i) { return chips[Number(i)]; });
      return out;
    }
    /* 正文：[[personId]] → chip；\n\n → 段落；zh 界面关键术语 → hover 释义 */
    function renderBody(body, ch) {
      // [[personId]] → chip；\n\n → 段落
      var s = String(body || '').replace(/\[\[([a-z]+)\]\]/g, function (m, pid) {
        var n = T('stp.' + pid + '.name');
        return '<span class="sy-person" data-person="' + pid + '">' + (n.indexOf('stp.') === 0 ? pid : n) + '</span>';
      });
      // 术语 hover 注：仅 zh 界面（en 正文是英文，避免误伤英文词）
      if (!isStoryEn) s = glossify(s);
      return s.split(/\n\s*\n/).map(function (p) { return '<p>' + p + '</p>'; }).join('');
    }
    function bindPersonChips() {
      var chips = root.querySelectorAll('.sy-person');
      for (var i = 0; i < chips.length; i++) {
        (function (el) {
          /* E3：触屏/键盘可达 */
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          var open = function () {
            var pid = el.getAttribute('data-person');
            if (Arcade.tutorial && Arcade.tutorial.profile) Arcade.tutorial.profile(pid);
            else if (Arcade.ui) Arcade.ui.toast(T('stp.' + pid + '.name') + ' — ' + T('stp.' + pid + '.quote'), 'info');
          };
          el.addEventListener('click', open);
          el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        })(chips[i]);
      }
      /* E3：术语注点击/Enter → toast 释义（title 悬停仍保留） */
      var gloss = root.querySelectorAll('.sy-gloss[data-tip]');
      for (var k = 0; k < gloss.length; k++) {
        (function (el) {
          var showTip = function () { if (Arcade.ui && Arcade.ui.toast) Arcade.ui.toast(el.getAttribute('data-tip'), 'info'); };
          el.addEventListener('click', showTip);
          el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTip(); } });
        })(gloss[k]);
      }
    }

    /* 密信 + 解算器 */
    function renderLetter(ch) {
      if (!ch.letter) return '';
      var got = stories.letters().indexOf(ch.id) >= 0;
      var hint = T(ch.titleKey.replace(/\.t$/, '') + '.lh');
      if (got) {
        return '<div class="sy-letter"><div class="sy-lt">📨 ' + T('st.letterGot') + '</div>' +
          '<div class="sy-msg" style="color:var(--neon-green)">' + T('st.letterDone') + ' 🔑 ' + (ch.letter.keyLetter || '?') + '</div></div>';
      }
      var cipher = ch.letter.cipher;
      var ciphertext = T(ch.titleKey.replace(/\.t$/, '') + '.lc');
      var solverHtml = solverUI(cipher);
      return '<div class="sy-letter">' +
        '<div class="sy-lt">📨 ' + T('st.letter') + '</div>' +
        '<div class="sy-lc">' + ciphertext + '</div>' +
        '<div class="sy-lh">' + hint + '</div>' +
        solverHtml +
        '<div class="sy-lrow">' +
        '<input id="sy-ans" placeholder="' + T('st.answerPh') + '" maxlength="40" autocomplete="off">' +
        '<button class="btn" id="sy-submit">' + T('st.submit') + '</button></div>' +
        '<div class="sy-msg" id="sy-msg"></div>' +
        '</div>';
    }
    function solverUI(cipher) {
      if (cipher === 'caesar') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sCaesar') + '</div><div class="sy-srow"><label>' + T('st.offset') + '</label><input id="sy-k" type="number" min="1" max="25" value="3"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'affine') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sAffine') + '</div><div class="sy-srow"><label>a</label><input id="sy-a" type="number" min="1" max="25" value="5"><label>b</label><input id="sy-b" type="number" min="0" max="25" value="8"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'rail') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sRail') + '</div><div class="sy-srow"><label>' + T('st.rails') + '</label><input id="sy-k" type="number" min="2" max="5" value="3"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'vigenere') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sVigenere') + '</div><div class="sy-srow"><label>' + T('st.key') + '</label><input id="sy-k" class="key" maxlength="12" value="KEY"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'bacon') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sBacon') + '</div><div class="sy-srow"><button class="btn" id="sy-solve">' + T('st.decode') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'xor') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sXor') + '</div><div class="sy-srow"><label>' + T('st.key') + '</label><input id="sy-k" class="key" maxlength="12" value="XOR"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'playfair') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sPlayfair') + '</div><div class="sy-srow"><label>' + T('st.key') + '</label><input id="sy-k" class="key" maxlength="12" value="KEY"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'hill') return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sHill') + '</div><div class="sy-srow"><label>K</label><input id="sy-a" type="number" min="1" max="25" value="3"><input id="sy-b" type="number" min="0" max="25" value="2"><input id="sy-c" type="number" min="0" max="25" value="2"><input id="sy-d" type="number" min="1" max="25" value="1"><button class="btn" id="sy-solve">' + T('st.preview') + '</button></div><div class="sy-preview" id="sy-preview"></div></div>';
      if (cipher === 'substitution') {
        // 单表替换：显示替换表（明文→密文 QWERTY 表），玩家对照手工解码
        return '<div class="sy-solver"><div class="sy-st">🧪 ' + T('st.solver') + ' · ' + T('st.sSub') + '（' + T('st.sSubHint') + '）</div>' +
          '<div class="sy-srow" style="font-family:var(--font-pixel);font-size:12px;color:var(--neon-cyan);gap:2px">' +
          '<span>' + T('st.sSubPlain') + '</span><span style="color:var(--text-dim)"> ↓</span></div>' +
          '<div class="sy-srow" style="font-family:var(--font-pixel);font-size:13px;color:var(--neon-yellow);letter-spacing:2px">QWERTYUIOPASDFGHJKLZXCVBNM</div>' +
          '<div class="sy-preview" id="sy-preview" style="margin-top:6px"></div></div>';
      }
      return '';
    }
    function bindLetter(ch) {
      var solveBtn = document.getElementById('sy-solve');
      if (solveBtn) solveBtn.addEventListener('click', function () { doPreview(ch); });
      var submit = document.getElementById('sy-submit');
      if (submit) submit.addEventListener('click', function () { doSubmit(ch); });
      var ans = document.getElementById('sy-ans');
      if (ans) ans.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSubmit(ch); });
    }
    function doPreview(ch) {
      var cipher = ch.letter.cipher;
      var ct = T(ch.titleKey.replace(/\.t$/, '') + '.lc');
      var opts = { ciphertext: ct };
      var g = function (x) { var el = document.getElementById(x); return el ? el.value : ''; };
      if (cipher === 'caesar' || cipher === 'rail') opts.k = g('sy-k');
      if (cipher === 'affine') { opts.a = g('sy-a'); opts.b = g('sy-b'); }
      if (cipher === 'vigenere' || cipher === 'xor' || cipher === 'playfair') opts.key = g('sy-k');
      if (cipher === 'hill') { opts.k11 = g('sy-a'); opts.k12 = g('sy-b'); opts.k21 = g('sy-c'); opts.k22 = g('sy-d'); }
      var out = stories.solver(cipher, opts);
      var pv = document.getElementById('sy-preview');
      if (pv) pv.textContent = out || '—';
    }
    function doSubmit(ch) {
      var ans = document.getElementById('sy-ans');
      var msg = document.getElementById('sy-msg');
      if (!ans || !msg) return;
      var r = stories.submitLetter(ch.id, ans.value);
      if (r.ok) {
        msg.innerHTML = '<span style="color:var(--neon-green)">' + T('st.letterWin').replace('{k}', r.keyLetter) + '</span>';
        if (Arcade.audio) Arcade.audio.play('win');
        if (Arcade.juice) Arcade.juice.win();
      } else {
        msg.innerHTML = '<span style="color:var(--neon-pink)">' + T('st.letterFail') + '</span>';
        if (Arcade.audio) Arcade.audio.play('error');
      }
    }

    /* 游戏卡（D1 分层：🔐 核心密码局 / 🎲 时代彩蛋） */
    function gameCard(ch, gid) {
      var g = null;
      (window.GAMES || []).forEach(function (x) { if (x.id === gid) g = x; });
      if (!g) return '';
      var done = Arcade.storage && Arcade.storage.getBest(gid) !== null;
      return '<a class="sy-game" href="' + g.path + '">' +
        '<span class="sy-gicon">' + g.icon + '</span>' +
        '<span class="sy-gname">' + T('g.' + gid + '.t') + '</span>' +
        '<span class="sy-gtag">' + T(ch.titleKey.replace(/\.t$/, '') + '.g' + (ch.games.indexOf(gid) + 1)) + '</span>' +
        (done ? '<span class="sy-gdone">✅ ' + T('st.done') + '</span>' : '<span class="sy-gdone">' + T('st.play') + ' →</span>') +
        '</a>';
    }
    function renderGames(ch) {
      var core = ch.core || [];
      var isCore = {};
      core.forEach(function (c) { isCore[c] = 1; });
      var coreHtml = '', bonusHtml = '';
      ch.games.forEach(function (gid) {
        var card = gameCard(ch, gid);
        if (!card) return;
        if (isCore[gid]) coreHtml += card; else bonusHtml += card;
      });
      /* 全章皆核心或全为彩蛋时，保持单一分组 */
      if (!core.length || !bonusHtml) {
        var all = '';
        ch.games.forEach(function (gid) { all += gameCard(ch, gid); });
        return '<div class="sy-games"><div class="sy-gt">🎮 ' + T('st.chapterGames') + '</div>' + all + '</div>';
      }
      return '<div class="sy-games"><div class="sy-gt">🎮 ' + T('st.chapterGames') + '</div>' +
        '<div class="sy-gsub">🔐 ' + T('st.coreGames') + '</div>' + coreHtml +
        '<div class="sy-gsub" style="margin-top:10px">🎲 ' + T('st.bonusGames') + '</div>' + bonusHtml +
        '</div>';
    }

    /* ⚙️ 原理演示（P3 教育深化）：按章节显示对应密码的动画示意 */
    function renderDemo(ch) {
      var demo = ch.demo;
      if (!demo) return '';
      var html = '<div class="sy-demo"><div class="sy-demo-title">⚙️ ' + T('st.demoTitle') + '</div>';
      if (demo === 'caesar') html += demoCaesar();
      else if (demo === 'vigenere') html += demoVigenere();
      else if (demo === 'enigma') html += demoEnigma();
      else if (demo === 'affine') html += demoAffine();
      else if (demo === 'playfair') html += demoPlayfair();
      else if (demo === 'xor') html += demoXor();
      else if (demo === 'rail') html += demoRail();
      else if (demo === 'rosetta') html += demoRosetta();
      else if (demo === 'purple') html += demoPurple();
      else if (demo === 'venona') html += demoVenona();
      else if (demo === 'entropy') html += demoEntropy();
      else if (demo === 'bb84') html += demoBb84();
      html += '</div>';
      return html;
    }
    /* A26 已提升至共享作用域（见文件头部说明），此处仅复用 */
    function demoCaesar() {
      return '<div class="sy-demo-body" id="dm-caesar">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">明文</span><span class="sy-demo-plain" id="dm-plain">HELLO</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">偏移</span><input type="range" id="dm-off" min="0" max="25" value="3" style="flex:1;accent-color:var(--neon-cyan)"><b id="dm-offv" class="sy-demo-val">3</b></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密文</span><span class="sy-demo-cipher" id="dm-cipher">KHOOR</span></div>' +
        '<div class="sy-demo-wheel" id="dm-wheel"></div></div>';
    }
    function demoVigenere() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密钥</span><span class="sy-demo-plain" id="dv-key">KEY</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">明文</span><span class="sy-demo-plain" id="dv-plain">HELLO</span></div>' +
        '<div class="sy-demo-table" id="dv-table"></div>' +
        '<div class="sy-demo-note">' + T('st.demoVigNote') + '</div></div>';
    }
    function demoEnigma() {
      return '<div class="sy-demo-body sy-demo-enigma">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">转子</span>' +
        '<span class="sy-demo-rotor" id="de-r1">A</span><span class="sy-demo-rotor" id="de-r2">A</span><span class="sy-demo-rotor" id="de-r3">A</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">按键</span><span class="sy-demo-plain" id="de-key">A</span>' +
        '<span class="sy-demo-arrow">→</span><span class="sy-demo-cipher" id="de-out">?</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoEnigmaNote') + '</div></div>';
    }
    function demoAffine() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">明文</span><span class="sy-demo-plain" id="da-plain">HELLO</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">a</span><input type="range" id="da-a" min="1" max="12" value="5" style="flex:1;accent-color:var(--neon-pink)"><b id="da-av" class="sy-demo-val">5</b></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">b</span><input type="range" id="da-b" min="0" max="25" value="8" style="flex:1;accent-color:var(--neon-pink)"><b id="da-bv" class="sy-demo-val">8</b></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密文</span><span class="sy-demo-cipher" id="da-cipher">IZZISG</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoAffineNote') + '</div></div>';
    }
    function demoPlayfair() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密钥</span><span class="sy-demo-plain" id="dp-key">MONARCHY</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">明文</span><span class="sy-demo-plain" id="dp-plain">HELLO</span></div>' +
        '<div class="sy-demo-table" id="dp-table"></div>' +
        '<div class="sy-demo-note">' + T('st.demoPlayfairNote') + '</div></div>';
    }
    function demoXor() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密钥</span><span class="sy-demo-plain" id="dx-key">KEY</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">明文</span><span class="sy-demo-plain" id="dx-plain">CAT</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密文(hex)</span><span class="sy-demo-cipher" id="dx-cipher">0d1e0e</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoXorNote') + '</div></div>';
    }
    function demoRail() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">轨道</span><input type="range" id="dr-n" min="2" max="5" value="3" style="flex:1;accent-color:var(--neon-green)"><b id="dr-nv" class="sy-demo-val">3</b></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">明文</span><span class="sy-demo-plain" id="dr-plain">ATTACKATDAWN</span></div>' +
        '<div class="sy-demo-zigzag" id="dr-zig"></div>' +
        '<div class="sy-demo-note">' + T('st.demoRailNote') + '</div></div>';
    }
    /* 罗塞塔三语对照（dawn） */
    function demoRosetta() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-note" style="margin-bottom:8px">同一句诏令 · 三种文字 · 破译靠对照</div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">象形</span><span class="sy-demo-plain" id="dr-hiero" style="font-size:18px">𓂀𓁈𓂋𓄿𓈖</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">世俗</span><span class="sy-demo-cipher" id="dr-demo">(象形文字的草书体)</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">希腊</span><span class="sy-demo-plain" id="dr-greek">PTOLEMAIOS</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoRosettaNote') + '</div></div>';
    }
    /* 紫密双路置换（purple） */
    function demoPurple() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-note" style="margin-bottom:8px">26 字母分两路：六元音 + 二十辅音，各自置换后合流</div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">元音路</span><span class="sy-demo-plain" id="dp-vow">A E I O U Y → 6 档步进开关</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">辅音路</span><span class="sy-demo-cipher" id="dp-con">B C D F G H J K L M N P Q R S T V W X Z → 20 档</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoPurpleNote') + '</div></div>';
    }
    /* VENONA 密钥复用（venona） */
    function demoVenona() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-note" style="margin-bottom:8px">两封电文共享同一密钥流 → 相减抵消密钥</div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">电文A</span><span class="sy-demo-plain" id="dv-a">SECRET</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">电文B</span><span class="sy-demo-cipher" id="dv-b">AGENTS</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密钥</span><span class="sy-demo-val" id="dv-key2">XQKMZP（两封共用）</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">异或差</span><span class="sy-demo-plain" id="dv-xor">SECRET ⊕ AGENTS = 可分析的差异</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoVenonaNote') + '</div></div>';
    }
    /* 熵与密钥长度（modern） */
    function demoEntropy() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">密钥长</span><input type="range" id="de-len" min="1" max="12" value="1" style="flex:1;accent-color:var(--neon-purple)"><b id="de-lenv" class="sy-demo-val">1/12</b></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">安全度</span><span class="sy-demo-plain" id="de-safe">极低 —— 可被穷举</span></div>' +
        '<div class="sy-demo-note">' + T('st.demoEntropyNote') + '</div></div>';
    }
    /* BB84 量子密钥分发（quantum） */
    function demoBb84() {
      return '<div class="sy-demo-body">' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">窃听者</span><button class="btn" id="db-eve" style="padding:3px 12px;font-size:11px">Eve 关</button>' +
        '<span class="sy-demo-val" id="db-stat" style="margin-left:auto">筛选 0 位 · 误码 —</span></div>' +
        '<div class="sy-demo-row"><span class="sy-demo-lbl">筛选密钥</span><span class="sy-demo-cipher" id="db-log" style="letter-spacing:2px;word-break:break-all">—</span></div>' +
        '<div class="sy-demo-row"><button class="btn yellow" id="db-send" style="padding:6px 16px;font-size:12px">发射光子 ▶</button>' +
        '<span class="sy-demo-val" id="db-last"></span></div>' +
        '<div class="sy-demo-note">' + T('st.demoBb84Note') + '</div></div>';
    }
    function bindDemo(ch) {
      if (ch.demo === 'caesar') {
        var off = document.getElementById('dm-off'), plain = document.getElementById('dm-plain');
        var cipher = document.getElementById('dm-cipher'), offv = document.getElementById('dm-offv');
        var wheel = document.getElementById('dm-wheel');
        if (!off || !plain || !cipher) return;
        function drawWheel(k) {
          var w = '';
          for (var i = 0; i < 26; i++) {
            var shifted = A26[(i + k) % 26];
            w += '<span class="dm-wcell' + (i === 0 ? ' on' : '') + '">' + A26[i] + '<i>' + shifted + '</i></span>';
          }
          if (wheel) wheel.innerHTML = w;
        }
        function enc(s, k) {
          return s.split('').map(function (c) {
            var x = A26.indexOf(c);
            return x < 0 ? c : A26[(x + k) % 26];
          }).join('');
        }
        function update() {
          var k = parseInt(off.value, 10);
          offv.textContent = k;
          cipher.textContent = enc(plain.textContent, k);
          drawWheel(k);
        }
        off.addEventListener('input', update);
        update();
      } else if (ch.demo === 'vigenere') {
        var table = document.getElementById('dv-table');
        var key = document.getElementById('dv-key'), p = document.getElementById('dv-plain');
        if (!table || !key || !p) return;
        function drawTable() {
          var rows = '';
          for (var r = 0; r < 5; r++) {
            var cells = '';
            for (var c = 0; c < 26; c++) cells += '<span>' + A26[(c + r) % 26] + '</span>';
            rows += '<div class="dv-row">' + cells + '</div>';
          }
          table.innerHTML = rows;
        }
        drawTable();
      } else if (ch.demo === 'enigma') {
        var key = document.getElementById('de-key'), out = document.getElementById('de-out');
        var r1 = document.getElementById('de-r1'), r2 = document.getElementById('de-r2'), r3 = document.getElementById('de-r3');
        if (!key || !out) return;
        var tick = 0;
        function step() {
          tick++;
          var s = String.fromCharCode(65 + (tick % 26));
          if (r1) r1.textContent = String.fromCharCode(65 + (tick % 26));
          if (r2) r2.textContent = String.fromCharCode(65 + Math.floor(tick / 26) % 26);
          if (r3) r3.textContent = String.fromCharCode(65 + Math.floor(tick / 676) % 26);
          if (key) key.textContent = s;
          // 简化 Enigma：输出 = 输入字母经转子置换（这里演示转子转动效果）
          if (out) out.textContent = A26[(A26.indexOf(s) + 1 + tick % 7) % 26];
        }
        step();
        window.__demoTimer = setInterval(step, 600);
      } else if (ch.demo === 'affine') {
        var aIn = document.getElementById('da-a'), bIn = document.getElementById('da-b');
        var av = document.getElementById('da-av'), bv = document.getElementById('da-bv');
        var out = document.getElementById('da-cipher'), plain = document.getElementById('da-plain');
        if (!aIn || !bIn || !out) return;
        function affineEnc(s, a, b) {
          return s.split('').map(function (c) {
            var x = A26.indexOf(c);
            return x < 0 ? c : A26[((a * x + b) % 26 + 26) % 26];
          }).join('');
        }
        function upd() {
          var a = parseInt(aIn.value, 10), b = parseInt(bIn.value, 10);
          av.textContent = a; bv.textContent = b;
          out.textContent = affineEnc(plain.textContent, a, b);
        }
        aIn.addEventListener('input', upd);
        bIn.addEventListener('input', upd);
        upd();
      } else if (ch.demo === 'playfair') {
        var table = document.getElementById('dp-table');
        var keyEl = document.getElementById('dp-key');
        if (!table || !keyEl) return;
        var seen = {}, t = [];
        (keyEl.textContent.toUpperCase() + A26).split('').forEach(function (c) {
          if (c === 'J') c = 'I';
          if (!seen[c]) { seen[c] = 1; t.push(c); }
        });
        var rows = '';
        for (var r = 0; r < 5; r++) {
          var cells = '';
          for (var c = 0; c < 5; c++) cells += '<span style="color:var(--neon-cyan)">' + t[r * 5 + c] + '</span>';
          rows += '<div class="dv-row">' + cells + '</div>';
        }
        table.innerHTML = rows;
      } else if (ch.demo === 'xor') {
        var xk = document.getElementById('dx-key'), xp = document.getElementById('dx-plain');
        var xo = document.getElementById('dx-cipher');
        if (!xk || !xp || !xo) return;
        function xorHex(s, key) {
          var out = '';
          for (var i = 0; i < s.length; i++) {
            out += ('0' + (s.charCodeAt(i) ^ key.charCodeAt(i % key.length)).toString(16)).slice(-2);
          }
          return out;
        }
        xo.textContent = xorHex(xp.textContent, xk.textContent);
      } else if (ch.demo === 'rail') {
        var nIn = document.getElementById('dr-n'), nv = document.getElementById('dr-nv');
        var zig = document.getElementById('dr-zig'), pl = document.getElementById('dr-plain');
        if (!nIn || !zig || !pl) return;
        function draw() {
          var rails = parseInt(nIn.value, 10);
          nv.textContent = rails;
          var s = pl.textContent;
          var rows = [];
          for (var i = 0; i < rails; i++) rows.push([]);
          var r = 0, dir = 1;
          for (var j = 0; j < s.length; j++) {
            rows[r].push({ ch: s.charAt(j), on: true });
            r += dir;
            if (r === rails - 1) dir = -1;
            if (r === 0) dir = 1;
          }
          var html = '';
          for (var ri = 0; ri < rails; ri++) {
            var line = '<div class="dv-row">';
            for (var ci = 0; ci < s.length; ci++) {
              var cell = rows[ri][ci];
              line += '<span style="' + (cell ? 'color:var(--neon-green)' : 'color:transparent') + '">' + (cell ? cell.ch : '·') + '</span>';
            }
            html += line + '</div>';
          }
          zig.innerHTML = html;
        }
        nIn.addEventListener('input', draw);
        draw();
      } else if (ch.demo === 'entropy') {
        var lenIn = document.getElementById('de-len'), lenv = document.getElementById('de-lenv');
        var safe = document.getElementById('de-safe');
        if (!lenIn || !safe) return;
        var TIPS = [
          '极低 —— 可被穷举（如凯撒只有 25 种）',
          '很低 —— 常见词可破',
          '低 —— 需要足够密文',
          '中低 —— 已需频率分析',
          '中等 —— 现代密码的下限',
          '中高 —— 日常加密（128 位即此量级）',
          '高 —— 接近军用标准',
          '很高 —— 暴力破解需天文时间',
          '极高 —— 密钥空间远超宇宙原子数',
          '超高 —— 量子计算机也难',
          '近乎完美 —— 接近一次性密码本',
          '完美保密 —— 密钥=明文长度（香农）'
        ];
        function upd() {
          var v = parseInt(lenIn.value, 10);
          lenv.textContent = v + '/12';
          safe.textContent = v >= 12 ? '✅ 完美保密 —— 密钥与明文等长' : TIPS[v - 1];
          safe.style.color = v >= 12 ? 'var(--neon-green)' : (v >= 8 ? 'var(--neon-cyan)' : 'var(--neon-pink)');
        }
        lenIn.addEventListener('input', upd);
        upd();
      } else if (ch.demo === 'bb84') {
        var send = document.getElementById('db-send'), eveBtn = document.getElementById('db-eve');
        var log = document.getElementById('db-log'), stat = document.getElementById('db-stat');
        var lastInfo = document.getElementById('db-last');
        if (!send || !eveBtn) return;
        var eveOn = false, sifted = 0, errs = 0, stream = '';
        function rnd2() { return Math.random() < 0.5 ? 0 : 1; }
        eveBtn.addEventListener('click', function () {
          eveOn = !eveOn;
          eveBtn.textContent = eveOn ? 'Eve 开 ⚠' : 'Eve 关';
          eveBtn.style.color = eveOn ? 'var(--neon-pink)' : '';
        });
        send.addEventListener('click', function () {
          var aBit = rnd2(), aBase = rnd2(), bBase = rnd2();
          var wire = aBit;
          var eveFlip = false;
          if (eveOn && rnd2() !== aBase) { /* Eve 选错基：测得比特随机化 */
            wire = rnd2();
            eveFlip = wire !== aBit;
          }
          var kept = aBase === bBase;
          if (kept) {
            sifted++;
            if (wire !== aBit) errs++;
            stream += wire;
            if (stream.length > 24) stream = stream.slice(-24);
            log.textContent = stream;
            lastInfo.textContent = '基匹配 → 保留 ' + wire + (wire !== aBit ? ' ✕（误码）' : ' ✓');
          } else {
            lastInfo.textContent = '基不一致 → 该位丢弃';
          }
          lastInfo.style.color = (kept && wire !== aBit) ? 'var(--neon-pink)' : 'var(--text-dim)';
          stat.textContent = '筛选 ' + sifted + ' 位 · 误码 ' + errs + '（' + (sifted ? Math.round(errs / sifted * 100) : 0) + '%）';
          stat.style.color = (sifted >= 8 && errs / sifted > 0.12) ? 'var(--neon-pink)' : '';
        });
      } else if (ch.demo === 'rosetta' || ch.demo === 'purple' || ch.demo === 'venona') {
        /* 静态演示：无交互绑定，仅展示 */
      }
    }

    /* 史料来源（P1    /* 本章延伸（C1 互链工程）：术语 ×N → 词典 / 测验场 / 协议实验室 */
    function renderExtend(ch) {
      var terms = (window.GLOSSARY || []).filter(function (g) {
        return (g.chapters || []).indexOf(ch.id) >= 0;
      });
      if (!terms.length && ch.id !== 'quantum') return '';
      var html = '<div class="sy-extend"><div class="sy-st">🧭 ' + T('st.extendTitle') + '</div>';
      if (terms.length) {
        var shown = terms.slice(0, 6);
        html += '<div class="sy-extend-terms">' + shown.map(function (g) {
          return '<a class="sy-ext-term" href="glossary.html">' + g.term + '</a>';
        }).join('') +
        (terms.length > 6 ? '<span class="sy-ext-more">+' + (terms.length - 6) + '</span>' : '') + '</div>' +
        '<a class="sy-ext-link" href="glossary.html">📖 ' + T('st.extendGlossary') + '</a>';
      }
      html += '<a class="sy-ext-link" href="quiz.html">🎯 ' + T('nav.quiz') + '</a>' +
        '<a class="sy-ext-link" href="protocols.html">🛡️ ' + T('nav.protocols') + '</a>' +
        '<a class="sy-ext-link" href="workshop.html">🔬 ' + T('nav.workshop') + '</a>' +
        '</div>';
      return html;
    }

    /* 每章真实文献 + 进阶书单（P3）+ 统一免责声明 */
    function renderSources(ch) {
      if ((!ch.sources || !ch.sources.length) && (!ch.reads || !ch.reads.length)) return '';
      var html = '<div class="sy-sources"><div class="sy-st">📚 ' + T('st.sourcesTitle') + '</div>';
      if (ch.sources && ch.sources.length) {
        html += '<ul>' + ch.sources.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
      }
      if (ch.reads && ch.reads.length) {
        html += '<div class="sy-reads-title">📖 ' + T('st.readsTitle') + '</div>' +
          '<ul>' + ch.reads.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>';
      }
      html += '<div class="sy-src-note">' + T('st.sourcesNote') + '</div></div>';
      return html;
    }

    /* 导航 */
    function renderNav(ch) {
      var prev = ch.prev, next = ch.next;
      var html = '<div class="sy-nav">' +
        '<a href="story.html?id=' + (prev || '') + '" class="' + (prev ? '' : 'disabled') + '">◀ ' + T('st.prev') + '</a>' +
        '<a href="stories.html">' + T('st.backList') + '</a>' +
        '<a href="story.html?id=' + (next || '') + '" class="' + (next ? '' : 'disabled') + '">' + T('st.next') + ' ▶</a>' +
        '</div>';
      /* 叙事评审 Top3：下章预告钩子（st.cN.next 存在才渲染） */
      if (next) {
        var hkKey = ch.titleKey.replace(/\.t$/, '') + '.next';
        var hkTxt = T(hkKey);
        if (hkTxt !== hkKey) html += '<div class="sy-nexthook">▸ ' + hkTxt + '</div>';
      }
      return html;
    }

    /* 历史重现 mini-challenge（系统 E）：每章 ≤1 个，复用现有算法 */
    function renderChapterQuiz(ch) {
      if (!window.CHAPTER_QUIZ || !CHAPTER_QUIZ.QUIZ[ch.id]) return '';
      var qs = CHAPTER_QUIZ.QUIZ[ch.id];
      var isEn = !!isStoryEn;
      var mastered = CHAPTER_QUIZ.isMastered(ch.id);
      var html = '<div class="sy-letter" style="border-color:rgba(185,103,255,.4);background:linear-gradient(180deg,rgba(185,103,255,.06),rgba(0,0,0,.25))">' +
        '<div class="sy-lt">🧠 ' + T('st.chqTitle') + (mastered ? ' <span style="color:var(--neon-green)">✅</span>' : '') + '</div>' +
        '<div class="sy-lh">' + T('st.chqSub') + '</div>';
      for (var i = 0; i < qs.length; i++) {
        var q = qs[i];
        var qd = isEn ? q.en : q.zh;
        var opts = '';
        var KEYS = ['A', 'B', 'C', 'D'];
        for (var j = 0; j < qd.opts.length; j++) {
          opts += '<button class="sy-chq-opt" data-q="' + i + '" data-i="' + j + '"><span class="sy-chq-k">' + KEYS[j] + '</span>' + qd.opts[j] + '</button>';
        }
        html += '<div class="sy-chq-q" data-q="' + i + '">' +
          '<div class="sy-chq-tx">' + (i + 1) + '. ' + qd.q + '</div>' +
          '<div class="sy-chq-opts">' + opts + '</div>' +
          '<div class="sy-chq-fb" id="sy-chq-fb-' + i + '"></div></div>';
      }
      html += '</div>';
      return html;
    }

    function bindChapterQuiz(ch) {
      if (!window.CHAPTER_QUIZ || !CHAPTER_QUIZ.QUIZ[ch.id]) return;
      var isEn = !!isStoryEn;
      var mastered = CHAPTER_QUIZ.isMastered(ch.id);
      if (mastered) return;
      var btns = root.querySelectorAll('.sy-chq-opt');
      var counts = { correct: 0, answered: 0 };
      var answeredFlags = {};
      for (var b = 0; b < btns.length; b++) {
        (function (btn) {
          btn.addEventListener('click', function () {
            var qi = btn.getAttribute('data-q');
            var oi = parseInt(btn.getAttribute('data-i'), 10);
            if (answeredFlags[qi]) return;
            answeredFlags[qi] = true;
            var q = CHAPTER_QUIZ.QUIZ[ch.id][parseInt(qi, 10)];
            var qd = isEn ? q.en : q.zh;
            var right = oi === q.a;
            if (right) counts.correct++;
            counts.answered++;
            var opts = root.querySelectorAll('.sy-chq-opt[data-q="' + qi + '"]');
            for (var k = 0; k < opts.length; k++) {
              var oo = parseInt(opts[k].getAttribute('data-i'), 10);
              if (oo === q.a) opts[k].classList.add('right');
              else if (oo === oi && !right) opts[k].classList.add('wrong');
              else opts[k].classList.add('dim');
              opts[k].disabled = true;
            }
            var fb = document.getElementById('sy-chq-fb-' + qi);
            if (fb) {
              fb.className = 'sy-chq-fb ' + (right ? 'ok' : 'no');
              fb.textContent = (right ? (isEn ? '✓ Correct' : '✓ 答对了') : (isEn ? '✗ ' + qd.opts[q.a] : '✗ 正确答案：' + qd.opts[q.a])) + ' — ' + qd.e;
            }
            /* 答完本章全部题目：≥2 正确 → 精通 */
            if (counts.answered === qs.length && counts.correct >= 2) {
              CHAPTER_QUIZ.markMastered(ch.id);
              if (Arcade.ui && Arcade.ui.toast) {
                setTimeout(function () { Arcade.ui.toast(isEn ? '🏆 Chapter mastered!' : '🏆 本章精通！', 'win'); }, 400);
              }
            }
          });
        })(btns[b]);
      }
    }

    function renderChallenge(ch) {
      if (!ch.challenge || stories.isChallengeDone(ch.id)) return '';
      var c = T(ch.titleKey.replace(/\.t$/, '') + '.ch');
      if (!c || c.indexOf('st.c') === 0) return '';
      var html = '<div class="sy-letter" style="border-color:rgba(255,230,0,.4);background:linear-gradient(180deg,rgba(255,230,0,.06),rgba(0,0,0,.25))">' +
        '<div class="sy-lt">🏆 ' + T('st.challenge') + '</div>' +
        '<div class="sy-lh">' + c + '</div>';
      if (ch.challenge === 'freq') {
        html += challengeFreq();
      } else if (ch.challenge === 'enigma60') {
        html += challengeEnigma();
      } else if (ch.challenge === 'af-trap') {
        html += challengeAF();
      } else if (ch.challenge === 'delta') {
        html += challengeDelta();
      } else if (ch.challenge === 'hill-mat') {
        html += challengeHill();
      } else if (ch.challenge === 'caesar-manual') {
        html += challengeCaesar();
      } else if (ch.challenge === 'freq-most') {
        html += challengeFreqMost();
      } else if (ch.challenge === 'bacon-5bit') {
        html += challengeBacon();
      } else if (ch.challenge === 'adfgvx-name') {
        html += challengeADFGVX();
      } else if (ch.challenge === 'otp-reuse') {
        html += challengeOTP();
      } else if (ch.challenge === 'purple-vowels') {
        html += challengePurple();
      } else if (ch.challenge === 'qber') {
        html += challengeQber();
      }
      html += '<div class="sy-msg" id="sy-ch-msg"></div></div>';
      return html;
    }
    function challengeFreq() {
      // 频率分析认知题：统计下方密文（Q 出现 5 次最多），答最高频密文字母对应的英文字母
      return '<div class="sy-solver"><div class="sy-st">统计这段密文里哪个字母出现最多？<br><b style="color:var(--neon-cyan)">QBMQN KQMT Q XQMF QKQ</b><br><span style="color:var(--text-dim)">（出现最多的密文字母，通常对应英文最高频的 E）</span></div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="1" style="width:50px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeEnigma() {
      // 简化 Enigma 挑战：认知题——识别 crib 起始字母（本章故事里提到 Bombe 用已知明文扫描）
      return '<div class="sy-solver"><div class="sy-st">Bombe 的诀窍是「已知明文 crib」。请回答：本章 Bombe 扫描时依靠的已知明文片段是哪个词？<br><span style="color:var(--text-dim)">（提示：它也是本章密信的答案开头）</span></div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="12" style="width:130px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeAF() {
      // 两封电文，找含 AF 的那封
      return '<div class="sy-solver"><div class="sy-st">两封截获电文：<br>① <b style="color:var(--neon-cyan)">ENEMY CARRIERS SPOTTED NEAR MIDWAY</b><br>② <b style="color:var(--neon-cyan)">AF FRESH WATER SHORTAGE</b></div>' +
        '<div class="sy-srow"><label>' + T('st.chPick') + '</label><input id="sy-ch-in" maxlength="2" style="width:50px" placeholder="1/2"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeDelta() {
      // 两段 5-bit 流找相同段
      return '<div class="sy-solver"><div class="sy-st">两段 5-bit 电传流：<br>① <b style="color:var(--neon-cyan)">01011 01100 10101 11001</b><br>② <b style="color:var(--neon-cyan)">01011 01100 10010 11100</b></div>' +
        '<div class="sy-srow"><label>' + T('st.chBits') + '</label><input id="sy-ch-in" maxlength="6" style="width:70px" placeholder="01011"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeHill() {
      // 2×2 希尔：K=[[3,2],[2,3]]（det=5 与 26 互质），密文 KYTH 解出 MATH
      return '<div class="sy-solver"><div class="sy-st">K = [3 2; 2 3]（det=5，与 26 互质）· 密文 <b style="color:var(--neon-cyan)">KYTH</b>（mod 26，A=0，两两分组列向量）</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="4" style="width:80px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeCaesar() {
      // 凯撒手动移位：RUGHU WKH OHJLRQV 偏移 3 → ORDER THE LEGIONS，答首词 ORDER
      return '<div class="sy-solver"><div class="sy-st">把 <b style="color:var(--neon-cyan)">RUGHU WKH OHJLRQV</b> 每个字母前移 3 位（A→X、B→Y…），还原凯撒的军令。</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="5" style="width:80px" placeholder="5 字母"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeFreqMost() {
      // 频率认知：RTEGRT ZIT QKQW DTLLQUT 中 T 出现 5 次最多 → 对应 E；答出现最多的密文字母 T
      return '<div class="sy-solver"><div class="sy-st">统计 <b style="color:var(--neon-cyan)">RTEGRT ZIT QKQW DTLLQUT</b> 里每个字母的次数——哪个密文字母出现最多？（答这个密文字母本身）</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="1" style="width:50px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeBacon() {
      // 培根 5 位：AABAA = 00100 = 4 = E（A=0 B=1，A-Z 编为 0-25）
      return '<div class="sy-solver"><div class="sy-st">培根双字体：A=0、B=1，5 位一组换算成数字（A-Z 编为 0-25）。解码 <b style="color:var(--neon-cyan)">AABAA</b>。</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="1" style="width:50px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeADFGVX() {
      // 认知题：6×6 方阵 + 列换位 = ADFGVX
      return '<div class="sy-solver"><div class="sy-st">1918 年德军启用的双层密码：先用 <b style="color:var(--neon-cyan)">6×6 波利比奥斯方阵</b>把字母换成六个符号，再按密钥做列换位。这六个符号组成的名字是？</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="6" style="width:90px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeOTP() {
      // VENONA 认知：一次性密码本被复用 → key reuse
      return '<div class="sy-solver"><div class="sy-st">一次性密码本本不可破——但苏联人把同一本用了一遍又一遍。这个致命失误，英文怎么称呼？（一个词）</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="8" style="width:110px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengePurple() {
      // 紫密认知：六个元音走「六段路」、二十辅音走「二十段路」，各自置换后合流
      return '<div class="sy-solver"><div class="sy-st">紫密把 26 个字母拆成两条路：<b style="color:var(--neon-cyan)">六元音路</b>与<b style="color:var(--neon-cyan)">二十辅音路</b>，各自置换后再合流。回答：这套双路置换总共覆盖多少个字母？</div>' +
        '<div class="sy-srow"><label>' + T('st.chPlain') + '</label><input id="sy-ch-in" maxlength="2" style="width:60px"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function challengeQber() {
      // BB84 认知题：Eve 随机基测量在筛选密钥中引入约 25% 误码率（题面全文在 st.c11.ch，双语）
      return '<div class="sy-solver">' +
        '<div class="sy-srow"><label>' + T('st.chQberLabel') + '</label><input id="sy-ch-in" maxlength="3" style="width:70px" placeholder="0-100"></div>' +
        '<button class="btn" id="sy-ch-go" style="margin-top:4px">' + T('st.chCheck') + '</button></div>';
    }
    function bindChallenge(ch) {
      var go = document.getElementById('sy-ch-go');
      if (!go) return;
      go.addEventListener('click', function () {
        var inp = document.getElementById('sy-ch-in');
        var msg = document.getElementById('sy-ch-msg');
        if (!inp || !msg) return;
        var v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        var ok = false;
        if (ch.challenge === 'freq') ok = v === 'E';
        else if (ch.challenge === 'enigma60') ok = v === 'ROTOR';
        else if (ch.challenge === 'af-trap') ok = v === '2';
        else if (ch.challenge === 'delta') ok = v === '01011';
        else if (ch.challenge === 'hill-mat') ok = v === 'MATH';
        else if (ch.challenge === 'caesar-manual') ok = v === 'ORDER';
        else if (ch.challenge === 'freq-most') ok = v === 'T';
        else if (ch.challenge === 'bacon-5bit') ok = v === 'E';
        else if (ch.challenge === 'adfgvx-name') ok = v === 'ADFGVX';
        else if (ch.challenge === 'otp-reuse') ok = v === 'REUSE';
        else if (ch.challenge === 'purple-vowels') ok = v === '26';
        else if (ch.challenge === 'qber') ok = v === '25';
        if (ok) {
          stories.markChallenge(ch.id);
          msg.innerHTML = '<span style="color:var(--neon-green)">' + T('st.chWin') + '</span>';
          if (Arcade.audio) Arcade.audio.play('win');
        } else {
          msg.innerHTML = '<span style="color:var(--neon-pink)">' + T('st.chFail') + '</span>';
          if (Arcade.audio) Arcade.audio.play('error');
        }
      });
    }

    /* final 视图：集齐密钥字母后解锁 */
    function renderFinal() {
      var unlocked = stories.finalUnlocked();
      document.getElementById('sy-prog').textContent = T('st.finalTitle');
      var html = '<div class="sy-era">— ' + T('st.finalEra') + ' —</div>' +
        '<h1 class="sy-title">🔐 ' + T('st.finalTitle') + '</h1>';
      if (!unlocked) {
        html += '<div class="sy-body">' + T('st.finalLocked') + '</div>';
        root.innerHTML = html;
        return;
      }
      var slots = '';
      for (var i = 0; i < stories.getAll().length; i++) {
        var ch = stories.getAll()[i];
        if (!ch.letter) continue; /* 无密信章（如 quantum）不占最终密语槽位 */
        slots += '<div class="sy-slot have">' + (ch.letter.keyLetter || '?') + '</div>';
      }
      html += '<div class="sy-final">' +
        '<div class="sy-slots">' + slots + '</div>' +
        '<div class="sy-lh">' + T('st.finalHint') + '</div>' +
        '<div class="sy-lrow" style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">' +
        '<input id="sy-final-ans" placeholder="' + T('st.finalPh') + '" maxlength="40" autocomplete="off" style="padding:9px 12px;border-radius:8px;border:1px solid rgba(255,230,0,.4);background:rgba(0,0,0,.35);color:var(--neon-yellow);font-family:var(--font-pixel)">' +
        '<button class="btn yellow" id="sy-final-go">' + T('st.submit') + '</button></div>' +
        '<div class="sy-msg" id="sy-final-msg" style="margin-top:10px;font-size:12px"></div>' +
        '</div>';
      root.innerHTML = html;
      document.getElementById('sy-final-go').addEventListener('click', function () {
        var v = document.getElementById('sy-final-ans').value.toUpperCase().replace(/[^A-Z-]/g, '');
        var expect = (T('st.finalAnswer') || '').toUpperCase().replace(/\s+/g, '');
        var msg = document.getElementById('sy-final-msg');
        if (expect && v === expect) {
          msg.innerHTML = '<span style="color:var(--neon-green)">' + T('st.finalWin') + '</span>';
          try { localStorage.setItem('arcade_final', '1'); } catch (e) {}
          if (Arcade.audio) Arcade.audio.play('record');
          if (Arcade.juice) Arcade.juice.win();
        } else {
          msg.innerHTML = '<span style="color:var(--neon-pink)">' + T('st.finalFail') + '</span>';
          if (Arcade.audio) Arcade.audio.play('error');
        }
      });
    }
})();
