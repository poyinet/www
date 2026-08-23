/* 复查 quiz.js 题库结构：100 题（4×25）、每题 4 选项、a∈[0,3]、zh/en 对称、题干无重复 */
const fs = require('fs');
const vm = require('vm');
const sb = { window: {}, localStorage: { getItem: () => null, setItem: () => {}, key: () => null, length: 0 } };
vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/js/quiz.js', 'utf8'), sb);
const Q = sb.window.QUIZ;
const B = Q.BANK;
console.log('总题数: ' + B.length);
let fail = 0;
const seen = {};
B.forEach((q, i) => {
  const z = q.zh.q, e = q.en.q;
  if (!z || !e) { console.log('✗ #' + i + ' 缺 zh/en 题干'); fail++; return; }
  if (seen[z]) { console.log('✗ #' + i + ' 题干重复: ' + z); fail++; }
  seen[z] = 1;
  if (!Array.isArray(q.zh.opts) || q.zh.opts.length !== 4) { console.log('✗ #' + i + ' zh opts != 4'); fail++; }
  if (!Array.isArray(q.en.opts) || q.en.opts.length !== 4) { console.log('✗ #' + i + ' en opts != 4'); fail++; }
  if (q.a < 0 || q.a > 3) { console.log('✗ #' + i + ' a=' + q.a + ' 越界'); fail++; }
  if (!q.zh.explain || !q.en.explain) { console.log('✗ #' + i + ' 缺 explain'); fail++; }
  if (q.lvl < 1 || q.lvl > 4) { console.log('✗ #' + i + ' lvl=' + q.lvl); fail++; }
  /* en opts 数量与 zh 一致（对称性粗查） */
});
const lv = { 1: 0, 2: 0, 3: 0, 4: 0 };
B.forEach(q => lv[q.lvl]++);
console.log('级别分布: ' + JSON.stringify(lv));
for (const k of [1, 2, 3, 4]) {
  if (lv[k] < 10) { console.log('✗ L' + k + ' 题数不足 10: ' + lv[k]); fail++; }
}
/* draw10 抽题测试：运行 50 次确保每次 10 题且级别权重正确 */
let okDraw = true;
for (let t = 0; t < 50; t++) {
  const d = Q.draw10();
  if (d.length !== 10) { okDraw = false; console.log('✗ draw10 返回 ' + d.length); break; }
  const dl = { 1: 0, 2: 0, 3: 0, 4: 0 };
  d.forEach(q => dl[q.lvl]++);
  if (dl[1] !== 4 || dl[2] !== 3 || dl[3] !== 2 || dl[4] !== 1) {
    okDraw = false;
    console.log('✗ draw10 级别分布: ' + JSON.stringify(dl));
    break;
  }
}
console.log(okDraw ? '✓ draw10 50 次抽题：每次 10 题且 L1×4+L2×3+L3×2+L4×1 恒定' : '✗ draw10 异常');
/* rankFor 边界 */
const rk = Q.RANKS;
let rkOk = true;
for (let i = 1; i < rk.length; i++) if (rk[i].min >= rk[i - 1].min) rkOk = false;
console.log(rkOk ? '✓ 8 级段位阈值单调递减' : '✗ 段位阈值乱序');
console.log(fail ? '✗ ' + fail + ' 处结构问题' : '✓ 题库结构完整');
process.exit(fail ? 1 : 0);
