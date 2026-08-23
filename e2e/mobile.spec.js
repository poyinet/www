// @ts-check
/* ③ 移动端 320px 真实渲染溢出扫描：根页面 + 全部游戏（仅 chromium） */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.beforeEach(function () {
  test.skip(test.info().project.name !== 'chromium', '溢出扫描仅在 chromium 跑');
});
test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });

const src = fs.readFileSync(path.join(__dirname, '../assets/js/games.js'), 'utf8');
const IDS = [...src.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);

const PAGES = [
  '/', 'games.html', 'stories.html', 'people.html', 'artifacts.html',
  'glossary.html', 'workshop.html', 'quiz.html', 'duel.html',
  'morse-listen.html', 'map.html', 'machine.html', 'quotes.html',
  'path.html', 'stats.html', 'story.html?id=caesar'
];

async function expectNoOverflow(page, label) {
  await page.evaluate(function () { return document.fonts.ready; });
  async function measure() {
    return page.evaluate(function () {
      return {
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth
      };
    });
  }
  /* 高负载/字体交换下存在瞬态宽布局 —— 采样最多 5 次取最小值（间隔 400ms） */
  let r = await measure();
  for (let i = 0; i < 4 && r.sw > r.cw + 1; i++) {
    await page.waitForTimeout(400);
    r = await measure();
  }
  /* 持续溢出 → 自动定位最右的 3 个元素（排除滚动容器内部元素），失败信息直接带元凶 */
  const offenders = await page.evaluate(function () {
    const vw = document.documentElement.clientWidth;
    function inScroller(el) {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
        p = p.parentElement;
      }
      return false;
    }
    const out = [];
    document.querySelectorAll('body *').forEach(function (el) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && out.length < 3 && !inScroller(el)) {
        out.push(el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 24) + ' w=' + Math.round(r.width) + ' href=' + (el.getAttribute('href') || '-') + ' txt="' + (el.textContent || '').trim().slice(0, 14) + '"');
      }
    });
    return out;
  });
  expect(r.sw, label + ' 横向溢出: scrollWidth=' + r.sw + ' > clientWidth=' + r.cw + ' | 元凶: ' + offenders.join(' ← ')).toBeLessThanOrEqual(r.cw + 1);
}

for (const p of PAGES) {
  test('320px 无横向溢出: ' + p, async function ({ page }) {
    await page.goto(p, { waitUntil: 'networkidle' });
    await expectNoOverflow(page, p);
  });
}

for (const id of IDS) {
  test('320px 无横向溢出: 游戏 ' + id, async function ({ page }) {
    await page.goto('/games/' + id + '/', { waitUntil: 'networkidle' });
    await expectNoOverflow(page, '/games/' + id + '/');
  });
}
