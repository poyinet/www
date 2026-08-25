/* 塔防 Tower Defense —— 横向新游戏 策略重头戏 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.towerdefense.tut1t'), d: T('gs.towerdefense.tut1') },
  { t: T('gs.towerdefense.tut2t'), d: T('gs.towerdefense.tut2') },
  { t: T('gs.towerdefense.tut3t'), d: T('gs.towerdefense.tut3') },
  { t: T('gs.towerdefense.tut4t'), d: T('gs.towerdefense.tut4') },
  { t: T('gs.towerdefense.tut5t'), d: T('gs.towerdefense.tut5') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 720, H = 460;
  var CELL = 20;
  var COLS = W / CELL, ROWS = H / CELL; // 36×23

  /* 路径（网格坐标）：3 张地图，确定性生成（含垂直连接段） */
  var PATH = [];
  var mapStyle = 'std';
  function buildPath(style) {
    style = style || mapStyle;
    PATH = [];
    var r, c = -1, dir = 1;
    var guard = 0;
    if (style === 'loop') {
      // 环形：右侧绕大圈，起点 (2,0) → 顶行右行 → 右列下行 → 底行左行 → 左列下行
      r = 2;
      while (guard++ < 4000) {
        while (c + 1 < COLS) { c += 1; PATH.push([r, c]); }
        while (r + 1 < ROWS - 4) { r += 1; PATH.push([r, c]); }
        while (c - 1 >= 0) { c -= 1; PATH.push([r, c]); }
        while (r + 1 < ROWS - 2) { r += 1; PATH.push([r, c]); }
        break;
      }
    } else {
      // 蛇形折返：标准垂直 3 格 / S 形垂直 2 格
      var stepV = style === 'snake' ? 2 : 3;
      r = style === 'snake' ? 2 : 4;
      while (guard++ < 2000) {
        while (c + dir >= 0 && c + dir < COLS) {
          c += dir;
          PATH.push([r, c]);
        }
        var moved = false;
        for (var v = 0; v < stepV; v++) {
          if (r + 1 >= ROWS - 3) break;
          r += 1;
          PATH.push([r, c]);
          moved = true;
        }
        if (!moved) break;
        dir = -dir;
      }
    }
    if (PATH.length < 30) { buildPath(style); return; }
  }

  var TOWERS = {
    bolt:   { name: '⚡', cost: 15, dmg: 12, range: 65, cooldown: 22, color: '#00f0ff' },
    sniper: { name: '🎯', cost: 25, dmg: 30, range: 130, cooldown: 45, color: '#ff2d95' },
    frost:  { name: '❄', cost: 20, dmg: 4, range: 70, cooldown: 30, color: '#4a6cff', slow: 0.5 },
    poison: { name: '☠', cost: 22, dmg: 6, range: 80, cooldown: 26, color: '#39ff14', dot: 1.5 },
    cannon: { name: '💥', cost: 30, dmg: 18, range: 95, cooldown: 40, color: '#ff9f1a', splash: 26 },
    battery:{ name: '🔋', cost: 35, dmg: 55, range: 110, cooldown: 75, color: '#b967ff' }
  };
  var TYPE_ORDER = ['bolt', 'sniper', 'frost', 'poison', 'cannon', 'battery'];
  var TYPE_NAME = { bolt: 'bolt', sniper: 'sniper', frost: 'frost', poison: 'poison', cannon: 'cannon', battery: 'battery' };

  var gold, wave, lives, towers, enemies, bullets, spawnT, over, won, kills, paused, loopApi, selectedType;

  /* 敌人生成：普通 / 快速（第5波起）/ 坦克（第10波起） */
  function enemyFor(w) {
    var roll = Math.random();
    var isTank = w > 9 && roll >= 0.78;
    var isFast = w > 4 && !isTank && roll < 0.28;
    var hp = (isTank ? 2.6 : 1) * (20 + w * 12);
    var speed = (isFast ? 2.4 : 1) * (1 + w * 0.05);
    var gold = isTank ? 4 : isFast ? 2 : 1;
    return { kind: isTank ? 'tank' : isFast ? 'fast' : 'normal', hp: hp, maxHp: hp, speed: speed, gold: gold };
  }
  function nextWaveInfo() {
    var w = wave + 1;
    var count = 6 + w * 2;
    var hp = Math.round(20 + w * 12);
    return T('gs.towerdefense.nextInfo').replace('{a}', count).replace('{b}', hp);
  }

  function pathPx(idx) {
    var p = PATH[idx % PATH.length];
    return { x: p[1] * CELL + CELL / 2, y: p[0] * CELL + CELL / 2 };
  }

  function reset() {
    gold = 60; wave = 0; lives = 20; kills = 0;
    towers = []; enemies = []; bullets = [];
    spawnT = 0; over = false; won = false; paused = false;
    selectedType = 'bolt';
    buildPath(mapStyle);
  }

  function spawnWave() {
    wave++;
    var count = 6 + wave * 2;
    for (var i = 0; i < count; i++) {
      var e = enemyFor(wave);
      e.pathIdx = 0; e.x = -20; e.y = 0;
      enemies.push(e);
    }
  }

  var wrap = document.createElement('div');
  wrap.className = 'td-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="td-map">' +
    '  <button class="btn mode-btn selected" data-map="std">' + T('gs.towerdefense.mapStd') + '</button>' +
    '  <button class="btn mode-btn" data-map="snake">' + T('gs.towerdefense.mapSnake') + '</button>' +
    '  <button class="btn mode-btn" data-map="loop">' + T('gs.towerdefense.mapLoop') + '</button>' +
    '</div>' +
    '<div class="td-tray" id="td-tray">' +
    '  <button class="td-tower sel" data-t="bolt">' + TOWERS.bolt.name + ' ' + T('gs.towerdefense.tower.bolt.n') + ' <b>15</b></button>' +
    '  <button class="td-tower" data-t="sniper">' + TOWERS.sniper.name + ' ' + T('gs.towerdefense.tower.sniper.n') + ' <b>25</b></button>' +
    '  <button class="td-tower" data-t="frost">' + TOWERS.frost.name + ' ' + T('gs.towerdefense.tower.frost.n') + ' <b>20</b></button>' +
    '  <button class="td-tower" data-t="poison">' + TOWERS.poison.name + ' ' + T('gs.towerdefense.tower.poison.n') + ' <b>22</b></button>' +
    '  <button class="td-tower" data-t="cannon">' + TOWERS.cannon.name + ' ' + T('gs.towerdefense.tower.cannon.n') + ' <b>30</b></button>' +
    '  <button class="td-tower" data-t="battery">' + TOWERS.battery.name + ' ' + T('gs.towerdefense.tower.battery.n') + ' <b>35</b></button>' +
    '</div>' +
    '<canvas class="td-canvas" id="td-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="td-top">' +
    '  <span>💰 <b id="td-gold">60</b></span>' +
    '  <span>' + T('gs.towerdefense.waveLbl').replace('{n}', '<b id="td-wave">0</b>') + '</span>' +
    '  <span>❤️ ' + T('gs.towerdefense.lives') + ' <b id="td-lives">20</b></span>' +
    '  <span>' + T('gs.towerdefense.kills') + ' <b id="td-kills">0</b></span>' +
    '  <span>' + T('gs.towerdefense.next') + ': <b id="td-next"></b></span>' +
    '</div>' +
    '<div class="td-msg" id="td-msg">' + T('gs.towerdefense.msgStart') + '</div>' +
    '<div class="game-controls">' +
    '  <button class="btn yellow" id="td-start">' + T('gs.towerdefense.startWave').replace('{n}', '1') + '</button>' +
    '  <button class="btn green" id="td-pause">⏸ ' + T('gs.towerdefense.pause') + '</button>' +
    '  <button class="btn purple" id="td-restart">' + T('gs.towerdefense.restart') + '</button>' +
    '</div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#td-canvas'), ctx = canvas.getContext('2d'),
      goldEl = wrap.querySelector('#td-gold'), waveEl = wrap.querySelector('#td-wave'),
      livesEl = wrap.querySelector('#td-lives'), killsEl = wrap.querySelector('#td-kills'),
      nextEl = wrap.querySelector('#td-next'),
      msg = wrap.querySelector('#td-msg'), startBtn = wrap.querySelector('#td-start'),
      pauseBtn = wrap.querySelector('#td-pause'),
      restartBtn = wrap.querySelector('#td-restart'), tray = wrap.querySelector('#td-tray'),
      mapRow = wrap.querySelector('#td-map');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  mapRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      mapRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      mapStyle = b.getAttribute('data-map');
      reset();
      startBtn.textContent = T('gs.towerdefense.startWave').replace('{n}', '1');
      nextEl.textContent = nextWaveInfo();
      render();
      msg.textContent = { std: T('gs.towerdefense.mapStdMsg'), snake: T('gs.towerdefense.mapSnakeMsg'), loop: T('gs.towerdefense.mapLoopMsg') }[mapStyle];
      msg.style.color = 'var(--neon-yellow)';
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  tray.querySelectorAll('.td-tower').forEach(function (b) {
    b.addEventListener('click', function () {
      tray.querySelectorAll('.td-tower').forEach(function (x) { x.classList.remove('sel'); });
      b.classList.add('sel');
      selectedType = b.getAttribute('data-t');
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.towerdefense.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.towerdefense.msgStart'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function isPathCell(r, c) {
    return PATH.some(function (p) { return p[0] === r && p[1] === c; });
  }

  function update() {
    if (over) return;
    // 生成敌人
    if (spawnT > 0) {
      spawnT--;
      if (spawnT === 0) {
        enemies.forEach(function (e, i) { e.pathIdx = i % PATH.length; });
      }
    }
    // 移动敌人
    enemies.forEach(function (e) {
      var target = pathPx(e.pathIdx + 1);
      var dx = target.x - e.x, dy = target.y - e.y;
      var d = Math.hypot(dx, dy);
      if (d < e.speed) { e.pathIdx++; target = pathPx(e.pathIdx + 1); }
      dx = target.x - e.x; dy = target.y - e.y; d = Math.hypot(dx, dy);
      e.x += dx / d * e.speed;
      e.y += dy / d * e.speed;
      if (e.pathIdx >= PATH.length - 1) { // 到达终点
        lives--;
        enemies = enemies.filter(function (x) { return x !== e; });
        if (Arcade.audio) Arcade.audio.play('error');
      }
    });
    // 塔攻击
    towers.forEach(function (t) {
      if (t.cd > 0) t.cd--;
      var best = null, bestD = 1e9;
      enemies.forEach(function (e) {
        var d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d < t.range && d < bestD) { bestD = d; best = e; }
      });
      if (best && t.cd === 0) {
        t.cd = TOWERS[t.type].cooldown;
        bullets.push({ x: t.x, y: t.y, tx: best.x, ty: best.y, dmg: TOWERS[t.type].dmg * (1 + (t.level - 1) * 0.5), type: t.type, life: 30 });
        if (Arcade.juice) Arcade.juice.select();
      }
    });
    // 子弹命中
    bullets.forEach(function (b) {
      b.life--;
      var hit = null;
      enemies.forEach(function (e) {
        if (Math.hypot(e.x - b.tx, e.y - b.ty) < 22) { if (!hit) hit = e; }
      });
      if (hit) {
        hit.hp -= b.dmg;
        if (b.type === 'frost') hit.slowT = 60;
        if (b.type === 'poison') hit.dot = Math.max(hit.dot || 0, TOWERS.poison.dot * 30);
        if (b.type === 'cannon') { // 溅射
          enemies.forEach(function (e) {
            if (e !== hit && Math.hypot(e.x - b.tx, e.y - b.ty) < TOWERS.cannon.splash) e.hp -= b.dmg * 0.6;
          });
        }
        b.life = 0;
        if (hit.hp <= 0) {
          gold += hit.gold;
          kills++;
          enemies = enemies.filter(function (x) { return x !== hit; });
          if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-pink)', 6);
        }
      }
      // 朝向目标移动的子弹简化：直接命中判定
      b.x = b.tx; b.y = b.ty;
    });
    bullets = bullets.filter(function (b) { return b.life > 0; });
    // 减速 + 中毒
    enemies.forEach(function (e) {
      if (e.slowT > 0) e.slowT--;
      if (e.dot > 0) { e.hp -= e.dot; e.dot = Math.max(0, e.dot - 0.6); }
    });
    // 毒伤击杀
    enemies.forEach(function (e, i) {
      if (e.hp <= 0) {
        gold += e.gold; kills++;
        enemies.splice(i, 1);
        if (Arcade.juice) Arcade.juice.clear(null, null, '#39ff14', 5);
      }
    });

    // 波次结束 → 新一波
    if (!enemies.length && spawnT <= 0 && !over) {
      if (wave >= 20) {
        over = true; won = true;
        msg.textContent = T('gs.towerdefense.win').replace('{n}', kills);
        msg.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(kills);
        return;
      }
      msg.textContent = T('gs.towerdefense.waveComing').replace('{n}', wave + 1);
      msg.style.color = 'var(--neon-yellow)';
    }
    if (lives <= 0 && !over) {
      over = true;
      msg.textContent = T('gs.towerdefense.lose').replace('{n}', kills);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
      if (Arcade.shell) Arcade.shell.submitScore(kills);
    }
    goldEl.textContent = gold;
    waveEl.textContent = wave;
    livesEl.textContent = Math.max(0, lives);
    killsEl.textContent = kills;
    nextEl.textContent = over ? '—' : nextWaveInfo();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a120a'; ctx.fillRect(0, 0, W, H);
    // 路径
    ctx.fillStyle = '#2a2a18';
    PATH.forEach(function (p) { ctx.fillRect(p[1] * CELL, p[0] * CELL, CELL, CELL); });
    ctx.fillStyle = 'rgba(255,230,0,0.5)';
    ctx.fillRect(0, PATH[0][0] * CELL, CELL * 0.8, CELL * 0.8);
    // 塔
    towers.forEach(function (t) {
      var spec = TOWERS[t.type];
      ctx.strokeStyle = spec.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, 7); ctx.stroke();
      ctx.fillStyle = spec.color;
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(spec.name, t.x, t.y + 1);
      if (t.level > 1) { ctx.fillStyle = '#ffe600'; ctx.fillRect(t.x - 6, t.y - 16, 12, 3); }
    });
    // 敌人
    enemies.forEach(function (e) {
      var hpR = e.hp / e.maxHp;
      var r = e.kind === 'tank' ? 12 : e.kind === 'fast' ? 6 : 9;
      ctx.fillStyle = e.slowT > 0 ? '#4a6cff' : (e.dot > 0 ? '#39ff14' : (e.kind === 'tank' ? '#ff9f1a' : e.kind === 'fast' ? '#ffe600' : '#ff2d95'));
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x - 8, e.y - 16, 16, 3);
      ctx.fillStyle = hpR > 0.5 ? '#39ff14' : '#ffe600';
      ctx.fillRect(e.x - 8, e.y - 16, 16 * hpR, 3);
    });
    // 子弹
    bullets.forEach(function (b) {
      ctx.fillStyle = TOWERS[b.type].color;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 7); ctx.fill();
    });
  }

  function click(e) {
    if (over) return;
    var rect = canvas.getBoundingClientRect();
    var px = (e.clientX - rect.left) * (W / rect.width);
    var py = (e.clientY - rect.top) * (H / rect.height);
    var c = Math.floor(px / CELL), r = Math.floor(py / CELL);
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return;
    if (isPathCell(r, c)) return;
    // 检查已有塔 → 升级
    var existing = towers.filter(function (t) { return Math.floor(t.x / CELL) === c && Math.floor(t.y / CELL) === r; })[0];
    if (existing) {
      if (gold >= 10 && existing.level < 3) {
        gold -= 10; existing.level++;
        existing.range = TOWERS[existing.type].range + (existing.level - 1) * 12;
        msg.textContent = T('gs.towerdefense.upgraded').replace('{name}', T('gs.towerdefense.tower.' + TYPE_NAME[existing.type] + '.n')).replace('{n}', existing.level);
        if (Arcade.juice) Arcade.juice.select();
      } else { msg.textContent = T('gs.towerdefense.maxed'); }
      return;
    }
    var spec = TOWERS[selectedType];
    if (gold < spec.cost) { msg.textContent = T('gs.towerdefense.noGold').replace('{n}', spec.cost); return; }
    gold -= spec.cost;
    towers.push({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, type: selectedType, cd: 0, level: 1, range: spec.range });
    if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    msg.textContent = T('gs.towerdefense.built').replace('{name}', T('gs.towerdefense.tower.' + TYPE_NAME[selectedType] + '.n'));
  }
  canvas.addEventListener('mousedown', click);
  canvas.addEventListener('touchstart', function (e) { click(e.touches[0]); e.preventDefault(); }, { passive: false });

  startBtn.addEventListener('click', function () {
    if (over || spawnT > 0 || enemies.length) return;
    spawnWave();
    spawnT = 5;
    startBtn.textContent = wave >= 20 ? T('gs.towerdefense.defending') : T('gs.towerdefense.startWave').replace('{n}', wave + 1);
    nextEl.textContent = nextWaveInfo();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  function resetUI() {
    startBtn.textContent = T('gs.towerdefense.startWave').replace('{n}', '1');
    nextEl.textContent = nextWaveInfo();
    render();
    msg.textContent = T('gs.towerdefense.msgStart');
    msg.style.color = '';
  }
  restartBtn.addEventListener('click', function () { reset(); resetUI(); if (Arcade.audio) Arcade.audio.play('ui'); });
  pauseBtn.addEventListener('click', function () { togglePause(); if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.towerdefense.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); resetUI(); };
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });

  function render() {
    goldEl.textContent = gold; waveEl.textContent = wave;
    livesEl.textContent = Math.max(0, lives); killsEl.textContent = kills;
  }

  buildPath();
  reset(); render();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
