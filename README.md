# 🕹️ 破译 DECODE ARCADE

**用 114 款小游戏还原人类加密解密的三千年历史。** 一座纯前端的「密码博物馆」：破译旅程时间轴 + 编年史 + 人物志 + 密件册 + 游戏厅 + 破译工坊 + 术语表，全局导航统一，中英双语，PWA 可安装可离线。

> 在线访问：**https://poyi.net**
> 完整项目台账与迭代史见 [PLAN.md](PLAN.md)，改进方案见 [docs/improvement-plan.md](docs/improvement-plan.md)

---

## ✨ 特点

- **零构建、零依赖**：原生 HTML/CSS/JS，普通 `<script>` 加载，双击 `index.html` 即可游玩
- **隐私至上**：纪录仅存浏览器 localStorage，不上传任何数据、无任何统计埋点
- **双语**：zh/en 全量字典，首次访问按浏览器语言自适应
- **PWA**：manifest + Service Worker，添加到主屏幕后独立窗口离线可玩
- **质量门禁**：22 项自动化检查（审计/冒烟/深扫/资源完整性/i18n 键审计…），详见下文
- **真浏览器 E2E**（可选）：`npm run e2e` —— Playwright + Chromium 逐页验证渲染/控制台/SW/离线

## 🚀 本地运行

```bash
# 方式一：直接双击 index.html（file:// 可玩；SW/PWA 需 http(s)）
# 方式二（推荐）：本地静态服务器
python -m http.server 8000        # 或 npx serve .
# 访问 http://localhost:8000
```

## 🔍 质量门禁

一键全站体检（约 1–2 分钟）：

```bash
npm run qa          # 或 node tools/qa-all.js
```

单项门禁：

| 命令 | 内容 |
|---|---|
| `node audit.js` | 13 项硬标准 × 114 款游戏（模板/教程/记分/重开/响应式/SEO…） |
| `node smoke.js [zh\|en\|page]` | 无浏览器 DOM 模拟冒烟（初始化+重开+一帧渲染），三语言模式 + 页面模式 |
| `node tools/audit-deep.js` | 静态深度扫描（触控/溢出/泄漏/i18n 对称/硬编码中文） |
| `node tools/preflight.js` | 部署前资源完整性（全部 HTML 引用无缺失） |
| `node tools/check-ghpages.js` | GitHub Pages 兼容（大小写敏感引用/体积/Jekyll/CNAME） |

内容与算法验证器：`tools/verify-workshop.js`（16 种密码算法往返）、`verify-eggs.js`（20 枚彩蛋）、`verify-quiz.js`（题库）、`check-chapter-copy.js`（章节文案）、`check-game-i18n.js`（114 款 gs.* 双语对称）等。

## 📁 目录结构

```
├── index.html               # 首页（破译旅程画卷）
├── games.html / stories.html / people.html / artifacts.html / glossary.html / stats.html …
├── sw.js                    # Service Worker（离线缓存 v22）
├── manifest.webmanifest     # PWA 清单
├── assets/
│   ├── css/                 # theme.css 设计系统 + shell.css 游戏页骨架
│   ├── fonts/               # Press Start 2P + Fusion Pixel 中文子集(54KB)
│   ├── icons/               # PWA 图标
│   └── js/
│       ├── games.js         # 【游戏注册表】新增游戏只需加一条记录
│       ├── lobby.js / home.js / shell.js / stats.js / rank.js / nav.js …
│       └── core/            # i18n / storage / input / loop / extras / music
├── games/<id>/              # 每款游戏：index.html 样板 + <id>.js 逻辑 + <id>-i18n.js 文案
├── tools/                   # 质量门禁 + 生成器 + 验证器（oneoff/ 为历史一次性脚本存档）
└── docs/                    # 性能方案、改进方案
```

## ➕ 新增一款游戏

1. 复制任一 `games/<id>/` 目录改名；改 `index.html` 的 `data-*` 与标题
2. 在 `assets/js/games.js` 注册表加一条记录（含 `lvl`/`time` 标签）
3. `node tools/gen-sitemap.js` 同步 sitemap
4. 提交前必跑：`node audit.js <gameId>` + `node smoke.js`

## 📐 技术约定

- 全局命名空间 `window.Arcade`；统一顶栏由 `shell.js` 运行时注入
- localStorage key 规范：`arcade_best_<id>` / `arcade_daily_*` / `arcade_lang`
- i18n 分层：`core/i18n-dict.js`（全站摘要键）+ `i18n-story.js`(正文，仅内容页) + 各游戏 `gs.*` 独立文件
- **安全约定**：任何动态字符串拼入 innerHTML 前必须经 `Arcade.escapeHtml()`（或 DOM 属性赋值）；URL 参数读取处一律长度钳制
- **上传提示**：手动上传到 GitHub Pages 时请跳过 `node_modules/`、`e2e/`、`.github/`（开发工具与 CI 配置，非站点产物）
- 部署目标为 GitHub Pages 域名根（绝对路径 `/assets/...`，不可用项目子路径）

---

© 2026 破译游戏 · POYI.NET · 纪录仅存本地 · 不上传任何数据 · 史料整理自公开信息仅供学习
