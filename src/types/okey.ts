export type OkeyColor = 'red' | 'black' | 'blue' | 'yellow';

export interface OkeyTile {
  id: string;
  color: OkeyColor | 'fake';
  number: number; // 1-13, or 0 for fake okey
  isFakeOkey?: boolean;
  isRealOkey?: boolean;
}

export type OkeyGameVariant = '101' | 'classic';

export interface OkeyPenalty {
  id: string;
  playerName: string;
  playerId: string;
  reason: string;
  points: number; // e.g. +101 in 101 Okey, or -20/-100 in Classic
  timestamp: number;
}

export interface OkeyPlayerHand {
  playerId: string;
  tiles: OkeyTile[]; // Rack tiles
  openedMelds?: OkeyTile[][]; // 101 Okey opened series/groups
  hasOpened?: boolean; // In 101, whether player reached 101 points or 5 pairs
  hasOpenedPairs?: boolean;
  handTotalPoints?: number;
  remainingTileCount: number;
  lastDiscardedTile?: OkeyTile | null;
}

export interface OkeyGameState {
  variant: OkeyGameVariant; // '101' | 'classic'
  roundNumber: number;
  totalRounds: number;
  turnPlayerId: string;
  turnTimeLeft: number;
  indicatorTile: OkeyTile; // Gösterge
  okeyTile: OkeyTile; // Actual Okey tile (indicator + 1 of same color)
  deckCount: number;
  centerDeckRemaining: number;
  remainingDeck?: OkeyTile[];
  discardPiles: Record<string, OkeyTile[]>; // playerId -> discarded tiles (last one is on top)
  playerHands: Record<string, OkeyPlayerHand>; // Sanitized per player or full for spectator
  penaltyList: OkeyPenalty[];
  winnerPlayerId?: string | null;
  winnerReason?: string | null;
  isDoubleMode?: Record<string, boolean>; // playerId -> çifte gitme aktif
  status: 'playing' | 'round_end' | 'game_over';
  tableMelds?: { playerId: string; meldId: string; tiles: OkeyTile[] }[]; // 101 Okey table opened melds
}
