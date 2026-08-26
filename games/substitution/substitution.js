/* 替换密码 Substitution —— Phase2 破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.substitution.tut1t'), d: T('gs.substitution.tut1') },
  { t: T('gs.substitution.tut2t'), d: T('gs.substitution.tut2') },
  { t: T('gs.substitution.tut3t'), d: T('gs.substitution.tut3') },
  { t: T('gs.substitution.tut4t'), d: T('gs.substitution.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var PLAINS = ['OPEN SESAME', 'THE EAGLE HAS LANDED', 'DECODE THIS SIGNAL', 'MEET AT MIDNIGHT',
    'THE CAKE IS A LIE', 'ATTACK AT DAWN', 'FOLLOW THE WHITE RABBIT', 'TRUST NO ONE'];

  function randKey() {
    var a = []; for (var i = 0; i < 26; i++) a.push(String.fromCharCode(65 + i));
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var plain, cipher, keyMap, letters, guess, taps, won;

  function setup() {
    plain = PLAINS[Math.floor(Math.random() * PLAINS.length)];
    var key = randKey();
    keyMap = {};
    for (var i = 0; i < 26; i++) keyMap[String.fromCharCode(65 + i)] = key[i];
    cipher = '';
    for (var c = 0; c < plain.length; c++) {
      var ch = plain[c];
      cipher += (ch === ' ') ? ' ' : keyMap[ch];
    }
    letters = [];
    for (var k = 0; k < cipher.length; k++) { var cc = cipher[k]; if (cc !== ' ' && letters.indexOf(cc) < 0) letters.push(cc); }
    letters.sort();
    guess = {}; letters.forEach(function (l) { guess[l] = '?'; });
    taps = 0; won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'sub-wrap';
  wrap.innerHTML =
    '<div class="sub-label">' + T('gs.substitution.lblCipher') + '</div>' +
    '<div class="sub-cipher" id="sub-cipher"></div>' +
    '<div class="sub-label">' + T('gs.substitution.lblPreview') + '</div>' +
    '<div class="sub-prev" id="sub-prev"></div>' +
    '<div class="sub-key" id="sub-key"></div>' +
    '<div class="sub-msg" id="sub-msg"></div>' +
    '<div class="game-controls"><button id="sub-reset" class="btn purple">' + T('gs.substitution.reset') + '</button></div>' +
    '<p class="sub-tip">' + T('gs.substitution.tip') + '</p>';
  
  /* helpText 知识延伸 */
  var helpDiv = document.createElement('div');
  helpDiv.style.cssText = 'font-size:12px;color:var(--text-dim);line-height:1.8;margin-top:12px;text-align:left;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px';
  helpDiv.innerHTML = T('gs.substitution.helpText');
  wrap.appendChild(helpDiv);
root.appendChild(wrap);
  var cipherEl = wrap.querySelector('#sub-cipher'), prevEl = wrap.querySelector('#sub-prev'),
      keyEl = wrap.querySelector('#sub-key'), msg = wrap.querySelector('#sub-msg'),
      resetBtn = wrap.querySelector('#sub-reset');

  function renderPreview() {
    var out = '';
    for (var c = 0; c < cipher.length; c++) {
      var ch = cipher[c];
      if (ch === ' ') out += ' ';
      else out += (guess[ch] === '?' ? '?' : guess[ch]);
    }
    prevEl.textContent = out;
  }

  function buildKey() {
    keyEl.innerHTML = '';
    letters.forEach(function (l) {
      var tile = document.createElement('div'); tile.className = 'sub-tile';
      tile.innerHTML = '<div class="c">' + l + '</div><div class="g" data-l="' + l + '">' + guess[l] + '</div>';
      tile.addEventListener('click', function () { cycle(l); });
      keyEl.appendChild(tile);
    });
  }

  function cycle(l) {
    if (won) return;
    var cur = guess[l];
    var next = cur === '?' ? 'A' : (cur === 'Z' ? '?' : String.fromCharCode(cur.charCodeAt(0) + 1));
    guess[l] = next;
    taps++;
    var gEl = keyEl.querySelector('.g[data-l="' + l + '"]');
    if (gEl) gEl.textContent = next;
    if (Arcade.juice) Arcade.juice.select();
    renderPreview();
    check();
  }

  function check() {
    for (var c = 0; c < cipher.length; c++) {
      var ch = cipher[c];
      if (ch === ' ') continue;
      if (guess[ch] !== plain[c]) return;
    }
    won = true;
    msg.textContent = T('gs.substitution.msgWin').replace('{plain}', plain);
    msg.style.color = 'var(--neon-green)';
    if (Arcade.juice) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(taps);
  }

  resetBtn.addEventListener('click', function () {
    if (won) return;
    letters.forEach(function (l) { guess[l] = '?'; });
    taps = 0;
    buildKey(); renderPreview(); msg.textContent = '';
    if (Arcade.audio) Arcade.audio.play('ui');
  });

  setup(); buildKey(); renderPreview();
  cipherEl.textContent = cipher;
  window.GAME_RESTART = function () {
    won = false;
    setup();
    letters.forEach(function (l) { guess[l] = '?'; });
    taps = 0;
    buildKey(); renderPreview();
    cipherEl.textContent = cipher;
    msg.textContent = '';
  };

})();
