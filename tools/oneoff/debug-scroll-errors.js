/* 复现：滚动全页，捕获带堆栈的 pageerror */
const { chromium } = require('@playwright/test');
(async function () {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', function (e) {
    errs.push(e.message + ' ||| ' + (e.stack || '').split('\n').slice(1, 4).join(' @ '));
  });
  await p.goto('http://localhost:4173/protocols.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const cards = await p.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('.pl-card'), function (c) { return c.id; });
  });
  for (const id of cards) {
    await p.evaluate(function (id2) { document.getElementById(id2).scrollIntoView({ block: 'start' }); }, id);
    await p.waitForTimeout(350);
    console.log(id, 'scrolled, errs so far:', errs.length);
  }
  await p.waitForTimeout(500);
  console.log('--- errors ---');
  errs.forEach(function (e, i) { console.log('[' + (i + 1) + '] ' + e.slice(0, 500)); });
  if (!errs.length) console.log('(none)');
  await b.close();
})();
