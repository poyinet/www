// @ts-check
/* 代表性游戏（覆盖各分类 + 本轮改过的款）：真实加载 → 渲染非空 → GAME_RESTART 可调用且无异常 */
const { test, expect } = require('@playwright/test');

const GAMES = [
  'snake',          /* 街机 · 有滑动+方向键 */
  'g2048',          /* 街机 */
  'blocks',         /* 街机 · 屏幕按钮 */
  'sokoban',        /* 空间解谜 · 屏幕方向键 */
  'minesweeper',    /* 逻辑谜题 · 点按 */
  'sudoku',         /* 逻辑谜题 · 每日一题 */
  'caesar',         /* 密码破译 */
  'enigma',         /* 密码破译旗舰 · 含轰炸小游戏（C2 记分修复对象） */
  'typecode',       /* 一期 A3 屏幕键盘 */
  'm209'            /* 密码机 · 轮名 i18n */
];

function trackErrors(page, errors) {
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (msg) {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text().slice(0, 200));
  });
}

for (const id of GAMES) {
  test('游戏加载/渲染/重开: ' + id, async function ({ page }) {
    const errors = [];
    trackErrors(page, errors);
    await page.goto('/games/' + id + '/');
    /* 用「可见元素」断言：部分游戏的首子节点是合法隐藏的菜单浮层（如 snake 的 #menu） */
    await expect(page.locator('#game-root :visible').first()).toBeVisible({ timeout: 10_000 });

    /* 重开 API 存在且调用无异常 */
    const hasRestart = await page.evaluate(function () { return typeof window.GAME_RESTART === 'function'; });
    expect(hasRestart).toBeTruthy();
    await page.evaluate(function () { window.GAME_RESTART(); });
    await expect(page.locator('#game-root :visible').first()).toBeVisible();

    await page.waitForTimeout(500);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
}
