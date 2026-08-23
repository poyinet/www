/* 破译 DECODE ARCADE · codeguess 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.codeguess.tut1t'] = '目标';
  d.en['gs.codeguess.tut1t'] = 'Goal';
  d.zh['gs.codeguess.tut1'] = '在 6 次机会内猜出 5 字母英文密词。';
  d.en['gs.codeguess.tut1'] = 'Guess the 5-letter secret word within 6 tries.';
  d.zh['gs.codeguess.tut2t'] = '操作';
  d.en['gs.codeguess.tut2t'] = 'Controls';
  d.zh['gs.codeguess.tut2'] = '用屏幕键盘或物理键盘输入字母，Enter 提交猜测。';
  d.en['gs.codeguess.tut2'] = 'Type letters on the on-screen or physical keyboard; press Enter to submit a guess.';
  d.zh['gs.codeguess.tut3t'] = '反馈';
  d.en['gs.codeguess.tut3t'] = 'Feedback';
  d.zh['gs.codeguess.tut3'] = '绿=字母位置正确；黄=字母在词中但位置错；灰=不在词中。';
  d.en['gs.codeguess.tut3'] = 'Green = letter is correct and in place; yellow = in the word but wrong spot; gray = not in the word.';
  d.zh['gs.codeguess.tut4t'] = '计分';
  d.en['gs.codeguess.tut4t'] = 'Scoring';
  d.zh['gs.codeguess.tut4'] = '越早猜中越好，成绩=猜测次数（越少越高）。';
  d.en['gs.codeguess.tut4'] = 'Guess it sooner for a better score — your score is the number of tries (fewer is better).';
  d.zh['gs.codeguess.notFull'] = '字母还没填满！';
  d.en['gs.codeguess.notFull'] = 'Not enough letters yet!';
  d.zh['gs.codeguess.win'] = '🎉 破译成功！用了 {n} 次';
  d.en['gs.codeguess.win'] = '🎉 Decoded in {n} tries';
  d.zh['gs.codeguess.reveal'] = '💀 答案揭晓：{w}';
  d.en['gs.codeguess.reveal'] = '💀 The answer: {w}';
  d.zh['gs.codeguess.continue'] = '继续推理…（剩 {n} 次）';
  d.en['gs.codeguess.continue'] = 'Keep going… ({n} tries left)';
  d.zh['gs.codeguess.again'] = '🔄 再来一局';
  d.en['gs.codeguess.again'] = '🔄 Play again';
})();
