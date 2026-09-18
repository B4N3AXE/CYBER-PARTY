const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// Also update the canvas background grid colors in SketchGame.tsx
code = code.replace(
  /<div className="absolute inset-0 pointer-events-none opacity-20 bg-\[radial-gradient\(#10b981_1px,transparent_1px\)\] \[background-size:24px_24px\]"><\/div>/g,
  '<div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px]"></div>'
);

// Update status text colors
code = code.replace(/text-emerald-300/g, 'text-primary');
code = code.replace(/text-emerald-400/g, 'text-primary-container');
code = code.replace(/text-emerald-500/g, 'text-primary-fixed-dim');
code = code.replace(/bg-emerald-500\/20/g, 'bg-primary-container/20');
code = code.replace(/border-emerald-400\/30/g, 'border-primary-container/30');
code = code.replace(/border-emerald-400\/50/g, 'border-primary-container/50');

fs.writeFileSync('src/components/SketchGame.tsx', code);
