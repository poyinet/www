# 破译 DECODE ARCADE · 全站质量审查报告（2026-08-16）

> 由 `tools/audit-deep.js` 静态扫描 + 11 组 AI 逐款深度评审 + 人工核验汇总。

## 一、评审总览（101 款）

| 维度 | 结果 |
|---|---|
| verdict 分布 | ✅ PASS 49 · 🟡 MINOR 37 · 🟠 MED 11 · 🔴 MAJOR 4 |
| 平均分 | 7.89 / 10（旗舰基准 8 分） |
| 可通关性 | 修复前 4 款不可通关（detective / purple / fillomino / bridge）→ **修复后全部可通关** |
| 崩溃 | 修复前 2 处（roperescue touchend / towerdefense 升级）→ **已修复** |
| 静态扫描 | MAJOR 0 · MED 0 · MINOR 1（typecode 打字类键盘依赖，可接受）|

## 二、已修复（本轮）

### 轮次二（P1 剩余 + P2 文案批量）

**P1（13）**
| 游戏 | 修复 |
|---|---|
| catapult | 物理倍率 0.22→0.7（桌面端弹道够不到目标、必输）+ 触屏松手无法发射（touchend 读空 touches）+ 抓取半径缩放 + 死代码 level 清理 + 目标限制在可达区（模拟 240/240 可达）+ 教程文案 |
| trifid / m209 / lorenz / spotdiff / bacon | 触控目标放大（30-40px 级） |
| billiards | 抓球命中半径按画布缩放 |
| tactics | AI 移动不同步 grid（旧格残留/新格不占）+ 棋盘内联 44px 覆盖媒体查询溢出 → 响应式格宽 |
| deckbuilder | onBossDown 可重复触发（毒/荆棘/精英胜利窗口）→ 结算守卫 + 换 Boss/精英后立即 render |
| towerdefense | 触屏暂停按钮（此前仅键盘 P） |
| catch | 漏接无惩罚可无限挂机刷分 → 漏接非炸弹扣命 |
| minesweeper | 高级 20×20 误用 d-mid 样式 → 新增 d-hard 尺寸规则 |

**P2 文案/一致性（16）**
| 游戏 | 修复 |
|---|---|
| railfence | 密文标签泄露轨道数（答案剧透）→ 不显示轨道数；教程 2~6 轨一致 |
| spaceshooter | 教程「点上方射击」→ 半屏移动并自动开火 |
| railshooter | 「打到友方 -5」→ 脱靶 -5 |
| morsetap | 「播放中可看提示下划线」未实现 → 修正 |
| morselong | 「· 表字母间隔」→ 空格表字母间隔 |
| shikaku | 教程「拖动」→ 两次点选 |
| maze | 终点 ⭐ → 黄方块 |
| siege | 页面 meta「高地兵攻击加倍」→ 攻击距离 +1 |
| dungeon | 楼梯提示「Boss 还在」→ 任何怪物都挡 |
| tank | 「摧毁敌人后掉落」→ 波次间隙掉落（共享字典 gt.tut3） |
| campaign | 教程「工具随关卡解锁」→ 每关自动提供 |
| bullethell | 判定点 2px/3px 统一 + 暂停提示移出 draw（暂停不显示）+ 受击无敌帧 1.5s + 闪烁 |
| twopaddle | 教程「右侧 D-pad」→ 下方；胜利消息缺空格 |
| freq | 教程「弹层选择」→ 点击循环切换 |
| bombe | 教程「灯板验证」→ 验证候选按钮 |
| trifid | 教程「立方体实时显示」→ 解密预览 |
| playfair | 教程「字母对反馈」→ 全对即通关 |
| checkers | 玩家侧「有跳必跳」强制执行（与 AI 规则一致） |

### 轮次一（P0 + 版权 + 首轮 P1/P2）
见上文「已修复（本轮）」段 —— detective/purple/fillomino/bridge 可通关、roperescue/towerdefense 崩溃、mazedot 版权改名、blocks/fourline/match3/codeguess/sudoku/slitherlink/sheep/poker/freq/enigma、createDPad 升级 8 款、rhythm/klotski/platformer/spotdiff/llk/memory/sudoku/dungeon-cipher/campaign/nonogram 等。

## 三、待办（下一轮起）

### P0 不可通关 / 崩溃（6）
| 游戏 | 问题 | 修复 |
|---|---|---|
| detective | 第二章摩斯密文未渲染到界面（谜题无解） | 完整摩斯电文写入 c2.q / c2.clue1，修正密码本「/ 表单词间隔」文案；终局停止计时 |
| purple | 已知轮位未写入 playPos，L1-L3 数学上不可解 | buildPosOps 写 knownPos、buildPlugOps 用完整轮位 |
| fillomino | ①checkWin 计入不可点击线索格必输 ②生成器同值块相邻违背规则 | 回溯生成合法铺砌（同值块不相邻，实测 500/500 成功）+ 胜判定改为规则校验器 |
| bridge | 小球开局即滚落，无「待命→放球」状态机 | 新增 ready 状态 + 放球才释放 + 计时从放球起算 + 命中半径随缩放 |
| roperescue | touchend 用 e.touches[0]（空）崩溃 | 改用 changedTouches；切向初速修正；摆幅限幅；HUD 按关显示；教程更新 |
| towerdefense | 升级塔用未声明的 spec.range 崩溃 | 改用 TOWERS[existing.type].range |

