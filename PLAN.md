# 🕹️ 破译 DECODE ARCADE · 项目文档与规划（PLAN.md）

一个纯前端的小游戏合集网站：原生 HTML/CSS/JavaScript，零构建、零依赖，打开即玩。

**以游戏还原人类加密解密的三千年历史**——一座「密码博物馆」：首页破译旅程画卷（11 时代时间轴）+ 编年史 + 人物志 + 密件册 + 游戏厅 + 我的档案，全局导航统一。

内置 **105 款小游戏**，街机霓虹暗黑风，最高纪录保存在浏览器 localStorage。

---

## 📱 移动端 App 化（PWA，2026-08 新增）

站点是完整 PWA，可「添加到主屏幕」后以独立窗口（standalone）运行，支持离线游玩：

| 能力 | 实现 |
|---|---|
| 安装清单 | `manifest.webmanifest`（standalone / 主题色 / 图标 / 快捷方式） |
| 离线缓存 | `sw.js` Service Worker：导航 network-first + 静态资源 cache-first，外壳预缓存，访问过的游戏离线可玩 |
| 图标 | `assets/icons/`（192 / 512 / maskable / apple-touch-icon），由 `tools/gen-icons.js` 生成 |
| 移动端底部 Tab 栏 | ≤760px 时 6 项导航固定底部（safe-area 适配刘海屏），顶部仅留快捷图标条 |
| 游戏全屏 | 游戏页顶栏 ⛶ 全屏按钮（iOS Safari 自动隐藏） |
| 触感反馈 | `navigator.vibrate` 随音效联动（快捷栏 🫨 开关，仅触屏设备显示） |
| 主题色联动 | 5 套主题切换时同步 `theme-color` meta 与 iOS 状态栏样式 |
| 安全区 | 全站 viewport 含 `viewport-fit=cover`（108 个 HTML 由工具批量同步） |

> 设计约定：**不主动弹出安装引导**——只在用户主动选择时提供安装能力。
> `file://` 本地打开时 SW 不注册（浏览器限制），部署到 http(s) 后自动生效。

---

## 🏛️ 站点结构（博物馆化）

> 全局导航：🏛️ 首页 · 📜 编年史 · 👤 人物志 · 📎 密件册 · 🎮 游戏厅 · 📊 我的档案

- **首页**（`index.html`）：破译旅程画卷——11 时代时间轴，每节点聚合故事/人物/密件/游戏；破译进度总览 + 继续破译（最近游玩）
- **游戏厅**（`games.html`）：105 款游戏，搜索 / 分类筛选 / 收藏 / 每日破译 / 最近游玩，游戏卡带「📜 史话 xN」编年史徽章
- **编年史**（`stories.html`）：11 章真实密码学史时间轴
- **人物志**（`people.html`）：13 位破译者档案卡
- **密件册**（`artifacts.html`）：通关游戏解锁 11 件历史密件
- **我的档案**（`stats.html`）：军衔 / 成就 / 进度 / 收藏家

## 🎮 游戏清单（105 款）

> 8 大分类按核心玩法切分；游戏厅支持分类筛选 + 搜索。

| 分类 | 游戏 |
|---|---|
| 密码破译 (39) | 猜词破译 · 凯撒解码 · 摩斯破译 · 大师密码 · 替换密码 · 维吉尼亚 · 摩斯长报文 · 二进制破译 · 打字破译 · 栅栏密码 · 仿射密码 · Base64 破译 · 摩斯听写 · 词频分析 · 恩尼格玛 · Playfair · 异或破译 · 破译战役 · ADFGVX · 密码侦探 · Bifid · 炸弹机 · 希尔密码机 · 破译工作室 · 密码地牢 · VENONA 双密复用 · JN-25 破译机 · 插线板反推 · Trifid 破译机 · 紫密破译机 · M-209 转轮密码机 · 洛伦兹破译机 · 密码制造者 · 找茬破译 · 培根密码机 · 阿特巴什 · 波利比奥斯方阵 · 尼希尔斯特 · 星条旗密码 |
| 逻辑谜题 (14) | 数独 · 数织 · 数回 · 岛屿连线 · 扫雷 · 点灯 · 方形分割 · 拼图填数 · 单词搜索 · 数字填色 · 24点 · 猜数字 · 连连看 · 绵羊三消 |
| 经典街机 (12) | 贪吃蛇 · 2048 · 俄罗斯方块 · 消消乐 · 西瓜合成 · 迷宫吃豆 · 恐龙快跑 · 青蛙过河 · 打砖块 · 小行星 · 弹珠消消 · 铁壁防线 |
| 空间解谜 (11) | 记忆翻牌 · 数字华容道 · 推箱子 · 汉诺塔 · 管道连接 · 电路连接 · 华容道 · 迷宫 · 切绳救星 · 桥梁搭建 · 冰壶 |
| 动作反应 (10) | 像素飞鸟 · 接物大作战 · 反应力测试 · 平台跳跃 · 节拍脉冲 · 弹射打靶 · 太空射击 · 轨道射击 · 地牢探险 · 弹幕射击 |
| 棋类对弈 (7) | 国际象棋AI · 跳棋AI · 五子棋 · 黑白棋 · 井字棋 · 四子棋 · 攻城棋 |
| 牌骰策略 (8) | 扑克对决 · 21点 · 快艇骰子 · 卡牌构筑 · 塔防 · 战棋对决 · 纸牌接龙 · 拉线占领 |
| 球类竞技 (4) | 台球 · 乒乓球 · 双人弹球 · 保龄球 |

旗舰款（全网独家深度复刻）：炸弹机 / 希尔密码机 / 破译工作室 / 密码地牢 / VENONA 双密复用 / JN-25 破译机 / 插线板反推 / Trifid / 紫密 / M-209 / 洛伦兹 / 密码制造者 / 培根密码机 / 找茬破译，以及国民品类 × 密码学的连连看、绵羊三消、纸牌接龙、铁壁防线、拉线占领、弹幕射击、弹珠消消、冰壶、保龄球等。

---

## 🚀 本地运行

纯静态站点，无需安装任何依赖：

- 方式一：直接双击 `index.html`（普通 script 加载，file:// 协议可正常运行；PWA/SW 需 http(s)）
- 方式二（推荐）：起一个本地静态服务器

```bash
python -m http.server 8000   # 或 npx serve .
```

然后访问 `http://localhost:8000`。手机真机调试：同一局域网访问电脑 IP（如 `http://192.168.x.x:8000`），或部署后直接体验。

## 📁 目录结构

```
├── index.html               # 游戏大厅（主页）
├── manifest.webmanifest     # PWA 安装清单
├── sw.js                    # Service Worker（离线缓存）
├── assets/
│   ├── css/                 # 设计系统（theme.css）+ 游戏页骨架（shell.css）
│   ├── fonts/               # 本地化像素字体（Press Start 2P + Fusion Pixel）
│   ├── icons/               # PWA 图标（tools/gen-icons.js 生成）
│   └── js/
│       ├── games.js         # 【游戏注册表】新增游戏只需加一条
│       ├── lobby.js         # 游戏厅渲染（搜索/分类/收藏/每日/最近）
│       ├── home.js          # 首页：旅程画卷 + 继续破译
│       ├── shell.js         # 游戏页统一顶栏（返回/史话/玩法/全屏/重开/BEST）+ 自动注入扩展
│       ├── stats.js         # 我的档案：生涯统计 + 成就系统
│       ├── rank.js          # 跨游戏军衔（完成一局 +2 XP / 破纪录 +5，8 级）
│       ├── plot.js          # 剧情互通存储（战役↔侦探↔大厅电报）
│       ├── pwa.js           # Service Worker 注册引导
│       └── core/            # storage(最高分) / input / loop / extras(音效特效设置教程) / music(8-bit BGM) / i18n*
├── tools/                   # 工程工具（零依赖 Node 脚本）
│   ├── gen-sitemap.js       # 从注册表自动生成 sitemap.xml（audit S13 配套）
│   ├── gen-icons.js         # 生成 PWA 像素风图标（PNG 编码器内置）
│   └── sync-head.js         # 批量同步全站 HTML 的 PWA meta / viewport / SW 注册
├── stats.html               # 我的档案页
├── sitemap.xml              # 站点地图（108 页，从注册表生成）
├── robots.txt               # 搜索引擎收录配置
└── games/<游戏id>/
    ├── index.html           # 游戏页（约 15 行样板）
    ├── <游戏id>.js          # 游戏逻辑
    └── <游戏id>-i18n.js     # 游戏内文案（gs.* 字典）
```

