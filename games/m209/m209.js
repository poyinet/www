/* ============================================================
   M-209 转轮密码机（美海军 C-38 Hagelin，1942，产量 14 万台）
   全网独家：真实 M-209 结构——6 个可动轮（齿数 26/25/23/21/19/17）+ 每轮 0-2 凸轮 +
   密钥字母 = 轮位字母和 + 被顶起凸轮数（模 26）；每字符全轮步进，周期约 1 亿。
   破译玩法：已知明文攻击（KPA）——明文+密文相减得密钥流，反推轮位；
   第 3 关用「中途相遇(MITM)」机器扫描（Colossus 式搜索）。
   核心逻辑用 ==M209-CORE-START== / ==M209-CORE-END== 标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==M209-CORE-START== */
  var M_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var M_WHEELS = [26, 25, 23, 21, 19, 17];

  function M_mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function M_pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }

  /** 随机凸轮设置：每轮 0-2 个不重复凸轮（真实 M-209 配置） */
  function M_genCams(rnd) {
    var cams = [];
    for (var w = 0; w < 6; w++) {
      var n = M_WHEELS[w];
      var k = Math.floor(rnd() * 3); // 0-2 凸轮
      var pool = [];
      for (var i = 0; i < n; i++) pool.push(i);
      for (var j = 0; j < n; j++) { var r = Math.floor(rnd() * n); var t = pool[j]; pool[j] = pool[r]; pool[r] = t; }
      cams.push(pool.slice(0, k).sort(function (a, b) { return a - b; }));
    }
    return cams;
  }

  /** 单轮贡献：当前轮位字母值 + 凸轮是否顶起（0 或 1） */
  function M_contrib(w, pos, cams) {
    var v = pos; // 轮位字母值（简化：0 起）
    var act = cams[w].indexOf(pos) >= 0 ? 1 : 0;
    return v + act;
  }

  /** 生成密钥流（含步进）：返回数组长度 len；pos 被推进（副本） */
  function M_streamFull(pos, cams, len) {
    var ks = [], p = pos.slice();
    for (var i = 0; i < len; i++) {
      var sum = 0;
      for (var w = 0; w < 6; w++) sum += M_contrib(w, p[w], cams);
      ks.push(sum % 26);
      for (var w2 = 0; w2 < 6; w2++) p[w2] = (p[w2] + 1) % M_WHEELS[w2];
    }
    return ks;
  }

  /** 只算指定轮（wheelIdx 数组）的贡献流——供 MITM 分治 */
  function M_streamSub(pos, cams, len, wheelIdx) {
    var ks = [], p = pos.slice();
    for (var i = 0; i < len; i++) {
      var sum = 0;
      for (var k = 0; k < wheelIdx.length; k++) {
        var w = wheelIdx[k];
        sum += M_contrib(w, p[w], cams);
      }
      ks.push(sum % 26);
      for (var w2 = 0; w2 < 6; w2++) p[w2] = (p[w2] + 1) % M_WHEELS[w2];
    }
    return ks;
  }

  /** 加密：明文（A-Z+空格，空格不加密保留）→ 密文；pos 推进 */
  function M_encrypt(text, pos, cams) {
    var ks = M_streamFull(pos, cams, text.replace(/ /g, '').length);
    var out = '', ki = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += ' '; continue; }
      var p = M_ALPHA.indexOf(ch);
      if (p < 0) continue;
      out += M_ALPHA[(p + ks[ki++]) % 26];
    }
    return out;
  }
  /** 解密：密文 → 明文 */
  function M_decrypt(text, pos, cams) {
    var ks = M_streamFull(pos, cams, text.replace(/ /g, '').length);
    var out = '', ki = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += ' '; continue; }
      var c = M_ALPHA.indexOf(ch);
      if (c < 0) continue;
      out += M_ALPHA[(c - ks[ki++] + 26) % 26];
    }
    return out;
  }

  /** 轮位猜测与目标密钥流的匹配字符数 */
  function M_matchCount(posGuess, cams, target) {
    var ks = M_streamFull(posGuess, cams, target.length);
    var m = 0;
    for (var i = 0; i < target.length; i++) if (ks[i] === target[i]) m++;
    return m;
  }

  /* ---------- 挑战生成 ---------- */
  var M_PLAINS = [
    'THE FLEET LEAVES THE HARBOR TONIGHT',
    'CONVOY ESCORT RENDEZVOUS AT NOON',
    'AIR RAID WARNING EFFECTIVE MIDNIGHT',
    'SUPPLY SHIP REACHES THE ISLAND',
    'ENEMY BATTLESHIP SIGHTED SOUTH',
    'CODE BOOK DESTROYED BEFORE CAPTURE',
    'RADIO FREQUENCY CHANGED TO FIFTY',
    'ALL SUBMARINES PROCEED TO SECTOR',
    'SECRET OPERATION BEGINS TOMORROW',
    'REINFORCEMENTS ARRIVE BY SEA',
    'BOMBER SQUADRON READY FOR TAKEOFF',
    'PASSWORD VALID UNTIL FURTHER NOTICE'
  ];

  /* 生成一关：{ level, cipher, knownPos, unknownPos, cams, pos, plain, target }
     level 1：未知轮 0-1（650 组合）；level 2：未知轮 0-3；level 3：全部未知（MITM） */
  function M_genChallenge(level, seed) {
    var rnd = M_mulberry32(seed || (Date.now() % 2147483647));
    var cams = M_genCams(rnd);
    var pos = [];
    for (var i = 0; i < 6; i++) pos.push(Math.floor(rnd() * M_WHEELS[i]));
    var plain = '';
    if (level === 1) plain = M_pick(rnd, M_PLAINS).slice(0, 22);
    else if (level === 2) plain = (M_pick(rnd, M_PLAINS) + ' ' + M_pick(rnd, M_PLAINS)).slice(0, 32);
    else plain = (M_pick(rnd, M_PLAINS) + ' ' + M_pick(rnd, M_PLAINS)).slice(0, 36);
    var cipher = M_encrypt(plain, pos.slice(), cams);
    // 密钥流 = KPA 提取（明文+密文相减）
    var ps = plain.replace(/ /g, ''), cs = cipher.replace(/ /g, '');
    var target = [];
    for (var k = 0; k < ps.length; k++) target.push((M_ALPHA.indexOf(cs[k]) - M_ALPHA.indexOf(ps[k]) + 26) % 26);
    var knownPos = null, unknownPos = null;
    if (level === 1) { knownPos = [2, 3, 4, 5]; unknownPos = [0, 1]; }
    else if (level === 2) { knownPos = [4, 5]; unknownPos = [0, 1, 2, 3]; }
    else { knownPos = []; unknownPos = [0, 1, 2, 3, 4, 5]; }
    return { level: level, cipher: cipher, knownPos: knownPos, unknownPos: unknownPos, cams: cams, pos: pos, plain: plain, target: target };
  }

  /** MITM 扫描（L3 提示用）：拆 轮0-2 / 轮3-5，索引匹配 top3 */
  function M_mitm(cams, target, posCorrect) {
    var L = target.length;
    var W0 = M_WHEELS[0], W1 = M_WHEELS[1], W2 = M_WHEELS[2];
    var table = {};
    for (var a0 = 0; a0 < W0; a0++)
      for (var a1 = 0; a1 < W1; a1++)
        for (var a2 = 0; a2 < W2; a2++) {
          var posA = [a0, a1, a2, 0, 0, 0];
          var ksA = M_streamSub(posA, cams, L, [0, 1, 2]);
          var key = ksA[0] + ',' + ksA[1] + ',' + ksA[2] + ',' + ksA[3];
          var rec = { p: [a0, a1, a2], ks: ksA };
          if (!table[key]) table[key] = [];
          table[key].push(rec);
        }
    var scored = [];
    for (var b0 = 0; b0 < M_WHEELS[3]; b0++)
      for (var b1 = 0; b1 < M_WHEELS[4]; b1++)
        for (var b2 = 0; b2 < M_WHEELS[5]; b2++) {
          var posB = [0, 0, 0, b0, b1, b2];
          var ksB = M_streamSub(posB, cams, L, [3, 4, 5]);
          var key = ((target[0] - ksB[0] + 26) % 26) + ',' + ((target[1] - ksB[1] + 26) % 26) + ',' + ((target[2] - ksB[2] + 26) % 26) + ',' + ((target[3] - ksB[3] + 26) % 26);
          var hits = table[key];
          if (!hits) continue;
          for (var h = 0; h < hits.length; h++) {
            var rec = hits[h];
            var m = 0;
            for (var i = 4; i < L; i++) {
              if ((rec.ks[i] + ksB[i]) % 26 === target[i]) m++;
            }
            scored.push({ p: rec.p.concat([b0, b1, b2]), m: m + 4, corr: rec.p[0] === posCorrect[0] && rec.p[1] === posCorrect[1] && rec.p[2] === posCorrect[2] && b0 === posCorrect[3] && b1 === posCorrect[4] && b2 === posCorrect[5] });
          }
        }
    scored.sort(function (x, y) { return y.m - x.m; });
    return scored.slice(0, 5);
  }
  /* ==M209-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  /* 显示层翻译辅助：轮标签展示走 gs.m209.wheelN 译键（A5 清除硬编码死数据） */
  function wheelName(i) { return T('gs.m209.wheel' + i); }

  var LEVEL_INFO = [
    { t: T('gs.m209.lv1t'), d: T('gs.m209.lv1d') },
    { t: T('gs.m209.lv2t'), d: T('gs.m209.lv2d') },
    { t: T('gs.m209.lv3t'), d: T('gs.m209.lv3d') }
  ];

  root.innerHTML =
    '<div class="m9-wrap">' +
    '  <div class="m9-tabs">' +
    '    <button class="btn mode-btn" id="m9-tab-demo">' + T('gs.m209.tabDemo') + '</button>' +
    '    <button class="btn mode-btn selected" id="m9-tab-chal">' + T('gs.m209.tabChal') + '</button>' +
    '  </div>' +

    /* ---- 演示 ---- */
    '  <div id="m9-demo" style="display:none">' +
    '    <div class="m9-flavor">' + T('gs.m209.demoFlavor') + '</div>' +
    '    <div class="m9-wheels" id="m9-wheels"></div>' +
    '    <div class="m9-cams" id="m9-cams"></div>' +
    '    <div class="m9-lbl">' + T('gs.m209.plainLbl') + '</div>' +
    '    <input class="m9-in" id="m9-in" maxlength="80" value="THE FLEET LEAVES TONIGHT" autocomplete="off">' +
    '    <div class="m9-row">' +
    '      <button class="btn" id="m9-enc">' + T('gs.m209.enc') + '</button>' +
    '      <button class="btn" id="m9-dec">' + T('gs.m209.dec') + '</button>' +
    '    </div>' +
    '    <div class="m9-out" id="m9-out"></div>' +
    '  </div>' +

    /* ---- 挑战 ---- */
    '  <div id="m9-chal">' +
    '    <div class="m9-info"><span id="m9-lev"></span><span id="m9-timer">0s</span></div>' +
    '    <div class="m9-flavor" id="m9-brief"></div>' +
    '    <div class="m9-lbl">' + T('gs.m209.cipherLbl') + '</div>' +
    '    <div class="m9-cipher" id="m9-cipher"></div>' +
    '    <div class="m9-lbl">' + T('gs.m209.ksLbl') + '</div>' +
    '    <div class="m9-ks" id="m9-ks"></div>' +
    '    <div class="m9-lbl" id="m9-know"></div>' +
    '    <div id="m9-op"></div>' +
    '    <div class="m9-match"><span>' + T('gs.m209.match') + '</span><div class="progress-bar slim"><i id="m9-mbar" style="width:0%"></i></div><b id="m9-mnum">0/0</b></div>' +
    '    <div class="m9-row">' +
    '      <button class="btn" id="m9-hint">' + T('gs.m209.hint') + '</button>' +
    '      <button class="btn" id="m9-submit">' + T('gs.m209.submit') + '</button>' +
    '    </div>' +
    '    <div class="m9-msg" id="m9-msg"></div>' +
    '  </div>' +
    '  <div class="m9-overlay hidden" id="m9-overlay">' +
    '    <h2 id="m9-ov-title"></h2>' +
    '    <p id="m9-ov-text"></p>' +
    '    <button class="btn" id="m9-ov-btn"></button>' +
    '  </div>' +
    '</div>';

  var tabDemo = document.getElementById('m9-tab-demo');
  var tabChal = document.getElementById('m9-tab-chal');
  var demoEl = document.getElementById('m9-demo');
  var chalEl = document.getElementById('m9-chal');
  function showTab(which) {
    demoEl.style.display = which === 'demo' ? '' : 'none';
    chalEl.style.display = which === 'chal' ? '' : 'none';
    tabDemo.classList.toggle('selected', which === 'demo');
    tabChal.classList.toggle('selected', which === 'chal');
    Arcade.audio && Arcade.audio.play('ui');
  }
  tabDemo.addEventListener('click', function () { showTab('demo'); });
  tabChal.addEventListener('click', function () { showTab('chal'); });

  /* ---------- 演示 ---------- */
  var demoPos = [0, 0, 0, 0, 0, 0];
  var demoCams = [[0], [1], [], [0, 2], [], [1]];
  var wheelsBox = document.getElementById('m9-wheels');
  for (var w = 0; w < 6; w++) {
    (function (wi) {
      var cell = document.createElement('div');
      cell.className = 'm9-wheel';
      cell.innerHTML =
        '<div class="m9-wname">' + wheelName(wi) + '</div>' +
        '<div class="m9-wpos" id="m9-dpos-' + wi + '">A</div>' +
        '<button class="btn m9-wbtn" id="m9-ddec-' + wi + '">◀</button>' +
        '<button class="btn m9-wbtn" id="m9-dinc-' + wi + '">▶</button>';
      wheelsBox.appendChild(cell);
      document.getElementById('m9-ddec-' + wi).addEventListener('click', function () {
        demoPos[wi] = (demoPos[wi] - 1 + M_WHEELS[wi]) % M_WHEELS[wi];
        paintDemo();
      });
      document.getElementById('m9-dinc-' + wi).addEventListener('click', function () {
        demoPos[wi] = (demoPos[wi] + 1) % M_WHEELS[wi];
        paintDemo();
      });
    })(w);
  }
  var camsEl = document.getElementById('m9-cams');
  function paintDemo() {
    for (var w = 0; w < 6; w++) document.getElementById('m9-dpos-' + w).textContent = M_ALPHA[demoPos[w]];
    camsEl.innerHTML = T('gs.m209.cams') + demoCams.map(function (c, i) { return wheelName(i) + '[' + c.map(function (x) { return M_ALPHA[x]; }).join('') + ']'; }).join(' ');
  }
  var outEl = document.getElementById('m9-out');
  document.getElementById('m9-enc').addEventListener('click', function () {
    var v = document.getElementById('m9-in').value.toUpperCase();
    outEl.textContent = M_encrypt(v, demoPos.slice(), demoCams);
    paintDemo();
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  document.getElementById('m9-dec').addEventListener('click', function () {
    var v = document.getElementById('m9-in').value.toUpperCase();
    outEl.textContent = M_decrypt(v, demoPos.slice(), demoCams);
    paintDemo();
    if (Arcade.audio) Arcade.audio.play('coin');
  });
  paintDemo();

  /* ---------- 挑战 ---------- */
  var chal = null;
  var chalStart = 0, totalMs = 0, levelIdx = 0;
  var timerTick = null;
  var levEl = document.getElementById('m9-lev');
  var timerEl = document.getElementById('m9-timer');
  var briefEl = document.getElementById('m9-brief');
  var cipherEl = document.getElementById('m9-cipher');
  var ksEl = document.getElementById('m9-ks');
  var knowEl = document.getElementById('m9-know');
  var opEl = document.getElementById('m9-op');
  var mbar = document.getElementById('m9-mbar');
  var mnum = document.getElementById('m9-mnum');
  var msgEl = document.getElementById('m9-msg');
  var overlayEl = document.getElementById('m9-overlay');
  var ovTitle = document.getElementById('m9-ov-title');
  var ovText = document.getElementById('m9-ov-text');
  var ovBtn = document.getElementById('m9-ov-btn');

  var playPos = [0, 0, 0, 0, 0, 0];

  function refreshMatch() {
    var m = M_matchCount(playPos, chal.cams, chal.target);
    mbar.style.width = Math.round(m / chal.target.length * 100) + '%';
    mnum.textContent = m + '/' + chal.target.length;
    return m;
  }

  /* 未知轮步进器（已知轮只读显示） */
  function buildOps() {
    opEl.innerHTML = '';
    chal.unknownPos.forEach(function (wi, k) {
      playPos[wi] = 0;
      var row = document.createElement('div');
      row.className = 'm9-posrow';
      row.innerHTML =
        '<span class="m9-plbl">' + wheelName(wi) + '</span>' +
        '<button class="btn m9-wbtn" data-k="' + k + '" data-d="-1">◀</button>' +
        '<b class="m9-pval" id="m9-pv-' + wi + '">' + M_ALPHA[playPos[wi]] + '</b>' +
        '<button class="btn m9-wbtn" data-k="' + k + '" data-d="1">▶</button>';
      opEl.appendChild(row);
    });
    chal.knownPos.forEach(function (wi, k) {
      playPos[wi] = chal.pos[wi];
      var row = document.createElement('div');
      row.className = 'm9-posrow known';
      row.innerHTML = '<span class="m9-plbl">' + wheelName(wi) + '</span><b class="m9-pval">' + M_ALPHA[chal.pos[wi]] + '</b><span class="m9-ok">' + T('gs.m209.known') + '</span>';
      opEl.appendChild(row);
    });
    var bs = opEl.querySelectorAll('button[data-k]');
    for (var i = 0; i < bs.length; i++) {
      bs[i].addEventListener('click', function () {
        var k = parseInt(this.dataset.k, 10), d = parseInt(this.dataset.d, 10);
        var wi = chal.unknownPos[k];
        playPos[wi] = (playPos[wi] + d + M_WHEELS[wi]) % M_WHEELS[wi];
        document.getElementById('m9-pv-' + wi).textContent = M_ALPHA[playPos[wi]];
        refreshMatch();
        if (Arcade.audio) Arcade.audio.play('ui');
      });
    }
  }

  /* 提示：机器扫描（L2 31 万组分片异步，防低端机长时间阻塞） */
  function doHint() {
    var t0 = Date.now();
    var hintTxt = '';
    if (chal.level === 1) {
      var best = [];
      for (var a = 0; a < 26; a++)
        for (var b = 0; b < 25; b++) {
          var full = [a, b].concat(chal.knownPos.map(function (x) { return chal.pos[x]; }));
          best.push({ p: [a, b], m: M_matchCount(full, chal.cams, chal.target) });
        }
      best.sort(function (x, y) { return y.m - x.m; });
      hintTxt = T('gs.m209.hint1').replace('{n}', best.slice(0, 3).map(function (x) { return M_ALPHA[x.p[0]] + M_ALPHA[x.p[1]]; }).join(' / '));
      msgEl.textContent = '💡 ' + hintTxt + T('gs.m209.scanF').replace('{n}', Date.now() - t0);
    } else if (chal.level === 2) {
      // 26×25×23×21 ≈ 31 万组，分 8 片 setTimeout 计算，避免一次性阻塞主线程
      var best2 = [];
      var known = chal.knownPos.map(function (x) { return chal.pos[x]; });
      var DIMS = [26, 25, 23, 21];
      var total = DIMS[0] * DIMS[1] * DIMS[2] * DIMS[3];
      var chunk = 0, CHUNKS = 8;
      msgEl.textContent = T('gs.m209.scanning');
      function sliceCalc() {
        var start = Math.floor(chunk / CHUNKS * total);
        var end = Math.floor((chunk + 1) / CHUNKS * total);
        for (var idx = start; idx < end; idx++) {
          var r0 = idx;
          var a = r0 % DIMS[0]; r0 = Math.floor(r0 / DIMS[0]);
          var b = r0 % DIMS[1]; r0 = Math.floor(r0 / DIMS[1]);
          var c = r0 % DIMS[2];
          var d = Math.floor(r0 / DIMS[2]);
          var full2 = [a, b, c, d].concat(known);
          best2.push({ p: [a, b, c, d], m: M_matchCount(full2, chal.cams, chal.target) });
        }
        chunk++;
        if (chunk < CHUNKS) { setTimeout(sliceCalc, 0); return; }
        best2.sort(function (x, y) { return y.m - x.m; });
        hintTxt = T('gs.m209.hint1').replace('{n}', best2.slice(0, 3).map(function (x) { return x.p.map(function (v) { return M_ALPHA[v]; }).join(''); }).join(' / '));
        msgEl.textContent = '💡 ' + hintTxt + T('gs.m209.scanF').replace('{n}', Date.now() - t0);
        if (Arcade.audio) Arcade.audio.play('coin');
      }
      sliceCalc();
      return;
    } else {
      var res = M_mitm(chal.cams, chal.target, chal.pos);
      hintTxt = T('gs.m209.hintMitm') + res.slice(0, 3).map(function (r) { return r.p.map(function (v) { return M_ALPHA[v]; }).join('') + T('gs.m209.matchF').replace('{n}', r.m); }).join(' / ');
      msgEl.textContent = '💡 ' + hintTxt + T('gs.m209.scanF').replace('{n}', Date.now() - t0);
    }
    if (Arcade.audio) Arcade.audio.play('coin');
  }

  function startLevel() {
    chalStart = Date.now(); // 每关起算（totalMs 跨关累计）
    chal = M_genChallenge(levelIdx + 1);
    levEl.textContent = LEVEL_INFO[levelIdx].t + ' · ' + T('gs.m209.levelF').replace('{a}', levelIdx + 1).replace('{b}', 3);
    briefEl.textContent = LEVEL_INFO[levelIdx].d;
    cipherEl.textContent = chal.cipher;
    ksEl.textContent = chal.target.map(function (v) { return M_ALPHA[v]; }).join(' ');
    var camsTxt = chal.cams.map(function (c, i) { return wheelName(i) + '[' + c.map(function (x) { return M_ALPHA[x]; }).join('') + ']'; }).join(' ');
    knowEl.textContent = T('gs.m209.camsKnown') + camsTxt + (chal.unknownPos.length ? T('gs.m209.adjHint') : '');
    buildOps();
    mbar.style.width = '0%';
    mnum.textContent = '0/' + chal.target.length;
    msgEl.textContent = '';
    refreshMatch();
  }

  var finished = false;
  document.getElementById('m9-hint').addEventListener('click', doHint);
  document.getElementById('m9-submit').addEventListener('click', function () {
    if (!chal || finished) return;
    var m = refreshMatch();
    if (m === chal.target.length) { winLevel(); }
    else {
      msgEl.textContent = T('gs.m209.miss').replace('{a}', m).replace('{b}', chal.target.length);
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  function winLevel() {
    totalMs += Date.now() - chalStart;
    if (Arcade.juice) Arcade.juice.win();
    if (levelIdx < 2) {
      levelIdx++;
      startLevel();
      if (Arcade.ui) Arcade.ui.toast(T('gs.m209.toastWin').replace('{n}', levelIdx + 1), 'win');
    } else {
      finished = true;
      ovTitle.textContent = T('gs.m209.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.m209.winD').replace('{t}', totalSec());
      ovBtn.textContent = T('gs.m209.again');
      ovBtn.onclick = function () {
        finished = false;
        levelIdx = 0; totalMs = 0;
        overlayEl.classList.add('hidden');
        resetClock();
        startLevel();
      };
      overlayEl.classList.remove('hidden');
      if (Arcade.shell) Arcade.shell.submitScore(totalSec());
    }
  }

  function totalSec() { return Math.round(totalMs / 1000); }

  function resetClock() {
    totalMs = 0;
    if (timerTick) clearInterval(timerTick);
    chalStart = Date.now();
    timerTick = setInterval(function () {
      timerEl.textContent = Math.round((Date.now() - chalStart + totalMs) / 1000) + 's';
    }, 500);
  }

    /* helpText */
  var hd = document.createElement('div');
  hd.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  hd.textContent = T('gs.m209.helpText');
  root.appendChild(hd);

  window.GAME_RESTART = function () {
    finished = false;
    levelIdx = 0; totalMs = 0;
    overlayEl.classList.add('hidden');
    resetClock();
    startLevel();
  };

  showTab('chal');
  resetClock();
  startLevel();

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.m209.tut1t'), d: T('gs.m209.tut1') },
    { t: T('gs.m209.tut2t'), d: T('gs.m209.tut2') },
    { t: T('gs.m209.tut3t'), d: T('gs.m209.tut3') },
    { t: T('gs.m209.tut4t'), d: T('gs.m209.tut4') }
  ];

})();
