// @ts-check
/* 全部根页面：真实浏览器加载 → 无未捕获异常 / 无 console error / 主容器渲染 */
const { test, expect } = require('@playwright/test');

const PAGES = [
  '/', 'games.html', 'stories.html', 'people.html', 'artifacts.html',
  'glossary.html', 'workshop.html', 'quiz.html', 'duel.html',
  'morse-listen.html', 'map.html', 'machine.html', 'quotes.html',
  'path.html', 'stats.html'
];
const STORY = 'story.html?id=caesar';

function trackErrors(page, errors) {
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (msg) {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text().slice(0, 200));
  });
}

for (const p of PAGES) {
  test('页面加载无错误: ' + p, async function ({ page }) {
    const errors = [];
    trackErrors(page, errors);
    const resp = await page.goto(p);
    expect(resp.status()).toBe(200);
    await expect(page.locator('#content').first()).toBeVisible();
    await page.waitForTimeout(600); /* 留出异步初始化 */
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
}

test('章节页加载无错误: ' + STORY, async function ({ page }) {
  const errors = [];
  trackErrors(page, errors);
  const resp = await page.goto(STORY);
  expect(resp.status()).toBe(200);
  await expect(page.locator('#sy-root')).toBeVisible();
  await page.waitForTimeout(800);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('404 页可用', async function ({ page }) {
  const resp = await page.goto('404.html');
  expect(resp.status()).toBe(200);
  await expect(page.locator('body')).toContainText(/404|破译/i);
});
