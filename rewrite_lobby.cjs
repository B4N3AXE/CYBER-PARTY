const fs = require('fs');

let content = fs.readFileSync('src/components/Lobby.tsx', 'utf8');

const newContent = `import { Room, Player } from '../types';
import socket from '../socket';

export default function Lobby({ room, myPlayer }: { room: Room, myPlayer?: Player }) {
  const isHost = myPlayer?.isHost;

  const handleStart = () => {
    socket.emit('start_game', { roomId: room.id });
  };

  const handleReady = () => {
    socket.emit('toggle_ready', { roomId: room.id });
  };

  const handleSettingsChange = (field: string, value: number) => {
    if (isHost) {
      socket.emit('update_settings', { 
        roomId: room.id, 
        settings: { ...room.settings, [field]: value } 
      });
    }
  };

  const canStart = isHost && room.players.length >= 1 && room.players.every(p => p.isReady);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl mx-auto p-4 z-20">
      
      <div className="text-center mb-8">
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonPurple to-neonPink drop-shadow-md mb-3">
          Bekleme Odası
        </h2>
        <div className="inline-flex items-center gap-3 glass-panel px-6 py-2 rounded-full border-neonBlue/30 shadow-neon-blue">
          <span className="text-slate-300 text-sm">Oda Kodu:</span>
          <span className="font-mono text-xl font-bold tracking-widest text-white">{room.id}</span>
        </div>
      </div>

      <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-stretch">
        
        {/* Left Col: Players */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-white">Katılanlar</h3>
            <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md text-slate-300">{room.players.length} / 10</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 min-h-[250px] max-h-[350px]">
            {room.players.map(p => (
              <div key={p.id} className="glass-card flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-darkBg border border-white/10 flex items-center justify-center text-xl shadow-inner">
                    {p.avatar}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      {p.name} {p.isHost && <span title="Oda Kurucusu" className="text-base leading-none">👑</span>}
                    </span>
                  </div>
                </div>
                {p.isReady ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(52,211,153,0.2)]">HAZIR</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-md">BEKLİYOR</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Settings & Actions */}
        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
          <h3 className="font-display font-bold text-lg text-white mb-6">Oda Ayarları</h3>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Tur Sayısı</span>
                <span className="font-mono text-neonPink font-bold">{room.settings.rounds}</span>
              </div>
              <input 
                type="range" min="1" max="20" 
                value={room.settings.rounds}
                disabled={!isHost}
                onChange={e => handleSettingsChange('rounds', parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neonPink disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Pas Geçme Hakkı</span>
                <span className="font-mono text-neonBlue font-bold">{room.settings.passJokers}</span>
              </div>
              <input 
                type="range" min="0" max="5" 
                value={room.settings.passJokers}
                disabled={!isHost}
                onChange={e => handleSettingsChange('passJokers', parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neonBlue disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Soru Değiştirme</span>
                <span className="font-mono text-emerald-400 font-bold">{room.settings.changeJokers}</span>
              </div>
              <input 
                type="range" min="0" max="5" 
                value={room.settings.changeJokers}
                disabled={!isHost}
                onChange={e => handleSettingsChange('changeJokers', parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleReady}
              className={\`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all uppercase \${myPlayer?.isReady ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)]'}\`}
            >
              {myPlayer?.isReady ? 'Hazır Değilim' : 'HAZIRIM!'}
            </button>
            
            {isHost && (
              <button
                onClick={handleStart}
                disabled={!canStart}
                className={\`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all uppercase \${canStart ? 'bg-gradient-to-r from-neonPurple to-neonPink text-white shadow-neon-pink cursor-pointer' : 'bg-black/40 text-slate-500 cursor-not-allowed border border-white/5'}\`}
              >
                Oyunu Başlat
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/Lobby.tsx', newContent);
