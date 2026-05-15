import type { InventoryItem } from '../types';
import { centeringScore } from './centering';
import { pick } from './rng';

const GEM = [
  'Flawless. The grader stood up, then sat back down, visibly moved.',
  'Dead-centered, razor corners, mirror surface. We triple-checked. It is real.',
  'A perfect ten. Whoever pulled this should not be allowed near more packs.',
  'Gem mint. Returned in a slightly nicer case than it strictly deserved.',
  'Immaculate. The grader asked to keep it. We said no. He asked again.',
];

const MINT = [
  'Nearly perfect — one corner held a quiet grudge.',
  'Pack-fresh and crisp. A hair short of legendary.',
  'Beautiful copy. The grader sighed wistfully handing it back.',
  'Sharp and clean. Just shy of the top, and it knows it.',
];

const SOLID = [
  'An honest card. Been around, kept its composure.',
  'Holds up nicely. A soft corner or two, nothing the law needs to know about.',
  'Respectable. Not a trophy, but it carries itself well.',
  'Solid middle-grade card. Dependable, like a good toaster.',
];

const LOW = [
  'This card has lived a full life. Possibly several.',
  'Well-loved, in the way a chew toy is well-loved.',
  'It has been bent, sleeved, and forgiven, in that order.',
  'Played hard. The grader admired its commitment to being used.',
];

const OFF_CENTER = [
  'The artwork wandered off toward one border and refuses to come back.',
  'Centering so bold the card and its frame now live separate lives.',
  'Whoever ran the cutting machine was clearly daydreaming about lunch.',
  'Off-center enough that the grader tilted their head to compensate.',
];

const WORN = [
  'Edge wear visible from orbit. We logged it from a safe distance.',
  'Surface scratches form a small constellation. We chose not to name it.',
  'This card survived something dramatic. The grader did not ask.',
  'Creased, scuffed, and softened — a veteran of many pockets.',
];

const FAIL = [
  'Authentication failed. This card has never met the printer it claims to know.',
  'Counterfeit. A spirited attempt, undone by the holo and the spelling.',
  'Fake. The grader laughed once, then quietly filed three forms.',
  'Not genuine. Points for confidence, zero points for everything else.',
];

/** A funny grader note picked from the card's actual traits. */
export function generateGraderNote(item: InventoryItem, grade: number): string {
  if (grade === 0 || item.isFake) return pick(FAIL);
  if (grade >= 10) return pick(GEM);
  const cScore = centeringScore(item.centeringOffsetX, item.centeringOffsetY);
  if (cScore < 50) return pick(OFF_CENTER);
  if (item.rawCondition === 'Damaged' || item.rawCondition === 'Heavily Played') {
    return pick(WORN);
  }
  if (grade >= 9) return pick(MINT);
  if (grade >= 7) return pick(SOLID);
  return pick(LOW);
}
