const fs = require('fs');
let code = fs.readFileSync('src/components/RoomView.tsx', 'utf8');

const mainMatch = /<main[^>]*>\s*\{\/\* Left Column: Lobi & Oyuncu Masası \*\/\}/;

code = code.replace(
  mainMatch,
  `<main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start min-h-0 overflow-y-auto xl:overflow-hidden custom-scrollbar" style={{ overflowAnchor: "none" }}>
        {room.settings?.gameMode === 'sketch' ? (
          <div className="col-span-1 xl:col-span-12 h-full min-h-0">
            <SketchGame room={room} myPlayer={myPlayer} socket={socket} />
          </div>
        ) : (
          <>
        {/* Left Column: Lobi & Oyuncu Masası */}`
);

// End of main
code = code.replace(
  /(<ChatPanel chat=\{room\.chat\} roomId=\{room\.id\} \/>\s*<\/section>\s*)(<\/main>)/,
  `$1
          </>
        )}
      $2`
);

// Fix the center column back to normal
code = code.replace(
  /\{room\.settings\?.gameMode === 'lexis' \? \([\s\S]*?<\/LexisGame>\s*\)\s*:\s*room\.settings\?.gameMode === 'sketch' \? \([\s\S]*?<\/SketchGame>\s*\)\s*:\s*\([\s\S]*?<\/GameBoard>\s*\)\}/,
  `{room.settings?.gameMode === 'lexis' ? (
            <LexisGame room={room} myPlayer={myPlayer} socket={socket} />
          ) : (
            <GameBoard room={room} myPlayer={myPlayer} />
          )}`
);

fs.writeFileSync('src/components/RoomView.tsx', code);
