/* 数织 Nonogram (5x5) —— P2 逻辑解谜（含手绘图案 + 随机两种来源） */
(function () {
  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.nonogram.tut1t'), d: T('gs.nonogram.tut1') },
    { t: T('gs.nonogram.tut2t'), d: T('gs.nonogram.tut2') },
    { t: T('gs.nonogram.tut3t'), d: T('gs.nonogram.tut3') },
    { t: T('gs.nonogram.tut4t'), d: T('gs.nonogram.tut4') }
  ];
  var root = document.getElementById('game-root');
  var S = 5, startTs = Date.now(), over = false;
  var target = [], state = [];

  // 手绘 5×5 图案（1=亮）
  var PICTURES = [
    { name: 'gs.nonogram.picHeart', g: ['00100', '01110', '11111', '01110', '00100'] },
    { name: 'gs.nonogram.picSmile', g: ['01110', '11011', '10101', '10001', '01110'] },
    { name: 'gs.nonogram.picStar', g: ['00100', '10101', '01110', '00100', '01110'] },
    { name: 'gs.nonogram.picArrow', g: ['00100', '01110', '11111', '00100', '00100'] },
    { name: 'gs.nonogram.picCross', g: ['00100', '00100', '11111', '00100', '00100'] },
    { name: 'gs.nonogram.picHouse', g: ['01010', '11111', '10101', '11111', '10001'] }
  ];

  function randTarget() {
    var t = [];
    for (var r = 0; r < S; r++) { t[r] = []; for (var c = 0; c < S; c++) t[r][c] = Math.random() < 0.5 ? 1 : 0; }
    var any = false; for (var r2 = 0; r2 < S; r2++) for (var c2 = 0; c2 < S; c2++) if (t[r2][c2]) any = true;
    if (!any) t[2][2] = 1;
    return { name: 'gs.nonogram.picRandom', grid: t };
  }

  function clues(arr) {
    var out = [], run = 0;
    for (var i = 0; i < arr.length; i++) { if (arr[i]) run++; else if (run) { out.push(run); run = 0; } }
    if (run) out.push(run);
    return out.length ? out : [0];
  }

  function pickTarget() {
    if (Math.random() < 0.7) {
      var p = PICTURES[Math.floor(Math.random() * PICTURES.length)];
      var g = [];
      for (var r = 0; r < S; r++) { g[r] = []; for (var c = 0; c < S; c++) g[r][c] = p.g[r].charCodeAt(c) - 48; }
      return { name: p.name, grid: g };
    }
    return randTarget();
  }

  var picked = pickTarget();
  target = picked.grid;
  var picName = picked.name;
  state = target.map(function (row) { return row.map(function () { return 0; }); });

  var wrap = document.createElement('div');
  wrap.className = 'no-wrap';
  wrap.innerHTML = '<div class="no-top" id="no-top">' + T('gs.nonogram.time').replace('{t}', '00:00') + '</div><div class="no-grid" id="no-grid"></div><div class="no-msg" id="no-msg"></div>';
  root.appendChild(wrap);
  var grid = wrap.querySelector('#no-grid'), top = wrap.querySelector('#no-top'), msg = wrap.querySelector('#no-msg');

  var units = [];
  for (var r = 0; r <= S; r++) {
    units[r] = [];
    for (var c = 0; c <= S; c++) {
      var u = document.createElement('div'); u.className = 'no-unit';
      if (r === 0 && c === 0) { /* corner */ }
      else if (r === 0) { u.classList.add('no-hint'); u.textContent = clues(target.map(function (row) { return row[c - 1]; })).join(' '); }
      else if (c === 0) { u.classList.add('no-hint'); u.textContent = clues(target[r - 1]).join(' '); }
      else {
        u.classList.add('no-cell');
        (function (rr, cc) { u.addEventListener('click', function () { toggle(rr, cc); }); })(r - 1, c - 1);
      }
      grid.appendChild(u);
      units[r][c] = u;
    }
  }

  function toggle(r, c) {
    if (over) return;
    state[r][c] = state[r][c] ? 0 : 1;
    units[r + 1][c + 1].classList.toggle('filled', !!state[r][c]);
    if (Arcade.juice) Arcade.juice.select();
    check();
  }
  function check() {
    // 按线索校验（接受与目标图案行列线索一致的任一合法解；修复随机图案多解导致的假软锁）
    for (var r = 0; r < S; r++) {
      if (clues(state[r]).join(' ') !== clues(target[r]).join(' ')) return;
    }
    for (var c = 0; c < S; c++) {
      var colA = [], colB = [];
      for (var r2 = 0; r2 < S; r2++) { colA.push(state[r2][c]); colB.push(target[r2][c]); }
      if (clues(colA).join(' ') !== clues(colB).join(' ')) return;
    }
    over = true;
    var sec = Math.round((Date.now() - startTs) / 1000);
    msg.textContent = T('gs.nonogram.win').replace('{p}', T(picName)).replace('{s}', sec);
    msg.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(sec);
  }
  function tick() {
    if (over) return;
    var s = Math.round((Date.now() - startTs) / 1000);
    top.textContent = T('gs.nonogram.time').replace('{t}', ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2));
    setTimeout(tick, 500);
  }
  tick();
    window.GAME_RESTART = function () { location.reload(); };

})();
