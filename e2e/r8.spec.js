// @ts-check
/* 第八期专项验证（chromium）：
   ① sm4 完整对局（12 题推进 + 官方向量徽章 + BEST）
   ② acrostic 五诗通关（首字高亮验证）③ phishhunt 八封连判
   ④ protocols：ChaCha20 单步 / A5/1 密钥流 ⑤ machine.html AES 四拍动画 */
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

test('sm4：完整对局 + 向量自检徽章 + BEST 上报', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/sm4/', { waitUntil: 'networkidle' });
  await expect(page.locator('#s4-badge')).toContainText(/✓/, { timeout: 10_000 });

  let done = false;
  for (let q = 0; q < 40 && !done; q++) {
    if (/全部通关|all three rounds/i.test(await page.locator('#s4-msg').textContent())) { done = true; break; }
    const before = await page.locator('#s4-prog').textContent();
    for (let b = 0; b < 4; b++) {
      let clicked = true;
      try {
        await page.locator('#s4-opts button').nth(b).click({ timeout: 1200 });
      } catch (e) { clicked = false; }
      if (!clicked) continue;
      await page.waitForTimeout(880);
      const msg = await page.locator('#s4-msg').textContent();
      const prog = await page.locator('#s4-prog').textContent();
      if (/全部通关|all three rounds/i.test(msg)) { done = true; break; }
      if (prog !== before || /第 \d+ 轮通关|Round \d cleared/i.test(msg)) break;
    }
    if (done) break;
    /* 轮间推进 */
    try { await page.locator('#s4-next').click({ timeout: 800 }); await page.waitForTimeout(250); } catch (e) { }
  }
  expect(done, '40 题内未通关').toBeTruthy();

  await page.waitForTimeout(400);
  const best = await page.evaluate(() => localStorage.getItem('arcade_best_sm4'));
  expect(Number(best)).toBeGreaterThan(0);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('acrostic：五诗通关且答对后首字高亮', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/acrostic/', { waitUntil: 'networkidle' });
  let done = false;
  for (let g = 0; g < 30 && !done; g++) {
    const before = await page.locator('#ac-prog').textContent();
    const btns = page.locator('#ac-opts button');
    const n = await btns.count();
    for (let b = 0; b < n; b++) {
      if ((await page.locator('#ac-prog').textContent()) !== before) break;
      await btns.nth(b).click();
      await page.waitForTimeout(1250);
    }
    if (!(await page.locator('#ac-next').isHidden())) {
      done = true;
    }
  }
  expect(done, '30 轮内未通关').toBeTruthy();
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('phishhunt：八封连判 + 线索亮出', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/phishhunt/', { waitUntil: 'networkidle' });

  for (let i = 0; i < 8; i++) {
    await expect(page.locator('#ph-mail .ph-from')).toBeVisible({ timeout: 10_000 });
    await page.locator('#ph-real').click();          /* 判断对错不影响流程 */
    await page.waitForTimeout(1750);
    if (i < 7) {
      const clueHidden = await page.locator('#ph-clues').evaluate(el => !el.classList.contains('on'));
      expect(clueHidden, '下一封开始时线索应已收起').toBeTruthy();
    }
  }
  await expect(page.locator('#ph-msg')).toContainText(/🎣/);
  await expect(page.locator('#ph-next')).toBeVisible();

  const best = await page.evaluate(() => localStorage.getItem('arcade_best_phishhunt'));
  expect(Number(best)).toBeGreaterThan(0);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('protocols：ChaCha20 单步与 A5/1 密钥流', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#pl-ready')).toHaveText('9', { timeout: 10_000 });

  await page.locator('#cc-step').scrollIntoViewIfNeeded();
  for (let i = 0; i < 3; i++) { await page.locator('#cc-step').click(); await page.waitForTimeout(60); }
  await expect(page.locator('#cc-stat')).toContainText(/3\/64/);
  await expect(page.locator('#cc-grid td.hot')).toHaveCount(1);   /* 第 3 步是旋转：仅 d 一格 */

  await page.locator('#a51-step').scrollIntoViewIfNeeded();
  for (let i = 0; i < 5; i++) { await page.locator('#a51-step').click(); await page.waitForTimeout(50); }
  await expect(page.locator('#a51-stream')).toContainText(/\(5 bits\)/);
  await page.locator('#a51-fast').click();
  await page.waitForTimeout(150);
  await expect(page.locator('#a51-stream')).toContainText(/\(105 bits\)/);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('machine：AES 卡四拍动画渲染', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/machine.html', { waitUntil: 'networkidle' });
  await page.locator('#cm-nav button', { hasText: 'AES' }).click();
  await expect(page.locator('#aes-lab')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#aes-grid .aes-cell')).toHaveCount(16);

  await page.locator('.aes-steps button[data-step="1"]').click();
  await page.waitForTimeout(120);
  await expect(page.locator('#aes-note')).not.toBeEmpty();
  await expect(page.locator('.aes-steps button.on')).toHaveCount(1);

  await page.locator('#aes-auto').click();
  await page.waitForTimeout(2100);
  await page.locator('#aes-auto').click();   /* 停止自动播放，不残留 interval */
  await page.waitForTimeout(100);
  expect(errors, errors.join('\n')).toHaveLength(0);
});
