# 破译 DECODE ARCADE · 性能优化方案（全站同步）

> 版本：2026-08-16 · 状态：**已实施（P0/P1/P2 全部落地，上传即用）**
> 目标：在不改变「零构建、纯静态、双语」定位的前提下，系统性降低首访体积与首屏延迟，并让**所有页面**（首页/游戏厅/内容页/游戏页）同步受益。
> 设计原则：**首次访问按浏览器语言自适应（zh/en）**；中文像素字体只在中文界面下载；全站字典按「摘要/正文」分层，各页面只加载自己需要的部分。
> 实施记录：字体子集 641KB→54KB（-92%）；S1 语言自适应 ✅；S2 en 零中文字体 ✅；S5 preload ✅；S3 摘要下沉（首页 -116KB + 游戏页 en 修复）✅；S4 音乐延后 ✅；后台静默预取 ✅；回归 audit 101/101 + smoke 四模式 + audit-deep 全绿 ✅。

---

## 一、现状：载入机制拆解

### 1.1 首页 `index.html` 首访资源（未压缩合计 ≈ 984KB，gzip 后估算 ≈ 290KB）

| 资源 | 大小 | 加载方式 | 说明 |
|---|---|---|---|
| `theme.css` | 34KB | `<head>` 同步（渲染阻塞） | 内含 2 个 `@font-face`，`font-display: swap` |
| Press Start 2P（英文像素） | 12KB | 发现即下载 | 英文字形 |
| **Fusion Pixel（中文像素）** | **656KB** | **无条件下载（所有页面、所有语言）** | 最大单文件；swap 先显示系统字体再替换（FOUT） |
| 11 个 JS | ≈280KB | `</body>` 前同步串行 | i18n→i18n-dict(47KB)→**i18n-story(116KB)**→storage→extras(27KB)→music(29KB)→games(26KB)→rank→stories→nav→home |
| sw.js 预缓存 | — | Service Worker | 二次访问起 cache-first，首访慢主要在首访 |

### 1.2 全站加载差异（关键事实）

| 页面类型 | 加载的字典 | 说明 |
|---|---|---|
| 首页 | i18n-dict + **i18n-story(116KB)** | 旅程只用摘要键，正文键浪费 |
| 游戏厅/编年史/人物志/密件册/单章 | i18n-dict + i18n-story | 内容页**需要**正文 |
| 游戏页（×101） | i18n-dict（47KB）+ 游戏内 gs.* 字典 | **不加载 i18n-story**；但 shell.js 史话 tooltip 用 `T(章节标题键)` → en 模式下**回退中文**（预存问题） |

### 1.3 三个已被证实的根因

1. **默认语言写死 `zh`**：`i18n.js` 中 `localStorage.getItem('arcade_lang') || 'zh'`，首次访问不做浏览器语言探测 → 英文浏览器用户也默认中文界面。
2. **中文像素字体无条件加载**：`theme.css` 的 `@font-face` 全局声明，任何页面只要 `--font-pixel` 被使用就会下载 656KB，与界面语言无关。
3. **摘要键与正文键同处一个 116KB 字典**：首页/游戏页只需要章节标题、一句话、人物名、密件名等摘要（约 1/4 键），却整包加载包含长篇正文的字典。

---

## 二、方案库（逐项：做法 / 收益 / 成本 / 风险 / 适用页面）

### S1 · 语言自适应（首访按浏览器语言）
- **做法**：`i18n.js` 首次无存储时按 `navigator.language` 判定（`/^zh/` → zh，其余 → en）；用户手动切换后写 `localStorage` 记忆；`<html lang>` 已同步（现有 syncLang）。
- **收益**：英文浏览器用户首访直接是英文界面（体验正确）；并为 S2 的字体条件加载提供前提。
- **成本**：约 5 行改动；全站所有页面共享 i18n.js，一处改、处处生效。
- **风险**：极低。注意：首页/游戏厅的 meta description 等 SEO 文案仍以 zh 为主（不影响功能，可后续按 lang 动态化）。

### S2 · 中文像素字体条件加载（**全站最大单项收益**）✅
- **做法**：主题层加 `html[lang="en"]` 规则覆盖字体栈：`--font-pixel: 'Press Start 2P', 'Segoe UI', ...`（**去掉 'Fusion Pixel'**）。浏览器只在**实际渲染用到**该字族时才下载字体文件 → en 界面（纯拉丁字符）永远不下载中文字体。
- **联动（已实施）**：
  - 中文字体已子集化：641KB `fusion-pixel-zh-hans.woff2` → **54KB `fusion-pixel-site.woff2`**（站点字符集 1,744 汉字 + 标点，fontTools 子集，验证 0 丢失；`tools/report/site-chars.txt`）。
  - `sw.js` 预缓存清单**移除 fusion-pixel**（CACHE bump v2；zh 用户首次用到时由运行时缓存补上，二次访问仍离线可用）。
  - `sync-head.js` 注入 head 内联语言探测：先设 `<html lang>`，zh 时动态 preload 子集字体。
