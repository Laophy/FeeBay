import { useEffect, useMemo, useState } from 'react';
import { refreshCooldownMs, useGameStore } from '../../store/useGameStore';
import type { MarketplaceListing, MarketplaceSource } from '../../types';
import { MARKETPLACES, getMarketplace } from '../../data/marketplaces';
import { getCardById } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { Icon } from '../../components/Icon';
import { centeringLabel, centeringLean } from '../../game/centering';
import { isNegotiableListing } from '../../game/negotiation';

export function Marketplace() {
  const listings = useGameStore((s) => s.listings);
  const refresh = useGameStore((s) => s.refreshListings);
  const buy = useGameStore((s) => s.buyListing);
  const cash = useGameStore((s) => s.cash);
  const unlocked = useGameStore((s) => s.marketplacesUnlocked);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const lastRefresh = useGameStore((s) => s.lastListingRefresh);
  const cooldown = refreshCooldownMs({ upgradesPurchased: upgrades });

  const activeSource = useGameStore((s) => s.ui.marketplaceActiveSource);
  const setActiveSource = useGameStore((s) => s.setMarketplaceActiveSource);
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const cooldownRemaining = Math.max(0, lastRefresh + cooldown - now);
  const canRefresh = cooldownRemaining === 0;

  const filtered = useMemo(() => {
    if (activeSource === 'all') return listings;
    return listings.filter((l) => l.source === activeSource);
  }, [listings, activeSource]);

  const showRange = upgrades.includes('basic_filters');
  const showFakeRisk = upgrades.includes('fake_detector') || upgrades.includes('show_all_hidden');
  const hasDealBot = upgrades.includes('deal_bot') || upgrades.includes('deal_bot_pro');
  const hasDealBotPro = upgrades.includes('deal_bot_pro');
  const showCenteringDetail =
    upgrades.includes('magnifying_glass') || upgrades.includes('power_filters');

  // Deal Bot locks its picks at refresh time. Buying a pick doesn't immediately surface
  // a new one — the bot is "out scanning" until the next feed refresh.
  const [lockedDealIds, setLockedDealIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!hasDealBot) {
      setLockedDealIds(new Set());
      return;
    }
    const MIN_UPSIDE_PCT = hasDealBotPro ? 0.25 : 0.35;
    const MIN_TRUE_VALUE = 15;
    const candidates = listings
      .filter((l) => !l.isFake)
      .filter((l) => l.scamRisk < 0.3)
      .filter((l) => l.trueMarketValue >= MIN_TRUE_VALUE)
      .map((l) => ({
        id: l.id,
        upside: (l.trueMarketValue - l.askingPrice) / Math.max(1, l.askingPrice),
      }))
      .filter((s) => s.upside >= MIN_UPSIDE_PCT)
      .sort((a, b) => b.upside - a.upside);
    const maxCount = hasDealBotPro ? 3 : 1;
    setLockedDealIds(new Set(candidates.slice(0, maxCount).map((s) => s.id)));
    // Recompute only when the feed itself refreshes — not on every listing change
    // (which fires when you buy something).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRefresh, hasDealBot, hasDealBotPro]);

  const highlightedDealIds = useMemo<Set<string>>(() => {
    if (lockedDealIds.size === 0) return new Set();
    const currentIds = new Set(filtered.map((l) => l.id));
    return new Set([...lockedDealIds].filter((id) => currentIds.has(id)));
  }, [lockedDealIds, filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-slate-400 text-sm">
            Browse parody platforms. Spot the steals. Avoid the scams. Pay the fees later.
          </p>
        </div>
        <button
          disabled={!canRefresh}
          onClick={() => refresh()}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold ${
            canRefresh
              ? 'bg-feebay-600 hover:bg-feebay-500 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Icon name="refresh" size={16} />
          {canRefresh ? 'Refresh feed' : `${Math.ceil(cooldownRemaining / 1000)}s`}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Tab active={activeSource === 'all'} onClick={() => setActiveSource('all')}>
          All ({listings.length})
        </Tab>
        {MARKETPLACES.map((m) => {
          const isUnlocked = unlocked.includes(m.id);
          const count = listings.filter((l) => l.source === m.id).length;
          return (
            <Tab
              key={m.id}
              active={activeSource === m.id}
              disabled={!isUnlocked}
              onClick={() => isUnlocked && setActiveSource(m.id)}
            >
              <span className="flex items-center gap-1.5">
                {m.id}
                {isUnlocked ? (
                  <span>({count})</span>
                ) : (
                  <Icon name="lock" size={12} className="text-slate-500" />
                )}
              </span>
            </Tab>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded border border-dashed border-slate-700 p-10 text-center text-slate-400">
          No listings here. Try refreshing or another tab.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              showRange={showRange}
              showFakeRisk={showFakeRisk}
              showCenteringDetail={showCenteringDetail}
              highlighted={highlightedDealIds.has(l.id)}
              canAfford={cash >= l.askingPrice}
              onBuy={() => buy(l.id)}
              onInspect={() => setSelected(l)}
            />
          ))}
        </div>
      )}

      {selected && (
        <ListingDetailModal
          listing={selected}
          onClose={() => setSelected(null)}
          onBuy={() => {
            buy(selected.id);
            setSelected(null);
          }}
          canAfford={cash >= selected.askingPrice}
          showRange={showRange}
          showFakeRisk={showFakeRisk}
          showCenteringDetail={showCenteringDetail}
        />
      )}
    </div>
  );
}

function Tab({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-md text-xs border transition ${
        disabled
          ? 'border-slate-800 text-slate-600 cursor-not-allowed'
          : active
          ? 'border-feebay-500 bg-feebay-700/40 text-feebay-100'
          : 'border-slate-700 text-slate-300 hover:border-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function ListingCard({
  listing,
  showRange,
  showFakeRisk,
  showCenteringDetail,
  highlighted,
  canAfford,
  onBuy,
  onInspect,
}: {
  listing: MarketplaceListing;
  showRange: boolean;
  showFakeRisk: boolean;
  showCenteringDetail: boolean;
  highlighted: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onInspect: () => void;
}) {
  const card = getCardById(listing.cardId);
  const accent = getMarketplace(listing.source).accent;
  const isLot = listing.lotType === 'mystery_lot' || listing.lotType === 'binder';
  const isStorage = listing.lotType === 'storage_unit';
  const isSlab = listing.lotType === 'slab';
  return (
    <div
      className={`rounded-lg border bg-slate-900/60 flex flex-col overflow-hidden ${
        highlighted ? 'border-amber-400 shadow-lg shadow-amber-400/30' : 'border-slate-800'
      }`}
    >
      {/* Hero art area — card is the focal point */}
      <div
        className={`relative flex items-center justify-center px-4 pt-5 pb-3 ${
          isStorage
            ? 'bg-gradient-to-b from-purple-950/40 to-slate-900/0'
            : isLot
            ? 'bg-gradient-to-b from-amber-900/30 to-slate-900/0'
            : isSlab
            ? 'bg-gradient-to-b from-slate-800/60 to-slate-900/0'
            : 'bg-gradient-to-b from-slate-800/40 to-slate-900/0'
        }`}
      >
        {/* Source chip floating top-left */}
        <span
          className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] text-white font-semibold ${accent}`}
        >
          {listing.source}
        </span>
        {/* Lot/slab/source tag floating top-right */}
        <span className="absolute top-2 right-2 text-[10px] text-slate-400 uppercase tracking-wider">
          {listing.lotType.replace('_', ' ')}
          {isLot && listing.lotSize ? ` • ${listing.lotSize}` : ''}
        </span>
        {highlighted && (
          <div className="absolute top-9 left-2 text-[10px] uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-1">
            <Icon name="sparkle" size={11} /> Deal Bot pick
          </div>
        )}
        {/* Big card art */}
        <div className="transform transition hover:scale-[1.04]">
          {isStorage ? (
            <BigStorageUnitArt />
          ) : isLot ? (
            <BigMysteryArt count={listing.lotSize ?? 3} />
          ) : (
            <CardArt
              name={card.name}
              rarity={listing.rarity}
              hue={card.hue}
              cardId={listing.cardId}
              grade={listing.grade}
              gradingCompany={listing.gradingCompany}
              centeringOffsetX={listing.centeringOffsetX}
              centeringOffsetY={listing.centeringOffsetY}
            />
          )}
        </div>
      </div>

      {/* Info pane */}
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
        <div>
          <div className="font-semibold text-sm leading-tight truncate">{listing.title}</div>
          <div className="text-[11px] text-slate-400 truncate">
            @{listing.sellerName}
            <span className="text-slate-600"> • </span>
            <span className="text-slate-300">{listing.rarity}</span>
            {!isLot && !isStorage && !isSlab && (
              <>
                <span className="text-slate-600"> • </span>
                <span className="text-slate-400">{listing.rawCondition}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Pill label="Asking" value={`$${listing.askingPrice}`} accent="text-emerald-300" />
          {showRange ? (
            <Pill
              label="Est. value"
              value={`$${listing.estimatedValueMin}–$${listing.estimatedValueMax}`}
              accent="text-feebay-300"
            />
          ) : (
            <Pill label="Est. value" value="???" accent="text-slate-500" />
          )}
        </div>

        {/* Risk + timer micro-row */}
        <div className="flex items-center justify-between text-[10px]">
          {showFakeRisk ? (
            <span
              className={
                listing.fakeRisk > 0.4
                  ? 'text-rose-400'
                  : listing.fakeRisk > 0.15
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }
            >
              Fake risk: {(listing.fakeRisk * 100).toFixed(0)}%
            </span>
          ) : (
            <span className="text-slate-500">Fake risk: ???</span>
          )}
          {!isLot && !isStorage && !isSlab && showCenteringDetail && (
            <span
              className={
                Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 3
                  ? 'text-emerald-400'
                  : Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 7
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }
            >
              {centeringLabel(listing.centeringOffsetX, listing.centeringOffsetY)}
              {centeringLean(listing.centeringOffsetX, listing.centeringOffsetY)
                ? `, ${centeringLean(listing.centeringOffsetX, listing.centeringOffsetY)}`
                : ''}
            </span>
          )}
          <span className="text-slate-500">{Math.max(0, listing.timeRemainingSeconds)}s</span>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={onInspect}
            className="flex-1 rounded border border-slate-700 hover:border-slate-500 py-1.5 text-xs"
          >
            Inspect
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-[1.5] rounded py-1.5 text-xs font-semibold ${
              canAfford
                ? 'bg-feebay-600 hover:bg-feebay-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Buy ${listing.askingPrice}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded bg-slate-800/70 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-xs font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function MysteryArt({ count }: { count: number }) {
  return (
    <div className="relative h-24 w-16">
      <div className="absolute inset-0 rounded-md border-2 border-amber-400/70 bg-gradient-to-br from-amber-600 via-orange-700 to-red-900 shadow-lg shadow-amber-500/30 flex flex-col items-center justify-center text-white">
        <Icon name="package" size={28} />
        <div className="text-[9px] uppercase tracking-widest mt-1">Lot</div>
        <div className="text-[10px] font-bold">×{count}</div>
      </div>
    </div>
  );
}

function BigMysteryArt({ count }: { count: number }) {
  return (
    <div className="relative h-40 w-28">
      <div className="absolute inset-0 rounded-md border-2 border-amber-400/70 bg-gradient-to-br from-amber-600 via-orange-700 to-red-900 shadow-xl shadow-amber-500/30 flex flex-col items-center justify-center text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)',
          }}
        />
        <Icon name="package" size={56} className="drop-shadow-lg" />
        <div className="text-[11px] uppercase tracking-widest mt-2 font-semibold drop-shadow">
          Mystery Lot
        </div>
        <div className="text-2xl font-black mt-1 drop-shadow">×{count}</div>
        <div className="text-[9px] uppercase tracking-widest mt-1 text-amber-200">
          could be treasure
        </div>
      </div>
    </div>
  );
}

function StorageUnitArt() {
  return (
    <div className="relative h-24 w-16">
      <div className="absolute inset-0 rounded-md border-2 border-purple-400/70 bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 shadow-lg shadow-purple-500/40 flex flex-col items-center justify-center text-white">
        <Icon name="box" size={26} />
        <div className="text-[9px] uppercase tracking-widest mt-1">Storage</div>
        <div className="text-[9px] uppercase tracking-widest">Unit</div>
      </div>
    </div>
  );
}

function BigStorageUnitArt() {
  return (
    <div className="relative h-40 w-28">
      <div className="absolute inset-0 rounded-md border-2 border-purple-400/70 bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 shadow-xl shadow-purple-500/40 flex flex-col items-center justify-center text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)',
          }}
        />
        <Icon name="box" size={56} className="drop-shadow-lg" />
        <div className="text-[11px] uppercase tracking-widest mt-2 font-semibold drop-shadow">
          Storage Unit
        </div>
        <div className="text-[9px] uppercase tracking-widest mt-1 text-purple-200">
          15–35 cards inside
        </div>
      </div>
    </div>
  );
}

function ListingDetailModal({
  listing,
  onClose,
  onBuy,
  canAfford,
  showRange,
  showFakeRisk,
  showCenteringDetail,
}: {
  listing: MarketplaceListing;
  onClose: () => void;
  onBuy: () => void;
  canAfford: boolean;
  showRange: boolean;
  showFakeRisk: boolean;
  showCenteringDetail: boolean;
}) {
  const card = getCardById(listing.cardId);
  const mkt = getMarketplace(listing.source);
  const isMystery = listing.lotType === 'mystery_lot' || listing.lotType === 'binder';
  const isStorage = listing.lotType === 'storage_unit';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-[480px] max-w-full rounded-xl border border-slate-700 bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {isStorage ? (
            <StorageUnitArt />
          ) : isMystery ? (
            <MysteryArt count={listing.lotSize ?? 3} />
          ) : (
            <CardArt
              name={card.name}
              rarity={listing.rarity}
              hue={card.hue}
              cardId={listing.cardId}
              grade={listing.grade}
              gradingCompany={listing.gradingCompany}
              centeringOffsetX={listing.centeringOffsetX}
              centeringOffsetY={listing.centeringOffsetY}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400">{mkt.id} • {listing.lotType.replace('_', ' ')}</div>
            <div className="text-lg font-semibold mt-1">{listing.title}</div>
            <div className="text-xs text-slate-400">Seller: @{listing.sellerName}</div>
            <div className="text-sm text-slate-200 mt-2">{listing.description}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <Pill label="Asking" value={`$${listing.askingPrice}`} accent="text-emerald-300" />
          <Pill
            label="Est. value"
            value={showRange ? `$${listing.estimatedValueMin}–$${listing.estimatedValueMax}` : '???'}
            accent="text-feebay-300"
          />
          <Pill label="Condition" value={listing.rawCondition} accent="text-slate-200" />
          <Pill label="Hint" value={listing.conditionHint} accent="text-slate-300" />
          <Pill label="Rarity" value={listing.rarity} accent="text-amber-300" />
          <Pill
            label="Fake risk"
            value={showFakeRisk ? `${(listing.fakeRisk * 100).toFixed(0)}%` : '???'}
            accent={
              showFakeRisk && listing.fakeRisk > 0.4 ? 'text-rose-300' : 'text-slate-200'
            }
          />
          {listing.lotType !== 'mystery_lot' && listing.lotType !== 'binder' && listing.lotType !== 'storage_unit' && (
            <Pill
              label="Centering"
              value={
                showCenteringDetail
                  ? `${centeringLabel(listing.centeringOffsetX, listing.centeringOffsetY)}${
                      centeringLean(listing.centeringOffsetX, listing.centeringOffsetY)
                        ? `, ${centeringLean(listing.centeringOffsetX, listing.centeringOffsetY)}`
                        : ''
                    }`
                  : centeringLabel(listing.centeringOffsetX, listing.centeringOffsetY)
              }
              accent={
                Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 3
                  ? 'text-emerald-300'
                  : Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 7
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }
            />
          )}
        </div>
        <div className="text-xs text-slate-500 mt-3">{mkt.tagline}</div>

        {isNegotiableListing(listing) && !isMystery && !isStorage && (
          <NegotiationBlock listing={listing} />
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded border border-slate-700 hover:border-slate-500 py-2 text-sm"
          >
            Pass
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-1 rounded py-2 text-sm font-semibold ${
              canAfford
                ? 'bg-feebay-600 hover:bg-feebay-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Buy for ${listing.askingPrice}
          </button>
        </div>
      </div>
    </div>
  );
}

function NegotiationBlock({ listing }: { listing: MarketplaceListing }) {
  const negotiate = useGameStore((s) => s.negotiate);
  const [offer, setOffer] = useState(() => Math.max(1, Math.round(listing.askingPrice * 0.6)));
  const [history, setHistory] = useState<
    { kind: 'accept' | 'counter' | 'reject'; flavor: string; price?: number }[]
  >([]);
  // Sync offer cap with the listing's current asking price (in case of counter)
  useEffect(() => {
    if (offer > listing.askingPrice) setOffer(listing.askingPrice);
  }, [listing.askingPrice]);

  function send() {
    const out = negotiate(listing.id, offer);
    if (out) {
      setHistory((prev) => [...prev, out].slice(-5));
    }
  }

  return (
    <div className="mt-3 rounded border border-amber-500/40 bg-amber-900/15 p-3 space-y-2">
      <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
        Make an offer
      </div>
      <input
        type="range"
        min={1}
        max={Math.max(1, listing.askingPrice)}
        value={offer}
        onChange={(e) => setOffer(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">
          Offer: <span className="font-semibold text-amber-200">${offer}</span>
          <span className="text-slate-500"> / ${listing.askingPrice} ask</span>
        </span>
        <button
          onClick={send}
          className="rounded bg-amber-600 hover:bg-amber-500 px-3 py-1 text-xs font-semibold"
        >
          Send offer
        </button>
      </div>
      {history.length > 0 && (
        <ul className="space-y-1 mt-1 text-[11px] max-h-24 overflow-y-auto">
          {history.map((h, i) => (
            <li
              key={i}
              className={
                h.kind === 'accept'
                  ? 'text-emerald-200'
                  : h.kind === 'counter'
                  ? 'text-amber-200'
                  : 'text-rose-200'
              }
            >
              <span className="uppercase font-semibold mr-1">{h.kind}</span>
              {h.flavor} {h.price ? `($${h.price})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
