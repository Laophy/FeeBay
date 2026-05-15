import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CardArt } from './CardArt';
import { SFX } from '../game/audio';
import { Icon } from './Icon';
import type { CardRarity, InventoryItem, LotReveal } from '../types';

const RARITY_RANK: Record<CardRarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  'Holo Rare': 4,
  'First Edition': 5,
  Signed: 6,
  'Secret Rare': 7,
  'Error Print': 8,
  'Mythic Rare': 9,
  'Prototype Card': 10,
};

const RARITY_HEX: Record<CardRarity, string> = {
  Common: '#64748b',
  Uncommon: '#86b817',
  Rare: '#0064d2',
  'Holo Rare': '#a855f7',
  'First Edition': '#10b981',
  Signed: '#f5af02',
  'Secret Rare': '#e53238',
  'Error Print': '#e53238',
  'Mythic Rare': '#f5af02',
  'Prototype Card': '#ec4899',
};

function rank(r: CardRarity): number {
  return RARITY_RANK[r] ?? 0;
}

function isBigPull(rarity: CardRarity): boolean {
  return rank(rarity) >= 7;
}

function isJackpot(rarity: CardRarity): boolean {
  return rank(rarity) >= 9;
}

export function LotRevealModal() {
  const reveals = useGameStore((s) => s.pendingLotReveals);
  const inventory = useGameStore((s) => s.inventory);
  const consume = useGameStore((s) => s.consumeLotReveal);
  const lot = reveals[0];
  const items = useMemo(
    () =>
      lot ? lot.itemIds.map((id) => inventory.find((i) => i.id === id)!).filter(Boolean) : [],
    [lot, inventory],
  );

  const [phase, setPhase] = useState<'pack' | 'revealing' | 'done'>('pack');
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [bigPullCount, setBigPullCount] = useState(0);
  const [jackpotPulled, setJackpotPulled] = useState(false);

  useEffect(() => {
    if (!lot) return;
    setPhase('pack');
    setFlippedIds(new Set());
    setBigPullCount(0);
    setJackpotPulled(false);
    SFX.whoosh();
    const t = setTimeout(
      () => setPhase('revealing'),
      lot.lotKind === 'storage_unit' ? 1400 : 1100,
    );
    return () => clearTimeout(t);
  }, [lot?.id]);

  useEffect(() => {
    if (phase !== 'revealing' || !lot) return;
    const isStorage = lot.lotKind === 'storage_unit';
    let baseDelay = 240;
    if (isStorage) baseDelay = 90;
    else if (items.length > 6) baseDelay = 170;

    const timers: number[] = [];
    items.forEach((item, idx) => {
      const id = window.setTimeout(() => {
        setFlippedIds((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
        const r = rank(item.rarity);
        if (r >= 9) {
          SFX.chaching();
          setBigPullCount((c) => c + 1);
          setJackpotPulled(true);
        } else if (r >= 7) {
          SFX.chaching();
          setBigPullCount((c) => c + 1);
        } else if (r >= 4 && !isStorage) {
          SFX.coin();
        } else {
          SFX.cardFlip();
        }
      }, idx * baseDelay + 80);
      timers.push(id);
    });
    const doneId = window.setTimeout(
      () => setPhase('done'),
      items.length * baseDelay + 1100,
    );
    timers.push(doneId);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, items, lot]);

  function skipReveal() {
    setFlippedIds(new Set(items.map((i) => i.id)));
    setPhase('done');
  }

  if (!lot) return null;

  const isStorage = lot.lotKind === 'storage_unit';
  const cardCount = items.length;
  const totalCurrent = items.reduce((s, i) => s + i.baseValue, 0);
  const profit = totalCurrent - lot.pricePaid;
  const bestRarity = items.reduce<CardRarity>((best, i) => {
    return rank(i.rarity) > rank(best) ? i.rarity : best;
  }, 'Common');

  // Layout sizing
  const cols =
    cardCount <= 1
      ? 1
      : cardCount <= 4
      ? 4
      : cardCount <= 6
      ? 3
      : cardCount <= 9
      ? 3
      : cardCount <= 16
      ? 5
      : cardCount <= 25
      ? 6
      : 7;
  const cardSize: 'lg' | 'md' | 'sm' =
    cardCount <= 6 ? 'lg' : cardCount <= 12 ? 'md' : 'sm';

  const kindLabel = isStorage
    ? 'Storage Unit'
    : lot.lotKind === 'binder'
    ? 'Binder Lot'
    : lot.lotKind === 'slab_bag'
    ? 'Slab Bag'
    : 'Mystery Lot';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/70 backdrop-blur-sm p-6 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto rounded-2xl border border-line bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${
                isStorage
                  ? 'bg-feebay-50 text-feebay-600'
                  : 'bg-ebayYellow-500/15 text-ebayYellow-700'
              }`}
            >
              <Icon name={isStorage ? 'box' : 'package'} size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-bold">
                Opening · {lot.source}
              </div>
              <div className="font-black text-lg text-ink-900 truncate">{kindLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Stat label="Paid" value={`$${lot.pricePaid}`} muted />
            <Stat label="Cards" value={`${cardCount}`} muted />
            {phase === 'done' && (
              <Stat label="Lot value" value={`$${totalCurrent}`} accent="text-ebayGreen-700" />
            )}
            {phase === 'done' && (
              <Stat
                label="Net"
                value={`${profit >= 0 ? '+' : ''}$${profit.toFixed(0)}`}
                accent={profit >= 0 ? 'text-ebayGreen-700' : 'text-ebayRed-600'}
              />
            )}
          </div>
        </div>

        {/* Stage area */}
        <div className="relative bg-paper border-b border-line min-h-[420px] flex items-center justify-center px-6 py-8">
          {phase === 'pack' ? (
            <PackStage lot={lot} kindLabel={kindLabel} />
          ) : (
            <div className="w-full flex items-center justify-center">
              <div
                className="grid gap-3 justify-center"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  maxWidth: `${cols * (cardSize === 'lg' ? 150 : cardSize === 'md' ? 120 : 96)}px`,
                }}
              >
                {items.map((item, idx) => (
                  <FlipSlot
                    key={item.id}
                    item={item}
                    flipped={flippedIds.has(item.id)}
                    size={cardSize}
                    delayIdx={idx % 12}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          {phase !== 'done' ? (
            <>
              <div className="text-sm text-ink-600">
                {phase === 'pack'
                  ? 'Cracking it open…'
                  : bigPullCount > 0
                  ? `${bigPullCount} big pull${bigPullCount === 1 ? '' : 's'} so far`
                  : 'Ripping pack…'}
              </div>
              <button
                onClick={skipReveal}
                className="text-xs px-3 py-1.5 rounded-md border border-line text-ink-700 hover:border-ink-400 bg-white"
              >
                Skip reveal
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <BestPullChip rarity={bestRarity} />
                {bigPullCount > 0 && (
                  <div className="text-xs text-ink-700">
                    <span className="font-bold text-ebayYellow-700">{bigPullCount}</span>{' '}
                    big pull{bigPullCount === 1 ? '' : 's'}
                  </div>
                )}
              </div>
              <button
                onClick={() => consume(lot.id)}
                className="px-5 py-2 rounded-md bg-feebay-500 hover:bg-feebay-600 text-white text-sm font-bold shadow-md shadow-feebay-700/20"
              >
                Add to inventory
              </button>
            </>
          )}
        </div>
      </div>

      {jackpotPulled && phase === 'done' && <Confetti />}

      <style>{`
        @keyframes packBob {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-6px) rotate(1.5deg); }
        }
        @keyframes packGlow {
          0%, 100% { box-shadow: 0 8px 30px rgba(15,23,42,0.15); }
          50% { box-shadow: 0 12px 50px rgba(245,175,2,0.45); }
        }
        @keyframes slotEnter {
          0% { opacity: 0; transform: translateY(16px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.5; }
        }
        .pack-bob { animation: packBob 1.8s ease-in-out infinite; }
        .pack-glow { animation: packGlow 1.6s ease-in-out infinite; }
        .slot-enter { animation: slotEnter 0.4s ease-out backwards; }
      `}</style>
    </div>
  );
}

/* ---------- Pack stage ---------- */

function PackStage({ lot, kindLabel }: { lot: LotReveal; kindLabel: string }) {
  const isStorage = lot.lotKind === 'storage_unit';
  const isSlabBag = lot.lotKind === 'slab_bag';
  const packClass = isStorage
    ? 'h-56 w-44 border-feebay-700 bg-gradient-to-br from-feebay-500 via-feebay-600 to-feebay-800'
    : isSlabBag
    ? 'h-56 w-40 border-cyan-300 bg-gradient-to-br from-cyan-600 via-teal-700 to-slate-900'
    : 'h-56 w-40 border-ebayRed-700 bg-gradient-to-br from-ebayRed-500 via-ebayRed-600 to-ebayRed-700';
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative pack-bob pack-glow rounded-2xl border-4 flex flex-col items-center justify-center overflow-hidden text-white ${packClass}`}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 9px)',
          }}
        />
        <Icon name={isStorage ? 'box' : 'package'} size={isStorage ? 80 : 72} />
        <div className="relative mt-3 font-black tracking-widest uppercase text-sm">
          {kindLabel}
        </div>
        <div className="relative mt-0.5 text-[10px] uppercase tracking-widest text-white/85 font-bold">
          {lot.source}
        </div>
      </div>
      <div className="text-xs uppercase tracking-[0.3em] text-ink-500 font-bold">
        Opening…
      </div>
    </div>
  );
}

