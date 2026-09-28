import React, { useState, useEffect } from 'react';
import { Room, Player } from '../../../types';
import { OkeyTile, OkeyGameState, OkeyPlayerHand } from '../../../types/okey';
import { OkeyTileView } from './OkeyTileView';
import { OkeyPenaltyModal } from './OkeyPenaltyModal';
import { sortTilesBySeries, sortTilesByPairs } from '../../../utils/okeySorting';
import { validateHandFinish, analyzeHandTiles } from '../../../utils/okeyRules';
import { 
  Sparkles, Layers, Volume2, VolumeX, Maximize2, LogOut, ArrowRight,
  CheckCircle2, AlertTriangle, ShieldAlert, FileText, Shuffle, RotateCcw,
  Star, Terminal, Send, Trophy, ChevronLeft, ChevronRight, X, Hand
} from 'lucide-react';
import { Socket } from 'socket.io-client';

const COLOR_NAMES_TR: Record<string, string> = {
  red: 'Kırmızı',
  black: 'Siyah',
  blue: 'Mavi',
  yellow: 'Sarı',
  fake: 'Sahte (Joker)',
};

interface OkeyGameProps {
  room: Room;
  myPlayer?: Player;
  socket: Socket;
  onRequestExit?: () => void;
}

export const OkeyGame: React.FC<OkeyGameProps> = ({
  room,
  myPlayer,
  socket,
  onRequestExit,
}) => {
  const [okeyState, setOkeyState] = useState<OkeyGameState | null>(room.okeyState || null);
  // Flexible 28-slot Matrix Rack (14 slots Upper Rail, 14 slots Lower Rail)
  const [rackSlots, setRackSlots] = useState<(OkeyTile | null)[]>(() => Array(28).fill(null));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [isDoubleModeActive, setIsDoubleModeActive] = useState<boolean>(false);
  const [actionWarning, setActionWarning] = useState<{
    title: string;
    message: string;
    type: 'error' | 'warning' | 'success';
    penalty?: number;
  } | null>(null);

  // Sync state from socket
  useEffect(() => {
    const handleStateUpdate = (newState: OkeyGameState) => {
      setOkeyState(newState);
    };

    const handleActionError = (data: { message: string; penalty?: number }) => {
      setActionWarning({
        title: 'KURAL İHLALİ & CEZA!',
        message: data.message,
        type: 'error',
        penalty: data.penalty,
      });
    };

    socket.on('okey_state_update', handleStateUpdate);
    socket.on('okey_action_error', handleActionError);

    return () => {
      socket.off('okey_state_update', handleStateUpdate);
      socket.off('okey_action_error', handleActionError);
    };
  }, [socket]);

  // Keep in sync if room.okeyState updates
  useEffect(() => {
    if (room.okeyState) {
      setOkeyState(room.okeyState);
    }
  }, [room.okeyState]);

  const myId = myPlayer?.id || socket.id;
  const isMyTurn = okeyState?.turnPlayerId === myId;
  const myHand: OkeyPlayerHand | undefined = okeyState?.playerHands[myId];

  // Placed tiles on rack
  const placedTiles = rackSlots.filter((t): t is OkeyTile => t !== null);
  const totalPlacedCount = placedTiles.length;
  const is15Tiles = totalPlacedCount >= 15;

  // Selected tile (if any)
  const selectedTile = selectedSlotIndex !== null ? rackSlots[selectedSlotIndex] : null;

  // Discard candidate: selected tile or default to the last non-null tile
  const discardCandidate = selectedTile || (is15Tiles ? placedTiles[placedTiles.length - 1] : null);

  // Sync rackSlots with server hand
  useEffect(() => {
    if (!myHand?.tiles) return;

    setRackSlots((prevSlots) => {
      const serverTiles = myHand.tiles;
      const serverTileMap = new Map(serverTiles.map(t => [t.id, t]));

      const prevNonNull = prevSlots.filter((t): t is OkeyTile => t !== null);
      const hasAnyExisting = prevNonNull.some(t => serverTileMap.has(t.id));

      // Brand new hand initialization (e.g. game start or fresh round)
      if (!hasAnyExisting && serverTiles.length > 0) {
        const newSlots: (OkeyTile | null)[] = Array(28).fill(null);
        // Distribute nicely: first 7 on upper rail (0..6), remaining on lower rail (14..20)
        const half = Math.min(7, serverTiles.length);
        serverTiles.slice(0, half).forEach((tile, idx) => {
          newSlots[idx] = tile;
        });
        serverTiles.slice(half).forEach((tile, idx) => {
          newSlots[14 + idx] = tile;
        });
        return newSlots;
      }

      // Existing hand incremental update:
      const newSlots = [...prevSlots];

      // 1. Remove tiles that are no longer in hand (e.g. discarded)
      for (let i = 0; i < newSlots.length; i++) {
        const t = newSlots[i];
        if (t && !serverTileMap.has(t.id)) {
          newSlots[i] = null;
        }
      }

      // 2. Add any newly drawn tiles not yet placed on rack
      const currentPlacedIds = new Set(newSlots.filter(Boolean).map(t => t!.id));
      const newlyDrawn = serverTiles.filter(t => !currentPlacedIds.has(t.id));

      newlyDrawn.forEach((tile) => {
        // Try to place in the first available empty slot
        const emptyIdx = newSlots.findIndex(s => s === null);
        if (emptyIdx !== -1) {
          newSlots[emptyIdx] = tile;
        } else if (newSlots.length < 28) {
          newSlots.push(tile);
        }
      });

      return newSlots;
    });
  }, [myHand?.tiles]);

  const indicator = okeyState?.indicatorTile || { id: 'ind', color: 'red', number: 8 };
  const okeyTile = okeyState?.okeyTile || { id: 'okey', color: 'red', number: 9 };
  const is101 = okeyState?.variant === '101' || room.settings?.gameMode === 'okey101';

  // Opponents list around the table
  const otherPlayers = room.players.filter(p => p.id !== myId);
  const topPlayer = otherPlayers[0];
  const leftPlayer = otherPlayers[1] || otherPlayers[0];
  const rightPlayer = otherPlayers[2] || otherPlayers[1] || otherPlayers[0];

  // Discard piles
  const leftPlayerPile = leftPlayer ? okeyState?.discardPiles[leftPlayer.id] : undefined;
  const leftLastDiscard = leftPlayerPile && leftPlayerPile.length > 0 
    ? leftPlayerPile[leftPlayerPile.length - 1] 
    : null;

  const rightPlayerPile = rightPlayer ? okeyState?.discardPiles[rightPlayer.id] : undefined;
  const rightLastDiscard = rightPlayerPile && rightPlayerPile.length > 0 
    ? rightPlayerPile[rightPlayerPile.length - 1] 
    : null;

  // Move or Swap tiles between two rack slots (0..27)
  const handleMoveOrSwapSlot = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || fromIdx >= 28 || toIdx < 0 || toIdx >= 28) {
      return;
    }

    setRackSlots((prev) => {
      const next = [...prev];
      const sourceTile = next[fromIdx];
      if (!sourceTile) return prev;

      const targetTile = next[toIdx];
      next[toIdx] = sourceTile;
      next[fromIdx] = targetTile; // if targetTile is null, source becomes null (pure move)! If occupied, swapped!

      // Emit new tile order to server
      const currentOrder = next.filter((t): t is OkeyTile => t !== null).map(t => t.id);
      socket.emit('okey_reorder_tiles', {
        roomId: room.id,
        tileIds: currentOrder,
      });

      return next;
    });

    setSelectedSlotIndex(null);
  };

  // Click handler for any slot on the rack
  const handleSlotClick = (slotIdx: number) => {
    const tileInSlot = rackSlots[slotIdx];

    // Case 1: Nothing currently selected
    if (selectedSlotIndex === null) {
      if (tileInSlot) {
        setSelectedSlotIndex(slotIdx);
      }
      return;
    }

    // Case 2: Clicked currently selected slot -> deselect
    if (selectedSlotIndex === slotIdx) {
      setSelectedSlotIndex(null);
      return;
    }

    // Case 3: A slot is selected, and clicked another slot -> move or swap!
    handleMoveOrSwapSlot(selectedSlotIndex, slotIdx);
  };

  const handleNudgeTile = (direction: 'left' | 'right') => {
    if (selectedSlotIndex === null) return;
    const targetIdx = direction === 'left' ? selectedSlotIndex - 1 : selectedSlotIndex + 1;
    if (targetIdx < 0 || targetIdx >= 28) return;

    handleMoveOrSwapSlot(selectedSlotIndex, targetIdx);
    setSelectedSlotIndex(targetIdx);
  };

  // Actions
  const handleDrawFromCenter = () => {
    if (!isMyTurn || is15Tiles) return;
    socket.emit('okey_draw_deck', { roomId: room.id });
  };

  const handleDrawFromLeft = () => {
    if (!isMyTurn || is15Tiles) return;
    socket.emit('okey_draw_left', { roomId: room.id });
  };

  const handleDiscardTile = (tileIdToDiscard?: string) => {
    const tileToDiscard = tileIdToDiscard 
      ? rackSlots.find(t => t && t.id === tileIdToDiscard)
      : discardCandidate;

    if (!tileToDiscard || !isMyTurn) return;

    socket.emit('okey_discard_tile', { roomId: room.id, tileId: tileToDiscard.id });
    setSelectedSlotIndex(null);
  };

  const handleSortSeries = () => {
    const nonNull = rackSlots.filter((t): t is OkeyTile => t !== null);
    if (nonNull.length === 0) return;

    const { matrixSlots, flatTiles } = sortTilesBySeries(nonNull, okeyTile);
    setRackSlots(matrixSlots);
    setSelectedSlotIndex(null);

    socket.emit('okey_reorder_tiles', {
      roomId: room.id,
      tileIds: flatTiles.map(t => t.id),
    });
  };

  const handleSortPairs = () => {
    const nonNull = rackSlots.filter((t): t is OkeyTile => t !== null);
    if (nonNull.length === 0) return;

    const { matrixSlots, flatTiles } = sortTilesByPairs(nonNull, okeyTile);
    setRackSlots(matrixSlots);
    setSelectedSlotIndex(null);

    socket.emit('okey_reorder_tiles', {
      roomId: room.id,
      tileIds: flatTiles.map(t => t.id),
    });
  };

  const handleTogglePairs = () => {
    const next = !isDoubleModeActive;
    setIsDoubleModeActive(next);
    socket.emit('okey_toggle_double', { roomId: room.id, isDouble: next });
  };

  const handleFinishHand = (isOkeyFinish = false) => {
    if (!isMyTurn) {
      setActionWarning({
        title: 'SIRA SENDE DEĞİL!',
        message: 'Masayı bitirmek veya el açmak için sıranızın gelmesini beklemelisiniz.',
        type: 'warning',
      });
      return;
    }

    const placed = rackSlots.filter((t): t is OkeyTile => t !== null);
    const tileToDiscard = discardCandidate || (placed.length === 15 ? placed[placed.length - 1] : null);

    // Client-side verification
    const validation = validateHandFinish(
      placed,
      tileToDiscard,
      okeyTile,
      is101,
      isOkeyFinish
    );

    if (!validation.valid) {
      setActionWarning({
        title: isOkeyFinish ? 'GEÇERSİZ OKEY BİTİRİŞİ!' : 'GEÇERSİZ BİTİRİŞ!',
        message: validation.reason || 'Taşlarınız Okey bitiş kurallarını sağlamıyor!',
        type: 'error',
        penalty: validation.penaltyPoints,
      });

      // Still notify server so the penalty is recorded in the table logs
      socket.emit('okey_finish_hand', {
        roomId: room.id,
        isOkeyFinish,
        discardTileId: tileToDiscard?.id,
      });
      return;
    }

    // Hand is completely valid!
    socket.emit('okey_finish_hand', {
      roomId: room.id,
      isOkeyFinish,
      discardTileId: tileToDiscard?.id,
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    socket.emit('send_message', { roomId: room.id, message: chatMessage.trim() });
    setChatMessage('');
  };

  const selectedTileObject = selectedSlotIndex !== null ? rackSlots[selectedSlotIndex] : null;

  const renderSlot = (slotIndex: number) => {
    const tile = rackSlots[slotIndex];
    const isOccupied = tile !== null;
    const isSelected = selectedSlotIndex === slotIndex;
    const isDragOver = dragOverSlotIndex === slotIndex;
    const isThisOkey = isOccupied && (
      (tile.color === okeyTile.color && tile.number === okeyTile.number) || tile.isFakeOkey
    );

    return (
      <div
        key={`slot-${slotIndex}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOverSlotIndex(slotIndex);
        }}
        onDragLeave={() => {
          if (dragOverSlotIndex === slotIndex) {
            setDragOverSlotIndex(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverSlotIndex(null);
          const sourceIdxStr = e.dataTransfer.getData('text/plain');
          const sourceIdx = sourceIdxStr !== '' ? parseInt(sourceIdxStr, 10) : draggedSlotIndex;
          if (sourceIdx !== null && !isNaN(sourceIdx)) {
            handleMoveOrSwapSlot(sourceIdx, slotIndex);
          }
        }}
        onClick={() => handleSlotClick(slotIndex)}
        className={`relative w-12 sm:w-14 md:w-16 h-11 sm:h-12 flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-150 select-none
          ${isDragOver ? 'ring-2 ring-cyan-400 bg-cyan-500/25 shadow-[0_0_20px_rgba(0,240,255,0.7)] scale-105 z-10' : ''}
          ${!isOccupied && selectedSlotIndex !== null ? 'hover:border-cyan-400/60 hover:bg-cyan-950/40 cursor-pointer' : ''}
        `}
      >
        {isOccupied ? (
          <OkeyTileView
            tile={tile}
            isOkey={isThisOkey}
            isSelected={isSelected}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', slotIndex.toString());
              e.dataTransfer.effectAllowed = 'move';
              setDraggedSlotIndex(slotIndex);
              setSelectedSlotIndex(slotIndex);
            }}
            onDragEnd={() => {
              setDraggedSlotIndex(null);
              setDragOverSlotIndex(null);
            }}
            onDoubleClick={() => {
              if (isMyTurn && is15Tiles) {
                handleDiscardTile(tile.id);
              }
            }}
          />
        ) : (
          /* Ray Oluk Yuvası (Gerçekçi Ahşap / Siber Oluk - BOŞ yazısı kaldırıldı) */
          <div
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all duration-150 relative
              bg-[#0b0e15]/80 border border-amber-900/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]
              ${selectedSlotIndex !== null ? 'group hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.25)]' : ''}
            `}
            title={selectedSlotIndex !== null ? 'Seçili taşı bu yuvaya yerleştirmek için tıkla' : 'Boş ray yuvası'}
          >
            {/* Ray oluk kanalı */}
            <div className="w-8 h-1 rounded-full bg-amber-500/10 group-hover:bg-cyan-400/30 transition-colors"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#07090e] text-[#dfe2ee] min-h-[calc(100vh-5rem)] flex flex-col p-2 sm:p-4">
      {/* Ambient background lights */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]"></div>
      <div className="pointer-events-none absolute top-1/3 -right-20 h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-[140px]"></div>
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-amber-500/10 blur-[120px]"></div>

      {/* 1. TOP GAME STATUS BAR & PROMINENT OKEY / GÖSTERGE STAND */}
      <section className="w-full grid grid-cols-12 gap-3 items-center bg-[#131822]/95 border border-white/10 backdrop-blur-xl px-4 py-3 rounded-3xl shadow-2xl z-20 shrink-0">
        {/* Arena Telemetry */}
        <div className="col-span-12 lg:col-span-3 flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2230] border border-white/10 shadow-sm">
            <span className="font-mono text-[10px] text-slate-400">ODA:</span>
            <span className="font-mono text-xs text-cyan-300 font-bold tracking-wider">#{room.id}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-400/50 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-display text-xs text-cyan-200 font-black uppercase tracking-wide">
              {is101 ? '🀄 101 OKEY' : '🪵 KLASİK OKEY'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2230] border border-white/10 shadow-sm">
            <span className="font-mono text-[10px] text-slate-400">TUR:</span>
            <span className="font-mono text-xs text-pink-400 font-bold">
              {okeyState?.roundNumber || 1} / {okeyState?.totalRounds || 10}
            </span>
          </div>
        </div>

        {/* PROMINENT CENTRAL GÖSTERGE & OKEY HOLOGRAM STAND */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center gap-2.5 sm:gap-4 py-1">
          {/* GÖSTERGE TAŞI */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900/90 to-amber-950/40 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <div className="flex flex-col text-right">
              <span className="font-mono text-[9px] text-amber-400 uppercase tracking-widest font-black flex items-center justify-end gap-1">
                <span>🧿</span> GÖSTERGE
              </span>
              <span className="font-display text-xs sm:text-sm text-white font-black uppercase mt-0.5">
                {COLOR_NAMES_TR[indicator.color] || indicator.color} {indicator.number}
              </span>
              <span className="text-[8px] font-mono text-amber-300/80 leading-tight">
                Masa Açılış Taşı
              </span>
            </div>
            <OkeyTileView tile={indicator} size="sm" isIndicator />
          </div>

          {/* DÖNÜŞÜM OKU */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-cyan-400 font-black text-sm sm:text-base animate-pulse">➔</span>
            <span className="text-[8px] font-mono font-black text-cyan-300 uppercase tracking-tighter whitespace-nowrap bg-cyan-500/20 px-1 py-0.2 rounded border border-cyan-400/40">
              +1 FAZLASI
            </span>
          </div>

          {/* BU TURUN OKEY TAŞI */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/25 via-sky-950/90 to-blue-950/50 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/40 relative">
            <OkeyTileView tile={okeyTile} size="sm" isOkey />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping"></span>
                <span className="font-display text-[10px] sm:text-xs text-cyan-300 font-black uppercase tracking-wider">
                  ★ BU TURUN OKEYİ ★
                </span>
              </div>
              <span className="font-display text-xs sm:text-sm text-white font-black uppercase mt-0.5">
                {COLOR_NAMES_TR[okeyTile.color] || okeyTile.color} {okeyTile.number}
              </span>
              <span className="text-[8px] font-mono text-cyan-200 leading-tight">
                JOKER (Her taş yerine geçer)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Modal Trigger */}
        <div className="col-span-12 lg:col-span-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowPenaltyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>CEZA LİSTESİ</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-[#1c2230] hover:bg-white/10 text-slate-300 transition-all cursor-pointer border border-white/10"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onRequestExit}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold uppercase border border-red-500/20 transition-all cursor-pointer"
          >
            AYRIL
          </button>
        </div>
      </section>

      {/* 2. ARENA & LOGS: SPLIT VIEWPORT */}
      <div className="w-full grid grid-cols-12 gap-3 flex-1 items-stretch mt-3">
        {/* ARENA MAIN BOARD (9 COLS) */}
        <div className="col-span-12 xl:col-span-9 flex flex-col justify-between rounded-3xl bg-[#0e131d]/90 border border-white/10 p-3 sm:p-5 relative shadow-2xl overflow-hidden backdrop-blur-md">
          {/* TOP PLAYER: Top opponent */}
          {topPlayer && (
            <div className="w-full flex justify-center z-10">
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#161c28]/95 border border-white/10 backdrop-blur-md shadow-lg">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                    {topPlayer.avatar || '👤'}
                  </div>
                  {okeyState?.turnPlayerId === topPlayer.id && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping ring-2 ring-[#161c28]"></span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-xs text-white">@{topPlayer.name}</span>
                    <span className="font-mono text-[9px] text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                      {okeyState?.playerHands[topPlayer.id]?.remainingTileCount || 14} Taş
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">{topPlayer.score || 0} Puan</span>
                    {okeyState?.turnPlayerId === topPlayer.id && (
                      <span className="font-mono text-[10px] text-amber-300 animate-pulse font-bold">• Sıra Onda</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MIDDLE ARENA LEVEL (Left Player, Center Felt Table/Deck/Indicator, Right Player) */}
          <div className="w-full flex items-center justify-between gap-3 my-auto z-10 px-1 sm:px-4">
            {/* LEFT PLAYER */}
            {leftPlayer && (
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#161c28]/95 border border-white/10 shadow-lg">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                      {leftPlayer.avatar || '👤'}
                    </div>
                    {okeyState?.turnPlayerId === leftPlayer.id && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-display font-bold text-xs text-white">@{leftPlayer.name}</span>
                    <span className="font-mono text-[10px] text-cyan-400">{leftPlayer.score || 0} Puan</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {okeyState?.playerHands[leftPlayer.id]?.remainingTileCount || 14} Taş
                    </span>
                  </div>
                </div>

                {/* Left Discard Drawer (Sol Çekilebilir Atık Yuvası) */}
                <div className="p-2.5 rounded-2xl bg-[#141a26] border border-cyan-500/40 flex items-center gap-2.5 shadow-lg">
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] text-cyan-300 font-black uppercase">SOL ATIK</span>
                    <button
                      type="button"
                      disabled={!isMyTurn || is15Tiles}
                      onClick={handleDrawFromLeft}
                      className="mt-1 px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-mono text-[9px] font-black uppercase transition-all shadow-sm cursor-pointer"
                    >
                      AL
                    </button>
                  </div>
                  {leftLastDiscard ? (
                    <OkeyTileView tile={leftLastDiscard} size="sm" />
                  ) : (
                    <div className="w-11 h-9 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-500 font-mono text-[8px]">
                      BOŞ
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CENTRAL OKEY FELT TABLE SURFACE (Authentic Green-Cyan Felt Mat, Deck & Indicator) */}
            <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-3xl bg-gradient-to-b from-[#062422]/95 via-[#07191d]/95 to-[#040e12]/95 border-2 border-emerald-500/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(16,185,129,0.15)] max-w-sm w-full mx-auto relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                <span className="font-mono text-[10px] text-emerald-300 tracking-widest uppercase font-black">
                  SİBER OKEY MASASI
                </span>
              </div>

              {/* Table Mat: Side-by-side Indicator & Okey Tile & Draw Deck */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                {/* 1. MASA GÖSTERGESİ (Surface Tile) */}
                <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-2xl bg-black/60 border border-amber-500/50 shadow-lg">
                  <span className="font-mono text-[8px] text-amber-300 font-black uppercase tracking-wider mb-1">
                    GÖSTERGE
                  </span>
                  <OkeyTileView tile={indicator} size="sm" isIndicator />
                  <span className="font-mono text-[8px] text-slate-300 mt-1 font-bold">
                    {COLOR_NAMES_TR[indicator.color]} {indicator.number}
                  </span>
                </div>

                {/* 2. TURUN OKEYİ (JOKER) */}
                <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-2xl bg-gradient-to-b from-cyan-950/80 via-blue-950/60 to-black/80 border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-300/40">
                  <span className="font-mono text-[8px] text-cyan-300 font-black uppercase tracking-wider mb-1 animate-pulse flex items-center gap-0.5">
                    ★ OKEY ★
                  </span>
                  <OkeyTileView tile={okeyTile} size="sm" isOkey />
                  <span className="font-mono text-[8px] text-cyan-200 mt-1 font-black">
                    {COLOR_NAMES_TR[okeyTile.color] || okeyTile.color} {okeyTile.number}
                  </span>
                </div>

                {/* 3. ORTA DESTE */}
                <div
                  onClick={handleDrawFromCenter}
                  className={`relative group cursor-pointer transition-all duration-200 flex flex-col items-center p-1.5 sm:p-2 rounded-2xl bg-black/60 border ${
                    isMyTurn && !is15Tiles ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95' : 'border-white/10 opacity-80'
                  }`}
                  title={isMyTurn && !is15Tiles ? 'Desteden yeni bir taş çek' : 'Sıranızı bekleyin'}
                >
                  <span className="font-mono text-[8px] text-cyan-300 font-black uppercase tracking-wider mb-1">
                    ORTA DESTE
                  </span>
                  <div className="w-16 sm:w-18 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-[#1c2430] via-[#121824] to-[#0a0f18] border border-cyan-400/40 flex items-center justify-center shadow-md">
                    <Layers className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                    <span className="font-display text-base sm:text-lg font-black text-white">
                      {okeyState?.centerDeckRemaining ?? 0}
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono mt-1 font-bold ${isMyTurn && !is15Tiles ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                    {isMyTurn && !is15Tiles ? '👆 TAŞ ÇEK' : 'KİLİTLİ'}
                  </span>
                </div>
              </div>

              <div className="w-full flex items-center justify-between px-2 mt-3 pt-2 border-t border-white/10">
                <span className="font-mono text-[9px] text-slate-400">
                  {is101 ? '101 Katlamalı' : 'Klasik Düz'}
                </span>
                <span className="font-mono text-[9px] text-cyan-400 font-bold">
                  Kalan: {okeyState?.centerDeckRemaining ?? 0} Taş
                </span>
              </div>
            </div>

            {/* RIGHT PLAYER */}
            {rightPlayer && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#161c28]/95 border border-white/10 shadow-lg">
                  <div className="flex flex-col text-right">
                    <span className="font-display font-bold text-xs text-white">@{rightPlayer.name}</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">{rightPlayer.score || 0} Puan</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {okeyState?.playerHands[rightPlayer.id]?.remainingTileCount || 14} Taş
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                      {rightPlayer.avatar || '👤'}
                    </div>
                    {okeyState?.turnPlayerId === rightPlayer.id && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                  </div>
                </div>

                {/* Right Waste Discard Slot */}
                <div
                  onDragOver={(e) => {
                    if (isMyTurn && is15Tiles) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!isMyTurn || !is15Tiles) return;
                    const sourceIdxStr = e.dataTransfer.getData('text/plain');
                    const sourceIdx = sourceIdxStr !== '' ? parseInt(sourceIdxStr, 10) : draggedSlotIndex;
                    if (sourceIdx !== null && !isNaN(sourceIdx)) {
                      const tile = rackSlots[sourceIdx];
                      if (tile) {
                        handleDiscardTile(tile.id);
                      }
                    }
                  }}
                  className={`p-2.5 rounded-2xl bg-[#141a26] border flex items-center gap-2.5 shadow-lg transition-all ${
                    isMyTurn && is15Tiles
                      ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                      : 'border-white/10'
                  }`}
                >
                  {rightLastDiscard ? (
                    <OkeyTileView tile={rightLastDiscard} size="sm" />
                  ) : (
                    <div className={`w-11 h-9 rounded-lg border border-dashed flex items-center justify-center font-mono text-[8px] ${
                      isMyTurn && is15Tiles ? 'border-amber-400/60 text-amber-300 bg-amber-500/10' : 'border-white/20 text-slate-500 bg-white/5'
                    }`}>
                      {isMyTurn && is15Tiles ? 'BURAYA AT' : 'ATIK YOK'}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[8px] text-slate-400 uppercase font-black">SAĞ ATIK</span>
                    <span className="font-mono text-[9px] text-slate-200">
                      {rightLastDiscard ? `${COLOR_NAMES_TR[rightLastDiscard.color] || rightLastDiscard.color} ${rightLastDiscard.number}` : (isMyTurn && is15Tiles ? 'Taşı sürükle & bırak' : 'Atık Yok')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. BOTTOM USER HUD & ÇİFT KATLI NEON SİBERPUNK ISTAKA */}
          <div className="w-full flex flex-col gap-2 z-20 mt-2">
            {/* Turn Status Notice */}
            <div className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-[#161c28]/95 border border-white/10 shadow-md">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`}></span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  {isMyTurn ? (is15Tiles ? '15. TAŞINI SAĞA AT VEYA ELİNİ AÇ / BİTİR!' : 'SIRA SENDE! DESTEDEN VEYA SOLDAN TAŞ ÇEK') : 'DİĞER OYUNCUNUN HAMLESİ BEKLENİYOR...'}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                <span>⏱️ 30s</span>
              </div>
            </div>

            {/* TILE SWAP & REORDER TOOLBAR (Oyuncunun Taşlarını Serbestçe Düzenleme Çubuğu) */}
            {selectedTileObject && (
              <div className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="font-mono font-bold text-cyan-200">
                    Seçili Taş: <span className="font-black text-white">{COLOR_NAMES_TR[selectedTileObject.color] || selectedTileObject.color} {selectedTileObject.number}</span>
                  </span>
                  <span className="text-[10px] text-cyan-300/80 hidden sm:inline">
                    (Taşımak için boş yuvaya veya yer değiştirmek için başka taşa tıklayın)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNudgeTile('left')}
                    className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-0.5 border border-cyan-400/30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" /> Sola Kaydır
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudgeTile('right')}
                    className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-0.5 border border-cyan-400/30 cursor-pointer"
                  >
                    Sağa Kaydır <ChevronRight className="w-3 h-3" />
                  </button>
                  {isMyTurn && is15Tiles && (
                    <button
                      type="button"
                      onClick={() => handleDiscardTile(selectedTileObject.id)}
                      className="px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1 border border-amber-400/50 cursor-pointer"
                    >
                      Bu Taşı At
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIndex(null)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                    title="Seçimi İptal Et"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ÇİFT KATLI ÖZGÜR SİBERPUNK ISTAKA (28 YUVA) */}
            <div className="w-full rounded-3xl bg-gradient-to-b from-[#1c1410] via-[#120f12] to-[#0a0c10] border-2 border-amber-900/60 shadow-[0_0_40px_rgba(0,0,0,0.85)] ring-2 ring-amber-500/30 p-3 sm:p-4 relative overflow-hidden backdrop-blur-xl">
              {/* Istaka Sol ve Sağ Kenarlıklar */}
              <div className="absolute -left-1 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-500/50 via-[#262a33] to-transparent rounded-l border-r border-amber-400/30 pointer-events-none"></div>
              <div className="absolute -right-1 top-0 bottom-0 w-3 bg-gradient-to-l from-cyan-500/50 via-[#262a33] to-transparent rounded-r border-l border-cyan-400/30 pointer-events-none"></div>

              {/* Istaka Üst Başlık & Telemetri */}
              <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10 mb-3">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
                  <span className="font-mono text-xs text-amber-400 font-black uppercase tracking-widest">
                    SİBER TÜRK OKEY ISTAKASI
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                    ÖZGÜR MATRİS [{totalPlacedCount} / 28 YUVA]
                  </span>
                  {is15Tiles && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 font-mono text-[9px] font-black border border-amber-500/50 animate-pulse">
                      15 TAŞ - BİRİNİ AT VEYA BİTİR
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400 text-[10px] hidden sm:inline">
                    💡 İstediğiniz taşı sürükleyip boş yuvaya bırakın veya tıklayarak yer değiştirin
                  </span>
                </div>
              </div>

              {/* ISTAKA RAFLARI (ÜST KAT & ALT KAT - ESNEK IZGARA) */}
              <div className="flex flex-col gap-2.5">
                {/* ÜST RAY (0..13) */}
                <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#181214] via-[#0e0f14] to-[#07080c] border-b-4 border-b-amber-950/90 shadow-inner px-2.5 py-2 flex items-end gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none"></div>
                  {Array.from({ length: 14 }).map((_, idx) => renderSlot(idx))}
                </div>

                {/* ALT RAY (14..27) */}
                <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#181214] via-[#0e0f14] to-[#07080c] border-b-4 border-b-amber-950/90 shadow-inner px-2.5 py-2 flex items-end gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none"></div>
                  {Array.from({ length: 14 }).map((_, idx) => renderSlot(14 + idx))}
                </div>
              </div>
            </div>

            {/* 4. AKSİYON BUTONLARI HUD */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSortSeries}
                  className="px-3.5 py-2 rounded-xl bg-[#1c2230] hover:bg-[#252e42] border border-cyan-400/30 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Taşları renklere ve 1,2,3 serilerine göre diz"
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SERİ DİZ</span>
                </button>

                <button
                  type="button"
                  onClick={handleSortPairs}
                  className="px-3.5 py-2 rounded-xl bg-[#1c2230] hover:bg-[#252e42] border border-pink-400/30 text-pink-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Taşları çiftlere göre diz"
                >
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  <span>ÇİFT DİZ</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePairs}
                  className={`px-3.5 py-2 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDoubleModeActive
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                      : 'bg-[#1c2230] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isDoubleModeActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span>ÇİFTE GİT</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onDragOver={(e) => {
                    if (isMyTurn && is15Tiles) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!isMyTurn || !is15Tiles) return;
                    const sourceIdxStr = e.dataTransfer.getData('text/plain');
                    const sourceIdx = sourceIdxStr !== '' ? parseInt(sourceIdxStr, 10) : draggedSlotIndex;
                    if (sourceIdx !== null && !isNaN(sourceIdx)) {
                      const tile = rackSlots[sourceIdx];
                      if (tile) {
                        handleDiscardTile(tile.id);
                      }
                    }
                  }}
                  onClick={() => handleDiscardTile()}
                  disabled={!isMyTurn || !discardCandidate || !is15Tiles}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>TAŞ AT ({discardCandidate ? `${COLOR_NAMES_TR[discardCandidate.color] || discardCandidate.color} ${discardCandidate.number}` : 'SEÇİLİ'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishHand(false)}
                  disabled={!isMyTurn}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>BİTİR &amp; ELİ AÇ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishHand(true)}
                  disabled={!isMyTurn}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(236,72,153,0.45)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-current text-white" />
                  <span>OKEY AT (+400)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR HUD (3 COLS): SKOR TABLOSU & CANLI FEED */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-3">
          {/* SKOR TABLOSU */}
          <div className="w-full rounded-3xl bg-[#0e131d]/90 border border-white/10 p-4 flex flex-col gap-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-black text-xs tracking-wider uppercase text-white">
                  CANLI SKOR TABLOSU
                </h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                TUR {okeyState?.roundNumber || 1}/{okeyState?.totalRounds || 10}
              </span>
            </div>

            <div className="space-y-2">
              {room.players.map((p, idx) => {
                const isMe = p.id === myId;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-2xl flex items-center justify-between border transition-all ${
                      isMe
                        ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-[#161c28] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-slate-400">#{idx + 1}</span>
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-white">@{p.name}</span>
                          {isMe && (
                            <span className="text-[9px] font-mono bg-cyan-400 text-slate-950 px-1 rounded font-black">
                              SEN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.okeyHandPoints ? `${p.okeyHandPoints} El Puanı` : 'Aktif'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-cyan-300">
                      {p.score || 0} P
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CANLI MASA OYUN LOGU & CHAT */}
          <div className="w-full flex-1 rounded-3xl bg-[#0e131d]/90 border border-white/10 p-4 flex flex-col justify-between shadow-xl backdrop-blur-md min-h-[300px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-pink-400" />
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-white">
                    OYUN LOGU &amp; CHAT
                  </h4>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              {/* Chat Messages */}
              <div className="flex flex-col gap-2 mt-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 text-left">
                {room.chat.slice(-8).map((msg) => (
                  <div key={msg.id} className="text-xs p-2 rounded-xl bg-[#161c28]/90 border border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-bold text-cyan-300">@{msg.senderName}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Form */}
            <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Masaya mesaj yaz..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#161c28] border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition-all"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Ceza Listesi Modalı */}
      <OkeyPenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        variant={okeyState?.variant || (is101 ? '101' : 'classic')}
        penaltyHistory={okeyState?.penaltyList || []}
      />

      {/* Kural İhlali / Geçersiz Bitiş Uyarı Modalı */}
      {actionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-[#180e15] to-[#0d0914] border-2 border-red-500/70 shadow-[0_0_50px_rgba(239,68,68,0.4)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              ⚠️
            </div>

            <h3 className="font-display font-black text-xl text-red-400 uppercase tracking-tight">
              {actionWarning.title}
            </h3>

            <p className="text-sm text-slate-200 mt-2 font-medium leading-relaxed">
              {actionWarning.message}
            </p>

            {actionWarning.penalty !== undefined && actionWarning.penalty !== 0 && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 font-mono text-xs font-bold text-red-300">
                🛑 Sisteme İşlenen Ceza: <span className="font-black text-white">{actionWarning.penalty > 0 ? `+${actionWarning.penalty}` : actionWarning.penalty} Ceza Puanı</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActionWarning(null)}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
            >
              ANLADIM, ISTAKAYI DÜZENLE
            </button>
          </div>
        </div>
      )}

      {/* Tur Sonu / Kazanan Modalı */}
      {okeyState?.status === 'round_end' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0e1628] via-[#09101d] to-[#040810] border-2 border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.4)] text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center mx-auto mb-4 text-4xl shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              🏆
            </div>

            <span className="font-mono text-xs text-amber-400 font-black uppercase tracking-widest">
              TUR TAMAMLANDI!
            </span>

            <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mt-1">
              {room.players.find(p => p.id === okeyState.winnerPlayerId)?.name || 'Bir Oyuncu'} Masayı Kazandı!
            </h2>

            <p className="text-sm font-mono text-cyan-300 font-bold mt-2">
              {okeyState.winnerReason || 'Tebrikler! Eli başarıyla tamamladı.'}
            </p>

            {/* Skor Sıralaması */}
            <div className="mt-6 flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {room.players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl flex items-center justify-between border ${
                    p.id === okeyState.winnerPlayerId
                      ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-400">#{idx + 1}</span>
                    <span>@{p.name}</span>
                    {p.id === okeyState.winnerPlayerId && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                        KAZANAN
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {p.score || 0} Puan
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {myPlayer?.isHost ? (
                <button
                  type="button"
                  onClick={() => socket.emit('okey_return_to_lobby', { roomId: room.id })}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                >
                  LOBİYE DÖN / YENİ TUR BAŞLAT
                </button>
              ) : (
                <div className="flex-1 py-2 text-center text-xs font-mono text-slate-400">
                  Oda kurucusunun yeni tur başlatması bekleniyor...
                </div>
              )}

              <button
                type="button"
                onClick={onRequestExit}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
