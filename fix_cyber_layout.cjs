const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// The main layout wrapper
code = code.replace(
  /<div className="w-full h-full flex flex-col lg:flex-row gap-4 lg:gap-4">/,
  '<div className="w-full h-full flex flex-col lg:flex-row gap-4 lg:gap-4 overflow-hidden">'
);

// LEADERBOARD aside
code = code.replace(
  /<aside className="w-full lg:w-56 shrink-0 flex flex-col rounded-xl bg-\[#0c121e\]\/80 backdrop-blur-xl shadow-lg p-3 xl:p-4 gap-3 border border-white\/10 overflow-hidden">/,
  '<aside className="w-full lg:w-60 shrink-0 flex flex-col rounded-xl bg-surface-container-low/80 backdrop-blur-xl shadow-lg p-3 xl:p-4 gap-3 border border-outline-variant/30 overflow-hidden">'
);

// Leaderboard item class update
code = code.replace(
  /className={`p-2 rounded-lg flex flex-col gap-1 relative overflow-hidden min-w-\[120px\] xl:min-w-0 shrink-0 \$\{isDrawingPlayer \? 'bg-emerald-500\/20 border border-emerald-400\/30' : didGuess \? 'bg-cyan-500\/20 border border-cyan-400\/30' : 'bg-white\/5 border border-white\/10'\}`\}/g,
  `className={\`p-2 rounded-lg flex flex-col gap-1 relative overflow-hidden min-w-[120px] lg:min-w-0 shrink-0 \${isDrawingPlayer ? 'bg-primary-container/20 border border-primary-container/40' : didGuess ? 'bg-secondary-container/20 border border-secondary-container/40' : 'bg-surface-container border border-outline-variant/30'}\`}`
);

// CHAT aside
code = code.replace(
  /<aside className="w-full lg:w-72 shrink-0 flex flex-col rounded-xl bg-\[#0c121e\]\/80 backdrop-blur-xl shadow-lg overflow-hidden border border-white\/10 h-\[250px\] lg:h-auto">/,
  '<aside className="w-full lg:w-80 shrink-0 flex flex-col rounded-xl bg-surface-container-low/80 backdrop-blur-xl shadow-lg overflow-hidden border border-outline-variant/30 h-[250px] lg:h-full">'
);

// CANVAS HOST
code = code.replace(
  /className="relative flex-1 w-full rounded-xl bg-\[#0a0e16\] overflow-hidden border border-emerald-500\/30 shadow-\[0_0_25px_rgba\(16,185,129,0\.15\)\] flex flex-col touch-none"/,
  'className="relative flex-1 w-full rounded-xl bg-[#0a0e16] overflow-hidden border border-primary-container/40 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col touch-none"'
);

// TOOLBAR container
code = code.replace(
  /<footer className="h-14 sm:h-16 shrink-0 px-2 sm:px-4 rounded-xl bg-\[#0c121e\]\/80 backdrop-blur-xl shadow-lg flex items-center justify-between border border-white\/10 overflow-x-auto custom-scrollbar">/,
  '<footer className="h-16 shrink-0 px-2 sm:px-4 rounded-xl bg-surface-container-low/90 backdrop-blur-xl shadow-lg flex items-center justify-between border border-outline-variant/30 overflow-x-auto custom-scrollbar gap-2">'
);

// Fix colors mapping loop for swatches
const swatchesRegex = /\{\['#00f0ff', '#ff007f', '#00ff88', '#ffea00', '#ffffff', '#a855f7'\]\.map\(c => \([\s\S]*?\}\)/;
const newSwatches = `{['#00f0ff', '#ff007f', '#00ff88', '#ffea00', '#ffffff', '#a855f7'].map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool(tool === 'eraser' ? 'brush' : tool); }}
                  onPointerDown={e => e.preventDefault()}
                  className={\`w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0 transition-all \${color === c && tool !== 'eraser' ? 'scale-110 ring-2 ring-primary' : 'hover:scale-110'}\`}
                  style={{ backgroundColor: c, boxShadow: \`0 0 8px \${c}\` }}
                />
              ))}`;

code = code.replace(swatchesRegex, newSwatches);


fs.writeFileSync('src/components/SketchGame.tsx', code);
console.log("Applied cyber layout and grid fixes");
