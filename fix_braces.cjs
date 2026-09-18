const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `  function emitRoomUpdate(roomId: string) {
    if (rooms[roomId]) {
      io.to(roomId).emit('room_update', rooms[roomId]);
    }`,
  `  function emitRoomUpdate(roomId: string) {
    if (rooms[roomId]) {
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  }`
);

code = code.replace(
  `      emitRoomUpdate(roomId);
    }
io.on('connection',`,
  `      emitRoomUpdate(roomId);
    }
  }
io.on('connection',`
);

fs.writeFileSync('server.ts', code);
console.log("Braces fixed!");
