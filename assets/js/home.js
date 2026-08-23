/* ============================================================
   首页 · 破译旅程画卷（博物馆化首页）
   不罗列游戏——聚焦展示人类加密解密的破译旅程：
   11 时代旅程时间轴（每节点聚合：故事/人物/密件/游戏）+ 进度总览 + 入口
   依赖：core/i18n.js、core/storage.js、core/extras.js、games.js、
         stats.js、rank.js、plot.js、stories.js（先加载）
   ============================================================ */

(function () {
  
  var root = document.getElementById('home-journey');
  var progressEl = document.getElementById('home-progress');
  var rankEl = document.getElementById('home-rank');
  var dailyEl = document.getElementById('home-daily');
  if (!root || !window.Arcade || !Arcade.stories || !window.STORIES) return;

  /* ---------- 破译进度总览 ---------- */
  function renderProgress() {
    if (!progressEl) return;
    var st = Arcade.stories;
    var played = 0;
    (window.GAMES || []).forEach(function (g) { if (g.bestMode && Arcade.storage && Arcade.storage.getBest(g.id) !== null) played++; });
    progressEl.innerHTML =
      '<div class="home-prog-item"><b>' + st.readCount() + '</b>/' + st.getAll().length + ' ' + T('home.progChapters') + '</div>' +
      '<div class="home-prog-item"><b>' + st.letterCount() + '</b>/' + (st.letterTotal ? st.letterTotal() : 11) + ' ' + T('home.progLetters') + '</div>' +
      '<div class="home-prog-item"><b>' + st.artifactsCount() + '</b>/' + (window.ARTIFACTS || []).length + ' ' + T('home.progArtifacts') + '</div>' +
      '<div class="home-prog-item"><b>' + played + '</b>/' + (window.GAMES || []).length + ' ' + T('home.progGames') + '</div>';
  }

  /* ---------- 军衔徽章（能量条版，与档案页一致） ---------- */
  function renderRank() {
    if (!rankEl || !Arcade.rank) return;
    var r = Arcade.rank.current();
    var xp = Arcade.rank.xp();
    var xpTxt = r.next
      ? T('lobby.rankNext').replace('{x}', xp).replace('{n}', r.next.min)
      : T('lobby.rankMax').replace('{x}', xp);
    rankEl.innerHTML =
      '<div class="rank-badge">' +
      '<span class="rank-icon">' + r.icon + '</span>' +
      '<span class="rank-name">' + T('rank.' + r.id + '.n') + '</span>' +
      '<span class="energy-bar"><i style="width:' + Arcade.rank.progress() + '%"></i>' +
      '<span class="energy-txt">' + xpTxt + '</span></span>' +
      '</div>';
  }

  /* ---------- 破译旅程时间轴（11 时代画卷） ---------- */
  function chapterLit(ch) {
    var lit = Arcade.stories.isRead(ch.id);
    if (!lit) {
      ch.games.forEach(function (gid) {
        if (Arcade.storage && Arcade.storage.getBest(gid) !== null) lit = true;
      });
    }
    return lit;
  }

  function renderJourney() {
    /* 叙事评审修复：按顺序解锁「下一章未读」，新玩家首章不再锁死 */
    var nextUnread = null;
    Arcade.stories.getAll().forEach(function (ch0) {
      if (nextUnread === null && !chapterLit(ch0)) nextUnread = ch0.id;
    });
    var html = '<div class="journey">';
    Arcade.stories.getAll().forEach(function (ch, i) {
      var lit = chapterLit(ch);
      var enterable = lit || ch.id === nextUnread;
      var idx = i + 1;
      // 时代聚合：故事 / 人物 / 密件 / 游戏
      var peopleHtml = (ch.people || []).map(function (pid) {
        return '<span class="jp-chip" data-person="' + pid + '">' + T('stp.' + pid + '.icon') + ' ' + T('stp.' + pid + '.name') + '</span>';
      }).join('');
      var art = null;
      (window.ARTIFACTS || []).forEach(function (a) { if (a.chapterId === ch.id) art = a; });
      var artHtml = art
        ? (Arcade.stories.isArtifactUnlocked(art.id)
            ? '<span class="jp-art on">📎 ' + T('sta.' + art.id + '.name') + '</span>'
            : '<span class="jp-art">🔒 ' + T('sta.' + art.id + '.name') + '</span>')
        : '';
      var gamesHtml = ch.games.map(function (gid) {
        var g = null;
        (window.GAMES || []).forEach(function (x) { if (x.id === gid) g = x; });
        return g ? '<a class="jp-game" href="' + g.path + '" title="' + T('g.' + gid + '.t') + '">' + g.icon + '</a>' : '';
        }).join('');

      html +=
        '<div class="jp-node' + (lit ? ' lit' : '') + '" data-chapter="' + ch.id + '">' +
        '  <div class="jp-era">' + T(ch.era) + '</div>' +
        '  <div class="jp-head">' +
        '    <span class="jp-idx">' + (lit ? '✓' : idx) + '</span>' +
        '    <h3 class="jp-title">' + T(ch.titleKey) + '</h3>' +
        '    <span class="jp-one">' + T(ch.titleKey + '.one') + '</span>' +
        (enterable ? '<a class="jp-link" href="story.html?id=' + ch.id + '">' + T('home.enter') + ' →</a>' : '<span class="jp-link off">🔒</span>') +
        '  </div>' +
        '  <div class="jp-body">' +
        '    <div class="jp-row"><span class="jp-lbl">' + T('home.people') + '</span>' + (peopleHtml || '—') + '</div>' +
        '    <div class="jp-row"><span class="jp-lbl">' + T('home.artifacts') + '</span>' + (artHtml || '—') + '</div>' +
        '    <div class="jp-row"><span class="jp-lbl">' + T('home.games') + '</span><span class="jp-games">' + gamesHtml + '</span></div>' +
        '  </div>' +
        '</div>';
    });
    html += '</div>';
    root.innerHTML = html;

    // 人物 chip → 档案卡
    var chips = root.querySelectorAll('.jp-chip');
    for (var c = 0; c < chips.length; c++) {
      (function (el) {
        el.addEventListener('click', function () {
          var pid = el.getAttribute('data-person');
          if (Arcade.tutorial && Arcade.tutorial.profile) Arcade.tutorial.profile(pid);
        });
      })(chips[c]);
    }
    // 节点点击 → 已解锁进章节
    var nodes = root.querySelectorAll('.jp-node');
    for (var n = 0; n < nodes.length; n++) {
      (function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('a')) return;
          var id = el.getAttribute('data-chapter');
          var ch = Arcade.stories.get(id);
          if (ch && (chapterLit(ch) || id === nextUnread)) window.location.href = 'story.html?id=' + id;
        });
      })(nodes[n]);
    }
  }

  /* ---------- 今日破译（轻量入口） ---------- */
  function renderDaily() {
    if (!dailyEl || !Arcade.daily) return;
    var done = 0;
    (window.DAILY_IDS || []).forEach(function (id) { if (Arcade.daily.isSolved(id)) done++; });
    var streak = Arcade.daily.streak();
    dailyEl.innerHTML =
      '<a class="home-daily" href="games.html">' +
      '<span class="hd-ic">📅</span>' +
      '<span class="hd-tx">' + T('home.daily') + ' <b>' + done + '</b>/' + (window.DAILY_IDS || []).length +
      (streak > 0 ? ' · 🔥 ' + streak : '') + '</span>' +
      '<span class="hd-go">' + T('home.go') + ' →</span></a>';
  }

  /* ---------- 继续破译（最近游玩 6 款快捷入口，无纪录则不显示） ---------- */
  function renderContinue() {
    var el = document.getElementById('home-continue');
    if (!el) return;
    var ids = [];
    try { ids = JSON.parse(localStorage.getItem('arcade_recent') || '[]'); } catch (e) {}
    var games = [];
    ids.forEach(function (id) {
      var g = null;
      (window.GAMES || []).forEach(function (x) { if (x.id === id) g = x; });
      if (g) games.push(g);
    });
    if (!games.length) return;
    var html = '<h2 class="home-section-title">' + T('home.continue') + '</h2><div class="home-continue">';
    games.slice(0, 6).forEach(function (g) {
      html += '<a class="hc-card" href="' + g.path + '" title="' + T('g.' + g.id + '.t') + '">' +
        '<span class="hc-ic">' + g.icon + '</span>' +
        '<span class="hc-tx">' + T('g.' + g.id + '.t') + '</span></a>';
    });
    html += '<a class="hc-more" href="games.html">' + T('home.continueGo') + '</a></div>';
    el.innerHTML = html;
  }

  renderProgress();
  renderRank();
  renderJourney();
  renderDaily();
  renderContinue();
})();
