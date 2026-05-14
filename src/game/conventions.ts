import type { ConventionState, MarketplaceListing, MarketplaceSource } from '../types';
import { CARDS } from '../data/cards';
import { generateListings } from './listingGenerator';
import { pick, rand, randInt, uid } from './rng';

export type ConventionTemplate = {
  id: string;
  name: string;
  pumpedTags: string[];
  durationMs: number;
  boost: number;
};

export const CONVENTION_POOL: ConventionTemplate[] = [
  {
    id: 'dragoncon',
    name: 'DragonCon',
    pumpedTags: ['dragon', 'fire', 'flying'],
    durationMs: 5 * 60_000,
    boost: 1.45,
  },
  {
    id: 'cosmic-fest',
    name: 'Cosmic Festival',
    pumpedTags: ['cosmic', 'moon', 'signed'],
    durationMs: 5 * 60_000,
    boost: 1.4,
  },
  {
    id: 'goblin-bazaar',
    name: 'Goblin Bazaar',
    pumpedTags: ['goblin', 'trickster', 'first-edition'],
    durationMs: 5 * 60_000,
    boost: 1.5,
  },
  {
    id: 'metal-expo',
    name: 'Metal Expo',
    pumpedTags: ['metal', 'meta', 'tournament'],
    durationMs: 5 * 60_000,
    boost: 1.35,
  },
  {
    id: 'cute-con',
    name: 'CuteCon',
    pumpedTags: ['cute', 'plant', 'water'],
    durationMs: 5 * 60_000,
    boost: 1.4,
  },
];

export function rollConvention(now: number): ConventionState {
  const t = pick(CONVENTION_POOL);
  return {
    id: `${t.id}_${now}`,
    name: t.name,
    startedAt: now,
    endsAt: now + t.durationMs,
    boostMultiplier: t.boost,
    pumpedTags: t.pumpedTags,
  };
}

/** Generate a convention-only listing pool. Premium-biased rarities for cards matching the pumped tags. */
export function generateConventionListings(
  convention: ConventionState,
  unlocked: MarketplaceSource[],
  count = 10,
): MarketplaceListing[] {
  // Use the regular generator but post-filter for matching cards, and bump prices a bit.
  const all = generateListings(unlocked, [], count * 2, 60);
  const matches = all
    .filter((l) => {
      const card = CARDS.find((c) => c.id === l.cardId);
      return card?.trendTags.some((t) => convention.pumpedTags.includes(t));
    })
    .slice(0, count);
  // Stamp them with the convention source marker via title prefix so the UI can theme.
  return matches.map((l) => ({
    ...l,
    id: uid('lst_'),
    title: `[${convention.name}] ${l.title}`,
    askingPrice: Math.max(2, Math.round(l.askingPrice * rand(0.95, 1.15))),
    timeRemainingSeconds: Math.min(
      l.timeRemainingSeconds,
      randInt(60, 240),
    ),
  }));
}
