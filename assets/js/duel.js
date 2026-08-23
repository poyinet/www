/* ============================================================
   双人同屏竞速 Duel —— A2 竞技玩法
   左右分屏（移动端上下分屏），同一套 10 题（复用 QUIZ 题库），
   各自作答：左玩家 1/2/3/4 键，右玩家 7/8/9/0 键（也可点按按钮）。
   双方都答完 → 下一题；10 题后按得分定胜负（同分判平局）。
   依赖：core/i18n.js + core/i18n-dict.js + quiz.js
   ============================================================ */
window.DUEL = (function () {
  var KEYS_P1 = ['1', '2', '3', '4'];
  var KEYS_P2 = ['7', '8', '9', '0'];
  var MAP_P1 = { '1': 0, '2': 1, '3': 2, '4': 3 };
  var MAP_P2 = { '7': 0, '8': 1, '9': 2, '0': 3 };

  function Duel(host, quiz) {
    this.host = host;
    this.Q = quiz;
    this.state = null;
    this.bindKeys();
  }

  Duel.prototype.bindKeys = function () {
    var self = this;
    document.addEventListener('keydown', function (ev) {
      if (!self.state || self.state.done) return;
      var k = ev.key;
      if (k in MAP_P1) { self.answer(0, MAP_P1[k]); ev.preventDefault(); }
      else if (k in MAP_P2) { self.answer(1, MAP_P2[k]); ev.preventDefault(); }
    });
  };

  Duel.prototype.start = function () {
    this.state = {
      list: this.Q.draw10(),
      idx: 0,
      done: false,
      qStartAt: 0,
      p: [
        { score: 0, answered: false, last: -1, lastIdx: -1, finishAt: 0, totalMs: 0 },
        { score: 0, answered: false, last: -1, lastIdx: -1, finishAt: 0, totalMs: 0 }
      ]
    };
    this._timeout = null;
    this.render();
    this.state.qStartAt = Date.now();
  };

  /* 单方答完后的超时兜底：对方 20 秒未答则跳过本题（防卡死） */
  Duel.prototype.armTimeout = function () {
    var self = this;
    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = setTimeout(function () {
      var st = self.state;
      if (!st || st.done) return;
      if (st.p[0].answered && st.p[1].answered) { self.next(); return; }
      /* 强行走下一题（未答方本题 0 分） */
      self.next();
    }, 20000);
  };

  Duel.prototype.answer = function (player, i) {
    var st = this.state;
    if (!st || st.done) return;
    var p = st.p[player];
    if (p.answered) return; // 本题已答
    var q = st.list[st.idx];
    var right = i === q.a;
    if (right) p.score++;
    p.answered = true;
    p.last = right ? 1 : 0;
    p.lastIdx = i; // 统一记录（键盘/鼠标作答均高亮错误选项）
    p.finishAt = Date.now();
    p.totalMs += Math.max(0, p.finishAt - st.qStartAt); // 累计本题作答耗时（平局裁决用）
    this.render();
    // 双方都答完 → 下一题；否则启动超时兜底
    if (st.p[0].answered && st.p[1].answered) {
      if (this._timeout) clearTimeout(this._timeout);
      var self = this;
      setTimeout(function () { self.next(); }, 900);
    } else {
      this.armTimeout();
    }
  };

  Duel.prototype.next = function () {
    var st = this.state;
    if (!st) return;
    if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
    st.idx++;
    if (st.idx >= st.list.length) { this.finish(); return; }
    st.p[0].answered = false; st.p[0].last = -1; st.p[0].lastIdx = -1;
    st.p[1].answered = false; st.p[1].last = -1; st.p[1].lastIdx = -1;
    st.qStartAt = Date.now();
    this.render();
  };

  Duel.prototype.finish = function () {
    var st = this.state;
    st.done = true;
    var winner;
    if (st.p[0].score > st.p[1].score) winner = 0;
    else if (st.p[1].score > st.p[0].score) winner = 1;
    else {
      // 同分 → 比累计作答耗时（短者胜）
      if (st.p[0].totalMs !== st.p[1].totalMs) winner = st.p[0].totalMs < st.p[1].totalMs ? 0 : 1;
      else winner = -1;
    }
    st.winner = winner;
    /* 记录战绩（徽章墙读取）：胜/负/平 累计 */
    try {
      var k = 'arcade_duel_wins';
      var cur = parseInt(localStorage.getItem(k) || '0', 10);
      if (winner === 0) localStorage.setItem(k, String(cur + 1));
      var kt = 'arcade_duel_total';
      localStorage.setItem(kt, String(parseInt(localStorage.getItem(kt) || '0', 10) + 1));
    } catch (e) {}
    this.render();
  };

  Duel.prototype.render = function () {
    var st = this.state;
    if (!st) return;
    var T = window.Arcade && Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };
    var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';

    if (!st.list.length) return;
    var html = '';

    if (st.done) {
      /* ------- 结果屏 ------- */
      var w = st.winner;
      var msg;
      if (w === -1) msg = T('duel.drawMsg');
      else msg = (w === 0 ? T('duel.p1') : T('duel.p2')) + ' ' + T('duel.winMsg');
      var icon = w === -1 ? '🤝' : (w === 0 ? '🟦' : '🟥');
      html += '<div class="dz-result">' +
        '<div class="dz-big">' + icon + '</div>' +
        '<h2>' + (w === -1 ? T('duel.draw') : T('duel.win')) + '</h2>' +
        '<p class="dz-msg">' + msg + '</p>' +
        '<div class="dz-score-row">' +
          '<div class="dz-score ' + (w === 0 ? 'on' : '') + '"><span class="dz-name">' + T('duel.p1') + '</span><b>' + st.p[0].score + '</b></div>' +
          '<div class="dz-vs">VS</div>' +
          '<div class="dz-score ' + (w === 1 ? 'on' : '') + '"><span class="dz-name">' + T('duel.p2') + '</span><b>' + st.p[1].score + '</b></div>' +
        '</div>' +
        '<button class="btn purple" id="dz-again">' + T('duel.again') + '</button>' +
      '</div>';
      this.host.innerHTML = html;
      var again = document.getElementById('dz-again');
      if (again) again.addEventListener('click', (function (self) { return function () { self.start(); }; })(this));
      return;
    }

    /* ------- 对局屏 ------- */
    var q = st.list[st.idx];
    var qd = isEn ? q.en : q.zh;
    var n = st.idx + 1, total = st.list.length;

    html += '<div class="dz-qhead">' +
      '<span class="dz-qnum">' + T('duel.q').replace('{n}', n + '/' + total) + '</span>' +
      '<span class="dz-lvl">' + T('quiz.lvl' + q.lvl) + '</span>' +
      '</div>';

    html += '<div class="dz-q">' + qd.q + '</div>';

    html += '<div class="dz-arena">';
    for (var p = 0; p < 2; p++) {
      var P = st.p[p];
      var KEYS = p === 0 ? KEYS_P1 : KEYS_P2;
      var opp = st.p[1 - p];
      html += '<div class="dz-player dz-p' + (p + 1) + '">' +
        '<div class="dz-phead">' +
          '<span class="dz-pname">' + (p === 0 ? T('duel.p1') : T('duel.p2')) + '</span>' +
          '<span class="dz-pkeys">' + (p === 0 ? T('duel.p1keys') : T('duel.p2keys')) + '</span>' +
          '<span class="dz-pscore">' + T('duel.score').replace('{s}', P.score) + '</span>' +
        '</div>' +
        '<div class="dz-pstatus' + (P.answered ? (P.last ? ' ok' : ' bad') : '') + '">' +
          (P.answered ? (P.last ? T('quiz.right') : T('quiz.wrong')) : T('duel.wait')) +
        '</div>' +
        '<div class="dz-opts">';
      qd.opts.forEach(function (o, i) {
        var cls = 'dz-opt';
        if (P.answered) {
          if (i === q.a) cls += ' right';
          else if (i === P.lastIdx) cls += ' wrong';
          else cls += ' dim';
        }
        html += '<button class="' + cls + '" data-p="' + p + '" data-i="' + i + '">' +
          '<span class="dz-k">' + KEYS[i] + '</span>' + o + '</button>';
      });
      html += '</div></div>';
      if (p === 0) html += '<div class="dz-mid"></div>';
    }
    html += '</div>';

    this.host.innerHTML = html;

    var self = this;
    var btns = this.host.querySelectorAll('.dz-opt');
    for (var b = 0; b < btns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var p = parseInt(btn.getAttribute('data-p'), 10);
          var i = parseInt(btn.getAttribute('data-i'), 10);
          if (!self.state.p[p].answered) {
            self.answer(p, i); // answer() 内统一记录 lastIdx
          }
        });
      })(btns[b]);
    }
  };

  return { Duel: Duel };
})();
