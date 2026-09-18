import { useState, useEffect } from 'react';
import { 
  Flame, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  AlertCircle, 
  X, 
  Gamepad2, 
  Loader2, 
  Dice5, 
  Radio, 
  Terminal, 
  Plus,
  CheckCircle2
} from 'lucide-react';
import socket from '../socket';

interface CyberAvatar {
  id: string;
  emoji: string;
  name: string;
  badge: string;
  color: string;
}

const CYBER_AVATARS: CyberAvatar[] = [
  { id: 'VISOR_X9', emoji: '🥽', name: 'Visor', badge: 'PRO', color: 'from-cyan-500 to-blue-600' },
  { id: 'CYBER_FOX', emoji: '🦊', name: 'Fox', badge: 'HACK', color: 'from-pink-500 to-rose-600' },
  { id: 'UNIT_70', emoji: '🤖', name: 'Robot', badge: 'MECH', color: 'from-cyan-400 to-teal-500' },
  { id: 'HOLO_CAT', emoji: '🐱', name: 'HoloCat', badge: 'NEON', color: 'from-purple-500 to-pink-500' },
  { id: 'SKULL_GLITCH', emoji: '💀', name: 'Skull', badge: 'VIRUS', color: 'from-red-500 to-orange-600' },
  { id: 'ARCADE_CHIP', emoji: '🕹️', name: 'Arcade', badge: 'RETRO', color: 'from-emerald-400 to-cyan-500' },
  { id: 'NEON_NINJA', emoji: '🥷', name: 'Ninja', badge: 'SPEC', color: 'from-violet-500 to-purple-600' },
  { id: 'CYBORG_CORE', emoji: '🧠', name: 'Cyborg', badge: 'CORE', color: 'from-amber-400 to-yellow-600' }
];

const RANDOM_NICK_PREFIXES = ['V3X', 'N30', 'K41', 'Z3R0', 'CYPHER', 'PULSE', 'NEXUS', 'SHADOW', 'AXEL', 'GHOST', 'BLAZE', 'RAVEN'];
const RANDOM_NICK_SUFFIXES = ['VOLT', 'RUNNER', 'SYNTH', 'HACK', 'RAZOR', 'VIPER', 'CORE', 'PRIME', 'STORM', 'SPECTER', 'BLAST', 'ZERO'];

