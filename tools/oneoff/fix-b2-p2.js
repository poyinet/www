/* B2：P2 修复（编年史 6 + 知识库 9 + 游戏 2 + 题库 1 + 语录标注） */
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

const STORY = 'assets/js/core/i18n-story.js';

/* 编年史 P2 */
rep(STORY, '他试着把希腊字母的音读进圈内符号……成功了。',
    '他试着把希腊字母的音读进圈内符号——据说再借另一件双语文物方尖碑交叉验证……成功了。', 'c0 托勒密方尖碑');
rep(STORY, '同一时代的东方，另一种答案已在成形：周人以「阴符」',
    '更早的东方，另一种答案早已成形：周人以「阴符」', 'c1 东方年代 zh');
rep(STORY, 'The contemporary East went further still: the Liu Tao',
    'Centuries earlier, the East had answered: the Liu Tao', 'c1 东方年代 en');
rep(STORY, '法国外交官[[vigenere]]在 1586 年发表多表替换密码：密钥逐字母决定',
    '法国外交官[[vigenere]]在 1586 年出版《密码论》——后世把这类多表替换冠以他的名字（真正的首发者是 1553 年的贝拉索，见本章冷知识）：密钥逐字母决定', 'c3 维吉尼亚归属');
rep(STORY, '外交邮袋转手，经美国国务院电缆辗转伦敦、再传往美洲，而这条线路，正是伦敦海军部 40 号房（Room 40）日夜监听的地方。',
    '借道美国国务院的外交电缆转发——线路恰好经伦敦登陆，而这条线路，正是伦敦海军部 40 号房（Room 40）日夜监听的地方。', 'c4 邮袋→电缆 zh');
rep(STORY, 'diplomatic pouch, then across the Atlantic on the U.S. State Department cable',
    'U.S. State Department cable — routed through London', 'c4 邮袋→电缆 en');
rep(STORY, '蒙哥马利据此把潜艇与轰炸机派到准确的海域，一艘接一艘击沉运油船。',
    '盟军海空军据此把伏击线画到准确的海域，一艘接一艘击沉运油船；蒙哥马利则凭它握住了隆美尔的底牌。', 'c5 油船主语');
rep(STORY, 'JN-25 的加表每天一换，电文不会等人',
    'JN-25 的加表定期换版、期内反复使用，电文不会等人', 'c6 加表机制 zh');
rep(STORY, '同一天发出的电报，共享同一张加表。',
    '同一版加表期内的电报，共享同一张加表。', 'c6 深度成因 zh');

/* 知识库 P2 */
rep('assets/js/core/i18n-archive.js', '它是否藏在黑暗之中？」（Does it hide in the dark?）',
    'CAN YOU SEE ANYTHING Q？」（「你能看到什么了吗？Q？」——化用卡特开启图坦卡蒙墓的记述）', 'kryptos K3 结尾');
rep('assets/js/core/i18n-archive.js', '四十首五言诗为底，临阵之际主将密定一钥字。',
    '一首四十字、字不重复的五言诗为底，临阵之际主将密定一钥字。', 'ziyan text 四十首→一首');

/* 时间线 P2 */
rep('assets/js/timeline.js', "1953, zh: 'VENONA 曝光罗森伯格', en: 'VENONA exposes Rosenbergs'",
    "1953, zh: 'VENONA 锁定罗森伯格', en: 'VENONA IDs the Rosenbergs'", 'VENONA 措辞');
rep('assets/js/timeline.js', "紫密被破 · 珍珠港', en: 'Purple broken · Pearl Harbor'",
    "紫密被破 · 次年珍珠港', en: 'Purple broken · Pearl Harbor next year'", '紫密年份口径');
rep('assets/js/timeline.js', "y: 1994, zh: '量子密码实验', en: 'Quantum crypto experiments'",
    "y: 1989, zh: '首次 QKD 实验', en: 'First QKD demo (Bennett et al.)'", '量子 1989');

/* 地图 P2 */
rep('assets/js/map.js', 'x: -122.4, y: 37.8, zh: \'PGP\'', 'x: -105.27, y: 40.01, zh: \'PGP\'', 'PGP 博尔德');
rep('assets/js/map.js', '《Polygraphia》在此问世', '特里特米乌斯晚年居于此地，《Polygraphia》1518 年在美因茨印行', 'Polygraphia 美因茨');

/* 游戏文案 P2 */
rep('games/hill/hill-i18n.js', '史上第一个「多字母分组密码」：把字母看成数字',
    '首个实用化的「矩阵分组密码」：把字母看成数字', 'hill tut1 口径');
rep('games/acrostic/acrostic-i18n.js', '答错揭示答案但可继续。', '答错可换选项继续，答对后高亮行首揭晓。', 'acrostic tut3 行为对齐');

/* 题库 P2 */
rep('assets/js/quiz.js', "Blaise de Vigenère's rival Bellaso", "Bellaso", 'quiz #56 en 选项');

/* 语录标注：14 位人物的文学化语录补（意译/编者拟） */
const PEOPLE = ['cocks', 'ellis', 'feistel', 'rivest', 'vigenere', 'efriedman', 'knox', 'alexander', 'wiesner', 'bennett', 'brassard', 'shor', 'grover', 'wangxy', 'shannon'];
const ARCH = 'assets/js/core/i18n-archive.js';
let at = 0;
const at0 = fs.readFileSync(ARCH, 'utf8');
let ta = at0;
PEOPLE.forEach(function (id) {
  const k = "dd.zh['stp." + id + ".quote']";
  const i = ta.indexOf(k);
  if (i < 0) { console.error('✗ quote 键未找到: ' + id); fail++; return; }
  /* 在该行的行尾（分号前）追加标注 */
  const lineEnd = ta.indexOf('\n', i);
  let line = ta.slice(i, lineEnd);
  if (line.includes('意译') || line.includes('编者拟')) return;
  const newLine = line.replace(/';\s*$/, '（意译，编者拟）\';');
  if (newLine === line) { console.error('✗ 行尾格式异常: ' + id); fail++; return; }
  ta = ta.slice(0, i) + newLine + ta.slice(lineEnd);
  at++;
  /* en 侧 */
  const ke = "dd.en['stp." + id + ".quote']";
  const ie = ta.indexOf(ke);
  if (ie >= 0) {
    const le = ta.indexOf('\n', ie);
    let le2 = ta.slice(ie, le);
    if (!le2.includes('paraphrased')) {
      const fixed = le2.replace(/';\s*$/, ' (paraphrased)\';').replace(/";\s*$/, ' (paraphrased)";');
      ta = ta.slice(0, ie) + fixed + ta.slice(le);
    }
  }
});
fs.writeFileSync(ARCH, ta);
console.log('✓ 语录标注 ' + at + ' 人');
n += at;

/* schneier.fact 换真实引文（整句替换） */
rep('assets/js/core/i18n-dict.js',
  "d.zh['stp.schneier.fact'] = '冷知识：他的《应用密码学》序言里藏着一句著名的提醒——「学习密码学的正确方式是先学会忘记它」；而他运营至今二十余年的博客「Schneier on Security」，是世界上读者最多的安全专栏。';",
  "d.zh['stp.schneier.fact'] = '冷知识：《应用密码学》序言里有句名言——「世上有两种密码：一种挡得住你妹妹翻你的文件，一种挡得住大政府」；他运营二十余年的博客「Schneier on Security」是世界上读者最多的安全专栏。';", 'schneier.fact 换真句');

console.log('\ndone. replaced=' + n + ' failed=' + fail);
process.exit(fail ? 1 : 0);
