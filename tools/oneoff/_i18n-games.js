/* i18n-story.js 与各游戏 *-i18n.js 键对称性检查（支持 d.zh['k']= 形式） */
const fs = require('fs');

function analyze(file) {
  const code = fs.readFileSync(file, 'utf8');
  const zh = new Set(), en = new Set();
  const re = /d\.(zh|en)\['([^']+)'\]\s*=/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[1] === 'zh') zh.add(m[2]); else en.add(m[2]);
  }
  const onlyZh = [...zh].filter(k => !en.has(k));
  const onlyEn = [...en].filter(k => !zh.has(k));
  return { zh: zh.size, en: en.size, onlyZh, onlyEn };
}

const story = analyze('assets/js/core/i18n-story.js');
console.log('== i18n-story.js == zh:', story.zh, 'en:', story.en);
console.log('  onlyZh:', story.onlyZh.length, story.onlyZh.slice(0, 30));
console.log('  onlyEn:', story.onlyEn.length, story.onlyEn.slice(0, 30));

// game dicts (gs.* via dict object)
const dirs = fs.readdirSync('games').filter(d => fs.existsSync('games/' + d + '/' + d + '-i18n.js'));
let asym = [];
for (const d of dirs) {
  const code = fs.readFileSync('games/' + d + '/' + d + '-i18n.js', 'utf8');
  // 支持两种形式：{zh:{...},en:{...}} 与 d.zh['k']=
  const zh = new Set(), en = new Set();
  let m;
  const re1 = /(?:d\.)?(zh|en)\['([^']+)'\]\s*=/g;
  while ((m = re1.exec(code)) !== null) { (m[1] === 'zh' ? zh : en).add(m[2]); }
  if (!zh.size && !en.size) {
    const re2 = /(?:^|\s)(zh|en)\s*:\s*\{/gm;
    // dict-object style: 查找 zh:{...} en:{...} 块内键
    const zhMatch = code.match(/zh\s*:\s*\{([\s\S]*?)\n\s*\}/);
    const enMatch = code.match(/en\s*:\s*\{([\s\S]*?)\n\s*\}/);
    if (zhMatch && enMatch) {
      const keyRe = /'([^']+)'\s*:/g;
      while ((m = keyRe.exec(zhMatch[1])) !== null) zh.add(m[1]);
      while ((m = keyRe.exec(enMatch[1])) !== null) en.add(m[1]);
    }
  }
  const onlyZh = [...zh].filter(k => !en.has(k));
  const onlyEn = [...en].filter(k => !zh.has(k));
  if (onlyZh.length || onlyEn.length) {
    asym.push(d + ': zh=' + zh.size + ' en=' + en.size + ' onlyZh=[' + onlyZh.slice(0, 4).join(',') + '] onlyEn=[' + onlyEn.slice(0, 4).join(',') + ']');
  }
}
console.log('== game i18n files checked:', dirs.length, 'asymmetric:', asym.length);
asym.forEach(a => console.log('  -', a));
