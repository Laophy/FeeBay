# FeeBay Simulator — Prototype Game Design & AI Build Spec

## Working Title
**FeeBay Simulator**

Alternative names:
- FlipQuest
- Marketplace Mogul
- Cardboard Hustle
- Slab Tycoon
- Flipper Empire
- RareFind Simulator

## One-Sentence Pitch
A web-based marketplace flipping simulator where players browse parody online marketplaces, discover underpriced collectible card listings, buy inventory, grade risky cards, resell for profit, and grow from broke bedroom reseller into a full online collectibles empire.

## Core Fantasy
The player is a small-time online reseller trying to build wealth by spotting undervalued collectible cards, negotiating deals, taking grading risks, timing market trends, and scaling their flipping business.

The emotional hook is:
> “I found a hidden gem that everyone else missed.”

## Target Feel
- Cozy but addictive
- Satirical/parody internet marketplace vibe
- UI-driven, like a real website/dashboard
- Fast dopamine hits from listings, profits, rare finds, grading reveals, and auctions
- Progression-heavy without requiring complex art
- Built for Electron/Steam using React/web tech

## Game Type
- Single-player prototype first
- Web-based UI game wrapped in Electron
- Later expandable into light multiplayer/WebSocket systems
- Steam-friendly desktop build

## Inspiration Pillars
Do not clone these directly, but study the psychological loops:
- TCG collecting and grading culture
- eBay flipping
- marketplace sniping
- pawn/shop/reseller games
- idle/incremental progression
- tycoon upgrades
- fake operating system / fake internet games

## MVP Goal
Build a playable prototype where the player can:
1. Browse fake marketplace listings
2. Identify potentially profitable card lots
3. Buy items
4. Add them to inventory
5. Sell raw, hold, or send to grading
6. Receive grading results after a timer
7. Sell graded cards for profit/loss
8. Watch market prices fluctuate
9. Upgrade their reseller business
10. Repeat the loop for progression

The MVP should be fun even with placeholder graphics.

---

# Core Gameplay Loop

## Primary Loop
1. Player opens marketplace feed
2. Listings appear with imperfect information
3. Player evaluates price, rarity, seller description, condition, and market trends
4. Player buys promising listings
5. Item enters inventory
6. Player chooses action:
   - Quick flip raw
   - Hold for market movement
   - Send to grading
   - Bundle with other cards
7. Player receives money, grade reveal, or market change outcome
8. Player uses profit to unlock better tools, marketplaces, and automation
9. Repeat with higher stakes

## Emotional Loop
- Browse feed: “Maybe the next listing is insane.”
- Buy item: “Did I just find a steal?”
- Inspect card: “This might be cleaner than expected.”
- Grade card: “Please be a 10.”
- Sell item: “Profit!”
- Upgrade business: “Now I can find even better deals.”

---

# Prototype Scope

## Must-Have MVP Features

### 1. Fake Marketplace Feed
A central screen showing generated listings.

Each listing should include:
- Item title
- Parody marketplace source
- Seller username
- Listing price
- Estimated market value range
- Seller description
- Condition hints
- Time remaining or posted time
- Buy button
- Risk indicators

Example listing:
> Old shiny dragon card binder, found in closet. Don’t know much about these. $42

The player should immediately wonder whether it is a steal or trap.

### 2. Procedural Listing Generator
Listings should be generated from templates.

Variables:
- Card name
- Rarity
- Condition
- Seller knowledge level
- Asking price
- Real value
- Scam/fake chance
- Marketplace source
- Trend modifier
- Mislabel/typo chance

Listing quality types:
- Obvious good deal
- Hidden gem
- Fair market price
- Overpriced listing
- Fake/scam
- Damaged item
- High-risk grading candidate
- Mislisted rare

### 3. Inventory System
Player-owned items should be shown in a sortable inventory.

Inventory item fields:
- ID
- Name
- Set
- Rarity
- Raw condition
- Purchase price
- Estimated raw value
- Estimated graded value
- Current market price
- Status: raw, grading, graded, listed, sold
- Grade if graded
- Days/timer remaining if grading

