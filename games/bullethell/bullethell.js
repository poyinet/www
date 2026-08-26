/* ============================================================
   弹幕射击 Bullet Hell · 擦弹计分旗舰（P2 品类旗舰）
   经典弹幕玩法：判定点极小（半径 3px），本体大（8px 擦弹圈）。
   擦弹 = 贴近弹幕但不被命中，每帧 +1 分并积累擦弹连击；
   击破敌机、Boss 阶段奖励叠加。
   三难度（弹速/密度/波次递进）+ Boss 战（多阶段弹幕）。
   记分：总分（max 模式）。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bullethell.tut1t'), d: T('gs.bullethell.tut1') },
  { t: T('gs.bullethell.tut2t'), d: T('gs.bullethell.tut2') },
  { t: T('gs.bullethell.tut3t'), d: T('gs.bullethell.tut3') },
  { t: T('gs.bullethell.tut4t'), d: T('gs.bullethell.tut4') }
];

(function () {
  /* ==BH-CORE-START== */
  var BHCORE = (function () {
    /* 弹幕模式（纯数学，可测）：返回弹的初始 (vx,vy) 列表 */
    function ringPattern(n, speed, dir, spread, rng) {
      var out = [];
      var base = (rng ? rng() * Math.PI * 2 : 0) + (dir || 0);
      for (var i = 0; i < n; i++) {
        var a = base + (spread || Math.PI * 2) * i / n;
        out.push([Math.cos(a) * speed, Math.sin(a) * speed]);
      }
      return out;
    }
    function spiralPattern(speed, angle) {
      return [Math.cos(angle) * speed, Math.sin(angle) * speed];
    }
    function aimAngle(px, py, ex, ey) {
      return Math.atan2(py - ey, px - ex);
    }
    function fanPattern(n, centerAng, spread, speed) {
      var out = [];
      if (n === 1) { out.push([Math.cos(centerAng) * speed, Math.sin(centerAng) * speed]); return out; }
      for (var i = 0; i < n; i++) {
        var a = centerAng - spread / 2 + spread * i / (n - 1);
        out.push([Math.cos(a) * speed, Math.sin(a) * speed]);
      }
      return out;
    }
    /* 判定：返回 0=命中判定点 / 1=擦弹圈内未命中 / 2=安全 */
    function judgeHit(px, py, bx, by, hitR, grazeR) {
      var d2 = (px - bx) * (px - bx) + (py - by) * (py - by);
      if (d2 <= hitR * hitR) return 0;
      if (d2 <= grazeR * grazeR) return 1;
      return 2;
    }
    /* 敌机击破判定 */
    function hitEnemy(px, py, ex, ey, er) {
      var dx = px - ex, dy = py - ey;
      return dx * dx + dy * dy <= er * er;
    }
    return {
      ringPattern: ringPattern, spiralPattern: spiralPattern, aimAngle: aimAngle,
      fanPattern: fanPattern, judgeHit: judgeHit, hitEnemy: hitEnemy
    };
  })();
  /* ==BH-CORE-END== */

  var ringPattern = BHCORE.ringPattern, spiralPattern = BHCORE.spiralPattern;
  var aimAngle = BHCORE.aimAngle, fanPattern = BHCORE.fanPattern;
  var judgeHit = BHCORE.judgeHit, hitEnemy = BHCORE.hitEnemy;

  var root = document.getElementById('game-root');
  var W = 420, H = 560;
  var html =
    '<div class="bh-top">' +
    '  <span>💎 <b id="bh-score">0</b></span>' +
    '  <span>' + T('gs.bullethell.graze') + ' <b id="bh-graze">0</b></span>' +
    '  <span>❤️ <b id="bh-lives">3</b></span>' +
    '  <span>' + T('gs.bullethell.wave').replace('{n}', '<b id="bh-wave">1</b>') + '</span>' +
    '</div>' +
    '<div class="mode-row" id="bh-diffs">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.bullethell.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.bullethell.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.bullethell.dHard') + '</button>' +
    '</div>' +
    '<div class="bh-stage"><canvas class="bh-canvas" id="bh-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '  <div class="bh-msg" id="bh-msg"></div></div>' +
    '<div class="bh-help">' + T('gs.bullethell.help') + '</div>';
  root.innerHTML = html;

  var canvas = document.getElementById('bh-canvas');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('bh-score'), grazeEl = document.getElementById('bh-graze'),
      livesEl = document.getElementById('bh-lives'), waveEl = document.getElementById('bh-wave'),
      msgEl = document.getElementById('bh-msg'), diffRow = document.getElementById('bh-diffs');

  var DIFFS = {
    easy: { speed: 1.6, volley: 6, bossHp: 60, waves: 3 },
    normal: { speed: 2.4, volley: 10, bossHp: 90, waves: 5 },
    hard: { speed: 3.4, volley: 16, bossHp: 130, waves: 7 }
  };
  var diff = 'normal';
  var D = DIFFS[diff];

  var score = 0, lives = 3, wave = 1, over = false, won = false, paused = false;
  var invT = 0; // 受击无敌帧计数（约 1.5 秒）
  var player = { x: W / 2, y: H - 60, vx: 0, vy: 0 };
  var P_SPEED = 4.6, HIT_R = 3, GRAZE_R = 14, SHOT_R = 4;
  var playerBullets = [], enemies = [], ebullets = [], effects = [];
  var boss = null, bossPhase = 0, spiralAng = 0, fireT = 0, waveT = 0, grazeCombo = 0, keys = {};
  var loopApi = null, gameOver = false;

  function newGame() {
    score = 0; lives = 3; wave = 1; over = false; won = false; gameOver = false; paused = false; invT = 0;
    player = { x: W / 2, y: H - 60 };
    playerBullets = []; enemies = []; ebullets = []; effects = [];
    boss = null; bossPhase = 0; spiralAng = 0; fireT = 0; waveT = 0; grazeCombo = 0;
    D = DIFFS[diff];
    msgEl.textContent = '';
    msgEl.style.color = '';
    scoreEl.textContent = '0'; grazeEl.textContent = '0'; livesEl.textContent = '3'; waveEl.textContent = '1';
    spawnWave(1); // 重开/切难度立即生成第 1 波（此前首波只在首次加载生成，重开空转 0.7s 后直接进第 2 波）
  }

  function spawnWave(w) {
    // 敌机：一行 3-5 架，发射模式随机（ring/fan/aim）
    var n = Math.min(5, 3 + Math.floor(w / 2));
    for (var i = 0; i < n; i++) {
      enemies.push({
        x: 60 + i * (W - 120) / (n - 1 || 1), y: -30 - i * 14,
        hp: 1, ty: 70 + (i % 3) * 18, pattern: i % 3,
        t: 0, volley: Math.max(3, Math.round(D.volley * (0.7 + w * 0.05)))
      });
    }
  }
  function spawnBoss() {
    boss = { x: W / 2, y: -40, ty: 90, hp: D.bossHp, maxHp: D.bossHp, t: 0, phase: 0, ringN: 14, fireT: 0 };
  }

  /* ---------- 更新 ---------- */
  function update() {
    if (over || paused || won) return;
    // 玩家移动
    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx || dy) { var L = Math.hypot(dx, dy); dx /= L; dy /= L; }
    player.x = Math.max(12, Math.min(W - 12, player.x + dx * P_SPEED));
    player.y = Math.max(12, Math.min(H - 12, player.y + dy * P_SPEED));

    // 玩家射击（自动）
    fireT--;
    if (fireT <= 0) {
      fireT = 7;
      playerBullets.push({ x: player.x, y: player.y, vy: -9 });
    }
    playerBullets.forEach(function (b) { b.y += b.vy; });
    playerBullets = playerBullets.filter(function (b) { return b.y > -10; });

    // 敌机
    enemies.forEach(function (e) {
      e.t++;
      if (e.y < e.ty) e.y += 2;
      if (e.t % 60 === 0) fireEnemy(e);
      if (e.t % 60 === 30 && e.pattern === 1) fireEnemy(e); // 双发
    });
    // 玩家子弹命中敌机
    playerBullets.forEach(function (b) {
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (hitEnemy(b.x, b.y, e.x, e.y, 14)) {
          e.hp--; b.y = -99;
          if (e.hp <= 0) {
            score += 100;
            effects.push({ x: e.x, y: e.y, t: 20 });
            enemies.splice(i, 1);
          }
          break;
        }
      }
    });
    // Boss
    if (boss) {
      boss.t++;
      if (boss.y < boss.ty) boss.y += 1.5;
      bossFire(boss);
      var boss2 = boss;
      playerBullets.forEach(function (b) {
        if (!boss2) return; // Boss 已击破，忽略后续子弹
        if (hitEnemy(b.x, b.y, boss2.x, boss2.y, 20)) {
          b.y = -99;
          boss2.hp--;
          if (boss2.hp <= 0) {
            score += 5000;
            effects.push({ x: boss2.x, y: boss2.y, t: 60, big: true });
            boss2 = null;
            boss = null;
          }
        }
      });
    }

    // 敌方弹幕推进 + 擦弹/命中
    if (invT > 0) invT--; // 无敌倒计时
    var newHit = false;
    for (var bi = 0; bi < ebullets.length; bi++) {
      var b = ebullets[bi];
      b.x += b.vx; b.y += b.vy;
      var j = judgeHit(player.x, player.y, b.x, b.y, HIT_R, GRAZE_R);
      if (j === 0) { if (invT <= 0) newHit = true; b.dead = true; } // 无敌期仍消弹但不扣命
      else if (j === 1) { grazeCombo++; score += 1; b.grazed = true; }
      if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.dead = true;
    }
    ebullets = ebullets.filter(function (b) { return !b.dead; });
    if (newHit) {
      lives--;
      invT = 90; // 受击后 1.5 秒无敌（避免密集弹幕瞬间连扣）
      livesEl.textContent = lives;
      grazeCombo = 0;
      if (Arcade.juice) Arcade.juice.lose();
      if (lives <= 0) {
        gameOver = true; over = true;
        if (Arcade.shell) Arcade.shell.submitScore(score); // 结算一次
      }
    }

    // 波次推进 / Boss
    if (!boss) {
      if (!enemies.length) {
        waveT++;
        if (waveT > 40) {
          waveT = 0;
          wave++;
          waveEl.textContent = wave;
          if (wave > D.waves) { spawnBoss(); }
          else spawnWave(wave);
        }
      }
    } else if (!boss && wave > D.waves) { /* 已在 Boss */ }

    effects.forEach(function (e) { e.t--; });
    effects = effects.filter(function (e) { return e.t > 0; });

    // 胜利结算（一次）
    if (boss === null && wave > D.waves && !gameOver && !won) {
      won = true;
      score += 1000;
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
    }
    scoreEl.textContent = score;
    grazeEl.textContent = grazeCombo;
  }

  function fireEnemy(e) {
    var n = e.volley, sp = D.speed;
    if (e.pattern === 0) {
      ringPattern(n, sp * 0.8, 0, 0, null).forEach(function (v) {
        ebullets.push({ x: e.x, y: e.y + 8, vx: v[0], vy: v[1] });
      });
    } else if (e.pattern === 1) {
      fanPattern(n, aimAngle(player.x, player.y, e.x, e.y), Math.PI / 3, sp).forEach(function (v) {
        ebullets.push({ x: e.x, y: e.y + 8, vx: v[0], vy: v[1] });
      });
    } else {
      ebullets.push({ x: e.x, y: e.y + 8, vx: 0, vy: sp * 1.6 });
    }
  }
  function bossFire(boss) {
    boss.fireT--;
    if (boss.fireT > 0) return;
    boss.phase = Math.floor((1 - boss.hp / boss.maxHp) * 3); // 血越少阶段越高
    if (boss.phase === 0) {
      boss.fireT = 55;
      ringPattern(boss.ringN, D.speed * 0.9, 0, 0, null).forEach(function (v) {
        ebullets.push({ x: boss.x, y: boss.y + 12, vx: v[0], vy: v[1] });
      });
    } else if (boss.phase === 1) {
      boss.fireT = 12;
      spiralAng += 0.35;
      var v = spiralPattern(D.speed * 1.2, spiralAng);
      ebullets.push({ x: boss.x, y: boss.y + 12, vx: v[0], vy: v[1] });
    } else {
      boss.fireT = 70;
      fanPattern(5, aimAngle(player.x, player.y, boss.x, boss.y), Math.PI / 4, D.speed * 1.3).forEach(function (v) {
        ebullets.push({ x: boss.x, y: boss.y + 12, vx: v[0], vy: v[1] });
      });
      ringPattern(8, D.speed * 0.7, 0, 0, null).forEach(function (v) {
        ebullets.push({ x: boss.x, y: boss.y + 12, vx: v[0], vy: v[1] });
      });
    }
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, W, H);
    // 玩家（受击无敌期间闪烁）
    if (invT <= 0 || Math.floor(invT / 6) % 2 === 0) {
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(player.x, player.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(player.x, player.y, HIT_R, 0, Math.PI * 2); ctx.fill();
    }
    // 玩家子弹
    ctx.fillStyle = '#39ff14';
    playerBullets.forEach(function (b) { ctx.fillRect(b.x - 1.5, b.y - 6, 3, 10); });
    // 敌机
    enemies.forEach(function (e) {
      ctx.fillStyle = '#ff2d95';
      ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI * 2); ctx.fill();
    });
    // Boss
    if (boss) {
      ctx.fillStyle = '#b967ff';
      ctx.fillRect(boss.x - 24, boss.y - 14, 48, 28);
      ctx.fillStyle = '#0a0a18'; ctx.fillRect(boss.x - 20, boss.y - 9, 40, 4);
      ctx.fillStyle = '#39ff14'; ctx.fillRect(boss.x - 20, boss.y - 9, 40 * boss.hp / boss.maxHp, 4);
    }
    // 敌方弹幕
    ebullets.forEach(function (b) {
      ctx.fillStyle = b.grazed ? '#ffe600' : '#ff2d95';
      ctx.beginPath(); ctx.arc(b.x, b.y, SHOT_R, 0, Math.PI * 2); ctx.fill();
    });
    // 特效
    effects.forEach(function (e) {
      ctx.fillStyle = 'rgba(255,230,0,' + Math.min(1, e.t / 20) + ')';
      ctx.beginPath(); ctx.arc(e.x, e.y, (e.big ? 30 : 12) * Math.max(0, 1 - e.t / 40), 0, Math.PI * 2); ctx.fill();
    });
    if (over && gameOver) {
      msgEl.textContent = T('gs.bullethell.dead').replace('{n}', score);
      msgEl.style.color = 'var(--neon-pink)';
    } else if (won) {
      msgEl.textContent = T('gs.bullethell.win').replace('{n}', score);
      msgEl.style.color = 'var(--neon-green)';
    }
  }

  function togglePause() {
    if (over || won) return;
    paused = !paused;
    if (paused) {
      // 暂停提示写在 toggle 里（draw 暂停期间不执行，写 draw 里永远不显示）
      msgEl.textContent = T('gs.bullethell.paused');
      msgEl.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      if (!gameOver && !won) { msgEl.textContent = ''; }
      if (loopApi) loopApi.resume();
    }
  }

  /* ---------- 输入 ---------- */
  Arcade.input.onKeys({
    left: function () { keys.left = true; }, right: function () { keys.right = true; },
    up: function () { keys.up = true; }, down: function () { keys.down = true; },
    action: togglePause
  });
  // 方向键松开清除（修复按键粘滞：onKeys 无 keyup 回调）
  document.addEventListener('keyup', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = false;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = false;
  });
  // P 键暂停（与提示文案一致）
  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P') togglePause();
  });
  var touchId = null, touchLast = null;
  canvas.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    touchId = t.identifier;
    touchLast = { x: t.clientX, y: t.clientY };
  });
  canvas.addEventListener('touchmove', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        var t = e.changedTouches[i];
        var dx = t.clientX - touchLast.x, dy = t.clientY - touchLast.y;
        touchLast = { x: t.clientX, y: t.clientY };
        player.x = Math.max(12, Math.min(W - 12, player.x + dx));
        player.y = Math.max(12, Math.min(H - 12, player.y + dy));
      }
    }
  });
  canvas.addEventListener('touchend', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) touchId = null;
    }
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

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.bullethell.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    if (loopApi) loopApi.stop();
    newGame();
    loopApi = Arcade.loop.start(update, draw, 16);
  };

  // 初始化
  newGame();
  loopApi = Arcade.loop.start(update, draw, 16);


})();
