# 破译 DECODE ARCADE · 改进计划 第二期

> 版本：2026-08-22 · 前置：第一期（improvement-plan.md）21 项已全部实施并回归全绿
> 原则约束不变：**零构建、零依赖运行时、纯静态、file:// 直开、双语、零遥测**

---

## 〇、本轮新取证（全部为本会话实测）

| # | 发现 | 定性 |
|---|---|---|
| 1 | save-manager 为 `arcade_*` 前缀通配，新增键（月度足迹/错题本/enigma-raid）自动覆盖 | ✓ 无缺口 |
| 2 | map.html 已处理 term 类型链接（→ glossary.html） | ✓ 无缺口 |
| 3 | **verify-content.js 仍在校验已废弃的 `tag` 字段（=0），未校验现行 `lvl`/`time`** | 工具过时 |
| 4 | 触屏覆盖实测：onSwipe ×4 · createDPad ×8 · 键盘/onKeys ×51 → **约 40+ 款纯点按交互**；其中扫雷/翻牌/棋类点按合理，但动作/滑动类（如部分 platformer/shooter）存在真实提升空间 | 分级优化机会 |
| 5 | 主题机制为 `state.theme` + html class 切换（apply() 单点），加「跟随系统」只需 matchMedia + 监听器 | 可行性确认 |
| 6 | 拆分后核心字典剩余段均为 1-2KB 碎片（g 11KB 必需、stp/sta 摘要为搜索必需），再拆收益 <10KB | **C2 二阶段正式关闭** |
| 7 | i18n 双审计（引用 0 缺失 / 死键 0）已入 qa 门禁 | 已闭环 |

---

## 一、Phase 1 · 立即修（P0，≤半小时）

| 项 | 动作 | 验收 |
|---|---|---|
| A1 verify-content 字段更新 | `tag` 字段检查替换为 `lvl ∈ {easy,mid,hard}` 与 `time ∈ {1min,5min,10min}`，且值必须在注册表合法集内 | 105/105 输出 lvl/time 合法 |
| A2 死键审计纳入 qa | check-dict-dead.js 以「白名单外死键 = 0」为通过条件转为门禁（当前已是 0，防回归） | qa 20/20 |

## 二、Phase 2 · 功能体验（P1，约 1 天）

### B1 主题「跟随系统」档位
- `THEMES` 增 `auto`（设为默认初值，老用户保留手动选择）；apply() 时经 `matchMedia('(prefers-color-scheme: dark)')` 解析为 neon/daylight，并监听 change 实时切换；theme-color/status-bar 同步走现有 syncThemeColor。
- 快捷栏 🎨 循环按钮跳过 auto 或长按直达（实现取简）。
- **验收**：系统深浅切换 ≤1s 内主题联动；设置持久化后重开仍正确。

### B2 错题本可见性
- 档案页「段位徽章墙」区追加错题数小卡（复用 arcade_quiz_wrong，0 时隐藏）；点击直达 quiz.html 错题模式。
- **验收**：smoke page 通过；数字与 localStorage 一致。

### B3 storage 配额失败提示
- core/storage.js 写入 catch 处置位，extras.js 在下一次可交互时机一次性 toast「本机存储空间不足，纪录可能无法保存」（会话内只提示一次）。
- **验收**：模拟配额满场景触发一次提示；隐私模式不再反复打扰。

## 三、Phase 3 · 移动端触屏分级治理（P1–P2，约 1–2 天）

### C1 M1×71 动作类分级清单（先人工后动手）
- 对 71 款纯点按游戏逐款标注三类：`tap-合理`（扫雷/翻牌/棋牌/解谜）/ `建议补滑动`（贪吃蛇类已完成的同族、迷宫吃豆、恐龙快跑等连续操作类）/ `建议补虚拟方向键`。
- 输出名单位置：tools/report/m1-tiering.md。
- **预估**：真正需要动手的 ≈ 8–12 款；每款接入既有 `Arcade.input.onSwipe/createDPad` 各约 10–20 行。
- **验收**：清单内「建议补」项全部完成接入；audit-deep M1 中动作类清零（tap-合理类保留 INFO 并在报告中注明豁免理由）。
- **边界**：不改玩法手感参数；每款接入后单独试玩核验。

## 四、Phase 4 · 加固与评估报告（P2，约半天）

