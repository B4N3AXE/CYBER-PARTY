const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// Use proper grid layout for the parent container
code = code.replace(
  /<div className="w-full h-full flex flex-col lg:flex-row gap-4 lg:gap-4 overflow-hidden">/,
  '<div className="w-full h-full flex flex-col lg:grid lg:grid-cols-[260px_1fr_320px] gap-4 overflow-hidden">'
);

// Remove specific widths from asides since grid handles it
code = code.replace(
  /<aside className="w-full lg:w-60 shrink-0 flex flex-col rounded-xl bg-surface-container-low\/80 backdrop-blur-xl shadow-lg p-3 xl:p-4 gap-3 border border-outline-variant\/30 overflow-hidden">/,
  '<aside className="w-full flex flex-col rounded-xl bg-surface-container-low/80 backdrop-blur-xl shadow-lg p-3 xl:p-4 gap-3 border border-outline-variant/30 overflow-hidden min-h-[150px] lg:min-h-0">'
);

code = code.replace(
  /<aside className="w-full lg:w-80 shrink-0 flex flex-col rounded-xl bg-surface-container-low\/80 backdrop-blur-xl shadow-lg overflow-hidden border border-outline-variant\/30 h-\[250px\] lg:h-full">/,
  '<aside className="w-full flex flex-col rounded-xl bg-surface-container-low/80 backdrop-blur-xl shadow-lg overflow-hidden border border-outline-variant/30 h-[250px] lg:h-full">'
);


// Replace the color map
const oldColorsRegex = /\{\['#00f0ff', '#ff007f', '#00ff88', '#ffea00', '#ffffff', '#a855f7'\]\.map\(c => \(/;
const newColors = `{['#00f3ff', '#b026ff', '#00ff66', '#ff007f', '#ffee00', '#ffffff'].map(c => (`;
code = code.replace(oldColorsRegex, newColors);


// Check eraser styling to be #0f172a if we want it to blend or clear cleanly. 
// We'll leave eraser logic as-is, just making sure the color matches the background '#0a0e16' which is currently used for canvas clear.
// Wait, user asked for "Silgi (#0f172a)", let's make sure the canvas is #0f172a instead of #0a0e16

code = code.replace(/#0a0e16/g, '#0f172a');


fs.writeFileSync('src/components/SketchGame.tsx', code);
