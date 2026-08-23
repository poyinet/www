/* ============================================================
   破译 DECODE ARCADE · 全站静态深度扫描（注册表全覆盖）
   用法：node tools/audit-deep.js
   在 audit.js（13 项硬标准）之上做更深的静态质量检查：
     移动端：触控支持 / 320px 横向溢出 / canvas DPR
     健壮性：setInterval 泄漏 / 全局监听器泄漏
     i18n：游戏内文案 zh/en 键对称 / 教程硬编码中文 / JS 硬编码中文
     内容：时长难度标签覆盖 / BEST 单位覆盖 / 每日题支持
     版权：游戏名与商标风险对照 + 视觉相似人工复核清单
   输出：tools/report/deep-audit-<date>.json / .md
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'tools', 'report');
const DATE = new Date().toISOString().slice(0, 10);

/* ---------- 读取注册表 ---------- */
const regSrc = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'games.js'), 'utf8');
const sb = { window: {} };
vm.createContext(sb);
vm.runInContext(regSrc, sb);
const GAMES = sb.window.GAMES;
const DAILY_IDS = sb.window.DAILY_IDS || [];
const byId = {};
GAMES.forEach(function (g) { byId[g.id] = g; });

/* ---------- 从 lobby.js 提取标签 / 单位表 ---------- */
const lobbySrc = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'lobby.js'), 'utf8');
function extractObj(name) {
  const m = new RegExp('var ' + name + ' = \\{([\\s\\S]*?)\\n  \\};').exec(lobbySrc);
  if (!m) return {};
  const o = {};
  // 兼容键带单引号（'dungeon-cipher'）与值单/双引号混用（sudoku: 's' / hanoi: "Steps"）
  const re = /['"]?([A-Za-z0-9_-]+)['"]?\s*:\s*["']([^"']*)["']/g;
  let mm;
  while ((mm = re.exec(m[1]))) o[mm[1]] = mm[2];
  return o;
}
const TIME_LABELS = extractObj('TIME_LABELS');
const DIFF_LABELS = extractObj('DIFF_LABELS');
const BEST_UNITS = extractObj('BEST_UNITS');

/* ---------- 工具 ---------- */
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }
const CJK = /[\u4e00-\u9fff]/;
/* 逐行过滤注释（含块注释状态跟踪，避免缩进续行误报） */
function nonCommentLines(js) {
  const out = [];
  let inBlock = false;
  js.split('\n').forEach(function (raw) {
    let line = raw.trim();
    if (inBlock) {
      const end = line.indexOf('*/');
      if (end >= 0) { line = line.slice(end + 2).trim(); inBlock = false; }
      else return;
    }
    // 去掉行内 /* ... */ 注释段
    while (line.indexOf('/*') >= 0) {
      const s = line.indexOf('/*');
      const e = line.indexOf('*/', s + 2);
      if (e < 0) { line = line.slice(0, s); inBlock = true; break; }
      line = (line.slice(0, s) + ' ' + line.slice(e + 2)).trim();
    }
    if (!line) return;
    if (line.startsWith('//')) return;
    // 去掉行尾 // 注释
    const dc = line.indexOf('//');
    if (dc >= 0) line = line.slice(0, dc).trim();
    if (line) out.push(line);
  });
  return out;
}
function count(js, pat) { const m = js.match(pat); return m ? m.length : 0; }
/* 统计匹配在 [start,end] 区间内的出现次数 */
function countInSpan(jsSrc, span, pat) {
  let n = 0;
  const re = new RegExp(pat.source, 'g');
  let m;
  while ((m = re.exec(jsSrc))) { if (m.index >= span[0] && m.index <= span[1]) n++; }
  return n;
}

/* ---------- 版权风险知识表 ----------
   verdict: ok-generic（通用玩法名） / ok-historical（历史事实） / review-visual（视觉相似需人工复核） */
