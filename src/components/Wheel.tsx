import { motion } from 'motion/react';
import { Player } from '../types';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#84cc16', '#d946ef'];

export default function Wheel({ 
  players, 
  spinningTo, 
  phase 
}: { 
  players: Player[], 
  spinningTo: string | null, 
  phase: string 
}) {
  const targetIndex = players.findIndex(p => p.id === spinningTo);
  
  const numSlices = players.length || 1;
  const sliceAngle = 360 / numSlices;
  
  const targetAngle = targetIndex !== -1 ? (targetIndex * sliceAngle + (sliceAngle / 2)) : 0;
  // To align the target slice's center to the top (which is 0 degrees in CSS rotation of our SVG),
  // we rotate the wheel by 360 - targetAngle.
  const restingRotation = targetIndex !== -1 ? (360 - targetAngle) : 0;
  
  const isSpinning = phase.startsWith('spin_');
  const rotationDegrees = isSpinning ? (360 * 5) + restingRotation : restingRotation;

  return (
    <div className="relative w-full max-w-[480px] aspect-square flex flex-col items-center justify-center mx-auto my-4 pointer-events-none">
      {/* Outer Table Glow & Ring */}
      <div className="absolute inset-4 rounded-full border border-neonPurple/20 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_0_80px_rgba(168,85,247,0.15)] pointer-events-none"></div>
      
      {/* Cyber Radial Dashed Markers */}
      <div className="absolute inset-10 rounded-full border-2 border-dashed border-white/10 animate-spin-slow pointer-events-none"></div>

      {/* Players around table (optional aesthetic, since they are also in the wheel, but it looks good) */}
      {players.map((p, i) => {
        // Avatars stay in their fixed positions relative to the table
        const angle = (i * sliceAngle) - 90 + (sliceAngle / 2); // Shift by -90 to start at top, plus half slice to align with wheel slices
        const isTarget = p.id === spinningTo && !isSpinning;
        return (
          <div 
            key={p.id}
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div 
              className={`absolute top-[-10px] md:top-[-20px] left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center transition-transform duration-300 pointer-events-auto ${isTarget ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
              style={{ transform: `rotate(${-angle}deg)` }}
            >
              <div className={`w-11 h-11 md:w-14 md:h-14 rounded-full p-0.5 shadow-lg ${isTarget ? 'bg-gradient-to-r from-neonPurple to-neonPink shadow-neon-pink' : 'bg-gradient-to-r from-neonBlue to-cyan-400 shadow-neon-blue'}`}>
                <div className="w-full h-full bg-darkBg rounded-full flex items-center justify-center text-2xl md:text-3xl">
                  {p.avatar}
                </div>
              </div>
              <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-darkBg/90 border shadow-lg truncate max-w-[80px] ${isTarget ? 'border-neonPink text-white' : 'border-white/20 text-slate-300'}`}>
                {p.name}
              </span>
            </div>
          </div>
        );
      })}

      {/* The Spinning Pointer Needle (Fixed at top) */}
      <div className="absolute top-16 z-30 flex flex-col items-center -translate-y-2 pointer-events-none">
        <div className="w-6 h-10 bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_0_15px_#f59e0b] drop-shadow-md rotate-180" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
      </div>

      {/* The Vibrant Neon Spinning Wheel / Surface */}
      <motion.div 
        className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-white/20 shadow-neon-glow flex items-center justify-center overflow-hidden pointer-events-none bg-darkBg"
        animate={{ rotate: rotationDegrees }}
        transition={{ duration: 3.5, ease: [0.15, 0.9, 0.2, 1] }}
      >
        <svg className="w-full h-full opacity-80" viewBox="-50 -50 100 100" style={{ transform: 'rotate(-90deg)' }}>
          {players.length === 1 ? (
             <>
                <circle cx="0" cy="0" r="50" fill={COLORS[0]} stroke="#ffffff33" strokeWidth="0.5" />
                <text x="0" y="0" fontSize="6" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle" transform="rotate(90)">
                   {players[0].name}
                </text>
             </>
          ) : (
            players.map((p, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = (i + 1) * sliceAngle;
              
              const x1 = Math.cos(startAngle * Math.PI / 180) * 50;
              const y1 = Math.sin(startAngle * Math.PI / 180) * 50;
              const x2 = Math.cos(endAngle * Math.PI / 180) * 50;
              const y2 = Math.sin(endAngle * Math.PI / 180) * 50;
              
              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              
              const pathData = [
                'M 0 0',
                `L ${x1} ${y1}`,
                `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              const midAngle = startAngle + (sliceAngle / 2);
              const textRadius = 28;
              const tx = Math.cos(midAngle * Math.PI / 180) * textRadius;
              const ty = Math.sin(midAngle * Math.PI / 180) * textRadius;
              const textRotation = midAngle + (midAngle > 90 && midAngle < 270 ? 180 : 0);
  
              return (
                <g key={p.id}>
                  <path d={pathData} fill={COLORS[i % COLORS.length]} fillOpacity="0.85" stroke="#ffffff33" strokeWidth="0.5" />
                  <text 
                    x={tx} 
                    y={ty} 
                    fontSize="5" 
                    fontWeight="bold" 
                    fill="white" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                    className="drop-shadow-md"
                  >
                    {p.name.substring(0, 12)}
                  </text>
                </g>
              );
            })
          )}
        </svg>

        {/* Center Hub */}
        <div className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[#090d16] via-[#1a2234] to-[#090d16] border-2 border-white/30 shadow-2xl flex flex-col items-center justify-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-neonPurple via-neonPink to-neonBlue p-0.5 shadow-neon-pink">
              <div className="w-full h-full rounded-full bg-[#0d1322] flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