export default function Home({ onJoin }: { onJoin: (roomId: string, name: string, avatar: string) => void }) {
  const [name, setName] = useState('V3X_N30');
  const [selectedAvatar, setSelectedAvatar] = useState<CyberAvatar>(CYBER_AVATARS[0]);
  const [joinCode, setJoinCode] = useState('');
  
  const [error, setError] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleRandomName = () => {
    const pre = RANDOM_NICK_PREFIXES[Math.floor(Math.random() * RANDOM_NICK_PREFIXES.length)];
    const suf = RANDOM_NICK_SUFFIXES[Math.floor(Math.random() * RANDOM_NICK_SUFFIXES.length)];
    const num = Math.floor(Math.random() * 900 + 100);
    const newName = `${pre}_${suf}_${num}`.slice(0, 15);
    setName(newName);
    if (error) setError(null);
  };

  const handleCreateRoom = (mode?: 'truth' | 'lexis' | 'cyber21' | 'cyberbomb') => {
    const trimmed = name.trim();
    if (!trimmed) {
      return setError({ msg: 'Lütfen önce siber oyuncu adınızı girin!', type: 'error' });
    }
    if (trimmed.length < 2) {
      return setError({ msg: 'Oyuncu adı en az 2 karakterden oluşmalıdır!', type: 'error' });
    }

    setIsLoadingCreate(true);
    socket.emit('create_room', { name: trimmed, avatar: selectedAvatar.emoji, gameMode: mode || 'cyberbomb' }, (res: any) => {
      setTimeout(() => {
        if (res.success) {
          setError({ msg: `Oda açıldı! Frekans: #${res.roomId} (Bağlanılıyor...)`, type: 'success' });
          setTimeout(() => onJoin(res.roomId, trimmed, selectedAvatar.emoji), 600);
        } else {
          setError({ msg: res.message || 'Oda oluşturulamadı, tekrar deneyin.', type: 'error' });
          setIsLoadingCreate(false);
        }
      }, 500);
    });
  };

  const handleJoinWithCode = (targetCode?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return setError({ msg: 'Odaya katılmak için siber oyuncu adı girin!', type: 'error' });
    }
    if (trimmed.length < 2) {
      return setError({ msg: 'Oyuncu adı en az 2 karakterden oluşmalıdır!', type: 'error' });
    }

    const code = (targetCode || joinCode).trim().toUpperCase().replace('#', '');
    if (!code || code.length < 3) {
      return setError({ msg: 'Lütfen geçerli bir oda kodu girin!', type: 'error' });
    }

    setIsLoadingJoin(true);
    socket.emit('join_room', { roomId: code, name: trimmed, avatar: selectedAvatar.emoji }, (res: any) => {
      setTimeout(() => {
        if (res.success) {
          setError({ msg: `"#${res.roomId}" odasına bağlanıldı!`, type: 'success' });
          setTimeout(() => onJoin(res.roomId, trimmed, selectedAvatar.emoji), 500);
        } else {
          setError({ msg: res.message || 'Odaya bağlanılamadı.', type: 'error' });
          setIsLoadingJoin(false);
        }
      }, 500);
    });
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-[#070a14] text-slate-100 flex flex-col justify-between relative overflow-x-hidden select-none font-sans">
      {/* Dynamic Ambient Cyber Lighting Gradients */}
      <div className="absolute -top-32 left-1/4 w-[650px] h-[360px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none -z-0"></div>
      <div className="absolute top-1/3 -right-20 w-[550px] h-[420px] bg-pink-500/12 blur-[150px] rounded-full pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 left-10 w-[450px] h-[320px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none -z-0"></div>

      {/* Decorative Matrix Hairline Vector Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 [background-image:linear-gradient(to_right,rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] -z-0"></div>

      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full px-5 sm:px-8 lg:px-12 py-3.5 bg-[#0a0e1c]/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-cyan-400 blur-[6px] absolute"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 relative"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-purple-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">
                CYBERPARTY
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 hidden sm:inline-block">
                ARENA
              </span>
            </div>
          </div>

          {/* Telemetry Status Bar */}
          <div className="hidden xl:flex items-center gap-2.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-cyan-300 font-bold">PING 14MS</span>
            </div>
            <span className="text-slate-600">//</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
              <span className="text-slate-300">14,289 OYUNCU AKTİF</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setShowRules(true)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-pink-300 transition"
            title="Nasıl Oynanır?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition"
            title="Ses Aç/Kapat"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Player Identity Pill */}
          <div className="flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 shadow-inner">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm shadow">
              {selectedAvatar.emoji}
            </div>
            <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[130px]">
              {name.trim() || 'SİBER_OYUNCU'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN COCKPIT ARENA CONTAINER */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6 justify-center">
        
        {/* Central Cockpit Announcement Header */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-cyan-500/30 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.15)] mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
              CANLI PROTOKOL // ÇOK OYUNCULU ARENA // 14MS GECİKME
            </span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl uppercase font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(0,240,255,0.65)]">
            CYBERPARTY <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 drop-shadow-[0_0_35px_rgba(255,74,141,0.7)]">ARENA</span>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-slate-400 tracking-[0.25em] uppercase font-semibold mt-1">
            SİBER PARTİ &amp; ÇOK OYUNCULU ARENA PROTOKOLÜ V2.5
          </p>
        </div>

        {/* Dual Command Deck: Profile Generator (8 cols) + Direct Room Access (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Profile & Identity Card (8 cols) */}
          <div className="lg:col-span-8 bg-[#0c1224]/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="font-display font-extrabold text-base sm:text-lg uppercase text-slate-100 tracking-wider">
                  SİBER KİMLİK OLUŞTUR
                </h2>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-3 py-1 rounded-xl tracking-wider">
                BENZERSİZ TAKMA AD
              </span>
            </div>

            {/* Nickname Input + Randomizer Action (Sleek full-width layout without any level indicators) */}
            <div className="mb-4">
              <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-400 font-mono text-base font-bold">
                  &gt;
                </div>
                <input 
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={15}
                  placeholder="Benzersiz oyuncu adınızı girin (örn: CYPHER_VOLT)..."
                  className="w-full pl-9 pr-32 py-3.5 bg-[#070b18]/90 border border-slate-700/80 rounded-2xl text-cyan-300 font-mono text-sm font-semibold tracking-wider placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 transition-all shadow-inner"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold ${name.trim().length >= 2 ? 'text-slate-400' : 'text-amber-400'}`}>
                    {name.length}/15
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomName}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-400 hover:text-slate-950 text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer font-mono text-xs font-bold shadow-sm"
                    title="Rastgele Benzersiz Siber İsim Üret"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>RASTGELE</span>
                  </button>
                </div>
              </div>
              {name.trim().length > 0 && name.trim().length < 2 && (
                <p className="text-[11px] font-mono text-amber-400 mt-1.5 pl-1">
                  * Siber oyuncu adı en az 2 karakter olmalıdır.
                </p>
              )}
            </div>

            {/* 8 Neon Cyber Avatar Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                  AVATAR MATRİKSİ SEÇİMİ
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-bold">
                  SEÇİLİ: {selectedAvatar.id} ({selectedAvatar.name})
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {CYBER_AVATARS.map(avatar => {
                  const isSelected = selectedAvatar.id === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`p-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer group ${
                        isSelected 
                          ? 'bg-cyan-950/60 border-2 border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105' 
                          : 'bg-[#0a0e20] border border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {avatar.emoji}
                      </div>
                      <span className={`text-[10px] font-mono font-bold mt-1 uppercase tracking-wider ${
                        isSelected ? 'text-cyan-300' : 'text-slate-400'
                      }`}>
                        {avatar.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Room Creation & Code Teleport (4 cols) */}
          <div className="lg:col-span-4 bg-[#0c1224]/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-5 h-5 text-pink-400" />
                <h2 className="font-display font-extrabold text-base sm:text-lg uppercase text-slate-100 tracking-wider">
                  HIZLI ODA ERİŞİMİ
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">
                Arkadaşlarınızla özel siber oda açın veya 6 haneli şifreli frekans koduyla doğrudan lobiye bağlanın.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Create Room High Impact Gradient CTA */}
              <button
                type="button"
                onClick={() => handleCreateRoom('cyberbomb')}
                disabled={isLoadingCreate}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(236,72,153,0.4)] hover:shadow-[0_0_32px_rgba(236,72,153,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                {isLoadingCreate ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>YENİ SİBER ODA OLUŞTUR</span>
                  </>
                )}
              </button>

              {/* Join with Code Form */}
              <div className="pt-2 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  VEYA ODA KODUYLA KATIL
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={9}
                      placeholder="#ODA-KODU"
                      className="w-full px-3 py-2.5 bg-[#070b18]/90 border border-slate-700/80 rounded-xl text-cyan-300 font-mono text-sm font-extrabold tracking-widest uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoinWithCode()}
                    disabled={isLoadingJoin}
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_22px_rgba(0,240,255,0.6)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isLoadingJoin ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>GİRİŞ</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Alerts */}
        {error && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all animate-shake ${
            error.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-300' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error.msg}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. PRIMARY GAME SELECTION ARENA (Large Interactive Bento Cards) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-display font-black text-base sm:text-xl uppercase tracking-wider text-slate-100">
                AKTİF OYUN MODLARI
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>EŞLEŞTİRME HAVUZU HAZIR</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Card 1: CYBER-BOMB */}
            <article className="group relative rounded-3xl bg-[#0d1326]/85 backdrop-blur-2xl p-5 border border-pink-500/30 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_36px_rgba(255,74,141,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-red-500 to-pink-500"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 font-mono text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 border border-pink-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>
                    VOLTAJ KRİTİK
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-white/5">
                    5/8 OYUNCU
                  </span>
                </div>

                <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-[#070b18] border border-pink-500/20 flex flex-col items-center justify-center relative mb-3 group-hover:scale-[1.02] transition-transform">
                  <span className="text-4xl mb-1 drop-shadow-[0_0_15px_rgba(244,114,182,0.8)]">💣</span>
                  <span className="text-[10px] font-mono font-bold text-pink-300 uppercase tracking-widest">
                    10s ➔ 5s HIZLANAN BOMBA
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white group-hover:text-pink-300 transition-colors uppercase tracking-tight">
                  CYBER-BOMB
                </h3>
                <p className="text-[11px] font-mono uppercase tracking-widest text-pink-400 font-bold mt-0.5">
                  SİBER KELİME BOMBASI &amp; VOLTAJ
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Refleks, kelime zinciri ve hızlanan geri sayım! Bomba elinde patlamadan fırlat, aşırı yüklenmiş işlemciyi hayatta tut.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Tur: 3-5 Dk</span>
                <button
                  type="button"
                  onClick={() => handleCreateRoom('cyberbomb')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,74,141,0.4)] hover:shadow-[0_0_22px_rgba(255,74,141,0.7)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>HIZLI OYNA</span>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </article>

            {/* Card 2: CYBER-21 */}
            <article className="group relative rounded-3xl bg-[#0d1326]/85 backdrop-blur-2xl p-5 border border-amber-500/30 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_36px_rgba(245,158,11,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    PROVABLY FAIR
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-white/5">
                    4/7 AKTİF
                  </span>
                </div>

                <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-amber-950/40 via-yellow-950/30 to-[#070b18] border border-amber-500/20 flex flex-col items-center justify-center relative mb-3 group-hover:scale-[1.02] transition-transform">
                  <span className="text-4xl mb-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">🃏</span>
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                    BLACKJACK 21 TURNUVASI
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight">
                  CYBER-21
                </h3>
                <p className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold mt-0.5">
                  BLACKJACK CASINO ARENASI
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Yapay zeka krupiyeye karşı provably fair 21 ve 10K çiplik turnuva. Kart say, blöf yap, kasayı devir.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">100 - 50K Çip</span>
                <button
                  type="button"
                  onClick={() => handleCreateRoom('cyber21')}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_22px_rgba(245,158,11,0.7)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>MASAYA KATIL</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </article>

            {/* Card 3: CYBERSPIN */}
            <article className="group relative rounded-3xl bg-[#0d1326]/85 backdrop-blur-2xl p-5 border border-purple-500/30 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_36px_rgba(168,85,247,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 border border-purple-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                    PARTİ PROTOKOLÜ
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-white/5">
                    12 ODA CANLI
                  </span>
                </div>

                <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-[#070b18] border border-purple-500/20 flex flex-col items-center justify-center relative mb-3 group-hover:scale-[1.02] transition-transform">
                  <span className="text-4xl mb-1 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]">🍾</span>
                  <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
                    DOĞRULUK // CESARET
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">
                  CYBERSPIN
                </h3>
                <p className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-bold mt-0.5">
                  NEON ŞİŞE ÇEVİRME &amp; MEYDAN OKUMA
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Klasik parti ruhu ultra-siber evrende. İtiraf odaları, sesli parti HUD entegrasyonu ve neon doğruluk cesaret çarkı.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Sesli / Chat</span>
                <button
                  type="button"
                  onClick={() => handleCreateRoom('truth')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_22px_rgba(168,85,247,0.7)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>GİRİŞ YAP</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </article>

            {/* Card 4: CYBERLEXIS */}
            <article className="group relative rounded-3xl bg-[#0d1326]/85 backdrop-blur-2xl p-5 border border-cyan-500/30 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_36px_rgba(0,240,255,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 border border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    SİBER KRİPTO
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-white/5">
                    6/8 OYUNCU
                  </span>
                </div>

                <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-blue-950/30 to-[#070b18] border border-cyan-500/20 flex flex-col items-center justify-center relative mb-3 group-hover:scale-[1.02] transition-transform">
                  <span className="text-4xl mb-1 drop-shadow-[0_0_15px_rgba(103,232,249,0.8)]">🔤</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                    [{' '}A-Z{' '}] ŞİFRE MATRİKSİ
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white group-hover:text-cyan-300 transition-colors uppercase tracking-tight">
                  CYBERLEXIS
                </h3>
                <p className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold mt-0.5">
                  SİBER KELİME &amp; ŞİFRE ÇÖZME
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Kriptolu siber verileri çöz, harf kombinasyonlarını tahmin et ve şifre matrisini ilk tamamlayan hacker ol.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Hızlı Tur: 2-4 Dk</span>
                <button
                  type="button"
                  onClick={() => handleCreateRoom('lexis')}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_22px_rgba(0,240,255,0.7)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>HEMEN ÇÖZ</span>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </article>

          </div>
        </section>

      </main>

      {/* 5. GLOBAL FOOTER */}
      <footer className="relative z-20 w-full px-5 sm:px-8 lg:px-12 py-5 bg-[#0a0e1c]/90 border-t border-white/10 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-sm text-cyan-300 tracking-wider">
            CYBERPARTY
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
            v4.8.2-PROD
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400 font-medium">
            SECURE COCKPIT PROTOCOL ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>
            <a 
              href="https://www.instagram.com/cagriscn.21/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-purple-400 transition-colors duration-300 flex items-center gap-1.5 group"
            >
              <span className="text-purple-400 font-bold tracking-wider drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,1)] transition-all">
                ⚡ Geliştirici: Çağrı
              </span>
            </a>
          </span>
          <span className="text-slate-700">•</span>
          <span className="font-mono">© 2025 CYBERPARTY ARENA</span>
        </div>
      </footer>

      {/* Game Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1428] max-w-lg w-full rounded-3xl p-6 relative border border-cyan-500/30 shadow-2xl">
            <button 
              onClick={() => setShowRules(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4 text-cyan-400">
              <Gamepad2 className="w-6 h-6" />
              <h3 className="font-display text-lg font-black text-white">Nasıl Oynanır?</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/20">
                <span className="text-pink-400 font-bold block mb-1">💣 CYBER-BOMB</span>
                Süre dolmadan (10s ➔ 5s hızlanır!) önceki kelimenin son harfiyle başlayan kelimeyi yazıp bombayı fırlat! Süre biterse bomba elinde patlar ve can kaybedersin.
              </div>
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20">
                <span className="text-amber-400 font-bold block mb-1">🃏 CYBER-21</span>
                Krupiyeye karşı Blackjack! 10.000 çip ile başla, kart çek veya pas geç, 21'i geçmeden krupiyeyi alt et.
              </div>
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
                <span className="text-purple-400 font-bold block mb-1">🍾 CYBERSPIN</span>
                Şişeyi çevir! Cesur sorular ve görevlerle arkadaşlarınla itiraflarda bulun.
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                <span className="text-cyan-400 font-bold block mb-1">🔤 CYBERLEXIS</span>
                Kriptolu siber verileri çöz, harf kombinasyonlarını tahmin et ve şifre matrisini ilk tamamlayan hacker ol.
              </div>
            </div>
            <button 
              onClick={() => setShowRules(false)} 
              className="mt-5 w-full py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display text-xs font-black tracking-wider transition"
            >
              ANLADIM, HAZIRIM!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
