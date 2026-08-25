/* ============================================================
   铁壁防线 · 守卫密码局（情报基地）
   敌军坦克进攻密码局情报部——驾驶守卫坦克，多波次清剿。
   格子地图程序生成（砖/钢墙 + 基地防御）+ 敌坦 AI 寻路追击 +
   子弹物理（砖消/钢挡/强化穿透）+ 道具（火力/护盾/冻结/加固）+ 波次难度。
   核心逻辑用 ==TANK-CORE-START== / ==TANK-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==TANK-CORE-START== */
  var T_GRID = 13; // 13×13 格
  var T_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 上右下左
  var T_DIFF = [
    { waves: 4, perWave: 3, enemyHp: 1, enemySpeed: 0.9, shootP: 0.02, items: 3 },
    { waves: 6, perWave: 4, enemyHp: 1, enemySpeed: 1.1, shootP: 0.03, items: 4 },
    { waves: 8, perWave: 5, enemyHp: 2, enemySpeed: 1.3, shootP: 0.04, items: 5 }
  ];

  function T_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /** 地图生成：13×13；'B' 砖 'S' 钢 ' ' 空；基地在 (6,12)（玩家出生 (6,12) 上方区域）
      返回 grid 字符数组 */
  function T_genMap(seed) {
    var rnd = T_mulberry32(seed || (Date.now() % 2147483647));
    var g = [];
    for (var r = 0; r < T_GRID; r++) {
      var row = [];
      for (var c = 0; c < T_GRID; c++) row.push(' ');
      g.push(row);
    }
    // 基地（底部中央，占用 (5..7, 12)）
    g[12][5] = 'B'; g[12][6] = 'B'; g[12][7] = 'B';
    // 基地上围（钢顶）
    g[11][5] = 'S'; g[11][6] = 'B'; g[11][7] = 'S';
    // 随机砖墙块（避开基地区与出生点）
    var blocks = 12;
    function safeSpot(r, c) {
      if (r >= 10 && c >= 4 && c <= 8) return false; // 基地保护带（含玩家出生格 (10,6)）
      if (r === 9 && c === 6) return false; // 出生头顶
      if (r >= 11) return false;
      if (r <= 1 || c <= 1 || c >= T_GRID - 2) return false; // 边缘留通道
      return true;
    }
    var guard = 0;
    var placed = 0;
    while (placed < blocks && guard++ < 300) {
      var r = Math.floor(rnd() * T_GRID);
      var c = Math.floor(rnd() * T_GRID);
      var horiz = rnd() < 0.5;
      var ok = false;
      if (horiz) { if (c + 1 < T_GRID && safeSpot(r, c) && safeSpot(r, c + 1)) ok = true; }
      else { if (r + 1 < T_GRID && safeSpot(r, c) && safeSpot(r + 1, c)) ok = true; }
      if (!ok) continue;
      g[r][c] = 'B';
      if (horiz) g[r][c + 1] = 'B'; else g[r + 1][c] = 'B';
      placed++;
    }
    // 少量钢墙点缀
    var steel = 3;
    guard = 0;
    var sp = 0;
    while (sp < steel && guard++ < 200) {
      var r2 = Math.floor(rnd() * (T_GRID - 4)) + 2;
      var c2 = Math.floor(rnd() * (T_GRID - 4)) + 2;
      if (g[r2][c2] === ' ') { g[r2][c2] = 'S'; sp++; }
    }
    return g;
  }

  /** 格可通行（坦克）：空且非基地格 */
  function T_passable(grid, r, c) {
    if (r < 0 || c < 0 || r >= T_GRID || c >= T_GRID) return false;
    if (r === 12 && c >= 5 && c <= 7) return false; // 基地区不可进入
    return grid[r][c] === ' ';
  }

  /** 子弹碰撞判定：返回 { hit: 'tank'|'brick'|'steel'|'base'|'none', x, y, grid 变化 }
      power 1=单发 2=穿透（穿砖继续） */
  function T_bulletStep(grid, bx, by, dir, power, tanks, baseAlive) {
    var gx = Math.floor(bx / 32), gy = Math.floor(by / 32);
    // 基地
    if (gx >= 5 && gx <= 7 && gy === 12) return { hit: 'base' };
    var ch = grid[gy] && grid[gy][gx];
    if (ch === 'S') return { hit: 'steel' };
    if (ch === 'B') {
      if (power >= 2) {
        grid[gy][gx] = ' ';
        return { hit: 'brick', pass: true };
      }
      grid[gy][gx] = ' ';
      return { hit: 'brick' };
    }
    // 坦克（敌我均可被击中；自己子弹不伤自己由调用方控制；已阵亡不吞子弹）
    for (var i = 0; i < tanks.length; i++) {
      var t = tanks[i];
      if (!t.alive) continue;
      var tgx = (t.gx !== undefined ? t.gx : Math.floor(t.x / 32));
      var tgy = (t.gy !== undefined ? t.gy : Math.floor(t.y / 32));
      if (tgx === gx && tgy === gy) return { hit: 'tank', idx: i };
    }
    return { hit: 'none' };
  }

  /** 波次生成：返回敌坦克数组（出生点 3 个随机选；带格坐标供平滑移动） */
  function T_spawnWave(wave, conf, rnd) {
    var n = conf.perWave;
    var spots = [[0, 0], [6, 0], [12, 0]];
    var tanks = [];
    for (var i = 0; i < n; i++) {
      var s = spots[Math.floor(rnd() * spots.length)];
      tanks.push({
        x: s[0] * 32, y: s[1] * 32, gx: s[0], gy: s[1], dir: 2, moving: false,
        hp: conf.enemyHp, speed: conf.enemySpeed, kind: 'enemy',
        shootCd: Math.floor(rnd() * 60), alive: true
      });
    }
    return tanks;
  }

  /** 玩家出生（基地上方） */
  function T_playerSpawn() {
    return { x: 6 * 32, y: 10 * 32, gx: 6, gy: 10, dir: 0, hp: 3, speed: 1.8, moving: false, kind: 'player', alive: true, power: 1, shield: 0 };
  }

  /** 道具生成：空地随机 */
  function T_genItem(grid, rnd) {
    var types = ['⭐', '🛡', '⏲', '🔧'];
    for (var tries = 0; tries < 40; tries++) {
      var r = Math.floor(rnd() * (T_GRID - 2)) + 1;
      var c = Math.floor(rnd() * (T_GRID - 2)) + 1;
      if (grid[r][c] === ' ') {
        return { x: c * 32, y: r * 32, type: types[Math.floor(rnd() * types.length)], alive: true };
      }
    }
    return null;
  }

  /** 敌坦 AI 一步：返回动作 { moveDir, shoot } */
  function T_enemyAI(t, player, rnd, conf) {
    var act = { moveDir: null, shoot: false };
    // 周期性朝玩家转向（概率）
    if (rnd() < 0.12) {
      // 朝玩家的大致方向
      var dx = player.x - t.x, dy = player.y - t.y;
      var d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
      if (t.dir === d) act.shoot = true;
      else act.moveDir = d;
      return act;
    }
    if (rnd() < conf.shootP) act.shoot = true;
    // 撞墙转向
    if (t.moving) return act;
    act.moveDir = t.dir;
    return act;
  }

  /** 格级移动判定：tank 从 (gx,gy) 向 dir 走一格是否可通行（self 排除自身；已阵亡跳过） */
  function T_canStep(grid, gx, gy, dir, tanks, self) {
    var nx = gx + T_DIRS[dir][0], ny = gy + T_DIRS[dir][1];
    if (!T_passable(grid, ny, nx)) return false;
    for (var i = 0; i < tanks.length; i++) {
      var o = tanks[i];
      if (o === self || !o.alive) continue;
      var ogx = (o.gx !== undefined ? o.gx : Math.floor(o.x / 32));
      var ogy = (o.gy !== undefined ? o.gy : Math.floor(o.y / 32));
      if (ogx === nx && ogy === ny) return false;
    }
    return true;
  }
  /* ==TANK-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var CELL = 32, MAP_PX = T_GRID * CELL;
  var DIFF_INFO = [
    { t: T('gt.easy'), d: T('gt.dEasy') },
    { t: T('gt.normal'), d: T('gt.dNormal') },
    { t: T('gt.hard'), d: T('gt.dHard') }
  ];

  root.innerHTML =
    '<div class="tk-wrap">' +
    '  <div class="tk-pick hidden" id="tk-pick">' +
    '    <div class="tk-pick-t">' + T('gt.pickT') + '</div>' +
    '    <div class="tk-pick-d">' + T('gt.pickD') + '</div>' +
    '    <div class="tk-pick-btns">' +
    DIFF_INFO.map(function (d, i) {
      return '<button class="btn mode-btn" data-i="' + i + '">' + d.t + '<small>' + d.d + '</small></button>';
    }).join('') +
    '    </div>' +
    '  </div>' +
    '  <div id="tk-game" style="display:none">' +
    '    <div class="tk-info"><span id="tk-lev"></span><span id="tk-hud"></span></div>' +
    '    <canvas id="tk-cv" width="' + MAP_PX + '" height="' + MAP_PX + '"></canvas>' +
    '    <div class="tk-controls">' +
    '      <div class="tk-dpad">' +
    '        <button class="btn tk-dir" data-d="0">▲</button>' +
    '        <div class="tk-dmid">' +
    '          <button class="btn tk-dir" data-d="3">◀</button>' +
    '          <button class="btn tk-dir" data-d="1">▶</button>' +
    '        </div>' +
    '        <button class="btn tk-dir" data-d="2">▼</button>' +
    '      </div>' +
    '      <button class="btn tk-fire">' + T('gt.fire') + '</button>' +
    '    </div>' +
    '    <div class="tk-msg" id="tk-msg"></div>' +
    '  </div>' +
    '  <div class="tk-overlay hidden" id="tk-overlay">' +
    '    <h2 id="tk-ov-title"></h2>' +
    '    <p id="tk-ov-text"></p>' +
    '    <button class="btn" id="tk-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var pickEl = document.getElementById('tk-pick');
  var gameEl = document.getElementById('tk-game');
  var levEl = document.getElementById('tk-lev');
  var hudEl = document.getElementById('tk-hud');
  var msgEl = document.getElementById('tk-msg');
  var overlayEl = document.getElementById('tk-overlay');
  var ovTitle = document.getElementById('tk-ov-title');
  var ovText = document.getElementById('tk-ov-text');
  var ovBtn = document.getElementById('tk-ov-btn');
  var canvas = document.getElementById('tk-cv');
  var ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  var state = null;
  var loopApi = null;
  var paused = false;

  function startGame(diffIdx) {
    var conf = T_DIFF[diffIdx];
    paused = false;
    overlayEl.classList.add('hidden');
    state = {
      diff: diffIdx, conf: conf, grid: T_genMap(), player: T_playerSpawn(),
      enemies: [], bullets: [], items: [], wave: 1, score: 0,
      kills: 0, baseAlive: true, over: false, won: false, lives: 3,
      fireCd: 0, enemyFreeze: 0, spawnTimer: 20
    };
    pickEl.classList.add('hidden');
    gameEl.style.display = '';
    levEl.textContent = DIFF_INFO[diffIdx].t + ' · ' + T('gt.waveFmt').replace('{w}', conf.waves).replace('{e}', conf.perWave);
    if (!loopApi) loopApi = Arcade.loop.start(update, draw, 16);
    else { loopApi.stop(); loopApi = Arcade.loop.start(update, draw, 16); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ---------- 输入 ---------- */
  function setDir(d) {
    if (d === null) return;
    var t = state.player;
    if (t.dir !== d && t.targetGx !== undefined) {
      // 移动中转向：先对齐到当前格中心再换方向（红白机格点转向）
      t.x = t.gx * 32; t.y = t.gy * 32;
      t.targetGx = undefined; t.targetGy = undefined;
    }
    t.dir = d;
    t.moving = true;
  }
  document.addEventListener('keydown', function (e) {
    if (!state || state.over || paused) return;
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') setDir(0);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') setDir(1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') setDir(2);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') setDir(3);
    else if (k === ' ') { e.preventDefault(); fire(); }
  });
  document.addEventListener('keyup', function (e) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'ArrowDown' || k === 's' || k === 'S' || k === 'ArrowLeft' || k === 'a' || k === 'A') {
      var t = state && state.player;
      if (t) t.moving = false;
    }
  });
  var dirBtns = root.querySelectorAll('.tk-dir');
  for (var bi = 0; bi < dirBtns.length; bi++) {
    (function (b) {
      var d = parseInt(b.dataset.d, 10);
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); setDir(d); });
      b.addEventListener('pointerup', function () { if (state) state.player.moving = false; });
      b.addEventListener('pointerleave', function () { if (state) state.player.moving = false; });
    })(dirBtns[bi]);
  }
  root.querySelector('.tk-fire').addEventListener('click', function () { fire(); });

  /* P 键暂停（实时类统一约定） */
  document.addEventListener('keydown', function (e) {
    if (!state || state.over) return;
    if (e.key === 'p' || e.key === 'P') {
      paused = !paused;
      if (paused) {
        if (loopApi) loopApi.pause();
        msgEl.textContent = T('gt.pause');
        msgEl.style.color = 'var(--neon-yellow)';
      } else {
        if (loopApi) loopApi.resume();
        msgEl.textContent = '';
        msgEl.style.color = '';
      }
      if (Arcade.audio) Arcade.audio.play('ui');
    }
  });

  /* ---------- 逻辑 ---------- */
  function fire() {
    if (!state || state.over || !state.player.alive || paused) return;
    if (state.fireCd > 0) return;
    state.fireCd = 14;
    var t = state.player;
    state.bullets.push({ x: t.x + 16, y: t.y + 16, dir: t.dir, speed: 7, power: t.power, from: 'player' });
    if (Arcade.audio) Arcade.audio.play('coin');
  }

  /* 平滑格级移动：tank 向目标格插值前进；到达后若仍在移动则尝试下一格 */
  function moveTank(t) {
    if (!t.moving || t.locked) return;
    var others = state.enemies.filter(function (e) { return e.alive && e !== t; });
    // 无目标格：尝试向当前方向走一格
    if (t.targetGx === undefined) {
      if (!T_canStep(state.grid, t.gx, t.gy, t.dir, others, t)) { t.moving = false; return; }
      t.targetGx = t.gx + T_DIRS[t.dir][0];
      t.targetGy = t.gy + T_DIRS[t.dir][1];
    }
    // 插值前进
    var tx = t.targetGx * 32, ty = t.targetGy * 32;
    var dx = tx - t.x, dy = ty - t.y;
    var dist = Math.hypot(dx, dy);
    var step = Math.min(dist, t.speed);
    if (dist > 0) { t.x += dx / dist * step; t.y += dy / dist * step; }
    if (t.x === tx && t.y === ty) {
      // 到达目标格：提交格坐标，若仍要移动下一帧继续
      t.gx = t.targetGx; t.gy = t.targetGy;
      t.targetGx = undefined; t.targetGy = undefined;
    }
  }

  function spawnEnemies() {
    var rnd = T_mulberry32(Date.now() % 2147483647);
    var list = T_spawnWave(state.wave, state.conf, rnd);
    state.enemies = state.enemies.concat(list);
  }

  function update() {
    if (!state || state.over) return;
    if (paused) return;
    var st = state;
    if (st.spawnTimer > 0) {
      st.spawnTimer--;
      if (st.spawnTimer === 0) spawnEnemies();
    }
    if (st.fireCd > 0) st.fireCd--;
    if (st.enemyFreeze > 0) st.enemyFreeze--;
    if (st.player.shield > 0) st.player.shield--;
    // 玩家移动
    moveTank(st.player);
    // 玩家射击（按住空格连发由 fire 按钮/键触发）
    // 敌坦 AI
    if (st.enemyFreeze <= 0) {
      var rnd2 = T_mulberry32(Date.now() % 2147483647);
      st.enemies.forEach(function (e) {
        if (!e.alive) return;
        e.shootCd = (e.shootCd || 0) - 1;
        if (e.locked) return;
        if (e.stepTimer === undefined || e.stepTimer-- <= 0) {
          e.stepTimer = 18;
          var a = T_enemyAI(e, st.player, rnd2, st.conf);
          if (a.moveDir !== null) { e.dir = a.moveDir; e.moving = true; }
          if (a.shoot && e.shootCd <= 0) {
            e.shootCd = 40;
            st.bullets.push({ x: e.x + 16, y: e.y + 16, dir: e.dir, speed: 5.5, power: 1, from: 'enemy' });
          }
        }
        moveTank(e);
      });
    }
    // 子弹
    var newBullets = [];
    for (var i = 0; i < st.bullets.length; i++) {
      var b = st.bullets[i];
      b.x += T_DIRS[b.dir][0] * b.speed;
      b.y += T_DIRS[b.dir][1] * b.speed;
      if (b.x < 0 || b.y < 0 || b.x >= MAP_PX || b.y >= MAP_PX) continue;
      var coll = T_bulletStep(st.grid, b.x, b.y, b.dir, b.power,
        b.from === 'player' ? st.enemies : [st.player], st.baseAlive);
      if (coll.hit === 'brick') {
        if (b.from === 'player') st.score += 10;
        if (!coll.pass) continue;
      }
      if (coll.hit === 'steel') { if (b.from === 'player') st.score += 5; continue; }
      if (coll.hit === 'base') { baseDestroyed(); continue; }
      if (coll.hit === 'tank') {
        if (b.from === 'enemy') {
          // 敌弹命中玩家（T_bulletStep 传入 [st.player]）
          if (st.player.shield <= 0) playerDestroyed();
        } else {
          var e2 = st.enemies[coll.idx];
          if (e2 && e2.alive) {
            e2.hp = (e2.hp || 1) - 1;
            if (e2.hp <= 0) {
              e2.alive = false;
              st.kills++;
              st.score += 50;
            }
          }
        }
        continue;
      }
      newBullets.push(b);
    }
    st.bullets = newBullets;
    // 道具拾取
    for (var k = 0; k < st.items.length; k++) {
      var it = st.items[k];
      if (!it.alive) continue;
      if (st.player.gx === Math.floor(it.x / 32) && st.player.gy === Math.floor(it.y / 32)) {
        it.alive = false;
        applyItem(it);
      }
    }
    // 波次推进
    if (st.wave <= st.conf.waves && st.enemies.length && st.enemies.every(function (e) { return !e.alive; })) {
      st.enemies = [];
      st.wave++;
      if (st.wave > st.conf.waves) {
        victory();
        return;
      }
      st.spawnTimer = 30;
      // 波次奖励 + 道具
      st.score += 100;
      if (st.items.filter(function (x) { return x.alive; }).length < st.conf.items) {
        var rnd3 = T_mulberry32(Date.now() % 2147483647);
        var it2 = T_genItem(st.grid, rnd3);
        if (it2) st.items.push(it2);
      }
      if (Arcade.ui) Arcade.ui.toast(T('gt.waveIncoming').replace('{n}', st.wave), 'warn');
    }
    // HUD
    hudEl.textContent = T('gt.wave') + ' ' + st.wave + '/' + st.conf.waves + ' · ' + T('gt.enemyLeft') + ' ' + st.enemies.filter(function (e) { return e.alive; }).length + ' · ' + T('gt.lives') + ' ' + st.lives + ' · ' + st.score + ' ' + T('gt.score');
  }

  function applyItem(it) {
    var st = state;
    if (it.type === '⭐') { st.player.power = 2; msgEl.textContent = T('gt.itemStar'); }
    else if (it.type === '🛡') { st.player.shield = 180; msgEl.textContent = T('gt.itemShield'); }
    else if (it.type === '⏲') { st.enemyFreeze = 180; msgEl.textContent = T('gt.itemFreeze'); }
    else if (it.type === '🔧') {
      // 加固基地
      for (var r = 10; r <= 12; r++) for (var c = 5; c <= 7; c++) st.grid[r][c] = (r === 11 && (c === 5 || c === 7)) ? 'S' : 'B';
      msgEl.textContent = T('gt.itemRepair');
    }
    st.score += 30;
    if (Arcade.audio) Arcade.audio.play('win');
  }

  function baseDestroyed() {
    var st = state;
    st.baseAlive = false;
    st.over = true;
    endGame(false);
  }
  function playerDestroyed() {
    var st = state;
    st.lives--;
    if (st.lives > 0) {
      st.player = T_playerSpawn();
      st.player.shield = 120;
      if (Arcade.ui) Arcade.ui.toast(T('gt.reborn').replace('{n}', st.lives), 'warn');
    } else {
      st.over = true;
      endGame(false);
    }
  }
  function victory() {
    var st = state;
    st.over = true; st.won = true;
    endGame(true);
  }

  function endGame(win) {
    var st = state;
    if (win) {
      ovTitle.textContent = T('gt.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gt.winD').replace('{w}', st.conf.waves).replace('{k}', st.kills).replace('{s}', st.score);
    } else {
      ovTitle.textContent = st.baseAlive ? T('gt.loseAll') : T('gt.loseBase');
      ovTitle.className = '';
      ovText.innerHTML = st.baseAlive
        ? T('gt.loseAllD').replace('{s}', st.score)
        : T('gt.loseBaseD').replace('{s}', st.score);
    }
    ovBtn.textContent = T('gt.again');
    ovBtn.onclick = function () {
      overlayEl.classList.add('hidden');
      pickEl.classList.remove('hidden');
      gameEl.style.display = 'none';
    };
    overlayEl.classList.remove('hidden');
    // 胜负均提交成绩（修复：此前败北不记分，与站内「结算即提交」模式不一致）
    if (Arcade.shell) Arcade.shell.submitScore(st.score);
    if (win) { if (Arcade.juice) Arcade.juice.win(); } else { if (Arcade.juice) Arcade.juice.lose(); }
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    if (!state) return;
    var st = state;
    ctx.clearRect(0, 0, MAP_PX, MAP_PX);
    ctx.fillStyle = '#0b0e16';
    ctx.fillRect(0, 0, MAP_PX, MAP_PX);
    // 地图
    for (var r = 0; r < T_GRID; r++) {
      for (var c = 0; c < T_GRID; c++) {
        var ch = st.grid[r][c];
        if (ch === 'B') { ctx.fillStyle = '#b4642a'; ctx.fillRect(c * 32, r * 32, 32, 32); ctx.fillStyle = '#7a3d16'; ctx.fillRect(c * 32 + 4, r * 32 + 4, 12, 12); ctx.fillRect(c * 32 + 16, r * 32 + 16, 12, 12); }
        else if (ch === 'S') { ctx.fillStyle = '#d8e4f0'; ctx.fillRect(c * 32, r * 32, 32, 32); ctx.fillStyle = '#8fa3ba'; ctx.fillRect(c * 32 + 4, r * 32 + 4, 24, 24); }
      }
    }
    // 基地
    if (st.baseAlive) {
      ctx.fillStyle = '#ff2d95';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(T('gs.tank.hq'), 6 * 32 + 16, 12 * 32 + 24);
    } else {
      ctx.fillStyle = '#444';
      ctx.fillRect(5 * 32, 12 * 32, 3 * 32, 32);
    }
    // 道具
    st.items.forEach(function (it) {
      if (!it.alive) return;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.type, it.x + 16, it.y + 24);
    });
    // 坦克
    drawTank(st.player, '#00f0ff', st.player.shield > 0);
    st.enemies.forEach(function (e) { if (e.alive) drawTank(e, '#ff2d95', false); });
    // 子弹
    st.bullets.forEach(function (b) {
      ctx.fillStyle = b.from === 'player' ? '#ffe600' : '#ff9a3c';
      ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
    });
  }
  function drawTank(t, color, shielded) {
    ctx.save();
    ctx.translate(t.x + 16, t.y + 16);
    ctx.rotate(t.dir * Math.PI / 2);
    ctx.fillStyle = color;
    ctx.fillRect(-12, -10, 24, 20); // 车体
    ctx.fillRect(-4, -18, 8, 10);   // 炮管
    ctx.fillStyle = shielded ? 'rgba(255,230,0,0.35)' : 'rgba(255,255,255,0.12)';
    ctx.fillRect(-14, -12, 28, 24);
    ctx.restore();
  }

  /* ---------- 启动 ---------- */
  var pickBtns = pickEl.querySelectorAll('button[data-i]');
  for (var i = 0; i < pickBtns.length; i++) {
    pickBtns[i].addEventListener('click', function () {
      startGame(parseInt(this.dataset.i, 10));
    });
  }

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.tank.helpText');
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
    { t: T('gt.tut1t'), d: T('gt.tut1') },
    { t: T('gt.tut2t'), d: T('gt.tut2') },
    { t: T('gt.tut3t'), d: T('gt.tut3') },
    { t: T('gt.tut4t'), d: T('gt.tut4') }
  ];

})();