## 🛠 工具与质量门禁

```bash
node audit.js                 # 全站 13 项硬标准审计（含 S13 sitemap 同步）
node audit.js <gameId>        # 单款审计
node smoke.js                 # 全站 101 款冒烟（DOM/画布/音频加载 + 初始化 + 重开 + 一帧渲染）
node smoke.js zh|en           # 双语模式冒烟（占位符/缺键/渲染污染检测）
node smoke.js page [en]       # 站点页面冒烟（7 个内容页 + 404）
node tools/audit-deep.js      # 全站静态深度扫描（移动端触控/320px 溢出/定时器与监听器泄漏/i18n 键对称/硬编码中文/标签覆盖/版权清单）
node tools/gen-sitemap.js     # 新增游戏后重新生成 sitemap.xml
node tools/gen-icons.js       # 重新生成 PWA 图标（改动设计后）
node tools/sync-head.js       # 全站 HTML 头批量同步（幂等，可重复跑）
node tools/preflight.js       # 部署前资源完整性检查（109 HTML 引用无缺失 + 动态章节链接有效）
```

**audit.js 13 项硬标准**：S1 模板 / S2 教程 / S3 记分 / S4 重开 / S5 调味 / S6 响应式 / S7 注册表 / S8 语法 / S9 无障碍（禁 user-scalable=no）/ S10 SEO / S11 移动端 theme-color / S12 分类合法 / S13 sitemap 同步。

## ✅ 质量审查记录（2026-08）

101 款游戏完成「旗舰级综合审查 + 修复」：静态深度扫描（`tools/audit-deep.js`）+ 11 组 AI 逐款源码评审（101 张质量卡，见 `tools/report/game-cards-all.json`）+ 人工核验。**结论：4 款不可通关（detective/purple/fillomino/bridge）、2 处崩溃（roperescue/towerdefense）已全部修复；版权风险（mazedot 吃豆人）已改名「迷宫吃豆」并加免责声明；移动端 320px 溢出/触控目标/定时器泄漏/i18n 一致性等 ~70 项问题已修复；全站回归 audit + smoke（默认/zh/en/page）全绿。** 逐款明细见 `tools/report/quality-summary-2026-08-16.md`。

> 纸牌接龙每日一题：采用**构造式必胜牌局**（`K_buildSolvableDeal`）——按轮转顺序编排列与发牌堆，全程只需「列顶/废牌顶 → 基础堆」，花色按日种子置换，30 个日种子全部经独立贪心验证可解；替代随机洗牌（约 15-30% 概率不可解）。

## ⚡ 性能优化（2026-08 已实施）

全站同步优化，零构建定位不变，方案详见 `docs/perf-optimization.md`（S1–S7 + 字体子集 + 后台预取，已全部落地）。

| 项目 | 内容 | 收益 |
|---|---|---|
| 中文像素字体子集化 | Fusion Pixel 641KB → **54KB 站点字符集子集**（`fusion-pixel-site.woff2`，fontTools 子集，0 丢失） | 中文首访字体 -92% |
| S1 语言自适应 | `i18n.js` 无存储时按 `navigator.language` 探测默认语言（zh/en），手动切换后记忆 | 英文浏览器首访即英文界面 |
| S2 字体条件加载 | `theme.css` `html[lang="en"]` 字体栈去掉 Fusion Pixel + `sw.js` CORE_ASSETS 移除中文字体（CACHE v2） | **en 首访中文字体 0 下载** |
| S5 字体 preload | `sync-head.js` 全站注入：Press Start 2P 无条件 preload；Fusion Pixel 仅 zh 动态 preload | zh 首访 FOUT 更快 |
| S3 摘要字典下沉 | 时代/章节标题/一句话/人物全字段/密件全字段自 `i18n-story.js` 移入 `i18n-dict.js`；首页与游戏页不再加载 i18n-story.js（正文留内容页） | 首页 JS **-116KB**；**游戏页史话 tooltip en 双语修复** |
| S4 音乐延后 | `music.js` 首页/游戏页改为 `requestIdleCallback` 后动态注入（BGM 本需用户手势才发声） | 首屏 -29KB 解析 |
| 后台静默预取 | 新增 `assets/js/prefetch.js`：首页 load 后空闲时静默 fetch 内容页/游戏厅入 SW 缓存（省流模式自动跳过） | 后续访问秒开 |
| 验证工具 | `tools/check-summary-migration.js` / `tools/check-summary-runtime.js` / `tools/check-home-keys.js`（摘要键完整性）+ `tools/migrate-summary.js`（一次性迁移）+ `tools/preflight.js`（部署前资源完整性） | 防键遗漏回归 |

**布局一致性（2026-08 已实施）**：全站内容容器统一 **920px**（首页/游戏厅/编年史/单章/人物/密件/档案 + 游戏页 `#game-root` + 导航 `.anav` 对齐）；页面标题统一 22px（≤480px 17px）、品牌标题 32px（24px）、区块标题/卡片名 15px、副标题 13px、描述 12px、时代标签 10px、页脚 12px；hero 顶部间距统一 26px 16px 8px；`html { scrollbar-gutter: stable }` 消除滚动条出现/消失的横向跳动。检查工具：`tools/audit-fontsizes.js`。

**部署**：GitHub Pages 上传即用——CDN 自动 gzip/brotli 文本类型，woff2 已内部压缩，无需任何服务器配置；SW 部署后自动生效（二次访问离线可用）。

## 📚 内容扩充（2026-08 已实施）

| 项目 | 内容 | 结果 |
|---|---|---|
| 孤儿游戏进章节 | 65 款未进章节的游戏按玩法/主题映射进 11 章（每章 +3~8 款），每款补一句 `st.cN.gX` 关联文案（zh/en） | **游戏页「📜 史话」按钮 101/101 全覆盖**；每章游戏 6~15 款 |
| 历史重现挑战补齐 | 新增 5 个 mini-challenge：凯撒手算移位 / 肯迪频率 / 培根 A-B 解码 / ADFGVX 认知 / OTP 复用（复用现有 challenge 机制） | 挑战覆盖 **10/11 章** |
| 术语表 | 新增 `glossary.html`：40 个密码学术语分 6 组（基础/古典/破译/现代/人物/编码），中英对照；导航第 7 项 + sitemap + SW 预缓存 + page smoke 9/9 | 教育价值 + SEO |
| 史料来源 | 每章底部「史料来源」区块（11 章 × 2~3 条真实文献）+ 统一史料化演绎免责声明 | 内容严谨性 |
| 人物反链 + 冷知识 | 档案弹窗加「出没章节」反链（可直达章节）+ 13 人各 1 条冷知识（`stp.*.fact`） | 人物页深度 |
| 密件史料性质标注 | 11 件密件加 `nature` 标签：真实史料（罗塞塔/齐默尔曼/VENONA/香农）/ 史料化演绎 / 依史料重构 | 史料诚实性 |

验证工具：`tools/check-chapter-copy.js`（章节-游戏文案完整性）、`tools/list-orphans.js`（孤儿游戏检查）、`tools/add-chapter-game-copy.js`、`tools/add-people-facts.js`。

## 🎮 内容继续丰富（第二轮 2026-08 已实施）

