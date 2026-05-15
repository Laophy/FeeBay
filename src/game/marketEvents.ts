import type { MarketTrend } from '../types';
import { pick, rand } from './rng';

type EventTemplate = {
  tag: string;
  label: string;
  direction: 'up' | 'down';
  multRange: [number, number];
  durationMs: number;
};

const EVENT_POOL: EventTemplate[] = [
  { tag: 'dragon', label: 'Dragon Hype: tournament finals are loaded with dragons', direction: 'up', multRange: [1.25, 1.7], durationMs: 90_000 },
  { tag: 'fire', label: 'Fire types trending after a streamer pull', direction: 'up', multRange: [1.15, 1.5], durationMs: 75_000 },
  { tag: 'water', label: 'Water decks crushed at regionals', direction: 'down', multRange: [0.7, 0.9], durationMs: 60_000 },
  { tag: 'goblin', label: 'Goblin Mania: PackTok influencer shouts out Golden Goblin', direction: 'up', multRange: [1.4, 2.0], durationMs: 90_000 },
  { tag: 'first-edition', label: 'First Edition nostalgia bubble is inflating', direction: 'up', multRange: [1.3, 1.8], durationMs: 120_000 },
  { tag: 'first-edition', label: 'First Edition FRENZY: vintage stamped prints are skyrocketing', direction: 'up', multRange: [1.9, 2.7], durationMs: 110_000 },
  { tag: 'error', label: 'Error print boom: collectors hunting misprints', direction: 'up', multRange: [1.5, 2.2], durationMs: 90_000 },
  { tag: 'influencer', label: 'Influencer is dumping the bag, prices tanking', direction: 'down', multRange: [0.55, 0.8], durationMs: 75_000 },
  { tag: 'neon', label: 'Neon cards going viral', direction: 'up', multRange: [1.3, 1.9], durationMs: 80_000 },
  { tag: 'shadow', label: 'Reprint announced: shadow set crashing', direction: 'down', multRange: [0.5, 0.8], durationMs: 100_000 },
  { tag: 'cosmic', label: 'Cosmic Drift expansion sells out, demand spikes', direction: 'up', multRange: [1.2, 1.6], durationMs: 100_000 },
  { tag: 'meta', label: 'New meta deck spotted in pro play', direction: 'up', multRange: [1.2, 1.6], durationMs: 75_000 },
  { tag: 'crystal', label: 'Crystal-type collectors at a convention this weekend', direction: 'up', multRange: [1.2, 1.5], durationMs: 70_000 },
  { tag: 'cute', label: 'Cute card aesthetic trending on Headbook', direction: 'up', multRange: [1.1, 1.4], durationMs: 60_000 },
  { tag: 'flying', label: 'Flying type tournament results coming in hot', direction: 'up', multRange: [1.2, 1.5], durationMs: 75_000 },
  { tag: 'ice', label: 'Ice meta busted out at locals', direction: 'up', multRange: [1.15, 1.4], durationMs: 60_000 },
  { tag: 'metal', label: 'Metal types: dumped after reprint leak', direction: 'down', multRange: [0.65, 0.85], durationMs: 70_000 },
];

export function rollMarketEvent(now: number): MarketTrend {
  const t = pick(EVENT_POOL);
  const mult = rand(t.multRange[0], t.multRange[1]);
  return {
    tag: t.tag,
    label: t.label,
    direction: t.direction,
    multiplier: +mult.toFixed(2),
    expiresAt: now + t.durationMs,
  };
}

export function pruneExpiredTrends(trends: MarketTrend[], now: number): MarketTrend[] {
  return trends.filter((t) => t.expiresAt > now);
}
