import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Icon } from '../../components/Icon';

export function MarketTrends() {
  const trends = useGameStore((s) => s.marketTrends);
  const trigger = useGameStore((s) => s.triggerMarketEvent);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const notes = useGameStore((s) => s.notifications);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const hasTracker = upgrades.includes('market_tracker');
  const eventHistory = notes.filter((n) => n.kind === 'event').slice(0, 12);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Market Trends</h1>
          <p className="text-ink-500 text-sm">
            Tags pumping or dumping right now. Time the market or get rugged.
          </p>
        </div>
        <button
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-line hover:border-ink-400 text-ink-700"
          onClick={trigger}
        >
          <Icon name="bolt" size={14} /> Force market event
        </button>
      </div>

      {!hasTracker && (
        <div className="rounded border border-ebayYellow-700/50 bg-ebayYellow-500/10 text-ebayYellow-700 text-xs p-3">
          Tip: buy the <span className="font-semibold">Market Tracker Dashboard</span> upgrade to see exact multipliers.
        </div>
      )}

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="text-sm font-semibold mb-3">Active trends ({trends.length})</div>
        {trends.length === 0 ? (
          <div className="text-sm text-ink-500">No trends right now. Markets are quiet.</div>
        ) : (
          <ul className="space-y-2">
            {trends.map((t, idx) => {
              const remainingMs = Math.max(0, t.expiresAt - Date.now());
              return (
                <li
                  key={idx}
                  className={`rounded border px-3 py-2 flex items-center justify-between gap-3 ${
                    t.direction === 'up'
                      ? 'border-ebayGreen-500/50 bg-ebayGreen-500/10'
                      : 'border-ebayRed-500/50 bg-ebayRed-500/10'
                  }`}
                >
                  <div className="text-sm">{t.label}</div>
                  <div className="flex items-center gap-3 text-xs text-ink-700">
                    <span>tag: <span className="font-mono">{t.tag}</span></span>
                    {hasTracker ? (
                      <span>×{t.multiplier.toFixed(2)}</span>
                    ) : (
                      <Icon
                        name={t.direction === 'up' ? 'chart-up' : 'chart-down'}
                        size={14}
                        className={t.direction === 'up' ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
                      />
                    )}
                    <span className="text-ink-400">{Math.ceil(remainingMs / 1000)}s</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="text-sm font-semibold mb-3">Event history</div>
        {eventHistory.length === 0 ? (
          <div className="text-sm text-ink-500">No events yet.</div>
        ) : (
          <ul className="space-y-1 text-sm text-feebay-700">
            {eventHistory.map((n) => (
              <li key={n.id}>• {n.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
