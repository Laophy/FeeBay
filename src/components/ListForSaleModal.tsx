import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { calculateCurrentValue } from '../game/economyEngine';
import { saleProbabilityPerTick } from '../game/storefront';
import { Icon } from './Icon';
import type { InventoryItem, MarketplaceSource } from '../types';

type Props = {
  item: InventoryItem;
  onClose: () => void;
};

export function ListForSaleModal({ item, onClose }: Props) {
  const list = useGameStore((s) => s.listForSale);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const unlocked = useGameStore((s) => s.marketplacesUnlocked);

  const refValue = calculateCurrentValue(item, trends, noise, convention);
  const isGraded = item.status === 'graded';
  const candidates: MarketplaceSource[] = isGraded
    ? unlocked.filter((m) => m === 'SlabHub' || m === 'FeeBay')
    : unlocked.filter((m) => m !== 'SlabHub');

  const [marketplace, setMarketplace] = useState<MarketplaceSource>(
    candidates[0] ?? 'FeeBay',
  );
  const [price, setPrice] = useState(refValue);

  const probPerTick = saleProbabilityPerTick(price, refValue, marketplace);
  const probPerMin = Math.min(0.99, 1 - Math.pow(1 - probPerTick, 6));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[min(440px,95vw)] rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs uppercase tracking-widest text-slate-400">List for sale</div>
        <div className="mt-1 text-lg font-semibold">{item.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          Reference value: <span className="text-feebay-300 font-semibold">${refValue}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Marketplace
            </div>
            <div className="flex flex-wrap gap-1.5">
              {candidates.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarketplace(m)}
                  className={`text-xs px-2 py-1 rounded border ${
                    marketplace === m
                      ? 'border-feebay-500 bg-feebay-700/40 text-feebay-100'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              <span>Price</span>
              <span>
                $<span className="text-emerald-300 font-semibold">{price}</span> /{' '}
                <span className="text-slate-300">{(price / Math.max(1, refValue)).toFixed(2)}× ref</span>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(1, Math.round(refValue * 1.8))}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-feebay-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>cheap</span>
              <span>at value</span>
              <span>moonshot</span>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950/40 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estimated sale chance</span>
              <span
                className={
                  probPerMin > 0.4
                    ? 'text-emerald-300 font-semibold'
                    : probPerMin > 0.1
                    ? 'text-amber-300 font-semibold'
                    : 'text-rose-300 font-semibold'
                }
              >
                {(probPerMin * 100).toFixed(0)}% per minute
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-start gap-2">
              <Icon name="tag" size={12} className="mt-0.5 shrink-0" />
              <span>
                Listings live for 8 minutes. Expire back to inventory if no buyer.
                Higher prices ≈ jackpot odds; lower prices clear fast.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded border border-slate-700 hover:border-slate-500 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              list(item.id, marketplace, price);
              onClose();
            }}
            className="flex-1 rounded bg-feebay-600 hover:bg-feebay-500 py-2 text-sm font-semibold"
          >
            List on {marketplace}
          </button>
        </div>
      </div>
    </div>
  );
}
