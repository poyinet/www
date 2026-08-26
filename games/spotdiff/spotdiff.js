/* ============================================================
   找茬破译 · 密文比对（全网独家：找茬 × 消息认证）
   一份电报在传输中被特工篡改——逐字符比对「存档原文」与「收到的电文」，
   找出所有被改的位置。这是密码学「消息完整性/篡改检测」最直观的演练。
   三关递进（篡改数量/长度递增）+ 每日一题（固定种子）。
   核心逻辑用 ==SPOT-CORE-START== / ==SPOT-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==SPOT-CORE-START== */
  var S_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function S_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function S_pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

  var S_PLAINS = [
    'ATTACK AT DAWN TOMORROW ALL UNITS READY',
    'SUPPLY CONVOY ARRIVES AT THE NORTHERN PORT',
    'ENEMY FLEET MOVES SOUTH TOWARD THE ISLAND',
    'CODE BOOK TRANSFERRED TO THE SECOND BUNKER',
    'RADIO FREQUENCY CHANGES AT MIDNIGHT SHARP',
    'AMBUSH POSITION SECURED ON THE EASTERN ROAD',
    'SUBMARINE DEPARTS THE BAY AT FIRST LIGHT',
    'REINFORCEMENTS LANDING AT THE HIDDEN COVE',
    'SECRET DOCUMENTS BURNED BEFORE THE RAID',
    'HEADQUARTERS MOVES TO THE FOREST CAMP',
    'COURIER CROSSES THE BRIDGE WITH THE KEY',
    'WEATHER CLEARS TOMORROW FLIGHT CONFIRMED'
  ];

  /** 生成一关：在原文上随机篡改 count 处（改后必须与原文不同）
      level: 1 易(3处/16字符) 2 中(4处/26字符) 3 难(6处/34字符)
      返回 { orig, modified, tampered: [位置], level } */
  function S_genChallenge(level, seed) {
    var rnd = S_mulberry32(seed || (Date.now() % 2147483647));
    var conf = level === 1 ? { n: 3, len: 16 } : (level === 2 ? { n: 4, len: 26 } : { n: 6, len: 34 });
    var orig = S_pick(rnd, S_PLAINS).slice(0, conf.len);
    // 若句子不够长则补足（从池中续接）
    while (orig.length < conf.len) {
      var add = S_pick(rnd, S_PLAINS).replace(/ /g, '').slice(0, conf.len - orig.length);
      orig += (orig.length ? ' ' : '') + add;
    }
    orig = orig.slice(0, conf.len);
    var mod = orig.split('');
    var tampered = [];
    var guard = 0;
    while (tampered.length < conf.n && guard++ < 200) {
      var pos = Math.floor(rnd() * orig.length);
      if (tampered.indexOf(pos) >= 0) continue;
      var ch = orig[pos];
      var newCh;
      do { newCh = S_ALPHA[Math.floor(rnd() * 26)]; } while (newCh === ch);
      mod[pos] = newCh;
      tampered.push(pos);
    }
    tampered.sort(function (a, b) { return a - b; });
    return { level: level, orig: orig, modified: mod.join(''), tampered: tampered };
  }

  /** 判定：位置 pos 是否篡改 */
  function S_isTampered(ch, pos) {
    return ch.tampered.indexOf(pos) >= 0;
  }
  /* ==SPOT-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  var LEVEL_INFO = [
    { t: T('gs.spotdiff.level1t'), d: T('gs.spotdiff.level1d') },
    { t: T('gs.spotdiff.level2t'), d: T('gs.spotdiff.level2d') },
    { t: T('gs.spotdiff.level3t'), d: T('gs.spotdiff.level3d') }
  ];

  root.innerHTML =
    '<div class="sd-wrap">' +
    '  <div class="sd-tabs">' +
    '    <button class="btn mode-btn selected" id="sd-tab-chal">' + T('gs.spotdiff.tabChal') + '</button>' +
    '    <button class="btn mode-btn" id="sd-tab-daily">' + T('gs.spotdiff.tabDaily') + '</button>' +
    '  </div>' +
    '  <div class="sd-info"><span id="sd-lev"></span><span id="sd-timer">0s</span></div>' +
    '  <div class="sd-flavor" id="sd-brief"></div>' +
    '  <div class="sd-lbl">' + T('gs.spotdiff.lblOrig') + '</div>' +
    '  <div class="sd-line orig" id="sd-orig"></div>' +
    '  <div class="sd-lbl">' + T('gs.spotdiff.lblMod') + '</div>' +
    '  <div class="sd-line" id="sd-mod"></div>' +
    '  <div class="sd-status"><span>' + T('gs.spotdiff.found') + ' <b id="sd-found">0</b> / <b id="sd-total">0</b></span><span>' + T('gs.spotdiff.errors') + ' <b id="sd-err">0</b></span><span>' + T('gs.spotdiff.left') + ' <b id="sd-left">0</b></span></div>' +
    '  <div class="sd-row">' +
    '    <button class="btn" id="sd-hint">' + T('gs.spotdiff.hintBtn').replace('{n}', 3) + '</button>' +
    '  </div>' +
    '  <div class="sd-msg" id="sd-msg"></div>' +
    '  <div class="sd-overlay hidden" id="sd-overlay">' +
    '    <h2 id="sd-ov-title"></h2>' +
    '    <p id="sd-ov-text"></p>' +
    '    <button class="btn" id="sd-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var tabChal = document.getElementById('sd-tab-chal');
  var tabDaily = document.getElementById('sd-tab-daily');
  var levEl = document.getElementById('sd-lev');
  var timerEl = document.getElementById('sd-timer');
  var briefEl = document.getElementById('sd-brief');
  var origEl = document.getElementById('sd-orig');
  var modEl = document.getElementById('sd-mod');
  var foundEl = document.getElementById('sd-found');
  var totalEl = document.getElementById('sd-total');
  var errEl = document.getElementById('sd-err');
  var leftEl = document.getElementById('sd-left');
  var msgEl = document.getElementById('sd-msg');
  var overlayEl = document.getElementById('sd-overlay');
  var ovTitle = document.getElementById('sd-ov-title');
  var ovText = document.getElementById('sd-ov-text');
  var ovBtn = document.getElementById('sd-ov-btn');

  var chal = null;
  var isDaily = false;
  var levelIdx = 0, found = 0, errors = 0, hints = 3;
  var chalStart = 0, totalMs = 0, timerTick = null;

  function totalSec() { return Math.round(totalMs / 1000); }

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function renderLines() {
    origEl.innerHTML = '';
    modEl.innerHTML = '';
    for (var i = 0; i < chal.orig.length; i++) {
      var so = document.createElement('span');
      so.className = 'sd-ch';
      so.textContent = chal.orig[i] === ' ' ? '\u00A0' : chal.orig[i];
      origEl.appendChild(so);
      var sm = document.createElement('span');
      sm.className = 'sd-ch clickable';
      sm.textContent = chal.modified[i] === ' ' ? '\u00A0' : chal.modified[i];
      sm.dataset.i = i;
      if (markedPos.indexOf(i) >= 0) sm.classList.add('found');
      sm.addEventListener('click', function () { clickChar(this); });
      modEl.appendChild(sm);
    }
    foundEl.textContent = found;
    totalEl.textContent = chal.tampered.length;
    leftEl.textContent = chal.tampered.length - found;
  }
  var markedPos = [];

  function clickChar(el) {
    var pos = parseInt(el.dataset.i, 10);
    if (el.classList.contains('found')) return;
    if (S_isTampered(chal, pos)) {
      el.classList.add('found');
      markedPos.push(pos);
      found++;
      foundEl.textContent = found;
      leftEl.textContent = chal.tampered.length - found;
      if (Arcade.audio) Arcade.audio.play('coin');
      if (found === chal.tampered.length) { winLevel(); }
    } else {
      errors++;
      errEl.textContent = errors;
      el.classList.add('bad');
      var self = el;
      setTimeout(function () { self.classList.remove('bad'); }, 450);
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.fx) Arcade.fx.shake(el);
    }
  }

  function startGame(levelOrDaily) {
    levelIdx = 0; totalMs = 0; found = 0; errors = 0; hints = 3; markedPos = [];
    isDaily = !!levelOrDaily;
    startLevel();
  }

  function startLevel() {
    if (isDaily) {
      chal = S_genChallenge(1 + (levelIdx % 3), todaySeed());
      levEl.textContent = T('gs.spotdiff.dailyLev').replace('{n}', levelIdx + 1);
      briefEl.textContent = T('gs.spotdiff.dailyBrief') + (levelIdx === 0 ? T('gs.spotdiff.dailyBriefE') : levelIdx === 1 ? T('gs.spotdiff.dailyBriefM') : T('gs.spotdiff.dailyBriefH'));
    } else {
      chal = S_genChallenge(levelIdx + 1);
      levEl.textContent = T('gs.spotdiff.chalLev').replace('{t}', LEVEL_INFO[levelIdx].t).replace('{n}', levelIdx + 1);
      briefEl.textContent = LEVEL_INFO[levelIdx].d;
    }
    found = 0; errors = 0; markedPos = [];
    errEl.textContent = '0';
    chalStart = Date.now(); // 每关起算（修复：此前仅开局设一次，winLevel 累加虚高的全局长时段）
    renderLines();
    msgEl.textContent = T('gs.spotdiff.msgHints').replace('{n}', hints);
  }

  function winLevel() {
    totalMs += Date.now() - chalStart;
    if (Arcade.juice) Arcade.juice.win();
    if (isDaily) {
      // 每日一题：三小题全过才算完成
      if (levelIdx < 2) {
        levelIdx++;
        startLevel();
        if (Arcade.ui) Arcade.ui.toast(T('gs.spotdiff.toastPuzzleWin'), 'win');
      } else {
        ovTitle.textContent = T('gs.spotdiff.winDailyT');
        ovTitle.className = 'win';
        ovText.innerHTML = T('gs.spotdiff.winDailyD').replace('{s}', totalSec());
        ovBtn.textContent = T('gs.spotdiff.again');
        ovBtn.onclick = function () { overlayEl.classList.add('hidden'); startGame(true); resetClock(); };
        overlayEl.classList.remove('hidden');
        if (Arcade.daily) Arcade.daily.markSolved('spotdiff', totalSec());
        if (Arcade.shell) Arcade.shell.submitScore(totalSec());
      }
    } else if (levelIdx < 2) {
      levelIdx++;
      startLevel();
      if (Arcade.ui) Arcade.ui.toast(T('gs.spotdiff.toastLevelPass').replace('{n}', levelIdx + 1), 'win');
    } else {
      ovTitle.textContent = T('gs.spotdiff.winChalT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.spotdiff.winChalD').replace('{a}', LEVEL_INFO[0].t).replace('{b}', LEVEL_INFO[1].t).replace('{c}', LEVEL_INFO[2].t).replace('{s}', totalSec());
      ovBtn.textContent = T('gs.spotdiff.again');
      ovBtn.onclick = function () {
        overlayEl.classList.add('hidden');
        startGame(false);
        resetClock();
      };
      overlayEl.classList.remove('hidden');
      if (Arcade.shell) Arcade.shell.submitScore(totalSec());
    }
  }

  document.getElementById('sd-hint').addEventListener('click', function () {
    if (!chal) return;
    if (hints <= 0) { msgEl.textContent = T('gs.spotdiff.msgNoHint'); return; }
    var remaining = chal.tampered.filter(function (p) { return markedPos.indexOf(p) < 0; });
    if (!remaining.length) return;
    var pos = remaining[0];
    hints--;
    msgEl.textContent = T('gs.spotdiff.msgHintPos').replace('{n}', pos + 1).replace('{h}', hints);
    var hintBtn = document.getElementById('sd-hint');
    if (hintBtn) hintBtn.textContent = T('gs.spotdiff.hintBtn').replace('{n}', hints);
    if (Arcade.audio) Arcade.audio.play('coin');
    // 闪烁提示位置
    var spans = modEl.querySelectorAll('.sd-ch');
    if (spans[pos]) {
      spans[pos].classList.add('hintglow');
      var self = spans[pos];
      setTimeout(function () { self.classList.remove('hintglow'); }, 1200);
    }
  });

  function resetClock() {
    totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

  tabChal.addEventListener('click', function () {
    tabChal.classList.add('selected'); tabDaily.classList.remove('selected');
    startGame(false);
    resetClock();
    if (Arcade.audio) Arcade.audio.play('ui');
  });
  tabDaily.addEventListener('click', function () {
    tabDaily.classList.add('selected'); tabChal.classList.remove('selected');
    startGame(true);
    resetClock();
    if (Arcade.audio) Arcade.audio.play('ui');
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.innerHTML = T('gs.spotdiff.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    overlayEl.classList.add('hidden');
    startGame(isDaily);
    resetClock();
  };

  resetClock();
  startGame(false);

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.spotdiff.tut1t'), d: T('gs.spotdiff.tut1') },
    { t: T('gs.spotdiff.tut2t'), d: T('gs.spotdiff.tut2') },
    { t: T('gs.spotdiff.tut3t'), d: T('gs.spotdiff.tut3') },
    { t: T('gs.spotdiff.tut4t'), d: T('gs.spotdiff.tut4') }
  ];

})();
