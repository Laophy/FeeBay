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

  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
          Listings expire after 8 minutes and return to your inventory.
        </span>
      </div>
    </div>
  );
}
