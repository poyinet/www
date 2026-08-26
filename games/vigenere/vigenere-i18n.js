/* 破译 DECODE ARCADE · vigenere 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.vigenere.tutTitle'] = '维吉尼亚 · 玩法';
  d.en['gs.vigenere.tutTitle'] = 'Vigenère · How to Play';
  d.zh['gs.vigenere.tut1t'] = '目标';
  d.en['gs.vigenere.tut1t'] = 'Objective';
  d.zh['gs.vigenere.tut1'] = '密文用维吉尼亚密码加密：每个字母按密钥字母循环平移。';
  d.en['gs.vigenere.tut1'] = 'The ciphertext was encrypted with the Vigenère cipher: each letter is shifted cyclically by a key letter.';
  d.zh['gs.vigenere.tut2t'] = '操作';
  d.en['gs.vigenere.tut2t'] = 'Controls';
  d.zh['gs.vigenere.tut2'] = '已知密钥，把密文逐字母减去对应密钥字母的偏移，还原明文。';
  d.en['gs.vigenere.tut2'] = 'With the key known, subtract each key letter\'s shift from the ciphertext to recover the plaintext.';
  d.zh['gs.vigenere.tut3t'] = '计分';
  d.en['gs.vigenere.tut3t'] = 'Scoring';
  d.zh['gs.vigenere.tut3'] = '用时越短成绩越高（成绩=完成秒数）。';
  d.en['gs.vigenere.tut3'] = 'Faster is better (score = seconds to finish).';
  d.zh['gs.vigenere.dEasy'] = '简单';
  d.en['gs.vigenere.dEasy'] = 'Easy';
  d.zh['gs.vigenere.dNormal'] = '普通';
  d.en['gs.vigenere.dNormal'] = 'Normal';
  d.zh['gs.vigenere.dHard'] = '困难';
  d.en['gs.vigenere.dHard'] = 'Hard';
  d.zh['gs.vigenere.lblCipher'] = '截获密文（维吉尼亚）';
  d.en['gs.vigenere.lblCipher'] = 'Intercepted ciphertext (Vigenère)';
  d.zh['gs.vigenere.keyHint'] = '密钥已截获，逐字母还原';
  d.en['gs.vigenere.keyHint'] = 'Key intercepted — decode letter by letter';
  d.zh['gs.vigenere.phInput'] = '在此输入明文…';
  d.en['gs.vigenere.phInput'] = 'Type the plaintext here…';
  d.zh['gs.vigenere.newPuzzle'] = '换一题';
  d.en['gs.vigenere.newPuzzle'] = 'New puzzle';
  d.zh['gs.vigenere.key'] = '密钥：{key}';
  d.en['gs.vigenere.key'] = 'Key: {key}';
  d.zh['gs.vigenere.msgWin'] = '✓ 破译成功！明文：{plain}';
  d.en['gs.vigenere.msgWin'] = '✓ Cipher broken! Plaintext: {plain}';
  d.zh['gs.vigenere.helpText'] = '维吉尼亚密码曾被称为「不可破译的密码」——三百年无人能破，直到 19 世纪卡西斯基试验揭示了重合指数的弱点。它的历史也是一堂谦逊课：真正的发明者是贝拉索（1553），而非维吉尼亚（1586）。<a class="gh-link" href="../../story.html?id=bacon">见编年史「培根的隐形墨水」→</a>章。';
  d.en['gs.vigenere.helpText'] = 'The Vigenère cipher was called "the indecipherable cipher" — unbroken for 300 years until Kasiski exposed its repeating weakness. Its history is also a lesson in humility: the true inventor was Bellaso (1553), not Vigenère (1586). <a class="gh-link" href="../../story.html?id=bacon">See the Chronicle chapter "Bacon\'s Invisible Ink" &rarr;</a>.';
})();
