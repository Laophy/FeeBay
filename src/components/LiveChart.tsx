import { useId, useState } from 'react';

function fmtMoney(n: number): string {
  const a = Math.abs(Math.round(n));
  return `${n < 0 ? '-' : ''}$${a.toLocaleString()}`;
}

/** Selectable time windows — seconds of history to show. */
const CHART_WINDOWS: { label: string; sec: number }[] = [
  { label: '1m', sec: 60 },
  { label: '5m', sec: 300 },
  { label: '15m', sec: 900 },
  { label: '30m', sec: 1800 },
];

/**
 * Live line chart of a running dollar value (company profit, net worth, ...).
 * Self-contained card: a current-value ticker, ▲/▼ delta, time-frame buttons,
 * and a Y axis that fits each window so movement stays visible.
 */
export function LiveChart({
  title,
  history,
  current,
  secondsPerSample = 1,
  className = '',
}: {
  title: string;
  history: number[];
  current: number;
  /** How many seconds each `history` entry represents (profit 1s, net worth 5s). */
  secondsPerSample?: number;
  className?: string;
}) {
  const [windowSec, setWindowSec] = useState(300);
  const gid = useId().replace(/:/g, '');

  // Slice to the chosen window, then append the live value as the tip.
  const sampleCount = Math.ceil(windowSec / secondsPerSample);
  const slice = history.slice(-sampleCount);
  const pts = slice.length > 0 ? [...slice, current] : [];
  const hasData = pts.length >= 2;

  const spanSec = slice.length * secondsPerSample;
  const windowLabel =
    spanSec >= 60 ? `${Math.floor(spanSec / 60)}m ${spanSec % 60}s` : `${spanSec}s`;
  const delta = hasData ? current - pts[0] : 0;
  const up = delta >= 0;
  // The view can't reach further back than history recorded since game open.
  const notEnoughData = hasData && spanSec < windowSec;

  const W = 100;
  const H = 40;
  let line = '';
  let area = '';
  let zeroY: number | null = null;
  if (hasData) {
    // Fit the Y axis to this window's range (not anchored to 0) so the line
    // uses the full height — short windows reveal fine-grained movement.
    const dMin = Math.min(...pts);
    const dMax = Math.max(...pts);
    const spread = dMax - dMin;
    const pad = spread > 0 ? spread * 0.16 : Math.max(1, Math.abs(dMax) * 0.05);
    const lo = dMin - pad;
    const hi = dMax + pad;
    const range = hi - lo || 1;
    const x = (i: number) => (i / (pts.length - 1)) * W;
    const y = (v: number) => H - ((v - lo) / range) * H;
    line = pts
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
      .join(' ');
    area = `${line} L${W.toFixed(2)} ${H} L0 ${H} Z`;
    if (lo < 0 && hi > 0) zeroY = y(0);
  }
  const tone = current >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500';

  return (
    <div
      className={`rounded-xl border border-line bg-white shadow-card overflow-hidden ${className}`}
    >
      <div className="flex items-end justify-between flex-wrap gap-2 px-5 pt-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
            {title}
          </div>
          <div className={`text-2xl font-black leading-tight ${tone}`}>
            {fmtMoney(current)}
          </div>
        </div>
        {hasData && (
          <div className="text-right">
            <div
              className={`text-sm font-bold ${
                up ? 'text-ebayGreen-600' : 'text-ebayRed-500'
              }`}
            >
              {up ? '▲' : '▼'} {fmtMoney(delta)}
            </div>
            <div className="text-[10px] text-ink-400">last {windowLabel}</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-5 pt-2">
        <div className="flex gap-1">
          {CHART_WINDOWS.map((w) => (
            <button
              key={w.sec}
              onClick={() => setWindowSec(w.sec)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                windowSec === w.sec
                  ? 'bg-feebay-500 text-white'
                  : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div
          className={`text-[10px] italic text-ink-400 transition-opacity duration-500 pointer-events-none ${
            notEnoughData ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Not enough history for this window yet — showing all {windowLabel}.
        </div>
      </div>
      <div className="px-2 pb-2 pt-1.5">
        {hasData ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className={`w-full h-24 block ${tone}`}
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {zeroY !== null && (
              <line
                x1="0"
                y1={zeroY}
                x2={W}
                y2={zeroY}
                stroke="#d4d4d8"
                strokeWidth="0.6"
                strokeDasharray="1.6 1.6"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <path d={area} fill={`url(#${gid})`} />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : (
          <div className="h-24 flex items-center justify-center text-center text-[11px] text-ink-400 px-4">
            Gathering data — the chart fills in as you play.
          </div>
        )}
      </div>
    </div>
  );
}
