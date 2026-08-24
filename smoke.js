/* 全站 114 款游戏通用冒烟（站点质量门禁，随代码长期维护）
   逐个模拟页面加载：storage → input → loop → extras → rank → plot → shell → game
   触发初始化 + GAME_RESTART，捕获运行期错误。 */
const fs = require('fs');
const vm = require('vm');

const RESULTS = [];
function makeClassList() {
  const s = {};
  return {
    add: c => { s[c] = 1; }, remove: c => { delete s[c]; },
    toggle: (c, f) => { if (f === undefined) { if (s[c]) delete s[c]; else s[c] = 1; } else if (f) s[c] = 1; else delete s[c]; },
    contains: c => !!s[c]
  };
}
function makeCtx() {
  const t = {};
  return new Proxy(t, {
    get(tr, p) {
      if (p in tr) return tr[p];
      if (p === 'measureText') return function () { return { width: 10 }; };
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { return { addColorStop: function () {} }; };
      if (p === 'createPattern') return function () { return {}; };
      if (p === 'getImageData') return function () { return { data: new Uint8ClampedArray(0), width: 0, height: 0 }; };
      if (p === 'putImageData') return function () {};
      return function () {};
    },
    set(tr, p, v) { tr[p] = v; return true; }
  });
}
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), children: [],
    style: { setProperty: function () {}, cssText: '', getPropertyValue: function () { return ''; } },
    classList: makeClassList(), attrs: {}, _html: '',
    setAttribute: function (k, v) { this.attrs[k] = v; },
    getAttribute: function (k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
    removeAttribute: function (k) { delete this.attrs[k]; },
    appendChild: function (c) { this.children.push(c); return c; },
    insertBefore: function (c, ref) { const i = this.children.indexOf(ref); if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
    removeChild: function () {}, replaceChild: function () {},
    addEventListener: function () {}, removeEventListener: function () {},
    querySelector: function () { return makeEl('div'); },
    querySelectorAll: function () { return []; },
    getElementsByTagName: function () { return []; },
    getContext: function () { return makeCtx(); },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 200, height: 200 }; },
    focus: function () {}, blur: function () {}, click: function () {},
    setPointerCapture: function () {}, releasePointerCapture: function () {},
    value: '', textContent: '', href: '', title: '', type: '', placeholder: '',
    checked: false, className: '', disabled: false, id: '', offsetWidth: 0, offsetHeight: 0,
    width: 300, height: 150, tabIndex: 0, alt: '', src: '', dataset: {}
  };
  Object.defineProperty(el, 'innerHTML', {
    get: function () { return this._html; },
    set: function (v) { this._html = String(v); this.children = []; }
  });
  Object.defineProperty(el, 'firstChild', { get: function () { return this.children[0] || null; } });
  return el;
}

function makeLocalStorage() {
  const store = {}, keys = [];
  return {
    getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { if (!Object.prototype.hasOwnProperty.call(store, k)) keys.push(k); store[k] = String(v); },
    removeItem: k => { delete store[k]; const i = keys.indexOf(k); if (i >= 0) keys.splice(i, 1); },
    key: i => keys[i] || null,
    get length() { return keys.length; }
  };
}

