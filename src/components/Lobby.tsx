import React, { useState, useRef } from 'react';
import { Room, Player } from '../types';
import socket from '../socket';
import { 
  Gamepad2, Copy, Volume2, LogOut, Sparkles, Flame, ArrowRight, 
  Check, Zap, CheckCircle2, Play, UserPlus, Users, MessageCircle, 
  Send, Settings, Lock, Clock, RefreshCw, AlertTriangle, ShieldCheck, 
  Radio
} from 'lucide-react';

interface GameConfig {
  id: 'okey101' | 'okeyClassic' | 'cyberbomb' | 'cyber21' | 'lexis' | 'truth';
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  accentColor: string;
  activeBorder: string;
  activeGlow: string;
  activeBg: string;
  activeBadgeBg: string;
  accentText: string;
  tagClass: string;
  desc: string;
  players: string;
  feature: string;
}

const GAMES_LIST: GameConfig[] = [
  {
    id: 'okey101',
    title: '101 Okey',
    subtitle: 'KATLAMALI SİBER 101',
    icon: '🀄',
    badge: 'POPÜLER MOD 🔥',
    accentColor: '#00f0ff',
    activeBorder: 'border-cyan-400',
    activeGlow: 'shadow-[0_0_24px_rgba(0,240,255,0.4)]',
    activeBg: 'bg-gradient-to-b from-[#08202d]/90 via-[#071520]/95 to-[#050e17]/95',
    activeBadgeBg: 'bg-cyan-400 text-slate-950 font-black',
    accentText: 'text-cyan-400',
    tagClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    desc: '101 barajını aş veya 5 çift aç! Yatay 3D taşlar, çift katlı neon ıstaka, işlek cezaları ve katlamalı puanlama.',
    players: '2-4 Oyuncu',
    feature: '101 Katlama & Baraj',
  },
  {
    id: 'okeyClassic',
    title: 'Klasik Okey',
    subtitle: 'DÜZ TÜRK OKEYİ',
    icon: '🪵',
    badge: 'KLASİK MASA ⭐',
    accentColor: '#f59e0b',
    activeBorder: 'border-amber-400',
    activeGlow: 'shadow-[0_0_24px_rgba(245,158,11,0.4)]',
    activeBg: 'bg-gradient-to-b from-[#2e2008]/90 via-[#1b1406]/95 to-[#100d04]/95',
    activeBadgeBg: 'bg-amber-400 text-slate-950 font-black',
    accentText: 'text-amber-400',
    tagClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Geleneksel Türk Okeyi siberpunk dokusuyla! Seri ve çift perleri tamamla, gösterge puanını al, okey atarak masayı bitir.',
    players: '2-4 Oyuncu',
    feature: 'Düz Per & Okey Atma',
  },
  {
    id: 'cyberbomb',
    title: 'Cyber-Bomb',
    subtitle: 'KELİME BOMBASI',
    icon: '💣',
    badge: 'HIZLI TEMPO 🔥',
    accentColor: '#ec4899',
    activeBorder: 'border-pink-500',
    activeGlow: 'shadow-[0_0_24px_rgba(236,72,153,0.35)]',
    activeBg: 'bg-gradient-to-b from-[#2e122b]/90 via-[#1b0c1b]/95 to-[#100712]/95',
    activeBadgeBg: 'bg-pink-500 text-white',
    accentText: 'text-pink-400',
    tagClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    desc: 'Süre dolmadan son harfle kelime türet, bombayı başkasına fırlat. Süre gittikçe hızlanır!',
    players: '2-12 Oyuncu',
    feature: 'Zincir & Refleks',
  },
  {
    id: 'cyber21',
    title: 'Cyber-21',
    subtitle: 'SİBER BLACKJACK',
    icon: '🃏',
    badge: 'KASİNO ♠️',
    accentColor: '#f59e0b',
    activeBorder: 'border-amber-400',
    activeGlow: 'shadow-[0_0_24px_rgba(245,158,11,0.35)]',
    activeBg: 'bg-gradient-to-b from-[#2e2410]/90 via-[#1b1509]/95 to-[#100d05]/95',
    activeBadgeBg: 'bg-amber-400 text-slate-950 font-black',
    accentText: 'text-amber-400',
    tagClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Krupiyeye karşı Blackjack masası! 10.000 çiple başla, kart çek, 21\'e yaklaş ve çipleri katla.',
    players: '2-8 Oyuncu',
    feature: 'Blackjack & Risk',
  },
  {
    id: 'lexis',
    title: 'CyberLexis',
    subtitle: 'ŞİFRE & BULMACA',
    icon: '🔤',
    badge: 'ZEKA & TAHMİN 💡',
    accentColor: '#06b6d4',
    activeBorder: 'border-cyan-400',
    activeGlow: 'shadow-[0_0_24px_rgba(6,182,212,0.35)]',
    activeBg: 'bg-gradient-to-b from-[#0e2738]/90 via-[#0a1724]/95 to-[#060e17]/95',
    activeBadgeBg: 'bg-cyan-400 text-slate-950 font-black',
    accentText: 'text-cyan-400',
    tagClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    desc: 'Siber ipuçlarını çöz, gizli harfleri aç ve şifreli anahtar kelimeyi rakiplerinden önce tahmin et.',
    players: '2-10 Oyuncu',
    feature: 'Hızlı Bulmaca',
  },
  {
    id: 'truth',
    title: 'CyberTruth',
    subtitle: 'DOĞRULUK & CESARET',
    icon: '🍾',
    badge: 'PARTİ KLASİĞİ 🎉',
    accentColor: '#a855f7',
    activeBorder: 'border-purple-400',
    activeGlow: 'shadow-[0_0_24px_rgba(168,85,247,0.35)]',
    activeBg: 'bg-gradient-to-b from-[#26153c]/90 via-[#160b24]/95 to-[#0d0617]/95',
    activeBadgeBg: 'bg-purple-500 text-white',
    accentText: 'text-purple-400',
    tagClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    desc: 'Şişe ve çark çevirmece! Siberparti cesaret görevleri ve açık sözlü sorularla kahkahaya boğul.',
    players: '2-12 Oyuncu',
    feature: 'Soru & Görev',
  },
];

