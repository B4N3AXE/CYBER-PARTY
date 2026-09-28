import React from 'react';
import { OkeyTile } from '../../../types/okey';

interface OkeyTileProps {
  tile: OkeyTile;
  isOkey?: boolean;
  isSelected?: boolean;
  isIndicator?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OkeyTileView: React.FC<OkeyTileProps> = ({
  tile,
  isOkey = false,
  isSelected = false,
  isIndicator = false,
  onClick,
  onDoubleClick,
  draggable = false,
  onDragStart,
  onDragEnd,
  className = '',
  size = 'md',
}) => {
  // Color configuration
  const colorMap: Record<string, { text: string; dot: string; glow: string; border: string }> = {
    red: {
      text: 'text-red-600',
      dot: 'bg-red-600',
      glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',
      border: 'border-red-500/40',
    },
    black: {
      text: 'text-slate-950',
      dot: 'bg-slate-950',
      glow: 'shadow-[0_0_8px_rgba(15,23,42,0.6)]',
      border: 'border-slate-700/40',
    },
    blue: {
      text: 'text-sky-600',
      dot: 'bg-sky-600',
      glow: 'shadow-[0_0_12px_rgba(2,132,199,0.5)]',
      border: 'border-sky-500/40',
    },
    yellow: {
      text: 'text-amber-500',
      dot: 'bg-amber-500',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      border: 'border-amber-400/40',
    },
    fake: {
      text: 'text-fuchsia-600',
      dot: 'bg-fuchsia-600',
      glow: 'shadow-[0_0_15px_rgba(217,70,239,0.6)]',
      border: 'border-fuchsia-500/50',
    },
  };

  const styleConfig = colorMap[tile.color] || colorMap.black;

  // Sizing styles - Horizontal rectangle 3D tile form (yatay form)
  let sizeClasses = 'w-14 sm:w-16 h-11 sm:h-12';
  let fontClasses = 'text-xl sm:text-2xl';
  let dotClasses = 'w-2 h-2';

  if (size === 'sm') {
    sizeClasses = 'w-11 h-9';
    fontClasses = 'text-base';
    dotClasses = 'w-1.5 h-1.5';
  } else if (size === 'lg') {
    sizeClasses = 'w-16 sm:w-20 h-13 sm:h-14';
    fontClasses = 'text-2xl sm:text-3xl';
    dotClasses = 'w-2.5 h-2.5';
  }

  const isFake = tile.isFakeOkey || tile.color === 'fake';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`relative select-none flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-150 ${sizeClasses}
        bg-gradient-to-b from-stone-50 via-stone-100 to-amber-100
        border-t-2 border-l border-white border-b-4 border-r-2 border-stone-400
        shadow-md shadow-black/60 active:scale-95
        ${isSelected ? 'ring-2 ring-cyan-400 -translate-y-2 shadow-[0_0_20px_rgba(0,240,255,0.7)]' : 'hover:-translate-y-1'}
        ${isOkey ? 'ring-2 ring-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.6)] bg-gradient-to-b from-cyan-50 via-stone-100 to-amber-100' : ''}
        ${isFake ? 'ring-2 ring-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.6)] bg-gradient-to-b from-fuchsia-50 via-stone-100 to-amber-100' : ''}
        ${isIndicator ? 'ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)]' : ''}
        ${className}
      `}
    >
      {/* Gloss reflection highlight on top */}
      <div className="absolute top-0 left-1 right-1 h-1 bg-white/70 rounded-t-sm pointer-events-none"></div>

      {isFake ? (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="font-headline-sm font-black text-fuchsia-600 text-xs sm:text-sm tracking-tighter drop-shadow-sm uppercase">
            JOKER
          </span>
          <span className="text-[9px] font-mono font-extrabold text-pink-500 uppercase tracking-widest mt-0.5">
            SAHTE
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center leading-none">
          <div className="flex items-center gap-0.5">
            <span
              className={`font-headline-sm font-black ${styleConfig.text} ${fontClasses} leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]`}
            >
              {tile.number}
            </span>
            {isOkey && (
              <span className="text-cyan-500 text-xs font-black animate-pulse">★</span>
            )}
          </div>
          <span
            className={`${styleConfig.dot} ${dotClasses} rounded-full shadow-inner mt-0.5`}
          ></span>
        </div>
      )}

      {/* Mini indicator badge for Okey */}
      {isOkey && (
        <div className="absolute -top-2 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-mono font-black text-[8px] uppercase tracking-tighter shadow-md border border-white">
          ★ OKEY
        </div>
      )}

      {/* Mini indicator badge for Gösterge */}
      {isIndicator && (
        <div className="absolute -top-2 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[8px] uppercase tracking-tighter shadow-md border border-white">
          ★ GÖSTERGE
        </div>
      )}
    </div>
  );
};
