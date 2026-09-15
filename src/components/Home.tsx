import { useState, useEffect } from 'react';
import { Flame, Volume2, VolumeX, HelpCircle, User, Sparkles, Smile, PlusCircle, Zap, ArrowRight, AlertCircle, X, Gamepad2, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import socket from '../socket';

const AVATARS = [
  { emoji: '😎', name: 'Cool Cyber' },
  { emoji: '👻', name: 'Hayalet' },
  { emoji: '👽', name: 'Uzaylı' },
  { emoji: '🐵', name: 'Maymun' },
  { emoji: '🤖', name: 'Sayborg' },
  { emoji: '🤡', name: 'Joker' },
  { emoji: '🦁', name: 'Aslan' },
  { emoji: '🐸', name: 'Kurbağa' },
  { emoji: '🦄', name: 'Unicorn' },
  { emoji: '🐲', name: 'Ejderha' }
];

export default function Home({ onJoin }: { onJoin: (roomId: string, name: string, avatar: string) => void }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [joinCode, setJoinCode] = useState('');
  
  const [error, setError] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 3500);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleCreate = () => {
    if (!name.trim()) return setError({ msg: 'Lütfen partiye başlamadan önce bir oyuncu adı girin!', type: 'error' });
    setIsLoadingCreate(true);
    socket.emit('create_room', { name, avatar: avatar.emoji }, (res: any) => {
      setTimeout(() => {
        if (res.success) {
          setError({ msg: `Oda açıldı! Kodunuz: ${res.roomId} (Giriş yapılıyor...)`, type: 'success' });
          setTimeout(() => onJoin(res.roomId, name, avatar.emoji), 800);
        } else {
          setError({ msg: 'Oda oluşturulamadı', type: 'error' });
          setIsLoadingCreate(false);
        }
      }, 800);
    });
  };

  const handleJoin = () => {
    if (!name.trim()) return setError({ msg: 'Odaya katılmak için önce oyuncu adı girin!', type: 'error' });
    if (joinCode.length !== 6) return setError({ msg: 'Lütfen 6 haneli oda kodunu eksiksiz girin!', type: 'error' });
    setIsLoadingJoin(true);
    socket.emit('join_room', { roomId: joinCode, name, avatar: avatar.emoji }, (res: any) => {
      setTimeout(() => {
        if (res.success) {
          setError({ msg: `"${joinCode}" odasına bağlanıldı!`, type: 'success' });
          setTimeout(() => onJoin(res.roomId, name, avatar.emoji), 600);
        } else {
          setError({ msg: res.message || 'Odaya katılınamadı.', type: 'error' });
          setIsLoadingJoin(false);
        }
      }, 800);
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between relative select-none">
      {/* Top Bar Navigation */}
      <header className="relative z-20 w-full px-6 md:px-10 lg:px-14 py-6 md:py-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            <div className="w-full h-full bg-[#0d1225] rounded-xl flex items-center justify-center">
              <Flame className="w-7 h-7 text-pink-400 fill-pink-500/30" />
            </div>
          </div>
          <div>
            <span className="font-cyber text-xl md:text-2xl tracking-wider font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300">CYBERPARTY</span>
            <span className="ml-3 text-xs font-mono uppercase px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 tracking-widest">v2.4 ONLINE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/60 border border-slate-700/60 text-sm font-medium text-slate-300 backdrop-blur-md shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Sunucu:</span>
            <span className="text-emerald-300 font-mono">18ms (TR-IST)</span>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-cyan-300 transition backdrop-blur-md" title="Ses Aç/Kapat">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowRules(true)} className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-pink-300 transition backdrop-blur-md" title="Nasıl Oynanır?">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Login / Join Room Card Section */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px]">
          <div className="glass-panel rounded-3xl p-7 sm:p-9 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
            <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-500 tracking-wider">NET_ID // 8092</div>
            
            <div className="flex flex-col items-center text-center mb-7">
              <div className="relative group cursor-pointer mb-3">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-slow"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-[#11172f] border border-pink-500/40 flex items-center justify-center shadow-inner">
                  <Flame className="w-9 h-9 text-pink-400 fill-pink-500/25 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]" />
                </div>
              </div>
              <h1 className="font-cyber text-3xl sm:text-4xl font-black tracking-wider uppercase neon-text-gradient mt-1">
                CYBERPARTY
              </h1>
              <p className="text-sm text-slate-300 mt-2 font-medium tracking-wide">Partiyi başlatmak için giriş yap</p>
              <p className="text-xs text-purple-300/70 font-mono mt-0.5">// Siber Şişe Çevirmece & Doğruluk Cesaret //</p>
            </div>

            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-pink-400" /> Oyuncu Adı</span>
                  <span className={`text-[11px] font-mono ${name.length >= 13 ? 'text-pink-400' : 'text-slate-500'}`}>{name.length}/15</span>
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#080d1e]/80 text-white placeholder-slate-500 text-sm rounded-xl px-4 py-3.5 border border-slate-700/80 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition-all outline-none shadow-inner" 
                    placeholder="Adınızı veya siber lakabınızı girin..." 
                    maxLength={15} 
                    required 
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 group-focus-within:text-pink-400 transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-cyan-400" /> Karakterini Seç
                  </label>
                  <span className="text-xs font-medium text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">{avatar.emoji} {avatar.name}</span>
                </div>
                <div className="grid grid-cols-5 gap-2.5 p-3 rounded-2xl bg-[#090e21]/90 border border-slate-800 shadow-inner">
                  {AVATARS.map(a => (
                    <button 
                      key={a.emoji}
                      onClick={() => setAvatar(a)}
                      className={`relative flex items-center justify-center h-12 rounded-xl text-2xl transition duration-150 group ${avatar.emoji === a.emoji ? 'avatar-btn-active bg-slate-800/40 border border-pink-400/80' : 'bg-slate-800/40 border border-slate-700/50 hover:border-pink-400/80 hover:bg-slate-700/40'}`}
                      type="button"
                    >
                      <span>{a.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <button 
                  onClick={handleCreate}
                  disabled={isLoadingCreate}
                  className="btn-create-neon w-full py-3.5 px-6 rounded-xl font-cyber text-sm font-bold tracking-wider text-white flex items-center justify-center gap-2 group transition-all" 
                  type="button"
                >
                  {isLoadingCreate ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>ODA HAZIRLANIYOR...</span></>
                  ) : (
                    <><PlusCircle className="w-5 h-5 text-purple-200 group-hover:rotate-90 transition duration-300" />
                    <span>YENİ ODA OLUŞTUR</span>
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 ml-1" /></>
                  )}
                </button>
              </div>

              <div className="relative flex py-1 items-center justify-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 px-3 py-0.5 rounded-full text-[11px] font-mono tracking-widest text-slate-400 bg-[#0c1126] border border-slate-800">
                  VEYA
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="flex items-stretch gap-2.5">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-full h-full bg-[#080d1e]/90 text-center font-mono font-bold tracking-[0.25em] text-cyan-300 placeholder-slate-600 text-sm rounded-xl px-3 py-3 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 uppercase outline-none shadow-inner" 
                    maxLength={6} 
                    placeholder="6 HANELİ KOD" 
                  />
                </div>
                <button 
                  onClick={handleJoin}
                  disabled={isLoadingJoin}
                  className="btn-join-cyan px-7 py-3 rounded-xl font-cyber text-sm font-bold tracking-wide text-slate-950 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-80" 
                  type="button"
                >
                  {isLoadingJoin ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>KATIL</span><ArrowRight className="w-4 h-4 stroke-[2.5]" /></>}
                </button>
              </div>

              {error && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all duration-300 ${error.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-300' : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error.msg}</span>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gizlilik Korumalı</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-md">
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>Mobil & Web Uyumlu</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>500+ Yeni Soru</span>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer Stats */}
      <footer className="relative z-20 w-full px-6 md:px-10 lg:px-14 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 border-t border-slate-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">
            <strong className="text-slate-200 font-mono">1,420</strong> Oyuncu Çevrimiçi • <strong className="text-slate-200 font-mono">86</strong> Aktif Parti Odası
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>CYBERSPIN © 2026</span>
          <span className="text-slate-600">•</span>
          <span className="hover:text-cyan-400 cursor-pointer transition">Gizlilik</span>
          <span className="text-slate-600">•</span>
          <span className="hover:text-pink-400 cursor-pointer transition">Topluluk</span>
        </div>
      </footer>

      {/* Game Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 relative border border-purple-500/30 animate-float">
            <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4 text-pink-400">
              <Gamepad2 className="w-6 h-6" />
              <h3 className="font-cyber text-lg font-bold text-white">Nasıl Oynanır?</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span><strong>Oda Aç veya Katıl:</strong> İster kendi odanı açıp 6 haneli kodu arkadaşlarına yolla, ister arkadaşının kodunu gir.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                <span><strong>Şişeyi Döndür:</strong> Siber şişe döndüğünde bir soran ve bir cevaplayan seçilir.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">3.</span>
                <span><strong>Doğruluk mu Cesaret mi?</strong> Kartını seç, zamanlayıcı bitmeden görevi tamamla ve puanları topla!</span>
              </p>
            </div>
            <button onClick={() => setShowRules(false)} className="mt-5 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-cyber text-xs font-bold tracking-wider text-white transition">
              ANLADIM, HAZIRIM!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
