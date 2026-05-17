function fmtMoney(n: number): string {
  const a = Math.abs(Math.round(n));
  return `${n < 0 ? '-' : ''}$${a.toLocaleString()}`;
}

/**
 * Live line chart of cumulative company profit, sampled once per second.
 * Self-contained card — drop it anywhere. Used on the Employees tab and the
 * Dashboard's workforce panel.
 */
export function ProfitChart({ history, current }: { history: number[]; current: number }) {
  const pts = history.length > 0 ? [...history, current] : [];
  const hasData = pts.length >= 2;

  const windowSec = history.length;
  const windowLabel =
    windowSec >= 60
      ? `${Math.floor(windowSec / 60)}m ${windowSec % 60}s`
      : `${windowSec}s`;
  const delta = hasData ? current - pts[0] : 0;
  const up = delta >= 0;

  const W = 100;
  const H = 40;
  let line = '';
  let area = '';
  let zeroY: number | null = null;
  if (hasData) {
    const lo = Math.min(...pts, 0);
    const hi = Math.max(...pts, lo + 1);
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
    <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
      <div className="flex items-end justify-between flex-wrap gap-2 px-5 pt-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
            Company profit · live
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
      <div className="px-2 pb-2 pt-1.5">
        {hasData ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className={`w-full h-24 block ${tone}`}
          >
            <defs>
              <linearGradient id="feebayProfitFill" x1="0" y1="0" x2="0" y2="1">
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
            <path d={area} fill="url(#feebayProfitFill)" />
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
            Collecting profit data — the chart fills in as your team works.
          </div>
        )}
      </div>
    </div>
  );
}
