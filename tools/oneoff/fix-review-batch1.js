/* 复查修复批次1（v4）：唯一子串替换 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(process.cwd(), 'assets', 'js', 'core', 'i18n-dict.js');let s = fs.readFileSync(FILE, 'utf8');
let n = 0;
function rep(from, to) { if (s.includes(from)) { s = s.split(from).join(to); n++; } else console.error('MISS:', from); }
rep('11 时代时间轴', '12 时代时间轴');
rep('11 eras (lit by playing', '12 eras (lit by playing');
rep('通关游戏解锁 29 件历史密件', '通关游戏解锁 41 件历史密件');
rep('unlock 29 historical cipher artifacts', 'unlock 41 historical cipher artifacts');
rep("100+ 术语", "158 个术语");
rep("'glossary.sub': '100+ terms", "'glossary.sub': '158 terms");
fs.writeFileSync(FILE, s, 'utf8');
console.log('applied:', n);
