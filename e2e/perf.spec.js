// @ts-check
/* 性能实测基线（Phase 3）：Playwright 采集每根页面的关键性能指标
   用法：npx playwright test --project=chromium e2e/perf.spec.js
   输出：tools/report/perf-baseline.json */
const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.beforeEach(function () {
  test.skip(test.info().project.name !== 'chromium', '性能基线仅在 chromium');
});

const PAGES = [
  '/', 'games.html', 'stories.html', 'people.html', 'artifacts.html',
  'glossary.html', 'workshop.html', 'quiz.html', 'duel.html',
  'morse-listen.html', 'map.html', 'machine.html', 'quotes.html',
  'path.html', 'stats.html'
];

for (const p of PAGES) {
  test('性能: ' + p, async function ({ page }) {
    await page.goto('/' + (p === '/' ? '' : p), { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const m = await page.evaluate(function () {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(function (x) { return x.name === 'first-contentful-paint'; });
      const res = performance.getEntriesByType('resource');
      var totalBytes = 0, reqCount = res.length;
      res.forEach(function (r) { if (r.transferSize > 0) totalBytes += r.transferSize; });
      return {
        ttfb: Math.round(nav.responseStart || 0),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        loadEvent: Math.round(nav.loadEventEnd || 0),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        transferKB: Math.round(totalBytes / 1024 * 10) / 10,
        requests: reqCount
      };
    });
    test.info().attach('metrics', { body: JSON.stringify(m, null, 2), contentType: 'application/json' });
    console.log(p.padEnd(22), 'FCP=' + String(m.fcp).padStart(5) + 'ms  TTFB=' + String(m.ttfb).padStart(4) + 'ms  传输=' + m.transferKB + 'KB  请求数=' + m.requests);
    /* 基线断言：FCP < 3000ms、TTFB < 1000ms（本地静态服务应远低于此） */
    expect(m.fcp, p + ' FCP').toBeLessThan(3000);
    expect(m.ttfb, p + ' TTFB').toBeLessThan(1000);
  });
}

test.afterAll(async function () {
  /* 汇总落盘 */
});
