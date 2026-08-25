/* ============================================================
   反应力测试：红色等待 → 变绿瞬间点击，5 轮取平均毫秒（低分优）
   抢跑判罚本轮重来；评级 <200 神级 / 200-300 优秀 / 300-400 不错 / >400 继续练
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.reaction.tut1t'), d: T('gs.reaction.tut1') },
    { t: T('gs.reaction.tut2t'), d: T('gs.reaction.tut2') },
    { t: T('gs.reaction.tut3t'), d: T('gs.reaction.tut3') }
  ];

  root.innerHTML =
    '<div class="game-message" id="msg">' + T('gs.reaction.msgHint') + '</div>' +
    '<div class="reaction-panel" id="panel">' +
    '  <div class="rp-icon" id="rp-icon">⚡</div>' +
    '  <div class="rp-text" id="rp-text">' + T('gs.reaction.idleTitle') + '</div>' +
    '  <div class="rp-sub" id="rp-sub">' + T('gs.reaction.idleSub') + '</div>' +
    '</div>' +
    '<div class="reaction-rounds" id="rounds"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.reaction.hudRound') + ' <span class="stat-value" id="round-num">0 / 5</span></span>' +
    '  <span>' + T('gs.reaction.hudAvg') + ' <span class="stat-value" id="avg">--</span></span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="again-btn" class="btn purple" style="display:none;">' + T('gs.reaction.btnAgain') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.reaction.help') + '</p>';

  var TOTAL = 5;

  var msgEl = document.getElementById('msg');
  var panel = document.getElementById('panel');
  var iconEl = document.getElementById('rp-icon');
  var textEl = document.getElementById('rp-text');
  var subEl = document.getElementById('rp-sub');
  var roundsEl = document.getElementById('rounds');
  var roundNumEl = document.getElementById('round-num');
  var avgEl = document.getElementById('avg');
  var againBtn = document.getElementById('again-btn');

  /* idle 待开始 | waiting 红色等待 | ready 绿色可点 | result 本轮结果 | falsestart 抢跑 | done 结束 */
  var state = 'idle';
  var results = [];
  var timer = null;
  var startTs = 0;

  function setPanel(cls, icon, text, sub) {
    panel.className = 'reaction-panel' + (cls ? ' ' + cls : '');
    iconEl.textContent = icon;
    textEl.textContent = text;
    subEl.textContent = sub;
  }

  function chipClass(ms) {
    if (ms < 200) return 's-god';
    if (ms < 300) return 's-great';
    if (ms < 400) return 's-ok';
    return 's-slow';
  }

  function rating(avg) {
    if (avg < 200) return T('gs.reaction.rGod');
    if (avg < 300) return T('gs.reaction.rGreat');
    if (avg < 400) return T('gs.reaction.rOk');
    return T('gs.reaction.rSlow');
  }

  function startRound() {
    state = 'waiting';
    roundNumEl.textContent = (results.length + 1) + ' / ' + TOTAL;
    msgEl.textContent = T('gs.reaction.waitingMsg');
    setPanel('waiting', '✋', T('gs.reaction.waitingTitle'), T('gs.reaction.waitingSub'));
    timer = setTimeout(function () {
      state = 'ready';
      startTs = performance.now();
      setPanel('ready', '👆', T('gs.reaction.readyTitle'), T('gs.reaction.readySub'));
    }, 1000 + Math.random() * 3000);
  }

  function finish() {
    state = 'done';
    var sum = 0;
    for (var i = 0; i < results.length; i++) sum += results[i];
    var avg = Math.round(sum / TOTAL);
    avgEl.textContent = avg + ' ms';
    var isNew = Arcade.shell.submitScore(avg);
    var label = rating(avg);
    setPanel('done', '🏁', avg + ' ms', label + (isNew ? T('gs.reaction.newRec') : ''));
    msgEl.textContent = T('gs.reaction.doneMsg').replace('{n}', avg).replace('{m}', label);
    againBtn.style.display = '';
  }

  function onPress() {
    if (state === 'idle' || state === 'result' || state === 'falsestart') {
      startRound();
    } else if (state === 'waiting') {
      clearTimeout(timer);
      state = 'falsestart';
      setPanel('falsestart', '🚫', T('gs.reaction.earlyTitle'), T('gs.reaction.earlySub'));
      msgEl.textContent = T('gs.reaction.falseMsg');
    } else if (state === 'ready') {
      var ms = Math.round(performance.now() - startTs);
      results.push(ms);
      Arcade.juice.coin();
      var chip = document.createElement('span');
      chip.className = 'reaction-chip ' + chipClass(ms);
      chip.textContent = T('gs.reaction.chipLabel').replace('{n}', results.length).replace('{m}', ms);
      roundsEl.appendChild(chip);
      if (results.length >= TOTAL) {
        finish();
      } else {
        state = 'result';
        setPanel('result', '⏱️', ms + ' ms', T('gs.reaction.nextSub'));
        msgEl.textContent = T('gs.reaction.roundDone').replace('{n}', results.length).replace('{m}', TOTAL - results.length);
      }
    }
  }

  function reset() {
    clearTimeout(timer);
    results = [];
    state = 'idle';
    roundsEl.innerHTML = '';
    roundNumEl.textContent = '0 / ' + TOTAL;
    avgEl.textContent = '--';
    againBtn.style.display = 'none';
    msgEl.textContent = T('gs.reaction.msgHint');
    setPanel('', '⚡', T('gs.reaction.idleTitle'), T('gs.reaction.idleSub'));
  }

  panel.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    onPress();
  });
  againBtn.addEventListener('click', reset);    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.reaction.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () { reset(); startRound(); };

})();