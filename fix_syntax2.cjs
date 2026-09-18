const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

code = code.replace(
  `                />
              )))}`,
  `                />
              ))}`
);

fs.writeFileSync('src/components/SketchGame.tsx', code);
