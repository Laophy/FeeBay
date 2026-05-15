import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CardArt } from '../../components/CardArt';
import { getCardById } from '../../data/cards';
import { saleProbabilityPerTick } from '../../game/storefront';
import { Icon } from '../../components/Icon';

export function Storefront() {
  const listings = useGameStore((s) => s.playerListings);
  const inventory = useGameStore((s) => s.inventory);
  const delist = useGameStore((s) => s.delistFromStorefront);
  const history = useGameStore((s) => s.storefrontHistory);
  const pending = useGameStore((s) => s.pendingPayments);

  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function fmtRelative(t: number): string {
    const sec = Math.max(0, (Date.now() - t) / 1000);
    if (sec < 60) return `${Math.floor(sec)}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Your Storefront</h1>
        <p className="text-ink-500 text-sm">
          Cards you've listed at your chosen prices. Buyers nibble probabilistically — list close to value for steady sales, list above for jackpot odds.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded border border-dashed border-line p-10 text-center text-ink-500">
          You have no active listings. Open an Inventory card and click &quot;List for sale&quot; to put it on the storefront.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((l) => {
            const item = inventory.find((i) => i.id === l.itemId);
            if (!item) return null;
            const card = getCardById(item.cardId);
            const now = Date.now();
            const timeLeftMs = Math.max(0, l.expiresAt - now);
            const totalMs = l.expiresAt - l.listedAt;
            const elapsedPct = Math.min(100, ((totalMs - timeLeftMs) / totalMs) * 100);
            const probPerTick = saleProbabilityPerTick(l.askingPrice, l.refValue, l.marketplace);
            const probPerMin = Math.min(0.99, 1 - Math.pow(1 - probPerTick, 6));
            const ratio = l.askingPrice / l.refValue;
            return (
              <div key={l.id} className="rounded-lg border border-line bg-white shadow-card p-3 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <CardArt
                    name={card.name}
                    rarity={card.rarity}
                    hue={card.hue}
                    cardId={card.id}
                    grade={item.grade}
                    gradingCompany={item.gradingCompany}
                    centeringOffsetX={item.centeringOffsetX}
                    centeringOffsetY={item.centeringOffsetY}
                    small
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{card.name}</div>
                    <div className="text-xs text-ink-500">
                      {item.rarity} • {item.rawCondition} • on {l.marketplace}
                    </div>
                    <div className="mt-2 text-xs flex items-center gap-2">
                      <span className="text-ink-500">Price</span>
                      <span className="text-ebayGreen-600 font-semibold">${l.askingPrice}</span>
                      <span className="text-ink-400">vs ref ${l.refValue}</span>
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      ratio {ratio.toFixed(2)}× • est{' '}
                      <span
                        className={
                          probPerMin > 0.4
                            ? 'text-ebayGreen-600'
                            : probPerMin > 0.1
                            ? 'text-ebayYellow-700'
                            : 'text-ebayRed-500'
                        }
                      >
                        {(probPerMin * 100).toFixed(0)}%/min chance
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500/70"
                    style={{ width: `${elapsedPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-500">
                  <span>{Math.ceil(timeLeftMs / 1000)}s remaining</span>
                  <button
                    onClick={() => delist(l.id)}
                    className="rounded border border-line hover:border-rose-500 hover:text-ebayRed-500 px-2 py-1 text-[11px]"
                  >
                    Delist
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded border border-line bg-white shadow-card text-xs text-ink-500 p-3 flex items-start gap-2">
        <Icon name="tag" size={14} className="mt-0.5 shrink-0 text-ink-400" />
        <span>
          Listing at your <span className="text-ink-800">reference value</span> gives roughly a 15% sale chance per minute.
          List under value for fast flips, over value for jackpot prices but more risk of expiring.
          Listings expire after 8 minutes and return to your inventory. Buyers don't always pay instantly — 60% pay on the spot,
          30% delay, 10% will cancel and you get your card back (but lose the time).
        </span>
      </div>

      {/* Pending payments */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-feebay-500/40 bg-feebay-50 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-feebay-500/20 text-feebay-700 flex items-center justify-center">
                <Icon name="wallet" size={18} />
              </div>
              <div>
                <div className="font-black text-ink-900">Awaiting payment</div>
                <div className="text-xs text-ink-500">
                  Buyers clicked Buy. Some pay quickly, some slow-walk it, some bail entirely.
                </div>
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-feebay-700">
              {pending.length} pending
            </div>
          </div>
          <ul className="divide-y divide-feebay-500/20">
            {pending.map((p) => {
              const remainingMs = Math.max(0, p.resolveAt - Date.now());
              const totalMs = p.resolveAt - p.saleAt;
              const elapsedPct = Math.min(100, ((totalMs - remainingMs) / totalMs) * 100);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <CardArt
                    name={p.item.name}
                    rarity={p.item.rarity}
                    hue={p.item.hue}
                    cardId={p.item.cardId}
                    grade={p.item.grade}
                    gradingCompany={p.item.gradingCompany}
                    centeringOffsetX={p.item.centeringOffsetX}
                    centeringOffsetY={p.item.centeringOffsetY}
                    small
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink-900 truncate">{p.item.name}</div>
                    <div className="text-[11px] text-ink-500">
                      @{p.buyerName} on{' '}
                      <span className="text-ink-700 font-semibold">{p.marketplace}</span>
                      <span className="text-ink-300 mx-1.5">•</span>
                      <span className="italic text-feebay-700">waiting for payment…</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-feebay-500/15 overflow-hidden">
                      <div
                        className="h-full bg-feebay-500"
                        style={{ width: `${elapsedPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-ink-900">
                      ${p.netRevenue.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-ink-500">if paid</div>
                  </div>
                  <div className="text-[11px] text-ink-400 shrink-0 w-16 text-right">
                    {Math.ceil(remainingMs / 1000)}s
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sale history */}
      <div className="rounded-xl border border-line bg-white shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-ebayGreen-500/15 text-ebayGreen-700 flex items-center justify-center">
              <Icon name="chart-up" size={18} />
            </div>
            <div>
              <div className="font-black text-ink-900">Recent sales</div>
              <div className="text-xs text-ink-500">Last {Math.min(30, history.length)} cards sold off your storefront</div>
            </div>
          </div>
          {history.length > 0 && (
            <div className="text-xs text-ink-500">
              Lifetime net:{' '}
              <span
                className={
                  history.reduce((s, h) => s + h.profit, 0) >= 0
                    ? 'text-ebayGreen-700 font-bold'
                    : 'text-ebayRed-600 font-bold'
                }
              >
                {history.reduce((s, h) => s + h.profit, 0) >= 0 ? '+' : ''}$
                {history.reduce((s, h) => s + h.profit, 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-ink-500 py-6 text-center border border-dashed border-line rounded-md">
            No sales yet. When something sells, it'll show up here.
          </div>
        ) : (
          <ul className="divide-y divide-lineSoft">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2.5">
                <CardArt
                  name={h.cardName}
                  rarity={h.rarity}
                  hue={h.hue}
                  cardId={h.cardId}
                  grade={h.grade}
                  gradingCompany={h.gradingCompany}
                  centeringOffsetX={h.centeringOffsetX}
                  centeringOffsetY={h.centeringOffsetY}
                  small
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink-900 truncate">{h.cardName}</div>
                  <div className="text-[11px] text-ink-500">
                    Sold on <span className="text-ink-700 font-semibold">{h.marketplace}</span>
                    <span className="text-ink-300 mx-1.5">•</span>
                    {h.rarity}
                    {h.grade !== undefined && (
                      <>
                        <span className="text-ink-300 mx-1.5">•</span>
                        <span className="text-ebayYellow-700 font-semibold">
                          {h.gradingCompany} {h.grade}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-ink-900">${h.netRevenue.toFixed(2)}</div>
                  <div
                    className={`text-[11px] font-bold ${
                      h.profit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'
                    }`}
                  >
                    {h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}
                  </div>
                </div>
                <div className="shrink-0 w-20 flex justify-center">
                  {h.status === 'instant' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ebayGreen-500/15 text-ebayGreen-700 border border-ebayGreen-500/50">
                      <Icon name="check" size={10} /> Instant
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-feebay-50 text-feebay-700 border border-feebay-500/50"
                      title="Buyer took a while to pay"
                    >
                      <Icon name="wallet" size={10} /> Delayed
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-400 shrink-0 w-16 text-right">
                  {fmtRelative(h.soldAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
