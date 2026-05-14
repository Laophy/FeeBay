import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CARDS } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { cardsBySet, collectionPercent } from '../../game/collection';
import { CardDetailModal } from '../../components/CardDetailModal';

export function Collection() {
  const collection = useGameStore((s) => s.collection);
  const sets = useMemo(() => cardsBySet(), []);
  const totalUnique = CARDS.length;
  const owned = Object.keys(collection).length;
  const percent = collectionPercent(collection);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Collection Codex</h1>
        <p className="text-slate-400 text-sm">
          Every fictional card you've ever held, grouped by set. Track set completion and your best grade per card.
        </p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Overall</div>
            <div className="text-2xl font-bold text-amber-300">
              {owned} / {totalUnique}{' '}
              <span className="text-sm text-slate-400">({percent}%)</span>
            </div>
          </div>
          <div className="text-xs text-slate-400">Unique cards owned (lifetime)</div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-feebay-400"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(sets).map(([setName, cards]) => {
          const setOwned = cards.filter((c) => collection[c.id]).length;
          const setPct = Math.round((setOwned / cards.length) * 100);
          return (
            <div
              key={setName}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">{setName}</div>
                  <div className="text-xs text-slate-400">
                    {setOwned} / {cards.length} • {setPct}%
                  </div>
                </div>
                <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
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
                      <div className="text-[10px] text-center text-slate-300 w-20 truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center gap-1 text-[9px]">
                        {ownedCard ? (
                          <>
                            <span className="text-emerald-300">×{entry.totalOwned}</span>
                            {entry.bestGrade !== undefined && (
                              <span
                                className={`px-1 rounded ${
                                  entry.bestGrade >= 10
                                    ? 'bg-amber-300 text-slate-900'
                                    : entry.bestGrade >= 9
                                    ? 'bg-emerald-300 text-slate-900'
                                    : 'bg-slate-700 text-slate-200'
                                }`}
                              >
                                {entry.bestGrade}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500">Not owned</span>
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
