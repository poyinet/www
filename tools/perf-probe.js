/* plan-3 P3 · 性能实测基线：Playwright 采集每根页面 FCP/LCP/DOMContentLoaded/传输体积
   用法：先起 tools/e2e-server.js，再 node tools/perf-probe.js
   输出：tools/report/perf-baseline.json */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:4173';
const PAGES = ['index.html', 'games.html', 'stories.html', 'people.html', 'artifacts.html',
  'glossary.html', 'stats.html', 'workshop.html', 'quiz.html', 'duel.html',
  'morse-listen.html', 'path.html', 'map.html', 'machine.html', 'protocols.html', 'quotes.html', '404.html'];
/* 游戏页抽样 3 款（重/中/轻） */
const GAMES = ['games/enigma/index.html', 'games/bb84/index.html', 'games/guess/index.html'];

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const p of [...PAGES, ...GAMES]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let transfer = 0;
    page.on('response', async r => {
      try { transfer += (await r.body()).length; } catch (e) {}
    });
    const t0 = Date.now();
    await page.goto(BASE + '/' + p, { waitUntil: 'load' });
    const loadMs = Date.now() - t0;
    const m = await page.evaluate(() => new Promise(res => {
      setTimeout(() => {
        const paint = performance.getEntriesByType('paint');
        const fcpE = paint.find(p => p.name === 'first-contentful-paint');
        let lcp = null;
        try {
          const lcpE = performance.getEntriesByType('largest-contentful-paint');
          if (lcpE && lcpE.length) lcp = Math.round(lcpE[lcpE.length - 1].startTime);
        } catch (e) {}
        res({
          fcp: fcpE ? Math.round(fcpE.startTime) : null,
          lcp,
          dcl: Math.round(performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart)
        });
      }, 800);
    }));
    results.push({ page: p, fcpMs: m.fcp, lcpMs: m.lcp, dclMs: m.dcl, loadMs, transferKB: Math.round(transfer / 1024) });
    await ctx.close();
  }
  await browser.close();

  /* 慢页 Top5 */
  const sorted = [...results].sort((a, b) => (b.lcpMs || b.loadMs) - (a.lcpMs || a.loadMs));
  const out = {
    date: new Date().toISOString().slice(0, 10),
    env: 'localhost:4173 (no network throttling)',
    pages: results,
    slowTop5: sorted.slice(0, 5).map(r => ({ page: r.page, lcpMs: r.lcpMs }))
  };
  fs.writeFileSync(path.join(__dirname, 'report', 'perf-baseline.json'), JSON.stringify(out, null, 1));
  console.log('=== 性能基线（本地无节流）===');
  for (const r of results) console.log(r.page.padEnd(30), 'FCP', String(r.fcpMs).padStart(5), '| LCP', String(r.lcpMs).padStart(5), '| 传输', String(r.transferKB).padStart(4), 'KB');
  console.log('\n慢页 Top5:', out.slowTop5.map(x => x.page + '(' + x.lcpMs + 'ms)').join(' · '));
})().catch(e => { console.error(e.message); process.exit(1); });
