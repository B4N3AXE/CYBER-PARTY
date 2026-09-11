import express from 'express';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Room, Player, GamePhase, RoomSettings, ChatMessage } from './src/types.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // Allow up to 10MB for image uploads
});
const PORT = 3000;

// In-memory state
const rooms: Record<string, Room> = {};

// Helper: Generate 6-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

// Socket handler
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('create_room', (data: { name: string; avatar: string }, callback) => {
    const roomId = generateRoomCode();
    const player: Player = {
      id: socket.id,
      name: data.name,
      avatar: data.avatar,
      isHost: true,
      isReady: false,
      score: 0,
      jokers: { pass: 1, changeQuestion: 1 }
    };

    rooms[roomId] = {
      id: roomId,
      settings: { rounds: 10, passJokers: 1, changeJokers: 1 },
      players: [player],
      phase: 'lobby',
      currentRound: 0,
      questionerId: null,
      answererId: null,
      selectedType: null,
      question: null,
      proofMedia: null,
      votes: {},
      bets: {},
      chat: [], answerText: null, dareResult: null, readyForNextRound: []
    };

    socket.join(roomId);
    callback({ success: true, roomId });
    emitRoomUpdate(roomId);
  });

  socket.on('join_room', (data: { roomId: string; name: string; avatar: string }, callback) => {
    const room = rooms[data.roomId];
    if (!room) {
      return callback({ success: false, message: 'Oda bulunamadı' });
    }
    if (room.phase !== 'lobby') {
      return callback({ success: false, message: 'Oyun zaten başlamış' });
    }
    
    if (room.players.find(p => p.id === socket.id)) {
      return callback({ success: false, message: 'Zaten odadasınız' });
    }

    const player: Player = {
      id: socket.id,
      name: data.name,
      avatar: data.avatar,
      isHost: false,
      isReady: false,
      score: 0,
      jokers: { pass: room.settings.passJokers, changeQuestion: room.settings.changeJokers }
    };

    room.players.push(player);
    socket.join(data.roomId);
    callback({ success: true, roomId: data.roomId });
    
    addSystemMessage(data.roomId, `${data.name} odaya katıldı!`);
    emitRoomUpdate(data.roomId);
  });

  socket.on('update_settings', (data: { roomId: string; settings: RoomSettings }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player?.isHost && room.phase === 'lobby') {
      room.settings = data.settings;
      room.players.forEach(p => {
        p.jokers = { pass: room.settings.passJokers, changeQuestion: room.settings.changeJokers };
      });
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('toggle_ready', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player && room.phase === 'lobby') {
      player.isReady = !player.isReady;
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('start_game', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player?.isHost && room.phase === 'lobby') {
      if (room.players.length < 1) return;
      if (room.players.some(p => !p.isReady)) return;

      room.phase = 'spin_questioner';
      room.currentRound = 1;
      emitRoomUpdate(data.roomId);
      
      addSystemMessage(data.roomId, 'Oyun başladı!');
      
      // Auto-transition to next phase after a short delay for animation
      setTimeout(() => {
         const r = rooms[data.roomId];
         if(r && r.phase === 'spin_questioner') {
             // Select random questioner
             const questioner = r.players[Math.floor(Math.random() * r.players.length)];
             r.questionerId = questioner.id;
             r.phase = 'spin_answerer';
             emitRoomUpdate(data.roomId);
             addSystemMessage(data.roomId, `${questioner.name} soruyu soracak kişi seçildi!`);

             // Spin answerer
             setTimeout(() => {
                 const r2 = rooms[data.roomId];
                 if(r2 && r2.phase === 'spin_answerer') {
                     // Select someone other than questioner if possible
                     let potential = r2.players.filter(p => p.id !== r2.questionerId);
                     if (potential.length === 0) potential = r2.players;
                     const answerer = potential[Math.floor(Math.random() * potential.length)];
                     r2.answererId = answerer.id;
                     r2.phase = 'choose_type';
                     r2.bets = {};
                     emitRoomUpdate(data.roomId);
                     addSystemMessage(data.roomId, `${answerer.name} soruyu cevaplayacak kişi!`);
                 }
             }, 3500);
         }
      }, 3500);
    }
  });

  socket.on('choose_type', (data: { roomId: string; type: 'truth' | 'dare' }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (room.answererId === socket.id && room.phase === 'choose_type') {
      room.selectedType = data.type;
      room.phase = 'ask_question';
      
      // Calculate bets
      for (const [bettorId, bet] of Object.entries(room.bets)) {
          if (bet === data.type) {
              const bettor = room.players.find(p => p.id === bettorId);
              if (bettor) bettor.score += 5;
          }
      }
      room.bets = {}; // clear bets for next round
      
      emitRoomUpdate(data.roomId);
      addSystemMessage(data.roomId, `${room.players.find(p=>p.id === socket.id)?.name} '${data.type === 'truth' ? 'Doğruluk' : 'Cesaret'}' seçti!`);
    }
  });

  socket.on('submit_question', (data: { roomId: string; question: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (room.questionerId === socket.id && room.phase === 'ask_question') {
      room.question = data.question;
      if (room.selectedType === 'truth') {
        room.phase = 'wait_answer';
      } else {
        room.phase = 'dare_proof'; // User needs to do the dare and upload proof
      }
      emitRoomUpdate(data.roomId);
      addSystemMessage(data.roomId, `${room.players.find(p=>p.id === socket.id)?.name} soruyu sordu!`);
    }
  });

  socket.on('answer_truth', (data: { roomId: string; answer: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (room.answererId === socket.id && room.phase === 'wait_answer') {
      const p = room.players.find(p => p.id === socket.id);
      if (p) p.score += 10;
      
      addSystemMessage(data.roomId, `${p?.name} cevapladı: "${data.answer}"`);
      room.answerText = data.answer;
      room.readyForNextRound = [];
      room.phase = 'round_end';
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('upload_proof', (data: { roomId: string; mediaUrl: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (room.answererId === socket.id && room.phase === 'dare_proof') {
      room.proofMedia = data.mediaUrl;
      room.phase = 'dare_vote';
      room.votes = {};
      emitRoomUpdate(data.roomId);
      addSystemMessage(data.roomId, `${room.players.find(p=>p.id === socket.id)?.name} kanıt yükledi. Oylama başladı!`);
    }
  });

  socket.on('vote_proof', (data: { roomId: string; vote: 'approve' | 'reject' }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    
    // Observers vote
    if (room.phase === 'dare_vote' && socket.id !== room.answererId) {
      room.votes[socket.id] = data.vote;
      emitRoomUpdate(data.roomId);
      
      // Check if everyone voted (except answerer)
      const voters = room.players.filter(p => p.id !== room.answererId);
      if (Object.keys(room.votes).length === voters.length) {
          let approve = 0;
          let reject = 0;
          for (const v of Object.values(room.votes)) {
              if (v === 'approve') approve++; else reject++;
          }
          
          if (approve > reject || (approve === reject && approve > 0)) {
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
          emitRoomUpdate(data.roomId);
      }
    }
  });

  socket.on('place_bet', (data: { roomId: string; bet: string }) => {
     const room = rooms[data.roomId];
     if (!room) return;
     if (socket.id === room.answererId) return; // Cannot bet on yourself
     
     room.bets[socket.id] = data.bet;
     emitRoomUpdate(data.roomId);
  });

  socket.on('chat-message', (data: { roomId: string; text: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderName: player.name,
        senderAvatar: player.avatar,
        text: data.text,
        timestamp: Date.now()
      };
      room.chat.push(msg);
      // keep only last 50
      if (room.chat.length > 50) room.chat.shift();
      
      // Send chat message specifically to all clients in the room
      io.to(data.roomId).emit('chat-message', msg);
      
      // We still update the room state for late joiners, but chat is handled in real-time above
      emitRoomUpdate(data.roomId); 
    }
  });

  socket.on('use_joker', (data: { roomId: string; joker: 'pass' | 'change' }) => {
      const room = rooms[data.roomId];
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      
      if (player && player.jokers[data.joker === 'pass' ? 'pass' : 'changeQuestion'] > 0) {
          
          if (data.joker === 'pass' && room.answererId === socket.id) {
              player.jokers.pass--;
              addSystemMessage(data.roomId, `${player.name} pas jokerini kullandı!`);
              room.dareResult = 'passed';
              room.readyForNextRound = [];
              room.phase = 'round_end';
              emitRoomUpdate(data.roomId);
          } else if (data.joker === 'change' && (room.answererId === socket.id || room.questionerId === socket.id)) {
              player.jokers.changeQuestion--;
              addSystemMessage(data.roomId, `${player.name} soru değiştirme jokerini kullandı!`);
              room.phase = 'choose_type'; // Reset to choose type to pick a new question
              room.question = null;
              emitRoomUpdate(data.roomId);
          }
      }
  });


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

  socket.on('return_to_lobby', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player?.isHost && room.phase === 'game_over') {
        room.phase = 'lobby';
        room.players.forEach(p => {
            p.isReady = false;
            p.score = 0; // Reset scores for next game
            p.jokers = { pass: room.settings.passJokers, changeQuestion: room.settings.changeJokers };
        });
        room.readyForNextRound = [];
        room.answerText = null;
        room.dareResult = null;
        emitRoomUpdate(data.roomId);
        addSystemMessage(data.roomId, 'Lobiye dönüldü, yeni oyun için bekleniyor.');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up rooms
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          if (player.isHost) {
            room.players[0].isHost = true; // Assign new host
          }
          addSystemMessage(roomId, `${player.name} odadan ayrıldı.`);
          emitRoomUpdate(roomId);
        }
      }
    }
  });

  function emitRoomUpdate(roomId: string) {
    if (rooms[roomId]) {
      io.to(roomId).emit('room_update', rooms[roomId]);
    }
  }

  function addSystemMessage(roomId: string, text: string) {
    const room = rooms[roomId];
    if (room) {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderName: 'Sistem',
        senderAvatar: '🤖',
        text,
        timestamp: Date.now(),
        isSystem: true
      };
      room.chat.push(msg);
      if (room.chat.length > 50) room.chat.shift();
      emitRoomUpdate(roomId);
    }
  }

  function startNextRound(roomId: string) {
      const room = rooms[roomId];
      if (!room) return;
      
      if (room.currentRound >= room.settings.rounds) {
          addSystemMessage(roomId, 'Oyun Bitti!');
          room.phase = 'game_over';
      } else {
          room.currentRound++;
          room.phase = 'spin_questioner';
          room.questionerId = null;
          room.answererId = null;
          room.selectedType = null;
          room.question = null;
          room.proofMedia = null;
          room.votes = {};
          room.bets = {};
          room.answerText = null;
          room.dareResult = null;
          room.readyForNextRound = [];
          
          // Current answerer becomes the new questioner for flow, or spin again
          // Let's spin again for both for max chaos as requested
          setTimeout(() => {
             const r = rooms[roomId];
             if(r && r.phase === 'spin_questioner') {
                 const questioner = r.players[Math.floor(Math.random() * r.players.length)];
                 r.questionerId = questioner.id;
                 r.phase = 'spin_answerer';
                 emitRoomUpdate(roomId);
                 addSystemMessage(roomId, `${questioner.name} soruyu soracak kişi seçildi!`);
    
                 setTimeout(() => {
                     const r2 = rooms[roomId];
                     if(r2 && r2.phase === 'spin_answerer') {
                         let potential = r2.players.filter(p => p.id !== r2.questionerId);
                         if (potential.length === 0) potential = r2.players;
                         const answerer = potential[Math.floor(Math.random() * potential.length)];
                         r2.answererId = answerer.id;
                         r2.phase = 'choose_type';
                         emitRoomUpdate(roomId);
                         addSystemMessage(roomId, `${answerer.name} soruyu cevaplayacak kişi!`);
                     }
                 }, 3500);
             }
          }, 3500);
      }
      emitRoomUpdate(roomId);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
