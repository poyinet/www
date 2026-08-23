/* 写入 5 件新密件文案（D3）到 i18n-dict.js 摘要区 */
const fs = require('fs');
const path = require('path');
const F = path.join(process.cwd(), 'assets/js/core/i18n-dict.js');
let s = fs.readFileSync(F, 'utf8');

const ARTS = [
  { id: 'voynich', nameZh: '伏尼契手稿', nameEn: 'Voynich Manuscript', icon: '📖',
    eraZh: '约 15 世纪初 · 中欧', eraEn: 'c. early 15th c. · Central Europe',
    descZh: '一部约 240 页的中世纪手稿，以无人能识的未知文字写就，满布奇异的天文、植物与沐浴插图，碳定年约属十五世纪初，五百余年无人能解，堪称密码史上最著名的未解之书。',
    descEn: 'A ~240-page medieval manuscript written in an unknown, undeciphered script, filled with strange astronomical, botanical and bathing illustrations; carbon-dated to the early 15th century, it has defied every attempt at decryption for over 500 years.',
    textZh: '全书约 240 页羊皮纸上写满未知字母，二十余种符号反复出现，却构不成任何已知语言；旋转的星图、无名的植物与沐浴的少女穿插其间，宛如异星密码。语言学家、密码学家乃至人工智能轮番上阵，至今一无所获——它没有语言、没有密钥，也没有作者。',
    textEn: 'About 240 pages of vellum covered in an unknown script — roughly two dozen recurring glyphs matching no known language. Rotating star charts, unidentifiable plants and bathing nymphs accompany the text, yet linguists, cryptologists and even AI have found nothing: no language, no cipher, no author.' },
  { id: 'beale', nameZh: '比尔密码', nameEn: 'The Beale Papers', icon: '💰',
    eraZh: '19 世纪 20 年代 · 美国弗吉尼亚', eraEn: '1820s · Virginia, USA',
    descZh: '1820 年代弗吉尼亚的藏宝传奇：三份密文声称记录一批巨额金银珠宝的埋藏位置，百余年过去仅第二份被破译，其余两份与宝藏下落至今成谜，真实性亦备受争议。',
    descEn: 'A Virginia treasure legend: three cipher texts supposedly reveal the hiding place of a vast hoard of gold and silver. After over a century only the second cipher has been solved; the other two, and the treasure, remain lost — and the story\'s authenticity is fiercely disputed.',
    textZh: '藏宝者留下三份密文：第一份指明藏宝地点，第二份列出财宝内容，第三份记下继承者姓名。1885 年小册子公布后，唯第二份以《独立宣言》为密钥被破译，读出金、银与宝石的惊人数量；其余两份任密码学家穷尽手段，仍如天书。',
    textEn: 'Three cipher texts were left behind: the first locates the vault, the second itemizes the treasure, the third names the heirs. Published in 1885, only the second — keyed to the Declaration of Independence — has ever been read, revealing astonishing quantities of gold, silver and jewels. The other two remain as impenetrable as the day they were printed.' },
  { id: 'kryptos', nameZh: '克里普托斯', nameEn: 'Kryptos', icon: '🗿',
    eraZh: '1990 年 · 美国弗吉尼亚（CIA 总部）', eraEn: '1990 · Virginia, USA (CIA HQ)',
    descZh: '矗立于 CIA 总部广场的铜制雕塑，镌刻 865 个字符的加密铭文，四段密文中三段已被破解，第四段至今无人解出，答案只存在于创作者脑中。',
    descEn: 'A copper sculpture in the plaza of CIA headquarters, bearing 865 characters of encrypted text in four sections. Three have been cracked; the fourth — K4 — remains unsolved, its answer known only to the artist.',
    textZh: '第一段铭文破译后读到：「在微妙的光影之间，藏着幻象的精微之处」（Between subtle shading and the absence of light lies the nuance of iqlusion）。第三段结尾更抛出谜题：「它是否藏在黑暗之中？」（Does it hide in the dark?），而最后的第四段 K4，至今仍让全球密码爱好者夜不能寐。',
    textEn: 'Decoded segments read: "Between subtle shading and the absence of light lies the nuance of iqlusion," and K3 ends with the riddle "Does it hide in the dark?" The unsolved fourth passage, K4, still keeps cryptographers around the world awake at night.' },
  { id: 'maryqueen', nameZh: '苏格兰玛丽女王密信', nameEn: 'Mary Queen of Scots\' Cipher Letters', icon: '👑',
    eraZh: '1586 年 · 英格兰', eraEn: '1586 · England',
    descZh: '苏格兰女王玛丽在囚禁中与同谋以替换密码通信，密谋刺杀伊丽莎白一世；英国间谍头目沃尔辛厄姆截获并破译全部密信，成为将她送上断头台的关键证据。',
    descEn: 'Imprisoned Mary, Queen of Scots, plotted to assassinate Elizabeth I in substitution-cipher letters smuggled to her co-conspirators; spymaster Sir Francis Walsingham intercepted and deciphered them, sealing her fate at the block.',
    textZh: '1586 年，玛丽用复杂的符号替换字母写下密信，藏于啤酒桶木塞中送出，信中写道：「必须由那六名贵族动手，事成之前，我不得知悉任何详情。」然而沃尔辛厄姆的破译员逐字还原出全部阴谋，这封密信最终成为法庭上处死她的铁证。',
    textEn: 'In 1586 Mary wrote in a substitution cipher of elaborate symbols, smuggled past guards inside beer-barrel stoppers: "The six noblemen must act, and I must know nothing until the deed is done." Walsingham\'s decipherers reconstructed the entire plot, and the letters became the damning evidence that sent her to the block.' },
  { id: 'baconcase', nameZh: '培根-莎士比亚密信案', nameEn: 'The Bacon-Shakespeare Cipher Controversy', icon: '🎭',
    eraZh: '19 世纪以来 · 英国', eraEn: 'Since the 19th c. · England',
    descZh: '百余年来的争议谜案：有人坚称莎士比亚剧作中暗藏弗朗西斯·培根的签名密码，以「Honorificabilitudinitatibus」一词可重组出培根之名，学界普遍视其为伪密码学。',
    descEn: 'A century-old controversy: believers insist hidden ciphers in Shakespeare\'s plays reveal Francis Bacon as the true author — pointing to words like "Honorificabilitudinitatibus" rearranged to spell Bacon\'s name — while scholars dismiss it all as pseudocryptography.',
    textZh: '争议源于莎剧《爱的徒劳》中那个由 27 个字母组成的奇词——Honorificabilitudinitatibus，破解者宣称它可重组为拉丁文「Hi ludi F. Baconis nati tuiti orbi」（这些剧本出自 F. 培根之手，护佑世人）；支持者更从对开本中读出「培根签名」，然而统计学家与密码学家反复检验，结论始终如一：纯属巧合。',
    textEn: 'The case turns on a 27-letter oddity in Love\'s Labour\'s Lost — Honorificabilitudinitatibus — which claimants rearrange into the Latin "Hi ludi F. Baconis nati tuiti orbi" ("these plays, F. Bacon\'s offspring, are preserved for the world"), and on "signatures" allegedly hidden in the First Folio. Yet statisticians and cryptologists who tested the claims all reached one verdict: coincidence, not cipher.' }
];

