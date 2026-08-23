/* 破译 DECODE ARCADE · sudoku 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.sudoku.tut1t'] = '目标';
  d.en['gs.sudoku.tut1t'] = 'Goal';
  d.zh['gs.sudoku.tut1'] = '在 9×9 格内填满 1-9，使每行、每列、每宫都含 1-9 不重复。';
  d.en['gs.sudoku.tut1'] = 'Fill the 9×9 grid with 1-9 so every row, column and box contains 1-9 exactly once.';
  d.zh['gs.sudoku.tut2t'] = '操作';
  d.en['gs.sudoku.tut2t'] = 'Controls';
  d.zh['gs.sudoku.tut2'] = '点空格选中，再点数字键盘填入；固定数字不可改。';
  d.en['gs.sudoku.tut2'] = 'Tap an empty cell to select it, then tap the number pad to fill it; fixed numbers cannot be changed.';
  d.zh['gs.sudoku.tut3t'] = '计分';
  d.en['gs.sudoku.tut3t'] = 'Scoring';
  d.zh['gs.sudoku.tut3'] = '用时越少越好（难度越高挖空越多）；成绩=完成秒数+错误次数×5 秒。';
  d.en['gs.sudoku.tut3'] = 'Less time is better (higher difficulty means more empty cells); score = seconds + 5s per error.';
  d.zh['gs.sudoku.tutTitle'] = '数独 · 玩法';
  d.en['gs.sudoku.tutTitle'] = 'Sudoku · How to Play';
  d.zh['gs.sudoku.dailyMsg'] = '📅 每日一题（{n}）—— 今天全世界同一个谜题';
  d.en['gs.sudoku.dailyMsg'] = '📅 Daily puzzle ({n}) — the same puzzle for everyone today';
  d.zh['gs.sudoku.newBtn'] = '新局';
  d.en['gs.sudoku.newBtn'] = 'New';
  d.zh['gs.sudoku.dailyBtn'] = '📅 每日';
  d.en['gs.sudoku.dailyBtn'] = '📅 Daily';
  d.zh['gs.sudoku.easy'] = '简单';
  d.en['gs.sudoku.easy'] = 'Easy';
  d.zh['gs.sudoku.normal'] = '普通';
  d.en['gs.sudoku.normal'] = 'Normal';
  d.zh['gs.sudoku.hard'] = '困难';
  d.en['gs.sudoku.hard'] = 'Hard';
  d.zh['gs.sudoku.noteBtn'] = '✏️ 笔记';
  d.en['gs.sudoku.noteBtn'] = '✏️ Notes';
  d.zh['gs.sudoku.win'] = '🎉 数独完成！用时 {a} 秒';
  d.en['gs.sudoku.win'] = '🎉 Sudoku complete in {a} seconds';
  d.zh['gs.sudoku.winErr'] = '，错误 {n} 次';
  d.en['gs.sudoku.winErr'] = ', {n} errors';
  d.zh['gs.sudoku.winClean'] = '，零失误！';
  d.en['gs.sudoku.winClean'] = ', no mistakes!';
})();
