/* 破译 DECODE ARCADE · hanoi 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.hanoi.tutTitle'] = '汉诺塔 · 玩法';
  d.en['gs.hanoi.tutTitle'] = 'Tower of Hanoi · How to Play';
  d.zh['gs.hanoi.tut1t'] = '目标';
  d.en['gs.hanoi.tut1t'] = 'Objective';
  d.zh['gs.hanoi.tut1'] = '把左侧柱子上的所有圆盘移到最右侧柱子。';
  d.en['gs.hanoi.tut1'] = 'Move all disks from the left peg to the rightmost peg.';
  d.zh['gs.hanoi.tut2t'] = '规则';
  d.en['gs.hanoi.tut2t'] = 'Rules';
  d.zh['gs.hanoi.tut2'] = '每次只能移动最上面的一个盘；大盘不能压在小盘上。';
  d.en['gs.hanoi.tut2'] = 'Only the top disk of a peg can be moved; a bigger disk can never sit on a smaller one.';
  d.zh['gs.hanoi.tut3t'] = '操作';
  d.en['gs.hanoi.tut3t'] = 'Controls';
  d.zh['gs.hanoi.tut3'] = '先点源柱子选中顶盘，再点目标柱子完成移动。';
  d.en['gs.hanoi.tut3'] = 'Tap a source peg to pick up its top disk, then tap a destination peg to drop it.';
  d.zh['gs.hanoi.tut4t'] = '计分';
  d.en['gs.hanoi.tut4t'] = 'Scoring';
  d.zh['gs.hanoi.tut4'] = '移动次数越少越好，成绩=移动步数（3 盘最优 7 步）。';
  d.en['gs.hanoi.tut4'] = 'Fewer moves is better — your score is the move count (7 is optimal with 3 disks).';
  d.zh['gs.hanoi.diskCount'] = '圆盘数：';
  d.en['gs.hanoi.diskCount'] = 'Disks:';
  d.zh['gs.hanoi.hud'] = '移动步数：{n}（最优 {m}）';
  d.en['gs.hanoi.hud'] = 'Moves: {n} (optimal {m})';
  d.zh['gs.hanoi.invalid'] = '✗ 大盘不能压小盘';
  d.en['gs.hanoi.invalid'] = '✗ A big disk cannot sit on a small one';
  d.zh['gs.hanoi.win'] = '🎉 全部就位！用了 {n} 步';
  d.en['gs.hanoi.win'] = '🎉 All disks in place! {n} moves';
})();
