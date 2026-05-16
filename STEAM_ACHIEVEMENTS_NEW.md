# FeeBay Simulator — NEW Achievements (v2 batch)

These are the **12 new achievements** added in this update. They are live in
`src/data/achievements.ts` and fully wired up in-game. Add each one to Steamworks
(see `STEAM_ACHIEVEMENTS.md` for the step-by-step), then publish.

For the complete merged list (old + new) to upload, see **`STEAM_ACHIEVEMENTS_V2.md`**.

---

## New — UI / meta

These unlock from clicking around the app itself. They fire instantly and persist
to the save the moment they're earned.

| API Name | Display Name | Description | Tier | Hidden | How it triggers |
|---|---|---|---|---|---|
| `discord_click` | Drop the Discord | Click the Join Our Discord button. | Bronze | No | Clicking the "Join our Discord" button in the sidebar. |
| `coffee_click` | Caffeine Sponsor | Click the Buy Me a Coffee button. | Bronze | No | Clicking the "Buy me a coffee" button in the sidebar. |
| `searched` | Search Party | Type something into the FeeBay search bar. | Bronze | No | Typing any non-empty text into the top-bar search box. |
| `logo_hover` | Logo Botherer | Hover the FeeBay logo and make it dance. | Bronze | **Yes** | Hovering any letter of the animated FeeBay logo. Easter egg. |
| `game_reset` | Clean Slate | Wipe your save and start a fresh empire. | Bronze | No | Confirming the Reset button. Granted into the brand-new save. |

## New — Slab bags

A **slab bag** is a new marketplace lot: a graded-card grab bag. Buying one opens
a reveal showing a single random graded card. Bags come in Budget / Standard /
Premium / Whale value ranges, and some are **scam bags** that hide a counterfeit slab.

| API Name | Display Name | Description | Tier | Hidden | How it triggers |
|---|---|---|---|---|---|
| `first_slab_bag` | Bag Secured | Open your first slab bag. | Bronze | No | Buying any slab bag from the marketplace. |
| `slab_bag_10` | Bag Chaser | Open 10 slab bags. | Silver | No | Lifetime count of slab bags opened reaches 10. |
| `scam_bag` | Bagged and Tagged | Get scammed by a counterfeit slab bag. | Silver | **Yes** | Opening a slab bag that resolves to a counterfeit slab. |
| `slab_bag_jackpot` | Jackpot Bag | Pull a Gem 10 slab out of a slab bag. | Gold | **Yes** | A (non-scam) slab bag resolves to a Grade 10 card. |

## New — Selling fakes

Counterfeit cards can be sold off your own storefront like any other card. These
track the shady side of the business.

| API Name | Display Name | Description | Tier | Hidden | How it triggers |
|---|---|---|---|---|---|
| `fake_sale_1` | Caveat Emptor | Sell a fake card off your storefront. | Silver | **Yes** | A fake card sells via one of your player storefront listings. |
| `fake_sale_5` | Forgery Ring | Sell 5 fake cards off your storefront. | Silver | **Yes** | Lifetime count of fake cards sold reaches 5. |
| `fake_sale_100` | Counterfeit Kingpin | Sell 100 fake cards off your storefront. | Gold | **Yes** | Lifetime count of fake cards sold reaches 100. |

## New — Secret dev console

A hidden easter egg. Typing the command **`/cheats`** into the top-bar search box
"breaches" a fake FeeBay developer admin console — a green-on-black hacker terminal
with a tongue-in-cheek boot sequence and a panel of testing cheats (add cash,
unlock every upgrade/marketplace, max reputation & business level, skip the day,
force-unlock all achievements). Built for dev/QA testing; left in as an easter egg.

| API Name | Display Name | Description | Tier | Hidden | How it triggers |
|---|---|---|---|---|---|
| `cheat_breach` | Hack the Planet | Breach the secret FeeBay developer console. | Gold | **Yes** | Typing `/cheats` into the top-bar search box and opening the console. |

## New — Showcase value

Two milestones for the Collection page **Showcase** — the rotating display of
cards the player has favorited. They fire on the live market value of everything
on display (the same total shown on the Showcase panel), so a market pump or a
freshly-added slab can push you over the line.

| API Name | Display Name | Description | Tier | Hidden | How it triggers |
|---|---|---|---|---|---|
| `showcase_value_10k` | Gallery Opening | Display $10,000+ worth of cards on your Collection showcase. | Silver | No | Showcased cards' combined market value reaches $10,000. |
| `showcase_value_100k` | Museum Wing | Display $100,000+ worth of cards on your Collection showcase. | Gold | No | Showcased cards' combined market value reaches $100,000. |

## New — Codex set completion