export default function Lobby({ room, myPlayer, onLeaveRoom }: { room: Room, myPlayer?: Player, onLeaveRoom?: () => void }) {
  const isHost = myPlayer?.isHost;
  const selectedGame = room.settings?.gameMode || 'okey101';
  const [isMuted, setIsMuted] = useState(false);
  const [chatText, setChatText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    socket.emit('start_game', { roomId: room.id });
  };

  const handleReady = () => {
    socket.emit('toggle_ready', { roomId: room.id });
  };

  const handleSettingChange = (field: string, value: any) => {
    if (isHost) {
      socket.emit('update_settings', {
        roomId: room.id,
        settings: { ...room.settings, [field]: value }
      });
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    socket.emit('chat-message', { roomId: room.id, text: chatText });
    setChatText('');
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(room.id);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const minPlayersRequired = 1;
  const hasMinPlayers = room.players.length >= minPlayersRequired;
  const readyCount = room.players.filter(p => p.isReady || p.isHost).length;
  const allGuestsReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
  const canStart = isHost && hasMinPlayers && allGuestsReady;

  return (
    <div className="flex-1 w-full min-h-screen relative flex flex-col justify-between select-none overflow-x-hidden">
      {/* Colorful Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.18)_0%,rgba(59,130,246,0.08)_50%,transparent_70%)] pointer-events-none -z-10 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 right-1/4 w-[650px] h-[550px] bg-[radial-gradient(circle,rgba(236,72,153,0.18)_0%,rgba(147,51,234,0.08)_50%,transparent_70%)] pointer-events-none -z-10 rounded-full blur-3xl"></div>

      {/* TOP HEADER / HUB ROOM BAR */}
      <header className="w-full px-5 lg:px-10 py-4 bg-[#0d1220]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/favicon-48x48.png" 
                alt="CyberParty Logo" 
                className="w-11 h-11 rounded-2xl border border-cyan-400/40 shadow-[0_0_18px_rgba(0,240,255,0.35)] object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-1.5">
                  CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">PARTY</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300">PARTİ</span>
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                  Arkadaşlarınla Canlı Eğlence
                </p>
              </div>
            </div>
            
            <div 
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition cursor-pointer"
              onClick={() => { navigator.clipboard.writeText(room.id); alert('Kopyalandı!'); }}
            >
              <span className="text-xs text-slate-400">ODA KODU:</span>
              <span className="font-mono font-extrabold text-sm tracking-wider text-cyan-300">#{room.id}</span>
              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-white transition" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <Volume2 className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-md border-2 border-cyan-400/40">
                  {myPlayer?.avatar || '😎'}
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0d1220]"></span>
                </span>
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-bold text-white flex items-center gap-1">
                  {myPlayer?.name || 'Misafir'}
                  {isHost && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-semibold">HOST</span>}
                </div>
                <span className="text-xs text-emerald-400 font-medium">{isHost ? 'Oda Yöneticisi' : 'Parti Üyesi'}</span>
              </div>
            </div>
            <button 
              onClick={() => onLeaveRoom ? onLeaveRoom() : window.location.reload()} 
              className="w-10 h-10 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition ml-1" 
              title="Odadan Ayrıl"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN HUB ARENA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        
        {/* 1. TOP SECTION: BANNER & GAME SELECTION GRID (IZGARA DÜZENİ) */}
        <section className="w-full flex flex-col gap-4">
          <div className="bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Parti Lobi Arenası</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                Hangi oyunu oynamak istersiniz?
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5 max-w-2xl">
                Aşağıdaki ızgaradan favori parti modunu seçin, tüm arkadaşlarınızın ekranı senkronize şekilde anında oyuna başlasın!
              </p>
            </div>
            {isHost ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold shrink-0 shadow-lg shadow-purple-500/10">
                <span>👑 MOD SEÇİM YETKİSİ SENDE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 text-xs font-mono shrink-0">
                <span>👑 Host mod seçimini yapıyor</span>
              </div>
            )}
          </div>

          {/* 5 OYUN SEÇİM KARTI - EŞİT BOYUTLU IZGARA (GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {GAMES_LIST.map((game) => {
              const isSelected = selectedGame === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => isHost && handleSettingChange('gameMode', game.id)}
                  className={`min-h-[220px] rounded-3xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between relative group select-none ${
                    isHost ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isSelected
                      ? `${game.activeBorder} border-2 ${game.activeGlow} ${game.activeBg} -translate-y-1`
                      : 'bg-[rgba(20,26,42,0.75)] border border-white/10 hover:border-white/25 hover:bg-[rgba(26,34,56,0.85)] hover:-translate-y-1'
                  }`}
                >
                  {/* Top Header inside card: Icon + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                      {game.icon}
                    </div>
                    {isSelected ? (
                      <span className={`text-[10px] font-display font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 ${game.activeBadgeBg}`}>
                        <Check className="w-3 h-3 stroke-[3]" /> SEÇİLİ
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                        {game.players}
                      </span>
                    )}
                  </div>

                  {/* Middle Content inside card: Subtitle + Title + Desc */}
                  <div className="my-2">
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 ${isSelected ? game.accentText : 'text-slate-400'}`}>
                      {game.subtitle}
                    </span>
                    <h3 className="font-display font-black text-lg text-white tracking-tight leading-snug">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-300/90 leading-relaxed mt-1 line-clamp-2">
                      {game.desc}
                    </p>
                  </div>

                  {/* Bottom Footer inside card */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {game.feature}
                    </span>
                    {isSelected ? (
                      <span className={`text-[11px] font-bold ${game.accentText} flex items-center gap-1`}>
                        Hazır <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : isHost ? (
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-white flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        Seç <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. LOWER SECTION: TWO-COLUMN ACTION & SQUAD HUB */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (lg:col-span-7): SELECTED GAME PREVIEW & ACTION BAR */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className={`bg-[rgba(22,28,45,0.85)] backdrop-blur-md rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col gap-5 border transition-all duration-300 ${
              selectedGame === 'okey101' ? 'border-cyan-400/40 shadow-xl shadow-cyan-500/10' :
              selectedGame === 'okeyClassic' ? 'border-amber-400/40 shadow-xl shadow-amber-500/10' :
              selectedGame === 'cyberbomb' ? 'border-pink-500/40 shadow-xl shadow-pink-500/10' :
              selectedGame === 'cyber21' ? 'border-amber-400/40 shadow-xl shadow-amber-500/10' :
              selectedGame === 'lexis' ? 'border-cyan-400/40 shadow-xl shadow-cyan-500/10' :
              'border-purple-400/40 shadow-xl shadow-purple-500/10'
            }`}>
              {/* Header: Game Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    selectedGame === 'okey101' ? 'text-cyan-400' :
                    selectedGame === 'okeyClassic' ? 'text-amber-400' :
                    selectedGame === 'cyberbomb' ? 'text-pink-400' :
                    selectedGame === 'cyber21' ? 'text-amber-400' :
                    selectedGame === 'lexis' ? 'text-cyan-400' :
                    'text-purple-400'
                  }`}>
                    Lobi Durumu &amp; Seçili Oyun
                  </span>
                  <h4 className="font-display font-black text-xl text-white mt-0.5">
                    {selectedGame === 'okey101' ? '🀄 101 Okey Siber Arenası' :
                     selectedGame === 'okeyClassic' ? '🪵 Klasik Okey Türk Masası' :
                     selectedGame === 'cyberbomb' ? '💣 Cyber-Bomb Patlama Arenası' :
                     selectedGame === 'cyber21' ? '🃏 Cyber-21 Blackjack Masası' :
                     selectedGame === 'lexis' ? '🔤 CyberLexis Şifre Masası' :
                     '🍾 CyberTruth Parti Çemberi'}
                  </h4>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    {readyCount} / {room.players.length} Oyuncu Hazır
                  </span>
                </div>
              </div>

              {/* Dynamic Game Rules / Preview */}
              {selectedGame === 'okey101' ? (
                <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-cyan-500/30 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      101 Okey Katlamalı Siber Masası
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">2-4 Oyuncu</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">📊</div>
                        <div className="text-xs font-bold text-cyan-300 mt-1">101 Barajı</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">Toplam per puanı en az 101 olunca açılır.</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">🪵</div>
                        <div className="text-xs font-bold text-amber-300 mt-1">5 Çift Açma</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">İsteyen oyuncu 5 çiftle elini açabilir.</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">⚠️</div>
                        <div className="text-xs font-bold text-red-300 mt-1">Katlamalı Ceza</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">Yanlış işleme ve işlekten çekmeye +101 ceza!</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">⭐</div>
                        <div className="text-xs font-bold text-purple-300 mt-1">Okey Bitişi</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">Okey atarak bitildiğinde cezalar 2x katlanır.</div>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'okeyClassic' ? (
                <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-amber-500/30 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      Klasik Düz Türk Okeyi
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">2-4 Oyuncu</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">🎴</div>
                        <div className="text-xs font-bold text-amber-300 mt-1">14+1 Taş Düzeni</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">Tüm perler tamamlandığında 15. taş ortaya atılır.</div>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">🧿</div>
                        <div className="text-xs font-bold text-cyan-300 mt-1">Gösterge Puanı</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">İlk tur göstergeyi gösteren oyuncu puan kazanır.</div>
                    </div>
                    <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">🃏</div>
                        <div className="text-xs font-bold text-pink-300 mt-1">Sahte Okey</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">Okey taşının yerine geçer ve her pere uyar.</div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xl">🏆</div>
                        <div className="text-xs font-bold text-emerald-300 mt-1">4x Düşüm Bitiş</div>
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-1">Çiftten veya okeyle bitişte 4 puan birden düşülür.</div>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'cyberbomb' ? (
                <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-pink-500/20 flex flex-col items-center text-center gap-3">
                  <span className="text-xs font-medium text-slate-400">Dinamik Kelime Havuzu &amp; Başlangıç Kuralı:</span>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-bold font-mono text-pink-400">
                    <div className="bg-pink-950/60 px-3 py-1.5 rounded-xl border border-pink-500/30 flex items-center gap-1.5">
                      <span className="text-slate-200">ROBO<strong className="text-pink-300">T</strong></span>
                      <span className="text-cyan-400">➔</span>
                      <span className="text-yellow-300 font-black">&apos;T&apos;</span>
                    </div>
                    <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-500/30 flex items-center gap-1.5">
                      <span className="text-slate-200">SİBE<strong className="text-purple-300">R</strong></span>
                      <span className="text-cyan-400">➔</span>
                      <span className="text-yellow-300 font-black">&apos;R&apos;</span>
                    </div>
                    <div className="bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5">
                      <span className="text-slate-200">DİJİTA<strong className="text-cyan-300">L</strong></span>
                      <span className="text-cyan-400">➔</span>
                      <span className="text-yellow-300 font-black">&apos;L&apos;</span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-pink-300 max-w-lg leading-relaxed">
                    &quot;Rastgele başlangıç kelimesi gelir. Paslaşmalar arttıkça süre <strong>10s ➔ 8s ➔ 6s ➔ 5s</strong> olarak hızlanır! Süre dolmadan son harfle kelimeni yaz, bombayı başkasına fırlat!&quot;
                  </div>
                </div>
              ) : selectedGame === 'cyber21' ? (
                <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-amber-500/20 flex flex-col items-center text-center gap-3">
                  <span className="text-xs font-medium text-slate-400">Cyber-21 Turnuva Masası:</span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-xl bg-gradient-to-b from-[#1c263c] to-[#0c1220] border-2 border-amber-400/50 flex flex-col items-center justify-center font-display font-black text-amber-300 shadow-md">
                      <span className="text-sm leading-none">A</span>
                      <span className="text-xs">♠️</span>
                    </div>
                    <div className="w-12 h-16 rounded-xl bg-gradient-to-b from-[#1c263c] to-[#0c1220] border-2 border-amber-400/50 flex flex-col items-center justify-center font-display font-black text-rose-400 shadow-md">
                      <span className="text-sm leading-none">K</span>
                      <span className="text-xs">♥️</span>
                    </div>
                    <span className="text-amber-400 font-bold font-mono text-sm">= 21 !</span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-amber-300 mt-1">
                    &quot;Krupiyeyi alt et, kart çek, risk al ve 10.000 çiple turnuva şampiyonu ol!&quot;
                  </div>
                </div>
              ) : selectedGame === 'lexis' ? (
                <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-cyan-500/20 flex flex-col items-center text-center gap-3">
                  <span className="text-xs font-medium text-slate-400">Örnek Tur Sorusunu Gör:</span>
                  <div className="text-xs sm:text-sm font-medium text-slate-200 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                    &quot;Ağ trafiğini denetleyen ve sızmaları önleyen güvenlik kalkanı&quot;
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-1">
                    {['K','A','L','E'].map((letter, i) => (
                      <div key={i} className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-display font-extrabold text-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">{letter}</div>
                    ))}
                    <div className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl bg-white/5 border-2 border-dashed border-cyan-400 text-cyan-400 font-display font-extrabold text-xl flex items-center justify-center animate-pulse">?</div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-purple-500/20 flex flex-col items-center text-center gap-3">
                  <span className="text-xs font-medium text-slate-400">Tur Özellikleri:</span>
                  <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-slate-300 text-xs sm:text-sm bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                    <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-pink-400"/> Cesaret Görevleri</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400"/> Gizli Sorular</span>
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-pink-500/30 flex items-center justify-center mt-1 relative">
                    <div className="absolute inset-0 bg-pink-500/10 rounded-full animate-ping"></div>
                    <span className="text-3xl sm:text-4xl animate-spin-slow">🍾</span>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS (OYUNU BAŞLAT / HAZIR OL / DAVET ET) */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
                <button 
                  onClick={isHost ? handleStart : handleReady}
                  disabled={isHost ? !canStart : false}
                  className={`w-full sm:flex-1 py-4 px-6 rounded-2xl font-display font-black text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                    (isHost ? canStart : myPlayer?.isReady) 
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-500/25 hover:scale-[1.02] cursor-pointer' 
                      : 'bg-white/10 text-white/70 cursor-not-allowed'
                  }`}
                >
                  {isHost ? (
                    <>
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> 
                      <span>
                        {!hasMinPlayers
                          ? `EN AZ ${minPlayersRequired} OYUNCU GEREKİYOR (${room.players.length}/${minPlayersRequired})`
                          : !allGuestsReady
                          ? `OYUNCULARIN HAZIR OLMASI BEKLENİYOR (${readyCount}/${room.players.length})`
                          : 'OYUNU BAŞLAT'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> 
                      <span>{myPlayer?.isReady ? 'HAZIRSIN (HOST BEKLENİYOR)' : 'HAZIR OL'}</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={handleCopyCode} 
                  className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-display font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2 transition hover:scale-[1.02] cursor-pointer"
                  title="Oda kodunu panoya kopyala"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                      <span className="text-emerald-300 font-bold">Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 text-cyan-400" />
                      <span>Davet Et (#{room.id})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-5): SQUAD, SETTINGS & LIVE CHAT */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* 1. SQUAD FRIENDS */}
            <div className="bg-[rgba(22,28,45,0.85)] backdrop-blur-md rounded-3xl p-5 sm:p-6 flex flex-col gap-3.5 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-display font-bold text-base sm:text-lg text-white">Odadaki Arkadaşlar</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                  {room.players.length} Kişi
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                {room.players.map(p => (
                  <div key={p.id} className={`p-3 rounded-2xl flex items-center justify-between transition ${p.id === socket.id ? 'bg-cyan-500/15 border-2 border-cyan-400/60' : 'bg-white/5 border border-white/10'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow ${p.id === socket.id ? 'bg-cyan-900/60 border border-cyan-400/60' : 'bg-white/10'}`}>
                        {p.avatar}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                          {p.name}
                          {p.id === socket.id && <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">SEN</span>}
                          {p.isHost && <span className="text-[10px] bg-purple-500 text-white font-black px-1.5 py-0.5 rounded-md">HOST</span>}
                        </div>
                        <div className="text-xs text-slate-400">{p.isHost ? 'Oyun Seçiyor...' : (p.isReady ? 'Hazır bekliyor' : 'Başlamayı bekliyor')}</div>
                      </div>
                    </div>
                    {p.isHost ? (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center gap-1">
                        👑 Yönetici
                      </span>
                    ) : p.isReady ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Hazır
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1">
                        ⏳ Bekliyor
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SYSTEM / LOBBY SETTINGS */}
            <div className="bg-[rgba(22,28,45,0.85)] backdrop-blur-md rounded-3xl p-5 flex flex-col gap-3.5 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.15)] relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <h3 className="font-display font-bold text-xs tracking-wider uppercase text-white">SİSTEM / LOBİ AYARLARI</h3>
                </div>
                {!isHost && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/30">SADECE HOST</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" /> Oda Gizliliği
                  </label>
                  <button 
                    disabled={!isHost}
                    onClick={() => handleSettingChange('isPrivate', !room.settings.isPrivate)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${room.settings.isPrivate ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span>{room.settings.isPrivate ? 'Gizli' : 'Açık'}</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${room.settings.isPrivate ? 'bg-purple-500' : 'bg-slate-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${room.settings.isPrivate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" /> Oyuncu Sınırı
                  </label>
                  <select 
                    disabled={!isHost}
                    value={room.settings?.maxPlayers || 8}
                    onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                  >
                    <option value="4" className="bg-slate-900">4 Kişi</option>
                    <option value="6" className="bg-slate-900">6 Kişi</option>
                    <option value="8" className="bg-slate-900">8 Kişi</option>
                    <option value="12" className="bg-slate-900">12 Kişi</option>
                  </select>
                </div>

                {selectedGame === 'okey101' || selectedGame === 'okeyClassic' ? (
                  <>
                    <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-black/40 border border-cyan-500/30">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5">
                          <span>🀄</span> Okey Oyun Modu
                        </label>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black tracking-wide">
                          {selectedGame === 'okey101' ? '101 SİBER' : 'KLASİK DÜZ'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <button
                          type="button"
                          disabled={!isHost}
                          onClick={() => handleSettingChange('gameMode', 'okey101')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            selectedGame === 'okey101'
                              ? 'bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)] border-2 border-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <span className="text-base">🀄</span>
                          <span className="font-display font-black">101 Okey</span>
                          <span className="text-[9px] font-mono font-bold opacity-80">Katlamalı &amp; Baraj</span>
                        </button>
                        <button
                          type="button"
                          disabled={!isHost}
                          onClick={() => handleSettingChange('gameMode', 'okeyClassic')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            selectedGame === 'okeyClassic'
                              ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] border-2 border-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <span className="text-base">🪵</span>
                          <span className="font-display font-black">Klasik Okey</span>
                          <span className="text-[9px] font-mono font-bold opacity-80">Düz Masa</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        🧿 Gösterge Bonusu
                      </label>
                      <button 
                        disabled={!isHost}
                        onClick={() => handleSettingChange('okeyIndicatorBonus', room.settings?.okeyIndicatorBonus === false ? true : false)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${room.settings?.okeyIndicatorBonus !== false ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-white/5 border border-white/10 text-slate-400'} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <span>{room.settings?.okeyIndicatorBonus !== false ? 'Aktif (+Puan)' : 'Kapalı'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${room.settings?.okeyIndicatorBonus !== false ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                          {room.settings?.okeyIndicatorBonus !== false ? 'AÇIK' : 'KAPALI'}
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-pink-400 font-bold flex items-center gap-1">
                        ⚡ Ceza Katlama Çarpanı
                      </label>
                      <select 
                        disabled={!isHost}
                        value={room.settings?.okeyPenaltyMultiplier || 1}
                        onChange={(e) => handleSettingChange('okeyPenaltyMultiplier', parseInt(e.target.value))}
                        className="w-full py-2 px-3 rounded-xl bg-pink-500/10 border border-pink-500/40 text-xs text-white font-bold outline-none focus:border-pink-400 disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="1" className="bg-slate-900">1x Standart Kurallar</option>
                        <option value="2" className="bg-slate-900">2x Çift Katlamalı Ceza</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Tur Sayısı
                      </label>
                      <select 
                        disabled={!isHost}
                        value={room.settings?.rounds || 5}
                        onChange={(e) => handleSettingChange('rounds', parseInt(e.target.value))}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="3" className="bg-slate-900">3 Tur</option>
                        <option value="5" className="bg-slate-900">5 Tur</option>
                        <option value="10" className="bg-slate-900">10 Tur</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> Tur Süresi
                      </label>
                      <select 
                        disabled={!isHost}
                        value={room.settings?.timeLimit || 60}
                        onChange={(e) => handleSettingChange('timeLimit', parseInt(e.target.value))}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="30" className="bg-slate-900">30 Saniye</option>
                        <option value="45" className="bg-slate-900">45 Saniye</option>
                        <option value="60" className="bg-slate-900">60 Saniye</option>
                        <option value="90" className="bg-slate-900">90 Saniye</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. LIVE PARTY CHAT */}
            <div className="bg-[rgba(22,28,45,0.85)] backdrop-blur-md rounded-3xl p-5 sm:p-6 flex flex-col justify-between min-h-[220px] max-h-[300px] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-pink-400" />
                  <h3 className="font-display font-bold text-base sm:text-lg text-white">Parti Sohbeti</h3>
                </div>
                <span className="text-xs text-slate-400">Canlı Mesajlaşma</span>
              </div>

              <div ref={chatContainerRef} className="flex-1 space-y-2.5 overflow-y-auto pr-1 my-2 text-sm custom-scrollbar max-h-[140px]">
                {room.chat.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-4 italic">
                    Henüz mesaj yok. Arkadaşlarına ilk selamı ver!
                  </div>
                ) : (
                  room.chat.map(msg => (
                    <div key={msg.id} className="bg-white/5 rounded-2xl p-2.5 border border-white/5 flex items-start gap-2">
                      <span className="text-base leading-none">{msg.senderAvatar}</span>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-cyan-400 text-xs">{msg.senderName}</span>
                          <span className="text-[9px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <span className="text-slate-300 text-xs mt-0.5">{msg.text}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleChat} className="pt-3 border-t border-white/10 flex gap-2">
                <input 
                  type="text" 
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/15 focus:border-cyan-400 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none placeholder:text-slate-500 transition" 
                  placeholder="Arkadaşlarına mesaj yaz..." 
                />
                <button type="submit" className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold transition shadow-md shadow-pink-500/20 flex items-center justify-center cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </section>
      </main>

      {/* CLEAN BOTTOM FOOTER */}
      <footer className="w-full px-6 py-4 bg-[#0d1220]/70 backdrop-blur-md border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between mt-4">
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-0 w-full sm:w-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>CyberParty Parti Odası • Canlı Senkronize Bağlantı</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-slate-400 w-full sm:w-auto">
          <span>Oda: #{room.id}</span>
          <span>•</span>
          <span>
            <a href="https://www.instagram.com/cagriscn.21/" target="_blank" rel="noopener noreferrer" className="hover:text-neonPurple transition-colors duration-300 flex items-center gap-2 group">
              <span className="text-neonPurple font-bold tracking-wider drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,1)] transition-all">⚡ Geliştirici: Çağrı</span>
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
