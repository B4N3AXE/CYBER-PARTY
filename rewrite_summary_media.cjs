const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.tsx', 'utf8');

content = content.replace(
`        } else if (room.dareResult === 'approved') {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
               <span className="text-emerald-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} GÖREVİ BAŞARDI</span>
               <p className="text-white mb-4">Topluluk bu cesareti takdir etti!</p>
               <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                  +25 PUAN
               </div>
            </div>
          );
        } else {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 text-center shadow-[0_0_15px_rgba(244,63,94,0.15)]">
               <span className="text-rose-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} GÖREVİ BAŞARAMADI</span>
               <p className="text-white mb-4">Topluluk sunulan kanıtı yetersiz buldu!</p>
               <div className="inline-block bg-slate-500/10 border border-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                  0 PUAN
               </div>
            </div>
          );
        }`,
`        } else if (room.dareResult === 'approved') {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 text-center shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col items-center">
               <span className="text-emerald-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} GÖREVİ BAŞARDI</span>
               {room.proofMedia && (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg">
                    <img src={room.proofMedia} alt="Kanıt" className="w-full h-auto object-cover max-h-48" />
                  </div>
               )}
               <p className="text-white mb-4">Topluluk bu cesareti takdir etti!</p>
               <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                  +25 PUAN
               </div>
            </div>
          );
        } else {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 text-center shadow-[0_0_15px_rgba(244,63,94,0.15)] flex flex-col items-center">
               <span className="text-rose-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} GÖREVİ BAŞARAMADI</span>
               {room.proofMedia && (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg opacity-80 grayscale">
                    <img src={room.proofMedia} alt="Kanıt" className="w-full h-auto object-cover max-h-48" />
                  </div>
               )}
               <p className="text-white mb-4">Topluluk sunulan kanıtı yetersiz buldu!</p>
               <div className="inline-block bg-slate-500/10 border border-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                  0 PUAN
               </div>
            </div>
          );
        }`
);

fs.writeFileSync('src/components/GameBoard.tsx', content);
