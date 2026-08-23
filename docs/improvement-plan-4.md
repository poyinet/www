# 破译 DECODE ARCADE · 改进计划 第四期（内容深化为主）

> 版本：2026-08-23 · 前置：一/二/三期已实施；deep 三零基线；e2e 549 用例全过
> 本期定位：**内容为主、工程为辅**——补齐叙事终点（量子/后量子）、补齐文明覆盖面（东方密码）、少量精品新游戏
> 原则约束不变：**零构建、零依赖运行时、纯静态、file:// 直开、双语、零遥测**

---

## 〇、现状盘点与缺口

| 维度 | 现状 | 缺口 |
|---|---|---|
| 章节 | 11 章，止于「modern」信息论与公钥（量子仅一句收束） | 术语库已有量子密码/LWE/后量子/环签名，时间线已有 ECC/PGP 节点，**但无承载章节** |
| 文明覆盖 | 欧洲/阿拉伯/美国/苏联主线完整 | **中国古代（阴符/字验/反切码）、日本战国·江户密码完全缺席** |
| 游戏 | 105 款，39 密码破译 | 经典未覆盖：Solitaire/Pontifex、Chaocipher、Autokey；教学向：哈希雪崩、DH 密钥交换 |
| 遗留 | improvement-plan-3 Phase 1 两项未落地 | 核心/休闲文案分层 UI、`check-link-density.js` |
| 路线图 | PLAN.md 开放项 | i18n-dict 拆分二期、第三语言 |

## 一、Phase A · 第 12 章「量子时代」（P0，约两天）

> 叙事终点从「RSA 问世」推进到「量子威胁与后量子迁移」，让术语/时间线的既有伏笔全部回收。

| # | 内容 | 明细 |
|---|---|---|
| A1 | 新章 `quantum`（c11） | 正文 zh/en：Shor 威胁 → BB84/QKD → NIST 后量子标准化（FIPS 203-205）；概念速览卡 + 冷知识 ×2 + 史料来源 ×2-3 + 书单 ×2 |
| A2 | 人物 +5 | Shor / Grover / Bennett / Brassard（BB84）/ Ajtai 或 Ding（格密码），全字段 zh/en + 章节挂靠 |
| A3 | 密件 +3 | Wiesner 量子钞票备忘（real）/ BB84 会议摘要（real）/ 后量子过渡公告（dramatized），nature 标注 |
| A4 | 时间线 +8 | 1970 Wiesner → 1984 BB84 → 1991 E91 → 1994 Shor → 1996 Grover → 2016 NIST 征集 → 2022 四算法选定 → 2024 FIPS 203-205 |
| A5 | 术语 +8 | BB84/QKD/Shor 算法/Grover 算法/Kyber/Dilithium/SIKE 失败事件/NIST PQC，带章节反链 |
| A6 | 旗舰游戏 1-2 款 | ① BB84 偏振基选择与窃听检测（可判输赢、记分）；② LWE 格噪声容错入门。按旗舰标准：daily 模式 + gs.* 双语 + 章节关联 + audit/smoke/play-probe 全过 |
| A7 | 演示器 + 挑战 | demo：量子密钥分发偏振可视化；challenge：BB84 截获发现率题；quiz 大师级 +10 题 |

验收：`check-knowledge` / `check-timeline` / `check-glossary` / `verify-content` 扩展后全绿 · sitemap 重生成 · smoke page 15/15 · e2e 回归 EXIT=0。

## 二、Phase B · 东方密码内容线（P1，约一天）

> 不新增章节（保护 11+1 时间轴结构），以跨内容注入补齐文明覆盖。

| # | 内容 | 明细 |
|---|---|---|
| B1 | 时间线 +5 | 公元前 11 世纪阴符（姜太公）/《六韬》阴书 / 宋《武经总要》字验 / 明戚继光反切码 / 日本戦国「乱破り」情报破译 |
| B2 | 地图 +4 | 镐京（阴符）/ 临淄 / 东京汴梁（字验）/ 京都 |
| B3 | 术语 +6 | 阴符/阴书/字验/反切码/乱破り/江户通词，中英对照 + 相关章节反链 |
| B4 | 正文桥段 | c1（凯撒）与 c2（阿拉伯）正文各加一段「同时期的东方」对照段（zh/en 各 ~80 字） |
| B5 | 密件 +2 | 字验兵符（reconstructed）/ 反切码注本（reconstructed），nature 标注 |
| B6 | 冷知识 | c0/c1 各 +1 条东方冷知识（facts 数组追加） |

验收：`check-timeline`（73 节点双语言）· `check-knowledge`（44 人/41 件）· 地图键盘可达回归。

## 三、Phase C · 游戏侧精品补充（P1-P2，每款一天起）

> 遵循路线图「旗舰级完美质量单一标准，不设数量包袱」：本期上限 3 款，宁缺毋滥。

| 候选 | 定位 | 备注 |
|---|---|---|
| Solitaire/Pontifex | 纸牌流密码实战 | 与 klondike 视觉差异化；挂靠 modern 章 |
| Autokey 自动密钥 | 维吉尼亚进阶教学 | 挂靠 bacon 章；工坊同步注册第 16 算法 |
| 哈希雪崩实验室 | 输入微变→输出剧变互动演示 | 教育向非对抗玩法；挂靠 modern 章 |

硬门槛：`node --check` · audit S1-S13 · smoke 四模式 · play-probe · gs.* 双语对称 · daily 模式 · 320px 无溢出 · BEST_UNITS 单位登记。

## 四、Phase D · 学习闭环与收尾（P2，约一天）

| # | 内容 | 说明 |
|---|---|---|
| D1 | 分层 UI 落地 | 承接三期 Phase 1：STORIES games 数组标注核心密码局/时代彩蛋两层，story.html + 首页 chips 同步视觉分组（只分层不改键，`check-chapter-copy` 保绿） |
| D2 | 互链密度审计 | 承接三期 Phase 1：`tools/check-link-density.js` 统计每游戏被章节/地图/时间线/术语引用数，输出孤联清单；纳入 qa-all |
| D3 | path.html 升级 | 21 天路径接入第 12 章 → 22 天（修复历史上 21/22 天矛盾的口径，本次为真实扩容） |
| D4 | 工坊/测验同步 | workshop 注册新算法（随 C）；quiz 题库 100→110（量子专题随 A7）；名言墙 50→60 |
| D5 | i18n-dict 二期下沉 | lobby/stats 专用键下沉至懒加载字典（边界沿用 eval-csp-and-dict 盘点），目标再 -20KB |

## 五、明确不做（延续既有否决）

❌ 第三语言（字典结构支持但翻译量过大，留待有真实需求时启动）· ❌ 为新章重构时间轴数据结构 · ❌ 引入任何构建步骤处理内容 · ❌ 全站 CSS 死规则清理 · ❌ 数量导向的批量加游戏

## 六、回归门槛

每 Phase 结束跑：`npm run qa`（≥18 门禁全绿）· `node smoke.js` ×4 模式 · `node tools/preflight.js` · e2e 全矩阵 EXIT=0；A/B 两阶段另跑 `gen-sitemap.js` 并人工过一遍新内容双语渲染。

总估算：A 两天 · B 一天 · C 每款一天（≤3 款）· D 一天。任意 Phase 可独立交付，均保持可部署状态。
