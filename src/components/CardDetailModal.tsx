import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getCardById } from '../data/cards';
import { CardArt } from './CardArt';
import { Icon } from './Icon';
import { Sparkline } from './Sparkline';
import {
  centeringLabel,
  centeringLean,
  centeringScore,
} from '../game/centering';
import { calculateCurrentValue } from '../game/economyEngine';
import type { GradingCompanyId, InventoryItem, MarketplaceSource } from '../types';
import { GRADING_COMPANIES } from '../data/gradingCompanies';

type Props =
  | { kind: 'item'; item: InventoryItem; onClose: () => void }
  | { kind: 'card'; cardId: string; onClose: () => void };

export function CardDetailModal(props: Props) {
  const cardId = props.kind === 'item' ? props.item.cardId : props.cardId;
  const card = getCardById(cardId);

  const watchedIds = useGameStore((s) => s.watchedCardIds);
  const toggleWatch = useGameStore((s) => s.toggleWatch);
  const noise = useGameStore((s) => s.marketNoise);
  const trends = useGameStore((s) => s.marketTrends);
  const collection = useGameStore((s) => s.collection);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const unlocked = useGameStore((s) => s.marketplacesUnlocked);
  const sell = useGameStore((s) => s.sellInventoryItem);
  const grade = useGameStore((s) => s.sendToGrading);

  const isWatched = watchedIds.includes(cardId);
  const collectionEntry = collection[cardId];
  const currentNoise = noise[cardId] ?? 1;
  const driftPct = +((currentNoise - 1) * 100).toFixed(1);
  const activeTrends = trends.filter((t) => card.trendTags.includes(t.tag));

  // Build a 60-sample history feed for the per-card sparkline.
  // We snapshot the noise every refresh of this modal — synthetic but immediate.
  const [history, setHistory] = useState<{ t: number; v: number }[]>([]);
  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev, { t: Date.now(), v: currentNoise }];
      return next.slice(-60);
    });
  }, [currentNoise]);

  const item = props.kind === 'item' ? props.item : null;
  const currentItemValue = useMemo(
    () => (item ? calculateCurrentValue(item, trends, noise) : null),
    [item, trends, noise],
  );

  const availableCompanies = GRADING_COMPANIES.filter((c) => upgrades.includes(c.unlockUpgradeId));
  const sellableMarkets: MarketplaceSource[] =
    item && item.status === 'graded'
      ? unlocked.filter((m) => m === 'SlabHub' || m === 'FeeBay')
      : unlocked.filter((m) => m !== 'SlabHub');

  return (
    <div className="fixed inset-0 z-[58] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={props.onClose}>
      <div
        className="w-[min(720px,95vw)] max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-5">
          <CardArt
            name={card.name}
            rarity={card.rarity}
            hue={card.hue}
            cardId={card.id}
            grade={item?.grade}
            gradingCompany={item?.gradingCompany}
            centeringOffsetX={item?.centeringOffsetX ?? 0}
            centeringOffsetY={item?.centeringOffsetY ?? 0}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  {card.character} • {card.set}
                </div>
                <h2 className="text-xl font-bold">{card.name}</h2>
              </div>
              <button
                onClick={() => toggleWatch(card.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border ${
                  isWatched
                    ? 'border-amber-500/60 bg-amber-900/30 text-amber-200'
                    : 'border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
              >
                <Icon name={isWatched ? 'check' : 'eye'} size={14} />
                {isWatched ? 'Watching' : 'Watch'}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Pill label="Rarity" value={card.rarity} accent="text-amber-300" />
              <Pill
                label="Market"
                value={`${driftPct >= 0 ? '+' : ''}${driftPct.toFixed(1)}%`}
                accent={
                  Math.abs(driftPct) < 0.5
                    ? 'text-slate-200'
                    : driftPct > 0
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }
              />
              <Pill label="Base value" value={`$${card.baseValue}`} />
              <Pill label="Popularity" value={`${card.popularity}/100`} />
              <Pill label="Supply" value={`${card.supply}/100`} />
              <Pill label="Volatility" value={`${card.volatility}/100`} />
              <Pill label="Grade potential" value={`${card.gradePotential}/100`} />
              <Pill
                label="Trend tags"
                value={card.trendTags.join(', ') || 'none'}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Market drift (live)
          </div>
          <Sparkline data={history} width={640} height={70} />
        </div>

        {activeTrends.length > 0 && (
          <div className="mt-4 rounded border border-purple-500/40 bg-purple-900/15 p-3">
            <div className="text-xs uppercase tracking-widest text-purple-300 mb-2">
              Active trends affecting this card
            </div>
            <ul className="space-y-1 text-sm text-purple-200">
              {activeTrends.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>{t.label}</span>
                  <span className="font-mono text-xs">×{t.multiplier.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
              Your copy
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <Pill label="Status" value={item.status} />
              <Pill label="Condition" value={item.rawCondition} />
              <Pill
                label="Centering"
                value={`${centeringScore(item.centeringOffsetX, item.centeringOffsetY)}/100`}
              />
              <Pill
                label="Lean"
                value={
                  centeringLean(item.centeringOffsetX, item.centeringOffsetY) ||
                  centeringLabel(item.centeringOffsetX, item.centeringOffsetY)
                }
              />
              <Pill label="Paid" value={`$${item.purchasePrice.toFixed(2)}`} />
              <Pill
                label="Current value"
                value={`$${currentItemValue}`}
                accent="text-feebay-300"
              />
              {item.grade !== undefined && (
                <Pill
                  label="Grade"
                  value={item.gradeLabel ?? `${item.grade}`}
                  accent={item.grade >= 9 ? 'text-amber-300' : 'text-slate-200'}
                />
              )}
              <Pill label="Acquired from" value={item.acquiredFrom} />
            </div>

            {item.status === 'raw' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sellableMarkets.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      sell(item.id, m);
                      props.onClose();
                    }}
                    className="text-xs px-2 py-1.5 rounded bg-feebay-600 hover:bg-feebay-500"
                  >
                    Sell on {m}
                  </button>
                ))}
                {availableCompanies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      grade(item.id, c.id);
                      props.onClose();
                    }}
                    className="text-xs px-2 py-1.5 rounded bg-purple-700 hover:bg-purple-600"
                  >
                    Grade @ {c.id}
                  </button>
                ))}
              </div>
            )}
            {item.status === 'graded' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sellableMarkets.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      sell(item.id, m);
                      props.onClose();
                    }}
                    className="text-xs px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500"
                  >
                    Sell slab on {m}
                  </button>
                ))}
              </div>
            )}
            {item.status === 'grading' && (
              <div className="mt-3 text-xs text-slate-400">Waiting on grade result...</div>
            )}
          </div>
        )}

        {collectionEntry && (
          <div className="mt-4 rounded border border-slate-800 bg-slate-900/40 p-3">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
              Collection history
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Pill label="Lifetime owned" value={`×${collectionEntry.totalOwned}`} />
              <Pill
                label="Best grade"
                value={collectionEntry.bestGrade !== undefined ? `${collectionEntry.bestGrade}` : '—'}
                accent="text-amber-300"
              />
              <Pill
                label="First acquired"
                value={new Date(collectionEntry.firstAcquiredAt).toLocaleDateString()}
              />
            </div>
          </div>
        )}

        <button
          onClick={props.onClose}
          className="mt-5 w-full rounded border border-slate-700 hover:border-slate-500 py-2 text-sm"
        >
          Close
        </button>
      </div>
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
    <div className="rounded bg-slate-800/70 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-xs font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
