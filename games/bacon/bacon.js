/* ============================================================
   培根密码机（Bacon's Cipher）· 全网独家：双字体隐写术教学 + 破译挑战
   弗朗西斯·培根 1605 年发明：26 字母 → 5 位 A/B 序列（A=正常字, B=加粗字），
   把秘密电文藏进「看似普通的英文文本」的字体粗细里。
   三模式：原理演示（即时编码）/ 破译挑战（识别伪装文本中的加粗字符 → 还原电文）/ 自由破译
   核心逻辑用 BACON-CORE 区段标记包裹，供 Node harness 提取。
   ============================================================ */

(function () {
  /* ==BACON-CORE-START== */

  /** 26 字母 → 5 位 A/B 编码（A=0, B=1；a→AAAAA, b→AAAAB, …, z→ABBAB(11001)） */
  function B_bitsOf(ch) {
    var c = ch.toUpperCase().charCodeAt(0) - 65;
    if (c < 0 || c > 25) return null;
    var out = '', v = c;
    for (var i = 4; i >= 0; i--) { out += (v & (1 << i)) ? 'B' : 'A'; }
    return out;
  }

  /** 5 位 A/B → 字母（无效码 26-31 返回 '?'） */
  function B_charOf(bits) {
    var v = 0;
    for (var i = 0; i < 5; i++) { v = (v << 1) | (bits.charAt(i) === 'B' ? 1 : 0); }
    return v < 26 ? String.fromCharCode(65 + v) : '?';
  }

  /** 明文 → 完整 A/B 位串（字母转码，其余字符跳过） */
  function B_encode(plain) {
    var out = '';
    for (var i = 0; i < plain.length; i++) {
      var b = B_bitsOf(plain.charAt(i));
      if (b) out += b;
    }
    return out;
  }

  /** A/B 位串 → 明文（每 5 位一组解码） */
  function B_decode(bitsStr) {
    var out = '', s = bitsStr.replace(/[^AB]/g, '');
    for (var i = 0; i + 5 <= s.length; i += 5) out += B_charOf(s.substring(i, i + 5));
    return out;
  }

  /** 生成伪装文本：把 bits 依次植入 sentence 的前缀字符（B=加粗），返回 {text, bold:Set} */
  function B_plant(bits, sentence) {
    // 句子必须足够长容纳所有位；不足时补 'X'（占位填充，不携带信息）
    var text = sentence;
    if (text.length < bits.length) text = text + ' X'.repeat(Math.ceil((bits.length - text.length) / 2));
    if (text.length < bits.length) text = text + 'X'.repeat(bits.length - text.length);
    var bold = {};
    var n = Math.min(bits.length, text.length);
    for (var i = 0; i < n; i++) {
      if (bits.charAt(i) === 'B') bold[i] = true;
    }
    return { text: text, bold: bold, bits: bits };
  }

  /** 从伪装文本提取标记位串（boldMap: {idx:bool}）→ A/B 串 */
  function B_extract(boldMap, len) {
    var out = '';
    for (var i = 0; i < len; i++) out += boldMap[i] ? 'B' : 'A';
    return out;
  }

  /* ==BACON-CORE-END== */

  /* ================= UI 层 ================= */
  var root = document.getElementById('game-root');
  if (!root) return;

  /* 伪装文本词库（生成表面正常的英文句子） */
  var WORDS = ['THE', 'CODE', 'SECRET', 'CIPHER', 'FIELD', 'AGENT', 'REPORT', 'NIGHT', 'TROOP', 'RIVER',
    'CASTLE', 'WATCH', 'SIGNAL', 'TRAIN', 'ORDER', 'STORM', 'FOREST', 'HARBOR', 'LETTER', 'GUARD',
    'STATION', 'BORDER', 'MESSAGE', 'TARGET', 'DANGER', 'FLIGHT', 'COVERT', 'SHADOW', 'MORNING', 'QUIET'];

  var CHAL = [
    { n: 4, words: 4, hint: 'bc.hint1' },
    { n: 7, words: 6, hint: 'bc.hint2' },
    { n: 10, words: 8, hint: 'bc.hint3' }
  ];

  var mode = 'chal', levelIdx = 0, chal = null;
  var chalStart = 0, totalMs = 0, timerTick = null;
  var marked = {}; // idx -> true(B)
  var revealed = false;

  var rootHTML =
    '<div class="bc-wrap">' +
    '  <div class="bc-pick hidden" id="bc-pick">' +
    '    <div class="bc-pick-t">' + T('gs.bacon.pickT') + '</div>' +
    '    <div class="bc-pick-d">' + T('gs.bacon.pickD') + '</div>' +
    '    <div class="bc-pick-btns">' +
    '      <button class="btn mode-btn selected" id="bc-m-chal"><span>🎯 ' + T('gs.bacon.modeChal') + '</span><small>' + T('gs.bacon.modeChalD') + '</small></button>' +
    '      <button class="btn mode-btn" id="bc-m-demo"><span>🧪 ' + T('gs.bacon.modeDemo') + '</span><small>' + T('gs.bacon.modeDemoD') + '</small></button>' +
    '      <button class="btn mode-btn" id="bc-m-free"><span>🔓 ' + T('gs.bacon.modeFree') + '</span><small>' + T('gs.bacon.modeFreeD') + '</small></button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="bc-panel" id="bc-panel">' +
    '    <div class="bc-info">' +
    '      <span id="bc-lev"></span><span id="bc-timer">0s</span>' +
    '    </div>' +
    '    <div class="bc-flavor" id="bc-brief"></div>' +
    '    <div class="bc-lbl">' + T('gs.bacon.lblCipher') + '</div>' +
    '    <div class="bc-cipher" id="bc-cipher"></div>' +
    '    <div class="bc-key">' +
    '      <span class="k pl">A</span><span>' + T('gs.bacon.keyPlain') + '</span>' +
    '      <span class="k bd">B</span><span>' + T('gs.bacon.keyBold') + '</span>' +
    '    </div>' +
    '    <div class="bc-lbl">' + T('gs.bacon.lblBits') + '</div>' +
    '    <div class="bc-bits" id="bc-bits"></div>' +
    '    <div class="bc-msg" id="bc-msg"></div>' +
    '    <div class="bc-controls">' +
    '      <button class="btn" id="bc-hint">💡 ' + T('gs.bacon.hintBtn') + '</button>' +
    '      <button class="btn green" id="bc-check">✅ ' + T('gs.bacon.check') + '</button>' +
    '      <button class="btn" id="bc-clear">↺ ' + T('gs.bacon.clear') + '</button>' +
    '      <button class="btn yellow" id="bc-daily">📅 ' + T('gs.bacon.dailyBtn') + '</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="bc-overlay hidden" id="bc-overlay" style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(5,5,12,0.85)">' +
    '    <div class="card" style="max-width:400px;text-align:center;padding:26px">' +
    '      <h2 id="bc-ov-title"></h2><p id="bc-ov-text" style="color:var(--text-dim);font-size:13px;line-height:1.8"></p>' +
    '      <button class="btn green" id="bc-ov-btn" style="margin-top:14px"></button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  root.innerHTML = rootHTML;

  var pickEl = document.getElementById('bc-pick');
  var panelEl = document.getElementById('bc-panel');
  var levEl = document.getElementById('bc-lev');
  var timerEl = document.getElementById('bc-timer');
  var briefEl = document.getElementById('bc-brief');
  var cipherEl = document.getElementById('bc-cipher');
  var bitsEl = document.getElementById('bc-bits');
  var msgEl = document.getElementById('bc-msg');
  var overlayEl = document.getElementById('bc-overlay');
  var ovTitle = document.getElementById('bc-ov-title');
  var ovText = document.getElementById('bc-ov-text');
  var ovBtn = document.getElementById('bc-ov-btn');

  /* ---------- 生成一局挑战 ---------- */
  var DIFF_WEIGHT = [700, 650, 600]; // 三关加粗强度递减：越到后面越难辨

  function genSentence(level, seed) {
    var rnd = mulberry32(seed || (Date.now() % 2147483647));
    var cfg = CHAL[level];
    var n = cfg.n, words = [];
    var used = {};
    for (var i = 0; i < cfg.words; i++) {
      var w;
      do { w = WORDS[Math.floor(rnd() * WORDS.length)]; } while (used[w]);
      used[w] = true;
      words.push(w);
    }
    return words.join(' ');
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function genChallenge(level, seed) {
    var cfg = CHAL[level];
    var plain = '', rnd = mulberry32(seed || (Date.now() % 2147483647));
    // 从词库挑 n 个词作为秘密电文（纯字母拼写，去空格）
    var words = [];
    var used = {};
    while (words.join('').length < cfg.n) {
      var w = WORDS[Math.floor(rnd() * WORDS.length)];
      if (!used[w]) { used[w] = true; words.push(w); }
      if (Object.keys(used).length >= WORDS.length) break;
    }
    plain = words.join('').substring(0, cfg.n).toUpperCase();
    var bits = B_encode(plain);
    // 句子长度至少容纳 bits；词数按 cfg.words 生成，可能短于 bits → 用 bits 长度对齐
    var sentence = genSentence(level, seed);
    while (sentence.length < bits.length) sentence += ' ' + WORDS[Math.floor(rnd() * WORDS.length)];
    return B_plant(bits, sentence);
  }

  /* ---------- 渲染伪装文本（可点击标记） ---------- */
  function renderCipher() {
    if (!chal) return;
    var html = '';
    var len = Math.min(chal.text.length, chal.bits.length);
    var bw = DIFF_WEIGHT[levelIdx] || 700;
    for (var i = 0; i < chal.text.length; i++) {
      var isB = i < len && chal.bold[i];
      var cls = 'bc-ch ' + (isB ? 'bold' : 'plain');
      var wt = isB ? 'font-weight:' + bw + ';' : 'font-weight:400;';
      if (marked[i] !== undefined) cls += ' marked';
      var tag = (marked[i] !== undefined) ? '<span class="bc-tag">' + (marked[i] ? 'B' : 'A') + '</span>' : '';
      html += '<span class="' + cls + '" style="' + wt + '" data-i="' + i + '">' + chal.text.charAt(i) + tag + '</span>';
    }
    cipherEl.innerHTML = html;
    // 点击切换标记：加粗字符点一下标记 B，普通字符点一下标记 A（默认未标记=不确定）
    var chs = cipherEl.querySelectorAll('.bc-ch');
    for (var j = 0; j < chs.length; j++) {
      (function (el) {
        el.addEventListener('click', function () {
          var i = parseInt(el.getAttribute('data-i'), 10);
          toggleMark(i);
        });
      })(chs[j]);
    }
  }

  function toggleMark(i) {
    if (!chal || revealed) return;
    var isB = i < chal.bits.length && chal.bold[i];
    if (marked[i] === undefined) marked[i] = isB; // 第一次点击=按真实字形标记
    else marked[i] = !marked[i];
    renderCipher();
    renderBits();
  }

  /* ---------- 渲染逐位解码区 ---------- */
  function renderBits() {
    if (!chal) return;
    var len = Math.min(chal.text.length, chal.bits.length);
    var html = '';
    // 把标记结果转成位串，5 位一组
    var bits = '';
    for (var i = 0; i < len; i++) bits += marked[i] ? 'B' : 'A';
    var groups = Math.floor(bits.length / 5);
    var correctAll = true;
    for (var g = 0; g < groups; g++) {
      var sub = bits.substring(g * 5, g * 5 + 5);
      var dec = B_charOf(sub);
      var realSub = chal.bits.substring(g * 5, g * 5 + 5);
      var ok = sub === realSub;
      if (!ok) correctAll = false;
      var cls = 'bc-bitgrp' + (ok ? '' : ' unknown');
      html += '<span class="' + cls + '">' +
        sub.split('').map(function (b) { return '<span class="bc-bit' + (b === 'B' ? ' b' : '') + '">' + b + '</span>'; }).join('') +
        '<span class="bc-dec">' + dec + '</span></span>';
    }
    bitsEl.innerHTML = html || '<span style="color:var(--text-dim);font-size:11px">' + T('gs.bacon.noBits') + '</span>';
    return correctAll && groups > 0;
  }

  /* ---------- 检查 ---------- */
  function doCheck() {
    if (!chal || revealed) return;
    var len = Math.min(chal.text.length, chal.bits.length);
    var allMarked = true, correct = true;
    for (var i = 0; i < len; i++) {
      if (marked[i] === undefined) { allMarked = false; break; }
      if (marked[i] !== !!chal.bold[i]) correct = false;
    }
    if (!allMarked) {
      msgEl.innerHTML = '<span style="color:var(--neon-yellow)">' + T('gs.bacon.needMark') + '</span>';
      return;
    }
    if (!correct) {
      msgEl.innerHTML = '<span style="color:var(--neon-pink)">' + T('gs.bacon.miss') + '</span>';
      if (Arcade.audio) Arcade.audio.play('error');
      return;
    }
    // 全对 → 解码出电文
    revealed = true;
    var dec = B_decode(chal.bits);
    msgEl.innerHTML = '<span style="color:var(--neon-green)">' + T('gs.bacon.winMsg').replace('{s}', dec) + '</span>';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.audio) Arcade.audio.play('win');
    winLevel();
  }

  function winLevel() {
    totalMs += Date.now() - chalStart;
    if (levelIdx < 2) {
      levelIdx++;
      startLevel();
      if (Arcade.ui) Arcade.ui.toast(T('gs.bacon.toastNext').replace('{n}', levelIdx + 1), 'win');
    } else {
      ovTitle.textContent = T('gs.bacon.winT');
      ovTitle.className = 'win';
      ovText.innerHTML = T('gs.bacon.winD').replace('{t}', totalSec()) + '<br><br><b style="color:var(--neon-yellow)">' + T('gs.bacon.revealed') + '</b> ' + B_decode(chal.bits);
      ovBtn.textContent = T('gs.bacon.again');
      ovBtn.onclick = function () {
        levelIdx = 0; totalMs = 0; revealed = false;
        overlayEl.classList.add('hidden');
        resetClock();
        startLevel();
      };
      overlayEl.classList.remove('hidden');
      if (Arcade.daily && dailyMode) Arcade.daily.markSolved('bacon', totalSec());
      if (Arcade.shell) Arcade.shell.submitScore(totalSec());
    }
  }

  function startLevel() {
    chalStart = Date.now();
    revealed = false;
    marked = {};
    hintUsed = 0; // 每关重置提示次数（修复：此前跨关累计，第 2/3 关首次按提示即全揭示）
    chal = genChallenge(levelIdx, levelIdx === 0 && dailyMode ? dailySeed() : undefined);
    levEl.textContent = T('gs.bacon.levelF').replace('{n}', levelIdx + 1).replace('{t}', 3);
    briefEl.textContent = T('gs.bacon.briefF').replace('{n}', CHAL[levelIdx].n) + (dailyMode ? ' ' + T('gs.bacon.dailyTag') : '');
    renderCipher();
    renderBits();
    msgEl.textContent = T('gs.bacon.startMsg');
  }

  var dailyMode = false;
  function dailySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
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

  /* ---------- 提示（揭示 3 个错误标记位置） ---------- */
  var hintUsed = 0;
  function doHint() {
    if (!chal || revealed) return;
    var len = Math.min(chal.text.length, chal.bits.length);
    var wrongs = [];
    for (var i = 0; i < len; i++) {
      var m = marked[i] === undefined ? null : marked[i];
      if (m === null) { wrongs.push(i); }
      else if (m !== !!chal.bold[i]) { wrongs.push(i); }
    }
    if (!wrongs.length) {
      msgEl.innerHTML = '<span style="color:var(--neon-green)">' + T('gs.bacon.hintAll') + '</span>';
      return;
    }
    // 标记最多 3 个错误/未标记位置为正确值
    var n = Math.min(3, wrongs.length);
    for (var k = 0; k < n; k++) {
      var idx = wrongs[k];
      marked[idx] = !!chal.bold[idx];
    }
    hintUsed++;
    if (hintUsed > 2) {
      // 第三次提示：直接全部揭示
      for (var i = 0; i < len; i++) if (marked[i] === undefined) marked[i] = !!chal.bold[i];
    }
    renderCipher();
    renderBits();
    msgEl.innerHTML = '<span style="color:var(--neon-yellow)">' + T('gs.bacon.hintUsed').replace('{n}', hintUsed) + '</span>';
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  /* ---------- 模式切换 ---------- */
  var DEMO_SAMPLES = ['THE', 'SECRET', 'CIPHER'];
  function switchMode(m) {
    mode = m;
    revealed = false;
    marked = {};
    pickEl.classList.add('hidden');
    panelEl.style.display = '';
    if (mode === 'demo') {
      renderDemo();
    } else if (mode === 'free') {
      renderFree();
    } else {
      levelIdx = 0; totalMs = 0; hintUsed = 0;
      dailyMode = false;
      resetClock();
      startLevel();
    }
  }

  /* ---------- 原理演示模式 ---------- */
  function renderDemo() {
    var html =
      '<div class="bc-flavor">' + T('gs.bacon.demoFlavor') + '</div>' +
      '<div class="bc-lbl">' + T('gs.bacon.demoPlainLbl') + '</div>' +
      '<input class="bc-in" id="bc-demo-in" value="SECRET" maxlength="12" autocomplete="off" style="width:100%;padding:10px;font-family:var(--font-pixel);font-size:14px;background:rgba(0,0,0,0.3);border:1px solid rgba(0,240,255,0.3);border-radius:8px;color:var(--neon-cyan)">' +
      '<div class="bc-lbl">' + T('gs.bacon.demoBitsLbl') + '</div>' +
      '<div class="bc-bits" id="bc-demo-bits" style="font-family:var(--font-pixel);font-size:13px;justify-content:center"></div>' +
      '<div class="bc-lbl">' + T('gs.bacon.demoHideLbl') + '</div>' +
      '<div class="bc-cipher" id="bc-demo-hide" style="cursor:default;text-align:center"></div>' +
      '<div class="bc-key" style="justify-content:center">' +
      '  <span class="k pl">A</span><span>' + T('gs.bacon.keyPlain') + '</span>' +
      '  <span class="k bd">B</span><span>' + T('gs.bacon.keyBold') + '</span>' +
      '</div>';
    panelEl.innerHTML = html;
    var inp = document.getElementById('bc-demo-in');
    inp.addEventListener('input', function () { paintDemo(inp.value); });
    paintDemo(inp.value);
  }

  function paintDemo(text) {
    var bits = B_encode(text.toUpperCase());
    var bitsEl = document.getElementById('bc-demo-bits');
    if (!bitsEl) return;
    var html = '';
    for (var i = 0; i + 5 <= bits.length; i += 5) {
      var sub = bits.substring(i, i + 5);
      html += '<span class="bc-bitgrp">' + sub.split('').map(function (b) { return '<span class="bc-bit' + (b === 'B' ? ' b' : '') + '">' + b + '</span>'; }).join('') +
        '<span class="bc-dec">' + B_charOf(sub) + '</span></span>';
    }
    bitsEl.innerHTML = html || '<span style="color:var(--text-dim)">—</span>';
    // 伪装文本：一段词 + 把 bits 植入前缀（加粗 B）
    var rnd = mulberry32(text.length * 7919 + 7);
    var sent = [];
    var need = bits.length;
    while (sent.join('').length < need) sent.push(WORDS[Math.floor(rnd() * WORDS.length)]);
    var sentence = sent.join(' ').substring(0, Math.max(need, sent.join(' ').length));
    var hide = '';
    for (var j = 0; j < sentence.length; j++) {
      var isB = j < need && bits.charAt(j) === 'B';
      hide += '<span class="' + (isB ? 'bold' : 'plain') + '" style="font-size:17px">' + sentence.charAt(j) + '</span>';
    }
    document.getElementById('bc-demo-hide').innerHTML = hide;
  }

  /* ---------- 自由破译模式 ---------- */
  function renderFree() {
    var html =
      '<div class="bc-flavor">' + T('gs.bacon.freeFlavor') + '</div>' +
      '<div class="bc-lbl">' + T('gs.bacon.lblCipher') + '</div>' +
      '<div class="bc-cipher" id="bc-free-cipher"></div>' +
      '<div class="bc-controls">' +
      '  <button class="btn" id="bc-free-new">🎲 ' + T('gs.bacon.freeNew') + '</button>' +
      '</div>' +
      '<div class="bc-lbl">' + T('gs.bacon.lblBits') + '</div>' +
      '<div class="bc-bits" id="bc-free-bits"></div>' +
      '<div class="bc-msg" id="bc-free-msg"></div>';
    panelEl.innerHTML = html;
    document.getElementById('bc-free-new').addEventListener('click', function () {
      var seed = Math.floor(Math.random() * 1000000);
      var plain = '', rnd = mulberry32(seed), words = [], used = {};
      while (words.join('').length < 6) {
        var w = WORDS[Math.floor(rnd() * WORDS.length)];
        if (!used[w]) { used[w] = true; words.push(w); }
      }
      plain = words.join('').substring(0, 6).toUpperCase();
      var bits = B_encode(plain);
      var sent = genSentence(0, seed);
      while (sent.length < bits.length) sent += ' ' + WORDS[Math.floor(rnd() * WORDS.length)];
      freeChal = B_plant(bits, sent);
      freeMarked = {};
      renderFreeCipher();
    });
    // 立即生成一局
    document.getElementById('bc-free-new').click();
  }

  var freeChal = null, freeMarked = {};

  function renderFreeCipher() {
    if (!freeChal) return;
    var html = '';
    var len = Math.min(freeChal.text.length, freeChal.bits.length);
    var bw = 600;
    for (var i = 0; i < freeChal.text.length; i++) {
      var isB = i < len && freeChal.bold[i];
      var cls = 'bc-ch ' + (isB ? 'bold' : 'plain');
      var wt = isB ? 'font-weight:' + bw + ';' : 'font-weight:400;';
      if (freeMarked[i] !== undefined) cls += ' marked';
      var tag = (freeMarked[i] !== undefined) ? '<span class="bc-tag">' + (freeMarked[i] ? 'B' : 'A') + '</span>' : '';
      html += '<span class="' + cls + '" style="' + wt + '" data-i="' + i + '">' + freeChal.text.charAt(i) + tag + '</span>';
    }
    document.getElementById('bc-free-cipher').innerHTML = html;
    var chs = document.getElementById('bc-free-cipher').querySelectorAll('.bc-ch');
    for (var j = 0; j < chs.length; j++) {
      (function (el) {
        el.addEventListener('click', function () {
          var i = parseInt(el.getAttribute('data-i'), 10);
          if (freeMarked[i] === undefined) freeMarked[i] = i < freeChal.bits.length && freeChal.bold[i];
          else freeMarked[i] = !freeMarked[i];
          renderFreeCipher();
          renderFreeBits();
        });
      })(chs[j]);
    }
    renderFreeBits();
  }

  function renderFreeBits() {
    if (!freeChal) return;
    var len = Math.min(freeChal.text.length, freeChal.bits.length);
    var bits = '';
    for (var i = 0; i < len; i++) bits += freeMarked[i] ? 'B' : 'A';
    var groups = Math.floor(bits.length / 5);
    var html = '';
    for (var g = 0; g < groups; g++) {
      var sub = bits.substring(g * 5, g * 5 + 5);
      var dec = B_charOf(sub);
      var ok = sub === freeChal.bits.substring(g * 5, g * 5 + 5);
      html += '<span class="bc-bitgrp' + (ok ? '' : ' unknown') + '">' +
        sub.split('').map(function (b) { return '<span class="bc-bit' + (b === 'B' ? ' b' : '') + '">' + b + '</span>'; }).join('') +
        '<span class="bc-dec">' + dec + '</span></span>';
    }
    document.getElementById('bc-free-bits').innerHTML = html;
    if (groups > 0 && bits.substring(0, len) === freeChal.bits) {
      document.getElementById('bc-free-msg').innerHTML = '<span style="color:var(--neon-green)">' + T('gs.bacon.freeSolved').replace('{s}', B_decode(freeChal.bits)) + '</span>';
    } else {
      document.getElementById('bc-free-msg').textContent = '';
    }
  }

  /* ---------- 事件绑定 ---------- */
  document.getElementById('bc-hint').addEventListener('click', doHint);
  document.getElementById('bc-check').addEventListener('click', doCheck);
  document.getElementById('bc-clear').addEventListener('click', function () {
    marked = {};
    renderCipher();
    renderBits();
    msgEl.textContent = '';
  });
  document.getElementById('bc-m-chal').addEventListener('click', function () { switchMode('chal'); });
  document.getElementById('bc-m-demo').addEventListener('click', function () { switchMode('demo'); });
  document.getElementById('bc-m-free').addEventListener('click', function () { switchMode('free'); });
  document.getElementById('bc-ov-btn').addEventListener('click', function () { });

  /* 每日一题：同日期种子固定第 1 关（解完三关计入今日破译中心） */
  document.getElementById('bc-daily').addEventListener('click', function () {
    if (Arcade.audio) Arcade.audio.play('ui');
    levelIdx = 0; totalMs = 0; hintUsed = 0; dailyMode = true; revealed = false; marked = {};
    overlayEl.classList.add('hidden');
    resetClock();
    startLevel();
  });

  window.GAME_RESTART = function () {
    if (mode === 'chal') { levelIdx = 0; totalMs = 0; hintUsed = 0; dailyMode = false; revealed = false; marked = {}; overlayEl.classList.add('hidden'); resetClock(); startLevel(); }
    else if (mode === 'free') { document.getElementById('bc-free-new').click(); }
    else { switchMode('demo'); }
  };

  /* 每日一题：daily 按钮进入（见事件绑定） */
  switchMode('chal');

  window.GAME_TUTORIAL_STEPS = [
    { t: T('gs.bacon.tut1t'), d: T('gs.bacon.tut1') },
    { t: T('gs.bacon.tut2t'), d: T('gs.bacon.tut2') },
    { t: T('gs.bacon.tut3t'), d: T('gs.bacon.tut3') },
    { t: T('gs.bacon.tut4t'), d: T('gs.bacon.tut4') }
  ];

})();
