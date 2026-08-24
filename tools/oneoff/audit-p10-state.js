/* 第十期中断后一致性体检 */
const fs = require('fs');
const cp = require('child_process');

/* 1) protocols.js 语法 */
let r = cp.spawnSync('node', ['--check', 'assets/js/protocols.js']);
console.log('protocols.js syntax:', r.status === 0 ? 'OK' : 'FAIL\n' + r.stderr.toString().slice(0, 300));

/* 2) HTML 状态 */
const h = fs.readFileSync('protocols.html', 'utf8');
console.log('pl-ready div:', h.includes('id="pl-ready"'));
console.log('card count:', (h.match(/class="pl-card" id=/g) || []).length);
console.log('十六大 meta:', h.includes('十六大交互演示'));

/* 3) JS LAZY/ready */
const t = fs.readFileSync('assets/js/protocols.js', 'utf8');
console.log('LAZY count:', (t.match(/LAZY\('pl-/g) || []).length);
console.log("ready='16':", t.includes("textContent = '16'"));
const s0 = t.indexOf("LAZY('pl-tls'");
const e0 = t.indexOf("el('pl-ready').textContent = '16'");
console.log('bad closers in LAZY region:', (t.slice(s0, e0).match(/\}\)\(\);/g) || []).length);

/* 4) SW */
console.log('SW:', (fs.readFileSync('sw.js', 'utf8').match(/decode-arcade-v\d+/) || ['?'])[0]);

/* 5) 断言同步 */
['smoke.js', 'e2e/r7.spec.js', 'e2e/r8.spec.js'].forEach(f => {
  const x = fs.readFileSync(f, 'utf8');
  console.log(f, "has '16':", x.includes("'16'"), " stale '11':", /!== '11'/.test(x) || /toHaveText\('11'\)/.test(x));
});

/* 6) i18n-ui 新键 */
const ui = fs.readFileSync('assets/js/core/i18n-ui.js', 'utf8');
['pl.mathH', 'pl.diffH', 'pl.aeadH', 'pl.extH', 'pl.bigH', 'pl.signH', 'pl.rngH'].forEach(k => {
  if (!ui.includes("'" + k + "'")) console.log('✗ ui 缺键 ' + k);
});
console.log('ui keys checked');

/* 7) smoke page 快检 */
r = cp.spawnSync('node', ['smoke.js', 'page'], { encoding: 'utf8' });
const line = r.stdout.split('\n').filter(x => x.includes('页面冒烟'));
console.log(line[0] ? line[0].trim() : 'smoke FAIL:\n' + r.stdout.split('\n').filter(x => x.includes('FAIL')).join('\n'));
