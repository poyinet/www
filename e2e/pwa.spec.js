// @ts-check
/* PWA 真实验证：Service Worker 注册 / 主题 auto 跟随系统 / 离线兜底 */
const { test, expect } = require('@playwright/test');

test('Service Worker 真实注册并激活', async function ({ page }) {
  await page.goto('/');
  const status = await page.evaluate(async function () {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const reg = await navigator.serviceWorker.ready;
    return reg.active ? 'active' : 'pending';
  });
  expect(status).toBe('active');
});

test('主题 auto：跟随系统深浅色', async function ({ page }) {
  /* 深色系统 → 解析为 neon（不加 daylight class） */
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const darkClass = await page.evaluate(function () { return document.documentElement.className; });
  expect(darkClass).not.toContain('theme-daylight');

  /* 同一会话切到浅色 → 应出现 theme-daylight */
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(300);
  const lightClass = await page.evaluate(function () { return document.documentElement.className; });
  expect(lightClass).toContain('theme-daylight');
});

test('离线兜底：已缓存页面断网仍可打开', async function ({ page, context }, testInfo) {
  /* WebKit 对 setOffline + SW 导航存在已知内部错误（平台限制），仅 chromium/firefox 验证 */
  test.skip(testInfo.project.name === 'webkit', 'WebKit offline 模拟平台限制');
  await page.goto('/');
  /* 等 SW 接管 */
  await page.evaluate(async function () {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(function (resolve) {
        navigator.serviceWorker.addEventListener('controllerchange', resolve);
        setTimeout(resolve, 5000);
      });
    }
  });
  await context.setOffline(true);
  try {
    const resp = await page.goto('/games.html', { waitUntil: 'domcontentloaded' });
    /* SW network-first → 缓存兜底返回 200 */
    expect(resp.status()).toBe(200);
    await expect(page.locator('#content').first()).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
