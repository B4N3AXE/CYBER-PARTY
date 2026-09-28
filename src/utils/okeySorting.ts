import { OkeyTile } from '../types/okey';
import { analyzeHandTiles, getEffectiveTileInfo, isWildOkey } from './okeyRules';

const COLOR_ORDER: Record<string, number> = {
  red: 0,
  blue: 1,
  black: 2,
  yellow: 3,
  fake: 4,
};

/**
 * Intelligent Series Sorting (Akıllı Seri Diz):
 * Detects real Okey melds (runs e.g. 5-6-7 and sets e.g. 8-8-8), groups each meld's
 * tiles together, and places loose tiles at the end ordered by color and number.
 */
export function sortTilesBySeries(tiles: OkeyTile[], okeyTile?: OkeyTile): {
  flatTiles: OkeyTile[];
  matrixSlots: (OkeyTile | null)[];
} {
  const analysis = analyzeHandTiles(tiles, okeyTile);
  const matrix: (OkeyTile | null)[] = Array(28).fill(null);
  const flat: OkeyTile[] = [];

  let currentSlot = 0;

  // 1. Place discovered valid melds first
  analysis.validMelds.forEach((meld) => {
    // Check if meld fits in current row, otherwise wrap to next rail if needed
    const fitsInTopRow = currentSlot < 14 && (currentSlot + meld.length <= 14);
    const inBottomRow = currentSlot >= 14;

    if (currentSlot < 14 && !fitsInTopRow) {
      // Jump to bottom row
      currentSlot = 14;
    }

    meld.forEach((tile) => {
      if (currentSlot < 28) {
        matrix[currentSlot] = tile;
        currentSlot++;
      }
      flat.push(tile);
    });

    // Add a 1-slot visual gap between distinct melds if within bounds
    if (currentSlot < 28 && currentSlot % 14 !== 0) {
      currentSlot++;
    }
  });

  // 2. Sort unmatched loose tiles by color and number
  const sortedUnmatched = [...analysis.unmatchedTiles].sort((a, b) => {
    const isA = isWildOkey(a, okeyTile);
    const isB = isWildOkey(b, okeyTile);
    if (isA && !isB) return 1;
    if (!isA && isB) return -1;

    const infoA = getEffectiveTileInfo(a, okeyTile);
    const infoB = getEffectiveTileInfo(b, okeyTile);
    if (infoA.color !== infoB.color) {
      return (COLOR_ORDER[infoA.color] ?? 9) - (COLOR_ORDER[infoB.color] ?? 9);
    }
    return infoA.number - infoB.number;
  });

  sortedUnmatched.forEach((tile) => {
    while (currentSlot < 28 && matrix[currentSlot] !== null) {
      currentSlot++;
    }
    if (currentSlot < 28) {
      matrix[currentSlot] = tile;
      currentSlot++;
    }
    flat.push(tile);
  });

  return { flatTiles: flat, matrixSlots: matrix };
}

/**
 * Intelligent Pairs Sorting (Akıllı Çift Diz):
 * Detects identical pairs (matching number and color), places each pair with a 1-slot
 * gap between pairs, and puts loose tiles at the end.
 */
export function sortTilesByPairs(tiles: OkeyTile[], okeyTile?: OkeyTile): {
  flatTiles: OkeyTile[];
  matrixSlots: (OkeyTile | null)[];
} {
  const analysis = analyzeHandTiles(tiles, okeyTile);
  const matrix: (OkeyTile | null)[] = Array(28).fill(null);
  const flat: OkeyTile[] = [];

  let currentSlot = 0;

  // 1. Place pairs side-by-side with a 1-slot gap
  analysis.validPairs.forEach(([tileA, tileB]) => {
    if (currentSlot % 14 === 13) {
      // Don't split pair across rails
      currentSlot++;
    }

    if (currentSlot < 28) {
      matrix[currentSlot] = tileA;
      currentSlot++;
    }
    if (currentSlot < 28) {
      matrix[currentSlot] = tileB;
      currentSlot++;
    }
    flat.push(tileA, tileB);

    // 1-slot gap after pair
    if (currentSlot < 28 && currentSlot % 14 !== 0) {
      currentSlot++;
    }
  });

  // 2. Identify remaining single tiles not in pairs
  const pairedIds = new Set<string>();
  analysis.validPairs.forEach(([a, b]) => {
    pairedIds.add(a.id);
    pairedIds.add(b.id);
  });

  const looseTiles = tiles.filter(t => !pairedIds.has(t.id)).sort((a, b) => {
    const infoA = getEffectiveTileInfo(a, okeyTile);
    const infoB = getEffectiveTileInfo(b, okeyTile);
    if (infoA.number !== infoB.number) return infoA.number - infoB.number;
    return (COLOR_ORDER[infoA.color] ?? 9) - (COLOR_ORDER[infoB.color] ?? 9);
  });

  looseTiles.forEach((tile) => {
    while (currentSlot < 28 && matrix[currentSlot] !== null) {
      currentSlot++;
    }
    if (currentSlot < 28) {
      matrix[currentSlot] = tile;
      currentSlot++;
    }
    flat.push(tile);
  });

  return { flatTiles: flat, matrixSlots: matrix };
}
