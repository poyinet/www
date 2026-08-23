/* 破译 DECODE ARCADE · base64 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.base64.tutTitle'] = 'Base64 破译 · 玩法';
  d.en['gs.base64.tutTitle'] = 'Base64 · How to Play';
  d.zh['gs.base64.tut1t'] = '目标';
  d.en['gs.base64.tut1t'] = 'Objective';
  d.zh['gs.base64.tut1'] = 'Base64 用 64 个字符（A-Z a-z 0-9 + /）把二进制数据编码成文本。看到那串乱码，解码出真正的消息。';
  d.en['gs.base64.tut1'] = 'Base64 encodes binary data as text using 64 characters (A-Z a-z 0-9 + /). See that garble? Decode it to reveal the real message.';
  d.zh['gs.base64.tut2t'] = '操作';
  d.en['gs.base64.tut2t'] = 'Controls';
  d.zh['gs.base64.tut2'] = '在输入框键入你解码出的消息（英文，大小写不敏感、空格需匹配），回车或点「验证」。';
  d.en['gs.base64.tut2'] = 'Type the message you decoded into the box (English, case-insensitive, spaces must match), then press Enter or hit "Check".';
  d.zh['gs.base64.tut3t'] = '技巧';
  d.en['gs.base64.tut3t'] = 'Tips';
  d.zh['gs.base64.tut3'] = '末尾的 = 是填充符。解码后是一句英文密码提示，这就是答案。';
  d.en['gs.base64.tut3'] = 'A trailing = is padding. Once decoded you get an English secret message — that is the answer.';
  d.zh['gs.base64.tut4t'] = '计分';
  d.en['gs.base64.tut4t'] = 'Scoring';
  d.zh['gs.base64.tut4'] = '尝试次数越少成绩越高（成绩=尝试次数）。';
  d.en['gs.base64.tut4'] = 'Fewer attempts mean a better score (score = number of attempts).';
  d.zh['gs.base64.cipherLbl'] = '截获密文（Base64 编码）';
  d.en['gs.base64.cipherLbl'] = 'Intercepted ciphertext (Base64 encoded)';
  d.zh['gs.base64.inputLbl'] = '输入解码后的消息';
  d.en['gs.base64.inputLbl'] = 'Type the decoded message';
  d.zh['gs.base64.inputPh'] = '解码结果…';
  d.en['gs.base64.inputPh'] = 'Decoded result…';
  d.zh['gs.base64.hintText'] = '提示：解码后是一句英文秘密消息';
  d.en['gs.base64.hintText'] = 'Hint: decoding reveals a secret English message';
  d.zh['gs.base64.checkBtn'] = '验证破译';
  d.en['gs.base64.checkBtn'] = 'Check Decode';
  d.zh['gs.base64.helpText'] = '💡 Base64：每 3 个字节编码为 4 个可见字符，常用于把二进制数据变成文本传输。字符集是 A-Z、a-z、0-9、+、/，末尾 = 是填充。';
  d.en['gs.base64.helpText'] = '💡 Base64: every 3 bytes encode to 4 visible characters, commonly used to ship binary data as text. The alphabet is A-Z, a-z, 0-9, +, /, with trailing = for padding.';
  d.zh['gs.base64.success'] = '🎉 破译成功！消息 = {m}（尝试 {n} 次）';
  d.en['gs.base64.success'] = '🎉 Decoded! Message = {m} ({n} attempts)';
  d.zh['gs.base64.fail'] = '✗ 解码结果不对，再想想…';
  d.en['gs.base64.fail'] = '✗ That\u2019s not the decoded message — think again…';
})();
