# 破译 DECODE ARCADE · 全站现状与后续规划

> 状态快照：2026-08-27 · 最新提交 e05186b（覆盖补齐）· 本文件为全站权威状态文档，后续所有变更须同步更新

---

## 一、站点定位

**破译 DECODE ARCADE（poyi.net）** —— 用游戏破译人类三千年加密解密史：
- 纯静态站（无构建，GitHub Pages 部署，CNAME poyi.net）
- 131 款可游玩的密码学教学游戏 + 12 章编年史 + 人物志/密件册/术语表/测验场等 18 个知识页面
- 完全离线可用（Service Worker 预缓存 + 运行时缓存）；进度全部存 localStorage，零服务端数据上传
- 双语（zh/en），公开域名 poyinet/www

### 规模总览（2026-08-27 实测 · 三源一致）

| 维度 | 数值 | 说明 |
|---|---|---|
| 注册游戏 | **131** | games.js 计数，与磁盘目录/站点地图三源一致 |
| 每日挑战题 | **41** | DAILY_IDS，全部有 markSolved 完成上报 |
| 编年史章节 | 12 | dawn→quantum，含正文/冷知识/挑战/小测/史料 |
| 人物志 | **65** | 全字段（name/icon/role/era/fact/bio/quote）双语 |
| 密件册 | 41 | 全部有解锁游戏+史料性质标注 |
| 术语表 | **237** | 208→237，含游戏联动+章节反链 |
| 测验题库 | 160 | L1-4 分布 25/41/57/37 |
| 协议实验室 | 16 演示 | TLS/DH/Merkle/ZKP/ChaCha/ECC/A5-1/RC4/签名/数论/差分/AEAD/长度扩展/大数 RSA/随机/口令 |
| 破译工坊 | 16 算法 | 加解密+密文破解识别 |
| 站点地图 | 148 URL | 131 游戏页 + 17 根页，与磁盘一致 |
| Service Worker | v39 | 预缓存 66 资源 |

---

## 二、质量体系

### 门禁（本地 qa-all 23 项，CI 强制）

`audit`(13 硬标准) · `smoke` · `smoke:zh` · `smoke:en` · `smoke:page` · `deep` · `preflight` · `ghpages` · `swassets`(预缓存交叉核对) · `chapter`(章节-游戏文案) · `homekeys` · `gamekeys` · `gamei18n`(gs.* 双语对称+占位符) · `i18nusage`(键引用审计) · `dictdead` · `glossary` · `knowledge` · `workshop` · `eggs` · `quiz` · `linkdensity` · `numbers`(数字口径防回归——**最重要的一环**) · `css`

### E2E（Playwright chromium，466→487 用例）

- `play-probe.spec.js` —— 131 款游戏逐一真实游玩探针（加载/渲染/重开无报错）
- `games-all` / `mobile`(320px 无横向溢出逐游戏) / `pwa`(主题/离线) / `visual`(5 个页面全页截图基线) / `quiz-*` 等
- CI：GitHub Actions `qa.yml` —— push/PR 时 `npm ci + qa` + Playwright chromium（失败上传工件）

### 本轮演进（2026 下半年）

| 批次 | 内容 | 提交 |
|---|---|---|
| Plan8-A | P0 修复：games.html 页脚 CSS 断链、4 款每日游戏死锁、数字口径、编年史文案 | 6485288/9f9b199 |
| Plan8-B | 死键/重复词条/键前缀/meta/SW 补漏 | c268697 |
| Plan8-C | 四大知识页互链工程（story 延伸区/quiz 延伸/protocols 延伸/术语 39→185 联动/密件直达/helpText 章节引可点击） | 610767e |
| Plan8-D | 现代主题 6 款游戏（aes-lab/password-vault/pgp-mail/blockchain-miner/zkp-cave/totp-verify）+人物 8/术语 12/测验 10 | abc54c4/a67de8b/7d48d4d |
| Plan8-E | UX：全局热键/搜索 a11y/story 阅读体验/首访引导 | 74833b3 |
| Plan8-F | 构架：story 内联外置/games.html -150KB/CSS 卫生/CI 加 e2e | 5332040 |
| Sprint-100 | 永久数字门禁 + 内容冲顶（quiz 153/glossary 210/koblitz） | ac8906b |
| **深审复检** | 13 项真问题修复（5 款判分 bug/3 道答案错/史实纠偏/8 人 era 翻译/miller 教育经历等） | 9eb1204 |
| Phase 14 | 6 款旗舰游戏（scytale/alberti-disc/cardan-grille/jefferson-disk/side-channel-lab/homomorphic-lab） | 69f603f |
| **覆盖补齐** | 术语 +29、人物 +8、homophonic 游戏；总 131/237/65 | e05186b |

