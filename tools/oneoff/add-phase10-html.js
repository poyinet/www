/* 第十期 protocols.html：5 卡 + 导航 + 样式 + meta 十一→十六 */
const fs = require('fs');
const H = 'protocols.html';
let t = fs.readFileSync(H, 'utf8');
let fail = 0;
function rep(from, to, tag) {
  if (!t.includes(from)) { console.error('✗ 未命中: ' + tag); fail++; return; }
  t = t.split(from).join(to);
  console.log('✓ ' + tag);
}

/* 5 张卡插在 pl-pwd 之前 */
rep('    <div class="pl-card" id="pl-pwd">',
`    <div class="pl-card" id="pl-math">
      <div class="pl-h"><span class="ic">∑</span><b data-i18n="pl.mathH">数论小课堂：三块基石</b></div>
      <div class="pl-note" id="math-intro"></div>
      <div class="pl-btnrow" id="math-p"></div>
      <div id="math-view"></div>
      <div class="pl-btnrow" id="math-phi"></div>
      <div class="pl-note-line" id="math-note"></div>
    </div>

    <div class="pl-card" id="pl-diff">
      <div class="pl-h"><span class="ic">🎯</span><b data-i18n="pl.diffH">差分分析：偏置即杠杆</b></div>
      <div class="pl-note" id="diff-intro"></div>
      <div class="pl-btnrow" id="diff-chips"></div>
      <div id="diff-view"></div>
      <div class="pl-note-line" id="diff-note"></div>
    </div>

    <div class="pl-card" id="pl-aead">
      <div class="pl-h"><span class="ic">🛡️</span><b data-i18n="pl.aeadH">认证加密：改一位你知不知道？</b></div>
      <div class="pl-note" id="aead-intro"></div>
      <div class="pl-btnrow">
        <button class="btn pink" id="aead-raw">裸加密（无认证）</button>
        <button class="btn accent" id="aead-etm">Encrypt-then-MAC</button>
        <button class="btn yellow" id="aead-flip">⚡ 翻转密文一位</button>
      </div>
      <div id="aead-view"></div>
      <div class="pl-note-line" id="aead-verdict"></div>
    </div>

    <div class="pl-card" id="pl-ext">
      <div class="pl-h"><span class="ic">🧟</span><b data-i18n="pl.extH">长度扩展攻击：无钥伪造 MAC</b></div>
      <div class="pl-note" id="ext-intro"></div>
      <div class="pl-btnrow">
        <button class="btn accent" id="ext-gen">🔑 生成 secret-prefix MAC</button>
        <button class="btn pink" id="ext-forge">🧟 无钥伪造 &amp;admin=true</button>
        <button class="btn yellow" id="ext-verify">✅ 服务端验证</button>
      </div>
      <div id="ext-view"></div>
      <div class="pl-note-line" id="ext-verdict"></div>
    </div>

    <div class="pl-card" id="pl-big">
      <div class="pl-h"><span class="ic">🐘</span><b data-i18n="pl.bigH">真实大数 RSA：256 位现场生成</b></div>
      <div class="pl-note" id="big-intro"></div>
      <div class="pl-btnrow"><button class="btn accent" id="big-gen">🔐 现场生成 256 位密钥对</button></div>
      <div id="big-view"></div>
      <div class="pl-note-line" id="big-note"></div>
    </div>

    <div class="pl-card" id="pl-pwd">`, '5 卡 HTML');

/* 导航 */
rep('<a href="#pl-sign">✍️ 签名</a><a href="#pl-rng">🎲 随机数</a><a href="#pl-pwd">⏳ 口令成本</a>',
    '<a href="#pl-sign">✍️ 签名</a><a href="#pl-rng">🎲 随机数</a><a href="#pl-math">∑ 数论</a><a href="#pl-diff">🎯 差分</a><a href="#pl-aead">🛡️ AEAD</a><a href="#pl-ext">🧟 长度扩展</a><a href="#pl-big">🐘 大数</a><a href="#pl-pwd">⏳ 口令成本</a>', '导航 +5');

/* 样式：差分表 + math bits */
rep('    .pl-cells.mono { font-family: var(--font-mono); color: var(--neon-green); word-break: break-all; }',
`    .pl-cells.mono { font-family: var(--font-mono); color: var(--neon-green); word-break: break-all; }
    .pl-ddt td { text-align: center; padding: 3px 4px; font-family: var(--font-mono); font-size: 11px; }
    .pl-ddt td.dim { opacity: .3; }
    .pl-ddt td.hot { background: rgba(255,45,149,.3); color: #fff; font-weight: 700; }
    .pl-ddt td.row { outline: 1px solid rgba(0,240,255,.7); }`, '差分表样式');

/* pl-ready 11→16 */
rep("el('pl-ready').textContent = '11';", "el('pl-ready').textContent = '16';", 'pl-ready 16');

/* meta 十一→十六 + 列表 */
rep('十一大交互演示', '十六大交互演示', 'meta 十一→十六');
rep('十一堂交互课', '十六堂交互课', 'meta 十一堂→十六堂');
rep('数字签名、随机数、口令破解成本——十六大交互演示。', '数字签名、随机数、数论、差分分析、认证加密、长度扩展、真实大数 RSA、口令破解成本——十六大交互演示。', 'meta 列表');
rep('数字签名 / 随机数 / 口令成本——十六大交互演示。', '数字签名 / 随机数 / 数论 / 差分 / AEAD / 长度扩展 / 大数 RSA / 口令成本——十六大交互演示。', 'og 列表');

fs.writeFileSync(H, t);
console.log(fail ? 'FAILED ' + fail : 'ALL OK');
process.exit(fail ? 1 : 0);
