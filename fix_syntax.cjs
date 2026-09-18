const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// The replacement cut out the toolbar close tags and merged it with the chat.
// Let's restore the original toolbar tail and chat head.
code = code.replace(
  /\}\}\n          <div ref=\{chatEndRef\} \/>\n        <\/div>\n        \n        <form/,
  `)}
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-1 sm:mx-2"></div>
            
            <button 
              onClick={clearCanvas}
              onPointerDown={e => e.preventDefault()}
              className="px-3 sm:px-4 h-10 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all shrink-0"
            >
              Temizle
            </button>
          </footer>
        )}
      </main>

      {/* RIGHT: CHAT & GUESSES */}
      <aside className="w-full lg:w-80 shrink-0 flex flex-col rounded-xl bg-surface-container-low/80 backdrop-blur-xl shadow-lg overflow-hidden border border-outline-variant/30 h-[250px] lg:h-full">
        <div className="p-3 bg-black/20 border-b border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-300 uppercase">Canlı Tahminler</span>
          <span className="flex items-center gap-1.5 text-[10px] text-primary-container font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            CANLI
          </span>
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
          {room.chat?.map((msg, i) => {
            const isSystem = msg.isSystem;
            return (
              <div key={i} className={\`flex items-start gap-2 p-1.5 rounded \${isSystem ? 'bg-primary-container/10 text-primary text-xs font-semibold' : 'hover:bg-white/5'}\`}>
                {!isSystem && <span className="text-xs font-bold text-slate-400 shrink-0">{msg.senderName}:</span>}
                <span className={\`text-xs break-words \${isSystem ? '' : 'text-slate-200'}\`}>{msg.text}</span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        
        <form`
);

fs.writeFileSync('src/components/SketchGame.tsx', code);
