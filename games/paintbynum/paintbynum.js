/* 数字填色 Paint by Number —— 批次C 益智休闲 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.paintbynum.tut1t'), d: T('gs.paintbynum.tut1') },
  { t: T('gs.paintbynum.tut2t'), d: T('gs.paintbynum.tut2') },
  { t: T('gs.paintbynum.tut3t'), d: T('gs.paintbynum.tut3') },
  { t: T('gs.paintbynum.tut4t'), d: T('gs.paintbynum.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var N = 8;
  var PALETTE = ['#ff2d95', '#00f0ff', '#ffe600', '#39ff14', '#b967ff', '#ff9e2d'];

  /* 程序化图案：0=空白 1-6=颜色 */
  var ARTS = [
    { name: '火箭', grid: [
      [0,0,0,1,0,0,0,0],
      [0,0,1,1,1,0,0,0],
      [0,0,0,1,0,0,0,0],
      [0,0,0,3,0,0,0,0],
      [0,0,3,3,3,0,0,0],
      [0,3,3,3,3,3,0,0],
      [0,0,3,3,3,0,0,0],
      [0,0,3,3,3,0,0,0]] },
    { name: '心形', grid: [
      [0,1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0]] },
    { name: '星星', grid: [
      [0,0,0,5,0,0,0,0],
      [0,0,5,5,5,0,0,0],
      [0,5,5,5,5,5,0,0],
      [0,0,5,5,5,0,0,0],
      [0,5,5,5,5,5,0,0],
      [5,5,0,5,0,5,5,0],
      [0,0,0,5,0,0,0,0],
      [0,0,0,0,0,0,0,0]] },
    { name: '笑脸', grid: [
      [0,0,2,2,2,2,0,0],
      [0,2,2,2,2,2,2,0],
      [2,2,2,2,2,2,2,2],
      [2,2,1,2,2,1,2,2],
      [2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2],
      [0,2,2,2,2,2,2,0],
      [0,0,2,2,2,2,0,0]] },
    { name: '像素恐龙', grid: [
      [0,0,0,4,4,0,0,0],
      [0,0,4,4,4,4,0,0],
      [0,4,4,4,4,4,4,0],
      [0,4,4,4,4,4,4,0],
      [0,0,4,4,4,4,0,0],
      [0,4,4,4,4,4,4,0],
      [4,4,0,4,4,0,4,4],
      [0,0,0,4,4,0,0,0]] },
    { name: '花朵', grid: [
      [0,0,0,6,0,0,0,0],
      [0,0,6,6,6,0,0,0],
      [0,6,6,3,6,6,0,0],
      [6,6,6,3,6,6,6,0],
      [0,6,6,3,6,6,0,0],
      [0,0,6,6,6,0,0,0],
      [0,0,0,3,0,0,0,0],
      [0,0,3,3,3,0,0,0]] }
  ];

  /* 图案中文名 → 字典 key 后缀（数据结构不变，显示时查字典翻译） */
  var ART_KEYS = { '火箭': 'artRocket', '心形': 'artHeart', '星星': 'artStar', '笑脸': 'artSmile', '像素恐龙': 'artDino', '花朵': 'artFlower' };
  var target, painted, selColor, startTs, won, cells;
  var curArtName = '';

  function setup() {
    var art = ARTS[Math.floor(Math.random() * ARTS.length)];
    curArtName = T('gs.paintbynum.' + ART_KEYS[art.name]);
    target = art.grid;
    painted = [];
    for (var r = 0; r < N; r++) { painted[r] = []; for (var c = 0; c < N; c++) painted[r][c] = 0; }
    selColor = 1;
    startTs = Date.now(); won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'pb-wrap';
  wrap.innerHTML =
    '<div class="pb-pal" id="pb-pal"></div>' +
    '<div class="pb-grid" id="pb-grid"></div>' +
    '<div class="pb-msg" id="pb-msg">' + T('gs.paintbynum.startMsg') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="pb-restart">' + T('gs.paintbynum.restart') + '</button></div>' +
    '<div class="pb-help">' + T('gs.paintbynum.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#pb-grid'), palEl = wrap.querySelector('#pb-pal'),
      msg = wrap.querySelector('#pb-msg'), restartBtn = wrap.querySelector('#pb-restart');

  function buildPal() {
    palEl.innerHTML = '';
    PALETTE.forEach(function (color, i) {
      var s = document.createElement('div');
      s.className = 'pb-swatch' + (selColor === i + 1 ? ' sel' : '');
      s.style.background = color;
      s.addEventListener('click', function () { selColor = i + 1; buildPal(); });
      palEl.appendChild(s);
    });
  }
  function buildGrid() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)';
    cells = [];
    for (var i = 0; i < N * N; i++) {
      var r = Math.floor(i / N), c = i % N;
      var d = document.createElement('div');
      d.className = 'pb-cell';
      d.textContent = target[r][c] || '';
      d.addEventListener('click', (function (rr, cc) { return function () { paint(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  function paint(r, c) {
    if (won) return;
    var idx = r * N + c;
    var cell = cells[idx];
    if (painted[r][c]) {
      painted[r][c] = 0;
      cell.classList.remove('painted');
      cell.style.background = '';
      if (Arcade.audio) Arcade.audio.play('ui');
      return;
    }
    if (target[r][c] !== selColor) {
      // 展示颜色名而非十六进制（修复：英文用户看到技术字符串）
      var COLOR_NAMES = { '#ff2d95': 'pink', '#00f0ff': 'cyan', '#ffe600': 'yellow', '#39ff14': 'green', '#b967ff': 'purple', '#ff9e2d': 'orange' };
      var key = 'gs.paintbynum.col' + (COLOR_NAMES[PALETTE[target[r][c] - 1]] || 'other');
      msg.textContent = T('gs.paintbynum.wrongColor').replace('{c}', T(key));
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
      setTimeout(function () { if (!won) { msg.textContent = T('gs.paintbynum.startMsg'); msg.style.color = ''; } }, 1100);
      return;
    }
    painted[r][c] = selColor;
    cell.classList.add('painted');
    cell.style.background = PALETTE[selColor - 1];
    if (Arcade.juice) Arcade.juice.select();
    checkWin();
  }

  function checkWin() {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (target[r][c] && !painted[r][c]) return;
    }
    won = true;
    var sec = Math.round((Date.now() - startTs) / 1000);
    msg.textContent = T('gs.paintbynum.win').replace('{p}', curArtName).replace('{s}', sec);
    msg.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(sec);
  }

  restartBtn.addEventListener('click', function () { setup(); buildPal(); buildGrid(); msg.textContent = T('gs.paintbynum.startMsg'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { setup(); buildPal(); buildGrid(); msg.textContent = T('gs.paintbynum.startMsg'); msg.style.color = ''; };

  setup(); buildPal(); buildGrid();

})();
