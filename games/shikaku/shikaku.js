/* 方形分割 Shikaku —— 批次C 益智休闲 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.shikaku.tut1t'), d: T('gs.shikaku.tut1') },
  { t: T('gs.shikaku.tut2t'), d: T('gs.shikaku.tut2') },
  { t: T('gs.shikaku.tut3t'), d: T('gs.shikaku.tut3') },
  { t: T('gs.shikaku.tut4t'), d: T('gs.shikaku.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var N = 6; // 6×6
  var DIFFS = { easy: 6, normal: 7, hard: 8 }; // 网格越大块越多越难
  var difficulty = 'normal';

  var solution = [], seeds = [], blocks, steps, won;

  /* 随机矩形分割：从左上开始贪心切分，直到全覆盖（无残余 → 保证必有解） */
  function generate(size) {
    N = size;
    solution = [];
    for (var r = 0; r < N; r++) { solution[r] = []; for (var c = 0; c < N; c++) solution[r][c] = -1; }
    var bid = 0, covered = [];
    for (var r2 = 0; r2 < N; r2++) { covered[r2] = []; for (var c2 = 0; c2 < N; c2++) covered[r2][c2] = false; }
    var guard = 0;
    while (guard++ < 5000) {
      // 找第一个未覆盖格
      var sr = -1, sc = -1;
      outer:
      for (var r3 = 0; r3 < N; r3++) for (var c3 = 0; c3 < N; c3++) if (!covered[r3][c3]) { sr = r3; sc = c3; break outer; }
      if (sr < 0) break; // 已全覆盖
      // 从 (sr,sc) 向右下扩展随机矩形：逐行/逐列随机扩展，撞已覆盖即停
      var h = 1, w = 1;
      var expandRow = true, expandCol = true;
      while (guard++ < 5000) {
        var grew = false;
        if (expandRow && sr + h < N && Math.random() < 0.5) {
          var okR = true;
          for (var j = 0; j < w; j++) if (covered[sr + h][sc + j]) { okR = false; break; }
          if (okR) { h++; grew = true; } else expandRow = false;
        }
        if (expandCol && sc + w < N && Math.random() < 0.5) {
          var okC = true;
          for (var i = 0; i < h; i++) if (covered[sr + i][sc + w]) { okC = false; break; }
          if (okC) { w++; grew = true; } else expandCol = false;
        }
        if (!grew) break;
      }
      for (var i3 = 0; i3 < h; i3++) for (var j3 = 0; j3 < w; j3++) { covered[sr + i3][sc + j3] = true; solution[sr + i3][sc + j3] = bid; }
      bid++;
    }
    // 生成 seed：每块选一个格放数字（面积）
    seeds = [];
    for (var b = 0; b < bid; b++) {
      var area = 0, sx = -1, sy = -1;
      for (var r5 = 0; r5 < N; r5++) for (var c5 = 0; c5 < N; c5++) if (solution[r5][c5] === b) { area++; if (sx < 0) { sx = r5; sy = c5; } }
      seeds.push({ r: sx, c: sy, v: area });
    }
  }

  var wrap = document.createElement('div');
  wrap.className = 'sh-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="sh-diff">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.shikaku.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.shikaku.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.shikaku.dHard') + '</button>' +
    '</div>' +
    '<div class="sh-grid" id="sh-grid"></div>' +
    '<div class="sh-msg" id="sh-msg">' + T('gs.shikaku.startMsg') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="sh-restart">' + T('gs.shikaku.restart') + '</button></div>' +
    '<div class="sh-help">' + T('gs.shikaku.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#sh-grid'), msg = wrap.querySelector('#sh-msg'),
      restartBtn = wrap.querySelector('#sh-restart'), diffRow = wrap.querySelector('#sh-diff');

  var cells = [];
  function buildCells() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)';
    cells = [];
    for (var i = 0; i < N * N; i++) {
      var d = document.createElement('div');
      d.className = 'sh-cell';
      d.setAttribute('data-i', i);
      var r = Math.floor(i / N), c = i % N;
      var seed = seeds.filter(function (s) { return s.r === r && s.c === c; })[0];
      if (seed) { d.textContent = seed.v; d.classList.add('seeded'); }
      d.addEventListener('click', (function (rr, cc) { return function () { click(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  var corner = null;
  function click(r, c) {
    if (won) return;
    if (!corner) { corner = { r: r, c: c }; steps++; mark(); return; }
    // 第二点：验证矩形
    var r1 = Math.min(corner.r, r), r2 = Math.max(corner.r, r);
    var c1 = Math.min(corner.c, c), c2 = Math.max(corner.c, c);
    // 找出矩形内的种子
    var seedsIn = [];
    for (var i = r1; i <= r2; i++) for (var j = c1; j <= c2; j++) {
      seeds.forEach(function (s) { if (s.r === i && s.c === j) seedsIn.push(s); });
    }
    var area = (r2 - r1 + 1) * (c2 - c1 + 1);
    // 与已分割区域重叠 → 拒绝（规则：互不重叠）
    var overlap = false;
    for (var oi = r1; oi <= r2 && !overlap; oi++) for (var oj = c1; oj <= c2; oj++) {
      if (cells[oi * N + oj].classList.contains('inblock')) { overlap = true; break; }
    }
    if (overlap) {
      msg.textContent = T('gs.shikaku.overlap');
      msg.style.color = 'var(--neon-pink)';
      corner = null;
      steps++;
      mark();
      if (Arcade.audio) Arcade.audio.play('error');
      setTimeout(function () { if (!won) { msg.textContent = T('gs.shikaku.startMsg'); msg.style.color = ''; } }, 1100);
      return;
    }
    if (seedsIn.length === 1 && area === seedsIn[0].v) {
      // 正确：标色
      for (var k = r1; k <= r2; k++) for (var l = c1; l <= c2; l++) cells[k * N + l].classList.add('inblock');
      corner = null;
      steps++;
      if (Arcade.juice) Arcade.juice.clear(null, null, 'var(--neon-cyan)', 6);
      checkWin();
    } else {
      msg.textContent = T('gs.shikaku.wrongRect');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
      corner = null;
      steps++;
      mark();
      setTimeout(function () { if (!won) { msg.textContent = T('gs.shikaku.startMsg'); msg.style.color = ''; } }, 1100);
    }
  }

  function mark() {
    cells.forEach(function (d) { d.classList.remove('mark'); });
    if (corner) cells[corner.r * N + corner.c].classList.add('mark');
  }

  function checkWin() {
    var allIn = cells.every(function (d) { return d.classList.contains('inblock'); });
    if (allIn) {
      won = true;
      msg.textContent = T('gs.shikaku.win').replace('{n}', steps);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(steps);
    }
  }

  function setup() {
    generate(DIFFS[difficulty]);
    blocks = null; steps = 0; won = false; corner = null;
    buildCells();
  }

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-d');
      setup();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });
  restartBtn.addEventListener('click', function () { setup(); msg.textContent = T('gs.shikaku.startMsg'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { setup(); msg.textContent = T('gs.shikaku.startMsg'); msg.style.color = ''; };

  setup();

})();
