export type MarketplaceSource =
  | 'FeeBay'
  | 'Headbook Marketplace'
  | 'JaredsList'
  | 'PackTok Shop'
  | 'SlabHub'
  | 'BidGoblin'
  | 'VaultDealer';

export type CardRarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Holo Rare'
  | 'Secret Rare'
  | 'Mythic Rare'
  | 'Error Print'
  | 'First Edition'
  | 'Signed'
  | 'Prototype Card';

export type RawCondition =
  | 'Damaged'
  | 'Heavily Played'
  | 'Played'
  | 'Lightly Played'
  | 'Near Mint'
  | 'Minty'
  | 'Gem Candidate';

export type LotType =
  | 'single'
  | 'binder'
  | 'sealed'
  | 'slab'
  | 'mystery_lot'
  | 'storage_unit'
  | 'slab_bag';

/** Value tier of a slab bag — drives its price and the graded card inside. */
export type SlabBagTier = 'budget' | 'standard' | 'premium' | 'whale';

export type GradingCompanyId = 'ZAG' | 'PZA' | 'Bucket';

/** Print variant of a card. Rainbow is the top tier — premium creatures only. */
export type CardVariant = 'normal' | 'reverse_holo' | 'holo' | 'rainbow';

export type CardDef = {
  id: string;
  name: string;
  set: string;
  rarity: CardRarity;
  character: string;
  baseValue: number;
  basePremiumValue: number;
  popularity: number;
  supply: number;
  volatility: number;
  gradePotential: number;
  trendTags: string[];
  hue: number;
  /** Print finish — drives holographic visuals and a value tier. */
  variant: CardVariant;
  /** The creature family id this card belongs to (shared across variants/editions). */
  baseId: string;
  /** True for the 1st Edition print run of a set. */
  firstEdition?: boolean;
};

export type MarketplaceListing = {
  id: string;
  source: MarketplaceSource;
  title: string;
  sellerName: string;
  description: string;
  askingPrice: number;
  trueMarketValue: number;
  estimatedValueMin: number;
  estimatedValueMax: number;
  conditionHint: string;
  actualConditionScore: number;
  /** Range -8..+8. Negative = art shifted left (left border thinner, right border thicker).
   *  Positive = art shifted right (left border thicker, right border thinner). */
  centeringOffsetX: number;
  centeringOffsetY: number;
  rawCondition: RawCondition;
  rarity: CardRarity;
  cardId: string;
  lotType: LotType;
  scamRisk: number;
  fakeRisk: number;
  isFake: boolean;
  timeRemainingSeconds: number;
  createdAt: number;
  qualityType: ListingQuality;
  /** For mystery lots, the count of cards revealed on purchase (cosmetic on listing). */
  lotSize?: number;
  /** For slab bags, the value tier the bag resolves against. */
  slabBagTier?: SlabBagTier;
  /** When the listing is a slab, the grade and grading company on the case. */
  grade?: number;
  gradingCompany?: GradingCompanyId;
};

export type ListingQuality =
  | 'obvious_deal'
  | 'hidden_gem'
  | 'fair'
  | 'overpriced'
  | 'fake'
  | 'damaged'
  | 'grading_candidate'
  | 'mislisted_rare';

export type ItemStatus = 'raw' | 'grading' | 'graded' | 'listed' | 'sold';

export type InventoryItem = {
  id: string;
  cardId: string;
  name: string;
  set: string;
  rarity: CardRarity;
  rawCondition: RawCondition;
  actualConditionScore: number;
  centeringOffsetX: number;
  centeringOffsetY: number;
  purchasePrice: number;
  baseValue: number;
  status: ItemStatus;
  grade?: number;
  gradeLabel?: string;
  gradingCompany?: GradingCompanyId;
  acquiredFrom: MarketplaceSource;
  acquiredAt: number;
  /** True only when a hired helper (Buyer Agent) bought this card. The
   *  Apprentice auto-flips only these — never cards you bought yourself. */
  autoBought?: boolean;
  isFake: boolean;
  hue: number;
};

export type GradingSubmission = {
  id: string;
  itemId: string;
  cardName: string;
  /** Total charged at submission (base grading cost + shipping). */
  cost: number;
  /** Shipping portion of the cost. */
  shippingFee?: number;
  submittedAt: number;
  resolveAt: number;
  company: GradingCompanyId;
};

