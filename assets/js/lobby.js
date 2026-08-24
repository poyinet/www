/* ============================================================
   大厅渲染（P0 升级版）
   读注册表 → 搜索 + 分类筛选 + 收藏(★) + 最近游玩 + 已挑战进度
   依赖：core/storage.js、core/extras.js、games.js（先加载）
   ============================================================ */

(function () {
  var lobbyRoot = document.getElementById('lobby-root');
  var controls = document.getElementById('lobby-controls');
  if (!lobbyRoot || !window.GAMES) return;

  /* 路径前缀：游戏厅页面在 game/ 目录下，游戏链接需加 ../（默认空=根目录） */
  var PP = window.GAME_PATH_PREFIX || '';
  var pathOf = function (p) { return PP + p; };

  var CATEGORY_COLORS = {
    '经典街机': 'cyan',
    '动作反应': 'yellow',
    '逻辑谜题': 'pink',
    '空间解谜': 'purple',
    '球类竞技': 'green',
    '棋类对弈': 'pink',
    '牌骰策略': 'purple',
    '密码破译': 'green'
  };
  var COLOR_HEX = {
    cyan: '#00f0ff', pink: '#ff2d95', yellow: '#ffe600',
    purple: '#b967ff', green: '#39ff14'
  };

  var FAV_KEY = 'arcade_favs';
  var RECENT_KEY = 'arcade_recent';
  var SEEN_KEY = 'arcade_seen';

  /* 每日破译中心：启用每日一题的游戏（点卡片进入游戏内「📅 每日一题」） */
  var DAILY_IDS = window.DAILY_IDS || [];
  function findGame(id) {
    for (var i = 0; i < window.GAMES.length; i++) if (window.GAMES[i].id === id) return window.GAMES[i];
    return null;
  }

  var state = { q: '', cat: '全部', lvl: '', time: '' };

  /* ---------- NEW 角标（首次出现的游戏；getSeen 见下方缓存版）
     markSeen 只更新内存缓存，由 flushSeen 在渲染结束时统一写一次
     ——避免 101 卡首访时 101 次 localStorage 写 */
  function markSeen(id) {
    var s = getSeen();
    if (s.indexOf(id) < 0) s.push(id);
  }
  function flushSeen() {
    if (_seenCache !== null) writeArr(SEEN_KEY, _seenCache);
  }
  function isNew(id) { return getSeen().indexOf(id) < 0; }

  /* ---------- 游戏类型标签（自动派生） ---------- */
  var TIME_LABELS = {
    snake: "Mid", g2048: "Mid", blocks: "Long", minesweeper: "Mid", billiards: "Mid",
    paddle2p: "Mid", twopaddle: "Short", frogcross: "Short", mazedot: "Mid", asteroidf: "Mid", pixeldino: "Short",
    memory: "Short", puzzle15: "Short", match3: "Short", game24: "Short", sudoku: "Long",
    nonogram: "Mid", lightsout: "Short", sokoban: "Mid", hanoi: "Short", pipe: "Short",
    shikaku: "Mid", fillomino: "Long", wordsearch: "Mid", paintbynum: "Short", circuit: "Short",
    roperescue: "Short", bridge: "Mid", fruitmerge: "Mid", slitherlink: "Mid", hashi: "Mid",
    brickbash: "Short", pixelbird: "Short", catch: "Short", reaction: "Short", maze: "Short",
    platformer: "Mid", spaceshooter: "Mid", rhythm: "Short", catapult: "Short", railshooter: "Short",
    dungeon: "Long",
    gomoku: "Long", reversi: "Long", tictactoe: "Short", guess: "Short", fourline: "Mid",
    klotski: "Mid", blackjack: "Short", towerdefense: "Long", deckbuilder: "Long",
    chess: "Long", checkers: "Long", diceluck: "Mid", poker: "Short", siege: "Mid",
    tactics: "Long",
    codeguess: "Short", caesar: "Short", morse: "Short", codebreak: "Short", substitution: "Mid",
    vigenere: "Mid", morselong: "Mid", binary: "Mid", typecode: "Short",
    railfence: "Short", affine: "Short", base64: "Short", morsetap: "Short", freq: "Mid",
    enigma: "Long", playfair: "Mid", xor: "Mid", campaign: "Long", adfgvx: "Mid",
    detective: "Mid", bifid: "Mid", bombe: "Long", hill: "Mid", workshop: "Long", 'dungeon-cipher': "Long", venona: "Mid", jn25: "Long", plugboard: "Mid", trifid: "Mid", bullethell: "Mid", ballpop: "Mid", curling: "Mid", bowling: "Mid", purple: "Long", m209: "Mid", lorenz: "Long", maker: "Long", spotdiff: "Short", llk: "Mid", klondike: "Long", tank: "Mid", sheep: "Mid", sectorsiege: "Mid", bacon: "Mid", atbash: "Short", polybius: "Short", nihilist: "Mid", starflag: "Mid"
  };
  var DIFF_LABELS = {
    guess: "Easy", tictactoe: "Easy", codeguess: "Easy", memory: "Easy", catch: "Easy", pixeldino: "Easy",
    fruitmerge: "Easy", roperescue: "Easy", diceluck: "Easy", base64: "Easy", morsetap: "Easy",
    reaction: "Easy", lightsout: "Easy", hanoi: "Easy", paintbynum: "Easy", game24: "Easy",
    snake: "Mid", fourline: "Mid", codebreak: "Mid", twopaddle: "Mid", asteroidf: "Mid",
    enigma: "Hard", dungeon: "Hard", playfair: "Hard", campaign: "Hard", adfgvx: "Hard",
    detective: "Mid", bifid: "Hard", bombe: "Hard", hill: "Hard", workshop: "Hard", 'dungeon-cipher': "Hard", venona: "Hard", jn25: "Hard", plugboard: "Hard", trifid: "Hard", bullethell: "Hard", ballpop: "Mid", purple: "Hard", m209: "Hard", lorenz: "Hard", maker: "Mid", spotdiff: "Easy", llk: "Easy", klondike: "Mid", tank: "Mid", sheep: "Hard", sectorsiege: "Mid", bacon: "Hard", atbash: "Easy", polybius: "Easy", nihilist: "Mid", starflag: "Mid",
    nonogram: "Hard", sudoku: "Hard", chess: "Hard", checkers: "Hard", gomoku: "Hard",
    reversi: "Hard", fillomino: "Hard", towerdefense: "Hard", deckbuilder: "Hard",
    blocks: "Hard", minesweeper: "Hard", tactics: "Hard", slitherlink: "Hard", hashi: "Hard"
  };
  function gameTags(game) {
    var tags = [];
    var t = TIME_LABELS[game.id];
    if (t) tags.push({ text: T('lobby.time' + t), cls: 'tag-time' });
    var d = DIFF_LABELS[game.id];
    if (d) tags.push({ text: T('lobby.diff' + d), cls: 'tag-diff' });
    return tags;
  }

  /* ---------- 持久化小工具（带内存缓存：render 101 卡不再反复读 localStorage） ---------- */
  var _favCache = null, _seenCache = null, _recentCache = null;
  function readArr(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : []; }
    catch (e) { return []; }
  }
  function writeArr(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
    // 失效对应缓存，下次读取重新拉取
    if (key === FAV_KEY) _favCache = null;
    else if (key === SEEN_KEY) _seenCache = null;
    else if (key === RECENT_KEY) _recentCache = null;
  }
  function getFavs() { if (_favCache === null) _favCache = readArr(FAV_KEY); return _favCache; }
  function isFav(id) { return getFavs().indexOf(id) >= 0; }
  function toggleFav(id) {
    var f = getFavs();
    var i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.unshift(id);
    writeArr(FAV_KEY, f);
    return i < 0; // 返回是否变为已收藏
  }
  function getRecent() { if (_recentCache === null) _recentCache = readArr(RECENT_KEY); return _recentCache; }
  function getSeen() { if (_seenCache === null) _seenCache = readArr(SEEN_KEY); return _seenCache; }

  /* 最高分缓存：一次渲染内每个游戏只读一次 localStorage */
  var _bestCache = null;
  function getBestCached(id) {
    if (_bestCache === null) {
      _bestCache = {};
      if (window.GAMES) for (var i = 0; i < window.GAMES.length; i++) {
        _bestCache[window.GAMES[i].id] = Arcade.storage.getBest(window.GAMES[i].id);
      }
    }
    return _bestCache[id] !== undefined ? _bestCache[id] : Arcade.storage.getBest(id);
  }

  /* ---------- 顶部控件：搜索 + 分类 chip ---------- */
  function buildControls() {
    var cats = [T('lobby.all')].concat(window.GAME_CATEGORIES.map(function (c) { return T('cat.' + c); }), [T('lobby.favs')]);
    // 状态 cat 存中文 key；显示用翻译
    function catKey(display) {
      if (display === T('lobby.all')) return '全部';
      if (display === T('lobby.favs')) return '收藏';
      for (var i = 0; i < window.GAME_CATEGORIES.length; i++) {
        if (T('cat.' + window.GAME_CATEGORIES[i]) === display) return window.GAME_CATEGORIES[i];
      }
      return display;
    }
    var chips = cats.map(function (c) {
      return '<button class="chip' + (c === (state.cat === '全部' ? T('lobby.all') : (state.cat === '收藏' ? T('lobby.favs') : T('cat.' + state.cat))) ? ' active' : '') + '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
    /* 难度 / 时长 tag 筛选（P1.5 内容扩充） */
    function tagChips(key, vals, labels) {
      var all = '<button class="chip tag-chip' + (state[key] === '' ? ' active' : '') + '" data-tagkey="' + key + '" data-tagval="">' + T('lobby.all') + '</button>';
      return all + vals.map(function (v, i) {
        return '<button class="chip tag-chip' + (state[key] === v ? ' active' : '') + '" data-tagkey="' + key + '" data-tagval="' + v + '">' + labels[i] + '</button>';
      }).join('');
    }
    var tagRow =
      '<div class="tag-filter-row">' +
      '<span class="tag-lbl">' + T('lobby.lvl') + '</span>' +
      tagChips('lvl', ['easy', 'mid', 'hard'], [T('lobby.easy'), T('lobby.mid'), T('lobby.hard')]) +
      '</div>' +
      '<div class="tag-filter-row">' +
      '<span class="tag-lbl">' + T('lobby.time') + '</span>' +
      tagChips('time', ['1min', '5min', '10min'], [T('lobby.t1'), T('lobby.t5'), T('lobby.t10')]) +
      '</div>';
    controls.innerHTML =
      '<div class="lobby-search">' +
      /* 安全约定：value 永远不进模板字符串；state.q 一律经 input.value 属性赋值（A1） */
      '  <input id="lobby-search-input" type="search" aria-label="' + T('lobby.searchPlaceholder') + '" placeholder="' + T('lobby.searchPlaceholder') + '" value="">' +
      '</div>' +
      '<div class="filter-chips">' + chips + '</div>' +
      tagRow;

    var input = controls.querySelector('#lobby-search-input');
    input.value = state.q || ''; /* DOM 属性赋值，天然免转义 */
    var debounceTimer = null;
    input.addEventListener('input', function () {
      state.q = input.value.trim();
      Arcade.audio && Arcade.audio.play('type');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, 120);
    });
    // 从 URL 参数进入：?q=xxx 自动填入搜索框（配合 JSON-LD SearchAction 深链）
    // ?focus=search 来自全局导航 🔍，仅聚焦
    try {
      if (window.location && window.location.search) {
        var sp = new URLSearchParams(window.location.search);
        var q = sp.get('q');
        if (q) { q = String(q).slice(0, 100); input.value = q; state.q = q.toLowerCase(); }
        if (sp.get('focus') === 'search' || q) {
          setTimeout(function () { if (input && input.focus) input.focus(); }, 120);
        }
      }
    } catch (e) {}
    var chipEls = controls.querySelectorAll('.chip');
    for (var i = 0; i < chipEls.length; i++) {
      chipEls[i].addEventListener('click', function () {
        state.cat = catKey(this.getAttribute('data-cat'));
        Arcade.audio && Arcade.audio.play('ui');
        // 同步 active 态
        for (var j = 0; j < chipEls.length; j++) {
          var d = chipEls[j].getAttribute('data-cat');
          chipEls[j].classList.toggle('active', d === (state.cat === '全部' ? T('lobby.all') : (state.cat === '收藏' ? T('lobby.favs') : T('cat.' + state.cat))));
        }
        render();
      });
    }
    /* tag 筛选（难度/时长）点击 */
    var tagEls = controls.querySelectorAll('.tag-chip');
    for (var t = 0; t < tagEls.length; t++) {
      tagEls[t].addEventListener('click', function () {
        var k = this.getAttribute('data-tagkey');
        var v = this.getAttribute('data-tagval');
        state[k] = v;
        Arcade.audio && Arcade.audio.play('ui');
        var sibs = controls.querySelectorAll('.tag-chip[data-tagkey="' + k + '"]');
        for (var s = 0; s < sibs.length; s++) {
          sibs[s].classList.toggle('active', sibs[s].getAttribute('data-tagval') === v);
        }
        render();
      });
    }
  }

  /* ---------- 最高分格式化 ---------- */
  // 各游戏 BEST 徽章单位（计时 s / 步数 / 次数 / 连胜 等）；未列出的默认无单位
  // A2 补齐：全部 105 款记分游戏均有单位（语义对照各游戏 submitScore 实参）
  var BEST_UNITS = {
    /* 计时（秒，越低越好） */
    sudoku: 's', nonogram: 's', fillomino: 's', wordsearch: 's', paintbynum: 's',
    binary: 's', morselong: 's', vigenere: 's', frogcross: 's', minesweeper: 's',
    xor: 's', campaign: 's', adfgvx: 's', detective: 's', bifid: 's', bombe: 's',
    hill: 's', workshop: 's', venona: 's', jn25: 's', plugboard: 's', trifid: 's',
    purple: 's', m209: 's', lorenz: 's', spotdiff: 's', bacon: 's', llk: 's',
    klondike: 's', sheep: 's', sectorsiege: 's', playfair: 's', enigma: 's',
    reaction: 'ms',
    /* 步数 */
    hanoi: "Steps", lightsout: "Steps", puzzle15: "Steps", shikaku: "Steps", klotski: "Steps",
    sokoban: "Steps", memory: "Steps", maze: "Steps",
    slitherlink: "Steps", hashi: "Steps",
    /* 次数 / 题数 */
    guess: "Times", codebreak: "Times", codeguess: "Times", caesar: "Times", affine: "Times",
    base64: "Times", freq: "Times", railfence: "Times", substitution: "Times",
    pipe: "Times", circuit: "Times", catapult: "Times",
    game24: "Solved", morse: "Solved", morsetap: "Solved",
    atbash: "Solved", polybius: "Solved", nihilist: "Solved", starflag: "Solved",
    /* 分数 */
    snake: 'Pts', g2048: 'Pts', blocks: 'Pts', match3: 'Pts', brickbash: 'Pts',
    pixelbird: 'Pts', catch: 'Pts', chess: 'Pts', checkers: 'Pts', diceluck: 'Pts',
    siege: 'Pts', 'dungeon-cipher': 'Pts', maker: 'Pts', tank: 'Pts', bullethell: 'Pts',
    ballpop: 'Pts', curling: 'Pts', bowling: 'Pts', typecode: 'Pts', platformer: 'Pts',
    spaceshooter: 'Pts', rhythm: 'Pts', billiards: 'Pts', mazedot: 'Pts', asteroidf: 'Pts',
    bb84: 'Pts', autokey: 'Pts', hashlab: 'Pts', solitaire: 'Pts', rsa: 'Pts', shamir: 'Pts', sm4: 'Pts', acrostic: 'Pts', phishhunt: 'Pts', pixeldino: 'Pts', deckbuilder: 'Pts', tactics: 'Pts', roperescue: 'Pts',
    fruitmerge: 'Pts', railshooter: 'Pts', dungeon: 'Pts',
    /* 特殊语义 */
    poker: 'Chips', blackjack: 'Chips',
    towerdefense: 'Kills',
    twopaddle: 'Wins',
    bridge: "Blocks",
    fourline: 'Streak', gomoku: 'Streak', reversi: 'Streak', tictactoe: 'Streak'
  };
  function formatBest(game) {
    if (!game.bestMode) return null;
    var best = getBestCached(game.id);
    if (best === null) return null;
    var u = BEST_UNITS[game.id];
    if (!u) return '' + best;
    // 通用单位（s/ms）不翻译不加空格；中文语境单位走 i18n（步/次/块/连胜）
    var txt = (u === 's' || u === 'ms') ? u : T('lobby.unit' + u);
    return best + (u === 's' || u === 'ms' ? '' : ' ') + txt;
  }

  /* ---------- 单卡片 ---------- */
  function buildCard(game, colorHex) {
    var a = document.createElement('a');
    a.className = 'game-card card hoverable';
    a.href = pathOf(game.path);
    a.style.setProperty('--card-neon', colorHex);

    if (isNew(game.id)) {
      var newTag = document.createElement('span');
      newTag.className = 'new-tag';
      newTag.textContent = 'NEW';
      a.appendChild(newTag);
    }

    var star = document.createElement('span');
    star.className = 'star' + (isFav(game.id) ? ' on' : '');
    star.textContent = '★';
    star.title = isFav(game.id) ? T('lobby.favOn') : T('lobby.favOff');
    star.setAttribute('role', 'button');
    star.setAttribute('tabindex', '0');
    star.setAttribute('aria-pressed', isFav(game.id) ? 'true' : 'false');
    star.setAttribute('aria-label', (isFav(game.id) ? T('lobby.favOn') : T('lobby.favOff')) + ' ' + T('g.' + game.id + '.t'));
    function toggleStar() {
      var nowFav = toggleFav(game.id);
      star.classList.toggle('on', nowFav);
      star.title = nowFav ? T('lobby.favOn') : T('lobby.favOff');
      star.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
      star.setAttribute('aria-label', (nowFav ? T('lobby.favOn') : T('lobby.favOff')) + ' ' + T('g.' + game.id + '.t'));
      Arcade.audio && Arcade.audio.play('coin');
      if (state.cat === '收藏' && !nowFav) render(); // 取消收藏时从收藏视图移除
    }
    star.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleStar();
    });
    star.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleStar();
      }
    });
    a.appendChild(star);

    var icon = document.createElement('div');
    icon.className = 'game-icon';
    icon.textContent = game.icon;
    a.appendChild(icon);

    var title = document.createElement('h3');
    title.className = 'game-title';
    title.textContent = T('g.' + game.id + '.t');
    a.appendChild(title);

    var desc = document.createElement('p');
    desc.className = 'game-desc';
    desc.textContent = T('g.' + game.id + '.d');
    a.appendChild(desc);

    var meta = document.createElement('div');
    meta.className = 'game-meta';

    // 已玩角标：有最高分纪录（记分游戏）或进入过最近游玩（不记分游戏）
    var played = getBestCached(game.id) !== null || getRecent().indexOf(game.id) >= 0;
    if (played) {
      var playedBadge = document.createElement('span');
      playedBadge.className = 'badge played';
      playedBadge.textContent = T('lobby.playedBadge');
      playedBadge.title = T('lobby.playedTitle');
      meta.appendChild(playedBadge);
    }

    gameTags(game).forEach(function (tag) {
      var t = document.createElement('span');
      t.className = 'badge ' + tag.cls;
      t.textContent = tag.text;
      meta.appendChild(t);
    });

    // 📜 史话徽章：该游戏出现在编年史 N 个章节（破译主题联动）
    if (window.Arcade && Arcade.stories && window.STORIES) {
      var chs = Arcade.stories.chaptersOf(game.id);
      if (chs.length) {
        var storyBadge = document.createElement('a');
        storyBadge.className = 'badge story-badge';
        storyBadge.href = PP + 'story.html?id=' + chs[0].id;
        storyBadge.textContent = '📜 ' + chs.length;
        storyBadge.title = chs.map(function (c) { return T(c.titleKey); }).join(' / ');
        meta.appendChild(storyBadge);
      }
    }

    var mobileBadge = document.createElement('span');
    mobileBadge.className = 'badge ' + (game.mobile === 'ok' ? 'mobile-ok' : 'mobile-pad');
    mobileBadge.textContent = game.mobile === 'ok' ? T('lobby.mobileOk') : T('lobby.mobilePad');
    meta.appendChild(mobileBadge);

    var best = formatBest(game);
    if (best !== null) {
      var bestBadge = document.createElement('span');
      bestBadge.className = 'badge best';
      bestBadge.textContent = '🏆 ' + best;
      meta.appendChild(bestBadge);
    }

    a.appendChild(meta);
    return a;
  }

  /* ---------- 过滤逻辑 ---------- */
  function matchGame(game) {
    if (state.cat === '收藏' && !isFav(game.id)) return false;
    if (state.cat !== '全部' && state.cat !== '收藏' && game.category !== state.cat) return false;
    if (state.lvl && game.lvl !== state.lvl) return false;
    if (state.time && game.time !== state.time) return false;
    if (state.q) {
      var hay = (game.title + ' ' + game.desc + ' ' + game.category + ' ' +
        T('g.' + game.id + '.t') + ' ' + T('g.' + game.id + '.d') + ' ' + T('cat.' + game.category)).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
    }
    return true;
  }

  /* ---------- 渲染主体 ---------- */
  function render() {
    lobbyRoot.innerHTML = '';

    // 每日破译中心（今日 5 款每日题进度 + 连破）
    if (Arcade.daily) {
      var dailySec = document.createElement('section');
      dailySec.className = 'lobby-section';
      var dTitle = document.createElement('h2');
      dTitle.className = 'section-title neon-text purple';
      var streak = Arcade.daily.streak();
      dTitle.innerHTML = T('lobby.daily') + ' <small class="daily-sub">' + Arcade.daily.dayStr() +
        (streak > 0 ? ' · 🔥 ' + T('lobby.streak') + ' ' + streak + ' ' + T('lobby.days') : ' · ' + T('lobby.dailyStart')) + '</small>';
      dailySec.appendChild(dTitle);

      var hub = document.createElement('div');
      hub.className = 'daily-hub';
      var done = 0;
      DAILY_IDS.forEach(function (id) {
        var g = findGame(id);
        if (!g) return;
        var solved = Arcade.daily.isSolved(id);
        if (solved) done++;
        var row = document.createElement('a');
        row.className = 'daily-row' + (solved ? ' done' : '');
        row.href = pathOf(g.path);
        var t = Arcade.daily.solvedTime(id);
        row.innerHTML =
          '<span class="di">' + g.icon + '</span>' +
          '<span class="dt">' + T('g.' + id + '.t') + '</span>' +
          '<span class="ds">' + (solved ? T('lobby.dailySolvedT').replace('{t}', t) : '⏳ ' + T('lobby.pending')) + '</span>';
        hub.appendChild(row);
      });
      var progRow = document.createElement('div');
      progRow.className = 'daily-progress';
      progRow.innerHTML =
        T('lobby.todayDone') + ' <b>' + done + '</b> / ' + DAILY_IDS.length + '　' +
        '<span class="progress-bar slim"><i style="width:' + Math.round(done / DAILY_IDS.length * 100) + '%"></i></span>';
      hub.insertBefore(progRow, hub.firstChild);
      dailySec.appendChild(hub);

      // 电报彩蛋：密码侦探隐藏结局「真相」达成后，大厅截获联动电报
      if (window.Arcade && Arcade.plot && Arcade.plot.has('detectiveHidden')) {
        var telegraph = document.createElement('div');
        telegraph.className = 'telegraph-line';
        telegraph.textContent = T('lobby.telegraph');
        dailySec.appendChild(telegraph);
      }
      lobbyRoot.appendChild(dailySec);
    }

    // 最近游玩（仅在未筛选时显示）
    if (state.cat === '全部' && !state.q) {
      var rec = getRecent();
      if (rec.length) {
        var recSec = document.createElement('section');
        recSec.className = 'lobby-section';
        var rh = document.createElement('h2');
        rh.className = 'section-title neon-text cyan';
        rh.textContent = T('lobby.recent');
        recSec.appendChild(rh);
        var strip = document.createElement('div');
        strip.className = 'recent-strip';
        rec.forEach(function (id) {
          var g = null;
          for (var i = 0; i < window.GAMES.length; i++) if (window.GAMES[i].id === id) g = window.GAMES[i];
          if (!g) return;
          var c = document.createElement('a');
          c.className = 'recent-card';
          c.href = pathOf(g.path);
          c.innerHTML = '<div class="ri">' + g.icon + '</div><div class="rt">' + T('g.' + id + '.t') + '</div>';
          strip.appendChild(c);
        });
        recSec.appendChild(strip);
        lobbyRoot.appendChild(recSec);
      }
    }

    // 进度条：已挑战 / 总（仅统计可记分游戏；双人/无记分类不计入）
    var scoredGames = window.GAMES.filter(function (g) { return g.bestMode; });
    var total = scoredGames.length;
    var played = 0;
    scoredGames.forEach(function (g) { if (getBestCached(g.id) !== null) played++; });
    var prog = document.createElement('div');
    prog.className = 'lobby-section';
    prog.innerHTML =
      '<div class="lobby-progress">' + T('lobby.challenged') + ' ' + played + ' / ' + total + ' ' + T('lobby.games') + '</div>' +
      '<div class="progress-bar"><i style="width:' + (total ? Math.round(played / total * 100) : 0) + '%"></i></div>';
    lobbyRoot.appendChild(prog);

    // 分类分组
    var cats = state.cat === '收藏' || state.cat === '全部'
      ? window.GAME_CATEGORIES
      : [state.cat];

    var anyShown = false;
    cats.forEach(function (cat) {
      var games = window.GAMES.filter(function (g) { return g.category === cat && matchGame(g); });
      if (!games.length) return;
      anyShown = true;
      var colorName = CATEGORY_COLORS[cat] || 'cyan';
      var colorHex = COLOR_HEX[colorName];

      var section = document.createElement('section');
      section.className = 'lobby-section';
      var heading = document.createElement('h2');
      heading.className = 'section-title neon-text ' + colorName;
      heading.textContent = T('cat.' + cat);
      section.appendChild(heading);

      var grid = document.createElement('div');
      grid.className = 'game-grid';
      games.forEach(function (g) {
        grid.appendChild(buildCard(g, colorHex));
        markSeen(g.id);
      });
      section.appendChild(grid);
      lobbyRoot.appendChild(section);
    });

    if (!anyShown) {
      var empty = document.createElement('div');
      empty.className = 'lobby-progress';
      empty.style.marginTop = '20px';
      empty.textContent = state.cat === '收藏' ? T('lobby.emptyFavs') : T('lobby.emptySearch');
      lobbyRoot.appendChild(empty);
    }
  }

  // 统计信息 + 成就
  var stats = document.getElementById('lobby-stats');
  if (stats) {
    var statsText = T('lobby.statsLine').replace('{n}', window.GAMES.length);
    if (window.Arcade && Arcade.stats) {
      var achvRes = Arcade.stats.check();
      statsText += ' · ' + T('lobby.achv') + ' ' + achvRes.unlocked.length + '/' + achvRes.list.length;
      achvRes.fresh.forEach(function (a) {
        if (Arcade.ui) Arcade.ui.toast(T('stats.achvNew').replace('{n}', a.name), 'win');
      });
    }
    stats.textContent = statsText;
  }

  // 军衔徽章（能量条版，与档案页一致；跨游戏破译等级，纯本地）
  var rankEl = document.getElementById('lobby-rank');
  if (rankEl && window.Arcade && Arcade.rank) {
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

  // 破译足迹时间轴（编年史 P5）：11 时代刻度，玩过相关游戏或已读章节点亮
  var fpEl = document.getElementById('lobby-footprint');
  if (fpEl && window.Arcade && Arcade.stories && window.STORIES) {
    var fpHTML = '<div class="footprint"><div class="fp-lbl">' + T('lobby.footprint') + '</div><div class="fp-row">';
    Arcade.stories.getAll().forEach(function (ch) {
      var lit = Arcade.stories.isRead(ch.id);
      if (!lit) {
        ch.games.forEach(function (gid) {
          if (getBestCached(gid) !== null) lit = true;
        });
      }
      fpHTML += '<a class="fp-dot ' + (lit ? 'on' : 'off') + '" href="' + PP + 'story.html?id=' + ch.id + '" title="' + T(ch.titleKey) + '">' + (lit ? '✓' : '🔒') + '</a>';
    });
    fpHTML += '</div></div>';
    fpEl.innerHTML = fpHTML;
  }

  // 渲染结束：统一写一次"已见"标记（避免 101 卡逐卡写 localStorage）
  flushSeen();

  buildControls();
  render();
})();