### 4. Selling System
Player can sell items from inventory.

Options:
- Sell instantly at slightly below market
- List on marketplace for chosen price
- Bundle multiple low-value cards
- Hold for later

Prototype can start with instant sell only.

### 5. Grading System
Player can send eligible cards to a parody grading company.

Parody names:
- TAG-ish: ZAG Grading
- PSA-ish: PZA
- Beckett-ish: Bucket Grading

Grading fields:
- Grading cost
- Turnaround timer
- Grade outcome from 1-10
- Grade affected by hidden condition score
- Small chance of fake/authentication failure

Grade reveal should be a major dopamine moment.

Grades:
- 10: huge multiplier
- 9: strong multiplier
- 8: moderate multiplier
- 7 or below: often not worth grading
- Authentic/Altered/Fake: bad outcome

### 6. Market Price System
Cards should have changing values over time.

Market movement sources:
- Random daily fluctuation
- Trend events
- Influencer hype
- Reprint crash
- Tournament demand
- Nostalgia boom
- Supply spike

Prototype can simulate a new market event every few minutes.

### 7. Player Progression
The player starts with limited money and weak tools.

Starting state:
- Cash: $100
- Reputation: 0
- Inventory slots: 10
- Marketplaces unlocked: FeeBay only
- No grading access at first or grading unlocks after first milestone

Progression currencies:
- Cash
- Reputation
- Business level
- Collection score

### 8. Upgrades
Upgrades should improve the player’s ability to find profit.

Examples:
- Better search filters
- Listing refresh speed
- More inventory slots
- Condition scanner
- Fake detector
- Market trend dashboard
- Bulk listing tool
- Negotiation templates
- Faster grading turnaround
- Storage shelves
- Employee assistant

Prototype should include 6-10 upgrades.

---

# Parody Marketplaces

Use parody platforms for humor and discoverability.

## FeeBay
Main auction/listing site.
- Best for singles, slabs, auctions, mispriced listings
- Fees are annoying and comedic
- Good for sniping deals

## Headbook Marketplace
Local marketplace parody.
- Best for binders, collections, garage sale finds
- Sellers often know less about value
- Higher chance of hidden gems
- Higher chance of awkward negotiation/fake listings

## JaredsList
Craigslist parody.
- Weird listings
- Storage lots
- Meetups
- High risk/high reward
- Funny descriptions

## PackTok Shop
Influencer-driven hype market.
- Prices swing wildly
- Trendy cards pump and dump
- Great for speculation

## SlabHub
Graded-card marketplace.
- Higher value items
- Requires reputation unlock
- Better liquidity
- More competitive pricing

## BidGoblin
Auction house parody.
- Timed auctions
- Bidding wars
- Sniping mechanics
- Later prototype feature

---

# Card/Item System

Do not use real Pokémon or copyrighted TCG names in the prototype.
Create a fictional TCG brand.

## Fictional TCG Name Ideas
- Mythic Monsters
- Critter Clash
- Pocket Beasts parody should be avoided if too direct
- Realm Runners
- Arcane Beasts
- Battle Critters
- Tiny Titans TCG
- Monster Manor
- Relic Realms TCG

## Card Attributes
Each card should have:
- Name
- Set
- Rarity
- Character/type
- Base raw value
- Base PSA/ZAG 10 value equivalent
- Popularity score
- Supply score
- Volatility score
- Condition score
- Grade potential
- Trend tags

## Rarities
- Common
- Uncommon
- Rare
- Holo Rare
- Secret Rare
- Mythic Rare
- Error Print
- First Edition
- Signed
- Prototype Card

## Condition Grades Before Professional Grading
Raw condition should be described in player-friendly terms:
- Damaged
- Heavily Played
- Played
- Lightly Played
- Near Mint
- Minty
- Gem Candidate

Condition should not reveal exact grade unless the player has upgraded tools.

## Example Fictional Cards
- Emberfang Dragon
- Moonlit Moth
- Crystal Toad
- Shadow Sprout
- Azure Griffin
- Golden Goblin
- Neon Wyvern
- Ancient Slime King
- Hollow Fox
- Starfall Serpent

