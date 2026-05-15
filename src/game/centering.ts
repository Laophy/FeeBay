import type { ListingQuality } from '../types';
import { chance, rand, randInt } from './rng';

export const MAX_CENTERING_OFFSET = 8;

/**
 * Roll centering offsets for a card based on its listing quality.
 * Returns integer offsets in [-MAX_CENTERING_OFFSET, +MAX_CENTERING_OFFSET].
 * Quality-aware: gem candidates are near-perfect, damaged/fake stuff can be brutal.
 */
export function rollCentering(quality?: ListingQuality): {
  centeringOffsetX: number;
  centeringOffsetY: number;
} {
  let spreadMax = 4;
  switch (quality) {
    case 'grading_candidate':
    case 'hidden_gem':
      spreadMax = chance(0.55) ? 1 : 2;
      break;
    case 'obvious_deal':
      spreadMax = 3;
      break;
    case 'fair':
      spreadMax = 4;
      break;
    case 'mislisted_rare':
      spreadMax = 3;
      break;
    case 'overpriced':
      spreadMax = 5;
      break;
    case 'fake':
      spreadMax = 6;
      break;
    case 'damaged':
      spreadMax = 7;
      break;
    default:
      spreadMax = 4;
  }
  const signX = chance(0.5) ? -1 : 1;
  const signY = chance(0.5) ? -1 : 1;
  const x = randInt(0, spreadMax) * signX;
  const y = randInt(0, spreadMax) * signY;
  return { centeringOffsetX: x, centeringOffsetY: y };
}

/** 0–100 where 100 is dead-center. */
export function centeringScore(offsetX: number, offsetY: number): number {
  const ax = Math.abs(offsetX);
  const ay = Math.abs(offsetY);
  return Math.max(0, Math.round(100 - (ax + ay) * 6.25));
}

/** Multiplier applied to true value when computing sale/list price. */
export function centeringPriceMultiplier(offsetX: number, offsetY: number): number {
  // 100 → 1.05, 50 → 0.93, 0 → 0.82
  const s = centeringScore(offsetX, offsetY);
  return +(0.82 + (s / 100) * 0.23).toFixed(3);
}

/** Combined grading score 0-100 used by the grading engine. */
export function combinedGradingScore(
  conditionScore: number,
  offsetX: number,
  offsetY: number,
): number {
  const cs = centeringScore(offsetX, offsetY);
  // Surface 65%, centering 35% — centering can sink a gem and lift a moderately played card a little
  return Math.max(0, Math.min(100, Math.round(conditionScore * 0.65 + cs * 0.35)));
}

/** Human-readable label, suitable for UI hints. */
export function centeringLabel(offsetX: number, offsetY: number): string {
  const ax = Math.abs(offsetX);
  const ay = Math.abs(offsetY);
  if (ax <= 1 && ay <= 1) return 'Dead-center';
  if (ax + ay <= 3) return 'Slight off-center';
  if (ax + ay <= 6) return 'Off-center';
  if (ax + ay <= 10) return 'Noticeably off-center';
  return 'Heavily off-center';
}

/** Lean direction phrase like "leans right" / "leans top-left". */
export function centeringLean(offsetX: number, offsetY: number): string {
  const parts: string[] = [];
  if (offsetY <= -2) parts.push('top');
  if (offsetY >= 2) parts.push('bottom');
  if (offsetX <= -2) parts.push('left');
  if (offsetX >= 2) parts.push('right');
  if (parts.length === 0) return '';
  return `leans ${parts.join('-')}`;
}

/** Map offsets to border-pixel widths for the four sides of the card. */
export function centeringBorders(offsetX: number, offsetY: number): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  // Base 2px, each unit of offset adds 0.5 px to the heavy side (capped at 6px).
  const base = 2;
  const heavyL = offsetX > 0 ? offsetX : 0;
  const heavyR = offsetX < 0 ? -offsetX : 0;
  const heavyT = offsetY > 0 ? offsetY : 0;
  const heavyB = offsetY < 0 ? -offsetY : 0;
  const scale = 0.6;
  const cap = (v: number) => Math.min(6, base + v * scale);
  return {
    left: cap(heavyL),
    right: cap(heavyR),
    top: cap(heavyT),
    bottom: cap(heavyB),
  };
}

/**
 * Centering for an already-graded slab. A high grade implies the graders
 * liked the centering, so a Gem 10 should never look badly off-center.
 */
export function rollCenteringForGrade(grade: number): {
  centeringOffsetX: number;
  centeringOffsetY: number;
} {
  let spreadMax: number;
  if (grade >= 10) spreadMax = 1;
  else if (grade >= 9) spreadMax = 2;
  else if (grade >= 8) spreadMax = 3;
  else if (grade >= 7) spreadMax = 4;
  else spreadMax = 6;
  const signX = chance(0.5) ? -1 : 1;
  const signY = chance(0.5) ? -1 : 1;
  return {
    centeringOffsetX: randInt(0, spreadMax) * signX,
    centeringOffsetY: randInt(0, spreadMax) * signY,
  };
}

/** Roll function with no quality bias — for random lot cards or fallback uses. */
export function rollCenteringNeutral(): { centeringOffsetX: number; centeringOffsetY: number } {
  const signX = rand(0, 1) < 0.5 ? -1 : 1;
  const signY = rand(0, 1) < 0.5 ? -1 : 1;
  return {
    centeringOffsetX: randInt(0, 5) * signX,
    centeringOffsetY: randInt(0, 5) * signY,
  };
}