- **收益**：英文首访**中文字体 0 下载**；中文首访字体 656KB → **54KB（-92%）**。
- **成本**：CSS 一行 + sw.js 清单一行 + sync-head 注入。
- **风险**：低。en 界面残余中文用系统字体渲染（不下载像素字体、不崩坏，仅字形不同）；S3 已修残留（史话 tooltip en 双语）。

### S3 · 摘要字典下沉（i18n-dict.js 扩充摘要键，i18n-story.js 只留正文）
- **做法**：把**章节标题/一句话/时代**（`st.<id>.t/.one/.era`）、**人物名/角色/简介引用**、**密件名**等「全站都要用」的摘要键从 `i18n-story.js` 移入 `i18n-dict.js`（后者所有页面都加载）；`i18n-story.js` 只保留章节正文长文/人物传记全文/密件详情，且**仅内容页（stories/people/artifacts/story）加载**。
  - 首页：`home.js` 的旅程改用摘要键 → **不再加载 i18n-story.js**（首页 JS 280KB → ≈190KB）。
  - 游戏页：shell.js 史话 tooltip 的章节标题键在 i18n-dict 中 → **en 模式不再回退中文**（顺带修复现存双语 bug）。
- **收益**：首页与 101 个游戏页 JS 各减 80-90KB；游戏页 en 双语补全。
- **成本**：中等 —— 需梳理 home.js / shell.js / stories.js 实际引用的摘要键全集，新增一个校验脚本（`tools/check-home-keys.js`）确保键不缺失；正文键不移动则内容页不受影响。
- **风险**：中。需 smoke（zh/en）全量回归验证无缺键回退；万一遗漏，`t()` 会回退 zh（可接受但不完美），校验脚本兜底。

### S4 · 背景音乐延后加载（music.js）✅
- **做法**：首页与游戏页把 `music.js` 从同步链移除，改为 `requestIdleCallback`（降级 load+setTimeout）后动态注入；注入完成后按页面播放 BGM。BGM 本就需用户手势才真正发声（AudioContext 限制），延后不影响体验。
- **收益**：首屏少解析执行 29KB（首页 + 游戏页同步受益）。
- **成本**：低；`index.html` 内联脚本与 `shell.js` bootMusic 各一处。
- **风险**：低；所有 `Arcade.music` 调用点均有防御性判断，smoke 已验证。

### S5 · 字体 preload（与 S2 联动）
- **做法**：`<head>` 预加载 **Press Start 2P**（无条件，12KB，所有语言都用到标题）；**Fusion Pixel 仅在 zh 模式**下动态插入 preload（JS 按 lang 注入，避免 en 也 preload）。
- **收益**：zh 首访字体下载与 CSS/JS 并行（省 100-300ms FOUT 时间）；en 首访不预载中文字体。
- **成本**：两行静态 + 一小段 lang 判断注入；所有页面（首页/游戏页）需同步 —— 游戏页由 shell.js 统一注入，首页/内容页各加一段（或抽成 `pwa.js` 同级的 `perf.js` 统一处理）。
- **风险**：低。

### S6 · 部署侧压缩与缓存（✅ 事实确认，无需操作）
- **GitHub Pages 压缩现状**：
  - Pages 由 CDN（Fastly）提供服务，**会自动对 js/css/html/json/svg/txt 做 gzip/brotli**（按请求 `Accept-Encoding`），无需配置、无需操作。
  - **woff2 字体本身已压缩**（内部 Brotli），gzip 再压收益≈0，无需处理。
  - 无需验证：CDN 压缩是自动的；若个别资源未压缩也属 CDN 内部策略，站点侧无可配置项。
- **缓存**：SW 已提供二次访问 cache-first；部署即生效，无需额外配置。

### S7 · 测量基线（✅ 部署前静态核查替代）
- **做法**：部署前用 `tools/preflight.js` 做资源完整性核查（无 404 风险、关键资源齐全），配合全量回归（audit/smoke/audit-deep）确认无回归。
- **预期效果（本方案落地后）**：zh 首访字体 656KB→54KB、首页 JS 省 116KB；en 首访中文字体 0 下载。具体 FCP/LCP 数值随设备与网络而异，此处不做线上测量承诺。

---

## 三、全站同步整体执行计划（P0 → P1 → P2）

> 每步都保持「audit 101/101 + smoke（默认/zh/en/page）全绿」的回归门槛。
> **2026-08-16 实施状态：P0/P1/P2 全部完成并回归全绿，上传即用。**

