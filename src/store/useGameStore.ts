import { create } from 'zustand';
import type {
  AuctionListing,
  GameNotification,
  GameState,
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
import { pruneExpiredTrends, rollMarketEvent } from '../game/marketEvents';
import { loadGame, saveGame } from '../game/saveSystem';
import { rand, uid } from '../game/rng';
import { getMarketplace, MARKETPLACES } from '../data/marketplaces';
import { UPGRADES, UPGRADE_EFFECTS } from '../data/upgrades';
import { getCardById } from '../data/cards';
import { resolveMysteryLot, resolveStorageUnit } from '../game/lotResolver';
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
  generateAuctions,
  tickAuctionRivals,
  trySnipe,
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
    crashesCaused: 0,
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
    pendingLotReveals: [],
    achievementsUnlocked: [],
    achievementsClaimed: [],
    netWorthSamples: [],
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
    hiredHelpState: {
      apprenticeLastFlipAt: 0,
      buyerAgentLastBuyAt: 0,
      marketingLastTickAt: 0,
    },
    ui: {
      inventoryFilter: 'all',
      inventorySortKey: 'recent',
      marketplaceActiveSource: 'all',
    },
  };
}

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
  buyListing(listingId: string): void;
  sellInventoryItem(itemId: string, marketplace?: MarketplaceSource): void;
  sendToGrading(itemId: string, companyId: GradingCompanyId): void;
  resolveDueGrading(): void;
  consumeGradeReveal(submissionId: string): void;
  consumeLotReveal(lotId: string): void;
  triggerMarketEvent(): void;
  tickTrends(): void;
  purchaseUpgrade(upgradeId: string): void;
  pushNotification(message: string, kind?: GameNotification['kind']): void;
  dismissNotification(id: string): void;
  hasUpgrade(effect: string): boolean;
  inventorySlots(): number;
  resetGame(): void;
  save(): void;
  tryUnlockMarketplaces(): void;
  unlockAchievements(ids: string[]): void;
  refreshAuctions(): void;
  tickListings(): void;
  placeBid(auctionId: string): void;
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
  tickHiredHelp(): void;
  promoteBusinessLevel(): void;
  setInventoryFilter(filter: GameState['ui']['inventoryFilter']): void;
  setInventorySortKey(key: GameState['ui']['inventorySortKey']): void;
  setMarketplaceActiveSource(src: GameState['ui']['marketplaceActiveSource']): void;
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
  claimAchievement(id: string): void;
  claimAllAchievements(): void;
  /** central evaluation hook */
  evaluateAndApplyAchievements(ctx: Parameters<typeof evaluateAchievements>[1]): void;
};

