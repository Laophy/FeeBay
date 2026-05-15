import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { GRADING_COMPANIES } from '../../data/gradingCompanies';

export function Grading() {
  const submissions = useGameStore((s) => s.gradingSubmissions);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const inventory = useGameStore((s) => s.inventory);
  const stats = useGameStore((s) => s.stats);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Grading</h1>
        <p className="text-ink-500 text-sm">
          Three graders. Different costs, speeds, premiums, and chaos levels. Pick your fighter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GRADING_COMPANIES.map((c) => {
          const unlocked = upgrades.includes(c.unlockUpgradeId);
          return (
            <div
              key={c.id}
              className={`rounded-lg border p-4 ${
                unlocked ? 'border-line bg-white shadow-card' : 'border-line bg-ink-100 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{c.name}</div>
                <span
                  className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
                    unlocked
                      ? 'bg-emerald-900/60 text-ebayGreen-700'
                      : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {unlocked ? 'Member' : 'Locked'}
                </span>
              </div>
              <div className="text-xs text-ink-500 mt-1">{c.tagline}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Stat label="Cost" value={`$${c.cost}`} />
                <Stat label="Speed" value={`${c.turnaroundMs / 1000}s`} />
                <Stat
                  label="Resale"
                  value={`×${c.resaleMultiplier.toFixed(2)}`}
                  accent={c.resaleMultiplier >= 1 ? 'text-ebayGreen-600' : 'text-ebayYellow-700'}
                />
              </div>
              <div className="mt-2 text-[11px] text-ink-400">
                Chaos: {(c.chaosChance * 100).toFixed(0)}% chance of upset grade
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="text-sm font-semibold mb-3">Active submissions ({submissions.length})</div>
        {submissions.length === 0 ? (
          <div className="text-sm text-ink-500">
            Nothing in grading. Go to Inventory and submit a sharp card.
          </div>
        ) : (
          <ul className="space-y-2">
            {submissions.map((s) => {
              const remaining = Math.max(0, s.resolveAt - Date.now());
              const totalLen = s.resolveAt - s.submittedAt;
              const pct = Math.min(100, Math.max(0, ((totalLen - remaining) / totalLen) * 100));
              const item = inventory.find((i) => i.id === s.itemId);
              return (
                <li key={s.id} className="rounded border border-line bg-ink-100 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {s.cardName}
                      {item?.rarity ? <span className="text-ink-500 text-xs"> • {item.rarity}</span> : null}
                      <span className="text-feebay-600 text-xs ml-2">@ {s.company}</span>
                    </span>
                    <span className="text-ink-500 text-xs">{Math.ceil(remaining / 1000)}s</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full bg-feebay-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="text-sm font-semibold mb-3">Grade history</div>
        {Object.keys(stats.gradesReceived).length === 0 ? (
          <div className="text-sm text-ink-500">No grades received yet. Send your first card.</div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {Object.entries(stats.gradesReceived)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([g, count]) => (
                <div
                  key={g}
                  className={`rounded px-3 py-2 text-sm border ${
                    g === '10'
                      ? 'border-ebayYellow-500 bg-amber-900/30 text-ebayYellow-700'
                      : 'border-line bg-ink-100'
                  }`}
                >
                  <div className="text-xs uppercase tracking-widest text-ink-500">Grade {g}</div>
                  <div className="font-semibold">×{count}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-ink-900' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded bg-ink-100 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-400">{label}</div>
      <div className={`font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
