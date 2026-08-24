/* 审计修复批次4+5：数字口径清扫 + sw/prefetch + 文档现状 */
const fs = require('fs');
let n = 0, fail = 0;
function rep(f, from, to, tag) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) { console.error('✗ 未命中: ' + tag + ' @ ' + f); fail++; return; }
  t = t.split(from).join(to);
  fs.writeFileSync(f, t);
  n++;
  console.log('✓ ' + tag);
}

/* index.html 108→114 ×5 + 100题→120 */
rep('index.html', '108 款游戏', '114 款游戏', 'index 108→114');
rep('index.html', '100 题测出你的段位', '120 题测出你的段位', 'index 100→120 题');

/* games.html 108→114 ×5 */
rep('games.html', '108 款', '114 款', 'games 108→114');

/* 404.html */
rep('404.html', '108 款小游戏', '114 款小游戏', '404 108→114');

/* machine.html 五台→七台（meta/og/twitter/ld+json/可见副标题） */
rep('machine.html', '五台改变历史的密码机', '七台改变历史的密码机', 'machine 五→七');
rep('machine.html', 'Five machines that changed history', 'Seven machines that changed history', 'machine Five→Seven');

/* map.html 44→47 ×4 */
rep('map.html', '44 个', '47 个', 'map 44→47');

/* protocols.html 六大→九大 + 补三项 */
rep('protocols.html', '六大交互演示', '九大交互演示', 'protocols 六→九');
rep('protocols.html', '六堂交互课', '九堂交互课', 'protocols 六堂→九堂');
rep('protocols.html', '零知识证明、ECC 点加法、口令破解成本——六大交互演示。',
    '零知识证明、ChaCha20、ECC 点加法、A5/1、RC4 警示录、口令破解成本——九大交互演示。', 'protocols ld+json 列表');
rep('protocols.html', 'ECC 几何 / 口令成本——六大交互演示。',
    'ECC 几何 / A5/1 / RC4 / 口令成本——九大交互演示。', 'protocols og 列表');

/* glossary 158→166 */
rep('glossary.html', '158 个密码学术语', '166 个密码学术语', 'glossary 158→166');
rep('glossary.html', '100+ 个术语', '166 个术语', 'glossary 100+→166');

/* i18n-ui.js */
rep('assets/js/core/i18n-ui.js', '158 个术语', '166 个术语', 'ui glossary.sub zh');
rep('assets/js/core/i18n-ui.js', '158 terms', '166 terms', 'ui glossary.sub en');
rep('assets/js/core/i18n-ui.js', '五台改变历史的密码机', '七台改变历史的密码机', 'ui cm.sub zh');
rep('assets/js/core/i18n-ui.js', 'Five machines that changed history', 'Seven machines that changed history', 'ui cm.sub en');
rep('assets/js/core/i18n-ui.js', '继续挑战 108 款小游戏吧', '继续挑战 114 款小游戏吧', 'ui err.sub zh');
rep('assets/js/core/i18n-ui.js', 'keep playing 105 mini-games', 'keep playing 114 mini-games', 'ui err.sub en');
rep('assets/js/core/i18n-ui.js', '现代密码学的六堂交互课', '现代密码学的九堂交互课', 'ui pl.sub zh');
rep('assets/js/core/i18n-ui.js', 'six interactive lessons in modern crypto', 'nine interactive lessons in modern crypto', 'ui pl.sub en');

/* manifest */
rep('manifest.webmanifest', '105 款游戏', '114 款游戏', 'manifest 105→114');

