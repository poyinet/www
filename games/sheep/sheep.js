/* ============================================================
   绵羊三消 SHEEP MATCH · 多层叠牌三消（保证可解）
   多层 3D 叠牌（上层压下层，只能点暴露的牌）→ 点入 7 格卡槽 → 3 张相同自动消除
   → 槽满 7 张未消即败。三道具（撤销 / 移出 / 洗牌）+ 第一关教学 / 第二关地狱。
   本站特性：用「可解构造生成器」保证存在一条通关序列——手感同样地狱，但绝对公平。
   核心逻辑用 ==YANG-CORE-START== / ==YANG-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==YANG-CORE-START== */
  var Y_ICONS = ['🐑', '🌾', '🥕', '🍄', '🐔', '🦆', '🍎', '🥚', '🪵', '🐿️', '🍇', '🌰'];
  var Y_MAX_SLOT = 7;

  function Y_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function Y_pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function Y_shuffle(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /**
   * 可解构造生成器：反向放置（先放最后消的底层牌，后放顶层牌），
   * 保证存在一条正向消除序列（后放先消）。返回全部牌与布局结构。
   * layout = { main: [ {x,y} ... 主堆格 ], blind: [ {x,y}... 盲盒列格 ], side: [ {x,y}... 辅助堆格 ] }
   * 返回 { cards: [ {id, icon, x, y, z} ], groups: k }
   */
  function Y_genBoard(level, seed) {
    var rnd = Y_mulberry32(seed || (Date.now() % 2147483647));
    // 布局：主堆 6×7，层深按格随机 1..3；盲盒左右 1×3；辅助底部 2×4
    var mainCells = [], blindCells = [], sideCells = [];
    for (var r = 0; r < 7; r++) for (var c = 0; c < 6; c++) mainCells.push({ x: c, y: r });
    for (var b = 0; b < 3; b++) { blindCells.push({ x: -2, y: b }); blindCells.push({ x: 7, y: b }); }
    for (var s = 0; s < 4; s++) { sideCells.push({ x: 1 + s, y: 8 }); sideCells.push({ x: 1 + s, y: 9 }); }
    var total = level === 1 ? 24 : 84; // 第一关教学 24 张，第二关地狱 84 张
    var k = total / 3;
    // 反向放置：groups[i] 是消除序列第 i 组（i=0 最先消 = 最后放 = 顶层）
    var groups = [];
    for (var i = 0; i < k; i++) groups.push({ icon: Y_ICONS[Math.floor(rnd() * Y_ICONS.length)], cards: [] });
    // 反向：从最后一组（最底层）开始放
    var placed = {}; // 'x,y' → 高度（z 数量）
    var cards = [];
    var idc = 0;
    // 先把「正向最后消」的组放到底层：优先主堆
    var order = [];
    for (var g = k - 1; g >= 0; g--) order.push(g); // 反向放置顺序：k-1, k-2, ..., 0
    for (var oi = 0; oi < order.length; oi++) {
      var gi = order[oi];
      var cells;
      var roll = rnd();
      if (level === 2) {
        // 第二关：主堆为主，盲盒/辅助区点缀
        cells = roll < 0.72 ? mainCells : (roll < 0.86 ? blindCells : sideCells);
      } else {
        cells = mainCells;
      }
      var chosen = [];
      var guard = 0;
      while (chosen.length < 3 && guard++ < 200) {
        var cell = Y_pick(rnd, cells);
        if (chosen.indexOf(cell) >= 0) continue;
        chosen.push(cell);
      }
      for (var ci = 0; ci < chosen.length; ci++) {
        var key = chosen[ci].x + ',' + chosen[ci].y;
        var z = placed[key] || 0;
        var card = { id: idc++, icon: groups[gi].icon, x: chosen[ci].x, y: chosen[ci].y, z: z, region: cells === mainCells ? 'main' : (cells === blindCells ? 'blind' : 'side') };
        cards.push(card);
        groups[gi].cards.push(card);
        placed[key] = z + 1;
      }
    }
    // 洗乱 id 顺序不影响结构（布局已定）
    return { cards: cards, k: k, total: total, level: level, groups: groups };
  }

  /** 可点判定：该 (x,y) 格最顶层的牌可点；返回卡片或 null（无牌） */
  function Y_topCard(cards, x, y) {
    var best = null;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.x === x && c.y === y) {
        if (!best || c.z > best.z) best = c;
      }
    }
    return best;
  }
  function Y_canPick(cards, card) {
    var top = Y_topCard(cards, card.x, card.y);
    return top && top.id === card.id;
  }

  /** 卡槽：加入一张，返回 { cleared: bool, slot: 新槽 } */
  function Y_slotPush(slot, card) {
    var s = slot.concat([card]);
    var cleared = false;
    // 找 3 张相同并消除（同图标任意 3 张——绵羊三消规则）
    var counts = {};
    for (var i = 0; i < s.length; i++) {
      var ic = s[i].icon;
      counts[ic] = (counts[ic] || 0) + 1;
    }
    for (var k in counts) {
      if (counts[k] >= 3) {
        var keep = [];
        var removed = 0;
        for (var j = 0; j < s.length; j++) {
          if (s[j].icon === k && removed < 3) removed++;
          else keep.push(s[j]);
        }
        s = keep;
        cleared = true;
        break;
      }
    }
    return { cleared: cleared, slot: s };
  }
  /** 槽满判定（满 7 且无 3 同可消） */
  function Y_slotFull(slot) {
    return slot.length >= Y_MAX_SLOT;
  }

  /** 道具：撤销（槽最后一张回棋盘）、移出（槽前 3 张回棋盘） */
  function Y_undo(slot, card) {
    if (!slot.length) return { slot: slot, card: null };
    var c = slot[slot.length - 1];
    return { slot: slot.slice(0, -1), card: c };
  }
  function Y_eject(slot) {
    if (!slot.length) return { slot: slot, cards: [] };
    var n = Math.min(3, slot.length);
    return { slot: slot.slice(n), cards: slot.slice(0, n) };
  }
  /** 道具：洗牌（保留结构重打图标，可解性不保证） */
  function Y_shuffleBoard(cards, rnd) {
    var icons = cards.map(function (c) { return c.icon; });
    Y_shuffle(icons, rnd || Y_mulberry32(Date.now() % 2147483647));
    for (var i = 0; i < cards.length; i++) cards[i].icon = icons[i];
    return cards;
  }

  /** 胜利判定 */
  function Y_won(cards, slot) {
    return cards.length === 0 && slot.length === 0;
  }
  /* ==YANG-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var CARD = 44, GAP = 47, OFFSET_X = 2, LIFT = 8;

  /* 响应式间距：320px 屏不溢出（10 列 × GAP + 边距 ≤ 视口宽） */
  function fitGap() {
    var vw = window.innerWidth || 375;
    GAP = vw <= 520 ? Math.max(28, Math.min(43, Math.floor((vw - 12) / 10))) : 47;
  }

  root.innerHTML =
    '<div class="yg-wrap">' +
    '<div class="yg-info"><button class="btn yg-daily" id="yg-daily">' + T('gs.sheep.daily') + '</button><span id="yg-lev"></span><span id="yg-timer">0s</span></div>' +
    '  <div class="yg-board" id="yg-board"></div>' +
    '  <div class="yg-slot" id="yg-slot"></div>' +
    '  <div class="yg-actions">' +
    '    <button class="btn" id="yg-undo">' + T('gs.sheep.undo') + '</button>' +
    '    <button class="btn" id="yg-eject">' + T('gs.sheep.eject') + '</button>' +
    '    <button class="btn" id="yg-shuffle">' + T('gs.sheep.shuffle') + '</button>' +
    '  </div>' +
    '  <div class="yg-msg" id="yg-msg"></div>' +
    '  <div class="yg-overlay hidden" id="yg-overlay">' +
    '    <h2 id="yg-ov-title"></h2>' +
    '    <p id="yg-ov-text"></p>' +
    '    <button class="btn" id="yg-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var levEl = document.getElementById('yg-lev');
  var timerEl = document.getElementById('yg-timer');
  var boardEl = document.getElementById('yg-board');
  var slotEl = document.getElementById('yg-slot');
  var msgEl = document.getElementById('yg-msg');
  var overlayEl = document.getElementById('yg-overlay');
  var ovTitle = document.getElementById('yg-ov-title');
  var ovText = document.getElementById('yg-ov-text');
  var ovBtn = document.getElementById('yg-ov-btn');

  var cards = [], slot = [], level = 1;
  var undoN = 99, ejectN = 99, shuffleN = 99; // 第一关无限，第二关各 1 次
  var chalStart = 0, totalMs = 0, timerTick = null;
  var busy = false;
  var isDaily = false;

  function totalSec() { return Math.round(totalMs / 1000); }

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function startGame(lv, seed, daily, keepTime) {
    fitGap(); // 按视口调整棋盘间距，防止窄屏溢出
    level = lv;
    isDaily = !!daily;
    var g = Y_genBoard(lv, seed);
    cards = g.cards;
    slot = [];
    undoN = lv === 1 ? 99 : 1;
    ejectN = lv === 1 ? 99 : 1;
    shuffleN = lv === 1 ? 99 : 1;
    busy = false;
    levEl.textContent = (lv === 1 ? T('gs.sheep.lev1') : T('gs.sheep.lev2')) + T('gs.sheep.levCard').replace('{n}', cards.length);
    msgEl.textContent = '';
    renderBoard();
    renderSlot();
    paintActions();
    if (keepTime) resetClock(true); else resetClock();
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.width = (GAP * 10 + 8) + 'px';
    var sorted = cards.slice().sort(function (a, b) { return a.z - b.z || a.y - b.y || a.x - b.x; });
    sorted.forEach(function (c) {
      var el = document.createElement('button');
      el.className = 'yg-card';
      el.textContent = c.icon;
      el.style.left = ((c.x + OFFSET_X) * GAP + 4) + 'px';
      el.style.top = (c.y * GAP + 24 - c.z * LIFT) + 'px'; // +24 顶部留白：修复 z≥1 叠牌顶部被裁剪
      el.style.zIndex = 10 + c.z * 100 + (c.y * 10 + c.x);
      el.dataset.id = c.id;
      el.addEventListener('click', function () { pickCard(c.id); });
      boardEl.appendChild(el);
    });
  }

  function renderSlot() {
    slotEl.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      var cell = document.createElement('div');
      cell.className = 'yg-scell' + (i < slot.length ? ' has' : '');
      if (i < slot.length) cell.textContent = slot[i].icon;
      slotEl.appendChild(cell);
    }
    paintActions();
  }

  function paintActions() {
    document.getElementById('yg-undo').textContent = T('gs.sheep.undo') + (undoN >= 99 ? '' : '×' + undoN);
    document.getElementById('yg-eject').textContent = T('gs.sheep.eject') + (ejectN >= 99 ? '' : '×' + ejectN);
    document.getElementById('yg-shuffle').textContent = T('gs.sheep.shuffle') + (shuffleN >= 99 ? '' : '×' + shuffleN);
  }

  function pickCard(id) {
    if (busy) return;
    var idx = -1;
    for (var i = 0; i < cards.length; i++) if (cards[i].id === id) { idx = i; break; }
    if (idx < 0) return;
    var c = cards[idx];
    if (!Y_canPick(cards, c)) {
      msgEl.textContent = T('gs.sheep.blocked');
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    cards.splice(idx, 1);
    var r = Y_slotPush(slot, c);
    slot = r.slot;
    renderBoard();
    renderSlot();
    if (r.cleared) {
      if (Arcade.audio) Arcade.audio.play('win');
      if (Arcade.juice) Arcade.juice.win();
      flashSlot();
    } else {
      if (Arcade.audio) Arcade.audio.play('coin');
    }
    if (Y_slotFull(slot)) {
      if (Arcade.audio) Arcade.audio.play('error');
      loseGame();
      return;
    }
    if (Y_won(cards, slot)) { winGame(); return; }
    // 死锁：棋盘清空但槽里还有未消牌（乱序吃牌触发）→ 判负
    if (cards.length === 0 && slot.length > 0) {
      if (Arcade.audio) Arcade.audio.play('error');
      loseGame();
    }
  }

  function flashSlot() {
    slotEl.classList.add('flash');
    setTimeout(function () { slotEl.classList.remove('flash'); }, 400);
  }

  /* 道具 */
  document.getElementById('yg-undo').addEventListener('click', function () {
    if (!slot.length || undoN <= 0) return;
    var r = Y_undo(slot, null);
    if (!r.card) return;
    slot = r.slot;
    cards.push(r.card);
    undoN--;
    renderBoard(); renderSlot();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  document.getElementById('yg-eject').addEventListener('click', function () {
    if (!slot.length || ejectN <= 0) return;
    var r = Y_eject(slot);
    slot = r.slot;
    cards = cards.concat(r.cards);
    ejectN--;
    renderBoard(); renderSlot();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  document.getElementById('yg-shuffle').addEventListener('click', function () {
    if (cards.length <= 3 || shuffleN <= 0) return;
    Y_shuffleBoard(cards);
    shuffleN--;
    renderBoard();
    msgEl.textContent = T('gs.sheep.shuffleDone');
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  function winGame() {
    totalMs += Date.now() - chalStart;
    if (level === 1) {
      // 第一关通关 → 进入第二关（保留累计用时）
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.ui) Arcade.ui.toast(T('gs.sheep.toastLv1'), 'win');
      startGame(2, undefined, isDaily, true);
      return;
    }
    if (Arcade.juice) Arcade.juice.win();
    ovTitle.textContent = T('gs.sheep.winT');
    ovTitle.className = 'win';
    ovText.innerHTML = T('gs.sheep.winD').replace('{t}', totalSec());
    ovBtn.textContent = T('gs.sheep.again');
    ovBtn.onclick = function () {
      overlayEl.classList.add('hidden');
      startGame(2, undefined, isDaily);
    };
    overlayEl.classList.remove('hidden');
    if (isDaily && Arcade.daily) Arcade.daily.markSolved('sheep', totalSec());
    if (Arcade.shell) Arcade.shell.submitScore(totalSec());
  }

  function loseGame() {
    if (Arcade.fx) Arcade.fx.flash('var(--neon-pink)');
    ovTitle.textContent = T('gs.sheep.loseT');
    ovTitle.className = '';
    ovText.innerHTML = T('gs.sheep.loseD').replace('{n}', level);
    ovBtn.textContent = T('gs.sheep.again');
    ovBtn.onclick = function () {
      overlayEl.classList.add('hidden');
      startGame(level);
    };
    overlayEl.classList.remove('hidden');
    if (Arcade.audio) Arcade.audio.play('error');
  }

  function resetClock(keep) {
    if (!keep) totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.sheep.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    overlayEl.classList.add('hidden');
    startGame(level);
    resetClock();
  };

  /* 每日一题按钮 */
  document.getElementById('yg-daily').addEventListener('click', function () {
    overlayEl.classList.add('hidden');
    startGame(2, todaySeed(), true);
    resetClock();
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  startGame(1);
  resetClock();

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.sheep.tut1t'), d: T('gs.sheep.tut1') },
    { t: T('gs.sheep.tut2t'), d: T('gs.sheep.tut2') },
    { t: T('gs.sheep.tut3t'), d: T('gs.sheep.tut3') },
    { t: T('gs.sheep.tut4t'), d: T('gs.sheep.tut4') }
  ];

})();
