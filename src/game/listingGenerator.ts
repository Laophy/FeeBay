import type {
  CardDef,
  GradingCompanyId,
  ListingQuality,
  MarketplaceListing,
  MarketplaceSource,
  MarketTrend,
  RawCondition,
  SlabBagTier,
} from '../types';
import { GRADE_MULTIPLIER } from './economyEngine';
import { CARDS } from '../data/cards';
import {
  CHEEKY_DESCRIPTIONS,
  CLUELESS_DESCRIPTIONS,
  CONDITION_HINTS,
  HYPED_DESCRIPTIONS,
  KNOWLEDGEABLE_DESCRIPTIONS,
  SELLER_NAMES,
  SLAB_DESCRIPTIONS,
  TITLE_PREFIXES,
  TITLE_SUFFIXES,
} from '../data/listingTemplates';
import {
  conditionMult,
  rarityMult,
  trendMultiplier,
} from './economyEngine';
import { chance, pick, rand, randInt, uid, weightedPick } from './rng';
import {
  centeringPriceMultiplier,
  rollCentering,
  rollCenteringForGrade,
  rollRainbowCentering,
} from './centering';
import { expectedPullValue, expectedSlabBagValue, tierForPrice } from './lotResolver';

const RAW_CONDITIONS: RawCondition[] = [
  'Damaged',
  'Heavily Played',
  'Played',
  'Lightly Played',
  'Near Mint',
  'Minty',
  'Gem Candidate',
];

/** How often a card variant shows up in the wild — holos, 1st editions and
 *  especially rainbow rares are scarce. */
function pullWeight(c: CardDef): number {
  let w =
    c.variant === 'normal'
      ? 12
      : c.variant === 'reverse_holo'
      ? 5
      : c.variant === 'holo'
      ? 2
      : 0.3; // rainbow — genuinely hard to find
  if (c.firstEdition) w *= 0.4;
  return w;
}

function rollCondition(quality: ListingQuality): {
  raw: RawCondition;
  score: number;
} {
  if (quality === 'damaged') {
    const raw = pick(['Damaged', 'Heavily Played'] as RawCondition[]);
    return { raw, score: randInt(10, 40) };
  }
  if (quality === 'grading_candidate' || quality === 'hidden_gem') {
    const raw = pick(['Near Mint', 'Minty', 'Gem Candidate'] as RawCondition[]);
    const score = raw === 'Gem Candidate' ? randInt(92, 100) : raw === 'Minty' ? randInt(85, 96) : randInt(75, 92);
    return { raw, score };
  }
  const raw = weightedPick(RAW_CONDITIONS, [4, 8, 14, 22, 24, 16, 12]);
  let score = 50;
  switch (raw) {
    case 'Damaged':
      score = randInt(5, 25);
      break;
    case 'Heavily Played':
      score = randInt(25, 50);
      break;
    case 'Played':
      score = randInt(45, 65);
      break;
    case 'Lightly Played':
      score = randInt(60, 80);
      break;
    case 'Near Mint':
      score = randInt(75, 90);
      break;
    case 'Minty':
      score = randInt(85, 95);
      break;
    case 'Gem Candidate':
      score = randInt(92, 100);
      break;
  }
  return { raw, score };
}

function makeTitle(card: CardDef, raw: RawCondition, quality: ListingQuality): string {
  const prefix = chance(0.55) ? `${pick(TITLE_PREFIXES)} ` : '';
  const suffix = chance(0.5) ? pick(TITLE_SUFFIXES) : '';
  let body = `${card.name}`;
  if (chance(0.3)) body = `${card.name} ${card.set}`;
  if (chance(0.2)) body = body.toLowerCase();
  if (quality === 'mislisted_rare') body = `${card.character} card holo??`;
  if (quality === 'fake') body = `${card.name} Holo (authentic!)`;
  if (raw === 'Damaged' && chance(0.4)) body = `${body} (small flaw)`;
  return `${prefix}${body}${suffix}`.trim();
}

/** Description for a slabbed listing — its own bank, no raw-condition hints. */
function makeSlabDescription(quality: ListingQuality): string {
  // Sketchy slabs get the scammy hype lines; everything else gets the slab bank.
  if (quality === 'fake') return pick(HYPED_DESCRIPTIONS);
  if (quality === 'overpriced' && chance(0.5)) return pick(HYPED_DESCRIPTIONS);
  return pick(SLAB_DESCRIPTIONS);
}

