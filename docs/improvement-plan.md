# 破译 DECODE ARCADE · 持续改进方案

> 版本：2026-08-22 · 基线：全部门禁绿（audit 105/105 · smoke 四模式 · deep MAJOR 0/MED 0 · preflight 122 HTML）
> 原则约束（不可破坏）：**零构建、零依赖、纯静态、file:// 直开可玩、中英双语、纪录仅存本地（零遥测）**。

---

## 〇、本轮摸底实证（方案依据）

| # | 发现 | 级别 | 位置 |
|---|---|---|---|
| 1 | 搜索词 `state.q`（来自 `?q=` URL 参数）**未转义**拼入 innerHTML 模板 `value="…"` | 高危脚枪（当前时序恰好未触发，重构即成反射 XSS） | `assets/js/lobby.js:167` |
| 2 | 68 款游戏缺 BEST_UNITS 单位（最高分徽章只显示裸数字） | INFO ×68 | `lobby.js` BEST_UNITS（37 款已配） |
| 3 | typecode（打字破译）无触屏事件，全站唯一 MINOR | MINOR ×1 | `games/typecode/` |
| 4 | 71 款游戏仅 click 交互（点按类可接受，滑动/连续操作类需逐款复核） | INFO ×71 | deep-audit |
| 5 | 11 款游戏 JS 存在硬编码中文（en 界面回退中文） | INFO ×11 | deep-audit I3 |
| 6 | CSS 层 0 处 `prefers-reduced-motion`（仅 extras.js JS 层一处）——系统开启「减少动态效果」时霓虹动画/粒子仍播放 | 无障碍缺口 | `theme.css` / `shell.css` |
| 7 | `manifest.webmanifest` 无 `screenshots` 字段，安装弹窗不丰富 | 体验缺口 | manifest |
| 8 | 无 `package.json`、无 `README.md`、无 CI；tools/ 混有 **30 个一次性迁移/注入脚本** | 工程化空白 | 根目录 / tools/ |
| 9 | `check-game-i18n.js` 只校验 4 款新游戏的 gs.* 对称性（其余 101 款仅靠 smoke 兜底） | 门禁盲区 | tools/ |
| 10 | 内容基线：时间线 60 节点仅 36 可点击；测验题库 60 题；每日密码谜题池仅 7 个、冷知识池 10 条；名言 30 条；地图 24 事件 | 内容深度 | 各内容页 |

已核实**非问题**：sitemap 121 URL 与页面一致（404.html 不进 sitemap 属正确做法）；`story.html?id=` 仅作字典查找键，无注入面。

---

## 一、Phase 1 · 安全与代码质量（P0，约 1 天）

### A1 搜索参数转义（防御 XSS 脚枪）
- **动作**：新增 `Arcade.escapeHtml()` 公共工具（core/storage.js 或 core/extras.js）；`lobby.js` 中 `state.q` 拼入模板处改为转义，或更彻底——模板留空、URL 参数经 `input.value` 赋值（现有路径）+ 渲染前统一 `state.q = escapeHtml`。
- **配套**：新增 `tools/scan-innerhtml.js` 静态扫描全站 `innerHTML += '…' + 变量` 拼接点并列出含变量插值的行，人工复核一次，纳入门禁。
- **验收**：`games.html?q="><img src=x onerror=…>` 仅作为普通搜索词显示，无标记注入；scan 工具 0 处未转义插值。

### A2 BEST_UNITS 单位补齐（68 款）
- **动作**：逐款确认记分语义，按四类补齐：分数类「分」、步数类「步」、次数类「次」、计时刻类「s/ms」；特殊语义单独配（如 tank 波次、blackjack 筹码、klondike 用时 s）。单位键走 i18n（`lobby.unit*` zh/en）。
- **验收**：`node tools/audit-deep.js` C2 INFO 68 → **0**；档案页/游戏厅徽章显示「1,024 分」「42 步」样式。

### A3 typecode 触屏支持（消灭唯一 MINOR）
- **动作**：游戏内加一排可点按的候选字母条（大触控目标 ≥44px），软键盘照常可用；移动端提示文案进 `gs.typecode.*`。
- **验收**：audit-deep MINOR 1 → **0**（全站 MAJOR/MED/MINOR 三零）。

### A4 CSS 减动效偏好（无障碍）
- **动作**：`theme.css`/`shell.css` 追加 `@media (prefers-reduced-motion: reduce)`：关闭霓虹呼吸、扫描线滚动、卡片 hover 位移等 animation/transition（保留颜色变化）。
- **验收**：系统开启减动效后无持续动画；新增断言进 `tools/audit-fontsizes.js` 同级的检查或 audit-deep。

### A5 硬编码中文迁移（11 款）
- **动作**：11 款 I3 游戏的中文串迁入 `games/<id>/<id>-i18n.js`（gs.*），zh/en 双份。
- **验收**：deep-audit I3 INFO 11 → 0；`node smoke.js en` 无中文回退。

---

## 二、Phase 2 · 工程化与门禁（P1，约半天）

