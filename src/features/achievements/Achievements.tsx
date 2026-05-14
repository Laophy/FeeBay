import { useGameStore } from '../../store/useGameStore';
import { ACHIEVEMENTS } from '../../data/achievements';
import { Icon, type IconName } from '../../components/Icon';

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  mythic: 'Mythic',
};

const TIER_STYLES: Record<
  string,
  { ring: string; bg: string; text: string; iconBg: string; tag: string }
> = {
  bronze: {
    ring: 'border-amber-700/50',
    bg: 'bg-amber-900/15',
    text: 'text-amber-200',
    iconBg: 'bg-amber-900/40 text-amber-300',
    tag: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  },
  silver: {
    ring: 'border-slate-400/40',
    bg: 'bg-slate-700/15',
    text: 'text-slate-200',
    iconBg: 'bg-slate-700/40 text-slate-200',
    tag: 'bg-slate-700/40 text-slate-100 border-slate-500/50',
  },
  gold: {
    ring: 'border-amber-400/60',
    bg: 'bg-amber-900/25',
    text: 'text-amber-100',
    iconBg: 'bg-amber-700/50 text-amber-200',
    tag: 'bg-amber-700/40 text-amber-200 border-amber-400/60',
  },
  mythic: {
    ring: 'border-pink-500/60',
    bg: 'bg-gradient-to-br from-pink-900/25 to-purple-900/25',
    text: 'text-pink-100',
    iconBg: 'bg-pink-700/50 text-pink-200',
    tag: 'bg-pink-700/40 text-pink-200 border-pink-400/60',
  },
};

export function Achievements() {
  const unlocked = useGameStore((s) => s.achievementsUnlocked);
  const claimed = useGameStore((s) => s.achievementsClaimed);
  const claim = useGameStore((s) => s.claimAchievement);
  const claimAll = useGameStore((s) => s.claimAllAchievements);

  const unlockedSet = new Set(unlocked);
  const claimedSet = new Set(claimed);

  const unclaimedIds = unlocked.filter((id) => !claimedSet.has(id));
  const unclaimedReward = unclaimedIds.reduce((sum, id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    return sum + (a?.cashReward ?? 0);
  }, 0);

  const byTier = (tier: string) =>
    ACHIEVEMENTS.filter((a) => a.tier === tier);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-slate-400 text-sm">
            {unlocked.length} / {ACHIEVEMENTS.length} unlocked
            {unclaimedIds.length > 0 && (
              <>
                {' '}• <span className="text-emerald-300 font-semibold">${unclaimedReward.toFixed(2)} unclaimed</span>
              </>
            )}
          </p>
        </div>
        {unclaimedIds.length > 0 && (
          <button
            onClick={claimAll}
            className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Icon name="cash" size={16} />
            Claim all (${unclaimedReward.toFixed(2)})
          </button>
        )}
      </div>

      {(['bronze', 'silver', 'gold', 'mythic'] as const).map((tier) => {
        const tierAchievements = byTier(tier);
        if (tierAchievements.length === 0) return null;
        const tierOwned = tierAchievements.filter((a) => unlockedSet.has(a.id)).length;
        return (
          <div key={tier}>
            <div className="flex items-center justify-between mb-3">
              <div className={`text-sm uppercase tracking-widest font-bold ${TIER_STYLES[tier].text}`}>
                {TIER_LABEL[tier]}
              </div>
              <div className="text-xs text-slate-500">
                {tierOwned} / {tierAchievements.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {tierAchievements.map((a) => {
                const isUnlocked = unlockedSet.has(a.id);
                const isClaimed = claimedSet.has(a.id);
                const t = TIER_STYLES[tier];
                return (
                  <div
                    key={a.id}
                    className={`rounded-lg border p-4 flex flex-col gap-2 ${
                      isUnlocked
                        ? `${t.ring} ${t.bg}`
                        : 'border-slate-800 bg-slate-900/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 rounded-md p-2 ${
                          isUnlocked ? t.iconBg : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon name={isUnlocked ? (a.icon as IconName) : 'lock'} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold ${
                            isUnlocked ? t.text : 'text-slate-300'
                          }`}
                        >
                          {a.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{a.description}</div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] uppercase tracking-widest font-bold border rounded px-1.5 py-0.5 ${t.tag}`}
                      >
                        {TIER_LABEL[tier]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-slate-400">
                        Reward:{' '}
                        <span className="text-emerald-300 font-semibold">${a.cashReward}</span>
                      </div>
                      {!isUnlocked ? (
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          Locked
                        </span>
                      ) : isClaimed ? (
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
                          <Icon name="check" size={12} /> Claimed
                        </span>
                      ) : (
                        <button
                          onClick={() => claim(a.id)}
                          className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-semibold animate-pulse"
                        >
                          Claim ${a.cashReward}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
