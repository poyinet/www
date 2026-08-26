/* ============================================================
   数回 Slitherlink · 经典逻辑谜题（旗舰级）
   规则：把格点连成一个闭合环；格子里的数字 = 它周围被画线的边数；
         所有线必须形成一条单一闭合环（无分支、无断头）。
   质量核心：
     - 程序化生成：双路径法随机生成简单闭合环（可靠不自交）
     - 挖洞后必须「唯一解」：带约束传播的回溯求解器验证
       （数字约束 + 格点度数 + 单环连通性），生成不到唯一解自动重试
   记分：min 模式，操作步数越少越好
   ============================================================ */

(function () {
  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.slitherlink.tut1t'), d: T('gs.slitherlink.tut1') },
    { t: T('gs.slitherlink.tut2t'), d: T('gs.slitherlink.tut2') },
    { t: T('gs.slitherlink.tut3t'), d: T('gs.slitherlink.tut3') }
  ];
  /* ================= 纯逻辑：生成与求解 ================= */

  /** 生成一个简单闭合环（双路径法）
      rows/cols：格子数；环经过格点坐标集合（不包含起点重复，视为闭合）
      rng 可选：确定性随机源（每日一题用） */
  function genLoop(rows, cols, rng) {
    rng = rng || Math.random;
    var GN = rows + 1, GM = cols + 1; // 格点网格
    for (var attempt = 0; attempt < 300; attempt++) {
      // 随机选 A、B 两个格点（曼哈顿距离 >= 4）
      var ax = Math.floor(rng() * GM), ay = Math.floor(rng() * GN);
      var bx = Math.floor(rng() * GM), by = Math.floor(rng() * GN);
      if (Math.abs(ax - bx) + Math.abs(ay - by) < 4) continue;
      var p1 = randPath(ax, ay, bx, by, GN, GM, null, rng);
      if (!p1) continue;
      // 占用 p1 的内部点（排除端点）后再找第二条 B→A 的反向路径（两路合拢成环）
      var blocked = {};
      for (var i = 1; i < p1.length - 1; i++) blocked[p1[i].y * 100 + p1[i].x] = true;
      var p2 = randPath(bx, by, ax, ay, GN, GM, blocked, rng);
      if (!p2) continue;
      // 环 = p1(A→B) + p2(B→A)，p2 去掉起点 B（与 p1 终点重合）
      // 注意：p2 终点 A 与 p1 起点 A 重合，边数为 all.length - 1，不能用 (j+1)%len 否则产生自环边
      var all = p1.concat(p2.slice(1));
      var edges = {};
      var ok = true;
      for (var j = 0; j < all.length - 1; j++) {
        var a = all[j], b = all[j + 1];
        var key = edgeKey(a.x, a.y, b.x, b.y);
        if (edges[key]) { ok = false; break; }
        edges[key] = true;
      }
      if (!ok || Object.keys(edges).length < 8) continue;
      return { edges: edges, path: all };
    }
    return null;
  }

  function edgeKey(x1, y1, x2, y2) {
    if (x1 > x2 || (x1 === x2 && y1 > y2)) { var t = x1; x1 = x2; x2 = t; t = y1; y1 = y2; y2 = t; }
    return x1 + ',' + y1 + '-' + x2 + ',' + y2;
  }

  /** 随机 A→B 不自交路径（随机化 BFS 生成树，树路径天然无环；blocked 为不可经过点集） */
  function randPath(ax, ay, bx, by, GN, GM, blocked, rng) {
    rng = rng || Math.random;
    for (var attempt = 0; attempt < 30; attempt++) {
      var parent = {};
      var seen = {};
      seen[ay * 100 + ax] = true;
      var queue = [[ax, ay]];
      var found = false;
      var guard = 0;
      while (queue.length && guard++ < 5000) {
        // 随机化 BFS 顺序（随机取队中任意元素）
        var idx = Math.floor(rng() * queue.length);
        var cur = queue[idx];
        queue.splice(idx, 1);
        if (cur[0] === bx && cur[1] === by) { found = true; break; }
        var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (var i = dirs.length - 1; i > 0; i--) { var j2 = Math.floor(rng() * (i + 1)); var t2 = dirs[i]; dirs[i] = dirs[j2]; dirs[j2] = t2; }
        for (var d = 0; d < dirs.length; d++) {
          var nx = cur[0] + dirs[d][0], ny = cur[1] + dirs[d][1];
          if (nx < 0 || ny < 0 || nx >= GM || ny >= GN) continue;
          if (blocked && blocked[ny * 100 + nx]) continue;
          var k = ny * 100 + nx;
          if (seen[k]) continue;
          seen[k] = true;
          parent[k] = [cur[0], cur[1]];
          queue.push([nx, ny]);
        }
      }
      if (!found) continue;
      // 回溯路径
      var path = [];
      var c = [bx, by];
      while (true) {
        path.unshift({ x: c[0], y: c[1] });
        if (c[0] === ax && c[1] === ay) break;
        c = parent[c[1] * 100 + c[0]];
        if (!c) { path = null; break; }
      }
      if (path) return path;
    }
    return null;
  }

  /** 由环生成数字板（返回 rows x cols 的数字，-1 表示挖空） */
  function numbersFromLoop(loop, rows, cols) {
    var nums = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) {
        var n = 0;
        // 四边：上 (r,c)-(r,c+1) 下 (r+1,c)-(r+1,c+1) 左 (r,c)-(r+1,c) 右 (r,c+1)-(r+1,c+1)
        if (loop.edges[edgeKey(c, r, c + 1, r)]) n++;
        if (loop.edges[edgeKey(c, r + 1, c + 1, r + 1)]) n++;
        if (loop.edges[edgeKey(c, r, c, r + 1)]) n++;
        if (loop.edges[edgeKey(c + 1, r, c + 1, r + 1)]) n++;
        row.push(n);
      }
      nums.push(row);
    }
    return nums;
  }

  /** 挖洞：贪心最小化线索——逐个格子尝试移除，若仍唯一解则保留移除（含 0 数字）
      keepRatio: 目标保留比例下限；budgetMs: 挖洞总时间预算（超时即停，已挖的都是合法唯一解）
      loop: 目标环（加速验证：找到的解≠目标环立即判多解） */
  function carve(nums, keepRatio, budgetMs, loop, rng) {
    rng = rng || Math.random;
    var rows = nums.length, cols = nums[0].length;
    var clues = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) row.push(nums[r][c]);
      clues.push(row);
    }
    // 随机顺序尝试挖掉数字，保持唯一解
    var order = [];
    for (var i = 0; i < rows * cols; i++) order.push(i);
    for (var j = order.length - 1; j > 0; j--) { var k2 = Math.floor(rng() * (j + 1)); var t2 = order[j]; order[j] = order[k2]; order[k2] = t2; }
    var total = rows * cols;
    var removed = 0;
    var targetRemove = Math.floor(total * (1 - keepRatio));
    var deadline = budgetMs ? Date.now() + budgetMs : 0;
    var perSolve = Math.max(80, (budgetMs || 600) / (targetRemove + 1));
    for (var idx = 0; idx < order.length; idx++) {
      if (removed >= targetRemove) break;
      if (deadline && Date.now() > deadline) break; // 时间预算耗尽，保留当前合法题
      var r2 = Math.floor(order[idx] / cols), c2 = order[idx] % cols;
      var old = clues[r2][c2];
      clues[r2][c2] = -1;
      var res = countSolutions(clues, loop, 2, perSolve);
      if (res.limit || res.count !== 1) {
        clues[r2][c2] = old; // 恢复
      } else {
        removed++;
      }
    }
    return clues;
  }

  /* ---------- 求解器 ---------- */
  /** 构造边变量数组，返回 {edges: [{h:bool,v:bool,x1,y1,x2,y2}], neighbors...}
      rows x cols 格子；边索引：水平 H[r][c] r∈[0..rows] c∈[0..cols-1]；垂直 V[r][c] r∈[0..rows-1] c∈[0..cols] */
  function buildEdges(rows, cols) {
    var list = [];
    var H = [], V = [];
    for (var r = 0; r <= rows; r++) { H[r] = []; for (var c = 0; c < cols; c++) { var e = { v: 0, key: edgeKey(c, r, c + 1, r), r1: r, c1: c, r2: r, c2: c + 1, h: true }; H[r][c] = e; list.push(e); } }
    for (var r2 = 0; r2 < rows; r2++) { V[r2] = []; for (var c2 = 0; c2 <= cols; c2++) { var e2 = { v: 0, key: edgeKey(c2, r2, c2, r2 + 1), r1: r2, c1: c2, r2: r2 + 1, c2: c2, h: false }; V[r2][c2] = e2; list.push(e2); } }
    return { list: list, H: H, V: V };
  }

  /** 求解：返回解数量（最多找 limit 个），并验证是否为单一闭合环
      loop 可选：生成器场景传入目标环，找到的解若 ≠ 目标环则直接判多解（大幅提速）
      budgetMs 可选：搜索时间预算（毫秒），超时抛 'timeout' 由调用方处理 */
  function countSolutions(clues, loop, limit, budgetMs) {
    var rows = clues.length, cols = clues[0].length;
    var B = buildEdges(rows, cols);
    var state = {}; // key -> -1 未定 / 0 不画 / 1 画
    B.list.forEach(function (e) { state[e.key] = -1; });
    var solution = null;
    var count = 0;
    var nodes = 0;
    var MAX_NODES = rows * cols * 9000;
    var deadline = budgetMs ? Date.now() + budgetMs : 0;

    // 数字格子周围四边 key
    function cellEdges(r, c) {
      return [
        B.H[r][c].key, B.H[r + 1][c].key,
        B.V[r][c].key, B.V[r][c + 1].key
      ];
    }

    /** 约束传播；返回 {ok, touched}——touched 为本次传播改动过的边 key 列表（供回溯撤销） */
    function propagate() {
      var touched = [];
      function set(k, v) {
        if (state[k] !== v) { state[k] = v; touched.push(k); return true; }
        return false;
      }
      var changed = true;
      while (changed) {
        changed = false;
        // 数字约束
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var num = clues[r][c];
            if (num < 0) continue;
            var ks = cellEdges(r, c);
            var on = 0, und = 0, undK = [];
            for (var i = 0; i < 4; i++) {
              var s = state[ks[i]];
              if (s === 1) on++;
              else if (s === -1) { und++; undK.push(ks[i]); }
            }
            if (on > num) return { ok: false, touched: touched };
            if (on === num) { for (var j = 0; j < undK.length; j++) { if (set(undK[j], 0)) changed = true; } }
            else if (on + und === num) { for (var j2 = 0; j2 < undK.length; j2++) { if (set(undK[j2], 1)) changed = true; } }
          }
        }
        // 格点度数：每个格点最多 2 条线；已有 2 条则其余相邻边排除
        for (var gy = 0; gy <= rows; gy++) {
          for (var gx = 0; gx <= cols; gx++) {
            var keys = [];
            if (gy > 0) keys.push(B.V[gy - 1][gx].key);
            if (gy < rows) keys.push(B.V[gy][gx].key);
            if (gx > 0) keys.push(B.H[gy][gx - 1].key);
            if (gx < cols) keys.push(B.H[gy][gx].key);
            var on2 = 0, und2 = [];
            for (var k = 0; k < keys.length; k++) {
              var st = state[keys[k]];
              if (st === 1) on2++;
              else if (st === -1) und2.push(keys[k]);
            }
            if (on2 > 2) return { ok: false, touched: touched };
            if (on2 === 2) { for (var m = 0; m < und2.length; m++) { if (set(und2[m], 0)) changed = true; } }
            // 度数 1 且只剩 1 条未定边：该边必须画（凑成度数 2）
            else if (on2 === 1 && und2.length === 1) { if (set(und2[0], 1)) changed = true; }
            // 度数 1 且无未定边：断头，剪枝
            else if (on2 === 1 && und2.length === 0) return { ok: false, touched: touched };
            // 度数 0 且只有 1 条未定边：可画可不画（不强制）
          }
        }
      }
      return { ok: true, touched: touched };
    }

    function isSolved() {
      // 所有约束满足 + 单一闭合环
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var num = clues[r][c];
          if (num < 0) continue;
          var ks = cellEdges(r, c);
          var on = 0;
          for (var i = 0; i < 4; i++) if (state[ks[i]] === 1) on++;
          if (on !== num) return false;
        }
      }
      // 度数检查
      var edgeOn = [];
      for (var e2 = 0; e2 < B.list.length; e2++) if (state[B.list[e2].key] === 1) edgeOn.push(B.list[e2]);
      if (edgeOn.length === 0) return false;
      for (var gy2 = 0; gy2 <= rows; gy2++) {
        for (var gx2 = 0; gx2 <= cols; gx2++) {
          var kk = [];
          if (gy2 > 0) kk.push(B.V[gy2 - 1][gx2].key);
          if (gy2 < rows) kk.push(B.V[gy2][gx2].key);
          if (gx2 > 0) kk.push(B.H[gy2][gx2 - 1].key);
          if (gx2 < cols) kk.push(B.H[gy2][gx2].key);
          var onn = 0;
          for (var q = 0; q < kk.length; q++) if (state[kk[q]] === 1) onn++;
          if (onn !== 0 && onn !== 2) return false;
        }
      }
      // 单环连通：从任一边起点遍历，走遍所有边
      var start = edgeOn[0];
      var visited = {};
      var curR = start.r1, curC = start.c1, fromR = start.r2, fromC = start.c2;
      var steps = 0;
      while (steps <= edgeOn.length + 1) {
        visited[edgeKey(curC, curR, fromC, fromR)] = true;
        // 当前格点 (curR,curC)，找下一条边（非来自方向）
        var nexts = [];
        if (curR > 0) nexts.push({ e: B.V[curR - 1][curC], nr: curR - 1, nc: curC });
        if (curR < rows) nexts.push({ e: B.V[curR][curC], nr: curR + 1, nc: curC });
        if (curC > 0) nexts.push({ e: B.H[curR][curC - 1], nr: curR, nc: curC - 1 });
        if (curC < cols) nexts.push({ e: B.H[curR][curC], nr: curR, nc: curC + 1 });
        var found2 = null;
        for (var n = 0; n < nexts.length; n++) {
          if (state[nexts[n].e.key] !== 1) continue;
          if (nexts[n].nr === fromR && nexts[n].nc === fromC) continue;
          found2 = nexts[n]; break;
        }
        if (!found2) return false;
        fromR = curR; fromC = curC;
        curR = found2.nr; curC = found2.nc;
        steps++;
        if (curR === start.r1 && curC === start.c1 && fromR === start.r2 && fromC === start.c2) break;
      }
      if (curR !== start.r1 || curC !== start.c1) return false;
      return visited ? Object.keys(visited).length >= edgeOn.length : false;
    }

    function solve() {
      nodes++;
      if (deadline && Date.now() > deadline) throw new Error('timeout');
      if (nodes > MAX_NODES) throw new Error('nodeLimit');
      if (count >= limit) return;
      var pr = propagate();
      if (!pr.ok) return;
      // MRV 启发：选未定边中「邻接有数字格子数最多」的边（约束最强优先），
      // 再按邻接数字值小优先（数字 0/1 约束强）
      var undK = null, bestScore = -1;
      for (var i = 0; i < B.list.length; i++) {
        var e = B.list[i];
        if (state[e.key] !== -1) continue;
        var s = 0;
        // 水平边 (c,r)-(c+1,r) 邻接上方格子 (c,r-1) 与下方格子 (c,r)
        if (e.h) {
          var r1 = e.r1, c1 = e.c1;
          if (r1 > 0 && clues[r1 - 1][c1] >= 0) s += 2 - clues[r1 - 1][c1] * 0.5;
          if (r1 < rows && clues[r1][c1] >= 0) s += 2 - clues[r1][c1] * 0.5;
        } else {
          // 垂直边 (c,r)-(c,r+1) 邻接左格子 (c-1,r) 与右格子 (c,r)
          var r2 = e.r1, c2 = e.c1;
          if (c2 > 0 && clues[r2][c2 - 1] >= 0) s += 2 - clues[r2][c2 - 1] * 0.5;
          if (c2 < cols && clues[r2][c2] >= 0) s += 2 - clues[r2][c2] * 0.5;
        }
        if (s > bestScore) { bestScore = s; undK = e.key; }
      }
      if (!undK) {
        if (isSolved()) {
          // 生成器场景：解必须与目标环一致，否则立即判定多解（不再找第 2 个解）
          if (loop) {
            var mismatch = false;
            for (var mi = 0; mi < B.list.length; mi++) {
              var mk = B.list[mi].key;
              var want = loop.edges[mk] ? 1 : 0;
              if (state[mk] !== want) { mismatch = true; break; }
            }
            if (mismatch) { count = limit; return; } // 有解但不是目标环 → 非唯一目标解，立即终止
          }
          count++;
          if (!solution) { solution = {}; for (var k2 in state) solution[k2] = state[k2]; }
        }
        return;
      }
      // 分支：画 / 不画。用快照回溯（state 很小，深拷贝开销可忽略，绝对正确）
      var snapshot = {};
      for (var sk in state) snapshot[sk] = state[sk];
      state[undK] = 1; solve();
      for (var sk2 in snapshot) state[sk2] = snapshot[sk2];
      state[undK] = 0; solve();
      for (var sk3 in snapshot) state[sk3] = snapshot[sk3];
    }

    try { solve(); } catch (e) {
      if (e.message === 'timeout') return { count: count, limit: true, timeout: true };
      if (e.message !== 'nodeLimit') throw e;
      return { count: count, limit: true };
    }
    return { count: count, limit: false, solution: solution };
  }

  /** 生成一局：返回 {rows, cols, clues, solution(边 key->1)} */
  function generate(rows, cols, keepRatio, budgetMs, rng) {
    rng = rng || Math.random;
    for (var attempt = 0; attempt < 100; attempt++) {
      var loop = genLoop(rows, cols, rng);
      if (!loop) continue;
      var nums = numbersFromLoop(loop, rows, cols);
      var clues = carve(nums, keepRatio, budgetMs, loop, rng);
      var res = countSolutions(clues, loop, 2, Math.max(200, (budgetMs || 0) / 2));
      if (res.limit || res.count !== 1) continue;
      var sol = {};
      for (var k in loop.edges) sol[k] = 1;
      return { rows: rows, cols: cols, clues: clues, solution: sol };
    }
    return null;
  }

  /* mulberry32：确定性 PRNG（每日一题用） */
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

  /* ================= UI ================= */
  var DIFFS = [
    { name: 'gs.slitherlink.easy', rows: 5, cols: 5, keep: 0.6, budget: 600 },
    { name: 'gs.slitherlink.mid', rows: 7, cols: 7, keep: 0.5, budget: 1500 },
    { name: 'gs.slitherlink.hard', rows: 9, cols: 9, keep: 0.55, budget: 4000 }
  ];
  var diffIdx = 0;

  var root = document.getElementById('game-root');
  var topHtml =
    '<div class="sl-top">' +
    '  <span>' + T('gs.slitherlink.diff') + ' <span class="stat-value" id="sl-diff"></span></span>' +
    '  <span>' + T('gs.slitherlink.steps') + ' <span class="stat-value" id="sl-steps">0</span></span>' +
    '  <span>' + T('gs.slitherlink.lines').replace('{n}', '<span class="stat-value" id="sl-ok">0</span>') + '</span>' +
    '</div>' +
    '<div class="mode-row" id="sl-diffs"></div>';
  var msgHtml = '<div class="sl-msg" id="sl-msg" aria-live="polite"></div>';
  var boardHtml = '<div class="sl-board" id="sl-board"></div>';
  var ctrlHtml =
    '<div class="game-controls">' +
    '  <button class="btn green" id="sl-check">' + T('gs.slitherlink.check') + '</button>' +
    '  <button class="btn purple" id="sl-new">' + T('gs.slitherlink.newPuzzle') + '</button>' +
    '  <button class="btn yellow" id="sl-daily">' + T('gs.slitherlink.daily') + '</button>' +
    '</div>';
  root.innerHTML = topHtml + msgHtml + boardHtml + ctrlHtml;

  var boardEl = document.getElementById('sl-board');
  var msgEl = document.getElementById('sl-msg');
  var stepsEl = document.getElementById('sl-steps');
  var okEl = document.getElementById('sl-ok');
  var diffEl = document.getElementById('sl-diff');
  var diffRow = document.getElementById('sl-diffs');
  var checkBtn = document.getElementById('sl-check');
  var newBtn = document.getElementById('sl-new');
  var dailyBtn = document.getElementById('sl-daily');

  var puzzle = null;
  var edgeState = {};   // key -> 0 未画 / 1 画 / -1 ✕
  var steps = 0;
  var isDaily = false;  // 当前是否每日一题（解完计入今日破译中心）

  function startPuzzle() {
    isDaily = false;
    var D = DIFFS[diffIdx];
    diffEl.textContent = T(D.name);
    puzzle = generate(D.rows, D.cols, D.keep, D.budget);
    if (!puzzle) { msgEl.textContent = T('gs.slitherlink.genFail'); return; }
    edgeState = {};
    steps = 0;
    stepsEl.textContent = '0';
    msgEl.textContent = T('gs.slitherlink.startMsg').replace('{n}', T(D.name));
    buildBoard();
  }

  function buildBoard() {
    var rows = puzzle.rows, cols = puzzle.cols;
    // grid: 2*rows+1 行 x 2*cols+1 列
    // 响应式格宽：320px 屏不溢出（此前固定 26px，7×7≈390px 横向溢出）
    var maxW = Math.min(660, (window.innerWidth || 375) - 24);
    var cell = Math.max(12, Math.min(26, Math.floor((maxW - 20) / (2 * cols + 1))));
    boardEl.style.gridTemplateColumns = 'repeat(' + (2 * cols + 1) + ', ' + cell + 'px)';
    boardEl.innerHTML = '';
    for (var gy = 0; gy <= 2 * rows; gy++) {
      for (var gx = 0; gx <= 2 * cols; gx++) {
        var cell = document.createElement('div');
        if (gy % 2 === 0 && gx % 2 === 0) {
          cell.className = 'sl-dot';
          cell.style.width = '10px'; cell.style.height = '10px';
          cell.style.borderRadius = '50%';
          cell.style.background = 'rgba(150,150,200,0.5)';
          cell.style.margin = 'auto';
        } else if (gy % 2 === 0) {
          // 水平边
          var r = gy / 2, c = (gx - 1) / 2;
          var key = edgeKey(c, r, c + 1, r);
          cell.className = 'sl-edge h';
          cell.innerHTML = '<span class="bar"></span>';
          cell.dataset.key = key;
          bindEdge(cell, key);
        } else if (gx % 2 === 0) {
          // 垂直边
          var r2 = (gy - 1) / 2, c2 = gx / 2;
          var key2 = edgeKey(c2, r2, c2, r2 + 1);
          cell.className = 'sl-edge v';
          cell.innerHTML = '<span class="bar"></span>';
          cell.dataset.key = key2;
          bindEdge(cell, key2);
        } else {
          // 数字格
          var rr = (gy - 1) / 2, cc = (gx - 1) / 2;
          var n = puzzle.clues[rr][cc];
          cell.className = 'sl-cell' + (n === 0 ? ' zero' : '');
          if (n >= 0) cell.textContent = n;
        }
        boardEl.appendChild(cell);
      }
    }
    refreshEdges();
  }

  function bindEdge(cell, key) {
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', T('gs.slitherlink.edgeAria'));
    function cycle() {
      edgeState[key] = edgeState[key] === 1 ? -1 : (edgeState[key] === -1 ? 0 : 1);
      steps++;
      stepsEl.textContent = steps;
      refreshEdges();
      if (Arcade.audio) Arcade.audio.play('ui');
      if (edgeState[key] === 1) { okEl.textContent = countOn(); }
    }
    cell.addEventListener('click', function (e) { e.preventDefault(); cycle(); });
    cell.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); }
    });
  }

  function refreshEdges() {
    var els = boardEl.querySelectorAll('.sl-edge');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].dataset.key;
      els[i].classList.toggle('on', edgeState[k] === 1);
      els[i].classList.toggle('x', edgeState[k] === -1);
    }
    okEl.textContent = countOn();
  }

  function countOn() {
    var n = 0;
    for (var k in edgeState) if (edgeState[k] === 1) n++;
    return n;
  }

  function check() {
    if (!puzzle) return;
    var wrong = 0;
    for (var k in edgeState) {
      var want = puzzle.solution[k] === 1;
      var have = edgeState[k] === 1;
      if (have !== want) wrong++;
    }
    var onCount = countOn();
    var solCount = 0;
    for (var k2 in puzzle.solution) solCount++;
    if (wrong === 0 && onCount === solCount) {
      msgEl.textContent = T('gs.slitherlink.win').replace('{n}', steps);
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(steps);
      if (Arcade.daily && isDaily) Arcade.daily.markSolved('slitherlink', steps); // 步数非秒：大厅显示口径待统一
    } else if (wrong === 0) {
      msgEl.textContent = T('gs.slitherlink.remain').replace('{n}', solCount - onCount);
    } else {
      msgEl.textContent = T('gs.slitherlink.wrong').replace('{n}', wrong);
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }

  checkBtn.addEventListener('click', function () { check(); if (Arcade.audio) Arcade.audio.play('ui'); });
  newBtn.addEventListener('click', function () { if (Arcade.audio) Arcade.audio.play('ui'); startPuzzle(); });

  /* 每日一题：日期种子确定性生成（同一天同一题） */
  function startDaily() {
    isDaily = true;
    var rng = mulberry32(todaySeed());
    var D = DIFFS[Math.floor(rng() * DIFFS.length)];
    diffEl.textContent = T('gs.slitherlink.dailyPre').replace('{n}', T(D.name));
    // 难度 chips 同步
    var bs = diffRow.querySelectorAll('.mode-btn');
    for (var bi = 0; bi < bs.length; bi++) bs[bi].classList.toggle('selected', bi === DIFFS.indexOf(D));
    puzzle = generate(D.rows, D.cols, D.keep, D.budget, rng);
    if (!puzzle) { msgEl.textContent = T('gs.slitherlink.genFail'); return; }
    edgeState = {};
    steps = 0;
    stepsEl.textContent = '0';
    var d2 = new Date();
    msgEl.textContent = T('gs.slitherlink.dailyMsg').replace('{d}', d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate()).replace('{n}', T(D.name));
    buildBoard();
  }
  dailyBtn.addEventListener('click', function () { if (Arcade.audio) Arcade.audio.play('ui'); startDaily(); });

  // 难度选择
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

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.slitherlink.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = startPuzzle;


})();