export type GameNotification = {
  id: string;
  message: string;
  kind: 'info' | 'success' | 'warning' | 'event' | 'achievement';
  createdAt: number;
};

export type MarketTrend = {
  tag: string;
  multiplier: number;
  expiresAt: number;
  label: string;
  direction: 'up' | 'down';
};

export type PlayerStats = {
  totalBought: number;
  totalSold: number;
  totalProfit: number;
  totalFeesPaid: number;
  bestSaleProfit: number;
  biggestLoss: number;
  gradesReceived: Record<string, number>;
  mysteryLotsOpened: number;
  auctionsWon: number;
  highestSinglePurchase: number;
  bundlesSold: number;
  storageUnitsOpened: number;
  /** Tracks which grading companies have returned at least one card. */
  gradingCompaniesUsed: string[];
  /** Count of negotiated accepts (offer below ask accepted). */
  negotiationsAccepted: number;
  /** Convention buys total. */
  conventionBuys: number;
  /** Gem 10s pulled today (reset on EOD). */
  gem10sToday: number;
  /** Highest reputation reached. */
  highestReputation: number;
  /** Highest net worth reached. */
  highestNetWorth: number;
  /** Total player-storefront sales (separate from totalSold). */
  storefrontSales: number;
  /** Lifetime gross revenue (net of fees) from player-storefront sales. */
  storefrontRevenue: number;
  /** Whether the player has triggered at least one supply crash. */
  crashesCaused: number;
  /** Lifetime count of fake cards sold off the player's storefront. */
  fakeCardsSold: number;
  /** Lifetime count of slab bags opened. */
  slabBagsOpened: number;
};

export type CollectionEntry = {
  cardId: string;
  totalOwned: number;
  bestGrade?: number;
  firstAcquiredAt: number;
};

export type GradingReveal = {
  submissionId: string;
  itemId: string;
  finalValue: number;
  grade: number;
  gradeLabel: string;
  company: GradingCompanyId;
};

/** A logged grading result — drives the "Recently graded" history list. */
export type GradeHistoryEntry = {
  id: string;
  cardId: string;
  cardName: string;
  rarity: CardRarity;
  hue: number;
  centeringOffsetX: number;
  centeringOffsetY: number;
  grade: number;
  gradeLabel: string;
  gradingCompany: GradingCompanyId;
  /** Raw market value just before grading. */
  rawValue: number;
  /** Market value once slabbed. */
  gradedValue: number;
  /** What the player paid to grade (incl. shipping). */
  cost: number;
  /** Funny grader note generated from the card's traits. */
  graderNote: string;
  gradedAt: number;
};

export type BulkGradeReveal = {
  itemId: string;
  cardId: string;
  cardName: string;
  rarity: CardRarity;
  hue: number;
  centeringOffsetX: number;
  centeringOffsetY: number;
  grade: number;
  gradeLabel: string;
  company: GradingCompanyId;
  paid: number;
  finalValue: number;
  profit: number;
};

export type LotReveal = {
  id: string;
  source: MarketplaceSource;
  pricePaid: number;
  itemIds: string[];
  estimatedValue: number;
  lotKind: 'mystery' | 'binder' | 'storage_unit' | 'slab_bag';
};

export type AuctionRivalArchetype = 'whale' | 'steady' | 'cheapskate' | 'sniper';

/** A named rival bidder competing on a BidGoblin lot. */
export type AuctionRival = {
  id: string;
  name: string;
  archetype: AuctionRivalArchetype;
  /** Hidden ceiling — the most this rival will ever pay. */
  budget: number;
  /** 0..1 — how eagerly they jump in on a given tick. */
  aggression: number;
  /** False once they top out or bail. */
  active: boolean;
};

/** One entry in an auction's running bid feed. */
export type AuctionBid = {
  id: string;
  /** Rival name, 'You', or 'GOBLIN' for house lines. */
  bidder: string;
  amount: number;
  at: number;
  kind: 'player' | 'rival' | 'goblin' | 'system';
  /** Flavor text for goblin/system feed entries. */
  text?: string;
};

