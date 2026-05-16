import type {
  AuctionBid,
  AuctionListing,
  AuctionRival,
  AuctionRivalArchetype,
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

/* ---------------- Rival bidders ---------------- */

const RIVAL_NAMES = [
  'GobZilla', 'SnaggleBid', 'WartHoarder', 'GoblinKing88', 'MintGremlin',
  'SirRaisesALot', 'PennyPincher', 'TheUndercutter', 'GrislyGold', 'BridgeTrolly',
  'NoLowballsNagg', 'CackleCorp', 'GizzardGrub', 'HoardLord', 'FungusFinn',
  'BogTrotter', 'SnoutAboutIt', 'GrabblesMcGee', 'VaultRat', 'EmberEyes',
  'KnucklesCoin', 'TollBoothTina', 'TheNibbler', 'GreedfingerGus', 'SlabSnatcher',
  'MossyMarge', 'CopperClaw', 'TheReliquary', 'BogeyBidder', 'GullyGremlin',
];

/** Each archetype is a distinct opponent personality — the player learns to read them. */
function rollArchetype(): AuctionRivalArchetype {
  return weightedPick<AuctionRivalArchetype>(
    ['whale', 'steady', 'cheapskate', 'sniper'],
    [1.4, 4, 3, 2.6],
  );
}

function budgetFactor(a: AuctionRivalArchetype): number {
  switch (a) {
    case 'whale':
      return rand(0.98, 1.45);
    case 'steady':
      return rand(0.62, 0.96);
    case 'cheapskate':
      return rand(0.34, 0.6);
    case 'sniper':
      return rand(0.72, 1.08);
  }
}

function aggressionFor(a: AuctionRivalArchetype): number {
  switch (a) {
    case 'whale':
      return rand(0.55, 0.85);
    case 'steady':
      return rand(0.4, 0.7);
    case 'cheapskate':
      return rand(0.28, 0.52);
    case 'sniper':
      return rand(0.12, 0.34); // dozes early, lunges in the closing seconds
  }
}

function makeRivals(
  trueValue: number,
  count: number,
  used: Set<string>,
): AuctionRival[] {
  const rivals: AuctionRival[] = [];
  for (let i = 0; i < count; i++) {
    let name = pick(RIVAL_NAMES);
    let guard = 0;
    while (used.has(name) && guard++ < 30) name = pick(RIVAL_NAMES);
    used.add(name);
    const archetype = rollArchetype();
    rivals.push({
      id: uid('rv_'),
      name,
      archetype,
      budget: Math.max(10, Math.round(trueValue * budgetFactor(archetype))),
      aggression: aggressionFor(archetype),
      active: true,
    });
  }
  return rivals;
}

/* ---------------- UI helper: rival heat ---------------- */

export type RivalHeat = 'leading' | 'sweating' | 'circling' | 'out';

/** Fuzzy read on a rival's state — the tell the player learns to play off. */
export function rivalHeat(rival: AuctionRival, auction: AuctionListing): RivalHeat {
  if (!rival.active) return 'out';
  if (auction.leaderName === rival.name) return 'leading';
  const nextBid = auction.currentBid + auction.bidIncrement;
  if (nextBid > rival.budget * 0.86) return 'sweating';
  return 'circling';
}

/* ---------------- Generation ---------------- */

export function minNextBid(a: AuctionListing): number {
  return a.currentBid + a.bidIncrement;
}

export function generateAuctions(
  now: number,
  trends: MarketTrend[],
  count = 5,
): AuctionListing[] {
  const candidates = CARDS.filter((c) => AUCTION_RARITIES.includes(c.rarity));
  const candidateWeights = candidates.map((c) =>
    c.variant === 'rainbow'
      ? 2.5
      : c.variant === 'holo'
      ? 5
      : c.variant === 'reverse_holo'
      ? 3
      : 1.2,
  );
  const usedNames = new Set<string>();
  const out: AuctionListing[] = [];
  for (let i = 0; i < count; i++) {
    const card = weightedPick(candidates, candidateWeights);
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
    const bidIncrement = Math.max(3, Math.round(trueValue * rand(0.025, 0.04)));
    const isFake = chance(0.08);
    const buyoutPrice = chance(0.4)
      ? Math.round(trueValue * rand(1.15, 1.55))
      : undefined;
    const durationMs = randInt(30_000, 52_000);
    const rivals = makeRivals(trueValue, randInt(3, 5), usedNames);

    // Seed an opening flurry of rival bids so the lot already feels alive.
    let currentBid = Math.max(5, Math.round(trueValue * rand(0.1, 0.26)));
    const seedCount = randInt(1, 4);
    const bids: AuctionBid[] = [];
    let leaderName = '';
    for (let s = 0; s < seedCount; s++) {
      const next = currentBid + bidIncrement;
      const able = rivals.filter((r) => next <= r.budget);
      if (able.length === 0) break;
      const r = pick(able);
      currentBid = next;
      leaderName = r.name;
      bids.unshift({
        id: uid('bid_'),
        bidder: r.name,
        amount: currentBid,
        at: now - (seedCount - s) * randInt(3000, 9000),
        kind: 'rival',
      });
    }

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
      startedAt: now,
      endsAt: now + durationMs,
      rivals,
      bids,
      leaderName,
      watchers: rivals.length + randInt(5, 28),
      extensionCount: 0,
      isMine: false,
      resolved: false,
      isFake,
    });
  }
  return out;
}

/* ---------------- Live ticking ---------------- */