let block = '';
for (const a of ARTS) {
  block += "  d.zh['sta." + a.id + ".name'] = '" + a.nameZh.replace(/'/g, "\\'") + "';\n";
  block += "  d.en['sta." + a.id + ".name'] = '" + a.nameEn.replace(/'/g, "\\'") + "';\n";
  block += "  d.zh['sta." + a.id + ".era'] = '" + a.eraZh + "';\n";
  block += "  d.en['sta." + a.id + ".era'] = '" + a.eraEn + "';\n";
  block += "  d.zh['sta." + a.id + ".desc'] = '" + a.descZh.replace(/'/g, "\\'") + "';\n";
  block += "  d.en['sta." + a.id + ".desc'] = '" + a.descEn.replace(/'/g, "\\'") + "';\n";
  block += "  d.zh['sta." + a.id + ".text'] = '" + a.textZh.replace(/'/g, "\\'") + "';\n";
  block += "  d.en['sta." + a.id + ".text'] = '" + a.textEn.replace(/'/g, "\\'") + "';\n";
}

/* 追加到 i18n-dict.js 末尾 */
const append = '\n/* ============================================================\n   传奇密件扩充（D3）：5 件未解之谜/著名争议\n   ============================================================ */\n(function () {\n  var d = Arcade.i18n.dicts;\n' + block + '})();\n';
s = s.replace(/\n*$/, '\n') + append;
fs.writeFileSync(F, s);
console.log('✓ 已写入 5 件密件文案（' + block.split('\n').length + ' 行）');