### 质量轶事（值得记录）

- **数字门禁实战立功**：游戏数 124→130→131 三次变更，numbers 门禁每次都立即拦下 4-6 文件旧文案漂移
- **深审抓到隐藏级缺陷**：5 款新游戏选项打乱后未重算正确索引（无脑点第一个必得分）；已固化为「打乱后 indexOf(correctRef) 重算」惯例，qkd-sim 起所有新游戏遵守
- **答对索引判分 bug 复盘**：C-1 类缺陷防复发 = 每题打乱后 `curA = curOpts.indexOf(correctRef)`；本 repo 约定「先引用后打乱，打乱后重索引」

---

## 三、已知债务（诚实清单）

| 项 | 类型 | 严重度 | 说明 |
|---|---|---|---|
| i18n-dict 三套写入通道未归一 | 维护性 | 低 | zhP/enP 旧映射 + dd.* 追加区 + 主字面量；无运行时影响 |
| Typex 机 / Book Cipher 无专属游戏 | 内容深度 | 低 | 机制与 Enigma/格栅重叠高，术语+史实已达覆盖 |
| 纳瓦霍语传令仅密件 | 内容深度 | 低 | 语言编码而非密码算法，术语已覆盖 |
| 同音替换词条与游戏若干 helpText 未全引章节 | 体验 | 极低 | 教程覆盖 100%，个别延伸可后补 |
| perf-probe 需外部服务器 | 工具 | 极低 | 未纳入 CI；页面减重已由结构验证 |

---

## 四、后续规划

### P0（安全性 / 基础设施）
1. **推送 `69f603f`+`e05186b` 复验**：网络恢复后 `git push origin main`，重新小流量验证 poyi.net SW v39 上线
2. **CI 稳定性**：qa.yml e2e job 是否为必过（当前 failure 条件上传工件；建议 main 分支 protect）

### P1（内容深度，预计 2-3 天）
3. **Typex 游戏化**（可选）—— Enigma 衍生五转子破译体验，挂 bletchley 章
4. **Book Cipher 游戏化**（可选）—— 书签码实战，挂 arab 章
5. **测验 160→180**：补齐 Porta/Typex/Cold-Boot/MPC/盲签名/盲选 20 题，让术语覆盖率从 78/208 升到 150+
6. **术语章节反链补缺**：62 条无 chapters 的术语回填（有 game 的补挂章节）

### P2（架构现代化，按需）
7. **i18n-dict 归一**：把 zhP/enP/dd.* 收敛到单一字面量，建 `tools/verify-dict-unified.js` 防回潮
8. **字典按页拆分**：i18n-story(158KB) 只被 story/stories/stats 消费——可再拆 2 个迷你包（-60~100KB/页）
9. **a11y 加速**：quiz 结果页 Tab 焦点圈定；ob-overlay 加入 focus trap（对移动端 56px tabbar 遮挡已修复，缺焦点圈定）

### P3（运营）
10. **poyi.net 上线后 SEO 复测**：IndexNow 提交 / Search Console 建站 / Google Play 之外可考虑 Apple App Site Association
11. **数据分析**：启用 SW 缓存命中统计（sw.js 加 fetch 计数器上报 local，可选）

---

## 五、关键文件索引

| 文件 | 作用 |
|---|---|
| `docs/improvement-plan-8.md` | 批次计划的完整执行记录 |
| `tools/qa-all.js` | 23 项门禁入口 |
| `tools/check-numbers.js` | 数字口径防回归（核心） |
| `tools/oneoff/xref-scan2.js` | 交叉引用大扫描（字典重复键+quiz 解析卫生） |
| `tools/oneoff/fix-c1-curA.js` | C-1 判分 bug 修复器（历史参考） |
| `e2e/play-probe.spec.js` | 131 款游戏真浏览器探针 |
| `.github/workflows/qa.yml` | CI（qa + e2e） |
| `sw.js` | Service Worker v39 |

## 六、下一步（时效性）

> 每次变更后：改 `docs/site-status.md` → `node tools/gen-sitemap.js` → bump sw.js → `npm run qa` → 全量 chromium → git commit+push → poyi.net 验证。
