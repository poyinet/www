// @ts-check
/* ① 游玩过程探针：加载后模拟一段真实输入突发（方向键/空格/回车/点击），
   捕获游戏循环运行期的未捕获异常 —— 补「只测加载+重开」的盲区。仅 chromium。 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.beforeEach(function () {
  test.skip(test.info().project.name !== 'chromium', '探针仅在 chromium 跑');
});

const src = fs.readFileSync(path.join(__dirname, '../assets/js/games.js'), 'utf8');
const IDS = [...src.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);

for (const id of IDS) {
  test('游玩探针: ' + id, async function ({ page }) {
    const errors = [];
    page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message.slice(0, 160)); });
    page.on('console', function (msg) {
      if (msg.type() === 'error') errors.push('console.error: ' + msg.text().slice(0, 160));
    });

    await page.goto('/games/' + id + '/', { waitUntil: 'networkidle' });
    await expect(page.locator('#game-root :visible').first()).toBeVisible({ timeout: 10_000 });

    /* 输入突发：方向键×4、空格/回车、画布中心点击×2、可见按钮点击×1 */
    const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Space', 'Enter'];
    for (const k of keys) await page.keyboard.press(k);
    const root = page.locator('#game-root');
    try {
      const bb = await root.boundingBox();
      if (bb) {
        await page.mouse.click(bb.x + bb.width / 2, bb.y + Math.min(bb.height / 2, 200));
        await page.mouse.click(bb.x + bb.width / 2, bb.y + Math.min(bb.height / 2, 200));
      }
      const btn = page.locator('#game-root :visible button').first();
      if (await btn.count()) await btn.click({ timeout: 1000 });
    } catch (e) { /* 无可点元素属正常 */ }
    await page.waitForTimeout(900);

    expect(errors, id + ' 游玩过程异常:\n' + errors.join('\n')).toHaveLength(0);
  });
}
