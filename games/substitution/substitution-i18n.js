/* 破译 DECODE ARCADE · substitution 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.substitution.tutTitle'] = '替换密码 · 玩法';
  d.en['gs.substitution.tutTitle'] = 'Substitution Cipher · How to Play';
  d.zh['gs.substitution.tut1t'] = '目标';
  d.en['gs.substitution.tut1t'] = 'Objective';
  d.zh['gs.substitution.tut1'] = '密文用单表替换加密：每个字母被换成另一个固定字母。';
  d.en['gs.substitution.tut1'] = 'The ciphertext uses a monoalphabetic substitution: each letter is replaced by one fixed other letter.';
  d.zh['gs.substitution.tut2t'] = '操作';
  d.en['gs.substitution.tut2t'] = 'Controls';
  d.zh['gs.substitution.tut2'] = '点下方密钥格里的字母按钮，循环切换你推测的明文（A→Z→?）。';
  d.en['gs.substitution.tut2'] = 'Click a letter tile in the key grid below to cycle through your guess (A→Z→?).';
  d.zh['gs.substitution.tut3t'] = '破译';
  d.en['gs.substitution.tut3t'] = 'Breaking';
  d.zh['gs.substitution.tut3'] = '上方预览会实时显示你的解码结果，拼出通顺英文即自动破解。';
  d.en['gs.substitution.tut3'] = 'The preview above updates live; when it forms readable English, the cipher is broken automatically.';
  d.zh['gs.substitution.tut4t'] = '计分';
  d.en['gs.substitution.tut4t'] = 'Scoring';
  d.zh['gs.substitution.tut4'] = '试探次数越少成绩越高（成绩=按键次数）。';
  d.en['gs.substitution.tut4'] = 'Fewer tries score higher (score = number of key presses).';
  d.zh['gs.substitution.lblCipher'] = '截获密文（替换密码）';
  d.en['gs.substitution.lblCipher'] = 'Intercepted ciphertext (substitution)';
  d.zh['gs.substitution.lblPreview'] = '你的解码预览';
  d.en['gs.substitution.lblPreview'] = 'Your decode preview';
  d.zh['gs.substitution.reset'] = '重置映射';
  d.en['gs.substitution.reset'] = 'Reset mapping';
  d.zh['gs.substitution.tip'] = '💡 试错：不同字母出现频率不同，先猜常出现的 E、T、A';
  d.en['gs.substitution.tip'] = '💡 Trial and error: letters appear with different frequencies — try common ones like E, T, A first';
  d.zh['gs.substitution.msgWin'] = '✓ 破译成功！明文：{plain}';
  d.en['gs.substitution.msgWin'] = '✓ Cipher broken! Plaintext: {plain}';
  d.zh['gs.substitution.helpText'] = '替换密码是最古老的加密思想：把每个字母换成另一个。凯撒用它、玛丽女王因它丧命、频率分析终结了它——但替换的思想至今活在 AES 的 S 盒里，只是被数学武装到了牙齿。见编年史「凯撒的密令」章。';
  d.en['gs.substitution.helpText'] = 'Substitution is the oldest encryption idea: replace each letter with another. Caesar used it, Mary Queen of Scots died for it, frequency analysis killed it — yet substitution lives on in AES\'s S-boxes, armed with mathematics. See the Chronicle chapter "Caesar\'s Secret Orders".';
})();
