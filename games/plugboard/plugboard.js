/* ============================================================
   恩尼格玛插线板反推 · 已知转子设定下的插线恢复（旗舰，全网独家）
   历史原型：缴获恩尼格玛机（转子设定已知）+ 一段已知明文（如格式天气报），
   密码员仍需反推 10 对插线——这是盟军密码员每天的日常。
   数学：密文 = 插线 ∘ 转子路径 ∘ 插线。转子路径已知，逐位置可得约束
   plug(密文) = R(plug(明文))。用约束 + 验证机迭代直到 100% 吻合。
   三难度（3/4/5 对插线）。记分：用时（min）。
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.plugboard.tut1t'), d: T('gs.plugboard.tut1') },
  { t: T('gs.plugboard.tut2t'), d: T('gs.plugboard.tut2') },
  { t: T('gs.plugboard.tut3t'), d: T('gs.plugboard.tut3') },
  { t: T('gs.plugboard.tut4t'), d: T('gs.plugboard.tut4') }
];

(function () {
  /* ==PLUG-CORE-START== */
  var PLUGCORE = (function () {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function idx(c) { return c.charCodeAt(0) - 65; }
    function norm(s) { return String(s).toUpperCase().replace(/[^A-Z]/g, ''); }
    /* ---------- Enigma 引擎（3 转子 + UKW-B + 插线板） ---------- */
    var ROTORS = {
      I:   { w: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 16 },
      II:  { w: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 4 },
      III: { w: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 21 }
    };
    var REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
    function fwd(x, r, pos) { var c = r.w[(x + pos) % 26]; return (idx(c) - pos + 26) % 26; }
    function rev(x, r, pos) { var c = A[(x + pos) % 26]; var i = r.w.indexOf(c); return (i - pos + 26) % 26; }
    function stepOnce(order, pos) {
      var n1 = ROTORS[order[1]].notch, n2 = ROTORS[order[2]].notch;
      if (pos[1] === n1) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
      else if (pos[2] === n2) { pos[1] = (pos[1] + 1) % 26; }
      pos[2] = (pos[2] + 1) % 26;
    }
    function identityPlug() { var p = []; for (var i = 0; i < 26; i++) p[i] = i; return p; }
    function buildPlug(pairs) {
      var p = identityPlug();
      (pairs || []).forEach(function (pr) {
        var a = idx(pr[0]), b = idx(pr[1]);
        p[a] = b; p[b] = a;
      });
      return p;
    }
    /* 单字母经转子路径（无插线）在给定位置（步进一次后）的映射 */
    function rotorLetter(ch, order, pos) {
      var x = idx(ch);
      x = fwd(x, ROTORS[order[2]], pos[2]);
      x = fwd(x, ROTORS[order[1]], pos[1]);
      x = fwd(x, ROTORS[order[0]], pos[0]);
      x = idx(REFLECTOR[x]);
      x = rev(x, ROTORS[order[0]], pos[0]);
      x = rev(x, ROTORS[order[1]], pos[1]);
      x = rev(x, ROTORS[order[2]], pos[2]);
      return A[x];
    }
    function encLetter(ch, order, pos, plug) {
      stepOnce(order, pos);
      var x = plug[idx(ch)];
      x = fwd(x, ROTORS[order[2]], pos[2]);
      x = fwd(x, ROTORS[order[1]], pos[1]);
      x = fwd(x, ROTORS[order[0]], pos[0]);
      x = idx(REFLECTOR[x]);
      x = rev(x, ROTORS[order[0]], pos[0]);
      x = rev(x, ROTORS[order[1]], pos[1]);
      x = rev(x, ROTORS[order[2]], pos[2]);
      return A[plug[x]];
    }
    function transform(text, order, startPos, plug) {
      var pos = startPos.slice();
      var out = '';
      for (var i = 0; i < text.length; i++) out += encLetter(text[i], order, pos, plug);
      return out;
    }
    /* 逐位置约束：pos_i 处明文 p 经转子路径得 r_i，约束 plug(c) = rotorLetter(plug(p))。
       同时预计算每个约束处的转子位置，供求解/推导 O(1) 取用 */
    function buildConstraints(plain, cipher, order, startPos) {
      var pos = startPos.slice();
      var cons = [], posAt = [];
      for (var i = 0; i < plain.length; i++) {
        stepOnce(order, pos);
        posAt.push(pos.slice());
        cons.push({ p: idx(plain[i]), c: idx(cipher[i]), r: idx(rotorLetter(plain[i], order, pos)) });
      }
      return { cons: cons, posAt: posAt };
    }
    /* ---------- 约束求解（精确覆盖回溯）：找全部满足约束的插线板 ---------- */
    function solveAll(plain, cipher, order, startPos, maxSols) {
      var bc = buildConstraints(plain, cipher, order, startPos);
      var cons = bc.cons, posAt = bc.posAt;
      var sols = [];
      var pair = new Array(26).fill(-1); // pair[x] = y（-1 未定；x 自身=未插线）
      function setPair(x, y) {
        if (pair[x] !== -1 || pair[y] !== -1) return false;
        pair[x] = y; pair[y] = x;
        return true;
      }
      function search() {
        // 1) 传播：一边已定、另一边未定的约束 → 强制另一边
        var progressed = true;
        while (progressed) {
          progressed = false;
          for (var i = 0; i < cons.length; i++) {
            var co = cons[i];
            var x = pair[co.p], c = pair[co.c];
            if (x !== -1 && c === -1) {
              var rv = idx(rotorLetter(A[x], order, posAt[i]));
              if (!setPair(co.c, rv)) return false;
              progressed = true;
            } else if (x === -1 && c !== -1) {
              var rp = revRotor(c, order, posAt[i]);
              if (!setPair(co.p, rp)) return false;
              progressed = true;
            }
          }
        }
        // 2) 冲突检查
        for (var j = 0; j < cons.length; j++) {
          var cj = cons[j];
          var xj = pair[cj.p], cj2 = pair[cj.c];
          if (xj === -1 || cj2 === -1) continue;
          var want = idx(rotorLetter(A[xj], order, posAt[j]));
          if (cj2 !== want) return false;
        }
        // 3) 全部约束满足？
        var done = true;
        for (var k = 0; k < cons.length; k++) {
          if (pair[cons[k].p] === -1 || pair[cons[k].c] === -1) { done = false; break; }
        }
        if (done) {
          sols.push(pair.slice());
          return sols.length >= maxSols;
        }
        // 4) 分支：取一个参与约束但未定的字母，尝试各候选（含自身=未插线）
        var letter = -1;
        for (var m = 0; m < cons.length && letter < 0; m++) {
          var cm = cons[m];
          if (pair[cm.p] === -1) letter = cm.p;
          else if (pair[cm.c] === -1) letter = cm.c;
        }
        if (letter < 0) return false;
        for (var t = 0; t < 26; t++) {
          if (pair[t] !== -1) continue;
          var saved = pair.slice();
          if (setPair(letter, t)) {
            if (search()) return true;
          }
          for (var u = 0; u < 26; u++) pair[u] = saved[u];
        }
        return false;
      }
      search();
      return sols;
    }
    function revRotor(c, order, pos) {
      var x = c;
      x = fwd(x, ROTORS[order[2]], pos[2]);
      x = fwd(x, ROTORS[order[1]], pos[1]);
      x = fwd(x, ROTORS[order[0]], pos[0]);
      x = idx(REFLECTOR[x]);
      x = rev(x, ROTORS[order[0]], pos[0]);
      x = rev(x, ROTORS[order[1]], pos[1]);
      x = rev(x, ROTORS[order[2]], pos[2]);
      return x;
    }
    /* ---------- 验证机 ---------- */
    function verify(plain, cipher, order, startPos, pairs) {
      var plug = buildPlug(pairs);
      var out = transform(plain, order, startPos, plug);
      var match = 0;
      for (var i = 0; i < plain.length; i++) if (out[i] === cipher[i]) match++;
      return { match: match, total: plain.length, pct: Math.round(match / plain.length * 100) };
    }
    /* ---------- 约束助手：从当前部分插线推导强制结论 ---------- */
    function deriveForced(plain, cipher, order, startPos, pairs) {
      var bc = buildConstraints(plain, cipher, order, startPos);
      var cons = bc.cons, posAt = bc.posAt;
      var pair = identityPlug();
      (pairs || []).forEach(function (pr) { pair[idx(pr[0])] = idx(pr[1]); pair[idx(pr[1])] = idx(pr[0]); });
      var forced = [];
      var changed = true;
      while (changed) {
        changed = false;
        for (var i = 0; i < cons.length; i++) {
          var co = cons[i];
          var x = pair[co.p], c = pair[co.c];
          if (x !== co.p && c === co.c) {
            // p 已插线（x≠p），c 未插线 → c 必须 = rotorLetter(x)
            var want = idx(rotorLetter(A[x], order, posAt[i]));
            if (want !== co.c) {
              var letterC = A[co.c], wantL = A[want];
              if (pair[want] === want) {
                pair[co.c] = want; pair[want] = co.c;
                forced.push(letterC + '↔' + wantL);
                changed = true;
              }
            }
          } else if (c !== co.c && x === co.p) {
            var want2 = revRotor(c, order, posAt[i]);
            if (want2 !== co.p) {
              var letterP = A[co.p], wantL2 = A[want2];
              if (pair[want2] === want2) {
                pair[co.p] = want2; pair[want2] = co.p;
                forced.push(letterP + '↔' + wantL2);
                changed = true;
              }
            }
          }
        }
      }
      return forced;
    }
    /* ---------- 挑战生成 ---------- */
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var PLAINS = [
      'WEATHER REPORT CLOUDY SKIES OVER THE ENTIRE OPERATION AREA',
      'REPORTING ALL UNITS READY FOR THE NIGHT OPERATION TOMORROW',
      'THE ENEMY FLEET IS SIGHTED NEAR THE SOUTHERN ISLAND COAST',
      'CONVOY DEPARTED FROM HARBOR AT DAWN UNDER HEAVY AIR COVER',
      'AIRFIELD STATUS FULLY OPERATIONAL ALL SQUADRONS FUELED AND ARMED',
      'SIGNAL CORPS CONFIRMS RADIO CONTACT WITH THE NORTHERN PATROL',
      'ADVANCE UNITS ENCAMPED EAST OF THE RIVER WAITING FOR ORDERS',
      'BATTLESHIPS ESCORTED BY DESTROYERS HEADING TOWARD THE GULF'
    ];
    var ORDERS = [['I', 'II', 'III'], ['I', 'III', 'II'], ['II', 'I', 'III'], ['II', 'III', 'I'], ['III', 'I', 'II'], ['III', 'II', 'I']];
    function randPairs(rng, k) {
      var letters = A.split('');
      for (var i = 25; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = letters[i]; letters[i] = letters[j]; letters[j] = t; }
      var pairs = [];
      for (var s = 0; s < k; s++) pairs.push(letters[s * 2] + letters[s * 2 + 1]);
      return pairs;
    }
    function genPlugChallenge(level, rng) {
      var k = level === 1 ? 3 : level === 2 ? 4 : 5;
      for (var attempt = 0; attempt < 60; attempt++) {
        var pairs = randPairs(rng, k);
        var order = ORDERS[Math.floor(rng() * ORDERS.length)];
        var start = [Math.floor(rng() * 26), Math.floor(rng() * 26), Math.floor(rng() * 26)];
        var plain = norm(PLAINS[Math.floor(rng() * PLAINS.length)]);
        if (plain.length < 34) continue;
        var cipher = transform(plain, order, start, buildPlug(pairs));
        var sols = solveAll(plain, cipher, order, start, 2);
        if (sols.length === 1) {
          // 唯一解必须就是真实插线板
          var sol = sols[0];
          var ok = pairs.every(function (pr) {
            return sol[idx(pr[0])] === idx(pr[1]) && sol[idx(pr[1])] === idx(pr[0]);
          });
          if (!ok) continue;
          return { plain: plain, cipher: cipher, order: order, start: start, pairs: pairs, k: k, level: level };
        }
      }
      return null;
    }
    return {
      A: A, idx: idx, norm: norm, ROTORS: ROTORS, REFLECTOR: REFLECTOR,
      transform: transform, buildPlug: buildPlug, identityPlug: identityPlug,
      buildConstraints: buildConstraints, solveAll: solveAll, verify: verify,
      deriveForced: deriveForced, mulberry32: mulberry32, PLAINS: PLAINS,
      genPlugChallenge: genPlugChallenge
    };
  })();
  /* ==PLUG-CORE-END== */

  var A = PLUGCORE.A, idx = PLUGCORE.idx, norm = PLUGCORE.norm;
  var transform = PLUGCORE.transform, buildPlug = PLUGCORE.buildPlug;
  var buildConstraints = PLUGCORE.buildConstraints, verify = PLUGCORE.verify;
  var deriveForced = PLUGCORE.deriveForced, genPlugChallenge = PLUGCORE.genPlugChallenge;
  var mulberry32 = PLUGCORE.mulberry32;

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  root.innerHTML =
    '<div class="pg-wrap">' +
    '  <div class="pg-info">' +
    '    <span>' + T('gs.plugboard.diffLbl') + ' <span id="pg-diff" class="stat-value"></span></span>' +
    '    <span>' + T('gs.plugboard.timeLbl') + ' <span id="pg-timer" class="stat-value">0s</span></span>' +
    '    <span>' + T('gs.plugboard.pctLbl') + ' <span id="pg-pct" class="stat-value">0</span>%</span>' +
    '  </div>' +
    '  <div class="pg-flavor">' + T('gs.plugboard.flavor') + '</div>' +
    '  <div class="pg-settings" id="pg-settings"></div>' +
    '  <div class="pg-lbl">' + T('gs.plugboard.alignLbl') + '</div>' +
    '  <div class="pg-align" id="pg-align"></div>' +
    '  <div class="pg-lbl">' + T('gs.plugboard.boardLbl') + '<span id="pg-k" class="stat-value">0</span> ' + T('gs.plugboard.pairsUnit') + '</div>' +
    '  <div class="pg-board" id="pg-board"></div>' +
    '  <div class="pg-pairs" id="pg-pairs"></div>' +
    '  <div class="game-controls">' +
    '    <button class="btn purple" id="pg-derive">' + T('gs.plugboard.deriveBtn') + '</button>' +
    '    <button class="btn cyan" id="pg-hint">' + T('gs.plugboard.hintBtn') + '</button>' +
    '    <button class="btn red" id="pg-clear">' + T('gs.plugboard.clearBtn') + '</button>' +
    '    <button class="btn yellow" id="pg-new">' + T('gs.plugboard.newBtn') + '</button>' +
    '  </div>' +
    '  <div class="pg-msg" id="pg-msg"></div>' +
    '</div>';

  var el = function (id) { return document.getElementById(id); };
  var LEVELS = [T('gs.plugboard.dEasy'), T('gs.plugboard.dNormal'), T('gs.plugboard.dHard')];
  var level = 0;
  var chal = null;
  var pairs = [];        // ['AB','CD',...] 当前插线
  var selLetter = null;  // 选中待配对的字母
  var timerTick = null, startTs = 0, answered = false;

  function elapsed() { return Math.round((Date.now() - startTs) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }
  function startTimer() {
    stopTimer();
    startTs = Date.now();
    timerTick = setInterval(function () { el('pg-timer').textContent = elapsed() + 's'; }, 500);
  }

  function pairOf(l) {
    for (var i = 0; i < pairs.length; i++) if (pairs[i].indexOf(l) >= 0) return pairs[i];
    return null;
  }

  function newChallenge() {
    answered = false;
    selLetter = null;
    pairs = [];
    chal = genPlugChallenge(level + 1, mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0));
    if (!chal) { if (Arcade.ui) Arcade.ui.toast(T('gs.plugboard.genFail'), 'warn'); return; }
    el('pg-diff').textContent = T('gs.plugboard.diffLabel').replace('{d}', LEVELS[level]).replace('{n}', chal.k);
    el('pg-settings').textContent = T('gs.plugboard.settings').replace('{r}', chal.order.join('-')).replace('{s}',
      A[chal.start[0]] + A[chal.start[1]] + A[chal.start[2]]);
    el('pg-msg').textContent = '';
    el('pg-msg').style.color = '';
    renderAlign();
    renderBoard();
    updateVerify();
    startTimer();
  }

  function renderAlign() {
    var bc = buildConstraints(chal.plain, chal.cipher, chal.order, chal.start);
    var cons = bc.cons;
    var html = '';
    for (var i = 0; i < chal.plain.length; i++) {
      var p = chal.plain[i], c = chal.cipher[i];
      var r = A[cons[i].r];
      var self = r === c;
      html += '<span class="pg-pos' + (self ? ' ok' : ' bad') + '" data-i="' + i + '">' +
        '<b>' + p + '</b>→' + r + '|' + c + '</span>';
    }
    el('pg-align').innerHTML = html;
  }

  function renderBoard() {
    var html = '';
    for (var i = 0; i < 26; i++) {
      var l = A[i];
      var pr = pairOf(l);
      html += '<button class="pg-letter' + (pr ? ' on' : '') + (selLetter === l ? ' sel' : '') + '" data-l="' + l + '">' +
        l + (pr ? '<small>' + pr.replace(l, '') + '</small>' : '') + '</button>';
    }
    el('pg-board').innerHTML = html;
    el('pg-board').querySelectorAll('.pg-letter').forEach(function (b) {
      b.addEventListener('click', function () { clickLetter(this.getAttribute('data-l')); });
    });
    var phtml = pairs.length ? pairs.map(function (p) { return '<span class="pg-pair">' + p[0] + '↔' + p[1] + '</span>'; }).join(' ') : T('gs.plugboard.noPairs');
    el('pg-pairs').innerHTML = T('gs.plugboard.currentLbl') + phtml;
    el('pg-k').textContent = pairs.length;
  }

  function clickLetter(l) {
    if (answered) return;
    var pr = pairOf(l);
    if (pr) { // 解除配对
      pairs = pairs.filter(function (x) { return x !== pr; });
      if (selLetter && pairOf(selLetter) === pr) selLetter = null;
      if (Arcade.audio) Arcade.audio.play('move');
    } else if (selLetter && selLetter !== l) {
      pairs.push(selLetter + l);
      selLetter = null;
      if (Arcade.audio) Arcade.audio.play('coin');
    } else {
      selLetter = (selLetter === l) ? null : l;
      if (Arcade.audio) Arcade.audio.play('ui');
    }
    renderBoard();
    updateVerify();
  }

  function updateVerify() {
    if (!chal) return;
    var r = verify(chal.plain, chal.cipher, chal.order, chal.start, pairs);
    el('pg-pct').textContent = r.pct;
    if (r.match === r.total) {
      if (!answered) {
        answered = true;
        stopTimer();
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.audio) Arcade.audio.play('win');
        if (Arcade.shell) Arcade.shell.submitScore(elapsed());
        if (Arcade.ui) Arcade.ui.toast(T('gs.plugboard.win').replace('{n}', elapsed()), 'win');
        setTimeout(newChallenge, 1500);
      }
    }
  }

  el('pg-derive').addEventListener('click', function () {
    if (answered || !chal) return;
    var forced = deriveForced(chal.plain, chal.cipher, chal.order, chal.start, pairs);
    var msg = el('pg-msg');
    if (forced.length) {
      pairs = pairs.concat(forced).filter(function (pr, i2, arr) {
        return arr.findIndex(function (x) { return x.split('').sort().join() === pr.split('').sort().join(); }) === i2;
      });
      renderBoard();
      updateVerify();
      msg.innerHTML = T('gs.plugboard.deriveOk').replace('{n}', forced.join(T('gs.plugboard.listSep')));
      msg.style.color = 'var(--neon-cyan)';
      if (Arcade.audio) Arcade.audio.play('ui');
    } else {
      msg.innerHTML = T('gs.plugboard.deriveNone');
      msg.style.color = '';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  el('pg-hint').addEventListener('click', function () {
    if (answered || !chal) return;
    for (var i = 0; i < chal.pairs.length; i++) {
      var pr = chal.pairs[i];
      if (!pairOf(pr[0]) && !pairOf(pr[1])) {
        pairs.push(pr);
        renderBoard();
        updateVerify();
        var msg = el('pg-msg');
        msg.innerHTML = T('gs.plugboard.hintMsg').replace('{p}', pr[0]).replace('{q}', pr[1]);
        msg.style.color = 'var(--neon-yellow)';
        if (Arcade.audio) Arcade.audio.play('ui');
        return;
      }
    }
    el('pg-msg').textContent = T('gs.plugboard.hintAll');
  });

  el('pg-clear').addEventListener('click', function () {
    pairs = [];
    selLetter = null;
    renderBoard();
    updateVerify();
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  el('pg-new').addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    newChallenge();
  });

  /* 难度切换 */
  var diffRow = document.createElement('div');
  diffRow.className = 'pg-diffs';
  diffRow.innerHTML = LEVELS.map(function (d, i) {
    return '<button class="mode-btn' + (i === level ? ' selected' : '') + '" data-lv="' + i + '">' + d + '</button>';
  }).join('');
  var infoRow = root.querySelector('.pg-info');
  infoRow.appendChild(diffRow);
  diffRow.querySelectorAll('.mode-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      level = parseInt(this.getAttribute('data-lv'), 10);
      diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('selected', x === b); });
      newChallenge();
      if (Arcade.audio) Arcade.audio.play('ui');
    });
  });

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.plugboard.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    stopTimer();
    level = 0;
    diffRow.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('selected', x.getAttribute('data-lv') === '0'); });
    newChallenge();
  };

  // 初始化
  newChallenge();


})();
