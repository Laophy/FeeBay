import type {
  CardDef,
  CardRarity,
  InventoryItem,
  MarketplaceListing,
  RawCondition,
} from '../types';
import { CARDS } from '../data/cards';
import { chance, pick, rand, randInt, uid, weightedPick } from './rng';
import { rollCenteringNeutral } from './centering';
import { conditionMult, rarityMult } from './economyEngine';

const RAW: RawCondition[] = [
  'Damaged',
  'Heavily Played',
  'Played',
  'Lightly Played',
  'Near Mint',
  'Minty',
  'Gem Candidate',
];

function rollRandomCondition(): { raw: RawCondition; score: number } {
  const raw = weightedPick(RAW, [4, 8, 14, 22, 24, 16, 12]);
  let score = 50;
  switch (raw) {
    case 'Damaged':
      score = randInt(5, 25);
      break;
    case 'Heavily Played':
      score = randInt(25, 50);
      break;
    case 'Played':
      score = randInt(45, 65);
      break;
    case 'Lightly Played':
      score = randInt(60, 80);
      break;
    case 'Near Mint':
      score = randInt(75, 90);
      break;
    case 'Minty':
      score = randInt(85, 95);
      break;
    case 'Gem Candidate':
      score = randInt(92, 100);
      break;
  }
  return { raw, score };
}

/**
 * Tiered card pools. Cheaper lots are common-heavy; whale lots can pull mythics.
 * Returns a list of weights aligned with CARDS by rarity.
 */
export type LotTier = 'cheap' | 'mid' | 'premium' | 'whale';

const RARITY_WEIGHTS: Record<LotTier, Record<CardRarity, number>> = {
  cheap: {
    Common: 80,
    Uncommon: 32,
    Rare: 7,
    'Holo Rare': 1.8,
    'First Edition': 0.45,
    Signed: 0.25,
    'Secret Rare': 0.25,
    'Error Print': 0.18,
    'Mythic Rare': 0.04,
    'Prototype Card': 0.01,
  },
  mid: {
    Common: 55,
    Uncommon: 45,
    Rare: 22,
    'Holo Rare': 7,
    'First Edition': 2.6,
    Signed: 1.8,
    'Secret Rare': 1.8,
    'Error Print': 1,
    'Mythic Rare': 0.3,
    'Prototype Card': 0.05,
  },
  premium: {
    Common: 30,
    Uncommon: 42,
    Rare: 34,
    'Holo Rare': 18,
    'First Edition': 8,
    Signed: 6,
    'Secret Rare': 5,
    'Error Print': 3,
    'Mythic Rare': 1.5,
    'Prototype Card': 0.3,
  },
  whale: {
    Common: 14,
    Uncommon: 30,
    Rare: 38,
    'Holo Rare': 28,
    'First Edition': 16,
    Signed: 11,
    'Secret Rare': 9,
    'Error Print': 7,
    'Mythic Rare': 4.5,
    'Prototype Card': 1.5,
  },
};

export function tierForPrice(askingPrice: number): LotTier {
  if (askingPrice < 35) return 'cheap';
  if (askingPrice < 120) return 'mid';
  if (askingPrice < 500) return 'premium';
  return 'whale';
}

function pickCardForTier(tier: LotTier): CardDef {
  const weights = CARDS.map((c) => RARITY_WEIGHTS[tier][c.rarity] ?? 1);
  return weightedPick(CARDS, weights);
}

/**
 * Conservative typical sell-value estimate for a single card pulled in a lot.
 * Uses the player's actual value formula minus trend/centering noise (those will swing later).
 */
function expectedCardSellValue(card: CardDef, raw: RawCondition, score: number): number {
  const noise = 0.85 + (score / 100) * 0.15; // 0.85 - 1.0 based on score
  return Math.max(1, Math.round(card.baseValue * rarityMult(card.rarity) * conditionMult(raw) * noise));
}

/** Expected value of one pull from a tier — used to price lot listings. */
export function expectedPullValue(tier: LotTier): number {
  // Pre-compute via a representative scan
  let total = 0;
  let weightTotal = 0;
  for (const card of CARDS) {
    const w = RARITY_WEIGHTS[tier][card.rarity] ?? 1;
    // average condition score ~70, average condition mult ~0.75
    const avg = card.baseValue * rarityMult(card.rarity) * 0.75 * 0.95;
    total += avg * w;
    weightTotal += w;
  }
  return Math.round(total / weightTotal);
}

export type ResolvedLot = {
  items: InventoryItem[];
  totalRawValueEstimate: number;
};

