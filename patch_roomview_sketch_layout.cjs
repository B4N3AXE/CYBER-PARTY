const fs = require('fs');
let code = fs.readFileSync('src/components/RoomView.tsx', 'utf8');

// I will just conditionally render the entire <main> block content.
// Basically:
// <main ...>
//   {room.settings?.gameMode === 'sketch' ? (
//     <SketchGame room={room} myPlayer={myPlayer} socket={socket} />
//   ) : (
//     <>
//       <section xl-col-span-3>...</section>
//       <section xl-col-span-6>...</section>
//       <section xl-col-span-3>...</section>
//     </>
//   )}
// </main>

// First let's read the main block.
code = code.replace(
  /(<main[^>]*>)\s*(<section className="xl:col-span-3)/,
  `$1
        {room.settings?.gameMode === 'sketch' ? (
          <div className="col-span-1 xl:col-span-12 h-full min-h-0">
            <SketchGame room={room} myPlayer={myPlayer} socket={socket} />
          </div>
        ) : (
          <>
        $2`
);

code = code.replace(
  /(<ChatPanel chat=\{room\.chat\} roomId=\{room\.id\} \/>\s*<\/section>)\s*(<\/main>)/,
  `$1
          </>
        )
        $2`
);

// We need to revert the change I did inside the center column.
code = code.replace(
  /\{room\.settings\?.gameMode === 'lexis' \? \([\s\S]*?<\/LexisGame>\s*\)\s*:\s*room\.settings\?.gameMode === 'sketch' \? \([\s\S]*?<\/SketchGame>\s*\)\s*:\s*\([\s\S]*?<\/GameBoard>\s*\)\}/,
  `{room.settings?.gameMode === 'lexis' ? (
            <LexisGame room={room} myPlayer={myPlayer} socket={socket} />
          ) : (
            <GameBoard room={room} myPlayer={myPlayer} />
          )}`
);

fs.writeFileSync('src/components/RoomView.tsx', code);
