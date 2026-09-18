const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

const regex = /const startDrawing = \(e: React\.MouseEvent \| React\.TouchEvent\) => \{[\s\S]*?ctx\.current\.shadowBlur = 8;\n      \}/;
// Replace startDrawing to add a closing brace that was accidentally removed in a previous patch.
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
        ctx.current.strokeStyle = '#050811';
        ctx.current.shadowBlur = 0;
      } else {
        ctx.current.strokeStyle = color;
        ctx.current.shadowColor = color;
        ctx.current.shadowBlur = 8;
      }`;
code = code.replace(regex, newStartDrawing);

fs.writeFileSync('src/components/SketchGame.tsx', code);