const COPYRIGHT = {
  'adfgvx': ['ok-historical', '一战德军 ADFGVX 密码，历史事实'],
  'affine': ['ok-historical', '仿射密码，数学算法'],
  'asteroidf': ['review-visual', '致敬 Asteroids：多边形小行星为通用造型，复核角色/画面是否有雷同'],
  'bacon': ['ok-historical', '培根密码 1605，历史事实'],
  'ballpop': ['ok-generic', '弹珠消消：三消/连锁，通用玩法'],
  'base64': ['ok-generic', 'Base64 编码，公开标准'],
  'bifid': ['ok-historical', 'Bifid 密码，历史算法'],
  'billiards': ['ok-generic', '台球，通用运动'],
  'binary': ['ok-generic', '二进制，公开知识'],
  'blackjack': ['ok-generic', '21 点，通用牌戏'],
  'blocks': ['ok-generic', '俄罗斯方块：使用通用中文名与原创代码，避免 Tetris 商标与官方角色；复核方块配色为通用色块'],
  'bombe': ['ok-historical', 'Bombe 历史机器，历史事实'],
  'bowling': ['ok-generic', '保龄球，通用运动'],
  'brickbash': ['review-visual', '致敬 Breakout：砖块/球拍为通用造型，复核无版权素材'],
  'bridge': ['ok-generic', '桥梁搭建，通用物理玩法'],
  'bullethell': ['ok-generic', '弹幕射击，通用玩法'],
  'caesar': ['ok-historical', '凯撒密码，历史算法'],
  'campaign': ['ok-historical', '破译战役，原创剧情'],
  'catch': ['ok-generic', '接物，通用玩法'],
  'checkers': ['ok-generic', '跳棋，古老棋类'],
  'chess': ['ok-generic', '国际象棋，古老棋类'],
  'circuit': ['ok-generic', '电路连接，通用谜题'],
  'codebreak': ['ok-generic', '大师密码，通用玩法'],
  'codeguess': ['ok-generic', '猜词破译，通用玩法'],
  'curling': ['ok-generic', '冰壶，通用运动'],
  'deckbuilder': ['ok-generic', '卡牌构筑，通用玩法'],
  'detective': ['ok-historical', '密码侦探，原创剧情'],
  'diceluck': ['ok-generic', '快艇骰子：通用中文名；Yahtzee 为 Hasbro 商标，避免使用该英文名与官方计分表美术'],
  'dungeon': ['ok-generic', '地牢探险，通用 Roguelike'],
  'dungeon-cipher': ['ok-historical', '密码地牢，原创玩法'],
  'enigma': ['ok-historical', 'Enigma 历史机器，历史事实'],
  'fillomino': ['ok-generic', '拼图填数，Nikoli 类谜题（通用规则）'],
  'fourline': ['ok-generic', '四子棋，通用棋类'],
  'freq': ['ok-historical', '词频分析，密码学方法'],
  'frogcross': ['review-visual', '致敬 Frogger：青蛙过马路为通用玩法，复核青蛙造型无雷同'],
  'fruitmerge': ['ok-generic', '西瓜合成，merge 类通用玩法'],
  'g2048': ['ok-generic', '2048：通用数字游戏名（原始游戏 MIT 开源，本站为原创实现）'],
  'game24': ['ok-generic', '24 点，通用扑克数学游戏'],
  'gomoku': ['ok-generic', '五子棋，古老棋类'],
  'guess': ['ok-generic', '猜数字，通用玩法'],
  'hanoi': ['ok-generic', '汉诺塔，经典数学谜题'],
  'hashi': ['ok-generic', '岛屿连线，Nikoli 类谜题（通用规则）'],
  'hill': ['ok-historical', '希尔密码，数学算法'],
  'jn25': ['ok-historical', 'JN-25 历史密码，历史事实'],
  'klondike': ['ok-generic', '纸牌接龙：Klondike 为通用牌局规则名'],
  'klotski': ['ok-generic', '华容道，古老滑块谜题'],
  'lightsout': ['ok-generic', '点灯，通用谜题'],
  'llk': ['ok-generic', '连连看：通用消除玩法（非麻将牌面版权素材即可）'],
  'lorenz': ['ok-historical', '洛伦兹 SZ40，历史机器'],
  'm209': ['ok-historical', 'M-209 历史机器，历史事实'],
  'maker': ['ok-historical', '密码制造者，原创玩法'],
  'match3': ['ok-generic', '消消乐：通用三消玩法'],
  'maze': ['ok-generic', '迷宫，通用玩法'],
  'mazedot': ['ok-generic', '迷宫（点线版），通用玩法'],
  'memory': ['ok-generic', '记忆翻牌，通用玩法'],
  'minesweeper': ['ok-generic', '扫雷，通用玩法（微软未将玩法本身商标化）'],
  'morse': ['ok-historical', '摩斯电码，公开标准'],
  'morselong': ['ok-historical', '摩斯长报文，公开标准'],
  'morsetap': ['ok-historical', '摩斯听写，公开标准'],
  'nonogram': ['ok-generic', '数织：Nonogram 通用谜题（源自 Paint by Numbers 日本）'],
  'paddle2p': ['review-visual', '致敬 Pong：双人弹球，通用玩法'],
  'paintbynum': ['ok-generic', '数字填色，通用玩法'],
  'pipe': ['ok-generic', '管道连接，通用谜题'],
  'pixelbird': ['review-visual', '致敬 Flappy Bird：像素鸟玩法；复核小鸟造型非照搬（原创像素即可）'],
  'pixeldino': ['review-visual', '致敬 Chrome 恐龙：复核恐龙造型非官方美术'],
  'platformer': ['ok-generic', '平台跳跃，通用玩法'],
  'playfair': ['ok-historical', 'Playfair 密码，历史算法'],
  'plugboard': ['ok-historical', '插线板，历史机器部件'],
  'poker': ['ok-generic', '扑克对决，通用牌戏'],
  'purple': ['ok-historical', '紫密 Type B，历史机器'],
  'puzzle15': ['ok-generic', '数字华容道，通用滑块谜题'],
  'railfence': ['ok-historical', '栅栏密码，历史算法'],
  'railshooter': ['ok-generic', '轨道射击，通用玩法'],
  'reaction': ['ok-generic', '反应力测试，通用玩法'],
  'reversi': ['ok-generic', '黑白棋，古老棋类（Othello 为商标，本站用通用名）'],
  'rhythm': ['ok-generic', '节拍脉冲，通用玩法'],
  'roperescue': ['ok-generic', '切绳救星，通用物理玩法'],
  'sectorsiege': ['ok-generic', '拉线占领，原创玩法'],
  'sheep': ['ok-generic', '绵羊三消，原创主题'],
  'shikaku': ['ok-generic', '方形分割，Nikoli 类谜题'],
  'siege': ['ok-generic', '攻城棋，古老棋类'],
  'slitherlink': ['ok-generic', '数回，Nikoli 类谜题'],
  'snake': ['ok-generic', '贪吃蛇：通用玩法'],
  'sokoban': ['ok-generic', '推箱子，通用玩法（Sokoban 为 Thinking Rabbit 商标，通用中文名无碍）'],
  'spaceshooter': ['ok-generic', '太空射击，通用玩法'],
  'spotdiff': ['ok-generic', '找茬，通用玩法'],
  'substitution': ['ok-historical', '替换密码，历史算法'],
  'sudoku': ['ok-generic', '数独：通用谜题名（Nikoli 商标限日文语境，中文通用名无碍）'],
  'tactics': ['ok-generic', '战棋对决，原创玩法'],
  'tank': ['ok-generic', '铁壁防线，原创玩法'],
  'tictactoe': ['ok-generic', '井字棋，古老棋类'],
  'towerdefense': ['ok-generic', '塔防，通用玩法'],
  'trifid': ['ok-historical', 'Trifid 密码，历史算法'],
  'twopaddle': ['review-visual', '双人弹球，通用玩法'],
  'typecode': ['ok-generic', '打字破译，通用玩法'],
  'venona': ['ok-historical', 'VENONA 历史项目，历史事实'],
  'vigenere': ['ok-historical', '维吉尼亚密码，历史算法'],
  'wordsearch': ['ok-generic', '单词搜索，通用玩法'],
  'workshop': ['ok-historical', '破译工作室，密码学工具箱'],
  'xor': ['ok-generic', '异或，公开算法']
};
const FONTS = [
  ['assets/fonts/PRESS-START-2P-OFL.txt', 'Press Start 2P · OFL 1.1'],
  ['assets/fonts/FUSION-PIXEL-OFL.txt', 'Fusion Pixel 缝合像素 · OFL']
];

