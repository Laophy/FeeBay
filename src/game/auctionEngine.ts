import type {
  AuctionListing,
  CardRarity,
  MarketTrend,
  RawCondition,
} from '../types';
import { CARDS } from '../data/cards';
import { rarityMult, conditionMult, trendMultiplier } from './economyEngine';
import { chance, pick, rand, randInt, uid, weightedPick } from './rng';
import { centeringPriceMultiplier, rollCenteringNeutral } from './centering';

const RAW: RawCondition[] = [
  'Played',
  'Lightly Played',
  'Near Mint',
  'Minty',
  'Gem Candidate',
];

function rollCond(): { raw: RawCondition; score: number } {
  const raw = weightedPick(RAW, [5, 12, 25, 16, 8]);
  let score = 70;
  switch (raw) {
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

const AUCTION_RARITIES: CardRarity[] = [
  'Holo Rare',
  'Secret Rare',
  'Mythic Rare',
  'First Edition',
  'Signed',
  'Error Print',
  'Prototype Card',
];

export function generateAuctions(now: number, trends: MarketTrend[], count = 4): AuctionListing[] {
  const candidates = CARDS.filter((c) => AUCTION_RARITIES.includes(c.rarity));
  const out: AuctionListing[] = [];
  for (let i = 0; i < count; i++) {
    const card = pick(candidates);
    const { raw, score } = rollCond();
    const { centeringOffsetX, centeringOffsetY } = rollCenteringNeutral();
    const centMult = centeringPriceMultiplier(centeringOffsetX, centeringOffsetY);
    const baseTrue =
      card.baseValue *
      rarityMult(card.rarity) *
      conditionMult(raw) *
      trendMultiplier(card, trends) *
      centMult *
      rand(0.9, 1.15);
    const trueValue = Math.max(20, Math.round(baseTrue));
    const startBidPct = rand(0.15, 0.45);
    const currentBid = Math.max(5, Math.round(trueValue * startBidPct));
    const durationMs = randInt(45_000, 180_000);
    const isFake = chance(0.08);
    const bidIncrement = Math.max(2, Math.round(currentBid * 0.06));
    const buyoutPrice = chance(0.4) ? Math.round(trueValue * rand(1.1, 1.5)) : undefined;
    out.push({
      id: uid('auc_'),
      cardId: card.id,
      rarity: card.rarity,
      rawCondition: raw,
      actualConditionScore: score,
      centeringOffsetX,
      centeringOffsetY,
      trueMarketValue: trueValue,
      currentBid,
      bidIncrement,
      buyoutPrice,
      endsAt: now + durationMs,
      rivalAggression: rand(0.4, 0.95),
      isMine: false,
      resolved: false,
      isFake,
    });
  }
  return out;
}

/**
 * Run one rival-bid tick. Returns the updated auction (does not mutate input).
 * Rivals only bid when the player is leading. They use aggression to decide whether to outbid.
 */
export function tickAuctionRivals(auction: AuctionListing, now: number): AuctionListing {
  if (auction.resolved) return auction;
  if (now >= auction.endsAt) return auction;
  // Only rivals act here. If player is leading, rivals may outbid based on aggression.
  if (!auction.isMine) return auction;

  const headroom = auction.trueMarketValue - auction.currentBid;
  if (headroom <= auction.bidIncrement) return auction; // no room to outbid

  const rivalWantsIn = chance(auction.rivalAggression * 0.5);
  if (!rivalWantsIn) return auction;

  const newBid = auction.currentBid + auction.bidIncrement;
  return {
    ...auction,
    currentBid: newBid,
    isMine: false,
  };
}

/** Process auto-sniping: if myMaxBid is set and rival has taken the lead, snipe up to max in the last 6s. */
export function trySnipe(auction: AuctionListing, now: number): AuctionListing {
  if (auction.resolved) return auction;
  if (auction.isMine) return auction;
  if (!auction.myMaxBid) return auction;
  const msToEnd = auction.endsAt - now;
  if (msToEnd > 6_000) return auction;
  const nextBid = auction.currentBid + auction.bidIncrement;
  if (nextBid <= auction.myMaxBid) {
    return { ...auction, currentBid: nextBid, isMine: true };
  }
  return auction;
}
