import { create } from 'zustand';
import type {
  AuctionListing,
  BulkGradeReveal,
  Employee,
  CardFlowEntry,
  EmployeeLogEntry,
  EmployeeRole,
  GameNotification,
  GameState,
  GradeHistoryEntry,
  GradingCompanyId,
  InventoryItem,
  MarketplaceListing,
  MarketplaceSource,
  MarketTrend,
  PlayerStats,
} from '../types';
import { generateListings } from '../game/listingGenerator';
import {
  calculateCurrentValue,
  computeSale,
} from '../game/economyEngine';
import { rollGrade } from '../game/gradingEngine';
import { generateGraderNote } from '../game/graderNotes';
import { pruneExpiredTrends, rollMarketEvent } from '../game/marketEvents';
import { loadGame, saveGame } from '../game/saveSystem';
import { chance, pick, rand, randInt, uid, weightedPick } from '../game/rng';
import { SELLER_NAMES } from '../data/listingTemplates';
import { getMarketplace, MARKETPLACES } from '../data/marketplaces';
import { UPGRADES, UPGRADE_EFFECTS } from '../data/upgrades';
import { getCardById } from '../data/cards';
import {
  EMPLOYEE_BREAKS,
  EMPLOYEE_BREAK_CHANCE,
  EMPLOYEE_NAMES,
  EMPLOYEE_SOCIAL_BREAKS,
  EMPLOYEE_SOCIAL_BREAK_CHANCE,
  EMPLOYEE_TIERS,
  EMPLOYEE_TIER_WEIGHTS,
  MISTAKE_LINES,
  OVERHEAD_LINES,
  employeeCap,
  getEmployeeRole,
  hireCost,
  mistakeCostRange,
  promoterRep,
  scoutBuyCap,
} from '../data/employees';
import {
  resolveMysteryLot,
  resolveSlabBag,
  resolveStorageUnit,
  sourceWholesaleCard,
} from '../game/lotResolver';
import { collectionSize, recordAcquisitions, recordGradeUpdate } from '../game/collection';
import { initialMarketNoise, stepMarketNoise } from '../game/marketNoise';
import { rollConvention } from '../game/conventions';
import { evaluateOffer } from '../game/negotiation';
import { BUSINESS_LEVELS, getBusinessLevel, getNextBusinessLevel } from '../data/businessLevels';
import {
  DEFAULT_LISTING_DURATION_MS,
  saleProbabilityPerTick,
} from '../game/storefront';
import { getGradingCompany } from '../data/gradingCompanies';
import { evaluateAchievements } from '../game/achievementsEngine';
import { ACHIEVEMENTS } from '../data/achievements';
import { SFX } from '../game/audio';
import {
  applyPlayerBid,
  generateAuctions,
  tickAuction,
} from '../game/auctionEngine';

const BASE_INVENTORY_SLOTS = 10;
const REFRESH_COOLDOWN_MS = 20_000;
const REFRESH_COOLDOWN_REDUCED_MS = 10_000;

export function refreshCooldownMs(state: { upgradesPurchased: string[] }): number {
  return state.upgradesPurchased.includes('deal_bot') || state.upgradesPurchased.includes('deal_bot_pro')
    ? REFRESH_COOLDOWN_REDUCED_MS
    : REFRESH_COOLDOWN_MS;
}

export function feeDiscountFor(state: {
  upgradesPurchased: string[];
  businessLevel: number;
}): number {
  let d = 0;
  if (state.upgradesPurchased.includes('auto_lister')) d += 0.25;
  if (state.upgradesPurchased.includes('auto_lister_2')) d += 0.25;
  d += getBusinessLevel(state.businessLevel).feeDiscount;
  return Math.min(0.6, d);
}

export function vaultStableFor(state: { upgradesPurchased: string[] }): boolean {
  return state.upgradesPurchased.includes('hire_vault_keeper');
}

/** Inventory slots in use. Showcased cards are display-only and don't count. */
export function occupiedSlots(state: {
  inventory: InventoryItem[];
  showcaseItemIds: string[];
}): number {
  if (state.showcaseItemIds.length === 0) return state.inventory.length;
  const showcased = new Set(state.showcaseItemIds);
  return state.inventory.filter((i) => !showcased.has(i.id)).length;
}

/** Effective FeeBay storefront fee rate (0..1) charged on withdraw. */
export function storefrontFeeRate(state: { upgradesPurchased: string[]; businessLevel: number }): number {
  const b = storefrontFeeBreakdown(state);
  return b.rate;
}

/** Detailed breakdown of how the storefront fee was computed, for UI. */
export function storefrontFeeBreakdown(state: {
  upgradesPurchased: string[];
  businessLevel: number;
}): {
  base: number;
  upgradeReduction: number;
  businessDiscount: number;
  rate: number;
} {
  const base = 0.14;
  let upgradeReduction = 0;
  if (state.upgradesPurchased.includes('verified_seller')) upgradeReduction += 0.04;
  if (state.upgradesPurchased.includes('top_seller')) upgradeReduction += 0.06;
  const afterUpgrades = Math.max(0, base - upgradeReduction);
  const businessDiscount = getBusinessLevel(state.businessLevel).feeDiscount;
  const rate = +(afterUpgrades * (1 - businessDiscount)).toFixed(4);
  return { base, upgradeReduction, businessDiscount, rate };
}

export function listingCountFor(state: { businessLevel: number }): number {
  return 12 + getBusinessLevel(state.businessLevel).bonusListings;
}

function emptyStats(): PlayerStats {
  return {
    totalBought: 0,
    totalSold: 0,
    totalProfit: 0,
    totalFeesPaid: 0,
    bestSaleProfit: 0,
    biggestLoss: 0,
    gradesReceived: {},
    mysteryLotsOpened: 0,
    auctionsWon: 0,
    highestSinglePurchase: 0,
    bundlesSold: 0,
    storageUnitsOpened: 0,
    gradingCompaniesUsed: [],
    negotiationsAccepted: 0,
    conventionBuys: 0,
    gem10sToday: 0,
    highestReputation: 0,
    highestNetWorth: 0,
    storefrontSales: 0,
    storefrontRevenue: 0,
    crashesCaused: 0,
    fakeCardsSold: 0,
    slabBagsOpened: 0,
  };
}

export const DAY_LENGTH_MS = 4 * 60 * 1000; // 4 real minutes per in-game day

export function dayPhase(state: GameState, now: number): {
  phase: 'morning' | 'afternoon' | 'evening' | 'night';
  progress: number;
} {
  const elapsed = Math.max(0, now - state.dayStartedAt);
  const progress = Math.min(1, elapsed / DAY_LENGTH_MS);
  if (progress < 0.25) return { phase: 'morning', progress };
  if (progress < 0.5) return { phase: 'afternoon', progress };
  if (progress < 0.8) return { phase: 'evening', progress };
  return { phase: 'night', progress };
}

function defaultState(): GameState {
  const now = Date.now();
  return {
    cash: 100,
    reputation: 0,
    businessLevel: 1,
    day: 1,
    dayStartedAt: now,
    dayStartStats: {
      cash: 100,
      bought: 0,
      sold: 0,
      profit: 0,
      fees: 0,
      gradesCount: 0,
      collectionSize: 0,
      bestSale: 0,
      biggestLoss: 0,
    },
    marketplacesUnlocked: ['FeeBay'],
    listings: [],
    inventory: [],
    gradingSubmissions: [],
    upgradesPurchased: [],
    marketTrends: [],
    notifications: [],
    stats: emptyStats(),
    lastListingRefresh: 0,
    lastMarketEvent: 0,
    pendingGradeReveals: [],
    pendingBulkReveal: [],
    gradingHistory: [],
    pendingLotReveals: [],
    achievementsUnlocked: [],
    achievementsClaimed: [],
    netWorthSamples: [],
    netWorthHistory: [],
    auctions: [],
    lastAuctionRefresh: 0,
    hasSeenIntro: false,
    collection: {},
    pendingEndOfDay: null,
    marketNoise: initialMarketNoise(),
    marketNoisePrev: initialMarketNoise(),
    lastMarketNoiseTick: now,
    watchedCardIds: [],
    watchAlertBaseline: {},
    convention: null,
    recentSellsByTag: {},
    lastConventionAt: 0,
    playerListings: [],
    showcaseItemIds: [],
    storefrontHistory: [],
    pendingPayments: [],
    storefrontBalance: 0,
    autoWithdrawEnabled: false,
    employees: [],
    companyProfit: 0,
    companyProfitHistory: [],
    cardFlow: [],
    operatingCosts: {},
    cheatsConsoleOpen: false,
    ui: {
      inventoryFilter: 'all',
      inventorySortKey: 'recent',
      marketplaceActiveSource: 'all',
      primaryMarketplace: 'FeeBay',
    },
  };
}

/** Cheats available from the hidden `/cheats` developer console. */
export type CheatId =
  | 'cash'
  | 'unlock_upgrades'
  | 'unlock_marketplaces'
  | 'max_reputation'
  | 'max_business'
  | 'skip_day'
  | 'unlock_achievements';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

type Actions = {
  init(): void;
  refreshListings(opts?: { force?: boolean }): boolean;
  buyListing(listingId: string, opts?: { byHelper?: boolean; silent?: boolean }): void;
  sellInventoryItem(
    itemId: string,
    marketplace?: MarketplaceSource,
    opts?: { silent?: boolean },
  ): { profit: number; net: number } | null;
  sendToGrading(itemId: string, companyId: GradingCompanyId): void;
  /** Manually reveal a submission whose timer is up. Rolls the grade, updates inventory/stats, queues a reveal modal entry. */
  revealGradingSubmission(submissionId: string): void;
  /** Reveal every ready submission at once. Populates pendingBulkReveal for the cinematic modal. Requires mass_grade_reveal upgrade. */
  revealAllReadyGrading(): void;
  /** Clear the bulk reveal queue once the modal has played through. */
  consumeBulkReveal(): void;
  consumeGradeReveal(submissionId: string): void;
  consumeLotReveal(lotId: string): void;
  triggerMarketEvent(): void;
  tickTrends(): void;
  purchaseUpgrade(upgradeId: string): void;
  pushNotification(message: string, kind?: GameNotification['kind']): void;
  dismissNotification(id: string): void;
  dismissAllNotifications(): void;
  hasUpgrade(effect: string): boolean;
  inventorySlots(): number;
  resetGame(): void;
  save(): void;
  tryUnlockMarketplaces(): void;
  unlockAchievements(ids: string[]): void;
  refreshAuctions(): void;
  tickListings(): void;
  placeBid(auctionId: string, amount?: number): void;
  setAutoSnipeMax(auctionId: string, max: number | undefined): void;
  buyoutAuction(auctionId: string): void;
  tickAuctions(): void;
  sampleNetWorth(): void;
  setSeenIntro(seen: boolean): void;
  sellBundle(itemIds: string[], marketplace?: MarketplaceSource): void;
  tickDay(): void;
  tickMarketNoise(): void;
  consumeEndOfDayReport(): void;
  toggleWatch(cardId: string): void;
  startConvention(): void;
  tickConvention(): void;
  hireEmployee(role: EmployeeRole): void;
  fireEmployee(employeeId: string): void;
  claimStockItem(itemId: string): void;
  tickEmployees(): void;
  promoteBusinessLevel(): void;
  toggleShowcase(itemId: string): void;
  setInventoryFilter(filter: GameState['ui']['inventoryFilter']): void;
  setInventorySortKey(key: GameState['ui']['inventorySortKey']): void;
  setMarketplaceActiveSource(src: GameState['ui']['marketplaceActiveSource']): void;
  setPrimaryMarketplace(src: MarketplaceSource): void;
  negotiate(
    listingId: string,
    offer: number,
  ): { kind: 'accept' | 'counter' | 'reject'; price?: number; flavor: string } | null;
  listForSale(
    itemId: string,
    marketplace: MarketplaceSource,
    price: number,
    durationMs?: number,
  ): void;
  delistFromStorefront(listingId: string): void;
  tickPlayerListings(): void;
  /** Move the storefront wallet balance into cash. */
  withdrawStorefront(): void;
  /** Toggle the player's auto-withdraw preference. No-op if the upgrade isn't owned. */
  setAutoWithdraw(enabled: boolean): void;
  claimAchievement(id: string): void;
  claimAllAchievements(): void;
  /** central evaluation hook */
  evaluateAndApplyAchievements(ctx: Parameters<typeof evaluateAchievements>[1]): void;
  /** Open the hidden `/cheats` developer console (and grant its easter-egg achievement). */
  openCheatsConsole(): void;
  /** Close the developer console. */
  closeCheatsConsole(): void;
  /** Apply a developer cheat. `amount` is only used by the `cash` cheat. */
  applyCheat(cheat: CheatId, amount?: number): void;
};