| 项目 | 内容 | 结果 |
|---|---|---|
| 挑战 11/11 全覆盖 | c7 紫密新挑战（六元音+二十辅音双路共 26 字母认知题） | 挑战覆盖 **11/11 章** |
| 每日破译 7→9 | DAILY_IDS 补 `slitherlink`/`hashi`（已有 daily 却漏列）、`klondike`、`caesar`（新加 daily 模式：日种子固定密文 + markSolved） | 每日面板 9 款 |
| 游戏 tag 体系 | 101 款标注 `lvl`（easy 35/mid 47/hard 19）+ `time`（1min 10/5min 80/10min 11）；游戏厅加「难度/时长」双组筛选 chip（matchGame 过滤） | 可发现性大增 |
| 术语表×游戏联动 | 28 个术语加「🎮 玩一玩」直达链接（术语表变字典+入口） | 教育玩法闭环 |
| 正文术语 hover 注 | 章节正文 12 个关键术语自动高亮 + hover 释义（zh 界面；含 chip 保护防误伤） | 阅读体验升级 |
| 人物时间线 | people.html 加横向年代轴（解析 era 起始年定位，点击开档案） | 历史纵深感 |
| 史话 tooltip 增强 | 游戏页史话按钮 title 显示「章节标题 — 一句话」 | 游戏-史话衔接 |
| 术语表 40→63 | 追加 20 词（攻击模式/现代密码/哈希/图像隐写等），分类 6 组 | 63 词全覆盖 |
| 每章进阶书单 | 11 章各 2-3 本真实书目（Simon Singh/Andrew Hodges 等） | 深度延伸 |
| 原理演示器 | c1 凯撒（字母轮盘+实时偏移滑块）、c3 维吉尼亚（表）+ c5 Enigma（三转子转动动画） | 可视化教学 |

验证工具：`tools/add-game-tags.js`（tag 注入）、`tools/add-glossary-games.js`、`tools/add-glossary-20.js`、`tools/add-chapter-reads.js`、`tools/add-demo-field.js`、`tools/check-glossary.js`。

## 📚 知识库完善（2026-08 已实施）

| 项目 | 内容 | 结果 |
|---|---|---|
| **术语表 63→99** | 补 36 个术语：现代密码（AES/DES/Feistel 网络/SPN/ECC/量子密码/盐/IV/工作模式）、破译方法（差分/线性分析/彩虹表/侧信道/计时攻击/生日攻击）、协议与工程（TLS/PKI/CA/数字信封/密钥交换/端到端加密/零知识证明/同态加密/后量子密码/Kerckhoffs 原则）、基础（认证/完整性/不可否认性/混淆/扩散）、古典（Nihilist/双方形/Gronsfeld）；新增「🛡️ 协议与工程」分类组 | 99 词 / 7 组 |
| **人物 21→30** | 补 9 位：巴贝奇（维吉尼亚失名英雄）、克尔克霍夫斯（Kerckhoffs 原则）、贝拉索（多表密码真作者）、谢尔比乌斯（Enigma 发明人）、默克尔（公钥先驱/Merkle 树）、科克斯与埃利斯（GCHQ 隐秘先驱）、费斯泰尔（Feistel 网络/DES）、李维斯特（RSA 的 R/MD5）；全部 7 字段 zh/en + 章节关联 | 30 人全字段 |
| **密件 16→25** | 补 9 件：多拉贝拉密信/舒格伯勒碑文/黄道杀手密码/萨默顿人案/费斯托斯圆盘/线形文字 A/朗格朗格/混沌密码/黄道 340 密文；全字段 zh/en + nature 标注 | 25 件全字段 |

## 🧩 全站知识全面补全（2026-08 已实施 · G1-G8）

| 缺口 | 补全内容 | 结果 |
|---|---|---|
| **G1 章节冷知识** | 8/11 章补「💡 冷知识」卡（caesar/arab/bacon/bletchley/midway/purple/lorenz/venona），真实史实 + 趣味细节（凯撒偏移不固定、肯迪频率分析、维吉尼亚误名、韦尔奇曼对角线板、AF 陷阱、假想机、Colossus 保密 60 年、VENONA 密钥复用） | 11/11 章有冷知识 |
| **G2 章节演示器** | 补 4 个：罗塞塔三语对照 / 紫密双路置换 / VENONA 密钥复用抵消 / 熵与密钥长度滑块 | **11/11 章全演示器** |
| **G3 术语·人物机构组** | 补 11 词（NSA/GCHQ/NIST/Enigma 机/Bombe 机/Colossus 机/Room 40/VENONA 计划 + 已知明文/唯密文/OTP 重用等） | 术语 **110 词 / 7 组** |
| **G5 人物** | 补 4 位：诺克斯（Abwehr Enigma）、亚历山大（Hut 8 棋手）、伊丽莎白·弗里德曼（密码学第一夫人）、赫尔曼（Diffie-Hellman）——vigenere 档案原已有 | 人物 **34 位**全字段 |
| **G6 密件** | 补 4 件：Enigma 密钥本 / Cillies 操作员惰性密钥 / 黄道 13 字符密文 / Enigma M4 海军机 | 密件 **29 件**全字段 |
| **G7 时间线** | 补 1 节点（科克斯 1973 秘密 RSA）——其余 9 个建议节点与现有 47 节点同年代已覆盖 | 时间线 **48 节点** |
| **G8 游戏史话** | 验证 101/101 全进章节，无孤儿 | ✓ |

验证工具：`tools/check-knowledge.js`（人物/密件/术语完整性）、`tools/check-people-timeline.js`（34 人时间轴）、`tools/check-glossary.js`（110 词渲染）。

验证工具：`tools/check-knowledge.js`（人物/密件/术语完整性）、`tools/add-glossary-40.js`、`tools/add-people-9.js`、`tools/add-artifacts-9.js`、`tools/link-people9.js`。

## 🏆 「全网独树一帜」内容规划（2026-08 已实施）

| 项目 | 内容 | 结果 |
|---|---|---|
| **N1 破译工坊** | 新增 `workshop.html`：13 种算法（凯撒/仿射/替换/维吉尼亚/栅栏/Playfair/ADFGVX/培根/摩斯/异或/希尔/Base64/二进制）加密 + 自动破解（凯撒穷举/摩斯/培根/二进制/异或/Base64 自动识别） | **全网独家加密/破解二合一实验室** |
| **D1 密码史时间线** | 首页横向滚动全景时间线（47 节点，公元前 1900→2026），节点链接章节/游戏/人物/密件/工坊 | 可交互密码史地图 |
| **N3 隐藏密文彩蛋** | 全站 12 条递进难度密文藏于页脚，破解后在工坊提交答案；集齐解锁隐藏成就「密码猎人」 | 站内寻宝 ARG |
| **D2 人物 13→21** | 补 8 人：Vernam/Kasiski/Rejewski/Diffie/Shamir/Adleman/Driscoll/Trithemius（全字段 zh/en + 章节关联） | 人物谱更完整 |
| **D3 密件 11→16** | 补 5 件：伏尼契手稿/比尔密码/克里普托斯/苏格兰玛丽密信/培根-莎士比亚案 | 密码史传奇全覆盖 |
| **D4 演示器 3→7** | 补 Affine/Playfair/XOR/栅栏 4 个交互演示（滑块实时映射/方格/位流/锯齿） | 可视化教学 7/11 章 |
| **E1 四维互链** | 术语表 39 词加「📜 相关章节」反链（叠加已有 28 词游戏链接） | 知识图谱 |
| **E2 概念速览卡** | 每章标题下加「核心概念」卡（图标+一句话原理，zh/en） | 一眼懂本章 |
| **E3 21 天破译之旅** | 新增 `path.html`：21 天学习路径（每天 1 章 + 2 游戏 + 1 术语），可标记完成进度 | 从零到三千年 |

