/* 汉诺塔 Hanoi —— P2 逻辑解谜 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.hanoi.tut1t'), d: T('gs.hanoi.tut1') },
  { t: T('gs.hanoi.tut2t'), d: T('gs.hanoi.tut2') },
  { t: T('gs.hanoi.tut3t'), d: T('gs.hanoi.tut3') },
  { t: T('gs.hanoi.tut4t'), d: T('gs.hanoi.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var N = 3, moves = 0, over = false, sel = -1;
  var pegs = [];
  var COLORS = ['#ff2d95', '#ff8c00', '#ffe600', '#39ff14', '#00f0ff', '#b967ff'];

  function reset() {
    pegs = [[], [], []];
    for (var i = N; i >= 1; i--) pegs[0].push(i); // 底大顶小
    moves = 0; over = false; sel = -1;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ha-wrap';
  wrap.innerHTML =
    '<div class="ha-select">' + T('gs.hanoi.diskCount') + '<button data-n="3">3</button><button data-n="4">4</button><button data-n="5">5</button></div>' +
    '<div class="ha-pegs" id="ha-pegs"><div class="ha-base"></div></div>' +
    '<div class="ha-msg" id="ha-msg"></div>';
  root.appendChild(wrap);
  var pegsEl = wrap.querySelector('#ha-pegs'), msg = wrap.querySelector('#ha-msg');
  wrap.querySelectorAll('.ha-select button').forEach(function (b) {
    b.addEventListener('click', function () { N = parseInt(b.dataset.n, 10); reset(); render(); if (Arcade.audio) Arcade.audio.play('ui'); });
  });

  function render() {
    pegsEl.innerHTML = '<div class="ha-base"></div>';
    for (var p = 0; p < 3; p++) {
      var col = document.createElement('div');
      col.className = 'ha-peg' + (sel === p ? ' sel' : '');
      for (var i = 0; i < pegs[p].length; i++) {
        var d = document.createElement('div');
        var sz = pegs[p][i];
        d.className = 'ha-disk';
        d.style.width = (28 + sz * 12) + 'px';
        d.style.background = COLORS[(sz - 1) % COLORS.length];
        d.style.boxShadow = '0 0 8px ' + COLORS[(sz - 1) % COLORS.length];
        col.appendChild(d);
      }
      (function (pp) { col.addEventListener('click', function () { clickPeg(pp); }); })(p);
      pegsEl.appendChild(col);
    }
    msg.textContent = T('gs.hanoi.hud').replace('{n}', moves).replace('{m}', Math.pow(2, N) - 1);
    msg.style.color = 'var(--text-dim)';
  }

  function clickPeg(p) {
    if (over) return;
    if (sel === -1) {
      if (!pegs[p].length) { if (Arcade.audio) Arcade.audio.play('error'); return; }
      sel = p; render(); if (Arcade.juice) Arcade.juice.select(); return;
    }
    if (sel === p) { sel = -1; render(); return; }
    var top = pegs[sel][pegs[sel].length - 1];
    if (pegs[p].length && pegs[p][pegs[p].length - 1] < top) {
      msg.textContent = T('gs.hanoi.invalid'); msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
      sel = -1; render(); return;
    }
    pegs[p].push(pegs[sel].pop());
    moves++; sel = -1;
    if (Arcade.juice) Arcade.juice.move();
    if (pegs[2].length === N) {
      over = true;
      msg.textContent = T('gs.hanoi.win').replace('{n}', moves);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(moves);
    } else render();
  }

  reset(); render();
  window.GAME_RESTART = function () { reset(); render(); };

})();
