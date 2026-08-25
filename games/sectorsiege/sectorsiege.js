/* ============================================================
   拉线占领 GALCON · 派兵占地（即时战略 · 密码战线）
   随机网格地图：每格产兵，按住己方格子拖线到目标格派出增援，
   到达时兵多者占领。AI 派系同步扩张，占领全部格子即胜。
   破译挂靠：格子=监听站，兵=信号兵，拉线=电报增援线。
   三难度 + 每日一题（固定种子地图）。
   核心逻辑用 ==GAL-CORE-START== / ==GAL-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==GAL-CORE-START== */
  var G_DIFF = {
    1: { rows: 10, cols: 10, aiCount: 2, aiRate: 0.7, maxTroops: 40, threshold: 8 },
    2: { rows: 12, cols: 12, aiCount: 3, aiRate: 0.85, maxTroops: 60, threshold: 10 },
    3: { rows: 14, cols: 14, aiCount: 4, aiRate: 1.0, maxTroops: 80, threshold: 12 }
  };
  var G_PROD = { plain: 1, mine: 2, fort: 3 };
  var G_TICK_MS = 900; // 产兵 tick（毫秒）

  function G_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function G_pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

  /** 地图生成：{ grid: [{owner, troops, type}], rows, cols }
      owner: 0 中立 / 1 玩家 / 2..n AI；初始领土分散连通 */
  function G_genMap(diffIdx, seed) {
    var conf = G_DIFF[diffIdx];
    var rnd = G_mulberry32(seed || (Date.now() % 2147483647));
    var R = conf.rows, C = conf.cols;
    var grid = [];
    for (var r = 0; r < R; r++) {
      var row = [];
      for (var c = 0; c < C; c++) {
        var roll = rnd();
        var type = roll < 0.75 ? 'plain' : (roll < 0.92 ? 'mine' : 'fort');
        row.push({ owner: 0, troops: 1 + Math.floor(rnd() * 6), type: type });
      }
      grid.push(row);
    }
    // 初始领土：玩家左上角，AI 分散
    var factions = 1 + conf.aiCount;
    // 玩家 2×2 块
    var px = Math.floor(C * 0.15), py = Math.floor(R * 0.2);
    claimBlock(grid, R, C, 1, py, px, 2, 2, 8 + Math.floor(rnd() * 4));
    // AI 派系：沿对角线分散
    var used = [[py, px]];
    for (var f = 0; f < conf.aiCount; f++) {
      var tries = 0, placed = false;
      while (!placed && tries++ < 200) {
        var ay = 1 + Math.floor(rnd() * (R - 2)), ax = 1 + Math.floor(rnd() * (C - 2));
        var far = true;
        for (var u = 0; u < used.length; u++) {
          if (Math.abs(ay - used[u][0]) < 3 && Math.abs(ax - used[u][1]) < 3) { far = false; break; }
        }
        if (!far) continue;
        claimBlock(grid, R, C, 2 + f, ay, ax, 2, 2, 8 + Math.floor(rnd() * 4));
        used.push([ay, ax]);
        placed = true;
      }
    }
    return { grid: grid, rows: R, cols: C, diff: diffIdx };
  }
  function claimBlock(grid, R, C, owner, y0, x0, h, w, troops) {
    for (var r = y0; r < y0 + h && r < R; r++) {
      for (var c = x0; c < x0 + w && c < C; c++) {
        grid[r][c].owner = owner;
        grid[r][c].troops = troops;
      }
    }
  }

  /** 格子索引（保留备查） */
  function G_cell(m, r, c) { return m.grid[r][c]; }

  /** 产兵 tick：已占领格按类型产兵（中立格固定初始兵力，是待夺取的静态资源） */
  function G_produce(m) {
    var conf = G_DIFF[m.diff];
    for (var r = 0; r < m.rows; r++) {
      for (var c = 0; c < m.cols; c++) {
        var cell = m.grid[r][c];
        if (cell.owner === 0) continue;
        cell.troops = Math.min(conf.maxTroops, cell.troops + G_PROD[cell.type]);
      }
    }
  }

  /** 派兵：from 格扣兵，返回移动群 {fromR,fromC,toR,toC,owner,count,progress} */
  function G_send(m, fromR, fromC, toR, toC, count, moving) {
    var src = G_cell(m, fromR, fromC);
    if (src.owner === 0) return null;
    if (fromR === toR && fromC === toC) return null;
    if (count <= 0) return null;
    if (src.troops < count) count = src.troops;
    src.troops -= count;
    var grp = { fr: fromR, fc: fromC, tr: toR, tc: toC, owner: src.owner, count: count, progress: 0 };
    moving.push(grp);
    return grp;
  }

  /** 移动群推进 + 到达结算 */
  function G_stepMoving(m, moving) {
    for (var i = moving.length - 1; i >= 0; i--) {
      var g = moving[i];
      g.progress += 0.06;
      if (g.progress >= 1) {
        moving.splice(i, 1);
        G_arrive(m, g);
      }
    }
  }
  function G_arrive(m, g) {
    var t = G_cell(m, g.tr, g.tc);
    if (t.owner === g.owner) {
      t.troops = Math.min(G_DIFF[m.diff].maxTroops, t.troops + g.count);
    } else if (g.count > t.troops) {
      t.owner = g.owner;
      t.troops = g.count - t.troops;
    } else {
      t.troops -= g.count;
    }
  }

  /** AI 决策：每派系选最强两格「集火」同一目标（总到达 > 守兵才打），优先中立/弱敌 */
  function G_aiThink(m, moving, rnd) {
    var conf = G_DIFF[m.diff];
    var dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    var factions = {};
    for (var r = 0; r < m.rows; r++) {
      for (var c = 0; c < m.cols; c++) {
        var o = m.grid[r][c].owner;
        if (o > 1) {
          (factions[o] = factions[o] || []).push({ r: r, c: c, cell: m.grid[r][c] });
        }
      }
    }
    for (var f in factions) {
      if (rnd() > conf.aiRate) continue;
      var cells = factions[f];
      cells.sort(function (a, b) { return b.cell.troops - a.cell.troops; });
      var best = cells[0];
      var best2 = cells.length > 1 ? cells[1] : null;
      var sendA = Math.floor(best.cell.troops * 0.65);
      var sendB = best2 ? Math.floor(best2.cell.troops * 0.65) : 0;
      if (sendA + sendB < conf.threshold) continue;
      // 候选目标：best 与 best2 的邻格，须 sendA+sendB > 守兵
      var winTargets = [];
      var probe = [best, best2].filter(Boolean);
      for (var pi = 0; pi < probe.length; pi++) {
        for (var d = 0; d < 4; d++) {
          var nr = probe[pi].r + dirs[d][0], nc = probe[pi].c + dirs[d][1];
          if (nr < 0 || nc < 0 || nr >= m.rows || nc >= m.cols) continue;
          var t = m.grid[nr][nc];
          if (t.owner === best.cell.owner) continue;
          if (sendA + sendB <= t.troops) continue;
          winTargets.push({ r: nr, c: nc, t: t });
        }
      }
      if (!winTargets.length) continue;
      winTargets.sort(function (a, b) {
        var sa = a.t.owner === 0 ? 0 : 1;
        var sb = b.t.owner === 0 ? 0 : 1;
        return sa - sb;
      });
      var pick = winTargets[0];
      G_send(m, best.r, best.c, pick.r, pick.c, sendA, moving);
      if (best2) G_send(m, best2.r, best2.c, pick.r, pick.c, sendB, moving);
    }
  }

  /** 胜负：返回 0=进行中 / 1=玩家胜 / n=AI 派系胜（占领非中立全部格） */
  function G_winner(m) {
    var owners = {};
    var any = false;
    for (var r = 0; r < m.rows; r++) {
      for (var c = 0; c < m.cols; c++) {
        var o = m.grid[r][c].owner;
        if (o !== 0) { owners[o] = (owners[o] || 0) + 1; any = true; }
      }
    }
    if (!any) return 0;
    var keys = Object.keys(owners);
    if (keys.length === 1) return parseInt(keys[0], 10);
    return 0;
  }

  /** 初始移动群（进入游戏时玩家与 AI 各向中立扩张一点） */
  function G_initialMoving(m, moving, seed) {
    var rnd = G_mulberry32((seed || 1) + 77);
    var dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (var r = 0; r < m.rows; r++) {
      for (var c = 0; c < m.cols; c++) {
        var cell = m.grid[r][c];
        if (cell.owner === 0 || cell.troops < 6) continue;
        if (rnd() < 0.5) continue;
        for (var d = 0; d < 4; d++) {
          var nr = r + dirs[d][0], nc = c + dirs[d][1];
          if (nr < 0 || nc < 0 || nr >= m.rows || nc >= m.cols) continue;
          if (m.grid[nr][nc].owner !== 0) continue;
          G_send(m, r, c, nr, nc, Math.floor(cell.troops * 0.5), moving);
          break;
        }
      }
    }
  }
  /* ==GAL-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var COLORS = { 0: '#3a4152', 1: '#00f0ff', 2: '#ff2d95', 3: '#ffe600', 4: '#39ff14', 5: '#b967ff' };
  var DIFF_INFO = [
    { t: T('gs.sectorsiege.diffEasy'), d: T('gs.sectorsiege.diffEasyD') },
    { t: T('gs.sectorsiege.diffNormal'), d: T('gs.sectorsiege.diffNormalD') },
    { t: T('gs.sectorsiege.diffHard'), d: T('gs.sectorsiege.diffHardD') }
  ];

  root.innerHTML =
    '<div class="gl-wrap">' +
    '  <div class="gl-pick hidden" id="gl-pick">' +
    '    <div class="gl-pick-t">' + T('gs.sectorsiege.pickT') + '</div>' +
    '    <div class="gl-pick-d">' + T('gs.sectorsiege.pickD') + '</div>' +
    '    <div class="gl-pick-btns">' +
    DIFF_INFO.map(function (d, i) {
      return '<button class="btn mode-btn" data-i="' + i + '">' + d.t + '<small>' + d.d + '</small></button>';
    }).join('') +
    '    </div>' +
    '    <button class="btn mode-btn" id="gl-pick-daily">' + T('gs.sectorsiege.pickDaily') + '</button>' +
    '  </div>' +
    '  <div id="gl-game" style="display:none">' +
    '    <div class="gl-info"><span id="gl-lev"></span><span id="gl-hud"></span></div>' +
    '    <canvas id="gl-cv"></canvas>' +
    '    <div class="gl-controls">' +
    '      <button class="btn" id="gl-ratio">' + T('gs.sectorsiege.sendHalf') + '</button>' +
    '      <button class="btn" id="gl-new">' + T('gs.sectorsiege.newBtn') + '</button>' +
    '    </div>' +
    '    <div class="gl-msg" id="gl-msg"></div>' +
    '  </div>' +
    '  <div class="gl-overlay hidden" id="gl-overlay">' +
    '    <h2 id="gl-ov-title"></h2>' +
    '    <p id="gl-ov-text"></p>' +
    '    <button class="btn" id="gl-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var pickEl = document.getElementById('gl-pick');
  var gameEl = document.getElementById('gl-game');
  var levEl = document.getElementById('gl-lev');
  var hudEl = document.getElementById('gl-hud');
  var msgEl = document.getElementById('gl-msg');
  var overlayEl = document.getElementById('gl-overlay');
  var ovTitle = document.getElementById('gl-ov-title');
  var ovText = document.getElementById('gl-ov-text');
  var ovBtn = document.getElementById('gl-ov-btn');
  var canvas = document.getElementById('gl-cv');
  var ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var ratioBtn = document.getElementById('gl-ratio');

  var state = null, m = null, moving = [];
  var loopApi = null;
  var cellPx = 40;
  var drag = null; // { fromR, fromC, x, y }
  var ratio = 0.5;
  var produceAcc = 0, aiAcc = 0;
  var paused = false;

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function startGame(diffIdx, daily) {
    var seed = daily ? todaySeed() : undefined;
    paused = false;
    m = G_genMap(diffIdx, seed);
    moving = [];
    state = { diff: diffIdx, daily: !!daily, start: Date.now(), over: false };
    G_initialMoving(m, moving, seed || (Date.now() % 2147483647));
    cellPx = Math.max(26, Math.min(44, Math.floor(560 / Math.max(m.rows, m.cols))));
    canvas.width = m.cols * cellPx;
    canvas.height = m.rows * cellPx;
    pickEl.classList.add('hidden');
    gameEl.style.display = '';
    levEl.textContent = (daily ? T('gs.sectorsiege.dailyLev') : '') + T('gs.sectorsiege.levFmt').replace('{t}', DIFF_INFO[diffIdx].t).replace('{r}', m.rows).replace('{c}', m.cols);
    if (!loopApi) loopApi = Arcade.loop.start(update, draw, 16);
    else { loopApi.stop(); loopApi = Arcade.loop.start(update, draw, 16); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ---------- 输入 ---------- */
  function cellAt(px, py) {
    var rect = canvas.getBoundingClientRect();
    var x = (px - rect.left) * (canvas.width / rect.width);
    var y = (py - rect.top) * (canvas.height / rect.height);
    var c = Math.floor(x / cellPx), r = Math.floor(y / cellPx);
    if (r < 0 || c < 0 || r >= m.rows || c >= m.cols) return null;
    return { r: r, c: c };
  }
  canvas.addEventListener('pointerdown', function (e) {
    if (!m || state.over) return;
    var cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    var owner = m.grid[cell.r][cell.c].owner;
    if (owner === 1) {
      drag = { r: cell.r, c: cell.c, x: e.clientX, y: e.clientY };
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (drag) { drag.x = e.clientX; drag.y = e.clientY; }
  });
  canvas.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var from = { r: drag.r, c: drag.c };
    var cell = cellAt(e.clientX, e.clientY);
    drag = null;
    if (!cell) return;
    if (from.r === cell.r && from.c === cell.c) return;
    var src = m.grid[from.r][from.c];
    var count = Math.floor(src.troops * ratio);
    var g = G_send(m, from.r, from.c, cell.r, cell.c, count, moving);
    if (g) {
      if (Arcade.audio) Arcade.audio.play('coin');
      msgEl.textContent = T('gs.sectorsiege.msgSend').replace('{n}', g.count).replace('{r}', cell.r + 1).replace('{c}', cell.c + 1);
    } else {
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  ratioBtn.addEventListener('click', function () {
    ratio = ratio === 0.5 ? 1 : 0.5;
    ratioBtn.textContent = ratio === 0.5 ? T('gs.sectorsiege.sendHalf') : T('gs.sectorsiege.sendAll');
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  document.getElementById('gl-new').addEventListener('click', function () {
    overlayEl.classList.add('hidden');
    pickEl.classList.remove('hidden');
    gameEl.style.display = 'none';
  });

  /* P 键暂停（实时类统一约定） */
  document.addEventListener('keydown', function (e) {
    if (!m || state.over) return;
    if (e.key === 'p' || e.key === 'P') {
      paused = !paused;
      if (paused) {
        if (loopApi) loopApi.pause();
        msgEl.textContent = T('shell.paused');
        msgEl.style.color = 'var(--neon-yellow)';
      } else {
        if (loopApi) loopApi.resume();
        msgEl.textContent = '';
        msgEl.style.color = '';
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    }
  });

  /* ---------- 循环 ---------- */
  function update() {
    if (!m || state.over) return;
    if (paused) return;
    produceAcc += 16;
    if (produceAcc >= G_TICK_MS) {
      produceAcc = 0;
      G_produce(m);
    }
    aiAcc += 16;
    if (aiAcc >= 240) {
      aiAcc = 0;
      G_aiThink(m, moving, G_mulberry32(Date.now() % 2147483647));
    }
    G_stepMoving(m, moving);
    var w = G_winner(m);
    if (w !== 0) endGame(w);
    else {
      var playerAlive = m.grid.some(function (row) { return row.some(function (c) { return c.owner === 1; }); });
      if (!playerAlive) endGame(-1);
    }
    hudEl.textContent = T('gs.sectorsiege.hud').replace('{n}', countOwner(1)).replace('{m}', m.rows * m.cols - countOwner(1) - countOwner(0)).replace('{s}', Math.floor((Date.now() - state.start) / 1000));
  }
  function countOwner(o) {
    var n = 0;
    for (var r = 0; r < m.rows; r++) for (var c = 0; c < m.cols; c++) if (m.grid[r][c].owner === o) n++;
    return n;
  }

  function endGame(w) {
    state.over = true;
    var sec = Math.floor((Date.now() - state.start) / 1000);
    if (w === 1) {
      ovTitle.textContent = T('gs.sectorsiege.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.sectorsiege.winD').replace('{s}', sec);
      if (state.daily && Arcade.daily) Arcade.daily.markSolved('sectorsiege', sec);
    } else {
      ovTitle.textContent = T('gs.sectorsiege.loseT');
      ovTitle.className = '';
      ovText.innerHTML = w === -1 ? T('gs.sectorsiege.losePlayer') : T('gs.sectorsiege.loseEnemy');
    }
    ovBtn.textContent = T('gs.sectorsiege.again');
    ovBtn.onclick = function () {
      overlayEl.classList.add('hidden');
      pickEl.classList.remove('hidden');
      gameEl.style.display = 'none';
    };
    overlayEl.classList.remove('hidden');
    if (w === 1) { if (Arcade.juice) Arcade.juice.win(); if (Arcade.shell) Arcade.shell.submitScore(sec); }
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    if (!m) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b0e16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var r = 0; r < m.rows; r++) {
      for (var c = 0; c < m.cols; c++) {
        var cell = m.grid[r][c];
        var x = c * cellPx, y = r * cellPx;
        ctx.fillStyle = COLORS[cell.owner] || '#3a4152';
        ctx.globalAlpha = cell.owner === 0 ? 0.25 : 0.85;
        ctx.fillRect(x + 1, y + 1, cellPx - 2, cellPx - 2);
        ctx.globalAlpha = 1;
        // 类型标记
        if (cell.type === 'mine') {
          ctx.fillStyle = '#ffd24a';
          ctx.font = (cellPx * 0.3) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⛏', x + cellPx / 2, y + cellPx * 0.32);
        } else if (cell.type === 'fort') {
          ctx.fillStyle = '#ff6b9d';
          ctx.font = (cellPx * 0.3) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏰', x + cellPx / 2, y + cellPx * 0.32);
        }
        // 兵数
        ctx.fillStyle = cell.owner === 0 ? '#8a93a6' : '#ffffff';
        ctx.font = 'bold ' + (cellPx * 0.34) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.troops, x + cellPx / 2, y + cellPx * 0.66);
        ctx.textBaseline = 'alphabetic';
      }
    }
    // 移动群
    moving.forEach(function (g) {
      var x1 = (g.fc + 0.5) * cellPx, y1 = (g.fr + 0.5) * cellPx;
      var x2 = (g.tc + 0.5) * cellPx, y2 = (g.tr + 0.5) * cellPx;
      var px = x1 + (x2 - x1) * g.progress;
      var py = y1 + (y2 - y1) * g.progress;
      ctx.strokeStyle = COLORS[g.owner] || '#fff';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLORS[g.owner] || '#fff';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      // 数量标签
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(g.count, px, py - 7);
    });
    // 拖线
    if (drag) {
      var rect = canvas.getBoundingClientRect();
      var x0 = (drag.c + 0.5) * cellPx, y0 = (drag.r + 0.5) * cellPx;
      var x1 = (drag.x - rect.left) * (canvas.width / rect.width);
      var y1 = (drag.y - rect.top) * (canvas.height / rect.height);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ---------- 启动 ---------- */
  var pickBtns = pickEl.querySelectorAll('button[data-i]');
  for (var i = 0; i < pickBtns.length; i++) {
    pickBtns[i].addEventListener('click', function () {
      startGame(parseInt(this.dataset.i, 10), false);
    });
  }
  document.getElementById('gl-pick-daily').addEventListener('click', function () {
    startGame(2, true);
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.sectorsiege.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    paused = false;
    if (loopApi) loopApi.stop();
    state = null;
    overlayEl.classList.add('hidden');
    pickEl.classList.remove('hidden');
    gameEl.style.display = 'none';
  };

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.sectorsiege.tut1t'), d: T('gs.sectorsiege.tut1') },
    { t: T('gs.sectorsiege.tut2t'), d: T('gs.sectorsiege.tut2') },
    { t: T('gs.sectorsiege.tut3t'), d: T('gs.sectorsiege.tut3') },
    { t: T('gs.sectorsiege.tut4t'), d: T('gs.sectorsiege.tut4') }
  ];

})();
