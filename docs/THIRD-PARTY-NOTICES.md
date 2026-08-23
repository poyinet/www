# 第三方素材与数据来源声明

本站为纯原创内容站。以下为使用的少量第三方素材及其许可信息。

## 字体

| 字体 | 许可 | 许可文件 | 使用方式 | 合规说明 |
|---|---|---|---|---|
| Fusion Pixel（缝合像素字体） | SIL Open Font License 1.1 | `assets/fonts/FUSION-PIXEL-OFL.txt` | 子集化（fontTools，站点字符集 1,744 汉字 + 标点），重命名为 `fusion-pixel-site.woff2` | OFL 允许子集与再分发；原始版权方未声明 Reserved Font Name，子集版沿用家族名「Fusion Pixel」合规；许可文件随字体一同分发 ✓ |
| Press Start 2P | SIL Open Font License 1.1 | `assets/fonts/PRESS-START-2P-OFL.txt` | 原始未修改 woff2（12KB），CSS font-family 沿用原名 | 版权方声明 RFN "Press Start 2P"——本站使用**原始未修改**版本并沿用原名，符合 OFL RFN 条款（仅限制修改版使用 RFN）；许可文件随字体一同分发 ✓ |

## 图标与图形

| 素材 | 来源 | 说明 |
|---|---|---|
| PWA 图标 ×4（192/512/maskable/apple-touch） | 本站 `tools/gen-icons.js` 生成（逐像素绘制 + 内置 PNG 编码器） | 原创像素风设计，无第三方素材 |
| og-image.png | 本站工具生成 | 原创品牌版式 |
| 安装预览截图 ×2 | 本站 `tools/gen-screenshots.js` 生成 | 品牌版式；部署后可换真实截屏 |
| favicon（data:image/svg+xml 内联） | 本站内联 SVG | 原创表情符号 |

## 音频

| 素材 | 来源 | 说明 |
|---|---|---|
| 全部 BGM 与音效 | `assets/js/core/music.js` Web Audio 程序化合成 | 零采样、零外部文件、完全原创编曲（5 声部 chiptune，128 步 A-A-B-A 结构） |

## 地图

| 素材 | 来源 | 说明 |
|---|---|---|
| 世界地图 SVG（map.html 内联） | 本站手绘简化大陆轮廓（等距圆柱投影） | 非精确地理数据；仅示意性标注事件坐标 |

## 内容

| 类别 | 来源 | 说明 |
|---|---|---|
| 全部章节正文 / 人物志 / 密件册 / 术语定义 / 测验题目 / 冷知识 / 谜题 | 本站原创编写（基于公开历史资料的独立转述） | 不构成对任何出版物的复制；书单仅列作者与书名（标题不受版权保护）；史料引文均为标注「史料化」的转写或极短引用 |
| 名言墙 50 条 | 原文或广泛流传的英文形式 + 本站中译 | 均附人物与年份归属；历史人物言论属公有领域或极短合理引用 |
| 游戏机制 | 原创实现（零依赖、零外部代码） | 不复制任何现有游戏的代码、美术或音频资产；经典玩法机制不受版权保护 |

## 商标说明

文中提及的 Enigma、PGP、Colossus、Nokia、Monero、NIST、EFF 等均为其各自所有者的商标或项目名，本站仅在教育性叙述中作指代使用（指示性合理使用），不构成商标滥用。

---

© 2026 破译游戏 · POYI.NET · 本声明随代码一同维护
