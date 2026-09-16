const fs = require('fs');
let code = fs.readFileSync('src/components/LexisGame.tsx', 'utf8');

// Update evaluateGuess
code = code.replace(/const result = Array\(5\)\.fill\('absent'\);/, `const len = target.length;\n    const result = Array(len).fill('absent');`);
code = code.replace(/const targetUsed = Array\(5\)\.fill\(false\);/, `const targetUsed = Array(len).fill(false);`);
code = code.replace(/for \(let i = 0; i < 5; i\+\+\) \{/g, `for (let i = 0; i < len; i++) {`);
code = code.replace(/for \(let j = 0; j < 5; j\+\+\) \{/, `for (let j = 0; j < len; j++) {`);

// LexisWritePhase logic
// replace maxLength={5}
code = code.replace(/maxLength=\{5\}/, `minLength={4} maxLength={7}`);
code = code.replace(/if \(word\.length === 5 && hint\.trim\(\)\.length > 0\)/, `if (word.length >= 4 && word.length <= 7 && hint.trim().length > 0)`);
code = code.replace(/disabled=\{word\.length !== 5 \|\| hint\.length === 0\}/, `disabled={word.length < 4 || word.length > 7 || hint.length === 0}`);
code = code.replace(/5 Harfli Gizli Kelime/, `4-7 Harfli Gizli Kelime`);

// The validation alert logic
code = code.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{\s+e\.preventDefault\(\);\s+if \(word\.length >= 4 && word\.length <= 7 && hint\.trim\(\)\.length > 0\) \{\s+socket\.emit\('lexis_submit_word', \{ roomId: room\.id, word, hint \}\);\s+\}\s+\};/m,
  `const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.length < 4 || word.length > 7) {
      alert("Kelime 4 ile 7 harf arasında olmalıdır kanka!");
      return;
    }
    if (word.length >= 4 && word.length <= 7 && hint.trim().length > 0) {
      socket.emit('lexis_submit_word', { roomId: room.id, word, hint });
    }
  };`
);


// LexisGuessPhase logic
// 1. limit on typing should be dynamic based on lexisWord.length
code = code.replace(/if \(prev\.length < 5\) return prev \+ e\.key\.toUpperCase\(\);/g, `if (prev.length < lexisWord.length) return prev + e.key.toUpperCase();`);
code = code.replace(/if \(currentGuess\.length === 5\) \{/g, `if (currentGuess.length === lexisWord.length) {`);
code = code.replace(/else if \(currentGuess\.length < 5\) setCurrentGuess\(prev => prev \+ key\);/g, `else if (currentGuess.length < lexisWord.length) setCurrentGuess(prev => prev + key);`);

// 2. Grid rendering for guesses
code = code.replace(/let rowStatus = Array\(5\)\.fill\('empty'\);/g, `let rowStatus = Array(lexisWord.length).fill('empty');`);
code = code.replace(/rowStr = currentGuess\.padEnd\(5, ' '\);/g, `rowStr = currentGuess.padEnd(lexisWord.length, ' ');`);
code = code.replace(/rowStatus = Array\(5\)\.fill\('typing'\);/g, `rowStatus = Array(lexisWord.length).fill('typing');`);
code = code.replace(/rowStr = '     ';/g, `rowStr = ' '.repeat(lexisWord.length);`);

// grid layout for grid-cols-5 -> grid-cols-{lexisWord.length} dynamically?
// Tailwind needs concrete classes or we can use inline style for gridTemplateColumns
code = code.replace(
  /<div key=\{rowIndex\} className="grid grid-cols-5 gap-2">/,
  `<div key={rowIndex} className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: \`repeat(\${lexisWord.length}, minmax(0, 1fr))\` }}>`
);
code = code.replace(/\{\[0, 1, 2, 3, 4\]\.map\(colIndex => \{/g, `{[...Array(lexisWord.length)].map((_, colIndex) => {`);

fs.writeFileSync('src/components/LexisGame.tsx', code);