export type AuctionListing = {
  id: string;
  cardId: string;
  rarity: CardRarity;
  rawCondition: RawCondition;
  actualConditionScore: number;
  centeringOffsetX: number;
  centeringOffsetY: number;
  trueMarketValue: number;
  currentBid: number;
  bidIncrement: number;
  buyoutPrice?: number;
  startedAt: number;
  endsAt: number;
  myMaxBid?: number;
  /** Named rival bidders warring over this lot. */
  rivals: AuctionRival[];
  /** Running bid feed, newest first, capped. */
  bids: AuctionBid[];
  /** Who currently holds the high bid — 'You' or a rival name ('' if no bids). */
  leaderName: string;
  /** Cosmetic onlooker count. */
  watchers: number;
  /** Anti-snipe extensions applied so far. */
  extensionCount: number;
  isMine: boolean;
  resolved: boolean;
  wonByPlayer?: boolean;
  isFake: boolean;
};

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export type EndOfDayReport = {
  day: number;
  cashStart: number;
  cashEnd: number;
  bought: number;
  sold: number;
  netProfit: number;
  feesPaid: number;
  bestSale: number;
  worstSale: number;
  gradesReceived: number;
  newCards: number;
};

export type EmployeeRole = 'scout' | 'flipper' | 'promoter' | 'manager';

/** 1 Rookie · 2 Pro · 3 Veteran. */
export type EmployeeTier = 1 | 2 | 3;

/** One entry in an employee's activity log. */
export type EmployeeLogEntry = {
  id: string;
  at: number;
  kind: 'flip' | 'buy' | 'promo' | 'mistake' | 'break';
  text: string;
  /** Profit (+) or cost (−) in dollars. */
  amount: number;
};

/** One card that moved through the store — feeds the Employees-page flow belt.
 *  Carries everything CardArt needs to render the real card. */
export type CardFlowEntry = {
  id: string;
  cardId: string;
  name: string;
  rarity: CardRarity;
  hue: number;
  grade?: number;
  gradingCompany?: GradingCompanyId;
  centeringOffsetX?: number;
  centeringOffsetY?: number;
  /** `sourced` = a Scout bought it in; `flipped` = a Flipper sold it on. */
  kind: 'sourced' | 'flipped';
  /** Sourced: price paid. Flipped: profit booked (signed). */
  amount: number;
};

export type Employee = {
  id: string;
  name: string;
  role: EmployeeRole;
  tier: EmployeeTier;
  hiredAt: number;
  /** Current work-cycle window — drives the progress timer. */
  cycleStartedAt: number;
  cycleEndsAt: number;
  /** Lifetime tallies. */
  actions: number;
  profit: number;
  mistakes: number;
  mistakeCost: number;
  /** Recent activity, newest first, capped. */
  log: EmployeeLogEntry[];
  /** Set when the worker has nothing to do this cycle (e.g. out of cash). */
  idle?: string;
  /** Set while the employee is off on a (non-productive) break. */
  break?: string;
};

