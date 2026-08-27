/* 数独 Sudoku —— P2 逻辑解谜 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.sudoku.tut1t'), d: T('gs.sudoku.tut1') },
  { t: T('gs.sudoku.tut2t'), d: T('gs.sudoku.tut2') },
  { t: T('gs.sudoku.tut3t'), d: T('gs.sudoku.tut3') }
  ];

(function () {
  var root = document.getElementById('game-root');
  var N = 9, startTs = Date.now(), over = false, sel = null;
  var DIFFS = { easy: 36, normal: 45, hard: 54 };
  var difficulty = 'normal';
  var puzzle = [], solution = [], fixed = [], cells = [];
  var notes = [], noteMode = false;
  var errors = 0, errEl = null;

  /* 种子化 PRNG（每日一题用：同一天同一题） */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, rng) {
    rng = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function valid(g, r, c, n) {
    for (var i = 0; i < 9; i++) { if (g[r][i] === n) return false; if (g[i][c] === n) return false; }
    var br = r - r % 3, bc = c - c % 3;
    for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) if (g[br + a][bc + b] === n) return false;
    return true;
  }
  function fill(g, r, c, rng) {
    if (r === 9) return true;
    var nr = c === 8 ? r + 1 : r, nc = c === 8 ? 0 : c + 1;
    if (g[r][c] !== 0) return fill(g, nr, nc, rng);
    var nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    for (var k = 0; k < 9; k++) {
      var n = nums[k];
      if (valid(g, r, c, n)) { g[r][c] = n; if (fill(g, nr, nc, rng)) return true; g[r][c] = 0; }
    }
    return false;
  }
  /* 回溯计数解（limit 上限，用于挖洞后唯一解校验） */
  function countSolutions(g, limit) {
    var cnt = 0;
    function search() {
      if (cnt >= limit) return;
      var br = -1, bc = -1;
      for (var r = 0; r < 9 && br < 0; r++) for (var c = 0; c < 9; c++) if (g[r][c] === 0) { br = r; bc = c; break; }
      if (br < 0) { cnt++; return; }
      for (var n = 1; n <= 9; n++) {
        if (valid(g, br, bc, n)) { g[br][bc] = n; search(); g[br][bc] = 0; }
        if (cnt >= limit) return;
      }
    }
    search();
    return cnt;
  }
  function generate(holes, rng) {
    rng = rng || Math.random;
    var g = []; for (var i = 0; i < 9; i++) { g[i] = []; for (var j = 0; j < 9; j++) g[i][j] = 0; }
    fill(g, 0, 0, rng);
    var sol = g.map(function (row) { return row.slice(); });
    var pos = [];
    for (var a = 0; a < 81; a++) pos.push(a);
    shuffle(pos, rng);
    // 挖洞并保证唯一解：挖掉后若出现多解则恢复该格
    var dug = 0;
    for (var h = 0; h < holes && dug < 81; h++) {
      var r = Math.floor(pos[h] / 9), c = pos[h] % 9;
      var saved = g[r][c];
      g[r][c] = 0;
      if (countSolutions(g, 2) > 1) g[r][c] = saved;
      else dug++;
    }
    return { puzzle: g, solution: sol };
  }
  function resetNotes() {
    notes = [];
    for (var nr = 0; nr < 9; nr++) { notes[nr] = []; for (var nc = 0; nc < 9; nc++) notes[nr][nc] = []; }
  }
  var dailyMode = false; // 当前是否每日一题（解完计入今日破译中心）
  function applyGen(gen, dailyMsg) {
    clearSave();
    puzzle = gen.puzzle; solution = gen.solution;
    fixed = puzzle.map(function (row) { return row.map(function (v) { return v !== 0; }); });
    resetNotes();
    startTs = Date.now(); over = false; sel = null; errors = 0;
    if (errEl) errEl.textContent = '0';
    msg.textContent = dailyMsg || '';
    renderBoard(); highlight();
  }
  function newRandom() {
    dailyMode = false;
    var gen = generate(DIFFS[difficulty]);
    applyGen(gen, '');
  }
  function newDaily() {
    dailyMode = true;
    var seed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();
    var gen = generate(DIFFS.normal, mulberry32(seed)); // 固定难度：每日题仅由日期决定（全球同题）
    applyGen(gen, T('gs.sudoku.dailyMsg').replace('{n}', seed));
  }

  var wrap = document.createElement('div');
  wrap.className = 'su-wrap';
  wrap.innerHTML =
    '<div class="su-top">' +
    '  <span id="su-time">00:00</span>' +
    '  <span class="su-err">✗ <span id="su-err">0</span></span>' +
    '  <button class="btn small" id="su-new">' + T('gs.sudoku.newBtn') + '</button>' +
    '  <button class="btn small" id="su-daily">' + T('gs.sudoku.dailyBtn') + '</button>' +
    '</div>' +
    '<div class="su-board"></div>' +
    '<div class="su-pad" id="su-pad"></div>' +
    '<div class="su-diffs" id="su-diffs">' +
    '  <button class="mode-btn" data-diff="easy">' + T('gs.sudoku.easy') + '</button>' +
    '  <button class="mode-btn selected" data-diff="normal">' + T('gs.sudoku.normal') + '</button>' +
    '  <button class="mode-btn" data-diff="hard">' + T('gs.sudoku.hard') + '</button>' +
    '  <button class="mode-btn" id="su-note">' + T('gs.sudoku.noteBtn') + '</button>' +
    '</div>' +
    '<div class="su-msg" id="su-msg"></div>';
  root.appendChild(wrap);
  var board = wrap.querySelector('.su-board'), pad = wrap.querySelector('#su-pad'),
      timeEl = wrap.querySelector('#su-time'), msg = wrap.querySelector('#su-msg'),
      diffRow = wrap.querySelector('#su-diffs');
  errEl = wrap.querySelector('#su-err');

  /* 断点续玩（共享模块，仅存本机） */
  function writeSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.write(); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'sudoku',
      collect: function () {
        if (over) return null;
        return {
          puzzle: puzzle, solution: solution, fixed: fixed,
          notes: notes, noteMode: noteMode, difficulty: difficulty,
          dailyMode: dailyMode, errors: errors,
          day: (window.Arcade && Arcade.daily) ? Arcade.daily.dayStr() : '',
          elapsed: Math.round((Date.now() - startTs) / 1000)
        };
      },
      apply: function (s) {
        if (!s || !Array.isArray(s.puzzle) || s.puzzle.length !== 9) return false;
        if (!Array.isArray(s.solution) || s.solution.length !== 9) return false;
        if (!Array.isArray(s.fixed) || s.fixed.length !== 9) return false;
        if (!Array.isArray(s.notes) || s.notes.length !== 9) return false;
        /* 每日题跨天失效：昨天的每日进度不再恢复 */
        if (s.dailyMode && s.day !== ((window.Arcade && Arcade.daily) ? Arcade.daily.dayStr() : '')) return false;
        for (var i = 0; i < 9; i++) {
          if (!Array.isArray(s.puzzle[i]) || s.puzzle[i].length !== 9) return false;
          if (!Array.isArray(s.solution[i]) || s.solution[i].length !== 9) return false;
          if (!Array.isArray(s.fixed[i]) || s.fixed[i].length !== 9) return false;
          if (!Array.isArray(s.notes[i]) || s.notes[i].length !== 9) return false;
        }
        puzzle = s.puzzle;
        solution = s.solution;
        fixed = s.fixed;
        notes = s.notes;
        noteMode = !!s.noteMode;
        difficulty = ['easy', 'normal', 'hard'].indexOf(s.difficulty) >= 0 ? s.difficulty : 'normal';
        dailyMode = !!s.dailyMode;
        errors = Math.max(0, Number(s.errors) || 0);
        var el = Math.max(0, Number(s.elapsed) || 0);
        startTs = Date.now() - el * 1000;
        over = false;
        sel = null;
        if (errEl) errEl.textContent = String(errors);
        var nb = wrap.querySelector('#su-note');
        if (nb) nb.classList.toggle('selected', noteMode);
        var btns = diffRow.getElementsByTagName('button');
        for (var b = 0; b < btns.length; b++) {
          if (btns[b].getAttribute('data-diff')) btns[b].classList.toggle('selected', btns[b].getAttribute('data-diff') === difficulty);
        }
        msg.textContent = '';
        renderBoard();
        highlight();
        return true;
      }
    });
  }

  // 需在 DOM 引用就绪后初始化（applyGen 会写 msg）
  if (!tryResume()) newRandom();

  function renderBoard() {
    board.innerHTML = '';
    for (var r = 0; r < 9; r++) {
      cells[r] = [];
      for (var c = 0; c < 9; c++) {
        var cell = document.createElement('div');
        cell.className = 'su-cell' + (fixed[r][c] ? ' fixed' : '');
        cell.innerHTML = '';
        if (puzzle[r][c]) cell.textContent = puzzle[r][c];
        else if (notes[r][c] && notes[r][c].length) {
          var noteGrid = document.createElement('div');
          noteGrid.className = 'su-notes';
          for (var n = 1; n <= 9; n++) {
            var span = document.createElement('span');
            span.textContent = notes[r][c].indexOf(n) >= 0 ? n : '';
            noteGrid.appendChild(span);
          }
          cell.appendChild(noteGrid);
        }
        (function (rr, cc) { cell.addEventListener('click', function () { select(rr, cc); }); })(r, c);
        board.appendChild(cell);
        cells[r][c] = cell;
      }
    }
  }

  function select(r, c) {
    if (over || fixed[r][c]) { if (Arcade.audio) Arcade.audio.play('error'); return; }
    sel = { r: r, c: c };
    highlight();
    if (Arcade.juice) Arcade.juice.select();
  }
  function highlight() {
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      cells[r][c].classList.remove('sel', 'peer');
      if (sel && (r === sel.r || c === sel.c || (Math.floor(r / 3) === Math.floor(sel.r / 3) && Math.floor(c / 3) === Math.floor(sel.c / 3)))) cells[r][c].classList.add('peer');
    }
    if (sel) cells[sel.r][sel.c].classList.add('sel');
  }
  function place(n) {
    if (!sel || over || fixed[sel.r][sel.c]) return;
    if (noteMode) {
      if (n === 0) { notes[sel.r][sel.c] = []; }
      else {
        notes[sel.r][sel.c] = notes[sel.r][sel.c] || [];
        var idx = notes[sel.r][sel.c].indexOf(n);
        if (idx >= 0) notes[sel.r][sel.c].splice(idx, 1);
        else notes[sel.r][sel.c].push(n);
      }
      puzzle[sel.r][sel.c] = 0;
      cells[sel.r][sel.c].classList.remove('wrong');
      if (Arcade.juice) Arcade.juice.select();
      renderBoard();
      highlight();
      writeSave();
      return;
    }
    puzzle[sel.r][sel.c] = n;
    if (n) {
      notes[sel.r][sel.c] = [];
      // 错误计数：与答案不符即记错（可覆盖改正，但错误数累计）
      if (solution[sel.r] && n !== solution[sel.r][sel.c]) {
        errors++;
        if (errEl) errEl.textContent = errors;
      }
    }
    cells[sel.r][sel.c].textContent = n || ''; // 擦除(0)时清空文字，不显示假 0
    cells[sel.r][sel.c].classList.remove('wrong');
    if (Arcade.juice) { if (n) Arcade.juice.select(); else Arcade.juice.select(); }
    check();
    writeSave();
  }
  function check() {
    var full = true;
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      var v = puzzle[r][c];
      if (!v) { full = false; continue; }
      puzzle[r][c] = 0;
      var ok = valid(puzzle, r, c, v);
      puzzle[r][c] = v;
      cells[r][c].classList.toggle('wrong', !ok);
    }
    if (full && !board.querySelector('.wrong')) win();
  }
  function win() {
    over = true;
    var sec = Math.round((Date.now() - startTs) / 1000);
    msg.textContent = T('gs.sudoku.win').replace('{a}', sec) + (errors > 0 ? T('gs.sudoku.winErr').replace('{n}', errors) : T('gs.sudoku.winClean'));
    msg.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    // 成绩 = 用时 + 错误惩罚（每个错误 +5 秒）
    if (Arcade.shell) Arcade.shell.submitScore(sec + errors * 5);
    if (Arcade.daily && dailyMode) Arcade.daily.markSolved('sudoku', sec + errors * 5);
  }

  ['1','2','3','4','5','6','7','8','9','⌫'].forEach(function (k) {
    var b = document.createElement('div'); b.className = 'su-key' + (k === '⌫' ? ' erase' : '');
    b.textContent = k;
    b.addEventListener('click', function () { place(k === '⌫' ? 0 : parseInt(k, 10)); });
    pad.appendChild(b);
  });

  function tick() {
    if (over) return;
    var s = Math.round((Date.now() - startTs) / 1000);
    timeEl.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    setTimeout(tick, 500);
  }

  wrap.querySelector('#su-new').addEventListener('click', function () {
    newRandom();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  wrap.querySelector('#su-daily').addEventListener('click', function () {
    newDaily();
    if (Arcade.audio) Arcade.audio.play('coin');
  });

  diffRow.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !b.getAttribute('data-diff')) return;
    difficulty = b.getAttribute('data-diff');
    var btns = diffRow.getElementsByTagName('button');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-diff') === difficulty) btns[i].classList.add('selected');
      else btns[i].classList.remove('selected');
    }
    newRandom();
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  var noteBtn = wrap.querySelector('#su-note');
  noteBtn.addEventListener('click', function () {
    noteMode = !noteMode;
    noteBtn.classList.toggle('selected', noteMode);
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  renderBoard();
  tick();
      /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.sudoku.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    newRandom();
  };

})();
