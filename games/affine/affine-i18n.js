/* 破译 DECODE ARCADE · affine 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.affine.tutTitle'] = '仿射密码 · 玩法';
  d.en['gs.affine.tutTitle'] = 'Affine Cipher · How to Play';
  d.zh['gs.affine.tut1t'] = '目标';
  d.en['gs.affine.tut1t'] = 'Objective';
  d.zh['gs.affine.tut1'] = '仿射密码：密文字母 = (a×明文 + b) mod 26。已知 a、b 就能解密，你的任务是把它们找出来。';
  d.en['gs.affine.tut1'] = 'Affine cipher: ciphertext letter = (a × plaintext + b) mod 26. Knowing a and b lets you decrypt — your task is to find them.';
  d.zh['gs.affine.tut2t'] = '操作';
  d.en['gs.affine.tut2t'] = 'Controls';
  d.zh['gs.affine.tut2'] = '拖动 a、b 滑块观察解码预览，通顺英文即破解；点「验证」确认。';
  d.en['gs.affine.tut2'] = 'Drag the a and b sliders and watch the decode preview — readable English means you\u2019ve cracked it; hit "Check" to confirm.';
  d.zh['gs.affine.tut3t'] = '技巧';
  d.en['gs.affine.tut3t'] = 'Tips';
  d.zh['gs.affine.tut3'] = 'a 必须与 26 互质（1,3,5,7,9,11,15,17,19,21,23,25），滑块会自动跳过非法值。';
  d.en['gs.affine.tut3'] = 'a must be coprime with 26 (1,3,5,7,9,11,15,17,19,21,23,25); the slider skips invalid values automatically.';
  d.zh['gs.affine.tut4t'] = '计分';
  d.en['gs.affine.tut4t'] = 'Scoring';
  d.zh['gs.affine.tut4'] = '验证次数越少成绩越高（成绩=尝试次数）。';
  d.en['gs.affine.tut4'] = 'Fewer checks mean a better score (score = number of attempts).';
  d.zh['gs.affine.cipherLbl'] = '截获密文（仿射密码）';
  d.en['gs.affine.cipherLbl'] = 'Intercepted ciphertext (affine cipher)';
  d.zh['gs.affine.prevLbl'] = '解码预览';
  d.en['gs.affine.prevLbl'] = 'Decode preview';
  d.zh['gs.affine.aLbl'] = 'a（乘数）';
  d.en['gs.affine.aLbl'] = 'a (multiplier)';
  d.zh['gs.affine.bLbl'] = 'b（偏移）';
  d.en['gs.affine.bLbl'] = 'b (shift)';
  d.zh['gs.affine.checkBtn'] = '验证破译';
  d.en['gs.affine.checkBtn'] = 'Check Decode';
  d.zh['gs.affine.helpText'] = '💡 仿射密码：密文 = (a×明文 + b) mod 26。解密需要 a 的模逆。a 滑块只停在合法值（与 26 互质），b 是 0~25 的偏移。';
  d.en['gs.affine.helpText'] = '💡 Affine cipher: ciphertext = (a × plaintext + b) mod 26. Decryption needs the modular inverse of a. The a slider only rests on valid values (coprime with 26); b is a 0–25 shift.';
  d.zh['gs.affine.success'] = '🎉 破译成功！a={a} b={b}（尝试 {n} 次）';
  d.en['gs.affine.success'] = '🎉 Decoded! a={a} b={b} ({n} attempts)';
  d.zh['gs.affine.fail'] = '✗ 还不是明文，继续调参…';
  d.en['gs.affine.fail'] = '✗ Not the plaintext yet — keep tuning…';
})();
