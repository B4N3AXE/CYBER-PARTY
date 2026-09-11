const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Update Google Fonts
html = html.replace(
  /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Plus\+Jakarta\+Sans[^"]*" rel="stylesheet" \/>/g,
  '<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />'
);

// Ensure body has h-full if needed, or just let App.tsx handle it. The user added "h-full" to html.
html = html.replace('<html lang="tr" class="dark">', '<html lang="tr" class="dark h-full">');

fs.writeFileSync('index.html', html);
