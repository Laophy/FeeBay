import type { MarketplaceSource } from '../types';

/** Per-tick probability a player listing sells, given its price vs reference value. */
export function saleProbabilityPerTick(
  price: number,
  refValue: number,
  marketplace: MarketplaceSource,
): number {
  if (refValue <= 0) return 0;
  const ratio = price / refValue;
  if (ratio > 1.6) return 0;
  // base rates per ~10s tick — Headbook foot traffic is higher than SlabHub
  const baseRate =
    marketplace === 'Headbook Marketplace'
      ? 0.07
      : marketplace === 'JaredsList'
      ? 0.05
      : marketplace === 'PackTok Shop'
      ? 0.08
      : marketplace === 'FeeBay'
      ? 0.06
      : marketplace === 'SlabHub'
      ? 0.05
      : 0.04;
  return baseRate * Math.exp(-3 * Math.max(0, ratio - 0.85));
}

export const DEFAULT_LISTING_DURATION_MS = 8 * 60_000; // 8 game minutes
export const PLAYER_LISTING_TICK_MS = 10_000;
