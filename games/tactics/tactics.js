/* ============================================================
   战棋对决 Tactics · 回合制策略战棋（旗舰级）
   - 兵种：剑士(近战)/弓箭手(远程3)/法师(远程2) + Boss
   - 克制：剑士克弓、弓克法、法克剑（+2 伤害）
   - 移动：BFS 可达范围；攻击：曼哈顿射程内
   - 高地：站其上攻击 +1
   - 三关递进 + Boss 关；AI 每回合攻击最近/最弱目标
   记分 max：击杀+10（Boss+30）、通关+50
   ============================================================ */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.tactics.tut1t'), d: T('gs.tactics.tut1') },
  { t: T('gs.tactics.tut2t'), d: T('gs.tactics.tut2') },
  { t: T('gs.tactics.tut3t'), d: T('gs.tactics.tut3') }
];

(function () {
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ---------- 兵种定义 ----------
     skill: 主动/被动技能
       charge 冲锋：本回合移动后首次攻击 +2
       fury   狂暴：血量低于 40% 时攻击 +2
       pierce 穿甲：攻击无视克制（也不受克制加成） */
  var TYPES = {
    sword:  { name: 'sword', icon: '⚔️', hp: 12, atk: 3, mov: 3, rng: 1, skill: 'fury' },
    archer: { name: 'archer', icon: '🏹', hp: 8, atk: 2, mov: 2, rng: 3 },
    mage:   { name: 'mage', icon: '🔮', hp: 7, atk: 3, mov: 2, rng: 2 },
    knight: { name: 'knight', icon: '🏇', hp: 10, atk: 3, mov: 4, rng: 1, skill: 'charge' },
    gunner: { name: 'gunner', icon: '🔫', hp: 7, atk: 2, mov: 2, rng: 3, skill: 'pierce' },
    boss:   { name: 'boss', icon: '👑', hp: 20, atk: 4, mov: 2, rng: 1 }
  };
  // 克制：attacker 对 defender 额外伤害
  var COUNTER = { sword: 'archer', archer: 'mage', mage: 'sword' };

  /* 伤害计算（含技能修正） */
  function damage(att, def) {
    var t = TYPES[att.type];
    var base = att.atk + (grid[att.y][att.x].hill ? 1 : 0);
    var isPierce = t.skill === 'pierce';
    var defPierce = TYPES[def.type].skill === 'pierce';
    // 克制加成（穿甲兵种不吃也不给）
    var counter = (!isPierce && !defPierce && COUNTER[att.type] === def.type) ? 2 : 0;
    // 狂暴：血量低于 40% 攻击 +2
    var fury = t.skill === 'fury' && att.hp / t.hp < 0.4 ? 2 : 0;
    // 冲锋：本回合移动后首次攻击 +2
    var charge = t.skill === 'charge' && att.movedThisTurn ? 2 : 0;
    return base + counter + fury + charge;
  }

  /* ---------- 关卡地图（字符画：.空 #墙 H高地） ---------- */
  var LEVELS = [
    {
      map: [
        '..........',
        '..PSA.....',
        '..........',
        '....#.....',
        '..........',
        '......aa..',
        '..........',
        '....p.....'
      ],
      hint: 'hint1'
    },
    {
      map: [
        '....#....H',
        '..PS......',
        '........A.',
        '....#....#',
        '..H.......',
        '.....p..k.',
        '..a....m..',
        '..........'
      ],
      hint: 'hint2'
    },
    {
      map: [
        '...#.....H',
        '.PSK.....B',
        '....H..A..',
        '........#.',
        '....m..g..',
        '.....a..m.',
        '..a.......',
        '..........'
      ],
      hint: 'hint3'
    }
  ];

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var topHtml =
    '<div class="tk-top">' +
    '  <span>' + T('gs.tactics.levelLbl').replace('{a}', '<span class="stat-value" id="tk-level">1</span>').replace('{b}', '3') + '</span>' +
    '  <span>' + T('gs.tactics.turnLbl').replace('{n}', '<span class="stat-value" id="tk-turn">1</span>') + '</span>' +
    '  <span>' + T('gs.tactics.myLbl') + ' <span class="stat-value" style="color:var(--neon-green)" id="tk-my">3</span> : <span class="stat-value" style="color:var(--neon-pink)" id="tk-en">3</span> ' + T('gs.tactics.enLbl') + '</span>' +
    '  <span>' + T('gs.tactics.scoreLbl').replace('{n}', '<span class="stat-value" style="color:var(--neon-yellow)" id="tk-score">0</span>') + '</span>' +
    '</div>';
  var msgHtml = '<div class="tk-msg" id="tk-msg" aria-live="polite"></div>';
  var boardHtml = '<div class="tk-board" id="tk-board"></div>';
  var detailHtml = '<div class="tk-detail" id="tk-detail"></div>';
  var controlsHtml =
    '<div class="game-controls">' +
    '  <button class="btn green tk-endturn" id="tk-end">' + T('gs.tactics.endTurn') + '</button>' +
    '  <button class="btn purple" id="tk-hint">' + T('gs.tactics.hintBtn') + '</button>' +
    '</div>';
  var overlayHtml =
    '<div class="tk-overlay hidden" id="tk-overlay">' +
    '  <div class="tk-modal">' +
    '    <h2 id="tk-ov-title"></h2>' +
    '    <p id="tk-ov-text"></p>' +
    '    <div class="game-controls"><button class="btn green" id="tk-ov-btn"></button></div>' +
    '  </div>' +
    '</div>';

  root.innerHTML = topHtml + msgHtml + boardHtml + detailHtml + controlsHtml + overlayHtml;

  var boardEl = document.getElementById('tk-board');
  var msgEl = document.getElementById('tk-msg');
  var detailEl = document.getElementById('tk-detail');
  var levelEl = document.getElementById('tk-level');
  var turnEl = document.getElementById('tk-turn');
  var myEl = document.getElementById('tk-my');
  var enEl = document.getElementById('tk-en');
  var scoreEl = document.getElementById('tk-score');
  var endBtn = document.getElementById('tk-end');
  var hintBtn = document.getElementById('tk-hint');
  var overlayEl = document.getElementById('tk-overlay');
  var ovTitle = document.getElementById('tk-ov-title');
  var ovText = document.getElementById('tk-ov-text');
  var ovBtn = document.getElementById('tk-ov-btn');

  /* ---------- 状态 ---------- */
  var levelIdx = 0;
  var grid = [];        // 二维：cell {type, hill, unit}
  var units = [];       // {id, side:'my'|'en', type, x, y, hp, atk, mov, rng, acted, boss}
  var turn = 1;
  var score = 0;
  var over = false;
  var phase = 'idle';   // idle | select | move | atk
  var selUnit = null;
  var moveCells = [];
  var atkCells = [];
  var curLevel = null;

  /* ---------- 初始化关卡 ---------- */
  function loadLevel(idx) {
    over = false; // 过关/战败后重新加载必须复位，否则棋盘交互被锁死
    curLevel = LEVELS[idx];
    grid = [];
    units = [];
    var rows = curLevel.map;
    for (var y = 0; y < rows.length; y++) {
      var row = [];
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        var cell = { hill: ch === 'H', wall: ch === '#', unit: null };
        row.push(cell);
      }
      grid.push(row);
    }
    for (var yy = 0; yy < rows.length; yy++) {
      for (var xx = 0; xx < rows[yy].length; xx++) {
        var c = rows[yy][xx];
        var u = null;
        if (c === 'S' || c === 'P') u = mkUnit('my', 'sword', xx, yy);
        else if (c === 'A') u = mkUnit('my', 'archer', xx, yy);
        else if (c === 'M') u = mkUnit('my', 'mage', xx, yy);
        else if (c === 'K') u = mkUnit('my', 'knight', xx, yy);
        else if (c === 'G') u = mkUnit('my', 'gunner', xx, yy);
        else if (c === 's' || c === 'p') u = mkUnit('en', 'sword', xx, yy);
        else if (c === 'a') u = mkUnit('en', 'archer', xx, yy);
        else if (c === 'm') u = mkUnit('en', 'mage', xx, yy);
        else if (c === 'k') u = mkUnit('en', 'knight', xx, yy);
        else if (c === 'g') u = mkUnit('en', 'gunner', xx, yy);
        else if (c === 'B') u = mkUnit('en', 'boss', xx, yy);
        if (u) grid[yy][xx].unit = u;
      }
    }
    turn = 1;
    phase = 'idle';
    selUnit = null;
    moveCells = [];
    atkCells = [];
    levelEl.textContent = (idx + 1) + '/3';
    turnEl.textContent = '1';
    msgEl.textContent = T('gs.tactics.level' + (idx + 1) + 'h');
    updateCounts();
    render();
  }

  function mkUnit(side, type, x, y) {
    var t = TYPES[type];
    var u = {
      id: units.length + 1, side: side, type: type,
      x: x, y: y, hp: t.hp, atk: t.atk, mov: t.mov, rng: t.rng,
      acted: false, movedThisTurn: false, boss: type === 'boss'
    };
    units.push(u);
    return u;
  }

  /* ---------- BFS 移动范围 ---------- */
  function moveRange(u) {
    var seen = {};
    var result = [];
    var q = [{ x: u.x, y: u.y, s: 0 }];
    seen[u.y * 100 + u.x] = true;
    while (q.length) {
      var cur = q.shift();
      if (cur.s > 0) result.push({ x: cur.x, y: cur.y });
      if (cur.s >= u.mov) continue;
      var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (var i = 0; i < dirs.length; i++) {
        var nx = cur.x + dirs[i][0], ny = cur.y + dirs[i][1];
        if (nx < 0 || ny < 0 || ny >= grid.length || nx >= grid[0].length) continue;
        if (grid[ny][nx].wall) continue;
        if (grid[ny][nx].unit) continue;
        var key = ny * 100 + nx;
        if (seen[key]) continue;
        seen[key] = true;
        q.push({ x: nx, y: ny, s: cur.s + 1 });
      }
    }
    return result;
  }

  /* 攻击范围：曼哈顿距离 <= rng 的敌方单位 */
  function atkTargets(u) {
    var res = [];
    for (var i = 0; i < units.length; i++) {
      var e = units[i];
      if (e.side === u.side) continue;
      var d = Math.abs(e.x - u.x) + Math.abs(e.y - u.y);
      if (d <= u.rng && d > 0) res.push(e);
    }
    return res;
  }

  function isInAtk(u, x, y) {
    var d = Math.abs(u.x - x) + Math.abs(u.y - y);
    return d <= u.rng && d > 0;
  }

  /* ---------- 交互 ---------- */
  boardEl.addEventListener('click', function (e) {
    var cell = e.target.closest ? e.target.closest('.tk-cell') : null;
    if (!cell) return;
    var x = +cell.getAttribute('data-x');
    var y = +cell.getAttribute('data-y');
    if (over) return;
    handleClick(x, y);
  });

  function handleClick(x, y) {
    var cell = grid[y][x];
    // 选中己方单位
    if (cell.unit && cell.unit.side === 'my' && !cell.unit.acted) {
      phase = 'select';
      selUnit = cell.unit;
      moveCells = moveRange(selUnit);
      atkCells = [];
      msgEl.textContent = T('gs.tactics.selected').replace('{name}', T('gs.tactics.unit.' + selUnit.type + '.n'));
      if (Arcade.audio) Arcade.audio.play('ui');
      render();
      return;
    }
    if (!selUnit) { msgEl.textContent = T('gs.tactics.selectFirst'); return; }

    // 移动
    var mv = moveCells.find(function (c) { return c.x === x && c.y === y; });
    if (mv && phase === 'select') {
      grid[selUnit.y][selUnit.x].unit = null;
      selUnit.x = x; selUnit.y = y;
      grid[y][x].unit = selUnit;
      selUnit.movedThisTurn = true; // 冲锋：移动后首击 +2
      phase = 'atk';
      atkCells = atkTargets(selUnit).map(function (e) { return { x: e.x, y: e.y }; });
      moveCells = [];
      if (Arcade.juice) Arcade.juice.move();
      if (atkCells.length) msgEl.textContent = T('gs.tactics.movedAtk');
      else { msgEl.textContent = T('gs.tactics.movedNoAtk'); selUnit.acted = true; phase = 'idle'; selUnit = null; }
      render();
      return;
    }
    // 攻击
    var isAtk = atkCells.some(function (c) { return c.x === x && c.y === y; }) ||
      (phase === 'atk' && cell.unit && cell.unit.side === 'en' && isInAtk(selUnit, x, y));
    if (isAtk && cell.unit && cell.unit.side === 'en') {
      var dmg = damage(selUnit, cell.unit);
      cell.unit.hp -= dmg;
      if (Arcade.fx) Arcade.fx.burst(x * 48 + 22, y * 48 + 22, 'var(--neon-yellow)', 10);
      if (Arcade.audio) Arcade.audio.play('match');
      msgEl.textContent = T('gs.tactics.atkMsg').replace('{a}', T('gs.tactics.unit.' + selUnit.type + '.n')).replace('{b}', T('gs.tactics.unit.' + cell.unit.type + '.n')).replace('{d}', dmg) + (COUNTER[selUnit.type] === cell.unit.type ? T('gs.tactics.counterTag') : '');
      if (cell.unit.hp <= 0) {
        var pts = cell.unit.boss ? 30 : 10;
        score += pts;
        if (Arcade.juice) Arcade.juice.clear(x * 48 + 22, y * 48 + 22, 'var(--neon-pink)', 14);
        units.splice(units.indexOf(cell.unit), 1);
        grid[y][x].unit = null;
        msgEl.textContent += T('gs.tactics.killTag').replace('{n}', pts);
      }
      selUnit.acted = true;
      phase = 'idle';
      selUnit = null;
      moveCells = []; atkCells = [];
      updateCounts();
      scoreEl.textContent = score;
      checkEnd();
      render();
      return;
    }
    // 点其他：取消选择
    phase = 'idle';
    selUnit = null;
    moveCells = []; atkCells = [];
    msgEl.textContent = T('gs.tactics.level' + (levelIdx + 1) + 'h');
    render();
  }

  /* ---------- 回合流程 ---------- */
  endBtn.addEventListener('click', function () {
    if (over || phase === 'atk') { msgEl.textContent = T('gs.tactics.finishAction'); return; }
    enemyTurn();
    if (over) return;
    turn++;
    turnEl.textContent = turn;
    units.forEach(function (u) { if (u.side === 'my') { u.acted = false; u.movedThisTurn = false; } });
    msgEl.textContent = T('gs.tactics.turnMsg').replace('{n}', turn);
    if (Arcade.audio) Arcade.audio.play('ui');
    render();
  });

  function enemyTurn() {
    var enemies = units.filter(function (u) { return u.side === 'en'; });
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (over) return;
      // 1) 攻击射程内目标（优先最弱）
      var targets = units.filter(function (u) { return u.side === 'my'; });
      var inRange = targets.filter(function (t) { return Math.abs(t.x - e.x) + Math.abs(t.y - e.y) <= e.rng; });
      if (inRange.length) {
        inRange.sort(function (a, b) { return a.hp - b.hp; });
        var t = inRange[0];
        var dmg = damage(e, t);
        t.hp -= dmg;
        if (Arcade.fx) Arcade.fx.burst(t.x * 48 + 22, t.y * 48 + 22, 'var(--neon-pink)', 10);
        if (t.hp <= 0) {
          units.splice(units.indexOf(t), 1);
          grid[t.y][t.x].unit = null;
          msgEl.textContent = T('gs.tactics.myDown').replace('{name}', T('gs.tactics.unit.' + t.type + '.n'));
        } else {
          msgEl.textContent = T('gs.tactics.enAtk').replace('{name}', T('gs.tactics.unit.' + e.type + '.n')).replace('{d}', dmg);
        }
        checkEnd();
        if (over) return;
      } else {
        // 2) 向最近目标移动
        var nearest = null, best = 1e9;
        for (var j = 0; j < targets.length; j++) {
          var d = Math.abs(targets[j].x - e.x) + Math.abs(targets[j].y - e.y);
          if (d < best) { best = d; nearest = targets[j]; }
        }
        if (nearest) {
          var dx = Math.sign(nearest.x - e.x), dy = Math.sign(nearest.y - e.y);
          var moved = false;
          // 移动须同步 grid（清旧格、占新格），否则单位位置与网格数据脱节
          if (dx !== 0) {
            var nx = e.x + dx;
            if (nx >= 0 && nx < grid[0].length && !grid[e.y][nx].wall && !grid[e.y][nx].unit) {
              grid[e.y][e.x].unit = null;
              e.x = nx;
              grid[e.y][e.x].unit = e;
              moved = true;
            }
          }
          if (!moved && dy !== 0) {
            var ny = e.y + dy;
            if (ny >= 0 && ny < grid.length && !grid[ny][e.x].wall && !grid[ny][e.x].unit) {
              grid[e.y][e.x].unit = null;
              e.y = ny;
              grid[e.y][e.x].unit = e;
              moved = true;
            }
          }
          if (!moved && dx !== 0) {
            var nx2 = e.x - dx;
            if (nx2 >= 0 && nx2 < grid[0].length && !grid[e.y][nx2].wall && !grid[e.y][nx2].unit) {
              grid[e.y][e.x].unit = null;
              e.x = nx2;
              grid[e.y][e.x].unit = e;
            }
          }
          if (!moved && dy !== 0) {
            var ny2 = e.y - dy;
            if (ny2 >= 0 && ny2 < grid.length && !grid[ny2][e.x].wall && !grid[ny2][e.x].unit) {
              grid[e.y][e.x].unit = null;
              e.y = ny2;
              grid[e.y][e.x].unit = e;
            }
          }
        }
      }
    }
    updateCounts();
    render();
  }

  function checkEnd() {
    var myAlive = units.filter(function (u) { return u.side === 'my'; }).length;
    var enAlive = units.filter(function (u) { return u.side === 'en'; }).length;
    myEl.textContent = myAlive;
    enEl.textContent = enAlive;
    if (enAlive === 0) {
      over = true;
      score += 50;
      scoreEl.textContent = score;
      if (levelIdx < LEVELS.length - 1) {
        ovTitle.textContent = T('gs.tactics.winLvl');
        ovTitle.className = 'win';
        ovText.innerHTML = T('gs.tactics.winLvlText').replace('{s}', score);
        ovBtn.textContent = T('gs.tactics.nextLvl');
        ovBtn.onclick = function () { levelIdx++; loadLevel(levelIdx); overlayEl.classList.add('hidden'); };
        if (Arcade.juice) Arcade.juice.win();
      } else {
        ovTitle.textContent = T('gs.tactics.winAll');
        ovTitle.className = 'win';
        ovText.innerHTML = T('gs.tactics.winAllText').replace('{s}', score);
        ovBtn.textContent = T('gs.tactics.replay');
        ovBtn.onclick = function () { score = 0; scoreEl.textContent = '0'; levelIdx = 0; loadLevel(0); overlayEl.classList.add('hidden'); };
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(score);
      }
      overlayEl.classList.remove('hidden');
      render();
    } else if (myAlive === 0) {
      over = true;
      ovTitle.textContent = T('gs.tactics.lose');
      ovTitle.className = 'lose';
      ovText.innerHTML = T('gs.tactics.loseText').replace('{n}', levelIdx + 1).replace('{s}', score);
      ovBtn.textContent = T('gs.tactics.retry');
      ovBtn.onclick = function () { score = 0; scoreEl.textContent = '0'; loadLevel(levelIdx); overlayEl.classList.add('hidden'); };
      if (Arcade.juice) Arcade.juice.lose();
      if (Arcade.shell) Arcade.shell.submitScore(score);
      overlayEl.classList.remove('hidden');
      render();
    }
  }

  function updateCounts() {
    myEl.textContent = units.filter(function (u) { return u.side === 'my'; }).length;
    enEl.textContent = units.filter(function (u) { return u.side === 'en'; }).length;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    // 响应式格宽：320px 屏 10 列不溢出（此前内联固定 44px 覆盖媒体查询导致 ~470px 溢出）
    // E2E 修复：公式补上棋盘内边距与列间隙，避免 320px 下仍溢出 ~22px
    var colsN = grid[0].length;
    var vw = window.innerWidth || 375;
    var avail = Math.min(vw, 720) - 34; /* 外层 wrap 内边距 20 + 棋盘自身内边距/余量 14 */
    var cell = Math.max(24, Math.min(44, Math.floor((avail - 2 * (colsN - 1)) / colsN)));
    boardEl.style.gridTemplateColumns = 'repeat(' + colsN + ', ' + cell + 'px)';
    boardEl.style.setProperty('--tk-cell', cell + 'px');
    boardEl.innerHTML = '';
    for (var y = 0; y < grid.length; y++) {
      for (var x = 0; x < grid[y].length; x++) {
        var cell = grid[y][x];
        var d = document.createElement('div');
        d.className = 'tk-cell';
        d.setAttribute('data-x', x);
        d.setAttribute('data-y', y);
        d.setAttribute('role', 'gridcell');
        d.setAttribute('aria-label', T('gs.tactics.cellAria').replace('{x}', x + 1).replace('{y}', y + 1));
        if (cell.wall) d.classList.add('obstacle');
        else if (cell.hill) d.classList.add('hill');
        else d.classList.add('empty');
        if (cell.unit) {
          d.classList.add('unit', cell.unit.side === 'my' ? 'my' : 'enemy');
          d.textContent = TYPES[cell.unit.type].icon;
          d.setAttribute('aria-label', T('gs.tactics.aria' + (cell.unit.side === 'my' ? 'My' : 'En')).replace('{name}', T('gs.tactics.unit.' + cell.unit.type + '.n')).replace('{hp}', cell.unit.hp));
          var bar = document.createElement('span');
          bar.className = 'hpbar' + (cell.unit.hp / TYPES[cell.unit.type].hp < 0.4 ? ' low' : '');
          bar.innerHTML = '<i style="width:' + Math.max(0, Math.round(cell.unit.hp / TYPES[cell.unit.type].hp * 100)) + '%"></i>';
          d.appendChild(bar);
        } else if (cell.hill) {
          d.textContent = '▦';
          d.style.color = 'rgba(0,240,255,0.4)';
          d.style.fontSize = '14px';
        }
        if (selUnit && cell.unit === selUnit) d.classList.add('sel');
        if (moveCells.some(function (c) { return c.x === x && c.y === y; })) d.classList.add('canmove');
        if (atkCells.some(function (c) { return c.x === x && c.y === y; })) d.classList.add('canatk');
        boardEl.appendChild(d);
      }
    }
    // 详情
    if (selUnit) {
      var t = TYPES[selUnit.type];
      detailEl.innerHTML = T('gs.tactics.detailSel').replace('{icon}', t.icon).replace('{name}', T('gs.tactics.unit.' + selUnit.type + '.n')).replace('{hp}', selUnit.hp).replace('{atk}', selUnit.atk).replace('{rng}', selUnit.rng) + (grid[selUnit.y][selUnit.x].hill ? T('gs.tactics.hillTag') : '');
    } else {
      detailEl.innerHTML = T('gs.tactics.detailIdle');
    }
  }

  /* ---------- 提示 ---------- */
  hintBtn.addEventListener('click', function () {
    if (over) return;
    var my = units.filter(function (u) { return u.side === 'my' && !u.acted; });
    if (!my.length) { msgEl.textContent = T('gs.tactics.allActed'); return; }
    var best = my[0], bestScore = -1e9;
    for (var i = 0; i < my.length; i++) {
      var u = my[i];
      var atks = atkTargets(u);
      var s = atks.length * 10 - Math.abs(u.x - 3) - Math.abs(u.y - 3);
      if (s > bestScore) { bestScore = s; best = u; }
    }
    msgEl.textContent = T('gs.tactics.hintMsg').replace('{name}', T('gs.tactics.unit.' + best.type + '.n')).replace('{n}', atkTargets(best).length);
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  /* ---------- 重开 ---------- */
    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.tactics.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    over = false;
    score = 0;
    scoreEl.textContent = '0';
    levelIdx = 0;
    loadLevel(0);
  };

  loadLevel(0);

})();
