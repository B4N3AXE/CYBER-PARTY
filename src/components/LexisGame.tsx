import React, { useState, useEffect } from 'react';
import { Player, Room } from '../types';
import { Send, Key, Play } from 'lucide-react';

export default function LexisGame({ room, myPlayer, socket }: { room: Room, myPlayer: Player, socket: any }) {
  const evaluateGuess = (guess: string, target: string) => {
    const len = target.length;
    const result = Array(len).fill('absent');
    const targetUsed = Array(len).fill(false);
    const guessArr = guess.split('');
    const targetArr = target.split('');
    
    for (let i = 0; i < len; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        targetUsed[i] = true;
      }
    }
    for (let i = 0; i < len; i++) {
      if (result[i] === 'correct') continue;
      for (let j = 0; j < len; j++) {
        if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
          result[i] = 'present';
          targetUsed[j] = true;
          break;
        }
      }
    }
    return result;
  };

  if (room.phase === 'lexis_write') {
    return <LexisWritePhase room={room} myPlayer={myPlayer} socket={socket} />;
  }

  if (room.phase === 'lexis_guess') {
    return <LexisGuessPhase room={room} myPlayer={myPlayer} socket={socket} evaluateGuess={evaluateGuess} />;
  }

  if (room.phase === 'lexis_round_end') {
    return <LexisRoundEndPhase room={room} myPlayer={myPlayer} socket={socket} />;
  }

  return <div className="flex-1 flex items-center justify-center text-white">Yükleniyor...</div>;
}

function LexisWritePhase({ room, myPlayer, socket }: any) {
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const hasSubmitted = !!room.lexisSubmissions?.[myPlayer?.id];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.length < 4 || word.length > 7) {
      alert("Kelime 4 ile 7 harf arasında olmalıdır kanka!");
      return;
    }
    if (word.length >= 4 && word.length <= 7 && hint.trim().length > 0) {
      socket.emit('lexis_submit_word', { roomId: room.id, word, hint });
    }
  };

  if (hasSubmitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Bekleniyor...</h2>
        <p className="text-cyan-400 text-lg">Diğer oyuncuların kelimelerini belirlemesi bekleniyor.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto">
      <div className="bg-[rgba(22,28,45,0.8)] backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 w-full shadow-[0_0_30px_rgba(34,211,238,0.1)]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-black text-white mb-2">Gizli Kelimeni ve İpucunu Belirle</h2>
          <p className="text-cyan-400 font-medium">Herkes rakibinin yazdığı kelimeyi tahmin etmeye çalışacak!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">4-7 Harfli Gizli Kelime</label>
            <input 
              type="text" 
              minLength={4} maxLength={7}
              value={word}
              onChange={(e) => setWord(e.target.value.replace(/[^a-zA-ZğüşiöçĞÜŞİÖÇıIıI]/g, '').toLocaleUpperCase('tr-TR'))}
              className="w-full bg-black/40 border border-cyan-500/50 rounded-xl px-4 py-4 text-center text-3xl font-black tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400 uppercase"
              placeholder="_____"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">İpucu / Serbest Cümle</label>
            <textarea 
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 min-h-[100px] resize-none"
              placeholder="Örn: Ağ trafiğini denetleyen güvenlik kalkanı..."
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={word.length < 4 || word.length > 7 || hint.length === 0}
            className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            <Send className="w-5 h-5" /> KELİMEYİ ONAYLA
          </button>
        </form>
      </div>
    </div>
  );
}

