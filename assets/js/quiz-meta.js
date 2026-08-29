/* quiz-meta.js —— 档案页（stats）专用：测验只读元数据（RANKS + 段位计算 + 读取最近结果）
   用途：stats 页只需「最近段位/成就判定」，无需加载 74KB 题库（quiz.js）。
   同步义务：本文件的 RANKS / rankFor / lastResult 必须与 quiz.js 保持一致——
   由门禁 tools/check-quiz-meta-sync.js 校验；页面同时加载两者时亦会运行时自检。 */
(function () {
  var RANKS = [
    { min: 0.95, name: 'legend', zh: '传说破译者', en: 'Legendary Codebreaker', icon: '👑' },
    { min: 0.85, name: 'master', zh: '密码大师', en: 'Cipher Master', icon: '💎' },
    { min: 0.75, name: 'expert', zh: '资深破译者', en: 'Expert Cryptanalyst', icon: '🛡️' },
    { min: 0.65, name: 'advanced', zh: '进阶破译者', en: 'Advanced Breaker', icon: '⚔️' },
    { min: 0.5, name: 'intermediate', zh: '中级破译者', en: 'Intermediate', icon: '🔎' },
    { min: 0.35, name: 'novice', zh: '入门破译者', en: 'Novice', icon: '📖' },
    { min: 0.15, name: 'rookie', zh: '新手学徒', en: 'Rookie', icon: '🌱' },
    { min: 0, name: 'initiate', zh: '初识者', en: 'Initiate', icon: '🕯️' }
  ];

  function rankFor(score, total) {
    var pct = total ? score / total : 0;
    for (var i = 0; i < RANKS.length; i++) {
      if (pct >= RANKS[i].min) return RANKS[i];
    }
    return RANKS[RANKS.length - 1];
  }

  function lastResult() {
    try {
      var score = parseInt(localStorage.getItem('arcade_quiz_best_score') || '0', 10);
      var total = parseInt(localStorage.getItem('arcade_quiz_best_total') || '0', 10);
      var name = localStorage.getItem('arcade_quiz_rank') || '';
      var zh = localStorage.getItem('arcade_quiz_rank_zh') || '未测验';
      var en = localStorage.getItem('arcade_quiz_rank_en') || 'Not tested';
      var icon = localStorage.getItem('arcade_quiz_icon') || '🕯️';
      var ever = parseInt(localStorage.getItem('arcade_quiz_best_ever') || '0', 10);
      return { score: score, total: total, name: name, zh: zh, en: en, icon: icon, ever: ever };
    } catch (e) { return { score: 0, total: 0, name: '', zh: '未测验', en: 'Not tested', icon: '🕯️', ever: 0 }; }
  }

  /* 运行时一致性自检：若完整题库（quiz.js）同时在场，比对 RANKS 与 rankFor */
  try {
    if (window.QUIZ && window.QUIZ.RANKS && window.QUIZ.rankFor) {
      var same = JSON.stringify(RANKS) === JSON.stringify(window.QUIZ.RANKS) &&
                 window.QUIZ.rankFor(10, 10).name === rankFor(10, 10).name &&
                 window.QUIZ.rankFor(0, 10).name === rankFor(0, 10).name;
      if (!same) console.warn('[quiz-meta] 与 quiz.js 的段位定义不一致——请运行 check-quiz-meta-sync');
    }
  } catch (e) {}

  window.QUIZ_META = { RANKS: RANKS, rankFor: rankFor, lastResult: lastResult };
})();
