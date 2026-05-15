import { useState } from 'react';
import type { Route } from '../App';
import { useGameStore } from '../store/useGameStore';
import { isMuted, setMuted, SFX } from '../game/audio';
import { Icon, type IconName } from './Icon';

type NavEntry = {
  id: Route;
  label: string;
  icon: IconName;
  lock?: (s: ReturnType<typeof useGameStore.getState>) => string | null;
};

type NavGroup = { id: string; title: string; entries: NavEntry[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'home',
    title: 'Home',
    entries: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    id: 'browse',
    title: 'Browse',
    entries: [
      { id: 'marketplace', label: 'Marketplace', icon: 'cart' },
      {
        id: 'auctions',
        label: 'BidGoblin',
        icon: 'gavel',
        lock: (s) =>
          s.upgradesPurchased.includes('auction_paddle')
            ? null
            : 'Buy the BidGoblin Paddle upgrade',
      },
      { id: 'trends', label: 'Market Trends', icon: 'trends' },
    ],
  },
  {
    id: 'store',
    title: 'My Store',
    entries: [
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
      { id: 'collection', label: 'Collection', icon: 'box' },
    ],
  },
  {
    id: 'progress',
    title: 'Progress',
    entries: [
      { id: 'stats', label: 'Stats', icon: 'chart-up' },
      { id: 'achievements', label: 'Achievements', icon: 'trophy' },
    ],
  },
  {
    id: 'shop',
    title: 'Shop',
    entries: [{ id: 'upgrades', label: 'Upgrades', icon: 'upgrades' }],
  },
];

type Props = { route: Route; setRoute: (r: Route) => void };

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

  const annotateNav = NAV_GROUPS.map((g) => ({
    ...g,
    entries: g.entries.map((e) => ({
      ...e,
      lockReason: e.lock ? e.lock(state) : null,
    })),
  }));
  const lockedEntries = annotateNav.flatMap((g) =>
    g.entries.filter((e) => e.lockReason != null),
  );
  const visibleGroups = annotateNav.map((g) => ({
    ...g,
    entries: g.entries.filter((e) => e.lockReason == null),
  }));

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
    <aside className="flex w-56 flex-col border-r border-line bg-white select-none">
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-4">
        {visibleGroups.map((g) =>
          g.entries.length === 0 ? null : (
            <div key={g.id}>
              <div className="px-3 mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-500 font-bold">
                {g.title}
              </div>
              <div className="space-y-0.5">
                {g.entries.map((n) => {
                  const active = n.id === route;
                  const b = badge(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        SFX.click();
                        setRoute(n.id);
                      }}
                      className={`group w-full flex items-center gap-3 pl-3 pr-2 py-2 rounded-md text-sm transition relative ${
                        active
                          ? 'bg-feebay-50 text-feebay-700 font-semibold'
                          : 'text-ink-700 hover:bg-ink-100'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-feebay-500" />
                      )}
                      <Icon
                        name={n.icon}
                        size={17}
                        className={active ? 'text-feebay-600' : 'text-ink-500 group-hover:text-ink-700'}
                      />
                      <span className="flex-1 text-left">{n.label}</span>
                      {b && (
                        <span
                          className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                            n.id === 'achievements' && unclaimedAchievements > 0
                              ? 'bg-ebayGreen-500 text-white animate-pulse'
                              : 'bg-feebay-500 text-white'
                          }`}
                        >
                          {b}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        )}

        {lockedEntries.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setLockedOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-ink-500 hover:bg-ink-100 border border-dashed border-line"
            >
              <Icon name="lock" size={13} />
              <span className="flex-1 text-left">
                {lockedEntries.length} more to unlock
              </span>
              <Icon name={lockedOpen ? 'minus' : 'plus'} size={12} />
            </button>
            {lockedOpen && (
              <ul className="mt-2 space-y-1 px-2.5 py-2 rounded-md bg-ink-100 border border-line text-[11px] text-ink-600">
                {lockedEntries.map((n) => (
                  <li key={n.id} className="flex items-start gap-2 py-0.5">
                    <Icon name={n.icon} size={12} className="mt-0.5 shrink-0 text-ink-400" />
                    <div>
                      <div className="font-semibold text-ink-700">{n.label}</div>
                      <div className="text-ink-500">{n.lockReason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </nav>

      <div className="px-3 py-2 border-t border-line">
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
            if (!next) SFX.click();
          }}
          className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs border border-line hover:border-ink-400 text-ink-700"
        >
          <Icon name={muted ? 'sound-off' : 'sound-on'} size={14} />
          <span className="flex-1 text-left">{muted ? 'Audio off' : 'Audio on'}</span>
        </button>
      </div>
      <div className="px-4 py-2 text-[10px] text-ink-400 border-t border-line">
        Fictional brands only. No real cards harmed.
      </div>
    </aside>
  );
}