/* ---------- 单款检查 ---------- */
function auditGame(g) {
  const id = g.id;
  const issues = [];
  const html = read(path.join(ROOT, 'games', id, 'index.html')) || '';
  const js = read(path.join(ROOT, 'games', id, id + '.js')) || '';
  const i18n = read(path.join(ROOT, 'games', id, id + '-i18n.js')) || '';

  /* M1 输入支持（mobile: ok） */
  if (g.mobile === 'ok') {
    const hasTouch = /onSwipe|createDPad|touchstart|touchend|touchmove|pointerdown|pointermove|pointerup|PointerEvent|ontouchstart/.test(js);
    const hasTap = /addEventListener\('click'|addEventListener\("click"|onclick\s*=/.test(js);
    const hasKeyboard = /Arcade\.input\.onKeys|addEventListener\('keydown'|addEventListener\('keypress'|addEventListener\('keyup'|addEventListener\('input'|addEventListener\('change'|addEventListener\('focus'|onkeydown\s*=/.test(js);
    if (!hasTouch && !hasTap && !hasKeyboard) {
      issues.push({ sev: 'MAJOR', code: 'M1', msg: 'mobile:ok 但未发现任何输入处理器（click/pointer/touch/keys/input）' });
    } else if (!hasTouch && !hasTap && hasKeyboard) {
      issues.push({ sev: 'MINOR', code: 'M1', msg: '仅键盘/输入事件，无触屏事件——移动端依赖软键盘或需复核（打字类可接受）' });
    } else if (!hasTouch && hasTap) {
      issues.push({ sev: 'INFO', code: 'M1', msg: '仅 click 交互（点按类可接受；滑动/连续操作类需复核）' });
    }
  }

  /* M2 320px 横向溢出风险 */
  const styleBlock = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  styleBlock.split('\n').forEach(function (line, i) {
    const wm = /width:\s*(\d{3,4})px/.exec(line);
    if (wm && parseInt(wm[1], 10) >= 400 && !/max-width|vw|min\(|calc\(|flex/.test(line)) {
      issues.push({ sev: 'MINOR', code: 'M2', msg: 'CSS 固定宽度 ≥400px 无 max-width 兜底（style 第 ' + (i + 1) + ' 行: ' + line.trim().slice(0, 60) + '）' });
    }
    const mm = /min-width:\s*(\d{3,4})px/.exec(line);
    if (mm && parseInt(mm[1], 10) >= 380 && !/max-width|vw|min\(|calc\(/.test(line)) {
      issues.push({ sev: 'MINOR', code: 'M2', msg: 'CSS min-width ≥380px 可能溢出 320px 屏（style 第 ' + (i + 1) + ' 行）' });
    }
  });

  /* M3 canvas DPR */
  if (/<canvas/.test(html) && !/devicePixelRatio/.test(js)) {
    issues.push({ sev: 'INFO', code: 'M3', msg: 'canvas 未做 devicePixelRatio 高清适配（像素风经 CSS 缩放可接受，复核文字清晰度）' });
  }

  /* R1 setInterval 泄漏 */
  const si = count(js, /setInterval\s*\(/g);
  const ci = count(js, /clearInterval\s*\(/g);
  if (si > 0 && ci === 0) issues.push({ sev: 'MED', code: 'R1', msg: 'setInterval(' + si + ') 无任何 clearInterval——重开/结算后可能残留计时器' });

  /* R2 全局监听器泄漏（括号跨度分析：仅当绑定在 GAME_RESTART 目标函数体内才真泄漏） */
  function braceEnd(jsSrc, openIdx) {
    let depth = 0, inStr = null;
    for (let i = openIdx; i < jsSrc.length; i++) {
      const c = jsSrc[i];
      if (inStr) { if (c === inStr && jsSrc[i - 1] !== '\\') inStr = null; continue; }
      if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) return i; }
    }
    return -1;
  }
  function restartSpan(jsSrc) {
    // 命名函数目标
    const named = /GAME_RESTART\s*=\s*([A-Za-z_$][\w$]*)/.exec(jsSrc);
    if (named) {
      const re = new RegExp('function\\s+' + named[1] + '\\s*\\(');
      const m = re.exec(jsSrc);
      if (m) {
        const open = jsSrc.indexOf('{', m.index);
        if (open >= 0) { const end = braceEnd(jsSrc, open); if (end >= 0) return [m.index, end]; }
      }
    }
    // 匿名函数目标
    const anon = /GAME_RESTART\s*=\s*function\s*\([^)]*\)\s*\{/.exec(jsSrc);
    if (anon) {
      const open = jsSrc.indexOf('{', anon.index);
      if (open >= 0) { const end = braceEnd(jsSrc, open); if (end >= 0) return [anon.index, end]; }
    }
    return null;
  }
  const rSpan = restartSpan(js);
  const wAdds = (js.match(/window\.addEventListener\s*\(/g) || []).length;
  const wRemoves = (js.match(/window\.removeEventListener\s*\(/g) || []).length;
  const dAdds = (js.match(/document\.addEventListener\s*\(/g) || []).length;
  const dRemoves = (js.match(/document\.removeEventListener\s*\(/g) || []).length;
  if (rSpan) {
    const wInside = countInSpan(js, rSpan, /window\.addEventListener\s*\(/g);
    const dInside = countInSpan(js, rSpan, /document\.addEventListener\s*\(/g);
    if (wInside) issues.push({ sev: 'MED', code: 'R2', msg: '重开函数体内绑定 window 监听器 x' + wInside + '——每次重开累积，按键会重复触发（需移出或守卫）' });
    else if (dInside) issues.push({ sev: 'INFO', code: 'R2', msg: '重开函数体内绑定 document 监听器 x' + dInside });
  } else {
    if (wAdds > wRemoves) issues.push({ sev: 'INFO', code: 'R2', msg: 'window 监听器 add(' + wAdds + ') > remove(' + wRemoves + ')，但未定位到重开函数体（需人工确认）' });
    if (dAdds > dRemoves) issues.push({ sev: 'INFO', code: 'R2', msg: 'document 监听器 add(' + dAdds + ') > remove(' + dRemoves + ')' });
  }

  /* I1 游戏内文案键对称 */
  if (i18n) {
    const zhKeys = {};
    const enKeys = {};
    let m;
    const re = /d\.zh\['(gs\.[^']+)'\]/g;
    while ((m = re.exec(i18n))) zhKeys[m[1]] = 1;
    const re2 = /d\.en\['(gs\.[^']+)'\]/g;
    while ((m = re2.exec(i18n))) enKeys[m[1]] = 1;
    const zhOnly = Object.keys(zhKeys).filter(function (k) { return !enKeys[k]; });
    const enOnly = Object.keys(enKeys).filter(function (k) { return !zhKeys[k]; });
    if (zhOnly.length) issues.push({ sev: 'MED', code: 'I1', msg: 'en 缺 ' + zhOnly.length + ' 个键: ' + zhOnly.slice(0, 4).join(', ') + (zhOnly.length > 4 ? '…' : '') });
    if (enOnly.length) issues.push({ sev: 'INFO', code: 'I1', msg: 'en 多出 ' + enOnly.length + ' 个键（zh 无）' });
  } else {
    issues.push({ sev: 'INFO', code: 'I1', msg: '无 <id>-i18n.js（若全用公共 gt.* 文案可忽略）' });
  }

  /* I2 教程硬编码中文 */
  const tutBlock = (js.match(/GAME_TUTORIAL_STEPS\s*=\s*\[[\s\S]*?\]\s*;/) || [])[0] || '';
  if (tutBlock) {
    const hasI18nRef = /T\(\s*['"]|Arcade\.i18n|i18n\.t/.test(tutBlock);
    const cjkInTut = nonCommentLines(tutBlock).filter(function (l) { return CJK.test(l); });
    if (cjkInTut.length) issues.push({ sev: 'MED', code: 'I2', msg: '教程步骤含中文且未走 i18n（' + cjkInTut.length + ' 行）' });
  }

  /* I3 JS 硬编码中文（块注释状态跟踪，仅统计真实字符串/数据） */
  const cjkLines = nonCommentLines(js).filter(function (l) { return CJK.test(l); });
  const i3Count = cjkLines.length;
  /* 已核验良性：硬编码中文为内部键/冗余数据，展示层均已走 i18n（人工核验记录） */
  const BENIGN = {
    'detective': '章节数组中的 title/intro/pickup/question/hint/outcome 为冗余回退数据，运行时展示全部走 gs.detective.cN.* 键（48 键 zh/en 齐全）',
    'chess': '挑战数组 name/desc 为元数据回退，按钮/文案展示走 gs.chess.pzN* 键',
    'paintbynum': '图案 name 为内部键，经 ART_KEYS 映射后由 T() 展示',
    'maker': '科技/事件 name/flavor 为数据元信息，展示走 cName/toolName/evName 的 T() 映射',
    'campaign': 'TYPE_KEY 为「中文名 → i18n 键」查表，展示走 T(TYPE_KEY[...])',
    'twopaddle': '「你」为内部状态值，胜负文案展示走 gs.twopaddle.win/lose',
    'klotski': '华容道棋子汉字标签（曹/将/关/兵）为主题设计，非文案泄漏'
  };
  if (BENIGN[id]) {
    issues.push({ sev: 'INFO', code: 'I3', msg: '硬编码中文 ' + i3Count + ' 行（已核验良性：' + BENIGN[id] + '）' });
  } else if (i3Count > 3) {
    issues.push({ sev: 'MED', code: 'I3', msg: 'JS 硬编码中文 ' + i3Count + ' 行（非注释），示例: ' + cjkLines.slice(0, 2).map(function (l) { return l.slice(0, 40); }).join(' | ') });
  } else if (i3Count) {
    issues.push({ sev: 'INFO', code: 'I3', msg: 'JS 硬编码中文 ' + i3Count + ' 行' });
  }

  /* C1 标签覆盖 */
  const hasTags = TIME_LABELS[id] !== undefined || DIFF_LABELS[id] !== undefined;
  if (!hasTags) issues.push({ sev: 'MINOR', code: 'C1', msg: 'lobby 标签表（TIME_LABELS/DIFF_LABELS）未收录——卡带无时长/难度徽章' });

  /* C2 BEST 单位覆盖 */
  if (g.bestMode && BEST_UNITS[id] === undefined) issues.push({ sev: 'INFO', code: 'C2', msg: 'BEST_UNITS 未收录（最高分将无单位显示）' });

  /* C3 每日题支持 */
  if (DAILY_IDS.indexOf(id) >= 0 && !/daily/i.test(js)) issues.push({ sev: 'MAJOR', code: 'C3', msg: '注册在 DAILY_IDS 但 JS 未发现每日题实现' });

  /* CP 版权 */
  const cp = COPYRIGHT[id] || ['ok-generic', '（未收录，需人工确认）'];
  if (cp[0] === 'review-visual') issues.push({ sev: 'INFO', code: 'CP', msg: '视觉复核：' + cp[1] });
  else issues.push({ sev: 'OK', code: 'CP', msg: cp[0] + '：' + cp[1] });

  return { id: id, title: g.title, category: g.category, mobile: g.mobile, issues: issues };
}

/* ---------- 主流程 ---------- */
const results = GAMES.map(auditGame);
const files = fs.existsSync(REPORT_DIR) ? fs.readdirSync(REPORT_DIR).filter(function (f) { return /deep-audit/.test(f); }) : [];

const sevOrder = { MAJOR: 3, MED: 2, MINOR: 1, INFO: 0, OK: -1 };
function worst(issues) {
  let w = 'OK';
  issues.forEach(function (i) { if (sevOrder[i.sev] > sevOrder[w]) w = i.sev; });
  return w;
}

const bySeverity = { MAJOR: [], MED: [], MINOR: [], INFO: [] };
results.forEach(function (r) {
  r.issues.forEach(function (i) { if (i.sev !== 'OK' && bySeverity[i.sev]) bySeverity[i.sev].push({ id: r.id, title: r.title, code: i.code, msg: i.msg }); });
});

/* 汇总 */
let md = '# 破译 DECODE ARCADE · 全站深度扫描报告（' + DATE + '）\n\n';
md += '扫描范围：' + GAMES.length + ' 款游戏（注册表全覆盖）\n\n';
md += '## 严重度统计\n\n| 级别 | 数量 |\n|---|---|\n';
md += '| 🔴 MAJOR | ' + bySeverity.MAJOR.length + ' |\n';
md += '| 🟠 MED | ' + bySeverity.MED.length + ' |\n';
md += '| 🟡 MINOR | ' + bySeverity.MINOR.length + ' |\n';
md += '| 🔵 INFO | ' + bySeverity.INFO.length + ' |\n\n';

md += '## 逐款结论\n\n| 游戏 | 分类 | 移动 | 结论 |\n|---|---|---|---|\n';
results.forEach(function (r) {
  const w = worst(r.issues);
  const mark = w === 'MAJOR' ? '🔴' : w === 'MED' ? '🟠' : w === 'MINOR' ? '🟡' : w === 'INFO' ? '🔵' : '✅';
  md += '| ' + r.id + '（' + r.title + '） | ' + r.category + ' | ' + r.mobile + ' | ' + mark + ' ' + w + ' |\n';
});

['MAJOR', 'MED', 'MINOR', 'INFO'].forEach(function (s) {
  if (!bySeverity[s].length) return;
  md += '\n## ' + s + ' 明细\n\n';
  bySeverity[s].forEach(function (i) {
    md += '- **' + i.id + '**（' + i.title + '）[' + i.code + '] ' + i.msg + '\n';
  });
});

md += '\n## 版权合规\n\n';
md += '- 字体：' + FONTS.map(function (f) { return fs.existsSync(path.join(ROOT, f[0])) ? '✓ ' + f[1] : '✗ 缺 ' + f[0]; }).join('；') + '\n';
md += '- 音效/音乐：全部 WebAudio 程序化合成，无外部采样，无版权风险\n';
md += '- 图标：平台 emoji，无版权风险\n';
md += '- `assets/og-image.png`：来源需人工确认（若为生成素材则无风险）\n';
md += '- 历史密文内容：站点页脚已标注「史料整理自公开信息仅供学习」\n';

fs.mkdirSync(REPORT_DIR, { recursive: true });
const jsonPath = path.join(REPORT_DIR, 'deep-audit-' + DATE + '.json');
const mdPath = path.join(REPORT_DIR, 'deep-audit-' + DATE + '.md');
fs.writeFileSync(jsonPath, JSON.stringify({ date: DATE, results: results, bySeverity: bySeverity }, null, 2));
fs.writeFileSync(mdPath, md);

/* 控制台摘要 */
console.log('=== 深度扫描完成（' + GAMES.length + ' 款）===');
console.log('MAJOR: ' + bySeverity.MAJOR.length + '  MED: ' + bySeverity.MED.length + '  MINOR: ' + bySeverity.MINOR.length + '  INFO: ' + bySeverity.INFO.length);
if (bySeverity.MAJOR.length) {
  console.log('\n--- MAJOR ---');
  bySeverity.MAJOR.forEach(function (i) { console.log('[' + i.code + '] ' + i.id + '：' + i.msg); });
}
if (bySeverity.MED.length) {
  console.log('\n--- MED（抽样前 20）---');
  bySeverity.MED.slice(0, 20).forEach(function (i) { console.log('[' + i.code + '] ' + i.id + '：' + i.msg); });
  if (bySeverity.MED.length > 20) console.log('…共 ' + bySeverity.MED.length + ' 条，详见报告');
}
console.log('\n报告：' + path.relative(ROOT, mdPath));
console.log('数据：' + path.relative(ROOT, jsonPath));
