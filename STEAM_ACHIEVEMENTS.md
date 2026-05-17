# FeeBay Simulator — Steam Achievements

The **single source of truth** for the game's Steam achievements. Mirrors
`src/data/achievements.ts` 1:1.

**71 achievements** — 18 bronze, 27 silver, 16 gold, 10 mythic.
Verified in sync with the game build and with the current live Steamworks config.

> This file replaces the old `STEAM_ACHIEVEMENTS.md`, `STEAM_ACHIEVEMENTS_V2.md`
> and `STEAM_ACHIEVEMENTS_NEW.md` — all three are now merged here.

## How to set these up

1. In Steamworks: your app → **Edit Steamworks Settings → Stats & Achievements → Achievements**.
2. Add a **New Achievement** per row below.
3. **API Name** must exactly match the *API Name* column — lowercase, underscores,
   no spaces. The game unlocks achievements by this id, so it must match.
4. Set **Display Name** and **Description** from the columns below.
5. Upload an *achieved* icon and a *locked/grayed* icon for each (Steam requires both).
6. Set the **Hidden** flag on the rows marked "Yes".
7. **Publish** (Steamworks → Publish) — achievements only go live after publishing.

The game calls `steamworks` to activate the matching achievement the moment it is
earned, and re-syncs all earned achievements on launch (so anything earned offline
or before the integration catches up automatically).

**Legend** — *Tier* is the game's internal grouping (drives the in-game cash
reward); Steam itself has no tiers, it's here for reference. *Hidden* is the
Steamworks setting; "Yes" rows are hidden on the live config.

---

## Core — Bronze (early game)

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `first_flip` | First Flip | Sell your first item. | No |
| `first_buy` | First Pickup | Buy your first listing. | No |
| `first_grade` | Slabbed Up | Receive your first graded card. | No |
| `first_lot` | Rip and Reveal | Open your first mystery lot or binder. | No |
| `first_storefront_sale` | Open for Business | Sell something off your own storefront. | No |
| `first_negotiation` | Wheel and Deal | Get a seller to accept a lowball offer. | No |
| `first_convention` | Convention Crawler | Buy something during a live convention. | No |

## Core — Silver (established flipper)

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `hidden_gem` | Hidden Gem | Make 200%+ profit on one purchase. | No |
| `feed_alive` | Fee'd Alive | Pay $1,000 total in seller fees. | No |
| `bag_holder` | Bag Holder | Lose 50%+ on a single sale. | **Yes** |
| `rugged` | Rugged | Buy a fake. The lesson cost you. | **Yes** |
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

## Core — Gold (advanced)

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

## Core — Mythic (endgame)

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `codex_complete` | Codex Mythologist | Own every card in the codex at least once. | No |
| `mogul_100k` | Cardboard Tycoon | Reach $100,000 net worth. | No |
| `mogul_1m` | Card Empire | Reach $1,000,000 net worth. | No |
| `triple_gem` | Triple Gem Day | Receive 3 Gem 10s on a single day. | **Yes** |
| `marathon_30` | Marathon Flipper | Reach day 30. | No |
| `marathon_50` | Lifer | Reach day 50. | No |
| `top_pop` | Top Pop | Own a Gem 10 of every Mythic Rare or Prototype card. | **Yes** |
| `all_sets` | Set the Set | Complete every card set. | No |
| `national_reseller` | National Reseller | Promote to Business Level 5. | No |
| `card_empire_level` | Card Empire (Level) | Promote to the final Business Level: Card Empire. | **Yes** |

## UI & meta (bronze)

Unlocked by clicking around the app itself.

| API Name | Display Name | Description | Hidden |
|---|---|---|---|
| `discord_click` | Drop the Discord | Click the Join Our Discord button. | No |
| `coffee_click` | Caffeine Sponsor | Click the Buy Me a Coffee button. | No |
| `searched` | Search Party | Type something into the FeeBay search bar. | No |
| `logo_hover` | Logo Botherer | Hover the FeeBay logo and make it dance. | **Yes** |
| `game_reset` | Clean Slate | Wipe your save and start a fresh empire. | No |

## Slab bags

A graded-card grab-bag marketplace lot.

| API Name | Display Name | Description | Tier | Hidden |
|---|---|---|---|---|
| `first_slab_bag` | Bag Secured | Open your first slab bag. | Bronze | No |
| `slab_bag_10` | Bag Chaser | Open 10 slab bags. | Silver | No |
| `scam_bag` | Bagged and Tagged | Get scammed by a counterfeit slab bag. | Silver | **Yes** |
| `slab_bag_jackpot` | Jackpot Bag | Pull a Gem 10 slab out of a slab bag. | Gold | **Yes** |

