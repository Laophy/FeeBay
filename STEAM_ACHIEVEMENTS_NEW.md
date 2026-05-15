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

---

## Notes for you

- **What you explicitly asked for** is all here: Discord click, Buy Me a Coffee
  click, search-bar use, the logo-hover easter egg, fake-card storefront sales at
  1 / 5 / 100, the new **slab bag** marketplace lot (with scam bags), an open-a-bag
  achievement, the get-scammed achievement, and the reset-the-game achievement.
- **Extras I added** (you said to add any solid ones): `slab_bag_10` (a natural
  progression milestone for slab bags) and `slab_bag_jackpot` (pull a Gem 10 from
  a bag — a satisfying chase target). Cut either if you'd rather keep the count down.
- **Total achievements after this batch: 55** (was 43).
- **Hidden** column is a Steamworks setting only — the in-game Achievements page
  shows everything regardless. I marked the easter egg, the scam/gotcha ones, and
  the fake-selling line as Hidden so they stay a surprise. Your call to change any.
- Cash rewards (claimed in-game): discord/coffee/reset $50, searched $30, logo $25,
  first_slab_bag $80, slab_bag_10 $350, scam_bag $150, slab_bag_jackpot $800,
  fake_sale_1 $150, fake_sale_5 $400, fake_sale_100 $5,000.
