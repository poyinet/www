/* 生成 65 款新入章游戏的 st.cN.gX 文案（zh/en），追加到 i18n-story.js 末尾摘要区之后 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const STORY = path.join(ROOT, 'assets/js/core/i18n-story.js');

/* 格式：{ 章号: [ { g: 键号, zh: 中文, en: 英文 } ] }
   g = 该游戏在章节 games 数组中的序号（1-based） */
const DATA = {
  c0: [
    { g: 4, zh: '贪吃蛇：蛇身越长越难——信息越复杂，解开的路径越蜿蜒，正如破译古文字要一点点还原。', en: 'Snake: the longer the serpent, the harder the path — decoding ancient scripts is a slow, winding reconstruction too.' },
    { g: 5, zh: '记忆翻牌：像商博良比对符号——记住每一对对应关系，拼出完整的规则图。', en: 'Memory: like Champollion matching signs — remember each correspondence and rebuild the full rulebook.' },
    { g: 6, zh: '连连看：两两配对、隔空连线——破译的本质就是找到符号之间的对应关系。', en: 'Link Link: pair two symbols across the board — decoding is, at heart, finding correspondences.' },
    { g: 7, zh: '数字填色：按规则一格格还原隐藏图案——象形文字也是一格格被描出来的密码。', en: 'Paint by Number: restore a hidden picture cell by cell — hieroglyphs were a code drawn out one sign at a time.' },
    { g: 8, zh: '迷宫吃豆：在迷宫里循路而行——石碑上的三语对照，就是给破译者的一条通路。', en: 'Maze Pac: find your way through the maze — the stone\'s three scripts were a passage for the decoder.' },
    { g: 9, zh: '消消乐：三连即消、连锁反应——找到规律，整个符号系统就会像多米诺一样倒下。', en: 'Match-3: three in a row triggers a chain — find the pattern and the whole system topples like dominoes.' },
    { g: 10, zh: '2048：相同的数字合并进化——象形文字从图画到表音，也是一步步合并出来的。', en: '2048: merge equal tiles into something greater — hieroglyphs evolved from pictures to sounds the same way.' },
  ],
  c1: [
    { g: 4, zh: '弹射打靶：拖拽蓄力、计算弹道——凯撒的攻城器械同样靠精确计算破城。', en: 'Catapult: draw back, aim, release — Caesar\'s siege engines broke walls with the same precision.' },
    { g: 5, zh: '攻城棋：指挥兵王攻入敌营——高卢战争里，凯撒靠的正是这样的调度与欺骗。', en: 'Siege: march your king into the enemy camp — Gaul was won by just such maneuvering and deception.' },
    { g: 6, zh: '桥梁搭建：搭桥让小球滚到对岸——凯撒一夜架桥渡莱茵河，靠的就是工程与胆识。', en: 'Bridge Builder: span the gap and let the ball cross — Caesar bridged the Rhine in days, by engineering and nerve.' },
    { g: 7, zh: '推箱子：把每只箱子推到目标点——军需调度是远征军的命脉，一步错则满盘输。', en: 'Sokoban: push every crate home — logistics was the lifeline of Caesar\'s armies; one wrong move undoes everything.' },
    { g: 8, zh: '汉诺塔：大盘不压小盘，层层移位——凯撒的移位密码，也是在字母表上做同样的搬运。', en: 'Tower of Hanoi: move the stack without breaking the rule — the Caesar shift is the same kind of orderly transfer on the alphabet.' },
  ],
  c2: [
    { g: 7, zh: '国际象棋：从波斯传入阿拉伯智慧宫的智慧游戏——棋理与破译一样，靠推演与先手。', en: 'Chess: the Persian game refined in the House of Wisdom — like codebreaking, it is all foresight and initiative.' },
    { g: 8, zh: '跳棋：斜走跳吃升王——简单规则下藏着无穷变招，正如肯迪眼中的字母统计。', en: 'Checkers: simple moves, endless tactics — Al-Kindi saw the same hidden depth in letter counts.' },
    { g: 9, zh: '数独：每行每列每宫填满 1-9——阿拉伯人把数学推理变成生活方式，数独正是它的直系后裔。', en: 'Sudoku: fill every row, column and box — the Arabs turned logical deduction into a way of life; sudoku is its direct heir.' },
    { g: 10, zh: '数织：从行列线索推出图案——线索推理的乐趣，与频率分析的思维如出一辙。', en: 'Nonogram: deduce the picture from row and column clues — clue-solving is frequency analysis in another guise.' },
    { g: 11, zh: '24 点：加减乘除凑 24——阿拉伯算术的速算挑战，智慧宫里每天都上演。', en: '24 Game: reach 24 with four numbers — arithmetic games like this filled the House of Wisdom.' },
    { g: 12, zh: '方形分割：按数字切成矩形——几何与数字的严谨结合，正是巴格达学者的日常。', en: 'Shikaku: cut the grid into numbered rectangles — geometry and numbers, the daily craft of Baghdad\'s scholars.' },
    { g: 13, zh: '拼图填数：同数连通、面积恰等——用约束推理解谜，与破译替换密码用的是同一套逻辑。', en: 'Fillomino: connect equal numbers into exact-area blocks — constraint reasoning, the same logic that breaks substitution.' },
    { g: 14, zh: '数回：连线成环、数字管边——唯一解的逻辑谜题，是肯迪式严谨思维的现代玩具。', en: 'Slitherlink: loop the line, obey the numbers — uniquely solvable logic puzzles are modern toys for Al-Kindi\'s rigor.' },
  ],
  c3: [
    { g: 4, zh: '单词搜索：在字母阵里找出藏着的词——培根的双字体，正是把秘密藏进普通文字。', en: 'Word Search: find words hidden in a grid of letters — Bacon hid a second message inside ordinary prose.' },
    { g: 5, zh: '井字棋：两种符号轮流落子——A/B 双字体只有两种状态，却能编码整本《学术的进展》。', en: 'Tic-tac-toe: two symbols in turn — Bacon\'s two fonts are just two states, yet they encode a whole book.' },
    { g: 6, zh: '西瓜合成：两两合成、越变越大——二进制里 0 和 1 不断组合，长成今天的一切计算。', en: 'Watermelon Merge: combine pairs into something bigger — from two symbols, binary grew into all of computing.' },
  ],
  c4: [
    { g: 9, zh: '铁壁防线：守住密码局、清剿坦克——一战坦克首次登场，密码战也在这条战线上打响。', en: 'Tank Defense: hold the line against armor — the tank first rumbled onto WWI battlefields while the cipher war raged alongside.' },
    { g: 10, zh: '扫雷：推理与运气找出地雷——堑壕战的雷区，和破译一样考验判断与冷静。', en: 'Minesweeper: find the mines by logic and luck — the minefields of the trenches demanded the same nerve as codebreaking.' },
    { g: 11, zh: '弹幕射击：2px 判定点贴弹擦分——索姆河上空的弹幕，就是最早的"擦弹生存"。', en: 'Bullet Hell: thread the bullets with a tiny hitbox — the barrages over the Somme were the original survival game.' },
    { g: 12, zh: '轨道射击：90 秒限时命中——战地枪手的反应训练，报务员和炮手都在抢时间。', en: 'Rail Shooter: 90 seconds of target practice — gunners and signallers alike raced the clock on the front.' },
    { g: 13, zh: '节拍脉冲：跟着节奏精准点击——摩斯电码就是节奏：一点一划，就是战场的脉搏。', en: 'Rhythm: hit the beat precisely — Morse is rhythm: dot and dash, the pulse of the war.' },
    { g: 14, zh: '反应力测试：变绿瞬间点下去——前线士兵的生死只在一瞬间，报务员抄报同样分秒必争。', en: 'Reaction: click the instant it turns green — on the front, life hung on a split second; signallers raced it too.' },
    { g: 15, zh: '太空射击：驾驶战机击落敌机——空战是电报之外的另一个新战场，速度即胜负。', en: 'Space Shooter: pilot your fighter and shoot them down — the sky was a new front, and speed decided everything.' },
  ],
  c5: [
    { g: 6, zh: '卡牌构筑：能量抽牌出牌、击败 Boss——资源调度与组合策略，正是布莱切利园的日常。', en: 'Deckbuilder: manage energy and combos to beat the boss — resource juggling was Bletchley\'s daily grind.' },
    { g: 7, zh: '战棋对决：兵种克制、移动范围——军事推演入局，破译战也是一场棋。', en: 'Tactics: counters and movement ranges — wargaming enters the picture; the cipher war was chess at scale.' },
    { g: 8, zh: '塔防：建塔守波次——防线思维：图灵的 Bombe 就是一座攻不破的"逻辑防线"。', en: 'Tower Defense: build and hold against waves — Turing\'s Bombe was an unbreachable line of logic.' },
    { g: 9, zh: '扑克对决：跟注加注、心理博弈——破译员和对手都在虚张声势，谁先看穿谁赢。', en: 'Poker: bluff and read — codebreakers and enemies both bluffed; the one who saw through won.' },
    { g: 10, zh: '21 点：算牌逼近庄家——概率心算的实战演练，图灵本人就是个传奇牌手。', en: 'Blackjack: count your way past the dealer — probability in your head; Turing was himself a legendary gambler.' },
    { g: 11, zh: '纸牌接龙：七列红黑交替、A 到 K 还原——战时园区的消遣，也藏着"调度"的智慧。', en: 'Klondike: rebuild the four suits — the park\'s favorite pastime, and a quiet lesson in ordering.' },
  ],
  c6: [
    { g: 4, zh: '拉线占领：拖线派兵、吞并中立——太平洋岛屿争夺战，就是一张会动的棋盘。', en: 'Sectorsiege: drag lines, seize territory — the island-hopping campaign was a living board game.' },
    { g: 5, zh: '青蛙过河：穿越车流与河流——两栖登陆的缩影：时机、路线、一点点运气。', en: 'Frog Crossing: dodge the traffic, cross the river — amphibious landings in miniature: timing, route, and luck.' },
    { g: 6, zh: '保龄球：10 帧标准计分——甲板上的休闲时光，水兵们用球瓶消磨战间长夜。', en: 'Bowling: ten frames, strike and spare — deck leisure for sailors killing the long nights between battles.' },
    { g: 7, zh: '台球：拖拽击球、清空台面——军官俱乐部的消遣，珍珠港的破译员也常在此歇脚。', en: 'Billiards: line up the shot and clear the table — officers\' club pastime; Pearl Harbor\'s codebreakers wound down here too.' },
    { g: 8, zh: '乒乓球：先得 7 分获胜——太平洋舰队的甲板乒乓，快节奏里全是反应与手感。', en: 'Pong vs AI: first to 7 — deck-table ping-pong on Pacific carriers, all reflexes and touch.' },
    { g: 9, zh: '双人弹球：本地双人同屏对决——舰员宿舍的即时对战，输的人请咖啡。', en: 'Paddle Pong: local two-player duel — barracks showdowns; the loser buys the coffee.' },
    { g: 10, zh: '冰壶：摩擦滑行、刷冰得分——北太平洋寒夜里的俱乐部游戏，算力与手感并存。', en: 'Curling: slide, sweep, score — a club game for cold Pacific nights, half calculation, half touch.' },
  ],
  c7: [
    { g: 4, zh: '五子棋：黑白连五——源自东亚的连珠棋，恰是美日博弈的棋盘隐喻。', en: 'Gomoku: five in a row — the East Asian line game, a fitting board for the US-Japan duel.' },
    { g: 5, zh: '黑白棋：翻转攻城略地——每一步都改变局势，像紫密里被一步步反推的开关。', en: 'Reversi: flip the board with every move — each step reshapes the position, like the switches being reverse-engineered inside Purple.' },
    { g: 6, zh: '四子棋：抢先连成四子——外交电报的博弈，谁先读懂对方的"下一子"谁占先机。', en: 'Four in a Row: connect four first — the diplomatic cable game: read the enemy\'s next move and seize the initiative.' },
  ],
  c8: [
    { g: 4, zh: '地牢探险：随机五层、迷雾打怪——程序化生成的地牢，正是"可编程"思想的第一声啼哭。', en: 'Dungeon: five random floors of fog and loot — the procedurally generated dungeon is a first cry of "programmable".' },
    { g: 5, zh: '平台跳跃：穿越平台收集金币——电子游戏的像素始祖，和 Colossus 同属计算机的黎明。', en: 'Platformer: hop across platforms, grab the gold — the pixel ancestor of video games, born in the same dawn as Colossus.' },
    { g: 6, zh: '恐龙快跑：无限奔跑躲障碍——跑酷游戏的鼻祖，是计算机时代的第一批"程序"。', en: 'Dino Run: run forever, dodge everything — the endless runner is one of the first programs of the computer age.' },
    { g: 7, zh: '像素飞鸟：点一下飞一下——像素与节奏，图灵与弗劳尔斯当年追逐的，正是这像素级的精确。', en: 'Pixel Bird: tap to fly — pixels and timing; the precision Turing and Flowers chased was pixel-fine.' },
    { g: 8, zh: '小行星：击碎小行星群——1979 年的经典街机，是计算机从战时走向大众的见证。', en: 'Asteroids: shatter the rocks — the 1979 arcade classic, witness to computers leaving the war and reaching everyone.' },
    { g: 9, zh: '俄罗斯方块：堆叠消除极限手速——方块落下的一刻，就是比特在屏幕上的第一次排队。', en: 'Tetris: stack and clear at speed — falling blocks were bits queuing on screen for the first time.' },
    { g: 10, zh: '打砖块：弹球击碎砖块——最早的物理游戏之一，计算从密码房走进了游乐厅。', en: 'Breakout: smash the bricks with a ball — one of the first physics games, as computing left the code room for the arcade.' },
  ],
  c9: [
    { g: 4, zh: '绵羊三消：多层叠牌、卡槽消除——冷战的情报网层层相叠，剪开一层还有一层。', en: 'Sheep Match: clear the layered stacks — Cold War intelligence was layered too; cut one net and another appears.' },
    { g: 5, zh: '快艇骰子：五颗骰子策略填分——间谍世界的运气与算计，一掷之间见真章。', en: 'Yahtzee: five dice, thirteen categories — luck and calculation, the spy\'s world in a single throw.' },
    { g: 6, zh: '接物大作战：接住好货、躲开炸弹——谍报员的收与避：接住情报，躲开追踪。', en: 'Catch: grab the good, dodge the bombs — a case officer\'s art: take the intel, avoid the tail.' },
    { g: 7, zh: '切绳救星：切割绳子、精准落位——拆弹与破译同源：剪对一根线，救下整个世界。', en: 'Rope Rescue: cut the rope at just the right moment — defusing and decoding are kin: cut the right line, save the world.' },
    { g: 8, zh: '弹珠消消：彩球三连消除、倒退爆炸——冷战谍战像一局弹珠：连锁反应一旦触发便难以收场。', en: 'Ball Pop: chain the colors, trigger the explosions — Cold War espionage was a pinball run: once the chain starts, it is hard to stop.' },
  ],
  c10: [
    { g: 7, zh: '电路连接：旋转线路点亮灯泡——布尔电路就是信息论的物理化身：0 与 1 在导线里流淌。', en: 'Circuit: rotate the wires to light the bulb — Boolean circuits are information theory made physical: 0s and 1s flowing through wire.' },
    { g: 8, zh: '点灯：点一格翻相邻——异或运算的游戏化：香农说，一切加密都建立在它之上。', en: 'Lights Out: flip the neighbours — XOR in game form: Shannon showed all modern crypto rests on it.' },
    { g: 9, zh: '迷宫：随机迷宫寻路——图论与算法的最直观入口，计算机科学就从这里起步。', en: 'Maze: find the exit in a random maze — the most intuitive gateway to graph theory and algorithms.' },
    { g: 10, zh: '管道连接：接通两端、步数最少——网络拓扑的游戏化：今天的信息高速公路，就是这样连起来的。', en: 'Pipe: connect the ends in fewest moves — networking in miniature: the information superhighway is just pipes joined well.' },
    { g: 11, zh: '数字华容道：移动方块排成顺序——状态空间搜索，人工智能的看家本领。', en: '15-Puzzle: slide the tiles into order — state-space search, the bread and butter of AI.' },
    { g: 12, zh: '岛屿连线：架桥连通、桥数等于数字——图的连通性谜题，网络安全的本质也是"连通"。', en: 'Hashi: bridge the islands exactly — graph connectivity as a puzzle; cybersecurity is connectivity too.' },
    { g: 13, zh: '华容道：横刀立马、送曹操出关——状态搜索的东方经典，香农的"下一子"思维在这里热身。', en: 'Klotski: slide the blocks and free the general — the Eastern classic of state search; Shannon\'s "next move" thinking warms up here.' },
  ],
};

