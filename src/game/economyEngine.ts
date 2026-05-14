import type {
  CardDef,
  InventoryItem,
  MarketTrend,
  RawCondition,
} from '../types';
import { getCardById } from '../data/cards';
import { GRADING_COMPANIES } from '../data/gradingCompanies';
import { centeringPriceMultiplier } from './centering';
import { getNoise } from './marketNoise';

const RARITY_MULTIPLIER: Record<string, number> = {
  Common: 0.8,
  Uncommon: 1.0,
  Rare: 1.2,
  'Holo Rare': 1.5,
  'Secret Rare': 2.2,
  'Mythic Rare': 3.0,
  'Error Print': 2.5,
  'First Edition': 2.0,
  Signed: 2.3,
  'Prototype Card': 4.0,
};

const CONDITION_MULTIPLIER: Record<RawCondition, number> = {
  Damaged: 0.15,
  'Heavily Played': 0.3,
  Played: 0.5,
  'Lightly Played': 0.75,
  'Near Mint': 1.0,
  Minty: 1.15,
  'Gem Candidate': 1.25,
};

export const GRADE_MULTIPLIER: Record<number, number> = {
  10: 9.0,
  9.5: 5.0,
  9: 2.8,
  8: 1.4,
  7: 0.85,
  6: 0.55,
  5: 0.42,
  4: 0.3,
  3: 0.25,
  2: 0.2,
  1: 0.15,
};

export function rarityMult(rarity: string): number {
  return RARITY_MULTIPLIER[rarity] ?? 1;
}

export function conditionMult(c: RawCondition): number {
  return CONDITION_MULTIPLIER[c] ?? 1;
}

export function trendMultiplier(card: CardDef, trends: MarketTrend[]): number {
  let mult = 1;
  for (const t of trends) {
    if (card.trendTags.includes(t.tag)) mult *= t.multiplier;
  }
  return mult;
}

export function conventionMultiplier(
  card: CardDef,
  convention: { pumpedTags: string[]; boostMultiplier: number; endsAt: number } | null,
  now: number = Date.now(),
): number {
  if (!convention || convention.endsAt < now) return 1;
  if (card.trendTags.some((t) => convention.pumpedTags.includes(t))) {
    return convention.boostMultiplier;
  }
  return 1;
}

export function calculateRawValue(
  item: InventoryItem,
  trends: MarketTrend[],
  noise: Record<string, number> = {},
  convention: { pumpedTags: string[]; boostMultiplier: number; endsAt: number } | null = null,
  randomness = 1,
): number {
  const card = getCardById(item.cardId);
  const centMult = centeringPriceMultiplier(item.centeringOffsetX, item.centeringOffsetY);
  const noiseMult = getNoise(noise, item.cardId);
  const v =
    card.baseValue *
    rarityMult(item.rarity) *
    conditionMult(item.rawCondition) *
    trendMultiplier(card, trends) *
    conventionMultiplier(card, convention) *
    centMult *
    noiseMult *
    randomness;
  return Math.max(1, Math.round(v));
}

export function calculateGradedValue(
  item: InventoryItem,
  trends: MarketTrend[],
  noise: Record<string, number> = {},
  convention: { pumpedTags: string[]; boostMultiplier: number; endsAt: number } | null = null,
  vaultStable = false,
): number {
  if (!item.grade) return calculateRawValue(item, trends, noise, convention);
  const card = getCardById(item.cardId);
  const gm = GRADE_MULTIPLIER[item.grade] ?? 1;
  const companyMult = item.gradingCompany
    ? GRADING_COMPANIES.find((c) => c.id === item.gradingCompany)?.resaleMultiplier ?? 1
    : 1;
  const centBoost = 0.95 + (centeringPriceMultiplier(item.centeringOffsetX, item.centeringOffsetY) - 0.93) * 0.5;
  const noiseMult = vaultStable ? 1 : 1 + (getNoise(noise, item.cardId) - 1) * 0.5;
  const v =
    card.baseValue *
    rarityMult(item.rarity) *
    gm *
    companyMult *
    centBoost *
    noiseMult *
    trendMultiplier(card, trends) *
    conventionMultiplier(card, convention);
  return Math.max(1, Math.round(v));
}

export function calculateCurrentValue(
  item: InventoryItem,
  trends: MarketTrend[],
  noise: Record<string, number> = {},
  convention: { pumpedTags: string[]; boostMultiplier: number; endsAt: number } | null = null,
  vaultStable = false,
): number {
  if (item.status === 'graded' && item.grade) {
    return calculateGradedValue(item, trends, noise, convention, vaultStable);
  }
  return calculateRawValue(item, trends, noise, convention);
}

export type SaleBreakdown = {
  gross: number;
  sellerFee: number;
  paymentFee: number;
  flatFee: number;
  net: number;
};

export function computeSale(
  gross: number,
  fees: { sellerFeePct: number; paymentFeePct: number; flatFee: number },
  feeDiscount = 0,
): SaleBreakdown {
  const adjSeller = fees.sellerFeePct * (1 - feeDiscount);
  const adjPayment = fees.paymentFeePct * (1 - feeDiscount);
  const sellerFee = +(gross * adjSeller).toFixed(2);
  const paymentFee = +(gross * adjPayment).toFixed(2);
  const flatFee = fees.flatFee;
  const net = +(gross - sellerFee - paymentFee - flatFee).toFixed(2);
  return { gross, sellerFee, paymentFee, flatFee, net };
}
