/* ============================================================
   弹珠消消 Ball Pop · 球链消除旗舰（P2 品类旗舰）
   彩球链沿蛇形路径前进，发射同色球插入链中，3 连消。
   连锁消除、倒退球、爆炸球；三难度（球速/颜色数/链长递进）。
   记分：总分（max 模式）。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.ballpop.tut1t'), d: T('gs.ballpop.tut1') },
  { t: T('gs.ballpop.tut2t'), d: T('gs.ballpop.tut2') },
  { t: T('gs.ballpop.tut3t'), d: T('gs.ballpop.tut3') },
  { t: T('gs.ballpop.tut4t'), d: T('gs.ballpop.tut4') }
];

(function () {
  /* ==ZUMA-CORE-START== */
  var ZCORE = (function () {
    /* 路径：折线点列表（蛇形）。返回每段长度与总长。 */
    function pathDists(points) {
      var dists = [], total = 0;
      for (var i = 1; i < points.length; i++) {
        var d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
        dists.push(d); total += d;
      }
      return { dists: dists, total: total };
    }
    /* 沿路径取点：dist → (x,y,角度) */
    function pointAt(points, dists, d) {
      var acc = 0;
      for (var i = 0; i < dists.length; i++) {
        if (d <= acc + dists[i] || i === dists.length - 1) {
          var t = dists[i] === 0 ? 0 : Math.max(0, Math.min(1, (d - acc) / dists[i]));
          var x = points[i][0] + (points[i + 1][0] - points[i][0]) * t;
          var y = points[i][1] + (points[i + 1][1] - points[i][1]) * t;
          var ang = Math.atan2(points[i + 1][1] - points[i][1], points[i + 1][0] - points[i][0]);
          return { x: x, y: y, a: ang };
        }
        acc += dists[i];
      }
      return { x: points[points.length - 1][0], y: points[points.length - 1][1], a: 0 };
    }
    /* 插入后消解：chain = [{dist,color}]，插入 (dist,color) 后返回 {removed, chain, combo}
       removed>0 时递归检查两侧同色（连锁）。纯函数，可测。 */
    function insertAndResolve(chain, dist, color, minRun) {
      minRun = minRun || 3;
      var arr = chain.slice();
      var idx = 0;
      while (idx < arr.length && arr[idx].dist < dist) idx++;
      arr.splice(idx, 0, { dist: dist, color: color });
      var combo = 0;
      var changed = true;
      while (changed) {
        changed = false;
        // 找连续同色段
        var i = 0;
        while (i < arr.length) {
          var j = i;
          while (j + 1 < arr.length && arr[j + 1].color === arr[i].color) j++;
          if (j - i + 1 >= minRun) {
            arr.splice(i, j - i + 1);
            combo++;
            changed = true;
            break;
          }
          i = j + 1;
        }
      }
      return { arr: arr, combo: combo, removedCount: (chain.length + 1) - arr.length };
    }
    /* 生成初始球链：按路径长度铺球（球距 spacing，颜色随机），保证初始无 3 连 */
    function genChain(pathLen, spacing, colors, rng) {
      var chain = [];
      var d = spacing;
      var guard = 0;
      while (d < pathLen - spacing && guard++ < 500) {
        var c;
        do { c = Math.floor(rng() * colors); } while (
          chain.length >= 2 && chain[chain.length - 1].color === c && chain[chain.length - 2].color === c
        );
        chain.push({ dist: d, color: c });
        d += spacing;
      }
      return chain;
    }
    return { pathDists: pathDists, pointAt: pointAt, insertAndResolve: insertAndResolve, genChain: genChain };
  })();
  /* ==ZUMA-CORE-END== */

  var pathDists = ZCORE.pathDists, pointAt = ZCORE.pointAt;
  var insertAndResolve = ZCORE.insertAndResolve, genChain = ZCORE.genChain;

  var root = document.getElementById('game-root');
  var W = 480, H = 420;
  var html =
    '<div class="zm-top">' +
    '  <span>💎 <b id="zm-score">0</b></span>' +
    '  <span>' + T('gs.ballpop.combo') + ' <b id="zm-combo">0</b></span>' +
    '  <span>' + T('gs.ballpop.left') + ' <b id="zm-left">0</b></span>' +
    '  <span>' + T('gs.ballpop.level').replace('{n}', '<b id="zm-level">1</b>') + '</span>' +
    '</div>' +
    '<div class="mode-row" id="zm-diffs">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.ballpop.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.ballpop.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.ballpop.dHard') + '</button>' +
    '</div>' +
    '<div class="zm-stage"><canvas class="zm-canvas" id="zm-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '  <div class="zm-msg" id="zm-msg"></div></div>' +
    '<div class="zm-help">' + T('gs.ballpop.help') + '</div>';
  root.innerHTML = html;
  var hd=document.createElement('div');hd.style.cssText='font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';hd.innerHTML = T('gs.ballpop.helpText');root.appendChild(hd);

  // 结算后「再来一局」按钮（胜/负后显示；此前需用顶栏重开）
  var againBtn = document.createElement('button');
  againBtn.className = 'btn purple';
  againBtn.style.display = 'none';
  againBtn.style.margin = '10px auto 0';
  againBtn.textContent = T('gs.ballpop.again');
  againBtn.addEventListener('click', function () { if (
  window.GAME_RESTART) window.GAME_RESTART(); });
  root.appendChild(againBtn);
  function showAgain() { againBtn.style.display = 'inline-block'; }

  var canvas = document.getElementById('zm-canvas');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('zm-score'), comboEl = document.getElementById('zm-combo'),
      leftEl = document.getElementById('zm-left'), levelEl = document.getElementById('zm-level'),
      msgEl = document.getElementById('zm-msg'), diffRow = document.getElementById('zm-diffs');

  var DIFFS = {
    easy: { speed: 0.35, colors: 3, spacing: 30, chain: 14 },
    normal: { speed: 0.55, colors: 4, spacing: 28, chain: 18 },
    hard: { speed: 0.8, colors: 5, spacing: 26, chain: 24 }
  };
  var diff = 'normal';
  var D = DIFFS[diff];
  var COLORS = ['#00f0ff', '#ff2d95', '#ffe600', '#39ff14', '#b967ff'];

  var PATH = [
    [40, 380], [40, 90], [200, 90], [200, 300], [360, 300], [360, 120], [440, 120]
  ];
  var PD = pathDists(PATH);
  var HOLE_DIST = PD.total - 10;

  var chain = [], score = 0, combo = 0, level = 1, over = false, won = false, paused = false;
  var shooter = { x: W / 2, y: H - 30, ang: -Math.PI / 2 };
  var current = null, next = null, fire = null; // 待发射球 / 下一颗 / 飞行中的球
  var loopApi = null, holeDist = 0;

  function newGame() {
    score = 0; combo = 0; level = 1; over = false; won = false; paused = false;
    D = DIFFS[diff];
    chain = genChain(PD.total, D.spacing, D.colors, Math.random);
    current = { color: Math.floor(Math.random() * D.colors) };
    next = { color: Math.floor(Math.random() * D.colors) };
    fire = null;
    holeDist = 0;
    msgEl.textContent = '';
    msgEl.style.color = '';
    scoreEl.textContent = '0'; comboEl.textContent = '0'; levelEl.textContent = '1';
    leftEl.textContent = chain.length;
  }

  /* ---------- 更新 ---------- */
  function update() {
    if (over || won || paused) return;
    // 链推进
    holeDist += D.speed;
    chain.forEach(function (b) { b.dist += D.speed; });
    if (holeDist >= HOLE_DIST) {
      over = true;
      if (Arcade.juice) Arcade.juice.lose();
      if (Arcade.shell) Arcade.shell.submitScore(score);
    }
    // 飞行球
    if (fire) {
      var f = fire;
      f.x += Math.cos(f.ang) * f.spd;
      f.y += Math.sin(f.ang) * f.spd;
      if (f.x < 0 || f.x > W || f.y < 0 || f.y > H) { fire = null; return; }
      // 命中链球：距离 < 球径
      for (var i = 0; i < chain.length; i++) {
        var b = chain[i];
        var bx = pointAt(PATH, PD.dists, b.dist).x, by = pointAt(PATH, PD.dists, b.dist).y;
        if (Math.hypot(f.x - bx, f.y - by) < 11) {
          var res = insertAndResolve(chain, b.dist, f.color, 3);
          var removed = res.removedCount;
          chain = res.arr;
          fire = null;
          if (removed > 0) {
            combo = res.combo;
            score += removed * 10 * res.combo;
            if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-yellow)', 8);
          } else {
            combo = 0;
          }
          leftEl.textContent = chain.length;
          // 特殊球：倒退（随机 15%）
          if (Math.random() < 0.15 && !over) {
            chain.forEach(function (bb) { bb.dist = Math.max(0, bb.dist - 60); });
            holeDist = Math.max(0, holeDist - 60);
          }
          break;
        }
      }
      // 命中链头（进洞方向）
      if (!chain.length) {
        // 本关清空：第 1/2 关递进，第 3 关胜利
        if (level < 3) {
          level++;
          levelEl.textContent = level;
          D.speed = Math.min(2, DIFFS[diff].speed + level * 0.08);
          chain = genChain(PD.total, D.spacing, Math.min(5, D.colors + (level > 2 ? 1 : 0)), Math.random);
          leftEl.textContent = chain.length;
          score += 200;
          if (Arcade.ui) Arcade.ui.toast(T('gs.ballpop.levelClear').replace('{n}', level - 1).replace('{m}', level), 'win');
        } else {
          won = true;
          score += 1000;
          if (Arcade.juice) Arcade.juice.win();
          if (Arcade.shell) Arcade.shell.submitScore(score);
        }
      }
    }
    // 换球
    if (!fire) {
      current = next;
      next = { color: Math.floor(Math.random() * D.colors) };
    }
    scoreEl.textContent = score;
    comboEl.textContent = combo;
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, W, H);
    // 路径
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 16; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0][0], PATH[0][1]);
    for (var i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i][0], PATH[i][1]);
    ctx.stroke();
    // 洞
    var hp = pointAt(PATH, PD.dists, HOLE_DIST);
    ctx.fillStyle = '#ff2d95';
    ctx.beginPath(); ctx.arc(hp.x, hp.y, 14, 0, Math.PI * 2); ctx.fill();
    // 球链
    chain.forEach(function (b) {
      var p = pointAt(PATH, PD.dists, b.dist);
      ctx.fillStyle = COLORS[b.color];
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
    });
    // 发射器 + 待发球
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + Math.cos(shooter.ang) * 30, shooter.y + Math.sin(shooter.ang) * 30);
    ctx.stroke();
    if (current) {
      ctx.fillStyle = COLORS[current.color];
      ctx.beginPath(); ctx.arc(shooter.x, shooter.y, 10, 0, Math.PI * 2); ctx.fill();
    }
    if (next) {
      ctx.fillStyle = COLORS[next.color];
      ctx.beginPath(); ctx.arc(W - 20, 20, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(T('gs.ballpop.next'), W - 20, 38);
    }
    if (fire) {
      ctx.fillStyle = COLORS[fire.color];
      ctx.beginPath(); ctx.arc(fire.x, fire.y, 9, 0, Math.PI * 2); ctx.fill();
    }
    if (over) {
      msgEl.textContent = T('gs.ballpop.dead').replace('{n}', score);
      msgEl.style.color = 'var(--neon-pink)';
      showAgain();
    } else if (won) {
      msgEl.textContent = T('gs.ballpop.win').replace('{n}', score);
      msgEl.style.color = 'var(--neon-green)';
      showAgain();
    } else if (paused) {
      msgEl.textContent = T('gs.ballpop.paused');
      msgEl.style.color = 'var(--neon-yellow)';
    }
  }

  function togglePause() {
    if (over || won) return;
    paused = !paused;
    if (paused && loopApi) loopApi.pause();
    else if (!paused && loopApi) loopApi.resume();
  }

  function fireAt(x, y) {
    if (over || won || paused || fire) return;
    fire = { x: shooter.x, y: shooter.y, ang: Math.atan2(y - shooter.y, x - shooter.x), spd: 8, color: current.color };
    if (Arcade.audio) Arcade.audio.play('coin');
  }

  /* ---------- 输入 ---------- */
  canvas.addEventListener('click', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    fireAt(x, y);
  });
  canvas.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    var r = canvas.getBoundingClientRect();
    var x = (t.clientX - r.left) * W / r.width, y = (t.clientY - r.top) * H / r.height;
    fireAt(x, y);
  });
  Arcade.input.onKeys({
    left: function () { shooter.ang -= 0.08; }, right: function () { shooter.ang += 0.08; },
    action: togglePause
  });
  // P 键暂停（与提示文案一致）
  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P') togglePause();
  });

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      diff = b.getAttribute('data-d');
      if (loopApi) loopApi.stop();
      newGame();
      loopApi = Arcade.loop.start(update, draw, 16);
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  window.GAME_RESTART = function () {
    if (loopApi) loopApi.stop();
    newGame();
    loopApi = Arcade.loop.start(update, draw, 16);
  };

  // 初始化
  newGame();
  loopApi = Arcade.loop.start(update, draw, 16);


})();