function smokeGame(id, lang) {
  const jsPath = 'games/' + id + '/' + id + '.js';
  const htmlPath = 'games/' + id + '/index.html';
  if (!fs.existsSync(jsPath)) return { id, fail: '缺少 ' + jsPath };
  const html = fs.readFileSync(htmlPath, 'utf8');
  const bm = (html.match(/data-best-mode="([^"]+)"/) || [])[1] || 'max';
  const gtitle = (html.match(/data-game-title="([^"]+)"/) || [])[1] || id;

  const docs = {};
  const rafQueue = [];
  const timers = [];
  let timerBudget = 400;
  const documentStub = {
    getElementById: id2 => { if (!docs[id2]) docs[id2] = makeEl('div'); return docs[id2]; },
    createElement: t => makeEl(t),
    createElementNS: () => makeEl(),
    createTextNode: () => ({ textContent: '' }),
    querySelector: () => makeEl('div'),
    querySelectorAll: () => [],
    getElementsByTagName: () => [],
    body: null,
    documentElement: makeEl('html'),
    hidden: false,
    addEventListener: function () {}, removeEventListener: function () {},
    write: function () {},
    activeElement: null,
    title: ''
  };
  documentStub.body = Object.assign(makeEl('body'), {
    getAttribute: k => ({ 'data-game-id': id, 'data-game-title': gtitle, 'data-best-mode': bm }[k] || null)
    // insertBefore/appendChild 保留 makeEl 默认实现，让 shell 顶栏等 createElement 节点挂入 children 供渲染检测
  });
  const win = {
    document: documentStub,
    localStorage: (function () {
      const ls = makeLocalStorage();
      if (lang) ls.setItem('arcade_lang', lang); // 双语冒烟：预置语言
      return ls;
    })(),
    navigator: { maxTouchPoints: 0, userAgent: 'node-smoke', vibrate: function () {} },
    location: { href: '', reload: function () {}, search: '' },
    matchMedia: () => ({ matches: false, addListener: function () {}, removeListener: function () {} }),
    requestAnimationFrame: cb => { rafQueue.push(cb); return rafQueue.length; },
    cancelAnimationFrame: function () {},
    addEventListener: function () {}, removeEventListener: function () {},
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    setTimeout: function (cb) { timers.push(cb); return timers.length; },
    clearTimeout: function () {}, setInterval: function () { return 0; }, clearInterval: function () {},
    performance: { now: () => Date.now() },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    AudioContext: undefined, webkitAudioContext: undefined,
    Event: function () {}, KeyboardEvent: function () {}, MouseEvent: function () {}, TouchEvent: function () {},
    screen: {}, self: null
  };
  win.self = win;
  win.window = win;
  win.__arcadeExtrasLoaded = true;
  documentStub.defaultView = win;

  const sandbox = vm.createContext(win);
  const load = (file) => { vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); };

  const errors = [];
  try {
    load('assets/js/core/storage.js');
    load('assets/js/core/i18n.js');      // shell 注入块前两个文件，冒烟显式加载（document.write stub 吞掉注入）
    load('assets/js/core/i18n-dict.js');
    // 游戏内文案字典（按游戏拆分；无 gs 键的游戏如 tank 跳过）
    const gsPath = 'games/' + id + '/' + id + '-i18n.js';
    if (fs.existsSync(gsPath)) load(gsPath);
    load('assets/js/core/input.js');
    load('assets/js/core/loop.js');
    load('assets/js/core/extras.js');
    load('assets/js/core/music.js');
    load('assets/js/rank.js');
    load('assets/js/plot.js');
    load('assets/js/shell.js');
    load(jsPath);
    // 排空延迟初始化（setTimeout 同步执行，限预算防死循环）
    let guard = 0;
    while (timers.length && guard < timerBudget) {
      const cb = timers.shift();
      guard++;
      try { cb(); } catch (e) { errors.push('timer: ' + e.message); }
    }
    // 触发全局重开路径
    if (typeof win.GAME_RESTART === 'function') {
      try { win.GAME_RESTART(); } catch (e) { errors.push('restart: ' + e.message); }
    }
    // 触发一帧动画（跑 update/render 路径一次）
    if (rafQueue.length) {
      try { rafQueue.shift()(16); } catch (e) { errors.push('frame: ' + e.message); }
    }
    // 双语冒烟：扫描注入的 HTML 找未替换占位符 {x}、字典缺键回退（gs./gt. 键名残留）
    // 与运行时渲染污染（undefined / NaN / [object Object] 拼进用户可见文本）
    if (lang) {
      const collect = (el, out) => {
        if (!el || typeof el !== 'object') return;
        if (typeof el._html === 'string') out.push(el._html);
        if (typeof el.textContent === 'string' && el.textContent) out.push(el.textContent);
        if (Array.isArray(el.children)) el.children.forEach(c => collect(c, out));
      };
      const texts = [];
      // 收集：body 树（shell 顶栏/quickbar 等 createElement 节点）+ getElementById 节点
      const roots = [documentStub.body];
      Object.keys(docs).forEach(k => roots.push(docs[k]));
      roots.forEach(r => collect(r, texts));
      const joined = texts.join('\n');
      const ph = joined.match(/\{[a-z]+\}/g);
      if (ph) errors.push('placeholder-residue: ' + [...new Set(ph)].slice(0, 6).join(','));
      const kb = joined.match(/(?:gs|gt)\.[a-zA-Z0-9-]+\.[a-zA-Z0-9]+/g);
      if (kb) errors.push('key-fallback: ' + [...new Set(kb)].slice(0, 6).join(','));
      // 英文版中文残留检测（白名单：语言按钮的「中」/「中文」提示；仅 en 模式）
      if (lang === 'en') {
        const cjk = joined.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
        if (cjk) {
          const real = [...new Set(cjk)].filter(s => s !== '中' && s !== '中文');
          if (real.length) errors.push('chinese-residue: ' + real.slice(0, 6).join(','));
        }
      }
      const poll = joined.match(/\b(?:undefined|NaN|\[object Object\])\b/g);
      if (poll) errors.push('render-pollution: ' + [...new Set(poll)].slice(0, 8).join(','));
    }
  } catch (e) {
    errors.push('load: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  }
  return { id, ok: errors.length === 0, errors: errors };
}

/* 站点页面冒烟：index.html（大厅）/ stats.html（档案）/ 404.html
   验证页面脚本加载 + 初始化 + 静态文案应用 + 渲染无污染 */
function smokePage(page, lang) {
  const files = {
    index: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js',
            'assets/js/core/extras.js', 'assets/js/core/music.js', 'assets/js/games.js',
            'assets/js/rank.js', 'assets/js/stories.js',
            'assets/js/nav.js', 'assets/js/home.js'],
    game: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js',
           'assets/js/core/extras.js', 'assets/js/core/music.js', 'assets/js/games.js',
           'assets/js/stats.js', 'assets/js/rank.js', 'assets/js/plot.js', 'assets/js/stories.js',
           'assets/js/nav.js', 'assets/js/lobby.js'],
    stats: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
            'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/stats.js',
            'assets/js/rank.js', 'assets/js/plot.js', 'assets/js/stories.js', 'assets/js/quiz.js',
            'assets/js/chapter-quiz.js', 'assets/js/morse-listen.js', 'assets/js/save-manager.js', 'assets/js/nav.js'],
    notfound: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js'],
    stories: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
              'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/stories.js',
              'assets/js/rank.js', 'assets/js/nav.js'],
    people: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js',
             'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/stories.js', 'assets/js/nav.js'],
    artifacts: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js',
                'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/stories.js', 'assets/js/nav.js'],
    story: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
            'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/stories.js',
            'assets/js/chapter-quiz.js', 'assets/js/rank.js', 'assets/js/plot.js', 'assets/js/nav.js'],
    glossary: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
               'assets/js/core/extras.js', 'assets/js/nav.js'],
    quiz: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
           'assets/js/core/extras.js', 'assets/js/quiz.js', 'assets/js/nav.js'],
    duel: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
           'assets/js/core/extras.js', 'assets/js/quiz.js', 'assets/js/duel.js', 'assets/js/nav.js'],
    morse: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
            'assets/js/core/extras.js', 'assets/js/morse-listen.js', 'assets/js/nav.js'],
    map: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
          'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/stories.js', 'assets/js/map.js', 'assets/js/nav.js'],
    machine: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
              'assets/js/core/extras.js', 'assets/js/games.js', 'assets/js/machine.js', 'assets/js/nav.js'],
    quotes: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
             'assets/js/core/extras.js', 'assets/js/quotes.js', 'assets/js/nav.js'],
    workshop: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/storage.js',
               'assets/js/workshop.js', 'assets/js/nav.js'],
    path: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-story.js', 'assets/js/core/storage.js',
           'assets/js/games.js', 'assets/js/stories.js', 'assets/js/nav.js'],
    protocols: ['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-ui.js', 'assets/js/core/storage.js',
                'assets/js/core/extras.js', 'assets/js/protocols.js', 'assets/js/nav.js']
  };
  const ids = files[page];
  if (!ids) return { id: page, fail: '未知页面' };

  const docs = {};
  const rafQueue = [];
  const timers = [];
  const documentStub = {
    getElementById: id2 => { if (!docs[id2]) docs[id2] = makeEl('div'); return docs[id2]; },
    createElement: t => makeEl(t),
    createElementNS: () => makeEl(),
    createTextNode: () => ({ textContent: '' }),
    querySelector: () => makeEl('div'),
    querySelectorAll: () => [],
    getElementsByTagName: () => [],
    body: makeEl('body'),
    documentElement: makeEl('html'),
    hidden: false,
    addEventListener: function () {}, removeEventListener: function () {},
    write: function () {},
    activeElement: null,
    title: ''
  };
  const win = {
    document: documentStub,
    localStorage: (function () {
      const ls = makeLocalStorage();
      if (lang) ls.setItem('arcade_lang', lang);
      return ls;
    })(),
    navigator: { maxTouchPoints: 0, userAgent: 'node-smoke', vibrate: function () {} },
    location: { href: '', reload: function () {}, search: '' },
    matchMedia: () => ({ matches: false, addListener: function () {}, removeListener: function () {} }),
    requestAnimationFrame: cb => { rafQueue.push(cb); return rafQueue.length; },
    cancelAnimationFrame: function () {},
    addEventListener: function () {}, removeEventListener: function () {},
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    setTimeout: function (cb) { timers.push(cb); return timers.length; },
    clearTimeout: function () {}, setInterval: function () { return 0; }, clearInterval: function () {},
    performance: { now: () => Date.now() },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    AudioContext: undefined, webkitAudioContext: undefined,
    Event: function () {}, KeyboardEvent: function () {}, MouseEvent: function () {}, TouchEvent: function () {},
    screen: {}, self: null
  };
  win.self = win; win.window = win;
  documentStub.defaultView = win;

  const sandbox = vm.createContext(win);
  const load = (file) => { vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); };

  const errors = [];
  try {
    ids.forEach(load);
    // 页面内联脚本（index/stats 的 applyStatic + title + 渲染；404 的语言切换）
    if (page === 'index') {
      // home.js 加载时自动渲染旅程画卷；此处补 applyStatic + title
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'app.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }', sandbox);
    } else if (page === 'game') {
      // games.html 内联：lobby.js 已自动渲染；补 title
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = \'游戏厅\' + Arcade.i18n.t(\'app.titleSuffix\'); }', sandbox);
    } else if (page === 'people') {
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'nav.people\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'document.getElementById(\'pp-count\').textContent = T(\'people.countF\').replace(\'{n}\', window.PEOPLE.length);' +
        'var tl = document.getElementById(\'pp-timeline\');' +
        'window.PEOPLE.forEach(function (pid) { var el = document.createElement(\'div\'); el.className = \'pp-tl-card\'; tl.appendChild(el); });', sandbox);
    } else if (page === 'artifacts') {
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'nav.artifacts\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var st = Arcade.stories;' +
        'document.getElementById(\'ar-count\').textContent = T(\'artifacts.countF\').replace(\'{u}\', st.artifactsCount()).replace(\'{t}\', window.ARTIFACTS.length);' +
        'var tl = document.getElementById(\'ar-timeline\');' +
        'window.ARTIFACTS.forEach(function (art) { var el = document.createElement(\'div\'); el.className = \'ar-item\'; tl.appendChild(el); });', sandbox);
    } else if (page === 'stats') {
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'app.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        // stats.html 完整内联渲染
        '(function () {' +
        '  if (!window.Arcade || !Arcade.stats || !Arcade.storage) return;' +
        '  var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        '  var res = Arcade.stats.check(); var env = res.env;' +
        '  document.getElementById(\'st-played\').textContent = env.played;' +
        '  document.getElementById(\'st-total\').textContent = env.total;' +
        '  var pct = env.total ? Math.round(env.played / env.total * 100) : 0;' +
        '  document.getElementById(\'st-bar\').style.width = pct + \'%\';' +
        '  document.getElementById(\'st-bar-pct\').textContent = pct + \'%\';' +
        '  document.getElementById(\'st-sub\').textContent = T(\'stats.pctNote\').replace(\'{p}\', pct);' +
        '  document.getElementById(\'st-achv-count\').textContent = T(\'stats.achvCount\').replace(\'{u}\', res.unlocked.length).replace(\'{t}\', res.list.length);' +
        '  var catBox = document.getElementById(\'st-cats\'); var html = \'\';' +
        '  (window.GAME_CATEGORIES || []).forEach(function (c) {' +
        '    var pc = env.perCat[c] || { total: 0, played: 0 };' +
        '    var p = pc.total ? Math.round(pc.played / pc.total * 100) : 0;' +
        '    html += \'<div class="st-cat">\' + T(\'cat.\' + c) + \' <span>\' + pc.played + \'/\' + pc.total + \'</span></div>\';' +
        '  });' +
        '  catBox.innerHTML = html;' +
        '  document.getElementById(\'st-today\').textContent = env.todaySolved;' +
        '  document.getElementById(\'st-today-lbl\').textContent = T(\'stats.today\') + \' / \' + (env.dailyCount || 0);' +
        '  document.getElementById(\'st-streak\').textContent = env.streak;' +
        '  document.getElementById(\'st-daily-total\').textContent = env.dailyTotal;' +
        '  if (Arcade.rank) {' +
        '    var r = Arcade.rank.current(); var xp = Arcade.rank.xp();' +
        '    document.getElementById(\'st-rank-icon\').textContent = r.icon;' +
        '    document.getElementById(\'st-rank-name\').textContent = T(\'rank.\' + r.id + \'.n\');' +
        '    document.getElementById(\'st-rank-xp\').textContent = r.next ? T(\'lobby.rankNext\').replace(\'{x}\', xp).replace(\'{n}\', r.next.min) : T(\'lobby.rankMax\').replace(\'{x}\', xp);' +
        '    document.getElementById(\'st-rank-bar\').style.width = Arcade.rank.progress() + \'%\';' +
        '  }' +
        '  if (window.QUIZ) {' +
        '    var qz = window.QUIZ.lastResult();' +
        '    document.getElementById(\'st-quiz-icon\').textContent = qz.icon;' +
        '    document.getElementById(\'st-quiz-rank\').textContent = qz.zh;' +
        '    document.getElementById(\'st-quiz-line\').textContent = qz.total ? qz.score + \' / \' + qz.total : T(\'quiz.resultSub\');' +
        '  }' +
        '  var bbx = document.getElementById(\'st-badges\');' +
        '  if (bbx) {' +
        '    var bd = [];' +
        '    if (window.QUIZ) { var q2 = window.QUIZ.lastResult(); bd.push({on:q2.total>0, icon:q2.icon, name:q2.zh, desc:String(q2.score)}); }' +
        '    if (window.MORSE_L) { var mb = window.MORSE_L.best(); bd.push({on:mb.total>0, icon:\'👂\', name:\'Morse\', desc:mb.score+\'/\'+mb.total}); }' +
        '    var bh = \'\';' +
        '    bd.forEach(function (b) { bh += \'<div class="achv\' + (b.on ? \' on\' : \'\') + \'">\' + b.icon + \'</div>\'; });' +
        '    bbx.innerHTML = bh;' +
        '  }' +
        '  var catsTotal = (window.GAME_CATEGORIES || []).length;' +
        '  document.getElementById(\'st-coll-cats\').textContent = env.catsCovered + \'/\' + catsTotal;' +
        '  document.getElementById(\'st-coll-games\').textContent = env.played + \'/\' + env.total;' +
        '  document.getElementById(\'st-coll-flags\').textContent = env.flagshipPlayed + \'/\' + (env.flagshipTotal || 8);' +
        '  document.getElementById(\'st-coll-cats-bar\').style.width = (catsTotal ? Math.round(env.catsCovered / catsTotal * 100) : 0) + \'%\';' +
        '  document.getElementById(\'st-coll-games-bar\').style.width = (env.total ? Math.round(env.played / env.total * 100) : 0) + \'%\';' +
        '  document.getElementById(\'st-coll-flags-bar\').style.width = ((env.flagshipTotal || 8) ? Math.round(env.flagshipPlayed / (env.flagshipTotal || 8) * 100) : 0) + \'%\';' +
        '  if (window.Arcade && Arcade.stories && window.STORIES) {' +
        '    var stTotal = Arcade.stories.getAll().length;' +
        '    var stRead = Arcade.stories.readCount(); var stLett = Arcade.stories.letterCount(); var stArt = Arcade.stories.artifactsCount();' +
        '    var stArtTotal = (window.ARTIFACTS || []).length;' +
        '    document.getElementById(\'st-ch-read\').textContent = stRead + \'/\' + stTotal;' +
        '    document.getElementById(\'st-ch-letters\').textContent = stLett + \'/\' + stTotal;' +
        '    document.getElementById(\'st-ch-arts\').textContent = stArt + \'/\' + stArtTotal;' +
        '    document.getElementById(\'st-ch-read-bar\').style.width = (stTotal ? Math.round(stRead / stTotal * 100) : 0) + \'%\';' +
        '    document.getElementById(\'st-ch-letters-bar\').style.width = (stTotal ? Math.round(stLett / stTotal * 100) : 0) + \'%\';' +
        '    document.getElementById(\'st-ch-arts-bar\').style.width = (stArtTotal ? Math.round(stArt / stArtTotal * 100) : 0) + \'%\';' +
        '  }' +
        '  var achvBox = document.getElementById(\'st-achv\'); var ah = \'\';' +
        '  res.list.forEach(function (a) {' +
        '    var on = res.unlocked.indexOf(a.id) >= 0;' +
        '    ah += \'<div class="achv\' + (on ? \' on\' : \'\') + \'"><div class="achv-icon">\' + a.icon + \'</div><div class="achv-name">\' + T(\'achv.\' + a.id + \'.n\') + \'</div></div>\';' +
        '  });' +
        '  achvBox.innerHTML = ah;' +
        '})()', sandbox);
    } else if (page === 'stories') {
      // stories.html 内联渲染：进度 + 时间轴
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'st.pageTitle\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var stories = Arcade.stories;' +
        'document.getElementById(\'st-hero-sub\').textContent = T(\'st.heroSub\');' +
        'document.getElementById(\'st-progress-lbl\').textContent = T(\'st.progressF\').replace(\'{r}\', stories.readCount()).replace(\'{t}\', stories.getAll().length);' +
        'var tl = document.getElementById(\'st-timeline\');' +
        'stories.getAll().forEach(function (ch) { var a = document.createElement(\'a\'); a.className = \'st-chapter\'; a.href = \'story.html?id=\' + ch.id; tl.appendChild(a); });', sandbox);
    } else if (page === 'story') {
      // story.html 内联渲染：单章（bletchley 第 5 章）
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var stories = Arcade.stories;' +
        'var ch = stories.get(\'bletchley\');' +
        'if (ch) { stories.markRead(ch.id); document.getElementById(\'sy-prog\').textContent = T(\'st.chapterF\').replace(\'{n}\', 6).replace(\'{t}\', stories.getAll().length); }', sandbox);
    } else if (page === 'quiz') {
      // quiz.html 内联渲染：开始屏 + 结果屏（模拟答完一轮）
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'quiz.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var Q = window.QUIZ;' +
        'document.getElementById(\'qz-pool\').textContent = Q.BANK.length + \' questions\';' +
        'document.getElementById(\'qz-root\').innerHTML = \'<button class="btn" id="qz-go">\' + T(\'quiz.start\') + \'</button>\';' +
        'var go = document.getElementById(\'qz-go\');' +
        'go.addEventListener(\'click\', function () { var list = Q.draw10(); var r = Q.recordResult(list.length, list.length); });' +
        'go.click();', sandbox);
    } else if (page === 'duel') {
      // duel.html 内联渲染：模拟双人各答一轮
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'duel.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var Q = window.QUIZ;' +
        'var D = window.DUEL;' +
        'var root = document.getElementById(\'dz-root\');' +
        'root.innerHTML = \'<button class="btn" id="dz-go">\' + T(\'duel.start\') + \'</button>\';' +
        'var d = new D.Duel(root, Q);' +
        'd.state = { list: Q.draw10(), idx: 0, done: false, p: [{score:0,answered:false,last:-1,finishAt:0},{score:0,answered:false,last:-1,finishAt:0}] };' +
        'd.render();', sandbox);
    } else if (page === 'morse') {
      // morse-listen.html 内联渲染：开始屏 + 一轮模拟
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'morseL.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var M = window.MORSE_L;' +
        'var root = document.getElementById(\'ml-root\');' +
        'root.innerHTML = \'<button class="btn" id="ml-go">\' + T(\'morseL.start\') + \'</button>\';' +
        'var list = M.pickLetters(10);' +
        'M.record(9, 10);' +
        'var b = M.best();' +
        'root.innerHTML += \'<div>\' + b.score + \'/\' + b.total + \'</div>\';', sandbox);
    } else if (page === 'map') {
      // map.html 内联渲染：地图 + 详情 + 事件列表
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'map.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var M = window.CRYPTO_MAP;' +
        'document.getElementById(\'mp-count\').textContent = M.EVENTS.length + \' events\';' +
        'document.getElementById(\'mp-map\').innerHTML = \'<svg class="mp-svg"></svg>\';' +
        'document.getElementById(\'mp-detail\').innerHTML = \'<div class="mp-d-empty">empty</div>\';' +
        'var lh = \'\';' +
        'M.EVENTS.forEach(function (ev) { lh += \'<button class="mp-chip">\' + ev.zh + \'</button>\'; });' +
        'document.getElementById(\'mp-list\').innerHTML = lh;', sandbox);
    } else if (page === 'machine') {
      // machine.html 内联渲染：导航 + 首台机器卡
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'cm.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var M = window.MACHINE_MUSEUM;' +
        'var nav = document.getElementById(\'cm-nav\');' +
        'M.MACHINES.forEach(function (m) { nav.innerHTML += \'<button>\' + m.icon + \'</button>\'; });' +
        'var c = document.getElementById(\'cm-card\');' +
        'c.innerHTML = \'<div class="cm-card">\' + M.MACHINES[0].name.zh + \'</div>\';', sandbox);
    } else if (page === 'quotes') {
      // quotes.html 内联渲染：标签 + 名言网格
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'quotes.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'var T = Arcade.i18n ? Arcade.i18n.t : function (k) { return k; };' +
        'var Q = window.QUOTES;' +
        'document.getElementById(\'qt-count\').textContent = Q.QUOTES.length + \' quotes\';' +
        'document.getElementById(\'qt-tags\').innerHTML = \'<button class="qt-tag on">All</button>\';' +
        'var h = \'\';' +
        'Q.QUOTES.forEach(function (q) { h += \'<div class="qt-item">\' + q.zh + \'</div>\'; });' +
        'document.getElementById(\'qt-grid\').innerHTML = h;', sandbox);
    } else if (page === 'protocols') {
      // protocols.html：六大演示初始化（stub DOM 下全跑一遍防运行期异常）
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = Arcade.i18n.t(\'pl.title\') + Arcade.i18n.t(\'app.titleSuffix\'); }' +
        'window.PROTOCOL_LAB.init();', sandbox);
    } else {
      vm.runInContext('if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); document.title = \'404\' + Arcade.i18n.t(\'app.titleSuffix\'); }', sandbox);
    }
    // 排空延迟初始化
    let guard = 0;
    while (timers.length && guard < 200) {
      const cb = timers.shift();
      guard++;
      try { cb(); } catch (e) { errors.push('timer: ' + e.message); }
    }
    // 渲染污染检测（含静态文案应用后）
    const texts = [];
    Object.keys(docs).forEach(k => {
      const el = docs[k];
      if (typeof el._html === 'string') texts.push(el._html);
      if (typeof el.textContent === 'string' && el.textContent) texts.push(el.textContent);
    });
    const joined = texts.join('\n');
    const ph = joined.match(/\{[a-z]+\}/g);
    if (ph) errors.push('placeholder-residue: ' + [...new Set(ph)].slice(0, 6).join(','));
    const kb = joined.match(/(?:gs|gt)\.[a-zA-Z0-9-]+\.[a-zA-Z0-9]+/g);
    if (kb) errors.push('key-fallback: ' + [...new Set(kb)].slice(0, 6).join(','));
    const poll = joined.match(/\b(?:undefined|NaN|\[object Object\])\b/g);
    if (poll) errors.push('render-pollution: ' + [...new Set(poll)].slice(0, 8).join(','));
    // title 断言（404 页标题 = '404' + app.titleSuffix，宽松匹配避免硬编码）
    const wantTitle = page === 'notfound' ? '404 · ' : null;
    if (wantTitle && documentStub.title.indexOf(wantTitle) !== 0) errors.push('title: got "' + documentStub.title + '"');
    // 页面渲染断言（防 stub 空跑：确认真的渲染出内容）
    if (page === 'index') {
      const jr = docs['home-journey'];
      const jrHtml = jr ? (jr._html || '') : '';
      if (jrHtml.indexOf('jp-node') < 0) errors.push('home-journey: not rendered (html=' + jrHtml.slice(0, 60) + ')');
      if (!docs['home-progress'] || !docs['home-progress']._html) errors.push('home-progress: empty');
      if (!docs['home-rank'] || !docs['home-rank']._html) errors.push('home-rank: empty');
      if (!docs['home-daily'] || !docs['home-daily']._html) errors.push('home-daily: empty');
    }
    if (page === 'game') {
      const root = docs['lobby-root'];
      // 统计所有卡片（递归 children 里的 .game-card）
      let cards = 0;
      const countCards = (el) => {
        if (!el || typeof el !== 'object') return;
        if (Array.isArray(el.children)) el.children.forEach(countCards);
        if (typeof el.className === 'string' && el.className.indexOf('game-card') >= 0) cards++;
      };
      countCards(root);
      const sectionCount = root ? root.children.length : 0;
      if (sectionCount < 8) errors.push('game-sections: got ' + sectionCount);
      if (cards < 95) errors.push('game-cards: got ' + cards);
      if (!docs['lobby-stats'] || !docs['lobby-stats'].textContent) errors.push('game-stats: empty');
    }
    if (page === 'protocols') {
      const rd = docs['pl-ready'];
      if (!rd || String(rd.textContent) !== '11') errors.push('pl-ready: got "' + (rd ? rd.textContent : 'null') + '" (want 11 demos)');
      const tls = docs['tls-steps'];
      if (!tls || !tls._html || tls._html.indexOf('pl-step') < 0) errors.push('tls-steps: not rendered');
    }
    if (page === 'people') {
      /* 人物志：纯时间轴，卡片数 = PEOPLE 数组长度（动态） */
      const tl = docs['pp-timeline'];
      const want = (sandbox.window && sandbox.window.PEOPLE) ? sandbox.window.PEOPLE.length : 0;
      if (!tl || tl.children.length !== want) errors.push('people-timeline: got ' + (tl ? tl.children.length : 0) + ' cards (want ' + want + ')');
    }
    if (page === 'artifacts') {
      const tl = docs['ar-timeline'];
      const want = (sandbox.window && sandbox.window.ARTIFACTS) ? sandbox.window.ARTIFACTS.length : 0;
      if (!tl || tl.children.length !== want) errors.push('artifacts-timeline: got ' + (tl ? tl.children.length : 0) + ' (want ' + want + ')');
    }
    if (page === 'stats') {
      const achv = docs['st-achv'];
      const achvHtml = achv ? (achv._html || '') : '';
      if (achvHtml.indexOf('achv') < 0) errors.push('stats-achv: not rendered (html=' + achvHtml.slice(0, 80) + ')');
    }
    if (page === 'stories') {
      const tl = docs['st-timeline'];
      if (!tl || tl.children.length !== 12) errors.push('stories-timeline: got ' + (tl ? tl.children.length : 0) + ' chapters');
    }
    if (page === 'story') {
      if (!docs['sy-prog'] || !docs['sy-prog'].textContent) errors.push('story: sy-prog not rendered');
    }
  } catch (e) {
    errors.push('load: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  }
  return { id: page, ok: errors.length === 0, errors: errors };
}

/* 从注册表取全部游戏 id */
const registry = fs.readFileSync('assets/js/games.js', 'utf8');
const ids = [];
const re = /id:\s*'([^']+)'/g;
let m;
while ((m = re.exec(registry)) !== null) ids.push(m[1]);