## Fake-card sales

The shady side of the business — selling counterfeits off your storefront.

| API Name | Display Name | Description | Tier | Hidden |
|---|---|---|---|---|
| `fake_sale_1` | Caveat Emptor | Sell a fake card off your storefront. | Silver | **Yes** |
| `fake_sale_5` | Forgery Ring | Sell 5 fake cards off your storefront. | Silver | **Yes** |
| `fake_sale_100` | Counterfeit Kingpin | Sell 100 fake cards off your storefront. | Gold | **Yes** |

## Secret dev console

The `/cheats` easter egg. Keep both hidden so players have to find it.

| API Name | Display Name | Description | Tier | Hidden |
|---|---|---|---|---|
| `cheat_breach` | Hack the Planet | Breach the secret FeeBay developer console. | Gold | **Yes** |
| `achievement_cheater` | Nice Try | Use the cheats console to "unlock all achievements". It only unlocks this one. | Bronze | **Yes** |

## Showcase value

Milestones for the Collection page Showcase display.

| API Name | Display Name | Description | Tier | Hidden |
|---|---|---|---|---|
| `showcase_value_10k` | Gallery Opening | Display $10,000+ worth of cards on your Collection showcase. | Silver | No |
| `showcase_value_100k` | Museum Wing | Display $100,000+ worth of cards on your Collection showcase. | Gold | No |

## Codex set completion

One "complete this set" achievement per card set. **Generated from the card
roster** (`buildSetAchievements` in `achievements.ts`) — see the maintenance note
below before adding/resizing a set.

| API Name | Display Name | Description | Tier | Hidden |
|---|---|---|---|---|
| `set_base_set` | Base Set Curator | Own every card in the Base Set. | Gold | No |
| `set_base_set_1st_edition` | Base Set 1st Edition Curator | Own every card in the Base Set 1st Edition set. | Gold | No |
| `set_lunar_echoes` | Lunar Echoes Curator | Own every card in the Lunar Echoes set. | Bronze | No |
| `set_glacial_springs` | Glacial Springs Curator | Own every card in the Glacial Springs set. | Gold | No |
| `set_hollow_garden` | Hollow Garden Curator | Own every card in the Hollow Garden set. | Silver | No |
| `set_skyborn_saga` | Skyborn Saga Curator | Own every card in the Skyborn Saga set. | Silver | No |
| `set_treasure_trove` | Treasure Trove Curator | Own every card in the Treasure Trove set. | Bronze | No |
| `set_packtok_promos` | PackTok Promos Curator | Own every card in the PackTok Promos set. | Silver | No |
| `set_forgotten_realms` | Forgotten Realms Curator | Own every card in the Forgotten Realms set. | Bronze | No |
| `set_twilight_veil` | Twilight Veil Curator | Own every card in the Twilight Veil set. | Silver | No |
| `set_cosmic_drift` | Cosmic Drift Curator | Own every card in the Cosmic Drift set. | Bronze | No |
| `set_iron_vanguard` | Iron Vanguard Curator | Own every card in the Iron Vanguard set. | Silver | No |

---

## Review notes

- **✅ In sync.** Your live Steamworks list (71) matches the game code exactly —
  nothing missing, nothing extra, all API names and display names line up.
- **⚠️ Fixed — `all_marketplaces`.** The in-game code description previously read
  *"Unlock all 6 marketplaces"* — but the game ships **7** marketplaces. Your
  Steam description (*"Unlock all marketplaces"*) was already correct, so the code
  has now been updated to match it. No Steamworks change needed.
- **Maintenance — codex set achievements are generated.** The 12 `set_*`
  achievements are built from the card roster at runtime. If a card set is ever
  added, removed, or renamed, the generated list changes and the count shifts —
  you'd need to register the new achievement on Steamworks (and its API name comes
  from `setAchievementId()`, e.g. "New Set" → `set_new_set`).
- **Hidden flags.** 13 achievements are Hidden on the live config: the 8
  easter-egg / scam / fake-sale ones (`logo_hover`, `scam_bag`, `slab_bag_jackpot`,
  `fake_sale_1`, `fake_sale_5`, `fake_sale_100`, `cheat_breach`,
  `achievement_cheater`) plus the 5 surprise / bad-outcome ones (`bag_holder`,
  `rugged`, `triple_gem`, `top_pop`, `card_empire_level`). The other 58 are
  visible.
- **Optional — near-duplicate names.** `mogul_1m` is "Card Empire" and
  `card_empire_level` is "Card Empire (Level)". Both are correct, but the names
  are easy to confuse on the Steam page — consider renaming one (e.g. `mogul_1m`
  → "Millionaire" / "Seven Figures") if you want them clearly distinct.
