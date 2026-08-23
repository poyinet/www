// @ts-check
/* ① 全量游戏加载矩阵：105 款逐一「加载→渲染→重开」，任何一款被改坏当场暴露 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/* 仅在 chromium 项目执行（跨引擎由 pages/pwa 专项覆盖） */
test.beforeEach(function () {
  /* ⑥ 引擎交叉：Firefox 也跑全量矩阵（WebKit 较慢暂不跑） */
  test.skip(test.info().project.name === 'webkit', '全量矩阵跳过 webkit');
});

const src = fs.readFileSync(path.join(__dirname, '../assets/js/games.js'), 'utf8');
const IDS = [...src.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);

for (const id of IDS) {
  test('加载/渲染/重开: ' + id, async function ({ page }) {
    const errors = [];
    page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
    page.on('console', function (msg) {
      if (msg.type() === 'error') errors.push('console.error: ' + msg.text().slice(0, 200));
    });

    await page.goto('/games/' + id + '/');
    /* 可见元素断言：部分游戏首子节点是合法隐藏的菜单浮层 */
    await expect(page.locator('#game-root :visible').first()).toBeVisible({ timeout: 10_000 });

    const hasRestart = await page.evaluate(function () { return typeof window.GAME_RESTART === 'function'; });
    expect(hasRestart).toBeTruthy();
    await page.evaluate(function () { window.GAME_RESTART(); });
    await expect(page.locator('#game-root :visible').first()).toBeVisible();

    await page.waitForTimeout(250);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
}
