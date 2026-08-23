/* ============================================================
   贪吃蛇：Canvas 400x400（20x20 格）
   方向入队防 180° 掉头；吃食 +10 分并加速；撞墙/撞己/撞障碍结束
   提质：4 模式(经典/穿墙/障碍/加速) × 3 难度，开局菜单，障碍程序生成
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.snake.tut1t'), d: T('gs.snake.tut1') },
    { t: T('gs.snake.tut2t'), d: T('gs.snake.tut2') },
    { t: T('gs.snake.tut3t'), d: T('gs.snake.tut3') }
  ];

  var GRID = 20;          // 20x20 格
  var CELL = 20;          // 每格像素 → 400x400
  var STEP_START = 130;   // 初始步长 ms（菜单选择会覆盖）
  var STEP_MIN = 70;      // 最快步长
  var STEP_DELTA = 3;     // 每吃一个食物减少的步长

  var MODES = {
    classic: { name: 'gs.snake.modeClassic', wrap: false, obstacle: false, autoAccel: false, sprint: false },
    wrap:     { name: 'gs.snake.modeWrap', wrap: true,  obstacle: false, autoAccel: false, sprint: false },
    obstacle: { name: 'gs.snake.modeObstacle', wrap: false, obstacle: true,  autoAccel: false, sprint: false },
    speed:    { name: 'gs.snake.modeSpeed', wrap: false, obstacle: false, autoAccel: true,  sprint: false },
    sprint:   { name: 'gs.snake.modeSprint', wrap: true,  obstacle: false, autoAccel: false, sprint: true }
  };
  var DIFFS = {
    easy:   { name: 'gs.snake.dEasy', start: 150, obs: 4,  accel: 0.35 },
    normal: { name: 'gs.snake.dNormal', start: 120, obs: 9,  accel: 0.60 },
    hard:   { name: 'gs.snake.dHard', start: 90,  obs: 15, accel: 0.95 }
  };

  root.innerHTML =
    '<div class="snake-menu" id="menu">' +
    '  <div class="snake-menu-title">' + T('gs.snake.chooseMode') + '</div>' +
    '  <div class="snake-mode-row" id="mode-row">' +
    '    <button class="mode-btn selected" data-mode="classic">' + T('gs.snake.modeClassic') + '</button>' +
    '    <button class="mode-btn" data-mode="wrap">' + T('gs.snake.modeWrap') + '</button>' +
    '    <button class="mode-btn" data-mode="obstacle">' + T('gs.snake.modeObstacle') + '</button>' +
    '    <button class="mode-btn" data-mode="speed">' + T('gs.snake.modeSpeed') + '</button>' +
    '    <button class="mode-btn" data-mode="sprint">' + T('gs.snake.modeSprintBtn') + '</button>' +
    '  </div>' +
    '  <div class="snake-menu-title">' + T('gs.snake.chooseDiff') + '</div>' +
    '  <div class="snake-mode-row" id="diff-row">' +
    '    <button class="mode-btn" data-diff="easy">' + T('gs.snake.dEasy') + '</button>' +
    '    <button class="mode-btn selected" data-diff="normal">' + T('gs.snake.dNormal') + '</button>' +
    '    <button class="mode-btn" data-diff="hard">' + T('gs.snake.dHard') + '</button>' +
    '  </div>' +
    '  <button class="btn green" id="start-btn">' + T('gs.snake.start') + '</button>' +
    '  <div class="game-message" id="msg"></div>' +
    '</div>' +
    '<div class="snake-stage hidden" id="stage">' +
    '  <canvas id="board" class="game-canvas" width="400" height="400"></canvas>' +
    '  <div class="snake-overlay hidden" id="overlay">' +
    '    <div class="snake-overlay-title">' + T('gs.snake.gameOver') + '</div>' +
    '    <div class="snake-overlay-score">' + T('gs.snake.score') + ' <span id="final-score">0</span></div>' +
    '    <button id="restart-btn" class="btn green">' + T('gs.snake.restart') + '</button>' +
    '    <button id="menu-btn" class="btn">' + T('gs.snake.changeMode') + '</button>' +
    '  </div>' +
    '</div>' +
    '<div class="game-stats hidden" id="stats">' +
    '  <span>' + T('gs.snake.score') + ' <span class="stat-value" id="score">0</span></span>' +
    '  <span>' + T('gs.snake.length') + ' <span class="stat-value" id="len">3</span></span>' +
    '  <span id="sprint-time" style="display:none">⏱ <span class="stat-value" id="sprint-val">60</span>s</span>' +
    '</div>' +
    '<div id="dpad-holder"></div>' +
    '<p class="help-text hidden" id="help">' + T('gs.snake.help') + '</p>';

  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  if (Arcade.input && Arcade.input.hiDPI) Arcade.input.hiDPI(canvas);
  var msgEl = document.getElementById('msg');
  var scoreEl = document.getElementById('score');
  var lenEl = document.getElementById('len');
  var overlayEl = document.getElementById('overlay');
  var finalScoreEl = document.getElementById('final-score');
  var restartBtn = document.getElementById('restart-btn');
  var menuBtn = document.getElementById('menu-btn');
  var menuEl = document.getElementById('menu');
  var stageEl = document.getElementById('stage');
  var statsEl = document.getElementById('stats');
  var helpEl = document.getElementById('help');
  var startBtn = document.getElementById('start-btn');
  var modeRow = document.getElementById('mode-row');
  var diffRow = document.getElementById('diff-row');

  var snake, food, obstacles, dir, dirQueue, score, stepMs, gameOver, paused;
  var mode, difficulty, selectedMode, selectedDiff, menuActive;
  var gameLoop, sprintStart = 0;

  function init() {
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    score = 0;
    gameOver = false;
    paused = false;
    var d = DIFFS[difficulty];
    stepMs = mode.autoAccel ? Math.round(d.start * 1.8) : d.start;
    obstacles = [];
    if (mode.obstacle) placeObstacles(d.obs);
    placeFood();
    sprintStart = Date.now();
    scoreEl.textContent = '0';
    lenEl.textContent = String(snake.length);
    var st = document.getElementById('sprint-time');
    if (st) st.style.display = mode.sprint ? '' : 'none';
    var sv = document.getElementById('sprint-val');
    if (sv) sv.textContent = '60';
    msgEl.textContent = (mode.sprint ? T('gs.snake.sprintMsg') : T(mode.name) + ' · ' + T(d.name)) + ' · ' + T('gs.snake.pauseHint');
    overlayEl.classList.add('hidden');
  }

  function placeFood() {
    while (true) {
      var x = Math.floor(Math.random() * GRID);
      var y = Math.floor(Math.random() * GRID);
      var onSnake = false;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) { onSnake = true; break; }
      }
      if (onSnake) continue;
      var onObs = false;
      for (var k = 0; k < obstacles.length; k++) {
        if (obstacles[k].x === x && obstacles[k].y === y) { onObs = true; break; }
      }
      if (onObs) continue;
      food = { x: x, y: y };
      return;
    }
  }

  function placeObstacles(n) {
    obstacles = [];
    var tries = 0;
    while (obstacles.length < n && tries < 600) {
      tries++;
      var x = Math.floor(Math.random() * GRID);
      var y = Math.floor(Math.random() * GRID);
      if (Math.abs(x - 9) <= 2 && Math.abs(y - 10) <= 2) continue; // 避开蛇初始区
      var bad = false;
      for (var i = 0; i < snake.length; i++) if (snake[i].x === x && snake[i].y === y) { bad = true; break; }
      if (bad) continue;
      for (var k = 0; k < obstacles.length; k++) if (obstacles[k].x === x && obstacles[k].y === y) { bad = true; break; }
      if (bad) continue;
      obstacles.push({ x: x, y: y });
    }
  }

  /* 方向入队：与队尾方向相同或相反则忽略（防 180° 掉头），每步只消费一个 */
  function queueDir(nx, ny) {
    if (gameOver || paused || menuActive) return;
    var last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if ((last.x === nx && last.y === ny) || (last.x === -nx && last.y === -ny)) return;
    if (dirQueue.length < 3) dirQueue.push({ x: nx, y: ny });
  }

  function update() {
    if (gameOver || paused) return;
    if (mode.sprint) {
      var left = 60 - Math.floor((Date.now() - sprintStart) / 1000);
      // 冲刺倒计时渲染到可见 HUD（此前写在隐藏菜单 #msg 里，玩家看不到剩余秒数）
      var sv = document.getElementById('sprint-val');
      if (sv) sv.textContent = Math.max(0, left);
      if (left <= 0) {
        score += 30; // 存活奖励
        endGame(true);
        return;
      }
      msgEl.textContent = T('gs.snake.sprintLeft').replace('{n}', left).replace('{s}', score) + ' · ' + T('gs.snake.pauseHint');
    }
    if (dirQueue.length) dir = dirQueue.shift();

    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (mode.wrap) {
      head.x = (head.x + GRID) % GRID;
      head.y = (head.y + GRID) % GRID;
    } else if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      return endGame();
    }

    // 撞障碍
    for (var oi = 0; oi < obstacles.length; oi++) {
      if (obstacles[oi].x === head.x && obstacles[oi].y === head.y) return endGame();
    }

    var eating = head.x === food.x && head.y === food.y;
    // 撞自己（不吃时尾巴本步会让位，故排除尾格）
    var limit = eating ? snake.length : snake.length - 1;
    for (var i = 0; i < limit; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) return endGame();
    }

    snake.unshift(head);
    if (eating) {
      score += 10;
      scoreEl.textContent = String(score);
      lenEl.textContent = String(snake.length);
      stepMs = Math.max(STEP_MIN, stepMs - STEP_DELTA);
      if (mode.autoAccel) stepMs = Math.max(STEP_MIN, stepMs - DIFFS[difficulty].accel * 4);
      gameLoop.setStep(stepMs);
      var rct = canvas.getBoundingClientRect();
      Arcade.juice.coin(
        rct.left + (food.x * CELL + CELL / 2) * (rct.width / canvas.width),
        rct.top + (food.y * CELL + CELL / 2) * (rct.height / canvas.height),
        '#ff2d95'
      );
      placeFood();
    } else {
      snake.pop();
    }

    if (mode.autoAccel) {
      stepMs = Math.max(STEP_MIN, stepMs - DIFFS[difficulty].accel);
      gameLoop.setStep(stepMs);
    }
  }

  function endGame(sprintWin) {
    gameOver = true;
    gameLoop.pause();
    finalScoreEl.textContent = String(score);
    overlayEl.classList.remove('hidden');
    if (sprintWin) {
      if (Arcade.juice) Arcade.juice.win();
      // 修正：标题元素类名是 .snake-overlay-title（此前 .ov-title 选不中，冲刺胜利标题不更新）
      var ovTitle = document.querySelector('.snake-overlay-title');
      if (ovTitle) ovTitle.textContent = T('gs.snake.sprintDone');
    } else {
      if (Arcade.juice) Arcade.juice.lose();
    }
    Arcade.shell.submitScore(score);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render() {
    // 背景
    ctx.fillStyle = '#07070d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 淡网格线
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 1; i < GRID; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, canvas.height);
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(canvas.width, i * CELL + 0.5);
    }
    ctx.stroke();

    // 障碍：暗蓝灰块
    for (var oi = 0; oi < obstacles.length; oi++) {
      var o = obstacles[oi];
      ctx.save();
      ctx.fillStyle = '#3a3a5a';
      ctx.shadowColor = '#5a5a8a';
      ctx.shadowBlur = 4;
      roundRect(o.x * CELL + 2, o.y * CELL + 2, CELL - 4, CELL - 4, 4);
      ctx.fill();
      ctx.restore();
    }

    // 食物：粉色脉动
    var pulse = 1 + Math.sin(Date.now() / 180) * 0.15;
    ctx.save();
    ctx.shadowColor = '#ff2d95';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff2d95';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, (CELL / 2 - 4) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 蛇身：霓虹绿渐变发光，蛇头更亮（先画尾后画头）
    for (var j = snake.length - 1; j >= 0; j--) {
      var seg = snake[j];
      var t = snake.length <= 1 ? 0 : j / (snake.length - 1); // 0=头 1=尾
      var light = Math.round(62 - t * 40); // 亮度 62% → 22%
      ctx.save();
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = j === 0 ? 18 : 10;
      ctx.fillStyle = j === 0 ? '#b9ffb0' : 'hsl(115, 100%, ' + light + '%)';
      roundRect(seg.x * CELL + 1.5, seg.y * CELL + 1.5, CELL - 3, CELL - 3, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  function togglePause() {
    if (menuActive || gameOver) return;
    paused = !paused;
    msgEl.textContent = paused ? T('gs.snake.paused') : T(mode.name) + ' · ' + T(DIFFS[difficulty].name) + ' · ' + T('gs.snake.pauseHint');
  }

  function startGame() {
    mode = MODES[selectedMode];
    difficulty = selectedDiff;
    menuEl.classList.add('hidden');
    stageEl.classList.remove('hidden');
    statsEl.classList.remove('hidden');
    helpEl.classList.remove('hidden');
    menuActive = false;
    init();
    if (gameLoop) { gameLoop.setStep(stepMs); gameLoop.resume(); }
    else gameLoop = Arcade.loop.start(update, render, stepMs);
  }

  function backToMenu() {
    if (gameLoop) gameLoop.pause();
    stageEl.classList.add('hidden');
    statsEl.classList.add('hidden');
    helpEl.classList.add('hidden');
    overlayEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    menuActive = true;
  }

  function dirByName(name) {
    if (name === 'up') queueDir(0, -1);
    else if (name === 'down') queueDir(0, 1);
    else if (name === 'left') queueDir(-1, 0);
    else if (name === 'right') queueDir(1, 0);
  }

  function highlight(row, attr, val) {
    var btns = row.getElementsByTagName('button');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.getAttribute(attr) === val) b.classList.add('selected');
      else b.classList.remove('selected');
    }
  }

  modeRow.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    selectedMode = b.getAttribute('data-mode');
    highlight(modeRow, 'data-mode', selectedMode);
  });
  diffRow.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    selectedDiff = b.getAttribute('data-diff');
    highlight(diffRow, 'data-diff', selectedDiff);
  });
  startBtn.addEventListener('click', startGame);
  menuBtn.addEventListener('click', backToMenu);

  Arcade.input.onKeys({
    up: function () { queueDir(0, -1); },
    down: function () { queueDir(0, 1); },
    left: function () { queueDir(-1, 0); },
    right: function () { queueDir(1, 0); },
    action: togglePause
  });

  Arcade.input.onSwipe(canvas, dirByName);

  if (Arcade.input.isTouch()) {
    Arcade.input.createDPad(document.getElementById('dpad-holder'), function (dir, pressed) { if (pressed) dirByName(dir); });
  }

  restartBtn.addEventListener('click', function () {
    init();
    gameLoop.setStep(stepMs);
    if (!gameLoop.isRunning()) gameLoop.resume();
  });

  // 初始停在菜单
  selectedMode = 'classic';
  selectedDiff = 'normal';
  menuActive = true;
  highlight(modeRow, 'data-mode', selectedMode);
  highlight(diffRow, 'data-diff', selectedDiff);
  window.GAME_RESTART = function () {
    // 从未开局（菜单态）时点「重开」也要能直接开局
    if (!mode) {
      mode = MODES[selectedMode || 'classic'];
      difficulty = selectedDiff || 'normal';
      menuEl.classList.add('hidden');
      stageEl.classList.remove('hidden');
      statsEl.classList.remove('hidden');
      helpEl.classList.remove('hidden');
      menuActive = false;
    }
    init();
    if (gameLoop) { gameLoop.setStep(stepMs); gameLoop.resume(); }
    else gameLoop = Arcade.loop.start(update, render, stepMs);
  };

})();