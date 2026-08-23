const fs = require('fs');
function count(file, pat) { try { const s = fs.readFileSync(file, 'utf8'); return (s.match(pat) || []).length; } catch (e) { return 'ERR ' + e.message; } }
// eggs
const eggs = fs.readFileSync('assets/js/easter-eggs.js', 'utf8');
const eggIds = [...eggs.matchAll(/id:\s*['"]e(\d+)['"]/g)].map(m => +m[1]);
console.log('eggs count:', eggIds.length, 'range:', Math.min(...eggIds), '-', Math.max(...eggIds));
// quotes
const quotes = fs.readFileSync('assets/js/quotes.js', 'utf8');
console.log('quotes has QUOTES var:', /(var|const|let)\s+(QUOTES|DATA|quotes|QUOTES_DATA)/.test(quotes), 'obj entries:', (quotes.match(/^\s*\{/gm) || []).length);
// timeline
const tl = fs.readFileSync('assets/js/timeline.js', 'utf8');
console.log('timeline obj entries:', (tl.match(/^\s*\{/gm) || []).length);
// glossary
const g = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8');
const glKeys = (g.match(/^(\s*)gl\.\w+:/gm) || []);
console.log('glossary keys approx:', glKeys.length);
// chapters
const st = fs.readFileSync('assets/js/stories.js', 'utf8');
console.log('stories chapters:', (st.match(/^(\s*)c\d+:/gm) || []).length);
// people count
const pe = fs.readFileSync('assets/js/core/i18n-dict.js', 'utf8');
const people = pe.match(/"stp\.(\w+)\.name"/g) || [];
console.log('people with stp names (dict):', new Set(people.map(s => s.split('.')[1])).size);