export type GameState = {
  cash: number;
  reputation: number;
  businessLevel: number;
  day: number;
  dayStartedAt: number;
  /** snapshot of stats at day start for end-of-day reporting */
  dayStartStats: {
    cash: number;
    bought: number;
    sold: number;
    profit: number;
    fees: number;
    gradesCount: number;
    collectionSize: number;
    bestSale: number;
    biggestLoss: number;
  };
  marketplacesUnlocked: MarketplaceSource[];
  listings: MarketplaceListing[];
  inventory: InventoryItem[];
  gradingSubmissions: GradingSubmission[];
  upgradesPurchased: string[];
  marketTrends: MarketTrend[];
  notifications: GameNotification[];
  stats: PlayerStats;
  lastListingRefresh: number;
  lastMarketEvent: number;
  pendingGradeReveals: GradingReveal[];
  /** Session-only — populated when Reveal All fires, consumed by the bulk-reveal modal. Not persisted. */
  pendingBulkReveal: BulkGradeReveal[];
  /** Log of graded cards (newest first, capped) for the Recently Graded list. */
  gradingHistory: GradeHistoryEntry[];
  pendingLotReveals: LotReveal[];
  achievementsUnlocked: string[];
  achievementsClaimed: string[];
  netWorthSamples: { t: number; v: number }[];
  auctions: AuctionListing[];
  lastAuctionRefresh: number;
  hasSeenIntro: boolean;
  collection: Record<string, CollectionEntry>;
  pendingEndOfDay: EndOfDayReport | null;
  /** Per-card market noise multiplier near 1.0, mean-reverting random walk. */
  marketNoise: Record<string, number>;
  /** Previous-tick snapshot of noise, used to detect upticks/downticks for UI flashes. */
  marketNoisePrev: Record<string, number>;
  lastMarketNoiseTick: number;
  watchedCardIds: string[];
  /** Last-noise-at-alert-time per card so we don't re-fire the same alert every tick. */
  watchAlertBaseline: Record<string, number>;
  /** Active convention, or null. */
  convention: ConventionState | null;
  /** Recent player sells per trend tag, for reactive market events. Buckets of count. */
  recentSellsByTag: Record<string, { count: number; lastAt: number }>;
  lastConventionAt: number;
  playerListings: PlayerListing[];
  /** Inventory item ids the player has favorited / put in their showcase. Locked from sale. */
  showcaseItemIds: string[];
  /** History of items that sold off the player's storefront (newest first, capped). */
  storefrontHistory: StorefrontSale[];
  /** Pending storefront sales waiting on buyer payment or cancellation. */
  pendingPayments: PendingPayment[];
  /** Net revenue accumulated from storefront sales; manually moved to cash via withdraw. */
  storefrontBalance: number;
  /** Whether the player has toggled auto-withdraw on. Only effective if the upgrade is owned. */
  autoWithdrawEnabled: boolean;
  /** Whether the end-of-day summary modal pops up on each day rollover. */
  dailyModalEnabled: boolean;
  /** Minutes between automatic save backups (0 = off). Desktop app only. */
  backupIntervalMin: number;
  /** Hired employees — the automation workforce. */
  employees: Employee[];
  /** Lifetime net profit booked by employees — survives hiring and firing. */
  companyProfit: number;
  /** Sampled `companyProfit` snapshots (1/sec) for the live profit chart, oldest first. */
  companyProfitHistory: number[];
  /** Recent cards that moved through the store, newest first — the flow belt. */
  cardFlow: CardFlowEntry[];
  /** Lifetime operating overhead paid per category — shipping, supplies, prep. */
  operatingCosts: Record<string, number>;
  /** 5-second net-worth samples for the dashboard's live chart, oldest first. */
  netWorthHistory: number[];
  /** Session-only — true while the hidden `/cheats` developer console is open. Not persisted. */
  cheatsConsoleOpen: boolean;
  /** Session-only UI state that survives screen navigation but isn't persisted. */
  ui: {
    inventoryFilter: 'all' | 'raw' | 'grading' | 'graded' | 'listed' | 'showcased';
    inventorySortKey: 'value' | 'profit' | 'rarity' | 'condition' | 'recent';
    marketplaceActiveSource: 'all' | MarketplaceSource;
    /** Default store raw cards sell to from the one-click Sell button. */
    primaryMarketplace: MarketplaceSource;
  };
};

export type ConventionState = {
  id: string;
  name: string;
  startedAt: number;
  endsAt: number;
  /** boosted multiplier applied on top of regular trends for matching tags */
  boostMultiplier: number;
  /** the trend tags this convention pumps */
  pumpedTags: string[];
};

export type PendingPayment = {
  id: string;
  /** Full snapshot of the item, so we can rebuild it on cancel. */
  item: InventoryItem;
  marketplace: MarketplaceSource;
  buyerName: string;
  listPrice: number;
  netRevenue: number;
  fees: number;
  profit: number;
  saleAt: number;
  resolveAt: number;
  /** True = buyer never pays / cancels; false = buyer pays after delay. */
  willCancel: boolean;
};

export type StorefrontSale = {
  id: string;
  cardId: string;
  cardName: string;
  rarity: CardRarity;
  hue: number;
  grade?: number;
  gradingCompany?: GradingCompanyId;
  centeringOffsetX: number;
  centeringOffsetY: number;
  marketplace: MarketplaceSource;
  soldAt: number;
  listPrice: number;
  netRevenue: number;
  profit: number;
  /** Whether the buyer paid right away, after a delay, or never paid (cancelled). */
  status: 'instant' | 'delayed' | 'cancelled';
  buyerName?: string;
};

export type PlayerListing = {
  id: string;
  itemId: string;
  marketplace: MarketplaceSource;
  askingPrice: number;
  /** Reference value at listing time (raw or graded), for sale-probability math. */
  refValue: number;
  listedAt: number;
  expiresAt: number;
  /** Sniffed by tick action; 0..1 probability ramp. */
  views: number;
};

export type Upgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  cashReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'mythic';
};
