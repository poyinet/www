// @ts-check
/* 第六期批次一专项验证（chromium）：
   ① rsa 完整对局（三轮 × 五步全对通关 + BEST 上报）
   ② rsa 提示扣分与重开钩子（推进到第 4 步）
   ③ hashlab 生日攻击观测台（截断指纹碰撞捕获 / 宽度切换 / 清零）
   ④ story.html modern 章碰撞史段落与 [[wangxy]] 人物 chip（zh/en） */
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

/* 按题面解出当前步答案：p,q 取自 given 面板；步别取自题面序号字符 ①..⑤（跨语言） */
async function solveCurrentStep(page) {
  const given = await page.locator('#rs-given').innerText();
  const p = parseInt(given.match(/p\s*=\s*(\d+)/)[1], 10);
  const q = parseInt(given.match(/q\s*=\s*(\d+)/)[1], 10);
  const n = p * q, phi = (p - 1) * (q - 1);
  const stepTxt = await page.locator('#rs-step').innerText();
  const gcdv = (a, b) => (b ? gcdv(b, a % b) : a);
  if (stepTxt.indexOf('\u2460') >= 0) return { kind: 'input', ans: String(n) };
  if (stepTxt.indexOf('\u2461') >= 0) return { kind: 'input', ans: String(phi) };
  if (stepTxt.indexOf('\u2462') >= 0) {
    const btns = page.locator('#rs-opts button');
    const cnt = await btns.count();
    for (let i = 0; i < cnt; i++) {
      const v = parseInt((await btns.nth(i).textContent()).match(/(\d+)/)[1], 10);
      if (gcdv(v, phi) === 1) return { kind: 'opt', idx: i };
    }
    return { kind: 'opt', idx: 0 };
  }
  if (stepTxt.indexOf('\u2463') >= 0) {
    const e = parseInt(stepTxt.match(/e\s*=\s*(\d+)/)[1], 10);
    let d = 1;
    while ((e * d) % phi !== 1) d++;
    return { kind: 'input', ans: String(d) };
  }
  /* ⑤ c = mv^e mod n —— 公式布局 zh/en 一致 */
  const m5 = stepTxt.match(/c\s*=\s*(\d+)\^(\d+)\s*mod\s*(\d+)/);
  const mv = parseInt(m5[1], 10), e = parseInt(m5[2], 10), mod = parseInt(m5[3], 10);
  let c = 1, base = mv % mod, ex = e;
  while (ex > 0) { if (ex & 1) c = (c * base) % mod; base = (base * base) % mod; ex >>= 1; }
  return { kind: 'input', ans: String(c) };
}

test('rsa：完整对局（三轮全对通关 + BEST 上报）', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/rsa/', { waitUntil: 'networkidle' });
  await expect(page.locator('#game-root .rs-wrap')).toBeVisible({ timeout: 10_000 });

  let done = false;
  for (let guard = 0; guard < 60 && !done; guard++) {
    const nxt = page.locator('#rs-next');
    if (await nxt.isVisible()) {
      /* 终局标签是「再来一局/Play again」；轮间是「下一轮/Next lock」 */
      if (/again|一局/i.test(await nxt.textContent())) { done = true; break; }
      await nxt.click();
    }
    await expect(page.locator('#rs-step')).not.toBeEmpty();
    const r = await solveCurrentStep(page);
    if (r.kind === 'opt') await page.locator('#rs-opts button').nth(r.idx).click();
    else { await page.locator('#rs-in').fill(r.ans); await page.locator('#rs-sub').click(); }
    await page.waitForTimeout(900);
  }
  expect(done, '60 步内未通关').toBeTruthy();
  await expect(page.locator('#rs-msg')).toContainText(/\d{2,}/);
  await expect(page.locator('#rs-next')).toBeVisible();

  const best = await page.evaluate(() => localStorage.getItem('arcade_best_rsa'));
  expect(Number(best)).toBeGreaterThan(0);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('rsa：提示扣分与重开钩子', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/rsa/', { waitUntil: 'networkidle' });

  /* 自同步推进到第 4 步 */
  for (let guard = 0; guard < 20; guard++) {
    if (await page.locator('#rs-hint').isVisible()) break;
    if (await page.locator('#rs-next').isVisible()) { await page.locator('#rs-next').click(); continue; }
    const r = await solveCurrentStep(page);
    if (r.kind === 'opt') await page.locator('#rs-opts button').nth(r.idx).click();
    else { await page.locator('#rs-in').fill(r.ans); await page.locator('#rs-sub').click(); }
    await page.waitForTimeout(900);
  }
  await expect(page.locator('#rs-hint')).toBeVisible();
  await page.locator('#rs-hint').click();
  await expect(page.locator('#rs-hintbox')).toBeVisible();
  await expect(page.locator('#rs-hintbox')).not.toBeEmpty();
  await expect(page.locator('#rs-msg')).toContainText('10');

  await page.evaluate(() => window.GAME_RESTART());
  await expect(page.locator('#rs-prog')).toContainText('1/3');
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('hashlab：生日攻击观测台捕获碰撞并可暂停清零', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/games/hashlab/', { waitUntil: 'networkidle' });
  await expect(page.locator('#hl-bd-title')).toBeVisible({ timeout: 10_000 });

  await page.locator('#hl-bd-start').click();
  await page.waitForFunction(function () {
    var el = document.getElementById('hl-bd-found');
    return el && /\d/.test(el.textContent || '');
  }, null, { timeout: 30_000 });
  const foundTxt = await page.locator('#hl-bd-found').textContent();
  expect(foundTxt).toMatch(/[:：]\s*[123]/);
  await expect(page.locator('#hl-bd-list div').first()).toContainText('#');
  await expect(page.locator('#hl-bd-start')).toBeVisible();

  await page.locator('#hl-bd-chips button').first().click();
  const statAfter = await page.locator('#hl-bd-stat').textContent();
  expect(statAfter).toMatch(/\d/);

  await page.locator('#hl-bd-reset').click();
  await page.waitForTimeout(200);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

for (const lang of ['zh', 'en']) {
  test('story modern 章：碰撞史段落渲染（' + lang + '）', async function ({ page }) {
    const errors = await trackErrors(page);
    await page.addInitScript(function (l) {
      try { localStorage.setItem('arcade_lang', l); } catch (e) { }
    }, lang);
    await page.goto('/story.html?id=modern', { waitUntil: 'networkidle' });
    const root = page.locator('#sy-root');
    await expect(root).toBeVisible({ timeout: 10_000 });
    const text = await root.innerText();
    expect(text).toContain('SHAttered');
    expect(text).toContain(lang === 'zh' ? '王小云' : 'Xiaoyun Wang');
    const chip = page.locator('.sy-person[data-person="wangxy"]');
    expect(await chip.count()).toBeGreaterThan(0);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
}
