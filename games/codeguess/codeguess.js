/* 猜词破译 Code Guess —— P2 密码破译 */
(function () {
  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.codeguess.tut1t'), d: T('gs.codeguess.tut1') },
    { t: T('gs.codeguess.tut2t'), d: T('gs.codeguess.tut2') },
    { t: T('gs.codeguess.tut3t'), d: T('gs.codeguess.tut3') },
    { t: T('gs.codeguess.tut4t'), d: T('gs.codeguess.tut4') }
  ];
  var root = document.getElementById('game-root');
  /* 答案词表：必须恰好 5 字母（4/6 字母词会破坏第 5 格判定/可用前缀错误取胜） */
  var WORDS = ['CRANE', 'SLATE', 'STONE', 'BRICK', 'FLAME', 'GHOST', 'PLANT', 'METAL', 'CODEX', 'LOGIC',
    'RADAR', 'LASER', 'TURBO', 'PIXEL', 'ROBOT', 'GLYPH', 'TOKEN', 'ORBIT', 'GAMMA', 'DELTA',
    'OMEGA', 'ALPHA', 'PRISM', 'CRYPT', 'RELIC', 'RUNES', 'VAULT', 'RUNIC', 'SPELL', 'CHARM',
    'TOTEM', 'ARENA', 'BASIC', 'CABIN', 'DREAM', 'EAGLE', 'FROST', 'GLOBE', 'HORIZ', 'IMAGE',
    'JOKER', 'KNEEL', 'LIGHT', 'MAGIC', 'NORTH', 'OCEAN', 'PULSE', 'QUEST', 'RIDER', 'STORM'];
  var ROWS = 6, COLS = 5;
  var answer = WORDS[Math.floor(Math.random() * WORDS.length)];
  var grid = [], guess = [], row = 0, col = 0, over = false;
  var kb = {};

  var wrap = document.createElement('div');
  wrap.className = 'wd-wrap';
  wrap.innerHTML = '<div class="wd-board"></div><div class="wd-msg"></div><div class="wd-kb"></div>';
  root.appendChild(wrap);
  var board = wrap.querySelector('.wd-board');
  var msgEl = wrap.querySelector('.wd-msg');
  var kbEl = wrap.querySelector('.wd-kb');

  // 结算后「再来一局」按钮（胜/负后显示；此前需用顶栏重开）
  var againBtn = document.createElement('button');
  againBtn.className = 'btn purple';
  againBtn.style.display = 'none';
  againBtn.style.marginTop = '10px';
  againBtn.textContent = T('gs.codeguess.again');
  againBtn.addEventListener('click', function () { if (window.GAME_RESTART) window.GAME_RESTART(); });
  wrap.appendChild(againBtn);
  function showAgain() { againBtn.style.display = 'inline-block'; }

  // 构建棋盘
  for (var r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (var c = 0; c < COLS; c++) {
      var cell = document.createElement('div');
      cell.className = 'wd-cell';
      board.appendChild(cell);
      grid[r][c] = cell;
    }
  }

  // 屏幕键盘
  var LAYOUT = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  LAYOUT.forEach(function (rowStr, i) {
    var rowEl = document.createElement('div');
    rowEl.className = 'wd-krow';
    if (i === 2) {
      var ent = mkKey('ENTER', 'wide'); ent.dataset.act = 'enter';
      var bk = mkKey('⌫', 'wide'); bk.dataset.act = 'back';
      rowEl.appendChild(ent); rowEl.appendChild(bk);
    }
    rowStr.split('').forEach(function (ch) {
      var k = mkKey(ch); k.dataset.ch = ch; kb[ch] = k; rowEl.appendChild(k);
    });
    if (i === 2) { rowEl.appendChild(ent0()); }
    kbEl.appendChild(rowEl);
  });
  function ent0() { return document.createTextNode(''); }

  function mkKey(label, extra) {
    var b = document.createElement('div');
    b.className = 'wd-key' + (extra ? ' ' + extra : '');
    b.textContent = label;
    b.addEventListener('click', function () {
      if (b.dataset.act === 'enter') submit();
      else if (b.dataset.act === 'back') del();
      else add(b.dataset.ch);
    });
    return b;
  }
  function keyEl(ch) { return kbEl.querySelector('[data-ch="' + ch + '"]'); }

  function add(ch) {
    if (over || col >= COLS) return;
    guess[col] = ch;
    grid[row][col].textContent = ch;
    grid[row][col].classList.add('filled');
    col++;
    if (Arcade.juice) Arcade.juice.select();
  }
  function del() {
    if (over || col <= 0) return;
    col--;
    grid[row][col].textContent = '';
    grid[row][col].classList.remove('filled');
    guess[col] = null;
    if (Arcade.juice) Arcade.juice.select();
  }

  function evaluate() {
    var used = {}, res = [];
    for (var i = 0; i < COLS; i++) {
      if (guess[i] === answer[i]) { res[i] = 'g'; used[i] = true; }
      else res[i] = null;
    }
    for (var j = 0; j < COLS; j++) {
      if (res[j] === 'g') continue;
      var found = -1;
      for (var k = 0; k < COLS; k++) {
        if (!used[k] && answer[k] === guess[j]) { found = k; break; }
      }
      res[j] = found >= 0 ? 'y' : 'x';
      if (found >= 0) used[found] = true;
    }
    return res;
  }

  function paintKey(ch, cls) {
    var el = keyEl(ch);
    if (!el) return;
    if (cls === 'g' || (cls === 'y' && !el.classList.contains('g')) || (cls === 'x' && !el.classList.contains('g') && !el.classList.contains('y')))
      el.className = 'wd-key ' + cls;
  }

  function submit() {
    if (over) return;
    if (col < COLS) { msgEl.textContent = T('gs.codeguess.notFull'); if (Arcade.audio) Arcade.audio.play('error'); return; }
    var word = guess.join('');
    var res = evaluate();
    var allG = true;
    for (var i = 0; i < COLS; i++) {
      grid[row][i].classList.add(res[i]);
      paintKey(guess[i], res[i]);
      if (res[i] !== 'g') allG = false;
    }
    if (Arcade.juice) { if (allG) Arcade.juice.win(); else Arcade.juice.clear(null, null, 'var(--accent)', 8); }

    if (allG) {
      over = true;
      var att = row + 1;
      msgEl.textContent = T('gs.codeguess.win').replace('{n}', att);
      msgEl.style.color = 'var(--neon-green)';
      if (Arcade.shell) Arcade.shell.submitScore(att);
      showAgain();
      return;
    }
    row++; col = 0; guess = [];
    if (row >= ROWS) {
      over = true;
      msgEl.textContent = T('gs.codeguess.reveal').replace('{w}', answer);
      msgEl.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
      showAgain();
    } else {
      msgEl.textContent = T('gs.codeguess.continue').replace('{n}', ROWS - row);
      msgEl.style.color = 'var(--text-dim)';
    }
  }

  document.addEventListener('keydown', function (e) {
    if (over) return;
    var k = e.key.toUpperCase();
    if (k === 'ENTER') submit();
    else if (k === 'BACKSPACE') del();
    else if (k.length === 1 && k >= 'A' && k <= 'Z') add(k);
  });

    window.GAME_RESTART = function () {
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    row = 0; col = 0; guess = []; over = false;
    for (var ri = 0; ri < ROWS; ri++) for (var ci = 0; ci < COLS; ci++) {
      grid[ri][ci].className = 'wd-cell';
    }
    for (var ch in kb) if (kb[ch]) kb[ch].className = 'wd-key';
    msgEl.textContent = ''; msgEl.style.color = '';
  };

})();
