/* ============================================================
   24点：4 张牌（1-13）加减乘除凑 24
   发牌前暴力枚举验证有解（全排列 x 4^3 运算符 x 3 种括号模式）
   记录本次会话累计解出题数（高分优）
   ============================================================ */


(function () {
  var root = document.getElementById('game-root');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.game24.tut1t'), d: T('gs.game24.tut1') },
    { t: T('gs.game24.tut2t'), d: T('gs.game24.tut2') },
    { t: T('gs.game24.tut3t'), d: T('gs.game24.tut3') }
  ];

  var EPS = 1e-6;
  var OP_SYMS = ['+', '−', '×', '÷'];
  var DEFAULT_MSG = T('gs.game24.msgStart');

  root.innerHTML =
    '<div class="game-message" id="msg">' + DEFAULT_MSG + '</div>' +
    '<div class="g24-cards" id="cards"></div>' +
    '<div class="g24-ops" id="ops"></div>' +
    '<div class="game-stats">' +
    '  <span>' + T('gs.game24.solved') + ' <span class="stat-value" id="solved">0</span> ' + T('gs.game24.qUnit') + '</span>' +
    '</div>' +
    '<div class="game-controls">' +
    '  <button id="undo-btn" class="btn yellow">' + T('gs.game24.undo') + '</button>' +
    '  <button id="hint-btn" class="btn green">' + T('gs.game24.hint') + '</button>' +
    '  <button id="new-btn" class="btn purple">' + T('gs.game24.newPuzzle') + '</button>' +
    '</div>' +
    '<p class="help-text">' + T('gs.game24.help') + '</p>';

  var cardsEl = document.getElementById('cards');
  var opsEl = document.getElementById('ops');
  var msgEl = document.getElementById('msg');
  var solvedEl = document.getElementById('solved');
  var undoBtn = document.getElementById('undo-btn');
  var hintBtn = document.getElementById('hint-btn');
  var newBtn = document.getElementById('new-btn');

  var cards = [];        // [{ value: Number, expr: String }]
  var history = [];      // 合并前的快照栈，供撤销
  var selected = -1;     // 选中的卡片下标
  var selectedOp = -1;   // 选中的运算符下标
  var solved = 0;        // 本次会话累计解出题数
  var hint = null;       // 当前题的一个解（算式文本）
  var pendingDeal = null;

  /* ---------- 求解器：验证有解 + 提供提示 ---------- */

  function applyOp(o, a, b) {
    if (o === 0) return a + b;
    if (o === 1) return a - b;
    if (o === 2) return a * b;
    return b === 0 ? NaN : a / b;
  }

  function permutations(arr) {
    var res = [];
    (function rec(cur, rest) {
      if (rest.length === 0) {
        res.push(cur);
        return;
      }
      for (var i = 0; i < rest.length; i++) {
        rec(cur.concat(rest[i]), rest.slice(0, i).concat(rest.slice(i + 1)));
      }
    })([], arr);
    return res;
  }

  /* 4 数全排列 x 4^3 运算符 x 3 种括号模式，浮点容差 EPS */
  function solve(nums) {
    var perms = permutations([0, 1, 2, 3]);
    for (var p = 0; p < perms.length; p++) {
      var q = perms[p];
      var n = [nums[q[0]], nums[q[1]], nums[q[2]], nums[q[3]]];
      var l = [String(n[0]), String(n[1]), String(n[2]), String(n[3])];
      for (var o1 = 0; o1 < 4; o1++) {
        for (var o2 = 0; o2 < 4; o2++) {
          for (var o3 = 0; o3 < 4; o3++) {
            var v;
            /* 模式 1：((a o1 b) o2 c) o3 d */
            v = applyOp(o3, applyOp(o2, applyOp(o1, n[0], n[1]), n[2]), n[3]);
            if (!isNaN(v) && Math.abs(v - 24) < EPS) {
              return '((' + l[0] + OP_SYMS[o1] + l[1] + ')' + OP_SYMS[o2] + l[2] + ')' + OP_SYMS[o3] + l[3];
            }
            /* 模式 2：(a o1 b) o2 (c o3 d) */
            v = applyOp(o2, applyOp(o1, n[0], n[1]), applyOp(o3, n[2], n[3]));
            if (!isNaN(v) && Math.abs(v - 24) < EPS) {
              return '(' + l[0] + OP_SYMS[o1] + l[1] + ')' + OP_SYMS[o2] + '(' + l[2] + OP_SYMS[o3] + l[3] + ')';
            }
            /* 模式 3：a o1 (b o2 (c o3 d)) */
            v = applyOp(o1, n[0], applyOp(o2, n[1], applyOp(o3, n[2], n[3])));
            if (!isNaN(v) && Math.abs(v - 24) < EPS) {
              return l[0] + OP_SYMS[o1] + '(' + l[1] + OP_SYMS[o2] + '(' + l[2] + OP_SYMS[o3] + l[3] + '))';
            }
            /* 模式 4：((a o1 b) o2 c) o3 d 的对称式：((a o1 b) o2 (c o3 d)) 已覆盖；
               补全二叉树 5 形态中缺失的两种：((a o1 (b o2 c)) o3 d) 与 (a o1 ((b o2 c) o3 d)) */
            v = applyOp(o3, applyOp(o1, n[0], applyOp(o2, n[1], n[2])), n[3]);
            if (!isNaN(v) && Math.abs(v - 24) < EPS) {
              return '(' + l[0] + OP_SYMS[o1] + '(' + l[1] + OP_SYMS[o2] + l[2] + '))' + OP_SYMS[o3] + l[3];
            }
            v = applyOp(o1, n[0], applyOp(o3, applyOp(o2, n[1], n[2]), n[3]));
            if (!isNaN(v) && Math.abs(v - 24) < EPS) {
              return l[0] + OP_SYMS[o1] + '((' + l[1] + OP_SYMS[o2] + l[2] + ')' + OP_SYMS[o3] + l[3] + ')';
            }
          }
        }
      }
    }
    return null;
  }

  /* ---------- 工具 ---------- */

  /* 数值显示：整数原样，小数最多保留 2 位 */
  function fmt(v) {
    var r = Math.round(v);
    if (Math.abs(v - r) < EPS) return String(r);
    return String(Number(v.toFixed(2)));
  }

  function setMsg(text, color) {
    msgEl.textContent = text;
    msgEl.style.color = color || '';
  }

  /* ---------- 渲染 ---------- */

  function render() {
    cardsEl.innerHTML = '';
    cards.forEach(function (c, i) {
      var d = document.createElement('button');
      d.className = 'g24-card' + (i === selected ? ' selected' : '');
      var val = document.createElement('span');
      val.className = 'g24-val';
      val.textContent = fmt(c.value);
      d.appendChild(val);
      if (c.expr !== String(c.value)) {   // 合并后的卡显示算式
        var ex = document.createElement('span');
        ex.className = 'g24-expr';
        ex.textContent = c.expr;
        d.appendChild(ex);
      }
      d.addEventListener('click', function () { onCardClick(i); });
      cardsEl.appendChild(d);
    });
    for (var k = 0; k < opBtns.length; k++) {
      opBtns[k].classList.toggle('selected', k === selectedOp);
    }
    undoBtn.disabled = history.length === 0;
  }

  /* ---------- 发牌 ---------- */

  function deal() {
    solved = 0;
    clearTimeout(pendingDeal);
    pendingDeal = null;
    var nums, sol, guard = 0;
    do {
      nums = [];
      for (var i = 0; i < 4; i++) nums.push(1 + Math.floor(Math.random() * 13));
      sol = solve(nums);
      guard++;
    } while (!sol && guard < 500);
    hint = sol;
    cards = nums.map(function (n) { return { value: n, expr: String(n) }; });
    history = [];
    selected = -1;
    selectedOp = -1;
    setMsg(DEFAULT_MSG);
    render();
  }

  /* ---------- 交互 ---------- */

  function onCardClick(i) {
    if (selected === -1) {              // 选第一张
      selected = i;
      Arcade.juice.select();
      render();
      return;
    }
    if (i === selected) {               // 再点自己：取消
      selected = -1;
      render();
      return;
    }
    if (selectedOp === -1) {            // 未选运算符：改选
      selected = i;
      render();
      return;
    }

    var a = cards[selected];
    var b = cards[i];
    if (selectedOp === 3 && Math.abs(b.value) < EPS) {
      setMsg(T('gs.game24.divZero'));
      return;
    }

    /* 快照入栈供撤销，再合并两卡 */
    history.push(cards.map(function (c) {
      return { value: c.value, expr: c.expr };
    }));
    var merged = {
      value: applyOp(selectedOp, a.value, b.value),
      expr: '(' + a.expr + OP_SYMS[selectedOp] + b.expr + ')'
    };
    var hi = Math.max(selected, i);
    var lo = Math.min(selected, i);
    cards.splice(hi, 1);
    cards.splice(lo, 1);
    cards.push(merged);
    selected = -1;
    selectedOp = -1;
    Arcade.juice.merge();
    render();

    if (cards.length === 1) {
      finish();
    } else {
      setMsg(T('gs.game24.merged').replace('{e}', merged.expr).replace('{v}', fmt(merged.value)));
    }
  }

  function finish() {
    var v = cards[0].value;
    if (Math.abs(v - 24) < EPS) {
      solved++;
      solvedEl.textContent = solved;
      var isNew = Arcade.shell.submitScore(solved);
      setMsg((isNew ? T('gs.game24.winNew') : T('gs.game24.winCorrect')) +
        T('gs.game24.nextDeal').replace('{e}', cards[0].expr),
        'var(--neon-green)');
      pendingDeal = setTimeout(deal, 1800);
    } else {
      setMsg(T('gs.game24.wrong').replace('{v}', fmt(v)),
        'var(--neon-pink)');
    }
  }

  function undo() {
    if (history.length === 0) {
      setMsg(T('gs.game24.noUndo'));
      return;
    }
    cards = history.pop();
    selected = -1;
    selectedOp = -1;
    setMsg(T('gs.game24.undone'));
    render();
  }

  function showHint() {
    if (hint) {
      setMsg(T('gs.game24.hintMsg').replace('{h}', hint));
    } else {
      setMsg(T('gs.game24.noHint'));
    }
  }

  /* 运算符按钮 */
  var opBtns = OP_SYMS.map(function (sym, k) {
    var b = document.createElement('button');
    b.className = 'g24-op';
    b.textContent = sym;
    b.addEventListener('click', function () {
      selectedOp = (selectedOp === k) ? -1 : k;
      render();
    });
    opsEl.appendChild(b);
    return b;
  });

  undoBtn.addEventListener('click', undo);
  hintBtn.addEventListener('click', showHint);
  newBtn.addEventListener('click', deal);

  deal();    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.game24.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = deal;

})();