/* 仿射密码 Affine Cipher —— 批次A 密码破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.affine.tut1t'), d: T('gs.affine.tut1') },
  { t: T('gs.affine.tut2t'), d: T('gs.affine.tut2') },
  { t: T('gs.affine.tut3t'), d: T('gs.affine.tut3') },
  { t: T('gs.affine.tut4t'), d: T('gs.affine.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var PLAINS = ['AFFINE CIPHER BREAK', 'THE HIDDEN KEY FOUND', 'CRACK THE CODE NOW',
    'SECRET LAIR LOCATED', 'ENEMY BASE REVEALED', 'MEET AT THE OLD MILL', 'SHADOW AGENT DEPLOYED',
    'THE VILLAGE IS SAFE', 'NORTH GATE UNLOCKED', 'TREASURE MAP RECOVERED'];
  var COP = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]; // 与 26 互质的 a 值

  function encChar(ch, a, b) {
    var c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCharCode(((c - 65) * a + b) % 26 + 65);
    return ch;
  }
  function encrypt(plain, a, b) {
    var o = '';
    for (var i = 0; i < plain.length; i++) o += encChar(plain[i], a, b);
    return o;
  }
  /* 解密：需 a 的模逆 */
  function modInv(a, m) {
    for (var x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return 1;
  }
  function decrypt(cipher, a, b) {
    var inv = modInv(a % 26, 26);
    var o = '';
    for (var i = 0; i < cipher.length; i++) {
      var c = cipher.charCodeAt(i);
      if (c >= 65 && c <= 90) o += String.fromCharCode(((inv * (c - 65 - b) % 26) + 26) % 26 + 65);
      else o += cipher[i];
    }
    return o;
  }

  var plain, cipher, keyA, keyB, tries, won;
  function setup() {
    plain = PLAINS[Math.floor(Math.random() * PLAINS.length)];
    keyA = COP[Math.floor(Math.random() * COP.length)];
    keyB = Math.floor(Math.random() * 26);
    cipher = encrypt(plain, keyA, keyB);
    tries = 0; won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'af-wrap';
  wrap.innerHTML =
    '<div class="af-label">' + T('gs.affine.cipherLbl') + '</div>' +
    '<div class="af-cipher" id="af-cipher"></div>' +
    '<div class="af-label">' + T('gs.affine.prevLbl') + '</div>' +
    '<div class="af-prev" id="af-prev"></div>' +
    '<div class="af-sliders">' +
    '  <div class="af-row"><span>' + T('gs.affine.aLbl') + '</span><input type="range" class="af-slider" id="af-a" min="1" max="25" value="1"><span class="af-val" id="af-av">1</span></div>' +
    '  <div class="af-row"><span>' + T('gs.affine.bLbl') + '</span><input type="range" class="af-slider" id="af-b" min="0" max="25" value="0"><span class="af-val" id="af-bv">0</span></div>' +
    '</div>' +
    '<div class="af-msg" id="af-msg"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn accent" id="af-check">' + T('gs.affine.checkBtn') + '</button>' +
    '</div>' +
    '<div class="af-help">' + T('gs.affine.helpText') + '</div>';
  root.appendChild(wrap);
  var cipherEl = wrap.querySelector('#af-cipher'), prevEl = wrap.querySelector('#af-prev'),
      aSl = wrap.querySelector('#af-a'), bSl = wrap.querySelector('#af-b'),
      aVal = wrap.querySelector('#af-av'), bVal = wrap.querySelector('#af-bv'),
      msg = wrap.querySelector('#af-msg'), checkBtn = wrap.querySelector('#af-check');

  function snapA(v) {
    var best = COP[0];
    for (var i = 0; i < COP.length; i++) if (Math.abs(COP[i] - v) < Math.abs(best - v)) best = COP[i];
    return best;
  }

  function render() {
    var a = snapA(parseInt(aSl.value, 10));
    aSl.value = a; aVal.textContent = a;
    bVal.textContent = bSl.value;
    cipherEl.textContent = cipher; // 显示截获密文
    prevEl.textContent = decrypt(cipher, a, parseInt(bSl.value, 10));
  }

  aSl.addEventListener('input', render);
  bSl.addEventListener('input', render);
  checkBtn.addEventListener('click', function () {
    if (won) return;
    tries++;
    var a = snapA(parseInt(aSl.value, 10));
    var got = decrypt(cipher, a, parseInt(bSl.value, 10));
    if (got === plain) {
      won = true;
      msg.textContent = T('gs.affine.success').replace('{a}', a).replace('{b}', bSl.value).replace('{n}', tries);
      msg.style.color = 'var(--neon-green)';
      prevEl.style.borderColor = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(tries);
    } else {
      msg.textContent = T('gs.affine.fail');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  setup();
  render();
  window.GAME_RESTART = function () { setup(); aSl.value = 1; bSl.value = 0; render(); msg.textContent = ''; msg.style.color = ''; prevEl.style.borderColor = ''; };

})();