验证工具：`tools/verify-workshop.js`（13 算法往返+自动破解）、`tools/verify-eggs.js`（12 密文正确性）、`tools/check-timeline.js`（47 节点双语言）、`tools/inject-egg-hints.js`（页脚彩蛋注入）、`tools/add-people-8.js`、`tools/add-artifacts-5.js`、`tools/add-concepts3.js`、`tools/add-glossary-chapters.js`。

## 🎮 第四轮全面优化（A 互动玩法 / B 功能体验 / C 内容补充 / D 技术优化，2026-08 已实施）

| 组 | 项目 | 内容 | 结果 |
|---|---|---|---|
| A1 | 密码学测验场 | 新增 `quiz.html` + `quiz.js`：60 题分 4 级（入门/进阶/专家/大师）中英双语题库，每轮随机抽 10 题实时计分，答完评 8 级「密码学段位」写入本地，档案页展示 | 知识自测闭环 |
| A2 | 双人同屏竞速 | 新增 `duel.html` + `duel.js`：左右分屏（移动端上下），同一套 10 题竞速，P1 用 1/2/3/4 键、P2 用 7/8/9/0 键，按得分→用时定胜负，战绩累计 | 同屏对战 |
| A3 | 摩斯听音训练 | 新增 `morse-listen.html` + `morse-listen.js`：Web Audio 实时合成点划音，听音辨字母，三档速度，10 题一轮记录最佳 | 练耳功能 |
| A4 | 段位徽章墙 | 档案页新增「🛡️ 段位徽章墙」：测验段位 / 摩斯耳力 / 竞速决斗 三枚徽章（含未达成置灰态） | 成就可视化 |
| B1 | 存档导出/导入 | `save-manager.js`：导出全部 `arcade_*` 为 JSON（下载/复制备份码），粘贴或选文件恢复，可清空存档 | 换设备无忧 |
| B2 | 密信分享 | 工坊加密结果一键生成「算法+密钥+密文+站点」密信文本复制分享 | 传播入口 |
| B3 | 战绩分享 | 档案页一键生成「我的破译战绩」摘要（已玩/军衔/段位/每日/连破/彩蛋）复制分享 | 社交传播 |
| C1 | 每日破译 9→14 | `DAILY_IDS` 扩至 14：新增 llk/spotdiff/sectorsiege/sheep（已实现 daily 未启用）+ morse 补 daily 模式；成就描述动态化 | 每日题扩容 |
| C2 | 彩蛋 12→16 | 新增 e13-e16：quiz（维吉尼亚 QUIZ）/duel（Playfair DUEL）/morse-listen（摩斯）/path（栅栏 4），全部经 workshop 加密往返验证 | 寻宝扩容 |
| C3 | 工坊 13→15 算法 | 重写 Bifid（修复解密坐标错位）、Trifid（正确三层分块）并重新注册，verify-workshop 15 种算法往返全绿 | 算法补全 |
| C4 | 新游戏 4 款 | atbash（镜像替换）/ polybius（5×5 坐标）/ nihilist（坐标+密钥数字）/ starflag（星条符号 5 位码），全部带 daily 模式 + i18n + 章节关联 | 101→105 款 |
| D1 | 游戏页 SEO | 105 个游戏页注入语义化隐藏 h1 + 404 页补 h1；首页/游戏厅「101 款」文案同步 105 | 爬虫友好 |
| D2 | 护眼主题 | 新增第 6 套主题「夜读灯」：暗底暖橙低蓝光，对比度过 WCAG AA | 夜间体验 |
| D3 | 键盘无障碍 | 全站注入「跳到主内容」skip link（Tab 可聚焦），13 个根页面主容器加 `id="content"` 锚点 | 键盘可达 |
| D4 | PWA 更新通知 | sw.js 安装后 postMessage 通知页面，toast「新版本已就绪」点击后 SKIP_WAITING 激活刷新；toast 支持点击回调 | 更新感知 |
| D5 | 性能微优化 | prefetch 清单扩至 12 页 + quiz/morse 脚本，空闲预取秒开 | 首访提速 |

验证：`node audit.js`（105 款全绿）、`node smoke.js`（默认/zh/en 105/105 + page 14/14）、`node tools/audit-deep.js`（MAJOR 0 / MED 0 / MINOR 1 基线）、`node tools/preflight.js`（119 HTML / 1475 资源无 404）、`node tools/gen-sitemap.js`（118 URL）、`node tools/verify-workshop.js`、`node tools/verify-eggs.js`（16 密文全过）。

## 🔍 全站复查（2026-08 专项审查，5 组子代理 + 主代理修复）

对第四轮全部改动做专项审查（5 个只读子代理并行：新游戏质量 / 新页面交互 / 登记完整性 / 数字与 i18n / D 组与档案），共发现并修复 **24 个问题**：

| 级别 | 数量 | 关键项 |
|---|---|---|
| 高（5） | 修复 | ① quiz 题库 50→60 题（4×15，文案「60 题」与数据一致）；② 4 款新游戏缺 `g.*.t/.d` 入口键（游戏厅/顶栏/搜索显示裸键）→ 补 zh/en 8 条；③ morse-listen beep() 毫秒当秒用（听音不可用）→ dur/1000 换算；④ pwa.js toast 传 4 参（D4 更新点击失效）→ 改 3 参回调；⑤ zh 缺 share.recordSub 键 |
| 中（3） | 修复 | ① stats.html 等 12 页主容器标签被注入脚本破坏（`< id="content" div>`）→ 统一修复 + 修脚本；② morse-listen 首题双播；③ duel 卡死无超时 → 加 20s 兜底 |
| 低（16） | 修复 | duel lastIdx 串题/平局比耗时、sw.js 预缓存缺 save-manager.js、manifest/404/audit-deep/font-preview/extras 等「101」残留、artifacts「11 件」→29 件 + pageDesc 键、lobby 兜底数组、inject-egg-hints/gen-egg-ciphers 旧计数、quiz 全角冒号/重复题、duel 开始按钮 i18n、stats 剪贴板竞态/FileReader onerror、404 margin、shell.js 游戏页 skip link、extras 主题注释 |

新增复查工具：`tools/verify-quiz.js`（60 题结构+抽题+段位）、`tools/recheck-new-games.js`（4 款新游戏加密往返）、`tools/verify-game-keys.js`（105 款 g.* 键）、`tools/check-game-i18n.js`、`tools/verify-content-anchors.js`、`tools/fix-content-anchor.js`。
复查后全量回归：audit 105/105 · smoke 四模式 105/105 + page 14/14 · audit-deep MAJOR 0/MED 0/MINOR 1 · preflight 119 HTML 全通过 · verify-workshop/eggs/quiz/new-games 全绿。

## 🏆 第五轮全面优化（E 内容扩充 / F 互动深化 / G 教学强化 / H 全网独有 / I 质量打磨，2026-08 已实施）

