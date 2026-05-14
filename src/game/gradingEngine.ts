import type { GradingCompanyId, InventoryItem } from '../types';
import { rand, chance } from './rng';
import { GRADE_MULTIPLIER } from './economyEngine';
import { getGradingCompany } from '../data/gradingCompanies';
import { combinedGradingScore } from './centering';

export type GradingResult = {
  grade: number;
  label: string;
  multiplier: number;
  company: GradingCompanyId;
  resaleMultiplier: number;
};

export function rollGrade(item: InventoryItem, company: GradingCompanyId): GradingResult {
  const def = getGradingCompany(company);
  if (item.isFake) {
    return {
      grade: 0,
      label: 'AUTH FAIL',
      multiplier: 0,
      company,
      resaleMultiplier: def.resaleMultiplier,
    };
  }
  const score = combinedGradingScore(
    item.actualConditionScore,
    item.centeringOffsetX,
    item.centeringOffsetY,
  );

  // Gem-friendly pools. Weights tilted toward 10/9.5 when the combined score is high.
  let pool: number[];
  if (score >= 96) pool = [10, 10, 10, 10, 10, 9.5, 9.5, 9];
  else if (score >= 90) pool = [10, 10, 9.5, 9.5, 9.5, 9, 9, 8];
  else if (score >= 84) pool = [10, 9.5, 9.5, 9, 9, 9, 8];
  else if (score >= 76) pool = [9.5, 9, 9, 9, 8, 8, 7];
  else if (score >= 65) pool = [9, 8, 8, 7, 7, 6];
  else if (score >= 50) pool = [8, 7, 7, 6, 6, 5];
  else if (score >= 35) pool = [6, 6, 5, 5, 4, 3];
  else pool = [4, 3, 3, 2, 2, 1];

  // Company chaos
  if (chance(def.chaosChance)) pool.push(10);
  if (chance(def.chaosChance)) pool.push(1);

  let grade = pool[Math.floor(rand(0, pool.length))];

  // Bucket sometimes mislabels by 0.5 either way
  if (company === 'Bucket' && chance(0.25)) {
    grade = Math.max(1, Math.min(10, grade + (chance(0.5) ? 0.5 : -0.5)));
  }

  const allowed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9.5, 10];
  grade = allowed.reduce(
    (best, g) => (Math.abs(g - grade) < Math.abs(best - grade) ? g : best),
    allowed[0],
  );

  const multiplier = GRADE_MULTIPLIER[grade] ?? 1;
  const label =
    grade === 10
      ? `${def.id} GEM 10`
      : company === 'Bucket' && chance(0.1)
      ? `Bucket Grade ${grade} (mislabel?)`
      : `${def.id} ${grade}`;
  return { grade, label, multiplier, company, resaleMultiplier: def.resaleMultiplier };
}
