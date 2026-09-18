const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexEmit = /^[ \t]*function emitRoomUpdate\([^\)]*\)\s*\{[\s\S]*?\n[ \t]*\}\n/m;
const regexSys = /^[ \t]*function addSystemMessage\([^\)]*\)\s*\{[\s\S]*?\n[ \t]*\}\n/m;

const matchEmit = code.match(regexEmit);
const matchSys = code.match(regexSys);

if (matchEmit && matchSys) {
  code = code.replace(matchEmit[0], '');
  code = code.replace(matchSys[0], '');

  // Add them right before io.on('connection')
  const ioOnStr = "io.on('connection',";
  const ioOnIdx = code.indexOf(ioOnStr);
  
  if (ioOnIdx !== -1) {
    const toInsert = matchEmit[0] + '\n' + matchSys[0] + '\n';
    code = code.substring(0, ioOnIdx) + toInsert + code.substring(ioOnIdx);
    fs.writeFileSync('server.ts', code);
    console.log("Functions moved successfully!");
  } else {
    console.log("io.on not found");
  }
} else {
  console.log("Functions not found!");
}
