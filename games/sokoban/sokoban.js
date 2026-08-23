/* 推箱子 Sokoban —— P2 逻辑解谜（5 关 + 重开） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.sokoban.tut1t'), d: T('gs.sokoban.tut1') },
  { t: T('gs.sokoban.tut2t'), d: T('gs.sokoban.tut2') },
  { t: T('gs.sokoban.tut3t'), d: T('gs.sokoban.tut3') },
  { t: T('gs.sokoban.tut4t'), d: T('gs.sokoban.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var LEVELS = [
    ['#######', '#     #', '#  .  #', '#  $  #', '#  @  #', '#     #', '#######'],
    ['#######', '#     #', '#@$ . #', '#     #', '#  $ .#', '#     #', '#######'],
    ['#######', '#     #', '#@$ . #', '#     #', '#######'],
    ['#######', '#  .  #', '#  $  #', '#  @  #', '#     #', '#######'],
    ['######', '#    #', '# .$ #', '# .$ #', '# @  #', '#    #', '######']
  ];
  var li = 0, steps = 0, total = 0, over = false;
  var walls = [], targets = [], boxes = {}, player = null, R = 0, C = 0, gridEl;

  function load() {
    var map = LEVELS[li];
    R = map.length; C = map[0].length;
    walls = []; targets = []; boxes = {};
    for (var r = 0; r < R; r++) {
      walls[r] = []; targets[r] = [];
      for (var c = 0; c < C; c++) {
        var ch = map[r][c];
        walls[r][c] = ch === '#';
        targets[r][c] = (ch === '.' || ch === '*' || ch === '+');
        if (ch === '$' || ch === '*') boxes[r + ',' + c] = true;
        if (ch === '@' || ch === '+') player = { r: r, c: c };
      }
    }
  }

  var wrap = document.createElement('div');
  wrap.className = 'sk-wrap';
  wrap.innerHTML =
    '<div class="sk-top" id="sk-top">' + T('gs.sokoban.hud').replace('{l}', 1).replace('{t}', LEVELS.length).replace('{s}', 0) + '</div>' +
    '<div class="sk-grid" id="sk-grid"></div>' +
    '<div class="sk-dpad">' +
    '<span></span><button data-d="up">⬆</button><span></span>' +
    '<button data-d="left">⬅</button><button data-d="down">⬇</button><button data-d="right">➡</button>' +
    '</div>' +
    '<div class="sk-msg" id="sk-msg"></div>' +
    '<div class="game-controls"><button id="sk-restart" class="btn purple">' + T('gs.sokoban.restart') + '</button></div>';
  root.appendChild(wrap);
  gridEl = wrap.querySelector('#sk-grid');
  var top = wrap.querySelector('#sk-top'), msg = wrap.querySelector('#sk-msg');
  var restartBtn = wrap.querySelector('#sk-restart');
  wrap.querySelectorAll('.sk-dpad button').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.dataset.d;
      move(d === 'up' ? -1 : d === 'down' ? 1 : 0, d === 'left' ? -1 : d === 'right' ? 1 : 0);
    });
  });

  function render() {
    gridEl.style.gridTemplateColumns = 'repeat(' + C + ', 40px)';
    gridEl.innerHTML = '';
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var cell = document.createElement('div');
      cell.className = 'sk-cell' + (walls[r][c] ? ' wall' : targets[r][c] ? ' target' : '');
      var key = r + ',' + c;
      if (walls[r][c]) cell.textContent = '';
      else if (boxes[key] && targets[r][c]) cell.textContent = '✅';
      else if (boxes[key]) cell.textContent = '📦';
      else if (player.r === r && player.c === c) cell.textContent = '🧍';
      else if (targets[r][c]) cell.textContent = '🎯';
      else cell.textContent = '';
      gridEl.appendChild(cell);
    }
  }

  function move(dr, dc) {
    if (over) return;
    var nr = player.r + dr, nc = player.c + dc;
    if (nr < 0 || nc < 0 || nr >= R || nc >= C || walls[nr][nc]) return;
    var key = nr + ',' + nc;
    if (boxes[key]) {
      var br = nr + dr, bc = nc + dc;
      if (br < 0 || bc < 0 || br >= R || bc >= C || walls[br][bc] || boxes[br + ',' + bc]) return;
      delete boxes[key]; boxes[br + ',' + bc] = true;
    }
    player = { r: nr, c: nc };
    steps++; total++;
    top.textContent = T('gs.sokoban.hud').replace('{l}', li + 1).replace('{t}', LEVELS.length).replace('{s}', total);
    if (Arcade.juice) Arcade.juice.select();
    render();
    var win = true;
    for (var k in boxes) {
      var p = k.split(',');
      if (!targets[p[0] * 1] || !targets[p[0] * 1][p[1] * 1]) { win = false; break; }
    }
    if (win) levelDone();
  }

  function levelDone() {
    if (li < LEVELS.length - 1) {
      li++;
      steps = 0;
      load(); render();
      top.textContent = T('gs.sokoban.hud').replace('{l}', li + 1).replace('{t}', LEVELS.length).replace('{s}', total); // 立即刷新 HUD（修复过关后不更新）
      msg.textContent = T('gs.sokoban.levelDone').replace('{n}', li + 1);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      over = true;
      msg.textContent = T('gs.sokoban.win').replace('{n}', total);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(total);
    }
  }

  function fullRestart() {
    li = 0; steps = 0; total = 0; over = false;
    msg.textContent = '';
    load(); render();
    top.textContent = T('gs.sokoban.hud').replace('{l}', 1).replace('{t}', LEVELS.length).replace('{s}', 0);
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  document.addEventListener('keydown', function (e) {
    if (over) return;
    // preventDefault：方向键同时滚动页面（修复矮屏/溢出视口时双触发）
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    if (e.key === 'ArrowUp') move(-1, 0);
    else if (e.key === 'ArrowDown') move(1, 0);
    else if (e.key === 'ArrowLeft') move(0, -1);
    else if (e.key === 'ArrowRight') move(0, 1);
  });

  restartBtn.addEventListener('click', fullRestart);
  load(); render();

  window.GAME_RESTART = fullRestart; // 完整重置（load 不重置 over/steps/total，会卡死）

})();