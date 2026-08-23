/* D5 最终版 v3：从备份重建。多键行按对拆分（无 $ 锚），movable 对迁 ui、其余对留守 dict。 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const BACKUP = path.join(process.env.TEMP || '.', 'opencode', 'i18n-dict.backup.js');
const movable = new Set(JSON.parse(fs.readFileSync(path.join(process.env.TEMP || '.', 'opencode', 'd5-movable.json'), 'utf8')).movable);
const CJK = /[\u4e00-\u9fff]/;

const lines = fs.readFileSync(BACKUP, 'utf8').split('\n');
const zhUi = [], enUi = [], dictOut = [];
let movedKeys = new Set(), movedPairs = 0;

for (const line of lines) {
  const ksAll = [...line.matchAll(/'([a-z0-9_.]+)':\s*'/g)].map(m => m[1]);
  const isObjLine = ksAll.length > 0 && !/d\.(zh|en)\[/.test(line);

  if (!isObjLine) {
    /* d.zh['k'] = '...' 单键风格 */
    const km = line.match(/d\.(?:zh|en)\['([^']+)'\]/);
    if (km && movable.has(km[1])) {
      movedKeys.add(km[1]); movedPairs++;
      const lang = /d\.zh\[/.test(line) ? zhUi : enUi;
      lang.push(line.trim().replace(/,$/, ';'));
      continue;
    }
    dictOut.push(line); continue;
  }

  /* 对象字面量行：拆成 ('key', rawValue) 对序列 */
  const segRe = /'([a-z0-9_.]+)':\s*('(?:[^'\\]|\\.)*')/g;
  const pairs = [];
  let m, last = 0;
  while ((m = segRe.exec(line)) !== null) {
    if (pairs.length) {
      /* 补齐上一个值之后到本键之前的连接文本 */
      pairs[pairs.length - 1].between = line.slice(pairs[pairs.length - 1].end, m.index);
    }
    pairs.push({ key: m[1], val: m[2], start: m.index, end: m.index + m[0].length, between: '' });
    last = m.index + m[0].length;
  }
  if (!pairs.length) { dictOut.push(line); continue; }

  const movablePairs = pairs.filter(p => movable.has(p.key));
  if (!movablePairs.length) { dictOut.push(line); continue; }

  const lang = CJK.test(line) ? 'zh' : 'en';
  const target = lang === 'zh' ? zhUi : enUi;
  for (const p of movablePairs) {
    movedKeys.add(p.key); movedPairs++;
    target.push("d." + lang + "['" + p.key + "'] = " + p.val + ";");
  }
  const restPairs = pairs.filter(p => !movable.has(p.key));
  if (restPairs.length) {
    /* 重建残留行：首键缩进 + 各对以逗号连接 */
    let rebuilt = line.match(/^\s*/)[0] + restPairs.map(p => "'" + p.key + "': " + p.val).join(', ');
    rebuilt += line.trimEnd().endsWith(';') ? ';' : ',';
    dictOut.push(rebuilt);
  } else if (line.trimEnd().endsWith(';')) {
    /* 全部迁走且原行以分号结尾 → 保留空语句占位避免破坏对象结构 */
    /* 对象字面量中不允许空项：检查相邻行决定。此处保守输出注释占位 */
    dictOut.push(line.match(/^\s*/)[0] + '/* moved to i18n-ui */');
  }
}

let ui = "/* ============================================================\n   第四期 D5 · 页面级 UI 字典（自 i18n-dict.js 下沉）\n   ============================================================ */\n(function () {\n  var d = Arcade.i18n.dicts;\n";
if (zhUi.length) { ui += "\n  /* zh */\n" + zhUi.map(l => '  ' + l).join('\n') + '\n'; }
if (enUi.length) { ui += "\n\n  /* en */\n" + enUi.map(l => '  ' + l).join('\n') + '\n'; }
ui += '})();\n';
fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'core', 'i18n-ui.js'), ui, 'utf8');
fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'core', 'i18n-dict.js'), dictOut.join('\n'), 'utf8');

console.log('moved keys:', movedKeys.size, '| moved pairs:', movedPairs, '| zh:', zhUi.length, '| en:', enUi.length);