function makeDescription(quality: ListingQuality, raw: RawCondition): string {
  const hint = pick(CONDITION_HINTS[raw] ?? ['As pictured.']);
  let pool: string[];
  switch (quality) {
    case 'hidden_gem':
    case 'obvious_deal':
    case 'mislisted_rare':
      pool = CLUELESS_DESCRIPTIONS;
      break;
    case 'overpriced':
      pool = HYPED_DESCRIPTIONS;
      break;
    case 'fake':
      pool = HYPED_DESCRIPTIONS;
      break;
    case 'damaged':
      pool = CHEEKY_DESCRIPTIONS;
      break;
    case 'grading_candidate':
      pool = KNOWLEDGEABLE_DESCRIPTIONS;
      break;
    default:
      pool = chance(0.5) ? CHEEKY_DESCRIPTIONS : KNOWLEDGEABLE_DESCRIPTIONS;
  }
  return `${pick(pool)} ${hint}.`;
}

function pickQuality(): ListingQuality {
  return weightedPick<ListingQuality>(
    [
      'fair',
      'overpriced',
      'damaged',
      'obvious_deal',
      'hidden_gem',
      'grading_candidate',
      'mislisted_rare',
      'fake',
    ],
    [30, 22, 14, 8, 8, 7, 6, 5],
  );
}

function pickLotType(
  quality: ListingQuality,
  source: MarketplaceSource,
): MarketplaceListing['lotType'] {
  if (source === 'SlabHub') return 'slab';
  if (quality === 'mislisted_rare') return pick(['binder', 'mystery_lot']);
  if (quality === 'grading_candidate' || quality === 'fake') return pick(['single', 'slab']);
  return weightedPick(
    ['single', 'binder', 'sealed', 'slab', 'mystery_lot'] as const,
    [50, 18, 10, 10, 12],
  );
}

/** Roll a plausible slab grade + grading company for a marketplace slab listing. */
function rollSlabGrade(quality: ListingQuality): {
  grade: number;
  company: GradingCompanyId;
} {
  // Source/quality biases the grade distribution. Hidden-gem slabs tend to be sleeper 8s/9s,
  // grading-candidate slabs are higher, hyped/overpriced slabs are weighted heavy too.
  let pool: number[];
  if (quality === 'grading_candidate' || quality === 'hidden_gem') {
    pool = [10, 10, 9.5, 9.5, 9, 9, 8];
  } else if (quality === 'overpriced' || quality === 'fair') {
    pool = [10, 9.5, 9, 9, 8, 8, 7];
  } else if (quality === 'damaged') {
    pool = [7, 7, 6, 6, 5];
  } else if (quality === 'mislisted_rare') {
    pool = [9.5, 9, 8, 7];
  } else if (quality === 'fake') {
    pool = [10, 10, 9.5, 9]; // suspect — they're trying to flex the case
  } else {
    pool = [9, 9, 8, 8, 7];
  }
  const grade = pool[Math.floor(rand(0, pool.length))];
  const company = weightedPick<GradingCompanyId>(
    ['PZA', 'ZAG', 'Bucket'],
    // PZA most prevalent in marketplace listings (more prestigious)
    [5, 6, 3],
  );
  return { grade, company };
}

const STORAGE_UNIT_TITLES = [
  'STORAGE UNIT auction lot — unopened boxes inside!',
  'Abandoned storage — boxes of cards from the 90s??',
  'Estate clear-out, entire shelf of binders',
  'GARAGE LIQUIDATION — taking offers on the lot',
  '4 boxes from grandpa’s basement, never sorted',
  'Old hobby shop closing, last storage room',
];

const STORAGE_UNIT_DESCRIPTIONS = [
  'Won the unit at auction. Have no idea what’s in the boxes. Pickup only.',
  'Cleaning out my dad’s storage. He used to collect, so... maybe something good?',
  'Bought a unit cheap, dumping the cards before my wife sees.',
  'Sealed packs allegedly in here. Cannot verify, will not unwrap.',
  'Convention leftovers. Hundreds of cards, no time to sort.',
];