/* ---------- Card flip slot ---------- */

const SIZE_PX: Record<'lg' | 'md' | 'sm', { h: number; w: number }> = {
  lg: { h: 192, w: 134 },
  md: { h: 152, w: 106 },
  sm: { h: 116, w: 82 },
};

function FlipSlot({
  item,
  flipped,
  size,
  delayIdx,
}: {
  item: InventoryItem;
  flipped: boolean;
  size: 'lg' | 'md' | 'sm';
  delayIdx: number;
}) {
  const dims = SIZE_PX[size];
  const big = isBigPull(item.rarity);
  return (
    <div
      className="slot-enter"
      style={{
        perspective: '900px',
        width: dims.w,
        height: dims.h,
        animationDelay: `${delayIdx * 40}ms`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(.2,.85,.2,1), box-shadow 0.4s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          boxShadow:
            flipped && big
              ? `0 0 24px ${RARITY_HEX[item.rarity]}88, 0 4px 12px rgba(15,23,42,0.2)`
              : '0 2px 6px rgba(15,23,42,0.1)',
          borderRadius: '8px',
        }}
      >
        {/* Back face (visible when not flipped) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <CardBack size={size} />
        </div>
        {/* Front face (visible when flipped) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardArt
            name={item.name}
            rarity={item.rarity}
            hue={item.hue}
            cardId={item.cardId}
            grade={item.grade}
            gradingCompany={item.gradingCompany}
            centeringOffsetX={item.centeringOffsetX}
            centeringOffsetY={item.centeringOffsetY}
            small={size !== 'lg'}
          />
        </div>
      </div>
    </div>
  );
}

function CardBack({ size }: { size: 'lg' | 'md' | 'sm' }) {
  return (
    <div
      className="w-full h-full rounded-md overflow-hidden flex items-center justify-center relative border-2 border-feebay-600"
      style={{
        background:
          'linear-gradient(145deg, #0064d2 0%, #003f87 60%, #001f40 100%)',
      }}
    >
      <div
        className="absolute inset-2 rounded-sm border border-white/15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 8px), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 60%)',
        }}
      />
      <div className="relative font-black tracking-widest opacity-95 select-none">
        <span
          className={
            size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'
          }
        >
          <span className="text-ebayRed-400">F</span>
          <span className="text-white">B</span>
        </span>
      </div>
      <div
        className={`absolute bottom-1 left-1 right-1 text-center text-white/60 ${
          size === 'sm' ? 'text-[7px]' : 'text-[8px]'
        } uppercase tracking-widest`}
      >
        FeeBay
      </div>
    </div>
  );
}

/* ---------- Footer best-pull chip ---------- */

function BestPullChip({ rarity }: { rarity: CardRarity }) {
  const color = RARITY_HEX[rarity];
  const big = rank(rarity) >= 7;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white"
      style={{ borderColor: color }}
    >
      <span className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
        Best pull
      </span>
      <span
        className={`text-sm ${big ? 'font-black' : 'font-bold'}`}
        style={{ color }}
      >
        {rarity}
      </span>
    </div>
  );
}

/* ---------- Header stats ---------- */

function Stat({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-md px-2.5 py-1.5 border ${
        muted ? 'bg-ink-100 border-line' : 'bg-white border-line'
      }`}
    >
      <div className="text-[9px] uppercase tracking-widest text-ink-500 font-bold">
        {label}
      </div>
      <div className={`text-sm font-black ${accent ?? 'text-ink-900'}`}>{value}</div>
    </div>
  );
}

/* ---------- Confetti ---------- */

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.4 + Math.random() * 1.6;
        const palette = ['#e53238', '#0064d2', '#f5af02', '#86b817', '#ec4899'];
        const color = palette[Math.floor(Math.random() * palette.length)];
        const size = 6 + Math.random() * 7;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-5%',
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confettiFall ${duration}s linear ${delay}s 1`,
              borderRadius: '2px',
            }}
          />
        );
      })}
    </div>
  );
}
