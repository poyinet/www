/* Base64 破译 —— 批次A 密码破译招牌 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.base64.tut1t'), d: T('gs.base64.tut1') },
  { t: T('gs.base64.tut2t'), d: T('gs.base64.tut2') },
  { t: T('gs.base64.tut3t'), d: T('gs.base64.tut3') },
  { t: T('gs.base64.tut4t'), d: T('gs.base64.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var SECRETS = [
    'THE VAULT OPENS AT NINE', 'FOLLOW THE RIVER EAST', 'MEET ME BEHIND THE ARCADE',
    'THE CODE IS BANANA', 'REPORT TO BASE CAMP', 'LAUNCH ROCKET AT SUNSET',
    'WATCH THE NORTHERN SKY', 'THE SAFE HOUSE IS READY', 'PASSWORD IS NEON LIGHT',
    'ALL AGENTS GO DARK TONIGHT'
  ];

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64Encode(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
    var out = '';
    for (var j = 0; j < bytes.length; j += 3) {
      var b0 = bytes[j], b1 = bytes[j + 1], b2 = bytes[j + 2];
      out += CHARS[b0 >> 2];
      out += CHARS[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)];
      out += b1 === undefined ? '=' : CHARS[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)];
      out += b2 === undefined ? '=' : CHARS[b2 & 63];
    }
    return out;
  }

  var secret, cipher, tries, won;
  function setup() {
    secret = SECRETS[Math.floor(Math.random() * SECRETS.length)];
    cipher = b64Encode(secret);
    tries = 0; won = false;
  }

  var wrap = document.createElement('div');
  wrap.className = 'b64-wrap';
  wrap.innerHTML =
    '<div class="b64-label">' + T('gs.base64.cipherLbl') + '</div>' +
    '<div class="b64-cipher" id="b64-cipher"></div>' +
    '<div class="b64-label">' + T('gs.base64.inputLbl') + '</div>' +
    '<input class="b64-input" id="b64-in" autocomplete="off" spellcheck="false" placeholder="' + T('gs.base64.inputPh') + '">' +
    '<div class="b64-hint">' + T('gs.base64.hintText') + '</div>' +
    '<div class="b64-msg" id="b64-msg"></div>' +
    '<div class="game-controls"><button class="btn accent" id="b64-check">' + T('gs.base64.checkBtn') + '</button></div>' +
    '<div class="b64-help">' + T('gs.base64.helpText') + '</div>';
  root.appendChild(wrap);
  var cipherEl = wrap.querySelector('#b64-cipher'), input = wrap.querySelector('#b64-in'),
      msg = wrap.querySelector('#b64-msg'), checkBtn = wrap.querySelector('#b64-check');

  function render() { cipherEl.textContent = cipher; }

  function check() {
    if (won) return;
    tries++;
    var got = input.value.trim().toUpperCase();
    if (got === secret.toUpperCase()) {
      won = true;
      msg.textContent = T('gs.base64.success').replace('{m}', secret).replace('{n}', tries);
      msg.style.color = 'var(--neon-green)';
      if (Arcade.juice) Arcade.juice.win();
      if (Arcade.shell) Arcade.shell.submitScore(tries);
    } else {
      msg.textContent = T('gs.base64.fail');
      msg.style.color = 'var(--neon-pink)';
      if (Arcade.audio) Arcade.audio.play('error');
    }
  }
  checkBtn.addEventListener('click', check);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });

  setup();
  render();
  window.GAME_RESTART = function () { setup(); render(); input.value = ''; msg.textContent = ''; msg.style.color = ''; };

})();
