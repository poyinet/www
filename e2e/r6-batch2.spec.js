// @ts-check
/* 第六期批次二专项验证（chromium）：
   ① shamir 完整对局（三轮 × 五步通关 + BEST 上报）
   ② workshop 模式实验室：CTR 渲染 + 位错误扩散（CBC 多像素损毁 vs CTR 精确单像素）
   ③ workshop 隐写工坊：LSB 写入 → 提取往返、alpha 不动、肉眼不可见（改动像素占比小）
   ④ story.html modern 章出现 shamir 挂靠文案 */
const { test, expect } = require('@playwright/test');

test.beforeEach(function () {
  test.skip(test.info().project.name !== 'chromium', '仅 chromium');
});

async function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 160)); });
  return errors;
}

test('shamir：完整对局（三轮 × 五步通关 + BEST 上报）', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/shamir/', { waitUntil: 'networkidle' });
  await expect(page.locator('#game-root .sm-wrap')).toBeVisible({ timeout: 10_000 });

  const P = 101;
  let x1 = null, y1 = null, slope = null, done = false;
  for (let guard = 0; guard < 60 && !done; guard++) {
    const nxt = page.locator('#sm-next');
    if (await nxt.isVisible()) {
      if (/again|一局/i.test(await nxt.textContent())) { done = true; break; }
      await nxt.click();
      await page.waitForTimeout(150);
    }
    const stepTxt = await page.locator('#sm-step').innerText();
    if (stepTxt.indexOf('\u2460') >= 0) {           /* ① 分发验证 f(x)=a·x mod P */
      const a = parseInt(stepTxt.match(/a\s*=\s*(\d+)/)[1], 10);
      const xm = stepTxt.match(/#\s*(\d+)/) || stepTxt.match(/第\s*(\d+)\s*号/) || stepTxt.match(/x\s*=\s*(\d+)/);
      await page.locator('#sm-in').fill(String((a * parseInt(xm[1], 10)) % P));
      await page.locator('#sm-sub').click();
    } else if (stepTxt.indexOf('\u2461') >= 0) {    /* ② 门限 k=2 */
      await page.locator('#sm-opts button', { hasText: /^2$/ }).click();
    } else if (stepTxt.indexOf('\u2462') >= 0) {    /* ③ 收集判断 m≥2 → 能 */
      const enough = parseInt(stepTxt.match(/(\d+)/)[1], 10) >= 2;
      await page.locator('#sm-opts button').nth(enough ? 0 : 1).click();
    } else if (stepTxt.indexOf('\u2463') >= 0) {    /* ④ 相邻相减求斜率 */
      const pairs = stepTxt.match(/\((\d+),(\d+)\)/g);
      const p1 = pairs[0].match(/\((\d+),(\d+)\)/), p2 = pairs[1].match(/\((\d+),(\d+)\)/);
      x1 = parseInt(p1[1], 10); y1 = parseInt(p1[2], 10);
      slope = (parseInt(p2[2], 10) - y1 + P) % P;
      await page.locator('#sm-in').fill(String(slope));
      await page.locator('#sm-sub').click();
    } else if (stepTxt.indexOf('\u2464') >= 0) {    /* ⑤ 回归 x=0 还原 s */
      const s = ((y1 - x1 * slope) % P + P) % P;
      await page.locator('#sm-in').fill(String(s));
      await page.locator('#sm-sub').click();
    }
    await page.waitForTimeout(900);
  }
  expect(done, '60 步内未通关').toBeTruthy();
  await expect(page.locator('#sm-next')).toBeVisible();

  const best = await page.evaluate(() => localStorage.getItem('arcade_best_shamir'));
  expect(Number(best)).toBeGreaterThan(0);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('workshop 模式实验室：CTR 渲染 + 位错误扩散对照', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/workshop.html', { waitUntil: 'networkidle' });
  await page.locator('#ws-tab-modes').click();
  await expect(page.locator('#ml-ctr')).toBeVisible();

  const ctrStats = await page.evaluate(function () {
    var c = document.getElementById('ml-ctr').getContext('2d').getImageData(0, 0, 128, 128).data;
    var min = 255, max = 0;
    for (var i = 0; i < c.length; i += 4) { if (c[i] < min) min = c[i]; if (c[i] > max) max = c[i]; }
    return { min: min, max: max };
  });
  expect(ctrStats.max).toBeGreaterThan(0);

  await page.locator('#ml-err-go').click();
  await page.waitForTimeout(200);
  const diff = await page.evaluate(function () {
    function data(id) { return document.getElementById(id).getContext('2d').getImageData(0, 0, 128, 128).data; }
    var plain = data('ml-err-plain'), cbc = data('ml-err-cbc'), ctr = data('ml-err-ctr');
    function diffCount(a, b) { var n = 0; for (var i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 2) n++; return n; }
    return { cbc: diffCount(plain, cbc), ctr: diffCount(plain, ctr) };
  });
  expect(diff.ctr).toBeLessThanOrEqual(2);       /* CTR 精确到比特：仅错位覆盖的单像素 */
  expect(diff.cbc).toBeGreaterThan(diff.ctr);    /* CBC 整块花掉，受损面更大 */
  await expect(page.locator('#ml-err-pos')).toContainText(/⚡/);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('workshop 隐写工坊：写入 → 提取往返 + alpha 不动 + 肉眼不可见', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/workshop.html', { waitUntil: 'networkidle' });
  await page.locator('#ws-tab-stego').click();
  await expect(page.locator('#stg-cap')).toContainText(/192/);

  const MSG = 'STEALTHY PIGEON MEETS AT DAWN 42';
  await page.locator('#stg-secret').fill(MSG);

  const before = await page.evaluate(function () {
    var d = document.getElementById('stg-view').getContext('2d').getImageData(0, 0, 192, 192).data;
    return Array.prototype.slice.call(d);
  });
  await page.locator('#stg-write').click();
  await expect(page.locator('#stg-msg')).toContainText(/✓/);

  const after = await page.evaluate(function () {
    var d = document.getElementById('stg-view').getContext('2d').getImageData(0, 0, 192, 192).data;
    return Array.prototype.slice.call(d);
  });
  for (let i = 3; i < after.length; i += 4) {
    if (after[i] !== 255) throw new Error('alpha channel modified at byte ' + i);
  }
  let touched = 0;
  const total = 192 * 192;
  for (let p = 0; p < total; p++) {
    const o = p * 4;
    if (before[o] !== after[o] || before[o + 1] !== after[o + 1] || before[o + 2] !== after[o + 2]) touched++;
  }
  expect(touched / total).toBeLessThan(0.2);     /* 只动 LSB：绝大多数像素不变 */

  await page.locator('#stg-extract').click();
  await expect(page.locator('#stg-out')).toHaveText(MSG);

  await page.locator('#stg-plane-chips .ws-sample').last().click();  /* bit 0 平面 */
  await page.waitForTimeout(100);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

for (const lang of ['zh', 'en']) {
  test('story modern 章：shamir 挂靠文案（' + lang + '）', async function ({ page }) {
    const errors = await trackErrors(page);
    await page.addInitScript(function (l) {
      try { localStorage.setItem('arcade_lang', l); } catch (e) { }
    }, lang);
    await page.goto('/story.html?id=modern', { waitUntil: 'networkidle' });
    const root = page.locator('#sy-root');
    await expect(root).toBeVisible({ timeout: 10_000 });
    const text = await root.innerText();
    expect(text).toMatch(lang === 'zh' ? /Shamir 分钥密约/ : /Shamir Split-Key Pact/);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
}
