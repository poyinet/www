/* 内容盘点：章节正文体量、教程覆盖、每日游戏、密件描述完成度 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

console.log('=== 章节正文体量（字符数）===');
const story = fs.readFileSync(path.join(ROOT, 'assets/js/core/i18n-story.js'), 'utf8');
for (let i = 0; i < 11; i++) {
  const mz = story.match(new RegExp("d.zh\\['st.c" + i + "\\.b'\\] = '([^']*)'"));
  const me = story.match(new RegExp("d.en\\['st.c" + i + "\\.b'\\] = '([^']*)'"));
  console.log('c' + i + ': zh=' + (mz ? mz[1].length : '缺失') + '  en=' + (me ? me[1].length : '缺失'));
}

console.log('\n=== 教程覆盖 ===');
const dirs = fs.readdirSync(path.join(ROOT, 'games')).filter((d) => fs.existsSync(path.join(ROOT, 'games', d, 'index.html')));
let withTut = 0;
const noTut = [];
for (const id of dirs) {
  const js = fs.readFileSync(path.join(ROOT, 'games', id, id + '.js'), 'utf8');
  if (js.includes('GAME_TUTORIAL_STEPS')) withTut++; else noTut.push(id);
}
console.log('有教程: ' + withTut + '/' + dirs.length);
console.log('无教程: ' + noTut.join(', '));

console.log('\n=== 密件 desc/text 完成度 ===');
const dict = fs.readFileSync(path.join(ROOT, 'assets/js/core/i18n-dict.js'), 'utf8');
const zhA = dict.match(/var zhA = \{ ([^}]+) \}/);
const artIds = [];
if (zhA) {
  const re = /([a-z-]+): \[/g;
  let m;
  while ((m = re.exec(zhA[1]))) artIds.push(m[1]);
}
console.log('密件数: ' + artIds.length);
for (const a of artIds) {
  const hasDesc = dict.includes("'sta." + a + ".desc'");
  const hasText = dict.includes("'sta." + a + ".text'");
  console.log('  ' + a + ': desc=' + (hasDesc ? '✓' : '✗') + ' text=' + (hasText ? '✓' : '✗'));
}

console.log('\n=== 每日破译 ===');
console.log(JSON.stringify(['sudoku', 'enigma', 'bifid', 'slitherlink', 'hashi', 'trifid', 'bacon']));

console.log('\n=== 章节挑战（challenge 字段）===');
const st = fs.readFileSync(path.join(ROOT, 'assets/js/stories.js'), 'utf8');
const chRe = /challenge:\s*'([^']+)'/g;
let cm; const chs = [];
while ((cm = chRe.exec(st))) chs.push(cm[1]);
console.log('挑战: ' + chs.join(', '));
