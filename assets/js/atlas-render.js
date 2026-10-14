/* ============================================================
   atlas-render.js — 知识图谱页渲染器
   读 window.KNOWLEDGE（由 cryptography-decode-history 仓库生成的 site-knowledge.js）
   渲染三轴：轴1 时代（19）· 轴2 技术域（24 树）· 轴3 实体（人物/密件/机器）
   双语并排（中文主 + English 次）。零外链，零构建。
   ============================================================ */
window.Arcade = window.Arcade || {};
(function () {
  var K = window.KNOWLEDGE;
  var host = document.getElementById('atlas-root');
  if (!host || !K) { if (host) host.innerHTML = '<p class="atlas-empty">知识束未加载（缺少 assets/js/site-knowledge.js）。</p>'; return; }

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function zhzh(s) { return (s || '').replace(/\*\*/g, ''); } // 去掉仓库 MD 残留的加粗标记
  function langText(obj) { var l = (Arcade.i18n && Arcade.i18n.getLang && Arcade.i18n.getLang()) || 'zh'; return l === 'en' ? (obj.en || '') : (obj.zh || ''); }

  // —— 轴2：24 技术域树（网站此前最缺的轴）——
  var domains = K.domains.map(function (d) {
    var terms = (d.terms || []).map(function (t) {
      var hash = 'term-' + String(t).replace(/[^A-Za-z0-9_-]/g, '-');
      return '<li><a class="atlas-tlink" href="glossary.html#' + hash + '">' + esc(t) + '</a></li>';
    }).join('');
    var termBlock = d.termCount
      ? '<details class="atlas-terms"><summary>' + d.termCount + ' 条术语 / terms</summary><ul>' + terms + '</ul></details>'
      : '<p class="atlas-no">（该域暂无术语，Phase 2 补）</p>';
    var pages = '';
    if (d.proto > 0) pages += '<a class="atlas-page" href="protocols.html">' + '🛡 协议实验室 · ' + d.proto + ' 个</a>';
    if (d.work > 0) pages += '<a class="atlas-page" href="workshop.html">' + '🔧 破译工坊 · ' + d.work + ' 个</a>';
    var pageBlock = pages ? '<div class="atlas-pages">' + pages + '</div>' : '';
    return '<article class="atlas-domain" data-id="' + d.id + '">' +
      '<header><span class="atlas-did">' + d.id + '</span><h3>' + esc(d.title) + ' <span class="atlas-ten">' + esc(d.titleEn) + '</span></h3></header>' +
      '<p class="atlas-cz">' + esc(zhzh(d.zh)) + '</p>' +
      '<p class="atlas-ce">' + esc(d.en) + '</p>' +
      termBlock + pageBlock +
      '</article>';
  }).join('\n');

  // —— 轴1：19 时代 ——
  var eras = K.eras.map(function (e) {
    var ch = (e.chapters || []).map(function (c) {
      return '<a class="atlas-chap" href="' + esc(c.href) + '">' + esc(c.title) + '</a>';
    }).join(' ');
    var body = (e.zh ? '<p class="atlas-cz">' + esc(zhzh(e.zh)) + '</p>' : '') + (e.en ? '<p class="atlas-ce">' + esc(e.en) + '</p>' : '');
    return '<article class="atlas-era" data-id="' + e.id + '">' +
      '<header><span class="atlas-eid">' + e.id + '</span><h3>' + esc(e.title) + ' <span class="atlas-ten">' + esc(e.titleEn) + '</span></h3></header>' +
      body +
      (ch ? '<div class="atlas-chaps">' + ch + '</div>' : '') +
      '</article>';
  }).join('\n');

  // —— 轴3：实体 ——
  var s = K.stats;
  var entities =
    '<a class="atlas-ent" href="people.html">人物志 <b>' + s.people + '</b> 人</a>' +
    '<a class="atlas-ent" href="artifacts.html">密件册 <b>' + s.artifacts + '</b> 件</a>' +
    '<a class="atlas-ent" href="machine.html">机器 <b>' + s.machines + '</b> 台</a>' +
    '<a class="atlas-ent" href="glossary.html">术语 <b>' + s.terms + '</b> 条</a>';

  host.innerHTML =
    '<header class="atlas-head">' +
      '<h1 class="atlas-title">知识图谱 <span class="atlas-ten">Knowledge Atlas</span></h1>' +
      '<p class="atlas-sub">人类加密解密 · 三维知识晶格</p>' +
      '<p class="atlas-stats">' + s.domains + ' 技术域 × ' + s.eras + ' 时代 × (' + s.people + ' 人物 / ' + s.artifacts + ' 密件 / ' + s.machines + ' 机器 / ' + s.terms + ' 术语)</p>' +
      '<p class="atlas-src">真源：<code>cryptography-decode-history</code> · 生成于 ' + esc(K.generated) + '</p>' +
    '</header>' +
    '<section class="atlas-ax"><h2 class="atlas-axh">轴1 · 编年叙事（' + K.eras.length + ' 时代）</h2><div class="atlas-grid">' + eras + '</div></section>' +
    '<section class="atlas-ax"><h2 class="atlas-axh">轴2 · 技术域（24）<span class="atlas-axn">网站此前最缺的这根轴</span></h2><div class="atlas-grid atlas-domains">' + domains + '</div></section>' +
    '<section class="atlas-ax"><h2 class="atlas-axh">轴3 · 实体层</h2><div class="atlas-ents">' + entities + '</div></section>' +
    '<section class="atlas-ax"><h2 class="atlas-axh">全站散页 <span class="atlas-axn">不归单域的交互式工具</span></h2><div class="atlas-ents">' +
      '<a class="atlas-ent" href="quiz.html">测验 <b>252</b> 题</a>' +
      '<a class="atlas-ent" href="discover.html">发现 <b>🧭</b></a>' +
      '<a class="atlas-ent" href="toolkit.html">工具包 <b>24</b> 卡片</a>' +
      '</div></section>';
})();
