/* ============================================================
   密码制造者 CIPHER MAKER（反破译对抗 · 全网独家新品类）
   你不是破译者，而是密码局设计师：1914-1945 战争时间线，
   设计密码体系抵御「布莱切利园」的持续破解，管理密钥更换节奏，
   撑过 100 回合、泄密不超限即胜利。
   核心逻辑用 ==MAKER-CORE-START== / ==MAKER-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==MAKER-CORE-START== */
  var TOTAL_TURNS = 100;

  /* 密码体系表：turn = 可研发回合；cost = 研发点数；defense = 防线（破译 0→100% 的基础回合数）
      flavor = 一句历史注释 */
  var CIPHERS = [
    { id: 'caesar', name: '凯撒密码', turn: 0, cost: 0, defense: 10, era: '1914 一战 · 字母整体平移', flavor: '聊胜于无——但对面是词频分析。' },
    { id: 'sub', name: '单表替换', turn: 4, cost: 3, defense: 15, era: '1916 · 每个字母单独替换', flavor: '词频一分析就露馅，撑不了多久。' },
    { id: 'vigenere', name: '维吉尼亚', turn: 8, cost: 6, defense: 22, era: '1918 · 密钥流多表替换', flavor: '「不可破译的密码」——直到 Kasiski 检验出现。' },
    { id: 'transpose', name: '双重换位', turn: 14, cost: 9, defense: 28, era: '1920 · 两次列换位', flavor: '一战的保底方案，频率分析无效。' },
    { id: 'enigma', name: '恩尼格玛', turn: 20, cost: 14, defense: 36, era: '1928 · 三转子+插线板', flavor: '德军以为绝对安全——波兰人先动手。' },
    { id: 'enigma-m4', name: '恩尼格玛 M4', turn: 28, cost: 20, defense: 46, era: '1938 · 四转子海军版', flavor: 'U 艇的保命符，但布莱切利园已经在排队。' },
    { id: 'lorenz', name: '洛伦兹 SZ40', turn: 36, cost: 28, defense: 58, era: '1942 · 十二轮电传密码机', flavor: '德军最高机密——对面造了第一台电子计算机。' }
  ];

  /* AI 破译工具（随时间升级）：coef = 破译速度系数；tool 名称 */
  var TOOLS = [
    { turn: 0, coef: 1.0, name: '词频分析' },
    { turn: 25, coef: 1.7, name: 'Kasiski 检验' },
    { turn: 50, coef: 2.7, name: '机械化枚举' },
    { turn: 75, coef: 4.0, name: 'Colossus 统计' }
  ];
  function toolAt(turn) {
    var t = TOOLS[0];
    for (var i = 0; i < TOOLS.length; i++) if (turn >= TOOLS[i].turn) t = TOOLS[i];
    return t;
  }

  /* 历史事件：回合触发；若该回合破译进度 ≥ 阈值则事件恶化（额外泄密） */
  var EVENTS = [
    { turn: 20, name: '齐默尔曼电报', txt: '外交电报被截获。', bad: '——破译进度过高，电报内容泄露，战局恶化！' },
    { turn: 40, name: '波兰密码局', txt: '敌方开始系统研究你的密码。', bad: '——破译进度过高，对方拿到了实机样本！' },
    { turn: 60, name: '恩尼格玛坠海', txt: '一艘潜艇沉没，机器可能被捞起。', bad: '——破译进度过高，机器残骸落入敌手！' },
    { turn: 80, name: 'Colossus 诞生', txt: '对方造出了第一台电子计算机。', bad: '——破译进度过高，统计攻击全面展开！' }
  ];

  function mkState(difficulty) {
    var d = { leakLimit: difficulty === 0 ? 2 : (difficulty === 1 ? 1 : 0), aiSpeed: difficulty === 0 ? 0.7 : (difficulty === 1 ? 1.38 : 1.42), eventThr: difficulty === 0 ? 60 : (difficulty === 1 ? 36 : 30) };
    return {
      difficulty: difficulty, turn: 0, morale: 70, rp: 0,
      cipherIdx: 0, progress: 0, keyAge: 0, leaks: 0, residue: 0, cooldown: 0, settle: 0,
      researched: [true], over: false, won: false,
      d: d
    };
  }

  /** 当前破译速度（每回合进度增量；士气 <20 前线混乱，破译加速） */
  function mkSpeed(st) {
    var c = CIPHERS[st.cipherIdx];
    var tool = toolAt(st.turn);
    var aging = 1 + 0.18 * st.keyAge;
    var chaos = st.morale < 20 ? 1.3 : 1;
    return 100 / c.defense * tool.coef * st.d.aiSpeed * aging * chaos;
  }

  /** 执行一回合：返回 { leak: bool, event: idx|-1 } */
  function mkTick(st) {
    if (st.over) return { leak: false, event: -1 };
    st.turn++;
    if (st.cooldown > 0) st.cooldown--;
    // 破译推进：换钥后的「密钥分发窗口」内 AI 破译停滞（重新收集样本）
    if (st.settle > 0) {
      st.settle--;
    } else {
      st.progress += mkSpeed(st);
      st.keyAge++;
    }
    // 研发点：士气 <30 研发停滞；≥60 双倍
    st.rp += (st.morale >= 60 ? 2 : (st.morale >= 30 ? 1 : 0));
    // 士气自然恢复
    st.morale = Math.min(100, st.morale + 2);
    var leak = false, ev = -1, boosted = false;
    // 历史事件：破译进度高于阈值 → 事件助推（情报泄露加速破译，但不直接计泄密）
    for (var i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].turn === st.turn) {
        ev = i;
        if (st.progress >= st.d.eventThr) {
          st.progress = Math.max(st.progress, Math.min(85, st.progress + 30)); // 只增不降，封顶 85%
          st.morale = Math.max(0, st.morale - 10);
          boosted = true;
        }
      }
    }
    // 破译进度到顶 → 泄密
    if (st.progress >= 100) {
      leak = true;
      st.leaks++;
      st.morale = Math.max(0, st.morale - 18);
      st.progress = 30; // 部分泄密，残留情报
      st.residue = 30;
      st.keyAge = Math.floor(st.keyAge * 0.6);
    }
    if (st.turn >= TOTAL_TURNS) {
      st.over = true;
      st.won = st.leaks <= st.d.leakLimit;
    }
    return { leak: leak, event: ev, boosted: boosted };
  }

  /** 更换密钥：重置破译进度与老化；旧密钥破译进度越高残留越多；1 回合分发窗口 + 3 回合冷却 */
  function mkChangeKey(st) {
    if (st.over) return false;
    if (st.cooldown > 0) return false;
    var residue = Math.min(50, st.progress * 0.25 + st.residue);
    st.residue = Math.floor(residue);
    st.progress = st.residue;
    st.keyAge = 0;
    st.cooldown = 3;
    st.settle = 1;
    st.morale = Math.max(0, st.morale - 10);
    return true;
  }

  /** 研发/切换密码：花费研发点（已解锁切换免费）；成功后进度重置为 0。
      切换计入 3 回合冷却，防止「交替切换每回合白嫖重置」的 exploit */
  function mkAdopt(st, idx) {
    if (st.over) return false;
    if (idx < 0 || idx >= CIPHERS.length) return false;
    if (st.cooldown > 0) return false;
    if (st.researched[idx] === true) {
      if (st.cipherIdx === idx) return false;
      st.cipherIdx = idx;
      st.progress = 0;
      st.keyAge = 0;
      st.residue = 0;
      st.cooldown = 3;
      st.settle = 1;
      return true;
    }
    var c = CIPHERS[idx];
    if (st.turn < c.turn) return false;
    if (st.rp < c.cost) return false;
    st.rp -= c.cost;
    st.researched[idx] = true;
    st.cipherIdx = idx;
    st.progress = 0;
    st.keyAge = 0;
    st.residue = 0;
    st.cooldown = 3;
    st.settle = 1;
    return true;
  }

  /** 结算分数（max 记分）：士气 × 10 + 研发点 × 5 + 零泄密奖 */
  function mkScore(st) {
    var s = st.morale * 10 + st.rp * 5;
    if (st.leaks === 0) s += 200;
    if (st.won) s += 100;
    return s;
  }
  /* ==MAKER-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  /* 显示层翻译辅助：核心数据（CIPHERS/TOOLS/EVENTS）保持不动，展示时按 id/序号取译文案 */
  function cName(c) { return T('gs.maker.cipher.' + c.id); }
  function cEra(c) { return T('gs.maker.cipher.' + c.id + '.era'); }
  function toolName(t) { return T('gs.maker.tool' + TOOLS.indexOf(t)); }
  function evName(i) { return T('gs.maker.event' + i + '.name'); }
  function evTxt(i) { return T('gs.maker.event' + i + '.txt'); }
  function evBad(i) { return T('gs.maker.event' + i + '.bad'); }

  var DIFF_INFO = [
    { t: T('gs.maker.dEasy'), d: T('gs.maker.dEasyD'), icon: '🟢' },
    { t: T('gs.maker.dNormal'), d: T('gs.maker.dNormalD'), icon: '🟡' },
    { t: T('gs.maker.dHard'), d: T('gs.maker.dHardD'), icon: '🔴' }
  ];

  root.innerHTML =
    '<div class="mk-wrap">' +
    '  <div class="mk-pick" id="mk-pick">' +
    '    <div class="mk-pick-t">' + T('gs.maker.pickT') + '</div>' +
    '    <div class="mk-pick-d">' + T('gs.maker.pickD') + '</div>' +
    '    <div class="mk-pick-btns">' +
    DIFF_INFO.map(function (d, i) {
      return '<button class="btn mode-btn" data-i="' + i + '">' + d.icon + ' ' + d.t + '<small>' + d.d + '</small></button>';
    }).join('') +
    '    </div>' +
    '  </div>' +
    '  <div class="mk-top">' +
    '    <span class="mk-clock" id="mk-clock">' + T('gs.maker.clockF').replace('{a}', '0').replace('{b}', TOTAL_TURNS) + '</span>' +
    '    <span class="mk-tool" id="mk-tool">' + T('gs.maker.toolF').replace('{t}', toolName(TOOLS[0])) + '</span>' +
    '  </div>' +
    '  <div class="mk-bar"><span>' + T('gs.maker.morale') + '</span><div class="progress-bar slim"><i id="mk-morale" style="width:70%"></i></div><b id="mk-morale-n">70</b></div>' +
    '  <div class="mk-bar"><span>' + T('gs.maker.rp') + ' <b id="mk-rp">0</b></span><span class="mk-sub">' + T('gs.maker.rpRule') + '</span></div>' +
    '  <div class="mk-cipher-box">' +
    '    <div class="mk-cname" id="mk-cname">' + cName(CIPHERS[0]) + '</div>' +
    '    <div class="mk-cera" id="mk-cera">' + cEra(CIPHERS[0]) + '</div>' +
    '    <div class="mk-bar"><span>' + T('gs.maker.prog') + '</span><div class="progress-bar slim danger"><i id="mk-prog" style="width:0%"></i></div><b id="mk-prog-n">0%</b></div>' +
    '    <div class="mk-keyinfo" id="mk-keyinfo">' + T('gs.maker.keyAge').replace('{n}', 0) + '</div>' +
    '  </div>' +
    '  <div class="mk-actions">' +
    '    <button class="btn mk-btn" id="mk-key">' + T('gs.maker.changeKey') + '</button>' +
    '    <button class="btn mk-btn" id="mk-next">' + T('gs.maker.nextWeek') + '</button>' +
    '  </div>' +
    '  <div class="mk-lbl">' + T('gs.maker.cipherLbl') + '</div>' +
    '  <div class="mk-ciphers" id="mk-ciphers"></div>' +
    '  <div class="mk-log" id="mk-log"></div>' +
    '  <div class="mk-overlay hidden" id="mk-overlay">' +
    '    <h2 id="mk-ov-title"></h2>' +
    '    <p id="mk-ov-text"></p>' +
    '    <button class="btn" id="mk-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var st = null;
  var ovEl = document.getElementById('mk-overlay');
  var ovTitle = document.getElementById('mk-ov-title');
  var ovText = document.getElementById('mk-ov-text');
  var ovBtn = document.getElementById('mk-ov-btn');
  var logEl = document.getElementById('mk-log');

  function log(msg, cls) {
    var d = document.createElement('div');
    d.className = 'mk-logline' + (cls ? ' ' + cls : '');
    d.innerHTML = '<b>' + st.turn + '</b> ' + msg;
    logEl.insertBefore(d, logEl.firstChild);
    if (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
  }

  function paint() {
    document.getElementById('mk-clock').textContent = T('gs.maker.clockF').replace('{a}', st.turn).replace('{b}', TOTAL_TURNS);
    document.getElementById('mk-tool').textContent = T('gs.maker.toolF').replace('{t}', toolName(toolAt(st.turn)));
    document.getElementById('mk-morale').style.width = st.morale + '%';
    document.getElementById('mk-morale-n').textContent = st.morale;
    document.getElementById('mk-rp').textContent = st.rp;
    var c = CIPHERS[st.cipherIdx];
    document.getElementById('mk-cname').textContent = cName(c);
    document.getElementById('mk-cera').textContent = cEra(c);
    var p = Math.min(100, Math.round(st.progress));
    document.getElementById('mk-prog').style.width = p + '%';
    document.getElementById('mk-prog-n').textContent = p + '%';
    document.getElementById('mk-keyinfo').textContent = T('gs.maker.keyAge').replace('{n}', st.keyAge) +
      (st.residue > 0 ? T('gs.maker.residue').replace('{n}', st.residue) : '') +
      (st.cooldown > 0 ? T('gs.maker.cooldown').replace('{n}', st.cooldown) : '');
    paintCiphers();
  }

  function paintCiphers() {
    var box = document.getElementById('mk-ciphers');
    box.innerHTML = '';
    CIPHERS.forEach(function (c, i) {
      var isCurrent = i === st.cipherIdx;
      var researched = !!st.researched[i];
      var canBuy = st.turn >= c.turn && st.rp >= c.cost && !researched;
      var b = document.createElement('button');
      b.className = 'mk-cipher' + (isCurrent ? ' cur' : '') + (researched ? ' owned' : '') + (canBuy ? ' buyable' : '');
      b.innerHTML =
        '<span class="mk-cn">' + cName(c) + (isCurrent ? ' <em>' + T('gs.maker.inUse') + '</em>' : '') + '</span>' +
        '<span class="mk-cd">' + T('gs.maker.defense').replace('{n}', c.defense) + '</span>' +
        '<span class="mk-cs">' + (researched ? T('gs.maker.researched') : (st.turn < c.turn ? T('gs.maker.unlockF').replace('{n}', c.turn) : T('gs.maker.costF').replace('{n}', c.cost))) + '</span>';
      b.disabled = isCurrent;
      b.addEventListener('click', function () {
        if (isCurrent) return;
        var okR = mkAdopt(st, i);
        if (okR) {
          log(T('gs.maker.logAdopt').replace('{n}', cName(c)), 'good');
          if (Arcade.audio) Arcade.audio.play('win');
        } else if (!researched && st.turn >= c.turn) {
          if (Arcade.ui) Arcade.ui.toast(T('gs.maker.noRp').replace('{n}', c.cost), 'warn');
          if (Arcade.audio) Arcade.audio.play('error');
        }
        paint();
      });
      box.appendChild(b);
    });
  }

  /* 难度选择启动 */
  function pickDifficulty(idx) {
    st = mkState(idx);
    logEl.innerHTML = '';
    log(T('gs.maker.logIntro').replace('{n}', st.d.leakLimit), 'sys');
    paint();
  }

  document.getElementById('mk-key').addEventListener('click', function () {
    if (!st || st.over) return;
    var okK = mkChangeKey(st);
    if (okK) {
      log(T('gs.maker.logKey'), 'warn');
      if (Arcade.audio) Arcade.audio.play('coin');
    } else {
      if (Arcade.ui) Arcade.ui.toast(T('gs.maker.keyCool').replace('{n}', st.cooldown), 'warn');
    }
    paint();
  });

  var prevToolName = null; // 工具升级日志：按实际解锁回合检测
  document.getElementById('mk-next').addEventListener('click', function () {
    if (!st || st.over) return;
    var r = mkTick(st);
    if (r.event >= 0) {
      var ev = EVENTS[r.event];
      log('📜 <b>' + evName(r.event) + '</b>：' + (r.boosted ? evTxt(r.event) + evBad(r.event) : evTxt(r.event)), r.boosted ? 'leak' : 'event');
    }
    if (r.leak) {
      log(T('gs.maker.logLeak'), 'leak');
      if (Arcade.fx) Arcade.fx.flash('var(--neon-pink)');
      if (Arcade.audio) Arcade.audio.play('error');
      if (Arcade.ui) Arcade.ui.toast(T('gs.maker.toastLeak'), 'warn');
    }
    // 工具升级日志（按 toolAt 实际切换回合 25/50/75）
    var cur = toolAt(st.turn).name;
    if (prevToolName !== null && cur !== prevToolName) {
      log(T('gs.maker.logTool').replace('{n}', toolName(toolAt(st.turn))), 'warn');
    }
    prevToolName = cur;
    // 已无望提示
    if (!st.over && st.leaks > st.d.leakLimit && st.leaks === st.d.leakLimit + 1) {
      if (Arcade.ui) Arcade.ui.toast(T('gs.maker.toastHopeless'), 'warn');
    }
    paint();
    if (st.over) endGame();
  });

  function endGame() {
    if (st.won) {
      ovTitle.textContent = T('gs.maker.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.maker.winD').replace('{t}', TOTAL_TURNS).replace('{l}', st.leaks).replace('{m}', st.d.leakLimit).replace('{mo}', st.morale).replace('{r}', st.rp).replace('{s}', mkScore(st));
      ovBtn.textContent = T('gs.maker.again');
      ovBtn.onclick = function () {
        ovEl.classList.add('hidden');
        pickDifficulty(st.difficulty);
      };
      ovEl.classList.remove('hidden');
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(mkScore(st)); // 仅胜利提交
    } else {
      ovTitle.textContent = T('gs.maker.loseT');
      ovTitle.className = '';
      ovText.innerHTML = T('gs.maker.loseD').replace('{l}', st.leaks).replace('{m}', st.d.leakLimit);
      ovBtn.textContent = T('gs.maker.again');
      ovBtn.onclick = function () {
        ovEl.classList.add('hidden');
        pickDifficulty(st.difficulty);
      };
      ovEl.classList.remove('hidden');
    }
  }

  /* 首次进入：难度选择 */
  var pickBtns = root.querySelectorAll('#mk-pick button[data-i]');
  for (var i = 0; i < pickBtns.length; i++) {
    pickBtns[i].addEventListener('click', function () {
      var idx = parseInt(this.dataset.i, 10);
      var el = document.getElementById('mk-pick');
      if (el && el.parentNode) el.parentNode.removeChild(el);
      pickDifficulty(idx);
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  }

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.maker.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    if (!st) return;
    ovEl.classList.add('hidden');
    pickDifficulty(st.difficulty);
  };

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.maker.tut1t'), d: T('gs.maker.tut1') },
    { t: T('gs.maker.tut2t'), d: T('gs.maker.tut2') },
    { t: T('gs.maker.tut3t'), d: T('gs.maker.tut3') },
    { t: T('gs.maker.tut4t'), d: T('gs.maker.tut4') },
    { t: T('gs.maker.tut5t'), d: T('gs.maker.tut5') }
  ];

})();
