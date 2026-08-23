/* ============================================================
   破译 DECODE ARCADE · PWA 引导 + 更新通知（D4）
   - 注册 Service Worker（仅 http/https，file:// 下自动跳过）
   - 监听 SW 更新：新版本就绪时 toast 提示「有更新，点击刷新」
   - 暴露 window.__arcadePWA = true（供未来功能探测，不做任何安装提示）
   加载位置：根页面由 sync-head 工具注入；游戏页由 shell.js 注入
   ============================================================ */

(function () {
  if (window.__arcadePWAInjected) return; // 幂等：shell.js 注入与 HTML 直插可能重复加载
  window.__arcadePWAInjected = true;
  try {
    if (!('serviceWorker' in navigator)) return;
    var proto = (window.location.protocol || '');
    if (proto !== 'https:' && proto !== 'http:') return; // file:// 不注册
    window.__arcadePWA = true;

    var updateReady = false;
    var waitingSW = null;

    function toastUpdate() {
      if (updateReady || !window.Arcade || !Arcade.ui || !Arcade.ui.toast) return;
      updateReady = true;
      var msg = (Arcade.i18n && Arcade.i18n.getLang && Arcade.i18n.getLang() === 'en')
        ? '🆕 New version ready — tap to refresh'
        : '🆕 新版本已就绪，点击刷新';
      try {
        Arcade.ui.toast(msg, 'win', function () {
          if (waitingSW && waitingSW.postMessage) waitingSW.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        });
      } catch (e) {}
    }

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function (reg) {
        /* 首次安装：无提示；后续更新：waiting → 通知 */
        if (reg.waiting) { waitingSW = reg.waiting; toastUpdate(); }
        reg.addEventListener('updatefound', function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              waitingSW = sw;
              toastUpdate();
            }
          });
        });
        /* 已被 skipWaiting 接管：controllerchange → 提示刷新（载入新版本）
           注意：首次安装时 sw.js 的 clients.claim() 也会触发 controllerchange，
           此时此前无 controller（首次加载），不应刷新——仅更新接管时刷新 */
        var hadController = !!navigator.serviceWorker.controller;
        var nav = navigator.serviceWorker;
        nav.addEventListener('controllerchange', function () {
          if (!hadController) return; // 首次 claim，非更新
          var isReloading = false;
          try { isReloading = sessionStorage.getItem('arcade_sw_reloading') === '1'; } catch (e) {}
          if (!isReloading) {
            try { sessionStorage.setItem('arcade_sw_reloading', '1'); } catch (e) {}
            window.location.reload();
          }
        });
      }).catch(function (err) {
        /* 注册失败静默（如部署于子路径/无 SW 权限的环境） */
        if (window.console && console.info) console.info('[PWA] SW 注册跳过:', err && err.message);
      });

      /* 接收 SW 发来的「新版本」消息（仅非首次安装时提示） */
      navigator.serviceWorker.addEventListener('message', function (ev) {
        if (ev.data && ev.data.type === 'NEW_VERSION' && navigator.serviceWorker.controller) {
          toastUpdate();
        }
      });
    });
  } catch (e) {}
})();
