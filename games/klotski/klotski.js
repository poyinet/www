/* 华容道 Klotski —— P2 逻辑解谜（多布局：横刀立马 / 指挥若定） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.klotski.tut1t'), d: T('gs.klotski.tut1') },
  { t: T('gs.klotski.tut2t'), d: T('gs.klotski.tut2') },
  { t: T('gs.klotski.tut3t'), d: T('gs.klotski.tut3') },
  { t: T('gs.klotski.tut4t'), d: T('gs.klotski.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var COLS = 4, ROWS = 5, steps = 0, over = false, selId = null;
  var META = {
    CA: { color: 'linear-gradient(135deg,#ff2d95,#ff6b9d)', labelKey: 'pcCao' },
    V1: { color: '#b967ff', labelKey: 'pcGen' }, V2: { color: '#b967ff', labelKey: 'pcGen' },
    V3: { color: '#9d5cff', labelKey: 'pcGen' }, V4: { color: '#9d5cff', labelKey: 'pcGen' },
    GU: { color: '#00f0ff', labelKey: 'pcGuan' },
    B1: { color: '#39ff14', labelKey: 'pcBing' }, B2: { color: '#39ff14', labelKey: 'pcBing' },
    B3: { color: '#2fd60f', labelKey: 'pcBing' }, B4: { color: '#2fd60f', labelKey: 'pcBing' }
  };
  var LEVELS = [
    { name: '横刀立马', init: [
      ['CA','CA','V1','V2'],
      ['CA','CA','V1','V2'],
      ['V3','V4','GU','GU'],
      ['V3','V4','B1','B2'],
      ['B3','B4',0,0]
    ]},
    { name: '指挥若定', init: [
      ['CA','CA','V1','V2'],
      ['CA','CA','V1','V2'],
      ['GU','GU','V3','V4'],
      ['B1','B2','V3','V4'],
      ['B3','B4',0,0]
    ]}
  ];
  var li = 0, grid = [], blocks = {};

  /* 断点续玩（共享模块，仅存本机） */
  function writeSave() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.write()); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'klotski',
      collect: function () {
        if (over) return null;
        return { grid: grid, steps: steps, li: li };
      },
      apply: function (s) {
        if (!s || !Array.isArray(s.grid) || s.grid.length !== ROWS) return false;
        for (var r = 0; r < ROWS; r++) {
          if (!Array.isArray(s.grid[r]) || s.grid[r].length !== COLS) return false;
        }
        grid = s.grid;
        blocks = {};
        for (var r2 = 0; r2 < ROWS; r2++) for (var c = 0; c < COLS; c++) {
          var id = grid[r2][c];
          if (id && !blocks[id]) blocks[id] = { id: id, cells: [], color: META[id].color, labelKey: META[id].labelKey };
          if (id) blocks[id].cells.push([r2, c]);
        }
        steps = Math.max(0, Number(s.steps) || 0);
        li = Number(s.li) >= 0 && Number(s.li) < LEVELS.length ? Number(s.li) : 0;
        over = false;
        selId = null;
        var ms = diffRow.querySelectorAll('.mode-btn');
        for (var bi = 0; bi < ms.length; bi++) ms[bi].classList.toggle('selected', parseInt(ms[bi].getAttribute('data-li'), 10) === li);
        render();
        return true;
      }
    });
  }

  function load(INIT) {
    clearSave();
    grid = []; blocks = {};
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) {
        var id = INIT[r][c];
        grid[r][c] = id;
        if (id && !blocks[id]) blocks[id] = { id: id, cells: [], color: META[id].color, labelKey: META[id].labelKey };
        if (id) blocks[id].cells.push([r, c]);
      }
    }
    steps = 0; over = false; selId = null;
  }

  var wrap = document.createElement('div');
  wrap.className = 'kl-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="kl-diff">' +
    '  <button class="btn mode-btn selected" data-li="0">' + T('gs.klotski.lv0') + '</button>' +
    '  <button class="btn mode-btn" data-li="1">' + T('gs.klotski.lv1') + '</button>' +
    '</div>' +
    '<div class="kl-top" id="kl-top">' + T('gs.klotski.hud').replace('{n}', 0) + '</div>' +
    '<div class="kl-board" id="kl-board"></div>' +
    '<div class="kl-dpad">' +
    '<span></span><button data-d="up">⬆</button><span></span>' +
    '<button data-d="left">⬅</button><button data-d="down">⬇</button><button data-d="right">➡</button>' +
    '</div>' +
    '<div class="kl-msg" id="kl-msg"></div>';
  root.appendChild(wrap);
  var diffRow = wrap.querySelector('#kl-diff');
  var boardEl = wrap.querySelector('#kl-board'), top = wrap.querySelector('#kl-top'), msg = wrap.querySelector('#kl-msg');
  var cellEls = [];
  for (var i = 0; i < ROWS * COLS; i++) {
    var cell = document.createElement('div'); cell.className = 'kl-cell';
    (function (rr, cc) { cell.addEventListener('click', function () { select(rr, cc); }); })(Math.floor(i / COLS), i % COLS);
    boardEl.appendChild(cell); cellEls.push(cell);
  }
  wrap.querySelectorAll('.kl-dpad button').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.dataset.d;
      move(d === 'up' ? -1 : d === 'down' ? 1 : 0, d === 'left' ? -1 : d === 'right' ? 1 : 0);
    });
  });

  function render() {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var el = cellEls[r * COLS + c]; var id = grid[r][c];
      if (!id) { el.style.background = 'rgba(0,0,0,0.25)'; el.textContent = ''; el.className = 'kl-cell' + (r === ROWS - 1 && (c === 1 || c === 2) ? ' exit' : ''); continue; }
      var m = blocks[id];
      el.style.background = m.color; el.textContent = T('gs.klotski.' + m.labelKey);
      el.className = 'kl-cell' + (selId === id ? ' sel' : '') + (r === ROWS - 1 && (c === 1 || c === 2) ? ' exit' : '');
    }
    top.textContent = T('gs.klotski.hud').replace('{n}', steps);
  }

  function select(r, c) {
    if (over) return;
    var id = grid[r][c];
    if (!id) { if (Arcade.audio) Arcade.audio.play('error'); return; }
    selId = id; render(); if (Arcade.juice) Arcade.juice.select();
  }
  function move(dr, dc) {
    if (over || !selId) return;
    var b = blocks[selId];
    var newCells = b.cells.map(function (p) { return [p[0] + dr, p[1] + dc]; });
    for (var i = 0; i < newCells.length; i++) {
      var nr = newCells[i][0], nc = newCells[i][1];
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) return;
      if (grid[nr][nc] && grid[nr][nc] !== selId) return;
    }
    for (var j = 0; j < b.cells.length; j++) grid[b.cells[j][0]][b.cells[j][1]] = 0;
    b.cells = newCells;
    for (var k = 0; k < newCells.length; k++) grid[newCells[k][0]][newCells[k][1]] = selId;
    steps++;
    if (Arcade.juice) Arcade.juice.move();
    render();
    var ca = blocks.CA.cells.map(function (p) { return p[0] + ',' + p[1]; }).sort().join(',');
    if (ca === '3,1,3,2,4,1,4,2') {
      over = true;
      msg.textContent = T('gs.klotski.win').replace('{n}', steps);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(steps);
    }
    writeSave();
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      li = parseInt(b.getAttribute('data-li'), 10);
      msg.textContent = '';
      load(LEVELS[li].init); render();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  if (!tryResume()) { load(LEVELS[li].init); render(); }
      /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.klotski.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { load(LEVELS[li].init); render(); };

})();
