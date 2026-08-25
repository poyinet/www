/* P3 批处理 + 体验补链 */
const fs = require('fs');
let n = 0, fail = 0;
function rep(f, from, to, tag) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) { console.error('MISS: ' + tag + ' @ ' + f); fail++; return; }
  t = t.split(from).join(to);
  fs.writeFileSync(f, t);
  n++;
  console.log('OK ' + tag);
}

/* P3 措辞 */
rep('assets/js/core/i18n-archive.js', '美州密码学大会', '美洲密码学大会（美国加州圣巴巴拉）', '美州→美洲');
rep('assets/js/core/i18n-story.js', '九百年后，布莱切利园里的人们所做的', '约十一个世纪后，布莱切利园里的人们所做的', '九百年→十一世纪');
rep('assets/js/core/i18n-story.js', '佩恩万 每天', '佩恩万每天', '佩恩万空格');
rep('games/solitaire/index.html', '四步规程', '五步规程', 'solitaire 四→五步');
rep('assets/js/games.js', '四步规程', '五步规程', 'games.js solitaire 四→五');

/* gomoku zh desc 补 AI */
let gd = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8');
const gk = "'g.gomoku.d': '五子棋";
const gi = gd.indexOf(gk);
if (gi >= 0) {
  const gEnd = gd.indexOf("',", gi);
  const gLine = gd.slice(gi, gEnd);
  if (!gLine.includes('AI')) {
    gd = gd.slice(0, gEnd) + '，支持人机对战' + gd.slice(gEnd);
    fs.writeFileSync('assets/js/core/i18n-dict.js', gd);
    console.log('OK gomoku AI');
    n++;
  }
}

/* games.html 页脚补 4 入口 */
let gh = fs.readFileSync('games.html', 'utf8');
const fi = gh.indexOf('lobby-footer');
if (fi > 0) {
  const insert = '<div style="text-align:center;padding:8px 16px"><a href="workshop.html" style="font-size:12px;color:var(--neon-cyan);text-decoration:none;margin:0 8px">\u{1F9EA} \u7834\u8BD1\u5DE5\u574A</a> <a href="protocols.html" style="font-size:12px;color:var(--neon-cyan);text-decoration:none;margin:0 8px">\u{1F6E1}\uFE0F \u534F\u8BAE\u5B9E\u9A8C\u5BA4</a> <a href="quotes.html" style="font-size:12px;color:var(--neon-cyan);text-decoration:none;margin:0 8px">\u{1F4AC} \u540D\u8A00\u5899</a> <a href="path.html" style="font-size:12px;color:var(--neon-cyan);text-decoration:none;margin:0 8px">\u{1F5FA}\uFE0F \u5B66\u4E60\u8DEF\u5F84</a></div>';
  gh = gh.slice(0, fi) + insert + gh.slice(fi);
  fs.writeFileSync('games.html', gh);
  console.log('OK games footer links');
  n++;
} else { console.error('MISS games footer'); fail++; }

/* workshop hero 补 quotes 入口 */
let wh = fs.readFileSync('workshop.html', 'utf8');
const wAnchor = 'data-i18n="workshop.protocolLink"';
const wi = wh.indexOf(wAnchor);
if (wi > 0) {
  const lineEnd = wh.indexOf('</a></div>', wi);
  const insert = ' <a class="btn" href="quotes.html" style="font-size:12px;padding:8px 16px">\u{1F4AC} \u540D\u8A00\u5899 \u2192</a></div>';
  wh = wh.slice(0, lineEnd) + insert + wh.slice(lineEnd + '</a></div>'.length);
  fs.writeFileSync('workshop.html', wh);
  console.log('OK workshop quotes link');
  n++;
} else { console.error('MISS workshop anchor'); fail++; }

/* quiz.js 头注 100→120 */
rep('assets/js/quiz.js', '100 题', '120 题', 'quiz.js 头注');

console.log('\ndone. replaced=' + n + ' failed=' + fail);
process.exit(fail ? 1 : 0);
