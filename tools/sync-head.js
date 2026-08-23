/* ============================================================
   破译 DECODE ARCADE · HTML 头批量同步器（PWA meta + 字体 preload + 语言探测）
   用法：node tools/sync-head.js
   作用（全部幂等，可重复运行）：
   1. viewport 增加 viewport-fit=cover（刘海屏安全区适配，保留无障碍缩放）
   2. 在 theme-color 之后插入 PWA head 块（manifest / apple 系 meta / apple 图标）
   3. 插入字体 preload（S5）：Press Start 2P 无条件 preload；
      内联脚本按浏览器语言设置 <html lang>（zh/en），仅 zh 动态 preload 中文像素字体
      （英文界面不 preload 中文字体，且 theme.css 的 html[lang="en"] 覆盖令其永不下载）
   4. 在 </body> 前注入 pwa.js（注册 Service Worker；根页面与游戏页路径自动适配）
   覆盖范围：根目录 *.html + games 目录下每款游戏的 index.html
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VIEWPORT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
const HEAD_BLOCK =
  '  <link rel="manifest" href="/manifest.webmanifest">\n' +
  '  <meta name="mobile-web-app-capable" content="yes">\n' +
  '  <meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
  '  <meta name="apple-mobile-web-app-title" content="破译游戏">\n' +
  '  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">';

/* 字体路径前缀：根页面 assets/fonts/，游戏页（games/<id>/）为 ../../assets/fonts/ */
function fontSrc(file) {
  return file.split(path.sep).includes('games') ? '../../assets/fonts/' : 'assets/fonts/';
}

/* 字体 preload + 语言探测块（幂等标记：press-start-2p.woff2" as="font） */
function preloadBlock(src) {
  return (
    '  <!-- 字体 preload（S5）：Press Start 2P 无条件；中文像素字仅 zh（内联脚本探测语言） -->\n' +
    '  <link rel="preload" href="' + src + 'press-start-2p.woff2" as="font" type="font/woff2" crossorigin>\n' +
    '  <script>\n' +
    '  (function(){var K="arcade_lang",lang="zh";try{var s=localStorage.getItem(K);if(s==="zh"||s==="en"){lang=s;}else{lang=/^zh/i.test(navigator.language||navigator.userLanguage||"")?"zh":"en";}}catch(e){}var de=document.documentElement;if(de){de.setAttribute("lang",lang==="en"?"en":"zh-CN");}if(lang==="en"){return;}var l=document.createElement("link");l.rel="preload";l.as="font";l.type="font/woff2";l.crossOrigin="anonymous";l.href="' + src + 'fusion-pixel-site.woff2";document.head.appendChild(l);})();\n' +
    '  </script>'
  );
}

function collectHtml() {
  const files = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (/\.html$/.test(f)) files.push(path.join(ROOT, f));
  }
  const gamesDir = path.join(ROOT, 'games');
  if (fs.existsSync(gamesDir)) {
    for (const id of fs.readdirSync(gamesDir)) {
      const p = path.join(gamesDir, id, 'index.html');
      if (fs.existsSync(p)) files.push(p);
    }
  }
  return files.sort();
}

let changed = 0, ok = 0;
for (const file of collectHtml()) {
  let html = fs.readFileSync(file, 'utf8');
  let orig = html;
  // 根页面脚本路径 assets/js/pwa.js；游戏页（games/<id>/）为 ../../assets/js/pwa.js
  const pwaSrc = file.split(path.sep).includes('games') ? '../../assets/js/pwa.js' : 'assets/js/pwa.js';
  const fontPrefix = fontSrc(file);

  /* 1. viewport */
  if (!/viewport-fit=cover/.test(html)) {
    html = html.replace(
      /(<meta name="viewport" content=")[^"]*(">)/,
      (m, a, b) => a + VIEWPORT + b
    );
  }

  /* 2. PWA head 块（插在 theme-color 之后；无 theme-color 则插在 viewport 之后） */
  if (!/rel="manifest"/.test(html)) {
    const anchor = /(<meta name="theme-color"[^>]*>)/;
    if (anchor.test(html)) {
      html = html.replace(anchor, '$1\n' + HEAD_BLOCK);
    } else {
      html = html.replace(
        /(<meta name="viewport"[^>]*>)/,
        '$1\n' + HEAD_BLOCK
      );
    }
  }

  /* 3. 字体 preload + 语言探测（插在 theme-color / manifest 之后，theme.css 之前；
        确保内联脚本先设置 <html lang>，CSS 的 html[lang="en"] 覆盖才能生效） */
  if (!/press-start-2p\.woff2" as="font"/.test(html)) {
    const anchor = /(<link rel="stylesheet" href="[^"]*theme\.css">)/;
    if (anchor.test(html)) {
      html = html.replace(anchor, preloadBlock(fontPrefix) + '\n$1');
    } else {
      html = html.replace(/(<meta name="theme-color"[^>]*>)/, '$1\n' + preloadBlock(fontPrefix));
    }
  }

  /* 4. pwa.js 注入（</body> 前；已含则跳过） */
  if (!html.includes('pwa.js')) {
    html = html.replace(/<\/body>/, '  <script src="' + pwaSrc + '"></script>\n</body>');
  }

  if (html !== orig) {
    fs.writeFileSync(file, html);
    changed++;
    console.log('✓ 更新 ' + path.relative(ROOT, file));
  } else {
    ok++;
  }
}
console.log('---\n共 ' + (changed + ok) + ' 个 HTML：更新 ' + changed + '，已同步 ' + ok);
