/* ============================================================
   地牢探险 Dungeon · Roguelike 回合制（旗舰级）
   随机生成 5 层地牢（房间+走廊）· 迷雾视野 · 回合制战斗
   敌人追击 AI · 药水/金币/武器 · 楼梯下行 · 第 5 层 Boss
   记分：击杀/金币/层数加分，死亡或通关结算（max 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.dungeon.tut1t'), d: T('gs.dungeon.tut1') },
  { t: T('gs.dungeon.tut2t'), d: T('gs.dungeon.tut2') },
  { t: T('gs.dungeon.tut3t'), d: T('gs.dungeon.tut3') }
];

(function () {
  /* ---------- 配置 ---------- */
  var COLS = 23, ROWS = 15, FOV = 6;
  var MAX_LAYER = 5;
  var PLAYER_HP = 30, PLAYER_ATK = 3, PLAYER_DEF = 0;
  var WALL = 0, FLOOR = 1, STAIR = 2;
  var ITEM_POTION = 0, ITEM_COIN = 1, ITEM_SWORD = 2, ITEM_ARMOR = 3;

  var canvas = document.createElement('canvas');
  canvas.className = 'dg-canvas';
  canvas.width = 460; canvas.height = 300;
  canvas.setAttribute('aria-label', T('gs.dungeon.aria'));

  var stage = document.createElement('div');
  stage.className = 'dg-stage';

  var top = document.createElement('div');
  top.className = 'dg-top';
  top.innerHTML =
    '<span>❤️ <span class="hp" id="dg-hp">30</span></span>' +
    '<span>' + T('gs.dungeon.layer') + ' <span class="lv" id="dg-layer">1</span>/' + MAX_LAYER + '</span>' +
    '<span>⚔️ <span class="atk" id="dg-atk">3</span></span>' +
    '<span>🛡️ <span class="atk" id="dg-def">0</span></span>' +
    '<span>💰 <span class="atk" id="dg-score">0</span></span>';

  var msg = document.createElement('div');
  msg.className = 'dg-msg';
  msg.setAttribute('aria-live', 'polite');

  var leg = document.createElement('div');
  leg.className = 'dg-leg';
  leg.innerHTML =
    '<span><i class="dg-dot" style="background:#00f0ff"></i>' + T('gs.dungeon.you') + '</span>' +
    '<span><i class="dg-dot" style="background:#ff2d95"></i>' + T('gs.dungeon.enemy') + '</span>' +
    '<span><i class="dg-dot" style="background:#39ff14"></i>' + T('gs.dungeon.potion') + '</span>' +
    '<span><i class="dg-dot" style="background:#ffe600"></i>' + T('gs.dungeon.coin') + '</span>' +
    '<span><i class="dg-dot" style="background:#b967ff"></i>' + T('gs.dungeon.sword') + '</span>' +
    '<span><i class="dg-dot" style="background:#9ad1ff"></i>' + T('gs.dungeon.armor') + '</span>' +
    '<span><i class="dg-dot" style="background:#39ff14;border-radius:2px"></i>' + T('gs.dungeon.stair') + '</span>';

  var overlay = document.createElement('div');
  overlay.className = 'dg-overlay hidden';
  overlay.innerHTML =
    '<div class="dg-ov-title" id="dg-ov-title">' + T('gs.dungeon.title') + '</div>' +
    '<div class="dg-ov-sub" id="dg-ov-sub"></div>' +
    '<div class="game-controls"><button class="btn green" id="dg-start">' + T('gs.dungeon.go') + '</button></div>';

  stage.appendChild(canvas);
  stage.appendChild(overlay);

  var root = document.getElementById('game-root');
  root.appendChild(top);
  root.appendChild(msg);
  root.appendChild(stage);
  root.appendChild(leg);
  root.appendChild(document.createElement('div')).id = 'dg-dpad';

  var ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var hpEl = document.getElementById('dg-hp');
  var layerEl = document.getElementById('dg-layer');
  var atkEl = document.getElementById('dg-atk');
  var defEl = document.getElementById('dg-def');
  var scoreEl = document.getElementById('dg-score');
  var ovTitle = document.getElementById('dg-ov-title');
  var ovSub = document.getElementById('dg-ov-sub');
  var startBtn = document.getElementById('dg-start');

  /* ---------- 游戏状态 ---------- */
  var grid = [];        // 瓦片
  var explored = [];    // 已探索
  var monsters = [];    // {x,y,hp,atk,boss}
  var items = [];       // {x,y,type}
  var px = 0, py = 0;   // 玩家
  var hp = PLAYER_HP, atk = PLAYER_ATK, def = PLAYER_DEF, layer = 1;
  var score = 0, kills = 0;
  var over = false, started = false;
  var paused = false;

  /* ---------- 地图生成：房间 + L 走廊，保证连通 ---------- */
  function genLevel() {
    grid = [];
    for (var y = 0; y < ROWS; y++) { var row = []; for (var x = 0; x < COLS; x++) row.push(WALL); grid.push(row); }
    explored = [];
    for (var i = 0; i < ROWS; i++) explored.push(new Array(COLS).fill(false));

    var rooms = [];
    var tries = 0;
    while (rooms.length < 5 && tries < 200) {
      tries++;
      var w = 4 + Math.floor(Math.random() * 3);
      var h = 3 + Math.floor(Math.random() * 2);
      var rx = 1 + Math.floor(Math.random() * (COLS - w - 2));
      var ry = 1 + Math.floor(Math.random() * (ROWS - h - 2));
      var overlap = false;
      for (var r = 0; r < rooms.length; r++) {
        var o = rooms[r];
        if (rx < o.x + o.w + 1 && rx + w + 1 > o.x && ry < o.y + o.h + 1 && ry + h + 1 > o.y) { overlap = true; break; }
      }
      if (overlap) continue;
      for (var yy = ry; yy < ry + h; yy++) for (var xx = rx; xx < rx + w; xx++) grid[yy][xx] = FLOOR;
      rooms.push({ x: rx, y: ry, w: w, h: h });
    }
    // 走廊依次连接房间中心
    for (var r2 = 1; r2 < rooms.length; r2++) {
      var c1x = rooms[r2 - 1].x + Math.floor(rooms[r2 - 1].w / 2);
      var c1y = rooms[r2 - 1].y + Math.floor(rooms[r2 - 1].h / 2);
      var c2x = rooms[r2].x + Math.floor(rooms[r2].w / 2);
      var c2y = rooms[r2].y + Math.floor(rooms[r2].h / 2);
      carve(c1x, c1y, c2x, c2y);
    }

    // 玩家出生：第一个房间中心
    var startR = rooms[0];
    px = startR.x + Math.floor(startR.w / 2);
    py = startR.y + Math.floor(startR.h / 2);

    // 楼梯：最后一个房间中心
    var lastR = rooms[rooms.length - 1];
    grid[lastR.y + Math.floor(lastR.h / 2)][lastR.x + Math.floor(lastR.w / 2)] = STAIR;

    // 敌人：数量随层数
    monsters = [];
    var nMon = 3 + layer + Math.floor(Math.random() * 2);
    var guard = 0;
    while (monsters.length < nMon && guard < 300) {
      guard++;
      var mx = 1 + Math.floor(Math.random() * (COLS - 2));
      var my = 1 + Math.floor(Math.random() * (ROWS - 2));
      if (grid[my][mx] !== FLOOR) continue;
      if (Math.abs(mx - px) + Math.abs(my - py) < 5) continue;
      var boss = (layer === MAX_LAYER && monsters.length === 0);
      var mhp = (8 + (layer - 1) * 3) + Math.floor(Math.random() * 4);
      var matk = 2 + (layer - 1) + (boss ? 3 : 0);
      if (boss) { mhp = 32 + layer * 4; matk = 4 + layer; }
      monsters.push({ x: mx, y: my, hp: mhp, atk: matk, boss: boss });
    }

    // 物品：药水/金币/武器
    items = [];
    var nItem = 3 + layer;
    var g2 = 0;
    while (items.length < nItem && g2 < 200) {
      g2++;
      var ix = 1 + Math.floor(Math.random() * (COLS - 2));
      var iy = 1 + Math.floor(Math.random() * (ROWS - 2));
      if (grid[iy][ix] !== FLOOR) continue;
      if (Math.abs(ix - px) + Math.abs(iy - py) < 3) continue;
      var rnd = Math.random();
      var type = rnd < 0.35 ? ITEM_POTION : (rnd < 0.65 ? ITEM_COIN : (rnd < 0.85 ? ITEM_SWORD : ITEM_ARMOR));
      items.push({ x: ix, y: iy, type: type });
    }

    // 首层探索出生点附近
    markVisible();
  }

  function carve(x0, y0, x1, y1) {
    var x = x0, y = y0;
    while (x !== x1) { grid[y][x] = FLOOR; x += (x1 > x ? 1 : -1); }
    while (y !== y1) { grid[y][x] = FLOOR; y += (y1 > y ? 1 : -1); }
    grid[y][x] = FLOOR;
  }

  /* ---------- 视野：半径内标记可见 + 已探索 ---------- */
  function markVisible() {
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var d2 = (x - px) * (x - px) + (y - py) * (y - py);
        if (d2 <= FOV * FOV) explored[y][x] = true;
      }
    }
  }

  function inFov(x, y) {
    return (x - px) * (x - px) + (y - py) * (y - py) <= FOV * FOV;
  }

  /* ---------- 回合逻辑 ---------- */
  function tryMove(dx, dy) {
    if (over || !started || paused) return;
    var nx = px + dx, ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
    if (grid[ny][nx] === WALL) {
      if (Arcade.juice) Arcade.juice.move();
      return;
    }
    // 撞敌人 = 攻击
    var foe = monsterAt(nx, ny);
    if (foe) { attack(foe); return; }
    px = nx; py = ny;
    if (Arcade.juice) Arcade.juice.move();
    // 拾取物品
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      if (it.x === px && it.y === py) {
        items.splice(i, 1);
        if (it.type === ITEM_POTION) { hp = Math.min(PLAYER_HP + 10, hp + 12); msg.textContent = T('gs.dungeon.msgPotion'); if (Arcade.juice) Arcade.juice.coin(px * cellW(), py * cellH(), 'var(--neon-green)'); }
        else if (it.type === ITEM_COIN) { score += 5; msg.textContent = T('gs.dungeon.msgCoin'); if (Arcade.audio) Arcade.audio.play('coin'); }
        else if (it.type === ITEM_SWORD) { atk += 1; msg.textContent = T('gs.dungeon.msgSword'); if (Arcade.juice) Arcade.juice.clear(px * cellW(), py * cellH(), 'var(--neon-purple)', 10); }
        else { def += 1; msg.textContent = T('gs.dungeon.msgArmor'); if (Arcade.juice) Arcade.juice.clear(px * cellW(), py * cellH(), '#9ad1ff', 10); }
        updateHud();
      }
    }
    // 楼梯下行
    if (grid[py][px] === STAIR) {
      if (layer >= MAX_LAYER) {
        // 第 5 层楼梯=通关（Boss 被击杀后楼梯才亮；这里 Boss 存活时楼梯不可用）
        if (monsters.length) {
          msg.textContent = T('gs.dungeon.msgBossBlock');
          if (Arcade.ui) Arcade.ui.toast(T('gs.dungeon.toastBoss'), 'warn');
          return;
        }
        win();
        return;
      }
      layer++;
      score += 25;
      hp = Math.min(PLAYER_HP + 10, hp + 6);
      genLevel();
      msg.textContent = T('gs.dungeon.msgEnterLayer').replace('{n}', layer);
      if (Arcade.juice) Arcade.juice.win(px * cellW(), py * cellH());
      updateHud();
      render();
      return;
    }
    markVisible();
    enemyTurn();
    updateHud();
    render();
  }

  function monsterAt(x, y) {
    for (var i = 0; i < monsters.length; i++) if (monsters[i].x === x && monsters[i].y === y) return monsters[i];
    return null;
  }

  function attack(foe) {
    foe.hp -= atk;
    if (Arcade.fx) Arcade.fx.burst(foe.x * cellW() + cellW() / 2, foe.y * cellH() + cellH() / 2, 'var(--neon-yellow)', 8);
    if (Arcade.audio) Arcade.audio.play('match');
    if (foe.hp <= 0) {
      monsters.splice(monsters.indexOf(foe), 1);
      var pts = foe.boss ? 100 : 10;
      score += pts; kills++;
      msg.textContent = foe.boss ? T('gs.dungeon.msgBossDown').replace('{n}', pts) : T('gs.dungeon.msgKill').replace('{n}', pts);
      if (foe.boss) {
        if (Arcade.juice) Arcade.juice.win(foe.x * cellW(), foe.y * cellH());
        if (Arcade.ui) Arcade.ui.toast(T('gs.dungeon.toastBossDown'), 'win');
      } else {
        if (Arcade.juice) Arcade.juice.clear(foe.x * cellW(), foe.y * cellH(), 'var(--neon-pink)', 12);
      }
    } else {
      msg.textContent = T('gs.dungeon.msgHit').replace('{n}', atk);
      enemyRetaliate(foe);
    }
    updateHud();
  }

  /* 受伤：攻击力减去防御，最低 1 点 */
  function damageTaken(raw) {
    return Math.max(1, raw - def);
  }

  function enemyRetaliate(foe) {
    hp -= damageTaken(foe.atk);
    if (Arcade.juice) Arcade.juice.lose();
    if (hp <= 0) { hp = 0; gameOver(); }
  }

  /* 敌人回合：相邻则攻击，否则追玩家一步 */
  function enemyTurn() {
    for (var i = monsters.length - 1; i >= 0; i--) {
      var m = monsters[i];
      var d = Math.abs(m.x - px) + Math.abs(m.y - py);
      if (d === 1) {
        hp -= damageTaken(m.atk);
        if (Arcade.audio) Arcade.audio.play('error');
        if (hp <= 0) { hp = 0; gameOver(); return; }
      } else if (d <= FOV + 2) {
        var dx = Math.sign(px - m.x), dy = Math.sign(py - m.y);
        var moved = false;
        if (dx !== 0 && grid[m.y][m.x + dx] === FLOOR && !monsterAt(m.x + dx, m.y)) { m.x += dx; moved = true; }
        else if (dy !== 0 && grid[m.y + dy][m.x] === FLOOR && !monsterAt(m.x, m.y + dy)) { m.y += dy; moved = true; }
        else if (dx !== 0 && grid[m.y][m.x - dx] === FLOOR && !monsterAt(m.x - dx, m.y)) { m.x -= dx; }
        else if (dy !== 0 && grid[m.y - dy][m.x] === FLOOR && !monsterAt(m.x, m.y - dy)) { m.y -= dy; }
      }
    }
    markVisible();
  }

  function gameOver() {
    over = true;
    msg.textContent = T('gs.dungeon.msgDie').replace('{n}', layer);
    ovTitle.textContent = T('gs.dungeon.overT');
    ovTitle.className = 'dg-ov-title';
    ovSub.innerHTML = T('gs.dungeon.overD').replace('{k}', kills).replace('{s}', score).replace('{l}', layer);
    startBtn.textContent = T('gs.dungeon.retry');
    overlay.classList.remove('hidden');
    if (Arcade.shell) Arcade.shell.submitScore(score);
  }

  function win() {
    over = true;
    score += 100;
    msg.textContent = T('gs.dungeon.msgWin');
    ovTitle.textContent = T('gs.dungeon.winT');
    ovTitle.className = 'dg-ov-title win';
    ovSub.innerHTML = T('gs.dungeon.winD').replace('{k}', kills).replace('{s}', score);
    startBtn.textContent = T('gs.dungeon.again');
    overlay.classList.remove('hidden');
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(score);
  }

  /* ---------- 渲染 ---------- */
  function cellW() { return canvas.width / COLS; }
  function cellH() { return canvas.height / ROWS; }

  function render() {
    var cw = cellW(), ch = cellH();
    ctx.fillStyle = '#05050b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        if (!explored[y][x]) continue;
        var vis = inFov(x, y);
        var dim = vis ? 1 : 0.35;
        var t = grid[y][x];
        if (t === WALL) { ctx.fillStyle = 'rgba(40,36,80,' + (0.9 * dim) + ')'; }
        else { ctx.fillStyle = 'rgba(20,20,38,' + (0.95 * dim) + ')'; }
        ctx.fillRect(x * cw, y * ch, cw, ch);
        if (t === WALL) {
          ctx.fillStyle = 'rgba(120,110,200,' + (0.5 * dim) + ')';
          ctx.fillRect(x * cw + cw * 0.3, y * ch + ch * 0.3, cw * 0.4, ch * 0.4);
        }
        if (!vis) continue;
        if (t === STAIR) {
          ctx.fillStyle = 'rgba(57,255,20,0.95)';
          ctx.fillRect(x * cw + cw * 0.25, y * ch + ch * 0.25, cw * 0.5, ch * 0.5);
        }
      }
    }
    // 物品
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!inFov(it.x, it.y)) continue;
      var ix = it.x * cw + cw / 2, iy = it.y * ch + ch / 2;
      if (it.type === ITEM_POTION) { ctx.fillStyle = '#39ff14'; ctx.fillRect(ix - 3, iy - 7, 6, 14); ctx.fillRect(ix - 7, iy - 3, 14, 6); }
      else if (it.type === ITEM_COIN) { ctx.fillStyle = '#ffe600'; ctx.beginPath(); ctx.arc(ix, iy, 5, 0, 7); ctx.fill(); }
      else if (it.type === ITEM_SWORD) { ctx.fillStyle = '#b967ff'; ctx.fillRect(ix - 2, iy - 8, 4, 16); ctx.fillRect(ix - 8, iy - 8, 6, 4); }
      else { ctx.fillStyle = '#9ad1ff'; ctx.fillRect(ix - 7, iy - 8, 14, 8); ctx.fillRect(ix - 5, iy - 3, 10, 6); }
    }
    // 敌人
    for (var m = 0; m < monsters.length; m++) {
      var mo = monsters[m];
      if (!inFov(mo.x, mo.y)) continue;
      var mx2 = mo.x * cw + cw / 2, my2 = mo.y * ch + ch / 2;
      ctx.fillStyle = mo.boss ? '#ff2d95' : '#ff5c5c';
      ctx.beginPath(); ctx.arc(mx2, my2, (mo.boss ? 9 : 6), 0, 7); ctx.fill();
      ctx.fillStyle = '#1a0410';
      ctx.fillRect(mx2 - 3, my2 - 2, 2, 2); ctx.fillRect(mx2 + 1, my2 - 2, 2, 2);
    }
    // 玩家
    var pxx = px * cw + cw / 2, pyy = py * ch + ch / 2;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath(); ctx.arc(pxx, pyy, 7, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(pxx - 2, pyy - 2, 2, 0, 7); ctx.fill();
  }

  function updateHud() {
    hpEl.textContent = hp;
    layerEl.textContent = layer;
    atkEl.textContent = atk;
    if (defEl) defEl.textContent = def;
    scoreEl.textContent = score;
  }

  /* ---------- 控制 ---------- */
  function moveBy(dir) {
    var map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    var d = map[dir];
    if (d) tryMove(d[0], d[1]);
  }

  // 键盘
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyP') { paused = !paused; if (Arcade.ui) Arcade.ui.toast(paused ? T('gs.dungeon.paused') : T('gs.dungeon.resume'), 'warn'); return; }
    var dir = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }[e.code];
    if (dir) { e.preventDefault(); moveBy(dir); }
  });

  // 触屏：滑动 + DPad
  if (Arcade.input) {
    Arcade.input.onSwipe(canvas, function (dir) { moveBy(dir); });
    var pad = Arcade.input.createDPad(document.getElementById('dg-dpad'), function (dir, pressed) { if (pressed) moveBy(dir); });
  }

  // 出发/重开
  startBtn.addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    startGame();
  });

  function startGame() {
    layer = 1; hp = PLAYER_HP; atk = PLAYER_ATK; def = PLAYER_DEF; score = 0; kills = 0; over = false; started = true; paused = false;
    genLevel();
    updateHud();
    msg.textContent = T('gs.dungeon.startMsg');
    overlay.classList.add('hidden');
    render();
  }

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.dungeon.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = startGame;

  /* ---------- 首屏 ---------- */
  ovSub.innerHTML = T('gs.dungeon.sub');
  startBtn.textContent = T('gs.dungeon.go');
  startGame();


})();