function LexisGuessPhase({ room, myPlayer, socket, evaluateGuess }: any) {
  const [currentGuess, setCurrentGuess] = useState('');
  
  const targetWriterId = room.lexisAssignments?.[myPlayer?.id];
  const targetSubmission = room.lexisSubmissions?.[targetWriterId];
  const lexisWord = targetSubmission?.word || '';
  const lexisHint = targetSubmission?.hint || '';
  const targetWriter = room.players.find((p:any) => p.id === targetWriterId);
  
  const myGuesses: string[] = (myPlayer && room.lexisGuesses?.[myPlayer.id]) || [];
  const hasWon = myPlayer && room.lexisCorrectGuesserIds?.includes(myPlayer.id);
  const hasLost = myGuesses.length >= 5 && !hasWon;
  const isFinished = hasWon || hasLost;

  useEffect(() => {
    if (isFinished) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') setCurrentGuess(prev => prev.slice(0, -1));
      else if (/^[a-zA-ZğüşiöçĞÜŞİÖÇıI]$/.test(e.key)) {
        setCurrentGuess(prev => {
          if (prev.length < lexisWord.length) return prev + e.key.toLocaleUpperCase('tr-TR');
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, isFinished]);

  const submitGuess = () => {
    if (currentGuess.length === lexisWord.length) {
      socket.emit('lexis_submit_guess', { roomId: room.id, guess: currentGuess });
      setCurrentGuess('');
    }
  };
  
  const handleVirtualKey = (key: string) => {
    if (key === 'ENTER') submitGuess();
    else if (key === 'BACKSPACE') setCurrentGuess(prev => prev.slice(0, -1));
    else if (currentGuess.length < lexisWord.length) setCurrentGuess(prev => prev + key);
  }

  const keyColors: Record<string, string> = {};
  myGuesses.forEach(g => {
    const res = evaluateGuess(g, lexisWord);
    g.split('').forEach((letter, i) => {
      const status = res[i];
      if (status === 'correct') keyColors[letter] = 'correct';
      else if (status === 'present' && keyColors[letter] !== 'correct') keyColors[letter] = 'present';
      else if (status === 'absent' && !keyColors[letter]) keyColors[letter] = 'absent';
    });
  });

  if (!targetWriter) {
     return <div className="text-white">Hedef yükleniyor...</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center p-4 sm:p-6 max-w-lg mx-auto w-full">
      <div className="w-full bg-[rgba(22,28,45,0.9)] backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 sm:p-5 mb-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
          <Key className="w-3.5 h-3.5" /> İPUCU - {targetWriter.name} YAZDI
        </div>
        <p className="text-white font-medium text-sm sm:text-base">"{lexisHint}"</p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-lg mb-4 mx-auto">
        {[0, 1, 2, 3, 4].map(rowIndex => {
          let rowStr = '';
          let rowStatus = Array(lexisWord.length).fill('empty');
          
          if (rowIndex < myGuesses.length) {
            rowStr = myGuesses[rowIndex];
            rowStatus = evaluateGuess(rowStr, lexisWord);
          } else if (rowIndex === myGuesses.length && !isFinished) {
            rowStr = currentGuess.padEnd(lexisWord.length, ' ');
            rowStatus = Array(lexisWord.length).fill('typing');
          } else {
            rowStr = ' '.repeat(lexisWord.length);
          }

          return (
            <div key={rowIndex} className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${lexisWord.length}, minmax(0, 1fr))` }}>
              {[...Array(lexisWord.length)].map((_, colIndex) => {
                const letter = rowStr[colIndex];
                const status = rowStatus[colIndex];
                
                let boxStyles = "bg-black/30 border-white/10 text-white";
                if (status === 'correct') boxStyles = "bg-[#00ff66] border-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.4)]";
                if (status === 'present') boxStyles = "bg-[#ffb700] border-[#ffb700] text-black";
                if (status === 'absent') boxStyles = "bg-[#2a2f3d] border-[#2a2f3d] text-white/50";
                if (status === 'typing' && letter !== ' ') boxStyles = "bg-black/60 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.2)]";

                return (
                  <div key={colIndex} className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl font-black transition-all ${boxStyles}`}>
                    {letter !== ' ' ? letter : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {isFinished && (
        <div className={`w-full p-4 rounded-2xl border mb-6 text-center ${hasWon ? 'bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
          <h3 className="text-xl font-bold mb-1">{hasWon ? 'Tebrikler, Buldun!' : 'Maalesef Bulamadın!'}</h3>
          {!hasWon && <p>Kelime: <strong>{lexisWord}</strong></p>}
          <p className="text-sm opacity-80 mt-2">Diğer oyuncuların tamamlaması bekleniyor...</p>
        </div>
      )}

      {!isFinished && (
        <div className="w-full max-w-[600px] flex flex-col gap-2.5 sm:gap-3 mx-auto mt-4">
          {['QWERTYUIOPĞÜ', 'ASDFGHJKLŞİ', 'ZXCVBNMÖÇ'].map((row, i) => (
            <div key={i} className="flex justify-center gap-1.5 sm:gap-2 w-full">
              {i === 2 && (
                <button onClick={() => handleVirtualKey('ENTER')} onPointerDown={(e) => e.preventDefault()} className="px-3 sm:px-4 bg-white/10 text-white font-black rounded-xl text-sm sm:text-base border-2 border-white/5 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-white/20 active:scale-95 active:translate-y-0 transition-all">ENT</button>
              )}
              {row.split('').map(char => {
                const upperChar = char; // Already uppercase
                const status = keyColors[upperChar];
                
                let keyStyle = "bg-white/10 text-white border-white/5";
                if (status === 'correct') keyStyle = "bg-[#00ff66] border-[#00ff66] text-black font-black shadow-[0_0_15px_rgba(0,255,102,0.4)]";
                else if (status === 'present') keyStyle = "bg-[#ffb700] border-[#ffb700] text-black font-black shadow-[0_0_15px_rgba(255,183,0,0.4)]";
                else if (status === 'absent') keyStyle = "bg-[#161b26] border-[#161b26] text-white/30";

                return (
                  <button 
                    key={char} 
                    onClick={(e) => { e.currentTarget.blur(); handleVirtualKey(upperChar); }} onPointerDown={(e) => e.preventDefault()}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border-2 flex items-center justify-center font-black text-lg sm:text-xl hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] active:scale-95 active:translate-y-0 transition-all ${keyStyle}`}
                  >
                    {upperChar}
                  </button>
                )
              })}
              {i === 2 && (
                <button onClick={() => handleVirtualKey('BACKSPACE')} onPointerDown={(e) => e.preventDefault()} className="px-3 sm:px-4 bg-white/10 text-white font-black rounded-xl text-sm sm:text-base border-2 border-white/5 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-white/20 active:scale-95 active:translate-y-0 transition-all">DEL</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LexisRoundEndPhase({ room, myPlayer, socket }: any) {
  const isHost = myPlayer?.isHost;

  const handleNextRound = () => {
    socket.emit('lexis_next_round', { roomId: room.id });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto">
      <div className="bg-[rgba(22,28,45,0.8)] backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 w-full shadow-[0_0_30px_rgba(34,211,238,0.1)] text-center">
        <h2 className="text-3xl font-display font-black text-white mb-8">Düello Sonuçları</h2>

        <div className="space-y-4 mb-8">
          {room.players.map((p: any) => {
            const isCorrect = room.lexisCorrectGuesserIds?.includes(p.id);
            const guesses = room.lexisGuesses?.[p.id] || [];
            const attempts = guesses.length;
            const targetWriterId = room.lexisAssignments?.[p.id];
            const targetWriter = room.players.find((w:any) => w.id === targetWriterId);
            const targetWord = room.lexisSubmissions?.[targetWriterId]?.word;
            
            let bgClass = "bg-white/5 border-white/10";
            if (isCorrect) bgClass = "bg-[#00ff66]/10 border-[#00ff66]/30";
            else if (attempts >= 5) bgClass = "bg-red-500/10 border-red-500/30";
            
            return (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border ${bgClass}`}>
                <div className="flex items-center gap-3">
                  <img src={p.avatar} alt="" className="w-10 h-10 rounded-xl" />
                  <div className="text-left">
                    <div className="text-white font-bold flex items-center gap-2">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {targetWriter?.name}'in kelimesi: <span className="text-cyan-400 font-bold">{targetWord}</span>
                    </div>
                    {isCorrect ? (
                      <div className="text-xs text-[#00ff66] font-bold mt-1">✓ {attempts}. denemede buldu</div>
                    ) : attempts >= 5 ? (
                      <div className="text-xs text-red-400 font-bold mt-1">✗ Bulamadı</div>
                    ) : (
                      <div className="text-xs text-amber-400 mt-1">Oynamadı</div>
                    )}
                  </div>
                </div>
                <div className="font-black text-xl text-white">
                  {p.score} <span className="text-sm text-slate-500">PT</span>
                </div>
              </div>
            )
          }).sort((a:any, b:any) => b.props.children[1].props.children[0] - a.props.children[1].props.children[0])}
        </div>

        {isHost ? (
          <button 
            onClick={handleNextRound}
            className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-lg transition-colors flex items-center justify-center gap-2"
          >
            SONRAKİ TURA GEÇ <Play className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-white/5 text-slate-400 font-medium animate-pulse">
            Oda yöneticisinin sonraki turu başlatması bekleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
