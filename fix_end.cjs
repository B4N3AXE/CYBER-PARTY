const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// The replacement cut out the "if (room.phase === 'sketch_round_end')" block because my regex matched the FIRST "return (" instead of the LAST one.
// Let's restore it.
const restoreCode = `
  if (room.phase === 'sketch_round_end') {
    return (
      <div className="w-full max-w-2xl mx-auto bg-surface-container/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
        <h2 className="font-display text-2xl font-bold text-primary-container mb-2 uppercase tracking-widest animate-pulse">Tur Bitti!</h2>
        <p className="text-slate-300 mb-6 text-center">Gizli kelime şuydu:</p>
        <div className="text-4xl sm:text-5xl font-black text-white bg-primary-container/20 px-8 py-4 rounded-2xl border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 mb-8 tracking-widest uppercase">
          {room.sketchWord}
        </div>
        {myPlayer?.isHost && (
          <button 
            onClick={() => socket.emit('sketch_next_round', { roomId: room.id })}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-1 transition-all"
          >
            Sonraki Tura Geç
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      id="cyberSketchContainer" `;

code = code.replace(/return \(\n    <div \n      id="cyberSketchContainer"/, restoreCode);

fs.writeFileSync('src/components/SketchGame.tsx', code);
