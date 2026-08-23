/* 破译 DECODE ARCADE · wordsearch 游戏内文案（zh/en 对称）
   由 i18n-dict.js 拆分生成 —— 游戏页按需加载，减小站点字典体积 */
(function () {
  var d = Arcade.i18n.dicts;
  d.zh['gs.wordsearch.tutTitle'] = '单词搜索 · 玩法';
  d.en['gs.wordsearch.tutTitle'] = 'Word Search · How to Play';
  d.zh['gs.wordsearch.tut1t'] = '目标';
  d.en['gs.wordsearch.tut1t'] = 'Objective';
  d.zh['gs.wordsearch.tut1'] = '在字母阵中找到全部隐藏单词（横、竖、斜 8 个方向）。';
  d.en['gs.wordsearch.tut1'] = 'Find every hidden word in the letter grid (8 directions: horizontal, vertical, diagonal).';
  d.zh['gs.wordsearch.tut2t'] = '操作';
  d.en['gs.wordsearch.tut2t'] = 'Controls';
  d.zh['gs.wordsearch.tut2'] = '点单词首字母，再点末字母 = 选中一条线；连线正确即标记找到。';
  d.en['gs.wordsearch.tut2'] = 'Tap a word\u2019s first letter, then its last letter to select a line; a correct line marks the word as found.';
  d.zh['gs.wordsearch.tut3t'] = '技巧';
  d.en['gs.wordsearch.tut3t'] = 'Tips';
  d.zh['gs.wordsearch.tut3'] = '先找长词和首字母少的词；找到后字母变绿，干扰项自动排除。';
  d.en['gs.wordsearch.tut3'] = 'Look for long words and rare starting letters first; found words turn green and decoys are ruled out.';
  d.zh['gs.wordsearch.tut4t'] = '计分';
  d.en['gs.wordsearch.tut4t'] = 'Scoring';
  d.zh['gs.wordsearch.tut4'] = '成绩=完成用时（秒）。';
  d.en['gs.wordsearch.tut4'] = 'Score = completion time in seconds.';
  d.zh['gs.wordsearch.startMsg'] = '点首字母 → 点末字母，找出全部单词';
  d.en['gs.wordsearch.startMsg'] = 'Tap first letter \u2192 tap last letter to find all words';
  d.zh['gs.wordsearch.restart'] = '重新开始';
  d.en['gs.wordsearch.restart'] = 'Restart';
  d.zh['gs.wordsearch.help'] = '💡 单词可以横、竖或斜着藏，方向 8 个。连线选中的格子会高亮，确认正确后整条变绿。';
  d.en['gs.wordsearch.help'] = '💡 Words can hide horizontally, vertically, or diagonally \u2014 8 directions. Selected cells highlight; a correct word turns fully green.';
  d.zh['gs.wordsearch.notLine'] = '✗ 不在一条直线上';
  d.en['gs.wordsearch.notLine'] = '✗ Not in a straight line';
  d.zh['gs.wordsearch.notFound'] = '✗ 没找到这个单词';
  d.en['gs.wordsearch.notFound'] = '✗ No such word found';
  d.zh['gs.wordsearch.win'] = '🎉 全部找到！用时 {n} 秒';
  d.en['gs.wordsearch.win'] = '🎉 All words found! {n}s';
})();
