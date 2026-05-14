import { useEffect, useRef, useState } from 'react';
import { dayPhase, useGameStore } from '../store/useGameStore';
import { calculateCurrentValue } from '../game/economyEngine';
import { HelpButton } from './HelpButton';
import type { Route } from '../App';

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

export function TopBar({ route }: { route: Route }) {
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);
  const businessLevel = useGameStore((s) => s.businessLevel);
  const inventory = useGameStore((s) => s.inventory);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const resetGame = useGameStore((s) => s.resetGame);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum + (i.status === 'grading' ? i.purchasePrice : calculateCurrentValue(i, trends, noise, convention)),
    0,
  );
  const netWorth = cash + inventoryValue;

  return (
    <header className="flex items-center gap-6 border-b border-slate-800 bg-slate-900/70 px-6 py-3 backdrop-blur">
      <CashStat cash={cash} />
      <Stat label="Inventory" value={fmt(inventoryValue)} accent="text-feebay-300" />
      <Stat label="Net Worth" value={fmt(netWorth)} accent="text-amber-300" />
      <Stat label="Reputation" value={`${reputation}`} accent="text-pink-300" />
      <Stat label="Biz Lvl" value={`${businessLevel}`} accent="text-slate-200" />
      <DayClock />
      <ConventionBadge />
      <TrendBadges />
      <div className="flex-1" />
      <HelpButton route={route} />
      <button
        onClick={() => {
          if (window.confirm('Reset progress and start over?')) resetGame();
        }}
        className="text-xs text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 rounded px-3 py-1.5"
      >
        Reset
      </button>
    </header>
  );
}

function CashStat({ cash }: { cash: number }) {
  const prev = useRef(cash);
  const [pop, setPop] = useState<{ id: number; delta: number } | null>(null);
  useEffect(() => {
    const delta = +(cash - prev.current).toFixed(2);
    prev.current = cash;
    if (Math.abs(delta) < 0.01) return;
    const id = Date.now() + Math.random();
    setPop({ id, delta });
    const t = setTimeout(() => setPop((p) => (p && p.id === id ? null : p)), 1500);
    return () => clearTimeout(t);
  }, [cash]);

  return (
    <div className="relative flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">Cash</span>
      <span className="text-sm font-semibold text-emerald-400">{fmt(cash)}</span>
      {pop && (
        <span
          key={pop.id}
          className={`pointer-events-none absolute -top-3 left-12 text-xs font-bold animate-cashPop ${
            pop.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {pop.delta >= 0 ? '+' : ''}
          {pop.delta.toFixed(2)}
        </span>
      )}
      <style>{`
        @keyframes cashPop {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 0; transform: translateY(-12px); }
        }
        .animate-cashPop { animation: cashPop 1.4s ease-out forwards; }
      `}</style>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${accent}`}>{value}</span>
    </div>
  );
}

function DayClock() {
  const day = useGameStore((s) => s.day);
  const dayStartedAt = useGameStore((s) => s.dayStartedAt);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const phase = dayPhase({ dayStartedAt } as any, now);
  const label = phase.phase[0].toUpperCase() + phase.phase.slice(1);
  const accentByPhase: Record<string, string> = {
    morning: 'text-feebay-200',
    afternoon: 'text-amber-200',
    evening: 'text-orange-300',
    night: 'text-indigo-300',
  };
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">Day</span>
      <span className={`text-sm font-semibold ${accentByPhase[phase.phase]}`}>
        {day} • {label}
      </span>
    </div>
  );
}

function ConventionBadge() {
  const convention = useGameStore((s) => s.convention);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!convention) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [convention]);
  if (!convention) return null;
  const remaining = Math.max(0, convention.endsAt - now);
  const mins = Math.floor(remaining / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded border border-amber-500/60 bg-amber-900/30 text-amber-200 animate-pulse">
      <span className="text-[10px] uppercase tracking-widest text-amber-300">Event</span>
      <span className="text-sm font-semibold">{convention.name}</span>
      <span className="text-[10px] text-amber-300/80 font-mono">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

function TrendBadges() {
  const trends = useGameStore((s) => s.marketTrends);
  if (trends.length === 0) return null;
  return (
    <div className="hidden lg:flex items-center gap-1 ml-3">
      {trends.slice(0, 4).map((t, i) => (
        <span
          key={i}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
            t.direction === 'up'
              ? 'border-emerald-500/40 bg-emerald-900/30 text-emerald-200'
              : 'border-rose-500/40 bg-rose-900/30 text-rose-200'
          }`}
          title={t.label}
        >
          {t.direction === 'up' ? '▲' : '▼'} {t.tag}
        </span>
      ))}
    </div>
  );
}
