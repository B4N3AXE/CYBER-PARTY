import React, { useState, useRef, useEffect } from 'react';
import { Room, Player } from '../types';
import socket from '../socket';
import { Gamepad2, Copy, Volume2, LogOut, Sparkles, Flame, ArrowRight, Check, Zap, CheckCircle2, Play, UserPlus, Users, MessageCircle, Send, Settings, Lock, Clock, RefreshCw } from 'lucide-react';

export default function Lobby({ room, myPlayer }: { room: Room, myPlayer?: Player }) {
  const isHost = myPlayer?.isHost;
  const selectedGame = room.settings?.gameMode || 'truth';
  const [isMuted, setIsMuted] = useState(false);
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chat]);

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

  const canStart = isHost && room.players.length >= 1 && room.players.filter(p => !p.isHost).every(p => p.isReady);

  return (
    <div className="flex-1 w-full h-screen overflow-hidden relative flex flex-col justify-between select-none">
      {/* Colorful Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.18)_0%,rgba(59,130,246,0.08)_50%,transparent_70%)] pointer-events-none -z-10 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 right-1/4 w-[650px] h-[550px] bg-[radial-gradient(circle,rgba(236,72,153,0.18)_0%,rgba(147,51,234,0.08)_50%,transparent_70%)] pointer-events-none -z-10 rounded-full blur-3xl"></div>

      {/* TOP HEADER / HUB ROOM BAR */}
      <header className="w-full px-5 lg:px-10 py-4 bg-[#0d1220]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Gamepad2 className="w-6 h-6" />
              </div>
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
            <button onClick={() => window.location.reload()} className="w-10 h-10 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition ml-1" title="Odadan Ayrıl">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN HUB ARENA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-y-auto custom-scrollbar">
        
        {/* LEFT & CENTER: GAME SELECTION & LAUNCH BOARD */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-white/10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-pink-400 font-semibold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Parti Lobi Arenası</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                Hangi oyunu oynamak istersiniz?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-xl">
                Aşağıdan favori parti modunu seçin, tüm arkadaşlarınızın ekranı senkronize şekilde anında oyuna başlasın!
              </p>
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Cyber-Bomb (Word Bomb Arena) */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'cyberbomb')}
              className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer ${selectedGame === 'cyberbomb' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-pink-500 shadow-xl shadow-pink-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-pink-500/50 hover:-translate-y-1'}`}
            >
              {selectedGame === 'cyberbomb' && (
                <div className="absolute -top-3 right-4 bg-pink-500 text-white font-display font-black text-[10px] sm:text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> SEÇİLİ
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-red-500 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-pink-500/30">
                  💣
                </div>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-white mb-1">Cyber-Bomb</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kelime zinciri ve patlama arenası! Süre dolmadan son harfle kelime yaz, bombayı başkasına fırlat.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-pink-400 font-semibold">
                  <Flame className="w-4 h-4 text-pink-500" />
                  <span>Zincir & Hız</span>
                </div>
                {selectedGame === 'cyberbomb' ? (
                  <span className="text-[10px] sm:text-xs font-bold text-pink-400 flex items-center gap-1">
                    Hazır <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold text-pink-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Seç <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Cyber21 (Blackjack Tournament) */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'cyber21')}
              className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer ${selectedGame === 'cyber21' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-amber-400 shadow-xl shadow-amber-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-amber-400/50 hover:-translate-y-1'}`}
            >
              {selectedGame === 'cyber21' && (
                <div className="absolute -top-3 right-4 bg-amber-400 text-slate-950 font-display font-black text-[10px] sm:text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> SEÇİLİ
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-amber-500/30">
                  🃏
                </div>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-white mb-1">Cyber-21</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Krupiyeye karşı Blackjack turnuvası! 10.000 çip ile başla, kart çek, 21'e ulaş ve lider ol.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-300 font-semibold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Blackjack & Çip</span>
                </div>
                {selectedGame === 'cyber21' ? (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-400 flex items-center gap-1">
                    Hazır <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Seç <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* CyberLexis */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'lexis')}
              className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer ${selectedGame === 'lexis' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-cyan-400 shadow-xl shadow-cyan-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-cyan-400/50 hover:-translate-y-1'}`}
            >
              {selectedGame === 'lexis' && (
                <div className="absolute -top-3 right-4 bg-cyan-400 text-slate-950 font-display font-black text-[10px] sm:text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> SEÇİLİ
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-cyan-500/30">
                  🔤
                </div>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-white mb-1">CyberLexis</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kelime & tahmin! İpuçlarını çöz ve şifreyi ilk bulan sen ol.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-cyan-300 font-semibold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Hızlı Kelime</span>
                </div>
                {selectedGame === 'lexis' ? (
                  <span className="text-[10px] sm:text-xs font-bold text-cyan-400 flex items-center gap-1">
                    Hazır <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Seç <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* CyberTruth & Dare */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'truth')}
              className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer ${selectedGame === 'truth' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-pink-500 shadow-xl shadow-pink-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-pink-500/50 hover:-translate-y-1'}`}
            >
              {selectedGame === 'truth' && (
                <div className="absolute -top-3 right-4 bg-pink-500 text-white font-display font-black text-[10px] sm:text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> SEÇİLİ
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-pink-500/30">
                  🍾
                </div>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-white mb-1">CyberTruth</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Şişe ve çark çevirmece! Ekran dönsün, cesur sorular ve görevlerle parti kahkahaya boğulsun.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-pink-400 font-semibold">
                  <Flame className="w-4 h-4" />
                  <span>Soru & Görev</span>
                </div>
                {selectedGame === 'truth' ? (
                  <span className="text-[10px] sm:text-xs font-bold text-pink-400 flex items-center gap-1">
                    Hazır <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold text-pink-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Seç <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col gap-4 border ${selectedGame === 'cyberbomb' ? 'border-pink-500/30 shadow-lg shadow-pink-500/10' : selectedGame === 'cyber21' ? 'border-amber-500/20' : (selectedGame === 'lexis' ? 'border-cyan-500/20' : 'border-pink-500/20')}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${selectedGame === 'cyberbomb' ? 'text-pink-400' : selectedGame === 'cyber21' ? 'text-amber-400' : (selectedGame === 'lexis' ? 'text-cyan-400' : 'text-pink-400')}`}>Lobi Durumu</span>
                <h4 className="font-display font-bold text-lg text-white">
                  {selectedGame === 'cyberbomb' ? 'Cyber-Bomb Arenası Başlamak Üzere' : (selectedGame === 'cyber21' ? 'Cyber-21 Turnuvası Başlamak Üzere' : (selectedGame === 'lexis' ? 'CyberLexis Turu Başlamak Üzere' : 'CyberTruth Turu Başlamak Üzere'))}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400">{room.players.filter(p=>p.isReady || p.isHost).length} Oyuncu Hazır</span>
              </div>
            </div>

            {selectedGame === 'cyberbomb' ? (
              <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-pink-500/20 flex flex-col items-center text-center gap-3">
                <span className="text-xs font-medium text-slate-400">Dinamik Kelime Havuzu &amp; Başlangıç Kuralı:</span>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-bold font-mono text-pink-400">
                  <div className="bg-pink-950/50 px-3 py-1.5 rounded-xl border border-pink-500/30 flex items-center gap-1.5">
                    <span className="text-slate-200">ROBO<strong className="text-pink-300">T</strong></span>
                    <span className="text-cyan-400">➔</span>
                    <span className="text-yellow-300 font-black">&apos;T&apos;</span>
                  </div>
                  <div className="bg-purple-950/50 px-3 py-1.5 rounded-xl border border-purple-500/30 flex items-center gap-1.5">
                    <span className="text-slate-200">SİBE<strong className="text-purple-300">R</strong></span>
                    <span className="text-cyan-400">➔</span>
                    <span className="text-yellow-300 font-black">&apos;R&apos;</span>
                  </div>
                  <div className="bg-cyan-950/50 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5">
                    <span className="text-slate-200">DİJİTA<strong className="text-cyan-300">L</strong></span>
                    <span className="text-cyan-400">➔</span>
                    <span className="text-yellow-300 font-black">&apos;L&apos;</span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-medium text-pink-300 max-w-lg leading-relaxed">
                  &quot;Her maçta sistem <strong>rastgele bir başlangıç kelimesi</strong> seçer. Paslaşmalar arttıkça süre <strong>10s ➔ 8s ➔ 6s ➔ 5s</strong> olarak kademeli kısalır! Süre dolmadan son harfle başlayan kelimeni yazıp fırlat, yoksa bomba elinde patlar!&quot;
                </div>
              </div>
            ) : selectedGame === 'lexis' ? (
              <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-white/5 flex flex-col items-center text-center gap-3">
                <span className="text-xs font-medium text-slate-400">Örnek Tur Sorusunu Gör:</span>
                <div className="text-xs sm:text-sm font-medium text-slate-200 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                  "Ağ trafiğini denetleyen ve sızmaları önleyen güvenlik kalkanı"
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-1">
                  {['K','A','L','E'].map((letter, i) => (
                    <div key={i} className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-display font-extrabold text-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">{letter}</div>
                  ))}
                  <div className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl bg-white/5 border-2 border-dashed border-cyan-400 text-cyan-400 font-display font-extrabold text-xl flex items-center justify-center animate-pulse">?</div>
                </div>
              </div>
            ) : selectedGame === 'cyber21' ? (
              <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-white/5 flex flex-col items-center text-center gap-3">
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
                  "Krupiyeyi alt et, çipleri topla, turnuva şampiyonu ol!"
                </div>
              </div>
            ) : (
              <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-white/5 flex flex-col items-center text-center gap-3">
                <span className="text-xs font-medium text-slate-400">Tur Özellikleri:</span>
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-slate-300 text-xs sm:text-sm bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400"/> Cesaret Görevleri</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400"/> Gizli Sorular</span>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-pink-500/30 flex items-center justify-center mt-2 relative">
                  <div className="absolute inset-0 bg-pink-500/10 rounded-full animate-ping"></div>
                  <span className="text-3xl sm:text-4xl animate-spin-slow">🍾</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={isHost ? handleStart : handleReady}
                disabled={isHost ? !canStart : false}
                className={`w-full sm:flex-1 py-4 px-6 rounded-2xl font-display font-extrabold text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 transition duration-200 ${(isHost ? canStart : myPlayer?.isReady) ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 shadow-teal-500/25 hover:scale-[1.02]' : 'bg-white/10 text-white'}`}
              >
                {isHost ? (
                   <><Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> <span>OYUNU BAŞLAT</span></>
                ) : (
                   <><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> <span>{myPlayer?.isReady ? 'HAZIRIM (BEKLENİYOR)' : 'HAZIR OL'}</span></>
                )}
              </button>
              
              <button onClick={() => { navigator.clipboard.writeText(room.id); alert('Oda Kodu Kopyalandı!'); }} className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-display font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2 transition hover:scale-[1.02]">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Davet Et</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: SQUAD FRIENDS & HUB CHAT */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display font-bold text-base sm:text-lg text-white">Odadaki Arkadaşlar</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                {room.players.length} Kişi
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
              {room.players.map(p => (
                <div key={p.id} className={`p-3 rounded-2xl flex items-center justify-between transition ${p.id === socket.id ? 'bg-cyan-500/15 border-2 border-cyan-400/60' : 'bg-white/5 border border-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow ${p.id === socket.id ? 'bg-cyan-900/60 border border-cyan-400/60' : 'bg-white/10'}`}>
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

          <div className="bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-5 sm:p-6 flex flex-col justify-between flex-1 min-h-[220px] max-h-[300px] border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pink-400" />
                <h3 className="font-display font-bold text-base sm:text-lg text-white">Parti Sohbeti</h3>
              </div>
              <span className="text-xs text-slate-400">Canlı Mesajlaşma</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 my-2 text-sm custom-scrollbar">
              {room.chat.map(msg => (
                <div key={msg.id} className="bg-white/5 rounded-2xl p-2.5 border border-white/5 flex items-start gap-2">
                  <span className="text-lg leading-none">{msg.senderAvatar}</span>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-cyan-400 text-xs">{msg.senderName}</span>
                      <span className="text-[9px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <span className="text-slate-300 text-sm">{msg.text}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChat} className="pt-3 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                className="flex-1 bg-black/40 border border-white/15 focus:border-cyan-400 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition" 
                placeholder="Arkadaşlarına mesaj yaz..." 
              />
              <button type="submit" className="px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold transition shadow-md shadow-pink-500/20 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* SYSTEM SETTINGS PANEL */}
          <div className="bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-5 flex flex-col gap-4 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.15)] relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white">SİSTEM / LOBİ AYARLARI</h3>
              </div>
              {!isHost && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-500/30">SADECE HOST</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
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
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Ses Efektleri
                </label>
                <button 
                  disabled={!isHost}
                  onClick={() => handleSettingChange('sfx', !room.settings.sfx)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${room.settings.sfx !== false ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span>{room.settings.sfx !== false ? 'Açık' : 'Kapalı'}</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${room.settings.sfx !== false ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${room.settings.sfx !== false ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
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
