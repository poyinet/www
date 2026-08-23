/* ============================================================
   岛屿连线 Hashi（Hashiwokakero）· 经典逻辑谜题（旗舰级）
   规则：把数字岛用桥连起来——桥只能水平/垂直、不交叉、
         每对岛最多 2 座桥、每个岛的桥数=岛数字、全图连通。
   质量核心：
     - 程序化生成：生长法连树（保证不交叉+连通）→ 随机双桥加深
     - 求解器验证唯一解（数字约束 + 连通性），不唯一自动重试
   记分：min 模式，操作步数越少越好
   ============================================================ */

(function () {
  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.hashi.tut1t'), d: T('gs.hashi.tut1') },
    { t: T('gs.hashi.tut2t'), d: T('gs.hashi.tut2') },
    { t: T('gs.hashi.tut3t'), d: T('gs.hashi.tut3') }
  ];
  /* ================= 纯逻辑：生成与求解 ================= */

  /** 生成一局。GRID: 网格大小；targetIslands: 目标岛数
      返回 { islands: [{x,y,n}], rows, cols, solution: { 'x1,y1-x2,y2': 1|2 } } */
  function generate(GRID, targetIslands, rng) {
    rng = rng || Math.random;
    for (var attempt = 0; attempt < 400; attempt++) {
      var islands = placeIslands(GRID, targetIslands, rng);
      if (!islands) continue;
      var tree = growTree(islands, GRID, rng);
      if (!tree) continue;
      // 随机升级部分边为双桥
      var edges = tree.slice();
      var upgraded = {};
      var upCount = Math.floor(edges.length * 0.25) + 1;
      for (var i = 0; i < upCount && edges.length; i++) {
        var e = edges[Math.floor(rng() * edges.length)];
        upgraded[bridgeKey(e[0], e[1])] = 2;
        // 避免同一岛过度升级：简单去重边
        edges = edges.filter(function (x) { return bridgeKey(x[0], x[1]) !== bridgeKey(e[0], e[1]); });
      }
      // 桥数 -> 岛数字
      var deg = {};
      islands.forEach(function (isl) { deg[isl.id] = 0; });
      tree.forEach(function (e) {
        var w = upgraded[bridgeKey(e[0], e[1])] || 1;
        deg[e[0].id] += w; deg[e[1].id] += w;
      });
      // 数字上限 8（Hashi 规则），超了跳过
      var ok = true;
      islands.forEach(function (isl) { if (deg[isl.id] > 8 || deg[isl.id] < 1) ok = false; });
      if (!ok) continue;
      islands.forEach(function (isl) { isl.n = deg[isl.id]; });
      // 求解唯一解验证
      var res = countSolutions(islands, 2);
      if (res.count === 1) {
        var sol = {};
        tree.forEach(function (e) { sol[bridgeKey(e[0], e[1])] = upgraded[bridgeKey(e[0], e[1])] || 1; });
        return { islands: islands, rows: GRID, cols: GRID, solution: sol };
      }
    }
    return null;
  }

  function bridgeKey(a, b) {
    var ka = a.x + ',' + a.y, kb = b.x + ',' + b.y;
    return ka < kb ? ka + '-' + kb : kb + '-' + ka;
  }

  /** 随机放岛：格点位置、保证两岛不同格 */
  function placeIslands(GRID, target, rng) {
    rng = rng || Math.random;
    var pts = [];
    var guard = 0;
    while (pts.length < target && guard++ < 500) {
      var x = 1 + Math.floor(rng() * (GRID - 2));
      var y = 1 + Math.floor(rng() * (GRID - 2));
      var dup = false;
      for (var i = 0; i < pts.length; i++) if (pts[i].x === x && pts[i].y === y) { dup = true; break; }
      if (dup) continue;
      pts.push({ x: x, y: y });
    }
    if (pts.length < target) return null;
    var islands = pts.map(function (p, idx) {
      return { id: idx, x: p.x, y: p.y, n: 0 };
    });
    return islands;
  }

  /** 生长法：从第一个岛出发，逐步把未连岛通过「直线可达且中间无岛」的桥连入
      保证：桥不交叉（中间无岛阻挡）+ 全连通 + 无重复边
      鲁棒：若随机选的 rest 岛无法连接，换一个 rest 岛尝试 */
  function growTree(islands, GRID, rng) {
    rng = rng || Math.random;
    var connected = [islands[0]];
    var rest = islands.slice(1);
    var edges = [];
    var guard = 0;
    while (rest.length && guard++ < 400) {
      // 找一个「能从已连集连入」的 rest 岛（优先随机）
      var shuffled = rest.slice();
      for (var s = shuffled.length - 1; s > 0; s--) {
        var si = Math.floor(rng() * (s + 1));
        var t = shuffled[s]; shuffled[s] = shuffled[si]; shuffled[si] = t;
      }
      var target = null, pick = null;
      for (var ri = 0; ri < shuffled.length; ri++) {
        var cand = shuffled[ri];
        var candidates = [];
        for (var i = 0; i < connected.length; i++) {
          var c = connected[i];
          if (c.x === cand.x || c.y === cand.y) {
            if (clearPath(c, cand, islands) && !edges.some(function (e) {
              return islandSegsCross(e[0], e[1], c, cand); // 新增桥不得与已有桥交叉
            })) candidates.push(c);
          }
        }
        if (candidates.length) { target = cand; pick = candidates[Math.floor(rng() * candidates.length)]; break; }
      }
      if (!target) return null; // 没有任何 rest 岛可连（布局问题）
      edges.push([pick, target]);
      connected.push(target);
      rest.splice(rest.indexOf(target), 1);
    }
    if (rest.length) return null;
    return edges;
  }

  /** 两点之间（同行或同列）是否无其他岛阻挡 */
  function clearPath(a, b, islands) {
    if (a.x === b.x) {
      var lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
      for (var i = 0; i < islands.length; i++) {
        var isl = islands[i];
        if (isl.x === a.x && isl.y > lo && isl.y < hi) return false;
      }
    } else {
      var lo2 = Math.min(a.x, b.x), hi2 = Math.max(a.x, b.x);
      for (var j = 0; j < islands.length; j++) {
        var isl2 = islands[j];
        if (isl2.y === a.y && isl2.x > lo2 && isl2.x < hi2) return false;
      }
    }
    return true;
  }

  /** 两条桥是否几何交叉（一条水平一条垂直、交叉点严格在两条线段内部） */
  function segsCross(a1, a2, b1, b2) {
    var aHoriz = a1[1] === a2[1], aVert = a1[0] === a2[0];
    var bHoriz = b1[1] === b2[1], bVert = b1[0] === b2[0];
    if (!((aHoriz && bVert) || (aVert && bHoriz))) return false;
    var hy = aHoriz ? a1[1] : b1[1];
    var vx = aHoriz ? b1[0] : a1[0];
    var hx1 = aHoriz ? Math.min(a1[0], a2[0]) : Math.min(b1[0], b2[0]);
    var hx2 = aHoriz ? Math.max(a1[0], a2[0]) : Math.max(b1[0], b2[0]);
    var vy1 = aHoriz ? Math.min(b1[1], b2[1]) : Math.min(a1[1], a2[1]);
    var vy2 = aHoriz ? Math.max(b1[1], b2[1]) : Math.max(a1[1], a2[1]);
    return vx > hx1 && vx < hx2 && hy > vy1 && hy < vy2;
  }
  function islandSegsCross(ia1, ia2, ib1, ib2) {
    return segsCross([ia1.x, ia1.y], [ia2.x, ia2.y], [ib1.x, ib1.y], [ib2.x, ib2.y]);
  }
  function bridgeKey(a, b) { return a.x + ',' + a.y + '-' + b.x + ',' + b.y; }

  /** 候选桥：同行/同列且中间无岛的岛对（0/1/2 桥可选） */
  function candidateBridges(islands) {
    var res = [];
    for (var i = 0; i < islands.length; i++) {
      for (var j = i + 1; j < islands.length; j++) {
        var a = islands[i], b = islands[j];
        if ((a.x === b.x || a.y === b.y) && clearPath(a, b, islands)) {
          res.push([a, b]);
        }
      }
    }
    return res;
  }

  /** 求解：每个桥变量 0/1/2，数字约束 + 连通性，计数解 */
  function countSolutions(islands, limit) {
    var bridges = candidateBridges(islands);
    var bIndex = {};
    bridges.forEach(function (b, idx) { bIndex[bridgeKey(b[0], b[1])] = idx; });
    var bvals = new Array(bridges.length).fill(0);
    var count = 0;
    var nodes = 0;
    var MAX = 200000;

    function isSolved() {
      // 数字约束
      var deg = {};
      islands.forEach(function (isl) { deg[isl.id] = 0; });
      for (var i = 0; i < bridges.length; i++) {
        var w = bvals[i];
        if (w) { deg[bridges[i][0].id] += w; deg[bridges[i][1].id] += w; }
      }
      for (var k = 0; k < islands.length; k++) {
        if (deg[islands[k].id] !== islands[k].n) return false;
      }
      // 连通性：BFS 沿桥>0
      var seen = {};
      var queue = [islands[0].id];
      seen[islands[0].id] = true;
      var conn = [];
      for (var ci = 0; ci < islands.length; ci++) conn.push([]);
      bridges.forEach(function (b, idx) {
        if (bvals[idx] > 0) { conn[b[0].id].push(b[1].id); conn[b[1].id].push(b[0].id); }
      });
      while (queue.length) {
        var cur = queue.pop();
        for (var nb of conn[cur] || []) {
          if (!seen[nb]) { seen[nb] = true; queue.push(nb); }
        }
      }
      if (Object.keys(seen).length !== islands.length) return false;
      // 交叉检查：解中任何两条桥不得几何交叉
      var act = [];
      bridges.forEach(function (b, idx) { if (bvals[idx] > 0) act.push(b); });
      for (var i2 = 0; i2 < act.length; i2++) for (var j2 = i2 + 1; j2 < act.length; j2++) {
        if (islandSegsCross(act[i2][0], act[i2][1], act[j2][0], act[j2][1])) return false;
      }
      return true;
    }

    /** 确定性回溯：从 startIdx 开始找未定桥，每层推进，避免重复选择导致的无限递归 */
    function solve(startIdx) {
      nodes++;
      if (nodes > MAX) throw new Error('nodeLimit');
      if (count >= limit) return;
      var idx = -1;
      for (var i = startIdx; i < bridges.length; i++) {
        if (bvals[i] === 0) { idx = i; break; }
      }
      if (idx < 0) {
        if (isSolved()) count++;
        return;
      }
      // 剪枝：桥两端岛的剩余需求
      var b = bridges[idx];
      var degNow = {};
      islands.forEach(function (isl) { degNow[isl.id] = 0; });
      for (var q = 0; q < bridges.length; q++) {
        if (bvals[q] && q !== idx) {
          degNow[bridges[q][0].id] += bvals[q];
          degNow[bridges[q][1].id] += bvals[q];
        }
      }
      var remA = islands[b[0].id].n - degNow[b[0].id];
      var remB = islands[b[1].id].n - degNow[b[1].id];
      // 全局剩余需求剪枝：任一岛剩余需求超出其可连桥数则剪
      for (var ia = 0; ia < islands.length; ia++) {
        var rem = islands[ia].n - degNow[ia];
        if (rem < 0) return;
        // 该岛未定候选桥数上限（含当前 idx 的 2 容量）
        var avail = 0;
        for (var q2 = 0; q2 < bridges.length; q2++) {
          if (q2 === idx) { if (bridges[q2][0].id === ia || bridges[q2][1].id === ia) avail += 2; continue; }
          if (bvals[q2] !== 0) continue;
          if (bridges[q2][0].id === ia || bridges[q2][1].id === ia) avail += 2;
        }
        if (rem > avail) return;
      }
      var maxFor = Math.min(2, remA, remB);
      if (maxFor < 0) return;
      // 该桥可选 0/1/2（minFor=0），靠全局剩余需求剪枝保证可解性
      for (var v = maxFor; v >= 0; v--) {
        bvals[idx] = v;
        solve(idx + 1);
        bvals[idx] = 0;
        if (count >= limit) return;
      }
    }

    try { solve(0); } catch (e) {
      if (e.message !== 'nodeLimit') throw e;
      return { count: count, limit: true };
    }
    return { count: count, limit: false };
  }

  /* ================= UI ================= */
  var DIFFS = [
    { name: 'gs.hashi.easy', grid: 7, islands: 7 },
    { name: 'gs.hashi.mid', grid: 9, islands: 9 },
    { name: 'gs.hashi.hard', grid: 11, islands: 11 }
  ];
  var diffIdx = 0;

  /* mulberry32 + 日期种子（每日一题） */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  var root = document.getElementById('game-root');
  var html =
    '<div class="hs-top">' +
    '  <span>' + T('gs.hashi.diff') + ' <span class="stat-value" id="hs-diff"></span></span>' +
    '  <span>' + T('gs.hashi.steps') + ' <span class="stat-value" id="hs-steps">0</span></span>' +
    '  <span>' + T('gs.hashi.done').replace('{n}', '<span class="stat-value" id="hs-done">0</span>') + '</span>' +
    '</div>' +
    '<div class="mode-row" id="hs-diffs"></div>' +
    '<div class="hs-msg" id="hs-msg" aria-live="polite"></div>' +
    '<div class="hs-stage">' +
    '  <canvas class="hs-canvas" id="hs-canvas" width="440" height="440"></canvas>' +
    '  <div class="hs-overlay hidden" id="hs-overlay">' +
    '    <div class="hs-ov-title" id="hs-ov-title"></div>' +
    '    <div class="hs-ov-sub" id="hs-ov-sub"></div>' +
    '    <div class="game-controls"><button class="btn green" id="hs-ov-btn"></button></div>' +
    '  </div>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button class="btn purple" id="hs-hint">' + T('gs.hashi.hintBtn') + '</button>' +
    '  <button class="btn yellow" id="hs-new">' + T('gs.hashi.newPuzzle') + '</button>' +
    '  <button class="btn green" id="hs-daily">' + T('gs.hashi.daily') + '</button>' +
    '</div>';

  root.innerHTML = html;

  var canvas = document.getElementById('hs-canvas');
  var ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var diffEl = document.getElementById('hs-diff');
  var stepsEl = document.getElementById('hs-steps');
  var doneEl = document.getElementById('hs-done');
  var msgEl = document.getElementById('hs-msg');
  var diffRow = document.getElementById('hs-diffs');
  var overlayEl = document.getElementById('hs-overlay');
  var ovTitle = document.getElementById('hs-ov-title');
  var ovSub = document.getElementById('hs-ov-sub');
  var ovBtn = document.getElementById('hs-ov-btn');
  var hintBtn = document.getElementById('hs-hint');
  var newBtn = document.getElementById('hs-new');
  var dailyBtn = document.getElementById('hs-daily');

  var puzzle = null;
  var drawn = {};   // bridgeKey -> 0/1/2
  var selIsland = null;
  var steps = 0;
  var isDaily = false;  // 当前是否每日一题（解完计入今日破译中心）

  function startPuzzle() {
    isDaily = false;
    var D = DIFFS[diffIdx];
    diffEl.textContent = T(D.name);
    puzzle = generate(D.grid, D.islands);
    if (!puzzle) { msgEl.textContent = T('gs.hashi.genFail'); return; }
    drawn = {};
    selIsland = null;
    steps = 0;
    stepsEl.textContent = '0';
    overlayEl.classList.add('hidden');
    msgEl.textContent = T('gs.hashi.startMsg').replace('{n}', T(D.name));
    render();
  }

  function render() {
    var w = canvas.width, h = canvas.height;
    var pad = 30;
    var cell = (w - pad * 2) / (puzzle.rows - 1);
    function px(x) { return pad + x * cell; }
    function py(y) { return pad + y * cell; }
    ctx.clearRect(0, 0, w, h);
    // 已画桥
    var done = 0;
    for (var k in drawn) {
      var wgt = drawn[k];
      if (!wgt) continue;
      done++;
      var parts = k.split('-');
      var a = parts[0].split(',').map(Number), b = parts[1].split(',').map(Number);
      drawBridge(px(a[0]), py(a[1]), px(b[0]), py(b[1]), wgt);
    }
    doneEl.textContent = done;
    // 岛屿
    puzzle.islands.forEach(function (isl) {
      var x = px(isl.x), y = py(isl.y);
      ctx.fillStyle = '#0a0a12';
      ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill();
      ctx.strokeStyle = selIsland && selIsland.id === isl.id ? '#ffe600' : '#00f0ff';
      ctx.lineWidth = selIsland && selIsland.id === isl.id ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 15px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(isl.n), x, y + 1);
    });
  }

  function drawBridge(x1, y1, x2, y2, wgt) {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    var off = 0;
    if (wgt === 2) off = 5;
    // 水平或垂直
    if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
      // 水平
      for (var i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1 + off * i);
        ctx.lineTo(x2, y2 + off * i);
        ctx.stroke();
      }
    } else {
      for (var j = -1; j <= 1; j += 2) {
        ctx.beginPath();
        ctx.moveTo(x1 + off * j, y1);
        ctx.lineTo(x2 + off * j, y2);
        ctx.stroke();
      }
    }
  }

  /* 点击：选岛 → 点同行/同列岛 循环 0→1→2→0 */
  function hitTest(px, py2, scale) {
    var pad = 30;
    var cell = (canvas.width - pad * 2) / (puzzle.rows - 1);
    var best = null, bestD = 1e9;
    // 命中半径按画布缩放等比放大（小屏触控精度，修复等效 12-14px 易误判）
    var r = 20 * (scale || 1);
    puzzle.islands.forEach(function (isl) {
      var d = Math.abs(px - (pad + isl.x * cell)) + Math.abs(py2 - (pad + isl.y * cell));
      if (d < r && d < bestD) { bestD = d; best = isl; }
    });
    return best;
  }

  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scale = canvas.width / rect.width;
    var cx = (e.clientX - rect.left) * scale;
    var cy = (e.clientY - rect.top) * scale;
    var isl = hitTest(cx, cy, scale);
    if (!isl) return;
    if (!selIsland) { selIsland = isl; msgEl.textContent = T('gs.hashi.selected').replace('{n}', isl.n); render(); return; }
    if (selIsland.id === isl.id) { selIsland = null; render(); return; }
    // 同行/同列且中间无岛？
    var a = selIsland, b = isl;
    if ((a.x === b.x || a.y === b.y) && clearPath(a, b, puzzle.islands)) {
      var key = bridgeKey(a, b);
      var cur = drawn[key] || 0;
      drawn[key] = (cur + 1) % 3;
      steps++;
      stepsEl.textContent = steps;
      if (Arcade.audio) Arcade.audio.play('ui');
      checkComplete();
      selIsland = null;
      render();
    } else {
      msgEl.textContent = T('gs.hashi.cantBridge');
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  function checkComplete() {
    if (!puzzle) return;
    var deg = {};
    puzzle.islands.forEach(function (isl) { deg[isl.id] = 0; });
    for (var k in drawn) {
      var w = drawn[k];
      if (!w) continue;
      var parts = k.split('-');
      var idA = findIslandId(parts[0]);
      var idB = findIslandId(parts[1]);
      deg[idA] += w; deg[idB] += w;
    }
    var ok = true;
    puzzle.islands.forEach(function (isl) {
      if (deg[isl.id] !== isl.n) ok = false;
    });
    if (!ok) return;
    // 连通性
    var seen = {};
    var queue = [puzzle.islands[0].id];
    seen[puzzle.islands[0].id] = true;
    while (queue.length) {
      var cur = queue.pop();
      for (var k2 in drawn) {
        if (!drawn[k2]) continue;
        var parts2 = k2.split('-');
        var ia = findIslandId(parts2[0]), ib = findIslandId(parts2[1]);
        if (ia === cur && !seen[ib]) { seen[ib] = true; queue.push(ib); }
        if (ib === cur && !seen[ia]) { seen[ia] = true; queue.push(ia); }
      }
    }
    if (Object.keys(seen).length !== puzzle.islands.length) {
      msgEl.textContent = T('gs.hashi.notConnected');
      return;
    }
    // 交叉检查：玩家画的桥不得交叉（规则）
    var drawnKeys = Object.keys(drawn).filter(function (k) { return drawn[k]; });
    for (var di = 0; di < drawnKeys.length; di++) for (var dj = di + 1; dj < drawnKeys.length; dj++) {
      var p1 = drawnKeys[di].split('-')[0].split(',').map(Number);
      var p2 = drawnKeys[di].split('-')[1].split(',').map(Number);
      var q1 = drawnKeys[dj].split('-')[0].split(',').map(Number);
      var q2 = drawnKeys[dj].split('-')[1].split(',').map(Number);
      if (segsCross(p1, p2, q1, q2)) {
        msgEl.textContent = T('gs.hashi.cross');
        return;
      }
    }
    // 胜利
    if (Arcade.juice) Arcade.juice.win();
    ovTitle.textContent = T('gs.hashi.winT');
    ovSub.innerHTML = T('gs.hashi.winD').replace('{n}', steps);
    ovBtn.textContent = T('gs.hashi.again');
    ovBtn.onclick = startPuzzle;
    overlayEl.classList.remove('hidden');
    if (Arcade.shell) Arcade.shell.submitScore(steps);
    if (Arcade.daily && isDaily) Arcade.daily.markSolved('hashi', steps);
  }

  function findIslandId(key) {
    var parts = key.split(',');
    var x = +parts[0], y = +parts[1];
    for (var i = 0; i < puzzle.islands.length; i++) {
      if (puzzle.islands[i].x === x && puzzle.islands[i].y === y) return puzzle.islands[i].id;
    }
    return -1;
  }

  /* 提示：找一条应连但未连/连错的桥 */
  function giveHint() {
    if (!puzzle) return;
    var keys = Object.keys(puzzle.solution);
    var hintGiven = false;
    for (var i = 0; i < keys.length && !hintGiven; i++) {
      var k = keys[i];
      var want = puzzle.solution[k];
      var have = drawn[k] || 0;
      if (have !== want) {
        // 高亮这条桥：直接把 drawn 设对并提示
        var parts = k.split('-');
        var a = parts[0].split(',').map(Number), b = parts[1].split(',').map(Number);
        msgEl.textContent = T('gs.hashi.hint').replace('{a}', a[0]).replace('{b}', a[1]).replace('{c}', b[0]).replace('{d}', b[1]).replace('{n}', want);
        // 闪烁高亮：画在 overlay 上简单处理——直接改 drawn 再渲染，玩家可撤
        drawn[k] = want;
        steps++;
        stepsEl.textContent = steps;
        hintGiven = true;
        if (Arcade.audio) Arcade.audio.play('coin');
        render();
        checkComplete();
      }
    }
    if (!hintGiven) msgEl.textContent = T('gs.hashi.allRight');
  }

  hintBtn.addEventListener('click', giveHint);
  newBtn.addEventListener('click', function () { if (Arcade.audio) Arcade.audio.play('ui'); startPuzzle(); });

  /* 每日一题：日期种子确定性生成 */
  function startDaily() {
    isDaily = true;
    var rng = mulberry32(todaySeed());
    var D = DIFFS[Math.floor(rng() * DIFFS.length)];
    diffEl.textContent = T('gs.hashi.dailyPre').replace('{n}', T(D.name));
    var bs = diffRow.querySelectorAll('.mode-btn');
    for (var bi = 0; bi < bs.length; bi++) bs[bi].classList.toggle('selected', bi === DIFFS.indexOf(D));
    puzzle = generate(D.grid, D.islands, rng);
    if (!puzzle) { msgEl.textContent = T('gs.hashi.genFail'); return; }
    drawn = {};
    selIsland = null;
    steps = 0;
    stepsEl.textContent = '0';
    overlayEl.classList.add('hidden');
    var d2 = new Date();
    msgEl.textContent = T('gs.hashi.dailyMsg').replace('{d}', d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate()).replace('{n}', T(D.name));
    render();
  }
  dailyBtn.addEventListener('click', function () { if (Arcade.audio) Arcade.audio.play('ui'); startDaily(); });

  DIFFS.forEach(function (d, i) {
    var b = document.createElement('button');
    b.className = 'mode-btn' + (i === diffIdx ? ' selected' : '');
    b.textContent = T(d.name);
    b.addEventListener('click', function () {
      diffIdx = i;
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      startPuzzle();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
    diffRow.appendChild(b);
  });

  startPuzzle();
  window.GAME_RESTART = startPuzzle;


})();
