/* ============================================================
   破译 DECODE ARCADE · PWA 图标生成器（零依赖，纯 Node）
   用法：node tools/gen-icons.js
   输出：assets/icons/icon-192.png / icon-512.png / icon-maskable-512.png / apple-touch-icon.png
   设计：32×32 像素风「钥匙孔 + 霓虹边框」（与站内街机像素美学一致），
   用内置 PNG 编码器（zlib 自带）逐像素绘制，无任何第三方依赖。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------------- PNG 编码（RGBA8，无滤镜） ---------------- */
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
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  // 每行前加滤镜字节 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------- 像素画布（32×32 逻辑网格，最近邻放大） ---------------- */
const GRID = 32;
function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
}

const C = {
  bg:      hex('#0d0d1a'), // 深海军蓝底
  panel:   hex('#12121f'), // 内边框暗板
  hollow:  hex('#0a0a12'), // 钥匙孔镂空
  cyan:    hex('#00f0ff'), // 霓虹青
  pink:    hex('#ff2d95'), // 霓虹粉
  yellow:  hex('#ffe600'), // 霓虹黄
  white:   hex('#ffffff')
};

/* 绘制设计到 32×32 网格。mode:
   'frame' = 边框贴边（普通图标）
   'inset' = 全出血背景 + 内容内缩（maskable 安全区）
   'apple' = 同 frame，全不透明（iOS 忽略 alpha，均为不透明） */
function drawGrid(mode) {
  const m = mode === 'inset' ? 3 : 0; // 内缩格数
  const lo = m, hi = GRID - 1 - m;
  const cells = {};
  const set = (x, y, c) => { cells[x + ',' + y] = c; };

  // 背景：默认全 bg（maskable 全出血；普通图标四角也给底色避免透明黑块）
  const fillBg = () => { for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) set(x, y, C.bg); };

  if (mode === 'inset') {
    // maskable：装饰边框内缩 2 格（不贴边，保证安全区内内容完整）
    fillBg();
    for (let x = lo + 2; x <= hi - 2; x++) {
      set(x, lo + 2, C.cyan); set(x, hi - 2, C.cyan);
      set(x, lo + 3, C.panel); set(x, hi - 3, C.panel);
    }
    for (let y = lo + 2; y <= hi - 2; y++) {
      set(lo + 2, y, C.cyan); set(hi - 2, y, C.cyan);
      set(lo + 3, y, C.panel); set(hi - 3, y, C.panel);
    }
    // 四角强调
    set(lo + 3, lo + 3, C.yellow); set(hi - 3, hi - 3, C.yellow);
  } else {
    fillBg();
    for (let x = 0; x < GRID; x++) { set(x, 0, C.cyan); set(x, GRID - 1, C.cyan); }
    for (let y = 0; y < GRID; y++) { set(0, y, C.cyan); set(GRID - 1, y, C.cyan); }
    for (let x = 1; x < GRID - 1; x++) { set(x, 1, C.panel); set(x, GRID - 2, C.panel); }
    for (let y = 1; y < GRID - 1; y++) { set(1, y, C.panel); set(GRID - 2, y, C.panel); }
    // 四角强调
    set(2, 2, C.pink); set(GRID - 3, GRID - 3, C.pink);
  }

  // 钥匙孔（整体居中，maskable 时内缩区域仍居中即可）
  const cx = GRID / 2 - 0.5, cy = GRID / 2 - 1.5;
  // 外环：半径 7 的圆环
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= 6.3 && d <= 7.6) set(x, y, C.cyan);
    }
  }
  // 钥匙柄：竖直矩形（粉）
  const stemX0 = Math.round(cx) - 2, stemX1 = Math.round(cx) + 2;
  const stemY0 = Math.round(cy) + 6, stemY1 = stemY0 + 7;
  for (let y = stemY0; y <= stemY1; y++) for (let x = stemX0; x <= stemX1; x++) set(x, y, C.pink);
  // 柄底横档
  for (let x = stemX0 - 1; x <= stemX1 + 1; x++) set(x, stemY1 + 1, C.pink);

  // 星光点缀（十字闪光）
  const sparkles = [[5, 6], [26, 8], [8, 26], [27, 25]];
  sparkles.forEach(([sx, sy]) => {
    set(sx, sy, C.yellow);
    set(sx + 1, sy, C.yellow); set(sx - 1, sy, C.yellow);
    set(sx, sy + 1, C.yellow); set(sx, sy - 1, C.yellow);
    set(sx, sy, C.white);
  });

  return cells;
}

function render(size, mode) {
  const cells = drawGrid(mode);
  const buf = Buffer.alloc(size * size * 4);
  const cell = size / GRID;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const c = cells[gx + ',' + gy] || C.bg;
      for (let py = 0; py < cell; py++) {
        for (let px = 0; px < cell; px++) {
          const x = gx * cell + px, y = gy * cell + py;
          const o = (y * size + x) * 4;
          buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = c[3];
        }
      }
    }
  }
  return buf;
}

/* ---------------- 输出 ---------------- */
const outDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const outputs = [
  ['icon-192.png', 192, 'frame'],
  ['icon-512.png', 512, 'frame'],
  ['icon-maskable-512.png', 512, 'inset'],
  ['apple-touch-icon.png', 180, 'apple']
];

outputs.forEach(([name, size, mode]) => {
  const png = encodePNG(size, size, render(size, mode));
  fs.writeFileSync(path.join(outDir, name), png);
  console.log('✓ ' + name + ' (' + size + '×' + size + ', ' + (png.length / 1024).toFixed(1) + ' KB)');
});
console.log('图标已生成到 assets/icons/');
