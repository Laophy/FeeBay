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

const RARITY_GLOW: Record<CardRarity, string> = {
  Common: '0 0 0 rgba(0,0,0,0)',
  Uncommon: '0 0 18px rgba(34,197,94,0.35)',
  Rare: '0 0 22px rgba(59,130,246,0.45)',
  'Holo Rare': '0 0 28px rgba(168,85,247,0.6)',
  'First Edition': '0 0 26px rgba(52,211,153,0.55)',
  Signed: '0 0 28px rgba(253,224,71,0.55)',
  'Secret Rare': '0 0 32px rgba(244,63,94,0.65)',
  'Error Print': '0 0 30px rgba(239,68,68,0.65)',
  'Mythic Rare': '0 0 40px rgba(251,191,36,0.75)',
  'Prototype Card': '0 0 38px rgba(236,72,153,0.75)',
};

function isBigPull(rarity: CardRarity): boolean {
  return (RARITY_RANK[rarity] ?? 0) >= 7;
}

function isJackpot(rarity: CardRarity): boolean {
  return (RARITY_RANK[rarity] ?? 0) >= 9;
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
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [bigPullCount, setBigPullCount] = useState(0);
  const [jackpotPulled, setJackpotPulled] = useState(false);

  // Reset when a new lot enters
  useEffect(() => {
    if (!lot) return;
    setPhase('pack');
    setFlippedIds(new Set());
    setSpotlight(null);
    setBigPullCount(0);
    setJackpotPulled(false);
    SFX.whoosh();
    const t = setTimeout(
      () => setPhase('revealing'),
      lot.lotKind === 'storage_unit' ? 1500 : 1200,
    );
    return () => clearTimeout(t);
  }, [lot?.id]);

  // Reveal phase: stagger flips
  useEffect(() => {
    if (phase !== 'revealing' || !lot) return;
    const isStorage = lot.lotKind === 'storage_unit';
    // Base flip cadence
    let baseDelay = 260;
    if (isStorage) baseDelay = 95;
    else if (items.length > 6) baseDelay = 180;

    const timers: number[] = [];
    items.forEach((item, idx) => {
      const id = window.setTimeout(() => {
        setFlippedIds((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
        const rank = RARITY_RANK[item.rarity] ?? 1;
        if (rank >= 7) {
          SFX.chaching();
          setSpotlight(item.id);
          setBigPullCount((c) => c + 1);
          if (rank >= 9) setJackpotPulled(true);
          window.setTimeout(() => setSpotlight((s) => (s === item.id ? null : s)), 950);
        } else if (rank >= 4 && !isStorage) {
          SFX.coin();
        } else {
          SFX.cardFlip();
        }
      }, idx * baseDelay + 80);
      timers.push(id);
    });
    const doneId = window.setTimeout(
      () => setPhase('done'),
      items.length * baseDelay + 1200,
    );
    timers.push(doneId);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, items, lot]);

  function skipReveal() {
    setFlippedIds(new Set(items.map((i) => i.id)));
    setSpotlight(null);
    setPhase('done');
  }

  if (!lot) return null;

  const isStorage = lot.lotKind === 'storage_unit';
  const cardCount = items.length;
  const totalCurrent = items.reduce((s, i) => s + i.baseValue, 0);
  const profit = totalCurrent - lot.pricePaid;
  const bestRarity = items.reduce<CardRarity>((best, i) => {
    return (RARITY_RANK[i.rarity] ?? 0) > (RARITY_RANK[best] ?? 0) ? i.rarity : best;
  }, 'Common');

  // Grid layout adapts to card count
  const cols =
    cardCount <= 4 ? 4 : cardCount <= 6 ? 3 : cardCount <= 9 ? 3 : cardCount <= 16 ? 5 : cardCount <= 25 ? 6 : 7;
  // Card size shrinks for big lots
  const cardSize = cardCount <= 6 ? 'lg' : cardCount <= 12 ? 'md' : 'sm';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 overflow-y-auto"
      style={{
        background:
          'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.96) 0%, rgba(0,0,0,0.98) 80%)',
      }}
    >
      <div className="w-full max-w-[1100px] my-auto flex flex-col items-center gap-4">
        {/* Header chip */}
        <div className="px-5 py-2 rounded-full bg-slate-950/90 border border-slate-700 shadow-lg backdrop-blur-md text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
            {isStorage ? 'Storage unit' : lot.lotKind === 'binder' ? 'Binder lot' : 'Mystery lot'}
            <span className="mx-2 text-slate-600">•</span>
            From {lot.source}
          </div>
          <div className="mt-0.5 text-sm text-slate-200">
            Paid <span className="text-emerald-300 font-semibold">${lot.pricePaid}</span>
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-white font-semibold">{cardCount}</span> cards
            {phase === 'done' && bigPullCount > 0 && (
              <>
                <span className="mx-2 text-slate-600">•</span>
                <span className="text-amber-300 font-semibold">
                  {bigPullCount} big pull{bigPullCount === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Pack OR card grid — render directly on the dim backdrop, no container chrome */}
        {phase === 'pack' ? (
          <PackStage lot={lot} />
        ) : (
          <div
            className="grid gap-3 justify-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              maxWidth: `${cols * (cardSize === 'lg' ? 150 : cardSize === 'md' ? 120 : 92)}px`,
            }}
          >
            {items.map((item, idx) => (
              <FlipSlot
                key={item.id}
                item={item}
                flipped={flippedIds.has(item.id)}
                size={cardSize}
                delayClass={`reveal-delay-${idx % 12}`}
                spotlight={spotlight === item.id}
              />
            ))}
          </div>
        )}

        {/* Big pull HUD */}
        {phase === 'revealing' && spotlight && (
          <SpotlightOverlay item={items.find((i) => i.id === spotlight)!} />
        )}

        {/* Bottom controls / summary */}
        {phase !== 'done' ? (
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={skipReveal}
              className="px-4 py-1.5 rounded border border-slate-700 hover:border-slate-500 text-slate-300 bg-slate-950/70 backdrop-blur-sm"
            >
              Skip reveal
            </button>
            <span className="text-slate-400 px-3 py-1 rounded bg-slate-950/70 backdrop-blur-sm border border-slate-800">
              {bigPullCount > 0
                ? `${bigPullCount} big pull${bigPullCount === 1 ? '' : 's'}…`
                : phase === 'pack'
                ? 'Cracking it open…'
                : 'Ripping pack…'}
            </span>
          </div>
        ) : (
          <SummaryPanel
            bestRarity={bestRarity}
            totalCurrent={totalCurrent}
            profit={profit}
            pricePaid={lot.pricePaid}
            bigPullCount={bigPullCount}
            onContinue={() => consume(lot.id)}
          />
        )}
      </div>

      {jackpotPulled && phase === 'done' && <Confetti />}

      <style>{`
        @keyframes packShake {
          0%, 100% { transform: translateX(0) rotate(0); }
          15% { transform: translateX(-3px) rotate(-2deg); }
          30% { transform: translateX(4px) rotate(2deg); }
          45% { transform: translateX(-2px) rotate(-1deg); }
          60% { transform: translateX(3px) rotate(1.5deg); }
          75% { transform: translateX(-2px) rotate(-1.5deg); }
        }
        @keyframes packPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(255,255,255,0.1), inset 0 0 0 2px rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 80px rgba(255,255,255,0.35), inset 0 0 0 2px rgba(255,255,255,0.25); }
        }
        @keyframes slotAppear {
          0% { opacity: 0; transform: translateY(20px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spotlightPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes summarySlide {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.6; }
        }
        .pack-shake { animation: packShake 0.55s ease-in-out 2; }
        .pack-pulse { animation: packPulse 1.6s ease-in-out infinite; }
        .slot-appear { animation: slotAppear 0.4s ease-out backwards; }
        .reveal-delay-0  { animation-delay: 0ms; }
        .reveal-delay-1  { animation-delay: 40ms; }
        .reveal-delay-2  { animation-delay: 80ms; }
        .reveal-delay-3  { animation-delay: 120ms; }
        .reveal-delay-4  { animation-delay: 160ms; }
        .reveal-delay-5  { animation-delay: 200ms; }
        .reveal-delay-6  { animation-delay: 240ms; }
        .reveal-delay-7  { animation-delay: 280ms; }
        .reveal-delay-8  { animation-delay: 320ms; }
        .reveal-delay-9  { animation-delay: 360ms; }
        .reveal-delay-10 { animation-delay: 400ms; }
        .reveal-delay-11 { animation-delay: 440ms; }
        .spotlight-pop { animation: spotlightPop 0.45s cubic-bezier(.2,.8,.2,1) forwards; }
        .summary-slide { animation: summarySlide 0.45s ease-out forwards; }
      `}</style>
    </div>
  );
}

/* ---------- Pack stage (closed pack/box/binder before reveal) ---------- */

function PackStage({ lot }: { lot: LotReveal }) {
  const isStorage = lot.lotKind === 'storage_unit';
  const isBinder = lot.lotKind === 'binder';
  return (
    <div className="relative h-72 w-72 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full pack-pulse" />
      <div
        className={`relative pack-shake rounded-xl border-2 shadow-2xl flex flex-col items-center justify-center overflow-hidden ${
          isStorage
            ? 'h-56 w-48 border-purple-400/70 bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900'
            : isBinder
            ? 'h-60 w-44 border-amber-400/70 bg-gradient-to-br from-amber-700 via-amber-800 to-slate-900'
            : 'h-56 w-40 border-amber-400/70 bg-gradient-to-br from-orange-600 via-red-700 to-red-900'
        }`}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0 2px, transparent 2px 8px)',
          }}
        />
        <Icon
          name={isStorage ? 'box' : 'package'}
          size={isStorage ? 96 : 80}
          className="text-white drop-shadow-xl"
        />
        <div className="relative mt-3 text-white font-black tracking-widest uppercase text-sm drop-shadow">
          {isStorage ? 'Storage unit' : isBinder ? 'Binder' : 'Mystery lot'}
        </div>
        <div className="relative mt-1 text-white/85 text-[10px] uppercase tracking-widest">
          {lot.source}
        </div>
      </div>
      <div className="absolute -bottom-6 text-xs text-slate-400 uppercase tracking-widest">
        Cracking it open…
      </div>
    </div>
  );
}

