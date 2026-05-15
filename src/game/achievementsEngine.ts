import type { CardRarity, GameState, InventoryItem } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';
import { CARDS } from '../data/cards';
import { MARKETPLACES } from '../data/marketplaces';
import { centeringScore } from './centering';

const RARE_OR_BETTER: CardRarity[] = [
  'Secret Rare',
  'Mythic Rare',
  'Error Print',
  'Signed',
  'Prototype Card',
];

export type AchievementContext =
  | { kind: 'sold'; profit: number; profitPct: number; item: InventoryItem }
  | { kind: 'graded'; grade: number; item: InventoryItem }
  | { kind: 'bought'; isFake: boolean; price?: number; duringConvention?: boolean }
  | { kind: 'lot_opened'; rarities: CardRarity[]; total: number; isStorageUnit: boolean }
  | { kind: 'auction_won' }
  | { kind: 'storefront_sale' }
  | { kind: 'negotiation_accepted' }
  | { kind: 'crash_caused' }
  | { kind: 'slab_bag_opened'; grade: number; isScam: boolean }
  | { kind: 'tick' };

/**
 * Evaluate every achievement against the current state. Returns newly-unlocked IDs.
 * The engine evaluates *all* conditions on every call — context only matters for one-shot
 * gating like "made 200% on a single sale". Lifetime stats are read live from state.
 */
export function evaluateAchievements(
  state: GameState,
  ctx: AchievementContext,
): string[] {
  const unlocked = new Set(state.achievementsUnlocked);
  const newly: string[] = [];
  const mark = (id: string) => {
    if (!unlocked.has(id) && ACHIEVEMENTS.some((a) => a.id === id)) {
      unlocked.add(id);
      newly.push(id);
    }
  };

  // Pre-compute set ownership for "all sets" / "any set" / set_completionist
  const setMap: Record<string, { total: number; owned: number }> = {};
  for (const c of CARDS) {
    if (!setMap[c.set]) setMap[c.set] = { total: 0, owned: 0 };
    setMap[c.set].total += 1;
    if (state.collection[c.id]) setMap[c.set].owned += 1;
  }

  // --- Lifetime stat-based, always re-evaluated ---
  const s = state.stats;
  if (s.totalBought >= 1) mark('first_buy');
  if (s.totalSold >= 1) mark('first_flip');
  if (s.mysteryLotsOpened >= 1) mark('first_lot');
  if (s.mysteryLotsOpened >= 5) mark('binder_bandit');
  if (s.storageUnitsOpened >= 1) mark('storage_first');
  if (s.storageUnitsOpened >= 5) mark('storage_5');
  if (s.bundlesSold >= 10) mark('bundle_boss');
  if (s.auctionsWon >= 1) mark('auctioneer');
  if (s.auctionsWon >= 5) mark('auction_vulture');
  if (s.totalFeesPaid >= 1000) mark('feed_alive');
  if (s.highestSinglePurchase >= 1000) mark('whale_buy');
  if (s.negotiationsAccepted >= 1) mark('first_negotiation');
  if (s.conventionBuys >= 1) mark('first_convention');
  if (s.storefrontSales >= 1) mark('first_storefront_sale');
  if (s.crashesCaused >= 1) mark('crash_course');
  if ((s.fakeCardsSold ?? 0) >= 1) mark('fake_sale_1');
  if ((s.fakeCardsSold ?? 0) >= 5) mark('fake_sale_5');
  if ((s.fakeCardsSold ?? 0) >= 100) mark('fake_sale_100');
  if ((s.slabBagsOpened ?? 0) >= 1) mark('first_slab_bag');
  if ((s.slabBagsOpened ?? 0) >= 10) mark('slab_bag_10');
  if (s.gradingCompaniesUsed.length === 3) mark('grading_diversifier');
  if (s.gem10sToday >= 3) mark('triple_gem');
  if ((s.gradesReceived['10'] ?? 0) >= 1) mark('gem_mint_goblin');
  if ((s.gradesReceived['9'] ?? 0) + (s.gradesReceived['10'] ?? 0) + (s.gradesReceived['9.5'] ?? 0) >= 1)
    mark('first_grade');

  // Cash thresholds
  if (state.cash >= 5000) mark('mogul_5k');

  // Reputation
  if (state.reputation >= 50) mark('reputation_50');
  if (state.reputation >= 100) mark('reputation_100');

  // Net worth & day milestones use highestNetWorth + day
  if (s.highestNetWorth >= 25000) mark('mogul_25k');
  if (s.highestNetWorth >= 100000) mark('mogul_100k');
  if (s.highestNetWorth >= 1000000) mark('mogul_1m');
  if (state.day >= 10) mark('week_one');
  if (state.day >= 30) mark('marathon_30');
  if (state.day >= 50) mark('marathon_50');

  // Business level
  if (state.businessLevel >= 5) mark('national_reseller');
  if (state.businessLevel >= 6) mark('card_empire_level');

  // All sets
  const setEntries = Object.entries(setMap);
  if (setEntries.length > 0 && setEntries.every(([, m]) => m.owned === m.total)) {
    mark('all_sets');
  }

  // Top Pop: own a Gem 10 of every Mythic + Prototype card
  const ultraIds = CARDS.filter(
    (c) => c.rarity === 'Mythic Rare' || c.rarity === 'Prototype Card',
  ).map((c) => c.id);
  if (
    ultraIds.length > 0 &&
    ultraIds.every((id) => (state.collection[id]?.bestGrade ?? 0) >= 10)
  ) {
    mark('top_pop');
  }

  // Inventory-based
  if (state.inventory.length > 0) {
    const slabsOwned = state.inventory.filter((i) => i.status === 'graded').length;
    if (slabsOwned >= 5) mark('slab_lord');
  }
  const lifetimeSlabs = Object.entries(s.gradesReceived)
    .filter(([g]) => Number(g) >= 8)
    .reduce((sum, [, n]) => sum + n, 0);
  if (lifetimeSlabs >= 10) mark('slab_lord');

  if (state.inventory.length >= state.inventory.length) {
    // simple "pack rat" - inventory fully populated relative to current slot cap
    const slotsBonus = state.upgradesPurchased.includes('storage_shelves') ? 20 : 0;
    if (state.inventory.length >= 10 + slotsBonus) mark('pack_rat');
  }
  if (state.playerListings.length >= 5) mark('storefront_5');

  // Centering
  if (
    state.inventory.some(
      (i) => centeringScore(i.centeringOffsetX, i.centeringOffsetY) >= 100,
    )
  ) {
    mark('centered');
  }

  // Collection
  const owned = Object.keys(state.collection).length;
  if (owned >= CARDS.length) mark('codex_complete');
  if (Object.values(setMap).some((m) => m.owned === m.total)) {
    mark('set_completionist');
  }

  // Marketplaces
  if (state.marketplacesUnlocked.length >= MARKETPLACES.length) {
    mark('all_marketplaces');
  }

  // --- Context-specific ---
  if (ctx.kind === 'sold') {
    if (ctx.profitPct >= 200) mark('hidden_gem');
    if (ctx.profitPct <= -50) mark('bag_holder');
  }
  if (ctx.kind === 'bought' && ctx.isFake) mark('rugged');
  if (ctx.kind === 'slab_bag_opened') {
    if (ctx.isScam) mark('scam_bag');
    if (!ctx.isScam && ctx.grade >= 10) mark('slab_bag_jackpot');
  }
  if (ctx.kind === 'lot_opened' && ctx.rarities.some((r) => RARE_OR_BETTER.includes(r))) {
    mark('closet_treasure');
  }

  return newly;
}