/* README */
rep('README.md', '105 款小游戏还原', '114 款小游戏还原', 'README 105→114');
rep('README.md', '20 项自动化检查', '22 项自动化检查', 'README 20→22 项');
rep('README.md', '13 项硬标准 × 105 款游戏', '13 项硬标准 × 114 款游戏', 'README audit 105→114');
rep('README.md', 'verify-workshop.js（15 种密码算法往返）', 'verify-workshop.js（16 种密码算法往返）', 'README 15→16 算法');
rep('README.md', 'check-game-i18n.js（105 款 gs.* 双语对称）', 'check-game-i18n.js（114 款 gs.* 双语对称）', 'README game-i18n 105→114');
rep('README.md', '离线缓存 v10', '离线缓存 v22', 'README SW v10→v22');

/* PLAN 现状描述 */
rep('PLAN.md', '11 时代时间轴', '12 时代时间轴', 'PLAN 11→12 时代');
rep('PLAN.md', '内置 **105 款小游戏**', '内置 **114 款小游戏**', 'PLAN 105→114');
rep('PLAN.md', '108 个 HTML 由工具批量同步', '133 个 HTML 由工具批量同步', 'PLAN 108→133 HTML');
rep('PLAN.md', '游戏厅（games.html）：105 款游戏', '游戏厅（games.html）：114 款游戏', 'PLAN games.html 105→114');
rep('PLAN.md', '编年史（stories.html）：11 章真实密码学史时间轴', '编年史（stories.js）：12 章真实密码学史时间轴', 'PLAN 11→12 章');
rep('PLAN.md', '人物志（people.html）：13 位破译者档案卡', '人物志（people.html）：48 位破译者档案卡', 'PLAN 13→48 人');
rep('PLAN.md', '通关游戏解锁 11 件历史密件', '通关游戏解锁 41 件历史密件', 'PLAN 11→41 件');
rep('PLAN.md', '🎮 游戏清单（105 款）', '🎮 游戏清单（114 款）', 'PLAN 清单 105→114');
rep('PLAN.md', '密码破译 (39)', '密码破译 (48)', 'PLAN 分类 39→48');
rep('PLAN.md', '站点地图（108 页，从注册表生成）', '站点地图（131 URL，从注册表生成）', 'PLAN sitemap 108→131');
rep('PLAN.md', '全站 101 款冒烟', '全站 114 款冒烟', 'PLAN smoke 101→114');
rep('PLAN.md', '站点页面冒烟（7 个内容页 + 404）', '站点页面冒烟（18 个页面）', 'PLAN page 7→18');

/* smoke.js 头注 + qa-all 页面数标签 */
rep('smoke.js', '全站 105 款游戏通用冒烟', '全站 114 款游戏通用冒烟', 'smoke 头注 105→114');
rep('tools/qa-all.js', '页面冒烟 ×17', '页面冒烟 ×18', 'qa-all ×17→×18');

/* 注释漂移 */
rep('assets/js/stories.js', 'STORIES（11 章）/ PEOPLE（12 人）/ ARTIFACTS（11 件）', 'STORIES（12 章）/ PEOPLE（48 人）/ ARTIFACTS（41 件）', 'stories.js 头注');
rep('assets/js/lobby.js', '全部 105 款记分游戏', '全部记分游戏', 'lobby.js 注释');
rep('assets/js/quiz.js', '100 题分 4 级', '120 题分 4 级', 'quiz.js 头注');

/* font-preview.html ×6 */
rep('docs/font-preview.html', '105 款游戏', '114 款游戏', 'font-preview 105→114');

/* coverage-roadmap 165→166 */
rep('docs/coverage-roadmap.md', '术语词典 | **165 词**', '术语词典 | **166 词**', 'roadmap 165→166');

/* improvement-plan-2 历史标注 */
rep('docs/improvement-plan-2.md', 'B1 跟随系统主题 ✅',
    'B1 跟随系统主题 ✅（历史记录：auto 档已于 2026-08-24 随主题收敛移除，现为街机/晨光双档）', 'plan-2 历史标注');

