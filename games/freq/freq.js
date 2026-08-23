/* 词频分析 Frequency Analysis —— 批次A 密码破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.freq.tut1t'), d: T('gs.freq.tut1') },
  { t: T('gs.freq.tut2t'), d: T('gs.freq.tut2') },
  { t: T('gs.freq.tut3t'), d: T('gs.freq.tut3') },
  { t: T('gs.freq.tut4t'), d: T('gs.freq.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var TEXTS = [
    'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THE DOG SLEEPS ALL DAY',
    'EVERY SECRET HAS A PRICE AND EVERY CODE HAS A KEY THAT OPENS THE LOCK',
    'CODEBREAKERS STUDY PATTERNS AND FIND THE ORDER HIDDEN IN CHAOS',
    'THE ART OF WAR SAYS KNOW YOUR ENEMY AND KNOW YOURSELF',
    'MESSAGES HIDE IN PLAIN SIGHT WAITING FOR THE RIGHT EYES TO SEE'
  ];
  var FREQ_ORDER = 'ETAOINSHRDLU'; // 英文常用字母排序

  function randKey() {
    var a = []; for (var i = 0; i < 26; i++) a.push(String.fromCharCode(65 + i));
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var plain, cipher, keyMap, counts, tries, won;
  function setup() {
    plain = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    var key = randKey();
    keyMap = {};
    for (var i = 0; i < 26; i++) keyMap[String.fromCharCode(65 + i)] = key[i];
    cipher = '';
    for (var c = 0; c < plain.length; c++) {
      var ch = plain[c];
      cipher += (ch === ' ') ? ' ' : keyMap[ch];
    }
    // 统计密文字母频率
    counts = {};
    for (var k = 0; k < cipher.length; k++) { var cc = cipher[k]; if (cc !== ' ') counts[cc] = (counts[cc] || 0) + 1; }
    tries = 0; won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'fq-wrap';
  wrap.innerHTML =
    '<div class="fq-label">' + T('gs.freq.cipherLbl') + '</div>' +
    '<div class="fq-text" id="fq-text"></div>' +
    '<div class="fq-label">' + T('gs.freq.barsLbl') + '</div>' +
    '<div class="fq-bars" id="fq-bars"></div>' +
    '<div class="fq-map" id="fq-map"></div>' +
    '<div class="fq-msg" id="fq-msg"></div>' +
    '<div class="game-controls"><button class="btn accent" id="fq-check">' + T('gs.freq.checkBtn') + '</button></div>' +
    '<div class="fq-help">' + T('gs.freq.helpText') + '</div>';
  root.appendChild(wrap);
  var textEl = wrap.querySelector('#fq-text'), barsEl = wrap.querySelector('#fq-bars'),
      mapEl = wrap.querySelector('#fq-map'), msg = wrap.querySelector('#fq-msg'),
      checkBtn = wrap.querySelector('#fq-check');

  var mapping = {}; // 密文字母 -> 明文字母

  function buildBars() {
    barsEl.innerHTML = '';
    var sorted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var max = counts[sorted[0]];
    sorted.forEach(function (ch) {
      var col = document.createElement('div');
      col.className = 'fq-col' + (mapping[ch] ? ' mapped' : '');
      col.innerHTML = '<div class="fq-bar" style="height:' + Math.round(counts[ch] / max * 100) + '%"></div>' +
        '<div class="fq-char">' + ch + '</div>';
      col.addEventListener('click', function () { cycleMap(ch); });
      barsEl.appendChild(col);
    });
  }

  function cycleMap(ch) {
    var keys = Object.keys(mapping);
    var used = {};
    keys.forEach(function (k) { used[mapping[k]] = true; });
    var next = mapping[ch] ? String.fromCharCode(mapping[ch].charCodeAt(0) + 1) : 'A';
    // 找下一个未使用的明文字母（跳过 Z 后清空）
    if (next > 'Z') { delete mapping[ch]; render(); return; }
    while (next <= 'Z' && used[next]) next = String.fromCharCode(next.charCodeAt(0) + 1);
    if (next > 'Z') { delete mapping[ch]; }
    else { mapping[ch] = next; used[next] = true; }
    tries++;
    render();
    if (Arcade.audio) Arcade.audio.play('ui');
  }

  function render() {
    // 密文替换预览
    var out = '';
    for (var i = 0; i < cipher.length; i++) {
      var ch = cipher[i];
      out += (ch === ' ' || !mapping[ch]) ? ch : mapping[ch];
    }
    textEl.textContent = out;
    // 映射面板
    mapEl.innerHTML = '';
    Object.keys(mapping).sort().forEach(function (ch) {
      var t = document.createElement('div');
      t.className = 'fq-tile';
      t.innerHTML = '<b>' + ch + '</b> → ' + mapping[ch];
      mapEl.appendChild(t);
    });
    buildBars();
  }

  checkBtn.addEventListener('click', function () {
    if (won) return;
    var out = '';
    for (var i = 0; i < cipher.length; i++) {
      var ch = cipher[i];
      out += (ch === ' ' || !mapping[ch]) ? ch : mapping[ch];
    }
    if (out === plain) {
      won = true;
      msg.textContent = T('gs.freq.success').replace('{n}', tries);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(tries);
    } else {
      msg.textContent = T('gs.freq.fail');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  setup();
  mapping = {};
  render();
  window.GAME_RESTART = function () { setup(); mapping = {}; msg.textContent = ''; msg.style.color = ''; render(); };

})();
