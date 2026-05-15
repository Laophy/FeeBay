import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // Bronze tier — early-game baseline (small rewards; the achievement is the badge, not the bag)
  { id: 'first_flip', name: 'First Flip', description: 'Sell your first item.', icon: 'cash', cashReward: 20, tier: 'bronze' },
  { id: 'first_buy', name: 'First Pickup', description: 'Buy your first listing.', icon: 'cart', cashReward: 10, tier: 'bronze' },
  { id: 'first_grade', name: 'Slabbed Up', description: 'Receive your first graded card.', icon: 'shield', cashReward: 40, tier: 'bronze' },
  { id: 'first_lot', name: 'Rip and Reveal', description: 'Open your first mystery lot or binder.', icon: 'package', cashReward: 30, tier: 'bronze' },
  { id: 'first_storefront_sale', name: 'Open for Business', description: 'Sell something off your own storefront.', icon: 'tag', cashReward: 40, tier: 'bronze' },
  { id: 'first_negotiation', name: 'Wheel and Deal', description: 'Get a seller to accept a lowball offer.', icon: 'tag', cashReward: 60, tier: 'bronze' },
  { id: 'first_convention', name: 'Convention Crawler', description: 'Buy something during a live convention.', icon: 'sparkle', cashReward: 80, tier: 'bronze' },

  // Silver tier — established flipper
  { id: 'hidden_gem', name: 'Hidden Gem', description: 'Make 200%+ profit on one purchase.', icon: 'sparkle', cashReward: 250, tier: 'silver' },
  { id: 'feed_alive', name: "Fee'd Alive", description: 'Pay $1,000 total in seller fees.', icon: 'wallet', cashReward: 250, tier: 'silver' },
  { id: 'bag_holder', name: 'Bag Holder', description: 'Lose 50%+ on a single sale.', icon: 'chart-down', cashReward: 200, tier: 'silver' },
  { id: 'rugged', name: 'Rugged', description: 'Buy a fake. The lesson cost you.', icon: 'shield', cashReward: 250, tier: 'silver' },
  { id: 'mogul_5k', name: 'Mid-Tier Mogul', description: 'Reach $5,000 in cash.', icon: 'wallet', cashReward: 500, tier: 'silver' },
  { id: 'closet_treasure', name: 'Closet Treasure', description: 'Pull a Secret Rare (or rarer) from a mystery lot.', icon: 'package', cashReward: 300, tier: 'silver' },
  { id: 'binder_bandit', name: 'Binder Bandit', description: 'Open 5 mystery lots.', icon: 'package', cashReward: 300, tier: 'silver' },
  { id: 'auctioneer', name: 'Going Once...', description: 'Win your first BidGoblin auction.', icon: 'gavel', cashReward: 300, tier: 'silver' },
  { id: 'bundle_boss', name: 'Bundle Boss', description: 'Sell 10 bundles.', icon: 'box', cashReward: 400, tier: 'silver' },
  { id: 'grading_diversifier', name: 'Three-Slab Diet', description: 'Grade at least one card with ZAG, PZA, and Bucket each.', icon: 'shield', cashReward: 500, tier: 'silver' },
  { id: 'centered', name: 'Perfectly Centered', description: 'Own a card with dead-center centering (0/0 offset).', icon: 'sparkle', cashReward: 300, tier: 'silver' },
  { id: 'crash_course', name: 'Crash Course', description: 'Trigger a supply crash event by mass-selling a tag.', icon: 'chart-down', cashReward: 300, tier: 'silver' },
  { id: 'whale_buy', name: 'Confident Whale', description: 'Pay $1,000+ for a single purchase.', icon: 'cash', cashReward: 400, tier: 'silver' },
  { id: 'pack_rat', name: 'Pack Rat', description: 'Fill your inventory to capacity.', icon: 'inventory', cashReward: 300, tier: 'silver' },
  { id: 'reputation_50', name: 'Local Favorite', description: 'Reach 50 reputation.', icon: 'medal', cashReward: 500, tier: 'silver' },
  { id: 'week_one', name: 'Week One', description: 'Reach day 10.', icon: 'check', cashReward: 500, tier: 'silver' },
  { id: 'storage_first', name: 'Storage Wars', description: 'Crack open your first storage unit.', icon: 'box', cashReward: 500, tier: 'silver' },

  // Gold tier — advanced
  { id: 'gem_mint_goblin', name: 'Gem Mint Goblin', description: 'Receive your first Grade 10.', icon: 'medal', cashReward: 1000, tier: 'gold' },
  { id: 'slab_lord', name: 'Slab Lord', description: 'Own 10 graded cards (lifetime).', icon: 'crown', cashReward: 1500, tier: 'gold' },
  { id: 'set_completionist', name: 'Set Completionist', description: 'Own every card in any one set.', icon: 'trophy', cashReward: 1500, tier: 'gold' },
  { id: 'reputation_100', name: 'Reputation King', description: 'Reach 100 reputation.', icon: 'crown', cashReward: 1500, tier: 'gold' },
  { id: 'auction_vulture', name: 'Auction Vulture', description: 'Win 5 BidGoblin auctions.', icon: 'gavel', cashReward: 1500, tier: 'gold' },
  { id: 'storage_5', name: 'Storage Tycoon', description: 'Crack 5 storage units.', icon: 'box', cashReward: 1500, tier: 'gold' },
  { id: 'mogul_25k', name: 'Marketplace Mogul', description: 'Reach $25,000 net worth.', icon: 'trophy', cashReward: 2500, tier: 'gold' },
  { id: 'all_marketplaces', name: 'Online Everywhere', description: 'Unlock all 6 marketplaces.', icon: 'trends', cashReward: 2000, tier: 'gold' },
  { id: 'storefront_5', name: 'Real Storefront', description: 'Have 5 active player listings at once.', icon: 'tag', cashReward: 1000, tier: 'gold' },

  // Mythic tier — endgame
  { id: 'codex_complete', name: 'Codex Mythologist', description: 'Own every card in the codex at least once.', icon: 'trophy', cashReward: 10000, tier: 'mythic' },
  { id: 'mogul_100k', name: 'Cardboard Tycoon', description: 'Reach $100,000 net worth.', icon: 'crown', cashReward: 10000, tier: 'mythic' },
  { id: 'mogul_1m', name: 'Card Empire', description: 'Reach $1,000,000 net worth.', icon: 'crown', cashReward: 100000, tier: 'mythic' },
  { id: 'triple_gem', name: 'Triple Gem Day', description: 'Receive 3 Gem 10s on a single day.', icon: 'medal', cashReward: 5000, tier: 'mythic' },
  { id: 'marathon_30', name: 'Marathon Flipper', description: 'Reach day 30.', icon: 'check', cashReward: 5000, tier: 'mythic' },
  { id: 'marathon_50', name: 'Lifer', description: 'Reach day 50.', icon: 'check', cashReward: 15000, tier: 'mythic' },
  { id: 'top_pop', name: 'Top Pop', description: 'Own a Gem 10 of every Mythic Rare or Prototype card.', icon: 'crown', cashReward: 50000, tier: 'mythic' },
  { id: 'all_sets', name: 'Set the Set', description: 'Complete every card set.', icon: 'trophy', cashReward: 25000, tier: 'mythic' },
  { id: 'national_reseller', name: 'National Reseller', description: 'Promote to Business Level 5.', icon: 'crown', cashReward: 25000, tier: 'mythic' },
  { id: 'card_empire_level', name: 'Card Empire (Level)', description: 'Promote to the final Business Level: Card Empire.', icon: 'crown', cashReward: 100000, tier: 'mythic' },

  // --- v2 additions: UI / meta, fake-card sales, and slab bags ---
  // UI / meta (unlocked by clicking around the app)
  { id: 'discord_click', name: 'Drop the Discord', description: 'Click the Join Our Discord button.', icon: 'discord', cashReward: 50, tier: 'bronze' },
  { id: 'coffee_click', name: 'Caffeine Sponsor', description: 'Click the Buy Me a Coffee button.', icon: 'coffee', cashReward: 50, tier: 'bronze' },
  { id: 'searched', name: 'Search Party', description: 'Type something into the FeeBay search bar.', icon: 'search', cashReward: 30, tier: 'bronze' },
  { id: 'logo_hover', name: 'Logo Botherer', description: 'Hover the FeeBay logo and make it dance.', icon: 'sparkle', cashReward: 25, tier: 'bronze' },
  { id: 'game_reset', name: 'Clean Slate', description: 'Wipe your save and start a fresh empire.', icon: 'reset', cashReward: 50, tier: 'bronze' },

  // Slab bags — a graded-card grab bag from the marketplace
  { id: 'first_slab_bag', name: 'Bag Secured', description: 'Open your first slab bag.', icon: 'package', cashReward: 80, tier: 'bronze' },
  { id: 'slab_bag_10', name: 'Bag Chaser', description: 'Open 10 slab bags.', icon: 'package', cashReward: 350, tier: 'silver' },
  { id: 'scam_bag', name: 'Bagged and Tagged', description: 'Get scammed by a counterfeit slab bag.', icon: 'shield', cashReward: 150, tier: 'silver' },
  { id: 'slab_bag_jackpot', name: 'Jackpot Bag', description: 'Pull a Gem 10 slab out of a slab bag.', icon: 'medal', cashReward: 800, tier: 'gold' },

  // Selling fakes off your own storefront — the shady side of the business
  { id: 'fake_sale_1', name: 'Caveat Emptor', description: 'Sell a fake card off your storefront.', icon: 'shield', cashReward: 150, tier: 'silver' },
  { id: 'fake_sale_5', name: 'Forgery Ring', description: 'Sell 5 fake cards off your storefront.', icon: 'shield', cashReward: 400, tier: 'silver' },
  { id: 'fake_sale_100', name: 'Counterfeit Kingpin', description: 'Sell 100 fake cards off your storefront.', icon: 'shield', cashReward: 5000, tier: 'gold' },
];
