/* ============================================================
   全局导航（破译 DECODE ARCADE 博物馆化）
   桌面：顶部 6 项导航（首页/编年史/人物志/密件册/游戏/我的档案）+ 快捷图标条
   移动端（≤760px）：导航项下沉为固定底部 Tab 栏（App 化），顶部只留快捷图标条
   依赖：core/i18n.js（先加载）；样式见 theme.css 的 .anav-* / .tabbar-*
   路径：根目录页面无前缀；games/<id>/ 下链接加 ../../；game/ 下加 ../。
   ============================================================ */

window.Arcade = window.Arcade || {};

(function () {
  
  var host = document.getElementById('arcade-nav');
  if (!host) return;

  /* 键盘无障碍：跳到主内容（D3）—— Tab 首键即可见 */
  var skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = document.getElementById('content') ? '#content' : '#game-root';
  skip.setAttribute('aria-label', T('nav.skip'));
  skip.textContent = T('nav.skip');
  var navParent = host.parentNode;
  if (navParent) navParent.insertBefore(skip, host);

  var path = (window.location.pathname || '').split('/').filter(Boolean);
  var last = path.length ? path[path.length - 1] : 'index.html';

  // 判定当前页
  var page;
  if (path.length >= 2 && path[path.length - 2] === 'game') page = 'games';
  else if (path.length >= 3 && path[path.length - 3] === 'games') page = last.replace('.html', '') || 'home';
  else page = last === 'index.html' ? 'home' : last.replace('.html', '');

  // 链接前缀：games/<id>/ → ../../ ；game/ → ../
  var prefix = '';
  if (path.length >= 3 && path[path.length - 3] === 'games') prefix = '../../';
  else if (path.length >= 2 && path[path.length - 2] === 'game') prefix = '../';

  // 暴露页面目录前缀（extras.js 搜索浮层等跨层链接使用）
  window.__arcadePagePrefix = prefix;

  var ITEMS = [
    { key: 'home', icon: '🏛️', href: 'index.html' },
    { key: 'chronicle', icon: '📜', href: 'stories.html' },
    { key: 'people', icon: '👤', href: 'people.html' },
    { key: 'artifacts', icon: '📎', href: 'artifacts.html' },
    { key: 'glossary', icon: '📖', href: 'glossary.html' },
    { key: 'discover', icon: '🧭', href: 'discover.html' },
    { key: 'games', icon: '🎮', href: 'games.html' },
    { key: 'profile', icon: '📊', href: 'stats.html' }
  ];

  function itemHtml(it) {
    var active = (page === it.key) ? ' on' : '';
    var cur = (page === it.key) ? ' aria-current="page"' : '';
    return '<a class="anav-item' + active + '" href="' + prefix + it.href + '" data-nav="' + it.key + '"' + cur + '>' +
      '<span class="anav-ic">' + it.icon + '</span>' +
      '<span class="anav-tx">' + T('nav.' + it.key) + '</span></a>';
  }

  /* 顶部导航（桌面完整；移动端仅保留快捷图标条，导航项由底部 Tab 承担） */
  var html = '<nav class="anav" aria-label="' + T('nav.label') + '">' +
    '<div class="anav-left">' + ITEMS.map(itemHtml).join('') + '</div>' +
    '<div class="anav-right" id="arcade-quickbar"></div>' +
    '</nav>';
  host.innerHTML = html;

  /* 底部 Tab 栏（移动端 App 化）：仅移动端显示；safe-area 由 CSS 处理 */
  var tabbar = document.createElement('nav');
  tabbar.className = 'tabbar';
  tabbar.setAttribute('aria-label', T('nav.label'));
  tabbar.innerHTML = ITEMS.map(function (it) {
    var active = (page === it.key) ? ' on' : '';
    var cur = (page === it.key) ? ' aria-current="page"' : '';
    return '<a class="tabbar-item' + active + '" href="' + prefix + it.href + '" data-nav="' + it.key + '"' + cur + '>' +
      '<span class="tabbar-ic">' + it.icon + '</span>' +
      '<span class="tabbar-tx">' + T('nav.' + it.key) + '</span></a>';
  }).join('');
  document.body.appendChild(tabbar);
  document.body.classList.add('has-tabbar');

  // 通知 extras.js 构建快捷图标条（导航条右侧）
  if (window.Arcade && Arcade.ui && Arcade.ui.ensureQuickbar) {
    try { Arcade.ui.ensureQuickbar(); } catch (e) {}
  }
})();
