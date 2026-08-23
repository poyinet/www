#!/usr/bin/env node
/* ============================================================
   一次性修复：彩蛋页脚提示 i18n（第二版 · 双保险）
   1) 给 <span class="egg-hint"> 注入 data-egg="eNN"
   2) 文案改为双语双 span：<span class="egg-zh">中文</span>
      + <span class="egg-en">English</span>，由 theme.css 按
      html[lang] 纯 CSS 切换——不依赖 JS 运行时与 SW 缓存状态。
   幂等：已含 egg-en 的跳过。UTF-8 无 BOM 读写。
   用法：node tools/oneoff/fix-egg-hint-i18n.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

/* 与 assets/js/easter-eggs.js 的 EGGS[].en 保持一致 */
const EN = {
  e01: 'Home footer · Caesar shift 3',
  e02: 'Arcade footer · Morse code',
  e03: 'Chronicles footer · Bacon cipher',
  e04: 'People footer · Binary',
  e05: 'Artifacts footer · Base64',
  e06: 'Profile footer · Vigenere key CODE',
  e07: 'Chapter footer · Rail fence, 3 rails',
  e08: 'Glossary footer · XOR key KEY',
  e09: '404 footer · Affine a=5 b=8',
  e10: 'Game shell footer · Substitution table ZYX…',
  e11: 'Workshop footer · Playfair key ARCADE',
  e12: 'Home timeline end · Hill key 3,2,2,3',
  e13: 'Quiz footer · Vigenere key QUIZ',
  e14: 'Duel footer · Playfair key DUEL',
  e15: 'Morse trainer footer · Morse code',
  e16: '24-day path footer · Rail fence, 4 rails',
  e17: 'Chronicles timeline · Bifid key SPARTA',
  e18: 'Artifacts Voynich entry · Trifid cipher',
  e19: 'Glossary Polybius entry · ADFGVX key ZIMMER',
  e20: 'Home timeline Kryptos node · Affine a=7 b=11'
};

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

let touched = 0, spans = 0;
for (const f of files) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('class="egg-hint"')) continue;
  const before = s;
  /* 每个 EGG 注释标记其前一个最近的 egg-hint span */
  s = s.replace(/<span class="egg-hint"([^>]*)>([\s\S]*?)<\/span>(\s*<!--\s*EGG:(e\d+):[^>]*-->)?/g,
    (m, attrs, text, tail, id) => {
      if (!id || !EN[id] || text.includes('class="egg-en"')) return m;
      spans++;
      return '<span class="egg-hint" data-egg="' + id + '">'
        + '<span class="egg-zh">' + text.trim() + '</span>'
        + '<span class="egg-en">' + EN[id] + '</span></span>' + tail;
    });
  if (s !== before) {
    fs.writeFileSync(p, s, 'utf8');
    touched++;
    console.log('fixed', f);
  }
}
console.log('done:', touched, 'files,', spans, 'spans bilingualized');