### B1 package.json + 一键质检（零依赖）
- **动作**：新增 `package.json`（**不含任何 dependencies**，仅 scripts）：`npm run audit / smoke / smoke:zh / smoke:en / smoke:page / deep / preflight / qa`；新增 `tools/qa-all.js` 顺序跑全部门禁并输出汇总表（失败即非零退出）。
- **验收**：`npm run qa` 一条命令出全站体检单。

### B2 README.md
- **动作**：面向访客与贡献者：项目简介、在线地址、本地运行、目录结构速览、质量门禁用法、设计约束（零构建/隐私）。
- **验收**：新协作者 5 分钟能跑起门禁。

### B3 tools/ 目录治理
- **动作**：30 个一次性脚本（`add-*`、`inject-*`、`migrate-*`、`_*`、过期的 gen/verify-eggs-4）移入 `tools/oneoff/`（保留作历史档案，不再出现在主目录）；tools/ 根只留「门禁 + 生成器 + 可复跑验证器」三类。
- **验收**：tools/ 根 ≤ 30 个脚本，README 索引分类。

### B4 gs.* 全量对称校验
- **动作**：`check-game-i18n.js` 从 4 款扩展到全 105 款（逐游戏加载 `<id>-i18n.js`，比对 zh/en 键集合与占位符）。
- **验收**：105/105 对称输出；纳入 `qa-all.js`。

### B5（可选）CI
- **动作**：`.github/workflows/qa.yml`：push 时跑 `npm run qa`（纯 node，无安装依赖步骤）。用户自行上传 GitHub 后即可生效。

---

## 三、Phase 3 · 内容完善（P1–P2，约 2–3 天）

### D1 时间线 100% 可点击（60/60）
- 现状 36/60。为其余 24 节点补关联（章节/人物/密件/术语/工坊至少其一）。
- **验收**：`check-timeline.js` 可点击 60/60。

### D2 测验题库 60 → 100 + 错题本
- 4 级 × 25 题；新增「错题重练」模式：答错题写入 localStorage（`arcade_quiz_wrong`），测验页一键只练错题，答对三次移出。
- **验收**：`verify-quiz.js` 扩展断言（100 题结构、错题本增删逻辑）。

### D3 每日密码池扩容
- 谜题 7 → 31（按「日 of 月」轮换）、冷知识 10 → 50（按日种子轮换）。`daily-fact.js` 数据化。
- **验收**：连续 31 天不重复谜题（脚本枚举验证）。

### D4 世界地图扩容
- 24 → 40 事件：从时间线 60 节点中挑选有明确地理属性的补入（含经纬度校验），保持键盘可达。
- **验收**：`verify-machine.js` 同款数据校验脚本 `verify-map.js` 新增。

### D5 知识库增量
- 术语 140 → 150（AI 安全/后量子/隐私计算新词，带章节反链）；名言 30 → 50；每章书单补 1 本近五年新作。
- **验收**：`check-glossary.js` / `check-knowledge.js` 全字段通过。

### D6 摩斯听音训练升级
- 加 Farnsworth 间距档位（字符间距加大、字符内标准），三档速度 → 六档组合；练耳曲线记录进档案。
- **验收**：`smoke.js page` morse 页通过 + 手动试听。

### D7 工坊密信分享链接
- 现有文本复制基础上，新增「复制分享链接」：`workshop.html?c=<base64url(算法|密钥|密文)>`，打开自动载入密文。**参数必须走安全解析（长度上限 + escapeHtml + try/catch）**，与 A1 同一工具函数。
- **验收**：链接往返还原；畸形参数不炸不注入。

### D8 档案页年度足迹
- 「🧭 破译足迹」升级：按月游玩热力条（纯 CSS 格子图，数据来自现有 arcade_* 记录的时间戳；无时间戳的旧纪录显示为「早期」）。
- **验收**：`smoke.js page` stats 页通过；无数据时不渲染空块。

---

## 四、Phase 4 · 体验与性能（P2，约 1–2 天，全部谨慎评估）

| 项 | 动作 | 风险控制 |
|---|---|---|
| C1 manifest screenshots | 生成 2 张安装预览图（游戏厅 + 首页，512×512 或官方比例），manifest 加 `screenshots` | 纯增量；`gen-icons.js` 扩展 |
| C2 i18n-dict 再分层 | 210KB 拆「全站核心 / lobby 专用 / stats 专用」三段按页加载 | 高风险项：先跑 `check-home-keys`/`check-summary-runtime` 键清单盘点，确认拆分边界后再动；收益约 -60~80KB/游戏页 |
| C3 SW 预缓存对齐 | `sw.js` CORE_ASSETS 与 17 根页面 + 全部共享 JS 逐一核对（新增脚本自动比对） | 新增 `tools/check-sw-assets.js` |
| C4 游戏页加载时序评估 | 仅评估 defer/预加载对 FCP 的影响并出报告，**不强制实施** | 保持现有按序注入正确性优先 |

---

## 五、明确不做（边界）

