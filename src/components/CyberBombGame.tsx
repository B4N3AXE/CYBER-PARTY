import React, { useState, useEffect, useRef } from 'react';
import { Room, Player } from '../types';
import { Socket } from 'socket.io-client';
import { 
  Flame, 
  Bomb, 
  Heart, 
  Skull, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  Trophy, 
  RefreshCw, 
  Zap, 
  ShieldAlert,
  Clock,
  MessageSquare
} from 'lucide-react';

interface CyberBombGameProps {
  room: Room;
  myPlayer?: Player;
  socket: Socket;
}

export default function CyberBombGame({ room, myPlayer, socket }: CyberBombGameProps) {
  const [wordInput, setWordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const isHost = myPlayer?.isHost;
  const isMyTurn = room.bombHolderId === socket.id && room.phase === 'cyberbomb_playing';
  const currentHolder = room.players.find(p => p.id === room.bombHolderId);
  const requiredLetter = (room.bombRequiredLetter || 'K').toLocaleUpperCase('tr-TR');
  const lastWord = room.bombLastWord || 'SİBER';
  const timeLeft = room.bombTimeLeft !== undefined ? room.bombTimeLeft : 10;
  const maxTime = room.bombMaxTime || 10;
  const passStreak = room.bombPassStreak || 0;
  const isExploded = room.bombStatus === 'exploded';

  const alivePlayers = room.players.filter(p => !p.isEliminated);
  const explosionCount = room.bombExplosionCount || 0;

  // Auto-focus input when it's the player's turn
  useEffect(() => {
    if (isMyTurn && !isExploded) {
      inputRef.current?.focus();
    }
  }, [isMyTurn, isExploded]);

  // Listen for bomb error events from server
  useEffect(() => {
    const handleBombError = (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 3000);
    };

    socket.on('bomb_error', handleBombError);
    return () => {
      socket.off('bomb_error', handleBombError);
    };
  }, [socket]);

  // Auto-scroll log feed to top on new entry (since logs are unshifted) removed to prioritize user control as requested.
  // useEffect(() => {
  //   if (logContainerRef.current) {
  //     logContainerRef.current.scrollTop = 0;
  //   }
  // }, [room.bombLogs]);

  // Handle word submit
  const handleSubmitWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isMyTurn || isExploded) return;

    const trimmed = wordInput.trim();
    if (!trimmed) return;

    const upper = trimmed.toLocaleUpperCase('tr-TR');
    if (!upper.startsWith(requiredLetter)) {
      setErrorMessage(`Kelime mutlaka '${requiredLetter}' harfi ile başlamalıdır!`);
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    if (trimmed.length < 2) {
      setErrorMessage('En az 2 harfli bir kelime girmelisin!');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    socket.emit('submit_bomb_word', {
      roomId: room.id,
      word: trimmed
    });

    setWordInput('');
    setErrorMessage(null);
  };

  // Quick hint click
  const handleSelectHint = (hintWord: string) => {
    if (!isMyTurn || isExploded) return;
    setWordInput(hintWord);
    inputRef.current?.focus();
  };

  // Quick reaction
  const handleQuickReaction = (reaction: string) => {
    socket.emit('cyberbomb_quick_reaction', {
      roomId: room.id,
      reaction
    });
  };

  // Chat message send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    socket.emit('chat-message', {
      roomId: room.id,
      text: chatMessage.trim()
    });
    setChatMessage('');
  };

  // Next round / Replay
  const handleRestart = () => {
    if (isHost) {
      socket.emit('cyberbomb_next_round', { roomId: room.id });
    }
  };

  // Sort players for leaderboard (alive first, then by score/RP)
  const sortedPlayers = [...room.players].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    return ((b.rp || 0) + b.score) - ((a.rp || 0) + a.score);
  });

  // Split last word for display (all letters except last, then last letter emphasized)
  const lastWordStem = lastWord.length > 1 ? lastWord.slice(0, -1) : '';
  const lastWordEnding = lastWord.slice(-1) || requiredLetter;

  return (
    <div id="cyberbomb-arena" className="w-full h-full flex flex-col min-h-0 select-none text-slate-100 overflow-hidden">
      {/* Top Arena Information Bar */}
      <header id="arena-header" className="w-full py-2.5 px-4 bg-[#0a0f1d]/90 border-b border-pink-500/20 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            <div className="w-full h-full bg-[#0d1225] rounded-[10px] flex items-center justify-center">
              <Bomb className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300">
                CYBER-BOMB
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                ARENA #{room.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Hızlı refleks, kelime zinciri ve yüksek voltajlı patlama arenası
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-slate-400">ODA:</span>
            <span className="text-cyan-300 font-bold tracking-wider">#{room.id}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">CANLI:</span>
            <span className="text-emerald-300 font-bold">{alivePlayers.length} / {room.players.length}</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Desktop Grid */}
      <div id="arena-grid" className="flex-1 min-h-0 w-full p-2.5 sm:p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-3.5 sm:gap-4 overflow-hidden">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: LEADERBOARD & LIVES (Sol: 280px)           */}
        {/* ======================================================== */}
        <section 
          id="leaderboard-column" 
          className="w-full lg:w-[280px] h-full flex flex-col gap-3 min-h-0 overflow-hidden"
        >
          <div className="bg-[#0e1426]/90 border border-white/10 rounded-2xl p-3.5 shadow-xl flex-1 flex flex-col min-h-0 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-200">
                  LİDERLİK & CANLAR
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                {room.players.length} Oyuncu
              </span>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {sortedPlayers.map((player, index) => {
                const isMe = player.id === socket.id;
                const hasBomb = player.id === room.bombHolderId;
                const isEliminated = player.isEliminated || (player.lives ?? 3) <= 0;
                const lives = Math.max(0, player.lives ?? 3);
                const maxLives = player.maxLives ?? 3;

                return (
                  <div 
                    key={player.id}
                    id={`player-card-${player.id}`}
                    className={`p-2.5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                      hasBomb && !isEliminated
                        ? 'bg-gradient-to-r from-red-950/70 to-pink-950/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] ring-1 ring-red-400'
                        : isMe
                        ? 'bg-cyan-950/40 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : isEliminated
                        ? 'bg-slate-900/40 border-slate-800 opacity-55'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Top row: Rank, Name, RP */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-md text-[11px] font-mono font-black flex items-center justify-center shrink-0 ${
                          index === 0 ? 'bg-amber-400 text-slate-950' :
                          index === 1 ? 'bg-slate-300 text-slate-950' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                        
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-sm shrink-0">
                          {player.avatar || '😎'}
                        </div>

                        <span className={`font-bold text-xs truncate ${
                          isEliminated ? 'line-through text-slate-500' : isMe ? 'text-cyan-300' : 'text-slate-200'
                        }`}>
                          {player.name}
                        </span>

                        {isMe && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                            SEN
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-extrabold text-amber-300 shrink-0">
                        {(player.rp || (1500 + player.score)).toLocaleString()} RP
                      </span>
                    </div>

                    {/* Bottom row: Lives and Bomb/Eliminated status */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      {/* Hearts */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: maxLives }).map((_, i) => {
                          const isAlive = i < lives;
                          return (
                            <Heart
                              key={i}
                              className={`w-3.5 h-3.5 transition-all ${
                                isAlive 
                                  ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]' 
                                  : 'text-slate-700 fill-slate-800/40'
                              }`}
                            />
                          );
                        })}
                        <span className="text-[10px] font-mono text-slate-400 ml-1">
                          {lives}/{maxLives}
                        </span>
                      </div>

                      {/* Status pill */}
                      {isEliminated ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 flex items-center gap-1">
                          <Skull className="w-3 h-3" /> ELENDİ
                        </span>
                      ) : hasBomb ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] flex items-center gap-1">
                          💣 ELİNDE BOMBA!
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          HAYATTA
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Group Survival Stats */}
            <div className="mt-3 pt-3 border-t border-white/10 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1.5">
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> CANLI: {alivePlayers.length} OYUNCU
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  💥 PATLAMA: {explosionCount} KEZ
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-500"
                  style={{ 
                    width: `${room.players.length > 0 ? (alivePlayers.length / room.players.length) * 100 : 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* CENTER COLUMN: MAIN BOMB PANEL (Orta: Geniş Oyun Alanı) */}
        {/* ======================================================== */}
        <section 
          id="bomb-center-column" 
          className="flex-1 min-w-0 h-full flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar"
        >
          {/* Active Carrier Banner */}
          <div 
            id="active-carrier-banner"
            className={`w-full p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between shadow-lg transition-all ${
              isMyTurn
                ? 'bg-gradient-to-r from-red-600/30 via-pink-600/30 to-purple-600/30 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse'
                : 'bg-slate-900/80 border-white/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
                isMyTurn ? 'bg-pink-500 text-white shadow-lg' : 'bg-slate-800 text-slate-300'
              }`}>
                {currentHolder?.avatar || '💣'}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block leading-tight">
                  AKTİF BOMBA TAŞIYICISI
                </span>
                <span className={`font-display font-black text-sm sm:text-base ${
                  isMyTurn ? 'text-pink-300' : 'text-slate-100'
                }`}>
                  {currentHolder?.name || 'Seçiliyor...'} {isMyTurn && '(SEN)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMyTurn ? (
                <span className="px-3 py-1 rounded-full bg-red-500 text-white font-black text-xs animate-bounce shadow-lg">
                  🚨 SIRA SENDE!
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-mono text-xs border border-white/10">
                  Sıra onda...
                </span>
              )}
            </div>
          </div>

          {/* Central Cyber-Bomb Stage */}
          <div 
            id="bomb-stage-card"
            className="flex-1 bg-[#0c1224]/90 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden backdrop-blur-md"
          >
            {/* Ambient Background Glows */}
            <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[90px] pointer-events-none transition-all duration-700 ${
              isExploded 
                ? 'bg-red-600/40 scale-125' 
                : timeLeft <= 3 
                ? 'bg-red-500/35 animate-pulse' 
                : 'bg-pink-500/20'
            }`} />
            <div className="absolute -bottom-16 right-10 w-60 h-60 bg-cyan-500/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Dynamic Speed & Acceleration Badge */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={`text-[11px] font-mono font-black uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-md transition-all ${
                maxTime <= 5 
                  ? 'bg-red-500/25 text-red-300 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                  : maxTime <= 6 
                  ? 'bg-orange-500/25 text-orange-300 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : maxTime <= 8 
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>HIZ SEVİYESİ: {maxTime}s</span>
                <span className="text-slate-400">•</span>
                <span>PAS SERİSİ: #{passStreak}</span>
              </span>
            </div>

            {/* Giant Cyber-Bomb Visual */}
            <div className="relative my-2 sm:my-3 flex flex-col items-center justify-center">
              {/* Pulsing Ring Container */}
              <div className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isExploded 
                  ? 'scale-110' 
                  : timeLeft <= 3 
                  ? 'animate-bounce' 
                  : 'animate-pulse'
              }`}>
                {/* Outer Cyber Rings */}
                <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-colors duration-500 ${
                  isExploded 
                    ? 'border-red-500 animate-spin' 
                    : timeLeft <= 3 
                    ? 'border-red-400 animate-[spin_2s_linear_infinite]' 
                    : maxTime <= 6
                    ? 'border-orange-500 animate-[spin_4s_linear_infinite]'
                    : 'border-pink-500/60 animate-[spin_10s_linear_infinite]'
                }`} />
                <div className="absolute inset-3 rounded-full border border-cyan-400/30 animate-[spin_6s_linear_infinite_reverse]" />

                {/* Metallic Glowing Core */}
                <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 relative ${
                  isExploded
                    ? 'bg-gradient-to-tr from-red-600 to-orange-500 shadow-[0_0_50px_rgba(239,68,68,0.9)]'
                    : timeLeft <= 3
                    ? 'bg-gradient-to-tr from-red-800 via-pink-900 to-slate-900 shadow-[0_0_40px_rgba(239,68,68,0.7)]'
                    : 'bg-gradient-to-tr from-[#1b1535] via-[#241738] to-[#120f26] shadow-[0_0_35px_rgba(236,72,153,0.5)]'
                }`}>
                  <Bomb className={`w-10 h-10 sm:w-12 sm:h-12 mb-1 transition-transform ${
                    isExploded ? 'text-yellow-200 scale-125' : timeLeft <= 3 ? 'text-red-400' : 'text-pink-400'
                  }`} />

                  {/* Countdown Timer Display */}
                  <div className={`font-display font-black tracking-tight drop-shadow-md ${
                    isExploded 
                      ? 'text-2xl sm:text-3xl text-yellow-300 animate-bounce' 
                      : timeLeft <= 3 
                      ? 'text-4xl sm:text-5xl text-red-400 animate-pulse' 
                      : 'text-4xl sm:text-5xl text-white'
                  }`}>
                    {isExploded ? 'PATLADI!' : `${timeLeft < 10 ? '0' : ''}${timeLeft}s`}
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 mt-0.5">
                    {isExploded ? 'HASAR ALINDI' : `LİMİT: ${maxTime}s (${passStreak} PAS)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Text Banner */}
            <div className="w-full max-w-xl text-center px-4 py-2 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                <strong>DİKKAT:</strong> Paslaştıkça bomba hızlanır (Şu anki süre: <strong>{maxTime}s</strong>)! Süre bitmeden &apos;{requiredLetter}&apos; ile başlayan kelimeni yazıp fırlat yoksa bomba elinde patlar!
              </span>
            </div>

            {/* Word Chain Box */}
            <div 
              id="word-chain-box"
              className="w-full max-w-xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 text-center shadow-inner relative"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/30">
                  🎲 DİNAMİK KELİME ZİNCİRİ
                </span>
              </div>

              {/* Chain Display */}
              <div className="flex items-center justify-center gap-2 flex-wrap text-lg sm:text-2xl font-black">
                <span className="text-slate-300 tracking-wider font-display">
                  {lastWordStem}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                  {lastWordEnding}
                </span>
                <ArrowRight className="w-5 h-5 text-cyan-400 mx-1 animate-pulse" />
                <span className="text-cyan-300 font-display flex items-center gap-1">
                  SON HARF: <span className="text-3xl font-black text-yellow-300 font-mono underline underline-offset-4">{requiredLetter}</span>
                </span>
              </div>

              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[11px] font-bold text-cyan-300">
                &apos;{requiredLetter}&apos; HARFİ İLE BAŞLAYAN GEÇERLİ BİR TÜRKÇE KELİME GİR
              </div>
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="w-full max-w-xl mt-2 px-3 py-2 rounded-xl bg-red-500 text-white font-bold text-xs text-center shadow-lg animate-shake flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Terminal Input Form */}
            <form 
              onSubmit={handleSubmitWord}
              className="w-full max-w-xl mt-3 flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400 font-mono font-bold text-sm">
                  &gt;
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={wordInput}
                  disabled={!isMyTurn || isExploded}
                  onChange={e => setWordInput(e.target.value)}
                  placeholder={
                    isMyTurn
                      ? `${requiredLetter} ile başlayan kelime yaz... (Örn: ${room.bombHints?.[0] || 'Kuantum'})`
                      : 'Bomba sana geldiğinde kelimeyi yazacaksın...'
                  }
                  className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm sm:text-base font-semibold transition-all outline-none shadow-inner ${
                    isMyTurn && !isExploded
                      ? 'bg-[#080d1e] text-white border-pink-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/40'
                      : 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                  }`}
                  maxLength={30}
                />
              </div>

              <button
                type="submit"
                disabled={!isMyTurn || isExploded || !wordInput.trim()}
                className={`px-7 py-3.5 rounded-xl font-display font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                  isMyTurn && !isExploded && wordInput.trim()
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white shadow-pink-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <span>FIRLAT</span>
                <span className="text-lg">🚀</span>
              </button>
            </form>

            {/* Quick Hints Section */}
            <div className="w-full max-w-xl mt-3 flex items-center gap-2 flex-wrap justify-center">
              <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> HIZLI İPUCU:
              </span>
              {(room.bombHints || ['Kriptoloji', 'Kapsül', 'Karakter', 'Klavye']).map(hint => (
                <button
                  key={hint}
                  type="button"
                  disabled={!isMyTurn || isExploded}
                  onClick={() => handleSelectHint(hint)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                    isMyTurn && !isExploded
                      ? 'bg-white/5 hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 border-white/10 hover:border-pink-500/40 cursor-pointer active:scale-95'
                      : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: ACTION LOGS & CHAT (Sağ: 320px)           */}
        {/* ======================================================== */}
        <section 
          id="flow-chat-column" 
          className="w-full lg:w-[320px] h-full flex flex-col gap-3 min-h-0 overflow-hidden"
        >
          <div className="bg-[#0e1426]/90 border border-white/10 rounded-2xl p-3.5 shadow-xl flex-1 flex flex-col min-h-0 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-200">
                  AKIŞ & SOHBET
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                CANLI
              </span>
            </div>

            {/* Combat Feed & Logs */}
            <div 
              ref={logContainerRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0"
            >
              {/* Cyber-Bomb Specific Event Logs */}
              {(room.bombLogs && room.bombLogs.length > 0) ? (
                room.bombLogs.map(log => {
                  const isExplosion = log.type === 'explosion';
                  const isTransfer = log.type === 'transfer';
                  const isChat = log.type === 'chat';

                  return (
                    <div 
                      key={log.id}
                      className={`p-2.5 rounded-xl border text-xs leading-relaxed transition-all ${
                        isExplosion
                          ? 'bg-red-950/50 border-red-500/50 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : isTransfer
                          ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                          : isChat
                          ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                          : 'bg-slate-900/60 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-mono font-bold text-[10px] uppercase tracking-wider ${
                          isExplosion ? 'text-red-400' : isTransfer ? 'text-cyan-400' : 'text-purple-400'
                        }`}>
                          {log.title || (isExplosion ? '💥 PATLAMA' : isTransfer ? '🚀 TRANSFER' : '💬 MESAJ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-medium text-slate-200">{log.text}</p>
                    </div>
                  );
                })
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Clock className="w-5 h-5 mb-1 opacity-50" />
                  <span>Akış henüz sakin...</span>
                </div>
              )}

              {/* Room chat fallback logs */}
              {room.chat.slice(-10).map(msg => (
                <div key={msg.id} className="p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold text-slate-300">{msg.senderName}</span>
                    <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-200">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Reaction Buttons */}
            <div className="pt-2.5 border-t border-white/10 shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                HIZLI TEPKİ:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickReaction('⏱️ Acele Et!')}
                  className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-white/10 transition active:scale-95 text-center truncate"
                >
                  ⏱️ Acele Et!
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReaction('💥 Patlayacak!')}
                  className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-white/10 transition active:scale-95 text-center truncate"
                >
                  💥 Patlayacak!
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReaction('💀 GG')}
                  className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-white/10 transition active:scale-95 text-center truncate"
                >
                  💀 GG
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="mt-2.5 pt-2.5 border-t border-white/10 flex gap-1.5 shrink-0">
              <input
                type="text"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Mesaj yaz..."
                maxLength={80}
                className="flex-1 bg-[#080d1e] text-xs text-white placeholder-slate-500 rounded-xl px-3 py-2 border border-slate-700/60 focus:border-cyan-500 outline-none"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold transition disabled:text-slate-600 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Game Over / Champion Modal */}
      {room.phase === 'cyberbomb_round_end' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10172e] border-2 border-amber-400 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
              🏆
            </div>
            
            <h2 className="font-display font-black text-2xl text-white tracking-wide uppercase mb-1">
              ARENA ŞAMPİYONU
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Tüm patlamalardan sağ kurtulan son efsane!
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 mb-6">
              <div className="text-4xl mb-2">
                {alivePlayers[0]?.avatar || '👑'}
              </div>
              <div className="font-display font-black text-xl text-amber-300">
                {alivePlayers[0]?.name || 'Şampiyon'}
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-1">
                +250 RP ŞAMPİYONLUK BONUSU KAZANDI
              </div>
            </div>

            {isHost ? (
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-display font-black tracking-wider uppercase text-sm shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>YENİDEN BAŞLAT</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 font-mono animate-pulse">
                Oda yöneticisinin yeni oyunu başlatması bekleniyor...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
