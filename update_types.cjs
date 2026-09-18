const fs = require('fs');
let types = fs.readFileSync('src/types.ts', 'utf8');

types = types.replace(
  /\| 'lexis_round_end';/,
  "| 'lexis_round_end'\n  | 'sketch_drawing'\n  | 'sketch_round_end';"
);

types = types.replace(
  /gameMode\?: 'truth' \| 'lexis';/,
  "gameMode?: 'truth' | 'lexis' | 'sketch';"
);

types = types.replace(
  /lexisCorrectGuesserIds\?: string\[\];/,
  "lexisCorrectGuesserIds?: string[];\n  sketchWord?: string;\n  sketchDrawerId?: string;\n  sketchCorrectGuesserIds?: string[];\n  sketchTimeLeft?: number;\n  sketchHints?: string[];\n  sketchCanvasState?: any;"
);

fs.writeFileSync('src/types.ts', types);
