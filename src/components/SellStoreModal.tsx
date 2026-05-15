import { createPortal } from 'react-dom';
import { useGameStore, feeDiscountFor } from '../store/useGameStore';
import { MARKETPLACES } from '../data/marketplaces';
import { Icon } from './Icon';

/** Set your primary sell store and compare marketplace fees. */
export function SellStoreModal({ onClose }: { onClose: () => void }) {
  const unlocked = useGameStore((s) => s.marketplacesUnlocked);
  const primary = useGameStore((s) => s.ui.primaryMarketplace);
  const setPrimary = useGameStore((s) => s.setPrimaryMarketplace);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const businessLevel = useGameStore((s) => s.businessLevel);

  // Fee reduction from upgrades + business level — applies to every sale.
  const discount = feeDiscountFor({ upgradesPurchased: upgrades, businessLevel });

  // Unlocked stores with your effective fee (after discounts), cheapest first.
  const stores = MARKETPLACES.filter((m) => unlocked.includes(m.id))
    .map((m) => ({ ...m, feePct: (m.sellerFeePct + m.paymentFeePct) * (1 - discount) }))
    .sort((a, b) => a.feePct - b.feePct || a.flatFee - b.flatFee);

  // The cheapest store that can take raw cards — flagged as the smart pick.
  const bestRawId = stores.find((m) => m.id !== 'SlabHub')?.id;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[560px] max-w-full max-h-[calc(100vh-80px)] overflow-y-auto rounded-xl border border-line bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-feebay-500/15 text-feebay-700 flex items-center justify-center shrink-0">
            <Icon name="tag" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Sell Stores</h2>
            <p className="text-xs text-ink-500">
              Raw cards sell to your <span className="font-semibold text-ink-700">primary store</span> from
              the one-click Sell button. Lower fees keep more of every sale.
            </p>
            {discount > 0 && (
              <p className="text-[11px] font-semibold text-ebayGreen-700 mt-0.5">
                Fees below already include your {Math.round(discount * 100)}% fee
                reduction from upgrades &amp; business level.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {stores.map((m) => {
            const isPrimary = m.id === primary;
            const slabsOnly = m.id === 'SlabHub';
            const feeLabel = `${Math.round(m.feePct * 100)}% fee${
              m.flatFee > 0 ? ` + $${m.flatFee.toFixed(2)}` : ''
            }`;
            return (
              <div
                key={m.id}
                className={`rounded-lg border p-3 flex items-center gap-3 ${
                  isPrimary
                    ? 'border-feebay-500 bg-feebay-50'
                    : 'border-line bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink-900">{m.id}</span>
                    {m.id === bestRawId && (
                      <span className="text-[9px] uppercase tracking-widest font-black bg-ebayGreen-500/15 text-ebayGreen-700 border border-ebayGreen-500/50 rounded px-1.5 py-0.5">
                        Lowest fees
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500 truncate">{m.tagline}</div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-black tabular-nums ${
                      m.feePct <= 0.05
                        ? 'text-ebayGreen-700'
                        : m.feePct <= 0.12
                        ? 'text-ebayYellow-700'
                        : 'text-ebayRed-500'
                    }`}
                  >
                    {feeLabel}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">
                    on every sale
                  </div>
                </div>
                <div className="shrink-0 w-28 text-right">
                  {slabsOnly ? (
                    <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">
                      Graded only
                    </span>
                  ) : isPrimary ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-feebay-700">
                      <Icon name="check" size={13} /> Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => setPrimary(m.id)}
                      className="rounded-md border-2 border-line hover:border-feebay-500 text-ink-700 hover:text-feebay-700 px-3 py-1.5 text-xs font-bold transition"
                    >
                      Set primary
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-[11px] text-ink-400">
          Graded slabs always choose between SlabHub and FeeBay when you sell them — the primary
          store applies to raw cards.
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded border border-line hover:border-ink-400 py-2 text-sm"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