export function generateStorageUnitListing(
  source: MarketplaceSource,
  reputation: number,
): MarketplaceListing {
  const tier = reputation >= 40 ? rand(1500, 3000) : reputation >= 20 ? rand(700, 1800) : rand(400, 900);
  const askingPrice = Math.round(tier);
  // Storage units are intended to be ~1.4–2.2× value on average.
  // We back into the true value so contents resolved from the same price tier match.
  const lotTier = tierForPrice(askingPrice);
  const sizeMid =
    askingPrice >= 1500 ? 33 : askingPrice >= 700 ? 25 : 18;
  const evCards = expectedPullValue(lotTier) * sizeMid;
  // Mix in a touch of noise so two same-priced units aren't identical
  const trueValue = Math.round(evCards * rand(0.95, 1.15));
  const estSpread = 0.4;
  return {
    id: uid('lst_'),
    source,
    title: pick(STORAGE_UNIT_TITLES),
    sellerName: pick(SELLER_NAMES),
    description: pick(STORAGE_UNIT_DESCRIPTIONS),
    askingPrice,
    trueMarketValue: trueValue,
    estimatedValueMin: Math.max(50, Math.round(trueValue * (1 - estSpread))),
    estimatedValueMax: Math.round(trueValue * (1 + estSpread)),
    conditionHint: 'Mixed condition. Could be anything in there.',
    actualConditionScore: 60,
    centeringOffsetX: 0,
    centeringOffsetY: 0,
    rawCondition: 'Played',
    rarity: 'Rare',
    cardId: 'pebble-pup', // placeholder, art uses lot tile
    lotType: 'storage_unit',
    lotSize: undefined,
    scamRisk: rand(0.1, 0.35),
    fakeRisk: rand(0.05, 0.2),
    isFake: false,
    timeRemainingSeconds: randInt(300, 900),
    createdAt: Date.now(),
    qualityType: 'mislisted_rare',
  };
}

/* ---- Slab bags — a graded-card grab bag ---- */

const SLAB_BAG_TIERS: { tier: SlabBagTier; label: string }[] = [
  { tier: 'budget', label: 'Budget' },
  { tier: 'standard', label: 'Standard' },
  { tier: 'premium', label: 'Premium' },
  { tier: 'whale', label: 'Whale' },
];

const SLAB_BAG_TITLES = [
  '{label} SLAB BAG — one random graded card inside!',
  'Mystery {label} slab grab bag — graded card guaranteed',
  '{label} graded card bag — could be a GEM, could be a dud',
  'GRADED MYSTERY BAG ({label} tier) — rip it and find out',
];

const SLAB_BAG_DESCRIPTIONS_LEGIT = [
  'One sealed graded slab per bag. Live-pulled, no resealing. Probably.',
  'Random graded card inside. Some bags carry a 10. Not telling you which.',
  'Graded mystery bag. What you see is a bag. What you get is a slab.',
];

const SLAB_BAG_DESCRIPTIONS_SHADY = [
  'GRADED bag trust me bro. Cases 100% real. Do not look too close.',
  'Slab bag, graded by a real company. (The company is my cousin.)',
  'Mystery slab. The grade on the case is REAL. The card behind it is a surprise.',
];

/** A graded-card grab bag. Resolves to one slab — sometimes a counterfeit. */
export function generateSlabBagListing(source: MarketplaceSource): MarketplaceListing {
  const t = pick(SLAB_BAG_TIERS);
  // Shady bags are far likelier to hide a junk slab. JaredsList runs more of them.
  const shady = chance(source === 'JaredsList' ? 0.55 : 0.28);
  const scamRisk = shady ? rand(0.42, 0.72) : rand(0.05, 0.16);
  // Price the bag at a discount of the tier's expected slab value, so a clean
  // pull turns a profit. Shady bags lure with a steeper-looking discount.
  const trueValue = expectedSlabBagValue(t.tier);
  const askingPrice = Math.max(
    20,
    Math.round(trueValue * (shady ? rand(0.5, 0.72) : rand(0.62, 0.85))),
  );
  return {
    id: uid('lst_'),
    source,
    title: pick(SLAB_BAG_TITLES).replace('{label}', t.label),
    sellerName: pick(SELLER_NAMES),
    description: pick(shady ? SLAB_BAG_DESCRIPTIONS_SHADY : SLAB_BAG_DESCRIPTIONS_LEGIT),
    askingPrice,
    trueMarketValue: trueValue,
    estimatedValueMin: Math.max(1, Math.round(trueValue * 0.2)),
    estimatedValueMax: Math.round(trueValue * 2.4),
    conditionHint: 'Sealed bag — the slab inside is graded, the card is a mystery.',
    actualConditionScore: 92,
    centeringOffsetX: 0,
    centeringOffsetY: 0,
    rawCondition: 'Near Mint',
    rarity: 'Rare',
    cardId: CARDS[0].id, // placeholder — art uses the bag tile
    lotType: 'slab_bag',
    lotSize: undefined,
    slabBagTier: t.tier,
    scamRisk,
    fakeRisk: shady ? rand(0.3, 0.6) : rand(0.03, 0.12),
    isFake: false,
    timeRemainingSeconds: randInt(180, 720),
    createdAt: Date.now(),
    qualityType: 'fair',
  };
}

