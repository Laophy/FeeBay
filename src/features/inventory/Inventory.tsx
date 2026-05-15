import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { calculateCurrentValue } from '../../game/economyEngine';
import { CardArt } from '../../components/CardArt';
import type { GradingCompanyId, InventoryItem, MarketplaceSource } from '../../types';
import { GRADING_COMPANIES } from '../../data/gradingCompanies';
import { centeringLabel, centeringLean, centeringScore } from '../../game/centering';
import { Icon } from '../../components/Icon';
import { getCardById } from '../../data/cards';
import { CardDetailModal } from '../../components/CardDetailModal';
import { ListForSaleModal } from '../../components/ListForSaleModal';

type SortKey = 'value' | 'profit' | 'rarity' | 'condition' | 'recent';

export function Inventory() {
  const inventory = useGameStore((s) => s.inventory);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const noisePrev = useGameStore((s) => s.marketNoisePrev);
  const convention = useGameStore((s) => s.convention);
  const sell = useGameStore((s) => s.sellInventoryItem);
  const sellBundle = useGameStore((s) => s.sellBundle);
  const grade = useGameStore((s) => s.sendToGrading);
  const toggleShowcase = useGameStore((s) => s.toggleShowcase);
  const showcaseIds = useGameStore((s) => s.showcaseItemIds);
  const slots = useGameStore((s) => s.inventorySlots)();
  const unlocked = useGameStore((s) => s.marketplacesUnlocked);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const sortKey = useGameStore((s) => s.ui.inventorySortKey);
  const filter = useGameStore((s) => s.ui.inventoryFilter);
  const setSortKey = useGameStore((s) => s.setInventorySortKey);
  const setFilter = useGameStore((s) => s.setInventoryFilter);

  const availableCompanies = GRADING_COMPANIES.filter((c) => upgrades.includes(c.unlockUpgradeId));

  const [bundleMode, setBundleMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [listingItem, setListingItem] = useState<InventoryItem | null>(null);

  const sorted = useMemo(() => {
    const showcaseSet = new Set(showcaseIds);
    const items = inventory
      .filter((i) => {
        if (filter === 'showcased') return showcaseSet.has(i.id);
        // Showcased items only appear in the 'showcased' filter — never in all/raw/grading/graded.
        if (showcaseSet.has(i.id)) return false;
        if (filter === 'all') return true;
        return i.status === filter;
      })
      .map((i) => ({
        item: i,
        value: calculateCurrentValue(i, trends, noise, convention),
      }));
    items.sort((a, b) => {
      switch (sortKey) {
        case 'value':
          return b.value - a.value;
        case 'profit':
          return b.value - b.item.purchasePrice - (a.value - a.item.purchasePrice);
        case 'rarity':
          return a.item.rarity.localeCompare(b.item.rarity);
        case 'condition':
          return b.item.actualConditionScore - a.item.actualConditionScore;
        case 'recent':
        default:
          return b.item.acquiredAt - a.item.acquiredAt;
      }
    });
    return items;
  }, [inventory, trends, sortKey, filter, noise, convention, showcaseIds]);

  const selectedItems = useMemo(
    () => inventory.filter((i) => selectedIds.has(i.id)),
    [inventory, selectedIds],
  );

  const bundleValueSum = selectedItems.reduce(
    (s, i) => s + calculateCurrentValue(i, trends, noise, convention),
    0,
  );
  const bundleCostSum = selectedItems.reduce((s, i) => s + i.purchasePrice, 0);
  const bundleNetEstimate = Math.round(bundleValueSum * 0.9);
  const bundleProfitEstimate = bundleNetEstimate - bundleCostSum;

  const movers = useMemo(() => {
    const seen = new Set<string>();
    const distinct: { cardId: string; deltaPct: number }[] = [];
    for (const i of inventory) {
      if (seen.has(i.cardId)) continue;
      seen.add(i.cardId);
      const n = noise[i.cardId] ?? 1;
      distinct.push({ cardId: i.cardId, deltaPct: +((n - 1) * 100).toFixed(1) });
    }
    distinct.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
    return distinct.slice(0, 5);
  }, [inventory, noise]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitBundleMode() {
    setBundleMode(false);
    setSelectedIds(new Set());
  }

  function confirmBundleSale(marketplace: MarketplaceSource) {
    sellBundle(Array.from(selectedIds), marketplace);
    exitBundleMode();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-ink-500 text-sm">
            {inventory.length} / {slots} slots used. Sell raw, bundle, or grade.
          </p>
        </div>
        <div className="flex gap-2 text-xs flex-wrap">
          {(['all', 'raw', 'grading', 'graded', 'showcased'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md border flex items-center gap-1 ${
                filter === f
                  ? f === 'showcased'
                    ? 'border-ebayYellow-500 bg-ebayYellow-500 text-ink-900 font-bold'
                    : 'border-feebay-500 bg-feebay-500 text-white font-semibold'
                  : 'border-line text-ink-700 hover:border-ink-400 bg-white'
              }`}
            >
              {f === 'showcased' && <Icon name="crown" size={11} />}
              {f}
              {f === 'showcased' && showcaseIds.length > 0 && (
                <span
                  className={`text-[10px] px-1 rounded ${
                    filter === f ? 'bg-ink-900/15 text-ink-900' : 'bg-ebayYellow-500/20 text-ebayYellow-700 font-bold'
                  }`}
                >
                  {showcaseIds.length}
                </span>
              )}
            </button>
          ))}
          <span className="border-l border-line mx-1" />
          {(['recent', 'value', 'profit', 'rarity', 'condition'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`px-3 py-1.5 rounded-md border ${
                sortKey === k
                  ? 'border-feebay-500 bg-feebay-500 text-white font-semibold'
                  : 'border-line text-ink-700 hover:border-ink-400 bg-white'
              }`}
            >
              {k}
            </button>
          ))}
          <span className="border-l border-line mx-1" />
          {bundleMode ? (
            <button
              onClick={exitBundleMode}
              className="px-3 py-1.5 rounded-md border border-ebayRed-500 text-ebayRed-600 bg-white"
            >
              Cancel bundle
            </button>
          ) : (
            <button
              onClick={() => setBundleMode(true)}
              className="px-3 py-1.5 rounded-md border border-ebayYellow-500 text-ebayYellow-700 bg-ebayYellow-500/10 hover:bg-ebayYellow-500/20 flex items-center gap-1.5 font-semibold"
            >
              <Icon name="package" size={12} /> Bundle mode
            </button>
          )}
        </div>
      </div>

      {movers.length > 0 && !bundleMode && (
        <div className="rounded-xl border border-line bg-white shadow-card p-3 flex items-center gap-3 flex-wrap">
          <div className="text-xs uppercase tracking-widest text-ink-500 mr-1">
            Market movers
          </div>
          {movers.map((m) => {
            const card = getCardById(m.cardId);
            const up = m.deltaPct > 0;
            const flat = Math.abs(m.deltaPct) < 0.5;
            return (
              <div
                key={m.cardId}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${
                  flat
                    ? 'border-line bg-ink-100 text-ink-700'
                    : up
                    ? 'border-ebayGreen-500 bg-ebayGreen-500/10 text-ebayGreen-700'
                    : 'border-ebayRed-500/60 bg-ebayRed-500/10 text-ebayRed-600'
                }`}
              >
                <Icon
                  name={flat ? 'minus' : up ? 'chart-up' : 'chart-down'}
                  size={12}
                />
                <span className="font-semibold">{card.name}</span>
                <span className="opacity-80">
                  {up && '+'}
                  {m.deltaPct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {bundleMode && (
        <div className="rounded-xl border border-ebayYellow-500 bg-ebayYellow-500/10 p-3 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm">
            <span className="font-bold text-ebayYellow-700">{selectedIds.size} selected.</span>{' '}
            <span className="text-ink-500">
              Bundles take 90% of summed value but pay fees once. Better for stacks of low-value commons.
            </span>
          </div>
          {selectedIds.size >= 2 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-ink-500">
                Est. net <span className="text-ebayGreen-600 font-semibold">${bundleNetEstimate}</span>{' '}
                ({bundleProfitEstimate >= 0 ? '+' : ''}${bundleProfitEstimate.toFixed(0)} vs cost)
              </span>
              {unlocked.filter((m) => m !== 'SlabHub').map((m) => (
                <button
                  key={m}
                  onClick={() => confirmBundleSale(m)}
                  className="rounded bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 px-3 py-1.5 font-semibold"
                >
                  Sell on {m}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded border border-dashed border-line p-10 text-center text-ink-500">
          {filter === 'all'
            ? 'Inventory empty. Time to go shopping on FeeBay.'
            : `No ${filter} items.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(({ item, value }) => (
            <ItemCard
              key={item.id}
              item={item}
              currentValue={value}
              noiseValue={noise[item.cardId] ?? 1}
              noisePrev={noisePrev[item.cardId] ?? 1}
              availableCompanies={availableCompanies.map((c) => c.id)}
              unlocked={unlocked}
              onSell={(mkt) => sell(item.id, mkt)}
              onGrade={(c) => grade(item.id, c)}
              onList={() => setListingItem(item)}
              onToggleShowcase={() => toggleShowcase(item.id)}
              showcased={showcaseIds.includes(item.id)}
              bundleMode={bundleMode}
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onOpenDetail={() => setDetailItem(item)}
            />
          ))}
        </div>
      )}

      {detailItem && (
        <CardDetailModal kind="item" item={detailItem} onClose={() => setDetailItem(null)} />
      )}
      {listingItem && (
        <ListForSaleModal item={listingItem} onClose={() => setListingItem(null)} />
      )}
    </div>
  );
}

function ItemCard({
  item,
  currentValue,
  noiseValue,
  noisePrev,
  availableCompanies,
  unlocked,
  onSell,
  onGrade,
  onList,
  onToggleShowcase,
  showcased,
  bundleMode,
  selected,
  onToggleSelect,
  onOpenDetail,
}: {
  item: InventoryItem;
  currentValue: number;
  noiseValue: number;
  noisePrev: number;
  availableCompanies: GradingCompanyId[];
  unlocked: MarketplaceSource[];
  onSell: (mkt?: MarketplaceSource) => void;
  onGrade: (companyId: GradingCompanyId) => void;
  onList: () => void;
  onToggleShowcase: () => void;
  showcased: boolean;
  bundleMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
}) {
  const profit = currentValue - item.purchasePrice;
  const profitPct = (profit / Math.max(1, item.purchasePrice)) * 100;
  const sellableTo: MarketplaceSource[] =
    item.status === 'graded'
      ? unlocked.filter((m) => m === 'SlabHub' || m === 'FeeBay')
      : unlocked.filter((m) => m !== 'SlabHub');

  const bundleEligible = bundleMode && item.status === 'raw' && !showcased;
  const containerCls = bundleEligible
    ? selected
      ? 'border-ebayYellow-500 ring-2 ring-ebayYellow-500/40 cursor-pointer'
      : 'border-line hover:border-ebayYellow-500 cursor-pointer'
    : bundleMode
    ? 'border-line opacity-50'
    : showcased
    ? 'border-ebayYellow-500 ring-1 ring-ebayYellow-500/40'
    : 'border-line';

  return (
    <div
      onClick={bundleEligible ? onToggleSelect : bundleMode ? undefined : onOpenDetail}
      className={`relative rounded-lg border bg-white shadow-card p-3 flex flex-col gap-3 transition ${
        bundleMode ? containerCls : `${containerCls} cursor-pointer hover:border-feebay-600/60`
      }`}
    >
      {/* Top-right showcase icon button */}
      {!bundleMode && (item.status === 'raw' || item.status === 'graded' || showcased) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleShowcase();
          }}
          title={showcased ? 'Remove from showcase' : 'Add to showcase (locks from sale)'}
          aria-label={showcased ? 'Remove from showcase' : 'Add to showcase'}
          className={`absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center transition shadow-sm z-10 ${
            showcased
              ? 'bg-ebayYellow-500 text-ink-900 hover:bg-ebayYellow-600'
              : 'bg-white border border-line text-ink-500 hover:text-ebayYellow-700 hover:border-ebayYellow-500'
          }`}
        >
          <Icon name="crown" size={14} />
        </button>
      )}
      <div className="flex items-start gap-3">
        <CardArt
          name={item.name}
          rarity={item.rarity}
          hue={item.hue}
          grade={item.grade}
          gradingCompany={item.gradingCompany}
          cardId={item.cardId}
          centeringOffsetX={item.centeringOffsetX}
          centeringOffsetY={item.centeringOffsetY}
          small
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate flex items-center gap-2">
            <span className="truncate">{item.name}</span>
            {bundleEligible && (
              <span
                className={`shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center ${
                  selected
                    ? 'bg-ebayYellow-500 border-ebayYellow-600 text-ink-900'
                    : 'border-ink-300'
                }`}
              >
                {selected && <Icon name="check" size={10} />}
              </span>
            )}
          </div>
          <div className="text-xs text-ink-500">{item.rarity} • {item.rawCondition}</div>
          <div className="text-xs text-ink-400">From {item.acquiredFrom}</div>
          {item.status === 'grading' && (
            <div className="mt-1 inline-block text-[10px] uppercase tracking-widest bg-feebay-50 text-feebay-700 px-1.5 py-0.5 rounded">
              At {item.gradingCompany} Grading
            </div>
          )}
          {item.status === 'listed' && (
            <div className="mt-1 inline-block text-[10px] uppercase tracking-widest bg-ebayYellow-500/20 text-ebayYellow-700 px-1.5 py-0.5 rounded">
              On your storefront
            </div>
          )}
          {showcased && (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-ebayYellow-500/20 text-ebayYellow-700 px-1.5 py-0.5 rounded font-bold">
              <Icon name="crown" size={11} /> In showcase
            </div>
          )}
          {item.status === 'graded' && item.grade !== undefined && (
            <div
              className={`mt-1 inline-block text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                item.grade >= 9 ? 'bg-ebayYellow-500/20 text-ebayYellow-700' : 'bg-ink-100 text-ink-700'
              }`}
            >
              {item.gradeLabel}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Pill label="Paid" value={`$${item.purchasePrice.toFixed(2)}`} />
        <Pill label="Value" value={`$${currentValue}`} accent="text-feebay-300" />
        <Pill
          label="Margin"
          value={`${profit >= 0 ? '+' : ''}$${profit.toFixed(0)} (${profitPct.toFixed(0)}%)`}
          accent={profit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <MarketPill noiseValue={noiseValue} noisePrev={noisePrev} />
        <Pill
          label="Centering"
          value={`${centeringScore(item.centeringOffsetX, item.centeringOffsetY)}/100`}
          accent={
            centeringScore(item.centeringOffsetX, item.centeringOffsetY) >= 80
              ? 'text-ebayGreen-600'
              : centeringScore(item.centeringOffsetX, item.centeringOffsetY) >= 55
              ? 'text-ebayYellow-700'
              : 'text-ebayRed-500'
          }
        />
        <Pill
          label="Lean"
          value={
            centeringLean(item.centeringOffsetX, item.centeringOffsetY) ||
            centeringLabel(item.centeringOffsetX, item.centeringOffsetY)
          }
        />
      </div>

      {!bundleMode && (
        <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {showcased ? (
            <span className="text-xs text-ebayYellow-700 italic">
              In showcase — actions locked. Click the crown to remove.
            </span>
          ) : (
            <>
              {item.status === 'raw' && (
                <>
                  {sellableTo.map((m) => (
                    <button
                      key={m}
                      onClick={() => onSell(m)}
                      className="text-xs px-2 py-1.5 rounded bg-feebay-500 hover:bg-feebay-600 text-white"
                    >
                      Sell on {m}
                    </button>
                  ))}
                  <button
                    onClick={onList}
                    className="text-xs px-2 py-1.5 rounded bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900"
                  >
                    List @ price
                  </button>
                  {availableCompanies.map((c) => (
                    <button
                      key={c}
                      onClick={() => onGrade(c)}
                      className="text-xs px-2 py-1.5 rounded bg-feebay-500 hover:bg-feebay-600 text-white"
                    >
                      Grade @ {c}
                    </button>
                  ))}
                </>
              )}
              {item.status === 'graded' && (
                <>
                  {sellableTo.map((m) => (
                    <button
                      key={m}
                      onClick={() => onSell(m)}
                      className="text-xs px-2 py-1.5 rounded bg-ebayGreen-500 hover:bg-ebayGreen-600 text-white"
                    >
                      Sell slab on {m}
                    </button>
                  ))}
                  <button
                    onClick={onList}
                    className="text-xs px-2 py-1.5 rounded bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900"
                  >
                    List @ price
                  </button>
                </>
              )}
              {item.status === 'grading' && (
                <span className="text-xs text-ink-500">Waiting on grade...</span>
              )}
              {item.status === 'listed' && (
                <span className="text-xs text-ink-500">Active on storefront — see Storefront tab.</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({
  label,
  value,
  accent = 'text-ink-900',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded bg-ink-100 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-ink-400">{label}</div>
      <div className={`text-xs font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function MarketPill({
  noiseValue,
  noisePrev,
}: {
  noiseValue: number;
  noisePrev: number;
}) {
  const pct = +((noiseValue - 1) * 100).toFixed(1);
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const delta = noiseValue - noisePrev;
  const flashClass =
    Math.abs(delta) > 0.005
      ? delta > 0
        ? 'animate-mktUp'
        : 'animate-mktDown'
      : '';
  const accent = flat
    ? 'text-ink-800'
    : up
    ? 'text-ebayGreen-600'
    : 'text-ebayRed-500';
  return (
    <div className={`rounded bg-ink-100 px-2 py-1 ${flashClass}`}>
      <div className="text-[9px] uppercase tracking-widest text-ink-400 flex items-center gap-1">
        <span>Market</span>
        {!flat && (
          <Icon
            name={up ? 'chart-up' : 'chart-down'}
            size={10}
            className={up ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
          />
        )}
      </div>
      <div className={`text-xs font-semibold ${accent}`}>
        {flat ? 'flat' : `${up ? '+' : ''}${pct.toFixed(1)}%`}
      </div>
      <style>{`
        @keyframes mktUp {
          0% { background-color: rgba(134, 184, 23, 0.35); }
          100% { background-color: rgba(238, 240, 243, 1); }
        }
        @keyframes mktDown {
          0% { background-color: rgba(229, 50, 56, 0.3); }
          100% { background-color: rgba(238, 240, 243, 1); }
        }
        .animate-mktUp { animation: mktUp 1.4s ease-out; }
        .animate-mktDown { animation: mktDown 1.4s ease-out; }
      `}</style>
    </div>
  );
}
