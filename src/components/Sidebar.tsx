import { useState } from 'react';
import type { Route } from '../App';
import { useGameStore, occupiedSlots } from '../store/useGameStore';
import { isMuted, setMuted, SFX } from '../game/audio';
import { Icon, type IconName } from './Icon';
import { NotificationStack } from './NotificationStack';

type NavEntry = {
  id: Route;
  label: string;
  icon: IconName;
  lock?: (s: ReturnType<typeof useGameStore.getState>) => string | null;
};

type NavGroup = { id: string; title: string; color: string; entries: NavEntry[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'home',
    title: 'Home',
    color: 'text-feebay-500',
    entries: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    id: 'browse',
    title: 'Browse',
    color: 'text-ebayYellow-600',
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
    color: 'text-ebayGreen-600',
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
    color: 'text-ebayRed-500',
    entries: [
      { id: 'stats', label: 'Stats', icon: 'chart-up' },
      { id: 'achievements', label: 'Achievements', icon: 'trophy' },
    ],
  },
  {
    id: 'shop',
    title: 'Shop',
    color: 'text-ebayYellow-700',
    entries: [{ id: 'upgrades', label: 'Upgrades', icon: 'upgrades' }],
  },
];

type Props = { route: Route; setRoute: (r: Route) => void };

export function Sidebar({ route, setRoute }: Props) {
  const state = useGameStore();
  const auctionsCount = state.auctions.filter((a) => !a.resolved).length;
  const pendingGrades = state.gradingSubmissions.length;
  const inventoryCount = occupiedSlots(state);
  const inventoryMax = state.inventorySlots();
  const storefrontCount = state.playerListings.length;
  const achievementsUnlocked = state.achievementsUnlocked.length;
  const unclaimedAchievements = state.achievementsUnlocked.filter(
    (id) => !state.achievementsClaimed.includes(id),
  ).length;
  const [muted, setMutedState] = useState(isMuted());
  const [lockedOpen, setLockedOpen] = useState(false);
  const [bouncingId, setBouncingId] = useState<Route | null>(null);

  function navTo(id: Route) {
    SFX.click();
    setRoute(id);
    setBouncingId(id);
    window.setTimeout(
      () => setBouncingId((cur) => (cur === id ? null : cur)),
      600,
    );
  }

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
    if (id === 'inventory' && inventoryCount > 0) return `${inventoryCount}/${inventoryMax}`;
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
              <div
                className={`px-3 mb-1 text-[10px] uppercase tracking-[0.18em] font-bold ${g.color}`}
              >
                {g.title}
              </div>
              <div className="space-y-0.5">
                {g.entries.map((n) => {
                  const active = n.id === route;
                  const b = badge(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => navTo(n.id)}
                      className={`group w-full flex items-center gap-3 pl-3 pr-2 py-2 rounded-md text-sm transition relative ${
                        active
                          ? 'bg-feebay-50 text-feebay-700 font-semibold'
                          : 'text-ink-700 hover:bg-ink-100'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-feebay-500" />
                      )}
                      <span
                        className={`inline-flex ${bouncingId === n.id ? 'nav-icon-bounce' : ''}`}
                        style={{ transformOrigin: '50% 60%' }}
                      >
                        <Icon
                          name={n.icon}
                          size={17}
                          className={active ? 'text-feebay-600' : 'text-ink-500 group-hover:text-ink-700'}
                        />
                      </span>
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

      <NotificationStack />

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
      <div className="px-3 py-2 border-t border-line">
        <button
          onClick={() => {
            SFX.click();
            window.open('https://discord.gg/8FPP5wqRea', '_blank');
          }}
          className="discord-btn w-full flex items-center justify-center gap-2 rounded px-2.5 py-1.5 text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752c4] transition"
        >
          <span className="discord-icon inline-flex">
            <Icon name="discord" size={15} />
          </span>
          <span>
            {'Join our Discord'.split('').map((ch, i) => (
              <span
                key={i}
                className="discord-letter inline-block whitespace-pre"
                style={{ animationDelay: `${i * 0.045}s` }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </span>
        </button>
        <button
          onClick={() => {
            SFX.click();
            window.open('https://buymeacoffee.com/laophy', '_blank');
          }}
          className="coffee-btn mt-2 w-full flex items-center justify-center gap-2 rounded px-2.5 py-1.5 text-xs font-bold text-ink-900 bg-[#FFDD00] hover:bg-[#f0ce00] transition"
        >
          <span className="coffee-icon inline-flex">
            <Icon name="coffee" size={15} />
          </span>
          <span>
            {'Buy me a coffee'.split('').map((ch, i) => (
              <span
                key={i}
                className="coffee-letter inline-block whitespace-pre"
                style={{ animationDelay: `${i * 0.045}s` }}
              >
                {ch}
              </span>
            ))}
          </span>
        </button>
        <div className="mt-2 text-[10px] text-ink-400 text-center">
          Fictional brands only. No real cards harmed.
        </div>
      </div>

      <style>{`
        @keyframes navIconBounce {
          0%   { transform: translateY(0)    scale(1, 1); }
          25%  { transform: translateY(-7px) scale(0.95, 1.12); }
          50%  { transform: translateY(2px)  scale(1.15, 0.85); }
          70%  { transform: translateY(-2px) scale(0.98, 1.04); }
          100% { transform: translateY(0)    scale(1, 1); }
        }
        .nav-icon-bounce {
          animation: navIconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1;
          will-change: transform;
        }

        /* Discord button hover — logo shakes, letters jump in a wave. */
        @keyframes discordLetterJump {
          0%, 55%, 100% { transform: translateY(0); }
          28%           { transform: translateY(-5px); }
        }
        @keyframes discordIconShake {
          0%, 100% { transform: rotate(0deg); }
          20%      { transform: rotate(-15deg); }
          45%      { transform: rotate(12deg); }
          70%      { transform: rotate(-8deg); }
          88%      { transform: rotate(4deg); }
        }
        .discord-btn:hover .discord-letter {
          animation: discordLetterJump 0.7s ease-in-out infinite;
        }
        .discord-btn:hover .discord-icon {
          animation: discordIconShake 0.5s ease-in-out infinite;
        }

        /* Buy Me a Coffee button hover — cup tips for a sip, letters jump. */
        @keyframes coffeeCupTip {
          0%, 100% { transform: rotate(0deg); }
          30%      { transform: rotate(-22deg); }
          58%      { transform: rotate(9deg); }
          80%      { transform: rotate(-4deg); }
        }
        .coffee-icon {
          transform-origin: 55% 88%;
        }
        .coffee-btn:hover .coffee-icon {
          animation: coffeeCupTip 0.8s ease-in-out infinite;
        }
        .coffee-btn:hover .coffee-letter {
          animation: discordLetterJump 0.7s ease-in-out infinite;
        }
      `}</style>
    </aside>
  );
}
