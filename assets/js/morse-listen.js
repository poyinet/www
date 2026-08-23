/* ============================================================
   摩斯听音训练 Morse Listening —— A3 互动玩法
   Web Audio 合成点/划音，播放随机字母的摩斯码，听音辨字母。
   每轮 10 题，答对计分；三档速度（慢/正常/快）；成绩写入本地。
   依赖：core/i18n.js + core/i18n-dict.js；无其它依赖。
   ============================================================ */
window.MORSE_L = (function () {
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.' };
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

  /* 速度倍率：单位时间（ms）—— 点音长 = 60*speed */
  var SPEEDS = { slow: 2.2, normal: 1.4, fast: 0.8 };

  var ctx = null;
  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx;
  }

  /* 播放一个点/划（dur 为毫秒，换算为秒参与 AudioParam 调度） */
  function beep(dur) {
    var c = ensureCtx();
    if (!c) return;
    var d = dur / 1000; // ms → s
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 650;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.012);
    gain.gain.setValueAtTime(0.4, t0 + d - 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + d + 0.02);
  }

  /* 播放多字母组（D6 Farnsworth）：字符内元素间隔 1 单位，
     字符间隔 = charGap 单位（标准 3；Farnsworth 拉大到 7 制造「字快隔慢」训练）
     onElem(sym)：每个元素发声时刻的回调（供 UI 同步显示点划），可选 */
  function playGroup(chars, opts, onElem) {
    var mul = (opts && opts.mul) || 1;
    var charGap = (opts && opts.charGap != null) ? opts.charGap : 3;
    var unit = 60 * mul;
    var c = ensureCtx();
    if (!c) return 0;
    var delay = 0;
    for (var li = 0; li < chars.length; li++) {
      var code = MORSE[chars[li]] || '';
      for (var i = 0; i < code.length; i++) {
        var sym = code[i];
        var dur = sym === '.' ? unit : unit * 3;
        (function (d, du, s) {
          setTimeout(function () { beep(du); if (onElem) onElem(s); }, d);
        })(delay, dur, sym);
        delay += dur + unit;
      }
      delay += (charGap - 1) * unit; /* 元素后已含 1u，这里补足字符间隔 */
    }
    return delay;
  }

  /* 播放整串摩斯码（单字母；保持旧签名兼容） */
  function playCode(code, speed, onElem) {
    return playGroup([code], { mul: speed, charGap: 3 }, onElem);
  }

  function pickLetters(n) {
    var pool = LETTERS.slice();
    var out = [];
    for (var i = 0; i < n && pool.length; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  /* D6：生成含 target 的 n 字母组（其余随机不重复、乱序） */
  function makeGroup(target, n) {
    var pool = LETTERS.filter(function (l) { return l !== target; });
    var out = [target];
    for (var i = 1; i < n && pool.length; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    for (var j = out.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = out[j]; out[j] = out[k]; out[k] = t;
    }
    return out;
  }

  /* 记录成绩：{score, total} 保留最佳；speed 记录在最佳成绩旁（可对比三档速度） */
  function record(score, total, speed) {
    try {
      var best = parseInt(localStorage.getItem('arcade_morse_best') || '-1', 10);
      if (score > best) {
        localStorage.setItem('arcade_morse_best', String(score));
        localStorage.setItem('arcade_morse_best_total', String(total));
        if (speed) localStorage.setItem('arcade_morse_best_speed', String(speed));
      }
      localStorage.setItem('arcade_morse_last', String(score));
      localStorage.setItem('arcade_morse_last_total', String(total));
      if (speed) localStorage.setItem('arcade_morse_last_speed', String(speed));
    } catch (e) {}
  }
  function best() {
    try {
      return {
        score: parseInt(localStorage.getItem('arcade_morse_best') || '0', 10),
        total: parseInt(localStorage.getItem('arcade_morse_best_total') || '0', 10),
        speed: localStorage.getItem('arcade_morse_best_speed') || '',
        last: parseInt(localStorage.getItem('arcade_morse_last') || '0', 10),
        lastTotal: parseInt(localStorage.getItem('arcade_morse_last_total') || '0', 10),
        lastSpeed: localStorage.getItem('arcade_morse_last_speed') || ''
      };
    } catch (e) { return { score: 0, total: 0, speed: '', last: 0, lastTotal: 0, lastSpeed: '' }; }
  }

  return {
    MORSE: MORSE, LETTERS: LETTERS, SPEEDS: SPEEDS,
    FARNWORTH: { mul: 0.8, charGap: 7 },
    playCode: playCode, playGroup: playGroup,
    pickLetters: pickLetters, makeGroup: makeGroup,
    record: record, best: best
  };
})();
