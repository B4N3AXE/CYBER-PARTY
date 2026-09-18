import express from 'express';
import compression from 'compression';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Room, Player, GamePhase, RoomSettings, ChatMessage, Card, CardSuit, Cyber21Dealer, Cyber21Log, Player21Status } from './src/types.js';

const app = express();
app.use(compression());
const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // Allow up to 10MB for image uploads
});
const PORT = 3000;

// In-memory state
const rooms: Record<string, Room> = {};
const cyber21Decks: Record<string, Card[]> = {};
const cyber21Timers: Record<string, NodeJS.Timeout> = {};

// Helper: Generate 6-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

// Cyber-21 Helpers & Engine
const SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createCyberDeck(): Card[] {
  const deck: Card[] = [];
  // 4 decks in shoe for realistic casino tournament
  for (let d = 0; d < 4; d++) {
    for (const suit of SUITS) {
      for (const val of CARD_VALUES) {
        let numericValue = parseInt(val, 10);
        if (['J', 'Q', 'K'].includes(val)) numericValue = 10;
        else if (val === 'A') numericValue = 11;
        deck.push({ suit, value: val, numericValue, hidden: false });
      }
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHandValue(cards: Card[]): number {
  let total = 0;
  let aceCount = 0;
  for (const c of cards) {
    if (c.hidden) continue;
    total += c.numericValue;
    if (c.value === 'A') aceCount++;
  }
  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount--;
  }
  return total;
}

function isNaturalBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return calculateHandValue(cards) === 21;
}

function suitSymbol(suit: CardSuit): string {
  switch (suit) {
    case 'hearts': return '♥️';
    case 'diamonds': return '♦️';
    case 'clubs': return '♣️';
    case 'spades': return '♠️';
  }
}

function addCyber21Log(roomId: string, text: string, type: 'dealer' | 'player' | 'system' = 'system') {
  const room = rooms[roomId];
  if (!room) return;
  if (!room.cyber21Logs) room.cyber21Logs = [];
  room.cyber21Logs.push({
    id: Math.random().toString(36).substring(2, 9),
    text,
    timestamp: Date.now(),
    type
  });
  if (room.cyber21Logs.length > 50) room.cyber21Logs.shift();
}

function startCyber21Round(roomId: string, room: Room) {
  if (cyber21Timers[roomId]) clearInterval(cyber21Timers[roomId]);

  room.currentRound += 1;
  if (room.currentRound > room.settings.rounds) {
    room.phase = 'game_over';
    room.players.sort((a, b) => (b.chips || 0) - (a.chips || 0));
    addCyber21Log(roomId, `🏆 TURNUVA TAMAMLANDI! Şampiyon: ${room.players[0]?.name} (${(room.players[0]?.chips || 0).toLocaleString()} Çip)`, 'system');
    addSystemMessage(roomId, `Turnuva bitti! Şampiyon: ${room.players[0]?.name} (${(room.players[0]?.chips || 0).toLocaleString()} Çip)`);
    emitRoomUpdate(roomId);
    return;
  }

  // Ensure deck has enough cards
  if (!cyber21Decks[roomId] || cyber21Decks[roomId].length < 40) {
    cyber21Decks[roomId] = createCyberDeck();
    addCyber21Log(roomId, 'Desteler karıştırıldı ve Cyber-21 ayakkabısına yerleştirildi.', 'system');
  }

  // Reset dealer
  room.cyber21Dealer = {
    hand: [],
    handValue: 0,
    status: 'idle'
  };

  // Reset players
  room.players.forEach(p => {
    // If bankrupt, give tournament bailout chips so they stay in game
    if ((p.chips || 0) < 100) {
      p.chips = 1000;
      addCyber21Log(roomId, `${p.name} iflas ettiği için turnuva teşvik çipi aldı (+1,000 Çip).`, 'system');
    }
    p.score = p.chips || 0;
    p.currentBet = 0;
    p.hand = [];
    p.handValue = 0;
    p.status21 = 'betting';
    p.roundResult = null;
    p.payout = 0;
  });

  room.phase = 'cyber21_betting';
  room.cyber21TurnPlayerId = null;
  room.cyber21BetTimeLeft = 15;
  addCyber21Log(roomId, `=== TUR ${room.currentRound} / ${room.settings.rounds} BAŞLADI ===`, 'system');
  addCyber21Log(roomId, `Bahisler açıldı! 15 saniye içinde bahislerinizi belirleyin.`, 'system');
  emitRoomUpdate(roomId);

  cyber21Timers[roomId] = setInterval(() => {
    if (room.phase !== 'cyber21_betting') {
      clearInterval(cyber21Timers[roomId]);
      return;
    }

    room.cyber21BetTimeLeft = (room.cyber21BetTimeLeft || 0) - 1;

    if (room.cyber21BetTimeLeft <= 0) {
      clearInterval(cyber21Timers[roomId]);
      // Auto-bet for any player who didn't bet
      room.players.forEach(p => {
        if (!p.currentBet || p.currentBet === 0) {
          const autoBet = Math.min(500, p.chips || 100);
          p.currentBet = Math.max(100, autoBet);
          p.chips = Math.max(0, (p.chips || 0) - p.currentBet);
          p.score = p.chips;
          p.status21 = 'waiting';
          addCyber21Log(roomId, `${p.name} otomatik ${p.currentBet} çip bahis koydu.`, 'player');
        }
      });
      dealCyber21Cards(roomId, room);
    } else {
      emitRoomUpdate(roomId);
    }
  }, 1000);
}

function dealCyber21Cards(roomId: string, room: Room) {
  if (cyber21Timers[roomId]) clearInterval(cyber21Timers[roomId]);
  room.phase = 'cyber21_dealing';
  const deck = cyber21Decks[roomId];

  // Deal 2 cards to each player
  room.players.forEach(p => {
    const card1 = deck.pop() || { suit: 'spades', value: '10', numericValue: 10 };
    const card2 = deck.pop() || { suit: 'hearts', value: '10', numericValue: 10 };
    p.hand = [card1, card2];
    p.handValue = calculateHandValue(p.hand);
    if (isNaturalBlackjack(p.hand)) {
      p.status21 = 'blackjack';
      addCyber21Log(roomId, `⚡ ${p.name} DOĞAL BLACKJACK (21) YAPTI!`, 'player');
    } else {
      p.status21 = 'waiting';
    }
  });

  // Deal 2 cards to dealer: 1 face up, 1 face down
  const dealerCard1 = deck.pop() || { suit: 'clubs', value: '10', numericValue: 10 };
  const dealerCard2 = deck.pop() || { suit: 'diamonds', value: '7', numericValue: 7 };
  dealerCard2.hidden = true;
  room.cyber21Dealer = {
    hand: [dealerCard1, dealerCard2],
    handValue: dealerCard1.numericValue,
    status: 'idle'
  };

  addCyber21Log(roomId, `Krupiye kartları dağıttı. Açık Kart: ${dealerCard1.value}${suitSymbol(dealerCard1.suit)} (${dealerCard1.numericValue} Puan)`, 'dealer');
  emitRoomUpdate(roomId);

  setTimeout(() => {
    if (room.phase !== 'cyber21_dealing') return;
    room.phase = 'cyber21_player_turns';
    advanceCyber21Turn(roomId, room);
  }, 1200);
}

function advanceCyber21Turn(roomId: string, room: Room) {
  const nextPlayer = room.players.find(p => p.status21 === 'waiting');
  if (nextPlayer) {
    room.cyber21TurnPlayerId = nextPlayer.id;
    nextPlayer.status21 = 'playing';
    addCyber21Log(roomId, `Hamle sırası: ${nextPlayer.name} (Puan: ${nextPlayer.handValue})`, 'player');
    emitRoomUpdate(roomId);
  } else {
    room.cyber21TurnPlayerId = null;
    startCyber21DealerTurn(roomId, room);
  }
}

function startCyber21DealerTurn(roomId: string, room: Room) {
  room.phase = 'cyber21_dealer_turn';
  const dealer = room.cyber21Dealer!;
  const deck = cyber21Decks[roomId];

  // Reveal hole card
  if (dealer.hand[1]) {
    dealer.hand[1].hidden = false;
  }
  dealer.handValue = calculateHandValue(dealer.hand);
  addCyber21Log(roomId, `Krupiye kapalı kartını açtı: ${dealer.hand[1]?.value}${suitSymbol(dealer.hand[1]?.suit)}. Toplam: ${dealer.handValue} Puan`, 'dealer');

  if (isNaturalBlackjack(dealer.hand)) {
    dealer.status = 'blackjack';
    addCyber21Log(roomId, `⚡ KRUPİYE DOĞAL BLACKJACK YAPTI!`, 'dealer');
    emitRoomUpdate(roomId);
    setTimeout(() => endCyber21Round(roomId, room), 1500);
    return;
  }

  emitRoomUpdate(roomId);

  const allBusted = room.players.every(p => p.status21 === 'bust');
  if (allBusted) {
    dealer.status = 'stand';
    addCyber21Log(roomId, `Tüm oyuncular battığı için krupiye kart çekmeden durdu.`, 'dealer');
    emitRoomUpdate(roomId);
    setTimeout(() => endCyber21Round(roomId, room), 1500);
    return;
  }

  dealer.status = 'drawing';
  const stepDealer = () => {
    if (room.phase !== 'cyber21_dealer_turn') return;
    if (dealer.handValue < 17) {
      const newCard = deck.pop() || { suit: 'hearts', value: '5', numericValue: 5 };
      dealer.hand.push(newCard);
      dealer.handValue = calculateHandValue(dealer.hand);
      addCyber21Log(roomId, `Krupiye kart çekti: ${newCard.value}${suitSymbol(newCard.suit)} (Toplam: ${dealer.handValue} Puan)`, 'dealer');
      if (dealer.handValue > 21) {
        dealer.status = 'bust';
        addCyber21Log(roomId, `💥 KRUPİYE BATTI (${dealer.handValue})!`, 'dealer');
        emitRoomUpdate(roomId);
        setTimeout(() => endCyber21Round(roomId, room), 1500);
      } else {
        emitRoomUpdate(roomId);
        setTimeout(stepDealer, 1000);
      }
    } else {
      dealer.status = 'stand';
      addCyber21Log(roomId, `Krupiye ${dealer.handValue} puanda pas geçti.`, 'dealer');
      emitRoomUpdate(roomId);
      setTimeout(() => endCyber21Round(roomId, room), 1500);
    }
  };

  setTimeout(stepDealer, 1000);
}

function endCyber21Round(roomId: string, room: Room) {
  room.phase = 'cyber21_round_end';
  const dealer = room.cyber21Dealer!;
  const dealerScore = dealer.handValue;
  const dealerBust = dealerScore > 21;
  const dealerBJ = isNaturalBlackjack(dealer.hand);

  room.players.forEach(p => {
    const bet = p.currentBet || 0;
    if (p.status21 === 'bust') {
      p.roundResult = 'lose';
      p.payout = 0;
      addCyber21Log(roomId, `❌ ${p.name} battı. Kaybedilen: ${bet} çip`, 'player');
    } else if (p.status21 === 'blackjack') {
      if (dealerBJ) {
        p.roundResult = 'push';
        p.chips = (p.chips || 0) + bet;
        p.payout = bet;
        addCyber21Log(roomId, `🤝 ${p.name} Krupiye ile berabere (İkisi de Blackjack). ${bet} çip iade.`, 'player');
      } else {
        p.roundResult = 'blackjack';
        const winProfit = Math.floor(bet * 1.5);
        const totalPayout = bet + winProfit;
        p.chips = (p.chips || 0) + totalPayout;
        p.payout = totalPayout;
        addCyber21Log(roomId, `⚡ ${p.name} Blackjack ile kazandı! +${winProfit} çip kar (${totalPayout} çip ödeme).`, 'player');
      }
    } else {
      if (dealerBust) {
        p.roundResult = 'win';
        const totalPayout = bet * 2;
        p.chips = (p.chips || 0) + totalPayout;
        p.payout = totalPayout;
        addCyber21Log(roomId, `🎉 ${p.name} kazandı (Krupiye battı)! +${bet} çip kar.`, 'player');
      } else if (p.handValue! > dealerScore) {
        p.roundResult = 'win';
        const totalPayout = bet * 2;
        p.chips = (p.chips || 0) + totalPayout;
        p.payout = totalPayout;
        addCyber21Log(roomId, `🎉 ${p.name} kazandı (${p.handValue} vs ${dealerScore})! +${bet} çip kar.`, 'player');
      } else if (p.handValue === dealerScore) {
        p.roundResult = 'push';
        p.chips = (p.chips || 0) + bet;
        p.payout = bet;
        addCyber21Log(roomId, `🤝 ${p.name} Krupiye ile berabere (${p.handValue}). ${bet} çip iade.`, 'player');
      } else {
        p.roundResult = 'lose';
        p.payout = 0;
        addCyber21Log(roomId, `❌ ${p.name} kaybetti (${p.handValue} vs ${dealerScore}). -${bet} çip`, 'player');
      }
    }
    p.score = p.chips || 0;
  });

  room.players.sort((a, b) => (b.chips || 0) - (a.chips || 0));
  emitRoomUpdate(roomId);
}

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
      settings: { rounds: 10, passJokers: 1, changeJokers: 1, isPrivate: false, maxPlayers: 8, timeLimit: 60, sfx: true, gameMode: 'truth' },
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
      if (room.players.filter(p => !p.isHost).some(p => !p.isReady)) return;

      room.phase = room.settings.gameMode === 'lexis' ? 'lexis_write' : (room.settings.gameMode === 'cyber21' ? 'cyber21_betting' : 'spin_questioner');
      if(room.settings.gameMode === 'lexis') {
        room.lexisSubmissions = {};
        room.lexisAssignments = {};
        room.lexisGuesses = {};
        room.lexisCorrectGuesserIds = [];
      }
      room.currentRound = 0;
      if (room.settings.gameMode === 'cyber21') {
        room.cyber21Logs = [];
        room.cyber21InitialChips = room.settings.startingChips || 10000;
        room.players.forEach(p => {
          p.chips = room.cyber21InitialChips;
          p.score = p.chips;
          p.currentBet = 0;
          p.hand = [];
          p.handValue = 0;
          p.status21 = 'betting';
          p.roundResult = null;
        });
        startCyber21Round(data.roomId, room);
        return;
      }
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
            p.chips = room.settings.startingChips || 10000;
            p.currentBet = 0;
            p.hand = [];
            p.handValue = 0;
            p.status21 = 'waiting';
            p.roundResult = null;
            p.payout = 0;
            p.jokers = { pass: room.settings.passJokers, changeQuestion: room.settings.changeJokers };
        });
        room.cyber21Dealer = undefined;
        room.cyber21TurnPlayerId = null;
        room.cyber21Logs = [];
        room.readyForNextRound = [];
        room.answerText = null;
        room.dareResult = null;
        emitRoomUpdate(data.roomId);
        addSystemMessage(data.roomId, 'Lobiye dönüldü, yeni oyun için bekleniyor.');
    }
  });

  
  
  socket.on('lexis_submit_word', (data: { roomId: string; word: string; hint: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (room.phase === 'lexis_write') {
      if (!room.lexisSubmissions) room.lexisSubmissions = {};
      room.lexisSubmissions[socket.id] = { word: data.word.toUpperCase(), hint: data.hint };
      
      // Check if all players have submitted
      if (Object.keys(room.lexisSubmissions).length === room.players.length) {
        room.phase = 'lexis_guess';
        room.lexisGuesses = {};
        room.lexisCorrectGuesserIds = [];
        room.lexisAssignments = {};
        
        // Assign targets (derangement / shifted array)
        // If there's only 1 player (testing), they guess their own word.
        if (room.players.length === 1) {
          room.lexisAssignments[room.players[0].id] = room.players[0].id;
        } else {
          // Shuffle array, then assign i -> i+1
          let shuffled = [...room.players].sort(() => Math.random() - 0.5);
          for(let i = 0; i < shuffled.length; i++) {
            let next = (i + 1) % shuffled.length;
            room.lexisAssignments[shuffled[i].id] = shuffled[next].id;
          }
        }
        
        addSystemMessage(data.roomId, `Herkes kelimelerini belirledi. Tahmin aşaması başladı!`);
      }
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('lexis_submit_guess', (data: { roomId: string; guess: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    if (room.phase === 'lexis_guess') {
      if (!room.lexisGuesses) room.lexisGuesses = {};
      if (!room.lexisGuesses[socket.id]) room.lexisGuesses[socket.id] = [];
      
      const targetWriterId = room.lexisAssignments?.[socket.id];
      if (!targetWriterId) return;
      const targetWord = room.lexisSubmissions?.[targetWriterId]?.word;
      if (!targetWord) return;
      
      const guessUpper = data.guess.toUpperCase();
      room.lexisGuesses[socket.id].push(guessUpper);
      
      const isCorrect = guessUpper === targetWord;
      const attempts = room.lexisGuesses[socket.id].length;
      
      if (isCorrect) {
        if (!room.lexisCorrectGuesserIds) room.lexisCorrectGuesserIds = [];
        if (!room.lexisCorrectGuesserIds.includes(socket.id)) {
          room.lexisCorrectGuesserIds.push(socket.id);
        
          // Award points
          const points = Math.max(10, 60 - (attempts * 10)); // 1=50, 2=40, 3=30, 4=20, 5=10
          const player = room.players.find(p => p.id === socket.id);
          if(player) player.score += points;
          
          const writer = room.players.find(p => p.id === targetWriterId);
          if(writer && writer.id !== socket.id) writer.score += 10;
          
          addSystemMessage(data.roomId, `${player?.name || 'Bir oyuncu'} kendisine verilen kelimeyi ${attempts}. denemesinde buldu!`);
        }
      }

      // Check if all finished
      const allDone = room.players.every(p => {
        const pGuesses = room.lexisGuesses?.[p.id] || [];
        return (room.lexisCorrectGuesserIds && room.lexisCorrectGuesserIds.includes(p.id)) || pGuesses.length >= 5;
      });

      if (allDone) {
        room.phase = 'lexis_round_end';
        addSystemMessage(data.roomId, `Tur bitti!`);
      }
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('lexis_next_round', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player?.isHost && room.phase === 'lexis_round_end') {
      room.currentRound += 1;
      if (room.currentRound > room.settings.rounds) {
        room.phase = 'game_over';
      } else {
        room.phase = 'lexis_write';
        room.lexisSubmissions = {};
        room.lexisAssignments = {};
        room.lexisGuesses = {};
        room.lexisCorrectGuesserIds = [];
      }
      emitRoomUpdate(data.roomId);
    }
  });

  
  socket.on('cyber21_place_bet', (data: { roomId: string; bet: number }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'cyber21_betting') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const totalAvailable = (player.chips || 0) + (player.currentBet || 0);
    const betAmount = Math.max(100, Math.min(data.bet, totalAvailable));
    if (betAmount <= 0) return;

    const diff = betAmount - (player.currentBet || 0);
    player.chips = Math.max(0, (player.chips || 0) - diff);
    player.currentBet = betAmount;
    player.score = player.chips;
    player.status21 = 'waiting';

    addCyber21Log(data.roomId, `${player.name} ${betAmount.toLocaleString()} çip bahis koydu.`, 'player');
    emitRoomUpdate(data.roomId);

    // If all players confirmed their bets, transition immediately
    const allBet = room.players.every(p => (p.currentBet || 0) > 0 && p.status21 === 'waiting');
    if (allBet) {
      if (cyber21Timers[data.roomId]) clearInterval(cyber21Timers[data.roomId]);
      dealCyber21Cards(data.roomId, room);
    }
  });

  socket.on('cyber21_hit', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'cyber21_player_turns') return;
    if (room.cyber21TurnPlayerId !== socket.id) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.status21 !== 'playing') return;

    const deck = cyber21Decks[data.roomId];
    const newCard = deck.pop() || { suit: 'spades', value: '8', numericValue: 8 };
    if (!player.hand) player.hand = [];
    player.hand.push(newCard);
    player.handValue = calculateHandValue(player.hand);

    if (player.handValue > 21) {
      player.status21 = 'bust';
      addCyber21Log(data.roomId, `💥 ${player.name} kart çekti: ${newCard.value}${suitSymbol(newCard.suit)} - BATTI (${player.handValue})!`, 'player');
      emitRoomUpdate(data.roomId);
      setTimeout(() => advanceCyber21Turn(data.roomId, room), 800);
    } else if (player.handValue === 21) {
      player.status21 = 'stand';
      addCyber21Log(data.roomId, `🎯 ${player.name} kart çekti: ${newCard.value}${suitSymbol(newCard.suit)} - 21 PUAN! Pas dedi.`, 'player');
      emitRoomUpdate(data.roomId);
      setTimeout(() => advanceCyber21Turn(data.roomId, room), 800);
    } else {
      addCyber21Log(data.roomId, `${player.name} kart çekti: ${newCard.value}${suitSymbol(newCard.suit)} (Puan: ${player.handValue})`, 'player');
      emitRoomUpdate(data.roomId);
    }
  });

  socket.on('cyber21_stand', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'cyber21_player_turns') return;
    if (room.cyber21TurnPlayerId !== socket.id) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.status21 !== 'playing') return;

    player.status21 = 'stand';
    addCyber21Log(data.roomId, `${player.name} ${player.handValue} puanda pas dedi.`, 'player');
    emitRoomUpdate(data.roomId);
    setTimeout(() => advanceCyber21Turn(data.roomId, room), 600);
  });

  socket.on('cyber21_double', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'cyber21_player_turns') return;
    if (room.cyber21TurnPlayerId !== socket.id) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.status21 !== 'playing') return;
    if ((player.hand?.length || 0) !== 2) return;

    const currentBet = player.currentBet || 0;
    if ((player.chips || 0) < currentBet) return;

    player.chips = (player.chips || 0) - currentBet;
    player.currentBet = currentBet * 2;
    player.score = player.chips;

    const deck = cyber21Decks[data.roomId];
    const newCard = deck.pop() || { suit: 'diamonds', value: '9', numericValue: 9 };
    if (!player.hand) player.hand = [];
    player.hand.push(newCard);
    player.handValue = calculateHandValue(player.hand);

    if (player.handValue > 21) {
      player.status21 = 'bust';
      addCyber21Log(data.roomId, `⚡ ${player.name} bahsi 2'ye katladı (${player.currentBet} çip) ve kart çekti: ${newCard.value}${suitSymbol(newCard.suit)} - BATTI (${player.handValue})!`, 'player');
    } else {
      player.status21 = 'stand';
      addCyber21Log(data.roomId, `⚡ ${player.name} bahsi 2'ye katladı (${player.currentBet} çip) ve kart çekti: ${newCard.value}${suitSymbol(newCard.suit)} (Puan: ${player.handValue}).`, 'player');
    }

    emitRoomUpdate(data.roomId);
    setTimeout(() => advanceCyber21Turn(data.roomId, room), 800);
  });

  socket.on('cyber21_next_round', (data: { roomId: string }) => {
    const room = rooms[data.roomId];
    if (!room || room.phase !== 'cyber21_round_end') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost) return;

    if (room.currentRound >= room.settings.rounds) {
      room.phase = 'game_over';
      emitRoomUpdate(data.roomId);
    } else {
      startCyber21Round(data.roomId, room);
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
          if (cyber21Timers[roomId]) clearInterval(cyber21Timers[roomId]);
          delete cyber21Decks[roomId];
          delete rooms[roomId];
        } else {
          if (player.isHost) {
            room.players[0].isHost = true; // Assign new host
          }
          addSystemMessage(roomId, `${player.name} odadan ayrıldı.`);
          
          // Advance turn if it was this player's turn in cyber21
          if (room.phase === 'cyber21_player_turns' && room.cyber21TurnPlayerId === socket.id) {
            advanceCyber21Turn(roomId, room);
          } else {
            emitRoomUpdate(roomId);
          }
        }
      }
    }
  });

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
    app.use(express.static(distPath, { maxAge: "1y" }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