export type GameStore = GameState & Actions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultState(),

  init() {
    const loaded = loadGame();
    if (loaded) {
      set({ ...defaultState(), ...loaded });
    }
    // Heal any inventory items stuck at status 'listed' without a matching active listing
    // (legacy bug: cancelled-pending-payment cards returned with their pre-cancel status).
    const s = get();
    const listedIds = new Set(s.playerListings.map((l) => l.itemId));
    const pendingIds = new Set(s.pendingPayments.map((p) => p.item.id));
    const fixed = s.inventory.map((i) => {
      if (i.status !== 'listed') return i;
      if (listedIds.has(i.id) || pendingIds.has(i.id)) return i;
      return { ...i, status: i.grade !== undefined ? ('graded' as const) : ('raw' as const) };
    });
    if (fixed.some((i, idx) => i !== s.inventory[idx])) {
      set({ inventory: fixed });
    }
    // Drop any auctions saved in the pre-rework format (no rival roster).
    if (get().auctions.some((a) => !Array.isArray(a.rivals))) {
      set({ auctions: [] });
    }
    if (get().listings.length === 0) {
      get().refreshListings();
    }
    // Re-push earned achievements to Steam — covers saves made before the Steam
    // integration and any achievements earned while offline. Steam ignores dupes.
    const steam = window.feebay?.steam;
    if (steam?.available) {
      for (const id of get().achievementsUnlocked) steam.unlockAchievement(id);
    }
  },

  refreshListings(opts) {
    const state = get();
    const now = Date.now();
    if (!opts?.force) {
      const cooldown = refreshCooldownMs(state);
      if (now - state.lastListingRefresh < cooldown) return false;
    }
    const listings = generateListings(
      state.marketplacesUnlocked,
      state.marketTrends,
      listingCountFor(state),
      state.reputation,
    );
    set({ listings, lastListingRefresh: now });
    SFX.whoosh();
    return true;
  },

  buyListing(listingId, opts) {
    const state = get();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return;
    if (state.cash < listing.askingPrice) {
      if (!opts?.silent) get().pushNotification("Not enough cash for that listing.", 'warning');
      return;
    }

    const isMysteryLot = listing.lotType === 'mystery_lot' || listing.lotType === 'binder';
    const isStorageUnit = listing.lotType === 'storage_unit';
    const slots = get().inventorySlots();

    if (isMysteryLot || isStorageUnit) {
      const { items } = isStorageUnit
        ? resolveStorageUnit(listing, listing.source)
        : resolveMysteryLot(listing, listing.source);
      if (occupiedSlots(state) + items.length > slots) {
        get().pushNotification(
          `Lot has ${items.length} cards, only ${slots - occupiedSlots(state)} slots free.`,
          'warning',
        );
        return;
      }
      const estimatedValue = items.reduce((s, i) => s + i.baseValue, 0);
      const { collection, newCardIds } = recordAcquisitions(state.collection, items);
      const lotKind = isStorageUnit ? 'storage_unit' : listing.lotType === 'binder' ? 'binder' : 'mystery';
      const duringConvention = !!state.convention && state.convention.endsAt > Date.now();
      set({
        cash: +(state.cash - listing.askingPrice).toFixed(2),
        inventory: [...state.inventory, ...items],
        listings: state.listings.filter((l) => l.id !== listingId),
        collection,
        pendingLotReveals: [
          ...state.pendingLotReveals,
          {
            id: uid('lot_'),
            source: listing.source,
            pricePaid: listing.askingPrice,
            itemIds: items.map((i) => i.id),
            estimatedValue,
            lotKind,
          },
        ],
        stats: {
          ...state.stats,
          totalBought: state.stats.totalBought + 1,
          mysteryLotsOpened: state.stats.mysteryLotsOpened + (isStorageUnit ? 0 : 1),
          storageUnitsOpened: state.stats.storageUnitsOpened + (isStorageUnit ? 1 : 0),
          highestSinglePurchase: Math.max(state.stats.highestSinglePurchase, listing.askingPrice),
          conventionBuys: state.stats.conventionBuys + (duringConvention ? 1 : 0),
        },
      });
      SFX.buy();
      if (isStorageUnit) {
        get().pushNotification(
          `Hauled a storage unit from ${listing.source} ($${listing.askingPrice}). ${items.length} cards inside.`,
          'success',
        );
      } else {
        get().pushNotification(
          `Opened a ${listing.lotType.replace('_', ' ')} from ${listing.source} ($${listing.askingPrice}).`,
          'success',
        );
      }
      if (newCardIds.length > 0) {
        get().pushNotification(
          `+${newCardIds.length} new card${newCardIds.length === 1 ? '' : 's'} for the collection.`,
          'success',
        );
      }
      get().evaluateAndApplyAchievements({
        kind: 'lot_opened',
        rarities: items.map((i) => i.rarity),
        total: items.length,
        isStorageUnit,
      });
      get().evaluateAndApplyAchievements({ kind: 'bought', isFake: items.some((i) => i.isFake) });
      get().save();
      return;
    }

    if (listing.lotType === 'slab_bag') {
      if (occupiedSlots(state) >= slots) {
        get().pushNotification('Inventory full. Sell or buy more storage.', 'warning');
        return;
      }
      const { item, isScam } = resolveSlabBag(listing, listing.source);
      const { collection, newCardIds } = recordAcquisitions(state.collection, [item]);
      const duringConvention = !!state.convention && state.convention.endsAt > Date.now();
      set({
        cash: +(state.cash - listing.askingPrice).toFixed(2),
        inventory: [...state.inventory, item],
        listings: state.listings.filter((l) => l.id !== listingId),
        collection,
        pendingLotReveals: [
          ...state.pendingLotReveals,
          {
            id: uid('lot_'),
            source: listing.source,
            pricePaid: listing.askingPrice,
            itemIds: [item.id],
            estimatedValue: item.baseValue,
            lotKind: 'slab_bag',
          },
        ],
        stats: {
          ...state.stats,
          totalBought: state.stats.totalBought + 1,
          slabBagsOpened: (state.stats.slabBagsOpened ?? 0) + 1,
          highestSinglePurchase: Math.max(state.stats.highestSinglePurchase, listing.askingPrice),
          conventionBuys: state.stats.conventionBuys + (duringConvention ? 1 : 0),
        },
      });
      SFX.buy();
      if (isScam) {
        get().pushNotification(
          `That ${listing.source} slab bag was a SCAM — a junk-grade slab dressed up for premium money.`,
          'warning',
        );
      } else {
        get().pushNotification(
          `Opened a slab bag from ${listing.source} ($${listing.askingPrice}) — ${item.gradeLabel} ${item.name} inside.`,
          'success',
        );
      }
      if (newCardIds.length > 0) {
        get().pushNotification(`New card added to collection: ${item.name}.`, 'success');
      }
      get().evaluateAndApplyAchievements({
        kind: 'slab_bag_opened',
        grade: item.grade ?? 0,
        isScam,
      });
      get().save();
      return;
    }

    if (occupiedSlots(state) >= slots) {
      if (!opts?.silent) get().pushNotification('Inventory full. Sell or buy more storage.', 'warning');
      return;
    }
    const isSlabListing =
      listing.lotType === 'slab' && listing.grade !== undefined && listing.gradingCompany;
    // Inventory carries the card's real name & set, not the seller's clickbait
    // listing title — fall back to the cleaned title only if the id is unknown.
    let invName = cleanTitle(listing.title);
    let invSet = '';
    try {
      const def = getCardById(listing.cardId);
      invName = def.name;
      invSet = def.set;
    } catch {
      /* unknown card id — keep the cleaned listing title */
    }
    const item: InventoryItem = {
      id: uid('inv_'),
      cardId: listing.cardId,
      name: invName,
      set: invSet,
      rarity: listing.rarity,
      rawCondition: listing.rawCondition,
      actualConditionScore: listing.actualConditionScore,
      centeringOffsetX: listing.centeringOffsetX,
      centeringOffsetY: listing.centeringOffsetY,
      purchasePrice: listing.askingPrice,
      baseValue: listing.trueMarketValue,
      status: isSlabListing ? 'graded' : 'raw',
      grade: isSlabListing ? listing.grade : undefined,
      gradeLabel: isSlabListing
        ? listing.grade === 10
          ? `${listing.gradingCompany} GEM 10`
          : `${listing.gradingCompany} ${listing.grade}`
        : undefined,
      gradingCompany: isSlabListing ? listing.gradingCompany : undefined,
      acquiredFrom: listing.source,
      acquiredAt: Date.now(),
      isFake: listing.isFake,
      autoBought: !!opts?.byHelper,
      hue: Math.floor((Math.abs(hashString(listing.cardId)) % 360)),
    };
    const acq = recordAcquisitions(state.collection, [item]);
    const duringConvention = !!state.convention && state.convention.endsAt > Date.now();
    set({
      cash: +(state.cash - listing.askingPrice).toFixed(2),
      inventory: [...state.inventory, item],
      listings: state.listings.filter((l) => l.id !== listingId),
      collection: acq.collection,
      stats: {
        ...state.stats,
        totalBought: state.stats.totalBought + 1,
        highestSinglePurchase: Math.max(state.stats.highestSinglePurchase, listing.askingPrice),
        conventionBuys: state.stats.conventionBuys + (duringConvention ? 1 : 0),
      },
    });
    if (!opts?.silent) {
      if (acq.newCardIds.length > 0) {
        get().pushNotification(`New card added to collection: ${item.name}.`, 'success');
      }
      SFX.buy();
      get().pushNotification(
        `Bought "${listing.title}" for $${listing.askingPrice} on ${listing.source}.`,
        'success',
      );
    }
    get().evaluateAndApplyAchievements({ kind: 'bought', isFake: listing.isFake });
    get().save();
  },

  sellInventoryItem(itemId, marketplaceOverride, opts) {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.status === 'grading' || item.status === 'sold') return null;
    if (state.showcaseItemIds.includes(itemId)) {
      get().pushNotification('This card is in your showcase. Remove it first.', 'warning');
      return null;
    }
    const marketplaceId: MarketplaceSource =
      marketplaceOverride ?? (item.status === 'graded' && state.marketplacesUnlocked.includes('SlabHub') ? 'SlabHub' : 'FeeBay');
    if (!state.marketplacesUnlocked.includes(marketplaceId)) {
      get().pushNotification(`${marketplaceId} is locked.`, 'warning');
      return null;
    }
    const mkt = getMarketplace(marketplaceId);
    const value = calculateCurrentValue(item, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state));
    const gross = Math.max(1, Math.round(value * 0.95));
    const feeDiscount = feeDiscountFor(state);
    const sale = computeSale(gross, mkt, feeDiscount);
    const profit = +(sale.net - item.purchasePrice).toFixed(2);
    const profitPct = (profit / Math.max(1, item.purchasePrice)) * 100;
    const fees = +(sale.sellerFee + sale.paymentFee + sale.flatFee).toFixed(2);
    const newStats: PlayerStats = {
      ...state.stats,
      totalSold: state.stats.totalSold + 1,
      totalProfit: +(state.stats.totalProfit + profit).toFixed(2),
      totalFeesPaid: +(state.stats.totalFeesPaid + fees).toFixed(2),
      bestSaleProfit: Math.max(state.stats.bestSaleProfit, profit),
      biggestLoss: Math.min(state.stats.biggestLoss, profit),
    };
    // Track tag sells for reactive supply-crash events
    const card = getCardById(item.cardId);
    const updatedSells = { ...state.recentSellsByTag };
    const now = Date.now();
    for (const tag of card.trendTags) {
      const cur = updatedSells[tag];
      const fresh = cur && now - cur.lastAt < 90_000 ? cur.count : 0;
      updatedSells[tag] = { count: fresh + 1, lastAt: now };
    }
    set({
      cash: +(state.cash + sale.net).toFixed(2),
      inventory: state.inventory.filter((i) => i.id !== itemId),
      reputation: state.reputation + (profit > 0 ? 1 : 0),
      stats: newStats,
      recentSellsByTag: updatedSells,
    });
    if (!opts?.silent) {
      if (profit >= 0) {
        SFX.chaching();
        get().pushNotification(
          `Sold ${item.name} on ${marketplaceId} for $${sale.net.toFixed(2)} (+$${profit.toFixed(2)})`,
          'success',
        );
      } else {
        SFX.loss();
        get().pushNotification(
          `Sold ${item.name} for $${sale.net.toFixed(2)} (loss $${profit.toFixed(2)})`,
          'warning',
        );
      }
    }
    // Reactive: if any tag has been mass-sold (5+ in 90s), trigger a supply crash event for it
    for (const [tag, info] of Object.entries(updatedSells)) {
      if (info.count >= 5) {
        const trend: MarketTrend = {
          tag,
          label: `Supply crash: too many [${tag}] cards hit the market.`,
          direction: 'down',
          multiplier: +rand(0.55, 0.78).toFixed(2),
          expiresAt: now + 75_000,
        };
        set((s) => ({
          marketTrends: [...s.marketTrends, trend],
          recentSellsByTag: { ...s.recentSellsByTag, [tag]: { count: 0, lastAt: now } },
          stats: { ...s.stats, crashesCaused: s.stats.crashesCaused + 1 },
        }));
        get().pushNotification(trend.label, 'event');
        SFX.marketEvent();
        get().evaluateAndApplyAchievements({ kind: 'crash_caused' });
        break;
      }
    }
    get().tryUnlockMarketplaces();
    get().evaluateAndApplyAchievements({ kind: 'sold', profit, profitPct, item });
    get().save();
    return { profit, net: sale.net };
  },

  sellBundle(itemIds, marketplaceOverride) {
    const state = get();
    if (itemIds.length < 2) {
      get().pushNotification('A bundle needs at least 2 cards.', 'warning');
      return;
    }
    if (itemIds.some((id) => state.showcaseItemIds.includes(id))) {
      get().pushNotification('Bundle contains a showcased card. Remove it from showcase first.', 'warning');
      return;
    }
    const items = itemIds
      .map((id) => state.inventory.find((i) => i.id === id))
      .filter((i): i is InventoryItem => !!i && i.status === 'raw');
    if (items.length !== itemIds.length) {
      get().pushNotification('Bundle includes a card that can\'t be sold right now.', 'warning');
      return;
    }
    const marketplaceId: MarketplaceSource =
      marketplaceOverride && state.marketplacesUnlocked.includes(marketplaceOverride)
        ? marketplaceOverride
        : 'FeeBay';
    if (!state.marketplacesUnlocked.includes(marketplaceId)) {
      get().pushNotification(`${marketplaceId} is locked.`, 'warning');
      return;
    }
    const mkt = getMarketplace(marketplaceId);
    // Bundles take a value haircut (90% vs 95%) but pay seller/payment fees once on the sum
    // and the flat fee once. Net win for stacks of low-value commons.
    const totalValue = items.reduce(
      (sum, i) => sum + calculateCurrentValue(i, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state)),
      0,
    );
    const gross = Math.max(items.length, Math.round(totalValue * 0.9));
    const feeDiscount = feeDiscountFor(state);
    const sale = computeSale(gross, mkt, feeDiscount);
    const totalCost = items.reduce((sum, i) => sum + i.purchasePrice, 0);
    const profit = +(sale.net - totalCost).toFixed(2);
    const profitPct = (profit / Math.max(1, totalCost)) * 100;
    const fees = +(sale.sellerFee + sale.paymentFee + sale.flatFee).toFixed(2);
    const newStats: PlayerStats = {
      ...state.stats,
      totalSold: state.stats.totalSold + items.length,
      totalProfit: +(state.stats.totalProfit + profit).toFixed(2),
      totalFeesPaid: +(state.stats.totalFeesPaid + fees).toFixed(2),
      bestSaleProfit: Math.max(state.stats.bestSaleProfit, profit),
      biggestLoss: Math.min(state.stats.biggestLoss, profit),
      bundlesSold: state.stats.bundlesSold + 1,
    };
    const idSet = new Set(itemIds);
    set({
      cash: +(state.cash + sale.net).toFixed(2),
      inventory: state.inventory.filter((i) => !idSet.has(i.id)),
      reputation: state.reputation + (profit > 0 ? Math.max(1, Math.floor(items.length / 3)) : 0),
      stats: newStats,
    });
    if (profit >= 0) {
      SFX.chaching();
      get().pushNotification(
        `Bundle of ${items.length} sold on ${marketplaceId} for $${sale.net.toFixed(2)} (+$${profit.toFixed(2)})`,
        'success',
      );
    } else {
      SFX.loss();
      get().pushNotification(
        `Bundle of ${items.length} sold for $${sale.net.toFixed(2)} (loss $${profit.toFixed(2)})`,
        'warning',
      );
    }
    get().tryUnlockMarketplaces();
    get().evaluateAndApplyAchievements({
      kind: 'sold',
      profit,
      profitPct,
      item: items[0],
    });
    get().save();
  },

  sendToGrading(itemId, companyId) {
    const state = get();
    const company = getGradingCompany(companyId);
    if (!state.upgradesPurchased.includes(company.unlockUpgradeId)) {
      get().pushNotification(`${company.name} membership is locked.`, 'warning');
      return;
    }
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.status !== 'raw') return;
    if (state.showcaseItemIds.includes(itemId)) {
      get().pushNotification('This card is in your showcase. Remove it first.', 'warning');
      return;
    }
    const bulkDiscount = state.upgradesPurchased.includes('bulk_grade') ? 0.2 : 0;
    const express = state.upgradesPurchased.includes('express_grading');
    const baseCost = Math.max(1, Math.round(company.cost * (1 - bulkDiscount)));
    const shippingFee = company.shippingFee;
    const totalCost = baseCost + shippingFee;
    const turnaround = express ? Math.round(company.turnaroundMs * 0.5) : company.turnaroundMs;
    if (state.cash < totalCost) {
      get().pushNotification('Not enough cash to grade.', 'warning');
      return;
    }
    const submission = {
      id: uid('grd_'),
      itemId,
      cardName: item.name,
      cost: totalCost,
      shippingFee,
      submittedAt: Date.now(),
      resolveAt: Date.now() + turnaround,
      company: company.id,
    };
    set({
      cash: +(state.cash - totalCost).toFixed(2),
      inventory: state.inventory.map((i) =>
        i.id === itemId ? { ...i, status: 'grading', gradingCompany: company.id } : i,
      ),
      gradingSubmissions: [...state.gradingSubmissions, submission],
    });
    SFX.click();
    get().pushNotification(
      `Sent ${item.name} to ${company.name} ($${baseCost} + $${shippingFee} shipping${express ? ', express' : ''}).`,
      'info',
    );
    get().save();
  },

  revealGradingSubmission(submissionId) {
    const state = get();
    const sub = state.gradingSubmissions.find((s) => s.id === submissionId);
    if (!sub) return;
    if (Date.now() < sub.resolveAt) return; // not yet ready
    const item = state.inventory.find((i) => i.id === sub.itemId);
    if (!item) {
      // Stale submission; just drop it.
      set({ gradingSubmissions: state.gradingSubmissions.filter((s) => s.id !== submissionId) });
      return;
    }
    // Raw market value just before grading — for the history before/after.
    const rawValue = calculateCurrentValue(
      item,
      state.marketTrends,
      state.marketNoise,
      state.convention,
      vaultStableFor(state),
    );
    const result = rollGrade(item, sub.company);
    const updated: InventoryItem = {
      ...item,
      status: 'graded',
      grade: result.grade,
      gradeLabel: result.label,
      gradingCompany: result.company,
    };
    const inventory = state.inventory.map((i) => (i.id === item.id ? updated : i));
    const finalValue = calculateCurrentValue(updated, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state));
    const historyEntry = {
      id: uid('gh_'),
      cardId: item.cardId,
      cardName: item.name,
      rarity: item.rarity,
      hue: item.hue,
      centeringOffsetX: item.centeringOffsetX,
      centeringOffsetY: item.centeringOffsetY,
      grade: result.grade,
      gradeLabel: result.label,
      gradingCompany: result.company,
      rawValue,
      gradedValue: finalValue,
      cost: sub.cost,
      graderNote: generateGraderNote(item, result.grade),
      gradedAt: Date.now(),
    };
    const reveal = {
      submissionId: sub.id,
      itemId: item.id,
      finalValue,
      grade: result.grade,
      gradeLabel: result.label,
      company: result.company,
    };
    const stats = {
      ...state.stats,
      gradesReceived: { ...state.stats.gradesReceived },
      gradingCompaniesUsed: [...state.stats.gradingCompaniesUsed],
    };
    const key = String(result.grade);
    stats.gradesReceived[key] = (stats.gradesReceived[key] ?? 0) + 1;
    if (!stats.gradingCompaniesUsed.includes(result.company)) {
      stats.gradingCompaniesUsed.push(result.company);
    }
    if (result.grade >= 10) stats.gem10sToday = (stats.gem10sToday ?? 0) + 1;
    const collection = recordGradeUpdate(state.collection, item.cardId, result.grade);
    set({
      inventory,
      pendingGradeReveals: [...state.pendingGradeReveals, reveal],
      gradingSubmissions: state.gradingSubmissions.filter((s) => s.id !== submissionId),
      stats,
      collection,
      gradingHistory: [historyEntry, ...state.gradingHistory].slice(0, 40),
    });
    get().evaluateAndApplyAchievements({ kind: 'graded', grade: result.grade, item: updated });
    get().save();
  },

  revealAllReadyGrading() {
    const state = get();
    if (!state.upgradesPurchased.includes('mass_grade_reveal')) {
      get().pushNotification('Buy the Mass-Reveal Cracker upgrade first.', 'warning');
      return;
    }
    const now = Date.now();
    const ready = state.gradingSubmissions.filter((s) => s.resolveAt <= now);
    if (ready.length === 0) return;

    let inventory = state.inventory;
    let collection = state.collection;
    const stats = {
      ...state.stats,
      gradesReceived: { ...state.stats.gradesReceived },
      gradingCompaniesUsed: [...state.stats.gradingCompaniesUsed],
    };
    const bulkReveals: BulkGradeReveal[] = [];
    const gradedItems: InventoryItem[] = [];
    const historyEntries: GradeHistoryEntry[] = [];

    for (const sub of ready) {
      const item = inventory.find((i) => i.id === sub.itemId);
      if (!item) continue;
      const rawValue = calculateCurrentValue(
        item,
        state.marketTrends,
        state.marketNoise,
        state.convention,
        vaultStableFor(state),
      );
      const result = rollGrade(item, sub.company);
      const updated: InventoryItem = {
        ...item,
        status: 'graded',
        grade: result.grade,
        gradeLabel: result.label,
        gradingCompany: result.company,
      };
      inventory = inventory.map((i) => (i.id === item.id ? updated : i));
      const finalValue = calculateCurrentValue(updated, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state));
      historyEntries.push({
        id: uid('gh_'),
        cardId: item.cardId,
        cardName: item.name,
        rarity: item.rarity,
        hue: item.hue,
        centeringOffsetX: item.centeringOffsetX,
        centeringOffsetY: item.centeringOffsetY,
        grade: result.grade,
        gradeLabel: result.label,
        gradingCompany: result.company,
        rawValue,
        gradedValue: finalValue,
        cost: sub.cost,
        graderNote: generateGraderNote(item, result.grade),
        gradedAt: Date.now(),
      });
      const key = String(result.grade);
      stats.gradesReceived[key] = (stats.gradesReceived[key] ?? 0) + 1;
      if (!stats.gradingCompaniesUsed.includes(result.company)) {
        stats.gradingCompaniesUsed.push(result.company);
      }
      if (result.grade >= 10) stats.gem10sToday = (stats.gem10sToday ?? 0) + 1;
      collection = recordGradeUpdate(collection, item.cardId, result.grade);
      bulkReveals.push({
        itemId: item.id,
        cardId: item.cardId,
        cardName: item.name,
        rarity: item.rarity,
        hue: item.hue,
        centeringOffsetX: item.centeringOffsetX,
        centeringOffsetY: item.centeringOffsetY,
        grade: result.grade,
        gradeLabel: result.label,
        company: result.company,
        paid: item.purchasePrice,
        finalValue,
        profit: +(finalValue - item.purchasePrice).toFixed(2),
      });
      gradedItems.push(updated);
    }

    const readyIds = new Set(ready.map((s) => s.id));
    set({
      inventory,
      gradingSubmissions: state.gradingSubmissions.filter((s) => !readyIds.has(s.id)),
      stats,
      collection,
      pendingBulkReveal: bulkReveals,
      gradingHistory: [...historyEntries, ...state.gradingHistory].slice(0, 40),
    });

    for (const item of gradedItems) {
      get().evaluateAndApplyAchievements({ kind: 'graded', grade: item.grade ?? 0, item });
    }
    get().save();
  },

  consumeBulkReveal() {
    set({ pendingBulkReveal: [] });
    get().save();
  },

  consumeGradeReveal(submissionId) {
    set((state) => ({
      pendingGradeReveals: state.pendingGradeReveals.filter((r) => r.submissionId !== submissionId),
    }));
  },

  consumeLotReveal(lotId) {
    set((state) => ({
      pendingLotReveals: state.pendingLotReveals.filter((l) => l.id !== lotId),
    }));
  },

  triggerMarketEvent() {
    const now = Date.now();
    const event = rollMarketEvent(now);
    set((state) => ({
      marketTrends: [...state.marketTrends, event],
      lastMarketEvent: now,
    }));
    SFX.marketEvent();
    get().pushNotification(event.label, 'event');
    get().save();
  },

  tickTrends() {
    const now = Date.now();
    const pruned = pruneExpiredTrends(get().marketTrends, now);
    if (pruned.length !== get().marketTrends.length) {
      set({ marketTrends: pruned });
    }
  },

  purchaseUpgrade(upgradeId) {
    const upg = UPGRADES.find((u) => u.id === upgradeId);
    const state = get();
    if (!upg) return;
    if (state.upgradesPurchased.includes(upgradeId)) return;
    if (state.cash < upg.cost) {
      get().pushNotification('Not enough cash.', 'warning');
      return;
    }
    set({
      cash: +(state.cash - upg.cost).toFixed(2),
      upgradesPurchased: [...state.upgradesPurchased, upgradeId],
    });
    SFX.coin();
    get().pushNotification(`Upgrade unlocked: ${upg.name}`, 'success');
    get().save();
  },

  pushNotification(message, kind = 'info') {
    const note: GameNotification = {
      id: uid('n_'),
      message,
      kind,
      createdAt: Date.now(),
    };
    set((s) => ({ notifications: [note, ...s.notifications].slice(0, 12) }));
  },

  dismissNotification(id) {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  dismissAllNotifications() {
    set({ notifications: [] });
  },

  hasUpgrade(effect) {
    const ids = get().upgradesPurchased;
    return UPGRADES.some((u) => u.effect === effect && ids.includes(u.id));
  },

  inventorySlots() {
    const state = get();
    const u = state.upgradesPurchased;
    let bonus = 0;
    if (u.includes('storage_shelves')) bonus += 20;
    if (u.includes('storage_shelves_2')) bonus += 30;
    if (u.includes('storage_vault')) bonus += 100;
    const levelBonus = getBusinessLevel(state.businessLevel).bonusInventorySlots;
    return BASE_INVENTORY_SLOTS + bonus + levelBonus;
  },

  tickMarketNoise() {
    const state = get();
    const now = Date.now();
    if (state.lastMarketNoiseTick && now - state.lastMarketNoiseTick < 12_000) return;
    const next = stepMarketNoise(state.marketNoise);
    set({
      marketNoise: next,
      marketNoisePrev: state.marketNoise,
      lastMarketNoiseTick: now,
    });
    // Fire watch alerts for cards that have moved >15% from their last alert baseline.
    const baseline = { ...state.watchAlertBaseline };
    for (const cardId of state.watchedCardIds) {
      const cur = next[cardId] ?? 1;
      const base = baseline[cardId] ?? 1;
      const drift = cur - base;
      if (Math.abs(drift) >= 0.15) {
        const card = (() => {
          try {
            return getCardById(cardId);
          } catch {
            return null;
          }
        })();
        if (card) {
          const pct = (drift * 100).toFixed(1);
          get().pushNotification(
            drift > 0
              ? `Watchlist: ${card.name} popped +${pct}% — sell window?`
              : `Watchlist: ${card.name} dropped ${pct}% — buying dip?`,
            drift > 0 ? 'success' : 'warning',
          );
          baseline[cardId] = cur;
        }
      }
    }
    set({ watchAlertBaseline: baseline });
  },

  toggleWatch(cardId) {
    const state = get();
    const isWatched = state.watchedCardIds.includes(cardId);
    if (isWatched) {
      set({
        watchedCardIds: state.watchedCardIds.filter((id) => id !== cardId),
      });
    } else {
      set({
        watchedCardIds: [...state.watchedCardIds, cardId],
        watchAlertBaseline: { ...state.watchAlertBaseline, [cardId]: state.marketNoise[cardId] ?? 1 },
      });
      try {
        const card = getCardById(cardId);
        get().pushNotification(`Watching ${card.name}. Alerts on ±15% moves.`, 'info');
      } catch {}
    }
    get().save();
  },

  negotiate(listingId, offer) {
    const state = get();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return null;
    if (offer < 1) {
      get().pushNotification('Offer must be at least $1.', 'warning');
      return null;
    }
    const softening = state.upgradesPurchased.includes('negotiation_templates') ? 0.1 : 0;
    const outcome = evaluateOffer(listing, offer, softening);
    if (outcome.kind === 'accept') {
      set({
        listings: state.listings.map((l) =>
          l.id === listingId ? { ...l, askingPrice: outcome.price } : l,
        ),
        stats: {
          ...state.stats,
          negotiationsAccepted: state.stats.negotiationsAccepted + 1,
        },
      });
      get().pushNotification(`@${listing.sellerName}: ${outcome.flavor}`, 'success');
      get().buyListing(listingId);
      get().evaluateAndApplyAchievements({ kind: 'negotiation_accepted' });
      return { kind: 'accept', price: outcome.price, flavor: outcome.flavor };
    }
    if (outcome.kind === 'counter') {
      set({
        listings: state.listings.map((l) =>
          l.id === listingId ? { ...l, askingPrice: outcome.price } : l,
        ),
      });
      get().pushNotification(
        `@${listing.sellerName}: ${outcome.flavor} — Counter at $${outcome.price}.`,
        'info',
      );
      return { kind: 'counter', price: outcome.price, flavor: outcome.flavor };
    }
    get().pushNotification(`@${listing.sellerName}: ${outcome.flavor}`, 'warning');
    return { kind: 'reject', flavor: outcome.flavor };
  },

  listForSale(itemId, marketplace, price, durationMs) {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item) return;
    if (state.showcaseItemIds.includes(itemId)) {
      get().pushNotification('This card is in your showcase. Remove it first.', 'warning');
      return;
    }
    if (item.status !== 'raw' && item.status !== 'graded') {
      get().pushNotification('Cannot list this item right now.', 'warning');
      return;
    }
    if (!state.marketplacesUnlocked.includes(marketplace)) {
      get().pushNotification(`${marketplace} is locked.`, 'warning');
      return;
    }
    if (price < 1) {
      get().pushNotification('List price must be at least $1.', 'warning');
      return;
    }
    if (item.status === 'graded' && marketplace !== 'SlabHub' && marketplace !== 'FeeBay') {
      get().pushNotification('Graded slabs can only be listed on SlabHub or FeeBay.', 'warning');
      return;
    }
    if (item.status === 'raw' && marketplace === 'SlabHub') {
      get().pushNotification('SlabHub takes graded cards only.', 'warning');
      return;
    }
    const refValue = calculateCurrentValue(item, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state));
    const now = Date.now();
    const listing = {
      id: uid('plst_'),
      itemId,
      marketplace,
      askingPrice: Math.round(price),
      refValue,
      listedAt: now,
      expiresAt: now + (durationMs ?? DEFAULT_LISTING_DURATION_MS),
      views: 0,
    };
    set({
      inventory: state.inventory.map((i) =>
        i.id === itemId ? { ...i, status: 'listed' } : i,
      ),
      playerListings: [...state.playerListings, listing],
    });
    SFX.click();
    get().pushNotification(
      `Listed ${item.name} on ${marketplace} at $${listing.askingPrice}.`,
      'info',
    );
    get().save();
  },

  delistFromStorefront(listingId) {
    const state = get();
    const listing = state.playerListings.find((l) => l.id === listingId);
    if (!listing) return;
    const item = state.inventory.find((i) => i.id === listing.itemId);
    if (!item) {
      // orphan — just clean up
      set({ playerListings: state.playerListings.filter((l) => l.id !== listingId) });
      return;
    }
    set({
      playerListings: state.playerListings.filter((l) => l.id !== listingId),
      inventory: state.inventory.map((i) =>
        i.id === listing.itemId
          ? { ...i, status: item.grade !== undefined ? 'graded' : 'raw' }
          : i,
      ),
    });
    get().pushNotification(`Delisted ${item.name}. Back in your inventory.`, 'info');
    get().save();
  },

  withdrawStorefront() {
    const state = get();
    const amount = state.storefrontBalance;
    if (amount <= 0) return;
    const rate = storefrontFeeRate(state);
    const fee = +(amount * rate).toFixed(2);
    const net = +(amount - fee).toFixed(2);
    set({
      cash: +(state.cash + net).toFixed(2),
      storefrontBalance: 0,
      stats: {
        ...state.stats,
        totalFeesPaid: +(state.stats.totalFeesPaid + fee).toFixed(2),
      },
    });
    SFX.chaching();
    get().pushNotification(
      `Withdrew $${net.toFixed(2)} (FeeBay took $${fee.toFixed(2)} at ${(rate * 100).toFixed(0)}%).`,
      'success',
    );
    get().save();
  },

  setAutoWithdraw(enabled) {
    const state = get();
    if (enabled && !state.upgradesPurchased.includes('auto_withdraw')) {
      get().pushNotification('Buy the Auto-Withdraw upgrade first.', 'warning');
      return;
    }
    set({ autoWithdrawEnabled: enabled });
    get().save();
  },

  tickPlayerListings() {
    const state = get();
    if (state.playerListings.length === 0 && state.pendingPayments.length === 0) return;
    const now = Date.now();
    const autoWithdraw =
      state.autoWithdrawEnabled && state.upgradesPurchased.includes('auto_withdraw');
    let cashDelta = 0;
    let walletDelta = 0;
    let inventory = state.inventory;
    const remaining: typeof state.playerListings = [];
    let totalProfit = state.stats.totalProfit;
    let totalFees = state.stats.totalFeesPaid;
    let totalSold = state.stats.totalSold;
    let bestProfit = state.stats.bestSaleProfit;
    let biggestLoss = state.stats.biggestLoss;
    let reputationGain = 0;
    let storefrontSales = state.stats.storefrontSales;
    let storefrontRevenue = state.stats.storefrontRevenue ?? 0;
    let fakeCardsSold = state.stats.fakeCardsSold ?? 0;
    let anyStorefrontSale = false;
    const newHistory: typeof state.storefrontHistory = [];
    const newPending: typeof state.pendingPayments = [];

    for (const listing of state.playerListings) {
      const item = inventory.find((i) => i.id === listing.itemId);
      if (!item) continue; // shouldn't happen

      // Expire after duration
      if (now >= listing.expiresAt) {
        inventory = inventory.map((i) =>
          i.id === item.id ? { ...i, status: item.grade !== undefined ? 'graded' : 'raw' } : i,
        );
        get().pushNotification(`Listing for ${item.name} expired. Back in inventory.`, 'info');
        continue;
      }

      // Sale roll — but only step ~once per 10s of real time
      const sinceList = now - listing.listedAt;
      const slot = Math.floor(sinceList / 10_000);
      const lastSlot = Math.floor((listing.views || 0));
      if (slot <= lastSlot) {
        remaining.push(listing);
        continue;
      }
      const prob = saleProbabilityPerTick(listing.askingPrice, listing.refValue, listing.marketplace);
      if (Math.random() < prob) {
        // A buyer has clicked Buy. Three possible outcomes:
        //   instant pay (60%), waiting for payment (30%), buyer will cancel (10%).
        const mkt = getMarketplace(listing.marketplace);
        const feeDiscount = feeDiscountFor(state);
        const sale = computeSale(listing.askingPrice, mkt, feeDiscount);
        const profit = +(sale.net - item.purchasePrice).toFixed(2);
        const totalFeeAmount = sale.sellerFee + sale.paymentFee + sale.flatFee;
        const roll = Math.random();
        const buyerName = pick(SELLER_NAMES);
        const willInstantPay = roll < 0.6;
        const willDelayPay = !willInstantPay && roll < 0.9;
        const willCancel = !willInstantPay && !willDelayPay;

        if (willInstantPay) {
          // Pay now (current behavior)
          if (autoWithdraw) cashDelta += sale.net;
          else walletDelta += sale.net;
          totalProfit += profit;
          totalFees += totalFeeAmount;
          totalSold += 1;
          bestProfit = Math.max(bestProfit, profit);
          biggestLoss = Math.min(biggestLoss, profit);
          if (profit > 0) reputationGain += 1;
          storefrontSales += 1;
          storefrontRevenue += sale.net;
          if (item.isFake) fakeCardsSold += 1;
          anyStorefrontSale = true;
          newHistory.push({
            id: uid('sfh_'),
            cardId: item.cardId,
            cardName: item.name,
            rarity: item.rarity,
            hue: item.hue,
            grade: item.grade,
            gradingCompany: item.gradingCompany,
            centeringOffsetX: item.centeringOffsetX,
            centeringOffsetY: item.centeringOffsetY,
            marketplace: listing.marketplace,
            soldAt: now,
            listPrice: listing.askingPrice,
            netRevenue: sale.net,
            profit,
            status: 'instant',
            buyerName,
          });
          inventory = inventory.filter((i) => i.id !== item.id);
          SFX.chaching();
          get().pushNotification(
            `@${buyerName} bought ${item.name} on ${listing.marketplace} for $${sale.net.toFixed(2)} (+$${profit.toFixed(2)}).`,
            profit >= 0 ? 'success' : 'warning',
          );
        } else {
          // Pending — buyer either pays after a delay, or cancels.
          // Delayed pays: 30–120s. Cancellations: 60–180s of waiting before bailing.
          const delayMs = willCancel
            ? Math.round(rand(60_000, 180_000))
            : Math.round(rand(30_000, 120_000));
          newPending.push({
            id: uid('pp_'),
            item,
            marketplace: listing.marketplace,
            buyerName,
            listPrice: listing.askingPrice,
            netRevenue: sale.net,
            fees: totalFeeAmount,
            profit,
            saleAt: now,
            resolveAt: now + delayMs,
            willCancel,
          });
          // Card leaves inventory while in transit
          inventory = inventory.filter((i) => i.id !== item.id);
          get().pushNotification(
            `@${buyerName} clicked Buy on ${item.name}. Waiting for payment…`,
            'info',
          );
        }
        continue;
      }
      remaining.push({ ...listing, views: slot });
    }

    // --- Resolve due pending payments ---
    const stillPending: typeof state.pendingPayments = [];
    for (const p of state.pendingPayments) {
      if (now < p.resolveAt) {
        stillPending.push(p);
        continue;
      }
      if (p.willCancel) {
        // Buyer ghosted. Return the card to inventory with its pre-listing status restored.
        const restored = {
          ...p.item,
          status: p.item.grade !== undefined ? ('graded' as const) : ('raw' as const),
        };
        inventory = [...inventory, restored];
        SFX.loss();
        newHistory.push({
          id: uid('sfh_'),
          cardId: p.item.cardId,
          cardName: p.item.name,
          rarity: p.item.rarity,
          hue: p.item.hue,
          grade: p.item.grade,
          gradingCompany: p.item.gradingCompany,
          centeringOffsetX: p.item.centeringOffsetX,
          centeringOffsetY: p.item.centeringOffsetY,
          marketplace: p.marketplace,
          soldAt: now,
          listPrice: p.listPrice,
          netRevenue: 0,
          profit: 0,
          status: 'cancelled',
          buyerName: p.buyerName,
        });
        get().pushNotification(
          `@${p.buyerName} cancelled the order for ${p.item.name}. Card returned. Wasted ${Math.round(
            (p.resolveAt - p.saleAt) / 1000,
          )}s.`,
          'warning',
        );
      } else {
        // Payment arrives now.
        if (autoWithdraw) cashDelta += p.netRevenue;
        else walletDelta += p.netRevenue;
        totalProfit += p.profit;
        totalFees += p.fees;
        totalSold += 1;
        bestProfit = Math.max(bestProfit, p.profit);
        biggestLoss = Math.min(biggestLoss, p.profit);
        if (p.profit > 0) reputationGain += 1;
        storefrontSales += 1;
        storefrontRevenue += p.netRevenue;
        if (p.item.isFake) fakeCardsSold += 1;
        anyStorefrontSale = true;
        newHistory.push({
          id: uid('sfh_'),
          cardId: p.item.cardId,
          cardName: p.item.name,
          rarity: p.item.rarity,
          hue: p.item.hue,
          grade: p.item.grade,
          gradingCompany: p.item.gradingCompany,
          centeringOffsetX: p.item.centeringOffsetX,
          centeringOffsetY: p.item.centeringOffsetY,
          marketplace: p.marketplace,
          soldAt: now,
          listPrice: p.listPrice,
          netRevenue: p.netRevenue,
          profit: p.profit,
          status: 'delayed',
          buyerName: p.buyerName,
        });
        SFX.chaching();
        get().pushNotification(
          `@${p.buyerName} paid for ${p.item.name}. +$${p.netRevenue.toFixed(2)}.`,
          'success',
        );
      }
    }

    const pendingChanged =
      newPending.length > 0 || stillPending.length !== state.pendingPayments.length;

    if (
      cashDelta !== 0 ||
      walletDelta !== 0 ||
      remaining.length !== state.playerListings.length ||
      reputationGain !== 0 ||
      pendingChanged
    ) {
      set({
        cash: +(state.cash + cashDelta).toFixed(2),
        storefrontBalance: +(state.storefrontBalance + walletDelta).toFixed(2),
        inventory,
        playerListings: remaining,
        stats: {
          ...state.stats,
          totalProfit: +totalProfit.toFixed(2),
          totalFeesPaid: +totalFees.toFixed(2),
          totalSold,
          bestSaleProfit: bestProfit,
          biggestLoss,
          storefrontSales,
          storefrontRevenue: +storefrontRevenue.toFixed(2),
          fakeCardsSold,
        },
        reputation: state.reputation + reputationGain,
        storefrontHistory:
          newHistory.length > 0
            ? [...newHistory.reverse(), ...state.storefrontHistory].slice(0, 30)
            : state.storefrontHistory,
        pendingPayments: [...stillPending, ...newPending],
      });
      if (reputationGain > 0) get().tryUnlockMarketplaces();
      if (anyStorefrontSale) {
        get().evaluateAndApplyAchievements({ kind: 'storefront_sale' });
      }
      get().save();
    }
  },

  startConvention() {
    const now = Date.now();
    const c = rollConvention(now);
    set({ convention: c, lastConventionAt: now });
    SFX.marketEvent();
    get().pushNotification(
      `${c.name} just opened. Cards tagged [${c.pumpedTags.join(', ')}] are pumping +${Math.round(
        (c.boostMultiplier - 1) * 100,
      )}% for ${Math.round((c.endsAt - now) / 60000)} min.`,
      'event',
    );
    get().save();
  },

  tickConvention() {
    const state = get();
    const now = Date.now();
    if (state.convention && state.convention.endsAt <= now) {
      get().pushNotification(`${state.convention.name} closed. Trend boost faded.`, 'info');
      set({ convention: null });
      get().save();
      return;
    }
    if (!state.convention && state.day >= 2 && now - state.lastConventionAt > 4 * 60_000) {
      if (Math.random() < 0.08) {
        get().startConvention();
      }
    }
  },

  hireEmployee(role) {
    const state = get();
    if (state.businessLevel < 2) {
      get().pushNotification('Reach Business Level 2 to hire your first employee.', 'warning');
      return;
    }
    const cap = employeeCap(state.businessLevel);
    if (state.employees.length >= cap) {
      get().pushNotification(
        `${getBusinessLevel(state.businessLevel).name} tops out at ${cap} employee${
          cap === 1 ? '' : 's'
        } — promote to grow the team.`,
        'warning',
      );
      return;
    }
    const cost = hireCost(state.employees.length);
    if (state.cash < cost) {
      get().pushNotification(`Hiring costs $${cost.toLocaleString()} — not enough cash.`, 'warning');
      return;
    }
    const tier = weightedPick(
      EMPLOYEE_TIER_WEIGHTS.map((t) => t[0]),
      EMPLOYEE_TIER_WEIGHTS.map((t) => t[1]),
    );
    const used = new Set(state.employees.map((e) => e.name));
    let name = pick(EMPLOYEE_NAMES);
    let guard = 0;
    while (used.has(name) && guard++ < 50) name = pick(EMPLOYEE_NAMES);
    const now = Date.now();
    const roleDef = getEmployeeRole(role);
    const emp: Employee = {
      id: uid('emp_'),
      name,
      role,
      tier,
      hiredAt: now,
      cycleStartedAt: now,
      cycleEndsAt: now + roleDef.baseCycleMs,
      actions: 0,
      profit: 0,
      mistakes: 0,
      mistakeCost: 0,
      log: [],
    };
    set({ cash: +(state.cash - cost).toFixed(2), employees: [...state.employees, emp] });
    SFX.chaching();
    get().pushNotification(
      `Hired ${name} — a ${EMPLOYEE_TIERS[tier].label} ${roleDef.title}.`,
      'success',
    );
    get().save();
  },

  fireEmployee(employeeId) {
    const state = get();
    const emp = state.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    set({ employees: state.employees.filter((e) => e.id !== employeeId) });
    get().pushNotification(`Let ${emp.name} go. The desk is empty.`, 'info');
    get().evaluateAndApplyAchievements({ kind: 'employee_fired' });
    get().save();
  },

  claimStockItem(itemId) {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || !item.autoBought) return;
    set({
      inventory: state.inventory.map((i) =>
        i.id === itemId ? { ...i, autoBought: false } : i,
      ),
    });
    get().pushNotification(
      `Pulled ${item.name} out of store stock — it's yours now.`,
      'success',
    );
    get().save();
  },

  tickEmployees() {
    const state = get();
    if (state.employees.length === 0) return;
    const now = Date.now();
    const due = state.employees.some((e) => now >= e.cycleEndsAt);
    if (due) {
      const managerCount = state.employees.filter(
        (e) => e.role === 'manager' && !e.break,
      ).length;
      for (const e of state.employees) {
        if (now >= e.cycleEndsAt) runEmployeeCycle(e.id, now, managerCount);
      }
    }
    // Sample the company-profit curve every tick so the chart updates live.
    const cp = get().companyProfit;
    set((s) => ({
      companyProfitHistory: [...s.companyProfitHistory, +cp.toFixed(2)].slice(
        -PROFIT_HISTORY_CAP,
      ),
    }));
    if (due) get().save();
  },

  tickDay() {
    const state = get();
    const now = Date.now();
    if (state.pendingEndOfDay) return; // wait for player to consume
    const elapsed = now - state.dayStartedAt;
    if (elapsed < DAY_LENGTH_MS) return;
    const totalGrades = Object.values(state.stats.gradesReceived).reduce((s, n) => s + n, 0);
    const collected = Object.keys(state.collection).length;
    const report = {
      day: state.day,
      cashStart: state.dayStartStats.cash,
      cashEnd: state.cash,
      bought: state.stats.totalBought - state.dayStartStats.bought,
      sold: state.stats.totalSold - state.dayStartStats.sold,
      netProfit: +(state.stats.totalProfit - state.dayStartStats.profit).toFixed(2),
      feesPaid: +(state.stats.totalFeesPaid - state.dayStartStats.fees).toFixed(2),
      bestSale: state.stats.bestSaleProfit - state.dayStartStats.bestSale,
      worstSale: state.stats.biggestLoss - state.dayStartStats.biggestLoss,
      gradesReceived: totalGrades - state.dayStartStats.gradesCount,
      newCards: collected - state.dayStartStats.collectionSize,
    };
    set({
      pendingEndOfDay: report,
      day: state.day + 1,
      dayStartedAt: now,
      dayStartStats: {
        cash: state.cash,
        bought: state.stats.totalBought,
        sold: state.stats.totalSold,
        profit: state.stats.totalProfit,
        fees: state.stats.totalFeesPaid,
        gradesCount: totalGrades,
        collectionSize: collected,
        bestSale: state.stats.bestSaleProfit,
        biggestLoss: state.stats.biggestLoss,
      },
      reputation: state.reputation + 1 + getBusinessLevel(state.businessLevel).bonusDailyRep,
      stats: { ...state.stats, gem10sToday: 0 },
    });
    SFX.marketEvent();
    get().evaluateAndApplyAchievements({ kind: 'tick' });
  },

  promoteBusinessLevel() {
    const state = get();
    const next = getNextBusinessLevel(state.businessLevel);
    if (!next) {
      get().pushNotification('You\'re already at the top of the game.', 'info');
      return;
    }
    // Net-worth eligibility
    const inventoryValue = state.inventory.reduce(
      (sum, i) =>
        sum +
        (i.status === 'grading'
          ? i.purchasePrice
          : calculateCurrentValue(i, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state))),
      0,
    );
    const netWorth = state.cash + state.storefrontBalance + inventoryValue;
    if (netWorth < next.netWorthRequirement) {
      get().pushNotification(
        `Need $${next.netWorthRequirement.toLocaleString()} net worth to step up to ${next.name}.`,
        'warning',
      );
      return;
    }
    if (state.reputation < next.reputationRequirement) {
      get().pushNotification(
        `Need ${next.reputationRequirement} rep to step up to ${next.name}.`,
        'warning',
      );
      return;
    }
    if (state.cash < next.promotionCost) {
      get().pushNotification(
        `Promotion costs $${next.promotionCost.toLocaleString()} cash.`,
        'warning',
      );
      return;
    }
    set({
      cash: +(state.cash - next.promotionCost).toFixed(2),
      businessLevel: next.level,
    });
    SFX.achievement();
    get().pushNotification(
      `You are now a ${next.name}. ${next.tagline}`,
      'achievement',
    );
    get().tryUnlockMarketplaces();
    get().save();
  },

  consumeEndOfDayReport() {
    set({ pendingEndOfDay: null });
    get().save();
  },

  resetGame() {
    localStorage.removeItem('feebay-simulator-save-v9');
    set({ ...defaultState() });
    get().refreshListings({ force: true });
    // Starting over is itself an achievement — granted into the fresh save.
    get().unlockAchievements(['game_reset']);
  },

  save() {
    const state = get();
    saveGame({
      cash: state.cash,
      reputation: state.reputation,
      businessLevel: state.businessLevel,
      day: state.day,
      dayStartedAt: state.dayStartedAt,
      dayStartStats: state.dayStartStats,
      marketplacesUnlocked: state.marketplacesUnlocked,
      listings: state.listings,
      inventory: state.inventory,
      gradingSubmissions: state.gradingSubmissions,
      upgradesPurchased: state.upgradesPurchased,
      marketTrends: state.marketTrends,
      notifications: state.notifications.slice(0, 10),
      stats: state.stats,
      lastListingRefresh: state.lastListingRefresh,
      lastMarketEvent: state.lastMarketEvent,
      pendingGradeReveals: state.pendingGradeReveals,
      pendingBulkReveal: state.pendingBulkReveal,
      gradingHistory: state.gradingHistory,
      pendingLotReveals: state.pendingLotReveals,
      achievementsUnlocked: state.achievementsUnlocked,
      achievementsClaimed: state.achievementsClaimed,
      netWorthSamples: state.netWorthSamples.slice(-200),
      netWorthHistory: state.netWorthHistory,
      auctions: state.auctions,
      lastAuctionRefresh: state.lastAuctionRefresh,
      hasSeenIntro: state.hasSeenIntro,
      collection: state.collection,
      pendingEndOfDay: state.pendingEndOfDay,
      marketNoise: state.marketNoise,
      marketNoisePrev: state.marketNoisePrev,
      lastMarketNoiseTick: state.lastMarketNoiseTick,
      watchedCardIds: state.watchedCardIds,
      watchAlertBaseline: state.watchAlertBaseline,
      convention: state.convention,
      recentSellsByTag: state.recentSellsByTag,
      lastConventionAt: state.lastConventionAt,
      playerListings: state.playerListings,
      showcaseItemIds: state.showcaseItemIds,
      storefrontHistory: state.storefrontHistory,
      pendingPayments: state.pendingPayments,
      storefrontBalance: state.storefrontBalance,
      autoWithdrawEnabled: state.autoWithdrawEnabled,
      employees: state.employees,
      companyProfit: state.companyProfit,
      companyProfitHistory: state.companyProfitHistory,
      cardFlow: state.cardFlow,
      operatingCosts: state.operatingCosts,
      // Session-only — always persist false so a save made while the console is
      // open doesn't auto-reopen it on the next load.
      cheatsConsoleOpen: false,
      ui: state.ui,
    });
  },

  tryUnlockMarketplaces() {
    const state = get();
    const newly: MarketplaceSource[] = [];
    for (const m of MARKETPLACES) {
      if (state.marketplacesUnlocked.includes(m.id)) continue;
      // VaultDealer additionally requires Business Level 4+
      if (m.id === 'VaultDealer' && state.businessLevel < 4) continue;
      if (state.reputation >= m.unlockReputation) {
        newly.push(m.id);
      }
    }
    if (newly.length > 0) {
      set({
        marketplacesUnlocked: [...state.marketplacesUnlocked, ...newly],
      });
      for (const m of newly) {
        get().pushNotification(`Unlocked marketplace: ${m}`, 'success');
      }
    }
  },

  evaluateAndApplyAchievements(ctx) {
    const state = get();
    const newly = evaluateAchievements(state, ctx);
    if (newly.length === 0) return;
    get().unlockAchievements(newly);
  },

  unlockAchievements(ids) {
    const state = get();
    const added = ids.filter((id) => !state.achievementsUnlocked.includes(id));
    if (added.length === 0) return;
    set({ achievementsUnlocked: [...state.achievementsUnlocked, ...added] });
    for (const id of added) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) {
        SFX.achievement();
        get().pushNotification(
          `Achievement unlocked — ${a.name}: ${a.description} (Claim $${a.cashReward})`,
          'achievement',
        );
      }
      // Mirror to Steam (no-op when Steam isn't available).
      window.feebay?.steam?.unlockAchievement(id);
    }
    // Persist immediately so UI-triggered unlocks survive a reload on their own.
    get().save();
  },

  claimAchievement(id) {
    const state = get();
    if (!state.achievementsUnlocked.includes(id)) return;
    if (state.achievementsClaimed.includes(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    set({
      cash: +(state.cash + a.cashReward).toFixed(2),
      achievementsClaimed: [...state.achievementsClaimed, id],
    });
    SFX.chaching();
    get().pushNotification(`Claimed $${a.cashReward} for "${a.name}".`, 'success');
    get().save();
  },

  claimAllAchievements() {
    const state = get();
    const toClaim = state.achievementsUnlocked.filter(
      (id) => !state.achievementsClaimed.includes(id),
    );
    if (toClaim.length === 0) return;
    let total = 0;
    for (const id of toClaim) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) total += a.cashReward;
    }
    set({
      cash: +(state.cash + total).toFixed(2),
      achievementsClaimed: [...state.achievementsClaimed, ...toClaim],
    });
    SFX.chaching();
    get().pushNotification(
      `Claimed $${total.toFixed(2)} across ${toClaim.length} achievement${toClaim.length === 1 ? '' : 's'}.`,
      'success',
    );
    get().save();
  },

  openCheatsConsole() {
    if (get().cheatsConsoleOpen) return;
    set({ cheatsConsoleOpen: true });
    // Finding the secret console is itself a (hidden) achievement.
    get().unlockAchievements(['cheat_breach']);
  },

  closeCheatsConsole() {
    set({ cheatsConsoleOpen: false });
  },

  applyCheat(cheat, amount) {
    const state = get();
    switch (cheat) {
      case 'cash': {
        const delta = Math.max(0, amount ?? 0);
        set({ cash: +(state.cash + delta).toFixed(2) });
        SFX.chaching();
        get().pushNotification(`☠ CHEAT: $${delta.toLocaleString()} injected into your wallet.`, 'success');
        break;
      }
      case 'unlock_upgrades': {
        set({ upgradesPurchased: UPGRADES.map((u) => u.id) });
        SFX.coin();
        get().pushNotification(`☠ CHEAT: All ${UPGRADES.length} upgrades unlocked — free of charge.`, 'success');
        break;
      }
      case 'unlock_marketplaces': {
        set({ marketplacesUnlocked: MARKETPLACES.map((m) => m.id) });
        SFX.coin();
        get().pushNotification(`☠ CHEAT: All ${MARKETPLACES.length} marketplaces unlocked.`, 'success');
        break;
      }
      case 'max_reputation': {
        set({ reputation: Math.max(state.reputation, 999) });
        get().tryUnlockMarketplaces();
        SFX.achievement();
        get().pushNotification('☠ CHEAT: Reputation cranked to 999. The streets know your name.', 'success');
        break;
      }
      case 'max_business': {
        const top = BUSINESS_LEVELS[BUSINESS_LEVELS.length - 1];
        set({ businessLevel: top.level });
        get().tryUnlockMarketplaces();
        SFX.achievement();
        get().pushNotification(`☠ CHEAT: Promoted straight to ${top.name}.`, 'success');
        break;
      }
      case 'skip_day': {
        // Rewind the day clock so the next tickDay rolls the proper end-of-day report.
        set({ dayStartedAt: Date.now() - DAY_LENGTH_MS - 2_000 });
        get().pushNotification('☠ CHEAT: Fast-forwarding to tomorrow...', 'info');
        break;
      }
      case 'unlock_achievements': {
        // Gotcha — "Unlock ALL Achievements" unlocks exactly one: the cheater badge.
        const cheaterId = 'achievement_cheater';
        if (get().achievementsUnlocked.includes(cheaterId)) {
          get().pushNotification(
            '☠ CHEAT: Still just the one. Cheaters never win (twice).',
            'info',
          );
          break;
        }
        get().unlockAchievements([cheaterId]);
        break;
      }
    }
    // Re-evaluate threshold achievements so cheated cash / rep / level pop immediately.
    if (cheat !== 'unlock_achievements') {
      get().evaluateAndApplyAchievements({ kind: 'tick' });
    }
    get().save();
  },

  tickListings() {
    const state = get();
    if (state.listings.length === 0) return;
    let changed = false;
    const next = [];
    for (const l of state.listings) {
      const remaining = l.timeRemainingSeconds - 1;
      if (remaining <= 0) {
        changed = true;
        continue;
      }
      if (remaining !== l.timeRemainingSeconds) changed = true;
      next.push({ ...l, timeRemainingSeconds: remaining });
    }
    if (changed) set({ listings: next });
  },

  refreshAuctions() {
    const state = get();
    if (!state.upgradesPurchased.includes('auction_paddle')) {
      get().pushNotification('Buy the BidGoblin Paddle upgrade to access auctions.', 'warning');
      return;
    }
    const now = Date.now();
    const cooldown = refreshCooldownMs(state);
    if (state.lastAuctionRefresh && now - state.lastAuctionRefresh < cooldown) {
      const remaining = Math.ceil((cooldown - (now - state.lastAuctionRefresh)) / 1000);
      get().pushNotification(`Goblin is napping. New lots in ${remaining}s.`, 'info');
      return;
    }
    // Keep any auction still live so an active bid is never wiped — clear the
    // resolved lots and top the floor back up with fresh ones.
    const live = state.auctions.filter((a) => !a.resolved && now < a.endsAt);
    const target = 6;
    const fresh =
      live.length >= target
        ? []
        : generateAuctions(now, state.marketTrends, target - live.length);
    set({ auctions: [...live, ...fresh], lastAuctionRefresh: now });
    SFX.whoosh();
    if (fresh.length === 0) {
      get().pushNotification('The auction floor is already packed.', 'info');
    }
  },

  placeBid(auctionId, amount) {
    const state = get();
    const auction = state.auctions.find((a) => a.id === auctionId);
    if (!auction || auction.resolved) return;
    const now = Date.now();
    if (now >= auction.endsAt) return;
    if (auction.leaderName === 'You') {
      get().pushNotification('You already hold the high bid on this lot.', 'info');
      return;
    }
    const minNext = auction.currentBid + auction.bidIncrement;
    const bid = amount && amount > minNext ? Math.round(amount) : minNext;
    if (bid < minNext) return;
    if (state.cash < bid) {
      get().pushNotification('Not enough cash to cover the bid.', 'warning');
      return;
    }
    set({
      auctions: state.auctions.map((a) =>
        a.id === auctionId ? applyPlayerBid(a, bid, now) : a,
      ),
    });
    SFX.coin();
  },

  setAutoSnipeMax(auctionId, max) {
    if (!get().upgradesPurchased.includes('auto_sniper')) {
      get().pushNotification('Auto-Sniper upgrade required.', 'warning');
      return;
    }
    set((state) => ({
      auctions: state.auctions.map((a) =>
        a.id === auctionId ? { ...a, myMaxBid: max } : a,
      ),
    }));
  },

  buyoutAuction(auctionId) {
    const state = get();
    const auction = state.auctions.find((a) => a.id === auctionId);
    if (!auction || auction.resolved || !auction.buyoutPrice) return;
    if (state.cash < auction.buyoutPrice) {
      get().pushNotification('Not enough cash for buyout.', 'warning');
      return;
    }
    const slots = get().inventorySlots();
    if (occupiedSlots(state) >= slots) {
      get().pushNotification('Inventory full. Free a slot first.', 'warning');
      return;
    }
    // Mark resolved + award immediately at buyout price.
    set({
      auctions: state.auctions.map((a) =>
        a.id === auctionId
          ? { ...a, resolved: true, wonByPlayer: true, isMine: true, currentBid: auction.buyoutPrice! }
          : a,
      ),
    });
    awardWonAuction(auctionId, auction.buyoutPrice!);
  },

  tickAuctions() {
    const state = get();
    if (state.auctions.length === 0) return;
    const now = Date.now();
    const proxyEnabled = state.upgradesPurchased.includes('auto_sniper');
    const playerCash = state.cash;
    let changed = false;
    const updated = state.auctions.map((a) => {
      if (a.resolved) return a;
      let next = tickAuction(a, now, { proxyEnabled, playerCash });
      if (now >= next.endsAt) {
        next = { ...next, resolved: true, wonByPlayer: next.isMine };
      }
      if (next !== a) changed = true;
      return next;
    });
    if (!changed) return;
    set({ auctions: updated });

    for (const a of updated) {
      const prev = state.auctions.find((p) => p.id === a.id);
      if (!prev) continue;
      let name = 'the lot';
      try {
        name = getCardById(a.cardId).name;
      } catch {
        /* unknown card id — keep the fallback */
      }
      // Lost the lead this tick and the proxy couldn't save it.
      if (!prev.resolved && !a.resolved && prev.isMine && !a.isMine) {
        SFX.loss();
        get().pushNotification(`Outbid on ${name} — ${a.leaderName} jumped you.`, 'warning');
      }
      // Just resolved this tick.
      if (!prev.resolved && a.resolved) {
        if (a.wonByPlayer) {
          awardWonAuction(a.id, a.currentBid);
        } else if (a.bids.some((b) => b.kind === 'player')) {
          get().pushNotification(`Lost ${name} on BidGoblin. The goblin cackles.`, 'info');
        }
      }
    }
  },

  sampleNetWorth() {
    const state = get();
    const inventoryValue = state.inventory.reduce(
      (sum, i) =>
        sum +
        (i.status === 'grading'
          ? i.purchasePrice
          : calculateCurrentValue(i, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state))),
      0,
    );
    const v = +(state.cash + state.storefrontBalance + inventoryValue).toFixed(2);
    // 5s history feeding the dashboard's live net-worth chart.
    set((s) => ({
      netWorthHistory: [...s.netWorthHistory, v].slice(-NET_WORTH_HISTORY_CAP),
    }));
    const sample = { t: Date.now(), v };
    const last = state.netWorthSamples[state.netWorthSamples.length - 1];
    if (!last || sample.t - last.t > 2_000) {
      set({ netWorthSamples: [...state.netWorthSamples, sample].slice(-200) });
    }
    // Track highest net worth and reputation
    if (v > state.stats.highestNetWorth || state.reputation > state.stats.highestReputation) {
      set((s) => ({
        stats: {
          ...s.stats,
          highestNetWorth: Math.max(s.stats.highestNetWorth, v),
          highestReputation: Math.max(s.stats.highestReputation, s.reputation),
        },
      }));
    }
    // Periodic full evaluation (covers all state-driven achievements)
    get().evaluateAndApplyAchievements({ kind: 'tick' });
  },

  setSeenIntro(seen) {
    set({ hasSeenIntro: seen });
    get().save();
  },

  setInventoryFilter(filter) {
    set((s) => ({ ui: { ...s.ui, inventoryFilter: filter } }));
  },

  toggleShowcase(itemId) {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item) return;
    const present = state.showcaseItemIds.includes(itemId);
    if (present) {
      // Removing from the showcase puts the card back to occupying a slot —
      // it needs room in the inventory.
      if (occupiedSlots(state) >= get().inventorySlots()) {
        get().pushNotification(
          'Inventory is full — free a slot before taking a card off your showcase.',
          'warning',
        );
        return;
      }
      set({ showcaseItemIds: state.showcaseItemIds.filter((id) => id !== itemId) });
      get().pushNotification(`${item.name} removed from your showcase.`, 'info');
    } else {
      set({ showcaseItemIds: [...state.showcaseItemIds, itemId] });
      SFX.coin();
      get().pushNotification(
        `${item.name} added to your showcase. Locked from sale.`,
        'success',
      );
      // A freshly-showcased card may push the display past a value milestone.
      get().evaluateAndApplyAchievements({ kind: 'tick' });
    }
    get().save();
  },
  setInventorySortKey(key) {
    set((s) => ({ ui: { ...s.ui, inventorySortKey: key } }));
  },
  setMarketplaceActiveSource(src) {
    set((s) => ({ ui: { ...s.ui, marketplaceActiveSource: src } }));
  },
  setPrimaryMarketplace(src) {
    set((s) => ({ ui: { ...s.ui, primaryMarketplace: src } }));
    get().save();
  },
}));

