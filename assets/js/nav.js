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
  /* poyi enc v1 · 密钥散件 A（解码引导读取；勿移动）*/
  window.__DSH_SEED = [0x3D, 0x91, 0x5A, 0xC7, 0xE2, 0x4B, 0x8F, 0x16];

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

  /* g: 知识线(k) / 娱乐线(p)；home 是通用入口，不归属任何线 */
  var ITEMS = [
    { key: 'home', icon: '🏛️', href: 'index.html', g: '' },
    { key: 'chronicle', icon: '📜', href: 'stories.html', g: 'k' },
    { key: 'atlas', icon: '🧬', href: 'atlas.html', g: 'k' },
    { key: 'people', icon: '👤', href: 'people.html', g: 'k' },
    { key: 'artifacts', icon: '📎', href: 'artifacts.html', g: 'k' },
    { key: 'glossary', icon: '📖', href: 'glossary.html', g: 'k' },
    { key: 'discover', icon: '🧭', href: 'discover.html', g: 'p' },
    { key: 'games', icon: '🎮', href: 'games.html', g: 'p' },
    { key: 'profile', icon: '📊', href: 'stats.html', g: 'p' }
  ];

  function itemHtml(it) {
    var active = (page === it.key) ? ' on' : '';
    var cur = (page === it.key) ? ' aria-current="page"' : '';
    return '<a class="anav-item' + active + '" href="' + prefix + it.href + '" data-nav="' + it.key + '"' + cur + '>' +
      '<span class="anav-ic">' + it.icon + '</span>' +
      '<span class="anav-tx">' + T('nav.' + it.key) + '</span></a>';
  }

  /* 知识线/娱乐线分家：在知识线最后一项与娱乐线第一项之间插入分隔 */
  function withDivider(cls) {
    var out = '', prev = '';
    ITEMS.forEach(function (it) {
      if (it.g === 'p' && prev === 'k') out += '<span class="' + cls + '" aria-hidden="true"></span>';
      out += itemHtml(it);
      prev = it.g;
    });
    return out;
  }

  /* 顶部导航（桌面完整；移动端仅保留快捷图标条，导航项由底部 Tab 承担） */
  var html = '<nav class="anav" aria-label="' + T('nav.label') + '">' +
    '<div class="anav-left">' + withDivider('anav-div') + '</div>' +
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