---

# Listing Generator Design

## Listing Data Shape
```ts
type MarketplaceListing = {
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
  rarity: CardRarity;
  cardIds: string[];
  lotType: 'single' | 'binder' | 'sealed' | 'slab' | 'mystery_lot';
  scamRisk: number;
  fakeRisk: number;
  timeRemainingSeconds?: number;
  createdAt: number;
};
```

## Listing Generation Rules
- Generate 8-16 listings at a time.
- Refresh feed manually or on timer.
- Some listings disappear after time expires.
- Better marketplaces/tools improve listing quality.
- Player reputation unlocks higher-value listings.
- Most listings should not be profitable.
- A few should be clearly bad.
- Some should be hidden gems.

## Fun Listing Templates
Seller descriptions should be funny and varied.

Examples:
- “Found these in my brother’s old closet. No idea if they’re worth anything.”
- “RARE??? I saw one online for $10,000. No lowballs.”
- “My kid said this is shiny. Pickup only.”
- “Mystery binder. Could be treasure, could be trash.”
- “Card looks perfect except small crease across the entire dragon.”
- “Selling fast. Need gone before wife sees how much I spent.”
- “I know what I have.”

---

# Economy Design

## Player Money
Player starts with $100.

Cash gates:
- Cannot buy listings if insufficient cash.
- Must pay grading fees up front.
- Storage/inventory limits force selling decisions.

## Market Value Formula
Prototype formula:
```ts
currentValue = baseValue * rarityMultiplier * conditionMultiplier * trendMultiplier * marketRandomness
```

## Graded Value Formula
```ts
gradedValue = baseValue * rarityMultiplier * gradeMultiplier * trendMultiplier
```

Suggested grade multipliers:
- Grade 10: x5.0
- Grade 9.5: x3.2
- Grade 9: x2.2
- Grade 8: x1.3
- Grade 7: x0.8
- Grade 6 or lower: x0.5

## Fees
Make fees comedic.

FeeBay fee example:
- 13% seller fee
- 3% payment processing fee
- Random “because we can” fee: $0.30

This can be part of the joke and strategy.

---

# Grading System Design

## Grade Outcome Formula
Hidden condition score: 0-100.

Grade mapping example:
- 97-100: Grade 10 chance high
- 90-96: Grade 9 likely, 10 possible
- 80-89: Grade 8 likely
- 70-79: Grade 7 likely
- Below 70: low grade

Add randomness to create tension.

## Grading Companies
Each company can have tradeoffs.

### ZAG Grading
- Cheap
- Fast
- Slightly lower resale multiplier

### PZA
- Expensive
- Slower
- Highest market premium

### Bucket Grading
- Inconsistent
- Funny mislabels
- Medium resale value

MVP only needs one grading company.

## Grading Reveal UX
This should feel satisfying.

Prototype reveal:
- Modal opens
- Card flips or loading animation
- Grade appears big
- Value before/after shown
- Profit/loss estimate shown

---

# Upgrade System

## Upgrade Examples

### Basic Search Filters
Cost: $50
Effect: Shows estimated value range on listings.

### Magnifying Glass
Cost: $100
Effect: Improves condition hints.

### Fake Detector Light
Cost: $250
Effect: Reduces chance of buying fake items.

### Market Tracker Dashboard
Cost: $500
Effect: Shows trend arrows for card categories.

### Storage Shelves
Cost: $300
Effect: +20 inventory slots.

### Auto-Lister
Cost: $750
Effect: Reduces selling fees or increases instant sale value.

### Grading Membership
Cost: $1,000
Effect: Unlocks grading submissions.

### Deal Bot
Cost: $2,500
Effect: Highlights one potentially undervalued listing per refresh.

---

# Screens / UI Layout

## Main App Shell
Use a fake desktop/browser layout.

Left sidebar:
- Dashboard
- Marketplace
- Inventory
- Grading
- Market Trends
- Upgrades
- Achievements

Top bar:
- Cash
- Reputation
- Business level
- Current day/season
- Notifications

