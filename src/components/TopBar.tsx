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

const LOGO_LETTERS: { char: string; color: string }[] = [
  { char: 'F', color: 'text-ebayRed-500' },
  { char: 'e', color: 'text-feebay-500' },
  { char: 'e', color: 'text-ebayYellow-500' },
  { char: 'B', color: 'text-ebayGreen-500' },
  { char: 'a', color: 'text-ebayRed-500' },
  { char: 'y', color: 'text-feebay-500' },
];

type Props = { route: Route; bounceLogo?: boolean };

export function TopBar({ route, bounceLogo }: Props) {
  const [bouncedIn, setBouncedIn] = useState(false);
  useEffect(() => {
    if (!bounceLogo || bouncedIn) return;
    // total bounce duration = animation (1.3s) + last letter delay (5 * 110ms) + small buffer
    const t = setTimeout(() => setBouncedIn(true), 1300 + 5 * 110 + 100);
    return () => clearTimeout(t);
  }, [bounceLogo, bouncedIn]);
  const playInitial = bounceLogo && !bouncedIn;
  const [hopping, setHopping] = useState<Record<number, boolean>>({});
  const startHop = (i: number) => {
    setHopping((h) => (h[i] ? h : { ...h, [i]: true }));
  };
  const endHop = (i: number) => {
    setHopping((h) => {
      if (!h[i]) return h;
      const next = { ...h };
      delete next[i];
      return next;
    });
  };
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);
  const inventory = useGameStore((s) => s.inventory);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgradesPurchased = useGameStore((s) => s.upgradesPurchased);
  const storefrontBalance = useGameStore((s) => s.storefrontBalance);
  const resetGame = useGameStore((s) => s.resetGame);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum +
      (i.status === 'grading'
        ? i.purchasePrice
        : calculateCurrentValue(i, trends, noise, convention, vaultStableFor({ upgradesPurchased }))),
    0,
  );
  const netWorth = cash + storefrontBalance + inventoryValue;

  return (
    <header className="bg-white border-b border-line">
      <div className="flex items-center gap-3 min-h-16 px-4 py-2 flex-wrap">
        {/* Logo — eBay-style multi-color letters */}
        <div className="flex items-baseline shrink-0 select-none">
          <span className="text-2xl xl:text-3xl font-black tracking-tight leading-none">
            {LOGO_LETTERS.map((l, i) => {
              const hopActive = !!hopping[i];
              return (
                <span
                  key={i}
                  className={`nav-letter inline-block cursor-pointer ${l.color} ${
                    playInitial ? 'nav-bounce' : ''
                  } ${hopActive ? 'nav-letter-hop' : ''}`}
                  style={{
                    animationDelay: playInitial ? `${i * 110}ms` : undefined,
                    transformOrigin: '50% 100%',
                  }}
                  onMouseEnter={() => !playInitial && startHop(i)}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'letterHop') endHop(i);
                  }}
                >
                  {l.char}
                </span>
              );
            })}
          </span>
          <span className="hidden 2xl:inline ml-2 text-xs text-ink-500 font-medium tracking-wide">
            simulator
          </span>
        </div>
        <style>{`
          @keyframes navBounce {
            0%   { transform: translateY(0)     scale(1, 1); }
            22%  { transform: translateY(-22px) scale(0.95, 1.1); }
            44%  { transform: translateY(0)     scale(1.15, 0.82); }
            58%  { transform: translateY(-7px)  scale(0.98, 1.04); }
            72%  { transform: translateY(0)     scale(1.04, 0.96); }
            100% { transform: translateY(0)     scale(1, 1); }
          }
          .nav-bounce {
            animation: navBounce 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) 1 both;
            will-change: transform;
          }
          @keyframes letterHop {
            0%   { transform: translateY(0)     scale(1, 1); }
            30%  { transform: translateY(-12px) scale(0.88, 1.18); }
            55%  { transform: translateY(0)     scale(1.14, 0.86); }
            75%  { transform: translateY(-4px)  scale(0.97, 1.05); }
            100% { transform: translateY(0)     scale(1, 1); }
          }
          .nav-letter-hop {
            animation: letterHop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 1 both;
            will-change: transform;
          }
        `}</style>

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

