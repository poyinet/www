/* 西瓜合成 Watermelon Merge —— 横向新游戏 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.fruitmerge.tut1t'), d: T('gs.fruitmerge.tut1') },
  { t: T('gs.fruitmerge.tut2t'), d: T('gs.fruitmerge.tut2') },
  { t: T('gs.fruitmerge.tut3t'), d: T('gs.fruitmerge.tut3') },
  { t: T('gs.fruitmerge.tut4t'), d: T('gs.fruitmerge.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 440, H = 620;
  var FRUITS = ['🍇', '🍒', '🍊', '🍋', '🥝', '🍅', '🍑', '🍍', '🥥', '🍈', '🍉'];
  var GRAV = 0.22;

  var fruits, current, next, maxLevel, merges, over, paused, loopApi, aimX, dropCool;
  var runToken = 0; // 局数令牌：跨局定时器防护

  function setup() {
    runToken++; // 新一局使旧定时器失效
    fruits = [];
    current = 0;
    next = Math.min(3, 0 + Math.floor(Math.random() * 3));
    maxLevel = 0; merges = 0;
    over = false;
    aimX = W / 2;
    dropCool = 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'fm-wrap';
  wrap.innerHTML =
    '<canvas class="fm-canvas" id="fm-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="fm-top"><span>' + T('gs.fruitmerge.max') + ' <b id="fm-max">0</b></span><span>' + T('gs.fruitmerge.merges') + ' <b id="fm-merge">0</b></span><span>' + T('gs.fruitmerge.current') + ' <b id="fm-cur">🍇</b></span></div>' +
    '<div class="fm-msg" id="fm-msg">' + T('gs.fruitmerge.help') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="fm-restart">' + T('gs.fruitmerge.restart') + '</button></div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#fm-canvas'), ctx = canvas.getContext('2d'),
      maxEl = wrap.querySelector('#fm-max'), mergeEl = wrap.querySelector('#fm-merge'),
      curEl = wrap.querySelector('#fm-cur'), msg = wrap.querySelector('#fm-msg'),
      restartBtn = wrap.querySelector('#fm-restart');
      if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.fruitmerge.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.fruitmerge.help'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function drop() {
    if (over || dropCool > 0) return;
    dropCool = 18;
    var r = 11 + current * 2.4;
    fruits.push({ x: aimX, y: 46, vx: 0, vy: 0, lv: current, r: r });
    current = next;
    next = Math.min(10, current + Math.floor(Math.random() * 3));
    curEl.textContent = FRUITS[current];
    if (Arcade.audio) Arcade.audio.play('drop');
  }

  function update() {
    if (over) return;
    if (dropCool > 0) dropCool--;
    // 物理
    for (var i = 0; i < fruits.length; i++) {
      var f = fruits[i];
      f.vy += GRAV;
      f.y += f.vy;
      // 墙壁
      if (f.x - f.r < 0) { f.x = f.r; f.vx = Math.abs(f.vx) * 0.6; }
      if (f.x + f.r > W) { f.x = W - f.r; f.vx = -Math.abs(f.vx) * 0.6; }
      // 底部
      if (f.y + f.r > H - 10) { f.y = H - 10 - f.r; f.vy *= -0.35; if (Math.abs(f.vy) < 1) f.vy = 0; f.vx *= 0.8; }
      // 水果间碰撞
      for (var j = i + 1; j < fruits.length; j++) {
        var g = fruits[j];
        var dx = g.x - f.x, dy = g.y - f.y;
        var d = Math.hypot(dx, dy);
        var minD = f.r + g.r;
        if (d > 0 && d < minD) {
          // 相同等级 → 合并
          if (f.lv === g.lv && f.lv < 10) {
            merge(f, g);
            fruits.splice(j, 1);
            i--;
            break;
          }
          // 分开
          var push = (minD - d) / 2;
          var nx = dx / d, ny = dy / d;
          f.x -= nx * push * 0.5; f.y -= ny * push * 0.5;
          g.x += nx * push * 0.5; g.y += ny * push * 0.5;
          f.vx -= nx * 1.2; g.vx += nx * 1.2;
        }
      }
    }
    // 顶部越界判定
    for (var k = 0; k < fruits.length; k++) {
      if (fruits[k].y - fruits[k].r < 4 && fruits[k].vy < -3) {
        over = true;
        var score = maxLevel * 10 + merges;
        msg.textContent = T('gs.fruitmerge.dead').replace('{n}', score);
        msg.style.color = 'var(--neon-pink)';
        if (Arcade.juice) Arcade.juice.lose();
        if (Arcade.shell) Arcade.shell.submitScore(score);
        return;
      }
    }
  }

  function merge(a, b) {
    var newLv = a.lv + 1;
    if (newLv > maxLevel) maxLevel = newLv;
    merges++;
    // 合并点取两者中点，保持动量
    a.lv = newLv;
    a.r = 11 + newLv * 2.4;
    a.vx = (a.vx + b.vx) / 2;
    a.vy = (a.vy + b.vy) / 2 - 2;
    if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-yellow)', 10);
    if (Arcade.audio) Arcade.audio.play('merge');
    if (newLv === 10) {
      msg.textContent = T('gs.fruitmerge.watermelon');
      msg.style.color = 'var(--neon-yellow)';
      var run = runToken;
      setTimeout(function () {
        // 局数令牌：重开后旧定时器不再覆盖新一局文案（修复跨局竞态）
        if (!over && run === runToken) { msg.textContent = T('gs.fruitmerge.keepGoing'); msg.style.color = ''; }
      }, 1200);
    }
    maxEl.textContent = maxLevel;
    mergeEl.textContent = merges;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0f1e'; ctx.fillRect(0, 0, W, H);
    // 顶线
    ctx.strokeStyle = 'rgba(255,45,149,0.4)'; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(W, 12); ctx.stroke(); ctx.setLineDash([]);
    // 瞄准点
    ctx.fillStyle = 'rgba(255,230,0,0.3)';
    ctx.beginPath(); ctx.arc(aimX, 30, 8, 0, 7); ctx.fill();
    // 当前水果（预览在瞄准点）
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(FRUITS[current], aimX, 30);
    // 水果
    fruits.forEach(function (f) {
      ctx.font = (f.r * 2) + 'px sans-serif';
      ctx.fillText(FRUITS[f.lv], f.x, f.y);
    });
  }

  function moveAim(e) {
    var rect = canvas.getBoundingClientRect();
    var px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    aimX = Math.max(16, Math.min(W - 16, px * (W / rect.width)));
  }
  canvas.addEventListener('mousemove', moveAim);
  canvas.addEventListener('mousedown', function (e) { moveAim(e); drop(); });
  canvas.addEventListener('touchmove', function (e) { moveAim(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchstart', function (e) { moveAim(e); drop(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') aimX = Math.max(16, aimX - 20);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') aimX = Math.min(W - 16, aimX + 20);
    if (e.code === 'Space' || e.code === 'Enter') { drop(); e.preventDefault(); }
    if (e.code === 'KeyP') togglePause();
  });

  restartBtn.addEventListener('click', function () { setup(); maxEl.textContent = '0'; mergeEl.textContent = '0'; curEl.textContent = FRUITS[0]; msg.textContent = T('gs.fruitmerge.help'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.fruitmerge.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { setup(); maxEl.textContent = '0'; mergeEl.textContent = '0'; curEl.textContent = FRUITS[0]; msg.textContent = T('gs.fruitmerge.help'); msg.style.color = ''; };

  setup();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
