/* 快艇骰子 Dice Roll —— 批次D 棋牌策略 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.diceluck.tut1t'), d: T('gs.diceluck.tut1') },
  { t: T('gs.diceluck.tut2t'), d: T('gs.diceluck.tut2') },
  { t: T('gs.diceluck.tut3t'), d: T('gs.diceluck.tut3') },
  { t: T('gs.diceluck.tut4t'), d: T('gs.diceluck.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var CATS = [
    { key: 'ones', label: 'ones', top: true },
    { key: 'twos', label: 'twos', top: true },
    { key: 'threes', label: 'threes', top: true },
    { key: 'fours', label: 'fours', top: true },
    { key: 'fives', label: 'fives', top: true },
    { key: 'sixes', label: 'sixes', top: true },
    { key: 'threeKind', label: 'threeKind' },
    { key: 'fourKind', label: 'fourKind' },
    { key: 'fullHouse', label: 'fullHouse' },
    { key: 'smallStraight', label: 'smallStraight' },
    { key: 'largeStraight', label: 'largeStraight' },
    { key: 'yahtzee', label: 'yahtzee' },
    { key: 'chance', label: 'chance' }
  ];
  var dice, hold, rollsLeft, used, total, over;

  function roll() {
    for (var i = 0; i < 5; i++) if (!hold[i]) dice[i] = 1 + Math.floor(Math.random() * 6);
    rollsLeft--;
  }
  function newGame() {
    dice = [1, 1, 1, 1, 1];
    hold = [false, false, false, false, false];
    rollsLeft = 3;
    used = {};
    total = 0; over = false;
  }

  function counts() {
    var c = [0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 5; i++) c[dice[i]]++;
    return c;
  }
  function scoreFor(key) {
    var c = counts(), sum = 0;
    for (var i = 0; i < 5; i++) sum += dice[i];
    if (key === 'ones') return c[1] * 1;
    if (key === 'twos') return c[2] * 2;
    if (key === 'threes') return c[3] * 3;
    if (key === 'fours') return c[4] * 4;
    if (key === 'fives') return c[5] * 5;
    if (key === 'sixes') return c[6] * 6;
    if (key === 'threeKind') return c.some(function (x) { return x >= 3; }) ? sum : 0;
    if (key === 'fourKind') return c.some(function (x) { return x >= 4; }) ? sum : 0;
    if (key === 'fullHouse') {
      var has2 = false, has3 = false;
      for (var k = 1; k <= 6; k++) { if (c[k] === 2) has2 = true; if (c[k] === 3) has3 = true; }
      return (has2 && has3) ? 25 : 0;
    }
    if (key === 'smallStraight') {
      var s = '';
      for (var k2 = 1; k2 <= 6; k2++) s += c[k2] > 0 ? '1' : '0';
      if (s.indexOf('1111') >= 0) return 30;
      // 小顺可以是 1-2-3-4-5（已是1111）或 2-3-4-5-6（s 含 1111 在偏移1处）
      return 0;
    }
    if (key === 'largeStraight') return (c[1] && c[2] && c[3] && c[4] && c[5]) || (c[2] && c[3] && c[4] && c[5] && c[6]) ? 40 : 0;
    if (key === 'yahtzee') return c.some(function (x) { return x === 5; }) ? 50 : 0;
    return sum;
  }
  function topBonus() {
    var s = 0;
    CATS.filter(function (c) { return c.top; }).forEach(function (c) {
      if (used[c.key]) s += used[c.key];
    });
    return s >= 63 ? 35 : 0;
  }

  var wrap = document.createElement('div');
  wrap.className = 'yz-wrap';
  wrap.innerHTML =
    '<div class="yz-dice" id="yz-dice"></div>' +
    '<div class="game-controls"><button class="btn yellow yz-roll" id="yz-roll">' + T('gs.diceluck.rollBtn').replace('{n}', '3') + '</button></div>' +
    '<table class="yz-tbl" id="yz-tbl"></table>' +
    '<div class="yz-msg" id="yz-msg">' + T('gs.diceluck.msgStart') + '</div>' +
    '<div class="game-controls"><button class="btn purple" id="yz-restart">' + T('gs.diceluck.restart') + '</button></div>';
  root.appendChild(wrap);
  var diceEl = wrap.querySelector('#yz-dice'), tblEl = wrap.querySelector('#yz-tbl'),
      rollBtn = wrap.querySelector('#yz-roll'), msg = wrap.querySelector('#yz-msg'),
      restartBtn = wrap.querySelector('#yz-restart');

  function renderDice() {
    diceEl.innerHTML = '';
    for (var i = 0; i < 5; i++) {
      var d = document.createElement('div');
      d.className = 'yz-die' + (hold[i] ? ' hold' : '');
      d.textContent = '⚀⚁⚂⚃⚄⚅'[dice[i] - 1];
      d.addEventListener('click', function (idx) { return function () { if (rollsLeft < 3 && !over) { hold[idx] = !hold[idx]; renderDice(); if (Arcade.audio) Arcade.audio.play('ui'); } }; }(i));
      diceEl.appendChild(d);
    }
  }

  function renderTbl() {
    var html = '<tr><th>' + T('gs.diceluck.catCol') + '</th><th>' + T('gs.diceluck.scoreCol') + '</th></tr>';
    var topSum = 0;
    CATS.forEach(function (c) {
      var usedV = used[c.key];
      var val = usedV !== undefined ? usedV : (rollsLeft < 3 ? scoreFor(c.key) : '');
      if (c.top && usedV !== undefined) topSum += usedV;
      var cls = usedV !== undefined ? 'used' : (rollsLeft < 3 ? 'can' : '');
      html += '<tr class="' + cls + '" data-key="' + c.key + '"><td>' + T('gs.diceluck.cat.' + c.key) + '</td><td class="num">' + (usedV !== undefined ? usedV : (rollsLeft < 3 ? scoreFor(c.key) : '')) + '</td></tr>';
    });
    html += '<tr><td>' + T('gs.diceluck.topSub') + '</td><td class="num">' + topSum + '</td></tr>';
    html += '<tr><td>' + T('gs.diceluck.topBonus') + '</td><td class="num">' + topBonus() + '</td></tr>';
    var grand = topSum + topBonus();
    CATS.forEach(function (c) { if (used[c.key] !== undefined && !c.top) grand += used[c.key]; });
    html += '<tr class="total"><td>' + T('gs.diceluck.total') + '</td><td class="num">' + grand + '</td></tr>';
    tblEl.innerHTML = html;
    tblEl.querySelectorAll('tr.can').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var key = tr.getAttribute('data-key');
        used[key] = scoreFor(key);
        total = grand;
        if (Arcade.juice) Arcade.juice.select();
        // 新一回合
        hold = [false, false, false, false, false];
        rollsLeft = 3;
        renderDice(); renderTbl();
        if (Object.keys(used).length === CATS.length) finish();
        msg.textContent = T('gs.diceluck.newTurn');
        msg.style.color = '';
      });
    });
  }

  function finish() {
    over = true;
    var grand = 0;
    var topSum = 0;
    CATS.forEach(function (c) { if (c.top) topSum += used[c.key] || 0; });
    grand = topSum + topBonus();
    CATS.forEach(function (c) { if (!c.top) grand += used[c.key] || 0; });
    msg.textContent = T('gs.diceluck.gameOver').replace('{n}', grand);
    msg.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(grand);
  }

  rollBtn.addEventListener('click', function () {
    if (over) return;
    if (rollsLeft <= 0) { msg.textContent = T('gs.diceluck.pickCat'); msg.style.color = 'var(--neon-pink)'; return; }
    roll();
    renderDice(); renderTbl();
    if (Arcade.juice) Arcade.juice.rotate();
    rollBtn.textContent = T('gs.diceluck.rollBtn').replace('{n}', rollsLeft);
    msg.textContent = rollsLeft > 0 ? T('gs.diceluck.canRoll').replace('{n}', rollsLeft) : T('gs.diceluck.pickNow');
    msg.style.color = '';
  });
  restartBtn.addEventListener('click', function () { newGame(); renderDice(); renderTbl(); rollBtn.textContent = T('gs.diceluck.rollBtn').replace('{n}', '3'); msg.textContent = T('gs.diceluck.msgStart'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.diceluck.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { newGame(); renderDice(); renderTbl(); rollBtn.textContent = T('gs.diceluck.rollBtn').replace('{n}', '3'); msg.textContent = T('gs.diceluck.msgStart'); msg.style.color = ''; };

  newGame(); renderDice(); renderTbl();

})();