- ❌ 不引入框架、构建链、ES Modules 全量迁移（破坏零构建与 file:// 直开）
- ❌ 不加任何远程统计/错误上报（隐私承诺「纪录仅存本地」）
- ❌ 不做服务端/登录/云存档（可用 B1 的导出导入替代）
- ❌ 不为凑数新增低质量游戏（遵循路线图「旗舰级单一标准」）

---

## 六、执行顺序与回归门槛

```
Phase 1（A1→A5）→ Phase 2（B1→B4）→ 全量回归
→ Phase 3（D1→D8，每完成 2 项回归一次）→ 全量回归
→ Phase 4（C1→C4）→ 终回归
```

**每轮回归门槛（与现有基线一致）**：
`node audit.js` 105/105 · `smoke.js` 默认/zh/en 105/105 + page 17/17 · `audit-deep` MAJOR 0 / MED 0 / MINOR 0（A3 后）/ INFO 显著下降 · `preflight` 全过 · 相关 verify 工具绿。

**总工作量估算**：Phase 1 ≈ 1 天 · Phase 2 ≈ 0.5 天 · Phase 3 ≈ 2–3 天 · Phase 4 ≈ 1–2 天；可按 Phase 独立交付，任意阶段停下都是可部署状态。

---

## 七、实施记录（2026-08-22）

| 项 | 状态 | 说明 |
|---|---|---|
| A1 搜索参数转义 | ✅ | `Arcade.escapeHtml`（core/extras.js）+ lobby.js 改 DOM 属性赋值 + URL 参数钳制 100 字符 + `tools/scan-innerhtml.js` 基线审计 |
| A2 BEST_UNITS ×68 | ✅ | 全部 105 款记分游戏有单位；新增单位键 pts/solved/chips/KO/wins；顺带修复 enigma 轰炸小游戏污染 min 最佳的记分 bug（独立键 `arcade_best_enigma-raid`） |
| A3 typecode 触屏 | ✅ | 屏幕键盘（pointerdown 触控路径、触屏默认展开、桌面不抢焦点）；deep 三零达成 |
| A4 减动效 CSS | ✅ | theme.css/shell.css 追加 `prefers-reduced-motion` 全局媒体查询 |
| A5 硬编码中文 | ✅ | purple/m209 死数组删除；tank 走 gs.tank.hq；paddle2p 内部状态 L/R 化；I3 仅剩已核验良性项 |
| B1 qa 一键化 | ✅ | package.json（零依赖）+ tools/qa-all.js，18 项门禁一条命令 |
| B2 README | ✅ | README.md（运行/门禁/结构/约定） |
| B3 tools 治理 | ✅ | 36 个一次性脚本归档 tools/oneoff/ |
| B4 gs.* 校验全量 | ✅ | check-game-i18n.js 105/105（键对称 + {x} 占位符一致） |
| D1 时间线 | ✅ | 可点击 36→**60/60**，目标 id 全过存在性断言 |
| D2 测验 | ✅ | 题库 60→**100**（4×25）+ 错题本（连对 3 次移出），练习模式不计段位 |
| D3 每日池 | ✅ | 谜题 7→**31**（改按日种子轮换，31 天验证零重复）、冷知识 10→**50**；24 道机械谜题全部人工验算 |
| D4 地图 | ✅ | 事件 24→**40**，链接目标全部核对注册表 |
| D5 知识库 | ✅ | 术语 140→**150**、名言 30→**50**（14 位人物、来源可考）、11 章书单各 +1 本 2019-2023 真书 |
| D6 Farnsworth | ✅ | morse-listen 第 4 档速度：三字母组 + 字间 7 单位间隔；引擎 playGroup 重构带元素回调 |
| D7 分享链接 | ✅ | workshop `?c=<base64url>` 自动载入破解面板；算法白名单 + 双重长度钳制 + try/catch |
| D8 月度足迹 | ✅ | shell.submitScore 记 `arcade_playhist`；档案页近 12 个月热力条，无数据不渲染 |
| C1 manifest 截图 | ✅* | gen-screenshots.js 合成两张 640×360 品牌图 + manifest screenshots 字段 + SW bump v11；*部署后建议用真实截屏替换同名文件 |
| C2 dict 拆分 | ✅ | **已实施（2026-08-22 续轮）**：`stp.*.bio/.quote` + `sta.*.text` 共 244 条迁入懒加载字典 `core/i18n-archive.js`；people/artifacts 页同步加载，其他页面由 `Arcade.ensureArchive()` 在人物档案弹窗打开时按需注入；核心字典保留摘要键+占位默认实现优雅降级。**i18n-dict.js 210.6KB→135.5KB（-36%）**；check-knowledge/check-summary-runtime/check-home-keys/verify-artifacts-7/verify-content/scan-quotes/preflight 七个校验器已适配；再生成工具 `tools/split-dict.js` |
| C3 SW 核对器 | ✅ | tools/check-sw-assets.js：57 条预缓存全存在；纳入 qa-all |
| C4 defer 评估 | ✅ | 结论：shell 按序注入链正确性优先，defer 不动；维持现状 |

**回归门槛达成**：`npm run qa` 18/18 PASS · deep MAJOR 0/MED 0/MINOR 0/INFO 85（基线 157）· preflight 122 HTML 全过。
