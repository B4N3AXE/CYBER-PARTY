const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("    }\n\nio.on('connection'", "    }\n  }\n\nio.on('connection'");
fs.writeFileSync('server.ts', code);
