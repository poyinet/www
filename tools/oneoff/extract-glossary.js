/* Extract script7 and save for syntax check */
const fs = require('fs');
const g = fs.readFileSync('glossary.html', 'utf8');
const scripts = g.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
const inner = scripts[7].replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
fs.writeFileSync('_test_glossary.js', inner);
console.log('extracted', inner.length, 'chars');