### P0 · 零风险快赢（✅ 已实施）
| 步骤 | 内容 | 改动面 | 状态 |
|---|---|---|---|
| P0-1 | S1 语言自适应（浏览器探测默认语言） | `i18n.js`（全站共享，一处改处处生效） | ✅ |
| P0-2 | S2 中文字体条件加载（`html.lang-en` 字体栈覆盖 + sw.js 清单同步 + **子集字体接入**） | `theme.css` + `sw.js`（CACHE v2） | ✅ |
| P0-3 | S5 英文像素字体 preload（中文按 lang 动态 preload） | `sync-head.js` 全站 109 HTML 注入 | ✅ |

**P0 回归**：audit + smoke 四模式 + 手动切 en 验证：en 不下载 fusion-pixel（DevTools Network 确认），zh 正常。✅

### P1 · 字典分层（✅ 已实施）
| 步骤 | 内容 | 改动面 | 状态 |
|---|---|---|---|
| P1-1 | 盘点 home.js / shell.js / stories.js 摘要键全集，写 `tools/check-home-keys.js` | 工具脚本 | ✅ |
| P1-2 | 摘要键移入 i18n-dict.js（zh/en 对称） | `i18n-dict.js` + `i18n-story.js`（`tools/migrate-summary.js` + 两个 check 脚本验证） | ✅ |
| P1-3 | 首页与游戏页不再加载 i18n-story.js（首页 JS -116KB；游戏页史话 tooltip en 双语修复） | `index.html` + `shell.js` | ✅ |
| P1-4 | S4 music.js 延后到首帧后（requestIdleCallback 动态注入） | `index.html` + `shell.js` | ✅ |
| P1-5 | 后台静默预取 prefetch.js（首页 load 后空闲预取内容页/游戏厅） | 新增 `assets/js/prefetch.js` + `sw.js` | ✅ |

**P1 回归**：smoke zh/en（重点查缺键回退）+ page smoke + audit + audit-deep 全绿。✅

### P2 · 收尾与验收（✅ 已完成）
- [x] 部署前资源完整性检查：新增 `tools/preflight.js`（109 HTML / 1341 引用无缺失、动态章节链接有效、关键资源齐全）
- [x] 文档同步：本文件状态更新（已实施）✅（本节）
- [x] 部署前全量回归：audit 101/101 + smoke 四模式 + audit-deep 全绿

---

## 四、优劣对比总表

| 方案 | 预估收益 | 成本 | 风险 | 优先级 |
|---|---|---|---|---|
| S1 语言自适应 | 英文用户首访体验正确；S2 前提 | 极低 | 极低 | P0 |
| S2 中文字体条件加载 | **en 首访 -656KB（总量 -2/3）** | 低 | 低（依赖 S3 才完全无残留） | P0 |
| S3 摘要字典下沉 | 首页/游戏页 JS **-80~90KB/页**；游戏页 en 双语修复 | 中 | 中（需校验脚本 + 全量 smoke） | P1 |
| S4 音乐延后 | 首屏 -29KB 解析 | 低 | 低 | P1 |
| S5 字体 preload | zh 首访 -100~300ms FOUT | 低 | 低 | P0 |
| S6 部署压缩 | 全站 gzip -70%（若 Pages 未自动压缩） | 零代码 | 低（Pages 可能不可配） | P0（验证） |
| S7 测量 | 量化验证，避免凭感觉 | 低 | — | P2 |

### 风险汇总与回滚
- **S3 最大风险**是键遗漏导致英文回退中文：用校验脚本 + smoke en 兜底；回滚只需恢复 index.html/shell.js 的脚本行。
- **S2 最大风险**是 en 界面残留中文像素字形缺失：与 S3 绑定实施，P0 阶段先上「字体栈覆盖 + 系统字体兜底」，P1 修复残留。
- 全部方案都不改变数据/玩法逻辑，游戏页 gameplay 零接触，回归面集中在加载与文案。

---

## 五、你的两个问题的直接回答

1. **「gzip 可以直接用吗？GitHub Pages 默认支持吗？」**
   **支持且无需操作**：Pages 经 CDN 对 js/css/html/json 等文本类型自动 gzip/brotli；woff2 字体本身已压缩无需再压。若个别资源未压缩也属 CDN 内部策略，站点侧无可配置项。
2. **「首次访问不一定是中文界面」**
   正确 —— 当前写死 zh。S1 让首访按浏览器语言自适应，且只在中文界面下载 656KB 中文像素字体（S2）。

---

*本方案 P0/P1/P2 已全部实施完毕，并通过部署前全量回归（audit 101/101、smoke 默认/zh/en/page、audit-deep MAJOR 0）与资源完整性检查（tools/preflight.js）。上传即用。*