function rollSource(
  unlocked: MarketplaceSource[],
  quality: ListingQuality,
): MarketplaceSource {
  // VaultDealer is curated separately — never picked by general roll.
  const all = unlocked.length
    ? unlocked.filter((m) => m !== 'VaultDealer')
    : (['FeeBay'] as MarketplaceSource[]);
  if (quality === 'hidden_gem' && all.includes('Headbook Marketplace')) {
    return chance(0.7) ? 'Headbook Marketplace' : pick(all);
  }
  if (quality === 'fake' && all.includes('JaredsList')) {
    return chance(0.6) ? 'JaredsList' : pick(all);
  }
  if (quality === 'overpriced' && all.includes('PackTok Shop')) {
    return chance(0.7) ? 'PackTok Shop' : pick(all);
  }
  if (quality === 'grading_candidate' && all.includes('SlabHub')) {
    return chance(0.5) ? 'SlabHub' : pick(all);
  }
  return pick(all);
}

function trueValueFor(
  card: CardDef,
  raw: RawCondition,
  score: number,
  trends: MarketTrend[],
  centeringMult: number,
): number {
  const base = card.baseValue * rarityMult(card.rarity) * conditionMult(raw);
  const trend = trendMultiplier(card, trends);
  const noise = rand(0.9, 1.1);
  const scoreBoost = 0.85 + (score / 100) * 0.3;
  return Math.max(2, Math.round(base * trend * noise * scoreBoost * centeringMult));
}

function priceFor(quality: ListingQuality, trueValue: number): number {
  let mult = 1;
  switch (quality) {
    case 'obvious_deal':
      mult = rand(0.35, 0.6);
      break;
    case 'hidden_gem':
      mult = rand(0.15, 0.45);
      break;
    case 'mislisted_rare':
      mult = rand(0.08, 0.3);
      break;
    case 'fair':
      mult = rand(0.85, 1.15);
      break;
    case 'overpriced':
      mult = rand(1.6, 3.5);
      break;
    case 'fake':
      mult = rand(0.4, 0.9);
      break;
    case 'damaged':
      mult = rand(0.4, 0.9);
      break;
    case 'grading_candidate':
      mult = rand(0.65, 1.2);
      break;
  }
  return Math.max(1, Math.round(trueValue * mult));
}

