/* ============================================================
   破译 DECODE ARCADE · Service Worker
   策略：
   - 安装：预缓存「外壳」资源（大厅样式/脚本/字体/图标/根页面）
   - 导航请求（HTML）：network-first → 缓存兜底 → 首页兜底（离线可玩已访问页）
   - 静态资源（JS/CSS/字体/图片）：cache-first，首次访问后即离线可用
   - 更新：新版本安装后立即 skipWaiting 接管，激活时清理旧缓存
   注意：SW 仅在 http(s) 下生效；file:// 本地打开时浏览器不注册，属预期。
   ============================================================ */

var CACHE = 'decode-arcade-v20';
var CORE_ASSETS = [
  '/',
  '/index.html',
  '/games.html',
  '/stories.html',
  '/people.html',
  '/artifacts.html',
  '/glossary.html',
  '/workshop.html',
  '/quiz.html',
  '/duel.html',
  '/morse-listen.html',
  '/map.html',
  '/machine.html',
  '/protocols.html',
  '/quotes.html',
  '/path.html',
  '/stats.html',
  '/story.html',
  '/404.html',
  '/manifest.webmanifest',
  '/assets/css/theme.css',
  '/assets/css/shell.css',
  '/assets/js/core/i18n.js',
  '/assets/js/core/i18n-dict.js',
  '/assets/js/core/i18n-archive.js',
  '/assets/js/core/i18n-story.js',
  '/assets/js/core/storage.js',
  '/assets/js/core/extras.js',
  '/assets/js/core/music.js',
  '/assets/js/core/input.js',
  '/assets/js/core/loop.js',
  '/assets/js/games.js',
  '/assets/js/lobby.js',
  '/assets/js/home.js',
  '/assets/js/daily-fact.js',
  '/assets/js/nav.js',
  '/assets/js/rank.js',
  '/assets/js/stats.js',
  '/assets/js/plot.js',
  '/assets/js/stories.js',
  '/assets/js/chapter-quiz.js',
  '/assets/js/pwa.js',
  '/assets/js/prefetch.js',
  '/assets/js/workshop.js',
  '/assets/js/quiz.js',
  '/assets/js/duel.js',
  '/assets/js/morse-listen.js',
  '/assets/js/map.js',
  '/assets/js/machine.js',
  '/assets/js/quotes.js',
  '/assets/js/save-manager.js',
  '/assets/js/easter-eggs.js',
  '/assets/js/timeline.js',
  '/assets/fonts/press-start-2p.woff2',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-maskable-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/og-image.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(CORE_ASSETS); })
      .then(function () {
        /* D4 更新通知：新版本安装完成，通知页面（用户确认后 SKIP_WAITING 激活）。
           此处不调用 skipWaiting()：首次安装浏览器自动接管；
           后续更新由页面决定何时激活（点击 toast → SKIP_WAITING message）。 */
        self.clients.matchAll({ includeUncontrolled: true }).then(function (clients) {
          clients.forEach(function (client) {
            client.postMessage({ type: 'NEW_VERSION', cache: CACHE });
          });
        });
      })
      .catch(function (err) { console.warn('[SW] 预缓存失败（部分资源可能未缓存）', err); if (self.skipWaiting) self.skipWaiting(); })
  );
});

/* D4：页面请求激活（SKIP_WAITING）→ 接管 */
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING' && self.skipWaiting) {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* 命中网络就更新缓存（后台刷新，下一次离线即用新内容） */
function putInCache(request, response) {
  if (request.method !== 'GET' || !response || response.status !== 200) return;
  var copy = response.clone();
  caches.open(CACHE).then(function (cache) { cache.put(request, copy); }).catch(function () {});
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 仅同源

  // 导航请求：network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          if (res && res.status === 200) putInCache(req, res);
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            if (hit) return hit;
            // 未缓存过的页面 → 首页兜底
            return caches.match('/').then(function (home) { return home || caches.match('/index.html'); });
          });
        })
    );
    return;
  }

  // 静态资源：cache-first
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        putInCache(req, res);
        return res;
      });
    })
  );
});
