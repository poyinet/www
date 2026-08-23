/* 全站页脚注入隐藏彩蛋线索（N3）：每个页面页脚一行极小字密文线索 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* 页面 → 彩蛋提示（密文本身故意不直接展示，只给"哪里找"的线索；密文藏于页面源码注释） */
const EGGS = [
  { file: 'index.html', id: 'e01', hint: '🎯 有 16 枚彩蛋散落全站。第一枚就藏在本页——页脚第三行，凯撒偏移 3。', cipherComment: 'EGG:e01:DUFDGH' },
  { file: 'games.html', id: 'e02', hint: '🎯 第二枚：本页页脚。点划之间，是摩斯。', cipherComment: 'EGG:e02:.--. .-.. .- -.--' },
  { file: 'stories.html', id: 'e03', hint: '🎯 第三枚：本页页脚。A 与 B 的 5 位密码，培根之书。', cipherComment: 'EGG:e03:BAABABAABBABBBABAAABBBAAA' },
  { file: 'people.html', id: 'e04', hint: '🎯 第四枚：本页页脚。0 与 1 的海洋。', cipherComment: 'EGG:e04:01000011 01001111 01000100 01000101' },
  { file: 'artifacts.html', id: 'e05', hint: '🎯 第五枚：本页页脚。可打印的暗号。', cipherComment: 'EGG:e05:U0VDUkVU' },
  { file: 'stats.html', id: 'e06', hint: '🎯 第六枚：本页页脚。密钥 CODE，逐字母换表。', cipherComment: 'EGG:e06:EWSLGF' },
  { file: 'story.html', id: 'e07', hint: '🎯 第七枚：本页页脚。三轨锯齿，读法换位。', cipherComment: 'EGG:e07:DDEOEC' },
  { file: 'glossary.html', id: 'e08', hint: '🎯 第八枚：本页页脚。异或的十六进制，密钥 KEY。', cipherComment: 'EGG:e08:09171c0a0e' },
  { file: '404.html', id: 'e09', hint: '🎯 第九枚：本页页脚。乘 a 加 b，a=5 b=8。', cipherComment: 'EGG:e09:REVZCP' },
  { file: 'stats.html', id: 'e10', hint: '🎯 第十枚：本页页脚第二行。整表倒序的替换。', cipherComment: 'EGG:e10:NZHGVI' },
  { file: 'workshop.html', id: 'e11', hint: '🎯 第十一枚：本页页脚。5×5 方阵，密钥 ARCADE。', cipherComment: 'EGG:e11:ELUCUUCV' },
  { file: 'index.html', id: 'e12', hint: '🎯 第十二枚：首页时间线尽头，2×2 矩阵之战。', cipherComment: 'EGG:e12:AYDYSQ' },
  { file: 'quiz.html', id: 'e13', hint: '🎯 第十三枚：本页页脚。维吉尼亚，密钥 QUIZ。', cipherComment: 'EGG:e13:BYIQD' },
  { file: 'duel.html', id: 'e14', hint: '🎯 第十四枚：本页页脚。Playfair，密钥 DUEL。', cipherComment: 'EGG:e14:VKOOFX' },
  { file: 'morse-listen.html', id: 'e15', hint: '🎯 第十五枚：本页页脚。点与划，听出它。', cipherComment: 'EGG:e15:.-.. .. ... - . -.' },
  { file: 'path.html', id: 'e16', hint: '🎯 第十六枚：本页页脚。栅栏 4 轨。', cipherComment: 'EGG:e16:JYOEUNR' }
];

let changed = 0;
for (const egg of EGGS) {
  const p = path.join(ROOT, egg.file);
  if (!fs.existsSync(p)) { console.log('⚠ 跳过（无此文件）: ' + egg.file); continue; }
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('EGG:' + egg.id + ':')) { console.log('已存在 ' + egg.id + '，跳过 ' + egg.file); continue; }
  /* 在 </footer> 前插提示行 + 在页脚 HTML 注释里藏密文（源码可见，运行时不可见） */
  const hintLine = '    <span class="egg-hint">' + egg.hint + '</span>\n';
  const comment = '<!-- ' + egg.cipherComment + ' -->\n';
  if (/<\/footer>/.test(html)) {
    html = html.replace(/<\/footer>/, hintLine + comment + '  </footer>');
    fs.writeFileSync(p, html);
    changed++;
    console.log('✓ ' + egg.file + ' (' + egg.id + ')');
  } else {
    console.log('⚠ 无 footer: ' + egg.file);
  }
}
console.log('---\n注入 ' + changed + ' 条彩蛋线索');
