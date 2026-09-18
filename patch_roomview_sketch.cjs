const fs = require('fs');
let code = fs.readFileSync('src/components/RoomView.tsx', 'utf8');

if (!code.includes('import SketchGame')) {
  code = code.replace(
    /import LexisGame from '\.\/LexisGame';/,
    "import LexisGame from './LexisGame';\nimport SketchGame from './SketchGame';"
  );
}

// Replace the game switch in the center column
code = code.replace(
  /\{room\.settings\?.gameMode === 'lexis' \? \([\s\S]*?<\/LexisGame>[\s\S]*?\) : \([\s\S]*?<\/GameBoard>[\s\S]*?\)\}/,
  `{room.settings?.gameMode === 'lexis' ? (
            <LexisGame room={room} myPlayer={myPlayer} socket={socket} />
          ) : room.settings?.gameMode === 'sketch' ? (
            <SketchGame room={room} myPlayer={myPlayer} socket={socket} />
          ) : (
            <GameBoard room={room} myPlayer={myPlayer} />
          )}`
);

// We need to add Sketch to the room title bar
code = code.replace(
  /\{room\.settings\?.gameMode === 'lexis' \? \([\s\S]*?CYBER<span className="text-cyan-400">LEXIS<\/span>[\s\S]*?\) : \([\s\S]*?CYBER<span className="text-neonPink">SPIN<\/span>[\s\S]*?\)\}/,
  `{room.settings?.gameMode === 'lexis' ? (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                    CYBER<span className="text-cyan-400">LEXIS</span>
                  </span>
                ) : room.settings?.gameMode === 'sketch' ? (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-300">
                    CYBER<span className="text-emerald-400">SKETCH</span>
                  </span>
                ) : (
                  <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-300">
                    CYBER<span className="text-neonPink">SPIN</span>
                  </span>
                )}`
);

fs.writeFileSync('src/components/RoomView.tsx', code);
