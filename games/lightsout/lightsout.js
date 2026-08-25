/* 点灯 Lights Out —— P2 逻辑解谜（含难度递进 3×3 / 5×5） */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.lightsout.tut1t'), d: T('gs.lightsout.tut1') },
  { t: T('gs.lightsout.tut2t'), d: T('gs.lightsout.tut2') },
  { t: T('gs.lightsout.tut3t'), d: T('gs.lightsout.tut3') },
  { t: T('gs.lightsout.tut4t'), d: T('gs.lightsout.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var S = 5, steps = 0, over = false, grid = [];

  function flip(r, c) {
    if (r < 0 || c < 0 || r >= S || c >= S) return;
    grid[r][c] = grid[r][c] ? 0 : 1;
  }
  function press(r, c) { flip(r, c); flip(r - 1, c); flip(r + 1, c); flip(r, c - 1); flip(r, c + 1); }

  function scramble() {
    grid = []; for (var r = 0; r < S; r++) { grid[r] = []; for (var c = 0; c < S; c++) grid[r][c] = 0; }
    var n = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) press(Math.floor(Math.random() * S), Math.floor(Math.random() * S));
    var any = false; for (var r2 = 0; r2 < S; r2++) for (var c2 = 0; c2 < S; c2++) if (grid[r2][c2]) any = true;
    if (!any) press(0, 0);
    steps = 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'lo-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="lo-diff">' +
    '  <button class="btn mode-btn" data-size="3">' + T('gs.lightsout.modeEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-size="5">' + T('gs.lightsout.modeNormal') + '</button>' +
    '</div>' +
    '<div class="lo-top" id="lo-top">' + T('gs.lightsout.stepsFmt').replace('{n}', '0') + '</div>' +
    '<div class="lo-grid" id="lo-grid"></div>' +
    '<div class="lo-msg" id="lo-msg"></div>';
  root.appendChild(wrap);
  var diffRow = wrap.querySelector('#lo-diff');
  var gridEl = wrap.querySelector('#lo-grid'), top = wrap.querySelector('#lo-top'), msg = wrap.querySelector('#lo-msg');
  var cells = [];

  function render() {
    gridEl.style.gridTemplateColumns = 'repeat(' + S + ', 1fr)';
    gridEl.innerHTML = '';
    cells = [];
    for (var r = 0; r < S; r++) {
      cells[r] = [];
      for (var c = 0; c < S; c++) {
        var b = document.createElement('div');
        b.className = 'lo-cell' + (grid[r][c] ? ' on' : '');
        (function (rr, cc) { b.addEventListener('click', function () { click(rr, cc); }); })(r, c);
        gridEl.appendChild(b);
        cells[r][c] = b;
      }
    }
  }
  function click(r, c) {
    if (over) return;
    press(r, c); steps++; top.textContent = T('gs.lightsout.stepsFmt').replace('{n}', steps);
    for (var i = 0; i < S; i++) for (var j = 0; j < S; j++) cells[i][j].classList.toggle('on', !!grid[i][j]);
    if (Arcade.juice) Arcade.juice.select();
    var allOff = true;
    for (var r3 = 0; r3 < S; r3++) for (var c3 = 0; c3 < S; c3++) if (grid[r3][c3]) allOff = false;
    if (allOff) {
      over = true;
      msg.textContent = T('gs.lightsout.winFmt').replace('{n}', steps);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(steps);
    }
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      S = parseInt(b.getAttribute('data-size'), 10);
      over = false; msg.textContent = '';
      scramble(); render();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  scramble(); render();
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.lightsout.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    over = false; // 胜局后重开必须复位，否则点击全部失效
    steps = 0;
    var t = document.getElementById('lo-top'); if (t) t.textContent = T('gs.lightsout.stepsFmt').replace('{n}', '0');
    scramble(); render();
  };

})();