One **"complete this set"** achievement per codex set, plus the existing 100%
codex achievement. These are **generated from the card roster** in
`src/data/achievements.ts` (`buildSetAchievements`) — if a set is ever added,
its achievement appears automatically (remember to register it in Steamworks).
Reward and tier scale with set size. They fire when you own every card in a set.

- The **100% codex** achievement already exists: `codex_complete` — *Codex
  Mythologist* — "Own every card in the codex at least once." (Mythic, unchanged.)
- The existing `set_completionist` (any one set) and `all_sets` (every set) are
  also unchanged — the per-set achievements below are additive.

| API Name | Display Name | Description | Tier | Hidden | How it triggers |
|---|---|---|---|---|---|
| `set_base_set` | Base Set Curator | Own every card in the Base Set. | Gold | No | Own all 31 cards in Base Set. |
| `set_base_set_1st_edition` | Base Set 1st Edition Curator | Own every card in the Base Set 1st Edition set. | Gold | No | Own all 31 cards in Base Set 1st Edition. |
| `set_lunar_echoes` | Lunar Echoes Curator | Own every card in the Lunar Echoes set. | Bronze | No | Own all 7 cards in Lunar Echoes. |
| `set_glacial_springs` | Glacial Springs Curator | Own every card in the Glacial Springs set. | Gold | No | Own all 30 cards in Glacial Springs. |
| `set_hollow_garden` | Hollow Garden Curator | Own every card in the Hollow Garden set. | Silver | No | Own all 19 cards in Hollow Garden. |
| `set_skyborn_saga` | Skyborn Saga Curator | Own every card in the Skyborn Saga set. | Silver | No | Own all 19 cards in Skyborn Saga. |
| `set_treasure_trove` | Treasure Trove Curator | Own every card in the Treasure Trove set. | Bronze | No | Own all 4 cards in Treasure Trove. |
| `set_packtok_promos` | PackTok Promos Curator | Own every card in the PackTok Promos set. | Silver | No | Own all 15 cards in PackTok Promos. |
| `set_forgotten_realms` | Forgotten Realms Curator | Own every card in the Forgotten Realms set. | Bronze | No | Own all 11 cards in Forgotten Realms. |
| `set_twilight_veil` | Twilight Veil Curator | Own every card in the Twilight Veil set. | Silver | No | Own all 25 cards in Twilight Veil. |
| `set_cosmic_drift` | Cosmic Drift Curator | Own every card in the Cosmic Drift set. | Bronze | No | Own all 8 cards in Cosmic Drift. |
| `set_iron_vanguard` | Iron Vanguard Curator | Own every card in the Iron Vanguard set. | Silver | No | Own all 13 cards in Iron Vanguard. |

---

## Notes for you

- **What you explicitly asked for** is all here: Discord click, Buy Me a Coffee
  click, search-bar use, the logo-hover easter egg, fake-card storefront sales at
  1 / 5 / 100, the new **slab bag** marketplace lot (with scam bags), an open-a-bag
  achievement, the get-scammed achievement, and the reset-the-game achievement.
- **Extras I added** (you said to add any solid ones): `slab_bag_10` (a natural
  progression milestone for slab bags) and `slab_bag_jackpot` (pull a Gem 10 from
  a bag — a satisfying chase target). Cut either if you'd rather keep the count down.
- **Total achievements after this batch: 70** (was 43 → 56 → 70). The latest +14
  are 2 showcase-value milestones and 12 per-set codex achievements.
- **Hidden** column is a Steamworks setting only — the in-game Achievements page
  shows everything regardless. I marked the easter egg, the scam/gotcha ones, and
  the fake-selling line as Hidden so they stay a surprise. Your call to change any.
- Cash rewards (claimed in-game): discord/coffee/reset $50, searched $30, logo $25,
  first_slab_bag $80, slab_bag_10 $350, scam_bag $150, slab_bag_jackpot $800,
  fake_sale_1 $150, fake_sale_5 $400, fake_sale_100 $5,000, cheat_breach $1,337,
  showcase_value_10k $500, showcase_value_100k $3,000.
- **`cheat_breach`** is the `/cheats` easter egg — keep it Hidden on Steamworks
  so players have to find the command. The dev console it opens is testing-only;
  it grants no Steam stats beyond this single unlock.
- **Codex set achievements** are generated from the card roster, so their reward
  and tier scale with set size: `set_base_set` $1,550, `set_base_set_1st_edition`
  $3,000, `set_glacial_springs` $1,500, `set_twilight_veil` $1,250,
  `set_hollow_garden`/`set_skyborn_saga` $950, `set_packtok_promos` $750,
  `set_iron_vanguard` $650, `set_forgotten_realms` $550,
  `set_lunar_echoes`/`set_treasure_trove`/`set_cosmic_drift` $400 each. If you add
  or resize a set, re-run the game once and copy the new values from the in-game
  Achievements page before registering on Steamworks.
