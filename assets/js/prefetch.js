/* ============================================================
   破译 DECODE ARCADE · 后台静默预取（prefetch.js）
   首页载入完成后，利用浏览器空闲时间静默下载「后续最可能访问」的页面，
   让 Service Worker 的 cache-first 策略在用户真正点击时直接命中缓存，
   实现：首页首访 → 后台预热 → 后续访问秒开。
   设计：
   - 仅首页（index.html）加载（其余页面首访本身就是要看的页面）
   - requestIdleCallback 空闲时段逐个 fetch；降级 setTimeout 分批
   - 静默：不阻塞、不报错、失败即放弃；避开数据流量敏感（navigator.connection.saveData）
   - 预取对象：内容页（编年史/人物/密件/统计/单章）+ 游戏厅 + 首页自身资源已由 SW 预缓存
   依赖：无（可单独加载；需在 pwa.js 之后以复用 SW 缓存）
   ============================================================ */
(function () {
  /* 预取清单（根路径）：内容页 + 游戏厅 + 主脚本字典类资源 */
  var PAGES = [
    '/games.html',
    '/stories.html',
    '/people.html',
    '/artifacts.html',
    '/stats.html',
    '/story.html',
    '/glossary.html',
    '/workshop.html',
    '/quiz.html',
    '/duel.html',
    '/morse-listen.html',
    '/map.html',
    '/machine.html',
    '/protocols.html',
    '/assets/js/protocols.js',
    '/quotes.html',
    '/path.html'
  ];
  /* 附加高频静态资源（字典/样式/公共脚本，SW 预缓存已覆盖则跳过）
     注：i18n-story.js 为内容页正文，预取后内容页首访可离线秒开 */
  var ASSETS = [
    '/assets/js/enc/i18n-story.enc.js',
    '/assets/js/secure.js',
    '/assets/js/core/music.js',
    '/assets/js/quiz.js',
    '/assets/js/morse-listen.js'
  ];

  /* 流量敏感环境（2G/省流模式）跳过预取，尊重用户 */
  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /(^|[^\d])(2g|slow-2g)([^\d]|$)/i.test(conn.effectiveType || ''))) return;
  } catch (e) {}

  /* 已预取过的标记（避免每次首访重复；只记一次） */
  var KEY = 'arcade_prefetched';
  try {
    if (localStorage.getItem(KEY)) return;
  } catch (e) {}

  function prefetch(url) {
    try {
      // 静默请求：SW 控制时命中 fetch handler 自动 putInCache
      fetch(url, { credentials: 'same-origin' }).catch(function () {});
    } catch (e) {}
  }

  function run() {
    var list = PAGES.concat(ASSETS);
    var i = 0;
    // 分 2 批间隔执行，避免瞬时并发过多
    (function next() {
      if (i >= list.length) {
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
        return;
      }
      var batch = list.slice(i, i + 4);
      i += 4;
      batch.forEach(prefetch);
      setTimeout(next, 800);
    })();
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    window.addEventListener('load', function () { setTimeout(run, 1500); });
  }
})();
