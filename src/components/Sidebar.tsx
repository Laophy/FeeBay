import { useState } from 'react';
import type { Route } from '../App';
import { useGameStore } from '../store/useGameStore';
import { isMuted, setMuted, SFX } from '../game/audio';
import { Icon, type IconName } from './Icon';

type NavEntry = {
  id: Route;
  label: string;
  icon: IconName;
  /** Lock evaluator. Return null if unlocked, or a hint string if locked. */
  lock?: (s: ReturnType<typeof useGameStore.getState>) => string | null;
};

const NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'marketplace', label: 'Marketplace', icon: 'cart' },
  { id: 'inventory', label: 'Inventory', icon: 'inventory' },
  {
    id: 'storefront',
    label: 'Storefront',
    icon: 'tag',
    lock: (s) =>
      s.stats.totalBought === 0 && s.playerListings.length === 0
        ? 'Buy your first card to unlock'
        : null,
  },
  {
    id: 'grading',
    label: 'Grading',
    icon: 'shield',
    lock: (s) => {
      const owns =
        s.upgradesPurchased.includes('grading_membership') ||
        s.upgradesPurchased.includes('bucket_membership') ||
        s.upgradesPurchased.includes('pza_membership');
      return owns ? null : 'Unlock a grading membership in Upgrades';
    },
  },
  { id: 'trends', label: 'Market Trends', icon: 'trends' },
  {
    id: 'auctions',
    label: 'BidGoblin',
    icon: 'gavel',
    lock: (s) =>
      s.upgradesPurchased.includes('auction_paddle')
        ? null
        : 'Buy the BidGoblin Paddle upgrade',
  },
  { id: 'collection', label: 'Collection', icon: 'box' },
  { id: 'stats', label: 'Stats', icon: 'chart-up' },
  { id: 'upgrades', label: 'Upgrades', icon: 'upgrades' },
  { id: 'achievements', label: 'Achievements', icon: 'trophy' },
];

type Props = {
  route: Route;
  setRoute: (r: Route) => void;
};

export function Sidebar({ route, setRoute }: Props) {
  const state = useGameStore();
  const auctionsCount = state.auctions.filter((a) => !a.resolved).length;
  const pendingGrades = state.gradingSubmissions.length;
  const inventoryCount = state.inventory.length;
  const storefrontCount = state.playerListings.length;
  const achievementsUnlocked = state.achievementsUnlocked.length;
  const unclaimedAchievements = state.achievementsUnlocked.filter(
    (id) => !state.achievementsClaimed.includes(id),
  ).length;
  const [muted, setMutedState] = useState(isMuted());
  const [lockedOpen, setLockedOpen] = useState(false);

  const visibleNav = NAV.map((n) => ({
    ...n,
    lockReason: n.lock ? n.lock(state) : null,
  }));
  const visible = visibleNav.filter((n) => n.lockReason == null);
  const lockedEntries = visibleNav.filter((n) => n.lockReason != null);

  const badge = (id: Route): string | null => {
    if (id === 'inventory' && inventoryCount > 0) return `${inventoryCount}`;
    if (id === 'storefront' && storefrontCount > 0) return `${storefrontCount}`;
    if (id === 'grading' && pendingGrades > 0) return `${pendingGrades}`;
    if (id === 'auctions' && auctionsCount > 0) return `${auctionsCount}`;
    if (id === 'achievements') {
      if (unclaimedAchievements > 0) return `${unclaimedAchievements}`;
      if (achievementsUnlocked > 0) return `${achievementsUnlocked}`;
    }
    return null;
  };

  return (
    <aside className="flex w-60 flex-col border-r border-slate-800 bg-slate-900 select-none">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-feebay-400">Fee</span>
          <span className="text-feebay-200">Bay</span>
          <span className="text-slate-400 text-xs ml-2 align-middle">Simulator</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Online Reseller Sim v0.4
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {visible.map((n) => {
          const active = n.id === route;
          const b = badge(n.id);
          const pulse =
            (n.id === 'achievements' && unclaimedAchievements > 0) ||
            (n.id === 'grading' && pendingGrades > 0);
          return (
            <button
              key={n.id}
              onClick={() => {
                SFX.click();
                setRoute(n.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                active
                  ? 'bg-feebay-700/40 text-feebay-100 border border-feebay-700/60'
                  : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Icon name={n.icon} size={18} className={active ? 'text-feebay-200' : 'text-slate-400'} />
              <span className="flex-1 text-left">{n.label}</span>
              {b && (
                <span
                  className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                    n.id === 'achievements' && unclaimedAchievements > 0
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : 'bg-feebay-600 text-white'
                  } ${pulse ? 'animate-pulse' : ''}`}
                >
                  {b}
                </span>
              )}
            </button>
          );
        })}

        {lockedEntries.length > 0 && (
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              onClick={() => setLockedOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-dashed border-slate-700"
            >
              <Icon name="lock" size={14} />
              <span className="flex-1 text-left">
                {lockedEntries.length} more to unlock
              </span>
              <Icon name={lockedOpen ? 'minus' : 'plus'} size={12} />
            </button>
            {lockedOpen && (
              <ul className="mt-2 space-y-1 px-3 py-2 rounded-md bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
                {lockedEntries.map((n) => (
                  <li key={n.id} className="flex items-start gap-2">
                    <Icon name={n.icon} size={12} className="mt-0.5 shrink-0 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-300">{n.label}</div>
                      <div className="text-slate-500">{n.lockReason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </nav>

      <div className="px-3 py-2 border-t border-slate-800">
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
            if (!next) SFX.click();
          }}
          className="w-full flex items-center gap-2 rounded px-3 py-1.5 text-xs border border-slate-700 hover:border-slate-500 text-slate-300"
        >
          <Icon name={muted ? 'sound-off' : 'sound-on'} size={14} />
          <span className="flex-1 text-left">{muted ? 'Audio off' : 'Audio on'}</span>
          <span className="text-slate-500">toggle</span>
        </button>
      </div>
      <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-800">
        Fictional brands only. No real cards harmed.
      </div>
    </aside>
  );
}
