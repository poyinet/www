/* P3-2：给 stories.js 每章加 reads（进阶书单）字段 */
const fs = require('fs');
const path = require('path');
const F = path.join(process.cwd(), 'assets/js/stories.js');
let s = fs.readFileSync(F, 'utf8');

/* 每章书单：{ 章节id: [书名数组] } */
const READS = {
  dawn: ['Andrew Robinson, The Story of Writing', 'Simon Singh, The Code Book'],
  caesar: ['Suetonius, The Twelve Caesars', 'Simon Singh, The Code Book'],
  arab: ['Simon Singh, The Code Book', 'Ibrahim A. Al-Kadit, Origins of Cryptology: The Arab Contributions'],
  bacon: ['Simon Singh, The Code Book', 'Blaise de Vigenère, Traicté des chiffres (1586)'],
  ww1: ['Barbara Tuchman, The Zimmermann Telegram', 'David Kahn, The Codebreakers'],
  bletchley: ['Andrew Hodges, Alan Turing: The Enigma', 'Simon Singh, The Code Book'],
  midway: ['Gordon W. Prange, Miracle at Midway', 'John Costello, The Pacific War'],
  purple: ['Ronald W. Clark, The Man Who Broke Purple', 'David Kahn, The Codebreakers'],
  lorenz: ['Jack Copeland, Colossus: The Secrets of Bletchley Park\'s Codebreaking Computers'],
  venona: ['Robert Louis Benson, The Venona Story (NSA)', 'John Earl Haynes & Harvey Klehr, Venona: Decoding Soviet Espionage in America'],
  modern: ['Claude Shannon, A Mathematical Theory of Communication (1948)', 'Simon Singh, The Code Book']
};

let injected = 0;
for (const [chId, books] of Object.entries(READS)) {
  // 找到该章对象，在 sources: [...] 后注入 reads: [...]
  const re = new RegExp("(\\{ id: '" + chId + "',[\\s\\S]*?sources: \\[[^\\]]*\\])(\\s*\\},?)");
  const booksStr = books.map(b => "'" + b.replace(/'/g, "\\'") + "'").join(', ');
  s = s.replace(re, function (m, head, tail) {
    if (head.includes('reads:')) return m;
    injected++;
    return head + ", reads: [" + booksStr + "]" + tail;
  });
}

fs.writeFileSync(F, s);
console.log('✓ 已注入 ' + injected + ' 章书单（期望 11）');
