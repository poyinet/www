/* 打字破译 Typecode —— P2 逻辑解谜（剧情解密打字） */

window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.typecode.tut1t'), d: T('gs.typecode.tut1') },
  { t: T('gs.typecode.tut2t'), d: T('gs.typecode.tut2') },
  { t: T('gs.typecode.tut3t'), d: T('gs.typecode.tut3') }
];

(function () {
  var root = document.getElementById('game-root');
  var PHRASES = [
    'DECODE THE MESSAGE AND FIND THE TRUTH',
    'THE ENEMY MOVES AT MIDNIGHT SHARP',
    'BREAK THE FIREWALL BEFORE THE DAWN',
    'SEND THE SIGNAL WHEN THE COAST IS CLEAR',
    'THE KEY IS HIDDEN IN PLAIN SIGHT',
    'TRUST NO ONE THE AGENT IS COMPROMISED'
  ];
  var target = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  var startTs = null, done = false; // 首次输入才起算计时（修复：此前含看教程/停留时间，速度系数被稀释）

  function ensureStart() {
    if (startTs === null) startTs = Date.now();
  }

  var wrap = document.createElement('div');
  wrap.className = 'tc-wrap';
  wrap.innerHTML =
    '<div class="tc-label">' + T('gs.typecode.label') + '</div>' +
    '<div class="tc-quote" id="tc-quote"></div>' +
    '<input class="tc-input" id="tc-in" autocomplete="off" spellcheck="false" placeholder="' + T('gs.typecode.inputPlaceholder') + '">' +
    '<div class="tc-stat" id="tc-stat"></div>' +
    '<div class="tc-msg" id="tc-msg"></div>';
  root.appendChild(wrap);
  var quote = wrap.querySelector('#tc-quote'), input = wrap.querySelector('#tc-in'),
      stat = wrap.querySelector('#tc-stat'), msg = wrap.querySelector('#tc-msg');

  var spans = [];
  for (var i = 0; i < target.length; i++) {
    var s = document.createElement('span'); s.textContent = target[i]; quote.appendChild(s); spans.push(s);
  }

  function update() {
    if (done) return;
    ensureStart(); // 首次输入起算
    var v = input.value.toUpperCase();
    var correct = 0;
    for (var i = 0; i < spans.length; i++) {
      spans[i].className = '';
      if (i < v.length) {
        if (v[i] === target[i]) { spans[i].classList.add('ok'); correct++; }
        else spans[i].classList.add('bad');
      } else if (i === v.length) spans[i].classList.add('cur');
    }
    var acc = Math.round((correct / target.length) * 100);
    stat.textContent = T('gs.typecode.progressFmt').replace('{a}', Math.min(v.length, target.length)).replace('{b}', target.length).replace('{c}', acc);
    if (v.length >= target.length) finish(acc);
  }

  function finish(acc) {
    if (done) return;
    done = true;
    var sec = (Date.now() - startTs) / 1000;
    var speed = Math.max(0.5, Math.min(2, 60 / Math.max(sec, 1)));
    var score = Math.round(acc * speed);
    stat.textContent = T('gs.typecode.resultStatFmt').replace('{a}', acc).replace('{b}', sec.toFixed(1));
    if (acc === 100) { msg.textContent = T('gs.typecode.winPerfectFmt').replace('{n}', speed.toFixed(2)); msg.style.color = 'var(--neon-green)'; }
    else { msg.textContent = T('gs.typecode.doneAccFmt').replace('{n}', acc); msg.style.color = 'var(--neon-yellow)'; }
    if (Arcade.juice) (acc === 100 ? Arcade.juice.win() : Arcade.juice.coin(null, null, 'var(--neon-yellow)'));
    if (Arcade.shell) Arcade.shell.submitScore(score);
  }

  input.addEventListener('input', update);

  /* ---- 触屏支持（A3）：可开关的屏幕键盘，触屏设备默认展开 ---- */
  var IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  var kbd = document.createElement('div');
  kbd.className = 'tc-kbd' + (IS_TOUCH ? '' : ' hidden');
  kbd.setAttribute('role', 'group');
  kbd.setAttribute('aria-label', T('gs.typecode.kbdAria'));

  function typeCh(ch) { if (done) return; ensureStart(); input.value += ch; update(); if (!IS_TOUCH) input.focus(); }
  function backsp() { if (done) return; ensureStart(); input.value = input.value.slice(0, -1); update(); if (!IS_TOUCH) input.focus(); }
  function mkKey(label, act, cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cls || 'tc-key'; b.textContent = label;
    /* pointerdown：真实触控/指针路径；preventDefault 避免移动端点按拉起软键盘 */
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); act(); });
    return b;
  }
  ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach(function (row) {
    var rEl = document.createElement('div'); rEl.className = 'tc-krow';
    for (var i = 0; i < row.length; i++) (function (ch) { rEl.appendChild(mkKey(ch, function () { typeCh(ch); })); })(row[i]);
    kbd.appendChild(rEl);
  });
  var bottomRow = document.createElement('div'); bottomRow.className = 'tc-krow';
  bottomRow.appendChild(mkKey(T('gs.typecode.spaceK'), function () { typeCh(' '); }, 'tc-key tc-key-space'));
  bottomRow.appendChild(mkKey('⌫', backsp, 'tc-key tc-key-bs'));
  kbd.appendChild(bottomRow);
  wrap.appendChild(kbd);

  var kbdToggle = document.createElement('button');
  kbdToggle.type = 'button'; kbdToggle.className = 'btn small'; kbdToggle.textContent = T('gs.typecode.kbdToggle');
  kbdToggle.style.marginTop = '10px';
  kbdToggle.addEventListener('click', function () { kbd.classList.toggle('hidden'); });
  wrap.appendChild(kbdToggle);

  /* 移动端不自动聚焦输入框（避免软键盘立刻盖住屏幕键盘）；桌面保持原体验 */
  if (!IS_TOUCH) setTimeout(function () { input.focus(); }, 80);
    window.GAME_RESTART = function () { location.reload(); };

})();
