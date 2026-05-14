import type { MarketplaceListing } from '../types';
import { rand } from './rng';

export type NegotiationOutcome =
  | { kind: 'accept'; price: number; flavor: string }
  | { kind: 'counter'; price: number; flavor: string }
  | { kind: 'reject'; flavor: string };

const ACCEPT_FLAVORS_CLUELESS = [
  '"Yeah whatever, take it."',
  '"Sure I guess, my husband told me to get rid of them anyway."',
  '"Done deal, friend."',
];
const ACCEPT_FLAVORS_FAIR = [
  '"That works. Send the funds."',
  '"Alright, you got me. Deal."',
];
const COUNTER_FLAVORS = [
  '"I’ll go that low if you bump it a bit."',
  '"How about meeting in the middle?"',
  '"Close, but I need a little more."',
  '"My wife will kill me if I take less than this."',
];
const REJECT_FLAVORS_HYPE = [
  '"LOL no. I know what I have."',
  '"That’s insulting. Don’t lowball me."',
  '"Read the description. NO LOWBALLS."',
  '"Pass. Going to PackTok with it."',
];
const REJECT_FLAVORS_FIRM = [
  '"Asking is firm. No offers."',
  '"That doesn’t cover my costs."',
  '"Not gonna happen, sorry."',
];

function pickFrom(a: string[]): string {
  return a[Math.floor(Math.random() * a.length)];
}

function counterBetween(
  offer: number,
  ask: number,
  minRatio: number,
  maxRatio: number,
): NegotiationOutcome {
  const ratio = rand(minRatio, maxRatio);
  const price = Math.max(offer + 1, Math.round(ask * ratio));
  return { kind: 'counter', price, flavor: pickFrom(COUNTER_FLAVORS) };
}

/**
 * Decide an outcome for an offer.
 *  - Clueless sellers (hidden_gem/mislisted_rare/obvious_deal) accept low readily.
 *  - Hyped sellers (overpriced/fake) reject hard.
 *  - Fair/damaged/grading_candidate: meet in the middle.
 * `softening` lowers the seller's acceptance threshold (e.g. 0.1 = -10% required ratio).
 */
export function evaluateOffer(
  listing: MarketplaceListing,
  offer: number,
  softening = 0,
): NegotiationOutcome {
  const ratio = offer / listing.askingPrice + softening;
  const quality = listing.qualityType;

  if (
    quality === 'hidden_gem' ||
    quality === 'mislisted_rare' ||
    quality === 'obvious_deal'
  ) {
    if (ratio >= 0.55) return { kind: 'accept', price: offer, flavor: pickFrom(ACCEPT_FLAVORS_CLUELESS) };
    if (ratio >= 0.35) return counterBetween(offer, listing.askingPrice, 0.55, 0.7);
    return { kind: 'reject', flavor: pickFrom(REJECT_FLAVORS_FIRM) };
  }

  if (quality === 'overpriced' || quality === 'fake') {
    if (ratio >= 1.0) return { kind: 'accept', price: offer, flavor: pickFrom(ACCEPT_FLAVORS_FAIR) };
    if (ratio >= 0.85) return counterBetween(offer, listing.askingPrice, 0.95, 1.05);
    return { kind: 'reject', flavor: pickFrom(REJECT_FLAVORS_HYPE) };
  }

  if (ratio >= 0.92) return { kind: 'accept', price: offer, flavor: pickFrom(ACCEPT_FLAVORS_FAIR) };
  if (ratio >= 0.6) return counterBetween(offer, listing.askingPrice, 0.8, 0.95);
  return { kind: 'reject', flavor: pickFrom(REJECT_FLAVORS_FIRM) };
}

export function isNegotiableListing(listing: MarketplaceListing): boolean {
  return (
    listing.source === 'Headbook Marketplace' ||
    listing.source === 'JaredsList'
  );
}
