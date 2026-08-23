/* 校验：每章每款游戏都能取到 gX 文案（模拟浏览器加载） */
const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {}, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [], querySelector: () => null },
  navigator: { language: 'zh-CN' }, localStorage: { getItem: () => null, setItem() {} },
  location: { reload() {} }, console
};
sandbox.window.Arcade = sandbox.window.Arcade || {};
sandbox.Arcade = sandbox.window.Arcade;
vm.createContext(sandbox);
function load(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f }); }
load('assets/js/core/i18n.js');
load('assets/js/core/i18n-dict.js');
load('assets/js/core/i18n-story.js');
load('assets/js/core/storage.js');
load('assets/js/stories.js');

const zh = sandbox.Arcade.i18n.dicts.zh;
const en = sandbox.Arcade.i18n.dicts.en;
const stories = sandbox.window.STORIES;

let fail = 0;
for (const ch of stories) {
  ch.games.forEach((gid, i) => {
    const key = ch.titleKey.replace(/\.t$/, '') + '.g' + (i + 1);
    const z = zh[key], e = en[key];
    if (!z || !e || z.startsWith('st.c') || e.startsWith('st.c')) {
      console.log('❌ ' + ch.id + ' 第' + (i + 1) + '款(' + gid + ') 缺文案: ' + key + ' zh=' + (z || '无') + ' en=' + (e || '无'));
      fail++;
    }
  });
}
const total = stories.reduce((n, ch) => n + ch.games.length, 0);
if (!fail) console.log('✓ 全部 ' + total + ' 个章节-游戏关联文案齐全（zh/en）');
process.exit(fail ? 1 : 0);