export function resolveMysteryLot(
  listing: MarketplaceListing,
  acquiredFrom: MarketplaceListing['source'],
): ResolvedLot {
  let sizeMin = 3;
  let sizeMax = 6;
  if (listing.lotType === 'binder') {
    sizeMin = 5;
    sizeMax = 9;
  }
  if (listing.qualityType === 'hidden_gem' || listing.qualityType === 'mislisted_rare') {
    sizeMin += 1;
    sizeMax += 2;
  }
  if (listing.qualityType === 'damaged') {
    sizeMin = Math.max(2, sizeMin - 1);
    sizeMax = Math.max(3, sizeMax - 1);
  }
  const size = randInt(sizeMin, sizeMax);
  const tier = tierForPrice(listing.askingPrice);

  const items: InventoryItem[] = [];
  let totalRawValueEstimate = 0;

  // Hidden-gem and mislisted-rare lots guarantee at least one Rare-or-better
  let needsAnchor =
    listing.qualityType === 'hidden_gem' || listing.qualityType === 'mislisted_rare';

  for (let i = 0; i < size; i++) {
    let card = pickCardForTier(tier);
    if (needsAnchor && i === size - 1) {
      // last slot — force at least one Rare or better if none yet
      const haveRare = items.some((it) =>
        ['Rare', 'Holo Rare', 'First Edition', 'Signed', 'Secret Rare', 'Error Print', 'Mythic Rare', 'Prototype Card'].includes(
          it.rarity,
        ),
      );
      if (!haveRare) {
        const rares = CARDS.filter((c) =>
          ['Rare', 'Holo Rare', 'First Edition', 'Signed', 'Secret Rare', 'Error Print', 'Mythic Rare'].includes(c.rarity),
        );
        if (rares.length > 0) card = pick(rares);
      }
    }
    const { raw, score } = rollRandomCondition();
    const isFake = listing.qualityType === 'fake' && chance(0.35);
    const sellValue = expectedCardSellValue(card, raw, score);
    totalRawValueEstimate += sellValue;
    const { centeringOffsetX, centeringOffsetY } = rollCenteringNeutral();
    items.push({
      id: uid('inv_'),
      cardId: card.id,
      name: card.name,
      set: card.set,
      rarity: card.rarity,
      rawCondition: raw,
      actualConditionScore: score,
      centeringOffsetX,
      centeringOffsetY,
      purchasePrice: 0, // distributed below
      baseValue: sellValue,
      status: 'raw',
      acquiredFrom,
      acquiredAt: Date.now(),
      isFake,
      hue: card.hue,
    });
  }

  // Distribute purchase price proportionally to sell value.
  const total = items.reduce((s, i) => s + i.baseValue, 0) || 1;
  for (const item of items) {
    item.purchasePrice = +((listing.askingPrice * item.baseValue) / total).toFixed(2);
  }

  return { items, totalRawValueEstimate };
}

/* ---- Storage units ---- */

const STORAGE_RARITY_WEIGHTS: Record<LotTier, Record<CardRarity, number>> = {
  cheap: RARITY_WEIGHTS.mid,
  mid: RARITY_WEIGHTS.premium,
  premium: RARITY_WEIGHTS.whale,
  whale: RARITY_WEIGHTS.whale,
};

const RARE_OR_BETTER = new Set<CardRarity>([
  'Holo Rare',
  'Secret Rare',
  'Mythic Rare',
  'Error Print',
  'First Edition',
  'Signed',
  'Prototype Card',
]);

function pickStorageUnitCard(tier: LotTier): CardDef {
  const w = STORAGE_RARITY_WEIGHTS[tier];
  const weights = CARDS.map((c) => w[c.rarity] ?? 1);
  return weightedPick(CARDS, weights);
}

export function resolveStorageUnit(
  listing: MarketplaceListing,
  acquiredFrom: MarketplaceListing['source'],
): ResolvedLot {
  const tier = tierForPrice(listing.askingPrice);
  // Size based on price — bigger units, more cards
  let size: number;
  if (listing.askingPrice >= 1500) size = randInt(28, 38);
  else if (listing.askingPrice >= 700) size = randInt(20, 30);
  else size = randInt(15, 22);

  const items: InventoryItem[] = [];
  let totalRawValueEstimate = 0;
  // Guarantee count of rare+ scales with tier
  const guaranteeCount = tier === 'whale' ? 4 : tier === 'premium' ? 3 : 2;
  let guaranteedSoFar = 0;

  for (let i = 0; i < size; i++) {
    let card = pickStorageUnitCard(tier);
    // Force more rares toward the end if we're below the guarantee
    const slotsLeft = size - i;
    if (guaranteedSoFar < guaranteeCount && slotsLeft <= guaranteeCount - guaranteedSoFar) {
      if (!RARE_OR_BETTER.has(card.rarity)) {
        const candidates = CARDS.filter((c) => RARE_OR_BETTER.has(c.rarity));
        if (candidates.length > 0) card = pick(candidates);
      }
    }
    if (RARE_OR_BETTER.has(card.rarity)) guaranteedSoFar += 1;

    const { raw, score } = rollRandomCondition();
    const isFake = chance(0.05);
    const sellValue = expectedCardSellValue(card, raw, score);
    totalRawValueEstimate += sellValue;
    const { centeringOffsetX, centeringOffsetY } = rollCenteringNeutral();
    items.push({
      id: uid('inv_'),
      cardId: card.id,
      name: card.name,
      set: card.set,
      rarity: card.rarity,
      rawCondition: raw,
      actualConditionScore: score,
      centeringOffsetX,
      centeringOffsetY,
      purchasePrice: 0,
      baseValue: sellValue,
      status: 'raw',
      acquiredFrom,
      acquiredAt: Date.now(),
      isFake,
      hue: card.hue,
    });
  }

  const total = items.reduce((s, i) => s + i.baseValue, 0) || 1;
  for (const item of items) {
    item.purchasePrice = +((listing.askingPrice * item.baseValue) / total).toFixed(2);
  }

  return { items, totalRawValueEstimate };
}
