const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.tsx', 'utf8');

const newRoundEndCode = `    case 'round_end':
      phaseTitle = 'Tur Özeti';
      
      const isReady = room.readyForNextRound?.includes(myPlayer?.id || '');
      const readyCount = room.readyForNextRound?.length || 0;
      const totalCount = room.players.length;

      let summaryContent = null;
      if (room.selectedType === 'truth') {
        summaryContent = (
          <div className="glass-panel p-6 rounded-3xl border border-neonBlue/30 text-center shadow-neon-blue/20">
             <span className="text-neonBlue font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} DOĞRUYU SÖYLEDİ</span>
             <p className="text-white text-lg italic mb-4">"{room.answerText}"</p>
             <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                +10 PUAN
             </div>
          </div>
        );
      } else if (room.selectedType === 'dare') {
        if (room.dareResult === 'passed') {
          summaryContent = (
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 text-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
               <span className="text-amber-400 font-bold block mb-2 text-sm uppercase tracking-wider">{answerer?.name} PAS GEÇTİ</span>
               <p className="text-slate-300 mb-4">Bu görevi yapmaya cesaret edemedi!</p>
               <div className="inline-block bg-slate-500/10 border border-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                  0 PUAN
               </div>
            </div>
          );
        } else if (room.dareResult === 'approved') {
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
        }
      }

      phaseContent = (
        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full">
           {summaryContent}
           
           <div className="w-full flex flex-col gap-2 mt-4">
             <button
               onClick={() => socket.emit('ready_next_round', { roomId: room.id })}
               disabled={isReady}
               className={\`w-full py-4 rounded-xl font-bold text-lg transition-all \${isReady ? 'bg-white/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-default' : 'bg-gradient-to-r from-neonPurple to-neonPink text-white hover:scale-105 shadow-neon-pink'}\`}
             >
               {isReady ? 'Bekleniyor...' : 'Hazırım!'}
             </button>
             <p className="text-center text-sm font-medium text-slate-400 mt-2">
               Sonraki tur için: <span className={readyCount === totalCount ? 'text-emerald-400' : 'text-white'}>{readyCount} / {totalCount}</span> Oyuncu Hazır
             </p>
           </div>
        </div>
      );
      break;`;

content = content.replace(
`    case 'round_end':
      phaseTitle = 'Tur Sona Erdi!';
      phaseContent = <p className="text-center text-slate-300 text-lg">Sonraki tura geçiliyor...</p>;
      break;`,
newRoundEndCode
);

fs.writeFileSync('src/components/GameBoard.tsx', content);