export function generateVaultDealerListing(trends: MarketTrend[]): MarketplaceListing {
  // VaultDealer curates the prestige finishes — never the plain prints.
  const ultraCards = CARDS.filter(
    (c) =>
      (c.rarity === 'Mythic Rare' || c.rarity === 'Prototype Card') &&
      c.variant !== 'normal',
  );
  const card = weightedPick(
    ultraCards,
    ultraCards.map((c) => (c.variant === 'holo' ? 5 : 2)),
  );
  // Always slabbed, always grade 9+, always PZA or ZAG (Bucket isn't trusted at this tier)
  const grade = weightedPick([9, 9.5, 10], [2, 4, 3]);
  const company = weightedPick<GradingCompanyId>(['PZA', 'ZAG'], [8, 2]);
  const { centeringOffsetX, centeringOffsetY } = rollCenteringForGrade(grade);
  const gradeMult = GRADE_MULTIPLIER[grade] ?? 1;
  const companyMult = company === 'PZA' ? 1.2 : 0.9;
  const trueValue = Math.round(
    card.baseValue * rarityMult(card.rarity) * gradeMult * companyMult * trendMultiplier(card, trends) * rand(1.0, 1.2),
  );
  // Vault asks always above true value; that's the whole point of the venue.
  const askingPrice = Math.round(trueValue * rand(1.15, 1.5));
  return {
    id: uid('lst_'),
    source: 'VaultDealer',
    title: `${grade} ${company} • ${card.name}`,
    sellerName: 'VaultDealer Curator',
    description: `Curated lot. Inspection on request. ${company} graded ${grade}. Provenance confirmed.`,
    askingPrice,
    trueMarketValue: trueValue,
    estimatedValueMin: Math.round(trueValue * 0.85),
    estimatedValueMax: Math.round(trueValue * 1.15),
    conditionHint: 'Encapsulated. Untouchable.',
    actualConditionScore: 95,
    centeringOffsetX,
    centeringOffsetY,
    rawCondition: 'Gem Candidate',
    rarity: card.rarity,
    cardId: card.id,
    lotType: 'slab',
    scamRisk: 0,
    fakeRisk: 0,
    isFake: false,
    timeRemainingSeconds: randInt(600, 1500),
    createdAt: Date.now(),
    qualityType: 'grading_candidate',
    grade,
    gradingCompany: company,
  };
}

