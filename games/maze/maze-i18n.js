/* 破译 DECODE ARCADE · maze 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.maze.tutTitle'] = '迷宫 · 玩法';
  d.en['gs.maze.tutTitle'] = 'Maze · How to Play';
  d.zh['gs.maze.tut1t'] = '目标';
  d.en['gs.maze.tut1t'] = 'Objective';
  d.zh['gs.maze.tut1'] = '从起点🟢走到终点（黄色方块），避开墙体。';
  d.en['gs.maze.tut1'] = 'Walk from the start 🟢 to the goal (the yellow block), avoiding the walls.';
  d.zh['gs.maze.tut2t'] = '操作';
  d.en['gs.maze.tut2t'] = 'Controls';
  d.zh['gs.maze.tut2'] = '方向键 / WASD / 屏幕方向按钮 / 滑动屏幕移动。';
  d.en['gs.maze.tut2'] = 'Arrow keys / WASD / on-screen pad / swipe to move.';
  d.zh['gs.maze.tut3t'] = '计分';
  d.en['gs.maze.tut3t'] = 'Scoring';
  d.zh['gs.maze.tut3'] = '步数越少越好，成绩=走出迷宫的步数。';
  d.en['gs.maze.tut3'] = 'Fewer steps is better — your score is the step count to escape the maze.';
  d.zh['gs.maze.hud'] = '步数 {n}';
  d.en['gs.maze.hud'] = 'Steps {n}';
  d.zh['gs.maze.win'] = '🎉 走出迷宫！用了 {n} 步';
  d.en['gs.maze.win'] = '🎉 Maze cleared! {n} steps';
  d.zh['gs.maze.helpText'] = '迷宫训练的是路径搜索与死胡同识别——密码分析中的「分支限界搜索」需要同样的技能：快速识别死路并回溯。';
  d.en['gs.maze.helpText'] = 'Mazes train pathfinding and dead-end recognition — cryptanalysis\'s "branch-and-bound search" needs the same skill: quickly identifying dead ends and backtracking.';
})();
