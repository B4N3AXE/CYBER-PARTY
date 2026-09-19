import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Room, Player, Card, CardSuit } from '../types';
import { Trophy, Coins, ShieldAlert, Award, Play, RotateCcw, Send, Sparkles, AlertCircle, ArrowUpRight, Flame, Bot, LogOut } from 'lucide-react';

interface Cyber21GameProps {
  room: Room;
  myPlayer: Player | undefined;
  socket: Socket;
  onRequestExit?: () => void;
}

const CHIP_PRESETS = [100, 250, 500, 1000, 2500];

export default function Cyber21Game({ room, myPlayer, socket, onRequestExit }: Cyber21GameProps) {
  const [selectedBet, setSelectedBet] = useState<number>(500);
  const [chatMessage, setChatMessage] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState<'all' | 'chat' | 'logs'>('all');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const isHost = myPlayer?.isHost;
  const myChips = myPlayer?.chips ?? 10000;
  const isMyTurn = room.phase === 'cyber21_player_turns' && room.cyber21TurnPlayerId === socket.id;
  const dealer = room.cyber21Dealer;
  const isBettingPhase = room.phase === 'cyber21_betting';
  const isRoundEnd = room.phase === 'cyber21_round_end';
  const isGameOver = room.phase === 'game_over';

  // Auto-scroll removed to prioritize user control as requested.
  // useEffect(() => {
  //   if (chatContainerRef.current) {
  //       chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  //   }
  // }, [room.chat]);
  //
  // useEffect(() => {
  //   if (logsContainerRef.current) {
  //       logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  //   }
  // }, [room.cyber21Logs]);

  // Adjust selected bet if balance drops
  useEffect(() => {
    if (selectedBet > myChips && myChips > 0) {
      setSelectedBet(myChips);
    }
  }, [myChips, selectedBet]);

  const handlePlaceBet = (amount: number) => {
    if (!isBettingPhase) return;
    const finalAmount = Math.min(amount, myChips);
    if (finalAmount <= 0) return;
    socket.emit('cyber21_place_bet', { roomId: room.id, bet: finalAmount });
  };

  const handleHit = () => {
    if (!isMyTurn) return;
    socket.emit('cyber21_hit', { roomId: room.id });
  };

  const handleStand = () => {
    if (!isMyTurn) return;
    socket.emit('cyber21_stand', { roomId: room.id });
  };

  const handleDouble = () => {
    if (!isMyTurn) return;
    socket.emit('cyber21_double', { roomId: room.id });
  };

  const handleNextRound = () => {
    if (!isHost) return;
    socket.emit('cyber21_next_round', { roomId: room.id });
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;
    socket.emit('chat-message', { roomId: room.id, text: chatMessage.trim() });
    setChatMessage('');
  };

  const handleSendQuickEmoji = (emoji: string) => {
    socket.emit('chat-message', { roomId: room.id, text: emoji });
  };

  // Suit color and icon helpers
  const getSuitInfo = (suit: CardSuit) => {
    switch (suit) {
      case 'hearts':
        return { symbol: '♥️', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' };
      case 'diamonds':
        return { symbol: '♦️', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
      case 'clubs':
        return { symbol: '♣️', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
      case 'spades':
        return { symbol: '♠️', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' };
    }
  };

  // Render Card Component (Enlarged and bold for high visual impact)
  const renderCard = (card: Card, index: number, isDealer: boolean = false) => {
    if (card.hidden) {
      return (
        <div
          key={`hidden-${index}`}
          className="relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 rounded-2xl bg-gradient-to-br from-[#131d36] via-[#091024] to-[#03060f] border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex flex-col items-center justify-center overflow-hidden animate-pulse select-none shrink-0"
        >
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#00f3ff_1.5px,transparent_1.5px)] [background-size:10px_10px]"></div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 text-lg sm:text-xl md:text-2xl font-black font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            ?
          </div>
          <span className="text-xs sm:text-sm text-cyan-300 font-mono mt-2 font-bold tracking-widest">KAPALI</span>
        </div>
      );
    }

    const { symbol, color } = getSuitInfo(card.suit);

    return (
      <div
        key={`${card.suit}-${card.value}-${index}`}
        className={`relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 rounded-2xl bg-gradient-to-b from-[#1a253d] via-[#10182b] to-[#090e1b] border-2 ${color} shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between p-2.5 sm:p-3.5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(0,0,0,0.7)] select-none shrink-0`}
      >
        {/* Top-left Value & Suit */}
        <div className="flex justify-between items-start leading-none">
          <span className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {card.value}
          </span>
          <span className="text-base sm:text-xl md:text-2xl">{symbol}</span>
        </div>

        {/* Big Center Suit Icon */}
        <div className="self-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl filter drop-shadow-[0_0_14px_rgba(255,255,255,0.25)] transition-transform hover:scale-110">
          {symbol}
        </div>

        {/* Bottom-right Inverted Value & Suit */}
        <div className="flex justify-between items-end rotate-180 leading-none">
          <span className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {card.value}
          </span>
          <span className="text-base sm:text-xl md:text-2xl">{symbol}</span>
        </div>
      </div>
    );
  };

  // Sorted players by chips
  const sortedPlayers = [...room.players].sort((a, b) => (b.chips || 0) - (a.chips || 0));
  const activeTurnPlayer = room.players.find(p => p.id === room.cyber21TurnPlayerId);

  return (
    <div
      className="cyber21-grid w-full h-full min-h-0 gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-[#080d19] rounded-2xl border border-white/10 shadow-2xl text-slate-100 overflow-y-auto lg:overflow-hidden custom-scrollbar"
      style={{ width: '100%', maxWidth: '100%' }}
    >
      {/* ======================= SOL SÜTUN: LİDERLİK TABLOSU & ÇİPLER (280px / 290px) ======================= */}
      <section className="w-full lg:w-[280px] xl:w-[290px] shrink-0 min-w-0 flex flex-col gap-3.5 min-h-0 h-full bg-[#0d1424]/95 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-4.5 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400 animate-pulse shrink-0" />
            <h2 className="font-display font-black text-base sm:text-lg tracking-wider uppercase text-white">
              Turnuva Liderliği
            </h2>
          </div>
          <span className="text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Tur {room.currentRound}/{room.settings.rounds}
          </span>
        </div>

        {/* Tournament Info Banner */}
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-3 border border-purple-500/30 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-slate-200 font-semibold">Başlangıç:</span>
          </div>
          <span className="font-mono font-extrabold text-amber-300 text-sm">10,000 Çip</span>
        </div>

        {/* Players List */}
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 custom-scrollbar min-h-0">
          {sortedPlayers.map((player, idx) => {
            const isMe = player.id === socket.id;
            const isTurn = room.phase === 'cyber21_player_turns' && player.id === room.cyber21TurnPlayerId;
            const hasBust = player.status21 === 'bust';
            const hasBJ = player.status21 === 'blackjack';
            const hasStand = player.status21 === 'stand';

            let rankBadge = `${idx + 1}`;
            let rankColor = 'bg-slate-700/80 text-slate-200';
            if (idx === 0) { rankBadge = '🥇 1'; rankColor = 'bg-amber-500/30 text-amber-300 border border-amber-500/60 shadow-sm'; }
            if (idx === 1) { rankBadge = '🥈 2'; rankColor = 'bg-slate-300/30 text-slate-100 border border-slate-300/50'; }
            if (idx === 2) { rankBadge = '🥉 3'; rankColor = 'bg-amber-700/30 text-amber-400 border border-amber-600/50'; }

            return (
              <div
                key={player.id}
                className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col gap-2 ${
                  isTurn
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.01]'
                    : isMe
                    ? 'bg-purple-950/40 border-purple-400/60 shadow-md'
                    : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono ${rankColor}`}>
                      {rankBadge}
                    </span>
                    <span className="text-xl shrink-0">{player.avatar}</span>
                    <div className="truncate">
                      <div className="text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                        {player.name}
                        {isMe && <span className="text-[11px] px-1.5 py-0.2 rounded bg-purple-500/40 text-purple-200 font-mono font-bold">SEN</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-black text-amber-300 flex items-center justify-end gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {(player.chips || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Sub-bar: Status & Hand Value */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10 font-medium">
                  <div className="flex items-center gap-1.5">
                    {player.currentBet && player.currentBet > 0 ? (
                      <span className="text-slate-300 font-mono">
                        Bahis: <strong className="text-cyan-300 font-bold">{player.currentBet.toLocaleString()}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">Bahis bekleniyor</span>
                    )}
                  </div>

                  <div>
                    {hasBJ && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 font-black text-xs animate-pulse">
                        ⚡ 21 (BJ)
                      </span>
                    )}
                    {hasBust && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/30 text-rose-300 font-black text-xs">
                        💥 BATTI ({player.handValue})
                      </span>
                    )}
                    {hasStand && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/30 text-emerald-300 font-black text-xs font-mono">
                        PAS ({player.handValue})
                      </span>
                    )}
                    {isTurn && (
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/30 text-cyan-300 font-black text-xs animate-pulse">
                        SIRASI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Room & Instructions */}
        <div className="pt-2.5 border-t border-white/10 text-xs text-slate-300 flex flex-col gap-2 shrink-0">
          <div className="flex justify-between items-center">
            <span>Oda Kodu: <strong className="text-cyan-300 font-mono font-bold text-sm">#{room.id}</strong></span>
            <span className="text-emerald-400 font-bold">Canlı Turnuva</span>
          </div>
          <p className="text-xs text-slate-400 italic">
            Tur sonunda kasasında en çok çip kalan şampiyon olur.
          </p>
          {onRequestExit && (
            <button
              onClick={onRequestExit}
              className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              Lobiye Dön / Çıkış
            </button>
          )}
        </div>
      </section>

      {/* ======================= ORTA SÜTUN: CYBER-21 MASASI (1fr) ======================= */}
      <section className="w-full min-w-0 flex-1 flex flex-col gap-3 min-h-0 h-full bg-gradient-to-b from-[#0e1629] via-[#090f1d] to-[#050811] rounded-2xl border border-cyan-500/20 p-3.5 sm:p-4 lg:p-5 shadow-2xl relative overflow-y-auto custom-scrollbar">
        
        {/* Top: Krupiye / Dealer Area */}
        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-black/35 border border-white/10 relative">
          {onRequestExit && (
            <button
              id="cyber21-dealer-btn-exit"
              onClick={onRequestExit}
              className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-300 flex items-center gap-1.5 text-xs font-bold transition shadow-sm hover:scale-105 active:scale-95 cursor-pointer z-10"
              title="Lobiye Dön"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Lobiye Dön</span>
            </button>
          )}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                Cyber Krupiye
                {dealer?.status === 'bust' && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold">
                    💥 BATTI
                  </span>
                )}
                {dealer?.status === 'stand' && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-mono font-bold">
                    {dealer.handValue} PUAN
                  </span>
                )}
                {dealer?.status === 'blackjack' && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse font-bold">
                    ⚡ BLACKJACK
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-mono font-medium">
                Kasa Skoru: <span className="text-white font-extrabold text-sm sm:text-base">{dealer ? (dealer.hand.some(c => c.hidden) ? `${dealer.handValue} + ?` : dealer.handValue) : '0'}</span>
              </div>
            </div>
          </div>

          {/* Dealer Cards */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 min-h-[155px] sm:min-h-[175px] md:min-h-[210px] py-2">
            {dealer && dealer.hand.length > 0 ? (
              dealer.hand.map((card, i) => renderCard(card, i, true))
            ) : (
              <div className="text-sm text-slate-500 italic py-8">
                Krupiye bahislerin tamamlanmasını bekliyor...
              </div>
            )}
          </div>
        </div>

        {/* Center: Table Status / Hologram Banner */}
        <div className="py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-cyan-950/50 to-blue-950/50 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-spin-slow shrink-0" />
            <div className="text-sm font-display font-bold text-slate-200">
              {isBettingPhase && (
                <span className="text-amber-300">
                  Bahis Zamanı: <strong className="text-white text-base">{room.cyber21BetTimeLeft ?? 15}s</strong> içinde bahsinizi belirleyin!
                </span>
              )}
              {room.phase === 'cyber21_dealing' && (
                <span className="text-cyan-300">Kartlar dağıtılıyor, hazırlanın...</span>
              )}
              {room.phase === 'cyber21_player_turns' && (
                <span>
                  {isMyTurn ? (
                    <strong className="text-emerald-400 text-base animate-pulse">⚡ SIRA SENDE! Kart Çek, Pas De veya 2X Yap!</strong>
                  ) : (
                    <span className="text-slate-300">
                      Sıradaki: <strong className="text-cyan-300">{activeTurnPlayer?.name || 'Oyuncu'}</strong> hamle yapıyor...
                    </span>
                  )}
                </span>
              )}
              {room.phase === 'cyber21_dealer_turn' && (
                <span className="text-purple-300 animate-pulse">🤖 Krupiye hamlelerini yapıyor (17 kuralı)...</span>
              )}
              {isRoundEnd && (
                <span className="text-emerald-300 font-extrabold text-base">🏆 Tur Bitti! Kazançlar dağıtıldı.</span>
              )}
              {isGameOver && (
                <span className="text-amber-400 font-extrabold text-base">👑 TURNUVA SONA ERDİ!</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-slate-400">Masadaki Bahis:</span>
            <span className="text-amber-300 font-black text-base">
              {room.players.reduce((acc, p) => acc + (p.currentBet || 0), 0).toLocaleString()} Çip
            </span>
          </div>
        </div>

        {/* Bottom Area: My Player Hand, Cards, and Actions */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#090e1c]/90 border border-purple-500/25 shadow-xl relative min-h-[300px]">
          
          {/* Header of Player Area */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <span className="text-3xl sm:text-4xl">{myPlayer?.avatar}</span>
              <div>
                <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  {myPlayer?.name}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/50 font-bold">
                    Senin Masan
                  </span>
                </div>
                <div className="text-sm sm:text-base text-slate-300 font-mono font-medium">
                  Bakiye: <strong className="text-amber-400 font-black text-sm sm:text-base">{myChips.toLocaleString()} Çip</strong>
                </div>
              </div>
            </div>

            {/* Hand Score & Result Badge */}
            <div className="text-right">
              {myPlayer?.hand && myPlayer.hand.length > 0 && (
                <div className="flex items-center gap-2 justify-end">
                  <div className="text-sm sm:text-base font-mono font-extrabold px-3.5 py-1.5 rounded-xl bg-white/10 text-white border border-white/20 shadow-sm">
                    Puan: <span className="text-cyan-300 text-xl font-black">{myPlayer.handValue || 0}</span>
                  </div>
                </div>
              )}
              {myPlayer?.roundResult && (
                <div className="mt-2">
                  {myPlayer.roundResult === 'win' && (
                    <span className="text-xs sm:text-sm font-black text-emerald-300 bg-emerald-500/30 border border-emerald-500/50 px-3.5 py-1.5 rounded-full animate-bounce inline-block shadow-md">
                      🎉 KAZANDIN (+{myPlayer.payout?.toLocaleString()} Çip)
                    </span>
                  )}
                  {myPlayer.roundResult === 'blackjack' && (
                    <span className="text-xs sm:text-sm font-black text-amber-200 bg-amber-500/30 border border-amber-500/50 px-3.5 py-1.5 rounded-full animate-pulse inline-block shadow-md">
                      ⚡ BLACKJACK! (+{myPlayer.payout?.toLocaleString()} Çip)
                    </span>
                  )}
                  {myPlayer.roundResult === 'push' && (
                    <span className="text-xs sm:text-sm font-black text-cyan-200 bg-cyan-500/30 border border-cyan-500/50 px-3.5 py-1.5 rounded-full inline-block shadow-md">
                      🤝 BERABERE (İADE)
                    </span>
                  )}
                  {myPlayer.roundResult === 'lose' && (
                    <span className="text-xs sm:text-sm font-black text-rose-200 bg-rose-500/30 border border-rose-500/50 px-3.5 py-1.5 rounded-full inline-block shadow-md">
                      ❌ KAYBETTİN (-{myPlayer.currentBet?.toLocaleString()} Çip)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cards Display */}
          <div className="my-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 min-h-[155px] sm:min-h-[175px] md:min-h-[210px] py-2">
            {myPlayer?.hand && myPlayer.hand.length > 0 ? (
              myPlayer.hand.map((card, i) => renderCard(card, i))
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 text-sm py-6">
                <Coins className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
                <span>Tur başladığında büyük kartların burada belirecek</span>
              </div>
            )}
          </div>

          {/* Interactive Controls Bar */}
          <div className="pt-3 border-t border-white/10">
            
            {/* 1. BETTING CONTROLS (during betting phase) */}
            {isBettingPhase && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    Bahis Çipi Seçin:
                  </span>
                  <div className="text-sm sm:text-base font-mono font-bold text-cyan-300">
                    Seçili: {selectedBet.toLocaleString()} Çip
                  </div>
                </div>

                {/* Preset Chip Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {CHIP_PRESETS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setSelectedBet(amt)}
                      disabled={amt > myChips}
                      className={`h-12 sm:h-13 px-2 rounded-xl text-sm sm:text-base font-mono font-black transition-all border ${
                        selectedBet === amt
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                          : amt <= myChips
                          ? 'bg-white/10 text-slate-100 border-white/15 hover:bg-white/20'
                          : 'opacity-40 cursor-not-allowed bg-black/20 text-slate-600 border-white/5'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedBet(myChips)}
                    disabled={myChips <= 0}
                    className="h-12 sm:h-13 px-2 rounded-xl text-sm sm:text-base font-mono font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-pink-400 hover:brightness-110 shadow-md"
                  >
                    ALL-IN
                  </button>
                </div>

                {/* Confirm Bet Button */}
                <button
                  onClick={() => handlePlaceBet(selectedBet)}
                  className="w-full h-15 sm:h-16 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-display font-black text-lg sm:text-xl tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                >
                  <Coins className="w-6 h-6 text-slate-950" />
                  BAHSİ ONAYLA ({selectedBet.toLocaleString()} ÇİP)
                </button>
              </div>
            )}

            {/* 2. GAME ACTION BUTTONS (during player turns) - GIANT ACTION BUTTONS */}
            {room.phase === 'cyber21_player_turns' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleHit}
                  disabled={!isMyTurn}
                  className={`h-16 sm:h-20 px-4 rounded-2xl font-display font-black text-lg sm:text-xl tracking-wider transition-all flex items-center justify-center gap-3 border-2 ${
                    isMyTurn
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-[1.03] active:scale-[0.97]'
                      : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl">🃏</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span>KART ÇEK</span>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wide text-cyan-200">HIT (+1 KART)</span>
                  </div>
                </button>

                <button
                  onClick={handleStand}
                  disabled={!isMyTurn}
                  className={`h-16 sm:h-20 px-4 rounded-2xl font-display font-black text-lg sm:text-xl tracking-wider transition-all flex items-center justify-center gap-3 border-2 ${
                    isMyTurn
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-slate-950 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-[1.03] active:scale-[0.97]'
                      : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl">🛑</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span>PAS GEÇ</span>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wide text-amber-950">STAND (DUR)</span>
                  </div>
                </button>

                <button
                  onClick={handleDouble}
                  disabled={!isMyTurn || (myPlayer?.hand?.length !== 2) || (myChips < (myPlayer?.currentBet || 0))}
                  className={`h-16 sm:h-20 px-4 rounded-2xl font-display font-black text-lg sm:text-xl tracking-wider transition-all flex items-center justify-center gap-3 border-2 ${
                    isMyTurn && myPlayer?.hand?.length === 2 && myChips >= (myPlayer?.currentBet || 0)
                      ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.03] active:scale-[0.97]'
                      : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl">⚡</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span>İKİYE KATLA</span>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wide text-pink-200">DOUBLE (2X BAHİS)</span>
                  </div>
                </button>
              </div>
            )}

            {/* 3. ROUND END / NEXT ROUND (Host only or notification) */}
            {isRoundEnd && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-xs text-emerald-300 font-medium">
                  {isHost ? 'Sonraki ele geçmek için butona basın:' : 'Oda kurucusunun sonraki eli başlatması bekleniyor...'}
                </div>
                {isHost && (
                  <button
                    onClick={handleNextRound}
                    className="w-full sm:w-auto py-2 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(52,211,153,0.5)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Sonraki El / Tur
                  </button>
                )}
              </div>
            )}

            {/* 4. GAME OVER PODIUM */}
            {isGameOver && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/60 to-purple-950/60 border-2 border-amber-400/60 text-center flex flex-col items-center gap-2">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                <h3 className="text-lg font-display font-black text-amber-300">
                  🏆 TURNUVA ŞAMPİYONU: {sortedPlayers[0]?.name}
                </h3>
                <p className="text-xs text-slate-200">
                  Toplam Kasa: <strong className="text-amber-400 font-mono">{(sortedPlayers[0]?.chips || 0).toLocaleString()} Çip</strong>
                </p>
                {isHost && (
                  <button
                    onClick={() => socket.emit('return_to_lobby', { roomId: room.id })}
                    className="mt-2 py-2 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-display font-bold text-xs shadow-lg hover:brightness-110"
                  >
                    Lobiye Dön
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tablemates preview: other players' hands */}
        {room.players.length > 1 && (
          <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Masadaki Diğer Oyuncular
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {room.players
                .filter(p => p.id !== socket.id)
                .map(p => (
                  <div key={p.id} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold truncate text-slate-300">{p.avatar} {p.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{p.handValue || 0} Puan</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {p.hand && p.hand.length > 0 ? (
                        p.hand.map((c, idx) => {
                          const { symbol } = getSuitInfo(c.suit);
                          return (
                            <span key={idx} className="text-[10px] px-1 rounded bg-white/10 text-white font-mono">
                              {c.value}{symbol}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Bekliyor</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* ======================= SAĞ SÜTUN: KRUPİYE HAMLELERİ VE SOHBET (340px / 370px) ======================= */}
      <section className="w-full lg:w-[340px] xl:w-[370px] shrink-0 min-w-0 flex flex-col gap-2.5 min-h-0 h-full bg-[#0d1424]/95 backdrop-blur-md rounded-2xl border border-white/10 p-3 sm:p-4 shadow-xl overflow-hidden">
        
        {/* Tab Switcher Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 gap-1 shrink-0">
          <div className="flex items-center bg-black/50 p-1.5 rounded-xl border border-white/10 w-full gap-1">
            <button
              onClick={() => setRightPanelTab('all')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'all'
                  ? 'bg-gradient-to-r from-cyan-500/35 to-blue-500/35 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>⚡</span> Bölünmüş
            </button>
            <button
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'chat'
                  ? 'bg-gradient-to-r from-cyan-500/35 to-blue-500/35 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>💬</span> Sohbet
              {room.chat.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-400/30 text-cyan-200 font-bold">
                  {room.chat.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRightPanelTab('logs')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'logs'
                  ? 'bg-gradient-to-r from-cyan-500/35 to-blue-500/35 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🤖</span> Krupiye
              {room.cyber21Logs && room.cyber21Logs.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-400/30 text-purple-200 font-bold">
                  {room.cyber21Logs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Krupiye & Masa Akışı (Action Feed) */}
        {(rightPanelTab === 'all' || rightPanelTab === 'logs') && (
          <div className={`flex flex-col min-h-0 ${rightPanelTab === 'all' ? 'h-[32%] pb-2 border-b border-white/10' : 'flex-1'}`}>
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100">
                  Krupiye & Masa Kaydı
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold">Canlı Akış</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs sm:text-sm min-h-0">
              {room.cyber21Logs && room.cyber21Logs.length > 0 ? (
                room.cyber21Logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border leading-relaxed text-xs sm:text-sm font-semibold ${
                      log.type === 'dealer'
                        ? 'bg-purple-950/40 border-purple-500/40 text-purple-100'
                        : log.type === 'player'
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100'
                        : 'bg-white/[0.05] border-white/10 text-slate-100'
                    }`}
                  >
                    <span className="text-xs font-mono text-slate-300 mr-2 px-1.5 py-0.5 rounded bg-black/50 border border-white/10 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span>{log.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 italic text-center py-4">
                  Masa hamleleri burada anlık görüntülenecek.
                </div>
              )}
              <div ref={logsContainerRef} />
            </div>
          </div>
        )}

        {/* Canlı Sohbet ve Hızlı İfadeler */}
        {(rightPanelTab === 'all' || rightPanelTab === 'chat') && (
          <div className="flex-1 flex flex-col min-h-0 pt-1">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-200">
                <span>💬 Canlı Sohbet</span>
              </div>
              {/* Quick Emoji Bar */}
              <div className="flex items-center gap-1.5">
                {['🃏', '🚀', '💰', '🤖', '💥', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleSendQuickEmoji(emoji)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10 text-base sm:text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-0 text-sm">
              {room.chat.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl flex items-start gap-3 transition-all shadow-sm ${
                    msg.isSystem
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/40 text-xs sm:text-sm font-semibold'
                      : msg.senderName === myPlayer?.name
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 ml-3'
                      : 'bg-white/[0.08] text-slate-100 border border-white/15 mr-3'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center text-xl shrink-0">
                    {msg.senderAvatar}
                  </div>
                  <div className="leading-snug min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-200 truncate">{msg.senderName}</span>
                      {msg.senderName === myPlayer?.name && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-400/25 text-cyan-300 font-mono font-bold">SEN</span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base break-words select-text font-normal leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input & Submit Button */}
            <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Bir mesaj yaz veya tepki ver..."
                className="flex-1 bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 active:scale-95"
                title="Gönder"
              >
                <Send className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
