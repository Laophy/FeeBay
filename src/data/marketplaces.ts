import type { MarketplaceSource } from '../types';

export type MarketplaceDef = {
  id: MarketplaceSource;
  tagline: string;
  description: string;
  sellerFeePct: number;
  paymentFeePct: number;
  flatFee: number;
  unlockReputation: number;
  vibe: string;
  accent: string;
};

export const MARKETPLACES: MarketplaceDef[] = [
  {
    id: 'FeeBay',
    tagline: 'Auctions and listings. Fees included whether you like it or not.',
    description: 'Best for singles, slabs, sniped deals. Famously ridiculous fees.',
    sellerFeePct: 0.13,
    paymentFeePct: 0.03,
    flatFee: 0.3,
    unlockReputation: 0,
    vibe: 'auction',
    accent: 'bg-feebay-600',
  },
  {
    id: 'Headbook Marketplace',
    tagline: 'Your neighbor is selling a binder. Get there first.',
    description: 'Local listings. Sellers often have no idea what they have. Mystery binders galore.',
    sellerFeePct: 0.03,
    paymentFeePct: 0,
    flatFee: 0,
    unlockReputation: 5,
    vibe: 'local',
    accent: 'bg-blue-700',
  },
  {
    id: 'JaredsList',
    tagline: 'Card collections. Storage units. Pickup behind the gas station.',
    description: 'Weird listings, suspicious meetups, occasional gold. No fees, no protections.',
    sellerFeePct: 0,
    paymentFeePct: 0,
    flatFee: 0,
    unlockReputation: 15,
    vibe: 'sketchy',
    accent: 'bg-amber-700',
  },
  {
    id: 'PackTok Shop',
    tagline: 'Influencers say BUY. Then they say SELL. Then they say BUY again.',
    description: 'Hype-driven. Prices swing wildly. Errors and promos go nuclear.',
    sellerFeePct: 0.08,
    paymentFeePct: 0.02,
    flatFee: 0,
    unlockReputation: 30,
    vibe: 'hype',
    accent: 'bg-pink-700',
  },
  {
    id: 'SlabHub',
    tagline: 'For the suit-wearing slab collector.',
    description: 'Graded cards only. High floors, tighter spreads, premium clientele.',
    sellerFeePct: 0.1,
    paymentFeePct: 0.025,
    flatFee: 1,
    unlockReputation: 60,
    vibe: 'premium',
    accent: 'bg-emerald-700',
  },
  {
    id: 'BidGoblin',
    tagline: 'The auction goblin is watching. Bid wisely.',
    description: 'Timed auctions, bidding wars, sniping. (Browsable only in MVP.)',
    sellerFeePct: 0.15,
    paymentFeePct: 0.03,
    flatFee: 0.5,
    unlockReputation: 100,
    vibe: 'goblin',
    accent: 'bg-purple-700',
  },
  {
    id: 'VaultDealer',
    tagline: 'Members only. Mythic and Prototype slabs change hands here.',
    description: 'Invitation-only. Only Mythic Rare and Prototype slabs ever appear. Bring serious money.',
    sellerFeePct: 0.06,
    paymentFeePct: 0.02,
    flatFee: 5,
    unlockReputation: 150,
    vibe: 'vault',
    accent: 'bg-ink-900',
  },
];

export function getMarketplace(id: MarketplaceSource): MarketplaceDef {
  const m = MARKETPLACES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown marketplace: ${id}`);
  return m;
}
