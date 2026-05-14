export type BusinessLevelDef = {
  level: number;
  name: string;
  promotionCost: number;
  /** Net worth required to be eligible to promote into this level. */
  netWorthRequirement: number;
  /** Reputation required. */
  reputationRequirement: number;
  /** Extra listings per marketplace refresh granted at this level. */
  bonusListings: number;
  /** Extra inventory slots granted at this level. */
  bonusInventorySlots: number;
  /** Extra passive daily reputation. */
  bonusDailyRep: number;
  /** Selling-fee reduction (additive, capped). */
  feeDiscount: number;
  /** Flavor blurb. */
  tagline: string;
};

export const BUSINESS_LEVELS: BusinessLevelDef[] = [
  {
    level: 1,
    name: 'Bedroom Reseller',
    promotionCost: 0,
    netWorthRequirement: 0,
    reputationRequirement: 0,
    bonusListings: 0,
    bonusInventorySlots: 0,
    bonusDailyRep: 0,
    feeDiscount: 0,
    tagline: 'You and a cardboard box of binders.',
  },
  {
    level: 2,
    name: 'Side Hustle',
    promotionCost: 500,
    netWorthRequirement: 1_500,
    reputationRequirement: 10,
    bonusListings: 2,
    bonusInventorySlots: 5,
    bonusDailyRep: 1,
    feeDiscount: 0.02,
    tagline: 'Posts shipped from the garage at 11pm.',
  },
  {
    level: 3,
    name: 'Card Shop',
    promotionCost: 5_000,
    netWorthRequirement: 12_000,
    reputationRequirement: 35,
    bonusListings: 4,
    bonusInventorySlots: 20,
    bonusDailyRep: 2,
    feeDiscount: 0.04,
    tagline: 'Storefront in a strip mall. The OPEN sign blinks.',
  },
  {
    level: 4,
    name: 'Storefront Owner',
    promotionCost: 25_000,
    netWorthRequirement: 60_000,
    reputationRequirement: 80,
    bonusListings: 6,
    bonusInventorySlots: 50,
    bonusDailyRep: 4,
    feeDiscount: 0.06,
    tagline: 'Two employees, a glass case, and a backroom safe.',
  },
  {
    level: 5,
    name: 'National Reseller',
    promotionCost: 100_000,
    netWorthRequirement: 250_000,
    reputationRequirement: 150,
    bonusListings: 8,
    bonusInventorySlots: 120,
    bonusDailyRep: 6,
    feeDiscount: 0.08,
    tagline: 'Convention booths, dedicated grading runs, sponsorships.',
  },
  {
    level: 6,
    name: 'Card Empire',
    promotionCost: 500_000,
    netWorthRequirement: 1_000_000,
    reputationRequirement: 250,
    bonusListings: 10,
    bonusInventorySlots: 250,
    bonusDailyRep: 10,
    feeDiscount: 0.1,
    tagline: 'They write magazine features about you.',
  },
];

export function getBusinessLevel(level: number): BusinessLevelDef {
  return BUSINESS_LEVELS.find((b) => b.level === level) ?? BUSINESS_LEVELS[0];
}

export function getNextBusinessLevel(level: number): BusinessLevelDef | null {
  return BUSINESS_LEVELS.find((b) => b.level === level + 1) ?? null;
}