const FAKE_RESULT_LINES: { icon: 'search' | 'sparkle' | 'bolt' | 'shield' | 'box' | 'wallet'; text: (q: string) => string }[] = [
  { icon: 'search', text: (q) => `No matches for "${q}". (Search isn't actually wired up.)` },
  { icon: 'sparkle', text: () => `Did you mean: clicking the Marketplace tab like a normal person?` },
  { icon: 'bolt', text: () => `FeeBay search is currently powered by a parrot. He says nothing.` },
  { icon: 'wallet', text: () => `Found 1 result. It's a $0.30 fake fee for searching. Pay it.` },
  { icon: 'shield', text: () => `404: Search engine ghosted us. Have you tried turning it off and on?` },
  { icon: 'sparkle', text: (q) => `${q}? In this economy? Bold of you to ask.` },
  { icon: 'box', text: () => `Suggested: just browse. The dev was too lazy to wire this up.` },
  { icon: 'search', text: () => `Our database is the empty array. Nothing inside. Sorry.` },
  { icon: 'bolt', text: (q) => `"${q}" sold on PackTok for $9,001. (lying)` },
  { icon: 'sparkle', text: () => `Beep boop. The search index is currently napping. Try later — wait, no, it'll still be napping.` },
];

function pickFakeResults(q: string): typeof FAKE_RESULT_LINES {
  // Deterministic by query so the same string gives the same jokes.
  let h = 0;
  for (let i = 0; i < q.length; i++) h = (h * 31 + q.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const shuffled = [...FAKE_RESULT_LINES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed >> (i % 16)) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 4);
}

function SearchBar() {
  const setActiveSource = useGameStore((s) => s.setMarketplaceActiveSource);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showDropdown = focused && query.trim().length > 0;
  const results = showDropdown ? pickFakeResults(query.trim()) : [];

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-stretch h-10 rounded-md border-2 border-ink-900 overflow-hidden shadow-sm bg-white">
        <span className="px-3 flex items-center text-ink-500 bg-white">
          <Icon name="search" size={16} />
        </span>
        <input
          type="text"
          placeholder="Search FeeBay — cards, sellers, sets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setActiveSource('all');
              setQuery('');
              setFocused(false);
            } else if (e.key === 'Escape') {
              setFocused(false);
            }
          }}
          className="flex-1 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none px-1"
        />
        <button
          onClick={() => {
            setActiveSource('all');
            setQuery('');
            setFocused(false);
          }}
          className="px-6 bg-feebay-500 hover:bg-feebay-600 text-white text-sm font-bold tracking-wide"
        >
          Search
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[150] origin-top search-drop">
          <div className="rounded-md border border-line bg-white shadow-cardHover overflow-hidden">
            <div className="px-3 py-2 border-b border-lineSoft flex items-center gap-2 bg-paper">
              <Icon name="search" size={12} className="text-ink-400" />
              <span className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                Search results
              </span>
              <span className="ml-auto text-[10px] text-ink-400 italic">
                (this search is fake — don't tell anyone)
              </span>
            </div>
            <ul>
              {results.map((r, i) => (
                <li
                  key={i}
                  onClick={() => setFocused(false)}
                  className="flex items-start gap-2.5 px-3 py-2.5 text-sm text-ink-800 hover:bg-feebay-50 cursor-pointer border-b border-lineSoft last:border-b-0 search-drop-row"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="w-7 h-7 rounded-md bg-ink-100 text-ink-500 flex items-center justify-center shrink-0">
                    <Icon name={r.icon} size={13} />
                  </span>
                  <span className="leading-snug">{r.text(query.trim())}</span>
                </li>
              ))}
            </ul>
            <div className="px-3 py-2 border-t border-line bg-paper flex items-center justify-between">
              <span className="text-[11px] text-ink-500 italic">
                0 actual results in 0.001s
              </span>
              <button
                onClick={() => {
                  setQuery('');
                  setFocused(false);
                }}
                className="text-[11px] text-feebay-600 hover:text-feebay-700 font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
          <style>{`
            @keyframes searchDrop {
              0%   { opacity: 0; transform: translateY(-6px) scaleY(0.96); }
              100% { opacity: 1; transform: translateY(0) scaleY(1); }
            }
            @keyframes rowSlide {
              0%   { opacity: 0; transform: translateY(-4px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .search-drop {
              animation: searchDrop 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .search-drop-row {
              animation: rowSlide 0.22s ease-out backwards;
            }
          `}</style>
        </div>
      )}
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
