/* 单词搜索 Word Search —— 批次C 益智休闲 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.wordsearch.tut1t'), d: T('gs.wordsearch.tut1') },
  { t: T('gs.wordsearch.tut2t'), d: T('gs.wordsearch.tut2') },
  { t: T('gs.wordsearch.tut3t'), d: T('gs.wordsearch.tut3') },
  { t: T('gs.wordsearch.tut4t'), d: T('gs.wordsearch.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var N = 9;
  var POOL = ['CODE', 'CRYPT', 'SIGNAL', 'VAULT', 'LASER', 'ROBOT', 'PIXEL', 'LOGIC',
    'DECODE', 'NEON', 'CIPHER', 'MORSE', 'GLYPH', 'TOKEN', 'MATRIX', 'BEACON'];

  var grid, words, placed, found, startTs, won, selStart;

  /* 放置单词：随机起点 + 随机方向（8 向），起点范围按方向正负自适应 */
  function placeWord(word) {
    var dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    var attempts = 0;
    while (attempts++ < 300) {
      var dr = dirs[Math.floor(Math.random() * dirs.length)];
      var span = word.length - 1;
      // 起点范围：负方向留出跨度，正方向到边界
      var r0 = dr[0] < 0 ? span : 0;
      var r1 = dr[0] > 0 ? N - 1 - span : N - 1;
      var c0 = dr[1] < 0 ? span : 0;
      var c1 = dr[1] > 0 ? N - 1 - span : N - 1;
      if (r1 < r0 || c1 < c0) continue;
      var r = r0 + Math.floor(Math.random() * (r1 - r0 + 1));
      var c = c0 + Math.floor(Math.random() * (c1 - c0 + 1));
      var ok = true;
      for (var i = 0; i < word.length; i++) {
        var rr = r + dr[0] * i, cc = c + dr[1] * i;
        var ch = grid[rr][cc];
        if (ch && ch !== word[i]) { ok = false; break; }
      }
      if (!ok) continue;
      for (var j = 0; j < word.length; j++) {
        grid[r + dr[0] * j][c + dr[1] * j] = word[j];
      }
      return true;
    }
    return false;
  }

  var setupTries = 0; // 放置重试上限（防理论无限递归）
  function setup() {
    setupTries++;
    grid = [];
    for (var r = 0; r < N; r++) { grid[r] = []; for (var c = 0; c < N; c++) grid[r][c] = null; }
    // 选 5 个词放置
    var pool = POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    words = pool.slice(0, 5);
    placed = {};
    var placedCount = 0;
    for (var w = 0; w < words.length; w++) {
      if (placeWord(words[w])) { placed[words[w]] = true; placedCount++; }
    }
    if (placedCount < words.length) {
      if (setupTries < 12) { setup(); return; }
      // 兜底：横向强制放置未成功的词（保证可通关，杜绝无限递归）
      for (var ww = 0; ww < words.length; ww++) {
        if (placed[words[ww]]) continue;
        for (var rr0 = 0; rr0 < N; rr0++) {
          for (var cc0 = 0; cc0 + words[ww].length <= N; cc0++) {
            var okPlace = true;
            for (var kk = 0; kk < words[ww].length; kk++) if (grid[rr0][cc0 + kk]) { okPlace = false; break; }
            if (okPlace) {
              for (var kk2 = 0; kk2 < words[ww].length; kk2++) grid[rr0][cc0 + kk2] = words[ww][kk2];
              placed[words[ww]] = true;
              break;
            }
          }
          if (placed[words[ww]]) break;
        }
      }
    }
    setupTries = 0;
    // 空白填随机字母
    for (var r2 = 0; r2 < N; r2++) for (var c2 = 0; c2 < N; c2++) {
      if (!grid[r2][c2]) grid[r2][c2] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    found = {};
    foundPaths = []; // 重置已找到路径
    startTs = Date.now(); won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ws-wrap';
  wrap.innerHTML =
    '<div class="ws-list" id="ws-list"></div>' +
    '<div class="ws-grid" id="ws-grid"></div>' +
    '<div class="ws-msg" id="ws-msg">' + T('gs.wordsearch.startMsg') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="ws-restart">' + T('gs.wordsearch.restart') + '</button></div>' +
    '<div class="ws-help">' + T('gs.wordsearch.help') + '</div>';
  root.appendChild(wrap);
  var gridEl = wrap.querySelector('#ws-grid'), listEl = wrap.querySelector('#ws-list'),
      msg = wrap.querySelector('#ws-msg'), restartBtn = wrap.querySelector('#ws-restart');

  var cells = [];
  var foundPaths = []; // 已找到词的路径（重建 DOM 后保留高亮）
  function build() {
    listEl.innerHTML = '';
    words.forEach(function (w) {
      var el = document.createElement('span');
      el.className = 'ws-word' + (found[w] ? ' found' : '');
      el.textContent = w;
      listEl.appendChild(el);
    });
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)';
    cells = [];
    for (var i = 0; i < N * N; i++) {
      var r = Math.floor(i / N), c = i % N;
      var d = document.createElement('div');
      d.className = 'ws-cell';
      d.textContent = grid[r][c];
      d.addEventListener('click', (function (rr, cc) { return function () { click(rr, cc); }; })(r, c));
      gridEl.appendChild(d);
      cells.push(d);
    }
    // 重建后保留全部已找到路径高亮（修复：此前只保留最新一个）
    foundPaths.forEach(function (p) {
      if (cells[p[0] * N + p[1]]) cells[p[0] * N + p[1]].classList.add('hit');
    });
  }

  function click(r, c) {
    if (won) return;
    if (!selStart) {
      selStart = { r: r, c: c };
      cells[r * N + c].classList.add('hit');
      return;
    }
    var a = selStart, b = { r: r, c: c };
    selStart = null;
    cells.forEach(function (d) { d.classList.remove('hit'); });
    // 计算方向向量
    var dr = b.r - a.r, dc = b.c - a.c;
    var len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) { msg.textContent = T('gs.wordsearch.notLine'); msg.style.color = 'var(--neon-pink)'; return; }
    var sr = dr === 0 ? 0 : dr / Math.abs(dr);
    var sc = dc === 0 ? 0 : dc / Math.abs(dc);
    // 提取单词
    var word = '';
    var path = [];
    for (var i = 0; i <= len; i++) {
      var rr = a.r + sr * i, cc = a.c + sc * i;
      word += grid[rr][cc];
      path.push([rr, cc]);
    }
    // 匹配（正反均可）
    var w = words.filter(function (x) { return x === word || x === word.split('').reverse().join(''); })[0];
    if (w && !found[w]) {
      found[w] = true;
      foundPaths.push(path); // 记录路径供重建后保留高亮
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
      build(); // 刷新列表会重建棋盘 DOM，build 内统一重加全部高亮
      checkWin();
    } else {
      msg.textContent = T('gs.wordsearch.notFound');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
      setTimeout(function () { if (!won) { msg.textContent = T('gs.wordsearch.startMsg'); msg.style.color = ''; } }, 1000);
    }
  }

  function checkWin() {
    if (words.every(function (w) { return found[w]; })) {
      won = true;
      var sec = Math.round((Date.now() - startTs) / 1000);
      msg.textContent = T('gs.wordsearch.win').replace('{n}', sec);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(sec);
    }
  }

  restartBtn.addEventListener('click', function () { setup(); selStart = null; build(); msg.textContent = T('gs.wordsearch.startMsg'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { setup(); selStart = null; build(); msg.textContent = T('gs.wordsearch.startMsg'); msg.style.color = ''; };

  setup(); build();

})();
