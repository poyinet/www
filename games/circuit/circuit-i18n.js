/* 破译 DECODE ARCADE · circuit 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.circuit.tutTitle'] = '电路连接 · 玩法';
  d.en['gs.circuit.tutTitle'] = 'Circuit · How to Play';
  d.zh['gs.circuit.tut1t'] = '目标';
  d.en['gs.circuit.tut1t'] = 'Objective';
  d.zh['gs.circuit.tut1'] = '旋转线路，把左侧电源（⚡）的电流送到右侧灯泡（💡）让它点亮。';
  d.en['gs.circuit.tut1'] = 'Rotate the pipes to send power from the battery on the left (⚡) to the bulb on the right (💡) and light it up.';
  d.zh['gs.circuit.tut2t'] = '操作';
  d.en['gs.circuit.tut2t'] = 'Controls';
  d.zh['gs.circuit.tut2'] = '点任意线路格旋转 90°，让线头对接形成通路。';
  d.en['gs.circuit.tut2'] = 'Tap any pipe cell to rotate it 90°, joining the ends into a complete circuit.';
  d.zh['gs.circuit.tut3t'] = '计分';
  d.en['gs.circuit.tut3t'] = 'Scoring';
  d.zh['gs.circuit.tut3'] = '旋转次数越少成绩越高（成绩=旋转步数）。';
  d.en['gs.circuit.tut3'] = 'Fewer rotations is better (score = number of rotations).';
  d.zh['gs.circuit.rotCount'] = '旋转 {n} 次';
  d.en['gs.circuit.rotCount'] = '{n} rotations';
  d.zh['gs.circuit.goal'] = '⚡ 接通 💡 即胜';
  d.en['gs.circuit.goal'] = '⚡ to 💡 = win';
  d.zh['gs.circuit.startMsg'] = '旋转线路接通电源与灯泡';
  d.en['gs.circuit.startMsg'] = 'Rotate the pipes to connect the battery to the bulb';
  d.zh['gs.circuit.restart'] = '换一局';
  d.en['gs.circuit.restart'] = 'New Board';
  d.zh['gs.circuit.win'] = '🎉 电路接通！{r}';
  d.en['gs.circuit.win'] = '🎉 Circuit connected! {r}';
  d.zh['gs.circuit.helpText'] = '电路连接是布尔逻辑的物理化身——AND、OR、XOR 在导线中流淌。现代密码的每一次加密都是一次布尔电路运算，香农称之为「混合与扩散」。';
  d.en['gs.circuit.helpText'] = 'Circuit connection is Boolean logic made physical — AND, OR, XOR flowing through wires. Every modern encryption is a Boolean circuit operation: Shannon called it "confusion and diffusion".';
})();
