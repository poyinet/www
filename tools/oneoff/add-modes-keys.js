/* 第五期：模式实验室 i18n 键 */
const fs = require('fs');
const FILE = 'assets/js/core/i18n-ui.js';
let s = fs.readFileSync(FILE, 'utf8');
if (s.includes("'workshop.modesNote'")) { console.log('present'); process.exit(0); }
s = s.replace('})();', `  d.zh['workshop.modesNote'] = '同一张图，两种分组工作模式：ECB 每块独立加密——相同明文块得到相同密文块，图案轮廓赫然可见；CBC 每块先与前一块密文混合再加密，一个比特的雪崩抹掉一切结构。（演示用玩具分组密码，教学示意非真实强度）';
  d.en['workshop.modesNote'] = 'One image, two block-cipher modes: ECB encrypts each block independently — identical plaintext blocks give identical ciphertext, and the outline leaks. CBC mixes each block with the previous ciphertext before encrypting, so one bit of avalanche erases all structure. (Toy cipher for teaching, not real strength)';
  d.zh['workshop.modesPlain'] = '明文图案';
  d.en['workshop.modesPlain'] = 'Plaintext';
})();`);
fs.writeFileSync(FILE, s, 'utf8');
console.log('modes keys added');
