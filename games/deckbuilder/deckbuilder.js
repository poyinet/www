/* 卡牌构筑 Deck Builder —— 横向新游戏 策略重头戏（简化杀戮尖塔） */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.deckbuilder.tut1t'), d: T('gs.deckbuilder.tut1') },
  { t: T('gs.deckbuilder.tut2t'), d: T('gs.deckbuilder.tut2') },
  { t: T('gs.deckbuilder.tut3t'), d: T('gs.deckbuilder.tut3') },
  { t: T('gs.deckbuilder.tut4t'), d: T('gs.deckbuilder.tut4') }
];

(function () {
  var root = document.getElementById('game-root');

  var CARDS = {
    strike:  { name: 'strike', cost: 1, type: 'atk', dmg: 6, desc: 'strike' },
    defend:  { name: 'defend', cost: 1, type: 'def', block: 5, desc: 'defend' },
    double:  { name: 'double', cost: 2, type: 'atk', dmg: 12, desc: 'double' },
    heal:    { name: 'heal', cost: 1, type: 'sp', heal: 8, desc: 'heal' },
    poison:  { name: 'poison', cost: 2, type: 'sp', poison: 6, desc: 'poison' },
    shield:  { name: 'shield', cost: 2, type: 'def', block: 12, desc: 'shield' },
    energy:  { name: 'energy', cost: 0, type: 'sp', energy: 2, desc: 'energy' }
  };

  var BOSSES = [
    { name: 'boss1', hp: 55, maxHp: 55, atk: 7, intent: 'atk' },
    { name: 'boss2', hp: 85, maxHp: 85, atk: 10, intent: 'atk' },
    { name: 'boss3', hp: 130, maxHp: 130, atk: 13, intent: 'atk' }
  ];

  /* 遗物：被动效果（路线选择·宝箱 / 战斗胜利获得） */
  var RELICS = {
    blood:  { name: 'blood', desc: 'blood' },
    blade:  { name: 'blade', desc: 'blade' },
    thorn:  { name: 'thorn', desc: 'thorn' },
    energy: { name: 'energy', desc: 'energy' },
    shield: { name: 'shield', desc: 'shield' },
    toxin:  { name: 'toxin', desc: 'toxin' }
  };
  var STRONG_CARDS = {
    fireball: { name: 'fireball', cost: 2, type: 'atk', dmg: 18, desc: 'fireball' },
    barrier:  { name: 'barrier', cost: 2, type: 'def', block: 16, desc: 'barrier' },
    vamp:     { name: 'vamp', cost: 2, type: 'atk', dmg: 10, heal: 5, desc: 'vamp' },
    lightning:{ name: 'lightning', cost: 3, type: 'atk', dmg: 26, desc: 'lightning' }
  };
  var ELITE = { name: 'elite', intent: 'atk' };

  var DECK_START = ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'double', 'heal'];

  var draw, discard, hand, energy, maxEnergy, block, hp, maxHp, boss, bossIdx, poison, over, won, log, msg;
  var relics, phase, isElite, bossDown;
  var bossTimer = null; // 换 Boss 定时器（重开时清理，防跨局触发 nextBoss）

  /* ---------- 断点续玩（共享模块 Arcade.savegame：自动 + 恢复；仅存本机） ---------- */
  function writeSave() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.write()); }
  function clearSave() { if (window.Arcade && Arcade.savegame) Arcade.savegame.clear(); }
  function tryResume() { return !!(window.Arcade && Arcade.savegame && Arcade.savegame.resume()); }
  if (window.Arcade && Arcade.savegame) {
    Arcade.savegame.setup({
      id: 'deckbuilder',
      collect: function () {
        /* 终局（通关/失败）→ 无局可存，自动清档 */
        if (over) return null;
        return {
          draw: draw, discard: discard, hand: hand, energy: energy, maxEnergy: maxEnergy,
          block: block, hp: hp, maxHp: maxHp, boss: boss, bossIdx: bossIdx, poison: poison,
          relics: relics, phase: phase, isElite: isElite, bossDown: bossDown, log: log,
          /* bossTimer 非空 => 处于「击败 Boss 后待换 Boss」的过渡，恢复时直接推进 */
          pendingNext: bossTimer !== null
        };
      },
      apply: function (s) {
        if (!s || !Array.isArray(s.draw) || !Array.isArray(s.hand) || !Array.isArray(s.discard) ||
            !Array.isArray(s.relics) || !s.boss || typeof s.hp !== 'number' || typeof s.bossIdx !== 'number') {
          return false;
        }
        draw = s.draw; discard = s.discard; hand = s.hand;
        energy = s.energy; maxEnergy = s.maxEnergy; block = s.block;
        hp = s.hp; maxHp = s.maxHp; boss = s.boss; bossIdx = s.bossIdx;
        poison = s.poison || 0; relics = s.relics; isElite = !!s.isElite; bossDown = !!s.bossDown;
        log = s.log || ''; over = false; won = false; bossTimer = null;
        if (s.pendingNext) nextBoss();
        else phase = s.phase || 'fight';
        if (phase === 'choose') choiceEl.classList.remove('hidden');
        else choiceEl.classList.add('hidden');
        render();
        return true;
      }
    });
  }

  function reset() {
    clearSave();
    if (bossTimer) { clearTimeout(bossTimer); bossTimer = null; }
    draw = DECK_START.slice();
    discard = [];
    hand = [];
    energy = maxEnergy = 3;
    block = 0;
    hp = maxHp = 80;
    bossIdx = 0;
    poison = 0;
    over = false; won = false;
    relics = [];
    phase = 'fight'; isElite = false; bossDown = false;
    boss = BOSSES[0];
    shuffle();
    startTurn();
  }

  function shuffle() {
    for (var i = draw.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = draw[i]; draw[i] = draw[j]; draw[j] = t;
    }
  }

  function startTurn() {
    energy = maxEnergy + (relics.indexOf('energy') >= 0 ? 1 : 0);
    block = 0;
    if (relics.indexOf('shield') >= 0) block += 2;
    // 抽到 5 张
    for (var i = hand.length; i < 5; i++) {
      if (!draw.length) {
        draw = discard.slice();
        discard = [];
        shuffle();
      }
      if (draw.length) hand.push(draw.pop());
    }
    // 敌人毒伤
    if (poison > 0) {
      boss.hp -= poison;
      log = T('gs.deckbuilder.poisonTick').replace('{n}', poison);
      if (boss.hp <= 0) { boss.hp = 0; onBossDown(); return; }
    }
  }

  function gainRelic(key) {
    if (relics.indexOf(key) >= 0) return false;
    relics.push(key);
    if (key === 'blood') hp = Math.min(maxHp, hp + 10);
    return true;
  }

  function healRelic() {
    if (relics.indexOf('blood') >= 0) hp = Math.min(maxHp, hp + 10);
  }

  /* 击败敌人后的路线选择 */
  function showChoice() {
    phase = 'choose';
    choiceEl.classList.remove('hidden');
  }
  function nextBoss() {
    bossIdx++;
    boss = BOSSES[bossIdx];
    poison = 0;
    isElite = false;
    bossDown = false;
    phase = 'fight';
    msg.textContent = T('gs.deckbuilder.bossAppear').replace('{a}', bossIdx + 1).replace('{b}', BOSSES.length).replace('{c}', T('gs.deckbuilder.' + boss.name + '.n'));
    msg.style.color = 'var(--neon-yellow)';
    if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-pink)');
    render(); // 刷新 Boss 名/血条/意图（此前换 Boss 后画面停留旧 Boss）
  }
  function startElite() {
    isElite = true;
    boss = { name: ELITE.name, hp: 42 + bossIdx * 22, maxHp: 42 + bossIdx * 22, atk: 9 + bossIdx * 2, intent: ELITE.intent };
    poison = 0;
    bossDown = false;
    phase = 'fight';
    choiceEl.classList.add('hidden');
    msg.textContent = T('gs.deckbuilder.eliteFight');
    msg.style.color = 'var(--neon-pink)';
    render(); // 同上：立即刷新精英战画面
  }
  function onBossDown() {
    if (bossDown) return; // 防重复结算（毒/荆棘/胜利窗口期内多次触发）
    bossDown = true;
    healRelic();
    if (isElite) {
      // 精英胜利：随机获得强力卡 + 回血
      var keys = Object.keys(STRONG_CARDS);
      var k = keys[Math.floor(Math.random() * keys.length)];
      draw.push(k);
      hp = Math.min(maxHp, hp + 10);
      msg.textContent = T('gs.deckbuilder.eliteWin').replace('{card}', T('gs.deckbuilder.card.' + k + '.n'));
      msg.style.color = 'var(--neon-green)';
      if (Arcade.audio) Arcade.audio.play('coin');
      if (bossTimer) clearTimeout(bossTimer);
      bossTimer = setTimeout(nextBoss, 1500);
      return;
    }
    if (bossIdx >= BOSSES.length - 1) {
      over = true; won = true;
      var score = bossIdx * 100 + hp + relics.length * 15;
      msg.textContent = T('gs.deckbuilder.allClear').replace('{n}', score);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(score);
      return;
    }
    // Boss 战间路线选择
    msg.textContent = T('gs.deckbuilder.bossDown').replace('{name}', T('gs.deckbuilder.' + boss.name + '.n'));
    msg.style.color = 'var(--neon-yellow)';
    showChoice();
  }

  function playCard(idx) {
    if (over || won || phase === 'choose') return;
    var key = hand[idx];
    var card = CARDS[key] || STRONG_CARDS[key];
    if (!card) return;
    if (energy < card.cost) return;
    energy -= card.cost;
    var effects = [];
    var hasBlade = relics.indexOf('blade') >= 0;
    var hasToxin = relics.indexOf('toxin') >= 0;
    if (card.dmg) {
      var d = card.dmg + (hasBlade && card.type === 'atk' ? 2 : 0);
      boss.hp -= d; effects.push(T('gs.deckbuilder.effDmg').replace('{n}', d));
    }
    if (card.block) { block += card.block; effects.push(T('gs.deckbuilder.effBlock').replace('{n}', card.block)); }
    if (card.heal) { hp = Math.min(maxHp, hp + card.heal); effects.push(T('gs.deckbuilder.effHeal').replace('{n}', card.heal)); }
    if (card.poison) { var p = hasToxin ? Math.round(card.poison * 1.5) : card.poison; poison += p; effects.push(T('gs.deckbuilder.effPoison').replace('{n}', p)); }
    if (card.energy) { energy += card.energy; effects.push(T('gs.deckbuilder.effEnergy').replace('{n}', card.energy)); }
    log = T('gs.deckbuilder.playLog').replace('{card}', T('gs.deckbuilder.card.' + key + '.n')).replace('{effects}', effects.join(T('gs.deckbuilder.effSep')));
    hand.splice(idx, 1);
    discard.push(key);
    if (Arcade.juice) Arcade.juice.select();
    if (boss.hp <= 0) {
      boss.hp = 0;
      onBossDown();
    }
    render();
    writeSave();
  }

  function endTurn() {
    if (over || won || phase === 'choose') return;
    // 敌人攻击
    var dmg = boss.atk - block;
    if (dmg > 0) {
      hp -= dmg;
      if (relics.indexOf('thorn') >= 0) { boss.hp -= 3; log = T('gs.deckbuilder.thornLog').replace('{name}', T('gs.deckbuilder.' + boss.name + '.n')).replace('{d}', dmg); }
      else log = (block > 0 ? T('gs.deckbuilder.hitLogBlock') : T('gs.deckbuilder.hitLog')).replace('{name}', T('gs.deckbuilder.' + boss.name + '.n')).replace('{d}', dmg).replace('{b}', boss.atk);
      if (Arcade.audio) Arcade.audio.play('error');
      if (boss.hp <= 0) { boss.hp = 0; onBossDown(); }
    } else {
      log = T('gs.deckbuilder.fullBlock').replace('{name}', T('gs.deckbuilder.' + boss.name + '.n'));
    }
    // 弃手牌
    discard = discard.concat(hand);
    hand = [];
    if (hp <= 0) {
      hp = 0; over = true;
      msg.textContent = T('gs.deckbuilder.dead').replace('{a}', bossIdx).replace('{b}', BOSSES.length);
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.juice) Arcade.juice.lose();
      var score2 = bossIdx * 100;
      if (Arcade.shell) Arcade.shell.submitScore(score2);
      render();
      writeSave();
      return;
    }
    startTurn();
    render();
    writeSave();
  }

  var wrap = document.createElement('div');
  wrap.className = 'dk-wrap';
  wrap.innerHTML =
    '<div class="dk-enemy">' +
    '  <div class="name" id="dk-bossname"></div>' +
    '  <div class="dk-hpbar"><i id="dk-bosshp" style="width:100%"></i></div>' +
    '  <div class="dk-intent" id="dk-intent"></div>' +
    '</div>' +
    '<div class="dk-top">' +
    '  <span>❤️ <b id="dk-hp">80</b>/80</span>' +
    '  <span>🛡 <b id="dk-block">0</b></span>' +
    '  <span>⚡ <b id="dk-energy">3</b>/3</span>' +
    '  <span>🂠 <b id="dk-draw">0</b></span>' +
    '  <span id="dk-relics"></span>' +
    '</div>' +
    '<div class="dk-hand" id="dk-hand"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn yellow" id="dk-end">' + T('gs.deckbuilder.endTurn') + '</button>' +
    '  <button class="btn purple" id="dk-restart">' + T('gs.deckbuilder.restart') + '</button>' +
    '</div>' +
    '<div class="dk-msg" id="dk-msg">' + T('gs.deckbuilder.msgStart') + '</div>' +
    '<div class="dk-log" id="dk-log"></div>' +
    '<div class="dk-choice hidden" id="dk-choice">' +
    '  <div class="dk-choice-title">' + T('gs.deckbuilder.choiceTitle') + '</div>' +
    '  <button class="btn pink" id="dk-c-fight">' + T('gs.deckbuilder.choiceFight') + '</button>' +
    '  <button class="btn yellow" id="dk-c-chest">' + T('gs.deckbuilder.choiceChest') + '</button>' +
    '  <button class="btn green" id="dk-c-fire">' + T('gs.deckbuilder.choiceFire') + '</button>' +
    '</div>';
  root.appendChild(wrap);
  var bossNameEl = wrap.querySelector('#dk-bossname'), bossHpEl = wrap.querySelector('#dk-bosshp'),
      intentEl = wrap.querySelector('#dk-intent'), hpEl = wrap.querySelector('#dk-hp'),
      blockEl = wrap.querySelector('#dk-block'), energyEl = wrap.querySelector('#dk-energy'),
      drawEl = wrap.querySelector('#dk-draw'), handEl = wrap.querySelector('#dk-hand'),
      relicsEl = wrap.querySelector('#dk-relics'),
      endBtn = wrap.querySelector('#dk-end'), restartBtn = wrap.querySelector('#dk-restart'),
      msg = wrap.querySelector('#dk-msg'), logEl = wrap.querySelector('#dk-log'),
      choiceEl = wrap.querySelector('#dk-choice'),
      cFight = wrap.querySelector('#dk-c-fight'), cChest = wrap.querySelector('#dk-c-chest'), cFire = wrap.querySelector('#dk-c-fire');

  cFight.addEventListener('click', function () { if (phase !== 'choose') return; startElite(); writeSave(); if (Arcade.audio) Arcade.audio.play('ui'); });
  cChest.addEventListener('click', function () {
    if (phase !== 'choose') return;
    var avail = Object.keys(RELICS).filter(function (k) { return relics.indexOf(k) < 0; });
    if (!avail.length) { msg.textContent = T('gs.deckbuilder.relicsFull'); if (bossTimer) clearTimeout(bossTimer); bossTimer = setTimeout(nextBoss, 1200); }
    else {
      var k = avail[Math.floor(Math.random() * avail.length)];
      gainRelic(k);
      msg.textContent = T('gs.deckbuilder.relicGot').replace('{name}', T('gs.deckbuilder.relic.' + k + '.n')).replace('{desc}', T('gs.deckbuilder.relic.' + k + '.d'));
      msg.style.color = 'var(--neon-green)';
      if (bossTimer) clearTimeout(bossTimer);
      bossTimer = setTimeout(nextBoss, 1500);
    }
    choiceEl.classList.add('hidden');
    writeSave();
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  cFire.addEventListener('click', function () {
    if (phase !== 'choose') return;
    hp = Math.min(maxHp, hp + 20);
    writeSave();
    msg.textContent = T('gs.deckbuilder.camp').replace('{a}', hp).replace('{b}', maxHp);
    msg.style.color = 'var(--neon-green)';
    choiceEl.classList.add('hidden');
    if (bossTimer) clearTimeout(bossTimer);
    bossTimer = setTimeout(nextBoss, 1200);
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  function render() {
    bossNameEl.textContent = T('gs.deckbuilder.' + boss.name + '.n') + (isElite ? '' : T('gs.deckbuilder.bossTag').replace('{a}', bossIdx + 1).replace('{b}', BOSSES.length));
    bossHpEl.style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
    intentEl.textContent = T('gs.deckbuilder.intentLine').replace('{i}', T('gs.deckbuilder.intent.' + boss.intent)).replace('{d}', boss.atk) + (poison ? T('gs.deckbuilder.poisonTag').replace('{p}', poison) : '');
    hpEl.textContent = Math.max(0, hp);
    blockEl.textContent = block;
    energyEl.textContent = energy;
    drawEl.textContent = draw.length;
    relicsEl.textContent = relics.map(function (k) { return T('gs.deckbuilder.relic.' + k + '.n'); }).join(' ');
    // 手牌
    handEl.innerHTML = '';
    hand.forEach(function (key, idx) {
      var spec = CARDS[key] || STRONG_CARDS[key];
      if (!spec) return;
      var d = document.createElement('div');
      d.className = 'dk-card ' + spec.type + (energy < spec.cost ? ' cant' : '');
      d.innerHTML = '<div class="cn">' + T('gs.deckbuilder.card.' + key + '.n') + '</div><div class="cd">' + T('gs.deckbuilder.card.' + key + '.d') + '</div><div class="cc">⚡' + spec.cost + '</div>';
      d.addEventListener('click', function () { playCard(idx); });
      handEl.appendChild(d);
    });
    logEl.textContent = log || '';
  }

  endBtn.addEventListener('click', endTurn);
  restartBtn.addEventListener('click', function () { reset(); choiceEl.classList.add('hidden'); msg.textContent = T('gs.deckbuilder.msgStart'); msg.style.color = ''; render(); if (Arcade.audio) Arcade.audio.play('ui'); });
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.deckbuilder.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); choiceEl.classList.add('hidden'); msg.textContent = T('gs.deckbuilder.msgStart'); msg.style.color = ''; render(); };

  /* 启动：优先恢复上次进度；无档则新开一局 */
  if (!tryResume()) { reset(); render(); }

})();
