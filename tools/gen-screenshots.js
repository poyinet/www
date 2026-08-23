/* ============================================================
   PWA 安装预览图生成器（C1 · 零依赖）—— 复用 gen-icons 的
   「逐像素绘制 + 内置 PNG 编码」路线，输出两张 640×360 品牌图：
     assets/screenshots/shot-home.png    （首页主题 · 青色霓虹）
     assets/screenshots/shot-games.png   （游戏厅主题 · 品红霓虹）
   说明：合成图为品牌版式而非真实截屏；部署后可用浏览器实拍
   两张真截图替换同名文件，manifest 无需再改。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------------- PNG 编码（RGBA8，与 gen-icons 相同） ---------------- */
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) raw[y * (width * 4 + 1)] = 0;
  rgba.copy(raw, 1, 0, width * height * 4);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------------- 5×7 像素字体（A-Z 0-9 与少量符号） ---------------- */
const FONT = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  G: ['01111','10000','10000','10111','10001','10001','01110'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  A2: null,
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  '·': ['00000','00000','00000','00100','00000','00000','00000']
};
FONT.F = ['11111','10000','10000','11110','10000','10000','10000'];
FONT.I = ['11111','00100','00100','00100','00100','00100','11111'];
FONT.U = ['10001','10001','10001','10001','10001','10001','01110'];
FONT['1'] = ['00100','01100','00100','00100','00100','00100','01110'];
FONT['0'] = ['01110','10001','10011','10101','11001','10001','01110'];
FONT['5'] = ['11111','10000','10000','11110','00001','10001','01110'];

/* ---------------- 画布 ---------------- */
function makeCanvas(w, h, rgb) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = rgb[0]; buf[i * 4 + 1] = rgb[1]; buf[i * 4 + 2] = rgb[2]; buf[i * 4 + 3] = 255;
  }
  return { w, h, buf };
}
function px(c, x, y, rgb, a) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const o = (y * c.w + x) * 4;
  c.buf[o] = rgb[0]; c.buf[o + 1] = rgb[1]; c.buf[o + 2] = rgb[2]; c.buf[o + 3] = a == null ? 255 : a;
}
function rect(c, x, y, w, h, rgb) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(c, xx, yy, rgb);
}
function drawText(c, text, x, y, scale, rgb, glow) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = FONT[ch];
    if (!g) { cx += 6 * scale; continue; }
    for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) {
      if (g[gy][gx] === '1') {
        if (glow) { /* 一圈暗色光晕 */
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (dx || dy) px(c, cx + gx * scale + dx, y + gy * scale + dy, glow, 140);
          }
        }
        rect(c, cx + gx * scale, y + gy * scale, scale, scale, rgb);
      }
    }
    cx += 6 * scale;
  }
  return cx;
}

function buildShot(opts) {
  const W = 640, H = 360;
  const c = makeCanvas(W, H, [10, 10, 18]);
  /* 细扫描线背景 */
  for (let y = 0; y < H; y += 4) rect(c, 0, y, W, 1, [14, 14, 26]);
  /* 霓虹双层边框 */
  rect(c, 6, 6, W - 12, 2, opts.accent); rect(c, 6, H - 8, W - 12, 2, opts.accent);
  rect(c, 6, 6, 2, H - 12, opts.accent); rect(c, W - 8, 6, 2, H - 12, opts.accent);
  rect(c, 12, 12, W - 24, 1, [255, 255, 255]); // 高光线
  /* 顶部标签 */
  drawText(c, 'POYI·NET', 24, 22, 2, opts.dim);
  /* 主标题两行 */
  drawText(c, opts.line1, 24, 64, 7, opts.accent, opts.accentDark);
  drawText(c, opts.line2, 24, 128, 7, opts.main, opts.accentDark);
  /* 副标语 */
  drawText(c, opts.tagline, 24, 208, 3, [220, 220, 235]);
  /* 图标块行：像素小方块模拟游戏卡带 */
  const cols = [[0, 240, 255], [255, 45, 149], [185, 103, 255], [255, 230, 0], [57, 255, 20]];
  for (let i = 0; i < 10; i++) {
    const bx = 24 + i * 60, by = 260;
    rect(c, bx, by, 44, 44, [22, 22, 36]);
    rect(c, bx + 2, by + 2, 40, 40, cols[i % cols.length]);
    rect(c, bx + 8, by + 8, 28, 28, [16, 16, 30]);
    rect(c, bx + 16, by + 16, 12, 12, cols[(i + 2) % cols.length]);
  }
  drawText(c, opts.footer, 24, 322, 3, opts.dim);
  return encodePNG(W, H, c.buf);
}

const outDir = path.join('assets', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'shot-home.png'), buildShot({
  line1: 'DECODE', line2: 'ARCADE',
  tagline: '3000 YEARS OF CODEBREAKING',
  footer: 'READ · PLAY · CRACK · COLLECT',
  accent: [0, 240, 255], accentDark: [0, 90, 110], main: [255, 45, 149], dim: [120, 130, 150]
}));
fs.writeFileSync(path.join(outDir, 'shot-games.png'), buildShot({
  line1: '105', line2: 'GAMES',
  tagline: 'CLASSICAL TO QUANTUM CRYPTO',
  footer: 'DAILY PUZZLES · OFFLINE READY',
  accent: [255, 45, 149], accentDark: [110, 20, 70], main: [57, 255, 20], dim: [120, 130, 150]
}));
console.log('✓ 已生成 assets/screenshots/shot-home.png / shot-games.png');
