import { useEffect, useState } from 'react';
import { APP_VERSION } from '../version';

const LETTERS: { char: string; color: string }[] = [
  { char: 'F', color: '#e53238' },
  { char: 'e', color: '#0064d2' },
  { char: 'e', color: '#f5af02' },
  { char: 'B', color: '#86b817' },
  { char: 'a', color: '#e53238' },
  { char: 'y', color: '#0064d2' },
];

type Props = {
  onDone: () => void;
  /** Total time the splash stays visible (excluding fade-out). */
  durationMs?: number;
};

export function LoadingScreen({ onDone, durationMs = 2400 }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeStart = window.setTimeout(() => setFading(true), durationMs);
    const finish = window.setTimeout(onDone, durationMs + 500);
    return () => {
      window.clearTimeout(fadeStart);
      window.clearTimeout(finish);
    };
  }, [durationMs, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center bg-paper transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle radial gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(0,100,210,0.06) 0%, rgba(245,246,247,1) 65%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <div className="flex items-baseline gap-0.5">
          {LETTERS.map((l, i) => (
            <span
              key={i}
              className="splash-letter font-black tracking-tight"
              style={{
                color: l.color,
                fontSize: '90px',
                lineHeight: 1,
                animationDelay: `${i * 130}ms`,
                display: 'inline-block',
              }}
            >
              {l.char}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-ink-500 font-bold">
            Simulator
          </span>
          <span className="text-[10px] tracking-widest text-ink-400 font-bold tabular-nums">
            {APP_VERSION}
          </span>
        </div>
        <div className="splash-dots flex items-center gap-1.5 mt-2">
          <span className="dot" style={{ background: '#e53238', animationDelay: '0ms' }} />
          <span className="dot" style={{ background: '#0064d2', animationDelay: '150ms' }} />
          <span className="dot" style={{ background: '#f5af02', animationDelay: '300ms' }} />
          <span className="dot" style={{ background: '#86b817', animationDelay: '450ms' }} />
        </div>
      </div>

      <style>{`
        @keyframes letterBounce {
          0%   { transform: translateY(0)     scale(1, 1); }
          15%  { transform: translateY(-46px) scale(0.94, 1.12); }
          30%  { transform: translateY(0)     scale(1.18, 0.78); }
          45%  { transform: translateY(-12px) scale(0.98, 1.05); }
          60%  { transform: translateY(0)     scale(1.05, 0.95); }
          80%  { transform: translateY(0)     scale(1, 1); }
          100% { transform: translateY(0)     scale(1, 1); }
        }
        .splash-letter {
          animation: letterBounce 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
          transform-origin: 50% 100%;
          will-change: transform;
        }

        @keyframes dotPulse {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50%      { transform: translateY(-6px) scale(1.2); opacity: 1; }
        }
        .splash-dots .dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          animation: dotPulse 1.2s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