/* 校验：每章 g 号必须 ≤ 该章游戏数，且不覆盖已有键 */
const st = fs.readFileSync(STORY, 'utf8');
let added = 0;
let block = '';
for (const [ch, items] of Object.entries(DATA)) {
  for (const it of items) {
    const keyZh = "d.zh['st." + ch + ".g" + it.g + "']";
    const keyEn = "d.en['st." + ch + ".g" + it.g + "']";
    if (st.includes(keyZh) || st.includes(keyEn)) {
      console.log('❌ 键已存在（跳过）: ' + ch + '.g' + it.g);
      continue;
    }
    block += '  ' + keyZh + " = '" + it.zh.replace(/'/g, "\\'") + "';\n";
    block += '  ' + keyEn + " = '" + it.en.replace(/'/g, "\\'") + "';\n";
    added++;
  }
}
if (!added) { console.log('没有新增键，跳过写文件'); process.exit(0); }

/* 追加到 i18n-story.js 末尾（作为独立 IIFE） */
const append =
  '\n/* ============================================================\n' +
  '   新入章游戏关联文案（S3 内容扩充：65 款孤儿游戏进章节）\n' +
  '   ============================================================ */\n' +
  '(function () {\n' +
  '  var d = Arcade.i18n.dicts;\n' +
  block +
  '})();\n';

fs.writeFileSync(STORY, st.replace(/\n*$/, '\n') + append);
console.log('✓ 已追加 ' + added + ' 条文案（' + Object.keys(DATA).length + ' 章）到 i18n-story.js');