export function generateListings(
  unlocked: MarketplaceSource[],
  trends: MarketTrend[],
  count = 12,
  reputation = 0,
): MarketplaceListing[] {
  const out: MarketplaceListing[] = [];

  if (unlocked.includes('VaultDealer')) {
    // Always 2-3 curated mythic/prototype slabs at the top of the feed.
    const vaultCount = randInt(2, 3);
    for (let i = 0; i < vaultCount; i++) out.push(generateVaultDealerListing(trends));
  }

  if (unlocked.includes('JaredsList') && chance(0.35)) {
    out.push(generateStorageUnitListing('JaredsList', reputation));
  } else if (reputation >= 40 && unlocked.includes('Headbook Marketplace') && chance(0.18)) {
    out.push(generateStorageUnitListing('Headbook Marketplace', reputation));
  }

  // Slab bags — graded-card grab bags. Usually one in the feed, sometimes two.
  {
    const preferred = (['SlabHub', 'JaredsList', 'PackTok Shop', 'FeeBay'] as MarketplaceSource[])
      .filter((m) => unlocked.includes(m));
    const slabBagPool = preferred.length ? preferred : (['FeeBay'] as MarketplaceSource[]);
    if (chance(0.6)) out.push(generateSlabBagListing(pick(slabBagPool)));
    if (chance(0.22)) out.push(generateSlabBagListing(pick(slabBagPool)));
  }

  for (let i = out.length; i < count; i++) {
    const quality = pickQuality();
    const eligibleCards = CARDS.filter((c) => {
      if (reputation < 5 && (c.rarity === 'Mythic Rare' || c.rarity === 'Prototype Card')) return false;
      if (reputation < 20 && c.rarity === 'Prototype Card') return false;
      return true;
    });
    const card = weightedPick(
      eligibleCards,
      eligibleCards.map(pullWeight),
    );
    const { raw, score } = rollCondition(quality);
    let { centeringOffsetX, centeringOffsetY } = rollCentering(quality);
    // Rainbow rares are chronically off-centre.
    if (card.variant === 'rainbow') {
      const rc = rollRainbowCentering();
      centeringOffsetX = rc.centeringOffsetX;
      centeringOffsetY = rc.centeringOffsetY;
    }
    const centeringMult = centeringPriceMultiplier(centeringOffsetX, centeringOffsetY);
    const trueValue = trueValueFor(card, raw, score, trends, centeringMult);
    const askingPrice = priceFor(quality, trueValue);

    const estimatedSpread = rand(0.2, 0.4);
    const estimatedValueMin = Math.max(1, Math.round(trueValue * (1 - estimatedSpread)));
    const estimatedValueMax = Math.round(trueValue * (1 + estimatedSpread));

    const isFake = quality === 'fake';
    const fakeRisk =
      quality === 'fake'
        ? rand(0.6, 0.95)
        : quality === 'mislisted_rare'
        ? rand(0.05, 0.2)
        : rand(0.0, 0.15);
    const scamRisk =
      quality === 'fake' ? rand(0.5, 0.9) : rand(0.0, 0.25);

    const source = rollSource(unlocked, quality);

    const lotType = pickLotType(quality, source);
    const lotSize =
      lotType === 'mystery_lot' || lotType === 'binder'
        ? quality === 'hidden_gem' || quality === 'mislisted_rare'
          ? randInt(5, 9)
          : randInt(3, 7)
        : undefined;

    let grade: number | undefined;
    let gradingCompany: GradingCompanyId | undefined;
    let listingTrueValue = trueValue;
    let listingAsk = askingPrice;
    let listingEstMin = estimatedValueMin;
    let listingEstMax = estimatedValueMax;

    if (lotType === 'slab') {
      const roll = rollSlabGrade(quality);
      grade = roll.grade;
      gradingCompany = roll.company;
      // A slab's centering must agree with its grade — no off-center Gem 10s.
      const slabCentering = rollCenteringForGrade(grade);
      centeringOffsetX = slabCentering.centeringOffsetX;
      centeringOffsetY = slabCentering.centeringOffsetY;
      const gradeMult = GRADE_MULTIPLIER[grade] ?? 1;
      const companyMult =
        gradingCompany === 'PZA' ? 1.2 : gradingCompany === 'Bucket' ? 0.85 : 0.9;
      const slabTrue =
        card.baseValue *
        rarityMult(card.rarity) *
        gradeMult *
        companyMult *
        trendMultiplier(card, trends) *
        rand(0.95, 1.1);
      listingTrueValue = Math.max(10, Math.round(slabTrue));
      listingAsk = priceFor(quality, listingTrueValue);
      const spread = rand(0.18, 0.35);
      listingEstMin = Math.max(1, Math.round(listingTrueValue * (1 - spread)));
      listingEstMax = Math.round(listingTrueValue * (1 + spread));
    } else if (lotType === 'mystery_lot' || lotType === 'binder') {
      // Price lot listings on actual expected lot EV, not just one card's value.
      // First pass: derive a *target* asking price from the seller-knowledge quality,
      // then look up the tier from that ask, then compute EV. Iterate once for stability.
      const size = lotSize!;
      // initial guess tier from raw quality
      let provisionalAsk = quality === 'overpriced' ? 80 : quality === 'hidden_gem' ? 20 : 40;
      let tier = tierForPrice(provisionalAsk);
      let pull = expectedPullValue(tier);
      let lotEV = pull * size;
      // recompute tier from EV-backed price, one pass
      provisionalAsk = Math.round(lotEV * 0.85);
      tier = tierForPrice(provisionalAsk);
      pull = expectedPullValue(tier);
      lotEV = pull * size;

      listingTrueValue = Math.max(8, Math.round(lotEV));
      listingAsk = priceFor(quality, listingTrueValue);
      const spread = rand(0.25, 0.45);
      listingEstMin = Math.max(1, Math.round(listingTrueValue * (1 - spread)));
      listingEstMax = Math.round(listingTrueValue * (1 + spread));
    }

    out.push({
      id: uid('lst_'),
      source,
      title:
        lotType === 'slab'
          ? `${grade} ${gradingCompany} • ${card.name}`
          : makeTitle(card, raw, quality),
      sellerName: pick(SELLER_NAMES),
      description:
        lotType === 'slab'
          ? makeSlabDescription(quality)
          : makeDescription(quality, raw),
      askingPrice: listingAsk,
      trueMarketValue: listingTrueValue,
      estimatedValueMin: listingEstMin,
      estimatedValueMax: listingEstMax,
      conditionHint: pick(CONDITION_HINTS[raw] ?? ['As pictured.']),
      actualConditionScore: score,
      centeringOffsetX,
      centeringOffsetY,
      rawCondition: raw,
      rarity: card.rarity,
      cardId: card.id,
      lotType,
      lotSize,
      scamRisk,
      fakeRisk,
      isFake,
      timeRemainingSeconds: randInt(90, 600),
      createdAt: Date.now(),
      qualityType: quality,
      grade,
      gradingCompany,
    });
  }
  return out;
}
