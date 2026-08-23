/* ============================================================
   隐藏密文彩蛋（N3 ARG）—— 全站寻宝
   20 条递进难度密文藏于全站各处，破解后在破译工坊的
   「🎯 彩蛋」输入框提交答案，收集进度存入 localStorage。
   全部集齐解锁隐藏成就「密码猎人」。
   依赖：workshop.js（加密/破解）；无则独立降级
   ============================================================ */
window.EASTER_EGGS = (function () {
  /* 20 条彩蛋：id / 密文（用 workshop 加密生成）/ 答案 / 提示（藏匿位置描述） */
  var KEY = 'arcade_eggs';
  /* en = 英文提示（en 界面下覆写 .egg-hint[data-egg] 与提交反馈用） */
  var EGGS = [
    { id: 'e01', hint: '首页页脚 · 凯撒偏移 3', en: 'Home footer · Caesar shift 3', answer: 'ARCADE', cipher: 'DUFDGH' },
    { id: 'e02', hint: '游戏厅页脚 · 摩斯', en: 'Arcade footer · Morse code', answer: 'PLAY', cipher: '.--. .-.. .- -.--' },
    { id: 'e03', hint: '编年史页脚 · 培根', en: 'Chronicles footer · Bacon cipher', answer: 'STORY', cipher: 'BAABABAABBABBBABAAABBBAAA' },
    { id: 'e04', hint: '人物志页脚 · 二进制', en: 'People footer · Binary', answer: 'CODE', cipher: '01000011 01001111 01000100 01000101' },
    { id: 'e05', hint: '密件册页脚 · Base64', en: 'Artifacts footer · Base64', answer: 'SECRET', cipher: 'U0VDUkVU' },
    { id: 'e06', hint: '我的档案页脚 · 维吉尼亚密钥 CODE', en: 'Profile footer · Vigenere key CODE', answer: 'CIPHER', cipher: 'EWSLGF' },
    { id: 'e07', hint: '单章页脚 · 栅栏 3 轨', en: 'Chapter footer · Rail fence, 3 rails', answer: 'DECODE', cipher: 'DDEOEC' },
    { id: 'e08', hint: '术语表页脚 · 异或密钥 KEY', en: 'Glossary footer · XOR key KEY', answer: 'BREAK', cipher: '09171c0a0e' },
    { id: 'e09', hint: '404 页脚 · 仿射 a=5 b=8', en: '404 footer · Affine a=5 b=8', answer: 'HUNTER', cipher: 'REVZCP' },
    { id: 'e10', hint: '游戏页 shell 页脚 · 替换表 ZYX…', en: 'Game shell footer · Substitution table ZYX…', answer: 'MASTER', cipher: 'NZHGVI' },
    { id: 'e11', hint: '工坊页脚 · Playfair 密钥 ARCADE', en: 'Workshop footer · Playfair key ARCADE', answer: 'ROSETTA', cipher: 'ELUCUUCV' },
    { id: 'e12', hint: '首页时间线末端 · 希尔 3,2,2,3', en: 'Home timeline end · Hill key 3,2,2,3', answer: 'GENIUS', cipher: 'AYDYSQ' },
    { id: 'e13', hint: '测验场页脚 · 维吉尼亚密钥 QUIZ', en: 'Quiz footer · Vigenere key QUIZ', answer: 'LEARN', cipher: 'BYIQD' },
    { id: 'e14', hint: '双人竞速页脚 · Playfair 密钥 DUEL', en: 'Duel footer · Playfair key DUEL', answer: 'WINNER', cipher: 'VKOOFX' },
    { id: 'e15', hint: '听音训练页脚 · 摩斯', en: 'Morse trainer footer · Morse code', answer: 'LISTEN', cipher: '.-.. .. ... - . -.' },
    { id: 'e16', hint: '24 天路径页脚 · 栅栏 4 轨', en: '24-day path footer · Rail fence, 4 rails', answer: 'JOURNEY', cipher: 'JYOEUNR' },
    { id: 'e17', hint: '编年史时间线 · Bifid 密钥 SPARTA', en: 'Chronicles timeline · Bifid key SPARTA', answer: 'SCYTALE', cipher: 'PVABEXY' },
    { id: 'e18', hint: '密件册 Voynich 词条 · Trifid', en: 'Artifacts Voynich entry · Trifid cipher', answer: 'VOYNICH', cipher: 'XJEXGTZ' },
    { id: 'e19', hint: '术语表 Polybius 词条 · ADFGVX 密钥 ZIMMER', en: 'Glossary Polybius entry · ADFGVX key ZIMMER', answer: 'POLYBIUS', cipher: 'FXFVFFVDDAADGGGD' },
    { id: 'e20', hint: '首页时间线 Kryptos 节点 · 仿射 a=7 b=11', en: 'Home timeline Kryptos node · Affine a=7 b=11', answer: 'ORYCTO', cipher: 'FAXZOF' }
  ];

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function write(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

  /* 提交答案：密文（或直接答案）→ 校验；返回 {ok, total, found, new} */
  function submit(input) {
    var v = String(input || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!v) return { ok: false, msg: 'EMPTY' };
    var found = read();
    var isNew = false, matched = null;
    for (var i = 0; i < EGGS.length; i++) {
      var e = EGGS[i];
      /* 答案匹配，或密文被解出后提交答案 */
      if (v === e.answer) {
        matched = e;
        if (found.indexOf(e.id) < 0) { found.push(e.id); isNew = true; }
        break;
      }
    }
    if (matched) {
      if (isNew) write(found);
      return { ok: true, isNew: isNew, id: matched.id, total: EGGS.length, found: found.length, hint: matched.hint };
    }
    return { ok: false, msg: 'NO_MATCH' };
  }

  /* 按当前界面语言取提示（zh 原文 / en 译文）——工坊提交反馈用；
     页脚静态提示由 theme.css 按 html[lang] 纯 CSS 切换，不经过这里 */
  function hintText(id) {
    var lang = (window.Arcade && Arcade.i18n && Arcade.i18n.getLang) ? Arcade.i18n.getLang() : 'zh';
    for (var i = 0; i < EGGS.length; i++) {
      if (EGGS[i].id === id) return (lang === 'en' && EGGS[i].en) ? EGGS[i].en : EGGS[i].hint;
    }
    return '';
  }

  /* 已收集 id 列表 */
  function collected() { return read(); }
  function count() { return read().length; }
  function isComplete() { return read().length >= EGGS.length; }

  /* 全部答案列表（调试/展示用，不直接暴露密文解密） */
  function answers() { return EGGS.map(function (e) { return e.answer; }); }

  return {
    EGGS: EGGS,
    submit: submit, collected: collected, count: count, isComplete: isComplete,
    answers: answers, hintText: hintText
  };
})();