| 项 | 内容 | 产出 |
|---|---|---|
| D1 CSP 评估 | 静态站无后端、内联脚本密集，script-src 必须 unsafe-inline → 仅 img-src/style-src/object-src 有收紧意义；输出《是否启用的明确结论》写入 docs | 报告（可能结论=不启用，如实记录） |
| D2 游戏页 g.* 下沉终评 | 大厅搜索需要全量 g.*.t/.d；游戏页仅自身两条 → 若下沉需大厅懒加载合并包，收益 ~6KB gzip/页 | 结论归档（倾向不做） |
| D3 PWA 真截图 | 部署后浏览器实拍两张替换 assets/screenshots/*（一期遗留） | 替换文件 |

## 五、Phase 5 · 可选工程化（不默认启用）

- E1 `.github/workflows/qa.yml`：push 跑 `npm run qa`（纯 node 无安装步骤）。用户上传 GitHub 后即生效。
- E2 Playwright 真浏览器冒烟（仅 devDependency、独立 e2e/ 目录、不进部署产物）：弥补 smoke.js 模拟 DOM 无法覆盖的真实渲染路径（SW 注册/音频/布局溢出）。**列为可选，需你点头再引入。**

## 六、明确继续不做

- ❌ 框架/构建链/ESM 迁移 · ❌ 远程统计上报 · ❌ 服务端功能 · ❌ 凑数新游戏
- ❌ C2 二阶段字典碎片拆分（数据关闭）· ❌ 点按类游戏批量加手势（破坏合理交互）

## 七、执行顺序与回归

```
Phase 1 → Phase 2 → 回归 → Phase 3（每 4 款一回归）→ 回归 → Phase 4 报告 → 终回归
```
门槛延续：audit 105/105 · smoke 四模式全绿 · deep 三零 · preflight/ghpages/swassets 过 · i18n 双审计零缺失。
总估算：P1 半小时 · P2 约 1 天 · P3 约 1–2 天 · P4 约半天 · E 可选。

---

## 八、实施记录（2026-08-22 当日完成）

| 项 | 状态 | 说明 |
|---|---|---|
| A1 verify-content | ✅ | tag 废弃字段检查替换为 lvl/time 合法值校验（105/105 ✓），非法即非零退出 |
| A2 死键门禁化 | ✅ | check-dict-dead 候选>0 即失败，纳入 qa（第 20 项） |
| B1 跟随系统主题（历史：auto 档已于 2026-08-24 移除） | ✅ | THEMES 增 auto 并设为默认初值；resolve() 经 matchMedia 解析 neon/daylight，change 监听实时切换；theme-color/status-bar 同步；新增 theme.auto 标签。老用户已存手动主题不受影响 |
| B2 错题本可视化 | ✅ | 档案页徽章墙下错题直达卡（0 时隐藏，直读 localStorage 不引入 quiz.js）+ quiz.html#wrong 深链自动进入练习模式 |
| B3 配额提示 | ✅ | storage 写失败置位 → extras 启动 4s 后一次性 toast（settings.storageWarn），会话不打扰 |
| C1 分级清单 | ✅ 结论=零改动 | tools/report/m1-tiering.md：71 款全部「点按即玩法」，blocks/sokoban 已有屏幕控件、typecode 一期已补键盘——无需任何游戏改动 |
| D1 CSP 报告 | ✅ 结论=不启用 | docs/eval-csp-and-dict.md（内联密集使 unsafe-inline 不可避免，防护价值≈0；列出三个未来触发再评估条件） |
| D2 g.* 下沉终评 | ✅ 结论=不做 | 同文档（收益 ~6KB gzip vs 大厅搜索需全量+审计灵敏度下降） |
| D3 真截图 | ⏳ 待部署后 | 需线上环境实拍，文件名不变直接覆盖即可 |
| E1 CI 工作流 | ✅ 文件就绪 | .github/workflows/qa.yml（push/PR 跑 npm run qa） |
| E2 Playwright | ✅ 已批准并实施 + 二轮扩展 | 首版 30 用例（15 页面零控制台错误 / 10 款代表游戏 / SW·主题·离线）；扩展后 **324 用例 / 三引擎（Chromium·Firefox·WebKit）全绿 EXIT=0**。新增：① 105 款游戏全量加载矩阵 ② 真实交互流（测验答题/工坊往返/错题深链/地图点击）③ 320px 移动端溢出扫描（16 页面+105 游戏，自动元凶定位）④ 跨引擎核心页交叉 ⑤ 视觉回归基线 ×5。**累计修复 10 个真实缺陷**：一期三缺陷（shell 注入竞态→105 页依赖链静态化 / story A26 作用域 / vibrate 手势门控）+ 扩展期七缺陷（游戏厅网格 320px 两列锁死 / shell 标题缺 min-width:0 / 顶栏 380px 无换行 / ballpop·bowling 舞台 98vw 边距不足 / lightsout 固定 56px 格 / tactics 格宽公式漏计间隙 / xor·venona 等 12 处标签行无 wrap、人物时间轴长名 nowrap）。preflight 同步修复锚点误报；死键审计曾误删的 lobby.time*/diff* 六键经 E2E 暴露后已还原并加白名单 |
| D3 真截图 | ⏳ 待部署后 | 需线上环境实拍，文件名不变直接覆盖即可 |

**终态回归**：`npm run qa` **20/20 PASS** + `npm run e2e` **324/324 PASS · EXIT=0**（三引擎双线全绿）。
