/* 破译 DECODE ARCADE · typecode 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.typecode.tutTitle'] = '打字破译 · 玩法';
  d.en['gs.typecode.tutTitle'] = 'Typecode · How to Play';
  d.zh['gs.typecode.tut1t'] = '目标';
  d.en['gs.typecode.tut1t'] = 'Objective';
  d.zh['gs.typecode.tut1'] = '照着上方截获的电文，在输入框里逐字准确打出来。';
  d.en['gs.typecode.tut1'] = 'Type the intercepted message at the top accurately, character by character, into the input box.';
  d.zh['gs.typecode.tut2t'] = '操作';
  d.en['gs.typecode.tut2t'] = 'Controls';
  d.zh['gs.typecode.tut2'] = '直接键入，或点按下方屏幕键盘；打对的字变绿，打错变红，进度实时显示。';
  d.en['gs.typecode.tut2'] = 'Type directly or tap the on-screen keys below; correct letters turn green, wrong ones red, progress updates live.';
  d.zh['gs.typecode.tut3t'] = '计分';
  d.en['gs.typecode.tut3t'] = 'Scoring';
  d.zh['gs.typecode.tut3'] = '越快越准分越高，成绩=准确率×速度系数（满分约 200）。';
  d.en['gs.typecode.tut3'] = 'Faster and more accurate typing scores higher — score = accuracy × speed factor (max about 200).';
  d.zh['gs.typecode.label'] = '截 获 电 文';
  d.en['gs.typecode.label'] = 'INTERCEPTED MESSAGE';
  d.zh['gs.typecode.inputPlaceholder'] = '在此键入电文…';
  d.en['gs.typecode.inputPlaceholder'] = 'Type the message here…';
  d.zh['gs.typecode.progressFmt'] = '进度 {a}/{b} · 当前准确率 {c}%';
  d.en['gs.typecode.progressFmt'] = 'Progress {a}/{b} · Accuracy {c}%';
  d.zh['gs.typecode.resultStatFmt'] = '准确率 {a}% · 用时 {b}s';
  d.en['gs.typecode.resultStatFmt'] = 'Accuracy {a}% · Time {b}s';
  d.zh['gs.typecode.winPerfectFmt'] = '🎉 完美破译！速度系数 {n}';
  d.en['gs.typecode.winPerfectFmt'] = '🎉 Perfect decode! Speed factor {n}';
  d.zh['gs.typecode.doneAccFmt'] = '破译完成，准确率 {n}%';
  d.en['gs.typecode.doneAccFmt'] = 'Decode complete, accuracy {n}%';
  d.zh['gs.typecode.kbdToggle'] = '⌨ 屏幕键盘';
  d.en['gs.typecode.kbdToggle'] = '⌨ On-screen keys';
  d.zh['gs.typecode.kbdAria'] = '屏幕键盘：点按输入字母';
  d.en['gs.typecode.kbdAria'] = 'On-screen keyboard: tap to type letters';
  d.zh['gs.typecode.spaceK'] = '空格';
  d.en['gs.typecode.spaceK'] = 'space';
  d.zh['gs.typecode.helpText'] = '打字破译训练的是密码分析的基本功：从密文中识别模式、频率与结构。布莱切利园的破译员每天面对成千上万字符的密文——快速识别「这是哪种密码」是破译的第一步。见编年史「布莱切利园的机器」章。';
  d.en['gs.typecode.helpText'] = 'Typing cipher training builds cryptanalysis fundamentals: identifying patterns, frequencies and structures in ciphertext. Bletchley Park\'s analysts faced thousands of characters daily — quickly identifying "which cipher is this" was the first step. See the Chronicle chapter "The Machines of Bletchley Park".';
})();
