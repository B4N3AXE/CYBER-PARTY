const fs = require('fs');
let code = fs.readFileSync('src/components/Lobby.tsx', 'utf8');

code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">/,
  '<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">'
);

fs.writeFileSync('src/components/Lobby.tsx', code);
console.log("Replaced layout in Lobby.tsx");
