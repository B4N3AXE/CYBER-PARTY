const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Initializer in create_room
content = content.replace('chat: []', 'chat: [], answerText: null, dareResult: null, readyForNextRound: []');

// 2. Initializer in return_to_lobby
content = content.replace('p.jokers = { pass: room.settings.passJokers, changeQuestion: room.settings.changeJokers };\n        });', 'p.jokers = { pass: room.settings.passJokers, changeQuestion: room.settings.changeJokers };\n        });\n        room.readyForNextRound = [];\n        room.answerText = null;\n        room.dareResult = null;');

// 3. answer_truth
content = content.replace(
`      addSystemMessage(data.roomId, \`\${p?.name} cevapladı: "\${data.answer}"\`);
      room.phase = 'round_end';
      emitRoomUpdate(data.roomId);
      
      setTimeout(() => startNextRound(data.roomId), 5000);`,
`      addSystemMessage(data.roomId, \`\${p?.name} cevapladı: "\${data.answer}"\`);
      room.answerText = data.answer;
      room.readyForNextRound = [];
      room.phase = 'round_end';
      emitRoomUpdate(data.roomId);`
);

// 4. vote_proof
content = content.replace(
`          if (approve > reject || (approve === reject && approve > 0)) {
              const p = room.players.find(p => p.id === room.answererId);
              if (p) p.score += 25;
              addSystemMessage(data.roomId, 'Görev onaylandı! (+25 Puan)');
          } else {
              addSystemMessage(data.roomId, 'Görev reddedildi! (0 Puan)');
          }
          
          // Reward correct bets (whether they do it or chicken out is mapped to approve/reject by community in this logic, or just a simple vote mechanic)
          
          room.phase = 'round_end';
          emitRoomUpdate(data.roomId);
          setTimeout(() => startNextRound(data.roomId), 5000);`,
`          if (approve > reject || (approve === reject && approve > 0)) {
              const p = room.players.find(p => p.id === room.answererId);
              if (p) p.score += 25;
              addSystemMessage(data.roomId, 'Görev onaylandı! (+25 Puan)');
              room.dareResult = 'approved';
          } else {
              addSystemMessage(data.roomId, 'Görev reddedildi! (0 Puan)');
              room.dareResult = 'rejected';
          }
          room.readyForNextRound = [];
          room.phase = 'round_end';
          emitRoomUpdate(data.roomId);`
);

// 5. use_joker (pass)
content = content.replace(
`          if (data.joker === 'pass' && room.answererId === socket.id) {
              player.jokers.pass--;
              addSystemMessage(data.roomId, \`\${player.name} pas jokerini kullandı!\`);
              room.phase = 'round_end';
              emitRoomUpdate(data.roomId);
              setTimeout(() => startNextRound(data.roomId), 3000);`,
`          if (data.joker === 'pass' && room.answererId === socket.id) {
              player.jokers.pass--;
              addSystemMessage(data.roomId, \`\${player.name} pas jokerini kullandı!\`);
              room.dareResult = 'passed';
              room.readyForNextRound = [];
              room.phase = 'round_end';
              emitRoomUpdate(data.roomId);`
);

// 6. ready_next_round event
const socketEventInjection = `
  socket.on('ready_next_round', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'round_end') return;
    
    if (!room.readyForNextRound.includes(socket.id)) {
      room.readyForNextRound.push(socket.id);
    }
    
    if (room.readyForNextRound.length >= room.players.length) {
      startNextRound(data.roomId);
    } else {
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('return_to_lobby',`;
content = content.replace("  socket.on('return_to_lobby',", socketEventInjection);

// 7. startNextRound
content = content.replace(
`          room.question = null;
          room.proofMedia = null;
          room.votes = {};
          room.bets = {};`,
`          room.question = null;
          room.proofMedia = null;
          room.votes = {};
          room.bets = {};
          room.answerText = null;
          room.dareResult = null;
          room.readyForNextRound = [];`
);

fs.writeFileSync('server.ts', content);
