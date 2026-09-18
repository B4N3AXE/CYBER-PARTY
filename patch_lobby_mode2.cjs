const fs = require('fs');
let code = fs.readFileSync('src/components/Lobby.tsx', 'utf8');

const sketchCard = `
            {/* CyberSketch */}
            <div 
              onClick={() => isHost && handleSettingChange('gameMode', 'sketch')}
              className={\`rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between gap-5 relative group cursor-pointer \${selectedGame === 'sketch' ? 'bg-[rgba(30,41,67,0.85)] border-2 border-emerald-400 shadow-xl shadow-emerald-500/15' : 'bg-[rgba(22,28,45,0.75)] border border-white/10 hover:border-emerald-400/50 hover:-translate-y-1'}\`}
            >
              {selectedGame === 'sketch' && (
                <div className="absolute -top-3 right-6 bg-emerald-400 text-slate-950 font-display font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> SEÇİLİ OYUN
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
                  🎨
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  2-10 Oyuncu
                </span>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-white mb-1">CyberSketch</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Çiz, anlat ve tahmin et! Ortak bir sanal tuvalde yeteneklerini konuştur ve rakiplerinden önce gizli kelimeyi bil.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Sanat & Tahmin</span>
                </div>
                {selectedGame === 'sketch' ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    Hazır <CheckCircle2 className="w-4 h-4" />
                  </span>
                ) : (
                  <button className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-400/40 hover:border-transparent text-emerald-200 hover:text-white text-xs font-bold transition flex items-center gap-1">
                    <span>Seç</span> <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
`;

code = code.replace(
  /className="grid grid-cols-1 sm:grid-cols-2 gap-5"/,
  'className="grid grid-cols-1 lg:grid-cols-3 gap-5"'
);

// We replace the end of Lexis div
code = code.replace(
  /(\s*<\/button>\s*)\}\s*<\/div>\s*<\/div>/,
  `$1}\n              </div>\n            </div>\n\${sketchCard}`
);

code = code.replace(
  /\{selectedGame === 'lexis' \? 'CyberLexis Turu Başlamak Üzere' : 'CyberTruth Turu Başlamak Üzere'\}/g,
  "{selectedGame === 'lexis' ? 'CyberLexis Turu Başlamak Üzere' : (selectedGame === 'sketch' ? 'CyberSketch Turu Başlamak Üzere' : 'CyberTruth Turu Başlamak Üzere')}"
);

// Add the sketch preview
const sketchPreview = `
            ) : selectedGame === 'sketch' ? (
              <div className="bg-black/30 rounded-2xl p-5 border border-white/5 flex flex-col items-center text-center gap-3">
                <span className="text-xs font-medium text-slate-400">Çizim Yeteneğini Göster:</span>
                <div className="w-32 h-24 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400 border-dashed flex items-center justify-center">
                  <span className="text-4xl">🖌️</span>
                </div>
                <div className="text-sm font-medium text-emerald-300 mt-2">
                  "Bir oyuncu çizer, diğerleri hızla tahmin eder!"
                </div>
              </div>
`;

code = code.replace(
  /\) : \(\s*<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">/,
  `${sketchPreview} ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">`
);

code = code.replace(
  /selectedGame === 'lexis' \? 'border-cyan-500\/20' : 'border-pink-500\/20'/g,
  "selectedGame === 'lexis' ? 'border-cyan-500/20' : (selectedGame === 'sketch' ? 'border-emerald-500/20' : 'border-pink-500/20')"
);

code = code.replace(
  /selectedGame === 'lexis' \? 'text-cyan-400' : 'text-pink-400'/g,
  "selectedGame === 'lexis' ? 'text-cyan-400' : (selectedGame === 'sketch' ? 'text-emerald-400' : 'text-pink-400')"
);

fs.writeFileSync('src/components/Lobby.tsx', code);
