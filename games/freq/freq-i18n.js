/* 破译 DECODE ARCADE · freq 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.freq.tutTitle'] = '词频分析 · 玩法';
  d.en['gs.freq.tutTitle'] = 'Frequency Analysis · How to Play';
  d.zh['gs.freq.tut1t'] = '目标';
  d.en['gs.freq.tut1t'] = 'Objective';
  d.zh['gs.freq.tut1'] = '单表替换密码中，每个字母固定替换成另一个字母。英文里 E 最常用，密文里出现最多的字母很可能就是 E。';
  d.en['gs.freq.tut1'] = 'In a monoalphabetic substitution every letter is always replaced by the same letter. E is the most common letter in English, so the most frequent letter in the ciphertext is likely E.';
  d.zh['gs.freq.tut2t'] = '操作';
  d.en['gs.freq.tut2t'] = 'Controls';
  d.zh['gs.freq.tut2'] = '点密文字母柱循环切换它对应的明文字母（自动跳过已用的），预览会实时替换。';
  d.en['gs.freq.tut2'] = 'Click a ciphertext letter bar to cycle which plaintext letter it maps to (used letters are skipped); the preview updates in real time.';
  d.zh['gs.freq.tut3t'] = '技巧';
  d.en['gs.freq.tut3t'] = 'Tips';
  d.zh['gs.freq.tut3'] = '英文词频排序：ETAOINSHRDLU。先猜最高频的字母（常是 E/T/A），再结合短词（如 THE 常见三字母词）缩小范围。';
  d.en['gs.freq.tut3'] = 'English letter frequency order: ETAOINSHRDLU. Start with the most frequent letters (often E/T/A), then use short words (like the common 3-letter THE) to narrow it down.';
  d.zh['gs.freq.tut4t'] = '计分';
  d.en['gs.freq.tut4t'] = 'Scoring';
  d.zh['gs.freq.tut4'] = '错误猜测越少越好（成绩=尝试次数）。';
  d.en['gs.freq.tut4'] = 'Fewer wrong guesses is better (score = number of attempts).';
  d.zh['gs.freq.cipherLbl'] = '截获密文（单表替换，字母频率是关键）';
  d.en['gs.freq.cipherLbl'] = 'Intercepted ciphertext (monoalphabetic substitution — letter frequency is key)';
  d.zh['gs.freq.barsLbl'] = '密文字母频率（点击柱子指定对应明文字母）';
  d.en['gs.freq.barsLbl'] = 'Ciphertext letter frequency (click a bar to assign its plaintext letter)';
  d.zh['gs.freq.checkBtn'] = '验证破译';
  d.en['gs.freq.checkBtn'] = 'Check Decode';
  d.zh['gs.freq.helpText'] = '💡 英文词频从高到低：E T A O I N S H R D L U。密文里出现最多的字母，很可能就是 E。把常见短词（如 THE）当突破口。';
  d.en['gs.freq.helpText'] = '💡 English frequency, high to low: E T A O I N S H R D L U. The most frequent ciphertext letter is likely E. Use common short words (like THE) as a wedge.';
  d.zh['gs.freq.success'] = '🎉 破译成功！尝试 {n} 次';
  d.en['gs.freq.success'] = '🎉 Decoded! {n} attempts';
  d.zh['gs.freq.fail'] = '✗ 预览还没完全还原，继续调整映射…';
  d.en['gs.freq.fail'] = '✗ The preview isn\u2019t fully restored yet — keep adjusting the mapping…';
})();
