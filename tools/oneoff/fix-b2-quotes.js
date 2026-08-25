/* B2 补丁：语录标注（archive 用 d.zh/d.en 前缀）+ quiz #56 转义锚点 */
const fs = require('fs');
const ARCH = 'assets/js/core/i18n-archive.js';
let ta = fs.readFileSync(ARCH, 'utf8');
let n = 0, fail = 0;
const PEOPLE = ['cocks', 'ellis', 'feistel', 'rivest', 'vigenere', 'efriedman', 'knox', 'alexander', 'wiesner', 'bennett', 'brassard', 'shor', 'grover', 'wangxy', 'shannon'];
PEOPLE.forEach(function (id) {
  const k = "d.zh['stp." + id + ".quote']";
  const i = ta.indexOf(k);
  if (i < 0) { console.error('✗ 未找到: ' + id); fail++; return; }
  const lineEnd = ta.indexOf('\n', i);
  let line = ta.slice(i, lineEnd);
  if (line.includes('意译') || line.includes('编者拟')) return;
  const newLine = line.replace(/';\s*$/, '（意译，编者拟）\';');
  if (newLine === line) { console.error('✗ 行尾异常: ' + id); fail++; return; }
  ta = ta.slice(0, i) + newLine + ta.slice(lineEnd);
  n++;
  const ke = "d.en['stp." + id + ".quote']";
  const ie = ta.indexOf(ke);
  if (ie >= 0) {
    const le = ta.indexOf('\n', ie);
    let seg = ta.slice(ie, le);
    if (!seg.includes('paraphrased')) {
      const fixed = seg.replace(/';\s*$/, ' (paraphrased)\';').replace(/";\s*$/, ' (paraphrased)";');
      ta = ta.slice(0, ie) + fixed + ta.slice(le);
    }
  }
});
fs.writeFileSync(ARCH, ta);
console.log('语录标注: ' + n + ' / 失败: ' + fail);

/* quiz #56 en（源码含 \' 转义） */
const Q = 'assets/js/quiz.js';
let tq = fs.readFileSync(Q, 'utf8');
const from = "Blaise de Vigen\\u00e8re\\\\'s rival Bellaso";
if (tq.includes(from)) {
  tq = tq.split(from).join("Bellaso");
  fs.writeFileSync(Q, tq);
  console.log('✓ quiz #56 en 选项');
} else {
  console.log('quiz #56: 字面匹配失败');
  const i = tq.indexOf('rival Bellaso');
  console.log(i >= 0 ? JSON.stringify(tq.slice(i - 60, i + 20)) : 'NOT FOUND');
  fail++;
}
process.exit(fail ? 1 : 0);
