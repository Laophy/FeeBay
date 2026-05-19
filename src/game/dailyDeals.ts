import type {
  CardDef,
  CardRarity,
  DailyDeal,
  GradingCompanyId,
  MarketTrend,
  RawCondition,
} from '../types';
import { CARDS } from '../data/cards';
import { GRADE_MULTIPLIER, conditionMult, rarityMult, trendMultiplier } from './economyEngine';
import {
  centeringPriceMultiplier,
  rollCentering,
  rollCenteringForGrade,
} from './centering';
import { pick, rand, randInt, uid, weightedPick } from './rng';

/**
 * The Daily Deals shop — a curated, once-a-day rotation of cards. Most of the
 * shelf is everyday raw stock to flip, alongside a couple of graded slabs and
 * one or two genuinely high-end "headliner" cards. It restocks every in-game
 * day; the rebuild is driven by `ensureDailyDeals` in the store.
 */

/** The chase rarities — only ever sold as a headliner. */
const HIGH_RARITIES: CardRarity[] = ['Secret Rare', 'Mythic Rare', 'Prototype Card'];

/** Everyday stock leans on the common rarities, never the chase cards. */
const NORMAL_RARITIES: CardRarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Holo Rare',
  'First Edition',
  'Error Print',
  'Signed',
];

/** Scarcer print variants show up less often on the everyday shelf. */
function variantWeight(c: CardDef): number {
  let w =
    c.variant === 'normal'
      ? 12
      : c.variant === 'reverse_holo'
      ? 5
      : c.variant === 'holo'
      ? 2
      : 0.4; // rainbow — genuinely rare
  if (c.firstEdition) w *= 0.5;
  return w;
}

/** A plausible condition score for a given raw grade. */
function scoreForCondition(raw: RawCondition): number {
  const ranges: Record<RawCondition, [number, number]> = {
    Damaged: [8, 24],
    'Heavily Played': [26, 48],
    Played: [46, 64],
    'Lightly Played': [62, 79],
    'Near Mint': [76, 90],
    Minty: [85, 95],
    'Gem Candidate': [92, 100],
  };
  const [lo, hi] = ranges[raw];
  return randInt(lo, hi);
}

function rawValueOf(
  card: CardDef,
  raw: RawCondition,
  score: number,
  trends: MarketTrend[],
  offsetX: number,
  offsetY: number,
): number {
  const base = card.baseValue * rarityMult(card.rarity) * conditionMult(raw);
  const scoreBoost = 0.85 + (score / 100) * 0.3;
  const centMult = centeringPriceMultiplier(offsetX, offsetY);
  return Math.max(
    2,
    Math.round(base * trendMultiplier(card, trends) * scoreBoost * centMult * rand(0.95, 1.08)),
  );
}

function gradedValueOf(
  card: CardDef,
  grade: number,
  company: GradingCompanyId,
  trends: MarketTrend[],
): number {
  const gm = GRADE_MULTIPLIER[grade] ?? 1;
  const companyMult = company === 'PZA' ? 1.2 : company === 'Bucket' ? 0.85 : 0.9;
  return Math.max(
    10,
    Math.round(
      card.baseValue *
        rarityMult(card.rarity) *
        gm *
        companyMult *
        trendMultiplier(card, trends) *
        rand(0.97, 1.08),
    ),
  );
}

/** A high-end, slabbed chase card. Reputation gates how rich it can get. */
function makeHeadliner(trends: MarketTrend[], reputation: number): DailyDeal {
  const all = CARDS.filter((c) => HIGH_RARITIES.includes(c.rarity));
  let pool = all;
  if (reputation < 15) pool = all.filter((c) => c.rarity === 'Secret Rare');
  else if (reputation < 60) pool = all.filter((c) => c.rarity !== 'Prototype Card');
  if (pool.length === 0) pool = all;
  const card = weightedPick(
    pool,
    pool.map((c) =>
      c.variant === 'holo' ? 5 : c.variant === 'rainbow' ? 2 : c.variant === 'reverse_holo' ? 3 : 1,
    ),
  );
  const grade =
    reputation < 15
      ? weightedPick([8, 9], [3, 4])
      : reputation < 60
      ? weightedPick([9, 9.5], [4, 3])
      : weightedPick([9.5, 10], [3, 4]);
  const company = weightedPick<GradingCompanyId>(['PZA', 'ZAG'], [7, 3]);
  const { centeringOffsetX, centeringOffsetY } = rollCenteringForGrade(grade);
  const trueValue = gradedValueOf(card, grade, company, trends);
  return {
    id: uid('deal_'),
    cardId: card.id,
    rarity: card.rarity,
    rawCondition: 'Gem Candidate',
    actualConditionScore: 95,
    centeringOffsetX,
    centeringOffsetY,
    price: Math.max(50, Math.round(trueValue * rand(0.8, 0.96))),
    trueValue,
    grade,
    gradingCompany: company,
    kind: 'headliner',
  };
}

