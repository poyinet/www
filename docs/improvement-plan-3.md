# 破译 DECODE ARCADE · 改进计划 第三期

> 版本：2026-08-22 · 前置：一/二期共 41 项已全部实施；旗舰代码评审 90/105 已出（a-f 批收尾中）；内容四线评审修复完毕
> 原则约束不变：**零构建、零依赖运行时、纯静态、file:// 直开、双语、零遥测**

---

## 〇、本轮新取证

上轮评审遗留 7 项经复核**确认仍未修复**（本计划 Phase 0 全部消化）：

| # | 位置 | 问题 |
|---|---|---|
| 1 | games/frogcross | canvas 无 devicePixelRatio 处理（高分屏模糊）|
| 2 | games/hashi:61 vs :159 | `bridgeKey` 同名声明两次，后者覆盖前者 → giveHint 对反向选岛误判并重复画桥 |
| 3 | games/detective | 章内进行中顶栏计时冻结（仅结算时累加），不走秒 |
| 4 | games/twopaddle:96 | `submitScore(ls)` 恒为 7，BEST 无区分度且落败不提交 |
| 5 | games/fruitmerge:98-108 | 判负要求 `vy<-3` 但碰撞不改 vy，满堆溢出可能永不判负 |
| 6 | games/tactics:296/302/351 | 特效定位硬编码 `x*48+22`，响应式格宽 24-44px 下落点错位 |
| 7 | games/towerdefense:192 | 波次分散只改 pathIdx 不同步 x/y，敌人直线飞入而非沿路径进场 |

另：一期遗漏的 DPR 修复已在本轮前置完成 ×17（maze/pipe/pixelbird/pixeldino/platformer/railshooter/mazedot/roperescue/snake/sectorsiege/spaceshooter/tank/towerdefense/twopaddle/fruitmerge/hashi/dungeon），frogcross 为最后一块。

---

## 一、Phase 0 · 遗留修复包（P0，约半天）

逐项修法：
1. **frogcross**：接入 `Arcade.input.hiDPI(canvas)`（与已修复 17 款同一模式）
2. **hashi**：删除 :159 的重复声明保留排序版；giveHint 改用排序版键序查 `drawn`
3. **detective**：计时回调改为「已完成章节总时长 + 当前章节实时 elapsed」
4. **twopaddle**：终局提交改为净胜局 `Math.max(0, ls - rs)`（max 模式下有区分度；落败方不提交维持现状）
5. **fruitmerge**：判负条件改为「顶部溢出判定」——任一水果 `y - r < 0` 且已落地（`vy >= 0` 或触底反弹后仍越界）即 game over，不再依赖速度阈值
6. **tactics**：特效定位改用现有 `--tk-cell` 变量换算（`parseFloat(getComputedStyle(board).getPropertyValue('--tk-cell'))`），三处硬编码替换
7. **towerdefense**：波次重排时同步重算敌人 x/y 至路径起点（复用现有 path 取点函数）

验收：`node --check` 全过 · smoke 105/105 · play-probe 105/105 · 上述 7 款人工各试 1 分钟。

## 二、Phase 1 · 内容叙事二期（P1，约一天）

1. **核心/休闲文案分层 UI**（叙事评审 Top4 正式落地）：STORIES 的 games 数组按既有人工清单标注核心密码局（caesar/freq/enigma 等 ~15 款）与时代彩蛋两层；story.html 游戏区视觉分组（🔐 密码局 / 🎲 时代彩蛋），首页旅程 chips 同步标识。
   - 验收：视觉分组可见；check-chapter-copy 保持全绿（键不动只分层）
2. **上章回顾行**（对称已有 nextHook，可选）：`st.cN.prevHook` 若无强诉求则跳过——默认跳过，避免堆叠。
3. **互链密度审计工具**：`tools/check-link-density.js` 统计每个游戏被多少个内容页引用（章节/地图/时间线/术语），输出孤联清单供后续内容运营。

## 三、Phase 2 · E2E 用例扩展二期（P1–P2，约一天）

1. **每日破译端到端**：做一题每日挑战 → markSolved → 大厅「今日完成」态翻转 → 档案页 streak 变化
2. **成就解锁端到端**：抽 3 枚成就（首次游玩/十局/全类别）驱动条件断言 stats 页徽章点亮
3. **存档往返**：exportJSON → 清空 → importJSON → 关键键值一致断言
4. **引擎扩展**：interactions + mobile 扩至 firefox（webkit 维持 pages+pwa，规避已知平台限制）
   - 验收：全项目矩阵通过；新增用例数与耗时入 README

## 四、Phase 3 · 性能实测基线（P2，约半天）

1. 新增 `tools/perf-probe.js`（Playwright）：采集每根页面 FCP/LCP/DOMContentLoaded/传输体积 → `tools/report/perf-baseline.json`
2. 输出慢页 Top5 与资源占比报告；数据驱动决定是否需要进一步优化（预期结论：多数页面 FCP < 1s 本地，瓶颈在字体与字典，已有专项）
3. SW 离线加载耗时抽样（对比在线/离线首屏）
   - 验收：报告落盘；作为后续任何性能改动的前后对照基线

## 五、Phase 4 · 无障碍进阶（P2，约一天）

1. 弹窗焦点管理：tutorial/profile/search 三类浮层打开时焦点入浮层、Tab 循环限制、Esc 关闭（现仅有按钮关闭）
2. canvas 操作提示 aria-live 试点：选 snake/minesweeper/sudoku 三款，在状态变化时向屏幕阅读器播报关键事件（低频节流）
3. （可选）axe-core 抽查：devDependency 引入与否等你批准，模式同 E2

## 六、Phase 5 · 部署后清单（触发式，等你上传）

- [ ] 真实截图 ×2 替换 assets/screenshots/
- [ ] SW 线上注册/更新 toast 实测
- [ ] 自定义域 HTTPS 与 DNS 四条 A 记录确认
- [ ] GitHub Actions 首跑绿（.github/workflows/qa.yml 已就绪）

## 七、明确继续不做

维持一/二期全部否决项；新增：❌ 不做全站 CSS 死规则自动删除（无可视回归安全网）· ❌ 不为单页 <10KB 收益增加加载分支 · ❌ 不引入框架级无障碍重构

## 八、回归门槛

延续：audit 105/105 · smoke×4 全绿 · deep 三零 · preflight/ghpages/swassets 过 · i18n 双审计零缺失 · e2e 全矩阵 EXIT=0（含新增用例）。

总估算：P0 半天 · P1 一天 · P2 一天 · P3 半天 · P4 一天 · P5 触发式。可任意阶段停下，均保持可部署。
