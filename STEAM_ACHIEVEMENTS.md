# FeeBay Simulator — Steam Achievements

This is the full list of Steam achievements, mirrored 1:1 from the in-game
achievements in `src/data/achievements.ts`.

## How to set these up

1. In Steamworks, open your app → **Edit Steamworks Settings → Stats & Achievements → Achievements**.
2. Add a **New Achievement** for each row below.
3. Set the **API Name** to exactly the value in the *API Name* column — lowercase,
   underscores, no spaces. The game unlocks achievements by this id, so it must match.
4. Set the **Display Name** and **Description** from the columns below.
5. Upload an *achieved* icon and a *locked/grayed* icon for each (Steam requires both).
6. Mark the **Hidden** column's "Yes" rows as Hidden if you want them to be a surprise
   (optional — the rest are your call).
7. **Publish** the changes (Steamworks → Publish). Achievements only go live after publishing.

The game already calls `steamworks` to activate the matching achievement the moment
it is earned in-game, and re-syncs all earned achievements on launch (so anything
earned offline or before this integration catches up automatically).

---

## Bronze — early game

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `first_flip` | First Flip | Sell your first item. | No |
| `first_buy` | First Pickup | Buy your first listing. | No |
| `first_grade` | Slabbed Up | Receive your first graded card. | No |
| `first_lot` | Rip and Reveal | Open your first mystery lot or binder. | No |
| `first_storefront_sale` | Open for Business | Sell something off your own storefront. | No |
| `first_negotiation` | Wheel and Deal | Get a seller to accept a lowball offer. | No |
| `first_convention` | Convention Crawler | Buy something during a live convention. | No |

## Silver — established flipper

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `hidden_gem` | Hidden Gem | Make 200%+ profit on one purchase. | No |
| `feed_alive` | Fee'd Alive | Pay $1,000 total in seller fees. | No |
| `bag_holder` | Bag Holder | Lose 50%+ on a single sale. | Yes |
| `rugged` | Rugged | Buy a fake. The lesson cost you. | Yes |
| `mogul_5k` | Mid-Tier Mogul | Reach $5,000 in cash. | No |
| `closet_treasure` | Closet Treasure | Pull a Secret Rare (or rarer) from a mystery lot. | No |
| `binder_bandit` | Binder Bandit | Open 5 mystery lots. | No |
| `auctioneer` | Going Once... | Win your first BidGoblin auction. | No |
| `bundle_boss` | Bundle Boss | Sell 10 bundles. | No |
| `grading_diversifier` | Three-Slab Diet | Grade at least one card with ZAG, PZA, and Bucket each. | No |
| `centered` | Perfectly Centered | Own a card with dead-center centering (0/0 offset). | No |
| `crash_course` | Crash Course | Trigger a supply crash event by mass-selling a tag. | No |
| `whale_buy` | Confident Whale | Pay $1,000+ for a single purchase. | No |
| `pack_rat` | Pack Rat | Fill your inventory to capacity. | No |
| `reputation_50` | Local Favorite | Reach 50 reputation. | No |
| `week_one` | Week One | Reach day 10. | No |
| `storage_first` | Storage Wars | Crack open your first storage unit. | No |

## Gold — advanced

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `gem_mint_goblin` | Gem Mint Goblin | Receive your first Grade 10. | No |
| `slab_lord` | Slab Lord | Own 10 graded cards (lifetime). | No |
| `set_completionist` | Set Completionist | Own every card in any one set. | No |
| `reputation_100` | Reputation King | Reach 100 reputation. | No |
| `auction_vulture` | Auction Vulture | Win 5 BidGoblin auctions. | No |
| `storage_5` | Storage Tycoon | Crack 5 storage units. | No |
| `mogul_25k` | Marketplace Mogul | Reach $25,000 net worth. | No |
| `all_marketplaces` | Online Everywhere | Unlock all marketplaces. | No |
| `storefront_5` | Real Storefront | Have 5 active player listings at once. | No |

## Mythic — endgame

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `codex_complete` | Codex Mythologist | Own every card in the codex at least once. | No |
| `mogul_100k` | Cardboard Tycoon | Reach $100,000 net worth. | No |
| `mogul_1m` | Card Empire | Reach $1,000,000 net worth. | No |
| `triple_gem` | Triple Gem Day | Receive 3 Gem 10s on a single day. | Yes |
| `marathon_30` | Marathon Flipper | Reach day 30. | No |
| `marathon_50` | Lifer | Reach day 50. | No |
| `top_pop` | Top Pop | Own a Gem 10 of every Mythic Rare or Prototype card. | Yes |
| `all_sets` | Set the Set | Complete every card set. | No |
| `national_reseller` | National Reseller | Promote to Business Level 5. | No |
| `card_empire_level` | Card Empire (Level) | Promote to the final Business Level: Card Empire. | Yes |

---

**Total: 43 achievements** (7 bronze, 17 silver, 9 gold, 10 mythic).

Note: the `all_marketplaces` in-game description currently reads "Unlock all 6
marketplaces" while the game ships with 7 marketplace sources — the table above
says "Unlock all marketplaces" to stay accurate. Update the in-game description
to match if you want them identical.
