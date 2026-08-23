# 破译 DECODE ARCADE · 101 款逐款质量状态总表（2026-08-16 终版）

> 评审卡（score/verdict/playable/issues 数）来自 11 组 AI 逐款源码评审（修复前快照）；「已修复」列汇总两轮修复（P0-P2 全部 + P3 首轮）。

| 游戏 | 评分 | 评审结论 | 可通关 | 问题数 | 已修复 |
|---|---|---|---|---|---|
| pixelbird | 8.5 | PASS | ✅ | 1 | — |
| catch | 8.5 | PASS | ✅ | 1 | 漏接惩罚；桌面悬停跟随 |
| reaction | 8.5 | PASS | ✅ | 0 | — |
| platformer | 8 | MINOR | ✅ | 3 | HUD 重开同步；Enter 粘滞；D-pad 按下/释放 |
| rhythm | 8 | MINOR | ✅ | 2 | 判定词双语；暂停(移动端待办) |
| catapult | 8 | MINOR | ✅ | 3 | 物理倍率重调→桌面可达(240/240 模拟)；触屏发射崩溃；教程修正 |
| spaceshooter | 8 | MINOR | ✅ | 2 | 教程触屏描述 |
| railshooter | 7.8 | MINOR | ✅ | 2 | 教程友军描述 |
| dungeon | 8.5 | MINOR | ✅ | 2 | D-pad 按下/释放；楼梯提示文案 |
| bullethell | 7.5 | MINOR | ✅ | 4 | 判定点统一；暂停提示修复；受击无敌帧；重开首波重建 |
| snake | 8.5 | PASS | ✅ | 2 | D-pad 按下/释放 |
| g2048 | 8.5 | PASS | ✅ | 1 | (评审通过) |
| blocks | 7 | MED | ✅ | 1 | sprintLabel 覆盖 bug |
| match3 | 7 | MED | ✅ | 1 | 触屏双触发 |
| fruitmerge | 8.5 | PASS | ✅ | 2 | — |
| mazedot | 7 | MED | ✅ | 2 | D-pad 按下/释放 |
| pixeldino | 8.5 | PASS | ✅ | 1 | — |
| frogcross | 8.5 | PASS | ✅ | 1 | D-pad 按下/释放 |
| brickbash | 8.5 | PASS | ✅ | 1 | — |
| asteroidf | 7 | MED | ✅ | 1 | D-pad 按下/释放 |
| ballpop | 8.5 | PASS | ✅ | 2 | 结算再来按钮；meta 描述对齐 |
| tank | 8.5 | PASS | ✅ | 2 | 教程掉落描述(共享字典) |
| chess | 8 | MINOR | ✅ | 5 | — |
| checkers | 8 | MINOR | ✅ | 3 | 玩家侧有跳必跳 |
| gomoku | 8.5 | PASS | ✅ | 1 | — |
| reversi | 8.5 | PASS | ✅ | 2 | — |
| tictactoe | 8.5 | PASS | ✅ | 1 | — |
| fourline | 7.5 | MINOR | ✅ | 3 | AI 定时器竞态；棋盘 320px 溢出 |
| siege | 8 | MINOR | ✅ | 3 | meta 高地描述；僵局判定 |
| poker | 8.5 | MINOR | ✅ | 2 | 筹码不足提示 |
| blackjack | 8.5 | PASS | ✅ | 1 | — |
| diceluck | 8.5 | PASS | ✅ | 1 | — |
| deckbuilder | 7 | MED | ✅ | 3 | Boss 重复结算守卫；换 Boss 立即渲染 |
| towerdefense | 7 | MED | ✅ | 2 | P0 升级崩溃；触屏暂停按钮 |
| tactics | 6.5 | MED | ✅ | 3 | AI 网格同步；棋盘 320px 溢出 |
| klondike | 8.5 | PASS | ✅ | 2 | 每日构造式必胜牌局；核心空指针防御 |
| sectorsiege | 8 | MINOR | ✅ | 2 | — |
| codeguess | 7 | MINOR | ✅ | 3 | 键盘 320px 溢出；结算再来按钮；触控 div 语义(P3 待办) |
| caesar | 9 | PASS | ✅ | 1 | — |
| morse | 8 | MINOR | ✅ | 1 | — |
| codebreak | 8.5 | PASS | ✅ | 1 | — |
| substitution | 8.5 | PASS | ✅ | 0 | — |
| vigenere | 8.5 | PASS | ✅ | 0 | — |
| morselong | 7.5 | MINOR | ✅ | 2 | 教程间隔描述 |
| binary | 8 | PASS | ✅ | 1 | 空格格提示(P2 待办) |
| typecode | 8 | PASS | ✅ | 1 | — |
| railfence | 7 | MINOR | ✅ | 2 | 答案剧透修复；教程 2~6 轨 |
| affine | 8 | PASS | ✅ | 1 | — |
| base64 | 8 | PASS | ✅ | 1 | — |
| morsetap | 7 | MINOR | ✅ | 3 | 教程下划线描述 |
| freq | 7 | MINOR | ✅ | 3 | 柱列触控换行；教程交互描述 |
| enigma | 7 | MINOR | ✅ | 4 | raid 后台倒数暂停；插线板按钮放大；M4 转子换型同步 |
| playfair | 7 | MINOR | ✅ | 3 | L1 占位错位；L3 剧透；教程字母对反馈 |
| xor | 8 | PASS | ✅ | 2 | — |
| adfgvx | 7 | MINOR | ✅ | 3 | 挑战方阵按密钥重建 |
| campaign | 9 | PASS | ✅ | 3 | 计时器重开冻结回归；教程工具描述 |
| detective | 6.5 | MAJOR | ❌ | 2 | P0 第二章摩斯密文缺失→可通关；终局计时停止；线索触控半径 |
| bifid | 8.5 | PASS | ✅ | 2 | — |
| bombe | 8.5 | PASS | ✅ | 1 | 教程验证按钮描述 |
| hill | 8.5 | PASS | ✅ | 1 | — |
| workshop | 8.5 | PASS | ✅ | 2 | — |
| venona | 8.5 | PASS | ✅ | 1 | — |
| jn25 | 8.5 | PASS | ✅ | 1 | — |
| plugboard | 8.5 | PASS | ✅ | 2 | — |
| trifid | 8.5 | MINOR | ✅ | 3 | 候选/槽位触控放大；教程立方体描述 |
| purple | 4 | MAJOR | ❌ | 2 | P0 已知轮位未写入→三关可解 |
| m209 | 8.5 | MINOR | ✅ | 2 | 步进按钮放大 |
| lorenz | 8.5 | MINOR | ✅ | 2 | 步进按钮放大 |
| maker | 8 | MINOR | ✅ | 3 | — |
| spotdiff | 7.5 | MINOR | ✅ | 2 | 字符触控放大；每关计时重置 |
| bacon | 8 | MINOR | ✅ | 3 | 字符触控放大 |
| dungeon-cipher | 8.5 | MINOR | ✅ | 2 | 结算按公式计分 |
| sudoku | 8 | MINOR | ✅ | 3 | 棋盘 320px 溢出；教程计分公式 |
| nonogram | 8 | MINOR | ✅ | 2 | 多解软锁→线索校验判胜 |
| slitherlink | 8 | MINOR | ✅ | 3 | 棋盘 320px 溢出 |
| hashi | 9 | PASS | ✅ | 1 | — |
| minesweeper | 8 | MINOR | ✅ | 2 | 高级 20×20 尺寸规则 |
| lightsout | 8 | PASS | ✅ | 1 | — |
| shikaku | 8 | MINOR | ✅ | 2 | 教程拖拽描述 |
| fillomino | 2 | MAJOR | ❌ | 2 | P0 生成器+判胜重写→可通关 |
| wordsearch | 8 | PASS | ✅ | 2 | — |
| paintbynum | 8 | PASS | ✅ | 1 | — |
| game24 | 9 | PASS | ✅ | 1 | — |
| guess | 9 | PASS | ✅ | 1 | — |
| llk | 7 | MED | ✅ | 3 | 跨关计时重置 |
| sheep | 8 | MINOR | ✅ | 2 | 棋盘 320px 溢出 |
| memory | 9 | PASS | ✅ | 1 | 教程动态对数 |
| puzzle15 | 9 | PASS | ✅ | 0 | — |
| klotski | 8 | MINOR | ✅ | 1 | 棋子标签双语 |
| hanoi | 9 | PASS | ✅ | 0 | — |
| pipe | 9 | PASS | ✅ | 0 | — |
| circuit | 9 | PASS | ✅ | 0 | — |
| sokoban | 8 | MINOR | ✅ | 2 | — |
| maze | 9 | PASS | ✅ | 1 | 教程终点描述 |
| roperescue | 5 | MED | ✅ | 3 | P0 touchend 崩溃；切向物理；HUD 按关；教程修正 |
| bridge | 3 | MAJOR | ❌ | 3 | P0 待命→放球状态机→可通关；命中半径缩放；教程修正 |
| curling | 9 | PASS | ✅ | 1 | — |
| billiards | 8.5 | PASS | ✅ | 2 | 抓球半径缩放 |
| twopaddle | 6.5 | MED | ✅ | 3 | 教程 D-pad 描述；胜利消息空格；D-pad 按下/释放 |
| paddle2p | 6 | MED | ✅ | 3 | D-pad 按下/释放 |
| bowling | 9 | PASS | ✅ | 2 | — |
