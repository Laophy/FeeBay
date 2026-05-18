import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { GRADING_COMPANIES } from '../../data/gradingCompanies';
import { GradingRevealModal } from '../../components/GradingRevealModal';
import { BulkGradeRevealModal } from '../../components/BulkGradeRevealModal';
import { CardArt } from '../../components/CardArt';
import { Icon } from '../../components/Icon';
import { money } from '../../game/format';

export function Grading() {
  const submissions = useGameStore((s) => s.gradingSubmissions);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const inventory = useGameStore((s) => s.inventory);
  const stats = useGameStore((s) => s.stats);
  const gradingHistory = useGameStore((s) => s.gradingHistory);
  const revealGrading = useGameStore((s) => s.revealGradingSubmission);
  const revealAll = useGameStore((s) => s.revealAllReadyGrading);
  const hasMassReveal = upgrades.includes('mass_grade_reveal');

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
                  className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                    unlocked
                      ? 'bg-ebayGreen-500/15 border-ebayGreen-500/50 text-ebayGreen-700'
                      : 'bg-ink-100 border-line text-ink-500'
                  }`}
                >
                  {unlocked ? 'Member' : 'Locked'}
                </span>
              </div>
              <div className="text-xs text-ink-500 mt-1">{c.tagline}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Stat label="Grade fee" value={money(c.cost)} />
                <Stat label="Shipping" value={money(c.shippingFee)} accent="text-ebayYellow-700" />
                <Stat label="Speed" value={`${c.turnaroundMs / 1000}s`} />
                <Stat
                  label="Resale"
                  value={`×${c.resaleMultiplier.toFixed(2)}`}
                  accent={c.resaleMultiplier >= 1 ? 'text-ebayGreen-600' : 'text-ebayYellow-700'}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-ink-400">
                  Chaos: {(c.chaosChance * 100).toFixed(0)}% upset
                </span>
                <span className="text-ink-700 font-semibold">
                  Total <span className="text-ink-900">{money(c.cost + c.shippingFee)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="text-sm font-semibold">Active submissions ({submissions.length})</div>
          <div className="flex items-center gap-2">
            {submissions.some((s) => Date.now() >= s.resolveAt) && (
              <div className="text-[11px] uppercase tracking-widest font-bold text-ebayGreen-700 flex items-center gap-1">
                <Icon name="sparkle" size={12} />
                {submissions.filter((s) => Date.now() >= s.resolveAt).length} ready
              </div>
            )}
            {submissions.some((s) => Date.now() >= s.resolveAt) &&
              (hasMassReveal ? (
                <button
                  onClick={revealAll}
                  className="rounded-md bg-feebay-500 hover:bg-feebay-600 text-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border-2 border-feebay-600 shadow-sm inline-flex items-center gap-1.5"
                  title="Crack every ready slab at once"
                >
                  <Icon name="bolt" size={12} />
                  Reveal All
                </button>
              ) : (
                <button
                  disabled
                  className="rounded-md bg-ink-100 text-ink-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border-2 border-line inline-flex items-center gap-1.5 cursor-not-allowed"
                  title="Unlock the Mass-Reveal Cracker upgrade in the Upgrades tab to crack every ready slab at once."
                >
                  <Icon name="lock" size={12} />
                  Reveal All
                </button>
              ))}
          </div>
        </div>
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
              const ready = remaining <= 0;
              return (
                <li
                  key={s.id}
                  className={`rounded-md border px-3 py-2.5 transition ${
                    ready
                      ? 'border-ebayGreen-500/60 bg-ebayGreen-500/10'
                      : 'border-line bg-paper'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item && (
                      <div className="shrink-0">
                        <CardArt
                          name={item.name}
                          rarity={item.rarity}
                          hue={item.hue}
                          cardId={item.cardId}
                          centeringOffsetX={item.centeringOffsetX}
                          centeringOffsetY={item.centeringOffsetY}
                          small
                          animated={false}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink-900 truncate">
                            {s.cardName}
                            {item?.rarity ? (
                              <span className="text-ink-500 text-xs font-normal"> • {item.rarity}</span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-ink-500 mt-0.5">
                            <span className="text-feebay-600 font-semibold">@ {s.company}</span>
                            <span className="text-ink-300 mx-1.5">•</span>
                            Paid {money(s.cost)}
                            {s.shippingFee ? (
                              <span className="text-ink-400"> (incl {money(s.shippingFee)} ship)</span>
                            ) : null}
                          </div>
                        </div>
                        {ready ? (
                          <button
                            onClick={() => revealGrading(s.id)}
                            className="shrink-0 rounded-md bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-ebayYellow-600 shadow-sm"
                          >
                            Reveal
                          </button>
                        ) : (
                          <span className="shrink-0 text-ink-500 text-xs tabular-nums">
                            {Math.ceil(remaining / 1000)}s
                          </span>
                        )}
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            ready ? 'bg-ebayGreen-500' : 'bg-feebay-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Recently graded — before / after with grader notes */}
      {gradingHistory.length > 0 && (
        <div className="rounded-lg border border-line bg-white shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Recently graded</div>
            <div className="text-[11px] text-ink-500">
              Last {Math.min(40, gradingHistory.length)} back from grading
            </div>
          </div>
          <ul className="divide-y divide-lineSoft">
            {gradingHistory.map((h) => {
              const net = h.gradedValue - h.rawValue - h.cost;
              return (
                <li key={h.id} className="flex items-center gap-3 py-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CardArt
                      name={h.cardName}
                      rarity={h.rarity}
                      hue={h.hue}
                      cardId={h.cardId}
                      centeringOffsetX={h.centeringOffsetX}
                      centeringOffsetY={h.centeringOffsetY}
                      small
                      animated={false}
                    />
                    <span className="text-ink-400 font-black text-sm">→</span>
                    <CardArt
                      name={h.cardName}
                      rarity={h.rarity}
                      hue={h.hue}
                      cardId={h.cardId}
                      grade={h.grade}
                      gradingCompany={h.gradingCompany}
                      centeringOffsetX={h.centeringOffsetX}
                      centeringOffsetY={h.centeringOffsetY}
                      small
                      animated={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink-900 truncate">{h.cardName}</div>
                    <div className="text-[11px] text-ink-500">
                      <span className="font-semibold text-ink-700">{h.gradingCompany}</span>{' '}
                      {h.gradeLabel}
                    </div>
                    <div className="text-[11px] italic text-ink-500 mt-0.5 leading-snug">
                      &ldquo;{h.graderNote}&rdquo;
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-ink-500">
                      {money(h.rawValue)} <span className="text-ink-300">→</span>{' '}
                      <span className="font-bold text-ink-900">{money(h.gradedValue)}</span>
                    </div>
                    <div
                      className={`text-[11px] font-bold ${
                        net >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'
                      }`}
                    >
                      {net >= 0 ? '+' : ''}{money(net)} net
                    </div>
                  </div>
                  <div className="text-[11px] text-ink-400 shrink-0 w-14 text-right">
                    {fmtRelative(h.gradedAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Grade history</div>
          {Object.keys(stats.gradesReceived).length > 0 && (
            <div className="text-[11px] text-ink-500">
              {Object.values(stats.gradesReceived).reduce((s, n) => s + n, 0)} graded · best{' '}
              <span className="text-ebayYellow-700 font-bold">
                {Math.max(...Object.keys(stats.gradesReceived).map(Number))
                  .toFixed(1)
                  .replace('.0', '')}
              </span>
            </div>
          )}
        </div>
        {Object.keys(stats.gradesReceived).length === 0 ? (
          <div className="text-sm text-ink-500">No grades received yet. Send your first card.</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(stats.gradesReceived)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([g, count]) => {
                const num = Number(g);
                let styles =
                  'border-line bg-paper [&_.label]:text-ink-500 [&_.count]:text-ink-900';
                if (num >= 10) {
                  styles =
                    'border-ebayYellow-500 bg-gradient-to-br from-ebayYellow-500/25 to-ebayYellow-500/5 [&_.label]:text-ebayYellow-700 [&_.count]:text-ink-900';
                } else if (num >= 9) {
                  styles =
                    'border-ebayGreen-500/60 bg-ebayGreen-500/10 [&_.label]:text-ebayGreen-700 [&_.count]:text-ink-900';
                } else if (num >= 7) {
                  styles =
                    'border-feebay-500/40 bg-feebay-50 [&_.label]:text-feebay-700 [&_.count]:text-ink-900';
                } else if (num >= 5) {
                  styles =
                    'border-line bg-paper [&_.label]:text-ink-500 [&_.count]:text-ink-800';
                } else {
                  styles =
                    'border-ebayRed-500/40 bg-ebayRed-500/5 [&_.label]:text-ebayRed-600 [&_.count]:text-ink-800';
                }
                return (
                  <div
                    key={g}
                    className={`rounded-md px-3 py-2 border ${styles} min-w-[68px] flex flex-col items-center`}
                  >
                    <div className="label text-[10px] uppercase tracking-widest font-bold">
                      Grade {g}
                    </div>
                    <div className="count font-black text-lg leading-none mt-0.5">×{count}</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <GradingRevealModal />
      <BulkGradeRevealModal />
    </div>
  );
}

function fmtRelative(t: number): string {
  const sec = Math.max(0, (Date.now() - t) / 1000);
  if (sec < 60) return `${Math.floor(sec)}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function Stat({ label, value, accent = 'text-ink-900' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md bg-paper border border-line px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`font-bold ${accent}`}>{value}</div>
    </div>
  );
}
