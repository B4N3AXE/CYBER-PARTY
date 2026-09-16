const fs = require('fs');

// 1. RoomView.tsx
let rv = fs.readFileSync('src/components/RoomView.tsx', 'utf8');
rv = rv.replace(
  /<span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-300">\s*CYBER<span className="text-neonPink">HUB<\/span>\s*<\/span>/,
  `{room.settings?.gameMode === 'lexis' ? (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                    CYBER<span className="text-cyan-400">LEXIS</span>
                  </span>
                ) : (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-300">
                    CYBER<span className="text-neonPink">SPIN</span>
                  </span>
                )}`
);
fs.writeFileSync('src/components/RoomView.tsx', rv);

// 2. Lobby.tsx
let l = fs.readFileSync('src/components/Lobby.tsx', 'utf8');
l = l.replace(
  /CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">HUB<\/span>/,
  'CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">PARTY</span>'
);
l = l.replace(
  /CyberHub Parti Odası • Canlı Senkronize Bağlantı/,
  'CyberParty Parti Odası • Canlı Senkronize Bağlantı'
);
fs.writeFileSync('src/components/Lobby.tsx', l);