function goblinDropLine(name: string): string {
  return pick([
    `${name} checks their pockets... empty. They scuttle off.`,
    `${name} taps out. The goblin sneers.`,
    `${name} can't keep up — gone.`,
    `${name} folds. Weak paddle.`,
    `${name} backs away from the pit, grumbling.`,
  ]);
}

const ANTI_SNIPE_LINE = 'Anti-snipe! The goblin slaps a few more seconds on the clock.';

/** No lot — base time plus every anti-snipe extension — ever runs past 60s. */
const AUCTION_HARD_CAP_MS = 60_000;

/**
 * One live tick for an auction. Rivals war with each other AND the player —
 * they keep bidding regardless of who leads, and drop out only when their hidden
 * budget is spent. A bid in the dying seconds extends the clock (anti-snipe).
 * If the player has a proxy max armed (auto_sniper), it auto-rebids to defend.
 */
export function tickAuction(
  a: AuctionListing,
  now: number,
  opts: { proxyEnabled: boolean; playerCash: number },
): AuctionListing {
  if (a.resolved || now >= a.endsAt) return a;

  let currentBid = a.currentBid;
  let leaderName = a.leaderName;
  let isMine = a.isMine;
  let endsAt = a.endsAt;
  let extensionCount = a.extensionCount;
  const rivals = a.rivals.map((r) => ({ ...r }));
  const fresh: AuctionBid[] = []; // chronological order, reversed before prepend
  let changed = false;
  let bidHappened = false;

  const closing = endsAt - now < 12_000;

  const register = (bidder: string, amount: number, kind: AuctionBid['kind']) => {
    currentBid = amount;
    leaderName = bidder;
    isMine = bidder === 'You';
    fresh.push({ id: uid('bid_'), bidder, amount, at: now, kind });
    bidHappened = true;
    changed = true;
  };

  // Rivals act — random order, capped at 2 bids per tick so the feed reads cleanly.
  let bidsThisTick = 0;
  const order = [...rivals].sort(() => Math.random() - 0.5);
  for (const r of order) {
    if (bidsThisTick >= 2) break;
    if (!r.active) continue;
    if (leaderName === r.name) continue; // already holding the high bid
    const next = currentBid + a.bidIncrement;
    if (next > r.budget) {
      r.active = false;
      changed = true;
      fresh.push({
        id: uid('bid_'),
        bidder: 'GOBLIN',
        amount: currentBid,
        at: now,
        kind: 'goblin',
        text: goblinDropLine(r.name),
      });
      continue;
    }
    let p = r.aggression * 0.5;
    if (closing) p += r.archetype === 'sniper' ? 0.55 : 0.18;
    // hesitates when the next bid eats into their ceiling — the player's tell
    const headroom = (r.budget - next) / Math.max(1, r.budget);
    if (headroom < 0.12) p *= 0.45;
    if (!chance(Math.min(0.92, p))) continue;
    // whales (and the odd steady hand) throw intimidating jump bids
    let amount = next;
    if (chance(r.archetype === 'whale' ? 0.32 : 0.12)) {
      const jump = currentBid + Math.round(a.bidIncrement * rand(1.6, 3.2));
      if (jump <= r.budget) amount = jump;
    }
    register(r.name, amount, 'rival');
    bidsThisTick++;
  }

  // Player proxy bid — defends the lead up to the armed max.
  if (opts.proxyEnabled && a.myMaxBid && leaderName !== 'You') {
    const next = currentBid + a.bidIncrement;
    if (next <= a.myMaxBid && next <= opts.playerCash) {
      register('You', next, 'player');
    }
  }

  // Anti-snipe — a late bid nudges the clock, but never past the 60s hard cap.
  const hardCapTick = a.startedAt + AUCTION_HARD_CAP_MS;
  if (bidHappened && now < hardCapTick && endsAt - now < 7_000) {
    const newEnd = Math.min(hardCapTick, now + 7_000);
    if (newEnd > endsAt + 300) {
      endsAt = newEnd;
      extensionCount += 1;
      fresh.push({
        id: uid('bid_'),
        bidder: 'GOBLIN',
        amount: currentBid,
        at: now,
        kind: 'system',
        text: ANTI_SNIPE_LINE,
      });
    }
  }

  if (!changed) return a;

  const bids = [...fresh.reverse(), ...a.bids].slice(0, 40);
  return { ...a, currentBid, leaderName, isMine, endsAt, extensionCount, rivals, bids };
}

/** Register a manual player bid (handles anti-snipe extension + feed entry). */
export function applyPlayerBid(
  a: AuctionListing,
  amount: number,
  now: number,
): AuctionListing {
  const fresh: AuctionBid[] = [
    { id: uid('bid_'), bidder: 'You', amount, at: now, kind: 'player' },
  ];
  let endsAt = a.endsAt;
  let extensionCount = a.extensionCount;
  const hardCap = a.startedAt + AUCTION_HARD_CAP_MS;
  if (now < hardCap && endsAt - now < 7_000) {
    const newEnd = Math.min(hardCap, now + 7_000);
    if (newEnd > endsAt + 300) {
      endsAt = newEnd;
      extensionCount += 1;
      fresh.push({
        id: uid('bid_'),
        bidder: 'GOBLIN',
        amount,
        at: now,
        kind: 'system',
        text: ANTI_SNIPE_LINE,
      });
    }
  }
  return {
    ...a,
    currentBid: amount,
    leaderName: 'You',
    isMine: true,
    endsAt,
    extensionCount,
    bids: [...fresh.reverse(), ...a.bids].slice(0, 40),
  };
}