/* 静态 i18n 键校验：每款游戏 JS 中 T('xxx') 的静态引用键必须存在于字典（zh 与 en）
   防「前缀失配」类 bug（如 T('bc.xxx') 而字典是 gs.bacon.xxx —— 运行时显示键名） */
(function verifyI18nRefs() {
  try {
    const vm2 = require('vm');
    const sb2 = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
    sb2.window = sb2; sb2.Arcade = {}; sb2.Arcade.i18n = { dicts: { zh: {}, en: {} } };
    vm2.createContext(sb2);
    vm2.runInContext(fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8'), sb2, { filename: 'i18n-dict.js' });
    // 游戏内文案 gs.* 已按游戏拆分到 games/<id>/<id>-i18n.js，全部加载后校验
    fs.readdirSync('games').forEach(function (d) {
      const p = 'games/' + d + '/' + d + '-i18n.js';
      if (fs.existsSync(p)) vm2.runInContext(fs.readFileSync(p, 'utf8'), sb2, { filename: p });
    });
    const zhD = sb2.Arcade.i18n.dicts.zh, enD = sb2.Arcade.i18n.dicts.en;
    let total = 0, bad = 0;
    for (const id of ids) {
      const p = 'games/' + id + '/' + id + '.js';
      if (!fs.existsSync(p)) continue;
      const src = fs.readFileSync(p, 'utf8');
      const re = /T\('([^']+)'\)/g;
      let m;
      while ((m = re.exec(src))) {
        const key = m[1];
        if (!/^[a-z]+\.[a-zA-Z0-9.-]+$/.test(key)) continue; // 仅静态字面量键
        total++;
        if (zhD[key] === undefined || enD[key] === undefined) {
          bad++;
          console.log('I18N-MISSING ' + id + ' :: ' + key + (zhD[key] === undefined ? ' (zh缺)' : ' (en缺)'));
        }
      }
    }
    if (bad) {
      console.log('i18n 静态引用校验: ' + total + ' 条引用, ' + bad + ' 条缺键 —— 未通过');
      process.exit(1);
    }
    if (process.env.SMOKE_VERBOSE) console.log('i18n 静态引用校验: ' + total + ' 条全部存在');
  } catch (e) {
    console.log('i18n 静态引用校验异常: ' + e.message);
    process.exit(1);
  }
})();

