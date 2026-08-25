/* B1 锚点提取 */
const fs = require('fs');
function show(f, k, len) {
  const t = fs.readFileSync(f, 'utf8');
  const i = t.indexOf(k);
  console.log('== ' + f + ' @ "' + k.slice(0, 24) + '" ==');
  console.log(i < 0 ? 'NOT FOUND' : JSON.stringify(t.slice(i, i + (len || 150))));
}
show('assets/js/core/i18n-story.js', '五千年的古埃及', 80);
show('assets/js/core/i18n-story.js', '三千年的沉默', 80);
show('assets/js/core/i18n-story.js', 'Three thousand years of Egyptian', 80);
show('assets/js/core/i18n-story.js', '据说西塞罗', 80);
show('assets/js/core/i18n-story.js', '西塞罗在《书信集》', 100);
show('assets/js/core/i18n-story.js', '四十首诗编成', 100);
show('assets/js/core/i18n-story.js', '同时模拟三十二组', 60);
show('assets/js/core/i18n-story.js', 'thirty-two Enigma', 60);
show('assets/js/core/i18n-story.js', '阿姆斯特丹自由大学', 60);
show('assets/js/core/i18n-archive.js', '2017 年同获图灵奖', 60);
show('assets/js/core/i18n-archive.js', '2017', 30);
show('assets/js/map.js', '-179.5', 80);
show('assets/js/map.js', '37.0', 60);
show('assets/js/timeline.js', '罗塞塔石碑出土', 60);
show('assets/js/timeline.js', 'Cryptomenytices', 80);
show('assets/js/timeline.js', 'Kryptos', 80);
show('assets/js/map.js', 'Kryptos', 60);
show('assets/js/timeline.js', '1404', 120);
