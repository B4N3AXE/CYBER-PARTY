const fs = require('fs');
let code = fs.readFileSync('src/components/SketchGame.tsx', 'utf8');

// 1. Add "fill" tool to the state.
code = code.replace(
  `const [tool, setTool] = useState<'brush' | 'eraser'>('brush');`,
  `const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');`
);

// 2. Add the flood fill algorithm and fix line drawing logic
// We need to find the `startDrawing` and `draw` functions and inject the fill logic.
// First, let's inject a flood fill helper.
const floodFillCode = `
  const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length == 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return [r, g, b, 255];
  };

  const floodFill = (context: CanvasRenderingContext2D, startX: number, startY: number, fillColorStr: string) => {
    const canvas = context.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];
    
    const [fillR, fillG, fillB, fillA] = hexToRgb(fillColorStr);
    
    if (startR === fillR && startG === fillG && startB === fillB) return; // Same color

    const matchStartColor = (pos: number) => {
      return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB;
    };

    const colorPixel = (pos: number) => {
      data[pos] = fillR;
      data[pos + 1] = fillG;
      data[pos + 2] = fillB;
      data[pos + 3] = fillA;
    };

    const pixelStack: [number, number][] = [[startX, startY]];

    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;
      let currentPos = (y * width + x) * 4;
      
      let leftX = x;
      while (leftX > 0 && matchStartColor(currentPos - 4)) {
        leftX--;
        currentPos -= 4;
      }
      
      let rightX = x;
      while (rightX < width - 1 && matchStartColor(currentPos + 4)) {
        rightX++;
        currentPos += 4;
      }
      
      const drawWidth = rightX - leftX + 1;
      currentPos = (y * width + leftX) * 4;
      
      let upMatch = false;
      let downMatch = false;
      
      for (let i = 0; i < drawWidth; i++) {
        colorPixel(currentPos);
        
        if (y > 0) {
          const upPos = currentPos - width * 4;
          if (matchStartColor(upPos)) {
            if (!upMatch) {
              pixelStack.push([leftX + i, y - 1]);
              upMatch = true;
            }
          } else {
            upMatch = false;
          }
        }
        
        if (y < height - 1) {
          const downPos = currentPos + width * 4;
          if (matchStartColor(downPos)) {
            if (!downMatch) {
              pixelStack.push([leftX + i, y + 1]);
              downMatch = true;
            }
          } else {
            downMatch = false;
          }
        }
        
        currentPos += 4;
      }
    }
    
    context.putImageData(imageData, 0, 0);
  };
`;

code = code.replace("const getCoords =", floodFillCode + "\n  const getCoords =");

fs.writeFileSync('src/components/SketchGame.tsx', code);
