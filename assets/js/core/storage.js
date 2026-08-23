/* ============================================================
   最高分持久化：localStorage 封装
   key 规范：arcade_best_{gameId}
   ============================================================ */

window.Arcade = window.Arcade || {};

Arcade.storage = (function () {
  var PREFIX = 'arcade_best_';
  /* B3：任一写入失败（隐私模式/配额满）置位，extras.js 启动后一次性提示 */
  var writeFailed = false;

  function key(gameId) {
    return PREFIX + gameId;
  }

  /** 读取最高分；无记录返回 null */
  function getBest(gameId) {
    try {
      var raw = localStorage.getItem(key(gameId));
      if (raw === null) return null;
      var n = Number(raw);
      return isNaN(n) ? null : n;
    } catch (e) {
      return null; // 隐私模式等场景下 localStorage 不可用
    }
  }

  /**
   * 提交成绩；破纪录则写入并返回 true
   * mode: 'max'（默认，越高越好）| 'min'（越低越好，如计时/步数）
   */
  function submitBest(gameId, score, mode) {
    var best = getBest(gameId);
    var isNewRecord =
      best === null ||
      (mode === 'min' ? score < best : score > best);
    if (isNewRecord) {
      try {
        localStorage.setItem(key(gameId), String(score));
      } catch (e) { writeFailed = true; /* 忽略写入失败 */ }
    }
    return isNewRecord;
  }

  function markWriteFail() { writeFailed = true; }
  function hasWriteError() { return writeFailed; }

  return { getBest: getBest, submitBest: submitBest, markWriteFail: markWriteFail, hasWriteError: hasWriteError };
})();

/* ============================================================
   每日破译中心持久化
   key：arcade_daily_{gameId}_{YYYY-M-D} = 当日破解用时（秒）
       arcade_daily_streak / arcade_daily_last = 连续破译天数
   依赖：上方 Arcade.storage 同一 localStorage
   ============================================================ */

Arcade.daily = (function () {
  var PREFIX = 'arcade_daily_';
  var STREAK_KEY = PREFIX + 'streak';
  var LAST_KEY = PREFIX + 'last';

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {
      if (window.Arcade && Arcade.storage && Arcade.storage.markWriteFail) Arcade.storage.markWriteFail();
    }
  }

  /** 某游戏某日（默认今天）是否已破译今日题 */
  function isSolved(gameId, d) {
    return get(PREFIX + gameId + '_' + dayStr(d)) !== null;
  }
  /** 某游戏某日（默认今天）的破解用时；未破译返回 null */
  function solvedTime(gameId, d) {
    var v = get(PREFIX + gameId + '_' + dayStr(d));
    return v === null ? null : Number(v);
  }
  /** 记录今日题已破译（用时秒）；同一天同游戏只记一次，返回是否新记录 */
  function markSolved(gameId, seconds) {
    var k = PREFIX + gameId + '_' + dayStr();
    if (get(k) !== null) return false;
    set(k, String(seconds));
    updateStreak();
    if (window.Arcade && Arcade.audio) Arcade.audio.play('daily');
    return true;
  }
  function updateStreak() {
    var today = dayStr();
    var last = get(LAST_KEY);
    if (last === today) return; // 今天已计入过
    var streak = Number(get(STREAK_KEY) || 0);
    if (last === dayStr(addDays(new Date(), -1))) {
      streak += 1;
    } else {
      streak = 1;
    }
    set(STREAK_KEY, String(streak));
    set(LAST_KEY, today);
  }
  /** 当前连破天数（含今天，若今天已至少解一题） */
  function streak() { return Number(get(STREAK_KEY) || 0); }
  function lastDay() { return get(LAST_KEY); }

  return {
    dayStr: dayStr, isSolved: isSolved, solvedTime: solvedTime,
    markSolved: markSolved, streak: streak, lastDay: lastDay
  };
})();
