/* 破译 DECODE ARCADE · fillomino 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.fillomino.tutTitle'] = '拼图填数 · 玩法';
  d.en['gs.fillomino.tutTitle'] = 'Fillomino · How to Play';
  d.zh['gs.fillomino.tut1t'] = '目标';
  d.en['gs.fillomino.tut1t'] = 'Objective';
  d.zh['gs.fillomino.tut1'] = '在空格里填数字：相同数字必须连通成一块，且块内格子数=数字本身。';
  d.en['gs.fillomino.tut1'] = 'Fill the empty cells with numbers: identical numbers must connect into one block, and the block\u2019s cell count must equal the number itself.';
  d.zh['gs.fillomino.tut2t'] = '操作';
  d.en['gs.fillomino.tut2t'] = 'Controls';
  d.zh['gs.fillomino.tut2'] = '点格子循环填入数字 1~4（或清空）。已给出的种子数字不可改。';
  d.en['gs.fillomino.tut2'] = 'Tap a cell to cycle through numbers 1\u20134 (or clear it). Given clue numbers can\u2019t be changed.';
  d.zh['gs.fillomino.tut3t'] = '技巧';
  d.en['gs.fillomino.tut3t'] = 'Tips';
  d.zh['gs.fillomino.tut3'] = '数字 1 永远单独一格；从已给出的数字向外扩展，块铺满后换下一个。';
  d.en['gs.fillomino.tut3'] = 'A 1 always stands alone; expand outward from the given numbers, then move on once a block is complete.';
  d.zh['gs.fillomino.tut4t'] = '计分';
  d.en['gs.fillomino.tut4t'] = 'Scoring';
  d.zh['gs.fillomino.tut4'] = '全部填对即完成，成绩=完成用时（秒）。';
  d.en['gs.fillomino.tut4'] = 'Fill everything correctly to finish \u2014 score = completion time in seconds.';
  d.zh['gs.fillomino.startMsg'] = '填满所有空格：同数连通成块，块面积=数字';
  d.en['gs.fillomino.startMsg'] = 'Fill every empty cell: same numbers connect into a block whose area equals the number';
  d.zh['gs.fillomino.restart'] = '重新开始';
  d.en['gs.fillomino.restart'] = 'Restart';
  d.zh['gs.fillomino.help'] = '💡 规则：所有格子都要填数；相同数字的格子必须上下左右连通成一片，且这片格子的总数=数字。不同数字的块不能相邻。';
  d.en['gs.fillomino.help'] = '💡 Rule: every cell must be filled; cells with the same number must connect orthogonally into one region, and that region\u2019s total equals the number. Blocks of different numbers can\u2019t touch.';
  d.zh['gs.fillomino.win'] = '🎉 完成！用时 {s} 秒 · {n} 步';
  d.en['gs.fillomino.win'] = '🎉 Complete! {s}s \u00b7 {n} moves';
  d.zh['gs.fillomino.helpText'] = '数方是约束满足谜题：每个区域的大小约束邻域的扩展——与密码分析中「已知约束逐步缩小密钥空间」的推理链完全一致。';
  d.en['gs.fillomino.helpText'] = 'Fillomino is a constraint-satisfaction puzzle: each region\'s size constrains its neighbors — mirroring how known constraints progressively narrow the keyspace in cryptanalysis.';
})();
