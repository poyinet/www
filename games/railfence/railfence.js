/* 栅栏密码 Rail Fence —— 批次A 密码破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.railfence.tut1t'), d: T('gs.railfence.tut1') },
  { t: T('gs.railfence.tut2t'), d: T('gs.railfence.tut2') },
  { t: T('gs.railfence.tut3t'), d: T('gs.railfence.tut3') },
  { t: T('gs.railfence.tut4t'), d: T('gs.railfence.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var PLAINS = ['MEET ME AT THE PARK', 'THE QUICK BROWN FOX', 'CRYPTOGRAPHY IS FUN',
    'RAIL FENCE CIPHER', 'DECODE THE MESSAGE', 'SECRET MISSION READY', 'ZIGZAG PATTERN WAVE',
    'CODEBREAKERS UNITE', 'STORM THE GATES NOW', 'THE MOON IS BRIGHT'];

  /* 栅栏加密：rails 条轨道 Z 字形 */
  function encrypt(plain, rails) {
    if (rails <= 1) return plain;
    var rows = [];
    for (var i = 0; i < rails; i++) rows.push([]);
    var r = 0, dir = 1;
    for (var c = 0; c < plain.length; c++) {
      rows[r].push(plain[c]);
      if (r === 0) dir = 1;
      else if (r === rails - 1) dir = -1;
      r += dir;
    }
    var out = '';
    for (var j = 0; j < rails; j++) out += rows[j].join('');
    return out;
  }

  /* 栅栏解密：按位置回填 */
  function decrypt(cipher, rails) {
    if (rails <= 1) return cipher;
    var n = cipher.length;
    // 计算每条轨道的字符数
    var lens = [];
    for (var i = 0; i < rails; i++) lens.push(0);
    var r = 0, dir = 1;
    for (var c = 0; c < n; c++) {
      lens[r]++;
      if (r === 0) dir = 1;
      else if (r === rails - 1) dir = -1;
      r += dir;
    }
    // 切分密文到各轨道
    var rows = [], pos = 0;
    for (var j = 0; j < rails; j++) { rows.push(cipher.substr(pos, lens[j]).split('')); pos += lens[j]; }
    // 按 Z 字形路径回读
    var idx = [];
    for (var k = 0; k < rails; k++) idx.push(0);
    var out = '', rr = 0, dd = 1;
    for (var cc = 0; cc < n; cc++) {
      out += rows[rr][idx[rr]++];
      if (rr === 0) dd = 1;
      else if (rr === rails - 1) dd = -1;
      rr += dd;
    }
    return out;
  }

  var plain, cipher, rails, tries, won;
  function setup() {
    plain = PLAINS[Math.floor(Math.random() * PLAINS.length)];
    rails = 2 + Math.floor(Math.random() * 3); // 2~4 轨
    cipher = encrypt(plain, rails);
    tries = 0; won = false;
  }
  setup(); // 需在 wrap.innerHTML 使用 rails 之前初始化

  var wrap = document.createElement('div');
  wrap.className = 'rf-wrap';
  wrap.innerHTML =
    '<div class="rf-label">' + T('gs.railfence.cipherLbl') + '</div>' +
    '<div class="rf-cipher" id="rf-cipher"></div>' +
    '<div class="rf-label">' + T('gs.railfence.prevLbl') + '</div>' +
    '<div class="rf-prev" id="rf-prev"></div>' +
    '<div class="rf-rails">' +
    '  <span>' + T('gs.railfence.railsLbl') + '</span>' +
    '  <input type="range" class="rf-slider" id="rf-slider" min="2" max="6" value="' + rails + '">' +
    '  <span class="rf-hint" id="rf-rails">' + T('gs.railfence.railsUnit').replace('{n}', rails) + '</span>' +
    '</div>' +
    '<div class="rf-msg" id="rf-msg"></div>' +
    '<div class="game-controls">' +
    '  <button class="btn accent" id="rf-check">' + T('gs.railfence.checkBtn') + '</button>' +
    '</div>' +
    '<div class="rf-help">' + T('gs.railfence.helpText') + '</div>';
  root.appendChild(wrap);
  var cipherEl = wrap.querySelector('#rf-cipher'), prevEl = wrap.querySelector('#rf-prev'),
      slider = wrap.querySelector('#rf-slider'), railsEl = wrap.querySelector('#rf-rails'),
      msg = wrap.querySelector('#rf-msg'), checkBtn = wrap.querySelector('#rf-check');

  function sliderVal() {
    var v = parseInt(slider.value, 10);
    return isNaN(v) ? rails : v; // 兜底：滑块未初始化时用当前轨道数
  }

  function render() {
    cipherEl.textContent = cipher;
    prevEl.textContent = decrypt(cipher, sliderVal());
    railsEl.textContent = T('gs.railfence.railsUnit').replace('{n}', sliderVal());
  }

  slider.addEventListener('input', render);
  checkBtn.addEventListener('click', function () {
    if (won) return;
    tries++;
    var got = decrypt(cipher, sliderVal());
    if (got === plain) {
      won = true;
      msg.textContent = T('gs.railfence.success').replace('{p}', plain).replace('{n}', tries);
      msg.style.color = 'var(--neon-green)';
      prevEl.style.borderColor = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(tries);
    } else {
      msg.textContent = T('gs.railfence.fail');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  });

  render();
  window.GAME_RESTART = function () { setup(); slider.value = rails; render(); msg.textContent = ''; msg.style.color = ''; prevEl.style.borderColor = ''; };

})();
