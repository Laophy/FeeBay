import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CARDS } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { cardsBySet, collectionPercent } from '../../game/collection';
import { CardDetailModal } from '../../components/CardDetailModal';
import { Icon } from '../../components/Icon';

export function Collection() {
  const collection = useGameStore((s) => s.collection);
  const inventory = useGameStore((s) => s.inventory);
  const showcaseIds = useGameStore((s) => s.showcaseItemIds);
  const toggleShowcase = useGameStore((s) => s.toggleShowcase);
  const sets = useMemo(() => cardsBySet(), []);
  const totalUnique = CARDS.length;
  const owned = Object.keys(collection).length;
  const percent = collectionPercent(collection);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  const showcaseItems = inventory.filter((i) => showcaseIds.includes(i.id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Collection Codex</h1>
        <p className="text-ink-500 text-sm">
          Every fictional card you've ever held, grouped by set. Track set completion and your best grade per card.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-400">Overall</div>
            <div className="text-2xl font-bold text-ebayYellow-700">
              {owned} / {totalUnique}{' '}
              <span className="text-sm text-ink-500">({percent}%)</span>
            </div>
          </div>
          <div className="text-xs text-ink-500">Unique cards owned (lifetime)</div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-feebay-400"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Showcase */}
      <div
        className="rounded-xl border-2 border-ebayYellow-500 bg-gradient-to-br from-ebayYellow-500/10 to-white shadow-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-ebayYellow-500/20 text-ebayYellow-700 flex items-center justify-center">
              <Icon name="crown" size={18} />
            </div>
            <div>
              <div className="font-black text-ink-900">Showcase</div>
              <div className="text-xs text-ink-500">
                Cards you've put on display. Locked from sale, grade, or listing.
              </div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-ebayYellow-700">
            {showcaseItems.length} card{showcaseItems.length === 1 ? '' : 's'}
          </div>
        </div>
        {showcaseItems.length === 0 ? (
          <div className="text-sm text-ink-500 py-6 text-center border border-dashed border-line rounded-md bg-white">
            No cards showcased yet. Open your inventory and click the{' '}
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-ebayYellow-500 text-ink-900 align-middle">
              <Icon name="crown" size={12} />
            </span>{' '}
            icon on any card to put it on display.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-1">
            {showcaseItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 group"
                title={item.name}
              >
                <div className="relative">
                  <CardArt
                    name={item.name}
                    rarity={item.rarity}
                    hue={item.hue}
                    cardId={item.cardId}
                    grade={item.grade}
                    gradingCompany={item.gradingCompany}
                    centeringOffsetX={item.centeringOffsetX}
                    centeringOffsetY={item.centeringOffsetY}
                  />
                  <button
                    onClick={() => toggleShowcase(item.id)}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ebayRed-500 hover:bg-ebayRed-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
                    title="Remove from showcase"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                </div>
                <div className="text-xs text-center text-ink-900 w-28 truncate font-bold">
                  {item.name}
                </div>
                <div className="text-[10px] text-ink-500 uppercase tracking-wider">
                  {item.rarity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(sets).map(([setName, cards]) => {
          const setOwned = cards.filter((c) => collection[c.id]).length;
          const setPct = Math.round((setOwned / cards.length) * 100);
          return (
            <div
              key={setName}
              className="rounded-lg border border-line bg-white shadow-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">{setName}</div>
                  <div className="text-xs text-ink-500">
                    {setOwned} / {cards.length} • {setPct}%
                  </div>
                </div>
                <div className="w-32 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className="h-full bg-feebay-500"
                    style={{ width: `${setPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-7 gap-3">
                {cards.map((c) => {
                  const entry = collection[c.id];
                  const ownedCard = !!entry;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setDetailCardId(c.id)}
                      className={`flex flex-col items-center gap-1 cursor-pointer hover:opacity-90 ${
                        ownedCard ? '' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
                      }`}
                      title={ownedCard ? `${c.name} • ${entry.totalOwned} owned` : `${c.name} — not yet owned`}
                    >
                      <CardArt name={c.name} rarity={c.rarity} hue={c.hue} cardId={c.id} small />
                      <div className="text-[10px] text-center text-ink-700 w-20 truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center gap-1 text-[9px]">
                        {ownedCard ? (
                          <>
                            <span className="text-ebayGreen-600">×{entry.totalOwned}</span>
                            {entry.bestGrade !== undefined && (
                              <span
                                className={`px-1 rounded ${
                                  entry.bestGrade >= 10
                                    ? 'bg-amber-300 text-ink-900'
                                    : entry.bestGrade >= 9
                                    ? 'bg-emerald-300 text-ink-900'
                                    : 'bg-ink-100 text-ink-800'
                                }`}
                              >
                                {entry.bestGrade}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-ink-400">Not owned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {detailCardId && (
        <CardDetailModal kind="card" cardId={detailCardId} onClose={() => setDetailCardId(null)} />
      )}
    </div>
  );
}
