/* 审计修复批次1：protocols.js（ZKP 着色 / ChaCha 96 / ECC 互逆 / RC4 表述 / TLS 本地步 / Eve a=b） */
const fs = require('fs');
const f = 'assets/js/protocols.js';
let t = fs.readFileSync(f, 'utf8');
let n = 0, fail = 0;
function rep(from, to, tag) {
  if (!t.includes(from)) { console.error('✗ 未命中: ' + tag); fail++; return; }
  t = t.split(from).join(to);
  n++;
  console.log('✓ ' + tag);
}

rep('var zkpBase = { A: 1, B: 2, C: 1, D: 2, E: 0 },',
    'var zkpBase = { A: 1, B: 2, C: 2, D: 1, E: 0 },', 'P1 zkp 合法底色');

rep('64 ops', '96 ops', 'P2 cc intro en 96');
rep('共 64 条操作', '共 96 条操作（8 个 quarter-round × 12 条指令）', 'P2 cc intro zh 96');
rep("'Op ' + opIdx + '/64 · '", "'Op ' + opIdx + '/96 · '", 'P2 cc step en 96');
rep("'操作 ' + opIdx + '/64 · '", "'操作 ' + opIdx + '/96 · '", 'P2 cc step zh 96');
rep("opIdx === 64 ? ' — double round done;", "opIdx === 96 ? ' — double round done;", 'P2 cc done en 96');
rep("opIdx === 64 ? ' —— 双轮完成；", "opIdx === 96 ? ' —— 双轮完成；", 'P2 cc done zh 96');

rep("if (Math.abs(P.x - Q.x) < 1e-9 && Math.abs(Math.abs(P.y) - Math.abs(Q.y)) < 1e-9) {\n          if (Math.abs(P.y) < 1e-9) { msg.textContent = isEn ? 'P+P = point at infinity ∞' : 'P+P = 无穷远点 ∞'; return; }",
    "if (Math.abs(P.x - Q.x) < 1e-9 && Math.abs(P.y + Q.y) < 1e-9 && Math.abs(P.y) > 1e-9) { msg.textContent = isEn ? 'P + (-P) = point at infinity ∞' : 'P + (-P) = 无穷远点 ∞'; return; }\n          if (Math.abs(P.x - Q.x) < 1e-9 && Math.abs(Math.abs(P.y) - Math.abs(Q.y)) < 1e-9) {\n          if (Math.abs(P.y) < 1e-9) { msg.textContent = isEn ? 'P+P = point at infinity ∞' : 'P+P = 无穷远点 ∞'; return; }",
    'P2 ecc 互逆守卫');

rep('死因不是算法核心被攻破，而是「密钥流重用」：同一密钥流绝不能用两次。',
    '死因有二：WEP 死于 IV 可预测导致的「密钥流重用」；TLS 中的 RC4 则死于输出统计偏置（FMS 2001 → RC4 NOMORE 2015），终被 RFC 7465 全面禁用。共同教训：', 'P2 rc4 zh 双因');
rep('The cause of death was not the core algorithm but keystream reuse: never encrypt twice under the same stream.',
    'It died twice over: WEP fell to predictable-IV keystream reuse, while TLS RC4 was banned for output biases (FMS 2001 → RC4 NOMORE 2015, RFC 7465). Shared lesson:', 'P2 rc4 en 双因');

rep("        { from: 'C', to: 'S', tag: { zh: '双方导出会话密钥（本地）', en: 'Both derive session keys (local)' },",
    "        { from: 'L', to: 'L', tag: { zh: '双方导出会话密钥（本地）', en: 'Both derive session keys (local)' },", 'P3 tls step4 本地步');
rep("function arrow(a, b) {\n        if (a === 'C' && b === 'S') return 'C ⟶ S';\n        return 'S ⟶ C';\n      }",
    "function arrow(a, b) {\n        if (a === 'L') return 'C ∥ S';\n        if (a === 'C' && b === 'S') return 'C ⟶ S';\n        return 'S ⟶ C';\n      }", 'P3 tls arrow 本地标记');

/* Eve a=b 巧合：verdict 前置说明 */
rep("el('dh-verdict').innerHTML = '<span class=\"bad\">' +\n            L({ zh: '✗ Alice 和 Bob 各自「协商成功」",
    "el('dh-verdict').innerHTML = '<span class=\"bad\">' +\n            (a === b ? (isEn ? '(Demo coincidence: a=b makes the two keys equal — practically never happens.) ' : '（演示巧合：a=b 时两把钥匙恰好相同——真实场景几乎不会发生。）') : '') +\n            L({ zh: '✗ Alice 和 Bob 各自「协商成功」", 'P3 eve a=b 说明');

/* P3 死变量 committed */
rep("      var rounds = 0, committed = false;", "      var rounds = 0;", 'P3 zkp 死变量');

/* P3 merkle hexRnd 必异重抽 */
rep("      function hexRnd() {\n        var s = '0123456789abcdef';\n        return s.charAt(Math.floor(Math.random() * 16));\n      }",
    "      function hexRnd(avoid) {\n        var s = '0123456789abcdef', c;\n        do { c = s.charAt(Math.floor(Math.random() * 16)); } while (c === avoid);\n        return c;\n      }", 'P3 hexRnd 必异');
rep("            leaves[i] = leaves[i].slice(0, -1) + hexRnd();",
    "            leaves[i] = leaves[i].slice(0, -1) + hexRnd(leaves[i].slice(-1));", 'P3 merkle 必变');

/* P3 singular 时清画布 */
rep("        if (singular(st.a, st.b)) {\n          msg.textContent = isEn ? '⚠ Singular curve (4a³+27b²=0) — adjust sliders' : '⚠ 奇异曲线（4a³+27b²=0）——请调整滑杆';\n          return;\n        }",
    "        if (singular(st.a, st.b)) {\n          ctx.clearRect(0, 0, WID, HEI);\n          msg.textContent = isEn ? '⚠ Singular curve (4a³+27b²=0) — adjust sliders' : '⚠ 奇异曲线（4a³+27b²=0）——请调整滑杆';\n          return;\n        }", 'P3 ecc singular 清画布');

/* P3 亿年/万年 科学计数法统一（×10ⁿ 上标） */
rep("        var yr = 31557600;\n        if (sec / yr >= 1e8) return L({ zh: '约 ' + (sec / yr / 1e8).toExponential(1) + ' 亿年', en: '≈' + (sec / yr / 1e8).toExponential(1) + 'e8 years' });\n        if (sec / yr >= 1e4) return L({ zh: '约 ' + LAB.fmtInt(Math.round(sec / yr / 1e4)) + ' 万年', en: '≈' + LAB.fmtInt(Math.round(sec / yr / 1e4)) + '0K years' });",
    "        var yr = 31557600;\n        if (sec / yr >= 1e4) {\n          var e10 = Math.floor(Math.log10(sec / yr));\n          var man = (sec / yr) / Math.pow(10, e10);\n          return L({ zh: '约 ' + man.toFixed(1) + '×10' + sup(e10) + ' 年', en: '≈' + man.toFixed(1) + '×10' + sup(e10) + ' years' });\n        }", 'P3 pwd 科学计数');

fs.writeFileSync(f, t);
console.log('done. replaced=' + n + ' failed=' + fail);
process.exit(fail ? 1 : 0);