/* 已知 stub 假阳性（真实浏览器中由 HTML 模板/原生行为提供，冒烟 stub 无法模拟） */
const KNOWN_ARTIFACTS = {
};

let pass = 0, known = 0;
const arg = process.argv[2];
const lang = arg === 'en' ? 'en' : (arg === 'zh' ? 'zh' : null);
const langLabel = lang ? (lang === 'en' ? 'English' : '中文') : '默认';

/* 页面冒烟：node smoke.js page [zh|en] */
if (arg === 'page' || arg === 'pages') {
  const pageLang = process.argv[3] === 'en' ? 'en' : (process.argv[3] === 'zh' ? 'zh' : null);
  const pageLabel = pageLang ? (pageLang === 'en' ? 'English' : '中文') : '默认';
  let pp = 0;
  for (const p of ['index', 'game', 'stats', 'notfound', 'stories', 'people', 'artifacts', 'story', 'glossary', 'quiz', 'duel', 'morse', 'map', 'machine', 'quotes', 'workshop', 'path', 'protocols']) {
    const r = smokePage(p, pageLang);
    if (r.ok) { pp++; console.log('PASS page:' + p); }
    else { console.log('FAIL page:' + p + ' :: ' + r.errors.join(' ;; ')); }
    RESULTS.push(r);
  }
  console.log('---');
  console.log('页面冒烟(' + pageLabel + '): ' + pp + '/18 通过');
  const pf = RESULTS.filter(r => !r.ok);
  console.log('失败清单: ' + (pf.length ? pf.map(f => f.id).join(', ') : '无'));
  process.exit(pf.length ? 1 : 0);
}

for (const id of ids) {
  const r = smokeGame(id, lang);
  if (r.ok) { pass++; console.log('PASS ' + r.id); }
  else if (KNOWN_ARTIFACTS[id]) { known++; console.log('KNOWN ' + r.id + ' :: ' + KNOWN_ARTIFACTS[id] + ' (' + r.errors.join(' ;; ') + ')'); }
  else { console.log('FAIL ' + r.id + ' :: ' + r.errors.join(' ;; ')); }
  RESULTS.push(r);
}
console.log('---');
console.log('冒烟结果(' + langLabel + '): ' + pass + '/' + ids.length + ' 通过' + (known ? '，' + known + ' 个已知 stub 假阳性' : ''));
const fails = RESULTS.filter(r => !r.ok && !KNOWN_ARTIFACTS[r.id]);
console.log('失败清单: ' + (fails.length ? fails.map(f => f.id).join(', ') : '无'));
process.exit(fails.length ? 1 : 0);
