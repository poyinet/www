/* 破译 DECODE ARCADE · pipe 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.pipe.tutTitle'] = '管道连接 · 玩法';
  d.en['gs.pipe.tutTitle'] = 'Pipe Connect · How to Play';
  d.zh['gs.pipe.tut1t'] = '目标';
  d.en['gs.pipe.tut1t'] = 'Objective';
  d.zh['gs.pipe.tut1'] = '旋转管道，把左侧水源（绿）连通到右侧出水口（黄）。';
  d.en['gs.pipe.tut1'] = 'Rotate the pipes to connect the water source on the left (green) to the outlet on the right (yellow).';
  d.zh['gs.pipe.tut2t'] = '操作';
  d.en['gs.pipe.tut2t'] = 'Controls';
  d.zh['gs.pipe.tut2'] = '点任意管道格旋转 90°，让管口彼此对接形成通路。';
  d.en['gs.pipe.tut2'] = 'Tap any pipe tile to rotate it 90°, aligning the openings to form a path.';
  d.zh['gs.pipe.tut3t'] = '计分';
  d.en['gs.pipe.tut3t'] = 'Scoring';
  d.zh['gs.pipe.tut3'] = '旋转次数越少成绩越高（成绩=旋转步数）。';
  d.en['gs.pipe.tut3'] = 'Fewer rotations is better — your score is the number of rotations.';
  d.zh['gs.pipe.rotLbl'] = '旋转 {n} 次';
  d.en['gs.pipe.rotLbl'] = 'Rotations: {n}';
  d.zh['gs.pipe.winCond'] = '绿→黄 接通即胜';
  d.en['gs.pipe.winCond'] = 'Green→Yellow connected wins';
  d.zh['gs.pipe.hint'] = '旋转管道接通左右两端';
  d.en['gs.pipe.hint'] = 'Rotate pipes to connect left and right';
  d.zh['gs.pipe.newGame'] = '换一局';
  d.en['gs.pipe.newGame'] = 'New Round';
  d.zh['gs.pipe.win'] = '🎉 接通！旋转 {n} 次';
  d.en['gs.pipe.win'] = '🎉 Connected! {n} rotations';
  d.zh['gs.pipe.helpText'] = '管道连接训练的是拓扑思维——网络协议（如 TLS）中的「握手路径」就是一条需要正确连接的管道。';
  d.en['gs.pipe.helpText'] = 'Pipe connection trains topological thinking — the "handshake path" in network protocols like TLS is a pipeline needing correct connection.';
})();