### 版权合规（发现即处理）
- **mazedot（吃豆人）**：改名「迷宫吃豆 / Maze Dot」+ 全站（注册表/双语字典/页面/教程/PLAN.md）同步 + 免责声明「非官方，与 PAC-MAN™ 无关」+ 幽灵改圆球造型、主角改霓虹青光球（去除角色相似度）
- 字体（Press Start 2P / Fusion Pixel）均为 OFL ✓；音效全 WebAudio 合成 ✓；emoji 平台自带 ✓；`og-image.png` 来源需人工确认（报告内标注）

### P1 移动端 / 操作性（12+）
| 游戏 | 修复 |
|---|---|
| blocks | sprintLabel 双赋值覆盖（sprint 计时不显示）→ 声明不覆盖 |
| fourline | AI 落子 setTimeout 竞态（重开残留）→ 定时器句柄 + reset 清理；棋盘 354px→min(354px,94vw)+aspect-ratio |
| match3 | 触屏轻触双触发（选中即取消）→ touchend preventDefault 抑制合成 click |
| codeguess | 屏幕键盘 320px 溢出 → 按键 flex 自适应 |
| sudoku | 棋盘 350px 溢出 → min(360px,94vw)+aspect-ratio |
| slitherlink | 7×7 棋盘 390px 溢出 → 按视口算格宽 |
| sheep | 棋盘固定 478px 溢出 → GAP 按视口适配 |
| asteroidf / mazedot / frogcross / snake / dungeon / platformer / twopaddle / paddle2p | **createDPad 升级按下/释放语义**（8 款统一修复「点一下永久漂移/双移动」） |
| poker | 筹码不足时静默死按钮 → 提示文案 |
| freq | 26 列 320px 下每列 11px → 窄屏换行每列 ≥34px |
| enigma | raid 倒计时切后台继续走 → document.hidden 暂停 |

### P2 i18n / 内容 / 计分（11+）
| 游戏 | 修复 |
|---|---|
| rhythm | MISS/PERFECT/GOOD 硬编码英文 → i18n 键（完美/良好/漏击）|
| klotski | 曹/将/关/兵 英文模式直接显示 → i18n 标签（CAO/GEN/GUAN/SOL）|
| platformer | 重开 HUD 分数残留 + Enter 跳跃粘滞 → 同步 + keyup 清理 Enter |
| spotdiff | 跨关累计计时虚高 → 每关重置 chalStart |
| llk | 同上 → 每关重置 chalStart |
| memory | 教程写死「8 对」与难度不符 → 动态文案 |
| sudoku | 教程未提错误罚时（成绩=秒+错×5）→ 补文案 |
| dungeon-cipher | 教程称 层数×100+HP×2 但代码只算层数 → 按公式实现结算 |
| campaign | 计时器重开冻结（上轮修复引入的回归）→ 移入 startLevel 先清后设 |
| nonogram | 随机图案多解导致按线索填写不判胜（软锁）→ 胜判定改为行列线索校验 |
| detective | 终局计时器未停 → 结算时清理 |

## 三、待办（下一轮起）

### 轮次三（P2 剩余 + P3 首轮）
| 游戏 | 修复 |
|---|---|
| **klondike** | 每日一题随机洗牌约 15-30% 不可解 → **构造式必胜牌局**（`K_buildSolvableDeal`：轮转顺序编排 + 花色按日种子置换，30/30 日种子经独立贪心验证可解；顺带修复核心函数潜在空指针） |
| playfair | L1 提示占位错位（PLAYF?IR→PLAY·AIR）、L3 提示剧透（删「缺 C/O/Y」） |
| adfgvx | 挑战模式屏上 6×6 方阵按关卡密钥重建（此前常驻 RAILWAY 表致手工解码错误） |
| enigma | M4 每日换转子型号后密文/密钥失同步 → 同步重生成；插线板按钮 34px→40px |
| siege | 新增无子可走（僵局）判定与结算 |
| codeguess / ballpop | 胜/负后新增「再来一局」按钮（此前需顶栏重开） |
| catch | 桌面鼠标悬停移动 → 仅按下时跟随 |
| bullethell | 重开/切难度立即生成第 1 波（此前空转 0.7s 后直接进第 2 波） |
| ballpop | meta 描述与实际玩法（倒退/爆炸球→倒退）对齐 |

### P2 剩余（少量）
- enigma M4 每日密钥可直接查看（速度刷分，设计权衡已评估，保持现状）
- klondike 普通模式（非每日）仍随机洗牌——保持标准随机（可接受，每日已保证可解）

### P3 旗舰升级（挑重点）
- 结算浮层 / 移动端暂停按钮 / 胜利再玩按钮的若干游戏（codeguess/ballpop 已完成，其余按需）
- 触控目标 ≥44px 全站巡检收尾

## 四、报告产物
- `tools/report/deep-audit-2026-08-16.md` / `.json`（静态扫描）
- `tools/report/game-cards-all.json`（101 款逐款质量卡）
- `tools/report/cards/<组>.json`（11 组原始评审卡）