| 组 | 项目 | 内容 | 结果 |
|---|---|---|---|
| E1 | 术语 110→140 | 子代理产出 30 条现代密码/攻击/协议词条（RC4/ChaCha20/GCM/HMAC/KDF/LWE/环签名/后量子等），全部带反链 | 知识库翻倍 |
| E2 | 人物 34→42 | 补 8 位：杰斐逊/惠斯通/毛博涅/亚德利/齐默尔曼(PGP)/施奈尔/达门/巴泽里，全字段 zh/en + 章节挂靠 | 人物谱更全 |
| E3 | 密件 29→36 | 补 7 件：库尔珀间谍圈/巴泽里圆筒/商业恩尼格玛/纳瓦霍密码/修道院密写/内战密码盘/ADFGVX 破译 | 密件馆更丰 |
| E4 | 彩蛋 16→20 | 新增 e17-e20：Bifid SPARTA→SCYTALE/Trifid→VOYNICH/ADFGVX ZIMMER→POLYBIUS/仿射 7,11→ORYCTO，密文全部 workshop 往返验证 | 寻宝扩容 |
| E5 | 时间线 48→60 | 补 12 节点：Alberti 密码盘/威尼斯密码局/杰斐逊转轮/莫尔斯电报/内战密码盘/Bazeries 筒/海军 Enigma/Zygalski 片/NSA/Lucifer/ECC/PGP | 史线更密 |
| F1 | 章节小测 | story.html 每章末尾 3 题快测（`chapter-quiz.js` 33 题中英双语），答对 ≥2 点亮「本章精通」 | 玩中学闭环 |
| F2 | 密码学世界地图 | 新增 `map.html` + `map.js`：SVG 世界地图 24 事件按真实经纬度标注，点击链章节/人物/游戏/密件/术语；键盘可达 | 全网独家地理视角 |
| F3 | 成就 +8 枚 | 测验大师/传说破译者/章节学霸/编年史全通/摩斯听风者/决斗冠军/术语达人/时间旅人（含 glossary 阅读计数、时间线浏览标记） | 成就墙 25 枚 |
| F4 | 破译足迹 | 档案页新增「🧭 破译足迹」卡：章节精通/术语浏览/地图事件三指标 | 知识区可视化 |
| G1 | 易混辨析卡 | 术语表顶部 5 组对比卡：加密vs编码/对称vs非对称/替换vs换位/哈希vs加密/流vs分组 | 一眼分清 |
| G2 | 21 天路径升级 | path.html 每天卡加「🧠 自测」链接（quiz.html） | 路径自测闭环 |
| G3 | 冷知识翻倍 | 11 章各新增 1 条独立冷知识（`<id>.facts2`，子代理产出，含 ROT13/巴贝奇破维吉尼亚/气象暗号/ENORMOZ/GCHQ 等） | 章节冷知识 22 条 |
| H1 | 工坊破解升级 | autoCrack 新增：仿射全空间穷举（12×26）、Playfair 8 常用密钥试钥、Kasiski 密钥长估计+逐列频率分析（长文本可完整还原密钥），验证脚本 `verify-crack-upgrade.js` | 破解能力大增 |
| H2 | 密码机博物馆 | 新增 `machine.html` + `machine.js`：Enigma/Bombe/M-209/紫密/洛伦兹 5 台机器的原理+历史+参数卡，均可一键进对应游戏 | 全网独家博物馆 |
| H3 | 今日密码 | 首页新增「📅 今日密码」卡片：按星期几轮换 7 个谜题 + 日期种子轮换 10 条冷知识，可点开谜底 | 每日新意 |
| H4 | 密码学名言墙 | 新增 `quotes.html`：30 条密码学家/破译者名言（中英对照），按 9 主题筛选（子代理产出） | 名言收藏页 |
| I1 | 文案润色 | 新增 i18n 键 zh/en 对称性全查（11 键双份）+ quiz「60 题」等计数核对 | 文案一致 |
| I2 | 性能 | prefetch 清单扩至 15 页 + machine/quotes 脚本；sw.js 预缓存 17 页全覆盖 | 秒开 |
| I3 | 兼容性 | SVG 事件点补 tabindex/role/aria + Enter/Space 键盘触发（map.html） | 键盘可达 |
| I4 | 可访问性 | 新页面（map/machine/quotes）交互元素全部原生 button/g + aria | WCAG 友好 |
| I5 | 边缘路径 | 每日跨日（dayStr 按天分键）、彩蛋重复提交（isNew 判定）、存档损坏恢复（importJSON error 分支）复核 | 健壮 |

新增工具：`tools/verify-crack-upgrade.js`（autoCrack 新能力）、`tools/verify-machine.js`（博物馆数据）、`tools/inject-glossary-30.js`/`inject-people-8.js`/`inject-artifacts-7.js`/`inject-funfacts-11.js`/`inject-quotes.js`（内容注入）、`tools/check-r5-i18n.js`（第五轮键对称）、`tools/scan-quotes.js`（注入引号安全）。
全量回归：audit 105/105 · smoke 四模式 105/105 + page 17/17 · audit-deep MAJOR 0/MED 0/MINOR 1 · preflight 全通过 · verify-workshop/eggs(20)/glossary(140 真实执行)/machine/crack-upgrade 全绿。

## 🚀 第四期 Phase A：第 12 章「量子转折点」（2026-08-23 已实施）

> 按 `docs/improvement-plan-4.md` 执行；终态回归 `node tools/qa-all.js` **20/20 PASS**。

| 组 | 内容 | 结果 |
|---|---|---|
| A1 | 新章 `quantum`（c11）：Wiesner 拒稿手稿→BB84→Shor/Grover→先存后解→NIST 格密码标准，正文 zh/en + 概念卡 + 冷知识×2 + 史料/书单 + tldr/prereq + c10 下章预告钩子 | 叙事终点推进至量子时代 |
| A2 | 人物 +5：威斯纳/贝内特/布拉萨德/秀尔/格罗弗，全字段 zh/en（含 bio/quote/fact） | 人物 42→**47** |
| A3 | 密件 +3：量子钞票备忘（real）/ BB84 会议摘要（real）/ FIPS 203 公告（dramatized），全字段 | 密件 36→**39** |
| A4 | 时间线 +8 节点（1970 威斯纳 → 1984 BB84 → 1994 Shor → 1996 Grover → 2016 NIST 征集 → 2017 墨子号 → 2022 选定四算法 → 2024 FIPS 发布），双语可点 | 时间线 60→**68** |
| A5 | 术语 +8：BB84/QKD/Shor/Grover/格密码/Kyber(ML-KEM)/Dilithium(ML-DSA)/先存后解，全部带章节反链、部分带游戏链接 | 术语 152→**160** |
| A6 | 第 106 款游戏 `bb84`（旗舰标准）：扮演 Bob 选基测量光子→筛选密钥→抽样比对→判定 Eve；忠实 BB84 物理（错基≈25% 误码指纹）；键盘可达 + BEST(max/Pts) + 重开 + gs.* 双语 | audit S1-S13 全绿 · 真浏览器三局全结局验证 |
| A7 | 章节配套：BB84 交互演示器（可开关 Eve 观察误码率）+ QBER 章末挑战（答 25%）+ 章末小测 3 题 + 测验题库 +10 题 | 测验 100→**110 题** |
| 集成 | 解锁链 modern→quantum；**CODEBREAKER 保护**（最终密语仍属前 11 章，finalUnlocked/renderFinal 按有信章计数渲染）；12 章计数全站同步（stories meta ×4 / 成就文案 / smoke 断言）；verify-content 扩展（12 章+14 密件）；sitemap 122 URL；SW 缓存 v14 | 无回归 |

回归：qa-all **20/20** · audit 106/106 · smoke 默认/zh/en 106/106 + page 17/17 · preflight 123 HTML/2275 资源 · 真浏览器验证 quantum 章 zh/en 渲染、演示器交互、bb84 三局完整对局与 BEST 持久化。

## ➕ 新增一款游戏

1. 复制任意 `games/xxx/` 目录，改名为新游戏 id
2. 修改 `index.html` 中的 title、`data-game-id`、`data-game-title`、记分模式
3. 在 `assets/js/games.js` 的数组里加一条注册项
4. 大厅卡片、分类分组、最高分徽章自动出现；重跑 `node tools/gen-sitemap.js` 同步 sitemap

提交前必跑：`node audit.js <gameId>` + `node smoke.js`。

## 📐 技术要点

- 无框架无构建：普通 `<script>` + 全局命名空间 `window.Arcade`
- 统一顶栏由 `shell.js` 运行时注入（document.write 已于 2026-08 替换为按序 DOM 注入）
- 最高分：`localStorage`，key 规范 `arcade_best_{gameId}`，支持高分/低分（计时类）两种模式
- 游戏循环：固定步长 rAF，页面切后台自动暂停防跳帧
- 移动端：触屏滑动 / 虚拟方向键 / 拖动全面适配 + 底部 Tab 栏 + 全屏 + 触感
- 质量基座：全局音效/粒子特效/设置面板（`extras.js`），所有游戏接入教程步骤 + 语义化调味反馈
- 生成式玩法：数独/扫雷/迷宫/管道/方形分割/单词搜索等均为程序化生成并验证必可解
- vs AI 类均提供 简单/中等/困难 三档强度；棋牌类 AI 用 minimax/贪心实现

