const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix startSketchRound interval condition
code = code.replace(
  /if \(room\.sketchTimeLeft! <= 0 \|\| room\.sketchCorrectGuesserIds!\.length === room\.players\.length - 1\) \{/g,
  `const target = Math.max(1, room.players.length - 1);
    if (room.sketchTimeLeft! <= 0 || room.sketchCorrectGuesserIds!.length >= target) {`
);

// Fix sketch_guess condition
code = code.replace(
  /if \(room\.sketchCorrectGuesserIds\.length === room\.players\.length - 1\) \{/g,
  `const target = Math.max(1, room.players.length - 1);
      if (room.sketchCorrectGuesserIds.length >= target) {`
);

fs.writeFileSync('server.ts', code);
