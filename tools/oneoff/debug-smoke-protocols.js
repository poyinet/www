/* 复现 smoke 桩下 protocols init 的真实抛错 */
const fs = require('fs');
const vm = require('vm');
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), children: [],
    style: { setProperty: function () {}, cssText: '' },
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
    attrs: {}, _html: '',
    setAttribute: function (k, v) { this.attrs[k] = v; },
    getAttribute: function (k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
    appendChild: function (c) { return c; },
    addEventListener: function () {}, removeEventListener: function () {},
    querySelector: function () { return makeEl('div'); },
    querySelectorAll: function () { return []; },
    getContext: function () { return new Proxy({}, { get: function () { return function () {}; }, set: function () { return true; } }); },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 200, height: 200 }; },
    value: '', textContent: '', innerHTML: '', hidden: false, className: ''
  };
  return el;
}
const docs = {};
const sandbox = {
  window: {}, console: Math, Math: Math, Date: Date, JSON: JSON,
  document: {
    getElementById: function (id) { if (!docs[id]) docs[id] = makeEl('div'); return docs[id]; },
    createElement: function (t) { return makeEl(t); },
    querySelector: function () { return makeEl('div'); },
    querySelectorAll: function () { return []; },
    addEventListener: function () {}
  },
  localStorage: { getItem: function () { return null; }, setItem: function () {} },
  navigator: { language: 'zh' },
  setTimeout: function (cb) { return 0; }, clearTimeout: function () {},
  setInterval: function () { return 0; }, clearInterval: function () {},
  Arcade: null
};
sandbox.window = sandbox;
vm.createContext(sandbox);
['assets/js/core/i18n.js', 'assets/js/core/i18n-dict.js', 'assets/js/core/i18n-ui.js',
 'assets/js/core/storage.js', 'assets/js/core/extras.js', 'assets/js/protocols.js'].forEach(function (f) {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f }); }
  catch (e) { console.log('LOAD FAIL @ ' + f + ' :: ' + e.message); }
});
try {
  vm.runInContext("if (window.Arcade && Arcade.i18n) { Arcade.i18n.applyStatic(); } window.PROTOCOL_LAB.init();", sandbox);
  console.log('init OK, pl-ready =', docs['pl-ready'] ? docs['pl-ready'].textContent : 'null');
  Object.keys(docs).forEach(function (k) {
    var d = docs[k];
    var s = (d._html || '') + (d.textContent || '');
    if (/NaN|undefined/.test(s)) console.log('POLLUTE:', k, '::', (s.match(/.{0,50}(NaN|undefined).{0,25}/) || [''])[0]);
  });
} catch (e) {
  console.log('INIT THROW:', e.message);
  console.log(e.stack.split('\n').slice(0, 4).join('\n'));
}
