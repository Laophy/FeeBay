import { CARDS } from '../data/cards';

const NOISE_MIN = 0.78;
const NOISE_MAX = 1.32;
const MEAN_REVERSION = 0.18;

/**
 * Each card's market value carries a slow, idiosyncratic random walk near 1.0,
 * independent of macro trend events. Volatility scales by the card's volatility stat.
 */
export function stepMarketNoise(prev: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const card of CARDS) {
    const cur = prev[card.id] ?? 1.0;
    const vol = (card.volatility ?? 30) / 100; // 0–1
    const drift = (Math.random() - 0.5) * 0.08 * (0.5 + vol); // up to ±5.2%
    const revert = (1.0 - cur) * MEAN_REVERSION;
    const updated = Math.max(NOISE_MIN, Math.min(NOISE_MAX, cur + drift + revert));
    next[card.id] = +updated.toFixed(3);
  }
  return next;
}

export function initialMarketNoise(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const card of CARDS) out[card.id] = 1.0;
  return out;
}

export function getNoise(map: Record<string, number>, cardId: string): number {
  return map[cardId] ?? 1.0;
}
