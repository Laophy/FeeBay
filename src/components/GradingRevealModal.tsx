import { useGameStore } from '../store/useGameStore';
import { CardArt } from './CardArt';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SFX } from '../game/audio';
import { Icon } from './Icon';
import { money } from '../game/format';

export function GradingRevealModal() {
  const reveals = useGameStore((s) => s.pendingGradeReveals);
  const inventory = useGameStore((s) => s.inventory);
  const consume = useGameStore((s) => s.consumeGradeReveal);
  const reveal = reveals[0];
  const [phase, setPhase] = useState<'flip' | 'show'>('flip');

  useEffect(() => {
    if (!reveal) return;
    setPhase('flip');
    SFX.slabCrack();
    const t = setTimeout(() => {
      setPhase('show');
      SFX.gradeReveal(reveal.grade);
    }, 1200);
    return () => clearTimeout(t);
  }, [reveal?.submissionId]);

  if (!reveal) return null;
  const item = inventory.find((i) => i.id === reveal.itemId);
  if (!item) return null;

  const purchase = item.purchasePrice;
  const profit = reveal.finalValue - purchase;
  const isGem = reveal.grade >= 10;
  const isStrong = reveal.grade >= 9;
  const gradeColor = isGem
    ? 'text-ebayYellow-700'
    : isStrong
    ? 'text-ebayGreen-600'
    : reveal.grade >= 8
    ? 'text-feebay-600'
    : reveal.grade > 0
    ? 'text-ink-800'
    : 'text-ebayRed-500';

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4 ${
        isGem ? 'animate-pulse' : ''
      }`}
    >
      {isGem && phase === 'show' && <ConfettiBurst />}
      <div className="w-[440px] rounded-xl border border-line bg-white p-6 shadow-2xl animate-popIn">
        <div className="text-center text-xs uppercase tracking-widest text-ink-500">
          {reveal.company} Grading — Result
        </div>
        <div className="mt-2 text-center text-lg font-semibold">{item.name}</div>
        <div className="mt-5 flex justify-center">
          <div className={phase === 'flip' ? 'animate-flip' : ''}>
            <CardArt
              name={item.name}
              rarity={item.rarity}
              hue={item.hue}
              grade={phase === 'show' ? reveal.grade : undefined}
              gradingCompany={phase === 'show' ? reveal.company : undefined}
              cardId={item.cardId}
              centeringOffsetX={item.centeringOffsetX}
              centeringOffsetY={item.centeringOffsetY}
            />
          </div>
        </div>
        {phase === 'show' ? (
          <>
            <div className={`mt-5 text-center text-5xl font-black ${gradeColor} ${isGem ? 'animate-popIn' : ''}`}>
              {reveal.grade === 0 ? 'AUTH FAIL' : reveal.gradeLabel}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Paid" value={money(purchase)} />
              <Stat label="Graded value" value={money(reveal.finalValue)} />
            </div>
            <div
              className={`mt-3 rounded-md border px-3 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 ${
                profit >= 0
                  ? 'border-ebayGreen-500 bg-ebayGreen-500/10 text-ebayGreen-700'
                  : 'border-ebayRed-500 bg-ebayRed-500/10 text-ebayRed-600'
              }`}
            >
              <Icon name={profit >= 0 ? 'chart-up' : 'chart-down'} size={16} />
              {profit >= 0
                ? `Potential profit: +${money(profit)}`
                : `Potential loss: ${money(profit)}`}
            </div>
            <button
              onClick={() => consume(reveal.submissionId)}
              className="mt-5 w-full rounded bg-feebay-500 hover:bg-feebay-600 text-white py-2 font-semibold"
            >
              Continue
            </button>
          </>
        ) : (
          <div className="mt-6 text-center text-ink-500 text-sm">Cracking the slab...</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-ink-100 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function ConfettiBurst() {
  // Pure-CSS confetti rain. ~30 chips falling.
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
