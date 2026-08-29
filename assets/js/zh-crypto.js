/* 中华密码史专题页：聚合古代暗号/红军密码/国密当代 + 曾希圣新人物
   渲染外置，动态数字，双语。 */
(function () {
  function render() {
    var isEn = window.Arcade && Arcade.i18n && Arcade.i18n.getLang() === 'en';
    function L(o) { return isEn ? o.en : o.zh; }
    var host = document.getElementById('zc-root');
    if (!host) return;
    var ERA = [
      {
        t: L({ zh: '🏮 古代暗号：兵符与诗谜', en: '🏮 Ancient codes: totems and poem puzzles' }),
        d: L({ zh: '从《六韬》的阴符、北宋《武经总要》的字验，到明将戚继光的反切码——中国的密写传统与兵家军情紧紧绑在一起。', en: 'From the Yin-fu tallies of the Six Secret Teachings and the Song-dynasty zi-yan codebook to Qi Jiguang’s fanqie code — Chinese secrecy was welded to military affairs.' }),
        links: [
          { t: L({ zh: '🀄 反切码军情室（游戏）', en: '🀄 Fanqie Code Room (game)' }), href: 'games/fanqie/' },
          { t: L({ zh: '📖 阴符与字验（词典）', en: '📖 Yin-fu & zi-yan (glossary)' }), href: 'glossary.html' },
          { t: L({ zh: '📜 阿拉伯-华夏章（编年史）', en: '📜 Chronicle: Arab walls to China' }), href: 'story.html?id=arab' }
        ]
      },
      {
        t: L({ zh: '📻 半部电台起家：红军密码', en: '📻 From half a radio: Red Army ciphers' }),
        d: L({ zh: '1930 年龙冈战斗缴获的半部电台，发展出曾希圣领导的无线电侦察：破译国军电报、还原作战序列——与世界上任何一支同时代信号情报部队相比毫不逊色。', en: 'The half radio from Longgang (1930) grew into Zeng Xisheng’s signals-intelligence corps: breaking Kuomintang traffic and reconstructing order-of-battle — a match for any contemporary SIGINT force.' }),
        links: [
          { t: L({ zh: '👤 曾希圣（人物志）', en: '👤 Zeng Xisheng (people)' }), href: 'people.html' },
          { t: L({ zh: '📡 半部电台（词典）', en: '📡 Half-a-Radio (glossary)' }), href: 'glossary.html' },
          { t: L({ zh: '✉️ 密件册', en: '✉️ Artifacts' }), href: 'artifacts.html' }
        ]
      },
      {
        t: L({ zh: '🔐 当代：国密与密码法', en: '🔐 Today: SM family and the Cryptography Law' }),
        d: L({ zh: 'SM4/SM3/SM2/SM9 国密四件套走进政务与金融，《密码法》（2020）立起商用密码的检测认证体系——中国密码学从“用标准”走向“立标准”。', en: 'SM4/SM3/SM2/SM9 now run government and finance; the Cryptography Law (2020) built the certification regime — Chinese crypto moved from using standards to making them.' }),
        links: [
          { t: L({ zh: '🇨🇳 国密网关（游戏）', en: '🇨🇳 GM Gateway (game)' }), href: 'games/gm-gateway/' },
          { t: L({ zh: '📖 国密术语（词典）', en: '📖 SM terms (glossary)' }), href: 'glossary.html' },
          { t: L({ zh: '📊 测验（国密题）', en: '📊 Quiz (SM questions)' }), href: 'quiz.html' }
        ]
      }
    ];
    var html = ERA.map(function (e) {
      return '<div class="zc-era"><div class="zc-t">' + e.t + '</div><p class="zc-d">' + e.d + '</p><div class="zc-links">' +
        e.links.map(function (lk) { return '<a class="zc-l" href="' + lk.href + '">' + lk.t + '</a>'; }).join('') +
        '</div></div>';
    }).join('');
    host.innerHTML = html;
  }
  window.ZHCRYPTO = { render: render };
})();
