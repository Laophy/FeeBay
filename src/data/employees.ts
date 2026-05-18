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

/** Funny downtime — a break parks the employee for a spell, no work done. */
export type EmployeeBreak = { label: string; minMs: number; maxMs: number };

export const EMPLOYEE_BREAKS: EmployeeBreak[] = [
  { label: 'ducked out for a smoke', minMs: 10_000, maxMs: 22_000 },
  { label: 'doomscrolling their phone', minMs: 12_000, maxMs: 26_000 },
  { label: 'chatting by the water cooler', minMs: 12_000, maxMs: 24_000 },
  { label: 'taking a personal call', minMs: 14_000, maxMs: 30_000 },
  { label: 'hiding in the bathroom', minMs: 12_000, maxMs: 28_000 },
  { label: 'grabbing lunch', minMs: 26_000, maxMs: 52_000 },
  { label: 'on a coffee run', minMs: 20_000, maxMs: 42_000 },
  { label: 'lost in the break room', minMs: 18_000, maxMs: 38_000 },
  { label: 'running a "quick" errand', minMs: 24_000, maxMs: 50_000 },
  { label: 'waiting on the slowest barista alive', minMs: 22_000, maxMs: 44_000 },
  { label: 'watching card-opening videos', minMs: 16_000, maxMs: 36_000 },
  { label: 'stuck in traffic', minMs: 34_000, maxMs: 78_000 },
  { label: 'in a meeting that should have been an email', minMs: 30_000, maxMs: 62_000 },
  { label: 'caught in a parking-lot fender-bender', minMs: 40_000, maxMs: 84_000 },
  { label: 'on hold with the bank', minMs: 28_000, maxMs: 58_000 },
];

/** Base chance per completed work cycle that an employee slips off on a break.
 *  Reduced by Managers keeping the floor on task. */
export const EMPLOYEE_BREAK_CHANCE = 0.16;

/** Social downtime — coworkers getting chatty instead of working. Only possible
 *  with 2+ employees on the roster; Managers help keep the chatter down. */
// `{name}` is filled in with the coworker they got pulled into talking with.
export const EMPLOYEE_SOCIAL_BREAKS: EmployeeBreak[] = [
  { label: 'chatting with {name}', minMs: 14_000, maxMs: 32_000 },
  { label: 'deep in office gossip with {name}', minMs: 16_000, maxMs: 36_000 },
  { label: 'arguing with {name} over the greatest card ever printed', minMs: 18_000, maxMs: 40_000 },
  { label: 'showing {name} something on their phone', minMs: 12_000, maxMs: 28_000 },
  { label: "pulled into {name}'s conversation", minMs: 14_000, maxMs: 30_000 },
  { label: 'huddled up with {name} debating whether a card is fake', minMs: 16_000, maxMs: 34_000 },
  { label: "stuck hearing {name}'s weekend recap", minMs: 18_000, maxMs: 38_000 },
  { label: "ranking everyone's worst flips with {name}", minMs: 16_000, maxMs: 34_000 },
  { label: 'planning a team lunch with {name} that will never happen', minMs: 14_000, maxMs: 30_000 },
  { label: 'trading war stories with {name}', minMs: 16_000, maxMs: 36_000 },
];

/** Base chance per cycle of a social break — needs 2+ employees on the roster. */
export const EMPLOYEE_SOCIAL_BREAK_CHANCE = 0.1;

/**
 * Itemized operating overhead charged on every employee sale — shipping,
 * protection, and card prep. Per line, cost = round(base + rate * sale value).
 * Keeps automated profit honest and gives the company a real cost ledger.
 */
export const OVERHEAD_LINES: { id: string; label: string; base: number; rate: number }[] = [
  { id: 'shipping', label: 'Shipping & handling', base: 2, rate: 0.006 },
  { id: 'toploaders', label: 'Top loaders & sleeves', base: 1, rate: 0.003 },
  { id: 'cleaning', label: 'Card cleaning & prep', base: 1, rate: 0.002 },
  { id: 'supplies', label: 'Packing & labels', base: 1, rate: 0 },
];
