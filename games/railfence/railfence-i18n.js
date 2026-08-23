/* 破译 DECODE ARCADE · railfence 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.railfence.tutTitle'] = '栅栏密码 · 玩法';
  d.en['gs.railfence.tutTitle'] = 'Rail Fence · How to Play';
  d.zh['gs.railfence.tut1t'] = '目标';
  d.en['gs.railfence.tut1t'] = 'Objective';
  d.zh['gs.railfence.tut1'] = '栅栏密码把明文按 Z 字形写入 N 条轨道，再按行读成密文。你的任务是逆推回明文。';
  d.en['gs.railfence.tut1'] = 'The rail fence cipher writes the plaintext in a zigzag across N rails, then reads it off row by row as ciphertext. Your job is to reverse it.';
  d.zh['gs.railfence.tut2t'] = '操作';
  d.en['gs.railfence.tut2t'] = 'Controls';
  d.zh['gs.railfence.tut2'] = '拖动「轨道数」滑块，观察预览区能否还原成通顺英文；认为破解时点「验证」。';
  d.en['gs.railfence.tut2'] = 'Drag the "Rails" slider and watch the preview — when it reads as natural English, hit "Check".';
  d.zh['gs.railfence.tut3t'] = '技巧';
  d.en['gs.railfence.tut3t'] = 'Tips';
  d.zh['gs.railfence.tut3'] = '轨道数就是 Z 字形的行数。尝试 2~6 条轨道，通顺的句子就是答案。';
  d.en['gs.railfence.tut3'] = 'The rail count is the number of zigzag rows. Try 2–6 rails — the readable sentence is the answer.';
  d.zh['gs.railfence.tut4t'] = '计分';
  d.en['gs.railfence.tut4t'] = 'Scoring';
  d.zh['gs.railfence.tut4'] = '验证次数越少成绩越高（成绩=尝试次数）。';
  d.en['gs.railfence.tut4'] = 'Fewer checks mean a better score (score = number of attempts).';
  d.zh['gs.railfence.cipherLbl'] = '截获密文（Z 字形栅栏）';
  d.en['gs.railfence.cipherLbl'] = 'Intercepted ciphertext (zigzag rail fence)';
  d.zh['gs.railfence.prevLbl'] = '解码预览';
  d.en['gs.railfence.prevLbl'] = 'Decode preview';
  d.zh['gs.railfence.railsLbl'] = '轨道数';
  d.en['gs.railfence.railsLbl'] = 'Rails';
  d.zh['gs.railfence.railsUnit'] = '{n} 轨';
  d.en['gs.railfence.railsUnit'] = '{n} rails';
  d.zh['gs.railfence.checkBtn'] = '验证破译';
  d.en['gs.railfence.checkBtn'] = 'Check Decode';
  d.zh['gs.railfence.helpText'] = '💡 滑动轨道数看预览变化：栅栏密文逐行读取，正确轨道数下 Z 字形路径恢复的句子就是明文。';
  d.en['gs.railfence.helpText'] = '💡 Slide the rail count and watch the preview: the ciphertext is read row by row, and with the right rail count the zigzag path restores the plaintext.';
  d.zh['gs.railfence.success'] = '🎉 破译成功！明文 = {p}（尝试 {n} 次）';
  d.en['gs.railfence.success'] = '🎉 Decoded! Plaintext = {p} ({n} attempts)';
  d.zh['gs.railfence.fail'] = '✗ 还不是明文，换轨道数再试…';
  d.en['gs.railfence.fail'] = '✗ Not the plaintext yet — try another rail count…';
})();
