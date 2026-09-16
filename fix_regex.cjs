const fs = require('fs');
let code = fs.readFileSync('src/components/LexisGame.tsx', 'utf8');

code = code.replace(
  /\/^[a-zA-ZğüşiöçĞÜŞİÖÇ]\$\/.test\(e.key\)/,
  '/^[a-zA-ZğüşiöçĞÜŞİÖÇıI]$/.test(e.key)'
);

code = code.replace(
  /\/\[\^a-zA-ZğüşiöçĞÜŞİÖÇıI\]\/g/,
  '/[^a-zA-ZğüşiöçĞÜŞİÖÇıI]/g' // ensure it's correct
);

fs.writeFileSync('src/components/LexisGame.tsx', code);
