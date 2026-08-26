/* ============================================================
   连连看 · 连线解码（国民品类 × 密码符号）
   牌面用密码元素（字母 / 摩斯 / 密码符号），两段三折线内连通即消除。
   核心：0/1/2 折连通判定（含棋盘外绕边）+ 成对生成 + 重排道具。
   核心逻辑用 ==LLK-CORE-START== / ==LLK-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==LLK-CORE-START== */
  var LLK_SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '⚑', '⚙', '⌁', '☍', '⌬', '◬', '⏚', '✶', '◉', '▣'];
  var LLK_CONF = {
    1: { rows: 6, cols: 8, kinds: 8 },   // 48 张 / 8 种 × 6
    2: { rows: 8, cols: 8, kinds: 16 },  // 64 张 / 16 种 × 4
    3: { rows: 9, cols: 10, kinds: 18 }  // 90 张 / 18 种 × 5
  };

  function LLK_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function LLK_shuffle(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /** 同行/同列无障碍（含端点；棋盘外 -1/n 视为空） */
  function LLK_lineClear(board, r1, c1, r2, c2) {
    var R = board.length, C = board[0].length;
    if (r1 === r2 && c1 === c2) return true; // 同一格（如绕边拐点重叠）无中间
    if (r1 === r2) {
      if (r1 < 0 || r1 >= R) return true; // 棋盘外行全空
      var step = c1 < c2 ? 1 : -1;
      for (var c = c1 + step; c !== c2; c += step) {
        if (c < 0 || c >= C) continue;
        if (board[r1][c] !== 0) return false;
      }
      return true;
    }
    if (c1 === c2) {
      if (c1 < 0 || c1 >= C) return true; // 棋盘外列全空
      var step2 = r1 < r2 ? 1 : -1;
      for (var r = r1 + step2; r !== r2; r += step2) {
        if (r < 0 || r >= R) continue;
        if (board[r][c1] !== 0) return false;
      }
      return true;
    }
    return false;
  }

  /** 两位置是否可消（≤2 折，含绕边）；返回 { points: [p1, 拐点…, p2] } 或 null */
  function LLK_findPath(board, p1, p2) {
    var R = board.length, C = board[0].length;
    var r1 = p1[0], c1 = p1[1], r2 = p2[0], c2 = p2[1];
    if (r1 === r2 && c1 === c2) return null;
    if (board[r1][c1] === 0 || board[r2][c2] === 0) return null;
    if (board[r1][c1] !== board[r2][c2]) return null;
    // 0/1 折
    if ((r1 === r2 || c1 === c2) && LLK_lineClear(board, r1, c1, r2, c2)) return { points: [[r1, c1], [r2, c2]] };
    if (LLK_at(board, r1, c2) === 0 && LLK_lineClear(board, r1, c1, r1, c2) && LLK_lineClear(board, r1, c2, r2, c2)) return { points: [[r1, c1], [r1, c2], [r2, c2]] };
    if (LLK_at(board, r2, c1) === 0 && LLK_lineClear(board, r1, c1, r2, c1) && LLK_lineClear(board, r2, c1, r2, c2)) return { points: [[r1, c1], [r2, c1], [r2, c2]] };
    // 2 折 H-V-H
    for (var c = -1; c <= C; c++) {
      if (c === c1 || c === c2) continue;
      if (LLK_at(board, r1, c) !== 0 || LLK_at(board, r2, c) !== 0) continue;
      if (LLK_lineClear(board, r1, c1, r1, c) && LLK_lineClear(board, r1, c, r2, c) && LLK_lineClear(board, r2, c, r2, c2)) return { points: [[r1, c1], [r1, c], [r2, c], [r2, c2]] };
    }
    // 2 折 V-H-V
    for (var r = -1; r <= R; r++) {
      if (r === r1 || r === r2) continue;
      if (LLK_at(board, r, c1) !== 0 || LLK_at(board, r, c2) !== 0) continue;
      if (LLK_lineClear(board, r1, c1, r, c1) && LLK_lineClear(board, r, c1, r, c2) && LLK_lineClear(board, r, c2, r2, c2)) return { points: [[r1, c1], [r, c1], [r, c2], [r2, c2]] };
    }
    return null;
  }
  function LLK_canConnect(board, p1, p2) { return !!LLK_findPath(board, p1, p2); }
  /** 越界访问返回 0（空） */
  function LLK_at(board, r, c) {
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return 0;
    return board[r][c];
  }

  /** 扫描全部可消对（用于提示/无解判定） */
  function LLK_findPair(board) {
    var R = board.length, C = board[0].length;
    var groups = {};
    for (var r = 0; r < R; r++) {
      for (var c = 0; c < C; c++) {
        var v = board[r][c];
        if (v === 0) continue;
        var key = 'v' + v;
        (groups[key] = groups[key] || []).push([r, c]);
      }
    }
    for (var k in groups) {
      var list = groups[k];
      for (var i = 0; i < list.length; i++) {
        for (var j = i + 1; j < list.length; j++) {
          if (LLK_canConnect(board, list[i], list[j])) return [list[i], list[j]];
        }
      }
    }
    return null;
  }

  /** 生成棋盘：成对放置 + 洗牌；返回 { board, R, C, kinds } */
  function LLK_genBoard(level, seed) {
    var conf = LLK_CONF[level];
    var R = conf.rows, C = conf.cols, kinds = conf.kinds;
    var total = R * C;
    if (total % 2 !== 0) throw new Error('board must be even');
    var per = total / kinds;
    if (per % 2 !== 0) { /* 凑偶：用 per 向下取偶，余量补 2 的倍数 */
      per = Math.floor(per / 2) * 2;
    }
    var rnd = LLK_mulberry32(seed || (Date.now() % 2147483647));
    var tiles = [];
    var usedKinds = 0;
    for (var k = 0; k < kinds && usedKinds * per < total; k++) {
      for (var n = 0; n < per; n++) tiles.push(k + 1);
      usedKinds++;
    }
    // 补足到 total（保证每牌偶数张）
    while (tiles.length < total) {
      var extraKind = (usedKinds % kinds) + 1;
      tiles.push(extraKind); tiles.push(extraKind);
      usedKinds++;
    }
    tiles = tiles.slice(0, total);
    LLK_shuffle(tiles, rnd);
    var board = [];
    for (var r = 0; r < R; r++) {
      var row = [];
      for (var c = 0; c < C; c++) row.push(tiles[r * C + c]);
      board.push(row);
    }
    return { board: board, R: R, C: C, kinds: kinds };
  }
  /* ==LLK-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var LEVEL_INFO = [
    { t: T('gs.llk.level1t'), d: T('gs.llk.level1d') },
    { t: T('gs.llk.level2t'), d: T('gs.llk.level2d') },
    { t: T('gs.llk.level3t'), d: T('gs.llk.level3d') }
  ];

  root.innerHTML =
    '<div class="ll-wrap">' +
    '  <div class="ll-tabs">' +
    '    <button class="btn mode-btn selected" id="ll-tab-chal">' + T('gs.llk.tabChal') + '</button>' +
    '    <button class="btn mode-btn" id="ll-tab-daily">' + T('gs.llk.tabDaily') + '</button>' +
    '  </div>' +
    '  <div class="ll-info"><span id="ll-lev"></span><span id="ll-timer">0s</span></div>' +
    '  <div class="ll-flavor" id="ll-brief"></div>' +
    '  <div class="ll-board" id="ll-board"></div>' +
    '  <div class="ll-status"><span>' + T('gs.llk.left') + ' <b id="ll-left">0</b> ' + T('gs.llk.tilesUnit') + '</span><span>' + T('gs.llk.steps') + ' <b id="ll-steps">0</b></span><span>' + T('gs.llk.shuffles') + ' <b id="ll-shuff">3</b> ' + T('gs.llk.shuffUnit') + '</span></div>' +
    '  <div class="ll-row">' +
    '    <button class="btn" id="ll-hint">' + T('gs.llk.hintBtn') + '</button>' +
    '    <button class="btn" id="ll-shuffle">' + T('gs.llk.shuffleBtn') + '</button>' +
    '  </div>' +
    '  <div class="ll-msg" id="ll-msg"></div>' +
    '  <div class="ll-overlay hidden" id="ll-overlay">' +
    '    <h2 id="ll-ov-title"></h2>' +
    '    <p id="ll-ov-text"></p>' +
    '    <button class="btn" id="ll-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var tabChal = document.getElementById('ll-tab-chal');
  var tabDaily = document.getElementById('ll-tab-daily');
  var levEl = document.getElementById('ll-lev');
  var timerEl = document.getElementById('ll-timer');
  var briefEl = document.getElementById('ll-brief');
  var boardEl = document.getElementById('ll-board');
  var leftEl = document.getElementById('ll-left');
  var stepsEl = document.getElementById('ll-steps');
  var shuffEl = document.getElementById('ll-shuff');
  var msgEl = document.getElementById('ll-msg');
  var overlayEl = document.getElementById('ll-overlay');
  var ovTitle = document.getElementById('ll-ov-title');
  var ovText = document.getElementById('ll-ov-text');
  var ovBtn = document.getElementById('ll-ov-btn');

  var board = null, R = 0, C = 0;
  var sel = null, steps = 0, shuffles = 3;
  var isDaily = false, levelIdx = 0;
  var chalStart = 0, totalMs = 0, timerTick = null;

  function totalSec() { return Math.round(totalMs / 1000); }

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function remainingCount() {
    var n = 0;
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (board[r][c] !== 0) n++;
    return n;
  }

  function paintBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = 'repeat(' + C + ', 1fr)';
    for (var r = 0; r < R; r++) {
      for (var c = 0; c < C; c++) {
        (function (rr, cc) {
          var v = board[rr][cc];
          var t = document.createElement('button');
          t.className = 'll-tile' + (v === 0 ? ' empty' : '');
          t.dataset.r = rr; t.dataset.c = cc; // 空牌也保留坐标（供路径高亮查询）
          if (v !== 0) {
            t.textContent = LLK_SYMBOLS[v - 1];
            if (sel && sel[0] === rr && sel[1] === cc) t.classList.add('sel');
            t.addEventListener('click', function () { clickTile(rr, cc); });
          }
          boardEl.appendChild(t);
        })(r, c);
      }
    }
    leftEl.textContent = remainingCount();
    stepsEl.textContent = steps;
    shuffEl.textContent = shuffles;
  }

  function flashPath(path, ok) {
    path.forEach(function (pt) {
      var r = pt[0], c = pt[1];
      if (r < 0 || r >= R || c < 0 || c >= C) return;
      var el = boardEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
      if (el) el.classList.add(ok ? 'path' : 'bad');
    });
    setTimeout(function () {
      var els = boardEl.querySelectorAll('.ll-tile.path, .ll-tile.bad');
      for (var i = 0; i < els.length; i++) els[i].classList.remove('path', 'bad');
    }, 500);
  }

  function clickTile(r, c) {
    if (board[r][c] === 0) return;
    if (sel === null) {
      sel = [r, c];
      paintBoard();
      if (Arcade.audio) Arcade.audio.play('ui');
      return;
    }
    if (sel[0] === r && sel[1] === c) { sel = null; paintBoard(); return; }
    var path = LLK_findPath(board, sel, [r, c]);
    steps++;
    if (path) {
      board[sel[0]][sel[1]] = 0;
      board[r][c] = 0;
      sel = null;
      if (Arcade.audio) Arcade.audio.play('coin');
      if (Arcade.juice) Arcade.juice.win();
      paintBoard();
      var pts = path.points;
      setTimeout(function () { flashPath(pts, true); }, 30); // 重绘后高亮路径
      if (remainingCount() === 0) winLevel();
      else checkDeadlock();
    } else {
      var fromPt = [sel[0], sel[1]];
      sel = null;
      if (Arcade.audio) Arcade.audio.play('error');
      paintBoard();
      setTimeout(function () { flashPath([fromPt, [r, c]], false); }, 30);
    }
  }

  function checkDeadlock() {
    if (!LLK_findPair(board)) {
      msgEl.textContent = T('gs.llk.msgDeadlock');
      if (Arcade.ui) Arcade.ui.toast(T('gs.llk.toastDeadlock'), 'warn');
    } else {
      msgEl.textContent = '';
    }
  }

  function startGame(daily) {
    isDaily = !!daily;
    levelIdx = 0; totalMs = 0; steps = 0; shuffles = 3; sel = null;
    startLevel();
  }

  function startLevel() {
    var g;
    if (isDaily) {
      g = LLK_genBoard(1 + (levelIdx % 3), todaySeed() + levelIdx * 7);
      levEl.textContent = T('gs.llk.dailyLev').replace('{n}', levelIdx + 1).replace('{d}', (levelIdx === 0 ? '6×8' : levelIdx === 1 ? '8×8' : '9×10'));
      briefEl.textContent = T('gs.llk.dailyBrief') + LEVEL_INFO[levelIdx % 3].d;
    } else {
      g = LLK_genBoard(levelIdx + 1);
      levEl.textContent = T('gs.llk.chalLev').replace('{t}', LEVEL_INFO[levelIdx].t).replace('{n}', levelIdx + 1);
      briefEl.textContent = LEVEL_INFO[levelIdx].d;
    }
    board = g.board; R = g.R; C = g.C;
    sel = null;
    msgEl.textContent = '';
    chalStart = Date.now(); // 每关起算（修复：此前仅开局设一次，winLevel 跨关重复累加全局长时段）
    paintBoard();
    checkDeadlock(); // 开局即查死锁（无解提示重排）
  }

  function winLevel() {
    totalMs += Date.now() - chalStart;
    if (Arcade.juice) Arcade.juice.win();
    if (isDaily) {
      if (levelIdx < 2) {
        levelIdx++;
        startLevel();
        if (Arcade.ui) Arcade.ui.toast(T('gs.llk.toastLevelWin'), 'win');
      } else {
        ovTitle.textContent = T('gs.llk.winDailyT');
        ovTitle.className = 'win';
        ovText.innerHTML = T('gs.llk.winDailyD').replace('{s}', totalSec()).replace('{n}', steps);
        ovBtn.textContent = T('gs.llk.again');
        ovBtn.onclick = function () { overlayEl.classList.add('hidden'); startGame(true); resetClock(); };
        overlayEl.classList.remove('hidden');
        if (Arcade.daily) Arcade.daily.markSolved('llk', totalSec());
        if (Arcade.shell) Arcade.shell.submitScore(totalSec());
      }
    } else if (levelIdx < 2) {
      levelIdx++;
      startLevel();
      if (Arcade.ui) Arcade.ui.toast(T('gs.llk.toastLevelPass').replace('{n}', levelIdx + 1), 'win');
    } else {
      ovTitle.textContent = T('gs.llk.winAllT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.llk.winAllD').replace('{s}', totalSec()).replace('{n}', steps);
      ovBtn.textContent = T('gs.llk.again');
      ovBtn.onclick = function () { overlayEl.classList.add('hidden'); startGame(false); resetClock(); };
      overlayEl.classList.remove('hidden');
      if (Arcade.shell) Arcade.shell.submitScore(totalSec());
    }
  }

  document.getElementById('ll-hint').addEventListener('click', function () {
    if (!board) return;
    var p = LLK_findPair(board);
    if (!p) { msgEl.textContent = T('gs.llk.msgNoPair'); return; }
    flashPath([[p[0][0], p[0][1]], [p[1][0], p[1][1]]], true);
    msgEl.textContent = T('gs.llk.msgHint').replace('{r1}', p[0][0] + 1).replace('{c1}', p[0][1] + 1).replace('{r2}', p[1][0] + 1).replace('{c2}', p[1][1] + 1);
    if (Arcade.audio) Arcade.audio.play('coin');
  });

  document.getElementById('ll-shuffle').addEventListener('click', function () {
    if (!board) return;
    if (shuffles <= 0) { msgEl.textContent = T('gs.llk.msgShuffNone'); return; }
    var tiles = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (board[r][c] !== 0) tiles.push(board[r][c]);
    var rnd = LLK_mulberry32(Date.now() % 2147483647);
    LLK_shuffle(tiles, rnd);
    var k = 0;
    for (var r2 = 0; r2 < R; r2++) for (var c2 = 0; c2 < C; c2++) if (board[r2][c2] !== 0) board[r2][c2] = tiles[k++];
    shuffles--;
    sel = null;
    if (Arcade.audio) Arcade.audio.play('coin');
    msgEl.textContent = LLK_findPair(board) ? T('gs.llk.msgShuffOk') : T('gs.llk.msgShuffDead');
    paintBoard();
  });

  function resetClock() {
    totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

  tabChal.addEventListener('click', function () {
    tabChal.classList.add('selected'); tabDaily.classList.remove('selected');
    startGame(false);
    resetClock();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  tabDaily.addEventListener('click', function () {
    tabDaily.classList.add('selected'); tabChal.classList.remove('selected');
    startGame(true);
    resetClock();
    if (Arcade.audio) Arcade.audio.play('ui');
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.llk.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    overlayEl.classList.add('hidden');
    startGame(isDaily);
    resetClock();
  };

  resetClock();
  startGame(false);

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.llk.tut1t'), d: T('gs.llk.tut1') },
    { t: T('gs.llk.tut2t'), d: T('gs.llk.tut2') },
    { t: T('gs.llk.tut3t'), d: T('gs.llk.tut3') },
    { t: T('gs.llk.tut4t'), d: T('gs.llk.tut4') }
  ];

})();
