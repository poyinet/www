# 加固评估报告 · CSP 与字典下沉终评（2026-08-22）

> 对应 improvement-plan-2.md Phase 4 的 D1 / D2。结论均为「明确不做」，依据如下。

## D1 · Content-Security-Policy meta 可行性

### 现状约束
1. 全站采用零构建架构：每个页面都有**内联 `<script>`**（语言探测、页面逻辑、JSON-LD），游戏逻辑虽在外链 JS，但壳层注入依赖内联引导。
2. 图标大量使用 `data:image/svg+xml` URI。
3. GitHub Pages **不支持自定义 HTTP 响应头**，只能用 `<meta http-equiv="Content-Security-Policy">`，而 meta 形式天生不支持 `frame-ancestors`、`report-uri` 等指令。

### 若启用的策略形态
```
script-src 'self' 'unsafe-inline';   ← 内联脚本密集，unsafe-inline 无法去除
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
object-src 'none';
base-uri 'self';
```

### 结论：不启用
- `script-src` 含 `'unsafe-inline'` 时，CSP 对 XSS 的核心防护（阻止内联注入执行）**完全失效**——而我们关心的恰是注入类向量。真正的防线是已落地的 `escapeHtml` 规范 + `scan-innerhtml` 静态门禁。
- 剩余价值仅剩 `object-src 'none'` 与 `base-uri` 这类边缘加固，收益不抵「meta 策略一旦写错会静默破坏全部页面」的回归风险。
- 触发条件（未来任一满足再评估）：① 引入第三方脚本（统计/广告）；② 迁移到支持响应头的托管；③ 出现用户生成内容的持久化展示。

## D2 · 游戏页 g.* 字典下沉终评

### 数据
- `g.<id>.t/.d` 双语约 21KB（原始字节），占当前 i18n-dict.js（134.7KB）的 ~16%。
- 消费方：游戏厅搜索/卡片（需要**全部 105 条**）、首页旅程 chips（子集）、时间线悬浮、游戏页自身顶栏（仅需 2 条）。

### 若下沉的代价
- 游戏厅为满足搜索必须加载全量 → 必须维护「合并包」或双份结构；
- shell 史话 tooltip、home journey、map/timeline 均按 id 动态取键，静态分析工具（i18nusage/dead-keys）需要整族豁免，审计灵敏度下降；
- 实际收益：游戏页 gzip 后约 **-6KB**（135KB→~113KB raw）。

### 结论：不做
收益小于复杂度成本。C2 一期（长文拆分 -75KB）已拿走大头；剩余体积由「大厅搜索功能」的本质需求决定，属于合理常量。此结论同时关闭路线图中「字典碎片再拆分」方向。
