import { memo, useMemo, useState } from 'react';
import { useGameStore, vaultStableFor } from '../../store/useGameStore';
import { CARDS } from '../../data/cards';
import type { CardDef, CollectionEntry } from '../../types';
import { CardArt } from '../../components/CardArt';
import { cardsBySet, collectionPercent } from '../../game/collection';
import { calculateCurrentValue } from '../../game/economyEngine';
import { CardDetailModal } from '../../components/CardDetailModal';
import { Icon } from '../../components/Icon';

export function Collection() {
  const collection = useGameStore((s) => s.collection);
  const inventory = useGameStore((s) => s.inventory);
  const showcaseIds = useGameStore((s) => s.showcaseItemIds);
  const toggleShowcase = useGameStore((s) => s.toggleShowcase);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const sets = useMemo(() => cardsBySet(), []);
  const totalUnique = CARDS.length;
  const owned = Object.keys(collection).length;
  const percent = collectionPercent(collection);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [editShowcase, setEditShowcase] = useState(false);

  // 1st Edition sets float to the top of the codex.
  const sortedSets = useMemo(() => {
    return Object.entries(sets).sort(([a], [b]) => {
      const aFe = a.includes('1st Edition') ? 0 : 1;
      const bFe = b.includes('1st Edition') ? 0 : 1;
      return aFe - bFe;
    });
  }, [sets]);

  const showcaseItems = useMemo(
    () => inventory.filter((i) => showcaseIds.includes(i.id)),
    [inventory, showcaseIds],
  );

  const showcaseValue = useMemo(
    () =>
      showcaseItems.reduce(
        (sum, i) =>
          sum +
          calculateCurrentValue(i, trends, noise, convention, vaultStableFor({ upgradesPurchased: upgrades })),
        0,
      ),
    [showcaseItems, trends, noise, convention, upgrades],
  );

  // Build a doubled marquee track so the showcase scrolls in a seamless loop.
  const marquee = useMemo(() => {
    if (showcaseItems.length === 0) return { track: [] as typeof showcaseItems, dur: 30 };
    const reps = Math.max(1, Math.ceil(8 / showcaseItems.length));
    const sequence = Array.from({ length: reps }, () => showcaseItems).flat();
    const dur = Math.max(16, Math.round((sequence.length * 128) / 46));
    return { track: [...sequence, ...sequence], dur };
  }, [showcaseItems]);
  const heavyShowcase = showcaseItems.length > 14;

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
      <div className="rounded-xl border-2 border-ebayYellow-500 bg-gradient-to-br from-ebayYellow-500/10 to-white shadow-card p-4">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-ebayYellow-500/20 text-ebayYellow-700 flex items-center justify-center">
              <Icon name="crown" size={18} />
            </div>
            <div>
              <div className="font-black text-ink-900">Showcase</div>
              <div className="text-xs text-ink-500">
                {editShowcase
                  ? 'Tap the red button on a card to take it off display.'
                  : 'Your prized cards on an endless display loop.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-base font-black text-ebayGreen-700 leading-tight">
                ${showcaseValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">
                {showcaseItems.length} card{showcaseItems.length === 1 ? '' : 's'} on display
              </div>
            </div>
            {showcaseItems.length > 0 && (
              <button
                onClick={() => setEditShowcase((e) => !e)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest border-2 transition inline-flex items-center gap-1.5 ${
                  editShowcase
                    ? 'bg-ebayGreen-500 hover:bg-ebayGreen-600 text-white border-ebayGreen-600'
                    : 'bg-white hover:bg-ink-100 text-ink-700 border-line'
                }`}
              >
                <Icon name={editShowcase ? 'check' : 'filter'} size={13} />
                {editShowcase ? 'Done' : 'Edit'}
              </button>
            )}
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
        ) : editShowcase ? (
          // Edit mode — static grid, every card removable.
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-1">
            {showcaseItems.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-2" title={item.name}>
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
                    animated={!heavyShowcase}
                  />
                  <button
                    onClick={() => toggleShowcase(item.id)}
                    className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-ebayRed-500 hover:bg-ebayRed-600 text-white flex items-center justify-center shadow-md border-2 border-white transition"
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
        ) : (
          // Display mode — endless scrolling marquee on a light display stage.
          <div className="showcase-stage relative mt-1 overflow-hidden rounded-lg border border-line bg-paper shadow-inner">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-20 z-10"
              style={{
                background:
                  'radial-gradient(ellipse at 50% -45%, rgba(245,175,2,0.2), transparent 70%)',
              }}
            />
            <div
              className="showcase-track py-10"
              style={{ ['--showcase-dur' as string]: `${marquee.dur}s` }}
            >
              {marquee.track.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="px-3 shrink-0 flex flex-col items-center gap-2"
                >
                  <div className="showcase-card drop-shadow-[0_8px_14px_rgba(15,23,42,0.22)]">
                    <CardArt
                      name={item.name}
                      rarity={item.rarity}
                      hue={item.hue}
                      cardId={item.cardId}
                      grade={item.grade}
                      gradingCompany={item.gradingCompany}
                      centeringOffsetX={item.centeringOffsetX}
                      centeringOffsetY={item.centeringOffsetY}
                      animated={!heavyShowcase}
                    />
                  </div>
                  <div className="w-28 truncate text-center text-[10px] font-bold text-ink-600">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-paper to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-paper to-transparent" />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {sortedSets.map(([setName, cards]) => {
          const setOwned = cards.filter((c) => collection[c.id]).length;
          const setPct = Math.round((setOwned / cards.length) * 100);
          const isFirstEd = setName.includes('1st Edition');
          return (
            <div
              key={setName}
              className={`cv-auto rounded-lg border bg-white shadow-card p-4 ${
                isFirstEd ? 'border-ebayYellow-500' : 'border-line'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {setName}
                    {isFirstEd && (
                      <span className="text-[9px] uppercase tracking-widest font-black bg-ebayYellow-500 text-ink-900 rounded px-1.5 py-0.5">
                        1st Ed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500">
                    {setOwned} / {cards.length} • {setPct}%
                  </div>
                </div>
                <div className="w-32 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className={`h-full ${isFirstEd ? 'bg-ebayYellow-500' : 'bg-feebay-500'}`}
                    style={{ width: `${setPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-7 gap-3">
                {cards.map((c) => (
                  <CodexCard
                    key={c.id}
                    card={c}
                    entry={collection[c.id]}
                    onSelect={setDetailCardId}
                  />
                ))}
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

const CodexCard = memo(function CodexCard({
  card,
  entry,
  onSelect,
}: {
  card: CardDef;
  entry: CollectionEntry | undefined;
  onSelect: (id: string) => void;
}) {
  const owned = !!entry;
  // Rainbow rares (and anything above holo) stay a mystery until collected.
  const hidden = !owned && card.variant === 'rainbow';
  return (
    <div
      onClick={() => {
        if (!hidden) onSelect(card.id);
      }}
      className={`group flex flex-col items-center gap-1 ${hidden ? 'cursor-default' : 'cursor-pointer'}`}
      title={
        hidden
          ? 'Hidden rainbow rare — collect one to reveal it'
          : owned
          ? `${card.name} • ${entry!.totalOwned} owned`
          : `${card.name} — not yet owned`
      }
    >
      <div
        className={`codex-card relative group-hover:z-10 group-hover:drop-shadow-xl ${
          owned
            ? ''
            : hidden
            ? 'opacity-65 group-hover:opacity-100'
            : 'opacity-45 grayscale group-hover:grayscale-0 group-hover:opacity-100'
        }`}
      >
        {hidden ? (
          <MysteryCard />
        ) : (
          <CardArt name={card.name} rarity={card.rarity} hue={card.hue} cardId={card.id} small animated={false} />
        )}
      </div>
      <div
        className={`text-[10px] text-center w-20 truncate ${
          hidden ? 'text-ink-400 font-bold tracking-widest' : 'text-ink-700 group-hover:text-ink-900'
        }`}
      >
        {hidden ? '???' : card.name}
      </div>
      <div className="flex items-center gap-1 text-[9px]">
        {hidden ? (
          <span className="text-ink-400">Locked</span>
        ) : owned ? (
          <>
            <span className="text-ebayGreen-600">×{entry!.totalOwned}</span>
            {entry!.bestGrade !== undefined && (
              <span
                className={`px-1 rounded ${
                  entry!.bestGrade >= 10
                    ? 'bg-amber-300 text-ink-900'
                    : entry!.bestGrade >= 9
                    ? 'bg-emerald-300 text-ink-900'
                    : 'bg-ink-100 text-ink-800'
                }`}
              >
                {entry!.bestGrade}
              </span>
            )}
          </>
        ) : (
          <span className="text-ink-400">Not owned</span>
        )}
      </div>
    </div>
  );
});

/** Placeholder shown for un-collected rainbow rares — rainbow frame, no reveal. */
function MysteryCard() {
  return (
    <div
      className="h-24 w-16 rounded-md p-[2px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #ff5d5d, #f5af02, #86b817, #38bdf8, #a855f7)',
      }}
    >
      <div className="h-full w-full rounded-[3px] bg-gradient-to-b from-ink-700 to-ink-900 flex flex-col items-center justify-center gap-1">
        <span className="text-2xl font-black text-white/45 leading-none">?</span>
        <Icon name="lock" size={11} className="text-white/35" />
      </div>
    </div>
  );
}
