/* 发现页渲染（数据驱动，动态数字；从 discover.html 外置） */
(function () {
  function render() {

    try { localStorage.setItem('arcade_discover_viewed', '1'); } catch (e) {}
    var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
    function L(o) { return isEn ? o.en : o.zh; }
    function N(arr) { return (window[arr] || []).length; }
    var GL = window.GLOSSARY || [];
    var CARDS = [
      { ic: '🎮', n: N('GAMES'), t: L({ zh: '游戏厅', en: 'Arcade' }),
        d: L({ zh: '从凯撒到量子密钥：旗舰深度体验、长局养成、每日一题——一整座破译街机城。', en: 'From Caesar to quantum keys: flagship deep dives, long-form strategy and daily challenges — a whole arcade city.' }),
        href: 'games.html', mini: L({ zh: '搜索 · 分类 · 收藏 · 📅 每日破译', en: 'Search · filter · favorites · daily challenges' }) },
      { ic: '🏮', n: null, t: L({ zh: '中华密码史', en: 'Chinese Crypto' }),
        d: L({ zh: '从阴符、字验、反切码到半部电台与国密四件套——中国三千年密写与保密的专属航线。', en: 'Yin-fu, zi-验, fanqie — then half-radio ciphers and the SM family: the Chinese line of secrecy.' }),
        href: 'zh-crypto.html', mini: L({ zh: '专题页 · 古代 → 红军 → 国密', en: 'Special · ancient → Red Army → SM' }) },
      { ic: '🧰', n: null, t: L({ zh: '密码工具箱', en: 'Crypto Toolkit' }),
        d: L({ zh: '现实世界正在用的工具与标准：TLS 1.3、SSH ed25519、OpenPGP、Passkeys、argon2id、国密四件套与后量子标准——每一条都能顺手练。', en: 'The tools and standards in real use today: TLS 1.3, SSH ed25519, OpenPGP, Passkeys, argon2id, the SM family and post-quantum — each one drillable on site.' }),
        href: 'toolkit.html', mini: L({ zh: '专题页 · 命令 · 标准号 · 动手练', en: 'Special · commands · standard numbers · hands-on' }) },
      { ic: '📜', n: N('STORIES'), t: L({ zh: '编年史', en: 'Chronicles' }),
        d: L({ zh: '十二个时代的密码史：从罗塞塔石碑到后量子标准，正文、冷知识、挑战与史料全部带出处。', en: 'Twelve epochs of crypto history: Rosetta to post-quantum, with facts, challenges and sourced notes.' }),
        href: 'stories.html', mini: L({ zh: '解密真相 · 章节通关 · 密钥字母收集', en: 'Decrypt the truth · chapter mastery · key letters' }) },
      { ic: '📖', n: GL.length, t: L({ zh: '密码学词典', en: 'Glossary' }),
        d: L({ zh: '每一个术语都能玩、能读、能查：词条联动游戏与章节，再加上 12 组「易混辨析」一眼分清。', en: 'Every term maps to a game or chapter — plus 12 "confusing pairs, compared" cards.' }),
        href: 'glossary.html', mini: L({ zh: '术语卡 · 出处行 · 搜索', en: 'Term cards · sources · search' }) },
      { ic: '👤', n: N('PEOPLE'), t: L({ zh: '人物志', en: 'People' }),
        d: L({ zh: '近九十位破译与造码者的时间线：生平、冷知识、名言与传记出处，一图看清三千年棋手。', en: 'Nearly ninety codebreakers and cipher-makers on one timeline — bios, facts, quotes, sources.' }),
        href: 'people.html', mini: L({ zh: '时间线 · 人物档案 · 关系图', en: 'Timeline · profiles · relationship map' }) },
      { ic: '📎', n: N('ARTIFACTS'), t: L({ zh: '密件册', en: 'Artifacts' }),
        d: L({ zh: '近五十件改变历史的原件与档案：破解对应游戏即可解锁全文，馆藏出处一应俱全。', en: 'Nearly fifty originals and archives that changed history: unlock each with its game, sources included.' }),
        href: 'artifacts.html', mini: L({ zh: '解锁系统 · 原文影像 · 真实史料', en: 'Unlock system · original texts · real archives' }) },
      { ic: '🛡️', n: null, t: L({ zh: '协议实验室', en: 'Protocol Lab' }),
        d: L({ zh: '近二十个可以上手的现代密码学演示：TLS 握手、DH 中间人、OTP 复用灾难、DH 参数验证……', en: 'Nearly twenty hands-on modern crypto demos: TLS handshake, DH MITM, OTP reuse, DH parameter checks…' }),
        href: 'protocols.html', mini: L({ zh: '18+ 演示 · 全部本地计算 · 双语', en: '18+ demos · all local · bilingual' }) },
      { ic: '🧪', n: null, t: L({ zh: '破译工坊', en: 'Workshop' }),
        d: L({ zh: '十八种算法的真机操作：加密、自动破解、模式实验室与隐写工坊，附算法参考。', en: 'Eighteen real algorithms: encrypt, auto-crack, mode lab, stego workshop — with references.' }),
        href: 'workshop.html', mini: L({ zh: '18+ 算法 · 彩蛋收集 · 本地运行', en: '18+ algorithms · egg hunt · fully local' }) },
      { ic: '🧠', n: null, t: L({ zh: '测验场', en: 'Quiz' }),
        d: L({ zh: '四个难度段位、每轮随机十题，答完评出你的密码学段位；错题自动进错题本。', en: 'Four tiers, ten random questions per round — earn your crypto rank; misses go to the wrong-book.' }),
        href: 'quiz.html', mini: L({ zh: '240+ 题 · 8 段位 · 错题回顾', en: '240+ questions · 8 ranks · wrong review' }) },
      { ic: '🗺️', n: null, t: L({ zh: '世界地图', en: 'World Map' }),
        d: L({ zh: '把三千年密码史放进一张世界地图：每条经纬都是一次加密与一次破译。', en: 'Three millennia of crypto plotted on one world map — every point an encryption and a break.' }),
        href: 'map.html', mini: L({ zh: '60+ 坐标 · 章节联动', en: '60+ coordinates · chapter links' }) },
      { ic: '⏱️', n: null, t: L({ zh: '时间线', en: 'Timeline' }),
        d: L({ zh: '公元前 1500 年至今的大事年表，与编年史、人物志、密件册互相咬合。', en: 'From 1500 BC to today, interlocked with chronicles, people and artifacts.' }),
        href: 'stories.html#timeline', mini: L({ zh: '大事记 · 双向跳转', en: 'Milestones · cross links' }) },
      { ic: '🎯', n: null, t: L({ zh: '学习路径', en: 'Path' }),
        d: L({ zh: '二十四天从零到专家：每天一个主题、一款游戏、一次测验，走完整个密码学地图。', en: 'Twenty-four days from zero to expert: one theme, one game, one quiz per day.' }),
        href: 'path.html', mini: L({ zh: '24 天 · 三档难度', en: '24 days · three tracks' }) },
      { ic: '📊', n: null, t: L({ zh: '档案页', en: 'Profile' }),
        d: L({ zh: '你的破译档案：成就徽章、每日连破、缓存命中率、错题本与你走过的每一步。', en: 'Your profile: achievements, daily streaks, cache stats, wrong-book and every step you took.' }),
        href: 'stats.html', mini: L({ zh: '成就近三十枚 · 全部本地记录', en: 'Nearly 30 achievements · all local' }) }
    ];
    var grid = document.getElementById('dc-grid');
    if (grid) {
      grid.innerHTML = CARDS.map(function (c) {
        return '<a class="dc-card" href="' + c.href + '">' +
          '<div class="dc-ic">' + c.ic + '</div>' +
          (c.n !== null ? '<div class="dc-n">' + c.n + '</div>' : '') +
          '<div class="dc-t">' + c.t + '</div>' +
          '<div class="dc-d">' + c.d + '</div>' +
          '<div class="dc-mini">' + c.mini + '</div></a>';
      }).join('');
    }
    var PATHS = [
      { b: L({ zh: '🌱 零基础路线', en: '🌱 From scratch' }),
        p: L({ zh: '从编年史第 0 章「破译的黎明」开始，玩凯撒与频率分析，读词典基础词条，再挑战 L1 级入门测验。', en: 'Start with Chapter 0 "The Dawn of Decipherment", play Caesar and frequency analysis, read basic glossary terms, then try the L1 quiz.' }),
        href: 'story.html?id=dawn', go: L({ zh: '去第 0 章 →', en: 'Go to Chapter 0 →' }) },
      { b: L({ zh: '🕵️ 破译者路线', en: '🕵️ Codebreaker track' }),
        p: L({ zh: '直接挑战旗舰：Enigma→Bombe 破译课、ADFGVX 一战电波战、紫密与中途岛，然后进工坊亲手加密破解。', en: 'Go flagship: Enigma→Bombe, the ADFGVX radio war, Purple and Midway — then hands-on in the workshop.' }),
        href: 'games.html', go: L({ zh: '去游戏厅 →', en: 'To the Arcade →' }) },
      { b: L({ zh: '💎 专家路线', en: '💎 Expert track' }),
        p: L({ zh: '公钥、国密、后量子与隐私计算：DH 握手场、国密网关、百万富翁协议、BB84 与格密码，再答大师级题。', en: 'Public-key, SM-family, post-quantum and MPC: DH Handshake, GM Gateway, Millionaires, BB84 and lattices — then the master quiz.' }),
        href: 'quiz.html', go: L({ zh: '去测验场 →', en: 'To the Quiz →' }) }
    ];
    var paths = document.getElementById('dc-paths');
    if (paths) {
      paths.innerHTML = PATHS.map(function (p) {
        return '<div class="dc-path"><b>' + p.b + '</b><p>' + p.p + '</p><a class="dc-go" href="' + p.href + '">' + p.go + '</a></div>';
      }).join('');
    }
  }
  window.DISCOVER = { render: render };
  render();
})();