/** Idle reason shown when a worker can't buy because the account is too low. */
const NEEDS_CASH_IDLE = 'Account too low to buy stock';

/** How many 1s profit samples the live company-profit chart retains (~30 min). */
const PROFIT_HISTORY_CAP = 1800;

/** How many cards the store-history belt keeps — enough to fill a wide screen. */
const CARD_FLOW_CAP = 30;

/** How many 5s net-worth samples the dashboard chart keeps (~30 min). */
const NET_WORTH_HISTORY_CAP = 400;

/** Itemized operating overhead on an employee sale of the given net value. */
function computeOverhead(value: number): {
  lines: { id: string; cost: number }[];
  total: number;
} {
  const v = Math.max(0, value);
  let total = 0;
  const lines = OVERHEAD_LINES.map((l) => {
    const cost = Math.max(1, Math.round(l.base + l.rate * v));
    total += cost;
    return { id: l.id, cost };
  });
  return { lines, total };
}

/** Run one work cycle for an employee. Workers only roll for a costly mistake
 *  when they actually have a task — idle staff (out of cash, no stock) just
 *  wait, they never bleed money. Manager presence speeds cycles and cuts
 *  mistakes for everyone else. */
function runEmployeeCycle(empId: string, now: number, managerCount: number) {
  const store = useGameStore.getState();
  const emp = store.employees.find((e) => e.id === empId);
  if (!emp) return;
  const roleDef = getEmployeeRole(emp.role);
  const tierDef = EMPLOYEE_TIERS[emp.tier];

  // One work cycle's length — sped by tier skill and by managers on the floor.
  const managerSpeed = emp.role === 'manager' ? 1 : 1 - 0.1 * Math.min(managerCount, 3);
  const workDuration = Math.max(
    6_000,
    Math.round(roleDef.baseCycleMs * tierDef.speed * managerSpeed),
  );

  // CASE A — the cycle that just ended was a break. Clock back in to work.
  if (emp.break) {
    useGameStore.setState((s) => ({
      employees: s.employees.map((e) =>
        e.id === empId
          ? {
              ...e,
              break: undefined,
              idle: undefined,
              cycleStartedAt: now,
              cycleEndsAt: now + workDuration,
            }
          : e,
      ),
    }));
    return;
  }

  let logEntry: EmployeeLogEntry | null = null;
  let profitDelta = 0;
  let mistakeCost = 0;
  let actionDelta = 0;
  let idleReason: string | undefined;
  let flowEntry: CardFlowEntry | null = null;
  let overhead: { lines: { id: string; cost: number }[]; total: number } | null = null;

  // --- Work out whether there is a task this cycle ---
  type Task =
    | { kind: 'source'; item: InventoryItem }
    | { kind: 'flip'; item: InventoryItem; value: number }
    | { kind: 'promote' };
  let task: Task | null = null;

  if (emp.role === 'scout') {
    const cur = useGameStore.getState();
    if (occupiedSlots(cur) >= useGameStore.getState().inventorySlots()) {
      idleReason = 'Inventory full — no room for new stock';
    } else {
      // Scouts comb an endless wholesale supply and bring back the best find
      // they can afford — better tiers and a wider hunt as they rank up.
      const budget = Math.min(cur.cash, scoutBuyCap(emp.tier));
      const tiers: ('mid' | 'premium' | 'whale')[] =
        emp.tier === 3
          ? ['whale', 'premium']
          : emp.tier === 2
          ? ['premium', 'whale']
          : ['mid', 'premium'];
      let best: InventoryItem | null = null;
      for (const lt of tiers) {
        for (let k = 0; k < 4; k++) {
          const cand = sourceWholesaleCard(lt);
          if (cand.purchasePrice <= budget && (!best || cand.baseValue > best.baseValue)) {
            best = cand;
          }
        }
      }
      if (best) task = { kind: 'source', item: best };
      else idleReason = NEEDS_CASH_IDLE;
    }
  } else if (emp.role === 'flipper') {
    // Flip the most valuable scouted card (raw or slab) — never the player's own.
    const cur = useGameStore.getState();
    const stable = vaultStableFor(cur);
    const best = cur.inventory
      .filter(
        (i) =>
          (i.status === 'raw' || i.status === 'graded') &&
          i.autoBought &&
          !cur.showcaseItemIds.includes(i.id),
      )
      .map((i) => ({
        i,
        v: calculateCurrentValue(i, cur.marketTrends, cur.marketNoise, cur.convention, stable),
      }))
      .sort((a, b) => b.v - a.v)[0];
    if (best) task = { kind: 'flip', item: best.i, value: best.v };
    else idleReason = 'No scouted stock to flip yet';
  } else if (emp.role === 'promoter') {
    task = { kind: 'promote' };
  }
  // manager: no direct task — the buff is applied to everyone else's cycle.

  // --- Carry out the task — but a working cycle can still go wrong ---
  if (task) {
    // Scouts handle sketchy wholesale deals — they slip up more than the rest.
    const mistakeBase = emp.role === 'scout' ? 0.085 : 0.05;
    const mistakeChance = Math.max(
      0.012,
      mistakeBase * tierDef.mistake - 0.018 * Math.min(managerCount, 3),
    );
    if (chance(mistakeChance)) {
      // A mistake stings in proportion to the item in play — a fraction of its
      // value, never enough to wipe out the flip it would have earned.
      let cost: number;
      if (task.kind === 'flip') {
        cost = Math.round(task.value * rand(0.1, 0.28));
      } else if (task.kind === 'source') {
        cost = Math.round(task.item.baseValue * rand(0.12, 0.32));
      } else {
        const [lo, hi] = mistakeCostRange(emp.role);
        cost = randInt(lo, hi);
      }
      cost = Math.min(350, Math.max(6, cost));
      mistakeCost = cost;
      profitDelta = -cost;
      const line = pick(MISTAKE_LINES[emp.role]);
      logEntry = { id: uid('elog_'), at: now, kind: 'mistake', text: line, amount: -cost };
      useGameStore.setState((s) => ({ cash: +(s.cash - cost).toFixed(2) }));
      store.pushNotification(
        `${emp.name} the ${roleDef.title} ${line} — it cost you $${cost}.`,
        'warning',
      );
    } else if (task.kind === 'source') {
      const it = task.item;
      useGameStore.setState((s) => ({
        cash: +(s.cash - it.purchasePrice).toFixed(2),
        inventory: [...s.inventory, it],
      }));
      actionDelta = 1;
      logEntry = {
        id: uid('elog_'),
        at: now,
        kind: 'buy',
        text: `Sourced ${it.name} for $${it.purchasePrice} (worth ~$${it.baseValue})`,
        amount: 0,
      };
      flowEntry = {
        id: uid('flow_'),
        cardId: it.cardId,
        name: it.name,
        rarity: it.rarity,
        hue: it.hue,
        grade: it.grade,
        gradingCompany: it.gradingCompany,
        centeringOffsetX: it.centeringOffsetX,
        centeringOffsetY: it.centeringOffsetY,
        kind: 'sourced',
        amount: it.purchasePrice,
      };
    } else if (task.kind === 'flip') {
      const it = task.item;
      const result = useGameStore
        .getState()
        .sellInventoryItem(it.id, undefined, { silent: true });
      if (result) {
        // Operating overhead — shipping, top loaders, cleaning, supplies.
        overhead = computeOverhead(result.net);
        useGameStore.setState((s) => ({ cash: +(s.cash - overhead!.total).toFixed(2) }));
        const netProfit = +(result.profit - overhead.total).toFixed(2);
        profitDelta = netProfit;
        actionDelta = 1;
        logEntry = {
          id: uid('elog_'),
          at: now,
          kind: 'flip',
          text: `Flipped ${it.name} for $${result.net.toFixed(0)} (${
            netProfit >= 0 ? '+' : '-'
          }$${Math.abs(netProfit).toFixed(0)} after $${overhead.total} costs)`,
          amount: netProfit,
        };
        flowEntry = {
          id: uid('flow_'),
          cardId: it.cardId,
          name: it.name,
          rarity: it.rarity,
          hue: it.hue,
          grade: it.grade,
          gradingCompany: it.gradingCompany,
          centeringOffsetX: it.centeringOffsetX,
          centeringOffsetY: it.centeringOffsetY,
          kind: 'flipped',
          amount: netProfit,
        };
      }
    } else {
      const rep = promoterRep(emp.tier);
      useGameStore.setState((s) => ({ reputation: s.reputation + rep }));
      useGameStore.getState().tryUnlockMarketplaces();
      actionDelta = 1;
      logEntry = {
        id: uid('elog_'),
        at: now,
        kind: 'promo',
        text: `Ran a brand push — +${rep} reputation`,
        amount: 0,
      };
    }
  }

  // Flag the player once when a worker first stalls out for lack of cash.
  if (idleReason === NEEDS_CASH_IDLE && emp.idle !== NEEDS_CASH_IDLE) {
    store.pushNotification(
      `${emp.name} the ${roleDef.title} is idle — your account is too low to buy stock.`,
      'warning',
    );
  }

  // Schedule the next cycle — sometimes the employee slips off for a break.
  let breakEntry: EmployeeLogEntry | null = null;
  let nextBreak: string | undefined;
  let nextDuration = workDuration;
  if (!idleReason) {
    const managerEase = 1 - 0.1 * Math.min(managerCount, 3);
    // Social breaks need coworkers around to get distracted with.
    const hasCoworkers = store.employees.length > 1;
    if (chance(EMPLOYEE_BREAK_CHANCE * managerEase)) {
      const b = pick(EMPLOYEE_BREAKS);
      nextBreak = b.label;
      nextDuration = randInt(b.minMs, b.maxMs);
      breakEntry = {
        id: uid('elog_'),
        at: now,
        kind: 'break',
        text: `Slipped out — ${b.label}`,
        amount: 0,
      };
    } else if (hasCoworkers && chance(EMPLOYEE_SOCIAL_BREAK_CHANCE * managerEase)) {
      const b = pick(EMPLOYEE_SOCIAL_BREAKS);
      const coworker = pick(store.employees.filter((e) => e.id !== empId));
      const label = b.label.replace('{name}', coworker.name);
      nextBreak = label;
      nextDuration = randInt(b.minMs, b.maxMs);
      breakEntry = {
        id: uid('elog_'),
        at: now,
        kind: 'break',
        text: `Got distracted — ${label}`,
        amount: 0,
      };
    }
  }
  const newEntries = [breakEntry, logEntry].filter(Boolean) as EmployeeLogEntry[];

  useGameStore.setState((s) => ({
    employees: s.employees.map((e) =>
      e.id === empId
        ? {
            ...e,
            cycleStartedAt: now,
            cycleEndsAt: now + nextDuration,
            actions: e.actions + actionDelta,
            profit: +(e.profit + profitDelta).toFixed(2),
            mistakes: e.mistakes + (mistakeCost > 0 ? 1 : 0),
            mistakeCost: +(e.mistakeCost + mistakeCost).toFixed(2),
            log: newEntries.length ? [...newEntries, ...e.log].slice(0, 30) : e.log,
            idle: idleReason,
            break: nextBreak,
          }
        : e,
    ),
    companyProfit: +(s.companyProfit + profitDelta).toFixed(2),
    cardFlow: flowEntry ? [flowEntry, ...s.cardFlow].slice(0, CARD_FLOW_CAP) : s.cardFlow,
    operatingCosts: overhead
      ? overhead.lines.reduce(
          (acc, l) => ({ ...acc, [l.id]: +((acc[l.id] ?? 0) + l.cost).toFixed(2) }),
          { ...s.operatingCosts },
        )
      : s.operatingCosts,
  }));
}

