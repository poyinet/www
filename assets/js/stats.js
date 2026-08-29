/* ============================================================
   我的档案 · 生涯统计 + 成就系统（纯本地，个人维度）
   依赖：core/storage.js、games.js（先加载）
   数据全部来自 localStorage：最高分 / 每日破译记录，无任何服务端。
   用法：Arcade.stats.collect() 返回统计环境；Arcade.stats.check()
        计算并解锁新成就（返回 {list, unlocked, fresh, env}）。
   ============================================================ */

window.Arcade = window.Arcade || {};

Arcade.stats = (function () {
  var ACHV_KEY = 'arcade_achv';

  function readArr(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : []; }
    catch (e) { return []; }
  }
  function writeArr(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
  }

  /* ---------- 成就定义（每项 check(env) 为解锁条件） ---------- */
  var ACHV = [
    { id: 'first', icon: '🐣', name: '初来乍到', desc: '挑战第一款游戏', check: function (e) { return e.played >= 1; } },
    { id: 'ten', icon: '🕵️', name: '破译者', desc: '挑战 10 款游戏', check: function (e) { return e.played >= 10; } },
    { id: 'thirty', icon: '🏆', name: '破解大师', desc: '挑战 30 款游戏', check: function (e) { return e.played >= 30; } },
    { id: 'fifty', icon: '👑', name: '全图鉴猎手', desc: '挑战 50 款游戏', check: function (e) { return e.played >= 50; } },
    { id: 'allcats', icon: '🗺️', name: '八域通晓', desc: '8 大分类各至少挑战 1 款', check: function (e) { return e.catsCovered >= 8; } },
    { id: 'streak7', icon: '🔥', name: '七日连破', desc: '每日破译连破 7 天', check: function (e) { return e.streak >= 7; } },
    { id: 'daily5', icon: '📅', name: '每日全勤', desc: '单日完成全部每日题', check: function (e) { return e.todaySolved >= e.dailyCount && e.dailyCount > 0; } },
    { id: 'flagship4', icon: '⚙️', name: '旗舰猎手', desc: '挑战 4 款全网独家旗舰', check: function (e) { return e.flagshipPlayed >= 4; } },
    { id: 'speed', icon: '⏱️', name: '速破专家', desc: '任一计时游戏最佳 ≤ 60 秒', check: function (e) { return e.speed; } },
    { id: 'perfect', icon: '💯', name: '完美主义者', desc: '挑战全部可记分游戏', check: function (e) { return e.total > 0 && e.played >= e.total; } },
    /* 编年史成就（P5；读章/密信/密件） */
    { id: 'cbegin', icon: '🧱', name: '破译者之始', desc: '读完编年史第 0 章「破译的黎明」', check: function () { return window.Arcade && Arcade.stories && Arcade.stories.isRead('dawn'); } },
    { id: 'chist5', icon: '📚', name: '历史爱好者', desc: '读完编年史任意 5 章', check: function () { return window.Arcade && Arcade.stories && Arcade.stories.readCount() >= 5; } },
    { id: 'call', icon: '🏛️', name: '编年史读者', desc: '读完编年史全部 12 章', check: function () { return window.Arcade && Arcade.stories && window.STORIES && Arcade.stories.readCount() >= window.STORIES.length; } },
    { id: 'cletter3', icon: '✉️', name: '密信猎人', desc: '集齐 3 枚密钥字母', check: function () { return window.Arcade && Arcade.stories && Arcade.stories.letterCount() >= 3; } },
    { id: 'cfinal', icon: '🔐', name: '最终破译者', desc: '破解最终密语', check: function () { return (function () { try { return !!localStorage.getItem('arcade_final'); } catch (e) { return false; } })(); } },
    { id: 'cart5', icon: '📎', name: '密件收藏家', desc: '解锁 5 件历史密件', check: function () { return window.Arcade && Arcade.stories && Arcade.stories.artifactsCount() >= 5; } },
    { id: 'cgame5', icon: '🎮', name: '破译史学家', desc: '通关 5 个编年史关联游戏', check: function (e) {
      if (!window.Arcade || !Arcade.stories || !window.STORIES) return e.played >= 5;
      var linked = {};
      Arcade.stories.getAll().forEach(function (ch) { ch.games.forEach(function (g) { linked[g] = 1; }); });
      var playedLinked = 0;
      (window.GAMES || []).forEach(function (g) {
        if (linked[g.id] && Arcade.storage && Arcade.storage.getBest(g.id) !== null) playedLinked++;
      });
      return playedLinked >= 5;
    } },
    /* 隐藏彩蛋成就（N3 ARG） */
    { id: 'ehunter', icon: '🕵️', name: '密码猎人', desc: '集齐全站 20 枚隐藏密文彩蛋', check: function () { return window.EASTER_EGGS && window.EASTER_EGGS.isComplete(); } },
    /* 第五轮 F3 成就扩展：测验/精通/听音/竞速/术语/时间线/地图/全知 */
    { id: 'qmaster', icon: '💎', name: '测验大师', desc: '密码学测验答对全部 10 题', check: function () { return window.QUIZ_META && window.QUIZ_META.lastResult().total > 0 && window.QUIZ_META.lastResult().score >= 10; } },
    { id: 'qlegend', icon: '👑', name: '传说破译者', desc: '测验段位达到「传说破译者」', check: function () { return window.QUIZ_META && (window.QUIZ_META.lastResult().name === 'legend' || parseInt(localStorage.getItem('arcade_quiz_best_ever') || '0', 10) >= 10); } },
    { id: 'chq5', icon: '🧠', name: '章节学霸', desc: '点亮任意 5 章「本章精通」', check: function () { return window.CHAPTER_QUIZ && window.CHAPTER_QUIZ.masteredCount() >= 5; } },
    { id: 'chqall', icon: '🎓', name: '编年史全通', desc: '点亮全部章节精通', check: function () { return window.CHAPTER_QUIZ && window.CHAPTER_QUIZ.masteredCount() >= window.CHAPTER_QUIZ.totalChapters(); } },
    { id: 'morse5', icon: '👂', name: '摩斯听风者', desc: '摩斯听音训练满分一轮', check: function () { return window.MORSE_L && window.MORSE_L.best().total > 0 && window.MORSE_L.best().score >= 10; } },
    { id: 'duel5', icon: '⚔️', name: '决斗冠军', desc: '双人竞速累计获胜 5 场', check: function () { try { return parseInt(localStorage.getItem('arcade_duel_wins') || '0', 10) >= 5; } catch (e) { return false; } } },
    { id: 'gloss30', icon: '📖', name: '术语达人', desc: '阅读术语表 30 个词条', check: function () { try { return parseInt(localStorage.getItem('arcade_gloss_read') || '0', 10) >= 30; } catch (e) { return false; } } },
    { id: 'discov', icon: '🧭', name: '探索者', desc: '走进破译发现馆', check: function () { try { return !!localStorage.getItem('arcade_discover_viewed'); } catch (e) { return false; } } },
    { id: 'relweb', icon: '🕸️', name: '人脉侦探', desc: '走过密码史关系网', check: function () { try { return !!localStorage.getItem('arcade_rels_viewed'); } catch (e) { return false; } } },
    { id: 'zhstory', icon: '🏮', name: '华夏访客', desc: '走过中华密码史专题', check: function () { try { return !!localStorage.getItem('arcade_zhcrypto_viewed'); } catch (e) { return false; } } },
    { id: 'timeline60', icon: '🗺️', name: '时间旅人', desc: '浏览过密码史时间线', check: function () { try { return !!localStorage.getItem('arcade_timeline_viewed'); } catch (e) { return false; } } }
  ];

  /* ---------- 统计环境采集 ---------- */
  function collect() {
    var G = window.GAMES || [];
    var total = 0, played = 0;
    var perCat = {};
    (window.GAME_CATEGORIES || []).forEach(function (c) { perCat[c] = { total: 0, played: 0 }; });
    G.forEach(function (g) {
      if (perCat[g.category]) perCat[g.category].total++;
      if (!g.bestMode) return; // 不记分类（如双人对战）不计入挑战进度
      total++;
      if (Arcade.storage.getBest(g.id) !== null) {
        played++;
        if (perCat[g.category]) perCat[g.category].played++;
      }
    });
    var catsCovered = 0;
    for (var c in perCat) if (perCat[c].played > 0) catsCovered++;

    var dailyIds = window.DAILY_IDS || [];
    var todaySolved = 0;
    dailyIds.forEach(function (id) { if (Arcade.daily && Arcade.daily.isSolved(id)) todaySolved++; });
    var streak = Arcade.daily ? Arcade.daily.streak() : 0;
    var dailyTotal = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && /^arcade_daily_[a-z-]+_\d{4}-\d{1,2}-\d{1,2}$/.test(k)) dailyTotal++;
      }
    } catch (e) {}

    /* 全网独家旗舰（8 款） */
    var FLAGSHIPS = ['bombe', 'hill', 'workshop', 'dungeon-cipher', 'venona', 'jn25', 'plugboard', 'trifid'];
    var flagshipPlayed = 0;
    FLAGSHIPS.forEach(function (id) { if (Arcade.storage.getBest(id) !== null) flagshipPlayed++; });

    var speed = G.some(function (g) {
      return g.bestMode === 'min' && Arcade.storage.getBest(g.id) !== null && Arcade.storage.getBest(g.id) <= 60;
    });

    return {
      total: total, played: played, perCat: perCat, catsCovered: catsCovered,
      todaySolved: todaySolved, dailyCount: dailyIds.length, streak: streak, dailyTotal: dailyTotal,
      flagshipPlayed: flagshipPlayed, flagshipTotal: FLAGSHIPS.length, speed: speed
    };
  }

  /* ---------- 成就检查：解锁新成就并持久化 ---------- */
  function check() {
    var env = collect();
    var unlocked = readArr(ACHV_KEY);
    var fresh = [];
    ACHV.forEach(function (a) {
      if (unlocked.indexOf(a.id) < 0 && a.check(env)) {
        unlocked.push(a.id);
        fresh.push(a);
      }
    });
    if (fresh.length) writeArr(ACHV_KEY, unlocked);
    return { list: ACHV, unlocked: unlocked, fresh: fresh, env: env };
  }

  function isUnlocked(id) { return readArr(ACHV_KEY).indexOf(id) >= 0; }
  function count() { return readArr(ACHV_KEY).length; }

  return { ACHV: ACHV, collect: collect, check: check, isUnlocked: isUnlocked, count: count };
})();
