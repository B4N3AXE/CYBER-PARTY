import { OkeyTile, OkeyColor } from '../types/okey';

/**
 * Returns whether a tile acts as a Wild Okey (the true joker of the round)
 */
export function isWildOkey(tile: OkeyTile, okeyTile?: OkeyTile): boolean {
  if (!tile) return false;
  if (tile.isRealOkey) return true;
  if (okeyTile && tile.color === okeyTile.color && tile.number === okeyTile.number && !tile.isFakeOkey) {
    return true;
  }
  return false;
}

/**
 * Returns the effective color & number of a tile:
 * - Fake Okey takes the identity of the tile that became the real Okey!
 */
export function getEffectiveTileInfo(tile: OkeyTile, okeyTile?: OkeyTile): { color: OkeyColor; number: number; isWild: boolean } {
  if (isWildOkey(tile, okeyTile)) {
    return { color: tile.color === 'fake' ? 'red' : tile.color, number: tile.number, isWild: true };
  }
  if (tile.isFakeOkey) {
    // Fake Okey acts as the real Okey's original value
    const originalColor = okeyTile ? okeyTile.color : 'red';
    const originalNum = okeyTile ? okeyTile.number : 1;
    return { color: originalColor as OkeyColor, number: originalNum, isWild: false };
  }
  return { color: tile.color as OkeyColor, number: tile.number, isWild: false };
}

/**
 * Validates a Run / Düz Seri (e.g. Red 4-5-6 or Black 11-12-13-1)
 * Minimum 3 tiles, same color, consecutive numbers. Wildcards can fill gaps.
 */
