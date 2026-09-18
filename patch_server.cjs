const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add sketch state to rooms object or globally
code = code.replace(
  /const rooms: Record<string, Room> = \{\};/,
  `const rooms: Record<string, Room> = {};
const sketchPools: Record<string, string[]> = {};
const sketchTimers: Record<string, NodeJS.Timeout> = {};
const CYBER_SKETCH_WORDS = ["RADAR", "LAZER", "ROBOT", "DRONE", "VİRÜS", "KABLO", "EKRAN", "KLAVYE", "HACKER", "MODEM", "SİBER", "PORTAL", "MATRİX", "AVATAR", "SENSÖR", "KRİPTO", "JETPACK", "ANDROID", "NEON", "GLITCH", "CYBORG", "HOLOGRAM"];
`
);

// Add start_game logic for sketch
code = code.replace(
  /room\.phase = room\.settings\.gameMode === 'lexis' \? 'lexis_write' : 'spin_questioner';/,
  `room.phase = room.settings.gameMode === 'lexis' ? 'lexis_write' : (room.settings.gameMode === 'sketch' ? 'sketch_drawing' : 'spin_questioner');`
);

code = code.replace(
  /if\(room\.settings\.gameMode === 'lexis'\) \{/,
  `if(room.settings.gameMode === 'lexis') {`
);

// Find the block where `room.currentRound = 1;` is inside `start_game`
// We will replace `room.currentRound = 1;` with the initialization logic for sketch too.
code = code.replace(
  /room\.currentRound = 1;/,
  `room.currentRound = 1;
      if (room.settings.gameMode === 'sketch') {
        room.sketchCorrectGuesserIds = [];
        room.sketchCanvasState = null;
        room.sketchDrawerId = room.players[0].id;
        sketchPools[data.roomId] = [...CYBER_SKETCH_WORDS];
        startSketchRound(data.roomId, room);
      }`
);

// Add sketch functions before socket.on('connection')
const sketchFunctions = `
function getNextSketchWord(roomId: string) {
  if (!sketchPools[roomId] || sketchPools[roomId].length === 0) {
    sketchPools[roomId] = [...CYBER_SKETCH_WORDS];
  }
  const pool = sketchPools[roomId];
  const idx = Math.floor(Math.random() * pool.length);
  const word = pool.splice(idx, 1)[0];
  return word;
}

function startSketchRound(roomId: string, room: Room) {
  if (sketchTimers[roomId]) clearInterval(sketchTimers[roomId]);
  
  room.phase = 'sketch_drawing';
  room.sketchWord = getNextSketchWord(roomId);
  room.sketchCorrectGuesserIds = [];
  room.sketchCanvasState = null;
  room.sketchTimeLeft = 60; // 60 seconds
  
  // Calculate hint array (e.g. "_ _ A _ _")
  room.sketchHints = room.sketchWord.split('').map(() => '_');
  
  emitRoomUpdate(roomId);
  
  sketchTimers[roomId] = setInterval(() => {
    if (room.phase !== 'sketch_drawing') {
      clearInterval(sketchTimers[roomId]);
      return;
    }
    
    room.sketchTimeLeft! -= 1;
    
    // Reveal a hint at 40s and 20s
    if (room.sketchTimeLeft === 40 || room.sketchTimeLeft === 20) {
      const hiddenIndices = room.sketchHints!.map((char, i) => char === '_' ? i : -1).filter(i => i !== -1);
      if (hiddenIndices.length > 1) { // Leave at least 1 hidden
        const revealIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        room.sketchHints![revealIdx] = room.sketchWord![revealIdx];
        addSystemMessage(roomId, \`İpucu: \${revealIdx + 1}. Harf '\${room.sketchWord![revealIdx]}'\`);
      }
    }
    
    io.to(roomId).emit('sketch_timer_tick', { timeLeft: room.sketchTimeLeft, hints: room.sketchHints });
    
    if (room.sketchTimeLeft! <= 0 || room.sketchCorrectGuesserIds!.length === room.players.length - 1) {
      clearInterval(sketchTimers[roomId]);
      endSketchRound(roomId, room);
    }
  }, 1000);
}

function endSketchRound(roomId: string, room: Room) {
  room.phase = 'sketch_round_end';
  addSystemMessage(roomId, \`Tur Bitti! Gizli Kelime: \${room.sketchWord}\`);
  emitRoomUpdate(roomId);
}
`;

code = code.replace(/io\.on\('connection', \(socket: Socket\) => \{/, sketchFunctions + '\nio.on(\'connection\', (socket: Socket) => {');

// Add socket events for sketch inside io.on
const socketEvents = `
  socket.on('sketch_draw', (data: { roomId: string; action: string; payload: any }) => {
    const room = rooms[data.roomId];
    if (room && room.sketchDrawerId === socket.id) {
      // Just broadcast drawing events to others to keep it real-time and lightweight
      socket.to(data.roomId).emit('sketch_draw_event', data);
    }
  });
  
  socket.on('sketch_clear', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (room && room.sketchDrawerId === socket.id) {
      room.sketchCanvasState = null;
      socket.to(data.roomId).emit('sketch_clear_event');
    }
  });

  socket.on('sketch_guess', (data: { roomId: string; guess: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'sketch_drawing') return;
    if (room.sketchDrawerId === socket.id) return; // Drawer can't guess
    if (room.sketchCorrectGuesserIds?.includes(socket.id)) return; // Already guessed
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const normalizedGuess = data.guess.toLocaleUpperCase('tr-TR').trim();
    if (normalizedGuess === room.sketchWord) {
      room.sketchCorrectGuesserIds.push(socket.id);
      
      // Calculate points (faster = more points)
      const points = Math.floor((room.sketchTimeLeft || 0) * 5) + 50; 
      player.score += points;
      
      // Give points to drawer too
      const drawer = room.players.find(p => p.id === room.sketchDrawerId);
      if (drawer) {
        drawer.score += 20; // 20 points per correct guess for the drawer
      }
      
      io.to(data.roomId).emit('sketch_correct_guess', { 
        playerId: socket.id, 
        playerName: player.name, 
        points 
      });
      emitRoomUpdate(data.roomId);
      
      // Check if everyone guessed
      if (room.sketchCorrectGuesserIds.length === room.players.length - 1) {
        if (sketchTimers[data.roomId]) clearInterval(sketchTimers[data.roomId]);
        endSketchRound(data.roomId, room);
      }
    } else {
      // Just a normal chat message if it's wrong
      io.to(data.roomId).emit('chat_message', {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        senderName: player.name,
        senderAvatar: player.avatar,
        text: data.guess,
        timestamp: Date.now()
      });
    }
  });
  
  socket.on('sketch_next_round', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'sketch_round_end') return;
    
    // Check if game over
    if (room.currentRound >= room.settings.rounds) {
      room.phase = 'game_over';
      emitRoomUpdate(data.roomId);
      return;
    }
    
    room.currentRound++;
    // Next drawer
    const currentDrawerIdx = room.players.findIndex(p => p.id === room.sketchDrawerId);
    let nextDrawerIdx = currentDrawerIdx + 1;
    if (nextDrawerIdx >= room.players.length) nextDrawerIdx = 0;
    room.sketchDrawerId = room.players[nextDrawerIdx].id;
    
    startSketchRound(data.roomId, room);
  });
`;

code = code.replace(/socket\.on\('disconnect', \(\) => \{/, socketEvents + '\n  socket.on(\'disconnect\', () => {');

// Also on disconnect, handle if drawer disconnects or if room is destroyed
code = code.replace(
  /if \(room\.players\.length === 0\) \{/,
  `if (room.players.length === 0) {
        if (sketchTimers[roomId]) clearInterval(sketchTimers[roomId]);
        delete sketchPools[roomId];`
);

fs.writeFileSync('server.ts', code);
