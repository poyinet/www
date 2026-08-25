/* 青蛙过河 Frog Crossing —— 批次B 经典街机 */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.frogcross.tut1t'), d: T('gs.frogcross.tut1') },
  { t: T('gs.frogcross.tut2t'), d: T('gs.frogcross.tut2') },
  { t: T('gs.frogcross.tut3t'), d: T('gs.frogcross.tut3') },
  { t: T('gs.frogcross.tut4t'), d: T('gs.frogcross.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var W = 460, H = 500;
  var LANES = 8, LANE_H = H / LANES; // 0 顶部安全区 … 7 底部出发区
  var FROG_SIZE = 26;
  var SAFE_TOP = 0;           // 第 0 行
  var RIVER_START = 1, RIVER_END = 4; // 第 1~4 行是河
  var ROAD_START = 5, ROAD_END = 6;   // 第 5~6 行是车道
  var START_LANE = 7;                 // 出发区

  var frog, cars, logs, deaths, startTs, over, won, paused, loopApi, keys;

  function makeCars() {
    cars = [];
    var rows = [
      { lane: 5, dir: 1, speed: 2.2, gap: 110, w: 44 },
      { lane: 6, dir: -1, speed: 3.0, gap: 130, w: 52 }
    ];
    rows.forEach(function (cfg) {
      for (var x = 0; x < W + 80; x += cfg.gap) {
        cars.push({ lane: cfg.lane, x: x + Math.random() * 30, dir: cfg.dir, speed: cfg.speed, w: cfg.w, h: 20 });
      }
    });
  }
  function makeLogs() {
    logs = [];
    var rows = [
      { lane: 1, dir: 1, speed: 1.4, gap: 200, w: 90 },
      { lane: 2, dir: -1, speed: 1.8, gap: 230, w: 100 },
      { lane: 3, dir: 1, speed: 2.2, gap: 260, w: 110 },
      { lane: 4, dir: -1, speed: 1.6, gap: 215, w: 95 }
    ];
    rows.forEach(function (cfg) {
      for (var x = -cfg.w; x < W + 80; x += cfg.gap) {
        logs.push({ lane: cfg.lane, x: x + Math.random() * 40, dir: cfg.dir, speed: cfg.speed, w: cfg.w, h: 26 });
      }
    });
  }

  function reset() {
    frog = { x: W / 2 - FROG_SIZE / 2, y: START_LANE * LANE_H + LANE_H / 2 - FROG_SIZE / 2, lane: START_LANE };
    makeCars(); makeLogs();
    deaths = 0; startTs = Date.now(); over = false; won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'fr-wrap';
  wrap.innerHTML =
    '<canvas class="fr-canvas" id="fr-canvas" width="' + W + '" height="' + H + '"></canvas>' +
    '<div class="fr-top"><span>' + T('gs.frogcross.time') + ' <span id="fr-time">0s</span></span><span>' + T('gs.frogcross.deaths') + ' <span id="fr-deaths">0</span></span></div>' +
    '<div class="fr-msg" id="fr-msg">' + T('gs.frogcross.hint') + '</div>' +
    '<div class="game-controls">' +
    '  <button id="fr-pause" class="btn green">⏸ ' + T('gs.frogcross.pause') + '</button>' +
    '  <button id="fr-restart" class="btn purple">' + T('gs.frogcross.restart') + '</button>' +
    '</div>';
  root.appendChild(wrap);
  var canvas = wrap.querySelector('#fr-canvas'), ctx = canvas.getContext('2d'),
      timeEl = wrap.querySelector('#fr-time'), deathsEl = wrap.querySelector('#fr-deaths'),
      msg = wrap.querySelector('#fr-msg'), restartBtn = wrap.querySelector('#fr-restart');
  keys = { up: false, down: false, left: false, right: false };

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) { msg.textContent = T('gs.frogcross.paused'); msg.style.color = 'var(--neon-yellow)'; if (loopApi) loopApi.pause(); }
    else { msg.textContent = T('gs.frogcross.hint'); msg.style.color = ''; if (loopApi) loopApi.resume(); }
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function move(dir) {
    if (over) return;
    var step = LANE_H;
    if (dir === 'up') { frog.y -= step; frog.lane--; }
    else if (dir === 'down') { frog.y += step; frog.lane++; }
    else if (dir === 'left') frog.x -= step;
    else if (dir === 'right') frog.x += step;
    frog.x = Math.max(0, Math.min(W - FROG_SIZE, frog.x));
    if (frog.lane < 0) frog.lane = 0;
    if (frog.lane > START_LANE) { frog.lane = START_LANE; frog.y = START_LANE * LANE_H + LANE_H / 2 - FROG_SIZE / 2; }
    if (Arcade.juice) Arcade.juice.move();
    checkFrog();
  }

  function frogCenter() { return { x: frog.x + FROG_SIZE / 2, y: frog.y + FROG_SIZE / 2 }; }

  function checkFrog() {
    var lane = frog.lane;
    if (lane === SAFE_TOP) { // 抵达安全区
      if (!won) {
        won = true; over = true;
        var sec = Math.round((Date.now() - startTs) / 1000);
        msg.textContent = T('gs.frogcross.win').replace('{n}', sec);
        msg.style.color = 'var(--neon-green)';
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(sec);
      }
      return;
    }
    var fc = frogCenter();
    // 车道：撞车失败
    if (lane >= ROAD_START && lane <= ROAD_END) {
      for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        if (c.lane !== lane) continue;
        if (fc.x > c.x - 6 && fc.x < c.x + c.w + 6) { die(); return; }
      }
      return;
    }
    // 河流：必须踩浮木
    if (lane >= RIVER_START && lane <= RIVER_END) {
      var onLog = null;
      for (var j = 0; j < logs.length; j++) {
        var lg = logs[j];
        if (lg.lane !== lane) continue;
        if (fc.x > lg.x && fc.x < lg.x + lg.w) { onLog = lg; break; }
      }
      if (!onLog) { die(); return; }
    }
  }

  function die() {
    deaths++; deathsEl.textContent = deaths;
    if (Arcade.juice) Arcade.juice.lose();
    frog = { x: W / 2 - FROG_SIZE / 2, y: START_LANE * LANE_H + LANE_H / 2 - FROG_SIZE / 2, lane: START_LANE };
    msg.textContent = T('gs.frogcross.die');
    msg.style.color = 'var(--neon-pink)';
    setTimeout(function () { msg.textContent = T('gs.frogcross.hint'); msg.style.color = ''; }, 800);
  }

  function update() {
    if (over) return;
    // 车辆/浮木移动
    cars.forEach(function (c) {
      c.x += c.dir * c.speed;
      if (c.x > W + 100) c.x = -c.w;
      if (c.x + c.w < -100) c.x = W + 40;
    });
    logs.forEach(function (lg) {
      lg.x += lg.dir * lg.speed;
      if (lg.x > W + 100) lg.x = -lg.w;
      if (lg.x + lg.w < -100) lg.x = W + 40;
    });
    // 青蛙在浮木上随木漂流
    var lane = frog.lane;
    if (lane >= RIVER_START && lane <= RIVER_END) {
      var fc = frogCenter(), onLog = null;
      for (var j = 0; j < logs.length; j++) {
        var lg = logs[j];
        if (lg.lane !== lane) continue;
        if (fc.x > lg.x && fc.x < lg.x + lg.w) { onLog = lg; break; }
      }
      if (onLog) frog.x += onLog.dir * onLog.speed;
      else { die(); return; }
    }
    frog.x = Math.max(0, Math.min(W - FROG_SIZE, frog.x));
    // 计时
    var sec = Math.round((Date.now() - startTs) / 1000);
    timeEl.textContent = sec + 's';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 行背景
    for (var l = 0; l < LANES; l++) {
      var y = l * LANE_H;
      if (l === SAFE_TOP) ctx.fillStyle = '#0d2413';
      else if (l >= RIVER_START && l <= RIVER_END) ctx.fillStyle = '#0a1a33';
      else if (l >= ROAD_START && l <= ROAD_END) ctx.fillStyle = '#1a1410';
      else ctx.fillStyle = '#12121c';
      ctx.fillRect(0, y, W, LANE_H);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeRect(0, y, W, LANE_H);
    }
    // 浮木
    logs.forEach(function (lg) {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(lg.x, lg.lane * LANE_H + LANE_H / 2 - lg.h / 2, lg.w, lg.h);
    });
    // 车辆
    cars.forEach(function (c) {
      ctx.fillStyle = c.dir > 0 ? '#ff2d95' : '#b967ff';
      ctx.fillRect(c.x, c.lane * LANE_H + LANE_H / 2 - c.h / 2, c.w, c.h);
    });
    // 安全区标记
    ctx.fillStyle = 'rgba(57,255,20,0.5)';
    ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(T('gs.frogcross.goal'), W / 2, LANE_H / 2 + 4);
    // 青蛙
    if (!over || won) {
      ctx.fillStyle = '#39ff14';
      ctx.beginPath(); ctx.arc(frog.x + FROG_SIZE / 2, frog.y + FROG_SIZE / 2, FROG_SIZE / 2 - 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#0a0a12';
      ctx.beginPath(); ctx.arc(frog.x + FROG_SIZE / 2 - 5, frog.y + FROG_SIZE / 2 - 5, 2.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(frog.x + FROG_SIZE / 2 + 5, frog.y + FROG_SIZE / 2 - 5, 2.5, 0, 7); ctx.fill();
    }
  }

  Arcade.input.onKeys({ up: function () { move('up'); }, down: function () { move('down'); }, left: function () { move('left'); }, right: function () { move('right'); } });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyP') togglePause(); });
  var pauseBtn = document.getElementById('fr-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', function () { togglePause(); });

  if (Arcade.input && Arcade.input.isTouch()) {
    var dpad = Arcade.input.createDPad(root, function (dir, pressed) { if (pressed) move(dir); });
    dpad.className += ' fr-dpad';
  }

  restartBtn.addEventListener('click', function () { reset(); deathsEl.textContent = '0'; timeEl.textContent = '0s'; msg.textContent = T('gs.frogcross.hint'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.frogcross.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); deathsEl.textContent = '0'; timeEl.textContent = '0s'; msg.textContent = T('gs.frogcross.hint'); msg.style.color = ''; };

  reset();
  loopApi = Arcade.loop.start(update, draw, 16);

})();
