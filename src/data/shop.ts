/**
 * The physical card shop — a premises ladder the player upgrades into. Each
 * tier adds display-case slots, walk-in foot traffic, and a fatter retail
 * markup. Walk-in customers buy whatever cards you put on display.
 */
export type ShopTier = {
  id: string;
  name: string;
  blurb: string;
  /** Cash to upgrade INTO this tier. Tier 0 (the starting shop) is free. */
  cost: number;
  /** Display-case slots — how many cards you can put out for walk-ins. */
  displaySlots: number;
  /** Average walk-in customers per minute. */
  trafficPerMin: number;
  /** Retail multiplier a walk-in pays over a card's market value (no fees). */
  markup: number;
};

export const SHOP_TIERS: ShopTier[] = [
  {
    id: 'kitchen',
    name: 'Kitchen Table',
    blurb: 'Cards spread across the kitchen table. The odd friend swings by.',
    cost: 0,
    displaySlots: 4,
    trafficPerMin: 0.5,
    markup: 1.06,
  },
  {
    id: 'spare',
    name: 'Spare Bedroom',
    blurb: 'You cleared out the spare room. Word is getting around.',
    cost: 20000,
    displaySlots: 8,
    trafficPerMin: 1.1,
    markup: 1.12,
  },
  {
    id: 'garage',
    name: 'Converted Garage',
    blurb: 'Proper shelving, a glass counter, a buzzer on the door.',
    cost: 110000,
    displaySlots: 13,
    trafficPerMin: 2,
    markup: 1.18,
  },
  {
    id: 'stripmall',
    name: 'Strip-Mall Unit',
    blurb: 'A real storefront with a lit sign and walk-by traffic.',
    cost: 500000,
    displaySlots: 20,
    trafficPerMin: 3.2,
    markup: 1.25,
  },
  {
    id: 'flagship',
    name: 'Flagship Store',
    blurb: 'Glass cases, good lighting, and a line out the door on release day.',
    cost: 2200000,
    displaySlots: 28,
    trafficPerMin: 5,
    markup: 1.33,
  },
  {
    id: 'empire',
    name: 'Card Empire HQ',
    blurb: 'A destination shop — collectors travel across the state for this place.',
    cost: 9000000,
    displaySlots: 40,
    trafficPerMin: 7.5,
    markup: 1.42,
  },
];

export function getShopTier(index: number): ShopTier {
  return SHOP_TIERS[Math.max(0, Math.min(index, SHOP_TIERS.length - 1))];
}
