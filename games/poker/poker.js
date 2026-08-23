/* 扑克对决 Poker Duel —— 批次D 棋牌策略（简化德州：2 底牌 + 3 公共牌） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.poker.tut1t'), d: T('gs.poker.tut1') },
  { t: T('gs.poker.tut2t'), d: T('gs.poker.tut2') },
  { t: T('gs.poker.tut3t'), d: T('gs.poker.tut3') },
  { t: T('gs.poker.tut4t'), d: T('gs.poker.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var SUITS = ['♠', '♥', '♦', '♣'];
  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var RV = {}; for (var i = 0; i < RANKS.length; i++) RV[RANKS[i]] = i + 2;
  var START = 100, GOAL = 200, ANTE = 5;

  var deck, playerCards, aiCards, boardCards, pot, chips, phase, round;

  function buildDeck() {
    deck = [];
    for (var s = 0; s < 4; s++) for (var r = 0; r < 13; r++) deck.push({ s: SUITS[s], r: RANKS[r] });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
  }

  /* 5 张牌型评估：返回 [type, tiebreakers...] */
  function evalHand(cards) {
    var vals = cards.map(function (c) { return RV[c.r]; }).sort(function (a, b) { return b - a; });
    var suits = {}, rankCount = {};
    cards.forEach(function (c) { suits[c.s] = (suits[c.s] || 0) + 1; rankCount[RV[c.r]] = (rankCount[RV[c.r]] || 0) + 1; });
    var isFlush = Object.keys(suits).some(function (k) { return suits[k] >= 5; });
    // 顺子（含 A-2-3-4-5 特例）
    var uniq = vals.filter(function (v, idx) { return vals.indexOf(v) === idx; });
    var isStraight = false, high = 0;
    if (uniq.length >= 5) {
      for (var start = 0; start <= uniq.length - 5; start++) {
        if (uniq[start] - uniq[start + 4] === 4) { isStraight = true; high = uniq[start]; break; }
      }
      // A2345 小顺：必须同时含 A(14)、2、3、4、5
      if (!isStraight && uniq.indexOf(14) >= 0 && uniq.indexOf(2) >= 0 && uniq.indexOf(3) >= 0 && uniq.indexOf(4) >= 0 && uniq.indexOf(5) >= 0) { isStraight = true; high = 5; }
    }
    // 统计牌型
    var groups = Object.keys(rankCount).map(function (k) { return { v: Number(k), n: rankCount[k] }; }).sort(function (a, b) { return b.n - a.n || b.v - a.v; });
    var g4 = groups[0] && groups[0].n === 4;
    var g3 = groups.some(function (g) { return g.n === 3; });
    var pairs = groups.filter(function (g) { return g.n === 2; }).length;
    var g3v = groups.filter(function (g) { return g.n === 3; }).map(function (g) { return g.v; })[0] || 0;
    var pairV = groups.filter(function (g) { return g.n === 2; }).map(function (g) { return g.v; });

    if (isFlush && isStraight) return [8, high];
    if (g4) return [7, groups[0].v, groups[1] ? groups[1].v : 0];
    if (g3 && pairs === 1) return [6, g3v, pairV[0]];
    if (isFlush) return [5].concat(vals);
    if (isStraight) return [4, high];
    if (g3) return [3, g3v].concat(vals);
    if (pairs === 2) return [2, pairV[0], pairV[1]].concat(vals);
    if (pairs === 1) return [1, pairV[0]].concat(vals);
    return [0].concat(vals);
  }
  /* 7 张选最佳 5 */
  function bestHand(cards) {
    var best = null;
    for (var a = 0; a < cards.length; a++) for (var b = a + 1; b < cards.length; b++) {
      var five = cards.filter(function (_, idx) { return idx !== a && idx !== b; });
      var ev = evalHand(five);
      if (!best || cmp(ev, best) > 0) best = ev;
    }
    return best;
  }
  function cmp(a, b) {
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      var x = a[i] || 0, y = b[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  function deal() {
    buildDeck();
    playerCards = [deck.pop(), deck.pop()];
    aiCards = [deck.pop(), deck.pop()];
    boardCards = [deck.pop(), deck.pop(), deck.pop()];
    pot = ANTE * 2;
    chips -= ANTE;
    phase = 'bet';
    round = 1;
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function newGame() {
    chips = START;
    deal();
  }

  function cardHtml(c, faceUp) {
    if (!c) return '<div class="pk-card hidden"></div>';
    if (!faceUp) return '<div class="pk-card face-down"></div>';
    var red = c.s === '♥' || c.s === '♦';
    return '<div class="pk-card ' + (red ? 'red' : '') + '"><div>' + c.r + '</div><div>' + c.s + '</div></div>';
  }

  var wrap = document.createElement('div');
  wrap.className = 'pk-wrap';
  wrap.innerHTML =
    '<div class="pk-label">' + T('gs.poker.aiHand').replace('{a}', START).replace('{b}', GOAL) + '</div>' +
    '<div class="pk-hand" id="pk-ai"></div>' +
    '<div class="pk-board" id="pk-board"></div>' +
    '<div class="pk-label">' + T('gs.poker.yourHand') + '</div>' +
    '<div class="pk-hand" id="pk-me"></div>' +
    '<div class="pk-chip">' + T('gs.poker.chips') + ' <span id="pk-chips">' + START + '</span> · ' + T('gs.poker.pot') + ' <span id="pk-pot">0</span></div>' +
    '<div class="pk-msg" id="pk-msg">' + T('gs.poker.newRound') + '</div>' +
    '<div class="game-controls">' +
    '  <button class="btn green" id="pk-call">' + T('gs.poker.call') + '</button>' +
    '  <button class="btn yellow" id="pk-raise">' + T('gs.poker.raise') + '</button>' +
    '  <button class="btn pink" id="pk-fold">' + T('gs.poker.fold') + '</button>' +
    '  <button class="btn purple" id="pk-show" style="display:none">' + T('gs.poker.show') + '</button>' +
    '</div>' +
    '<div class="game-controls"><button class="btn purple" id="pk-restart">' + T('gs.poker.restart') + '</button></div>';
  root.appendChild(wrap);
  var aiEl = wrap.querySelector('#pk-ai'), meEl = wrap.querySelector('#pk-me'), boardEl = wrap.querySelector('#pk-board'),
      chipsEl = wrap.querySelector('#pk-chips'), potEl = wrap.querySelector('#pk-pot'), msg = wrap.querySelector('#pk-msg'),
      callBtn = wrap.querySelector('#pk-call'), raiseBtn = wrap.querySelector('#pk-raise'),
      foldBtn = wrap.querySelector('#pk-fold'), showBtn = wrap.querySelector('#pk-show'),
      restartBtn = wrap.querySelector('#pk-restart');

  function render(showAi) {
    aiEl.innerHTML = aiCards.map(function (c, i) { return cardHtml(c, showAi); }).join('');
    meEl.innerHTML = playerCards.map(function (c) { return cardHtml(c, true); }).join('');
    boardEl.innerHTML = boardCards.map(function (c) { return cardHtml(c, true); }).join('');
    chipsEl.textContent = chips;
    potEl.textContent = pot;
    showBtn.style.display = (phase === 'show' || phase === 'result') ? '' : 'none';
  }

  function resolve(showAi, aiFolded) {
    if (phase === 'result') return; /* E2E 评审修复：result 态重复点摊牌会二次结算刷筹码 */
    phase = 'result';
    render(true);
    if (aiFolded) {
      chips += pot;
      msg.textContent = T('gs.poker.aiFold').replace('{n}', pot);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
      checkEnd();
      return;
    }
    var myBest = bestHand(playerCards.concat(boardCards));
    var aiBest = bestHand(aiCards.concat(boardCards));
    var c = cmp(myBest, aiBest);
    if (c > 0) {
      chips += pot;
      msg.textContent = T('gs.poker.win').replace('{n}', pot);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else if (c < 0) {
      msg.textContent = T('gs.poker.lose').replace('{n}', pot);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
    } else {
      chips += pot / 2;
      msg.textContent = T('gs.poker.draw');
      msg.style.color = 'var(--neon-yellow)';
    }
    checkEnd();
  }

  function checkEnd() {
    render(true);
    if (chips >= GOAL) {
      msg.textContent = T('gs.poker.goalWin').replace('{a}', GOAL).replace('{b}', chips);
      msg.style.color = 'var(--neon-yellow)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(chips);
      callBtn.disabled = raiseBtn.disabled = foldBtn.disabled = showBtn.disabled = true;
    } else if (chips < ANTE) {
      msg.textContent = T('gs.poker.broke').replace('{n}', chips);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.shell) Arcade.shell.submitScore(chips);
      callBtn.disabled = raiseBtn.disabled = foldBtn.disabled = showBtn.disabled = true;
    } else {
      msg.textContent += T('gs.poker.nextRound');
      /* E2E 评审修复：回合间重新发牌并清空底池（原实现同一手牌+累积底池反复结算） */
      callBtn.disabled = raiseBtn.disabled = foldBtn.disabled = showBtn.disabled = true;
      setTimeout(function () {
        if (phase !== 'result') return; /* 期间点了重开则跳过 */
        deal();
        callBtn.disabled = raiseBtn.disabled = foldBtn.disabled = false;
        render(false);
        msg.textContent = T('gs.poker.newRound'); msg.style.color = '';
      }, 900);
    }
  }

  callBtn.addEventListener('click', function () {
    if (chips < ANTE) { msg.textContent = T('gs.poker.noChips'); msg.style.color = 'var(--neon-pink)'; return; }
    chips -= ANTE; pot += ANTE;
    if (Math.random() < 0.25) { resolve(true, true); return; } // AI 偶尔弃牌
    resolve(true, false);
  });
  raiseBtn.addEventListener('click', function () {
    var amt = Math.min(10, chips - ANTE);
    if (amt <= 0) { msg.textContent = T('gs.poker.noChips'); msg.style.color = 'var(--neon-pink)'; return; }
    chips -= ANTE + amt; pot += ANTE + amt;
    if (Math.random() < 0.4) { resolve(true, true); return; }
    resolve(true, false);
  });
  foldBtn.addEventListener('click', function () {
    msg.textContent = T('gs.poker.youFold').replace('{n}', pot);
    msg.style.color = 'var(--text-dim)';
    if (Arcade.audio) Arcade.audio.play('ui');
    checkEnd();
  });
  showBtn.addEventListener('click', function () {
    if (phase === 'show') { resolve(true, false); return; }
    phase = 'show';
    render(false);
    msg.textContent = T('gs.poker.aiShow').replace('{c}', aiCards.map(function (c) { return c.r + c.s; }).join(' '));
    msg.style.color = 'var(--neon-cyan)';
  });

  restartBtn.addEventListener('click', function () { newGame(); callBtn.disabled = raiseBtn.disabled = foldBtn.disabled = showBtn.disabled = false; render(false); msg.textContent = T('gs.poker.newRound'); msg.style.color = ''; if (Arcade.audio) Arcade.audio.play('ui'); });
  window.GAME_RESTART = function () { newGame(); callBtn.disabled = raiseBtn.disabled = foldBtn.disabled = showBtn.disabled = false; render(false); msg.textContent = T('gs.poker.newRound'); msg.style.color = ''; };

  newGame(); render(false);

})();
