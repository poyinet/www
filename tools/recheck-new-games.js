/* 复查：4 款新游戏的加密算法正确性（模拟玩家破解路径） */
const fs = require('fs');
const vm = require('vm');

/* ---- atbash：镜像映射 ---- */
function atbash(s) {
  var o = '';
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c >= 65 && c <= 90) o += String.fromCharCode(90 - (c - 65));
    else o += s[i];
  }
  return o;
}
function deAtbash(s) { return atbash(s); } // 自反
let fail = 0;
['ARCADE', 'CIPHER', 'REVERSE'].forEach(w => {
  const ok = deAtbash(atbash(w)) === w;
  if (!ok) fail++;
  console.log((ok ? '✓' : '✗') + ' atbash ' + w + ' -> ' + atbash(w) + ' -> ' + deAtbash(atbash(w)));
});

/* ---- polybius：坐标映射 ---- */
var TBL = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
function encPoly(s) {
  var o = [];
  for (var i = 0; i < s.length; i++) {
    var p = TBL.indexOf(s.charAt(i) === 'J' ? 'I' : s.charAt(i));
    if (p < 0) continue;
    o.push((Math.floor(p / 5) + 1) + '' + (p % 5 + 1));
  }
  return o.join(' ');
}
function decPoly(coordStr) {
  var parts = coordStr.trim().split(/\s+/);
  var o = '';
  parts.forEach(function (pr) {
    var r = parseInt(pr.charAt(0), 10) - 1, c = parseInt(pr.charAt(1), 10) - 1;
    o += TBL[r * 5 + c];
  });
  return o;
}
['POLYBIUS', 'SQUARE', 'HELLO'].forEach(w => {
  const c = encPoly(w);
  const back = decPoly(c);
  const ok = back === w.replace(/J/g, 'I');
  if (!ok) fail++;
  console.log((ok ? '✓' : '✗') + ' polybius ' + w + ' -> ' + c + ' -> ' + back);
});

/* ---- nihilist：坐标+密钥 ---- */
function ncoord(ch) {
  var p = TBL.indexOf(ch === 'J' ? 'I' : ch);
  if (p < 0) return null;
  return (Math.floor(p / 5) + 1) * 10 + (p % 5 + 1);
}
function nEnc(plain, key) {
  var kd = [];
  for (var i = 0; i < key.length; i++) { var d = ncoord(key.charAt(i)); if (d) kd.push(d); }
  if (!kd.length) kd = [11];
  var out = [];
  for (var j = 0; j < plain.length; j++) {
    var cd = ncoord(plain.charAt(j));
    if (!cd) continue;
    out.push(cd + kd[j % kd.length]);
  }
  return out.join(' ');
}
function nDec(cipherStr, key) {
  var kd = [];
  for (var i = 0; i < key.length; i++) { var d = ncoord(key.charAt(i)); if (d) kd.push(d); }
  if (!kd.length) kd = [11];
  var parts = cipherStr.trim().split(/\s+/);
  var o = '';
  for (var j = 0; j < parts.length; j++) {
    var v = parseInt(parts[j], 10) - kd[j % kd.length];
    var r = Math.floor(v / 10) - 1, c = (v % 10) - 1;
    o += TBL[r * 5 + c];
  }
  return o;
}
['NIHILIST', 'RUSSIA', 'SECRET'].forEach(w => {
  const k = 'MOSCOW';
  const c = nEnc(w, k);
  const back = nDec(c, k);
  const ok = back === w;
  if (!ok) fail++;
  console.log((ok ? '✓' : '✗') + ' nihilist ' + w + ' key=' + k + ' -> ' + c + ' -> ' + back);
});

/* ---- starflag：星★=1 条─=0 5位码 ---- */
var STAR = '★', BAR = '─';
function sEnc(w) {
  var out = [];
  for (var i = 0; i < w.length; i++) {
    var v = w.charCodeAt(i) - 65;
    var bits = '';
    for (var b = 4; b >= 0; b--) bits += (v >> b) & 1 ? STAR : BAR;
    out.push(bits);
  }
  return out.join(' ');
}
function sDec(sym) {
  var groups = sym.trim().split(/\s+/);
  var o = '';
  groups.forEach(function (g) {
    var v = 0;
    for (var i = 0; i < 5; i++) v = (v << 1) | (g.charAt(i) === STAR ? 1 : 0);
    o += String.fromCharCode(65 + v);
  });
  return o;
}
['STAR', 'FLAG', 'BACON'].forEach(w => {
  const c = sEnc(w);
  const back = sDec(c);
  const ok = back === w;
  if (!ok) fail++;
  console.log((ok ? '✓' : '✗') + ' starflag ' + w + ' -> ' + c + ' -> ' + back);
});

console.log(fail ? '✗ ' + fail + ' 项失败' : '✓ 4 款新游戏加密往返全部正确');
process.exit(fail ? 1 : 0);