## 🚀 第六轮：质量与内容双升级（2026-08-22 已实施）

> 全程按 `docs/improvement-plan.md` 执行；终态回归 `npm run qa` 18/18 PASS。

| 组 | 内容 | 结果 |
|---|---|---|
| 安全 | 搜索参数 `?q=` 不再进 innerHTML 模板（escapeHtml 工具 + DOM 属性赋值 + 长度钳制）+ `scan-innerhtml.js` 插值审计 | XSS 脚枪清除 |
| 记分 | BEST_UNITS 补齐 105/105（分/步/次/题/筹码/击破/胜）；修复 enigma 轰炸小游戏污染 min 最佳记录 | 徽章全部带单位 |
| 触屏 | typecode 屏幕键盘（pointerdown，触屏默认展开）；deep **MAJOR 0 / MED 0 / MINOR 0** | 三零基线 |
| 无障碍 | theme/shell CSS `prefers-reduced-motion` 全局支持 | 减动效生效 |
| i18n | purple/m209/tank/paddle2p 硬编码中文清零；check-game-i18n 扩展 105 款全量对称+占位符校验 | 门禁盲区消除 |
| 工程化 | package.json + `npm run qa`（18 门禁聚合）；README.md；36 个一次性脚本归档 tools/oneoff/；新增 check-sw-assets / check-ghpages / scan-innerhtml | 一键质检 13s |
| 内容 | 时间线可点击 60/60；测验 100 题+错题本；每日谜题 31 条月内不重复+冷知识 50；地图 40 事件；术语 150（内容评审后去重至 144 唯一词条）、名言 50、11 章书单各 +1 近作；摩斯 Farnsworth 档；工坊分享链接（安全解析）；档案页 12 个月热力条 | 内容深度全面升级 |
| PWA | manifest screenshots ×2（gen-screenshots.js 合成，部署后可换真图）+ SW 缓存 v12 | 安装弹窗更丰富 |
| C2 字典拆分 | 人物传记/引言与密件全文 244 条迁入懒加载 `i18n-archive.js`（内容页同步加载、其余页面档案弹窗按需注入、核心字典占位降级）；**i18n-dict.js 210.6→135.5KB（-36%）**，7 个校验器同步适配 | 游戏页/首屏字典体积 -36% |

## 🚀 第二期改进（improvement-plan-2 · 2026-08-22 已实施）

> 20/20 门禁全绿。明细见 `docs/improvement-plan-2.md` 第八节实施记录。

| 组 | 内容 | 结果 |
|---|---|---|
| 工具修正 | verify-content 改校验 lvl/time 合法值；死键审计转硬门禁（第 20 项）；preflight 修复锚点链接误报 | 门禁更准 |
| 主题 | 新增 auto 档并设为默认：matchMedia 跟随系统深浅色实时切换，老用户手动选择保留 | 感知最强 |
| 错题本 | 档案页错题直达卡（0 时隐藏）+ quiz.html#wrong 深链进练习模式 | 闭环可见 |
| 健壮性 | storage 写失败置位 → 会话内一次性「空间不足」toast | 隐私模式友好 |
| 移动端 | M1×71 分级报告（tools/report/m1-tiering.md）：全部点按即玩法，blocks/sokoban 已有屏幕控件——零改动结论 | 有据可依 |
| 代码评审补充 | a-f 批 33 款：A15/B16/C2。blocks 竞速记分方向反转 + catapult 剩余石数 min 方向反转 → 已修；GAME_RESTART 未复位 paused ×8 → 已修；DPR 缺失 ×12 → 已修 | 全站 105 款评审完毕 |
| 评估归档 | CSP 不启用 / g.* 下沉不做（docs/eval-csp-and-dict.md）；CI 工作流文件就绪（上传 GitHub 即生效） | 决策留痕 |

## 🚀 第三轮：深度评审与叙事升级（2026-08-22 · 全部完成）

| 组 | 内容 | 结果 |
|---|---|---|
| 旗舰评审 | 四代理并行深读 105 款源码（90 款已出：A32/B35/C5） | C 级 5 处 MAJOR 全修复 |
| 硬伤修复 | enigma/playfair/xor 挑战模式 `mode` 未定义卡死；poker 回合不重发+底池累积刷分；roperescue 分数 NaN；xor 错误提示泄露明文 | 全部修复 |
| MINOR×20 | 答题竞态×4 / 状态复位×7 / 计时反馈×4 / 每日语义×3（数独全球同题）/ 个例×5（typecode 大小写等） | 全部修复 |
| 内容·史实 | 11 处硬伤订正（RSA 命名/ADFGVX 时间线/齐默尔曼日期/Tutte 归属/罗塞塔岩性/Painvin 全链统一/vigenere 去重等） | 已修订并回归 |
| 内容·词林 | 每日谜题答案错误修复（Atbash WVXLWV）；名言归属×2（Schneier/Hughes）；冷知识硬伤×2（Enigma 数学/Voynich 文字）；词源自相矛盾消除；术语表去重 150→144 | 已修订并回归 |
| 内容·文案 | 53 条「硬凑隐喻」关联文案改写为轻量时代彩蛋（含数独来源纠错） | 已落地 |
| 叙事 | 首页首章解锁（新访客不再全🔒）；path 21/22 天矛盾修复；四处断桥正文桥句（c1/c5/c6/c7 zh/en）+ 十章「下章预告」钩子渲染；c10 量子收束句 | 已落地并真浏览器验证 |
| 性能 | 17 款 canvas 高分屏 DPR 修复（共享 Arcade.hiDPI helper） | 高分屏清晰化 |

**终态回归**：静态门禁 20/20 · 真浏览器三引擎 **549 用例全过 EXIT=0**（含游玩探针 105 与 320px 溢出扫描 121）。

## 🚀 第四期 Phase B：东方密码内容线（2026-08-23 已实施）

> 不新增章节，以跨内容注入补齐文明覆盖面；回归 qa-all **20/20 PASS**。

| 组 | 内容 | 结果 |
|---|---|---|
| B1 | 时间线 +5：周初阴符（前 1000）/《六韬》阴书（前 400）/《武经总要》字验（1044）/ 戚继光反切码（1560）/《万川集海》忍术密法（1676），双语可点 | 时间线 68→**73** |
| B2 | 地图 +4：镐京（阴符阴书）/ 汴梁（字验）/ 台州（反切码）/ 京都（忍术秘传），全字段 desc | 地图 40→**44** |
| B3 | 术语 +6：阴符/阴书/字验/反切码/忍术隐语/变体假名隐写，带章节反链、部分挂游戏 | 术语 →**158** |
| B4 | 正文桥段：c1 凯撒章与 c2 阿拉伯章各加「同时期的东方」对照段（zh/en） | 文明双线叙事 |
| B5 | 密件 +2：字验军符册 / 反切码注本（均 reconstructed 依史料重构），desc+text 全字段 | 密件 39→**41** |
| B6 | 冷知识：c0/c1 facts2 追加东方句（甲骨文释读进度 / 阴符八法）；修复 stories.html CH_YEAR 缺 quantum 排序回退 bug | 编年史排序修正 |

回归：qa-all **20/20** · check-knowledge（47 人/41 件全字段）· check-timeline（73 节点双语可点）· 真浏览器验证时间线东方节点、地图事件、术语渲染、c1/c2 桥段与 facts2、quantum 章卡排序。

## 🎮 第四期 Phase C+D2：游戏精品补充与互链审计（2026-08-23 已实施）

