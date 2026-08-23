/* 破译 DECODE ARCADE · lightsout 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.lightsout.tutTitle'] = '点灯 · 玩法';
  d.en['gs.lightsout.tutTitle'] = 'Lights Out · How to Play';
  d.zh['gs.lightsout.tut1t'] = '目标';
  d.en['gs.lightsout.tut1t'] = 'Objective';
  d.zh['gs.lightsout.tut1'] = '把所有灯都熄灭（全部变暗）。';
  d.en['gs.lightsout.tut1'] = 'Turn off every light (make all the cells dark).';
  d.zh['gs.lightsout.tut2t'] = '规则';
  d.en['gs.lightsout.tut2t'] = 'Rule';
  d.zh['gs.lightsout.tut2'] = '点一个格子会翻转它本身和上下左右相邻格的明暗。';
  d.en['gs.lightsout.tut2'] = 'Clicking a cell flips its own state and the states of the cells above, below, left and right.';
  d.zh['gs.lightsout.tut3t'] = '难度';
  d.en['gs.lightsout.tut3t'] = 'Difficulty';
  d.zh['gs.lightsout.tut3'] = '简单 3×3 / 普通 5×5。';
  d.en['gs.lightsout.tut3'] = 'Easy 3×3 / Normal 5×5.';
  d.zh['gs.lightsout.tut4t'] = '计分';
  d.en['gs.lightsout.tut4t'] = 'Scoring';
  d.zh['gs.lightsout.tut4'] = '步数越少越好，成绩=点击次数。';
  d.en['gs.lightsout.tut4'] = 'Fewer moves is better — your score is the number of clicks.';
  d.zh['gs.lightsout.modeEasy'] = '简单 3×3';
  d.en['gs.lightsout.modeEasy'] = 'Easy 3×3';
  d.zh['gs.lightsout.modeNormal'] = '普通 5×5';
  d.en['gs.lightsout.modeNormal'] = 'Normal 5×5';
  d.zh['gs.lightsout.stepsFmt'] = '步数：{n}';
  d.en['gs.lightsout.stepsFmt'] = 'Moves: {n}';
  d.zh['gs.lightsout.winFmt'] = '🎉 全部熄灭！用了 {n} 步';
  d.en['gs.lightsout.winFmt'] = '🎉 All lights out! It took {n} moves';
})();
