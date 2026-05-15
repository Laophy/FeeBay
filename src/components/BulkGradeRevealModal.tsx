import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/useGameStore';
import { CardArt } from './CardArt';
import { SFX } from '../game/audio';
import { Icon } from './Icon';
import type { BulkGradeReveal } from '../types';

type Phase = 'intro' | 'flip' | 'show' | 'summary';

const FLIP_MS = 350;
const SHOW_NORMAL_MS = 420;
const SHOW_GEM_MS = 1900;
const INTRO_MS = 350;

export function BulkGradeRevealModal() {
  const reveals = useGameStore((s) => s.pendingBulkReveal);
  const consume = useGameStore((s) => s.consumeBulkReveal);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const sessionId = reveals.length > 0 ? reveals[0].itemId : null;

  // Reset whenever a new bulk reveal session begins.
  useEffect(() => {
    setIndex(0);
    setPhase(reveals.length === 0 ? 'intro' : 'intro');
  }, [sessionId]);

  // Phase clock — drives the step-through.
  useEffect(() => {
    if (reveals.length === 0) return;

    if (phase === 'intro') {
      const t = setTimeout(() => setPhase('flip'), INTRO_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'flip') {
      SFX.slabCrack();
      const t = setTimeout(() => {
        const grade = reveals[index]?.grade ?? 0;
        SFX.gradeReveal(grade);
        setPhase('show');
      }, FLIP_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'show') {
      const grade = reveals[index]?.grade ?? 0;
      const dwell = grade >= 10 ? SHOW_GEM_MS : SHOW_NORMAL_MS;
      const t = setTimeout(() => {
        if (index + 1 >= reveals.length) {
          SFX.chaching();
          setPhase('summary');
        } else {
          setIndex((i) => i + 1);
          setPhase('flip');
        }
      }, dwell);
      return () => clearTimeout(t);
    }
  }, [phase, index, reveals]);

  const totals = useMemo(() => {
    const gems = reveals.filter((r) => r.grade >= 10).length;
    const totalProfit = reveals.reduce((s, r) => s + r.profit, 0);
    const totalValue = reveals.reduce((s, r) => s + r.finalValue, 0);
    const totalPaid = reveals.reduce((s, r) => s + r.paid, 0);
    const sorted = [...reveals].sort((a, b) => b.grade - a.grade);
    return { gems, totalProfit, totalValue, totalPaid, best: sorted[0] ?? null };
  }, [reveals]);

  if (reveals.length === 0) return null;
  const current = reveals[index];
  const isGem = phase === 'show' && current && current.grade >= 10;
  const runningProfit = runningTotal(reveals, index, phase, (r) => r.profit);
  const gemsSoFar = countGems(reveals, index, phase);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4">
      {isGem && <ConfettiBurst />}
      <div className="w-[460px] max-w-full rounded-xl border border-line bg-white p-6 shadow-2xl animate-popIn">
        {phase === 'summary' ? (
          <>
            <div className="text-center text-xs uppercase tracking-[0.3em] text-ink-500 font-bold">
              Bulk reveal complete
            </div>
            <div className="mt-2 text-center text-2xl font-black text-ink-900">
              {reveals.length} slab{reveals.length === 1 ? '' : 's'} revealed
            </div>
            {totals.gems > 0 && (
              <div className="mt-1 text-center text-sm font-bold text-ebayYellow-700">
                ✦ {totals.gems} gem 10{totals.gems === 1 ? '' : 's'} pulled
              </div>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Stat
                label="Total paid (grading)"
                value={`$${totals.totalPaid.toFixed(2)}`}
                accent="text-ebayRed-600"
              />
              <Stat
                label="Total est. value"
                value={`$${totals.totalValue.toFixed(2)}`}
                accent="text-ebayGreen-700"
              />
            </div>
            <div
              className={`mt-3 rounded-md border px-3 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 ${
                totals.totalProfit >= 0
                  ? 'border-ebayGreen-500 bg-ebayGreen-500/10 text-ebayGreen-700'
                  : 'border-ebayRed-500 bg-ebayRed-500/10 text-ebayRed-600'
              }`}
            >
              <Icon name={totals.totalProfit >= 0 ? 'chart-up' : 'chart-down'} size={16} />
              {totals.totalProfit >= 0
                ? `Net potential profit: +$${totals.totalProfit.toFixed(2)}`
                : `Net potential loss: $${totals.totalProfit.toFixed(2)}`}
            </div>
            {totals.best && (
              <div className="mt-3 text-center text-[11px] text-ink-500">
                Best of the run:{' '}
                <span className={`font-bold ${gradeColor(totals.best.grade)}`}>
                  {totals.best.company} {totals.best.gradeLabel}
                </span>{' '}
                on <span className="text-ink-900 font-semibold">{totals.best.cardName}</span>
              </div>
            )}
            <button
              onClick={consume}
              className="mt-5 w-full rounded bg-feebay-500 hover:bg-feebay-600 text-white py-2 font-semibold"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-ink-500 font-bold">
              <span>
                Revealing {Math.min(index + 1, reveals.length)} / {reveals.length}
              </span>
              <button
                onClick={() => setPhase('summary')}
                className="text-[10px] uppercase tracking-widest text-ink-400 hover:text-ink-700 font-bold"
              >
                Skip »
              </button>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full bg-ebayYellow-500 transition-all duration-150"
                style={{
                  width: `${((index + (phase === 'show' ? 1 : 0.5)) / reveals.length) * 100}%`,
                }}
              />
            </div>
            <div className="mt-4 text-center text-sm font-semibold truncate">{current.cardName}</div>
            <div className="mt-3 flex justify-center">
              <div className={phase === 'flip' || phase === 'intro' ? 'animate-flip' : ''}>
                <CardArt
                  name={current.cardName}
                  rarity={current.rarity}
                  hue={current.hue}
                  cardId={current.cardId}
                  grade={phase === 'show' ? current.grade : undefined}
                  gradingCompany={phase === 'show' ? current.company : undefined}
                  centeringOffsetX={current.centeringOffsetX}
                  centeringOffsetY={current.centeringOffsetY}
                />
              </div>
            </div>
            {phase === 'show' && (
              <>
                <div
                  className={`mt-4 text-center text-4xl font-black ${gradeColor(current.grade)} ${
                    isGem ? 'animate-popIn' : ''
                  }`}
                >
                  {current.grade === 0 ? 'AUTH FAIL' : current.gradeLabel}
                </div>
                <div
                  className={`mt-3 rounded-md border px-3 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-2 ${
                    current.profit >= 0
                      ? 'border-ebayGreen-500 bg-ebayGreen-500/10 text-ebayGreen-700'
                      : 'border-ebayRed-500 bg-ebayRed-500/10 text-ebayRed-600'
                  }`}
                >
                  <Icon name={current.profit >= 0 ? 'chart-up' : 'chart-down'} size={13} />
                  {current.profit >= 0 ? '+' : ''}${current.profit.toFixed(2)} vs paid $
                  {current.paid.toFixed(2)}
                </div>
              </>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-ink-500">
              <div className="rounded-md border border-line bg-paper px-2 py-1.5">
                <div className="uppercase tracking-widest font-bold text-ink-400">Running profit</div>
                <div
                  className={`text-sm font-black ${
                    runningProfit >= 0 ? 'text-ebayGreen-700' : 'text-ebayRed-600'
                  }`}
                >
                  {runningProfit >= 0 ? '+' : ''}${runningProfit.toFixed(2)}
                </div>
              </div>
              <div className="rounded-md border border-line bg-paper px-2 py-1.5">
                <div className="uppercase tracking-widest font-bold text-ink-400">Gems so far</div>
                <div className="text-sm font-black text-ebayYellow-700">
                  {gemsSoFar} / {totals.gems}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function gradeColor(g: number): string {
  return g >= 10
    ? 'text-ebayYellow-700'
    : g >= 9
    ? 'text-ebayGreen-600'
    : g >= 8
    ? 'text-feebay-600'
    : g > 0
    ? 'text-ink-800'
    : 'text-ebayRed-500';
}

function runningTotal(
  queue: BulkGradeReveal[],
  index: number,
  phase: Phase,
  fn: (r: BulkGradeReveal) => number,
): number {
  const upto = phase === 'show' ? index + 1 : index;
  return queue.slice(0, upto).reduce((s, r) => s + fn(r), 0);
}

function countGems(queue: BulkGradeReveal[], index: number, phase: Phase): number {
  const upto = phase === 'show' ? index + 1 : index;
  return queue.slice(0, upto).filter((r) => r.grade >= 10).length;
}

function Stat({
  label,
  value,
  accent = 'text-ink-900',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md bg-paper border border-line px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`font-black ${accent}`}>{value}</div>
    </div>
  );
}

function ConfettiBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 36 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 1.2 + Math.random() * 1.2;
        const hue = Math.floor(Math.random() * 360);
        const size = 6 + Math.random() * 6;
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
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