/* sw/prefetch: protocols.js 预缓存 + SW v23 */
rep('sw.js', "  '/protocols.html',", "  '/protocols.html',\n  '/assets/js/protocols.js',", 'sw 预缓存 protocols.js');
rep('sw.js', "decode-arcade-v22", "decode-arcade-v23", 'sw v22→v23');
rep('assets/js/prefetch.js', "    '/protocols.html',", "    '/protocols.html',\n    '/assets/js/protocols.js',", 'prefetch protocols.js');

/* workshop W 遮蔽改名 */
rep('workshop.html', 'var W = view.width, H = view.height, capBits = W * H * 3;',
    'var VW = view.width, VH = view.height, capBits = VW * VH * 3;', 'workshop W 遮蔽改名(1)');
rep('workshop.html', 'var img = vctx.createImageData(W, H);\n        var horizon = Math.floor(H * 0.58), sea = Math.floor(H * 0.72);\n        for (var y = 0; y < H; y++) {\n          for (var x = 0; x < W; x++) {',
    'var img = vctx.createImageData(VW, VH);\n        var horizon = Math.floor(VH * 0.58), sea = Math.floor(VH * 0.72);\n        for (var y = 0; y < VH; y++) {\n          for (var x = 0; x < VW; x++) {', 'workshop W 遮蔽改名(2)');
rep('workshop.html', 'var sun = (x - W * 0.78) * (x - W * 0.78) + (y - H * 0.2) * (y - H * 0.2);',
    'var sun = (x - VW * 0.78) * (x - VW * 0.78) + (y - VH * 0.2) * (y - VH * 0.2);', 'workshop W 遮蔽改名(3)');
rep('workshop.html', 'var img = vctx.getImageData(0, 0, W, H);\n        putBits(img, bits);',
    'var img = vctx.getImageData(0, 0, VW, VH);\n        putBits(img, bits);', 'workshop W 遮蔽改名(4)');
rep('workshop.html', 'var img = vctx.getImageData(0, 0, W, H);\n        function bit(i)', 
    'var img = vctx.getImageData(0, 0, VW, VH);\n        function bit(i)', 'workshop W 遮蔽改名(5)');
rep('workshop.html', 'var img = vctx.getImageData(0, 0, W, H), out = ctx.createImageData(W, H);',
    'var img = vctx.getImageData(0, 0, VW, VH), out = ctx.createImageData(VW, VH);', 'workshop W 遮蔽改名(6)');
rep('workshop.html', "T('workshop.stegoCap').replace('{w}', W).replace('{h}', H)", 
    "T('workshop.stegoCap').replace('{w}', VW).replace('{h}', VH)", 'workshop W 遮蔽改名(7)');
rep('workshop.html', 'var scale = Math.min(W / im.width, H / im.height, 1);',
    'var scale = Math.min(VW / im.width, VH / im.height, 1);', 'workshop W 遮蔽改名(8)');
rep('workshop.html', 'vctx.fillRect(0, 0, W, H);', 'vctx.fillRect(0, 0, VW, VH);', 'workshop W 遮蔽改名(9)');
rep('workshop.html', '((W - dw) / 2) | 0, ((H - dh) / 2) | 0, dw, dh);', '((VW - dw) / 2) | 0, ((VH - dh) / 2) | 0, dw, dh);', 'workshop W 遮蔽改名(10)');

/* TLS1.3 注脚「强制」→「默认采用」（PSK 例外） */
rep('assets/js/core/i18n-ui.js', '现代 TLS 1.3 已改为强制（EC）DHE 密钥协商', '现代 TLS 1.3 已改为默认采用（EC）DHE 密钥协商（PSK 复用除外）', 'tls13 zh 措辞');
rep('assets/js/core/i18n-ui.js', 'Modern TLS 1.3 mandates (EC)DHE key agreement', 'Modern TLS 1.3 defaults to (EC)DHE key agreement (PSK reuse excepted)', 'tls13 en 措辞');

console.log('done. replaced=' + n + ' failed=' + fail);
process.exit(fail ? 1 : 0);
