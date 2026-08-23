const fs = require('fs');
let bad = [];
for (const d of fs.readdirSync('games')) {
  const p = 'games/' + d + '/index.html';
  if (fs.existsSync(p)) {
    const c = fs.readFileSync(p, 'utf8');
    if (c.includes('< id="content"')) bad.push(d);
  }
}
console.log('游戏页残留损坏标签: ' + bad.length + (bad.length ? ' ' + bad.join(',') : ''));
/* 同时验证根页面主容器 id 正确性 */
const rootPages = ['index.html', 'games.html', 'stories.html', 'people.html', 'artifacts.html', 'glossary.html', 'workshop.html', 'quiz.html', 'duel.html', 'morse-listen.html', 'path.html', 'stats.html', 'story.html'];
rootPages.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const m = c.match(/<(div|main) id="content" class="[^"]+"/);
  console.log((m ? '✓' : '✗') + ' ' + f + (m ? ' -> ' + m[0] : ' 无 id=content'));
});
