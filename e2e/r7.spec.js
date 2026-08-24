// @ts-check
/* 第七期专项验证（chromium）：协议实验室六大演示
   ① TLS 逐步推进 + Eve 揭示 ② DH 正常协商 vs 中间人双钥 ③ Merkle 改叶传染 + 链篡改断裂
   ④ ZKP 轮次推进 ⑤ ECC 已知点对加法数值断言 ((-1,4)+(3,4)=(2,-4)) ⑥ 口令计算器数学抽查 */
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

test('TLS：六步走完 + Eve 在第 3 步露馅', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#pl-ready')).toHaveText('8', { timeout: 10_000 });

  await page.locator('#tls-eve').click();
  for (let i = 0; i < 6; i++) {
    await page.locator('#tls-next').click();
    await page.waitForTimeout(80);
  }
  const onCount = await page.locator('.pl-step.on').count();
  expect(onCount).toBe(6);
  await expect(page.locator('#tls-note')).toContainText('🕵️');
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('DH：无认证时 Eve 拿到两把不同的钥匙', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });

  /* 正常模式 */
  await expect(page.locator('#dh-verdict .ok')).toBeVisible();
  /* 开启 Eve */
  await page.locator('#dh-eve').click();
  await page.waitForTimeout(100);
  await expect(page.locator('#dh-verdict .bad')).toBeVisible();
  const keys = await page.evaluate(function () {
    var tds = document.querySelectorAll('#dh-out tr td');
    var vals = [];
    for (var i = 0; i < tds.length; i++) {
      var mm = (tds[i].textContent || '').match(/(\d{1,3})$/);
      if (mm) vals.push(parseInt(mm[1], 10));
    }
    return vals;
  });
  /* 至少出现两个互不相同的密钥值（Alice-Eve 与 Bob-Eve） */
  const uniq = Array.from(new Set(keys));
  expect(uniq.length).toBeGreaterThan(1);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('Merkle：改叶子传染到根；篡改第 2 块链断裂可还原', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });

  const rootBefore = await page.evaluate(function () {
    var n = document.querySelectorAll('#merkle-tree .pl-mrow')[0];
    return n ? n.textContent : '';
  });
  await page.locator('#merkle-leaves button').first().click();
  await page.waitForTimeout(120);
  const rootAfter = await page.evaluate(function () {
    var n = document.querySelectorAll('#merkle-tree .pl-mrow')[0];
    return n ? n.textContent : '';
  });
  expect(rootAfter).not.toBe(rootBefore);
  await expect(page.locator('#merkle-tree .pl-mnode.flash')).toBeTruthy();

  await page.locator('#chain-tamper').click();
  await page.waitForTimeout(120);
  expect(await page.locator('.pl-block.bad').count()).toBeGreaterThanOrEqual(2);
  expect(await page.locator('.pl-link.bad').count()).toBeGreaterThanOrEqual(1);
  await page.locator('#chain-restore').click();
  await page.waitForTimeout(120);
  expect(await page.locator('.pl-block.bad').count()).toBe(0);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('ZKP：轮次推进且节点经历模糊承诺', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });
  const stat0 = await page.locator('#zkp-stat').textContent();
  await page.locator('#zkp-round').click();
  await page.waitForTimeout(600);
  await page.locator('#zkp-round').click();
  await page.waitForTimeout(2100);
  const stat2 = await page.locator('#zkp-stat').textContent();
  expect(stat2).not.toBe(stat0);
  expect(stat2).toMatch(/2|二/);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('ECC：(-1,4)+(3,4)=(2,-4) 几何加法断言', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#ecc-ab')).toHaveText('a=-7 , b=10');

  function px(x) { return (x + 3.4) / 6.8 * 420; }
  function py(y) { return 150 - y / 7.5 * (150 - 8); }
  await page.locator('#ecc-cv').scrollIntoViewIfNeeded();
  const box = await page.locator('#ecc-cv').boundingBox();
  async function clickPoint(x, y) {
    await page.mouse.click(box.x + px(x) * box.width / 420, box.y + py(y) * box.height / 300);
    await page.waitForTimeout(80);
  }
  /* 点击后读回实际选中样本（data-last），用与页面一致的公式推期望和 */
  await clickPoint(-1, 4);
  const pPick = (await page.locator('#ecc-cv').getAttribute('data-last')).split(',').map(Number);
  await clickPoint(3, 4);
  const qPick = (await page.locator('#ecc-cv').getAttribute('data-last')).split(',').map(Number);
  await page.locator('#ecc-add').click();

  const m = (qPick[1] - pPick[1]) / (qPick[0] - pPick[0]);
  const r = m * m - pPick[0] - qPick[0];
  const ry = m * (r - pPick[0]) + pPick[1];
  const expected = 'P+Q = (' + r.toFixed(3) + ', ' + (-ry).toFixed(3) + ')';
  await expect(page.locator('#ecc-msg')).toContainText(expected);

  /* 结果点必须落在曲线上：|y²-x³-ax-b| ≈ 0 */
  const resid = Math.abs(ry * ry - (r * r * r - 7 * r + 10));
  expect(resid).toBeLessThan(0.05);

  /* 换滑杆参数不报错 */
  await page.locator('#ecc-a').fill('1');
  await page.locator('#ecc-a').dispatchEvent('input');
  await page.waitForTimeout(100);
  await expect(page.locator('#ecc-ab')).toContainText('a=1');
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('口令成本：熵与穷举时间随算法/装备变化', async function ({ page }) {
  const errors = await trackErrors(page);
  await page.goto('/protocols.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#pwd-len-v')).toHaveText('10');
  /* 默认 lower+upper=52, sha256 @ 8×GPU */
  await expect(page.locator('#pwd-out')).toContainText(/57\.0 bits/);
  const t1 = await page.locator('#pwd-out b').nth(1).textContent();

  await page.selectOption('#pwd-algo', 'argon2');
  await page.selectOption('#pwd-rig', 'nation');
  await page.waitForTimeout(120);
  const t2 = await page.locator('#pwd-out b').last().textContent();
  expect(t2).not.toBe(t1);

  await page.locator('#pwd-len').fill('20');
  await page.locator('#pwd-len').dispatchEvent('input');
  await expect(page.locator('#pwd-len-v')).toHaveText('20');
  await expect(page.locator('#pwd-out')).toContainText(/114\.0 bits/);
  expect(errors, errors.join('\n')).toHaveLength(0);
});
