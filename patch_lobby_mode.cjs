const fs = require('fs');
let code = fs.readFileSync('src/components/Lobby.tsx', 'utf8');

// Add sketch option in the UI
const sketchCard = `
            {/* CYBER SKETCH */}
            <div 
              onClick={() => { if(isHost) updateSettings({...room.settings, gameMode: 'sketch'}) }}
              className={\`relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col gap-2 border transition-all cursor-pointer \${isHost ? 'hover:-translate-y-1' : 'opacity-80 cursor-default'} \${room.settings.gameMode === 'sketch' ? 'bg-primary-container/10 border-primary-container shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-surface-container/50 border-outline-variant/30 hover:border-outline-variant'}\`}
            >
              {room.settings.gameMode === 'sketch' && <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/20 rounded-bl-[40px] pointer-events-none"></div>}
              <div className="flex items-center justify-between mb-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={\`material-symbols-outlined text-[24px] \${room.settings.gameMode === 'sketch' ? 'text-primary-container animate-bounce' : 'text-on-surface-variant'}\`}>draw</span>
                  <span className={\`font-display font-bold text-lg \${room.settings.gameMode === 'sketch' ? 'text-primary-container' : 'text-on-surface'}\`}>CyberSketch</span>
                </div>
                {room.settings.gameMode === 'sketch' && <span className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_10px_#00f0ff] animate-pulse"></span>}
              </div>
              <p className="text-sm text-on-surface-variant line-clamp-2 relative z-10">
                Skribbl.io tarzı canlı çizim. Bir kişi çizer, diğerleri süresi bitmeden tahmin eder.
              </p>
            </div>
`;

code = code.replace(
  /\{!\(room\.settings\.gameMode === 'lexis'\) && <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500\/20 rounded-bl-\[40px\] pointer-events-none"><\/div>\}/,
  "{room.settings.gameMode === 'truth' && <div className=\"absolute top-0 right-0 w-16 h-16 bg-pink-500/20 rounded-bl-[40px] pointer-events-none\"></div>}"
);

// We need to inject sketchCard after the CyberLexis block
code = code.replace(
  /(\{\/\* CYBER LEXIS \*\/\}[\s\S]*?<\/p>\s*<\/div>)/,
  `$1\n${sketchCard}`
);

fs.writeFileSync('src/components/Lobby.tsx', code);
