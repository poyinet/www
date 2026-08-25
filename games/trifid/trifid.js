/* ============================================================
   Trifid 破译机 · 三维立体分块密码（旗舰，全网独家）
   1902 年 Delastelle 继 Bifid 后发明的三维扩展：
   3×3×3 立方体（27 格 = 26 字母 + 句点），每字母一个三维坐标(层,行,列)。
   加密：每 3 个字母一组，把 9 个坐标值「层列行」重排成新坐标查表。
   三模式：
   - 原理演示：设密钥看 3D 立方体，明文→密文实时坐标重排
   - 破解挑战：3 关递进（已知密钥 / 残缺密钥补全 / 乱序密钥重排）
   - 每日一题：日期种子生成当日电文
   记分：挑战/每日用时（秒，min 模式）
   ============================================================ */


window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.trifid.tut1t'), d: T('gs.trifid.tut1') },
  { t: T('gs.trifid.tut2t'), d: T('gs.trifid.tut2') },
  { t: T('gs.trifid.tut3t'), d: T('gs.trifid.tut3') }
];

(function () {
  /* ==TRIFID-CORE-START== */
  var TFCORE = (function () {
    var SYM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.'; // 27 符号
    function buildCube(keyword) {
      var seen = {}, seq = [];
      var kw = (keyword || '').toUpperCase().replace(/[^A-Z]/g, '');
      for (var i = 0; i < kw.length; i++) {
        var c = kw[i];
        if (!seen[c]) { seen[c] = true; seq.push(c); }
      }
      for (var j = 0; j < 26; j++) {
        var L = SYM[j];
        if (!seen[L]) { seen[L] = true; seq.push(L); }
      }
      seq.push('.');
      return seq; // 27 格（3×3×3）
    }
    function coordsOf(cube, ch) {
      var p = cube.indexOf(ch);
      if (p < 0) p = 26;
      return [Math.floor(p / 9), Math.floor(p / 3) % 3, p % 3];
    }
    function symAt(cube, l, r, c) { return cube[l * 9 + r * 3 + c]; }
    /* 加密：明文每 3 字母一组 → 坐标值先全层、再全行、后全列 → 每 3 个作新坐标 */
    function encText(keyword, text) {
      var cube = buildCube(keyword);
      var t = String(text).toUpperCase().replace(/[^A-Z]/g, '');
      while (t.length % 3 !== 0) t += 'X';
      var out = '';
      for (var i = 0; i < t.length; i += 3) {
        var ls = [], rs = [], cs = [];
        for (var k = 0; k < 3; k++) {
          var cd = coordsOf(cube, t[i + k]);
          ls.push(cd[0]); rs.push(cd[1]); cs.push(cd[2]);
        }
        var vals = ls.concat(rs, cs); // [L0,L1,L2, R0,R1,R2, C0,C1,C2]
        for (var m = 0; m < 3; m++) out += symAt(cube, vals[m * 3], vals[m * 3 + 1], vals[m * 3 + 2]);
      }
      return out;
    }
    /* 解密：密文字母坐标展平 → 明文字母 k 的坐标 = (vals[k], vals[3+k], vals[6+k])
       注意：密文可含第 27 符号 '.'，不能剥离 */
    function decText(keyword, text) {
      var cube = buildCube(keyword);
      var t = String(text).toUpperCase().replace(/[^A-Z.]/g, '');
      if (t.length % 3 !== 0) return t;
      var out = '';
      for (var b = 0; b < t.length; b += 3) {
        var bv = [];
        for (var k = 0; k < 3; k++) bv = bv.concat(coordsOf(cube, t[b + k]));
        for (var m = 0; m < 3; m++) out += symAt(cube, bv[m], bv[3 + m], bv[6 + m]);
      }
      return out.replace(/X+$/, ''); // 去掉全部补位 X（len%3==1 时会补 2 个）
    }
    /* 可读性评分（对数似然比 + 空格率），供密钥工具指导 */
    var ENGFREQ = [8.17, 1.49, 2.78, 4.25, 12.70, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41, 6.75, 7.51, 1.93, 0.10, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07];
    function readScore(s) {
      var t = String(s).toUpperCase().replace(/[^A-Z]/g, '');
      var n = t.length;
      if (n < 4) return 0;
      var cnt = new Array(26).fill(0);
      for (var i = 0; i < n; i++) cnt[t.charCodeAt(i) - 65]++;
      var ll = 0;
      for (var k = 0; k < 26; k++) if (cnt[k]) ll += cnt[k] * Math.log(26 * ENGFREQ[k] / 100);
      var sc = Math.max(0, (ll / n + 1.16) / 2.0);
      return Math.round(100 * sc);
    }
    /* 每日题词库 + 种子 */
    var DAILY_WORDS = ['FREEFRANCE', 'IRONCURTAIN', 'NIGHTFALL', 'CODEMASTER', 'SECRETFILE', 'TRIUMPH', 'VICTORYROAD', 'CIPHERDEEP', 'THREEDCUBE', 'POLYBIUS'];
    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function todaySeed() {
      var d = new Date();
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }
    function genDaily(rng) {
      var kw = rng() < 0.5 ? 'PARIS' : rng() < 0.7 ? 'LYON' : 'VICHY';
      var plain = DAILY_WORDS[Math.floor(rng() * DAILY_WORDS.length)];
      if (plain[plain.length - 1] === 'X') plain = plain.slice(0, -1) + 'Q';
      return { key: kw, plain: plain, cipher: encText(kw, plain) };
    }
    /* 挑战消息池（避免尾部 X 与去补位歧义） */
    var MSGS = ['NEON SIGNAL', 'SECRET KEY', 'CODE BREAK', 'NIGHT RAID', 'HIDDEN GATE', 'GOLDEN KEY',
      'SAFE HOUSE', 'TARGET ZONE', 'SILENT RUN', 'DEEP COVER', 'BLACK BOX', 'IRON GATE',
      'FINAL CODE', 'QUIET STORM', 'ENEMY BASE', 'CLEAR SKY', 'FIRST STRIKE', 'LAST ORDER',
      'SOFT TARGET', 'HARD LINE', 'RED ALERT', 'BLUE LIGHT', 'DARK ROOM', 'FAST RUN',
      'TALL TOWER', 'DEEP LAKE', 'COLD NIGHT', 'WARM BEACH', 'HIGH WALL', 'LONG ROAD',
      'SIDE DOOR', 'BACK DOOR', 'FRONT LINE', 'OPEN FILE', 'CLOSE CALL', 'SAFE ZONE',
      'FREE PASS', 'FAIR PLAY', 'NEXT STEP', 'TOP SECRET', 'EARLY BIRD', 'LATE NIGHT',
      'NEW MOON', 'FULL MOON', 'OLD TOWN', 'BIG CITY', 'SMALL KEY', 'LOST SOUL'];
    var KEYS = ['PARIS', 'LYON', 'VICHY', 'TOURS', 'MARSEILLE', 'BORDEAUX', 'NANTES', 'LILLE'];
    /* 挑战生成：level 1/2/3 → {key, plain, cipher, mask}（mask: 密钥中隐藏位置） */
    function genChallenge(level, rng) {
      var plain = MSGS[Math.floor(rng() * MSGS.length)];
      if (plain[plain.length - 1] === 'X') plain = plain.slice(0, -1) + 'Q';
      var key = KEYS[Math.floor(rng() * KEYS.length)];
      var cipher = encText(key, plain);
      var mask = null;
      if (level === 2) {
        var pos = Math.floor(rng() * key.length);
        mask = [pos];
      } else if (level === 3) {
        // 乱序：洗牌（保证与原文不同）
        var arr = key.split('');
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(rng() * (i + 1));
          var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        if (arr.join('') === key) arr = arr.reverse();
        mask = arr.join(''); // 乱序密钥串
      }
      return { key: key, plain: plain, cipher: cipher, mask: mask, level: level };
    }
    return {
      SYM: SYM, buildCube: buildCube, coordsOf: coordsOf, symAt: symAt,
      encText: encText, decText: decText, readScore: readScore,
      mulberry32: mulberry32, todaySeed: todaySeed, genDaily: genDaily,
      DAILY_WORDS: DAILY_WORDS, MSGS: MSGS, KEYS: KEYS, genChallenge: genChallenge
    };
  })();
  /* ==TRIFID-CORE-END== */

  var A = TFCORE.SYM.slice(0, 26);
  var buildCube = TFCORE.buildCube, encText = TFCORE.encText, decText = TFCORE.decText;
  var readScore = TFCORE.readScore, genDaily = TFCORE.genDaily, genChallenge = TFCORE.genChallenge;
  var mulberry32 = TFCORE.mulberry32;

  /* ================= DOM ================= */
  var root = document.getElementById('game-root');
  root.innerHTML =
    '<div class="tf-tabs">' +
    '  <button class="btn tf-tab mode-btn selected" data-mode="lab">' + T('gs.trifid.modeLab') + '</button>' +
    '  <button class="btn tf-tab mode-btn" data-mode="chal">' + T('gs.trifid.modeChal') + '</button>' +
    '  <button class="btn tf-tab mode-btn" data-mode="daily">' + T('gs.trifid.modeDaily') + '</button>' +
    '</div>' +
    '<div class="tf-cube" id="tf-cube"></div>' +
    '<div id="tf-body"></div>';

  var el = function (id) { return document.getElementById(id); };
  var LEVEL_NAMES = [T('gs.trifid.lv1'), T('gs.trifid.lv2'), T('gs.trifid.lv3')];

  /* ---------- 3D 立方体可视化 ---------- */
  function renderCube(keyword) {
    var cube = buildCube(keyword);
    var html = '<div class="tf-cubelbl">' + T('gs.trifid.cubeLbl').replace('{k}', keyword || T('gs.trifid.none')) + '</div>';
    for (var l = 0; l < 3; l++) {
      html += '<div class="tf-layer">';
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          html += '<span class="tf-cube-cell">' + cube[l * 9 + r * 3 + c] + '</span>';
        }
        html += '<span class="tf-cube-gap"></span>';
      }
      html += '<span class="tf-layerlbl">' + T('gs.trifid.layer').replace('{n}', l + 1) + '</span></div>';
    }
    el('tf-cube').innerHTML = html;
  }

  /* ---------- 原理演示 ---------- */
  var labHtml =
    '<div class="tf-hint">' + T('gs.trifid.labHint') + '</div>' +
    '<div class="tf-row"><span class="tf-lbl">' + T('gs.trifid.keyLbl') + '</span><input id="tf-lab-key" maxlength="12" value="PARIS" aria-label="' + T('gs.trifid.keyLbl') + '"></div>' +
    '<div class="tf-row"><span class="tf-lbl">' + T('gs.trifid.plainLbl') + '</span><input id="tf-lab-in" maxlength="24" placeholder="' + T('gs.trifid.inPh') + '" aria-label="' + T('gs.trifid.plainLbl') + '"></div>' +
    '<div class="tf-info"><span>' + T('gs.trifid.cipherLbl') + '</span></div>' +
    '<div class="tf-cipher" id="tf-lab-out">——</div>' +
    '<div class="tf-math" id="tf-lab-math"></div>';

  /* ---------- 挑战 ---------- */
  var chalHtml =
    '<div class="tf-info">' +
    '  <span>' + T('gs.trifid.levelLbl') + ' <span class="stat-value" id="tf-level">1</span>/3 · <span class="stat-value" id="tf-lvname"></span></span>' +
    '  <span>' + T('gs.trifid.timeLbl') + ' <span class="stat-value" id="tf-timer">0s</span></span>' +
    '</div>' +
    '<div class="tf-hint" id="tf-hint"></div>' +
    '<div class="tf-info"><span>' + T('gs.trifid.cipherGotLbl') + '</span></div>' +
    '<div class="tf-cipher" id="tf-cipher"></div>' +
    '<div class="tf-info"><span>' + T('gs.trifid.keyStateLbl') + '</span></div>' +
    '<div class="tf-keyline" id="tf-keyline"></div>' +
    '<div class="tf-prev" id="tf-prev">——</div>' +
    '<div class="tf-row"><input id="tf-answer" maxlength="30" placeholder="' + T('gs.trifid.ansPh') + '" aria-label="' + T('gs.trifid.ansAria') + '"><button class="btn yellow" id="tf-submit">' + T('gs.trifid.submit') + '</button></div>';

  /* ---------- 每日一题 ---------- */
  var dailyHtml =
    '<div class="tf-info"><span>' + T('gs.trifid.dailyLbl') + '<span class="stat-value" id="tf-ddate"></span></span>' +
    '<span>' + T('gs.trifid.timeLbl') + ' <span class="stat-value" id="tf-dtimer">0s</span></span></div>' +
    '<div class="tf-hint" id="tf-dhint"></div>' +
    '<div class="tf-info"><span>' + T('gs.trifid.todayCipher') + '</span></div>' +
    '<div class="tf-cipher" id="tf-dcipher"></div>' +
    '<div class="tf-keyline" id="tf-dkey"></div>' +
    '<div class="tf-prev" id="tf-dprev"></div>' +
    '<div class="tf-row"><input id="tf-danswer" maxlength="30" placeholder="' + T('gs.trifid.ansPh') + '" aria-label="' + T('gs.trifid.ansAria') + '"><button class="btn yellow" id="tf-dgo">' + T('gs.trifid.submit') + '</button></div>';

  var mode = 'lab';
  var bodyEl = el('tf-body');

  /* ---------- 原理演示 ---------- */
  function labBind() {
    var keyEl = el('tf-lab-key'), inEl = el('tf-lab-in');
    function run() {
      var kw = keyEl.value;
      renderCube(kw);
      var v = inEl.value.toUpperCase().replace(/[^A-Za-z]/g, '');
      if (v !== inEl.value.replace(/[^A-Za-z]/g, '')) inEl.value = v;
      if (!v) { el('tf-lab-out').textContent = '——'; el('tf-lab-math').textContent = ''; return; }
      var cube = buildCube(kw);
      var t = v.length % 3 === 0 ? v : v + 'X'.repeat(3 - v.length % 3);
      var enc = encText(kw, v);
      el('tf-lab-out').textContent = enc;
      // 坐标重排展示（第一块）
      var block = t.slice(0, 3);
      var cd = block.split('').map(function (ch) {
        var p = cube.indexOf(ch); return [Math.floor(p / 9) + 1, Math.floor(p / 3) % 3 + 1, p % 3 + 1];
      });
      var flat = [];
      for (var m = 0; m < 3; m++) for (var k = 0; k < 3; k++) flat.push(cd[k][m]); // 层、行、列 依次
      var grouped = [];
      for (var g = 0; g < 9; g += 3) grouped.push('(' + flat[g] + ',' + flat[g + 1] + ',' + flat[g + 2] + ')');
      el('tf-lab-math').innerHTML = T('gs.trifid.mathHead').replace('{n}', block) +
        block.split('').map(function (ch) { var p = cube.indexOf(ch); return ch + '(' + (Math.floor(p / 9) + 1) + ',' + (Math.floor(p / 3) % 3 + 1) + ',' + (p % 3 + 1) + ')'; }).join(' ') +
        T('gs.trifid.mathRearr') + flat.join(' ') + T('gs.trifid.mathNew') + grouped.join(' ') + T('gs.trifid.mathCipher') + enc.slice(0, 3);
    }
    keyEl.addEventListener('input', run);
    inEl.addEventListener('input', run);
    run();
  }

  /* ---------- 挑战 ---------- */
  var chal = null, chalKey = '', chalLevel = 0, chalAnswer = '';
  var timerTick = null, startTs = 0, answered = false;
  function elapsed() { return Math.round((Date.now() - startTs) / 1000); }
  function stopTimer() { if (timerTick) { clearInterval(timerTick); timerTick = null; } }
  function startTimer(id) {
    stopTimer();
    startTs = Date.now();
    timerTick = setInterval(function () {
      var t = el(id);
      if (t) t.textContent = elapsed() + 's';
    }, 500);
  }
  function win() {
    if (answered) return;
    answered = true;
    stopTimer();
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(elapsed());
    if (Arcade.ui) Arcade.ui.toast(T('gs.trifid.winToast').replace('{n}', elapsed()), 'win');
    setTimeout(function () { if (mode === 'chal') startChal(); }, 1200);
  }

  function startChal() {
    answered = false;
    if (chalLevel === 0) startTimer('tf-timer'); // 全新一轮挑战才重置计时；三关递进共享累计
    var lv = chalLevel + 1;
    chal = genChallenge(lv, mulberry32((Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0));
    chalAnswer = chal.plain;
    chalKey = chal.key;
    el('tf-level').textContent = lv + '/3';
    el('tf-lvname').textContent = LEVEL_NAMES[chalLevel];
    el('tf-cipher').textContent = chal.cipher;
    el('tf-answer').value = '';
    el('tf-prev').textContent = '——';
    el('tf-prev').style.color = '';
    var hint = T('gs.trifid.chalHintHead').replace('{n}', lv) + (lv === 1 ? T('gs.trifid.chalHint1') :
      lv === 2 ? T('gs.trifid.chalHint2') : T('gs.trifid.chalHint3'));
    el('tf-hint').textContent = '💡 ' + hint;
    renderChalKey(lv);
    // L2/L3 不渲染立方体（防止完整密钥被立方体直接泄露）；L1 密钥已知可展示
    if (lv === 1) renderCube(chalKey);
    else {
      var cubeBox = el('tf-cube');
      if (cubeBox) cubeBox.innerHTML = '<div class="tf-cube-note">' + T('gs.trifid.cubeHidden') + '</div>';
    }
  }

  function renderChalKey(lv) {
    var line = el('tf-keyline');
    line.innerHTML = '';
    if (lv === 1) {
      line.innerHTML = T('gs.trifid.keyColon') + '<b>' + chalKey + '</b> <button class="btn green tf-dec" id="tf-dec">' + T('gs.trifid.decBtn') + '</button>';
      el('tf-dec').addEventListener('click', function () {
        var dec = decText(chalKey, chal.cipher);
        el('tf-prev').textContent = '🔓 ' + dec;
        el('tf-prev').style.color = 'var(--neon-green)';
        if (Arcade.audio) Arcade.audio.play('ui');
      });
    } else if (lv === 2) {
      var pos = chal.mask[0];
      var shown = chalKey.slice(0, pos) + '?' + chalKey.slice(pos + 1);
      line.innerHTML = T('gs.trifid.partKey').replace('{a}', shown).replace('{b}', pos + 1) + '<br><span class="tf-cands" id="tf-cands"></span>';
      var cands = el('tf-cands');
      for (var i = 0; i < 26; i++) {
        var b = document.createElement('button');
        b.className = 'tf-cand';
        b.textContent = A[i];
        b.addEventListener('click', function () {
          var letter = this.textContent;
          chalKey = chalKey.slice(0, pos) + letter + chalKey.slice(pos + 1);
          var dec = decText(chalKey, chal.cipher);
          var sc = readScore(dec);
          el('tf-prev').textContent = T('gs.trifid.preview2').replace('{a}', chalKey).replace('{b}', dec).replace('{c}', sc);
          el('tf-prev').style.color = sc > 55 ? 'var(--neon-green)' : '';
          if (chalKey === chal.key) { if (Arcade.juice) Arcade.juice.select(); }
          if (Arcade.audio) Arcade.audio.play('move');
        });
        cands.appendChild(b);
      }
    } else {
      line.innerHTML = T('gs.trifid.shuffledKey').replace('{n}', chal.mask) + '<br><span class="tf-slots" id="tf-slots"></span><span class="tf-cands" id="tf-cands2"></span>';
      var slots = el('tf-slots');
      var keys2 = [];
      for (var s = 0; s < chal.key.length; s++) {
        var slot = document.createElement('button');
        slot.className = 'tf-slot';
        slot.textContent = '_';
        slot.dataset.i = s;
        slot.addEventListener('click', function () {
          var i = parseInt(this.dataset.i, 10);
          keys2[i] = undefined;
          this.textContent = '_';
          chalKey = keys2.map(function (x) { return x || '_'; }).join('');
          updateL3();
          if (Arcade.audio) Arcade.audio.play('ui');
        });
        slots.appendChild(slot);
      }
      var cands2 = el('tf-cands2');
      for (var j = 0; j < 26; j++) {
        var b2 = document.createElement('button');
        b2.className = 'tf-cand';
        b2.textContent = A[j];
        b2.addEventListener('click', function () {
          var letter = this.textContent;
          var idx = -1;
          for (var q = 0; q < keys2.length; q++) if (keys2[q] === undefined) { idx = q; break; }
          if (idx < 0) return;
          keys2[idx] = letter;
          slots[idx].textContent = letter;
          chalKey = keys2.map(function (x) { return x || '_'; }).join('');
          updateL3();
          if (Arcade.audio) Arcade.audio.play('move');
        });
        cands2.appendChild(b2);
      }
      function updateL3() {
        if (chalKey.indexOf('_') >= 0) { el('tf-prev').textContent = '——'; el('tf-prev').style.color = ''; return; }
        renderCube(chalKey);
        var dec = decText(chalKey, chal.cipher);
        var sc = readScore(dec);
        el('tf-prev').textContent = T('gs.trifid.preview3').replace('{a}', chalKey).replace('{b}', dec).replace('{c}', sc);
        el('tf-prev').style.color = sc > 55 ? 'var(--neon-green)' : '';
        if (chalKey === chal.key) { if (Arcade.juice) Arcade.juice.select(); }
      }
    }
  }

  function chalBind() {
    el('tf-submit').addEventListener('click', function () {
      if (answered) return;
      var v = el('tf-answer').value.toUpperCase().replace(/[^A-Z]/g, '');
      var target = chalAnswer.replace(/ /g, '');
      if (!v) { if (Arcade.ui) Arcade.ui.toast(T('gs.trifid.noInput'), 'warn'); return; }
      if (v === target) {
        if (chalLevel < 2) {
          chalLevel++;
          startChal();
        } else {
          win();
          chalLevel = 0;
        }
      } else {
        if (Arcade.ui) Arcade.ui.toast(T('gs.trifid.wrongTry'), 'warn');
        if (Arcade.audio) Arcade.audio.play('error');
      }
    });
    el('tf-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') el('tf-submit').click(); });
  }

  /* ---------- 每日一题 ---------- */
  var daily = { key: '', plain: '', cipher: '' };
  var dailyAnswered = false;
  function dailyBind() {
    el('tf-dgo').addEventListener('click', function () {
      if (dailyAnswered) { if (Arcade.ui) Arcade.ui.toast(T('gs.trifid.dailyDone'), 'warn'); return; }
      var v = el('tf-danswer').value.toUpperCase().replace(/[^A-Z]/g, '');
      if (!v) { if (Arcade.ui) Arcade.ui.toast(T('gs.trifid.noInput'), 'warn'); return; }
      if (v === daily.plain) {
        dailyAnswered = true;
        stopTimer();
        if (Arcade.juice) Arcade.juice.win();
        if (Arcade.shell) Arcade.shell.submitScore(elapsed());
        if (Arcade.daily) Arcade.daily.markSolved('trifid', elapsed());
        el('tf-dprev').textContent = T('gs.trifid.dailyWin').replace('{n}', elapsed());
        el('tf-dprev').style.color = 'var(--neon-green)';
      } else {
        el('tf-dprev').textContent = T('gs.trifid.dailyWrong');
        el('tf-dprev').style.color = 'var(--neon-pink)';
        if (Arcade.audio) Arcade.audio.play('error');
      }
    });
    el('tf-danswer').addEventListener('keydown', function (e) { if (e.key === 'Enter') el('tf-dgo').click(); });
  }
  function startDaily() {
    dailyAnswered = false;
    daily = genDaily(mulberry32(TFCORE.todaySeed()));
    var d2 = new Date();
    el('tf-ddate').textContent = d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate();
    el('tf-dhint').textContent = T('gs.trifid.dailyHint').replace('{a}', daily.key[0]).replace('{b}', daily.plain.length);
    el('tf-dcipher').textContent = daily.cipher;
    el('tf-dkey').textContent = T('gs.trifid.keyColon') + '<b>' + daily.key.replace(/./g, '?') + '</b>';
    var cubeBox = el('tf-cube');
    if (cubeBox) cubeBox.innerHTML = '<div class="tf-cube-note">' + T('gs.trifid.cubeHidden') + '</div>';
    el('tf-danswer').value = '';
    el('tf-dprev').textContent = '——';
    el('tf-dprev').style.color = '';
    startTimer('tf-dtimer');
  }

  /* ---------- 模式切换 ---------- */
  function setMode(m) {
    mode = m;
    stopTimer();
    var tabs = root.querySelectorAll('.tf-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('selected', tabs[i].getAttribute('data-mode') === m);
    if (m === 'lab') {
      bodyEl.innerHTML = labHtml;
      labBind();
    } else if (m === 'chal') {
      bodyEl.innerHTML = chalHtml;
      chalBind();
      chalLevel = 0;
      startChal();
      startTimer('tf-timer'); // 三关共享累计计时
    } else {
      bodyEl.innerHTML = dailyHtml;
      dailyBind();
      startDaily();
    }
  }

  var tabs = root.querySelectorAll('.tf-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      if (Arcade.audio) Arcade.audio.play('ui');
      setMode(this.getAttribute('data-mode'));
    });
  }

  // 初始化（默认进入挑战模式，与其他破译机一致；重开保留当前模式）
  setMode('chal');

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.trifid.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    stopTimer();
    setMode(mode === 'lab' ? 'lab' : mode);
  };


})();
