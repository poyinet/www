/* 复查/D 批次：dict 追加 D1 分层键 */
const fs = require('fs');
const FILE = 'assets/js/core/i18n-dict.js';
let s = fs.readFileSync(FILE, 'utf8');
if (s.includes("'st.coreGames'")) { console.log('present'); process.exit(0); }
s += `
/* 第四期 D1：核心/彩蛋分层标题 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['st.coreGames'] = '核心密码局——本章主线的破译玩法'; d.en['st.coreGames'] = 'Core cipher games — the decoding mainline of this chapter';
  d.zh['st.bonusGames'] = '时代彩蛋——玩法致敬这个时代的风景'; d.en['st.bonusGames'] = 'Era bonus games — play that salutes the scenery of the age';
})();
`;
fs.writeFileSync(FILE, s, 'utf8');
console.log('D1 keys appended');
