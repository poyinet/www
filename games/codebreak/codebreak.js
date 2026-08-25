/* 大师密码 Code Breaker —— P2 密码破译（含难度递进） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.codebreak.tut1t'), d: T('gs.codebreak.tut1') },
  { t: T('gs.codebreak.tut2t'), d: T('gs.codebreak.tut2') },
  { t: T('gs.codebreak.tut3t'), d: T('gs.codebreak.tut3') },
  { t: T('gs.codebreak.tut4t'), d: T('gs.codebreak.tut4') },
  { t: T('gs.codebreak.tut5t'), d: T('gs.codebreak.tut5') }
];

(function () {
  var root = document.getElementById('game-root');
  var ALL_COLORS = ['#ff2d95', '#ff8c00', '#ffe600', '#39ff14', '#00f0ff', '#b967ff', '#ff4d4d', '#4dffd2'];
  var DIFFS = {
    easy:   { colors: 4, N: 4, MAX: 10 },
    normal: { colors: 6, N: 4, MAX: 10 },
    hard:   { colors: 8, N: 5, MAX: 12 }
  };
  var difficulty = 'normal';
  var COLORS, N, MAX, secret, cur, filled, guesses, over;

  function newGame() {
    var D = DIFFS[difficulty];
    COLORS = ALL_COLORS.slice(0, D.colors);
    N = D.N; MAX = D.MAX;
    secret = []; cur = []; filled = 0; guesses = 0; over = false;
    for (var i = 0; i < N; i++) secret.push(Math.floor(Math.random() * COLORS.length));
  }
  newGame();

  var wrap = document.createElement('div');
  wrap.className = 'mm-wrap';
  wrap.innerHTML =
    '<div class="mode-row" id="mm-diff">' +
    '  <button class="btn mode-btn" data-diff="easy">' + T('gs.codebreak.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-diff="normal">' + T('gs.codebreak.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-diff="hard">' + T('gs.codebreak.dHard') + '</button>' +
    '</div>' +
    '<div class="mm-secret" id="mm-secret"></div>' +
    '<div class="mm-history" id="mm-hist"></div>' +
    '<div class="mm-current" id="mm-cur"></div>' +
    '<div class="mm-palette" id="mm-pal"></div>' +
    '<div class="mm-msg" id="mm-msg"></div>' +
    '<button class="btn accent" id="mm-sub">' + T('gs.codebreak.submit') + '</button>';
  root.appendChild(wrap);
  var diffRow = wrap.querySelector('#mm-diff');
  var secretEl = wrap.querySelector('#mm-secret'), hist = wrap.querySelector('#mm-hist'),
      curEl = wrap.querySelector('#mm-cur'), pal = wrap.querySelector('#mm-pal'),
      msg = wrap.querySelector('#mm-msg'), sub = wrap.querySelector('#mm-sub');

  function buildSecretHoles() {
    secretEl.innerHTML = '';
    for (var s = 0; s < N; s++) {
      var h = document.createElement('div'); h.className = 'mm-hole'; h.textContent = '?';
      secretEl.appendChild(h);
    }
  }
  function renderCur() {
    curEl.innerHTML = '';
    for (var i = 0; i < N; i++) {
      var slot = document.createElement('div'); slot.className = 'mm-slot';
      if (cur[i] !== undefined) slot.style.background = COLORS[cur[i]];
      curEl.appendChild(slot);
    }
  }
  function buildPalette() {
    pal.innerHTML = '';
    COLORS.forEach(function (col, ci) {
      var b = document.createElement('div'); b.className = 'mm-color'; b.style.background = col;
      b.addEventListener('click', function () {
        if (over || filled >= N) return;
        cur[filled] = ci; filled++; renderCur();
        if (Arcade.juice) Arcade.juice.select();
      });
      pal.appendChild(b);
    });
  }
  function revealSecret() {
    secretEl.querySelectorAll('.mm-hole').forEach(function (h, i) {
      h.textContent = ''; h.style.background = COLORS[secret[i]];
    });
  }

  function feedback(g) {
    var black = 0, usedS = {}, usedG = {};
    for (var i = 0; i < N; i++) {
      if (g[i] === secret[i]) { black++; usedS[i] = true; usedG[i] = true; }
    }
    var white = 0;
    for (var a = 0; a < N; a++) {
      if (usedG[a]) continue;
      for (var b2 = 0; b2 < N; b2++) {
        if (usedS[b2]) continue;
        if (g[a] === secret[b2]) { white++; usedS[b2] = true; break; }
      }
    }
    return { black: black, white: white };
  }

  function addHistory(g, fb) {
    var row = document.createElement('div'); row.className = 'mm-row';
    var pegs = document.createElement('div'); pegs.className = 'mm-pegs';
    g.forEach(function (c) { var p = document.createElement('div'); p.className = 'mm-peg'; p.style.background = COLORS[c]; pegs.appendChild(p); });
    var f = document.createElement('div'); f.className = 'mm-fb';
    for (var k = 0; k < N; k++) {
      var d = document.createElement('div'); d.className = 'mm-dot ' + (k < fb.black ? 'b' : (k < fb.black + fb.white ? 'w' : 'e'));
      f.appendChild(d);
    }
    row.appendChild(pegs); row.appendChild(f); hist.appendChild(row);
  }

  sub.addEventListener('click', function () {
    if (over) return;
    if (filled < N) { msg.textContent = T('gs.codebreak.msgFill').replace('{n}', N); if (Arcade.audio) Arcade.audio.play('error'); return; }
    var g = cur.slice();
    var fb = feedback(g);
    addHistory(g, fb);
    guesses++;
    cur = []; filled = 0; renderCur();
    if (fb.black === N) {
      over = true; revealSecret();
      msg.textContent = T('gs.codebreak.msgWin').replace('{n}', guesses);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(guesses);
    } else if (guesses >= MAX) {
      over = true; revealSecret();
      msg.textContent = T('gs.codebreak.msgLose').replace('{code}', secret.map(function (c) { return c + 1; }).join(''));
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
    } else {
      msg.textContent = T('gs.codebreak.feedback').replace('{b}', fb.black).replace('{w}', fb.white).replace('{n}', MAX - guesses);
      msg.style.color = 'var(--text-dim)';
      if (Arcade.audio) Arcade.audio.play('ui');
    }
  });

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      difficulty = b.getAttribute('data-diff');
      msg.textContent = '';
      newGame(); buildSecretHoles(); renderCur(); buildPalette(); hist.innerHTML = '';
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

  buildSecretHoles(); renderCur(); buildPalette();

    var hd=document.createElement('div');hd.style.cssText='font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';hd.textContent=T('gs.codebreak.helpText');root.appendChild(hd);

  window.GAME_RESTART = function () { // 完整重置：清空历史与当前行，避免残留上一局
    msg.textContent = '';
    newGame(); buildSecretHoles(); renderCur(); buildPalette(); hist.innerHTML = '';
  };

})();