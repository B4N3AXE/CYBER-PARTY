const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// Change `xl:flex-row` to `lg:flex-row`
code = code.replace(/xl:flex-row/g, 'lg:flex-row');
code = code.replace(/xl:w-60/g, 'lg:w-56');
code = code.replace(/xl:w-80/g, 'lg:w-72');
code = code.replace(/xl:gap-6/g, 'lg:gap-4');
code = code.replace(/xl:h-auto/g, 'lg:h-auto');

fs.writeFileSync('src/components/SketchGame.tsx', code);
console.log("Replaced layout in SketchGame.tsx");
