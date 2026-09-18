const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// Replace startDrawing to handle 'fill' tool
const newStartDrawing = `  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    if (e.cancelable) e.preventDefault(); // Prevent touch scrolling
    
    const pos = getCoords(e);
    
    if (tool === 'fill') {
       if (ctx.current) {
          floodFill(ctx.current, Math.floor(pos.x), Math.floor(pos.y), color);
          socket.emit('sketch_draw', { 
            roomId: room.id, 
            action: 'fill', 
            payload: { x: Math.floor(pos.x), y: Math.floor(pos.y), color } 
          });
       }
       return;
    }
    
    isDrawing.current = true;
    if (ctx.current) {
      ctx.current.beginPath();
      ctx.current.moveTo(pos.x, pos.y);
      ctx.current.lineCap = 'round';
      ctx.current.lineJoin = 'round';
      ctx.current.lineWidth = size;
      
      if (tool === 'eraser') {
        ctx.current.strokeStyle = '#0a0e16';
        ctx.current.shadowBlur = 0;
      } else {
        ctx.current.strokeStyle = color;
        ctx.current.shadowColor = color;
        ctx.current.shadowBlur = 8;
      }`;

code = code.replace(
  /const startDrawing = \(e: React\.MouseEvent \| React\.TouchEvent\) => \{[\s\S]*?ctx\.current\.shadowBlur = 8;\n      \}/,
  newStartDrawing
);

// We must also handle the 'fill' action in the socket receiver
const oldSocketOnDraw = `socket.on('sketch_draw_event', (data: { action: string; payload: any }) => {
      if (!ctx.current || isDrawer) return;
      const c = ctx.current;
      
      const { action, payload } = data;
      if (action === 'start') {`;

const newSocketOnDraw = `socket.on('sketch_draw_event', (data: { action: string; payload: any }) => {
      if (!ctx.current || isDrawer) return;
      const c = ctx.current;
      
      const { action, payload } = data;
      if (action === 'fill') {
        floodFill(c, Math.floor(payload.x), Math.floor(payload.y), payload.color);
      } else if (action === 'start') {`;

code = code.replace(oldSocketOnDraw, newSocketOnDraw);

// Update UI to show the 'fill' button
const oldTools = `<button 
                onClick={() => setTool('brush')}
                onPointerDown={e => e.preventDefault()}
                className={\`w-10 h-10 rounded-lg flex items-center justify-center transition-all \${tool === 'brush' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
              >
                🖌️
              </button>
              <button 
                onClick={() => setTool('eraser')}
                onPointerDown={e => e.preventDefault()}
                className={\`w-10 h-10 rounded-lg flex items-center justify-center transition-all \${tool === 'eraser' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
              >
                🧼
              </button>`;

const newTools = `<button 
                onClick={() => setTool('brush')}
                onPointerDown={e => e.preventDefault()}
                className={\`w-10 h-10 rounded-lg flex items-center justify-center transition-all \${tool === 'brush' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
                title="Fırça"
              >
                🖌️
              </button>
              <button 
                onClick={() => setTool('fill')}
                onPointerDown={e => e.preventDefault()}
                className={\`w-10 h-10 rounded-lg flex items-center justify-center transition-all \${tool === 'fill' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
                title="Boya Kovası"
              >
                🪣
              </button>
              <button 
                onClick={() => setTool('eraser')}
                onPointerDown={e => e.preventDefault()}
                className={\`w-10 h-10 rounded-lg flex items-center justify-center transition-all \${tool === 'eraser' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
                title="Silgi"
              >
                🧼
              </button>`;

code = code.replace(oldTools, newTools);

fs.writeFileSync('src/components/SketchGame.tsx', code);
