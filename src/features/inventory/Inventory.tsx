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
    const items = inventory
      .filter((i) => (filter === 'all' ? true : i.status === filter))
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
  }, [inventory, trends, sortKey, filter]);

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
          <p className="text-slate-400 text-sm">
            {inventory.length} / {slots} slots used. Sell raw, bundle, or grade.
          </p>
        </div>
        <div className="flex gap-2 text-xs flex-wrap">
          {(['all', 'raw', 'grading', 'graded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md border ${
                filter === f
                  ? 'border-feebay-500 bg-feebay-700/40 text-feebay-100'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="border-l border-slate-700 mx-1" />
          {(['recent', 'value', 'profit', 'rarity', 'condition'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`px-3 py-1.5 rounded-md border ${
                sortKey === k
                  ? 'border-feebay-500 bg-feebay-700/40 text-feebay-100'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {k}
            </button>
          ))}
          <span className="border-l border-slate-700 mx-1" />
          {bundleMode ? (
            <button
              onClick={exitBundleMode}
              className="px-3 py-1.5 rounded-md border border-rose-500 text-rose-200"
            >
              Cancel bundle
            </button>
          ) : (
            <button
              onClick={() => setBundleMode(true)}
              className="px-3 py-1.5 rounded-md border border-amber-500/60 text-amber-200 hover:bg-amber-900/30 flex items-center gap-1.5"
            >
              <Icon name="package" size={12} /> Bundle mode
            </button>
          )}
        </div>
      </div>

      {movers.length > 0 && !bundleMode && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex items-center gap-3 flex-wrap">
          <div className="text-xs uppercase tracking-widest text-slate-400 mr-1">
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
                    ? 'border-slate-700 bg-slate-800/60 text-slate-300'
                    : up
                    ? 'border-emerald-700/50 bg-emerald-900/25 text-emerald-200'
                    : 'border-rose-700/50 bg-rose-900/25 text-rose-200'
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
        <div className="rounded-lg border border-amber-500/40 bg-amber-900/15 p-3 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm">
            <span className="font-semibold text-amber-200">{selectedIds.size} selected.</span>{' '}
            <span className="text-slate-400">
              Bundles take 90% of summed value but pay fees once. Better for stacks of low-value commons.
            </span>
          </div>
          {selectedIds.size >= 2 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Est. net <span className="text-emerald-300 font-semibold">${bundleNetEstimate}</span>{' '}
                ({bundleProfitEstimate >= 0 ? '+' : ''}${bundleProfitEstimate.toFixed(0)} vs cost)
              </span>
              {unlocked.filter((m) => m !== 'SlabHub').map((m) => (
                <button
                  key={m}
                  onClick={() => confirmBundleSale(m)}
                  className="rounded bg-amber-600 hover:bg-amber-500 px-3 py-1.5 font-semibold"
                >
                  Sell on {m}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded border border-dashed border-slate-700 p-10 text-center text-slate-400">
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

  const bundleEligible = bundleMode && item.status === 'raw';
  const containerCls = bundleEligible
    ? selected
      ? 'border-amber-400 ring-2 ring-amber-400/40 cursor-pointer'
      : 'border-slate-800 hover:border-amber-500/60 cursor-pointer'
    : bundleMode
    ? 'border-slate-800 opacity-50'
    : 'border-slate-800';

  return (
    <div
      onClick={bundleEligible ? onToggleSelect : bundleMode ? undefined : onOpenDetail}
      className={`rounded-lg border bg-slate-900/60 p-3 flex flex-col gap-3 transition ${
        bundleMode ? containerCls : `${containerCls} cursor-pointer hover:border-feebay-600/60`
      }`}
    >
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
                    ? 'bg-amber-400 border-amber-300 text-slate-900'
                    : 'border-slate-600'
                }`}
              >
                {selected && <Icon name="check" size={10} />}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">{item.rarity} • {item.rawCondition}</div>
          <div className="text-xs text-slate-500">From {item.acquiredFrom}</div>
          {item.status === 'grading' && (
            <div className="mt-1 inline-block text-[10px] uppercase tracking-widest bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded">
              At {item.gradingCompany} Grading
            </div>
          )}
          {item.status === 'listed' && (
            <div className="mt-1 inline-block text-[10px] uppercase tracking-widest bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded">
              On your storefront
            </div>
          )}
          {item.status === 'graded' && item.grade !== undefined && (
            <div
              className={`mt-1 inline-block text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                item.grade >= 9 ? 'bg-amber-900/60 text-amber-200' : 'bg-slate-800 text-slate-300'
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
          accent={profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <MarketPill noiseValue={noiseValue} noisePrev={noisePrev} />
        <Pill
          label="Centering"
          value={`${centeringScore(item.centeringOffsetX, item.centeringOffsetY)}/100`}
          accent={
            centeringScore(item.centeringOffsetX, item.centeringOffsetY) >= 80
              ? 'text-emerald-300'
              : centeringScore(item.centeringOffsetX, item.centeringOffsetY) >= 55
              ? 'text-amber-300'
              : 'text-rose-300'
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
          {item.status === 'raw' && (
            <>
              {sellableTo.map((m) => (
                <button
                  key={m}
                  onClick={() => onSell(m)}
                  className="text-xs px-2 py-1.5 rounded bg-feebay-600 hover:bg-feebay-500"
                >
                  Sell on {m}
                </button>
              ))}
              <button
                onClick={onList}
                className="text-xs px-2 py-1.5 rounded bg-amber-600 hover:bg-amber-500"
              >
                List @ price
              </button>
              {availableCompanies.map((c) => (
                <button
                  key={c}
                  onClick={() => onGrade(c)}
                  className="text-xs px-2 py-1.5 rounded bg-purple-700 hover:bg-purple-600"
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
                  className="text-xs px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500"
                >
                  Sell slab on {m}
                </button>
              ))}
              <button
                onClick={onList}
                className="text-xs px-2 py-1.5 rounded bg-amber-600 hover:bg-amber-500"
              >
                List @ price
              </button>
            </>
          )}
          {item.status === 'grading' && (
            <span className="text-xs text-slate-400">Waiting on grade...</span>
          )}
          {item.status === 'listed' && (
            <span className="text-xs text-slate-400">Active on storefront — see Storefront tab.</span>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({
  label,
  value,
  accent = 'text-slate-100',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded bg-slate-800/70 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
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
    ? 'text-slate-200'
    : up
    ? 'text-emerald-300'
    : 'text-rose-300';
  return (
    <div className={`rounded bg-slate-800/70 px-2 py-1 ${flashClass}`}>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
        <span>Market</span>
        {!flat && (
          <Icon
            name={up ? 'chart-up' : 'chart-down'}
            size={10}
            className={up ? 'text-emerald-300' : 'text-rose-300'}
          />
        )}
      </div>
      <div className={`text-xs font-semibold ${accent}`}>
        {flat ? 'flat' : `${up ? '+' : ''}${pct.toFixed(1)}%`}
      </div>
      <style>{`
        @keyframes mktUp {
          0% { background-color: rgba(16,185,129,0.45); }
          100% { background-color: rgba(30,41,59,0.7); }
        }
        @keyframes mktDown {
          0% { background-color: rgba(244,63,94,0.45); }
          100% { background-color: rgba(30,41,59,0.7); }
        }
        .animate-mktUp { animation: mktUp 1.4s ease-out; }
        .animate-mktDown { animation: mktDown 1.4s ease-out; }
      `}</style>
    </div>
  );
}