Main panel changes based on route.

## Dashboard Screen
Shows:
- Cash
- Net worth
- Inventory value
- Recent flips
- Active grading submissions
- Market event ticker
- Best sale
- Biggest loss

## Marketplace Screen
Shows:
- Marketplace tabs
- Listing cards
- Refresh button
- Filters
- Listing details modal
- Buy button

## Inventory Screen
Shows:
- Owned cards/lots
- Value estimates
- Actions: sell, grade, hold
- Sort by profit, rarity, condition, purchase price

## Grading Screen
Shows:
- Active submissions
- Completed reveals
- Grading company options
- Turnaround timers

## Market Trends Screen
Shows:
- Trending card types
- Rising/falling categories
- Event history
- Market charts

## Upgrades Screen
Shows:
- Upgrade tree/grid
- Purchased upgrades
- Locked upgrades

---

# Prototype Art Direction

Keep art minimal.

Style:
- Clean web dashboard
- Satirical marketplace UI
- Cozy collector colors
- Card thumbnails can be generated placeholders
- Use colored rarity borders
- Simple icons
- Minimal animation but satisfying transitions

Card images:
- Prototype can use placeholder gradient cards with names and rarity icons.
- Later use generated fictional card art.

Avoid real copyrighted TCG imagery.

---

# Fun / Humor Direction

Tone should be lightly satirical.

Examples:
- FeeBay fees are ridiculous.
- Sellers write bad descriptions.
- Some listings are obvious scams.
- Grading companies occasionally mislabel cards.
- Influencer hype causes silly market spikes.
- Fake local sellers say “pickup behind gas station.”

Humor should support the game, not overwhelm it.

---

# Progression Milestones

## Early Game
- Start with $100
- Buy cheap lots
- Learn values
- Make first $500
- Unlock Headbook Marketplace

## Mid Game
- Unlock grading
- Start speculating on trends
- Upgrade storage/tools
- Reach $5,000 cash
- Unlock SlabHub

## Late Prototype Goal
- Reach $25,000 net worth
- Build online storefront
- Unlock auto-listing
- Become “Marketplace Mogul”

---

# Achievements

Examples:
- First Flip: Sell your first item
- Hidden Gem: Make 300% profit on one purchase
- Fee’d Alive: Pay $1,000 total in FeeBay fees
- Gem Mint Goblin: Receive your first grade 10
- Bag Holder: Lose 50% on a hyped item
- No Lowballs: Buy from an overpriced seller
- Closet Treasure: Find a secret rare in a binder lot
- Slab Lord: Own 10 graded cards

---

# Optional Social/WebSocket Expansion

Do not build this in MVP unless core loop is fun.

Future WebSocket features:
- Global market ticker
- Live player sale announcements
- Player shops
- Live auctions
- Shared market trends
- Global events
- Leaderboards
- Chat channels
- Convention events

Lightweight multiplayer idea:
Players do not need to interact directly in real time. They can affect shared prices, compete on leaderboards, and participate in live auctions.

---

# Technical Build Spec

## Recommended Stack
- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- Zustand for state management
- LocalStorage or IndexedDB for prototype saves
- Framer Motion for animations
- Recharts for market charts
- Optional later: Node/Express + WebSocket server

## App Structure
```txt
/feebay-simulator
  /electron
    main.ts
    preload.ts
  /src
    /components
    /features
      /marketplace
      /inventory
      /grading
      /upgrades
      /economy
      /dashboard
    /data
      cards.ts
      marketplaces.ts
      upgrades.ts
      listingTemplates.ts
    /game
      listingGenerator.ts
      economyEngine.ts
      gradingEngine.ts
      marketEvents.ts
      saveSystem.ts
    /store
      useGameStore.ts
    App.tsx
    main.tsx
  package.json
  vite.config.ts
```

## State Shape
```ts
type GameState = {
  cash: number;
  reputation: number;
  businessLevel: number;
  day: number;
  marketplacesUnlocked: MarketplaceSource[];
  listings: MarketplaceListing[];
  inventory: InventoryItem[];
  gradingSubmissions: GradingSubmission[];
  upgradesPurchased: string[];
  marketTrends: MarketTrend[];
  notifications: GameNotification[];
  stats: PlayerStats;
};
```

