/* 破译 DECODE ARCADE · sokoban 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.sokoban.tutTitle'] = '推箱子 · 玩法';
  d.en['gs.sokoban.tutTitle'] = 'Sokoban · How to Play';
  d.zh['gs.sokoban.tut1t'] = '目标';
  d.en['gs.sokoban.tut1t'] = 'Objective';
  d.zh['gs.sokoban.tut1'] = '把所有箱子📦推到目标点🎯上。';
  d.en['gs.sokoban.tut1'] = 'Push every box 📦 onto a target 🎯.';
  d.zh['gs.sokoban.tut2t'] = '操作';
  d.en['gs.sokoban.tut2t'] = 'Controls';
  d.zh['gs.sokoban.tut2'] = '方向键或屏幕方向按钮移动；人站在箱子一侧才能推动它。';
  d.en['gs.sokoban.tut2'] = 'Move with arrow keys or the on-screen pad; stand beside a box to push it.';
  d.zh['gs.sokoban.tut3t'] = '注意';
  d.en['gs.sokoban.tut3t'] = 'Heads-up';
  d.zh['gs.sokoban.tut3'] = '箱子只能推不能拉，别把箱子推进死角。';
  d.en['gs.sokoban.tut3'] = 'Boxes can only be pushed, never pulled — don\'t wedge one into a corner.';
  d.zh['gs.sokoban.tut4t'] = '计分';
  d.en['gs.sokoban.tut4t'] = 'Scoring';
  d.zh['gs.sokoban.tut4'] = '步数越少越好，成绩=通关全部关卡的总步数。';
  d.en['gs.sokoban.tut4'] = 'Fewer moves is better — your score is the total moves across all levels.';
  d.zh['gs.sokoban.hud'] = '第 {l} / {t} 关 · 总步数 {s}';
  d.en['gs.sokoban.hud'] = 'Level {l}/{t} · Total moves {s}';
  d.zh['gs.sokoban.restart'] = '重新开始';
  d.en['gs.sokoban.restart'] = 'Restart';
  d.zh['gs.sokoban.levelDone'] = '✓ 过关！进入第 {n} 关';
  d.en['gs.sokoban.levelDone'] = '✓ Level cleared! Entering level {n}';
  d.zh['gs.sokoban.win'] = '🎉 全部通关！总步数 {n}';
  d.en['gs.sokoban.win'] = '🎉 All levels cleared! Total moves {n}';
  d.zh['gs.sokoban.helpText'] = '推箱子训练的是状态空间搜索与死锁避免——密码分析中「避免走进不可解的分支」需要同样的前瞻性思维。';
  d.en['gs.sokoban.helpText'] = 'Sokoban trains state-space search and deadlock avoidance — cryptanalysis needs the same forward thinking to avoid "unsolvable branches" in the analysis tree.';
})();
