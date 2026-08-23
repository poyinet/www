/* ============================================================
   术语一致性审计（C7）：跨页术语正典表 + 变体扫描
   用法：node tools/check-term-consistency.js
   扫描范围：i18n-story / i18n-dict / i18n-archive 的 zh 值
   规则：正典表定义每个概念的「标准译名」与「已批准变体」；
         出现在 zh 值中但不在正典/白名单的变体 = 不一致项
   ============================================================ */
const fs = require('fs');
const vm = require('vm');

const sb = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sb.window.Arcade = sb.Arcade = sb.window.Arcade || {};
vm.createContext(sb);
function load(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f }); }
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js');
load('assets/js/core/i18n-archive.js');
load('assets/js/core/i18n-story.js');

const zh = sb.Arcade.i18n.dicts.zh;

/* ---------- 术语正典表 ----------
   canon: 标准译名；variants: 已知不一致变体（出现在 zh 值中即报告） */
const TERMINOLOGY = [
  { concept: '频率分析', canon: '频率分析', variants: ['频数分析', '频度分析', '字母频率统计'] },
  /* 转轮：Jefferson/Hagelin 等轮式密码机的标准用语（区别于 Enigma 的转子），属合理变体 */
  { concept: '转子', canon: '转子', variants: ['滚轮', '齿轮盘'], approvedVariants: ['转轮'] },
  { concept: '插线板', canon: '插线板', variants: ['接插板', '连接板'] },
  { concept: '反射器', canon: '反射器', variants: ['反射板', '回流鼓'] },
  { concept: '一次性密码本', canon: '一次性密码本', variants: ['一次一密乱码本', '无限制密码'] },
  { concept: '已知明文攻击', canon: '已知明文攻击', variants: ['明文攻击法'] },
  { concept: '唯密文攻击', canon: '唯密文攻击', variants: ['纯密文攻击'] },
  { concept: '中间人攻击', canon: '中间人攻击', variants: ['中途人攻击', '_man-in-the-middle_攻击'] },
  { concept: '公钥密码', canon: '公钥密码', variants: ['非对称加密体系'], approvedVariants: ['公开密钥密码', '非对称加密体系'] },
  { concept: '对称加密', canon: '对称加密', variants: ['对称密码'] },
  { concept: '哈希函数', canon: '哈希函数', variants: ['散列函数', '杂凑函数'] },
  { concept: '数字签名', canon: '数字签名', variants: ['电子签章', '数位签名'] },
  { concept: '密钥交换', canon: '密钥交换', variants: ['钥匙交换', '秘钥交换'] },
  { concept: '暴力破解', canon: '暴力破解', variants: ['蛮力攻击', '穷举法'] },
  { concept: '替换密码', canon: '替换密码', variants: ['代换密码', '替代密码'] },
  { concept: '换位密码', canon: '换位密码', variants: ['置换密码'], approvedVariants: ['移位密码'] }
];

let totalIssues = 0;
console.log('=== 术语一致性审计 ===\n');
for (const t of TERMINOLOGY) {
  const approved = new Set(t.approvedVariants || []);
  const toCheck = t.variants.filter(v => !approved.has(v));
  if (!toCheck.length) { console.log('✓ [' + t.concept + '] 全部变体已批准'); continue; }
  const hits = [];
  for (const v of toCheck) {
    for (const [k, val] of Object.entries(zh)) {
      if (typeof val !== 'string') continue;
      if (val.includes(v) && !val.includes(t.canon)) {
        hits.push({ key: k, variant: v, context: val.slice(0, 50) });
      }
    }
  }
  if (hits.length) {
    totalIssues += hits.length;
    console.log('⚠ [' + t.concept + '] 变体「' + toCheck.join('/') + '」出现 ' + hits.length + ' 处:');
    hits.slice(0, 3).forEach(h => console.log('  ' + h.key + ': …' + h.context + '…'));
    if (hits.length > 3) console.log('  … 其余 ' + (hits.length - 3) + ' 条略');
  } else {
    console.log('✓ [' + t.concept + '] 无变体用法');
  }
}

console.log('\n---');
console.log(totalIssues ? '发现 ' + totalIssues + ' 处术语不一致（人工裁决后批量修正）' : '🎉 全部术语一致');
process.exit(totalIssues ? 1 : 0);