/* ---------- Card flip slot ---------- */

const SIZE_PX: Record<'lg' | 'md' | 'sm', { h: number; w: number; label: number }> = {
  lg: { h: 192, w: 134, label: 11 },
  md: { h: 152, w: 106, label: 10 },
  sm: { h: 112, w: 80, label: 9 },
};

function FlipSlot({
  item,
  flipped,
  size,
  delayClass,
  spotlight,
}: {
  item: InventoryItem;
  flipped: boolean;
  size: 'lg' | 'md' | 'sm';
  delayClass: string;
  spotlight: boolean;
}) {
  const dims = SIZE_PX[size];
  const glow = RARITY_GLOW[item.rarity];
  const showBigPull = flipped && isBigPull(item.rarity);
  return (
    <div
      className={`slot-appear ${delayClass}`}
      style={{
        perspective: '900px',
        width: dims.w,
        height: dims.h,
        filter: spotlight ? 'brightness(1.15)' : undefined,
        transition: 'filter 0.4s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.62s cubic-bezier(.2,.85,.2,1), box-shadow 0.4s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          boxShadow: flipped && showBigPull ? glow : undefined,
          borderRadius: '6px',
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
      className="w-full h-full rounded-md border-2 border-slate-700 overflow-hidden flex items-center justify-center"
      style={{
        background:
          'linear-gradient(145deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(148,163,184,0.2), 0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="absolute inset-2 rounded-sm border border-slate-700"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(96,165,250,0.08) 0 2px, transparent 2px 8px), radial-gradient(circle at 50% 50%, rgba(96,165,250,0.18) 0%, transparent 60%)',
        }}
      />
      <div className="relative text-feebay-400 font-black tracking-widest opacity-80">
        <span className={size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base'}>
          FB
        </span>
      </div>
      <div
        className={`absolute bottom-1 left-1 right-1 text-center text-feebay-500/60 ${
          size === 'sm' ? 'text-[7px]' : 'text-[8px]'
        } uppercase tracking-widest`}
      >
        FeeBay
      </div>
    </div>
  );
}

/* ---------- Spotlight HUD for big pulls during reveal ---------- */

function SpotlightOverlay({ item }: { item: InventoryItem }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-1/2 z-[5] flex justify-center"
      style={{ transform: 'translateY(-200px)' }}
    >
      <div
        className="spotlight-pop px-5 py-2 rounded-full border backdrop-blur-md"
        style={{
          left: '50%',
          background: 'rgba(15,23,42,0.85)',
          borderColor: rarityHexBorder(item.rarity),
          boxShadow: `0 0 30px ${rarityHexBorder(item.rarity)}88`,
        }}
      >
        <div className="flex items-center gap-2">
          <Icon name="sparkle" size={16} style={{ color: rarityHexBorder(item.rarity) }} />
          <span
            className="text-xs uppercase tracking-[0.25em] font-bold"
            style={{ color: rarityHexBorder(item.rarity) }}
          >
            {item.rarity}!
          </span>
          <span className="text-sm font-semibold text-white">{item.name}</span>
        </div>
      </div>
    </div>
  );
}

function rarityHexBorder(rarity: CardRarity): string {
  switch (rarity) {
    case 'Mythic Rare':
      return '#fbbf24';
    case 'Prototype Card':
      return '#ec4899';
    case 'Secret Rare':
      return '#f43f5e';
    case 'Error Print':
      return '#ef4444';
    case 'Signed':
      return '#fde047';
    case 'Holo Rare':
      return '#a855f7';
    case 'First Edition':
      return '#34d399';
    case 'Rare':
      return '#3b82f6';
    case 'Uncommon':
      return '#22c55e';
    default:
      return '#94a3b8';
  }
}

/* ---------- End-of-reveal summary ---------- */

function SummaryPanel({
  bestRarity,
  totalCurrent,
  profit,
  pricePaid,
  bigPullCount,
  onContinue,
}: {
  bestRarity: CardRarity;
  totalCurrent: number;
  profit: number;
  pricePaid: number;
  bigPullCount: number;
  onContinue: () => void;
}) {
  const isWin = profit >= 0;
  return (
    <div className="summary-slide w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/85 backdrop-blur-sm p-5 shadow-2xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Best pull"
          value={bestRarity}
          accent={(RARITY_RANK[bestRarity] ?? 0) >= 7 ? 'text-amber-300' : 'text-slate-200'}
        />
        <Stat label="Big pulls" value={`${bigPullCount}`} accent="text-purple-300" />
        <Stat label="Lot value" value={`$${totalCurrent}`} accent="text-feebay-300" />
        <Stat
          label="Net vs paid"
          value={`${isWin ? '+' : ''}$${profit.toFixed(0)}`}
          accent={isWin ? 'text-emerald-300' : 'text-rose-300'}
          big
        />
      </div>
      <div className="mt-3 text-[11px] text-slate-500 text-center">
        Paid ${pricePaid} • {isWin ? 'Profitable rip' : 'Took a hit — happens.'}
      </div>
      <button
        onClick={onContinue}
        className="mt-4 w-full rounded bg-feebay-600 hover:bg-feebay-500 py-2.5 text-sm font-semibold"
      >
        Add to inventory
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-md bg-slate-800/70 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`${big ? 'text-lg' : 'text-sm'} font-semibold ${accent ?? 'text-slate-100'}`}>
        {value}
      </div>
    </div>
  );
}

/* ---------- Confetti rain on jackpot pulls ---------- */

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.4 + Math.random() * 1.6;
        const hue = Math.floor(Math.random() * 360);
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
              background: `hsl(${hue}, 90%, 60%)`,
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
