import { OkeyTile, OkeyColor, OkeyGameState, OkeyGameVariant, OkeyPlayerHand, Room } from '@/src/types';
import { Server } from 'socket.io';
import { validateHandFinish, analyzeHandTiles, isWildOkey, getEffectiveTileInfo } from '../../../src/utils/okeyRules';
import { sortTilesBySeries as smartSortSeries, sortTilesByPairs as smartSortPairs } from '../../../src/utils/okeySorting';

export { validateHandFinish, analyzeHandTiles, isWildOkey, getEffectiveTileInfo };

const COLORS: OkeyColor[] = ['red', 'black', 'blue', 'yellow'];

/**
 * Creates full 106 Okey tile deck:
 * 2 sets of 4 colors x 1-13 (104 tiles) + 2 fake okey tiles = 106 tiles
 */
export function createOkeyDeck(): OkeyTile[] {
  const deck: OkeyTile[] = [];
  let idCounter = 1;

  for (let set = 1; set <= 2; set++) {
    for (const color of COLORS) {
      for (let num = 1; num <= 13; num++) {
        deck.push({
          id: `tile-${color}-${num}-${set}-${idCounter++}`,
          color,
          number: num,
          isFakeOkey: false,
        });
      }
    }
  }

  // 2 Fake Okey (Sahte Okey) tiles
  deck.push({
    id: `tile-fake-1-${idCounter++}`,
    color: 'fake',
    number: 0,
    isFakeOkey: true,
  });
  deck.push({
    id: `tile-fake-2-${idCounter++}`,
    color: 'fake',
    number: 0,
    isFakeOkey: true,
  });

  // Multi-pass Fisher-Yates shuffle for true entropy and scrambling
  for (let pass = 0; pass < 3; pass++) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  return deck;
}

export function determineOkeyTile(indicator: OkeyTile): OkeyTile {
  if (indicator.isFakeOkey) {
    return {
      id: 'okey-resolved-red-1',
      color: 'red',
      number: 1,
      isRealOkey: true,
    };
  }
  const okeyNumber = indicator.number === 13 ? 1 : indicator.number + 1;
  return {
    id: `okey-resolved-${indicator.color}-${okeyNumber}`,
    color: indicator.color,
    number: okeyNumber,
    isRealOkey: true,
  };
}

export function sortTilesBySeries(tiles: OkeyTile[], okeyTile: OkeyTile): OkeyTile[] {
  return smartSortSeries(tiles, okeyTile).flatTiles;
}

export function sortTilesByPairs(tiles: OkeyTile[]): OkeyTile[] {
  return smartSortPairs(tiles).flatTiles;
}

export function initOkeyGame(
  room: Room,
  io: Server,
  variant: OkeyGameVariant = '101'
) {
  const deck = createOkeyDeck();

  // Pick an authentic indicator tile (cannot be fake okey)
  let indicatorIndex = Math.floor(Math.random() * (deck.length - 30));
  while (deck[indicatorIndex].isFakeOkey) {
    indicatorIndex = (indicatorIndex + 1) % deck.length;
  }
  const [indicatorTile] = deck.splice(indicatorIndex, 1);
  const okeyTile = determineOkeyTile(indicatorTile);

  const players = room.players;
  const turnPlayerId = players[0]?.id || '';

  // Deal tiles: Turn player gets 15 tiles (in Classic/101 starting hand), others get 14 tiles
  // IMPORTANT: Tiles are dealt completely RANDOM (NO auto-sorting). Players organize their own rack!
  const playerHands: Record<string, any> = {};
  const discardPiles: Record<string, OkeyTile[]> = {};
  const isDoubleMode: Record<string, boolean> = {};

  players.forEach((p, idx) => {
    const tileCount = idx === 0 ? 15 : 14;
    // Pure random deal without sorting
    const handTiles = deck.splice(0, tileCount);
    playerHands[p.id] = {
      playerId: p.id,
      tiles: handTiles,
      openedMelds: [],
      hasOpened: false,
      hasOpenedPairs: false,
      handTotalPoints: 0,
      remainingTileCount: handTiles.length,
      lastDiscardedTile: null,
    };
    discardPiles[p.id] = [];
    isDoubleMode[p.id] = false;
  });

  const okeyState: OkeyGameState = {
    variant,
    roundNumber: (room.currentRound || 0) + 1,
    totalRounds: room.settings.rounds || 10,
    turnPlayerId,
    turnTimeLeft: 30,
    indicatorTile,
    okeyTile,
    deckCount: deck.length,
    centerDeckRemaining: deck.length,
    remainingDeck: deck,
    discardPiles,
    playerHands,
    penaltyList: [
      {
        id: 'rule-pen-1',
        playerName: 'SİSTEM KURALI',
        playerId: 'sys',
        reason: variant === '101' ? 'Yanlış / Yetkisiz Taş İşleme Cezası (+101 Puan)' : 'Yere Yanlış Taş İşleme Cezası (-100 Puan)',
        points: variant === '101' ? 101 : -100,
        timestamp: Date.now(),
      },
      {
        id: 'rule-pen-2',
        playerName: 'SİSTEM KURALI',
        playerId: 'sys',
        reason: variant === '101' ? 'İşlekten Taş Çekip Açamama Cezası (+101 Puan)' : 'Göstergeyi Zamanında Bildirmeme Cezası (-20 Puan)',
        points: variant === '101' ? 101 : -20,
        timestamp: Date.now(),
      },
    ],
    isDoubleMode,
    status: 'playing',
    tableMelds: [],
  };

  room.okeyState = okeyState;
  room.phase = 'okey_playing';
  room.currentRound = okeyState.roundNumber;

  emitOkeyUpdate(room.id, room, io);
}

export function emitOkeyUpdate(roomId: string, room: Room, io: Server) {
  if (!room.okeyState) return;

  // Send state to room. For privacy, each player only sees their own hand tiles,
  // while other players only see tile counts and opened melds.
  room.players.forEach(p => {
    const playerSocket = io.sockets.sockets.get(p.id);
    if (!playerSocket) return;

    const sanitizedHands: Record<string, OkeyPlayerHand> = {};
    Object.entries(room.okeyState!.playerHands).forEach(([pid, hand]) => {
      const playerHand = hand as OkeyPlayerHand;
      if (pid === p.id) {
        sanitizedHands[pid] = playerHand;
      } else {
        sanitizedHands[pid] = {
          playerId: playerHand.playerId,
          tiles: [], // hidden
          remainingTileCount: playerHand.tiles.length,
          openedMelds: playerHand.openedMelds || [],
          hasOpened: playerHand.hasOpened,
          hasOpenedPairs: playerHand.hasOpenedPairs,
          lastDiscardedTile: playerHand.lastDiscardedTile,
        };
      }
    });

    const sanitizedState: OkeyGameState = {
      ...room.okeyState!,
      playerHands: sanitizedHands,
    };

    playerSocket.emit('okey_state_update', sanitizedState);
  });

  io.to(roomId).emit('room_update', room);
}
