import type { GradingCompanyId } from '../types';

export type GradingCompanyDef = {
  id: GradingCompanyId;
  name: string;
  tagline: string;
  cost: number;
  /** Two-way shipping fee charged at submission. Added on top of cost. */
  shippingFee: number;
  turnaroundMs: number;
  /** Final value multiplier applied on top of the grade multiplier. */
  resaleMultiplier: number;
  /** Chance to bump or drop a grade by 0.5–1 (chaos factor). */
  chaosChance: number;
  unlockUpgradeId: string;
  accent: string;
};

export const GRADING_COMPANIES: GradingCompanyDef[] = [
  {
    id: 'ZAG',
    name: 'ZAG Grading',
    tagline: 'Fast and cheap. Slightly less hype on the resale.',
    cost: 25,
    shippingFee: 6,
    turnaroundMs: 45_000,
    resaleMultiplier: 0.9,
    chaosChance: 0.05,
    unlockUpgradeId: 'grading_membership',
    accent: 'bg-feebay-700',
  },
  {
    id: 'PZA',
    name: 'PZA',
    tagline: 'Premium. Expensive. Slower. Highest market premium.',
    cost: 80,
    shippingFee: 14,
    turnaroundMs: 90_000,
    resaleMultiplier: 1.2,
    chaosChance: 0.03,
    unlockUpgradeId: 'pza_membership',
    accent: 'bg-red-700',
  },
  {
    id: 'Bucket',
    name: 'Bucket Grading',
    tagline: 'Wildly inconsistent. Occasionally gifts you a gem. Occasionally mislabels.',
    cost: 15,
    shippingFee: 4,
    turnaroundMs: 30_000,
    resaleMultiplier: 0.85,
    chaosChance: 0.35,
    unlockUpgradeId: 'bucket_membership',
    accent: 'bg-amber-700',
  },
];

export function getGradingCompany(id: GradingCompanyId): GradingCompanyDef {
  const c = GRADING_COMPANIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown grading company: ${id}`);
  return c;
}
