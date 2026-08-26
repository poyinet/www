/* ============================================================
   接物大作战：移动篮子接住下落好物，躲开炸弹（高分优）
   🍎+1 ⭐+3 💎+5 💣-1 命；3 条命；速度与密度每 15 秒提一档
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.catch.tut1t'), d: T('gs.catch.tut1') },
    { t: T('gs.catch.tut2t'), d: T('gs.catch.tut2') },
    { t: T('gs.catch.tut3t'), d: T('gs.catch.tut3') }
  ];

  root.innerHTML =
    '<div class="game-stats">' +
    '  <span>' + T('gs.catch.hudScore') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.catch.hudLives') + ' <span class="stat-value" id="lives">❤️❤️❤️</span></span>' +
    '  <span>' + T('gs.catch.hudLevel') + ' <span class="stat-value" id="level">' + T('gs.catch.lvFmt').replace('{n}', 1) + '</span></span>' +
    '</div>' +
    '<div class="catch-stage">' +
    '  <canvas id="cv" class="game-canvas" width="400" height="500"></canvas>' +
    '  <div class="game-overlay" id="overlay" hidden>' +
    '    <div class="ov-title">' + T('gs.catch.ovTitle') + '</div>' +
    '    <div class="ov-score">' + T('gs.catch.hudScore') + '<b id="final-score">0</b></div>' +
    '    <div class="ov-record" id="ov-record"></div>' +
    '    <button id="restart-btn" class="btn green">' + T('gs.catch.btnRestart') + '</button>' +
    '  </div>' +
    '</div>' +
    '<p class="help-text">' + T('gs.catch.help') + '</p>';

  var W = 400, H = 500;
  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var scoreEl = document.getElementById('score');
  var livesEl = document.getElementById('lives');
  var levelEl = document.getElementById('level');
  var overlay = document.getElementById('overlay');
  var finalScoreEl = document.getElementById('final-score');
  var recordEl = document.getElementById('ov-record');
  var restartBtn = document.getElementById('restart-btn');

  /* 下落物类型：分值 / 生成权重 / 是否炸弹 */
  var TYPES = [
    { emoji: '🍎', score: 1, weight: 45, bomb: false, color: '#ff5c74' },
    { emoji: '⭐', score: 3, weight: 25, bomb: false, color: '#ffe600' },
    { emoji: '💎', score: 5, weight: 15, bomb: false, color: '#00f0ff' },
    { emoji: '💣', score: 0, weight: 15, bomb: true,  color: '#ff2d95' }
  ];
  var TOTAL_WEIGHT = 100;
  var ITEM_R = 16;

  var basket = { x: W / 2, w: 68, y: H - 46 };
  var items, floats, score, lives, level, elapsedMs, spawnIn, bounceT, playing, flashT;
  var keys = { left: false, right: false };
  var paused = false, loopApi = null;
  var helpEl = document.querySelector('.help-text');

  function togglePause() {
    paused = !paused;
    if (paused) {
      helpEl.textContent = T('gs.catch.paused');
      helpEl.style.color = 'var(--neon-yellow)';
      if (loopApi) loopApi.pause();
    } else {
      helpEl.textContent = T('gs.catch.helpMove');
      helpEl.style.color = '';
      if (loopApi) loopApi.resume();
    }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function init() {
    items = [];
    floats = [];
    score = 0;
    lives = 3;
    level = 1;
    elapsedMs = 0;
    spawnIn = 40;
    bounceT = 0;
    flashT = 0;
    playing = true;
    basket.x = W / 2;
    scoreEl.textContent = '0';
    livesEl.textContent = '❤️❤️❤️';
    levelEl.textContent = T('gs.catch.lvFmt').replace('{n}', 1);
    overlay.hidden = true;
  }

  function pickType() {
    var r = Math.random() * TOTAL_WEIGHT;
    for (var i = 0; i < TYPES.length; i++) {
      if (r < TYPES[i].weight) return TYPES[i];
      r -= TYPES[i].weight;
    }
    return TYPES[0];
  }

  function addFloat(x, y, text, color) {
    floats.push({ x: x, y: y, text: text, color: color, life: 45 });
  }

  function updateStats() {
    scoreEl.textContent = score;
    var hearts = '';
    for (var i = 0; i < lives; i++) hearts += '❤️';
    livesEl.textContent = hearts || '💔';
    levelEl.textContent = 'Lv.' + level;
  }

  function gameOver() {
    playing = false;
    finalScoreEl.textContent = score;
    var isNew = Arcade.shell.submitScore(score);
    recordEl.textContent = isNew ? T('gs.catch.newRecord') : '';
    overlay.hidden = false;
  }

  function update() {
    if (!playing) return;
    elapsedMs += 16;

    /* 难度：每 15 秒提一档 */
    var lv = 1 + Math.floor(elapsedMs / 15000);
    if (lv !== level) {
      level = lv;
      levelEl.textContent = T('gs.catch.lvFmt').replace('{n}', level);
    }

    /* 键盘移动 */
    if (keys.left) basket.x -= 6;
    if (keys.right) basket.x += 6;
    basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, basket.x));

    /* 生成下落物：间隔随难度缩短 */
    spawnIn--;
    if (spawnIn <= 0) {
      var t = pickType();
      items.push({
        x: ITEM_R + Math.random() * (W - ITEM_R * 2),
        y: -ITEM_R,
        vy: (2 + level * 0.45) * (0.85 + Math.random() * 0.5),
        type: t
      });
      spawnIn = Math.max(58 - level * 5, 22) * (0.7 + Math.random() * 0.6);
    }

    /* 下落与接取判定 */
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.y += it.vy;
      var caught =
        it.y + ITEM_R >= basket.y &&
        it.y - ITEM_R <= basket.y + 22 &&
        Math.abs(it.x - basket.x) <= basket.w / 2 + ITEM_R - 6;
      if (caught) {
        items.splice(i, 1);
        bounceT = 10;
        if (it.type.bomb) {
          lives--;
          flashT = 12;
          addFloat(it.x, basket.y - 10, T('gs.catch.loseLife'), '#ff2d95');
          Arcade.juice.lose();
        } else {
          score += it.type.score;
          addFloat(it.x, basket.y - 10, '+' + it.type.score, it.type.color);
          var crt = cv.getBoundingClientRect();
          Arcade.juice.coin(
            crt.left + it.x * (crt.width / cv.width),
            crt.top + it.y * (crt.height / cv.height),
            it.type.color
          );
        }
        updateStats();
        if (lives <= 0) { gameOver(); return; }
      } else if (it.y - ITEM_R > H) {
        items.splice(i, 1);
        // 漏接非炸弹物品扣一条命（此前无惩罚可无限挂机刷分，榜单失去意义）
        if (!it.type.bomb) {
          lives--;
          flashT = 12;
          addFloat(it.x, H - 40, T('gs.catch.miss'), '#ff2d95');
          if (Arcade.audio) Arcade.audio.play('error');
          updateStats();
          if (lives <= 0) { gameOver(); return; }
        }
      }
    }

    /* 飘字 */
    for (var j = floats.length - 1; j >= 0; j--) {
      floats[j].y -= 0.7;
      floats[j].life--;
      if (floats[j].life <= 0) floats.splice(j, 1);
    }
    if (bounceT > 0) bounceT--;
    if (flashT > 0) flashT--;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    /* 背景：纵向渐变 + 速度感横线 */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0b18');
    g.addColorStop(1, '#07070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,240,255,0.05)';
    ctx.lineWidth = 1;
    for (var y = 60; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    /* 接弹红屏闪烁 */
    if (flashT > 0) {
      ctx.fillStyle = 'rgba(255,45,149,' + (flashT / 12 * 0.18) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    /* 下落物（emoji） */
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < items.length; i++) {
      ctx.fillText(items[i].type.emoji, items[i].x, items[i].y);
    }

    /* 篮子：接住时弹跳 + 发光底线 */
    var lift = bounceT > 0 ? -Math.sin((10 - bounceT) / 10 * Math.PI) * 8 : 0;
    ctx.save();
    ctx.shadowColor = 'rgba(57,255,20,0.8)';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(57,255,20,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(basket.x - basket.w / 2, basket.y + 22);
    ctx.lineTo(basket.x + basket.w / 2, basket.y + 22);
    ctx.stroke();
    ctx.restore();
    ctx.font = '40px sans-serif';
    ctx.fillText('🧺', basket.x, basket.y + 4 + lift);

    /* 得分飘字 */
    ctx.font = 'bold 15px sans-serif';
    for (var j = 0; j < floats.length; j++) {
      var f = floats[j];
      ctx.globalAlpha = Math.min(1, f.life / 20);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 输入 ---------- */

  function pointerX(e) {
    var rect = cv.getBoundingClientRect();
    return (e.clientX - rect.left) * (cv.width / rect.width);
  }

  function moveBasketTo(e) {
    if (!playing) return;
    // 桌面鼠标仅按下（拖动）时跟随，悬停不移动（触屏 pointermove 无 buttons 语义，恒为 true 路径）
    if (e.pointerType === 'mouse' && e.buttons === 0) return;
    basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, pointerX(e)));
  }

  cv.addEventListener('pointerdown', moveBasketTo);
  cv.addEventListener('pointermove', moveBasketTo);

  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keys.left = true; e.preventDefault(); }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = true; e.preventDefault(); }
    if (e.code === 'KeyP') togglePause();
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });

  restartBtn.addEventListener('click', init);

  init();
  loopApi = Arcade.loop.start(update, render, 16);
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.catch.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = init;
})();
