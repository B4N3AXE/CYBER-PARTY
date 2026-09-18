const fs = require('fs');
let code = fs.readFileSync('src/components/Lobby.tsx', 'utf8');

const startPattern = /<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">/;
const endPattern = /\{\/\* RIGHT: SQUAD FRIENDS & HUB CHAT \*\/\}/;

const startIndex = code.search(startPattern);
const endIndex = code.search(endPattern);

if (startIndex !== -1 && endIndex !== -1) {
  let newBlock = `
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* CyberTruth & Dare */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'truth')}
              className={\`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer \${selectedGame === 'truth' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-pink-500 shadow-xl shadow-pink-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-pink-500/50 hover:-translate-y-1'}\`}
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

            {/* CyberLexis */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'lexis')}
              className={\`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer \${selectedGame === 'lexis' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-cyan-400 shadow-xl shadow-cyan-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-cyan-400/50 hover:-translate-y-1'}\`}
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

            {/* CyberSketch */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'sketch')}
              className={\`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between gap-4 relative group cursor-pointer \${selectedGame === 'sketch' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-emerald-400 shadow-xl shadow-emerald-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-emerald-400/50 hover:-translate-y-1'}\`}
            >
              {selectedGame === 'sketch' && (
                <div className="absolute -top-3 right-4 bg-emerald-400 text-slate-950 font-display font-black text-[10px] sm:text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> SEÇİLİ
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-emerald-500/30">
                  🎨
                </div>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-white mb-1">CyberSketch</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Çiz, anlat ve tahmin et! Sanal tuvalde yeteneklerini konuştur ve kelimeyi bil.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-300 font-semibold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Sanat & Tahmin</span>
                </div>
                {selectedGame === 'sketch' ? (
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1">
                    Hazır <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Seç <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={\`bg-[rgba(22,28,45,0.75)] backdrop-blur-md rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col gap-4 border \${selectedGame === 'lexis' ? 'border-cyan-500/20' : (selectedGame === 'sketch' ? 'border-emerald-500/20' : 'border-pink-500/20')}\`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
              <div>
                <span className={\`text-xs font-bold uppercase tracking-wider \${selectedGame === 'lexis' ? 'text-cyan-400' : (selectedGame === 'sketch' ? 'text-emerald-400' : 'text-pink-400')}\`}>Lobi Durumu</span>
                <h4 className="font-display font-bold text-lg text-white">
                  {selectedGame === 'lexis' ? 'CyberLexis Turu Başlamak Üzere' : (selectedGame === 'sketch' ? 'CyberSketch Turu Başlamak Üzere' : 'CyberTruth Turu Başlamak Üzere')}
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

            {selectedGame === 'lexis' ? (
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
            ) : selectedGame === 'sketch' ? (
              <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-white/5 flex flex-col items-center text-center gap-3">
                <span className="text-xs font-medium text-slate-400">Çizim Yeteneğini Göster:</span>
                <div className="w-32 h-20 sm:h-24 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400 border-dashed flex items-center justify-center">
                  <span className="text-4xl">🖌️</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-emerald-300 mt-1">
                  "Bir oyuncu çizer, diğerleri hızla tahmin eder!"
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
                className={\`w-full sm:flex-1 py-4 px-6 rounded-2xl font-display font-extrabold text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 transition duration-200 \${(isHost ? canStart : myPlayer?.isReady) ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 shadow-teal-500/25 hover:scale-[1.02]' : 'bg-white/10 text-white'}\`}
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

        `;
  
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/components/Lobby.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find patterns", startIndex, endIndex);
}