function awardWonAuction(auctionId: string, price: number) {
  const store = useGameStore.getState();
  const auction = store.auctions.find((a) => a.id === auctionId);
  if (!auction) return;
  if (store.cash < price) {
    store.pushNotification('You "won" but cash ran out. The bid fell through.', 'warning');
    return;
  }
  const slots = store.inventorySlots();
  if (occupiedSlots(store) >= slots) {
    store.pushNotification('You won the auction but inventory is full! Sell something fast.', 'warning');
    return;
  }
  const card = getCardById(auction.cardId);
  const item: InventoryItem = {
    id: uid('inv_'),
    cardId: auction.cardId,
    name: card.name,
    set: card.set,
    rarity: auction.rarity,
    rawCondition: auction.rawCondition,
    actualConditionScore: auction.actualConditionScore,
    centeringOffsetX: auction.centeringOffsetX,
    centeringOffsetY: auction.centeringOffsetY,
    purchasePrice: price,
    baseValue: auction.trueMarketValue,
    status: 'raw',
    acquiredFrom: 'BidGoblin',
    acquiredAt: Date.now(),
    isFake: auction.isFake,
    hue: card.hue,
  };
  useGameStore.setState((s) => {
    const acq = recordAcquisitions(s.collection, [item]);
    return {
      cash: +(s.cash - price).toFixed(2),
      inventory: [...s.inventory, item],
      collection: acq.collection,
      stats: {
        ...s.stats,
        auctionsWon: s.stats.auctionsWon + 1,
        totalBought: s.stats.totalBought + 1,
        highestSinglePurchase: Math.max(s.stats.highestSinglePurchase, price),
      },
    };
  });
  SFX.chaching();
  useGameStore.getState().pushNotification(
    `Won "${card.name}" on BidGoblin for $${price}.`,
    'success',
  );
  useGameStore.getState().evaluateAndApplyAchievements({ kind: 'auction_won' });
  useGameStore.getState().evaluateAndApplyAchievements({ kind: 'bought', isFake: auction.isFake });
  useGameStore.getState().save();
}

function cleanTitle(title: string): string {
  return title.replace(
    /^(Vintage |Mint |RARE |PSA-Ready |Old |Shiny |Holo |Mystery |Sealed |Estate Lot |Garage Find |Closet Pull |Investment |Hot |Trending )?/i,
    '',
  );
}

export const upgradeEffects = UPGRADE_EFFECTS;
