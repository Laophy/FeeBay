import type { EmployeeRole, EmployeeTier } from '../types';

export type EmployeeRoleDef = {
  id: EmployeeRole;
  title: string;
  /** Icon name (see Icon.tsx). */
  icon: string;
  blurb: string;
  /** What the roster card shows them doing. */
  activity: string;
  /** Base milliseconds for one work cycle (before tier & manager speed-ups). */
  baseCycleMs: number;
  accent: string;
};

export const EMPLOYEE_ROLES: EmployeeRoleDef[] = [
  {
    id: 'scout',
    title: 'Scout',
    icon: 'search',
    blurb: 'Hunts the marketplace and auto-buys underpriced singles for the team to flip.',
    activity: 'Scouting the marketplace',
    baseCycleMs: 26_000,
    accent: 'text-feebay-600',
  },
  {
    id: 'flipper',
    title: 'Flipper',
    icon: 'tag',
    blurb: 'Lists and sells the stock your Scouts brought in — where the profit comes from.',
    activity: 'Flipping inventory',
    baseCycleMs: 23_000,
    accent: 'text-ebayGreen-600',
  },
  {
    id: 'promoter',
    title: 'Promoter',
    icon: 'sparkle',
    blurb: 'Runs the socials and builds the brand. Steady passive reputation.',
    activity: 'Promoting the brand',
    baseCycleMs: 30_000,
    accent: 'text-ebayYellow-700',
  },
  {
    id: 'manager',
    title: 'Manager',
    icon: 'crown',
    blurb: 'Runs the floor — speeds up every other employee and cuts their mistake rate.',
    activity: 'Coordinating the floor',
    baseCycleMs: 18_000,
    accent: 'text-ebayRed-500',
  },
];

export function getEmployeeRole(role: EmployeeRole): EmployeeRoleDef {
  return EMPLOYEE_ROLES.find((r) => r.id === role) ?? EMPLOYEE_ROLES[0];
}

/** Headcount cap by business level: BL1 locked → BL2 1 → BL3 5 → BL4 10 → BL5 14 → BL6 20. */
export function employeeCap(businessLevel: number): number {
  return [0, 0, 1, 5, 10, 14, 20][businessLevel] ?? 20;
}

/** Hiring cost rises with each employee already on payroll. */
export function hireCost(currentCount: number): number {
  return 2500 + currentCount * 2000;
}

export const EMPLOYEE_TIERS: Record<
  EmployeeTier,
  { label: string; stars: number; speed: number; mistake: number; potency: number }
> = {
  1: { label: 'Rookie', stars: 1, speed: 1.0, mistake: 1.0, potency: 1.0 },
  2: { label: 'Pro', stars: 2, speed: 0.82, mistake: 0.58, potency: 1.45 },
  3: { label: 'Veteran', stars: 3, speed: 0.68, mistake: 0.34, potency: 1.95 },
};

/** Hiring rolls a tier — most candidates are rookies, veterans are rare. */
export const EMPLOYEE_TIER_WEIGHTS: [EmployeeTier, number][] = [
  [1, 62],
  [2, 28],
  [3, 10],
];

export const EMPLOYEE_NAMES = [
  'Marcus', 'Jada', 'Devon', 'Priya', 'Tobias', 'Renata', 'Cole', 'Imani', 'Sven', 'Lola',
  'Hank', 'Mei', 'Diego', 'Bex', 'Otis', 'Yara', 'Wendell', 'Nadia', 'Gus', 'Tamsin',
  'Ronnie', 'Aisha', 'Pernell', 'Cleo', 'Bart', 'Suki', 'Marv', 'Esme', 'Dale', 'Quincy',
];

/** Max raw $ a Scout of each tier will spend on a single listing. */
export function scoutBuyCap(tier: EmployeeTier): number {
  return tier === 3 ? 2800 : tier === 2 ? 1200 : 500;
}

/** Reputation a Promoter of each tier adds per completed cycle. */
export function promoterRep(tier: EmployeeTier): number {
  return tier === 3 ? 5 : tier === 2 ? 3 : 2;
}

/** [min, max] cash a mistake costs, by role. */
export function mistakeCostRange(role: EmployeeRole): [number, number] {
  switch (role) {
    case 'flipper':
      return [20, 95];
    case 'scout':
      return [45, 170];
    case 'promoter':
      return [10, 45];
    default:
      return [0, 0];
  }
}

/** Mistake flavor lines per role. */
export const MISTAKE_LINES: Record<EmployeeRole, string[]> = {
  flipper: [
    'creased a card sleeving it',
    'shipped a slab to the wrong address',
    'spilled cold brew on a binder',
    'fat-fingered a price with a zero missing',
    'ate a buyer chargeback',
  ],
  scout: [
    'bought a counterfeit off JaredsList',
    'overpaid on a hyped dud',
    'wired cash to a seller who ghosted',
    'snagged a "rare" that turned out a proxy',
  ],
  promoter: [
    'posted cringe — the brand took a hit',
    "typo'd the shop name in a viral clip",
    'started a flame war in the comments',
  ],
  manager: [],
};
