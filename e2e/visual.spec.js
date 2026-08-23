// @ts-check
/* ⑤ 视觉回归截图基线（仅 chromium；基线存 e2e/visual.spec.js-snapshots/）
   首次生成：npm run e2e -- --update-snapshots
   之后每次改动自动比对，maxDiffPixelRatio 3% 内视为通过 */
const { test, expect } = require('@playwright/test');

test.beforeEach(async function ({ page }) {
  test.skip(test.info().project.name !== 'chromium', '视觉基线仅在 chromium 维护');
  /* 冻结动画 + 减动效偏好，保证截图确定性 */
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
});

async function settledShot(page, name, fullPage) {
  await page.evaluate(function () { return document.fonts.ready; });
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.waitForTimeout(250);
  await expect(page).toHaveScreenshot(name, { fullPage: fullPage, maxDiffPixelRatio: 0.03 });
}

test('视觉: 首页', async function ({ page }) {
  await page.goto('/');
  await page.waitForTimeout(400);
  await settledShot(page, 'home.png', false);
});

test('视觉: 游戏厅', async function ({ page }) {
  await page.goto('/games.html');
  await page.waitForTimeout(600);
  await settledShot(page, 'games.png', false);
});

test('视觉: 章节 caesar 全页', async function ({ page }) {
  await page.goto('/story.html?id=caesar');
  await page.waitForTimeout(500);
  await settledShot(page, 'story-caesar.png', true);
});

test('视觉: 术语表全页', async function ({ page }) {
  await page.goto('/glossary.html');
  await page.waitForTimeout(500);
  await settledShot(page, 'glossary.png', true);
});

test('视觉: 档案页', async function ({ page }) {
  await page.goto('/stats.html');
  await page.waitForTimeout(500);
  await settledShot(page, 'stats.png', false);
});