> 遵循「旗舰级完美质量单一标准」：本期落地 2 款新游戏（Solitaire/Pontifex 因需忠实纸牌动画，留待专项）；终态 qa-all **21/21 PASS**（新增第 21 项门禁 linkdensity）。

| 组 | 内容 | 结果 |
|---|---|---|
| C1 | 第 107 款游戏 `autokey`：维吉尼亚进阶——密钥流=引子+明文自身，链式推演提示 + 提示计分 + 每日模式 | 工坊同步注册第 16 算法（往返验证） |
| C2 | 第 108 款游戏 `hashlab` 哈希雪崩实验室：内置纯 JS SHA-256（FIPS 180-4），自由台实时 256 位指纹网格 + 随机翻位雪崩观测 + 5 轮预测挑战；SHA-256 经 abc/empty/hello world 标准向量验证 | 教育向非对抗玩法 |
| C3 | 章节挂靠：autokey→c3 文艺复兴（g8）、hashlab→c10 现代（g14），末位追加零移位 | check-chapter-copy 全绿 |
| D2 | `tools/check-link-density.js`：统计 108 款游戏的章节/地图/时间线/术语四向互链密度 + 孤联清单 + 死链门禁，纳入 qa-all | 孤联清零、引用全有效 |

**事故与恢复记录**：期间一次 PowerShell 编码事故曾损坏 i18n-dict.js（无版本控制）。经用户提供出事前备份 + 本会话增量重放脚本（`tools/oneoff/replay-phase4-dict.js`）完整恢复，并顺带修复 stories.html CH_YEAR 缺 quantum 排序回退。教训固化：**所有批量写文件一律走 Node 脚本（UTF-8 无 BOM），禁止 PowerShell 中文 Replace 直写**。

回归：qa-all **21/21** · audit 108/108 · smoke 默认/zh/en 108/108 + page 17/17 · sitemap 124 URL · SW 缓存 v15 · SHA-256 标准向量 + 真浏览器对局验证。

## 🔍 第四期全站复查（2026-08-23 · 3 只读子代理并行 + 主代理修复）

对第四期 A/B/C 全部改动做专项审查，共发现并修复 **24 处问题**：

| 级别 | 数量 | 关键项 |
|---|---|---|
| P0 | 1 | path.html 封顶逻辑：12 章动态化后产生不计进度的 DAY22 孤儿卡 → 改为 **12 章 × 2 天 = 24 天**口径（标题/meta/dict/home.path/e16 蛋文案八处同步），进度统计动态化，TERM_MAP 补 quantum→BB84 |
| P1 | ~15 | 「密钥字母」分母三处误用章节数 12 → 新增 stories.letterTotal()；成就 call 阈值 >=11 → 动态 STORIES.length；st.pageDesc/artifacts.pageDesc 运行时覆写 meta 的旧数字（11 章/11 件）→ 41 件/12 章统一；105 款×12 处 meta→108；quiz 60题/map 40事件/glossary 150→158/err.sub/workshop.sub 15种算法→16；glossary CH_IDS 补 quantum；DUP_STORY 补 quantum 去重；bb84 连按崩溃守卫 + autokey 收尾定时器纳管 + hashlab 挑战按钮无文字/基线污染/pos 差一位 |
| P2 | ~8 | bb84 tut4「单局/累计」口径、progress「本局→总分」、verdictQ 死键启用、arcade_bb84_done 死写入删除、autokey BEST_UNITS Solved→Pts + 入列 DAILY_IDS、hashlab 控制字符重掷、home.js 死变量(cap 11)、stats toast 成就中文名→字典键、corrupted 文件删除、placeholder/静态链接挂 i18n（save.phIn/workshop.decPh/eggPh/glossary.goWorkshop/workshop.morseLink/stats.toChronicle 六组新键）、st.finalLocked「每章都有密信」措辞、qber 挑战专用标签 st.chQberLabel |

已知遗留（沿袭既有模式，本轮明确不扩）：workshop 算法下拉/keyLabel/autoCrack 提示的 EN 泄漏（全工坊 i18n 化属独立专项）；story.html 章节挑战题干与演示器标签中文直出（既有豁免模式）；lockedByRank 为无消费死字段（modern 时代即如此）。

回归：qa-all **21/21** · smoke 四模式 108/108+17/17 · 真浏览器验证 path 24 卡/quantum DAY23-24/BB84 术语链接/stories 徽章 0/11/meta 12 章/bb84 连按 30 次零报错/hashlab 按钮文字。

## 📚 第四期 Phase D1+D4：分层 UI 与名言墙（2026-08-23 已实施）

| 组 | 内容 | 结果 |
|---|---|---|
| D4 | 名言墙 50→60：新增爱伦·坡（1841 破译豪言）/史汀生（1929「绅士不读他人信件」）/孙武/商博良「我拿到了！」/齐默尔曼（1991）/休斯宣言/图灵/肯迪频率分析原典/富兰克林/斯诺登，全部真实可考、双语 | 名言 **60 条** |
| D1 | 核心/彩蛋分层：STORIES 每章新增 `core` 数组标注核心密码局；story.html 游戏区分「🔐 核心密码局 / 🎲 时代彩蛋」两组展示（全核心或全彩蛋时保持单组）；gN 文案键零移位 | 叙事评审 Top4 落地 |

回归：qa-all 21/21 · quotes 页真浏览器验证 60 条与新增作者渲染 · caesar 双分组 / quantum 单组确认。

**第四期收尾状态**：A/B/C(2款)/D1/D2/D3/D4 已落地；剩余两项明确转入下期——① Solitaire/Pontifex 旗舰游戏（需忠实纸牌动画的专项开发）；② D5 i18n-dict 二期下沉（lobby/stats 专用键懒加载）。workshop 下拉/keyLabel/autoCrack 提示的 EN 泄漏为既有模式，工坊整体 i18n 化一并列入下期。

## 🃏 第四期收官：第 109 款游戏「纸牌密码」（Solitaire/Pontifex，2026-08-23 已实施）

> Phase C 唯一延期项的专项落地；终态 qa-all **21/21 PASS**。

| 项 | 内容 |
|---|---|
| 算法 | 忠实实现 Bruce Schneier 的 Solitaire 手工流密码（《编码宝典》Pontifex 原型）：A/B 双王移位（越顶回卷）→ 三切 → 底牌计数切 → 顶牌定位出牌；王不出牌重跑；牌值 >26 减 26 得字母。步进函数经 8 项单元对拍全过 |
| 玩法 | 每题展示完整规程日志（每轮四步+出牌结果），密文−密钥还原情报单词；3 题一轮，计分 max（答对×30−提示×10），BEST 单位 Pts |
| 集成 | c10 modern 章 games 末位追加 + st.c10.g15 文案；games.js/BEST_UNITS/sitemap(125 URL)/SW v16 |

回归：audit 109/109 · smoke 四模式 109/109+17/17 · qa-all 21/21 · 真浏览器三轮对局零报错 + GAME_RESTART 复位验证。**第四期至此全部收官**；遗留项仅剩 D5 dict 二期下沉与工坊 EN 整体 i18n 化（已列入下期路线图）。

## 🔧 第四期补完：工坊整体 i18n 化（2026-08-23 已实施）

> 路线图遗留项清零；qa-all **21/21 PASS** + 真浏览器 zh/en 双语验证。

| 项 | 内容 |
|---|---|
| ALGOS 双语注册 | 16 条算法全部携带 `enName`（下拉项）与 `keyEn`（密钥标签），workshop.html 下拉与标签按界面语言取值 |
| autoCrack 双语 | 4 处中文提示（Hex 无匹配/偏移 0 注记/未自动识别/无法识别格式）+ 希尔 ERR 串改 `L(zh,en)` 助手双语输出 |
| 破解示例 chips | 凯撒/摩斯/培根/二进制/异或标签按语言渲染 |

验证：en 界面下拉「Caesar Cipher」/ 标签「Key word」/ 破解提示全英文 ✓ · zh 界面原样 ✓ · verify-workshop 往返全绿。**至此路线图 EN 泄漏清零**。