/** A mid-grade graded slab from the everyday pool. */
function makeSlab(trends: MarketTrend[]): DailyDeal {
  const pool = CARDS.filter((c) => NORMAL_RARITIES.includes(c.rarity));
  const card = weightedPick(pool, pool.map(variantWeight));
  const grade = weightedPick([7, 8, 9], [3, 5, 3]);
  const company = weightedPick<GradingCompanyId>(['PZA', 'ZAG', 'Bucket'], [4, 5, 3]);
  const { centeringOffsetX, centeringOffsetY } = rollCenteringForGrade(grade);
  const trueValue = gradedValueOf(card, grade, company, trends);
  return {
    id: uid('deal_'),
    cardId: card.id,
    rarity: card.rarity,
    rawCondition: 'Near Mint',
    actualConditionScore: 88,
    centeringOffsetX,
    centeringOffsetY,
    price: Math.max(5, Math.round(trueValue * rand(0.82, 1.06))),
    trueValue,
    grade,
    gradingCompany: company,
    kind: 'slab',
  };
}

/** A clean, well-centred raw card — a grading candidate. */
function makeGradingFind(trends: MarketTrend[]): DailyDeal {
  const pool = CARDS.filter((c) => NORMAL_RARITIES.includes(c.rarity));
  const card = weightedPick(pool, pool.map(variantWeight));
  const raw = pick(['Near Mint', 'Minty', 'Gem Candidate'] as RawCondition[]);
  const score = scoreForCondition(raw);
  const { centeringOffsetX, centeringOffsetY } = rollCentering('grading_candidate');
  const trueValue = rawValueOf(card, raw, score, trends, centeringOffsetX, centeringOffsetY);
  return {
    id: uid('deal_'),
    cardId: card.id,
    rarity: card.rarity,
    rawCondition: raw,
    actualConditionScore: score,
    centeringOffsetX,
    centeringOffsetY,
    price: Math.max(1, Math.round(trueValue * rand(0.72, 1.0))),
    trueValue,
    kind: 'grading_find',
  };
}

/** Ordinary raw stock priced to flip. */
function makeFlip(trends: MarketTrend[]): DailyDeal {
  const pool = CARDS.filter((c) => NORMAL_RARITIES.includes(c.rarity));
  const card = weightedPick(pool, pool.map(variantWeight));
  const raw = weightedPick(
    ['Played', 'Lightly Played', 'Near Mint', 'Minty'] as RawCondition[],
    [5, 10, 11, 5],
  );
  const score = scoreForCondition(raw);
  const { centeringOffsetX, centeringOffsetY } = rollCentering('fair');
  const trueValue = rawValueOf(card, raw, score, trends, centeringOffsetX, centeringOffsetY);
  return {
    id: uid('deal_'),
    cardId: card.id,
    rarity: card.rarity,
    rawCondition: raw,
    actualConditionScore: score,
    centeringOffsetX,
    centeringOffsetY,
    price: Math.max(1, Math.round(trueValue * rand(0.55, 0.95))),
    trueValue,
    kind: 'flip',
  };
}

/** Build a fresh day's shelf — headliner(s) first, then the everyday stock. */
export function generateDailyDeals(trends: MarketTrend[], reputation: number): DailyDeal[] {
  const deals: DailyDeal[] = [];
  const headlinerCount = reputation >= 60 ? 2 : 1;
  for (let i = 0; i < headlinerCount; i++) deals.push(makeHeadliner(trends, reputation));
  const findCount = randInt(2, 3);
  for (let i = 0; i < findCount; i++) deals.push(makeGradingFind(trends));
  const slabCount = randInt(1, 2);
  for (let i = 0; i < slabCount; i++) deals.push(makeSlab(trends));
  const flipCount = randInt(3, 4);
  for (let i = 0; i < flipCount; i++) deals.push(makeFlip(trends));
  return deals;
}
