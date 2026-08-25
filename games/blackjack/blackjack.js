/* 21点 Blackjack —— Phase3 通用高质量 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.blackjack.tut1t'), d: T('gs.blackjack.tut1') },
  { t: T('gs.blackjack.tut2t'), d: T('gs.blackjack.tut2') },
  { t: T('gs.blackjack.tut3t'), d: T('gs.blackjack.tut3') },
  { t: T('gs.blackjack.tut4t'), d: T('gs.blackjack.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var SUITS = ['♠', '♥', '♦', '♣'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var BET = 10, START = 100, GOAL = 200;

  var deck, player, dealer, chips, phase, hidden;

  function buildDeck() {
    deck = [];
    for (var s = 0; s < SUITS.length; s++) for (var r = 0; r < RANKS.length; r++) deck.push({ s: SUITS[s], r: RANKS[r] });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
  }
  function value(hand) {
    var sum = 0, aces = 0;
    for (var i = 0; i < hand.length; i++) {
      var r = hand[i].r;
      if (r === 'A') { aces++; sum += 11; }
      else if (r === 'J' || r === 'Q' || r === 'K') sum += 10;
      else sum += parseInt(r, 10);
    }
    while (sum > 21 && aces) { sum -= 10; aces--; }
    return sum;
  }
  function draw() { return deck.pop(); }
  function cardText(c) { return c.r + c.s; }

  var wrap = document.createElement('div');
  wrap.className = 'bj-wrap';
  wrap.innerHTML =
    '<div class="bj-stats"><span>' + T('gs.blackjack.chips') + ' <span class="bj-chips" id="bj-chips">100</span></span><span>' + T('gs.blackjack.goal').replace('{n}', GOAL) + '</span></div>' +
    '<div class="bj-hand"><div class="lbl">' + T('gs.blackjack.dealer') + '</div><div class="bj-cards" id="bj-dealer"></div><div class="bj-val" id="bj-dval"></div></div>' +
    '<div class="bj-hand"><div class="lbl">' + T('gs.blackjack.you') + '</div><div class="bj-cards" id="bj-player"></div><div class="bj-val" id="bj-pval"></div></div>' +
    '<div class="bj-msg" id="bj-msg">' + T('gs.blackjack.start') + '</div>' +
    '<div class="bj-btns">' +
    '  <button class="btn green" id="bj-deal">' + T('gs.blackjack.deal') + '</button>' +
    '  <button class="btn yellow" id="bj-hit">' + T('gs.blackjack.hit') + '</button>' +
    '  <button class="btn pink" id="bj-stand">' + T('gs.blackjack.stand') + '</button>' +
    '</div>';
  root.appendChild(wrap);
  var chipsEl = wrap.querySelector('#bj-chips'), dealerEl = wrap.querySelector('#bj-dealer'),
      playerEl = wrap.querySelector('#bj-player'), dvalEl = wrap.querySelector('#bj-dval'),
      pvalEl = wrap.querySelector('#bj-pval'), msg = wrap.querySelector('#bj-msg'),
      dealBtn = wrap.querySelector('#bj-deal'), hitBtn = wrap.querySelector('#bj-hit'), standBtn = wrap.querySelector('#bj-stand');

  function render() {
    playerEl.textContent = player.map(cardText).join(' ');
    pvalEl.textContent = player.length ? T('gs.blackjack.value').replace('{n}', value(player)) : '';
    if (phase === 'player' || phase === 'dealer') {
      dealerEl.textContent = cardText(dealer[0]) + ' 🂠';
      dvalEl.textContent = T('gs.blackjack.upcard').replace('{n}', value([dealer[0]]));
    } else {
      dealerEl.textContent = dealer.map(cardText).join(' ');
      dvalEl.textContent = dealer.length ? T('gs.blackjack.value').replace('{n}', value(dealer)) : '';
    }
    chipsEl.textContent = chips;
    hitBtn.disabled = standBtn.disabled = (phase !== 'player');
    dealBtn.disabled = (phase !== 'idle' && phase !== 'over' && phase !== 'win');
  }

  function deal() {
    if (chips < BET) return;
    buildDeck();
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    phase = 'player';
    msg.textContent = T('gs.blackjack.hitOrStand'); msg.style.color = '';
    if (Arcade.audio) Arcade.audio.play('ui');
    render();
    if (value(player) === 21) stand();
  }

  function hit() {
    if (phase !== 'player') return;
    player.push(draw());
    if (Arcade.juice) Arcade.juice.select();
    render();
    if (value(player) > 21) endRound('bust');
  }

  function stand() {
    if (phase !== 'player') return;
    phase = 'dealer';
    render();
    while (value(dealer) < 17) dealer.push(draw());
    resolve();
  }

  function endRound(kind) {
    phase = 'roundover';
    var pv = value(player), dv = value(dealer), win = false, push = false;
    if (kind === 'bust') { win = false; }
    else if (dv > 21) { win = true; }
    else if (pv > dv) { win = true; }
    else if (pv < dv) { win = false; }
    else { push = true; win = false; }
    if (push) { msg.textContent = T('gs.blackjack.push'); msg.style.color = 'var(--text-dim)'; if (Arcade.audio) Arcade.audio.play('ui'); }
    else if (win) { chips += BET; msg.textContent = T('gs.blackjack.win').replace('{n}', BET); msg.style.color = 'var(--neon-green)'; if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)'); }
    else { chips -= BET; msg.textContent = (kind === 'bust' ? T('gs.blackjack.bust') : T('gs.blackjack.dealerWin')) + ' -' + BET; msg.style.color = 'var(--neon-pink)'; if (Arcade.juice) Arcade.juice.lose(); }
    render();
    if (chips >= GOAL) { phase = 'win'; msg.textContent = T('gs.blackjack.goalWin').replace('{a}', GOAL).replace('{b}', chips); msg.style.color = 'var(--neon-yellow)'; if (Arcade.juice) Arcade.juice.win(); if (Arcade.shell) Arcade.shell.submitScore(chips); }
    else if (chips < BET) { phase = 'over'; msg.textContent = T('gs.blackjack.broke').replace('{n}', chips); msg.style.color = 'var(--neon-pink)'; if (Arcade.shell) Arcade.shell.submitScore(chips); }
    else { phase = 'idle'; }
  }

  function resolve() { endRound('compare'); }

  dealBtn.addEventListener('click', deal);
  hitBtn.addEventListener('click', hit);
  standBtn.addEventListener('click', stand);

  chips = START; phase = 'idle';
  player = []; dealer = [];
  render();
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.blackjack.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    chips = START; phase = 'idle';
    player = []; dealer = [];
    msg.textContent = T('gs.blackjack.restartMsg').replace('{a}', BET).replace('{b}', GOAL); msg.style.color = '';
    render();
  };

})();