## Core Functions
```ts
generateListings(gameState): MarketplaceListing[]
buyListing(listingId): void
sellInventoryItem(itemId): void
sendToGrading(itemId, companyId): void
resolveGradingSubmission(submissionId): void
advanceDay(): void
applyMarketEvent(event): void
purchaseUpgrade(upgradeId): void
calculateItemValue(item): number
saveGame(): void
loadGame(): GameState
```

---

# Prototype Implementation Order

## Step 1 — Build App Shell
- Electron + React + TypeScript + Vite
- Sidebar navigation
- Top cash/reputation bar
- Static placeholder screens

## Step 2 — Create Game State
- Zustand store
- Cash, inventory, listings, upgrades
- Save/load from LocalStorage

## Step 3 — Marketplace Feed
- Procedural listings
- Refresh button
- Buy button
- Listing details modal

## Step 4 — Inventory + Selling
- Show owned items
- Calculate current value
- Instant sell button
- Profit/loss feedback

## Step 5 — Grading
- Send card to grading
- Timer or turn-based completion
- Grade reveal modal
- Value multiplier

## Step 6 — Market Events
- Random trend events
- Price modifiers
- Event ticker

## Step 7 — Upgrades
- Purchase upgrades
- Apply effects
- Unlock marketplaces/features

## Step 8 — Polish
- Animations
- Notifications
- Sound effects optional
- Better listing text
- Achievements

---

# MVP Acceptance Criteria

The prototype is successful if:
- Player can play for 15-30 minutes
- Player repeatedly wants to refresh listings
- Buying decisions feel risky/fun
- Grading reveal feels exciting
- Profit/loss is clear
- Upgrades create motivation
- Game can be packaged in Electron
- No real copyrighted card brands are required

---

# AI Coding Prompt

Use this prompt to generate the prototype:

Build a complete Electron + React + TypeScript + Vite prototype called FeeBay Simulator. It is a fake online marketplace flipping simulator where the player buys fictional collectible cards from parody marketplaces, sells them for profit, sends cards to grading, watches market prices fluctuate, and purchases business upgrades.

The game should use a web-dashboard UI with a sidebar, top stats bar, marketplace feed, inventory screen, grading screen, market trends screen, and upgrades screen. Use Zustand for state, TailwindCSS for styling, and localStorage for saving.

Implement procedural listing generation using fictional card names, rarities, seller descriptions, prices, condition hints, scam risk, and hidden true values. The player starts with $100 and can buy listings, sell inventory items, send eligible cards to grading, resolve grading results, and buy upgrades.

Do not use real Pokémon, eBay, Facebook, or other copyrighted brands. Use parody platform names such as FeeBay, Headbook Marketplace, JaredsList, PackTok Shop, SlabHub, and BidGoblin. Use fictional TCG names and cards.

Make the game playable without backend services. Multiplayer/WebSocket systems should be left as future expansion. Prioritize a fun core loop, clear profit/loss feedback, satisfying grading reveals, random market events, and upgrade progression.

---

# Future Expansion Ideas

## Steam Version Features
- Achievements
- Cloud saves
- Steam rich presence
- Demo version with limited progression
- Full version unlocks more marketplaces and endgame events

## Multiplayer Version
- Shared player economy
- Live auctions
- Player shops
- Global market events
- Leaderboards
- Chat

## Content Expansions
- New fictional TCG sets
- Seasonal market crashes
- Convention events
- Storage unit auctions
- Streamer hype events
- Fake scandal events
- Grading controversy events

---

# Design Warning

Do not overbuild the first version.

The prototype should NOT include:
- Real-time multiplayer
- 3D store walking
- Huge card art pipeline
- Complex authentication
- Real money systems
- Real card brands
- Real marketplace scraping

Focus entirely on the core dopamine loop:
> Browse → Spot Deal → Buy → Evaluate → Grade/Sell → Profit/Loss → Upgrade → Repeat