## 📦 第四期收官：D5 dict 二期下沉（2026-08-23 已实施）

> 路线图最后一项清零；qa-all **21/21 PASS** + 真浏览器 zh/en × 8 页本地化全过。

| 项 | 内容 |
|---|---|
| 键级消费方扫描 | `tools/oneoff/d5-analyze.js`：776 键逐一判定消费方；游戏页依赖链（shell/rank/extras/plot/stories/pwa）字面量强制保留核心 |
| 迁出 | 80 个「仅根页面消费」长文案键 → 新文件 `core/i18n-ui.js`（10KB，17 个根页面在 i18n-dict.js 后加载）；109 个游戏页不再下载这部分 |
| 边角修复 | 多键对象行按对拆分迁移（防吞键）；无 CJK 的 zh 值（stats.of/err.code）误判边角手动归位；check-i18n-usage 校验器纳入 ui.js 定义源 |

结果：i18n-dict.js **152.5KB → 143.5KB**（-9KB），叠加此前 C2 一期下沉累计 -43%；游戏页首访字典传输减少。**第四期路线图全部清零**。

## ⚡ plan-3 P3 补完：性能实测基线（2026-08-23 已实施）

`tools/perf-probe.js`（Playwright）：19 页采样（16 根页面 + 3 款游戏页）采集 FCP/DCL/load/传输体积 → `tools/report/perf-baseline.json`。

**基线结论**：本地无节流下全部根页面 **FCP ≤ 408ms**（最慢 index 408ms / machine 116ms 最快），游戏页 FCP ≈ 130-150ms，单页传输 55-280KB——与 perf-optimization.md 的「多数页面 FCP < 1s、瓶颈在字体与字典」预判一致，且 D5 下沉后字典已减重。后续任何性能改动以此 JSON 为前后对照。

## ♿ plan-3 P4.1 补完：浮层焦点管理（2026-08-23 已实施）

`core/extras.js` 新增 `makeAccessible(overlay)` 通用助手，接入教程与人物档案两类浮层：
- **Esc 关闭**（capture 级监听，关闭后解绑）
- **焦点入浮层**（打开后聚焦首个可交互元素，关闭后归还原触发点）
- **Tab/Shift+Tab 圈定**（焦点循环不出浮层）

验证：真浏览器 Esc 关闭 / 焦点进入 / Tab 循环 / 档案弹窗 Esc 全过 · qa-all **21/21 PASS**。

## 🚀 第五期开篇：国密体系 + 工作模式实验室（2026-08-23 已实施）

| 组 | 内容 | 结果 |
|---|---|---|
| 国密内容层 | 术语 +4（SM4/SM2/SM3/祖冲之 ZUC，GB 标准号齐全）· 时间线 +2（2006 SM 系列公布 / 2011 ZUC 入选 4G）· 地图 +2（北京国密标准 / 郑州祖冲之算法团队），全部带反链与双语 | 时间线 75 · 地图 **46** · 术语 **162** |
| 模式实验室 | workshop 第三 Tab「🧩 模式实验室」：程序化企鹅位图经玩具分组密码分别以 ECB/CBC 加密可视化——ECB 图案轮廓可见、CBC 雪崩抹平；换钥观察密文变化。度量实测：**ECB 结构一致率 100% vs CBC 47.9%（≈随机）** | 经典教学素材落地 |

回归：qa-all 21/21 · 真浏览器双语言渲染 + 度量断言全过。

## 🚀 第六期批次一：碰撞史正文 + 生日攻击观测台 + RSA 手算游戏（2026-08-24 已实施）

> 按 `docs/coverage-roadmap.md` 第六期规划执行；终态回归 qa-all **21/21 PASS** · 真浏览器 play-probe+games-all **220/220** · 批次一专项 e2e（`e2e/r6-batch1.spec.js`）**5/5**。

| # | 内容 | 结果 |
|---|---|---|
| #6 | modern 章（c10）正文增补 MD5/SHA-1 碰撞史段落：王小云 2004 MD5 碰撞 → 次年 SHA-1 攻击路径 → 2017 SHAttered（约 6500 CPU 年）→ 浏览器停用 SHA-1 与 SHA-256 迁移、「尚未被攻破≠安全证明」铁律，zh/en 双语 + [[wangxy]] 人物 chip | 正文叙事补齐 |
| #5 | hashlab 新增「🎂 生日攻击观测台」：16/20/24 位**截断指纹**并行碰撞搜索（每批 600 条分批执行）、实时统计（尝试数 / 唯一指纹 / √(π/2)·2^(n/2) 预期）、捕获 3 对自动暂停、切宽度即清零；「诚实声明」明示真实 SHA-256 需 ~2¹²⁸ 次不可行、SHA-1 生日界 2⁸⁰ vs SHAttered 实际 ~2⁶³（王小云密码分析红利） | 教学闭环 |
| #4 | 第 **110** 款游戏 `rsa`「RSA 小素数保险柜」：p,q∈{3,5,7,11,13} 五步手算链 n → φ → 三选一挑互素 e（偶数/共因子干扰项，必不合法）→ 试钥或扩展欧几里得求 d → 平方链+二进制提示加密字母；3 轮 ×（首答 +20+连击、整轮 +30、提示 −10）；daily 日种子出题（Park–Miller 种子逐轮派生） | 旗舰标准全过 |
| 集成 | 注册表/BEST_UNITS(Pts)/DAILY_IDS(20 款)/i18n-dict `g.rsa.*`/`st.c10.g16` 末位追加零移位/sitemap 126 URL/SW 缓存 v18；qa-all 门禁标签改动态计数（根治「×105」类陈旧残留） | 全绿 |

**意外收获（真浏览器对局验证揪出的全站潜在 bug）**：theme.css `.btn { display:inline-block }` 击穿 UA 的 `[hidden]{display:none}`——全站所有 `class="btn"` + `hidden` 的按钮实际一直可见可点（空标签幽灵按钮）。已加全局防御规则 `[hidden] { display:none !important; }` 根治；rsa/hashlab 受影响最直接（nextBtn 未隐藏时可跳轮/空点），修复后 rsa 完整三轮通关、hashlab 观测台交互均真浏览器逐步验证。

验证器沉淀：`tools/oneoff/verify-rsa-math.js`（3 万局数学对拍：e·d≡1、c^d 还原、干扰项必与 φ 有公因子、选项无重复）、`tools/oneoff/verify-bday.js`（截断指纹首碰撞量级对照）、`e2e/r6-batch1.spec.js`（rsa 完整对局+提示扣分+重开 / bday 碰撞捕获·清宽·清零 / modern 章碰撞史段落 zh/en 渲染与人物 chip）。

## 🗺️ 路线图（未来规划）

- [ ] 新增游戏遵循「旗舰级完美质量」单一标准，不设数量包袱
- [ ] 国密游戏化：SM4 真实现 + 测试向量对拍的小游戏（承接第五期内容层）
- [x] D5 i18n-dict 二期下沉：80 键迁入 core/i18n-ui.js，游戏页字典 -9KB（2026-08-23）
- [x] 工坊整体 i18n 化：算法下拉/keyLabel/autoCrack 提示的 EN 泄漏清零（2026-08-23）
- [x] 每日一题扩展至更多游戏；成就墙与 PWA 联动彩蛋（每日破译 19 款 · 彩蛋 20 枚已达成）
- [x] 游戏数据备份/迁移（localStorage → 导出文件）（save-manager 已上线）
- [ ] 多语言扩展（目前中英双语，字典结构支持扩充）
- [ ] i18n-dict 拆分第二阶段：lobby/stats 等页面专用键进一步下沉（边界见 improvement-plan C2 盘点）

---

© 2026 破译游戏 · POYI.NET · 纪录仅存本地 · 不上传任何数据 · 史料整理自公开信息仅供学习
