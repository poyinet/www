/* B2 锚点提取 */
const fs = require('fs');
function show(f, k, len) {
  const t = fs.readFileSync(f, 'utf8');
  const i = t.indexOf(k);
  console.log('== ' + f + ' @ "' + k.slice(0, 20) + '" == ' + (i < 0 ? 'NOT FOUND' : ''));
  if (i >= 0) console.log(JSON.stringify(t.slice(i, i + (len || 130))));
}
show('assets/js/core/i18n-story.js', '他试着把希腊字母的音读进圈内符号', 100);
show('assets/js/core/i18n-story.js', '同一时代的东方', 60);
show('assets/js/core/i18n-story.js', 'The contemporary East', 60);
show('assets/js/core/i18n-story.js', '法国外交官', 80);
show('assets/js/core/i18n-story.js', '外交邮袋', 80);
show('assets/js/core/i18n-story.js', 'diplomatic pouch', 80);
show('assets/js/core/i18n-story.js', '蒙哥马利据此把潜艇', 80);
show('assets/js/core/i18n-story.js', 'JN-25 的加表每天一换', 60);
show('assets/js/core/i18n-story.js', '同一天发出的电报', 60);
show('assets/js/core/i18n-story.js', '两百年后启发了莫尔斯电码与二进制', 40);
show('assets/js/core/quotes.js', '断电', 100);
show('assets/js/core/i18n-archive.js', '它是否藏在黑暗', 80);
show('assets/js/core/i18n-archive.js', '四十首五言诗', 60);
show('assets/js/timeline.js', '1953', 80);
show('assets/js/timeline.js', '紫密被破', 80);
show('assets/js/timeline.js', "y: 1994", 80);
show('assets/js/map.js', '-122.4', 80);
show('assets/js/map.js', '比特币', 80);
show('assets/js/map.js', 'Polygraphia', 60);
show('assets/js/map.js', '祖冲之', 60);
show('games/hill/hill-i18n.js', '史上第一个', 60);
show('games/acrostic/acrostic-i18n.js', '答错', 60);
