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

export type LotType = 'single' | 'binder' | 'sealed' | 'slab' | 'mystery_lot' | 'storage_unit';

export type GradingCompanyId = 'ZAG' | 'PZA' | 'Bucket';

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
  /** Whether the player has triggered at least one supply crash. */
  crashesCaused: number;
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

export type LotReveal = {
  id: string;
  source: MarketplaceSource;
  pricePaid: number;
  itemIds: string[];
  estimatedValue: number;
  lotKind: 'mystery' | 'binder' | 'storage_unit';
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
  endsAt: number;
  myMaxBid?: number;
  /** rival bidder activity */
  rivalAggression: number;
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
  /** Per-helper last-tick timestamps so we throttle their actions. */
  hiredHelpState: {
    apprenticeLastFlipAt: number;
    buyerAgentLastBuyAt: number;
    marketingLastTickAt: number;
  };
  /** Session-only UI state that survives screen navigation but isn't persisted. */
  ui: {
    inventoryFilter: 'all' | 'raw' | 'grading' | 'graded' | 'listed' | 'showcased';
    inventorySortKey: 'value' | 'profit' | 'rarity' | 'condition' | 'recent';
    marketplaceActiveSource: 'all' | MarketplaceSource;
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
  /** Whether the buyer paid right away or after a delay. */
  status: 'instant' | 'delayed';
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
