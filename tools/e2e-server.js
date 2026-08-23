/* ============================================================
   E2E 专用本地静态服务器（零依赖）—— 供 Playwright webServer 使用
   用法：node tools/e2e-server.js [port]
   仅服务本目录静态文件；MIME 覆盖站点全部资源类型。
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PORT = parseInt(process.argv[2] || process.env.PORT || '4173', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.xsl': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

const server = http.createServer(function (req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const abs = path.normalize(path.join(ROOT, urlPath));
  /* 防目录穿越 */
  if (!abs.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(abs, function (err, buf) {
    if (err) {
      /* SPA 式兜底：未知路径回 404.html（与 GitHub Pages 行为一致） */
      fs.readFile(path.join(ROOT, '404.html'), function (e2, buf404) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e2 ? '404' : buf404);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, function () {
  console.log('e2e-server listening on http://localhost:' + PORT);
});
