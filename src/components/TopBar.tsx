import { useEffect, useRef, useState } from 'react';
import { dayPhase, useGameStore } from '../store/useGameStore';
import { calculateCurrentValue } from '../game/economyEngine';
import { vaultStableFor } from '../store/useGameStore';
import { HelpButton } from './HelpButton';
import { Icon } from './Icon';
import type { Route } from '../App';

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

type Props = { route: Route };

export function TopBar({ route }: Props) {
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);
  const inventory = useGameStore((s) => s.inventory);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgradesPurchased = useGameStore((s) => s.upgradesPurchased);
  const resetGame = useGameStore((s) => s.resetGame);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum +
      (i.status === 'grading'
        ? i.purchasePrice
        : calculateCurrentValue(i, trends, noise, convention, vaultStableFor({ upgradesPurchased }))),
    0,
  );
  const netWorth = cash + inventoryValue;

  return (
    <header className="bg-white border-b border-line">
      <div className="flex items-center gap-3 min-h-16 px-4 py-2 flex-wrap">
        {/* Logo — eBay-style multi-color letters */}
        <div className="flex items-baseline shrink-0 select-none">
          <span className="text-2xl xl:text-3xl font-black tracking-tight leading-none">
            <span className="text-ebayRed-500">F</span>
            <span className="text-feebay-500">e</span>
            <span className="text-ebayYellow-500">e</span>
            <span className="text-ebayGreen-500">B</span>
            <span className="text-ebayRed-500">a</span>
            <span className="text-feebay-500">y</span>
          </span>
          <span className="hidden 2xl:inline ml-2 text-xs text-ink-500 font-medium tracking-wide">
            simulator
          </span>
        </div>

        {/* Search — flex-1 with hard min-width so it can shrink but stays usable */}
        <div className="order-3 lg:order-2 basis-full lg:basis-auto lg:flex-1 lg:max-w-3xl min-w-0">
          <SearchBar />
        </div>

        {/* Action cluster — wraps below logo when very narrow */}
        <div className="order-2 lg:order-3 flex items-center gap-2 ml-auto flex-wrap shrink-0">
          <CashStat cash={cash} />
          <ChipStat label="Net" value={fmt(netWorth)} accent="text-ebayGreen-600" hide="md" />
          <ChipStat label="Rep" value={`${reputation}`} accent="text-feebay-600" hide="xl" />
          <DayClock />
          <ConventionBadge />
          <span className="hidden md:block w-px h-7 bg-line mx-1" />
          <HelpButton route={route} />
          <button
            onClick={() => {
              if (window.confirm('Reset progress and start over?')) resetGame();
            }}
            className="px-2 h-9 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-100 flex items-center gap-1"
            title="Reset save"
          >
            <Icon name="reset" size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  const setActiveSource = useGameStore((s) => s.setMarketplaceActiveSource);
  return (
    <div className="flex items-stretch h-10 rounded-md border-2 border-ink-900 overflow-hidden shadow-sm">
      <span className="px-3 flex items-center text-ink-500 bg-white">
        <Icon name="search" size={16} />
      </span>
      <input
        type="text"
        placeholder="Search FeeBay — cards, sellers, sets..."
        className="flex-1 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none px-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') setActiveSource('all');
        }}
      />
      <button
        onClick={() => setActiveSource('all')}
        className="px-6 bg-feebay-500 hover:bg-feebay-600 text-white text-sm font-bold tracking-wide"
      >
        Search
      </button>
    </div>
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
    <div className="relative flex items-center gap-2 px-3 h-9 rounded-md bg-ebayGreen-500/10 border border-ebayGreen-500/40">
      <Icon name="cash" size={14} className="text-ebayGreen-600" />
      <span className="text-sm font-bold text-ebayGreen-700">{fmt(cash)}</span>
      {pop && (
        <span
          key={pop.id}
          className={`pointer-events-none absolute -top-1 left-8 text-xs font-bold animate-cashPop ${
            pop.delta >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'
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

function ChipStat({
  label,
  value,
  accent,
  hide = 'md',
}: {
  label: string;
  value: string;
  accent: string;
  hide?: 'md' | 'lg' | 'xl' | '2xl';
}) {
  const hideCls: Record<string, string> = {
    md: 'hidden md:flex',
    lg: 'hidden lg:flex',
    xl: 'hidden xl:flex',
    '2xl': 'hidden 2xl:flex',
  };
  return (
    <div
      className={`${hideCls[hide]} items-center gap-1.5 px-2.5 h-9 rounded-md bg-ink-100 border border-line`}
    >
      <span className="text-[9px] uppercase tracking-widest text-ink-500 font-semibold">{label}</span>
      <span className={`text-sm font-bold ${accent}`}>{value}</span>
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
  const phase = dayPhase({ dayStartedAt } as never, now);
  const label = phase.phase[0].toUpperCase() + phase.phase.slice(1);
  const accentByPhase: Record<string, string> = {
    morning: 'text-feebay-600',
    afternoon: 'text-ebayYellow-600',
    evening: 'text-ebayRed-500',
    night: 'text-feebay-700',
  };
  return (
    <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 h-9 rounded-md bg-ink-100 border border-line">
      <span className="text-[9px] uppercase tracking-widest text-ink-500 font-semibold">Day</span>
      <span className={`text-sm font-bold ${accentByPhase[phase.phase]}`}>
        {day} · {label}
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
    <div className="hidden xl:flex items-center gap-1.5 px-2.5 h-9 rounded-md border-2 border-ebayYellow-500 bg-ebayYellow-500/15 text-ebayYellow-700 animate-pulse">
      <Icon name="sparkle" size={12} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Event</span>
      <span className="text-sm font-bold">{convention.name}</span>
      <span className="text-[10px] font-mono">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
