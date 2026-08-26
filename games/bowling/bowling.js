/* ============================================================
   保龄球 Bowling · 物理投球 + 标准计分旗舰（P2 品类旗舰）
   10 帧标准计分（Strike/Spare/第 10 帧追加投），
   角度/力度/旋转投球，偏移量决定击倒数。
   记分：总分（max 模式）。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bowling.tut1t'), d: T('gs.bowling.tut1') },
  { t: T('gs.bowling.tut2t'), d: T('gs.bowling.tut2') },
  { t: T('gs.bowling.tut3t'), d: T('gs.bowling.tut3') }
];

(function () {
  /* ==BOWL-CORE-START== */
  var BWLCORE = (function () {
    /* 标准保龄球计分：frames = [[r1,r2], [r1,r2], ..., [r1,r2,r3?]] */
    function bowlingScore(frames) {
      var rolls = [];
      frames.forEach(function (f) { f.forEach(function (r) { rolls.push(r); }); });
      var total = 0, ri = 0;
      for (var f = 0; f < 10 && ri < rolls.length; f++) {
        if (rolls[ri] === 10) {
          total += 10 + (rolls[ri + 1] || 0) + (rolls[ri + 2] || 0);
          ri++;
        } else {
          var sum = rolls[ri] + (rolls[ri + 1] || 0);
          if (sum === 10) total += 10 + (rolls[ri + 2] || 0);
          else total += sum;
          ri += 2;
        }
      }
      return total;
    }
    /* 击倒数：offset（横向偏移）+ curve（旋转偏移）+ power（力度 0-1）决定 */
    function pinsFromThrow(offset, power, curve) {
      var eff = Math.abs(offset + curve);
      var raw = 10 - Math.floor(eff / 5);
      var factor = Math.max(0, Math.min(1, (power - 0.15) / 0.6)); // 力度不足成比例打折
      return Math.round(Math.max(0, raw) * factor);
    }
    /* 本帧投球：当前击倒的瓶（模拟部分击倒的瓶随机，计分只依赖击倒数） */
    function pinsAfterSecond(first, offset2, power2, curve2) {
      if (first === 10) return 10;
      var p2 = pinsFromThrow(offset2, power2, curve2);
      return Math.min(10 - first, p2); // 第二次只能击倒剩余的
    }
    return { bowlingScore: bowlingScore, pinsFromThrow: pinsFromThrow, pinsAfterSecond: pinsAfterSecond };
  })();
  /* ==BOWL-CORE-END== */

  var bowlingScore = BWLCORE.bowlingScore, pinsFromThrow = BWLCORE.pinsFromThrow, pinsAfterSecond = BWLCORE.pinsAfterSecond;

  var root = document.getElementById('game-root');
  var W = 440, H = 300;
  var paused = false;
  var html =
    '<div class="bw-top">' +
    '  <span>' + T('gs.bowling.hudFrame').replace('{n}', '<b id="bw-frame">1</b>').replace('{m}', '<b id="bw-ball">1</b>') + '</span>' +
    '  <span>' + T('gs.bowling.total') + ' <b id="bw-total">0</b></span>' +
    '</div>' +
    '<div class="mode-row" id="bw-diffs">' +
    '  <button class="btn mode-btn" data-d="easy">' + T('gs.bowling.dEasy') + '</button>' +
    '  <button class="btn mode-btn selected" data-d="normal">' + T('gs.bowling.dNormal') + '</button>' +
    '  <button class="btn mode-btn" data-d="hard">' + T('gs.bowling.dHard') + '</button>' +
    '</div>' +
    '<div class="bw-stage"><canvas class="bw-canvas" id="bw-canvas" width="' + W + '" height="' + H + '"></canvas></div>' +
    '<div class="bw-ctrl">' +
    '  <div class="bw-lbl">🎯 ' + T('gs.bowling.angle') + ' <b id="bw-anglbl">0</b> · ' + T('gs.bowling.power') + ' <b id="bw-powlbl">80</b> · ' + T('gs.bowling.curve') + ' <b id="bw-curvelbl">0</b></div>' +
    '  <input type="range" id="bw-ang" min="-40" max="40" value="0" aria-label="' + T('gs.bowling.angle') + '">' +
    '  <input type="range" id="bw-pow" min="0" max="100" value="80" aria-label="' + T('gs.bowling.power') + '">' +
    '  <input type="range" id="bw-curve" min="-30" max="30" value="0" aria-label="' + T('gs.bowling.curve') + '">' +
    '  <div class="game-controls"><button class="btn green" id="bw-throw">🎳 ' + T('gs.bowling.throw') + '</button></div>' +
    '</div>' +
    '<div class="bw-board" id="bw-board"></div>';
  root.innerHTML = html;

  var canvas = document.getElementById('bw-canvas');
  var ctx = canvas.getContext('2d');
  var frameEl = document.getElementById('bw-frame'), ballEl = document.getElementById('bw-ball'),
      totalEl = document.getElementById('bw-total'), throwBtn = document.getElementById('bw-throw'),
      angEl = document.getElementById('bw-ang'), powEl = document.getElementById('bw-pow'),
      curveEl = document.getElementById('bw-curve'), boardEl = document.getElementById('bw-board'),
      angLbl = document.getElementById('bw-anglbl'), powLbl = document.getElementById('bw-powlbl'),
      curveLbl = document.getElementById('bw-curvelbl'), diffRow = document.getElementById('bw-diffs');

  var DIFFS = { easy: { jitter: 2 }, normal: { jitter: 5 }, hard: { jitter: 9 } };
  var diff = 'normal';
  var D = DIFFS[diff];

  var frames = [], frame = 1, ball = 1, first = null, anim = null, over = false;
  var pinsStanding = 10, lanes = [];
  var settleTimer = null;

  function newGame() {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    frames = [];
    for (var i = 0; i < 10; i++) frames.push([]);
    frame = 1; ball = 1; first = null; over = false; anim = null;
    pinsStanding = 10;
    frameEl.textContent = '1'; ballEl.textContent = '1'; totalEl.textContent = '0';
    renderBoard();
  }

  function throwBall() {
    if (over || anim || paused) return;
    var ang = parseInt(angEl.value, 10) || 0;
    var pow = (parseInt(powEl.value, 10)) / 100;
    var curve = parseInt(curveEl.value, 10) || 0;
    var offset = ang + (Math.random() - 0.5) * 2 * D.jitter;
    // 第 10 帧追加投（ball=3）或 Strike 后第二球（first=10）用全新 10 瓶判定；其余第二投用剩余瓶
    var pins = (ball === 1 || ball === 3 || first === 10) ? pinsFromThrow(offset, pow, curve) : pinsAfterSecond(first, offset, pow, curve);
    var target = { pins: pins, fromX: 0 };
    anim = { x: W / 2, y: H - 20, pins: pins, t: 0 };
    if (Arcade.audio) Arcade.audio.play('coin');
    // 投球动画结束后结算（保存句柄供重开清理）
    settleTimer = setTimeout(function () { settleTimer = null; settle(target.pins); }, 500);
  }

  function settle(pins) {
    anim = null;
    frames[frame - 1].push(pins);
    if (frame < 10) {
      if (ball === 1 && pins === 10) { frame++; ball = 1; first = null; }
      else if (ball === 1) { first = pins; ball = 2; }
      else { frame++; ball = 1; first = null; }
    } else {
      // 第 10 帧：strike/spare 追加投球（最多 3 投）
      if (ball === 1) first = pins;
      var f10 = frames[9];
      var more = f10.length < 3 && (f10.length < 2 || f10[0] === 10 || f10[0] + f10[1] === 10);
      if (more) ball++;
      else { over = true; ball = 1; }
    }
    pinsStanding = (ball === 1 || ball === 3 || first === 10) ? 10 : 10 - (first || 0);
    frameEl.textContent = Math.min(10, frame);
    ballEl.textContent = ball;
    var total = bowlingScore(frames);
    totalEl.textContent = total;
    renderBoard();
    if (over) {
      if (Arcade.shell) Arcade.shell.submitScore(total);
      if (total >= 200 && Arcade.juice) Arcade.juice.win();
    }
  }

  function renderBoard() {
    var html = '';
    for (var i = 0; i < 10; i++) {
      var f = frames[i];
      var t = bowlingScore(frames.slice(0, i + 1));
      var disp = '';
      for (var r = 0; r < f.length; r++) {
        var v = f[r];
        if (v === 10) disp += 'X';
        else if (r > 0 && f[r - 1] !== 10 && f[r - 1] + v === 10) disp += '/';
        else disp += v;
      }
      html += '<div class="bw-frame"><div class="bw-fn">' + (i + 1) + '</div><div class="bw-fr">' + disp +
        '</div><div class="bw-ts">' + t + '</div></div>';
    }
    boardEl.innerHTML = html;
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    if (paused) return;
    ctx.fillStyle = '#1a1208'; ctx.fillRect(0, 0, W, H);
    // 球道
    ctx.fillStyle = '#2a1f0f';
    ctx.fillRect(30, 10, W - 60, H - 40);
    // 球瓶（三角 4-3-2-1）
    var pins = 10;
    var rows = 4;
    var pi = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c <= r; c++) {
        if (pi >= pins) break;
        var x = W / 2 + (c - r / 2) * 18;
        var y = 40 + r * 22;
        ctx.fillStyle = pi < pinsStanding ? '#ffe600' : '#555';
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        pi++;
      }
    }
    // 投球动画
    if (anim) {
      anim.t++;
      ctx.fillStyle = '#39ff14';
      ctx.beginPath(); ctx.arc(anim.x, anim.y - anim.t * 6, 7, 0, Math.PI * 2); ctx.fill();
    }
  }

  throwBtn.addEventListener('click', throwBall);
  angEl.addEventListener('input', function () { angLbl.textContent = angEl.value; });
  powEl.addEventListener('input', function () { powLbl.textContent = powEl.value; });
  curveEl.addEventListener('input', function () { curveLbl.textContent = curveEl.value; });

  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      b.classList.add('selected');
      diff = b.getAttribute('data-d');
      D = DIFFS[diff];
      paused = false;
      newGame();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.bowling.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    paused = false;
    D = DIFFS[diff];
    newGame();
  };

  /* P 键暂停（实时类统一约定） */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P') {
      paused = !paused;
      if (paused) { if (loopApi) loopApi.pause(); }
      else { if (loopApi) loopApi.resume(); }
      if (Arcade.ui) Arcade.ui.toast(paused ? T('gs.bowling.paused') : T('gs.bowling.resume'), 'warn');
      if (Arcade.audio) Arcade.audio.play('ui');
    }
  });

  // 初始化
  newGame();
  var loopApi = Arcade.loop.start(update, draw, 16);
  function update() { /* 动画在 draw 中推进 */ }


})();