export type GameStore = GameState & Actions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultState(),

  init() {
    const loaded = loadGame();
    if (loaded) {
      set({ ...defaultState(), ...loaded });
    }
    if (get().listings.length === 0) {
      get().refreshListings();
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

  buyListing(listingId) {
    const state = get();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return;
    if (state.cash < listing.askingPrice) {
      get().pushNotification("Not enough cash for that listing.", 'warning');
      return;
    }

    const isMysteryLot = listing.lotType === 'mystery_lot' || listing.lotType === 'binder';
    const isStorageUnit = listing.lotType === 'storage_unit';
    const slots = get().inventorySlots();

    if (isMysteryLot || isStorageUnit) {
      const { items } = isStorageUnit
        ? resolveStorageUnit(listing, listing.source)
        : resolveMysteryLot(listing, listing.source);
      if (state.inventory.length + items.length > slots) {
        get().pushNotification(
          `Lot has ${items.length} cards, only ${slots - state.inventory.length} slots free.`,
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

    if (state.inventory.length >= slots) {
      get().pushNotification('Inventory full. Sell or buy more storage.', 'warning');
      return;
    }
    const isSlabListing =
      listing.lotType === 'slab' && listing.grade !== undefined && listing.gradingCompany;
    const item: InventoryItem = {
      id: uid('inv_'),
      cardId: listing.cardId,
      name: isSlabListing
        ? // strip the leading "10 PZA • " label so the inventory name reads cleanly
          cleanTitle(listing.title).replace(/^\s*\d+(\.\d)?\s+(ZAG|PZA|Bucket)\s*•\s*/i, '')
        : cleanTitle(listing.title),
      set: '',
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
    if (acq.newCardIds.length > 0) {
      get().pushNotification(`New card added to collection: ${item.name}.`, 'success');
    }
    SFX.buy();
    get().pushNotification(
      `Bought "${listing.title}" for $${listing.askingPrice} on ${listing.source}.`,
      'success',
    );
    get().evaluateAndApplyAchievements({ kind: 'bought', isFake: listing.isFake });
    get().save();
  },

  sellInventoryItem(itemId, marketplaceOverride) {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.status === 'grading' || item.status === 'sold') return;
    const marketplaceId: MarketplaceSource =
      marketplaceOverride ?? (item.status === 'graded' && state.marketplacesUnlocked.includes('SlabHub') ? 'SlabHub' : 'FeeBay');
    if (!state.marketplacesUnlocked.includes(marketplaceId)) {
      get().pushNotification(`${marketplaceId} is locked.`, 'warning');
      return;
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
  },

  sellBundle(itemIds, marketplaceOverride) {
    const state = get();
    if (itemIds.length < 2) {
      get().pushNotification('A bundle needs at least 2 cards.', 'warning');
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
    const bulkDiscount = state.upgradesPurchased.includes('bulk_grade') ? 0.2 : 0;
    const express = state.upgradesPurchased.includes('express_grading');
    const cost = Math.max(1, Math.round(company.cost * (1 - bulkDiscount)));
    const turnaround = express ? Math.round(company.turnaroundMs * 0.5) : company.turnaroundMs;
    if (state.cash < cost) {
      get().pushNotification('Not enough cash to grade.', 'warning');
      return;
    }
    const submission = {
      id: uid('grd_'),
      itemId,
      cardName: item.name,
      cost,
      submittedAt: Date.now(),
      resolveAt: Date.now() + turnaround,
      company: company.id,
    };
    set({
      cash: +(state.cash - cost).toFixed(2),
      inventory: state.inventory.map((i) =>
        i.id === itemId ? { ...i, status: 'grading', gradingCompany: company.id } : i,
      ),
      gradingSubmissions: [...state.gradingSubmissions, submission],
    });
    SFX.click();
    get().pushNotification(
      `Sent ${item.name} to ${company.name} ($${cost}${express ? ', express' : ''}).`,
      'info',
    );
    get().save();
  },

  resolveDueGrading() {
    const state = get();
    const now = Date.now();
    const due = state.gradingSubmissions.filter((s) => s.resolveAt <= now);
    if (due.length === 0) return;
    let inventory = [...state.inventory];
    const reveals = [...state.pendingGradeReveals];
    const stats = {
      ...state.stats,
      gradesReceived: { ...state.stats.gradesReceived },
      gradingCompaniesUsed: [...state.stats.gradingCompaniesUsed],
    };
    let collection = state.collection;
    for (const sub of due) {
      const item = inventory.find((i) => i.id === sub.itemId);
      if (!item) continue;
      const result = rollGrade(item, sub.company);
      const updated: InventoryItem = {
        ...item,
        status: 'graded',
        grade: result.grade,
        gradeLabel: result.label,
        gradingCompany: result.company,
      };
      const finalValue = calculateCurrentValue(updated, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state));
      inventory = inventory.map((i) => (i.id === item.id ? updated : i));
      reveals.push({
        submissionId: sub.id,
        itemId: item.id,
        finalValue,
        grade: result.grade,
        gradeLabel: result.label,
        company: result.company,
      });
      const key = String(result.grade);
      stats.gradesReceived[key] = (stats.gradesReceived[key] ?? 0) + 1;
      if (!stats.gradingCompaniesUsed.includes(result.company)) {
        stats.gradingCompaniesUsed.push(result.company);
      }
      if (result.grade >= 10) stats.gem10sToday = (stats.gem10sToday ?? 0) + 1;
      collection = recordGradeUpdate(collection, item.cardId, result.grade);
    }
    set({
      inventory,
      pendingGradeReveals: reveals,
      gradingSubmissions: state.gradingSubmissions.filter((s) => !due.includes(s)),
      stats,
      collection,
    });
    // Trigger achievement evaluation for each newly graded item
    for (const r of reveals.slice(state.pendingGradeReveals.length)) {
      const item = inventory.find((i) => i.id === r.itemId);
      if (item) get().evaluateAndApplyAchievements({ kind: 'graded', grade: r.grade, item });
    }
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
    set((s) => ({ notifications: [note, ...s.notifications].slice(0, 30) }));
  },

  dismissNotification(id) {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
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

  tickPlayerListings() {
    const state = get();
    if (state.playerListings.length === 0) return;
    const now = Date.now();
    let cashDelta = 0;
    let inventory = state.inventory;
    const remaining: typeof state.playerListings = [];
    let totalProfit = state.stats.totalProfit;
    let totalFees = state.stats.totalFeesPaid;
    let totalSold = state.stats.totalSold;
    let bestProfit = state.stats.bestSaleProfit;
    let biggestLoss = state.stats.biggestLoss;
    let reputationGain = 0;
    let storefrontSales = state.stats.storefrontSales;
    let anyStorefrontSale = false;

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
        // Sold
        const mkt = getMarketplace(listing.marketplace);
        const feeDiscount = feeDiscountFor(state);
        const sale = computeSale(listing.askingPrice, mkt, feeDiscount);
        const profit = +(sale.net - item.purchasePrice).toFixed(2);
        cashDelta += sale.net;
        totalProfit += profit;
        totalFees += sale.sellerFee + sale.paymentFee + sale.flatFee;
        totalSold += 1;
        bestProfit = Math.max(bestProfit, profit);
        biggestLoss = Math.min(biggestLoss, profit);
        if (profit > 0) reputationGain += 1;
        storefrontSales += 1;
        anyStorefrontSale = true;
        inventory = inventory.filter((i) => i.id !== item.id);
        SFX.chaching();
        get().pushNotification(
          `Buyer bought ${item.name} on ${listing.marketplace} for $${sale.net.toFixed(2)} (+$${profit.toFixed(2)}).`,
          profit >= 0 ? 'success' : 'warning',
        );
        continue;
      }
      remaining.push({ ...listing, views: slot });
    }

    if (
      cashDelta !== 0 ||
      remaining.length !== state.playerListings.length ||
      reputationGain !== 0
    ) {
      set({
        cash: +(state.cash + cashDelta).toFixed(2),
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
        },
        reputation: state.reputation + reputationGain,
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

  tickHiredHelp() {
    const state = get();
    const u = state.upgradesPurchased;
    if (
      !u.includes('hire_apprentice') &&
      !u.includes('hire_buyer_agent') &&
      !u.includes('hire_marketing')
    )
      return;

    const now = Date.now();
    const hs = state.hiredHelpState;

    // Apprentice: every ~30s, auto-flip the lowest-value raw card under $80 in inventory.
    if (u.includes('hire_apprentice') && now - hs.apprenticeLastFlipAt > 30_000) {
      const candidates = state.inventory
        .filter((i) => i.status === 'raw' && !i.isFake)
        .map((i) => ({
          item: i,
          value: calculateCurrentValue(i, state.marketTrends, state.marketNoise, state.convention, vaultStableFor(state)),
        }))
        .filter((c) => c.value <= 80)
        .sort((a, b) => a.value - b.value);
      if (candidates.length > 0) {
        const target = candidates[0].item;
        const mkt = state.marketplacesUnlocked.includes('FeeBay') ? 'FeeBay' : state.marketplacesUnlocked[0];
        get().sellInventoryItem(target.id, mkt);
        get().pushNotification(`Apprentice flipped ${target.name}.`, 'info');
      }
      set((s) => ({
        hiredHelpState: { ...s.hiredHelpState, apprenticeLastFlipAt: now },
      }));
    }

    // Buyer Agent: every ~25s, auto-buy the best ≤60% true-value listing under $500.
    if (u.includes('hire_buyer_agent') && now - hs.buyerAgentLastBuyAt > 25_000) {
      const targets = state.listings
        .filter(
          (l) =>
            !l.isFake &&
            l.lotType === 'single' &&
            l.askingPrice <= 500 &&
            l.askingPrice <= l.trueMarketValue * 0.6 &&
            state.cash >= l.askingPrice,
        )
        .sort((a, b) => b.trueMarketValue - b.askingPrice - (a.trueMarketValue - a.askingPrice));
      const slots = get().inventorySlots();
      if (targets.length > 0 && state.inventory.length < slots) {
        const target = targets[0];
        get().buyListing(target.id);
        get().pushNotification(`Buyer Agent grabbed ${target.title.slice(0, 30)}.`, 'info');
      }
      set((s) => ({
        hiredHelpState: { ...s.hiredHelpState, buyerAgentLastBuyAt: now },
      }));
    }

    // Marketing Manager: +1 reputation per minute, applied 0.1/6s.
    if (u.includes('hire_marketing')) {
      const lastTick = hs.marketingLastTickAt || now;
      const elapsed = now - lastTick;
      if (elapsed >= 60_000) {
        set((s) => ({
          reputation: s.reputation + Math.floor(elapsed / 60_000),
          hiredHelpState: { ...s.hiredHelpState, marketingLastTickAt: now },
        }));
        get().tryUnlockMarketplaces();
      } else if (!hs.marketingLastTickAt) {
        set((s) => ({
          hiredHelpState: { ...s.hiredHelpState, marketingLastTickAt: now },
        }));
      }
    }
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
    const netWorth = state.cash + inventoryValue;
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
      pendingLotReveals: state.pendingLotReveals,
      achievementsUnlocked: state.achievementsUnlocked,
      achievementsClaimed: state.achievementsClaimed,
      netWorthSamples: state.netWorthSamples.slice(-200),
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
      hiredHelpState: state.hiredHelpState,
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
    }
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
      get().pushNotification(`Goblin is napping. New batch in ${remaining}s.`, 'info');
      return;
    }
    const fresh = generateAuctions(now, state.marketTrends, 4);
    set({ auctions: fresh, lastAuctionRefresh: now });
    SFX.whoosh();
  },

  placeBid(auctionId) {
    const state = get();
    const auction = state.auctions.find((a) => a.id === auctionId);
    if (!auction || auction.resolved) return;
    if (Date.now() >= auction.endsAt) return;
    const nextBid = auction.currentBid + auction.bidIncrement;
    if (state.cash < nextBid) {
      get().pushNotification('Not enough cash to cover the bid.', 'warning');
      return;
    }
    set({
      auctions: state.auctions.map((a) =>
        a.id === auctionId ? { ...a, currentBid: nextBid, isMine: true } : a,
      ),
    });
    SFX.click();
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
    if (state.inventory.length >= slots) {
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
    const autoSnipeOn = state.upgradesPurchased.includes('auto_sniper');
    const updated = state.auctions.map((a) => {
      if (a.resolved) return a;
      let next = tickAuctionRivals(a, now);
      if (autoSnipeOn) next = trySnipe(next, now);
      if (now >= next.endsAt) {
        return { ...next, resolved: true, wonByPlayer: next.isMine };
      }
      return next;
    });
    set({ auctions: updated });

    for (const a of updated) {
      const prev = state.auctions.find((p) => p.id === a.id);
      if (!prev || prev.resolved || !a.resolved) continue;
      if (a.wonByPlayer) {
        awardWonAuction(a.id, a.currentBid);
      } else {
        get().pushNotification('Outbid! The goblin laughs.', 'info');
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
    const v = +(state.cash + inventoryValue).toFixed(2);
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
  setInventorySortKey(key) {
    set((s) => ({ ui: { ...s.ui, inventorySortKey: key } }));
  },
  setMarketplaceActiveSource(src) {
    set((s) => ({ ui: { ...s.ui, marketplaceActiveSource: src } }));
  },
}));

function awardWonAuction(auctionId: string, price: number) {
  const store = useGameStore.getState();
  const auction = store.auctions.find((a) => a.id === auctionId);
  if (!auction) return;
  if (store.cash < price) {
    store.pushNotification('You "won" but cash ran out. The bid fell through.', 'warning');
    return;
  }
  const slots = store.inventorySlots();
  if (store.inventory.length >= slots) {
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
