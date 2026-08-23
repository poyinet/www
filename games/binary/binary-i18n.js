/* 破译 DECODE ARCADE · binary 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.binary.tutTitle'] = '二进制破译 · 玩法';
  d.en['gs.binary.tutTitle'] = 'Binary Code · How to Play';
  d.zh['gs.binary.tut1t'] = '目标';
  d.en['gs.binary.tut1t'] = 'Objective';
  d.zh['gs.binary.tut1'] = '每 8 位二进制对应一个 ASCII 字符，把整段电文还原成英文。';
  d.en['gs.binary.tut1'] = 'Every 8 bits make one ASCII character — decode the whole message into English.';
  d.zh['gs.binary.tut2t'] = '操作';
  d.en['gs.binary.tut2t'] = 'Controls';
  d.zh['gs.binary.tut2'] = '在每个二进制块下方的框里输入它代表的字母（空格位已自动填好，无需输入）。';
  d.en['gs.binary.tut2'] = 'Type the letter each binary block stands for in the box below it (space slots are pre-filled for you).';
  d.zh['gs.binary.tut3t'] = '换算';
  d.en['gs.binary.tut3t'] = 'Conversion';
  d.zh['gs.binary.tut3'] = '二进制转十进制即得字符编号，例如 01000001 = 65 = A。';
  d.en['gs.binary.tut3'] = 'Convert binary to decimal to get the character code — e.g. 01000001 = 65 = A.';
  d.zh['gs.binary.tut4t'] = '计分';
  d.en['gs.binary.tut4t'] = 'Scoring';
  d.zh['gs.binary.tut4'] = '用时越短成绩越高（成绩=完成秒数）。';
  d.en['gs.binary.tut4'] = 'Faster is better (score = seconds to finish).';
  d.zh['gs.binary.dEasy'] = '简单';
  d.en['gs.binary.dEasy'] = 'Easy';
  d.zh['gs.binary.dNormal'] = '普通';
  d.en['gs.binary.dNormal'] = 'Normal';
  d.zh['gs.binary.dHard'] = '困难';
  d.en['gs.binary.dHard'] = 'Hard';
  d.zh['gs.binary.lblCipher'] = '截获二进制电文（每 8 位 = 1 字符）';
  d.en['gs.binary.lblCipher'] = 'Intercepted binary message (8 bits = 1 character)';
  d.zh['gs.binary.typeHint'] = '逐个还原字符';
  d.en['gs.binary.typeHint'] = 'Decode the characters one by one';
  d.zh['gs.binary.newPuzzle'] = '换一题';
  d.en['gs.binary.newPuzzle'] = 'New puzzle';
  d.zh['gs.binary.msgWin'] = '✓ 破译成功！明文：{msg}';
  d.en['gs.binary.msgWin'] = '✓ Cipher broken! Plaintext: {msg}';
})();