export function isValidRun(tiles: OkeyTile[], okeyTile?: OkeyTile): boolean {
  if (tiles.length < 3 || tiles.length > 13) return false;

  let fixedColor: OkeyColor | null = null;
  const processed: { original: OkeyTile; num: number; isWild: boolean }[] = [];

  for (const t of tiles) {
    const info = getEffectiveTileInfo(t, okeyTile);
    if (!info.isWild) {
      if (fixedColor === null) {
        fixedColor = info.color;
      } else if (fixedColor !== info.color) {
        return false; // All non-wildcards in a run must be the same color
      }
      processed.push({ original: t, num: info.number, isWild: false });
    } else {
      processed.push({ original: t, num: 0, isWild: true });
    }
  }

  // If all are wildcards (rare edge case), it's valid
  if (fixedColor === null) return true;

  // Test standard consecutive run:
  // Find first non-wild tile and check if the sequence can match with wilds
  // Also handle wrap-around 12-13-1 where 1 is placed at the end after 13
  const checkSequence = (expectedNums: number[]): boolean => {
    let wildCount = processed.filter(p => p.isWild).length;
    const nonWilds = processed.filter(p => !p.isWild);

    // Ensure non-wilds appear in matching relative positions
    let lastIndexInPattern = -1;
    for (const nw of nonWilds) {
      const idx = expectedNums.indexOf(nw.num, lastIndexInPattern + 1);
      if (idx === -1) return false;
      lastIndexInPattern = idx;
    }
    return true;
  };

  // Find minimum non-wild tile number to detect run start
  const nonWildNums = processed.filter(p => !p.isWild).map(p => p.num);
  const firstNonWild = processed.find(p => !p.isWild);
  if (!firstNonWild) return true;

  const firstIdx = processed.indexOf(firstNonWild);
  const startCandidate = firstNonWild.num - firstIdx;

  if (startCandidate >= 1 && startCandidate + tiles.length - 1 <= 13) {
    const normalPattern = Array.from({ length: tiles.length }, (_, i) => startCandidate + i);
    let ok = true;
    for (let i = 0; i < tiles.length; i++) {
      if (!processed[i].isWild && processed[i].num !== normalPattern[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  // Check 12-13-1 wrap around (e.g. 11-12-13-1 or 12-13-1)
  // In Okey, 1 can only follow 13 at the end of a run (1 cannot be followed by 2 in 13-1-2)
  const isWrapPossible = nonWildNums.includes(1) && (nonWildNums.includes(13) || nonWildNums.includes(12));
  if (isWrapPossible) {
    const wrapPatterns = [
      [11, 12, 13, 1],
      [12, 13, 1],
      [10, 11, 12, 13, 1],
    ];
    for (const pat of wrapPatterns) {
      if (pat.length === tiles.length) {
        let matches = true;
        for (let i = 0; i < tiles.length; i++) {
          if (!processed[i].isWild && processed[i].num !== pat[i]) {
            matches = false;
            break;
          }
        }
        if (matches) return true;
      }
    }
  }

  return false;
}

/**
 * Validates a Set / Grup Seri (e.g. Red 7, Blue 7, Yellow 7)
 * 3 or 4 tiles, same number, all different colors. Wildcards can fill missing colors.
 */
export function isValidSet(tiles: OkeyTile[], okeyTile?: OkeyTile): boolean {
  if (tiles.length < 3 || tiles.length > 4) return false;

  let fixedNum: number | null = null;
  const colorsUsed = new Set<OkeyColor>();
  let wildCount = 0;

  for (const t of tiles) {
    const info = getEffectiveTileInfo(t, okeyTile);
    if (info.isWild) {
      wildCount++;
    } else {
      if (fixedNum === null) {
        fixedNum = info.number;
      } else if (fixedNum !== info.number) {
        return false; // Numbers must all be the same
      }
      if (colorsUsed.has(info.color)) {
        return false; // Cannot have duplicate colors in a set
      }
      colorsUsed.add(info.color);
    }
  }

  return colorsUsed.size + wildCount === tiles.length && (colorsUsed.size + wildCount <= 4);
}

/**
 * Validates a single meld (either a valid Run or a valid Set)
 */
export function isValidMeld(tiles: OkeyTile[], okeyTile?: OkeyTile): boolean {
  return isValidRun(tiles, okeyTile) || isValidSet(tiles, okeyTile);
}

/**
 * Validates whether two tiles form a valid Pair (Çift)
 * Same color + same number, or one is a wildcard
 */
export function isValidPair(tileA: OkeyTile, tileB: OkeyTile, okeyTile?: OkeyTile): boolean {
  const infoA = getEffectiveTileInfo(tileA, okeyTile);
  const infoB = getEffectiveTileInfo(tileB, okeyTile);
  if (infoA.isWild || infoB.isWild) return true;
  return infoA.color === infoB.color && infoA.number === infoB.number;
}

/**
 * Calculate the point sum of a meld
 */
export function getMeldPoints(meld: OkeyTile[], okeyTile?: OkeyTile): number {
  return meld.reduce((sum, tile) => {
    const info = getEffectiveTileInfo(tile, okeyTile);
    return sum + (info.isWild ? (okeyTile ? okeyTile.number : 10) : info.number);
  }, 0);
}

/**
 * Exhaustive / Greedy search to find the best melds and pairs in a collection of tiles
 */
export function analyzeHandTiles(tiles: OkeyTile[], okeyTile?: OkeyTile): {
  validMelds: OkeyTile[][];
  validPairs: [OkeyTile, OkeyTile][];
  unmatchedTiles: OkeyTile[];
  totalMeldPoints: number;
  pairCount: number;
  isCompleteMeldFinish: boolean;
  isCompletePairFinish: boolean;
} {
  const remaining = [...tiles];
  const foundMelds: OkeyTile[][] = [];

  // 1. First find Runs of length 3..5
  // Group non-wild tiles by color
  const colors: OkeyColor[] = ['red', 'blue', 'black', 'yellow'];
  const wilds = remaining.filter(t => isWildOkey(t, okeyTile));
  const nonWilds = remaining.filter(t => !isWildOkey(t, okeyTile));

  // Find consecutive runs
  for (const c of colors) {
    const colorTiles = nonWilds.filter(t => getEffectiveTileInfo(t, okeyTile).color === c);
    colorTiles.sort((a, b) => getEffectiveTileInfo(a, okeyTile).number - getEffectiveTileInfo(b, okeyTile).number);

    let i = 0;
    while (i < colorTiles.length) {
      const runCandidate: OkeyTile[] = [colorTiles[i]];
      let currentNum = getEffectiveTileInfo(colorTiles[i], okeyTile).number;
      let j = i + 1;

      while (j < colorTiles.length) {
        const nextNum = getEffectiveTileInfo(colorTiles[j], okeyTile).number;
        if (nextNum === currentNum + 1) {
          runCandidate.push(colorTiles[j]);
          currentNum = nextNum;
        } else if (nextNum === currentNum) {
          // duplicate tile of same number, skip for this run
        } else {
          break;
        }
        j++;
      }

      if (runCandidate.length >= 3) {
        foundMelds.push(runCandidate);
        // Remove used tiles from nonWilds pool
        runCandidate.forEach(used => {
          const idx = nonWilds.findIndex(t => t.id === used.id);
          if (idx !== -1) nonWilds.splice(idx, 1);
        });
        // restart scan
        break;
      }
      i++;
    }
  }

  // 2. Next find Sets of same number, different colors
  for (let num = 1; num <= 13; num++) {
    const numTiles = nonWilds.filter(t => getEffectiveTileInfo(t, okeyTile).number === num);
    const uniqueColorMap = new Map<OkeyColor, OkeyTile>();
    for (const t of numTiles) {
      const col = getEffectiveTileInfo(t, okeyTile).color;
      if (!uniqueColorMap.has(col)) {
        uniqueColorMap.set(col, t);
      }
    }

    if (uniqueColorMap.size >= 3) {
      const setCandidate = Array.from(uniqueColorMap.values());
      foundMelds.push(setCandidate);
      setCandidate.forEach(used => {
        const idx = nonWilds.findIndex(t => t.id === used.id);
        if (idx !== -1) nonWilds.splice(idx, 1);
      });
    }
  }

  // Collect unmatched
  const matchedTileIds = new Set<string>();
  foundMelds.forEach(m => m.forEach(t => matchedTileIds.add(t.id)));

  const unmatched = tiles.filter(t => !matchedTileIds.has(t.id));

  // 3. Check Pairs from the full tiles set
  const pairList: [OkeyTile, OkeyTile][] = [];
  const pairUsedIds = new Set<string>();
  const copyTiles = [...tiles];

  for (let i = 0; i < copyTiles.length; i++) {
    if (pairUsedIds.has(copyTiles[i].id)) continue;
    for (let j = i + 1; j < copyTiles.length; j++) {
      if (pairUsedIds.has(copyTiles[j].id)) continue;
      if (isValidPair(copyTiles[i], copyTiles[j], okeyTile)) {
        pairList.push([copyTiles[i], copyTiles[j]]);
        pairUsedIds.add(copyTiles[i].id);
        pairUsedIds.add(copyTiles[j].id);
        break;
      }
    }
  }

  const totalMeldPoints = foundMelds.reduce((sum, m) => sum + getMeldPoints(m, okeyTile), 0);
  const isCompleteMeldFinish = unmatched.length === 0 && foundMelds.length >= 3;
  const isCompletePairFinish = pairList.length >= 7;

  return {
    validMelds: foundMelds,
    validPairs: pairList,
    unmatchedTiles: unmatched,
    totalMeldPoints,
    pairCount: pairList.length,
    isCompleteMeldFinish,
    isCompletePairFinish,
  };
}

/**
 * Strict verification of a hand finish request
 */
export function validateHandFinish(
  tiles: OkeyTile[],
  discardedTile: OkeyTile | null,
  okeyTile: OkeyTile,
  is101: boolean,
  isOkeyFinish: boolean
): {
  valid: boolean;
  reason?: string;
  penaltyPoints: number;
  bonusPoints: number;
  pointsSum: number;
  pairCount: number;
} {
  // If player has 15 tiles and hasn't selected a discard tile
  if (tiles.length === 15 && !discardedTile) {
    return {
      valid: false,
      reason: '15 taşınız var! Bitirmeden önce atılacak 15. taşı seçmeli veya sağ atık bölgesine atmalısınız.',
      penaltyPoints: 0,
      bonusPoints: 0,
      pointsSum: 0,
      pairCount: 0,
    };
  }

  // The remaining 14 hand tiles to be verified
  const handToVerify = discardedTile
    ? tiles.filter(t => t.id !== discardedTile.id)
    : tiles.slice(0, 14);

  if (handToVerify.length < 14) {
    return {
      valid: false,
      reason: `Eksik taş! Masayı bitirmek için ıstakanızda tam 14 taşın per veya çift oluşturması gerekir (Şu an: ${handToVerify.length} taş).`,
      penaltyPoints: is101 ? 101 : -100,
      bonusPoints: 0,
      pointsSum: 0,
      pairCount: 0,
    };
  }

  // Check if "OKEY AT" was requested
  if (isOkeyFinish) {
    if (!discardedTile) {
      return {
        valid: false,
        reason: 'Okey atarak bitirmek için masaya attığınız taşın Okey olması gerekir!',
        penaltyPoints: is101 ? 101 : -100,
        bonusPoints: 0,
        pointsSum: 0,
        pairCount: 0,
      };
    }
    const isActuallyOkey = isWildOkey(discardedTile, okeyTile);
    if (!isActuallyOkey) {
      return {
        valid: false,
        reason: `Sahte Okey Atışı! Attığınız taş (${discardedTile.color} ${discardedTile.number}) bu turun Okey taşı değildir! Sahte bitiriş cezası: +101 Ceza Puanı!`,
        penaltyPoints: is101 ? 101 : -100,
        bonusPoints: 0,
        pointsSum: 0,
        pairCount: 0,
      };
    }
  }

  // Analyze the remaining 14 tiles
  const analysis = analyzeHandTiles(handToVerify, okeyTile);

  // 101 Okey rules:
  // Can finish with complete melds (unmatched === 0) AND (points >= 101 or previously opened)
  // OR finish with pairs (>= 5 pairs to open, 7 pairs to finish hand completely)
  if (is101) {
    const isPairFinish = analysis.pairCount >= 7;
    const isMeldFinish = analysis.isCompleteMeldFinish && (analysis.totalMeldPoints >= 101 || analysis.validMelds.length >= 4);

    if (!isPairFinish && !isMeldFinish) {
      const leftoverCount = analysis.unmatchedTiles.length;
      return {
        valid: false,
        reason: `Geçersiz 101 Bitişi! Taşlarınız tam per oluşturmuyor (${leftoverCount} taş açıkta, per toplamı: ${analysis.totalMeldPoints}/101, çift: ${analysis.pairCount}/7). Sahte bitiş cezası: +101 Ceza Puanı işlendi!`,
        penaltyPoints: 101,
        bonusPoints: 0,
        pointsSum: analysis.totalMeldPoints,
        pairCount: analysis.pairCount,
      };
    }

    return {
      valid: true,
      reason: isPairFinish ? '7 Çift ile Harika Bitiş!' : `Perler Tamamlandı (${analysis.totalMeldPoints} Puan)!`,
      penaltyPoints: 0,
      bonusPoints: isOkeyFinish ? 400 : 200,
      pointsSum: analysis.totalMeldPoints,
      pairCount: analysis.pairCount,
    };
  }

  // Klasik Okey rules:
  // Must have complete valid melds (unmatched === 0) OR 7 pairs
  const isClassicPairFinish = analysis.pairCount >= 7;
  const isClassicMeldFinish = analysis.isCompleteMeldFinish;

  if (!isClassicPairFinish && !isClassicMeldFinish) {
    return {
      valid: false,
      reason: `Geçersiz Bitiş! Klasik Okey'de tüm 14 taşınızın ardışık seriler veya farklı renk gruplar oluşturması gerekir. Sahte bitiş cezası: -100 Puan!`,
      penaltyPoints: -100,
      bonusPoints: 0,
      pointsSum: analysis.totalMeldPoints,
      pairCount: analysis.pairCount,
    };
  }

  return {
    valid: true,
    reason: isClassicPairFinish ? '7 Çift ile Klasik Bitiş!' : 'Serilerle Tamamlandı!',
    penaltyPoints: 0,
    bonusPoints: isOkeyFinish ? 400 : 200,
    pointsSum: analysis.totalMeldPoints,
    pairCount: analysis.pairCount,
  };
}
