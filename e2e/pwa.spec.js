// @ts-check
/* PWA 真实验证：Service Worker 注册 / 双主题（默认街机·不跟随系统）/ 离线兜底 */
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

test('主题：默认街机，不随系统深浅色变化；手动切换生效', async function ({ page }) {
  /* 系统深色 → 默认仍为街机（不加 daylight class），且不随系统切换 */
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const darkCls = await page.evaluate(function () { return document.documentElement.className; });
  expect(darkCls).not.toContain('theme-daylight');

  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(300);
  const lightCls = await page.evaluate(function () { return document.documentElement.className; });
  expect(lightCls).not.toContain('theme-daylight');

  /* 快捷栏主题按钮（第 4 个）点击一次 → 晨光；再点 → 回街机 */
  const btn = page.locator('#arcade-quickbar button').nth(3);
  await btn.click();
  await page.waitForTimeout(200);
  await expect(page.locator('html')).toHaveClass(/theme-daylight/);
  await btn.click();
  await page.waitForTimeout(200);
  await expect(page.locator('html')).not.toHaveClass(/theme-daylight/);
});

test('主题迁移：历史 auto/下线主题一律落到街机', async function ({ page }) {
  await page.addInitScript(function () {
    try { localStorage.setItem('arcade_settings', JSON.stringify({ theme: 'auto' })); } catch (e) { }
  });
  await page.goto('/');
  const saved = await page.evaluate(function () {
    return JSON.parse(localStorage.getItem('arcade_settings')).theme;
  });
  expect(saved).toBe('neon');
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
