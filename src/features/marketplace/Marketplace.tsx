import { useEffect, useMemo, useState } from 'react';
import { refreshCooldownMs, useGameStore } from '../../store/useGameStore';
import type { MarketplaceListing, MarketplaceSource } from '../../types';
import { MARKETPLACES, getMarketplace } from '../../data/marketplaces';
import { getCardById } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { Icon } from '../../components/Icon';
import { centeringLabel, centeringLean } from '../../game/centering';
import { isNegotiableListing } from '../../game/negotiation';
import { CardZoomOverlay } from '../../components/CardZoomOverlay';
import { money } from '../../game/format';

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
    <div className="flex gap-5">
      {/* Left filter rail */}
      <aside className="w-56 shrink-0 space-y-3">
        <div className="rounded-xl border border-line bg-white shadow-card p-3 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-bold">
            Marketplaces
          </div>
          <div className="space-y-1">
            <RailItem
              active={activeSource === 'all'}
              onClick={() => setActiveSource('all')}
              count={listings.length}
              label="All marketplaces"
            />
            {MARKETPLACES.map((m) => {
              const isUnlocked = unlocked.includes(m.id);
              const count = listings.filter((l) => l.source === m.id).length;
              return (
                <RailItem
                  key={m.id}
                  active={activeSource === m.id}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setActiveSource(m.id)}
                  count={isUnlocked ? count : undefined}
                  label={m.id}
                  locked={!isUnlocked}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white shadow-card p-3 space-y-2 text-xs">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-bold">
            Active perks
          </div>
          <PerkRow label="Estimated value range" on={showRange} />
          <PerkRow label="Fake risk %" on={showFakeRisk} />
          <PerkRow label="Centering detail" on={showCenteringDetail} />
          <PerkRow label="Deal Bot picks" on={hasDealBot} />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink-900">
              {activeSource === 'all' ? 'All listings' : activeSource}
            </h1>
            <p className="text-ink-500 text-sm">
              {filtered.length} active listing{filtered.length === 1 ? '' : 's'}
              {highlightedDealIds.size > 0 && (
                <>
                  <span className="text-ink-400 mx-2">•</span>
                  <span className="text-ebayYellow-600 font-bold">
                    {highlightedDealIds.size} Deal Bot pick
                    {highlightedDealIds.size === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            disabled={!canRefresh}
            onClick={() => refresh()}
            className={`flex items-center gap-2 rounded-md px-4 h-10 text-sm font-bold ${
              canRefresh
                ? 'bg-feebay-500 hover:bg-feebay-600 text-white shadow-md shadow-feebay-700/20'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            }`}
          >
            <Icon name="refresh" size={16} />
            {canRefresh ? 'Refresh feed' : `Cooldown ${Math.ceil(cooldownRemaining / 1000)}s`}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-ink-500 bg-white">
            No listings here. Try refreshing or another marketplace.
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
      </div>

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

function RailItem({
  active,
  disabled,
  onClick,
  count,
  label,
  locked,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  count?: number;
  label: string;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition ${
        disabled
          ? 'text-ink-400 cursor-not-allowed'
          : active
          ? 'bg-feebay-50 text-feebay-700 font-semibold'
          : 'text-ink-700 hover:bg-ink-100'
      }`}
    >
      <span className="flex-1 text-left truncate">{label}</span>
      {locked ? (
        <Icon name="lock" size={11} className="text-ink-400" />
      ) : count !== undefined ? (
        <span
          className={`text-[10px] px-1.5 rounded font-bold ${
            active ? 'bg-feebay-500 text-white' : 'bg-ink-100 text-ink-600'
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function PerkRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-700">{label}</span>
      <span
        className={`text-[10px] uppercase tracking-widest font-bold ${
          on ? 'text-ebayGreen-600' : 'text-ink-400'
        }`}
      >
        {on ? 'On' : 'Off'}
      </span>
    </div>
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
  const isSlabBag = listing.lotType === 'slab_bag';
  return (
    <div
      className={`rounded-xl border bg-white flex flex-col overflow-hidden shadow-card hover:shadow-cardHover transition ${
        highlighted ? 'border-ebayYellow-500 ring-1 ring-ebayYellow-500/50' : 'border-line'
      }`}
    >
      {/* Hero art area — card is the focal point */}
      <div
        className={`relative flex items-center justify-center px-4 pt-5 pb-3 ${
          isStorage
            ? 'bg-gradient-to-b from-feebay-50 to-white'
            : isSlabBag
            ? 'bg-gradient-to-b from-cyan-500/10 to-white'
            : isLot
            ? 'bg-gradient-to-b from-ebayYellow-500/10 to-white'
            : 'bg-gradient-to-b from-ink-100 to-white'
        }`}
      >
        {/* Source chip floating top-left */}
        <span
          className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] text-white font-bold ${accent}`}
        >
          {listing.source}
        </span>
        {/* Lot/slab/source tag floating top-right */}
        <span className="absolute top-2 right-2 text-[10px] text-ink-500 uppercase tracking-wider font-semibold">
          {listing.lotType.replace('_', ' ')}
          {isLot && listing.lotSize ? ` • ${listing.lotSize}` : ''}
        </span>
        {highlighted && (
          <div className="absolute top-9 left-2 text-[10px] uppercase tracking-widest text-ebayYellow-700 font-bold flex items-center gap-1 bg-ebayYellow-500/20 px-1.5 py-0.5 rounded">
            <Icon name="sparkle" size={11} /> Deal Bot pick
          </div>
        )}
        {/* Big card art */}
        <div className="transform transition hover:scale-[1.04]">
          {isStorage ? (
            <BigStorageUnitArt />
          ) : isSlabBag ? (
            <BigSlabBagArt />
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
      <div className="px-3 pb-3 pt-2 flex flex-col gap-2 border-t border-lineSoft">
        <div>
          <div className="font-bold text-sm leading-tight truncate text-feebay-700 hover:underline cursor-pointer" onClick={onInspect}>
            {listing.title}
          </div>
          <div className="text-[11px] text-ink-500 truncate">
            @{listing.sellerName}
            <span className="text-ink-300"> • </span>
            <span className="text-ink-700">{listing.rarity}</span>
            {!isLot && !isStorage && !isSlab && !isSlabBag && (
              <>
                <span className="text-ink-300"> • </span>
                <span className="text-ink-500">{listing.rawCondition}</span>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="text-2xl font-black text-ink-900 leading-none">
            {money(listing.askingPrice)}
          </div>
          <div className="text-[11px] text-ink-500 mt-1">
            est value{' '}
            {showRange ? (
              <span className="font-bold text-ebayGreen-700">
                {money(listing.estimatedValueMin)}–{money(listing.estimatedValueMax)}
              </span>
            ) : (
              <span
                className="font-semibold text-ink-400"
                title="Buy Basic Search Filters to reveal est value range"
              >
                ???
              </span>
            )}
          </div>
        </div>

        {/* Risk + timer micro-row */}
        <div className="flex items-center justify-between text-[10px]">
          {showFakeRisk ? (
            <span
              className={
                listing.fakeRisk > 0.4
                  ? 'text-ebayRed-500 font-semibold'
                  : listing.fakeRisk > 0.15
                  ? 'text-ebayYellow-700 font-semibold'
                  : 'text-ebayGreen-600 font-semibold'
              }
            >
              Fake risk: {(listing.fakeRisk * 100).toFixed(0)}%
            </span>
          ) : (
            <span className="text-ink-400">Fake risk: ???</span>
          )}
          {!isLot && !isStorage && !isSlab && !isSlabBag && showCenteringDetail && (
            <span
              className={
                Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 3
                  ? 'text-ebayGreen-600'
                  : Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 7
                  ? 'text-ebayYellow-700'
                  : 'text-ebayRed-500'
              }
            >
              {centeringLabel(listing.centeringOffsetX, listing.centeringOffsetY)}
              {centeringLean(listing.centeringOffsetX, listing.centeringOffsetY)
                ? `, ${centeringLean(listing.centeringOffsetX, listing.centeringOffsetY)}`
                : ''}
            </span>
          )}
          <span className="text-ink-400">{Math.max(0, listing.timeRemainingSeconds)}s</span>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={onInspect}
            className="flex-1 rounded-md border border-ink-300 hover:border-ink-500 py-1.5 text-xs font-semibold text-ink-700"
          >
            Inspect
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-[1.5] rounded-md py-1.5 text-xs font-bold ${
              canAfford
                ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 shadow-sm'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            }`}
          >
            Buy {money(listing.askingPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded bg-ink-100 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`text-xs font-bold ${accent}`}>{value}</div>
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

function BigSlabBagArt() {
  return (
    <div className="relative h-40 w-28">
      <div className="absolute inset-0 rounded-md border-2 border-cyan-300/70 bg-gradient-to-br from-cyan-600 via-teal-700 to-slate-900 shadow-xl shadow-cyan-500/30 flex flex-col items-center justify-center text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)',
          }}
        />
        {/* a slab peeking out of the bag */}
        <div className="relative w-12 rounded-sm bg-white/90 border border-white/70 shadow-md flex flex-col items-center pt-1.5 pb-1.5 gap-1">
          <div className="w-9 h-2 rounded-[1px] bg-cyan-700" />
          <div className="w-8 h-7 rounded-[1px] bg-gradient-to-br from-cyan-400 to-teal-600" />
        </div>
        <div className="relative text-[11px] uppercase tracking-widest mt-2 font-semibold drop-shadow">
          Slab Bag
        </div>
        <div className="relative text-[9px] uppercase tracking-widest mt-1 text-cyan-200">
          1 graded card
        </div>
      </div>
    </div>
  );
}

function SlabBagArt() {
  return (
    <div className="relative h-24 w-16 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-cyan-300/70 bg-gradient-to-br from-cyan-600 via-teal-700 to-slate-900 shadow-lg shadow-cyan-500/40 flex flex-col items-center justify-center text-white">
        <Icon name="package" size={26} />
        <div className="text-[9px] uppercase tracking-widest mt-1">Slab</div>
        <div className="text-[9px] uppercase tracking-widest">Bag</div>
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
  const isSlabBag = listing.lotType === 'slab_bag';
  const isSingleCard = !isMystery && !isStorage && !isSlabBag;
  const [zoomed, setZoomed] = useState(false);
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[520px] max-w-full rounded-xl border border-line bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {isStorage ? (
            <StorageUnitArt />
          ) : isSlabBag ? (
            <SlabBagArt />
          ) : isMystery ? (
            <MysteryArt count={listing.lotSize ?? 3} />
          ) : (
            <div className="relative shrink-0">
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
              <button
                onClick={() => setZoomed(true)}
                className="absolute -top-2.5 -right-2.5 z-20 w-8 h-8 rounded-full bg-feebay-500 hover:bg-feebay-600 text-white flex items-center justify-center shadow-md border-2 border-white transition"
                title="Zoom in to inspect quality & centering"
              >
                <Icon name="search" size={15} />
              </button>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-ink-500 uppercase tracking-wide font-semibold">
              {mkt.id} • {listing.lotType.replace('_', ' ')}
            </div>
            <div className="text-lg font-bold mt-1 text-ink-900">{listing.title}</div>
            <div className="text-xs text-ink-500">Seller: @{listing.sellerName}</div>
            <div className="text-sm text-ink-700 mt-2">{listing.description}</div>
            <div className="text-2xl font-black text-ink-900 mt-3">{money(listing.askingPrice)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <Pill
            label="Est. value"
            value={showRange ? `${money(listing.estimatedValueMin)}–${money(listing.estimatedValueMax)}` : '???'}
            accent="text-feebay-600"
          />
          <Pill label="Condition" value={listing.rawCondition} accent="text-ink-900" />
          <Pill label="Hint" value={listing.conditionHint} accent="text-ink-700" />
          <Pill label="Rarity" value={listing.rarity} accent="text-ebayYellow-700" />
          <Pill
            label="Fake risk"
            value={showFakeRisk ? `${(listing.fakeRisk * 100).toFixed(0)}%` : '???'}
            accent={
              showFakeRisk && listing.fakeRisk > 0.4 ? 'text-ebayRed-500' : 'text-ink-900'
            }
          />
          {listing.lotType !== 'mystery_lot' && listing.lotType !== 'binder' && listing.lotType !== 'storage_unit' && listing.lotType !== 'slab_bag' && (
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
                  ? 'text-ebayGreen-600'
                  : Math.abs(listing.centeringOffsetX) + Math.abs(listing.centeringOffsetY) <= 7
                  ? 'text-ebayYellow-700'
                  : 'text-ebayRed-500'
              }
            />
          )}
        </div>
        <div className="text-xs text-ink-500 mt-3 italic">{mkt.tagline}</div>

        {isNegotiableListing(listing) && !isMystery && !isStorage && !isSlabBag && (
          <NegotiationBlock listing={listing} />
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-line hover:border-ink-400 py-2.5 text-sm font-semibold text-ink-700"
          >
            Pass
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-[1.5] rounded-md py-2.5 text-sm font-bold ${
              canAfford
                ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 shadow-md shadow-ebayYellow-700/20'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            }`}
          >
            Buy It Now · {money(listing.askingPrice)}
          </button>
        </div>
      </div>

      {zoomed && isSingleCard && (
        <CardZoomOverlay
          name={card.name}
          rarity={listing.rarity}
          hue={card.hue}
          cardId={listing.cardId}
          grade={listing.grade}
          gradingCompany={listing.gradingCompany}
          centeringOffsetX={listing.centeringOffsetX}
          centeringOffsetY={listing.centeringOffsetY}
          condition={listing.rawCondition}
          onClose={() => setZoomed(false)}
        />
      )}
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
    <div className="mt-3 rounded-md border border-ebayYellow-500/40 bg-ebayYellow-500/10 p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-ebayYellow-700 font-bold">
        Make an offer
      </div>
      <input
        type="range"
        min={1}
        max={Math.max(1, listing.askingPrice)}
        value={offer}
        onChange={(e) => setOffer(Number(e.target.value))}
        className="w-full accent-ebayYellow-500"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-700">
          Offer: <span className="font-bold text-ink-900">{money(offer)}</span>
          <span className="text-ink-400"> / {money(listing.askingPrice)} ask</span>
        </span>
        <button
          onClick={send}
          className="rounded-md bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 px-3 py-1 text-xs font-bold"
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
                  ? 'text-ebayGreen-700'
                  : h.kind === 'counter'
                  ? 'text-ebayYellow-700'
                  : 'text-ebayRed-600'
              }
            >
              <span className="uppercase font-bold mr-1">{h.kind}</span>
              {h.flavor} {h.price ? `(${money(h.price)})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
