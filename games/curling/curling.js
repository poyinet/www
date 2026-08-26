/* ============================================================
   冰壶 Curling · 物理瞄准策略旗舰（P2 品类旗舰）
   投壶滑行（摩擦减速）、撞击（动量交换）、刷冰（加速滑行）、
   中心圈得分。8 局对抗 AI（三难度），总分记分。
   记分：总分（max 模式）。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.curling.tut1t'), d: T('gs.curling.tut1') },
  { t: T('gs.curling.tut2t'), d: T('gs.curling.tut2') },
  { t: T('gs.curling.tut3t'), d: T('gs.curling.tut3') },
  { t: T('gs.curling.tut4t'), d: T('gs.curling.tut4') }
];

(function () {
  /* ==CURL-CORE-START== */
  var CRCORE = (function () {
    /* 滑行一步：摩擦减速，v 方向不变；角度约定 0=正上、顺时针（方向向量 (sin a, -cos a)） */
    function slide(s, friction, dt) {
      var v = Math.max(0, s.v - friction * dt);
      var a = s.a;
      return { x: s.x + Math.sin(a) * v * dt, y: s.y - Math.cos(a) * v * dt, v: v, a: a, me: s.me, moving: s.moving, swept: s.swept };
    }
    /* 撞击：a 撞 b，沿连心线交换速度分量（简化弹性，质量相等） */
    function collide(a, b) {
      var dx = b.x - a.x, dy = b.y - a.y;
      var d = Math.hypot(dx, dy);
      if (d < 1e-6) return;
      var nx = dx / d, ny = dy / d;
      var vax = Math.sin(a.a) * a.v, vay = -Math.cos(a.a) * a.v;
      var vbx = Math.sin(b.a) * b.v, vby = -Math.cos(b.a) * b.v;
      var van = vax * nx + vay * ny, vbn = vbx * nx + vby * ny;
      if (van - vbn <= 0) return; // 分离中不处理
      var va2n = vbn, vb2n = van; // 质量相等 → 法向速度互换
      var vax2 = vax + (va2n - van) * nx, vay2 = vay + (va2n - van) * ny;
      var vbx2 = vbx + (vb2n - vbn) * nx, vby2 = vby + (vb2n - vbn) * ny;
      a.v = Math.hypot(vax2, vay2); a.a = Math.atan2(vax2, -vay2);
      b.v = Math.hypot(vbx2, vby2); b.a = Math.atan2(vbx2, -vby2);
      // 位置分离
      var overlap = 15 - d;
      if (overlap > 0) {
        a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2; b.y += ny * overlap / 2;
      }
    }
    /* 一局得分：我方壶比对方最近壶更近圆心的数量 */
    function endScore(rocks, cx, cy, me) {
      var mine = [], theirs = [];
      rocks.forEach(function (r) {
        var d = Math.hypot(r.x - cx, r.y - cy);
        if (r.me === me) mine.push(d); else theirs.push(d);
      });
      if (!mine.length) return 0;
      mine.sort(function (a, b) { return a - b; });
      if (!theirs.length) return mine.length;
      theirs.sort(function (a, b) { return a - b; });
      var best = mine[0], theirBest = theirs[0];
      if (best >= theirBest) return 0;
      var n = 0;
      for (var i = 0; i < mine.length; i++) if (mine[i] < theirBest) n++;
      return n;
    }
    return { slide: slide, collide: collide, endScore: endScore };
  })();
  /* ==CURL-CORE-END== */

  var slide = CRCORE.slide, collide = CRCORE.collide, endScore = CRCORE.endScore;

  var root = document.getElementById('game-root');
  var W = 480, H = 320;
  var html =
    '<div class="crl-top">' +
    '  <span>' + T('gs.curling.hudScore').replace('{n}', '<b id="crl-end">1</b>').replace('{m}', '<b id="crl-mine">0</b>').replace('{t}', '<b id="crl-their">0</b>') + '</span>' +
    '  <span>' + T('gs.curling.hudTurn').replace('{n}', '<b id="crl-turn">' + T('gs.curling.you') + '</b>').replace('{m}', '<span id="crl-left">8</span>') + '</span>' +
    '</div>' +
    '<div class="mode-row" id="crl-diffs">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.curling.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.curling.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.curling.dHard') + '</button>' +
    '</div>' +
    '<div class="crl-stage"><canvas class="crl-canvas" id="crl-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '  <div class="crl-msg" id="crl-msg"></div></div>' +
    '<div class="crl-ctrl">' +
    '  <div class="crl-lbl">🎯 ' + T('gs.curling.angle') + ' <b id="crl-anglbl">90</b>° · ' + T('gs.curling.power') + ' <b id="crl-powlbl">50</b></div>' +
    '  <input type="range" id="crl-ang" class="crl-slider" min="0" max="180" value="90" aria-label="' + T('gs.curling.angle') + '">' +
    '  <input type="range" id="crl-pow" class="crl-slider" min="0" max="100" value="50" aria-label="' + T('gs.curling.power') + '">' +
    '  <div class="game-controls">' +
    '    <button class="btn green" id="crl-throw">🥌 ' + T('gs.curling.throw') + '</button>' +
    '    <button class="btn cyan" id="crl-sweep">🧹 ' + T('gs.curling.sweep').replace('{n}', '<span id="crl-sweepn">3</span>') + '</button>' +
    '  </div>' +
    '</div>';
  root.innerHTML = html;

  var canvas = document.getElementById('crl-canvas');
  var ctx = canvas.getContext('2d');
  var angEl = document.getElementById('crl-ang'), powEl = document.getElementById('crl-pow'),
      angLbl = document.getElementById('crl-anglbl'), powLbl = document.getElementById('crl-powlbl'),
      throwBtn = document.getElementById('crl-throw'), sweepBtn = document.getElementById('crl-sweep'),
      sweepN = document.getElementById('crl-sweepn'), msgEl = document.getElementById('crl-msg'),
      endEl = document.getElementById('crl-end'), scoreElM = document.getElementById('crl-mine'),
      scoreElT = document.getElementById('crl-their'), turnEl = document.getElementById('crl-turn'),
      leftEl = document.getElementById('crl-left'), diffRow = document.getElementById('crl-diffs');

  var DIFFS = {
    easy: { aimJitter: 0.12, powJitter: 0.15, sweep: 3 },
    normal: { aimJitter: 0.06, powJitter: 0.09, sweep: 3 },
    hard: { aimJitter: 0.02, powJitter: 0.04, sweep: 3 }
  };
  var diff = 'normal';
  var D = DIFFS[diff];
  var CX = W / 2, CY = H / 2, ROCK_R = 12, FRICTION = 0.35;
  var sweep = 3, throwing = false, rock = null, rocks = [], turn = 'me', rocksLeft = 8;
  var end = 1, scoreMine = 0, scoreTheir = 0, over = false, sweepActive = false, sweepT = 0;
  var loopApi = null, fricMult = 1, aiTimer = null;
  var paused = false;

  function newGame() {
    D = DIFFS[diff];
    rocks = []; end = 1; scoreMine = 0; scoreTheir = 0; over = false;
    startEnd();
  }
  function startEnd() {
    rocks = [];
    turn = 'me';
    rocksLeft = 8;
    sweep = D.sweep;
    rock = null;
    throwing = false;
    sweepN.textContent = sweep;
    leftEl.textContent = rocksLeft;
    turnEl.textContent = T('gs.curling.you');
    msgEl.textContent = '';
    msgEl.style.color = '';
  }

  /* ---------- AI ---------- */
  function aiThrow() {
    // 简化 AI：瞄准中心 + 随机抖动；若对方圈内壶多则撞击
    var target = { x: CX, y: CY };
    if (Math.random() < (D.aimJitter < 0.04 ? 0.5 : 0.3)) {
      // 撞击：找对方壶附近
      var t2 = rocks.filter(function (r) { return !r.me && Math.hypot(r.x - CX, r.y - CY) < 60; });
      if (t2.length) target = { x: t2[0].x, y: t2[0].y };
    }
    // 角度约定 0=正上（从底部投壶点出发指向目标）
    var ang = Math.atan2(target.x - W / 2, -(target.y - (H - 24))) + (Math.random() - 0.5) * 2 * D.aimJitter * 3;
    var dist = Math.hypot(target.x - W / 2, target.y - (H - 24));
    var pow = Math.min(1, Math.max(0.2, dist / 300 + (Math.random() - 0.5) * D.powJitter));
    launch(ang, pow, false);
  }
  function launch(ang, pow, isMe) {
    var v = pow * 14;
    rock = { x: W / 2, y: H - 24, v: v, a: ang, me: isMe, moving: true, swept: 0 };
    throwing = true;
  }

  /* ---------- 更新 ---------- */
  function update() {
    if (paused) return;
    if (over || !throwing) return;
    var moving = false;
    // 刷冰
    if (sweepActive && rock && rock.moving) {
      rock.swept++;
      if (sweepT-- <= 0) sweepActive = false;
    }
    fricMult = sweepActive ? 0.55 : 1;
    if (rock) {
      rock = slide(rock, FRICTION * fricMult, 1);
      // 边界反弹（角度约定 0=正上：x 反弹 a→-a，y 反弹 a→π-a）
      if (rock.x < ROCK_R) { rock.x = ROCK_R; rock.a = -rock.a; }
      if (rock.x > W - ROCK_R) { rock.x = W - ROCK_R; rock.a = -rock.a; }
      if (rock.y < ROCK_R) { rock.y = ROCK_R; rock.a = Math.PI - rock.a; }
      if (rock.y > H - ROCK_R) { rock.y = H - ROCK_R; rock.a = Math.PI - rock.a; }
      // 与场上壶撞击
      rocks.forEach(function (r) {
        if (Math.hypot(r.x - rock.x, r.y - rock.y) < ROCK_R * 2) collide(rock, r);
      });
      if (rock.v > 0.05) moving = true;
    }
    if (!moving && rock) {
      rocks.push({ x: rock.x, y: rock.y, me: rock.me, moving: false });
      rock = null;
      throwing = false;
      sweepActive = false;
      sweepT = 0;
      if (turn === 'me') {
        sweepN.textContent = sweep;
        rocksLeft--;
        leftEl.textContent = rocksLeft;
        if (rocksLeft > 0) { turn = 'their'; turnEl.textContent = T('gs.curling.ai'); aiTimer = setTimeout(aiThrow, 600); }
        else endEnd();
      } else {
        rocksLeft--;
        leftEl.textContent = rocksLeft;
        if (rocksLeft > 0) { turn = 'me'; turnEl.textContent = T('gs.curling.you'); }
        else endEnd();
      }
    }
  }

  function endEnd() {
    var s = endScore(rocks, CX, CY, true);
    var t = endScore(rocks, CX, CY, false);
    scoreMine += s;
    scoreTheir += t;
    if (end < 8) {
      end++;
      endEl.textContent = end;
      startEnd();
      msgEl.textContent = T('gs.curling.endMsg').replace('{n}', s);
      msgEl.style.color = 'var(--neon-yellow)';
    } else {
      over = true;
      msgEl.textContent = scoreMine > scoreTheir ? T('gs.curling.win').replace('{n}', scoreMine).replace('{m}', scoreTheir) : (scoreMine < scoreTheir ? T('gs.curling.lose').replace('{n}', scoreTheir).replace('{m}', scoreMine) : T('gs.curling.draw'));
      msgEl.style.color = scoreMine >= scoreTheir ? 'var(--neon-green)' : 'var(--neon-pink)';
      if (scoreMine > scoreTheir && Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(scoreMine * 10);
    }
    scoreElM.textContent = scoreMine;
    scoreElT.textContent = scoreTheir;
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    ctx.fillStyle = '#0d1a2e'; ctx.fillRect(0, 0, W, H);
    // 冰面圈
    for (var i = 3; i >= 1; i--) {
      ctx.strokeStyle = 'rgba(0,240,255,' + (0.5 - i * 0.12) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(CX, CY, 30 * i, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,230,0,0.5)';
    ctx.beginPath(); ctx.arc(CX, CY, 4, 0, Math.PI * 2); ctx.fill();
    // 壶
    rocks.forEach(function (r) {
      ctx.fillStyle = r.me ? '#ff2d95' : '#00f0ff';
      ctx.beginPath(); ctx.arc(r.x, r.y, ROCK_R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0a18';
      ctx.beginPath(); ctx.arc(r.x, r.y, ROCK_R / 2, 0, Math.PI * 2); ctx.fill();
    });
    if (rock) {
      ctx.fillStyle = rock.me ? '#ff2d95' : '#00f0ff';
      ctx.beginPath(); ctx.arc(rock.x, rock.y, ROCK_R, 0, Math.PI * 2); ctx.fill();
    }
    // 投壶预览（角度 0=正上，方向向量 (sin a, -cos a)）
    if (turn === 'me' && !throwing) {
      var ang = (parseInt(angEl.value, 10)) * Math.PI / 180;
      var pow = (parseInt(powEl.value, 10)) / 100;
      ctx.strokeStyle = 'rgba(255,45,149,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, H - 24);
      ctx.lineTo(W / 2 + Math.sin(ang) * pow * 160, H - 24 - Math.cos(ang) * pow * 160);
      ctx.stroke();
    }
  }

  /* ---------- 输入 ---------- */
  angEl.addEventListener('input', function () { angLbl.textContent = angEl.value + '°'; });
  powEl.addEventListener('input', function () { powLbl.textContent = powEl.value; });
  throwBtn.addEventListener('click', function () {
    if (over || throwing || turn !== 'me' || paused) return;
    var ang = (parseInt(angEl.value, 10)) * Math.PI / 180;
    var pow = (parseInt(powEl.value, 10)) / 100;
    launch(ang, pow, true);
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  sweepBtn.addEventListener('click', function () {
    if (over || !throwing || sweep <= 0 || !rock || turn !== 'me' || paused) return;
    sweep--;
    sweepN.textContent = sweep;
    sweepActive = true;
    sweepT = 90;
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      diff = b.getAttribute('data-d');
      paused = false;
      if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
      if (loopApi) loopApi.stop();
      newGame();
      loopApi = Arcade.loop.start(update, draw, 16);
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  /* P 键暂停/继续（实时类统一约定） */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P') {
      if (over) return;
      paused = !paused;
      if (paused) {
        if (loopApi) loopApi.pause();
        msgEl.textContent = T('gs.curling.paused');
        msgEl.style.color = 'var(--neon-yellow)';
      } else {
        if (loopApi) loopApi.resume();
        msgEl.textContent = '';
        msgEl.style.color = '';
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    }
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.curling.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    paused = false;
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
    if (loopApi) loopApi.stop();
    newGame();
    loopApi = Arcade.loop.start(update, draw, 16);
  };

  // 初始化
  newGame();
  loopApi = Arcade.loop.start(update, draw, 16);


})();
