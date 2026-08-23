/* ============================================================
   纸牌接龙 KLONDIKE · 解码牌局（Windows 全球最流行纸牌）
   标准 Klondike：7 列红黑交替降序 / 4 基础堆 A→K 同花 / 抽牌堆。
   破译挂靠：打乱的牌局就是被「换位」的密文，把它重组回完整序列。
   两档翻牌（单张/三张）+ 撤销次数构成三难度 + 每日一题（固定洗牌种子）。
   核心逻辑用 ==KLON-CORE-START== / ==KLON-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==KLON-CORE-START== */
  var K_SUITS = ['♠', '♥', '♦', '♣'];
  var K_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function K_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function K_shuffle(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function K_color(s) { return (s === 0 || s === 3) ? 0 : 1; } // ♠♣ 黑 / ♥♦ 红（标准 Klondike）

  /** 新建一局：drawMode 1=单张翻 3=三张翻 */
  function K_newGame(seed, drawMode) {
    var rnd = K_mulberry32(seed || (Date.now() % 2147483647));
    var cards = [];
    for (var s = 0; s < 4; s++) for (var r = 0; r < 13; r++) cards.push({ v: r, s: s, up: false });
    K_shuffle(cards, rnd);
    var cols = [];
    var k = 0;
    for (var i = 0; i < 7; i++) {
      var col = [];
      for (var j = 0; j <= i; j++) {
        var c = cards[k++];
        c.up = (j === i);
        col.push(c);
      }
      cols.push(col);
    }
    return {
      cols: cols,
      found: [[], [], [], []],
      stock: cards.slice(k),
      waste: [],
      drawMode: drawMode || 1,
      moves: 0, undosLeft: 3
    };
  }

  /** 列顶（up 的牌；返回 null 若全盖） */
  function K_colTop(st, i) {
    var col = st.cols[i];
    for (var j = col.length - 1; j >= 0; j--) if (col[j].up) return col[j];
    return null;
  }

  /** 从列顶开始连续 up 的牌数 */
  function K_upRun(st, i) {
    var col = st.cols[i], n = 0;
    for (var j = col.length - 1; j >= 0; j--) {
      if (!col[j].up) break;
      n++;
    }
    return n;
  }

  /** 列间移动合法性（取 from 列末尾 count 张到 to 列） */
  function K_canMoveCol(st, from, to, count) {
    if (from === to) return false;
    var fc = st.cols[from], tc = st.cols[to];
    if (count < 1 || count > fc.length) return false;
    var base = fc[fc.length - count];
    if (!base.up) return false;
    if (tc.length === 0) return base.v === 12; // 空列只能放 K
    var top = K_colTop(st, to);
    if (!top) return false; // 防御：列有牌但无翻面顶牌
    return top.v === base.v + 1 && K_color(top.s) !== K_color(base.s);
  }

  /** 执行列间移动 */
  function K_moveCol(st, from, to, count) {
    if (!K_canMoveCol(st, from, to, count)) return false;
    var moving = st.cols[from].splice(st.cols[from].length - count, count);
    st.cols[to] = st.cols[to].concat(moving);
    K_flipTop(st, from);
    st.moves++;
    return true;
  }

  /** 翻列顶盖牌 */
  function K_flipTop(st, i) {
    var col = st.cols[i];
    if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true;
  }

  /** 列顶 → 基础堆 */
  function K_canToFound(st, i) {
    var top = K_colTop(st, i);
    if (!top) return false;
    var f = st.found[top.s];
    if (f.length === 0) return top.v === 0;
    return f[f.length - 1].v === top.v - 1;
  }
  function K_toFound(st, i) {
    if (!K_canToFound(st, i)) return false;
    var top = st.cols[i].pop();
    st.found[top.s].push(top);
    K_flipTop(st, i);
    st.moves++;
    return true;
  }

  /** 抽牌：stock → waste（按翻牌模式）；stock 空则回收 waste */
  function K_draw(st) {
    if (st.stock.length === 0) {
      // 回收（waste 翻转回 stock）
      while (st.waste.length) st.stock.push(st.waste.pop());
      return 'recycle';
    }
    var n = st.drawMode;
    for (var i = 0; i < n && st.stock.length; i++) st.waste.push(st.stock.pop());
    return 'draw';
  }

  /** waste 顶 → 列（同列间规则） */
  function K_canWasteToCol(st, to) {
    if (!st.waste.length) return false;
    var base = st.waste[st.waste.length - 1];
    var tc = st.cols[to];
    if (tc.length === 0) return base.v === 12;
    var top = K_colTop(st, to);
    if (!top) return false; // 防御：列有牌但无翻面顶牌
    return top.v === base.v + 1 && K_color(top.s) !== K_color(base.s);
  }
  function K_moveWasteToCol(st, to) {
    if (!K_canWasteToCol(st, to)) return false;
    var top = st.waste.pop();
    st.cols[to].push(top);
    st.moves++;
    return true;
  }

  /** waste 顶 → 基础堆 */
  function K_canWasteToFound(st) {
    if (!st.waste.length) return false;
    var top = st.waste[st.waste.length - 1];
    var f = st.found[top.s];
    if (f.length === 0) return top.v === 0;
    return f[f.length - 1].v === top.v - 1;
  }
  function K_wasteToFound(st) {
    if (!K_canWasteToFound(st)) return false;
    var top = st.waste.pop();
    st.found[top.s].push(top);
    st.moves++;
    return true;
  }

  /** 胜利判定 */
  function K_won(st) {
    for (var s = 0; s < 4; s++) if (st.found[s].length !== 13) return false;
    return true;
  }

  /* ============================================================
     每日一题：构造式必胜牌局（标准 7 列 + 24 张发牌堆）
     设计：轮转顺序 A♠A♥A♦A♣ 2♠2♥2♦2♣ 3♠…K♣；
     列顶 = 前 7 张（四 A + 2♠2♥2♦），列隐藏牌按揭示链编排（揭示即下一张可入基础），
     发牌堆 = 后 24 张反序（draw-3 抽出的 waste 顶依序可入基础）。
     全程只需「列顶/废牌顶 → 基础堆」，无需列间移动，必胜性已由独立贪心验证。
     花色按种子置换，保证每天牌面不同且全部可解。
     ============================================================ */
  function K_buildSolvableDeal(seed) {
    // 花色置换（种子确定，保证跨客户端一致）
    var perm = [0, 1, 2, 3];
    var rnd = K_mulberry32(seed || 1);
    for (var i = 3; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    function P(s) { return perm[s]; }
    // 轮转顺序
    var O = [];
    for (var v = 0; v < 13; v++) for (var s = 0; s < 4; s++) O.push({ v: v, s: P(s) });
    // 列 i：i 张隐藏（倒序揭示链）+ 顶卡
    var cols = [], hid = 0, hiddenByCol = [0, 1, 2, 3, 4, 5, 6];
    for (var ci = 0; ci < 7; ci++) {
      var col = [];
      var nHidden = hiddenByCol[ci];
      for (var k = nHidden - 1; k >= 0; k--) col.push({ v: O[7 + hid + k].v, s: O[7 + hid + k].s, up: false });
      hid += nHidden;
      col.push({ v: O[ci].v, s: O[ci].s, up: true });
      cols.push(col);
    }
    // 发牌堆：O[28..51] 反序（顶 = O[28] 先被抽）
    var stock = [];
    for (var k2 = 51; k2 >= 28; k2--) stock.push({ v: O[k2].v, s: O[k2].s, up: false });
    return { cols: cols, found: [[], [], [], []], stock: stock, waste: [], drawMode: 3, moves: 0, undosLeft: 0 };
  }
  /* ==KLON-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var DIFF_INFO = [
    { t: T('gs.klondike.diffEasy'), d: T('gs.klondike.diffEasyD') },
    { t: T('gs.klondike.diffNormal'), d: T('gs.klondike.diffNormalD') },
    { t: T('gs.klondike.diffHard'), d: T('gs.klondike.diffHardD') }
  ];

  root.innerHTML =
    '<div class="kl-wrap">' +
    '  <div class="kl-pick hidden" id="kl-pick">' +
    '    <div class="kl-pick-t">' + T('gs.klondike.pickT') + '</div>' +
    '    <div class="kl-pick-d">' + T('gs.klondike.pickD') + '</div>' +
    '    <div class="kl-pick-btns">' +
    DIFF_INFO.map(function (d, i) {
      return '<button class="btn mode-btn" data-i="' + i + '">' + d.t + '<small>' + d.d + '</small></button>';
    }).join('') +
    '    </div>' +
    '    <button class="btn mode-btn" id="kl-pick-daily">' + T('gs.klondike.pickDaily') + '</button>' +
    '  </div>' +
    '  <div id="kl-game" style="display:none">' +
    '    <div class="kl-info"><span id="kl-lev"></span><span id="kl-timer">0s</span></div>' +
    '    <div class="kl-top">' +
    '      <div class="kl-found" id="kl-found"></div>' +
    '      <div class="kl-stock" id="kl-stock"></div>' +
    '    </div>' +
    '    <div class="kl-cols" id="kl-cols"></div>' +
    '    <div class="kl-status">' +
    '      <span>' + T('gs.klondike.statusMoves') + ' <b id="kl-moves">0</b></span>' +
    '      <span>' + T('gs.klondike.statusUndo') + ' <b id="kl-undo">0</b> ' + T('gs.klondike.undoUnit') + '</span>' +
    '      <button class="btn kl-mini" id="kl-undo-btn">' + T('gs.klondike.undoBtn') + '</button>' +
    '      <button class="btn kl-mini" id="kl-new">' + T('gs.klondike.newBtn') + '</button>' +
    '    </div>' +
    '    <div class="kl-msg" id="kl-msg"></div>' +
    '  </div>' +
    '  <div class="kl-overlay hidden" id="kl-overlay">' +
    '    <h2 id="kl-ov-title"></h2>' +
    '    <p id="kl-ov-text"></p>' +
    '    <button class="btn" id="kl-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var pickEl = document.getElementById('kl-pick');
  var gameEl = document.getElementById('kl-game');
  var levEl = document.getElementById('kl-lev');
  var timerEl = document.getElementById('kl-timer');
  var foundEl = document.getElementById('kl-found');
  var stockEl = document.getElementById('kl-stock');
  var colsEl = document.getElementById('kl-cols');
  var movesEl = document.getElementById('kl-moves');
  var undoEl = document.getElementById('kl-undo');
  var msgEl = document.getElementById('kl-msg');
  var overlayEl = document.getElementById('kl-overlay');
  var ovTitle = document.getElementById('kl-ov-title');
  var ovText = document.getElementById('kl-ov-text');
  var ovBtn = document.getElementById('kl-ov-btn');

  var st = null;
  var sel = null; // { kind: 'col'|'waste', col?: i, count?: n }
  var history = [];
  var isDaily = false;
  var chalStart = 0, totalMs = 0, timerTick = null;

  function totalSec() { return Math.round(totalMs / 1000); }

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function cardTxt(c) { return K_RANKS[c.v] + K_SUITS[c.s]; }

  function pushHistory() { history.push(JSON.stringify(st)); }

  function startGame(diffIdx, daily) {
    isDaily = !!daily;
    var drawMode = daily || diffIdx === 2 ? 3 : 1;
    var undos = daily ? 0 : (diffIdx === 0 ? 3 : (diffIdx === 1 ? 1 : 0));
    // 每日一题：构造式必胜牌局（花色按日种子置换，全部可解；修复随机洗牌可能不可解）
    st = daily ? K_buildSolvableDeal(todaySeed()) : K_newGame(daily ? todaySeed() : undefined, drawMode);
    st.undosLeft = undos;
    history = [];
    sel = null;
    pickEl.classList.add('hidden');
    gameEl.style.display = '';
    levEl.textContent = daily ? T('gs.klondike.dailyLev') : T('gs.klondike.chalLev').replace('{t}', DIFF_INFO[diffIdx].t).replace('{d}', T(drawMode === 1 ? 'gs.klondike.draw1' : 'gs.klondike.draw3'));
    paintAll();
    resetClock();
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function paintAll() {
    paintFound();
    paintStock();
    paintCols();
    movesEl.textContent = st.moves;
    undoEl.textContent = st.undosLeft;
    msgEl.textContent = '';
  }

  function paintFound() {
    foundEl.innerHTML = '';
    for (var s = 0; s < 4; s++) {
      var f = st.found[s];
      var cell = document.createElement('div');
      cell.className = 'kl-fcell' + (f.length ? ' has' : '');
      cell.textContent = f.length ? cardTxt(f[f.length - 1]) : K_SUITS[s];
      if (f.length === 0) cell.dataset.s = s;
      cell.addEventListener('click', function () { clickFound(parseInt(this.dataset.s, 10) || -1); });
      foundEl.appendChild(cell);
    }
  }

  function paintStock() {
    stockEl.innerHTML = '';
    var cell = document.createElement('div');
    cell.className = 'kl-fcell';
    if (st.stock.length) {
      cell.textContent = '🂠';
      cell.classList.add('clickable');
      cell.title = T('gs.klondike.stockTitle').replace('{n}', st.stock.length);
      cell.addEventListener('click', function () {
        pushHistory();
        K_draw(st);
        sel = null;
        paintAll();
        if (Arcade.audio) Arcade.audio.play('coin');
      });
    } else if (st.waste.length) {
      cell.textContent = '↻';
      cell.classList.add('clickable');
      cell.title = T('gs.klondike.recycleTitle');
      cell.addEventListener('click', function () {
        pushHistory();
        K_draw(st);
        sel = null;
        paintAll();
        if (Arcade.audio) Arcade.audio.play('coin');
      });
    }
    stockEl.appendChild(cell);
    // waste 顶显示
    if (st.waste.length) {
      var w = document.createElement('div');
      w.className = 'kl-waste' + (sel && sel.kind === 'waste' ? ' sel' : '');
      w.textContent = cardTxt(st.waste[st.waste.length - 1]);
      w.addEventListener('click', function () {
        if (sel && sel.kind === 'waste') { sel = null; paintAll(); return; }
        sel = { kind: 'waste' };
        paintAll();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
      stockEl.appendChild(w);
    }
  }

  function paintCols() {
    colsEl.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      (function (ci) {
        var col = st.cols[ci];
        var div = document.createElement('div');
        div.className = 'kl-col';
        for (var j = 0; j < col.length; j++) {
          (function (c, up, idxInCol) {
            var card = document.createElement('div');
            card.className = 'kl-card' + (up ? ' up' : ' down') + ((c.s === 1 || c.s === 2) ? ' red' : '');
            card.textContent = up ? cardTxt(c) : '🂠';
            if (up) {
              card.classList.add('clickable');
              if (sel && sel.kind === 'col' && sel.col === ci && idxInCol >= col.length - sel.count) card.classList.add('sel');
              card.addEventListener('click', function () {
                clickColCard(ci, idxInCol);
              });
            }
            div.appendChild(card);
          })(col[j], col[j].up, j);
        }
        // 空列点击区
        if (col.length === 0) {
          var empty = document.createElement('div');
          empty.className = 'kl-card empty';
          empty.addEventListener('click', function () { clickColCard(ci, -1); });
          div.appendChild(empty);
        }
        colsEl.appendChild(div);
      })(i);
    }
  }

  function clickColCard(ci, idxInCol) {
    var col = st.cols[ci];
    if (sel && sel.kind === 'col') {
      // 目标列：尝试移动选中组（成功才记历史）
      if (sel.col !== ci) {
        if (K_canMoveCol(st, sel.col, ci, sel.count)) {
          pushHistory();
          K_moveCol(st, sel.col, ci, sel.count);
          sel = null;
          paintAll();
          if (Arcade.audio) Arcade.audio.play('coin');
          checkWin();
        } else {
          sel = null;
          msgEl.textContent = T('gs.klondike.msgCantMove');
          if (Arcade.audio) Arcade.audio.play('error');
          paintAll();
        }
        return;
      }
      // 同列：点在选中组内 → 清空；点在组外 → 改选
      var inGroup = idxInCol >= col.length - sel.count;
      if (inGroup) { sel = null; }
      else { sel = { kind: 'col', col: ci, count: col.length - idxInCol }; }
      paintAll();
      return;
    }
    if (sel && sel.kind === 'waste') {
      if (K_canWasteToCol(st, ci)) {
        pushHistory();
        K_moveWasteToCol(st, ci);
        sel = null; paintAll(); if (Arcade.audio) Arcade.audio.play('coin'); checkWin();
      } else { sel = null; msgEl.textContent = T('gs.klondike.msgCantCol'); if (Arcade.audio) Arcade.audio.play('error'); paintAll(); }
      return;
    }
    // 新选中（空列点击不产生虚假选中）
    if (idxInCol < 0) { sel = null; paintAll(); return; }
    var run = col.length - idxInCol;
    sel = { kind: 'col', col: ci, count: run };
    paintAll();
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function clickFound(s) {
    // 点到基础堆：尝试把选中牌上堆（成功才记历史）
    if (sel && sel.kind === 'col') {
      var col = st.cols[sel.col];
      if (sel.count === 1) {
        if (K_canToFound(st, sel.col)) {
          pushHistory();
          K_toFound(st, sel.col);
          sel = null; paintAll(); if (Arcade.audio) Arcade.audio.play('win'); checkWin();
        } else { sel = null; msgEl.textContent = T('gs.klondike.msgCantFound'); if (Arcade.audio) Arcade.audio.play('error'); paintAll(); }
      } else {
        msgEl.textContent = T('gs.klondike.msgSingleOnly');
      }
      return;
    }
    if (sel && sel.kind === 'waste') {
      if (K_canWasteToFound(st)) {
        pushHistory();
        K_wasteToFound(st);
        sel = null; paintAll(); if (Arcade.audio) Arcade.audio.play('win'); checkWin();
      } else { sel = null; msgEl.textContent = T('gs.klondike.msgCantFound'); if (Arcade.audio) Arcade.audio.play('error'); paintAll(); }
      return;
    }
    // 未选中：快捷双击列顶上堆由 clickColCard 处理；这里无操作
  }

  function checkWin() {
    if (K_won(st)) {
      totalMs += Date.now() - chalStart;
      if (timerTick) clearInterval(timerTick);
      if (Arcade.juice) Arcade.juice.win();
      ovTitle.textContent = T('gs.klondike.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.klondike.winD').replace('{s}', totalSec()).replace('{n}', st.moves);
      ovBtn.textContent = T('gs.klondike.again');
      ovBtn.onclick = function () {
        overlayEl.classList.add('hidden');
        pickEl.classList.remove('hidden');
        gameEl.style.display = 'none';
      };
      overlayEl.classList.remove('hidden');
      if (isDaily) { if (Arcade.daily) Arcade.daily.markSolved('klondike', totalSec()); }
      if (Arcade.shell) Arcade.shell.submitScore(totalSec());
    }
  }

  document.getElementById('kl-undo-btn').addEventListener('click', function () {
    if (!st || st.undosLeft <= 0 || !history.length) return;
    st = JSON.parse(history.pop());
    st.undosLeft = (st.undosLeft || 0) - 1;
    sel = null;
    paintAll();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  document.getElementById('kl-new').addEventListener('click', function () {
    overlayEl.classList.add('hidden');
    pickEl.classList.remove('hidden');
    gameEl.style.display = 'none';
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  function resetClock() {
    totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

  var pickBtns = pickEl.querySelectorAll('button[data-i]');
  for (var i = 0; i < pickBtns.length; i++) {
    pickBtns[i].addEventListener('click', function () {
      startGame(parseInt(this.dataset.i, 10), false);
    });
  }
  document.getElementById('kl-pick-daily').addEventListener('click', function () {
    startGame(2, true);
  });

  window.GAME_RESTART = function () {
    overlayEl.classList.add('hidden');
    pickEl.classList.remove('hidden');
    gameEl.style.display = 'none';
    resetClock();
  };

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.klondike.tut1t'), d: T('gs.klondike.tut1') },
    { t: T('gs.klondike.tut2t'), d: T('gs.klondike.tut2') },
    { t: T('gs.klondike.tut3t'), d: T('gs.klondike.tut3') },
    { t: T('gs.klondike.tut4t'), d: T('gs.klondike.tut4') }
  ];

})();
