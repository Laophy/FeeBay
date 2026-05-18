import { useState } from 'react';
import { Icon } from './Icon';
import type { Route } from '../App';

const HELP: Record<Route, { title: string; body: (string | JSX.Element)[] }> = {
  dashboard: {
    title: 'Dashboard',
    body: [
      'Your HQ. Net worth chart, recent flips, market events, and quick-actions for every part of the game.',
      'Tip: watch the cash card — it pops a +$X / -$X chip whenever cash changes.',
    ],
  },
  marketplace: {
    title: 'Marketplace',
    body: [
      'Browse parody platforms. Each refresh seeds 12 listings, some great, most fair, a few traps.',
      'Inspect a listing to see seller flavor and (if you own Magnifying Glass) centering lean.',
      'On Headbook and JaredsList you can make offers below the asking price.',
      'Watch for purple "Storage Unit" tiles on JaredsList — they crack into 15–35 random cards.',
      'Refresh has a 20s cooldown (10s with Deal Bot 9000).',
    ],
  },
  inventory: {
    title: 'Inventory',
    body: [
      'Everything you own. Sort by recent/value/profit/rarity/condition. Filter by status.',
      'Click any card to open its detail view (stats, history, live market drift, watch toggle).',
      '"Sell on X" instant-sells at ~95% value minus that marketplace\'s fees.',
      '"List @ price" puts it on your storefront at a price of your choosing.',
      '"Grade @ X" submits to the chosen grading company.',
      'Bundle mode: select 2+ raw cards to bundle them into a single sale (one fee, 90% of summed value).',
      'Watch the Market pill — it flashes when noise re-rolls.',
    ],
  },
  storefront: {
    title: 'Your Storefront',
    body: [
      'Cards you\'ve listed at chosen prices. Buyers nibble probabilistically each tick.',
      'Listings auto-expire after 8 game minutes and return to your inventory.',
      'List near ref value for steady sales, above for jackpots, below for fast clears.',
      'Delist at any time to pull a card back.',
    ],
  },
  grading: {
    title: 'Grading',
    body: [
      'Three companies, different tradeoffs:',
      <ul key="g" className="list-disc pl-5 text-ink-700 text-sm space-y-1">
        <li>
          <span className="font-semibold">ZAG</span> — cheap, fast, 0.9× resale.
        </li>
        <li>
          <span className="font-semibold">PZA</span> — pricey, slow, 1.2× resale, premium feel.
        </li>
        <li>
          <span className="font-semibold">Bucket</span> — cheap chaos, 0.85×, 35% chance of upset.
        </li>
      </ul>,
      'Grades combine surface (condition) + centering. A Gem Mint Candidate with perfect centering at PZA is the dream.',
    ],
  },
  trends: {
    title: 'Market Trends',
    body: [
      'Active and historic macro events. Each pumps or dumps cards with matching tags.',
      'Selling 5+ cards of the same tag within 90 seconds will trigger a Supply Crash event — be careful with floods.',
      'Conventions occasionally appear and pump specific tags by ~40-50% for 5 minutes.',
    ],
  },
  auctions: {
    title: 'BidGoblin',
    body: [
      'Live auctions with rival bidders. Click "Bid $X" to claim the lead.',
      'Auctions ending in <10s pulse red — get in fast or miss out.',
      'Auto-Sniper upgrade lets you set a max-bid; it snipes for you in the final 6s.',
      'Buyout option (when available) skips the auction entirely at a premium price.',
    ],
  },
  employees: {
    title: 'Employees',
    body: [
      'Your automation workforce, unlocked at Business Level 2. Headcount cap grows with your business level (1 → 5 → 10 and beyond).',
      'Scouts auto-buy underpriced singles; Flippers sell that stock for profit; Promoters build reputation; Managers speed up the whole team and cut mistakes.',
      'Each employee works in timed cycles — watch the progress bar. Tap History on a card for their flip-by-flip log.',
      'Employees occasionally slip up — a damaged card, a fake bought — and it costs you cash. Higher-tier staff and Managers make that rarer.',
    ],
  },
  shop: {
    title: 'Card Shop',
    body: [
      'Your physical shop. Put cards in the display cases and walk-in customers buy them at a retail markup — no marketplace fees.',
      'Upgrade your premises (Kitchen Table → Card Empire HQ) for more display slots, more foot traffic, and a fatter markup.',
      'Displayed cards sell on their own over time, so keep the cases stocked with your best inventory.',
    ],
  },
  upgrades: {
    title: 'Upgrades',
    body: [
      'Permanent improvements. Unlock new marketplaces, grading companies, the auction floor, value-range filters, fake risk detection, etc.',
      'Storage Shelves +20 inventory slots. Auto-Lister cuts selling fees by 25%.',
    ],
  },
  collection: {
    title: 'Collection Codex',
    body: [
      'Every fictional card grouped by set. Tracks lifetime totals and your best grade per card.',
      'Click any card thumbnail to open its detail view, even unowned ones.',
      'Hit 100% on a set for collector pride. Closet Treasure achievement pings when you pull a Secret Rare or rarer from a lot.',
    ],
  },
  stats: {
    title: 'Stats & Milestones',
    body: [
      'Lifetime numbers, net worth over time, reputation progress.',
      'Marketplace milestones show which ones you\'ve unlocked and what\'s next.',
      'Grade distribution shows how many of each grade you\'ve received.',
    ],
  },
  achievements: {
    title: 'Achievements',
    body: [
      'Twelve achievements across flipping, grading, lots, auctions, and pure-vibes goals.',
      'They unlock automatically when the trigger fires.',
    ],
  },
};

export function HelpButton({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const entry = HELP[route];
  if (!entry) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-line hover:border-ink-400 text-ink-700"
        title="What is this screen?"
      >
        <Icon name="eye" size={14} /> Help
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[min(560px,95vw)] max-h-[85vh] overflow-y-auto rounded-xl border border-line bg-white p-5 shadow-2xl animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs uppercase tracking-widest text-feebay-600">How this works</div>
            <h2 className="mt-1 text-xl font-bold">{entry.title}</h2>
            <div className="mt-3 space-y-2 text-sm text-ink-800">
              {entry.body.map((b, i) =>
                typeof b === 'string' ? <p key={i}>{b}</p> : <div key={i}>{b}</div>,
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded bg-feebay-500 hover:bg-feebay-600 text-white py-2 text-sm font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
