// @ts-check
/* ② 真实交互流程：测验完整答题 / 工坊加解密往返 / 地图事件点击（仅 chromium） */
const { test, expect } = require('@playwright/test');

test.beforeEach(function () {
  test.skip(test.info().project.name !== 'chromium', '交互流仅在 chromium 跑');
});

test('测验：完整答完 10 题并出现段位结果', async function ({ page }) {
  const errors = [];
  page.on('pageerror', function (e) { errors.push(e.message); });
  await page.goto('/quiz.html');
  await page.click('#qz-go');
  for (let i = 0; i < 10; i++) {
    await page.locator('.qz-opt').first().click();
    await page.click('#qz-next');
  }
  await expect(page.locator('.score-line')).toContainText('/');
  await expect(page.locator('#qz-again')).toBeVisible();
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('错题本深链 #wrong 直接进入练习模式', async function ({ page }) {
  /* 先取一道真实题干作种子，并直接写入当前源的 localStorage */
  await page.goto('/quiz.html');
  const q = await page.evaluate(function () { return window.QUIZ.BANK[0].zh.q; });
  await page.evaluate(function (question) {
    localStorage.setItem('arcade_quiz_wrong', JSON.stringify({ [question]: { wrong: 2, streak: 0 } }));
  }, q);
  /* 带查询参数强制完整加载（同文档仅加 hash 不会重跑初始化） */
  await page.goto('/quiz.html?v=e2e#wrong');
  /* 练习模式：只有 1 题，直接是题目卡 */
  await expect(page.locator('.qz-card')).toBeVisible();
  await expect(page.locator('.qz-progress .num')).toContainText('1/1');
  await page.locator('.qz-opt').first().click();
  await page.click('#qz-next');
  await expect(page.locator('h2')).toContainText(/错题重练完成|Practice round complete/i);
});

test('工坊：凯撒加密 UI 输出正确且 API 解密往返一致', async function ({ page }) {
  const errors = [];
  page.on('pageerror', function (e) { errors.push(e.message); });
  await page.goto('/workshop.html');
  const plain = 'E2E ROUNDTRIP';
  await page.selectOption('#ws-enc-algo', 'caesar');
  await page.fill('#ws-enc-key', '3');
  await page.fill('#ws-enc-plain', plain);
  await page.click('#ws-enc-go');
  const out = await page.textContent('#ws-enc-out');

  /* 与同规则实现的期望值比对（A-Z 后移 3，其余原样） */
  const expected = plain.replace(/[A-Z]/g, function (c) {
    return String.fromCharCode((c.charCodeAt(0) - 65 + 3) % 26 + 65);
  });
  expect(out).toBe(expected);

  const back = await page.evaluate(function (_ref) {
    return window.Workshop.dec(_ref.algo, _ref.out, _ref.key);
  }, { algo: 'caesar', out: out, key: '3' });
  expect(back).toBe(plain);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('地图：点击事件点弹出详情并含探索链接', async function ({ page }) {
  const errors = [];
  page.on('pageerror', function (e) { errors.push(e.message); });
  await page.goto('/map.html');
  await page.locator('.mp-list').getByText(/罗塞塔|Rosetta/).first().click();
  await expect(page.locator('.mp-detail')).toBeVisible();
  await expect(page.locator('.mp-detail')).toContainText(/去探索|Explore/);
  expect(errors, errors.join('\n')).toHaveLength(0);
});
